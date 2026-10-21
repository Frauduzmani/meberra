/**
 * Meberra — Deneme Sınavı motoru (Tur 5 · Ajan 12 İçerik & Deneme Sorumlusu + Ajan 3 Canan Yılmaz)
 *
 * Veri: window.APMEBERRA_DENEME_BANKASI (data/sorular/deneme-bankasi.js, `node araclar/deneme-bankasi-olustur.js` üretir).
 * Depolama: localStorage "apmeberra:deneme:v1" (apmeberra: önekli → sunucu senkronu otomatik kapsar)
 *   {
 *     v: 1,
 *     aktif: null | {
 *       id, kod, ad, dersler:[kod], seed, sorular:[{k:"sayfa|id", kod}], cevaplar:{<index>:"A"},
 *       isaretli:{<index>:true}, mevcut, sureModu:"tempo"|"suresiz", sureLimitSn|null, gecenSn,
 *       baslangic, uniteFiltre:[unite]|null
 *     },
 *     gecmis: [ { id, kod, ad, tarih, soruSayisi, dogru, yanlis, bos, yuzde, sureSn, tahminiBand,
 *                 uniteler: { "<kod>|<unite>": {kod, unite, ad, soru, dogru, yanlis, bos} }, seed,
 *                 sureModu, dersler, inceleme:[{k, kod, s}] } ]   // en yeni başta, en fazla 50 kayıt
 *   }
 * Tur 14 A7 (Ajan 11, arayüz/akış katmanı): Yanlışlarım modu — deneme.html?mod=yanlislar[&ders=<kod>][&deneme=<sonuç id>].
 *   Soru havuzu = Yanlışlarım’daki AÇIK kayıtlar (apmeberra:errors:v1, resolved:false) ∩ deneme bankası; yeni depolama anahtarı yok.
 *   aktif/gecmis kaydına kod:"yanlislar", mod:"yanlislar", kaynakDeneme:<id>|null eklenir (ek alanlar; mevcut alanlar aynı),
 *   her sorunun kendi ders kodu sorular[i].kod'da durur. Teslimde mevcut writeErrors: doğru → hata kapanır (resolved),
 *   yanlış → açık kalır (count+1), boş → değişmez. Soru nesnesi ve banka değişmez.
 * Ücretsiz deneme hakkı (Meberra): "apmeberra:deneme-hak:v1" = { "<sayfa>": { t: <ms>, kod: "<banka kodu>" } } — ders SAYFASI
 *   başına bir ücretsiz deneme (calculus-ab/bc → ap-calculus, cs-a/economics → ap-electives). Kullanım deneme BAŞLARKEN yazılır
 *   ve hiç silinmez (iptal, 50 kayıtlık geçmiş sınırı hakkı geri getirmez; sunucu anahtarı yalnız ekleyerek birleştirir).
 *   Geriye uyum: o sayfaya ait tamamlanmış bir geçmiş kaydı da hakkı kullanılmış sayar. Başlamış deneme her zaman sürdürülebilir.
 * Sınav sırasında doğru/yanlış gösterilmez. Süre yalnızca sayfa açıkken işler (gecenSn birikir);
 * yenilemede deneme kaldığı yerden sürer. Yanlışlar app.js Yanlışlarım’a ("apmeberra:errors:v1") aynı
 * biçimde yazılır.
 */
