/**
 * Meberra — Şartlar sayfaları için ortak madde bileşeni (Ajan 11, Tur 10)
 * Kullanan sayfalar: sartlar.html (Almanya / İtalya, sınıfa göre) ve mezun.html (Mezun Menüsü).
 * Yalnızca HTML dizesi üretir; DOM'a ve depolamaya dokunmaz. Madde şeması data/mevzuat/sartlar.js ile aynıdır:
 * {id, baslik?, metin, kaynak: [{ad, url}], kesinlik, sonKontrol, zaman?}
 * Tarayıcıda window.APMEBERRA_SARTLAR_UI. sartlar-motor.js'ten SONRA yüklenmelidir (göreli zaman için).
 */
(function () {
  "use strict";
  var KES = { "Doğrulandı": "ok", "Yoruma açık": "warn", "Yayımlanmadı": "info", "Teyit gerekir": "warn", "Doğrulanamadı": "bad" };
  var S = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var IC = {
    ext: '<svg ' + S + '><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    wait: '<svg ' + S + '><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    gerekenler: '<svg ' + S + '><path d="M9 4h6M9 4a2 2 0 0 0-2 2H5v15h14V6h-2a2 2 0 0 0-2-2M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/><path d="M8 12l2 2 4-4"/></svg>',
    buYil: '<svg ' + S + '><path d="M12 3l8 4v5c0 5-3.4 8.3-8 9-4.6-.7-8-4-8-9V7z"/><path d="M9 12l2 2 4-4"/></svg>',
    tarihler: '<svg ' + S + '><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    hatalar: '<svg ' + S + '><path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17h.01"/></svg>',
    apEtkisi: '<svg ' + S + '><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
    burslar: '<svg ' + S + '><circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/></svg>',
    uyarilar: '<svg ' + S + '><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>',
    ornekProgramlar: '<svg ' + S + '><path d="M4 19V5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM8 7h6M8 11h6"/></svg>',
    ylOrtak: '<svg ' + S + '><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>'
  };

  /**
   * Tur 11 (D6): ülke dosyasını gerektiğinde yükler (data/mevzuat/ulke/<cc>.js). file:// altında da çalışır
   * (seviye.js ile aynı yöntem: dinamik <script>). Dönüş: Promise<{veri|null, hata: bool}>. Zaman aşımı 8 sn.
   */
  var yuklemeler = {};
  function veriYukle(cc, dizinKaydi) {
    var V = window.APMEBERRA_ULKE_VERI || {};
    if (V[cc]) return Promise.resolve({ veri: V[cc], hata: false });
    if (!/^[a-z]{2}$/.test(String(cc || ""))) return Promise.resolve({ veri: null, hata: false });
    if (dizinKaydi && dizinKaydi.veri && dizinKaydi.veri.dosya === false) return Promise.resolve({ veri: null, hata: false });
    if (yuklemeler[cc]) return yuklemeler[cc];
    yuklemeler[cc] = new Promise(function (res) {
      var s = document.createElement("script"), bitti = false;
      function son(hata) {
        if (bitti) return; bitti = true; clearTimeout(t);
        var v = (window.APMEBERRA_ULKE_VERI || {})[cc] || null;
        if (hata || !v) delete yuklemeler[cc];
        res({ veri: v, hata: !!hata && !v });
      }
      var t = setTimeout(function () { son(true); }, 8000);
      s.src = "data/mevzuat/ulke/" + cc + ".js";
      s.async = true;
      s.onload = function () { son(false); };
      s.onerror = function () { son(true); };
      document.head.appendChild(s);
    });
    return yuklemeler[cc];
  }

  /** Program durumu rozeti (simge + metin; yalnızca renge dayanmaz). */
  function durumRozet(durum, onEk) {
    var M = window.APMEBERRA_SARTLAR_MOTOR, d = M && M.PROGRAM_DURUM[durum] || { etiket: durum || "", simge: "", sinif: "muted" };
    return '<span class="pd-rozet pd-' + esc(d.sinif) + '" data-durum="' + esc(durum) + '"><span aria-hidden="true">' + esc(d.simge) + '</span>' + (onEk ? esc(onEk) + ": " : "") + esc(d.etiket) + '</span>';
  }
  /** Üniversite dil hücresi rozeti (var/kismi/yok/teyit). */
  function uniDilRozet(v, onEk) {
    var M = window.APMEBERRA_SARTLAR_MOTOR, d = M && M.UNI_DIL[v];
    if (!d) return '<span class="pd-rozet pd-muted">' + (onEk ? esc(onEk) + " " : "") + '–</span>';
    return '<span class="pd-rozet pd-' + d.sinif + '"' + (d.uzun ? ' title="' + esc(d.uzun) + '"' : '') + '><span aria-hidden="true">' + d.simge + '</span>' + (onEk ? esc(onEk) + " " : "") + esc(d.etiket) + '</span>';
  }
  /** K-B: dil süzgecinde Doğrulanamadı hücreli üniversite satırı rozeti */
  function teyitRozet() { return '<span class="pd-rozet pd-warn uni-teyit"><span aria-hidden="true">?</span>Doğrulanamadı — resmi katalogdan kontrol et</span>'; }
  /** Sıralama yayın tarihi: "2026-06" -> "Haziran 2026" */
  function yayinYaz(y) {
    var m = /^(\d{4})-(\d{2})/.exec(String(y || ""));
    var AY = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    return m && +m[2] >= 1 && +m[2] <= 12 ? AY[+m[2] - 1] + " " + m[1] : String(y || "");
  }
  /** Sıralama satırı: "QS World University Rankings 2027 · yayın: Haziran 2026 · ülke içi sıra · Sıralama kaynağı" */
  function siralamaHtml(sir) {
    sir = sir || {};
    return esc(sir.ad || "Sıralama") + (sir.yayin ? " · yayın: " + esc(yayinYaz(sir.yayin)) : "") + " · ülke içi sıra · " + src(sir.url, "Sıralama kaynağı");
  }
  /** K-D: ülke özet uyarısı satırı */
  function ozetUyariHtml(u) {
    if (!u) return "";
    return '<p class="ozet-uyari"><span class="pd-rozet pd-warn"><span aria-hidden="true">!</span>Uyarı</span> ' + esc(u.metin) + ' ' + (u.kaynak || []).map(function (k) { return src(k && k.url, k && k.ad); }).join("") + '</p>';
  }

  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
  function isUrl(u) { return typeof u === "string" && /^https?:\/\//i.test(u); }
  function host(u) { var m = /^https?:\/\/(?:www\.)?([^\/?#]+)/i.exec(u || ""); return m ? m[1] : ""; }
  /** Resmi kaynak bağlantısı (yeni sekmede). Adres http(s) değilse boş. */
  function src(u, label) {
    return isUrl(u) ? '<a class="src-link" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(label || ("Kaynak · " + host(u))) + IC.ext + '<span class="visually-hidden"> (yeni sekmede açılır)</span></a>' : "";
  }
  /** Kesinlik etiketi (Doğrulandı / Yoruma açık / Yayımlanmadı / Teyit gerekir / Doğrulanamadı). */
  function kes(k) {
    var c = KES[k]; if (!c) return "";
    return '<span class="kesinlik kesinlik-' + c + '" title="Bilginin kesinliği">' + esc(k) + '</span>';
  }
  function gunYaz(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "";
  }

  /** Tek madde kartı. mez: mezuniyet yılı (takvim tarihi için, isteğe bağlı). */
  function maddeHtml(m, mez) {
    var M = window.APMEBERRA_SARTLAR_MOTOR, R = window.APMEBERRA_ROTA;
    var kaynaklar = (m.kaynak || []).map(function (k) { return src(k && k.url, k && k.ad); }).join("");
    var zaman = "";
    if (m.zaman && M) {
      var gz = M.goreliZaman(m.zaman);
      var tarih = mez && R && m.zaman.mezuniyetGore != null ? (R.adimTarihi({ zaman: m.zaman }, mez) || {}).etiket : "";
      zaman = '<div class="sr-when">' + (tarih ? '<span class="sr-date">' + esc(tarih) + '</span>' : "") + (gz.etiket ? '<span class="sr-rel">' + esc(gz.etiket) + '</span>' : "") + '</div>' +
        (m.zaman.metin && m.zaman.metin !== gz.etiket ? '<p class="sr-when-note">' + esc(m.zaman.metin) + '</p>' : "");
    }
    return '<li class="sr-item"' + (m.id ? ' id="m-' + esc(m.id) + '"' : "") + '>' +
      zaman +
      (m.baslik ? '<h4>' + esc(m.baslik) + '</h4>' : "") +
      '<p class="sr-text">' + esc(m.metin) + '</p>' +
      '<div class="sr-meta">' + kes(m.kesinlik) + '<span class="sr-srcs">' + kaynaklar + '</span>' +
        (m.sonKontrol ? '<span class="sr-checked">Son kontrol: ' + esc(gunYaz(m.sonKontrol)) + '</span>' : "") +
      '</div></li>';
  }

  /**
   * Bölüm (b = {id, baslik}). opt: {mez, bosMetin: "…", bosEk: "…"} — boş bölümde "Bu bölüm hazırlanıyor".
   */
  function bolumHtml(b, list, opt) {
    opt = opt || {};
    var hid = "sr-" + b.id + "-h";
    return '<section class="sr-sec sr-sec-' + b.id + (list.length ? "" : " is-empty") + '" id="sr-' + b.id + '" aria-labelledby="' + hid + '">' +
      '<div class="sr-sec-head"><span class="sr-sec-ico" aria-hidden="true">' + (IC[b.id] || IC.gerekenler) + '</span>' +
        '<h2 id="' + hid + '">' + esc(b.baslik) + '</h2>' + (list.length ? '<span class="rs-count">' + list.length + '</span>' : "") + '</div>' +
      (list.length
        ? '<ul class="sr-items">' + list.map(function (m) { return maddeHtml(m, opt.mez); }).join("") + '</ul>'
        : '<div class="sr-empty">' + IC.wait + '<div><strong>Bu bölüm hazırlanıyor</strong><p>' + esc(opt.bosMetin || "") + (opt.bosEk ? " " + esc(opt.bosEk) : "") + '</p></div></div>') +
    '</section>';
  }

  window.APMEBERRA_SARTLAR_UI = { KES: KES, IC: IC, esc: esc, src: src, kes: kes, gunYaz: gunYaz, maddeHtml: maddeHtml, bolumHtml: bolumHtml,
    veriYukle: veriYukle, durumRozet: durumRozet, uniDilRozet: uniDilRozet, teyitRozet: teyitRozet, yayinYaz: yayinYaz, siralamaHtml: siralamaHtml, ozetUyariHtml: ozetUyariHtml };
})();
