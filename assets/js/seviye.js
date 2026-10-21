/**
 * Meberra — Seviye Testi + Sınav Hazırlık Raporu (Ajan 11 — Frontend & UX)
 *
 * Veri:  GET /api/seviye/bankalar → window.APMEBERRA_SEVIYE[ders] (v1.5.0: ünite meta verisi + sorular, doğru şık / çözüm YOK)
 *        POST /api/seviye/teslim → sunucu cevapları kontrol eder, çözümleri döner; POST /api/seviye/cozumler → eski raporun çözümleri
 *        (ünite meta verisi herkese açık data/sorular/seviye/<ders>.js dosyalarında da durur; sorular yalnız veritabanında)
 *        data/mevzuat/sinav-takvimi.js → window.APMEBERRA_TAKVIM          (salt okunur)
 * Depo:  localStorage "apmeberra:seviye:v1" (apmeberra: önekli → sunucu senkronu kapsar)
 *        { v:1, devam:{...}|null, raporlar:[en yeni önce, en fazla 5], kontrol:{gereklilikId:{c,t}} }
 *
 * file:// altında fetch çalışmadığı için banka dosyaları <script src> ile yüklenir;
 * yüklenemeyen dosya hata vermez, ders "henüz hazır değil" görünür.
 * _ornek.js yalnızca URL'de ?ornek=1 varken yüklenir.
 */
