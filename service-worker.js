const CACHE_NAME = 'ticker-pwa-v1';
const OFFLINE_URLS = [
  'index.html',
  'manifest.json'
];

// Install: Dateien vorcachen
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: alte Caches aufräumen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Navigation -> immer Index aus Cache / Netz
self.addEventListener('fetch', event => {
  const req = event.request;

  // Nur GET-Anfragen behandeln
  if (req.method !== 'GET') {
    return;
  }

  // Navigationen (Seitenaufrufe) -> App-Shell-Ansatz
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('index.html'))
    );
    return;
  }

  // Für andere GETs: Cache-First mit Fallback Netzwerk
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req).then(resp => {
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, respClone));
        return resp;
      });
    })
  );
});