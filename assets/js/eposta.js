/**
 * Meberra — Resmi yazışma (e-posta) şablon motoru (Ajan 11, Tur 5b)
 * Sözleşme: .agents/rules/tur5-platform-spec.md §7
 *
 * Saf fonksiyonlar: DOM'a, localStorage'a ve global veriye dokunmaz.
 * Tarayıcıda window.APMEBERRA_EPOSTA, Node'da module.exports olarak kullanılır;
 * sunucu kurulduğunda aynı modül gönderim kuyruğunda çalışacak.
 *
 *   degiskenler(profil, kullanici, secim) -> değişken ağacı
 *   olustur(sablon, degiskenler)          -> {konu, govde, eksikler[], bilinmeyenler[]}
 *   mailto(alici, konu, govde)            -> {url, uzunluk, uzun}
 *
 * Tur 12 (plan .agents/rules/tur12-ekran-plani.md Y1–Y6): hazır teyit taslakları (data/kocluk/teyit-taslaklari.js)
 *   taslakDogrula(t) · taslaklariSuz(liste, {model, ulke}) · taslakAlicisi(t) · yerTutucuKalan(metin) · sablonUlkeSuz(...)
 *
 * Tur 14 / Ajan 14 Faz 1 (plan .agents/rules/tur14-ilk-basvuru-eposta-plani.md): üniversiteye ilk başvuru e-postası
 *   Koşullu blok: {{#if yol}} … {{else}} … {{/if}} (iç içe olabilir; boş/tanımsız değer = yanlış). olustur() destekler.
 *   ilkBasvuruHazirla(profil, kullanici, universite, ulkeKod, amac, secenek?) -> {sablonId, konu, govde, alici, eksikler[], kelimeSayisi, mailto, ...}
 *   ilkBasvuruSablonDogrula(s) · ilkBasvuruSablonSec(liste, model, ulke, amac) · universiteKimligi(ulke, uni) · kelimeSay(metin)
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.APMEBERRA_EPOSTA = api;
  else if (root && !root.APMEBERRA_EPOSTA) root.APMEBERRA_EPOSTA = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var SURUM = "1.1.1"; // 1.1.0: Tur 14 ilk başvuru e-postası + koşullu blok · 1.1.1: KAYNAK.capa, yönerge kodları öğrenci metninden ayrıldı (yonergeKodlari)
  var MAILTO_SINIR = 2000;          // birçok tarayıcı/e-posta programı bunun üstünü kesebilir
  var DEPO_ANAHTARI = "apmeberra:yazisma:v1";
  var DURUMLAR = ["taslak", "gonderildi", "yanit"];

  var AYLAR = {
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    it: ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]
  };
  var MEZUNIYET_AYI = 5; // Haziran (0 tabanlı): Türkiye'de lise diploması haziranda verilir
  var SINIF_FARKI = { "12": 1, "11": 2, "10": 3, "9": 4 };

  /** Değişken yolu -> arayüzde gösterilecek Türkçe ad. */
  var ETIKETLER = {
    "ogrenci.adSoyad": "Ad ve soyad",
    "ogrenci.ad": "Ad",
    "ogrenci.soyad": "Soyad",
    "ogrenci.eposta": "E-posta adresin",
    "ogrenci.dogumTarihi": "Doğum tarihin",
    "ogrenci.okul": "Okulun",
    "ogrenci.okulSehir": "Okulunun şehri",
    "ogrenci.sinif": "Sınıfın",
    "ogrenci.mezuniyetYili": "Mezuniyet yılın",
    "ogrenci.mezuniyetAyYil": "Mezuniyet ayı ve yılın",
    "ogrenci.diploma": "Diploma türü",
    "ogrenci.apSinavlari": "Gireceğin AP sınavları",
    "basvuru.yil": "Başvuru yılı",
    "basvuru.donem": "Başvuru dönemi",
    "universite.ad": "Üniversite",
    "universite.sehir": "Üniversitenin şehri",
    "program.ad": "Program",
    "bugun": "Bugünün tarihi",
    // Tur 14 (ilk başvuru e-postası)
    "ogrenci.model": "Öğrenci modeli",
    "ogrenci.dilSinavlari": "Dil sınavların",
    "ogrenci.girisSinavlari": "Giriş sınavların",
    "ogrenci.lisansAlani": "Lisans alanın (İngilizce)",
    "ogrenci.lisansUniversitesi": "Lisans üniversiten",
    "ogrenci.lisansMezuniyetYili": "Lisans mezuniyet yılın",
    "ogrenci.lisansMezun": "Lisans durumu: mezun",
    "ogrenci.lisansSonSinif": "Lisans durumu: son sınıf",
    "ogrenci.gpa4": "Not ortalaman (4'lük)",
    "ogrenci.yksYerlesme": "YKS yerleşme durumun",
    "program.dil": "Eğitim dili",
    "basvuru.duzey": "Başvuru düzeyi",
    "takip.ilkTarih": "İlk e-postanın gönderim tarihi"
  };

  /**
   * Eksik değişkenin nereden tamamlanacağı (arayüz bu bilgiyle yönlendirir).
   * profil: profildeki alan adı · secim: sayfadaki seçim · sinavlar: Sınavlarım listesi
   * capa (isteğe bağlı, 1.1.1): profil.html'deki hedef öğe kimliği; yoksa arayüz "pf-" + alan kullanır.
   */
  var KAYNAK = {
    "ogrenci.eposta": { tur: "profil", alan: "eposta" },
    "ogrenci.dogumTarihi": { tur: "profil", alan: "dogumTarihi" },
    "ogrenci.okulSehir": { tur: "profil", alan: "okulSehir" },
    "ogrenci.mezuniyetYili": { tur: "profil", alan: "mezuniyetYili" },
    "ogrenci.mezuniyetAyYil": { tur: "profil", alan: "mezuniyetYili" },
    "basvuru.yil": { tur: "profil", alan: "mezuniyetYili" },
    "basvuru.donem": { tur: "profil", alan: "mezuniyetYili" },
    "ogrenci.okul": { tur: "profil", alan: "okul" },
    "ogrenci.sinif": { tur: "profil", alan: "sinif", capa: "pf-sinif-group" },
    "ogrenci.ad": { tur: "hesap" }, "ogrenci.soyad": { tur: "hesap" }, "ogrenci.adSoyad": { tur: "hesap" },
    "ogrenci.apSinavlari": { tur: "sinavlar" },
    "universite.ad": { tur: "secim", alan: "universite" },
    "universite.sehir": { tur: "secim", alan: "universite" },
    "program.ad": { tur: "secim", alan: "program" },
    "ogrenci.dilSinavlari": { tur: "sinavlar" },
    "ogrenci.girisSinavlari": { tur: "sinavlar" },
    "ogrenci.lisansAlani": { tur: "profil", alan: "lisansAlani" },
    "ogrenci.lisansUniversitesi": { tur: "profil", alan: "lisansUniversitesi" },
    "ogrenci.lisansMezuniyetYili": { tur: "profil", alan: "lisansMezuniyetYili" },
    "ogrenci.gpa4": { tur: "profil", alan: "gpa4" },
    "ogrenci.yksYerlesme": { tur: "profil", alan: "yerlesmeDurumu", capa: "pf-yerlesmeDurumu-group" },
    "takip.ilkTarih": { tur: "secim", alan: "ilkGonderim" }
  };

  /** Ülkenin yerel öğretim dili (İngilizce sıfat). Eğitim dili "yerel" seçildiğinde e-postada kullanılır. */
  var ULKE_YEREL_DIL = {
    de: "German", at: "German", ch: "German-, French- or Italian", it: "Italian", nl: "Dutch", be: "Dutch- or French",
    fr: "French", es: "Spanish", se: "Swedish", fi: "Finnish or Swedish", dk: "Danish", ie: "English", hu: "Hungarian", pl: "Polish", cz: "Czech"
  };

  // ------------------------------------------------------------------------
  // Yardımcılar
  // ------------------------------------------------------------------------
  function str(v) { return v == null ? "" : String(v).trim(); }
  function bos(v) { return v == null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && !v.length); }
  function dilKodu(d) { return d === "de" || d === "it" ? d : "en"; }

  /** Date | "YYYY-MM-DD" | ISO -> Date (yerel gün). Geçersizse null. */
  function tarihOku(v) {
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    var s = str(v);
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) {
      var d = new Date(+m[1], +m[2] - 1, +m[3]);
      return (d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3]) ? d : null;
    }
    if (!s) return null;
    var t = new Date(s);
    return isNaN(t.getTime()) ? null : t;
  }

  /** Dile göre resmi tarih: "12 October 2026" / "12. Oktober 2026" / "12 ottobre 2026". */
  function tarihYaz(v, dil) {
    var d = tarihOku(v); if (!d) return "";
    dil = dilKodu(dil);
    var ay = AYLAR[dil][d.getMonth()];
    return dil === "de" ? d.getDate() + ". " + ay + " " + d.getFullYear() : d.getDate() + " " + ay + " " + d.getFullYear();
  }

  /**
   * Öğretim yılının başladığı takvim yılı. Eylül (ve sonrası) yeni öğretim yılıdır:
   * 12 Ekim 2026 -> 2026 (2026-27), 15 Mart 2027 -> 2026, 1 Eylül 2027 -> 2027.
   */
  function ogretimYili(bugun) {
    var d = tarihOku(bugun) || new Date();
    return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  }

  /**
   * Mezuniyet yılı: sınıftan, içinde bulunulan öğretim yılına göre hesaplanır.
   * 2026-27'de: 12 -> 2027, 11 -> 2028, 10 -> 2029, 9 -> 2030. Mezunsa profilde girilen yıl.
   */
  function mezuniyetYili(sinif, mezunYili, bugun) {
    sinif = str(sinif);
    if (sinif === "mezun") {
      var y = parseInt(mezunYili, 10);
      return y >= 1950 && y <= 2100 ? y : null;
    }
    return SINIF_FARKI[sinif] ? ogretimYili(bugun) + SINIF_FARKI[sinif] : null;
  }

  /**
   * Mezun için varsayılan hedef başlangıç yılı: bir sonraki akademik yılın başladığı takvim yılı
   * (14 Ekim 2026 -> 2027 = 2027/28; 15 Mart 2027 -> 2027; 1 Eylül 2027 -> 2028). Karar K5-a.
   */
  function varsayilanHedefYili(bugun) { return ogretimYili(bugun) + 1; }

  /**
   * Mezunun hedef başlangıç yılı (profil.hedefBaslangicYili; yoksa ya da geçersizse varsayılan).
   * Mezun olmayan için null. Eski profiller (alan yok) varsayılanla çalışır.
   */
  function hedefBaslangicYili(profil, bugun) {
    profil = profil || {};
    if (str(profil.sinif) !== "mezun" && str(profil.sinif) !== "lisans-mezun" && profil.ogrenciModeli !== "uni-mezun") return null;
    var y = str(profil.hedefBaslangicYili);
    return /^\d{4}$/.test(y) && +y >= 1990 && +y <= 2100 ? +y : varsayilanHedefYili(bugun);
  }

  /**
   * Rota ve başvuru takviminin dayandığı yıl ("sanal mezuniyet yılı", karar notu §4.3):
   * öğrencide mezuniyet yılı, mezunda hedef başlangıç yılı. mezuniyetGore: 0 adımları bu yıla düşer.
   */
  function takvimYili(profil, bugun) {
    profil = profil || {};
    if (str(profil.sinif) === "mezun" || str(profil.sinif) === "lisans-mezun" || profil.ogrenciModeli === "uni-mezun") return hedefBaslangicYili(profil, bugun); // Tur 11: üniversite mezunu da hedef yıla göre
    return mezuniyetYili(profil.sinif, null, bugun);
  }

  /** İngilizce liste: "A", "A and B", "A, B and C" (de: "und", it: "e"). */
  function listeYaz(arr, dil) {
    var ve = { en: " and ", de: " und ", it: " e " }[dilKodu(dil)];
    arr = arr.filter(function (x) { return !bos(x); });
    if (arr.length < 2) return arr.join("");
    return arr.slice(0, -1).join(", ") + ve + arr[arr.length - 1];
  }

  /**
   * Üniversite adının e-postada kullanılacak resmi biçimi: sondaki " (…)" ekleri ve
   * " — …" açıklaması atılır. "Politecnico di Torino (PoliTo)" -> "Politecnico di Torino".
   * Tire öncesi yalnızca kısaltmaysa ("TUHH — Hamburg University of Technology")
   * kısaltma değil uzun ad kalır -> "Hamburg University of Technology".
   */
  function resmiAd(ad) {
    var s = str(ad), once;
    do { once = s; s = s.replace(/\s*\([^()]*\)\s*$/, "").trim(); } while (s !== once);
    var p = s.split(/\s+[—–]\s+/);
    if (p.length > 1) s = /^[A-Z0-9&.\/-]{2,8}$/.test(p[0]) ? p.slice(1).join(" — ") : p[0];
    do { once = s; s = s.replace(/\s*\([^()]*\)\s*$/, "").trim(); } while (s !== once);
    return s;
  }

  /**
   * Program adındaki Türkçe açıklama parantezlerini atar:
   * "Engineering Science (9 uzmanlıktan 6'sı ...)" -> "Engineering Science";
   * "Mechanical Engineering (International)" olduğu gibi kalır.
   */
  function programAdi(ad) {
    var s = str(ad);
    var TR = /[ğıışİĞŞçÇ]|(^|[\s(,;])(ve|özel|ortak|yalnızca|iki dilli)(?=[\s),;]|$)/;
    var once;
    do {
      once = s;
      s = s.replace(/\s*\(([^()]*)\)\s*$/, function (tam, ic) { return TR.test(ic) ? "" : tam; });
    } while (s !== once);
    return s.trim();
  }

  function sinifYaz(sinif, mezYil, dil) {
    dil = dilKodu(dil); sinif = str(sinif);
    if (sinif === "mezun") {
      var t = { en: "High school graduate", de: "Schulabsolvent/in", it: "Diplomato/a" }[dil];
      return mezYil ? t + " (" + mezYil + ")" : t;
    }
    if (!SINIF_FARKI[sinif]) return "";
    return { en: "Grade " + sinif, de: sinif + ". Klasse", it: sinif + "° anno" }[dil];
  }

  function donemYaz(yil, ulke, dil) {
    if (!yil) return "";
    var ay = yil + "/" + String((yil + 1) % 100).padStart(2, "0");
    dil = dilKodu(dil);
    if (ulke === "de") return { en: "winter semester ", de: "Wintersemester ", it: "semestre invernale " }[dil] + ay;
    return { en: "academic year ", de: "Studienjahr ", it: "anno accademico " }[dil] + ay;
  }

  // ------------------------------------------------------------------------
  // 1. Değişkenler
  // ------------------------------------------------------------------------
  /**
   * profil:    {okul, sinif, ulkeler, eposta?, dogumTarihi?, okulSehir?, mezuniyetYili?}
   * kullanici: {ad, soyad}
   * secim:     {dil?, ulke?, bugun?, universite?: {ad, sehir}, program?: {ad} | programAd?,
   *             sinavlarim?: [sinavId], sinavKatalogu?: APMEBERRA_SINAVLAR}
   */
  function degiskenler(profil, kullanici, secim) {
    profil = profil || {}; kullanici = kullanici || {}; secim = secim || {};
    var dil = dilKodu(secim.dil);
    var bugun = tarihOku(secim.bugun) || new Date();
    var ad = str(kullanici.ad), soyad = str(kullanici.soyad);
    var mezYil = mezuniyetYili(profil.sinif, profil.mezuniyetYili, bugun);
    var basYil = takvimYili(profil, bugun); // mezunda hedef başlangıç yılı (K5-a), öğrencide mezuniyet yılı
    var sehir = str(profil.okulSehir) || "İstanbul";
    if (sehir === "İstanbul") sehir = "Istanbul"; // yabancı dildeki yazışmada uluslararası yazım

    var katalog = Array.isArray(secim.sinavKatalogu) ? secim.sinavKatalogu : [];
    var benim = Array.isArray(secim.sinavlarim) ? secim.sinavlarim : [];
    var apAdlari = benim.map(function (id) {
      var s = katalog.filter(function (x) { return x && x.id === id; })[0];
      return s && s.kategori === "AP" ? str(s.ad) : "";
    }).filter(Boolean);
    // Tur 14: AP dışı sınavlar (Sınavlarım). Türkçe açıklama parantezi atılır; adı Türkçe kalan sınav yazılmaz.
    function sinavAdlari(kategori) {
      return benim.map(function (id) {
        var s = katalog.filter(function (x) { return x && x.id === id; })[0];
        if (!s || s.kategori !== kategori) return "";
        var a = programAdi(s.ad).replace(/\s+[—–]\s+.*$/, "").trim();
        return /[ğıışİĞŞçÇöÖüÜ]/.test(a) ? "" : a;
      }).filter(Boolean);
    }
    var dilAdlari = sinavAdlari("Dil Sınavı"), girisAdlari = sinavAdlari("Giriş Sınavı");

    var model = ["lise", "lise-mezun", "uni-mezun"].indexOf(profil.ogrenciModeli) >= 0 ? profil.ogrenciModeli
      : str(profil.sinif) === "mezun" ? "lise-mezun" : str(profil.sinif) === "lisans-mezun" ? "uni-mezun" : SINIF_FARKI[str(profil.sinif)] ? "lise" : "";
    var uniMezun = model === "uni-mezun";
    var lisansDurumu = uniMezun ? str(profil.lisansDurumu) : "";
    var lisansYil = uniMezun && /^\d{4}$/.test(str(profil.lisansMezuniyetYili)) ? str(profil.lisansMezuniyetYili) : "";
    var gpa = uniMezun && /^\d(\.\d{1,2})?$/.test(str(profil.gpa4).replace(",", ".")) ? Number(str(profil.gpa4).replace(",", ".")).toFixed(2) : "";
    var yerelDil = ULKE_YEREL_DIL[secim.ulke || (secim.universite && secim.universite.ulke) || ""] || "";

    var uni = secim.universite || null;
    var prog = secim.program || (secim.programAd ? { ad: secim.programAd } : null);
    var ulke = secim.ulke || (uni && uni.ulke) || "";

    return {
      ogrenci: {
        ad: ad,
        soyad: soyad,
        adSoyad: (ad + " " + soyad).trim(),
        eposta: str(profil.eposta),
        dogumTarihi: tarihYaz(profil.dogumTarihi, dil),
        okul: str(profil.okul),
        okulSehir: sehir,
        sinif: sinifYaz(profil.sinif, mezYil, dil),
        mezuniyetYili: mezYil ? String(mezYil) : "",
        mezuniyetAyYil: mezYil ? AYLAR[dil][MEZUNIYET_AYI] + " " + mezYil : "",
        diploma: "Turkish Lise Diplomasi",
        apSinavlari: listeYaz(apAdlari, dil),
        // Tur 14 (ilk başvuru e-postası) — yalnızca eklenen alanlar; boşsa koşullu blok metne girmez
        model: model,
        dilSinavlari: listeYaz(dilAdlari, dil),
        girisSinavlari: listeYaz(girisAdlari, dil),
        lisansAlani: uniMezun ? str(profil.lisansAlani) : "",
        lisansUniversitesi: uniMezun ? str(profil.lisansUniversitesi) : "",
        lisansMezuniyetYili: lisansYil,
        lisansMezun: lisansDurumu === "mezun" ? "1" : "",
        lisansSonSinif: lisansDurumu === "son-sinif" ? "1" : "",
        gpa4: gpa,
        yksYerlesme: model === "lise-mezun" && (profil.yerlesmeDurumu === "uygun" || profil.yerlesmeDurumu === "alan-uyumsuz") ? "1" : ""
      },
      basvuru: {
        yil: basYil ? String(basYil) : "",
        donem: donemYaz(basYil, ulke, dil),
        duzey: model ? (uniMezun ? "master's" : "bachelor's") : ""
      },
      universite: { ad: uni ? resmiAd(uni.ad) : "", sehir: uni ? str(uni.sehir) : "" },
      program: {
        ad: prog ? programAdi(prog.ad) : "",
        dil: profil.egitimDili === "yerel" && yerelDil ? yerelDil + "-taught" : "English-taught"
      },
      takip: { ilkTarih: tarihYaz(secim.ilkGonderim, dil) },
      bugun: tarihYaz(bugun, dil)
    };
  }

  // ------------------------------------------------------------------------
  // 2. Şablonu doldur
  // ------------------------------------------------------------------------
  var YER_TUTUCU = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\s*\}\}/g;

  /** "ogrenci.ad" -> değer; yol yoksa undefined. */
  function yolOku(agac, yol) {
    var parcalar = yol.split("."), v = agac;
    for (var i = 0; i < parcalar.length; i++) {
      if (v == null || typeof v !== "object" || !Object.prototype.hasOwnProperty.call(v, parcalar[i])) return undefined;
      v = v[parcalar[i]];
    }
    return v;
  }

  /** Şablondaki tüm değişken yolları (tekrarsız, sırayla). */
  function yerTutucular(metin) {
    var out = [], m;
    YER_TUTUCU.lastIndex = 0;
    while ((m = YER_TUTUCU.exec(String(metin || "")))) if (m[1] !== "else" && out.indexOf(m[1]) < 0) out.push(m[1]);
    // Tur 14: koşul yolları ({{#if yol}}) da değişkendir
    kosulYollari(metin).forEach(function (y) { if (out.indexOf(y) < 0) out.push(y); });
    return out;
  }

  // Tur 14: koşullu bloklar. {{#if yol}} A {{else}} B {{/if}} — iç içe olabilir; en içteki blok önce çözülür.
  var KOSUL_IC = /\{\{#if\s+([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\s*\}\}((?:(?!\{\{#if[\s}])[\s\S])*?)\{\{\/if\}\}/;
  var KOSUL_YOL = /\{\{#if\s+([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\s*\}\}/g;

  /** Metindeki koşul yolları (tekrarsız, sırayla). */
  function kosulYollari(metin) {
    var out = [], m;
    KOSUL_YOL.lastIndex = 0;
    while ((m = KOSUL_YOL.exec(String(metin || "")))) if (out.indexOf(m[1]) < 0) out.push(m[1]);
    return out;
  }

  /** Değer "dolu" mu? Boş metin, boş dizi, null/undefined ve nesne (yaprak olmayan yol) yanlıştır. */
  function kosulDogru(v) {
    if (v === undefined || v === null || v === false) return false;
    if (typeof v === "object" && !Array.isArray(v)) return false;
    return !bos(v);
  }

  /**
   * Koşullu blokları çözer; değişkenleri doldurmaz. Blok yoksa metin aynen döner (eski şablonlar etkilenmez).
   * Dengesiz blok kalırsa (ör. {{/if}} eksik) işaretler metinde kalır; ilkBasvuruSablonDogrula bunu yakalar.
   */
  function kosullariCoz(metin, degis) {
    var s = String(metin == null ? "" : metin), m, guvenlik = 0;
    while ((m = KOSUL_IC.exec(s)) && guvenlik++ < 500) {
      var parca = m[2].split("{{else}}");
      var sec = kosulDogru(yolOku(degis || {}, m[1])) ? parca[0] : parca.slice(1).join("{{else}}");
      s = s.slice(0, m.index) + sec + s.slice(m.index + m[0].length);
    }
    return s;
  }

  /** Koşullu blok çözüldükten sonra kalan çift boşluk / boş satır / noktalama önü boşluğunu toplar. */
  function bosluklariTopla(s) {
    return String(s)
      .replace(/[ \t]+\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/ +([,.;:)])/g, "$1")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^\s+|\s+$/g, "");
  }

  /**
   * Şablonu doldurur. Boş ya da tanımsız değişken metinde "[eksik: yol]" olarak kalır
   * ve eksikler listesine girer. zorunluAlanlar metinde geçmese de denetlenir.
   * Dönüş: {konu, govde, eksikler: [yol], bilinmeyenler: [yol]}
   */
  function olustur(sablon, degis) {
    sablon = sablon || {}; degis = degis || {};
    var eksikler = [], bilinmeyenler = [];
    function ekle(liste, yol) { if (liste.indexOf(yol) < 0) liste.push(yol); }
    function doldur(metin) {
      return String(metin == null ? "" : metin).replace(YER_TUTUCU, function (tam, yol) {
        var v = yolOku(degis, yol);
        if (v === undefined || (v !== null && typeof v === "object" && !Array.isArray(v))) {
          ekle(bilinmeyenler, yol); ekle(eksikler, yol);
          return "[eksik: " + yol + "]";
        }
        if (Array.isArray(v)) v = listeYaz(v.map(str));
        if (bos(v)) { ekle(eksikler, yol); return "[eksik: " + yol + "]"; }
        return String(v);
      });
    }
    // Tur 14: koşullu bloklar önce çözülür; blok içermeyen eski şablonlarda metin birebir aynı kalır.
    var hamKonu = String(sablon.konu == null ? "" : sablon.konu), hamGovde = String(sablon.govde == null ? "" : sablon.govde).replace(/\r\n?/g, "\n");
    var kosulluKonu = kosulYollari(hamKonu).length > 0, kosulluGovde = kosulYollari(hamGovde).length > 0;
    if (kosulluKonu) hamKonu = kosullariCoz(hamKonu, degis);
    if (kosulluGovde) hamGovde = kosullariCoz(hamGovde, degis);
    var konu = doldur(hamKonu).replace(/\s*[\r\n]+\s*/g, " ").trim();
    var govde = doldur(hamGovde).replace(/\r\n?/g, "\n");
    if (kosulluKonu) konu = bosluklariTopla(konu);
    if (kosulluGovde) govde = bosluklariTopla(govde);
    (Array.isArray(sablon.zorunluAlanlar) ? sablon.zorunluAlanlar : []).forEach(function (yol) {
      var v = yolOku(degis, yol);
      if (v === undefined) { ekle(bilinmeyenler, yol); ekle(eksikler, yol); }
      else if (bos(v)) ekle(eksikler, yol);
    });
    return { konu: konu, govde: govde, eksikler: eksikler, bilinmeyenler: bilinmeyenler };
  }

  /** Düzenlenmiş metinde hâlâ duran "[eksik: …]" işaretleri. */
  function kalanEksikler(metin) {
    var out = [], re = /\[eksik: ([^\]]+)\]/g, m;
    while ((m = re.exec(String(metin || "")))) if (out.indexOf(m[1]) < 0) out.push(m[1]);
    return out;
  }

  // ------------------------------------------------------------------------
  // 3. mailto
  // ------------------------------------------------------------------------
  var EPOSTA_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[A-Za-z]{2,}$/;
  function epostaGecerli(e) { return EPOSTA_RE.test(str(e)); }

  /** RFC 6068: konu ve gövde UTF-8 yüzde kodlanır, satır sonları %0D%0A olur. */
  function kodla(s) {
    return encodeURIComponent(String(s == null ? "" : s).replace(/\r\n?|\n/g, "\r\n"))
      .replace(/[!'()*]/g, function (c) { return "%" + c.charCodeAt(0).toString(16).toUpperCase(); });
  }

  /**
   * alici: "a@b.de" | ["a@b.de", ...] | "" (alıcı boşsa program kendisi sorar)
   * Dönüş: {url, uzunluk, uzun} — uzun: url MAILTO_SINIR'ı aşıyor (kopyalamak önerilir)
   */
  function mailto(alici, konu, govde) {
    var liste = (Array.isArray(alici) ? alici : String(alici || "").split(/[,;]/))
      .map(str).filter(epostaGecerli)
      .map(function (a) { return encodeURIComponent(a).replace(/%40/g, "@"); });
    var q = [];
    if (!bos(konu)) q.push("subject=" + kodla(String(konu).replace(/[\r\n]+/g, " ")));
    if (!bos(govde)) q.push("body=" + kodla(govde));
    var url = "mailto:" + liste.join(",") + (q.length ? "?" + q.join("&") : "");
    return { url: url, uzunluk: url.length, uzun: url.length > MAILTO_SINIR };
  }

  // ------------------------------------------------------------------------
  // 4. Şablon listesi ve kayıt yardımcıları (sunucuda da aynı kurallar)
  // ------------------------------------------------------------------------
  /** Şema denetimi (§7.1). Dönüş: sorun listesi (boşsa geçerli). */
  function sablonDogrula(s) {
    var p = [];
    if (!s || typeof s !== "object") return ["şablon nesne değil"];
    ["id", "baslik", "konu", "govde"].forEach(function (k) { if (bos(s[k]) || typeof s[k] !== "string") p.push(k + " eksik"); });
    if (["de", "it", "genel"].indexOf(s.ulke) < 0) p.push("ulke de/it/genel olmalı");
    if (!s.alici || ["universite", "kurum"].indexOf(s.alici.tur) < 0) p.push("alici.tur universite/kurum olmalı");
    if (s.dil && ["en", "de", "it"].indexOf(s.dil) < 0) p.push("dil en/de/it olmalı");
    if (s.zorunluAlanlar != null && !Array.isArray(s.zorunluAlanlar)) p.push("zorunluAlanlar dizi olmalı");
    if (s.siniflar != null && !Array.isArray(s.siniflar)) p.push("siniflar dizi olmalı");
    if (s.alici && s.alici.secenekler != null && !Array.isArray(s.alici.secenekler)) p.push("alici.secenekler dizi olmalı");
    if (s.dayanak != null && !Array.isArray(s.dayanak) && typeof s.dayanak !== "string") p.push("dayanak dizi ya da metin olmalı");
    return p;
  }

  /** Şablon bu sınıftaki öğrenciye uygun mu? (isteğe bağlı siniflar: ["11"]) */
  function sinifUygun(s, sinif) {
    return !s || !Array.isArray(s.siniflar) || !s.siniflar.length || s.siniflar.map(String).indexOf(String(sinif || "")) >= 0;
  }

  /**
   * Profil ülkelerine ("genel" her zaman) ve varsa sınıfa göre süzer.
   * sinif verilmezse sınıf süzmesi yapılmaz.
   */
  function sablonlariSuz(sablonlar, ulkeler, sinif) {
    ulkeler = Array.isArray(ulkeler) ? ulkeler : [];
    return (Array.isArray(sablonlar) ? sablonlar : []).filter(function (s) {
      return s && !sablonDogrula(s).length && (s.ulke === "genel" || ulkeler.indexOf(s.ulke) >= 0) &&
        (sinif === undefined || sinifUygun(s, sinif));
    });
  }

  /**
   * Şablonun üniversite seçimi isteyip istemediği ve hangi üniversitelerle sınırlı olduğu.
   * Dönüş: {gerekli: bool, izinli: [universiteId] | null (null = ülkenin tüm üniversiteleri)}
   */
  function universiteSecimi(s) {
    if (!s || !s.alici) return { gerekli: false, izinli: null };
    var sec = Array.isArray(s.alici.secenekler) ? s.alici.secenekler.filter(function (x) { return x && x.universiteId; }) : [];
    var yollar = yerTutucular(s.konu + " " + s.govde).concat(Array.isArray(s.zorunluAlanlar) ? s.zorunluAlanlar : []);
    var kullaniyor = yollar.some(function (y) { return /^(universite|program)\./.test(y); });
    return {
      gerekli: s.alici.tur === "universite" || sec.length > 0 || kullaniyor,
      izinli: sec.length ? sec.map(function (x) { return x.universiteId; }) : null
    };
  }

  /**
   * Alıcıyı çözer: seçilen üniversite alici.secenekler içindeyse onun kanalı,
   * değilse şablonun genel alici alanı. Dönüş: {kurum, eposta, iletisimSayfasi, kaynak, not, genelNot, secenektenMi}
   */
  function aliciCoz(s, universiteId) {
    var a = (s && s.alici) || {};
    var sec = universiteId && Array.isArray(a.secenekler)
      ? a.secenekler.filter(function (x) { return x && x.universiteId === universiteId; })[0] : null;
    var k = sec || a;
    return {
      kurum: str(k.kurum) || null,
      eposta: epostaGecerli(k.eposta) ? str(k.eposta) : null,
      iletisimSayfasi: str(k.iletisimSayfasi) || null,
      kaynak: str(k.kaynak) || null,
      not: str(k.not) || null,
      genelNot: sec ? (str(a.not) || null) : null,
      secenektenMi: !!sec
    };
  }

  /** apmeberra:yazisma:v1 değerini güvenli biçime getirir: {kayitlar: [...]} */
  function depoNormalize(ham) {
    var liste = ham && typeof ham === "object" && Array.isArray(ham.kayitlar) ? ham.kayitlar : [];
    return {
      kayitlar: liste.filter(function (k) { return k && typeof k === "object" && typeof k.id === "string"; }).map(function (k) {
        if (DURUMLAR.indexOf(k.durum) < 0) k.durum = "taslak";
        k.konu = k.konu == null ? "" : String(k.konu); k.govde = k.govde == null ? "" : String(k.govde);
        return k;
      })
    };
  }

  /** Yeni kayıt (spec §7.4 alanları + aliciAd, guncelleme, yanitTarihi). */
  function yeniKayit(alanlar, simdi) {
    alanlar = alanlar || {};
    var t = (tarihOku(simdi) || new Date()).toISOString();
    return {
      id: "y" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      sablonId: alanlar.sablonId || null,
      alici: str(alanlar.alici),
      aliciAd: str(alanlar.aliciAd),
      universiteId: alanlar.universiteId || null,
      programAd: str(alanlar.programAd) || null,
      taslakId: alanlar.taslakId || null,
      konu: String(alanlar.konu || ""),
      govde: String(alanlar.govde || ""),
      durum: DURUMLAR.indexOf(alanlar.durum) >= 0 ? alanlar.durum : "taslak",
      olusturma: t,
      guncelleme: t,
      gonderim: null,
      yanitNotu: "",
      yanitTarihi: null
    };
  }

  // ------------------------------------------------------------------------
  // 5. Hazır teyit taslakları (Tur 12) — değişkensiz, hazır metin
  // ------------------------------------------------------------------------
  var TASLAK_ULKELER = ["de", "it", "at", "ch", "nl", "be", "fr", "es", "se", "fi", "dk", "ie", "hu", "pl", "cz", "genel"];
  var MODEL_DUZEY = { "lise": "lisans", "lise-mezun": "lisans", "uni-mezun": "yl" };

  /** Taslak şeması (üretilmiş dosya). Dönüş: sorun listesi. */
  function taslakDogrula(t) {
    var p = [];
    if (!t || typeof t !== "object") return ["taslak nesne değil"];
    ["id", "kime", "konu", "metin"].forEach(function (k) { if (bos(t[k]) || typeof t[k] !== "string") p.push(k + " eksik"); });
    if (TASLAK_ULKELER.indexOf(t.ulke) < 0) p.push("ulke tanınmadı");
    if (["lisans", "yl"].indexOf(t.duzey) < 0) p.push("duzey lisans/yl olmalı");
    if (t.eposta != null && !epostaGecerli(t.eposta)) p.push("eposta geçersiz");
    if (t.eposta != null && !(t.epostaKaynak && /^https?:\/\//.test(str(t.epostaKaynak.url)))) p.push("eposta kaynaksız");
    return p;
  }

  /**
   * secim: {model: "lise"|"lise-mezun"|"uni-mezun"|null, ulke: kod | [kodlar] | "hepsi" | null}
   * Model düzeyi belirler (lise/lise mezunu -> lisans, üniversite mezunu -> yl). "genel" taslaklar ülke süzgecinden bağımsızdır.
   */
  function taslaklariSuz(liste, secim) {
    secim = secim || {};
    var duzey = MODEL_DUZEY[secim.model] || null, u = secim.ulke;
    return (Array.isArray(liste) ? liste : []).filter(function (t) {
      if (taslakDogrula(t).length) return false;
      if (duzey && t.duzey !== duzey) return false;
      if (t.ulke === "genel" || !u || u === "hepsi") return true;
      return Array.isArray(u) ? (!u.length || u.indexOf(t.ulke) >= 0) : t.ulke === u;
    });
  }

  /** Taslağın alıcısı: {kurum, eposta (yalnız kaynaklı), kaynak, adresAdayi} */
  function taslakAlicisi(t) {
    t = t || {};
    var e = epostaGecerli(t.eposta) && t.epostaKaynak && /^https?:\/\//.test(str(t.epostaKaynak.url)) ? str(t.eposta) : null;
    return { kurum: str(t.kime) || null, eposta: e, kaynak: e ? str(t.epostaKaynak.url) : null, adresAdayi: !e && epostaGecerli(t.adresAdayi) ? str(t.adresAdayi) : null };
  }

  /** Metinde doldurulmamış köşeli parantezli yer tutucular ("[Name]", "[year]"); "[eksik: …]" işaretleri hariç. */
  function yerTutucuKalan(metin) {
    var out = [], re = /\[([^\]\n]{1,80})\]/g, m;
    while ((m = re.exec(String(metin || "")))) if (!/^eksik: /.test(m[1]) && out.indexOf(m[0]) < 0) out.push(m[0]);
    return out;
  }

  /**
   * Şablonları seçilen ülke(ler)e göre süzer (Tur 12: 15 ülke). ulke: kod | [kodlar] | "hepsi".
   * Ülkeye özel şablonu olmayan ülkede yalnızca "genel" şablonlar kalır; ozelSayi bunu arayüze söyler.
   */
  function sablonUlkeSuz(sablonlar, ulke, sinif) {
    var hepsi = !ulke || ulke === "hepsi";
    var liste = (Array.isArray(sablonlar) ? sablonlar : []).filter(function (s) {
      if (!s || sablonDogrula(s).length) return false;
      if (sinif !== undefined && !sinifUygun(s, sinif)) return false;
      if (hepsi || s.ulke === "genel") return true;
      return Array.isArray(ulke) ? ulke.indexOf(s.ulke) >= 0 : s.ulke === ulke;
    });
    return { liste: liste, ozelSayi: liste.filter(function (s) { return s.ulke !== "genel"; }).length };
  }

  // ------------------------------------------------------------------------
  // 6. Üniversiteye ilk başvuru e-postası (Tur 14, Ajan 14 Faz 1)
  //    Veri: data/kocluk/ilk-basvuru-sablonlari.js · Yönergeler: kaynaklar/eposta-ornekleri/anonim/yonergeler.md
  // ------------------------------------------------------------------------
  var ILK_AMACLAR = ["ilk-iletisim", "takip"];
  var ILK_MODELLER = ["lise", "lise-mezun", "uni-mezun"];
  var ILK_KELIME = { "ilk-iletisim": [120, 220], "takip": [120, 220] };
  var YONERGE_KODU = /\((?:[^()]*[\s,])?[YK]\d{1,2}\b|(?:yönerge|kural)\s+[YK]\d{1,2}\b/i;

  /** Kelime sayısı: harf ya da rakam içeren boşlukla ayrılmış parçalar. */
  function kelimeSay(metin) {
    return String(metin || "").split(/\s+/).filter(function (w) { return /[\p{L}\p{N}]/u.test(w); }).length;
  }

  /** Metindeki numaralı soru satırları ("1. …"). */
  function numaraliSoruSayisi(metin) {
    return (String(metin || "").match(/^\s*\d+\.\s+\S/gm) || []).length;
  }

  /** İlk başvuru şablonu şema denetimi. Dönüş: sorun listesi (boşsa geçerli). */
  function ilkBasvuruSablonDogrula(s) {
    var p = [];
    if (!s || typeof s !== "object") return ["şablon nesne değil"];
    ["id", "baslik", "konu", "govde"].forEach(function (k) { if (bos(s[k]) || typeof s[k] !== "string") p.push(k + " eksik"); });
    if (ILK_AMACLAR.indexOf(s.amac) < 0) p.push("amac ilk-iletisim/takip olmalı");
    if (!Array.isArray(s.modeller) || !s.modeller.length || s.modeller.some(function (m) { return ILK_MODELLER.indexOf(m) < 0; })) p.push("modeller lise/lise-mezun/uni-mezun dizisi olmalı");
    if (s.ulke !== "*" && TASLAK_ULKELER.indexOf(s.ulke) < 0) p.push("ulke '*' ya da ülke kodu olmalı");
    if (s.dil !== "en") p.push("dil en olmalı");
    if (!Array.isArray(s.zorunluAlanlar)) p.push("zorunluAlanlar dizi olmalı");
    if (!Array.isArray(s.dayanak) || !s.dayanak.length || s.dayanak.some(function (u) { return !/^https:\/\//.test(str(u)); })) p.push("dayanak https URL dizisi olmalı");
    if (s.not != null && typeof s.not !== "string") p.push("not metin ya da null olmalı");
    // 1.1.1: yönerge kodları (Y1, K8 …) öğrenciye görünen metinde değil, yalnız yonergeKodlari alanında
    if (YONERGE_KODU.test(String(s.not || "")) || YONERGE_KODU.test(String(s.baslik || ""))) p.push("öğrenciye görünen metinde yönerge kodu olmamalı (yonergeKodlari alanını kullan)");
    if (s.yonergeKodlari != null && (!Array.isArray(s.yonergeKodlari) || s.yonergeKodlari.some(function (k) { return !/^[YK]\d{1,2}$/.test(str(k)); }))) p.push("yonergeKodlari Y/K kod dizisi olmalı");
    var hepsi = String(s.konu || "") + "\n" + String(s.govde || "");
    var acik = (hepsi.match(/\{\{#if\s/g) || []).length, kapali = (hepsi.match(/\{\{\/if\}\}/g) || []).length;
    if (acik !== kapali) p.push("koşullu blok dengesiz (#if " + acik + " / /if " + kapali + ")");
    if (numaraliSoruSayisi(s.govde) > 3) p.push("en fazla 3 numaralı soru");
    if (/@/.test(hepsi)) p.push("sabit metinde e-posta adresi olmamalı");
    return p;
  }

  /**
   * Şablon seçimi: amaç + model eşleşmesi zorunlu; ülke varyantı (ulke === kod) genel şablondan (ulke "*") önce gelir.
   * Dönüş: şablon | null
   */
  function ilkBasvuruSablonSec(liste, model, ulke, amac) {
    var uygun = (Array.isArray(liste) ? liste : []).filter(function (s) {
      return s && !ilkBasvuruSablonDogrula(s).length && s.amac === (amac || "ilk-iletisim") && s.modeller.indexOf(model) >= 0;
    });
    return uygun.filter(function (s) { return s.ulke === ulke; })[0] || uygun.filter(function (s) { return s.ulke === "*"; })[0] || null;
  }

  /** "Technical University of Munich" -> "technical-university-of-munich" (aksan ve noktalama atılır). */
  function kimlikParcasi(s) {
    return str(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").replace(/ı/g, "i")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  /**
   * data/mevzuat/ulke/<cc>.js listesindeki üniversitenin kalıcı kimliği (listede id alanı yok):
   * "<ülke>-<QS adı ya da resmi ad>" -> "de-technical-university-of-munich". Arayüz bağlantısı (?uni=) bunu kullanır.
   */
  function universiteKimligi(ulke, u) {
    if (!u) return "";
    if (u.id) return str(u.id);
    return str(ulke) + "-" + kimlikParcasi(u.qsAd || resmiAd(u.ad));
  }

  /** Ülke verisinden kimliğe göre üniversite: {ulke, universite} | null. ulkeVeri: APMEBERRA_ULKE_VERI. */
  function universiteBul(ulkeVeri, kimlik) {
    var cc = str(kimlik).split("-")[0], v = ulkeVeri && ulkeVeri[cc];
    var L = v && v.universiteler && Array.isArray(v.universiteler.liste) ? v.universiteler.liste : [];
    var u = L.filter(function (x) { return universiteKimligi(cc, x) === kimlik; })[0];
    return u ? { ulke: cc, universite: u } : null;
  }

  /** URL'nin kayıtlı alan adı (son iki etiket): "https://www.sle.kit.edu/x" -> "kit.edu". */
  function anaAlan(url) {
    var m = /^https?:\/\/([^\/?#:]+)/i.exec(str(url));
    if (!m) return "";
    var p = m[1].toLowerCase().split(".");
    return p.slice(-2).join(".");
  }

  function adNormal(s) { return kimlikParcasi(resmiAd(s)); }

  /**
   * Alıcıyı yalnızca kaynaklı kanaldan çözer (sırayla):
   *  1) eposta-sablonlari.js alici.secenekler (Ajan 13 doğrulaması) — üniversite ulkeler.js kimliğine alan adıyla eşlenir
   *  2) teyit-taslaklari.js içinde epostaKaynak'lı ve aynı kuruma (ad eşleşmesi) giden taslak (aynı düzey)
   *  3) yoksa e-posta null; iletisimSayfasi = üniversitenin başvuru sayfası (veri dosyasındaki basvuruUrl / url)
   */
  function ilkBasvuruAlicisi(universite, ulkeKod, model, kaynaklar) {
    kaynaklar = kaynaklar || {};
    var u = universite || {};
    var alanAdi = anaAlan(u.url) || anaAlan(u.basvuruUrl);
    // 1) eposta-sablonlari secenekler
    var eskiIdler = [];
    (Array.isArray(kaynaklar.ulkeler) ? kaynaklar.ulkeler : []).forEach(function (c) {
      if (!c || c.id !== ulkeKod) return;
      (Array.isArray(c.universiteler) ? c.universiteler : []).forEach(function (x) {
        if (x && x.id && alanAdi && (anaAlan(x.web) === alanAdi || anaAlan(x.url) === alanAdi)) eskiIdler.push(x.id);
      });
    });
    if (u.id) eskiIdler.push(u.id);
    var sablonlar = Array.isArray(kaynaklar.epostaSablonlari) ? kaynaklar.epostaSablonlari : [];
    for (var i = 0; i < sablonlar.length; i++) {
      var s = sablonlar[i];
      if (!s || s.ulke !== ulkeKod || !s.alici || !Array.isArray(s.alici.secenekler)) continue;
      for (var j = 0; j < eskiIdler.length; j++) {
        var a = aliciCoz(s, eskiIdler[j]);
        if (a.secenektenMi && a.eposta && /^https?:\/\//.test(a.kaynak || "")) {
          return { kurum: a.kurum, eposta: a.eposta, iletisimSayfasi: a.iletisimSayfasi, kaynak: a.kaynak, not: a.not, cozum: "eposta-sablonlari:" + eskiIdler[j] };
        }
      }
    }
    // 2) teyit taslakları (yalnız kaynaklı adres)
    var tt = kaynaklar.teyitTaslaklari;
    var liste = tt && Array.isArray(tt.taslaklar) ? tt.taslaklar : (Array.isArray(tt) ? tt : []);
    var duzey = MODEL_DUZEY[model] || null, uniAd = adNormal(u.ad), qsAd = kimlikParcasi(u.qsAd);
    for (var k = 0; k < liste.length; k++) {
      var t = liste[k];
      if (!t || t.ulke !== ulkeKod || (duzey && t.duzey !== duzey)) continue;
      var ta = taslakAlicisi(t);
      if (!ta.eposta) continue;
      var kime = adNormal(t.kime);
      if (kime && ((uniAd && (uniAd.indexOf(kime) === 0 || kime.indexOf(uniAd) === 0)) || (qsAd && (qsAd.indexOf(kime) === 0 || kime.indexOf(qsAd) === 0)))) {
        return { kurum: ta.kurum, eposta: ta.eposta, iletisimSayfasi: str(u.basvuruUrl) || str(u.url) || null, kaynak: ta.kaynak, not: null, cozum: "teyit-taslaklari:" + t.id };
      }
    }
    // 3) kaynaklı adres yok
    return { kurum: resmiAd(u.ad) || null, eposta: null, iletisimSayfasi: str(u.basvuruUrl) || str(u.url) || null, kaynak: null, not: null, cozum: "iletisim-sayfasi" };
  }

  /** Tarayıcıda varsayılan veri kaynakları (Node'da secenek ile verilir). */
  function genelVeri(ad) {
    var g = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : {});
    return g[ad];
  }

  /**
   * Üniversiteye ilk başvuru / takip e-postasını hazırlar. Saf fonksiyon; e-posta GÖNDERMEZ.
   *  profil:     auth.js profil v2 (ogrenciModeli, sinif, okul, okulSehir, dogumTarihi, egitimDili, lisans* alanları …)
   *  kullanici:  {ad, soyad}
   *  universite: data/mevzuat/ulke/<cc>.js liste öğesi ({ad, qsAd, sehir, url, basvuruUrl, …})
   *  ulkeKod:    "de", "it", …
   *  amac:       "ilk-iletisim" (varsayılan) | "takip"
   *  secenek:    {bugun, program: {ad}, sinavlarim: [id], sinavKatalogu, ilkGonderim,
   *               sablonlar, epostaSablonlari, teyitTaslaklari, ulkeler}  (tarayıcıda window.* varsayılan)
   * Dönüş: {sablonId, konu, govde, alici, eksikler[], kelimeSayisi, mailto, hazir, uyarilar[], not, dayanak[], yonergeKodlari[]}
   *        not/uyarilar öğrenciye gösterilir (kodsuz); yonergeKodlari yalnız izlenebilirlik içindir, arayüzde gösterilmez.
   *        Uygun şablon yoksa sablonId null ve eksikler ["sablon"].
   */
  function ilkBasvuruHazirla(profil, kullanici, universite, ulkeKod, amac, secenek) {
    profil = profil || {}; secenek = secenek || {};
    amac = amac || "ilk-iletisim";
    var sablonlar = secenek.sablonlar || genelVeri("APMEBERRA_ILK_BASVURU_SABLONLARI") || [];
    var d = degiskenler(profil, kullanici, {
      dil: "en", ulke: ulkeKod, bugun: secenek.bugun, universite: universite ? { ad: universite.ad, sehir: universite.sehir, ulke: ulkeKod } : null,
      program: secenek.program || null, sinavlarim: secenek.sinavlarim, sinavKatalogu: secenek.sinavKatalogu || genelVeri("APMEBERRA_SINAVLAR"),
      ilkGonderim: secenek.ilkGonderim
    });
    var model = d.ogrenci.model;
    var s = ilkBasvuruSablonSec(sablonlar, model, ulkeKod, amac);
    if (!s) return { sablonId: null, konu: "", govde: "", alici: null, eksikler: ["sablon"], kelimeSayisi: 0, mailto: null, hazir: false, uyarilar: ["Bu model/ülke/amaç için şablon yok."], not: null, dayanak: [], yonergeKodlari: [] };
    var r = olustur(s, d);
    var alici = ilkBasvuruAlicisi(universite, ulkeKod, model, {
      epostaSablonlari: secenek.epostaSablonlari || genelVeri("APMEBERRA_EPOSTA_SABLONLARI"),
      teyitTaslaklari: secenek.teyitTaslaklari || genelVeri("APMEBERRA_TEYIT_TASLAKLARI"),
      ulkeler: secenek.ulkeler || genelVeri("APMEBERRA_ULKELER")
    });
    var uyarilar = [];
    if (/[ğışİĞŞçÇöÖüÜ]/.test(d.ogrenci.lisansAlani)) uyarilar.push("Lisans alanın Türkçe görünüyor; e-postada İngilizce adını kullan (ör. Mechanical Engineering).");
    if (!alici.eposta) uyarilar.push("Bu üniversite için kaynaklı bir e-posta adresi yok; metni üniversitenin iletişim/başvuru sayfasındaki forma ya da sayfada yazan adrese gönder.");
    var kelime = kelimeSay(r.govde), sinir = ILK_KELIME[amac] || [120, 220];
    if (kelime < sinir[0] || kelime > sinir[1]) uyarilar.push("Gövde " + kelime + " kelime (hedef " + sinir[0] + "–" + sinir[1] + ").");
    return {
      sablonId: s.id,
      amac: amac,
      model: model,
      ulke: ulkeKod,
      universiteId: universiteKimligi(ulkeKod, universite),
      konu: r.konu,
      govde: r.govde,
      alici: alici,
      eksikler: r.eksikler,
      kelimeSayisi: kelime,
      mailto: mailto(alici.eposta || "", r.konu, r.govde),
      hazir: r.eksikler.length === 0,
      uyarilar: uyarilar,
      not: s.not || null,
      dayanak: s.dayanak.slice(),
      yonergeKodlari: Array.isArray(s.yonergeKodlari) ? s.yonergeKodlari.slice() : []
    };
  }

  return {
    SURUM: SURUM,
    MAILTO_SINIR: MAILTO_SINIR,
    DEPO_ANAHTARI: DEPO_ANAHTARI,
    DURUMLAR: DURUMLAR,
    ETIKETLER: ETIKETLER,
    KAYNAK: KAYNAK,
    degiskenler: degiskenler,
    olustur: olustur,
    mailto: mailto,
    yerTutucular: yerTutucular,
    kalanEksikler: kalanEksikler,
    ogretimYili: ogretimYili,
    mezuniyetYili: mezuniyetYili,
    varsayilanHedefYili: varsayilanHedefYili,
    hedefBaslangicYili: hedefBaslangicYili,
    takvimYili: takvimYili,
    tarihYaz: tarihYaz,
    resmiAd: resmiAd,
    programAdi: programAdi,
    epostaGecerli: epostaGecerli,
    sablonDogrula: sablonDogrula,
    sablonlariSuz: sablonlariSuz,
    sinifUygun: sinifUygun,
    universiteSecimi: universiteSecimi,
    aliciCoz: aliciCoz,
    depoNormalize: depoNormalize,
    yeniKayit: yeniKayit,
    taslakDogrula: taslakDogrula,
    taslaklariSuz: taslaklariSuz,
    taslakAlicisi: taslakAlicisi,
    yerTutucuKalan: yerTutucuKalan,
    sablonUlkeSuz: sablonUlkeSuz,
    // Tur 14 — ilk başvuru e-postası
    ILK_AMACLAR: ILK_AMACLAR,
    YONERGE_KODU: YONERGE_KODU,
    ULKE_YEREL_DIL: ULKE_YEREL_DIL,
    kosulYollari: kosulYollari,
    kosullariCoz: kosullariCoz,
    kelimeSay: kelimeSay,
    numaraliSoruSayisi: numaraliSoruSayisi,
    ilkBasvuruSablonDogrula: ilkBasvuruSablonDogrula,
    ilkBasvuruSablonSec: ilkBasvuruSablonSec,
    ilkBasvuruAlicisi: ilkBasvuruAlicisi,
    ilkBasvuruHazirla: ilkBasvuruHazirla,
    universiteKimligi: universiteKimligi,
    universiteBul: universiteBul,
    etiket: function (yol) { return ETIKETLER[yol] || yol; }
  };
});
