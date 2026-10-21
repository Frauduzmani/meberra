/**
 * Meberra 1.17.0 — Günün sorusu kartı (kendini yerleştirir). GET /api/gunun-sorusu · POST /api/gunun-sorusu/cevap
 * Yer: sayfada #gunun-sorusu varsa onun içine; yoksa #bg-dahafazla'nın hemen önüne kendi <section id="gunun-sorusu"> öğesini ekler
 * (Bugün). İkisi de yoksa hiçbir şey yapmaz. Oturum yoksa (401) ya da soru yoksa kart hiç görünmez.
 * Cevaptan sonra: doğru şık, çözüm (+ek), topluluk dağılımı (şık başına yüzde; tek seri, tek renk; doğru şık simge + metinle),
 * günlük seri ("Günün sorusu serin: 4"). Bağımlılıklar (isteğe bağlı): MeberraMaskot, MeberraKutlama, apSekilHtml / apEkHtml (app.js), MathJax.
 */
(function () {
  "use strict";
  var kap = null, veri = null, kilit = false;

  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function api(yontem, yol, govde) {
    var o = { method: yontem, credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Meberra": "1" } };
    if (govde !== undefined) o.body = JSON.stringify(govde);
    return fetch(yol, o).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { durum: r.status, veri: j || {} }; }); },
      function () { return { durum: 0, veri: {} }; });
  }
  function maskot(ifade) { var M = window.MeberraMaskot; return M && M.html ? M.html(ifade, { boyut: 56, etiket: false }) : ""; }
  function sekil(v, sik) { return typeof window.apSekilHtml === "function" && v ? window.apSekilHtml(v, sik) : ""; }
  function ekHtml(ek) { try { return typeof window.apEkHtml === "function" && ek ? window.apEkHtml(ek) : ""; } catch (e) { return ""; } }
  function mathjax(el) {
    if (!el || !/[$\\]/.test(el.textContent)) return;
    var mj = window.MathJax;
    if (!mj) {
      // Sayfada MathJax yoksa (Bugün) yalnız gerektiğinde yüklenir
      window.MathJax = { tex: { inlineMath: [["$", "$"], ["\\(", "\\)"]], displayMath: [["$$", "$$"], ["\\[", "\\]"]] }, svg: { fontCache: "global" },
        startup: { ready: function () { window.MathJax.startup.defaultReady(); window.MathJax.startup.promise.then(function () { mathjax(kap); }); } } };
      var s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"; s.async = true; s.id = "MathJax-script";
      document.head.appendChild(s);
      return;
    }
    var run = function () { if (mj.typesetPromise) mj.typesetPromise([el]).catch(function () {}); };
    if (mj.startup && mj.startup.promise) mj.startup.promise.then(run).catch(function () {}); else run();
  }
  function yerBul() {
    var v = document.getElementById("gunun-sorusu");
    if (v) return v;
    var df = document.getElementById("bg-dahafazla");
    if (!df || !df.parentNode) return null;
    v = document.createElement("section");
    v.id = "gunun-sorusu";
    df.parentNode.insertBefore(v, df);
    return v;
  }

  function seriMetni(n) { return n > 0 ? "Günün sorusu serin: " + n : "Seri başlat"; }
  function ciz() {
    var q = veri.soru, s = veri.sonuc, cevap = !!s;
    kap.className = "gs-kart surface" + (cevap ? " is-cevap" : "");
    kap.setAttribute("aria-labelledby", "gs-h");
    var siklar = (q.options || []).map(function (o) {
      var cls = "gs-sik";
      if (cevap) { if (o.id === s.dogruSecenek) cls += " is-dogru"; else if (o.id === s.secim) cls += " is-yanlis"; }
      return '<li><button type="button" class="' + cls + '" data-sik="' + esc(o.id) + '"' + (cevap ? " disabled" : "") + '><span class="gs-sik__harf" aria-hidden="true">' + esc(o.id) + '</span>' +
        '<span class="gs-sik__metin">' + (o.text || "") + sekil(o.sekil, true) + '</span>' +
        (cevap && o.id === s.dogruSecenek ? '<span class="gs-isaret">Doğru</span>' : cevap && o.id === s.secim ? '<span class="gs-isaret gs-isaret--sen">Senin cevabın</span>' : "") + '</button></li>';
    }).join("");
    kap.innerHTML =
      '<div class="gs-ust"><span class="gs-maskot" aria-hidden="true">' + maskot(cevap ? (s.dogru ? "kutlama" : "sevincli") : "dusunen") + '</span>' +
        '<div class="gs-baslik"><h2 id="gs-h">Günün sorusu</h2><span>' + esc(q.ders || "") + (q.topic ? " · " + esc(q.topic) : "") + '</span></div>' +
        '<span class="gs-seri' + (veri.seri > 0 ? " is-var" : "") + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5z"/></svg>' + esc(seriMetni(veri.seri)) + '</span></div>' +
      '<div class="gs-govde">' + (q.question || "") + sekil(q.sekiller) + '</div>' +
      '<ol class="gs-siklar">' + siklar + '</ol>' +
      (cevap ? sonucHtml(s) : '<p class="gs-not">Herkes bugün aynı soruyu çözüyor. Cevapladıktan sonra diğerlerinin ne seçtiğini görürsün.</p>');
    kap.querySelectorAll(".gs-sik:not([disabled])").forEach(function (b) { b.addEventListener("click", function () { cevapla(b.getAttribute("data-sik"), b); }); });
    mathjax(kap);
  }
  function sonucHtml(s) {
    var ist = s.istatistik || { toplam: 0, dogruYuzde: 0, dagilim: [] };
    var ozet = (s.dogru === true ? "Doğru! " : s.dogru === false ? "Bu sefer olmadı. Doğru şık " + esc(s.dogruSecenek) + ". " : "") +
      (ist.toplam ? "Bugün doğru bilenlerin oranı: %" + ist.dogruYuzde + "." : "");
    var enCok = ist.dagilim.reduce(function (a, x) { return Math.max(a, x.yuzde); }, 0) || 1;
    var cubuk = ist.dagilim.map(function (x) {
      var dogru = x.secim === s.dogruSecenek, sen = x.secim === s.secim;
      var etiket = x.secim + ": %" + x.yuzde + " (" + x.n + " kişi)" + (dogru ? ", doğru şık" : "") + (sen ? ", senin cevabın" : "");
      return '<li class="gs-cubuk' + (dogru ? " is-dogru" : "") + (sen ? " is-sen" : "") + '" title="' + esc(etiket) + '" tabindex="0" aria-label="' + esc(etiket) + '">' +
        '<span class="gs-cubuk__ad">' + esc(x.secim) + (dogru ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : "") + '</span>' +
        '<span class="gs-cubuk__iz"><i style="width:' + (x.n ? Math.max(2, x.yuzde / enCok * 100) : 0).toFixed(1) + '%"></i></span>' +
        '<span class="gs-cubuk__deger">%' + x.yuzde + (sen ? ' <small>sen</small>' : "") + '</span></li>';
    }).join("");
    return '<p class="gs-ozet" role="status">' + ozet + '</p>' +
      (ist.toplam ? '<figure class="gs-dagilim"><figcaption>Bugün ' + ist.toplam + ' kişi cevapladı · şık başına seçim yüzdesi</figcaption><ul>' + cubuk + '</ul></figure>' : '') +
      '<details class="gs-cozum"><summary>Çözümü gör</summary><div class="gs-cozum__ic">' +
        (s.hataAciklamasi && s.hataAciklamasi.aciklama ? '<p class="gs-hata"><b>' + esc(s.hataAciklamasi.etiket || "Neden yanlış?") + ':</b> ' + s.hataAciklamasi.aciklama + '</p>' : '') +
        '<div class="gs-aciklama">' + (s.aciklama || "") + '</div>' + (s.genelHatirlatma ? '<p class="gs-hatirlatma">' + s.genelHatirlatma + '</p>' : '') + ekHtml(s.ek) + '</div></details>';
  }
  function cevapla(secim, btn) {
    if (kilit || !veri || veri.sonuc) return;
    kilit = true;
    kap.querySelectorAll(".gs-sik").forEach(function (b) { b.disabled = true; });
    if (btn) btn.classList.add("is-secili");
    api("POST", "/api/gunun-sorusu/cevap", { soruId: veri.soru.id, secim: secim }).then(function (r) {
      kilit = false;
      if (r.durum === 409 && r.veri.yenile) return yukle();
      if (r.durum !== 200) {
        kap.querySelectorAll(".gs-sik").forEach(function (b) { b.disabled = false; });
        if (btn) btn.classList.remove("is-secili");
        var p = kap.querySelector(".gs-not"); if (p) p.textContent = (r.veri && r.veri.error) || "Cevap gönderilemedi. Yeniden dene.";
        return;
      }
      veri.seri = r.veri.seri; veri.sonuc = r.veri; veri.cevaplandi = true;
      ciz();
      var K = window.MeberraKutlama;
      if (K && K.kutla && !r.veri.tekrar) K.kutla({ tur: "gorev", ifade: r.veri.dogru ? "kutlama" : "sevincli", baslik: r.veri.dogru ? "Günün sorusu: doğru!" : "Günün sorusu tamam", metin: seriMetni(r.veri.seri) });
    });
  }
  function yukle() {
    api("GET", "/api/gunun-sorusu").then(function (r) {
      if (r.durum !== 200 || !r.veri.soru) { if (kap && kap.id === "gunun-sorusu" && !kap.children.length) kap.hidden = true; return; }
      veri = r.veri; kap.hidden = false; ciz();
    });
  }
  function basla() { kap = yerBul(); if (!kap) return; kap.hidden = true; yukle(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", basla); else basla();
  window.MeberraGununSorusu = { yenile: function () { if (kap) yukle(); } };
})();