(function () {
  "use strict";

  var KEY = "apmeberra:deneme:v1";
  var HAK_KEY = "apmeberra:deneme-hak:v1";
  var ERR_KEY = "apmeberra:errors:v1";
  var MAX_GECMIS = 50;
  var BANK = window.APMEBERRA_DENEME_BANKASI;

  // --------------------------------------------------------------------------
  // Sınav temposu: AP Section I (MCQ) soru başına süre = bölüm süresi / soru sayısı.
  // Kaynak: College Board AP Central ders "Exam" sayfaları (erişim 12 Ekim 2026):
  //  - Calculus AB/BC: 42 soru / 100 dk (Part A 29 soru 62 dk, Part B 13 soru 38 dk; Mayıs 2027 düzeni)
  //      https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam
  //      https://apcentral.collegeboard.org/courses/ap-calculus-bc/exam (AB ile aynı yapı varsayıldı; ayrıca açılmadı)
  //  - Physics 1: 42 soru / 85 dk      https://apcentral.collegeboard.org/courses/ap-physics-1/exam
  //  - Chemistry: 60 soru / 90 dk      https://apcentral.collegeboard.org/courses/ap-chemistry/exam
  //  - Biology:   60 soru / 90 dk      https://apcentral.collegeboard.org/courses/ap-biology/exam
  //  - English Language: 45 soru / 60 dk https://apcentral.collegeboard.org/courses/ap-english-language-and-composition/exam
  //  - Computer Science A: 42 soru / 90 dk https://apcentral.collegeboard.org/courses/ap-computer-science-a/exam
  //  - Micro- ve Macroeconomics: 60 soru / 70 dk
  //      https://apcentral.collegeboard.org/courses/ap-microeconomics/exam
  //      https://apcentral.collegeboard.org/courses/ap-macroeconomics/exam
  //  - CEnT-S: doğrulanmadı → "yaklaşık" etiketli varsayılan.
  // --------------------------------------------------------------------------
  var TEMPO = {
    "calculus-ab": { soru: 42, dk: 100, url: "https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam" },
    "calculus-bc": { soru: 42, dk: 100, url: "https://apcentral.collegeboard.org/courses/ap-calculus-bc/exam", not: "AB ile aynı Section I yapısı varsayıldı" },
    "physics-1": { soru: 42, dk: 85, url: "https://apcentral.collegeboard.org/courses/ap-physics-1/exam" },
    "chemistry": { soru: 60, dk: 90, url: "https://apcentral.collegeboard.org/courses/ap-chemistry/exam" },
    "biology": { soru: 60, dk: 90, url: "https://apcentral.collegeboard.org/courses/ap-biology/exam" },
    "english-language": { soru: 45, dk: 60, url: "https://apcentral.collegeboard.org/courses/ap-english-language-and-composition/exam" },
    "cs-a": { soru: 42, dk: 90, url: "https://apcentral.collegeboard.org/courses/ap-computer-science-a/exam" },
    "economics": { soru: 60, dk: 70, url: "https://apcentral.collegeboard.org/courses/ap-microeconomics/exam" },
    "cents": { soru: 1, dk: 1.5, url: null, yaklasik: true, not: "CEnT-S temposu doğrulanamadı; soru başına 90 sn yaklaşık" }
  };
  function tempoSn(kod) { var t = TEMPO[kod]; return t ? (t.dk * 60) / t.soru : 90; }

  // --------------------------------------------------------------------------
  // Tahmini AP bandı — YAKLAŞIK. College Board ham puan → 1–5 dönüşümünü yayımlamaz; ölçek
  // her yıl ve derse göre değişir ve FRQ bölümünü içerir. Aşağıdaki eşikler yalnızca MCQ doğru
  // yüzdesine dayalı kaba bir yol göstericidir; resmi ölçekleme DEĞİLDİR.
  // --------------------------------------------------------------------------
  var BAND_ESIK = [{ min: 72, band: 5 }, { min: 58, band: 4 }, { min: 44, band: 3 }, { min: 30, band: 2 }, { min: 0, band: 1 }];
  function bandOf(yuzde) { for (var i = 0; i < BAND_ESIK.length; i++) if (yuzde >= BAND_ESIK[i].min) return BAND_ESIK[i].band; return 1; }

  var RENK = {
    "calculus-ab": "--c-calculus", "calculus-bc": "--c-calculus", "physics-1": "--c-physics",
    "chemistry": "--c-chemistry", "biology": "--c-biology", "english-language": "--c-english",
    "cs-a": "--c-electives", "economics": "--c-electives", "cents": "--accent-teal", "genel": "--accent"
  };

  // ---------------- yardımcılar ----------------
  var view = document.getElementById("dn-view");
  var live = document.getElementById("dn-live");
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]; }); }
  function stripHtml(h) { var d = document.createElement("div"); d.innerHTML = String(h || ""); return (d.textContent || "").replace(/\s+/g, " ").trim(); }
  function announce(msg) { if (!live) return; live.textContent = ""; setTimeout(function () { live.textContent = msg; }, 30); }
  function sget(k, fb) {
    if (typeof window.apStoreGet === "function") return window.apStoreGet(k, fb);
    try { var r = localStorage.getItem(k); return r == null ? fb : JSON.parse(r); } catch (e) { return fb; }
  }
  function sset(k, v) {
    if (typeof window.apStoreSet === "function") return window.apStoreSet(k, v);
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  }
  function load() {
    var d = sget(KEY, null);
    if (!d || typeof d !== "object") d = {};
    return { v: 1, aktif: d.aktif && typeof d.aktif === "object" ? d.aktif : null, gecmis: Array.isArray(d.gecmis) ? d.gecmis : [] };
  }
  function save(d) { d.v = 1; if (d.gecmis.length > MAX_GECMIS) d.gecmis = d.gecmis.slice(0, MAX_GECMIS); return sset(KEY, d); }
  function fmtSure(sn) {
    sn = Math.max(0, Math.round(sn));
    var h = Math.floor(sn / 3600), m = Math.floor((sn % 3600) / 60), s = sn % 60;
    var mm = (h ? String(m).padStart(2, "0") : String(m)), ss = String(s).padStart(2, "0");
    return (h ? h + ":" : "") + mm + ":" + ss;
  }
  function fmtDk(sn) { var m = Math.round(sn / 60); return m >= 60 ? Math.floor(m / 60) + " sa " + (m % 60) + " dk" : m + " dk"; }
  function fmtTarih(iso) {
    var d = new Date(iso); if (isNaN(d)) return "";
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }) + " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }
  function colorVar(kod) { return "var(" + (RENK[kod] || "--accent") + ")"; }
  function typeset(el) {
    var mj = window.MathJax;
    if (!el || !mj) return;
    var run = function () { if (mj.typesetPromise) mj.typesetPromise([el]).catch(function () {}); };
    if (mj.startup && mj.startup.promise) mj.startup.promise.then(run).catch(function () {}); else run();
  }
  function param(name) { var m = new RegExp("[?&]" + name + "=([^&#]*)").exec(window.location.search); return m ? decodeURIComponent(m[1]) : null; }

  if (!BANK || !BANK.sorular || !BANK.kodlar) {
    view.innerHTML = '<div class="dn-alert is-bad" role="alert"><strong>Deneme soruları yüklenemedi.</strong> Sayfayı yenilemeyi dene; sorun sürerse biraz sonra tekrar dene.</div>';
    return;
  }

  var BY_KEY = {};
  BANK.sorular.forEach(function (q) { BY_KEY[q.sayfa + "|" + q.id] = q; });
  var KODLAR = Object.keys(BANK.kodlar);
  function qKey(q) { return q.sayfa + "|" + q.id; }
  function poolFor(kod, units) {
    return BANK.sorular.filter(function (q) { return q.denemeKodlari.indexOf(kod) >= 0 && (!units || units.indexOf(q.unite) >= 0); });
  }
  function unitName(kod, no) {
    var k = BANK.kodlar[kod]; if (!k) return no;
    for (var i = 0; i < k.uniteler.length; i++) if (k.uniteler[i].no === no) return k.uniteler[i].ad;
    return no;
  }
  function unitLabel(kod, no) { return /^\d+$/.test(no) ? (kod === "english-language" ? "Beceri " : "Ünite ") + no : no; }
  function onerilen(kod) { var n = BANK.kodlar[kod].soruSayisi; return Math.min(n, 20); }

  // ---------------- Tur 14 A7: Yanlışlarım modu yardımcıları ----------------
  var YKOD = "yanlislar";
  /** Birden çok dersten soru içeren kayıt mı? (genel deneme ya da yanlışlar oturumu) */
  function karma(x) { return !!x && (x.kod === "genel" || x.kod === YKOD); }
  function kodAd(k) { return k === "genel" ? "Genel deneme" : k === YKOD ? "Yanlışlarım tekrarı" : (BANK.kodlar[k] ? BANK.kodlar[k].ad : k); }
  function hataDefteri() {
    var e = (window.APMEBERRA && typeof window.APMEBERRA.loadErrors === "function") ? window.APMEBERRA.loadErrors() : sget(ERR_KEY, null);
    return e && typeof e === "object" && e.items && typeof e.items === "object" ? e : { v: 1, items: {} };
  }
  /** Yanlışlarım’daki açık kayıtlar (en yeni önce) → {acik:[kayıt], havuz:[{q, kod, hata}], disarida:[kayıt]} */
  function yanlisHavuzu() {
    var items = hataDefteri().items;
    var acik = Object.keys(items).map(function (k) { return items[k]; }).filter(function (e) { return e && !e.resolved && e.page && e.id; })
      .sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); });
    var havuz = [], disarida = [];
    acik.forEach(function (e) {
      var q = BY_KEY[String(e.page).replace(/\.html?$/i, "") + ".html|" + e.id];
      if (q && q.denemeKodlari && q.denemeKodlari.length) havuz.push({ q: q, kod: q.denemeKodlari[0], hata: e }); else disarida.push(e);
    });
    return { acik: acik, havuz: havuz, disarida: disarida };
  }
  /** Bir deneme sonucunda yanlış cevaplanan soruların anahtarları (sayfa|id) */
  function yanlisAnahtarlari(rec) {
    var out = {};
    (rec && rec.inceleme || []).forEach(function (it) { if (statusOf(it) === "yanlis") out[it.k] = 1; });
    return out;
  }
  /** Oturum sırası: ders sırası (banka kod sırası) → ünite → pasaj → soru numarası (belirleyici; pasajlı sorular yan yana) */
  function yanlisSirala(list) {
    return list.slice().sort(function (a, b) {
      return (KODLAR.indexOf(a.kod) - KODLAR.indexOf(b.kod)) || String(a.q.unite).localeCompare(String(b.q.unite), "tr", { numeric: true }) ||
        String(a.q.pasaj || "").localeCompare(String(b.q.pasaj || "")) || ((a.q.number || 0) - (b.q.number || 0)) || String(a.q.id).localeCompare(String(b.q.id));
    });
  }

  // ---------------- tohumlu rastgelelik + dengeli seçim ----------------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rng) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  function roundRobin(groups, n) {
    var out = [], idx = groups.map(function () { return 0; }), moved = true;
    while (out.length < n && moved) {
      moved = false;
      for (var i = 0; i < groups.length && out.length < n; i++) {
        if (idx[i] < groups[i].length) { out.push(groups[i][idx[i]++]); moved = true; }
      }
    }
    return out;
  }
  /** Üniteler arasında dengeli: her ünite kendi içinde karışık, üniteler sırayla birer soru verir. */
  function unitBalanced(pool, n, rng) {
    var by = {};
    pool.forEach(function (q) { (by[q.unite] = by[q.unite] || []).push(q); });
    var groups = shuffle(Object.keys(by).sort(), rng).map(function (u) { return shuffle(by[u].slice(), rng); });
    return roundRobin(groups, n);
  }
  /** Pasajlı sorular (English) kendi pasajıyla yan yana ve pasaj içindeki sırayla kalsın. */
  function orderForExam(list, rng) {
    shuffle(list, rng);
    var firstIdx = {};
    list.forEach(function (q, i) { var g = q.pasaj || ("_" + i); if (!(g in firstIdx)) firstIdx[g] = i; });
    return list.map(function (q, i) { return { q: q, g: firstIdx[q.pasaj || ("_" + i)], n: q.pasaj ? (q.number || 0) : 0 }; })
      .sort(function (a, b) { return a.g - b.g || a.n - b.n; }).map(function (x) { return x.q; });
  }
  function selectQuestions(cfg, seed) {
    var rng = mulberry32(seed);
    if (cfg.kod !== "genel") {
      var pool = poolFor(cfg.kod, cfg.uniteFiltre);
      var n = cfg.adet === "tam" ? pool.length : Math.min(cfg.adet, pool.length);
      return orderForExam(unitBalanced(pool, n, rng), rng).map(function (q) { return { k: qKey(q), kod: cfg.kod }; });
    }
    // Genel: dersler arasında dengeli, her ders içinde üniteler arasında dengeli; tekrar eden soru (AB ⊂ BC) bir kez.
    var seen = {}, groups = [];
    cfg.dersler.forEach(function (kod) {
      var p = poolFor(kod).filter(function (q) { var k = qKey(q); if (seen[k]) return false; seen[k] = true; return true; });
      groups.push(unitBalanced(p, p.length, rng).map(function (q) { return { q: q, kod: kod }; }));
    });
    var total = groups.reduce(function (s, g) { return s + g.length; }, 0);
    var n2 = cfg.adet === "tam" ? total : Math.min(cfg.adet, total);
    var picked = roundRobin(groups, n2);
    // Ders blokları (Bluebook'ta her ders ayrı bölüm gibi), blok içinde karışık
    var out = [];
    cfg.dersler.forEach(function (kod) {
      var part = picked.filter(function (x) { return x.kod === kod; });
      var ordered = orderForExam(part.map(function (x) { return x.q; }), rng);
      ordered.forEach(function (q) { out.push({ k: qKey(q), kod: kod }); });
    });
    return out;
  }

  // ======================================================================
  // 1) GİRİŞ EKRANI
  // ======================================================================
  function coverageText(kod) {
    var u = BANK.kodlar[kod].uniteler, have = u.filter(function (x) { return x.soruSayisi > 0; });
    var label = BANK.kodlar[kod].uniteTuru === "CED Skill Category" ? "beceri kategorisi" : "ünite";
    return have.length + " / " + u.length + " " + label + " (" + have.map(function (x) { return unitLabel(kod, x.no).replace(/^Ünite |^Beceri /, ""); }).join(", ") + ")";
  }
  function lastFor(kod, d) { for (var i = 0; i < d.gecmis.length; i++) if (d.gecmis[i].kod === kod) return d.gecmis[i]; return null; }

  function renderLanding() {
    var d = load();
    document.title = "Deneme | Meberra";
    var ucretsiz = ucretsizPlan();
    var cards = KODLAR.map(function (kod) {
      var k = BANK.kodlar[kod], n = onerilen(kod), last = lastFor(kod, d);
      var t = TEMPO[kod] || {};
      var yarim = d.aktif && d.aktif.kod === kod;
      var kilit = ucretsiz && !yarim && hakKullanildi(kod, d);
      var cta = yarim ? '<a class="btn-primary dn-card-cta" href="deneme.html">Yarım denemene devam et →</a>'
        : kilit ? '<p class="dn-note dn-hak-bitti">Ücretsiz denemeni kullandın — Premium ile sınırsız.</p><a class="btn-energy dn-card-cta" href="premium.html">Premium’a geç →</a>'
        : '<a class="btn-primary dn-card-cta" href="deneme.html?ders=' + encodeURIComponent(kod) + '">Denemeyi kur →</a>' +
          (ucretsiz ? '<p class="dn-note">Ücretsiz planda bu ders için 1 deneme hakkın var' + (sayfaOf(kod) === "ap-calculus" || sayfaOf(kod) === "ap-electives" ? ' (aynı ders sayfasındaki denemeyle ortak)' : '') + '.</p>' : '');
      return '<article class="dn-card" style="--dn-c:' + colorVar(kod) + '">' +
        '<h3 class="dn-card-title">' + esc(k.ad) + '</h3>' +
        '<dl class="dn-facts">' +
        '<div><dt>Soru havuzu</dt><dd>' + k.soruSayisi + ' soru</dd></div>' +
        '<div><dt>Kapsam</dt><dd>' + esc(coverageText(kod)) + '</dd></div>' +
        '<div><dt>Önerilen</dt><dd>' + n + ' soru · ' + fmtDk(n * tempoSn(kod)) + (t.yaklasik ? ' (yaklaşık)' : '') + '</dd></div>' +
        (last ? '<div><dt>Son deneme</dt><dd>%' + last.yuzde + ' · ' + esc(fmtTarih(last.tarih)) + '</dd></div>' : '') +
        '</dl>' +
        (k.soruSayisi < 40 ? '<p class="dn-note">Havuz küçük: tam bir AP Section I (' + (t.soru || "?") + ' soru) kurulamaz; deneme kısa tutulur.</p>' : '') +
        cta +
        '</article>';
    }).join("");

    view.innerHTML =
      '<header class="page-head">' +
      '<span class="eyebrow">Deneme</span>' +
      '<h1 tabindex="-1" id="dn-h1">AP çoktan seçmeli deneme</h1>' +
      '<p>Bluebook benzeri odaklı ekran: cevaplar teslimde açılır, ünite bazında sonuç ve soru soru inceleme alırsın.</p>' +
      '</header>' +
      yanlisGirisKarti() +
      '<section class="dn-section" aria-labelledby="dn-ders-title">' +
      '<h2 class="panel-title" id="dn-ders-title">Ders denemeleri</h2>' +
      '<div class="dn-grid">' + cards + '</div>' +
      '</section>' +
      '<section class="dn-section interactive-panel" aria-labelledby="dn-genel-title" id="genel">' +
      '<h2 class="panel-title" id="dn-genel-title">Genel deneme (karma)</h2>' +
      '<p class="panel-sub">Seçtiğin derslerden dengeli karışık deneme. Her ders kendi bloğunda gelir; süre her sorunun kendi dersinin temposuyla toplanır.</p>' +
      (ucretsiz ? '<p class="dn-note dn-hak-bitti">Genel deneme Premium’da. <a href="premium.html">Premium’a geç →</a></p>' : '') +
      setupForm("genel") +
      '</section>' +
      renderHistory(d);
    bindSetup("genel");
    bindHistory();
    drawSparks(d);
  }

  // ======================================================================
  // 1b) YANLIŞLARIM MODU (Tur 14 A7): giriş kartı, kurulum, boş durum
  // ======================================================================
  var IC_Y = {
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>'
  };
  /** Denemeler giriş ekranında Yanlışlarım kısayolu */
  function yanlisGirisKarti() {
    var h = yanlisHavuzu(), n = h.havuz.length;
    var metin = n ? '<strong>' + n + '</strong> açık hatan deneme havuzunda. Tek oturumda tekrar çöz; doğru çözdüğün hata Yanlışlarım’da kapanır.'
      : (h.acik.length ? h.acik.length + ' açık hatan var ama deneme havuzunda değil; ders sayfasından çözebilirsin.' : 'Açık hatan yok. Deneme ya da ünite sorularında yanlış yaptığın sorular burada birikir.');
    return '<section class="dn-yk' + (n ? "" : " is-bos") + '" id="dn-yanlis-kart" aria-labelledby="dn-yk-title">' +
      '<span class="dn-yk-ico">' + (n ? IC_Y.redo : IC_Y.ok) + '</span>' +
      '<div class="dn-yk-body"><h2 id="dn-yk-title">Yanlışlarım</h2><p>' + metin + '</p></div>' +
      (n ? '<a class="btn-primary" href="deneme.html?mod=yanlislar">Yanlışlarımı çöz →</a>' : (h.acik.length ? '<a class="btn-ghost" href="ilerleme.html#hata-title">Yanlışlarım →</a>' : '')) +
      '</section>';
  }

  function renderYanlislar(opt) {
    opt = opt || {};
    document.title = "Yanlışlarım | Meberra";
    var h = yanlisHavuzu(), d = load();
    var kaynak = opt.deneme ? d.gecmis.filter(function (r) { return r.id === opt.deneme; })[0] || null : null;
    var havuz = h.havuz;
    if (kaynak) { var yk = yanlisAnahtarlari(kaynak); havuz = havuz.filter(function (x) { return yk[qKey(x.q)]; }); }
    var bas = '<p class="dn-back"><a href="deneme.html">← Tüm denemeler</a></p>' +
      '<header class="page-head dn-y-head">' +
      '<span class="eyebrow">Yanlışlarım</span>' +
      '<h1 tabindex="-1" id="dn-h1">' + (kaynak ? "Bu denemenin yanlışlarını çöz" : "Yanlışlarını tek oturumda çöz") + '</h1>' +
      '<p>' + (kaynak ? esc(kaynak.ad) + ' · ' + esc(fmtTarih(kaynak.tarih)) + '. ' : '') + 'Yanlışlarım’daki açık sorular tek bir oturumda gelir. Doğru çözdüğün hata kapanır, yine yanlışsa defterde kalır. Sınav sırasında doğru/yanlış gösterilmez; teslimden sonra her sorunun çözümünü görürsün.</p>' +
      '</header>';
    if (!havuz.length) {
      var tumu = kaynak && h.havuz.length;
      var baslik = !h.acik.length ? "Açık hatan yok" : (kaynak ? "Bu denemenin açık yanlışı kalmadı" : "Açık hataların deneme havuzunda değil");
      var aciklama = !h.acik.length ? "Yanlış yaptığın sorular Yanlışlarım’a yazılır ve burada tek oturumda tekrar çözülür. Şimdilik kapatılacak hata yok."
        : (kaynak ? "Bu denemede yanlış yaptığın sorular kapandı ya da hiç yanlışın yoktu." : h.acik.length + " açık hatan ders sayfalarındaki sorularda; Yanlışlarım’nden soruya git.");
      view.innerHTML = bas +
        '<section class="dn-empty" id="dn-yanlis-bos" role="status" aria-labelledby="dn-yb-title">' +
        '<span class="dn-empty-ico">' + IC_Y.ok + '</span><h2 id="dn-yb-title">' + baslik + '</h2><p>' + aciklama + '</p>' +
        '<div class="dn-actions">' +
        (tumu ? '<a class="btn-primary" href="deneme.html?mod=yanlislar">Tüm yanlışlarım (' + h.havuz.length + ')</a>' :
          (h.acik.length ? '<a class="btn-primary" href="ilerleme.html#hata-title">Yanlışlarım’a git</a>' : '<a class="btn-primary" href="deneme.html">Deneme çöz</a>')) +
        '<a class="btn-ghost" href="calis.html">Çalış</a><a class="btn-ghost" href="index.html">Bugün’e dön</a></div></section>';
      focusH1();
      return;
    }
    var say = {};
    havuz.forEach(function (x) { say[x.kod] = (say[x.kod] || 0) + 1; });
    var kods = KODLAR.filter(function (k) { return say[k]; });
    var secDers = opt.ders && say[opt.ders] ? opt.ders : null;
    var adetler = [10, 20].filter(function (n) { return havuz.length > n; });
    view.innerHTML = bas +
      '<section class="interactive-panel dn-y-panel" aria-label="Yanlışlarım oturumu">' +
      '<dl class="dn-y-ozet">' +
      '<div><dt>Açık hata</dt><dd>' + h.acik.length + '</dd></div>' +
      '<div><dt>Bu oturumda çözülebilir</dt><dd>' + havuz.length + '</dd></div>' +
      (h.disarida.length ? '<div><dt>Ders sayfasında</dt><dd>' + h.disarida.length + '</dd></div>' : '') +
      '</dl>' +
      '<form class="dn-setup" id="dn-yform" novalidate>' +
      '<fieldset class="dn-fs"><legend>Dersler</legend><div class="dn-checks">' +
      kods.map(function (k) {
        return '<label class="dn-check" style="--dn-c:' + colorVar(k) + '"><input type="checkbox" name="yders" value="' + esc(k) + '"' + (!secDers || secDers === k ? " checked" : "") + '> <span>' + esc(BANK.kodlar[k].ad) + ' <small>(' + say[k] + ' hata)</small></span></label>';
      }).join("") + '</div></fieldset>' +
      (adetler.length ? '<fieldset class="dn-fs"><legend>Soru sayısı</legend><div class="dn-radios">' +
        '<label class="dn-radio"><input type="radio" name="yadet" value="tam" checked> <span>Hepsi <small id="dn-yadet-n"></small></span></label>' +
        adetler.map(function (n) { return '<label class="dn-radio"><input type="radio" name="yadet" value="' + n + '"> <span>En yeni ' + n + '</span></label>'; }).join("") +
        '</div></fieldset>' : '') +
      '<p class="dn-summary" id="dn-ysum" aria-live="polite"></p>' +
      '<p class="dn-form-msg" id="dn-yform-msg" role="alert"></p>' +
      '<div class="dn-actions"><button type="submit" class="btn-primary" id="dn-ystart">Yanlışlarımı çözmeye başla</button></div>' +
      '</form>' +
      '<p class="dn-note">Süre tutulmaz; geçen süre kayda yazılır. Boş bıraktığın hata açık kalır.' +
      (h.disarida.length ? ' ' + h.disarida.length + ' açık hata ders sayfalarındaki sorularda: <a href="ilerleme.html#hata-title">Yanlışlarım</a>.' : '') + '</p>' +
      '</section>';
    var form = document.getElementById("dn-yform");
    function secim() {
      var on = [].slice.call(form.querySelectorAll('input[name="yders"]:checked')).map(function (i) { return i.value; });
      var adEl = form.querySelector('input[name="yadet"]:checked'), adet = adEl && adEl.value !== "tam" ? Number(adEl.value) : Infinity;
      var list = havuz.filter(function (x) { return on.indexOf(x.kod) >= 0; }); // havuz en yeni hata önce
      return list.slice(0, Math.min(adet, list.length));
    }
    function refresh() {
      var all = havuz.filter(function (x) { return [].slice.call(form.querySelectorAll('input[name="yders"]:checked')).some(function (i) { return i.value === x.kod; }); }).length;
      var n = secim().length, tn = document.getElementById("dn-yadet-n");
      if (tn) tn.textContent = "(" + all + ")";
      document.getElementById("dn-ysum").innerHTML = n ? "Seçilen: <strong>" + n + " soru</strong> · süresiz" : "";
      document.getElementById("dn-yform-msg").textContent = n ? "" : "En az bir ders seç.";
      var b = document.getElementById("dn-ystart"); b.disabled = !n; b.textContent = n ? "Yanlışlarımı çözmeye başla (" + n + " soru)" : "Yanlışlarımı çözmeye başla";
    }
    form.addEventListener("change", refresh);
    form.addEventListener("submit", function (e) { e.preventDefault(); var list = secim(); if (list.length) startYanlislar(list, kaynak); });
    refresh();
    focusH1();
  }

  function startYanlislar(list, kaynak) {
    var sirali = yanlisSirala(list);
    var seed = (Math.floor(Math.random() * 0xFFFFFFFF) >>> 0) || 1;
    var dersler = []; sirali.forEach(function (x) { if (dersler.indexOf(x.kod) < 0) dersler.push(x.kod); });
    var d = load();
    d.aktif = {
      id: "dn-" + Date.now().toString(36) + "-" + seed.toString(36),
      kod: YKOD, mod: YKOD, ad: "Yanlışlarım tekrarı", dersler: dersler,
      seed: seed, sorular: sirali.map(function (x) { return { k: qKey(x.q), kod: x.kod }; }), cevaplar: {}, isaretli: {}, mevcut: 0,
      sureModu: "suresiz", sureLimitSn: null, gecenSn: 0,
      baslangic: new Date().toISOString(), uniteFiltre: null, kaynakDeneme: kaynak ? kaynak.id : null
    };
    save(d);
    try { history.replaceState(null, "", "deneme.html?mod=yanlislar"); } catch (e) { /* yok say */ }
    renderExam(d.aktif);
  }

  // ======================================================================
  // 2) KURULUM
  // ======================================================================
  function setupForm(kod) {
    var isGenel = kod === "genel";
    var counts = [10, 20, 30];
    var pool = isGenel ? null : BANK.kodlar[kod];
    var html = '<form class="dn-setup" id="dn-setup" novalidate data-kod="' + esc(kod) + '">';
    if (isGenel) {
      html += '<fieldset class="dn-fs"><legend>Dersler</legend><div class="dn-checks">' +
        KODLAR.map(function (k) {
          var def = k !== "calculus-bc"; // AB ⊂ BC: varsayılan olarak yalnız AB
          return '<label class="dn-check" style="--dn-c:' + colorVar(k) + '"><input type="checkbox" name="ders" value="' + esc(k) + '"' + (def ? " checked" : "") + '> <span>' + esc(BANK.kodlar[k].ad) + ' <small>(' + BANK.kodlar[k].soruSayisi + ')</small></span></label>';
        }).join("") + '</div></fieldset>';
    }
    html += '<fieldset class="dn-fs"><legend>Soru sayısı</legend><div class="dn-radios">' +
      counts.map(function (c) { return '<label class="dn-radio"><input type="radio" name="adet" value="' + c + '"' + (c === 20 ? " checked" : "") + '> <span>' + c + '</span></label>'; }).join("") +
      '<label class="dn-radio"><input type="radio" name="adet" value="tam"> <span>Tam set <small id="dn-tam-n"></small></span></label>' +
      '</div></fieldset>';
    var t = TEMPO[kod];
    html += '<fieldset class="dn-fs"><legend>Süre</legend><div class="dn-radios dn-radios-col">' +
      '<label class="dn-radio"><input type="radio" name="sure" value="tempo" checked> <span>Sınav temposu ' +
      (isGenel ? '<small>(her soru kendi dersinin AP Section I temposuyla)</small>'
        : '<small>(soru başına ' + Math.round(tempoSn(kod)) + ' sn = AP Section I: ' + t.soru + ' soru / ' + t.dk + ' dk' + (t.yaklasik ? ', yaklaşık' : '') + ')</small>') +
      '</span></label>' +
      '<label class="dn-radio"><input type="radio" name="sure" value="suresiz"> <span>Süresiz <small>(geçen süre yine kaydedilir)</small></span></label>' +
      '</div>' +
      (!isGenel && t.url ? '<p class="dn-src">Tempo kaynağı: <a href="' + esc(t.url) + '" target="_blank" rel="noopener">College Board AP Central — Exam</a>' + (t.not ? ' · ' + esc(t.not) : '') + '</p>' : '') +
      (!isGenel && t.yaklasik ? '<p class="dn-src">' + esc(t.not) + '</p>' : '') +
      '</fieldset>';
    if (!isGenel) {
      html += '<fieldset class="dn-fs"><legend>' + (pool.uniteTuru === "CED Skill Category" ? "Beceri kategorisi filtresi" : "Ünite filtresi") + '</legend>' +
        '<div class="dn-unit-tools"><button type="button" class="btn-ghost dn-mini" id="dn-u-all">Tümünü seç</button><button type="button" class="btn-ghost dn-mini" id="dn-u-none">Temizle</button></div>' +
        '<div class="dn-checks dn-units">' +
        pool.uniteler.map(function (u) {
          var dis = !u.soruSayisi;
          return '<label class="dn-check' + (dis ? " is-disabled" : "") + '"><input type="checkbox" name="unite" value="' + esc(u.no) + '"' + (dis ? " disabled" : " checked") + '> <span><b>' + esc(unitLabel(kod, u.no)) + '</b> ' + esc(u.ad.replace(/^Micro · |^Macro · |^Skill Cat\. \d — /, "")) + ' <small>(' + (dis ? "soru yok" : u.soruSayisi) + ')</small></span></label>';
        }).join("") + '</div></fieldset>';
    }
    html += '<p class="dn-summary" id="dn-sum" aria-live="polite"></p>' +
      '<p class="dn-form-msg" id="dn-form-msg" role="alert"></p>' +
      '<div class="dn-actions"><button type="submit" class="btn-primary" id="dn-start">Denemeyi başlat</button></div>' +
      '</form>';
    return html;
  }

  function readSetup(form) {
    var kod = form.getAttribute("data-kod");
    var adetEl = form.querySelector('input[name="adet"]:checked');
    var adet = adetEl ? (adetEl.value === "tam" ? "tam" : Number(adetEl.value)) : 20;
    var sure = (form.querySelector('input[name="sure"]:checked') || {}).value || "tempo";
    var dersler = null, uniteFiltre = null;
    if (kod === "genel") dersler = [].slice.call(form.querySelectorAll('input[name="ders"]:checked')).map(function (i) { return i.value; });
    else {
      var all = [].slice.call(form.querySelectorAll('input[name="unite"]:not([disabled])'));
      var on = all.filter(function (i) { return i.checked; }).map(function (i) { return i.value; });
      uniteFiltre = on.length === all.length ? null : on;
    }
    return { kod: kod, adet: adet, sureModu: sure, dersler: dersler, uniteFiltre: uniteFiltre };
  }
  function poolSize(cfg) {
    if (cfg.kod !== "genel") return cfg.uniteFiltre && !cfg.uniteFiltre.length ? 0 : poolFor(cfg.kod, cfg.uniteFiltre).length;
    var seen = {};
    (cfg.dersler || []).forEach(function (k) { poolFor(k).forEach(function (q) { seen[qKey(q)] = 1; }); });
    return Object.keys(seen).length;
  }
  function estimateSn(cfg, n) {
    if (cfg.kod !== "genel") return n * tempoSn(cfg.kod);
    var ds = cfg.dersler || []; if (!ds.length) return 0;
    var avg = ds.reduce(function (s, k) { return s + tempoSn(k); }, 0) / ds.length;
    return n * avg; // yaklaşık önizleme; kesin süre seçilen sorulardan hesaplanır
  }
  function bindSetup(kod) {
    var form = document.getElementById("dn-setup");
    if (!form) return;
    function refresh() {
      var cfg = readSetup(form), size = poolSize(cfg);
      var n = cfg.adet === "tam" ? size : Math.min(cfg.adet, size);
      var tam = document.getElementById("dn-tam-n"); if (tam) tam.textContent = "(" + size + ")";
      var sum = document.getElementById("dn-sum");
      var msg = "";
      if (!size) msg = cfg.kod === "genel" ? "En az bir ders seç." : "En az bir ünite seç.";
      sum.innerHTML = size ? ("Seçilen: <strong>" + n + " soru</strong>" + (cfg.adet !== "tam" && cfg.adet > size ? " (havuzda yalnız " + size + " soru var)" : "") +
        " · " + (cfg.sureModu === "tempo" ? "süre " + (cfg.kod === "genel" ? "≈ " : "") + "<strong>" + fmtSure(estimateSn(cfg, n)) + "</strong>" : "süresiz")) : "";
      document.getElementById("dn-form-msg").textContent = msg;
      document.getElementById("dn-start").disabled = !size;
    }
    form.addEventListener("change", refresh);
    var all = document.getElementById("dn-u-all"), none = document.getElementById("dn-u-none");
    if (all) all.addEventListener("click", function () { form.querySelectorAll('input[name="unite"]:not([disabled])').forEach(function (i) { i.checked = true; }); refresh(); });
    if (none) none.addEventListener("click", function () { form.querySelectorAll('input[name="unite"]:not([disabled])').forEach(function (i) { i.checked = false; }); refresh(); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var cfg = readSetup(form);
      if (!poolSize(cfg)) { refresh(); return; }
      startExam(cfg);
    });
    refresh();
  }

  function renderSetup(kod) {
    if (premiumGerekli({ kod: kod })) { renderPremiumDuvar({ kod: kod }); return; }
    var isGenel = kod === "genel";
    var k = isGenel ? null : BANK.kodlar[kod];
    document.title = (isGenel ? "Genel deneme" : k.ad + " denemesi") + " | Meberra";
    view.innerHTML =
      '<p class="dn-back"><a href="deneme.html">← Tüm denemeler</a></p>' +
      '<header class="page-head" style="--dn-c:' + colorVar(kod) + '">' +
      '<span class="eyebrow">Deneme kurulumu</span>' +
      '<h1 tabindex="-1" id="dn-h1">' + (isGenel ? "Genel deneme (karma)" : esc(k.ad)) + '</h1>' +
      (isGenel ? '<p>Seçtiğin derslerden dengeli karışık deneme.</p>'
        : '<p>Havuz: <strong>' + k.soruSayisi + ' soru</strong> · Kapsam: ' + esc(coverageText(kod)) + '. Sorular seçtiğin üniteler arasında dengeli ve rastgele seçilir; seçim tohumu (seed) sonuç kaydına yazılır.</p>') +
      '</header>' +
      '<section class="interactive-panel">' + setupForm(kod) + '</section>';
    bindSetup(kod);
    focusH1();
  }
  function focusH1() { var h = document.getElementById("dn-h1"); if (h) h.focus({ preventScroll: false }); }

  // ======================================================================
  // 3) SINAV
  // ======================================================================
  var A = null;          // aktif deneme (state)
  var timerId = null, lastTick = 0, sinceSave = 0, warned = false;
  var navOpen = false;

  // Meberra ücretsiz plan: her ders sayfasından 1 deneme (hak başlarken yazılır); genel deneme Premium (sunucu modu dışında her şey açık)
  function ucretsizPlan() { return !!window.apPremiumMu && !window.apPremiumMu(); }
  function sayfaOf(kod) { var k = BANK.kodlar[kod]; return k && k.sayfa ? String(k.sayfa).replace(/\.html?$/i, "") : kod; }
  function hakKayitlari() { var h = sget(HAK_KEY, null); return h && typeof h === "object" && !Array.isArray(h) ? h : {}; }
  /** Bu dersin (sayfasının) ücretsiz denemesi kullanıldı mı? Hak kaydı ya da (geriye uyum) tamamlanmış bir geçmiş kaydı. */
  function hakKullanildi(kod, d) {
    var sayfa = sayfaOf(kod);
    if (hakKayitlari()[sayfa]) return true;
    return (d || load()).gecmis.some(function (r) { return r && r.mod !== YKOD && r.kod !== "genel" && r.kod !== YKOD && BANK.kodlar[r.kod] && sayfaOf(r.kod) === sayfa; });
  }
  function hakYaz(kod) {
    var h = hakKayitlari(), sayfa = sayfaOf(kod);
    if (h[sayfa]) return;
    h[sayfa] = { t: Date.now(), kod: kod };
    sset(HAK_KEY, h);
  }
  function premiumGerekli(cfg) {
    if (!ucretsizPlan()) return false;
    if (cfg.kod === "genel") return true;
    return hakKullanildi(cfg.kod);
  }
  function renderPremiumDuvar(cfg) {
    view.innerHTML = '<section class="surface ug-duvar" aria-labelledby="dn-duvar-h">' +
      '<h2 id="dn-duvar-h" tabindex="-1">' + (cfg.kod === "genel" ? "Genel deneme Premium'da" : "Bu dersin ücretsiz denemesini kullandın") + '</h2>' +
      '<p>Ücretsiz planda her dersten 1 deneme çözebilirsin (tahmini puan bandı dahil). Premium ile sınırsız ders denemesi ve genel deneme çöz.</p>' +
      '<div class="ug-duvar-eylem"><a class="btn-energy" href="premium.html">Premium\'a geç</a><button type="button" class="btn-ghost" id="dn-duvar-geri">Denemelere dön</button></div>' +
      '<p class="ug-duvar-not">Yanlışlarını tekrar çözmek ücretsiz: <a href="deneme.html?mod=yanlislar">Yanlışlarım</a></p></section>';
    document.getElementById("dn-duvar-geri").addEventListener("click", function () { renderLanding(); });
    var h = document.getElementById("dn-duvar-h"); if (h) h.focus();
  }

  function startExam(cfg) {
    if (premiumGerekli(cfg)) { renderPremiumDuvar(cfg); return; }
    var seed = (Math.floor(Math.random() * 0xFFFFFFFF) >>> 0) || 1;
    var list = selectQuestions(cfg, seed);
    if (!list.length) return;
    var ad = cfg.kod === "genel" ? "Genel deneme (" + cfg.dersler.map(function (k) { return BANK.kodlar[k].ad.replace(/^AP /, ""); }).join(", ") + ")" : BANK.kodlar[cfg.kod].ad;
    var limit = null;
    if (cfg.sureModu === "tempo") limit = Math.round(list.reduce(function (s, x) { return s + tempoSn(x.kod); }, 0));
    // Ücretsiz deneme hakkı başlarken kullanılır (iptal ya da geçmiş sınırı geri getirmez)
    if (cfg.kod !== "genel" && cfg.kod !== YKOD) hakYaz(cfg.kod);
    var d = load();
    d.aktif = {
      id: "dn-" + Date.now().toString(36) + "-" + seed.toString(36),
      kod: cfg.kod, ad: ad, dersler: cfg.kod === "genel" ? cfg.dersler : [cfg.kod],
      seed: seed, sorular: list, cevaplar: {}, isaretli: {}, mevcut: 0,
      sureModu: cfg.sureModu, sureLimitSn: limit, gecenSn: 0,
      baslangic: new Date().toISOString(), uniteFiltre: cfg.uniteFiltre || null
    };
    save(d);
    renderExam(d.aktif);
  }

  function persist() { if (!A) return; var d = load(); d.aktif = A; save(d); sinceSave = 0; }

  function renderExam(aktif) {
    A = aktif;
    // Bankada artık olmayan soru (içerik değişmiş olabilir) → listeden düş
    A.sorular = A.sorular.filter(function (x) { return !!BY_KEY[x.k]; });
    if (!A.sorular.length) { var d = load(); d.aktif = null; save(d); renderLanding(); return; }
    if (A.mevcut >= A.sorular.length) A.mevcut = 0;
    document.title = "Deneme sürüyor — " + A.ad + " | Meberra";
    document.body.classList.add("dn-exam-mode");
    view.innerHTML =
      '<section class="dn-exam" id="dn-exam" aria-label="Deneme sınavı" style="--dn-c:' + colorVar(A.kod) + '">' +
      '<div class="dn-bar">' +
      '<div class="dn-bar-title"><strong>' + esc(A.ad) + '</strong><span class="dn-bar-sub">' + A.sorular.length + ' soru · ' + (A.sureModu === "tempo" ? "sınav temposu" : "süresiz") + '</span></div>' +
      '<div class="dn-timer-wrap"><span class="dn-timer" id="dn-timer" role="timer" aria-label="Kalan süre"></span>' +
      '<button type="button" class="btn-ghost dn-mini" id="dn-timer-hide" aria-pressed="false">Gizle</button></div>' +
      '<div class="dn-bar-actions"><button type="button" class="btn-primary" id="dn-review-open">Gözden geçir &amp; teslim et</button></div>' +
      '</div>' +
      '<div class="dn-ilerleme" id="dn-ilerleme"><div class="dn-ilerleme-cubuk" role="progressbar" aria-label="Cevaplanan soru" aria-valuemin="0" aria-valuemax="' + A.sorular.length + '" id="dn-ilerleme-cubuk"><span id="dn-ilerleme-dolgu"></span></div><span class="dn-ilerleme-metin" id="dn-ilerleme-metin"></span></div>' +
      '<nav class="dn-serit" id="dn-serit" aria-label="Sorular"></nav>' +
      '<div class="dn-stage" id="dn-stage"></div>' +
      '<div class="dn-foot">' +
      '<button type="button" class="btn-ghost" id="dn-prev">← Önceki</button>' +
      '<button type="button" class="btn-ghost dn-nav-toggle" id="dn-nav-toggle" aria-expanded="false" aria-controls="dn-nav">Soru <span id="dn-pos"></span> ▴</button>' +
      '<button type="button" class="btn-primary" id="dn-next">Sonraki →</button>' +
      '</div>' +
      '<p class="kbd-hint dn-kbd"><kbd>A</kbd>–<kbd>D</kbd> / <kbd>1</kbd>–<kbd>4</kbd> şık seçer · <kbd>Del</kbd> seçimi siler · <kbd>←</kbd>/<kbd>→</kbd> önceki/sonraki · <kbd>M</kbd> işaretle · <kbd>G</kbd> soru listesi · <kbd>Esc</kbd> kapat. Cevapların otomatik kaydedilir; sayfa yenilenirse kaldığın yerden devam edersin (süre yalnızca sayfa açıkken işler).</p>' +
      '<div class="dn-nav" id="dn-nav" hidden role="dialog" aria-modal="false" aria-labelledby="dn-nav-title">' +
      '<div class="dn-nav-head"><h2 id="dn-nav-title">Soru listesi</h2><button type="button" class="btn-ghost dn-mini" id="dn-nav-close">Kapat</button></div>' +
      '<div class="dn-legend"><span><i class="dn-dot is-answered"></i>Cevaplandı</span><span><i class="dn-dot"></i>Boş</span><span><i class="dn-dot is-marked"></i>İşaretli</span><span><i class="dn-dot is-current"></i>Şu anki</span></div>' +
      '<div class="dn-grid-nav" id="dn-grid-nav"></div>' +
      '<div class="dn-confirm" id="dn-confirm"></div>' +
      '<div class="dn-nav-actions"><button type="button" class="btn-primary" id="dn-submit">Teslim et</button>' +
      '<button type="button" class="btn-ghost btn-danger dn-mini" id="dn-abandon">Denemeyi iptal et</button></div>' +
      '</div>' +
      '</section>';

    document.getElementById("dn-prev").addEventListener("click", function () { go(A.mevcut - 1); });
    document.getElementById("dn-next").addEventListener("click", function () {
      if (A.mevcut === A.sorular.length - 1) openNav(true); else go(A.mevcut + 1);
    });
    document.getElementById("dn-nav-toggle").addEventListener("click", function () { navOpen ? closeNav() : openNav(false); });
    document.getElementById("dn-nav-close").addEventListener("click", closeNav);
    document.getElementById("dn-review-open").addEventListener("click", function () { openNav(true); });
    document.getElementById("dn-submit").addEventListener("click", function () { submitExam(false); });
    document.getElementById("dn-abandon").addEventListener("click", abandonExam);
    document.getElementById("dn-timer-hide").addEventListener("click", function () {
      var t = document.getElementById("dn-timer"), hidden = t.classList.toggle("is-hidden");
      this.setAttribute("aria-pressed", hidden ? "true" : "false"); this.textContent = hidden ? "Göster" : "Gizle";
    });
    document.getElementById("dn-serit").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-i]"); if (b) go(Number(b.getAttribute("data-i")));
    });
    document.getElementById("dn-grid-nav").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-i]"); if (!b) return;
      closeNav(); go(Number(b.getAttribute("data-i")));
    });
    renderQuestion();
    startTimer();
  }

  function renderQuestion() {
    var i = A.mevcut, item = A.sorular[i], q = BY_KEY[item.k];
    var sel = A.cevaplar[i] || null, marked = !!A.isaretli[i];
    var stage = document.getElementById("dn-stage");
    var pas = q.pasaj && BANK.pasajlar[q.pasaj];
    var showKod = karma(A);
    var optHtml = q.options.map(function (o) {
      var on = sel === o.id;
      return '<button type="button" class="option-btn dn-opt' + (on ? " is-selected" : "") + '" data-opt="' + esc(o.id) + '" aria-pressed="' + (on ? "true" : "false") + '">' +
        '<span class="option-letter" aria-hidden="true">' + esc(o.id) + '</span><span class="visually-hidden">Şık ' + esc(o.id) + ': </span><span>' + o.text + '</span></button>';
    }).join("");
    stage.className = "dn-stage" + (pas ? " has-passage" : "");
    stage.innerHTML =
      (pas ? '<aside class="dn-passage" aria-label="Pasaj"><h3 class="dn-passage-title">' + esc(pas.baslik) + '</h3><div class="dn-passage-body">' + pas.html + '</div></aside>' : '') +
      '<article class="question-card dn-q" id="dn-q" aria-labelledby="dn-q-title">' +
      '<div class="dn-q-head"><span class="question-num-badge" id="dn-q-title">Soru ' + (i + 1) + ' / ' + A.sorular.length + '</span>' +
      (showKod ? '<span class="dn-q-course" style="--dn-c:' + colorVar(item.kod) + '">' + esc(BANK.kodlar[item.kod].ad) + '</span>' : '') +
      '<button type="button" class="btn-ghost dn-mini dn-mark" id="dn-mark" aria-pressed="' + (marked ? "true" : "false") + '">' + (marked ? "★ İşaretli" : "☆ İşaretle / sonra dön") + '</button></div>' +
      '<div class="question-body">' + q.question + '</div>' +
      '<div class="options-container" role="group" aria-label="Soru ' + (i + 1) + ' seçenekleri">' + optHtml + '</div>' +
      '<div class="dn-q-tools"><button type="button" class="btn-ghost dn-mini" id="dn-clear"' + (sel ? "" : " disabled") + '>Seçimi temizle</button></div>' +
      '</article>';
    stage.querySelectorAll(".dn-opt").forEach(function (b) { b.addEventListener("click", function () { choose(b.getAttribute("data-opt")); }); });
    document.getElementById("dn-mark").addEventListener("click", toggleMark);
    document.getElementById("dn-clear").addEventListener("click", function () { choose(null); });
    document.getElementById("dn-pos").textContent = (i + 1) + " / " + A.sorular.length;
    document.getElementById("dn-prev").disabled = i === 0;
    document.getElementById("dn-next").textContent = i === A.sorular.length - 1 ? "Gözden geçir →" : "Sonraki →";
    if (navOpen) renderNavGrid(false);
    renderSerit();
    typeset(stage);
  }
  /** Her zaman görünen soru şeridi + cevaplanan ilerleme çubuğu (Bluebook benzeri). */
  function renderSerit() {
    var g = document.getElementById("dn-serit"); if (!g || !A) return;
    g.innerHTML = A.sorular.map(function (x, i) {
      var cls = (A.cevaplar[i] ? " is-answered" : "") + (A.isaretli[i] ? " is-marked" : "") + (i === A.mevcut ? " is-current" : "");
      var lab = "Soru " + (i + 1) + (A.cevaplar[i] ? ", cevaplandı" : ", boş") + (A.isaretli[i] ? ", işaretli" : "");
      return '<button type="button" class="dn-cell dn-serit-hucre' + cls + '" data-i="' + i + '" aria-label="' + lab + '"' + (i === A.mevcut ? ' aria-current="true"' : "") + '>' + (i + 1) + '</button>';
    }).join("");
    var c = counts(), dol = document.getElementById("dn-ilerleme-dolgu"), cub = document.getElementById("dn-ilerleme-cubuk"), mt = document.getElementById("dn-ilerleme-metin");
    if (dol) dol.style.transform = "scaleX(" + (c.n ? c.ans / c.n : 0) + ")";
    if (cub) cub.setAttribute("aria-valuenow", String(c.ans));
    if (mt) mt.textContent = c.ans + " / " + c.n + " cevaplandı" + (c.mk ? " · " + c.mk + " işaretli" : "");
    var cur = g.querySelector(".is-current");
    if (cur && g.scrollWidth > g.clientWidth) { var l = cur.offsetLeft - g.clientWidth / 2 + cur.offsetWidth / 2; g.scrollLeft = Math.max(0, l); }
  }

  function choose(opt) {
    var i = A.mevcut;
    if (opt) A.cevaplar[i] = opt; else delete A.cevaplar[i];
    persist();
    document.querySelectorAll("#dn-stage .dn-opt").forEach(function (b) {
      var on = b.getAttribute("data-opt") === opt;
      b.classList.toggle("is-selected", on); b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var clr = document.getElementById("dn-clear"); if (clr) clr.disabled = !opt;
    renderSerit();
    announce(opt ? "Seçenek " + opt + " seçildi." : "Seçim temizlendi.");
  }
  function toggleMark() {
    var i = A.mevcut;
    if (A.isaretli[i]) delete A.isaretli[i]; else A.isaretli[i] = true;
    persist();
    var b = document.getElementById("dn-mark"), on = !!A.isaretli[i];
    b.setAttribute("aria-pressed", on ? "true" : "false"); b.textContent = on ? "★ İşaretli" : "☆ İşaretle / sonra dön";
    if (navOpen) renderNavGrid(false);
    renderSerit();
    announce(on ? "Soru işaretlendi." : "İşaret kaldırıldı.");
  }
  function go(i) {
    if (i < 0 || i >= A.sorular.length || i === A.mevcut) return;
    var st = document.getElementById("dn-stage"); if (st) st.setAttribute("data-yon", i > A.mevcut ? "ileri" : "geri");
    A.mevcut = i; persist(); renderQuestion();
    var q = document.getElementById("dn-q-title"); if (q) { q.setAttribute("tabindex", "-1"); q.focus({ preventScroll: true }); }
    var ex = document.getElementById("dn-exam"); if (ex && ex.getBoundingClientRect().top < 0) ex.scrollIntoView({ block: "start" });
  }
  function counts() {
    var n = A.sorular.length, ans = Object.keys(A.cevaplar).length, mk = Object.keys(A.isaretli).length;
    return { n: n, ans: ans, bos: n - ans, mk: mk };
  }
  function renderNavGrid(confirm) {
    var g = document.getElementById("dn-grid-nav");
    g.innerHTML = A.sorular.map(function (x, i) {
      var cls = (A.cevaplar[i] ? " is-answered" : "") + (A.isaretli[i] ? " is-marked" : "") + (i === A.mevcut ? " is-current" : "");
      var lab = "Soru " + (i + 1) + (A.cevaplar[i] ? ", cevaplandı" : ", boş") + (A.isaretli[i] ? ", işaretli" : "");
      return '<button type="button" class="dn-cell' + cls + '" data-i="' + i + '" aria-label="' + lab + '"' + (i === A.mevcut ? ' aria-current="true"' : "") + '>' + (i + 1) + '</button>';
    }).join("");
    var c = counts(), box = document.getElementById("dn-confirm");
    box.innerHTML = '<p><strong>' + c.ans + '</strong> cevaplı · <strong>' + c.bos + '</strong> boş · <strong>' + c.mk + '</strong> işaretli</p>' +
      (confirm && (c.bos || c.mk) ? '<p class="dn-warn">' + (c.bos ? c.bos + " soru boş. AP'de yanlış cevap puan düşürmez; boş bırakmak yerine tahmin etmek mantıklıdır. " : "") + (c.mk ? "İşaretli sorulara dönmek isteyebilirsin." : "") + '</p>' : '');
  }
  function openNav(confirm) {
    navOpen = true;
    var nav = document.getElementById("dn-nav"); nav.hidden = false;
    document.getElementById("dn-nav-toggle").setAttribute("aria-expanded", "true");
    document.getElementById("dn-nav-title").textContent = confirm ? "Gözden geçir ve teslim et" : "Soru listesi";
    renderNavGrid(confirm);
    var cur = nav.querySelector(".dn-cell.is-current") || nav.querySelector(".dn-cell");
    (confirm ? document.getElementById("dn-submit") : cur).focus();
  }
  function closeNav() {
    navOpen = false;
    var nav = document.getElementById("dn-nav"); if (nav) nav.hidden = true;
    var t = document.getElementById("dn-nav-toggle"); if (t) { t.setAttribute("aria-expanded", "false"); }
  }

  function startTimer() {
    stopTimer();
    warned = A.sureLimitSn ? (A.sureLimitSn - A.gecenSn) <= 300 : true;
    lastTick = Date.now();
    paintTimer();
    timerId = setInterval(tick, 500);
  }
  function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; }
  function tick() {
    if (!A) return;
    var now = Date.now(), dt = (now - lastTick) / 1000; lastTick = now;
    if (dt > 0 && dt < 5) A.gecenSn += dt; // uyku/sekme dondurma sonrası büyük sıçramaları sayma
    sinceSave += dt;
    if (sinceSave >= 5) persist();
    paintTimer();
    if (A.sureLimitSn) {
      var left = A.sureLimitSn - A.gecenSn;
      if (!warned && left <= 300) { warned = true; announce("Son 5 dakika."); }
      if (left <= 0) { A.gecenSn = A.sureLimitSn; submitExam(true); }
    }
  }
  function paintTimer() {
    var el = document.getElementById("dn-timer"); if (!el || !A) return;
    if (A.sureLimitSn) {
      var left = Math.max(0, A.sureLimitSn - A.gecenSn);
      el.textContent = fmtSure(Math.ceil(left));
      el.classList.toggle("is-low", left <= 300);
      el.setAttribute("aria-label", "Kalan süre " + fmtSure(Math.ceil(left)));
    } else {
      el.textContent = fmtSure(A.gecenSn) + " geçti";
      el.setAttribute("aria-label", "Geçen süre " + fmtSure(A.gecenSn));
    }
  }
  window.addEventListener("pagehide", function () { if (A) persist(); });
  document.addEventListener("visibilitychange", function () { if (A && document.visibilityState === "hidden") persist(); if (A) lastTick = Date.now(); });

  function abandonExam() {
    if (!window.confirm("Bu deneme silinsin mi? Cevapların kaydedilmez ve geçmişe eklenmez.")) return;
    stopTimer();
    var d = load(); d.aktif = null; save(d); A = null; navOpen = false;
    document.body.classList.remove("dn-exam-mode");
    renderLanding(); focusH1();
  }

  document.addEventListener("keydown", function (e) {
    if (!A || !document.getElementById("dn-exam")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    var key = e.key;
    if (key === "Escape") { if (navOpen) { e.preventDefault(); closeNav(); document.getElementById("dn-nav-toggle").focus(); } return; }
    if (navOpen && (key === "Enter" || key === " ")) return; // ızgarada düğme etkinleştirme
    var up = (key || "").toUpperCase();
    var map = { "1": "A", "2": "B", "3": "C", "4": "D", "5": "E" };
    var opt = /^[A-E]$/.test(up) ? up : map[key];
    if (opt && !navOpen) {
      var q = BY_KEY[A.sorular[A.mevcut].k];
      if (q.options.some(function (o) { return o.id === opt; })) { e.preventDefault(); choose(opt); }
      return;
    }
    if (key === "ArrowRight") { e.preventDefault(); if (A.mevcut < A.sorular.length - 1) go(A.mevcut + 1); return; }
    if (key === "ArrowLeft") { e.preventDefault(); go(A.mevcut - 1); return; }
    if (key === "Delete" || key === "Backspace") { if (!navOpen && A.cevaplar[A.mevcut]) { e.preventDefault(); choose(null); } return; }
    if (up === "M" && !navOpen) { e.preventDefault(); toggleMark(); return; }
    if (up === "G") { e.preventDefault(); navOpen ? closeNav() : openNav(false); }
  });

  // ======================================================================
  // 4) TESLİM + SONUÇ
  // ======================================================================
  function submitExam(auto) {
    if (!A) return;
    stopTimer(); closeNav();
    var now = new Date().toISOString();
    var dogru = 0, yanlis = 0, bos = 0, uniteler = {}, inceleme = [], perKod = {};
    A.sorular.forEach(function (x, i) {
      var q = BY_KEY[x.k], s = A.cevaplar[i] || null;
      var c = q.options.filter(function (o) { return o.isCorrect; })[0];
      var st = !s ? "bos" : (c && c.id === s ? "dogru" : "yanlis");
      if (st === "dogru") dogru++; else if (st === "yanlis") yanlis++; else bos++;
      var uk = x.kod + "|" + q.unite;
      var u = uniteler[uk] || (uniteler[uk] = { kod: x.kod, unite: q.unite, ad: unitName(x.kod, q.unite), soru: 0, dogru: 0, yanlis: 0, bos: 0 });
      u.soru++; u[st]++;
      var pk = perKod[x.kod] || (perKod[x.kod] = { soru: 0, dogru: 0 }); pk.soru++; if (st === "dogru") pk.dogru++;
      inceleme.push({ k: x.k, kod: x.kod, s: s, m: A.isaretli[i] ? 1 : 0 });
    });
    var n = A.sorular.length, yuzde = n ? Math.round((dogru / n) * 100) : 0;
    var rec = {
      id: A.id, kod: A.kod, ad: A.ad, tarih: now, soruSayisi: n, dogru: dogru, yanlis: yanlis, bos: bos, yuzde: yuzde,
      sureSn: Math.round(A.gecenSn), tahminiBand: karma(A) ? null : bandOf(yuzde),
      uniteler: uniteler, seed: A.seed,
      sureModu: A.sureModu, sureLimitSn: A.sureLimitSn, otomatikTeslim: !!auto, dersler: A.dersler, inceleme: inceleme
    };
    if (A.mod === YKOD) { rec.mod = YKOD; rec.kaynakDeneme = A.kaynakDeneme || null; }
    writeErrors(rec, now);
    var d = load();
    d.aktif = null;
    d.gecmis = [rec].concat(d.gecmis.filter(function (r) { return r.id !== rec.id; })).slice(0, MAX_GECMIS);
    save(d);
    A = null;
    document.body.classList.remove("dn-exam-mode");
    try { history.replaceState(null, "", "deneme.html?sonuc=" + encodeURIComponent(rec.id)); } catch (e) { /* file:// bazı tarayıcılarda */ }
    renderResult(rec, auto);
  }

  /** app.js Yanlışlarım biçimi (handleOptionClick ile aynı alanlar). Doğru cevaplanan açık kayıt çözüldü sayılır. */
  function writeErrors(rec, now) {
    var errors = (window.APMEBERRA && typeof window.APMEBERRA.loadErrors === "function") ? window.APMEBERRA.loadErrors() : sget(ERR_KEY, null);
    if (!errors || typeof errors !== "object" || !errors.items) errors = { v: 1, items: {} };
    var changed = false;
    rec.inceleme.forEach(function (it) {
      if (!it.s) return; // boş bırakılan soru Yanlışlarım’a yazılmaz
      var q = BY_KEY[it.k]; if (!q) return;
      var page = q.sayfa.replace(/\.html?$/i, ""), key = page + "|" + q.id;
      var sel = q.options.filter(function (o) { return o.id === it.s; })[0];
      var cor = q.options.filter(function (o) { return o.isCorrect; })[0];
      if (sel && sel.isCorrect) {
        if (errors.items[key] && !errors.items[key].resolved) { errors.items[key].resolved = true; errors.items[key].resolvedDate = now; changed = true; }
        return;
      }
      var prev = errors.items[key];
      errors.items[key] = {
        id: q.id, page: page, unit: q.kap || q.dizi, unitTitle: q.kapBaslik || q.dizi,
        number: q.number || null, topic: stripHtml(q.topic),
        errorTag: stripHtml(sel && sel.errorTag ? sel.errorTag : "Kavramsal veya işlemsel eksiklik."),
        selected: it.s, correct: cor ? cor.id : "", date: now,
        firstDate: prev ? (prev.firstDate || prev.date) : now,
        count: prev ? (prev.count || 1) + 1 : 1, resolved: false
      };
      changed = true;
    });
    if (changed) sset(ERR_KEY, errors);
  }

  function statusOf(it) {
    var q = BY_KEY[it.k]; if (!q) return "yok";
    if (!it.s) return "bos";
    var c = q.options.filter(function (o) { return o.isCorrect; })[0];
    return c && c.id === it.s ? "dogru" : "yanlis";
  }

  function renderResult(rec, auto) {
    document.title = "Deneme sonucu — " + rec.ad + " | Meberra";
    var units = Object.keys(rec.uniteler).map(function (k) { return rec.uniteler[k]; });
    var kodOrder = rec.dersler || [rec.kod];
    units.sort(function (a, b) {
      return (kodOrder.indexOf(a.kod) - kodOrder.indexOf(b.kod)) || String(a.unite).localeCompare(String(b.unite), "tr", { numeric: true });
    });
    var perKod = {};
    units.forEach(function (u) { var p = perKod[u.kod] || (perKod[u.kod] = { soru: 0, dogru: 0 }); p.soru += u.soru; p.dogru += u.dogru; });
    var bandHtml;
    if (rec.kod === YKOD) {
      // Tur 14 A7: Yanlışlarım oturumu — tahmini bant yerine Yanlışlarım sonucu
      bandHtml = '<div class="dn-band dn-y-sonuc" id="dn-y-sonuc"><div class="dn-band-num is-ok" aria-hidden="true">' + rec.dogru + '</div><div>' +
        '<p class="dn-band-title"><strong>' + rec.dogru + '</strong> hata kapandı · <strong>' + (rec.yanlis + rec.bos) + '</strong> hata açık kaldı</p>' +
        '<p class="dn-band-warn">Doğru çözdüğün sorular Yanlışlarım’da "çözüldü" olarak işaretlendi. Yine yanlış yaptıkların ve boş bıraktıkların açık kalır; konu hatırlatmasını okuyup tekrar dene.</p></div></div>';
    } else if (rec.kod !== "genel") {
      // Bant sayısı ve eşikler skorBandi() grafiğinde; burada yalnız kısa uyarı kalır
      bandHtml = '<p class="dn-band-warn dn-skor-not"><strong>Tahmini — resmi ölçekleme değildir; yalnız MCQ.</strong> Gerçek AP puanı FRQ bölümünü de içerir ve ölçek her yıl değişir.</p>';
    } else {
      bandHtml = '<div class="dn-band"><div><p class="dn-band-title">Ders bazında tahmini bant <span class="dn-tag">yaklaşık</span></p><ul class="dn-band-list">' +
        Object.keys(perKod).map(function (k) { var p = perKod[k], y = Math.round(p.dogru / p.soru * 100); return '<li><span style="--dn-c:' + colorVar(k) + '" class="dn-kdot"></span>' + esc(BANK.kodlar[k] ? BANK.kodlar[k].ad : k) + ': %' + y + ' → ' + bandOf(y) + ' <small>(' + p.soru + ' soru)</small></li>'; }).join("") +
        '</ul><p class="dn-band-warn"><strong>Tahmini — resmi ölçekleme değildir; yalnız MCQ.</strong> Az soruyla ders bandı çok oynaktır. Eşikler: %72+ → 5, %58+ → 4, %44+ → 3, %30+ → 2.</p></div></div>';
    }
    var rows = units.map(function (u) {
      var y = u.soru ? Math.round(u.dogru / u.soru * 100) : 0;
      var q0 = null;
      for (var i = 0; i < rec.inceleme.length; i++) { var qq = BY_KEY[rec.inceleme[i].k]; if (qq && rec.inceleme[i].kod === u.kod && qq.unite === u.unite) { q0 = qq; break; } }
      var link = q0 && q0.kap ? '<a href="' + esc(q0.sayfa) + '#' + esc(q0.kap) + '">Ders sayfası</a>' : (q0 ? '<a href="' + esc(q0.sayfa) + '">Ders sayfası</a>' : '');
      return '<tr><th scope="row">' + (karma(rec) ? '<span class="dn-kdot" style="--dn-c:' + colorVar(u.kod) + '"></span>' : '') + esc(unitLabel(u.kod, u.unite)) + ' <span class="dn-uname">' + esc(String(u.ad).replace(/^Micro · |^Macro · |^Skill Cat\. \d — /, "")) + '</span></th>' +
        '<td>' + u.soru + '</td><td>' + u.dogru + '</td><td>' + u.yanlis + '</td><td>' + u.bos + '</td>' +
        '<td><span class="dn-pct ' + (y >= 75 ? "is-ok" : y >= 50 ? "is-mid" : "is-bad") + '">%' + y + '</span></td><td>' + link + '</td></tr>';
    }).join("");

    view.innerHTML =
      '<p class="dn-back"><a href="deneme.html">← Tüm denemeler</a></p>' +
      '<header class="page-head" style="--dn-c:' + colorVar(rec.kod) + '">' +
      '<span class="eyebrow">Deneme sonucu</span>' +
      '<h1 tabindex="-1" id="dn-h1">' + esc(rec.ad) + '</h1>' +
      '<p>' + esc(fmtTarih(rec.tarih)) + ' · ' + (rec.sureModu === "tempo" ? "sınav temposu" : "süresiz") + ' · tohum (seed) <code>' + rec.seed + '</code></p>' +
      '</header>' +
      (auto ? '<div class="dn-alert is-warn" role="status">Süre doldu; deneme otomatik teslim edildi.</div>' : '') +
      '<section class="dn-stats" aria-label="Özet">' +
      stat("Doğru", rec.dogru, "is-ok") + stat("Yanlış", rec.yanlis, "is-bad") + stat("Boş", rec.bos, "") +
      stat("Başarı", "%" + rec.yuzde, "") + stat("Geçen süre", fmtSure(rec.sureSn) + (rec.sureLimitSn ? ' <small>/ ' + fmtSure(rec.sureLimitSn) + '</small>' : ''), "") +
      '</section>' +
      (rec.kod !== YKOD && rec.kod !== "genel" ? skorBandi(rec.yuzde, rec.tahminiBand) : "") +
      sonucEylemleri(rec, units) +
      bandHtml +
      '<section class="dn-section" aria-labelledby="dn-ut-title"><h2 class="panel-title" id="dn-ut-title">Ünite bazında</h2>' +
      uniteGrafik(units, rec) +
      '<div class="dn-table-wrap"><table class="dn-table"><thead><tr><th scope="col">Ünite</th><th scope="col">Soru</th><th scope="col">Doğru</th><th scope="col">Yanlış</th><th scope="col">Boş</th><th scope="col">%</th><th scope="col"><span class="visually-hidden">Bağlantı</span></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (rec.kod === YKOD ? '<p class="dn-note">Doğru çözdüğün hatalar kapandı; yanlışlar ve boşlar Yanlışlarım’da açık kaldı (<a href="ilerleme.html#hata-title">İlerleme → Yanlışlarım</a>).</p>'
        : '<p class="dn-note">Yanlış cevapladığın sorular Yanlışlarım’a eklendi (<a href="ilerleme.html">İlerleme → Yanlışlarım</a>). Boş bıraktıkların eklenmez.</p>') +
      '</section>' +
      '<section class="dn-section" aria-labelledby="dn-rev-title"><h2 class="panel-title" id="dn-rev-title">Soru soru inceleme</h2>' +
      '<div class="dn-filter" role="group" aria-label="İnceleme filtresi">' +
      ['tumu:Tümü', 'yanlis:Yanlış', 'bos:Boş', 'isaretli:İşaretli', 'dogru:Doğru'].map(function (s, i) { var p = s.split(":"); return '<button type="button" class="chip" data-f="' + p[0] + '" aria-pressed="' + (i === 0 ? "true" : "false") + '">' + p[1] + '</button>'; }).join("") +
      '</div><div class="dn-review" id="dn-review"></div></section>' +
      '<div class="dn-actions dn-result-actions">' + (rec.kod === YKOD ? '<a class="btn-secondary" href="deneme.html?mod=yanlislar">Yanlışlarıma dön</a>'
        : '<a class="btn-secondary" href="deneme.html?ders=' + encodeURIComponent(rec.kod) + '">Yeni deneme kur</a>') + '<a class="btn-ghost" href="deneme.html">Tüm denemeler</a></div>';

    renderReview(rec, "tumu");
    var inc = document.getElementById("dn-se-incele");
    if (inc) inc.addEventListener("click", function () { var h = document.getElementById("dn-rev-title"); h.setAttribute("tabindex", "-1"); h.scrollIntoView({ block: "start" }); h.focus({ preventScroll: true }); });
    view.querySelector(".dn-filter").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-f]"); if (!b) return;
      view.querySelectorAll(".dn-filter .chip").forEach(function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
      renderReview(rec, b.getAttribute("data-f"));
    });
    focusH1();
    announce("Deneme teslim edildi. " + rec.dogru + " doğru, " + rec.yanlis + " yanlış, " + rec.bos + " boş.");
  }
  /**
   * Tur 14 A7 (plan §2.3-E): sonuç ekranı eylemleri — tek birincil "Yanlış N soruyu şimdi çöz" (Yanlışlarım modu; bu denemenin hâlâ
   * açık yanlışları, yoksa tüm açık hatalar), ikincil "Konu anlatımına dön" (en zayıf ünitenin anlatımı: <ders>.html#konu-<soru kabı>),
   * üçüncül "Bugün'e dön" ve "Soru soru incele".
   */
  function sonucEylemleri(rec, units) {
    var h = yanlisHavuzu(), bu = yanlisAnahtarlari(rec);
    var buAcik = rec.kod === YKOD ? 0 : h.havuz.filter(function (x) { return bu[qKey(x.q)]; }).length;
    var yl = buAcik ? { href: "deneme.html?mod=yanlislar&deneme=" + encodeURIComponent(rec.id), t: "Yanlış " + buAcik + " soruyu şimdi çöz" }
      : (h.havuz.length ? { href: "deneme.html?mod=yanlislar", t: "Yanlışlarımı tekrar çöz (" + h.havuz.length + ")" } : null);
    // En zayıf ünite: yanlış ya da boşu olan, doğru oranı en düşük ünite (eşitlikte tablo sırası); hepsi doğruysa ilk ünite
    var zayif = null;
    units.forEach(function (u) { if (u.yanlis + u.bos > 0 && (!zayif || u.dogru / u.soru < zayif.dogru / zayif.soru)) zayif = u; });
    var hedef = zayif || units[0], q0 = null;
    if (hedef) for (var i = 0; i < rec.inceleme.length; i++) { var qq = BY_KEY[rec.inceleme[i].k]; if (qq && rec.inceleme[i].kod === hedef.kod && qq.unite === hedef.unite) { q0 = qq; break; } }
    var konu = q0 ? { href: q0.sayfa + (q0.kap ? "#konu-" + q0.kap : ""), t: zayif ? "Konu anlatımı: " + unitLabel(hedef.kod, hedef.unite) + " " + String(hedef.ad).replace(/^Micro · |^Macro · |^Skill Cat. d — /, "") : "Konu anlatımına dön" } : null;
    return '<section class="dn-sonuc-eylem" aria-label="Sonraki adım">' +
      (yl ? '<a class="btn-primary" data-eylem="yanlislar" href="' + esc(yl.href) + '">' + IC_Y.redo + '<span>' + esc(yl.t) + '</span></a>'
        : '<p class="dn-se-not" data-eylem="yanlislar-yok">' + IC_Y.ok + '<span>Açık hatan kalmadı.</span></p>') +
      (konu ? '<a class="btn-secondary" data-eylem="konu" href="' + esc(konu.href) + '"' + (zayif ? ' title="Bu denemede en düşük oranlı ünite"' : '') + '>' + IC_Y.book + '<span>' + esc(konu.t) + '</span></a>' : '') +
      '<a class="btn-ghost" data-eylem="bugun" href="index.html">' + IC_Y.home + '<span>Bugün’e dön</span></a>' +
      '<button type="button" class="dn-se-incele" id="dn-se-incele">Soru soru incele ↓</button>' +
      '</section>';
  }
  /**
   * Sonuç: animasyonlu skor bandı (tek dizi, sıralı tek ton: 1 açık → 5 koyu). Eşik çizgileri BAND_ESIK ile aynı;
   * işaretçi başarı yüzdesinde. Metin etiketli (renk tek başına anlam taşımaz); tablo karşılığı aşağıdaki ünite tablosu.
   */
  function skorBandi(yuzde, band) {
    var esik = BAND_ESIK.slice().reverse(); // 1..5
    var seg = esik.map(function (e, i) {
      var bas = e.min, son = i < esik.length - 1 ? esik[i + 1].min : 100;
      return '<span class="dn-sb-seg' + (e.band === band ? " is-on" : "") + '" style="--sb-l:' + bas + '%;--sb-w:' + (son - bas) + '%;--sb-i:' + i + '" title="Bant ' + e.band + ': %' + bas + "–" + son + '"><b>' + e.band + '</b></span>';
    }).join("");
    var y = Math.max(0, Math.min(100, yuzde));
    return '<section class="dn-skor" aria-label="Tahmini AP bandı ' + band + ', başarı yüzde ' + y + '">' +
      '<div class="dn-skor-bas"><span class="dn-skor-band" aria-hidden="true">' + band + '</span><div><p class="dn-skor-baslik">Tahmini bant <strong>' + band + '</strong> <span class="dn-tag">yaklaşık</span></p><p class="dn-skor-alt">MCQ başarın %' + y + ' · eşikler %30 / %44 / %58 / %72</p></div></div>' +
      '<div class="dn-sb" aria-hidden="true"><div class="dn-sb-ray">' + seg + '</div>' +
      '<span class="dn-sb-isaret" style="--sb-x:' + y + '%"><span class="dn-sb-deger">%' + y + '</span></span>' +
      '<div class="dn-sb-eksen"><span>0</span><span style="left:30%">30</span><span style="left:44%">44</span><span style="left:58%">58</span><span style="left:72%">72</span><span style="left:100%">100</span></div></div>' +
      '</section>';
  }
  /** Sonuç: ünite başarı çubukları (yatay, tek dizi; değer doğrudan etiketli, ayrıntı tabloda). */
  function uniteGrafik(units, rec) {
    if (!units.length) return "";
    return '<div class="dn-ug" role="img" aria-label="Ünite bazında başarı yüzdeleri: ' + esc(units.map(function (u) { return unitLabel(u.kod, u.unite) + " %" + (u.soru ? Math.round(u.dogru / u.soru * 100) : 0); }).join(", ")) + '">' +
      units.map(function (u, i) {
        var y = u.soru ? Math.round(u.dogru / u.soru * 100) : 0;
        return '<div class="dn-ug-satir" title="' + esc(unitLabel(u.kod, u.unite) + ": " + u.dogru + "/" + u.soru + " doğru (%" + y + ")") + '">' +
          '<span class="dn-ug-ad">' + (karma(rec) ? '<span class="dn-kdot" style="--dn-c:' + colorVar(u.kod) + '"></span>' : "") + esc(unitLabel(u.kod, u.unite)) + '</span>' +
          '<span class="dn-ug-ray"><span class="dn-ug-dolgu' + (y >= 75 ? " is-ok" : y >= 50 ? " is-mid" : " is-bad") + '" style="--ug-w:' + y + '%;--ug-i:' + i + '"></span></span>' +
          '<span class="dn-ug-deger">%' + y + '</span></div>';
      }).join("") + '</div>';
  }
  function stat(label, val, cls) { return '<div class="dn-stat ' + cls + '"><span class="dn-stat-label">' + label + '</span><span class="dn-stat-val">' + val + '</span></div>'; }

  function renderReview(rec, filter) {
    var box = document.getElementById("dn-review");
    var items = rec.inceleme.map(function (it, i) { return { it: it, i: i, st: statusOf(it) }; }).filter(function (x) {
      if (x.st === "yok") return filter === "tumu";
      if (filter === "tumu") return true;
      if (filter === "isaretli") return !!x.it.m;
      return x.st === filter;
    });
    if (!items.length) { box.innerHTML = '<p class="dn-note">Bu filtrede soru yok.</p>'; return; }
    var lbl = { dogru: "Doğru", yanlis: "Yanlış", bos: "Boş", yok: "Soru artık bankada yok" };
    box.innerHTML = items.map(function (x) {
      var q = BY_KEY[x.it.k];
      if (!q) return '<div class="dn-rev is-yok"><p>Soru ' + (x.i + 1) + ': bu soru ders sayfasından kaldırılmış (' + esc(x.it.k) + ').</p></div>';
      return '<details class="dn-rev is-' + x.st + '" data-i="' + x.i + '"><summary>' +
        '<span class="dn-rev-num">Soru ' + (x.i + 1) + '</span>' +
        '<span class="dn-rev-st">' + lbl[x.st] + (x.it.m ? ' · ★' : '') + '</span>' +
        '<span class="dn-rev-topic">' + esc(stripHtml(q.topic)) + '</span></summary><div class="dn-rev-body"></div></details>';
    }).join("");
    box.querySelectorAll("details.dn-rev").forEach(function (det) {
      det.addEventListener("toggle", function () {
        if (!det.open) return;
        var body = det.querySelector(".dn-rev-body");
        if (body.getAttribute("data-filled")) return;
        body.innerHTML = reviewBody(rec.inceleme[Number(det.getAttribute("data-i"))]);
        body.setAttribute("data-filled", "1");
        typeset(body);
      });
    });
  }

  function reviewBody(it) {
    var q = BY_KEY[it.k], sel = it.s;
    var cor = q.options.filter(function (o) { return o.isCorrect; })[0];
    var selOpt = sel ? q.options.filter(function (o) { return o.id === sel; })[0] : null;
    var pas = q.pasaj && BANK.pasajlar[q.pasaj];
    var opts = '<ol class="dn-rev-opts">' + q.options.map(function (o) {
      var cls = o.isCorrect ? " is-correct" : (o.id === sel ? " is-chosen" : "");
      var mark = o.isCorrect && o.id === sel ? "Doğru — senin cevabın" : o.isCorrect ? "Doğru cevap" : o.id === sel ? "Senin cevabın" : "";
      return '<li class="' + cls.trim() + '"><span class="option-letter" aria-hidden="true">' + esc(o.id) + '</span><span class="visually-hidden">Şık ' + esc(o.id) + ': </span><span class="dn-rev-otext">' + o.text + '</span>' + (mark ? '<span class="dn-rev-mark">' + mark + '</span>' : '') + '</li>';
    }).join("") + '</ol>';
    var info = '<p class="dn-rev-meta"><span class="question-tag source">' + esc(q.source) + '</span> <span class="question-tag ' + esc(String(q.difficulty).toLowerCase()) + '">' + esc(q.difficulty) + '</span></p>';
    var answerLine = '<p class="dn-rev-ans">Seçtiğin: <strong>' + (sel || "boş") + '</strong> · Doğru: <strong>' + (cor ? cor.id : "?") + '</strong></p>';
    var rem = "";
    if (selOpt && !selOpt.isCorrect) {
      rem = '<div class="remediation-panel"><div class="remediation-title">Düştüğün çeldirici: ' + (selOpt.errorTag || "") + '</div><div class="remediation-text">' + (selOpt.remediation || q.generalRemediation || "") + '</div></div>';
    } else if (!sel && q.generalRemediation) {
      rem = '<div class="remediation-panel"><div class="remediation-title">Konu hatırlatması</div><div class="remediation-text">' + q.generalRemediation + '</div></div>';
    }
    var sol = '<div class="solution-panel"><div class="solution-title">Adım adım çözüm (Step-by-step Solution)</div><div class="solution-steps">' + (q.stepByStepSolution || "") + '</div></div>';
    var links = '<p class="dn-rev-links"><a href="' + esc(q.sayfa) + '#q-card-' + encodeURIComponent(q.id) + '">Ders sayfasında bu soru →</a>' +
      (q.kap ? ' <a href="' + esc(q.sayfa) + '#' + esc(q.kap) + '">' + esc(q.kapBaslik || "Ünite") + ' →</a>' : '') + '</p>';
    return info + (pas ? '<details class="dn-rev-pas"><summary>' + esc(pas.baslik) + '</summary><div class="dn-passage-body">' + pas.html + '</div></details>' : '') +
      '<div class="question-body">' + q.question + '</div>' + opts + answerLine + rem + sol + links;
  }

  // ======================================================================
  // 5) GEÇMİŞ + MİNİ GRAFİK
  // ======================================================================
  function renderHistory(d) {
    if (!d.gecmis.length) {
      return '<section class="dn-section" aria-labelledby="dn-hist-title"><h2 class="panel-title" id="dn-hist-title">Geçmiş</h2><p class="dn-note">Henüz tamamlanmış deneme yok. Sonuçların burada ve ders bazında gelişim grafiğinde görünecek.</p></section>';
    }
    var kods = [];
    d.gecmis.forEach(function (r) { if (kods.indexOf(r.kod) < 0) kods.push(r.kod); });
    var sparks = kods.map(function (k) {
      var list = d.gecmis.filter(function (r) { return r.kod === k; });
      var ad = kodAd(k);
      return '<div class="dn-spark-card" style="--dn-c:' + colorVar(k) + '"><div class="dn-spark-head"><span>' + esc(ad) + '</span><strong>%' + list[0].yuzde + '</strong></div>' +
        '<div class="dn-spark" data-kod="' + esc(k) + '"></div><p class="dn-spark-sub">' + list.length + ' deneme' + (list.length > 1 ? ' · ilk %' + list[list.length - 1].yuzde : '') + '</p></div>';
    }).join("");
    var rows = d.gecmis.slice(0, 15).map(function (r) {
      return '<tr><td>' + esc(fmtTarih(r.tarih)) + '</td><th scope="row"><span class="dn-kdot" style="--dn-c:' + colorVar(r.kod) + '"></span>' + esc(r.ad) + '</th>' +
        '<td>' + r.dogru + '/' + r.soruSayisi + '</td><td>%' + r.yuzde + '</td><td>' + (r.tahminiBand == null ? "—" : r.tahminiBand + '<small> (yakl.)</small>') + '</td><td>' + fmtSure(r.sureSn) + '</td>' +
        '<td><button type="button" class="btn-ghost dn-mini" data-open="' + esc(r.id) + '">İncele</button></td></tr>';
    }).join("");
    return '<section class="dn-section" aria-labelledby="dn-hist-title"><h2 class="panel-title" id="dn-hist-title">Geçmiş</h2>' +
      '<div class="dn-sparks">' + sparks + '</div>' +
      '<div class="dn-table-wrap"><table class="dn-table dn-hist"><thead><tr><th scope="col">Tarih</th><th scope="col">Deneme</th><th scope="col">Doğru</th><th scope="col">%</th><th scope="col">Bant</th><th scope="col">Süre</th><th scope="col"><span class="visually-hidden">İşlem</span></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="dn-note">Son ' + Math.min(d.gecmis.length, 15) + ' deneme gösteriliyor; en fazla ' + MAX_GECMIS + ' kayıt tutulur. Bant sütunu tahminidir, resmi ölçekleme değildir.</p></section>';
  }
  function bindHistory() {
    view.querySelectorAll("button[data-open]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-open"), rec = load().gecmis.filter(function (r) { return r.id === id; })[0];
        if (!rec) return;
        try { history.pushState(null, "", "deneme.html?sonuc=" + encodeURIComponent(id)); } catch (e) { /* yok say */ }
        renderResult(rec, false); window.scrollTo(0, 0);
      });
    });
  }
  function drawSparks(d) {
    view.querySelectorAll(".dn-spark[data-kod]").forEach(function (el) {
      var k = el.getAttribute("data-kod");
      var list = d.gecmis.filter(function (r) { return r.kod === k; }).slice(0, 12).reverse();
      var W = 200, H = 48, pad = 4;
      var pts = list.map(function (r, i) {
        var x = list.length === 1 ? W / 2 : pad + i * (W - 2 * pad) / (list.length - 1);
        var y = H - pad - (r.yuzde / 100) * (H - 2 * pad);
        return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
      });
      var desc = "Başarı yüzdesi gelişimi: " + list.map(function (r) { return "%" + r.yuzde; }).join(", ");
      el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="dn-spark-svg" role="img" aria-label="' + esc(desc) + '" preserveAspectRatio="none">' +
        '<line x1="0" x2="' + W + '" y1="' + (H - pad - 0.5 * (H - 2 * pad)) + '" y2="' + (H - pad - 0.5 * (H - 2 * pad)) + '" class="dn-spark-mid"/>' +
        (pts.length > 1 ? '<polyline points="' + pts.map(function (p) { return p.join(","); }).join(" ") + '" class="dn-spark-line"/>' : '') +
        pts.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" class="dn-spark-dot"/>'; }).join("") +
        '</svg>';
    });
  }

  // ======================================================================
  // BAŞLAT
  // ======================================================================
  function boot() {
    var d = load();
    var mod = param("mod");
    if (d.aktif && Array.isArray(d.aktif.sorular) && d.aktif.sorular.length) {
      renderExam(d.aktif);
      // Tur 14 A7: Yanlışlarım istenip başka bir deneme yarımsa önce o deneme (tek aktif deneme kuralı)
      if (mod === YKOD && d.aktif.mod !== YKOD && A) {
        var ex = document.getElementById("dn-exam");
        if (ex) ex.insertAdjacentHTML("afterbegin", '<div class="dn-alert is-warn" role="status" id="dn-y-once">Yanlışlarım oturumu için önce yarım kalan bu denemeyi teslim et ya da iptal et.</div>');
      }
      announce("Devam eden deneme kaldığı yerden sürüyor."); return;
    }
    if (mod === YKOD) { renderYanlislar({ ders: param("ders"), deneme: param("deneme") }); return; }
    var sonuc = param("sonuc");
    if (sonuc) {
      var rec = d.gecmis.filter(function (r) { return r.id === sonuc; })[0];
      if (rec) { renderResult(rec, false); return; }
    }
    var ders = param("ders");
    if (ders === "genel" || (ders && BANK.kodlar[ders])) { renderSetup(ders); return; }
    renderLanding();
    if (ders) announce("Bilinmeyen deneme kodu: " + ders);
  }
  window.addEventListener("popstate", function () { if (!A) boot(); });
  // Üyelik /api/me ile tazelenip premium durumu değişince (app.js apUyelikDegisti) sınav dışındaki ekran yeniden çizilir
  window.addEventListener("meberra:uyelik", function () { if (!A && !param("sonuc")) boot(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  // Test/diğer sayfalar için salt-okunur API
  window.APMEBERRA_DENEME = { KEY: KEY, load: load, tempoSn: tempoSn, bandOf: bandOf, selectQuestions: selectQuestions, TEMPO: TEMPO };
})();
