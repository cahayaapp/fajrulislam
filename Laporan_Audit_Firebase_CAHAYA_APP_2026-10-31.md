# AUDIT & PATCH HEMAT BANDWIDTH — CAHAYA APP
**Tanggal:** 31 Oktober 2026  
**Dasar:** arsip yang diunggah `fajrulislam 2.zip`  
**Sasaran:** menekan unduhan Firebase Realtime Database tanpa menghapus data, mengubah rules produksi, atau memotong histori kasus yang masih terbuka.

## Ringkasan eksekutif

Dari tangkapan layar pengguna (periode penagihan 1–31 Oktober), **Downloads 19,13 GB** melampaui kuota gratis **10 GB**; Storage 143,26 MB dan Connections 23/100 bukan sumber pelampauan pada layar tersebut. Angka Downloads ini bersifat agregat; tidak menunjukkan halaman atau path yang menghabiskan kuota. Karena itu, **penurunan bandwidth akibat patch belum bisa diukur atau dijamin di bawah 10 GB/bulan** tanpa profil server dan pemantauan setelah publikasi.

### Temuan kritis — audit keamanan

Di arsip, file `firebase-rtdb-rules-cahaya-app-v20.json` memuat dua aturan pada node akar:

```json
".read": true,
".write": true
```

File `firebase.json` merujuk file ini sebagai database rules. **Jika** ini pula aturan aktif di proyek produksi, semua klien dapat membaca dan menulis RTDB tanpa autentikasi: risiko kebocoran data, perusakan data, dan unduhan oleh pihak luar. **Belum ada bukti bahwa rules yang aktif di konsol produksi sama dengan file dalam ZIP.** Patch ini sengaja **tidak** mengubah rules, karena penguncian membabi-buta dapat membuat halaman guru, santri, wali, dan staf tidak berfungsi. Langkah prioritas adalah membandingkan isi tab Realtime Database > Rules yang saat ini aktif, lalu merancang dan menguji rules berdasarkan Firebase Authentication, role, unit, dan akses tiap path melalui Emulator sebelum penerapan.

## Perubahan kode yang benar-benar dibuat

| Lokasi (masing-masing pada root dan `docs/`) | Sebelum | Sesudah | Catatan fungsional |
| --- | --- | --- | --- |
| `home.html` | Beranda Naqib mengunduh 250 record paling akhir dari absensi program dan laporan inisiatif, baru disaring per tanggal. | `orderByChild('tanggal').startAt(kemarin).endAt(hariIni)` yang didukung `.indexOn: ["tanggal"]`. | Dua hari diperlukan untuk kompatibilitas beberapa catatan lama yang memakai tanggal UTC, lalu tetap difilter sebagai hari WIB. |
| `wali/dashboard/beranda.html` | Untuk lima kategori index santri, aplikasi melakukan `.once('value')` lalu memasang `.on('value')` pada path serupa; hasil awal berpotensi diunduh dua kali. | Snapshot pertama listener realtime menjadi juga data awal. Semua listener tetap aktif dan dilepas ketika profil berganti. | Beranda, linimasa dan media tetap diperbarui realtime. Panggilan `bacaSumberRT()` lama tidak dipakai pada startup. |
| `js/counselor-simplified-v3.js` | Menu Buku Konseling memuat tiga sumber riwayat berindeks tanggal sejak 2019 beserta rekap buku setiap kali dibuka. | Pembukaan awal mengambil `cahaya_app/buku_kasus_konselor` saja. Pembacaan sumber lama lengkap hanya setelah tindakan eksplisit. | Arsip lama tidak dihapus; pengguna menekan `Muat Arsip Lengkap` untuk menggabungkan catatan yang belum terindeks. Halaman Kasus Masuk dan Kasus Terbuka **tidak dipangkas**. |
| `konselor/workspace-v3.html` | Tidak ada pilihan untuk memuat arsip lama secara terpisah. | Tombol `Muat Arsip Lengkap` dan keterangan; versi cache JS/CSS dinaikkan. | Pengguna memahami bahwa ringkasan awal mungkin belum mencakup catatan pra-indeks. |
| `css/counselor-simplified-v3.css` | Belum ada gaya khusus keterangan arsip. | Gaya teks dan status tombol. | Tidak mengubah pola tata letak utama. |

**File yang berubah untuk dijalankan:** 10 file (5 file pada root + 5 mirror di `docs/`).  
**Pengujian:** satu berkas tes baru `tests/bandwidth-optimizations.cjs`, dua pengujian tambahan pada `tests/counselor-workspace-bootstrap-v3.cjs`.

## Hasil verifikasi

