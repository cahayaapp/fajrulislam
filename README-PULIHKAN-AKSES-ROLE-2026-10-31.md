# CAHAYA APP — Patch Pemulihan ROLE_HOME_MISMATCH
Tanggal: 31 Oktober 2026

## Ringkasan
Keluhan: sidebar akun multi-role menampilkan "Naqib", tetapi frame "Beranda Dashboard" memuat halaman penolakan dengan kode ROLE_HOME_MISMATCH.

Pemeriksaan source menunjukkan:
1. `main-dashboard.html` memuat JS role dengan query versi v288/v283/v282, sementara `home-naqib.html` masih memakai v266. Service worker v168 menyimpan JS dengan pola cache-first, sehingga kode lama dan baru bisa digunakan bersamaan setelah deploy.
2. `terapkanProfilAktif()` membentuk sesi V2 sebelum memasukkan uid login Firebase ke objek profil. Kunci identitas sesi dari Firestore dapat berbeda dengan profil yang akhirnya ditulis ke localStorage.
3. `refreshUserProfileUI()` dapat dipanggil beberapa kali pada rangkaian login/perpindahan role yang berdekatan, sehingga kita menambahkan perlindungan terhadap render yang sudah kedaluwarsa.

Patch menyelaraskan versi role JS utama, memperbaiki urutan normalisasi identitas, memastikan `cahayaRoleUserV2` disetel dari sesi aktif, memperbarui service worker ke v169, dan mengubah strategi cache untuk JS otorisasi dari cache-first ke network-first (dengan fallback offline).

## File yang diperbarui
- main-dashboard.html dan docs/main-dashboard.html
- home-naqib.html dan docs/home-naqib.html
- index.html dan docs/index.html
- firebase-messaging-sw.js dan docs/firebase-messaging-sw.js

Semua hak akses V2, daftar role, route registry, Firebase Rules, Firebase Auth, dan data Firebase **tidak diubah**. Optimasi bandwidth sebelumnya tetap tersimpan karena tidak ditimpa pada file optimasi.

## Langkah penerapan
1. BACKUP folder source CAHAYA APP yang sedang dipakai.
2. Ekstrak ZIP patch di folder root yang berisi `main-dashboard.html`, `home-naqib.html`, dan `docs/`. Gabungkan isi folder, timpa hanya file yang sama namanya.
3. Publikasikan kode situs sesuai sistem hosting Anda. Jika menggunakan GitHub Pages dari `docs/`, pastikan perubahan `docs/` sudah di-commit dan di-push. Menempel file secara lokal saja belum memperbarui situs publik.
4. Jangan melakukan `firebase deploy` tanpa argumen: `firebase.json` source ini merujuk database Rules yang berpotensi terbuka. Patch ini tidak memerlukan deploy database.
5. Setelah situs terbaru terbit, buka `https://cahayaapp.com/main-dashboard.html?rolefix=20261031-r1` dan pilih peran Naqib.
6. Periksa Akun Dandi: beranda Naqib, menu Absensi, Lapor Kasus, dan beralih ke peran kedua lalu kembali Naqib. Uji akun Guru, Konselor, dan Wali juga sebelum rollout luas.

## Pengujian
- 4/4 tes khusus perbaikan lulus (role Naqib multi-role, guard tetap menolak home salah role, sinkronisasi versi, cache, mirror docs).
- Tes existing `role-system-v2` dan `role-menu-v2-fixtures` juga lulus.
- Sintaks JavaScript service worker dan inline script pada main dashboard lulus.
- Belum diuji end-to-end dalam browser yang terhubung ke Firebase produksi; pengujian browser di lingkungan ini terhalang kebijakan jaringan browser. Jangan klaim masalah produksi teratasi hingga diverifikasi di situs.

## Jika masih tampil ROLE_HOME_MISMATCH
Dari dashboard utama sebelum melakukan perbaikan lanjutan, periksa URL iframe #contentFrame (tab DevTools Elements) serta peran pada sesi utama (`cahayaRoleV2Session.activeRole`) dan peran pada `cahayaCurrentUser.activeRoleV2`. Jangan bagikan token/kata sandi. Cari informasi apakah data user di Firestore masih menyatakan defaultRole atau activeRoleV2 lain, atau ada aset role yang tidak benar-benar ter-deploy.
