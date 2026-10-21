/* ==========================================================================
   Meberra — birinci taraf kullanım ölçümü (1.6.0). Üçüncü taraf betik yok.
   MeberraOlcum.olay(ad, ozellikler): olayı kuyruğa ekler; kuyruk 5 sn'de bir, 10 olayda ya da sayfa gizlenirken
   POST /api/olay ile (X-Meberra başlığı, keepalive) toplu gönderilir. Her sayfada otomatik page_view.
   Gizlilik: ziyaretçi kimliği (mb_anon) rastgele üretilir, birinci taraf çerez + localStorage'da 400 gün tutulur;
   parmak izi yok, IP/tarayıcı bilgisi gönderilmez. Tarayıcıda "Do Not Track" ya da Global Privacy Control açıksa ya da
   kullanıcı profilinde ölçümü kapattıysa hiçbir olay gönderilmez. İlk ziyaretteki utm_source/medium/campaign saklanır.
   Otomatik olaylar (sayfa düzenlemesi gerektirmeden): vitrin_gorundu, kayit_baslat, seviye_basla, unite_bitti,
   paywall_gordu (ünite duvarı ya da 402 yanıtı), premium_sayfa, plan_secti. Diğer dönüşümleri sunucu kendisi yazar.
   ========================================================================== */
