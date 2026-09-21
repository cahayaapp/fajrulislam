/* One local navigation model for sidebar, mobile drawer, Home and bottom nav.
 * permission is the existing role permission; id distinguishes workspace views.
 * No operational data is read to build this model. */
(function(root,factory){
  const cjs=typeof module==='object'&&module.exports;
  const api=factory(cjs?require('./role-system-v2.js'):root.CahayaRoleSystemV2,cjs?require('./role-navigation-v2.js'):root.CahayaRoleNavigationV2);
  if(cjs)module.exports=api;if(root)root.CahayaRoleMenuV2=api;
})(typeof window!=='undefined'?window:globalThis,function(R,N){
  'use strict';
  const entry=(id,label,route,group='Operasional',permission=id)=>({id,label,route,group,permission});
  const REQUIRED_INTERNAL_UTILITIES=Object.freeze(['kpi','pesan','profil','panduan']);
  const KPI_IDS={GURU_PONDOK:'menu-kpi-guru',NAQIB:'menu-kpi-naqib',NAQIBAH:'menu-kpi-naqib',KONSELOR:'menu-kpi-konselor',MANAJER:'menu-kpi-manajer',SUPERVISOR:'menu-kpi-supervisor',DIREKTUR:'menu-kpi-direktur'};
  const workspace=(base,permission,items)=>items.map(([view,label,group='Manajemen',id])=>entry(id||(view===items[0][0]?permission:`${permission}--${view}`),label,`${base}?view=${view}`,group,permission));
  function candidates(s){
    const role=s.activeRole,a=s.activeAssignment,out=[entry('menu-home','Beranda',R.homeFor(role,a),'Utama')];
    const add=(id,label,route,group)=>out.push(entry(id,label,route,group));
    const guide=()=>add('menu-panduan-kerja','Panduan Kerja','role-workspace.html?guide=1','Lainnya');
    if(role==='GURU_PONDOK'){
      [
        ['menu-absen-guru','Jadwal & Kehadiran Guru','home-guru.html?openSchedule=1'],
        ['menu-absen-kbm','Absensi Pembelajaran','guru/absensiPembelajaran.html'],
        ['menu-kalender-materi','Materi Pembelajaran','guru/capaian-materi.html'],
        ['menu-nilai','Nilai Ujian','guru/inputNilaiUjian.html'],
        ['menu-tahfiz','Tahsin / Tahfiz','guru/inputSetoranTahfiz.html'],
        ['menu-tindak-lanjut-guru','Tindak Lanjut Akademik','guru/tindak-lanjut.html'],
        ['menu-laporan-murojaah','Lapor Kasus / Pelanggaran','guru/lapor-pelanggaran.html'],
        ['menu-guru-menulis','Guru Menulis','guru/gurumenulis.html'],
        ['menu-asesmen-guru','Asesmen Guru','pusat-asesmen/guru.html'],
        ['menu-kalender-pendidikan','Kalender Pendidikan','kalender.html?mode=view'],
        ['menu-kpi-guru','KPI Guru','pendidikan/kpi-guru.html','Evaluasi']
      ].forEach(x=>add(...x));guide();
    }else if(role==='GURU_PKBM'){
      add('menu-kalender-pendidikan','Kalender Pendidikan PKBM','kalender.html?mode=view');guide();
    }else if(['NAQIB','NAQIBAH'].includes(role)){
      [
        ['menu-dashboard-operasional','Program Hari Ini','naqib/program-hari-ini.html'],
        ['menu-absen-asrama','Absensi Program','naqib/absensi.html'],
        ['menu-jurnal-piket','Laporan Pelaksanaan','naqib/program-hari-ini.html?intent=report'],
        ['menu-gamifikasi','Catat Inisiatif Santri','naqib/gamifikasi.html'],
        ['menu-naqib-teladan','Naqib Teladan','naqib/naqib-teladan.html'],
        ['menu-asesmen-santri','Asesmen CAHAYA Santri','pusat-asesmen/santri.html'],
        ['menu-asesmen-naqib','Self Asesmen Naqib','pusat-asesmen/naqib.html','Evaluasi'],
        ['menu-laporan-murojaah','Lapor Kasus / Pelanggaran','guru/lapor-pelanggaran.html'],
        ['menu-skor-usrah','Skor Kedisiplinan','naqib/skor-kedisiplinan-usrah.html','Evaluasi'],
        ['menu-riwayat-laporan','Riwayat Laporan','naqib/laporan-pelaksanaan.html?view=history','Evaluasi'],
        ['menu-kpi-naqib','KPI Naqib','naqib/kpi.html','Evaluasi']
      ].forEach(x=>add(...x));guide();
    }else if(role==='MENTOR_USRAH'){
      add('menu-mentoring-individu','Form Mentoring','pembinaan/mentor-usrah-v2.html?view=form');
      add('menu-mentoring-usrah','Riwayat Mentoring','pembinaan/mentor-usrah-v2.html?view=history');
    }else if(role==='KONSELOR'){
      const base='konselor/cases-v2.html?view=';
      [['menu-kasus-masuk','Kasus Masuk','incoming'],['menu-kasus-aktif','Kasus Aktif','active'],['menu-konseling-konselor','Catat Konseling','counseling'],['menu-eskalasi-konselor',a.level==='MADYA'?'Eskalasi Masuk':'Perlu Eskalasi','escalations'],['menu-riwayat-kasus','Riwayat Kasus','history']].forEach(([id,label,view])=>add(id,label,base+view));
      add('menu-self-konselor','Self Asesmen Konselor','konselor/self-asesmen.html','Evaluasi');
      add('menu-kpi-konselor','KPI Konselor','konselor/kpi.html','Evaluasi');guide();
    }else if(role==='MANAJER'&&R.isEducationManager(a)){
      [['menu-kontrol-pendidikan','Kontrol Hari Ini','control'],['menu-materi-pembelajaran','Capaian Materi','material'],['menu-tindak-akademik','Tindak Lanjut','followup'],['menu-guru-pondok','Guru Pondok','teachers'],['menu-nilai-manajer','Nilai Ujian','scores'],['menu-observasi-pembelajaran','Observasi Pembelajaran','observation'],['menu-riwayat-temuan','Riwayat Temuan','findings'],['menu-pembinaan-guru','Pembinaan Guru','coaching'],['menu-kpi-manajer','KPI Manajer Pendidikan','kpi'],['menu-panduan-kerja','Panduan Kerja','guide']].forEach(([id,label,view])=>add(id,label,`manajer/pendidikan-v2.html?view=${view}`,view==='guide'?'Lainnya':view==='kpi'?'Evaluasi':'Manajemen'));
      out.splice(4,0,entry('menu-absensi-ibadah-guru','Guru Mukim & Ibadah','pendidikan/absensi-ibadah-guru.html','Manajemen'));
      add('menu-penempatan-tahsin','Penempatan Level Tahsin','pendidikan/penempatan-tahsin.html','Manajemen');
    }else if(role==='MANAJER'&&R.isCharacterManager(a)){
      out.push(...workspace('manajer/pembinaan-karakter-v2.html','menu-kontrol-pembinaan',[
        ['naqib','Naqib & Program'],['mentoring','Mentoring Usrah'],['counselor','Kasus & Konselor'],['followup','Tindak Lanjut'],['observation','Observasi Pengasuhan'],['coaching','Pembinaan Personil'],['sdm-kpi','Rekap KPI SDM','Evaluasi'],['history','Riwayat Temuan','Evaluasi']]));
      add('menu-kpi-manajer','KPI Manajer Pembinaan Karakter','manajer/pembinaan-karakter-v2.html?view=kpi','Evaluasi');
      add('menu-panduan-kerja','Panduan Kerja','manajer/pembinaan-karakter-v2.html?view=guide','Lainnya');
    }else if(role==='SUPERVISOR'){
      if(R.canManageTahsinLevels(role,a))add('menu-penempatan-tahsin','Penempatan Level Tahsin','pendidikan/penempatan-tahsin.html','Manajemen');
      out.push(...workspace('supervisor/workspace-v2.html','menu-supervisor-v2',[
        ['divisions','Kondisi Divisi'],['escalations','Eskalasi Masuk'],['observation','Observasi Pembanding'],['followup','Tindak Lanjut Supervisor'],['people','Manajer & Personil'],['recap','Rekap KPI Bawahan','Evaluasi'],['standards','Standar Kerja'],['coaching','Pembinaan'],['history','Riwayat Eskalasi','Evaluasi'],['guide','Panduan Kerja','Lainnya','menu-panduan-kerja']]));
      const review=entry('menu-supervisor-v2--review-izin','Review Izin Santri','supervisor/review-izin-santri.html','Manajemen','menu-supervisor-v2');review.conditional=true;out.push(review);
      add('menu-supervisor-schedule','Jadwal Supervisor','supervisor/workspace-v2.html?view=schedule','Utama');
      add('menu-kpi-supervisor','KPI Supervisor','supervisor/workspace-v2.html?view=kpi','Evaluasi');
    }else if(role==='DIREKTUR'){
      out.push(...workspace('pimpinan/direktur-v2.html','menu-direktur-v2',[
        ['condition','Kondisi Pesantren'],['inbox','Eskalasi & Keputusan'],['targets','Target & Arah'],['supervisors','Supervisor'],['systemic','Masalah Sistemik'],['recap','Rekap KPI Supervisor','Evaluasi'],['changes','Perubahan Sistem'],['coaching','Pembinaan Supervisor'],['history','Riwayat Keputusan','Evaluasi'],['guide','Panduan Kerja','Lainnya','menu-panduan-kerja']]));
      add('menu-jadwal-direktur','Jadwal Direktur','pimpinan/direktur-v2.html?view=schedule','Utama');
      add('menu-kpi-direktur','KPI Direktur','pimpinan/direktur-v2.html?view=kpi','Evaluasi');
    }else if(role==='DAPUR'){
      out.push(...workspace('dapur/app.html','menu-dashboard-operasional',[
        ['logbook','Logbook Hari Ini','Operasional'],['checklist','Checklist Kebersihan','Operasional'],['history','Riwayat','Evaluasi']]));
      add('menu-panduan-kerja','Panduan Kerja','dapur/panduan.html','Lainnya');
    }else if(role==='MEDIA'){
      add('menu-media','Update URL Wali','admin/admin_media.html');
      add('menu-dashboard-operasional','Laporan & Capaian Media','media/target-capaian.html');
      add('menu-gallery-dokumentasi','Gallery Dokumentasi','media/operasional.html?view=gallery','Lainnya');
      add('menu-manajemen-konten','Manajemen Konten','media/operasional.html?view=content','Lainnya');guide();
    }else if(role==='KESEHATAN'){
      [['menu-jurnal-kesehatan','Jurnal Kesehatan','jurnal'],['menu-pemeriksaan-kesehatan','Pemeriksaan Kesehatan','pemeriksaan'],['menu-perizinan-uks','Perizinan Medis UKS','perizinan-uks'],['menu-stok-obat','Stok Obat UKS','stokobat']].forEach(([id,label,path])=>add(id,label,`kesehatan/${path}.html`));guide();
    }else if(role==='SARPRAS'){
      [['menu-jurnal-sarpras','Jurnal Sarpras','jurnal'],['menu-checklist-sarpras','Checklist Harian','checklist'],['menu-tindak-sarpras','Tindak Lanjut','tindak-lanjut']].forEach(([id,label,path])=>add(id,label,`sarpras/${path}.html`));guide();
    }else if(role==='LAYANAN_KEBERSIHAN'){
      add('menu-jurnal-pkl','Jurnal Harian','PKL/jurnal-pkl.html');
      add('menu-laporan-murojaah','Laporan Pelanggaran','guru/lapor-pelanggaran.html');
      add('menu-buku-tamu','Buku Tamu','PKL/buku-tamu.html');
      add('menu-penitipan-barang','Penitipan Barang','PKL/penitipan-barang.html');guide();
    }else guide();
    if(role!=='WALI_SANTRI'){
      // One utility set, independent of legacy role_menus. Operational routes stay intact.
      for(let i=out.length-1;i>=0;i--)if(out[i].id==='menu-panduan-kerja')out.splice(i,1);
      add('menu-panduan-kerja','Panduan & Manual','panduan-role-v2.html','Lainnya');
      add('menu-profil','Profil','profil.html','Lainnya');
      out.push({...entry('menu-chat','Pesan','pesan.html','Lainnya'),action:'chat',utility:true});
      if(!out.some(x=>x.id===KPI_IDS[role]))add('menu-kpi-role','KPI — Bukti Kerja','utilitas-role-v2.html?view=kpi','Evaluasi');
      if(!['GURU_PONDOK','NAQIB','NAQIBAH','MANAJER','SUPERVISOR','DIREKTUR'].includes(role))
        out.push({...entry('menu-jadwal-role','Jadwal & Ritme Kerja','utilitas-role-v2.html?view=schedule','Lainnya'),utility:true});
    }else if(R.can(role,'menu-profil',a))add('menu-profil','Profil Saya','profil.html','Lainnya');
    return out;
  }
  function audit(s){return candidates(s).map(item=>{const v=N.decision(s,item.permission,item.route);return {...item,status:v.ok?(item.conditional?'CONDITIONAL':'PASS'):'BLOCKED',reason:v.reason}})}
  function model(s){const groups=['Utama','Operasional','Manajemen','Evaluasi','Lainnya'];return audit(s).filter(x=>x.status!=='BLOCKED').sort((a,b)=>groups.indexOf(a.group)-groups.indexOf(b.group))}
  function key(route){const p=N.parse(route);if(!p)return '';const keys=['view','openSchedule','guide','intent'];return p.path+'?'+keys.map(k=>`${k}=${p.params.get(k)||''}`).join('&')}
  function match(s,route){const k=key(route);return model(s).find(x=>key(x.route)===k)}
  function resolve(s,id,route){
    const items=model(s),exact=route&&match(s,route);
    if(exact&&(exact.id===id||exact.permission===id||items.some(x=>x.id===id&&x.permission===exact.permission)))return {...exact,route};
    const item=items.find(x=>x.id===id);if(!item)return null;
    // Preserve contextual links within reviewed workspaces, e.g. a teacher or
    // selected occurrence. Legacy destinations are replaced by the model.
    if(route&&N.parse(route)?.path===N.parse(item.route)?.path&&N.decision(s,item.permission,route).ok)return {...item,route};
    if(route&&N.decision(s,item.permission,route).ok)return {...item,route};
    return route?null:item;
  }
  function bottom(s,kind){
    const r=s.activeRole,a=s.activeAssignment;
    const ids={GURU_PONDOK:['menu-absen-guru','menu-kpi-guru'],NAQIB:['menu-dashboard-operasional','menu-kpi-naqib'],NAQIBAH:['menu-dashboard-operasional','menu-kpi-naqib'],KONSELOR:['menu-kasus-masuk','menu-kpi-konselor'],MANAJER:[R.isEducationManager(a)?'menu-kontrol-pendidikan':R.isCharacterManager(a)?'menu-kontrol-pembinaan':'','menu-kpi-manajer'],SUPERVISOR:['menu-supervisor-schedule','menu-kpi-supervisor'],DIREKTUR:['menu-jadwal-direktur','menu-kpi-direktur'],GURU_PKBM:['menu-kalender-pendidikan','']};
    const items=model(s),id=ids[r]?.[kind==='jadwal'?0:1];
    if(items.some(x=>x.id===id))return id;
    const fallback=kind==='jadwal'?'menu-jadwal-role':'menu-kpi-role';
    return r!=='WALI_SANTRI'&&items.some(x=>x.id===fallback)?fallback:'';
  }
  return Object.freeze({model,audit,candidates,resolve,match,key,bottom,REQUIRED_INTERNAL_UTILITIES});
});
