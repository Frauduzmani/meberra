/**
 * Meberra — ortak kutlama kuyruğu (window.MeberraKutlama). Kitaplıksız, derlemesiz.
 * Bağımlılık (isteğe bağlı): assets/js/maskot.js (MeberraMaskot) — yoksa maskotsuz çizer. Stiller: assets/css/hareket.css
 *
 * API
 *   kutla({ tur, baslik, metin, ifade?, xp?, paylas?, sure?, buyuk?, gun? }) → Promise (kapatılınca çözülür)
 *       tur: "xp" | "rozet" | "hedef" | "unite" | "seri" | "deneme" | "gorev"
 *       Küçükler (xp, gorev, rozet, eşik dışı seri) → alt köşede maskot başlı balon, 2,5 sn'de kendiliğinden kapanır.
 *       Büyükler (unite, deneme, hedef, seri 7/30/100/200/365 — gun alanıyla — ya da buyuk: true) → ortada kart + konfeti,
 *       "Devam" (odak buraya gelir, kapanınca eski yerine döner) ve paylas verilmişse "Paylaş".
 *       Aynı anda tek kutlama görünür; diğerleri kuyruğa girer (en çok 5). Ardışık "gorev"ler tek balonda birleşir
 *       ("3 görev tamam!"), ardışık "xp"ler toplanır, aynı başlıklı tekrarlar atılır; taşmada en düşük öncelikli düşer
 *       (düşen kutlamanın Promise'i { dusuruldu: true } ile çözülür).
 *       [aria-modal="true"] bir pencere açıkken gösterilmez, kapanmasını bekler. Esc kapatır; odak tuzağı yoktur.
 *   paylasKarti(paylas) → Promise<HTMLCanvasElement> (1080×1920 hikâye görseli; önizleme için)
 *   paylas(paylas)      → Promise: navigator.share (dosyayla) destekleniyorsa paylaşır, yoksa PNG indirir.
 *       paylas = { baslik, alt, yuzde?, ders?, ad? } — ad verilirse yalnızca İLK ad kullanılır; başka kişisel veri yok.
 *   xpUcur(kaynakEl, hedefSecici, miktar) → Promise: "+10 XP" çipi kaynaktan sayaca uçar, sonra sayaç zıplar.
 *       Hedef yoksa hiçbir şey yapmaz; azaltılmış harekette yalnızca sayaç vurgulanır.
 *   sayiSay(el, hedef, { sure }) → Promise: yumuşak sayaç (tabular-nums, tr-TR biçimi).
 *
 * Saf çekirdek Node'da da yüklenir (module.exports): araclar/testler/kutlama-birim-test.js
 */
