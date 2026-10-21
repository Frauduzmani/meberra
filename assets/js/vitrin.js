/**
 * Meberra — tanıtım sayfaları (vitrin.html, fiyatlar.html)
 * 1) Ürün değerlerini (fiyat, ücretsiz sınırlar, e-posta) [data-urun] öğelerine yazar (sunucu: GET /api/public/config).
 * 2) Kaydırınca beliren bölümler ([data-rv], IntersectionObserver; yalnızca opacity/transform → yerleşim kayması yok).
 * 3) 3 adımlı AP anlatımı (#vx): ~5 sn'de bir ilerler; durdur/geç; üzerine gelince/odakta durur.
 * 4) Mini demo ([data-demo]): örnek soru sunucudan (GET /api/public/demo-soru; cevap anahtarı sayfada yok), cevap sunucuda kontrol
 *    edilir (POST /api/public/demo-soru/cevap), anında geri bildirim + konfeti.
 * prefers-reduced-motion: anlatım statik, belirme ve konfeti yok.
 */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var azHareket = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  function hareketAz() { return !!(azHareket && azHareket.matches); }

  /* ---------- 1. Ürün değerleri ---------- */
  function sayi(n) { try { return Number(n).toLocaleString("tr-TR"); } catch (e) { return String(n); } }
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
    var l = doc.querySelectorAll("[data-urun]");
    for (var i = 0; i < l.length; i++) {
      var k = l[i].getAttribute("data-urun"), v = m[k];
      if (v == null || v === "") continue;
      if (l[i].textContent !== String(v)) l[i].textContent = String(v);
      if (k === "eposta" && l[i].tagName === "A") l[i].href = "mailto:" + v;
    }
  }
  if (window.MEBERRA_URUN_AL) window.MEBERRA_URUN_AL(uygula); else uygula(window.MEBERRA_URUN);

  /* ---------- 2. Kaydırınca belirme ---------- */
  (function belirme() {
    var ogeler = doc.querySelectorAll("[data-rv]");
    if (!ogeler.length) return;
    function hepsi() { for (var i = 0; i < ogeler.length; i++) ogeler[i].classList.add("is-in"); }
    if (!("IntersectionObserver" in window) || hareketAz()) { hepsi(); return; }
    var io = new IntersectionObserver(function (girdiler) {
      girdiler.forEach(function (g) {
        if (g.isIntersecting) { g.target.classList.add("is-in"); io.unobserve(g.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    for (var i = 0; i < ogeler.length; i++) io.observe(ogeler[i]);
    // Yazdırma ya da çapa ile atlama: görünmeyen bölüm kalmasın
    window.addEventListener("beforeprint", hepsi);
  })();

  /* Yasal metinler: içindekilerde okunan bölümü vurgula */
  (function icindekiler() {
    var toc = doc.querySelector(".lg-toc");
    if (!toc || !("IntersectionObserver" in window)) return;
    var linkler = {}, bolumler = [];
    toc.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var b = doc.getElementById(a.getAttribute("href").slice(1));
      if (b) { linkler[b.id] = a; bolumler.push(b); }
    });
    var gorunen = {};
    var io = new IntersectionObserver(function (g) {
      g.forEach(function (x) { gorunen[x.target.id] = x.isIntersecting; });
      var ilk = null;
      for (var i = 0; i < bolumler.length; i++) if (gorunen[bolumler[i].id]) { ilk = bolumler[i].id; break; }
      if (!ilk) return;
      Object.keys(linkler).forEach(function (k) {
        var on = k === ilk;
        linkler[k].classList.toggle("is-active", on);
        if (on) linkler[k].setAttribute("aria-current", "location"); else linkler[k].removeAttribute("aria-current");
      });
    }, { rootMargin: "-80px 0px -55% 0px" });
    bolumler.forEach(function (b) { io.observe(b); });
  })();

  /* Hero arka planı ekran dışındayken animasyonu durdur (pil/CPU) */
  (function heroDuraklat() {
    var hero = doc.querySelector(".vt-hero");
    if (!hero || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (g) { hero.classList.toggle("is-off", !g[0].isIntersecting); }).observe(hero);
  })();

  /* ---------- 3. 3 adımlı anlatım ---------- */
  (function anlatim() {
    var kok = doc.getElementById("vx");
    if (!kok) return;
    var slaytlar = kok.querySelectorAll("[data-vx-slide]");
    var noktalar = kok.querySelectorAll("[data-vx-go]");
    var toggle = kok.querySelector("[data-vx-toggle]");
    var gec = kok.querySelector("[data-vx-skip]");
    var altyazi = kok.querySelector("[data-vx-caption]");
    var N = slaytlar.length;
    if (!N || hareketAz()) return; // statik: üç adım birlikte, kontrol yok

    var SURE = 5000;
    var ALTYAZI = [
      "1/3 · AP nedir? College Board’un üniversite seviyesindeki ders sınavı; 1–5 arası puanlanır, mayısta yapılır.",
      "2/3 · Ne işe yarar? Ülkeye göre değişir: Hollanda’da bazı üniversiteler en az 4 AP ister, Almanya’da YKS yerleştirmesi de gerekir, İtalya’da giriş sınavı belirler.",
      "3/3 · Meberra seni nasıl götürür? Seviye testi, günlük görev, deneme ve hedef puan."
    ];
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
      // ilerleme çubuğu animasyonunu yeniden başlat
      kok.classList.remove("is-tick"); void kok.offsetWidth; kok.classList.add("is-tick");
      if (altyazi) {
        altyazi.setAttribute("aria-live", duyur ? "polite" : "off");
        altyazi.textContent = ALTYAZI[aktif] || "";
      }
    }
    function durdurZamanlayici() { if (zamanlayici) { clearInterval(zamanlayici); zamanlayici = null; } }
    function baslatZamanlayici() {
      durdurZamanlayici();
      if (statik || kullaniciDurdurdu || ustunde || odakta || doc.hidden) return;
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
      kok.classList.remove("is-anim", "is-paused", "is-tick");
      kok.classList.add("is-static");
      for (var s = 0; s < N; s++) {
        slaytlar[s].classList.remove("is-active");
        slaytlar[s].removeAttribute("aria-hidden");
        if ("inert" in slaytlar[s]) slaytlar[s].inert = false;
      }
      var kontroller = kok.querySelector(".vx-bar");
      if (kontroller) kontroller.hidden = true;
      if (altyazi) { altyazi.setAttribute("aria-live", "polite"); altyazi.textContent = "Üç adım birlikte gösteriliyor."; }
      var ilk = doc.getElementById("vx-s1-h");
      if (ilk) { ilk.setAttribute("tabindex", "-1"); ilk.focus({ preventScroll: true }); }
    }

    kok.classList.add("is-anim");
    if (toggle) toggle.hidden = false;
    if (gec) gec.hidden = false;
    goster(0, false);

    for (var d = 0; d < noktalar.length; d++) {
      noktalar[d].addEventListener("click", function (e) {
        goster(parseInt(e.currentTarget.getAttribute("data-vx-go"), 10) || 0, true);
        baslatZamanlayici();
      });
    }
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
    if (toggle) toggle.addEventListener("click", function () { kullaniciDurdurdu = !kullaniciDurdurdu; guncelleDurum(); });
    if (gec) gec.addEventListener("click", statikYap);
    kok.addEventListener("mouseenter", function () { ustunde = true; guncelleDurum(); });
    kok.addEventListener("mouseleave", function () { ustunde = false; guncelleDurum(); });
    kok.addEventListener("focusin", function () { odakta = true; guncelleDurum(); });
    kok.addEventListener("focusout", function (e) { if (!kok.contains(e.relatedTarget)) { odakta = false; guncelleDurum(); } });
    doc.addEventListener("visibilitychange", guncelleDurum);
    if (azHareket && azHareket.addEventListener) azHareket.addEventListener("change", function (e) { if (e.matches && !statik) statikYap(); });
    guncelleDurum();
  })();

  /* ---------- 4. Mini demo + konfeti ---------- */
  function konfeti(x, y) {
    if (hareketAz()) return;
    var c = doc.createElement("canvas");
    c.className = "vt-confetti"; c.setAttribute("aria-hidden", "true");
    var dpr = Math.min(window.devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    doc.body.appendChild(c);
    var g = c.getContext("2d"); if (!g) { c.remove(); return; }
    g.scale(dpr, dpr);
    var renk = ["#5B3DF5", "#FF6B2C", "#8B5CF6", "#FFB020", "#22C55E", "#38BDF8"];
    var P = [];
    for (var i = 0; i < 140; i++) {
      var a = -Math.PI / 2 + (Math.random() - .5) * 2.2, h = 7 + Math.random() * 9;
      P.push({ x: x, y: y, vx: Math.cos(a) * h, vy: Math.sin(a) * h, r: Math.random() * 6.28, vr: (Math.random() - .5) * .4,
        w: 6 + Math.random() * 6, h: 4 + Math.random() * 4, c: renk[i % renk.length] });
    }
    var t0 = performance.now();
    (function kare(t) {
      var gecen = t - t0;
      g.clearRect(0, 0, W, H);
      g.globalAlpha = Math.max(0, 1 - gecen / 1800);
      P.forEach(function (p) {
        p.vy += .32; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore();
      });
      if (gecen < 1800) requestAnimationFrame(kare); else c.remove();
    })(t0);
  }

  (function demo() {
    var kok = doc.querySelector("[data-demo]");
    if (!kok) return;
    var fb = kok.querySelector("[data-demo-fb]"), sol = kok.querySelector("[data-demo-sol]");
    var govde = kok.querySelector("[data-demo-govde]"), kap = kok.querySelector("[data-demo-opts]"), cozumEl = kok.querySelector("[data-demo-cozum]");
    var secenekler = [], bekliyor = false;
    var ZOR = { easy: "Kolay", medium: "Orta", hard: "Zor" };
    function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
    function istek(yol, govdeVeri) {
      var o = { credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Meberra": "1" } };
      if (govdeVeri !== undefined) { o.method = "POST"; o.body = JSON.stringify(govdeVeri); }
      return fetch(yol, o).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { durum: r.status, veri: j || {} }; }); },
        function () { return { durum: 0, veri: {} }; });
    }
    function yukle() {
      istek("/api/public/demo-soru").then(function (r) {
        if (r.durum !== 200 || !r.veri.ok || !r.veri.soru) {
          govde.innerHTML = '<p class="vt-q-text" id="vt-q-text">Örnek soru şu an yüklenemedi.</p>';
          kap.innerHTML = '<button type="button" class="btn-ghost" data-demo-tekrar>Yeniden dene</button>';
          kap.querySelector("[data-demo-tekrar]").addEventListener("click", yukle);
          return;
        }
        var q = r.veri.soru;
        var konu = kok.querySelector("[data-demo-konu]"), zor = kok.querySelector("[data-demo-zorluk]");
        if (konu && q.konu) konu.textContent = q.konu;
        if (zor) zor.textContent = ZOR[q.difficulty] || "Örnek soru";
        govde.innerHTML = q.question;
        if (!govde.querySelector("#vt-q-text")) { var p = govde.querySelector("p"); if (p) p.id = "vt-q-text"; }
        kap.innerHTML = q.options.map(function (o) {
          return '<button type="button" class="vt-opt" data-opt="' + esc(o.id) + '" aria-pressed="false"><span class="vt-opt-k">' + esc(o.id) + "</span><span>" + o.text + "</span></button>";
        }).join("");
        secenekler = kap.querySelectorAll(".vt-opt");
        for (var i = 0; i < secenekler.length; i++) secenekler[i].addEventListener("click", sec);
      });
    }
    function sec(e) {
      if (bekliyor) return;
      var b = e.currentTarget, harf = b.getAttribute("data-opt");
      bekliyor = true;
      for (var j = 0; j < secenekler.length; j++) secenekler[j].disabled = true;
      b.setAttribute("aria-pressed", "true");
      istek("/api/public/demo-soru/cevap", { secim: harf }).then(function (r) {
        bekliyor = false;
        if (r.durum !== 200 || !r.veri.ok) {
          for (var k = 0; k < secenekler.length; k++) secenekler[k].disabled = false;
          b.setAttribute("aria-pressed", "false");
          fb.className = "vt-q-fb is-wrong";
          fb.textContent = r.durum === 429 ? (r.veri.error || "Biraz bekleyip tekrar dene.") : "Cevabın kontrol edilemedi. Bağlantını kontrol edip yeniden dene.";
          return;
        }
        var ok = !!r.veri.dogru;
        var dogru = kap.querySelector('.vt-opt[data-opt="' + r.veri.dogruSecenek + '"]');
        b.classList.add(ok ? "is-right" : "is-wrong");
        if (dogru) dogru.classList.add("is-right");
        kok.classList.add("is-done", ok ? "is-right" : "is-wrong");
        fb.className = "vt-q-fb " + (ok ? "is-right" : "is-wrong");
        var gt = document.createElement("span"); gt.innerHTML = r.veri.genelHatirlatma || "";
        var ht = document.createElement("span"); ht.innerHTML = (r.veri.hataAciklamasi && r.veri.hataAciklamasi.aciklama) || "";
        fb.textContent = ok ? (gt.textContent || "Doğru!") : "Doğru cevap " + r.veri.dogruSecenek + ". " + ht.textContent;
        cozumEl.innerHTML = r.veri.aciklama || "";
        sol.hidden = false;
        if (ok) { var rc = b.getBoundingClientRect(); konfeti(rc.left + rc.width / 2, rc.top + rc.height / 2); }
      });
    }
    function sifirla() {
      kok.classList.remove("is-done", "is-right", "is-wrong");
      for (var i = 0; i < secenekler.length; i++) {
        secenekler[i].disabled = false; secenekler[i].classList.remove("is-right", "is-wrong");
        secenekler[i].removeAttribute("aria-pressed");
      }
      fb.textContent = ""; fb.className = "vt-q-fb"; sol.hidden = true;
      if (secenekler[0]) secenekler[0].focus();
    }
    yukle();
    var reset = kok.querySelector("[data-demo-reset]");
    if (reset) reset.addEventListener("click", sifirla);
  })();
})();
