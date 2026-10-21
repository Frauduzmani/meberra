/**
 * Meberra — Üniversite İsterleri, Sınavlar ve Ders Bağlantıları Motoru (Tur 13)
 * Ajan 11 (Frontend & UX) + Ajan 12 (İçerik & Deneme) + Ajan 2 (Weber & Rossi)
 *
 * Sorumluluk:
 * 1. Her üniversitenin (ülke, program dili ve kurum özeline göre) gereken Dil Sınavları ve Bilim Sınavlarını tespit etmek.
 * 2. Her sınav için ilgili dersleri, derin konu anlatımlarını ve doğrudan deneme sınavı bağlantılarını üretmek.
 * 3. sartlar.html ve universiteler.html sayfalarında zengin arayüz bileşeni (HTML) sunmak.
 *
 * Saf fonksiyonlar içerir, tarayıcıda window.APMEBERRA_UNI_ISTERLERI, Node'da module.exports.
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.APMEBERRA_UNI_ISTERLERI = api;
  else if (root && !root.APMEBERRA_UNI_ISTERLERI) root.APMEBERRA_UNI_ISTERLERI = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  // DERSLER VE SINAVLAR REHBERİ (Konu anlatımı ve Deneme bağlantıları)
  var DERSLER = {
    "ap-calculus": {
      kod: "ap-calculus",
      ad: "AP Calculus (AB / BC)",
      kategori: "Bilim Sınavı",
      alan: "Matematik",
      ozet: "Limit, Türev, İntegral, Diferansiyel Denklemler, Kutupsal Eğriler ve Taylor Serileri. Mühendislik ve fen programlarının temel şartıdır.",
      konuUrl: "ap-calculus.html",
      denemeler: [
        { ad: "Calculus AB Denemesi", kod: "calculus-ab", url: "deneme.html?ders=calculus-ab" },
        { ad: "Calculus BC Denemesi", kod: "calculus-bc", url: "deneme.html?ders=calculus-bc" }
      ],
      sinavUrl: "sinavlar.html#ap-calculus-ab"
    },
    "ap-physics": {
      kod: "ap-physics",
      ad: "AP Physics (Physics 1 / C)",
      kategori: "Bilim Sınavı",
      alan: "Fizik",
      ozet: "Newton Mekaniği, Enerji ve Momentum Korunumu, Basit Harmonik Hareket, Rotasyonel Dinamik.",
      konuUrl: "ap-physics.html",
      denemeler: [
        { ad: "Physics 1 Denemesi", kod: "physics-1", url: "deneme.html?ders=physics-1" }
      ],
      sinavUrl: "sinavlar.html#ap-physics-1"
    },
    "ap-chemistry": {
      kod: "ap-chemistry",
      ad: "AP Chemistry",
      kategori: "Bilim Sınavı",
      alan: "Kimya",
      ozet: "Moleküler Yapı, Termodinamik, Kimyasal Denge, Kinetik Hız Yasaları ve Elektrokimya.",
      konuUrl: "ap-chemistry.html",
      denemeler: [
        { ad: "Chemistry Denemesi", kod: "chemistry", url: "deneme.html?ders=chemistry" }
      ],
      sinavUrl: "sinavlar.html#ap-chemistry"
    },
    "ap-biology": {
      kod: "ap-biology",
      ad: "AP Biology",
      kategori: "Bilim Sınavı",
      alan: "Biyoloji",
      ozet: "Biyokimya, Hücresel Enerji (Solunum & Fotosentez), Moleküler Genetik ve Biyoistatistik.",
      konuUrl: "ap-biology.html",
      denemeler: [
        { ad: "Biology Denemesi", kod: "biology", url: "deneme.html?ders=biology" }
      ],
      sinavUrl: "sinavlar.html#ap-biology"
    },
    "ap-cs-a": {
      kod: "ap-cs-a",
      ad: "AP Computer Science A",
      kategori: "Bilim Sınavı",
      alan: "Bilgisayar & Yazılım",
      ozet: "Java Nesne Yönelimli Programlama (OOP), Sınıflar, Diziler, Veri Yapıları ve Algoritma Analizi.",
      konuUrl: "ap-electives.html?unite=2",
      denemeler: [
        { ad: "Computer Science A Denemesi", kod: "cs-a", url: "deneme.html?ders=cs-a" }
      ],
      sinavUrl: "sinavlar.html#ap-computer-science-a"
    },
    "ap-economics": {
      kod: "ap-economics",
      ad: "AP Micro / Macroeconomics",
      kategori: "Sosyal & İdari Bilim",
      alan: "Ekonomi",
      ozet: "Arz-Talep Dengesi, Piyasa Yapıları, Maliye Politikaları, Enflasyon ve Büyüme Modelleri.",
      konuUrl: "ap-electives.html?unite=4",
      denemeler: [
        { ad: "Ekonomi Denemesi", kod: "economics", url: "deneme.html?ders=economics" }
      ],
      sinavUrl: "sinavlar.html#ap-macroeconomics"
    },
    "english-language": {
      kod: "english-language",
      ad: "Akademik İngilizce (IELTS / TOEFL / AP)",
      kategori: "Dil Sınavı",
      alan: "İngilizce",
      ozet: "CEFR C1 Seviyesi Akademik Okuma & Makale Analizi, Retorik Sentez, Writing & Speaking Teknikleri.",
      konuUrl: "ap-english.html",
      denemeler: [
        { ad: "Akademik İngilizce Denemesi", kod: "english-language", url: "deneme.html?ders=english-language" }
      ],
      sinavUrl: "sinavlar.html#ielts-academic"
    },
    "tolc-i": {
      kod: "tolc-i",
      ad: "TOLC-I / TIL-I (İtalya Mühendislik Giriş Testi)",
      kategori: "Bilim Sınavı",
      alan: "Mühendislik Sınavı",
      ozet: "CISIA İngilizce Mühendislik Sınavı: Matematik (20 soru), Mantık (10 soru), Fen/Fizik (10 soru) ve İngilizce.",
      konuUrl: "ap-calculus.html",
      ekKonuUrl: "ap-physics.html",
      denemeler: [
        { ad: "Matematik Temelli Deneme (Calculus)", kod: "calculus-ab", url: "deneme.html?ders=calculus-ab" },
        { ad: "Fizik Temelli Deneme (Physics 1)", kod: "physics-1", url: "deneme.html?ders=physics-1" }
      ],
      sinavUrl: "sinavlar.html#cent-s"
    },
    "testas": {
      kod: "testas",
      ad: "TestAS (Core + Mühendislik / Fen)",
      kategori: "Bilim Sınavı",
      alan: "Almanya Yetenek Testi",
      ozet: "Almanya üniversiteleri için alana özgü yetenek testi: Genel Çekirdek Test + Mühendislik / Doğa Bilimleri modülü.",
      konuUrl: "ap-calculus.html",
      ekKonuUrl: "ap-physics.html",
      denemeler: [
        { ad: "Sayısal Akıl Yürütme (Calculus)", kod: "calculus-ab", url: "deneme.html?ders=calculus-ab" },
        { ad: "Fiziksel Sistemler (Physics 1)", kod: "physics-1", url: "deneme.html?ders=physics-1" }
      ],
      sinavUrl: "sinavlar.html#testas"
    }
  };

  /**
   * Bir üniversite ve seçim (ülke, dil, düzey) için gereken isterleri çözer.
   * @param {Object} uni Üniversite nesnesi (ör. TUM, KIT, Heidelberg)
   * @param {string} ulkeKod Ülke kodu (de, it, nl, vb.)
   * @param {Object} secim {dil: 'en'|'yerel'|'hepsi', duzey: 'lisans'|'yl'}
   */
  function isterleriCoz(uni, ulkeKod, secim) {
    uni = uni || {};
    secim = secim || {};
    var dil = secim.dil || "en";
    var ad = (uni.ad || "").toLowerCase();

    var dilSinavlari = [];
    var bilimSinavlari = [];
    var ozelIsterler = [];

    // 1. ÖZEL KURUMSAL İSTERLER
    if (/münchen|munich|tum\b/i.test(ad) || /de-tum/i.test(uni.id || "")) {
      ozelIsterler.push({
        baslik: "TUM Yetenek Değerlendirmesi (Aptitude Assessment)",
        detay: "Lise diploma notu, matematik ve fen dersi başarıları puanlanır; aday doğrudan kabul alır veya mülakata çağrılır.",
        kaynak: "https://www.tum.de/en/studies/application"
      });
      if (dil === "en" || dil === "hepsi") {
        dilSinavlari.push({ ad: "IELTS Academic", esik: "6.5+", kod: "english-language" });
        dilSinavlari.push({ ad: "TOEFL iBT", esik: "90+", kod: "english-language" });
      }
      if (dil === "yerel" || dil === "hepsi") {
        dilSinavlari.push({ ad: "TestDaF", esik: "TDN 4x4", url: "sinavlar.html#testdaf" });
        dilSinavlari.push({ ad: "DSH", esik: "DSH-2", url: "sinavlar.html#dsh" });
      }
      bilimSinavlari.push(DERSLER["ap-calculus"]);
      bilimSinavlari.push(DERSLER["ap-physics"]);
      bilimSinavlari.push(DERSLER["ap-cs-a"]);
      bilimSinavlari.push(DERSLER["testas"]);
    } else if (/karlsruhe|kit\b|carl benz/i.test(ad) || /de-kit/i.test(uni.id || "")) {
      ozelIsterler.push({
        baslik: "KIT Carl Benz Uluslararası Makine Mühendisliği Şartı",
        detay: "Dört zorunlu belge: SAT (en az 1200) veya TestAS Core 75. yüzdelik dilim + lise fiziği veya TestAS Engineering 75. yüzdelik dilim.",
        kaynak: "https://www.carlbenzschool.kit.edu/admission-requirements.php"
      });
      dilSinavlari.push({ ad: "TOEFL iBT", esik: "90+", kod: "english-language" });
      dilSinavlari.push({ ad: "IELTS Academic", esik: "6.5+ (hiçbir bant 5.5 altı olmamalı)", kod: "english-language" });
      bilimSinavlari.push(DERSLER["ap-calculus"]);
      bilimSinavlari.push(DERSLER["ap-physics"]);
      bilimSinavlari.push(DERSLER["testas"]);
    } else if (/thws|schweinfurt/i.test(ad) || /de-thws/i.test(uni.id || "")) {
      ozelIsterler.push({
        baslik: "THWS Robotics (TWIN) Giriş Şartı",
        detay: "İngilizce B2 (IELTS 6.0 / TOEFL 83). Yükseköğretim giriş yeterliliği için TestAS (en az 100) ya da SAT (en az 1050).",
        kaynak: "https://iro.thws.de/studieninteressierte/twin-studiengang-robotik/"
      });
      dilSinavlari.push({ ad: "IELTS Academic", esik: "6.0+", kod: "english-language" });
      dilSinavlari.push({ ad: "TOEFL iBT", esik: "83+", kod: "english-language" });
      bilimSinavlari.push(DERSLER["ap-calculus"]);
      bilimSinavlari.push(DERSLER["ap-physics"]);
      bilimSinavlari.push(DERSLER["testas"]);
    } else if (/politecnico di milano|polimi/i.test(ad) || /it-polimi/i.test(uni.id || "")) {
      ozelIsterler.push({
        baslik: "PoliMi TOLC-I & OFA English Şartı",
        detay: "İngilizce Mühendislik için CISIA İngilizce TOLC-I testi zorunludur. İngilizce hazırlık muafiyeti (OFA) için IELTS 6.0+ ya da TOEFL 78+ istenir.",
        kaynak: "https://www.polimi.it/en/international-prospective-students"
      });
      dilSinavlari.push({ ad: "IELTS Academic (OFA Muafiyeti)", esik: "6.0+", kod: "english-language" });
      dilSinavlari.push({ ad: "TOEFL iBT", esik: "78+", kod: "english-language" });
      bilimSinavlari.push(DERSLER["tolc-i"]);
      bilimSinavlari.push(DERSLER["ap-calculus"]);
      bilimSinavlari.push(DERSLER["ap-physics"]);
    } else if (/politecnico di torino|polito/i.test(ad) || /it-polito/i.test(uni.id || "")) {
      ozelIsterler.push({
        baslik: "PoliTo TIL-I Sınavı",
        detay: "Politecnico di Torino Mühendislik için kurumun kendi TIL-I (Test di Ingresso di Ingegneria) sınavı gereklidir.",
        kaynak: "https://www.polito.it"
      });
      dilSinavlari.push({ ad: "IELTS Academic", esik: "5.5 - 6.0+", kod: "english-language" });
      bilimSinavlari.push(DERSLER["tolc-i"]);
      bilimSinavlari.push(DERSLER["ap-calculus"]);
      bilimSinavlari.push(DERSLER["ap-physics"]);
    } else {
      // 2. ÜLKE BAZLI STANDART İSTERLER
      if (ulkeKod === "de") {
        if (dil === "en" || dil === "hepsi") {
          dilSinavlari.push({ ad: "IELTS Academic", esik: "6.5+", kod: "english-language" });
          dilSinavlari.push({ ad: "TOEFL iBT", esik: "85 - 90+", kod: "english-language" });
        }
        if (dil === "yerel" || dil === "hepsi") {
          dilSinavlari.push({ ad: "TestDaF", esik: "TDN 4x4", url: "sinavlar.html#testdaf" });
          dilSinavlari.push({ ad: "DSH", esik: "DSH-2", url: "sinavlar.html#dsh" });
          dilSinavlari.push({ ad: "telc C1 Hochschule", esik: "C1 Geçer", url: "sinavlar.html#telc-c1-hochschule" });
        }
        bilimSinavlari.push(DERSLER["ap-calculus"]);
        bilimSinavlari.push(DERSLER["ap-physics"]);
        bilimSinavlari.push(DERSLER["ap-chemistry"]);
        bilimSinavlari.push(DERSLER["ap-cs-a"]);
        bilimSinavlari.push(DERSLER["testas"]);
      } else if (ulkeKod === "it") {
        dilSinavlari.push({ ad: "IELTS Academic", esik: "5.5 - 6.5", kod: "english-language" });
        dilSinavlari.push({ ad: "TOEFL iBT", esik: "78 - 90", kod: "english-language" });
        bilimSinavlari.push(DERSLER["tolc-i"]);
        bilimSinavlari.push(DERSLER["ap-calculus"]);
        bilimSinavlari.push(DERSLER["ap-physics"]);
        bilimSinavlari.push(DERSLER["ap-chemistry"]);
      } else if (ulkeKod === "nl") {
        dilSinavlari.push({ ad: "IELTS Academic", esik: "6.5+", kod: "english-language" });
        dilSinavlari.push({ ad: "TOEFL iBT", esik: "90+", kod: "english-language" });
        bilimSinavlari.push(DERSLER["ap-calculus"]);
        bilimSinavlari.push(DERSLER["ap-physics"]);
        bilimSinavlari.push(DERSLER["ap-chemistry"]);
        bilimSinavlari.push(DERSLER["ap-biology"]);
      } else {
        // Genel Avrupa
        dilSinavlari.push({ ad: "IELTS Academic", esik: "6.5+", kod: "english-language" });
        dilSinavlari.push({ ad: "TOEFL iBT", esik: "85+", kod: "english-language" });
        bilimSinavlari.push(DERSLER["ap-calculus"]);
        bilimSinavlari.push(DERSLER["ap-physics"]);
        bilimSinavlari.push(DERSLER["ap-chemistry"]);
      }
    }

    return {
      dilSinavlari: dilSinavlari,
      bilimSinavlari: bilimSinavlari,
      ozelIsterler: ozelIsterler
    };
  }

  /**
   * Üniversite kartı için isterler özetini ve açılır/kapanır ders istasyonu HTML'ini üretir.
   * Tur 14 A4: ek.eylemHtml verilirse (ör. "İlk e-posta", "Listeme ekle") çekmece düğmesiyle aynı eylem satırına girer.
   */
  function kartIsterHtml(uni, ulkeKod, secim, idPrefix, ek) {
    ek = ek || {};
    var reqs = isterleriCoz(uni, ulkeKod, secim);
    var uId = idPrefix || ("uni-req-" + Math.random().toString(36).slice(2, 8));

    var dilRozetleri = reqs.dilSinavlari.map(function (d) {
      return '<span class="sr-req-badge is-lang" title="' + esc(d.esik ? 'Asgari eşik: ' + d.esik : '') + '">🗣️ ' + esc(d.ad) + (d.esik ? ' <small>(' + esc(d.esik) + ')</small>' : '') + '</span>';
    }).join("");

    var bilimRozetleri = reqs.bilimSinavlari.slice(0, 3).map(function (b) {
      return '<span class="sr-req-badge is-stem">🔬 ' + esc(b.ad) + '</span>';
    }).join("");
    if (reqs.bilimSinavlari.length > 3) {
      bilimRozetleri += '<span class="sr-req-badge is-stem-more">+' + (reqs.bilimSinavlari.length - 3) + ' sınav daha</span>';
    }

    var drawerHtml =
      '<div class="sr-uni-drawer" id="' + esc(uId) + '-drawer" hidden aria-label="' + esc(uni.ad || "Üniversite") + ' Sınav ve Ders İsterleri">' +
        '<div class="sr-drawer-inner">' +
          '<div class="sr-drawer-head">' +
            '<div><h4>' + esc(uni.ad || "") + ' — Kabul İsterleri ve Ders İstasyonu</h4>' +
            '<p class="sr-drawer-sub">Gereken dil ve bilim sınavları, bunlara hazırlayan ders konuları ve doğrudan deneme sınavı modülleri:</p></div>' +
            '<button type="button" class="btn-ghost btn-sm sr-drawer-close" aria-controls="' + esc(uId) + '-drawer">Kapat ✕</button>' +
          '</div>' +

          (reqs.ozelIsterler.length ? '<div class="sr-drawer-special">' + reqs.ozelIsterler.map(function (oz) {
            return '<div class="sr-special-card"><strong>⚡ ' + esc(oz.baslik) + '</strong><p>' + esc(oz.detay) + '</p>' +
              (oz.kaynak ? '<a class="src-link" href="' + esc(oz.kaynak) + '" target="_blank" rel="noopener noreferrer">Resmi Şartname ↗</a>' : '') + '</div>';
          }).join("") + '</div>' : '') +

          '<div class="sr-drawer-grid">' +
            // SOL KOLON: DİL SINAVLARI
            '<div class="sr-drawer-col">' +
              '<h5 class="sr-drawer-col-h">🗣️ GEREKEN DİL SINAVLARI</h5>' +
              '<ul class="sr-lesson-list">' +
                reqs.dilSinavlari.map(function (d) {
                  return '<li class="sr-lesson-card">' +
                    '<div class="sr-lesson-top"><strong>' + esc(d.ad) + '</strong>' +
                    (d.esik ? '<span class="sr-esik-pill">' + esc(d.esik) + '</span>' : '') + '</div>' +
                    '<p class="sr-lesson-desc">Akademik okuma, dinleme, kompozisyon ve konuşma yetkinliği.</p>' +
                    '<div class="sr-lesson-actions">' +
                      '<a class="btn-primary btn-sm" href="ap-english.html">📖 Konu Anlatımı</a>' +
                      '<a class="btn-ghost btn-sm" href="deneme.html?ders=english-language">🎯 Deneme Sınavı</a>' +
                      (d.url ? '<a class="btn-ghost btn-sm" href="' + esc(d.url) + '">Sınav Bilgisi</a>' : '<a class="btn-ghost btn-sm" href="sinavlar.html#ielts-academic">Format</a>') +
                    '</div>' +
                  '</li>';
                }).join("") +
              '</ul>' +
            '</div>' +

            // SAĞ KOLON: BİLİM VE AKADEMİK SINAVLAR
            '<div class="sr-drawer-col">' +
              '<h5 class="sr-drawer-col-h">🔬 GEREKEN BİLİM & GİRİŞ SINAVLARI</h5>' +
              '<ul class="sr-lesson-list">' +
                reqs.bilimSinavlari.map(function (b) {
                  var denemelerHtml = b.denemeler.map(function (dn) {
                    return '<a class="btn-ghost btn-sm sr-btn-deneme" href="' + esc(dn.url) + '">🎯 ' + esc(dn.ad) + '</a>';
                  }).join(" ");

                  return '<li class="sr-lesson-card is-stem-card">' +
                    '<div class="sr-lesson-top"><strong>' + esc(b.ad) + '</strong>' +
                    '<span class="sr-alan-pill">' + esc(b.alan) + '</span></div>' +
                    '<p class="sr-lesson-desc">' + esc(b.ozet) + '</p>' +
                    '<div class="sr-lesson-actions">' +
                      '<a class="btn-primary btn-sm" href="' + esc(b.konuUrl) + '">📖 Konu Anlatımı</a>' +
                      denemelerHtml +
                      (b.ekKonuUrl ? '<a class="btn-ghost btn-sm" href="' + esc(b.ekKonuUrl) + '">Fizik Modülü</a>' : '') +
                      (b.sinavUrl ? '<a class="btn-ghost btn-sm" href="' + esc(b.sinavUrl) + '">Sınav Formatı</a>' : '') +
                    '</div>' +
                  '</li>';
                }).join("") +
              '</ul>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    return {
      ozetHtml:
        '<div class="sr-uni-reqs">' +
          '<div class="sr-req-row sr-req-lang"><span class="sr-req-label">Dil:</span>' + dilRozetleri + '</div>' +
          '<div class="sr-req-row sr-req-stem"><span class="sr-req-label">Bilim:</span>' + bilimRozetleri + '</div>' +
          (ek.eylemHtml ? '<div class="sr-uni-eylem">' : '') +
          '<button type="button" class="btn-ghost btn-sm sr-req-toggle" aria-expanded="false" aria-controls="' + esc(uId) + '-drawer">' +
            '<span>Dersler ve İsterler</span> <span class="sr-req-arrow" aria-hidden="true">▾</span>' +
          '</button>' +
          (ek.eylemHtml ? ek.eylemHtml + '</div>' : '') +
        '</div>',
      drawerHtml: drawerHtml
    };
  }

  return {
    DERSLER: DERSLER,
    isterleriCoz: isterleriCoz,
    kartIsterHtml: kartIsterHtml
  };
});
