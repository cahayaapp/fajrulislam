const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const matcher = require("../js/guru-attendance-session-v1.js");

const morning = {
  id: "putra-3-2-al-qur-an-rahiel-0700-21",
  className: "Kelas 3 Putra",
  subject: "Al-Qur'an",
  scheduleStart: "07:00",
  sessionLabel: "Sesi Pagi"
};
const afternoon = {
  id: "putra-3-2-al-qur-an-rahiel-1230-22",
  className: "Kelas 3 Putra",
  subject: "Al-Qur'an",
  scheduleStart: "12:30",
  sessionLabel: "Sesi Siang"
};
const schedules = [morning, afternoon];
const morningFinal = {
  jadwalId: morning.id,
  kelas: morning.className,
  mapel: morning.subject,
  statusFinalisasi: "FINAL"
};

assert.equal(matcher.matches(morningFinal, morning, schedules), true, "record pagi harus kembali ke sesi pagi");
assert.equal(matcher.matches(morningFinal, afternoon, schedules), false, "Final pagi tidak boleh mengunci sesi siang");

const afternoonFinal = {
  jadwalIdPresensi: afternoon.id,
  jadwalIdAsli: afternoon.id,
  kelas: afternoon.className,
  mapel: afternoon.subject,
  jamMulaiJadwal: "12:30",
  sesiJadwal: "Sesi Siang"
};
assert.equal(matcher.matches(afternoonFinal, afternoon, schedules), true, "record siang harus kembali ke sesi siang");
assert.equal(matcher.matches(afternoonFinal, morning, schedules), false, "record siang tidak boleh masuk sesi pagi");

const legacyAmbiguous = { kelas: morning.className, mapel: morning.subject };
assert.equal(matcher.matches(legacyAmbiguous, morning, schedules), false, "legacy ambigu tidak boleh dipaksakan ke pagi");
assert.equal(matcher.matches(legacyAmbiguous, afternoon, schedules), false, "legacy ambigu tidak boleh dipaksakan ke siang");

const legacyTimed = { kelas: morning.className, mapel: morning.subject, jamMulaiJadwal: "12.30" };
assert.equal(matcher.matches(legacyTimed, afternoon, schedules), true, "legacy dengan waktu harus cocok ke sesi yang benar");
assert.equal(matcher.matches(legacyTimed, morning, schedules), false, "legacy dengan waktu tidak boleh silang sesi");

const singleSchedule = [{ ...morning, subject: "Fiqih" }];
const singleLegacy = { kelas: morning.className, mapel: "Fiqih" };
assert.equal(matcher.matches(singleLegacy, singleSchedule[0], singleSchedule), true, "legacy tunggal tetap kompatibel");

const officialRows = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data/jadwal-pelajaran-awal-2026-2027.json"), "utf8"));
const officialPair = officialRows
  .filter(row => row.aktif !== false && row.kelas === "Kelas 3 Putra" && row.hari === 2 && /al.qur/i.test(row.mapel || ""))
  .map(row => ({
    id: row.id,
    className: row.kelas,
    subject: row.mapel,
    scheduleStart: row.jamMulai,
    sessionLabel: row.sesi
  }));
assert.equal(officialPair.length, 2, "jadwal resmi harus memuat Al-Qur'an pagi dan siang sebagai dua sesi");
const officialMorning = officialPair.find(item => item.scheduleStart === "07:00");
const officialAfternoon = officialPair.find(item => item.scheduleStart === "12:30");
assert.ok(officialMorning && officialAfternoon, "pasangan sesi resmi harus memiliki waktu berbeda");
assert.equal(
  matcher.matches({ jadwalId: officialMorning.id, kelas: officialMorning.className, mapel: officialMorning.subject }, officialAfternoon, officialPair),
  false,
  "record Final jadwal resmi pagi tidak boleh dibaca oleh sesi resmi siang"
);

for (const file of ["guru/absensiPembelajaran.html", "docs/guru/absensiPembelajaran.html"]) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  assert.match(source, /CahayaGuruAttendanceSessionV1/, `${file} harus memakai resolver sesi`);
  assert.match(source, /jamMulaiJadwal:\s*itemAssignment\.scheduleStart/, `${file} harus menyimpan waktu sesi`);
  assert.doesNotMatch(
    source,
    /todays\.filter\(x\s*=>\s*String\(x\.jadwalId[^\n]+normalizeIdentity\(x\.kelas/,
    `${file} tidak boleh memakai fallback kelas+mapel yang ambigu`
  );
}

console.log("PASS identitas sesi absensi membedakan Al-Qur'an pagi dan siang");
