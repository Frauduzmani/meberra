/**
 * Meberra ücretsiz ünite kuralı — istemci (tarayıcı, app.js'ten ÖNCE yüklenir) ve sunucu (server/sorubankasi.js require eder)
 * aynı dosyayı kullanır (UMD). Tarayıcıda işlevler window'a (global) yazılır; app.js / oyun.js / seviye.js bunları çağırır.
 *
 * Kural (açık ve belgeli; sıra numarasına göre DEĞİL):
 * Varsayılan: sayfadaki ilk N farklı ünite numarası açık (N = MEBERRA_URUN.ucretsiz.uniteSayisi, yoksa 2). Aynı numaralı
 * devam üniteleri ("Unit 2 (cont.): Circular Motion") o ünitenin parçasıdır → Physics'te Unit 1, Unit 2 ve Unit 2 (cont.) açık.
 * Numarasız ünite kendi sırasıyla sayılır. Sayfa istisnaları AP_UCRETSIZ_KURALI'nda:
 *   - ap-electives: tek sayfada birden çok ders var → her dersin (CS A, Ekonomi istasyonu, Micro, Macro) ilk ünitesi açık
 *   - ap-english: yalnızca 2 ünite (A, B) → ilki açık
 *   - sinav-cents: ilk 2 bölüm (Section 1–2) açık (ap- dışındaki tek ünite görünümlü sayfa)
 * Sayfa dışı kullanım (sunucu soru bankası erişimi, Bugün/Çalış görevleri, seviye testi önerileri) için ücretsiz soru kutuları
 * AP_UCRETSIZ_KUTULAR'da; araclar/testler/unite-birim-test.js bu listenin gerçek sayfalardaki kurala birebir uyduğunu denetler.
 * Sunucu (GET /api/sorular-bankasi/...) Premium olmayan kullanıcıya yalnızca apKutuUcretsizMi(sayfa, kutu) === true kutuları verir.
 */
(function (kok, fabrika) {
  "use strict";
  var api = fabrika();
  if (typeof module === "object" && module.exports) module.exports = api;
  else Object.keys(api).forEach(function (k) { kok[k] = api[k]; });
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";
  var AP_UCRETSIZ_KURALI = {
    "ap-electives": { dersBasina: true },
    "ap-english": { n: 1 },
    "sinav-cents": { n: 2 }
  };
  /** Ücretsiz ünitelerin `no` değerleri (apUniteGrupla çıktısının uniteler dizisi üzerinde; saf). */
  function apUcretsizUniteNolari(page, uniteler, n) {
    var k = AP_UCRETSIZ_KURALI[page] || {};
    var list = Array.isArray(uniteler) ? uniteler : [];
    if (k.dersBasina) {
      var gor = {};
      return list.filter(function (u) { var d = u.ders || ""; if (gor[d]) return false; gor[d] = 1; return true; }).map(function (u) { return u.no; });
    }
    var sinir = k.n || n || 2, nolar = [], out = [];
    list.forEach(function (u) {
      var a = u.num != null ? "n:" + u.num : "#" + u.no;
      if (nolar.indexOf(a) < 0) nolar.push(a);
      if (nolar.indexOf(a) < sinir) out.push(u.no);
    });
    return out;
  }
  /** Ücretsiz ünitelerdeki soru kutuları (sayfa → kutu kimlikleri). Listede olmayan sayfa = kural yok (hepsi açık). */
  var AP_UCRETSIZ_KUTULAR = {
    "ap-calculus": ["calc-unit1-quiz-container", "calc-unit2-quiz-container"],
    "ap-physics": ["phys-unit1-quiz-container", "phys-unit2-quiz-container", "phys-unit3-quiz-container"], // unit3 kutusu = Unit 2 (cont.)
    "ap-chemistry": ["chem-unit1-quiz-container", "chem-unit2-quiz-container"],
    "ap-biology": ["bio-unit1-quiz-container", "bio-unit2-quiz-container"],
    "ap-english": ["eng-reading-quiz-container"],
    "ap-electives": ["csa-quiz-container", "econ-quiz-container", "micro34-quiz-container", "micro56-quiz-container", "macro14-quiz-container", "macro56-quiz-container"],
    "sinav-cents": ["cents-reading-quiz-container", "cents-math-quiz-container"]
  };
  /** Bu soru kutusu ücretsiz planda açık mı? (saf; premium kontrolü çağırana aittir) */
  function apKutuUcretsizMi(page, kutuId) {
    var l = AP_UCRETSIZ_KUTULAR[String(page || "").replace(/\.html?$/i, "")];
    return !l || l.indexOf(kutuId) >= 0;
  }
  /**
   * Sayfa içi çapa (ör. seviye testi portalCapa: "phys-unit3-wep-lecture", "unit1-quiz-section", "bio-unit3-lecture-section")
   * ücretsiz bir üniteye mi düşer? Çapa kökü ("…-quiz-section", "…-lecture(-section)" ekleri atılır) ile kutu kökü eşleşir.
   * Saf. Kuralı olmayan sayfada (ya da çapa yoksa) true; kurallı sayfada ücretsiz kutuyla eşleşmeyen çapa kilitli (false).
   */
  function apCapaUcretsizMi(page, capa) {
    var l = AP_UCRETSIZ_KUTULAR[String(page || "").replace(/\.html?$/i, "")];
    if (!l || !capa) return true;
    var kok = String(capa).replace(/-(quiz-section|quiz-container|lecture-section|lecture|section)$/, "");
    var es = function (id) { return id === kok + "-quiz-container" || id.slice(-(kok.length + 16)) === "-" + kok + "-quiz-container"; };
    return l.some(es);
  }
  return {
    AP_UCRETSIZ_KURALI: AP_UCRETSIZ_KURALI,
    apUcretsizUniteNolari: apUcretsizUniteNolari,
    AP_UCRETSIZ_KUTULAR: AP_UCRETSIZ_KUTULAR,
    apKutuUcretsizMi: apKutuUcretsizMi,
    apCapaUcretsizMi: apCapaUcretsizMi
  };
});
