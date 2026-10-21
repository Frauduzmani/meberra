/**
 * Meberra 1.18.0 — Kişisel uyarlanır çalışma planı motoru (saf, UMD: sunucu server/plan.js + tarayıcı assets/js/plan.js).
 * Tarayıcıda window.MeberraPlanMotor; Node'da require("../assets/js/plan-motor").
 * Birim testi: araclar/testler/plan-birim-test.js
 *
 * Girdi (planla):
 *   bugun   "YYYY-MM-DD" (Europe/Istanbul günü; çağıran hesaplar)
 *   saat    haftalık çalışma saati (3 | 5 | 8 | 12; varsayılan 5) → haftalık görev sayısı (2 | 3 | 4 | 5)
 *   dersler [{ ders, ad, hedef, sinav: { gun|null, yil, kesin }, denemeKodu, denemeLink, tamLink|null, frqLink|null,
 *             uniteler: [{ id, no, ad, agirlik, kapsam 0–100, dogruluk 0–100|null, cevap, soru, kilitli, link }] }]
 *   buHafta bu haftaya önceden yazılmış görevler (dondurulmuş hafta ya da devreden + korunan); yenile: true ise eksik
 *           görev sayısı tamamlanır, false ise olduğu gibi kullanılır
 *   devreden geçmiş haftalardan biten olmayan görevler (yalnızca yenile: true iken bu haftaya alınır; fazlası sonraki haftaya)
 *   kilometre [{ gun, ad, tur }] (kayıt son günü vb.; YALNIZCA veriden gelir)
 * Kurallar:
 *   - Her hafta 2–5 görev; dersler hafta hafta dönüşümlü (interleave) sıralanır.
 *   - Ünite seçimi: CED ağırlığı × kalan iş (kapsam eksiği + zayıflık); seçilen ünitenin ilerlemesi sonraki haftalar için
 *     benzetilir (aynı ünite üst üste gelmez, ağır üniteler daha sık gelir).
 *   - Sınava kalan hafta (sınav haftası = 1): 6 ve 4 → o derste tam sınav; 2 ve 1 → yalnızca tekrar.
 *   - Kesin tarih yoksa (ör. 2028) ufuk Mayıs'ın ilk günüdür ve etiket "Mayıs <yıl>" kalır: gün uydurulmaz.
 */
