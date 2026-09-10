/* CAHAYA APP v159 — PWA + Firebase Messaging + on-demand app-shell cache */
const CAHAYA_SW_BUILD='v159';
const STATIC_CACHE='cahaya-static-v159';
self.addEventListener('install',event=>{self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('cahaya-static-')&&k!==STATIC_CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})());});

importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');
importScripts('config/firebase-worker-config.js');
try{
  firebase.initializeApp(self.CAHAYA_FIREBASE_CONFIG);
  const messaging=firebase.messaging();
  messaging.onBackgroundMessage(payload=>{
    const data=payload.data||{};const notification=payload.notification||{};
    const title=notification.title||data.title||'Notifikasi CAHAYA';
    const roomId=data.roomId||'';
    const relativeLink=roomId?`main-dashboard.html?openChat=1&room=${encodeURIComponent(roomId)}`:'main-dashboard.html';
    const requestedLink=data.link||relativeLink;
    const resolvedLink=new URL(requestedLink,self.registration.scope).href;
    const iconUrl=new URL('assets/cahaya-app/app-icon-maskable-192.png',self.registration.scope).href;
    return self.registration.showNotification(title,{body:notification.body||data.body||'Ada pemberitahuan baru.',icon:iconUrl,badge:iconUrl,tag:data.tag||roomId||data.notificationId||'cahaya-global',renotify:true,data:{link:resolvedLink,roomId,notificationId:data.notificationId||''}});
  });
}catch(e){console.warn('FCM SW init',e);}

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const targetUrl=event.notification?.data?.link||new URL('main-dashboard.html',self.registration.scope).href;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(windowClients=>{
    for(const client of windowClients){if('navigate' in client)client.navigate(targetUrl);if('focus' in client)return client.focus();}
    return clients.openWindow?clients.openWindow(targetUrl):null;
  }));
});

async function cacheFirst(request){
  const cache=await caches.open(STATIC_CACHE);
  const hit=await cache.match(request,{ignoreVary:true});
  if(hit)return hit;
  const response=await fetch(request);
  if(response&&response.ok)cache.put(request,response.clone()).catch(()=>{});
  return response;
}
async function networkFirst(request){
  const cache=await caches.open(STATIC_CACHE);
  try{
    const response=await fetch(request);
    if(response&&response.ok)cache.put(request,response.clone()).catch(()=>{});
    return response;
  }catch(e){
    const hit=await cache.match(request,{ignoreVary:true});
    if(hit)return hit;
    throw e;
  }
}
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  if(url.searchParams.get('noCache')==='1')return;
  const path=url.pathname.toLowerCase();
  const staticAsset=/\.(?:css|js|json|png|jpe?g|webp|svg|ico|woff2?|ttf)$/i.test(path);
  const versionedHtml=path.endsWith('.html')&&url.searchParams.has('v');
  const shellNavigation=req.mode==='navigate'&&(path==='/'||path.endsWith('/index.html')||path.endsWith('/main-dashboard.html'));
  if(staticAsset||versionedHtml){event.respondWith(cacheFirst(req));return;}
  if(shellNavigation){event.respondWith(networkFirst(req));}
});
