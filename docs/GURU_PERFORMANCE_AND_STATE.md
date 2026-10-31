# Guru Performance and Presensi State

## Scope

Finalisasi ini mempertahankan visual Golden Guru Baseline `aa92614`. Tidak ada redesign, perubahan jadwal/alokasi guru, perubahan schema Firebase, ataupun pembangunan Manager Pendidikan.

## Root Cause

### Loading awal

Home Guru sudah memakai file jadwal lokal dan beberapa cache, tetapi pembacaan data masih dikelompokkan dalam dua `Promise.all`. Akibatnya, satu sumber lambat menahan pembaruan semua kartu dalam kelompoknya. Presensi lebih berat: jadwal lokal, guru pengganti, target materi, capaian materi, dan master kelas Firebase ditunggu bersama sebelum jadwal dirender.

Selain itu, Presensi masih memiliki overlay loading penuh yang sempat terlihat walaupun master santri/kelas lokal sudah cukup untuk menggambar shell awal.

### State sukses lama

`main-dashboard.html` mempertahankan iframe halaman Guru dalam cache agar perpindahan halaman hemat bandwidth. Overlay `attendanceSuccessOverlay` adalah state DOM sementara. Setelah sukses dan kembali ke Home, iframe Presensi diparkir tanpa dihancurkan. Ketika iframe yang sama diaktifkan kembali, class `show`, timer redirect, dan toast lama masih hidup karena halaman tidak menjalankan ulang inisialisasi.

## Strategi Loading Baru

### Guru Home

Shell HTML, greeting, menu, dan kartu tampil tanpa menunggu Firebase. Urutan data:

1. Jadwal dibaca dari cache/file lokal `data/jadwal-pelajaran-awal-2026-2027.json`.
2. Data kehadiran pekan, izin/sakit, dan perizinan ringkas berjalan sebagai task terpisah; masing-masing hanya memperbarui kartu terkait.
3. Tujuh sumber KPI berjalan independen. Setiap sumber yang selesai memicu kalkulasi ulang dari data yang sudah tersedia.
4. `Promise.allSettled` memastikan kegagalan/lambatnya satu sumber tidak membatalkan sumber lain.
5. Query transaksi periode tetap menggunakan cache session yang sudah ada; jadwal lokal tetap memakai cache persisten 12 jam.

State awal tetap berupa nilai placeholder `—`; data tersedia memperbarui kartu, data yang memang kosong tetap dihitung sebagai belum tersedia oleh mesin KPI, dan kegagalan jaringan dicatat terpisah di console tanpa menghapus nilai sumber lain.

### Presensi

1. Overlay loading penuh tidak lagi ditampilkan untuk pembukaan rutin.
2. Master lokal dari `config/master-data.js` langsung dipakai.
3. Jadwal lokal/cache dirender tanpa menunggu Firebase.
4. Guru berhalangan, target/capaian materi, dan master kelas daring dimuat independen di belakang layar.
5. Sumber yang lambat tidak menahan daftar jadwal.

Shell utama juga tidak menampilkan loader halaman penuh untuk Home dan halaman kerja Guru. Iframe langsung ditempatkan, sementara placeholder bawaan masing-masing halaman menjaga state loading tetap jujur. Loader global tetap dipakai untuk role/halaman lain yang belum memakai pola ini.

## Firebase Reads — Guru Home

Pembacaan yang tetap digunakan:

- `cahaya_app/absensi_guru/{tanggal}` — kehadiran per tanggal.
- `cahaya_app/log_absensi_guru` — query tanggal untuk fallback/rekap KPI.
- `cahaya_app/izin_sakit_harian/{tanggal}` — izin/sakit hari ini.
- `cahaya_app/perizinan_ringkas` — query `tanggalPengajuan` untuk rentang ringkas.
- `cahaya_app/nilai_ujian_bulanan` — query `tanggal_ujian` bulan berjalan.
- `cahaya_app/setoran_tahfiz` — query `tanggal` bulan berjalan.
- `observasi_lapangan` — query `tanggal` bulan berjalan.
- `kalender_materi_pembelajaran/ta_2026_2027`.
- `cahaya_app/capaian_materi_guru`.
- `kalender_pendidikan/ta_2026_2027/events`.

