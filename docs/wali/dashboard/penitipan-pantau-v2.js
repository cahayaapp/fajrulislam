/* Read-only Wali view of the single Layanan penitipan_barang record. */
(function(){
  'use strict';
  const C=window.CahayaPenitipanV2;
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const local=key=>{try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(_){return{}}};
  const fmt=raw=>{if(!raw)return'—';const date=new Date(typeof raw==='number'?raw:String(raw));return Number.isNaN(date.getTime())?'—':new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'}).format(date)+' WIB'};
  const statusText={DITITIPKAN:'Barang sudah diterima petugas.',DIPROSES:'Barang sedang diperiksa atau disiapkan.',SIAP_DISERAHKAN:'Barang siap diberikan kepada santri.',SUDAH_DISERAHKAN:'Barang sudah diterima santri.',DITOLAK:'Barang tidak dapat diserahkan.'};
  const validPath=path=>/^penitipan_barang\/(putra|putri)\/\d{4}-\d{2}\/[A-Za-z0-9_-]+$/.test(path);
  let active=false,loading=false,studentIds=new Set(),roster=[],records=new Map(),pointerSets=new Map(),pointerOffs=[],recordOffs=new Map();
  function stop(){pointerOffs.forEach(off=>off());pointerOffs=[];recordOffs.forEach(off=>off());recordOffs.clear();pointerSets.clear();records.clear();active=false;loading=false}
  function feedback(text){$('depositFeedback').textContent=text}
  function render(){
    const all=[...records.values()].filter(x=>studentIds.has(String(x.santriId))).sort((a,b)=>(Number(b.createdAt)||Date.parse(b.deviceTime||b.updatedAt||''))-(Number(a.createdAt)||Date.parse(a.deviceTime||a.updatedAt||'')));
    const ongoing=all.filter(x=>!['SUDAH_DISERAHKAN','DITOLAK'].includes(C.statusOf(x)));
    $('depositTotal').textContent=String(all.length);$('depositActive').textContent=String(ongoing.length);$('depositDone').textContent=String(all.filter(x=>C.statusOf(x)==='SUDAH_DISERAHKAN').length);
    $('depositActiveBadge').textContent=ongoing.length?'('+ongoing.length+')':'';
    const child=$('depositChildFilter').value,filter=$('depositStateFilter').value;
    const shown=all.filter(x=>(!child||String(x.santriId)===child)&&(filter==='ALL'||(filter==='ACTIVE'?!['SUDAH_DISERAHKAN','DITOLAK'].includes(C.statusOf(x)):C.statusOf(x)==='SUDAH_DISERAHKAN')));
    $('depositCards').innerHTML=shown.map(x=>{const status=C.statusOf(x);return `<article class="deposit-card"><div class="deposit-card-top"><h3>${esc(x.namaBarang||x.jenis||'Barang titipan')}</h3><span class="deposit-status ${status}">${esc(C.statusLabels[status])}</span></div><p>Untuk: ${esc(x.santriNama||x.penerima||'Ananda')}</p><p>${esc(x.tanggalTitip||'')} • ${esc(x.waktuTitip||'')} WIB</p><p>${esc(statusText[status])}</p><button type="button" data-detail="${esc(x._path)}">Lihat Detail</button></article>`}).join('');
    feedback(all.length?(shown.length?'':'Tidak ada titipan pada filter ini.'):'Belum ada titipan barang. Barang yang dicatat oleh layanan pesantren untuk ananda akan muncul di sini.');
    $('depositCards').querySelectorAll('[data-detail]').forEach(button=>button.onclick=()=>openDetail(records.get(button.dataset.detail)));
  }
  function openDetail(x){if(!x||!studentIds.has(String(x.santriId)))return;const status=C.statusOf(x),pairs=[['Santri',x.santriNama||x.penerima],['Nama Barang',x.namaBarang||x.jenis],['Jumlah',x.jumlah],['Tanggal Titip',x.tanggalTitip],['Waktu',x.waktuTitip?x.waktuTitip+' WIB':''],['Status',C.statusLabels[status]],['Catatan Petugas',x.catatan],['Update Terakhir',fmt(x.updatedAt||x.createdAt)],['Petugas Penerima',x.petugas],['Siap Diserahkan',fmt(x.readyAt)],['Sudah Diserahkan',fmt(x.deliveredAt||x.diambilAt)],['Alasan',x.alasan]];const history=Array.isArray(x.riwayatStatus)?x.riwayatStatus:[];const body=pairs.filter(([key,value])=>value&&value!=='—'||['Status','Tanggal Titip','Waktu'].includes(key)).map(([key,value])=>`<dt>${esc(key)}</dt><dd>${esc(value||'—')}</dd>`).join('');$('depositDetailBody').innerHTML=`<dl>${body}</dl>${x.fotoBarang?.dataUrl?`<p><img src="${esc(x.fotoBarang.dataUrl)}" alt="Foto barang titipan"></p>`:''}${history.length?`<h3>Riwayat Status</h3><ol class="deposit-timeline">${history.map(item=>`<li>${esc(fmt(item.at))} — ${esc(C.statusLabels[item.status]||item.status)}</li>`).join('')}</ol>`:''}`;$('depositDetail').classList.add('show')}
  function reconcile(db){
    const paths=new Set();pointerSets.forEach(set=>set.forEach(path=>{if(validPath(path))paths.add(path)}));
    recordOffs.forEach((off,path)=>{if(!paths.has(path)){off();recordOffs.delete(path);records.delete(path)}});
    for(const path of paths){if(recordOffs.has(path))continue;const ref=db.ref(path);const handler=snap=>{const x=snap.val();if(x&&studentIds.has(String(x.santriId)))records.set(path,{...x,_path:path});else records.delete(path);render()};ref.on('value',handler,error=>{console.error('Titipan gagal dimuat',error);feedback('Data titipan belum dapat dimuat. Coba buka kembali halaman ini.')});recordOffs.set(path,()=>ref.off('value',handler))}
    render();
  }
  async function start(){
    if(active||loading)return;
    const currentUser=local('cahayaCurrentUser'),legacyRoles=[currentUser.role,currentUser.peran,...(Array.isArray(currentUser.akses)?currentUser.akses:[])].map(x=>String(x||'').toLowerCase());
    const legacyWali=!window.cahayaRoleContext&&Number(currentUser.roleSystemVersion||0)!==2&&legacyRoles.some(x=>['wali','wali santri','wali-santri'].includes(x));
    if(window.cahayaRoleContext?.activeRole!=='WALI_SANTRI'&&!legacyWali){feedback('Akses Pantau Titipan hanya untuk Wali Santri.');return}
    loading=true;feedback('Memuat titipan ananda...');
    try{
      const registry=window.CAHAYA_STUDENT_ID_REGISTRY;if(!Array.isArray(registry))throw new Error('Identitas santri tidak dapat dimuat.');
      roster=C.buildRoster(window.CAHAYA_MASTER_DATA?.santriByClass||{},registry);
      const current=local('cahayaCurrentUser'),account=local('cahayaWaliAccount'),profile=local('cahayaWaliStudentProfile');
      const currentName=String(current.username||current.waliUsername||'').toLowerCase(),accountName=String(account.username||account.waliUsername||'').toLowerCase();
      const staleAccount=Boolean(currentName&&accountName&&currentName!==accountName);
      const ownAccount=staleAccount?current:{...current,...account};
      const ownProfile=staleAccount?(current.student||current.santriAktif||{}):profile;
      const assignment=window.cahayaRoleContext?.assignment||window.cahayaRoleContext?.activeAssignment||{};
      studentIds=new Set(C.linkedStudentIds(ownAccount,ownProfile,assignment,roster));
      if(!studentIds.size){feedback('Relasi santri pada akun Wali belum dapat dipastikan. Hubungi admin untuk menautkan ID santri.');return}
      const children=roster.filter(x=>studentIds.has(x.id));$('depositChildFilter').innerHTML='<option value="">Semua Anak</option>'+children.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');$('depositChildFilter').hidden=children.length<2;
      if(!window.firebase?.apps?.length)window.firebase.initializeApp(window.CAHAYA_CONFIG.firebase);
      const db=window.firebase.database();active=true;
      studentIds.forEach(id=>{const ref=db.ref('penitipan_barang/index_santri/'+id);const handler=snap=>{pointerSets.set(id,new Set(Object.values(snap.val()||{}).filter(validPath)));reconcile(db)};ref.on('value',handler,error=>{console.error('Indeks titipan gagal dimuat',error);feedback('Data titipan belum dapat dimuat. Coba buka kembali halaman ini.')});pointerOffs.push(()=>ref.off('value',handler))});
    }catch(error){console.error('Pantau Titipan gagal dimuat',error);feedback(error.message||'Data titipan belum dapat dimuat.')}finally{loading=false}
  }
  function selectTab(monitor){$('depositRulesTab').classList.toggle('active',!monitor);$('depositMonitorTab').classList.toggle('active',monitor);$('depositRulesTab').setAttribute('aria-selected',String(!monitor));$('depositMonitorTab').setAttribute('aria-selected',String(monitor));$('depositRulesPane').hidden=monitor;$('depositMonitorPane').hidden=!monitor;if(monitor)start();else stop()}
  function init(){
    if(!C||!$('depositMonitorPane'))return;
    $('depositRulesTab').onclick=()=>selectTab(false);$('depositMonitorTab').onclick=()=>selectTab(true);$('depositChildFilter').onchange=render;$('depositStateFilter').onchange=render;
    const dialog=document.createElement('div');dialog.className='deposit-detail-backdrop';dialog.id='depositDetail';dialog.innerHTML='<div class="deposit-detail" role="dialog" aria-modal="true" aria-labelledby="depositDetailTitle"><h2 id="depositDetailTitle">Detail Titipan</h2><div id="depositDetailBody"></div><button type="button" id="depositDetailClose">Tutup</button></div>';document.body.appendChild(dialog);$('depositDetailClose').onclick=()=>dialog.classList.remove('show');dialog.onclick=event=>{if(event.target===dialog)dialog.classList.remove('show')};
    document.addEventListener('keydown',event=>{if(event.key==='Escape')dialog.classList.remove('show')});
    document.querySelectorAll('.tab-btn').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.tab!=='barang'&&active)stop()}));
    window.addEventListener('pagehide',stop);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
