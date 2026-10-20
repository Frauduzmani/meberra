// Meberra — Resmi yazışma (teyit e-postası) şablonları (Tur 5b, spec §7.1–7.2)
// Sahibi: Ajan 13 Kıdemli Uluslararası Kabul Mevzuatı Uzmanı. Hazırlanma: 12 Ekim 2026.
// Dayanak: .agents/mevzuat/karar-notu-2026-10-12.md (T1–T3 taslakları). K1–K3 kararları 12 Ekim 2026'da kullanıcı tarafından kapatıldı (spec §8, §8.3);
//          şablonlar rota adımlarına bağlıdır (data/mevzuat/ulke-rotalari.js), kararNotu alanları null.
// KURALLAR:
//  - Yalnızca §7.2 değişkenleri kullanılır. Motor (eposta.js) boş değişkeni "[eksik: yol]" yapar;
//    bu yüzden gövdede geçen her değişken zorunluAlanlar listesindedir.
//  - Alıcı e-posta adresi yalnızca resmi sayfada açıkça yazıyorsa verilir (kaynak URL ile).
//    Yoksa eposta: null ve iletisimSayfasi (form/ticket) verilir.
//  - alici.secenekler (isteğe bağlı, §7.1'e ek): alıcı üniversiteye/bölgeye göre değişiyorsa
//    data/mevzuat/ulkeler.js kimliğine (universiteId) göre doğrulanmış resmi kanallar. Motor bu alanı
//    tanımıyorsa yok sayar; yazismalar.html seçilen üniversiteye göre alıcıyı buradan doldurabilir.
//  - dayanak: şablondaki soruların neden sorulduğunu gösteren resmi kaynaklar.
//  - Tüm erişim tarihleri: 12 Ekim 2026.
window.APMEBERRA_EPOSTA_SABLONLARI = [

  // ---------------------------------------------------------------- ALMANYA
  {
    id: "de-uni-ap-yks-teyit",
    baslik: "Alman üniversitesine kabul yolu teyidi (AP mi, YKS yerleştirmesi mi?)",
    amac: "Türk diploması + AP ile doğrudan giriş için anabin'de kural yok; üniversitenin bireysel istisna tanıyıp tanımadığını, YKS yerleştirme sonucunun geç teslim edilip edilemeyeceğini ve VPD gerekip gerekmediğini yazılı olarak öğrenmek için (karar notu T1).",
    ulke: "de",
    kararNotu: null,
    alici: {
      tur: "universite",
      kurum: null,
      eposta: null,
      iletisimSayfasi: null,
      kaynak: null,
      not: "Seçilen üniversitenin uluslararası öğrenci kabul birimine gönderilir. Doğrulanmış adresler alici.secenekler içinde; listede olmayan üniversite için resmi 'International Office / Admissions' sayfası kullanılmalı.",
      secenekler: [] // dosya sonundaki DE_SECENEKLER ile doldurulur
    },
    dil: "en",
    konu: "Admission eligibility – {{ogrenci.diploma}} with AP exams ({{program.ad}}, {{basvuru.donem}})",
    govde:
      "Dear Admissions Team,\n\n" +
      "My name is {{ogrenci.adSoyad}}. I will graduate in {{ogrenci.mezuniyetAyYil}} from {{ogrenci.okul}}, a 12-year general secondary school in {{ogrenci.okulSehir}}, Turkey, with a {{ogrenci.diploma}}. I do not hold a US High School Diploma. By graduation I will also hold College Board results in {{ogrenci.apSinavlari}} (scores of 3 or higher expected). I would like to apply to the {{program.ad}} programme at {{universite.ad}}, starting in the {{basvuru.donem}}.\n\n" +
      "Could you please confirm the following:\n\n" +
      "1. Can AP results in combination with a {{ogrenci.diploma}} establish a direct (subject-restricted) higher education entrance qualification at your university, or is the anabin rule for Turkey (Lise Diplomasi plus a YKS score and placement in a four-year Lisans programme, case group TUR-BV05) the only route?\n" +
      "2. If YKS placement is required: the YKS {{basvuru.yil}} placement results may be published after your application deadline. Can they be submitted after the deadline for the {{basvuru.donem}}?\n" +
      "3. Does your university require a uni-assist VPD for this programme?\n\n" +
      "Thank you very much for your help.\n\n" +
      "Kind regards,\n" +
      "{{ogrenci.adSoyad}}\n" +
      "Date of birth: {{ogrenci.dogumTarihi}}",
    zorunluAlanlar: ["ogrenci.adSoyad", "ogrenci.dogumTarihi", "ogrenci.mezuniyetAyYil", "ogrenci.okul", "ogrenci.okulSehir", "ogrenci.diploma", "ogrenci.apSinavlari", "program.ad", "universite.ad", "basvuru.donem", "basvuru.yil"],
    neZaman: "Hemen (11. sınıfın güz dönemi, Ekim–Aralık). Resmi bir takvime bağlı değildir; amaç Almanya rotasına başlarken, YKS tercih listesini kurmadan önce yazılı yanıt almaktır. Yalnızca gerçekten başvurmayı düşündüğün 2–4 üniversiteye gönder.",
    dayanak: [
      "https://anabin.kmk.org",
      "https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/tr/",
      "https://www.uni-assist.de/en/how-to-apply/plan-your-application/vpd/"
    ],
    guncelleme: "2026-10-12"
  },

  {
    id: "de-uniassist-ap-yks",
    baslik: "uni-assist'e soru: AP, YKS yerleştirmesinin yerine geçer mi?",
    amac: "uni-assist'in Türk diplomasını AP ile değerlendirip değerlendirmediğini ve YKS yolunda istenen belgeleri yazılı olarak teyit etmek için (karar notu T2).",
    ulke: "de",
    kararNotu: null,
    alici: {
      tur: "kurum",
      kurum: "uni-assist",
      eposta: null,
      iletisimSayfasi: "https://my.uni-assist.de/hilfe",
      kaynak: "https://www.uni-assist.de/en/contact/",
      not: "uni-assist e-posta adresi yayımlamıyor; sorular yalnızca iletişim formundan alınıyor (telefon: +49 30 201 646 001, hafta içi 10:00–13:00). Metni forma yapıştır."
    },
    dil: "en",
    konu: "{{ogrenci.diploma}} – AP exams instead of YKS placement?",
    govde:
      "Dear uni-assist team,\n\n" +
      "I will graduate in {{ogrenci.mezuniyetAyYil}} from a 12-year general secondary school in {{ogrenci.okulSehir}}, Turkey, with a {{ogrenci.diploma}}. I do not hold a US High School Diploma. I plan to start a bachelor's degree in Germany in the {{basvuru.donem}}.\n\n" +
      "1. Does uni-assist evaluate a {{ogrenci.diploma}} as a direct higher education entrance qualification if the applicant holds AP exam results with scores of 3 or higher ({{ogrenci.apSinavlari}}) instead of a YKS placement (\"Yerleştirme Sonuçları\")?\n" +
      "2. If not, which documents are required from an applicant who takes the YKS in {{basvuru.yil}} and is placed in an engineering Lisans programme?\n\n" +
      "Thank you for your help.\n\n" +
      "Kind regards,\n" +
      "{{ogrenci.adSoyad}}\n" +
      "Date of birth: {{ogrenci.dogumTarihi}}",
    zorunluAlanlar: ["ogrenci.adSoyad", "ogrenci.dogumTarihi", "ogrenci.mezuniyetAyYil", "ogrenci.okulSehir", "ogrenci.diploma", "ogrenci.apSinavlari", "basvuru.donem", "basvuru.yil"],
    neZaman: "Hemen (11. sınıfın güz dönemi). Resmi takvime bağlı değildir; üniversiteye giden T1 ile aynı hafta gönderilebilir.",
    dayanak: [
      "https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/tr/",
      "https://anabin.kmk.org"
    ],
    guncelleme: "2026-10-12"
  },

  {
    id: "de-uni-yks-gec-teslim",
    baslik: "Alman üniversitesine: YKS yerleştirme sonucunu son tarihten sonra teslim",
    amac: "anabin TUR-BV05'e göre giriş hakkı YKS yerleştirmesine bağlı. Yerleştirme sonuçları Alman başvuru son tarihinden sonra çıkabilir; üniversitenin sonucu sonradan kabul edip etmediğini ve başvuru kanalını (doğrudan / uni-assist / VPD) öğrenmek için.",
    ulke: "de",
    kararNotu: null,
    alici: {
      tur: "universite",
      kurum: null,
      eposta: null,
      iletisimSayfasi: null,
      kaynak: null,
      not: "Seçilen üniversitenin uluslararası öğrenci kabul birimi. Doğrulanmış adresler alici.secenekler içinde.",
      secenekler: [] // dosya sonundaki DE_SECENEKLER ile doldurulur
    },
    dil: "en",
    konu: "Late submission of YKS {{basvuru.yil}} placement results – {{program.ad}}, {{basvuru.donem}}",
    govde:
      "Dear Admissions Team,\n\n" +
      "My name is {{ogrenci.adSoyad}}. I will graduate in {{ogrenci.mezuniyetAyYil}} from {{ogrenci.okul}}, a 12-year general secondary school in {{ogrenci.okulSehir}}, Turkey, with a {{ogrenci.diploma}}. According to anabin (case group TUR-BV05), my entrance qualification will depend on my YKS {{basvuru.yil}} score and on placement in a four-year Lisans programme. I would like to apply to the {{program.ad}} programme at {{universite.ad}} for the {{basvuru.donem}}.\n\n" +
      "The official YKS placement results (\"Yerleştirme Sonuçları\") may be published after your application deadline. Could you please tell me:\n\n" +
      "1. Can I apply by the deadline with my diploma and YKS score report and submit the placement result later? If so, what is the latest date for submitting it?\n" +
      "2. If late submission is not possible, can I apply for the next possible intake with the same documents?\n" +
      "3. Should I apply directly to the university, through uni-assist, or with a uni-assist VPD?\n\n" +
      "Thank you for your help.\n\n" +
      "Kind regards,\n" +
      "{{ogrenci.adSoyad}}\n" +
      "Date of birth: {{ogrenci.dogumTarihi}}",
    zorunluAlanlar: ["ogrenci.adSoyad", "ogrenci.dogumTarihi", "ogrenci.mezuniyetAyYil", "ogrenci.okul", "ogrenci.okulSehir", "ogrenci.diploma", "program.ad", "universite.ad", "basvuru.donem", "basvuru.yil"],
    neZaman: "Son sınıfın güz döneminde (Ekim–Aralık), hedef program kesinleşince ve başvuru penceresi açılmadan önce. Programların son tarihleri üniversiteye göre değişir; mezuniyet yılına ait ÖSYM yerleştirme tarihi: Yayımlanmadı (ÖSYM yıllık takvimi genellikle bir önceki yılın Kasım ayında açıklar). Son dört yılda yerleştirme sonuçları 13–25 Ağustos arasında açıklandı (2023: 19 Ağustos, 2024: 13 Ağustos, 2025: 25 Ağustos, 2026: 18 Ağustos).",
    dayanak: [
      "https://anabin.kmk.org",
      "https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/tr/"
    ],
    guncelleme: "2026-10-12"
  },

  // ---------------------------------------------------------------- İTALYA
  {
    id: "it-polimi-erken-giris",
    baslik: "Politecnico di Milano: 11. sınıfta CEnT-S ile erken giriş ve İngilizce programlar",
    amac: "PoliMi'nin 11. sınıf (sondan bir önceki yıl) erken giriş penceresinin bir sonraki çağrıda sürüp sürmediğini, İngilizce programlarda 'specific rankings'in nasıl işlediğini ve AP'nin bir avantaj sağlayıp sağlamadığını öğrenmek için (karar notu T3). Yalnızca 11. sınıftaki öğrenci gönderir.",
    ulke: "it",
    siniflar: ["11"],
    kararNotu: null,
    alici: {
      tur: "kurum",
      kurum: "Politecnico di Milano – International Students Office",
      eposta: null,
      iletisimSayfasi: "https://www.polimi.it/en/prospective-students/contacts/contacts-for-international-prospective-students",
      kaynak: "https://www.polimi.it/en/prospective-students/contacts/contacts-for-international-prospective-students",
      not: "Resmi sayfada e-posta adresi yok; 'Send a message' seçeneği kullanılır. Canlı sohbet yalnızca PoliMi hesabı olanlara açık (Pazartesi 9:30–12:30, Perşembe 13:30–16:00)."
    },
    dil: "en",
    konu: "Early entry for English-taught Engineering BSc – penultimate-year student (non-EU, Turkey)",
    govde:
      "Dear Admissions Office,\n\n" +
      "My name is {{ogrenci.adSoyad}}. I am a non-EU student living in Turkey and currently in {{ogrenci.sinif}}, the penultimate year of high school, at {{ogrenci.okul}} in {{ogrenci.okulSehir}}. I will graduate in {{ogrenci.mezuniyetAyYil}} with a {{ogrenci.diploma}} and plan to enrol in an English-taught Engineering BSc at Politecnico di Milano in the {{basvuru.donem}}.\n\n" +
      "1. Will the next call for admission again allow penultimate-year candidates to use a CEnT-S taken during their penultimate year (converted score of 75/100 or higher)? Does this early route apply to English-taught programmes, or only to programmes taught in Italian?\n" +
      "2. For English-taught programmes, how do the \"specific rankings\" work? Does a converted score of 75/100 or higher guarantee a place, and do non-EU (visa) candidates have a separate quota and calendar?\n" +
      "3. Do AP exams ({{ogrenci.apSinavlari}}) give any advantage in admission or credit recognition for holders of a Turkish diploma?\n\n" +
      "Thank you for your help.\n\n" +
      "Kind regards,\n" +
      "{{ogrenci.adSoyad}}",
    zorunluAlanlar: ["ogrenci.adSoyad", "ogrenci.sinif", "ogrenci.okul", "ogrenci.okulSehir", "ogrenci.mezuniyetAyYil", "ogrenci.diploma", "ogrenci.apSinavlari", "basvuru.donem"],
    neZaman: "11. sınıfın Ekim–Kasım ayında, CEnT-S kaydından önce. 2026-27 çağrısı 19 Kasım 2025'te yayımlanmıştı; bir sonraki çağrı yayımlanmadı, Kasım 2026'da bekleniyor. İlk makro dönem CEnT-S oturumları (Padova sayfasına göre) 26 Kasım ve 17 Aralık 2026.",
    dayanak: [
      "https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf",
      "https://www.polimi.it/en/prospective-students/how-to-apply/admission-to-laurea-programmes/engineering/when-to-enrol/you-take-a-test-when-you-are-in-the-penultimate-year"
    ],
    guncelleme: "2026-10-12"
  },

  {
    id: "it-polito-tili-takvim",
    baslik: "Politecnico di Torino: TIL-I uygunluğu ve AB dışı oturum takvimi",
    amac: "PoliTo'da TIL-I'ye yalnızca son sınıf öğrencisi ya da mezun kayıt olabiliyor; vize gerektiren adayların oturumları erken bitiyor (2026/27'de son oturum 22 Mayıs 2026). Mezuniyet yılındaki AB dışı oturumları, YKS şartının içeriğini ve garantili kabulde yerin ne kadar süre tutulduğunu öğrenmek için.",
    ulke: "it",
    kararNotu: null,
    alici: {
      tur: "kurum",
      kurum: "Politecnico di Torino – Admissions for international students",
      eposta: null,
      iletisimSayfasi: "https://sid.polito.it/ticket/online/guest",
      kaynak: "https://www.polito.it/en/contact-us/contacts-for-students-and-graduates",
      not: "Resmi sayfa kabul birimi için e-posta adresi vermiyor; kayıtsız kullanıcılar 'Guest' ticket formunu kullanır. APPLY hesabı açıldıktan sonra ticket hesap içinden de açılabilir."
    },
    dil: "en",
    konu: "TIL-I eligibility and non-EU test calendar – {{ogrenci.diploma}}, {{basvuru.donem}}",
    govde:
      "Dear Admissions Office,\n\n" +
      "My name is {{ogrenci.adSoyad}}. I am a Turkish citizen living in Turkey and will graduate in {{ogrenci.mezuniyetAyYil}} from {{ogrenci.okul}} in {{ogrenci.okulSehir}} with a {{ogrenci.diploma}} (12 years of schooling). I do not hold a US High School Diploma. I would like to enrol in the {{program.ad}} programme at Politecnico di Torino in the {{basvuru.donem}} as a non-EU applicant who needs a study visa.\n\n" +
      "1. From when can I register for the TIL-I during my final year of high school, and which test sessions will be available to non-EU (visa) applicants for the {{basvuru.donem}}?\n" +
      "2. As a holder of a Turkish diploma, I understand that I must submit my YKS result. Is passing the YKS {{basvuru.yil}} sufficient, or is a minimum score required?\n" +
      "3. If I reach the score for guaranteed admission, how long is my place reserved, and how does this fit with the Universitaly pre-enrolment and the visa application deadline?\n\n" +
      "Thank you for your help.\n\n" +
      "Kind regards,\n" +
      "{{ogrenci.adSoyad}}\n" +
      "Date of birth: {{ogrenci.dogumTarihi}}",
    zorunluAlanlar: ["ogrenci.adSoyad", "ogrenci.dogumTarihi", "ogrenci.mezuniyetAyYil", "ogrenci.okul", "ogrenci.okulSehir", "ogrenci.diploma", "program.ad", "basvuru.donem", "basvuru.yil"],
    neZaman: "Son sınıfın Ekim–Kasım ayında, çağrı yayımlanmadan önce ya da yayımlandıktan hemen sonra. 2026-27 çağrısı Aralık 2025'te yayımlandı; AB dışı adaylar için kayıtlar 27 Ocak 2026'da açıldı, oturumlar 19 Şubat–22 Mayıs 2026 arasındaydı. Mezuniyet yılına ait takvim yayımlanmadı (çağrılar her yıl Aralık'ta).",
    dayanak: [
      "https://www.polito.it/sites/default/files/2025-12/Call%20for%20applications%20for%20admissions%20Engineering%20_%20LP%202026-27.pdf"
    ],
    guncelleme: "2026-10-12"
  },

  {
    id: "it-uni-cents-gecerlilik",
    baslik: "İtalyan üniversitesine: CEnT-S geçerlilik dönemi ve AB dışı kontenjan (Padova / Sapienza)",
    amac: "CISIA kuralına göre bir CEnT-S sezonu yalnızca bir sonraki akademik yılın kaydında geçerli. Hangi oturumların mezuniyet yılındaki kayıt için sayılacağını, AB dışı kontenjanın sıralamasını ve AB dışı başvuru penceresini üniversiteden yazılı olarak öğrenmek için.",
    ulke: "it",
    kararNotu: null,
    alici: {
      tur: "universite",
      kurum: null,
      eposta: null,
      iletisimSayfasi: null,
      kaynak: null,
      not: "Seçilen üniversiteye gönderilir. Padova ve Sapienza için doğrulanmış kanallar alici.secenekler içinde. PoliMi için 'it-polimi-erken-giris' şablonunu kullan.",
      secenekler: [
        {
          universiteId: "it-padova",
          kurum: "Università degli Studi di Padova – Global Engagement Office",
          eposta: null,
          iletisimSayfasi: "https://web.unipd.it/international",
          kaynak: "https://www.unipd.it/en/ammissione-studenti-internazionali",
          not: "Resmi sayfada 'For general information: get in touch with us' bağlantısı. Kabul için ayrı bir e-posta adresi yayımlanmıyor."
        },
        {
          universiteId: "it-sapienza",
          kurum: "Sapienza Università di Roma – HELLO International Student Help Desk",
          eposta: "hello@uniroma1.it",
          iletisimSayfasi: "https://www.uniroma1.it/en/pagina/hello-international-student-help-desk-0",
          kaynak: "https://www.uniroma1.it/en/pagina/hello-international-student-help-desk-0",
          not: "Adres resmi HELLO sayfasında açıkça yazıyor; kabul prosedürleri konusunda yardım veriyor."
        }
      ]
    },
    dil: "en",
    konu: "CEnT-S validity and non-EU places – {{program.ad}}, {{basvuru.donem}}",
    govde:
      "Dear Admissions Office,\n\n" +
      "My name is {{ogrenci.adSoyad}}. I am a non-EU applicant living in Turkey and will graduate in {{ogrenci.mezuniyetAyYil}} from {{ogrenci.okul}} in {{ogrenci.okulSehir}} with a {{ogrenci.diploma}}. I plan to apply to the {{program.ad}} programme at {{universite.ad}} for the {{basvuru.donem}}.\n\n" +
      "1. Which admission test is required for this programme (CEnT-S or another CISIA test), and which test sessions will be valid for enrolment in the {{basvuru.donem}}? Would a test taken in the academic year before my final year of high school also be accepted?\n" +
      "2. Is there a minimum score for non-EU applicants, and how is the ranking for the places reserved for non-EU candidates residing abroad calculated?\n" +
      "3. When do you expect to publish the call for non-EU applicants for the {{basvuru.donem}}, and will the application window again be between January and March?\n\n" +
      "Thank you for your help.\n\n" +
      "Kind regards,\n" +
      "{{ogrenci.adSoyad}}",
    zorunluAlanlar: ["ogrenci.adSoyad", "ogrenci.mezuniyetAyYil", "ogrenci.okul", "ogrenci.okulSehir", "ogrenci.diploma", "program.ad", "universite.ad", "basvuru.donem"],
    neZaman: "Son sınıfın başında (Eylül–Ekim), CEnT-S'nin ilk makro dönemi Kasım'da başlamadan önce. Padova'nın 2027/28 AB dışı başvuru penceresi 7 Ocak–7 Mart 2027; mezuniyet yılına ait pencere yayımlanmadı (2027 sonbaharında bekleniyor).",
    dayanak: [
      "https://guide.cisiaonline.it/en/node/206",
      "https://apply.unipd.it/courses/course/182",
      "https://www.uniroma1.it/en/pagina/restricted-access-degree-programmes-tolc-i-and-selections"
    ],
    guncelleme: "2026-10-12"
  },

  {
    id: "it-uni-cimea-dov",
    baslik: "İtalyan üniversitesine: CIMEA belgesi mi, Dichiarazione di valore mi?",
    amac: "MUR genelgesine göre üniversite, 12 yıllık diplomaya ek olarak CIMEA karşılaştırılabilirlik belgesi ya da Dichiarazione di valore isteyebilir; hangisini, ne zaman ve YKS belgesiyle birlikte isteyeceğine üniversite karar verir. CIMEA bireylerden e-posta ile soru kabul etmediği için soru üniversiteye sorulur.",
    ulke: "it",
    kararNotu: null,
    alici: {
      tur: "universite",
      kurum: null,
      eposta: null,
      iletisimSayfasi: null,
      kaynak: null,
      not: "Seçilen üniversitenin uluslararası kabul birimi. CIMEA'nın info@cimea.it adresi yalnızca kurumlar için; bireylerin soruları değerlendirilmiyor (https://www.cimea.it/EN/pagina-contatti).",
      secenekler: [
        {
          universiteId: "it-polito",
          kurum: "Politecnico di Torino – Admissions for international students",
          eposta: null,
          iletisimSayfasi: "https://sid.polito.it/ticket/online/guest",
          kaynak: "https://www.polito.it/en/contact-us/contacts-for-students-and-graduates"
        },
        {
          universiteId: "it-polimi",
          kurum: "Politecnico di Milano – International Students Office",
          eposta: null,
          iletisimSayfasi: "https://www.polimi.it/en/prospective-students/contacts/contacts-for-international-prospective-students",
          kaynak: "https://www.polimi.it/en/prospective-students/contacts/contacts-for-international-prospective-students"
        },
        {
          universiteId: "it-sapienza",
          kurum: "Sapienza Università di Roma – HELLO International Student Help Desk",
          eposta: "hello@uniroma1.it",
          iletisimSayfasi: "https://www.uniroma1.it/en/pagina/hello-international-student-help-desk-0",
          kaynak: "https://www.uniroma1.it/en/pagina/hello-international-student-help-desk-0"
        },
        {
          universiteId: "it-padova",
          kurum: "Università degli Studi di Padova – Global Engagement Office",
          eposta: null,
          iletisimSayfasi: "https://web.unipd.it/international",
          kaynak: "https://www.unipd.it/en/ammissione-studenti-internazionali"
        }
      ]
    },
    dil: "en",
    konu: "Recognition document for a {{ogrenci.diploma}} – CIMEA statement or Dichiarazione di valore ({{basvuru.donem}})",
    govde:
      "Dear Admissions Office,\n\n" +
      "My name is {{ogrenci.adSoyad}}. I will graduate in {{ogrenci.mezuniyetAyYil}} from {{ogrenci.okul}} in {{ogrenci.okulSehir}}, Turkey, with a {{ogrenci.diploma}} (12 years of schooling: 8 years of compulsory education and 4 years of high school). I am a non-EU applicant and plan to enrol in the {{program.ad}} programme at {{universite.ad}} in the {{basvuru.donem}}.\n\n" +
      "1. For this diploma, do you require a CIMEA statement of comparability, a Dichiarazione di valore issued by the Italian Consulate, or will you accept either of the two?\n" +
      "2. Must this document be uploaded with the application, or can it be submitted after admission (for example, together with the visa application)?\n" +
      "3. Must my YKS {{basvuru.yil}} result certificate also be apostilled and translated, and should it be covered by the same recognition document?\n\n" +
      "Thank you for your help.\n\n" +
      "Kind regards,\n" +
      "{{ogrenci.adSoyad}}\n" +
      "Date of birth: {{ogrenci.dogumTarihi}}",
    zorunluAlanlar: ["ogrenci.adSoyad", "ogrenci.dogumTarihi", "ogrenci.mezuniyetAyYil", "ogrenci.okul", "ogrenci.okulSehir", "ogrenci.diploma", "program.ad", "universite.ad", "basvuru.donem", "basvuru.yil"],
    neZaman: "Son sınıfın Ekim–Aralık döneminde, hedef üniversiteler kesinleşince. CIMEA Statement of Comparability: belge başına 150 € (KDV dahil), normal işlem 60 iş günü; 100 € ek ücretle acil işlem 30 iş günü (acil seçenek yalnızca başvuru sırasında seçilebilir). Statement of Verification 300 €, yalnızca normal işlem. Vize başvuru son tarihi 2027/28 için 31 Ekim 2027; mezuniyet yılına ait tarih yeni MUR genelgesiyle belirlenecek (yayımlanmadı).",
    dayanak: [
      "https://www.unife.it/it/internazionale/venire/iscriversi/informazioni/circolare_2026-2027_studenti_internazionali.pdf",
      "https://www.cimea.it/EN/pagina-contatti"
    ],
    guncelleme: "2026-10-12"
  },

  {
    id: "it-konsolosluk-dov",
    baslik: "İtalya İstanbul Başkonsolosluğu: Türk lise diploması için Dichiarazione di valore",
    amac: "Başkonsolosluk, DoV'u kabul sonrası vize başvurusuyla birlikte ya da 'con riserva' kabulde Prenot@Mi randevusuyla düzenliyor; tüm belgeler apostilli ve aslıyla isteniyor. Hangi belgelerin (diploma, transkript, YKS belgesi) gerektiğini ve sürenin vize son tarihine yetişip yetişmeyeceğini öğrenmek için.",
    ulke: "it",
    kararNotu: null,
    alici: {
      tur: "kurum",
      kurum: "Consolato Generale d'Italia a Istanbul",
      eposta: "consolatogenerale.istanbul@esteri.it",
      iletisimSayfasi: "https://consistanbul.esteri.it/it/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/studiare-in-italia/universita/laurea-triennale-e-laurea-magistrale-a-ciclo-unico/",
      kaynak: "https://consistanbul.esteri.it/it/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/studiare-in-italia/universita/laurea-triennale-e-laurea-magistrale-a-ciclo-unico/",
      not: "Adres Başkonsolosluk sayfasının 'Recapiti e Contatti' bölümünde açıkça yazıyor. Sayfaya göre başka konsolosluk bölgesinde verilen diplomalar için DoV, yetkili İtalyan temsilciliğinden alınmalı; okul İstanbul dışındaysa yetkili temsilciliği (İstanbul Başkonsolosluğu, İzmir Konsolosluğu ya da Ankara Büyükelçiliği) Başkonsolosluğa e-postayla sor; okul İstanbul'daysa bu soru gerekmez."
    },
    dil: "en",
    konu: "Dichiarazione di valore for a {{ogrenci.diploma}} – bachelor's enrolment, {{basvuru.donem}}",
    govde:
      "Dear Sir or Madam,\n\n" +
      "My name is {{ogrenci.adSoyad}} (date of birth: {{ogrenci.dogumTarihi}}). I will graduate in {{ogrenci.mezuniyetAyYil}} from {{ogrenci.okul}} in {{ogrenci.okulSehir}} with a {{ogrenci.diploma}}, and I plan to enrol in a bachelor's degree programme at an Italian university in the {{basvuru.donem}}. I have read the information on your website about bachelor's enrolment and the Dichiarazione di valore.\n\n" +
      "1. Which documents are required for a Dichiarazione di valore for a Turkish high school diploma: the diploma, the transcript and the YKS result certificate? Must all of them be apostilled and translated into Italian?\n" +
      "2. If a university admits me \"con riserva\" and asks for the Dichiarazione di valore before final admission, how long does the procedure usually take after the appointment booked on Prenot@Mi?\n" +
      "3. Since my diploma will be issued in {{ogrenci.mezuniyetAyYil}}, when do you recommend booking the appointment so that the visa application can be submitted before the deadline?\n\n" +
      "Thank you for your help.\n\n" +
      "Kind regards,\n" +
      "{{ogrenci.adSoyad}}",
    zorunluAlanlar: ["ogrenci.adSoyad", "ogrenci.dogumTarihi", "ogrenci.mezuniyetAyYil", "ogrenci.okul", "ogrenci.okulSehir", "ogrenci.diploma", "basvuru.donem"],
    neZaman: "Son sınıfın Ocak–Mart döneminde, ilk kabul yanıtları gelmeden önce. Vize son tarihi 2026/27 için 30 Kasım 2026, 2027/28 için 31 Ekim 2027 idi; mezuniyet yılına ait MUR genelgesi henüz yayımlanmadı (beklenen: 2028 ilkbaharı).",
    dayanak: [
      "https://consistanbul.esteri.it/it/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/studiare-in-italia/universita/laurea-triennale-e-laurea-magistrale-a-ciclo-unico/",
      "https://www.unife.it/it/internazionale/venire/iscriversi/informazioni/circolare_2026-2027_studenti_internazionali.pdf"
    ],
    guncelleme: "2026-10-12"
  },

  {
    id: "it-dsu-turkiye-belgeleri",
    baslik: "Bölgesel DSU bursu: Türkiye'den gereken gelir ve aile belgeleri",
    amac: "Ailesi yurt dışında yaşayan öğrencinin DSU bursu için ISEE parificato (ya da bölgenin kendi hesapladığı eşdeğer gösterge) gerekiyor. Türkiye'den hangi belgelerin, hangi yıla ait, apostil mi konsolosluk tasdiki mi ile ve ne zamana kadar istendiğini bölge kurumundan öğrenmek için. Kurallar bölgeye göre değişir (ör. EDISU Piemonte 2023/24'ten itibaren hesabı anlaşmalı CAF'larla kendisi yapıyor).",
    ulke: "it",
    kararNotu: null,
    alici: {
      tur: "kurum",
      kurum: null,
      eposta: null,
      iletisimSayfasi: null,
      kaynak: null,
      not: "Alıcı üniversitenin bölgesine göre değişir; seçilen üniversiteye göre alici.secenekler kullanılır. Lazio DiSCo (Sapienza, Tor Vergata, Campus Bio-Medico): resmi kanal laziodisco.it kişisel alanındaki 'Service Tickets' (çağrı Madde: ticket, yardımcı iletişim aracıdır; başvuru işlemlerinin yerine geçmez). Padova: DSU bursunu ESU değil üniversite yönetir (Ufficio Servizi agli studenti – Benefici economici, benefici.studenti@unipd.it, 049 827 3131).",
      secenekler: [
        {
          universiteId: "it-polito",
          kurum: "EDISU Piemonte",
          eposta: null,
          iletisimSayfasi: "https://clio.edisu-piemonte.it/ticket.aspx",
          kaynak: "https://www.edisu.piemonte.it/en/info-and-assistance",
          not: "Burs, konaklama ve diğer hizmetler için ticket sistemi. Açık e-posta adresi (webredazione@...) yalnızca web sitesi hataları için."
        },
        {
          universiteId: "it-polimi",
          kurum: "Politecnico di Milano – DSU (Diritto allo studio universitario)",
          eposta: null,
          iletisimSayfasi: "https://aunicalogin.polimi.it/aunicalogin/getservizio.xml?id_servizio=1661&lang=EN",
          kaynak: "https://www.polimi.it/en/students/tuition-fees-scholarships-and-financial-aid/university-financial-aid-diritto-allo-studio-universitario-dsu",
          not: "Form PoliMi Online Services girişi istiyor (başvuru sırasında açılan hesapla). Lombardiya'da DSU'yu üniversite yürütür."
        }
      ]
    },
    dil: "en",
    konu: "DSU scholarship, {{basvuru.donem}} – documents required from a family resident in Turkey",
    govde:
      "Dear Sir or Madam,\n\n" +
      "My name is {{ogrenci.adSoyad}}. I am a Turkish citizen and will graduate in {{ogrenci.mezuniyetAyYil}} from a high school in {{ogrenci.okulSehir}}, Turkey. I plan to enrol in the {{program.ad}} programme at {{universite.ad}} in the {{basvuru.donem}} and to apply for the regional right-to-study (DSU) scholarship. My whole family lives in Turkey and earns its income there.\n\n" +
      "1. Which documents from Turkey are required to assess my family's economic situation (for example, for the ISEE parificato): family composition, income for which year, real estate and bank balances?\n" +
      "2. Must these documents be legalised by the Italian Consulate in Turkey, or is an apostille sufficient? Must they be translated into Italian, and if so, by whom?\n" +
      "3. By which date must the documents be submitted, and can I submit them before I arrive in Italy?\n\n" +
      "Thank you for your help.\n\n" +
      "Kind regards,\n" +
      "{{ogrenci.adSoyad}}\n" +
      "Date of birth: {{ogrenci.dogumTarihi}}",
    zorunluAlanlar: ["ogrenci.adSoyad", "ogrenci.dogumTarihi", "ogrenci.mezuniyetAyYil", "ogrenci.okulSehir", "program.ad", "universite.ad", "basvuru.donem"],
    neZaman: "Son sınıfın Şubat–Mart döneminde. Türkiye'den belge toplamak ve tasdik ettirmek haftalar sürer; DSU çağrıları genellikle Haziran–Temmuz'da yayımlanır ve son tarihler bölgeye göre değişir (2026/27: PoliMi 5 Ağustos, DiSCo 11 Ağustos, EDISU 4 Eylül, Padova 30 Eylül 2026); mezuniyet yılının çağrıları yayımlanmadı.",
    dayanak: [
      "https://www.edisu.piemonte.it/en/news/notizie-ed-eventi/support-and-ticketing-service",
      "https://www.polimi.it/en/students/tuition-fees-scholarships-and-financial-aid/university-financial-aid-diritto-allo-studio-universitario-dsu"
    ],
    guncelleme: "2026-10-12"
  }
];

