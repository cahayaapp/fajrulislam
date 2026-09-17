# Legacy Guru Baseline

Status: **CANONICAL / FROZEN**  
Baseline captured: 2026-09-16  
Backup commit: `cdc27d23e932072ab454c6d5b3d8d6417c8f373d`

Dokumen ini mendeskripsikan implementasi Guru yang sedang bekerja. Dokumen ini bukan rancangan pengganti. Sistem operasional baru harus berada di atas sumber data ini melalui adapter read-first.

## Canonical files

- Shell/home Guru: `home-guru.html`, dirutekan oleh `main-dashboard.html`
- Absensi guru: `guru/absenguru.html`
- Presensi santri/KBM: `guru/absensiPembelajaran.html`
- Materi dan capaian: `guru/capaian-materi.html`
- Nilai ujian: `guru/inputNilaiUjian.html`
- Tindak lanjut: `guru/tindak-lanjut.html`
- Tahsin/Tahfiz/Murojaah: `guru/inputSetoranTahfiz.html`
- KPI Guru: `pendidikan/kpi-guru.html` + `js/guru-kpi-v144.js`
- Master lokal: `config/master-data.js` + `js/data-pusat.js`
- Snapshot jadwal: `data/jadwal-pelajaran-awal-2026-2027.json`
- Kalender akademik: `data/kalender-pendidikan-2026-2027.json`

Fingerprint SHA-256 dan jumlah baris tersimpan di `docs/GURU_BASELINE_MANIFEST.json`. Fingerprint merekam working tree aktual saat audit, termasuk pekerjaan lama yang belum berada di commit `main`.

## Feature audit

### 1. Jadwal Guru

- **Source file:** `home-guru.html`, `guru/absensiPembelajaran.html`, `guru/capaian-materi.html`, `guru/inputNilaiUjian.html`, `guru/tindak-lanjut.html`.
- **Authoritative runtime source:** `cahaya_app/jadwal_pelajaran`.
- **Bundled fallback:** `data/jadwal-pelajaran-awal-2026-2027.json`.
- **Important functions:** `fastSchedule`, `todaySchedules`, `assignedSchedule`, `loadLiteSchedule`, `buildAssignmentsForDay`, `loadLocalSchedule`, `detectTeacherCode`.
- **Read path:** Firebase schedule and/or bundled JSON depending on feature. Pages resolve the active teacher using profile identity, aliases, and `guruKode`.
- **Write path:** Guru pages do not own schedule writes. Schedule administration is outside this baseline.
- **Dependencies:** `window.CahayaGuruKPI`, current user in localStorage, master teacher aliases, class naming, date/day/time fields.
- **Expected behavior:** only assignments matching the active Guru are shown; day/time/class/mapel and combined-group semantics remain unchanged.

### 2. Presensi Pembelajaran

- **Source file:** `guru/absensiPembelajaran.html`.
- **Authoritative source:** schedule + `cahaya_app/master_akademik/kelas`; fallback class roster from `CAHAYA_MASTER_DATA.santriByClass`.
- **Evidence source/write target:** `cahaya_app/absensi_pembelajaran/{recordId}`.
- **Supporting reads:** `cahaya_app/guru_berhalangan`, `cahaya_app/izin_sakit_harian/{tanggal}`, `kalender_materi_pembelajaran/ta_2026_2027`, `cahaya_app/capaian_materi_guru`.
- **Important functions:** `loadLiteSchedule`, `loadReplacementRowsToday`, `buildAssignmentsForDay`, `loadExistingAttendance`, `finalizeExistingRecords`, `saveGradesOnly`, save handler using batched `update`.
- **Read behavior:** attendance is queried by indexed `tanggal`; whole-collection fallback is intentionally avoided.
- **Write behavior:** first attendance creates records; final attendance patches/finalizes existing records and can save daily scores/material completion.
- **Dependencies:** Firebase config, active teacher identity, two-stage attendance state, class roster, schedule IDs, material assignment matching.
- **Expected behavior:** first attendance shows attendance only; final attendance supports final status, daily score, and material. Successful save returns to home. Existing UI and payload schema are frozen.

### 3. Materi / Kalender Materi