Listener realtime hari ini tetap dibatasi pada `cahaya_app/absensi_guru/{tanggal}/{teacherKey}`.

## Firebase Reads — Presensi Open

- `cahaya_app/guru_berhalangan` — query tanggal hari ini, cache 60 detik.
- `kalender_materi_pembelajaran/ta_2026_2027` dan `cahaya_app/capaian_materi_guru` — data pemilihan materi, dimuat di background.
- `cahaya_app/master_akademik/kelas` — penyegaran master kelas di background; file master lokal tetap menjadi first paint.
- `cahaya_app/absensi_pembelajaran` — hanya query `tanggal` saat jadwal dipilih/diresume, cache 120 detik.

Jadwal utama berasal dari file lokal/cache, bukan full-read Firebase.

## Duplicate Reads Removed / Avoided

- Presensi tidak lagi menunggu master kelas Firebase sebelum menampilkan jadwal.
- Target materi tidak lagi berada pada critical path daftar jadwal.
- Cache shell `CahayaDataCache` dan cache jadwal Home digunakan kembali oleh Presensi.
- Saat iframe Presensi diresume, hanya query absensi hari ini yang dipaksa segar jika ada jadwal aktif; halaman dan seluruh master tidak direload.
- Event resume ganda (`CustomEvent` dan `postMessage`) dideduplikasi dengan satu promise aktif dan cooldown 500 ms.

## State Reset Mechanism

Pada `cahaya:resume` atau pesan `CAHAYA_PAGE_RESUME`, Presensi:

1. membatalkan timer redirect sukses lama;
2. menghapus class `show` dari overlay sukses;
3. mengembalikan `aria-hidden=true`;
4. menutup toast lama;
5. mengembalikan tombol simpan dari state loading;
6. menyelaraskan tanggal hari ini;
7. jika ada jadwal aktif, mengambil ulang absensi hari ini dan menjalankan `restoreTwoStageAttendance()`;
8. jika belum ada jadwal aktif, membangun ulang picker jadwal dari data yang sudah dimuat.

Dengan demikian UI transisi sukses tidak menjadi state operasional. Record Firebase menentukan apakah jadwal berada pada `AWAL`, `FINAL`, atau `FINAL_VIEW`.

## Paths yang Dipertahankan

Write paths tidak berubah:

- `cahaya_app/absensi_pembelajaran/{id}`
- `cahaya_app/wali_index/{waliKey}/pembelajaran/{id}`
- path capaian materi yang sudah dibentuk oleh `materialCompletionUpdates()`

Read paths, schema payload, teacher allocation, jadwal Al-Qur'an/Bahasa Arab, kelas gabungan, dan logika Tahsin/Tahfiz tidak diubah.

## Regression Checklist

- [x] Golden Guru Home tetap memakai layout dan CSS yang sama.
- [x] Viewport 409 × 720 tidak memiliki overlap atau bottom nav ganda.
- [x] Home merender tanpa menunggu kumpulan request Firebase.
- [x] Presensi menampilkan daftar jadwal tanpa overlay loading penuh.
- [x] State sukses dibersihkan saat iframe diresume.
- [x] Jadwal aktif direkonsiliasi dari record absensi hari ini.
- [x] Memilih jadwal lain tetap memakai alur normal.
- [x] Refresh tidak membawa class overlay sukses karena state itu tidak disimpan ke storage.
- [x] Path Firebase read/write tetap sama.
- [x] Root dan mirror `/docs` sinkron.

Pengujian tidak mengirim absensi produksi; lifecycle sukses diverifikasi melalui jalur reset/resume dan pemeriksaan DOM, sedangkan write path diverifikasi secara statis agar data produksi tidak tersentuh.
