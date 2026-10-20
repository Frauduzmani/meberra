/**
 * Meberra — Sınav süzgeci motoru (Ajan 11, Tur 12; plan .agents/rules/tur12-ekran-plani.md S1–S8)
 * Veri: data/mevzuat/sinavlar.js (window.APMEBERRA_SINAVLAR). Saf fonksiyonlar: DOM'a ve localStorage'a dokunmaz.
 * Tarayıcıda window.APMEBERRA_SINAV_MOTOR, Node'da module.exports (araclar/sinav-aktar.js ve birim testleri).
 *
 * Şema (spec §5.2) + Tur 12 isteğe bağlı alanları (yokken de çalışır):
 *   dil        "en" | "yerel" | ISO kodu ("de") | kod dizisi (["de","en"]) | Türkçe ad ("Almanca", "Lehçe / Çekçe / Macarca")
 *   duzey      ["lisans"] | ["yl"] | ["lisans","yl"]  (yoksa: AP ve Giriş Sınavı -> lisans; Dil Sınavı -> ikisi; gre*, gmat* -> yl)
 *   kesinlik   "Doğrulandı" | "Yoruma açık" | "Yayımlanmadı" | "Teyit gerekir" | "Doğrulanamadı"
 *   sonKontrol "YYYY-AA-GG" · ucret metin
 *
 *   secimCoz(search, profil)            -> {model, sinif, ulke, dil, duzey, filtre, kaynak:{model,ulke,dil}}
 *   secimAdres(sayfa, secim)            -> "sinavlar.html?model=lise&sinif=11&ulke=de&dil=yerel"
 *   sinavDilleri(s) / dilTuru(s, ulke, yerelDil) / dilUygun(s, dil, ulke, yerelDil)
 *   duzeyleri(s) / modelUygun(s, model) / ulkeUygun(s, ulke)
 *   suz(liste, secim, baglam)           -> süzülmüş liste (sıra korunur)
 *   sekmeSirasi(model) / apGizli(model)
 *   sinavDogrula(s) / listeDogrula(liste) -> sorun listesi
 *   birlestir(mevcut, gelen)            -> {liste, eklenen[], guncellenen[], atlanan[], sorunlar[]}  (sinav-aktar.js)
 *   ylGenelKaydi(madde, dizin)          -> yl-genel.dilSinavlari maddesinden sınav kaydı (test ve önizleme için)
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.APMEBERRA_SINAV_MOTOR = api;
  else if (root && !root.APMEBERRA_SINAV_MOTOR) root.APMEBERRA_SINAV_MOTOR = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var SURUM = "1.0.0";
  var KATEGORILER = ["AP", "Giriş Sınavı", "Dil Sınavı"];
  var MODELLER = ["lise", "lise-mezun", "uni-mezun"];
  var ULKE_KODLARI = ["de", "it", "at", "ch", "nl", "be", "fr", "es", "se", "fi", "dk", "ie", "hu", "pl", "cz"];
  var SINAV_DILLERI = ["hepsi", "en", "yerel"];
  var DUZEYLER = ["lisans", "yl"];
  var KESINLIKLER = ["Doğrulandı", "Yoruma açık", "Yayımlanmadı", "Teyit gerekir", "Doğrulanamadı"];
  var DURUMLAR = ["hazir", "kismi", "yakinda"];
  var FILTRELER = ["rota", "listem", "profil"];
  /** Ülkenin öğretim dili (yerel) kodları; ulke-dizini.js ile aynı. Dizin verilirse o kullanılır. */
  var YEREL_DIL = { de: ["de"], it: ["it"], at: ["de"], ch: ["de", "fr", "it"], nl: ["nl"], be: ["nl", "fr"], fr: ["fr"], es: ["es"], se: ["sv"], fi: ["fi", "sv"], dk: ["da"], ie: ["en"], hu: ["hu"], pl: ["pl"], cz: ["cs"] };
  var DIL_AD = { en: "İngilizce", de: "Almanca", fr: "Fransızca", it: "İtalyanca", es: "İspanyolca", nl: "Felemenkçe", sv: "İsveççe", fi: "Fince", da: "Danca", hu: "Macarca", pl: "Lehçe", cs: "Çekçe" };
  /** Türkçe dil adı -> kod (küçük harf, Türkçe karakterli; "Hollandaca" eş anlamlı). */
  var AD_KOD = { "ingilizce": "en", "almanca": "de", "fransızca": "fr", "italyanca": "it", "ispanyolca": "es", "felemenkçe": "nl", "hollandaca": "nl", "isveççe": "sv", "fince": "fi", "danca": "da", "macarca": "hu", "lehçe": "pl", "çekçe": "cs" };
  /** sinav-aktar.js'in mevcut kayıtta güncelleyebileceği alanlar (içerik alanları PM onayıyla tümden değişir). */
  var GUNCELLENEBILIR = ["ulkeler", "dil", "duzey", "kesinlik", "sonKontrol", "ucret", "tarih", "not", "kaynak", "format", "sure", "puanlama", "kurum", "durum", "kaynaklar"];
  var BILINEN_ALANLAR = ["id", "ad", "kategori", "kurum", "ulkeler", "format", "sure", "puanlama", "tarih", "dersSayfasi", "denemeKodu", "durum", "not", "kaynak",
    "dil", "duzey", "kesinlik", "sonKontrol", "ucret", "kaynaklar"];
  /** Aktarımda kayda yazılmayan ama işlenen alanlar: notEki (mevcut nota eklenir), gerekce (rapor notu). */
  var ISLEM_ALANLARI = ["notEki", "gerekce"];

  function arr(x) { return Array.isArray(x) ? x : []; }
  function isObj(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }
  function str(v) { return v == null ? "" : String(v).trim(); }
  function kucuk(v) { return str(v).toLocaleLowerCase("tr-TR"); }
  function isUrl(u) { return typeof u === "string" && /^https?:\/\/[^\s<>"']+$/i.test(u); }
  function isGun(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str(s)); if (!m) return false;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3];
  }
  function ulkeNorm(v) { v = kucuk(v); return ULKE_KODLARI.indexOf(v) >= 0 ? v : null; }

  // ------------------------------------------------------------------------
  // Dil
  // ------------------------------------------------------------------------
  /** Tek bir dil belirtecini koda çevirir: "en" | "yerel" | ISO kodu | null. */
  function dilKodu(v) {
    var k = kucuk(v).replace(/[()]/g, " ").trim();
    if (!k) return null;
    if (k === "yerel" || k === "en") return k;
    if (DIL_AD[k]) return k;
    if (AD_KOD[k]) return AD_KOD[k];
    return null;
  }
  /**
   * Sınavın dilleri (kod listesi; "yerel" belirteci korunur). Bilgi yoksa: Dil Sınavı -> ["en"]
   * (bugünkü IELTS/TOEFL kayıtları), diğer kategoriler -> [] (dil süzgecinden etkilenmez).
   */
  function sinavDilleri(s) {
    if (!isObj(s)) return [];
    var ham = s.dil;
    var parca = Array.isArray(ham) ? ham : (ham == null ? [] : String(ham).split(/\s*(?:\/|,|;|\+|\bve\b|\bveya\b|\bya da\b)\s*/i));
    var out = [];
    function ekle(k) { if (k && out.indexOf(k) < 0) out.push(k); }
    parca.forEach(function (p) {
      var k = dilKodu(p);
      if (k) return ekle(k);
      // "Fince (İsveççe de var)" gibi serbest metin: yalnızca tam dil adları aranır (kodlar değil; "en" Türkçede sözcüktür)
      kucuk(p).split(/[^a-zçğıöşüâîû]+/).forEach(function (w) { if (AD_KOD[w]) ekle(AD_KOD[w]); });
    });
    if (!out.length && ham == null && s.kategori === "Dil Sınavı") out.push("en");
    return out;
  }
  /** Ülkenin yerel dil kodları: dizin kaydı > sabit tablo. */
  function yerelDiller(ulke, dizinKaydi) {
    var y = dizinKaydi && Array.isArray(dizinKaydi.yerelDil) ? dizinKaydi.yerelDil : YEREL_DIL[ulke];
    return arr(y).slice();
  }
  /**
   * Sınavın seçilen ülkeye göre dil türü: {en, yerel, diger, bilinmiyor}.
   * Ülke yoksa İngilizce dışındaki her dil "yerel" sayılır (S7).
   */
  function dilTuru(s, ulke, yerel) {
    var d = sinavDilleri(s), y = Array.isArray(yerel) ? yerel : (ulke ? yerelDiller(ulke) : null);
    var t = { en: false, yerel: false, diger: false, bilinmiyor: !d.length };
    d.forEach(function (k) {
      if (k === "en") { t.en = true; if (y && y.indexOf("en") >= 0) t.yerel = true; }
      else if (k === "yerel") t.yerel = true;
      else if (!y || y.indexOf(k) >= 0) t.yerel = true;
      else t.diger = true;
    });
    return t;
  }
  /** dil: "hepsi" | "en" | "yerel". Dil bilgisi olmayan (AP, SAT…) her seçimde görünür. */
  function dilUygun(s, dil, ulke, yerel) {
    var t = dilTuru(s, ulke, yerel);
    if (t.bilinmiyor) return true;
    if (dil === "en") return t.en;
    if (dil === "yerel") return t.yerel;
    return t.en || t.yerel; // hepsi: ülke seçiliyken başka ülkenin dilindeki sınav görünmez
  }
  /** Kartta gösterilecek dil adı: "İngilizce", "Almanca", "Almanca / İngilizce". */
  function dilEtiketi(s) {
    return sinavDilleri(s).map(function (k) { return k === "yerel" ? "Yerel dil" : (DIL_AD[k] || k); }).join(" / ");
  }

  // ------------------------------------------------------------------------
  // Düzey, model, ülke
  // ------------------------------------------------------------------------
  function duzeyleri(s) {
    if (!isObj(s)) return [];
    var d = arr(s.duzey).filter(function (x) { return DUZEYLER.indexOf(x) >= 0; });
    if (d.length) return d;
    if (/^(gre|gmat)\b/i.test(str(s.id))) return ["yl"];
    return s.kategori === "Dil Sınavı" ? ["lisans", "yl"] : ["lisans"];
  }
  function duzeyOf(model) { return model === "uni-mezun" ? "yl" : model ? "lisans" : null; }
  function modelUygun(s, model) { var d = duzeyOf(model); return !d || duzeyleri(s).indexOf(d) >= 0; }
  /** ulke: kod | dizi (hedef ülkelerim) | null/"hepsi" (tümü). */
  function ulkeUygun(s, ulke) {
    var us = arr(s && s.ulkeler);
    if (!ulke || ulke === "hepsi") return true;
    if (Array.isArray(ulke)) return !ulke.length || ulke.some(function (u) { return us.indexOf(u) >= 0; });
    return us.indexOf(ulke) >= 0;
  }
  /** Üniversite mezununda AP sekmesi gizlenir (S5). */
  function apGizli(model) { return model === "uni-mezun"; }
  /** Sekme sırası (S5). */
  function sekmeSirasi(model) {
    if (model === "uni-mezun") return ["Dil Sınavı", "Giriş Sınavı", "AP"];
    if (model === "lise-mezun") return ["Giriş Sınavı", "Dil Sınavı", "AP"];
    return ["AP", "Giriş Sınavı", "Dil Sınavı"];
  }

  /**
   * secim:  {model, ulke (kod | dizi | "hepsi" | null), dil ("hepsi"|"en"|"yerel"), kategori?}
   * baglam: {dizin?: {cc: {yerelDil}}}  — dizin yoksa sabit tablo
   * Dil süzgeci ülke dizisinde (hedef ülkelerim) herhangi bir ülkeye göre uygunsa geçer.
   */
  function suz(liste, secim, baglam) {
    secim = secim || {}; baglam = baglam || {};
    var dizin = isObj(baglam.dizin) ? baglam.dizin : {};
    var dil = SINAV_DILLERI.indexOf(secim.dil) >= 0 ? secim.dil : "hepsi";
    var ulke = secim.ulke;
    return arr(liste).filter(function (s) {
      if (!isObj(s) || !str(s.id)) return false;
      if (secim.kategori && s.kategori !== secim.kategori) return false;
      if (!modelUygun(s, secim.model)) return false;
      if (!ulkeUygun(s, ulke)) return false;
      if (dil === "hepsi" && !ulke) return true;
      var ulkeler = Array.isArray(ulke) ? (ulke.length ? ulke.filter(function (u) { return arr(s.ulkeler).indexOf(u) >= 0; }) : [null]) : [ulke && ulke !== "hepsi" ? ulke : null];
      return ulkeler.some(function (u) { return dilUygun(s, dil, u, u ? yerelDiller(u, dizin[u]) : null); });
    });
  }

  // ------------------------------------------------------------------------
  // Seçim (URL > profil > varsayılan)
  // ------------------------------------------------------------------------
  function profilModeli(p) {
    if (!isObj(p)) return null;
    if (MODELLER.indexOf(p.ogrenciModeli) >= 0) return p.ogrenciModeli;
    var s = str(p.sinif);
    if (s === "mezun") return "lise-mezun";
    if (s === "lisans-mezun") return "uni-mezun";
    return /^(9|10|11|12)$/.test(s) ? "lise" : null;
  }
  /**
   * "?model=lise&sinif=11&ulke=de&dil=yerel" + profil -> seçim.
   * ulke: kod | "hepsi" | null (null = profilde "hedef ülkelerim", misafirde tümü). filtre: "rota" | "listem" | null.
   * Eski adresler: ?ulke=de (model yok), ?sinif=mezun (lise mezunu), ?filtre=rota.
   */
  function secimCoz(search, profil) {
    var ham = {};
    String(search || "").replace(/^\?/, "").replace(/#.*$/, "").split("&").forEach(function (p) {
      var i = p.indexOf("="); if (i < 0) return;
      var k = p.slice(0, i), v;
      try { v = decodeURIComponent(p.slice(i + 1).replace(/\+/g, " ")); } catch (e) { return; }
      if (["model", "sinif", "ulke", "dil", "filtre"].indexOf(k) >= 0 && !(k in ham)) ham[k] = kucuk(v);
    });
    var kaynak = { model: "yok", ulke: "yok", dil: "yok" };
    var model = MODELLER.indexOf(ham.model) >= 0 ? ham.model : null;
    var sinif = /^(9|10|11|12|mezun)$/.test(ham.sinif || "") ? ham.sinif : null;
    if (sinif === "mezun") { if (!model || model === "lise") model = "lise-mezun"; sinif = null; }
    else if (sinif && !model) model = "lise";
    if (model) kaynak.model = "url";
    else if (profilModeli(profil)) { model = profilModeli(profil); kaynak.model = "profil"; if (model === "lise" && /^(9|10|11|12)$/.test(str(profil.sinif))) sinif = str(profil.sinif); }
    if (model !== "lise") sinif = null;
    var ulke = ham.ulke === "hepsi" ? "hepsi" : ulkeNorm(ham.ulke);
    if (ulke) kaynak.ulke = "url";
    var dil = SINAV_DILLERI.indexOf(ham.dil) >= 0 ? ham.dil : null;
    if (dil) kaynak.dil = "url";
    else if (isObj(profil) && (profil.egitimDili === "en" || profil.egitimDili === "yerel")) { dil = profil.egitimDili; kaynak.dil = "profil"; }
    else dil = "hepsi";
    if (ulke === "ie" && dil === "yerel") dil = "en"; // İrlanda'da yerel öğretim dili İngilizce
    var filtre = FILTRELER.indexOf(ham.filtre) >= 0 ? ham.filtre : null;
    return { model: model, sinif: sinif, ulke: ulke, dil: dil, duzey: duzeyOf(model), filtre: filtre, kaynak: kaynak };
  }
  /** Kanonik adres (sıra: model, sinif, ulke, dil, filtre). dil "hepsi" ve ülke yoksa yazılmaz. */
  function secimAdres(sayfa, s) {
    s = s || {};
    var q = [], model = MODELLER.indexOf(s.model) >= 0 ? s.model : null;
    var ulke = s.ulke === "hepsi" ? "hepsi" : ulkeNorm(s.ulke);
    if (model) q.push("model=" + model);
    if (model === "lise" && /^(9|10|11|12)$/.test(str(s.sinif))) q.push("sinif=" + str(s.sinif));
    if (ulke) q.push("ulke=" + ulke);
    if (SINAV_DILLERI.indexOf(s.dil) >= 0 && (s.dil !== "hepsi" || ulke)) q.push("dil=" + (ulke === "ie" && s.dil === "yerel" ? "en" : s.dil));
    if (FILTRELER.indexOf(s.filtre) >= 0 && s.filtre !== "profil") q.push("filtre=" + s.filtre);
    return (sayfa || "sinavlar.html") + (q.length ? "?" + q.join("&") : "");
  }

  // ------------------------------------------------------------------------
  // Şema denetimi
  // ------------------------------------------------------------------------
  function sinavDogrula(s) {
    var p = [];
    if (!isObj(s)) return ["kayıt nesne değil"];
    var id = str(s.id) || "?";
    if (!/^[a-z0-9][a-z0-9-]*$/.test(str(s.id))) p.push(id + ": id küçük harf, rakam ve tire olmalı");
    if (!str(s.ad)) p.push(id + ": ad eksik");
    if (KATEGORILER.indexOf(s.kategori) < 0) p.push(id + ": kategori AP | Giriş Sınavı | Dil Sınavı olmalı");
    if (!Array.isArray(s.ulkeler) || !s.ulkeler.length) p.push(id + ": ulkeler boş olmamalı");
    arr(s.ulkeler).forEach(function (u) { if (ULKE_KODLARI.indexOf(u) < 0) p.push(id + ": tanınmayan ülke kodu " + u); });
    if (arr(s.ulkeler).length !== arr(s.ulkeler).filter(function (u, i, a) { return a.indexOf(u) === i; }).length) p.push(id + ": ulkeler tekrar ediyor");
    if (s.durum != null && DURUMLAR.indexOf(s.durum) < 0) p.push(id + ": durum hazir | kismi | yakinda olmalı");
    if (s.kaynak != null && !isUrl(s.kaynak)) p.push(id + ": kaynak http(s) adresi olmalı");
    if (s.dersSayfasi != null && !/^[A-Za-z0-9._-]+\.html(#[A-Za-z0-9._-]+)?$/.test(str(s.dersSayfasi))) p.push(id + ": dersSayfasi yerel .html olmalı");
    if (s.dil != null) {
      var ham = Array.isArray(s.dil) ? s.dil : [s.dil];
      if (!ham.length || !sinavDilleri(s).length) p.push(id + ": dil tanınmadı (" + JSON.stringify(s.dil) + ")");
    }
    if (s.duzey != null && (!Array.isArray(s.duzey) || !s.duzey.length || s.duzey.some(function (d) { return DUZEYLER.indexOf(d) < 0; }))) p.push(id + ": duzey [\"lisans\"] | [\"yl\"] | ikisi olmalı");
    if (s.kesinlik != null && KESINLIKLER.indexOf(s.kesinlik) < 0) p.push(id + ": kesinlik tanınmadı");
    if (s.sonKontrol != null && !isGun(s.sonKontrol)) p.push(id + ": sonKontrol YYYY-AA-GG olmalı");
    if (s.ucret != null && typeof s.ucret !== "string") p.push(id + ": ucret metin olmalı");
    // Tur 12 (Ajan 13 önerisi): kaynaklar = [{ad, url, belgeYili?, erisim?}] — ek resmi kaynaklar
    if (s.kaynaklar != null && (!Array.isArray(s.kaynaklar) || s.kaynaklar.some(function (k) { return !isObj(k) || !isUrl(k.url); }))) p.push(id + ": kaynaklar [{ad, url}] dizisi olmalı (url http(s))");
    ["format", "sure", "puanlama", "tarih", "not", "kurum"].forEach(function (k) { if (s[k] != null && typeof s[k] !== "string") p.push(id + ": " + k + " metin olmalı"); });
    return p;
  }
  function listeDogrula(liste) {
    if (!Array.isArray(liste)) return ["liste dizi değil"];
    var p = [], ids = {};
    liste.forEach(function (s, i) {
      sinavDogrula(s).forEach(function (x) { p.push("[" + i + "] " + x); });
      var id = isObj(s) ? str(s.id) : "";
      if (id && ids[id]) p.push("tekrar eden id: " + id);
      ids[id] = true;
    });
    return p;
  }

  // ------------------------------------------------------------------------
  // Aktarım (araclar/sinav-aktar.js) — mevcut kayıtlar korunur
  // ------------------------------------------------------------------------
  /**
   * gelen: [{id, ...}] — mevcut id ise yalnız GUNCELLENEBILIR alanlar yazılır (ulkeler birleşir, mevcut sıra korunur);
   * yeni id ise kayıt eklenir. Bilinmeyen alanlar atlanır ve raporlanır. Geçersiz yeni kayıt eklenmez.
   */
  function birlestir(mevcut, gelen) {
    var liste = arr(mevcut).map(function (s) { var o = {}; Object.keys(s).forEach(function (k) { o[k] = s[k]; }); return o; });
    var idx = {}; liste.forEach(function (s, i) { idx[s.id] = i; });
    var r = { liste: liste, eklenen: [], guncellenen: [], atlanan: [], sorunlar: [] };
    arr(gelen).forEach(function (g, i) {
      if (!isObj(g) || !str(g.id)) { r.atlanan.push("[" + i + "] id yok"); return; }
      Object.keys(g).forEach(function (k) { if (BILINEN_ALANLAR.indexOf(k) < 0 && ISLEM_ALANLARI.indexOf(k) < 0 && k.charAt(0) !== "_") r.atlanan.push(g.id + "." + k + " (bilinmeyen alan)"); });
      if (idx[g.id] != null) {
        var s = liste[idx[g.id]], degisti = [];
        GUNCELLENEBILIR.forEach(function (k) {
          if (!(k in g) || g[k] == null) return;
          var yeni = g[k];
          if (k === "ulkeler") {
            yeni = arr(s.ulkeler).concat(arr(g.ulkeler).filter(function (u) { return arr(s.ulkeler).indexOf(u) < 0; }));
          }
          if (k === "kaynaklar") { // url'ye göre birleşir; mevcutlar korunur
            var urller = arr(s.kaynaklar).map(function (x) { return x && x.url; });
            yeni = arr(s.kaynaklar).concat(arr(g.kaynaklar).filter(function (x) { return isObj(x) && urller.indexOf(x.url) < 0; }));
          }
          if (JSON.stringify(s[k]) !== JSON.stringify(yeni)) { s[k] = yeni; degisti.push(k); }
        });
        // notEki: mevcut not SİLİNMEZ; ek, metinde yoksa sona eklenir (aktarım yeniden çalışınca çiftlenmez)
        var ek = str(g.notEki);
        if (ek && str(s.not).indexOf(ek) < 0) { s.not = str(s.not) ? str(s.not) + " " + ek : ek; degisti.push("not (ek)"); }
        var sorun = sinavDogrula(s);
        if (sorun.length) r.sorunlar = r.sorunlar.concat(sorun);
        if (degisti.length) r.guncellenen.push(g.id + " (" + degisti.join(", ") + ")");
      } else {
        var o = {};
        BILINEN_ALANLAR.forEach(function (k) { if (k in g) o[k] = g[k]; });
        if (str(g.notEki)) o.not = str(o.not) ? str(o.not) + " " + str(g.notEki) : str(g.notEki);
        if (!("dersSayfasi" in o)) o.dersSayfasi = null;
        if (!("denemeKodu" in o)) o.denemeKodu = null;
        if (!("durum" in o)) o.durum = "yakinda";
        var p = sinavDogrula(o);
        if (p.length) { r.sorunlar = r.sorunlar.concat(p); r.atlanan.push(g.id + " (şema hatası, eklenmedi)"); return; }
        idx[o.id] = liste.length; liste.push(o); r.eklenen.push(o.id);
      }
    });
    return r;
  }

  /**
   * yl-genel.dilSinavlari maddesi ({id, baslik, metin, kaynak:[{url}], kesinlik, sonKontrol, sinavDili}) -> sınav kaydı.
   * Ülkeler sınav dilinden türetilir: İngilizce -> 15 ülke; yerel dil -> o dili yerel sayan ülkeler (dizin ya da sabit tablo).
   * Yalnızca birim testi ve PM önizlemesi içindir; yayın verisi sinavlar.js'tir.
   */
  function ylGenelKaydi(m, dizin) {
    if (!isObj(m)) return null;
    var tmp = { dil: m.sinavDili || m.dil, kategori: "Dil Sınavı" };
    var diller = sinavDilleri(tmp);
    var ulkeler = ULKE_KODLARI.filter(function (u) {
      var y = yerelDiller(u, isObj(dizin) ? dizin[u] : null);
      return diller.some(function (d) { return d === "en" || y.indexOf(d) >= 0; });
    });
    var k = arr(m.kaynak).filter(function (x) { return isObj(x) && isUrl(x.url); })[0];
    return {
      id: str(m.id), ad: (m.sinavDili ? str(m.baslik).split(" (" + str(m.sinavDili) + ")").join("") : str(m.baslik)) || str(m.id), kategori: "Dil Sınavı", kurum: "",
      ulkeler: ulkeler, format: "", sure: "", puanlama: "", tarih: "", dersSayfasi: null, denemeKodu: null, durum: "yakinda",
      not: str(m.metin), kaynak: k ? k.url : null, dil: diller.length === 1 ? diller[0] : diller, duzey: ["lisans", "yl"],
      kesinlik: KESINLIKLER.indexOf(m.kesinlik) >= 0 ? m.kesinlik : undefined, sonKontrol: isGun(m.sonKontrol) ? m.sonKontrol : undefined
    };
  }

  return {
    SURUM: SURUM,
    KATEGORILER: KATEGORILER,
    MODELLER: MODELLER,
    ULKE_KODLARI: ULKE_KODLARI,
    SINAV_DILLERI: SINAV_DILLERI,
    DUZEYLER: DUZEYLER,
    KESINLIKLER: KESINLIKLER,
    YEREL_DIL: YEREL_DIL,
    DIL_AD: DIL_AD,
    GUNCELLENEBILIR: GUNCELLENEBILIR,
    BILINEN_ALANLAR: BILINEN_ALANLAR,
    ISLEM_ALANLARI: ISLEM_ALANLARI,
    dilKodu: dilKodu,
    sinavDilleri: sinavDilleri,
    yerelDiller: yerelDiller,
    dilTuru: dilTuru,
    dilUygun: dilUygun,
    dilEtiketi: dilEtiketi,
    duzeyleri: duzeyleri,
    duzeyOf: duzeyOf,
    modelUygun: modelUygun,
    ulkeUygun: ulkeUygun,
    apGizli: apGizli,
    sekmeSirasi: sekmeSirasi,
    suz: suz,
    profilModeli: profilModeli,
    secimCoz: secimCoz,
    secimAdres: secimAdres,
    sinavDogrula: sinavDogrula,
    listeDogrula: listeDogrula,
    birlestir: birlestir,
    ylGenelKaydi: ylGenelKaydi
  };
});
