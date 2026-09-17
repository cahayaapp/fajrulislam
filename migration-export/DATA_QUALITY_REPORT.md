# CAHAYA APP Legacy Data Quality Report

Klasifikasi:

- `SAFE_AUTO_FIX`: normalisasi teknis yang deterministik dan tidak mengubah makna.
- `NEEDS_REVIEW`: tersedia beberapa interpretasi; manusia perlu menentukan canonical value.
- `BLOCKER`: data migrasi aktual tidak dapat dibuktikan dari repository ini.

Tidak ada isu ambigu yang diperbaiki diam-diam di file ekspor.

## Ringkasan

| Tingkat | Isu |
|---|---|
| SAFE_AUTO_FIX | Stable migration key untuk entitas tanpa ID; trim/normalisasi hanya untuk pencocokan dan audit; nilai asli tetap dipertahankan. |
| NEEDS_REVIEW | Keanggotaan santri ganda lintas kelas, varian ejaan nama santri, dua referensi guru tanpa master, enam nama mapel tanpa master, konflik 281 vs 285 jadwal. |
| BLOCKER | Target materi aktual dan state jadwal runtime berada di Firebase dan tidak tersedia sebagai snapshot lokal. |

## Guru

### Nama/kode guru duplikat

- Tidak ditemukan duplikat persis atau duplikat setelah normalisasi pada 25 kode master.

### Guru jadwal yang hilang dari master — `NEEDS_REVIEW`

- `ALAMANDA`
- `PEMBINA_EKSKUL`

Keduanya dipertahankan sebagai foreign key pada `schedules.json` dan `teaching-assignments.json`, tetapi tidak dibuatkan profil guru rekaan di `teachers.json`.

## Santri

### Keanggotaan/nama berulang — `NEEDS_REVIEW`

- Sumber memuat 219 keanggotaan kelas tetapi hanya 122 string nama unik.
- 97 nama persis muncul pada lebih dari satu kelas, terutama satu kelas kepondokan dan satu kelas PKBM. Ini tampak sebagai relasi banyak-kelas yang disengaja, bukan duplikasi yang aman untuk dihapus.
- Ekspor membentuk satu record per string nama persis dan mempertahankan semua `classMemberships`.

### Varian yang sama setelah normalisasi tanda baca/spasi — `NEEDS_REVIEW`

- `M. UMAR HALIM RAHMAPUTRA` ↔ `M. UMAR HALIMRAHMAPUTRA`
- `MUHAMMAD FIRAAS AL - INSYIROH` ↔ `MUHAMMAD FIRAAS AL-INSYIROH`
- `NABILA NUR WAMAWADDA AL- MAIRA` ↔ `NABILA NUR WAMAWADDA AL MAIRA`

Mereka tidak digabungkan karena repo tidak menyediakan ID santri stabil.

### Alias historis PKBM — `NEEDS_REVIEW`

`pkbmClassByStudent` berisi tujuh key alias yang tidak muncul persis dalam roster PKBM saat ini:

- `MUHAMADYUSUFARROSIYD` → `PKBM VIII B Putra`
- `HAFIDZALROZI` → `PKBM IX B Putra`
- `MUHAMMADRIJALULKAMIL` → `PKBM IX B Putra`
- `ALIFMUHAMMADYUSUF` → `PKBM XI`
- `KAMABDULLAHSHIDDIQAGTSALI` → `PKBM XII`
- `JESSICAPUTRYAYRA` → `PKBM IX A Putri`
- `WINDYWINDARI` → `PKBM IX A Putri`

Kemungkinan pasangannya terlihat dalam roster, tetapi penyatuan harus memakai ID siswa atau konfirmasi manual.

## Kelas

### Nama kelas tidak konsisten

- Tidak ditemukan referensi jadwal ke kelas yang hilang dari 18 kelas master.
- `pkbmSantriByClass` cocok dengan subset sembilan kelas PKBM di `santriByClass` setelah normalisasi nama.
- Kelas `PKBM X`, `PKBM XI`, dan `PKBM XII` tidak menyatakan gender pada nama. Diklasifikasikan `mixed-or-unspecified`; jangan diasumsikan Putra/Putri.