(function (kok, fabrika) {
  "use strict";
  var api = fabrika();
  if (typeof module === "object" && module.exports) module.exports = api;
  else kok.MeberraPlanMotor = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var SAATLER = [3, 5, 8, 12];
  var VARSAYILAN_SAAT = 5;
  var GOREV_SAYISI = { 3: 2, 5: 3, 8: 4, 12: 5 };
  var EN_COK_GOREV = 5, EN_AZ_GOREV = 2;
  var TEKRAR_HAFTA = 2;            // son 2 hafta: yalnızca tekrar
  var TAM_HAFTALAR = [6, 4];       // son 6 hafta içinde 2 haftada bir tam sınav
  var HEDEF_SORU = { unite: 10, tekrar: 8 };
  var DK = { unite: 45, tekrar: 35, deneme: 50, frq: 40, tam: 180 };
  var ZAYIF_ESIK = 60, ZAYIF_EN_AZ_CEVAP = 3;
  var TUR_AD = { unite: "Ünite çalış", tekrar: "Tekrar", deneme: "Ders denemesi", frq: "FRQ pratiği", tam: "Tam sınav" };

  // ---- tarih yardımcıları ("YYYY-MM-DD", UTC aritmetiği; saat dilimi çağıranın işidir) -----------------------------
  var GUN = 864e5;
  function gecerliGun(g) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(g || ""))) return false;
    var p = g.split("-"); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toISOString().slice(0, 10) === g;
  }
  function gunMs(g) { var p = String(g).split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function msGun(ms) { return new Date(ms).toISOString().slice(0, 10); }
  function gunEkle(g, n) { return msGun(gunMs(g) + n * GUN); }
  function gunFark(a, b) { return Math.round((gunMs(b) - gunMs(a)) / GUN); } // b − a
  function pazartesi(g) { var d = new Date(gunMs(g)).getUTCDay(); return gunEkle(g, -((d + 6) % 7)); }

  function saatNormal(s) { s = +s; return SAATLER.indexOf(s) >= 0 ? s : VARSAYILAN_SAAT; }
  function gorevSayisi(saat) { return GOREV_SAYISI[saatNormal(saat)]; }

  /** Dersin plan ufku: kesin sınav günü; yoksa sınav yılının 1 Mayıs'ı (etiket yine "Mayıs <yıl>") */
  function ufukGunu(d) {
    var s = d && d.sinav || {};
    if (s.kesin && gecerliGun(s.gun)) return s.gun;
    return /^\d{4}$/.test(String(s.yil || "")) ? s.yil + "-05-01" : null;
  }
  /** Haftanın (pazartesi) sınava kalan hafta sayısı: sınav haftası = 1, sınav geçtiyse 0 */
  function kalanHafta(haftaBas, ufuk) {
    if (!ufuk) return 0;
    var f = gunFark(haftaBas, ufuk);
    return f < 0 ? 0 : Math.floor(f / 7) + 1;
  }

  // ---- ünite önceliği ------------------------------------------------------------------------------------------
  function zayiflik(u) {
    return u.dogruluk != null && u.cevap >= ZAYIF_EN_AZ_CEVAP && u.dogruluk < 75 ? Math.max(0, (75 - u.dogruluk) / 100) : 0;
  }
  function zayifMi(u) { return u.dogruluk != null && u.cevap >= ZAYIF_EN_AZ_CEVAP && u.dogruluk < ZAYIF_ESIK; }
  /** Yeni ünite çalışması önceliği: CED ağırlığı × kalan kapsam (hafif sıra tercihi: önce baştaki üniteler) */
  function uniteSkoru(u, i) { return (u.agirlik || 1) * ((100 - Math.min(100, u.kapsam || 0)) / 100 + zayiflik(u)) / (1 + 0.06 * i) / (1 + 0.5 * (u._son || 0)); }
  function tekrarSkoru(u) { return (u.agirlik || 1) * (0.25 + zayiflik(u) * 3 + (u.kapsam > 0 ? 0.2 : 0)) / (1 + (u._tekrar || 0)); }
  function enIyi(l, f) { var b = null, bs = -1; l.forEach(function (u, i) { var s = f(u, i); if (s > bs + 1e-9) { bs = s; b = u; } }); return b; }

  /** Görevin benzetimli etkisi (sonraki haftaların seçimi için; girdiyi değiştirmez — ders.uniteler kopyadır) */
  function etkiUygula(d, g) {
    if (!g || !g.unite) return;
    var u = d.uniteler.filter(function (x) { return x.id === g.unite.id; })[0];
    if (!u) return;
    if (g.tur === "unite") { u.kapsam = Math.min(100, (u.kapsam || 0) + (u.soru > 0 ? Math.max(20, HEDEF_SORU.unite / u.soru * 100) : 50)); u._son = (u._son || 0) + 1; }
    if (g.tur === "tekrar") { u._tekrar = (u._tekrar || 0) + 1; if (u.dogruluk != null) u.dogruluk = Math.min(100, u.dogruluk + 8); }
  }

  function gorevYap(tur, d, u, haftaBas) {
    var un = u ? { id: u.id, no: u.no, ad: u.ad } : null;
    var link = tur === "deneme" ? d.denemeLink : tur === "tam" ? (d.tamLink || "/deneme?tam=1") : tur === "frq" ? (d.frqLink || "/frq") : (u && u.link) || d.link || null;
    var baslik = tur === "unite" ? u.ad : tur === "tekrar" ? (u ? u.ad : d.ad + " genel tekrar") : tur === "deneme" ? d.ad + " denemesi"
      : tur === "tam" ? d.ad + " tam sınavı" : d.ad + " FRQ";
    var aciklama = tur === "unite" ? "Konu anlatımı + en az " + HEDEF_SORU.unite + " soru"
      : tur === "tekrar" ? (u && zayifMi(u) ? "Zayıf ünite: " + HEDEF_SORU.tekrar + " soru tekrar et (doğruluk %" + u.dogruluk + ")" : HEDEF_SORU.tekrar + " soru tekrar")
      : tur === "deneme" ? "Bir ders denemesi çöz" : tur === "tam" ? "Süreli tam sınav (Bluebook benzeri)" : "Bir serbest yanıt sorusu çöz ve puanla";
    return {
      id: haftaBas + ":" + tur + ":" + d.ders + (un ? ":" + un.id : ""),
      hafta: haftaBas, ilkHafta: haftaBas, tur: tur, turAd: TUR_AD[tur], ders: d.ders, dersAd: d.ad, unite: un,
      baslik: baslik, aciklama: aciklama, link: link, dk: DK[tur],
      hedefSoru: tur === "unite" ? HEDEF_SORU.unite : tur === "tekrar" ? HEDEF_SORU.tekrar : null,
      denemeKodu: d.denemeKodu || null, kilitli: !!(u && u.kilitli), tamam: false, devir: false
    };
  }

  /** Bir ders için bu haftanın bir görevi (sayac: dersin plandaki görev sırası) */
  function dersGorevi(d, kalan, sayac, haftaBas, buHaftaTurler) {
    var uniteler = d.uniteler;
    if (kalan <= TEKRAR_HAFTA) return gorevYap("tekrar", d, uniteler.length ? enIyi(uniteler, tekrarSkoru) : null, haftaBas);
    if (TAM_HAFTALAR.indexOf(kalan) >= 0 && d.tamLink && buHaftaTurler.indexOf("tam") < 0) return gorevYap("tam", d, null, haftaBas);
    var yeniKalan = uniteler.filter(function (u) { return (u.kapsam || 0) < 100; });
    var zayif = uniteler.filter(zayifMi);
    var r = sayac % 8; // 8 görevde bir ders denemesi, bir FRQ (ilk 8 görevden sonra)
    if (r === 7 && d.denemeLink && buHaftaTurler.indexOf("deneme") < 0) return gorevYap("deneme", d, null, haftaBas);
    if (r === 3 && sayac >= 8 && d.frqLink && buHaftaTurler.indexOf("frq") < 0) return gorevYap("frq", d, null, haftaBas);
    if (((r === 1 || r === 5) && zayif.length) || !yeniKalan.length) return gorevYap("tekrar", d, uniteler.length ? enIyi(zayif.length ? zayif : uniteler, tekrarSkoru) : null, haftaBas);
    return gorevYap("unite", d, enIyi(yeniKalan, uniteSkoru), haftaBas);
  }

  function kopyaDers(d) {
    return Object.assign({}, d, { uniteler: (d.uniteler || []).map(function (u) { return Object.assign({}, u); }) });
  }

  /**
   * Planı üretir. Dönüş: { bugun, saat, gorevSayisi, haftalar: [{ bas, bit, no, evre, gorevler, kilometre }], sinavlar, ufuk, bos? }
   * evre: "calisma" | "deneme" (tam sınavlı son 6 hafta) | "tekrar" (son 2 hafta)
   */
  function planla(g) {
    g = g || {};
    var bugun = gecerliGun(g.bugun) ? g.bugun : msGun(Date.now());
    var saat = saatNormal(g.saat), n = gorevSayisi(saat);
    var dersler = (g.dersler || []).map(kopyaDers).filter(function (d) { return ufukGunu(d); });
    var sinavlar = dersler.map(function (d) {
      var s = d.sinav || {}, kesin = !!(s.kesin && gecerliGun(s.gun));
      return { ders: d.ders, ad: d.ad, gun: kesin ? s.gun : null, yil: s.yil, kesin: kesin, etiket: kesin ? s.gun : "Mayıs " + s.yil,
        kalanGun: kesin ? gunFark(bugun, s.gun) : null };
    }).sort(function (a, b) { return String(a.gun || a.yil + "-05-99").localeCompare(String(b.gun || b.yil + "-05-99")); });
    var aktifDers = dersler.filter(function (d) { return gunFark(bugun, ufukGunu(d)) >= 0; });
    var sonUfuk = aktifDers.map(ufukGunu).sort().pop();
    var bas0 = pazartesi(bugun);
    var cikti = { bugun: bugun, saat: saat, gorevSayisi: n, buHaftaBas: bas0, haftalar: [], sinavlar: sinavlar, ufuk: sonUfuk || null };
    if (!aktifDers.length) { cikti.bos = dersler.length ? "sinav-gecti" : "ders-yok"; return cikti; }

    var haftaSay = Math.floor(gunFark(bas0, sonUfuk) / 7) + 1;
    var sayac = {}; aktifDers.forEach(function (d) { sayac[d.ders] = 0; });
    var dersAl = function (k) { return aktifDers.filter(function (d) { return d.ders === k; })[0] || null; };
    var devreden = (g.devreden || []).slice();
    var kilometre = (g.kilometre || []).filter(function (k) { return k && gecerliGun(k.gun) && k.gun >= bas0; });
    // sınav günleri de kilometre taşı (yalnızca kesin olanlar)
    sinavlar.forEach(function (s) { if (s.kesin && s.gun >= bas0) kilometre.push({ gun: s.gun, ad: s.ad + " sınavı", tur: "sinav", ders: s.ders }); });

    for (var h = 0; h < haftaSay; h++) {
      var bas = gunEkle(bas0, h * 7), bit = gunEkle(bas, 6);
      var kalanlar = {}, minKalan = 1e9;
      aktifDers.forEach(function (d) { var k = kalanHafta(bas, ufukGunu(d)); kalanlar[d.ders] = k; if (k > 0 && k < minKalan) minKalan = k; });
      var buHaftaki = aktifDers.filter(function (d) { return kalanlar[d.ders] > 0; });
      var gorevler = [];
      if (h === 0 && Array.isArray(g.buHafta) && g.buHafta.length && !g.yenile) {
        gorevler = g.buHafta.slice(0, Math.max(EN_COK_GOREV, g.buHafta.length));
      } else {
        if (h === 0 && Array.isArray(g.buHafta)) gorevler = g.buHafta.slice();
        // devreden görevler (en eskiden) haftanın başına; haftada en çok 5 görev
        while (devreden.length && gorevler.length < EN_COK_GOREV) {
          var dv = Object.assign({}, devreden.shift(), { hafta: bas, devir: true });
          if (!gorevler.some(function (x) { return x.id === dv.id; })) gorevler.push(dv);
        }
        var hedefSayi = Math.max(n, Math.min(EN_COK_GOREV, gorevler.length));
        var m = buHaftaki.length, yeniSayisi = 0;
        while (gorevler.length < hedefSayi && m) {
          var d = buHaftaki[(h + yeniSayisi) % m];
          var turler = gorevler.filter(function (x) { return x.ders === d.ders; }).map(function (x) { return x.tur; });
          var gv = dersGorevi(d, kalanlar[d.ders], sayac[d.ders], bas, turler);
          var ayni = gorevler.filter(function (x) { return x.id === gv.id || (x.id.indexOf(gv.id + "#") === 0); }).length;
          if (ayni) gv.id += "#" + (ayni + 1);
          gorevler.push(gv); sayac[d.ders]++; yeniSayisi++;
          etkiUygula(d, gv); // tam sınav haftasında aynı derse ikinci görev tam sınav olmaz (dersGorevi turler ile denetler)
        }
        if (gorevler.length < EN_AZ_GOREV && m) {
          // tek ders + kısa hafta: en az 2 görev
          var d1 = buHaftaki[0], g2 = dersGorevi(d1, kalanlar[d1.ders], sayac[d1.ders]++, bas, gorevler.map(function (x) { return x.tur; }));
          if (gorevler.some(function (x) { return x.id === g2.id; })) g2.id += "#2";
          gorevler.push(g2); etkiUygula(d1, g2);
        }
      }
      if (h === 0) gorevler.forEach(function (x) { if (!x.tamam) { var dd = dersAl(x.ders); if (dd) etkiUygula(dd, x); } });
      var evre = minKalan <= TEKRAR_HAFTA ? "tekrar" : minKalan <= 6 ? "deneme" : "calisma";
      cikti.haftalar.push({
        no: h + 1, bas: bas, bit: bit, evre: evre, kalanHafta: minKalan === 1e9 ? 0 : minKalan,
        gorevler: gorevler,
        kilometre: kilometre.filter(function (k) { return k.gun >= bas && k.gun <= bit; }).sort(function (a, b) { return a.gun.localeCompare(b.gun); })
      });
    }
    return cikti;
  }

  /**
   * Görev etkinlikle tamamlandı mı? (saf) olay: { cevaplar: [{ unite, ders, gun }], denemeler: [{ kod, tam, gun }], frq: [{ ders, gun }] }
   * Pencere: görevin ilk haftasının pazartesisinden itibaren (devreden görev eski haftadaki çalışmayı da sayar).
   */
  function tamamMi(g, olay) {
    if (!g) return false;
    olay = olay || {};
    var bas = g.ilkHafta || g.hafta || "0000-00-00";
    var icinde = function (x) { return x && x.gun >= bas; };
    if (g.tur === "unite" || g.tur === "tekrar") {
      var c = (olay.cevaplar || []).filter(function (a) { return icinde(a) && (g.unite ? a.unite === g.unite.id : a.ders === g.ders); }).length;
      return c >= (g.hedefSoru || 1);
    }
    if (g.tur === "deneme") return (olay.denemeler || []).some(function (e) { return icinde(e) && !e.tam && e.kod === g.denemeKodu; });
    if (g.tur === "tam") return (olay.denemeler || []).some(function (e) { return icinde(e) && e.tam && e.kod === g.denemeKodu; });
    if (g.tur === "frq") return (olay.frq || []).some(function (f) { return icinde(f) && f.ders === g.ders; });
    return false;
  }

  /**
   * Plana göre durum (saf). beklenen: bugüne kadar bitmesi gereken görev sayısı (geçmiş haftalar tam + bu hafta orantılı:
   * haftaGunu = bu haftada (ya da plan bu hafta başladıysa başladığı günden beri) geçen tam gün, haftaUzunluk = o andan hafta sonuna gün),
   * yapilan: bitirilen. Dönüş: { durum: "onde"|"yolunda"|"geride", gun, metin }
   */
  function durum(o) {
    o = o || {};
    var n = Math.max(1, +o.gorevSayisi || 3);
    var oran = Math.min(1, Math.max(0, (+o.haftaGunu || 0) / (+o.haftaUzunluk || 7))); // bugün henüz sayılmaz
    var beklenen = (+o.gecmisPlanlanan || 0) + (+o.buHaftaToplam || 0) * oran;
    var yapilan = (+o.gecmisTamam || 0) + (+o.buHaftaTamam || 0);
    var gun = Math.round((yapilan - beklenen) / (n / 7));
    if (gun >= 2) return { durum: "onde", gun: gun, metin: "Plana göre önde · " + gun + " gün" };
    if (gun <= -2) return { durum: "geride", gun: -gun, metin: "Plana göre geride · " + (-gun) + " gün" };
    return { durum: "yolunda", gun: 0, metin: "Plana göre yolunda" };
  }

  var AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  /** "2027-05-10" → "10 Mayıs 2027" (yil: false → "10 Mayıs") */
  function trTarih(g, yil) {
    if (!gecerliGun(g)) return "";
    var p = g.split("-");
    return +p[2] + " " + AYLAR[+p[1] - 1] + (yil === false ? "" : " " + p[0]);
  }

  return {
    SAATLER: SAATLER, VARSAYILAN_SAAT: VARSAYILAN_SAAT, GOREV_SAYISI: GOREV_SAYISI, HEDEF_SORU: HEDEF_SORU, TUR_AD: TUR_AD,
    TEKRAR_HAFTA: TEKRAR_HAFTA, TAM_HAFTALAR: TAM_HAFTALAR, EN_COK_GOREV: EN_COK_GOREV,
    gecerliGun: gecerliGun, gunEkle: gunEkle, gunFark: gunFark, pazartesi: pazartesi, saatNormal: saatNormal, gorevSayisi: gorevSayisi,
    ufukGunu: ufukGunu, kalanHafta: kalanHafta, zayifMi: zayifMi, planla: planla, tamamMi: tamamMi, durum: durum, trTarih: trTarih
  };
});
