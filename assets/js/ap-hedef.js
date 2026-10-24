/**
 * Meberra 1.7.0 — AP ders seçimi, hedef puan ve sınav yılı (UMD: tarayıcı + sunucu aynı dosyayı kullanır).
 * Tarayıcıda window.APMEBERRA_AP_HEDEF; Node'da require("../assets/js/ap-hedef").
 *
 * Profil alanları (hepsi isteğe bağlı; karşılamada "Sonra" ile atlanabilir):
 *   apDersleri: [{ ders: "calculus-ab", hedef: 3|4|5 }]  (ders anahtarları data/mevzuat/sinav-takvimi.js > sinavlar ile aynı)
 *   sinavYili:  2027 | 2028 | 2029 …                     (AP sınavları her yıl Mayıs'ta)
 *   apHedefSoruldu: ISO                                  (Bugün'deki tek seferlik "derslerini seç" kartı bir daha gösterilmez)
 * Ders → sayfa eşlemesi sitenin ders sayfalarından gelir (ap-calculus, ap-physics, ap-chemistry, ap-biology, ap-english,
 * ap-electives; 1.28.0: ap-precalculus, ap-statistics, ap-physics-2). Seçmeliler sayfasında üç ders vardır; ünite (soru kutusu) kimliğinin önekiyle ayrılır.
 */
