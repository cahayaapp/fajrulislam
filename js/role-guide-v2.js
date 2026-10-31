(function(){
  'use strict';
  const R=window.CahayaRoleSystemV2;
  let user={};try{user=JSON.parse(localStorage.getItem('cahayaCurrentUser')||'{}')}catch{}
  const session=R.resolveSession(user,localStorage),role=session.activeRole,a=session.activeAssignment;
  const isHome=!new URLSearchParams(location.search).has('guide')&&!new URLSearchParams(location.search).has('pending');
  if(isHome){
    document.getElementById('title').textContent='Beranda — '+R.displayLabelFor(role,a);
    document.getElementById('assignment').textContent=[a.unit,a.programDomain].filter(Boolean).join(' • ');
    document.getElementById('status').textContent=session.assignmentErrors[role]?.length?'Penugasan belum lengkap. Hubungi pengelola akun.':'Pilih fitur sesuai penugasan Anda.';
    const container=document.getElementById('guide');
    window.CahayaRoleMenuV2.model(session).filter(x=>x.id!=='menu-home'&&x.id!=='menu-profil').forEach(item=>{
      const button=document.createElement('button');button.textContent=item.label;button.style.margin='6px';
      button.onclick=()=>{if(parent!==window&&parent.openAuthorizedMenu)parent.openAuthorizedMenu(item.id);else location.href=item.route};container.appendChild(button);
    });
    document.getElementById('back').hidden=true;return;
  }
  const tasks={
    GURU_PONDOK:'Jalankan pembelajaran kepondokan sesuai jadwal, catat presensi, materi dan nilai, serta laporkan kejadian.',
    GURU_PKBM:'Jalankan pembelajaran PKBM sesuai jadwal dan penugasan akademik PKBM.',
    NAQIB:'Dampingi program, catat absensi dan pelaksanaan, isi asesmen CAHAYA, catat inisiatif positif santri sesuai konfigurasi poin, serta laporkan pelanggaran.',
    NAQIBAH:'Dampingi program santri Putri, catat absensi dan pelaksanaan, asesmen CAHAYA, inisiatif positif santri, serta laporan pelanggaran.',
    KONSELOR:'Tangani antrean kasus sesuai unit dan kewenangan: tabayyun, konseling, pembinaan, konsekuensi edukatif, eskalasi, dan penyelesaian.',
    MENTOR_USRAH:'Dampingi perkembangan santri pada usrah yang ditugaskan. Mentoring tidak memberikan kewenangan penanganan kasus formal.',
    MANAJER:'Kelola pelaksanaan operasional pada role, unit, dan domain yang ditugaskan.',
    SUPERVISOR:'Verifikasi dan evaluasi pelaksanaan pada role serta unit yang ditugaskan.',
    DIREKTUR:'Arahkan strategi, pantau divisi, dan ambil keputusan melalui modul yang tersedia.',
    KESEHATAN:'Jalankan layanan kesehatan sesuai kewenangan.',LAYANAN_KEBERSIHAN:'Jalankan layanan kebersihan sesuai penugasan.',
    DAPUR:'Jalankan kegiatan dapur sesuai penugasan.',SARPRAS:'Catat dan tindak lanjuti kebutuhan sarana prasarana.',MEDIA:'Kelola kegiatan media sesuai penugasan.',
    WALI_SANTRI:'Pantau informasi anak yang terhubung dengan akun Anda.'
  };
  document.getElementById('title').textContent='Panduan Kerja — '+R.labelFor(role);
  document.getElementById('assignment').textContent=[a.unit,a.programDomain,a.level,...a.managedRoles.map(R.labelFor),...a.supervisedRoles.map(R.labelFor),...a.usrahIds].filter(Boolean).join(' • ')||'Penugasan mengikuti peran aktif.';
  const pending=new URLSearchParams(location.search).has('pending');
  document.getElementById('status').textContent=pending?'Halaman ini belum tersedia untuk penugasan aktif Anda. Anda tetap dapat menggunakan Beranda dan Panduan Kerja.':(session.assignmentErrors[role]?.length?'Penugasan peran ini belum lengkap. Hubungi pengelola akun.':'Gunakan menu sesuai peran dan penugasan aktif Anda.');
  const common=[['Peran Saya',R.labelFor(role)],['Tugas Utama',tasks[role]||'Peran belum ditetapkan.']];
  const counselor=[['Alur Penanganan Kasus','Laporan masuk → routing otomatis → ambil kasus → tabayyun → konseling/pembinaan → konsekuensi/poin bila perlu → evaluasi → selesai atau eskalasi.'],['Kasus Pemula vs Madya','Pemula menangani kasus rutin/ringan. Moral, berat, kritis, pelanggaran sama tiga hari berturut-turut, dan eskalasi Pemula ditangani Madya.'],['Standar Tabayyun','Pisahkan laporan awal dari fakta hasil klarifikasi. Catat pernyataan santri, klarifikasi terkait, fakta, dan kesimpulan: terbukti, tidak terbukti, atau belum cukup bukti.'],['Standar Konseling/Pembinaan','Dengarkan dengan tenang, dokumentasikan pemahaman dan respons santri, lalu sepakati langkah perbaikan yang mendidik. Satu kasus dapat memiliki beberapa sesi.'],['Konsekuensi & Poin','Pembinaan berbeda dari konsekuensi edukatif. Poin hanya diputuskan setelah proses yang memadai dan tidak boleh ditulis dua kali untuk kejadian yang sama.'],['Kapan Harus Eskalasi','Pemula wajib meneruskan kasus yang ternyata moral, berat, kritis, kompleks, membutuhkan kewenangan lebih tinggi, atau ketika pembinaan awal belum efektif.'],['Batas Kewenangan','Konselor menangani kasus pada unit dan level penugasannya. Pemula tidak menyelesaikan kasus khusus Madya. Pergantian peran tidak menggabungkan kewenangan.'],['Cara Menggunakan Fitur','Kasus Masuk untuk mengambil laporan baru, Kasus Aktif untuk melanjutkan proses, Catat Konseling untuk menambah sesi, Riwayat untuk arsip, dan Self Asesmen untuk refleksi pekanan.'],['FAQ','MUDA pada data lama dibaca sebagai MADYA. Kasus yang sudah dimiliki konselor lain tidak boleh diambil diam-diam. Laporan asli selalu dipertahankan.']];
  const general=[['Alur Kerja Harian','Buka fitur yang dibutuhkan, periksa konteks penugasan, lalu catat pelaksanaan sesuai fakta.'],['Standar Kerja','Gunakan data yang benar, catat tepat waktu, dan jaga kerahasiaan data santri.'],['Batas Kewenangan',['NAQIB','NAQIBAH'].includes(role)?'Inisiatif positif mengikuti poin yang sudah ditetapkan. Pelanggaran hanya dilaporkan. Tidak ada konseling formal, tabayyun, hukuman, penutupan kasus, atau audit formal oleh Naqib/Naqibah.':'Akses mengikuti peran aktif dan penugasannya. Pergantian peran tidak menggabungkan kewenangan.'],['Jika Ada Masalah','Catat fakta dan gunakan alur laporan atau eskalasi yang sudah tersedia.'],['Panduan Fitur Aplikasi','Buka fitur dari menu peran aktif. Halaman memuat data setelah dibuka.'],['FAQ','Penugasan yang belum lengkap harus dikonfirmasi kepada pengelola akun. Nama pengguna bukan dasar penetapan kewenangan.']];
  const sections=[...common,...(role==='KONSELOR'?counselor:general)];
  const container=document.getElementById('guide');sections.forEach(([title,text])=>{const h=document.createElement('h2'),p=document.createElement('p');h.textContent=title;p.textContent=text;container.append(h,p)});
  document.getElementById('back').onclick=()=>{if(parent!==window&&typeof parent.openAuthorizedMenu==='function')parent.openAuthorizedMenu('menu-home');else location.href='main-dashboard.html?v=205'};
})();
