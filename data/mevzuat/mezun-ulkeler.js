// Meberra — Mezun Menüsü: Almanya ve İtalya dışındaki ülkeler — Tur 10 (14 Ekim 2026)
// İÇERİK SAHİBİ: Ajan 13 (Mevzuat); PM doldurdu. Kaynak: .agents/mevzuat/karar-notu-2026-10-14-mezun-diger-ulkeler.md
// Kullanıcı kararı (14 Ekim 2026): Mezun Menüsü Macaristan + Polonya ile başlar. Avusturya ve Hollanda
// teyit e-postaları (T-D1, T-D2) yanıtlanınca eklenebilir. BME duyurusu 15 Kasım 2026'dan sonra gösterilmez.
//
// ŞEMA
// window.APMEBERRA_MEZUN_ULKELER = {
//   surum, sonKontrol,
//   anaRotalar: ["de", "it"],           // mezun için sartlar.html?ulke=..&sinif=mezun bağlantısıyla gösterilir
//   duyurular: [duyuru],                // duyuru = madde + { bitis: "YYYY-AA-GG" } (bitis gününden SONRA gösterilmez)
//   ulkeler: {
//     hu: { ad, ozet, rozet: null | "Teyit gerekir", ortak: [madde], buYil: [madde], tarihler: [madde], hatalar: [madde] },
//     pl: { ... }
//   },
//   digerleri: [{ ad, neden, kaynak: [{ad,url}] }]   // menüye alınmayan ülkeler ve nedeni
// };
// madde: data/mevzuat/sartlar.js ile aynı şema ({id, baslik, metin, kaynak[], kesinlik, sonKontrol}).
(function () {
  var T = "2026-10-14";

  var S = {
    shPartner: { ad: "Stipendium Hungaricum — ortak kurumlar (Türkiye)", url: "https://stipendiumhungaricum.hu/partners/" },
    meb: { ad: "MEB ABDGM — Macaristan Hükümeti Bursu 2025-2026 duyurusu", url: "https://abdigm.meb.gov.tr/meb_iys_dosyalar/2024_11/27110530_macaristan2526.pdf" },
    sh2627: { ad: "Stipendium Hungaricum — 2026/27 başvuru duyurusu", url: "https://stipendiumhungaricum.hu/news/application-is-on-for-the-2026-2027-stipendium-hungaricum-scholarship/" },
    shCall: { ad: "Stipendium Hungaricum — Call for Applications", url: "https://stipendiumhungaricum.hu/documents/stipendium_hungaricum/Call/BA_MA_OTM_Call_for_Applications.pdf" },
    bmeBelge: { ad: "BME — başvuru belgeleri 2026", url: "https://xplore.bme.hu/wp-content/uploads/2026/03/BME_Application_Documents_Requirements_2026.pdf" },
    bmeSinav: { ad: "BME — giriş sınavı şartları 2026/27", url: "https://xplore.bme.hu/wp-content/uploads/2026/04/entrance-exams_20260401.pdf" },
    bmeKabul: { ad: "BME — kabul ve başvuru dönemleri", url: "https://xplore.bme.hu/admission" },
    bmeUcret: { ad: "BME — öğrenim ücretleri", url: "https://xplore.bme.hu/tuition-fees/" },
    huKons: { ad: "Macaristan İstanbul Başkonsolosluğu — öğrenim", url: "https://istanbul.mfa.gov.hu/en/tanulmanyi" },
    nawa: { ad: "NAWA — yurt dışı lise diplomasının tanınması", url: "https://nawa.gov.pl/en/recognition/how-to-obtain-a-recognition-statement/secondary-school-certificate" },
    prz: { ad: "Rzeszów Teknik Üniversitesi — 2026/27 lisans başvurusu", url: "https://dwm.prz.edu.pl/en/recruitment-of-foreigners-and-poles-with-foreign-secondary-school-leaving-exams/2026-2027-foreign-candidates/application-procedures/bsc-studies" },
    wutTeklif: { ad: "Varşova Teknik Üniversitesi — B.Sc. programları", url: "https://www.students.pw.edu.pl/Studies-Offer/B.Sc.-offer" },
    wutUcret: { ad: "Varşova Teknik Üniversitesi — Rektör Kararı 131/2026 (ücretler)", url: "https://eng.pw.edu.pl/index.php/content/download/6121/51090/file/131_2026_cudz_2026_ENG.pdf" },
    wutTakvim: { ad: "Varşova Teknik Üniversitesi — Ekim 2026 kabulü", url: "https://eng.pw.edu.pl/News/Admission-for-October-2026-is-open" },
    put: { ad: "Poznan Teknik Üniversitesi — takvim", url: "https://put.poznan.pl/en/admission-for-international/first-cycle/schedule" },
    plVize: { ad: "gov.pl — öğrenci vizesi geçim tutarı (elçilik eki)", url: "https://www.gov.pl/attachment/a6fba046-5f01-459b-bfd1-d517fa01d11b" },
    oead: { ad: "OeAD ENIC NARIC — Türk diplomasıyla Avusturya'da öğrenim", url: "https://oead.at/fileadmin/Dokumente/oead.at/OeAD_Hauptmenueseiten/Studieren_Forschen_Lehren/ENIC_NARIC_PDFs/Tuerkei__Zulassung.pdf" },
    utAP: { ad: "University of Twente — AP şartları", url: "https://www.utwente.nl/en/education/bachelor/how-to-apply/diplomas/AP-CollegeBoard/" },
    delft: { ad: "TU Delft — ülkeye özel şartlar", url: "https://www.tudelft.nl/en/education/admission-and-application/bsc-international-diploma/admission-requirements/country-specific-requirements" },
    msmt: { ad: "Çekya MŠMT — nostrifikasyon rehberi", url: "https://msmt.gov.cz/file/49381_1_1" },
    upm: { ad: "UPM — yurt dışı diplomayla başvuru", url: "https://www.upm.es/sfs/Rectorado/Vicerrectorado%20de%20Alumnos/Informacion/Acceso/Documentos/EstudiosExtranjerosInformacionGeneral.pdf" },
    campusFrance: { ad: "Campus France Türkiye — 1. sınıf başvuru rehberi", url: "https://turquie.campusfrance.org/system/files/medias/documents/2024-10/%C3%9Cniversite%201.%20s%C4%B1n%C4%B1f%20ba%C5%9Fvurular%C4%B1nda%20izlenecek%20yol%202025.pdf" },
    tcd: { ad: "Trinity College Dublin — Türkiye", url: "https://www.tcd.ie/study/country/turkey/" },
    aalto: { ad: "Aalto — BSc Science and Technology", url: "https://www.aalto.fi/en/programmes/aalto-bachelors-programme-in-science-and-technology" },
    uhr: { ad: "UHR (İsveç) — Lise Diplomasi değerlendirmesi", url: "https://www.uhr.se/en/start/recognition-of-foreign-qualifications/qualifications-assessment-tool/turkey/lise-diplomasi-566" },
    kul: { ad: "KU Leuven — Bachelor of Engineering Technology", url: "https://onderwijsaanbod.kuleuven.be/opleidingen/e/SC_55554488/diploma_omschrijving" }
  };

  function m(id, baslik, metin, kaynak, kesinlik) {
    return { id: id, baslik: baslik, metin: metin, kaynak: kaynak, kesinlik: kesinlik, sonKontrol: T };
  }

  window.APMEBERRA_MEZUN_ULKELER = {
    surum: "1.0.0",
    sonKontrol: T,
    anaRotalar: ["de", "it"],
    duyurular: [
      (function () {
        var d = m("duyuru-bme-subat-2027", "Budapeşte Teknik Üniversitesi: Şubat 2027 başlangıcı için başvuru açık",
          "BME'nin Şubat 2027'de başlayan İngilizce lisans programlarına ücretli öğrenci başvurusu 15 Ekim – 15 Kasım 2026 arasında açık. YKS istenmiyor; mühendislikte yazılı matematik ve fizik sınavı var. Ücret dönem başına 3.200–3.500 €, başvuru ücreti 150 €.",
          [S.bmeKabul, S.bmeUcret, S.bmeSinav], "Doğrulandı");
        d.bitis = "2026-11-15";
        return d;
      })()
    ],
    ulkeler: {
      hu: {
        ad: "Macaristan",
        ozet: "YKS istemeyen, mezuniyet yılı sınırı olmayan ve Türkiye'ye özel kontenjanı bulunan tam burs yolu (Stipendium Hungaricum). Burssuz ücretler orta düzeyde.",
        rozet: null,
        ortak: [
          m("hu-giris", "Giriş şartı",
            "Budapeşte Teknik Üniversitesi (BME) lise diploması ve transkript istiyor; denklik kararını üniversite veriyor. Belge listesinde YKS yok. Mühendislik programlarında yazılı matematik ve fizik giriş sınavı var; bazı programlarda sözlü görüşme de yapılıyor.",
            [S.bmeBelge, S.bmeSinav], "Doğrulandı"),
          m("hu-diger-universiteler", "Diğer üniversiteler",
            "YKS'nin istenmemesi BME 2026 belge listesine dayanıyor. Diğer Macar üniversitelerinin şartını kendi sayfasından kontrol et.",
            [S.bmeBelge], "Teyit gerekir"),
          m("hu-dil", "Dil şartı",
            "BME en az B2 istiyor: IELTS 5.5, TOEFL iBT 72 ya da Duolingo 100 gibi. Fakülteler daha yüksek eşik koyabilir.",
            [S.bmeKabul], "Doğrulandı"),
          m("hu-ucret", "Ücret",
            "BME'de AB dışı öğrenci ücreti dönem başına 3.200 € (İnşaat, Kimya, Bilgisayar ve Elektrik Müh.) ile 3.500 € (Makine Müh.) arasında (2026/27 güz).",
            [S.bmeUcret], "Doğrulandı"),
          m("hu-sh", "Stipendium Hungaricum bursu",
            "Burs öğrenim ücretini karşılar, lisansta ayda 43.700 HUF harçlık, ücretsiz yurt ya da ayda 40.000 HUF konut katkısı ve sağlık sigortası verir (2025/26 çağrısı). 2025/26'da Türkiye'ye 55 lisans bursu ayrıldı. Yalnızca T.C. vatandaşları başvurabilir.",
            [S.shCall, S.meb], "Doğrulandı"),
          m("hu-mezun", "Mezunlar başvurabilir",
            "Burs çağrısında mezuniyet yılı ya da boşluk yılı sınırı yok. Tek yaş şartı: başlangıç yılının 31 Ağustos'unda 18 yaşını doldurmuş olmak.",
            [S.shCall], "Doğrulandı"),
          m("hu-vize", "Vize",
            "Öğrenim amaçlı oturum izni (D vizesi) başvurusu Ankara ve İstanbul'daki AS Visa ofislerinde randevuyla yapılıyor. İstenen geçim kanıtı tutarını konsolosluktan öğren.",
            [S.huKons], "Teyit gerekir")
        ],
        buYil: [
          m("hu-cift-basvuru", "Bursa iki sistemden başvur",
            "Stipendium Hungaricum'a hem burs portalından hem de MEB'in basvuru.meb.gov.tr sisteminden başvurmak gerekiyor. İki sistemden birinde başvurusu olmayan aday geçersiz sayılır. Sözlü sınav Ankara'da yapılır; tarihi abdigm.meb.gov.tr'de duyurulur.",
            [S.shPartner, S.meb], "Doğrulandı"),
          m("hu-sinav-hazirlik", "Giriş sınavına hazırlan",
            "BME mühendislik giriş sınavı yazılı matematik ve fizikten oluşuyor. Bu platformdaki Calculus ve Physics çalışmaları bu sınava da hazırlık sayılır.",
            [S.bmeSinav], "Doğrulandı")
        ],
        tarihler: [
          m("hu-bme-subat", "BME Şubat 2027 başlangıcı",
            "Ücretli öğrenci başvurusu 15 Ekim – 15 Kasım 2026.",
            [S.bmeKabul], "Doğrulandı"),
          m("hu-sh-2728", "Stipendium Hungaricum 2027/28",
            "Çağrı henüz yayımlanmadı; Kasım 2026'da bekleniyor. 2026/27'de son başvuru 15 Ocak 2026 idi.",
            [S.sh2627], "Yayımlanmadı"),
          m("hu-bme-eylul", "BME Eylül başlangıcı",
            "Eylül 2026 başlangıcı için başvuru 1 Nisan – 15 Mayıs 2026 arasındaydı; 2027 için de benzer bir pencere bekleniyor.",
            [S.bmeKabul], "Yayımlanmadı")
        ],
        hatalar: [
          m("hu-hata-meb", "Yalnızca burs portalından başvurmak",
            "MEB sistemine de başvurmayan Türk adayın başvurusu geçersiz sayılır.",
            [S.meb], "Doğrulandı"),
          m("hu-hata-takvim", "Burs takvimini kaçırmak",
            "Stipendium Hungaricum yılda bir kez, Kasım–Ocak döneminde başvuru alır ve rekabetlidir.",
            [S.sh2627], "Doğrulandı")
        ]
      },
      pl: {
        ad: "Polonya",
        ozet: "Düşük ücretli İngilizce mühendislik ve yaz sonuna kadar süren başvuru dönemi: geç karar veren mezun için B planı. Türk diplomasının YKS olmadan kabul edilip edilmediği henüz teyit edilmedi.",
        rozet: "Teyit gerekir",
        ortak: [
          m("pl-tanima", "Diplomanın tanınması",
            "OECD ülkelerinden (Türkiye dahil) gelen lise diploması, veren ülkede yükseköğretime başvuru hakkı tanıyorsa Polonya'da kanun gereği tanınır; ayrı bir denklik belgesi gerekmez.",
            [S.nawa], "Doğrulandı"),
          m("pl-yks", "YKS gerekir mi?",
            "Türkiye'de üniversiteye yerleşme YKS ile olduğu için bazı üniversiteler YKS belgesi isteyebilir. Hedef üniversiteye yazılı olarak sor.",
            [S.nawa], "Teyit gerekir"),
          m("pl-dil", "Dil şartı",
            "Yasa öğretim dilinde en az B2 seviyesi istiyor. Varşova Teknik Üniversitesi'nin eşiğini programdan kontrol et.",
            [S.prz], "Doğrulandı"),
          m("pl-ucret", "Ücret",
            "Varşova Teknik Üniversitesi 2026/27'de 11 İngilizce lisans programı sundu. AB dışı öğrenci ücretleri 2.340 € (Enerji) ile 5.700 € (CS & Information Systems) arasında; sayfa \"dönem\" diyor, rektör kararı yıllık ücret gibi gösteriyor. Birimi üniversiteye sor.",
            [S.wutTeklif, S.wutUcret], "Yoruma açık"),
          m("pl-belgeler", "Belgeler",
            "Diploma, apostil ve Lehçe yeminli tercüme (Rzeszów Teknik Üniversitesi örneği).",
            [S.prz], "Doğrulandı"),
          m("pl-mezun", "Mezunlar",
            "Taranan kaynaklarda mezuniyet yılı ya da boşluk yılı sınırı bulunamadı.",
            [S.nawa, S.wutTeklif], "Teyit gerekir"),
          m("pl-vize", "Vize",
            "Ulusal D vizesi gerekir. Geçim kanıtı ayda en az 776 PLN, konaklama ve 2.500 PLN dönüş bileti tutarı olarak gösteriliyor; Türkiye'deki konsoloslukta geçerli tutarı kontrol et.",
            [S.plVize], "Yoruma açık")
        ],
        buYil: [
          m("pl-teyit", "Üniversiteye yaz",
            "Türk diplomasının YKS olmadan kabul edilip edilmediğini, ücretin dönemlik mi yıllık mı olduğunu ve dil eşiğini hedef üniversiteye yazılı olarak sor.",
            [S.wutTeklif, S.nawa], "Teyit gerekir")
        ],
        tarihler: [
          m("pl-wut-takvim", "Varşova Teknik Üniversitesi",
            "2026/27'de yeni başvuru için son gün 21 Temmuz 2026, kabul edilenlerin belge yükleme son günü 19 Ağustos 2026 idi. 2027/28 takvimi henüz yayımlanmadı.",
            [S.wutTakvim], "Yayımlanmadı"),
          m("pl-put-takvim", "Poznan Teknik Üniversitesi",
            "2026/27'de başvuru 12 Mayıs – 9 Temmuz 2026, belge asılları 2 Eylül – 2 Ekim arasındaydı. 2027/28 takvimi henüz yayımlanmadı.",
            [S.put], "Yayımlanmadı")
        ],
        hatalar: [
          m("pl-hata-teyit", "Teyit almadan tek seçenek yapmak",
            "YKS sorusu yanıtlanana kadar Polonya'yı tek plan değil, B planı olarak tut.",
            [S.nawa], "Yoruma açık")
        ]
      }
    },
    digerleri: [
      { ad: "Avusturya", neden: "Almanya'daki gibi YKS yerleşmesi gerekiyor; İngilizce mühendislik lisansı çok az. Teyit yanıtı gelince eklenebilir.", kaynak: [S.oead] },
      { ad: "Hollanda", neden: "Türk diplomasıyla yalnızca en az 4 AP (her biri 3+) ile; TU Delft kabul etmiyor; yıllık ücret yaklaşık 16.000 €. Teyit yanıtı gelince eklenebilir.", kaynak: [S.utAP, S.delft] },
      { ad: "Çekya", neden: "Diploma denkliği (nostrifikasyon) gerekiyor ve başvuru takvimi erken.", kaynak: [S.msmt] },
      { ad: "İspanya", neden: "Bakanlık denkliği ve UNEDasiss gerekiyor; İngilizce program az.", kaynak: [S.upm] },
      { ad: "Belçika", neden: "Türk diploması için giriş koşulu doğrulanamadı.", kaynak: [S.kul] },
      { ad: "Fransa", neden: "Lisans başvurusu Campus France üzerinden ve programlar çoğunlukla Fransızca.", kaynak: [S.campusFrance] },
      { ad: "İrlanda", neden: "Türk diplomasıyla doğrudan giriş yok, ücret yüksek.", kaynak: [S.tcd] },
      { ad: "Finlandiya", neden: "Yıllık ücret 12.000 € ve üzeri.", kaynak: [S.aalto] },
      { ad: "İsveç", neden: "İngilizce mühendislik lisansı az, ücret yüksek.", kaynak: [S.uhr] }
    ]
  };
})();
