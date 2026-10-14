/*
 * HINENI service worker — offline application shell only.
 *
 * Deliberately never caches page HTML or /api responses: pages can contain private
 * prayers/notes, and licensed Scripture may only be stored where its license permits.
 * Offline navigation shows /offline.html; hashed build assets and brand files are cached
 * so the app starts quickly once a connection returns.
 */
const VERSION = "hineni-shell-v1";
const PRECACHE = [
  "/offline.html",
  "/manifest.webmanifest",
  "/branding/hineni-favicon.svg",
  "/branding/hineni-icon-192.png",
  "/branding/hineni-symbol.svg",
  "/branding/hineni-symbol-light.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

const isStaticAsset = (url) =>
  url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/branding/") || url.pathname === "/manifest.webmanifest";

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached ?? network;
      }),
    );
  }
});
