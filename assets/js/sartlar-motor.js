/**
 * AP MEBERRA — Herkese açık "Ülke şartları" motoru (Ajan 11, Tur 10, Karar K4)
 * Sayfa: sartlar.html · Veri: data/mevzuat/sartlar.js (window.APMEBERRA_SARTLAR)
 *
 * Saf fonksiyonlar: DOM'a ve localStorage'a dokunmaz. Tarayıcıda window.APMEBERRA_SARTLAR_MOTOR,
 * Node'da module.exports. Sınıf filtresi ve tarih hesabı rota.js (APMEBERRA_ROTA) ve
 * eposta.js (APMEBERRA_EPOSTA) üzerinden yapılır; kod çoğaltılmaz. Tarayıcıda bu iki dosya
 * sartlar-motor.js'ten ÖNCE yüklenmelidir; Node'da require edilir.
 *
 *   secimOku(search)                  -> {ulke: "de"|"it"|null, sinif: "9".."12"|"mezun"|null}
 *   secimUrl(sayfa, ulke, sinif)      -> "sartlar.html?ulke=de&sinif=11"
 *   maddeDogrula(m) / veriDogrula(v)  -> sorun listesi (boşsa geçerli)
 *   bolumler(veri, ulke, sinif)       -> {gerekenler, buYil, tarihler, hatalar} (yalnızca geçerli maddeler)
 *   goreliZaman(zaman)                -> {etiket, donem} ör. "11. sınıf · Kasım"
 *   yolHaritasi(rota, sinif, bugun, dil) -> data/mevzuat/ulke-rotalari.js adımlarının sınıfa (ve Tur 12: eğitim diline, adım.dil) göre süzülmüş, göreli zamanlı listesi
 *
 * Tur 11 (D1–D8; .agents/rules/tur11-ekran-plani.md §5.5) — model × 15 ülke × dil:
 *   secimCoz(search)                  -> {model, sinif, ulke, dil, duzey, notlar[]} (eski ?sinif=mezun uyumlu)
 *   secimAdres(sayfa, secim)          -> "sartlar.html?model=lise&sinif=11&ulke=nl&dil=en"
 *   programDurumu(dizinKaydi, duzey, dil) / programDurumuTuret(ilk20, duzey, dil)
 *   ulkeBolumleri(ulkeVeri, secim, ylGenel) -> bölümler (ortak + dil bloğu + sınıf notları, madde.dil süzgeci)
 *   universiteSuz(liste, filtre) · duyuruSuz(liste, secim, bugun) · genelYol(veri, sablon, secim, opts, bugun)
 *   ulkeVeriDogrula / dizinDogrula / ylGenelDogrula / duyuruDogrula -> sorun listesi
 */
