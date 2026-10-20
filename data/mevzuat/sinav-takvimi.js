// Meberra — Sınav takvimi ve kayıt gereklilikleri (seviye testi raporu bu dosyayı okur)
// YALNIZCA resmi kaynakla doğrulanmış bilgi girilir. Doğrulanmamış alan null bırakılır;
// rapor bu durumda "doğrulanmadı" gösterir. Tarihler İstanbul saatine göre değil, College Board'un yerel takvimine göredir.
// Oturum: College Board 2027'den itibaren "Session 1 / Session 2" adlarını kullanıyor ve bunları
// "genellikle sabah ve öğleden sonra" diye tanımlıyor. Burada Session 1 = "sabah", Session 2 = "öğleden sonra".
// Biçim (hibrit / tam dijital) kaynağı: https://apstudents.collegeboard.org/ap-exams-what-to-know/digital-testing-exam-modes
window.APMEBERRA_TAKVIM = (function () {
  var TARIHLER = { ad: "College Board — 2027 AP Exam Dates", url: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates" };
  return {
  guncelleme: "7 Ekim 2026 — doğrulandı (College Board: AP Central, AP Students, Bluebook, Accommodations)",
  kayit: {
    sonGun: "2026-11-13",               // standart sipariş son günü (23:59 ET)
    gecKayitBas: "2026-11-14",
    gecKayitSon: "2027-03-12",          // 23:59 ET
    sinavUcretiUSD: 129,                // ABD, ABD toprakları, Kanada ve DoDEA dışındaki okullar
    gecUcretUSD: 40,                    // sınav başına; 14 Kasım 2026 – 12 Mart 2027 arası verilen siparişler
    iptalUcretiUSD: 40,                 // 13 Kasım sonrası iptal edilen / girilmeyen sınav
    kaynak: { ad: "College Board — Exam Fees (2026-27)", url: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/ordering-fees/exam-fees" }
  },
  sinavDonemi: {
    bas: "2027-05-03", son: "2027-05-14", gecSinavBas: "2027-05-17", gecSinavSon: "2027-05-21",
    // 2027'den itibaren başlangıç saatleri UTC ofsetine göre belirleniyor. Türkiye Mayıs'ta UTC+03:00.
    // Sınav merkezinin kesin saatini College Board'un okul arama aracından teyit edin.
    oturumSaatleri: {
      utcOfset: "+03:00", oturum1: "10:00", oturum2: "14:00",
      kaynak: { ad: "College Board — 2027 AP Exam Start Times", url: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates/start-times" },
      aramaAraci: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates/start-times/lookup"
    },
    kaynak: { ad: "College Board — 2027 AP Exam Late-Testing Dates", url: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates/late-testing-dates" }
  },
  // ders anahtarları data/sorular/seviye/*.js içindeki "ders" alanıyla aynıdır
  sinavlar: {
    "calculus-ab":        { ad: "AP Calculus AB",                       tarih: "2027-05-10", oturum: "sabah",         format: "hibrit",      kaynak: TARIHLER },
    "calculus-bc":        { ad: "AP Calculus BC",                       tarih: "2027-05-10", oturum: "sabah",         format: "hibrit",      kaynak: TARIHLER },
    "physics-1":          { ad: "AP Physics 1: Algebra-Based",          tarih: "2027-05-05", oturum: "öğleden sonra", format: "hibrit",      kaynak: TARIHLER },
    "chemistry":          { ad: "AP Chemistry",                         tarih: "2027-05-06", oturum: "öğleden sonra", format: "hibrit",      kaynak: TARIHLER },
    "biology":            { ad: "AP Biology",                           tarih: "2027-05-03", oturum: "öğleden sonra", format: "hibrit",      kaynak: TARIHLER },
    "english-language":   { ad: "AP English Language and Composition",  tarih: "2027-05-12", oturum: "sabah",         format: "tam dijital", kaynak: TARIHLER },
    // Tur 12 (16 Ekim 2026, Ajan 13 sinavlar-tur12.json > ap-physics-2): Groningen fizik programları için gerekli.
    "physics-2":          { ad: "AP Physics 2: Algebra-Based",          tarih: "2027-05-06", oturum: "sabah",         format: "hibrit",      kaynak: TARIHLER },
    "physics-c-mechanics":{ ad: "AP Physics C: Mechanics",              tarih: "2027-05-03", oturum: "sabah",         format: "hibrit",      kaynak: TARIHLER },
    "physics-c-em":       { ad: "AP Physics C: Electricity and Magnetism", tarih: "2027-05-05", oturum: "öğleden sonra", format: "hibrit",   kaynak: TARIHLER },
    "computer-science-a": { ad: "AP Computer Science A",                tarih: "2027-05-12", oturum: "öğleden sonra", format: "tam dijital", kaynak: TARIHLER },
    "microeconomics":     { ad: "AP Microeconomics",                    tarih: "2027-05-04", oturum: "öğleden sonra", format: "hibrit",      kaynak: TARIHLER },
    "macroeconomics":     { ad: "AP Macroeconomics",                    tarih: "2027-05-07", oturum: "öğleden sonra", format: "hibrit",      kaynak: TARIHLER },
    "statistics":         { ad: "AP Statistics",                        tarih: "2027-05-11", oturum: "öğleden sonra", format: "tam dijital", kaynak: TARIHLER },
    "precalculus":        { ad: "AP Precalculus",                       tarih: "2027-05-11", oturum: "sabah",         format: "hibrit",      kaynak: TARIHLER }
  },
  // Kayıt ve sınav günü gereklilikleri (rapordaki kontrol listesi)
  gereklilikler: [
    {
      id: "dis-aday-okul-bul",
      baslik: "Sınava girilecek okulu bul ve AP koordinatörüyle görüş",
      ozet: "Okulu AP sunmayan öğrenci, AP Course Ledger'da ülke/şehir araması yapıp listelenen okulları arar ve AP koordinatörüne dışarıdan öğrenci kabul edip etmediklerini sorar. Koordinatör sınavları sipariş eder, ücreti toplar ve nerede/ne zaman sınava girileceğini bildirir. Okulların kendi iç son tarihleri olabilir; olabildiğince erken başvurulmalı.",
      ne_zaman: "hemen",
      durum: "dogrulandi",
      kaynak: { ad: "AP Students — I'm homeschooled/my school doesn't administer AP Exams", url: "https://apstudents.collegeboard.org/help-center/im-homeschooled-how-can-i-take-ap-exam" }
    },
    {
      id: "dis-aday-turkiye-merkez",
      baslik: "Türkiye için yetkili AP test merkezi (Prometric)",
      ozet: "Bölgede AP okulu yoksa ya da hiçbiri dış adaya sınav yaptırmıyorsa College Board, yetkili test merkezlerini listeliyor. Türkiye için listelenen merkez Prometric: https://www.prometric.com/exams/cbaptr . Okul bulunamazsa bu yol değerlendirilmeli; kayıt koşulları ve ücretler Prometric sayfasından teyit edilmeli.",
      ne_zaman: "hemen",
      durum: "dikkat",
      kaynak: { ad: "AP Students — Can I sign up for an AP Exam if I don't live in the United States?", url: "https://apstudents.collegeboard.org/help-center/can-i-sign-ap-exam-if-i-dont-live-united-states" }
    },
    {
      id: "siparis-son-tarih",
      baslik: "Sipariş son tarihi: 13 Kasım 2026",
      ozet: "Okulların AP sınav siparişi son günü 13 Kasım 2026, 23:59 ET. 14 Kasım 2026 – 12 Mart 2027 arası verilen siparişlere sınav başına 40 $ geç sipariş ücreti eklenir. Koordinatör kendi takdiriyle Kasım sonrasında da öğrenci ekleyebilir ve geç ücretin kaldırılmasını isteyebilir. ABD dışı temel ücret sınav başına 129 $.",
      ne_zaman: "kayit-oncesi",
      durum: "dogrulandi",
      kaynak: { ad: "AP Central — Exam Fees (2026-27)", url: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/ordering-fees/exam-fees" }
    },
    {
      id: "my-ap-join-code",
      baslik: "College Board hesabı ve My AP'de exam only section'a katılma",
      ozet: "College Board hesabıyla My AP'ye girilir, 'Join a Course or Exam' ile sınava girilecek okulun AP koordinatöründen alınan 6 karakterlik join code girilir. Dış aday 'exam only' bölümüne katılır; bu kodu yalnızca koordinatör oluşturabilir. Her ders için ayrı kod girilir.",
      ne_zaman: "kayit-oncesi",
      durum: "dogrulandi",
      kaynak: { ad: "AP Students — How to Join Your AP Class Section", url: "https://apstudents.collegeboard.org/access-your-ap-resources/join-your-class-online" }
    },
    {
      id: "kayit-onayi",
      baslik: "Kayıt onayını My AP'de kontrol et",
      ozet: "Katıldıktan sonra My AP'de 'Register for the Exam' düğmesi görünüyorsa tıklanmalı; koordinatör sınavı buna göre sipariş eder. Düğme yoksa öğrenci otomatik kaydedilmiştir. Siparişin verildiğini 13 Kasım'dan önce koordinatörden de teyit et.",
      ne_zaman: "kayit-oncesi",
      durum: "dogrulandi",
      kaynak: { ad: "AP Students — How to Join Your AP Class Section", url: "https://apstudents.collegeboard.org/access-your-ap-resources/join-your-class-online" }
    },
    {
      id: "bluebook-cihaz",
      baslik: "Bluebook cihaz gereksinimleri",
      ozet: "Bluebook Windows veya Mac bilgisayarda, iPad'de ya da okulun yönettiği Chromebook'ta çalışır; kişisel Chromebook ve telefonda çalışmaz. En düşük sürümler: Windows 11 24H2, macOS 15, iPadOS 18. Cihaz 3–4 saat şarjla dayanmalı. Dizüstünde harici klavye yasak; iPad/Windows tablette tam dijital sınavlar için harici klavye zorunlu.",
      ne_zaman: "kayit-oncesi",
      durum: "dogrulandi",
      kaynak: { ad: "Bluebook — Approved Devices", url: "https://bluebook.collegeboard.org/students/prepare-your-device/approved-devices" }
    },
    {
      id: "bluebook-kurulum",
      baslik: "Bluebook'u kur ve cihazı hazırla (sınavdan 30 gün ve 5 gün önce)",
      ozet: "Sınavdan en az 30 gün önce Bluebook'u indir, 'Test Your Device' çalıştır, College Board hesabınla giriş yap ve gerekli ayarları uygula. 5 gün önce Bluebook'u yeniden aç (güncel sürüm), ana sayfadaki kişisel bilgilerin kimlikle eşleştiğini kontrol et. Hesap şifresini ezberle; Bluebook şifreyi kaydetmez. Nisan'da 'Practice and Prepare' bölümünden test önizlemesini dene. Not: Resmi sayfada 'exam setup + admission ticket' adımı yalnızca SAT Weekend için yazıyor; AP için yaklaşan sınav ana sayfada 'Your Tests' altında görünür. Ayrı bir AP adımı gerekip gerekmediğini koordinatöre sor.",
      ne_zaman: "sinav-oncesi",
      durum: "dikkat",
      kaynak: { ad: "Bluebook — Prepare a Personal Device", url: "https://bluebook.collegeboard.org/students/prepare-your-device/prepare-a-personal-device" }
    },
    {
      id: "hibrit-frq-kagit",
      baslik: "Hibrit sınavlarda FRQ kağıda el yazısıyla",
      ozet: "Hibrit sınavlarda (Calculus AB/BC, Physics 1, Physics C, Chemistry, Biology, Micro/Macro, Precalculus) çoktan seçmeliler Bluebook'ta çözülür, açık uçlu sorular Bluebook'ta görüntülenir ama cevaplar kağıt sınav kitapçığına elle yazılır. English Language, Computer Science A ve Statistics tam dijitaldir.",
      ne_zaman: "sinav-oncesi",
      durum: "dogrulandi",
      kaynak: { ad: "AP Students — How Are AP Exams Administered?", url: "https://apstudents.collegeboard.org/ap-exams-what-to-know/digital-testing-exam-modes" }
    },
    {
      id: "hesap-makinesi",
      baslik: "Hesap makinesi politikası (2027)",
      ozet: "Grafik hesap makinesi: Calculus AB/BC ve Precalculus'ta hesap makineli bölümlerde zorunlu; Physics 1, Physics C ve Chemistry'de bilimsel ya da grafik serbest; Statistics'te istatistik özellikli grafik hesap makinesi (2027'den itibaren grafik olmayanlar yasak). Biology'de 2027'den itibaren yalnızca 4 işlemli (karekök) ya da grafik olmayan bilimsel. Micro/Macro'da yalnızca 4 işlemli. English Language ve CSA'da hesap makinesi yok. En fazla 2 el hesap makinesi getirilebilir. Yalnızca Bluebook'a gömülü Desmos kullanılabilir; Calculus ve Precalculus'ta Desmos sadece hesap makineli bölümlerde açık.",
      ne_zaman: "sinav-oncesi",
      durum: "dogrulandi",
      kaynak: { ad: "AP Students — Calculator Policies", url: "https://apstudents.collegeboard.org/exam-policies-guidelines/calculator-policies" }
    },
    {
      id: "oturum-saatleri",
      baslik: "2027 başlangıç saatleri değişti",
      ozet: "2027'den itibaren sınavlar Session 1 / Session 2 olarak UTC ofsetine göre başlıyor. Mayıs'ta UTC+03:00 olan yerlerde Session 1 10:00, Session 2 14:00 (yerel saat). Sınav merkezinin saatini College Board arama aracından teyit et.",
      ne_zaman: "sinav-oncesi",
      durum: "dikkat",
      kaynak: { ad: "AP Central — 2027 AP Exam Start Times", url: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates/start-times" }
    },
    {
      id: "sinav-gunu-kimlik",
      baslik: "Kimlik: dış aday için fotoğraflı kimlik zorunlu",
      ozet: "Sınava girdiğin okulun öğrencisi değilsen devlet ya da okul tarafından verilmiş fotoğraflı kimlik getir.",
      ne_zaman: "sinav-gunu",
      durum: "dogrulandi",
      kaynak: { ad: "AP Students — What to Bring on Exam Day", url: "https://apstudents.collegeboard.org/exam-policies-guidelines/what-to-bring-on-exam-day" }
    },
    {
      id: "sinav-gunu-getir",
      baslik: "Getirilecekler",
      ozet: "Tam şarjlı, Bluebook kurulu cihaz ve şarj kablosu/taşınabilir şarj cihazı; hibrit sınavlar için silgili açılmış No. 2 kurşun kalem ve kalem; izin verilen derslerde en fazla 2 onaylı hesap makinesi; akıllı olmayan saat; tablet kullanılıyorsa tam dijital sınavda harici klavye; Physics sınavlarında cetvel.",
      ne_zaman: "sinav-gunu",
      durum: "dogrulandi",
      kaynak: { ad: "AP Students — What to Bring on Exam Day", url: "https://apstudents.collegeboard.org/exam-policies-guidelines/what-to-bring-on-exam-day" }
    },
    {
      id: "sinav-gunu-yasak",
      baslik: "Getirilmeyecekler",
      ozet: "Telefon, dizüstü (test cihazı dışında), tablet, akıllı saat/gözlük ve giyilebilir teknoloji, internete bağlanan cihazlar, ayrı zamanlayıcı, kitap, defter, not, sözlük, fosforlu kalem, düzeltici, mekanik ya da renkli kurşun kalem, elektronik kalem, yiyecek-içecek, pano ve gizlilik ekranı. İhlal sınavdan çıkarılma ve puan iptaline yol açabilir.",
      ne_zaman: "sinav-gunu",
      durum: "dogrulandi",
      kaynak: { ad: "AP Students — What to Bring on Exam Day", url: "https://apstudents.collegeboard.org/exam-policies-guidelines/what-to-bring-on-exam-day" }
    },
    {
      id: "puan-aciklama",
      baslik: "Puanlar Temmuz 2027'de açıklanır",
      ozet: "AP puanları Temmuz 2027'de College Board hesabından görülebilir (kesin gün henüz açıklanmadı).",
      ne_zaman: "sinav-oncesi",
      durum: "dogrulandi",
      kaynak: { ad: "AP Central — 2026-27 Key Dates and Deadlines", url: "https://apcentral.collegeboard.org/about-ap/school-year-timeline" }
    },
    {
      id: "ucretsiz-puan-gonderimi",
      baslik: "Ücretsiz puan gönderimi: 20 Haziran 2027",
      ozet: "Ücretsiz puan gönderimi için alıcı üniversite/burs programı 20 Haziran 2027, 23:59 ET'ye kadar My AP'de seçilmeli. Bu tarihe kadar seçilenlere puanlar Temmuz başında ulaşır.",
      ne_zaman: "sinav-oncesi",
      durum: "dogrulandi",
      kaynak: { ad: "AP Students — Use Your Free Score Send Before the Deadline", url: "https://apstudents.collegeboard.org/sending-scores/free-score-send" }
    },
    {
      id: "ssd-duzenleme",
      baslik: "Engelli öğrenci düzenlemeleri (SSD): 22 Ocak 2027",
      ozet: "Mayıs 2027 AP sınavları için düzenleme talepleri ve belgeler 22 Ocak 2027'ye kadar College Board SSD'ye ulaşmalı. Onay süreci 7 haftayı bulabilir.",
      ne_zaman: "kayit-oncesi",
      durum: "dogrulandi",
      kaynak: { ad: "College Board Accommodations — Dates and Deadlines", url: "https://accommodations.collegeboard.org/request-accommodations/dates-deadlines" }
    }
  ]
  };
})();
