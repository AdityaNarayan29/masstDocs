const CACHE_NAME = 'masst-docs-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/150.png',
  '/icons/167.png',
  '/icons/180.png',
  '/icons/192.png',
  '/icons/256.png',
  '/icons/310.png',
  '/icons/512.png',
  '/icons/1024.png'
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
