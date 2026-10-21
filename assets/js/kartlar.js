/**
 * Meberra 1.18.0 — Kavram kartları: /kartlar (kartlar.html). Sunucu: server/kart.js (bkz. server/API.md "Kavram kartları").
 * Akış: ders çipleri → "Bugünkü kartlar (N)" + ünite desteleri (öğrenilme çubuğu) → çalışma: kart çevir (Boşluk / dokun),
 * değerlendir (1 Tekrar · 2 Zor · 3 Biliyorum; mobilde kaydır: sola tekrar, sağa biliyorum, yukarı zor) → oturum özeti + Tilo.
 * Tekrar durumu sunucuda tutulur (SM-2-lite). Adres: /kartlar?ders=calculus · /kartlar?ders=calculus&unite=1
 */
(function () {
  "use strict";
  var view = document.getElementById("kk-view");
  var canli = document.getElementById("kk-live");
  if (!view) return;

  var RENK = { calculus: "--c-calculus", physics: "--c-physics", chemistry: "--c-chemistry", biology: "--c-biology", english: "--c-english", macro: "--c-electives", micro: "--c-electives", csa: "--c-electives" };
  var ETIKET = { tanim: "Tanım", formul: "Formül", kural: "Kural", yanilgi: "Sık yanılgı" };
  var SONUC = [
    { k: "tekrar", ad: "Tekrar", tus: "1", ipucu: "yarın" },
    { k: "zor", ad: "Zor", tus: "2", ipucu: "biraz sonra" },
    { k: "biliyorum", ad: "Biliyorum", tus: "3", ipucu: "daha sonra" }
  ];
  var S = { ozet: null, bugun: null, ders: "", oturum: null };

  // ---------------- yardımcılar ----------------
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function param(ad) { try { return new URLSearchParams(location.search).get(ad); } catch (e) { return null; } }
  function adresYaz(o) {
    try {
      var u = new URL(location.href);
      ["ders", "unite"].forEach(function (k) { if (o[k]) u.searchParams.set(k, o[k]); else u.searchParams.delete(k); });
      history.replaceState(null, "", u.pathname + u.search);
    } catch (e) { /* eski tarayıcı */ }
  }
  function duyur(m) { if (!canli) return; canli.textContent = ""; setTimeout(function () { canli.textContent = m; }, 40); }
  function api(yontem, yol, govde) {
    var o = { method: yontem, credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Meberra": "1" } };
    if (govde !== undefined) o.body = JSON.stringify(govde);
    return fetch(yol, o).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { durum: r.status, veri: j || {} }; }); },
      function () { return { durum: 0, veri: {} }; });
  }
  function hataMetni(r, v) {
    return r.durum === 0 ? "Bağlantın kopmuş görünüyor. İnternete bağlanınca yeniden dene." : r.durum === 401 ? "Kartlarını görmek için giriş yap." : (r.veri && r.veri.error) || v;
  }
  function typeset(el) {
    var mj = window.MathJax;
    if (!el || !mj) return;
    var run = function () { if (mj.typesetPromise) mj.typesetPromise([el]).catch(function () {}); };
    if (mj.startup && mj.startup.promise) mj.startup.promise.then(run).catch(function () {}); else run();
  }
  function azHareket() { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function renk(d) { return "var(" + (RENK[d] || "--accent") + ")"; }
  function premiumAdres() { var A = window.MEBERRA_ADRES; return A ? A.temiz("premium.html") : "/premium"; }
  function girisAdres() { return "/giris?donus=" + encodeURIComponent(location.pathname + location.search); }
  function ust() { try { window.scrollTo({ top: 0, behavior: "instant" }); } catch (e) { window.scrollTo(0, 0); } }
  function ikon(ad) {
    var I = {
      kilit: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
      geri: '<path d="M15 18l-6-6 6-6"/>',
      kart: '<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>',
      cevir: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
      tamam: '<path d="m5 12 5 5 9-10"/>'
    };
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[ad] || "") + "</svg>";
  }
  function dersAd(k) { var d = (S.ozet && S.ozet.dersler || []).filter(function (x) { return x.ders === k; })[0]; return d ? d.ad : k; }
  function durumKutusu(baslik, metin, giris) {
    view.innerHTML = '<div class="kk-durum" role="alert"><strong>' + esc(baslik) + "</strong><p>" + esc(metin) + '</p><div class="kk-dugmeler">' +
      '<button type="button" class="btn-primary btn-sm" id="kk-yeniden">Yeniden dene</button>' + (giris ? ' <a class="btn-ghost btn-sm" href="' + girisAdres() + '">Giriş yap</a>' : "") + "</div></div>";
    document.getElementById("kk-yeniden").addEventListener("click", anaYukle);
  }

  // ---------------- 1) ana ekran ----------------
  function iskelet() {
    var d = "";
    for (var i = 0; i < 6; i++) d += '<div class="kk-deste kk-isk"><span></span><span></span><span class="kisa"></span></div>';
    return '<p class="visually-hidden" role="status">Yükleniyor…</p><div class="kk-baslik"><h1>Kavram kartları</h1><p class="kk-alt">&nbsp;</p></div>' +
      '<div class="kk-cipler kk-isk-cip" aria-hidden="true"></div><div class="kk-bugun kk-isk" aria-hidden="true"></div><div class="kk-izgara" aria-hidden="true">' + d + "</div>";
  }
  function bugunSorgu() { return S.ders ? "?dersler=" + encodeURIComponent(S.ders) : ""; }
  function anaYukle() {
    S.oturum = null; cikisDinle(false);
    if (!S.ozet) view.innerHTML = iskelet();
    Promise.all([api("GET", "/api/kartlar"), api("GET", "/api/kartlar/bugun" + bugunSorgu())]).then(function (l) {
      var a = l[0], b = l[1];
      if (a.durum !== 200) return durumKutusu(a.durum === 401 ? "Giriş gerekli" : "Kartlar yüklenemedi", hataMetni(a, "Bir sorun oldu."), a.durum === 401);
      S.ozet = a.veri; S.bugun = b.durum === 200 ? b.veri : null;
      if (S.ders && !S.ozet.dersler.some(function (d) { return d.ders === S.ders; })) S.ders = "";
      anaCiz();
    });
  }
  function bugunYenile() {
    api("GET", "/api/kartlar/bugun" + bugunSorgu()).then(function (b) { S.bugun = b.durum === 200 ? b.veri : null; bugunCiz(); });
  }
  function gorunenDersler() {
    var l = S.ozet.dersler;
    if (S.ders) return l.filter(function (d) { return d.ders === S.ders; });
    var secili = l.filter(function (d) { return d.secili; });
    return secili.length ? secili : l;
  }
  function anaCiz() {
    adresYaz({ ders: S.ders });
    var o = S.ozet, secAd = o.dersler.some(function (d) { return !d.secili; }) ? "Derslerim" : "Tümü";
    var cip = '<button type="button" class="chip" data-ders="" aria-pressed="' + (!S.ders) + '">' + secAd + "</button>" +
      o.dersler.map(function (d) { return '<button type="button" class="chip" data-ders="' + esc(d.ders) + '" aria-pressed="' + (S.ders === d.ders) + '" style="--kk-renk:' + renk(d.ders) + '">' + esc(d.ad) + "</button>"; }).join("");
    var grup = gorunenDersler().map(function (d) {
      return '<section class="kk-ders" aria-labelledby="kk-d-' + esc(d.ders) + '"><h2 id="kk-d-' + esc(d.ders) + '" style="--kk-renk:' + renk(d.ders) + '"><span class="kk-nokta" aria-hidden="true"></span>' + esc(d.ad) + "</h2>" +
        '<div class="kk-izgara">' + d.desteler.map(function (u) { return desteKart(d, u); }).join("") + "</div></section>";
    }).join("");
    view.innerHTML = '<div class="kk-baslik"><h1>Kavram kartları</h1><p class="kk-alt">Tanımlar, teoremler, formüller ve sık yanılgılar. Her kart, hatırlamana göre doğru gün yeniden gelir.</p></div>' +
      '<div class="kk-cipler chip-group" role="group" aria-label="Ders seç">' + cip + "</div>" +
      '<div id="kk-bugun-kap"></div>' + grup +
      (o.premium ? "" : '<p class="kk-not">Ücretsiz planda her dersin ilk ' + (o.ucretsizDeste || 2) + ' destesi açık. <a href="' + premiumAdres() + '">Premium</a> ile tüm desteler açılır.</p>');
    bugunCiz();
    view.querySelectorAll(".kk-cipler .chip").forEach(function (b) {
      b.addEventListener("click", function () { S.ders = b.getAttribute("data-ders") || ""; anaCiz(); bugunYenile(); });
    });
    view.querySelectorAll("[data-deste]").forEach(function (b) {
      b.addEventListener("click", function () { desteBasla(b.getAttribute("data-ders"), b.getAttribute("data-deste")); });
    });
  }
  function desteKart(d, u) {
    var yuzde = u.kart ? Math.round(u.ogrenilen / u.kart * 100) : 0;
    var etiket = u.kilitli ? '<span class="kk-rozet is-kilit">' + ikon("kilit") + "Premium</span>" : u.vadesi ? '<span class="kk-rozet is-vade">' + u.vadesi + " tekrar</span>" : "";
    var etiketAd = "Ünite " + esc(u.unite).replace(/^(Micro|Macro) /, "");
    var ic = '<span class="kk-deste-ust"><span class="kk-unite">' + etiketAd + "</span>" + etiket + "</span>" +
      '<span class="kk-deste-ad">' + esc(u.ad) + "</span>" +
      '<span class="kk-cubuk" role="progressbar" aria-label="Öğrenilen kart" aria-valuemin="0" aria-valuemax="' + u.kart + '" aria-valuenow="' + u.ogrenilen + '"><span style="width:' + yuzde + '%"></span></span>' +
      '<span class="kk-deste-alt">' + u.ogrenilen + " / " + u.kart + " öğrenildi" + (u.gorulen && u.gorulen > u.ogrenilen ? " · " + (u.gorulen - u.ogrenilen) + " çalışılıyor" : "") + "</span>";
    if (u.kilitli) return '<a class="kk-deste is-kilitli" style="--kk-renk:' + renk(d.ders) + '" href="' + premiumAdres() + '" aria-label="' + esc(d.ad + " " + etiketAd + ": " + u.ad + " — Premium") + '">' + ic + "</a>";
    return '<button type="button" class="kk-deste" style="--kk-renk:' + renk(d.ders) + '" data-ders="' + esc(d.ders) + '" data-deste="' + esc(u.unite) + '">' + ic + "</button>";
  }
  function bugunCiz() {
    var kap = document.getElementById("kk-bugun-kap");
    if (!kap) return;
    var b = S.bugun, n = b ? b.kartlar.length : 0;
    var alt = !b ? "Bugünün listesi alınamadı." : n ? (b.vadesi ? b.vadesi + " tekrar" : "") + (b.vadesi && b.yeni ? " · " : "") + (b.yeni ? b.yeni + " yeni kart" : "") + " · yaklaşık " + Math.max(1, Math.round(n * 0.25)) + " dk"
      : "Bugünlük hepsi tamam. Yeni kartlar yarın gelir; istersen bir desteyi serbest çalış.";
    var tekrarlanan = b && b.bugunTekrar ? '<span class="kk-bugun-sayi">Bugün ' + b.bugunTekrar + " kart tekrarladın</span>" : "";
    kap.innerHTML = '<div class="kk-bugun">' +
      '<div class="kk-bugun-metin"><span class="kk-bugun-ikon" aria-hidden="true">' + ikon("kart") + "</span><div><strong>Bugünkü kartlar (" + n + ")</strong><span>" + esc(alt) + "</span>" + tekrarlanan + "</div></div>" +
      '<button type="button" class="btn-primary" id="kk-bugun-basla"' + (n ? "" : " disabled") + ">" + (n ? "Başla" : "Tamamlandı") + "</button></div>";
    var bt = document.getElementById("kk-bugun-basla");
    if (bt && n) bt.addEventListener("click", function () { oturumBasla(b.kartlar, "Bugünkü kartlar", null); });
  }
  function desteBasla(ders, unite) {
    view.setAttribute("aria-busy", "true");
    api("GET", "/api/kartlar?ders=" + encodeURIComponent(ders) + "&unite=" + encodeURIComponent(unite)).then(function (r) {
      view.removeAttribute("aria-busy");
      if (r.durum === 402) return premiumDuvar(r.veri);
      if (r.durum !== 200) return durumKutusu("Deste açılamadı", hataMetni(r, "Bir sorun oldu."), r.durum === 401);
      var v = r.veri, bugun = v.bugun;
      // vadesi gelen ve yeni kartlar önce, sonra kalanlar (en kısa aralık önce)
      var sira = v.kartlar.slice().sort(function (a, b) {
        var pa = !a.durum ? 1 : a.durum.sonraki <= bugun ? 0 : 2, pb = !b.durum ? 1 : b.durum.sonraki <= bugun ? 0 : 2;
        return pa - pb || (pa === 2 ? a.durum.aralik - b.durum.aralik : 0);
      });
      oturumBasla(sira, v.ders.ad + " · " + v.deste.ad, { ders: ders, unite: unite });
    });
  }
  function premiumDuvar(v) {
    view.innerHTML = '<div class="kk-durum kk-duvar"><div class="kk-duvar-maskot" id="kk-duvar-maskot"></div><h1>Bu deste Premium\'da</h1><p>' +
      esc((v && v.error) || "Ücretsiz planda her dersin ilk 2 destesi açık.") + '</p><div class="kk-dugmeler"><a class="btn-primary" href="' + premiumAdres() +
      '">Premium\'u incele</a> <button type="button" class="btn-ghost" id="kk-geri">Destelere dön</button></div></div>';
    var M = window.MeberraMaskot, m = document.getElementById("kk-duvar-maskot");
    if (M && m) m.innerHTML = M.html("dusunen", { boyut: 96 });
    document.getElementById("kk-geri").addEventListener("click", anaYukle);
  }

  // ---------------- 2) çalışma ----------------
  function oturumBasla(kartlar, baslik, deste) {
    if (!kartlar || !kartlar.length) return;
    S.oturum = { kartlar: kartlar, i: 0, cevrik: false, baslik: baslik, deste: deste, sayac: { tekrar: 0, zor: 0, biliyorum: 0 }, bekleyen: 0, kilit: false };
    adresYaz({ ders: deste ? deste.ders : S.ders, unite: deste ? deste.unite : "" });
    view.innerHTML = '<div class="kk-calis">' +
      '<div class="kk-calis-ust"><button type="button" class="btn-ghost btn-sm kk-cik" id="kk-cik">' + ikon("geri") + "Bitir</button>" +
      '<span class="kk-calis-baslik">' + esc(baslik) + '</span><span class="kk-sayac" id="kk-sayac" aria-live="off"></span></div>' +
      '<div class="kk-ilerleme" role="progressbar" aria-label="Oturum ilerlemesi" aria-valuemin="0" id="kk-ilerleme"><span id="kk-ilerleme-dolu"></span></div>' +
      '<div class="kk-sahne" id="kk-sahne"></div>' +
      '<div class="kk-eylem" id="kk-eylem"></div>' +
      '<p class="kk-ipucu" id="kk-ipucu"><kbd>Boşluk</kbd> çevir · <kbd>1</kbd> Tekrar · <kbd>2</kbd> Zor · <kbd>3</kbd> Biliyorum</p></div>';
    document.getElementById("kk-cik").addEventListener("click", function () { ozetCiz(true); });
    cikisDinle(true);
    ust();
    kartCiz();
  }
  function kartCiz() {
    var o = S.oturum, k = o.kartlar[o.i];
    o.cevrik = false; o.kilit = false;
    var sahne = document.getElementById("kk-sahne");
    var ilerle = document.getElementById("kk-ilerleme");
    ilerle.setAttribute("aria-valuemax", o.kartlar.length); ilerle.setAttribute("aria-valuenow", o.i);
    document.getElementById("kk-ilerleme-dolu").style.width = (o.i / o.kartlar.length * 100) + "%";
    document.getElementById("kk-sayac").textContent = (o.i + 1) + " / " + o.kartlar.length;
    var meta = '<span class="kk-etiket is-' + esc(k.etiket) + '">' + esc(ETIKET[k.etiket] || k.etiket) + "</span>" + (k.bc ? '<span class="kk-etiket is-bc">BC</span>' : "") +
      '<span class="kk-kaynak">' + esc(dersAd(k.ders)) + (k.kaynakKonu ? " · " + esc(k.kaynakKonu) : "") + "</span>";
    sahne.innerHTML = '<div class="kk-surukle" id="kk-surukle" style="--kk-renk:' + renk(k.ders) + '">' +
      '<div class="kk-kart" id="kk-kart" role="button" tabindex="0" aria-pressed="false" aria-label="Kartı çevir">' +
      '<div class="kk-ic"><div class="kk-yuz kk-on" aria-hidden="false"><div class="kk-meta">' + meta + '</div><div class="kk-metin kk-on-metin">' + esc(k.on) + '</div><span class="kk-cevir-ipucu">' + ikon("cevir") + "Çevirmek için dokun</span></div>" +
      '<div class="kk-yuz kk-arka" aria-hidden="true"><div class="kk-meta">' + meta + '</div><div class="kk-arka-on">' + esc(k.on) + '</div><div class="kk-metin kk-arka-metin">' + esc(k.arka) + "</div></div></div></div>" +
      '<span class="kk-iz is-tekrar" aria-hidden="true">Tekrar</span><span class="kk-iz is-biliyorum" aria-hidden="true">Biliyorum</span><span class="kk-iz is-zor" aria-hidden="true">Zor</span></div>';
    eylemCiz();
    typeset(sahne);
    var kart = document.getElementById("kk-kart");
    kart.addEventListener("click", function () { if (!surukleme.oldu) cevir(); });
    kart.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); cevir(); } });
    surukleBagla(document.getElementById("kk-surukle"));
    try { kart.focus({ preventScroll: true }); } catch (e) { kart.focus(); }
  }
  function eylemCiz() {
    var o = S.oturum, e = document.getElementById("kk-eylem");
    if (!o.cevrik) {
      e.innerHTML = '<button type="button" class="btn-primary kk-cevir-btn" id="kk-cevir">' + ikon("cevir") + "Cevabı göster</button>";
      document.getElementById("kk-cevir").addEventListener("click", cevir);
      return;
    }
    e.innerHTML = '<div class="kk-oylar" role="group" aria-label="Ne kadar hatırladın?">' + SONUC.map(function (s) {
      return '<button type="button" class="kk-oy is-' + s.k + '" data-sonuc="' + s.k + '"><span class="kk-oy-ad">' + s.ad + '</span><span class="kk-oy-alt"><kbd>' + s.tus + "</kbd> " + s.ipucu + "</span></button>";
    }).join("") + "</div>";
    e.querySelectorAll("[data-sonuc]").forEach(function (b) { b.addEventListener("click", function () { degerlendir(b.getAttribute("data-sonuc")); }); });
  }
  function cevir() {
    var o = S.oturum; if (!o || o.kilit) return;
    o.cevrik = !o.cevrik;
    var kart = document.getElementById("kk-kart");
    kart.classList.toggle("is-cevrik", o.cevrik);
    kart.setAttribute("aria-pressed", String(o.cevrik));
    kart.querySelector(".kk-on").setAttribute("aria-hidden", String(o.cevrik));
    kart.querySelector(".kk-arka").setAttribute("aria-hidden", String(!o.cevrik));
    kart.setAttribute("aria-label", o.cevrik ? "Kartın ön yüzüne dön" : "Kartı çevir");
    if (o.cevrik) duyur("Cevap: " + kart.querySelector(".kk-arka-metin").textContent);
    eylemCiz();
  }
  function degerlendir(sonuc) {
    var o = S.oturum; if (!o || o.kilit) return;
    if (!o.cevrik) { cevir(); return; }
    o.kilit = true;
    var k = o.kartlar[o.i];
    o.sayac[sonuc]++; o.bekleyen++;
    api("POST", "/api/kartlar/" + encodeURIComponent(k.id) + "/degerlendir", { sonuc: sonuc }).then(function (r) {
      o.bekleyen--;
      if (r.durum === 200) { o.bugunTekrar = r.veri.bugunTekrar; k.durum = r.veri.durum; }
      else if (r.durum === 402) { o.hata = "Bu kart Premium destede; kaydedilmedi."; }
      else o.hata = hataMetni(r, "Bazı değerlendirmeler kaydedilemedi.");
    });
    var sur = document.getElementById("kk-surukle");
    var yon = sonuc === "tekrar" ? "sol" : sonuc === "biliyorum" ? "sag" : "yukari";
    var son = function () { o.i++; if (o.i >= o.kartlar.length) ozetCiz(false); else kartCiz(); };
    if (azHareket() || !sur) { if (sur) sur.classList.add("is-sonuk"); setTimeout(son, azHareket() ? 120 : 0); return; }
    sur.classList.add("is-git", "is-" + yon);
    setTimeout(son, 230);
  }

  // ---- kaydırma (mobil) ----
  var surukleme = { oldu: false };
  function surukleBagla(el) {
    if (!el || !window.PointerEvent) return;
    var bas = null;
    el.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" || !S.oturum || S.oturum.kilit) return;
      bas = { x: e.clientX, y: e.clientY, id: e.pointerId }; surukleme.oldu = false;
    });
    el.addEventListener("pointermove", function (e) {
      if (!bas || e.pointerId !== bas.id) return;
      var dx = e.clientX - bas.x, dy = e.clientY - bas.y;
      if (!surukleme.oldu && Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (!S.oturum.cevrik) return; // önce çevir: ön yüzde kaydırma değerlendirmez
      surukleme.oldu = true;
      try { el.setPointerCapture(e.pointerId); } catch (x) { /* yok */ }
      el.style.transition = "none";
      el.style.transform = azHareket() ? "" : "translate(" + dx + "px," + Math.min(0, dy) + "px) rotate(" + (dx / 24) + "deg)";
      var y = yonBul(dx, dy);
      el.setAttribute("data-yon", y || "");
    });
    var birak = function (e) {
      if (!bas || (e && e.pointerId !== bas.id)) return;
      var dx = e.clientX - bas.x, dy = e.clientY - bas.y; bas = null;
      el.style.transition = ""; el.removeAttribute("data-yon");
      if (!surukleme.oldu) return;
      var y = yonBul(dx, dy);
      if (y) { el.style.transform = ""; degerlendir(y); } else el.style.transform = "";
      setTimeout(function () { surukleme.oldu = false; }, 50);
    };
    el.addEventListener("pointerup", birak);
    el.addEventListener("pointercancel", function () { bas = null; el.style.transition = ""; el.style.transform = ""; el.removeAttribute("data-yon"); surukleme.oldu = false; });
  }
  function yonBul(dx, dy) {
    var E = 80;
    if (-dy > E && -dy > Math.abs(dx)) return "zor";
    if (dx > E) return "biliyorum";
    if (dx < -E) return "tekrar";
    return null;
  }

  // ---- klavye ----
  function tus(e) {
    if (!S.oturum || S.oturum.bitti) return;
    var t = e.target && e.target.tagName;
    if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === " " || e.code === "Space") { e.preventDefault(); cevir(); return; }
    if (e.key === "Escape") { ozetCiz(true); return; }
    var i = ["1", "2", "3"].indexOf(e.key);
    if (i >= 0 && S.oturum.cevrik) { e.preventDefault(); degerlendir(SONUC[i].k); }
  }
  function cikisDinle(ac) { document.removeEventListener("keydown", tus); if (ac) document.addEventListener("keydown", tus); }

  // ---------------- 3) özet ----------------
  function ozetCiz(erken) {
    var o = S.oturum; if (!o) return anaYukle();
    o.bitti = true; cikisDinle(false);
    var c = o.sayac, n = c.tekrar + c.zor + c.biliyorum;
    if (!n) { S.oturum = null; return anaYukle(); }
    var oran = Math.round(c.biliyorum / n * 100);
    var mesaj = oran >= 80 ? "Harika hafıza! Bu kartlar artık daha seyrek gelecek." : oran >= 50 ? "İyi gidiyor. Zor kartlar kısa süre sonra yeniden gelecek." : "Tekrar etmek öğrenmenin ta kendisi. Yarın bu kartlar seni bekliyor.";
    var bar = function (k, ad) { return '<li class="is-' + k + '"><span>' + ad + '</span><strong>' + c[k] + "</strong></li>"; };
    view.innerHTML = '<div class="kk-ozet" tabindex="-1" id="kk-ozet"><div class="kk-ozet-tilo" id="kk-tilo" aria-hidden="true"></div>' +
      "<h1>" + (erken ? "Oturum kaydedildi" : "Oturum tamam!") + '</h1><p class="kk-ozet-alt">' + n + " kart tekrarladın · %" + oran + " biliyorum</p>" +
      '<ul class="kk-ozet-liste">' + bar("biliyorum", "Biliyorum") + bar("zor", "Zor") + bar("tekrar", "Tekrar") + "</ul>" +
      '<p class="kk-ozet-mesaj">' + esc(mesaj) + "</p>" + '<p class="kk-ozet-hata" id="kk-ozet-hata" role="status"></p>' +
      '<div class="kk-dugmeler"><button type="button" class="btn-primary" id="kk-ana">Destelere dön</button>' +
      (o.deste ? ' <button type="button" class="btn-ghost" id="kk-yine">Desteyi yeniden çalış</button>' : "") + "</div></div>";
    var M = window.MeberraMaskot, kap = document.getElementById("kk-tilo");
    if (M && kap) kap.innerHTML = M.html(oran >= 50 ? "kutlama" : "sevincli", { boyut: 104 });
    var K = window.MeberraKutlama;
    if (!erken && n >= 5 && oran >= 60 && K && K.kutla) K.kutla({ tur: "gorev", buyuk: false, ifade: "kutlama", baslik: n + " kart tamam!", metin: mesaj });
    var hataYaz = function () { var h = document.getElementById("kk-ozet-hata"); if (h && o.hata) h.textContent = o.hata; };
    if (o.bekleyen) setTimeout(hataYaz, 1500); else hataYaz();
    document.getElementById("kk-ana").addEventListener("click", function () { S.oturum = null; adresYaz({ ders: S.ders }); anaYukle(); });
    var yine = document.getElementById("kk-yine");
    if (yine) yine.addEventListener("click", function () { desteBasla(o.deste.ders, o.deste.unite); });
    duyur((erken ? "Oturum kaydedildi. " : "Oturum tamam. ") + n + " kart, yüzde " + oran + " biliyorum.");
    ust();
    try { document.getElementById("kk-ozet").focus({ preventScroll: true }); } catch (e) { /* yok */ }
  }

  // ---------------- başlangıç ----------------
  S.ders = param("ders") || "";
  var ilkUnite = param("unite");
  if (S.ders && ilkUnite) { anaYukleSonra(function () { desteBasla(S.ders, ilkUnite); }); } else anaYukle();
  function anaYukleSonra(fn) {
    view.innerHTML = iskelet();
    api("GET", "/api/kartlar").then(function (a) {
      if (a.durum !== 200) return durumKutusu(a.durum === 401 ? "Giriş gerekli" : "Kartlar yüklenemedi", hataMetni(a, "Bir sorun oldu."), a.durum === 401);
      S.ozet = a.veri; fn();
    });
  }
})();
