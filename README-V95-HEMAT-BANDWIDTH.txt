CAHAYA APP v95 — Hemat Bandwidth & Fast Director Dashboard

Perubahan utama:
1. Dashboard Direktur startup hanya membaca 4 dataset operasional utama + 2 master kecil; data 7 divisi pendukung tidak lagi diunduh saat beranda dibuka.
2. Absensi guru dibaca langsung per tanggal, tidak lagi mengunduh seluruh histori absensi_guru.
3. Query tanggal tidak lagi fallback ke pembacaan ribuan record bila query kosong/gagal.
4. Jadwal pelajaran diprioritaskan dari file lokal cache browser.
5. Cache session/TTL digunakan untuk data harian, pekanan, bulanan, target Tahfiz, master Usrah, dan jadwal.
6. Beranda Direktur tidak dimuat dua kali saat bootstrap + sinkronisasi autentikasi.
7. Master seluruh user Firestore dan listener chat tidak lagi aktif pada startup; baru dimuat saat menu Pesan dibuka.
8. Pantau Divisi 7 divisi pendukung bersifat lazy: detail dimuat saat kartu divisi dibuka.

Target desain: first paint cepat, transfer Firebase minimal, dan tidak ada full-history read di Beranda Direktur.
