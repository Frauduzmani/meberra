/**
 * Meberra 1.16.0 — oyunlaştırma ekleri (oyun.js'e DOM kancalarıyla eklenir; ayrı derleme yok).
 *
 *  1. Ünite ustalığı (Bronz / Gümüş / Altın): öğrenme yolu düğümlerine (canli.js .cn-dugum__git / oyun.js .oy-dugum)
 *     küçük madalya; seviye ilk kez ulaşılınca kutlama (MeberraKutlama). Ölçüt (ünitenin tüm soruları üzerinden):
 *       Bronz: ≥ %50 soru cevaplandı ve doğruluk ≥ %60 · Gümüş: ≥ %80 ve ≥ %75
 *       Altın: %100 cevaplandı, doğruluk ≥ %90 ve her yanlış sonradan doğru çözüldü (açık yanlış yok).
 *     Doğruluk = ilk denemede doğru oranı: Yanlışlarım kaydı olan (çözülmüş olsa da) ya da son cevabı yanlış soru "yanlış" sayılır.
 *  2. Aylık görev: her takvim ayı (İstanbul) belirlenimli tek hedef (200 soru ya da 15 gün çalışma); Bugün › Daha fazla
 *     içinde kompakt kart, ay sonuna yakın/hedefe yakınken bağlamsal alanda; tamamlanınca aya özel rozet + kutlama.
 *  3. "Haftan nasıldı?": pazartesi ilk ziyarette geçen haftanın sakin özeti (soru, doğruluk, XP, seri, en iyi ders,
 *     gelişen ünite), Dede Korkut, "Paylaş" hikâye kartı (yalnız ilk ad) ve "Kapat". Haftada bir kez; hiçbir şeyi engellemez.
 *  4. Profil › Bildirimler: önerilen hatırlatma saati satırı (GET /api/bildirim-ayarlari onerilenSaat) + "Kullan".
 *
 * Depo: apmeberra:oyun:v1 ek alanları (sunucu birleştirmesi server/veri.js oyunBirlestir):
 *   ustalik:  { "<sayfa>|<ünite no>": { seviye: "bronz"|"gumus"|"altin", t } }   (en yüksek seviye, en erken t)
 *   aylik:    { "YYYY-MM": { hedef: { tur, miktar }, tamam, t } }                 (tamam kazanır, en erken t)
 *   haftalik: { "YYYY-Www": t }  (haftalık özet gösterildi)                         (birleşim, en erken t)
 *   rozetler["aylik-YYYY-MM"] = { t }  (aya özel rozet; İlerleme › Rozetler listesine eklenir)
 * Olaylar: "meberra:cevap", "meberra:oyun". Can / kalp / suçlayıcı dil yok.
 * Saf çekirdek Node'da da yüklenir (module.exports): araclar/testler/oyun-ek-birim-test.js
 */
