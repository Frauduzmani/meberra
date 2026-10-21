/*
 * Meberra 1.8.0 — Temiz adresler (tek kaynak). Hem tarayıcıda (window.MEBERRA_ADRES) hem Node'da (require) çalışır.
 * Sunucu (server/adresler.js) bu listeyi kullanır ve buna yalnızca sunucuda bilinen yönetim adresini ekler:
 * yönetim sayfasının yolu herkese açık bu dosyada YOKTUR (istemci "/admin.html" der; sunucu yöneticiyi yönlendirir,
 * diğerlerine 404 verir).
 *
 *   yol      : adres satırında görünen temiz yol
 *   dosya    : diskteki sayfa (kök klasör)
 *   herkese  : herkese açık tanıtım sayfası (site haritası + <link rel="canonical">)
 *   takma    : aynı dosyanın ikinci adresi (/kayit → giris.html); dosyadan yol bulunurken atlanır
 */
(function (kok, fabrika) {
  var A = fabrika();
  if (typeof module === "object" && module.exports) module.exports = A;
  else kok.MEBERRA_ADRES = A;
  // Ders sayfası ünite/bölüm görünümü (?unite=N · ?bolum=K): ilk boyamadan önce işaretlenir; ana içerik app.js
  // initUniteGorunumu doğru üniteyi seçene dek gizli kalır (tüm sayfa çizilip sonra gizlenince oluşan kayma olmasın).
  try {
    if (typeof document !== "undefined" && document.documentElement && typeof location !== "undefined" &&
        /^\/(ders\/|ap-|sinav-cents)/.test(location.pathname) && /[?&](unite|bolum)=\d/.test(location.search)) {
      var kd = document.documentElement;
      kd.classList.add("ug-erken");
      // Emniyet: app.js hiç çalışmazsa içerik yine de görünür
      setTimeout(function () { kd.classList.remove("ug-erken"); }, 6000);
    }
  } catch (e) { /* işaret isteğe bağlı */ }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var LISTE = [
    { yol: "/", dosya: "vitrin.html", herkese: true },
    { yol: "/bugun", dosya: "index.html" },
    { yol: "/calis", dosya: "calis.html" },
    { yol: "/ilerleme", dosya: "ilerleme.html" },
    { yol: "/plan", dosya: "plan.html" }, // 1.18.0 kişisel çalışma planı
    { yol: "/profil", dosya: "profil.html" },
    { yol: "/sorularim", dosya: "sorularim.html" },
    { yol: "/premium", dosya: "premium.html" },
    { yol: "/fiyatlar", dosya: "fiyatlar.html", herkese: true },
    { yol: "/giris", dosya: "giris.html", herkese: true },
    { yol: "/kayit", dosya: "giris.html", takma: true },
    { yol: "/sifre-sifirla", dosya: "sifre-sifirla.html" },
    { yol: "/ders/calculus", dosya: "ap-calculus.html" },
    { yol: "/ders/physics", dosya: "ap-physics.html" },
    { yol: "/ders/chemistry", dosya: "ap-chemistry.html" },
    { yol: "/ders/biology", dosya: "ap-biology.html" },
    { yol: "/ders/english", dosya: "ap-english.html" },
    { yol: "/ders/secmeli", dosya: "ap-electives.html" },
    { yol: "/ders/cent-s", dosya: "sinav-cents.html" },
    { yol: "/deneme", dosya: "deneme.html" },
    { yol: "/seviye-testi", dosya: "seviye-testi.html" },
    { yol: "/frq", dosya: "frq.html" }, // 1.11.0 FRQ pratiği (/frq?ders=calculus)
    { yol: "/kartlar", dosya: "kartlar.html" }, // 1.18.0 kavram kartları (aralıklı tekrar)
    { yol: "/hiz-turu", dosya: "hiz.html" }, // 1.17.0 Hız turu (60 sn)
    { yol: "/ulkem", dosya: "sartlar.html", herkese: true },
    { yol: "/universiteler", dosya: "universiteler.html", herkese: true },
    { yol: "/takvim", dosya: "rota.html" },
    { yol: "/sinavlar", dosya: "sinavlar.html", herkese: true },
    { yol: "/basvurular", dosya: "yazismalar.html" },
    { yol: "/rehber/almanya", dosya: "almanya-muhendislik.html", herkese: true },
    { yol: "/rehber/italya", dosya: "italya-muhendislik.html", herkese: true },
    { yol: "/rehber/istanbul-sinav", dosya: "istanbul-sinav-rehberi.html", herkese: true },
    // 1.18.0 herkese açık SEO rehber makaleleri (app.js yüklemez; oturumsuz ziyaretçi tam görür)
    { yol: "/rehber/ap-nedir", dosya: "rehber-ap-nedir.html", herkese: true },
    { yol: "/rehber/turkiyede-ap", dosya: "rehber-turkiyede-ap.html", herkese: true },
    { yol: "/rehber/ap-ile-avrupa", dosya: "rehber-ap-ile-avrupa.html", herkese: true },
    { yol: "/rehber/ap-calculus-nasil-calisilir", dosya: "rehber-ap-calculus.html", herkese: true },
    { yol: "/rehber/ap-fizik-kimya-biyoloji", dosya: "rehber-ap-fen.html", herkese: true },
    { yol: "/rehber/ap-puan-tahmini", dosya: "rehber-ap-puan-tahmini.html", herkese: true },
    { yol: "/kaynaklar", dosya: "bilgi-merkezi.html" },
    { yol: "/veli", dosya: "veli.html" },
    { yol: "/ogretmen", dosya: "ogretmen.html" }, // 1.19.0 okul: öğretmen paneli
    { yol: "/sinif", dosya: "sinif.html" }, // 1.19.0 okul: öğrenci sınıfa katılım (/sinif?kod=XXXXXX)
    { yol: "/bakim", dosya: "bakim.html" },
    { yol: "/cevrimdisi", dosya: "cevrimdisi.html" }, // 1.15.0 çevrimdışı sayfa (sw.js önbelleğe alır)
    { yol: "/mezun", dosya: "mezun.html" },
    { yol: "/kvkk", dosya: "kvkk.html", herkese: true },
    { yol: "/gizlilik", dosya: "gizlilik.html", herkese: true },
    { yol: "/kosullar", dosya: "kosullar.html", herkese: true },
    { yol: "/mesafeli-satis", dosya: "mesafeli-satis.html", herkese: true },
    { yol: "/cerez", dosya: "cerez.html", herkese: true }
  ];
  var YOLDAN = {}, DOSYADAN = {};
  LISTE.forEach(function (g) {
    YOLDAN[g.yol] = g;
    if (!g.takma) DOSYADAN[g.dosya] = g;
  });

  /** "/ders/calculus" → { yol, dosya, ... } | null */
  function yoldan(yol) { return Object.prototype.hasOwnProperty.call(YOLDAN, yol) ? YOLDAN[yol] : null; }
  /** "ap-calculus.html" → "/ders/calculus" | null */
  function dosyadan(dosya) {
    var d = String(dosya || "").toLowerCase();
    return Object.prototype.hasOwnProperty.call(DOSYADAN, d) ? DOSYADAN[d].yol : null;
  }
  /** Mantıksal sayfa kimliği (dosya adı, .html'siz) → temiz yol: "ap-calculus" → "/ders/calculus"; bilinmiyorsa null */
  function sayfaAdres(id) { return dosyadan(String(id || "").replace(/\.html?$/i, "") + ".html"); }

  var ESKI_RE = /^(?:\.?\/)?([A-Za-z0-9_-]+)\.html?([?#][\s\S]*)?$/;
  /** Eski biçimli site içi bağlantıyı temiz yola çevirir: "sartlar.html?ulke=de#x" → "/ulkem?ulke=de#x".
   *  Bilinmeyen sayfa, dış adres ya da zaten temiz yol olduğu gibi döner. */
  function temiz(href) {
    var s = String(href == null ? "" : href);
    var m = ESKI_RE.exec(s);
    if (!m) return s;
    var y = dosyadan(m[1] + ".html");
    return y ? y + (m[2] || "") : s;
  }

  /** Yol → mantıksal sayfa kimliği ("index", "ap-calculus", "giris", "vitrin"...).
   *  Tarayıcıda argümansız: önce sunucunun eklediği <meta name="meberra-sayfa">, sonra adres satırı. */
  function sayfa(yol) {
    if (yol == null && typeof document !== "undefined") {
      var meta = document.querySelector && document.querySelector('meta[name="meberra-sayfa"]');
      if (meta && meta.getAttribute("content")) return meta.getAttribute("content");
    }
    if (yol == null) yol = typeof location !== "undefined" ? location.pathname : "/";
    var p = String(yol).split(/[?#]/)[0];
    try { p = decodeURIComponent(p); } catch (e) { /* olduğu gibi */ }
    if (p.length > 1) p = p.replace(/\/+$/, "");
    var g = yoldan(p);
    if (g) return g.dosya.replace(/\.html$/, "");
    // Dosyadan açılış / eski adres: son parça (.html'siz); boşsa "index"
    var son = p.split("/").pop() || "";
    return son.replace(/\.html?$/i, "") || "index";
  }

  return { LISTE: LISTE, yoldan: yoldan, dosyadan: dosyadan, sayfaAdres: sayfaAdres, temiz: temiz, sayfa: sayfa };
});
