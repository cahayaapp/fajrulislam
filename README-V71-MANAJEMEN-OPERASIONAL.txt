CAHAYA APP V71 — OPERATIONAL INTELLIGENCE
20 Agustus 2026

FOKUS V71
1. Smart/Lazy Data Loading
   - Manajemen Operasional tidak lagi memasang listener realtime penuh pada seluruh koleksi.
   - Data setiap fitur dimuat ketika fitur dibuka dengan batas record yang relevan.
   - Dashboard hanya mengambil ringkasan terbatas; sinyal lintas modul ditunda sampai dashboard selesai.
   - Master user dicache sementara agar pembukaan ulang lebih ringan.

2. Struktur Organisasi Digital
   - Level: Direktur > Supervisor > Manajer > Staf Muda > Staf Mula.
   - Posisi menyimpan nama jabatan, bidang, subbidang, unit, atasan langsung dan personel.
   - Satu personel dapat memiliki beberapa posisi operasional dan memilih posisi aktif.
   - Penyimpanan posisi menyinkronkan level/role operasional ke profil user.
   - Role Observer tidak dipakai lagi; legacy Observer dinormalisasi menjadi Staf Muda.

3. Personel Operasional
   - Wali Santri dan Guru PKBM murni tidak masuk daftar personel Manajemen Operasional.
   - Guru yang diberi posisi operasional tetap dapat masuk sebagai personel operasional.

4. Master Jobdesk & Jurnal Harian
   - Master jobdesk dapat ditargetkan ke personel, posisi, level, bidang, atau role operasional.
   - Jobdesk harian/pekanan/bulanan otomatis membentuk Tugas Saya Hari Ini.
   - Jadwal Piket Naqib menjadi sumber otomatis untuk bidang Pengembangan Karakter/Asrama.
   - Jurnal bukan catatan kosong; berisi daftar pekerjaan dengan status Selesai/Kendala/Belum.
   - Kendala dapat langsung dijadikan tindak lanjut operasional.

5. Rapat Operasional Cerdas
   - Rapat Direksi, Supervisi, Manajerial, Staf, dan Insidental.
   - Peserta default mengikuti struktur atasan-bawahan.
   - Tugas, delegasi, tindak lanjut, serta temuan observasi peserta yang belum selesai menjadi Saran Agenda.
   - Prioritas agenda: Wajib Dibahas / Perlu Dibahas / Perlu Dipantau.
   - Saran agenda tetap dipilih oleh pimpinan rapat sebelum masuk agenda.
   - Keputusan rapat dapat menghasilkan tindak lanjut dengan PIC dan deadline.

6. Observasi sebagai Fungsi Jabatan
   - Tidak ada lagi role Observer.
   - Direktur, Supervisor, Manajer, dan Staf Muda mendapat kewenangan observasi sesuai level.
   - Nilai mutu ranking hanya memakai observasi atasan langsung (atau satu level di atas bila atasan belum diset).

7. Kompetensi Multi-target
   - Program pengembangan dapat diberikan ke beberapa personel, satu level jabatan, atau satu bidang/tim.
   - Setiap personel tetap mempunyai status progres individual.

8. Kinerja & Ranking
   - Pelaksanaan = rata-rata ketuntasan jobdesk dari Jurnal Pelaksanaan.
   - Mutu = rata-rata observasi atasan.
   - Skor = 60% Pelaksanaan + 40% Mutu.
   - Ranking resmi mensyaratkan minimal 3 observasi mutu.
   - Ranking dikelompokkan berdasarkan level + bidang agar perbandingan lebih adil.
   - Dashboard Manajemen Operasional menampilkan ranking tim.
   - Main dashboard personal menampilkan Kinerja Saya, ranking, Pelaksanaan, Mutu, dan alasan penilaian.
   - Dashboard Pimpinan memperoleh tab baru Manajemen Ops pada Ranking SDM.

9. Push Notification
   - Memakai sistem Push Global V68 yang sudah dideploy.
   - Tugas, tindak lanjut rapat/observasi, program kompetensi, undangan rapat dan laporan dapat menulis ke notifikasi_user.
   - TIDAK perlu deploy ulang Cloud Functions untuk V71.

PATH UTAMA RTDB
cahaya_app/manajemen_operasional_v1/
  positions
  jobdesks
  tasks
  tasks_by_pic
  observations
  observations_by_person
  meetings
  followups
  followups_by_pic
  reports
  journals
  journal_by_person
  competencies
  competencies_by_person
  performance_monthly

CATATAN
V71 adalah fondasi sistem operasional yang siap disempurnakan per modul sesuai kebutuhan lapangan setelah digunakan.
