/* ============================================================================
   Service Worker – PsyCase (robusto)
   - App shell: cache-first (rápido y estable)
   - Datos (/data/*): stale-while-revalidate (se actualiza sin romper)
   - Limpieza de caches: borra TODO lo que no sea el cache actual
   ============================================================================ */

   const CACHE_VERSION = "psycase-v1.4.0";
   const CACHE_NAME = `psycase-${CACHE_VERSION}`;
   
   const APP_SHELL = [
     "./",
     "./index.html",
     "./manifest.webmanifest",
     "./assets/styles.css",
   
     "./js/economy.js",
     "./js/caseLoader.js",
     "./js/generator.js",
     "./js/game.js",
   
     "./assets/icons/icon-192.png",
     "./assets/icons/icon-512.png",
   
     "./data/manifest_v1.json",
     "./data/packs/cases_real_v1.json",

     "./assets/sprites/Dr. Castañeda.png",
     "./assets/sprites/Dr. Celada.png",
     "./assets/sprites/Dr. Mendoza.png",
     "./assets/sprites/Dr. Solís.png",
     "./assets/sprites/Dr. Valdez.png",
     "./assets/sprites/Dra. Aguilar.png",
     "./assets/sprites/Dra. Ferrer.png",
     "./assets/sprites/Dra. Herrera.png",
     "./assets/sprites/Dra. Ríos.png",
     "./assets/sprites/paciente 1 Joven Adulto.png",
     "./assets/sprites/Paciente 2 Adulta Mayor.png",
     "./assets/sprites/Paciente 3 Adulto de Mediana Edad.png"
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
   // Las peticiones cross-origin sin CORS (CSS/fuentes de Google Fonts) devuelven
   // respuestas opacas con ok === false; hay que aceptarlas o nunca se cachean.
   function isCacheable(res) {
     return res.ok || res.type === "opaque";
   }

   async function cacheFirst(request) {
     const cache = await caches.open(CACHE_NAME);
     const cached = await cache.match(request);
     if (cached) return cached;

     const network = await fetch(request);
     if (isCacheable(network)) cache.put(request, network.clone());
     return network;
   }

   async function staleWhileRevalidate(request) {
     const cache = await caches.open(CACHE_NAME);
     const cached = await cache.match(request);

     const networkPromise = fetch(request)
       .then((res) => {
         if (isCacheable(res)) cache.put(request, res.clone());
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
   
     // 1) Todo lo que esté en /data/ (manifest + packs + jsons)
    if (url.pathname.includes("/data/")) {
      event.respondWith(staleWhileRevalidate(req));
      return;
    }

    // 2) CDN Externos (fuentes) para soporte offline real
    const EXTERNAL_WHITELIST = [
      "fonts.googleapis.com",
      "fonts.gstatic.com"
    ];
    if (EXTERNAL_WHITELIST.includes(url.hostname)) {
      event.respondWith(staleWhileRevalidate(req));
      return;
    }

    // 3) App shell y estáticos locales
    if (url.origin === self.location.origin) {
      event.respondWith(cacheFirst(req));
    }
   });