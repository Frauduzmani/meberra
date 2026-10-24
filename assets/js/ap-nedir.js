/* ==========================================================================
   MEBERRA 1.26.0 — /ap-nedir: "10 dakikada AP" yolculuğu (AP'yi hiç bilmeyen öğrenci için sıfır noktası).
   6 sahne, hedef sihirbazıyla aynı kart iskeleti (hedef.css .hz-*): 1) AP nedir (çevrilen kartlar) 2) 1–5 puan (kaydırıcı)
   3) Sınav nasıl (MCQ/FRQ dokun-aç) 4) Türkiye'den nasıl girilir (takvim + canlı geri sayım) 5) Meberra'da yolun
   6) 5 soruluk mini test → "AP Kâşifi" rozeti + konfeti. Rozet cihazda: localStorage "meberra:ap-nedir".
   Tarih/ücret: 2026–27 dönemi, rehber-turkiyede-ap.html ile aynı (AP Central kaynaklı). Giriş gerekmez.
   Saf yardımcılar Node'da da çalışır: araclar/testler/ap-nedir-birim-test.js
   ========================================================================== */
(function (kok, kur) {
  "use strict";
  var api = kur();
  if (typeof module === "object" && module.exports) module.exports = api;
  else kok.MeberraApNedir = api;
  if (typeof document !== "undefined") api.baslat();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var SINAV = { siparis: "2026-11-13", gecSon: "2027-03-12", ilkGun: "2027-05-03", sonGun: "2027-05-14", ucret: 129, gecUcret: 40 };

  var SAHNELER = [
    { tur: "kart", ust: "Sahne 1", baslik: "AP nedir?", alt: "Üç karta dokun, arkasını çevir.", dede: "Hoş geldin! AP'yi üç kartta anlatayım; her birine dokun." },
    { tur: "puan", ust: "Sahne 2", baslik: "1'den 5'e puan", alt: "Kaydırıcıyı sürükle: her puan ne anlama geliyor?", dede: "Puan 1 ile 5 arası. Kaydır bakalım, 5 ne demek?" },
    { tur: "sinav", ust: "Sahne 3", baslik: "Sınav nasıl geçer?", alt: "İki bölüm var. Her birine dokun.", dede: "Sınavın iki yarısı var: şıklı sorular ve yazılı sorular." },
    { tur: "takvim", ust: "Sahne 4", baslik: "Türkiye'den nasıl girilir?", alt: "Mayıs 2027 sınavları için takvim.", dede: "En önemli tarih 13 Kasım. Kaçırma, sonra pahalanıyor!" },
    { tur: "yol", ust: "Sahne 5", baslik: "Meberra'da yolun", alt: "Beş adımda sınava hazır ol.", dede: "Yol belli: öğren, çöz, yaz, dene, puanını gör." },
    { tur: "test", ust: "Sahne 6", baslik: "Mini test: AP Kâşifi ol!", alt: "5 soru. 3 doğru rozeti getirir.", dede: "Hadi bakalım, ne öğrendin? 3 doğru yeter." }
  ];

  var KARTLAR = [
    { on: "🏛️", baslik: "College Board", arka: "AP sınavlarını ABD'deki kâr amacı gütmeyen College Board hazırlar. Advanced Placement = ileri yerleştirme." },
    { on: "🎓", baslik: "Üniversite düzeyi", arka: "Her AP dersi bir üniversite dersine denktir. 40'a yakın ders var: Calculus, Physics, Chemistry, Biology…" },
    { on: "📅", baslik: "Yılda bir kez", arka: "Sınavlar her yıl Mayıs'ın ilk iki haftasında yapılır. Mayıs 2027: 3–14 Mayıs." }
  ];

  var PUANLAR = [
    { p: 1, en: "No recommendation", tr: "Öneri yok", not: "Üniversiteler bu puanı kabul etmez." },
    { p: 2, en: "Possibly qualified", tr: "Belki yeterli", not: "Çoğu üniversite için yetersiz." },
    { p: 3, en: "Qualified", tr: "Yeterli", not: "Pek çok üniversitenin istediği en düşük puan." },
    { p: 4, en: "Very well qualified", tr: "Çok yeterli", not: "Güçlü bir başvuru puanı; birçok program 4 ister." },
    { p: 5, en: "Extremely well qualified", tr: "Son derece yeterli", not: "En yüksek puan. Üniversite dersinde A almaya denk." }
  ];

  var TEST = [
    { soru: "AP puanı hangi aralıktadır?", siklar: ["0–100", "1–5", "A–F"], dogru: 1, neden: "AP puanı 1 ile 5 arasındadır; 5 en yüksektir." },
    { soru: "AP sınavları yılın hangi ayında yapılır?", siklar: ["Mayıs", "Ocak", "Eylül", "Aralık"], dogru: 0, neden: "Sınavlar her yıl Mayıs'ın ilk iki haftasında yapılır." },
    { soru: "FRQ ne demektir?", siklar: ["Çoktan seçmeli soru", "Sınav ücreti", "Serbest yanıtlı (yazılı) soru"], dogru: 2, neden: "FRQ = free-response question: cevabını kendin yazdığın, puan puan okunan soru." },
    { soru: "Türkiye'de AP sınavına nereden girersin?", siklar: ["Yalnız ABD'de", "AP okulu ya da yetkili sınav merkezinden", "ÖSYM'den"], dogru: 1, neden: "Türkiye'de AP okulları ve yetkili sınav merkezleri sınav siparişi verir." },
    { soru: "Mayıs 2027 sınavları için standart sipariş son günü hangisi?", siklar: ["13 Kasım 2026", "1 Mayıs 2027", "30 Haziran 2027", "1 Eylül 2026"], dogru: 0, neden: "13 Kasım 2026. Sonrasında sınav başına 40 $ geç sipariş ücreti eklenir." }
  ];

  /** cevaplar: şık sırası dizisi (-1 = boş). { dogru, toplam, rozet: "kasif" | null } — 3 ve üzeri doğru rozet getirir. */
  function puanla(cevaplar) {
    var d = 0;
    TEST.forEach(function (q, i) { if ((cevaplar || [])[i] === q.dogru) d++; });
    return { dogru: d, toplam: TEST.length, rozet: d >= 3 ? "kasif" : null };
  }
  /** "YYYY-AA-GG" iki tarih arası gün; hedef geçmişse null */
  function gunKaldi(bugun, hedef) {
    var a = String(bugun).split("-").map(Number), b = String(hedef).split("-").map(Number);
    var g = Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 864e5);
    return g < 0 ? null : g;
  }

  // ---------------- tarayıcı ----------------
  var ANAHTAR = "meberra:ap-nedir";
  var kap, adim = 1, cevaplar = [], puanSecim = 3, acikKart = {}, acikBolum = null;
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function azHareket() { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function bugunIst() {
    try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function oku() { try { return JSON.parse(localStorage.getItem(ANAHTAR) || "null"); } catch (e) { return null; } }
  function yaz(v) { try { localStorage.setItem(ANAHTAR, JSON.stringify(v)); } catch (e) { /* özel pencere */ } }
  function maskot(ifade) { return '<img class="hz-korkut" src="/assets/img/maskot/korkut-' + ifade + '.svg" alt="" width="56" height="56">'; }
  function konfeti() {
    var r = ["#ff6b2c", "#ffc83d", "#22c55e", "#5b3df5", "#ff3d7f", "#06b6d4"], s = "";
    for (var i = 0; i < 36; i++) s += '<i style="left:' + ((i * 37) % 100) + '%;background:' + r[i % 6] + ';animation-delay:' + ((i % 7) * .15).toFixed(2) + 's;animation-duration:' + (2.2 + (i % 5) * .3).toFixed(1) + 's"></i>';
    return s;
  }

  function govde(s) {
    if (s.tur === "kart") return '<div class="an-kartlar">' + KARTLAR.map(function (k, i) {
      return '<button type="button" class="an-kart' + (acikKart[i] ? " is-acik" : "") + '" data-kart="' + i + '" aria-pressed="' + !!acikKart[i] + '">' +
        '<span class="an-on"><span class="an-emoji" aria-hidden="true">' + k.on + '</span><strong>' + esc(k.baslik) + '</strong><small>Dokun, çevir</small></span>' +
        '<span class="an-arka">' + esc(k.arka) + '</span></button>';
    }).join("") + '</div>';
    if (s.tur === "puan") {
      var p = PUANLAR[puanSecim - 1];
      return '<div class="an-puan" style="--an-p:' + puanSecim + '"><div class="an-puan-sayi" aria-hidden="true">' + p.p + '</div>' +
        '<label class="an-etiket" for="an-kaydir">Puanı seç</label><input type="range" id="an-kaydir" min="1" max="5" step="1" value="' + puanSecim + '" aria-valuetext="' + p.p + ': ' + esc(p.tr) + '">' +
        '<div class="an-puan-olcek" aria-hidden="true"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>' +
        '<p class="an-puan-ad"><strong lang="en">' + esc(p.en) + '</strong> · ' + esc(p.tr) + '</p><p class="an-puan-not" role="status">' + esc(p.not) + '</p>' +
        '<p class="an-ipucu">Hedef ülkende hangi puanın istendiğini <a href="/ulkem">Hedefim</a> sihirbazında görürsün.</p></div>';
    }
    if (s.tur === "sinav") {
      var B = [
        { k: "mcq", ad: "Bölüm I · MCQ", kisa: "Çoktan seçmeli", metin: "Multiple-choice: 4 şıktan doğruyu seçersin. Yanlış cevap puan götürmez, boş bırakma! Çoğu derste puanın yaklaşık yarısı." },
        { k: "frq", ad: "Bölüm II · FRQ", kisa: "Serbest yanıt", metin: "Free-response: çözümünü ve gerekçeni yazarsın; puanlayıcılar ölçüt ölçüt puan verir. Kısmi puan var, her adımı yaz!" }
      ];
      return '<div class="an-bolumler">' + B.map(function (b) {
        return '<button type="button" class="an-bolum an-' + b.k + (acikBolum === b.k ? " is-acik" : "") + '" data-bolum="' + b.k + '" aria-expanded="' + (acikBolum === b.k) + '">' +
          '<strong>' + b.ad + '</strong><span>' + b.kisa + '</span>' + (acikBolum === b.k ? '<p>' + esc(b.metin) + '</p>' : "") + '</button>';
      }).join("") + '</div>' +
        '<ul class="an-notlar"><li>⏱️ Sınav dersine göre 2–3 saattir.</li><li>💻 Çoğu sınav Bluebook uygulamasında dijitaldir; matematik ve fen derslerinde FRQ genelde kâğıda yazılır.</li><li>🧮 Hesap makinesi bazı bölümlerde serbest, bazılarında yasak.</li></ul>';
    }
    if (s.tur === "takvim") {
      var g = gunKaldi(bugunIst(), SINAV.ilkGun);
      var adimlar = [
        { t: "Ekim", m: "AP okulu ya da yetkili sınav merkezi bul, koordinatörle konuş." },
        { t: "13 Kasım 2026", m: "Standart sipariş son günü. Sınav başına " + SINAV.ucret + " $ (College Board ücreti; merkez kendi bedelini ekleyebilir).", vurgu: true },
        { t: "14 Kasım – 12 Mart", m: "Geç sipariş: sınav başına +" + SINAV.gecUcret + " $." },
        { t: "3–14 Mayıs 2027", m: "Sınav haftaları." },
        { t: "Temmuz 2027", m: "Puanlar açıklanır; üniversitelere gönderirsin." }
      ];
      return (g != null ? '<p class="an-sayac"><span class="an-sayac-sayi">' + g + '</span> gün kaldı <small>Mayıs 2027 sınavlarına</small></p>' : "") +
        '<ol class="an-zaman">' + adimlar.map(function (a) { return '<li' + (a.vurgu ? ' class="is-vurgu"' : "") + '><strong>' + esc(a.t) + '</strong><span>' + esc(a.m) + '</span></li>'; }).join("") + '</ol>' +
        '<p class="an-ipucu">Adım adım kayıt: <a href="/rehber/turkiyede-ap">Türkiye\'de AP sınavına nasıl girilir?</a></p>';
    }
    if (s.tur === "yol") {
      var Y = [["📖", "Konu anlatımı", "Her konu Türkçe, terimler İngilizce."], ["🔍", "Sorular", "“Ne soruyor?” ve kelimeye dokun yardımıyla."],
        ["✍️", "FRQ", "Yaz, rubrikle kendini puanla."], ["⏱️", "Deneme", "Gerçek sınav düzeninde tam sınav."], ["🎯", "Tahmini puan", "Bugün ekranında 1–5 tahminin."]];
      return '<ol class="an-yol">' + Y.map(function (y, i) { return '<li style="--an-i:' + i + '"><span class="an-yol-ikon" aria-hidden="true">' + y[0] + '</span><strong>' + y[1] + '</strong><span>' + y[2] + '</span></li>'; }).join("") + '</ol>';
    }
    return testGovde();
  }
  function testGovde() {
    var bitti = cevaplar.length === TEST.length && cevaplar.every(function (c) { return c != null; });
    if (bitti) {
      var r = puanla(cevaplar);
      return '<div class="an-sonuc' + (r.rozet ? " is-rozet" : "") + '" role="status"><div class="an-rozet" aria-hidden="true">' + (r.rozet ? "🧭" : "📚") + '</div>' +
        '<h2>' + (r.rozet ? "AP Kâşifi rozeti senin!" : "İyi başlangıç!") + '</h2><p>' + r.dogru + ' / ' + r.toplam + ' doğru. ' +
        (r.rozet ? "Artık AP'nin ne olduğunu biliyorsun. Sıra çalışmakta!" : "Sahnelere bir daha göz at, testi yeniden dene.") + '</p>' +
        (r.rozet ? "" : '<button type="button" class="hz-geri" data-yeniden>Testi yeniden dene</button>') + '</div>';
    }
    var i = cevaplar.length, q = TEST[i], son = i > 0 ? TEST[i - 1] : null, sonC = i > 0 ? cevaplar[i - 1] : null;
    return (son ? '<p class="an-geri-bildirim ' + (sonC === son.dogru ? "is-dogru" : "is-yanlis") + '" role="status">' + (sonC === son.dogru ? "✅ Doğru! " : "❌ Olmadı. ") + esc(son.neden) + '</p>' : "") +
      '<fieldset class="an-soru"><legend><span class="an-soru-no">Soru ' + (i + 1) + ' / ' + TEST.length + '</span>' + esc(q.soru) + '</legend>' +
      q.siklar.map(function (s, j) { return '<button type="button" class="an-sik" data-sik="' + j + '">' + esc(s) + '</button>'; }).join("") + '</fieldset>';
  }

  function ciz(odakla) {
    var s = SAHNELER[adim - 1], bitti = s.tur === "test" && cevaplar.length === TEST.length, r = bitti ? puanla(cevaplar) : null;
    var kutla = !!(r && r.rozet);
    var prog = SAHNELER.map(function (x, i) { return '<i class="' + (i + 1 < adim ? "on" : i + 1 === adim ? "now" : "") + '"></i>'; }).join("");
    var dede = kutla ? "Aferin! Rozetin hazır. Şimdi hedefini seçelim mi?" : s.dede;
    var alt2 = s.tur !== "test" ? '<button type="button" class="hz-btn" data-git="' + (adim + 1) + '">' + (adim === 5 ? "Mini teste geç 🎯" : "Devam et →") + '</button>'
      : bitti ? '<a class="hz-btn" href="/ulkem">Hedefimi seç 🎯</a><a class="hz-geri" href="/kayit">Ücretsiz başla — hesap aç</a>' : "";
    if (adim > 1 && !(s.tur === "test" && bitti)) alt2 += '<button type="button" class="hz-geri" data-git="' + (adim - 1) + '">← Geri</button>';
    kap.innerHTML = '<div class="hz-kart an-kart-kabuk' + (kutla ? " is-kutlama" : "") + '">' +
      (kutla && !azHareket() ? '<div class="hz-konfeti" aria-hidden="true">' + konfeti() + '</div>' : "") +
      '<header class="hz-hd"><div class="hz-prog" aria-hidden="true">' + prog + '</div>' +
        '<span class="hz-xp">⏱️ ~' + Math.max(1, 12 - adim * 2) + ' dk</span>' +
        '<p class="hz-ust">' + s.ust + ' / 6</p><h1 id="an-h1" tabindex="-1">' + esc(s.baslik) + '</h1><p class="hz-alt">' + esc(s.alt) + '</p></header>' +
      '<div class="hz-bd">' + govde(s) + '</div>' +
      '<footer class="hz-ft"><div class="hz-dk">' + maskot(kutla ? "kutlama" : s.tur === "test" ? "dusunen" : "selam") + '<p class="hz-bub" role="status" aria-live="polite">' + esc(dede) + '</p></div>' + alt2 + '</footer></div>';
    if (odakla) { var h = document.getElementById("an-h1"); if (h) try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
    if (kutla) yaz({ rozet: "kasif", tarih: bugunIst(), dogru: r.dogru });
  }
  function git(n) {
    adim = Math.max(1, Math.min(6, n));
    try { history.replaceState(null, "", "/ap-nedir?sahne=" + adim); } catch (e) { /* file:// */ }
    ciz(true);
    try { kap.scrollIntoView({ block: "start", behavior: azHareket() ? "auto" : "smooth" }); } catch (e) { /* eski */ }
  }

  function baslat() {
    function kur() {
      kap = document.getElementById("an-yolculuk");
      if (!kap) return;
      var m = /[?&]sahne=(\d)/.exec(location.search);
      adim = m ? Math.max(1, Math.min(6, +m[1])) : 1;
      kap.hidden = false;
      ciz(false);
      kap.addEventListener("click", function (e) {
        var t = e.target.closest("[data-git],[data-kart],[data-bolum],[data-sik],[data-yeniden]");
        if (!t) return;
        if (t.hasAttribute("data-git")) return git(+t.getAttribute("data-git"));
        if (t.hasAttribute("data-kart")) { var i = +t.getAttribute("data-kart"); acikKart[i] = !acikKart[i]; return ciz(false); }
        if (t.hasAttribute("data-bolum")) { var b = t.getAttribute("data-bolum"); acikBolum = acikBolum === b ? null : b; return ciz(false); }
        if (t.hasAttribute("data-sik")) { cevaplar.push(+t.getAttribute("data-sik")); ciz(false); var f = kap.querySelector(".an-sik, .an-sonuc h2, .hz-btn"); if (f && f.focus) f.focus(); return; }
        if (t.hasAttribute("data-yeniden")) { cevaplar = []; ciz(true); }
      });
      kap.addEventListener("input", function (e) {
        if (e.target.id !== "an-kaydir") return;
        puanSecim = +e.target.value;
        var p = PUANLAR[puanSecim - 1], k = kap.querySelector(".an-puan");
        k.style.setProperty("--an-p", puanSecim);
        k.querySelector(".an-puan-sayi").textContent = p.p;
        k.querySelector(".an-puan-ad").innerHTML = '<strong lang="en">' + esc(p.en) + '</strong> · ' + esc(p.tr);
        k.querySelector(".an-puan-not").textContent = p.not;
        e.target.setAttribute("aria-valuetext", p.p + ": " + p.tr);
      });
      document.addEventListener("keydown", function (e) {
        if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || "")) return;
        if (e.key === "ArrowRight" && adim < 6 && SAHNELER[adim - 1].tur !== "test") git(adim + 1);
        else if (e.key === "ArrowLeft" && adim > 1) git(adim - 1);
      });
      var o = oku(), r = document.getElementById("an-rozet-not");
      if (o && o.rozet && r) { r.hidden = false; var tt = new Date(o.tarih + "T12:00:00"); r.textContent = "🧭 AP Kâşifi rozetin var (" + (isNaN(tt) ? o.tarih : tt.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })) + ")."; }
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", kur); else kur();
  }

  return { SAHNELER: SAHNELER, TEST: TEST, PUANLAR: PUANLAR, KARTLAR: KARTLAR, SINAV: SINAV, puanla: puanla, gunKaldi: gunKaldi, baslat: baslat };
});
