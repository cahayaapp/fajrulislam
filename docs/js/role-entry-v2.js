// Parser-blocking entry guard. This file MUST precede every feature SDK/script.
(function(){
  'use strict';
  const R=window.CahayaRoleSystemV2,N=window.CahayaRoleNavigationV2,S=window.CahayaRoleScopeV2;
  const script=document.currentScript;
  const appRoot=new URL('../',script.src);
  // Shared visual layer only; the authorization guard below remains authoritative.
  const theme=document.createElement('link');
  theme.id='cahaya-ui-v2-theme';theme.rel='stylesheet';theme.href=new URL('css/cahaya-ui-v2.css?v=260',appRoot).href;
  document.head.appendChild(theme);
  const presentation=document.createElement('script');
  presentation.src=new URL('js/cahaya-ui-v2.js?v='+(location.pathname.includes('/wali/')?'269':'267'),appRoot).href;presentation.defer=true;
  document.head.appendChild(presentation);
  const route=location.pathname.slice(appRoot.pathname.length)+location.search;
  const readUser=()=>{try{return JSON.parse(localStorage.getItem('cahayaCurrentUser')||'null')}catch{return null}};
  const user=readUser();
  // No change to unmigrated profiles' existing login/auth lifecycle.
  if(Number(user?.roleSystemVersion)!==2)return;
  const getSession=()=>R?.resolveSession(readUser(),localStorage);
  const session=getSession();
  const verdict=R&&N&&S?N.canAccessRoute(session,route):{ok:false,reason:'GUARD_UNAVAILABLE'};
  if(!verdict.ok){
    // HTML is served statically: a redirect alone cannot stop subsequent inline
    // scripts. PLAINTEXT consumes the remaining parser input as inert text.
    // The feature's markup, SDKs, preload tags and inline modules never execute.
    document.addEventListener('DOMContentLoaded',()=>{
      document.documentElement.innerHTML='<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Akses ditolak • CAHAYA</title></head><body><main id="roleAccessDenied" role="alert"><h1>Akses ditolak</h1><p>Halaman ini tidak tersedia untuk peran dan penugasan aktif Anda.</p><p id="roleDeniedReason"></p><a id="roleSafeHome" target="_top">Kembali ke Beranda</a></main></body>';
      document.getElementById('roleDeniedReason').textContent=verdict.reason;
      document.getElementById('roleSafeHome').href=new URL('main-dashboard.html',appRoot).href;
      const style=document.createElement('style');
      style.textContent='body{margin:0;padding:24px;background:#f4f8ff;color:#14345b;font:16px system-ui}main{max-width:520px;margin:12vh auto;padding:24px;border:1px solid #d9e7f8;border-radius:20px;background:white}h1{font-size:24px}a{display:inline-block;padding:14px;border-radius:12px;background:#176de6;color:white;text-decoration:none}#roleDeniedReason{font-size:12px;overflow-wrap:anywhere;color:#63738c}';
      document.head.appendChild(style);
    },{once:true});
    document.write('<plaintext hidden>');
    return;
  }
  const initial=S.signature(session);
  Object.defineProperty(window,'cahayaRoleContext',{value:S.create(session,getSession),writable:false,configurable:false});
  // A tab/frame with the old assignment must not keep its listeners alive.
  // Shell role switches already destroy cached frames. This covers other tabs,
  // BFCache restores, focus and same-document identity update events as well.
  function revalidate(){
    if(S.signature(getSession())===initial)return;
    window.dispatchEvent(new CustomEvent('cahaya:suspend',{detail:{reason:'role-context-revoked'}}));
    location.replace(new URL('role-access-denied.html',appRoot).href);
  }
  addEventListener('storage',e=>{if(!e.key||['cahayaCurrentUser','cahayaActiveRoleV2','cahayaRoleUserV2'].includes(e.key))revalidate()});
  addEventListener('pageshow',revalidate);
  addEventListener('focus',revalidate);
  addEventListener('cahaya:role-context-changed',revalidate);
  // Main shell owns deliberate same-document switches; its own context is not
  // consumed by feature adapters and must not redirect itself during a switch.
  if(N.parse(route)?.path==='main-dashboard.html'){
    removeEventListener('focus',revalidate);
    removeEventListener('pageshow',revalidate);
    removeEventListener('cahaya:role-context-changed',revalidate);
  }
})();
