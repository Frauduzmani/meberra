/**
 * Meberra 1.22.0 — Hedef sihirbazı arayüzü (/ulkem). Motor: assets/js/hedef-motor.js · Stil: assets/css/hedef.css
 * Adım 1 ülke (çoklu, en çok 5) → adım 2 okul (isteğe bağlı) → adım 3 şart tablosu + ortak yol → "Bu planı uygula".
 * Adres: /ulkem?u=it,de&o=<uniId>&s=11&a=muhendislik&adim=3. Adreste dil= varsa (eski tam seçim) sihirbaz çekilir,
 * sartlar.html'deki ülke ayrıntısı çalışır (window.MeberraHedefSihirbaz.aktif === false).
 * Gerekenler (önce yüklenir): ulke-dizini.js, sinavlar.js, eposta.js, ap-hedef.js, hedef-motor.js, sartlar-ui.js, app.js (APMEBERRA_ME), auth.js.
 */
(function () {
  "use strict";
  var aktif = !/[?&]dil=/.test(location.search);
  window.MeberraHedefSihirbaz = { aktif: aktif };
  var H = window.MeberraHedef, UI = window.APMEBERRA_SARTLAR_UI, AP = window.APMEBERRA_AP_HEDEF;
  var kok = document.getElementById("hd-sihirbaz");
  if (!aktif || !kok || !H || !UI) { if (kok) kok.hidden = true; window.MeberraHedefSihirbaz.aktif = false; return; }
  document.body.classList.add("is-sihirbaz");
  kok.hidden = false;

  var ME = window.APMEBERRA_ME, PROF = ME && ME.user && ME.profile ? ME.profile : null;
  var DIZIN = (window.APMEBERRA_ULKE_DIZINI && window.APMEBERRA_ULKE_DIZINI.ulkeler) || [];
  var DK = {}; DIZIN.forEach(function (k) { DK[k.kod] = k; });
  var SINAV = {}; (Array.isArray(window.APMEBERRA_SINAVLAR) ? window.APMEBERRA_SINAVLAR : []).forEach(function (s) { SINAV[s.id] = s; });
  var esc = UI.esc;
  var azHareket = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MASKOT = function (ifade) { return '<img class="hz-korkut" src="/assets/img/maskot/korkut-' + ifade + '.svg" alt="" width="56" height="56">'; };
  var SAYILAR = { 1: 0, 2: 10, 3: 30 };

  function bugun() {
    var o = window.APMEBERRA_BUGUN;
    if (typeof o === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o)) return o;
    var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  // ---------------- Durum ----------------
  var q = location.search, secim = H.secimCoz(q), adim = 1;
  var adimQ = /[?&]adim=([123])/.exec(q);
  if (secim.ulkeler.length) adim = adimQ ? +adimQ[1] : 3;
  else if (H.profildenSecim(PROF)) { secim = H.profildenSecim(PROF); adim = 3; }
  if (!secim.ulkeler.length) adim = 1;
  var veri = {}, arama = "", kutlandi = false, sonArama = location.search;

  function adresYaz(push) {
    var a = H.secimAdres(secim);
    var url = "/ulkem" + (a ? a + "&" : "?") + "adim=" + adim;
    try { history[push ? "pushState" : "replaceState"](null, "", url); } catch (e) { /* file:// */ }
    sonArama = location.search;
  }
  function yukle() {
    return Promise.all(secim.ulkeler.map(function (cc) {
      return UI.veriYukle(cc, DK[cc]).then(function (r) { if (r.veri) veri[cc] = r.veri; });
    }));
  }

  // ---------------- Parçalar ----------------
  function kabuk(o) {
    var prog = [1, 2, 3].map(function (n) { return '<i class="' + (n < adim ? "on" : n === adim ? "now" : "") + '"></i>'; }).join("");
    return '<div class="hz-kart' + (o.kutlama ? " is-kutlama" : "") + '" id="hd-adim-' + adim + '">' +
      (o.kutlama && !azHareket ? '<div class="hz-konfeti" aria-hidden="true">' + konfeti() + '</div>' : "") +
      '<header class="hz-hd"><div class="hz-prog" aria-hidden="true">' + prog + '</div>' +
        '<span class="hz-xp" aria-label="' + SAYILAR[adim] + ' XP">⚡ ' + SAYILAR[adim] + ' XP</span>' +
        '<p class="hz-ust">Adım ' + adim + ' / 3</p><h1 id="hd-h1" tabindex="-1">' + o.baslik + '</h1><p class="hz-alt">' + o.alt + '</p></header>' +
      '<div class="hz-bd">' + o.govde + '</div>' +
      '<footer class="hz-ft">' + o.alt2 + '</footer></div>';
  }
  function konfeti() {
    var r = ["#ff6b2c", "#ffc83d", "#22c55e", "#5b3df5", "#ff3d7f", "#06b6d4"], s = "";
    for (var i = 0; i < 30; i++) s += '<i style="left:' + ((i * 37) % 100) + '%;background:' + r[i % 6] + ';animation-delay:' + (1.6 + (i % 7) * .18).toFixed(2) + 's;animation-duration:' + (2.2 + (i % 5) * .3).toFixed(1) + 's"></i>';
    return s;
  }
  function balon(ifade, metin) {
    return '<div class="hz-dk">' + MASKOT(ifade) + '<p class="hz-bub" id="hd-balon" role="status" aria-live="polite">' + esc(metin) + '</p></div>';
  }
  function bayrak(cc) { return '<span class="ul-bayrak ul-bayrak-' + esc(cc) + ' hz-bayrak" aria-hidden="true"></span>'; }
  function uniSayisi(cc) { var k = DK[cc]; return k && k.veri ? k.veri.uni || 0 : 0; }
  function sayacMetni() {
    if (!secim.ulkeler.length) return "🌍 Bir ülke seç";
    var n = secim.ulkeler.reduce(function (t, cc) { return t + uniSayisi(cc); }, 0);
    return "🌍 " + secim.ulkeler.length + " ülke" + (n ? " · " + n + " üniversite seni bekliyor" : "");
  }

  function adim1() {
    var ana = DIZIN.filter(function (k) { return k.grup === "ana"; });
    var diger = DIZIN.filter(function (k) { return k.grup !== "ana"; }).sort(function (a, b) { return a.ad.localeCompare(b.ad, "tr"); });
    var kartlar = ana.concat(diger).map(function (k, i) {
      var on = secim.ulkeler.indexOf(k.kod) >= 0, n = uniSayisi(k.kod);
      return '<label class="hz-f' + (on ? " on" : "") + '" style="--s:' + i + '"><input type="checkbox" class="hz-gizli" name="ulke" value="' + esc(k.kod) + '" aria-label="' + esc(k.ad) + '"' + (on ? " checked" : "") + '>' +
        bayrak(k.kod) + '<b>' + esc(k.ad) + '</b><small>' + (n ? n + " okul" : "&nbsp;") + '</small></label>';
    }).join("");
    return kabuk({
      baslik: "Hayalindeki ülke hangisi?", alt: "İstediğin kadar seç (en çok " + H.EN_FAZLA + ")",
      govde: '<div class="hz-fl" role="group" aria-label="Ülkeler">' + kartlar + '</div><p class="hz-cnt" id="hd-sayac" aria-live="polite">' + esc(sayacMetni()) + '</p>',
      alt2: balon("selam", "Merhaba! Önce yönümüzü belirleyelim.") +
        '<button type="button" class="hz-btn" data-git="2" ' + (secim.ulkeler.length ? "" : "disabled") + '>Devam et →</button>'
    });
  }

  function duz(s) { return String(s || "").toLocaleLowerCase("tr-TR").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  var RENKLER = ["#1e3a8a", "#9f1239", "#0369a1", "#065f46", "#7c2d12", "#5b21b6", "#a16207", "#be185d"];
  function adim2() {
    var E = window.APMEBERRA_EPOSTA, aq = duz(arama);
    var gruplar = secim.ulkeler.map(function (cc) {
      var L = (veri[cc] && veri[cc].universiteler && veri[cc].universiteler.liste) || [];
      var sec = secim.okullar[cc] || [];
      var kart = L.map(function (u, i) {
        var id = E.universiteKimligi(cc, u), on = sec.indexOf(id) >= 0;
        var gizli = aq && duz(u.ad + " " + (u.qsAd || "") + " " + (u.sehir || "")).indexOf(aq) < 0;
        var kisa = (/\(([^)]{2,10})\)/.exec(u.ad) || [])[1] || String(u.qsAd || u.ad).split(/\s+/).filter(function (w) { return /^[A-ZÀ-Ý]/.test(w); }).map(function (w) { return w[0]; }).join("").slice(0, 4);
        return '<label class="hz-u' + (on ? " on" : "") + '"' + (gizli ? " hidden" : "") + '><input type="checkbox" class="hz-gizli" name="okul" value="' + esc(id) + '"' + (on ? " checked" : "") + '>' +
          '<span class="hz-lg" style="background:' + RENKLER[i % RENKLER.length] + '" aria-hidden="true">' + esc(kisa) + '</span>' +
          '<span class="hz-u-ad">' + esc(String(u.ad).replace(/\s*\([^)]*\)\s*$/, "")) + '<small>' + esc(u.sehir || "") + (u.qsSira ? " · QS " + esc(u.qsSira) : "") + '</small></span><span class="hz-ck" aria-hidden="true"></span></label>';
      }).join("");
      return '<div class="hz-ct">' + bayrak(cc) + esc(String((DK[cc] && DK[cc].ad) || cc).toLocaleUpperCase("tr-TR")) + '</div>' + (kart || '<p class="hz-not">Bu ülkenin üniversite listesi hazırlanıyor.</p>');
    }).join("");
    return kabuk({
      baslik: "Aklında okul var mı?", alt: "Yoksa sorun değil, ülke yeter",
      govde: '<label class="hz-srch"><span class="visually-hidden">Üniversite ara</span><input type="search" id="hd-ara" placeholder="🔎 Üniversite ara…" value="' + esc(arama) + '" autocomplete="off"></label>' +
        '<div class="hz-ul" id="hd-okullar" role="group" aria-label="Üniversiteler">' + gruplar + '</div>',
      alt2: '<button type="button" class="hz-skip" data-atla>🤷 Okul bilmiyorum, ülke yeter</button>' +
        '<button type="button" class="hz-btn" data-git="3">Tablomu göster ✨</button>' +
        '<button type="button" class="hz-geri" data-git="1">← Ülkeleri değiştir</button>'
    });
  }

  function sinavAd(id) { var s = SINAV[id]; return s ? String(s.ad).split(" (")[0].split(" —")[0] : id; }
  function dersAd(d) { var x = AP && AP.dersBul ? AP.dersBul(d) : null; return x ? x.ad : d; }
  var IKON = { ok: "✅", uyari: "⚠️", kapali: "❌", teyit: "❔" };
  function radyo(ad, ad2, liste, deger, etiket) {
    return '<div class="hz-cips" role="radiogroup" aria-label="' + ad2 + '">' + liste.map(function (x) {
      return '<label class="hz-cip' + (x[0] === deger ? " on" : "") + '"><input type="radio" class="hz-gizli" name="' + ad + '" value="' + x[0] + '"' + (x[0] === deger ? " checked" : "") + '>' + esc(x[1]) + '</label>';
    }).join("") + '</div>';
  }
  function ayrintiAdresi(cc) {
    var m = secim.sinif === "mezun" ? "model=lise-mezun" : "model=lise&sinif=" + secim.sinif;
    return "/ulkem?" + m + "&ulke=" + cc + "&dil=en";
  }

  function adim3() {
    var sut = H.sutunlar(secim, veri), alan = secim.alan;
    var ortak = H.ortakYol(sut, veri, alan, secim.sinif, bugun());
    var bas = '<tr><th scope="col" class="hz-th0">Şart</th>' + sut.map(function (c) {
      return '<th scope="col" data-sutun="' + esc(c.uniId || c.cc) + '">' + bayrak(c.cc) + '<span>' + esc(c.tur === "uni" ? c.kisa : c.ad) + '</span>' +
        (c.tur === "uni" ? '<small>' + esc(c.ad) + '</small>' : '<small>genel kural</small>') + '</th>';
    }).join("") + '</tr>';
    var n = 0;
    var satirlar = H.SATIRLAR.map(function (s) {
      return '<tr><th scope="row">' + esc(H.SATIR_AD[s]) + '</th>' + sut.map(function (c, j) {
        var h = H.hucre(veri, c.cc, c.uniId, alan, s);
        return '<td><button type="button" class="hz-hucre is-' + h.durum + '" style="--d:' + (n++ * 0.07).toFixed(2) + 's" data-hucre="' + s + '|' + j + '" aria-expanded="false" aria-controls="hd-detay">' +
          '<span aria-hidden="true">' + IKON[h.durum] + '</span> ' + esc(H.hucreEtiket(s, h, sinavAd)) + '</button></td>';
      }).join("") + '</tr>';
    }).join("");
    var cips = ortak.apDersleri.map(function (d) { return '<span class="hz-chip">📘 ' + esc(dersAd(d)) + '</span>'; })
      .concat(ortak.dil ? ['<span class="hz-chip">🗣️ ' + esc(ortak.dil.belge + " " + ortak.dil.esik) + '</span>'] : [])
      .concat(ortak.sinavlar.map(function (x) { return '<span class="hz-chip">📝 ' + esc(sinavAd(x)) + '</span>'; })).join("");
    var tek = sut.length === 1;
    var yol = '<section class="hz-yol" id="hd-ortak" aria-labelledby="hd-yol-h"><h2 id="hd-yol-h">🧭 ' + (tek ? "Senin yolun" : "Hepsine birden yeten yol") + '</h2>' +
      '<div class="hz-chips">' + cips + '</div>' +
      (ortak.apOneri ? '<p class="hz-yol-not">AP burada şart değil, başvurunu güçlendirir. Önerilen dersler ' + esc(H.ALAN_AD[alan]) + ' için.</p>' : "") +
      (ortak.yksUyari ? '<p class="hz-yol-uyari">⚠️ YKS’ye girmen gerekiyor: tabloda ⚠️ olan okul ya da ülke YKS sonucu istiyor.</p>' : "") +
      (ortak.yksTeyit ? '<p class="hz-yol-not">❔ YKS’nin gerekip gerekmediğini teyit et: tabloda ❔ olan yer için doğrulanmış kaynak henüz yok.</p>' : "") +
      '<p class="hz-wk"><strong>' + ortak.haftaKaldi + '</strong> hafta · Mayıs ' + ortak.sinavYili + ' AP sınavlarına</p></section>';
    var ayr = '<p class="hz-ayrinti">Ülke ayrıntısı (tarihler, burslar, sık hatalar): ' + secim.ulkeler.map(function (cc) {
      return '<a href="' + esc(ayrintiAdresi(cc)) + '">' + esc((DK[cc] && DK[cc].ad) || cc) + ' →</a>';
    }).join(" ") + '</p>';
    return { ortak: ortak, sut: sut, html: kabuk({
      kutlama: !kutlandi,
      baslik: "Yolun hazır! 🎉", alt: sut.length + (sut.filter(function (c) { return c.tur === "uni"; }).length === sut.length ? " okulun" : " seçimin") + " şartları tek tabloda",
      govde: radyo("sinif", "Sınıf", [["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["mezun", "Mezun"]], secim.sinif) +
        radyo("alan", "Alan", H.ALANLAR.map(function (a) { return [a, H.ALAN_AD[a]]; }), alan) +
        '<div class="hz-tablo-kap" tabindex="0" role="region" aria-label="Şart tablosu"><table class="hz-tablo" id="hd-tablo"><thead>' + bas + '</thead><tbody>' + satirlar + '</tbody></table></div>' +
        '<div class="hz-detay" id="hd-detay" aria-live="polite" hidden></div>' + yol + ayr,
      alt2: '<div id="hd-uygula-kap"><button type="button" class="hz-btn" data-uygula>Bu planı uygula 🚀</button></div>' +
        '<button type="button" class="hz-geri" data-git="1">← Seçimi değiştir</button>'
    }) };
  }

  // ---------------- Çizim ----------------
  var son3 = null;
  function ciz(odak) {
    if (adim === 1) kok.innerHTML = adim1();
    else if (adim === 2) kok.innerHTML = adim2();
    else { son3 = adim3(); kok.innerHTML = son3.html; kutlandi = true; }
    if (odak) { var h = document.getElementById("hd-h1"); if (h) h.focus({ preventScroll: true }); kok.scrollIntoView({ block: "start", behavior: azHareket ? "auto" : "smooth" }); }
  }
  function git(n, push) {
    adim = n;
    if (n > 1 && !secim.ulkeler.length) adim = 1;
    adresYaz(push !== false);
    if (adim === 1) { ciz(true); return; }
    kok.setAttribute("aria-busy", "true");
    yukle().then(function () { kok.removeAttribute("aria-busy"); ciz(true); });
  }

  // ---------------- Olaylar ----------------
  kok.addEventListener("change", function (e) {
    var t = e.target; if (!t || !t.name) return;
    if (t.name === "ulke") {
      var i = secim.ulkeler.indexOf(t.value);
      if (t.checked && i < 0) {
        if (secim.ulkeler.length >= H.EN_FAZLA) {
          t.checked = false;
          var b = document.getElementById("hd-balon"); if (b) b.textContent = "En çok " + H.EN_FAZLA + " ülke seçebilirsin. Birini çıkarıp yenisini ekle.";
          return;
        }
        secim.ulkeler.push(t.value);
      } else if (!t.checked && i >= 0) { secim.ulkeler.splice(i, 1); delete secim.okullar[t.value]; }
      var l = t.closest(".hz-f"); l.classList.toggle("on", t.checked);
      if (t.checked && !azHareket) { l.classList.remove("is-pop"); void l.offsetWidth; l.classList.add("is-pop"); }
      document.getElementById("hd-sayac").textContent = sayacMetni();
      if (!secim.ulkeler.length) { var bb = document.getElementById("hd-balon"); if (bb) bb.textContent = "Bir ya da birkaç ülke seç; sonra okullara bakarız."; }
      kok.querySelector("[data-git='2']").disabled = !secim.ulkeler.length;
      adresYaz(false);
      return;
    }
    if (t.name === "okul") {
      var cc = t.value.split("-")[0], L = secim.okullar[cc] || (secim.okullar[cc] = []), j = L.indexOf(t.value);
      if (t.checked && j < 0) L.push(t.value); else if (!t.checked && j >= 0) L.splice(j, 1);
      if (!L.length) delete secim.okullar[cc];
      t.closest(".hz-u").classList.toggle("on", t.checked);
      adresYaz(false);
      return;
    }
    if (t.name === "sinif" || t.name === "alan") {
      secim[t.name] = t.value;
      adresYaz(false);
      ciz(false);
      var yeni = kok.querySelector('input[name="' + t.name + '"][value="' + t.value + '"]'); if (yeni) yeni.focus({ preventScroll: true });
    }
  });
  kok.addEventListener("input", function (e) {
    if (e.target.id !== "hd-ara") return;
    arama = e.target.value;
    var aq = duz(arama);
    kok.querySelectorAll(".hz-u").forEach(function (l) { l.hidden = !!aq && duz(l.textContent).indexOf(aq) < 0; });
  });
  kok.addEventListener("click", function (e) {
    var g = e.target.closest("[data-git]");
    if (g && !g.disabled) { git(+g.getAttribute("data-git")); return; }
    if (e.target.closest("[data-atla]")) { secim.okullar = {}; git(3); return; }
    var hc = e.target.closest("[data-hucre]");
    if (hc && son3) { hucreAc(hc); return; }
    if (e.target.closest("[data-uygula]")) { uygula(); return; }
    if (e.target.closest("[data-onayla]")) { kaydet(); return; }
    if (e.target.closest("[data-vazgec]")) { ciz(false); return; }
  });
  function hucreAc(b) {
    var p = b.getAttribute("data-hucre").split("|"), c = son3.sut[+p[1]], h = H.hucre(veri, c.cc, c.uniId, secim.alan, p[0]);
    var d = document.getElementById("hd-detay"), acik = b.getAttribute("aria-expanded") === "true";
    kok.querySelectorAll("[data-hucre][aria-expanded=true]").forEach(function (x) { x.setAttribute("aria-expanded", "false"); });
    if (acik) { d.hidden = true; return; }
    b.setAttribute("aria-expanded", "true");
    d.innerHTML = '<p class="hz-detay-h">' + IKON[h.durum] + " " + esc(H.SATIR_AD[p[0]]) + " · " + esc(c.tur === "uni" ? c.ad : c.ad + " (genel)") + '</p><p>' + esc(h.metin) + '</p>' +
      (h.kaynak.length ? '<p class="hz-kaynak">' + h.kaynak.map(function (k) { return UI.src(k.url, k.ad); }).join(" ") + (h.kesinlik ? ' <span class="hz-kesin">' + esc(h.kesinlik) + '</span>' : "") + '</p>'
        : '<p class="hz-kaynak">Bu bilgi için doğrulanmış kaynak henüz yok; okulun resmî sayfasından kontrol et.</p>');
    d.hidden = false;
  }

  function uygula() {
    var adres = H.secimAdres(secim);
    if (!(ME && ME.user)) {
      try { sessionStorage.setItem("meberra-hedef", JSON.stringify({ adres: adres, t: Date.now() })); } catch (e) { /* gizli pencere */ }
      location.href = "/giris?donus=%2Fbugun&hedef=" + encodeURIComponent(adres) + "#kayit";
      return;
    }
    var yama = H.profilYamasi(PROF, secim, son3.ortak), eskiU = (PROF && PROF.ulkeler) || [], eskiD = ((PROF && PROF.apDersleri) || []).map(function (d) { return d.ders; });
    var yU = yama.ulkeler.filter(function (u) { return eskiU.indexOf(u) < 0; }).length;
    var cikan = H.cikanUlkeler(PROF, yama).map(function (u) { return (DK[u] && DK[u].ad) || u; });
    var yD = yama.apDersleri.filter(function (d) { return eskiD.indexOf(d.ders) < 0; }).length;
    document.getElementById("hd-uygula-kap").innerHTML = '<p class="hz-ozet" role="status">' +
      esc((yU || yD ? "Planına " + [yU ? yU + " ülke" : "", yD ? yD + " ders" : ""].filter(Boolean).join(", ") + " eklenecek." : "Bu seçim planında zaten var; okulların listene eklenecek.") +
        (cikan.length ? " En çok " + H.EN_FAZLA + " ülke olabildiği için " + cikan.join(", ") + " listenden çıkacak." : "")) + '</p>' +
      '<div class="hz-iki"><button type="button" class="hz-btn" data-onayla>Onayla</button><button type="button" class="hz-geri" data-vazgec>Vazgeç</button></div>';
  }
  /** Seçilen okulları Listem'e (apmeberra:panel:v1.universitelerim) ekler; giris.html aynı kuralı uygular. */
  function listemeEkle(idler) {
    if (!window.APMEBERRA || !APMEBERRA.panel || !idler || !idler.length) return;
    APMEBERRA.panel.update(function (pn) {
      var L = Array.isArray(pn.universitelerim) ? pn.universitelerim : [];
      idler.forEach(function (id) { if (L.indexOf(id) < 0) L.push(id); });
      pn.universitelerim = L;
    });
  }
  function kaydet() {
    var AUTH = window.APMEBERRA_AUTH, yama = H.profilYamasi(PROF, secim, son3.ortak);
    var b = kok.querySelector("[data-onayla]"); if (b) { b.disabled = true; b.textContent = "Kaydediliyor…"; }
    if (!AUTH || !AUTH.saveProfile) { location.href = "/profil"; return; }
    var hata = function (m) { if (b) { b.disabled = false; b.textContent = "Onayla"; } var o = kok.querySelector(".hz-ozet"); if (o) o.textContent = "Kaydedilemedi: " + (m || "tekrar dene"); };
    AUTH.saveProfile(ME.user.id, yama).catch(function () { return { ok: false, errors: { genel: "bağlantı sorunu, tekrar dene" } }; }).then(function (r) {
      if (r && r.ok === false) { hata(r.errors && (r.errors.genel || Object.keys(r.errors).map(function (k) { return r.errors[k]; }).join(" "))); return; }
      listemeEkle(yama.hedefOkullar);
      location.href = "/bugun?ilk=1";
    });
  }
  window.addEventListener("popstate", function () {
    if (location.search === sonArama) return; // yalnızca # değişti (ör. içeriğe atla bağlantısı)
    sonArama = location.search;
    secim = H.secimCoz(location.search);
    var m = /[?&]adim=([123])/.exec(location.search);
    adim = secim.ulkeler.length ? (m ? +m[1] : 3) : 1;
    if (adim === 1) ciz(false); else yukle().then(function () { ciz(false); });
  });

  adresYaz(false);
  if (adim === 1) ciz(false); else yukle().then(function () { ciz(false); });
})();
