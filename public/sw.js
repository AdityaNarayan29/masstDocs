const CACHE_NAME = 'masst-docs-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/app-icons/150.png',
  '/app-icons/167.png',
  '/app-icons/180.png',
  '/app-icons/192.png',
  '/app-icons/256.png',
  '/app-icons/310.png',
  '/app-icons/512.png',
  '/app-icons/1024.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