(function (kok, fabrika) {
  "use strict";
  var api = fabrika();
  if (typeof module === "object" && module.exports) module.exports = api;
  else kok.APMEBERRA_AP_HEDEF = api;
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";
  // kutu: ders bir sayfayı başka derslerle paylaşıyorsa o derse ait soru kutularının öneki (RegExp kaynağı)
  var DERSLER = [
    { ders: "calculus-ab", ad: "Calculus AB", sayfa: "ap-calculus", deneme: "calculus-ab" },
    { ders: "calculus-bc", ad: "Calculus BC", sayfa: "ap-calculus", deneme: "calculus-bc" },
    { ders: "precalculus", ad: "Precalculus", sayfa: "ap-precalculus", deneme: "precalculus" }, // 1.28.0
    { ders: "statistics", ad: "Statistics", sayfa: "ap-statistics", deneme: "statistics" }, // 1.28.0
    { ders: "physics-1", ad: "Physics 1", sayfa: "ap-physics", deneme: "physics-1" },
    { ders: "physics-2", ad: "Physics 2", sayfa: "ap-physics-2", deneme: "physics-2" }, // 1.28.0
    { ders: "chemistry", ad: "Chemistry", sayfa: "ap-chemistry", deneme: "chemistry" },
    { ders: "biology", ad: "Biology", sayfa: "ap-biology", deneme: "biology" },
    { ders: "english-language", ad: "English Language", sayfa: "ap-english", deneme: "english-language" },
    { ders: "computer-science-a", ad: "Computer Science A", kisa: "CS A", sayfa: "ap-electives", kutu: "^csa", deneme: "cs-a" },
    { ders: "microeconomics", ad: "Microeconomics", sayfa: "ap-electives", kutu: "^(micro|econ)", deneme: "economics" },
    { ders: "macroeconomics", ad: "Macroeconomics", sayfa: "ap-electives", kutu: "^(macro|econ)", deneme: "economics" }
  ];
  var HEDEFLER = [3, 4, 5];
  var VARSAYILAN_HEDEF = 4;
  // Deneme yüzdesi → tahmini AP puanı (server/sorubankasi.js BAND_ESIK ile aynı; sunucu testi eşitliği denetler)
  var BAND_ESIK = [{ min: 72, band: 5 }, { min: 58, band: 4 }, { min: 44, band: 3 }, { min: 30, band: 2 }, { min: 0, band: 1 }];

  var dersBul = function (d) { for (var i = 0; i < DERSLER.length; i++) if (DERSLER[i].ders === d) return DERSLER[i]; return null; };
  var tarihAl = function (now) { return now instanceof Date ? now : now ? new Date(now) : new Date(); };

  /** Bir sonraki AP sınav dönemi (Mayıs) yılı: Haziran'dan itibaren bir sonraki yıl. */
  function siradakiSinavYili(now) {
    var d = tarihAl(now);
    return d.getMonth() >= 5 ? d.getFullYear() + 1 : d.getFullYear();
  }
  /** Seçilebilir sınav yılları: sıradaki + 2 yıl (ör. 2027, 2028, 2029). */
  function sinavYillari(now) { var y = siradakiSinavYili(now); return [y, y + 1, y + 2]; }
  /** Sınıfa göre varsayılan sınav yılı: 11–12 ve mezun sıradaki dönem, 10 bir yıl sonra, 9 iki yıl sonra. */
  function varsayilanSinavYili(sinif, now) {
    var y = siradakiSinavYili(now), s = String(sinif == null ? "" : sinif);
    return s === "9" ? y + 2 : s === "10" ? y + 1 : y;
  }

  /**
   * Profil alanlarını doğrular ve normalleştirir. Yalnızca p içinde VAR olan alanlar dönüşe girer.
   * Dönüş: { ok, deger: { apDersleri?, sinavYili?, apHedefSoruldu? }, hatalar: { alan: mesaj } }
   */
  function dogrula(p, now) {
    p = p && typeof p === "object" ? p : {};
    var has = function (k) { return Object.prototype.hasOwnProperty.call(p, k) && p[k] !== undefined; };
    var deger = {}, hatalar = {};
    if (has("apDersleri")) {
      var l = p.apDersleri;
      if (l === null) deger.apDersleri = [];
      else if (!Array.isArray(l)) hatalar.apDersleri = "AP dersleri bir liste olmalı.";
      else if (l.length > DERSLER.length) hatalar.apDersleri = "En fazla " + DERSLER.length + " ders seçebilirsin.";
      else {
        var gor = {}, out = [];
        for (var i = 0; i < l.length; i++) {
          var x = l[i] || {}, d = typeof x === "string" ? x : x.ders, h = typeof x === "string" ? VARSAYILAN_HEDEF : x.hedef;
          if (h === undefined || h === null || h === "") h = VARSAYILAN_HEDEF;
          if (!dersBul(d)) { hatalar.apDersleri = "Listede olmayan bir ders seçildi."; break; }
          if (gor[d]) { hatalar.apDersleri = "Aynı ders iki kez seçilemez."; break; }
          if (HEDEFLER.indexOf(+h) < 0 || String(+h) !== String(h).trim()) { hatalar.apDersleri = "Hedef puan 3, 4 ya da 5 olmalı."; break; }
          gor[d] = 1; out.push({ ders: d, hedef: +h });
        }
        if (!hatalar.apDersleri) deger.apDersleri = out;
      }
    }
    if (has("sinavYili")) {
      var y = p.sinavYili;
      if (y === null || y === "") deger.sinavYili = null;
      else {
        var yy = sinavYillari(now), alt = yy[0] - 1; // biten dönemin yılı (Mayıs–Haziran arası) da kabul edilir
        if (!/^\d{4}$/.test(String(y)) || +y < alt || +y > yy[2]) hatalar.sinavYili = "Sınav yılını " + yy[0] + "–" + yy[2] + " arasından seç.";
        else deger.sinavYili = +y;
      }
    }
    if (has("apHedefSoruldu")) {
      var t = p.apHedefSoruldu;
      if (t === null || t === "") deger.apHedefSoruldu = null;
      else if (typeof t !== "string" || t.length > 40 || isNaN(Date.parse(t))) hatalar.apHedefSoruldu = "Geçersiz zaman.";
      else deger.apHedefSoruldu = t;
    }
    return { ok: !Object.keys(hatalar).length, deger: deger, hatalar: hatalar };
  }

  /** Profil seçimini okur (geçersiz kayıtları atar). Dönüş: [{ ders, hedef, ad, sayfa, kutu?, deneme }] */
  function secilenler(profil) {
    var l = profil && Array.isArray(profil.apDersleri) ? profil.apDersleri : [];
    var out = [], gor = {};
    l.forEach(function (x) {
      var d = x && dersBul(x.ders);
      if (!d || gor[d.ders]) return;
      gor[d.ders] = 1;
      out.push({ ders: d.ders, hedef: HEDEFLER.indexOf(+x.hedef) >= 0 ? +x.hedef : VARSAYILAN_HEDEF, ad: d.ad, kisa: d.kisa || d.ad, sayfa: d.sayfa, kutu: d.kutu || null, deneme: d.deneme });
    });
    return out;
  }
  /** Profil AP seçimini hiç yapmamış mı (Bugün kartı için)? */
  function secimEksik(profil) {
    return !!profil && !(Array.isArray(profil.apDersleri) && profil.apDersleri.length) && !profil.apHedefSoruldu;
  }

  /**
   * Seçime göre süzgeç (saf). Seçim yoksa süzgeç yok: { var: false, sayfalar: [], uniteUygun: () => true }.
   * sayfalar: seçim sırasına göre tekil ders sayfaları · uniteUygun(sayfa, kutuId): ünite seçili bir derse ait mi
   * · denemeKodlari: seçilen derslerin deneme kodları (deneme.html?ders=)
   */
  function filtre(profil) {
    var s = secilenler(profil);
    if (!s.length) return { var: false, sayfalar: [], denemeKodlari: [], uniteUygun: function () { return true; }, sayfaSecili: function () { return true; } };
    var sayfalar = [], kod = [], kural = {};
    s.forEach(function (d) {
      if (sayfalar.indexOf(d.sayfa) < 0) sayfalar.push(d.sayfa);
      if (kod.indexOf(d.deneme) < 0) kod.push(d.deneme);
      (kural[d.sayfa] = kural[d.sayfa] || []).push(d.kutu ? new RegExp(d.kutu) : null);
    });
    return {
      var: true, sayfalar: sayfalar, denemeKodlari: kod,
      sayfaSecili: function (sayfa) { return !!kural[String(sayfa || "").replace(/\.html?$/i, "")]; },
      uniteUygun: function (sayfa, kutuId) {
        var k = kural[String(sayfa || "").replace(/\.html?$/i, "")];
        if (!k) return false;
        return k.some(function (re) { return !re || re.test(String(kutuId || "")); });
      }
    };
  }
  /** Listeyi seçili sayfalar önce (seçim sırasıyla), diğerleri kendi sırasıyla gelecek şekilde sıralar. anahtar: öğe → sayfa */
  function oneAl(liste, profil, anahtar) {
    var f = filtre(profil);
    if (!f.var) return (liste || []).slice();
    var al = anahtar || function (x) { return x && x.page; };
    var sira = function (x) { var i = f.sayfalar.indexOf(String(al(x) || "").replace(/\.html?$/i, "")); return i < 0 ? 999 : i; };
    return (liste || []).map(function (x, i) { return { x: x, i: i }; })
      .sort(function (a, b) { return (sira(a.x) - sira(b.x)) || (a.i - b.i); }).map(function (o) { return o.x; });
  }

  /**
   * Seçilen derslerin sınav tarihleri. takvim: window.APMEBERRA_TAKVIM (sinavlar: {ders: {ad, tarih}}).
   * Takvimde o yılın tarihi varsa kesin; yoksa (ör. 2028) yalnızca "Mayıs <yıl>" (tarih uydurulmaz: gun null).
   * Dönüş: [{ ders, ad, hedef, yil, gun: "YYYY-MM-DD"|null, kesin: bool, etiket }] (tarihe göre sıralı)
   */
  function sinavTarihleri(profil, takvim, now) {
    var yil = profil && /^\d{4}$/.test(String(profil.sinavYili || "")) ? +profil.sinavYili : varsayilanSinavYili(profil && profil.sinif, now);
    var S = (takvim && takvim.sinavlar) || {};
    return secilenler(profil).map(function (d) {
      var t = S[d.ders] && /^\d{4}-\d{2}-\d{2}$/.test(S[d.ders].tarih || "") ? S[d.ders].tarih : null;
      var kesin = !!t && +t.slice(0, 4) === yil;
      return { ders: d.ders, ad: (S[d.ders] && S[d.ders].ad) || "AP " + d.ad, hedef: d.hedef, yil: yil, gun: kesin ? t : null, kesin: kesin,
        etiket: kesin ? t : "Mayıs " + yil };
    }).sort(function (a, b) { return String(a.gun || a.yil + "-05-99").localeCompare(String(b.gun || b.yil + "-05-99")); });
  }
  /**
   * Geri sayım: seçili derslerin en erken kesin sınav günü; yoksa takvimdeki sınav dönemi başlangıcı (yıl eşleşirse);
   * o da yoksa yalnızca yıl (gun null → "Mayıs 2028"). Dönüş: { yil, gun|null, kesin, ders|null }
   */
  function geriSayim(profil, takvim, now) {
    var yil = profil && /^\d{4}$/.test(String(profil.sinavYili || "")) ? +profil.sinavYili : varsayilanSinavYili(profil && profil.sinif, now);
    var t = sinavTarihleri(profil, takvim, now).filter(function (x) { return x.kesin; })[0];
    if (t) return { yil: yil, gun: t.gun, kesin: true, ders: t.ad };
    var bas = takvim && takvim.sinavDonemi && takvim.sinavDonemi.bas;
    if (bas && +String(bas).slice(0, 4) === yil) return { yil: yil, gun: bas, kesin: true, ders: null };
    return { yil: yil, gun: null, kesin: false, ders: null };
  }
  /** Deneme/ders doğruluk yüzdesinden tahmini AP puanı (1–5). */
  function tahminiPuan(yuzde) {
    if (yuzde === null || yuzde === undefined || isNaN(+yuzde)) return null;
    for (var i = 0; i < BAND_ESIK.length; i++) if (+yuzde >= BAND_ESIK[i].min) return BAND_ESIK[i].band;
    return 1;
  }

  return {
    DERSLER: DERSLER, HEDEFLER: HEDEFLER, VARSAYILAN_HEDEF: VARSAYILAN_HEDEF, BAND_ESIK: BAND_ESIK,
    dersBul: dersBul, siradakiSinavYili: siradakiSinavYili, sinavYillari: sinavYillari, varsayilanSinavYili: varsayilanSinavYili,
    dogrula: dogrula, secilenler: secilenler, secimEksik: secimEksik, filtre: filtre, oneAl: oneAl,
    sinavTarihleri: sinavTarihleri, geriSayim: geriSayim, tahminiPuan: tahminiPuan
  };
});
