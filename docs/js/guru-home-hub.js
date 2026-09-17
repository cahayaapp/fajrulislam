(() => {
'use strict';
const P=window.parent&&window.parent!==window?window.parent:window;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function storedProfile(){try{return JSON.parse(localStorage.getItem('cahayaCurrentUser')||'{}')}catch{return{}}}
let USER=storedProfile(),active=true,actionPromise=null,actionGeneration=0;
window.CahayaGuruHub={profile:()=>({...USER}),isActive:()=>active};
function openMenu(id){try{if(typeof P.openAuthorizedMenu==='function'){P.openAuthorizedMenu(id);return}}catch(e){console.warn(e)}const direct={"menu-absen-kbm":"guru/absensiPembelajaran.html?v=197","menu-kalender-materi":"guru/capaian-materi.html?v=174","menu-nilai":"guru/inputNilaiUjian.html?v=200"};if(direct[id])location.href=direct[id]}window.openMenu=openMenu;window.closeModal=id=>$(id)?.classList.remove('show');window.openAttentionModal=()=>$('attentionModal').classList.add('show');window.openRoleModal=()=>{let user=USER||{};try{user={...JSON.parse(localStorage.getItem('cahayaCurrentUser')||'{}'),...USER}}catch{}const source=(Array.isArray(user.workspaceRoles)&&user.workspaceRoles.length)?user.workspaceRoles:((Array.isArray(user.allRoles)&&user.allRoles.length)?user.allRoles:(Array.isArray(user.akses)?user.akses:[user.akses||user.role].filter(Boolean)));const active=String(localStorage.getItem('cahayaActiveRole')||localStorage.getItem('cahayaCurrentRole')||user.activeRole||user.role||'').toLowerCase(),labels={direktur:'Direktur',admin:'Administrator',operasional:'Operasional',wakil:'Wakil Direktur',yayasan:'Ketua Yayasan','kepala-sekolah':'Kepala Sekolah',guru:'Guru','mentor-quran':'Mentor Tahsin/Tahfiz',naqib:'Naqib','naqib-operasional':'Naqib Operasional','asisten-naqib':'Asisten Naqib Pendamping','naqib-pendamping':'Naqib Pendamping',konselor:'Konselor',supervisor:'Supervisor',manajer:'Manajer','supervisor-pendidikan':'Supervisor Pendidikan','manajer-pendidikan':'Manajer Pendidikan','supervisor-pembinaan':'Supervisor Pembinaan Karakter','manajer-pembinaan':'Manajer Pembinaan Karakter','manajer-kesehatan':'Manajer Kesehatan','supervisor-kesehatan':'Supervisor Kesehatan','manajer-sarpras':'Manajer Sarpras','supervisor-sarpras':'Supervisor Sarpras','keamanan-kebersihan':'Petugas Keamanan & Kebersihan','manajer-keamanan-kebersihan':'Manajer Keamanan & Kebersihan','supervisor-keamanan-kebersihan':'Supervisor Keamanan & Kebersihan','manajer-layanan':'Manajer Layanan','supervisor-layanan':'Supervisor Layanan','manajer-keuangan':'Manajer Administrasi & Keuangan','supervisor-keuangan':'Supervisor Administrasi & Keuangan','tim-dapur':'Tim Dapur','manajer-dapur':'Manajer Dapur','supervisor-dapur':'Supervisor Dapur','media-digital':'Tim Media & Digital','manajer-media':'Manajer Media & Digital','supervisor-media':'Supervisor Media & Digital',kesehatan:'Tim Kesehatan',sarpras:'Kepala Sarpras',layanan:'Tim Layanan',keuangan:'Administrasi Keuangan',kasir:'Kasir Kantin/Koperasi',cla:'Center of Learning & Achievement','staf-muda':'Staf Muda','staf-mula':'Staf Mula'},desc={direktur:'Akses pengelolaan dan pemantauan menyeluruh.',admin:'Akses administrasi dan pengelolaan sistem.',operasional:'Akses pemantauan dan pelaksanaan operasional pesantren.',wakil:'Akses koordinasi dan pemantauan lintas divisi.',yayasan:'Akses pemantauan strategis kelembagaan.','kepala-sekolah':'Akses pengelolaan dan pemantauan akademik.',guru:'Akses pembelajaran dan kegiatan kelas.','mentor-quran':'Akses tahsin, tahfiz, dan pendampingan Al-Qur’an.',naqib:'Akses pengasuhan dan aktivitas santri.','naqib-operasional':'Akses kedisiplinan dan operasional pengasuhan.','asisten-naqib':'Akses pendampingan usrah dan pembinaan santri.','naqib-pendamping':'Akses mentoring dan pendampingan individu santri.',konselor:'Akses layanan konseling dan penanganan kasus.',supervisor:'Akses supervisi, evaluasi, dan pembinaan SDM.',manajer:'Akses pengelolaan program dan tindak lanjut divisi.','supervisor-pendidikan':'Akses supervisi, evaluasi, dan pembinaan pendidikan.','manajer-pendidikan':'Akses pengelolaan kegiatan dan target pendidikan.','supervisor-pembinaan':'Akses supervisi dan evaluasi pembinaan karakter.','manajer-pembinaan':'Akses pengelolaan program pembinaan karakter.','manajer-kesehatan':'Akses pengelolaan layanan kesehatan santri.','supervisor-kesehatan':'Akses supervisi dan evaluasi layanan kesehatan.','manajer-sarpras':'Akses pengelolaan sarana dan prasarana.','supervisor-sarpras':'Akses supervisi dan evaluasi sarana prasarana.','keamanan-kebersihan':'Akses operasional keamanan dan kebersihan.','manajer-keamanan-kebersihan':'Akses pengelolaan keamanan dan kebersihan.','supervisor-keamanan-kebersihan':'Akses supervisi keamanan dan kebersihan.','manajer-layanan':'Akses pengelolaan layanan pesantren.','supervisor-layanan':'Akses supervisi dan evaluasi layanan pesantren.','manajer-keuangan':'Akses pengelolaan administrasi dan keuangan.','supervisor-keuangan':'Akses supervisi administrasi dan keuangan.','tim-dapur':'Akses operasional layanan dapur.','manajer-dapur':'Akses pengelolaan layanan dapur.','supervisor-dapur':'Akses supervisi dan evaluasi layanan dapur.','media-digital':'Akses media, publikasi, dan sistem digital.','manajer-media':'Akses pengelolaan media dan sistem digital.','supervisor-media':'Akses supervisi media dan sistem digital.',kesehatan:'Akses layanan kesehatan santri.',sarpras:'Akses pemeliharaan sarana dan prasarana.',layanan:'Akses layanan administrasi santri dan wali.',keuangan:'Akses administrasi dan transaksi keuangan.',kasir:'Akses transaksi kasir kantin dan koperasi.',cla:'Akses pembelajaran lanjutan dan pencapaian santri.','staf-muda':'Akses pelaksanaan tugas operasional yang ditetapkan.','staf-mula':'Akses pelaksanaan tugas dasar yang ditetapkan.'},person='<svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="3.5"/><path d="M5 21c.5-5 2.9-7.5 7-7.5s6.5 2.5 7 7"/></svg>',group='<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3"/><circle cx="5.5" cy="10" r="2.3"/><circle cx="18.5" cy="10" r="2.3"/><path d="M6.5 21c.4-4.2 2.2-6.3 5.5-6.3s5.1 2.1 5.5 6.3M1.5 20c.2-3.3 1.5-5 4-5M22.5 20c-.2-3.3-1.5-5-4-5"/></svg>',list=[...new Set(source.map(r=>String(r||'').trim().toLowerCase()).filter(Boolean))];$('roleList').innerHTML=(list.length?list:[active||'guru']).map(key=>{const selected=key===active,label=labels[key]||key;return`<button class="role-option${selected?' active':''}" onclick="switchRole('${esc(key)}')"><span class="role-option-icon">${/direktur|admin|wakil|yayasan|kepala-sekolah/.test(key)?person:group}</span><span class="role-option-copy"><b>${esc(label)}</b><small>${esc(desc[key]||'Gunakan akses dan menu sesuai tanggung jawab Anda.')}</small></span><span class="role-option-state">✓</span></button>`}).join('');$('roleModal').classList.add('show')};window.switchRole=async r=>{closeModal('roleModal');try{if(P!==window&&typeof P.setCahayaActiveRole==='function'){const changed=await P.setCahayaActiveRole(r);if(changed){if(typeof P.openAuthorizedMenu==='function')P.openAuthorizedMenu('menu-home');else P.loadPage?.('',P.document?.getElementById('menu-home'));return}}}catch(e){console.warn(e)}localStorage.setItem('cahayaActiveRole',r);localStorage.setItem('cahayaCurrentRole',r);location.href='main-dashboard.html?v=20260909-v156'};window.openMateriMenu=()=>{$('materialMenuSheet')?.classList.add('show')};window.closeMateriMenu=()=>{$('materialMenuSheet')?.classList.remove('show')};window.openMateriWorkspace=mode=>{closeMateriMenu();const url=`guru/capaian-materi.html?v=174&mode=${encodeURIComponent(mode||'target')}`;try{P.loadPage?.(url,P.document?.getElementById('menu-kalender-materi'))}catch(e){console.warn(e);openMenu('menu-kalender-materi')}};

const menuIcons={
materi:'<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M3.5 5.2c0-1 .8-1.7 1.8-1.7h5.1c1.2 0 2.2.5 2.9 1.3.7-.8 1.7-1.3 2.9-1.3h2.5c1 0 1.8.8 1.8 1.7v13.2c0 .8-.7 1.4-1.5 1.4h-2.7c-1.2 0-2.3.4-3 1.2-.8-.8-1.8-1.2-3-1.2H5c-.8 0-1.5-.6-1.5-1.4V5.2Z"/><path d="M12 5.4v13.3" stroke="white" stroke-width="1.2" opacity=".85"/></svg>',
nilai:'<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M6 2.8h9.2L19 6.6V21H6a2 2 0 0 1-2-2V4.8a2 2 0 0 1 2-2Z"/><path d="M15 2.8v4h4M8 10h7M8 13.5h7M8 17h5" stroke="white" stroke-width="1.35" opacity=".92"/></svg>',
tahfiz:'<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M3 4.5c3.9-.8 6.8-.2 9 1.8v13.2c-2.2-2-5.1-2.6-9-1.8V4.5Zm18 0c-3.9-.8-6.8-.2-9 1.8v13.2c2.2-2 5.1-2.6 9-1.8V4.5Z"/><path d="M12 7v12" stroke="white" stroke-width="1.1" opacity=".9"/></svg>',
tulis:'<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="m15.9 3.2 4.9 4.9L9.1 19.8l-6 1.2 1.2-6L15.9 3.2Z"/><path d="m14.2 4.9 4.9 4.9" stroke="white" stroke-width="1.3" opacity=".9"/></svg>',
presensi:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2" fill="currentColor" stroke="none"/><circle cx="16.8" cy="8.8" r="2.7" fill="currentColor" stroke="none" opacity=".82"/><path fill="currentColor" stroke="none" d="M2.5 20c.5-4.6 2.7-7 6.5-7s6 2.4 6.5 7h-13Zm11.3 0c-.1-2.4-.8-4.4-2-5.8 1.1-.8 2.5-1.2 4.2-1.2 3.2 0 5 2.3 5.5 7h-7.7Z"/></svg>',
report:'<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="m12 2.6 8.4 4v6.1c0 4.3-3.1 7.4-8.4 8.8-5.3-1.4-8.4-4.5-8.4-8.8V6.6l8.4-4Z"/><path d="M12 7.2v6.1M12 16.6h.01" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg>',
asesmen:'<svg viewBox="0 0 24 24"><rect x="4" y="5" width="3.6" height="15" rx="1.2" fill="currentColor" stroke="none" opacity=".65"/><rect x="10.2" y="2.5" width="3.6" height="17.5" rx="1.2" fill="currentColor" stroke="none"/><rect x="16.4" y="8" width="3.6" height="12" rx="1.2" fill="currentColor" stroke="none" opacity=".82"/></svg>',
tindak:'<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="currentColor" stroke="none"/><path d="m7.8 12.2 2.7 2.7 5.9-6" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
kpi:'<svg viewBox="0 0 24 24"><rect x="3.5" y="11" width="4" height="9" rx="1" fill="currentColor" stroke="none" opacity=".65"/><rect x="10" y="5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/><rect x="16.5" y="8" width="4" height="12" rx="1" fill="currentColor" stroke="none" opacity=".82"/></svg>',
mutu:'<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="m12 2.6 2.9 5.8 6.4.9-4.7 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.7-4.5 6.4-.9L12 2.6Z"/></svg>',
capaian:'<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M6 2.8h9.2L19 6.6V21H6a2 2 0 0 1-2-2V4.8a2 2 0 0 1 2-2Z"/><path d="M15 2.8v4h4M8.4 11h6.8M8.4 14h6.8M8.4 17h5" stroke="white" stroke-width="1.3" opacity=".9"/></svg>'};

const menus=[
['menu-absen-kbm','Presensi Santri','presensi','Catat kehadiran kelas'],
['menu-kalender-materi','Materi Pembelajaran','materi','Target dan capaian materi'],
['menu-nilai','Nilai Ujian','nilai','Kelola hasil belajar'],
['menu-tindak-lanjut-guru','Tindak Lanjut','tindak','Dampingi perkembangan santri'],
['menu-tahfiz','Tahsin & Tahfiz','tahfiz','Bacaan dan setoran hafalan'],
['menu-laporan-murojaah','Lapor Pelanggaran','report','Catat kejadian santri'],
['menu-asesmen-guru','Self Asesmen','asesmen','Refleksi dan pengembangan diri'],
['menu-kpi-guru','KPI Guru','kpi','Tinjau kinerja mengajar'],
['menu-guru-menulis','Tulis Materi','tulis','Siapkan ilmu sebelum kelas']
];
$('teacherMenuGrid').innerHTML=menus.map(([id,title,icon,desc])=>`<button class="hub-menu-card ${icon}" onclick="${id==='menu-kalender-materi'?'openMateriMenu()':`openMenu('${id}')`}"><span class="hub-menu-icon">${menuIcons[icon]}</span><b>${title}</b><small>${desc}</small><span class="hub-arrow" aria-hidden="true">↗</span></button>`).join('');
function renderIdentity(){
  const identity=[USER.email,USER.username,USER.nama,USER.name,USER.displayName,USER.label].join(' ');
  const meaningful=[USER.nama,USER.name,USER.displayName,USER.namaTampilan,USER.label,USER.username].find(v=>v&&!/^(admin|admin cahaya|pengguna cahaya)$/i.test(String(v).trim()));
  const name=/multazam/i.test(identity)?'Multazam':String(meaningful||'Guru').trim();
  $('greeting').textContent=name;
  $('dateM').textContent=new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'long',year:'numeric'}).format(new Date());
  try{$('dateH').textContent=new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura',{day:'numeric',month:'long',year:'numeric'}).format(new Date()).replace(/ AH/i,' H')}catch{$('dateH').textContent=''}
  const btn=$('avatarBtn'),photo=USER.fotoProfil||USER.foto_profil||USER.photoURL||USER.profilePhoto||USER.avatar||USER.foto||USER.photo;
  btn.setAttribute('aria-label','Foto profil '+name);btn.textContent=name.charAt(0);
  if(photo){const img=new Image();img.src=photo;img.alt='Foto profil '+name;img.referrerPolicy='no-referrer';img.onerror=()=>{btn.textContent=name.charAt(0)};btn.replaceChildren(img)}
  $('notifyBadge').style.display='none';
}
window.openActivities=()=>{
  $('attentionList').innerHTML=menus.filter(x=>['menu-absen-kbm','menu-nilai','menu-guru-menulis'].includes(x[0])).map(([id,title,icon,desc])=>`<button class="attention-item" onclick="closeModal('attentionModal');openMenu('${id}')"><span class="attention-item-icon">${menuIcons[icon]}</span><span class="attention-item-copy"><b>${title}</b><small>${desc}</small></span></button>`).join('');
  $('attentionModal').querySelector('h3').textContent='Aktivitas Hari Ini';
  $('attentionModal').classList.add('show');
};
window.openAttentionModal=()=>{
  $('attentionModal').querySelector('h3').textContent='Notifikasi';
  $('attentionList').innerHTML='<button class="attention-item" onclick="closeModal(\'attentionModal\');openMenu(\'menu-chat\')"><span class="attention-item-copy"><b>Buka Pesan</b><small>Lihat pesan dan pemberitahuan Anda.</small></span></button>';
  $('attentionModal').classList.add('show');
};
function localScript(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
async function actions(){
  if(!actionPromise) actionPromise=(async()=>{
    window.CAHAYA_CONFIG=P.CAHAYA_CONFIG;window.CAHAYA_MASTER_DATA=P.CAHAYA_MASTER_DATA;
    if(!window.CAHAYA_CONFIG)await localScript('config/tenant-config.js?v=149');
    if(!window.CAHAYA_MASTER_DATA)await localScript('config/master-data.js?v=149');
    if(!window.CahayaGuruKPI)await localScript('js/guru-kpi-v144.js?v=155');
    return import('./guru-home-actions.js?v=203');
  })().catch(error=>{actionPromise=null;throw error});
  return actionPromise;
}
async function openPanel(kind){
  const started=performance.now(),marks={};
  const timing=stage=>{if(marks[stage]!==undefined)return;marks[stage]=Math.round(performance.now()-started);console.debug('[Guru quick access]',kind,stage,marks[stage]+'ms');};
  const generation=++actionGeneration;
  $('teacherSheetTitle').textContent=kind==='leave'?'Izin / Sakit':'Jadwal Hari Ini';
  $('teacherSheetSub').textContent='Memuat data yang Anda buka…';
  $('teacherSheetStats').replaceChildren();$('teacherSheetCount').textContent='';
  $('teacherSheetList').innerHTML='<div class="sheet-empty" role="status">Memuat…</div>';
  $('teacherSheet').classList.add('show');
  timing('shell');
  try{const module=await actions();if(active&&generation===actionGeneration)await module.openPanel(kind,()=>active&&generation===actionGeneration,timing)}
  catch(error){console.warn('Fitur belum dapat dimuat',error);if(generation===actionGeneration)$('teacherSheetList').innerHTML='<div class="sheet-empty">Data belum dapat dimuat. Periksa koneksi lalu buka kembali fitur ini.</div>'}
}
window.openScheduleModal=()=>openPanel('schedule');
window.openLeaveModal=()=>openPanel('leave');
window.closeTeacherSheet=()=>{actionGeneration++;$('teacherSheet').classList.remove('show')};
function suspend(){active=false;actionGeneration++;document.querySelectorAll('.show').forEach(el=>el.classList.remove('show'))}
window.addEventListener('cahaya:suspend',suspend);
window.addEventListener('cahaya:resume',()=>{active=true;USER={...USER,...storedProfile()};renderIdentity()});
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==P)return;
  if(event.data?.type==='CAHAYA_PROFILE_SYNC'){USER={...USER,...event.data.profile};renderIdentity()}
  if(event.data?.type==='CAHAYA_PAGE_SUSPEND')suspend();
});
renderIdentity();
if(P!==window)P.postMessage({type:'CAHAYA_PROFILE_REQUEST'},location.origin);
if(new URLSearchParams(location.search).get('openSchedule')==='1')window.openScheduleModal();
})();