(function (kok) {
  "use strict";

  // =====================================================================================
  // 1. SAF ÇEKİRDEK
  // =====================================================================================
  var TURLER = ["xp", "gorev", "rozet", "seri", "hedef", "unite", "deneme"];
  var ONCELIK = { xp: 1, gorev: 2, rozet: 3, seri: 4, hedef: 4, unite: 5, deneme: 5 };
  var SERI_ESIK = [7, 30, 100, 200, 365];
  var KUYRUK_EN_COK = 5;
  var KUCUK_SURE = 2500;

  /** Ekran okuyucu metni: parçaları noktalamayı yinelemeden birleştirir. */
  function duyuruMetni(o) {
    var p = [o.baslik, o.metin, o.xp && o.tur !== "xp" ? "+" + o.xp + " XP" : ""].filter(Boolean);
    return p.map(function (x, i) { return i < p.length - 1 && !/[.!?…:]$/.test(x) ? x + "." : x; }).join(" ");
  }

  function gorevBasligi(n) { return n > 1 ? n + " görev tamam!" : "Görev tamam!"; }

  /** Girdiyi tek biçime getirir (bilinmeyen tür → "rozet"). */
  function olayNormal(o) {
    o = o || {};
    var tur = TURLER.indexOf(o.tur) >= 0 ? o.tur : "rozet";
    var n = {
      tur: tur,
      baslik: String(o.baslik == null ? "" : o.baslik).trim(),
      metin: String(o.metin == null ? "" : o.metin).trim(),
      ifade: o.ifade || null,
      xp: +o.xp > 0 ? Math.round(+o.xp) : 0,
      paylas: o.paylas && typeof o.paylas === "object" ? o.paylas : null,
      sure: +o.sure > 0 ? +o.sure : null,
      buyuk: typeof o.buyuk === "boolean" ? o.buyuk : null,
      gun: +o.gun > 0 ? Math.round(+o.gun) : null,
      adet: +o.adet > 0 ? Math.round(+o.adet) : 1,
      bekleyenler: Array.isArray(o.bekleyenler) ? o.bekleyenler.slice() : []
    };
    if (tur === "gorev" && !n.baslik) n.baslik = gorevBasligi(n.adet);
    if (tur === "xp" && !n.baslik) n.baslik = "+" + n.xp + " XP";
    return n;
  }

  function buyukMu(o) {
    if (o.buyuk === true || o.buyuk === false) return o.buyuk;
    if (o.tur === "unite" || o.tur === "deneme" || o.tur === "hedef") return true;
    if (o.tur === "seri") return SERI_ESIK.indexOf(o.gun) >= 0;
    return false;
  }

  function ifadeSec(o) {
    if (o.ifade) return o.ifade;
    return buyukMu(o) || o.tur === "rozet" ? "kutlama" : "sevincli";
  }

  /**
   * Kuyruğa ekler (girdiyi değiştirmez). Dönüş: { kuyruk, birlesti: bool, dusen: [olay] }.
   * Kurallar: gorev+gorev → tek öğe (adet toplanır, başlık "N görev tamam!"); xp+xp → xp toplanır;
   * aynı tür+başlık+metin → yeni olan atılır (bekleyenleri eskisine katılır); taşmada en düşük öncelikli,
   * eşitlikte türü kuyrukta birden çok olan, sonra en yeni olan düşer.
   */
  function kuyrugaEkle(kuyruk, olay, enCok) {
    enCok = enCok || KUYRUK_EN_COK;
    var k = (kuyruk || []).map(function (x) { return Object.assign({}, x, { bekleyenler: (x.bekleyenler || []).slice() }); });
    var o = olayNormal(olay);
    var i;
    if (o.tur === "gorev" || o.tur === "xp") {
      for (i = 0; i < k.length; i++) {
        if (k[i].tur !== o.tur) continue;
        var m = k[i];
        m.xp += o.xp;
        m.bekleyenler = m.bekleyenler.concat(o.bekleyenler);
        if (o.tur === "gorev") {
          m.adet += o.adet;
          m.baslik = gorevBasligi(m.adet);
          m.metin = o.metin && m.adet > 1 ? "Son: " + o.metin : (m.metin || o.metin);
        } else {
          m.baslik = "+" + m.xp + " XP";
          if (o.metin) m.metin = o.metin;
        }
        return { kuyruk: k, birlesti: true, dusen: [] };
      }
    }
    for (i = 0; i < k.length; i++) {
      if (k[i].tur === o.tur && k[i].baslik === o.baslik && k[i].metin === o.metin) {
        k[i].bekleyenler = k[i].bekleyenler.concat(o.bekleyenler);
        return { kuyruk: k, birlesti: true, dusen: [] };
      }
    }
    k.push(o);
    var dusen = [];
    while (k.length > enCok) {
      var sayi = {};
      k.forEach(function (x) { sayi[x.tur] = (sayi[x.tur] || 0) + 1; });
      var sec = -1;
      for (i = k.length - 1; i >= 0; i--) {
        if (sec < 0) { sec = i; continue; }
        var a = k[i], b = k[sec];
        var pa = ONCELIK[a.tur], pb = ONCELIK[b.tur];
        if (pa < pb || (pa === pb && sayi[a.tur] > 1 && sayi[b.tur] <= 1)) sec = i;
      }
      dusen.push(k.splice(sec, 1)[0]);
    }
    return { kuyruk: k, birlesti: false, dusen: dusen };
  }

  /** Kübik yavaşlayan eğri (0..1 → 0..1). */
  function yumusat(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return 1 - Math.pow(1 - t, 3); }
  /** Sayaç ara değeri: t (0..1) anındaki tam sayı. */
  function sayiAra(bas, son, t) { return Math.round(bas + (son - bas) * yumusat(t)); }

  /** Yalnızca ilk ad (en çok 20 harf), başka kişisel veri yok. */
  function ilkAd(ad) {
    var s = String(ad == null ? "" : ad).trim().split(/\s+/)[0] || "";
    s = s.replace(/[^\p{L}'-]/gu, "");
    return s.slice(0, 20);
  }

  function yaklasikOlc(metin, punto, kalin) { return String(metin).length * punto * (kalin ? 0.58 : 0.52); }

  /** Metni genişliğe göre satırlara böler (kelime sınırında; tek kelime çok uzunsa harften böler). */
  function satirla(metin, genislik, punto, olc, kalin) {
    var kelimeler = String(metin || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    var satirlar = [], cur = "";
    kelimeler.forEach(function (w) {
      var aday = cur ? cur + " " + w : w;
      if (olc(aday, punto, kalin) <= genislik) { cur = aday; return; }
      if (cur) satirlar.push(cur);
      cur = w;
      while (olc(cur, punto, kalin) > genislik && cur.length > 1) {
        var j = cur.length - 1;
        while (j > 1 && olc(cur.slice(0, j), punto, kalin) > genislik) j--;
        satirlar.push(cur.slice(0, j));
        cur = cur.slice(j);
      }
    });
    if (cur) satirlar.push(cur);
    return satirlar;
  }

  function sigdir(metin, genislik, puntolar, enCokSatir, olc, kalin) {
    for (var i = 0; i < puntolar.length; i++) {
      var s = satirla(metin, genislik, puntolar[i], olc, kalin);
      if (s.length <= enCokSatir) return { satirlar: s, punto: puntolar[i] };
    }
    var p = puntolar[puntolar.length - 1];
    var t = satirla(metin, genislik, p, olc, kalin).slice(0, enCokSatir);
    var son = t[enCokSatir - 1];
    while (son.length > 1 && olc(son + "…", p, kalin) > genislik) son = son.slice(0, -1);
    t[enCokSatir - 1] = son.replace(/\s+$/, "") + "…";
    return { satirlar: t, punto: p };
  }

  /**
   * Paylaşım kartı (1080×1920) yerleşimi — saf. olc(metin, punto, kalin) → px genişlik (tarayıcıda canvas measureText).
   * Dönüş: { G, Y, maskot: {x,y,boyut}, ders, baslik: {satirlar, punto, satirYuk, y}, alt: {...}, yuzde: {deger, metin, y}|null, ad, alanAdi: {metin, y} }
   */
  function paylasDuzeni(p, olc) {
    p = p || {};
    olc = olc || yaklasikOlc;
    var G = 1080, Y = 1920, GEN = 920, ALT_SINIR = 1690;
    var d = { G: G, Y: Y };
    var y = 0;
    d.ad = ilkAd(p.ad) || null;
    d.ders = p.ders ? String(p.ders).trim().slice(0, 40) : null;
    if (d.ders) { d.dersY = y; y += 110; }
    var b = sigdir(p.baslik || "Harika iş!", GEN, [150, 132, 116, 100, 88, 76], 3, olc, true);
    b.satirYuk = Math.round(b.punto * 1.12);
    b.y = y + b.punto;
    d.baslik = b;
    y = b.y + (b.satirlar.length - 1) * b.satirYuk + 70;
    if (p.alt) {
      var a = sigdir(p.alt, 860, [56, 50, 44], 3, olc, false);
      a.satirYuk = Math.round(a.punto * 1.35);
      a.y = y + a.punto;
      d.alt = a;
      y = a.y + (a.satirlar.length - 1) * a.satirYuk + 60;
    } else d.alt = null;
    var yz = p.yuzde == null || p.yuzde === "" ? NaN : Math.round(+p.yuzde);
    if (isFinite(yz)) {
      yz = Math.max(0, Math.min(100, yz));
      d.yuzde = { deger: yz, metin: "%" + yz, y: y + 20 };
      y += 20 + 130;
    } else d.yuzde = null;
    // Metin bloğu maskotun altından (900) başlar; taşarsa yukarı kayar ve maskot küçülür (en çok 300 px).
    var bas = 900, kaydir = Math.max(0, Math.min(300, bas + y - ALT_SINIR));
    bas -= kaydir;
    if (d.ders) d.dersY += bas;
    d.baslik.y += bas;
    if (d.alt) d.alt.y += bas;
    if (d.yuzde) d.yuzde.y += bas;
    var mb = 560 - kaydir;
    d.maskot = { x: Math.round(540 - mb / 2), y: Math.round(bas - mb - 90 + kaydir * 0.3), boyut: mb };
    d.bitis = bas + y;
    d.alanAdi = { metin: "meberra.com", y: 1840 };
    d.slogan = { metin: "AP ve üniversite hazırlığı", y: 1772 };
    return d;
  }

  var CEKIRDEK = {
    TURLER: TURLER, ONCELIK: ONCELIK, SERI_ESIK: SERI_ESIK, KUYRUK_EN_COK: KUYRUK_EN_COK, KUCUK_SURE: KUCUK_SURE,
    olayNormal: olayNormal, buyukMu: buyukMu, ifadeSec: ifadeSec, kuyrugaEkle: kuyrugaEkle, gorevBasligi: gorevBasligi, duyuruMetni: duyuruMetni,
    yumusat: yumusat, sayiAra: sayiAra, ilkAd: ilkAd, satirla: satirla, sigdir: sigdir, paylasDuzeni: paylasDuzeni, yaklasikOlc: yaklasikOlc
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = CEKIRDEK; return; }
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // =====================================================================================
  // 2. TARAYICI
  // =====================================================================================
  function azHareket() {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }
  function kacis(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function maskotHtml(ifade, o) {
    var M = window.MeberraMaskot;
    return M && M.html ? M.html(ifade, o) : "";
  }
  function sayiTR(n) { try { return Number(n).toLocaleString("tr-TR"); } catch (e) { return String(n); } }

  var kuyruk = [], aktif = null, bekleTimer = null, idSay = 0;

  // --- Ekran okuyucu duyurusu -----------------------------------------------------------
  var canli = null;
  function duyur(metin) {
    if (!document.body) return;
    if (!canli) {
      canli = document.createElement("div");
      canli.className = "kt-canli";
      canli.setAttribute("aria-live", "polite");
      canli.setAttribute("aria-atomic", "true");
      document.body.appendChild(canli);
    }
    canli.textContent = "";
    setTimeout(function () { canli.textContent = metin; }, 60);
  }

  function modalAcik() {
    var l = document.querySelectorAll('[aria-modal="true"], dialog[open]');
    for (var i = 0; i < l.length; i++) {
      var el = l[i];
      if (el.closest && el.closest(".kt-perde")) continue;
      if (el.tagName === "DIALOG") { var m = false; try { m = el.matches(":modal"); } catch (e) { m = false; } if (!m) continue; }
      if (el.hidden || !el.getClientRects().length) continue;
      return true;
    }
    return false;
  }

  function pompala() {
    if (aktif || !kuyruk.length || !document.body) return;
    if (modalAcik()) {
      if (!bekleTimer) bekleTimer = setTimeout(function () { bekleTimer = null; pompala(); }, 700);
      return;
    }
    aktif = kuyruk.shift();
    if (buyukMu(aktif)) kartGoster(aktif); else balonGoster(aktif);
  }

  function bitir(olay, sonuc) {
    olay.bekleyenler.forEach(function (f) { try { f(sonuc || { tur: olay.tur }); } catch (e) { /* yok say */ } });
    aktif = null;
    setTimeout(pompala, 200);
  }

  function xpRozet(xp) { return xp ? '<span class="kt-xp">+' + sayiTR(xp) + " XP</span>" : ""; }

  // --- Küçük balon ----------------------------------------------------------------------
  var balonKap = null;
  function balonGoster(olay) {
    if (!balonKap || !balonKap.isConnected) {
      balonKap = document.createElement("div");
      balonKap.className = "kt-balon-kap";
      document.body.appendChild(balonKap);
    }
    var el = document.createElement("div");
    el.className = "kt-balon kt-balon--" + olay.tur;
    el.innerHTML =
      '<span class="kt-balon__maskot">' + maskotHtml(ifadeSec(olay), { boyut: 46, sadeceBas: true, etiket: false }) + "</span>" +
      '<span class="kt-balon__metin"><strong>' + kacis(olay.baslik) + "</strong>" + (olay.metin ? "<span>" + kacis(olay.metin) + "</span>" : "") + "</span>" +
      xpRozet(olay.tur === "xp" ? 0 : olay.xp) +
      '<button type="button" class="kt-balon__kapat" aria-label="Kapat"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>';
    balonKap.appendChild(el);
    duyur(duyuruMetni(olay));

    var sure = olay.sure || KUCUK_SURE, kalan = sure, basla = Date.now(), t = null, kapandi = false;
    function kapat() {
      if (kapandi) return;
      kapandi = true;
      clearTimeout(t);
      var sil = function () { if (el.parentNode) el.parentNode.removeChild(el); bitir(olay); };
      if (azHareket()) return sil();
      el.classList.add("kt-cik");
      setTimeout(sil, 180);
    }
    function kur() { basla = Date.now(); t = setTimeout(kapat, kalan); }
    function dur() { clearTimeout(t); kalan = Math.max(600, kalan - (Date.now() - basla)); }
    el.addEventListener("mouseenter", dur);
    el.addEventListener("mouseleave", kur);
    el.addEventListener("focusin", dur);
    el.addEventListener("focusout", kur);
    el.querySelector(".kt-balon__kapat").addEventListener("click", kapat);
    kur();
  }

  // --- Büyük kart -----------------------------------------------------------------------
  function kartGoster(olay) {
    var id = "kt-k" + (++idSay);
    var onceki = document.activeElement;
    var perde = document.createElement("div");
    perde.className = "kt-perde";
    perde.innerHTML =
      '<canvas class="kt-konfeti" aria-hidden="true"></canvas>' +
      '<div class="kt-kart kt-kart--' + olay.tur + '" role="dialog" aria-labelledby="' + id + 'b"' + (olay.metin ? ' aria-describedby="' + id + 'm"' : "") + ">" +
      '<div class="kt-kart__maskot">' + maskotHtml(olay.ifade || "kutlama", { boyut: 150, etiket: false }) + "</div>" +
      '<h2 class="kt-kart__baslik" id="' + id + 'b">' + kacis(olay.baslik) + "</h2>" +
      (olay.metin ? '<p class="kt-kart__metin" id="' + id + 'm">' + kacis(olay.metin) + "</p>" : "") +
      xpRozet(olay.xp) +
      '<div class="kt-kart__eylem">' +
      (olay.paylas ? '<button type="button" class="kt-dugme kt-dugme--ikincil" data-kt="paylas"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Paylaş</button>' : "") +
      '<button type="button" class="kt-dugme kt-dugme--ana" data-kt="devam">Devam</button>' +
      "</div></div>";
    document.body.appendChild(perde);
    duyur(duyuruMetni(olay));

    var devam = perde.querySelector('[data-kt="devam"]');
    var pBtn = perde.querySelector('[data-kt="paylas"]');
    var kapandi = false, oto = null;
    function kapat() {
      if (kapandi) return;
      kapandi = true;
      clearTimeout(oto);
      document.removeEventListener("keydown", tus, true);
      var sil = function () {
        if (perde.parentNode) perde.parentNode.removeChild(perde);
        if (onceki && onceki.isConnected && typeof onceki.focus === "function") { try { onceki.focus({ preventScroll: true }); } catch (e) { /* yok say */ } }
        bitir(olay);
      };
      if (azHareket()) return sil();
      perde.classList.add("kt-cik");
      setTimeout(sil, 200);
    }
    function tus(e) { if (e.key === "Escape" || e.key === "Esc") { e.stopPropagation(); kapat(); } }
    document.addEventListener("keydown", tus, true);
    devam.addEventListener("click", kapat);
    perde.addEventListener("click", function (e) { if (e.target === perde) kapat(); });
    if (pBtn) pBtn.addEventListener("click", function () {
      pBtn.disabled = true;
      paylas(olay.paylas).then(function () { pBtn.disabled = false; }, function () { pBtn.disabled = false; });
    });
    try { devam.focus({ preventScroll: true }); } catch (e) { devam.focus(); }
    konfeti(perde.querySelector(".kt-konfeti"));
    if (olay.sure) oto = setTimeout(kapat, olay.sure);
  }

  /** Hafif konfeti: canvas, ≤1,2 sn, ≤120 parçacık. Azaltılmış harekette çizilmez. */
  function konfeti(c) {
    if (!c || azHareket() || !window.requestAnimationFrame) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = window.innerWidth, H = window.innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    var x = c.getContext("2d");
    if (!x) return;
    x.scale(dpr, dpr);
    var renk = ["#5B3DF5", "#FF6B2C", "#FFC53D", "#9C88FF", "#2BC48A", "#FF8FB1"];
    var n = Math.min(120, Math.round(W / 9));
    var p = [];
    for (var i = 0; i < n; i++) {
      var sol = i % 2 === 0;
      p.push({
        x: sol ? W * 0.18 : W * 0.82, y: H * 0.42,
        vx: (sol ? 1 : -1) * (2 + Math.random() * 7) + (Math.random() - 0.5) * 3,
        vy: -6 - Math.random() * 9, g: 0.32 + Math.random() * 0.12,
        w: 6 + Math.random() * 6, h: 4 + Math.random() * 4, a: Math.random() * 6.28, va: (Math.random() - 0.5) * 0.4,
        r: renk[i % renk.length]
      });
    }
    var bas = performance.now(), SURE = 1150;
    function kare(t) {
      var g = t - bas;
      x.clearRect(0, 0, W, H);
      var opak = g > SURE - 300 ? Math.max(0, (SURE - g) / 300) : 1;
      x.globalAlpha = opak;
      p.forEach(function (q) {
        q.vy += q.g; q.vx *= 0.985; q.x += q.vx; q.y += q.vy; q.a += q.va;
        x.save(); x.translate(q.x, q.y); x.rotate(q.a); x.fillStyle = q.r;
        x.fillRect(-q.w / 2, -q.h / 2, q.w, q.h * Math.abs(Math.cos(q.a * 1.7)) + 1); x.restore();
      });
      if (g < SURE && c.isConnected) requestAnimationFrame(kare);
      else x.clearRect(0, 0, W, H);
    }
    requestAnimationFrame(kare);
  }

  // --- Paylaşım kartı -------------------------------------------------------------------
  function svgResim(svg) {
    return new Promise(function (coz) {
      if (!svg) return coz(null);
      var img = new Image(), url = null;
      try { url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); } catch (e) { return coz(null); }
      img.onload = function () { coz(img); setTimeout(function () { URL.revokeObjectURL(url); }, 1000); };
      img.onerror = function () { URL.revokeObjectURL(url); coz(null); };
      img.src = url;
    });
  }
  function yuvarlakDik(x, X, Y, G, Yk, r) {
    x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + G, Y, X + G, Y + Yk, r); x.arcTo(X + G, Y + Yk, X, Y + Yk, r);
    x.arcTo(X, Y + Yk, X, Y, r); x.arcTo(X, Y, X + G, Y, r); x.closePath();
  }

  function paylasKarti(p) {
    p = p || {};
    var c = document.createElement("canvas");
    c.width = 1080; c.height = 1920;
    var x = c.getContext("2d");
    var BAS_FONT = '"Nunito", "DM Sans", system-ui, sans-serif', MET_FONT = '"DM Sans", system-ui, sans-serif';
    var yaziHazir = document.fonts && document.fonts.load ?
      Promise.all([document.fonts.load('900 120px "Nunito"'), document.fonts.load('500 50px "DM Sans"')]).catch(function () {}) : Promise.resolve();
    return yaziHazir.then(function () {
      return svgResim(maskotHtml("kutlama", { boyut: 560, animasyon: false }));
    }).then(function (img) {
      var olc = function (m, punto, kalin) { x.font = (kalin ? "900 " : "500 ") + punto + "px " + (kalin ? BAS_FONT : MET_FONT); return x.measureText(m).width; };
      var d = paylasDuzeni(p, olc);
      // Zemin: marka geçişi + sıcak turuncu parıltı
      var g = x.createLinearGradient(0, 0, 1080, 1920);
      g.addColorStop(0, "#5B3DF5"); g.addColorStop(0.6, "#7C4DF0"); g.addColorStop(1, "#3B21AE");
      x.fillStyle = g; x.fillRect(0, 0, 1080, 1920);
      var mY = d.maskot.y + d.maskot.boyut / 2, mR = d.maskot.boyut / 560;
      var rg = x.createRadialGradient(540, mY + 20, 40, 540, mY + 20, 520 * mR);
      rg.addColorStop(0, "rgba(255,197,61,.45)"); rg.addColorStop(0.55, "rgba(255,107,44,.18)"); rg.addColorStop(1, "rgba(255,107,44,0)");
      x.fillStyle = rg; x.fillRect(0, 0, 1080, 1200);
      // Süs: yumuşak daireler + konfeti
      x.fillStyle = "rgba(255,255,255,.06)";
      [[120, 180, 140], [980, 320, 180], [80, 1500, 200], [1010, 1700, 160]].forEach(function (k) { x.beginPath(); x.arc(k[0], k[1], k[2], 0, 6.283); x.fill(); });
      var kr = ["#FFC53D", "#FF6B2C", "#9C88FF", "#FFFFFF", "#2BC48A"];
      for (var i = 0; i < 26; i++) {
        var a = (i * 137.5) % 360, rr = (330 + (i * 53) % 160) * mR;
        var kx = 540 + Math.cos(a * Math.PI / 180) * rr, ky = mY + Math.sin(a * Math.PI / 180) * rr * 0.8;
        if (ky < 190) continue; // üst etiketle çakışmasın
        x.save(); x.translate(kx, ky); x.rotate(a); x.fillStyle = kr[i % kr.length]; x.globalAlpha = 0.85;
        x.fillRect(-11, -6, 22, 12); x.restore();
      }
      x.globalAlpha = 1;
      if (img) x.drawImage(img, d.maskot.x, d.maskot.y, d.maskot.boyut, d.maskot.boyut);
      x.textAlign = "center"; x.textBaseline = "alphabetic";
      // Üst etiket: ad (yalnızca ilk ad) ya da marka
      x.font = "800 44px " + BAS_FONT; x.fillStyle = "rgba(255,255,255,.92)";
      x.fillText(d.ad ? d.ad + " · Meberra" : "Meberra", 540, 140);
      if (d.ders) {
        x.font = "800 46px " + BAS_FONT;
        var dg = x.measureText(d.ders).width + 72;
        x.fillStyle = "rgba(255,255,255,.16)"; yuvarlakDik(x, 540 - dg / 2, d.dersY - 4, dg, 78, 39); x.fill();
        x.fillStyle = "#FFFFFF"; x.fillText(d.ders, 540, d.dersY + 52);
      }
      x.fillStyle = "#FFFFFF"; x.font = "900 " + d.baslik.punto + "px " + BAS_FONT;
      x.shadowColor = "rgba(26,16,51,.35)"; x.shadowBlur = 24; x.shadowOffsetY = 6;
      d.baslik.satirlar.forEach(function (s, j) { x.fillText(s, 540, d.baslik.y + j * d.baslik.satirYuk); });
      x.shadowColor = "transparent"; x.shadowBlur = 0; x.shadowOffsetY = 0;
      if (d.alt) {
        x.font = "500 " + d.alt.punto + "px " + MET_FONT; x.fillStyle = "rgba(255,255,255,.9)";
        d.alt.satirlar.forEach(function (s, j) { x.fillText(s, 540, d.alt.y + j * d.alt.satirYuk); });
      }
      if (d.yuzde) {
        var Y0 = d.yuzde.y, G0 = 760, X0 = 160;
        x.fillStyle = "rgba(255,255,255,.2)"; yuvarlakDik(x, X0, Y0, G0, 40, 20); x.fill();
        if (d.yuzde.deger > 0) {
          var dl = x.createLinearGradient(X0, 0, X0 + G0, 0); dl.addColorStop(0, "#FFC53D"); dl.addColorStop(1, "#FF6B2C");
          x.fillStyle = dl; yuvarlakDik(x, X0, Y0, Math.max(40, G0 * d.yuzde.deger / 100), 40, 20); x.fill();
        }
        x.font = "900 54px " + BAS_FONT; x.fillStyle = "#FFFFFF"; x.fillText(d.yuzde.metin + " tamamlandı", 540, Y0 + 116);
      }
      x.font = "900 58px " + BAS_FONT; x.fillStyle = "#FFFFFF"; x.fillText(d.alanAdi.metin, 540, d.alanAdi.y);
      x.font = "500 36px " + MET_FONT; x.fillStyle = "rgba(255,255,255,.75)"; x.fillText(d.slogan.metin, 540, d.slogan.y);
      return c;
    });
  }

  function paylas(p) {
    return paylasKarti(p).then(function (c) {
      return new Promise(function (coz) { c.toBlob(function (b) { coz(b); }, "image/png"); });
    }).then(function (blob) {
      if (!blob) throw new Error("görsel üretilemedi");
      var ad = "meberra-basari.png";
      var dosya = null;
      try { dosya = new File([blob], ad, { type: "image/png" }); } catch (e) { dosya = null; }
      if (dosya && navigator.canShare && navigator.share && navigator.canShare({ files: [dosya] })) {
        return navigator.share({ files: [dosya], title: (p && p.baslik) || "Meberra", text: ((p && p.baslik) || "Meberra") + " · meberra.com" })
          .then(function () { return "paylasildi"; }, function (e) { return e && e.name === "AbortError" ? "vazgecildi" : indir(blob, ad); });
      }
      return indir(blob, ad);
    });
  }
  function indir(blob, ad) {
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = ad; a.rel = "noopener"; a.style.display = "none";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 1500);
    return "indirildi";
  }

  // --- XP uçuşu ve sayaç ----------------------------------------------------------------
  function zipla(el) {
    if (!el || !el.classList) return;
    el.classList.remove("h-zipla");
    void el.offsetWidth;
    el.classList.add("h-zipla");
    setTimeout(function () { el.classList.remove("h-zipla"); }, 700);
  }

  function xpUcur(kaynakEl, hedefSecici, miktar) {
    var hedef = typeof hedefSecici === "string" ? document.querySelector(hedefSecici) : hedefSecici;
    if (!hedef) return Promise.resolve(false);
    if (azHareket() || !kaynakEl || !kaynakEl.getBoundingClientRect || !document.body.animate) { zipla(hedef); return Promise.resolve(true); }
    var a = kaynakEl.getBoundingClientRect(), b = hedef.getBoundingClientRect();
    var cip = document.createElement("span");
    cip.className = "kt-xp kt-xp-ucan";
    cip.setAttribute("aria-hidden", "true");
    cip.textContent = "+" + sayiTR(+miktar || 0) + " XP";
    document.body.appendChild(cip);
    var cg = cip.offsetWidth, cy = cip.offsetHeight;
    var x0 = a.left + a.width / 2 - cg / 2, y0 = a.top + a.height / 2 - cy / 2;
    var x1 = b.left + b.width / 2 - cg / 2, y1 = b.top + b.height / 2 - cy / 2;
    cip.style.left = x0 + "px"; cip.style.top = y0 + "px";
    var dx = x1 - x0, dy = y1 - y0, tepe = Math.min(dy, 0) - 60;
    return new Promise(function (coz) {
      var an = cip.animate([
        { transform: "translate(0,0) scale(.6)", opacity: 0 },
        { transform: "translate(0,-18px) scale(1.1)", opacity: 1, offset: 0.18 },
        { transform: "translate(" + dx * 0.5 + "px," + tepe + "px) scale(1)", opacity: 1, offset: 0.55 },
        { transform: "translate(" + dx + "px," + dy + "px) scale(.55)", opacity: 0.2 }
      ], { duration: 820, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
      var son = function () { if (cip.parentNode) cip.parentNode.removeChild(cip); zipla(hedef); coz(true); };
      an.onfinish = son; an.oncancel = son;
    });
  }

  function sayiSay(el, hedef, o) {
    if (!el) return Promise.resolve();
    o = o || {};
    hedef = Math.round(+hedef || 0);
    var bas = parseInt(String(el.textContent || "").replace(/[^\d-]/g, ""), 10);
    if (!isFinite(bas)) bas = 0;
    el.style.fontVariantNumeric = "tabular-nums";
    var sure = +o.sure > 0 ? +o.sure : 900;
    if (azHareket() || bas === hedef || !window.requestAnimationFrame) { el.textContent = sayiTR(hedef); return Promise.resolve(); }
    return new Promise(function (coz) {
      var t0 = performance.now();
      function kare(t) {
        var k = (t - t0) / sure;
        el.textContent = sayiTR(sayiAra(bas, hedef, k));
        if (k < 1) requestAnimationFrame(kare); else { el.textContent = sayiTR(hedef); coz(); }
      }
      requestAnimationFrame(kare);
    });
  }

  // --- Genel API ------------------------------------------------------------------------
  function kutla(o) {
    return new Promise(function (coz) {
      var olay = Object.assign({}, o || {}, { bekleyenler: [coz] });
      var r = kuyrugaEkle(kuyruk, olay, KUYRUK_EN_COK);
      kuyruk = r.kuyruk;
      r.dusen.forEach(function (d) { d.bekleyenler.forEach(function (f) { try { f({ tur: d.tur, dusuruldu: true }); } catch (e) { /* yok say */ } }); });
      if (document.body) pompala();
      else document.addEventListener("DOMContentLoaded", pompala, { once: true });
    });
  }

  var API = Object.assign({}, CEKIRDEK, {
    kutla: kutla, paylas: paylas, paylasKarti: paylasKarti, xpUcur: xpUcur, sayiSay: sayiSay,
    /** Kuyrukta bekleyen sayısı (gösterilen hariç) */
    bekleyen: function () { return kuyruk.length; },
    /** Görünür bir kutlama var mı */
    gosteriliyor: function () { return !!aktif; }
  });
  kok.MeberraKutlama = API;
})(typeof window !== "undefined" ? window : this);
