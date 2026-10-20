// Meberra — Herkese açık ülke şartları verisi (sartlar.html) — Tur 10, Karar K4 (14 Ekim 2026)
// ŞEMA SAHİBİ: Ajan 11 (Frontend). İÇERİK SAHİBİ: Ajan 13 (Mevzuat) + Ajan 2 (Weber & Rossi); PM onayı (AGENTS.md §2.1).
// İçerik kaynağı: .agents/mevzuat/karar-notu-2026-10-14-mezun-sinif.md (Ajan 13, 14 Ekim 2026). PM doldurdu.
//
// ŞEMA
// window.APMEBERRA_SARTLAR = {
//   surum: "1.0.0",
//   sonKontrol: "YYYY-AA-GG" | null,          // dosyanın tümü en son ne zaman kontrol edildi
//   ulkeler: {
//     de: {
//       ad: "Almanya",
//       ortak: [madde],                         // "Ne gerekiyor": her sınıf için aynı olan şartlar
//       siniflar: {                             // anahtarlar sabit: "9" | "10" | "11" | "12" | "mezun"
//         "11": {
//           gerekenler: [madde],                // "Ne gerekiyor" bölümüne ortak'tan SONRA eklenir (sınıfa özel şart)
//           buYil:      [madde],                // "Bu yıl ne yapmalısın"
//           tarihler:   [madde],                // "Kaçırılmaması gereken tarihler" — madde.zaman ile göreli
//           hatalar:    [madde]                 // "Sık yapılan hatalar"
//         }, ...
//       }
//     },
//     it: { ...aynı şema... }
//   }
// };
//
// madde = {
//   id: "de-11-yks-tercih",       // isteğe bağlı; küçük harf, rakam, tire; dosya içinde benzersiz (sayfa içi bağlantı: #m-<id>)
//   baslik: "Kısa başlık",        // isteğe bağlı
//   metin: "Düz metin.",          // ZORUNLU; HTML ve Markdown yok
//   kaynak: [{ ad: "anabin (KMK)", url: "https://anabin.kmk.org" }],   // ZORUNLU, en az 1 resmi kaynak
//   kesinlik: "Doğrulandı" | "Yoruma açık" | "Yayımlanmadı" | "Teyit gerekir",  // spec §10 ("Doğrulanamadı" yalnızca istisna)
//   sonKontrol: "2026-10-14",     // ZORUNLU; bu madde en son ne zaman resmi kaynakla karşılaştırıldı
//   zaman: { mezuniyetGore: -1, ay: 9, metin: "Son sınıfın Eylül'ü" }   // isteğe bağlı (çoğunlukla "tarihler" için)
//                                 // data/mevzuat/ulke-rotalari.js ile aynı anlam: mezuniyet yılına göre yıl farkı + ay (1–12).
//                                 // Sayfa bunu "12. sınıf · Eylül" gibi göreli ve seçilen sınıfa göre takvim tarihi olarak gösterir.
// };
//
// KURALLAR
//  - Şemaya uymayan madde sayfada GÖSTERİLMEZ (sartlar-motor.js maddeDogrula). Denetim: node araclar/testler/sartlar-birim-test.js
//  - Kişiye özel ad ya da ifade yazılmaz (sayfa herkese açık: 9–12. sınıf ve mezun).
//  - Ayrıca sayfa, data/mevzuat/ulke-rotalari.js'teki doğrulanmış adımları "Genel yol haritası" olarak gösterir; burada tekrar yazılmaz.
(function () {
  var T = "2026-10-14";

  // Kaynaklar (karar notu §7; erişim 14 Ekim 2026)
  var K = {
    anabinAP: { ad: "anabin (KMK) — AP kaydı, USA-BV07/08", url: "https://anabin.kmk.org/api/public/certificates/" },
    anabinTR: { ad: "anabin (KMK) — Türkiye Lise Diploması, TUR-BV01–15", url: "https://anabin.kmk.org/api/public/certificates/6729e86b4a3c434b0b3dea1f" },
    kmkNot: { ad: "KMK — yabancı diploma notunun çevrilmesi kararı", url: "https://www.kmk.org/fileadmin/pdf/ZAB/Hochschulzugang_Beschluesse_der_KMK/GesNot05.pdf" },
    uaTR: { ad: "uni-assist — Türkiye ülke bilgisi", url: "https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/tr/" },
    deTemsil: { ad: "Almanya'nın Türkiye temsilcilikleri — öğrenim bilgi notu (Mart 2025)", url: "https://tuerkei.diplo.de/resource/blob/2705882/e2f501fcfae013d26f393ea8e6441bdf/studium-info-2025-tur-data.pdf" },
    daad: { ad: "DAAD — başvuru süreci", url: "https://www.daad.de/en/studying-in-germany/requirements/application-process/" },
    osymKil: { ad: "ÖSYM — 2026-YKS Kılavuzu", url: "https://dokuman.osym.gov.tr/pdfdokuman/2026/YKS/basvuru_kilavuz06022026.pdf" },
    osymKont: { ad: "ÖSYM — 2026-YKS Tercih Kılavuzu", url: "https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/TERCIH/kontkilavuz_yktd21072026.pdf" },
    osymDuyuru: { ad: "ÖSYM — duyurular", url: "https://www.osym.gov.tr/Duyurular/Index" },
    meb: { ad: "MEB Ortaöğretim Kurumları Yönetmeliği, Md. 65", url: "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=18812&MevzuatTur=7&MevzuatTertip=5" },
    cbMezun: { ad: "College Board — 12. sınıftan sonra AP", url: "https://international.collegeboard.org/help-center/can-i-take-ap-exam-after-completing-grade-12" },
    apUcret: { ad: "College Board — AP sipariş ve ücretler", url: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/ordering-fees/exam-fees" },
    mur: { ad: "MUR genelgesi 2026-27 / 2027-28", url: "https://www.unife.it/it/internazionale/venire/iscriversi/informazioni/circolare_2026-2027_studenti_internazionali.pdf" },
    universitaly: { ad: "Universitaly — uluslararası öğrenciler", url: "https://www.universitaly.it/it/studenti-stranieri" },
    konsIst: { ad: "İtalya İstanbul Başkonsolosluğu — İtalya'da üniversite", url: "https://consistanbul.esteri.it/it/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/studiare-in-italia/universita/laurea-triennale-e-laurea-magistrale-a-ciclo-unico/" },
    polimi: { ad: "PoliMi — Engineering BSc çağrısı 2026-27", url: "https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf" },
    polito: { ad: "PoliTo — mühendislik başvuru çağrısı 2026-27", url: "https://www.polito.it/sites/default/files/2025-12/Call%20for%20applications%20for%20admissions%20Engineering%20_%20LP%202026-27.pdf" },
    cisia: { ad: "CISIA — CEnT kuralları", url: "https://www.cisiaonline.it/en/cent/all-about-CEnT/CEnT-rules" },
    cisiaYapi: { ad: "CISIA — CEnT-S yapısı", url: "https://www.cisiaonline.it/en/cent/cent-s/structure-and-syllabus" },
    padova: { ad: "Padova Üniversitesi — başvuru sayfası", url: "https://apply.unipd.it/courses/course/182" },
    polimiDsu: { ad: "PoliMi — DSU burs çağrısı 2026/27", url: "https://www.polimi.it/fileadmin/user_upload/studenti/tasse-borse-agevolazioni-economiche/dsu/bando_2026-2027/DSU_Call_a.y._2026-2027.pdf" },
    ets: { ad: "ETS — TOEFL iBT puanları", url: "https://www.ets.org/toefl/test-takers/ibt/scores/understand-scores.html" },
    ielts: { ad: "IELTS — puanlama ayrıntıları", url: "https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail" }
  };

  function m(id, baslik, metin, kaynak, kesinlik, zaman) {
    var o = { id: id, baslik: baslik, metin: metin, kaynak: kaynak, kesinlik: kesinlik, sonKontrol: T };
    if (zaman) o.zaman = zaman;
    return o;
  }

  // Türkiye tarafı: iki ülkede de geçerli olan ortak kurallar
  function trOrtak(p) {
    return [
      m(p + "-diploma-puani", "Diploma puanı 4 yılın ortalaması",
        "Mezuniyet puanı 9, 10, 11 ve 12. sınıfların yılsonu başarı puanlarının eşit ağırlıklı ortalamasıdır; hazırlık sınıfı sayılmaz. Yani her yılın notu diplomanın dörtte biridir.",
        [K.meb], "Doğrulandı"),
      m(p + "-obp", "OBP ve YKS",
        "OBP = diploma notu × 5 (250–500). Yerleştirme puanına OBP × 0,12 eklenir, yani 30 ile 60 puan arası. Bir önceki yıl bir programa yerleşen adayın (kayıt yaptırmasa da) OBP katsayısı ertesi yıl yarıya iner.",
        [K.osymKil, K.osymKont], "Doğrulandı"),
      m(p + "-dil-suresi", "Dil belgesinin süresi",
        "TOEFL puanı 2 yıl geçerlidir. IELTS için 2 yıl önerilir; bazı kurumlar daha eskisini kabul edebilir. Dil sınavına başvurudan en fazla 2 yıl önce girmek güvenlidir.",
        [K.ets, K.ielts], "Doğrulandı")
    ];
  }

  window.APMEBERRA_SARTLAR = {
    surum: "1.1.0",
    sonKontrol: T,
    ulkeler: {
      de: {
        ad: "Almanya",
        ortak: [
          m("de-giris-hakki", "Türk diplomasıyla doğrudan giriş",
            "Türk lise diplomasıyla doğrudan lisansa başlamak için YKS'de ilgili puan türünde 180'in üzerinde puan ve en az 4 yıllık örgün bir lisans programına yerleşme gerekir. Giriş hakkı yalnızca yerleşilen alan ve ona yakın alanlar için geçerlidir.",
            [K.anabinTR, K.uaTR], "Doğrulandı"),
          m("de-ap-rolu", "AP, SAT ve IB giriş hakkı vermez",
            "Türk diploması sahibi için AP, SAT ya da IB modülü giriş hakkı eklemez. Yerleşme yoksa Studienkolleg yolu da açılmaz; tek istisna MYO'da 1 yıl okumaktır ve bu yalnızca uygulamalı bilimler (FH) Studienkolleg'ine açılır. AP yalnızca başvuru dosyasını güçlendiren bir profil unsurudur.",
            [K.anabinTR, K.anabinAP], "Doğrulandı"),
          m("de-not-cevirme", "Diploma notu Alman notuna çevrilir",
            "Diploma notu modifiye Bavyera formülüyle Alman notuna çevrilir: X = 1 + 3 × (Nmax − Nd) / (Nmax − Nmin). Virgülden sonra bir basamak hesaplanır, yuvarlama yapılmaz. Kontenjanlı programlarda bu not sıralamayı etkiler.",
            [K.kmkNot], "Doğrulandı"),
          m("de-not-esik", "Türk diploması için formül değerleri",
            "Türk lisesi için en yüksek ve en düşük geçer not 100 ve 50 alınırsa 85 → 1,9 ve 70 → 2,8 olur. Bu değerleri ZAB/uni-assist belirler; Türkiye için resmi değerler yayımlanmış kayıtta bulunamadı. Hesabını uni-assist'e teyit ettir.",
            [K.kmkNot, K.uaTR], "Teyit gerekir"),
          m("de-dil", "Dil belgesi",
            "İngilizce programların çoğu IELTS 6.0–6.5 ya da TOEFL 72–90 düzeyinde belge ister; eşik programa göre değişir. Bazı İngilizce programlar ayrıca Almanca A2–B1 ister.",
            [K.daad, K.uaTR], "Doğrulandı"),
          m("de-kabul-sonrasi", "Kabulden sonra",
            "Kabulden sonra bloke hesap (Sperrkonto; Mart 2025 notunda aylık 992 €), ulusal öğrenci vizesi ve sağlık sigortası gerekir. Bavyera ve Baden-Württemberg AB dışından gelen öğrencilerden öğrenim ücreti alır.",
            [K.deTemsil], "Doğrulandı")
        ].concat(trOrtak("de")),
        siniflar: {
          "9": {
            gerekenler: [],
            buYil: [
              m("de-9-notlar", "Notlarını şimdiden koru",
                "9. sınıf notu, 12. sınıf notu kadar ağırlıklıdır. Bu not hem YKS'deki OBP'ye hem de Almanya'daki not çevirisine yansır.",
                [K.meb, K.kmkNot], "Doğrulandı"),
              m("de-9-ingilizce", "İngilizce planı",
                "İngilizceyi son sınıfa kadar B2 ve üstüne taşıyacak bir plan kur. Almanca A1'e başlamak isteğe bağlıdır; bazı programlar A2–B1 ister.",
                [K.daad], "Doğrulandı")
            ],
            tarihler: [
              m("de-9-tarih", "Bu sınıfa bağlı resmi son tarih yok",
                "9. sınıfta resmi bir son tarih yoktur. Hedef akademik yılın üniversite çağrıları henüz yayımlanmadı.",
                [K.daad], "Yayımlanmadı")
            ],
            hatalar: [
              m("de-9-hata-ap", "\"AP alırsam YKS'ye gerek kalmaz\"",
                "Yanlış. Türk diploması sahibi için Almanya'da giriş hakkı YKS yerleşmesiyle doğar; AP bunun yerine geçmez.",
                [K.anabinTR], "Doğrulandı"),
              m("de-9-hata-dil", "Dil sınavına çok erken girmek",
                "9. sınıfta alınan TOEFL ya da IELTS başvuru zamanında büyük olasılıkla süresini doldurmuş olur.",
                [K.ets, K.ielts], "Doğrulandı")
            ]
          },
          "10": {
            gerekenler: [],
            buYil: [
              m("de-10-alan", "Hangi mühendislik alanı?",
                "Okumak istediğin mühendislik alanını daralt. Almanya'daki giriş hakkı YKS'de yerleştiğin alana bağlıdır; ilgisiz bir alana yerleşmek mühendislikte hak vermez.",
                [K.anabinTR], "Doğrulandı"),
              m("de-10-temel", "Sayısal temel",
                "Mühendislik için YKS'de sayısal (SAY) puan türü gerekir. AYT matematik ve fen temelini bu yıl kurmaya başla; not ortalamanı da koru.",
                [K.osymKil, K.meb], "Doğrulandı")
            ],
            tarihler: [
              m("de-10-ap-siparis", "AP sipariş son günü",
                "AP'ye profil için girmek istersen okulların sipariş son günü Kasım ortasıdır (2027 sınavları için 13 Kasım 2026). Sınavlar Mayıs'tadır.",
                [K.apUcret], "Doğrulandı", { mezuniyetGore: -3, ay: 11, metin: "Her yıl Kasım ortası" })
            ],
            hatalar: [
              m("de-10-hata-alan", "Alan seçimini tercih dönemine bırakmak",
                "Alan kararı YKS tercih günü verilirse Almanya'daki hedef programla uyumsuz bir yere yerleşme riski doğar.",
                [K.anabinTR], "Doğrulandı")
            ]
          },
          "11": {
            gerekenler: [],
            buYil: [
              m("de-11-teyit", "Hedef üniversitelere yaz",
                "Hedef programları belirle ve üniversitelere giriş şartlarını, YKS yerleşme belgesinin geç teslimini ve uni-assist gerekip gerekmediğini yazılı olarak sor.",
                [K.uaTR, K.daad], "Doğrulandı"),
              m("de-11-almanca", "Almanca planı",
                "Hedef programın Almanca şartı varsa (A2–B1) son sınıftan önceki yaz kursa başla.",
                [K.daad], "Doğrulandı")
            ],
            tarihler: [
              m("de-11-ap-siparis", "AP sipariş son günü",
                "AP sipariş son günü 13 Kasım 2026'dır (2027 sınavları). Sınavlar Mayıs 2027'de.",
                [K.apUcret], "Doğrulandı", { mezuniyetGore: -2, ay: 11, metin: "11. sınıfın Kasım'ı" })
            ],
            hatalar: [
              m("de-11-hata-ap", "AP'yi giriş hakkı sanmak",
                "AP Türk diploması sahibine giriş hakkı vermez; giriş hakkını YKS yerleşmesi sağlar.",
                [K.anabinTR, K.anabinAP], "Doğrulandı")
            ]
          },
          "12": {
            gerekenler: [],
            buYil: [
              m("de-12-yks", "YKS'ye gir, mühendislik yaz",
                "YKS'ye başvur ve gir. Tercihte en az 4 yıllık örgün bir mühendislik programı yaz; MYO ve açıköğretim programları şartı sağlamaz.",
                [K.anabinTR, K.osymKil], "Doğrulandı"),
              m("de-12-gec-teslim", "Geç teslim teyidi",
                "YKS yerleşme sonucu Ağustos'ta çıkar, kış dönemi başvuruları çoğunlukla 15 Temmuz'da kapanır. Hedef üniversiteden yerleşme belgesini sonradan teslim edebileceğini yazılı olarak teyit et.",
                [K.uaTR, K.osymDuyuru], "Doğrulandı"),
              m("de-12-tercume", "Yeminli tercüme",
                "Diploma ve yerleştirme belgesini Türkiye'de yeminli tercümana çevirt; uni-assist başka çeviriyi kabul etmez.",
                [K.uaTR], "Doğrulandı")
            ],
            tarihler: [
              m("de-12-yks-takvim", "YKS takvimi",
                "ÖSYM 2027 takvimi henüz yayımlanmadı (genellikle Kasım'da açıklanır). 2026 kalıbı: başvuru Şubat–Mart, sınav Haziran, yerleştirme Ağustos ortası.",
                [K.osymDuyuru], "Yayımlanmadı", { mezuniyetGore: 0, ay: 2, metin: "Son sınıfın Şubat–Mart'ı" }),
              m("de-12-kis-basvuru", "Kış dönemi başvurusu",
                "Kış dönemi başvuruları çoğunlukla 15 Temmuz'da kapanır; tarih programa göre değişir.",
                [K.daad], "Doğrulandı", { mezuniyetGore: 0, ay: 7, metin: "Mezuniyet yılının Temmuz'u" })
            ],
            hatalar: [
              m("de-12-hata-15temmuz", "Yerleşme belgesinin 15 Temmuz'a yetişeceğini sanmak",
                "Son yıllarda YKS sonuçları 15 Temmuz'dan sonra açıklandı. Geç teslim teyidi almadan başvuru planı kurma.",
                [K.osymDuyuru], "Doğrulandı"),
              m("de-12-hata-alan", "Sadece belge için ilgisiz alana yerleşmek",
                "Yerleşme yalnızca o alan ve ona yakın alanlar için hak verir. İşletme gibi bir alana yerleşmek mühendislik için işe yaramaz.",
                [K.anabinTR], "Doğrulandı")
            ]
          },
          "mezun": {
            gerekenler: [
              m("de-mezun-ap-kapali", "Mezuniyetten sonra AP giriş hakkı vermez",
                "Türk diploması için anabin'de AP kuralı yoktur. ABD diploması için olan kural da AP'lerin lise bitmeden alınmasını ister. Mezunun Almanya hedefi için AP'ye zaman ve para ayırması önerilmez.",
                [K.anabinAP, K.anabinTR, K.cbMezun], "Doğrulandı"),
              m("de-mezun-gecmis-yerlesme", "Geçmiş yılın yerleşmesi geçerli",
                "anabin, YKS eşiklerini sınav yılına göre verir ve süre sınırı koymaz. Uygun alanda yerleşmesi olan mezunun giriş belgesi zaten elindedir.",
                [K.anabinTR], "Doğrulandı")
            ],
            buYil: [
              m("de-mezun-alan-kontrol", "Yerleşme belgenin alanını kontrol et",
                "Yerleştiğin alan hedef Alman programıyla aynı ya da yakınsa YKS'ye yeniden girmen gerekmez. Üniversitenin eski yıl belgesini kabul ettiğini yazılı olarak teyit et.",
                [K.anabinTR, K.uaTR], "Teyit gerekir"),
              m("de-mezun-yeniden-yks", "Yerleşme yoksa ya da alan uymuyorsa",
                "YKS'ye yeniden gir ve mühendislik programına yerleş. Bir önceki yıl bir programa yerleştiysen bu yıl OBP katsayın yarıya iner.",
                [K.osymKil, K.osymKont], "Doğrulandı"),
              m("de-mezun-belgeler", "Belgeler",
                "Diploma ve yerleştirme belgesini yeminli tercümeye ver. Türk üniversitesine kayıt yaptırdıysan e-Devlet transkripti de istenir. CV'de mezuniyetten sonraki dönemi açıkça yaz; üniversitenin ayrıca açıklama isteyip istemediği programa göre değişir.",
                [K.uaTR, K.deTemsil], "Doğrulandı"),
              m("de-mezun-aday-vizesi", "İsteğe bağlı: öğrenci adayı vizesi",
                "Kabul henüz yoksa başvuru sürecini Almanya'da yürütmek için 9 aylık öğrenci adayı vizesi var: lise diploması, ÖSYM sonuç belgesi ve finansman kanıtı istenir. Güncel şartı temsilcilikten kontrol et.",
                [K.deTemsil], "Doğrulandı")
            ],
            tarihler: [
              m("de-mezun-yaz", "Yaz dönemi (yerleşmesi uygun olan mezun)",
                "Yaz dönemi başvuruları genellikle Aralık–15 Ocak arasındadır; yaz döneminde başlayan İngilizce program azdır.",
                [K.daad], "Doğrulandı"),
              m("de-mezun-kis", "Kış dönemi",
                "Kış dönemi başvuruları genellikle Mayıs–15 Temmuz arasındadır. Yerleşmesi olmayan mezun için YKS takvimi belirleyicidir; ÖSYM 2027 takvimi henüz yayımlanmadı.",
                [K.daad, K.osymDuyuru], "Yayımlanmadı")
            ],
            hatalar: [
              m("de-mezun-hata-kayit", "Türkiye'de kayıt yaptırmayı zorunlu sanmak",
                "Almanya için yerleşme yeterlidir, Türkiye'de kayıt gerekmez. İtalya'yı da düşünüyorsan kayıt yaptırmak İtalya'daki 1. sınıf bursunu etkileyebilir.",
                [K.uaTR, K.polimiDsu], "Doğrulandı"),
              m("de-mezun-hata-obp", "Yeniden YKS'de OBP kaybını hesaba katmamak",
                "Önceki yıl yerleştiysen bu yıl OBP katsayın yarıya iner; hedef puanını buna göre belirle.",
                [K.osymKil], "Doğrulandı")
            ]
          }
        }
      },
      it: {
        ad: "İtalya",
        ortak: [
          m("it-sartlar", "Temel şartlar",
            "En az 12 yıllık lise diploması, YKS'ye girip geçtiğini gösteren sonuç belgesi, üniversitenin giriş testi (CEnT-S, TIL-I, TOL ya da SAT; programa göre) ve İngilizce B2. Vize gereken aday Universitaly ön başvurusu yapar ve yalnızca bir program seçebilir.",
            [K.mur, K.universitaly], "Doğrulandı"),
          m("it-ap-rolu", "AP kabul şartı değil",
            "Türk diploması sahibi için AP ne kabul şartıdır ne de resmi bir avantajdır.",
            [K.polimi, K.polito], "Doğrulandı"),
          m("it-test-suresi", "Giriş testi bir kayıt yılı için geçerli",
            "CEnT sonucu yalnızca bir sonraki akademik yılın kaydı için geçerlidir; TIL-I puanı o yılın çağrısı için geçerlidir.",
            [K.cisia, K.polito], "Doğrulandı"),
          m("it-diploma-notu", "Diploma notu sıralamada yok",
            "PoliMi sıralaması yalnızca test puanına dayanır; PoliTo kabulü TIL-I ya da SAT'a dayanır. Diğer üniversitelerin diploma notunu kullanıp kullanmadığını programa sor.",
            [K.polimi, K.polito], "Doğrulandı"),
          m("it-dsu", "DSU bursu",
            "1. sınıfta burs sıralaması aile gelirine göre yapılır. Bursun sürmesi için kredi gerekir (PoliMi mühendislik: 10 Ağustos'a kadar 35 ECTS).",
            [K.polimiDsu], "Doğrulandı")
        ].concat(trOrtak("it")),
        siniflar: {
          "9": {
            gerekenler: [],
            buYil: [
              m("it-9-matematik", "Matematik temeli",
                "CEnT-S'te Matematik ve Reasoning bölümleri var. Matematik temelini sağlamlaştır, İngilizceyi B2'ye taşıyacak bir plan kur.",
                [K.cisiaYapi], "Doğrulandı"),
              m("it-9-notlar", "Notlar yine önemli",
                "Diploma notu PoliMi ve PoliTo sıralamasını etkilemez ama YKS'deki OBP'yi ve Almanya seçeneğini etkiler.",
                [K.polimi, K.osymKil, K.kmkNot], "Doğrulandı")
            ],
            tarihler: [
              m("it-9-tarih", "Bu sınıfa bağlı resmi son tarih yok",
                "Hedef akademik yılın çağrıları henüz yayımlanmadı.",
                [K.mur], "Yayımlanmadı")
            ],
            hatalar: [
              m("it-9-hata-yks", "İtalya için YKS gerekmez sanmak",
                "Yanlış. YKS'ye girip geçtiğini gösteren sonuç belgesi İtalya'da da şarttır.",
                [K.mur], "Doğrulandı")
            ]
          },
          "10": {
            gerekenler: [],
            buYil: [
              m("it-10-testler", "Testleri tanı",
                "CEnT-S, TIL-I ve SAT'ın yapısını öğren. Hedef şehirlerin DSU burs kurumlarını ve ailenin gelir belgesi (ISEE parificato) sürecini araştır.",
                [K.cisiaYapi, K.polito, K.polimiDsu], "Doğrulandı")
            ],
            tarihler: [
              m("it-10-cents-prova", "10. sınıfta CEnT-S'e girmek",
                "CISIA kurallarında sınıf kısıtı yok, ancak 10. sınıfta alınan sonuç hiçbir kayıt yılında kullanılamaz. Yalnızca deneyim içindir.",
                [K.cisia], "Yoruma açık")
            ],
            hatalar: [
              m("it-10-hata-dil", "Dil sınavına erken girmek",
                "Dil belgesi başvuru zamanında süresini doldurmuş olabilir; en fazla 2 yıl öncesini hedefle.",
                [K.ets, K.ielts], "Doğrulandı")
            ]
          },
          "11": {
            gerekenler: [],
            buYil: [
              m("it-11-prova", "Prova CEnT-S",
                "İstersen Kasım–Aralık oturumunda prova olarak CEnT-S'e gir. Sonuç bir sonraki akademik yıl için geçerli olduğundan 11. sınıfta alınan sonuç kendi kayıt yılında kullanılamaz.",
                [K.cisia], "Doğrulandı")
            ],
            tarihler: [
              m("it-11-cents", "CEnT-S oturumları",
                "26 Kasım ve 17 Aralık 2026 oturumları 2027/28 kaydı içindir; 11. sınıf öğrencisi için yalnızca provadır.",
                [K.padova, K.cisia], "Doğrulandı", { mezuniyetGore: -2, ay: 11, metin: "11. sınıfın Kasım–Aralık'ı" }),
              m("it-11-polimi", "PoliMi yeni çağrısı",
                "PoliMi 2027/28 çağrısı Kasım 2026'da bekleniyor; erken giriş penceresi bu çağrıyla netleşecek.",
                [K.polimi], "Yayımlanmadı", { mezuniyetGore: -2, ay: 11, metin: "11. sınıfın Kasım'ı" })
            ],
            hatalar: [
              m("it-11-hata-prova", "Prova sonucunu asıl sonuç sanmak",
                "11. sınıfta alınan CEnT-S sonucu kendi kayıt yılında geçersizdir; asıl sınava son sınıfta girilir.",
                [K.cisia], "Doğrulandı")
            ]
          },
          "12": {
            gerekenler: [],
            buYil: [
              m("it-12-plan", "Son sınıf planı",
                "Asıl CEnT-S'e ilk oturumlarda gir, hedef üniversiteleri ve testlerini kesinleştir, dil belgesini al, YKS'ye gir, Universitaly ön başvurusunu yap ve DSU belgelerini topla.",
                [K.cisia, K.universitaly, K.mur], "Doğrulandı")
            ],
            tarihler: [
              m("it-12-cents", "Asıl CEnT-S",
                "26 Kasım ve 17 Aralık 2026 oturumları 2027/28 kaydı için geçerlidir.",
                [K.padova, K.cisia], "Doğrulandı", { mezuniyetGore: -1, ay: 11, metin: "Son sınıfın Kasım–Aralık'ı" }),
              m("it-12-padova", "Padova erken başvuru penceresi",
                "Padova'da AB dışı adaylar için başvuru penceresi 7 Ocak – 7 Mart 2027.",
                [K.padova], "Doğrulandı", { mezuniyetGore: 0, ay: 1, metin: "Son sınıfın Ocak–Mart'ı" }),
              m("it-12-cagrilar", "Üniversite çağrıları",
                "PoliMi çağrısı Kasım 2026'da, PoliTo ve Sapienza çağrıları Aralık 2026'da bekleniyor.",
                [K.polimi, K.polito], "Yayımlanmadı", { mezuniyetGore: -1, ay: 11, metin: "Son sınıfın Kasım–Aralık'ı" }),
              m("it-12-vize", "Vize son tarihi",
                "MUR genelgesi 2027/28 yılını da kapsar; vize başvurusu için son tarih 31 Ekim 2027.",
                [K.mur, K.konsIst], "Doğrulandı", { mezuniyetGore: 0, ay: 10, metin: "Mezuniyet yılının Ekim'i" })
            ],
            hatalar: [
              m("it-12-hata-padova", "Padova'nın erken penceresini kaçırmak",
                "Padova başvuruları Ocak–Mart arasında kapanır; diğer üniversitelerden çok daha erkendir.",
                [K.padova], "Doğrulandı"),
              m("it-12-hata-universitaly", "Universitaly'de birden fazla program seçmek",
                "Ön başvuruda yalnızca bir program seçilebilir.",
                [K.universitaly, K.mur], "Doğrulandı"),
              m("it-12-hata-apostil", "Apostili unutmak",
                "Diploma ve YKS sonuç belgesine apostil ve İtalyanca çeviri gerekir.",
                [K.konsIst], "Doğrulandı")
            ]
          },
          "mezun": {
            gerekenler: [
              m("it-mezun-uygunluk", "Mezunlar başvurabilir",
                "PoliMi önceki yıllarda alınmış diplomayı kabul eder, PoliTo TIL-I mezunlara açıktır, CEnT-S kurallarında mezun kısıtı yoktur. Mezuniyetten bu yana geçen süre için MUR genelgesinde bir kural yoktur.",
                [K.polimi, K.polito, K.cisia, K.mur], "Doğrulandı")
            ],
            buYil: [
              m("it-mezun-yks-yili", "YKS belgenin yılını sor",
                "Genelgede ve çağrılarda YKS sonuç belgesinin yılı belirtilmiyor. Eski yıl belgesinin kabul edilip edilmediğini hedef üniversiteye yazılı olarak sor; gerekirse YKS'ye yeniden gir. İtalya OBP'ye bakmadığı için yeniden girmek İtalya başvurunu etkilemez.",
                [K.mur, K.polito], "Teyit gerekir"),
              m("it-mezun-cents", "Asıl CEnT-S'e ilk oturumda gir",
                "Kasım–Aralık 2026 oturumlarının sonucu 2027/28 kaydı için geçerlidir.",
                [K.padova, K.cisia], "Doğrulandı"),
              m("it-mezun-dsu", "Türkiye'de üniversiteye kayıt ve burs",
                "PoliMi'de burs, öğrencinin herhangi bir ülkedeki ilk lisans kaydına göre hesaplanır. Türkiye'de lisansa kayıt yaptırmış öğrenci 1. sınıf burs profilini kaybeder ve ondan kredi istenir. Diğer bölgelerin DSU kurumlarında aynı kural olup olmadığını sor.",
                [K.polimiDsu], "Doğrulandı")
            ],
            tarihler: [
              m("it-mezun-takvim", "Takvim",
                "Mezun 12. sınıf öğrencileriyle aynı takvimi izler: CEnT-S 26 Kasım ve 17 Aralık 2026, Padova 7 Ocak – 7 Mart 2027, vize son tarihi 31 Ekim 2027.",
                [K.padova, K.mur], "Doğrulandı")
            ],
            hatalar: [
              m("it-mezun-hata-cent", "Eski CEnT sonucunu geçerli sanmak",
                "CEnT sonucu yalnızca bir sonraki kayıt yılı için geçerlidir; önceki yıllarda alınmış sonuç kullanılamaz.",
                [K.cisia], "Doğrulandı"),
              m("it-mezun-hata-toefl", "Süresi dolmuş dil belgesi",
                "TOEFL 2 yıl geçerlidir; mezuniyetten önce alınmış belgenin süresini kontrol et.",
                [K.ets], "Doğrulandı"),
              m("it-mezun-hata-dsu", "Türkiye'deki kaydı sürdürüp 1. sınıf bursuna başvurmak",
                "Türkiye'de lisans kaydı olan öğrenci PoliMi'de 1. sınıf burs profiliyle başvuramaz.",
                [K.polimiDsu], "Doğrulandı")
            ]
          }
        }
      }
    }
  };
})();
