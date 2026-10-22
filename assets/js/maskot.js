/**
 * Meberra maskotu — "Dede Korkut" (Oğuz destanlarının bilge ozanı: ak sakal, uzun börk, sırtında kopuz). Kitaplıksız,
 * derlemesiz; satır içi SVG üretir ki CSS parçaları (göz kırpma, kopuz sallama, el sallama, zıplama) canlandırabilsin.
 * Stiller: assets/css/maskot.css
 *
 * API (window.MeberraMaskot):
 *   MASKOT_ADI                          → "Dede Korkut" (adı değiştirmek için yalnızca aşağıdaki sabiti değiştirin)
 *   IFADELER                            → ["sevincli","kutlama","dusunen","uykulu","uzgun","selam"]
 *   html(ifade, { boyut, animasyon, sadeceBas, etiket, sinif }) → satır içi SVG metni
 *      boyut: px (varsayılan 120) · animasyon: true (azaltılmış harekette CSS zaten durdurur)
 *      sadeceBas: true → bildirim/avatar için yalnızca baş (24–48 px) · etiket: false → aria-hidden (yanında metin varsa)
 *   el(ifade, opts)                     → aynı SVG'yi taşıyan <span class="maskot-kap"> öğesi
 *   tekRenk({ boyut, renk })            → favicon/rozet için tek renkli baş (renk varsayılan currentColor)
 *   konus(hedefEl, { ifade, mesaj, kapanabilir, boyut, kapaninca }) → hedefEl içine maskot + konuşma balonu çizer
 *      (boş durumlar, ipuçları, "serin tehlikede" kartı). Mesaj en çok ~90 karakter; uzunsa kelime sınırında kısaltılır.
 *
 * Statik dosyalar (/assets/img/maskot/korkut-<ifade>.svg, korkut-bas.svg, korkut-tek-renk.svg) bu dosyadan üretilir:
 *   node -e "require('/assets/js/maskot.js').dosyalariYaz('/assets/img/maskot')"
 */
