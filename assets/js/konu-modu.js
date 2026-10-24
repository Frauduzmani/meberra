/* ==========================================================================
   MEBERRA 1.23.0 — Konu modu (ünite sayfası): konu yolu → konu anlatımı → yalnız o konunun soruları.
   - app.js ünite açıldığında "meberra:unite-acildi" yayar ({sayfa, num, bloklar, kutular}).
   - Ders verisi varsa (data/dersler/<ders>/unite-<n>.json; denetim araclar/ders-veri-denetim.js) her konu için
     hedefler, anlatım, çözümlü örnekler, ipuçları, sık hatalar gösterilir; eski uzun anlatım "Tüm anlatım" ile açılır.
   - Veri yoksa konu yolu soruların konu kodlarından (konuKod, sunucu) kurulur; eski anlatım yerinde kalır.
   - Sorular mevcut soru motoruyla (app.js initInteractiveQuiz) çizilir; burada yalnız kart süzülür (kn-gizli).
   - Seçili konu adreste: ?unite=1&konu=1.6 ("tum" = ünite testi).
   Saf yardımcılar Node'da da çalışır: araclar/testler/konu-modu-birim-test.js
   ========================================================================== */
(function (kok, kur) {
  "use strict";
  const api = kur();
  if (typeof module === "object" && module.exports) module.exports = api;
  else kok.MeberraKonu = api;
  if (typeof document !== "undefined") api.baslat();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const DERS = { "ap-calculus": "calculus", "ap-physics": "physics", "ap-chemistry": "chemistry", "ap-biology": "biology", "ap-english": "english", "ap-electives": "secmeli" };

  /** "1.10" > "1.9": konu kodlarını sayısal sıralar. */
  function kodSirala(a, b) {
    const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number);
    return x[0] - y[0] || x[1] - y[1];
  }
  /** Soru listesinden konu yolu: [{kod, baslik, sayi}] (veri yokken). baslik: konu metninin numarasız kısmı. */
  function sorulardanKonular(sorular, unite) {
    const m = {};
    (sorular || []).forEach(q => {
      if (!q || !q.kod) return;
      if (unite != null && String(q.kod).split(".")[0] !== String(unite)) return;
      const k = m[q.kod] || (m[q.kod] = { kod: q.kod, baslik: "", sayi: 0 });
      k.sayi++;
      if (!k.baslik && q.baslik) k.baslik = String(q.baslik).replace(/^\s*(\[[^\]]*\]\s*)?\d{1,2}\.\d{1,2}[A-Z]?\s*[:·.\-–]?\s*/, "").trim();
    });
    return Object.keys(m).sort(kodSirala).map(k => m[k]);
  }
  /** Ders verisi + sorular: veri konuları sırasıyla, her birine soru sayısı; veride olmayan soru konuları sona eklenir. */
  function konuListesi(veri, sorular, unite) {
    const say = {};
    (sorular || []).forEach(q => { if (q && q.kod) say[q.kod] = (say[q.kod] || 0) + 1; });
    if (!veri || !Array.isArray(veri.konular)) return sorulardanKonular(sorular, unite);
    const L = veri.konular.map(k => ({ kod: k.kod, baslik: k.baslikTr || k.baslik, sayi: say[k.kod] || 0, veri: k }));
    sorulardanKonular(sorular, unite).forEach(k => { if (!L.some(x => x.kod === k.kod)) L.push(k); });
    return L.sort((a, b) => kodSirala(a.kod, b.kod));
  }
  /** Adres sorgusundan seçili konu ("1.6" | "tum" | null). */
  function secimOku(search) {
    const m = /[?&]konu=([0-9]{1,2}\.[0-9]{1,2}|tum)(?:&|$)/.exec(String(search || ""));
    return m ? m[1] : null;
  }
  function secimYaz(search, konu) {
    let s = String(search || "").replace(/^\?/, "").split("&").filter(p => p && !/^konu=/.test(p));
    if (konu) s.push("konu=" + konu);
    return s.length ? "?" + s.join("&") : "";
  }

  // ------------------------------------------------------------------ Arayüz
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  const veriOnbellek = {};
  let dizin = null;
  /** data/dersler/dizin.json ({ders: [ünite no]}) — yalnız var olan dosya istenir (404 yok). Üretici: node araclar/ders-veri-denetim.js --dizin */
  function veriYukle(ders, num) {
    const k = ders + "/" + num;
    if (!dizin) dizin = fetch("/data/dersler/dizin.json", { credentials: "same-origin" }).then(r => (r.ok ? r.json() : {})).catch(() => ({}));
    if (!veriOnbellek[k]) veriOnbellek[k] = dizin.then(D => (Array.isArray(D[ders]) && D[ders].indexOf(num) >= 0
      ? fetch("/data/dersler/" + ders + "/unite-" + num + ".json", { credentials: "same-origin" }).then(r => (r.ok ? r.json() : null)) : null)).catch(() => null);
    return veriOnbellek[k];
  }
  function mathJax(el) {
    const M = window.MathJax;
    if (M && typeof M.typesetPromise === "function") M.typesetPromise([el]).catch(() => {});
  }
  function kartlar(kutular) {
    const out = [];
    (kutular || []).forEach(k => { const el = typeof k === "string" ? document.getElementById(k) : k; if (el) el.querySelectorAll(".question-card").forEach(c => out.push(c)); });
    return out;
  }

  function konuHtml(k, i, n) {
    const v = k.veri;
    let h = '<header class="kn-bas"><p class="kn-ust">Konu ' + esc(k.kod) + (v && v.sadeceBC ? ' · <span class="kn-bc">BC</span>' : "") + " · " + (i + 1) + " / " + n + "</p>" +
      '<h3 class="kn-h" tabindex="-1">' + esc(v ? v.baslikTr : k.baslik || "Konu " + k.kod) + "</h3>" + (v ? '<p class="kn-en" lang="en">' + esc(v.baslik) + "</p>" : "") + "</header>";
    if (!v) return h + '<p class="kn-not">Bu konunun ayrıntılı anlatımı hazırlanıyor; aşağıdaki "Tüm anlatım" ünitenin anlatımını açar. Konunun soruları hemen aşağıda.</p>';
    h += '<section class="kn-kutu kn-hedef" aria-label="Bu konuda öğreneceklerin"><h4>🎯 Bu konuda öğreneceklerin</h4><ul>' + v.hedefler.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></section>";
    h += '<section class="kn-anlatim">' + v.anlatim + "</section>";
    if (Array.isArray(v.terimler) && v.terimler.length) {
      h += '<section class="kn-kutu kn-terim" aria-label="Terimler"><h4>📖 Sınav terimleri</h4><dl>' +
        v.terimler.map(t => '<div><dt lang="en">' + esc(t.en) + "</dt><dd>" + esc(t.tr) + "</dd></div>").join("") + "</dl></section>";
    }
    h += '<section class="kn-ornekler" aria-label="Çözümlü örnekler"><h4>✍️ Çözümlü örnekler</h4>' + v.ornekler.map((e, j) =>
      '<div class="kn-ornek"><p class="kn-ornek-no">Örnek ' + (j + 1) + "</p>" + '<div class="kn-ornek-soru">' + e.soru + "</div>" +
      '<details class="kn-cozum"><summary>Çözümü adım adım göster</summary><ol>' + e.cozum.map(c => "<li>" + c + "</li>").join("") + "</ol></details></div>").join("") + "</section>";
    h += '<div class="kn-iki"><section class="kn-kutu kn-ipucu" aria-label="Sınav ipuçları"><h4>💡 Sınav ipuçları</h4><ul>' + v.ipuclari.map(x => "<li>" + x + "</li>").join("") + "</ul></section>" +
      '<section class="kn-kutu kn-hata" aria-label="Sık yapılan hatalar"><h4>⚠️ Sık yapılan hatalar</h4><ul>' + v.sikHatalar.map(x => "<li>" + x + "</li>").join("") + "</ul></section></div>";
    return h;
  }

  function kur(d) {
    const ders = DERS[d.sayfa], num = d.num && /^\d+$/.test(String(d.num)) ? Number(d.num) : null;
    if (!ders || !num || !d.bloklar || !d.bloklar.length) return;
    const ilk = d.bloklar[0], anlatimBloklari = d.bloklar.filter(b => !b.querySelector || !b.querySelector("[id$='-quiz-container']"));
    const soruBloklari = d.bloklar.filter(b => b.querySelector && b.querySelector("[id$='-quiz-container']"));
    const eski = document.getElementById("kn-" + num);
    if (eski) eski.remove();
    const kn = document.createElement("section");
    kn.className = "kn"; kn.id = "kn-" + num; kn.setAttribute("aria-label", "Konular");
    ilk.parentNode.insertBefore(kn, ilk);
    // Sorular konu panelinin hemen altına (aynı ekran akışı); kimlikler değişmez
    soruBloklari.forEach(b => kn.parentNode.insertBefore(b, kn.nextSibling));
    let veri = null, konular = [], secili = secimOku(location.search), tumAnlatim = false;

    function sorulariTopla() {
      return kartlar(d.kutular).map(c => ({ kod: c.dataset.konu || null, baslik: (c.querySelector(".question-topic") || {}).textContent || "", kart: c }));
    }
    function ilerleme(kod) {
      const L = kartlar(d.kutular).filter(c => c.dataset.konu === kod);
      return { n: L.length, b: L.filter(c => c.classList.contains("state-correct") || c.classList.contains("state-wrong")).length };
    }
    function suz() {
      const hepsi = secili === "tum" || !secili;
      kartlar(d.kutular).forEach(c => c.classList.toggle("kn-gizli", !hepsi && c.dataset.konu !== secili));
      const bos = kn.querySelector(".kn-sorular-bos");
      if (bos) bos.hidden = hepsi || ilerleme(secili).n > 0 || !kartlar(d.kutular).length;
    }
    function yolHtml() {
      return '<nav class="kn-yol" aria-label="Ünitenin konuları"><ol>' + konular.map(k => {
        const p = ilerleme(k.kod), bitti = p.n && p.b >= p.n;
        return '<li><button type="button" class="kn-dugum' + (k.kod === secili ? " is-secili" : "") + (bitti ? " is-bitti" : "") + '" data-kn="' + esc(k.kod) + '"' +
          (k.kod === secili ? ' aria-current="step"' : "") + '><span class="kn-kod">' + esc(k.kod) + '</span><span class="kn-ad">' + esc(k.baslik || "Konu") + '</span>' +
          '<span class="kn-say">' + (p.n ? p.b + "/" + p.n : "") + (bitti ? " ✓" : "") + "</span></button></li>";
      }).join("") + '<li><button type="button" class="kn-dugum kn-test' + (secili === "tum" ? " is-secili" : "") + '" data-kn="tum"><span class="kn-kod">★</span><span class="kn-ad">Ünite testi (tüm sorular)</span></button></li></ol></nav>';
    }
    function ciz(odak) {
      konular = konuListesi(veri, sorulariTopla(), num);
      if (!konular.length) { kn.innerHTML = '<div class="kn-ust-bar"><h2 class="kn-baslik">Konular</h2></div><p class="kn-not">Konular yükleniyor…</p>'; return; } // sorular gelince yeniden çizilir; adresteki seçim korunur
      if (!secili || (secili !== "tum" && !konular.some(k => k.kod === secili))) secili = konular[0].kod;
      const i = konular.findIndex(k => k.kod === secili), k = konular[i];
      let govde;
      if (secili === "tum") govde = '<header class="kn-bas"><p class="kn-ust">Ünite testi</p><h3 class="kn-h" tabindex="-1">Ünitenin tüm soruları</h3></header><p class="kn-not">Konular karışık: sınavdaki gibi hangi konunun sorulduğunu sen tanı.</p>';
      else govde = konuHtml(k, i, konular.length);
      const onceki = i > 0 ? konular[i - 1] : null, sonraki = secili === "tum" ? null : (i < konular.length - 1 ? konular[i + 1] : { kod: "tum", baslik: "Ünite testi" });
      kn.innerHTML = '<div class="kn-ust-bar"><h2 class="kn-baslik">Konular</h2>' +
        (veri ? '<button type="button" class="kn-tum-anlatim" aria-pressed="' + tumAnlatim + '">' + (tumAnlatim ? "Konu konu göster" : "Tüm anlatımı tek sayfada göster") + "</button>" : "") + "</div>" +
        yolHtml() + '<article class="kn-panel" aria-live="polite">' + govde + "</article>" +
        '<div class="kn-sorular-bas"><h3>' + (secili === "tum" ? "Tüm sorular" : "Bu konunun soruları") + '</h3><p class="kn-sorular-bos" hidden>Bu konunun sorusu henüz yok; ünite testini çöz ya da sonraki konuya geç.</p></div>';
      const alt = document.createElement("nav");
      alt.className = "kn-alt"; alt.setAttribute("aria-label", "Konu geçişi");
      alt.innerHTML = (onceki ? '<button type="button" class="kn-onceki" data-kn="' + esc(onceki.kod) + '">← ' + esc(onceki.kod) + "</button>" : "<span></span>") +
        (sonraki ? '<button type="button" class="kn-sonraki" data-kn="' + esc(sonraki.kod) + '">' + (sonraki.kod === "tum" ? "Ünite testi →" : "Sonraki konu: " + esc(sonraki.kod) + " →") + "</button>" : "");
      const eskiAlt = document.getElementById("kn-alt-" + num); if (eskiAlt) eskiAlt.remove();
      alt.id = "kn-alt-" + num;
      const son = soruBloklari[soruBloklari.length - 1] || kn;
      son.parentNode.insertBefore(alt, son.nextSibling);
      // Veri varken eski uzun anlatım gizli ("Tüm anlatım" ile açılır); veri yoksa yerinde kalır
      anlatimBloklari.forEach(b => b.classList.toggle("kn-eski-gizli", !!veri && !tumAnlatim));
      suz(); mathJax(kn);
      if (odak) { const h = kn.querySelector(".kn-h"); if (h) { h.focus({ preventScroll: true }); kn.scrollIntoView({ block: "start", behavior: "smooth" }); } }
    }
    kn.addEventListener("click", e => {
      const b = e.target.closest("[data-kn]");
      if (b) { sec(b.getAttribute("data-kn")); return; }
      if (e.target.closest(".kn-tum-anlatim")) { tumAnlatim = !tumAnlatim; ciz(false); }
    });
    function sec(kod) {
      secili = kod;
      try { history.replaceState(null, "", location.pathname + secimYaz(location.search, kod) + location.hash); } catch (e) { /* file:// */ }
      ciz(true);
    }
    document.addEventListener("click", e => { const b = e.target.closest("#kn-alt-" + num + " [data-kn]"); if (b) sec(b.getAttribute("data-kn")); });
    // Sorular yüklendikçe (ve cevaplandıkça) yol ve süzgeç tazelenir
    window.addEventListener("meberra:sorular-hazir", ev => { if (ev.detail && (d.kutular || []).some(k => (k.id || k) === ev.detail.kutu)) ciz(false); });
    window.addEventListener("meberra:cevap", () => { const y = kn.querySelector(".kn-yol"); if (y) { y.outerHTML = yolHtml(); } });
    ciz(false);
    veriYukle(ders, num).then(v => { if (v && Array.isArray(v.konular)) { veri = v; ciz(false); } });
  }

  function baslat() {
    document.addEventListener("meberra:unite-acildi", e => { try { kur(e.detail || {}); } catch (x) { if (window.console) console.warn("konu modu:", x); } });
  }

  return { kodSirala, sorulardanKonular, konuListesi, secimOku, secimYaz, baslat, _kur: kur };
});
