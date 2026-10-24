/**
 * Meberra 1.22.0 — Hedef sihirbazı motoru (saf, UMD). Sayfa: sartlar.html (/ulkem) ve giris.html.
 * Tarayıcıda window.MeberraHedef; Node'da require("../assets/js/hedef-motor"). Birim testi: araclar/testler/hedef-birim-test.js
 * Tarayıcıda eposta.js (APMEBERRA_EPOSTA) ve ap-hedef.js (APMEBERRA_AP_HEDEF) bu dosyadan ÖNCE yüklenir.
 *
 *   secimCoz(search)  -> {ulkeler[], okullar{cc: [uniId]}, sinif "9".."12"|"mezun", alan}
 *                        yeni adres ?u=it,de&o=<uniId>,..&s=11&a=muhendislik; eski ?ulke=de&sinif=11&model=lise-mezun da okunur
 *   secimAdres(secim) -> "?u=..&o=..&s=..&a=.."
 *   sutunlar(secim, ulkeVeri) -> [{tur "uni"|"ulke", cc, uniId|null, ad, kisa, bayrak}]
 *   hucre(ulkeVeri, cc, uniId, alan, satir) -> {durum ok|uyari|kapali|teyit, metin, kaynak[], kesinlik, ...}
 *                        çözüm sırası: üniversite+alan → üniversite → ülke+alan → ülke varsayılanı → teyit
 *   ortakYol(sutunlar, ulkeVeri, alan, sinif, bugun) -> {apDersleri, apSayi, apOneri, dil, sinavlar, yksUyari, sinavYili, haftaKaldi}
 *   profilYamasi(eski, secim, ortak) -> profil (yeni nesne; dolu sınıf/rota/sınav yılı korunur, ülkeler en çok 5;
 *                        hedefAlan profilde görünen ad olarak yazılır: "Mühendislik") · alanKodu(ad) -> alan kodu
 */
