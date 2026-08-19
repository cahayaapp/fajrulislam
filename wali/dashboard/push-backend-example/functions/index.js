/*
 * CAHAYA APP — PUSH NOTIFICATION BACKEND
 *
 * Trigger:
 * 1. Chat langsung dari pengurus ke wali.
 * 2. Notifikasi admin/sistem untuk satu wali.
 * 3. Pengumuman pusat untuk seluruh wali.
 *
 * Catatan:
 * - Sesuaikan DATABASE_REGION bila lokasi RTDB berbeda.
 * - Deploy menggunakan Firebase CLI.
 */

const {
  onValueCreated
} = require(
  "firebase-functions/v2/database"
);

const {
  initializeApp
} = require(
  "firebase-admin/app"
);

const {
  getDatabase
} = require(
  "firebase-admin/database"
);

const {
  getMessaging
} = require(
  "firebase-admin/messaging"
);

initializeApp();

const DATABASE_INSTANCE =
  process.env.CAHAYA_DATABASE_INSTANCE ||
  "absensi-santri-fajrul-islam-default-rtdb";

const DATABASE_REGION =
  process.env.CAHAYA_DATABASE_REGION ||
  "us-central1";

const ALLOWED_CHAT_ROLES = new Set([
  "admin",
  "direktur",
  "wakil",
  "konselor"
]);

const KABAR_CATEGORIES = new Set([
  "halqah",
  "tahfiz",
  "program",
  "pembelajaran",
  "penindakan"
]);

function clean(value = "") {
  return String(value)
    .replace(
      /[^a-zA-Z0-9]/g,
      ""
    )
    .toLowerCase();
}

