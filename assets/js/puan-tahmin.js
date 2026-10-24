/* ==========================================================================
   MEBERRA 1.27.0 — Tahmini AP puanı modeli (saf; tarayıcı + Node). Sunucu: server/ilerleme.js dersOzeti; istemci: Bugün.
   kompozit = (I × MCQ + II × FRQ) / (I + II)   — bölüm ağırlıkları server/tohum/sinav-formatlari.json
     MCQ = Σ CED ünite ağırlığı × ünite oranı   — ünite oranı şansa (%25) doğru büzülür: (doğru + 0,25·K) / (cevap + K), K = 5;
           hiç çalışılmamış ünite %25 sayılır (kapsam önemlidir). Ünite ağırlığı yoksa (English) genel doğruluk.
     FRQ = son FRQ öz puanlarının ortalaması; yoksa MCQ × 0,8 ("tahmin").
   Bant: dersin 1–5 eşikleri (resmî ölçek yayımlanmaz; yaklaşık). Son 30 günde deneme varsa ince puan modelle yarı yarıya harmanlanır.
   Kaldıraç: hangi ünite %85'e çıkarsa kompozit en çok artar (öneri: "Unit 6'yı çalış → 4").
   Testler: araclar/testler/puan-tahmin-birim-test.js
   ========================================================================== */
(function (kok, kur) {
  "use strict";
  var api = kur();
  if (typeof module === "object" && module.exports) module.exports = api;
  else kok.MeberraPuanTahmin = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var K = 5, SANS = 25, HEDEF_ORAN = 85, DENEME_GUN = 30;
  var SINAV_ILK_GUN = "2027-05-03"; // Mayıs 2027 AP sınavları (assets/js/ap-nedir.js SINAV ile aynı)

  function yuvarla(x) { return Math.round(x * 10) / 10; }
  function uniteOrani(u) {
    var c = Math.max(0, +(u && u.cevap) || 0), d = Math.max(0, Math.min(c, +(u && u.dogru) || 0));
    return (d + SANS / 100 * K) / (c + K) * 100;
  }
  function sirali(esikler) { return (esikler || []).slice().sort(function (a, b) { return b.min - a.min; }); }
  function bant(esikler, k) {
    var e = sirali(esikler);
    for (var i = 0; i < e.length; i++) if (k >= e[i].min) return e[i].puan;
    return 1;
  }
  /** 1,0–5,0: eşikler arasında doğrusal (0 → 1, ilk eşik → 2 …, son eşik ve üstü → 5) */
  function ince(esikler, k) {
    var e = sirali(esikler).reverse(), alt = 0, altP = 1;
    for (var i = 0; i < e.length; i++) {
      if (k < e[i].min) return yuvarla(altP + (k - alt) / (e[i].min - alt) * (e[i].puan - altP));
      alt = e[i].min; altP = e[i].puan;
    }
    return 5;
  }
  function mcqHesap(plan, uniteler, genel) {
    var A = plan.uniteAgirlik;
    if (!A) return uniteOrani(genel || {});
    var top = 0, s = 0;
    Object.keys(A).forEach(function (k) { top += A[k]; s += A[k] * uniteOrani((uniteler || {})[k] || {}); });
    return top ? s / top : uniteOrani(genel || {});
  }
  function kompozitHesap(plan, mcq, frq) {
    var I = (plan.agirlik && plan.agirlik.I) || 50, II = (plan.agirlik && plan.agirlik.II) || 50;
    return (I * mcq + II * frq) / (I + II);
  }

  /**
   * plan: { agirlik: {I, II}, uniteAgirlik: {anahtar: ağırlık} | null, esikler: [{puan, min}] }
   * girdi: { uniteler: {anahtar: {cevap, dogru}}, genel: {cevap, dogru}, frq: [yüzde…], deneme: {puan, gunOnce} }
   */
  function tahmin(plan, girdi) {
    girdi = girdi || {};
    var uniteler = girdi.uniteler || {}, frqL = (girdi.frq || []).filter(function (x) { return isFinite(+x); });
    var n = 0;
    Object.keys(uniteler).forEach(function (k) { n += +uniteler[k].cevap || 0; });
    if (!plan.uniteAgirlik && girdi.genel) n = +girdi.genel.cevap || 0;
    var mcq = mcqHesap(plan, uniteler, girdi.genel);
    var frqOz = frqL.length ? frqL.reduce(function (a, b) { return a + +b; }, 0) / frqL.length : null;
    var frq = frqOz !== null ? frqOz : mcq * 0.8;
    var kompozit = kompozitHesap(plan, mcq, frq);
    var modelInce = ince(plan.esikler, kompozit), son = modelInce, kaynak = "model";
    var d = girdi.deneme;
    if (d && d.puan >= 1 && d.puan <= 5 && d.gunOnce != null && d.gunOnce <= DENEME_GUN) { son = yuvarla((modelInce + +d.puan) / 2); kaynak = "model+deneme"; }
    var puan = Math.max(1, Math.min(5, Math.floor(son + 1e-9)));
    var guven = n < 30 ? "dusuk" : n < 150 ? "orta" : "yuksek";
    if (frqOz === null && guven === "yuksek") guven = "orta";
    var sonraki = null;
    if (puan < 5) {
      var e = sirali(plan.esikler).filter(function (x) { return x.puan === puan + 1; })[0];
      if (e) sonraki = { puan: puan + 1, gereken: e.min };
    }
    var kaldirac = null;
    if (plan.uniteAgirlik) {
      Object.keys(plan.uniteAgirlik).forEach(function (k) {
        if (uniteOrani(uniteler[k] || {}) >= HEDEF_ORAN) return;
        var u2 = Object.assign({}, uniteler); u2[k] = { cevap: 1e6, dogru: HEDEF_ORAN / 100 * 1e6 };
        var m2 = mcqHesap(plan, u2, girdi.genel), k2 = kompozitHesap(plan, m2, frqOz !== null ? frqOz : m2 * 0.8);
        if (!kaldirac || k2 > kaldirac.kompozitYeni) kaldirac = { unite: String(k), kompozitYeni: yuvarla(k2), puanYeni: bant(plan.esikler, k2) };
      });
    }
    var oranlar = {};
    if (plan.uniteAgirlik) Object.keys(plan.uniteAgirlik).forEach(function (k) { oranlar[k] = Math.round(uniteOrani(uniteler[k] || {})); });
    return { puan: puan, ince: son, modelInce: modelInce, kompozit: yuvarla(kompozit), mcq: yuvarla(mcq), frq: yuvarla(frq),
      frqKaynak: frqOz !== null ? "oz" : "tahmin", kaynak: kaynak, guven: guven, cevap: n, sonraki: sonraki, kaldirac: kaldirac, oranlar: oranlar };
  }
  /** "YYYY-AA-GG" → Mayıs 2027 sınavına kalan tam hafta (geçmişse 0) */
  function haftaKaldi(bugun) {
    var a = String(bugun).split("-").map(Number), b = SINAV_ILK_GUN.split("-").map(Number);
    var g = Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 864e5);
    return g > 0 ? Math.floor(g / 7) : 0;
  }
  return { uniteOrani: uniteOrani, bant: bant, ince: ince, tahmin: tahmin, haftaKaldi: haftaKaldi, SINAV_ILK_GUN: SINAV_ILK_GUN, HEDEF_ORAN: HEDEF_ORAN };
});