- **Baseline source awal:** 133 tes, 81 lulus, 52 gagal.
- **Source patch:** 137 tes, 85 lulus, 52 gagal.
- **Tidak muncul kegagalan tes baru:** seluruh nama tes gagal pada patch sama persis dengan baseline source awal.
- **Tes optimasi dan bootstrap konselor:** 18/18 lulus.
- **Sintaks:** `node --check` untuk JS konselor dan seluruh inline script HTML yang diubah (root dan `docs`) lulus.
- Tidak ada koneksi Firebase langsung dari lingkungan pengujian ini, tidak ada perubahan database, tidak ada penulisan data produksi, dan tidak ada deploy.
- Sebagian besar kegagalan baseline disebabkan lingkungan tes browser yang membutuhkan modul `playwright`/Chrome, yang tidak tersedia di sini; ada pula kegagalan pra-eksisting terkait fixture, identitas file mirror, atau kontrak lama. Angka 85 lulus **bukan** bukti bahwa seluruh fitur telah lulus pengujian browser end-to-end.

## Cara menerapkan

1. Backup repository sebelum perubahan, dan ekspor rules RTDB produksi untuk audit.
2. Ekstrak ZIP patch di **akar proyek CAHAYA APP**, pertahankan struktur folder, lalu timpa hanya file yang tertera. File rules dan konfigurasi Firebase **tidak disertakan dan tidak diubah**.
3. Untuk situs yang dipublikasikan dari folder `docs/` (misalnya GitHub Pages), pastikan salinan `docs/` yang diperbarui ikut di-commit. Jika deploy dilakukan dari root, file root juga sudah diperbarui.
4. Periksa diff dan jalankan: `node --test tests/bandwidth-optimizations.cjs tests/counselor-workspace-bootstrap-v3.cjs`.
5. Uji manual pada lingkungan staging atau akun terbatas: (a) Beranda Wali menampilkan lini masa dan update realtime; (b) ringkasan Naqib pada tanggal WIB sekitar pergantian hari; (c) Buku Konseling tampilan awal + tombol arsip lengkap; (d) kasus lama yang belum selesai masih muncul di Kasus Masuk; (e) pemisahan akses peran tidak berubah.
6. Publikasikan hanya **aset web** melalui alur deploy yang sudah dipakai tim. **Jangan jalankan deploy database rules produksi dari file terbuka ini.**
7. Monitor tab Firebase Console > Realtime Database > Usage > Downloads selama beberapa hari dan sesudah siklus bulanan baru dimulai. Bandingkan angka MB/hari dengan traffic pengguna yang setara. Sasaran praktis: idealnya di bawah ~250 MB/hari sebagai buffer untuk kuota 10 GB/bulan; angka ini adalah target, bukan hasil yang teruji.

## Prioritas berikutnya untuk benar-benar mencapai <10 GB/bulan

1. **P0 — Keamanan dan akses:** validasi rules aktif di konsol. Hentikan penggunaan rules root `.read/.write: true` setelah semua jalur autentikasi/akses dimigrasi dan lulus tes.
2. **P0 — Temukan penguras bandwidth aktual:** lakukan RTDB Profiler pada periode penggunaan ramai; pencatatan per-path dan frekuensi baca membantu mengidentifikasi 2–3 path dominan. Contoh: `firebase database:profile --project absensi-santri-fajrul-islam --duration 300`. Jalankan dari mesin admin yang sudah login Firebase CLI. Jangan mengunggah kredensial.
3. **P1 — Kasus Masuk:** `loadCases()` masih membaca beberapa koleksi besar sejak 2019 untuk memastikan kasus lama yang belum selesai tidak hilang. Migrasi aman adalah membuat **indeks kasus terbuka / belum selesai** yang diperbarui atomik saat pelaporan, klaim, eskalasi, dan penyelesaian, lalu backfill kasus historis dan membandingkan hasilnya sebelum mengganti pembacaan lama. **Jangan sekadar `limitToLast(50)`** karena dapat menyembunyikan kasus belum selesai.
4. **P1 — Buku Konseling:** indeks ringkasan `buku_kasus_konselor` masih dibaca pada level seluruh koleksi. Untuk jumlah riwayat yang terus naik, buat indeks tambahan per unit/santri/periode, disertai pagination dan query yang terindeks.
5. **P1 — Beranda & KPI lain:** ukur volume awal dan pembaruan listener serta hindari streaming seluruh node untuk ringkasan; gunakan ringkasan materialized harian/bulanan yang dapat diperbarui incremental.
6. **P2 — Kontrol berkelanjutan:** pantau Downloads harian, jumlah pengguna aktif, serta path teratas sebelum dan sesudah setiap release. Evaluasi mode Blaze hanya jika sudah ada peringatan dan anggaran yang disetujui; paket Blaze bersifat bayar sesuai pemakaian.

## Hal-hal yang tidak berubah

- Data RTDB tidak dihapus atau dipindah.
- Struktur akun, role, dan kode penanganan kasus tidak diubah.
- Pengambilan Kasus Masuk, tabayyun, eskalasi, penyelesaian, dan evaluasi pelanggaran tetap seperti semula.
- Tidak ada perubahan file `firebase-rtdb-rules-cahaya-app-v20.json`.
- Tidak ada jaminan penghematan persentase tertentu sebelum terukur melalui Usage/Profiler produksi.
