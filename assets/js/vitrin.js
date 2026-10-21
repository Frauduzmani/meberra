/**
 * Meberra — vitrin sayfası (vitrin.html)
 * 1) Ürün değerlerini (fiyat, ücretsiz sınırlar, e-posta) [data-urun] öğelerine yazar.
 *    Sunucu modunda (meta[name="meberra-api"]) GET /api/public/config okunur; olmazsa window.MEBERRA_URUN.
 * 2) 3 adımlı anlatım: ~4 sn'de bir ilerler, nokta düğmeleriyle atlanır, üzerine gelince/odakta durur,
 *    "Geç" ile durur ve üç adımı birlikte gösterir. prefers-reduced-motion'da hiç başlamaz (statik).
 */
(function () {
  "use strict";

  /* ---------- 1. Ürün değerleri ---------- */
  function sayi(n) {
    try { return Number(n).toLocaleString("tr-TR"); } catch (e) { return String(n); }
  }
  function uygula(u) {
    if (!u) return;
    var ucr = u.ucretsiz || {};
    var m = { eposta: u.destekEposta, marka: u.marka, unite: ucr.uniteSayisi, deneme: ucr.dersDenemesi };
    (u.planlar || []).forEach(function (p) {
      if (!p || !p.id) return;
      if (p.fiyat != null) m["fiyat:" + p.id] = sayi(p.fiyat);
      m["aciklama:" + p.id] = p.aciklama;
      m["donem:" + p.id] = p.donem;
      m["ad:" + p.id] = p.ad;
    });
    var l = document.querySelectorAll("[data-urun]");
    for (var i = 0; i < l.length; i++) {
      var k = l[i].getAttribute("data-urun"), v = m[k];
      if (v == null || v === "") continue;
      l[i].textContent = String(v);
      if (k === "eposta" && l[i].tagName === "A") l[i].href = "mailto:" + v;
    }
  }
  uygula(window.MEBERRA_URUN);
  if (document.querySelector('meta[name="meberra-api"]') && window.fetch) {
    fetch("/api/public/config", { credentials: "same-origin", headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.ok) uygula(d); })
      .catch(function () { /* yedek değerler zaten yazılı */ });
  }

  /* ---------- 2. 3 adımlı anlatım ---------- */
  var kok = document.getElementById("vx");
  if (!kok) return;
  var slaytlar = kok.querySelectorAll("[data-vx-slide]");
  var noktalar = kok.querySelectorAll("[data-vx-go]");
  var toggle = kok.querySelector("[data-vx-toggle]");
  var gec = kok.querySelector("[data-vx-skip]");
  var altyazi = kok.querySelector("[data-vx-caption]");
  var N = slaytlar.length;
  if (!N) return;

  var SURE = 4000;
  var ALTYAZI = [
    "1/3 · AP nedir? College Board’un üniversite seviyesindeki ders sınavı; 1–5 arası puanlanır, mayısta yapılır.",
    "2/3 · Ne işe yarar? Ülkeye göre değişir: Hollanda’da bazı üniversiteler AP ister, Almanya’da YKS de gerekir, İtalya’da giriş testi belirler.",
    "3/3 · Meberra seni nasıl götürür? Seviye testi, günlük görev, deneme ve hedef puan."
  ];

  var azHareket = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  if (azHareket && azHareket.matches) return; // statik: üç adım birlikte, kontrol yok

  var aktif = 0, zamanlayici = null, kullaniciDurdurdu = false, ustunde = false, odakta = false, statik = false;

  function goster(i, duyur) {
    aktif = (i + N) % N;
    for (var s = 0; s < N; s++) {
      var on = s === aktif;
      slaytlar[s].classList.toggle("is-active", on);
      slaytlar[s].setAttribute("aria-hidden", on ? "false" : "true");
      if ("inert" in slaytlar[s]) slaytlar[s].inert = !on;
      noktalar[s].setAttribute("aria-current", on ? "step" : "false");
    }
    if (altyazi) {
      // Otomatik ilerlerken ekran okuyucuyu her 4 sn'de bir bölmemek için duyuru yalnızca kullanıcı eyleminde.
      altyazi.setAttribute("aria-live", duyur ? "polite" : "off");
      altyazi.textContent = ALTYAZI[aktif] || "";
    }
  }

  function calisiyor() { return !!zamanlayici; }
  function durdurZamanlayici() { if (zamanlayici) { clearInterval(zamanlayici); zamanlayici = null; } }
  function baslatZamanlayici() {
    durdurZamanlayici();
    if (statik || kullaniciDurdurdu || ustunde || odakta || document.hidden) return;
    zamanlayici = setInterval(function () { goster(aktif + 1, false); }, SURE);
  }
  function guncelleDurum() {
    var durdu = kullaniciDurdurdu;
    kok.classList.toggle("is-paused", durdu || ustunde || odakta);
    if (toggle) {
      toggle.setAttribute("aria-pressed", durdu ? "true" : "false");
      var t = toggle.querySelector(".vx-btn-t");
      if (t) t.textContent = durdu ? "Oynat" : "Durdur";
      toggle.setAttribute("aria-label", durdu ? "Anlatımı oynat" : "Anlatımı durdur");
    }
    baslatZamanlayici();
  }

  function statikYap() {
    statik = true;
    durdurZamanlayici();
    kok.classList.remove("is-anim", "is-paused");
    kok.classList.add("is-static");
    for (var s = 0; s < N; s++) {
      slaytlar[s].classList.remove("is-active");
      slaytlar[s].removeAttribute("aria-hidden");
      if ("inert" in slaytlar[s]) slaytlar[s].inert = false;
    }
    var kontroller = kok.querySelector(".vx-bar");
    if (kontroller) kontroller.hidden = true;
    if (altyazi) { altyazi.setAttribute("aria-live", "polite"); altyazi.textContent = "Üç adım birlikte gösteriliyor."; }
    var ilk = document.getElementById("vx-s1-h");
    if (ilk) { ilk.setAttribute("tabindex", "-1"); ilk.focus({ preventScroll: true }); }
  }

  // Etkinleştir
  kok.classList.add("is-anim");
  if (toggle) toggle.hidden = false;
  if (gec) gec.hidden = false;
  goster(0, false);

  for (var d = 0; d < noktalar.length; d++) {
    noktalar[d].addEventListener("click", function (e) {
      var i = parseInt(e.currentTarget.getAttribute("data-vx-go"), 10) || 0;
      goster(i, true);
      baslatZamanlayici();
    });
  }
  // Ok tuşlarıyla adımlar arasında gezinme
  var grup = kok.querySelector(".vx-dots");
  if (grup) grup.addEventListener("keydown", function (e) {
    var k = e.key, yeni = null;
    if (k === "ArrowRight" || k === "ArrowDown") yeni = aktif + 1;
    else if (k === "ArrowLeft" || k === "ArrowUp") yeni = aktif - 1;
    else if (k === "Home") yeni = 0;
    else if (k === "End") yeni = N - 1;
    if (yeni === null) return;
    e.preventDefault();
    goster(yeni, true);
    noktalar[aktif].focus();
  });

  if (toggle) toggle.addEventListener("click", function () {
    kullaniciDurdurdu = !kullaniciDurdurdu;
    guncelleDurum();
  });
  if (gec) gec.addEventListener("click", statikYap);

  kok.addEventListener("mouseenter", function () { ustunde = true; guncelleDurum(); });
  kok.addEventListener("mouseleave", function () { ustunde = false; guncelleDurum(); });
  kok.addEventListener("focusin", function () { odakta = true; guncelleDurum(); });
  kok.addEventListener("focusout", function (e) {
    if (!kok.contains(e.relatedTarget)) { odakta = false; guncelleDurum(); }
  });
  document.addEventListener("visibilitychange", guncelleDurum);
  if (azHareket && azHareket.addEventListener) {
    azHareket.addEventListener("change", function (e) { if (e.matches && !statik) statikYap(); });
  }

  guncelleDurum();
})();
