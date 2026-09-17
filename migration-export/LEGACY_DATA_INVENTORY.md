# CAHAYA APP Legacy Data Inventory

Export dibuat pada 2026-09-16 untuk persiapan `CahayaAppV2`. Proses ini hanya membaca berkas lokal. Tidak ada koneksi tulis ke Firebase dan tidak ada perubahan pada aplikasi produksi.

## Keputusan sumber otoritatif

| Dataset | Sumber yang dipilih untuk ekspor | Alasan |
|---|---|---|
| Guru/staf Pendidikan | `config/master-data.js` → `CAHAYA_MASTER_DATA.teachers`, diperkaya `pkbmTeachers` | `js/data-pusat.js` secara eksplisit menjadikan `CAHAYA_MASTER_DATA` pengganti data global lama. Kode guru juga menjadi foreign key jadwal. |
| Santri | `config/master-data.js` → `CAHAYA_MASTER_DATA.santriByClass` | Merupakan roster statis terlengkap di repo dan dipakai sebagai fallback/master lokal. Sumber runtime Firebase tetap lebih mutakhir bila tersedia. |
| Kelas/grup | key dari `CAHAYA_MASTER_DATA.santriByClass` | Menyediakan daftar kelas sekaligus relasi santri-kelas. `master_akademik/kelas` di Firebase adalah sumber runtime, tetapi isinya tidak tersedia dalam checkout. |
| Mata pelajaran | `CAHAYA_MASTER_DATA.subjects`, ditambah nama mapel yang benar-benar muncul di snapshot jadwal | Master memberi vocabulary utama; enam nama jadwal tidak ada di master dan dipertahankan sebagai record bertanda `missing-from-master-subjects`, bukan disamakan secara spekulatif. |
| Penugasan mengajar | Diturunkan deterministik dari snapshot jadwal berdasarkan `(guruKode, mapel, kelas)` | Tidak ditemukan koleksi penugasan statis terpisah yang lebih otoritatif. Setiap record menyimpan semua ID jadwal sumber. |
| Jadwal pelajaran | `data/jadwal-pelajaran-awal-2026-2027.json` | Ini snapshot JSON mandiri yang dibaca oleh banyak halaman sebagai fallback. Firebase `cahaya_app/jadwal_pelajaran` adalah sumber runtime paling otoritatif, tetapi tidak diekspor karena task melarang akses/migrasi Firebase. |
| Kalender akademik | `data/kalender-pendidikan-2026-2027.json` | Snapshot lokal lengkap dan terstruktur. Runtime juga mengenal `kalender_pendidikan/ta_2026_2027/events`. |
| Target materi semester | Tidak ada payload statis yang dapat dipercaya | Data aktual berada di Firebase `kalender_materi_pembelajaran/ta_2026_2027` (lama: `guru_kits_materi/ta_2026_2027`). Repo hanya berisi schema, pembaca, dan generator/seed, bukan snapshot aktual. `material-targets.json` sengaja kosong. |

## 1. Guru / staf Pendidikan

- Sumber: `config/master-data.js`
- Struktur: `window.CAHAYA_MASTER_DATA.teachers` (array kode) dan `window.CAHAYA_MASTER_DATA.pkbmTeachers` (object `{code,name,username,aliases}`)
- Jenis: statis; direferensikan oleh jadwal Firebase dan snapshot lokal
- Field sumber: `code`, `name`, `username`, `aliases`; pada `teachers` dasar hanya nilai kode string
- Jumlah sumber: 25 kode guru; 12 memiliki metadata PKBM
- Jumlah ekspor: 25
- ID: kode guru asli disimpan sebagai `legacyId`
- Referensi: `jadwal[].guruKode`
- Catatan kualitas: `ALAMANDA` dan `PEMBINA_EKSKUL` muncul di jadwal tetapi tidak terdapat dalam master guru. Nama manusia untuk guru non-PKBM sering tidak tersedia; `originalName` karena itu sama dengan kode.
- Otoritatif: ya untuk master statis yang tersedia; kemungkinan berada di bawah data runtime Firebase untuk kondisi terkini.

## 2. Santri

