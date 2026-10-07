/* Service worker de « Récup bad » : met en cache la coquille de l'appli (page, manifest, icônes) et rien d'autre.
   Les réponses de api.github.com (données de santé + jeton) ne passent jamais par ici : la page garde sa propre copie
   dans localStorage. Réseau d'abord pour que les mises à jour de la page arrivent vite, cache en secours hors ligne.
   Changer VERSION si la liste SHELL change ; les anciens caches sont supprimés à l'activation. */
const VERSION = "recup-shell-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;   // GitHub et le reste : jamais touchés
  const key = req.mode === "navigate" ? "index.html" : req;
  e.respondWith(
    fetch(req, { cache: "no-cache" }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(key, copy)); }
      return res;
    }).catch(() => caches.match(key, { ignoreSearch: true }).then(r => r || caches.match("index.html")))
  );
});
