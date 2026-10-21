/**
 * Meberra — Ülkeye özel yol (rota) motoru (Ajan 11, Tur 6)
 * Sözleşme: .agents/rules/tur5-platform-spec.md §8
 *
 * Saf fonksiyonlar: DOM'a, localStorage'a ve global veriye dokunmaz.
 * Tarayıcıda window.APMEBERRA_ROTA, Node'da module.exports olarak kullanılır.
 * Mezuniyet yılı eposta.js'teki mezuniyetYili() ile hesaplanır (kod çoğaltılmaz):
 * tarayıcıda eposta.js rota.js'ten ÖNCE yüklenmelidir; Node'da require edilir.
 *
 *   aktifRota(profil, istenen)                 -> "de" | "it" | null
 *   takvimYili(profil, bugun)                  -> öğrencide mezuniyet yılı, mezunda hedef başlangıç yılı (K5-a)
 *   adimUygun(adim, profil)                    -> sınıf (siniflar) + koşul (kosul) + eğitim dili (dil) filtresi
 *   dilUygun(adim, dil)                        -> Tur 12: adım.dil yoksa iki yola da ait; varsa yalnız seçilen dilde (en | yerel)
 *   adimKesinlik(adim, yil)                    -> kesinlikYila[yil] varsa o, yoksa kesinlik (K5-c)
 *   zamanCizelgesi(rota, profil, bugun, durum) -> {mezuniyetYili, takvimYili, sinif, adimlar[], siradaki, ...}
 *
 * Mezun kuralı (Tur 10, K5): takvim mezunun hedef başlangıç yılına göre hesaplanır. mezuniyetGore < 0 olan
 * (okul dönemine denk gelen) adımlar mezunda gizlenmez; tarihi bugünden önceye düşüyorsa "Şimdi" olarak bu aya
 * alınır (siniflar alanı bu adımları zaten herkese açık tutuyor; karar notu §4.1'de "mezunda hemen").
 *   siradakiAdimlar(cizelge, n)                -> bekleyen ilk n adım
 *   sinavRolu(rota, sinavId)                   -> "zorunlu" | "secmeli" | null
 *   durumNormalize / adimIsaretle / belgeIsaretle  -> apmeberra:rota:v1 yardımcıları
 */
