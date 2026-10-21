/**
 * Meberra 1.16.0 — küçük, bağımlılıksız SVG/HTML grafik yardımcıları (window.MeberraGrafik; Node'da require ile saf yardımcılar).
 * Stiller: assets/css/grafik.css (renkler orada belirteç olarak; açık/koyu ayrı seçilmiş, dataviz doğrulayıcısından geçti).
 *
 * İlkeler: bölüm başına tek odak grafik · ince işaretler (2px çizgi, ≤24px çubuk, 4px yuvarlak uç) · sessiz ızgara ·
 * seçici etiket (yalnız son/uç değer) · her grafikte üzerine gelince/odakta ipucu, ok tuşlarıyla gezinme ve TABLO alternatifi ·
 * bir kez canlanır (çizilme/büyüme 300–600 ms), yeniden boyutlanınca canlanmaz; azaltılmış harekette hiç canlanmaz.
 *
 * Saf yardımcılar (birim testi: araclar/testler/grafik-birim-test.js):
 *   olcek(d0, d1, r0, r1)            doğrusal ölçek; .ters(px)
 *   tikler(min, max, n)              "güzel" eksen tikleri
 *   cizgiYolu(noktalar)              [[x,y],…] → "M…L…" (null y → boşluk)
 *   alanYolu(noktalar, tabanY)       kapalı alan yolu (boşluklarda parçalı)
 *   kayanDogruluk(gunler, n, enAz)   n günlük kayan doğruluk (%); penceredeki cevap < enAz → null
 *   isiSeviyesi(deger, esikler)      0–4 basamak
 *   isiEsikleri(degerler)            etkin günlerin çeyreklerinden 3 eşik
 *   takvimHaftalari(gunler)          Pazartesi başlı hafta sütunları (gün nesneleri / null)
 *   halkaDash(oran, r)               { cevre, dolu } (stroke-dasharray için)
 *   puanYorumu(tahmini, hedef)       tek satır yorum
 *   sayi(n, ondalik)                 tr-TR biçim
 */
