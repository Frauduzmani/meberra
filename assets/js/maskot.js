/**
 * Meberra maskotu — "Tilo" (genç tilki). Kitaplıksız, derlemesiz; satır içi SVG üretir ki CSS parçaları
 * (göz kırpma, kuyruk sallama, kulak oynatma, el sallama, zıplama) canlandırabilsin. Stiller: assets/css/maskot.css
 *
 * API (window.MeberraMaskot):
 *   MASKOT_ADI                          → "Tilo" (adı değiştirmek için yalnızca aşağıdaki sabiti değiştirin)
 *   IFADELER                            → ["sevincli","kutlama","dusunen","uykulu","uzgun","selam"]
 *   html(ifade, { boyut, animasyon, sadeceBas, etiket, sinif }) → satır içi SVG metni
 *      boyut: px (varsayılan 120) · animasyon: true (azaltılmış harekette CSS zaten durdurur)
 *      sadeceBas: true → bildirim/avatar için yalnızca baş (24–48 px) · etiket: false → aria-hidden (yanında metin varsa)
 *   el(ifade, opts)                     → aynı SVG'yi taşıyan <span class="maskot-kap"> öğesi
 *   tekRenk({ boyut, renk })            → favicon/rozet için tek renkli baş (renk varsayılan currentColor)
 *   konus(hedefEl, { ifade, mesaj, kapanabilir, boyut, kapaninca }) → hedefEl içine maskot + konuşma balonu çizer
 *      (boş durumlar, ipuçları, "serin tehlikede" kartı). Mesaj en çok ~90 karakter; uzunsa kelime sınırında kısaltılır.
 *
 * Statik dosyalar (/assets/img/maskot/tilki-<ifade>.svg, tilki-bas.svg, tilki-tek-renk.svg) bu dosyadan üretilir:
 *   node -e "require('/assets/js/maskot.js').dosyalariYaz('/assets/img/maskot')"
 */
