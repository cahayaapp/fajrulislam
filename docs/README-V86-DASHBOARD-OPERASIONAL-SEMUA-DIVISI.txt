CAHAYA APP v86 — DASHBOARD OPERASIONAL SEMUA DIVISI
1 September 2026

ARAH PENGEMBANGAN
- Product-first: Cahaya App dikembangkan dari kebutuhan kerja nyata per role/divisi.
- Dokumen operasional disusun ulang setelah alur di aplikasi matang.
- Beranda Dashboard lama tetap dipertahankan.
- Dashboard Operasional tetap menjadi menu utama pada bottom navigation.

DASHBOARD OPERASIONAL
Sudah tersedia untuk:
1. Pendidikan (dashboard khusus existing)
2. Pembinaan Karakter (dashboard khusus existing)
3. Kesehatan
4. Sarana & Prasarana
5. Keamanan & Kebersihan
6. Layanan
7. Administrasi & Keuangan
8. Kasir Kantin/Koperasi
9. Dapur
10. Media & Digital
11. Pimpinan: overview Semua Divisi

USER SETTING
Struktur tetap sederhana: User → Divisi → Role.
Divisi baru yang dapat diatur:
- Keamanan & Kebersihan
- Dapur
- Media & Digital
Role Manajer/Supervisor juga ditambahkan pada Kesehatan, Sarpras, Layanan, Administrasi & Keuangan, dan divisi baru.

PRINSIP DATA
- Dashboard Kesehatan, Sarpras, Keamanan & Kebersihan, Layanan, Keuangan dan Kasir membaca data dari modul yang sudah ada.
- Dapur dan Media & Digital memakai Update Operasional universal sebagai fondasi awal karena workflow final belum diaudit bersama.
- Update Operasional disimpan di cahaya_app/dashboard_operasional_updates/<divisi>.

CATATAN
Tidak ada pengaktifan kembali fitur lama bernama "Manajemen Operasional". Folder baru bernama dashboard-operasional hanya berisi halaman Dashboard Operasional yang diminta.
