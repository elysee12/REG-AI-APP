importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBpKbvOwxwVcJJ7BsUUy-EpGP3ryrk8_qA",
  authDomain: "gridguard-app-c16d1.firebaseapp.com",
  projectId: "gridguard-app-c16d1",
  storageBucket: "gridguard-app-c16d1.firebasestorage.app",
  messagingSenderId: "656773654773",
  appId: "1:656773654773:web:f1cbfb79b49d856beefdbc"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || '🚨 ALARM: Incident Detected!';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'incident-alert',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    data: payload.data,
    // Note: Sounds in web push are restricted. On mobile APK (WebView), 
    // the system sound logic in the notification payload usually takes precedence.
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const incidentId = event.notification.data?.incidentId;
  const urlToOpen = incidentId ? `/dashboard/incidents?id=${incidentId}` : '/dashboard/incidents';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