(function (kok) {
  "use strict";

  var MASKOT_ADI = "Tilo";
  var IFADELER = ["sevincli", "kutlama", "dusunen", "uykulu", "uzgun", "selam"];
  var ETIKET = {
    sevincli: "mutlu", kutlama: "kutlama yapıyor", dusunen: "düşünüyor",
    uykulu: "uykulu", uzgun: "biraz üzgün ama umutlu", selam: "el sallıyor"
  };

  // Renkler (marka: mor #5B3DF5, enerji turuncusu #FF6B2C)
  var R = {
    tur: "#FF6B2C", turKoyu: "#E8571F", krem: "#FFF6EC", kulakIc: "#FFC7A6",
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
  var BAS = "M100 40C136 40 160 60 163 88L177 104C165 106 157 110 151 116C140 130 122 138 100 138C78 138 60 130 49 116C43 110 35 106 23 104L37 88C40 60 64 40 100 40Z";
  var MASKE = "M8 160L8 104C32 98 54 95 67 101C80 107 91 104 100 95C109 104 120 107 133 101C146 95 168 98 192 104L192 160Z";
  var KULAK = "M60 64C51 47 45 29 47 13C62 17 80 31 89 48Z";
  var KULAK_IC = "M63 55C58 43 55 33 55 25C64 30 74 39 80 47Z";
  var GOVDE = "M72 126C60 138 54 158 58 174C60 182 68 186 78 186L122 186C132 186 140 182 142 174C146 158 140 138 128 126Z";
  var GOGUS = "M78 122Q100 148 122 122L126 150Q112 180 100 182Q88 180 74 150Z";
  var KUYRUK = "M126 178C162 188 197 171 196 141C195 129 192 120 185 111C184 130 174 146 151 152C141 155 133 157 126 158Z";
  var BURUN = "M92.5 103Q100 98.5 107.5 103Q105.5 109.5 100 111.5Q94.5 109.5 92.5 103Z";

  function yol(d, dolgu, ek) {
    return '<path d="' + d + '" fill="' + dolgu + '" stroke="' + R.cizgi + '" stroke-width="' + CW + '" stroke-linejoin="round"' + (ek || "") + "/>";
  }
  function cizgi(d, renk, kalin, ek) {
    return '<path d="' + d + '" fill="none" stroke="' + (renk || R.cizgi) + '" stroke-width="' + (kalin || 4) + '" stroke-linecap="round" stroke-linejoin="round"' + (ek || "") + "/>";
  }
  // Kalın, çerçeveli kol: önce koyu geniş çizgi, sonra turuncu dar çizgi (her pozda aynı tutarlı kontur)
  function kol(d, sinif, ek) {
    return '<g class="' + sinif + '"' + (ek || "") + ">" +
      cizgi(d, R.cizgi, 18) + cizgi(d, R.tur, 9) + "</g>";
  }
  function z(x, y, s, i) {
    return '<path class="mk-z mk-z' + i + '" d="M' + x + " " + y + "h" + s + "l-" + s + " " + s + "h" + s + '" fill="none" stroke="' + R.morAcik + '" stroke-width="' + (2.5 + i * 0.5) + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  // Kollar (ifadeye göre değişen grup)
  var KOL = {
    solDinlen: "M73 137Q69 151 80 160",
    sagDinlen: "M127 137Q131 151 120 160",
    solYukari: "M70 138Q50 137 37 121",
    sagYukari: "M130 138Q150 137 163 121",
    sagSalla: "M129 139Q166 142 185 121",
    sagCene: "M128 138Q136 126 113 128"
  };

  function kollar(ifade) {
    if (ifade === "kutlama") return kol(KOL.solYukari, "mk-kol mk-kol-sol") + kol(KOL.sagYukari, "mk-kol mk-kol-sag");
    if (ifade === "selam") return kol(KOL.solDinlen, "mk-kol mk-kol-sol") + kol(KOL.sagSalla, "mk-kol mk-kol-sag mk-kol-salla");
    if (ifade === "dusunen") return kol(KOL.solDinlen, "mk-kol mk-kol-sol") + kol(KOL.sagCene, "mk-kol mk-kol-sag");
    return kol(KOL.solDinlen, "mk-kol mk-kol-sol") + kol(KOL.sagDinlen, "mk-kol mk-kol-sag");
  }

  function gozNormal(dx, dy, kucuk) {
    var rx = kucuk ? 7 : 7.5, ry = kucuk ? 8.5 : 9.5;
    var g = function (cx) {
      return '<g class="mk-goz"><ellipse cx="' + (cx + dx) + '" cy="' + (88 + dy) + '" rx="' + rx + '" ry="' + ry + '" fill="' + R.cizgi + '"/>' +
        '<circle cx="' + (cx + dx + 2.6) + '" cy="' + (84 + dy) + '" r="2.9" fill="' + R.beyaz + '"/>' +
        '<circle cx="' + (cx + dx - 2.4) + '" cy="' + (91.5 + dy) + '" r="1.3" fill="' + R.beyaz + '" opacity=".7"/></g>';
    };
    return '<g class="mk-gozler">' + g(78) + g(122) + "</g>";
  }

  function yuz(ifade) {
    var s = "";
    // Gözler + kaşlar
    if (ifade === "kutlama") {
      s += '<g class="mk-gozler mk-gozler--mutlu">' + cizgi("M69 91Q78 79 87 91", R.cizgi, 5) + cizgi("M113 91Q122 79 131 91", R.cizgi, 5) + "</g>";
    } else if (ifade === "uykulu") {
      s += '<g class="mk-gozler mk-gozler--kapali">' + cizgi("M69 88Q78 95 87 88", R.cizgi, 4.5) + cizgi("M113 88Q122 95 131 88", R.cizgi, 4.5) + "</g>";
    } else if (ifade === "dusunen") {
      s += gozNormal(2, -2, false);
      s += cizgi("M113 70Q122 63 131 68", R.cizgi, 3.5) + cizgi("M70 74Q78 72 86 74", R.cizgi, 3.5);
    } else if (ifade === "uzgun") {
      s += gozNormal(0, 1, true);
      s += cizgi("M69 77Q77 75 85 71", R.cizgi, 3.5) + cizgi("M115 71Q123 75 131 77", R.cizgi, 3.5);
    } else {
      s += gozNormal(0, 0, false);
    }
    // Yanaklar
    s += '<ellipse class="mk-yanak" cx="61" cy="109" rx="8.5" ry="5" fill="' + R.yanak + '" opacity="' + (ifade === "uykulu" ? ".55" : ".42") + '"/>' +
      '<ellipse class="mk-yanak" cx="139" cy="109" rx="8.5" ry="5" fill="' + R.yanak + '" opacity="' + (ifade === "uykulu" ? ".55" : ".42") + '"/>';
    // Burun
    s += '<path d="' + BURUN + '" fill="' + R.cizgi + '"/><ellipse cx="97.5" cy="102.6" rx="2.4" ry="1.2" fill="' + R.beyaz + '" opacity=".55"/>';
    // Ağız
    if (ifade === "sevincli" || ifade === "selam") {
      s += '<path d="M90 115.5Q100 131 110 115.5Q100 118.5 90 115.5Z" fill="' + R.cizgi + '" stroke="' + R.cizgi + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M95 123.5Q100 128.5 105 123.5Q100 121 95 123.5Z" fill="' + R.dil + '"/>';
      s += cizgi("M100 111.5L100 116", R.cizgi, 2.5);
    } else if (ifade === "kutlama") {
      s += '<path d="M86 115Q100 138 114 115Q100 119 86 115Z" fill="' + R.cizgi + '" stroke="' + R.cizgi + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M93 127Q100 134 107 127Q100 123 93 127Z" fill="' + R.dil + '"/>';
    } else if (ifade === "dusunen") {
      s += cizgi("M91 120Q97 117.5 104 119.5", R.cizgi, 3.5);
    } else if (ifade === "uykulu") {
      s += '<ellipse cx="100" cy="120" rx="3.6" ry="4.4" fill="' + R.cizgi + '"/>';
    } else if (ifade === "uzgun") {
      s += cizgi("M93 120.5Q100 116.5 107 120.5", R.cizgi, 3.5);
    }
    return s;
  }

  function kep() {
    return '<g class="mk-kep" transform="rotate(-6 100 36)">' +
      '<path d="M81 43L81 33L119 33L119 43Q100 51 81 43Z" fill="' + R.morKoyu + '" stroke="' + R.cizgi + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M63 31L100 17L137 31L100 45Z" fill="' + R.mor + '" stroke="' + R.cizgi + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M76 31L100 22L111 26" fill="none" stroke="' + R.morAcik + '" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>' +
      '<g class="mk-puskul">' + cizgi("M100 31Q121 31 133 35L135 49", R.altin, 3) +
      '<path d="M130.5 48.5L139.5 48.5L141 59Q135 61.5 129 59Z" fill="' + R.altin + '" stroke="' + R.cizgi + '" stroke-width="2.5" stroke-linejoin="round"/></g>' +
      '<circle cx="100" cy="31" r="3.6" fill="' + R.altin + '" stroke="' + R.cizgi + '" stroke-width="2"/>' +
      "</g>";
  }

  function kulaklar(ifade) {
    var poz = ifade === "uzgun" ? ' transform="rotate(-24 72 58)"' : ifade === "uykulu" ? ' transform="rotate(-12 72 58)"' : "";
    var tek = '<g' + poz + '><g class="mk-kulak-ic">' + yol(KULAK, R.tur) + '<path d="' + KULAK_IC + '" fill="' + R.kulakIc + '"/></g></g>';
    return '<g class="mk-kulak mk-kulak-sol">' + tek + "</g>" +
      '<g transform="translate(200 0) scale(-1 1)"><g class="mk-kulak mk-kulak-sag">' + tek + "</g></g>";
  }

  function bas(ifade, id) {
    return kulaklar(ifade) +
      '<path d="' + BAS + '" fill="' + R.tur + '"/>' +
      '<g clip-path="url(#' + id + 'b)"><path d="' + MASKE + '" fill="' + R.krem + '"/>' +
      '<ellipse cx="100" cy="52" rx="22" ry="10" fill="#FF8A52" opacity=".55"/></g>' +
      '<path d="' + BAS + '" fill="none" stroke="' + R.cizgi + '" stroke-width="' + CW + '" stroke-linejoin="round"/>' +
      yuz(ifade) + kep();
  }

  function ekler(ifade) {
    if (ifade === "kutlama") {
      var k = [
        [26, 40, 9, 5, R.mor, -25], [172, 28, 9, 5, R.altin, 30], [16, 76, 7, 4, R.altin, 50],
        [184, 70, 8, 4.5, R.mor, -40], [150, 8, 7, 4, R.tur, 15], [44, 10, 7, 4, R.morAcik, -60]
      ];
      return '<g class="mk-ek mk-konfeti">' + k.map(function (p, i) {
        return '<rect class="mk-konfeti' + i + '" x="' + (p[0] - p[2] / 2) + '" y="' + (p[1] - p[3] / 2) + '" width="' + p[2] + '" height="' + p[3] + '" rx="1.5" fill="' + p[4] + '" transform="rotate(' + p[5] + " " + p[0] + " " + p[1] + ')"/>';
      }).join("") + '<circle cx="186" cy="44" r="3" fill="' + R.tur + '"/><circle cx="12" cy="54" r="2.6" fill="' + R.morAcik + '"/></g>';
    }
    if (ifade === "uykulu") return '<g class="mk-ek mk-zzz">' + z(160, 46, 9, 0) + z(172, 26, 12, 1) + z(184, 2, 15, 2) + "</g>";
    if (ifade === "dusunen") {
      return '<g class="mk-ek mk-dusunce">' +
        '<circle class="mk-nokta0" cx="171" cy="64" r="3.2" fill="' + R.morAcik + '"/>' +
        '<circle class="mk-nokta1" cx="181" cy="49" r="4.6" fill="' + R.morAcik + '"/>' +
        '<circle class="mk-nokta2" cx="188" cy="30" r="6.2" fill="' + R.morAcik + '"/></g>';
    }
    if (ifade === "selam") {
      return '<g class="mk-ek mk-selam-iz">' + cizgi("M184 101Q189 104 191 109", R.morAcik, 3) + cizgi("M190 95Q196 100 198 108", R.morAcik, 3) + "</g>";
    }
    return "";
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
    var defs = '<defs><clipPath id="' + id + 'b"><path d="' + BAS + '"/></clipPath>' +
      (o.sadeceBas ? "" : '<clipPath id="' + id + 'g"><path d="' + GOVDE + '"/></clipPath><clipPath id="' + id + 'k"><path d="' + KUYRUK + '"/></clipPath>') + "</defs>";
    var basPoz = ifade === "dusunen" ? ' transform="rotate(6 100 132)"' : ifade === "uykulu" ? ' transform="rotate(-5 100 132)"' : "";
    if (o.sadeceBas) {
      return '<svg class="' + sinif + '" xmlns="http://www.w3.org/2000/svg" viewBox="20 -4 160 160" width="' + boyut + '" height="' + boyut + '"' + etiket + gec + ">" +
        defs + '<g class="mk-bas"><g class="mk-bas-ic">' + bas(ifade, id) + "</g></g></svg>";
    }
    var govde =
      '<g class="mk-kuyruk">' + '<path d="' + KUYRUK + '" fill="' + R.tur + '"/>' +
      '<g clip-path="url(#' + id + 'k)"><circle cx="190" cy="106" r="27" fill="' + R.krem + '"/></g>' +
      '<path d="' + KUYRUK + '" fill="none" stroke="' + R.cizgi + '" stroke-width="' + CW + '" stroke-linejoin="round"/></g>' +
      '<g class="mk-canta"><rect x="41" y="133" width="32" height="42" rx="11" fill="' + R.mor + '" stroke="' + R.cizgi + '" stroke-width="' + CW + '"/>' +
      '<path d="M46 154H60" stroke="' + R.morAcik + '" stroke-width="3" stroke-linecap="round"/></g>' +
      '<path d="' + GOVDE + '" fill="' + R.tur + '"/>' +
      '<g clip-path="url(#' + id + 'g)"><path d="' + GOGUS + '" fill="' + R.krem + '"/>' +
      cizgi("M78 128C73 145 70 160 69 180", R.mor, 8) + cizgi("M122 128C127 145 130 160 131 180", R.mor, 8) +
      '<rect x="66" y="149" width="11" height="7" rx="2.5" fill="' + R.altin + '" stroke="' + R.cizgi + '" stroke-width="2"/>' +
      '<rect x="123" y="149" width="11" height="7" rx="2.5" fill="' + R.altin + '" stroke="' + R.cizgi + '" stroke-width="2"/></g>' +
      '<path d="' + GOVDE + '" fill="none" stroke="' + R.cizgi + '" stroke-width="' + CW + '" stroke-linejoin="round"/>' +
      '<ellipse cx="82" cy="185" rx="13.5" ry="7.5" fill="' + R.turKoyu + '" stroke="' + R.cizgi + '" stroke-width="' + CW + '"/>' +
      '<ellipse cx="118" cy="185" rx="13.5" ry="7.5" fill="' + R.turKoyu + '" stroke="' + R.cizgi + '" stroke-width="' + CW + '"/>';
        return '<svg class="' + sinif + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="' + boyut + '" height="' + boyut + '"' + etiket + gec + ">" +
      defs + '<g class="mk-hepsi"><g class="mk-nefes">' + govde +
      '<g class="mk-bas"' + basPoz + '><g class="mk-bas-ic">' + bas(ifade, id) + "</g></g>" +
      '<g class="mk-kollar">' + kollar(ifade) + "</g>" + "</g></g>" + ekler(ifade) + "</svg>";
  }

  /** Tek renkli baş silüeti (favicon / rozet / monokrom baskı). */
  function tekRenk(o) {
    o = o || {};
    var boyut = +o.boyut > 0 ? +o.boyut : 32, renk = o.renk || "currentColor", id = "mkt" + (++sayac);
    var ayna = function (d) { return '<path d="' + d + '" transform="translate(200 0) scale(-1 1)"'; };
    return '<svg class="maskot maskot--tek" xmlns="http://www.w3.org/2000/svg" viewBox="20 -4 160 160" width="' + boyut + '" height="' + boyut + '" role="img" aria-label="' + kacis(MASKOT_ADI) + '">' +
      '<defs><clipPath id="' + id + 'c"><path d="' + BAS + '"/></clipPath>' +
      '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="0" y="-10" width="200" height="180">' +
      '<path d="' + KULAK + '" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>' + ayna(KULAK) + ' fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="' + BAS + '" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="' + MASKE + '" fill="#000" clip-path="url(#' + id + 'c)"/>' +
      '<path d="' + BAS + '" fill="none" stroke="#fff" stroke-width="12" stroke-linejoin="round"/>' +
      '<g transform="rotate(-6 100 36)"><path d="M63 31L100 17L137 31L100 45Z" fill="#fff" stroke="#000" stroke-width="5" stroke-linejoin="round"/></g>' +
      '<path d="' + KULAK_IC + '" fill="#000"/>' + ayna(KULAK_IC) + ' fill="#000"/>' +
      '<ellipse cx="78" cy="86" rx="8.5" ry="10.5" fill="#000"/><ellipse cx="122" cy="86" rx="8.5" ry="10.5" fill="#000"/>' +
      '<path d="' + BURUN + '" transform="translate(100 106) scale(1.5) translate(-100 -106)" fill="#fff"/>' +
      "</mask></defs>" +
      '<rect x="0" y="-10" width="200" height="180" fill="' + kacis(renk) + '" mask="url(#' + id + ')"/></svg>';
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
      IFADELER.forEach(function (f) { fs.writeFileSync(path.join(klasor, "tilki-" + f + ".svg"), temiz(html(f, { boyut: 200, animasyon: false }))); });
      fs.writeFileSync(path.join(klasor, "tilki-bas.svg"), temiz(html("sevincli", { boyut: 48, sadeceBas: true, animasyon: false })));
      fs.writeFileSync(path.join(klasor, "tilki-tek-renk.svg"), temiz(tekRenk({ boyut: 64, renk: "#5B3DF5" })));
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