- **Source file:** `guru/capaian-materi.html`; also consumed by `guru/absensiPembelajaran.html`, `home-guru.html`, and KPI.
- **Authoritative target source:** `kalender_materi_pembelajaran/ta_2026_2027`.
- **Legacy read source:** `guru_kits_materi/ta_2026_2027`.
- **Academic calendar:** `kalender_pendidikan/ta_2026_2027/events`, fallback `data/kalender-pendidikan-2026-2027.json` where applicable.
- **Completion source/write target:** `cahaya_app/capaian_materi_guru/{completionId}`.
- **Important functions:** `buildAssignments`, `generateMeetings`, `meetingPayloadFor`, `folderPath`, `saveMeeting`, `saveAllFilled`, `saveReport`, `completionFor`.
- **Write paths:** targets below `{assignmentKey}/semester_{n}/pertemuan_{n}`; completion records under `cahaya_app/capaian_materi_guru`.
- **Dependencies:** exact schedule allocation, combined grouping, calendar blocking rules, teacher identity, assignment/material keys.
- **Expected behavior:** target material follows the Guru's real assignments; multi-checklist completion is reflected in home/KPI. Existing auto-seed behavior is frozen, not invoked or changed by ops foundation.

### 4. Nilai Ujian

- **Source file:** `guru/inputNilaiUjian.html`.
- **Authoritative class/schedule sources:** bundled/current schedule and `cahaya_app/master_akademik/kelas` with local master fallback.
- **Write/read paths:** monthly results `cahaya_app/nilai_ujian_bulanan`; other assessments `cahaya_app/nilai_ujian`.
- **Related indexes/summary:** page-defined score session/index/final paths and wali indexes must remain intact.
- **Important functions:** `loadLocalSchedule`, `buildTeacherSubjectMap`, `classesForActiveAssessment`, `buildStudentsForSelectedSubject`, `currentExamParams`, `loadExistingScoresForCurrentSetup`, score validation/recalculation/save functions.
- **Dependencies:** assessment type/period, schedule teacher-mapel allocation, class roster, stable session/student keys, grading weights.
- **Expected behavior:** Guru can only select assigned mapel/classes; existing monthly and non-monthly schemas and calculations remain unchanged.

### 5. Tindak Lanjut Akademik

- **Source file:** `guru/tindak-lanjut.html`.
- **Evidence read source:** `cahaya_app/nilai_ujian_bulanan` plus schedule.
- **Write/read target:** `cahaya_app/tindak_lanjut_guru/{teacherKey}/{academicYearKey}/{periodKey}`.
- **Important functions:** `detectTeacherCode`, `loadKpiSource`, `loadData`, `actionableScores`, `followPath`, `recordKey`, `followData`.
- **Dependencies:** teacher identity, exact score session, period/month matching, KKM/actionable status.
- **Expected behavior:** only relevant low/actionable results for the current Guru appear; action status persists per teacher/year/period.

### 6. KPI Guru

- **Source file:** `pendidikan/kpi-guru.html`; computation module `js/guru-kpi-v144.js`; cards also consumed by `home-guru.html`.
- **Read paths:**
  - `cahaya_app/jadwal_pelajaran`
  - `cahaya_app/log_absensi_guru`
  - `cahaya_app/nilai_ujian_bulanan`
  - `cahaya_app/setoran_tahfiz`
  - `observasi_lapangan`
  - `cahaya_app/absensi_pembelajaran`
  - `kalender_materi_pembelajaran/ta_2026_2027`
  - `cahaya_app/capaian_materi_guru`
  - `kalender_pendidikan/ta_2026_2027/events`
  - `cahaya_app/pengaturan_guru_mukim`
  - `cahaya_app/absensi_ibadah_guru`
  - `cahaya_app/master_akademik/kelas`
- **Write path:** KPI view is read/compute oriented; operational coaching buttons belong outside Guru production behavior.
- **Important functions:** `CahayaGuruKPI.compute`, `identityFromProfile`, `assignedSchedule`, `onlyKepondokan`, `curriculumKpi`, `compute`, `teacherIdentities`.
- **Dependencies:** available-evidence rule, current month, teacher identity, kepondokan scope, target/calendar dates, resident status.
- **Expected behavior:** missing indicators are excluded from the divisor; Tahfiz applies only to relevant Al-Qur'an assignments; PKBM rows are excluded from the kepondokan KPI workspace.

