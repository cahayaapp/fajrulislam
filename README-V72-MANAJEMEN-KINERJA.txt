CAHAYA APP V72 — MANAJEMEN OPERASIONAL & KINERJA SEDERHANA
21 Agustus 2026

PRINSIP
- Memudahkan, bukan menambah administrasi.
- Semua terukur dan terpantau tanpa membuat user pusing.
- Data dimuat seperlunya (lazy/smart loading), bukan seluruh histori di awal.

KERANGKA
Role/Jabatan -> Tupoksi -> Jobdesk -> Objektif -> KPI/Target -> To Do -> Jurnal -> Observasi -> Rapat/Tindak Lanjut -> Laporan -> Performance Scorecard -> Ranking.
SOP belum dimasukkan pada V72 dan akan dikembangkan belakangan.

PENGATURAN PUSAT
Manajemen User menjadi single source of truth:
1. Pilih satu atau beberapa Role/Jabatan untuk personel.
2. Untuk setiap role operasional, tentukan Bidang, Unit, dan Atasan Langsung.
3. Tab "Tupoksi, Jobdesk & KPI" mengatur standar sekali per role.
4. Wali dan Guru murni tidak masuk pilihan personel Manajemen Operasional kecuali memiliki role operasional lain.
5. Observer bukan role operasional baru; observasi menjadi kewenangan jabatan atasan.

JOBDESK & JURNAL
- Jobdesk melekat pada role, bukan pada orang.
- Jobdesk rutin melahirkan To Do harian/pekanan/bulanan.
- Jobdesk dapat mengambil jadwal piket Naqib sebagai sumber otomatis.
- Jurnal bukan catatan kosong: user tinggal menandai Selesai / Ada Kendala / Belum.
- Catatan hanya diperlukan bila ada konteks atau kendala.

OBJEKTIF & KPI
- KPI role ditetapkan di Manajemen User.
- Di Manajemen Operasional, user membuat Objektif periode, memilih KPI, menetapkan target, lalu mengisi aktual.
- To Do dapat ditautkan ke Objektif.

RAPAT
- Jenjang: Direksi, Supervisi, Manajerial, Staf, Insidental.
- Peserta dapat dipilih mengikuti struktur.
- Tugas/delegasi/tindak lanjut peserta yang belum selesai otomatis muncul sebagai Saran Agenda.
- Terlambat = Wajib Dibahas; deadline dekat = Perlu Dibahas; lainnya = Perlu Dipantau.

PERFORMANCE SCORECARD
Tiga komponen:
1. Pelaksanaan: dari Jobdesk -> To Do -> Jurnal.
2. Mutu: dari observasi atasan langsung.
3. Hasil/KPI: dari capaian Objektif/KPI.

Bobot menurut level:
- Staf Mula: Pelaksanaan 50% | Mutu 35% | Hasil 15%
- Staf Muda: Pelaksanaan 45% | Mutu 35% | Hasil 20%
- Manajer: Pelaksanaan 35% | Mutu 30% | Hasil 35%
- Supervisor: Pelaksanaan 30% | Mutu 30% | Hasil 40%
- Direktur: Pelaksanaan 25% | Mutu 25% | Hasil 50%

Ranking resmi membutuhkan Pelaksanaan, Hasil/KPI, dan minimal 3 observasi Mutu dalam periode. Ranking dikelompokkan menurut role + bidang agar perbandingannya adil.

MULTI-ROLE
- Satu user dapat memiliki beberapa role.
- Role switcher menampilkan "Semua Peran" + semua role yang dimiliki.
- "Semua Peran" menggabungkan menu/fitur dashboard, notifikasi, dan ringkasan kinerja per peran.
- Eksekusi teknis Manajemen Operasional tetap menggunakan satu posisi operasional aktif agar konteks tugas tidak tercampur.

PUSH NOTIFICATION
Backend Push Notification Global V68 yang sudah dideploy tetap digunakan. V72 tidak mengubah Cloud Functions, sehingga tidak perlu deploy ulang Functions.
