/* ForgeTools service worker. Bump CACHE_VERSION on every release (keep in sync with src/version.js). */
const CACHE_VERSION = '2.0.0';
const CACHE = `forge-tools-${CACHE_VERSION}`;
const PRECACHE = ['./', './index.html', './styles.css', './manifest.json', './assets/favicon.svg', './assets/icon-192.png', './assets/icon-512.png', './src/app.js'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('forge-tools-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

/* Stale-while-revalidate for same-origin GET requests: instant offline loads, fresh files on the next visit. */
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(request);
      const network = fetch(request).then(res => { if (res.ok) cache.put(request, res.clone()); return res; }).catch(() => cached);
      return cached || network;
    }),
  );
});
