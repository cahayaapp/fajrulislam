/* CAHAYA APP V63 — Premium Wali Feature behavior */
(function(){
  'use strict';

  const MONTHS=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const now=new Date();

  function addTitle(title,desc='',period=''){
    const host=document.querySelector('.app-container,.app');
    if(!host||host.querySelector(':scope > .v63-page-title'))return;
    const wrap=document.createElement('div');
    wrap.className='v63-page-title';
    wrap.innerHTML=`<div class="v63-page-title-copy"><small>PORTAL WALI</small><h1>${title}</h1>${desc?`<p>${desc}</p>`:''}</div>${period?`<span class="v63-period-note" id="v63PeriodNote">${period}</span>`:''}`;
    host.insertBefore(wrap,host.firstElementChild);
  }

  function setPeriodNote(text){
    const el=document.getElementById('v63PeriodNote');
    if(el)el.textContent=text||'';
  }

  function ensureDownloadAtBottom(){
    const btn=document.getElementById('btnDownloadPdf');
    const host=document.querySelector('.app-container');
    if(!btn||!host)return;
    let footer=host.querySelector('.v63-download-footer');
    if(!footer){footer=document.createElement('div');footer.className='v63-download-footer';host.appendChild(footer)}
    footer.appendChild(btn);
    btn.innerHTML='<span>↓</span> Download PDF Resmi';
  }

  function monthLabel(value,mode){
    if(mode==='native'){
      const m=String(value||'').match(/^(\d{4})-(\d{2})$/);
      if(!m)return value;
      return `${MONTHS[Number(m[2])-1]} ${m[1]}`;
    }
    return `${value} ${now.getFullYear()}`;
  }

  function showPeriodChooser({mode='report',select,onPick,title='Pilih Bulan Laporan'}){
    if(!select)return;
    const overlay=document.createElement('div');
    overlay.className='v63-period-overlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.innerHTML=`<section class="v63-period-sheet"><div class="v63-period-sheet-head"><div class="v63-period-mark">◷</div><h2>${title}</h2><p>Pilih periode yang ingin ditampilkan.</p></div><div class="v63-month-grid"></div></section>`;
    const grid=overlay.querySelector('.v63-month-grid');
    MONTHS.forEach((name,index)=>{
      const value=mode==='native'?`${now.getFullYear()}-${String(index+1).padStart(2,'0')}`:name;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='v63-month-btn'+(String(select.value)===value?' active':'');
      btn.innerHTML=`<strong>${name}</strong><span>${now.getFullYear()}</span>`;
      btn.addEventListener('click',async()=>{
        select.value=value;
        setPeriodNote(monthLabel(value,mode));
        try{
          if(typeof onPick==='function') await onPick(value);
          else select.dispatchEvent(new Event('change',{bubbles:true}));
        }catch(err){console.warn('Periode belum dapat diterapkan:',err)}
        overlay.remove();
        document.body.classList.remove('v63-await-period');
      });
      grid.appendChild(btn);
    });
    document.body.appendChild(overlay);
  }

  function setupReport(kind){
    document.body.classList.add('v63-premium-page','v63-report-page','v63-await-period');
    const cfg={
      akademik:['Laporan Akademik','Perkembangan belajar, asesmen, tahfiz, murojaah, dan hasil ujian ananda.'],
      karakter:['Laporan Karakter CAHAYA','Ringkasan perkembangan lima dimensi CAHAYA dalam bahasa yang mudah dibaca.'],
      pembinaan:['Laporan Pembinaan','Kedisiplinan program, pembelajaran, dan tindak lanjut pembinaan ananda.']
    }[kind];
    const select=document.getElementById('filterBulan');
    const initial=select?.value&&select.value!=='Semua'?select.value:MONTHS[now.getMonth()];
    if(select&&initial)select.value=initial;
    addTitle(cfg[0],cfg[1],`${initial} ${now.getFullYear()}`);
    ensureDownloadAtBottom();
    setTimeout(()=>showPeriodChooser({
      mode:'report',select,title:'Pilih Bulan Laporan',
      onPick:(chosen)=>{
        const apply=()=>{
          if(select.value!==chosen)select.value=chosen;
          if(typeof window.renderSemuaData==='function')window.renderSemuaData();
          else select.dispatchEvent(new Event('change',{bubbles:true}));
        };
        apply();
        [450,1300,2600].forEach(delay=>setTimeout(apply,delay));
      }
    }),80);
  }

  function setupInformation(){
    document.body.classList.add('v63-premium-page','page-informasi-penting-v63');
  }

  function setupHealth(){
    document.body.classList.add('v63-premium-page','page-kesehatan-v63','v63-await-period');
    const select=document.getElementById('monthFilter');
    if(select&&!select.value)select.value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    addTitle('Riwayat Kesehatan','Catatan pemeriksaan, pelayanan UKS, obat, disposisi, dan tindak lanjut.',select?monthLabel(select.value,'native'):'');
    setTimeout(()=>showPeriodChooser({
      mode:'native',select,title:'Pilih Bulan Riwayat',
      onPick:async()=>{ if(typeof window.loadData==='function')await window.loadData(); else select.dispatchEvent(new Event('change',{bubbles:true})); }
    }),80);
  }

  function setupPermit(){
    document.body.classList.add('v63-premium-page','page-perizinan-v63');
    addTitle('Perizinan Santri','Ajukan izin sesuai SOP dan pantau keputusan pimpinan dengan lebih ringkas.');
    const main=document.querySelector('main.app');
    const panels=[...document.querySelectorAll('main.app > .panel')];
    if(!main||panels.length<2)return;
    panels[0].classList.add('v63-permit-form-panel');
    panels[1].classList.add('v63-permit-history-panel');
    const tabs=document.createElement('div');
    tabs.className='v63-permit-tabs';
    tabs.innerHTML='<button class="v63-permit-tab active" type="button" data-mode="form">Ajukan Izin</button><button class="v63-permit-tab" type="button" data-mode="history">Riwayat Izin</button>';
    const title=main.querySelector('.v63-page-title');
    main.insertBefore(tabs,title?title.nextSibling:main.firstChild);
    tabs.addEventListener('click',e=>{
      const btn=e.target.closest('.v63-permit-tab');if(!btn)return;
      const history=btn.dataset.mode==='history';
      document.body.classList.toggle('v63-show-history',history);
      tabs.querySelectorAll('.v63-permit-tab').forEach(x=>x.classList.toggle('active',x===btn));
      if(history&&typeof window.loadData==='function')window.loadData().catch(()=>{});
    });
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const path=(location.pathname.split('/').pop()||'').toLowerCase();
    if(path==='akademik.html')setupReport('akademik');
    else if(path==='karakter.html')setupReport('karakter');
    else if(path==='pembinaan.html')setupReport('pembinaan');
    else if(path==='informasi-penting.html')setupInformation();
    else if(path==='riwayat-kesehatan.html')setupHealth();
    else if(path==='perizinan.html')setupPermit();
  });
})();
