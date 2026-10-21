/* Meberra — bildirimler (zil), soru-cevap ("Bu soruyu anlamadım", Sorularım), haftalık lig, bildirim ayarları ve PWA/push.
   app.js'nin son bloğu bu dosyayı her sayfada (admin.html hariç) yükler. Yalnızca sunucu modunda
   (<meta name="meberra-api">) çalışır; dosya modunda hiçbir şey yapmaz. Sözleşme: server/API.md. */
(function () {
  "use strict";
  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (window.__meberraBildirim) return;
  window.__meberraBildirim = true;
  if (!document.querySelector('meta[name="meberra-api"]')) return; // dosya modu: sessizce çık
  if (window.MEBERRA_ADRES && window.MEBERRA_ADRES.sayfa() === "admin") return;

  /* ------------------------------------------------------------------ ortak yardımcılar */
  var D = document;
  function $(id) { return D.getElementById(id); }
  function esc(x) {
    return String(x == null ? "" : x).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; });
  }
  function satirli(x) { return esc(x).replace(/\r?\n/g, "<br>"); }
  function duzMetin(html) {
    var d = D.createElement("div");
    d.innerHTML = String(html || "");
    return (d.textContent || "").replace(/\s+/g, " ").trim();
  }
  /** Soru bağlamındaki LaTeX'i ($$…$$, \(…\)) dizer: MathJax yüklü sayfalarda (ders sayfaları); yoksa metin olduğu gibi kalır */
  function mathDiz(el) {
    var M = window.MathJax;
    if (el && M && typeof M.typesetPromise === "function") { try { M.typesetPromise([el]).catch(function () {}); } catch (e) { /* yok sayılır */ } }
  }
  function kisalt(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
  function me() { return window.APMEBERRA_ME || null; }
  function girisli() { var m = me(); return !!(m && m.user); }
  function premiumMu() { try { return typeof window.apPremiumMu === "function" ? !!window.apPremiumMu() : false; } catch (e) { return false; } }
  /** Mantıksal sayfa kimliği ("ap-calculus", "index"...). 1.8.0: temiz adres tablosundan (/assets/js/adresler.js) */
  function sayfaAdi() {
    if (window.MEBERRA_ADRES) return window.MEBERRA_ADRES.sayfa();
    var f = (location.pathname.split("/").pop() || "index").split("?")[0];
    try { f = decodeURIComponent(f); } catch (e) { /* yok say */ }
    return f.replace(/\.html?$/i, "") || "index";
  }
  /** Sayfa kimliği → temiz adres ("ap-calculus" → "/ders/calculus") */
  var sayfaAdres = function (p) { var A = window.MEBERRA_ADRES; return (A && A.sayfaAdres(p)) || p + ".html"; };
  /** Bağlantıdan sayfa kimliği: "/ders/calculus#q-card-x" ya da eski "/ders/calculus#q-card-x" */
  function bagSayfa(href) {
    var yol = String(href || "").split("#")[0].split("?")[0];
    if (/\.html?$/i.test(yol)) return yol.replace(/^.*\//, "").replace(/\.html?$/i, "");
    return window.MEBERRA_ADRES ? window.MEBERRA_ADRES.sayfa(yol) : yol.replace(/^.*\//, "");
  }
  function dersAdi(sayfa) {
    var c = window.APMEBERRA && Array.isArray(window.APMEBERRA.courses) ? window.APMEBERRA.courses : [];
    for (var i = 0; i < c.length; i++) if (c[i].page === sayfa) return c[i].name;
    var ozel = { ilerleme: "İlerleme", calis: "Çalış", index: "Bugün", profil: "Profil", deneme: "Deneme" };
    return ozel[sayfa] || (sayfa ? sayfa : "Genel");
  }
  function hazir(fn) { if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", fn); else fn(); }
  var azHareket = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** API çağrısı. Hata: Error{durum, veri}. */
  function api(yol, yontem, govde) {
    var o = { method: yontem || "GET", credentials: "same-origin", headers: { "Accept": "application/json" } };
    if (o.method !== "GET") {
      o.headers["Content-Type"] = "application/json";
      o.headers["X-Meberra"] = "1";
      o.body = JSON.stringify(govde || {});
    }
    return fetch(yol, o).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        j = j || {};
        if (!r.ok || j.ok === false) {
          var e = new Error(j.error || (r.status === 429 ? "Çok fazla deneme yaptın; biraz sonra tekrar dene." : "Bir sorun oluştu. Biraz sonra tekrar dene."));
          e.durum = r.status; e.veri = j;
          throw e;
        }
        return j;
      });
    });
  }

  function zamanOnce(iso) {
    var t = Date.parse(iso);
    if (isNaN(t)) return "";
    var sn = Math.max(0, (Date.now() - t) / 1000);
    if (sn < 60) return "az önce";
    if (sn < 3600) return Math.floor(sn / 60) + " dk önce";
    if (sn < 86400) return Math.floor(sn / 3600) + " sa önce";
    if (sn < 172800) return "dün";
    if (sn < 7 * 86400) return Math.floor(sn / 86400) + " gün önce";
    try { return new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "long" }); } catch (e) { return ""; }
  }
  function tarihSaat(iso) {
    var t = Date.parse(iso);
    if (isNaN(t)) return "";
    try { return new Date(t).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; }
  }

  var IK = {
    zil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    "soru-yanit": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9 10.5a3 3 0 0 1 5.6 1c0 2-2.6 2-2.6 3.5M12 17.5v.01"/></svg>',
    seri: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5z"/></svg>',
    premium: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7l4 4 5-7 5 7 4-4-2 12H5z"/></svg>',
    duyuru: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M17 9a4 4 0 0 1 0 6"/></svg>',
    rozet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/></svg>',
    lig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>',
    tekrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/></svg>',
    soru: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5M12 17.5v.01"/></svg>',
    kapat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    ayar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    tik: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
    yukari: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    asagi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
    telefon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg>',
    indir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>'
  };
  var TUR_AD = { "soru-yanit": "Soru yanıtı", seri: "Seri", premium: "Premium", duyuru: "Duyuru", rozet: "Rozet", lig: "Lig", tekrar: "Tekrar" };
  // 1.4.0: oyun bildirimlerinde avatar maskot başıdır (Tilo, assets/js/maskot.js); soru yanıtı ve Premium kendi ikonunu korur.
  var MASKOT_TUR = { seri: "uykulu", rozet: "kutlama", lig: "sevincli", tekrar: "dusunen", duyuru: "selam" };
  function maskotBas(ifade, boyut) {
    var M = window.MeberraMaskot;
    return M && M.html ? M.html(ifade, { boyut: boyut || 36, sadeceBas: true, etiket: false, animasyon: false }) : "";
  }
  function maskotTam(ifade, boyut) {
    var M = window.MeberraMaskot;
    return M && M.html ? M.html(ifade, { boyut: boyut || 120, etiket: false }) : "";
  }

  /* ------------------------------------------------------------------ PWA: service worker + yükleme isteği */
  var yuklemeIstegi = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    yuklemeIstegi = e;
    try { D.dispatchEvent(new CustomEvent("meberra:yuklenebilir")); } catch (x) { /* eski tarayıcı */ }
  });
  window.addEventListener("appinstalled", function () {
    yuklemeIstegi = null;
    try { D.dispatchEvent(new CustomEvent("meberra:yuklenebilir")); } catch (x) { /* yok say */ }
  });
  var swKayit = null;
  function swKaydet() {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return Promise.resolve(null);
    if (!swKayit) swKayit = navigator.serviceWorker.register("/sw.js").catch(function () { swKayit = null; return null; });
    return swKayit;
  }
  if (D.readyState === "complete") swKaydet(); else window.addEventListener("load", function () { swKaydet(); });

  /* ------------------------------------------------------------------ küçük canlı bölge (ekran okuyucu duyuruları) */
  var canli = null;
  function duyur(metin) {
    if (!canli) {
      canli = D.createElement("div");
      canli.className = "visually-hidden";
      canli.setAttribute("role", "status");
      canli.setAttribute("aria-live", "polite");
      D.body.appendChild(canli);
    }
    canli.textContent = "";
    setTimeout(function () { canli.textContent = metin; }, 40);
  }

  /* ================================================================== 1. ZİL */
  var Zil = (function () {
    var kap, btn, rozet, panel, liste, dahaBtn, tumuBtn;
    var oncekiSayi = null, acik = false, bildirimler = [], dahaVar = false, sonCekim = 0, zamanlayici = null, kapali = false;

    function kur(actions) {
      if (kap || !actions) return;
      kap = D.createElement("div");
      kap.className = "bd-zil-kap";
      kap.innerHTML =
        '<button type="button" class="icon-btn bd-zil" aria-expanded="false" aria-controls="bd-panel" aria-label="Bildirimler" title="Bildirimler">' +
          IK.zil + '<span class="bd-rozet" hidden></span></button>' +
        '<div class="bd-panel" id="bd-panel" role="region" aria-labelledby="bd-panel-baslik" hidden>' +
          '<div class="bd-panel-ust"><h2 class="bd-panel-baslik" id="bd-panel-baslik" tabindex="-1">Bildirimler</h2>' +
            '<button type="button" class="bd-link-btn bd-tumu" hidden>Tümünü okundu say</button>' +
            '<button type="button" class="icon-btn bd-panel-kapat" aria-label="Bildirimleri kapat">' + IK.kapat + '</button></div>' +
          '<ul class="bd-liste" aria-live="polite"></ul>' +
          '<button type="button" class="bd-link-btn bd-daha" hidden>Daha eski bildirimler</button>' +
          '<div class="bd-panel-alt">' +
            '<button type="button" class="btn-primary btn-sm bd-soru-sor">' + IK.soru + 'Soru sor</button>' +
            '<a class="btn-ghost btn-sm" href="/profil#bildirim-ayarlari">' + IK.ayar + 'Ayarlar</a>' +
          '</div>' +
        '</div>';
      var acc = actions.querySelector(".account");
      actions.insertBefore(kap, acc || actions.querySelector(".nav-menu-btn") || null);
      btn = kap.querySelector(".bd-zil");
      rozet = kap.querySelector(".bd-rozet");
      panel = kap.querySelector(".bd-panel");
      liste = kap.querySelector(".bd-liste");
      dahaBtn = kap.querySelector(".bd-daha");
      tumuBtn = kap.querySelector(".bd-tumu");

      btn.addEventListener("click", function (e) { e.stopPropagation(); acik ? kapat(false) : ac(); });
      kap.querySelector(".bd-panel-kapat").addEventListener("click", function () { kapat(true); });
      tumuBtn.addEventListener("click", tumunuOku);
      dahaBtn.addEventListener("click", dahaFazla);
      kap.querySelector(".bd-soru-sor").addEventListener("click", function () { kapat(false); SoruModal.ac(null, btn); });
      liste.addEventListener("click", ogeTik);
      D.addEventListener("click", function (e) { if (acik && !kap.contains(e.target)) kapat(false); });
      D.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && acik) { kapat(true); }
      });
      // Hesap menüsü açılınca zil kapansın
      var accBtn = actions.querySelector(".account-btn");
      if (accBtn) accBtn.addEventListener("click", function () { if (acik) kapat(false); });

      cek();
      zamanlayici = setInterval(function () { if (D.visibilityState === "visible") cek(); }, 60000);
      D.addEventListener("visibilitychange", function () { if (D.visibilityState === "visible" && Date.now() - sonCekim > 15000) cek(); });
      window.addEventListener("focus", function () { if (Date.now() - sonCekim > 15000) cek(); });
    }

    function rozetYaz(n) {
      if (!btn) return;
      n = Math.max(0, n | 0);
      rozet.hidden = n === 0;
      rozet.textContent = n > 99 ? "99+" : String(n);
      btn.setAttribute("aria-label", n ? "Bildirimler, " + n + " okunmamış" : "Bildirimler");
      btn.title = n ? n + " okunmamış bildirim" : "Bildirimler";
      if (oncekiSayi !== null && n > oncekiSayi) {
        if (!azHareket) {
          rozet.classList.remove("bd-pop"); void rozet.offsetWidth; rozet.classList.add("bd-pop");
          btn.classList.remove("bd-salla"); void btn.offsetWidth; btn.classList.add("bd-salla");
        }
        duyur(n === 1 ? "1 yeni bildirimin var." : n + " okunmamış bildirimin var.");
      }
      oncekiSayi = n;
    }

    function cek() {
      if (kapali) return Promise.resolve();
      sonCekim = Date.now();
      return api("/api/bildirimler").then(function (j) {
        bildirimler = j.bildirimler || [];
        dahaVar = !!j.dahaVar;
        rozetYaz(j.okunmamis || 0);
        if (acik) ciz();
      }).catch(function (e) {
        if (e.durum === 401) { kapali = true; clearInterval(zamanlayici); if (kap) kap.hidden = true; }
      });
    }

    function dahaFazla() {
      var son = bildirimler[bildirimler.length - 1];
      if (!son) return;
      dahaBtn.disabled = true;
      api("/api/bildirimler?once=" + encodeURIComponent(son.id)).then(function (j) {
        bildirimler = bildirimler.concat(j.bildirimler || []);
        dahaVar = !!j.dahaVar;
        ciz();
      }).catch(function () { /* sessiz */ }).then(function () { dahaBtn.disabled = false; });
    }

    function ogeHtml(b) {
      var tur = IK[b.tur] ? b.tur : "duyuru";
      var bas = MASKOT_TUR[tur] ? maskotBas(MASKOT_TUR[tur], 36) : "";
      var ic =
        (bas ? '<span class="bd-bil-ikon bd-bil-maskot bd-tur-' + esc(tur) + '">' + bas + '</span>' : '<span class="bd-bil-ikon bd-tur-' + esc(tur) + '">' + IK[tur] + '</span>') +
        '<span class="bd-bil-govde"><span class="bd-bil-baslik">' + esc(b.baslik || TUR_AD[tur] || "Bildirim") + '</span>' +
          (b.metin ? '<span class="bd-bil-metin">' + esc(kisalt(b.metin, 160)) + '</span>' : "") +
          '<span class="bd-bil-zaman"><span class="visually-hidden">' + esc(TUR_AD[tur] || "") + ' · </span><time datetime="' + esc(b.olusturma) + '">' + esc(zamanOnce(b.olusturma)) + '</time></span></span>' +
        (b.okundu ? "" : '<span class="bd-nokta" aria-hidden="true"></span><span class="visually-hidden">(okunmadı)</span>');
      var cls = "bd-bil" + (b.okundu ? "" : " bd-yeni");
      var link = typeof b.link === "string" && b.link.charAt(0) === "/" && b.link.charAt(1) !== "/" ? b.link : null;
      return '<li>' + (link
        ? '<a class="' + cls + '" href="' + esc(link) + '" data-id="' + esc(b.id) + '">' + ic + '</a>'
        : '<button type="button" class="' + cls + '" data-id="' + esc(b.id) + '">' + ic + '</button>') + '</li>';
    }

    function ciz() {
      if (!bildirimler.length) {
        liste.innerHTML = '<li class="bd-bos"><span class="bd-bos-ikon">' + IK.zil + '</span><strong>Henüz bildirim yok</strong>' +
          '<span>Sorularına gelen cevaplar, lig sonuçları ve duyurular burada görünür.</span></li>';
      } else {
        liste.innerHTML = bildirimler.map(ogeHtml).join("");
      }
      tumuBtn.hidden = !bildirimler.some(function (b) { return !b.okundu; });
      dahaBtn.hidden = !dahaVar;
    }

    function okunduIsaretle(ids, hepsi) {
      return api("/api/bildirimler/okundu", "POST", hepsi ? { hepsi: true } : { ids: ids }).then(function (j) {
        rozetYaz(j.okunmamis || 0);
        return j;
      });
    }

    function ogeTik(e) {
      var el = e.target.closest(".bd-bil");
      if (!el) return;
      var id = Number(el.getAttribute("data-id"));
      var b = bildirimler.filter(function (x) { return x.id === id; })[0];
      var href = el.tagName === "A" ? el.getAttribute("href") : null;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) { if (b && !b.okundu) okunduIsaretle([id]); return; }
      e.preventDefault();
      var git = function () {
        if (!href) return;
        var hedef = new URL(href, location.href);
        kapat(false);
        if (hedef.pathname === location.pathname && hedef.search === location.search) {
          if (location.hash === hedef.hash) window.dispatchEvent(new HashChangeEvent("hashchange"));
          else location.hash = hedef.hash;
        } else {
          location.href = hedef.href;
        }
      };
      if (b && !b.okundu) {
        b.okundu = true;
        el.classList.remove("bd-yeni");
        var n = el.querySelector(".bd-nokta"); if (n) n.remove();
        okunduIsaretle([id]).catch(function () { /* yok say */ }).then(git);
      } else git();
    }

    function tumunuOku() {
      tumuBtn.disabled = true;
      okunduIsaretle(null, true).then(function () {
        bildirimler.forEach(function (b) { b.okundu = true; });
        ciz();
        duyur("Tüm bildirimler okundu olarak işaretlendi.");
        panel.querySelector(".bd-panel-baslik").focus();
      }).catch(function () { /* sessiz */ }).then(function () { tumuBtn.disabled = false; });
    }

    function ac() {
      if (typeof window.closeAllNavDropdowns === "function") { try { window.closeAllNavDropdowns(); } catch (e) { /* yok say */ } }
      acik = true;
      ciz();
      panel.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      kap.classList.add("bd-acik");
      panel.querySelector(".bd-panel-baslik").focus();
      cek();
    }
    function kapat(odak) {
      if (!acik) return;
      acik = false;
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      kap.classList.remove("bd-acik");
      if (odak) btn.focus();
    }

    return { kur: kur, cek: function () { if (kap) cek(); } };
  })();

  /** Navbar app.js tarafından DOMContentLoaded'da kurulur; hazır olunca zili ekle. */
  function navbarBekle(fn) {
    var bul = function () { var a = D.querySelector(".navbar .nav-actions"); return a && a.querySelector(".account") ? a : null; };
    var a = bul();
    if (a) { fn(a); return; }
    var bitti = false;
    var mo = new MutationObserver(function () {
      var x = bul();
      if (x && !bitti) { bitti = true; mo.disconnect(); fn(x); }
    });
    mo.observe(D.body, { childList: true, subtree: true });
    setTimeout(function () { if (!bitti) { bitti = true; mo.disconnect(); } }, 8000);
  }

  /* ================================================================== 2. SORU MODALI */
  var hakOnbellek = null; // { hak, zaman }
  function hakGetir(taze) {
    if (!taze && hakOnbellek && Date.now() - hakOnbellek.zaman < 30000) return Promise.resolve(hakOnbellek.veri);
    return api("/api/sorular").then(function (j) { hakOnbellek = { veri: j, zaman: Date.now() }; return j; });
  }
  function hakMetni(hak) {
    if (!hak) return "";
    if (hak.sinirsiz) return "Premium: sınırsız soru hakkın var.";
    var k = hak.kalan == null ? 0 : hak.kalan;
    if (k <= 0) return "Bu ayki ücretsiz soru hakların bitti.";
    return "Bu ay " + k + " soru hakkın kaldı.";
  }

  var SoruModal = (function () {
    var ortu, kutu, sonOdak, aktifBaglam = null;

    function kur() {
      if (ortu) return;
      ortu = D.createElement("div");
      ortu.className = "bd-modal-ortu";
      ortu.hidden = true;
      ortu.innerHTML =
        '<div class="bd-modal" role="dialog" aria-modal="true" aria-labelledby="bd-m-baslik" aria-describedby="bd-m-aciklama">' +
          '<div class="bd-modal-ust"><h2 id="bd-m-baslik" tabindex="-1">Bu soruyu anlamadım</h2>' +
            '<button type="button" class="icon-btn bd-m-kapat" aria-label="Kapat">' + IK.kapat + '</button></div>' +
          '<div class="bd-modal-govde"></div>' +
        '</div>';
      D.body.appendChild(ortu);
      kutu = ortu.querySelector(".bd-modal");
      ortu.addEventListener("mousedown", function (e) { if (e.target === ortu) kapat(); });
      ortu.querySelector(".bd-m-kapat").addEventListener("click", kapat);
      ortu.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); kapat(); return; }
        if (e.key === "Tab") tuzak(e);
      });
    }
    function odaklanabilir() {
      return Array.prototype.filter.call(kutu.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]'),
        function (el) { return el.offsetParent !== null; });
    }
    function tuzak(e) {
      var l = odaklanabilir();
      if (!l.length) return;
      var ilk = l[0], son = l[l.length - 1];
      if (e.shiftKey && (D.activeElement === ilk || !kutu.contains(D.activeElement))) { e.preventDefault(); son.focus(); }
      else if (!e.shiftKey && D.activeElement === son) { e.preventDefault(); ilk.focus(); }
    }

    function baglamHtml(c) {
      if (!c || !c.baglam) return "";
      var b = c.baglam, h = '<div class="bd-baglam" aria-label="Soru">';
      h += '<div class="bd-baglam-ust">' + esc([dersAdi(c.sayfa), b.unite, b.soruNo ? "Soru " + b.soruNo : ""].filter(Boolean).join(" · ")) + '</div>';
      if (b.soru) h += '<p class="bd-baglam-soru">' + esc(kisalt(b.soru, 420)) + '</p>';
      if (b.secenekler && b.secenekler.length) {
        h += '<ul class="bd-baglam-sec">' + b.secenekler.map(function (s) {
          var harf = String(s).charAt(0);
          var sen = b.ogrenciCevabi && harf === b.ogrenciCevabi;
          return '<li' + (sen ? ' class="bd-sen"' : "") + '>' + esc(kisalt(s, 160)) + (sen ? ' <span class="bd-etiket">Senin cevabın</span>' : "") + '</li>';
        }).join("") + '</ul>';
      } else if (b.ogrenciCevabi) {
        h += '<p class="bd-baglam-not">Senin cevabın: <strong>' + esc(b.ogrenciCevabi) + '</strong>' + (b.dogruCevap ? " · Doğru: <strong>" + esc(b.dogruCevap) + "</strong>" : "") + '</p>';
      }
      if (b.hataNedeni) h += '<p class="bd-baglam-not">' + esc(kisalt(b.hataNedeni, 200)) + '</p>';
      return h + '</div>';
    }

    function formCiz(c) {
      var govde = kutu.querySelector(".bd-modal-govde");
      $("bd-m-baslik").textContent = c && c.baglam ? "Bu soruyu anlamadım" : "Meberra ekibine soru sor";
      govde.innerHTML =
        baglamHtml(c) +
        '<form class="bd-m-form" novalidate>' +
          '<div class="form-alert" role="alert" hidden></div>' +
          '<div class="bd-hak" aria-live="polite"><span class="bd-hak-metin">Soru hakkın kontrol ediliyor…</span></div>' +
          '<label class="bd-etiket-ust" for="bd-m-metin">' + (c && c.baglam ? "Neresini anlamadın?" : "Sorun ne?") + '</label>' +
          '<textarea id="bd-m-metin" class="text-input bd-textarea" rows="5" maxlength="2000" required ' +
            'placeholder="' + (c && c.baglam ? "ör. Çözümde 2. adımda türev neden böyle alınmış?" : "ör. Limit sorularında nereden başlamalıyım?") + '" aria-describedby="bd-m-aciklama bd-m-sayac"></textarea>' +
          '<div class="bd-m-alt-bilgi"><p class="field-hint" id="bd-m-aciklama">Meberra ekibi yanıtlar; cevap gelince zilde görürsün.</p><span class="bd-sayac" id="bd-m-sayac">0 / 2000</span></div>' +
          '<div class="bd-m-dugmeler"><button type="button" class="btn-ghost bd-m-vazgec">Vazgeç</button><button type="submit" class="btn-primary bd-m-gonder">Gönder</button></div>' +
        '</form>';
      mathDiz(govde.querySelector(".bd-baglam") || null);
      var form = govde.querySelector("form"), ta = form.querySelector("textarea"), sayac = form.querySelector(".bd-sayac");
      ta.addEventListener("input", function () { sayac.textContent = ta.value.length + " / 2000"; });
      form.querySelector(".bd-m-vazgec").addEventListener("click", kapat);
      form.addEventListener("submit", function (e) { e.preventDefault(); gonder(form); });
      hakGetir(false).then(function (j) { hakGoster(form, j.hak); }).catch(function () { form.querySelector(".bd-hak").hidden = true; });
    }

    function hakGoster(form, hak) {
      var kutuH = form.querySelector(".bd-hak");
      kutuH.hidden = false;
      kutuH.classList.toggle("bd-hak-sinirsiz", !!(hak && hak.sinirsiz));
      kutuH.querySelector(".bd-hak-metin").textContent = hakMetni(hak);
      if (hak && !hak.sinirsiz && (hak.kalan || 0) <= 0) {
        upsell(form, null);
      }
    }

    function upsell(form, mesaj) {
      var a = form.querySelector(".form-alert");
      a.hidden = false;
      a.className = "form-alert is-info bd-upsell";
      a.innerHTML = '<span class="bd-upsell-ikon">' + IK.premium + '</span><span><strong>Bu ayki 3 ücretsiz soru hakkını kullandın.</strong> ' +
        esc(mesaj && !/ücretsiz soru hakkını kullandın/.test(mesaj) ? mesaj : "Hakların ayın başında yenilenir. Premium ile istediğin kadar soru sorabilirsin.") +
        '<br><a class="btn-primary btn-sm bd-upsell-btn" href="/premium">' + IK.premium + 'Premium\'u incele</a></span>';
      form.querySelector(".bd-m-gonder").disabled = true;
    }

    function gonder(form) {
      var ta = form.querySelector("textarea"), btn = form.querySelector(".bd-m-gonder"), a = form.querySelector(".form-alert");
      var metin = ta.value.trim();
      if (!metin) {
        a.hidden = false; a.className = "form-alert"; a.textContent = "Önce sorunu birkaç kelimeyle yaz.";
        ta.setAttribute("aria-invalid", "true"); ta.focus(); return;
      }
      ta.removeAttribute("aria-invalid");
      btn.disabled = true; btn.textContent = "Gönderiliyor…";
      var c = aktifBaglam || {};
      var govde = { metin: metin, sayfa: String(c.sayfa || sayfaAdi()).slice(0, 80) };
      if (c.soruRef) govde.soruRef = String(c.soruRef).slice(0, 120);
      if (c.baglam) govde.baglam = c.baglam;
      api("/api/sorular", "POST", govde).then(function (j) {
        hakOnbellek = null;
        basari(j);
        D.dispatchEvent(new CustomEvent("meberra:soru-degisti"));
      }).catch(function (e) {
        btn.textContent = "Gönder";
        if (e.durum === 402 || (e.veri && e.veri.premiumGerekli)) { upsell(form, e.message); return; }
        btn.disabled = false;
        a.hidden = false; a.className = "form-alert"; a.textContent = e.message;
        a.focus();
      });
    }

    function basari(j) {
      var govde = kutu.querySelector(".bd-modal-govde");
      var id = j.soru && j.soru.id;
      govde.innerHTML =
        '<div class="bd-basari"><span class="bd-basari-ikon">' + IK.tik + '</span>' +
          '<h3 tabindex="-1">Sorun bize ulaştı!</h3>' +
          '<p>Meberra ekibi en kısa sürede yanıtlayacak. Cevap gelince zil simgesinde bildirim görürsün.</p>' +
          (j.hak && !j.hak.sinirsiz ? '<p class="field-hint">' + esc(hakMetni(j.hak)) + '</p>' : "") +
          '<div class="bd-m-dugmeler">' +
            (id ? '<a class="btn-ghost" href="/sorularim?soru=' + encodeURIComponent(id) + '">Sorularıma git</a>' : "") +
            '<button type="button" class="btn-primary bd-m-tamam">Çalışmaya dön</button></div></div>';
      govde.querySelector(".bd-m-tamam").addEventListener("click", kapat);
      govde.querySelector("h3").focus();
      duyur("Sorun gönderildi.");
    }

    function ac(baglam, tetik) {
      kur();
      aktifBaglam = baglam;
      sonOdak = tetik || D.activeElement;
      formCiz(baglam);
      ortu.hidden = false;
      D.documentElement.classList.add("bd-kilit");
      requestAnimationFrame(function () { ortu.classList.add("bd-gorunur"); });
      var ta = $("bd-m-metin");
      setTimeout(function () { if (ta) ta.focus(); }, 30);
    }
    function kapat() {
      if (!ortu || ortu.hidden) return;
      ortu.classList.remove("bd-gorunur");
      ortu.hidden = true;
      D.documentElement.classList.remove("bd-kilit");
      if (sonOdak && sonOdak.focus && D.contains(sonOdak)) sonOdak.focus();
    }
    return { ac: ac, kapat: kapat };
  })();

  /* ------------------------------------------------------------------ soru kartlarına "Bu soruyu anlamadım" */
  function depoOku(k) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } }

  function kartBaglami(kart) {
    var cont = kart.closest('[id$="-quiz-container"]');
    if (!cont) return null;
    var qid = kart.getAttribute("data-qid");
    var data = cont._questionsData || [];
    var q = null;
    for (var i = 0; i < data.length; i++) if (data[i].id === qid) { q = data[i]; break; }
    var sayfa = sayfaAdi();
    var cevap = null;
    var pr = depoOku("apmeberra:quiz:v1");
    try { cevap = pr.pages[sayfa].units[cont.id].answers[qid] || null; } catch (e) { cevap = null; }
    var unite = "";
    try { unite = pr.pages[sayfa].units[cont.id].title || ""; } catch (e) { unite = ""; }
    var b = { soru: "", secenekler: [], ogrenciCevabi: cevap && cevap.s ? cevap.s : null };
    if (q) {
      b.soru = kisalt(duzMetin(q.question), 3000);
      b.secenekler = (q.options || []).map(function (o) { return o.id + ") " + kisalt(duzMetin(o.text), 500); });
      var dogru = (q.options || []).filter(function (o) { return o.isCorrect; })[0];
      if (cevap && dogru) b.dogruCevap = dogru.id;
      b.konu = kisalt(duzMetin(q.topic), 200);
      b.soruNo = q.number || null;
    } else {
      var govde = kart.querySelector(".question-body");
      b.soru = kisalt(govde ? govde.textContent.replace(/\s+/g, " ").trim() : "", 3000);
    }
    if (unite) b.unite = kisalt(unite, 160);
    // 8000 karakter sınırına sığdır
    while (JSON.stringify(b).length > 7800 && b.soru.length > 200) b.soru = kisalt(b.soru, Math.floor(b.soru.length * 0.7));
    return { sayfa: sayfa, soruRef: (cont.id + "|" + qid).slice(0, 120), baglam: b };
  }

  function hataBaglami(li) {
    var a = li.querySelector('a[href*="#q-card-"]');
    if (!a) return null;
    var m = /#q-card-(.+)$/.exec(a.getAttribute("href") || "");
    if (!m) return null;
    var sayfa = bagSayfa(a.getAttribute("href")), qid = decodeURIComponent(m[1]);
    var er = depoOku("apmeberra:errors:v1");
    var e = er && er.items ? er.items[sayfa + "|" + qid] : null;
    var b = { soru: "", ogrenciCevabi: e && e.selected ? e.selected : null };
    if (e) {
      b.soru = "(Yanlışlarım listesinden) " + (e.topic || qid);
      if (e.correct) b.dogruCevap = e.correct;
      if (e.unitTitle) b.unite = kisalt(e.unitTitle, 160);
      if (e.topic) b.konu = kisalt(e.topic, 200);
      if (e.errorTag) b.hataNedeni = kisalt(e.errorTag, 400);
      if (e.number) b.soruNo = e.number;
    } else {
      var t = li.querySelector(".err-topic");
      b.soru = "(Yanlışlarım listesinden) " + (t ? t.textContent.trim() : qid);
    }
    return { sayfa: sayfa.slice(0, 80), soruRef: (((e && e.unit) || sayfa) + "|" + qid).slice(0, 120), baglam: b };
  }

  function anlamadimDugmesi(baglamFn) {
    var b = D.createElement("button");
    b.type = "button";
    b.className = "bd-anlamadim";
    b.innerHTML = IK.soru + "<span>Bu soruyu anlamadım</span>";
    b.addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation();
      SoruModal.ac(baglamFn(), b);
    });
    // Soru kartındaki A–E kısayolları bu düğmede tetiklenmesin
    b.addEventListener("keydown", function (e) { if (/^[a-eA-E]$/.test(e.key || "")) e.stopPropagation(); });
    return b;
  }

  function kartlariTara(kok) {
    (kok || D).querySelectorAll('[id$="-quiz-container"] .question-card').forEach(function (kart) {
      if (kart.querySelector(".bd-anlamadim")) return;
      var alt = D.createElement("div");
      alt.className = "bd-soru-alt";
      alt.appendChild(anlamadimDugmesi(function () { return kartBaglami(kart); }));
      kart.appendChild(alt);
    });
    (kok || D).querySelectorAll("#err-list .err-item").forEach(function (li) {
      if (li.querySelector(".bd-anlamadim")) return;
      var alt = D.createElement("div");
      alt.className = "bd-soru-alt bd-soru-alt-hata";
      alt.appendChild(anlamadimDugmesi(function () { return hataBaglami(li); }));
      li.appendChild(alt);
    });
  }

  function soruKartlariniIzle() {
    kartlariTara();
    var bekle = null;
    new MutationObserver(function () {
      if (bekle) return;
      bekle = setTimeout(function () { bekle = null; kartlariTara(); }, 120);
    }).observe(D.body, { childList: true, subtree: true });
  }

  /* ------------------------------------------------------------------ ders sayfası: Sık sorulanlar */
  function sssGoster() {
    var sayfa = sayfaAdi();
    if (!/^ap-/.test(sayfa)) return;
    api("/api/public/sss?sayfa=" + encodeURIComponent(sayfa)).then(function (j) {
      var l = (j.sss || []).slice(0, 12);
      if (!l.length) return;
      var main = D.querySelector("main") || D.querySelector(".main-container");
      if (!main || D.querySelector(".bd-sss")) return;
      var s = D.createElement("section");
      s.className = "bd-sss";
      s.setAttribute("aria-labelledby", "bd-sss-baslik");
      s.innerHTML = '<details class="bd-sss-kap"><summary><span class="bd-sss-ikon">' + IK.soru + '</span><h2 id="bd-sss-baslik">Sık sorulanlar</h2><span class="bd-sss-sayi">' + l.length + '</span></summary>' +
        '<div class="bd-sss-liste">' + l.map(function (x) {
          return '<details class="bd-sss-oge"><summary>' + esc(x.soru) + '</summary><div class="bd-sss-cevap">' + satirli(x.cevap) + '</div></details>';
        }).join("") +
        '<p class="field-hint">Cevabını bulamadın mı? <button type="button" class="bd-link-btn bd-sss-sor">Meberra ekibine sor</button></p></div></details>';
      main.appendChild(s);
      var sor = s.querySelector(".bd-sss-sor");
      if (girisli()) sor.addEventListener("click", function () { SoruModal.ac(null, sor); });
      else sor.parentNode.hidden = true;
    }).catch(function () { /* SSS isteğe bağlı */ });
  }

  /* ================================================================== 3. SORULARIM (sorularim.html; eski profil.html#sorularim adresi oraya yönlenir) */
  var Sorularim = (function () {
    var kok, kapsam, acikId = null;
    var DURUM = { bekliyor: ["Bekliyor", "bd-cip-bekliyor"], cevaplandi: ["Cevaplandı", "bd-cip-cevap"], kapandi: ["Kapandı", "bd-cip-kapali"] };
    function cip(d) { var x = DURUM[d] || DURUM.bekliyor; return '<span class="bd-cip ' + x[1] + '">' + x[0] + '</span>'; }
    // Boş durum çizimi (satır içi SVG; renkler bildirim.css'teki sınıflardan, açık/koyu temaya uyar)
    var BOS_CIZIM = '<svg class="bd-bos-cizim" viewBox="0 0 160 120" aria-hidden="true">' +
      '<circle cx="80" cy="62" r="50" class="bd-c-zemin"/>' +
      '<rect x="30" y="28" width="70" height="46" rx="15" class="bd-c-balon1"/><path d="M46 72l-6 15 19-15z" class="bd-c-balon1"/>' +
      '<rect x="66" y="52" width="64" height="42" rx="15" class="bd-c-balon2"/><path d="M114 92l6 13-19-13z" class="bd-c-balon2"/>' +
      '<path d="M57 44a8 8 0 0 1 15.5 2.6c0 5.4-7.5 5.4-7.5 9.4" class="bd-c-cizgi"/><circle cx="65" cy="63" r="2.6" class="bd-c-nokta"/>' +
      '<rect x="80" y="66" width="38" height="5" rx="2.5" class="bd-c-satir"/><rect x="80" y="76" width="26" height="5" rx="2.5" class="bd-c-satir"/>' +
      '<path d="M130 22l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" class="bd-c-yildiz"/><path d="M26 88l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z" class="bd-c-yildiz"/></svg>';
    function iskelet(n) {
      var h = '<ul class="bd-soru-liste bd-iskelet-liste" aria-hidden="true">';
      for (var i = 0; i < n; i++) h += '<li><span class="iskelet bd-iskelet-oge"></span></li>';
      return h + '</ul><p class="visually-hidden">Sorular yükleniyor…</p>';
    }
    // Liste ↔ konuşma geçişi: yeni içerik yönüne göre kayarak girer (azaltılmış harekette yok)
    function yerlestir(html, yon) {
      var g = govde();
      g.innerHTML = html;
      if (azHareket || !yon || !g.firstElementChild) return;
      g.firstElementChild.classList.add(yon === "ileri" ? "bd-gir-ileri" : "bd-gir-geri");
    }

    function kur(el) {
      kok = el;
      var tam = el.hasAttribute("data-tam");
      // Sorularım sayfası (sorularim.html): başlık, hak satırı ve "Soru sor" düğmesi sayfanın kendisinde
      kapsam = tam ? D : kok;
      kok.innerHTML = (tam ? "" :
        '<div class="bd-bolum-ust"><h2 class="panel-h" id="sorularim-baslik" tabindex="-1">' + IK.soru + 'Sorularım</h2>' +
          '<button type="button" class="btn-primary btn-sm bd-yeni-soru">' + IK.soru + 'Soru sor</button></div>' +
        '<p class="panel-lead">Anlamadığın bir soruyu Meberra ekibine sor. <span class="bd-hak-satir"></span></p>') +
        '<div class="bd-sorular-govde" aria-live="polite">' + iskelet(3) + '</div>';
      kapsam.querySelectorAll(".bd-yeni-soru").forEach(function (b) { b.addEventListener("click", function (e) { SoruModal.ac(null, e.currentTarget); }); });
      kok.addEventListener("click", function (e) { var b = e.target.closest(".bd-bos-sor"); if (b) SoruModal.ac(null, b); });
      D.addEventListener("meberra:soru-degisti", function () { if (!acikId) listele(); });
      var q = /[?&]soru=(\d+)/.exec(location.search);
      if (q) { ac(Number(q[1]), true); hakGetir(true).then(function (j) { hakYaz(j.hak); }).catch(function () { /* hak satırı isteğe bağlı */ }); }
      else listele();
    }
    function hakYaz(hak) {
      kapsam.querySelectorAll(".bd-hak-satir").forEach(function (hs) {
        hs.textContent = hakMetni(hak);
        hs.className = "bd-hak-satir" + (hak && hak.sinirsiz ? " bd-hak-sinirsiz" : "");
      });
    }

    function govde() { return kok.querySelector(".bd-sorular-govde"); }

    function listele(yon) {
      acikId = null;
      return api("/api/sorular").then(function (j) {
        hakOnbellek = { veri: j, zaman: Date.now() };
        hakYaz(j.hak);
        var l = j.sorular || [];
        if (!l.length) {
          yerlestir('<div class="bd-bos-kutu">' + (maskotTam("dusunen", 120) || BOS_CIZIM) + '<strong>Henüz soru sormadın</strong>' +
            '<span>Takıldığın bir soru mu var? Ders sayfalarında sorunun altındaki <em>Bu soruyu anlamadım</em> düğmesine bas ya da hemen buradan sor.</span>' +
            '<button type="button" class="btn-energy bd-bos-sor">' + IK.soru + 'Soru sor</button></div>', yon);
          return;
        }
        yerlestir('<ul class="bd-soru-liste">' + l.map(function (s) {
          return '<li><button type="button" class="bd-soru-oge' + (s.okunmamis ? " bd-yeni" : "") + '" data-id="' + esc(s.id) + '">' +
            '<span class="bd-soru-oge-ust">' + cip(s.durum) + (s.okunmamis ? '<span class="bd-cip bd-cip-yeni">Yeni yanıt</span>' : "") +
              '<span class="bd-soru-ders">' + esc(dersAdi(s.sayfa)) + '</span></span>' +
            '<span class="bd-soru-metin">' + esc(kisalt(s.metin, 140)) + '</span>' +
            '<span class="bd-soru-meta">' + esc(zamanOnce(s.guncelleme || s.olusturma)) + ' · ' + s.mesajSayisi + ' mesaj</span>' +
          '</button></li>';
        }).join("") + '</ul>', yon);
        govde().querySelectorAll(".bd-soru-oge").forEach(function (b) {
          b.addEventListener("click", function () { ac(Number(b.getAttribute("data-id")), false); });
        });
      }).catch(function (e) {
        govde().innerHTML = '<div class="form-alert">' + esc(e.message) + '</div>';
      });
    }

    function adresYaz(id) {
      try {
        var u = new URL(location.href);
        if (id) u.searchParams.set("soru", id); else u.searchParams.delete("soru");
        if (!kok.hasAttribute("data-tam")) u.hash = "sorularim";
        history.replaceState(history.state, "", u.pathname + u.search + u.hash);
      } catch (e) { /* yok say */ }
    }

    function ac(id, ilkAcilis) {
      acikId = id;
      // Liste yerinde kalır (yükseklik korunur) ve yalnızca soluklaşır: içerik zıplamaz
      var g = govde();
      g.setAttribute("aria-busy", "true");
      g.classList.add("bd-yukleniyor");
      return api("/api/sorular/" + encodeURIComponent(id)).then(function (j) {
        adresYaz(id);
        konusmaCiz(j.soru, ilkAcilis ? null : "ileri");
        Zil.cek();
        if (ilkAcilis && !kok.hasAttribute("data-tam")) kaydir(kok);
        else if (!ilkAcilis && kok.getBoundingClientRect().top < 0) kok.scrollIntoView({ block: "start", behavior: azHareket ? "auto" : "smooth" });
      }).catch(function (e) {
        adresYaz(null);
        acikId = null;
        return listele().then(function () {
          govde().insertAdjacentHTML("afterbegin", '<div class="form-alert u-mb-2">' + esc(e.durum === 404 ? "Bu soru bulunamadı." : e.message) + '</div>');
        });
      }).then(function () { g.removeAttribute("aria-busy"); g.classList.remove("bd-yukleniyor"); });
    }

    function konusmaCiz(s, yon) {
      var b = s.baglam && typeof s.baglam === "object" ? s.baglam : null;
      var h = '<div class="bd-konusma-bas"><button type="button" class="bd-link-btn bd-geri">← Tüm sorularım</button>' +
        '<div class="bd-konusma-ust">' + cip(s.durum) + '<span class="bd-soru-ders">' + esc(dersAdi(s.sayfa)) + '</span>' +
          (s.sayfa && /^ap-/.test(s.sayfa) ? '<a class="bd-link" href="' + esc(sayfaAdres(s.sayfa)) + (s.soruRef && s.soruRef.indexOf("|") > 0 ? "#q-card-" + encodeURIComponent(s.soruRef.split("|")[1]) : "") + '">Soruya git</a>' : "") +
        '</div></div>';
      if (b && (b.soru || b.ogrenciCevabi)) {
        h += '<details class="bd-konusma-baglam"><summary>Sorduğun soru</summary>' +
          (b.soru ? '<p>' + esc(kisalt(b.soru, 800)) + '</p>' : "") +
          (b.secenekler && b.secenekler.length ? '<ul>' + b.secenekler.map(function (x) { return '<li>' + esc(kisalt(x, 200)) + '</li>'; }).join("") + '</ul>' : "") +
          (b.ogrenciCevabi ? '<p>Senin cevabın: <strong>' + esc(b.ogrenciCevabi) + '</strong>' + (b.dogruCevap ? ' · Doğru: <strong>' + esc(b.dogruCevap) + '</strong>' : "") + '</p>' : "") +
          '</details>';
      }
      h += '<ol class="bd-mesajlar">' + (s.mesajlar || []).map(function (m) {
        var ben = m.rol === "ogrenci";
        return '<li class="bd-mesaj ' + (ben ? "bd-mesaj-ben" : "bd-mesaj-ekip") + '"><div class="bd-mesaj-kim">' + esc(ben ? "Sen" : "Meberra ekibi") +
          ' <time datetime="' + esc(m.tarih) + '">' + esc(tarihSaat(m.tarih)) + '</time></div><div class="bd-mesaj-metin">' + satirli(m.metin) + '</div></li>';
      }).join("") + '</ol>';
      if (s.durum === "bekliyor") h += '<p class="bd-bekleme"><span class="bd-yaziyor" aria-hidden="true"><i></i><i></i><i></i></span>Meberra ekibi sorunu inceliyor. Cevap gelince zilde bildirim görürsün.</p>';
      if (s.durum === "kapandi") {
        h += '<p class="bd-bekleme">Bu soru kapandı. Yeni bir sorun varsa <button type="button" class="bd-link-btn bd-yeni-soru2">yeni soru sor</button>.</p>';
      } else {
        h += '<form class="bd-takip" novalidate><div class="form-alert" role="alert" hidden></div>' +
          '<label class="bd-etiket-ust" for="bd-takip-metin">Ek soru ya da teşekkür</label>' +
          '<textarea id="bd-takip-metin" class="text-input bd-textarea" rows="3" maxlength="2000" placeholder="Yazmak istediğin bir şey var mı?"></textarea>' +
          '<div class="bd-m-dugmeler bd-takip-alt"><span class="field-hint">Ek mesajlar soru hakkından düşmez.</span><button type="submit" class="btn-primary">Gönder</button></div></form>';
      }
      yerlestir('<div class="bd-konusma">' + h + '</div>', yon);
      mathDiz(govde());
      govde().querySelector(".bd-geri").addEventListener("click", function () {
        adresYaz(null);
        listele("geri").then(function () { var x = D.querySelector("#sorularim-baslik"); if (x) x.focus({ preventScroll: true }); });
      });
      var y2 = govde().querySelector(".bd-yeni-soru2");
      if (y2) y2.addEventListener("click", function () { SoruModal.ac(null, y2); });
      var f = govde().querySelector(".bd-takip");
      if (f) f.addEventListener("submit", function (e) {
        e.preventDefault();
        var ta = f.querySelector("textarea"), a = f.querySelector(".form-alert"), btn = f.querySelector('button[type="submit"]');
        var metin = ta.value.trim();
        if (!metin) { a.hidden = false; a.textContent = "Önce mesajını yaz."; ta.focus(); return; }
        btn.disabled = true;
        api("/api/sorular/" + encodeURIComponent(s.id) + "/mesaj", "POST", { metin: metin }).then(function (j) {
          konusmaCiz(j.soru);
          duyur("Mesajın gönderildi.");
          var son = govde().querySelector(".bd-mesaj:last-child");
          if (son && !azHareket) son.classList.add("bd-giris");
        }).catch(function (err) {
          btn.disabled = false;
          a.hidden = false; a.textContent = err.durum === 409 ? (err.message || "Bu soruya yeni mesaj eklenemiyor; yeni bir soru açabilirsin.") : err.message;
        });
      });
    }

    return { kur: kur, ac: ac };
  })();

  function kaydir(el) {
    var git = function () {
      if (el.closest("[hidden]")) return;
      el.scrollIntoView({ block: "start", behavior: azHareket ? "auto" : "smooth" });
      var h = el.querySelector("h2[tabindex]");
      if (h) h.focus({ preventScroll: true });
    };
    if (D.readyState === "complete") setTimeout(git, 60); else window.addEventListener("load", function () { setTimeout(git, 60); });
  }

  /* ================================================================== 4. HAFTALIK LİG (profil.html#lig) */
  var Lig = (function () {
    var kok, veri = null, sayac = null;
    var KADEME_SINIF = ["", "bd-k-bronz", "bd-k-gumus", "bd-k-altin", "bd-k-elmas", "bd-k-sampiyon"];

    function kur(el) {
      kok = el;
      kok.innerHTML = '<div class="bd-bolum-ust"><h2 class="panel-h" id="lig-baslik" tabindex="-1">' + IK.lig + 'Haftalık lig</h2></div>' +
        '<div class="bd-lig-govde" aria-live="polite"><div class="iskelet-grup" aria-hidden="true"><span class="iskelet iskelet-satir"></span><span class="iskelet iskelet-satir is-kisa"></span><span class="iskelet iskelet-blok"></span><span class="iskelet iskelet-satir is-kisa"></span></div><p class="visually-hidden">Yükleniyor…</p></div>';
      yukle();
    }
    function govde() { return kok.querySelector(".bd-lig-govde"); }
    function yukle() {
      return api("/api/lig").then(ciz).catch(function (e) {
        govde().innerHTML = '<div class="form-alert">' + esc(e.message) + '</div>';
      });
    }

    function kalanMetin(sn) {
      sn = Math.max(0, sn | 0);
      var g = Math.floor(sn / 86400), s = Math.floor((sn % 86400) / 3600), d = Math.floor((sn % 3600) / 60);
      if (g > 0) return g + " gün " + s + " saat";
      if (s > 0) return s + " saat " + d + " dakika";
      return Math.max(1, d) + " dakika";
    }

    function kurallarHtml(k) {
      var x = (k && k.xp) || { soru: 5, dogru: 5, deneme: 50 };
      return '<ul class="bd-kurallar">' +
        '<li><strong>' + x.soru + ' XP</strong> her cevap</li>' +
        '<li><strong>+' + x.dogru + ' XP</strong> doğru cevap</li>' +
        '<li><strong>' + x.deneme + ' XP</strong> biten deneme</li></ul>';
    }

    function takmaAdForm(deger, dugme) {
      return '<form class="bd-lig-form" novalidate><div class="field"><label for="bd-takma">Takma adın</label>' +
        '<input class="text-input" id="bd-takma" maxlength="20" autocomplete="nickname" autocapitalize="off" spellcheck="false" value="' + esc(deger || "") + '" aria-describedby="bd-takma-ipucu bd-takma-hata">' +
        '<p class="field-hint" id="bd-takma-ipucu">3–20 karakter: harf, rakam ya da _. Gerçek adını kullanmana gerek yok.</p>' +
        '<p class="field-error" id="bd-takma-hata"></p></div>' +
        '<button type="submit" class="btn-primary">' + esc(dugme) + '</button></form>';
    }
    function formBagla(f) {
      if (!f) return;
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var inp = f.querySelector("input"), hata = f.querySelector(".field-error"), btn = f.querySelector('button[type="submit"]');
        var ad = inp.value.trim();
        hata.textContent = ""; inp.removeAttribute("aria-invalid");
        if (ad.length < 3 || ad.length > 20 || !/^[\p{L}\p{N}_]+$/u.test(ad)) {
          hata.textContent = "Takma ad 3–20 karakter olmalı; yalnızca harf, rakam ve _ kullanabilirsin.";
          inp.setAttribute("aria-invalid", "true"); inp.focus(); return;
        }
        btn.disabled = true;
        api("/api/lig/katil", "POST", { takmaAd: ad }).then(function (j) {
          ciz(j);
          duyur("Lige katıldın. Bol XP'li bir hafta!");
          Zil.cek();
        }).catch(function (err) {
          btn.disabled = false;
          hata.textContent = (err.veri && err.veri.errors && err.veri.errors.takmaAd) || err.message;
          inp.setAttribute("aria-invalid", "true"); inp.focus();
        });
      });
    }

    function sonucMetni(s) {
      if (!s) return "";
      if (s.sonuc === "yukseldi") return '<p class="bd-lig-sonuc bd-sonuc-yukari">' + IK.yukari + 'Geçen hafta <strong>' + esc(s.kademeAd) + '</strong> kademesine yükseldin. Harikasın!</p>';
      if (s.sonuc === "dustu") return '<p class="bd-lig-sonuc">Bu hafta <strong>' + esc(s.kademeAd) + '</strong> kademesindesin. Yeni hafta, yeni şans!</p>';
      return '<p class="bd-lig-sonuc">Geçen hafta <strong>' + esc(s.kademeAd) + '</strong> kademesinde kaldın (' + esc(s.xp) + ' XP).</p>';
    }

    function ciz(j) {
      veri = j;
      clearInterval(sayac);
      var g = govde();
      if (!j.katildi) {
        g.innerHTML =
          // 1.4.0: Tilo el sallayarak lige davet eder (katılım isteğe bağlı)
          (window.MeberraMaskot ? '<div class="mk-konus bd-lig-tilo"><div class="mk-konus__maskot">' + maskotTam("selam", 88) + '</div><div class="mk-balon"><p class="mk-balon__metin"><strong class="mk-balon__ad">' + esc(window.MeberraMaskot.MASKOT_ADI) + ':</strong> Ligde haftalık XP yarışı seni bekliyor. İstersen takma adınla katıl!</p></div></div>' : "") +
          '<p class="panel-lead">Her hafta en fazla 30 kişilik gruplarda XP topla, hafta sonunda üst kademeye çık. Katılım isteğe bağlı; diğerleri yalnızca <strong>takma adını</strong> ve XP\'ni görür.</p>' +
          '<div class="bd-lig-kademeler" aria-label="Kademeler">' + ((j.kurallar && j.kurallar.kademeler) || ["Bronz", "Gümüş", "Altın", "Elmas", "Şampiyon"]).map(function (k, i) {
            return '<span class="bd-kademe ' + KADEME_SINIF[i + 1] + '">' + IK.lig + esc(k) + '</span>';
          }).join("") + '</div>' +
          '<h3 class="panel-h u-fs-16">XP nasıl kazanılır?</h3>' + kurallarHtml(j.kurallar) +
          '<p class="field-hint">Grup en az ' + esc((j.kurallar && j.kurallar.enAzGrup) || 10) + ' kişiyse hafta sonunda ilk ' + esc((j.kurallar && j.kurallar.yukselen) || 5) + ' kişi bir üst kademeye çıkar, son ' + esc((j.kurallar && j.kurallar.dusen) || 5) + ' kişi bir alta iner. Hafta pazartesi başlar.</p>' +
          takmaAdForm(j.uye && j.uye.takmaAd, j.uye ? "Lige yeniden katıl" : "Lige katıl");
        formBagla(g.querySelector(".bd-lig-form"));
        return;
      }
      var k = j.kurallar || {}, grup = j.grup, kademe = (j.uye && j.uye.kademe) || 1;
      var h = '';
      if (j.uye && j.uye.uyari) h += '<div class="form-alert u-mb-3">' + esc(j.uye.uyari) + '</div>';
      h += '<div class="bd-lig-ozet">' +
        '<span class="bd-kademe bd-kademe-buyuk ' + KADEME_SINIF[kademe] + '">' + IK.lig + esc(j.uye.kademeAd) + '</span>' +
        '<div class="bd-lig-ozet-metin"><strong>' + esc(j.uye.takmaAd) + '</strong>' +
          '<span>Bu hafta <strong class="bd-xp">' + esc(j.benimXp || 0) + ' XP</strong></span>' +
          '<span class="bd-kalan">Haftanın bitmesine <strong>' + kalanMetin(j.kalanSn) + '</strong></span></div></div>';
      h += sonucMetni(j.sonSonuc);
      if (grup && grup.siralama && grup.siralama.length) {
        var n = grup.siralama.length, bolge = n >= (k.enAzGrup || 10);
        var enCok = Math.max.apply(null, grup.siralama.map(function (s) { return s.xp; }).concat([1]));
        h += '<h3 class="panel-h u-fs-16 u-mt-4">' + esc(grup.kademeAd) + ' ligi · Grup ' + esc(grup.no) + ' <span class="bd-uye-sayi">(' + n + ' kişi)</span></h3>';
        if (!bolge) h += '<p class="field-hint">Grubun ' + esc(k.enAzGrup || 10) + ' kişiye ulaşınca yükselme ve düşme başlar. Şimdilik XP topla!</p>';
        h += '<ol class="bd-siralama">' + grup.siralama.map(function (s) {
          var yukari = bolge && s.sira <= (k.yukselen || 5) && s.xp > 0 && grup.kademe < 5;
          var asagi = !yukari && bolge && s.sira > n - (k.dusen || 5) && grup.kademe > 1;
          var cls = "bd-sira" + (s.ben ? " bd-ben" : "") + (yukari ? " bd-bolge-yukari" : "") + (asagi ? " bd-bolge-asagi" : "");
          var etiket = yukari ? '<span class="bd-bolge-etiket bd-yukari">' + IK.yukari + 'Yükselir</span>' : asagi ? '<span class="bd-bolge-etiket bd-asagi">' + IK.asagi + 'Düşer</span>' : "";
          return '<li class="' + cls + '"' + (s.ben ? ' aria-current="true"' : "") + '>' +
            '<span class="bd-sira-no">' + s.sira + '</span>' +
            '<span class="bd-sira-ad">' + esc(s.takmaAd) + (s.ben ? ' <span class="bd-sen-etiket">Sen</span>' : "") + etiket + '</span>' +
            '<span class="bd-sira-cubuk" aria-hidden="true"><i data-w="' + Math.round(s.xp / enCok * 100) + '"></i></span>' +
            '<span class="bd-sira-xp">' + esc(s.xp) + ' XP</span></li>';
        }).join("") + '</ol>';
      }
      h += '<details class="bd-lig-kurallar u-mt-4"><summary>Kurallar</summary>' + kurallarHtml(k) +
        '<p class="field-hint">Grup en az ' + esc(k.enAzGrup || 10) + ' kişiyse ilk ' + esc(k.yukselen || 5) + ' (XP\'si 0\'dan büyük olanlar) bir üst kademeye çıkar, son ' + esc(k.dusen || 5) + ' bir alta iner. Sıralamada yalnızca takma adlar görünür.</p></details>' +
        '<details class="bd-lig-ayar"><summary>Takma adı değiştir</summary>' + takmaAdForm(j.uye.takmaAd, "Kaydet") + '</details>' +
        '<div class="bd-lig-ayril"><button type="button" class="btn-ghost btn-sm bd-ayril">Ligden ayrıl</button></div>';
      g.innerHTML = h;
      formBagla(g.querySelector(".bd-lig-form"));
      // Çubuk animasyonu
      requestAnimationFrame(function () {
        g.querySelectorAll(".bd-sira-cubuk i").forEach(function (i) { i.style.width = i.getAttribute("data-w") + "%"; });
      });
      var ayril = g.querySelector(".bd-ayril");
      ayril.addEventListener("click", function () {
        var kutu = ayril.parentNode;
        kutu.innerHTML = '<p class="field-hint">Bu haftanın grubundan çıkarsın; kademen korunur ve istediğin zaman geri dönebilirsin.</p>' +
          '<div class="btn-row"><button type="button" class="btn-ghost btn-sm btn-danger bd-ayril-evet">Evet, ayrıl</button><button type="button" class="btn-ghost btn-sm bd-ayril-hayir">Vazgeç</button></div>';
        kutu.querySelector(".bd-ayril-hayir").addEventListener("click", function () { ciz(veri); });
        kutu.querySelector(".bd-ayril-evet").focus();
        kutu.querySelector(".bd-ayril-evet").addEventListener("click", function () {
          api("/api/lig/ayril", "POST", {}).then(function (x) { ciz(x); duyur("Ligden ayrıldın."); }).catch(function (e) { kutu.insertAdjacentHTML("afterbegin", '<div class="form-alert">' + esc(e.message) + '</div>'); });
        });
      });
      var bitis = Date.now() + (j.kalanSn || 0) * 1000;
      sayac = setInterval(function () {
        var el = g.querySelector(".bd-kalan strong");
        if (!el) { clearInterval(sayac); return; }
        var kalan = Math.round((bitis - Date.now()) / 1000);
        if (kalan <= 0) { clearInterval(sayac); yukle(); return; }
        el.textContent = kalanMetin(kalan);
      }, 60000);
    }
    return { kur: kur };
  })();

  /* ================================================================== 5. BİLDİRİM AYARLARI (profil.html#bildirim-ayarlari) */
  var Ayarlar = (function () {
    var kok, ayar = null, pushDestek = false, durumEl;

    function iosMu() {
      var ua = navigator.userAgent || "";
      return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    }
    function standalone() {
      return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
    }
    function tarayiciDestekler() {
      return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && window.isSecureContext;
    }

    function anahtar(id, etiket, aciklama, deger) {
      return '<div class="bd-anahtar-satir"><div class="bd-anahtar-metin"><label for="' + id + '">' + etiket + '</label>' +
        (aciklama ? '<p class="field-hint" id="' + id + '-ac">' + aciklama + '</p>' : "") + '</div>' +
        '<span class="bd-anahtar"><input type="checkbox" role="switch" id="' + id + '"' + (deger ? " checked" : "") + (aciklama ? ' aria-describedby="' + id + '-ac"' : "") + '><span aria-hidden="true"></span></span></div>';
    }

    function kur(el) {
      kok = el;
      kok.innerHTML = '<h3 class="panel-h u-fs-16" id="bildirim-ayarlari-baslik" tabindex="-1">' + IK.zil + 'Bildirimler</h3><div class="iskelet-grup" aria-hidden="true"><span class="iskelet iskelet-satir"></span><span class="iskelet iskelet-blok"></span><span class="iskelet iskelet-blok"></span><span class="iskelet iskelet-blok is-kisa"></span></div><p class="visually-hidden">Yükleniyor…</p>';
      api("/api/bildirim-ayarlari").then(function (j) { ayar = j.ayarlar; pushDestek = !!j.pushDestek; ciz(j); })
        .catch(function (e) { kok.innerHTML = '<h3 class="panel-h u-fs-16">Bildirimler</h3><div class="form-alert">' + esc(e.message) + '</div>'; });
      D.addEventListener("meberra:yuklenebilir", yukleCiz);
    }

    function ciz(j) {
      var s = (j.sessizSaatler) || { bas: 22, bit: 8 };
      var saatler = "";
      for (var h = 8; h <= 21; h++) saatler += '<option value="' + h + '"' + (ayar.hatirlatmaSaati === h ? " selected" : "") + '>' + (h < 10 ? "0" : "") + h + ':00</option>';
      kok.innerHTML =
        '<h3 class="panel-h u-fs-16" id="bildirim-ayarlari-baslik" tabindex="-1">' + IK.zil + 'Bildirimler</h3>' +
        '<p class="panel-lead u-mb-2">' + String(s.bas).padStart(2, "0") + ':00–' + String(s.bit).padStart(2, "0") + ':00 arası hatırlatma göndermeyiz.</p>' +
        '<div class="bd-kayit-durum" role="status" aria-live="polite"></div>' +
        '<div class="bd-ayar-grup">' +
          anahtar("bd-a-hatirlatma", "Günlük çalışma hatırlatması (e-posta)", "Günde en fazla bir kez.", ayar.epostaHatirlatma) +
          '<div class="bd-anahtar-satir"><div class="bd-anahtar-metin"><label for="bd-a-saat">Hatırlatma saati</label></div>' +
            '<select class="calc-select bd-saat" id="bd-a-saat">' + saatler + '</select></div>' +
          anahtar("bd-a-yanit", "Soruma cevap gelince e-posta", "", ayar.epostaBildirim) +
        '</div>' +
        '<div class="bd-ayar-grup bd-push-kutu"><div class="bd-push-ust"><span class="bd-push-ikon">' + IK.telefon + '</span><div><strong>Telefon bildirimleri</strong><p class="bd-push-durum field-hint"></p></div></div><div class="bd-push-eylem"></div></div>' +
        '<div class="bd-ayar-grup bd-veli">' +
          anahtar("bd-a-veli", "Veli haftalık raporu", "Her pazar akşamı kısa özet: soru, doğruluk, seri, denemeler.", ayar.veliRaporu) +
          '<form class="bd-veli-form" novalidate><div class="field"><label for="bd-a-veli-eposta">Velinin e-posta adresi</label>' +
            '<div class="bd-satir"><input class="text-input" type="email" inputmode="email" autocomplete="off" id="bd-a-veli-eposta" maxlength="120" value="' + esc(ayar.veliEposta || "") + '" placeholder="veli@ornek.com" aria-describedby="bd-veli-ipucu bd-veli-hata">' +
            '<button type="submit" class="btn-ghost">Kaydet</button></div>' +
            '<p class="field-hint" id="bd-veli-ipucu">Velin onay bağlantısına tıklayınca raporlar başlar.</p>' +
            '<p class="field-error" id="bd-veli-hata"></p></div>' +
            '<p class="bd-veli-durum"></p></form>' +
        '</div>' +
        '<div class="bd-yukle" hidden></div>';
      durumEl = kok.querySelector(".bd-kayit-durum");
      bagla("bd-a-hatirlatma", "epostaHatirlatma");
      bagla("bd-a-yanit", "epostaBildirim");
      $("bd-a-saat").addEventListener("change", function (e) { kaydet({ hatirlatmaSaati: Number(e.target.value) }, function () { e.target.value = ayar.hatirlatmaSaati; }); });
      var veli = $("bd-a-veli");
      veli.addEventListener("change", function () {
        var ep = $("bd-a-veli-eposta").value.trim();
        if (veli.checked && !ep && !ayar.veliEposta) {
          veli.checked = false;
          $("bd-veli-hata").textContent = "Önce velinin e-posta adresini yaz ve Kaydet'e bas.";
          $("bd-a-veli-eposta").focus();
          return;
        }
        var deg = { veliRaporu: veli.checked };
        if (veli.checked && ep && ep !== ayar.veliEposta) deg.veliEposta = ep;
        kaydet(deg, function () { veli.checked = !!ayar.veliRaporu; });
      });
      kok.querySelector(".bd-veli-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var inp = $("bd-a-veli-eposta"), ep = inp.value.trim(), hata = $("bd-veli-hata");
        hata.textContent = ""; inp.removeAttribute("aria-invalid");
        if (ep && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ep)) { hata.textContent = "Geçerli bir e-posta adresi yaz."; inp.setAttribute("aria-invalid", "true"); inp.focus(); return; }
        var deg = { veliEposta: ep || null };
        if (ep && !ayar.veliEposta) deg.veliRaporu = true;
        if (!ep) deg.veliRaporu = false;
        kaydet(deg, null, function (err) {
          hata.textContent = (err.veri && err.veri.errors && (err.veri.errors.veliEposta || err.veri.errors.veliRaporu)) || err.message;
          inp.setAttribute("aria-invalid", "true");
        });
      });
      veliDurum();
      pushCiz();
      yukleCiz();
    }

    function veliDurum() {
      var el = kok.querySelector(".bd-veli-durum");
      if (!el) return;
      $("bd-a-veli").checked = !!ayar.veliRaporu;
      if (!ayar.veliEposta) { el.textContent = ""; el.className = "bd-veli-durum"; return; }
      if (ayar.veliDogrulandi) { el.innerHTML = IK.tik + "Velin onayladı" + (ayar.veliRaporu ? "; rapor her pazar gider." : "; rapor şu an kapalı."); el.className = "bd-veli-durum bd-ok"; }
      else { el.textContent = "Onay bekleniyor: velin, e-postasındaki bağlantıya tıklayınca raporlar başlar."; el.className = "bd-veli-durum bd-bekliyor"; }
    }

    function bagla(id, alan) {
      var el = $(id);
      el.addEventListener("change", function () {
        var d = {}; d[alan] = el.checked;
        kaydet(d, function () { el.checked = !!ayar[alan]; });
      });
    }

    function kaydet(degisiklik, geriAl, hataFn) {
      durumEl.textContent = "Kaydediliyor…";
      durumEl.className = "bd-kayit-durum";
      return api("/api/bildirim-ayarlari", "PUT", degisiklik).then(function (j) {
        ayar = j.ayarlar;
        durumEl.textContent = "Kaydedildi";
        durumEl.className = "bd-kayit-durum bd-ok";
        if ("veliEposta" in degisiklik && degisiklik.veliEposta) durumEl.textContent = "Kaydedildi. Velinin e-postasına onay bağlantısı gönderdik.";
        veliDurum();
        clearTimeout(kaydet.z);
        kaydet.z = setTimeout(function () { durumEl.textContent = ""; }, 4000);
      }).catch(function (e) {
        durumEl.textContent = e.message;
        durumEl.className = "bd-kayit-durum bd-hata";
        if (geriAl) geriAl();
        if (hataFn) hataFn(e);
      });
    }

    /* --- push --- */
    function b64Uint8(s) {
      var p = "=".repeat((4 - s.length % 4) % 4);
      var b = atob((s + p).replace(/-/g, "+").replace(/_/g, "/"));
      var a = new Uint8Array(b.length);
      for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
      return a;
    }
    function mevcutAbonelik() {
      if (!tarayiciDestekler()) return Promise.resolve(null);
      return navigator.serviceWorker.getRegistration("/").then(function (r) { return r ? r.pushManager.getSubscription() : null; }).catch(function () { return null; });
    }

    function pushCiz() {
      var kutu = kok.querySelector(".bd-push-kutu");
      var durum = kutu.querySelector(".bd-push-durum"), eylem = kutu.querySelector(".bd-push-eylem");
      kutu.classList.remove("bd-push-acik");
      var digerCihaz = ayar.pushAbonelik || 0;
      if (iosMu() && !standalone()) {
        durum.textContent = "iPhone'da telefon bildirimleri için iOS 16.4 ya da üstü gerekir.";
        eylem.innerHTML = '<ol class="bd-ios-adim"><li>Safari\'de alttaki <strong>Paylaş</strong> düğmesine dokun.</li><li><strong>Ana Ekrana Ekle</strong>\'yi seç.</li><li>Ana ekrandaki Meberra simgesinden aç ve bu sayfadan bildirimleri aç.</li></ol>';
        return;
      }
      if (!tarayiciDestekler()) {
        durum.textContent = "Telefon bildirimleri bu cihazda desteklenmiyor. E-posta hatırlatmalarını açabilirsin.";
        eylem.innerHTML = "";
        return;
      }
      if (!pushDestek) {
        durum.textContent = "Telefon bildirimleri şu an kullanılamıyor. E-posta bildirimlerini açabilirsin.";
        eylem.innerHTML = "";
        return;
      }
      if (Notification.permission === "denied") {
        durum.textContent = "Bildirim izni kapalı. Cihazının site ayarlarından Meberra'ya bildirim izni verip sayfayı yenile.";
        eylem.innerHTML = "";
        return;
      }
      mevcutAbonelik().then(function (abone) {
        if (abone && ayar.push) {
          kutu.classList.add("bd-push-acik");
          durum.innerHTML = '<span class="bd-durum-acik">' + IK.tik + 'Açık</span> Bu cihaz bildirim alıyor' + (digerCihaz > 1 ? " (toplam " + digerCihaz + " cihaz)" : "") + ".";
          eylem.innerHTML = '<button type="button" class="btn-ghost btn-sm bd-push-kapat">Bu cihazda kapat</button>';
          eylem.querySelector(".bd-push-kapat").addEventListener("click", function (e) { pushKapat(e.currentTarget, abone); });
        } else {
          durum.innerHTML = '<span class="bd-durum-kapali">Kapalı</span> Hatırlatmalar ve soru cevapları telefonuna da gelsin.' + (ayar.push && digerCihaz ? " Başka " + digerCihaz + " cihazında açık." : "");
          eylem.innerHTML = '<button type="button" class="btn-primary btn-sm bd-push-ac">' + IK.zil + 'Telefon bildirimlerini aç</button>';
          eylem.querySelector(".bd-push-ac").addEventListener("click", function (e) { pushAc(e.currentTarget); });
        }
      });
    }

    function pushHata(btn, metin) {
      btn.disabled = false;
      durumEl.textContent = metin;
      durumEl.className = "bd-kayit-durum bd-hata";
    }

    function pushAc(btn) {
      btn.disabled = true;
      // İzin isteği yalnızca bu tıklamayla
      var izin = Notification.requestPermission ? Notification.requestPermission() : Promise.resolve("denied");
      Promise.resolve(izin).then(function (p) {
        if (p !== "granted") { pushCiz(); if (p === "default") pushHata(btn, "İzin verilmedi. Hazır olduğunda yeniden deneyebilirsin."); return null; }
        return Promise.all([swKaydet(), api("/api/push/anahtar")]).then(function (r) {
          var kayit = r[0], key = r[1].publicKey;
          if (!kayit) throw new Error("Bildirim hizmeti başlatılamadı.");
          return navigator.serviceWorker.ready.then(function (reg) {
            return reg.pushManager.getSubscription().then(function (eski) {
              return eski || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64Uint8(key) });
            });
          });
        }).then(function (sub) {
          return api("/api/push/abone", "POST", { subscription: sub.toJSON() });
        }).then(function (j) {
          ayar = j.ayarlar || ayar;
          if (typeof j.abonelik === "number") ayar.pushAbonelik = j.abonelik;
          durumEl.textContent = "Telefon bildirimleri açıldı!";
          durumEl.className = "bd-kayit-durum bd-ok";
          pushCiz();
        });
      }).catch(function (e) {
        pushHata(btn, e.durum === 503 ? "Telefon bildirimleri şu an kullanılamıyor." : e.durum === 409 ? e.message : "Bildirimler açılamadı: " + (e.message || "bilinmeyen hata"));
      });
    }

    function pushKapat(btn, abone) {
      btn.disabled = true;
      var ep = abone && abone.endpoint;
      api("/api/push/iptal", "POST", ep ? { endpoint: ep } : {}).then(function (j) {
        ayar = j.ayarlar || ayar;
        return abone ? abone.unsubscribe().catch(function () { return false; }) : null;
      }).then(function () {
        durumEl.textContent = "Bu cihazda telefon bildirimleri kapandı.";
        durumEl.className = "bd-kayit-durum bd-ok";
        pushCiz();
      }).catch(function (e) { pushHata(btn, e.message); });
    }

    function yukleCiz() {
      if (!kok) return;
      var y = kok.querySelector(".bd-yukle");
      if (!y) return;
      if (!yuklemeIstegi || standalone()) { y.hidden = true; y.innerHTML = ""; return; }
      y.hidden = false;
      y.innerHTML = '<div class="bd-push-ust"><span class="bd-push-ikon">' + IK.indir + '</span><div><strong>Meberra\'yı uygulama olarak yükle</strong><p class="field-hint">Ana ekrandan tek dokunuşla aç.</p></div></div>' +
        '<button type="button" class="btn-ghost btn-sm bd-yukle-btn">' + IK.indir + 'Uygulamayı yükle</button>';
      y.querySelector(".bd-yukle-btn").addEventListener("click", function () {
        var ist = yuklemeIstegi;
        if (!ist) return;
        yuklemeIstegi = null;
        ist.prompt();
        Promise.resolve(ist.userChoice).catch(function () { return null; }).then(yukleCiz);
      });
    }

    return { kur: kur };
  })();

  /* ================================================================== başlat */
  hazir(function () {
    if (!girisli()) { sssGoster(); return; }
    navbarBekle(function (a) { Zil.kur(a); });
    soruKartlariniIzle();
    sssGoster();
    var s = $("sorularim"), l = $("lig"), b = $("bildirim-ayarlari");
    if (s) Sorularim.kur(s);
    if (l) Lig.kur(l);
    if (b) Ayarlar.kur(b);
    // #lig / #bildirim-ayarlari / #sorularim: içerik dinamik geldiği için kaydırmayı biz yaparız
    function hashGit() {
      var h = (location.hash || "").slice(1);
      var el = h === "lig" ? l : h === "sorularim" ? s : h === "bildirim-ayarlari" ? b : null;
      if (!el) return;
      if (h === "sorularim" && /[?&]soru=/.test(location.search)) return; // Sorularim.ac kendisi kaydırır
      kaydir(el);
    }
    hashGit();
    window.addEventListener("hashchange", hashGit);
  });
})();