(function () {
  "use strict";

  // ------------------------------------------------------------------------
  // 1. SABİTLER
  // ------------------------------------------------------------------------
  var KEY = "apmeberra:seviye:v1";
  var MAX_RAPOR = 5;
  var DERSLER = [
    { key: "calculus-ab", dosya: "calculus.js", ad: "AP Calculus AB", cls: "c-calculus", grup: "calculus" },
    { key: "calculus-bc", dosya: "calculus.js", ad: "AP Calculus BC", cls: "c-calculus", grup: "calculus" },
    { key: "physics-1", dosya: "physics-1.js", ad: "AP Physics 1", cls: "c-physics" },
    { key: "chemistry", dosya: "chemistry.js", ad: "AP Chemistry", cls: "c-chemistry" },
    { key: "biology", dosya: "biology.js", ad: "AP Biology", cls: "c-biology" },
    { key: "english-language", dosya: "english-language.js", ad: "AP English Language and Composition", cls: "c-english" }
  ];
  var ORNEK = { key: "_ornek", dosya: "_ornek.js", ad: "ÖRNEK Ders", cls: "c-electives", ornek: true };
  var AGIRLIK = { easy: 1, medium: 1.5, hard: 2 };
  var ZORLUK_TR = { easy: "Kolay", medium: "Orta", hard: "Zor" };
  var VARSAYIM = { kirmizi: 10, sari: 5, yesil: 1.5, deneme: 4, denemeSaat: 3.5, tampon: 2 };
  var SAAT = { min: 5, max: 18, varsayilan: 15, tavan: 18 };
  var BANT = {
    kirmizi: { ad: "Kırmızı", cls: "zone-red", sira: 0 },
    sari: { ad: "Sarı", cls: "zone-yellow", sira: 1 },
    yesil: { ad: "Yeşil", cls: "zone-green", sira: 2 }
  };
  var SONUC = {
    yetisir: { etiket: "Mevcut tempoyla yetişir", cls: "is-ok", karar: "Kaydol" },
    siki: { etiket: "Sıkı ama mümkün", cls: "is-warn", karar: "Kaydol, yoğun plan gerekir" },
    yetismez: { etiket: "Bu tempoyla yetişmez", cls: "is-bad", karar: "Bu yıl ertelemeyi değerlendir" },
    tarihyok: { etiket: "Tarih doğrulanmadı — hesaplanamadı", cls: "is-none", karar: "Karar için sınav tarihi bekleniyor" }
  };
  var NE_ZAMAN_SIRA = ["hemen", "kayit-oncesi", "sinav-oncesi", "sinav-gunu", "sinav-sonrasi", "diger"];
  var NE_ZAMAN_AD = { "hemen": "Hemen", "kayit-oncesi": "Kayıttan önce", "sinav-oncesi": "Sınavdan önce", "sinav-gunu": "Sınav günü", "sinav-sonrasi": "Sınavdan sonra", "diger": "Diğer" };
  var UYARI ="Bu rapor AP puanı tahmini değildir; kısa bir tanı testine dayanan bir planlama aracıdır. Kayıt kararını öğretmeninle birlikte ver.";

  // ------------------------------------------------------------------------
  // 2. SAF HESAP FONKSİYONLARI (testlerden de çağrılır)
  // ------------------------------------------------------------------------
  function bant(oran) { return oran < 50 ? "kirmizi" : oran < 75 ? "sari" : "yesil"; }
  function yuvarla(x, d) { var m = Math.pow(10, d || 0); return Math.round(x * m) / m; }

  /** Tarih dizesinden (YYYY-AA-GG) yerel gün başı. Geçersizse null. */
  function gunTarihi(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  /** Bugünden hedef güne kalan tam gün (yaz saatinden etkilenmez). Hedef yoksa null. */
  function gunFarki(hedefIso, bugun) {
    var h = gunTarihi(hedefIso);
    if (!h) return null;
    var b = bugun || new Date();
    return Math.round((Date.UTC(h.getFullYear(), h.getMonth(), h.getDate()) - Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) / 864e5);
  }

  /** Bir dersin cevaplarını puanlar. cevaplar: {soruId: "A" | null(atlandı)} */
  function puanla(banka, cevaplar) {
    cevaplar = cevaplar || {};
    var uniteler = (banka.uniteler || []).map(function (u) {
      return { no: String(u.no), ad: u.ad, sinavAgirligi: u.sinavAgirligi == null ? null : u.sinavAgirligi, portaldaVar: !!u.portaldaVar, portalCapa: u.portalCapa || null, puan: 0, max: 0, n: 0, dogru: 0, yanlis: 0, cevapsiz: 0 };
    });
    var byNo = {};
    uniteler.forEach(function (u) { byNo[u.no] = u; });
    var liste = { yanlis: [], cevapsiz: [] };
    (banka.sorular || []).forEach(function (q) {
      var u = byNo[String(q.unite)];
      if (!u) return;
      var w = AGIRLIK[q.zorluk] || 1;
      u.max += w; u.n++;
      var sec = cevaplar[q.id];
      var dogru = (q.options || []).filter(function (o) { return o.isCorrect; })[0];
      if (sec === undefined || sec === null || sec === "") { u.cevapsiz++; liste.cevapsiz.push(q.id); }
      else if (dogru && sec === dogru.id) { u.dogru++; u.puan += w; }
      else { u.yanlis++; liste.yanlis.push(q.id); }
    });
    var t = { puan: 0, max: 0, n: 0, dogru: 0, yanlis: 0, cevapsiz: 0 };
    uniteler.forEach(function (u) {
      u.skor = u.max > 0 ? u.puan / u.max * 100 : 0;
      u.bant = bant(u.skor);
      ["puan", "max", "n", "dogru", "yanlis", "cevapsiz"].forEach(function (k) { t[k] += u[k]; });
    });
    t.skor = t.max > 0 ? t.puan / t.max * 100 : 0;
    t.bant = bant(t.skor);
    t.uniteler = uniteler.filter(function (u) { return u.n > 0; });
    t.liste = liste;
    return t;
  }

  /**
   * Zaman fizibilitesi.
   * dersler: [{ders, ad, uniteler:[{bant}]}]; opts: {bugun, takvim, haftalikSaat, varsayim}
   */
  function fizibilite(dersler, opts) {
    var v = Object.assign({}, VARSAYIM, opts.varsayim || {});
    var hs = Number(opts.haftalikSaat) || SAAT.varsayilan;
    var n = dersler.length || 1;
    var dersSaat = hs / n;
    var sinavlar = (opts.takvim && opts.takvim.sinavlar) || {};
    var out = dersler.map(function (d) {
      var uSaat = 0, bantSay = { kirmizi: 0, sari: 0, yesil: 0 };
      d.uniteler.forEach(function (u) { bantSay[u.bant]++; uSaat += u.bant === "kirmizi" ? v.kirmizi : u.bant === "sari" ? v.sari : v.yesil; });
      var dSaat = v.deneme * v.denemeSaat;
      var gereken = uSaat + dSaat;
      var s = sinavlar[d.ders] || null;
      var tarih = s && s.tarih ? s.tarih : null;
      var r = { ders: d.ders, ad: d.ad, tarih: tarih, kaynak: s ? s.kaynak : null, bantSay: bantSay, uniteSaat: uSaat, denemeSaat: dSaat, gereken: gereken, dersSaat: dersSaat };
      var kalanGun = tarih ? gunFarki(tarih, opts.bugun) : null;
      if (kalanGun === null) {
        r.durum = "tarihyok"; r.kalanGun = null; r.kalanHafta = null; r.kullanilabilirHafta = null; r.kullanilabilir = null; r.oran = null;
        return r;
      }
      r.kalanGun = kalanGun;
      r.kalanHafta = Math.max(0, Math.floor(kalanGun / 7));
      r.kullanilabilirHafta = Math.max(0, r.kalanHafta - v.tampon);
      r.kullanilabilir = r.kullanilabilirHafta * dersSaat;
      r.oran = r.kullanilabilir > 0 ? gereken / r.kullanilabilir : Infinity;
      r.durum = gereken <= r.kullanilabilir ? "yetisir" : gereken <= r.kullanilabilir * 1.2 ? "siki" : "yetismez";
      r.haftalikGereken = r.kullanilabilirHafta > 0 ? gereken / r.kullanilabilirHafta : Infinity;
      return r;
    });
    var tarihli = out.filter(function (r) { return r.durum !== "tarihyok"; });
    var toplam = {
      gereken: out.reduce(function (s, r) { return s + r.gereken; }, 0),
      gerekenTarihli: tarihli.reduce(function (s, r) { return s + r.gereken; }, 0),
      kullanilabilir: tarihli.reduce(function (s, r) { return s + r.kullanilabilir; }, 0),
      haftalikGereken: tarihli.reduce(function (s, r) { return s + r.haftalikGereken; }, 0),
      tarihsiz: out.length - tarihli.length
    };
    // Tarihi doğrulanmamış derslerin haftalık payı tavan hesabına "ayrılmış saat" olarak eklenir (uydurma tarih yok).
    toplam.haftalikToplam = toplam.haftalikGereken + toplam.tarihsiz * dersSaat;
    toplam.tavanAsildi = toplam.haftalikToplam > SAAT.tavan;
    return { dersler: out, toplam: toplam, varsayim: v, haftalikSaat: hs, dersSaat: dersSaat };
  }

  /** "10–12%" → 11; sayı yoksa null. */
  function agirlikSayi(s) {
    if (s == null) return null;
    var m = String(s).match(/\d+(?:[.,]\d+)?/g);
    if (!m) return null;
    var nums = m.map(function (x) { return parseFloat(x.replace(",", ".")); });
    return nums.reduce(function (a, b) { return a + b; }, 0) / nums.length;
  }

  /** Kırmızı + sarı üniteler, ağırlık × açık oranına göre (büyükten küçüğe). */
  function oncelikListesi(rapor) {
    var out = [];
    rapor.dersler.forEach(function (key) {
      var s = rapor.sonuclar[key];
      if (!s) return;
      var esit = s.uniteler.length ? 100 / s.uniteler.length : 0;
      s.uniteler.forEach(function (u) {
        if (u.bant === "yesil") return;
        var a = agirlikSayi(u.sinavAgirligi);
        var w = a === null ? esit : a;
        out.push({ ders: key, dersAd: s.ad, portalSayfasi: s.portalSayfasi, unite: u, agirlik: w, agirlikTahmini: a === null, acik: 1 - u.skor / 100, puan: w * (1 - u.skor / 100) });
      });
    });
    return out.sort(function (a, b) { return b.puan - a.puan || a.unite.skor - b.unite.skor; });
  }

  // ------------------------------------------------------------------------
  // 3. YARDIMCILAR
  // ------------------------------------------------------------------------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }
  function $(id) { return document.getElementById(id); }
  function fmtGun(d) {
    try { return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return String(d); }
  }
  function fmtIsoGun(iso) { var d = gunTarihi(iso); return d ? fmtGun(d) : "—"; }
  function fmtZaman(iso) {
    try { return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { return iso || ""; }
  }
  function fmtSaat(x) {
    if (x === null || x === undefined) return "—";
    if (!isFinite(x)) return "∞";
    return yuvarla(x, 1).toLocaleString("tr-TR") + " sa";
  }
  function fmtSure(sn) {
    sn = Math.max(0, Math.round(sn));
    var m = Math.floor(sn / 60), s = sn % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }
  function pct(x) { return "%" + Math.round(x); }
  function bantHtml(b, ek) {
    var B = BANT[b];
    return B ? '<span class="zone ' + B.cls + '">' + B.ad + (ek ? " · " + ek : "") + "</span>" : '<span class="zone zone-none">—</span>';
  }
  function kaynakHtml(k) {
    if (!k) return "";
    var url = typeof k === "string" ? k : k.url;
    var ad = typeof k === "string" ? k : (k.ad || k.url);
    if (!url || !/^https?:\/\//.test(url)) return ad ? esc(ad) : "";
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(ad) + "</a>";
  }
  var ICON = {
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
    q: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/></svg>',
    calc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/></svg>'
  };
  var DURUM_ROZET = {
    dogrulandi: { ad: "Doğrulandı", icon: ICON.check },
    dikkat: { ad: "Dikkat", icon: ICON.warn.replace('stroke-width="2"', 'stroke-width="2.5"') },
    dogrulanamadi: { ad: "Doğrulanamadı", icon: ICON.q }
  };

  // --- MathJax: yoksa ya da yüklenmemişse sessizce geçer; dizgiler sıraya alınır ---
  var mjKuyruk = Promise.resolve();
  function dizgile(node) {
    var mj = window.MathJax;
    if (!node || !mj || typeof mj.typesetPromise !== "function") return Promise.resolve();
    mjKuyruk = mjKuyruk.then(function () {
      if (typeof mj.typesetClear === "function") { try { mj.typesetClear([node]); } catch (e) { /* yok say */ } }
      return mj.typesetPromise([node]);
    }).catch(function () { /* yok say */ });
    return mjKuyruk;
  }
  // MathJax geç yüklenirse (sayfa içeriği önceden çizildiyse) görünür ekranı yeniden dizgile
  window.APMEBERRA_SEVIYE_MJ_HAZIR = function () {
    ["sv-test", "sv-report"].forEach(function (id) { var el = $(id); if (el && !el.hidden) dizgile(el); });
  };

  function duyur(msg) {
    var el = $("sv-live");
    if (!el) return;
    el.textContent = "";
    window.setTimeout(function () { el.textContent = msg; }, 30);
  }

  // ------------------------------------------------------------------------
  // 4. DEPO
  // ------------------------------------------------------------------------
  function isObj(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }
  function bosVeri() { return { v: 1, devam: null, raporlar: [], kontrol: {} }; }
  function oku() {
    var d = null;
    try { var raw = window.localStorage.getItem(KEY); d = raw ? JSON.parse(raw) : null; } catch (e) { d = null; }
    if (!isObj(d)) d = bosVeri();
    if (!Array.isArray(d.raporlar)) d.raporlar = [];
    d.raporlar = d.raporlar.filter(function (r) { return isObj(r) && Array.isArray(r.dersler) && isObj(r.sonuclar); });
    if (!isObj(d.kontrol)) d.kontrol = {};
    if (!isObj(d.devam)) d.devam = null;
    d.v = 1;
    return d;
  }
  var V = bosVeri();
  function yaz() {
    try { window.localStorage.setItem(KEY, JSON.stringify(V)); return true; } catch (e) { return false; }
  }

  // ------------------------------------------------------------------------
  // 5. BANKA YÜKLEME
  // ------------------------------------------------------------------------
  var ORNEK_MODU = /[?&]ornek=1(?:&|$)/.test(window.location.search);
  var LISTE = ORNEK_MODU ? DERSLER.concat([ORNEK]) : DERSLER.slice();
  var dosyaDurum = {};

  function bankaGecerli(b) { return isObj(b) && Array.isArray(b.sorular) && b.sorular.length > 0 && Array.isArray(b.uniteler) && b.uniteler.length > 0; }
  function banka(key) { var all = window.APMEBERRA_SEVIYE || {}; return bankaGecerli(all[key]) ? all[key] : null; }
  function dersMeta(key) { return LISTE.filter(function (d) { return d.key === key; })[0] || { key: key, ad: key, cls: "" }; }
  function dersAd(key) { var b = banka(key); return (b && b.ad) || dersMeta(key).ad; }

  // v1.5.0: bankalar sunucudan (cevapsız). Çözümler teslimden sonra COZUM'a yazılır ("ders|id" → { dogru, aciklama, genelHatirlatma, hatalar }).
  var COZUM = {};
  function sbIstek(yol, govde) {
    var o = { credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Meberra": "1" } };
    if (govde !== undefined) { o.method = "POST"; o.body = JSON.stringify(govde); }
    return fetch(yol, o).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { durum: r.status, veri: j || {} }; }); },
      function () { return { durum: 0, veri: {} }; });
  }
  /** Sorunun çözümlü kopyası (eski şema: options[].isCorrect/errorTag/remediation, stepByStepSolution, generalRemediation). */
  function cozumlu(ders, q) {
    var c = COZUM[ders + "|" + q.id];
    if (!c) return q;
    var h = c.hatalar || {};
    return Object.assign({}, q, {
      options: q.options.map(function (o) { return Object.assign({ id: o.id, text: o.text, isCorrect: o.id === c.dogru }, h[o.id] ? { errorTag: h[o.id].errorTag, remediation: h[o.id].remediation } : {}); }),
      stepByStepSolution: c.aciklama || "", generalRemediation: c.genelHatirlatma || ""
    });
  }
  function bankalariYukle(bitti) {
    var yuk = $("sv-loading");
    if (!document.querySelector('meta[name="meberra-api"]')) { LISTE.forEach(function (d) { dosyaDurum[d.dosya] = "yok"; }); bitti(); return; }
    yuk.textContent = "Soru dosyaları yükleniyor…";
    yuk.setAttribute("role", "status");
    sbIstek("/api/seviye/bankalar").then(function (r) {
      if (r.durum === 200 && r.veri.ok) {
        window.APMEBERRA_SEVIYE = r.veri.bankalar || {};
        LISTE.forEach(function (d) { if (dosyaDurum[d.dosya] !== "ok") dosyaDurum[d.dosya] = window.APMEBERRA_SEVIYE[d.key] ? "ok" : "yok"; });
        bitti();
        return;
      }
      yuk.setAttribute("role", "alert");
      yuk.innerHTML = '<strong>Soru dosyaları yüklenemedi.</strong> ' + esc(r.durum === 0 ? "Bağlantın kopmuş görünüyor." : (r.veri.error || "Sunucu şu an yanıt vermiyor.")) +
        ' <button type="button" class="btn-primary btn-sm" id="sv-yukle-tekrar">Yeniden dene</button>';
      $("sv-yukle-tekrar").addEventListener("click", function () { bankalariYukle(bitti); });
    });
  }

  function takvim() { return isObj(window.APMEBERRA_TAKVIM) ? window.APMEBERRA_TAKVIM : { kayit: {}, sinavlar: {}, gereklilikler: [] }; }

  /** Seçilen dersler için soru sırası: ders sırasıyla, ünite CED sırası, kolaydan zora. */
  function soruSirasi(dersler) {
    var out = [];
    dersler.forEach(function (key) {
      var b = banka(key);
      if (!b) return;
      var unOrder = {};
      b.uniteler.forEach(function (u, i) { unOrder[String(u.no)] = i; });
      var zo = { easy: 0, medium: 1, hard: 2 };
      b.sorular
        .map(function (q, i) { return { q: q, i: i }; })
        .filter(function (x) { return String(x.q.unite) in unOrder; })
        .sort(function (a, c) { return (unOrder[a.q.unite] - unOrder[c.q.unite]) || ((zo[a.q.zorluk] || 0) - (zo[c.q.zorluk] || 0)) || (a.i - c.i); })
        .forEach(function (x) { out.push({ ders: key, id: x.q.id }); });
    });
    return out;
  }
  function soruBul(ders, id) {
    var b = banka(ders);
    if (!b) return null;
    return b.sorular.filter(function (q) { return q.id === id; })[0] || null;
  }
  function sureToplami(dersler) {
    return dersler.reduce(function (s, key) {
      var b = banka(key);
      return s + (b ? b.sorular.reduce(function (t, q) { return t + (Number(q.sureSn) || 90); }, 0) : 0);
    }, 0);
  }

  // ------------------------------------------------------------------------
  // 6. EKRAN YÖNETİMİ
  // ------------------------------------------------------------------------
  function ekran(ad) {
    ["sv-start", "sv-test", "sv-report"].forEach(function (id) { $(id).hidden = id !== "sv-" + ad; });
    document.body.dataset.svEkran = ad;
    if (ad !== "test") zamanlayiciDur();
    window.scrollTo(0, 0);
  }
  function odak(el) { if (!el) return; if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true }); }

  // ------------------------------------------------------------------------
  // 7. BAŞLANGIÇ EKRANI
  // ------------------------------------------------------------------------
  function kayitBilgisi(bugun) {
    var k = takvim().kayit || {};
    var kalan = gunFarki(k.sonGun, bugun);
    return { k: k, kalan: kalan, gecKalan: gunFarki(k.gecKayitSon, bugun) };
  }

  function baslangicCiz() {
    var T = takvim();
    var kb = kayitBilgisi(new Date());
    var html = "";
    // Kayıt şeridi
    if (kb.kalan === null) {
      html += '<div class="notice">' + ICON.info + '<div>Kayıt son günü henüz doğrulanmadı. <a href="sinavlar.html">Sınavlar</a> sayfasını kontrol et.</div></div>';
    } else if (kb.kalan >= 0) {
      html += '<div class="sv-deadline' + (kb.kalan <= 14 ? " is-urgent" : "") + '"><span class="sv-deadline-num">' + kb.kalan + '</span><span class="sv-deadline-txt"><strong>gün kaldı</strong> — AP sınav kaydının son günü ' + esc(fmtIsoGun(kb.k.sonGun)) + '. Kayıttan önce testi çöz, raporla birlikte karar ver.</span></div>';
    } else {
      html += '<div class="notice is-warn">' + ICON.warn + '<div><strong>Standart kayıt kapandı</strong> (' + esc(fmtIsoGun(kb.k.sonGun)) + '). ' + gecKayitMetni(kb) + '</div></div>';
    }
    $("sv-deadline").innerHTML = html;

    // Devam kartı
    var dv = V.devam, devamEl = $("sv-resume");
    if (dv && Array.isArray(dv.sira) && dv.sira.length) {
      var eksik = dv.dersler.filter(function (k) { return !banka(k); });
      var cevaplanan = Object.keys(dv.cevaplar || {}).length;
      devamEl.innerHTML = '<div class="sv-resume-body"><strong>Yarım kalan bir testin var</strong>' +
        '<span>' + esc(dv.dersler.map(dersAd).join(", ")) + ' · ' + cevaplanan + ' / ' + dv.sira.length + ' soru işaretlendi' +
        (dv.sureli ? ' · kalan süre ' + fmtSure(dv.kalanSn) : '') + ' · ' + esc(fmtZaman(dv.guncelleme)) + '</span>' +
        (eksik.length ? '<span class="sv-err">Bu testteki ' + esc(eksik.map(dersAd).join(", ")) + ' dosyası şu an yüklenemiyor; devam edilemez.</span>' : '') + '</div>' +
        '<div class="sv-actions">' + (eksik.length ? '' : '<button type="button" class="btn-primary" id="sv-resume-btn">Kaldığın yerden devam et</button>') +
        '<button type="button" class="btn-ghost" id="sv-discard-btn">Yarım testi sil</button></div>';
      devamEl.hidden = false;
      var rb = $("sv-resume-btn");
      if (rb) rb.addEventListener("click", function () { testBaslat(true); });
      $("sv-discard-btn").addEventListener("click", function () {
        V.devam = null; yaz(); baslangicCiz(); duyur("Yarım kalan test silindi."); odak($("sv-start-title"));
      });
    } else { devamEl.hidden = true; devamEl.innerHTML = ""; }

    // Son rapor bağlantısı
    var sr = $("sv-last-report");
    if (V.raporlar.length) {
      sr.hidden = false;
      sr.innerHTML = 'Son raporun: <strong>' + esc(fmtZaman(V.raporlar[0].tarih)) + '</strong> · <a href="#rapor" id="sv-open-last">Raporu aç →</a>';
      $("sv-open-last").addEventListener("click", function (e) { e.preventDefault(); raporGoster(V.raporlar[0].id, true); });
    } else sr.hidden = true;

    // Ders seçimi
    var secili = (V.sonSecim && V.sonSecim.dersler) || [];
    var h = "";
    var calc = LISTE.filter(function (d) { return d.grup === "calculus"; });
    var calcHazir = calc.filter(function (d) { return banka(d.key); });
    h += '<fieldset class="sv-course c-calculus' + (calcHazir.length ? "" : " is-disabled") + '"><legend class="sv-course-name">AP Calculus <span class="sv-course-note">AB ya da BC — yalnızca biri</span></legend>';
    h += '<div class="sv-radio-row">';
    h += '<label class="sv-radio"><input type="radio" name="sv-calc" value=""' + (calc.some(function (d) { return secili.indexOf(d.key) >= 0 && banka(d.key); }) ? "" : " checked") + '><span>Seçme</span></label>';
    calc.forEach(function (d) {
      var b = banka(d.key);
      h += '<label class="sv-radio' + (b ? "" : " is-disabled") + '"><input type="radio" name="sv-calc" value="' + d.key + '"' + (b ? "" : " disabled") + (b && secili.indexOf(d.key) >= 0 ? " checked" : "") + '><span>' + esc(d.key === "calculus-ab" ? "AB" : "BC") + '</span>' + dersMetaHtml(d.key) + '</label>';
    });
    h += '</div></fieldset>';
    LISTE.filter(function (d) { return d.grup !== "calculus" && !(d.ornek && !banka(d.key)); }).forEach(function (d) {
      var b = banka(d.key);
      h += '<label class="sv-course ' + d.cls + (b ? "" : " is-disabled") + '">' +
        '<input type="checkbox" name="sv-ders" value="' + d.key + '"' + (b ? "" : " disabled") + (b && secili.indexOf(d.key) >= 0 ? " checked" : "") + '>' +
        '<span class="sv-course-body"><span class="sv-course-name">' + esc(b ? b.ad : d.ad) + (d.ornek ? ' <span class="sv-chip-ornek">ÖRNEK</span>' : '') + '</span>' + dersMetaHtml(d.key) + '</span></label>';
    });
    $("sv-courses").innerHTML = h;
    var hz = LISTE.filter(function (d) { return banka(d.key); }).length;
    $("sv-courses-empty").hidden = hz > 0;
    if (V.sonSecim) {
      $("sv-hours").value = V.sonSecim.haftalikSaat || SAAT.varsayilan;
      $("sv-timed").checked = !!V.sonSecim.sureli;
    }
    tahminGuncelle();
  }

  function gecKayitMetni(kb) {
    var k = kb.k;
    if (!k.gecKayitSon) return "Geç kayıt penceresi doğrulanmadı; <a href=\"sinavlar.html\">Sınavlar</a> sayfasına bak ve okul koordinatörüne sor.";
    if (kb.gecKalan !== null && kb.gecKalan < 0) return "Geç kayıt penceresi de " + esc(fmtIsoGun(k.gecKayitSon)) + " tarihinde kapandı.";
    return "Geç kayıt penceresi: <strong>" + esc(fmtIsoGun(k.gecKayitBas)) + " – " + esc(fmtIsoGun(k.gecKayitSon)) + "</strong>" +
      (k.gecUcretUSD != null ? "; sınav başına <strong>+" + esc(k.gecUcretUSD) + " USD</strong> geç sipariş ücreti" + (k.sinavUcretiUSD != null ? " (sınav ücreti " + esc(k.sinavUcretiUSD) + " USD + " + esc(k.gecUcretUSD) + " USD)" : "") : "; geç ücret doğrulanmadı") + ".";
  }

  function dersMetaHtml(key) {
    var b = banka(key);
    if (!b) return '<span class="sv-course-meta"><span class="sv-pill is-muted">Henüz hazır değil</span></span>';
    var dk = Math.round(sureToplami([key]) / 60);
    return '<span class="sv-course-meta">' + b.uniteler.length + ' ünite · ' + b.sorular.length + ' soru · ~' + dk + ' dk</span>';
  }

  function seciliDersler() {
    var out = [];
    var c = document.querySelector('input[name="sv-calc"]:checked');
    if (c && c.value) out.push(c.value);
    document.querySelectorAll('input[name="sv-ders"]:checked').forEach(function (i) { out.push(i.value); });
    // Ders listesi sırası korunur
    return LISTE.map(function (d) { return d.key; }).filter(function (k) { return out.indexOf(k) >= 0; });
  }
  function saatOku() {
    var v = parseFloat(String($("sv-hours").value).replace(",", "."));
    return v;
  }
  function tahminGuncelle() {
    var d = seciliDersler();
    var sn = sureToplami(d);
    var n = d.reduce(function (s, k) { var b = banka(k); return s + (b ? b.sorular.length : 0); }, 0);
    var el = $("sv-estimate");
    el.innerHTML = d.length
      ? ICON.clock + '<span><strong>Tahmini süre: ~' + Math.max(1, Math.round(sn / 60)) + ' dakika</strong> · ' + d.length + ' ders, ' + n + ' soru' + ($("sv-timed").checked ? " · süreli modda toplam süre " + fmtSure(sn) : "") + '</span>'
      : ICON.clock + '<span>Tahmini süreyi görmek için en az bir ders seç.</span>';
    $("sv-start-btn").disabled = !d.length;
  }

  function baslangicOlaylari() {
    $("sv-courses").addEventListener("change", function () { $("sv-form-msg").textContent = ""; tahminGuncelle(); });
    $("sv-timed").addEventListener("change", tahminGuncelle);
    $("sv-hours").addEventListener("input", function () {
      var v = saatOku();
      $("sv-hours-msg").textContent = isNaN(v) || v < SAAT.min || v > SAAT.max ? "5 ile 18 arasında bir sayı gir (önerilen tavan: haftada 18 saat)." : "";
    });
    $("sv-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var d = seciliDersler();
      var v = saatOku();
      if (!d.length) { $("sv-form-msg").textContent = "En az bir ders seç."; odak($("sv-courses-legend")); return; }
      if (isNaN(v) || v < SAAT.min || v > SAAT.max) {
        $("sv-hours-msg").textContent = "5 ile 18 arasında bir sayı gir (önerilen tavan: haftada 18 saat).";
        $("sv-hours").focus(); return;
      }
      var sira = soruSirasi(d);
      var now = new Date().toISOString();
      V.sonSecim = { dersler: d, haftalikSaat: v, sureli: $("sv-timed").checked };
      V.devam = { id: "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), baslangic: now, guncelleme: now, dersler: d, haftalikSaat: v, sureli: $("sv-timed").checked, kalanSn: sureToplami(d), toplamSn: sureToplami(d), sira: sira, idx: 0, cevaplar: {} };
      yaz();
      testBaslat(false);
    });
  }

  // ------------------------------------------------------------------------
  // 8. TEST EKRANI
  // ------------------------------------------------------------------------
  var zamanlayici = null, sonKayit = 0;
  function zamanlayiciDur() { if (zamanlayici) { window.clearInterval(zamanlayici); zamanlayici = null; } }
  function zamanlayiciBaslat() {
    zamanlayiciDur();
    var dv = V.devam;
    if (!dv || !dv.sureli) return;
    var son = Date.now();
    zamanlayici = window.setInterval(function () {
      var now = Date.now();
      var gecen = Math.round((now - son) / 1000);
      if (gecen < 1) return;
      son += gecen * 1000;
      dv.kalanSn = Math.max(0, dv.kalanSn - gecen);
      sureCiz();
      if (dv.kalanSn === 300 || dv.kalanSn === 60) duyur((dv.kalanSn / 60) + " dakika kaldı.");
      if (now - sonKayit > 5000) { dv.guncelleme = new Date().toISOString(); yaz(); sonKayit = now; }
      if (dv.kalanSn <= 0) { duyur("Süre doldu. Raporun hazırlanıyor."); testiBitir("sure"); }
    }, 1000);
  }
  function sureCiz() {
    var dv = V.devam, el = $("sv-timer");
    if (!dv || !dv.sureli) { el.hidden = true; return; }
    el.hidden = false;
    $("sv-timer-val").textContent = fmtSure(dv.kalanSn);
    el.classList.toggle("is-low", dv.kalanSn <= 300);
  }

  function testBaslat(devamMi) {
    var dv = V.devam;
    if (!dv) return;
    // Bankada artık olmayan soruları ayıkla
    dv.sira = dv.sira.filter(function (s) { return soruBul(s.ders, s.id); });
    if (!dv.sira.length) { V.devam = null; yaz(); baslangicCiz(); return; }
    dv.idx = Math.min(Math.max(0, dv.idx || 0), dv.sira.length - 1);
    ekran("test");
    $("sv-finish-confirm").hidden = true;
    soruCiz(true);
    zamanlayiciBaslat();
    duyur(devamMi ? "Kaldığın yerden devam ediyorsun: soru " + (dv.idx + 1) + " / " + dv.sira.length + "." : "Test başladı. " + dv.sira.length + " soru var.");
  }

  function soruCiz(odakla) {
    var dv = V.devam;
    var s = dv.sira[dv.idx];
    var q = soruBul(s.ders, s.id);
    var b = banka(s.ders);
    var u = b.uniteler.filter(function (x) { return String(x.no) === String(q.unite); })[0] || { no: q.unite, ad: "" };
    var meta = dersMeta(s.ders);
    // Ders içi sıra
    var dersSorulari = dv.sira.filter(function (x) { return x.ders === s.ders; });
    var dersIdx = dersSorulari.indexOf(s) + 1;
    var dersNo = dv.dersler.indexOf(s.ders) + 1;
    var cevaplanan = Object.keys(dv.cevaplar).length;

    var bar = $("sv-test-bar");
    bar.className = "sv-test-bar " + (meta.cls || "");
    $("sv-test-course").textContent = (b.ad || meta.ad);
    $("sv-test-pos").textContent = "Ders " + dersNo + "/" + dv.dersler.length + " · Soru " + dersIdx + "/" + dersSorulari.length + " · Genel " + (dv.idx + 1) + "/" + dv.sira.length;
    var p = $("sv-test-progress");
    p.setAttribute("aria-valuenow", String(cevaplanan));
    p.setAttribute("aria-valuemax", String(dv.sira.length));
    p.setAttribute("aria-valuetext", cevaplanan + " / " + dv.sira.length + " soru işaretlendi");
    $("sv-test-progress-fill").style.width = (cevaplanan / dv.sira.length * 100) + "%";
    $("sv-test-progress-label").textContent = cevaplanan + " / " + dv.sira.length;
    sureCiz();

    var sec = dv.cevaplar[s.ders + "|" + q.id];
    var html = '<div class="question-header"><div class="question-head-main">' +
      '<span class="question-num-badge">Soru ' + (dv.idx + 1) + '</span>' +
      '<span class="question-topic">Unit ' + esc(u.no) + (u.ad ? " — " + esc(u.ad) : "") + '</span></div>' +
      '<div class="question-tags"><span class="question-tag">' + esc(q.beceri || "") + '</span>' +
      '<span class="question-tag ' + esc(q.zorluk) + '">' + esc(ZORLUK_TR[q.zorluk] || q.zorluk) + '</span>' +
      (q.hesapMakinesi ? '<span class="question-tag sv-tag-calc">' + ICON.calc + 'Hesap makinesi</span>' : '') +
      '</div></div>' +
      '<h2 class="visually-hidden" id="sv-q-title" tabindex="-1">Soru ' + (dv.idx + 1) + ' / ' + dv.sira.length + ', ' + esc(b.ad || meta.ad) + '</h2>' +
      '<div class="question-body" id="sv-q-text">' + q.question + '</div>' +
      '<fieldset class="sv-options" aria-describedby="sv-q-text"><legend class="visually-hidden">Şıklar</legend>' +
      q.options.map(function (o) {
        return '<label class="sv-option"><input type="radio" name="sv-opt" value="' + esc(o.id) + '"' + (sec === o.id ? " checked" : "") + '>' +
          '<span class="option-letter" aria-hidden="true">' + esc(o.id) + '</span><span class="sv-option-text">' + o.text + '</span></label>';
      }).join("") + '</fieldset>' +
      (sec === null ? '<p class="sv-skipped-note">Bu soruyu “Bilmiyorum” olarak işaretledin. İstersen şimdi bir şık seçebilirsin.</p>' : '');
    var card = $("sv-q-card");
    card.innerHTML = html;
    card.className = "question-card sv-q-card " + (meta.cls || "");
    void card.offsetWidth; card.classList.add("ic-gecis"); // soru geçişi animasyonu (icerik.css) her çizimde yeniden başlar
    $("sv-prev").disabled = dv.idx === 0;
    $("sv-next").textContent = dv.idx === dv.sira.length - 1 ? "Testi bitir ve raporu gör" : "İleri →";
    $("sv-q-msg").textContent = "";
    dizgile(card);
    if (odakla) {
      var c = card.querySelector('input[name="sv-opt"]:checked') || card.querySelector('input[name="sv-opt"]');
      odak($("sv-q-title"));
      if (c) c.focus({ preventScroll: true });
      $("sv-test").scrollIntoView({ block: "start" });
    }
  }

  function cevapKaydet(deger) {
    var dv = V.devam;
    var s = dv.sira[dv.idx];
    dv.cevaplar[s.ders + "|" + s.id] = deger;
    dv.guncelleme = new Date().toISOString();
    yaz();
  }

  function ilerle(yon) {
    var dv = V.devam;
    var onceki = dv.sira[dv.idx].ders;
    var yeni = dv.idx + yon;
    if (yeni >= dv.sira.length) { testiBitir("tamam"); return; }
    if (yeni < 0) return;
    dv.idx = yeni; yaz();
    soruCiz(true);
    var simdiki = dv.sira[dv.idx].ders;
    if (simdiki !== onceki) duyur(dersAd(simdiki) + " bölümüne geçtin. Soru " + (dv.idx + 1) + " / " + dv.sira.length + ".");
    else duyur("Soru " + (dv.idx + 1) + " / " + dv.sira.length + ".");
  }

  function testOlaylari() {
    $("sv-q-form").addEventListener("change", function (e) {
      if (e.target && e.target.name === "sv-opt") { cevapKaydet(e.target.value); soruIlerlemeGuncelle(); }
    });
    $("sv-q-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var c = document.querySelector('input[name="sv-opt"]:checked');
      if (!c) { $("sv-q-msg").textContent = "Bir şık seç ya da “Bilmiyorum / atla”yı kullan."; return; }
      cevapKaydet(c.value);
      ilerle(1);
    });
    $("sv-skip").addEventListener("click", function () { cevapKaydet(null); ilerle(1); });
    $("sv-prev").addEventListener("click", function () { ilerle(-1); });
    $("sv-finish").addEventListener("click", function () {
      var dv = V.devam;
      var bos = dv.sira.length - Object.keys(dv.cevaplar).filter(function (k) { return dv.cevaplar[k] !== null; }).length;
      $("sv-finish-text").textContent = bos ? bos + " soru cevapsız sayılacak (raporda ayrıca listelenir)." : "Tüm sorular işaretlendi.";
      $("sv-finish-confirm").hidden = false;
      odak($("sv-finish-confirm-title"));
    });
    $("sv-finish-yes").addEventListener("click", function () { testiBitir("erken"); });
    $("sv-finish-no").addEventListener("click", function () { $("sv-finish-confirm").hidden = true; $("sv-finish").focus(); });
    $("sv-pause").addEventListener("click", function () {
      if (V.devam) { V.devam.guncelleme = new Date().toISOString(); yaz(); }
      ekran("start"); baslangicCiz(); duyur("Test kaydedildi. Daha sonra kaldığın yerden devam edebilirsin."); odak($("sv-resume"));
    });
    document.addEventListener("keydown", function (e) {
      if (document.body.dataset.svEkran !== "test" || e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && t.type !== "radio"))) return;
      var k = e.key.toUpperCase();
      var map = { "1": "A", "2": "B", "3": "C", "4": "D", "5": "E" };
      var L = map[k] || (/^[A-E]$/.test(k) ? k : null);
      if (L) {
        var inp = document.querySelector('input[name="sv-opt"][value="' + L + '"]');
        if (inp) { e.preventDefault(); inp.checked = true; inp.focus(); cevapKaydet(L); soruIlerlemeGuncelle(); duyur(L + " şıkkı seçildi."); }
      } else if (k === "0") { e.preventDefault(); $("sv-skip").click(); }
    });
    window.addEventListener("beforeunload", function () { if (V.devam && document.body.dataset.svEkran === "test") { V.devam.guncelleme = new Date().toISOString(); yaz(); } });
  }
  function soruIlerlemeGuncelle() {
    var dv = V.devam;
    var n = Object.keys(dv.cevaplar).length;
    $("sv-test-progress-fill").style.width = (n / dv.sira.length * 100) + "%";
    $("sv-test-progress-label").textContent = n + " / " + dv.sira.length;
    $("sv-test-progress").setAttribute("aria-valuenow", String(n));
    $("sv-q-msg").textContent = "";
    var sk = document.querySelector(".sv-skipped-note"); if (sk) sk.remove();
  }

  var bitiriliyor = false;
  function testiBitir(neden) {
    var dv = V.devam;
    if (!dv || bitiriliyor) return;
    zamanlayiciDur();
    bitiriliyor = true;
    dv.guncelleme = new Date().toISOString(); yaz();
    // Cevaplar sunucuda kontrol edilir (doğru şıklar tarayıcıda yok); gelen çözümlerle mevcut puanlama yapılır
    var gonder = {};
    dv.sira.forEach(function (s) { var k = s.ders + "|" + s.id; gonder[k] = dv.cevaplar[k] == null ? null : dv.cevaplar[k]; });
    var msg = $("sv-q-msg");
    if (msg) msg.textContent = "Cevapların kontrol ediliyor…";
    sbIstek("/api/seviye/teslim", { cevaplar: gonder }).then(function (r) {
      bitiriliyor = false;
      if (r.durum !== 200 || !r.veri.ok) {
        if (msg) msg.innerHTML = '<span role="alert">Rapor oluşturulamadı: ' + esc(r.durum === 0 ? "bağlantı yok." : (r.veri.error || "sunucu yanıt vermedi.")) +
          ' Cevapların kayıtlı.</span> <button type="button" class="btn-primary btn-sm" id="sv-bitir-tekrar">Yeniden dene</button>';
        var b = $("sv-bitir-tekrar"); if (b) b.addEventListener("click", function () { testiBitir(neden); });
        if (neden !== "sure") zamanlayiciBaslat();
        return;
      }
      Object.assign(COZUM, r.veri.cozumler || {});
      if (msg) msg.textContent = "";
      testiPuanla(neden);
    });
  }
  function testiPuanla(neden) {
    var dv = V.devam;
    if (!dv) return;
    var now = new Date().toISOString();
    var sonuclar = {};
    dv.dersler.forEach(function (key) {
      var b = banka(key);
      if (!b) return;
      var cev = {};
      Object.keys(dv.cevaplar).forEach(function (k) { var p = k.split("|"); if (p[0] === key) cev[p.slice(1).join("|")] = dv.cevaplar[k]; });
      // Testte sorulmayan (ör. sonradan eklenen) sorular puanlamaya girmez
      var sorulan = {};
      dv.sira.forEach(function (s) { if (s.ders === key) sorulan[s.id] = true; });
      var bk = Object.assign({}, b, { sorular: b.sorular.filter(function (q) { return sorulan[q.id]; }).map(function (q) { return cozumlu(key, q); }) });
      var r = puanla(bk, cev);
      r.ad = b.ad || dersMeta(key).ad;
      r.cedSurum = b.cedSurum || null;
      r.portalSayfasi = b.portalSayfasi || null;
      r.cevaplar = cev;
      sonuclar[key] = r;
    });
    var rapor = {
      id: "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      tarih: now, guncelleme: now,
      dersler: dv.dersler.filter(function (k) { return sonuclar[k]; }),
      haftalikSaat: dv.haftalikSaat,
      sureli: !!dv.sureli,
      kullanilanSn: dv.sureli ? Math.max(0, dv.toplamSn - dv.kalanSn) : Math.round((Date.parse(now) - Date.parse(dv.baslangic)) / 1000),
      bitis: neden,
      varsayim: Object.assign({}, VARSAYIM),
      sonuclar: sonuclar
    };
    V.raporlar.unshift(rapor);
    V.raporlar = V.raporlar.slice(0, MAX_RAPOR);
    V.devam = null;
    yaz();
    raporGoster(rapor.id, true);
    duyur("Raporun hazır." + (neden === "sure" ? " Süre dolduğu için kalan sorular cevapsız sayıldı." : ""));
  }

  // ------------------------------------------------------------------------
  // 9. RAPOR
  // ------------------------------------------------------------------------
  var aktifRaporId = null;

  function raporBul(id) { return V.raporlar.filter(function (r) { return r.id === id; })[0] || null; }
  function oncekiRapor(r) {
    var i = V.raporlar.indexOf(r);
    return i >= 0 ? V.raporlar[i + 1] || null : null;
  }

  function fizibiliteHesapla(r) {
    var dersler = r.dersler.map(function (k) { return { ders: k, ad: r.sonuclar[k].ad, uniteler: r.sonuclar[k].uniteler }; });
    return fizibilite(dersler, { bugun: new Date(), takvim: takvim(), haftalikSaat: r.haftalikSaat, varsayim: r.varsayim });
  }

  /** İlerleme sayfası için kısa özet (raporun her gösteriminde güncellenir). */
  function ozetGuncelle(r, F) {
    r.ozet = {
      hesap: new Date().toISOString(),
      dersler: F.dersler.map(function (f) {
        var s = r.sonuclar[f.ders];
        return { ders: f.ders, ad: s.ad, skor: Math.round(s.skor), bant: s.bant, kirmizi: f.bantSay.kirmizi, sari: f.bantSay.sari, yesil: f.bantSay.yesil, durum: f.durum, karar: SONUC[f.durum].karar, sinav: f.tarih };
      }),
      tavanAsildi: F.toplam.tavanAsildi
    };
  }

  function raporGoster(id, odakla) {
    var r = raporBul(id) || V.raporlar[0];
    if (!r) { ekran("start"); baslangicCiz(); return; }
    aktifRaporId = r.id;
    ekran("report");
    try { if (window.location.hash !== "#rapor") history.replaceState(null, "", window.location.pathname + window.location.search + "#rapor"); } catch (e) { /* yok say */ }
    raporCiz(r);
    if (odakla) odak($("sv-report-title"));
  }

  function raporCiz(r) {
    var F = fizibiliteHesapla(r);
    ozetGuncelle(r, F);
    yaz();
    var onceki = oncekiRapor(r);
    var bugun = new Date();
    var html = "";

    html += '<header class="page-head sv-report-head"><span class="eyebrow">Sınav Hazırlık Raporu</span>' +
      '<h1 id="sv-report-title" tabindex="-1">Seviye testi raporun</h1>' +
      '<p>Test tarihi: <strong>' + esc(fmtZaman(r.tarih)) + '</strong> · ' + r.dersler.length + ' ders · ' +
      (r.sureli ? 'süreli mod' : 'süresiz') + ' · çözüm süresi ~' + Math.max(1, Math.round((r.kullanilanSn || 0) / 60)) + ' dk' +
      (r.bitis === "sure" ? ' · <strong>süre doldu</strong>' : r.bitis === "erken" ? ' · erken bitirildi' : '') + '</p></header>';

    html += '<div class="sv-toolbar" role="toolbar" aria-label="Rapor işlemleri">' +
      '<button type="button" class="btn-primary" id="sv-print">' + ICON.print + 'Yazdır / PDF</button>' +
      '<button type="button" class="btn-ghost" id="sv-retake">' + ICON.redo + 'Testi yeniden çöz</button>' +
      (V.raporlar.length > 1 ? '<label class="sv-hist-label" for="sv-hist">Rapor geçmişi</label><select id="sv-hist" class="calc-select sv-hist">' +
        V.raporlar.map(function (x, i) { return '<option value="' + esc(x.id) + '"' + (x.id === r.id ? " selected" : "") + '>' + esc(fmtZaman(x.tarih)) + (i === 0 ? " (en yeni)" : "") + '</option>'; }).join("") + '</select>' : '') +
      '</div>';

    html += '<div class="sv-disclaimer" role="note">' + ICON.warn + '<p><strong>' + esc(UYARI) + '</strong></p></div>';

    html += ozetBolumu(r, F, bugun);
    html += dersBolumu(r, onceki);
    html += fizibiliteBolumu(r, F);
    html += kararBolumu(r, F);
    html += oncelikBolumu(r);
    html += kontrolBolumu();
    html += yanlisBolumu(r);
    html += gecmisBolumu(r);

    var root = $("sv-report");
    root.innerHTML = html;
    raporOlaylari(r);
    dizgile(root);
    cozumleriTamamla(r);
  }
  /** Raporun yanlış/cevapsız sorularının çözümleri bellekte yoksa (sayfa yenilendi, başka cihaz) sunucudan alınır; g bölümü yeniden çizilir. */
  function cozumleriTamamla(r) {
    var eksik = [];
    r.dersler.forEach(function (key) {
      var s = r.sonuclar[key] || {}, l = s.liste || {};
      [].concat(l.yanlis || [], l.cevapsiz || []).forEach(function (id) { if (!COZUM[key + "|" + id]) eksik.push(key + "|" + id); });
    });
    if (!eksik.length || r._cozumIstendi) return;
    r._cozumIstendi = true;
    sbIstek("/api/seviye/cozumler", { anahtarlar: eksik }).then(function (x) {
      if (x.durum !== 200 || !x.veri.ok || !Object.keys(x.veri.cozumler || {}).length) return;
      Object.assign(COZUM, x.veri.cozumler);
      var eski = document.querySelector('#sv-report section[aria-labelledby="sv-g"]');
      if (!eski || aktifRaporId !== r.id) return;
      var t = document.createElement("div");
      t.innerHTML = yanlisBolumu(r);
      var yeni = t.firstElementChild;
      eski.parentNode.replaceChild(yeni, eski);
      dizgile(yeni);
    });
  }

  // a. Özet kartı
  function ozetBolumu(r, F, bugun) {
    var kb = kayitBilgisi(bugun);
    var k = kb.k;
    var kayitHtml;
    if (kb.kalan === null) kayitHtml = '<div class="kv"><div class="kv-num">—</div><div class="kv-label">Kayıt son günü doğrulanmadı</div></div>';
    else if (kb.kalan >= 0) kayitHtml = '<div class="kv' + (kb.kalan <= 14 ? " is-bad" : "") + '"><div class="kv-num" id="sv-kayit-kalan">' + kb.kalan + ' gün</div><div class="kv-label">Kayıt son gününe (' + esc(fmtIsoGun(k.sonGun)) + ')</div></div>';
    else kayitHtml = '<div class="kv is-bad"><div class="kv-num" id="sv-kayit-kalan">Kapandı</div><div class="kv-label">Standart kayıt ' + esc(fmtIsoGun(k.sonGun)) + '</div></div>';
    var html = '<section class="section sv-sec" aria-labelledby="sv-a"><h2 id="sv-a"><span class="sv-sec-letter" aria-hidden="true">a</span>Özet</h2>' +
      '<div class="surface"><div class="kv-list sv-kv">' +
      '<div class="kv"><div class="kv-num sv-kv-date" id="sv-bugun">' + esc(fmtGun(bugun)) + '</div><div class="kv-label">Bugün</div></div>' +
      kayitHtml +
      '<div class="kv"><div class="kv-num">' + (k.sinavUcretiUSD != null ? esc(k.sinavUcretiUSD) + ' USD' : '—') + '</div><div class="kv-label">Sınav ücreti (ders başına, ABD dışı)</div></div>' +
      '</div>';
    if (kb.kalan !== null && kb.kalan < 0) html += '<div class="notice is-warn sv-late" id="sv-late">' + ICON.warn + '<div>' + gecKayitMetni(kb) + '</div></div>';
    html += '<div class="sv-table-wrap"><table class="sv-table" id="sv-exam-table"><caption class="visually-hidden">Ders sınav tarihleri</caption><thead><tr><th scope="col">Ders</th><th scope="col">Sınav tarihi</th><th scope="col">Kalan</th><th scope="col">Kaynak</th></tr></thead><tbody>';
    F.dersler.forEach(function (f) {
      html += '<tr class="' + esc(dersMeta(f.ders).cls || "") + '" data-ders="' + esc(f.ders) + '"><th scope="row" data-label="Ders"><span class="nav-dot" style="--dot:var(--cc, var(--accent))"></span>' + esc(f.ad) + '</th>' +
        (f.tarih
          ? '<td data-label="Sınav tarihi">' + esc(fmtIsoGun(f.tarih)) + '</td><td data-label="Kalan">' + (f.kalanGun < 0 ? 'Sınav geçti' : f.kalanHafta + ' hafta (' + f.kalanGun + ' gün)') + '</td>'
          : '<td data-label="Sınav tarihi"><span class="status status-dogrulanamadi sv-unverified">' + DURUM_ROZET.dogrulanamadi.icon + 'tarih doğrulanmadı</span></td><td data-label="Kalan">—</td>') +
        '<td data-label="Kaynak">' + (kaynakHtml(f.kaynak) || '<span class="side-note">—</span>') + '</td></tr>';
    });
    html += '</tbody></table></div></div></section>';
    return html;
  }

  // b. Ders bazında
  function dersBolumu(r, onceki) {
    var html = '<section class="section sv-sec" aria-labelledby="sv-b"><h2 id="sv-b"><span class="sv-sec-letter" aria-hidden="true">b</span>Ders ve ünite bazında hazırlık</h2>' +
      '<p class="section-lead">Skor, soru zorluğuna göre ağırlıklıdır: kolay 1, orta 1,5, zor 2 puan. Cevapsız (atlanan) sorular 0 puan sayılır ama yanlış sayılmaz; ayrıca gösterilir. Bant: <span class="zone zone-red">Kırmızı &lt;%50</span> <span class="zone zone-yellow">Sarı %50–74</span> <span class="zone zone-green">Yeşil ≥%75</span>' +
      (onceki ? ' · “Değişim” sütunu ' + esc(fmtZaman(onceki.tarih)) + ' tarihli önceki raporla karşılaştırır.' : '') + '</p>';
    r.dersler.forEach(function (key) {
      var s = r.sonuclar[key], meta = dersMeta(key);
      var ps = onceki && onceki.sonuclar[key];
      var ring = s.bant === "yesil" ? "var(--ok)" : s.bant === "sari" ? "var(--warn)" : "var(--bad)";
      var degisim = { up: 0, down: 0 };
      html += '<article class="surface sv-course-block ' + esc(meta.cls || "") + '" data-ders="' + esc(key) + '">' +
        '<div class="sv-course-head"><div class="ring ring-sm" style="--p:' + Math.round(s.skor) + ';--ring-color:' + ring + '" role="img" aria-label="' + esc(s.ad) + ' genel skor yüzde ' + Math.round(s.skor) + '"><span>' + pct(s.skor) + '</span></div>' +
        '<div class="sv-course-title"><h3>' + esc(s.ad) + '</h3><p class="side-note">' + esc(s.cedSurum || "") + '</p></div>' +
        '<div class="sv-course-score">' + bantHtml(s.bant, pct(s.skor)) + '<span class="sv-nums"><span class="is-ok">' + s.dogru + ' doğru</span> · <span class="is-bad">' + s.yanlis + ' yanlış</span> · <span>' + s.cevapsiz + ' cevapsız</span> · ' + yuvarla(s.puan, 1).toLocaleString("tr-TR") + ' / ' + yuvarla(s.max, 1).toLocaleString("tr-TR") + ' puan</span>' +
        (ps ? '<span class="sv-nums">Önceki: ' + pct(ps.skor) + ' → şimdi ' + pct(s.skor) + '</span>' : '') + '</div></div>';
      html += '<div class="sv-table-wrap"><table class="sv-table sv-unit-table"><caption class="visually-hidden">' + esc(s.ad) + ' ünite sonuçları</caption><thead><tr><th scope="col">Ünite</th><th scope="col">Skor</th><th scope="col">Bant</th><th scope="col">Sınav ağırlığı</th><th scope="col">Portal</th>' + (onceki ? '<th scope="col">Değişim</th>' : '') + '</tr></thead><tbody>';
      s.uniteler.forEach(function (u) {
        var pu = ps && ps.uniteler.filter(function (x) { return x.no === u.no; })[0];
        var dg = "";
        if (onceki) {
          if (!pu) dg = '<span class="side-note">yeni</span>';
          else {
            var d = BANT[u.bant].sira - BANT[pu.bant].sira;
            if (d > 0) degisim.up++; else if (d < 0) degisim.down++;
            dg = '<span class="sv-delta ' + (d > 0 ? "is-up" : d < 0 ? "is-down" : "is-same") + '">' + BANT[pu.bant].ad + ' → ' + BANT[u.bant].ad + (d > 0 ? ' ↑' : d < 0 ? ' ↓' : ' =') + '</span>';
          }
        }
        html += '<tr data-unite="' + esc(u.no) + '" data-bant="' + esc(u.bant) + '" data-skor="' + yuvarla(u.skor, 2) + '">' +
          '<th scope="row" data-label="Ünite"><span class="sv-unit-no">' + esc(u.no) + '</span> ' + esc(u.ad) +
          '<span class="sv-unit-sub">' + u.dogru + ' doğru · ' + u.yanlis + ' yanlış' + (u.cevapsiz ? ' · ' + u.cevapsiz + ' cevapsız' : '') + '</span></th>' +
          '<td data-label="Skor" class="sv-num">' + pct(u.skor) + '<div class="minibar" aria-hidden="true"><i class="' + (u.bant === "yesil" ? "ok" : u.bant === "sari" ? "warn" : "bad") + '" style="width:' + Math.max(2, u.skor) + '%"></i></div></td>' +
          '<td data-label="Bant">' + bantHtml(u.bant) + '</td>' +
          '<td data-label="Sınav ağırlığı">' + (u.sinavAgirligi ? esc(u.sinavAgirligi) : '<span class="side-note">bilinmiyor</span>') + '</td>' +
          '<td data-label="Portal">' + (u.portaldaVar ? '<span class="sv-pill is-ok">İçerik var</span>' : '<span class="sv-pill is-warn">İçerik yok</span><span class="sv-unit-sub">ek kaynak gerekir</span>') + '</td>' +
          (onceki ? '<td data-label="Değişim">' + dg + '</td>' : '') + '</tr>';
      });
      html += '</tbody></table></div>';
      if (onceki && ps) html += '<p class="side-note sv-delta-sum">Önceki rapora göre ' + degisim.up + ' ünite yükseldi, ' + degisim.down + ' ünite düştü.</p>';
      html += '</article>';
    });
    return html + '</section>';
  }

  // c. Zaman fizibilitesi
  function fizibiliteBolumu(r, F) {
    var v = F.varsayim;
    var html = '<section class="section sv-sec" aria-labelledby="sv-c"><h2 id="sv-c"><span class="sv-sec-letter" aria-hidden="true">c</span>Zaman fizibilitesi: açık kapanır mı?</h2>' +
      '<div class="surface"><details class="sv-method" open><summary>Yöntem ve varsayımlar</summary><ol class="sv-method-list">' +
      '<li><strong>Gereken saat</strong> = her Kırmızı ünite için ' + fmtSaat(v.kirmizi) + ' + her Sarı ünite için ' + fmtSaat(v.sari) + ' + her Yeşil ünite için ' + fmtSaat(v.yesil) + ' tekrar + ' + v.deneme + ' tam deneme × ' + fmtSaat(v.denemeSaat) + '.</li>' +
      '<li><strong>Kalan hafta</strong> = bugünden sınav tarihine kalan gün ÷ 7 (aşağı yuvarlanır).</li>' +
      '<li><strong>Kullanılabilir saat</strong> = (kalan hafta − ' + v.tampon + ' haftalık son tekrar tamponu) × ders başına haftalık saat.</li>' +
      '<li><strong>Ders başına haftalık saat</strong> = haftada AP’ye ayırdığın ' + fmtSaat(F.haftalikSaat) + ' ÷ ' + r.dersler.length + ' ders = ' + fmtSaat(F.dersSaat) + '.</li>' +
      '<li><strong>Sonuç</strong>: gereken ≤ kullanılabilir → “Mevcut tempoyla yetişir”; gereken ≤ kullanılabilir × 1,2 → “Sıkı ama mümkün”; aksi halde “Bu tempoyla yetişmez”.</li>' +
      '<li>Sınav tarihi resmi kaynakla doğrulanmamış derslerde hesap yapılmaz; tarih uydurulmaz.</li></ol></details>';

    html += '<form class="sv-assume" id="sv-assume" novalidate><fieldset><legend>Varsayımları değiştir ve yeniden hesapla</legend><div class="sv-assume-grid">' +
      numAlan("sv-v-hours", "Haftalık AP saati", F.haftalikSaat, SAAT.min, SAAT.max, 0.5, "sv-assume-help") +
      numAlan("sv-v-red", "Kırmızı ünite (sa)", v.kirmizi, 0, 100, 0.5) +
      numAlan("sv-v-yellow", "Sarı ünite (sa)", v.sari, 0, 100, 0.5) +
      numAlan("sv-v-green", "Yeşil ünite tekrar (sa)", v.yesil, 0, 100, 0.5) +
      numAlan("sv-v-mocks", "Tam deneme sayısı", v.deneme, 0, 20, 1) +
      numAlan("sv-v-mockh", "Deneme başına (sa)", v.denemeSaat, 0, 10, 0.5) +
      numAlan("sv-v-buffer", "Son tekrar tamponu (hafta)", v.tampon, 0, 10, 1) +
      '</div><p class="side-note" id="sv-assume-help">Haftalık AP saati 5–18 arasında olmalı (önerilen tavan: haftada 18 saat); seçilen derslere eşit bölünür.</p><div class="sv-actions"><button type="submit" class="btn-primary">Yeniden hesapla</button><button type="button" class="btn-ghost" id="sv-assume-reset">Varsayılanlara dön</button></div>' +
      '<p class="sv-form-msg" id="sv-assume-msg" role="status" aria-live="polite"></p></fieldset></form>';

    html += '<div class="sv-table-wrap"><table class="sv-table" id="sv-feas-table"><caption class="visually-hidden">Ders bazında zaman fizibilitesi</caption><thead><tr>' +
      '<th scope="col">Ders</th><th scope="col">Bantlar (K/S/Y)</th><th scope="col">Gereken</th><th scope="col">Kalan hafta</th><th scope="col">Kullanılabilir</th><th scope="col">Sonuç</th></tr></thead><tbody>';
    F.dersler.forEach(function (f) {
      html += '<tr data-ders="' + esc(f.ders) + '" data-durum="' + f.durum + '" data-gereken="' + yuvarla(f.gereken, 2) + '" data-kullanilabilir="' + (f.kullanilabilir === null ? "" : yuvarla(f.kullanilabilir, 2)) + '">' +
        '<th scope="row" data-label="Ders">' + esc(f.ad) + '</th>' +
        '<td data-label="Bantlar (K/S/Y)"><span class="sv-bandcount"><b class="is-bad">' + f.bantSay.kirmizi + '</b>/<b class="is-warn">' + f.bantSay.sari + '</b>/<b class="is-ok">' + f.bantSay.yesil + '</b></span></td>' +
        '<td data-label="Gereken" class="sv-num"><strong>' + fmtSaat(f.gereken) + '</strong><span class="sv-unit-sub">' + fmtSaat(f.uniteSaat) + ' ünite + ' + fmtSaat(f.denemeSaat) + ' deneme</span></td>' +
        '<td data-label="Kalan hafta" class="sv-num">' + (f.durum === "tarihyok" ? '<span class="sv-unverified-text">tarih doğrulanmadı</span>' : f.kalanHafta + ' − ' + v.tampon + ' = ' + f.kullanilabilirHafta) + '</td>' +
        '<td data-label="Kullanılabilir" class="sv-num">' + (f.durum === "tarihyok" ? '—' : '<strong>' + fmtSaat(f.kullanilabilir) + '</strong><span class="sv-unit-sub">' + f.kullanilabilirHafta + ' hf × ' + fmtSaat(f.dersSaat) + '</span>') + '</td>' +
        '<td data-label="Sonuç"><span class="sv-result ' + SONUC[f.durum].cls + '">' + esc(SONUC[f.durum].etiket) + '</span>' +
        (f.durum !== "tarihyok" && isFinite(f.oran) ? '<span class="sv-unit-sub">gereken / kullanılabilir = ' + yuvarla(f.oran, 2).toLocaleString("tr-TR") + '</span>' : '') + '</td></tr>';
    });
    var T = F.toplam;
    html += '</tbody><tfoot><tr id="sv-feas-total"><th scope="row" data-label="">Toplam</th><td data-label=""></td>' +
      '<td data-label="Gereken" class="sv-num"><strong>' + fmtSaat(T.gereken) + '</strong></td><td data-label=""></td>' +
      '<td data-label="Kullanılabilir" class="sv-num"><strong>' + fmtSaat(T.kullanilabilir) + '</strong>' + (T.tarihsiz ? '<span class="sv-unit-sub">' + T.tarihsiz + ' ders tarihsiz, hariç</span>' : '') + '</td>' +
      '<td data-label="Haftalık tempo"><strong>' + fmtSaat(T.haftalikToplam) + ' / hafta</strong><span class="sv-unit-sub">açığı kapatmak için gereken haftalık toplam</span></td></tr></tfoot></table></div>';
    if (T.tavanAsildi) {
      html += '<div class="notice is-warn sv-cap" id="sv-cap-warn">' + ICON.warn + '<div><strong>Haftalık 18 saat tavanı aşılıyor.</strong> Seçtiğin derslerin açığını sınava kadar kapatmak için haftada yaklaşık ' + fmtSaat(T.haftalikToplam) + ' gerekiyor. Sağlıklı bir tempo için haftalık AP yükünü 18 saatle sınırla: ders sayısını azaltmayı ya da bir dersi gelecek yıla bırakmayı öğretmeninle konuş.</div></div>';
    } else {
      html += '<p class="side-note">Açığı kapatmak için gereken haftalık toplam tempo ' + fmtSaat(T.haftalikToplam) + '; 18 saatlik haftalık tavanın altında.</p>';
    }
    return html + '</div></section>';
  }
  function numAlan(id, label, val, min, max, step, help) {
    return '<div class="calc-field"><label class="calc-label" for="' + id + '">' + esc(label) + '</label>' +
      '<input class="calc-input" type="number" inputmode="decimal" id="' + id + '" value="' + esc(val) + '" min="' + min + '" max="' + max + '" step="' + step + '"' + (help ? ' aria-describedby="' + help + '"' : '') + '></div>';
  }

  // d. Kayıt kararı
  function kararBolumu(r, F) {
    var html = '<section class="section sv-sec" aria-labelledby="sv-d"><h2 id="sv-d"><span class="sv-sec-letter" aria-hidden="true">d</span>Kayıt kararı önerisi</h2>' +
      '<p class="section-lead">Öneri yalnızca yukarıdaki zaman hesabından türetilir: “yetişir” → Kaydol · “sıkı ama mümkün” → Kaydol, yoğun plan gerekir · “yetişmez” → Bu yıl ertelemeyi değerlendir.</p><div class="sv-decisions">';
    F.dersler.forEach(function (f) {
      var S = SONUC[f.durum];
      var gerekce = f.durum === "tarihyok"
        ? "Sınav tarihi resmi kaynakla doğrulanmadı; kalan süre hesaplanamaz. Gereken çalışma: " + fmtSaat(f.gereken) + ". Tarih doğrulanınca rapor kendiliğinden yeniden hesaplanır."
        : "Gereken " + fmtSaat(f.gereken) + " (" + f.bantSay.kirmizi + " kırmızı, " + f.bantSay.sari + " sarı, " + f.bantSay.yesil + " yeşil ünite + " + F.varsayim.deneme + " deneme); kullanılabilir " + fmtSaat(f.kullanilabilir) + " (" + f.kullanilabilirHafta + " hafta × " + fmtSaat(f.dersSaat) + "). " +
          (f.durum === "yetisir" ? "Mevcut tempo yeterli." : f.durum === "siki" ? "Açık, kullanılabilir sürenin %" + Math.round((f.oran - 1) * 100) + " fazlası kadar; tempo ve disiplin şart." : "Gereken süre kullanılabilir sürenin " + (isFinite(f.oran) ? yuvarla(f.oran, 1).toLocaleString("tr-TR") + " katı" : "çok üstünde") + ".");
      html += '<article class="sv-decision ' + S.cls + ' ' + esc(dersMeta(f.ders).cls || "") + '" data-ders="' + esc(f.ders) + '">' +
        '<h3>' + esc(f.ad) + '</h3><p class="sv-decision-verdict">' + esc(S.karar) + '</p><p class="sv-decision-why">' + esc(gerekce) + '</p></article>';
    });
    return html + '</div></section>';
  }

  // e. Öncelikli çalışma listesi
  function oncelikBolumu(r) {
    var L = oncelikListesi(r);
    // Ünite çapası: kayıtlı raporda yoksa (eski kayıt) güncel bankadan bulunur
    function portalCapasi(x) {
      if (x.unite.portalCapa) return x.unite.portalCapa;
      var b = (window.APMEBERRA_SEVIYE || {})[x.ders];
      var u = b && (b.uniteler || []).filter(function (k) { return String(k.no) === String(x.unite.no); })[0];
      return (u && u.portalCapa) || null;
    }
    var html = '<section class="section sv-sec" aria-labelledby="sv-e"><h2 id="sv-e"><span class="sv-sec-letter" aria-hidden="true">e</span>Öncelikli çalışma listesi</h2>' +
      '<p class="section-lead">Kırmızı ve Sarı üniteler, <strong>sınav ağırlığı × açık oranı</strong> (açık = 1 − skor) değerine göre sıralandı. Ağırlık aralığının orta noktası kullanılır; ağırlığı bilinmeyen ünitelerde dersin üniteleri arasında eşit pay varsayılır.</p>';
    if (!L.length) return html + '<div class="empty-state">' + ICON.check.replace('stroke-width="2.5"', 'stroke-width="1.8"') + '<strong>Kırmızı ya da Sarı ünite yok</strong><span>Tüm ünitelerin Yeşil bantta. Deneme sınavlarıyla formunu koru.</span></div></section>';
    // Meberra ücretsiz plan: hedef ünite kilitliyse bağlantıda "Premium" rozeti + aynı dersten ücretsiz bir ünite önerisi
    var ucretsizPlan = typeof window.apPremiumMu === "function" && !window.apPremiumMu();
    var capaAcik = function (sayfa, capa) { return !ucretsizPlan || typeof window.apCapaUcretsizMi !== "function" || window.apCapaUcretsizMi(sayfa, capa); };
    function ucretsizAlternatif(x) {
      var adaylar = L.filter(function (y) { return y !== x && y.ders === x.ders; }).map(function (y) { return { no: y.unite.no, ad: y.unite.ad, capa: portalCapasi(y), var: y.unite.portaldaVar }; });
      var b = (window.APMEBERRA_SEVIYE || {})[x.ders];
      (b && b.uniteler || []).forEach(function (u) { adaylar.push({ no: String(u.no), ad: u.ad, capa: u.portalCapa || null, var: !!u.portaldaVar }); });
      for (var i = 0; i < adaylar.length; i++) {
        var a = adaylar[i];
        if (a.var && a.capa && String(a.no) !== String(x.unite.no) && capaAcik(x.portalSayfasi, a.capa)) return a;
      }
      return null;
    }
    html += '<ol class="sv-priority" id="sv-priority">';
    L.forEach(function (x, i) {
      var capa = portalCapasi(x);
      var link;
      if (!(x.unite.portaldaVar && x.portalSayfasi)) link = '<span class="sv-pill is-warn">Portalda yok — ek kaynak gerekir</span>';
      else if (capaAcik(x.portalSayfasi, capa)) link = '<a class="btn-ghost sv-go" href="' + esc(x.portalSayfasi + (capa ? "#" + capa : "")) + '">Portalda çalış →</a>';
      else {
        var alt = ucretsizAlternatif(x);
        link = '<span class="sv-go-kilit"><a class="btn-ghost sv-go" href="' + esc(x.portalSayfasi + (capa ? "#" + capa : "")) + '">Portalda çalış <span class="sv-pill is-warn">Premium</span> →</a>' +
          (alt ? ' <a class="sv-go-alt" href="' + esc(x.portalSayfasi + "#" + alt.capa) + '">Ücretsiz: Unit ' + esc(alt.no) + ' — ' + esc(alt.ad) + '</a>' : '') + '</span>';
      }
      html += '<li class="sv-prio-item ' + esc(dersMeta(x.ders).cls || "") + '" data-ders="' + esc(x.ders) + '" data-unite="' + esc(x.unite.no) + '">' +
        '<span class="sv-prio-rank" aria-hidden="true">' + (i + 1) + '</span>' +
        '<div class="sv-prio-body"><strong>' + esc(x.dersAd) + ' · Unit ' + esc(x.unite.no) + ' — ' + esc(x.unite.ad) + '</strong>' +
        '<span class="sv-prio-meta">' + bantHtml(x.unite.bant, pct(x.unite.skor)) + ' <span>Ağırlık: ' + (x.agirlikTahmini ? 'bilinmiyor (eşit pay ~%' + yuvarla(x.agirlik, 1).toLocaleString("tr-TR") + ')' : esc(x.unite.sinavAgirligi)) + '</span> <span>Öncelik puanı: ' + yuvarla(x.puan, 1).toLocaleString("tr-TR") + '</span></span></div>' + link + '</li>';
    });
    return html + '</ol></section>';
  }

  // f. Kontrol listesi
  function kontrolBolumu() {
    var G = Array.isArray(takvim().gereklilikler) ? takvim().gereklilikler : [];
    var html = '<section class="section sv-sec" aria-labelledby="sv-f"><h2 id="sv-f"><span class="sv-sec-letter" aria-hidden="true">f</span>Kayıt ve sınav günü kontrol listesi</h2>';
    if (!G.length) return html + '<div class="empty-state" id="sv-check-empty">' + ICON.clock + '<strong>Gereklilik listesi doğrulanıyor</strong><span>Kayıt ve sınav günü adımları resmi kaynaklarla doğrulandıkça burada görünecek. Bu arada <a href="istanbul-sinav-rehberi.html">İstanbul Sınav Rehberi</a>’ne bak.</span></div></section>';
    var gruplar = [], byG = {};
    G.forEach(function (g) {
      var k = g.ne_zaman || "diger";
      if (!byG[k]) { byG[k] = []; gruplar.push(k); }
      byG[k].push(g);
    });
    gruplar.sort(function (a, b) {
      var ia = NE_ZAMAN_SIRA.indexOf(a), ib = NE_ZAMAN_SIRA.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    var done = G.filter(function (g) { return V.kontrol[g.id] && V.kontrol[g.id].c; }).length;
    html += '<p class="section-lead" id="sv-check-count" aria-live="polite">' + done + ' / ' + G.length + ' adım tamamlandı. İşaretlerin kaydedilir.</p><div class="sv-checklist">';
    gruplar.forEach(function (gr, gi) {
      html += '<div class="surface sv-check-group" data-grup="' + esc(gr) + '"><h3 id="sv-cg-' + gi + '">' + esc(NE_ZAMAN_AD[gr] || gr) + ' <span class="sv-summary-sub">' + byG[gr].length + ' adım</span></h3><ul class="sv-check-list" aria-labelledby="sv-cg-' + gi + '">';
      byG[gr].forEach(function (g) {
        var id = "sv-ck-" + String(g.id).replace(/[^A-Za-z0-9_-]/g, "_");
        var c = !!(V.kontrol[g.id] && V.kontrol[g.id].c);
        var st = DURUM_ROZET[g.durum] ? g.durum : null;
        html += '<li class="sv-check' + (c ? " is-done" : "") + '"><input type="checkbox" id="' + id + '" data-gid="' + esc(g.id) + '"' + (c ? " checked" : "") + '>' +
          '<div class="sv-check-body"><label for="' + id + '">' + esc(g.baslik) + '</label>' +
          (g.ozet ? '<p>' + esc(g.ozet) + '</p>' : '') +
          '<div class="sv-check-meta">' + (st ? '<span class="status status-' + st + '">' + DURUM_ROZET[st].icon + DURUM_ROZET[st].ad + '</span>' : (g.durum ? '<span class="status status-dogrulanamadi">' + esc(g.durum) + '</span>' : '')) +
          (g.kaynak ? '<span class="kb-source">Kaynak: ' + kaynakHtml(g.kaynak) + '</span>' : '') + '</div></div></li>';
      });
      html += '</ul></div>';
    });
    return html + '</div></section>';
  }

  // g. Yanlış ve cevapsız sorular
  function yanlisBolumu(r) {
    var html = '<section class="section sv-sec" aria-labelledby="sv-g"><h2 id="sv-g"><span class="sv-sec-letter" aria-hidden="true">g</span>Yanlış ve cevapsız sorular</h2>' +
      '<p class="section-lead">Her sorunun doğru cevabı, hata etiketi, konu hatırlatması ve adım adım çözümü. Açmak için başlığa tıkla.</p>';
    var hic = true;
    r.dersler.forEach(function (key) {
      var s = r.sonuclar[key];
      var list = (s.liste.yanlis || []).map(function (id) { return { id: id, tur: "yanlis" }; }).concat((s.liste.cevapsiz || []).map(function (id) { return { id: id, tur: "cevapsiz" }; }));
      if (!list.length) return;
      hic = false;
      var b = banka(key);
      html += '<details class="disclosure sv-wrong-course ' + esc(dersMeta(key).cls || "") + '" data-ders="' + esc(key) + '"><summary><span>' + esc(s.ad) + ' <span class="sv-summary-sub">' + s.liste.yanlis.length + ' yanlış · ' + s.liste.cevapsiz.length + ' cevapsız</span></span></summary><div class="disclosure-body">';
      if (!b) { html += '<p class="side-note">Bu dersin soru dosyası şu an yüklenemedi; ayrıntılar gösterilemiyor.</p></div></details>'; return; }
      list.forEach(function (x) {
        var q = b.sorular.filter(function (y) { return y.id === x.id; })[0];
        if (!q) { html += '<p class="side-note">' + esc(x.id) + ': soru artık bankada yok.</p>'; return; }
        q = cozumlu(key, q);
        if (!q.options.some(function (o) { return o.isCorrect; })) {
          html += '<details class="sv-wrong" data-qid="' + esc(q.id) + '" data-tur="' + x.tur + '"><summary><span class="sv-wrong-tag ' + (x.tur === "yanlis" ? "is-bad" : "is-muted") + '">' + (x.tur === "yanlis" ? "Yanlış" : "Cevapsız") + '</span>' +
            '<span class="sv-wrong-title">Unit ' + esc(q.unite) + ' · ' + esc(q.beceri || "") + '</span></summary><div class="sv-wrong-body"><div class="question-body">' + q.question + '</div>' +
            '<p class="side-note" role="status">Çözüm yükleniyor…</p></div></details>';
          return;
        }
        var dogru = q.options.filter(function (o) { return o.isCorrect; })[0] || {};
        var secId = s.cevaplar ? s.cevaplar[q.id] : null;
        var sec = q.options.filter(function (o) { return o.id === secId; })[0];
        html += '<details class="sv-wrong" data-qid="' + esc(q.id) + '" data-tur="' + x.tur + '"><summary><span class="sv-wrong-tag ' + (x.tur === "yanlis" ? "is-bad" : "is-muted") + '">' + (x.tur === "yanlis" ? "Yanlış" : "Cevapsız") + '</span>' +
          '<span class="sv-wrong-title">Unit ' + esc(q.unite) + ' · ' + esc(q.beceri || "") + '</span></summary><div class="sv-wrong-body">' +
          '<div class="question-body">' + q.question + '</div>' +
          '<ul class="sv-wrong-opts">' + q.options.map(function (o) {
            return '<li class="' + (o.isCorrect ? "is-correct" : o.id === secId ? "is-chosen" : "") + '"><span class="option-letter" aria-hidden="true">' + esc(o.id) + '</span><span class="sv-option-text">' + o.text + '</span>' +
              (o.isCorrect ? '<span class="sv-opt-mark is-ok">Doğru cevap</span>' : o.id === secId ? '<span class="sv-opt-mark is-bad">Senin cevabın</span>' : '') + '</li>';
          }).join("") + '</ul>' +
          (sec && !sec.isCorrect ? '<div class="remediation-panel"><div class="remediation-title">Hata etiketi: ' + esc(sec.errorTag || "—") + '</div><div class="remediation-text">' + (sec.remediation || "") + '</div></div>' : '') +
          (x.tur === "cevapsiz" ? '<p class="side-note">Bu soruyu atladın ya da süre bitti. Doğru cevap: <strong>' + esc(dogru.id || "") + '</strong>.</p>' : '') +
          (q.generalRemediation ? '<div class="remediation-panel"><div class="remediation-title">Konu hatırlatması</div><div class="remediation-text">' + q.generalRemediation + '</div></div>' : '') +
          (q.stepByStepSolution ? '<div class="solution-panel"><div class="solution-title">Adım adım çözüm</div><div class="solution-steps">' + q.stepByStepSolution + '</div></div>' : '') +
          '<p class="side-note">Kaynak: ' + esc(q.source || "") + '</p></div></details>';
      });
      html += '</div></details>';
    });
    if (hic) html += '<div class="empty-state">' + ICON.check.replace('stroke-width="2.5"', 'stroke-width="1.8"') + '<strong>Yanlış ya da cevapsız soru yok</strong><span>Tebrikler — bu testteki tüm soruları doğru cevapladın.</span></div>';
    return html + '</section>';
  }

  // Rapor geçmişi
  function gecmisBolumu(r) {
    var html = '<section class="section sv-sec sv-history" aria-labelledby="sv-h"><h2 id="sv-h">Rapor geçmişi</h2><p class="section-lead">Son ' + MAX_RAPOR + ' rapor saklanır.</p><ol class="sv-hist-list">';
    V.raporlar.forEach(function (x) {
      html += '<li class="sv-hist-item' + (x.id === r.id ? " is-current" : "") + '"><div><strong>' + esc(fmtZaman(x.tarih)) + '</strong><span>' +
        x.dersler.map(function (k) { var s = x.sonuclar[k]; return esc(s.ad) + " " + pct(s.skor); }).join(" · ") + '</span></div>' +
        (x.id === r.id ? '<span class="sv-pill is-muted">Görüntüleniyor</span>' : '<button type="button" class="btn-ghost" data-open="' + esc(x.id) + '">Görüntüle</button>') + '</li>';
    });
    return html + '</ol></section>';
  }

  function raporOlaylari(r) {
    $("sv-print").addEventListener("click", function () { window.print(); });
    $("sv-retake").addEventListener("click", function () {
      V.sonSecim = { dersler: r.dersler.slice(), haftalikSaat: r.haftalikSaat, sureli: r.sureli };
      yaz();
      try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch (e) { /* yok say */ }
      ekran("start"); baslangicCiz(); odak($("sv-start-title"));
      duyur("Aynı derslerle yeni bir test başlatabilirsin.");
    });
    var h = $("sv-hist");
    if (h) h.addEventListener("change", function () { raporGoster(h.value, true); duyur(fmtZaman(raporBul(h.value).tarih) + " tarihli rapor gösteriliyor."); });
    document.querySelectorAll("#sv-report [data-open]").forEach(function (b) {
      b.addEventListener("click", function () { raporGoster(b.getAttribute("data-open"), true); });
    });
    $("sv-assume").addEventListener("submit", function (e) {
      e.preventDefault();
      var vals = {
        haftalikSaat: ["sv-v-hours", SAAT.min, SAAT.max], kirmizi: ["sv-v-red", 0, 100], sari: ["sv-v-yellow", 0, 100], yesil: ["sv-v-green", 0, 100],
        deneme: ["sv-v-mocks", 0, 20], denemeSaat: ["sv-v-mockh", 0, 10], tampon: ["sv-v-buffer", 0, 10]
      };
      var out = {}, hata = null;
      Object.keys(vals).forEach(function (k) {
        var c = vals[k], el = $(c[0]);
        var x = parseFloat(String(el.value).replace(",", "."));
        el.removeAttribute("aria-invalid");
        if (isNaN(x) || x < c[1] || x > c[2]) { if (!hata) hata = el; el.setAttribute("aria-invalid", "true"); }
        out[k] = x;
      });
      if (hata) {
        $("sv-assume-msg").textContent = "Geçersiz değer: “" + document.querySelector('label[for="' + hata.id + '"]').textContent + "” " + hata.min + " ile " + hata.max + " arasında olmalı.";
        hata.focus(); return;
      }
      r.haftalikSaat = out.haftalikSaat;
      r.varsayim = { kirmizi: out.kirmizi, sari: out.sari, yesil: out.yesil, deneme: Math.round(out.deneme), denemeSaat: out.denemeSaat, tampon: Math.round(out.tampon) };
      r.guncelleme = new Date().toISOString();
      yeniden(r, "Fizibilite yeni varsayımlarla yeniden hesaplandı.");
    });
    $("sv-assume-reset").addEventListener("click", function () {
      r.varsayim = Object.assign({}, VARSAYIM);
      r.guncelleme = new Date().toISOString();
      yeniden(r, "Varsayılan varsayımlara dönüldü.");
    });
    document.querySelectorAll("#sv-report input[data-gid]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        V.kontrol[cb.getAttribute("data-gid")] = { c: cb.checked, t: new Date().toISOString() };
        yaz();
        cb.closest(".sv-check").classList.toggle("is-done", cb.checked);
        var G = takvim().gereklilikler || [];
        var done = G.filter(function (g) { return V.kontrol[g.id] && V.kontrol[g.id].c; }).length;
        $("sv-check-count").textContent = done + " / " + G.length + " adım tamamlandı. İşaretlerin kaydedilir.";
      });
    });
  }
  function yeniden(r, msg) {
    raporCiz(r);
    var m = $("sv-assume-msg");
    if (m) m.textContent = msg;
    var c = $("sv-c");
    if (c) { c.scrollIntoView({ block: "start" }); odak(c); }
    duyur(msg);
  }

  // Yazdırırken tüm katlanır bölümler açılır, sonra eski hâline döner
  var acilanlar = [];
  window.addEventListener("beforeprint", function () {
    acilanlar = Array.prototype.filter.call(document.querySelectorAll("#sv-report details:not([open])"), function (d) { d.open = true; return true; });
  });
  window.addEventListener("afterprint", function () { acilanlar.forEach(function (d) { d.open = false; }); acilanlar = []; });

  // ------------------------------------------------------------------------
  // 10. BAŞLAT
  // ------------------------------------------------------------------------
  window.APMEBERRA_SEVIYE_HESAP = { KEY: KEY, AGIRLIK: AGIRLIK, VARSAYIM: VARSAYIM, bant: bant, puanla: puanla, fizibilite: fizibilite, gunFarki: gunFarki, agirlikSayi: agirlikSayi, oncelikListesi: oncelikListesi };

  function init() {
    if (!$("sv-start")) return;
    V = oku();
    baslangicOlaylari();
    testOlaylari();
    bankalariYukle(function () {
      $("sv-loading").hidden = true;
      var dosyaYok = Object.keys(dosyaDurum).filter(function (f) { return dosyaDurum[f] !== "ok"; });
      document.body.dataset.svHazir = "1";
      document.body.dataset.svEksik = dosyaYok.join(",");
      if (window.location.hash === "#rapor" && V.raporlar.length) { raporGoster(V.raporlar[0].id, false); return; }
      ekran("start");
      baslangicCiz();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
