/* ==========================================================================
   MEBERRA 1.26.1 — Sınav içi hesap makinesi: Desmos'un College Board sürümü sayfanın İÇİNDE, girişsiz açılır;
   öğrenci sınav ekranından ayrılmaz (gerçek AP'de Bluebook'a yerleşik Desmos gibi). Yeni sekme / dış site yok.
   Tür sınav planından gelir (server/tohum/sinav-formatlari.json hesapMakinesi): grafik · bilimsel · 4 işlem.
   Masaüstünde sağ altta sürüklenebilir pencere, telefonda alttan açılan sayfa. Yalnız www.desmos.com (CSP frame-src).
   API (window.MeberraHM): ac(adres, baslik) · kapat() · ac/kapat geçişi: degistir(adres, baslik) · adres(url) · turAdresi(tur)
   Saf yardımcılar Node'da da çalışır: araclar/testler/hesap-makinesi-birim-test.js
   ========================================================================== */
(function (kok, kur) {
  "use strict";
  var api = kur();
  if (typeof module === "object" && module.exports) module.exports = api;
  else {
    kok.MeberraHM = api;
    // [data-hm="<desmos adresi>"] düğmeleri: aç/kapat; tüm düğmelerin aria-pressed durumu panelle eşitlenir
    if (typeof document !== "undefined") {
      document.addEventListener("click", function (e) {
        var b = e.target.closest && e.target.closest("[data-hm]");
        if (b) { e.preventDefault(); api.degistir(b.getAttribute("data-hm"), b.getAttribute("data-hm-baslik")); }
      });
      document.addEventListener("meberra:hm", function (e) {
        Array.prototype.forEach.call(document.querySelectorAll("[data-hm]"), function (b) { b.setAttribute("aria-pressed", String(!!e.detail.acik)); });
      });
    }
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /** Desmos adresi → Desmos'un College Board sınav sürümü (Bluebook'taki hesap makinesi: ifade listesi açık, giriş yok).
   *  calculator → graphing, scientific → scientific, fourfunction → fourfunction; www.desmos.com dışı ya da bilinmeyen araç → null. */
  var CB = { calculator: "graphing", graphing: "graphing", scientific: "scientific", fourfunction: "fourfunction" };
  function adres(url) {
    var m = /^https:\/\/www\.desmos\.com\/(?:testing\/collegeboard\/)?([a-z]+)\/?(?:\?[^#]*)?$/i.exec(String(url || ""));
    var t = m && CB[m[1].toLowerCase()];
    return t ? "https://www.desmos.com/testing/collegeboard/" + t : null;
  }
  /** Sınav planındaki tür metni → Desmos adresi ("bilimsel veya grafik" → grafik, daha güçlü olan) */
  function turAdresi(tur) {
    var t = String(tur || "").toLowerCase();
    if (/grafik/.test(t)) return "https://www.desmos.com/calculator";
    if (/bilimsel/.test(t)) return "https://www.desmos.com/scientific";
    if (/4|dört|işlem/.test(t)) return "https://www.desmos.com/fourfunction";
    return "https://www.desmos.com/calculator";
  }

  var panel = null, sonOdak = null;
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function acikMi() { return !!(panel && !panel.hidden); }
  function kapat() {
    if (!panel) return;
    panel.hidden = true;
    document.dispatchEvent(new CustomEvent("meberra:hm", { detail: { acik: false } }));
    if (sonOdak && sonOdak.focus) { try { sonOdak.focus(); } catch (e) { /* yok */ } }
  }
  function ac(url, baslik) {
    var src = adres(url);
    if (!src) return false;
    sonOdak = document.activeElement;
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "hm-panel"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Hesap makinesi");
      document.body.appendChild(panel);
      panel.addEventListener("click", function (e) { if (e.target.closest("[data-hm-kapat]")) kapat(); });
      // Masaüstü: başlıktan sürükle
      var surukle = null;
      panel.addEventListener("pointerdown", function (e) {
        var bas = e.target.closest(".hm-bas");
        if (!bas || e.target.closest("button") || window.matchMedia("(max-width: 640px)").matches) return;
        var r = panel.getBoundingClientRect();
        surukle = { dx: e.clientX - r.left, dy: e.clientY - r.top };
        panel.classList.add("is-surukleniyor");
        bas.setPointerCapture(e.pointerId);
      });
      panel.addEventListener("pointermove", function (e) {
        if (!surukle) return;
        var w = panel.offsetWidth, h = panel.offsetHeight;
        panel.style.left = Math.max(4, Math.min(window.innerWidth - w - 4, e.clientX - surukle.dx)) + "px";
        panel.style.top = Math.max(4, Math.min(window.innerHeight - h - 4, e.clientY - surukle.dy)) + "px";
        panel.style.right = "auto"; panel.style.bottom = "auto";
      });
      panel.addEventListener("pointerup", function () { surukle = null; panel.classList.remove("is-surukleniyor"); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && acikMi() && !e.target.closest(".hm-panel iframe")) kapat(); });
    }
    if (panel.getAttribute("data-src") !== src) {
      panel.setAttribute("data-src", src);
      panel.innerHTML = '<div class="hm-bas"><strong>🧮 ' + esc(baslik || "Hesap makinesi") + '</strong><span class="hm-not">Desmos · sınavdaki gibi</span>' +
        '<button type="button" class="hm-x" data-hm-kapat aria-label="Hesap makinesini kapat">×</button></div>' +
        '<iframe class="hm-cerceve" title="Desmos hesap makinesi" src="' + esc(src) + '" allow="clipboard-write" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    }
    panel.hidden = false;
    document.dispatchEvent(new CustomEvent("meberra:hm", { detail: { acik: true } }));
    var x = panel.querySelector(".hm-x"); if (x) x.focus();
    return true;
  }
  function degistir(url, baslik) { if (acikMi()) { kapat(); return false; } return ac(url, baslik); }

  return { adres: adres, turAdresi: turAdresi, ac: ac, kapat: kapat, degistir: degistir, acikMi: acikMi };
});