(function (root) {
  "use strict";
  var ANON_RE = /^[A-Za-z0-9_-]{16,40}$/;
  var K = { anon: "meberra:olcum:anon", utm: "meberra:olcum:utm", kapali: "meberra:olcum-kapali", bitti: "meberra:olcum:bitti" };

  function lsAl(k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } }
  function lsYaz(k, v) { try { if (v == null) root.localStorage.removeItem(k); else root.localStorage.setItem(k, v); } catch (e) { /* depolama kapalı */ } }
  function cerezAl(ad) { var m = new RegExp("(?:^|; )" + ad + "=([^;]*)").exec(document.cookie || ""); return m ? decodeURIComponent(m[1]) : null; }
  function rastgeleKimlik() {
    var b = new Uint8Array(16);
    (root.crypto || root.msCrypto).getRandomValues(b);
    var s = ""; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  /** Tarayıcı düzeyinde izin yok mu (DNT / GPC) ya da kullanıcı kapattı mı */
  function izinYok() {
    var n = root.navigator || {};
    if (n.globalPrivacyControl === true || n.doNotTrack === "1" || root.doNotTrack === "1") return true;
    return lsAl(K.kapali) === "1";
  }
  var yardimci = { ANON_RE: ANON_RE, izinYok: izinYok };
  if (typeof module !== "undefined" && module.exports) { module.exports = yardimci; return; }
  if (typeof document === "undefined" || root.__meberraOlcum) return;
  root.__meberraOlcum = true;
  if (!document.querySelector('meta[name="meberra-api"]')) { root.MeberraOlcum = { olay: function () {}, kapat: function () {}, izinYok: izinYok }; return; }

  // ---- ziyaretçi kimliği ve ilk kaynak ----
  function anonKimlik() {
    var a = cerezAl("mb_anon");
    if (!a || !ANON_RE.test(a)) a = lsAl(K.anon);
    if (!a || !ANON_RE.test(a)) a = rastgeleKimlik();
    lsYaz(K.anon, a);
    document.cookie = "mb_anon=" + a + "; Path=/; Max-Age=" + (400 * 86400) + "; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : "");
    return a;
  }
  var utm = null;
  try {
    var p = new URLSearchParams(location.search), kay = lsAl(K.utm);
    if (!kay && (p.get("utm_source") || p.get("utm_medium") || p.get("utm_campaign"))) {
      kay = JSON.stringify({ source: (p.get("utm_source") || "").slice(0, 60), medium: (p.get("utm_medium") || "").slice(0, 60), campaign: (p.get("utm_campaign") || "").slice(0, 60) });
      lsYaz(K.utm, kay);
    }
    utm = kay ? JSON.parse(kay) : null;
  } catch (e) { utm = null; }

  // ---- kuyruk ----
  var kuyruk = [], zamanlayici = null;
  var yerelFetch = root.fetch ? root.fetch.bind(root) : null;
  function gonder() {
    clearTimeout(zamanlayici); zamanlayici = null;
    if (!kuyruk.length || !yerelFetch) return;
    if (izinYok()) { kuyruk = []; return; }
    var parti = kuyruk.splice(0, 25);
    try {
      yerelFetch("/api/olay", {
        method: "POST", credentials: "same-origin", keepalive: true,
        headers: { "Content-Type": "application/json", "X-Meberra": "1" },
        body: JSON.stringify({ anon: anonKimlik(), utm: utm || undefined, olaylar: parti })
      }).catch(function () { /* ölçüm kaybı sorun değil */ });
    } catch (e) { /* yok say */ }
    if (kuyruk.length) gonder();
  }
  function olay(ad, ozellikler) {
    if (izinYok()) return;
    kuyruk.push({ ad: String(ad), sayfa: location.pathname, ozellikler: ozellikler || undefined, t: new Date().toISOString() });
    if (kuyruk.length >= 10) gonder();
    else if (!zamanlayici) zamanlayici = setTimeout(gonder, 5000);
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") gonder(); });
  root.addEventListener("pagehide", gonder);

  /** Profil tercihi: kapatınca kuyruk boşaltılır */
  function kapat(kapali) { lsYaz(K.kapali, kapali ? "1" : null); if (kapali) kuyruk = []; }
  var tekSefer = {};
  function bir(anahtar, ad, oz) { if (tekSefer[anahtar]) return; tekSefer[anahtar] = 1; olay(ad, oz); }
  root.MeberraOlcum = { olay: olay, kapat: kapat, izinYok: izinYok, bir: bir, gonder: gonder };

  var sayfa = (window.MEBERRA_ADRES ? window.MEBERRA_ADRES.sayfa() : ((location.pathname.split("/").pop() || "index").replace(/\.html?$/i, "") || "index"));
  olay("page_view", document.referrer && document.referrer.indexOf(location.origin) !== 0 ? { dis: true } : undefined);
  if (sayfa === "vitrin") olay("vitrin_gorundu");
  if (sayfa === "seviye-testi") bir("seviye", "seviye_basla");
  if (sayfa === "premium") olay("premium_sayfa", { plan: new URLSearchParams(location.search).get("plan") || undefined });

  // ---- DOM olayları ----
  document.addEventListener("focusin", function (e) { if (e.target && e.target.closest && e.target.closest("#form-kayit")) bir("kayit", "kayit_baslat"); });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t && t.name === "plan" && t.closest && t.closest("#pr-planlar")) olay("plan_secti", { plan: t.value });
  });
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href*="/premium?plan="]');
    if (a) { var m = /plan=(\w+)/.exec(a.getAttribute("href")); olay("plan_secti", { plan: m ? m[1] : "", yer: sayfa }); }
  });

  // Ünite duvarı (Premium) görüldü: sayfa + ünite başına bir kez
  function duvarDenetle() {
    var d = document.querySelector(".ug-duvar");
    if (d && d.isConnected && !d.classList.contains("ug-gizli") && d.offsetParent !== null) {
      var u = new URLSearchParams(location.search).get("unite");
      bir("duvar:" + u, "paywall_gordu", { unite: u ? +u : undefined, yer: "unite" });
    }
    // Tamamlanan üniteler: ilk ölçümde taban çizgisi, sonra yeni bitenler
    var kartlar = document.querySelectorAll(".ug-kart.is-bitti");
    if (kartlar.length || document.querySelector(".ug-kart")) {
      var kayit = null; try { kayit = JSON.parse(lsAl(K.bitti) || "null"); } catch (e) { kayit = null; }
      var ilk = !kayit; kayit = kayit || {};
      var liste = kayit[sayfa] || [], yeni = false;
      kartlar.forEach(function (k) {
        var m = /unite=(\d+)/.exec(k.getAttribute("href") || "");
        if (!m || liste.indexOf(+m[1]) >= 0) return;
        liste.push(+m[1]); yeni = true;
        if (!ilk) olay("unite_bitti", { unite: +m[1] });
      });
      if (yeni || ilk) { kayit[sayfa] = liste; lsYaz(K.bitti, JSON.stringify(kayit)); }
    }
  }
  var gozcu = null;
  function gozle() {
    duvarDenetle();
    if (root.MutationObserver && document.body && !gozcu) {
      var bekle = null;
      gozcu = new MutationObserver(function () { clearTimeout(bekle); bekle = setTimeout(duvarDenetle, 300); });
      gozcu.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", gozle); else gozle();
  root.addEventListener("popstate", function () { setTimeout(duvarDenetle, 300); });

  // ---- API yanıtları: 402 (Premium gerekli) → paywall; seviye testi açıldı ----
  if (yerelFetch) {
    var onceki = root.fetch;
    root.fetch = function (girdi, secenek) {
      var pr = onceki.apply(this, arguments);
      try {
        var adres = typeof girdi === "string" ? girdi : (girdi && girdi.url) || "";
        var yol = new URL(adres, location.href);
        if (yol.origin === location.origin && /^\/api\//.test(yol.pathname) && yol.pathname !== "/api/olay") {
          pr.then(function (r) {
            if (!r) return;
            if (r.status === 402) olay("paywall_gordu", { yer: yol.pathname.replace(/^\/api\//, "").slice(0, 60) });
            else if (r.ok && yol.pathname === "/api/seviye/bankalar") bir("seviye", "seviye_basla");
          }, function () {});
        }
      } catch (e) { /* izleme isteği bozmaz */ }
      return pr;
    };
  }
})(typeof window !== "undefined" ? window : globalThis);