(function () {
  "use strict";

  // =====================================================================================
  // 1. SAF ÇEKİRDEK
  // =====================================================================================
  var isObj = function (v) { return v !== null && typeof v === "object" && !Array.isArray(v); };
  var SEVIYELER = ["bronz", "gumus", "altin"];
  var SEVIYE_AD = { bronz: "Bronz", gumus: "Gümüş", altin: "Altın" };
  var SIRA = { bronz: 1, gumus: 2, altin: 3 };
  var ESIK = { bronz: { cevap: 0.5, dogru: 0.6 }, gumus: { cevap: 0.8, dogru: 0.75 }, altin: { cevap: 1, dogru: 0.9 } };
  var AYLIK_SECENEK = [{ tur: "soru", miktar: 200 }, { tur: "gun", miktar: 15 }]; // ulaşılabilir hedefler (cevaplanan farklı soru / çalışılan gün)
  var AY_AD = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  var KISA = { "ap-calculus": "Calculus", "ap-physics": "Physics", "ap-chemistry": "Chemistry", "ap-biology": "Biology", "ap-english": "English", "ap-electives": "Seçmeliler", "ap-precalculus": "Precalculus", "ap-statistics": "Statistics", "ap-physics-2": "Physics 2", "sinav-cents": "CEnT-S" };

  /** Saf: { toplam, cevap, dogruIlk, acikYanlis } → "altin" | "gumus" | "bronz" | null */
  function ustalikSeviyesi(s) {
    if (!s || !(s.toplam > 0) || !(s.cevap > 0)) return null;
    var oran = Math.min(1, s.cevap / s.toplam), dog = s.dogruIlk / s.cevap;
    if (oran >= 1 && dog >= ESIK.altin.dogru && !s.acikYanlis) return "altin";
    if (oran >= ESIK.gumus.cevap && dog >= ESIK.gumus.dogru) return "gumus";
    if (oran >= ESIK.bronz.cevap && dog >= ESIK.bronz.dogru) return "bronz";
    return null;
  }
  /**
   * Saf: ünite istatistiği. sayfaKaydi = quiz:v1.pages[sayfa], kutular = ünitenin soru kutuları, bankaSoru = bankadaki soru
   * sayısı (kutu açılmamışsa), hatalar = errors:v1.items ("<sayfa>|<soruId>" → { resolved }).
   */
  function uniteIstatistik(sayfa, sayfaKaydi, kutular, bankaSoru, hatalar) {
    var units = sayfaKaydi && isObj(sayfaKaydi.units) ? sayfaKaydi.units : {};
    var h = isObj(hatalar) ? hatalar : {};
    var r = { toplam: 0, cevap: 0, dogruIlk: 0, acikYanlis: 0 }, hepsi = (kutular || []).length > 0;
    (kutular || []).forEach(function (k) {
      var u = units[k];
      if (!u || !(+u.total > 0)) hepsi = false;
      if (!u) return;
      r.toplam += +u.total || 0;
      var ans = isObj(u.answers) ? u.answers : {};
      Object.keys(ans).forEach(function (q) {
        var a = ans[q] || {}, hk = h[sayfa + "|" + q];
        r.cevap++;
        var yanlisOldu = !a.c || !!hk;
        if (!yanlisOldu) r.dogruIlk++;
        if (!a.c || (hk && !hk.resolved)) r.acikYanlis++;
      });
    });
    if (!hepsi) r.toplam = Math.max(r.toplam, +bankaSoru || 0);
    r.seviye = ustalikSeviyesi(r);
    return r;
  }
  /** Saf: kayıtlı seviyeyi yükseltir. Dönüş: { ustalik, yeni: seviye | null } (yalnızca daha yüksek seviye "yeni"dir) */
  function ustalikIlerle(ustalik, anahtar, seviye, t) {
    var u = isObj(ustalik) ? ustalik : {};
    var o = u[anahtar];
    if (!seviye || (o && SIRA[o.seviye] >= SIRA[seviye])) return { ustalik: u, yeni: null };
    u[anahtar] = { seviye: seviye, t: t };
    return { ustalik: u, yeni: seviye };
  }
  function ozet32(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  /** Saf: ay anahtarı "YYYY-MM" → belirlenimli hedef { tur: "soru"|"gun", miktar, ad } */
  function aylikHedef(ay) {
    var s = AYLIK_SECENEK[ozet32("aylik:" + ay) % AYLIK_SECENEK.length];
    var adAy = AY_AD[+String(ay).slice(5, 7) - 1] || "";
    return { tur: s.tur, miktar: s.miktar, ad: s.tur === "soru" ? adAy + " ayında " + s.miktar + " soru çöz" : adAy + " ayında " + s.miktar + " gün çalış" };
  }
  /** Saf: hedefe ilerleme. cevaplar: [{ gun }], denemeGunleri: ["YYYY-MM-DD"] */
  function aylikIlerleme(hedef, ay, cevaplar, denemeGunleri) {
    var pre = String(ay) + "-";
    if (hedef.tur === "soru") return (cevaplar || []).filter(function (a) { return a.gun && a.gun.indexOf(pre) === 0; }).length;
    var s = {};
    (cevaplar || []).forEach(function (a) { if (a.gun && a.gun.indexOf(pre) === 0) s[a.gun] = 1; });
    (denemeGunleri || []).forEach(function (g) { if (g && String(g).indexOf(pre) === 0) s[g] = 1; });
    return Object.keys(s).length;
  }
  /** Saf: ayın kalan günü (bugün dahil). bugun "YYYY-MM-DD" */
  function ayKalanGun(bugun) {
    var a = String(bugun).split("-").map(Number);
    var son = new Date(Date.UTC(a[0], a[1], 0)).getUTCDate();
    return son - a[2] + 1;
  }
  /** Saf: aylık kart bağlamsal alana çıksın mı? (hedefe yakın ≥ %80 ya da son 5 gün ve ≥ %50; tamamlandıysa hayır) */
  function aylikOne(deger, hedef, bugun) {
    if (deger >= hedef.miktar) return false;
    var o = deger / hedef.miktar;
    return o >= 0.8 || (ayKalanGun(bugun) <= 5 && o >= 0.5);
  }
  /**
   * Saf: geçen haftanın özeti. cevaplar: [{ sayfa, kap, c, gun }], denemeGunleri: [gün], basliklar: kap → ünite başlığı,
   * pzt: geçen haftanın pazartesisi, gunEkle: (gün, n) → gün. Dönüş: { soru, dogru, dogruluk, xp, gun, enIyiDers, gelisenUnite }
   */
  function haftaOzeti(cevaplar, denemeGunleri, basliklar, pzt, gunEkle) {
    var paz = gunEkle(pzt, 6), ic = function (g) { return g && g >= pzt && g <= paz; };
    var r = { soru: 0, dogru: 0, dogruluk: 0, xp: 0, gun: 0, enIyiDers: null, gelisenUnite: null };
    var gunler = {}, ders = {}, unite = {};
    (cevaplar || []).forEach(function (a) {
      if (!ic(a.gun)) return;
      r.soru++; if (a.c) r.dogru++;
      gunler[a.gun] = 1;
      ders[a.sayfa] = (ders[a.sayfa] || 0) + 1;
      var k = a.sayfa + "|" + a.kap;
      if (!unite[k]) unite[k] = { kap: a.kap, dogru: 0, n: 0 };
      unite[k].n++; if (a.c) unite[k].dogru++;
    });
    var den = (denemeGunleri || []).filter(ic);
    den.forEach(function (g) { gunler[g] = 1; });
    r.xp = r.soru * 5 + r.dogru * 5 + den.length * 50; // = oyun.js XP (lig kuralı)
    r.dogruluk = r.soru ? Math.round(r.dogru / r.soru * 100) : 0;
    r.gun = Object.keys(gunler).length;
    var enD = null; Object.keys(ders).forEach(function (s) { if (!enD || ders[s] > ders[enD]) enD = s; });
    if (enD) r.enIyiDers = KISA[enD] || enD;
    var enU = null; Object.keys(unite).forEach(function (k) { if (!enU || unite[k].dogru > unite[enU].dogru) enU = k; });
    if (enU && unite[enU].dogru > 0) r.gelisenUnite = String((basliklar && basliklar[unite[enU].kap]) || unite[enU].kap).replace(/\s+/g, " ").trim().slice(0, 70);
    return r;
  }
  /** Saf: haftalık özet bugün gösterilsin mi? (yalnız pazartesi, haftada bir, geçen hafta en az 1 soru) */
  function ozetGosterilsinMi(haftalik, hafta, haftaGunu, soru) {
    return haftaGunu === 1 && !(isObj(haftalik) && haftalik[hafta]) && soru > 0;
  }

  var CEKIRDEK = {
    SEVIYELER: SEVIYELER, SEVIYE_AD: SEVIYE_AD, ESIK: ESIK, AYLIK_SECENEK: AYLIK_SECENEK,
    ustalikSeviyesi: ustalikSeviyesi, uniteIstatistik: uniteIstatistik, ustalikIlerle: ustalikIlerle,
    aylikHedef: aylikHedef, aylikIlerleme: aylikIlerleme, ayKalanGun: ayKalanGun, aylikOne: aylikOne,
    haftaOzeti: haftaOzeti, ozetGosterilsinMi: ozetGosterilsinMi
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = CEKIRDEK; return; }
  if (typeof window === "undefined" || typeof document === "undefined" || window.MEBERRA_OYUN_EK) return;
  window.MEBERRA_OYUN_EK = CEKIRDEK;

  // =====================================================================================
  // 2. TARAYICI
  // =====================================================================================
  var K = { oyun: "apmeberra:oyun:v1", quiz: "apmeberra:quiz:v1", hata: "apmeberra:errors:v1", seri: "apmeberra:seri:v1" };
  function O() { return window.MEBERRA_OYUN || null; }
  function oku(k, v) { try { var r = localStorage.getItem(k); return r == null ? v : JSON.parse(r); } catch (e) { return v; } }
  function yaz(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* depo dolu / kapalı */ } }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
  function sayiTR(n) { try { return Number(n).toLocaleString("tr-TR"); } catch (e) { return String(n); } }
  function oyunOku() { var o = oku(K.oyun, null); return isObj(o) ? o : {}; }
  function ME() { return window.APMEBERRA_ME || null; }
  function oturumVar() { var m = ME(); return !!(m && m.user); }
  function ilkAd() { var m = ME(); return m && m.user ? String(m.user.ad || "").trim().split(/\s+/)[0] : ""; }
  function kutla(o) {
    var n = 0;
    (function dene() {
      if (window.MeberraKutlama) { window.MeberraKutlama.kutla(o); return; }
      if (n++ < 20) setTimeout(dene, 150);
    })();
  }
  function denemeGunleri() {
    var C = O(); if (!C) return [];
    var A = window.APMEBERRA, l = [];
    try { l = A && A.denemeler ? A.denemeler() : []; } catch (e) { l = []; }
    return (l || []).map(function (d) { return d && C.istGun(d.tarih); }).filter(Boolean);
  }
  var MADALYA = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 2h4l1 4-3 3zM17 2h-4l-1 4 3 3z" fill="currentColor" opacity=".55"/><circle cx="12" cy="15" r="6" fill="currentColor"/><path d="m12 12 .9 1.9 2.1.3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L9 14.2l2.1-.3z" fill="#fff" opacity=".9"/></svg>';
  var TAC = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="currentColor"/><rect x="5" y="19.5" width="14" height="2" rx="1" fill="currentColor" opacity=".7"/></svg>';

  // --- 2a. Ünite ustalığı -----------------------------------------------------------------
  /** Sayfanın ünite listesi: [{ no, kutular, soru }] — ders sayfasında APMEBERRA_UNITELER, yoksa oyun.js YOL */
  function uniteler(sayfa) {
    var U = window.APMEBERRA_UNITELER;
    if (U && U.page === sayfa && Array.isArray(U.uniteler)) return U.uniteler.map(function (u) { return { no: u.no, ad: u.ad, kutular: u.kutular, soru: u.toplam }; });
    var C = O();
    return C && C.yolListesi ? C.yolListesi(sayfa) : [];
  }
  function istatistik(sayfa, u, pr, hatalar) {
    return uniteIstatistik(sayfa, pr.pages && pr.pages[sayfa], u.kutular, u.soru, hatalar);
  }
  /** Ustalık değerlendirmesi. sessiz: kutlama yok (ilk açılış / başka cihazdan gelen veri) */
  function ustalikDegerlendir(sayfalar, sessiz) {
    var pr = oku(K.quiz, null) || {}, hata = oku(K.hata, null) || {}, hatalar = isObj(hata.items) ? hata.items : {};
    var o = oyunOku(), yeni = [];
    var ust = isObj(o.ustalik) ? o.ustalik : {};
    sayfalar.forEach(function (sayfa) {
      uniteler(sayfa).forEach(function (u) {
        var s = istatistik(sayfa, u, pr, hatalar);
        if (!s.seviye) return;
        var r = ustalikIlerle(ust, sayfa + "|" + u.no, s.seviye, Date.now());
        ust = r.ustalik;
        if (r.yeni) yeni.push({ sayfa: sayfa, no: u.no, seviye: r.yeni, ad: u.ad || (pr.pages && pr.pages[sayfa] && pr.pages[sayfa].units && u.kutular && (pr.pages[sayfa].units[u.kutular[0]] || {}).title) || "" });
      });
    });
    if (!yeni.length) return;
    o.ustalik = ust;
    yaz(K.oyun, o);
    if (!sessiz) yeni.forEach(function (y) {
      var ad = SEVIYE_AD[y.seviye];
      kutla({
        tur: y.seviye === "altin" ? "unite" : "rozet", buyuk: y.seviye === "altin", ifade: "kutlama",
        baslik: "Ustalık: " + ad + "!", metin: (KISA[y.sayfa] ? KISA[y.sayfa] + " · " : "") + "Ünite " + y.no + (y.seviye === "altin" ? " — bu üniteyi tam anlamıyla öğrendin." : " — harika ilerliyorsun."),
        paylas: y.seviye === "altin" ? { baslik: "Altın ustalık!", alt: String(y.ad || ("Ünite " + y.no)).replace(/\s+/g, " ").trim().slice(0, 80), ders: KISA[y.sayfa] || "", ad: ilkAd() } : undefined
      });
    });
    rozetleriIsle();
  }
  function tumSayfalar() { var C = O(); return C && C.YOL ? Object.keys(C.YOL) : []; }

  /** Yol düğümlerine madalya (yeniden çizimde kendiliğinden yenilenir) */
  function dugumSayfa(a) {
    var yer = a.closest("[data-yol]");
    if (yer) return yer.getAttribute("data-yol");
    if (a.closest(".oy-yol-ders")) { var U = window.APMEBERRA_UNITELER; return U && U.page; }
    return null;
  }
  function rozetleriIsle() {
    var linkler = document.querySelectorAll(".cn-yol a.cn-dugum__git, .oy-yol a.oy-dugum");
    if (!linkler.length) return;
    var ust = oyunOku().ustalik;
    ust = isObj(ust) ? ust : {};
    Array.prototype.forEach.call(linkler, function (a) {
      var sayfa = dugumSayfa(a), m = /[?&]unite=([^&#]+)/.exec(a.getAttribute("href") || "");
      if (!sayfa || !m) return;
      var k = ust[sayfa + "|" + decodeURIComponent(m[1])], sev = k && SIRA[k.seviye] ? k.seviye : "";
      if ((a.getAttribute("data-oe-ustalik") || "") === sev) return;
      a.setAttribute("data-oe-ustalik", sev);
      var eski = a.querySelector(".oe-ustalik");
      if (eski) eski.parentNode.removeChild(eski);
      var etiket = a.getAttribute("aria-label") || "";
      etiket = etiket.replace(/ · Ustalık: \S+$/, "");
      if (!sev) { if (etiket) a.setAttribute("aria-label", etiket); return; }
      var s = document.createElement("span");
      s.className = "oe-ustalik oe-ustalik--" + sev;
      s.setAttribute("aria-hidden", "true");
      s.title = "Ustalık: " + SEVIYE_AD[sev];
      s.innerHTML = sev === "altin" ? TAC : MADALYA;
      (a.querySelector(".cn-dugum__daire") || a).appendChild(s);
      if (etiket) a.setAttribute("aria-label", etiket + " · Ustalık: " + SEVIYE_AD[sev]);
      if (a.title) a.title = a.title.replace(/ · Ustalık: \S+$/, "") + " · Ustalık: " + SEVIYE_AD[sev];
    });
  }

  // --- 2b. Aylık görev ----------------------------------------------------------------------
  function aylikDurum() {
    var C = O(); if (!C) return null;
    var bugun = C.istGun(Date.now()), ay = bugun.slice(0, 7), hedef = aylikHedef(ay);
    var deger = aylikIlerleme(hedef, ay, C.cevapListesi(oku(K.quiz, null) || {}), denemeGunleri());
    var o = oyunOku(), kayit = isObj(o.aylik) ? o.aylik[ay] : null;
    return { bugun: bugun, ay: ay, hedef: hedef, deger: Math.min(deger, hedef.miktar), tamam: !!(kayit && kayit.tamam) || deger >= hedef.miktar };
  }
  function aylikDegerlendir(sessiz) {
    var d = aylikDurum(); if (!d) return;
    var o = oyunOku();
    o.aylik = isObj(o.aylik) ? o.aylik : {};
    var k = o.aylik[d.ay];
    if (d.deger >= d.hedef.miktar && !(k && k.tamam)) {
      var t = Date.now();
      o.aylik[d.ay] = { hedef: { tur: d.hedef.tur, miktar: d.hedef.miktar }, tamam: true, t: t };
      o.rozetler = isObj(o.rozetler) ? o.rozetler : {};
      if (!o.rozetler["aylik-" + d.ay]) o.rozetler["aylik-" + d.ay] = { t: t };
      yaz(K.oyun, o);
      if (!sessiz) kutla({ tur: "hedef", buyuk: true, ifade: "kutlama", baslik: "Aylık görev tamam!", metin: d.hedef.ad + " — " + AY_AD[+d.ay.slice(5) - 1] + " rozeti senin.",
        paylas: { baslik: "Aylık görev tamam!", alt: d.hedef.ad, ad: ilkAd() } });
    } else if (!k) {
      o.aylik[d.ay] = { hedef: { tur: d.hedef.tur, miktar: d.hedef.miktar }, tamam: false, t: Date.now() };
      yaz(K.oyun, o);
    }
    aylikCiz();
  }
  function aylikHtml(d, kompakt) {
    var y = Math.round(d.deger / d.hedef.miktar * 100), kalan = ayKalanGun(d.bugun);
    var alt = d.tamam ? "Tamamlandı. Bu ayın rozeti senin!" : (d.hedef.miktar - d.deger) + (d.hedef.tur === "soru" ? " soru" : " gün") + " kaldı · ayın bitmesine " + kalan + " gün";
    return '<div class="surface oe-aylik' + (d.tamam ? " is-tamam" : "") + (kompakt ? " oe-aylik--one" : "") + '" role="group" aria-labelledby="oe-aylik-h' + (kompakt ? "2" : "") + '">' +
      '<span class="oe-aylik-ik" aria-hidden="true">' + (d.tamam ? TAC : MADALYA) + "</span>" +
      '<span class="oe-aylik-govde"><span class="oe-aylik-ust"><strong id="oe-aylik-h' + (kompakt ? "2" : "") + '">Aylık görev</strong><span class="oe-aylik-sayi">' + sayiTR(d.deger) + " / " + sayiTR(d.hedef.miktar) + "</span></span>" +
      '<span class="oe-aylik-ad">' + esc(d.hedef.ad) + "</span>" +
      '<span class="oy-cubuk oe-cubuk" role="progressbar" aria-label="Aylık görev" aria-valuemin="0" aria-valuemax="' + d.hedef.miktar + '" aria-valuenow="' + d.deger + '"><i style="--w:' + y + '%"></i></span>' +
      '<small class="oe-aylik-alt">' + esc(alt) + "</small></span></div>";
  }
  function aylikCiz() {
    var yer = document.getElementById("oe-aylik"), one = document.getElementById("oe-aylik-baglam");
    if (!yer && !one) return;
    var d = aylikDurum(); if (!d) return;
    if (yer) yer.innerHTML = aylikHtml(d, false);
    if (one) {
      var bg = document.getElementById("bg-baglam");
      var goster = aylikOne(d.deger, d.hedef, d.bugun) && !(bg && bg.children.length);
      one.innerHTML = goster ? aylikHtml(d, true) : "";
      one.hidden = !goster;
    }
  }
  /** İlerleme › Rozetler: aya özel rozetler oyun.js listesinin sonuna eklenir */
  function ayRozetleri() {
    var ul = document.getElementById("rozet-liste");
    if (!ul) return;
    var roz = oyunOku().rozetler; roz = isObj(roz) ? roz : {};
    var aylar = Object.keys(roz).filter(function (k) { return /^aylik-\d{4}-\d{2}$/.test(k); }).sort().reverse();
    var imza = aylar.join(",");
    if (ul.getAttribute("data-oe-ay") === imza && (!aylar.length || ul.querySelector(".oe-ay-rozet"))) return;
    Array.prototype.forEach.call(ul.querySelectorAll(".oe-ay-rozet"), function (x) { x.parentNode.removeChild(x); });
    ul.setAttribute("data-oe-ay", imza);
    aylar.forEach(function (k) {
      var ay = k.slice(6), t = Number(roz[k].t), h = aylikHedef(ay), li = document.createElement("li");
      li.className = "oy-rozet is-kazanildi oe-ay-rozet";
      li.innerHTML = '<span class="oy-rozet-ik">' + TAC + "</span><strong>" + esc(AY_AD[+ay.slice(5) - 1] + " " + ay.slice(0, 4)) + "</strong><small>Aylık görev: " + esc(h.ad.replace(/^\S+ ayında /, "")) + "</small>" +
        '<span class="oy-rozet-durum">' + (isFinite(t) && t > 0 ? new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }) : "Kazanıldı") + "</span>";
      ul.appendChild(li);
    });
  }

  // --- 2c. Haftan nasıldı? ------------------------------------------------------------------
  function haftalikKur() {
    var yer = document.getElementById("oe-haftalik");
    var C = O();
    if (!yer || !C || !oturumVar() || yer.getAttribute("data-oe")) return;
    yer.setAttribute("data-oe", "1");
    var simdi = Date.now(), bugun = C.istGun(simdi), hafta = C.isoHafta(bugun);
    var haftaGunu = new Date(bugun + "T12:00:00Z").getUTCDay() || 7;
    var pzt = C.gunEkle(C.haftaPazartesi(bugun), -7);
    var pr = oku(K.quiz, null) || {}, cev = C.cevapListesi(pr), basliklar = {};
    Object.keys(isObj(pr.pages) ? pr.pages : {}).forEach(function (p) { var u = pr.pages[p] && pr.pages[p].units; if (isObj(u)) Object.keys(u).forEach(function (k) { if (u[k] && u[k].title) basliklar[k] = u[k].title; }); });
    var dg = denemeGunleri();
    var oz = haftaOzeti(cev, dg, basliklar, pzt, C.gunEkle);
    var o = oyunOku();
    if (!ozetGosterilsinMi(o.haftalik, hafta, haftaGunu, oz.soru)) return;
    o.haftalik = isObj(o.haftalik) ? o.haftalik : {};
    o.haftalik[hafta] = simdi;
    yaz(K.oyun, o);
    var seriV = oku(K.seri, null) || {};
    var seri = C.seriHesapla(C.calismaGunleri(cev, (window.APMEBERRA && window.APMEBERRA.denemeler ? (function () { try { return window.APMEBERRA.denemeler(); } catch (e) { return []; } })() : [])),
      Array.isArray(seriV.donmus) ? seriV.donmus : [], bugun);
    var M = window.MeberraMaskot;
    var satir = function (b, k) { return "<li><b>" + b + "</b><span>" + esc(k) + "</span></li>"; };
    yer.innerHTML = '<section class="surface oe-hafta" aria-labelledby="oe-hafta-h">' +
      '<span class="oe-hafta-tilo" aria-hidden="true">' + (M && M.html ? M.html("sevincli", { boyut: 64, etiket: false }) : "") + "</span>" +
      '<div class="oe-hafta-govde"><h2 id="oe-hafta-h" tabindex="-1">Haftan nasıldı?</h2>' +
      '<p class="oe-hafta-alt">' + esc(ilkAd() ? ilkAd() + ", geçen hafta" : "Geçen hafta") + " " + oz.gun + " gün çalıştın. Güzel bir ritim!</p>" +
      '<ul class="oe-hafta-liste">' + satir(sayiTR(oz.soru), "soru") + satir("%" + oz.dogruluk, "doğruluk") + satir(sayiTR(oz.xp), "XP") + satir(String(seri), "gün seri") + "</ul>" +
      (oz.enIyiDers || oz.gelisenUnite ? '<p class="oe-hafta-not">' + (oz.enIyiDers ? "En çok çalıştığın ders: <b>" + esc(oz.enIyiDers) + "</b>. " : "") + (oz.gelisenUnite ? "Gelişen ünite: <b>" + esc(oz.gelisenUnite) + "</b>." : "") + "</p>" : "") +
      '<div class="oe-hafta-eylem"><button type="button" class="btn-ghost btn-sm" data-oe="paylas">Paylaş</button><button type="button" class="btn-ghost btn-sm" data-oe="kapat">Kapat</button></div>' +
      "</div></section>";
    yer.addEventListener("click", function (e) {
      var b = e.target.closest("[data-oe]");
      if (!b) return;
      if (b.getAttribute("data-oe") === "kapat") { yer.innerHTML = ""; var h = document.getElementById("today-title"); if (h && h.focus) h.focus(); return; }
      if (b.getAttribute("data-oe") === "paylas" && window.MeberraKutlama && window.MeberraKutlama.paylas) {
        b.disabled = true;
        window.MeberraKutlama.paylas({ baslik: "Haftam: " + oz.soru + " soru", alt: "%" + oz.dogruluk + " doğruluk · " + oz.xp + " XP" + (oz.enIyiDers ? " · " + oz.enIyiDers : ""), ders: oz.enIyiDers || "", ad: ilkAd() })
          .then(function () { b.disabled = false; }, function () { b.disabled = false; });
      }
    });
  }

  // --- 2d. Profil: önerilen hatırlatma saati -------------------------------------------------
  var saatBilgi = null, saatIstendi = false;
  function saatOnerisi() {
    var sec = document.getElementById("bd-a-saat");
    if (!sec || sec.getAttribute("data-oe")) return;
    if (!saatBilgi) {
      if (saatIstendi || !window.fetch) return;
      saatIstendi = true;
      fetch("/api/bildirim-ayarlari", { credentials: "same-origin" }).then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (j && j.ok) { saatBilgi = j; saatOnerisi(); } }).catch(function () { /* isteğe bağlı */ });
      return;
    }
    var h = saatBilgi.onerilenSaat;
    if (typeof h !== "number") return;
    sec.setAttribute("data-oe", "1");
    var satir = sec.closest(".bd-anahtar-satir") || sec.parentNode;
    var p = document.createElement("p");
    p.className = "field-hint oe-saat-oneri";
    var hh = (h < 10 ? "0" : "") + h + ":00";
    var otomatik = !saatBilgi.saatElle;
    p.innerHTML = "Önerilen: <b>" + hh + "</b> (en çok bu saatte çalışıyorsun)" + (otomatik ? ". Saat seçmediğin sürece hatırlatma bu saatte gelir." : "") +
      (Number(sec.value) !== h ? ' — <button type="button" class="oy-link" data-oe-saat="' + h + '">Kullan</button>' : "");
    satir.parentNode.insertBefore(p, satir.nextSibling);
    p.addEventListener("click", function (e) {
      var b = e.target.closest("[data-oe-saat]");
      if (!b) return;
      sec.value = String(h);
      sec.dispatchEvent(new Event("change", { bubbles: true }));
      saatBilgi.saatElle = true;
      b.parentNode.removeChild(b);
      p.innerHTML = p.innerHTML.replace(/ — $/, "").replace(/\. Saat seçmediğin.*$/, "");
    });
  }

  // --- 2e. Kurulum --------------------------------------------------------------------------
  var bekliyor = false;
  function domIsle() {
    if (bekliyor) return;
    bekliyor = true;
    (window.requestAnimationFrame || setTimeout)(function () { bekliyor = false; rozetleriIsle(); ayRozetleri(); saatOnerisi(); });
  }
  function kur() {
    if (!O()) { if ((kur.n = (kur.n || 0) + 1) < 40) setTimeout(kur, 100); return; }
    try { ustalikDegerlendir(tumSayfalar(), true); } catch (e) { /* yok say */ }
    try { aylikDegerlendir(true); } catch (e) { /* yok say */ }
    try { haftalikKur(); } catch (e) { /* yok say */ }
    domIsle();
    if (window.MutationObserver) new MutationObserver(domIsle).observe(document.body, { childList: true, subtree: true });
    window.addEventListener("meberra:cevap", function (e) {
      var d = (e && e.detail) || {};
      if (!d.sayfa) return;
      try { ustalikDegerlendir([d.sayfa], false); aylikDegerlendir(false); } catch (x) { /* yok say */ }
    });
    window.addEventListener("meberra:oyun", function () { domIsle(); aylikCiz(); });
    window.addEventListener("storage", function (e) {
      if (!e.key || /^apmeberra:(oyun|quiz|errors)/.test(e.key)) { try { ustalikDegerlendir(tumSayfalar(), true); aylikDegerlendir(true); } catch (x) { /* yok say */ } domIsle(); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", kur); else kur();
})();
