// Cache only the public app shell. Business records are never handled here.
const PREFIX = `dealerflow-shell:${self.registration.scope}:`;
const CACHE = PREFIX + 'v1.0.0-r4';
const FILES = ['./', './index.html', './styles.css', './app.js', './core.js', './i18n.js', './manifest.webmanifest', './assets/logo.svg'];
const urls = FILES.map(path => new URL(path, self.registration.scope).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(urls)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url); url.search = ''; url.hash = '';
  if (event.request.method !== 'GET' || !urls.includes(url.href)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(new URL('./index.html', self.registration.scope).href)));
  } else {
    event.respondWith(caches.match(url.href).then(cached => cached || fetch(event.request)));
  }
});