### 7. Data Guru

- **Source file:** `config/master-data.js` (`CAHAYA_MASTER_DATA.teachers`, `pkbmTeachers`) and `js/data-pusat.js` (`window.dataGuru`).
- **Authoritative operational identity:** current login profile plus `guruKode` in schedule. The local master is the bundled fallback.
- **Read dependencies:** teacher aliases, username, display name, role/localStorage identity.
- **Write path:** none in Guru feature baseline.
- **Expected behavior:** identity matching must remain backward-compatible; do not rename teacher codes or silently merge identities.

### 8. Data Santri / class / group mapping

- **Source file:** `config/master-data.js` (`santriByClass`, `pkbmSantriByClass`, `pkbmClassByStudent`, `usrah`) and `js/data-pusat.js` (`window.dataSantri`).
- **Authoritative runtime source:** `cahaya_app/master_akademik/kelas`; some legacy features also reference `cahaya_app/data_santri`.
- **Qur'an program source:** `cahaya_app/program_quran_santri`.
- **Important functions:** local master accessors, `buildClassSource`, `getStudents`, `studentClassMap`, `refreshAutoQuranClasses`.
- **Dependencies:** exact original student spelling, class scope, Putra/Putri marker, PKBM versus kepondokan distinction.
- **Write path:** Guru learning pages consume these mappings; they must not become a second master.
- **Expected behavior:** class membership and combined groups resolve exactly as today.

### 9. Tahsin / Tahfiz / Murojaah

- **Source file:** `guru/inputSetoranTahfiz.html`.
- **Read paths:** `cahaya_app/setoran_tahfiz`, `cahaya_app/master_akademik/kelas`, `cahaya_app/program_quran_santri`, calendar/schedule helpers.
- **Write paths:** `cahaya_app/setoran_tahfiz`, `cahaya_app/target_tahfiz`, `cahaya_app/wali_index/{waliKey}/tahfiz/{recordId}`.
- **Important functions:** `recentTahfizQuery`, `refreshAutoQuranClasses`, `ensureTahfizMeta`, `ensureTahfizTargets`, multi-surat Tahsin/Tahfiz calculation/save functions.
- **Expected behavior:** single- and multi-surat entry, target, history, edit/delete, and wali index remain unchanged.

## Frozen operational cases

1. **Al-Qur'an:** preserve the final legacy schedule exactly, including morning and later sessions and existing teacher allocation.
2. **Teacher-to-subject allocation:** `guruKode + mapel + kelas + day/time` is contractual input; no ops adapter may rewrite it.
3. **Combined teaching groups:** same teacher/mapel/time groups stay combined where current assignment builders combine them.
4. **Multazam Bahasa Arab:** the final UI/domain grouping is **Juz 1 / Juz 2**, even though the schedule rows are class-based. Existing split logic and student mapping are canonical.
5. **Hadits Ahkam:** the combined session at Selasa 09:20–11:20 for Kelas 4 Putra, Kelas 5 Putra, and Kelas 4 Putri with Multazam is preserved.
6. **Alamanda combined Putri:** Bahasa Arab and Al-Qur'an for Kelas 3 Putri + Kelas 4 Putri at matching times remain genuine combined groups.
7. **PKBM vs Kepondokan:** keep both scopes distinguishable. Operational Manager Pendidikan Zaky consumes kepondokan only; PKBM remains a separate authority.

## Baseline risks

- The working tree was already dirty before this audit. A dedicated backup commit captures it, but `main` itself does not yet contain those changes.
- The Firebase live schedule can differ from the bundled JSON; adapters must declare which source won and expose drift.
- Teacher identity is partly alias/name based; two schedule codes (`ALAMANDA`, `PEMBINA_EKSKUL`) are absent from the static teacher master.
- Material page includes legacy compatibility paths and seed behavior; ops must remain read-only initially.
- Root and `docs/` contain deployment mirrors. Future production changes require an explicit sync policy; this audit intentionally changes documentation/foundation only.
