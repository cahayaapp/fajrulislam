(function(){
  'use strict';

  const ICONS={
    home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V21h13V10.5"/><path d="M9.5 21v-6h5v6"/>',
    calendar:'<rect x="3.5" y="5.5" width="17" height="15" rx="2.2"/><path d="M7 3v5M17 3v5M3.5 10h17"/><path d="M8 14h2M14 14h2M8 17.5h2"/>',
    chat:'<path d="M4.5 5h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-5.5 4v-4h-1a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M7 10h10M7 13h6"/>',
    chart:'<path d="M4 20V11M10 20V6M16 20v-6M22 20V3"/><path d="M2.5 20h21"/>',
    eye:'<path d="M2 12s3.8-6 10-6 10 6 10 6-3.8 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
    shield:'<path d="M12 3 20 6v6c0 5-3.2 8.3-8 10-4.8-1.7-8-5-8-10V6l8-3z"/><path d="m8.4 12 2.2 2.2 4.9-5"/>',
    school:'<path d="m3 10 9-6 9 6"/><path d="M5 10v10h14V10M9 20v-5h6v5"/><path d="M8 12h.01M16 12h.01"/>',
    users:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c.5-4 2.7-6 6-6s5.5 2 6 6M14 15c3-.3 5.4 1.2 6 4"/>',
    health:'<path d="M4 13h4l2-5 3.2 9 2.2-5H20"/><path d="M12 21C6 17.5 3 14.5 3 10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 4.5-3 7.5-9 11z"/>',
    book:'<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23V5.5z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23V5.5z"/>',
    tools:'<path d="M14 6a4 4 0 0 0-5-4l2.2 2.2-3 3L6 5A4 4 0 0 0 10 10l8 8 3-3-8-8"/><path d="m4 20 6-6"/>',
    wallet:'<path d="M4 6h14a2 2 0 0 1 2 2v12H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12"/><path d="M20 11h-5a2 2 0 0 0 0 4h5"/>',
    image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="2"/><path d="m4 18 5-5 3 3 3-4 5 6"/>',
    database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 22c.7-5 3.5-8 8-8s7.3 3 8 8"/>',
    edit:'<path d="M4 20h4l11-11-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>',
    check:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 2v4h8V2M8 13l2.5 2.5L16 10"/>',
    star:'<path d="m12 3 2.7 5.5 6 .9-4.4 4.3 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.3 6-.9L12 3z"/>',
    grid:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    file:'<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>'
  };

  function typeFrom(id,label){
    const k=((id||'')+' '+(label||'')).toLowerCase();
    if(k.includes('beranda')||k.includes('home'))return'home';
    if(k.includes('kalender')||k.includes('jadwal')||k.includes('piket')||k.includes('kegiatan'))return'calendar';
    if(k.includes('chat')||k.includes('komentar')||k.includes('pesan'))return'chat';
    if(k.includes('dashboard')||k.includes('monitor')||k.includes('skor')||k.includes('raport')||k.includes('rekap')||k.includes('laporan')||k.includes('nilai'))return'chart';
    if(k.includes('observer')||k.includes('observasi'))return'eye';
    if(k.includes('izin')||k.includes('disiplin')||k.includes('kasus')||k.includes('pelanggaran'))return'shield';
    if(k.includes('sekolah')||k.includes('kelas')||k.includes('qr'))return'school';
    if(k.includes('guru')||k.includes('user')||k.includes('sdm')||k.includes('usrah')||k.includes('wali'))return'users';
    if(k.includes('kesehatan')||k.includes('obat')||k.includes('uks')||k.includes('pemeriksaan'))return'health';
    if(k.includes('tahfiz')||k.includes('tahsin')||k.includes('muroja')||k.includes('asesmen')||k.includes('pembelajaran')||k.includes('akademik'))return'book';
    if(k.includes('sarpras')||k.includes('checklist')||k.includes('tindak')||k.includes('koreksi')||k.includes('setting')||k.includes('pengaturan'))return'tools';
    if(k.includes('keuangan')||k.includes('kasir')||k.includes('tabungan')||k.includes('bayar'))return'wallet';
    if(k.includes('media'))return'image';
    if(k.includes('database'))return'database';
    if(k.includes('profil'))return'user';
    if(k.includes('menulis'))return'edit';
    if(k.includes('absen'))return'check';
    if(k.includes('gamifikasi')||k.includes('inisiatif'))return'star';
    if(k.includes('informasi')||k.includes('pembinaan'))return'file';
    return'grid';
  }
  function svg(type){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(ICONS[type]||ICONS.grid)+'</svg>';}
  function iconizeNav(selector){
    document.querySelectorAll(selector).forEach(function(el){
      if(el.dataset.b31Icon==='1') return;
      const button=el.closest('[data-menu-id]');
      const id=button&&button.dataset?button.dataset.menuId:'';
      const label=(button&&button.querySelector('.mobile-shortcut-label,.wali-mobile-shortcut-label')?.textContent)||button?.getAttribute('aria-label')||'';
      el.innerHTML=svg(typeFrom(id,label));
      el.dataset.b31Icon='1';
    });
  }
  function iconizeBottom(){iconizeNav('.mobile-shortcut-icon,.wali-mobile-shortcut-icon');}
  function normalize(){
    document.documentElement.classList.add('cahaya-beyond-v29-root');
    if(document.body) document.body.classList.add('cahaya-beyond-v29');
    iconizeBottom();
  }
  function watch(){
    const root=document.body||document.documentElement;
    if(!root)return;
    let scheduled=false;
    new MutationObserver(function(){
      if(scheduled)return;scheduled=true;
      requestAnimationFrame(function(){scheduled=false;iconizeBottom();});
    }).observe(root,{subtree:true,childList:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){normalize();watch();},{once:true});
  else{normalize();watch();}
})();
