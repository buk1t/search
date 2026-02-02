const CACHE = "home-5.0.0";

const CORE = [
  "/",
  "/html/index.html",
  "/css/style.css",
  "/js/script.js",

  "/sw.js",

  "/html/settings.html",
  "/js/settings.js",

  "/js/version.js",
  "/js/icons.js",

  "/html/theme.html",
  "/css/theme.css",
  "/js/theme.js",

  "/html/changelog.html",
  "/css/changelog.css",
  "/js/changelog.js",

  "/assets/fonts/Inter-roman.ttf",
  "/assets/fonts/Inter-italic.ttf"
];

// Install: pre-cache core, then activate immediately
self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);
    await self.skipWaiting();
  })());
});

// Activate: clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Fetch: stale-while-revalidate for same-origin GET requests.
// Cross-origin (like open-meteo) goes straight to network.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);

    const fetchPromise = fetch(req).then((res) => {
      // Only cache successful, basic responses
      if (res && res.status === 200 && res.type === "basic") {
        cache.put(req, res.clone());
      }
      return res;
    }).catch(() => cached);

    // Return cached immediately if present, update in background
    return cached || fetchPromise;
  })());
});