(function (kok, fabrika) {
  "use strict";
  var api = fabrika(kok);
  if (typeof module === "object" && module.exports) module.exports = api;
  else kok.MeberraGrafik = api;
})(typeof window !== "undefined" ? window : this, function (W) {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  var GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  // ---------------------------------------------------------------- saf yardımcılar
  function olcek(d0, d1, r0, r1) {
    var f = function (v) { return d1 === d0 ? (r0 + r1) / 2 : r0 + (v - d0) / (d1 - d0) * (r1 - r0); };
    f.ters = function (p) { return r1 === r0 ? d0 : d0 + (p - r0) / (r1 - r0) * (d1 - d0); };
    f.alan = [d0, d1]; f.aralik = [r0, r1];
    return f;
  }
  function tikler(min, max, n) {
    n = n || 5;
    if (!isFinite(min) || !isFinite(max)) return [];
    if (min === max) return [min];
    var adimHam = (max - min) / Math.max(1, n - 1), us = Math.pow(10, Math.floor(Math.log(adimHam) / Math.LN10)), k = adimHam / us;
    var adim = (k <= 1 ? 1 : k <= 2 ? 2 : k <= 2.5 ? 2.5 : k <= 5 ? 5 : 10) * us;
    var bas = Math.ceil(min / adim - 1e-9) * adim, out = [];
    for (var v = bas; v <= max + adim * 1e-9; v += adim) out.push(+v.toFixed(10));
    return out;
  }
  var yuvarla = function (v) { return Math.round(v * 10) / 10; };
  function cizgiYolu(noktalar) {
    var d = "", acik = false;
    (noktalar || []).forEach(function (p) {
      if (!p || p[1] === null || p[1] === undefined || isNaN(p[1])) { acik = false; return; }
      d += (acik ? "L" : "M") + yuvarla(p[0]) + " " + yuvarla(p[1]);
      acik = true;
    });
    return d;
  }
  function alanYolu(noktalar, tabanY) {
    var parcalar = [], cur = [];
    (noktalar || []).forEach(function (p) {
      if (!p || p[1] === null || p[1] === undefined || isNaN(p[1])) { if (cur.length) parcalar.push(cur); cur = []; return; }
      cur.push(p);
    });
    if (cur.length) parcalar.push(cur);
    return parcalar.map(function (c) {
      return "M" + yuvarla(c[0][0]) + " " + yuvarla(tabanY) + c.map(function (p) { return "L" + yuvarla(p[0]) + " " + yuvarla(p[1]); }).join("") +
        "L" + yuvarla(c[c.length - 1][0]) + " " + yuvarla(tabanY) + "Z";
    }).join("");
  }
  function kayanDogruluk(gunler, n, enAz) {
    n = n || 7; enAz = enAz == null ? 3 : enAz;
    return (gunler || []).map(function (g, i) {
      var c = 0, d = 0;
      for (var j = Math.max(0, i - n + 1); j <= i; j++) { c += gunler[j].cevap || 0; d += gunler[j].dogru || 0; }
      return { gun: g.gun, cevap: c, dogru: d, deger: c >= enAz ? Math.round(d / c * 100) : null };
    });
  }
  function isiEsikleri(degerler) {
    var v = (degerler || []).filter(function (x) { return x > 0; }).sort(function (a, b) { return a - b; });
    if (!v.length) return [1, 2, 3];
    var q = function (p) { return v[Math.min(v.length - 1, Math.floor(p * v.length))]; };
    var e = [q(0.25), q(0.5), q(0.75)];
    for (var i = 1; i < 3; i++) if (e[i] <= e[i - 1]) e[i] = e[i - 1] + 1;
    return e;
  }
  function isiSeviyesi(deger, esikler) {
    if (!deger || deger <= 0) return 0;
    if (deger <= esikler[0]) return 1;
    if (deger <= esikler[1]) return 2;
    if (deger <= esikler[2]) return 3;
    return 4;
  }
  function haftaGunu(gun) { var p = String(gun).split("-").map(Number); var g = new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay(); return (g + 6) % 7; } // 0 = Pzt
  function takvimHaftalari(gunler) {
    var hafta = [], out = [];
    (gunler || []).forEach(function (g, i) {
      var hg = haftaGunu(g.gun);
      if (i === 0) for (var k = 0; k < hg; k++) hafta.push(null);
      hafta.push(g);
      if (hg === 6) { out.push(hafta); hafta = []; }
    });
    if (hafta.length) { while (hafta.length < 7) hafta.push(null); out.push(hafta); }
    return out;
  }
  function halkaDash(oran, r) {
    var cevre = 2 * Math.PI * r, o = Math.max(0, Math.min(1, +oran || 0));
    return { cevre: yuvarla(cevre), dolu: yuvarla(cevre * o) };
  }
  function sayi(n, ondalik) {
    if (n === null || n === undefined || isNaN(n)) return "–";
    return Number(n).toLocaleString("tr-TR", { minimumFractionDigits: ondalik || 0, maximumFractionDigits: ondalik || 0 });
  }
  function puanYorumu(t, h) {
    if (t === null || t === undefined) return "Tahmin için en az 10 soru ya da bir deneme gerekiyor.";
    if (!h) return "Tahmini puanın " + sayi(t, 1) + ". Profilinden hedef puan seçebilirsin.";
    var fark = Math.round((h - t) * 10) / 10;
    if (fark <= 0) return "Hedefindesin. Bu ritmi korumak için haftada bir deneme yeter.";
    if (fark <= 0.5) return "Hedefe çok yakınsın: " + sayi(fark, 1) + " puan kaldı.";
    if (fark <= 1.5) return "Hedefe " + sayi(fark, 1) + " puan var. Zayıf ünitelerle başla.";
    return "Hedefe " + sayi(fark, 1) + " puan var. Kısa ama düzenli çalışma en hızlı yol.";
  }
  function gunEtiket(gun, yil) {
    var p = String(gun).slice(0, 10).split("-").map(Number);
    return p[2] + " " + AYLAR[p[1] - 1] + (yil ? " " + p[0] : "");
  }

  var saf = { olcek: olcek, tikler: tikler, cizgiYolu: cizgiYolu, alanYolu: alanYolu, kayanDogruluk: kayanDogruluk, isiEsikleri: isiEsikleri,
    isiSeviyesi: isiSeviyesi, takvimHaftalari: takvimHaftalari, halkaDash: halkaDash, sayi: sayi, puanYorumu: puanYorumu, gunEtiket: gunEtiket, haftaGunu: haftaGunu };
  if (!W || !W.document) return saf;

  // ---------------------------------------------------------------- DOM
  var D = W.document;
  var hareketAz = function () { try { return W.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); };
  function svgEl(ad, oz) { var e = D.createElementNS(NS, ad); for (var k in oz) if (oz[k] !== null && oz[k] !== undefined) e.setAttribute(k, oz[k]); return e; }
  var sayac = 0;

  /** Grafik kabı: ölçülen genişlikle çizer; yeniden boyutlanınca sessizce (canlanmadan) yeniden çizer. */
  function kur(el, ciz) {
    if (!el) return;
    el.classList.add("gf");
    var ilk = !el.getAttribute("data-gf-cizildi") && !hareketAz();
    var w = Math.max(240, Math.round(el.clientWidth || 320));
    ciz(w, ilk);
    el.setAttribute("data-gf-cizildi", "1");
    if (el._gfRo) el._gfRo.disconnect();
    if (W.ResizeObserver) {
      var son = w, z = null;
      el._gfRo = new W.ResizeObserver(function () {
        var yeni = Math.round(el.clientWidth || 0);
        if (!yeni || Math.abs(yeni - son) < 8) return;
        clearTimeout(z); z = setTimeout(function () { son = yeni; ciz(Math.max(240, yeni), false); }, 120);
      });
      el._gfRo.observe(el);
    }
  }
  /** Tablo alternatifi: <details> içinde (ekran okuyucu + kopyalama) */
  function tablo(baslik, sutunlar, satirlar) {
    return '<details class="gf-tablo"><summary>Tablo olarak gör</summary><div class="gf-tablo-kap"><table><caption class="visually-hidden">' + esc(baslik) + '</caption><thead><tr>' +
      sutunlar.map(function (s) { return '<th scope="col">' + esc(s) + '</th>'; }).join("") + '</tr></thead><tbody>' +
      satirlar.map(function (r) { return '<tr>' + r.map(function (c, i) { return i ? '<td>' + esc(c) + '</td>' : '<th scope="row">' + esc(c) + '</th>'; }).join("") + '</tr>'; }).join("") +
      '</tbody></table></div></details>';
  }

  /** İlerleme halkası. o: { deger, max, hedef, merkez, alt, etiket, boyut } — hedef: halkada küçük işaret */
  function halka(el, o) {
    var b = o.boyut || 132, r = (b - 14) / 2, c = b / 2, dash = halkaDash(o.deger == null ? 0 : o.deger / (o.max || 1), r);
    var hedefAci = o.hedef ? (o.hedef / (o.max || 1)) * 360 - 90 : null;
    var hx = hedefAci === null ? 0 : c + Math.cos(hedefAci * Math.PI / 180) * r, hy = hedefAci === null ? 0 : c + Math.sin(hedefAci * Math.PI / 180) * r;
    var ilk = !hareketAz();
    el.classList.add("gf", "gf-halka");
    el.style.setProperty("--gf-halka", b + "px");
    el.innerHTML = '<svg viewBox="0 0 ' + b + ' ' + b + '" width="' + b + '" height="' + b + '" role="img" aria-label="' + esc(o.etiket || "") + '">' +
      '<circle class="gf-halka-iz" cx="' + c + '" cy="' + c + '" r="' + r + '" />' +
      '<circle class="gf-halka-dolu' + (ilk ? " gf-canli" : "") + '" cx="' + c + '" cy="' + c + '" r="' + r + '" transform="rotate(-90 ' + c + ' ' + c + ')" ' +
        'stroke-dasharray="' + dash.dolu + ' ' + dash.cevre + '" style="--gf-cevre:' + dash.cevre + '" />' +
      (hedefAci !== null ? '<circle class="gf-halka-hedef" cx="' + yuvarla(hx) + '" cy="' + yuvarla(hy) + '" r="5" />' : '') +
      '</svg><div class="gf-halka-merkez" aria-hidden="true"><strong>' + esc(o.merkez) + '</strong>' + (o.alt ? '<span>' + esc(o.alt) + '</span>' : '') + '</div>';
  }

  /** Paylaşılan ipucu + klavye gezinmesi. noktalar: [{ x, y, metin }] (px, kap içi) */
  function etkilesim(kap, svg, noktalar, odakCiz) {
    var ip = D.createElement("div"); ip.className = "gf-ipucu"; ip.hidden = true; ip.setAttribute("role", "status"); ip.setAttribute("aria-live", "polite");
    kap.appendChild(ip);
    var aktif = -1;
    function goster(i) {
      if (i < 0 || i >= noktalar.length) return;
      aktif = i; var p = noktalar[i];
      ip.innerHTML = p.metin; ip.hidden = false;
      var w = kap.clientWidth, iw = ip.offsetWidth || 140;
      ip.style.left = Math.max(0, Math.min(w - iw, p.x - iw / 2)) + "px";
      ip.style.top = Math.max(0, p.y - (ip.offsetHeight || 40) - 12) + "px";
      odakCiz(i);
    }
    function gizle() { ip.hidden = true; aktif = -1; odakCiz(-1); }
    function enYakin(px) { var en = 0, ed = Infinity; noktalar.forEach(function (p, i) { var d = Math.abs(p.x - px); if (d < ed) { ed = d; en = i; } }); return en; }
    svg.addEventListener("pointermove", function (e) { var r = svg.getBoundingClientRect(); goster(enYakin(e.clientX - r.left)); });
    svg.addEventListener("pointerleave", gizle);
    kap.tabIndex = 0;
    if (kap._gfTemizle) kap._gfTemizle(); // yeniden çizimde eski dinleyiciler kalmasın
    var odak = function () { if (aktif < 0) goster(noktalar.length - 1); };
    var tus = function (e) {
      var k = e.key, i = aktif < 0 ? noktalar.length - 1 : aktif;
      if (k === "ArrowLeft") i = Math.max(0, i - 1); else if (k === "ArrowRight") i = Math.min(noktalar.length - 1, i + 1);
      else if (k === "Home") i = 0; else if (k === "End") i = noktalar.length - 1; else if (k === "Escape") { gizle(); return; } else return;
      e.preventDefault(); goster(i);
    };
    kap.addEventListener("focus", odak); kap.addEventListener("blur", gizle); kap.addEventListener("keydown", tus);
    kap._gfTemizle = function () { kap.removeEventListener("focus", odak); kap.removeEventListener("blur", gizle); kap.removeEventListener("keydown", tus); };
  }

  /**
   * Çizgi / alan grafiği (tek seri). o: { noktalar: [{ x: ms, y, ipucu }], yMin, yMax, yTikler, yBicim, hedef: { y, etiket },
   *   alan: bool, yukseklik, etiket, sonEtiket: bool, xBicim }
   */
  function cizgi(el, o) {
    var noktalar = (o.noktalar || []).filter(function (p) { return p && isFinite(p.x); });
    kur(el, function (W_, ilk) {
      var H = o.yukseklik || 220, sol = 34, sag = o.hedef ? 64 : 20, ust = 14, alt = 28;
      el.innerHTML = "";
      var xs = noktalar.map(function (p) { return p.x; });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
      if (x0 === x1) { x0 -= 3 * 864e5; x1 += 3 * 864e5; }
      var X = olcek(x0, x1, sol, W_ - sag), Y = olcek(o.yMin, o.yMax, H - alt, ust);
      var svg = svgEl("svg", { viewBox: "0 0 " + W_ + " " + H, width: W_, height: H, role: "img", "aria-label": o.etiket || "", class: "gf-svg" });
      var izgara = svgEl("g", { class: "gf-izgara", "aria-hidden": "true" });
      (o.yTikler || tikler(o.yMin, o.yMax, 5)).forEach(function (t) {
        izgara.appendChild(svgEl("line", { x1: sol, x2: W_ - sag, y1: yuvarla(Y(t)), y2: yuvarla(Y(t)) }));
        var tx = svgEl("text", { x: sol - 8, y: yuvarla(Y(t)) + 4, "text-anchor": "end", class: "gf-eksen" }); tx.textContent = o.yBicim ? o.yBicim(t) : t; izgara.appendChild(tx);
      });
      // x tikleri: en çok ~5 tarih etiketi
      var xt = Math.max(2, Math.min(5, Math.floor((W_ - sol - sag) / 90)));
      for (var i = 0; i < xt; i++) {
        var xv = x0 + (x1 - x0) * i / (xt - 1);
        var t2 = svgEl("text", { x: yuvarla(X(xv)), y: H - 8, "text-anchor": i === 0 ? "start" : i === xt - 1 ? "end" : "middle", class: "gf-eksen" });
        t2.textContent = o.xBicim ? o.xBicim(xv) : gunEtiket(new Date(xv).toISOString()); izgara.appendChild(t2);
      }
      svg.appendChild(izgara);
      if (o.hedef && o.hedef.y != null) {
        var hy = yuvarla(Y(o.hedef.y)), hg = svgEl("g", { class: "gf-hedef" });
        hg.appendChild(svgEl("line", { x1: sol, x2: W_ - sag, y1: hy, y2: hy }));
        var ht = svgEl("text", { x: W_ - sag + 8, y: hy + 4, class: "gf-hedef-yazi" }); ht.textContent = o.hedef.etiket || "Hedef"; hg.appendChild(ht);
        svg.appendChild(hg);
      }
      var pts = noktalar.map(function (p) { return [X(p.x), p.y == null ? null : Y(p.y)]; });
      if (o.alan) svg.appendChild(svgEl("path", { d: alanYolu(pts, H - alt), class: "gf-alan" + (ilk ? " gf-belir" : "") }));
      svg.appendChild(svgEl("path", { d: cizgiYolu(pts), class: "gf-cizgi" + (ilk ? " gf-ciz" : ""), pathLength: "1" }));
      // işaretçiler: az noktada her biri; çok noktada yalnız son
      var dolu = pts.filter(function (p) { return p[1] !== null; });
      var isaret = svgEl("g", { class: "gf-isaret" + (ilk ? " gf-belir" : "") });
      (dolu.length <= 16 ? dolu : dolu.slice(-1)).forEach(function (p) { isaret.appendChild(svgEl("circle", { cx: yuvarla(p[0]), cy: yuvarla(p[1]), r: 4 })); });
      svg.appendChild(isaret);
      if (o.sonEtiket !== false && dolu.length) {
        var sp = dolu[dolu.length - 1], son = noktalar[pts.indexOf(sp)];
        var st = svgEl("text", { x: yuvarla(Math.min(sp[0], W_ - sag - 4)), y: yuvarla(sp[1]) - 10, "text-anchor": "end", class: "gf-deger" });
        st.textContent = o.yBicim ? o.yBicim(son.y) : son.y; svg.appendChild(st);
      }
      var odak = svgEl("g", { class: "gf-odak", "aria-hidden": "true" });
      var oc = svgEl("line", { y1: ust, y2: H - alt }), od = svgEl("circle", { r: 5 });
      odak.appendChild(oc); odak.appendChild(od); odak.style.display = "none"; svg.appendChild(odak);
      el.appendChild(svg);
      var hedefler = [];
      noktalar.forEach(function (p, i) { if (p.y != null) hedefler.push({ x: pts[i][0], y: pts[i][1], metin: p.ipucu || esc(p.y) }); });
      if (hedefler.length) etkilesim(el, svg, hedefler, function (i) {
        if (i < 0) { odak.style.display = "none"; return; }
        var h = hedefler[i]; odak.style.display = ""; oc.setAttribute("x1", h.x); oc.setAttribute("x2", h.x); od.setAttribute("cx", h.x); od.setAttribute("cy", h.y);
      });
    });
  }

  /** Etkinlik ısı takvimi (son 12 hafta; sütun = hafta, satır = gün). gunler: [{ gun, cevap, dogru, deneme }] */
  function isiTakvimi(el, gunler, o) {
    o = o || {};
    var sec = gunler.slice(-(o.gun || 84));
    var haftalar = takvimHaftalari(sec), es = isiEsikleri(sec.map(function (g) { return g.cevap; }));
    var ilk = !hareketAz();
    el.classList.add("gf", "gf-isi");
    var html = '<div class="gf-isi-izgara" role="grid" aria-label="' + esc(o.etiket || "Son 12 haftanın etkinlik takvimi") + '" style="--gf-sutun:' + haftalar.length + '">';
    html += '<div class="gf-isi-gunler" aria-hidden="true">' + GUNLER.map(function (g, i) { return '<span>' + (i % 2 === 0 ? g : "") + '</span>'; }).join("") + '</div>';
    haftalar.forEach(function (h, hi) {
      html += '<div class="gf-isi-sutun" role="row">';
      h.forEach(function (g) {
        if (!g) { html += '<span class="gf-hucre is-bos" role="presentation"></span>'; return; }
        var s = isiSeviyesi(g.cevap, es), m = gunEtiket(g.gun) + ": " + (g.cevap ? g.cevap + " soru, " + g.dogru + " doğru" : "etkinlik yok") + (g.deneme ? ", " + g.deneme + " deneme" : "");
        html += '<span class="gf-hucre s' + s + (ilk ? " gf-belir" : "") + '" style="--gf-gecik:' + (hi * 18) + 'ms" role="gridcell" tabindex="-1" aria-label="' + esc(m) + '" data-ipucu="' + esc(m) + '"></span>';
      });
      html += '</div>';
    });
    html += '</div><div class="gf-isi-alt"><span class="gf-isi-ay">' + esc(gunEtiket(sec[0].gun) + " – " + gunEtiket(sec[sec.length - 1].gun)) + '</span>' +
      '<span class="gf-isi-olcek" aria-hidden="true">Az <i class="gf-hucre s0"></i><i class="gf-hucre s1"></i><i class="gf-hucre s2"></i><i class="gf-hucre s3"></i><i class="gf-hucre s4"></i> Çok</span></div>' +
      '<div class="gf-ipucu" hidden role="status" aria-live="polite"></div>';
    el.innerHTML = html;
    var ip = el.querySelector(".gf-ipucu"), hucreler = Array.prototype.slice.call(el.querySelectorAll(".gf-hucre[data-ipucu]"));
    function goster(h) {
      ip.textContent = h.getAttribute("data-ipucu"); ip.hidden = false;
      var r = el.getBoundingClientRect(), hr = h.getBoundingClientRect(), iw = ip.offsetWidth || 160;
      ip.style.left = Math.max(0, Math.min(r.width - iw, hr.left - r.left + hr.width / 2 - iw / 2)) + "px";
      ip.style.top = Math.max(0, hr.top - r.top - (ip.offsetHeight || 30) - 8) + "px";
    }
    hucreler.forEach(function (h, i) {
      h.addEventListener("pointerenter", function () { goster(h); });
      h.addEventListener("focus", function () { goster(h); });
      h.addEventListener("keydown", function (e) {
        var j = { ArrowUp: i - 1, ArrowDown: i + 1, ArrowLeft: i - 7, ArrowRight: i + 7, Home: 0, End: hucreler.length - 1 }[e.key];
        if (j === undefined) return; e.preventDefault();
        j = Math.max(0, Math.min(hucreler.length - 1, j)); h.tabIndex = -1; hucreler[j].tabIndex = 0; hucreler[j].focus();
      });
    });
    if (hucreler.length) hucreler[hucreler.length - 1].tabIndex = 0;
    el.addEventListener("pointerleave", function () { ip.hidden = true; });
    el.addEventListener("focusout", function (e) { if (!el.contains(e.relatedTarget)) ip.hidden = true; });
  }

  /** Kıvılcım çizgi (sparkline): değerler + etiketler; son değer vurgulu */
  function kivilcim(el, degerler, o) {
    o = o || {};
    var H = o.yukseklik || 44;
    kur(el, function (W_, ilk) {
      var max = Math.max.apply(null, degerler.concat([1])), X = olcek(0, Math.max(1, degerler.length - 1), 4, W_ - 6), Y = olcek(0, max, H - 4, 6);
      var pts = degerler.map(function (v, i) { return [X(i), Y(v)]; });
      var son = pts[pts.length - 1];
      el.innerHTML = '<svg class="gf-svg gf-kivilcim" viewBox="0 0 ' + W_ + ' ' + H + '" width="' + W_ + '" height="' + H + '" role="img" aria-label="' + esc(o.etiket || "") + '">' +
        '<path class="gf-alan' + (ilk ? " gf-belir" : "") + '" d="' + alanYolu(pts, H - 2) + '"/>' +
        '<path class="gf-cizgi' + (ilk ? " gf-ciz" : "") + '" pathLength="1" d="' + cizgiYolu(pts) + '"/>' +
        (son ? '<circle class="gf-son' + (ilk ? " gf-belir" : "") + '" cx="' + yuvarla(son[0]) + '" cy="' + yuvarla(son[1]) + '" r="4"/>' : "") + '</svg>';
      var svg = el.querySelector("svg");
      if (o.ipuclari) etkilesim(el, svg, pts.map(function (p, i) { return { x: p[0], y: p[1], metin: o.ipuclari[i] }; }), function () {});
    });
  }

  /**
   * Yatay çubuk satırları (HTML). satirlar: [{ ad, link, olcumler: [{ deger(0–100|null), sinif }], not, vurgu, eylem }]
   * Her satırda en çok iki ölçüm (ör. doğruluk + kapsam); değer çubuğun ucunda yazılır.
   */
  function cubuklar(el, satirlar, o) {
    o = o || {};
    var ilk = !hareketAz();
    el.classList.add("gf", "gf-cubuklar");
    el.innerHTML = '<ul class="gf-cubuk-liste">' + satirlar.map(function (s, i) {
      return '<li class="gf-cubuk-satir' + (s.vurgu ? " is-vurgu" : "") + '">' +
        '<div class="gf-cubuk-bas"><span class="gf-cubuk-ad">' + (s.link ? '<a href="' + esc(s.link) + '">' + esc(s.ad) + '</a>' : esc(s.ad)) + '</span>' +
          (s.eylem ? s.eylem : s.not ? '<span class="gf-cubuk-not">' + esc(s.not) + '</span>' : '') + '</div>' +
        s.olcumler.map(function (m) {
          var v = m.deger == null ? 0 : Math.max(0, Math.min(100, m.deger));
          return '<div class="gf-cubuk ' + esc(m.sinif || "") + '" title="' + esc(m.ad + ": " + (m.deger == null ? "veri yok" : "%" + m.deger)) + '">' +
            '<span class="gf-cubuk-iz"><i class="' + (ilk ? "gf-buyu" : "") + '" style="width:' + v + '%; --gf-gecik:' + (i * 40) + 'ms"></i></span>' +
            '<span class="gf-cubuk-deger">' + (m.deger == null ? "–" : "%" + m.deger) + '<span class="visually-hidden"> ' + esc(m.ad) + '</span></span></div>';
        }).join("") + '</li>';
    }).join("") + '</ul>';
  }

  /**
   * Dikey yığılmış sütunlar (HTML+SVG değil; esnek). sutunlar: [{ etiket, parcalar: [{ deger, sinif, ad }], ipucu }]
   */
  function yigin(el, sutunlar, o) {
    o = o || {};
    var ilk = !hareketAz(), max = 1;
    sutunlar.forEach(function (s) { var t = s.parcalar.reduce(function (a, p) { return a + (p.deger || 0); }, 0); if (t > max) max = t; });
    var tk = tikler(0, max, 3), ust = tk[tk.length - 1] || max; if (ust < max) ust = max;
    el.classList.add("gf", "gf-yigin");
    el.style.setProperty("--gf-yuk", (o.yukseklik || 140) + "px");
    el.innerHTML = '<div class="gf-yigin-alan" role="img" aria-label="' + esc(o.etiket || "") + '">' +
      '<div class="gf-yigin-izgara" aria-hidden="true">' + tk.slice().reverse().map(function (t) { return '<span style="bottom:' + (t / ust * 100) + '%"><b>' + sayi(t) + '</b></span>'; }).join("") + '</div>' +
      '<div class="gf-yigin-sutunlar">' + sutunlar.map(function (s, i) {
        var top = s.parcalar.reduce(function (a, p) { return a + (p.deger || 0); }, 0);
        return '<div class="gf-yigin-sutun" tabindex="0" data-ipucu="' + esc(s.ipucu || "") + '" aria-label="' + esc(s.ipucu || "") + '">' +
          '<span class="gf-yigin-cubuk' + (ilk ? " gf-buyu-y" : "") + '" style="height:' + (top / ust * 100) + '%; --gf-gecik:' + (i * 40) + 'ms">' +
          s.parcalar.slice().reverse().map(function (p) { return p.deger ? '<i class="' + esc(p.sinif || "") + '" style="flex:' + p.deger + '"></i>' : ""; }).join("") + '</span>' +
          '<span class="gf-yigin-etiket">' + esc(s.etiket) + '</span></div>';
      }).join("") + '</div></div><div class="gf-ipucu" hidden role="status" aria-live="polite"></div>';
    var ip = el.querySelector(".gf-ipucu");
    Array.prototype.forEach.call(el.querySelectorAll(".gf-yigin-sutun"), function (c) {
      var g = function () {
        ip.textContent = c.getAttribute("data-ipucu"); ip.hidden = false;
        var r = el.getBoundingClientRect(), cr = c.getBoundingClientRect(), iw = ip.offsetWidth || 150;
        ip.style.left = Math.max(0, Math.min(r.width - iw, cr.left - r.left + cr.width / 2 - iw / 2)) + "px"; ip.style.top = "0px";
      };
      c.addEventListener("pointerenter", g); c.addEventListener("focus", g);
      c.addEventListener("pointerleave", function () { ip.hidden = true; }); c.addEventListener("blur", function () { ip.hidden = true; });
    });
  }

  function lejant(ogeler) {
    return '<ul class="gf-lejant">' + ogeler.map(function (x) { return '<li><i class="gf-anahtar ' + esc(x.sinif) + '" aria-hidden="true"></i>' + esc(x.ad) + '</li>'; }).join("") + '</ul>';
  }

  var dom = { halka: halka, cizgi: cizgi, isiTakvimi: isiTakvimi, kivilcim: kivilcim, cubuklar: cubuklar, yigin: yigin, tablo: tablo, lejant: lejant, esc: esc, hareketAz: hareketAz, sayac: function () { return ++sayac; } };
  for (var k in saf) dom[k] = saf[k];
  return dom;
});
