/* Meberra service worker (kök kapsam: /).
   - push: sunucudan gelen { title, body, link, tag } ile bildirim gösterir.
   - notificationclick: açık bir Meberra sekmesi varsa ona odaklanıp bağlantıya gider; yoksa yeni pencere açar.
   - 1.15.0 Çevrimdışı (PWA):
       * install: uygulama kabuğu (stiller, temel betikler, yerel fontlar, ikonlar, maskot, /cevrimdisi) önbelleğe alınır.
       * Sayfa gezinmesi: önce ağ; ağ yoksa /cevrimdisi (uykulu Dede Korkut). Sayfalar önbelleğe YAZILMAZ (güncellik ve kişisel veri).
       * /assets/*: stale-while-revalidate (önbellekten hemen, arka planda tazele).
       * /api/* HİÇBİR ZAMAN önbelleğe alınmaz ve ele alınmaz (tarayıcıya bırakılır).
       * activate: adı "meberra-" ile başlayan, bu sürüme ait olmayan önbellekler silinir.
     Sürüm: __SURUM__ yer tutucusunu sunucu sw.js'yi sunarken package.json sürümüyle doldurur (server/servis-calisani.js). */
"use strict";

var SURUM = "__SURUM__";
var KABUK = "meberra-kabuk-" + SURUM;
var VARLIK = "meberra-varlik-" + SURUM;
var CEVRIMDISI = "/cevrimdisi";
var IKON = "/assets/img/pwa/icon-192.png";
var ROZET = "/assets/img/pwa/badge-72.png";

// Uygulama kabuğu: her biri sunucuda 200 dönmeli (server/test/cevrimdisi.test.js denetler)
var KABUK_DOSYALARI = [
  CEVRIMDISI,
  "/manifest.webmanifest",
  "/favicon.svg",
  "/assets/css/styles.css",
  "/assets/css/fonts.css",
  "/assets/css/icerik.css",
  "/assets/css/maskot.css",
  "/assets/css/hareket.css",
  "/assets/css/canli.css",
  "/assets/css/oyun.css",
  "/assets/css/bildirim.css",
  "/assets/css/sekil.css",
  "/assets/css/oyun-ek.css",
  "/assets/css/grafik.css",
  "/assets/css/kartlar.css",
  "/assets/css/hiz.css",
  "/assets/css/gunun-sorusu.css",
  "/assets/css/odak.css",
  "/assets/js/adresler.js",
  "/assets/js/ucretsiz-kural.js",
  "/assets/js/app.js",
  "/assets/js/auth.js",
  "/assets/js/maskot.js",
  "/assets/js/kutlama.js",
  "/assets/js/oyun.js",
  "/assets/js/canli.js",
  "/assets/js/bildirim.js",
  "/assets/js/urun.js",
  "/assets/js/sekil.js",
  "/assets/js/oyun-ek.js",
  "/assets/js/grafik.js",
  "/assets/js/kartlar.js",
  "/assets/js/hiz.js",
  "/assets/js/gunun-sorusu.js",
  "/assets/js/odak.js",
  "/assets/fonts/dmsans-latin.woff2",
  "/assets/fonts/dmsans-latin-ext.woff2",
  "/assets/fonts/nunito-latin.woff2",
  "/assets/fonts/nunito-latin-ext.woff2",
  "/assets/img/pwa/icon-192.png",
  "/assets/img/pwa/icon-512.png",
  "/assets/img/pwa/badge-72.png",
  "/assets/img/pwa/apple-touch-icon.png",
  "/assets/img/maskot/korkut-uykulu.svg",
  "/assets/img/maskot/korkut-selam.svg"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(KABUK)
      // cache: "reload" — HTTP önbelleğini atla (yeni sürümün dosyaları alınsın)
      .then(function (c) { return c.addAll(KABUK_DOSYALARI.map(function (u) { return new Request(u, { cache: "reload", credentials: "same-origin" }); })); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (k) {
        return Promise.all(k.filter(function (a) { return a.indexOf("meberra-") === 0 && a !== KABUK && a !== VARLIK; })
          .map(function (a) { return caches.delete(a); }));
      })
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

/** Son çare: önbellekte çevrimdışı sayfa da yoksa küçük gömülü sayfa */
function gomuluCevrimdisi() {
  return new Response(
    '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Bağlantı yok | Meberra</title></head>' +
    '<body style="font-family:system-ui,sans-serif;max-width:520px;margin:3rem auto;padding:0 1rem;line-height:1.6;color:#1d1b2e">' +
    '<p style="font-weight:800;color:#5B3DF5">Meberra</p><h1 style="font-size:1.4rem">İnternet bağlantısı yok</h1>' +
    "<p>Bağlantın geri gelince sayfayı yenile. Çözdüğün sorular cihazında saklanır ve bağlanınca eşitlenir.</p>" +
    '<p><button onclick="location.reload()" style="font:inherit;padding:.6rem 1.2rem;border-radius:10px;border:0;background:#5B3DF5;color:#fff">Yeniden dene</button></p></body></html>',
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );
}

function gezinme(r) {
  return fetch(r).catch(function () {
    return caches.open(KABUK)
      .then(function (c) { return c.match(CEVRIMDISI); })
      .then(function (y) { return y || gomuluCevrimdisi(); });
  });
}

/** Stale-while-revalidate: önbellekte varsa hemen döner, arka planda tazelenir; yoksa ağdan alınıp saklanır.
 *  Sorgu dizgesi (?v=...) farklı kopya sayılır; ağ yoksa sorgusuz eşleşme (kabuk dosyası) da kabul edilir. */
function varlik(e) {
  var r = e.request;
  return caches.open(VARLIK).then(function (c) {
    return c.match(r).then(function (onbellekte) {
      var ag = fetch(r).then(function (y) {
        if (y && y.ok && y.type === "basic") c.put(r, y.clone()).catch(function () { /* kota */ });
        return y;
      });
      if (onbellekte) {
        e.waitUntil(ag.catch(function () { /* çevrimdışı: önbellekteki yeterli */ }));
        return onbellekte;
      }
      return ag.catch(function () {
        return caches.match(r, { ignoreSearch: true }).then(function (k) { return k || Response.error(); });
      });
    });
  });
}

self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  if (u.pathname.indexOf("/api/") === 0) return; // API: asla önbellek yok, SW karışmaz
  if (r.mode === "navigate") { e.respondWith(gezinme(r)); return; }
  if (u.pathname.indexOf("/assets/") === 0) { e.respondWith(varlik(e)); return; }
  // Kabuktaki diğer dosyalar (manifest, favicon): ağ, olmazsa önbellek
  if (KABUK_DOSYALARI.indexOf(u.pathname) >= 0) {
    e.respondWith(fetch(r).catch(function () { return caches.match(u.pathname).then(function (k) { return k || Response.error(); }); }));
  }
});
