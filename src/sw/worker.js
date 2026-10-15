// The offline helper (service worker) that makes the installed app open
// without the internet. scripts/build-sw.mjs writes it to dist/sw.js,
// preceded by three lists it fills in from the build:
//   VERSION  changes whenever any kept file changes
//   PAGES    each wheel's page address ("/", "/wheel-of-business", ...)
//   FILES    the scripts, styles, fonts and pictures those pages use
// It only ever fetches this site's own files, and sends nothing anywhere.
//
// Pages come from the internet first, so a new version shows as soon as it
// is published; without a connection the kept copy opens instead. The other
// files have a new name whenever they change, so a kept copy is always right.
//
// Pages are kept only together with their own files, when a version is
// installed (all or nothing), never on their own as they are visited. A page
// from a newer version names newer files, so keeping it in this version's
// store could open a blank app offline if the connection dropped before that
// newer version had finished downloading.

/* global VERSION, PAGES, FILES */

const CACHE = `wheels-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // "reload": straight from the site, never an older copy the browser kept.
      await cache.addAll([...PAGES, ...FILES].map((url) => new Request(url, { cache: 'reload' })));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith('wheels-') && key !== CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(request.mode === 'navigate' ? openPage(event, url) : openFile(request));
});

// "/wheel-of-business", "/wheel-of-business/" and "/wheel-of-business.html"
// are one page; "/index.html" is "/". Anything else is not a kept page.
function pageKey(pathname) {
  const path = pathname.replace(/\/+$/, '').replace(/\.html$/, '').replace(/\/index$/, '') || '/';
  return PAGES.includes(path) ? path : null;
}

async function openPage(event, url) {
  try {
    return await fetch(event.request);
  } catch {
    // No connection: the kept page, or the home page for any other address.
    const cache = await caches.open(CACHE);
    const key = pageKey(url.pathname);
    return (key && (await cache.match(key))) || (await cache.match('/')) || Response.error();
  }
}

async function openFile(request) {
  const cache = await caches.open(CACHE);
  return (await cache.match(request)) || fetch(request);
}