(function (root, factory) {
  "use strict";
  var E = null;
  if (typeof module === "object" && module && module.exports) {
    try { E = require("./eposta.js"); } catch (e) { E = null; }
  }
  var api = factory(function () { return E || (root && root.APMEBERRA_EPOSTA) || null; });
  if (typeof module === "object" && module && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.APMEBERRA_ROTA = api;
  else if (root && !root.APMEBERRA_ROTA) root.APMEBERRA_ROTA = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (eposta) {
  "use strict";

  var SURUM = "1.0.0";
  var DEPO_ANAHTARI = "apmeberra:rota:v1";
  /** 1.8.0: eski "x.html" bağlantısı → temiz adres (tablo assets/js/adresler.js; bulunamazsa olduğu gibi) */
  function temizAdres(h) {
    var A = (typeof globalThis !== "undefined" && globalThis.MEBERRA_ADRES) || null;
    if (!A && typeof module === "object" && module && module.exports && typeof require === "function") { try { A = require("./adresler.js"); } catch (e) { A = null; } }
    return A ? A.temiz(h) : h;
  }
  // Tur 11 (D7): 15 ülke profilde seçilebilir; tarihli rota verisi (ulke-rotalari.js) yalnızca TARIHLI_ROTA ülkelerinde var.
  var ULKELER = ["de", "it", "at", "ch", "nl", "be", "fr", "es", "se", "fi", "dk", "ie", "hu", "pl", "cz"];
  var TARIHLI_ROTA = ["de", "it"];
  var ULKE_AD = { de: "Almanya", it: "İtalya", at: "Avusturya", ch: "İsviçre", nl: "Hollanda", be: "Belçika", fr: "Fransa", es: "İspanya", se: "İsveç", fi: "Finlandiya", dk: "Danimarka", ie: "İrlanda", hu: "Macaristan", pl: "Polonya", cz: "Çekya" };
  var KESINLIKLER = ["Doğrulandı", "Yoruma açık", "Yayımlanmadı", "Teyit gerekir", "Doğrulanamadı"];
  var TURLER = ["sinav", "belge", "basvuru", "karar", "hazirlik", "bilgi"];
  /** Adım koşulları (Tur 10, K5-a). "yerlesme-yok": uygun alanda yerleşmesi olan mezunda gizlenir. */
  var KOSULLAR = ["yerlesme-yok"];
  var YERLESME = ["uygun", "yok", "alan-uyumsuz"];
  var AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  function arr(x) { return Array.isArray(x) ? x : []; }
  function isObj(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }
  function str(v) { return v == null ? "" : String(v).trim(); }

  /** Date | "YYYY-MM-DD" | ISO -> Date (yerel gün). */
  function gunOku(v) {
    if (v instanceof Date) return isNaN(v.getTime()) ? new Date() : v;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str(v));
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    var t = v ? new Date(v) : new Date();
    return isNaN(t.getTime()) ? new Date() : t;
  }

  // ------------------------------------------------------------------------
  // Profil yardımcıları
  // ------------------------------------------------------------------------
  /** Profilde seçili ve tanınan ülkeler. */
  function profilUlkeleri(profil) {
    return arr(profil && profil.ulkeler).filter(function (u, i, a) { return ULKELER.indexOf(u) >= 0 && a.indexOf(u) === i; });
  }

  /**
   * Gösterilecek rota: istenen (ör. ?ulke=) profilde varsa o; yoksa profildeki aktifRota;
   * o da yoksa profilin ilk ülkesi. Profilde ülke yoksa null.
   */
  function aktifRota(profil, istenen) {
    var ul = profilUlkeleri(profil);
    if (!ul.length) return null;
    if (istenen && ul.indexOf(istenen) >= 0) return istenen;
    if (profil && ul.indexOf(profil.aktifRota) >= 0) return profil.aktifRota;
    return ul[0];
  }

  /** Mezuniyet yılı — eposta.js'teki tek hesap (2026-27 referansı: 11 -> 2028). */
  function mezuniyetYili(profil, bugun) {
    var E = eposta();
    if (!E || typeof E.mezuniyetYili !== "function") return null;
    return E.mezuniyetYili(profil && profil.sinif, profil && profil.mezuniyetYili, gunOku(bugun));
  }

  /** Takvimin dayandığı yıl (eposta.js takvimYili): mezunda hedef başlangıç yılı, öğrencide mezuniyet yılı. */
  function takvimYili(profil, bugun) {
    var E = eposta();
    if (!E || typeof E.takvimYili !== "function") return null;
    return E.takvimYili(profil || {}, gunOku(bugun));
  }

  function mezunMu(profil) { return str(profil && profil.sinif) === "mezun"; }
  /** Mezunun yerleşme durumu; mezun değilse ya da tanınmıyorsa null (bilinmiyor). */
  function yerlesmeDurumu(profil) {
    var y = str(profil && profil.yerlesmeDurumu);
    return mezunMu(profil) && YERLESME.indexOf(y) >= 0 ? y : null;
  }

  // ------------------------------------------------------------------------
  // Şema denetimi (§8.1) — sorun listesi; boşsa geçerli
  // ------------------------------------------------------------------------
  function rotaDogrula(rota) {
    var p = [];
    if (!isObj(rota)) return ["rota nesne değil"];
    if (!str(rota.ad)) p.push("ad eksik");
    if (!isObj(rota.temelKural)) p.push("temelKural eksik");
    if (!Array.isArray(rota.adimlar)) p.push("adimlar dizi olmalı");
    var ids = {};
    arr(rota.adimlar).forEach(function (a, i) {
      if (!isObj(a) || !str(a.id)) { p.push("adimlar[" + i + "].id eksik"); return; }
      if (ids[a.id]) p.push("tekrar eden adım id: " + a.id);
      ids[a.id] = true;
      if (!str(a.baslik)) p.push(a.id + ": baslik eksik");
      if (a.kesinlik && KESINLIKLER.indexOf(a.kesinlik) < 0) p.push(a.id + ": kesinlik tanınmadı");
      if (a.siniflar != null && !Array.isArray(a.siniflar)) p.push(a.id + ": siniflar dizi ya da null olmalı");
      if (a.zaman != null && !isObj(a.zaman)) p.push(a.id + ": zaman nesne olmalı");
      if (isObj(a.zaman) && a.zaman.ay != null && !(+a.zaman.ay >= 1 && +a.zaman.ay <= 12)) p.push(a.id + ": zaman.ay 1–12 olmalı");
      if (a.kosul != null && KOSULLAR.indexOf(a.kosul) < 0) p.push(a.id + ": kosul tanınmadı");
      if (a.dil != null && a.dil !== "en" && a.dil !== "yerel") p.push(a.id + ": dil en | yerel olmalı");
      if (a.kesinlikYila != null) {
        if (!isObj(a.kesinlikYila)) p.push(a.id + ": kesinlikYila nesne olmalı");
        else Object.keys(a.kesinlikYila).forEach(function (y) {
          if (!/^\d{4}$/.test(y)) p.push(a.id + ": kesinlikYila anahtarı 4 haneli yıl olmalı (" + y + ")");
          if (KESINLIKLER.indexOf(a.kesinlikYila[y]) < 0) p.push(a.id + ": kesinlikYila[" + y + "] tanınmadı");
        });
      }
    });
    ["belgeler", "uyarilar", "kosullar", "acikKararlar"].forEach(function (k) {
      if (rota[k] != null && !Array.isArray(rota[k])) p.push(k + " dizi olmalı");
    });
    if (rota.sinavlar != null && !isObj(rota.sinavlar)) p.push("sinavlar nesne olmalı");
    return p;
  }

  // ------------------------------------------------------------------------
  // Zaman çizelgesi
  // ------------------------------------------------------------------------
  /** Adımın sınıfa uygunluğu: siniflar null/boş -> herkes. */
  function sinifUygun(adim, sinif) {
    var s = adim && adim.siniflar;
    if (!Array.isArray(s) || !s.length) return true;
    return s.map(String).indexOf(String(sinif || "")) >= 0;
  }

  /**
   * Adımın koşula uygunluğu (K5-a). kosul yoksa herkes.
   * "yerlesme-yok": mezun olmayanlarda her zaman; mezunda yerleşme durumu "yok", "alan-uyumsuz"
   * ya da henüz bilinmiyorsa (eski profil) gösterilir. Yalnızca "uygun" yerleşmesi olan mezunda gizlenir.
   * Tanınmayan koşul adımı gizlemez (rotaDogrula ayrıca bildirir).
   */
  function kosulUygun(adim, profil) {
    var k = adim && adim.kosul;
    if (!k) return true;
    if (k === "yerlesme-yok") return !(mezunMu(profil) && yerlesmeDurumu(profil) === "uygun");
    return true;
  }

  /** Profilin eğitim dili (Tur 11 şeması): "yerel" ya da varsayılan "en". */
  function egitimDili(profil) { return profil && profil.egitimDili === "yerel" ? "yerel" : "en"; }

  /**
   * Tur 12 (PM): adım isteğe bağlı dil: "en" | "yerel" taşır. Kural madde.dil ile aynı: alan yoksa adım iki yola
   * da aittir; varsa yalnız seçilen eğitim diliyle eşleşince gösterilir. dil verilmezse süzme yapılmaz.
   */
  function dilUygun(adim, dil) {
    var d = adim && adim.dil;
    if (d == null || d === "" || (dil !== "en" && dil !== "yerel")) return true;
    return d === dil;
  }

  /** Sınıf + koşul + eğitim dili filtresi birlikte. */
  function adimUygun(adim, profil) {
    return sinifUygun(adim, profil && profil.sinif) && kosulUygun(adim, profil) && dilUygun(adim, egitimDili(profil));
  }

  /** Yıla bağlı kesinlik (K5-c): kesinlikYila[takvim yılı] tanınan bir etiketse o, yoksa kesinlik. */
  function adimKesinlik(adim, yil) {
    var ky = adim && isObj(adim.kesinlikYila) ? adim.kesinlikYila : null;
    var v = ky && yil != null ? ky[String(yil)] : null;
    return v && KESINLIKLER.indexOf(v) >= 0 ? v : (adim && adim.kesinlik) || "";
  }

  /**
   * Adımın takvim tarihi: yil = mezuniyetYili (mezunda hedef yıl) + mezuniyetGore, ay = zaman.ay.
   * simdi (Date, yalnızca mezun için verilir): mezuniyetGore < 0 olan bir adımın tarihi bu aydan önceye
   * düşüyorsa adım "Şimdi" olarak bu aya alınır (simdi: true). Mezun için okul dönemi geride kaldığından
   * bu adımlar "Geçmiş" değil, hemen yapılacak işlerdir.
   * Dönüş: {yil, ay|null, sira, etiket, metin, simdi?} | null (tarihlenemiyor)
   */
  function adimTarihi(adim, mezYil, simdi) {
    var z = isObj(adim && adim.zaman) ? adim.zaman : null;
    var metin = z ? str(z.metin) : "";
    if (!z || !mezYil || typeof z.mezuniyetGore !== "number" || !isFinite(z.mezuniyetGore)) {
      return metin ? { yil: null, ay: null, sira: null, etiket: "", metin: metin } : null;
    }
    var yil = mezYil + Math.round(z.mezuniyetGore);
    var ay = +z.ay >= 1 && +z.ay <= 12 ? Math.round(+z.ay) : null;
    var sira = yil * 100 + (ay || 13);          // ay yoksa yılın sonuna
    if (simdi instanceof Date && !isNaN(simdi.getTime()) && Math.round(z.mezuniyetGore) < 0) {
      var sy = simdi.getFullYear(), sa = simdi.getMonth() + 1;
      if (sira < sy * 100 + sa) {
        return { yil: sy, ay: sa, sira: sy * 100 + sa, etiket: "Şimdi · " + AYLAR[sa - 1] + " " + sy, metin: metin, simdi: true };
      }
    }
    return {
      yil: yil,
      ay: ay,
      sira: sira,
      etiket: (ay ? AYLAR[ay - 1] + " " : "") + yil,
      metin: metin
    };
  }

  /**
   * rota:   APMEBERRA_ROTALAR[ulke]
   * profil: {sinif, mezuniyetYili?, ...}
   * bugun:  Date | "YYYY-MM-DD"
   * durum:  apmeberra:rota:v1[ulke] (isteğe bağlı) -> {adimlar: {id: {durum, tarih}}}
   *
   * Dönüş: {
   *   mezuniyetYili (gerçek; mezunda profildeki yıl ya da null), takvimYili (tarih hesabının yılı),
   *   mezun, hedefYil (mezunda takvimYili, değilse null), yerlesmeDurumu, sinif, bugunSira,
   *   adimlar: [{id, baslik, ..., kesinlik (yıla göre), kesinlikVeri, tarih: {yil, ay, etiket, metin, simdi?} | null,
   *              zamanDurumu: "gecmis"|"buay"|"gelecek"|"belirsiz", yapildi, yapildiTarih, gecikti, siradaki}],
   *   gizlenen: gösterilmeyen adım sayısı (gizlenenSinif + gizlenenKosul),
   *   siradaki: ilk bekleyen (geçmemiş) adım | null,
   *   sayac: {toplam, yapildi, bekleyen, gecikmis}
   * }
   */
  function zamanCizelgesi(rota, profil, bugun, durum) {
    profil = profil || {};
    var d = gunOku(bugun);
    var bugunSira = d.getFullYear() * 100 + (d.getMonth() + 1);
    var mezun = mezunMu(profil);
    var mezYil = mezuniyetYili(profil, d);
    var takYil = takvimYili(profil, d);
    var sinif = str(profil.sinif);
    var kayit = isObj(durum) && isObj(durum.adimlar) ? durum.adimlar : {};
    var tum = arr(rota && rota.adimlar).filter(function (a) { return isObj(a) && str(a.id); });
    var sinifta = tum.filter(function (a) { return sinifUygun(a, sinif); });
    var kosulda = sinifta.filter(function (a) { return kosulUygun(a, profil); });
    var dil = egitimDili(profil);
    var gorunen = kosulda.filter(function (a) { return dilUygun(a, dil); });

    var adimlar = gorunen.map(function (a, i) {
      var t = adimTarihi(a, takYil, mezun ? d : null);
      var zd = !t || t.sira == null ? "belirsiz"
        : (t.ay ? (t.sira < bugunSira ? "gecmis" : t.sira === bugunSira ? "buay" : "gelecek")
                : (t.yil < d.getFullYear() ? "gecmis" : "gelecek"));
      var k = isObj(kayit[a.id]) ? kayit[a.id] : null;
      var yapildi = !!k && k.durum === "yapildi";
      var o = {};
      Object.keys(a).forEach(function (key) { o[key] = a[key]; });
      o.kesinlikVeri = a.kesinlik || "";
      o.kesinlik = adimKesinlik(a, takYil);
      o.tarih = t;
      o.zamanDurumu = zd;
      o.yapildi = yapildi;
      o.yapildiTarih = yapildi ? (k.tarih || null) : null;
      o.gecikti = !yapildi && zd === "gecmis" && a.zorunlu !== false;
      o.siradaki = false;
      o._i = i;
      return o;
    });
    // Tarihe göre sırala; tarihsizler sona; eşitlikte verideki sıra korunur
    adimlar.sort(function (x, y) {
      var a = x.tarih && x.tarih.sira != null ? x.tarih.sira : Infinity;
      var b = y.tarih && y.tarih.sira != null ? y.tarih.sira : Infinity;
      return a === b ? x._i - y._i : a - b;
    });
    adimlar.forEach(function (x) { delete x._i; });

    var siradaki = null;
    for (var i = 0; i < adimlar.length; i++) {
      if (!adimlar[i].yapildi && adimlar[i].zamanDurumu !== "gecmis") { siradaki = adimlar[i]; break; }
    }
    if (siradaki) siradaki.siradaki = true;

    return {
      mezuniyetYili: mezYil,
      takvimYili: takYil,
      mezun: mezun,
      hedefYil: mezun ? takYil : null,
      yerlesmeDurumu: yerlesmeDurumu(profil),
      sinif: sinif,
      bugunSira: bugunSira,
      adimlar: adimlar,
      gizlenen: tum.length - gorunen.length,
      gizlenenSinif: tum.length - sinifta.length,
      gizlenenKosul: sinifta.length - kosulda.length,
      gizlenenDil: kosulda.length - gorunen.length,
      egitimDili: dil,
      siradaki: siradaki,
      sayac: {
        toplam: adimlar.length,
        yapildi: adimlar.filter(function (x) { return x.yapildi; }).length,
        bekleyen: adimlar.filter(function (x) { return !x.yapildi; }).length,
        gecikmis: adimlar.filter(function (x) { return x.gecikti; }).length
      }
    };
  }

  /** Panel için: sıradaki adımdan başlayarak bekleyen ilk n adım (geçmiş seçmeliler atlanır). */
  function siradakiAdimlar(cizelge, n) {
    var list = arr(cizelge && cizelge.adimlar);
    var bas = cizelge && cizelge.siradaki ? list.indexOf(cizelge.siradaki) : list.length;
    return list.slice(Math.max(0, bas)).filter(function (x) { return !x.yapildi; }).slice(0, n || 4);
  }

  // ------------------------------------------------------------------------
  // Sınavlar
  // ------------------------------------------------------------------------
  /** "ielts-academic|toefl-ibt" -> ["ielts-academic", "toefl-ibt"] */
  function secenekler(giris) { return str(giris).split("|").map(str).filter(Boolean); }

  /** AP sınavı mı? (/data/mevzuat/sinavlar.js id kuralı: "ap-...") */
  function apMi(id) { return /^ap-/.test(str(id)); }

  /**
   * {zorunlu: [[id, ...], ...], secmeli: [[id, ...], ...], notlar: {}} — her iç dizi "biri yeterli" grubudur.
   * profil mezunsa AP sınavları çıkarılır (K5-b: mezuniyetten sonra alınan AP Almanya'da giriş hakkı vermez,
   * İtalya'da kabul şartı değil; karar notu §2 A1).
   */
  function sinavGruplari(rota, profil) {
    var s = isObj(rota && rota.sinavlar) ? rota.sinavlar : {};
    var apYok = mezunMu(profil);
    function suz(g) { return apYok ? g.filter(function (id) { return !apMi(id); }) : g; }
    return {
      zorunlu: arr(s.zorunlu).map(secenekler).map(suz).filter(function (g) { return g.length; }),
      secmeli: arr(s.secmeli).map(secenekler).map(suz).filter(function (g) { return g.length; }),
      notlar: isObj(s.notlar) ? s.notlar : {}
    };
  }

  /** Bir sınavın bu rotadaki rolü: "zorunlu" | "secmeli" | null (profil mezunsa AP'ler null) */
  function sinavRolu(rota, sinavId, profil) {
    var g = sinavGruplari(rota, profil);
    function icinde(gr) { return gr.some(function (x) { return x.indexOf(sinavId) >= 0; }); }
    if (icinde(g.zorunlu)) return "zorunlu";
    if (icinde(g.secmeli)) return "secmeli";
    return null;
  }

  /** Bir sınavın "biri yeterli" grubundaki diğer seçenekler. */
  function alternatifler(rota, sinavId, profil) {
    var g = sinavGruplari(rota, profil), out = [];
    g.zorunlu.concat(g.secmeli).forEach(function (gr) {
      if (gr.indexOf(sinavId) >= 0) gr.forEach(function (x) { if (x !== sinavId && out.indexOf(x) < 0) out.push(x); });
    });
    return out;
  }

  // ------------------------------------------------------------------------
  // Şablonlar (Başvurularım): aktif rotanın şablonları önce
  // ------------------------------------------------------------------------
  /** Rota adımlarında bağlanan şablon id'leri (sırayla, tekrarsız). */
  function rotaSablonlari(rota) {
    var out = [];
    arr(rota && rota.adimlar).forEach(function (a) {
      var id = a && isObj(a.bagli) ? str(a.bagli.sablon) : "";
      if (id && out.indexOf(id) < 0) out.push(id);
    });
    return out;
  }

  /**
   * Sıralama: 0 = rotanın adımlarında bağlı şablon, 1 = aktif ülkenin diğer şablonları,
   * 2 = genel, 3 = diğer ülke. Grup içinde verideki sıra korunur (kararlı).
   */
  function sablonSirala(sablonlar, aktif, rota) {
    var bagli = rotaSablonlari(rota);
    function grup(s) {
      if (!s) return 9;
      if (bagli.indexOf(s.id) >= 0 && (s.ulke === aktif || s.ulke === "genel")) return 0;
      if (s.ulke === aktif) return 1;
      if (s.ulke === "genel") return 2;
      return 3;
    }
    return arr(sablonlar).map(function (s, i) { return { s: s, g: grup(s), i: i }; })
      .sort(function (a, b) { return a.g - b.g || a.i - b.i; })
      .map(function (x) { return x.s; });
  }

  // ------------------------------------------------------------------------
  // Durum deposu: apmeberra:rota:v1
  // { de: { adimlar: { <id>: { durum: "yapildi"|"bekliyor", tarih } }, belgeler: { <id>: bool } }, it: {...} }
  // ------------------------------------------------------------------------
  function durumNormalize(ham) {
    var out = {};
    // de/it her zaman; diğer ülkeler ve YL anahtarları ("nl", "nl-yl", "genel") yalnızca kayıt varsa (Tur 11, plan §6.2)
    var anahtarlar = TARIHLI_ROTA.slice();
    if (isObj(ham)) Object.keys(ham).forEach(function (k) {
      var m = /^([a-z]{2})(-yl)?$/.exec(k);
      if (anahtarlar.indexOf(k) < 0 && ((m && ULKELER.indexOf(m[1]) >= 0) || k === "genel") && isObj(ham[k])) anahtarlar.push(k);
    });
    anahtarlar.forEach(function (u) {
      var h = isObj(ham) && isObj(ham[u]) ? ham[u] : {};
      var ad = {}, bel = {};
      if (isObj(h.adimlar)) Object.keys(h.adimlar).forEach(function (id) {
        var k = h.adimlar[id];
        if (!isObj(k)) return;
        ad[id] = { durum: k.durum === "yapildi" ? "yapildi" : "bekliyor", tarih: typeof k.tarih === "string" ? k.tarih : null };
      });
      if (isObj(h.belgeler)) Object.keys(h.belgeler).forEach(function (id) { if (h.belgeler[id] === true) bel[id] = true; });
      out[u] = { adimlar: ad, belgeler: bel };
    });
    return out;
  }

  /** Yeni durum nesnesi döndürür (girdiyi değiştirmez). */
  /** Durum deposu anahtarı mı? (15 ülke kodu, "<kod>-yl" ya da "genel") */
  function durumAnahtariMi(k) { var m = /^([a-z]{2})(-yl)?$/.exec(String(k || "")); return k === "genel" || !!(m && ULKELER.indexOf(m[1]) >= 0); }
  function adimIsaretle(durum, ulke, adimId, yapildi, simdi) {
    var d = durumNormalize(durum);
    if (!d[ulke] && durumAnahtariMi(ulke)) d[ulke] = { adimlar: {}, belgeler: {} }; // Tur 11: nl, nl-yl, genel
    if (!d[ulke] || !str(adimId)) return d;
    d[ulke].adimlar[adimId] = { durum: yapildi ? "yapildi" : "bekliyor", tarih: (simdi ? gunOku(simdi) : new Date()).toISOString() };
    return d;
  }
  function belgeIsaretle(durum, ulke, belgeId, var_) {
    var d = durumNormalize(durum);
    if (!d[ulke] && durumAnahtariMi(ulke)) d[ulke] = { adimlar: {}, belgeler: {} };
    if (!d[ulke] || !str(belgeId)) return d;
    if (var_) d[ulke].belgeler[belgeId] = true; else delete d[ulke].belgeler[belgeId];
    return d;
  }

  // ------------------------------------------------------------------------
  // Profile özel uyarılar (/data/mevzuat/ulke-rotalari.js -> window.APMEBERRA_ROTA_UYARILARI)
  // ------------------------------------------------------------------------
  /**
   * kosul: "mezun-de-it" -> profil mezun ve hedef ülkelerinde hem Almanya hem İtalya var (K4-a).
   * Dönüş: profile uyan uyarılar (verideki sırayla). Tanınmayan koşullu uyarı gösterilmez.
   */
  function profilUyarilari(uyarilar, profil) {
    var ul = profilUlkeleri(profil);
    return arr(uyarilar).filter(function (u) {
      if (!isObj(u) || !str(u.metin)) return false;
      if (u.kosul === "mezun-de-it") return mezunMu(profil) && ul.indexOf("de") >= 0 && ul.indexOf("it") >= 0;
      return false;
    });
  }

  var SAYFA_AD = {
    "/universiteler": "Üniversitelerim", "/rehber/almanya": "Almanya rehberi", "/rehber/italya": "İtalya rehberi",
    "/sinavlar": "Sınavlar", "/basvurular": "Başvurularım", "/kaynaklar": "Kaynaklar",
    "/rehber/istanbul-sinav": "İstanbul sınav rehberi", "/profil": "Profilim", "/takvim": "Takvimim",
    "/seviye-testi": "Seviye testi", "/deneme": "Denemeler", "/ders/cent-s": "CEnT-S hazırlığı"
  };
  /** Bağlı öğe -> {tur, id, href, etiket}. Yalnızca yerel ve güvenli yollar. */
  function bagliHedef(bagli) {
    if (!isObj(bagli)) return null;
    if (str(bagli.sablon) && /^[A-Za-z0-9._-]+$/.test(bagli.sablon)) {
      return { tur: "sablon", id: bagli.sablon, href: "/basvurular?sablon=" + encodeURIComponent(bagli.sablon), etiket: "E-postayı hazırla" };
    }
    if (str(bagli.sinav) && /^[A-Za-z0-9._-]+$/.test(bagli.sinav)) {
      return { tur: "sinav", id: bagli.sinav, href: "/sinavlar#" + encodeURIComponent(bagli.sinav), etiket: "Sınava git" };
    }
    if (str(bagli.sayfa) && /^[A-Za-z0-9._-]+\.html([?#][A-Za-z0-9._=&#-]*)?$/.test(bagli.sayfa)) {
      // Veride eski dosya adı (ör. universiteler.html#de); bağlantı temiz adrese çevrilir (1.8.0, assets/js/adresler.js)
      var href = temizAdres(bagli.sayfa);
      return { tur: "sayfa", id: bagli.sayfa, href: href, etiket: SAYFA_AD[href.split(/[?#]/)[0]] || "Sayfayı aç" };
    }
    return null;
  }

  return {
    SURUM: SURUM,
    DEPO_ANAHTARI: DEPO_ANAHTARI,
    ULKELER: ULKELER,
    TARIHLI_ROTA: TARIHLI_ROTA,
    ULKE_AD: ULKE_AD,
    KESINLIKLER: KESINLIKLER,
    TURLER: TURLER,
    KOSULLAR: KOSULLAR,
    YERLESME: YERLESME,
    AYLAR: AYLAR,
    profilUlkeleri: profilUlkeleri,
    aktifRota: aktifRota,
    mezuniyetYili: mezuniyetYili,
    takvimYili: takvimYili,
    yerlesmeDurumu: yerlesmeDurumu,
    rotaDogrula: rotaDogrula,
    sinifUygun: sinifUygun,
    kosulUygun: kosulUygun,
    adimUygun: adimUygun,
    dilUygun: dilUygun,
    egitimDili: egitimDili,
    adimKesinlik: adimKesinlik,
    apMi: apMi,
    profilUyarilari: profilUyarilari,
    adimTarihi: adimTarihi,
    zamanCizelgesi: zamanCizelgesi,
    siradakiAdimlar: siradakiAdimlar,
    sinavGruplari: sinavGruplari,
    sinavRolu: sinavRolu,
    alternatifler: alternatifler,
    rotaSablonlari: rotaSablonlari,
    sablonSirala: sablonSirala,
    durumNormalize: durumNormalize,
    adimIsaretle: adimIsaretle,
    belgeIsaretle: belgeIsaretle,
    bagliHedef: bagliHedef
  };
});
