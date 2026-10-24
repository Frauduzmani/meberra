/* ==========================================================================
   MEBERRA 1.25.0 — A2 İngilizce köprüsü: soru metninde bilmediğin kelimeye dokun → Türkçesi, kökü, sesli okunuşu.
   - Sayfadaki metin DEĞİŞTİRİLMEZ (formüller/MathJax bozulmaz): dokunulan noktadaki kelime tarayıcının imleç konumundan
     bulunur (caretPositionFromPoint / caretRangeFromPoint). Soru kökü ve FRQ metninde dokunma; şıklarda (düğme) uzun basma.
   - Sözlük: /data/sozluk/ap-sozluk.json { kelimeler: { kelime: { tr, t: temel|akademik|ap, l: kök } }, ifadeler: { "çok kelimeli": tr } }
     ilk dokunuşta bir kez yüklenir. Üretici: araclar/sozluk-olustur.js.
   - Tercih (cihaz başına): localStorage "meberra:tr-yardim" = "kapali" ise kapalı. Az kullanan öğrenciye bir kez "kapatabilirsin" önerisi.
   Saf yardımcılar Node'da da çalışır: araclar/testler/kopru-birim-test.js
   ========================================================================== */
(function (kok, kur) {
  "use strict";
  var api = kur();
  if (typeof module === "object" && module.exports) module.exports = api;
  else kok.MeberraKopru = api;
  if (typeof document !== "undefined") api.baslat();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var HARF = /[A-Za-zÀ-ɏ]/;
  var KELIME = /[A-Za-zÀ-ɏ]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+)*/g;

  function sozlukHazirla(ham) {
    var k = {}, i = {}, n = 1;
    var kel = (ham && ham.kelimeler) || {};
    Object.keys(kel).forEach(function (w) { k[w.toLowerCase()] = kel[w]; });
    var ifa = (ham && ham.ifadeler) || {};
    Object.keys(ifa).forEach(function (p) {
      var a = p.toLowerCase().trim().split(/\s+/);
      if (a.length < 2) return;
      i[a.join(" ")] = ifa[p];
      if (a.length > n) n = a.length;
    });
    return { k: k, i: i, enUzun: Math.min(n, 6) };
  }

  function temizle(w) {
    return String(w || "").toLowerCase().replace(/[’]/g, "'").replace(/^[^a-zà-ɏ]+|[^a-zà-ɏ]+$/g, "").replace(/'s$/, "");
  }

  /** Kelimenin anlamı: kayıtlı biçim → kayıtlı kök → ek kırpma (-s, -es, -ies, -ed, -ing, -ly, -er, -est). Bulunamazsa null. */
  function kelimeBul(S, ham) {
    var w = temizle(ham);
    if (!w || w.length < 2) return null;
    function kayit(x) { var r = S.k[x]; return r && r.tr ? r : null; }
    function sonuc(x, r, kokSozcuk) {
      var o = { kelime: w, tr: r.tr, t: r.t || "akademik" };
      var kk = r.l || kokSozcuk;
      if (kk && kk !== w) o.kok = kk;
      return o;
    }
    var r = kayit(w);
    if (r) return sonuc(w, r, null);
    var adaylar = [];
    if (/ies$/.test(w)) adaylar.push(w.slice(0, -3) + "y");
    if (/es$/.test(w)) adaylar.push(w.slice(0, -2));
    if (/s$/.test(w)) adaylar.push(w.slice(0, -1));
    if (/ied$/.test(w)) adaylar.push(w.slice(0, -3) + "y");
    if (/ed$/.test(w)) { adaylar.push(w.slice(0, -2)); adaylar.push(w.slice(0, -1)); if (/(.)\1ed$/.test(w)) adaylar.push(w.slice(0, -3)); }
    if (/ing$/.test(w)) { adaylar.push(w.slice(0, -3)); adaylar.push(w.slice(0, -3) + "e"); if (/(.)\1ing$/.test(w)) adaylar.push(w.slice(0, -4)); }
    if (/ly$/.test(w)) adaylar.push(w.slice(0, -2));
    if (/est$/.test(w)) adaylar.push(w.slice(0, -3));
    if (/er$/.test(w)) adaylar.push(w.slice(0, -2));
    for (var j = 0; j < adaylar.length; j++) {
      var a = adaylar[j];
      if (a.length < 2) continue;
      var ra = kayit(a);
      if (ra) return sonuc(a, ra, a);
    }
    return null;
  }

  /** Metindeki kelimeler: [{ w, bas, son }] */
  function kelimeler(metin) {
    var o = [], m;
    KELIME.lastIndex = 0;
    while ((m = KELIME.exec(String(metin || "")))) o.push({ w: m[0], bas: m.index, son: m.index + m[0].length });
    return o;
  }

  /** Ofsetteki (ya da hemen solundaki) kelime: { kelime, sira, bas, son } ya da null (tek harf / harf yok). */
  function kelimeAyikla(metin, ofset) {
    var l = kelimeler(metin);
    for (var i = 0; i < l.length; i++) {
      if (ofset >= l[i].bas && ofset <= l[i].son) {
        if (l[i].w.length < 2 || !HARF.test(l[i].w)) return null;
        return { kelime: l[i].w, sira: i, bas: l[i].bas, son: l[i].son };
      }
    }
    return null;
  }

  /** i. kelimeyi kapsayan en uzun çok kelimeli terim: { en, tr, bas, son } (kelime sırası) ya da null */
  function ifadeBul(S, w, i) {
    var enIyi = null;
    for (var n = S.enUzun; n >= 2 && !enIyi; n--) {
      for (var b = Math.max(0, i - n + 1); b <= i && b + n <= w.length; b++) {
        var p = w.slice(b, b + n).map(function (x) { return temizle(x.w); }).join(" ");
        if (S.i[p]) { enIyi = { en: p, tr: S.i[p], bas: b, son: b + n - 1 }; break; }
      }
    }
    return enIyi;
  }

  /** Dokunuş sonucu: { kelime, anlam (kelimeBul|null), ifade (ifadeBul|null) } ya da null */
  function ara(S, metin, ofset) {
    var a = kelimeAyikla(metin, ofset);
    if (!a) return null;
    var anlam = kelimeBul(S, a.kelime), ifade = ifadeBul(S, kelimeler(metin), a.sira);
    if (!anlam && !ifade) return { kelime: a.kelime, anlam: null, ifade: null, bas: a.bas, son: a.son };
    return { kelime: a.kelime, anlam: anlam, ifade: ifade, bas: a.bas, son: a.son };
  }

  // ---------------- tarayıcı ----------------
  var ANAHTAR = "meberra:tr-yardim", SAYAC = "meberra:kopru-sayac", IPUCU = "meberra:kopru-ipucu";
  var HEDEF = ".question-body, .frq-soru, .frq-giris, .dn-soru-govde";
  var UZUN = ".option-text";
  var sozluk = null, yukleniyor = null, balon = null, sonOdak = null, bastirTik = false;

  function oku(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function yaz(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* özel pencere */ } }
  function acikMi() { return oku(ANAHTAR) !== "kapali"; }
  function ayarla(acik) {
    yaz(ANAHTAR, acik ? null : "kapali");
    document.documentElement.setAttribute("data-tr-yardim", acik ? "acik" : "kapali");
    try { window.dispatchEvent(new CustomEvent("meberra:tr-yardim", { detail: { acik: acik } })); } catch (e) { /* eski tarayıcı */ }
  }
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function sozlukYukle() {
    if (sozluk) return Promise.resolve(sozluk);
    if (!yukleniyor) yukleniyor = fetch("/data/sozluk/ap-sozluk.json", { credentials: "same-origin" })
      .then(function (r) { if (!r.ok) throw new Error("sözlük " + r.status); return r.json(); })
      .then(function (j) { sozluk = sozlukHazirla(j); return sozluk; })
      .catch(function (e) { yukleniyor = null; throw e; });
    return yukleniyor;
  }

  function imlec(x, y) {
    if (document.caretPositionFromPoint) { var p = document.caretPositionFromPoint(x, y); return p ? { dugum: p.offsetNode, ofset: p.offset } : null; }
    if (document.caretRangeFromPoint) { var r = document.caretRangeFromPoint(x, y); return r ? { dugum: r.startContainer, ofset: r.startOffset } : null; }
    return null;
  }
  function yasakAlan(el) { return !el || !el.closest || !!el.closest("mjx-container, .MathJax, code, pre, svg, input, textarea, select, a, .kb-balon"); }

  function vurgula(dugum, bas, son) {
    try {
      if (!window.CSS || !CSS.highlights || typeof Highlight === "undefined") return;
      var r = document.createRange(); r.setStart(dugum, bas); r.setEnd(dugum, son);
      CSS.highlights.set("kb-vurgu", new Highlight(r));
    } catch (e) { /* desteklenmiyor */ }
  }
  function vurguSil() { try { if (window.CSS && CSS.highlights) CSS.highlights.delete("kb-vurgu"); } catch (e) { /* yok */ } }

  function seslendir(metin) {
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(metin); u.lang = "en-US"; u.rate = 0.85;
      window.speechSynthesis.speak(u);
    } catch (e) { /* ses yok */ }
  }

  var ROZET = { ap: "AP terimi", akademik: "Sınav kelimesi", temel: "Günlük kelime" };
  function balonKapat() {
    if (!balon) return;
    balon.hidden = true; vurguSil();
    if (sonOdak && sonOdak.focus) { try { sonOdak.focus({ preventScroll: true }); } catch (e) { /* yok */ } }
    sonOdak = null;
  }
  function balonAc(s, x, y) {
    if (!balon) {
      balon = document.createElement("div");
      balon.className = "kb-balon"; balon.setAttribute("role", "dialog"); balon.hidden = true;
      document.body.appendChild(balon);
      balon.addEventListener("click", function (e) {
        var b = e.target.closest("[data-kk]");
        if (!b) return;
        var is = b.getAttribute("data-kk");
        if (is === "kapat") balonKapat();
        else if (is === "dinle") seslendir(b.getAttribute("data-metin"));
        else if (is === "yardim-kapat") { ayarla(false); balonKapat(); }
      });
    }
    var a = s.anlam, f = s.ifade, ses = f ? f.en : s.kelime;
    balon.setAttribute("aria-label", "Kelime: " + s.kelime);
    balon.innerHTML =
      '<div class="kb-ust"><strong lang="en" class="kb-kelime">' + esc(s.kelime) + "</strong>" +
        (window.speechSynthesis ? '<button type="button" class="kb-ikon" data-kk="dinle" data-metin="' + esc(s.kelime) + '" aria-label="Dinle: ' + esc(s.kelime) + '">🔊</button>' : "") +
        '<button type="button" class="kb-ikon kb-x" data-kk="kapat" aria-label="Kapat">×</button></div>' +
      (a ? '<p class="kb-tr">' + esc(a.tr) + "</p>" + (a.kok ? '<p class="kb-kok">kök: <span lang="en">' + esc(a.kok) + "</span></p>" : "") +
          '<span class="kb-rozet kb-' + esc(a.t) + '">' + esc(ROZET[a.t] || "") + "</span>"
        : (f ? "" : '<p class="kb-tr kb-yok">Bu kelime sözlükte yok. Cümlenin geri kalanından anlamı tahmin et ya da “Ne soruyor?” kutusuna bak.</p>')) +
      (f ? '<div class="kb-ifade"><span class="kb-ifade-en" lang="en">“' + esc(f.en) + '”</span> <span aria-hidden="true">→</span> <strong>' + esc(f.tr) + "</strong>" +
          (window.speechSynthesis && ses !== s.kelime ? ' <button type="button" class="kb-ikon" data-kk="dinle" data-metin="' + esc(ses) + '" aria-label="Dinle: ' + esc(ses) + '">🔊</button>' : "") + "</div>" : "") +
      '<button type="button" class="kb-alt" data-kk="yardim-kapat">Kelime yardımını kapat</button>';
    balon.hidden = false;
    var w = balon.offsetWidth, h = balon.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var left = Math.max(8, Math.min(x - w / 2, vw - w - 8)), top = y + 14;
    if (top + h > vh - 8) top = Math.max(8, y - h - 14);
    balon.style.left = left + "px"; balon.style.top = top + "px";
    sayacArtir("bakis");
  }

  function dokunus(x, y) {
    if (!acikMi()) return false;
    var c = imlec(x, y);
    if (!c || !c.dugum || c.dugum.nodeType !== 3) return false;
    var el = c.dugum.parentElement;
    if (yasakAlan(el)) return false;
    var metin = c.dugum.nodeValue;
    var a = kelimeAyikla(metin, c.ofset);
    if (!a) return false;
    sonOdak = document.activeElement;
    sozlukYukle().then(function (S) {
      var s = ara(S, metin, c.ofset);
      if (!s) return;
      vurgula(c.dugum, s.bas, s.son);
      balonAc(s, x, y);
    }).catch(function () {
      balonAc({ kelime: a.kelime, anlam: null, ifade: null }, x, y);
    });
    return true;
  }

  // Az kullanana bir kez "kapatabilirsin" önerisi (kademeli bırakma)
  function sayacOku() { try { return JSON.parse(oku(SAYAC) || "null") || { cevap: 0, bakis: 0, oneri: false }; } catch (e) { return { cevap: 0, bakis: 0, oneri: false }; } }
  function sayacArtir(alan) {
    var s = sayacOku(); s[alan] = (s[alan] || 0) + 1; yaz(SAYAC, JSON.stringify(s));
    if (alan === "cevap" && !s.oneri && s.cevap >= 40 && s.bakis <= 2 && acikMi()) { s.oneri = true; yaz(SAYAC, JSON.stringify(s)); oneriGoster(); }
  }
  function oneriGoster() {
    var K = window.MeberraKutlama;
    var metin = "40 soruda kelime yardımına neredeyse hiç ihtiyacın olmadı. Sınavdaki gibi çalışmak için kapatabilirsin; istersen Profil'den yeniden açarsın.";
    if (K && K.kutla) K.kutla({ tur: "rozet", ifade: "kutlama", baslik: "İngilizcen güçleniyor! 🎉", metin: metin });
  }

  function ipucuGoster() {
    if (oku(IPUCU) || !acikMi()) return;
    var kart = document.querySelector(".question-card .question-body, .frq-soru");
    if (!kart || kart.parentNode.querySelector(".kb-ipucu")) return;
    var p = document.createElement("p");
    p.className = "kb-ipucu";
    p.innerHTML = '<span aria-hidden="true">💡</span> Bilmediğin İngilizce kelimeye dokun, Türkçesi çıksın. Şıklarda kelimeye <strong>basılı tut</strong>. ' +
      '<button type="button" class="kb-ipucu-x" aria-label="İpucunu kapat">Anladım</button>';
    kart.parentNode.insertBefore(p, kart);
    p.querySelector("button").addEventListener("click", function () { yaz(IPUCU, "1"); p.remove(); });
  }

  function baslat() {
    document.documentElement.setAttribute("data-tr-yardim", acikMi() ? "acik" : "kapali");
    document.addEventListener("click", function (e) {
      if (bastirTik) { bastirTik = false; e.preventDefault(); e.stopPropagation(); return; }
      if (balon && !balon.hidden && !e.target.closest(".kb-balon")) balonKapat();
      var h = e.target.closest && e.target.closest(HEDEF);
      if (!h || e.target.closest(UZUN) || (window.getSelection && String(window.getSelection()).length > 1)) return;
      dokunus(e.clientX, e.clientY);
    }, true);
    // Şıklar düğme: kısa dokunuş seçer, 450 ms basılı tutma kelimeyi açar (ardından gelen tık bastırılır)
    var zam = null, bx = 0, by = 0;
    document.addEventListener("pointerdown", function (e) {
      var u = e.target.closest && e.target.closest(UZUN);
      if (!u || !acikMi()) return;
      bx = e.clientX; by = e.clientY;
      clearTimeout(zam);
      zam = setTimeout(function () { if (dokunus(bx, by)) bastirTik = true; }, 450);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (t) { document.addEventListener(t, function () { clearTimeout(zam); }); });
    document.addEventListener("pointermove", function (e) { if (zam && (Math.abs(e.clientX - bx) > 8 || Math.abs(e.clientY - by) > 8)) clearTimeout(zam); });
    document.addEventListener("contextmenu", function (e) { if (e.target.closest && e.target.closest(UZUN) && bastirTik) e.preventDefault(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && balon && !balon.hidden) balonKapat(); });
    window.addEventListener("scroll", function () { if (balon && !balon.hidden) balonKapat(); }, { passive: true });
    window.addEventListener("meberra:sorular-hazir", function () { setTimeout(ipucuGoster, 300); });
    window.addEventListener("meberra:frq-acildi", function () { setTimeout(ipucuGoster, 300); });
    window.addEventListener("meberra:cevap", function () { sayacArtir("cevap"); });
  }

  return { sozlukHazirla: sozlukHazirla, kelimeBul: kelimeBul, kelimeler: kelimeler, kelimeAyikla: kelimeAyikla, ifadeBul: ifadeBul, ara: ara,
    baslat: baslat, acikMi: acikMi, ayarla: ayarla };
});
