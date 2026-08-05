self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
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