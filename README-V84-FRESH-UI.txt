CAHAYA APP v84 — Fresh UI Upgrade
Tanggal: 1 September 2026

TUJUAN
Upgrade visual seluruh menu baru Pendidikan & Pembinaan Karakter sebelum audit fungsi per-menu.
Tidak mengubah alur fungsi/database utama v83.

PRINSIP DESAIN
- Header/hero besar di halaman menu baru dihilangkan secara visual.
- Content-first: pengguna langsung melihat pekerjaan, data, atau tindakan utama.
- Gaya lebih modern, segar, rounded, ringan, dan mobile-first.
- Design system tetap satu keluarga CAHAYA APP, tetapi warna aksen dibedakan per ruang kerja.
- Tidak menambah gambar, library UI, framework, atau font eksternal baru.
- Satu stylesheet bersama css/cahaya-fresh-v84.css (~14 KB) dipakai seluruh halaman dan dapat di-cache browser.

HALAMAN YANG DI-UPGRADE
1. Workspace Guru
2. Workspace Mentor Qur'an
3. Workspace Naqib Operasional
4. Workspace Asisten Naqib
5. Workspace Naqib Pendamping
6. Kontrol Pendidikan
7. Kontrol Pembinaan
8. Review Pendidikan
9. Review Pembinaan
10. Mentoring Individu
11. Mentoring Usrah
12. Pantau Pendampingan
13. Pantau Asesmen CAHAYA
14. Tindak Lanjut Akademik
15. Executive Dua Divisi
16. Pengaturan User

RESPONSIVE
- Desktop, tablet, dan mobile.
- Form mobile menggunakan ukuran input ramah sentuh.
- Card/list berubah layout tanpa memaksa horizontal scroll kecuali tabel data yang memang membutuhkan.
- Mobile <=390px menurunkan grid menjadi satu kolom.

BANDWIDTH
Tidak ada asset visual baru. Styling menggunakan CSS gradients dan local cache. Tidak ada base64 image, @font-face baru, atau framework eksternal.
