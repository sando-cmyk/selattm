// ============================================================================
// public/wallet-sw.js -- offline support for the "My Certificates" app
// (wallet.html). Scope is ONLY /wallet.html, so no other page on the site is
// affected. Keeps the app's own files and the Firebase SDK cached so the
// app opens on site with no reception; the learner's certificate data itself
// is cached by wallet.html (localStorage) from the last time it was online.
// Bump VERSION when wallet.html or its files change.
// ============================================================================
const VERSION = "sela-wallet-v1";
const CORE = [
  "/wallet.html", "/wallet.webmanifest",
  "/js/course-summaries.js", "/js/course-map.js", "/js/firebase-init.js",
  "/img/sela-logo-transparent.png", "/img/wallet-icon-192.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith("sela-wallet-") && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const firebaseSdk = url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/");
  if (!sameOrigin && !firebaseSdk) return; // Firestore / Auth traffic always goes to the network

  // The page itself: newest when online, cached copy when offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put("/wallet.html", copy));
      return res;
    }).catch(() => caches.match("/wallet.html")));
    return;
  }
  // Scripts, images, Firebase SDK: cached copy straight away, refreshed in the background.
  e.respondWith(caches.open(VERSION).then(async (c) => {
    const hit = await c.match(req);
    const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
