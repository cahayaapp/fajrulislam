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
  onValueCreated,
  onValueWritten
} = require(
  "firebase-functions/v2/database"
);

const {
  onCall,
  HttpsError
} = require("firebase-functions/v2/https");

const {createHash} = require("node:crypto");
const FacePoc = require("./face-attendance-poc-core");

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

const FACE_POC_ROOT = "/cahaya_app/face_attendance_poc";

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

function stableStudentKey(value = "") {
  return String(value || "").trim().replace(/[.#$\[\]\/]/g, "");
}

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

function accessRoles(value = {}) {
  const raw = value.roles || {};
  if (Array.isArray(raw)) return raw.map(normalizeRole).filter(Boolean);
  if (raw && typeof raw === "object") {
    return Object.entries(raw).filter(([, enabled]) => enabled === true).map(([role]) => normalizeRole(role));
  }
  return rolesOf(value);
}

function hasAccessRole(profile = {}, wanted = []) {
  const accepted = new Set(wanted.map(normalizeRole));
  return accessRoles(profile).some(role => accepted.has(role));
}

function secureRoomId(waliUid, staffUid, studentKeyValue) {
  const digest = createHash("sha256")
    .update(["wali", waliUid, staffUid, studentKeyValue].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `wali_${digest}`;
}

function publicAccessProfile(uid, profile = {}) {
  return {
    uid,
    username: String(profile.username || "").trim().toLowerCase(),
    label: String(profile.label || profile.displayName || profile.username || "Pengguna CAHAYA").trim(),
    roles: accessRoles(profile)
  };
}

async function secureChatContext(uid) {
  if (!uid) throw new HttpsError("unauthenticated", "Firebase Auth diperlukan.");
  const db = getDatabase();
  const [userSnap, waliSnap] = await Promise.all([
    db.ref(`/cahaya_access/users/${uid}`).get(),
    db.ref(`/cahaya_access/wali/${uid}`).get()
  ]);
  const user = userSnap.val() || {};
  const wali = waliSnap.val() || {};
  const isWali = wali.active === true;
  const isInternal = user.active === true && user.internal === true;
  if (!isWali && !isInternal) throw new HttpsError("permission-denied", "Akun belum memiliki akses chat.");
  return {db, uid, user, wali, isWali, isInternal};
}

/* Contact discovery is trusted: the client never receives the access tree and
 * cannot promote a localStorage role into a privileged chat counterpart. */
exports.listSecureChatContacts = onCall({region:DATABASE_REGION}, async request => {
  const context = await secureChatContext(request.auth?.uid);
  const users = (await context.db.ref("/cahaya_access/users").get()).val() || {};
  if (context.isWali) {
    return {
      contacts: Object.entries(users)
        .filter(([uid, profile]) => uid !== context.uid && profile?.active === true && profile?.internal === true && hasAccessRole(profile, ["direktur", "supervisor"]))
        .map(([uid, profile]) => publicAccessProfile(uid, profile))
    };
  }
  if (!hasAccessRole(context.user, ["direktur", "supervisor"])) return {contacts:[]};
  const waliMap = (await context.db.ref("/cahaya_access/wali").get()).val() || {};
  const contacts = [];
  Object.entries(waliMap).forEach(([uid, access]) => {
    if (uid === context.uid || access?.active !== true) return;
    const base = publicAccessProfile(uid, users[uid] || {});
    Object.entries(access.students || {}).forEach(([studentKeyValue, child]) => {
      if (!(child === true || child?.active === true)) return;
      contacts.push({
        ...base,
        roles:["wali"],
        studentKey:stableStudentKey(child?.studentKey || studentKeyValue),
        studentName:String(child?.namaSantri || child?.namaAnak || child?.label || "Santri").trim(),
        kelas:String(child?.kelas || "").trim()
      });
    });
  });
  return {contacts};
});

/* A room is created/reused only after both UID roles and the Wali-child edge
 * have been verified by Admin SDK. The deterministic key makes retries safe. */
exports.openSecureChatRoom = onCall({region:DATABASE_REGION}, async request => {
  const caller = await secureChatContext(request.auth?.uid);
  const counterpartUid = String(request.data?.counterpartUid || "").trim();
  const requestedStudentKey = stableStudentKey(request.data?.studentKey || "");
  if (!counterpartUid || !requestedStudentKey || counterpartUid === caller.uid) {
    throw new HttpsError("invalid-argument", "Kontak dan konteks santri wajib dipilih.");
  }
  const [counterUserSnap, counterWaliSnap] = await Promise.all([
    caller.db.ref(`/cahaya_access/users/${counterpartUid}`).get(),
    caller.db.ref(`/cahaya_access/wali/${counterpartUid}`).get()
  ]);
  const counterUser = counterUserSnap.val() || {};
  const counterWali = counterWaliSnap.val() || {};
  let waliUid, staffUid, waliAccess, staffProfile;
  if (caller.isWali) {
    waliUid = caller.uid; staffUid = counterpartUid; waliAccess = caller.wali; staffProfile = counterUser;
  } else {
    waliUid = counterpartUid; staffUid = caller.uid; waliAccess = counterWali; staffProfile = caller.user;
  }
  if (waliAccess?.active !== true || !(waliAccess.students?.[requestedStudentKey] === true || waliAccess.students?.[requestedStudentKey]?.active === true)) {
    throw new HttpsError("permission-denied", "Santri bukan bagian dari akun Wali ini.");
  }
  if (staffProfile?.active !== true || staffProfile?.internal !== true || !hasAccessRole(staffProfile, ["direktur", "supervisor"])) {
    throw new HttpsError("permission-denied", "Wali hanya dapat menghubungi Direktur atau Supervisor.");
  }
  const roomId = secureRoomId(waliUid, staffUid, requestedStudentKey);
  const now = new Date().toISOString();
  const waliProfile = publicAccessProfile(waliUid, caller.isWali ? caller.user : counterUser);
  const staffPublic = publicAccessProfile(staffUid, caller.isWali ? counterUser : caller.user);
  const child = waliAccess.students[requestedStudentKey] || {};
  const roomRef = caller.db.ref(`/cahaya_chat_v2/rooms/${roomId}`);
  await roomRef.transaction(current => current || {
    id:roomId,
    type:"wali_staff",
    studentKey:requestedStudentKey,
    studentName:String(child.namaSantri || child.namaAnak || child.label || "Santri").trim(),
    members:{
      [waliUid]:{active:true, kind:"wali", label:waliProfile.label, username:waliProfile.username},
      [staffUid]:{active:true, kind:"internal", label:staffPublic.label, username:staffPublic.username, roles:staffPublic.roles}
    },
    createdAt:now,
    createdByUid:caller.uid,
    updatedAt:now
  }, undefined, false);
  const room = (await roomRef.get()).val() || {};
  const updates = {};
  [[waliUid, staffPublic], [staffUid, {...waliProfile, roles:["wali"]}]].forEach(([uid, peer]) => {
    updates[`/cahaya_chat_v2/user_rooms/${uid}/${roomId}`] = {
      roomId, studentKey:requestedStudentKey, studentName:room.studentName || "Santri",
      peerUid:peer.uid, peerLabel:peer.label, peerUsername:peer.username, peerRoles:peer.roles || [],
      updatedAt:room.updatedAt || now, lastMessage:room.lastMessage || null
    };
  });
  await caller.db.ref().update(updates);
  return {roomId, room};
});

exports.indexSecureChatMessage = onValueCreated(
  {ref:"/cahaya_chat_v2/rooms/{roomId}/messages/{messageId}", instance:DATABASE_INSTANCE, region:DATABASE_REGION},
  async event => {
    const message = event.data.val() || {};
    const roomRef = getDatabase().ref(`/cahaya_chat_v2/rooms/${event.params.roomId}`);
    const room = (await roomRef.get()).val() || {};
    const members = Object.entries(room.members || {}).filter(([, member]) => member?.active === true);
    if (!members.some(([uid]) => uid === message.senderUid)) return event.data.ref.remove();
    const summary = {
      id:event.params.messageId,
      text:String(message.text || "").slice(0, 500),
      senderUid:message.senderUid,
      senderDisplay:String(message.senderDisplay || "Pengguna"),
      createdAt:Number(message.createdAt || Date.now())
    };
    const updates = {
      [`/cahaya_chat_v2/rooms/${event.params.roomId}/lastMessage`]:summary,
      [`/cahaya_chat_v2/rooms/${event.params.roomId}/updatedAt`]:new Date(summary.createdAt).toISOString()
    };
    members.forEach(([uid]) => {
      updates[`/cahaya_chat_v2/user_rooms/${uid}/${event.params.roomId}/lastMessage`] = summary;
      updates[`/cahaya_chat_v2/user_rooms/${uid}/${event.params.roomId}/updatedAt`] = new Date(summary.createdAt).toISOString();
    });
    return getDatabase().ref().update(updates);
  }
);

exports.pushSecureChatMessage = onValueCreated(
  {ref:"/cahaya_chat_v2/rooms/{roomId}/messages/{messageId}", instance:DATABASE_INSTANCE, region:DATABASE_REGION},
  async event => {
    const message = event.data.val() || {};
    const room = (await getDatabase().ref(`/cahaya_chat_v2/rooms/${event.params.roomId}`).get()).val() || {};
    const recipients = Object.entries(room.members || {}).filter(([uid, member]) => uid !== message.senderUid && member?.active === true);
    const sender = room.members?.[message.senderUid] || {};
    const title = `Pesan dari ${sender.label || message.senderDisplay || "Pengguna CAHAYA"}`;
    const body = String(message.text || "Ada pesan baru.").slice(0, 180);
    return Promise.all(recipients.map(([, member]) => member.kind === "wali"
      ? sendToOneWali({waliUsername:member.username,title,body,roomId:event.params.roomId,notificationId:`secure_${event.params.messageId}`})
      : sendToOneUser({username:member.username,title,body,roomId:event.params.roomId,link:`main-dashboard.html?openChat=1&room=${encodeURIComponent(event.params.roomId)}`,notificationId:`secure_${event.params.messageId}`,tag:event.params.roomId})
    ));
  }
);

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

/* Quran placement remains authoritative at program_quran_santri. The Wali
 * copy is a read index only, kept current by trusted backend code. */
exports.syncQuranPlacementToWaliIndex = onValueWritten(
  {
    ref: "/cahaya_app/program_quran_santri/{studentKey}",
    instance: DATABASE_INSTANCE,
    region: DATABASE_REGION
  },
  async event => {
    const key = stableStudentKey(event.params.studentKey);
    if (!key) return null;
    const target = getDatabase().ref(`/cahaya_app/wali_index/${key}/program_quran/current`);
    if (!event.data.after.exists()) return target.remove();
    const value = event.data.after.val() || {};
    return target.set({...value, studentKey:key, indexedAt:new Date().toISOString()});
  }
);

/* Mentoring records are exposed to Wali only when the writer provides a
 * stable student key. Legacy name-only records remain inaccessible until an
 * administrator resolves them; runtime name matching is deliberately absent. */
exports.syncMentoringToWaliIndex = onValueWritten(
  {
    ref: "/cahaya_app/log_mentoring_naqib/{eventId}",
    instance: DATABASE_INSTANCE,
    region: DATABASE_REGION
  },
  async event => {
    const before = event.data.before.val() || {};
    const after = event.data.after.val() || {};
    const beforeKey = stableStudentKey(before.studentKey || before.santriId || before.studentId || "");
    const afterKey = stableStudentKey(after.studentKey || after.santriId || after.studentId || "");
    const updates = {};
    if (beforeKey && beforeKey !== afterKey) updates[`/cahaya_app/wali_index/${beforeKey}/mentoring/${event.params.eventId}`] = null;
    if (afterKey && event.data.after.exists()) {
      updates[`/cahaya_app/wali_index/${afterKey}/mentoring/${event.params.eventId}`] = {...after, studentKey:afterKey};
    } else if (beforeKey && !event.data.after.exists()) {
      updates[`/cahaya_app/wali_index/${beforeKey}/mentoring/${event.params.eventId}`] = null;
    }
    return Object.keys(updates).length ? getDatabase().ref().update(updates) : null;
  }
);

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


/* =========================================================
 * V68 — PUSH GLOBAL SELURUH ROLE
 * Token umum: /cahaya_app/fcm_tokens_user/{username}/{tokenKey}
 * Reverse index role: /cahaya_app/fcm_users_by_role/{role}/{username}
 * ========================================================= */

function isPrivilegedRoleList(roles = []) {
  return roles.some(role => ALLOWED_CHAT_ROLES.has(normalizeRole(role)));
}

function messageRoleList(value) {
  if (Array.isArray(value)) return value.map(normalizeRole).filter(Boolean);
  if (!value) return [];
  return String(value).split(/[;,|]/).map(normalizeRole).filter(Boolean);
}

async function sendToOneUser({
  username,
  title,
  body,
  link = "main-dashboard.html",
  roomId = "",
  notificationId = "",
  tag = "",
  requiredRole = ""
}) {
  const database = getDatabase();
  const userKey = safeKey(username);
  if (!userKey) return { successCount: 0, failureCount: 0 };

  const tokenRef = database.ref(`/cahaya_app/fcm_tokens_user/${userKey}`);
  const snapshot = await tokenRef.get();
  let entries = activeTokenEntries(snapshot.val() || {});
  if (requiredRole) {
    const normalizedRequiredRole = normalizeRole(requiredRole);
    entries = entries.filter(([, item]) =>
      messageRoleList(item?.roles || []).includes(normalizedRequiredRole)
    );
  }
  if (!entries.length) {
    console.log("Belum ada token global aktif:", userKey);
    return { successCount: 0, failureCount: 0 };
  }

  const response = await getMessaging().sendEachForMulticast({
    tokens: entries.map(([, item]) => item.token),
    data: {
      title: String(title || "Notifikasi CAHAYA"),
      body: String(body || "Ada pemberitahuan baru."),
      link: String(link || "main-dashboard.html"),
      roomId: String(roomId || ""),
      notificationId: String(notificationId || ""),
      tag: String(tag || roomId || notificationId || "cahaya-global")
    },
    webpush: { headers: { Urgency: "high" } }
  });

  await markInvalidTokens(tokenRef, entries, response.responses);
  return { successCount: response.successCount, failureCount: response.failureCount };
}

async function usernamesForRole(roleValue) {
  const role = safeKey(normalizeRole(roleValue));
  if (!role) return [];
  const snapshot = await getDatabase().ref(`/cahaya_app/fcm_users_by_role/${role}`).get();
  return Object.entries(snapshot.val() || {})
    .filter(([, value]) => value && value.aktif !== false)
    .map(([userKey, value]) => String(value.username || userKey || "").trim())
    .filter(Boolean);
}

async function sendToRole({ role, title, body, link = "index.html", notificationId = "" }) {
  const users = [...new Set(await usernamesForRole(role))];
  if (!users.length) return { users: 0, successCount: 0, failureCount: 0 };
  const results = await Promise.all(users.map(username => sendToOneUser({
    username, title, body, link, notificationId,
    tag: `role_${safeKey(role)}_${notificationId}`,
    requiredRole: role
  })));
  return {
    users: users.length,
    successCount: results.reduce((sum, item) => sum + (item.successCount || 0), 0),
    failureCount: results.reduce((sum, item) => sum + (item.failureCount || 0), 0)
  };
}

async function sendToAllUsers({ title, body, link = "index.html", notificationId = "", excludeRoles = [] }) {
  const database = getDatabase();
  const rootRef = database.ref("/cahaya_app/fcm_tokens_user");
  const snapshot = await rootRef.get();
  const allUsers = snapshot.val() || {};
  const excluded = new Set(excludeRoles.map(normalizeRole));
  const flat = [];

  Object.entries(allUsers).forEach(([userKey, tokenData]) => {
    activeTokenEntries(tokenData || {}).forEach(([tokenKey, item]) => {
      const itemRoles = messageRoleList(item.roles || []);
      if (excluded.size && itemRoles.some(role => excluded.has(role))) return;
      flat.push({ userKey, tokenKey, token: item.token });
    });
  });

  if (!flat.length) return { successCount: 0, failureCount: 0 };
  let successCount = 0;
  let failureCount = 0;

  for (const batch of chunkArray(flat, 500)) {
    const response = await getMessaging().sendEachForMulticast({
      tokens: batch.map(item => item.token),
      data: {
        title: String(title || "Pengumuman CAHAYA"),
        body: String(body || "Ada pengumuman baru."),
        link: String(link || "index.html"),
        roomId: "",
        notificationId: String(notificationId || ""),
        tag: String(notificationId || "cahaya-semua")
      },
      webpush: { headers: { Urgency: "high" } }
    });
    successCount += response.successCount;
    failureCount += response.failureCount;

    const updates = {};
    response.responses.forEach((result, index) => {
      if (result.success) return;
      const code = result.error?.code || "";
      if (!(code.includes("registration-token-not-registered") || code.includes("invalid-registration-token"))) return;
      const entry = batch[index];
      if (!entry) return;
      updates[`${entry.userKey}/${entry.tokenKey}/aktif`] = false;
      updates[`${entry.userKey}/${entry.tokenKey}/errorTerakhir`] = code;
      updates[`${entry.userKey}/${entry.tokenKey}/diperbarui`] = new Date().toISOString();
    });
    if (Object.keys(updates).length) await rootRef.update(updates);
  }

  return { successCount, failureCount };
}

/* Pesan personal untuk penerima NON-WALI. Wali tetap ditangani pushChatToWali
 * agar tidak menerima notifikasi ganda. Semua chat yang sah harus melibatkan
 * minimal salah satu role: Direktur, Wakil Direktur, Konselor, atau Admin. */
exports.pushChatToPengurus = onValueCreated(
  {
    ref: "/cahaya_app/pesan_global/{roomId}/{messageId}",
    instance: DATABASE_INSTANCE,
    region: DATABASE_REGION
  },
  async event => {
    const message = event.data.val() || {};
    const roomId = event.params.roomId;
    if (!message || roomId.startsWith("room_broadcast_") || message.dihapus === true || message.deleted === true) return null;

    const recipientUsername = String(message.recipientUsername || "").trim();
    if (!recipientUsername) return null;

    let recipientRoles = messageRoleList(message.recipientRoles || []);
    let senderRoles = messageRoleList(message.senderRoles || []);

    if (!recipientRoles.length || !senderRoles.length) {
      try {
        const meta = (await getDatabase().ref(`/cahaya_app/pesan_meta/${roomId}`).get()).val() || {};
        const participants = Object.values(meta.participants || {});
        if (!recipientRoles.length) {
          const recipient = participants.find(item => clean(item?.username) === clean(recipientUsername));
          recipientRoles = rolesOf(recipient || {});
        }
        if (!senderRoles.length) {
          const sender = participants.find(item => clean(item?.username) === clean(message.senderUsername || ""));
          senderRoles = rolesOf(sender || {});
        }
      } catch (_) {}
    }

    if (recipientRoles.includes("wali")) return null;
    if (!(isPrivilegedRoleList(senderRoles) || isPrivilegedRoleList(recipientRoles))) return null;

    const senderName = String(message.senderDisplay || message.pengirim || "Pengguna CAHAYA").trim();
    const result = await sendToOneUser({
      username: recipientUsername,
      title: `Pesan dari ${senderName}`,
      body: message.teks || "Ada pesan baru.",
      roomId,
      link: `main-dashboard.html?openChat=1&room=${encodeURIComponent(roomId)}`,
      notificationId: `chat_${event.params.messageId}`,
      tag: roomId
    });
    console.log("Push chat pengurus selesai", { roomId, recipientUsername, ...result });
    return result;
  }
);

/* Notifikasi sistem personal untuk akun non-wali maupun wali via token global. */
exports.pushSystemNotificationToUser = onValueCreated(
  {
    ref: "/cahaya_app/notifikasi_user/{username}/{notificationId}",
    instance: DATABASE_INSTANCE,
    region: DATABASE_REGION
  },
  async event => {
    const notification = event.data.val() || {};
    if (!notification || notification.dibaca === true) return null;
    return sendToOneUser({
      username: event.params.username,
      title: notification.title || notification.judul || "Notifikasi CAHAYA",
      body: notification.desc || notification.pesan || notification.keterangan || "Ada pemberitahuan baru.",
      link: notification.link || notification.url || notification.halaman || "index.html",
      notificationId: event.params.notificationId
    });
  }
);

/* Satu notifikasi untuk seluruh perangkat pengguna pada role tertentu. */
exports.pushRoleNotification = onValueCreated(
  {
    ref: "/cahaya_app/notifikasi_role/{role}/{notificationId}",
    instance: DATABASE_INSTANCE,
    region: DATABASE_REGION
  },
  async event => {
    const notification = event.data.val() || {};
    if (!notification || notification.dibaca === true) return null;
    const result = await sendToRole({
      role: event.params.role,
      title: notification.title || notification.judul || "Notifikasi CAHAYA",
      body: notification.desc || notification.pesan || notification.keterangan || "Ada pemberitahuan untuk role Anda.",
      link: notification.link || notification.url || notification.halaman || "index.html",
      notificationId: event.params.notificationId
    });
    console.log("Push role selesai", { role: event.params.role, ...result });
    return result;
  }
);

/* Pengumuman push global seluruh pengguna CAHAYA. */
exports.pushGlobalNotification = onValueCreated(
  {
    ref: "/cahaya_app/notifikasi_semua/{notificationId}",
    instance: DATABASE_INSTANCE,
    region: DATABASE_REGION
  },
  async event => {
    const notification = event.data.val() || {};
    if (!notification || notification.dibaca === true) return null;
    const result = await sendToAllUsers({
      title: notification.title || notification.judul || "Pengumuman CAHAYA",
      body: notification.desc || notification.pesan || notification.keterangan || "Ada pengumuman baru.",
      link: notification.link || notification.url || notification.halaman || "index.html",
      notificationId: event.params.notificationId
    });
    console.log("Push global selesai", result);
    return result;
  }
);

/* Kompatibilitas bila room broadcast lama masih dipakai langsung, bukan salinan private. */
exports.pushBroadcastPengurusDirect = onValueCreated(
  {
    ref: "/cahaya_app/pesan_global/room_broadcast_pengurus/{messageId}",
    instance: DATABASE_INSTANCE,
    region: DATABASE_REGION
  },
  async event => {
    const message = event.data.val() || {};
    if (!message || message.dihapus === true || message.deleted === true) return null;
    return sendToAllUsers({
      title: message.judul || "Pengumuman Pengurus",
      body: message.teks || "Ada pengumuman baru untuk pengurus.",
      link: "main-dashboard.html",
      notificationId: `broadcast_pengurus_${event.params.messageId}`,
      excludeRoles: ["wali"]
    });
  }
);

exports.pushBroadcastSemuaPenggunaToPengurus = onValueCreated(
  {
    ref: "/cahaya_app/pesan_global/room_broadcast_semua/{messageId}",
    instance: DATABASE_INSTANCE,
    region: DATABASE_REGION
  },
  async event => {
    const message = event.data.val() || {};
    if (!message || message.dihapus === true || message.deleted === true) return null;
    return sendToAllUsers({
      title: message.judul || "Pengumuman untuk Semua Pengguna",
      body: message.teks || "Ada pengumuman baru.",
      link: "main-dashboard.html",
      notificationId: `broadcast_semua_${event.params.messageId}`,
      excludeRoles: ["wali"]
    });
  }
);

async function facePocCaller(request) {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Firebase Auth diperlukan untuk Face Attendance POC.");
  const db = getDatabase();
  const profile = (await db.ref(`/cahaya_access/users/${uid}`).get()).val() || {};
  if (profile.active !== true || profile.internal !== true) throw new HttpsError("permission-denied", "Akun internal aktif diperlukan.");
  return {uid, db, profile};
}

function faceProgramSummary(id, value = {}) {
  return {
    id,
    name:String(value.name || id),
    active:value.active === true,
    unit:String(value.unit || ""),
    startTime:String(value.startTime || "04:00:00"),
    onTimeCutoff:String(value.onTimeCutoff || "04:45:00"),
    scanCloseTime:String(value.scanCloseTime || "06:00:00"),
    timeZone:String(value.timeZone || "Asia/Jakarta"),
    rosterCount:FacePoc.programRoster(value).length,
    version:Number(value.version || 1),
    updatedAt:Number(value.updatedAt || 0)
  };
}

/* Returns authorization and program summaries only. It never returns the access
 * tree, roster, or biometric template to an unauthorized caller. */
exports.getFaceAttendancePocContext = onCall({region:DATABASE_REGION}, async request => {
  const caller = await facePocCaller(request);
  const programs = (await caller.db.ref(`${FACE_POC_ROOT}/programs`).get()).val() || {};
  const canEnroll = FacePoc.canEnroll(caller.profile), canScan = FacePoc.canScan(caller.profile);
  const visible = Object.entries(programs).filter(([, program]) => canEnroll || FacePoc.authorizedForProgram(caller.profile, program, caller.uid)).map(([id, program]) => faceProgramSummary(id, program));
  return {uid:caller.uid, canEnroll, canScan, modelVersion:FacePoc.MODEL_VERSION, embeddingVersion:FacePoc.EMBEDDING_VERSION, programs:visible};
});

/* Enrollment writes are server mediated. Admin/Director cannot choose audit UID,
 * version, timestamps, active status, or overwrite history from the client. */
exports.saveFaceProfilePoc = onCall({region:DATABASE_REGION}, async request => {
  const caller = await facePocCaller(request);
  if (!FacePoc.canEnroll(caller.profile)) throw new HttpsError("permission-denied", "Role ini tidak boleh melakukan enrollment wajah.");
  let payload;
  try { payload = FacePoc.sanitizeEnrollment(request.data || {}); }
  catch (error) { throw new HttpsError("invalid-argument", error.message); }
  payload.templateHash = createHash("sha256").update(JSON.stringify(payload.samples)).digest("hex");
  const profileRef = caller.db.ref(`${FACE_POC_ROOT}/profiles/${payload.studentKey}`);
  let previousVersion = 0, saved = null;
  const transaction = await profileRef.transaction(current => {
    previousVersion = Number(current?.profileVersion || 0);
    saved = FacePoc.nextProfile(payload, current || {}, {uid:caller.uid}, Date.now());
    return saved;
  }, undefined, false);
  if (!transaction.committed) throw new HttpsError("aborted", "Enrollment tidak tersimpan secara utuh.");
  const auditRef = caller.db.ref(`${FACE_POC_ROOT}/enrollment_audit`).push();
  await auditRef.set({studentKey:payload.studentKey, previousVersion, newVersion:saved.profileVersion, performedByUid:caller.uid, performedAt:saved.updatedAt, deviceId:FacePoc.safeKey(request.data?.deviceId), sessionDeviceId:FacePoc.safeKey(request.data?.sessionDeviceId), reason:FacePoc.text(request.data?.reason,300), modelVersion:saved.modelVersion, embeddingVersion:saved.embeddingVersion});
  return {studentKey:saved.studentKey, profileVersion:saved.profileVersion, templateHash:saved.templateHash, updatedAt:saved.updatedAt, sampleCount:saved.sampleCount};
});

exports.listFaceProfilesPoc = onCall({region:DATABASE_REGION}, async request => {
  const caller = await facePocCaller(request);
  if (!FacePoc.canEnroll(caller.profile)) throw new HttpsError("permission-denied", "Hanya petugas enrollment yang dapat melihat status seluruh profil.");
  const profiles = (await caller.db.ref(`${FACE_POC_ROOT}/profiles`).get()).val() || {};
  return {profiles:Object.values(profiles).map(profile => ({studentKey:profile.studentKey, studentName:profile.studentName, className:profile.className, active:profile.active===true, profileVersion:Number(profile.profileVersion||0), modelVersion:profile.modelVersion, embeddingVersion:profile.embeddingVersion, sampleCount:Number(profile.sampleCount||0), updatedAt:Number(profile.updatedAt||0), templateHash:profile.templateHash}))};
});

/* Naqib receives only active profiles present in the trusted program roster and
 * only when their UID is assigned to that program. */
exports.syncFaceProfilesPoc = onCall({region:DATABASE_REGION}, async request => {
  const caller = await facePocCaller(request), programId = FacePoc.safeKey(request.data?.programId);
  if (!programId) throw new HttpsError("invalid-argument", "Program wajib dipilih.");
  const program = (await caller.db.ref(`${FACE_POC_ROOT}/programs/${programId}`).get()).val() || {};
  if (!FacePoc.authorizedForProgram(caller.profile, program, caller.uid)) throw new HttpsError("permission-denied", "Anda tidak memiliki scope program ini.");
  const allProfiles = (await caller.db.ref(`${FACE_POC_ROOT}/profiles`).get()).val() || {}, profiles = FacePoc.scopedProfiles(allProfiles, program);
  return {program:faceProgramSummary(programId, program), modelVersion:FacePoc.MODEL_VERSION, embeddingVersion:FacePoc.EMBEDDING_VERSION, syncedAt:Date.now(), profiles};
});

/* The client submits identity result only. Server validates program scope,
 * roster, model, duplicate key and authoritative status/time. */
exports.submitFaceCheckInPoc = onCall({region:DATABASE_REGION}, async request => {
  const caller = await facePocCaller(request), programId = FacePoc.safeKey(request.data?.programId), studentKey = FacePoc.safeKey(request.data?.studentKey);
  const program = (await caller.db.ref(`${FACE_POC_ROOT}/programs/${programId}`).get()).val() || {};
  if (!FacePoc.authorizedForProgram(caller.profile, program, caller.uid)) throw new HttpsError("permission-denied", "Anda tidak memiliki scope program ini.");
  if (!FacePoc.programRoster(program).includes(studentKey)) throw new HttpsError("permission-denied", "Santri bukan roster program aktif.");
  const profile = (await caller.db.ref(`${FACE_POC_ROOT}/profiles/${studentKey}`).get()).val() || {};
  if (profile.active !== true || profile.modelVersion !== FacePoc.MODEL_VERSION) throw new HttpsError("failed-precondition", "Template wajah belum tersedia atau perlu diperbarui.");
  let record;
  try { record = FacePoc.sanitizeCheckIn({...request.data, programId, studentKey}, program, Date.now()); }
  catch (error) { throw new HttpsError("invalid-argument", error.message); }
  if(record.status === "DITOLAK_DI_LUAR_WAKTU")throw new HttpsError("failed-precondition","Sesi scan program sudah ditutup.");
  record.submissionId=FacePoc.safeKey(request.data?.submissionId);
  if(!record.submissionId)throw new HttpsError("invalid-argument","Submission ID wajib untuk idempotensi.");
  record.submittedByUid=caller.uid;record.profileVersion=Number(profile.profileVersion||0);record.templateHash=String(profile.templateHash||"");
  const checkRef=caller.db.ref(`${FACE_POC_ROOT}/checkins/${record.sessionId}/${studentKey}`);
  const transaction=await checkRef.transaction(current=>current||record,undefined,false),stored=transaction.snapshot.val();
  return {created:stored?.submissionId===record.submissionId, duplicate:stored?.submissionId!==record.submissionId, record:stored};
});
