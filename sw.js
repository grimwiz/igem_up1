const CACHE_VERSION = 'v2';
const CACHE_NAME = `igem-up1-cache-${CACHE_VERSION}`;
const ASSET_PREFIX = self.location.pathname.replace(/[^/]*$/, '');
const resolveAsset = (path) => new URL(path, self.location.origin + ASSET_PREFIX).toString();

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
].map(resolveAsset);

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)).catch((error) => {
      console.error('Failed to precache assets', error);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('igem-up1-cache-') && key !== CACHE_NAME)
            .map((staleKey) => caches.delete(staleKey))
        )
      )
      .then(() => self.clients.claim())
  );
});

const cacheFirst = async (request) => {
  const cached = await caches.match(request, { ignoreVary: true });
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === 'basic') {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
    }
    return response;
  } catch (error) {
    if (request.mode === 'navigate') {
      return caches.match(resolveAsset('./index.html'));
    }
    return Response.error();
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(resolveAsset('./index.html')))
    );
    return;
  }

  event.respondWith(cacheFirst(request));
});
