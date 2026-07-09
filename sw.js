// ponytail: network-first for pages (so updates reach installed users),
// cache-first for static assets; API/audio/artwork go straight to network.
const CACHE = "hooked-v3";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg",
  "./icon-180.png", "./icon-512.png", "./privacy.html", "./terms.html"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (e.request.mode === "navigate" || url.pathname.endsWith(".html")){
    // pages: try network so updates land, fall back to cache offline
    e.respondWith(
      fetch(e.request)
        .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
        .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
    );
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