(function (root, factory) {
  "use strict";
  var E = root && root.APMEBERRA_EPOSTA, A = root && root.APMEBERRA_AP_HEDEF;
  if (typeof module === "object" && module && module.exports) {
    E = require("./eposta.js"); A = require("./ap-hedef.js");
    module.exports = factory(E, A, root);
  } else root.MeberraHedef = factory(E, A, root);
})(typeof window !== "undefined" ? window : globalThis, function (E, A, root) {
  "use strict";

  var ALANLAR = ["muhendislik", "tip", "isletme", "fen"];
  var ALAN_AD = { muhendislik: "Mühendislik", tip: "Tıp/Sağlık", isletme: "İşletme/Ekonomi", fen: "Fen" };
  var SATIRLAR = ["diploma", "yks", "ap", "sinav", "dil", "donem"];
  var SATIR_AD = { diploma: "Lise diploması", yks: "YKS", ap: "AP", sinav: "Giriş sınavı", dil: "Dil belgesi", donem: "Başvuru dönemi" };
  var SINIFLAR = ["9", "10", "11", "12", "mezun"];
  var EN_FAZLA = 5;
  // Alanın önerilen AP seti (şart değil; arayüzde "öneri" olarak etiketlenir)
  var VARSAYILAN_AP = {
    muhendislik: ["calculus-ab", "physics-1", "chemistry"],
    tip: ["biology", "chemistry", "calculus-ab"],
    isletme: ["calculus-ab", "microeconomics", "macroeconomics"],
    fen: ["calculus-ab", "chemistry", "biology"]
  };
  var YEDEK_ULKELER = ["de", "it", "at", "ch", "nl", "be", "fr", "es", "se", "fi", "dk", "ie", "hu", "pl", "cz"];

  function ulkeKodlari() {
    var D = root && root.APMEBERRA_ULKE_DIZINI;
    return D && Array.isArray(D.ulkeler) && D.ulkeler.length ? D.ulkeler.map(function (u) { return u.kod; }) : YEDEK_ULKELER;
  }
  function liste(s) { return String(s || "").toLowerCase().split(",").map(function (x) { return x.trim(); }).filter(Boolean); }
  function tekil(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function param(search) {
    var o = {};
    String(search || "").replace(/^[?#]/, "").split("#")[0].split("&").forEach(function (p) {
      if (!p) return;
      var i = p.indexOf("="), k = i < 0 ? p : p.slice(0, i), v = i < 0 ? "" : p.slice(i + 1);
      try { k = decodeURIComponent(k); v = decodeURIComponent(v.replace(/\+/g, " ")); } catch (e) { return; }
      if (!(k in o)) o[k] = v;
    });
    return o;
  }

  function secimCoz(search) {
    var p = param(search), kodlar = ulkeKodlari();
    var ulkeler = tekil(liste(p.u != null ? p.u : p.ulke).filter(function (c) { return kodlar.indexOf(c) >= 0; })).slice(0, EN_FAZLA);
    var okullar = {};
    liste(p.o).forEach(function (id) {
      var cc = id.split("-")[0];
      if (ulkeler.indexOf(cc) < 0) return;
      okullar[cc] = okullar[cc] || [];
      if (okullar[cc].indexOf(id) < 0) okullar[cc].push(id);
    });
    var s = String(p.s != null ? p.s : (p.sinif || "")).toLowerCase();
    if (String(p.model || "").toLowerCase() === "lise-mezun") s = "mezun";
    var a = String(p.a || "").toLowerCase();
    return { ulkeler: ulkeler, okullar: okullar, sinif: SINIFLAR.indexOf(s) >= 0 ? s : "11", alan: ALANLAR.indexOf(a) >= 0 ? a : "muhendislik" };
  }

  function secimAdres(secim) {
    var s = secim || {}, q = [], okul = [];
    (s.ulkeler || []).forEach(function (cc) { okul = okul.concat((s.okullar && s.okullar[cc]) || []); });
    if (s.ulkeler && s.ulkeler.length) q.push("u=" + s.ulkeler.join(","));
    if (okul.length) q.push("o=" + okul.map(encodeURIComponent).join(","));
    if (s.sinif) q.push("s=" + s.sinif);
    if (s.alan) q.push("a=" + s.alan);
    return q.length ? "?" + q.join("&") : "";
  }

  function bayrak(cc) {
    return String(cc || "").toUpperCase().replace(/[A-Z]/g, function (c) { return String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65); });
  }
  function kisaAd(ad) {
    var m = /\(([^)]{2,10})\)/.exec(ad || "");
    if (m) return m[1];
    var b = String(ad || "").split(/\s+/).filter(function (w) { return /^[A-ZÀ-ÝÇĞİÖŞÜ]/.test(w) && !/^(Of|Di|De|Der|Du|Des|La|Le|Della|Degli|Und|And|The)$/i.test(w); });
    return b.map(function (w) { return w.charAt(0); }).join("").slice(0, 5) || String(ad || "").slice(0, 4);
  }
  function uniBul(ulkeVeri, cc, uniId) {
    var v = ulkeVeri && ulkeVeri[cc], L = v && v.universiteler && Array.isArray(v.universiteler.liste) ? v.universiteler.liste : [];
    for (var i = 0; i < L.length; i++) if (E.universiteKimligi(cc, L[i]) === uniId) return L[i];
    return null;
  }

  function sutunlar(secim, ulkeVeri) {
    var out = [];
    ((secim && secim.ulkeler) || []).forEach(function (cc) {
      var v = (ulkeVeri && ulkeVeri[cc]) || {}, eklendi = 0;
      (((secim.okullar || {})[cc]) || []).forEach(function (id) {
        var u = uniBul(ulkeVeri, cc, id);
        if (!u) return;
        var ad = String(u.qsAd || u.ad).replace(/\s*\([^)]*\)\s*$/, "");
        out.push({ tur: "uni", cc: cc, uniId: id, ad: ad, kisa: kisaAd(u.ad), bayrak: bayrak(cc) });
        eklendi++;
      });
      if (!eklendi) out.push({ tur: "ulke", cc: cc, uniId: null, ad: v.ad || cc.toUpperCase(), kisa: v.ad || cc.toUpperCase(), bayrak: bayrak(cc) });
    });
    return out;
  }

  function al(o, yol) { for (var i = 0; i < yol.length; i++) { if (!o || typeof o !== "object") return null; o = o[yol[i]]; } return o && typeof o === "object" ? o : null; }
  function hucre(ulkeVeri, cc, uniId, alan, satir) {
    var I = al(ulkeVeri, [cc, "isterler"]), U = uniId ? al(I, ["universite", uniId]) : null;
    var h = al(U, ["alanlar", alan, satir]) || al(U, [satir]) || al(I, ["alanlar", alan, satir]) || al(I, ["varsayilan", satir]);
    if (!h || !h.durum) return { durum: "teyit", metin: "Resmî sayfadan teyit et", kaynak: [], kesinlik: null };
    var c = {}; Object.keys(h).forEach(function (k) { c[k] = h[k]; });
    if (!Array.isArray(c.kaynak)) c.kaynak = [];
    if (typeof c.metin !== "string") c.metin = "";
    return c;
  }

  // Profil sihirbazıyla aynı kural (ap-hedef.js): 9 → +2, 10 → +1, 11/12/mezun → sıradaki Mayıs (Haziran'dan sonra ertesi yıl)
  function sinavYiliHesapla(sinif, bugun) {
    return A.varsayilanSinavYili(sinif === "mezun" ? "" : sinif, new Date(bugun + "T12:00:00Z"));
  }

  function ortakYol(sut, ulkeVeri, alan, sinif, bugun) {
    alan = ALANLAR.indexOf(alan) >= 0 ? alan : "muhendislik";
    var apSayi = 0, dersler = [], esik = null, belge = null, sinavlar = [], yks = false, yksTeyit = false;
    (sut || []).forEach(function (c) {
      var ap = hucre(ulkeVeri, c.cc, c.uniId, alan, "ap");
      if (ap.durum !== "teyit") {
        apSayi = Math.max(apSayi, +ap.sayi || 0);
        (ap.dersler || []).forEach(function (d) { if (dersler.indexOf(d) < 0) dersler.push(d); });
      }
      var dl = hucre(ulkeVeri, c.cc, c.uniId, alan, "dil");
      var e = Array.isArray(dl.esik) ? Math.max.apply(null, dl.esik) : +dl.esik;
      if (dl.durum !== "teyit" && e && (esik == null || e > esik)) { esik = e; belge = dl.belge || "IELTS"; }
      var sn = hucre(ulkeVeri, c.cc, c.uniId, alan, "sinav");
      (sn.sinavlar || []).forEach(function (s) { if (sinavlar.indexOf(s) < 0) sinavlar.push(s); });
      var yd = hucre(ulkeVeri, c.cc, c.uniId, alan, "yks").durum;
      if (yd === "uyari" || yd === "kapali") yks = true; else if (yd === "teyit") yksTeyit = true;
    });
    var apOneri = apSayi === 0 && dersler.length === 0;
    var ap = apOneri ? VARSAYILAN_AP[alan].slice() : dersler.slice();
    VARSAYILAN_AP[alan].forEach(function (d) { if (ap.length < apSayi && ap.indexOf(d) < 0) ap.push(d); });
    var yil = sinavYiliHesapla(sinif, bugun);
    var hafta = Math.max(1, Math.ceil((Date.UTC(yil, 4, 1) - new Date(bugun + "T00:00:00Z").getTime()) / 6048e5));
    return { apDersleri: ap, apSayi: apSayi, apOneri: apOneri, dil: esik == null ? null : { belge: belge, esik: esik },
      sinavlar: sinavlar, yksUyari: yks, yksTeyit: !yks && yksTeyit, sinavYili: yil, haftaKaldi: hafta };
  }

  /** Tablo hücresinin kısa etiketi (ikon hariç). sinavAd: sınav kimliği → kısa ad. */
  function hucreEtiket(satir, h, sinavAd) {
    var d = h.durum;
    if (d === "teyit") return "Teyit et";
    if (satir === "yks") return d === "ok" ? "Gerekmez" : d === "kapali" ? "Yol kapalı" : "Şart";
    if (satir === "ap") return h.sayi ? h.sayi + " AP" : d === "ok" ? "Şart değil" : d === "kapali" ? "Yol kapalı" : "Yetmez";
    if (satir === "sinav") return (h.sinavlar || []).length ? h.sinavlar.map(sinavAd || String).join(" · ") : d === "ok" ? "Yok" : d === "kapali" ? "Yol kapalı" : "Var";
    if (satir === "dil") {
      if (d === "kapali") return "İngilizce program yok";
      if (d === "ok") return "Gerekmez";
      var e = Array.isArray(h.esik) ? h.esik.join("–") : h.esik;
      return e ? (h.belge || "IELTS") + " " + e : "Belge gerekli";
    }
    if (satir === "donem") return d === "kapali" ? "Kapalı" : "Takvim";
    return d === "ok" ? "Yeter" : d === "kapali" ? "Kapalı" : "Ek şart";
  }
  /** Birleştirmede profilden düşen ülkeler (en çok 5 sınırı). */
  function cikanUlkeler(eski, yama) {
    var once = eski && Array.isArray(eski.ulkeler) ? eski.ulkeler : [];
    return once.filter(function (u) { return yama.ulkeler.indexOf(u) < 0; });
  }

  /** Profildeki görünen alan adı ("Tıp/Sağlık") → alan kodu; bilinmeyen ad mühendisliğe düşer. */
  function alanKodu(ad) {
    var a = String(ad || "").toLocaleLowerCase("tr-TR");
    for (var i = 0; i < ALANLAR.length; i++) if (ALANLAR[i] === a || ALAN_AD[ALANLAR[i]].toLocaleLowerCase("tr-TR") === a) return ALANLAR[i];
    return "muhendislik";
  }

  function profilYamasi(eski, secim, ortak) {
    var p = {}, e = eski || {};
    Object.keys(e).forEach(function (k) { p[k] = e[k]; });
    var bos = function (k) { return p[k] == null || p[k] === ""; };
    var mezun = secim.sinif === "mezun";
    if (bos("ogrenciModeli")) p.ogrenciModeli = mezun ? "lise-mezun" : "lise";
    if (bos("sinif")) p.sinif = mezun ? "" : secim.sinif;
    p.ulkeler = tekil((secim.ulkeler || []).concat(Array.isArray(e.ulkeler) ? e.ulkeler : [])).slice(0, EN_FAZLA);
    if (bos("aktifRota")) p.aktifRota = p.ulkeler[0] || null;
    if (bos("egitimDili")) p.egitimDili = "en";
    p.hedefAlan = ALAN_AD[secim.alan] || ALAN_AD.muhendislik; // çipte açıkça seçildi
    if (bos("sinavYili")) p.sinavYili = ortak.sinavYili;
    var okul = Array.isArray(e.hedefOkullar) ? e.hedefOkullar.slice() : [];
    (secim.ulkeler || []).forEach(function (cc) { ((secim.okullar || {})[cc] || []).forEach(function (id) { if (okul.indexOf(id) < 0) okul.push(id); }); });
    p.hedefOkullar = okul;
    var ders = Array.isArray(e.apDersleri) ? e.apDersleri.map(function (d) { return { ders: d.ders, hedef: d.hedef }; }) : [];
    (ortak.apDersleri || []).forEach(function (d) {
      if (!ders.some(function (x) { return x.ders === d; })) ders.push({ ders: d, hedef: A.VARSAYILAN_HEDEF || 4 });
    });
    p.apDersleri = ders;
    p.tamamlandi = true;
    return p;
  }

  return { ALANLAR: ALANLAR, ALAN_AD: ALAN_AD, SATIRLAR: SATIRLAR, SATIR_AD: SATIR_AD, SINIFLAR: SINIFLAR, EN_FAZLA: EN_FAZLA,
    VARSAYILAN_AP: VARSAYILAN_AP, secimCoz: secimCoz, secimAdres: secimAdres, sutunlar: sutunlar, hucre: hucre,
    ortakYol: ortakYol, profilYamasi: profilYamasi, alanKodu: alanKodu, hucreEtiket: hucreEtiket, cikanUlkeler: cikanUlkeler, bayrak: bayrak, sinavYiliHesapla: sinavYiliHesapla };
});
