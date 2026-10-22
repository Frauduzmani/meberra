/**
 * Meberra 1.4.0 "woow ama kaotik değil" — canlı katman (maskot Dede Korkut + hareket + kutlama bağlantıları). Kitaplıksız, derlemesiz.
 * Her sayfada app.js'in "1.4.0 maskot/hareket" bloğu yükler (admin hariç). Kaymanın önemli olduğu sayfalar (Bugün, Çalış,
 * ders sayfaları, İlerleme, Profil, Sorularım) başlıkta statik yükler; yükleyici ikinci kez eklemez.
 * Bağımlılıklar çağrı anında aranır (hepsi isteğe bağlı): MeberraMaskot (maskot.js), MeberraKutlama (kutlama.js), MEBERRA_OYUN (oyun.js).
 *
 * İLKELER (bağlayıcı): ekran başına TEK büyük an, gerisi sakin · aynı anda tek kutlama (MeberraKutlama kuyruğu) ·
 * hareket anlam taşır · süre/eğri yalnızca hareket.css tokenları (140/240/420 ms; egri-cik / egri-yay) ·
 * prefers-reduced-motion'da her şey durağan · kayma yok (CLS < 0,05) · maskot asla suçlamaz.
 *
 * YAPTIKLARI
 *   Navbar XP çipi ([data-xp-sayac]; app.js çizer, burada oyun.js kuralıyla güncellenir)
 *   Cevap geri bildirimi ("meberra:cevap"): doğru → şık zıplar (h-zipla) + "+10 XP" sayaca uçar; yanlış → hafif sallanma (h-salla)
 *     + açıklama kayarak açılır; üst üste 3 doğru → küçük maskot balonu. Ders sayfası ve İlerleme › Bugünkü tekrar.
 *   Deneme sonucu ("meberra:deneme-bitti", deneme.js): bant sayacı (sayiSay) → bant ≥ 3 büyük kart, değilse umutlu maskot + sonraki adım.
 *   Seri eşikleri (7/30/100/200/365) → büyük kart (bir kez).
 *   Öğrenme yolu (oyun.js çağırır: yolCiz): kıvrımlı SVG yol, yuvarlak ünite düğümleri, şimdiki düğümde maskot başı.
 *   Boş durumlar: [data-maskot="ifade"] yer tutucuları, Yanlışlarım boş durumu.
 *   Kart → ders sayfası paylaşılan öğe geçişi (belgeler arası View Transitions; desteklemeyen tarayıcıda normal gezinme).
 *
 * Saf çekirdek Node'da yüklenir (module.exports): araclar/testler/canli-birim-test.js
 */
