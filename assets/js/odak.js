/**
 * Meberra 1.17.0 — Odak sayacı (Pomodoro benzeri). Kitaplıksız; stiller assets/css/odak.css.
 * Bağımlılıklar (isteğe bağlı): MeberraMaskot (Dede Korkut "dusunen"), MeberraKutlama (bitişte küçük kutlama).
 *
 * API (window.MeberraOdak):
 *   baslat({ dk?: 25, mola?: 5 })  odak başlar (dk: 15 | 25 | 45; mola: 3 | 5 | 10)
 *   duraklat() / devam() / durdur()  · durum() → { mod: "bos"|"odak"|"mola", kalanMs, duraklatildi, dk, mola }
 *   panelAc()                        küçük pencereyi açar (süre seçimi + Başla)
 * Başlatıcılar: sayfada #odak-baslat varsa içine "Odak" düğmesi eklenir; [data-odak-ac] öğeleri paneli açar.
 * Kalıcılık: bitiş zamanı localStorage'da ("meberra:odak:v1", yalnız bu cihaz) → sayfa değişse de sayaç sürer.
 * Odaklanılan dakikalar apmeberra:oyun:v1 içine yalnız yeni alan olarak yazılır: odakDk: { "YYYY-MM-DD": n }
 * (Europe/Istanbul günü; günlük hedef "dakika" türündeyse oyun.js bunu okur). Ses yok. Azaltılmış harekette animasyon yok.
 * Saf çekirdek Node'da yüklenir (module.exports): araclar/testler/hiz-birim-test.js
 */
