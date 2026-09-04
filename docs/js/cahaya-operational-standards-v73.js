(function(){
  'use strict';
  const j=(id,title,frequency='daily',standard='',time='',source='manual',days=[])=>({id,title,frequency,standard,time,source,days});
  const k=(id,name,unit='%',defaultTarget=90,direction='at_least')=>({id,name,unit,defaultTarget,direction});
  const p=(id,level,division,functionKey,functionLabel,title,tupoksi,jobdesks,kpis,objectives=[])=>({id,level,division,functionKey,functionLabel,title,tupoksi,jobdesks,kpis,objectiveSuggestions:objectives,active:true});

  const profiles={
    'direktur__semua__direktur':p('direktur__semua__direktur','direktur','Semua Divisi','direktur','Direktur','Direktur',
      'Memimpin, mengarahkan, dan memastikan seluruh sistem pesantren berjalan selaras dengan visi, sasaran strategis, standar mutu, dan nilai CAHAYA.',[
        j('dir_review','Review dashboard dan isu prioritas','daily','Prioritas kritis teridentifikasi dan memiliki PIC.'),
        j('dir_followup','Memastikan tindak lanjut strategis berjalan','weekly','Tindak lanjut prioritas tidak dibiarkan tanpa progres.'),
        j('dir_supervisor','Review kinerja Supervisor','weekly','Setiap Supervisor memperoleh arahan berbasis data.'),
        j('dir_meeting','Memimpin rapat Direksi','weekly','Keputusan, PIC, dan deadline tercatat.'),
        j('dir_report','Menyusun laporan kinerja pesantren','monthly','Laporan ringkas berbasis KPI, temuan, dan tindak lanjut.')
      ],[
        k('dir_obj','Capaian objektif strategis','%',85),k('dir_follow','Tindak lanjut prioritas selesai tepat waktu','%',90),k('dir_review','Supervisor direview sesuai ritme','%',100),k('dir_report','Laporan pimpinan tepat waktu','%',100)
      ],['Meningkatkan ketercapaian sasaran strategis pesantren','Menurunkan jumlah tindak lanjut prioritas yang terlambat']),

    'supervisor__pendidikan__supervisor':p('supervisor__pendidikan__supervisor','supervisor','Pendidikan','supervisor','Supervisor','Supervisor Pendidikan',
      'Mengendalikan mutu bidang pendidikan dengan memastikan manajer, program pengajaran, pembinaan karakter, dan program pendidikan terkait berjalan terukur serta terus membaik.',[
        j('sup_monitor','Review dashboard bidang dan KPI manajer','weekly','Masalah utama dan deviasi KPI teridentifikasi.'),
        j('sup_obs','Melakukan observasi mutu Manajer/program','weekly','Observasi menghasilkan umpan balik yang jelas.'),
        j('sup_meet','Memimpin Rapat Supervisi','weekly','Agenda berbasis data; keputusan memiliki PIC dan deadline.'),
        j('sup_follow','Memastikan tindak lanjut bidang selesai','weekly','Tindak lanjut overdue ditekan seminimal mungkin.'),
        j('sup_coach','Coaching/pembinaan Manajer','monthly','Setiap manajer memperoleh fokus pengembangan.'),
        j('sup_report','Menyusun laporan supervisi','weekly','Laporan singkat berbasis KPI, mutu, dan tindak lanjut.')
      ],[
        k('sup_kpi','KPI bidang mencapai target','%',85),k('sup_follow','Tindak lanjut selesai tepat waktu','%',90),k('sup_obs','Cakupan observasi bawahan','%',100),k('sup_report','Laporan supervisi tepat waktu','%',100),k('sup_meet','Keputusan rapat yang tuntas sesuai deadline','%',90)
      ],['Meningkatkan konsistensi mutu program pendidikan','Meningkatkan ketuntasan tindak lanjut manajerial']),

    'supervisor__administrasi-layanan__supervisor':p('supervisor__administrasi-layanan__supervisor','supervisor','Administrasi & Layanan','supervisor','Supervisor','Supervisor Administrasi & Layanan',
      'Mengendalikan mutu layanan administrasi, keuangan, sarana, kesehatan, konsumsi, kebersihan, dan layanan pendukung agar efektif, tertib, aman, dan terukur.',[
        j('supal_monitor','Review indikator layanan pendukung','weekly','Isu layanan prioritas teridentifikasi.'),
        j('supal_obs','Observasi mutu manajer dan layanan','weekly','Ada umpan balik dan tindak lanjut.'),
        j('supal_meet','Rapat supervisi layanan','weekly','Keputusan, PIC, deadline tercatat.'),
        j('supal_follow','Kontrol tindak lanjut layanan','weekly','Tindak lanjut kritis selesai tepat waktu.'),
        j('supal_report','Laporan supervisi layanan','weekly','Ringkas, berbasis data dan risiko.')
      ],[
        k('supal_service','KPI layanan mencapai target','%',85),k('supal_follow','Tindak lanjut tepat waktu','%',90),k('supal_obs','Cakupan observasi','%',100),k('supal_report','Laporan tepat waktu','%',100)
      ]),

    'manajer__pengajaran__manajer':p('manajer__pengajaran__manajer','manajer','Pengajaran','manajer','Manajer','Manajer Pengajaran',
      'Mengelola pelaksanaan pembelajaran, guru, jadwal, kalender materi, asesmen, dan tindak lanjut akademik agar berjalan efektif, tertib, dan mencapai standar mutu.',[
        j('mp_monitor','Memastikan KBM berjalan sesuai jadwal','daily','Kelas kosong/terlambat segera ditindaklanjuti.'),
        j('mp_absen','Review kelengkapan absensi KBM','daily','Absensi terinput pada hari yang sama.'),
        j('mp_plan','Monitoring kalender materi dan progres pembelajaran','weekly','Deviasi materi teridentifikasi dan diperbaiki.'),
        j('mp_score','Monitoring input nilai dan asesmen','weekly','Nilai masuk sesuai batas waktu.'),
        j('mp_obs','Observasi mutu Guru','weekly','Guru memperoleh umpan balik terarah.'),
        j('mp_meet','Memimpin rapat staf pengajaran','weekly','Tindak lanjut rapat tercatat.'),
        j('mp_report','Laporan Pengajaran kepada Supervisor','weekly','Berbasis KPI, kendala, dan tindak lanjut.')
      ],[
        k('mp_kbm','KBM terlaksana sesuai jadwal','%',95),k('mp_absen','Absensi KBM terinput tepat waktu','%',98),k('mp_score','Nilai ujian masuk maksimal H+3','%',90),k('mp_plan','Kalender materi berjalan sesuai target','%',90),k('mp_follow','Tindak lanjut pengajaran selesai tepat waktu','%',90)
      ],['Meningkatkan ketertiban pelaksanaan KBM','Meningkatkan ketepatan input nilai dan ketuntasan kalender materi']),

    'manajer__pembinaan-karakter__manajer':p('manajer__pembinaan-karakter__manajer','manajer','Pembinaan Karakter & Asrama','manajer','Manajer','Manajer Pembinaan Karakter',
      'Mengelola sistem pengasuhan, kedisiplinan, mentoring, program asrama, serta kinerja Naqib agar pembinaan karakter santri berjalan konsisten dan terukur.',[
        j('mk_program','Memastikan program harian asrama terawasi','daily','Program utama memiliki PIC dan pengawasan.'),
        j('mk_discipline','Review data kedisiplinan dan pola pelanggaran','daily','Pola masalah ditindaklanjuti secara edukatif.'),
        j('mk_journal','Review jurnal dan pelaksanaan jobdesk Naqib','weekly','Kendala lapangan terangkat dan ditindaklanjuti.'),
        j('mk_obs','Observasi mutu Naqib/program asrama','weekly','Ada umpan balik yang spesifik.'),
        j('mk_mentoring','Monitoring pelaksanaan mentoring/usrah','weekly','Mentoring berjalan sesuai target.'),
        j('mk_meet','Memimpin rapat staf pembinaan','weekly','Keputusan memiliki PIC dan deadline.'),
        j('mk_report','Laporan pembinaan karakter','weekly','Ringkas, berbasis data kedisiplinan dan perkembangan.')
      ],[
        k('mk_program','Program asrama terawasi','%',95),k('mk_mentoring','Mentoring terlaksana sesuai jadwal','%',90),k('mk_journal','Jobdesk/jurnal Naqib tuntas','%',95),k('mk_follow','Tindak lanjut pembinaan tepat waktu','%',90),k('mk_discipline','Kedisiplinan program santri','%',90)
      ]),

    'manajer__tahsin-tahfiz__manajer':p('manajer__tahsin-tahfiz__manajer','manajer','Tahsin & Tahfiz','manajer','Manajer','Manajer Tahsin & Tahfiz',
      'Mengelola program tahsin, tahfiz, murojaah, pembagian kelompok, mentor, target hafalan, dan evaluasi mutu agar perkembangan Al-Qur’an santri terukur.',[
        j('mt_schedule','Memastikan halaqah berjalan sesuai jadwal','daily','Kelompok terlayani dan mentor hadir.'),
        j('mt_setoran','Monitoring setoran dan progres hafalan','weekly','Santri tertinggal teridentifikasi.'),
        j('mt_quality','Monitoring mutu tahsin/murojaah','weekly','Ada tindak lanjut kualitas bacaan/hafalan.'),
        j('mt_obs','Observasi mentor Tahsin/Tahfiz','weekly','Umpan balik spesifik diberikan.'),
        j('mt_meet','Koordinasi tim Tahsin/Tahfiz','weekly','Kendala dan tindak lanjut tercatat.'),
        j('mt_report','Laporan program Al-Qur’an','monthly','Progress dan target tersaji jelas.')
      ],[
        k('mt_halaqah','Halaqah terlaksana','%',95),k('mt_setoran','Santri memenuhi target setoran periode','%',85),k('mt_murojaah','Murojaah terlaksana sesuai target','%',90),k('mt_report','Data progres terinput lengkap','%',95)
      ]),

    'manajer__konseling__konselor-utama':p('manajer__konseling__konselor-utama','manajer','Konseling','konselor','Konselor Utama','Manajer Konseling / Konselor Utama',
      'Mengelola penanganan kasus, konseling, pembinaan konsekuensi edukatif, eskalasi kasus kritis, dan koordinasi konselor agar setiap kasus ditangani tuntas, manusiawi, dan terdokumentasi.',[
        j('kc_queue','Review antrean kasus baru','daily','Kasus baru memiliki prioritas dan PIC.'),
        j('kc_critical','Menangani/koordinasi kasus kritis','daily','Kasus kritis ditindak pada hari yang sama.'),
        j('kc_follow','Kontrol tindak lanjut kasus aktif','daily','Tidak ada kasus aktif tanpa progres.'),
        j('kc_coach','Pembinaan konselor','weekly','Konselor memperoleh arahan kasus dan kompetensi.'),
        j('kc_report','Laporan pola kasus dan tindak lanjut','weekly','Pimpinan memperoleh insight tanpa membuka data sensitif berlebihan.')
      ],[
        k('kc_new','Kasus baru ditindaklanjuti ≤ H+1','%',95),k('kc_critical','Kasus kritis ditindak hari yang sama','%',100),k('kc_sla','Kasus selesai sesuai SLA','%',90),k('kc_doc','Dokumentasi kasus lengkap','%',95)
      ]),

    'staf-muda__pengajaran__guru':p('staf-muda__pengajaran__guru','staf-muda','Pengajaran','guru','Guru','Staf Muda Pengajaran — Guru',
      'Melaksanakan pembelajaran dan administrasi akademik secara disiplin, bermutu, serta mendukung perkembangan akademik dan karakter santri.',[
        j('g_teach','Melaksanakan KBM sesuai jadwal','daily','Hadir tepat waktu dan pembelajaran terlaksana.'),
        j('g_absen','Input absensi KBM','daily','Absensi selesai pada hari yang sama.'),
        j('g_plan','Menyiapkan dan mengikuti kalender materi','weekly','Materi sesuai target dan kebutuhan kelas.'),
        j('g_score','Input nilai ujian/asesmen','weekly','Nilai masuk maksimal H+3 setelah penilaian.'),
        j('g_follow','Tindak lanjut santri yang membutuhkan bantuan akademik','weekly','Ada intervensi sederhana dan terpantau.')
      ],[
        k('g_kbm','KBM terlaksana sesuai jadwal','%',95),k('g_absen','Absensi KBM tepat waktu','%',98),k('g_score','Nilai masuk maksimal H+3','%',90),k('g_plan','Ketuntasan kalender materi','%',90),k('g_quality','Mutu observasi pembelajaran','%',85)
      ],['Meningkatkan ketuntasan materi kelas','Meningkatkan ketepatan administrasi pembelajaran']),

    'staf-muda__pembinaan-karakter__naqib':p('staf-muda__pembinaan-karakter__naqib','staf-muda','Pembinaan Karakter & Asrama','naqib','Naqib/Naqibah','Staf Muda Pembinaan Karakter — Naqib',
      'Mendampingi kehidupan harian santri, memastikan program asrama terawasi, melakukan mentoring, serta melaporkan kondisi dan pelanggaran secara tepat tanpa mengambil alih fungsi penindakan kasus.',[
        j('n_watch','Mengawasi program harian sesuai jadwal piket','daily','Program terawasi menyeluruh dan kondisi penting tercatat.','','naqib_schedule'),
        j('n_att','Input absensi program','daily','Absensi program selesai pada waktu program.'),
        j('n_env','Kontrol kedisiplinan, kebersihan, dan kerapian','daily','Temuan didata dan dilaporkan melalui sistem.'),
        j('n_report','Melaporkan pelanggaran/temuan','daily','Laporan faktual, tidak melakukan penindakan kasus.'),
        j('n_mentor','Mentoring/pendampingan individu atau usrah','weekly','Target perkembangan santri tercatat.'),
        j('n_journal','Menyelesaikan jurnal pelaksanaan','daily','Status jobdesk hari itu terisi sebelum pergantian hari.')
      ],[
        k('n_watch','Jadwal pengawasan terlaksana','%',95),k('n_att','Absensi program terinput lengkap','%',95),k('n_mentor','Mentoring terlaksana sesuai target','%',90),k('n_journal','Jurnal pelaksanaan lengkap','%',95),k('n_report','Temuan penting dilaporkan tepat waktu','%',95)
      ],['Meningkatkan kedisiplinan program santri','Meningkatkan konsistensi mentoring dan pengawasan']),

    'staf-muda__konseling__konselor':p('staf-muda__konseling__konselor','staf-muda','Konseling','konselor','Konselor','Staf Muda Konseling — Konselor',
      'Menindaklanjuti kasus santri melalui tabayyun, konseling, pembinaan, konsekuensi edukatif, pencatatan, dan eskalasi sesuai kewenangan.',[
        j('ko_queue','Meninjau kasus yang ditugaskan','daily','Kasus baru segera diprioritaskan.'),
        j('ko_follow','Melakukan tabayyun/konseling/tindak lanjut','daily','Setiap kasus aktif memiliki progres.'),
        j('ko_doc','Mencatat hasil penanganan kasus','daily','Catatan ringkas, faktual, dan aman.'),
        j('ko_escalate','Eskalasi kasus kritis/berat','daily','Kasus kritis tidak ditangani sendiri di luar kewenangan.'),
        j('ko_report','Review kasus aktif bersama Konselor Utama','weekly','Hambatan penanganan memperoleh arahan.')
      ],[
        k('ko_h1','Kasus baru ditindaklanjuti ≤ H+1','%',95),k('ko_progress','Kasus aktif memiliki progres','%',95),k('ko_doc','Dokumentasi penanganan lengkap','%',95),k('ko_sla','Kasus selesai sesuai SLA','%',90)
      ]),

    'staf-muda__tahsin-tahfiz__mentor':p('staf-muda__tahsin-tahfiz__mentor','staf-muda','Tahsin & Tahfiz','tahfiz','Mentor Tahsin/Tahfiz','Staf Muda Tahsin & Tahfiz — Mentor',
      'Mendampingi tahsin, tahfiz, dan murojaah santri secara terjadwal, mencatat progres, serta memberi koreksi dan tindak lanjut yang jelas.',[
        j('th_halaqah','Mendampingi halaqah sesuai jadwal','daily','Halaqah berjalan tertib dan fokus.'),
        j('th_setoran','Menerima dan mencatat setoran','daily','Setoran tercatat pada hari yang sama.'),
        j('th_murajaah','Memastikan murojaah berjalan','daily','Target murojaah terpantau.'),
        j('th_follow','Tindak lanjut santri tertinggal','weekly','Ada target perbaikan yang spesifik.')
      ],[
        k('th_halaqah','Kehadiran halaqah mentor','%',95),k('th_input','Setoran tercatat lengkap','%',98),k('th_target','Santri mencapai target periode','%',85),k('th_follow','Santri tertinggal memiliki tindak lanjut','%',90)
      ]),

    'staf-muda__kesehatan__kesehatan':p('staf-muda__kesehatan__kesehatan','staf-muda','Kesehatan','kesehatan','Tim Kesehatan','Staf Muda Kesehatan',
      'Menjalankan layanan kesehatan santri, pencatatan pemeriksaan, pengelolaan obat, pemantauan kondisi, dan eskalasi medis secara tertib dan responsif.',[
        j('kes_check','Pemeriksaan dan tindak lanjut santri sakit','daily','Kondisi dan tindakan tercatat.'),
        j('kes_round','Monitoring santri yang perlu pemantauan','daily','Kasus berisiko tidak terlewat.'),
        j('kes_stock','Kontrol stok obat dan kebutuhan UKS','weekly','Stok kritis teridentifikasi sebelum habis.'),
        j('kes_escalate','Eskalasi/rujukan bila diperlukan','daily','Rujukan dilakukan sesuai kebutuhan dan izin.'),
        j('kes_report','Ringkasan kesehatan','weekly','Tren kesehatan dan kebutuhan tindak lanjut terlihat.')
      ],[
        k('kes_doc','Pemeriksaan terdokumentasi','%',98),k('kes_follow','Tindak lanjut kesehatan tepat waktu','%',95),k('kes_stock','Ketersediaan stok obat esensial','%',95),k('kes_critical','Kasus darurat direspons sesuai prosedur','%',100)
      ]),

    'staf-muda__administrasi-keuangan__admin':p('staf-muda__administrasi-keuangan__admin','staf-muda','Administrasi & Keuangan','admin','Administrator','Staf Muda Administrasi',
      'Menjalankan administrasi, data, dokumen, dan layanan informasi secara akurat, tertib, aman, dan mudah ditelusuri.',[
        j('ad_data','Memutakhirkan data administrasi','daily','Data penting akurat dan tidak tertunda.'),
        j('ad_doc','Mengelola dokumen/surat/arsip','daily','Dokumen tersimpan rapi dan mudah dicari.'),
        j('ad_request','Menindaklanjuti permintaan administrasi','daily','Permintaan memiliki status jelas.'),
        j('ad_report','Rekap administrasi periode','weekly','Data siap dipakai pimpinan/manajer.')
      ],[
        k('ad_accuracy','Akurasi data administrasi','%',98),k('ad_sla','Permintaan administrasi selesai sesuai SLA','%',95),k('ad_archive','Kelengkapan arsip/dokumen','%',98),k('ad_report','Rekap tepat waktu','%',100)
      ]),

    'manajer__sarpras__kepala-sarpras':p('manajer__sarpras__kepala-sarpras','manajer','Sarpras','sarpras','Kepala Sarpras','Manajer Sarana Prasarana',
      'Mengelola pemeliharaan sarana, kebutuhan air, fasilitas sanitasi, perbaikan, belanja kebutuhan sarpras, dan kesiapan fasilitas agar aman dan berfungsi.',[
        j('sp_check','Inspeksi fasilitas prioritas','daily','Kerusakan prioritas teridentifikasi.'),
        j('sp_water','Memastikan kebutuhan air dan titik layanan berfungsi','daily','Kebutuhan air tidak mengganggu program.'),
        j('sp_repair','Mengendalikan antrean perbaikan','daily','Setiap kerusakan memiliki status dan prioritas.'),
        j('sp_purchase','Koordinasi belanja kebutuhan sarpras','weekly','Belanja sesuai kebutuhan dan anggaran.'),
        j('sp_report','Laporan kondisi sarpras','weekly','Risiko, kebutuhan, dan progres terbaca.')
      ],[
        k('sp_uptime','Fasilitas prioritas berfungsi','%',95),k('sp_sla','Perbaikan selesai sesuai prioritas/SLA','%',90),k('sp_check','Checklist fasilitas terlaksana','%',95),k('sp_report','Laporan tepat waktu','%',100)
      ]),

    'staf-mula__kebersihan__layanan':p('staf-mula__kebersihan__layanan','staf-mula','Kebersihan','layanan','Tim Layanan/Kebersihan','Staf Mula Kebersihan',
      'Melaksanakan tugas kebersihan dan kerapian area sesuai pembagian wilayah dan jadwal serta segera melaporkan hambatan atau kerusakan.',[
        j('clean_area','Membersihkan area tanggung jawab','daily','Area bersih sesuai standar waktu.'),
        j('clean_check','Checklist kebersihan dan kerapian','daily','Checklist diisi setelah pekerjaan selesai.'),
        j('clean_report','Melaporkan kendala/kerusakan yang ditemukan','daily','Temuan penting diteruskan kepada atasan.')
      ],[
        k('clean_done','Jobdesk kebersihan selesai','%',95),k('clean_quality','Mutu hasil observasi kebersihan','%',85),k('clean_report','Temuan penting dilaporkan','%',95)
      ]),

    'staf-mula__sarpras__staf-sarpras':p('staf-mula__sarpras__staf-sarpras','staf-mula','Sarpras','sarpras-staf','Staf Sarpras','Staf Mula Sarpras',
      'Melaksanakan pekerjaan pemeliharaan dan perbaikan sarana yang ditugaskan secara aman, tuntas, dan terdokumentasi.',[
        j('sps_task','Menyelesaikan pekerjaan perbaikan yang ditugaskan','daily','Status pekerjaan diperbarui.'),
        j('sps_check','Pemeriksaan fasilitas sesuai area','daily','Temuan dicatat dan diprioritaskan.'),
        j('sps_tool','Menjaga alat dan bahan kerja','weekly','Alat siap pakai dan kebutuhan tercatat.')
      ],[
        k('sps_done','Tugas perbaikan selesai tepat waktu','%',90),k('sps_quality','Mutu hasil observasi pekerjaan','%',85),k('sps_update','Status pekerjaan terbarui','%',95)
      ]),

    'staf-mula__dapur-konsumsi__dapur':p('staf-mula__dapur-konsumsi__dapur','staf-mula','Dapur & Konsumsi','dapur','Tim Dapur','Staf Mula Dapur & Konsumsi',
      'Melaksanakan produksi dan layanan konsumsi secara tepat waktu, bersih, aman, dan sesuai kebutuhan santri serta personel.',[
        j('dp_prepare','Menyiapkan konsumsi sesuai jadwal','daily','Makanan siap sesuai waktu layanan.'),
        j('dp_clean','Menjaga kebersihan area dan peralatan','daily','Area dapur bersih setelah layanan.'),
        j('dp_stock','Melaporkan kebutuhan bahan','daily','Kebutuhan bahan tidak terlambat disampaikan.')
      ],[
        k('dp_time','Konsumsi siap tepat waktu','%',95),k('dp_clean','Standar kebersihan dapur terpenuhi','%',95),k('dp_stock','Kebutuhan bahan dilaporkan tepat waktu','%',95)
      ])
  };

  const divisions=['Pendidikan','Pengajaran','Pembinaan Karakter & Asrama','Tahsin & Tahfiz','Konseling','Kesehatan','Sarpras','Dapur & Konsumsi','Kebersihan','Administrasi & Keuangan','Media & Digital','Keputrian','PKBM & Bimbel','Learning & Achievement','Layanan Operasional','Administrasi & Layanan','Semua Divisi'];
  const functions={
    'Pengajaran':[{key:'guru',label:'Guru'},{key:'koordinator-pengajaran',label:'Koordinator Pengajaran'},{key:'admin-pengajaran',label:'Administrasi Pengajaran'}],
    'Pembinaan Karakter & Asrama':[{key:'naqib',label:'Naqib/Naqibah'},{key:'koordinator-naqib',label:'Koordinator Naqib/Naqibah'},{key:'pembina-asrama',label:'Pembina Asrama'}],
    'Tahsin & Tahfiz':[{key:'tahfiz',label:'Mentor Tahsin/Tahfiz'},{key:'koordinator-tahfiz',label:'Koordinator Tahsin/Tahfiz'}],
    'Konseling':[{key:'konselor',label:'Konselor'},{key:'konselor-utama',label:'Konselor Utama'}],
    'Kesehatan':[{key:'kesehatan',label:'Tim Kesehatan'},{key:'koordinator-kesehatan',label:'Koordinator Kesehatan'}],
    'Sarpras':[{key:'sarpras-staf',label:'Staf Sarpras'},{key:'sarpras',label:'Kepala Sarpras'}],
    'Dapur & Konsumsi':[{key:'dapur',label:'Tim Dapur'},{key:'koordinator-dapur',label:'Koordinator Dapur'}],
    'Kebersihan':[{key:'layanan',label:'Tim Layanan/Kebersihan'},{key:'koordinator-kebersihan',label:'Koordinator Kebersihan'}],
    'Administrasi & Keuangan':[{key:'admin',label:'Administrator'},{key:'keuangan',label:'Staf Keuangan'},{key:'kasir',label:'Kasir'},{key:'koordinator-administrasi',label:'Koordinator Administrasi & Keuangan'}],
    'Media & Digital':[{key:'media',label:'Tim Media'},{key:'digital',label:'Sistem/Digital'},{key:'koordinator-media',label:'Koordinator Media & Digital'}],
    'Keputrian':[{key:'naqibah',label:'Naqibah'},{key:'koordinator-keputrian',label:'Koordinator Keputrian'}],
    'PKBM & Bimbel':[{key:'guru',label:'Tutor/Guru PKBM'},{key:'bimbel',label:'Tutor Bimbel'},{key:'koordinator-pkbm',label:'Koordinator PKBM/Bimbel'}],
    'Learning & Achievement':[{key:'cla',label:'Tutor CLA'},{key:'koordinator-cla',label:'Koordinator CLA'}],
    'Layanan Operasional':[{key:'layanan',label:'Tim Layanan/PKL'}]
  };
  const genericByLevel={
    direktur:{tupoksi:'Memimpin dan memastikan seluruh organisasi mencapai sasaran strategis secara terukur.',jobdesks:[j('gen_dir_1','Review sasaran dan isu prioritas','weekly','Prioritas jelas dan memiliki tindak lanjut.'),j('gen_dir_2','Review kinerja pimpinan di bawahnya','weekly','Ada arahan berbasis data.'),j('gen_dir_3','Laporan pimpinan','monthly','Laporan tepat waktu.')],kpis:[k('gen_dir_k1','Sasaran strategis tercapai','%',85),k('gen_dir_k2','Tindak lanjut strategis tepat waktu','%',90)]},
    supervisor:{tupoksi:'Mengendalikan mutu dan pencapaian bidang yang disupervisi melalui monitoring, observasi, rapat, tindak lanjut, dan pembinaan manajer.',jobdesks:[j('gen_sup_1','Review KPI bidang','weekly','Deviasi teridentifikasi.'),j('gen_sup_2','Observasi Manajer/program','weekly','Ada umpan balik.'),j('gen_sup_3','Rapat Supervisi','weekly','Keputusan memiliki PIC dan deadline.'),j('gen_sup_4','Laporan Supervisi','weekly','Berbasis data.')],kpis:[k('gen_sup_k1','KPI bidang tercapai','%',85),k('gen_sup_k2','Tindak lanjut tepat waktu','%',90),k('gen_sup_k3','Laporan tepat waktu','%',100)]},
    manajer:{tupoksi:'Mengelola program, personel, dan target bidang agar terlaksana efektif, tertib, terukur, dan tuntas.',jobdesks:[j('gen_man_1','Monitoring pelaksanaan program dan jobdesk tim','daily','Masalah penting segera ditindaklanjuti.'),j('gen_man_2','Observasi mutu staf','weekly','Ada umpan balik spesifik.'),j('gen_man_3','Rapat Manajerial','weekly','Tindak lanjut tercatat.'),j('gen_man_4','Laporan Manajer','weekly','Berbasis KPI dan pelaksanaan.')],kpis:[k('gen_man_k1','Program/jobdesk tim terlaksana','%',90),k('gen_man_k2','Tindak lanjut tepat waktu','%',90),k('gen_man_k3','KPI bidang tercapai','%',85)]},
    'staf-muda':{tupoksi:'Menjalankan fungsi profesional/operasional bidang secara konsisten dan bermutu serta menuntaskan amanah sesuai target.',jobdesks:[j('gen_sm_1','Melaksanakan jobdesk utama bidang','daily','Pekerjaan tuntas sesuai standar.'),j('gen_sm_2','Memperbarui jurnal/status pekerjaan','daily','Status kerja terukur.'),j('gen_sm_3','Menindaklanjuti arahan/delegasi','weekly','Tidak ada tugas overdue tanpa alasan.')],kpis:[k('gen_sm_k1','Jobdesk terlaksana','%',95),k('gen_sm_k2','Tugas selesai tepat waktu','%',90),k('gen_sm_k3','Mutu observasi','%',85)]},
    'staf-mula':{tupoksi:'Melaksanakan pekerjaan operasional harian sesuai pembagian tugas dan standar kerja serta melaporkan kendala secara cepat.',jobdesks:[j('gen_sl_1','Melaksanakan tugas harian','daily','Tugas selesai sesuai standar.'),j('gen_sl_2','Melaporkan kendala/temuan','daily','Kendala penting diteruskan kepada atasan.')],kpis:[k('gen_sl_k1','Tugas harian selesai','%',95),k('gen_sl_k2','Mutu observasi','%',85)]}
  };

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function slug(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,'dan').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
  function functionsFor(level,division){
    if(level==='direktur')return[{key:'direktur',label:'Direktur'}];
    if(level==='supervisor')return[{key:'supervisor',label:'Supervisor'}];
    if(level==='manajer'){
      const special={'Konseling':[{key:'konselor-utama',label:'Konselor Utama / Manajer Konseling'}],'Sarpras':[{key:'sarpras',label:'Kepala Sarpras'}]};
      return special[division]||[{key:'manajer',label:`Manajer ${division||''}`.trim()}];
    }
    return functions[division]||[{key:'pelaksana',label:'Pelaksana'}];
  }
  function makeId(level,division,functionKey){const existing=Object.values(profiles).find(x=>x.level===level&&x.division===division&&x.functionKey===functionKey);return existing?.id||`${slug(level)}__${slug(division||'umum')}__${slug(functionKey||'pelaksana')}`;}
  function buildGeneric(level,division,functionKey,functionLabel){
    const base=genericByLevel[level]||genericByLevel['staf-mula'];
    const title=level==='direktur'?'Direktur':level==='supervisor'?`Supervisor ${division}`:level==='manajer'?`Manajer ${division}`:`${level==='staf-muda'?'Staf Muda':'Staf Mula'} ${division}${functionLabel?' — '+functionLabel:''}`;
    return {id:makeId(level,division,functionKey),level,division,functionKey,functionLabel:functionLabel||functionKey,title,tupoksi:base.tupoksi,jobdesks:clone(base.jobdesks),kpis:clone(base.kpis),objectiveSuggestions:[],active:true};
  }
  function findMatching(level,division,functionKey){
    const all=Object.values(profiles);
    return clone(all.find(x=>x.level===level&&x.division===division&&x.functionKey===functionKey)||buildGeneric(level,division,functionKey,(functionsFor(level,division).find(f=>f.key===functionKey)||{}).label||functionKey));
  }
  window.CAHAYA_OPERATIONAL_STANDARD_LIBRARY={version:73,profiles,divisions,functions,functionsFor,makeId,buildGeneric,findMatching,clone};
})();
