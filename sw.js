const BUILD_VERSION = '2026-07-22T14:29:19.337Z';
const APP_BASE_PATH = '/Familypoints-Pages/';
const CACHE_PREFIX = 'family-points-shell-';
const SHELL_CACHE = `${CACHE_PREFIX}${BUILD_VERSION}`;

const fetchFreshPage = async (request) => {
  const networkRequest = new Request(request, { cache: 'reload' });
  const response = await fetch(networkRequest);

  if (response.ok) {
    const cache = await caches.open(SHELL_CACHE);
    await cache.put(request, response.clone());
  }

  return response;
};

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const response = await fetch(APP_BASE_PATH, { cache: 'reload' });
    if (response.ok) await cache.put(APP_BASE_PATH, response);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== SHELL_CACHE)
        .map((cacheName) => caches.delete(cacheName)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;

  event.respondWith((async () => {
    try {
      return await fetchFreshPage(event.request);
    } catch {
      return (
        await caches.match(event.request)
        || await caches.match(APP_BASE_PATH)
        || Response.error()
      );
    }
  })());
});
