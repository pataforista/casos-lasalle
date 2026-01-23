/* ============================================================================
   Service Worker – PsyCase (robusto)
   - App shell: cache-first (rápido y estable)
   - Datos (/data/*): stale-while-revalidate (se actualiza sin romper)
   - Limpieza de caches: borra TODO lo que no sea el cache actual
   ============================================================================ */

   const CACHE_VERSION = "psycase-v1.0.3";
   const CACHE_NAME = `psycase-${CACHE_VERSION}`;
   
   const APP_SHELL = [
     "./",
     "./index.html",
     "./manifest.webmanifest",
   
     "./js/economy.js",
     "./js/caseLoader.js",
     "./js/generator.js",
     "./js/game.js",
   
     "./assets/icons/icon-192.png",
     "./assets/icons/icon-512.png",
   
     // En tu zip existen:
     "./data/manifest_v1.json"
   ];
   
   /* ----------------------------- INSTALL ----------------------------- */
   self.addEventListener("install", (event) => {
     event.waitUntil(
       caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
     );
     self.skipWaiting();
   });
   
   /* ----------------------------- ACTIVATE ---------------------------- */
   self.addEventListener("activate", (event) => {
     event.waitUntil(
       caches.keys().then((keys) =>
         Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
       )
     );
     self.clients.claim();
   });
   
   /* -------------------------- ESTRATEGIAS ---------------------------- */
   async function cacheFirst(request) {
     const cache = await caches.open(CACHE_NAME);
     const cached = await cache.match(request);
     if (cached) return cached;
   
     const network = await fetch(request);
     cache.put(request, network.clone());
     return network;
   }
   
   async function staleWhileRevalidate(request) {
     const cache = await caches.open(CACHE_NAME);
     const cached = await cache.match(request);
   
     const networkPromise = fetch(request)
       .then((res) => {
         cache.put(request, res.clone());
         return res;
       })
       .catch(() => cached);
   
     return cached || networkPromise;
   }
   
   /* ------------------------------ FETCH ------------------------------ */
   self.addEventListener("fetch", (event) => {
     const req = event.request;
   
     if (req.method !== "GET") return;
   
     const url = new URL(req.url);
   
     // Solo manejamos same-origin para evitar rarezas con CDNs (tailwind/fonts)
     if (url.origin !== self.location.origin) return;
   
     // 1) Todo lo que esté en /data/ (manifest + packs + jsons)
     if (url.pathname.includes("/data/")) {
       event.respondWith(staleWhileRevalidate(req));
       return;
     }
   
     // 2) App shell y estáticos
     event.respondWith(cacheFirst(req));
   });
   