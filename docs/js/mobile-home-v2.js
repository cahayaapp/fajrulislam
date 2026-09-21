/* Shared responsive Home presentation only. No operational data or write calls. */
(() => {
  'use strict';
  const root=new URL('../',document.currentScript.src),R=window.CahayaRoleSystemV2;
  const embedded=parent!==window, P=embedded?parent:window;
  const wali=location.pathname.endsWith('/wali/dashboard/beranda.html');
  const media=matchMedia('(max-width: 768px)');
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const paths={
    calendar:'M5 4h14v17H5zM8 2v5m8-5v5M5 10h14M8 13h2m4 0h2m-8 4h2m4 0h2',
    book:'M12 5v16M3 4h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3z',
    check:'M7 3h10v3H7zM6 5H4v16h16V5h-2M7 11l2 2 3-3m2 2h3m-10 5 2 2 3-3m2 2h3',
    people:'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-3a7 7 0 0 1 14 0v3M17 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 4 5v2',
    chart:'M4 13h3v8H4zm7-6h3v14h-3zm7-5h3v19h-3z',
    star:'m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
    warning:'m12 3 10 17H2zM12 9v5m0 3v.1',
    history:'M3 4v6h6M3 10a9 9 0 1 1 1 9M12 7v6l4 2',
    eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12m13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    report:'M5 2h10l5 5v15H5zM15 2v5h5M9 11h7m-7 4h7m-7 4h5',
    pen:'m4 16 12-12 4 4L8 20l-5 1zM14 6l4 4M4 16l4 4',
    bell:'M5 17h14l-2-4V9a5 5 0 0 0-10 0v4zM10 21h4M12 2v2',
    arrow:'M4 12h16m-6-6 6 6-6 6',
    home:'m2 11 10-9 10 9M5 9v13h5v-7h4v7h5V9',
    grid:'M3 3h6v6H3zm12 0h6v6h-6zM3 15h6v6H3zm12 0h6v6h-6z',
    chat:'M3 3h18v14H9l-6 4zM7 8h10m-10 4h7',
    sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
    moon:'M19 15A9 9 0 0 1 9 3a9 9 0 1 0 10 12Z',
    leave:'M5 2h10l5 5v6M15 2v5h5M5 2v20h7M8 10h4m-4 4h3m6 2v6m-3-3h6',
  };
  const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.grid}"/></svg>`;
  function iconFor(text){return /riwayat/i.test(text)?'history':/materi|tahsin|tahfiz|panduan/i.test(text)?'book':/nilai|kpi|capaian|skor/i.test(text)?'chart':/pelanggaran|kasus|eskalasi/i.test(text)?'warning':/observasi|kontrol|kondisi/i.test(text)?'eye':/jadwal/i.test(text)?'calendar':/teladan|inisiatif/i.test(text)?'star':/guru|mentor|personil|supervisor|presensi/i.test(text)?'people':/lapor|logbook|url/i.test(text)?'report':'check'}
  const descriptions={
    'menu-absen-kbm':'Catat kehadiran kelas','menu-kalender-materi':'Target dan capaian materi','menu-nilai':'Kelola hasil belajar','menu-tindak-lanjut-guru':'Dampingi perkembangan santri','menu-tahfiz':'Bacaan dan setoran hafalan','menu-laporan-murojaah':'Catat kejadian santri','menu-asesmen-guru':'Refleksi dan pengembangan diri','menu-guru-menulis':'Siapkan ilmu sebelum kelas',
    'menu-absen-asrama':'Catat kehadiran santri','menu-jurnal-piket':'Catat jalannya program','menu-gamifikasi':'Apresiasi tindakan positif','menu-naqib-teladan':'Keteladanan diri hari ini','menu-mentoring-individu':'Klarifikasi & target pekanan','menu-mentoring-usrah':'Perkembangan target santri','menu-media':'Tautan untuk wali santri',
    'menu-kontrol-pendidikan':'Pantau pendidikan hari ini','menu-materi-pembelajaran':'Target dan realisasi materi','menu-tindak-akademik':'Tuntaskan temuan pendidikan','menu-absensi-ibadah-guru':'Guru mukim & keteladanan',
  };
  const supporting={GURU_PONDOK:'Siap mengajar, mendampingi, dan menebar cahaya hari ini.',GURU_PKBM:'Dampingi pembelajaran dan tumbuhkan potensi santri.',NAQIB:'Dampingi santri dan hadirkan keteladanan setiap hari.',NAQIBAH:'Dampingi santri dan hadirkan keteladanan setiap hari.',MENTOR_USRAH:'Dampingi langkah kecil pertumbuhan santri setiap pekan.',KONSELOR:'Dengarkan, dampingi, dan bantu santri bertumbuh.',MANAJER:'Jaga keteraturan, dampingi personil, tuntaskan tindak lanjut.',SUPERVISOR:'Jaga standar, dampingi tim, dan arahkan perbaikan.',DIREKTUR:'Hadirkan arah, keputusan, dan teladan untuk pesantren.',DAPUR:'Hidangkan kebaikan, jaga kebersihan dapur setiap hari.',MEDIA:'Abadikan kegiatan dan sebarkan cerita kebaikan.',KESEHATAN:'Rawat kesehatan dan dampingi pemulihan santri.',SARPRAS:'Jaga fasilitas agar nyaman dan siap digunakan.',LAYANAN_KEBERSIHAN:'Layani dengan ramah, jaga kenyamanan lingkungan.',WALI_SANTRI:'Bersama mendampingi langkah tumbuh ananda.'};
  const priority={GURU_PONDOK:['menu-absen-guru','menu-absen-kbm','menu-tahfiz','leave'],NAQIB:['menu-absen-asrama','menu-jurnal-piket','menu-gamifikasi','menu-naqib-teladan'],NAQIBAH:['menu-absen-asrama','menu-jurnal-piket','menu-gamifikasi','menu-naqib-teladan'],KONSELOR:['menu-kasus-masuk','menu-kasus-aktif','menu-konseling-konselor','menu-eskalasi-konselor'],MANAJER:['menu-kontrol-pendidikan','menu-materi-pembelajaran','menu-tindak-akademik','menu-absensi-ibadah-guru','menu-kontrol-pembinaan','menu-kontrol-pembinaan--mentoring','menu-kontrol-pembinaan--counselor','menu-kontrol-pembinaan--followup'],SUPERVISOR:['menu-supervisor-v2','menu-supervisor-v2--escalations','menu-supervisor-v2--observation','menu-supervisor-v2--followup'],DIREKTUR:['menu-direktur-v2','menu-direktur-v2--inbox','menu-direktur-v2--targets','menu-direktur-v2--supervisors']};
  let session,user,items=[],quick=[],secondary=[],host;
  function summary(item){return descriptions[item.id]||(wali?(/mentoring/i.test(item.label)?'Refleksi, target & perkembangan ananda':/laporan/i.test(item.label)?'Ikuti perkembangan ananda':/kabar/i.test(item.label)?'Cerita dan kabar terbaru ananda':'Informasi untuk keluarga'):(/kpi/i.test(item.label)?'Tinjau capaian dan bukti kerja':/riwayat/i.test(item.label)?'Lihat catatan sebelumnya':/panduan/i.test(item.label)?'Tugas dan standar kerja':/pembinaan/i.test(item.label)?'Dampingi dan arahkan perbaikan':/izin/i.test(item.label)?'Informasi izin santri':'Buka ruang kerja Anda'))}
  function card(item,index,large=false){return `<button type="button" class="mh-card ${large?'mh-quick-card':'mh-menu-card'} mh-tone-${index%6}" data-mh-id="${esc(item.id)}" title="${esc(item.label)}"><span class="mh-icon">${icon(item.icon||iconFor(item.label))}</span><span class="mh-card-copy"><b>${esc(item.label)}</b><small>${esc(item.description||summary(item))}</small></span><span class="mh-card-arrow">${large?icon('arrow'):'›'}</span></button>`}
  function all(){if(embedded&&typeof P.toggleSidebar==='function'){P.toggleSidebar();P.document.querySelector('.sidebar-close')?.focus({preventScroll:true});return}const sheet=host.querySelector('dialog');if(!sheet.open)sheet.showModal()}
  function open(id){
    if(id==='all')return all();
    if(id==='roles')return embedded?P.openCahayaGlobalRoleModal?.():all();
    if(id==='messages'){if(embedded)(wali?P.toggleWaliChat?.():P.openMobileShortcut?.('menu-chat'));return}
    if(id==='profile'){if(embedded){if(wali)P.document.getElementById('navProfil')?.click();else P.openAuthorizedMenu?.('menu-profil')}return}
    const special={'menu-absen-guru':'openScheduleModal',schedule:'openScheduleModal',leave:'openLeaveModal',activities:'openActivities'};
    if(special[id]&&typeof window[special[id]]==='function')return window[special[id]]();
    const item=items.find(x=>x.id===id);if(!item)return;
    host.querySelector('dialog')?.close();
    if(embedded){if(wali)return P.openWaliMobileShortcut?.(id);if(typeof P.openAuthorizedMenu==='function')return P.openAuthorizedMenu(id)}
    location.href=new URL(item.route,root).href;
  }
  function fill(){
    let capacity=media.matches&&innerHeight<=620?4:8;
    // All destinations remain in Lainnya; the Home never squeezes touch targets.
    const shown=secondary.slice(0,secondary.length>=capacity-1?capacity-1:capacity),grid=host.querySelector('.mh-menu-grid');
    if(secondary.length>=capacity-1)shown.push({id:'all',label:'Lainnya',icon:'grid',description:'Seluruh laporan dan fitur yang tersedia'});
    grid.innerHTML=shown.map((x,i)=>card(x,i)).join('');
    host.style.setProperty('--mh-menu-rows',Math.max(1,Math.ceil(shown.length/4)));
    host.classList.toggle('mh-sparse',secondary.length===0);
    host.querySelector('.mh-more').textContent=secondary.length>shown.length?`Semua menu (${secondary.length}) →`:'Lihat Semua →';
  }
  async function init(){
    if(document.getElementById('roleAccessDenied')||document.getElementById('mobileRoleHome'))return;
    try{user=JSON.parse(localStorage.getItem('cahayaCurrentUser')||'{}')}catch{user={}}
    session=R?.resolveSession(user,localStorage);if(!session?.activeRole&&!wali)return;
    if(!wali&&!window.CahayaRoleMenuV2){await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('js/role-menu-v2.js?v=266',root);script.onload=resolve;script.onerror=reject;document.head.append(script)})}
    const role=wali?'WALI_SANTRI':session.activeRole,label=wali?'Wali Santri':R.displayLabelFor(role,session.activeAssignment);
    if(wali){
      const allowed=embedded?[...P.document.querySelectorAll('.nav-item[data-menu-id]')].filter(x=>!x.hidden&&x.dataset.moduleDisabled!=='true'&&x.dataset.menuId!=='menu-beranda-wali'):[];
      items=allowed.map(x=>({id:x.dataset.menuId,label:x.querySelector('.nav-label')?.textContent?.trim()||x.textContent.trim().replace(/^[^a-zA-Z]+/,'').replace(/›/g,'')}));
      items.unshift({id:'utility-kabar',label:'Kabar Ananda',description:'Cerita dan kabar terbaru ananda',icon:'bell'});
    }else items=window.CahayaRoleMenuV2.model(session).filter(x=>!['menu-home','menu-profil'].includes(x.id));
    if(role==='GURU_PONDOK'){
      const labels={'menu-tahfiz':'Tahsin & Tahfiz','menu-tindak-lanjut-guru':'Tindak Lanjut','menu-laporan-murojaah':'Lapor Pelanggaran','menu-asesmen-guru':'Self Asesmen'};
      items=items.map(item=>({...item,label:labels[item.id]||item.label}));
      items.push({id:'leave',label:'Memo Izin/Sakit',description:'Santri izin atau sakit hari ini',icon:'leave'});
    }
    const wanted=priority[role]||items.filter(x=>!x.utility&&x.group!=='Lainnya'&&x.group!=='Evaluasi').map(x=>x.id);
    quick=wanted.map(id=>items.find(x=>x.id===id)).filter(Boolean).slice(0,4);
    if(!quick.length)quick=items.slice(0,2);
    if(role==='GURU_PONDOK'){
      const labels={'menu-absen-guru':'Presensi Guru','menu-absen-kbm':'Presensi Santri','menu-tahfiz':'Tahsin & Tahfiz'};
      quick=quick.map(item=>({...item,label:labels[item.id]||item.label,icon:item.id==='menu-absen-guru'?'calendar':item.id==='leave'?'leave':iconFor(item.label)}));
    }
    if(wali){
      const waliQuick={
        'utility-kabar':{description:'Cerita dan kabar terbaru ananda',icon:'bell'},
        'menu-informasi-kalender-wali':{description:'Agenda penting untuk keluarga',icon:'calendar'},
        'menu-informasi-program-wali':{description:'Kegiatan ananda setiap hari',icon:'sun'},
        'menu-informasi-pembelajaran-wali':{description:'Jadwal belajar ananda',icon:'book'}
      };
      quick=Object.entries(waliQuick).map(([id,meta])=>{
        const item=items.find(x=>x.id===id);
        return item?{...item,...meta}:null;
      }).filter(Boolean);
    }
    const skip=new Set([...quick.map(x=>x.id),'menu-absen-guru']);
    secondary=items.filter(x=>!skip.has(x.id));
    const name=String(wali?(user.namaWali||user.namaOrangTua||user.nama||user.displayName||'Abi & Ummi'):(user.nama||user.displayName||user.label||user.name||user.username||label)).trim();
    const date=new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
    let hijri='';try{hijri=new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura',{timeZone:'Asia/Jakarta',day:'numeric',month:'long',year:'numeric'}).format(new Date()).replace(/AH/i,'H')}catch{}
    host=document.createElement('main');host.id='mobileRoleHome';host.className='mh-home';host.dataset.role=role;
    if(name.length>23)host.classList.add('mh-long-name');
    else if(name.length>11)host.classList.add('mh-medium-name');
    host.innerHTML=`<div class="mh-masthead"><header class="mh-header"><div class="mh-brand"><img src="${new URL('assets/cahaya-app/logo-icon.png',root)}" alt=""><span><strong>CAHAYA <em>APP</em></strong><small>Pesantren Cahaya Fajrul Islam</small></span></div><div class="mh-header-actions"><button type="button" data-mh-id="messages" aria-label="Buka pesan" class="mh-bell">${icon('bell')}</button><button type="button" data-mh-id="profile" aria-label="Buka profil" class="mh-avatar">${esc(name.charAt(0))}</button></div></header>
      <section class="mh-hero"><div class="mh-identity"><span class="mh-greeting">Assalamu’alaikum,</span><h1 title="${esc(name)}">${esc(name)}</h1><button type="button" class="mh-role" data-mh-id="roles" ${session?.roles?.length>1?'':'disabled'}>${icon('people')}<span>${esc(label)}</span>${session?.roles?.length>1?'<span>⌄</span>':''}</button></div><blockquote>“${esc(role==='GURU_PONDOK'?'Mengajar hari ini, menyiapkan generasi cahaya esok hari.':supporting[role])}”</blockquote></section></div>
      <div class="mh-date"><span class="mh-date-icon">${icon('calendar')}</span><div class="mh-date-copy"><span>${esc(date)}</span><small>${esc(hijri)}</small></div><div class="mh-date-message">${icon('sun')}<span>Terus<br>Menebar Manfaat</span></div></div>
      <section class="mh-quick"><div class="mh-heading"><h2>Akses Cepat Hari Ini</h2><button type="button" data-mh-id="all">Lihat Semua →</button></div><div class="mh-quick-grid" style="--mh-quick-rows:${Math.max(1,Math.ceil(quick.length/2))}">${quick.map((x,i)=>card(x,i,true)).join('')}</div></section>
      <section class="mh-menu"><div class="mh-heading"><h2>Menu Lainnya</h2><button type="button" class="mh-more" data-mh-id="all">Lihat Semua →</button></div><div class="mh-menu-grid"></div></section>
      <footer class="mh-banner"><p>Setiap langkah kecil hari ini,<br><strong>membawa perubahan besar esok hari.</strong></p></footer>
      <dialog class="mh-all"><header><h2>Semua Menu ${esc(label)}</h2><button type="button" data-mh-close aria-label="Tutup menu">×</button></header><div>${items.map((x,i)=>card(x,i)).join('')}</div></dialog>`;
    if(wali){
      host.querySelector('.mh-menu h2').textContent='Laporan Ananda';
      host.querySelector('.mh-all h2').textContent='Laporan & Informasi Wali';
    }
    // Hide only previous Home composition; never hide existing action sheets.
    const old=document.querySelector('.ui-page,main,.app,.app-container,.container,.page');if(old&&!old.closest('dialog'))old.classList.add('mh-original');
    document.body.prepend(host);document.body.classList.add('mh-enabled');document.documentElement.classList.add('mh-document');
    if(!embedded)host.classList.add('mh-standalone');
    const photo=user.fotoProfil||user.foto_profil||user.photoURL||user.profilePhoto||user.avatar||user.foto;
    if(typeof photo==='string'&&/^(https?:|data:image\/|\/)/.test(photo)){const img=new Image();img.alt='';img.src=photo;img.onerror=()=>host.querySelector('.mh-avatar').textContent=name.charAt(0);host.querySelector('.mh-avatar').replaceChildren(img)}
    host.addEventListener('click',e=>{const b=e.target.closest('[data-mh-id]');if(b)open(b.dataset.mhId);if(e.target.closest('[data-mh-close]'))host.querySelector('dialog').close();if(e.target===host.querySelector('dialog'))e.target.close()});
    fill();addEventListener('resize',fill);
    // Parent shell owns the one existing bottom navigation and role popup.
    const syncShell=()=>{try{if(embedded)P.document.body.classList.toggle('mh-home-shell',P.document.getElementById('contentFrame')?.contentWindow===window)}catch{}};
    window.CahayaMobileHomeV2={syncShell};syncShell();media.addEventListener('change',syncShell);
    addEventListener('cahaya:resume',syncShell);addEventListener('pageshow',syncShell);
    const suspend=()=>{try{if(embedded)P.document.body.classList.remove('mh-home-shell')}catch{}host.querySelector('dialog')?.close()};
    addEventListener('cahaya:suspend',suspend);addEventListener('pagehide',suspend);
    addEventListener('message',e=>{if(e.source===P&&e.origin===location.origin&&e.data?.type==='CAHAYA_PAGE_SUSPEND')suspend()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init().catch(console.error),{once:true});else init().catch(console.error);
})();
