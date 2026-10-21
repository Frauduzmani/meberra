/* Meberra v1.13.0 — şekilli sorular: ortak SVG çizici (window.MeberraSekil).
   Biçim: araclar/yeni-sorular2/SEKIL-BICIMI.md. Sunucu (server/sekil.js) saklarken temizler; istemci de DERİNLEMESİNE SAVUNMA için
   DOMParser + AYNI beyaz liste ile yeniden temizler ve SVG'yi createElementNS ile kurar (innerHTML yok).
   - ciz(sekil, {secenek}) → <figure class="sk"> (şıkta <span class="sk sk-secenek">: düğme içinde geçerli içerik)
   - Yer tutucu: app.js apSekil* yardımcıları modül yüklenmeden önce <div class="sk-bekle" data-sk-veri="…"> yazar; bu modül
     yüklenince ve sonra eklenen her yer tutucuyu (MutationObserver) gerçek şekle çevirir. Oran viewBox'tan ayrılır (kayma yok).
   - "Büyüt": şekli (ya da tüm şık şekillerini) tam ekran <dialog> içinde gösterir. */
(function (kok) {
  "use strict";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var VB = { w: 480, h: 360 }, EN_COK = 30 * 1024;
  var ETIKET = { svg: 1, g: 1, path: 1, line: 1, polyline: 1, polygon: 1, rect: 1, circle: 1, ellipse: 1, text: 1, tspan: 1, defs: 1, marker: 1, title: 1, desc: 1 };
  var METINLI = { text: 1, tspan: 1, title: 1, desc: 1 };
  var OZ = {};
  ("viewBox xmlns role d x y x1 y1 x2 y2 cx cy r rx ry width height points transform fill stroke stroke-width stroke-dasharray stroke-linecap " +
    "stroke-linejoin opacity fill-opacity font-size font-weight text-anchor dominant-baseline marker-end marker-start id class").split(" ").forEach(function (k) { OZ[k] = 1; });
  var MARKER_OZ = { markerWidth: 1, markerHeight: 1, refX: 1, refY: 1, orient: 1, markerUnits: 1 };
  var SAYI = "[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][-+]?\\d+)?", UZ = SAYI + "(?:px|%|em)?";
  function re(s) { return new RegExp("^" + s + "$"); }
  var R = {
    uz: re("\\s*" + UZ + "\\s*"), uzListe: re("\\s*" + UZ + "(?:[\\s,]+" + UZ + ")*\\s*"), sayi: re("\\s*" + SAYI + "\\s*"),
    vb: re("\\s*(" + SAYI + ")[\\s,]+(" + SAYI + ")[\\s,]+(" + SAYI + ")[\\s,]+(" + SAYI + ")\\s*"),
    d: /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,+\-\s]*$/, points: /^[0-9eE.,+\-\s]*$/,
    tr: re("(?:\\s*(?:matrix|translate|scale|rotate|skewX|skewY)\\s*\\(\\s*" + SAYI + "(?:[\\s,]+" + SAYI + ")*\\s*\\)\\s*,?)+\\s*"),
    renk: /^(?:none|currentColor|transparent|inherit|#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,20}|rgba?\(\s*[\d.%\s,]+\)|url\(#[A-Za-z][\w-]{0,63}\))$/,
    marker: /^(?:none|url\(#[A-Za-z][\w-]{0,63}\))$/, dash: re("\\s*(?:none|" + UZ + "(?:[\\s,]+" + UZ + ")*)\\s*"),
    id: /^[A-Za-z][\w-]{0,63}$/, sinif: /^sk-[a-z0-9-]{1,30}$/
  };
  var SECIM = {
    "stroke-linecap": ["butt", "round", "square"], "stroke-linejoin": ["miter", "round", "bevel", "miter-clip", "arcs"],
    "font-weight": ["normal", "bold", "bolder", "lighter", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
    "text-anchor": ["start", "middle", "end"],
    "dominant-baseline": ["auto", "middle", "central", "hanging", "alphabetic", "ideographic", "mathematical", "text-top", "text-bottom", "text-before-edge", "text-after-edge"],
    role: ["img", "presentation", "none"], markerUnits: ["strokeWidth", "userSpaceOnUse"]
  };

  /** SAF kural: öznitelik (etiket, ad, değer, kök mü) izinli mi? İzinliyse yazılacak değer, değilse null. (birim testinde de kullanılır) */
  function ozDeger(etiket, ad, v, kokMu) {
    v = String(v);
    if (!(OZ[ad] || (etiket === "marker" && MARKER_OZ[ad]))) return null;
    if (kokMu && (ad === "width" || ad === "height")) return null;
    if (!kokMu && (ad === "xmlns" || ad === "viewBox") && etiket !== "marker") return null;
    if (v.length > 20000 || /[<>]/.test(v)) return null;
    if (ad === "class") { var l = v.split(/\s+/).filter(function (x) { return R.sinif.test(x); }); return l.length ? l.join(" ") : null; }
    var t = v.trim(), ok;
    switch (ad) {
      case "xmlns": ok = v === SVG_NS; break;
      case "viewBox": ok = R.vb.test(v); break;
      case "d": ok = R.d.test(v); break;
      case "points": ok = R.points.test(v); break;
      case "transform": ok = R.tr.test(v); break;
      case "x": case "y": ok = R.uzListe.test(v); break;
      case "x1": case "y1": case "x2": case "y2": case "cx": case "cy": case "r": case "rx": case "ry": case "width": case "height":
      case "stroke-width": case "font-size": ok = R.uz.test(v); break;
      case "markerWidth": case "markerHeight": case "refX": case "refY": ok = R.sayi.test(v); break;
      case "orient": ok = v === "auto" || v === "auto-start-reverse" || R.sayi.test(v); break;
      case "opacity": case "fill-opacity": ok = R.sayi.test(v) && +v >= 0 && +v <= 1; break;
      case "fill": case "stroke": ok = R.renk.test(t); break;
      case "marker-end": case "marker-start": ok = R.marker.test(t); break;
      case "stroke-dasharray": ok = R.dash.test(v); break;
      case "id": ok = R.id.test(v); break;
      default: ok = !!SECIM[ad] && SECIM[ad].indexOf(t) >= 0;
    }
    return ok ? v : null;
  }
  /** SAF kural: çocuk etiketi bu ebeveyn altında kalabilir mi? */
  function etiketIzinli(ebeveyn, ad) {
    if (!ETIKET[ad] || ad === "svg") return false;
    if (ebeveyn === "title" || ebeveyn === "desc") return false;
    if ((ebeveyn === "text" || ebeveyn === "tspan") && ad !== "tspan") return false;
    return true;
  }
  /** viewBox metninden { w, h } (sınır dışı / bozuk → null) */
  function viewBoxOku(v) {
    var m = R.vb.exec(String(v || ""));
    if (!m) return null;
    var w = +m[3], h = +m[4];
    return w > 0 && h > 0 && w <= VB.w && h <= VB.h ? { x: +m[1], y: +m[2], w: w, h: h } : null;
  }
  function svgVb(s) { var m = /<svg\b[^>]*\sviewBox\s*=\s*["']([^"']*)["']/.exec(String(s || "")); return m ? viewBoxOku(m[1]) : null; }

  var sayac = 0;
  /** SVG metnini temizleyip yeni bir SVG öğesi kurar. Bozuk / sınır dışı → null. idOn: kimlik öneki (sayfada çakışma olmasın). */
  function temizSvg(metin, idOn) {
    if (typeof metin !== "string" || !metin || metin.length > EN_COK) return null;
    if (/<!(?:DOCTYPE|ENTITY)|<!\[CDATA\[|&(?!(?:lt|gt|amp|quot|apos|#\d{1,7}|#x[0-9a-fA-F]{1,6});)/i.test(metin)) return null;
    if (typeof DOMParser === "undefined") return null;
    // xmlns verilmemişse (sunucu zorunlu tutmaz) XML ayrıştırıcısı için kök öğeye eklenir; yoksa öğeler SVG ad alanında olmaz
    var kokEt = /^\s*<svg\b[^>]*>/.exec(metin);
    if (!kokEt) return null;
    if (!/\sxmlns\s*=/.test(kokEt[0])) metin = metin.replace(/^(\s*<svg\b)/, '$1 xmlns="' + SVG_NS + '"');
    var doc;
    try { doc = new DOMParser().parseFromString(metin, "image/svg+xml"); } catch (e) { return null; }
    var k = doc && doc.documentElement;
    if (!k || k.localName !== "svg" || k.namespaceURI !== SVG_NS || doc.getElementsByTagName("parsererror").length) return null;
    var vb = viewBoxOku(k.getAttribute("viewBox"));
    if (!vb) return null;
    var idler = {};
    function yeniId(v) { return idOn + v; }
    function kur(kaynak, kokMu) {
      var ad = kaynak.localName, el = document.createElementNS(SVG_NS, ad);
      for (var i = 0; i < kaynak.attributes.length; i++) {
        var a = kaynak.attributes[i];
        if (a.namespaceURI && a.namespaceURI !== "http://www.w3.org/2000/xmlns/") continue; // xlink:href, xml:* …
        if (a.name === "xmlns") continue; // createElementNS yeterli
        var d = ozDeger(ad, a.name, a.value, kokMu);
        if (d == null) continue;
        if (a.name === "id") { if (idler[d]) continue; idler[d] = 1; d = yeniId(d); }
        else if (/url\(#/.test(d)) d = d.replace(/url\(#([A-Za-z][\w-]*)\)/g, function (_, x) { return "url(#" + yeniId(x) + ")"; });
        el.setAttribute(a.name, d);
      }
      for (var n = kaynak.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3) { if (METINLI[ad]) el.appendChild(document.createTextNode(n.nodeValue)); continue; }
        if (n.nodeType !== 1 || n.namespaceURI !== SVG_NS || !etiketIzinli(ad, n.localName)) continue;
        el.appendChild(kur(n, false));
      }
      return el;
    }
    var svg = kur(k, true);
    return { el: svg, vb: vb };
  }

  function metin(s) { return String(s == null ? "" : s); }
  /**
   * ciz(sekil, { secenek }) → öğe. secenek: true → <span class="sk sk-secenek"> (şık düğmesinin içinde), "Büyüt" düğmesi yok.
   * Geçersiz şekil → "Şekil gösterilemiyor" notu (alt metniyle; soru yine çözülebilir).
   */
  function ciz(sekil, o) {
    o = o || {};
    var sec = !!o.secenek, s = sekil && typeof sekil === "object" ? sekil : {};
    var dis = document.createElement(sec ? "span" : "figure");
    dis.className = "sk tex2jax_ignore mathjax_ignore" + (sec ? " sk-secenek" : "");
    var alt = metin(s.alt).trim();
    var t = temizSvg(s.svg, "sk" + (++sayac) + "-");
    var tuval = document.createElement("span");
    tuval.className = "sk-tuval";
    if (!t) {
      dis.classList.add("is-bozuk");
      tuval.textContent = "Şekil gösterilemiyor." + (alt ? " Betim: " + alt : "");
      dis.appendChild(tuval);
      return dis;
    }
    tuval.style.aspectRatio = t.vb.w + " / " + t.vb.h;
    var svg = t.el;
    svg.setAttribute("role", "img");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    if (alt) svg.setAttribute("aria-label", alt);
    tuval.appendChild(svg);
    dis.appendChild(tuval);
    dis._sekil = s;
    if (s.baslik) {
      var c = document.createElement(sec ? "span" : "figcaption");
      c.className = "sk-baslik";
      c.textContent = metin(s.baslik);
      dis.appendChild(c);
    }
    if (!sec && o.buyut !== false) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "sk-buyut";
      b.setAttribute("data-sk-buyut", "");
      b.setAttribute("aria-label", "Şekli büyüt" + (s.baslik ? ": " + metin(s.baslik) : ""));
      b.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg><span>Büyüt</span>';
      dis.appendChild(b);
    }
    return dis;
  }
  /** Birden çok kök şekli → DocumentFragment */
  function cizListe(l) {
    var f = document.createDocumentFragment();
    (Array.isArray(l) ? l : l ? [l] : []).forEach(function (x) { f.appendChild(ciz(x)); });
    return f;
  }

  // --- yer tutucular (app.js apSekil* yardımcıları yazar) ------------------------------------------------------
  function doldur(root) {
    var r = root && root.querySelectorAll ? root : document;
    var l = r.querySelectorAll ? r.querySelectorAll(".sk-bekle[data-sk-veri]") : [];
    if (r.classList && r.classList.contains("sk-bekle") && r.hasAttribute("data-sk-veri")) l = [r].concat(Array.prototype.slice.call(l));
    Array.prototype.forEach.call(l, function (y) {
      if (!y.parentNode) return;
      var v = null;
      try { v = JSON.parse(y.getAttribute("data-sk-veri")); } catch (e) { v = null; }
      var sec = y.getAttribute("data-sk-sik") === "1";
      var list = Array.isArray(v) ? v : v ? [v] : [];
      var f = document.createDocumentFragment();
      list.forEach(function (x) { f.appendChild(ciz(x, { secenek: sec })); });
      y.parentNode.replaceChild(f, y);
    });
  }

  // --- büyütme penceresi ------------------------------------------------------------------------------------
  var pencere = null;
  function pencereAc(icerik, baslik) {
    if (!pencere) {
      pencere = document.createElement("dialog");
      pencere.className = "sk-pencere";
      pencere.setAttribute("aria-label", "Büyütülmüş şekil");
      pencere.innerHTML = '<div class="sk-pencere-ust"><strong class="sk-pencere-baslik"></strong><button type="button" class="sk-kapat" data-sk-kapat aria-label="Kapat">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div class="sk-pencere-ic"></div>';
      pencere.addEventListener("click", function (e) { if (e.target === pencere || (e.target.closest && e.target.closest("[data-sk-kapat]"))) kapat(); });
      pencere.addEventListener("close", function () { var ic = pencere.querySelector(".sk-pencere-ic"); if (ic) ic.innerHTML = ""; if (pencere._donus && pencere._donus.focus) pencere._donus.focus(); });
      document.body.appendChild(pencere);
    }
    pencere._donus = document.activeElement;
    pencere.querySelector(".sk-pencere-baslik").textContent = baslik || "Şekil";
    var ic = pencere.querySelector(".sk-pencere-ic");
    ic.innerHTML = "";
    ic.appendChild(icerik);
    if (typeof pencere.showModal === "function") { try { pencere.showModal(); } catch (e) { pencere.setAttribute("open", ""); } }
    else pencere.setAttribute("open", "");
    var k = pencere.querySelector("[data-sk-kapat]"); if (k) k.focus();
  }
  function kapat() { if (!pencere) return; if (typeof pencere.close === "function" && pencere.open) pencere.close(); else { pencere.removeAttribute("open"); pencere.dispatchEvent(new Event("close")); } }
  function buyutSekil(s) { pencereAc(ciz(s, { buyut: false }), s && s.baslik ? metin(s.baslik) : "Şekil"); }
  function buyutSecenekler(l) {
    var f = document.createElement("div");
    f.className = "sk-pencere-siklar";
    (l || []).forEach(function (o) {
      if (!o || !o.sekil) return;
      var k = document.createElement("div");
      k.className = "sk-pencere-sik";
      var h = document.createElement("span");
      h.className = "sk-pencere-harf"; h.textContent = metin(o.id);
      k.appendChild(h);
      k.appendChild(ciz(o.sekil, { buyut: false }));
      f.appendChild(k);
    });
    pencereAc(f, "Şıklar");
  }

  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target : null;
      if (!t) return;
      var b = t.closest("[data-sk-buyut]");
      if (b) { var fig = b.closest(".sk"); if (fig && fig._sekil) { e.preventDefault(); buyutSekil(fig._sekil); } return; }
      var sb = t.closest("[data-sk-siklar]");
      if (sb) {
        e.preventDefault();
        var v = null; try { v = JSON.parse(sb.getAttribute("data-sk-siklar")); } catch (x) { v = null; }
        if (Array.isArray(v)) buyutSecenekler(v);
      }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && pencere && pencere.hasAttribute("open") && typeof pencere.showModal !== "function") kapat(); });
    var basla = function () {
      doldur(document);
      if (typeof MutationObserver !== "undefined" && document.body) {
        new MutationObserver(function (l) {
          for (var i = 0; i < l.length; i++) for (var j = 0; j < l[i].addedNodes.length; j++) {
            var n = l[i].addedNodes[j];
            if (n.nodeType === 1 && (n.classList.contains("sk-bekle") || (n.querySelector && n.querySelector(".sk-bekle")))) doldur(n);
          }
        }).observe(document.body, { childList: true, subtree: true });
      }
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", basla); else basla();
  }

  kok.MeberraSekil = { ciz: ciz, cizListe: cizListe, doldur: doldur, temizSvg: temizSvg, buyut: buyutSekil, buyutSecenekler: buyutSecenekler, svgVb: svgVb,
    _kural: { ozDeger: ozDeger, etiketIzinli: etiketIzinli, viewBoxOku: viewBoxOku, ETIKET: ETIKET, OZ: OZ, MARKER_OZ: MARKER_OZ } };
})(typeof window !== "undefined" ? window : this);
