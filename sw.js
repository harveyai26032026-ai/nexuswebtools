/* Nexus Web Tools — Service Worker
   Strategy:
   - Navigation requests (HTML): network-first with offline shell fallback.
     Users always get fresh content when online; calculators still open offline.
   - Static assets (CSS/JS/icons/fonts/images): stale-while-revalidate.
     Instant from cache; cache silently refreshes in the background.
   - Never cache: GA4, ad networks, third-party APIs.
   Version bump on every site deploy: CACHE_VERSION below. */

const CACHE_VERSION = 'nwt-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE = [
  OFFLINE_URL,
  '/',
  '/style.css',
  '/nav.css',
  '/nav.js',
  '/lang-loader.js',
  '/scroll-bar.js',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Never intercept analytics / ads / third-party
function isThirdParty(url) {
  return url.origin !== self.location.origin;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET and cross-origin (GA4, Infolinks, AdSense etc.)
  if (req.method !== 'GET' || isThirdParty(url)) return;

  // HTML navigations: network-first, offline shell fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          // Keep a same-origin copy for offline fallback
          const copy = resp.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return resp;
        })
        .catch(() =>
          caches.match(req).then((cached) =>
            cached || caches.match(OFFLINE_URL)
          )
        )
    );
    return;
  }

  // Same-origin static assets: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200 && resp.type === 'basic') {
            const copy = resp.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});