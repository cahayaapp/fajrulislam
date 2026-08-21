CAHAYA APP V73 — STRUKTUR JABATAN & KINERJA OPERASIONAL
21 Agustus 2026

PRINSIP UTAMA
- Sistem dibuat untuk memudahkan, bukan menambah administrasi.
- Hak Akses Sistem dipisahkan dari Jabatan Operasional.
- Jenjang tidak lagi bertabrakan dengan fungsi seperti Guru, Naqib, dan Konselor.

ARSITEKTUR
1. Hak Akses Sistem = fitur yang boleh dibuka (Guru, Naqib, Konselor, Admin, Kesehatan, dll.).
2. Jabatan Operasional = Jenjang + Bidang + Fungsi + Unit + Atasan.
   Contoh:
   - Supervisor → Pendidikan
   - Staf Muda → Pengajaran → Guru
   - Staf Muda → Pembinaan Karakter & Asrama → Naqib
3. Satu personel dapat memiliki beberapa Jabatan Operasional.
4. Supervisor dapat memilih beberapa bidang yang menjadi cakupan supervisinya.
5. Manajemen Operasional membaca Jabatan Operasional, bukan sekadar Hak Akses Sistem.

MASTER JABATAN & KINERJA
Sudah disediakan standar awal yang dapat langsung diedit untuk:
- Direktur
- Supervisor Pendidikan
- Supervisor Administrasi & Layanan
- Manajer Pengajaran
- Manajer Pembinaan Karakter
- Manajer Tahsin & Tahfiz
- Manajer Konseling / Konselor Utama
- Manajer Sarpras
- Staf Muda Pengajaran — Guru
- Staf Muda Pembinaan Karakter — Naqib/Naqibah
- Staf Muda Konseling — Konselor
- Staf Muda Tahsin & Tahfiz — Mentor
- Staf Muda Kesehatan
- Staf Muda Administrasi
- Staf Mula Kebersihan
- Staf Mula Sarpras
- Staf Mula Dapur & Konsumsi

Setiap standar awal sudah berisi:
- Tupoksi
- Jobdesk rutin
- KPI + target default
- beberapa saran Objective untuk jabatan utama

ALUR KINERJA
Jabatan → Tupoksi → Jobdesk → Objective/KPI → To Do → Jurnal → Observasi → Rapat/Tindak Lanjut → Laporan → Performance Scorecard → Ranking.

RANKING
- Cohort ranking memakai standardId jabatan, sehingga Guru tidak dibandingkan mentah dengan Naqib walaupun sama-sama Staf Muda.
- Bobot tetap mengikuti jenjang: Pelaksanaan + Mutu + Hasil/KPI.
- Ranking resmi memerlukan data pelaksanaan, hasil/KPI, dan minimal 3 observasi mutu.

KOMPATIBILITAS DATA LAMA
- roleAssignments dan role Supervisor/Manajer/Staf lama tetap dibaca sebagai fallback.
- Pada tampilan V73, role struktural lama dinormalisasi menjadi akses "Manajemen Operasional" agar tidak lagi bertabrakan dengan fungsi kerja.
- Saat akun diedit dan disimpan, struktur baru memakai operationalAssignments.

SOP
Belum dimasukkan. SOP tetap menjadi tahap pengembangan berikutnya.

DEPLOY
Tidak ada perubahan Cloud Functions. Push Notification Global V68 tetap digunakan dan tidak perlu deploy ulang Functions.