(function (kok) {
  "use strict";
  var DURUM_KEY = "meberra:odak:v1", OYUN_KEY = "apmeberra:oyun:v1";
  var SECENEKLER = [{ dk: 15, mola: 3 }, { dk: 25, mola: 5 }, { dk: 45, mola: 10 }];

  // ---- saf çekirdek ------------------------------------------------------------------------------
  function secenekNormal(o) {
    o = o || {};
    var s = SECENEKLER.filter(function (x) { return x.dk === +o.dk; })[0] || SECENEKLER[1];
    var mola = [3, 5, 10].indexOf(+o.mola) >= 0 ? +o.mola : s.mola;
    return { dk: s.dk, mola: mola };
  }
  /** Yeni odak durumu */
  function yeniDurum(o, now) { var s = secenekNormal(o); return { mod: "odak", dk: s.dk, mola: s.mola, bitis: now + s.dk * 60000, kalan: null, bas: now, kredi: 0 }; }
  /** Kalan süre ve bitti mi (duraklatılmışsa kalan sabittir) */
  function kalanHesap(d, now) {
    if (!d || d.mod === "bos") return { kalanMs: 0, bitti: false };
    var k = d.kalan != null ? d.kalan : Math.max(0, d.bitis - now);
    return { kalanMs: k, bitti: d.kalan == null && now >= d.bitis };
  }
  /** Odak bölümünde şimdiye kadar geçen tam dakika (duraklama düşülmüş) */
  function gecenDk(d, now) {
    if (!d || d.mod !== "odak") return 0;
    var k = kalanHesap(d, now).kalanMs;
    return Math.max(0, Math.floor((d.dk * 60000 - k) / 60000));
  }
  /** Bir sonraki durum: odak bitince molaya geçer (kredi = dk), mola bitince boş. Dönüş: { durum, kredi, olay } */
  function ilerle(d, now) {
    var h = kalanHesap(d, now);
    if (!d || !h.bitti) return { durum: d, kredi: 0, olay: null };
    if (d.mod === "odak") {
      var kredi = Math.max(0, d.dk - (d.kredi || 0));
      return { durum: { mod: "mola", dk: d.dk, mola: d.mola, bitis: d.bitis + d.mola * 60000, kalan: null, bas: d.bitis, kredi: 0 }, kredi: kredi, olay: "odakBitti" };
    }
    return { durum: { mod: "bos" }, kredi: 0, olay: "molaBitti" };
  }
  /** oyun nesnesine dakika ekler (saf; yeni nesne döner): odakDk[gun] += dk, en çok 120 gün tutulur */
  function dakikaEkle(oyun, gun, dk) {
    var o = oyun && typeof oyun === "object" && !Array.isArray(oyun) ? JSON.parse(JSON.stringify(oyun)) : {};
    var m = o.odakDk && typeof o.odakDk === "object" && !Array.isArray(o.odakDk) ? o.odakDk : {};
    if (dk > 0 && /^\d{4}-\d{2}-\d{2}$/.test(gun)) m[gun] = Math.min(1440, (Number(m[gun]) || 0) + Math.round(dk));
    var gunler = Object.keys(m).filter(function (g) { return /^\d{4}-\d{2}-\d{2}$/.test(g); }).sort().slice(-120), out = {};
    gunler.forEach(function (g) { out[g] = m[g]; });
    o.odakDk = out;
    return o;
  }
  function sureYaz(ms) { var s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60), r = s % 60; return m + ":" + (r < 10 ? "0" : "") + r; }

  var CEKIRDEK = { SECENEKLER: SECENEKLER, secenekNormal: secenekNormal, yeniDurum: yeniDurum, kalanHesap: kalanHesap, gecenDk: gecenDk, ilerle: ilerle, dakikaEkle: dakikaEkle, sureYaz: sureYaz };
  if (typeof module === "object" && module.exports) { module.exports = CEKIRDEK; return; }

  // ---- tarayıcı --------------------------------------------------------------------------------------
  var doc = document, kutu = null, panelAcik = false, zamanlayici = null, sonDuyuru = "";
  function oku(k) { try { var r = localStorage.getItem(k); return r == null ? null : JSON.parse(r); } catch (e) { return null; } }
  function yaz(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* kapalı depo */ } }
  function durumOku() { var d = oku(DURUM_KEY); return d && (d.mod === "odak" || d.mod === "mola") ? d : { mod: "bos" }; }
  function istGun(ms) {
    try {
      var p = {}; new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
      return p.year + "-" + p.month + "-" + p.day;
    } catch (e) { return new Date(ms).toISOString().slice(0, 10); }
  }
  function krediYaz(dk) {
    if (!(dk > 0)) return;
    yaz(OYUN_KEY, dakikaEkle(oku(OYUN_KEY), istGun(Date.now()), dk));
    try { doc.dispatchEvent(new CustomEvent("meberra:odak-dakika", { detail: { dk: dk } })); } catch (e) { /* eski tarayıcı */ }
  }
  function kutla(o) { var K = kok.MeberraKutlama; if (K && K.kutla) K.kutla(o); }
  function maskot(ifade) { var M = kok.MeberraMaskot; return M && M.html ? M.html(ifade, { boyut: 44, etiket: false }) : ""; }
  function duyur(m) { var c = kutu && kutu.querySelector(".od-canli"); if (c && m !== sonDuyuru) { sonDuyuru = m; c.textContent = m; } }

  function kur() {
    if (kutu) return kutu;
    kutu = doc.createElement("div");
    kutu.className = "od-kutu";
    kutu.id = "meberra-odak";
    kutu.hidden = true;
    kutu.innerHTML = '<p class="od-canli" aria-live="polite"></p><div class="od-ic" role="group" aria-label="Odak sayacı"></div>';
    kutu.addEventListener("click", function (e) {
      var b = e.target.closest("[data-od]"); if (!b) return;
      var a = b.getAttribute("data-od");
      if (a === "kapat") { panelAcik = false; ciz(); }
      else if (a === "ac") { panelAcik = true; ciz(); }
      else if (a === "baslat") { var s = SECENEKLER[+b.getAttribute("data-i")] || SECENEKLER[1]; api.baslat(s); }
      else if (a === "duraklat") api.duraklat();
      else if (a === "devam") api.devam();
      else if (a === "durdur") api.durdur();
    });
    doc.body.appendChild(kutu);
    return kutu;
  }
  function ciz() {
    var d = durumOku(), ic;
    if (d.mod === "bos" && !panelAcik) { if (kutu) kutu.hidden = true; return; }
    kur(); kutu.hidden = false; ic = kutu.querySelector(".od-ic");
    if (d.mod === "bos") {
      kutu.className = "od-kutu od-kutu--panel";
      ic.innerHTML = '<div class="od-ust"><span class="od-maskot" aria-hidden="true">' + maskot("selam") + '</span><div><b>Odak sayacı</b><span>Telefonu kenara koy, tek işe odaklan.</span></div>' +
        '<button type="button" class="od-x" data-od="kapat" aria-label="Kapat">×</button></div>' +
        '<div class="od-secim">' + SECENEKLER.map(function (s, i) { return '<button type="button" class="od-sec" data-od="baslat" data-i="' + i + '"><b>' + s.dk + ' dk</b><span>' + s.mola + ' dk mola</span></button>'; }).join("") + "</div>";
      return;
    }
    var h = kalanHesap(d, Date.now()), dur = d.kalan != null, toplam = (d.mod === "odak" ? d.dk : d.mola) * 60000;
    var oran = toplam ? 1 - h.kalanMs / toplam : 0;
    kutu.className = "od-kutu od-kutu--" + d.mod + (dur ? " is-durdu" : "") + (panelAcik ? " is-acik" : "");
    var etiket = d.mod === "odak" ? (dur ? "Duraklatıldı" : "Odaktasın") : "Mola";
    if (!ic.querySelector(".od-sure")) {
      ic.innerHTML = '<span class="od-maskot" aria-hidden="true"></span><button type="button" class="od-ozet" data-od="ac" aria-label="Odak sayacını aç"><span class="od-etiket"></span><span class="od-sure h-sayac"></span></button>' +
        '<span class="od-cubuk" aria-hidden="true"><i></i></span><span class="od-eylem"></span>';
    }
    var mk = ic.querySelector(".od-maskot"), ifade = d.mod === "odak" ? "dusunen" : "uykulu";
    if (mk.getAttribute("data-ifade") !== ifade) { mk.innerHTML = maskot(ifade); mk.setAttribute("data-ifade", ifade); }
    ic.querySelector(".od-etiket").textContent = etiket;
    ic.querySelector(".od-sure").textContent = sureYaz(h.kalanMs);
    ic.querySelector(".od-cubuk i").style.transform = "scaleX(" + Math.max(0, Math.min(1, oran)).toFixed(4) + ")";
    var ey = ic.querySelector(".od-eylem"), anahtar = d.mod + (dur ? "d" : "");
    if (ey.getAttribute("data-k") !== anahtar) {
      ey.setAttribute("data-k", anahtar);
      ey.innerHTML = (d.mod === "odak" ? (dur ? '<button type="button" data-od="devam">Devam</button>' : '<button type="button" data-od="duraklat">Duraklat</button>') : "") +
        '<button type="button" data-od="durdur">' + (d.mod === "mola" ? "Molayı bitir" : "Bitir") + "</button>";
    }
    if (d.mod === "odak" && !dur && h.kalanMs % 300000 < 1000) duyur(sureYaz(h.kalanMs) + " kaldı");
  }
  function tik() {
    var d = durumOku(), r = ilerle(d, Date.now());
    if (r.olay) {
      yaz(DURUM_KEY, r.durum.mod === "bos" ? null : r.durum);
      if (r.olay === "odakBitti") {
        krediYaz(r.kredi);
        duyur("Odak bitti. Mola zamanı.");
        kutla({ tur: "hedef", buyuk: false, ifade: "kutlama", baslik: "Odak tamam!", metin: d.dk + " dakika odaklandın. Şimdi " + d.mola + " dakika mola." });
      } else { duyur("Mola bitti."); kutla({ tur: "gorev", ifade: "selam", baslik: "Mola bitti", metin: "Hazırsan yeni bir odak başlat." }); panelAcik = false; }
    }
    ciz();
    var dd = durumOku();
    if (dd.mod === "bos" || dd.kalan != null) { if (zamanlayici) { clearInterval(zamanlayici); zamanlayici = null; } }
    else if (!zamanlayici) zamanlayici = setInterval(tik, 1000);
  }

  var api = {
    baslat: function (o) { yaz(DURUM_KEY, yeniDurum(o, Date.now())); panelAcik = false; duyur("Odak başladı."); tik(); },
    duraklat: function () { var d = durumOku(); if (d.mod !== "odak" || d.kalan != null) return; d.kalan = Math.max(0, d.bitis - Date.now()); yaz(DURUM_KEY, d); duyur("Duraklatıldı."); tik(); },
    devam: function () { var d = durumOku(); if (d.kalan == null) return; d.bitis = Date.now() + d.kalan; d.kalan = null; yaz(DURUM_KEY, d); duyur("Devam."); tik(); },
    durdur: function () {
      var d = durumOku();
      if (d.mod === "odak") { var dk = gecenDk(d, Date.now()); krediYaz(dk); if (dk >= 1) kutla({ tur: "gorev", ifade: "sevincli", baslik: dk + " dakika odak", metin: "Günlük hedefine eklendi." }); }
      yaz(DURUM_KEY, null); panelAcik = false; duyur("Odak sayacı kapandı."); tik();
    },
    durum: function () { var d = durumOku(), h = kalanHesap(d, Date.now()); return { mod: d.mod, kalanMs: h.kalanMs, duraklatildi: d.kalan != null, dk: d.dk || null, mola: d.mola || null }; },
    panelAc: function () { panelAcik = true; ciz(); var b = kutu && kutu.querySelector(".od-sec, [data-od]"); if (b) b.focus(); }
  };
  kok.MeberraOdak = api;

  function baslaticilar() {
    var yer = doc.getElementById("odak-baslat");
    if (yer && !yer.querySelector(".od-baslat")) {
      var b = doc.createElement("button");
      b.type = "button"; b.className = "od-baslat"; b.setAttribute("data-odak-ac", "");
      b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg><span>Odak</span>';
      yer.appendChild(b);
    }
    doc.addEventListener("click", function (e) { var t = e.target.closest && e.target.closest("[data-odak-ac]"); if (t) { e.preventDefault(); api.panelAc(); } });
  }
  function hazir() {
    baslaticilar(); tik();
    doc.addEventListener("visibilitychange", function () { if (!doc.hidden) tik(); });
    kok.addEventListener("storage", function (e) { if (e.key === DURUM_KEY) tik(); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && panelAcik) { panelAcik = false; ciz(); } });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", hazir); else hazir();
})(typeof window !== "undefined" ? window : this);
