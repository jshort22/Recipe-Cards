// Recipes service worker.
// Bump CACHE_VERSION whenever index.html or any precached asset changes so
// installed apps pick up the new files.
const CACHE_VERSION = 'v5';
const CACHE_NAME = `recipe-cards-${CACHE_VERSION}`;

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './recipes.json',
  './vendor/html2canvas.min.js',
  './vendor/fonts/fonts.css',
  './vendor/fonts/DancingScript-600.woff2',
  './vendor/fonts/PlayfairDisplay-Italic700.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('recipe-cards-') && k !== CACHE_NAME)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // The page and the recipe data: try the network so edits show up promptly, fall back to cache offline.
  const isRecipes = url.pathname.endsWith('/recipes.json');
  if (request.mode === 'navigate' || isRecipes) {
    const key = isRecipes ? './recipes.json' : './index.html';
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(key, copy));
          return response;
        })
        .catch(() => caches.match(key))
    );
    return;
  }

  // Everything else (images, fonts, scripts): cache first, then network, and remember the result.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