- Sumber: `config/master-data.js`
- Struktur: `CAHAYA_MASTER_DATA.santriByClass`, object `{namaKelas: [namaSantri...]}`
- Jenis: statis/fallback. Path runtime yang ditemukan: `cahaya_app/data_santri`
- Field sumber: nama kelas (key object), nama santri (string)
- Jumlah sumber: 219 keanggotaan kelas; 122 ejaan nama unik persis; 119 nama unik setelah normalisasi tanda baca/spasi
- Jumlah ekspor: 122 record nama persis dengan array `classMemberships`
- ID: tidak ada ID santri stabil pada sumber; dibuat `legacyKey` deterministik dari nama persis + SHA-1 pendek. Nama asli selalu dipertahankan.
- Referensi: kelas melalui `classMemberships[].classLegacyKey`
- Duplikasi: banyak santri sengaja muncul dua kali karena memiliki kelas kepondokan dan PKBM. Tiga kelompok ejaan hanya berbeda tanda baca/spasi; lihat laporan kualitas.
- Struktur pendamping: `pkbmSantriByClass` (9 kelas, konsisten dengan subset PKBM di `santriByClass`) dan `pkbmClassByStudent` (119 key termasuk tujuh alias historis).
- Otoritatif: ya untuk snapshot lokal; Firebase runtime dapat lebih mutakhir.

## 3. Kelas / grup

- Sumber: key `CAHAYA_MASTER_DATA.santriByClass`
- Struktur: nama kelas sebagai key object
- Jenis: statis; path runtime ditemukan di `cahaya_app/master_akademik/kelas` dan `cahaya_app/master_ruang_kelas`
- Field ekspor: `legacyKey`, `originalName`, `scope`, `unit`, `studentCount`
- Jumlah: 18 (9 kepondokan, 9 PKBM)
- Referensi: roster santri dan `jadwal[].kelas`
- Konsistensi: seluruh kelas pada snapshot jadwal ditemukan dalam master kelas.
- Otoritatif: ya untuk snapshot lokal.

## 4. Mata pelajaran

- Sumber utama: `CAHAYA_MASTER_DATA.subjects`
- Sumber tambahan observasional: `data/jadwal-pelajaran-awal-2026-2027.json` → `mapel`
- Jenis: statis
- Field sumber: nama string; pada jadwal `mapel`
- Jumlah: 35 nama master + 6 nama yang hanya muncul di jadwal = 41 ekspor
- ID: tidak ada ID stabil; `legacyKey` deterministik dari nama asli
- Referensi: `jadwal[].mapel`
- Inkonsistensi: nama jadwal-only adalah `Al-Qur’an`, `Aqidah Tasawuf`, `Hadits`, `Hadits Ahkam`, `Manajemen dan Bisnis`, dan `Nahwu Sharaf`. Record tersebut ditandai `masterStatus`.
- Otoritatif: master untuk vocabulary; snapshot jadwal otoritatif untuk teks yang benar-benar direferensikan jadwal. Tidak ada alias yang diterapkan otomatis.

## 5. Penugasan mengajar

- Sumber: derivasi dari `data/jadwal-pelajaran-awal-2026-2027.json`
- Struktur identitas: kombinasi persis `(guruKode, mapel, kelas)`
- Jenis: hasil normalisasi snapshot statis, bukan koleksi sumber terpisah
- Field: `teacherLegacyId`, `subjectLegacyKey`, `classLegacyKey`, nama asli mapel/kelas, `scheduleLegacyIds`
- Jumlah: 186
- ID: `legacyKey` deterministik SHA-1 pendek dari kombinasi sumber
- Otoritatif: representasi derivatif yang dapat direproduksi; perlu rekonsiliasi dengan Firebase sebelum migrasi aktual.

## 6. Jadwal pelajaran saat ini

