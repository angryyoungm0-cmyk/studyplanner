const CACHE_NAME = 'studyplanner-v2';
const ASSETS = [
  '/studyplanner/',
  '/studyplanner/logo.png',
  '/studyplanner/index.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});

self.addEventListener('push', (e) => {
  let data = { title: 'StudyPlanner', body: 'Time to study!' };
  if (e.data) {
    try {
      data = e.data.json();
    } catch {
      data.body = e.data.text();
    }
  }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/studyplanner/logo.png',
      badge: '/studyplanner/logo.png',
      vibrate: [200, 100, 200],
      tag: 'studyplanner-reminder',
      renotify: true,
      actions: [
        { action: 'open', title: 'Open StudyPlanner' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      for (const client of clients) {
        if (client.url.includes('/studyplanner/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/studyplanner/');
      }
    })
  );
});