// Almanya: üniversiteye giden şablonlar için doğrulanmış uluslararası kabul kanalları
// (data/mevzuat/ulkeler.js kimlikleri; erişim 12 Ekim 2026). "mailto bağlantısında" notu: adres sayfada
// metin olarak değil, gizlenmiş e-posta bağlantısı olarak duruyor.
(function () {
  var DE_SECENEKLER = [
    { universiteId: "de-saarland", kurum: "Saarland University – Studierendensekretariat", eposta: "studium@uni-saarland.de", iletisimSayfasi: "https://www.uni-saarland.de/en/studies/international/contact.html", kaynak: "https://www.uni-saarland.de/studieren/sekretariat.html", not: "Genel kabul birimi; adres sayfada studium(at)uni-saarland.de olarak yazıyor." },
    { universiteId: "de-fau", kurum: "FAU Erlangen-Nürnberg – Zulassungsstelle International", eposta: "zulassungsstelle-international@fau.de", iletisimSayfasi: "https://www.fau.eu/education/international/from-abroad/contact/", kaynak: "https://www.fau.eu/education/international/from-abroad/contact/", not: "Yabancı okul belgesiyle başvuranlar için." },
    { universiteId: "de-dit", kurum: "Deggendorf Institute of Technology – Welcome", eposta: "welcome@th-deg.de", iletisimSayfasi: "https://th-deg.de/en/apply", kaynak: "https://th-deg.de/en/apply", not: "Başvuru öncesi sorular için (bewerbung@ başvuru yapmış olanlar için)." },
    { universiteId: "de-rosenheim", kurum: "TH Rosenheim – Welcome Service", eposta: "welcome@th-rosenheim.de", iletisimSayfasi: "https://www.th-rosenheim.de/en/international/international-office", kaynak: "https://www.th-rosenheim.de/en/international/international-office", not: "Uluslararası tam zamanlı öğrenciler için karşılama servisi." },
    { universiteId: "de-tuhh", kurum: "TUHH – Study programmes, admission and application", eposta: "study@tuhh.de", iletisimSayfasi: "https://www.tuhh.de/tuhh/en/contact", kaynak: "https://www.tuhh.de/tuhh/en/contact", not: "Adres sayfada study[at]tuhh.de olarak yazıyor." },
    { universiteId: "de-hsrw", kurum: "Hochschule Rhein-Waal – Study Advisory Service", eposta: "study@hochschule-rhein-waal.de", iletisimSayfasi: "https://www.hochschule-rhein-waal.de/en/study/advising-services/study-advisory-service/contact-details-and-service-hours-zsb", kaynak: "https://www.hochschule-rhein-waal.de/en/study/advising-services/study-advisory-service/contact-details-and-service-hours-zsb", not: "Yabancı belgeli başvurular uni-assist üzerinden." },
    { universiteId: "de-hshl", kurum: "Hochschule Hamm-Lippstadt – International Office", eposta: "internationaloffice@hshl.de", iletisimSayfasi: "https://www.hshl.de/en/international-office/", kaynak: "https://www.hshl.de/en/international-office/", not: "Genel uluslararası ofis; ayrı bir kabul adresi gösterilmiyor." },
    { universiteId: "de-kit", kurum: "KIT – Carl Benz School of Engineering (Admissions)", eposta: "admissions@carlbenzschool.kit.edu", iletisimSayfasi: "https://www.carlbenzschool.kit.edu/admission-requirements.php", kaynak: "https://www.carlbenzschool.kit.edu/admission-requirements.php", not: "Mechanical Engineering (International) başvuru soruları için. Adres CBS kabul şartları sayfasındaki mailto bağlantısında; genel adres info@carlbenzschool.kit.edu. KIT genel ofisi (IStO) yalnızca iletişim formu kullanıyor: https://www.intl.kit.edu/kontakt.php" },
    { universiteId: "de-tum", kurum: "TUM – Student Advising and Information Services", eposta: "studium@tum.de", iletisimSayfasi: "https://www.tum.de/en/studies/international-students/application-and-admission", kaynak: "https://www.tum.de/en/studies/international-students/application-and-admission", not: "Adres sayfadaki mailto bağlantısında." },
    { universiteId: "de-thws", kurum: "THWS International – degree-seeking students", eposta: "degreeseeker@thws.de", iletisimSayfasi: "https://international.thws.de/en/thws-international/ways-to-thws/study-programmes-at-thws/all-degree-programmes/robotics/", kaynak: "https://international.thws.de/en/thws-international/ways-to-thws/study-programmes-at-thws/all-degree-programmes/robotics/", not: "Adres Robotics program sayfasında degreeseeker[at]thws.de olarak yazıyor. Programa özel akademik sorular için program sorumlusu: marian.daun@thws.de. International Office genel adresi: welcome@thws.de (SSS sayfası)." },
    { universiteId: "de-schmalkalden", kurum: "Hochschule Schmalkalden – Student Service Zone", eposta: "ssz@hs-schmalkalden.de", iletisimSayfasi: "https://www.hs-schmalkalden.de/en/application/international-applicants", kaynak: "https://www.hs-schmalkalden.de/en/application/international-applicants", not: "Adres sayfadaki mailto bağlantısında; genel öğrenci servisi." },
    { universiteId: "de-ude", kurum: "Universität Duisburg-Essen – International admissions", eposta: "international@uni-due.de", iletisimSayfasi: "https://www.uni-due.de/studierendensekretariat/kontakt_zulassung_international.shtml", kaynak: "https://www.uni-due.de/international/bewerbung.php", not: "AB dışı adaylar için; lisans başvurusu önce uni-assist'e." },
    { universiteId: "de-constructor", kurum: "Constructor University – Undergraduate admissions", eposta: "study@constructor.university", iletisimSayfasi: "https://constructor.university/programs/undergraduate-education/contact-support", kaynak: "https://constructor.university/programs/undergraduate-education/contact-support", not: "Genel sorular için." }
  ];
  (window.APMEBERRA_EPOSTA_SABLONLARI || []).forEach(function (s) {
    if (s.ulke === "de" && s.alici && s.alici.tur === "universite") s.alici.secenekler = DE_SECENEKLER.slice();
  });
})();
