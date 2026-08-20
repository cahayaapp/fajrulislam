/* CAHAYA APP V68 — Firebase Cloud Messaging Service Worker Global */
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');
importScripts('config/firebase-worker-config.js');

firebase.initializeApp(self.CAHAYA_FIREBASE_CONFIG);
const messaging=firebase.messaging();

messaging.onBackgroundMessage(payload=>{
  const data=payload.data||{};const notification=payload.notification||{};
  const title=notification.title||data.title||'Notifikasi CAHAYA';
  const roomId=data.roomId||'';
  const relativeLink=roomId?`main-dashboard.html?openChat=1&room=${encodeURIComponent(roomId)}`:'main-dashboard.html';
  const requestedLink=data.link||relativeLink;
  const resolvedLink=new URL(requestedLink,self.registration.scope).href;
  const iconUrl=new URL('assets/cahaya-app/app-icon-v67-192.png',self.registration.scope).href;
  return self.registration.showNotification(title,{
    body:notification.body||data.body||'Ada pemberitahuan baru.',
    icon:iconUrl,badge:iconUrl,
    tag:data.tag||roomId||data.notificationId||'cahaya-global',renotify:true,
    data:{link:resolvedLink,roomId,notificationId:data.notificationId||''}
  });
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const targetUrl=event.notification?.data?.link||new URL('main-dashboard.html',self.registration.scope).href;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(windowClients=>{
    for(const client of windowClients){
      if('navigate'in client)client.navigate(targetUrl);
      if('focus'in client)return client.focus();
    }
    return clients.openWindow?clients.openWindow(targetUrl):null;
  }));
});
