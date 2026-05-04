// Minimal Service Worker for PWA installability
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (event) => {
  // Required to be a PWA, even if empty
});
