// Prachy: uloží aplikaci do mezipaměti, aby šla otevřít i bez internetu.
// Komunikaci s databází (Supabase) neřeší – ta jde vždy přímo na server.
const CACHE = "prachy-v2";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
const CACHE_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com", "cdn.jsdelivr.net"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const same = url.origin === location.origin;
  if (!same && !CACHE_HOSTS.includes(url.hostname)) return; // Supabase apod. nech být
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok || res.type === "opaque") {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || (e.request.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
