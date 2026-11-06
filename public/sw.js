// Offline support for the Bleeding Debts 316 website.
// Pages: always fetched fresh from the internet; the last copy is kept so a page you already opened
// still loads with no signal (at a gig, in the metro). Static files (/_astro/, fonts, images): served
// from the cache, they never change because their names contain a fingerprint.
// Only this website's own files are handled; videos, players and the chat are never cached.
const VERSION = 'bd316-v1';
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (!key.startsWith(VERSION)) await caches.delete(key);
    await self.clients.claim();
  })());
});

const offlinePage = (lang) => new Response(
  `<!doctype html><html lang="${lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Bleeding Debts 316: offline</title>` +
  `<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#000;color:#fff;font:18px/1.5 system-ui,sans-serif;text-align:center;padding:24px">` +
  `<div><p style="font-size:48px;margin:0">🐒</p><h1 style="font-size:24px">No internet right now</h1><p>Mr. D.O.M. kept the pages you already opened. Reconnect to see the rest.</p>` +
  `<p lang="ro">Nu ai internet acum. Paginile deja deschise sunt salvate.</p><p><a style="color:#e5383b" href="/${lang}/">Bleeding Debts 316</a></p></div>`,
  { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
);

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/dom/') || url.pathname === '/sw.js' || url.pathname === '/health.json') return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        if (fresh.ok) { const copy = fresh.clone(); caches.open(PAGES).then((c) => c.put(req, copy)); }
        return fresh;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        const lang = (url.pathname.match(/^\/(en|fr|ro|it|es|ar|ru|el)\//) || [])[1] || 'en';
        return (await caches.match(`/${lang}/`)) || offlinePage(lang);
      }
    })());
    return;
  }

  if (/^\/(_astro|og)\/|\.(woff2|png|jpg|jpeg|webp|avif|svg|ico)$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const fresh = await fetch(req);
      if (fresh.ok) { const copy = fresh.clone(); caches.open(ASSETS).then((c) => c.put(req, copy)); }
      return fresh;
    })());
  }
});
