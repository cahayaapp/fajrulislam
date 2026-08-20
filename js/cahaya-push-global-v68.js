/* CAHAYA APP V68 — Push Notification Global untuk seluruh role */
(function(){
  'use strict';

  const VERSION='68';
  const state={registration:null,messaging:null,ready:false,currentToken:''};
  const db=()=>firebase.database();
  const clean=(v='')=>String(v??'').trim();
  const safeKey=(v='')=>String(v??'').trim().replace(/[.#$\[\]\/]/g,'_').replace(/\s+/g,'_').toLowerCase();

  function normalizeRole(value=''){
    const raw=String(value||'').trim().toLowerCase();
    const aliases={
      'administrator':'admin','admin / tu':'admin','wakil direktur':'wakil',
      'wakil_direktur':'wakil','wadir':'wakil','wakil direktur bidang':'wakil',
      'counselor':'konselor','konseling':'konselor','wali_santri':'wali','wali santri':'wali'
    };
    return aliases[raw]||raw;
  }

  function rolesOf(user={}){
    let raw=user.akses??user.jabatan??user.roles??user.role??[];
    if(!Array.isArray(raw)) raw=(raw&&typeof raw==='object')?Object.values(raw):[raw];
    return [...new Set(raw.flatMap(v=>String(v||'').split(/[;,|]/)).map(normalizeRole).filter(Boolean))];
  }

  function profile(){
    try{return JSON.parse(localStorage.getItem('cahayaCurrentUser')||'null')||{}}catch(_){return {}}
  }

  function usernameOf(user={}){
    return clean(user.username||user.userName||(user.email?String(user.email).split('@')[0]:'')).toLowerCase();
  }

  function labelOf(user={}){
    return clean(user.label||user.namaTampilan||user.nama||user.username||'Pengguna CAHAYA');
  }

  function basePath(){
    return /\/keuangan\//i.test(location.pathname)?'../':'';
  }

  function serviceWorkerUrl(){return `${basePath()}firebase-messaging-sw.js?v=${VERSION}`}
  function serviceWorkerScope(){return basePath()||'./'}

  function hidePrompt(){document.getElementById('cahayaPushGlobalPromptV68')?.remove()}

  function showToast(title,body){
    let toast=document.getElementById('cahayaPushGlobalToastV68');
    if(!toast){
      toast=document.createElement('div');toast.id='cahayaPushGlobalToastV68';
      toast.style.cssText='position:fixed;z-index:2147483500;left:50%;top:16px;transform:translateX(-50%) translateY(-16px);width:min(410px,calc(100vw - 24px));padding:13px 15px;border:1px solid #e7ebf2;border-radius:17px;background:rgba(255,255,255,.985);box-shadow:0 18px 50px rgba(13,28,57,.20);font-family:Nunito,Arial,sans-serif;opacity:0;transition:.22s ease;pointer-events:none';
      document.body.appendChild(toast);
    }
    const safeTitle=String(title||'Notifikasi CAHAYA').replace(/[<>]/g,'');
    const safeBody=String(body||'Ada pembaruan baru.').replace(/[<>]/g,'');
    toast.innerHTML=`<b style="display:block;color:#152347;font-size:.79rem;font-weight:1000">${safeTitle}</b><span style="display:block;margin-top:3px;color:#6f7f96;font-size:.69rem;font-weight:750;line-height:1.45">${safeBody}</span>`;
    requestAnimationFrame(()=>{toast.style.opacity='1';toast.style.transform='translateX(-50%) translateY(0)'});
    clearTimeout(toast._timer);toast._timer=setTimeout(()=>{toast.style.opacity='0';toast.style.transform='translateX(-50%) translateY(-12px)'},4300);
  }

  function showPrompt(){
    if(!('Notification'in window)||document.getElementById('cahayaPushGlobalPromptV68')||Notification.permission!=='default')return;
    const user=profile();if(!usernameOf(user))return;
    const el=document.createElement('div');
    el.id='cahayaPushGlobalPromptV68';
    el.style.cssText='position:fixed;z-index:2147483400;left:50%;bottom:calc(88px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(440px,calc(100vw - 24px));display:grid;grid-template-columns:44px minmax(0,1fr) auto;align-items:center;gap:11px;padding:12px;border:1px solid rgba(239,185,55,.38);border-radius:20px;background:rgba(255,253,247,.985);box-shadow:0 18px 55px rgba(80,57,10,.16);font-family:Nunito,Arial,sans-serif';
    el.innerHTML='<span style="width:44px;height:44px;display:grid;place-items:center;border-radius:15px;background:linear-gradient(135deg,#fff0bd,#ffc54f);font-size:1.18rem;box-shadow:inset 0 0 0 1px rgba(255,255,255,.7)">🔔</span><span><b style="display:block;color:#463610;font-size:.76rem;font-weight:1000">Aktifkan Notifikasi CAHAYA</b><small style="display:block;margin-top:2px;color:#8e7847;font-size:.61rem;font-weight:760;line-height:1.4">Pesan, pengumuman, dan informasi tugas penting dapat muncul di HP ini.</small></span><button id="cahayaPushGlobalEnableV68" type="button" style="border:0;border-radius:12px;padding:9px 11px;color:#fff;background:linear-gradient(135deg,#e99511,#f5b934);font-size:.62rem;font-weight:1000;cursor:pointer;box-shadow:0 7px 16px rgba(232,154,21,.20)">Aktifkan</button>';
    document.body.appendChild(el);
    el.querySelector('#cahayaPushGlobalEnableV68').addEventListener('click',async e=>{
      const btn=e.currentTarget;btn.disabled=true;btn.textContent='Menyiapkan...';
      try{
        const result=await enable(true);
        if(result){hidePrompt();showToast('Notifikasi aktif','Perangkat ini siap menerima notifikasi sesuai akun dan role Anda.')}
        else{btn.disabled=false;btn.textContent='Coba Lagi'}
      }catch(err){console.warn(err);btn.disabled=false;btn.textContent='Coba Lagi';showToast('Notifikasi belum aktif',err?.message||'Periksa pengaturan browser.')}
    });
  }

  async function prepare(){
    if(state.ready)return state;
    if(!('serviceWorker'in navigator)||!('Notification'in window)||!firebase.messaging)throw new Error('Browser ini belum mendukung Web Push CAHAYA.');
    state.registration=await navigator.serviceWorker.register(serviceWorkerUrl(),{scope:serviceWorkerScope()});
    state.messaging=firebase.messaging();
    state.messaging.onMessage(payload=>{
      const title=payload?.notification?.title||payload?.data?.title||'Notifikasi CAHAYA';
      const body=payload?.notification?.body||payload?.data?.body||'Ada pembaruan baru.';
      showToast(title,body);
      try{window.dispatchEvent(new CustomEvent('cahaya:push-foreground',{detail:payload}))}catch(_){}
    });
    state.ready=true;return state;
  }

  async function getVapidKey(){
    try{const snap=await db().ref('cahaya_app/pengaturan_notifikasi_web/vapidKey').once('value');return clean(snap.val())}catch(_){return ''}
  }

  async function registerToken(){
    const user=profile();const username=usernameOf(user);const roles=rolesOf(user);
    if(!username)throw new Error('Identitas pengguna belum siap.');
    await prepare();
    const vapidKey=await getVapidKey();
    const options={serviceWorkerRegistration:state.registration};if(vapidKey)options.vapidKey=vapidKey;
    const token=await state.messaging.getToken(options);if(!token)throw new Error('Token notifikasi belum terbentuk.');
    state.currentToken=token;
    const userKey=safeKey(username);const tokenKey=safeKey(token.slice(-48));const now=new Date().toISOString();
    const payload={token,username,label:labelOf(user),roles,aktif:true,platform:navigator.platform||'',userAgent:navigator.userAgent,updatedAt:now,diperbarui:now};
    const updates={};
    updates[`cahaya_app/fcm_tokens_user/${userKey}/${tokenKey}`]=payload;
    roles.forEach(role=>{updates[`cahaya_app/fcm_users_by_role/${safeKey(role)}/${userKey}`]={username,label:payload.label,roles,aktif:true,updatedAt:now}});
    await db().ref().update(updates);
    localStorage.setItem(`cahayaPushGlobalV68_${userKey}`,JSON.stringify({token,tokenKey,roles,updatedAt:now}));
    return token;
  }

  async function deactivateCurrentDevice(){
    const user=profile();const username=usernameOf(user);if(!username)return false;
    const userKey=safeKey(username);
    let stored={};try{stored=JSON.parse(localStorage.getItem(`cahayaPushGlobalV68_${userKey}`)||'{}')||{}}catch(_){stored={}}
    let token=state.currentToken||stored.token||'';
    if(!token&&Notification.permission==='granted'){
      try{await prepare();const vapidKey=await getVapidKey();const options={serviceWorkerRegistration:state.registration};if(vapidKey)options.vapidKey=vapidKey;token=await state.messaging.getToken(options)||''}catch(_){}
    }
    if(!token)return false;
    const tokenKey=stored.tokenKey||safeKey(token.slice(-48));
    try{
      await db().ref(`cahaya_app/fcm_tokens_user/${userKey}/${tokenKey}`).update({aktif:false,diperbarui:new Date().toISOString(),logoutAt:new Date().toISOString()});
      localStorage.removeItem(`cahayaPushGlobalV68_${userKey}`);return true;
    }catch(err){console.warn('Token push belum dinonaktifkan:',err);return false}
  }

  async function enable(interactive=false){
    await prepare();let permission=Notification.permission;
    if(permission==='default'&&interactive)permission=await Notification.requestPermission();
    if(permission!=='granted')return false;
    await registerToken();return true;
  }

  async function openChatFromQuery(){
    const params=new URLSearchParams(location.search);const room=params.get('room');
    if(params.get('openChat')!=='1'||!room)return;
    const user=profile();const username=usernameOf(user);if(!username)return;
    let attempts=0;
    const timer=setInterval(async()=>{
      attempts++;
      try{
        if(typeof window.bukaChatDariPanel==='function'){
          let peerLabel='Pesan CAHAYA';
          try{const snap=await db().ref(`cahaya_app/pesan_inbox/${safeKey(username)}/${room}`).once('value');const item=snap.val()||{};peerLabel=item.peerLabel||item.peerUsername||peerLabel}catch(_){}
          clearInterval(timer);await window.bukaChatDariPanel(peerLabel,peerLabel,room);return;
        }
      }catch(_){}
      if(attempts>35)clearInterval(timer);
    },220);
  }

  function boot(){
    setTimeout(async()=>{
      try{
        if(!('Notification'in window))return;
        if(Notification.permission==='granted')await enable(false);
        else if(Notification.permission==='default')showPrompt();
      }catch(err){console.warn('Push Global CAHAYA belum siap:',err)}
      openChatFromQuery();
    },1350);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('pageshow',()=>{if(!('Notification'in window))return;if(Notification.permission==='granted')enable(false).catch(()=>{});else if(Notification.permission==='default')showPrompt()});

  window.CahayaPushGlobal={enable,registerToken,deactivateCurrentDevice,showPrompt,showToast,profile,rolesOf};
})();
