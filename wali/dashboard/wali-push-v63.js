/* CAHAYA APP V63 — Push Notification Portal Wali */
(function(){
  'use strict';

  const state={registration:null,messaging:null,ready:false};
  const db=()=>firebase.database();
  const safeKey=(v='')=>String(v).trim().replace(/[.#$\[\]\/]/g,'_').replace(/\s+/g,'_').toLowerCase();
  const studentKey=(v='')=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const clean=(v='')=>String(v||'').trim();

  function session(){
    const account=window.CahayaWaliSession?.getAccount?.()||{};
    const student=window.CahayaWaliSession?.getStudent?.()||{};
    return {account,student};
  }

  function usernameOf(account={}){
    return clean(account.waliUsername||account.username||account.userName||(account.email?String(account.email).split('@')[0]:''));
  }

  function studentNameOf(student={}){
    return clean(student.namaAnak||student.namaSantri||student.namaAnanda||student.studentName||student.label||student.nama||'');
  }

  function hidePrompt(){document.getElementById('cahayaPushPromptV63')?.remove()}

  function showToast(title,body){
    let toast=document.getElementById('cahayaPushToastV63');
    if(!toast){
      toast=document.createElement('div');toast.id='cahayaPushToastV63';
      toast.style.cssText='position:fixed;z-index:2147483500;left:50%;top:16px;transform:translateX(-50%) translateY(-16px);width:min(390px,calc(100vw - 24px));padding:13px 15px;border:1px solid #e7ebf2;border-radius:17px;background:rgba(255,255,255,.98);box-shadow:0 18px 50px rgba(13,28,57,.20);font-family:Nunito,Arial,sans-serif;opacity:0;transition:.22s ease;pointer-events:none';
      document.body.appendChild(toast);
    }
    toast.innerHTML=`<b style="display:block;color:#152347;font-size:.79rem;font-weight:1000">${String(title||'Notifikasi CAHAYA').replace(/[<>]/g,'')}</b><span style="display:block;margin-top:3px;color:#6f7f96;font-size:.69rem;font-weight:750;line-height:1.45">${String(body||'Ada pembaruan baru.').replace(/[<>]/g,'')}</span>`;
    requestAnimationFrame(()=>{toast.style.opacity='1';toast.style.transform='translateX(-50%) translateY(0)'});
    clearTimeout(toast._timer);toast._timer=setTimeout(()=>{toast.style.opacity='0';toast.style.transform='translateX(-50%) translateY(-12px)'},4200);
  }

  function showPrompt(){
    if(document.getElementById('cahayaPushPromptV63')||Notification.permission!=='default')return;
    const el=document.createElement('div');
    el.id='cahayaPushPromptV63';
    el.style.cssText='position:fixed;z-index:2147483400;left:50%;bottom:calc(88px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(430px,calc(100vw - 24px));display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:11px;padding:12px 12px;border:1px solid rgba(237,205,137,.75);border-radius:19px;background:rgba(255,252,244,.985);box-shadow:0 18px 55px rgba(83,59,14,.16);font-family:Nunito,Arial,sans-serif';
    el.innerHTML='<span style="width:42px;height:42px;display:grid;place-items:center;border-radius:14px;background:linear-gradient(135deg,#ffe9ad,#ffc859);font-size:1.15rem">🔔</span><span><b style="display:block;color:#493813;font-size:.75rem;font-weight:1000">Aktifkan Notifikasi CAHAYA</b><small style="display:block;margin-top:2px;color:#8f7a4e;font-size:.61rem;font-weight:750;line-height:1.4">Kabar Ananda dan pesan penting dapat muncul di HP.</small></span><button id="cahayaPushEnableV63" type="button" style="border:0;border-radius:12px;padding:9px 11px;color:white;background:linear-gradient(135deg,#e89a15,#f4b831);font-size:.62rem;font-weight:1000;cursor:pointer">Aktifkan</button>';
    document.body.appendChild(el);
    el.querySelector('#cahayaPushEnableV63').addEventListener('click',async e=>{
      const btn=e.currentTarget;btn.disabled=true;btn.textContent='Menyiapkan...';
      try{const result=await enable(true);if(result){hidePrompt();showToast('Notifikasi aktif','Kabar Ananda dan pesan penting siap diterima di perangkat ini.')}}catch(err){console.warn(err);btn.disabled=false;btn.textContent='Coba Lagi';showToast('Notifikasi belum aktif',err?.message||'Periksa pengaturan browser.')}
    });
  }

  async function prepare(){
    if(state.ready)return state;
    if(!('serviceWorker'in navigator)||!('Notification'in window)||!firebase.messaging)throw new Error('Browser ini belum mendukung Web Push CAHAYA.');
    state.registration=await navigator.serviceWorker.register('firebase-messaging-sw.js?v=63',{scope:'./'});
    state.messaging=firebase.messaging();
    state.messaging.onMessage(payload=>{
      const title=payload?.notification?.title||payload?.data?.title||'Notifikasi CAHAYA';
      const body=payload?.notification?.body||payload?.data?.body||'Ada pembaruan baru.';
      showToast(title,body);
    });
    state.ready=true;return state;
  }

  async function getVapidKey(){
    try{const snap=await db().ref('cahaya_app/pengaturan_notifikasi_web/vapidKey').once('value');return clean(snap.val())}catch(_){return ''}
  }

  async function registerToken(){
    const {account,student}=session();
    const username=usernameOf(account);const studentName=studentNameOf(student);
    if(!username||!studentName)throw new Error('Identitas wali atau santri belum siap.');
    await prepare();
    const vapidKey=await getVapidKey();
    const options={serviceWorkerRegistration:state.registration};
    if(vapidKey)options.vapidKey=vapidKey;
    const token=await state.messaging.getToken(options);
    if(!token)throw new Error('Token notifikasi belum terbentuk.');
    const waliKey=safeKey(username);const anakKey=studentKey(studentName);const tokenKey=safeKey(token.slice(-48));
    const payload={token,username,namaAnak:studentName,studentKey:anakKey,aktif:true,platform:navigator.platform||'',userAgent:navigator.userAgent,updatedAt:new Date().toISOString(),diperbarui:new Date().toISOString()};
    const updates={};
    updates[`cahaya_app/fcm_tokens_wali/${waliKey}/${tokenKey}`]=payload;
    updates[`cahaya_app/fcm_wali_by_student/${anakKey}/${waliKey}`]={username,namaAnak:studentName,aktif:true,updatedAt:payload.updatedAt};
    await db().ref().update(updates);
    localStorage.setItem('cahayaPushRegisteredV63',payload.updatedAt);
    return token;
  }

  async function enable(interactive=false){
    await prepare();
    let permission=Notification.permission;
    if(permission==='default'&&interactive)permission=await Notification.requestPermission();
    if(permission!=='granted')return false;
    await registerToken();return true;
  }

  function openFromNotificationQuery(){
    const params=new URLSearchParams(location.search);
    if(params.get('openKabar')==='1'){
      let attempts=0;const t=setInterval(()=>{attempts++;try{if(typeof window.openWaliKabarFromBottom==='function'){clearInterval(t);window.openWaliKabarFromBottom();}}catch(_){}if(attempts>18)clearInterval(t)},180);
    }
    const room=params.get('room');
    if(params.get('openChat')==='1'&&room){
      let attempts=0;const t=setInterval(()=>{attempts++;try{
        const inbox=(typeof waliChatInbox!=='undefined'&&Array.isArray(waliChatInbox))?waliChatInbox:[];const item=inbox.find(x=>x.roomId===room);
        if(item&&typeof window.toggleWaliChat==='function'&&typeof window.openWaliChatRoom==='function'){
          clearInterval(t);const win=document.getElementById('waliChatWindow');if(win&&win.style.display!=='flex')window.toggleWaliChat();
          window.openWaliChatRoom(encodeURIComponent(item.actualName||item.peerLabel||item.peerUsername||'Pengurus'),encodeURIComponent(item.displayName||item.peerLabel||'Pengurus Pesantren'),encodeURIComponent(room),false);
        }
      }catch(_){}if(attempts>30)clearInterval(t)},220);
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(async()=>{
      try{
        if(!('Notification'in window)){return}
        if(Notification.permission==='granted')await enable(false);
        else if(Notification.permission==='default')showPrompt();
      }catch(err){console.warn('Push CAHAYA belum siap:',err)}
      openFromNotificationQuery();
    },1350);
  });

  window.CahayaWaliPush={enable,registerToken,showPrompt};
})();
