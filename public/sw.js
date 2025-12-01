const CACHE_NAME = 'masst-docs-cache-v2';
const STATIC_ASSETS = [
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

// Install: cache only static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches to prevent memory growth
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML/navigation, cache-first for static assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests
  if (url.origin !== self.location.origin) return;

  // For navigation requests (HTML pages): network-first
  // This prevents stale pages and memory buildup from cached HTML
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // For static assets (images, icons): cache-first
  if (STATIC_ASSETS.some(asset => url.pathname === asset) ||
      url.pathname.startsWith('/app-icons/') ||
      url.pathname.startsWith('/mermaid-cache/')) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(fetchResponse => {
          // Only cache successful responses
          if (fetchResponse.ok) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return fetchResponse;
        });
      })
    );
    return;
  }

  // For everything else: network-only (don't cache JS bundles, etc.)
  event.respondWith(fetch(request));
});
