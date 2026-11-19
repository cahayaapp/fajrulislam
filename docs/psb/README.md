# PSB CAHAYA — Spark / tanpa billing

Halaman publik: `/psb/`. Akun calon wali: `/psb/akun.html`. Menu pengurus: `/psb/pengurus.html`.

PSB menggunakan Firebase Authentication Email/Password dan Firestore langsung, tanpa Cloud Functions. Halaman statis diterbitkan melalui GitHub Pages. Pemakaian mengikuti kuota gratis Firebase Spark. Nomor HP dinormalisasi ke format 08 dan digunakan sebagai kata sandi awal. Penggantian kata sandi menggunakan pemulihan email. Konten landing page, formulir, asesmen, dan wawancara masih contoh.

## Akses dan data

- `psb_applications/{uid}`: hanya pemilik atau pengurus PSB yang bisa membaca. Pemilik hanya boleh mengubah kolom pendaftaran, asesmen, status, dan waktu penyimpanan.
- `psb_reviews/{uid}`: wawancara dan draft hasil tes; hanya pengurus PSB.
- `psb_updates/{uid}`: jadwal dan hasil yang sudah diterbitkan; dibaca pemilik atau pengurus PSB, ditulis hanya pengurus.
- `psb_announcements`: pengumuman untuk akun pendaftar terdaftar.
- Sementara hanya akun `multazam@cahayaapp.id` (UID `gGuAzKpiIcNfOlh1YmCivnuIKZl1`) dengan custom claim `psbStaff: true` yang diberi akses. Aturan Firestore menjadi otoritas, bukan localStorage atau tampilan menu. Keluar dan masuk ulang untuk memperbarui token.

## Deployment

1. Deploy aturan dari root: `firebase deploy --only firestore:rules --project absensi-santri-fajrul-islam`. File sumber: `pembinaan/usrah-bersih.rules`. Aturan modul lain dipertahankan.
2. Publikasikan branch Pages repository; sumber root dan `docs/` diselaraskan.
3. Tidak perlu deploy fungsi, mengaktifkan billing, atau mengubah DNS.

Pemberian/pencabutan claim tersedia di `push-backend/functions/scripts/set-psb-staff.js` untuk operator Admin SDK. Jika daftar pengurus berubah, sesuaikan UID yang diizinkan pada aturan Firestore dan pengaturan menu; jangan hanya mengubah UI.

## Verifikasi

`tests/psb-browser.cjs` memakai Firebase tiruan untuk menguji signup, pendaftaran, asesmen, wawancara, jadwal dan hasil. Pengujian produksi memakai satu akun sementara dan membersihkannya setelah memverifikasi akses pemilik serta penolakan membaca data orang lain, catatan internal, dan menulis hasil sendiri.
