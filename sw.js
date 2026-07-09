/* Service worker de la PWA Hipoteca.
   Estrategia: caché primero con actualización en segundo plano.
   Para publicar una versión nueva de la aplicación, cambia el número de VERSION. */
'use strict';
var VERSION = 'hipoteca-v1';
var FICHEROS = ['./', './index.html', './manifest.json', './icon-180.png', './icon-512.png'];

self.addEventListener('install', function (ev) {
  ev.waitUntil(
    caches.open(VERSION).then(function (c) { return c.addAll(FICHEROS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (ev) {
  ev.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(claves.filter(function (k) { return k !== VERSION; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (ev) {
  if (ev.request.method !== 'GET') return;
  ev.respondWith(
    caches.match(ev.request).then(function (enCache) {
      var red = fetch(ev.request).then(function (resp) {
        if (resp && resp.ok && new URL(ev.request.url).origin === location.origin) {
          var copia = resp.clone();
          caches.open(VERSION).then(function (c) { c.put(ev.request, copia); });
        }
        return resp;
      }).catch(function () {
        if (ev.request.mode === 'navigate') return caches.match('./index.html');
        return enCache;
      });
      return enCache || red;
    })
  );
});