function safeKey(value = "") {
  return String(value)
    .trim()
    .replace(
      /[.#$\[\]\/]/g,
      "_"
    )
    .replace(
      /\s+/g,
      "_"
    )
    .toLowerCase();
}

function normalizeRole(value = "") {
  const raw = String(value || "").trim().toLowerCase();
  const aliases = {
    administrator: "admin",
    "admin / tu": "admin",
    "wakil direktur": "wakil",
    wakil_direktur: "wakil",
    wadir: "wakil",
    "wakil direktur bidang": "wakil",
    counselor: "konselor",
    konseling: "konselor"
  };
  return aliases[raw] || raw;
}

function rolesOf(value = {}) {
  let raw = value.roles ?? value.akses ?? value.role ?? value.jabatan ?? [];
  if (!Array.isArray(raw)) raw = [raw];
  return [...new Set(raw.flatMap(item => String(item || "").split(/[;,|]/)).map(normalizeRole).filter(Boolean))];
}

function allowedStaff(value = {}) {
  return rolesOf(value).some(role => ALLOWED_CHAT_ROLES.has(role));
}

function studentKey(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isStaffSender(
  message,
  staff
) {
  const senderUsername =
    clean(
      message.senderUsername
    );

  const senderDisplay =
    clean(
      message.senderDisplay ||
      message.pengirim
    );

  const staffUsername =
    clean(
      staff.username
    );

  const staffLabel =
    clean(
      staff.label
    );

  return Boolean(
    (
      senderUsername &&
      staffUsername &&
      senderUsername ===
        staffUsername
    ) ||
    (
      senderDisplay &&
      staffLabel &&
      senderDisplay ===
        staffLabel
    )
  );
}

function activeTokenEntries(
  tokenData = {}
) {
  return Object.entries(
    tokenData
  )
    .filter(
      ([, item]) =>
        item &&
        item.aktif !== false &&
        item.token
    );
}

function chunkArray(
  values,
  size = 500
) {
  const chunks = [];

  for (
    let index = 0;
    index < values.length;
    index += size
  ) {
    chunks.push(
      values.slice(
        index,
        index + size
      )
    );
  }

  return chunks;
}

async function markInvalidTokens(
  tokenRef,
  entries,
  responses
) {
  const updates = {};

  responses.forEach(
    (result, index) => {
      if (result.success) {
        return;
      }

      const code =
        result.error?.code ||
        "";

      if (
        code.includes(
          "registration-token-not-registered"
        ) ||
        code.includes(
          "invalid-registration-token"
        )
      ) {
        const tokenKey =
          entries[index]?.[0];

        if (tokenKey) {
          updates[
            `${tokenKey}/aktif`
          ] = false;

          updates[
            `${tokenKey}/errorTerakhir`
          ] = code;

          updates[
            `${tokenKey}/diperbarui`
          ] =
            new Date()
              .toISOString();
        }
      }
    }
  );

  if (
    Object.keys(updates).length
  ) {
    await tokenRef.update(
      updates
    );
  }
}

async function sendToOneWali({
  waliUsername,
  title,
  body,
  link = "index.html",
  roomId = "",
  notificationId = ""
}) {
  const database =
    getDatabase();

  const waliKey =
    safeKey(
      waliUsername
    );

  const tokenRef =
    database.ref(
      `/cahaya_app/fcm_tokens_wali/${waliKey}`
    );

  const tokenSnapshot =
    await tokenRef.get();

  const entries =
    activeTokenEntries(
      tokenSnapshot.val() ||
      {}
    );

  if (!entries.length) {
    console.log(
      "Belum ada token aktif:",
      waliKey
    );

    return {
      successCount: 0,
      failureCount: 0
    };
  }

  const tokens =
    entries.map(
      ([, item]) =>
        item.token
    );

  const response =
    await getMessaging()
      .sendEachForMulticast({
        tokens,

        /*
         * Data-only message.
         * Service worker menampilkan notifikasi agar tidak ganda.
         */
        data: {
          title:
            String(
              title ||
              "Notifikasi Pesantren"
            ),

          body:
            String(
              body ||
              "Ada pemberitahuan baru."
            ),

          link:
            String(
              link ||
              "index.html"
            ),

          roomId:
            String(
              roomId ||
              ""
            ),

          notificationId:
            String(
              notificationId ||
              ""
            )
        },

        webpush: {
          headers: {
            Urgency:
              "high"
          }
        }
      });

  await markInvalidTokens(
    tokenRef,
    entries,
    response.responses
  );

  return {
    successCount:
      response.successCount,

    failureCount:
      response.failureCount
  };
}

async function sendBroadcast({
  title,
  body,
  link = "index.html",
  roomId =
    "room_broadcast_wali"
}) {
  const database =
    getDatabase();

  const rootRef =
    database.ref(
      "/cahaya_app/fcm_tokens_wali"
    );

  const snapshot =
    await rootRef.get();

  const allUsers =
    snapshot.val() ||
    {};

  const flatEntries = [];

  Object.entries(allUsers)
    .forEach(
      ([waliKey, tokenData]) => {
        activeTokenEntries(
          tokenData
        )
          .forEach(
            ([tokenKey, item]) => {
              flatEntries.push({
                waliKey,
                tokenKey,
                token:
                  item.token
              });
            }
          );
      }
    );

  if (!flatEntries.length) {
    return {
      successCount: 0,
      failureCount: 0
    };
  }

  let successCount = 0;
  let failureCount = 0;

  const batches =
    chunkArray(
      flatEntries,
      500
    );

  for (
    const batch
    of batches
  ) {
    const response =
      await getMessaging()
        .sendEachForMulticast({
          tokens:
            batch.map(
              item =>
                item.token
            ),

          data: {
            title:
              String(
                title ||
                "Pengumuman Pesantren"
              ),

            body:
              String(
                body ||
                "Ada pengumuman baru."
              ),

            link:
              String(
                link ||
                "index.html"
              ),

            roomId:
              String(
                roomId ||
                "room_broadcast_wali"
              ),

            notificationId:
              ""
          },

          webpush: {
            headers: {
              Urgency:
                "high"
            }
          }
        });

    successCount +=
      response.successCount;

    failureCount +=
      response.failureCount;

    const updatesByUser =
      {};

    response.responses
      .forEach(
        (result, index) => {
          if (result.success) {
            return;
          }

          const code =
            result.error?.code ||
            "";

          if (
            !(
              code.includes(
                "registration-token-not-registered"
              ) ||
              code.includes(
                "invalid-registration-token"
              )
            )
          ) {
            return;
          }

          const entry =
            batch[index];

          if (!entry) {
            return;
          }

          updatesByUser[
            `${entry.waliKey}/${entry.tokenKey}/aktif`
          ] = false;

          updatesByUser[
            `${entry.waliKey}/${entry.tokenKey}/errorTerakhir`
          ] = code;

          updatesByUser[
            `${entry.waliKey}/${entry.tokenKey}/diperbarui`
          ] =
            new Date()
              .toISOString();
        }
      );

    if (
      Object.keys(
        updatesByUser
      ).length
    ) {
      await rootRef.update(
        updatesByUser
      );
    }
  }

  return {
    successCount,
    failureCount
  };
}


async function waliUsernamesForStudent(studentKeyValue) {
  const database = getDatabase();
  const normalized = studentKey(studentKeyValue);
  if (!normalized) return [];

  const mapSnapshot = await database
    .ref(`/cahaya_app/fcm_wali_by_student/${normalized}`)
    .get();

  const mapped = Object.entries(mapSnapshot.val() || {})
    .filter(([, value]) => value && value.aktif !== false)
    .map(([waliKey, value]) => String(value.username || waliKey || "").trim())
    .filter(Boolean);

  if (mapped.length) return [...new Set(mapped)];

  /* Fallback untuk token lama sebelum reverse-index V63 dibuat. */
  const tokenRoot = await database.ref("/cahaya_app/fcm_tokens_wali").get();
  const matches = [];
  Object.entries(tokenRoot.val() || {}).forEach(([waliKey, tokenData]) => {
    const entries = activeTokenEntries(tokenData || {});
    const hit = entries.some(([, item]) =>
      studentKey(item.studentKey || item.namaAnak || "") === normalized
    );
    if (hit) matches.push(waliKey);
  });
  return [...new Set(matches)];
}

function kabarCopy(category, record = {}) {
  const labels = {
    halqah: ["Kabar Ananda Baru", "Ada pembaruan kegiatan halaqah ananda."],
    tahfiz: ["Kabar Tahfiz Ananda", "Ada perkembangan tahfiz atau setoran Al-Qur'an ananda."],
    program: ["Kabar Kegiatan Ananda", "Ada pembaruan program harian ananda."],
    pembelajaran: ["Kabar Belajar Ananda", "Ada pembaruan pembelajaran ananda."],
    penindakan: ["Kabar Pembinaan Ananda", "Ada pembaruan pembinaan ananda."]
  };
  const base = labels[category] || ["Kabar Ananda Baru", "Ada pembaruan baru tentang ananda."];
  const detail = String(
    record.program || record.namaProgram || record.mapel || record.mataPelajaran ||
    record.surat || record.namaSurat || record.jenisPelanggaran || record.kategoriAkhir || ""
  ).trim();
  return {
    title: base[0],
    body: detail ? `${base[1]} ${detail}.` : base[1]
  };
}

exports.pushKabarAnandaToWali =
  onValueCreated(
    {
      ref: "/cahaya_app/wali_index/{studentKey}/{category}/{eventId}",
      instance: DATABASE_INSTANCE,
      region: DATABASE_REGION
    },
    async event => {
      const category = String(event.params.category || "").toLowerCase();
      if (!KABAR_CATEGORIES.has(category)) return null;
      const record = event.data.val() || {};
      const recipients = await waliUsernamesForStudent(event.params.studentKey);
      if (!recipients.length) {
        console.log("Belum ada perangkat wali untuk santri:", event.params.studentKey);
        return null;
      }
      const copy = kabarCopy(category, record);
      const results = await Promise.all(recipients.map(waliUsername =>
        sendToOneWali({
          waliUsername,
          title: copy.title,
          body: copy.body,
          link: "index.html?openKabar=1",
          notificationId: `kabar_${category}_${event.params.eventId}`
        })
      ));
      console.log("Push Kabar Ananda selesai", {
        studentKey: event.params.studentKey,
        category,
        recipients: recipients.length,
        results
      });
      return results;
    }
  );

/*
 * Chat langsung dari role pengurus ke wali.
 */
exports.pushChatToWali =
  onValueCreated(
    {
      ref:
        "/cahaya_app/pesan_global/{roomId}/{messageId}",

      instance:
        DATABASE_INSTANCE,

      region:
        DATABASE_REGION
    },
    async event => {
      const message =
        event.data.val();

      const roomId =
        event.params.roomId;

      if (
        !message ||
        roomId ===
          "room_broadcast_wali" ||
        message.dihapus === true ||
        message.deleted === true
      ) {
        return null;
      }

      const database =
        getDatabase();

      const metaSnapshot =
        await database
          .ref(
            `/cahaya_app/pesan_meta/${roomId}`
          )
          .get();

      const meta =
        metaSnapshot.val();

      if (
        !meta?.wali?.username ||
        !meta?.staff
      ) {
        console.log(
          "Metadata ruang belum tersedia:",
          roomId
        );

        return null;
      }

      const senderRoleSource = {
        ...meta.staff,
        roles: meta.staff?.roles || message.senderRoles || []
      };

      if (
        !allowedStaff(senderRoleSource) ||
        !isStaffSender(
          message,
          meta.staff
        )
      ) {
        return null;
      }

      const senderName =
        meta.staff.label ||
        message.pengirim ||
        "Pengurus Pesantren";

      const result =
        await sendToOneWali({
          waliUsername:
            meta.wali.username,

          title:
            `Pesan dari ${senderName}`,

          body:
            message.teks ||
            "Ada pesan baru.",

          roomId,

          link:
            (
              "index.html" +
              "?openChat=1&room=" +
              encodeURIComponent(
                roomId
              )
            )
        });

      console.log(
        "Push chat selesai",
        {
          roomId,
          ...result
        }
      );

      return result;
    }
  );

/*
 * Notifikasi admin/sistem untuk satu akun wali.
 */
exports.pushSystemNotificationToWali =
  onValueCreated(
    {
      ref:
        "/cahaya_app/notifikasi_wali/{waliUsername}/{notificationId}",

      instance:
        DATABASE_INSTANCE,

      region:
        DATABASE_REGION
    },
    async event => {
      const notification =
        event.data.val();

      if (
        !notification ||
        notification.dibaca ===
          true
      ) {
        return null;
      }

      const waliUsername =
        event.params.waliUsername;

      const notificationId =
        event.params.notificationId;

      const result =
        await sendToOneWali({
          waliUsername,

          title:
            notification.title ||
            notification.judul ||
            "Notifikasi Pesantren",

          body:
            notification.desc ||
            notification.pesan ||
            notification.keterangan ||
            "Ada pemberitahuan baru.",

          link:
            notification.link ||
            notification.url ||
            notification.halaman ||
            "index.html",

          notificationId
        });

      console.log(
        "Push sistem selesai",
        {
          waliUsername,
          notificationId,
          ...result
        }
      );

      return result;
    }
  );

/*
 * Pengumuman pusat untuk seluruh token wali.
 */
exports.pushBroadcastToAllWali =
  onValueCreated(
    {
      ref:
        "/cahaya_app/pesan_global/room_broadcast_wali/{messageId}",

      instance:
        DATABASE_INSTANCE,

      region:
        DATABASE_REGION
    },
    async event => {
      const message =
        event.data.val();

      if (
        !message ||
        message.dihapus === true ||
        message.deleted === true
      ) {
        return null;
      }

      const result =
        await sendBroadcast({
          title:
            message.judul ||
            "Pengumuman Pesantren",

          body:
            message.teks ||
            "Ada pengumuman baru.",

          link:
            "index.html",

          roomId:
            "room_broadcast_wali"
        });

      console.log(
        "Push pengumuman selesai",
        result
      );

      return result;
    }
  );

/*
 * Broadcast "Semua Pengguna" juga dikirim ke seluruh perangkat wali.
 * Pengurus menerima broadcast ini melalui listener dashboard.
 */
exports.pushBroadcastSemuaPenggunaToAllWali =
  onValueCreated(
    {
      ref:
        "/cahaya_app/pesan_global/room_broadcast_semua/{messageId}",

      instance:
        DATABASE_INSTANCE,

      region:
        DATABASE_REGION
    },
    async event => {
      const message =
        event.data.val();

      if (
        !message ||
        message.dihapus === true ||
        message.deleted === true
      ) {
        return null;
      }

      const result =
        await sendBroadcast({
          title:
            message.judul ||
            "Pengumuman untuk Semua Pengguna",

          body:
            message.teks ||
            "Ada pengumuman baru.",

          link:
            "index.html",

          roomId:
            "room_broadcast_semua"
        });

      console.log(
        "Push broadcast semua pengguna selesai",
        result
      );

      return result;
    }
  );

