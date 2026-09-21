/* CAHAYA presentation adapter. No Firebase, session writes, permissions or routes. */
(() => {
  'use strict';
  if (window.CahayaUIV2) return;
  const root = new URL('../', document.currentScript.src);
  const path = location.pathname.slice(root.pathname.length);
  let fallbackHome=false;
  try{fallbackHome=path==='role-workspace.html'&&parent!==window&&parent.document.body.classList.contains('director-home-shell')}catch{}
  const home = /^home-[^/]+\.html$/.test(path)||fallbackHome;
  const shell = path === 'main-dashboard.html' || path === 'wali/dashboard/index.html';
  const wali = path.startsWith('wali/');
  // One responsive Home composition. Existing feature controllers stay intact.
  if(home || path==='wali/dashboard/beranda.html' || shell || path==='wali/dashboard/index.html'){
    const mobileStyle=document.createElement('link');mobileStyle.rel='stylesheet';mobileStyle.href=new URL('css/mobile-home-v2.css?v=265',root).href;document.head.append(mobileStyle);
    if(home || path==='wali/dashboard/beranda.html'){
      const mobileScript=document.createElement('script');mobileScript.src=new URL('js/mobile-home-v2.js?v='+(path.startsWith('wali/')?'269':'271'),root).href;mobileScript.defer=true;document.head.append(mobileScript);
    }
  }
  const mappings = {
    'ui-page': '.me-shell,.ks-page,.mu-shell,.mu-home,.dv-shell,.dv-home,.attendance-page,.nq-core-shell,.c2-page,.executive-home,.naqib-home,body.guru-hub>.app,.journal-page,.checklist-page,.stock-page,.sp-shell,body.manager-edu-v194>.page',
    'ui-hero': '.me-hero,.ks-hero,.mu-hero,.dv-hero,.exec-hero,.naqib-home>.hero,.hero-greeting,.nq-core-hero,.c2-hero,.page-hero,.subpage-heading,.sp-hero,body.manager-edu-v194 .hero',
    'ui-brandbar': '.me-home-header,.hub-header,.brand-row',
    'ui-brand': '.me-home-brand,.brand',
    'ui-avatar': '.me-home-avatar,.avatar',
    'ui-eyebrow': '.me-eyebrow,.ks-eyebrow,.mu-eyebrow,.dv-eyebrow,.nq-core-eyebrow,.c2-eyebrow,.exec-kicker,.hub-eyebrow,.kicker,.sp-eyebrow',
    'ui-section': '.me-section,.ks-section,.exec-section,.naqib-home>.section,.hub-quick,.hub-menu',
    'ui-section-heading': '.me-section-title,.ks-section-head,.mu-section-title,.dv-section-title,.nq-section-head,.hub-section-head,.c2-section-head',
    'ui-quick-grid': '#quickGrid,.quick-grid,.hub-quick-grid,.exec-quick,.mu-home-grid,.dv-home-grid',
    'ui-menu-grid': '#menuGrid,.menu-grid,.hub-menu-grid,.exec-grid',
    'ui-quick-card': '.me-card.primary,.ks-action,.mu-feature,.dv-feature,.quick,.hub-quick-card,.exec-quick>button',
    'ui-menu-card': '.me-menu .me-card,.menu-card,.hub-menu-card,.exec-card,.ks-menu',
    'ui-icon-tile': '.me-icon,.ks-icon,.mu-feature>i,.dv-feature>i,.quick>span,.hub-icon,.menu-icon,.exec-icon,.exec-quick>button>span',
    'ui-panel': '.me-panel,.ks-panel,.mu-panel,.dv-panel,.dv-meal,.dv-list-card,.dv-guide-card,.nq-panel,.c2-card,.cahaya-card,.program-group,.journal-panel,.checklist-page>.panel,.stock-page .panel,body.manager-edu-v194 .card,.sp-controls',
    'ui-record': '.me-row,.ks-case,.mu-history-card,.dv-history-card,.student-card,.mu-student',
    'ui-filter': '.me-toolbar,.ks-toolbar,.ks-date-filter,.mu-date-range,.dv-date-range',
    'ui-field': '.me-field,.ks-field,.mu-field,.dv-field,.nq-field,.c2-field,.form-group,.sp-field,body.manager-edu-v194 .field',
    'ui-button': '.me-btn,.me-back,.ks-btn,.ks-back,.mu-primary,.dv-primary,.dv-secondary,.dv-add,.nq-primary,.c2-primary,.c2-back,.save-button,.present-all,.back-button,.btn-cahaya,.submit-button,.primary-button,.secondary-button,.mu-top>button,.dv-top>button,.mu-shortcuts>button,.dv-shortcuts>button,.ks-shortcuts>button,.sp-back,.sp-button,body.manager-edu-v194 .btn',
    'ui-status': '.me-status,.ks-status,.mu-tag,.dv-status,.nq-core-chip,.c2-role,.saved-notice',
    'ui-empty': '.me-empty,.ks-empty,.c2-empty,.nq-empty,.empty-state,.sheet-empty,.attention-empty',
    'ui-state': '.me-state,.ks-state,.mu-state,.dv-state,.nq-inline-state,.inline-state,.c2-loading,.sp-state',
    'ui-overlay': '.me-overlay,.ks-overlay,.mu-overlay,.dv-overlay,.modal-backdrop,.cahaya-global-role-overlay,.insight-backdrop,.modal-overlay,.sp-overlay',
    'ui-dialog': '.me-sheet,.ks-sheet,.mu-sheet,.dv-sheet,.guide-card,.modal-backdrop>.modal,.modal-overlay>.modal,.cahaya-global-role-dialog,.insight-sheet,.sp-sheet',
    'ui-toast': '.me-toast,.ks-toast,.mu-toast,.dv-toast,.c2-toast,.toast,.sp-toast',
    'ui-summary': '.me-summary,.ks-metrics,.nq-metric-grid,.local-summary',
    'ui-metric': '.me-stat,.ks-metric,.nq-metric,.summary-item'
  };
  // Existing Wali reports share the same presentation, not staff terminology.
  if(wali&&!shell&&path!=='wali/dashboard/beranda.html'){
    mappings['ui-page']+=',body>.app,body>.app-container,body>.container';
    mappings['ui-hero']+=',.hero,.page-header,.header-banner,.profile-header,.rg-header-card';
    mappings['ui-panel']+=',.section-card,.report-card,.health-card,.permit-card,.info-card,.panel,.card:not(.modal):not(.wm-layer-card)';
    mappings['ui-filter']+=',.filter-container,.toolbar';
    mappings['ui-button']+=',.btn,.btn-primary,.btn-secondary,.month-nav';
    mappings['ui-empty']+=',.empty';
  }
  mappings['ui-button']+=',.ui-feature .btn,.ui-feature .btn-primary,.ui-feature .btn-secondary';
  mappings['ui-button']+=',.mv-target>button,.mv-tabs>button';
  mappings['ui-icon-tile']+=',.mv-target-icon';
  mappings['ui-record']+=',.mv-target';
  mappings['ui-panel']+=',.ui-feature .section-card,.ui-legacy-page>.card,.ui-legacy-page>.panel';
  mappings['ui-hero']+=',.ui-feature .page-header:has(h1),.ui-feature .header-card:has(h1),.ui-legacy-page>.header:has(h1)';
  const icons = {
    camera:'M3 6h4l2-3h6l2 3h4v15H3zM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    calendar:'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2',
    people:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8m6 10v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    report:'M6 2h9l4 4v16H6zM14 2v5h5M9 12h7M9 16h7',
    check:'m5 12 4 4L19 6M20 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9',
    chart:'M4 20h17M7 16V9m5 7V4m5 12v-6',
    book:'M12 5v16M3 3h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3z',
    history:'M3 3v6h6M3 9a9 9 0 1 1 0 7M12 7v5l3 2',
    arrow:'M6 18 18 6M6 6h12v12',
    eye:'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12m13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z',
    link:'M10 13a5 5 0 0 0 7 .2l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7-.2l-3 3a5 5 0 0 0 7 7l2-2',
    kitchen:'M4 10h16l-2 10H6zM8 7V3m4 4V3m4 4V3M2 10h20',
    grid:'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z'
  };
  function svgFor(text) {
    if(/foto|dokumentasi/i.test(text))return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons.camera}"/></svg>`;
    const key=/riwayat/i.test(text)?'history':/panduan|materi/i.test(text)?'book':/kpi|capaian|nilai/i.test(text)?'chart':/observasi|kondisi|kontrol/i.test(text)?'eye':/eskalasi|tindak|keputusan/i.test(text)?'arrow':/guru|personil|supervisor|konselor|mentoring/i.test(text)?'people':/url|tautan/i.test(text)?'link':/dapur|logbook/i.test(text)?'kitchen':/absensi|checklist/i.test(text)?'check':/jadwal/i.test(text)?'calendar':/inisiatif|teladan|asesmen/i.test(text)?'star':/lapor/i.test(text)?'report':'grid';
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${icons[key]}"/></svg>`;
  }
  function mapElements(scope=document) {
    for(const [name,selector] of Object.entries(mappings)) {
      const nodes=[...(scope.matches?.(selector)?[scope]:[]),...scope.querySelectorAll(selector)];
      nodes.forEach(el=>{if(!el.classList.contains(name))el.classList.add(name)});
    }
    scope.querySelectorAll('.ui-icon-tile').forEach(el=>{
      if(el.querySelector('svg,img')||el.dataset.uiIcon)return;
      el.dataset.uiIcon='true';el.innerHTML=svgFor(el.parentElement.textContent);
    });
    scope.querySelectorAll('.ui-toast,.ui-state').forEach(el=>{
      if(!el.hasAttribute('role'))el.setAttribute('role','status');
      if(!el.hasAttribute('aria-live'))el.setAttribute('aria-live','polite');
    });
    scope.querySelectorAll('table').forEach(table=>{
      if(table.closest('.ui-table-scroll')||table.dataset.uiTable)return;
      table.dataset.uiTable='true';const wrap=document.createElement('div');wrap.className='ui-table-scroll';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',table.caption?.textContent||'Tabel data, geser untuk melihat kolom lainnya');table.before(wrap);wrap.append(table);
    });
    scope.querySelectorAll('button.ui-close,.me-close,.mu-close,.dv-close,.close-btn').forEach(el=>{if(!el.hasAttribute('aria-label'))el.setAttribute('aria-label','Tutup dialog')});
    if(shell){
      const menus=[...(scope.matches?.('.nav-item.menu-akses')?[scope]:[]),...scope.querySelectorAll('.nav-item.menu-akses')];
      menus.forEach(menu=>{
        if(menu.querySelector('.ui-nav-icon'))return;
        const first=[...menu.childNodes].find(node=>node.nodeType===3&&node.textContent.trim());
        if(first)first.textContent=first.textContent.replace(/^[^A-Za-z0-9]+/,'');
        const icon=document.createElement('span');icon.className='ui-nav-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML=svgFor(menu.textContent);menu.prepend(icon);
      });
    }
  }
  function brandbar() {
    const host=document.querySelector('.ui-page');if(!host||host.querySelector('.ui-brandbar'))return;
    const header=document.createElement('header');header.className='ui-brandbar';
    header.innerHTML=`<div class="ui-brand"><img src="${new URL('assets/cahaya-app/logo-icon.png',root)}" alt=""><span><strong>CAHAYA <em>APP</em></strong><small>Pesantren Cahaya Fajrul Islam</small></span></div><button type="button" class="ui-avatar" aria-label="Buka profil">C</button>`;
    let user={};try{user=JSON.parse(localStorage.getItem('cahayaCurrentUser')||'{}')}catch{}
    header.querySelector('button').textContent=String(user.nama||user.displayName||user.label||'C').trim().charAt(0).toUpperCase();
    header.querySelector('button').onclick=()=>{try{if(parent!==window&&parent.openAuthorizedMenu)parent.openAuthorizedMenu('menu-profil')}catch{}};
    host.prepend(header);
  }
  function homeIdentity(){
    if(!home)return;
    document.querySelectorAll('.ui-brand').forEach(brand=>{if(!brand.querySelector('small')){const small=document.createElement('small');small.textContent='Pesantren Cahaya Fajrul Islam';const copy=brand.querySelector('.brand-copy,span');if(copy)copy.append(small)}});
    const greeting=document.querySelector('#greeting');
    document.querySelectorAll('#managerName,#nameChip').forEach(name=>{
      if(greeting&&name.textContent.trim()&&greeting.textContent.includes(name.textContent.trim()))name.classList.add('ui-duplicate-identity');
    });
    const role=document.querySelector('[data-cahaya-home-role]')?.textContent.replace('▾','').trim();
    if(role)document.querySelectorAll('#nameChip,#levelChip,#scopeChip').forEach(el=>{
      const text=el.textContent.trim();if(el.tagName==='SPAN'&&text&&(text===role||role===`Konselor ${text}`||text==='Konselor'&&role.startsWith('Konselor ')))el.classList.add('ui-duplicate-identity');
    });
  }
  function tone(scope){
    const states=[...(scope.matches?.('.ui-state,.ui-status,.ui-toast')?[scope]:[]),...scope.querySelectorAll('.ui-state,.ui-status,.ui-toast')];
    states.forEach(el=>{
      const text=el.textContent.trim();
      const kind=/gagal|tidak dapat|ditolak|error/i.test(text)?'error':/memuat|menyiapkan|menyimpan/i.test(text)?'loading':/berhasil|tersimpan/i.test(text)?'success':'';
      if(el.dataset.uiTone!==kind)el.dataset.uiTone=kind;
    });
  }
  function shellNavigation(){
    const nav=document.getElementById('mobileBottomNav');if(!nav)return;
    let tapped=null;
    const sync=()=>{
      const buttons=[...nav.querySelectorAll('.mobile-shortcut-btn')],active=buttons.filter(b=>b.classList.contains('active'));
      // Internal shell standard: Jadwal | KPI | Beranda | Pesan | Lainnya.
      // Wali has its own navigation and never enters this function.
      // Some legacy shortcuts share a destination. Do not falsely mark both current.
      const homeTab=document.body.classList.contains('director-home-shell')?active.find(b=>b.dataset.menuId==='menu-home'):null;
      const current=homeTab||(active.length===1?active[0]:active.includes(tapped)?tapped:null);
      buttons.forEach(b=>{const muted=b.classList.contains('active')&&b!==current;if(b.classList.contains('ui-nav-muted')!==muted)b.classList.toggle('ui-nav-muted',muted);if(b===current){if(b.getAttribute('aria-current')!=='page')b.setAttribute('aria-current','page')}else b.removeAttribute('aria-current')});
    };
    nav.addEventListener('click',e=>{tapped=e.target.closest('.mobile-shortcut-btn');queueMicrotask(sync)},true);
    new MutationObserver(sync).observe(nav,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});sync();
    const profile=document.getElementById('topNavProfile');if(profile){profile.setAttribute('role','button');profile.tabIndex=0;profile.setAttribute('aria-label','Buka profil');profile.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();profile.click()}})}
  }
  // Focus management only. Closing delegates to each page's existing close action.
  let activeDialog=null,returnFocus=null;
  let pendingConfirmation=null;
  function confirmAction({title='Konfirmasi tindakan',message='',confirmLabel='Lanjutkan',danger=false}={}){
    if(pendingConfirmation)return Promise.resolve(false);
    return new Promise(resolve=>{
      const overlay=document.createElement('div');overlay.className='ui-overlay ui-confirm';overlay.style.display='flex';
      const dialog=document.createElement('section');dialog.className='ui-dialog';
      const heading=document.createElement('h2');heading.id='ui-confirm-title';heading.textContent=title;dialog.setAttribute('aria-labelledby',heading.id);
      const copy=document.createElement('p');copy.textContent=message;
      const actions=document.createElement('div');actions.className='ui-confirm-actions';
      const cancel=document.createElement('button');cancel.type='button';cancel.className='ui-button';cancel.textContent='Batal';cancel.setAttribute('aria-label','Tutup konfirmasi');
      const accept=document.createElement('button');accept.type='button';accept.className=`ui-button ${danger?'danger':'primary'}`;accept.textContent=confirmLabel;
      const done=result=>{overlay.remove();pendingConfirmation=null;removeEventListener('cahaya:suspend',abort);removeEventListener('pagehide',abort);resolve(result)};
      const abort=()=>done(false);pendingConfirmation=abort;
      cancel.onclick=abort;accept.onclick=()=>done(true);overlay.onclick=e=>{if(e.target===overlay)abort()};
      actions.append(cancel,accept);dialog.append(heading,copy,actions);overlay.append(dialog);document.body.append(overlay);
      addEventListener('cahaya:suspend',abort,{once:true});addEventListener('pagehide',abort,{once:true});
    });
  }
  function visibleDialogs(){return [...document.querySelectorAll('.ui-dialog')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden')}
  function syncDialog(){
    const next=visibleDialogs().at(-1)||null;
    if(next===activeDialog)return;
    if(next){returnFocus=document.activeElement;activeDialog=next;next.setAttribute('role','dialog');next.setAttribute('aria-modal','true');if(!next.hasAttribute('aria-label')&&!next.hasAttribute('aria-labelledby'))next.setAttribute('aria-label',next.querySelector('h2,h3')?.textContent||'Formulir');next.tabIndex=-1;next.focus({preventScroll:true})}
    else{activeDialog=null;if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null}
  }
  function init(){
    if(!document.body||document.getElementById('roleAccessDenied'))return;
    document.documentElement.classList.add('cahaya-v2');
    const css=document.getElementById('cahaya-ui-v2-theme');if(css)document.head.append(css);
    const featureTheme=document.createElement('link');featureTheme.id='cahaya-feature-theme';featureTheme.rel='stylesheet';featureTheme.href=new URL('css/cahaya-feature-theme-v264.css?v=264',root).href;document.head.append(featureTheme);
    document.body.classList.add(shell?'ui-shell':home?'ui-home':'ui-feature');
    if(parent!==window)document.body.classList.add('ui-embedded');
    if(wali)document.body.classList.add('ui-wali');
    if(path==='home-direktur.html')document.body.classList.add('ui-executive');
    else if(/home-(manajer|supervisor)/.test(path))document.body.classList.add('ui-management');
    else document.body.classList.add('ui-execution');
    mapElements();
    if(!shell&&!document.querySelector('.ui-page')){
      const main=document.querySelector('main,.cahaya-container,.container,.wrap,body>.app,body>.app-container,body>.page');if(main&&!wali){main.classList.add('ui-page','ui-legacy-page');
        main.querySelectorAll(':scope>.hero,:scope>.intro').forEach(el=>el.classList.add('ui-hero'));
        main.querySelectorAll(':scope>.panel,:scope>section').forEach(el=>{if(!el.classList.contains('ui-hero'))el.classList.add('ui-panel')});
      }
    }
    mapElements();
    if(fallbackHome){
      // Existing generic workspace remains the same route and guide, with Home identity.
      const host=document.querySelector('.ui-page');let user={};try{user=JSON.parse(localStorage.getItem('cahayaCurrentUser')||'{}')}catch{}
      const role=window.CahayaRoleSystemV2?.resolveSession(user,localStorage);
      if(host&&role){const hero=document.createElement('section');hero.className='ui-hero';
        const hello=document.createElement('span');hello.className='ui-eyebrow';hello.textContent='Assalamu’alaikum,';
        const name=document.createElement('h1');name.textContent=user.label||user.nama||user.displayName||user.username||'Selamat datang';
        const chip=document.createElement('button');chip.type='button';chip.dataset.cahayaHomeRole='';chip.textContent=window.CahayaRoleSystemV2.displayLabelFor(role.activeRole,role.activeAssignment);chip.disabled=role.roles.length<2;
        const copy=document.createElement('p');copy.textContent='Gunakan menu sesuai tugas dan penugasan Anda.';hero.append(hello,name,chip,copy);host.prepend(hero);
      }
    }
    if(home){brandbar();homeIdentity();const main=document.querySelector('.ui-page');if(main)main.dataset.uiDensity=document.body.classList.contains('ui-executive')?'executive':document.body.classList.contains('ui-management')?'management':'execution';}
    const viewport=document.querySelector('meta[name="viewport"]');if(viewport)viewport.content=viewport.content.replace(/,?\s*(?:maximum-scale|user-scalable)\s*=\s*[^,]+/gi,'');
    tone(document);
    if(path==='main-dashboard.html')shellNavigation();
    const title=(document.title||document.querySelector('h1')?.textContent||'Ruang Kerja').replace(/CAHAYA APP/gi,'').replace(/\s+CAHAYA$/,'').replace(/^[\s•|—–-]+|[\s•|—–-]+$/g,'');
    document.title=`${title||'Ruang Kerja'} • CAHAYA APP`;
    // Attribute observation is limited to overlay state, not all form mutations.
    let queued=false;const observer=new MutationObserver(records=>{
      records.forEach(r=>{if(r.type==='childList'){r.addedNodes.forEach(n=>{if(n.nodeType===1)mapElements(n)});tone(r.target)}});
      if(!queued){queued=true;queueMicrotask(()=>{queued=false;homeIdentity();syncDialog()})}
    });
    observer.observe(document.body,{childList:true,subtree:true});
    const overlays=new MutationObserver(syncDialog);document.querySelectorAll('.ui-overlay').forEach(el=>overlays.observe(el,{attributes:true,attributeFilter:['class','style','hidden','aria-hidden']}));
    document.addEventListener('keydown',e=>{
      if(!activeDialog)return;
      if(e.key==='Tab'){
        const list=[...activeDialog.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
        if(!list.length){e.preventDefault();return}
        if(e.shiftKey&&(document.activeElement===list[0]||document.activeElement===activeDialog)){e.preventDefault();list.at(-1).focus()}
        else if(!e.shiftKey&&(document.activeElement===list.at(-1)||!activeDialog.contains(document.activeElement))){e.preventDefault();list[0].focus()}
      }
      if(e.key==='Escape'){const close=activeDialog.querySelector('.me-close,.mu-close,.dv-close,.close-btn,[aria-label^="Tutup"],#closeSheet,#closeModal');if(close)close.click();else{const overlay=activeDialog.closest('.ui-overlay');if(overlay?.onclick)overlay.click()}}
    });
    const suspend=()=>{observer.disconnect();overlays.disconnect()};
    addEventListener('pagehide',suspend,{once:true});
    // Cached iframes keep their UI observers; these do no reads or polling.
    window.CahayaUIV2={version:'265',enhance:mapElements,confirm:confirmAction};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