(function (root, factory) {
  "use strict";
  var R = null, E = null;
  if (typeof module === "object" && module && module.exports) {
    try { R = require("./rota.js"); } catch (e) { R = null; }
    try { E = require("./eposta.js"); } catch (e) { E = null; }
  }
  var api = factory(
    function () { return R || (root && root.APMEBERRA_ROTA) || null; },
    function () { return E || (root && root.APMEBERRA_EPOSTA) || null; }
  );
  if (typeof module === "object" && module && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.APMEBERRA_SARTLAR_MOTOR = api;
  else if (root && !root.APMEBERRA_SARTLAR_MOTOR) root.APMEBERRA_SARTLAR_MOTOR = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (rota, eposta) {
  "use strict";

  var SURUM = "1.0.0";
  var ULKELER = ["de", "it"];
  var ULKE_AD = { de: "Almanya", it: "İtalya" };
  var SINIFLAR = ["9", "10", "11", "12", "mezun"];
  var KESINLIKLER = ["Doğrulandı", "Yoruma açık", "Yayımlanmadı", "Teyit gerekir", "Doğrulanamadı"];
  var AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  /** Sayfadaki dört içerik bölümü (sıra sabit). "gerekenler" = ülke.ortak + sınıf.gerekenler */
  var BOLUMLER = [
    { id: "gerekenler", baslik: "Ne gerekiyor" },
    { id: "buYil", baslik: "Bu yıl ne yapmalısın" },
    { id: "tarihler", baslik: "Kaçırılmaması gereken tarihler" },
    { id: "hatalar", baslik: "Sık yapılan hatalar" }
  ];
  var SINIF_ALANLARI = ["gerekenler", "buYil", "tarihler", "hatalar"];

  function arr(x) { return Array.isArray(x) ? x : []; }
  function isObj(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }
  function str(v) { return v == null ? "" : String(v).trim(); }
  function isUrl(u) { return typeof u === "string" && /^https?:\/\/[^\s<>"']+$/i.test(u); }
  function isGun(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str(s));
    if (!m) return false;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getMonth() === +m[2] - 1 && d.getDate() === +m[3];
  }

  // ------------------------------------------------------------------------
  // Seçim (URL) — depolama yok; paylaşılabilir bağlantı
  // ------------------------------------------------------------------------
  function ulkeNorm(v) { v = str(v).toLowerCase(); return ULKELER.indexOf(v) >= 0 ? v : null; }
  function sinifNorm(v) { v = str(v).toLowerCase(); return SINIFLAR.indexOf(v) >= 0 ? v : null; }

  /** "?ulke=de&sinif=11" -> {ulke, sinif}; tanınmayan değer null olur. */
  function secimOku(search) {
    var out = { ulke: null, sinif: null };
    String(search || "").replace(/^\?/, "").split("&").forEach(function (p) {
      var i = p.indexOf("="); if (i < 0) return;
      var k = p.slice(0, i), v;
      try { v = decodeURIComponent(p.slice(i + 1).replace(/\+/g, " ")); } catch (e) { return; }
      if (k === "ulke" && !out.ulke) out.ulke = ulkeNorm(v);
      if (k === "sinif" && !out.sinif) out.sinif = sinifNorm(v);
    });
    return out;
  }

  /** Sayfa + seçim -> göreli adres. Geçersiz değerler yazılmaz. */
  function secimUrl(sayfa, ulke, sinif) {
    var q = [];
    if (ulkeNorm(ulke)) q.push("ulke=" + ulkeNorm(ulke));
    if (sinifNorm(sinif)) q.push("sinif=" + sinifNorm(sinif));
    return (sayfa || "sartlar.html") + (q.length ? "?" + q.join("&") : "");
  }

  function sinifAd(s) { return s === "mezun" ? "Mezun" : (sinifNorm(s) ? s + ". sınıf" : ""); }

  // ------------------------------------------------------------------------
  // Şema denetimi (data/mevzuat/sartlar.js başındaki ŞEMA notu)
  // ------------------------------------------------------------------------
  function maddeDogrula(m, yer) {
    var p = [], y = yer || "madde";
    if (!isObj(m)) return [y + ": nesne değil"];
    if (!str(m.metin)) p.push(y + ": metin eksik");
    if (/<[a-z\/!]/i.test(str(m.metin) + str(m.baslik))) p.push(y + ": HTML etiketi kullanılamaz (düz metin)");
    if (m.id != null && !/^[a-z0-9-]{2,64}$/.test(str(m.id))) p.push(y + ": id yalnızca küçük harf, rakam ve tire olmalı");
    var k = arr(m.kaynak);
    if (!Array.isArray(m.kaynak) || !k.length) p.push(y + ": en az bir kaynak {ad, url} gerekli");
    k.forEach(function (x, i) {
      if (!isObj(x) || !str(x.ad)) p.push(y + ": kaynak[" + i + "].ad eksik");
      if (!isObj(x) || !isUrl(x.url)) p.push(y + ": kaynak[" + i + "].url http(s) adresi olmalı");
    });
    if (KESINLIKLER.indexOf(m.kesinlik) < 0) p.push(y + ": kesinlik tanınmadı (" + KESINLIKLER.join(" / ") + ")");
    if (!isGun(m.sonKontrol)) p.push(y + ": sonKontrol YYYY-AA-GG olmalı");
    if (m.zaman != null) {
      var z = m.zaman;
      if (!isObj(z)) p.push(y + ": zaman nesne olmalı");
      else {
        if (z.mezuniyetGore != null && !(typeof z.mezuniyetGore === "number" && isFinite(z.mezuniyetGore))) p.push(y + ": zaman.mezuniyetGore sayı olmalı");
        if (z.ay != null && !(+z.ay >= 1 && +z.ay <= 12 && Math.round(+z.ay) === +z.ay)) p.push(y + ": zaman.ay 1–12 olmalı");
        if (z.hedefYilaGore != null && !(typeof z.hedefYilaGore === "number" && isFinite(z.hedefYilaGore))) p.push(y + ": zaman.hedefYilaGore sayı olmalı");
        if (z.mezuniyetGore == null && z.hedefYilaGore == null && !str(z.metin)) p.push(y + ": zaman.metin, zaman.mezuniyetGore ya da zaman.hedefYilaGore gerekli");
      }
    }
    return p;
  }

  function veriDogrula(v) {
    var p = [];
    if (!isObj(v)) return ["APMEBERRA_SARTLAR nesne değil"];
    if (!str(v.surum)) p.push("surum eksik");
    if (v.sonKontrol != null && !isGun(v.sonKontrol)) p.push("sonKontrol YYYY-AA-GG ya da null olmalı");
    if (!isObj(v.ulkeler)) return p.concat(["ulkeler nesne olmalı"]);
    var ids = {};
    function kontrol(list, yer) {
      if (!Array.isArray(list)) { p.push(yer + " dizi olmalı"); return; }
      list.forEach(function (m, i) {
        maddeDogrula(m, yer + "[" + i + "]").forEach(function (x) { p.push(x); });
        if (isObj(m) && m.id != null) { if (ids[m.id]) p.push(yer + "[" + i + "]: tekrar eden id " + m.id); ids[m.id] = true; }
      });
    }
    ULKELER.forEach(function (u) {
      var c = v.ulkeler[u];
      if (!isObj(c)) { p.push("ulkeler." + u + " eksik"); return; }
      if (!str(c.ad)) p.push("ulkeler." + u + ".ad eksik");
      kontrol(c.ortak, u + ".ortak");
      if (!isObj(c.siniflar)) { p.push(u + ".siniflar nesne olmalı"); return; }
      SINIFLAR.forEach(function (s) {
        var sn = c.siniflar[s];
        if (!isObj(sn)) { p.push(u + ".siniflar." + s + " eksik"); return; }
        SINIF_ALANLARI.forEach(function (a) { kontrol(sn[a], u + "." + s + "." + a); });
      });
    });
    Object.keys(v.ulkeler).forEach(function (u) { if (ULKELER.indexOf(u) < 0) p.push("tanınmayan ülke: " + u); });
    return p;
  }

  /** Bir ülke + sınıf için dört bölüm. Geçersiz maddeler (şemaya uymayan) gösterilmez. */
  function bolumler(veri, ulke, sinif) {
    var out = { gerekenler: [], buYil: [], tarihler: [], hatalar: [], atlanan: 0 };
    var c = isObj(veri) && isObj(veri.ulkeler) ? veri.ulkeler[ulkeNorm(ulke)] : null;
    if (!isObj(c)) return out;
    var sn = isObj(c.siniflar) && isObj(c.siniflar[sinifNorm(sinif)]) ? c.siniflar[sinifNorm(sinif)] : {};
    function al(list, hedef) {
      arr(list).forEach(function (m) {
        if (maddeDogrula(m).length) { out.atlanan++; return; }
        out[hedef].push(m);
      });
    }
    al(c.ortak, "gerekenler");
    al(sn.gerekenler, "gerekenler");
    al(sn.buYil, "buYil");
    al(sn.tarihler, "tarihler");
    al(sn.hatalar, "hatalar");
    // Tarihler: göreli zamana göre sırala (zamansızlar sonda, verideki sıra korunur)
    out.tarihler = out.tarihler.map(function (m, i) { return { m: m, k: zamanSirasi(m.zaman), i: i }; })
      .sort(function (a, b) { return a.k === b.k ? a.i - b.i : a.k - b.k; }).map(function (x) { return x.m; });
    return out;
  }

  // ------------------------------------------------------------------------
  // Göreli zaman (mezuniyet yılına göre) — ulke-rotalari.js ile aynı anlam:
  // mezuniyetGore = mezuniyet yılına göre yıl farkı, ay 1–12. Mezuniyet Haziran'dadır.
  // ------------------------------------------------------------------------
  function zamanSirasi(z) {
    if (!isObj(z) || typeof z.mezuniyetGore !== "number" || !isFinite(z.mezuniyetGore)) return Infinity;
    var ay = +z.ay >= 1 && +z.ay <= 12 ? Math.round(+z.ay) : 13;
    return Math.round(z.mezuniyetGore) * 100 + ay;
  }

  /**
   * zaman -> {etiket, donem}
   * donem: {tur: "sinif", sinif: "11"} | {tur: "yaz", sonra: "11"} | {tur: "mezuniyetYazi"} | {tur: "sonra"} | {tur: "yil", fark} | null
   * Ör. {mezuniyetGore: -2, ay: 11} -> "11. sınıf · Kasım"; {0, 7} -> "Mezuniyet yazı · Temmuz"; {0, 9} -> "Mezuniyetten sonra · Eylül"
   */
  function goreliZaman(z) {
    // Tur 11: hedef (başlangıç) yılına göre zaman — YL ve mezun maddeleri
    if (isObj(z) && typeof z.mezuniyetGore !== "number" && typeof z.hedefYilaGore === "number" && isFinite(z.hedefYilaGore)) {
      var hg = Math.round(z.hedefYilaGore), hay = +z.ay >= 1 && +z.ay <= 12 ? Math.round(+z.ay) : null;
      var he = hg === 0 ? "Başlangıç yılı" : hg < 0 ? (hg === -1 ? "Başlangıçtan önceki yıl" : "Başlangıçtan " + (-hg) + " yıl önce") : "Başlangıçtan " + hg + " yıl sonra";
      return { etiket: he + (hay ? " · " + AYLAR[hay - 1] : ""), donem: { tur: "hedef", fark: hg } };
    }
    if (!isObj(z) || typeof z.mezuniyetGore !== "number" || !isFinite(z.mezuniyetGore)) {
      return { etiket: isObj(z) ? str(z.metin) : "", donem: null };
    }
    var g = Math.round(z.mezuniyetGore);
    var ay = +z.ay >= 1 && +z.ay <= 12 ? Math.round(+z.ay) : null;
    var donem, etiket;
    if (!ay) {
      donem = { tur: "yil", fark: g };
      etiket = g === 0 ? "Mezuniyet yılı" : g < 0 ? "Mezuniyetten " + (-g) + " yıl önce" : "Mezuniyetten " + g + " yıl sonra";
      return { etiket: etiket, donem: donem };
    }
    var k = ay >= 9 ? g + 1 : g;           // içinde bulunulan öğretim yılının bittiği yılın mezuniyete göre farkı
    if (ay === 7 || ay === 8) {
      if (g === 0) { donem = { tur: "mezuniyetYazi" }; etiket = "Mezuniyet yazı"; }
      else if (g < 0 && 12 + g >= 9) { donem = { tur: "yaz", sonra: String(12 + g) }; etiket = (12 + g) + ". sınıftan sonraki yaz"; }
      else if (g > 0) { donem = { tur: "sonra" }; etiket = "Mezuniyetten sonra"; }
      else { donem = { tur: "yil", fark: g }; etiket = "Mezuniyetten " + (-g) + " yıl önce"; }
    } else if (k >= 1) {
      donem = { tur: "sonra" }; etiket = "Mezuniyetten sonra";
    } else if (12 + k >= 9) {
      donem = { tur: "sinif", sinif: String(12 + k) }; etiket = (12 + k) + ". sınıf";
    } else {
      donem = { tur: "yil", fark: k }; etiket = "Lise öncesi";
    }
    return { etiket: etiket + " · " + AYLAR[ay - 1], donem: donem };
  }

  /** Seçilen sınıf için "bu öğretim yılı" mı? (o sınıfın dersleri ya da hemen sonraki yaz) */
  function buYilMi(donem, sinif) {
    if (!donem || !sinifNorm(sinif) || sinif === "mezun") return false;
    return (donem.tur === "sinif" && donem.sinif === sinif) || (donem.tur === "yaz" && donem.sonra === sinif);
  }

  function gunOku(v) {
    if (v instanceof Date && !isNaN(v.getTime())) return v;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str(v));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date();
  }

  /** Mezuniyet yılı (eposta.js'teki tek hesap). Mezun ve bilinmeyen sınıf için null. */
  function mezuniyetYili(sinif, bugun) {
    var E = eposta();
    if (!E || typeof E.mezuniyetYili !== "function" || sinif === "mezun") return null;
    return E.mezuniyetYili(sinif, null, gunOku(bugun));
  }

  /**
   * Mezun için kesinlik etiketlerinin hesaplandığı hedef yıl (Tur 10, K5-c). Herkese açık sayfada profil
   * olmadığından mezunun en erken hedefi, yani bir sonraki akademik yıl varsayılır (14 Ekim 2026 -> 2027 = 2027/28).
   * Takvim tarihleri mezunda yine gösterilmez (göreli zaman); yalnızca kesinlik bu yıla göre seçilir.
   */
  function mezunHedefYili(sinif, bugun) {
    var E = eposta();
    if (sinif !== "mezun" || !E || typeof E.varsayilanHedefYili !== "function") return null;
    return E.varsayilanHedefYili(gunOku(bugun));
  }

  var KOSUL_NOTU = { "yerlesme-yok": "Mezunsan: yalnızca yerleşmen yoksa ya da yerleştiğin alan hedefinle uyumlu değilse" };

  /**
   * Genel yol haritası: rota (APMEBERRA_ROTALAR[ulke]) adımlarından seçilen sınıfa uyanlar.
   * Koşullu adımlar (kosul) profil olmadığı için gizlenmez; mezun seçiminde kosulNotu ile işaretlenir.
   * Dönüş: {mezuniyetYili, hedefYili (mezunda), toplam, gizlenen, adimlar: [{id, baslik, detay, kaynak, kesinlik
   *          (yıla göre), tur, zorunlu, kosul, kosulNotu, goreli, donem, tarih: "Kasım 2026"|null, metin, gecti, buYil}]}
   */
  function yolHaritasi(rotaVeri, sinif, bugun, dil) {
    var R = rota();
    var tum = arr(rotaVeri && rotaVeri.adimlar).filter(function (a) { return isObj(a) && str(a.id) && str(a.baslik); });
    // Tur 12 (PM): adım.dil yoksa iki yola da ait; varsa yalnız seçilen eğitim dilinde (madde.dil kuralı)
    var dilde = function (a) { return a.dil == null || a.dil === "" || (dil !== "en" && dil !== "yerel") || a.dil === dil; };
    var uygun = function (a) {
      if (R && typeof R.sinifUygun === "function") return R.sinifUygun(a, sinif);
      return !Array.isArray(a.siniflar) || !a.siniflar.length || a.siniflar.map(String).indexOf(String(sinif)) >= 0;
    };
    var d = gunOku(bugun);
    var bugunSira = d.getFullYear() * 100 + (d.getMonth() + 1);
    var mez = mezuniyetYili(sinif, d);
    var hedef = mezunHedefYili(sinif, d);
    var kesYil = mez || hedef;
    var dilli = tum.filter(dilde);
    var gorunen = dilli.filter(uygun);
    var adimlar = gorunen.map(function (a, i) {
      var gz = goreliZaman(a.zaman);
      var t = mez && R && typeof R.adimTarihi === "function" ? R.adimTarihi(a, mez) : null;
      var gecti = !!(t && t.sira != null && (t.ay ? t.sira < bugunSira : t.yil < d.getFullYear()));
      var kesinlik = R && typeof R.adimKesinlik === "function" ? R.adimKesinlik(a, kesYil) : (a.kesinlik || "");
      return {
        id: a.id, baslik: a.baslik, detay: a.detay || "", kaynak: a.kaynak || "", kesinlik: kesinlik,
        tur: a.tur || "", zorunlu: a.zorunlu !== false, bagli: a.bagli || null,
        kosul: a.kosul || null, kosulNotu: sinif === "mezun" && a.kosul ? (KOSUL_NOTU[a.kosul] || "") : "",
        goreli: gz.etiket, donem: gz.donem,
        tarih: t && t.etiket ? t.etiket : null,
        metin: isObj(a.zaman) ? str(a.zaman.metin) : "",
        gecti: gecti,
        buYil: buYilMi(gz.donem, sinif),
        _k: zamanSirasi(a.zaman), _i: i
      };
    }).sort(function (x, y) { return x._k === y._k ? x._i - y._i : x._k - y._k; });
    adimlar.forEach(function (x) { delete x._k; delete x._i; });
    return { mezuniyetYili: mez, hedefYili: hedef, toplam: tum.length, gizlenen: dilli.length - gorunen.length, gizlenenDil: tum.length - dilli.length, adimlar: adimlar };
  }

  // ------------------------------------------------------------------------
  // Mezun Menüsü (mezun.html · data/mevzuat/mezun-ulkeler.js, Tur 10)
  // ------------------------------------------------------------------------
  var MEZUN_ULKELER = ["hu", "pl"];
  var MEZUN_ROZETLER = ["Teyit gerekir"];

  /** "?ulke=pl" -> "pl"; tanınmayan değer null. */
  function mezunUlkeOku(search) {
    var m = /[?&]ulke=([a-z]{2})(?:&|#|$)/i.exec(String(search || ""));
    var u = m ? m[1].toLowerCase() : null;
    return MEZUN_ULKELER.indexOf(u) >= 0 ? u : null;
  }

  /** data/mevzuat/mezun-ulkeler.js şema denetimi; sorun listesi (boşsa geçerli). */
  function mezunVeriDogrula(v) {
    var p = [], ids = {};
    if (!isObj(v)) return ["APMEBERRA_MEZUN_ULKELER nesne değil"];
    if (!str(v.surum)) p.push("surum eksik");
    if (v.sonKontrol != null && !isGun(v.sonKontrol)) p.push("sonKontrol YYYY-AA-GG olmalı");
    if (!Array.isArray(v.anaRotalar) || v.anaRotalar.some(function (u) { return ULKELER.indexOf(u) < 0; })) p.push("anaRotalar yalnızca de/it içermeli");
    function madde(m, yer) {
      maddeDogrula(m, yer).forEach(function (x) { p.push(x); });
      if (isObj(m) && m.id != null) { if (ids[m.id]) p.push(yer + ": tekrar eden id " + m.id); ids[m.id] = true; }
    }
    arr(v.duyurular).forEach(function (d, i) {
      madde(d, "duyurular[" + i + "]");
      if (!isObj(d) || !isGun(d.bitis)) p.push("duyurular[" + i + "]: bitis YYYY-AA-GG olmalı");
    });
    if (!isObj(v.ulkeler)) p.push("ulkeler nesne olmalı");
    else MEZUN_ULKELER.forEach(function (u) {
      var c = v.ulkeler[u];
      if (!isObj(c)) { p.push("ulkeler." + u + " eksik"); return; }
      if (!str(c.ad)) p.push(u + ".ad eksik");
      if (c.rozet != null && MEZUN_ROZETLER.indexOf(c.rozet) < 0) p.push(u + ".rozet tanınmadı");
      ["ortak", "buYil", "tarihler", "hatalar"].forEach(function (a) {
        if (!Array.isArray(c[a])) { p.push(u + "." + a + " dizi olmalı"); return; }
        c[a].forEach(function (m, i) { madde(m, u + "." + a + "[" + i + "]"); });
      });
    });
    arr(v.digerleri).forEach(function (d, i) {
      if (!isObj(d) || !str(d.ad) || !str(d.neden)) p.push("digerleri[" + i + "]: ad ve neden gerekli");
      if (!isObj(d) || !arr(d.kaynak).length || arr(d.kaynak).some(function (k) { return !isObj(k) || !isUrl(k.url) || !str(k.ad); })) p.push("digerleri[" + i + "]: kaynak {ad, url} gerekli");
    });
    return p;
  }

  /** Bitiş gününe kadar (o gün dahil) geçerli ve şemaya uyan duyurular. */
  function aktifDuyurular(v, bugun) {
    var d = gunOku(bugun);
    var bs = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return arr(isObj(v) ? v.duyurular : null).filter(function (x) {
      if (!isObj(x) || maddeDogrula(x).length || !isGun(x.bitis)) return false;
      return +x.bitis.replace(/-/g, "") >= bs;
    });
  }

  /** Bir mezun ülkesinin dört bölümü (gerekenler = ortak). Geçersiz maddeler gösterilmez. */
  function mezunBolumler(v, ulke) {
    var out = { gerekenler: [], buYil: [], tarihler: [], hatalar: [], atlanan: 0 };
    var c = isObj(v) && isObj(v.ulkeler) ? v.ulkeler[ulke] : null;
    if (!isObj(c)) return out;
    [["ortak", "gerekenler"], ["buYil", "buYil"], ["tarihler", "tarihler"], ["hatalar", "hatalar"]].forEach(function (k) {
      arr(c[k[0]]).forEach(function (m) { if (maddeDogrula(m).length) out.atlanan++; else out[k[1]].push(m); });
    });
    return out;
  }

  // ========================================================================
  // Tur 11 (karar D1–D8, PM onayı 15 Ekim 2026): öğrenci modeli × 15 ülke × eğitim dili
  // Veri: data/mevzuat/ulke-dizini.js (APMEBERRA_ULKE_DIZINI), data/mevzuat/ulke/<cc>.js
  // (APMEBERRA_ULKE_VERI[cc]), yl-genel.js, duyurular.js — hepsi araclar/ulke-veri-olustur.js üretir.
  // Yukarıdaki Tur 10 işlevleri (secimOku, bolumler, mezun*) geriye uyum için aynen duruyor.
  // ========================================================================
  var MODELLER = ["lise", "lise-mezun", "uni-mezun"];
  var MODEL_AD = { "lise": "Lise öğrencisi", "lise-mezun": "Lise mezunu", "uni-mezun": "Üniversite mezunu" };
  var LISE_SINIFLARI = ["9", "10", "11", "12"];
  var ULKE_KODLARI = ["de", "it", "at", "ch", "nl", "be", "fr", "es", "se", "fi", "dk", "ie", "hu", "pl", "cz"];
  var ULKE_ADLARI = { de: "Almanya", it: "İtalya", at: "Avusturya", ch: "İsviçre", nl: "Hollanda", be: "Belçika", fr: "Fransa", es: "İspanya", se: "İsveç", fi: "Finlandiya", dk: "Danimarka", ie: "İrlanda", hu: "Macaristan", pl: "Polonya", cz: "Çekya" };
  Object.keys(ULKE_ADLARI).forEach(function (k) { if (!ULKE_AD[k]) ULKE_AD[k] = ULKE_ADLARI[k]; });
  var DILLER = ["en", "yerel"];
  var DUZEYLER = ["lisans", "yl"];
  /** Program durumu (dizin): ülke düzeyinde seçilen dilde program var mı */
  var PROGRAM_DURUM = {
    "genis": { etiket: "Geniş", simge: "●", sinif: "ok" },
    "kisitli": { etiket: "Kısıtlı", simge: "◔", sinif: "warn" },
    "yok": { etiket: "Yok", simge: "○", sinif: "bad" },
    "teyit": { etiket: "Teyit gerekir", simge: "?", sinif: "warn" },
    "veri-yok": { etiket: "Hazırlanıyor", simge: "–", sinif: "muted" }
  };
  /**
   * Üniversite satırındaki dil hücresi. PM kararı K-A: kaynaktaki "kısıtlı" -> kismi, "Doğrulanamadı" -> teyit (üretici eşler).
   * K-B: teyit hücresi gizlenmez; "uzun" etiketle işaretlenir.
   */
  var UNI_DIL = {
    "var": { etiket: "Var", simge: "●", sinif: "ok" },
    "kismi": { etiket: "Kısıtlı", simge: "◔", sinif: "warn" },
    "yok": { etiket: "Yok", simge: "○", sinif: "bad" },
    "teyit": { etiket: "Doğrulanamadı", uzun: "Doğrulanamadı — resmi katalogdan kontrol et", simge: "?", sinif: "warn" }
  };
  var ULKE_ROZETLER = ["Teyit gerekir", "Kısmi veri"];
  var DIL_BOLUMLERI = ["gerekenler", "tarihler", "hatalar"];

  function modelNorm(v) { v = str(v).toLowerCase(); return MODELLER.indexOf(v) >= 0 ? v : null; }
  function ulkeKodNorm(v) { v = str(v).toLowerCase(); return ULKE_KODLARI.indexOf(v) >= 0 ? v : null; }
  function duzeyOf(model) { return model === "uni-mezun" ? "yl" : "lisans"; }
  /** Yerel dili yalnızca İngilizce olan ülke (İrlanda): dil seçimi yok. */
  function yalnizIngilizce(ulke, dizinKaydi) {
    var y = dizinKaydi && Array.isArray(dizinKaydi.yerelDil) ? dizinKaydi.yerelDil : (ulke === "ie" ? ["en"] : null);
    return !!(y && y.length && y.every(function (d) { return d === "en"; }));
  }

  /**
   * "?model=lise&sinif=11&ulke=nl&dil=en" -> {model, sinif, ulke, dil, duzey, notlar[]}
   * Geriye uyum (plan §2.3): ?sinif=mezun -> lise-mezun; ?sinif=9..12 (model yok) -> lise; uni-mezun'da sınıf düşer;
   * İrlanda'da dil her zaman "en". dil yoksa ya da tanınmazsa "en".
   */
  function secimCoz(search) {
    var ham = {};
    String(search || "").replace(/^\?/, "").split("&").forEach(function (p) {
      var i = p.indexOf("="); if (i < 0) return;
      var k = p.slice(0, i), v;
      try { v = decodeURIComponent(p.slice(i + 1).replace(/\+/g, " ")); } catch (e) { return; }
      if (["model", "sinif", "ulke", "dil"].indexOf(k) >= 0 && !(k in ham)) ham[k] = str(v).toLowerCase();
    });
    var notlar = [];
    var model = modelNorm(ham.model);
    var sinif = sinifNorm(ham.sinif);
    if (sinif === "mezun") {
      if (!model || model === "lise") { model = "lise-mezun"; if (ham.model === "lise") notlar.push("sinif-mezun"); }
      sinif = null;
    } else if (sinif && !model) model = "lise";
    if (model !== "lise") { if (sinif) notlar.push("sinif-yok-sayildi"); sinif = null; }
    var ulke = ulkeKodNorm(ham.ulke);
    var dil = DILLER.indexOf(ham.dil) >= 0 ? ham.dil : "en";
    if (ulke && dil === "yerel" && yalnizIngilizce(ulke)) { dil = "en"; notlar.push("ie-yerel"); }
    return { model: model, sinif: sinif, ulke: ulke, dil: dil, duzey: model ? duzeyOf(model) : null, notlar: notlar };
  }

  /** Seçim -> kanonik göreli adres (sıra: model, sinif, ulke, dil). dil yalnızca ülke seçiliyse yazılır. */
  function secimAdres(sayfa, s) {
    s = s || {};
    var q = [], model = modelNorm(s.model), ulke = ulkeKodNorm(s.ulke);
    if (model) q.push("model=" + model);
    if (model === "lise" && LISE_SINIFLARI.indexOf(str(s.sinif)) >= 0) q.push("sinif=" + str(s.sinif));
    if (ulke) q.push("ulke=" + ulke);
    if (ulke) q.push("dil=" + (s.dil === "yerel" && !yalnizIngilizce(ulke) ? "yerel" : "en"));
    return (sayfa || "sartlar.html") + (q.length ? "?" + q.join("&") : "");
  }

  function modelAd(m) { return MODEL_AD[m] || ""; }
  function dilAd(dil, dizinKaydi, dilAdlari) {
    if (dil !== "yerel") return "İngilizce";
    var ad = dizinKaydi && dizinKaydi.yerelDilAd;
    if (ad) return ad;
    var y = dizinKaydi && Array.isArray(dizinKaydi.yerelDil) ? dizinKaydi.yerelDil : [];
    var n = y.map(function (d) { return (dilAdlari && dilAdlari[d]) || d; }).join(" / ");
    return n || "Yerel dil";
  }

  /** Ülke dizini kaydı için program durumu: genis | kisitli | yok | teyit | veri-yok */
  function programDurumu(kayit, duzey, dil) {
    if (!isObj(kayit) || !isObj(kayit.program)) return "veri-yok";
    var d = kayit.program[duzey === "yl" ? "yl" : "lisans"];
    var anahtar = dil === "yerel" && !yalnizIngilizce(kayit.kod, kayit) ? "yerel" : "en";
    var v = isObj(d) ? d[anahtar] : null;
    return PROGRAM_DURUM[v] ? v : "veri-yok";
  }

  /**
   * Üretici kuralı (PM kararı, 15 Ekim 2026; plan §5.2'nin yerine): özet yalnızca "var" sayısına bakar.
   * var >= 5 -> genis; listenin çoğunluğu teyit (Doğrulanamadı) -> teyit; var 1–4 ya da yalnız kısıtlı -> kisitli;
   * hiç var/kısıtlı yok ama yok -> yok; liste yoksa veri-yok. Sayımın yanıltabileceği yerde ülke kaynağı ozetUyari verir (K-D).
   */
  function programDurumuTuret(liste, duzey, dil) {
    var l = arr(liste);
    if (!l.length) return "veri-yok";
    var alan = duzey === "yl" ? "yuksekLisans" : "lisans";
    var n = { "var": 0, "kismi": 0, "yok": 0, "teyit": 0 };
    l.forEach(function (u) { var b = isObj(u) && isObj(u[alan]) ? u[alan][dil] : null; if (n[b] != null) n[b]++; });
    if (n["var"] >= 5) return "genis";
    if (n["teyit"] * 2 > l.length) return "teyit";
    if (n["var"] >= 1 || n["kismi"] >= 1) return "kisitli";
    if (n["yok"] > 0) return "yok";
    return "veri-yok";
  }

  /** Madde, seçilen dile ait mi? (madde.dil yoksa her iki dile de aittir) */
  function dilUygun(m, dil) { return !isObj(m) || m.dil == null || m.dil === dil; }

  /**
   * Bir ülkenin seçime göre bölümleri. veri = APMEBERRA_ULKE_VERI[cc]; ylGenel = APMEBERRA_YL_GENEL (isteğe bağlı).
   * Dönüş: {gerekenler, buYil, tarihler, hatalar, apEtkisi, burslar, ornekProgramlar, ylOrtak:{...}, uyarilar, atlanan, var}
   * var: bu düzey için ülke dosyasında blok var mı (yoksa sayfa "hazırlanıyor" der).
   */
  function ulkeBolumleri(veri, secim, ylGenel) {
    secim = secim || {};
    var out = { gerekenler: [], buYil: [], tarihler: [], hatalar: [], apEtkisi: [], burslar: [], ornekProgramlar: [], ylOrtak: null, uyarilar: [], atlanan: 0, "var": false };
    var duzey = secim.duzey || duzeyOf(secim.model);
    var blok = isObj(veri) ? veri[duzey] : null;
    var dil = secim.dil === "yerel" && !yalnizIngilizce(veri && veri.ulke, veri) ? "yerel" : "en";
    function al(list, hedef) {
      arr(list).forEach(function (m) {
        if (maddeDogrula(m).length) { out.atlanan++; return; }
        if (!dilUygun(m, dil)) return;
        out[hedef].push(m);
      });
    }
    if (isObj(blok)) {
      out["var"] = true;
      var db = isObj(blok[dil]) ? blok[dil] : {};
      al(blok.ortak, "gerekenler");
      al(db.gerekenler, "gerekenler");
      if (duzey === "lisans") {
        var anahtar = secim.model === "lise-mezun" ? "mezun" : str(secim.sinif);
        var sn = isObj(blok.sinifNotlari) ? blok.sinifNotlari[anahtar] : null;
        if (Array.isArray(sn)) al(sn, "buYil");
        else if (isObj(sn)) { al(sn.gerekenler, "gerekenler"); al(sn.buYil, "buYil"); al(sn.tarihler, "tarihler"); al(sn.hatalar, "hatalar"); }
        al(blok.apEtkisi, "apEtkisi");
      }
      al(db.tarihler, "tarihler");
      al(db.hatalar, "hatalar");
      al(blok.burslar, "burslar");
      al(blok.uyarilar, "uyarilar");
      if (duzey === "yl") {
        out.ornekProgramlar = arr(blok.ornekProgramlar).filter(function (p) {
          return isObj(p) && str(p.universite) && str(p.program) && isUrl(p.url) && (p.dil == null || p.dil === dil);
        });
      }
    }
    if (duzey === "yl" && isObj(ylGenel)) {
      out.ylOrtak = {};
      ["belgeler", "turkiyeBurslari", "abBurslari", "askerlik", "takvim", "gre", "dilSinavlari"].forEach(function (k) {
        out.ylOrtak[k] = arr(ylGenel[k]).filter(function (m) { return !maddeDogrula(m).length; });
      });
    }
    out.tarihler = out.tarihler.map(function (m, i) { return { m: m, k: zamanSirasi(m.zaman), i: i }; })
      .sort(function (a, b) { return a.k === b.k ? a.i - b.i : a.k - b.k; }).map(function (x) { return x.m; });
    return out;
  }

  /**
   * İlk 20 listesini süzer. f = {duzey: "lisans"|"yl", dil: "en"|"yerel"|"hepsi", q, sehir}
   * Dil süzgecinde "var" ve "kismi" (kısıtlı) olanlar sıra numarasına göre; PM kararı K-B: "teyit" (Doğrulanamadı) olanlar
   * GİZLENMEZ, listenin sonuna eklenir ve u._teyit = true ile işaretlenir. Dönüş: {liste, toplam, gosterilen, eslesen, teyit}
   */
  function universiteSuz(liste, f) {
    f = f || {};
    var alan = f.duzey === "yl" ? "yuksekLisans" : "lisans";
    var q = str(f.q).toLocaleLowerCase("tr-TR");
    var sira = function (a, b) { return (+a.sira || 99) - (+b.sira || 99); };
    var tum = arr(liste).filter(function (u) { return isObj(u) && str(u.ad); });
    var diger = tum.filter(function (u) {
      if (f.sehir && str(u.sehir) !== str(f.sehir)) return false;
      if (q && (str(u.ad) + " " + str(u.sehir)).toLocaleLowerCase("tr-TR").indexOf(q) < 0) return false;
      return true;
    });
    var eslesen = diger, teyit = [];
    if (f.dil === "en" || f.dil === "yerel") {
      var hucre = function (u) { return isObj(u[alan]) ? u[alan][f.dil] : null; };
      eslesen = diger.filter(function (u) { var b = hucre(u); return b === "var" || b === "kismi"; });
      teyit = diger.filter(function (u) { return hucre(u) === "teyit"; }).sort(sira).map(function (u) { var o = {}; Object.keys(u).forEach(function (k) { o[k] = u[k]; }); o._teyit = true; return o; });
    }
    var l = eslesen.slice().sort(sira).concat(teyit);
    return { liste: l, toplam: tum.length, gosterilen: l.length, eslesen: eslesen.length, teyit: teyit.length };
  }

  /** PM kararı K-D: ülke özet uyarısı (dizin kaydı ozetUyari["lisans-en"] vb.). Dönüş: {metin, kaynak[]} | null */
  function ozetUyari(kayit, duzey, dil) {
    if (!isObj(kayit) || !isObj(kayit.ozetUyari)) return null;
    var d = dil === "yerel" && !yalnizIngilizce(kayit.kod, kayit) ? "yerel" : "en";
    var v = kayit.ozetUyari[(duzey === "yl" ? "yl" : "lisans") + "-" + d];
    if (typeof v === "string") return str(v) ? { metin: str(v), kaynak: [] } : null;
    return isObj(v) && str(v.metin) ? { metin: str(v.metin), kaynak: arr(v.kaynak) } : null;
  }

  /** Duyurular: şemaya uyan, bitiş gününe kadar (dahil) geçerli ve hedefi seçimle eşleşenler (boş hedef = herkes). */
  function duyuruSuz(liste, secim, bugun) {
    secim = secim || {};
    var d = gunOku(bugun);
    var bs = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    function eslesir(h, v) { return v === undefined || !Array.isArray(h) || !h.length || (v != null && h.indexOf(v) >= 0); } // undefined = bu ölçütte süzme
    return arr(liste).filter(function (x) {
      if (!isObj(x) || maddeDogrula(x).length || !isGun(x.bitis)) return false;
      if (+x.bitis.replace(/-/g, "") < bs) return false;
      var h = isObj(x.hedef) ? x.hedef : {};
      return eslesir(h.modeller, secim.model) && eslesir(h.ulkeler, secim.ulke) && eslesir(h.diller, secim.dil);
    });
  }

  /** Seçime göre başlangıç (akademik yıl) yılı: lisede mezuniyet yılı, mezunlarda hedef yıl (yoksa bir sonraki akademik yıl). */
  function baslangicYili(secim, opts, bugun) {
    opts = opts || {};
    var E = eposta(), d = gunOku(bugun);
    if (secim && secim.model === "lise") return mezuniyetYili(secim.sinif, d);
    var h = parseInt(opts.hedefYil, 10);
    if (h >= 2000 && h <= 2100) return h;
    return E && typeof E.varsayilanHedefYili === "function" ? E.varsayilanHedefYili(d) : null;
  }

  /**
   * Genel yol haritası (plan §6.2, D7): ülke dosyasındaki zamanlı maddeler + ortak şablon (genel öneri).
   * sablon = APMEBERRA_ULKE_DIZINI.genelAdimlar [{id, baslik, detay, baslangicaAy, tur}]
   * opts = {hedefYil} (mezun modellerinde profil yılı). Dönüş: {baslangicYili, adimlar:[{id, baslik, detay, kaynak[],
   *   kesinlik, tur, genel, goreli, tarih ("Haziran 2029" | null), tahmini, sira, gecti}]}
   */
  function genelYol(veri, sablon, secim, opts, bugun) {
    secim = secim || {};
    var d = gunOku(bugun);
    var bas = baslangicYili(secim, opts, d);
    var ref = bas ? bas * 12 + 8 : null;          // akademik yıl başı: Eylül (ay indeksi 8)
    var bugunIdx = d.getFullYear() * 12 + d.getMonth();
    function tarihYaz(idx) { return idx == null ? null : AYLAR[((idx % 12) + 12) % 12] + " " + Math.floor(idx / 12); }
    function goreliAy(n) {
      if (n === 0) return "Başlangıç ayı";
      var a = Math.abs(n);
      return a >= 12 && a % 12 === 0 ? "Başlangıçtan " + (a / 12) + " yıl " + (n < 0 ? "önce" : "sonra") : "Başlangıçtan " + a + " ay " + (n < 0 ? "önce" : "sonra");
    }
    var adimlar = [];
    arr(sablon).forEach(function (s, i) {
      if (!isObj(s) || !str(s.id) || !str(s.baslik) || typeof s.baslangicaAy !== "number") return;
      var idx = ref == null ? null : ref + s.baslangicaAy;
      adimlar.push({ id: s.id, baslik: s.baslik, detay: str(s.detay), kaynak: [], kesinlik: "", tur: s.tur || "hazirlik", genel: true,
        goreli: goreliAy(s.baslangicaAy), tarih: tarihYaz(idx), tahmini: idx != null, sira: idx == null ? s.baslangicaAy * 10 + i / 100 : idx, gecti: idx != null && idx < bugunIdx });
    });
    var duzey = secim.duzey || duzeyOf(secim.model);
    var blok = isObj(veri) ? veri[duzey] : null;
    if (isObj(blok)) {
      var dil = secim.dil === "yerel" && !yalnizIngilizce(veri.ulke, veri) ? "yerel" : "en";
      var aday = arr(blok.ortak).concat(arr(isObj(blok[dil]) ? blok[dil].tarihler : null), arr(isObj(blok[dil]) ? blok[dil].gerekenler : null));
      if (duzey === "lisans" && isObj(blok.sinifNotlari)) {
        var sn = blok.sinifNotlari[secim.model === "lise-mezun" ? "mezun" : str(secim.sinif)];
        if (isObj(sn)) aday = aday.concat(arr(sn.tarihler), arr(sn.buYil));
      }
      var gor = {};
      aday.forEach(function (m) {
        if (!isObj(m) || maddeDogrula(m).length || !dilUygun(m, dil) || !isObj(m.zaman) || (m.id && gor[m.id])) return;
        var z = m.zaman, ay = +z.ay >= 1 && +z.ay <= 12 ? Math.round(+z.ay) : null;
        var yil = null;
        if (typeof z.hedefYilaGore === "number" && bas) yil = bas + Math.round(z.hedefYilaGore);
        else if (typeof z.mezuniyetGore === "number" && bas) yil = bas + Math.round(z.mezuniyetGore);
        if (yil == null || !ay) return;
        if (m.id) gor[m.id] = true;
        var idx = yil * 12 + ay - 1;
        adimlar.push({ id: m.id || "", baslik: m.baslik || m.metin.slice(0, 80), detay: m.baslik ? m.metin : "", kaynak: arr(m.kaynak), kesinlik: m.kesinlik,
          tur: "tarih", genel: false, goreli: goreliAy(idx - ref), tarih: tarihYaz(idx), tahmini: true, sira: idx, gecti: idx < bugunIdx, metin: isObj(z) ? str(z.metin) : "" });
      });
    }
    adimlar.sort(function (a, b) { return a.sira - b.sira; });
    return { baslangicYili: bas, adimlar: adimlar };
  }

  // ---------------- Şema denetimi (üretici ve testler kullanır) ----------------
  function maddeListesi(list, yer, p, ids) {
    if (list == null) return;
    if (!Array.isArray(list)) { p.push(yer + " dizi olmalı"); return; }
    list.forEach(function (m, i) {
      maddeDogrula(m, yer + "[" + i + "]").forEach(function (x) { p.push(x); });
      if (isObj(m) && m.dil != null && DILLER.indexOf(m.dil) < 0) p.push(yer + "[" + i + "]: dil en|yerel olmalı");
      if (isObj(m) && m.id != null && ids) { if (ids[m.id]) p.push(yer + "[" + i + "]: tekrar eden id " + m.id); ids[m.id] = true; }
    });
  }
  function dilBlok(b, yer, p, ids) {
    if (b == null) return;
    if (!isObj(b)) { p.push(yer + " nesne olmalı"); return; }
    DIL_BOLUMLERI.forEach(function (k) { maddeListesi(b[k], yer + "." + k, p, ids); });
  }

  /** Ülke dosyası (APMEBERRA_ULKE_VERI[cc]) şeması. ids verilirse dosyalar arası tekil id denetlenir. */
  function ulkeVeriDogrula(v, ids) {
    var p = [];
    ids = ids || {};
    if (!isObj(v)) return ["ülke verisi nesne değil"];
    if (!ulkeKodNorm(v.ulke)) p.push("ulke 15 koddan biri olmalı");
    if (!str(v.ad)) p.push("ad eksik");
    if (!Array.isArray(v.yerelDil) || !v.yerelDil.length) p.push("yerelDil dizi olmalı");
    if (v.sonKontrol != null && !isGun(v.sonKontrol)) p.push("sonKontrol YYYY-AA-GG olmalı");
    if (v.rozet != null && ULKE_ROZETLER.indexOf(v.rozet) < 0) p.push("rozet tanınmadı");
    var c = v.ulke || "?";
    if (v.lisans != null) {
      var l = v.lisans;
      if (!isObj(l)) p.push(c + ".lisans nesne olmalı");
      else {
        maddeListesi(l.ortak, c + ".lisans.ortak", p, ids);
        dilBlok(l.en, c + ".lisans.en", p, ids); dilBlok(l.yerel, c + ".lisans.yerel", p, ids);
        if (l.sinifNotlari != null) {
          if (!isObj(l.sinifNotlari)) p.push(c + ".lisans.sinifNotlari nesne olmalı");
          else Object.keys(l.sinifNotlari).forEach(function (s) {
            if (SINIFLAR.indexOf(s) < 0) { p.push(c + ".lisans.sinifNotlari: tanınmayan anahtar " + s); return; }
            var x = l.sinifNotlari[s], yer = c + ".lisans.sinifNotlari." + s;
            if (Array.isArray(x)) maddeListesi(x, yer, p, ids);
            else if (isObj(x)) SINIF_ALANLARI.forEach(function (a) { maddeListesi(x[a], yer + "." + a, p, ids); });
            else p.push(yer + " dizi ya da nesne olmalı");
          });
        }
        maddeListesi(l.apEtkisi, c + ".lisans.apEtkisi", p, ids);
        maddeListesi(l.burslar, c + ".lisans.burslar", p, ids);
        maddeListesi(l.uyarilar, c + ".lisans.uyarilar", p, ids);
      }
    }
    if (v.yl != null) {
      var y = v.yl;
      if (!isObj(y)) p.push(c + ".yl nesne olmalı");
      else {
        maddeListesi(y.ortak, c + ".yl.ortak", p, ids);
        dilBlok(y.en, c + ".yl.en", p, ids); dilBlok(y.yerel, c + ".yl.yerel", p, ids);
        maddeListesi(y.burslar, c + ".yl.burslar", p, ids);
        maddeListesi(y.uyarilar, c + ".yl.uyarilar", p, ids);
        arr(y.ornekProgramlar).forEach(function (o, i) {
          var yer = c + ".yl.ornekProgramlar[" + i + "]";
          if (!isObj(o) || !str(o.universite) || !str(o.program)) p.push(yer + ": universite ve program gerekli");
          else {
            if (!isUrl(o.url)) p.push(yer + ": url http(s) olmalı");
            if (o.dil != null && DILLER.indexOf(o.dil) < 0) p.push(yer + ": dil en|yerel olmalı");
          }
        });
      }
    }
    if (v.universiteler != null) {
      var u = v.universiteler;
      if (!isObj(u) || !Array.isArray(u.liste)) p.push(c + ".universiteler {siralama, liste[]} olmalı");
      else {
        if (!isObj(u.siralama) || !str(u.siralama.ad) || !str(u.siralama.yayin) || !isUrl(u.siralama.url)) p.push(c + ".universiteler.siralama {ad, yayin, url} gerekli");
        if (u.liste.length > 20) p.push(c + ".universiteler: en fazla 20 üniversite");
        var siralar = {};
        u.liste.forEach(function (x, i) {
          var yer = c + ".universiteler[" + i + "]";
          if (!isObj(x) || !str(x.ad)) { p.push(yer + ": ad eksik"); return; }
          if (!(+x.sira >= 1 && +x.sira <= 20 && Math.round(+x.sira) === +x.sira)) p.push(yer + ": sira 1–20 tam sayı olmalı");
          else { if (siralar[x.sira]) p.push(yer + ": tekrar eden sira " + x.sira); siralar[x.sira] = true; }
          if (x.url != null && !isUrl(x.url)) p.push(yer + ": url http(s) olmalı");
          if (x.basvuruUrl != null && x.basvuruUrl !== "" && !isUrl(x.basvuruUrl)) p.push(yer + ": basvuruUrl http(s) olmalı");
          ["lisans", "yuksekLisans"].forEach(function (a) {
            if (x[a] == null) return;
            if (!isObj(x[a])) { p.push(yer + "." + a + " nesne olmalı"); return; }
            ["en", "yerel"].forEach(function (dd) { if (x[a][dd] != null && !UNI_DIL[x[a][dd]]) p.push(yer + "." + a + "." + dd + ": var|kismi|yok|teyit olmalı"); });
            if (x[a].kaynak != null && x[a].kaynak !== "" && !isUrl(x[a].kaynak) && !Array.isArray(x[a].kaynak)) p.push(yer + "." + a + ".kaynak http(s) olmalı");
            if (Array.isArray(x[a].kaynak) && x[a].kaynak.some(function (k) { return !(isUrl(k) || (isObj(k) && isUrl(k.url))); })) p.push(yer + "." + a + ".kaynak öğeleri http(s) adresi olmalı");
          });
          if (x.kesinlik != null && KESINLIKLER.indexOf(x.kesinlik) < 0) p.push(yer + ": kesinlik tanınmadı");
        });
      }
    }
    return p;
  }

  /** ulke-dizini.js şeması */
  function dizinDogrula(d) {
    var p = [];
    if (!isObj(d) || !Array.isArray(d.ulkeler)) return ["APMEBERRA_ULKE_DIZINI {ulkeler[]} olmalı"];
    var gor = {};
    d.ulkeler.forEach(function (u, i) {
      var yer = "ulkeler[" + i + "]";
      if (!isObj(u) || !ulkeKodNorm(u.kod)) { p.push(yer + ": kod 15 koddan biri olmalı"); return; }
      if (gor[u.kod]) p.push(yer + ": tekrar eden kod " + u.kod); gor[u.kod] = true;
      if (!str(u.ad) || !str(u.bulunma)) p.push(yer + ": ad ve bulunma gerekli");
      if (!Array.isArray(u.yerelDil) || !u.yerelDil.length) p.push(yer + ": yerelDil gerekli");
      if (u.grup !== "ana" && u.grup !== "diger") p.push(yer + ": grup ana|diger olmalı");
      if (u.rozet != null && ULKE_ROZETLER.indexOf(u.rozet) < 0) p.push(yer + ": rozet tanınmadı");
      if (u.portal != null && (!isObj(u.portal) || !isUrl(u.portal.url))) p.push(yer + ": portal {ad, url} olmalı");
      if (u.ozetUyari != null) {
        if (!isObj(u.ozetUyari)) p.push(yer + ": ozetUyari nesne olmalı");
        else Object.keys(u.ozetUyari).forEach(function (k) {
          var v = u.ozetUyari[k];
          if (!/^(lisans|yl)-(en|yerel)$/.test(k)) p.push(yer + ": ozetUyari anahtarı tanınmadı (" + k + ")");
          if (!(typeof v === "string" ? str(v) : isObj(v) && str(v.metin))) p.push(yer + ": ozetUyari." + k + " metin gerekli");
        });
      }
      DUZEYLER.forEach(function (z) {
        var pr = isObj(u.program) ? u.program[z] : null;
        if (!isObj(pr) || !PROGRAM_DURUM[pr.en] || !PROGRAM_DURUM[pr.yerel]) p.push(yer + ": program." + z + " {en, yerel} durumları gerekli");
      });
    });
    ULKE_KODLARI.forEach(function (k) { if (!gor[k]) p.push("eksik ülke: " + k); });
    arr(d.genelAdimlar).forEach(function (s, i) { if (!isObj(s) || !str(s.id) || !str(s.baslik) || typeof s.baslangicaAy !== "number") p.push("genelAdimlar[" + i + "]: id, baslik, baslangicaAy gerekli"); });
    return p;
  }

  /** yl-genel.js şeması */
  function ylGenelDogrula(g) {
    var p = [], ids = {};
    if (!isObj(g)) return ["APMEBERRA_YL_GENEL nesne değil"];
    ["belgeler", "turkiyeBurslari", "abBurslari", "askerlik", "takvim", "gre", "dilSinavlari"].forEach(function (k) { maddeListesi(g[k], "yl-genel." + k, p, ids); });
    return p;
  }

  /** duyurular.js şeması */
  function duyuruDogrula(list) {
    var p = [], ids = {};
    if (!Array.isArray(list)) return ["APMEBERRA_DUYURULAR dizi olmalı"];
    maddeListesi(list, "duyurular", p, ids);
    list.forEach(function (d, i) {
      if (!isObj(d)) return;
      if (!isGun(d.bitis)) p.push("duyurular[" + i + "]: bitis YYYY-AA-GG olmalı");
      var h = d.hedef;
      if (h != null && !isObj(h)) p.push("duyurular[" + i + "]: hedef nesne olmalı");
      else if (h) {
        arr(h.modeller).forEach(function (m) { if (!modelNorm(m)) p.push("duyurular[" + i + "]: tanınmayan model " + m); });
        arr(h.ulkeler).forEach(function (u) { if (!ulkeKodNorm(u)) p.push("duyurular[" + i + "]: tanınmayan ülke " + u); });
      }
    });
    return p;
  }

  return {
    MODELLER: MODELLER,
    MODEL_AD: MODEL_AD,
    LISE_SINIFLARI: LISE_SINIFLARI,
    ULKE_KODLARI: ULKE_KODLARI,
    ULKE_ADLARI: ULKE_ADLARI,
    DILLER: DILLER,
    DUZEYLER: DUZEYLER,
    PROGRAM_DURUM: PROGRAM_DURUM,
    UNI_DIL: UNI_DIL,
    ULKE_ROZETLER: ULKE_ROZETLER,
    duzeyOf: duzeyOf,
    yalnizIngilizce: yalnizIngilizce,
    secimCoz: secimCoz,
    secimAdres: secimAdres,
    modelAd: modelAd,
    dilAd: dilAd,
    programDurumu: programDurumu,
    programDurumuTuret: programDurumuTuret,
    ulkeBolumleri: ulkeBolumleri,
    universiteSuz: universiteSuz,
    ozetUyari: ozetUyari,
    duyuruSuz: duyuruSuz,
    baslangicYili: baslangicYili,
    genelYol: genelYol,
    ulkeVeriDogrula: ulkeVeriDogrula,
    dizinDogrula: dizinDogrula,
    ylGenelDogrula: ylGenelDogrula,
    duyuruDogrula: duyuruDogrula,
    MEZUN_ULKELER: MEZUN_ULKELER,
    mezunUlkeOku: mezunUlkeOku,
    mezunVeriDogrula: mezunVeriDogrula,
    aktifDuyurular: aktifDuyurular,
    mezunBolumler: mezunBolumler,
    SURUM: SURUM,
    ULKELER: ULKELER,
    ULKE_AD: ULKE_AD,
    SINIFLAR: SINIFLAR,
    KESINLIKLER: KESINLIKLER,
    BOLUMLER: BOLUMLER,
    AYLAR: AYLAR,
    secimOku: secimOku,
    secimUrl: secimUrl,
    sinifAd: sinifAd,
    maddeDogrula: maddeDogrula,
    veriDogrula: veriDogrula,
    bolumler: bolumler,
    goreliZaman: goreliZaman,
    buYilMi: buYilMi,
    mezuniyetYili: mezuniyetYili,
    mezunHedefYili: mezunHedefYili,
    yolHaritasi: yolHaritasi
  };
});
