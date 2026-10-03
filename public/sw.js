// Vitrin servis çalışanı: yalnızca bağlantı yokken çevrimdışı sayfasını gösterir.
// Sayfaları önbelleğe almaz; vitrin her zaman güncel kalır.
const CACHE = "vitrin-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" }))),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.mode !== "navigate") return;
  const url = new URL(request.url);
  // Mağaza yönlendirmesine ve admin paneline hiç dokunma.
  if (url.pathname.startsWith("/go/") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/auth")) {
    return;
  }
  event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
});