## Mata pelajaran

### Nama mapel jadwal hilang dari master — `NEEDS_REVIEW`

- `Al-Qur’an`
- `Aqidah Tasawuf`
- `Hadits`
- `Hadits Ahkam`
- `Manajemen dan Bisnis`
- `Nahwu Sharaf`

Sebagian mungkin gabungan atau alias master (`AQIDAH`, `NAHWU`, `SHARAF`, `KEWIRAUSAHAAN`, `TAHFIZ`, `TAHSIN`), tetapi relasi tersebut tidak diterapkan otomatis. Keenam nama tetap diekspor sebagai subject observasional.

## Jadwal

### Konflik snapshot — `NEEDS_REVIEW`

- `data/jadwal-pelajaran-awal-2026-2027.json`: 281 record.
- `admin/atur-jadwal.html#DEFAULT_ROWS`: 285 record.
- Empat record hanya ada pada embedded admin: Bahasa Arab, Faiq, Kelas 2 Putra, Senin–Kamis, 05:10–06:00.
- Tidak ada perubahan isi pada 281 ID yang sama.

Ekspor menggunakan file JSON dan tidak memasukkan empat record tambahan sampai state Firebase `cahaya_app/jadwal_pelajaran` dapat dibandingkan.

### Jadwal malformed

- ID duplikat: 0
- Record tanpa ID/guru/mapel/kelas/hari/jam: 0
- Record dengan `jamMulai >= jamSelesai`: 0
- Record nonaktif: 0

### Current vs obsolete

- Semua snapshot bertahun ajaran `2026/2027` dan `aktif: true`.
- Tidak ada metadata revisi/perubahan yang cukup untuk membuktikan apakah snapshot JSON atau empat baris tambahan admin adalah versi paling baru.
- State live Firebase adalah penentu final sebelum migrasi aktual. `BLOCKER` untuk cutover, bukan untuk inventory.

## Kalender akademik

- Jumlah record: 293
- ID duplikat: 0
- Record tanpa ID, judul, atau tanggal efektif: 0
- Rentang 2026-07-03 hingga 2027-07-10 tampak melampaui label tahun ajaran secara wajar, tetapi definisi semester/tahun perlu dikonfirmasi pada migrasi final.

## Target materi — `BLOCKER`

- Tidak ada snapshot nilai target materi di repository.
- Data aktual dirujuk melalui Firebase `kalender_materi_pembelajaran/ta_2026_2027`; data lama melalui `guru_kits_materi/ta_2026_2027`.
- Mapping target dapat mengandung assignment, teacher, subject, section, kelas tunggal/gabungan, virtual juz, pertemuan, dan tanggal.
- Karena Firebase tidak dibaca dan generator seed tidak dijalankan, mapping guru/kelas target aktual tidak dapat diaudit.
- `material-targets.json` berisi array kosong, bukan data buatan.

## Normalisasi yang aman — `SAFE_AUTO_FIX`

- `legacyId` asli dipertahankan bila ada.
- `legacyKey` deterministik dibuat bila tidak ada ID stabil.
- `originalName` dan/atau `originalRecord` dipertahankan.
- Normalized name key hanya membantu deteksi kesamaan; tidak mengganti nama sumber.
- Penugasan mengajar merupakan derivasi reproducible dan menyimpan seluruh `scheduleLegacyIds` sumber.

## Pemeriksaan wajib sebelum migrasi aktual

1. Ambil read-only snapshot Firebase untuk master santri, kelas, jadwal, kalender, dan target materi.
2. Cocokkan guru `ALAMANDA` dan `PEMBINA_EKSKUL` dengan master identitas resmi.
3. Tetapkan canonical student ID dan review varian nama.
4. Tetapkan alias/canonical subject mapping.
5. Putuskan status empat jadwal embedded admin.
6. Audit target materi aktual termasuk kelas gabungan dan virtual juz.
