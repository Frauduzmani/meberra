/* ==========================================================================
   Meberra — istemci hata izleme. Yakalananlar: window "error", "unhandledrejection" ve /api/* isteklerinin 5xx
   yanıtları. Rapor: POST /api/log { seviye, mesaj, stack, url, satir, sutun } (misafir de gönderebilir).
   Kurallar: yalnızca sunucu modunda (meta meberra-api) çalışır; aynı hata bir kez; sayfa başına en fazla 10 rapor;
   tarayıcı eklentisi kaynaklı hatalar ve ResizeObserver döngü uyarıları yok sayılır; URL'deki belirteçler atılır.
   Saf yardımcılar node ile test edilebilir: module.exports (tarayıcıda window.MeberraHataIzle).
   ========================================================================== */
(function (root) {
  "use strict";
  var EN_FAZLA = 10;
  var YOKSAY_RE = /(chrome|moz|safari(-web)?|ms-browser)-extension:\/\/|ResizeObserver loop|^Script error\.?$/i;

  function kirp(s, n) { s = s == null ? "" : String(s); return s.length > n ? s.slice(0, n) : s; }
  /** URL'den gizli parametreleri atar (?t=, token=, sifre=…) */
  function urlTemiz(u) { return String(u || "").replace(/([?&](?:t|token|belirtec|sifre|password|code|key)=)[^&#]*/gi, "$1[gizli]"); }
  /** Raporlanmaya değer mi? (eklenti, ResizeObserver gürültüsü, boş mesaj → hayır) */
  function raporlanir(mesaj, stack) {
    var m = String(mesaj || "").trim();
    if (!m) return false;
    return !YOKSAY_RE.test(m) && !YOKSAY_RE.test(String(stack || ""));
  }
  /** Rapor gövdesi (sunucu sınırları: mesaj 500, stack 4000) */
  function rapor(seviye, mesaj, stack, url, satir, sutun) {
    var g = { seviye: seviye === "uyari" ? "uyari" : "hata", mesaj: kirp(String(mesaj).replace(/\s+/g, " ").trim(), 500), url: kirp(urlTemiz(url), 500) };
    if (stack) g.stack = kirp(urlTemiz(stack), 4000);
    if (satir != null && isFinite(satir)) g.satir = Number(satir);
    if (sutun != null && isFinite(sutun)) g.sutun = Number(sutun);
    return g;
  }
  /** Tekilleştirme anahtarı: mesaj + yığının ilk satırı */
  function anahtar(g) { return g.mesaj + "|" + String(g.stack || "").split("\n").slice(0, 2).join("|"); }

  var yardimci = { raporlanir: raporlanir, rapor: rapor, urlTemiz: urlTemiz, anahtar: anahtar, EN_FAZLA: EN_FAZLA };
  if (typeof module !== "undefined" && module.exports) module.exports = yardimci;
  root.MeberraHataIzle = yardimci;
  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (window.__meberraHataIzle) return; // iki kez yüklenirse ikinci kurulum yapılmaz
  window.__meberraHataIzle = true;
  if (!document.querySelector('meta[name="meberra-api"]')) return; // dosya modunda gönderilecek sunucu yok

  var gonderilen = 0, gorulen = {};
  var yerelFetch = window.fetch ? window.fetch.bind(window) : null;
  function gonder(g) {
    if (!yerelFetch || gonderilen >= EN_FAZLA) return;
    var k = anahtar(g);
    if (gorulen[k]) return;
    gorulen[k] = 1; gonderilen++;
    try {
      yerelFetch("/api/log", {
        method: "POST", credentials: "same-origin", keepalive: true,
        headers: { "Content-Type": "application/json", "X-Meberra": "1" }, body: JSON.stringify(g)
      }).catch(function () { /* rapor gönderilemezse sessizce geç */ });
    } catch (e) { /* yok say */ }
  }
  yardimci._gonder = gonder;

  window.addEventListener("error", function (e) {
    // Kaynak yükleme hataları (img/script 404) da "error" olayı üretir; yalnızca betik hataları raporlanır
    if (!e || (e.target && e.target !== window && !e.error)) return;
    var stack = e.error && e.error.stack;
    if (!raporlanir(e.message, stack || e.filename)) return;
    gonder(rapor("hata", e.message, stack, location.href, e.lineno, e.colno));
  });
  window.addEventListener("unhandledrejection", function (e) {
    var s = e && e.reason;
    var mesaj = s && s.message ? s.message : (typeof s === "string" ? s : (function () { try { return JSON.stringify(s); } catch (x) { return String(s); } })());
    var stack = s && s.stack;
    if (!raporlanir(mesaj, stack)) return;
    gonder(rapor("hata", "İşlenmemiş Promise reddi: " + mesaj, stack, location.href));
  });
  // /api/* 5xx yanıtları (rapor ucunun kendisi hariç)
  if (yerelFetch) {
    window.fetch = function (girdi, secenek) {
      var p = yerelFetch(girdi, secenek);
      try {
        var adres = typeof girdi === "string" ? girdi : (girdi && girdi.url) || "";
        var yol = new URL(adres, location.href);
        if (yol.origin === location.origin && /^\/api\//.test(yol.pathname) && yol.pathname !== "/api/log") {
          var yontem = ((secenek && secenek.method) || (girdi && girdi.method) || "GET").toUpperCase();
          p.then(function (r) {
            if (r && r.status >= 500) gonder(rapor("hata", "API " + r.status + ": " + yontem + " " + yol.pathname, null, location.href));
          }, function () { /* ağ hatası: çevrimdışı olabilir, raporlanmaz */ });
        }
      } catch (e) { /* izleme isteği bozmaz */ }
      return p;
    };
  }
})(typeof window !== "undefined" ? window : globalThis);
