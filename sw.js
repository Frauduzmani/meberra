/* Meberra service worker (kök kapsam: /).
   - push: sunucudan gelen { title, body, link, tag } ile bildirim gösterir.
   - notificationclick: açık bir Meberra sekmesi varsa ona odaklanıp bağlantıya gider; yoksa yeni pencere açar.
   - Çevrimdışı: yalnızca gezinme isteği ağdan alınamazsa küçük bir "bağlantı yok" sayfası gösterilir.
     API yanıtları ve sayfalar ÖNBELLEĞE ALINMAZ (kişisel veri ve güncellik için). */
"use strict";

var SURUM = "meberra-sw-1";
var IKON = "/assets/img/pwa/icon-192.png";
var ROZET = "/assets/img/pwa/badge-72.png";

self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (k) { return Promise.all(k.filter(function (a) { return a.indexOf("meberra-") === 0; }).map(function (a) { return caches.delete(a); })); })
      .then(function () { return self.clients.claim(); })
  );
});

/** Yalnızca aynı kökenli göreli yol kabul edilir (bildirimden dış siteye yönlendirme olmasın). */
function guvenliLink(l) {
  try {
    var u = new URL(l || "/", self.location.origin);
    return u.origin === self.location.origin ? u.href : self.location.origin + "/";
  } catch (e) { return self.location.origin + "/"; }
}

self.addEventListener("push", function (e) {
  var v = {};
  try { v = e.data ? e.data.json() : {}; } catch (err) { v = { body: e.data ? e.data.text() : "" }; }
  var baslik = v.title || "Meberra";
  e.waitUntil(self.registration.showNotification(baslik, {
    body: v.body || "",
    icon: IKON,
    badge: ROZET,
    tag: v.tag || "meberra",
    lang: "tr",
    data: { link: guvenliLink(v.link) }
  }));
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var hedef = guvenliLink(e.notification.data && e.notification.data.link);
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (liste) {
    for (var i = 0; i < liste.length; i++) {
      var c = liste[i];
      if (new URL(c.url).origin === self.location.origin && "focus" in c) {
        return c.focus().then(function (odak) { return odak && "navigate" in odak ? odak.navigate(hedef) : odak; });
      }
    }
    return self.clients.openWindow ? self.clients.openWindow(hedef) : null;
  }));
});

// Çevrimdışı yedek: yalnızca sayfa gezinmesi, ağ hatasında. /api/ istekleri hiç ele alınmaz (tarayıcıya bırakılır).
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET" || r.mode !== "navigate") return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin || u.pathname.indexOf("/api/") === 0) return;
  e.respondWith(fetch(r).catch(function () {
    return new Response(
      '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Bağlantı yok | Meberra</title></head>' +
      '<body style="font-family:system-ui,sans-serif;max-width:520px;margin:3rem auto;padding:0 1rem;line-height:1.6;color:#1d1b2e">' +
      '<p style="font-weight:800;color:#5B3DF5">Meberra</p><h1 style="font-size:1.4rem">İnternet bağlantısı yok</h1>' +
      "<p>Bağlantın geri gelince sayfayı yenile. Çözdüğün sorular cihazında saklanır ve bağlanınca eşitlenir.</p>" +
      '<p><button onclick="location.reload()" style="font:inherit;padding:.6rem 1.2rem;border-radius:10px;border:0;background:#5B3DF5;color:#fff">Yeniden dene</button></p></body></html>',
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
    );
  }));
});