(function (kok) {
  "use strict";

  // =====================================================================================
  // 1. SAF ÇEKİRDEK
  // =====================================================================================
  var SERI_ESIK = [7, 30, 100, 200, 365];
  var USTUSTE_ESIK = 3;
  var TEHLIKE_SAATI = 18;
  var TEHLIKE_MESAJ = "Serin bu gece bitiyor, tek bir soru yeter. 2 dakika?";

  /** Alev kademesi (CSS ölçek basamağı): 0 = seri yok, 1 = 1–2, 2 = 3–6, 3 = 7–29, 4 = 30–99, 5 = 100+ gün. */
  function alevKademe(gun) {
    gun = Math.floor(+gun || 0);
    return gun <= 0 ? 0 : gun < 3 ? 1 : gun < 7 ? 2 : gun < 30 ? 3 : gun < 100 ? 4 : 5;
  }
  function seriEsikMi(gun) { return SERI_ESIK.indexOf(Math.floor(+gun || 0)) >= 0; }
  /** Seri tehlikede mi: serisi var, bugün henüz çalışmamış ve yerel saat 18:00 ya da sonrası. */
  function seriTehlikede(o) {
    o = o || {};
    return (+o.seri || 0) > 0 && !o.bugunVar && (+o.saat || 0) >= TEHLIKE_SAATI;
  }
  /**
   * Bugün karşılaması (saf): { saat, ilkZiyaret, seri, bugunVar } → { metin, ifade, tehlike, mesaj }
   * Seri tehlikedeyse uykulu maskot + dostça hatırlatma; günün ilk ziyaretinde el sallar; diğer zamanlarda sevinçli.
   */
  function selamDurumu(o) {
    o = o || {};
    var s = +o.saat || 0;
    var tehlike = seriTehlikede(o);
    return {
      metin: s < 12 ? "Günaydın" : s < 18 ? "İyi günler" : "İyi akşamlar",
      ifade: tehlike ? "uykulu" : o.ilkZiyaret ? "selam" : "sevincli",
      tehlike: tehlike,
      mesaj: tehlike ? TEHLIKE_MESAJ : null
    };
  }

  var IST = null;
  /** ms | ISO → İstanbul takvim günü "YYYY-MM-DD" (oyun.js istGun ile aynı; testte karşılaştırılır) */
  function istGun(v) {
    var ms = typeof v === "number" ? v : Date.parse(v || "");
    if (!isFinite(ms)) return null;
    try {
      IST = IST || new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
      var p = {};
      IST.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
      return p.year + "-" + p.month + "-" + p.day;
    } catch (e) {
      return new Date(ms + 3 * 3600e3).toISOString().slice(0, 10);
    }
  }
  /** Bugün (ya da önce) vadesi gelen akıllı tekrar sayısı (oyun.js tekrarZamani(...).length ile aynı) */
  function vadeSay(tekrar, gun) {
    var t = tekrar && typeof tekrar === "object" && !Array.isArray(tekrar) ? tekrar : {}, n = 0;
    Object.keys(t).forEach(function (k) {
      var e = t[k];
      if (e && typeof e === "object" && !e.silindi && e.kutu >= 1 && typeof e.sonraki === "string" && e.sonraki <= gun) n++;
    });
    return n;
  }

  /**
   * Bugün'ün tek bağlamsal kartı (saf): en acil olanı seçer.
   * o = { tekrar: vadesi gelen soru sayısı, yaklasanGun: en yakın tarihe kalan gün (yoksa null),
   *       denemeGun: son denemeden bu yana gün (hiç yoksa null), cevap: toplam çözülen soru }
   * Puan: yaklaşan ≤3 gün 100, ≤7 gün 80, ≤14 gün 50, daha uzak 15 · tekrar 70 + min(adet, 10) ·
   *       deneme son 2 günde 60 (sonucu taze), daha eski 30; hiç yoksa ve 20+ soru çözüldüyse 25 (ilk deneme önerisi).
   * Eşitlikte yaklaşan > tekrar > deneme. Aday yoksa "deneme" (boş durumu "Denemeye başla" der).
   */
  function baglamKartiSec(o) {
    o = o || {};
    var aday = [];
    var yg = o.yaklasanGun == null || o.yaklasanGun === "" ? NaN : +o.yaklasanGun;
    if (isFinite(yg) && yg >= 0) aday.push({ tur: "yaklasan", puan: yg <= 3 ? 100 : yg <= 7 ? 80 : yg <= 14 ? 50 : 15 });
    var tk = +o.tekrar || 0;
    if (tk > 0) aday.push({ tur: "tekrar", puan: 70 + Math.min(tk, 10) });
    var dg = o.denemeGun == null || o.denemeGun === "" ? NaN : +o.denemeGun;
    if (isFinite(dg)) aday.push({ tur: "deneme", puan: dg <= 2 ? 60 : 30 });
    else if ((+o.cevap || 0) >= 20) aday.push({ tur: "deneme", puan: 25 });
    var SIRA = ["yaklasan", "tekrar", "deneme"];
    aday.sort(function (a, b) { return b.puan - a.puan || SIRA.indexOf(a.tur) - SIRA.indexOf(b.tur); });
    return aday.length ? aday[0].tur : "deneme";
  }

  /** Bulunma eki (-da/-de/-ta/-te), yabancı ders adları için: son ünlü (sondaki y = i) ve sert ünsüz (fıstıkçı şahap). */
  function bulunmaEki(ad) {
    var k = String(ad == null ? "" : ad).trim().toLocaleLowerCase("tr").replace(/[^a-zçğıöşü0-9]+$/, "");
    var son = null;
    for (var i = k.length - 1; i >= 0; i--) {
      var c = k.charAt(i);
      if ("aeıioöuü".indexOf(c) >= 0 || (c === "y" && i === k.length - 1)) { son = c; break; }
    }
    var kalin = son !== null && "aıou".indexOf(son) >= 0;
    var sert = "fstkçşhp".indexOf(k.charAt(k.length - 1)) >= 0;
    return (sert ? "t" : "d") + (kalin ? "a" : "e");
  }
  /** "Calculus’ta %40!" */
  function dersYuzdeMetni(ad, yuzde) {
    ad = String(ad == null ? "" : ad).trim() || "Bu ders";
    return ad + "’" + bulunmaEki(ad) + " %" + Math.max(0, Math.min(100, Math.round(+yuzde || 0))) + "!";
  }

  /** Üst üste doğru sayacı: doğruysa +1, yanlışsa 0. Balon tam eşikte (3) bir kez çıkar. */
  function ustUsteIlerle(n, dogru) { return dogru ? (Math.max(0, n | 0) + 1) : 0; }
  function ustUsteKutlansinMi(n) { return n === USTUSTE_ESIK; }

  // --- Öğrenme yolu yerleşimi -------------------------------------------------------------
  var YOL_UST = 24; // ilk sıradaki düğümün üstünde maskot başına yer
  function r1(x) { return Math.round(x * 10) / 10; }
  /**
   * Kıvrımlı yol yerleşimi (saf). mod "dikey": dar şeritte zikzak (ders sayfası ünite merkezi; telefonda da dikey).
   * mod "serit": satır satır yılan (Çalış kartları; sutun = satırdaki düğüm sayısı, kart genişliğinden).
   * Dönüş: { mod, genislik, yukseklik, noktalar: [{x, y, satir}], segmentler: ["M…" | " C…"] } — d = segmentler.join("")
   */
  function yolDuzeni(n, o) {
    o = o || {};
    n = Math.max(0, Math.floor(+n || 0));
    var mod = o.mod === "serit" ? "serit" : "dikey";
    var p = [], seg = [], G, Y, i;
    if (mod === "dikey") {
      var H = +o.satir || 76, W = +o.genislik || 112, A = o.genlik == null ? 26 : +o.genlik, PAT = [0, 1, 0, -1];
      for (i = 0; i < n; i++) p.push({ x: r1(W / 2 + A * PAT[i % 4]), y: r1(YOL_UST + H / 2 + i * H), satir: i });
      for (i = 0; i < n; i++) {
        if (!i) { seg.push("M" + p[0].x + " " + p[0].y); continue; }
        var a = p[i - 1], b = p[i], m = r1((b.y - a.y) / 2);
        seg.push(" C" + a.x + " " + r1(a.y + m) + " " + b.x + " " + r1(b.y - m) + " " + b.x + " " + b.y);
      }
      G = W; Y = YOL_UST + n * H;
    } else {
      var S = +o.aralik || 56, R = +o.satir || 72, w = o.dalga == null ? 6 : +o.dalga;
      var sut = Math.max(1, Math.min(Math.floor(+o.sutun || 5), Math.max(1, n)));
      for (i = 0; i < n; i++) {
        var r = Math.floor(i / sut), c = i % sut, col = r % 2 === 0 ? c : sut - 1 - c;
        p.push({ x: r1(S / 2 + col * S), y: r1(YOL_UST + R / 2 + r * R + (sut > 1 ? (i % 2 ? w : -w) : 0)), satir: r });
      }
      for (i = 0; i < n; i++) {
        if (!i) { seg.push("M" + p[0].x + " " + p[0].y); continue; }
        var q0 = p[i - 1], q1 = p[i];
        if (q0.satir === q1.satir) {
          var mx = r1((q0.x + q1.x) / 2);
          seg.push(" C" + mx + " " + q0.y + " " + mx + " " + q1.y + " " + q1.x + " " + q1.y);
        } else {
          var yan = q0.satir % 2 === 0 ? 1 : -1, bx = r1(q0.x + yan * S * 0.5);
          seg.push(" C" + bx + " " + q0.y + " " + bx + " " + q1.y + " " + q1.x + " " + q1.y);
        }
      }
      G = sut * S; Y = YOL_UST + Math.max(1, Math.ceil(n / sut)) * R;
    }
    return { mod: mod, genislik: G, yukseklik: Y, noktalar: p, segmentler: seg };
  }

  function kacis(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var YIK = {
    onay: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    kilit: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
  };
  function yIk(ad) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + YIK[ad] + "</svg>"; }
  var DURUM_AD = { bitti: "tamamlandı", simdi: "sıradaki", acik: "açık", kilitli: "Premium ile açılır" };

  /** Yolun dolu kısmı şimdiki düğüme (yoksa son biten düğüme) kadar gider. */
  function doluSon(dugumler) {
    var k = -1;
    dugumler.forEach(function (d, i) { if (d.durum === "simdi" && k < 0) k = i; });
    if (k >= 0) return k;
    dugumler.forEach(function (d, i) { if (d.durum === "bitti") k = i; });
    return k;
  }

  /**
   * Yol HTML'i (saf). dugumler: oyun.js yolDugumleri çıktısı [{ no, ad, etiket, cevap, toplam, yuzde, durum }].
   * o = { mod, sutun, adres ("/ders/calculus"), ciz (ilk görüş çizimi), basHtml (şimdiki düğümdeki maskot başı) }
   */
  function yolHtml(dugumler, o) {
    o = o || {};
    dugumler = dugumler || [];
    var L = yolDuzeni(dugumler.length, { mod: o.mod, sutun: o.sutun });
    var k = doluSon(dugumler);
    var dTum = L.segmentler.join(""), dDolu = k > 0 ? L.segmentler.slice(0, k + 1).join("") : "";
    var kilitVar = dugumler.some(function (d) { return d.durum === "kilitli"; });
    var dikey = L.mod === "dikey";
    var svg = '<svg class="cn-yol__svg" width="' + L.genislik + '" height="' + L.yukseklik + '" viewBox="0 0 ' + L.genislik + " " + L.yukseklik + '" aria-hidden="true" focusable="false">' +
      (dTum ? '<path class="cn-yol__iz" d="' + dTum + '" pathLength="1"/>' : "") +
      (dDolu ? '<path class="cn-yol__dolu" d="' + dDolu + '" pathLength="1"/>' : "") + "</svg>";
    var lis = dugumler.map(function (d, i) {
      var nk = L.noktalar[i];
      var bilgi = d.toplam && d.durum !== "kilitli" ? d.cevap + " / " + d.toplam + " soru" : "";
      var et = (d.ad || "") + " — " + DURUM_AD[d.durum] + (bilgi ? " (" + bilgi + ")" : "");
      var ic = d.durum === "kilitli" ? yIk("kilit") : d.durum === "bitti" ? yIk("onay") : '<span class="cn-dugum__no">' + kacis(d.etiket || d.no) + "</span>";
      var href = (o.adres || "") + "?unite=" + d.no;
      var tilo = d.durum === "simdi" && o.basHtml ? '<span class="cn-tilo" aria-hidden="true">' + o.basHtml + "</span>" : "";
      var ipucu = d.durum === "kilitli" ? ' data-ipucu="Premium ile açılır"' : "";
      var akim = d.durum === "simdi" ? ' aria-current="step"' : "";
      var stil = dikey ? "top:" + r1(nk.y - 38) + "px;--x:" + nk.x + "px;--sira:" + Math.min(i, 9)
        : "left:" + nk.x + "px;top:" + nk.y + "px;--sira:" + Math.min(i, 9);
      var daire = '<span class="cn-dugum__daire" style="--y:' + (d.yuzde || 0) + '%">' + ic + "</span>";
      var govde = dikey
        ? daire + '<span class="cn-dugum__ad"><b>' + kacis(d.ad) + "</b><small>" + kacis(d.durum === "kilitli" ? "Premium ile açılır" : d.durum === "bitti" ? "Tamamlandı" + (bilgi ? " · " + bilgi : "") : bilgi ? bilgi + (d.cevap ? " · %" + (d.yuzde || 0) : "") : "Konu anlatımı") + "</small></span>"
        : daire;
      return '<li class="cn-dugum is-' + d.durum + '" style="' + stil + '">' + tilo +
        '<a class="cn-dugum__git" href="' + kacis(href) + '"' + (dikey ? "" : ' title="' + kacis(et) + '"') + ' aria-label="' + kacis(et) + '"' + akim + ipucu + ">" + govde + "</a></li>";
    }).join("");
    return '<nav class="cn-yol cn-yol--' + L.mod + (o.ciz ? " is-ciz" : "") + '" aria-label="Öğrenme yolu">' +
      '<div class="cn-yol__alan" style="height:' + L.yukseklik + "px;" + (dikey ? "--yol-g:" + L.genislik + "px" : "width:" + L.genislik + "px") + '">' + svg +
      '<ol class="cn-yol__liste">' + lis + "</ol></div>" +
      (kilitVar ? '<p class="cn-yol__not">' + yIk("kilit") + 'Kilitli üniteler <a href="/premium">Premium ile</a> açılır.</p>' : "") + "</nav>";
  }

  var CEKIRDEK = {
    SERI_ESIK: SERI_ESIK, USTUSTE_ESIK: USTUSTE_ESIK, TEHLIKE_SAATI: TEHLIKE_SAATI, TEHLIKE_MESAJ: TEHLIKE_MESAJ, YOL_UST: YOL_UST,
    alevKademe: alevKademe, seriEsikMi: seriEsikMi, seriTehlikede: seriTehlikede, selamDurumu: selamDurumu,
    istGun: istGun, vadeSay: vadeSay, baglamKartiSec: baglamKartiSec, bulunmaEki: bulunmaEki, dersYuzdeMetni: dersYuzdeMetni,
    ustUsteIlerle: ustUsteIlerle, ustUsteKutlansinMi: ustUsteKutlansinMi, yolDuzeni: yolDuzeni, yolHtml: yolHtml, doluSon: doluSon
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = CEKIRDEK; return; }
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // =====================================================================================
  // 2. TARAYICI
  // =====================================================================================
  var C = CEKIRDEK;
  kok.MeberraCanli = C;

  function azHareket() { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function oku(k, v) { try { var r = localStorage.getItem(k); return r == null ? v : JSON.parse(r); } catch (e) { return v; } }
  // Canlı katmanın kendi küçük işaretleri: "meberra-canli:" öneki (apmeberra: değil → hesap senkronuna girmez)
  function isaretOku(k, ss) { try { return (ss ? sessionStorage : localStorage).getItem("meberra-canli:" + k); } catch (e) { return null; } }
  function isaretYaz(k, v, ss) { try { (ss ? sessionStorage : localStorage).setItem("meberra-canli:" + k, String(v)); } catch (e) { /* kapalı depo */ } }
  function sayiTR(n) { try { return Number(n).toLocaleString("tr-TR"); } catch (e) { return String(n); } }
  function M() { return window.MeberraMaskot || null; }
  function K() { return window.MeberraKutlama || null; }
  function O() { return window.MEBERRA_OYUN || null; }
  function ME() { return window.APMEBERRA_ME || null; }
  function oturumVar() { var m = ME(); return !!(m && m.user); }
  function apModeli() { var m = ME(); return !(m && m.profile && m.profile.ogrenciModeli === "uni-mezun"); }
  function ilkAd() { var m = ME(); return m && m.user ? String(m.user.ad || "").trim().split(/\s+/)[0] : ""; }
  function denemeler() { try { return window.APMEBERRA && window.APMEBERRA.denemeler ? window.APMEBERRA.denemeler() : []; } catch (e) { return []; } }
  function hazir(f) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", f, { once: true }); else f(); }
  /** Bağımlılık gelene kadar kısa aralıklarla dener (dinamik yükleyicide sıra garanti değil). */
  function bekle(kosul, f, kalan) {
    kalan = kalan == null ? 20 : kalan;
    if (kosul()) { f(); return; }
    if (kalan > 0) setTimeout(function () { bekle(kosul, f, kalan - 1); }, 150);
  }
  /** Tek seferlik CSS animasyon sınıfı (hareket.css): yeniden tetiklenebilir, bitince kalkar. */
  function sinifOynat(el, sinif, sure) {
    if (!el || !el.classList || azHareket()) return;
    el.classList.remove(sinif);
    void el.offsetWidth;
    el.classList.add(sinif);
    setTimeout(function () { el.classList.remove(sinif); }, sure || 700);
  }
  function kutla(o) { var k = K(); return k ? k.kutla(o) : Promise.resolve(null); }
  function buyukAcik() { return !!document.querySelector(".kt-perde"); }

  // --- Navbar XP çipi -----------------------------------------------------------------------
  var ucus = null, ucusBekliyor = false;
  function toplamXp() {
    var o = O();
    if (!o) return null;
    var pr = oku(o.K.quiz, null) || {}, oy = oku(o.K.oyun, null) || {};
    try { return o.toplamXp(o.cevapListesi(pr), denemeler(), oy); } catch (e) { return null; }
  }
  function cipler() { return Array.prototype.slice.call(document.querySelectorAll("[data-xp-sayac]")); }
  function gorunurCip() {
    var l = cipler();
    for (var i = 0; i < l.length; i++) {
      var r = l[i].getBoundingClientRect();
      if (r.width && r.height && r.bottom > 0 && r.top < window.innerHeight) return l[i];
    }
    return null;
  }
  function cipGuncelle(animasyon) {
    var xp = toplamXp();
    if (xp == null) return;
    cipler().forEach(function (c) {
      var s = c.querySelector("[data-xp-deger]") || c;
      var eski = parseInt(String(s.textContent).replace(/\D/g, ""), 10);
      c.setAttribute("aria-label", "Toplam " + sayiTR(xp) + " XP");
      c.setAttribute("title", "Toplam " + sayiTR(xp) + " XP");
      if (eski === xp) return;
      if (animasyon && K() && isFinite(eski)) K().sayiSay(s, xp, { sure: 420 });
      else s.textContent = sayiTR(xp);
    });
  }

  // --- Cevap geri bildirimi -----------------------------------------------------------------
  var ustUste = 0;
  function xpMiktari() { var o = O(); return o && o.XP ? o.XP.soru + o.XP.dogru : 10; }
  function geriBildirim(d, ucsun, ustUsteKutla) {
    var kart = document.getElementById("q-card-" + d.soruId);
    var kap = document.getElementById("opts-container-" + d.soruId) ||
      (kart && kart.querySelector(".options-container")) ||
      document.querySelector('#tekrar-govde .options-container[data-cevaplandi]');
    var fb = document.getElementById("feedback-" + d.soruId) || document.getElementById("oy-tq-geri");
    var bitti = false;
    var sonra = function () {
      if (bitti) return;
      bitti = true;
      ucusBekliyor = false;
      cipGuncelle(true);
      if (ustUsteKutla) kutla({ tur: "rozet", buyuk: false, ifade: "sevincli", baslik: "Üst üste " + C.USTUSTE_ESIK + "!", metin: "Harika gidiyorsun, böyle devam." });
      seriKontrol();
    };
    if (d.dogru) {
      var b = kap && kap.querySelector(".option-btn.correct");
      sinifOynat(b, "h-zipla");
      var hedef = ucsun ? gorunurCip() : null;
      if (hedef && b && K() && !buyukAcik()) {
        ucus = K().xpUcur(b, hedef, xpMiktari()).then(function () { ucus = null; sonra(); });
        // Arka plandaki sekmede animasyon bitmeyebilir: uçuş süresinden sonra yine de devam et
        setTimeout(function () { ucus = null; sonra(); }, 1200);
        return;
      }
    } else {
      sinifOynat(kap && kap.querySelector(".option-btn.wrong"), "h-salla", 400);
      if (fb && !azHareket()) { fb.classList.remove("cn-kay"); void fb.offsetWidth; fb.classList.add("cn-kay"); }
    }
    sonra();
  }
  window.addEventListener("meberra:cevap", function (e) {
    var d = (e && e.detail) || {};
    if (!d.soruId) return;
    ustUste = C.ustUsteIlerle(ustUste, !!d.dogru);
    var ustUsteKutla = C.ustUsteKutlansinMi(ustUste);
    var ucsun = !!(d.dogru && d.yeni);
    if (ucsun) ucusBekliyor = true;
    // Arayüz (şık sınıfları, açıklama) cevap kaydından SONRA uygulanır: bir sonraki görevde bak
    setTimeout(function () { geriBildirim(d, ucsun, ustUsteKutla); }, 0);
  });
  window.addEventListener("meberra:oyun", function () {
    setTimeout(function () { if (!ucusBekliyor && !ucus) cipGuncelle(true); }, 0);
  });
  window.addEventListener("storage", function (e) { if (!e.key || /^apmeberra:(oyun|quiz|deneme)/.test(e.key)) cipGuncelle(false); });

  // --- Seri eşiği: büyük kart (bir kez) ------------------------------------------------------
  var SERI_METIN = {
    7: "Bir hafta boyunca her gün çalıştın. Bu artık bir alışkanlık!",
    30: "Tam bir ay, her gün. Kendinle gurur duyabilirsin.",
    100: "100 gün! Azmin gerçekten ilham verici."
  };
  function seriKontrol() {
    var o = O();
    if (!o || !oturumVar() || !apModeli()) return;
    var v = oku(o.K.seri, null), pr = oku(o.K.quiz, null) || {};
    var gun = o.istGun(Date.now());
    var seri = 0;
    try { seri = o.seriHesapla(o.calismaGunleri(o.cevapListesi(pr), denemeler()), v && Array.isArray(v.donmus) ? v.donmus : [], gun); } catch (e) { return; }
    if (!C.seriEsikMi(seri)) return;
    var anahtar = seri + "|" + o.gunEkle(gun, 1 - seri); // aynı zincirde bir kez (seri baştan başlarsa yeniden)
    if (isaretOku("seri-kutlandi") === anahtar) return;
    isaretYaz("seri-kutlandi", anahtar);
    kutla({
      tur: "seri", gun: seri, ifade: "kutlama", baslik: seri + " gün seri!",
      metin: SERI_METIN[seri] || seri + " gün üst üste çalıştın. Muhteşem bir istikrar!",
      paylas: { baslik: seri + " gün seri!", alt: "Her gün biraz, her gün ileri.", ad: ilkAd() }
    });
  }

  // --- Deneme sonucu ---------------------------------------------------------------------------
  window.addEventListener("meberra:deneme-bitti", function (e) {
    var d = (e && e.detail) || {};
    setTimeout(function () { cipGuncelle(false); }, 0);
    if (d.mod === "yanlislar") {
      if (d.dogru > 0) kutla({ tur: "rozet", buyuk: false, ifade: "sevincli", baslik: d.dogru + " hata kapandı!", metin: "Yanlışlarını düzeltmek en hızlı ilerleme yolu." });
      return;
    }
    var band = +d.band || 0;
    if (!band) { kutla({ tur: "rozet", buyuk: false, ifade: "sevincli", baslik: "Deneme tamam!", metin: "Sonuçların aşağıda, ders ders.", xp: 50 }); return; }
    var bandEl = document.querySelector(".dn-skor-band"), degEl = document.querySelector(".dn-sb-deger");
    // Bant < 3: umutlu maskot + sonraki adım. Teslim tıklamasıyla aynı anda eklenir (kullanıcı girdisi → kayma sayılmaz).
    if (band < 3) {
      var skor = document.querySelector(".dn-skor");
      var git = document.querySelector('[data-eylem="yanlislar"]');
      if (skor && M()) {
        var kap = document.createElement("div");
        kap.className = "mk-konus cn-umut";
        kap.innerHTML = '<div class="mk-konus__maskot">' + M().html("uzgun", { boyut: 84, etiket: false }) + "</div>" +
          '<div class="mk-balon"><p class="mk-balon__metin"><strong class="mk-balon__ad">' + kacis(M().MASKOT_ADI) + ":</strong> Her deneme bir adım ileri. Sıradaki adım: " +
          '<a href="' + kacis(git ? git.getAttribute("href") : "/deneme?mod=yanlislar") + '">Yanlışlarını tekrar et →</a></p></div>';
        skor.parentNode.insertBefore(kap, skor.nextSibling);
      }
    }
    var sayaclar = [];
    if (bandEl && K()) { bandEl.textContent = "1"; sayaclar.push(K().sayiSay(bandEl, band, { sure: 900 })); }
    if (degEl && K()) {
      degEl.innerHTML = '%<span class="h-sayac">0</span>';
      sayaclar.push(K().sayiSay(degEl.querySelector("span"), Math.max(0, Math.min(100, +d.yuzde || 0)), { sure: 900 }));
    }
    Promise.all(sayaclar).then(function () {
      sinifOynat(bandEl, "h-zipla");
      if (band < 3) return;
      setTimeout(function () {
        var ders = String(d.ad || "").replace(/^AP\s+/, "");
        kutla({
          tur: "deneme", ifade: "kutlama", baslik: "Tahmini " + band + "!",
          metin: (ders ? ders + " denemesinde " : "") + "%" + (+d.yuzde || 0) + " başarı. Böyle devam!", xp: 50,
          paylas: { baslik: "Tahmini " + band + "!", alt: (ders ? ders + " denemesi · " : "") + "%" + (+d.yuzde || 0) + " başarı", ders: ders, ad: ilkAd() }
        });
      }, 240);
    });
  });

  // --- Öğrenme yolu çizimi (oyun.js çağırır) ----------------------------------------------------
  /**
   * el içine yolu çizer. o = { mod: "dikey" | "serit", adres, anahtar }. Serit kipinde sütun sayısı kart genişliğinden;
   * genişlik değişince (ResizeObserver) çizimsiz yeniden yerleşir. Çizim (yolun kendini çizmesi) oturumda ilk görüşte bir kez.
   */
  function yolCiz(el, dugumler, o) {
    if (!el) return;
    o = o || {};
    var mod = o.mod === "serit" ? "serit" : "dikey";
    var sutun = mod === "serit" ? Math.max(2, Math.floor(((el.clientWidth || 300) + 8) / 56)) : 0;
    var anahtar = "yol:" + (o.anahtar || location.pathname);
    var ciz = !azHareket() && !isaretOku(anahtar, true) && !el._cnCizildi;
    var bas = M() ? M().html("sevincli", { boyut: 34, sadeceBas: true, etiket: false }) : "";
    el.innerHTML = yolHtml(dugumler, { mod: mod, sutun: sutun, adres: o.adres, ciz: ciz, basHtml: bas });
    el._cnCizildi = true;
    if (ciz) isaretYaz(anahtar, "1", true);
    el._cnSutun = sutun;
    if (mod === "serit" && window.ResizeObserver && !el._cnRO) {
      el._cnRO = new ResizeObserver(function () {
        var s = Math.max(2, Math.floor(((el.clientWidth || 300) + 8) / 56));
        if (s !== el._cnSutun) yolCiz(el, el._cnDugumler, el._cnO);
      });
      el._cnRO.observe(el);
    }
    el._cnDugumler = dugumler; el._cnO = o;
  }
  C.yolCiz = yolCiz;

  // --- Boş durumlar ------------------------------------------------------------------------------
  /** [data-maskot="ifade"] yer tutucusunu doldurur (boyut: data-boyut, yalnız baş: data-bas). Yer tutucu boyutu CSS'te ayrılır. */
  function maskotDoldur(el) {
    var m = M();
    if (!m || el.getAttribute("data-maskot-dolu")) return;
    var boyut = +el.getAttribute("data-boyut") || 96;
    el.innerHTML = m.html(el.getAttribute("data-maskot"), { boyut: boyut, sadeceBas: el.hasAttribute("data-bas"), etiket: false });
    el.setAttribute("data-maskot-dolu", "1");
    el.setAttribute("aria-hidden", "true");
  }
  function bosDurumlar() {
    var m = M();
    if (!m) return;
    Array.prototype.forEach.call(document.querySelectorAll("[data-maskot]:not([data-maskot-dolu])"), maskotDoldur);
    // Yanlışlarım (deneme.html?mod=yanlislar): açık hata yoksa sevinçli maskot
    var yb = document.getElementById("dn-yanlis-bos");
    if (yb && !yb.getAttribute("data-cn")) {
      yb.setAttribute("data-cn", "1");
      var h = yb.querySelector("h2"), ik = yb.querySelector(".dn-empty-ico");
      var hicYok = h && /^Açık hatan yok/.test(h.textContent);
      if (hicYok) h.textContent = "Hiç yanlışın yok!";
      if (ik) { ik.className = "dn-empty-ico cn-bos-maskot"; ik.innerHTML = m.html(hicYok ? "sevincli" : "dusunen", { boyut: 104, etiket: false }); }
    }
    // İlerleme › Yanlışlarım boş durumu (metni ilerleme.html yazar; burada yalnız çizim)
    var ee = document.getElementById("err-empty");
    if (ee && !ee.hidden) {
      var t = (document.getElementById("err-empty-title") || {}).textContent || "";
      var ifade = /filtrede/.test(t) ? "dusunen" : "sevincli";
      var yer = ee.querySelector(".cn-bos-maskot");
      if (!yer) {
        var eski = ee.querySelector(":scope > svg");
        yer = document.createElement("span");
        yer.className = "cn-bos-maskot";
        if (eski) ee.replaceChild(yer, eski); else ee.insertBefore(yer, ee.firstChild);
      }
      if (yer.getAttribute("data-ifade") !== ifade) { yer.setAttribute("data-ifade", ifade); yer.innerHTML = m.html(ifade, { boyut: 96, etiket: false }); }
    }
  }
  var bosZaman = null;
  function bosIzle() {
    bosDurumlar();
    if (!window.MutationObserver || !document.body) return;
    new MutationObserver(function () {
      if (bosZaman) return;
      bosZaman = (window.requestAnimationFrame || setTimeout)(function () { bosZaman = null; bosDurumlar(); });
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
  }

  // --- Kart → ders sayfası paylaşılan öğe geçişi -------------------------------------------------
  // Ders sayfası bağlantısı: temiz adres (/ders/calculus, ?unite= ve #capa olabilir) ya da eski ap-x.html
  var DERS_RE = /^(?:\/ders\/[a-z-]+|(?:\.?\/)?(?:ap-[a-z]+|sinav-cents)\.html)(?:[?#].*)?$/;
  function vtTemizle() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-cn-vt]"), function (x) { x.style.viewTransitionName = ""; x.removeAttribute("data-cn-vt"); });
  }
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var kart = a.closest(".cd-kart, .bg-ders");
    if (!kart || !DERS_RE.test(a.getAttribute("href") || "")) return;
    vtTemizle();
    kart.style.viewTransitionName = "cn-ders"; // sayfada tek: tıklanan kart
    kart.setAttribute("data-cn-vt", "1");
  }, true);
  window.addEventListener("pageshow", vtTemizle);

  // --- Açılış ------------------------------------------------------------------------------------
  hazir(function () {
    bekle(function () { return !!M(); }, bosIzle);
    bekle(function () { return !!O(); }, function () { cipGuncelle(false); seriKontrol(); });
  });
})(typeof window !== "undefined" ? window : this);