- Sumber ekspor: `data/jadwal-pelajaran-awal-2026-2027.json`
- Struktur: array object
- Jenis: snapshot statis/fallback; sumber runtime: Firebase `cahaya_app/jadwal_pelajaran`
- Field sumber: `id`, `aktif`, `unit`, `kelas`, `nomorKelas`, `hari`, `hariLabel`, `mapel`, `guruKode`, `jenis`, `sesi`, `jamMulai`, `jamSelesai`, `urutan`, `tahunAjaran`; sebagian record juga mempunyai `waktuLabel`, `sumber`, atau `guruNama`
- Jumlah: 281, semuanya aktif
- ID: `id` sumber dipertahankan sebagai `legacyId`
- Rentang akademik: `2026/2027`
- Referensi: guru, kelas, mata pelajaran
- Konflik sumber: `admin/atur-jadwal.html` memiliki `DEFAULT_ROWS` 285 record. Empat record tambahan adalah Bahasa Arab oleh Faiq, Kelas 2 Putra, Senin–Kamis 05:10–06:00. Tidak ada record JSON yang berubah atau hilang selain empat tambahan tersebut. Karena status mutakhirnya tidak dapat dibuktikan tanpa Firebase, empat record ini tidak digabungkan ke ekspor.
- Otoritatif: Firebase runtime paling otoritatif; JSON dipilih sebagai snapshot lokal resmi yang dapat diaudit.

## 7. Kalender akademik dan target materi

### Kalender akademik

- Sumber: `data/kalender-pendidikan-2026-2027.json`
- Struktur: array object
- Jenis: snapshot statis; path runtime `kalender_pendidikan/ta_2026_2027/events`
- Field sumber: `id`, `date`, `startDate`, `endDate`, `title`, `type`, `source`
- Jumlah: 293
- Rentang tanggal: 2026-07-03 sampai 2027-07-10
- ID: `id` sumber dipertahankan
- Pemeriksaan dasar: tidak ada ID duplikat dan tidak ada record tanpa ID/judul/tanggal efektif.

### Target materi / target semester

- Definisi runtime utama: `guru/capaian-materi.html`
- Konsumen lain yang diperiksa: `rpp-generator.html`, `cetak-kalender-materi.html`, `guru/absensiPembelajaran.html`, `manajer/materi-pembelajaran.html`, `pendidikan/kpi-guru.html`
- Path Firebase utama: `kalender_materi_pembelajaran/ta_2026_2027`
- Path lama: `guru_kits_materi/ta_2026_2027`
- Field payload yang ditemukan: `tahunAjaran`, `tahunAjaranKey`, `semester`, `assignmentId`, `assignmentKey`, `materialGroupKey`, `teacher`, `sectionId`, `section`, `kelas`, `kelasLabel`, `classNames`, `classNumbers`, `isCombined`, `sourceAssignmentIds`, `virtualJuz`, `virtualJuzLabel`, `scheduleStart`, `scheduleEnd`, `sessionLabel`, `subject`, `days`, `dayLabel`, `meetingNo`, `date`, `longDate`, `notes`, `material`, `updatedAt`, `source`
- Jumlah payload statis aktual: 0
- Catatan: terdapat generator seed khusus sebagian target Bahasa Arab Multazam. Itu adalah logika pembuat data, bukan bukti snapshot aktual, sehingga tidak dijalankan dan tidak diekspor.
- Otoritatif: Firebase saja. Ekspor aktual belum dapat dilakukan dari repository tanpa pembacaan terpisah yang diotorisasi.

## Berkas yang diperiksa

Pemeriksaan langsung dilakukan terhadap:

- `config/master-data.js`
- `js/data-pusat.js`
- `js/cahaya-bandwidth.js`
- `data/jadwal-pelajaran-awal-2026-2027.json`
- `data/kalender-pendidikan-2026-2027.json`
- `admin/atur-jadwal.html`
- `guru/capaian-materi.html`
- `guru/absensiPembelajaran.html`
- `guru/inputSetoranTahfiz.html`
- `guru/inputNilaiUjian.html`
- `guru/tindak-lanjut.html`
- `home-guru.html`
- `home-direktur.html`
- `rpp-generator.html`
- `cetak-kalender-materi.html`
- `manajer/jadwal-pendidikan.html`
- `manajer/materi-pembelajaran.html`
- `pendidikan/kpi-guru.html`
- `pimpinan/dashboard-pendidikan.html`

Salinan deployment di bawah `docs/` ditemukan, tetapi tidak dipilih sebagai sumber tambahan karena merupakan duplikasi distribusi dari struktur root dan berisiko menggandakan fakta yang sama.