(function (kok) {
  "use strict";

  var MASKOT_ADI = "Dede Korkut";
  var IFADELER = ["sevincli", "kutlama", "dusunen", "uykulu", "uzgun", "selam"];
  var ETIKET = {
    sevincli: "mutlu", kutlama: "kutlama yapıyor", dusunen: "düşünüyor",
    uykulu: "uykulu", uzgun: "biraz üzgün ama umutlu", selam: "el sallıyor"
  };

  // Renkler (marka: mor #5B3DF5, enerji turuncusu #FF6B2C)
  var R = {
    tur: "#FF6B2C", krem: "#FFF6EC", krem2: "#E6DCCB", sakal: "#FFFDF8",
    ten: "#F7CDA4", tenKoyu: "#EDAE80", ahsap: "#C4783A", ahsapKoyu: "#8A4A1C", cizme: "#7A3F1E",
    cizgi: "#2A1747", mor: "#5B3DF5", morKoyu: "#4126D6", morAcik: "#9C88FF",
    altin: "#FFC53D", yanak: "#FF8A6B", dil: "#FF6F86", beyaz: "#FFFFFF"
  };
  var CW = 5; // ana çizgi kalınlığı (viewBox 200 birimi)

  var sayac = 0;

  function kacis(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function ifadeAl(ifade) { return IFADELER.indexOf(ifade) >= 0 ? ifade : "sevincli"; }

  // ---- Şekiller --------------------------------------------------------------------------
  var YUZ = "M100 46C128 46 146 64 146 90C146 116 126 134 100 134C74 134 54 116 54 90C54 64 72 46 100 46Z";
  var KULAK = "M57 82C46 80 44 98 56 102Z";
  var SAKAL = "M56 94C54 128 72 160 100 172C128 160 146 128 144 94C136 110 120 116 100 116C80 116 64 110 56 94Z";
  var BIYIK = "M100 108C92 102 79 104 70 115C82 117 93 116 100 112C107 116 118 117 130 115C121 104 108 102 100 108Z";
  var BORK = "M60 58C56 26 76 2 102 2C126 2 146 26 140 58Z";
  var BORK_BANT = "M54 50Q100 38 146 50L148 66Q100 54 52 66Z";
  var GOVDE = "M72 126C60 138 54 158 58 174C60 182 68 186 78 186L122 186C132 186 140 182 142 174C146 158 140 138 128 126Z";
  var KOPUZ_GOVDE = "M48 136C62 136 70 150 68 164C66 178 56 184 46 184C36 184 26 178 26 164C26 150 34 136 48 136Z";
  var BURUN = "M100 92C92 92 90 104 94 107C97 109 103 109 106 107C110 104 108 92 100 92Z";

  function yol(d, dolgu, kalin) {
    return '<path d="' + d + '" fill="' + dolgu + '" stroke="' + R.cizgi + '" stroke-width="' + (kalin || CW) + '" stroke-linejoin="round"/>';
  }
  function cizgi(d, renk, kalin, ek) {
    return '<path d="' + d + '" fill="none" stroke="' + (renk || R.cizgi) + '" stroke-width="' + (kalin || 4) + '" stroke-linecap="round" stroke-linejoin="round"' + (ek || "") + "/>";
  }
  // Kalın, çerçeveli kaftan kolu + uçta el: önce koyu geniş çizgi, sonra mor dar çizgi (her pozda aynı kontur)
  function kol(d, sinif, ek) {
    var u = d.match(/(-?[\d.]+)\s+(-?[\d.]+)\s*$/);
    var el = u ? '<circle cx="' + u[1] + '" cy="' + u[2] + '" r="7" fill="' + R.ten + '" stroke="' + R.cizgi + '" stroke-width="3.5"/>' : "";
    return '<g class="' + sinif + '"' + (ek || "") + ">" +
      cizgi(d, R.cizgi, 18) + cizgi(d, R.mor, 9) + el + "</g>";
  }
  function z(x, y, s, i) {
    return '<path class="mk-z mk-z' + i + '" d="M' + x + " " + y + "h" + s + "l-" + s + " " + s + "h" + s + '" fill="none" stroke="' + R.morAcik + '" stroke-width="' + (2.5 + i * 0.5) + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  // Gür ak kaş: koyu kontur + ak iç
  function kas(d) { return cizgi(d, R.cizgi, 9) + cizgi(d, R.sakal, 4.5); }

  // Kollar (ifadeye göre değişen grup)
  var KOL = {
    solDinlen: "M73 137Q69 151 80 160",
    sagDinlen: "M127 137Q131 151 120 160",
    solYukari: "M70 138Q50 137 37 121",
    sagYukari: "M130 138Q150 137 163 121",
    sagSalla: "M129 139Q166 142 185 121",
    sagCene: "M128 138Q136 126 113 140"
  };

  function kollar(ifade) {
    if (ifade === "kutlama") return kol(KOL.solYukari, "mk-kol mk-kol-sol") + kol(KOL.sagYukari, "mk-kol mk-kol-sag");
    if (ifade === "selam") return kol(KOL.solDinlen, "mk-kol mk-kol-sol") + kol(KOL.sagSalla, "mk-kol mk-kol-sag mk-kol-salla");
    if (ifade === "dusunen") return kol(KOL.solDinlen, "mk-kol mk-kol-sol") + kol(KOL.sagCene, "mk-kol mk-kol-sag");
    return kol(KOL.solDinlen, "mk-kol mk-kol-sol") + kol(KOL.sagDinlen, "mk-kol mk-kol-sag");
  }

  function gozNormal(dx, dy, kucuk) {
    var rx = kucuk ? 6 : 6.5, ry = kucuk ? 7.5 : 8.5;
    var g = function (cx) {
      return '<g class="mk-goz"><ellipse cx="' + (cx + dx) + '" cy="' + (88 + dy) + '" rx="' + rx + '" ry="' + ry + '" fill="' + R.cizgi + '"/>' +
        '<circle cx="' + (cx + dx + 2.3) + '" cy="' + (84.5 + dy) + '" r="2.6" fill="' + R.beyaz + '"/>' +
        '<circle cx="' + (cx + dx - 2.1) + '" cy="' + (91 + dy) + '" r="1.2" fill="' + R.beyaz + '" opacity=".7"/></g>';
    };
    return '<g class="mk-gozler">' + g(80) + g(120) + "</g>";
  }

  // Gür ak kaşlar (ifadeye göre)
  var KAS = {
    kutlama: ["M68 72Q79 64 90 70", "M110 70Q121 64 132 72"],
    dusunen: ["M69 76Q79 74 89 76", "M111 70Q121 62 131 67"],
    uzgun: ["M69 77Q79 76 89 70", "M111 70Q121 76 131 77"],
    uykulu: ["M69 79Q79 76 89 79", "M111 79Q121 76 131 79"]
  };

  function yuz(ifade) {
    var s = "";
    // Gözler
    if (ifade === "kutlama") {
      s += '<g class="mk-gozler mk-gozler--mutlu">' + cizgi("M72 91Q80 80 88 91", R.cizgi, 5) + cizgi("M112 91Q120 80 128 91", R.cizgi, 5) + "</g>";
    } else if (ifade === "uykulu") {
      s += '<g class="mk-gozler mk-gozler--kapali">' + cizgi("M72 88Q80 95 88 88", R.cizgi, 4.5) + cizgi("M112 88Q120 95 128 88", R.cizgi, 4.5) + "</g>";
    } else if (ifade === "dusunen") {
      s += gozNormal(2, -2, false);
    } else if (ifade === "uzgun") {
      s += gozNormal(0, 1, true);
    } else {
      s += gozNormal(0, 0, false);
    }
    var k = KAS[ifade] || ["M69 75Q79 69 89 74", "M111 74Q121 69 131 75"];
    s += '<g class="mk-kaslar">' + kas(k[0]) + kas(k[1]) + "</g>";
    // Yanaklar
    var op = ifade === "uykulu" ? ".55" : ".45";
    s += '<ellipse class="mk-yanak" cx="66" cy="101" rx="7.5" ry="4.5" fill="' + R.yanak + '" opacity="' + op + '"/>' +
      '<ellipse class="mk-yanak" cx="134" cy="101" rx="7.5" ry="4.5" fill="' + R.yanak + '" opacity="' + op + '"/>';
    // Ağız (sakalın üstünde, bıyığın altında)
    if (ifade === "sevincli" || ifade === "selam") {
      s += '<path d="M90 117Q100 132 110 117Q100 120 90 117Z" fill="' + R.cizgi + '" stroke="' + R.cizgi + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M95 125Q100 130 105 125Q100 122.5 95 125Z" fill="' + R.dil + '"/>';
    } else if (ifade === "kutlama") {
      s += '<path d="M86 116Q100 139 114 116Q100 120 86 116Z" fill="' + R.cizgi + '" stroke="' + R.cizgi + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M93 128Q100 135 107 128Q100 124 93 128Z" fill="' + R.dil + '"/>';
    } else if (ifade === "dusunen") {
      s += cizgi("M92 122Q98 119.5 105 121.5", R.cizgi, 3.5);
    } else if (ifade === "uykulu") {
      s += '<ellipse cx="100" cy="122" rx="3.6" ry="4.4" fill="' + R.cizgi + '"/>';
    } else if (ifade === "uzgun") {
      s += cizgi("M93 123Q100 119 107 123", R.cizgi, 3.5);
    }
    // Bıyık, en üstte burun
    s += yol(BIYIK, R.sakal, 3.5);
    s += yol(BURUN, R.tenKoyu, 3);
    return s;
  }

  // Uzun ak keçe börk; mor bant, altın süs ve tepede sallanan püskül
  function bork() {
    return '<g class="mk-kep" transform="rotate(-4 100 50)">' +
      yol(BORK, R.sakal) +
      cizgi("M84 12Q76 30 76 48", R.krem2, 3) +
      '<g class="mk-puskul">' + cizgi("M102 3Q130 -2 141 16L143 26", R.altin, 3) +
      '<path d="M138.5 25.5L147.5 25.5L149 36Q143 38.5 137 36Z" fill="' + R.altin + '" stroke="' + R.cizgi + '" stroke-width="2.5" stroke-linejoin="round"/></g>' +
      '<circle cx="102" cy="3" r="3.6" fill="' + R.altin + '" stroke="' + R.cizgi + '" stroke-width="2"/>' +
      yol(BORK_BANT, R.mor, 4) +
      '<path d="M100 47l4 5-4 5-4-5z" fill="' + R.altin + '" stroke="' + R.cizgi + '" stroke-width="1.5"/>' +
      '<circle cx="76" cy="54" r="2.6" fill="' + R.altin + '"/><circle cx="124" cy="54" r="2.6" fill="' + R.altin + '"/>' +
      "</g>";
  }

  function kulaklar() {
    var tek = yol(KULAK, R.ten, 4);
    return '<g class="mk-kulak mk-kulak-sol">' + tek + "</g>" +
      '<g transform="translate(200 0) scale(-1 1)"><g class="mk-kulak mk-kulak-sag">' + tek + "</g></g>";
  }

  function bas(ifade) {
    return kulaklar() +
      yol(YUZ, R.ten) +
      yol(SAKAL, R.sakal) +
      cizgi("M80 132Q86 148 98 160", R.krem2, 3) + cizgi("M120 132Q114 148 102 160", R.krem2, 3) +
      yuz(ifade) + bork();
  }

  function ekler(ifade) {
    if (ifade === "kutlama") {
      var k = [
        [26, 40, 9, 5, R.mor, -25], [172, 28, 9, 5, R.altin, 30], [16, 76, 7, 4, R.altin, 50],
        [184, 70, 8, 4.5, R.mor, -40], [160, 8, 7, 4, R.tur, 15], [40, 10, 7, 4, R.morAcik, -60]
      ];
      return '<g class="mk-ek mk-konfeti">' + k.map(function (p, i) {
        return '<rect class="mk-konfeti' + i + '" x="' + (p[0] - p[2] / 2) + '" y="' + (p[1] - p[3] / 2) + '" width="' + p[2] + '" height="' + p[3] + '" rx="1.5" fill="' + p[4] + '" transform="rotate(' + p[5] + " " + p[0] + " " + p[1] + ')"/>';
      }).join("") + '<circle cx="186" cy="44" r="3" fill="' + R.tur + '"/><circle cx="12" cy="54" r="2.6" fill="' + R.morAcik + '"/></g>';
    }
    if (ifade === "uykulu") return '<g class="mk-ek mk-zzz">' + z(160, 46, 9, 0) + z(172, 26, 12, 1) + z(184, 2, 15, 2) + "</g>";
    if (ifade === "dusunen") {
      return '<g class="mk-ek mk-dusunce">' +
        '<circle class="mk-nokta0" cx="164" cy="70" r="3.2" fill="' + R.morAcik + '"/>' +
        '<circle class="mk-nokta1" cx="176" cy="54" r="4.6" fill="' + R.morAcik + '"/>' +
        '<circle class="mk-nokta2" cx="186" cy="34" r="6.2" fill="' + R.morAcik + '"/></g>';
    }
    if (ifade === "selam") {
      return '<g class="mk-ek mk-selam-iz">' + cizgi("M184 101Q189 104 191 109", R.morAcik, 3) + cizgi("M190 95Q196 100 198 108", R.morAcik, 3) + "</g>";
    }
    return "";
  }

  // Sırttaki kopuz (sapı sol omuzun üstünden çıkar); üzerine gelince sallanır
  function kopuz() {
    return '<g class="mk-kopuz">' +
      cizgi("M44 142L20 104", R.cizgi, 12) + cizgi("M44 142L20 104", R.ahsapKoyu, 6) +
      '<path d="M14 92L26 98L22 108L11 102Z" fill="' + R.ahsapKoyu + '" stroke="' + R.cizgi + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<circle cx="12" cy="98" r="2.6" fill="' + R.altin + '" stroke="' + R.cizgi + '" stroke-width="1.5"/>' +
      '<circle cx="25" cy="104" r="2.6" fill="' + R.altin + '" stroke="' + R.cizgi + '" stroke-width="1.5"/>' +
      yol(KOPUZ_GOVDE, R.ahsap) +
      '<path d="M48 146C56 146 61 154 60 162C59 170 54 175 47 175Z" fill="' + R.ahsapKoyu + '" opacity=".35"/>' +
      cizgi("M42 172L24 108", R.krem, 1.4) + cizgi("M47 172L28 106", R.krem, 1.4) +
      '<rect x="36" y="170" width="16" height="5" rx="2" fill="' + R.ahsapKoyu + '" stroke="' + R.cizgi + '" stroke-width="2"/>' +
      "</g>";
  }

  /** Tam gövde (viewBox 0 0 200 200) ya da yalnızca baş için SVG metni. */
  function html(ifade, o) {
    o = o || {};
    ifade = ifadeAl(ifade);
    var boyut = +o.boyut > 0 ? +o.boyut : 120;
    var id = "mk" + (++sayac) + "-";
    var anim = o.animasyon !== false;
    var etiket = o.etiket === false ? ' aria-hidden="true" focusable="false"' : ' role="img" aria-label="' + kacis(MASKOT_ADI + " " + ETIKET[ifade]) + '"';
    var sinif = "maskot maskot--" + ifade + (anim ? " maskot--anim" : "") + (o.sadeceBas ? " maskot--bas" : "") + (o.sinif ? " " + o.sinif : "");
    var gec = ' style="--mk-gecikme:' + (-((sayac * 1.7) % 5)).toFixed(1) + 's"';
    var basPoz = ifade === "dusunen" ? ' transform="rotate(6 100 132)"' : ifade === "uykulu" ? ' transform="rotate(-5 100 132)"' : "";
    if (o.sadeceBas) {
      return '<svg class="' + sinif + '" xmlns="http://www.w3.org/2000/svg" viewBox="14 -6 172 180" width="' + boyut + '" height="' + boyut + '"' + etiket + gec + ">" +
        '<g class="mk-bas"><g class="mk-bas-ic">' + bas(ifade) + "</g></g></svg>";
    }
    var defs = '<defs><clipPath id="' + id + 'g"><path d="' + GOVDE + '"/></clipPath></defs>';
    var govde =
      kopuz() +
      '<path d="' + GOVDE + '" fill="' + R.mor + '"/>' +
      '<g clip-path="url(#' + id + 'g)">' +
      '<path d="M50 176H150V190H50Z" fill="' + R.morKoyu + '"/>' +
      cizgi("M100 128V186", R.morKoyu, 4) +
      '<path d="M50 150H150V160H50Z" fill="' + R.altin + '" stroke="' + R.cizgi + '" stroke-width="2.5"/>' +
      cizgi("M50 176H150", R.altin, 3) + "</g>" +
      '<path d="' + GOVDE + '" fill="none" stroke="' + R.cizgi + '" stroke-width="' + CW + '" stroke-linejoin="round"/>' +
      '<ellipse cx="82" cy="185" rx="13.5" ry="7.5" fill="' + R.cizme + '" stroke="' + R.cizgi + '" stroke-width="' + CW + '"/>' +
      '<ellipse cx="118" cy="185" rx="13.5" ry="7.5" fill="' + R.cizme + '" stroke="' + R.cizgi + '" stroke-width="' + CW + '"/>';
    return '<svg class="' + sinif + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="' + boyut + '" height="' + boyut + '"' + etiket + gec + ">" +
      defs + '<g class="mk-hepsi"><g class="mk-nefes">' + govde +
      '<g class="mk-bas"' + basPoz + '><g class="mk-bas-ic">' + bas(ifade) + "</g></g>" +
      '<g class="mk-kollar">' + kollar(ifade) + "</g>" + "</g></g>" + ekler(ifade) + "</svg>";
  }

  /** Tek renkli baş silüeti (favicon / rozet / monokrom baskı): börk + yüz + sakal; gözler, bant ve bıyık oyuk. */
  function tekRenk(o) {
    o = o || {};
    var boyut = +o.boyut > 0 ? +o.boyut : 32, renk = o.renk || "currentColor", id = "mkt" + (++sayac);
    var b = function (d, dolgu, ek) { return '<path d="' + d + '" fill="' + dolgu + '"' + (ek || "") + "/>"; };
    return '<svg class="maskot maskot--tek" xmlns="http://www.w3.org/2000/svg" viewBox="14 -6 172 180" width="' + boyut + '" height="' + boyut + '" role="img" aria-label="' + kacis(MASKOT_ADI) + '">' +
      '<defs><mask id="' + id + '" maskUnits="userSpaceOnUse" x="0" y="-10" width="200" height="190">' +
      b(YUZ, "#fff", ' stroke="#fff" stroke-width="6"') + b(SAKAL, "#fff", ' stroke="#fff" stroke-width="6"') +
      '<g transform="rotate(-4 100 50)">' + b(BORK, "#fff", ' stroke="#fff" stroke-width="6"') +
      b(BORK_BANT, "#fff", ' stroke="#000" stroke-width="5"') + "</g>" +
      '<ellipse cx="80" cy="88" rx="7.5" ry="9.5" fill="#000"/><ellipse cx="120" cy="88" rx="7.5" ry="9.5" fill="#000"/>' +
      b(BIYIK, "none", ' stroke="#000" stroke-width="5" stroke-linejoin="round"') +
      "</mask></defs>" +
      '<rect x="0" y="-10" width="200" height="190" fill="' + kacis(renk) + '" mask="url(#' + id + ')"/></svg>';
  }

  function kisalt(m, n) {
    m = String(m == null ? "" : m).replace(/\s+/g, " ").trim();
    n = n || 90;
    if (m.length <= n) return m;
    var k = m.slice(0, n - 1), b = k.lastIndexOf(" ");
    return (b > n * 0.6 ? k.slice(0, b) : k).replace(/[\s,.;:]+$/, "") + "…";
  }

  var CEKIRDEK = {
    MASKOT_ADI: MASKOT_ADI, IFADELER: IFADELER, RENK: R,
    html: html, tekRenk: tekRenk, kisalt: kisalt,
    /** Node: statik SVG dosyalarını yazar (/assets/img/maskot). Tarayıcıda kullanılmaz. */
    dosyalariYaz: function (klasor) {
      var fs = require("fs"), path = require("path");
      fs.mkdirSync(klasor, { recursive: true });
      var temiz = function (s) { return s.replace(/ class="[^"]*"/g, "").replace(/ style="[^"]*"/g, "") + "\n"; };
      IFADELER.forEach(function (f) { fs.writeFileSync(path.join(klasor, "korkut-" + f + ".svg"), temiz(html(f, { boyut: 200, animasyon: false }))); });
      fs.writeFileSync(path.join(klasor, "korkut-bas.svg"), temiz(html("sevincli", { boyut: 48, sadeceBas: true, animasyon: false })));
      fs.writeFileSync(path.join(klasor, "korkut-tek-renk.svg"), temiz(tekRenk({ boyut: 64, renk: "#5B3DF5" })));
    }
  };

  if (typeof module !== "undefined" && module.exports) { module.exports = CEKIRDEK; return; }
  if (typeof document === "undefined") return;

  // ---- Tarayıcı ------------------------------------------------------------------------
  CEKIRDEK.el = function (ifade, o) {
    var s = document.createElement("span");
    s.className = "maskot-kap";
    s.innerHTML = html(ifade, o);
    return s;
  };

  CEKIRDEK.konus = function (hedefEl, o) {
    if (!hedefEl) return null;
    o = o || {};
    var kap = document.createElement("div");
    kap.className = "mk-konus";
    var boyut = +o.boyut > 0 ? +o.boyut : 96;
    kap.innerHTML =
      '<div class="mk-konus__maskot">' + html(o.ifade || "selam", { boyut: boyut, etiket: false }) + "</div>" +
      '<div class="mk-balon"><p class="mk-balon__metin"><strong class="mk-balon__ad">' + kacis(MASKOT_ADI) + ":</strong> " + kacis(kisalt(o.mesaj, 90)) + "</p>" +
      (o.kapanabilir ? '<button type="button" class="mk-balon__kapat" aria-label="Kapat"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>' : "") +
      "</div>";
    var btn = kap.querySelector(".mk-balon__kapat");
    if (btn) btn.addEventListener("click", function () {
      if (kap.parentNode) kap.parentNode.removeChild(kap);
      if (typeof o.kapaninca === "function") { try { o.kapaninca(); } catch (e) { /* yok say */ } }
    });
    hedefEl.appendChild(kap);
    return kap;
  };

  kok.MeberraMaskot = CEKIRDEK;
})(typeof window !== "undefined" ? window : this);
