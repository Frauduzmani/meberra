// AP MEBERRA — Hedef ülkeler, kabul yolları ve İngilizce lisans programları (Tur 5, spec §5.1)
// Hazırlayan: Ajan 2 Dr. Marcus Weber & Elena Rossi (+ Ajan 3 Canan Yılmaz). Doğrulama tarihi: 12 Ekim 2026.
// KURAL (AGENTS.md §2.1): Her bilgi resmi kaynak URL'si taşır. Tahmin yazılmaz. Etiketler (spec §10): "Yayımlanmadı" (resmi belge henüz çıkmadı; son yılın bilgisiyle),
// "Teyit gerekir" (yalnızca kurum cevaplayabilir), "Yoruma açık" (kaynaklar çelişiyor), "Doğrulanamadı" (hiçbir resmi iz yok).
// Not: 2026/27'de 11. sınıfta olan öğrenci 2027-28'de 12. sınıfta olacak ve en erken 2028/29 öğretim yılında (Eylül/Ekim 2028) başlayacak.
// Aşağıdaki tarihlerin çoğu 2026/27 ya da 2027/28 döngüsüne aittir; 2028/29 çağrıları yayımlanınca yeniden kontrol edilmelidir.
window.APMEBERRA_ULKELER = [
  {
    id: "de",
    ad: "Almanya",
    ozet: "Almanya'da devlet üniversitelerinin çoğu harçsızdır; Bavyera ve Baden-Württemberg ise AB dışı öğrencilerden harç ya da hizmet ücreti alır. KMK'nın AP kuralı (anabin USA-BV07) yalnızca ABD lise diploması ile birlikte uygulanır; Türk diploması + AP için anabin'de kural yok (Doğrulandı). Türk lise diplomasıyla giriş hakkı: YKS'de ilgili puan türünde 180'in üzerinde puan ve en az 4 yıllık örgün bir lisans programına yerleşme; bu, yalnızca yerleşilen alan ve komşu alanlar için doğrudan giriş verir (anabin TUR-BV05). Yerleşme yoksa Studienkolleg yolu da yoktur. Bu bilgi Almanya rotası içindir: Almanya rotasında YKS'de hedef alanda 4 yıllık bir lisans programına yerleşmek zorunlu adımdır. İtalya ayrı ve bağımsız bir rotadır; adım adım takvim Rotam sayfasındadır.",
    kabulYolu: [
      {
        baslik: "KMK/DAAD AP kuralı (ABD High School Diploma sahipleri için)",
        detay: "anabin USA-BV07 (https://anabin.kmk.org): Matematik, tıp, doğa bilimleri, eczacılık ve mühendislik alanında alana bağlı giriş için ABD High School Diploma ile birlikte 4 AP sınavı gerekir; her birinden en az 3 alınmalıdır: (1) Calculus AB veya BC; (2) bir doğa bilimi: Biology, Chemistry ya da Physics C: Mechanics + Physics C: E&M birlikte (Physics 1/2 sayılmaz); (3) bir dil: English Language, English Literature, French, Spanish, Latin ya da German; (4) lise üst kademesine uygun bir ek ders, ör. European/World/US History, Computer Science A ya da Macroeconomics + Microeconomics birlikte (her biri 0,5). AP belgesi tek başına giriş hakkı vermez; Türk diplomasına uygulanmaz. Güncel anabin kayıtlarında AP ile yalnızca alana bağlı giriş var (MINT için BV07, beşeri/sosyal bilimler için BV08); 5 AP ile genel giriş kuralı görünmüyor. GPA 3.0 şartı yalnızca HSD + Studienkolleg (BV01) kuralında var. Yoruma açık: DAAD'ın Ocak 2024 kılavuzu (kaynak alanı) eski kuralı yansıtıyor olabilir.",
        kaynak: "https://anabin.kmk.org"
      },
      {
        baslik: "Türk lise diploması için resmi durum",
        detay: "uni-assist Türk lise diploması için şu belgeleri istiyor: Lise Diploması ve YKS/ÖSYM 'Yerleştirme Sonuçları'. Bu belge bir Türk üniversitesine yerleştirildiğini, üniversite ve fakülte adını ve puan türünü göstermelidir. anabin TUR-BV05 (https://anabin.kmk.org): Lise Diploması + YKS'de ilgili puan türünde 180'in üzerinde puan (2020 için 170) + en az 4 yıllık örgün bir lisans programına yerleşme → yalnızca yerleşilen alan ve komşu alanlar için doğrudan giriş. Mühendislik için YKS'de mühendislik programına yerleşmek gerekir. Türk diploması + AP için anabin'de kural yok (Doğrulandı, 12 Ekim 2026). YKS + yerleşme yedek değil, anabin'deki tek resmi yoldur. Bir üniversitenin bireysel istisna tanıyıp tanımayacağı: Teyit gerekir. Bunu yalnızca üniversite yanıtlayabilir; resmi kaynaklarda genel bir kural yok (Yazışmalarım: de-uni-ap-yks-teyit şablonu). Türk üniversitesine kayıt yaptırmak şart değildir: uni-assist yerleştirme belgesini kayıttan bağımsız olarak ister.",
        kaynak: "https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/tr/"
      },
      {
        baslik: "DAAD kabul veri tabanı ile ön kontrol",
        detay: "DAAD, okul diplomasının Almanya'da tanınıp tanınmadığını ve alana özgü mü yoksa genel giriş mi sağladığını görmek için kabul şartları veri tabanının kullanılmasını öneriyor. Kesin karar her zaman yükseköğretim kurumunundur; o kurumun International Office'ine yazılmalı.",
        kaynak: "https://www.daad.de/en/studying-in-germany/requirements/overview/"
      },
      {
        baslik: "uni-assist ve VPD (Vorprüfungsdokumentation)",
        detay: "VPD, uni-assist'in hazırladığı bir belgedir. Sunulan diplomaları, uni-assist'in değerlendirmesini ve notun Alman sistemindeki karşılığını gösterir. VPD'yi yalnızca bazı üniversiteler ister. İşlem süresi genellikle başvurudan sonra 4–6 haftadır; belge düzenlendiği tarihten itibaren 1 yıl geçerlidir. Başvuru ücreti her dönem için ilk program 75 €, her ek program 30 €'dur; VPD için de aynı ücret uygulanır.",
        kaynak: "https://www.uni-assist.de/en/how-to-apply/plan-your-application/vpd/"
      },
      {
        baslik: "Studienkolleg ve Feststellungsprüfung (Türk genel lise mezunu için yedek yol değil)",
        detay: "Düzeltme (12 Ekim 2026): anabin'e göre 12 yıllık genel lise mezunu YKS'de bir lisans programına yerleşmezse Studienkolleg'e de giremez. Tek istisna: bir Meslek Yüksekokulunda 1 yıl okumak (TYT 150'nin üzerinde); bu da yalnızca Fachhochschule'lere açılan Studienkolleg yolunu verir (TUR-BV07). Genel bilgi: Studienkolleg iki dönemdir, sonunda Feststellungsprüfung'a girilir; kurslar Almanca olduğu için yaklaşık B1–B2 Almanca istenir; mühendislik için T-Kurs seçilir (https://www.daad.de/en/studying-in-germany/requirements/overview/).",
        kaynak: "https://anabin.kmk.org"
      }
    ],
    genelIsterler: [
      {
        baslik: "Diploma belgeleri ve yeminli tercüme",
        detay: "uni-assist yalnızca yeminli tercümanın yaptığı tercümeleri kabul eder; kaşede Türkçe 'yeminli tercüman' ibaresi bulunmalıdır. Teknik ya da imam hatip Anadolu liseleri ve açık öğretim lisesi mezunlarından ek belgeler istenir.",
        kaynak: "https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/tr/"
      },
      {
        baslik: "İngilizce dil belgesi (programa göre)",
        detay: "Eşikler programa göre değişir. TUHH: IELTS 6.5 / TOEFL iBT 90, kayıtta istenir. KIT: IELTS 6.5 (hiçbir bölüm 5.5'in altında olmamalı) / TOEFL 90. Schmalkalden: IELTS 6.5 / TOEFL 86. HSHL: IELTS 6.0 / TOEFL 80. Rosenheim: IELTS 6.0 / TOEFL 72. Her programın eşiği aşağıdaki üniversite kartında ve resmi sayfasında.",
        kaynak: "https://www.tuhh.de/tuhh/en/studying/before-studying/application/bachelor/language-proficiency"
      },
      {
        baslik: "Bazı İngilizce programlar Almanca da istiyor",
        detay: "DIT Artificial Intelligence mezuniyete kadar Almanca A2 ister; TH Rosenheim A2 ister; TUM Information Engineering başvuruda Almanca sertifika ister. Bu programları hedefleyen adayın planına Almanca A2–B1 hedefi eklenmeli.",
        kaynak: "https://th-deg.de/ain-b-en"
      },
      {
        baslik: "Öğrenci vizesi ve bloke hesap (Sperrkonto)",
        detay: "Öğrenim vizesi için bir yıllık finansman önceden kanıtlanmalı. Aylık tutar 992 €, yani yıllık 11.904 € (BAföG oranı). Türkiye temsilciliğinin bloke hesap bilgi notu (Merkblatt 25) hesap sağlayıcısının serbestçe seçilebildiğini söylüyor. Türkiye temsilciliğinin öğrenci bilgi notunda hâlâ eski tutar (853 €/ay) yazıyor. 2028 ve sonrasında başvuracak adaylar için tutar artmış olabilir; vize başvurusu öncesi yeniden kontrol edilmeli.",
        kaynak: "https://tiflis.diplo.de/ge-de/service/visum/2722272-2722272"
      },
      {
        baslik: "Bloke hesap prosedürü (Türkiye)",
        detay: "Almanya'nın Türkiye temsilcilikleri bloke hesap için ayrı bir bilgi notu yayımlıyor (Bilgi Notu/Merkblatt 25). Vize başvurusu öncesinde güncel tutar ve kabul edilen sağlayıcılar bu sayfadan kontrol edilmeli.",
        kaynak: "https://tuerkei.diplo.de/tr-de/service/05-visaeinreise/2621556-2621556"
      },
      {
        baslik: "Bavyera ve Baden-Württemberg'de harç",
        detay: "TUM: Kış 2027/28'den itibaren yeni kayıtlı AB dışı lisans öğrencileri için 2.300 € ya da 3.400 € (şu an genellikle dönem başına 2.000 ya da 3.000 €). KIT (Baden-Württemberg): AB dışı öğrencilerden dönem başına 1.500 €. FAU: AB dışı yeni kayıtlardan Yaz 2027'den itibaren dönem başına 1.000–6.000 €. DIT ve TH Rosenheim: dönem başına 500 €.",
        kaynak: "https://www.tum.de/en/studies/fees/tuition"
      }
    ],
    sinavlar: [
      "ap-calculus-ab", "ap-calculus-bc", "ap-physics-1", "ap-physics-c-mechanics", "ap-physics-c-em",
      "ap-chemistry", "ap-biology", "ap-english-language", "ap-computer-science-a",
      "ap-microeconomics", "ap-macroeconomics",
      "sat", "testas", "ielts-academic", "toefl-ibt"
    ],
    takvim: [
      { tarih: "2026-11-13", olay: "2027 AP sınav siparişi için son gün (23:59 ET). Bu tarihten sonra verilen siparişlere sınav başına 40 $ geç ücret eklenir.", kaynak: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/ordering-fees/exam-fees" },
      { tarih: "2026-11-26", olay: "TestAS sınav tarihi (KIT CBS ve Saarland'ın yetenek testi yolu için)", kaynak: "https://www.testas.de/en/" },
      { tarih: "2027-02-01", olay: "Constructor University 2027 girişi için Early Action başvurularının son günü (2026/27'de 11. sınıfta olanların giriş yılı 2028; aynı döngünün tekrar etmesi beklenir)", kaynak: "https://constructor.university/programs/undergraduate-education/computer-science" },
      { tarih: "2027-02-25", olay: "TestAS sınav tarihi", kaynak: "https://www.testas.de/en/" },
      { tarih: "2027-03-18", olay: "TestAS sınav tarihi", kaynak: "https://www.testas.de/en/" },
      { tarih: "2027-04-30", olay: "KIT Mechanical Engineering (International) 1. dönem başvuru son günü (yalnızca kış dönemi; resmi sayfa '30 Nisan' diyor)", kaynak: "https://www.sle.kit.edu/english/vorstudium/bachelor-mechanical-engineering-international.php" },
      { tarih: "2027-05-03", olay: "2027 AP sınav dönemi başlar (3–7 ve 10–14 Mayıs; geç sınav 17–21 Mayıs)", kaynak: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates" },
      { tarih: "2027-06-20", olay: "AP ücretsiz puan gönderimi için son gün (alıcı kurum My AP'de seçilir)", kaynak: "https://apstudents.collegeboard.org/sending-scores/free-score-send" },
      { tarih: "2027-07-15", olay: "Saarland, TUHH, HSRW ve TUM kış dönemi başvurularının son günü (2027/28 döngüsü; 2026/27'de 11. sınıfta olanlar için ilgili yıl 2028)", kaynak: "https://www.uni-saarland.de/en/study/programmes/bachelor/computer-science.html" }
    ],
    universiteler: [
      {
        id: "de-saarland",
        ad: "Saarland University (Universität des Saarlandes)",
        sehir: "Saarbrücken",
        web: "https://www.uni-saarland.de/en/study/programmes/bachelor/computer-science.html",
        programlar: [
          { ad: "Computer Science", derece: "B.Sc.", dil: "English", sure: "6 semestr", kaynak: "https://www.uni-saarland.de/en/study/programmes/bachelor/computer-science.html" }
        ],
        isterler: [
          { baslik: "Kabul yolu", detay: "Kontenjanlı İngilizce program; yalnızca kış döneminde başlar. Almanya'da lisansa doğrudan giriş hakkı veren bir yeterlilik gerekir. Üç yoldan biri seçilir: (1) Olimpiyat yolu: tanınan bir fen, bilişim ya da matematik olimpiyatına katılım + İngilizce sınav sonucu; (2) Yetenek yolu: tanınan bir standart yetenek testi + İngilizce sınav sonucu; (3) Mülakat yolu: test ya da olimpiyat sonucu olmayanlar için yalnızca yerinde mülakat. Birden fazla yoldan başvurulamaz.", kaynak: "https://www.uni-saarland.de/en/study/programmes/bachelor/computer-science.html" },
          { baslik: "İngilizce", detay: "CEFR B2 önerilir. Olimpiyat ve yetenek yollarında İngilizce sınav sonucu gerekir: IELTS Academic, TOEFL iBT, TOEFL Essential, Cambridge sertifikası ya da PTE Academic. Asgari puan yok; programın SSS sayfası 'There is no specific cut-off point for test results' diyor. Yetenek yolunda kabul edilen testler: SAT, TestAS (kağıt ve dijital), ACT, Gaokao, JEE Advanced, Suneung. Bunlarda da asgari puan yok, yerler sıralamayla doluyor; test 2 yıldan eski olmamalı. Önceki başarılı adaylar yaklaşık 95. yüzdelik dilimdeydi (SAT için yaklaşık 1400 ve üzeri). Kaynak: https://saarland-informatics-campus.de/en/computerscience-course/faq/", kaynak: "https://www.uni-saarland.de/en/study/programmes/bachelor/computer-science.html" }
        ],
        basvuruDonemi: "Kış dönemi: normal son tarih 15 Temmuz; isteğe bağlı erken başvuru tarihleri 15 Ocak ve 15 Haziran; mülakat yolu için son tarih 15 Haziran.",
        ucret: "Lisansta harç yok. Dönem katkı payı Kış 2026/27 için 412,30 € (sömestr bileti dahil). Kaynak: https://www.uni-saarland.de/en/study/organisation/fees/semester-fee.html",
        kaynak: "https://www.uni-saarland.de/en/study/programmes/bachelor/computer-science.html",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "de-fau",
        ad: "FAU Erlangen-Nürnberg",
        sehir: "Erlangen",
        web: "https://www.fau.eu/degree-program/artificial-intelligence-b-sc/",
        programlar: [
          { ad: "Artificial Intelligence", derece: "B.Sc.", dil: "English", sure: "6 semestr", kaynak: "https://www.fau.eu/degree-program/artificial-intelligence-b-sc/" }
        ],
        isterler: [
          { baslik: "Kabul yolu", detay: "1. dönem için not barajı (NC) olmayan bir yeterlilik değerlendirmesi yapılır. Uluslararası adayların Almanca bilmesi gerekmez.", kaynak: "https://www.fau.eu/degree-program/artificial-intelligence-b-sc/" },
          { baslik: "İngilizce", detay: "En az CEFR B1+ İngilizce belgesi.", kaynak: "https://www.fau.eu/degree-program/artificial-intelligence-b-sc/" },
          { baslik: "Başvuru işlem ücreti", detay: "AB dışından gelen adaylar her başvuru için 100 € işlem ücreti öder.", kaynak: "https://www.fau.eu/studying/international-students/application-and-enrollment-for-international-applicants/tuition-fees-for-students-from-non-eu-states/" }
        ],
        basvuruDonemi: "Yalnızca kış dönemi; resmi sayfaya göre uluslararası adaylar için son tarih 31 Mayıs (genel son tarih 31 Ağustos). Yaz dönemi başvurusu yok.",
        ucret: "AB dışı yeni kayıtlarda Yaz 2027'den itibaren AI B.Sc. için dönem başına 1.000 € (tam zamanlı). Dönem katkı payı ayrıca alınır: Kış 2026/27 için 82 € (sömestr bileti dahil değil). Kaynak: https://www.fau.eu/2026/07/news/study/re-registering/",
        kaynak: "https://www.fau.eu/degree-program/artificial-intelligence-b-sc/",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "de-dit",
        ad: "Deggendorf Institute of Technology (DIT / THD)",
        sehir: "Deggendorf",
        web: "https://th-deg.de/ain-b-en",
        programlar: [
          { ad: "Artificial Intelligence", derece: "B.Sc.", dil: "English", sure: "7 semestr (210 ECTS)", kaynak: "https://th-deg.de/ain-b-en" }
        ],
        isterler: [
          { baslik: "Kabul sınavı", detay: "DIT'nin kendi kabul sınavı yapılır: lise düzeyinde türev içeren matematik, lineer cebir, olasılık, mantık ve bilgisayar bilimi soruları (çoktan seçmeli) ve 200–300 kelimelik bir essay. Kış dönemi sınavı Mayıs–Haziran'da yapılması bekleniyor; tarih seçilemiyor.", kaynak: "https://th-deg.de/ain-b-en" },
          { baslik: "Dil", detay: "Kabul için İngilizce B2 gerekir; mezuniyete kadar Almanca A2 belgesi de gerekir.", kaynak: "https://th-deg.de/ain-b-en" },
          { baslik: "Diploma", detay: "Yükseköğretime giriş yeterliliği gerekir; yabancı diplomalar için DAAD veri tabanına bakılması isteniyor.", kaynak: "https://th-deg.de/ain-b-en" }
        ],
        basvuruDonemi: "15 Nisan – 15 Haziran (kış dönemi).",
        ucret: "Harç yok. AB/AEA dışı öğrenciler dönem başına 500 € hizmet ücreti öder (Kış 2025/26'dan itibaren); buna dönem başına 82 € öğrenci birliği ücreti eklenir. Başvuru ücreti 60 €. Kaynak: https://www.th-deg.de/en/students/documents/application-and-service-fees",
        kaynak: "https://th-deg.de/ain-b-en",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "de-rosenheim",
        ad: "TH Rosenheim (Technische Hochschule Rosenheim)",
        sehir: "Rosenheim",
        web: "https://www.th-rosenheim.de/en/studies-and-further-education/courses-of-study/bachelors-degree-programmes/applied-artificial-intelligence",
        programlar: [
          { ad: "Applied Artificial Intelligence", derece: "B.Sc.", dil: "English", sure: "7 semestr (210 ECTS; şirket içi uygulama dahil)", kaynak: "https://www.th-rosenheim.de/en/studies-and-further-education/courses-of-study/bachelors-degree-programmes/applied-artificial-intelligence" }
        ],
        isterler: [
          { baslik: "İngilizce (B2)", detay: "IELTS (Academic ya da Online dahil) 6.0+, TOEFL iBT 72+, TOEIC 785+ ya da PTE Academic 60+.", kaynak: "https://www.th-rosenheim.de/en/studies-and-further-education/courses-of-study/bachelors-degree-programmes/applied-artificial-intelligence" },
          { baslik: "Almanca (A2)", detay: "Almanca anadili olmayanlar Almanca A2 kanıtlamalı. Kabul edilen belgeler arasında Goethe A2, TELC A2 ve TestDaF TDN 3 var.", kaynak: "https://www.th-rosenheim.de/en/studies-and-further-education/courses-of-study/bachelors-degree-programmes/applied-artificial-intelligence" },
          { baslik: "Başvuru kanalı", detay: "Yabancı diplomayla başvuru uni-assist üzerinden yapılır.", kaynak: "https://www.th-rosenheim.de/en/studies-and-further-education/courses-of-study/bachelors-degree-programmes/applied-artificial-intelligence" }
        ],
        basvuruDonemi: "Yabancı diploma: 15 Şubat – 15 Temmuz (kış dönemi, Ekim başlangıcı; 2027 tarihleri).",
        ucret: "AB dışı öğrencilere dönem başına 500 € harç (Yaz 2026'dan itibaren) + 97 € öğrenci birliği katkısı (toplam 597 €). Kaynak: https://www.th-rosenheim.de/en/studies-and-further-education/during-studies/study-organisation/re-registration",
        kaynak: "https://www.th-rosenheim.de/en/studies-and-further-education/courses-of-study/bachelors-degree-programmes/applied-artificial-intelligence",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "de-tuhh",
        ad: "TUHH — Hamburg University of Technology",
        sehir: "Hamburg",
        web: "https://www.tuhh.de/tuhh/en/studying/before-studying/degree-courses/bachelors-programs/engineering-science",
        programlar: [
          { ad: "Engineering Science (9 uzmanlıktan 6'sı yalnızca İngilizce; Biomedical, Electrical ve Mechanical Engineering iki dilli)", derece: "B.Sc.", dil: "English", sure: "7 semestr (210 ECTS)", kaynak: "https://www.tuhh.de/tuhh/en/studying/before-studying/degree-courses/bachelors-programs/engineering-science" }
        ],
        isterler: [
          { baslik: "Kabul", detay: "Kontenjanlı program; yükseköğretime giriş yeterliliği gerekir. Yalnızca kış döneminde (Ekim) başlar.", kaynak: "https://www.tuhh.de/tuhh/en/studying/before-studying/degree-courses/bachelors-programs/engineering-science" },
          { baslik: "İngilizce", detay: "Başvuruda İngilizce belgesi istenmez. Kayıt için TOEFL iBT 90 (kağıt tabanlı 577) ya da IELTS Academic 6.5 gerekir. TOEFL ITP kabul edilmez.", kaynak: "https://www.tuhh.de/tuhh/en/studying/before-studying/application/bachelor/language-proficiency" }
        ],
        basvuruDonemi: "Her yıl 1 Haziran – 15 Temmuz (yalnızca kış dönemi).",
        ucret: "Genel harç yok. Dönem katkı payı Kış 2026/27 için 400 € (sömestr bileti dahil). Kaynak: https://www.tuhh.de/tuhh/en/education/students/organisational-details-about-your-studies/financing-your-studies/costs/semester-contribution",
        kaynak: "https://www.tuhh.de/tuhh/en/studying/before-studying/degree-courses/bachelors-programs/engineering-science",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "de-hsrw",
        ad: "Hochschule Rhein-Waal (HSRW)",
        sehir: "Kleve",
        web: "https://www.hochschule-rhein-waal.de/en/faculties/technology-and-bionics/degree-programmes/bachelor-study-programmes/engineering-bsc",
        programlar: [
          { ad: "Engineering (robotik, elektronik, ICT, sürdürülebilir ürün geliştirme gibi odak alanları)", derece: "B.Sc.", dil: "English", sure: "7 semestr", kaynak: "https://www.hochschule-rhein-waal.de/en/faculties/technology-and-bionics/degree-programmes/bachelor-study-programmes/engineering-bsc" }
        ],
        isterler: [
          { baslik: "Kabul", detay: "Kontenjansız (NC yok); çevrimiçi başvurudan sonra kabul verilir. Tüm dersler ve sınavlar İngilizce.", kaynak: "https://www.hochschule-rhein-waal.de/en/faculties/technology-and-bionics/degree-programmes/bachelor-study-programmes/engineering-bsc" },
          { baslik: "İngilizce", detay: "İngilizce programlar için CEFR B2 belgesi gerekir (uluslararası aday rehberi). HSRW'nin kabul edilen İngilizce belgeleri listesine göre B2 için: IELTS Academic en az 5.5, TOEFL iBT en az 72 (21.01.2026'dan itibaren yeni ölçekte 4), Cambridge FCE B ya da C, PTE Academic 59–75. Almanca belgesi istenmez. Kaynak: https://www.hochschule-rhein-waal.de/fileadmin/upload_redaktion/Dezernate/Studierendenangelegenheiten/Studierendenservice/Accepted_English_Language_Proofs__15_.pdf", kaynak: "https://www.hochschule-rhein-waal.de/en/faculties/technology-and-bionics/degree-programmes/bachelor-study-programmes/engineering-bsc" }
        ],
        basvuruDonemi: "Kış dönemi için son başvuru 15 Temmuz.",
        ucret: "Harç yok. Dönem ücreti Yaz 2026 için 347,10 € (Deutschlandticket dahil). Kaynak: https://www.hochschule-rhein-waal.de/en/studieren/all-about-university-life/costs-and-funding/tuition-fees",
        kaynak: "https://www.hochschule-rhein-waal.de/en/faculties/technology-and-bionics/degree-programmes/bachelor-study-programmes/engineering-bsc",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "de-hshl",
        ad: "Hochschule Hamm-Lippstadt (HSHL)",
        sehir: "Lippstadt",
        web: "https://www.hshl.de/en/studying/en-study-programs/en-bachelors-programs/en-electronic-engineering/",
        programlar: [
          { ad: "Electronic Engineering", derece: "B.Eng.", dil: "English", sure: "7 semestr (5. dönem uygulama ya da yurtdışı dönemi)", kaynak: "https://www.hshl.de/en/studying/en-study-programs/en-bachelors-programs/en-electronic-engineering/" }
        ],
        isterler: [
          { baslik: "Kabul", detay: "Kontenjansız program.", kaynak: "https://www.hshl.de/en/studying/en-study-programs/en-bachelors-programs/en-electronic-engineering/" },
          { baslik: "İngilizce (B2)", detay: "IELTS 6.0, TOEFL iBT 80 (kağıt 550, bilgisayar 213). Lise ya da üniversite diplomasında CEFR seviyesi yazılıysa belge istenmeyebilir.", kaynak: "https://www.hshl.de/en/studying/en-study-programs/en-bachelors-programs/en-electronic-engineering/" }
        ],
        basvuruDonemi: "Kış dönemi başlangıcı; başvurular Aralık'ta açılır ve kış döneminden önceki Temmuz'da kapanır.",
        ucret: "Harç yok. Dönem ücreti Kış 2026/27 için 362,80 €. Kaynak: https://www.hshl.de/en/studying/international-students/",
        kaynak: "https://www.hshl.de/en/studying/en-study-programs/en-bachelors-programs/en-electronic-engineering/",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "de-kit",
        ad: "KIT — Karlsruhe Institute of Technology (Carl Benz School)",
        sehir: "Karlsruhe",
        web: "https://www.sle.kit.edu/english/vorstudium/bachelor-mechanical-engineering-international.php",
        programlar: [
          { ad: "Mechanical Engineering (International)", derece: "B.Sc.", dil: "English", sure: "6 semestr (180 ECTS)", kaynak: "https://www.sle.kit.edu/english/vorstudium/bachelor-mechanical-engineering-international.php" }
        ],
        isterler: [
          { baslik: "Zorunlu belgeler", detay: "Dört zorunlu belge 30 Nisan'a kadar yüklenir: yükseköğretime giriş yeterliliği, alana özgü yetenek testi sonucu (SAT, ACT ya da TestAS), motivasyon mektubu ve İngilizce belgesi. Sıralama en fazla 45 puan üzerinden yapılır; matematik ve fizik notları ağır basar. Asgari puanlar: SAT en az 1200, ACT Composite en az 24, TestAS Core Test'te 75. yüzdelik dilim. Ayrıca son 3 okul yılı içinde bir yıl lise fiziği gerekir; yoksa ACT International Subject Test Physics (en az 24) ya da TestAS Engineering modülünde 75. yüzdelik dilim istenir. CBS kabul sayfası Türk adaylar için 'Turkish Lise Diplomasi + ÖSYM / YKS exam' yazıyor. Diploma henüz yoksa başvuru 'beklenen diploma onayı' formuyla yapılır; kabul edilirsen kesin belgeler en geç Ekim'deki kayıt son gününe kadar teslim edilir. Kaynak: https://www.carlbenzschool.kit.edu/admission-requirements.php", kaynak: "https://www.sle.kit.edu/english/vorstudium/bachelor-mechanical-engineering-international.php" },
          { baslik: "İngilizce (en az B2)", detay: "TOEFL iBT 90+, IELTS 6.5 (hiçbir bölüm 5.5'in altında olmamalı), CAE, CPE ya da UNIcert II.", kaynak: "https://www.sle.kit.edu/english/vorstudium/bachelor-mechanical-engineering-international.php" },
          { baslik: "Kontenjan", detay: "1. dönem için 125 kişilik kontenjan.", kaynak: "https://www.sle.kit.edu/english/vorstudium/bachelor-mechanical-engineering-international.php" }
        ],
        basvuruDonemi: "1. dönem: 30 Nisan'a kadar (yalnızca kış dönemi).",
        ucret: "AB dışı öğrenciler dönem başına 1.500 € harç öder (Baden-Württemberg kuralı); buna dönem ücreti eklenir. Kaynak: https://www.intl.kit.edu/istudies/12606.php",
        kaynak: "https://www.sle.kit.edu/english/vorstudium/bachelor-mechanical-engineering-international.php",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "de-tum",
        ad: "TUM — Technical University of Munich",
        sehir: "Heilbronn / München",
        web: "https://www.tum.de/en/studies/degree-programs/detail/information-engineering-at-tum-campus-heilbronn-bachelor-of-science-bsc",
        programlar: [
          { ad: "Information Engineering (TUM Campus Heilbronn)", derece: "B.Sc.", dil: "English (bazı seçmeli modüller Almanca)", sure: "6 semestr (180 ECTS)", kaynak: "https://www.tum.de/en/studies/degree-programs/detail/information-engineering-at-tum-campus-heilbronn-bachelor-of-science-bsc" },
          { ad: "Management and Technology (Campus München)", derece: "B.Sc.", dil: "English ya da English + German (yalnızca Computer Engineering uzmanlığı tamamen İngilizce)", sure: "6 semestr (180 ECTS)", kaynak: "https://www.tum.de/en/studies/degree-programs/detail/management-and-technology-bachelor-of-science-bsc" }
        ],
        isterler: [
          { baslik: "Yetenek değerlendirmesi (aptitude assessment)", detay: "Okul notları, alana özgü notlar ve ilgili deneyim puanlanır. Aday ya doğrudan kabul alır ya da kabul mülakatına (Management and Technology'de kabul testine) çağrılır.", kaynak: "https://www.tum.de/en/studies/degree-programs/detail/information-engineering-at-tum-campus-heilbronn-bachelor-of-science-bsc" },
          { baslik: "Dil (Information Engineering)", detay: "Bazı seçmeli modüller Almanca olduğu için Almanca sertifikası zorunlu. İngilizce belgesi istenmez; İngilizce başvuru sürecinde değerlendirilir.", kaynak: "https://www.tum.de/en/studies/degree-programs/detail/information-engineering-at-tum-campus-heilbronn-bachelor-of-science-bsc" },
          { baslik: "Dil (Management and Technology)", detay: "Almanca ya da İngilizce bilgisi gerekir. İngilizce belgesi istenmez; yetenek değerlendirmesinde kontrol edilir.", kaynak: "https://www.tum.de/en/studies/degree-programs/detail/management-and-technology-bachelor-of-science-bsc" }
        ],
        basvuruDonemi: "Kış dönemi: 15 Mayıs – 15 Temmuz (iki program için de).",
        ucret: "AB dışı lisans öğrencileri için harç şu an genellikle dönem başına 2.000 ya da 3.000 € (Management and Technology: dönem başına 2.000 €). Kış 2027/28'den itibaren yeni kayıtlarda 2.300 € ya da 3.400 € (TUM sayfası bu yeni tutarın dönem başına olduğunu açıkça yazmıyor). Information Engineering'in hangi dilimde olduğu: Teyit gerekir. TUM program sayfaları diğer programlarda harcı açıkça yazıyor (Management and Technology dönem başına 2.000 €, Informatics 3.000 €). Information Engineering sayfasında ise harç satırı yok, yalnızca 97 € öğrenci ücreti var. TUM'a yazılı sorulmalı (studium@tum.de). Dönem ücreti 97 €. Kaynak: https://www.tum.de/en/studies/fees/tuition",
        kaynak: "https://www.tum.de/en/studies/fees/tuition",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "de-thws",
        ad: "THWS — Technische Hochschule Würzburg-Schweinfurt",
        sehir: "Schweinfurt",
        web: "https://iro.thws.de/studieninteressierte/twin-studiengang-robotik/",
        programlar: [
          { ad: "Robotics (TWIN, Almanca ve İngilizce paralel modüller)", derece: "B.Eng.", dil: "English (TWIN: aynı modüller Almanca da verilir)", sure: "7 semestr", kaynak: "https://iro.thws.de/studieninteressierte/twin-studiengang-robotik/" }
        ],
        isterler: [
          { baslik: "Dikkat: tamamen İngilizce bitirilebilirlik", detay: "Resmi sayfa aynı içeriğin Almanca ve İngilizce verildiğini söylüyor. THWS International sayfası öğretim dilini 'English' olarak veriyor; dil şartları tablosunda 'Robotics (in English)' ayrı bir satır. Yani program İngilizce bitirilebilir; Almanca modüller isteğe bağlı TWIN sertifikası içindir. Dil şartı: İngilizce B2 (THWS genel listesi: TOEFL iBT en az 83, IELTS en az 6.0, Cambridge B2 First en az C). Almanca: tablo A2 diyor, uluslararası SSS ise başlangıçta Almanca gerekmediğini, A2'nin 2. dönem sonuna kadar istendiğini yazıyor (çelişkili). Almanya yükseköğretim giriş yeterliliği (HZB) olmayan AB dışı adaylar en geç kayıtta TestAS (Core ve Engineering modülünde en az 100) ya da SAT (en az 1.050) sunar; Türk lise + YKS yerleşmesi bu kuralda HZB sayılır mı, Teyit gerekir.", kaynak: "https://iro.thws.de/studieninteressierte/twin-studiengang-robotik/" }
        ],
        basvuruDonemi: "Kış dönemi (1 Ekim başlangıcı). THWS International program sayfasına göre her yıl 1 Nisan – 15 Haziran, THWS başvuru portalı üzerinden. Bölümün eski genel bakış sayfası 1 Mayıs – 15 Temmuz yazıyor (çelişkili); başvuru yılında portaldaki tarihi esas al.",
        ucret: "Harç yok; yalnızca Studierendenwerk katkısı dönem başına 117,70 €. Kaynak: https://international.thws.de/en/thws-international/ways-to-thws/study-programmes-at-thws/all-degree-programmes/robotics/",
        kaynak: "https://iro.thws.de/studieninteressierte/twin-studiengang-robotik/",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "de-schmalkalden",
        ad: "Hochschule Schmalkalden",
        sehir: "Schmalkalden",
        web: "https://www.hs-schmalkalden.de/en/studying/programmes/bachelor-degree-courses/mechatronics-and-robotics",
        programlar: [
          { ad: "Mechatronics and Robotics", derece: "B.Eng.", dil: "English", sure: "7 semestr (210 ECTS)", kaynak: "https://www.hs-schmalkalden.de/en/studying/programmes/bachelor-degree-courses/mechatronics-and-robotics" }
        ],
        isterler: [
          { baslik: "İngilizce", detay: "IELTS en az 6.5 ya da TOEFL iBT en az 86. Kabul için Almanca belgesi istenmez, ancak Almanca müfredatın bir parçasıdır.", kaynak: "https://www.hs-schmalkalden.de/en/studying/programmes/bachelor-degree-courses/mechatronics-and-robotics" },
          { baslik: "Dikkat: takvim", detay: "Yalnızca yaz döneminde (Nisan) başlar. Eylül 2028 başlangıç hedefine uymaz; Nisan 2029 başlangıcı gerekir.", kaynak: "https://www.hs-schmalkalden.de/en/studying/programmes/bachelor-degree-courses/mechatronics-and-robotics" }
        ],
        basvuruDonemi: "1 Eylül – 15 Kasım (yalnızca yaz dönemi, Nisan başlangıcı).",
        ucret: "Harç yok. Dönem katkı payı 303,80 € (yerel ulaşım bileti dahil).",
        kaynak: "https://www.hs-schmalkalden.de/en/studying/programmes/bachelor-degree-courses/mechatronics-and-robotics",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "de-ude",
        ad: "Universität Duisburg-Essen (UDE)",
        sehir: "Duisburg",
        web: "https://www.uni-due.de/studienangebote/studiengang.php?id=68",
        programlar: [
          { ad: "Mechanical Engineering (ISE)", derece: "B.Sc.", dil: "English + German (3. dönemden itibaren Almanca modüller)", sure: "6 semestr", kaynak: "https://www.uni-due.de/studienangebote/studiengang.php?id=68" }
        ],
        isterler: [
          { baslik: "Dikkat: tamamen İngilizce değil", detay: "Almanca diploması olmayan adaylardan girişte Almanca B1 istenir. Almanca modüllere katılmak için B2 gerekir. Mezuniyet için Almanca ve İngilizcede B2 gerekir. Kayıtta İngilizce B1 istenir.", kaynak: "https://www.uni-due.de/studienangebote/studiengang.php?id=68" },
          { baslik: "Başvuru kanalı", detay: "Kontenjansız (zulassungsfrei). AB dışı adaylar uni-assist üzerinden başvurur.", kaynak: "https://www.uni-due.de/studienangebote/studiengang.php?id=68" }
        ],
        basvuruDonemi: "AB dışı adaylar: uni-assist üzerinden 1 Mayıs – 31 Temmuz (kış dönemi).",
        ucret: "Sosyal ve öğrenci birliği katkısı Kış 2026/27 için 367,80 € (226,80 € Deutschlandsemesterticket, 125 € Studierendenwerk, 16 € öğrenci birliği). UDE'nin ücret sayfalarında harç kalemi yok. Kaynak: https://www.uni-due.de/studierendensekretariat/sozial_studierendenschaftsbeitrag.shtml",
        kaynak: "https://www.uni-due.de/studienangebote/studiengang.php?id=68",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "de-constructor",
        ad: "Constructor University (özel)",
        sehir: "Bremen",
        web: "https://constructor.university/programs/undergraduate-education/computer-science",
        programlar: [
          { ad: "Computer Science", derece: "B.Sc.", dil: "English", sure: "3 yıl (tam zamanlı)", kaynak: "https://constructor.university/programs/undergraduate-education/computer-science" },
          { ad: "Robotics and Intelligent Systems", derece: "B.Sc.", dil: "English", sure: "3 yıl (tam zamanlı)", kaynak: "https://constructor.university/programs/undergraduate-education/robotics-intelligent-systems" }
        ],
        isterler: [
          { baslik: "Başvuru ve burs", detay: "Kabul edilen her adaya bireysel bir finansman paketi sunulur. Tüm öğrenciler lise not ortalamasına dayalı akademik başarı bursu için değerlendirilir. İngilizce eşiği (lisans başvuru sayfası): TOEFL iBT 90 (yeni ölçekte 4.5), IELTS 6.5, Duolingo 110, PTE Academic 58, Cambridge CAE A–C; en az 6 yıl yalnızca İngilizce eğitim alanlar muaf. SAT/ACT değerlendirmede kullanılmaz ve başvuru için zorunlu değildir. Diploma Almanya'da doğrudan giriş hakkı vermiyorsa kayıt için SAT/ACT istenebilir; Türk diploması için durum: Teyit gerekir (study@constructor.university). Kaynak: https://constructor.university/admission-aid/application-information-undergraduate", kaynak: "https://constructor.university/programs/undergraduate-education/computer-science" }
        ],
        basvuruDonemi: "2027 girişi: Early Action 1 Ekim 2026 – 1 Şubat 2027. Rolling: 2 Şubat 2027'den itibaren; son gün Computer Science sayfasında 31 Temmuz 2027, Robotics and Intelligent Systems sayfasında 15 Temmuz 2027.",
        ucret: "Dönem başına 11.925 € (2027 girişi). Tek seferlik kayıt ücreti AB dışı öğrenciler için 940 €.",
        kaynak: "https://constructor.university/programs/undergraduate-education/computer-science",
        dogrulamaTarihi: "2026-10-12"
      }
    ],
    kaynaklar: [
      "https://www.daad.org/files/2023/03/Guide-to-German-Universities-for-HS-and-IB-Graduates.2024.1-1.pdf",
      "https://www.daad.de/en/studying-in-germany/requirements/overview/",
      "https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/tr/",
      "https://www.uni-assist.de/en/how-to-apply/plan-your-application/vpd/",
      "https://www.uni-assist.de/en/how-to-apply/pay-all-fees/handling-fees/",
      "https://tiflis.diplo.de/ge-de/service/visum/2722272-2722272",
      "https://tuerkei.diplo.de/tr-de/service/05-visaeinreise/2621556-2621556",
      "https://www.tum.de/en/studies/fees/tuition"
    ]
  },
  {
    id: "it",
    ad: "İtalya",
    ozet: "İtalya'da her üniversite kendi giriş testini ve takvimini belirler. Örnekler: PoliTo'da TIL-I, PoliMi'de TOL, CEnT-S ya da SAT, Padova'da yalnızca CEnT-S. Vize gerektiren adaylar ayrıca Universitaly üzerinden ön kayıt yapar ve diploma değerlendirme belgesi sunar. Bölgesel DSU bursu ISEE/ISEE parificato ile gelire göre verilir. AP sınavları Türk diploması sahipleri için kabul şartı değildir; PoliTo AP şartını yalnızca ABD lise diploması sahipleri için tanımlar.",
    kabulYolu: [
      {
        baslik: "Üniversiteye başvuru + Universitaly ön kaydı",
        detay: "Vize gerektiren uluslararası öğrenciler, üniversitenin uygunluk mektubunu almak için Universitaly ön kayıt başvurusunu yapmak zorundadır; vize için bu belge gerekir. Prosedür belgesi (MUR genelgesi) 2026/27 ve 2027/28 öğretim yılları için geçerlidir; 2026/27'de 11. sınıfta olanların giriş yılı olan 2028/29 için yeni MUR genelgesi gerekecek. Vize başvurusu son tarihi 2026/27 için 30 Kasım 2026, 2027/28 için 31 Ekim 2027'ydi; 2028/29 tarihi yayımlanmadı: mevcut MUR genelgesi yalnızca 2026/27 ve 2027/28 için geçerli (genelge üniversitelere Nisan 2026'da iletildi); 2028/29 için yeni genelge bekleniyor, büyük olasılıkla 2028 ilkbaharında, ön kayıt dönemi açılmadan önce Universitaly'de yayımlanır (https://www.universitaly.it/it/studenti-stranieri). Üniversiteler daha erken tarihler koyabilir. Universitaly portalı aynı anda yalnızca bir üniversitede bir programa kayda izin verir.",
        kaynak: "https://www.universitaly.it/it/studenti-stranieri"
      },
      {
        baslik: "Diploma değerlendirmesi: Dichiarazione di valore / CIMEA / ARDI",
        detay: "PoliTo kayıtta lise diplomasının Dichiarazione di valore (Statement of Validity) belgesini ya da CIMEA veya başka bir ENIC-NARIC merkezinin Statement of Comparability belgesini istiyor. ARDI platformundan alınan 'Attestato di Corrispondenza' CIMEA'nın Statement of Comparability belgesinin yerine geçer. Ancak üniversite ek olarak 'Attestato di Verifica CIMEA' isteyebilir. Diploma İtalyancaya resmi olarak tercüme edilir; İngilizce, Fransızca ya da İspanyolca diplomalar için tercüme gerekmez.",
        kaynak: "https://www.polito.it/sites/default/files/2025-12/Call%20for%20applications%20for%20admissions%20Engineering%20_%20LP%202026-27.pdf"
      },
      {
        baslik: "YKS belgesi",
        detay: "PoliTo, üniversiteye girişin ulusal bir sınavla yapıldığı ülkelerden ulusal giriş sınavını geçtiğini gösteren belge istiyor ve Türkiye için YKS'yi örnek veriyor. MUR genelgesi de (b) bendinde ülkedeki akademik yeterlilik sınavını geçtiğini gösteren belgeyi ister. YKS sonuç belgesi bu yüzden İtalya için de zorunludur; İtalya'da sınavı geçmiş olmak yeterlidir, Almanya'daki gibi bir lisans programına yerleşme şartı yoktur. 'Geçmek' için hangi eşiğin gerektiği hiçbir resmi belgede yazmıyor; bunu yalnızca üniversite söyleyebilir (Yazışmalarım: it-polito-tili-takvim şablonunun 2. sorusu). AP, Türk diploması sahibi için ne kabul şartı ne de resmi avantajdır.",
        kaynak: "https://www.polito.it/sites/default/files/2025-12/Call%20for%20applications%20for%20admissions%20Engineering%20_%20LP%202026-27.pdf"
      },
      {
        baslik: "Üniversiteye özel giriş testleri",
        detay: "Testler: TIL-I (PoliTo; garantili kabul eşiği 60/100, sıralama eşiği 30/100). TOL (PoliMi; İtalyanca yapılır). CEnT-S (CISIA; Padova'da tek seçenek; Sapienza ACSAI, PoliMi ve Napoli EEIT'de alternatif). SAT (PoliMi'de her bölümden 620, PoliTo'da her bölümden 650; Sapienza ve Milano AI'da da kullanılır). Tor Vergata ve Campus Bio-Medico kendi prosedürünü uygular. PoliMi'de son sınıftan bir önceki yıl ≥75/100 ile erken kayıt yalnızca İtalyanca programlar içindir (2026-27 çağrısı Art. 3); İngilizce programlara \"specific rankings\" ile girilir ve çağrı eşik vermez. 2026/27'de 11. sınıfta olan adaylar için PoliMi 2027/28 çağrısı henüz yayımlanmadı: 2026/27 çağrısı (2027/28 erken kayıt aşamasıyla birlikte) 19 Kasım 2025 tarihliydi; 2027/28 çağrısının Kasım 2026 ortası–sonunda https://www.polimi.it/en/prospective-students/how-to-apply/admission-to-laurea-programmes/engineering sayfasında yayımlanması bekleniyor. CEnT-S geçerliliği: bir test sezonu yalnızca bir sonraki akademik yılın kaydına sayılır; 26 Kasım / 17 Aralık 2026 oturumları 2027/28 kaydı içindir (https://guide.cisiaonline.it/en/node/206).",
        kaynak: "https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf"
      },
      {
        baslik: "DSU bursu — Lombardiya (PoliMi, Milano AI)",
        detay: "PoliMi 2026/27 DSU çağrısı: ISEE/ISEEU parificato en fazla 26.887,93 €, ISPE/ISPEU parificato en fazla 58.452,06 €. Burs tutarı her yıl Lombardiya bölge yönetiminin kararıyla belirlenir. PoliMi 2026/27 tutarları (1 Temmuz 2026 tarihli ek çağrı, Madde 4): özel ya da kamu konutta kalan fuori sede öğrenci ISEE 0–13.443,97 € için 7.419 € + günde 1 ücretsiz öğün (toplam 8.248 €), 13.443,98–17.925,29 € için 6.343 € (toplam 7.172 €), 17.925,30–26.887,93 € için 5.028 € (toplam 5.857 €). Günübirlik gelen öğrenci 3.991 / 3.362 / 2.470 €, yerel öğrenci 2.601 / 2.162 / 1.314 € (+ öğün). Tutar yerel, günübirlik ve şehir dışından gelen (fuori sede) öğrenciye göre değişir.",
        kaynak: "https://www.polimi.it/fileadmin/user_upload/studenti/tasse-borse-agevolazioni-economiche/dsu/bando_2026-2027/DSU_Call_a.y._2026-2027.pdf"
      },
      {
        baslik: "DSU bursu — Piemonte / EDISU (PoliTo)",
        detay: "EDISU 2026/27 çağrısında üst ISEE sınırı 26.306,25 €. Fuori sede burs tutarları (EDISU 2026/27 çağrısı Madde 5 c.1.3; yemek katkısı 150 € düşülmüş): ISEE ≤13.153,12 € için 8.096,78 €; 13.153,12–17.537,50 € için 7.021,11 €; 17.537,50–23.626,00 € için 5.586,89 €; 23.626,00–26.306,25 € için 3.800,00 €. STEM programındaki kız öğrenciler için üst dilimlerde daha yüksek tutarlar var (ör. 17.537,50 € altı 8.455,33 €). EDISU yurduna yerleşen öğrenciye nakit kısım daha düşük, yurt ayrıca verilir. Fuori sede sayılmak için ders verilen şehirde ya da komşu belediyede ücretli bir konutta oturulmalı.",
        kaynak: "https://www.edisu.piemonte.it/sites/default/files/documentazione/bandi-di-concorso/Bando_borsa_di_studio_servizio_abitativo_premio_di_laurea_contributo_studenti_con_disabilit%C3%A0_dal_46_p.c._iscritti_al_collocamento_mirato_a.a._2026-27_0.pdf"
      },
      {
        baslik: "DSU bursu — Lazio / DiSCo (Sapienza, Tor Vergata, Campus Bio-Medico)",
        detay: "DiSCo 2026/27: ISEE en fazla 28.339,88 €, ISPE en fazla 61.608,48 €. Fuori sede burs 6.571,11 €, günübirlik gelen öğrenciye 3.590,71 €, yerel öğrenciye 2.290,16 €. Buna günde 2 ücretsiz öğün eklenir. Fuori sede sayılmak için Ekim 2026 – Eylül 2027 arasında en az 10 aylık kayıtlı kira sözleşmesi gerekir.",
        kaynak: "https://laziodisco.it/wp-content/uploads/2026/07/BANDO-DIRITTO-ALLO-STUDIO-ENG-26-27.pdf"
      }
    ],
    genelIsterler: [
      {
        baslik: "İngilizce B2 (İngilizce programlar)",
        detay: "PoliTo İngilizce programlar için en az CEFR B2 İngilizce belgesi istiyor. PoliMi, Sapienza ACSAI, Padova, Tor Vergata, Napoli EEIT ve Campus Bio-Medico da B2 istiyor; kaynaklar üniversite kartlarında.",
        kaynak: "https://www.polito.it/sites/default/files/2025-12/Call%20for%20applications%20for%20admissions%20Engineering%20_%20LP%202026-27.pdf"
      },
      {
        baslik: "PoliMi'de İtalyanca OFA",
        detay: "PoliMi'de İngilizce programlarda İtalyanca bilmeyen öğrenciye İtalyanca OFA verilir. Mezuniyetten önce CLIQ sistemindeki bir B2 İtalyanca belgesi sunulmalı ya da PoliMi'nin ücretsiz İtalyanca kursu tamamlanmalıdır (derslerin en az %75'ine katılım + final testi).",
        kaynak: "https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf"
      },
      {
        baslik: "Kayıt belgeleri (PoliTo örneği)",
        detay: "Pasaport, D tipi ulusal öğrenci vizesi ('Immatricolazione Università'), Agenzia delle Entrate ya da İtalyan temsilciliğinin verdiği vergi numarası (codice fiscale), tercümeli lise diploması, YKS belgesi, Dichiarazione di valore ya da CIMEA/ARDI belgesi ve dil belgesi.",
        kaynak: "https://www.polito.it/sites/default/files/2025-12/Call%20for%20applications%20for%20admissions%20Engineering%20_%20LP%202026-27.pdf"
      },
      {
        baslik: "Öğrenci vizesi",
        detay: "Universitaly ön kayıt başvurusu, vize için gereken uygunluk mektubunu almanın tek yoludur. Vize başvurusunun son tarihi (2026/27 için 30 Kasım 2026) ve üniversitelerin daha erken tarihleri Universitaly sayfasında yayımlanır.",
        kaynak: "https://www.universitaly.it/it/studenti-stranieri"
      },
      {
        baslik: "DSU için ISEE parificato",
        detay: "Yurtdışında geliri ya da mal varlığı olan öğrenci, bir CAF vergi merkezinden ISEEU parificato almalıdır. Eşikler ve tutarlar bölgeye göre değişir (bkz. Kabul Yolları).",
        kaynak: "https://www.polimi.it/en/students/tuition-fees-scholarships-and-financial-aid/tuition-fees/students-with-income-and-property-abroad"
      }
    ],
    sinavlar: [
      "cent-s", "til-i", "polimi-tol", "sat", "ielts-academic", "toefl-ibt",
      "ap-calculus-ab", "ap-calculus-bc", "ap-physics-1", "ap-physics-c-mechanics", "ap-physics-c-em",
      "ap-chemistry", "ap-biology", "ap-english-language", "ap-computer-science-a",
      "ap-microeconomics", "ap-macroeconomics"
    ],
    takvim: [
      { tarih: "2026-11-07", olay: "SAT sınav tarihi (kayıt son günü 23 Ekim 2026). PoliMi, PoliTo, Sapienza ve Milano AI SAT kabul ediyor.", kaynak: "https://satsuite.collegeboard.org/sat/dates-deadlines" },
      { tarih: "2026-11-13", olay: "2027 AP sınav siparişi için son gün (23:59 ET)", kaynak: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/ordering-fees/exam-fees" },
      { tarih: "2026-11-30", olay: "2026/27 için vize başvurularının İtalyan temsilciliklerine ulaşması gereken son gün (referans; 2026/27'de 11. sınıfta olanların döngüsü 2028/29)", kaynak: "https://www.universitaly.it/it/studenti-stranieri" },
      { tarih: "2026-12-05", olay: "SAT sınav tarihi (kayıt son günü 20 Kasım 2026)", kaynak: "https://satsuite.collegeboard.org/sat/dates-deadlines" },
      { tarih: "2027-01-07", olay: "Padova Information Engineering: AB dışı aday başvurusu açılır (2027/28; 7 Mart 2027'de kapanır)", kaynak: "https://apply.unipd.it/courses/course/182" },
      { tarih: "2027-03-06", olay: "SAT sınav tarihi", kaynak: "https://satsuite.collegeboard.org/sat/dates-deadlines" },
      { tarih: "2027-03-07", olay: "Padova Information Engineering: AB dışı aday başvurusu kapanır (2027/28)", kaynak: "https://apply.unipd.it/courses/course/182" },
      { tarih: "2027-05-01", olay: "SAT sınav tarihi", kaynak: "https://satsuite.collegeboard.org/sat/dates-deadlines" },
      { tarih: "2027-05-03", olay: "2027 AP sınav dönemi başlar", kaynak: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates" },
      { tarih: "2027-06-05", olay: "SAT sınav tarihi", kaynak: "https://satsuite.collegeboard.org/sat/dates-deadlines" }
    ],
    universiteler: [
      {
        id: "it-polito",
        ad: "Politecnico di Torino (PoliTo)",
        sehir: "Torino",
        web: "https://www.polito.it/en/education/bachelor-s-degree-programmes",
        programlar: [
          { ad: "Civil and Environmental Engineering", derece: "Laurea (B.Sc.)", dil: "English", sure: "3 yıl (180 ECTS)", kaynak: "https://www.polito.it/en/education/bachelor-s-degree-programmes" },
          { ad: "Electronic and Communications Engineering", derece: "Laurea (B.Sc.)", dil: "English", sure: "3 yıl (180 ECTS)", kaynak: "https://www.polito.it/en/education/bachelor-s-degree-programmes" },
          { ad: "Computer Engineering", derece: "Laurea (B.Sc.)", dil: "Italian ya da English", sure: "3 yıl (180 ECTS)", kaynak: "https://www.polito.it/en/education/bachelor-s-degree-programmes" },
          { ad: "Mechanical Engineering", derece: "Laurea (B.Sc.)", dil: "Italian ya da English", sure: "3 yıl (180 ECTS)", kaynak: "https://www.polito.it/en/education/bachelor-s-degree-programmes" },
          { ad: "Automotive Engineering", derece: "Laurea (B.Sc.)", dil: "Italian ya da English (tamamen İngilizce seçeneği var)", sure: "3 yıl (180 ECTS)", kaynak: "https://www.polito.it/en/education/bachelor-s-degree-programmes" }
        ],
        isterler: [
          { baslik: "TIL-I giriş testi", detay: "Torino ya da Mondovì'de bilgisayar laboratuvarında yüz yüze yapılır; İngilizce ya da İtalyanca seçilebilir. ≥60/100 garantili kabul sağlar ve ilk tercihe yerleştirir. Sıralamaya girme eşiği ≥30/100. Ücret 50 €; toplamda en fazla 3 kez girilebilir. TIL-I'ye kayıt olurken lise son sınıfta olmak ya da mezun olmak gerekir; puan yalnızca o yılın kaydı için geçerlidir. Bu yüzden öğrenci TIL-I'ye ancak son sınıfta girebilir (2026/27'de 11. sınıfta olan için 2027/28).", kaynak: "https://www.polito.it/sites/default/files/2025-12/Call%20for%20applications%20for%20admissions%20Engineering%20_%20LP%202026-27.pdf" },
          { baslik: "SAT alternatifi", detay: "Her iki bölümden (Reading and Writing ile Math) en az 650 gerekir. SAT ile garantili kabul yoktur; SAT yalnızca sıralamaya girmeyi sağlar. Kurum kodu: 7679.", kaynak: "https://www.polito.it/sites/default/files/2025-12/Call%20for%20applications%20for%20admissions%20Engineering%20_%20LP%202026-27.pdf" },
          { baslik: "Dil ve belgeler", detay: "İngilizce programlar için en az B2 İngilizce belgesi gerekir. Ayrıca YKS belgesi ve Dichiarazione di valore ya da CIMEA/ARDI belgesi istenir. 2026/27'de vize gerektiren AB dışı adaylara ayrılan kontenjan: Civil and Environmental 65, Electronic and Communications 80, Computer Engineering 85, Mechanical 110, Automotive 40.", kaynak: "https://www.polito.it/sites/default/files/2025-12/Call%20for%20applications%20for%20admissions%20Engineering%20_%20LP%202026-27.pdf" }
        ],
        basvuruDonemi: "2026/27 döngüsü (referans): vize gerektiren adaylar için TIL-I oturumları 19 Şubat – 22 Mayıs 2026, kayıtlar 27 Ocak 2026'da açıldı. Sıralama 28 Mayıs 2026'da yayımlandı. 2028/29 girişinin takvimi yayımlanmadı: 2026/27 çağrısı (D.R. 1412/2025) Aralık 2025'te yayımlandı; 2027/28 çağrısı Aralık 2026, 2028/29 çağrısı Aralık 2027 civarında https://www.polito.it/didattica/iscriversi-studiare-laurearsi/iscrizione/corsi-di-laurea/bandi-regolamenti-e-graduatorie sayfasında beklenir.",
        ucret: "Yeni kayıtlarda AB dışı öğrencinin yıllık ücreti vatandaşlık ülkesinin satın alma gücü paritesine göre GSYH'sine göre belirlenir (600–3.600 €). Türkiye için 2025/26 tutarı yıllık 1.544 €. Buna 140 € bölgesel DSU vergisi (EDISU) ve 16 € damga vergisi eklenir. 2026/27 Regolamento contribuzione (D.R. 701/2026, 10 Temmuz 2026) Ek 2'de Türkiye için tutar 1.709 €. Tablodaki en düşük (761 €) ve en yüksek (3.761 €) değerler, Madde 2'deki 600–3.600 € sınırına 140 € bölgesel vergi + 16 € damga + 5 € sigorta eklenmiş haline denk geliyor; bu yüzden 1.709 € büyük olasılıkla toplam ödemedir. Tablo başlığı bunu açıkça yazmıyor; öteki okuma 1.709 € + 161 €. 2028/29 tutarı yayımlanmadı (yönetmelik her yıl Temmuz'da çıkıyor). Kaynak: https://www.polito.it/sites/default/files/2025-07/ENG_Regolamento%20contribuz_immatricolati_post%20CDA.pdf",
        kaynak: "https://www.polito.it/sites/default/files/2025-12/Call%20for%20applications%20for%20admissions%20Engineering%20_%20LP%202026-27.pdf",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "it-polimi",
        ad: "Politecnico di Milano (PoliMi)",
        sehir: "Milano / Piacenza / Cremona",
        web: "https://www.polimi.it/en/prospective-students/politecnico-programmes/new-undergraduate-programmes",
        programlar: [
          { ad: "Engineering Science (Milano Leonardo ve Bovisa)", derece: "Laurea (B.Sc.)", dil: "English", sure: "3 yıl", kaynak: "https://www.polimi.it/en/education/laurea-programmes/programme-detail/engineering-science" },
          { ad: "Industrial Engineering (Piacenza)", derece: "Laurea (B.Sc.)", dil: "English", sure: "3 yıl", kaynak: "https://www.polimi.it/en/prospective-students/politecnico-programmes/new-undergraduate-programmes" },
          { ad: "Process Engineering (Cremona)", derece: "Laurea (B.Sc.)", dil: "English", sure: "3 yıl", kaynak: "https://www.polimi.it/en/prospective-students/politecnico-programmes/new-undergraduate-programmes" },
          { ad: "Civil Engineering (Milano Leonardo)", derece: "Laurea (B.Sc.)", dil: "Italian ya da English", sure: "3 yıl", kaynak: "https://www.polimi.it/en/education/laurea-programmes/programme-detail/civil-engineering" }
        ],
        isterler: [
          { baslik: "Giriş testi", detay: "PoliMi'nin kendi testi TOL'dur ve İtalyanca yapılır. Kabul için en az 30/100 gerekir. TOL yerine kabul edilen testler: TOLC-I (İtalyanca), CEnT-S (İngilizce) ve SAT (İngilizce). Bu testlerin puanları PoliMi'nin formülüyle 100'lük ölçeğe çevrilir. SAT için her iki bölümden en az 620 gerekir.", kaynak: "https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf" },
          { baslik: "Erken kabul", detay: "Son sınıftan bir önceki yıl TOL'de ya da alternatif bir testte ≥75/100 alan aday, ertesi yılın erken kayıt aşamasına girer; bu kural 2026-27 çağrısı Art. 3'e göre yalnızca İtalyanca programlar içindir. İngilizce programlarda kabul \"specific rankings\" ile yapılır; çağrı eşik vermez ve ≥75'in garantili kabul sağladığı doğrulanmadı. 2026-27 çağrısındaki pencereler 2025/26'da 11. sınıf olanlar içindi. 2026/27'de 11. sınıfta olan adayların 2027 pencereleri 2027-28 çağrısında yayımlanacak; çağrı henüz yayımlanmadı (beklenen: Kasım 2026, önceki çağrı 19 Kasım 2025). 2026-27 çağrısında 11. sınıftaki adayın alternatif testi (CEnT-S dahil) 1 Eylül 2025–31 Ağustos 2026 arasında alınmışsa ve 31 Ağustos 2026'ya kadar kaydedilmişse geçerliydi (Art. 3.2).", kaynak: "https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf" },
          { baslik: "Dil", detay: "İngilizce programlar için kayıttan önce İngilizce yeterlilik belgesi gerekir; kabul edilen belgeler PoliMi dil şartları sayfasında. İtalyanca bilmeyen öğrenciye İtalyanca OFA verilir; mezuniyetten önce B2 belgesi ya da PoliMi kursu gerekir.", kaynak: "https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf" },
          { baslik: "AB dışı adaylar", detay: "Ayrılmış kontenjandaki AB dışı adaylar aynı maddelere göre başvurur. Kabul edilenler öğrenci vizesi başvurusunu Universitaly portalı üzerinden tamamlar.", kaynak: "https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf" }
        ],
        basvuruDonemi: "2026-27 çağrısına göre TOL STANDARD TEST pencereleri: 1 Şubat – 10 Mart 2026 ve 11 Mart – 31 Mayıs 2026. TOL ücreti 35 €. 2028/29 girişi için takvim yayımlanmadı: 11. sınıf (EARLY TEST) pencereleri Kasım 2026'da beklenen 2027-28 çağrısında, son sınıf (STANDARD TEST) pencereleri Kasım 2027'de beklenen 2028-29 çağrısında yer alacak.",
        ucret: "2026/27 Laurea ücreti gelire (ISEE) göre belirlenir: ilk taksit 880,04 €, yüksek ISEE için yıllık en fazla 3.943,04 €. Yurtdışında geliri ya da mal varlığı olan öğrencinin ücreti, PoliMi'nin anlaşmalı CAF'ından alınan ISEEU parificato ile hesaplanır; ISEE/ISEEU sunmayan öğrenci en yüksek tutarı (2026/27: 3.943,04 €) öder. Ayrılmış AB dışı kontenjandaki öğrenciye otomatik en yüksek tutar kuralı sayfada yalnızca yurtdışı lisans diplomasıyla Laurea Magistrale'ye girenler için yazıyor. Kaynak: https://www.polimi.it/en/prospective-students/how-much-does-it-cost/laurea-laurea-magistrale-and-single-cycle-programmes",
        kaynak: "https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "it-sapienza",
        ad: "Sapienza Università di Roma",
        sehir: "Roma",
        web: "https://www.uniroma1.it/en/pagina/restricted-access-degree-programmes-tolc-i-and-selections",
        programlar: [
          { ad: "Applied Computer Science and Artificial Intelligence (ACSAI)", derece: "Laurea (B.Sc.)", dil: "English", sure: "3 yıl", kaynak: "https://www.uniroma1.it/sites/default/files/field_file_allegati/14824_en_0.pdf" }
        ],
        isterler: [
          { baslik: "Kabul edilen testler", detay: "AB dışı (vizeli) adaylar için: English TOLC-I (1 Temmuz 2024 – Kasım 2025 arası alınmış), Kasım 2025'ten itibaren CEnT-S (belirli bölümleri; @HOME ya da @UNI) ya da 1 Ocak 2024'ten itibaren alınmış SAT. Ücret: seçim için 10 €.", kaynak: "https://www.uniroma1.it/sites/default/files/field_file_allegati/14824_en_0.pdf" },
          { baslik: "Kontenjan", detay: "2026/27'de toplam 180 kontenjan var: 120 AB, 60 vize gerektiren AB dışı aday (5'i Marco Polo projesine ayrılmış). AB dışı adaylar yalnızca birinci seçime katılabilir.", kaynak: "https://www.uniroma1.it/sites/default/files/field_file_allegati/14824_en_0.pdf" },
          { baslik: "Dil", detay: "En az B2 İngilizce.", kaynak: "https://www.uniroma1.it/sites/default/files/field_file_allegati/14824_en_0.pdf" }
        ],
        basvuruDonemi: "2026/27 döngüsü: AB dışı vizeli adaylar için ön seçime kayıt 15 Mayıs 2026'da kapandı. Birinci seçim için test sonuçlarının son tarihi 18 Haziran 2026'ydı. 2028/29 girişi için takvim yayımlanmadı: 2026/27 ön seçimi MoveIn platformunda 22 Aralık 2025'te açılmıştı; 2027/28 ön seçiminin Aralık 2026, 2028/29 ön seçiminin Aralık 2027 civarında https://www.uniroma1.it/en/admissions sayfasında açılması beklenir.",
        ucret: "Yurtdışı gelir beyan eden öğrenci için ülkeye göre sabit katkı: A bandı 300 €, B bandı 700 €, C bandı 1.500 € (yılda; 3 taksit). Türkiye B bandında: yılda 700 €. 2026/27 kabul sayfası da tam harcı ikamet ülkesine göre yılda 300–1.500 € olarak veriyor. İtalya'da gelir ya da mal varlığı varsa ISEE ile hesaplanır.",
        kaynak: "https://www.uniroma1.it/sites/default/files/field_file_allegati/14824_en_0.pdf",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "it-padova",
        ad: "Università degli Studi di Padova",
        sehir: "Padova",
        web: "https://apply.unipd.it/courses/course/182",
        programlar: [
          { ad: "Information Engineering", derece: "Laurea (B.Sc.)", dil: "English", sure: "3 yıl (180 ECTS)", kaynak: "https://apply.unipd.it/courses/course/182" }
        ],
        isterler: [
          { baslik: "Yalnızca CEnT-S", detay: "Program CISIA CEnT-S testini zorunlu tutuyor. Yurtdışında oturan AB dışı adaylar için 2026 çağrısında eşik: normalize ağırlıklı puan ≥38 ve Matematik bölümünde en az 7 doğru. Test 2. makro dönemin sonuna kadar alınmalı.", kaynak: "https://www.unipd.it/sites/unipd.it/files/2025/Information%20Engineering_non-EU%20students%20residing%20abroad.pdf" },
          { baslik: "Kontenjan ve dil", detay: "Yurtdışında oturan AB dışı adaylar için 100 kontenjan. İngilizce B2 ya da eşdeğeri gerekir.", kaynak: "https://apply.unipd.it/courses/course/182" }
        ],
        basvuruDonemi: "2027/28 için AB dışı aday çağrısı 7 Ocak – 7 Mart 2027 (AB ve eşdeğer adaylar 9 Mart – 9 Nisan 2027). 2028/29 girişi için pencere yayımlanmadı; 2027/28 penceresi Ekim 2026'dan önce apply.unipd.it'de yayımlandığına göre 2028/29 penceresinin 2027 sonbaharında aynı sayfada (https://apply.unipd.it/courses/course/182) yayımlanması beklenir.",
        ucret: "Yılda 2.950 €. Başvuru ücreti sayfada hem 55 € hem 60 € olarak geçiyor (çelişkili). 208 € bir depozito değil: Padova ücret sayfasına göre birinci sınıf kaydında ödenen 1. taksittir (192 € bölgesel vergi + 16 € damga vergisi); sabit ücret ödeyen, ailesi yurtdışında yaşayan AB dışı öğrenciye de uygulanıp uygulanmadığını sayfa açıkça yazmıyor. Aynı sayfa bilimsel programlar (B1 grubu) için sabit ücreti 2.990 € olarak veriyor; başvuru sayfasındaki 2.950 € ile çelişiyor.",
        kaynak: "https://apply.unipd.it/courses/course/182",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "it-torvergata",
        ad: "Università di Roma Tor Vergata",
        sehir: "Roma",
        web: "https://engineering-sciences.uniroma2.it/call-for-applications/",
        programlar: [
          { ad: "Engineering Sciences", derece: "Laurea (B.Sc.)", dil: "English", sure: "3 yıl", kaynak: "https://engineering-sciences.uniroma2.it/call-for-applications/" }
        ],
        isterler: [
          { baslik: "Procedure C (öğrenci vizesi gerekenler)", detay: "AB ya da AB dışı okul diplomasıyla başvuran ve öğrenci vizesi gereken adaylar için uygulanır. İki başvuru penceresinden yalnızca birine başvurulabilir. Beklenen matematik altyapısı: temel cebir, doğrusal denklem ve eşitsizlikler, üstel ve logaritmik fonksiyonlar, trigonometri, ikinci dereceden denklemler, irrasyonel eşitsizlikler, istatistik ve olasılık. Daha önce yazılan 'çevrimiçi yazılı sınav + mülakat' bilgisi 2026/27 çağrı sayfasında yok; sayfa beklenen matematik konularını ve kabul edilen dil belgelerini sayıyor ama değerlendirmenin nasıl yapıldığını yazmıyor. Değerlendirme biçimini üniversiteye sor (welcome@uniroma2.it).", kaynak: "https://engineering-sciences.uniroma2.it/call-for-applications/" },
          { baslik: "İngilizce", detay: "Anadili İngilizce olmayanlar onaylı listeden en az B2 belgesi sunmalı; belge Ocak 2022 ya da sonrasında alınmış olmalı.", kaynak: "https://engineering-sciences.uniroma2.it/call-for-applications/" }
        ],
        basvuruDonemi: "2026/27 Procedure C: 1. pencere 12–30 Ocak 2026, 2. pencere 30 Mart – 17 Nisan 2026. 2028/29 girişi için tarih yayımlanmadı: 2026/27 çağrısı 12 Ocak 2026'da başladı; 2027/28 çağrısı Ocak 2027, 2028/29 çağrısı Ocak 2028 civarında aynı sayfada beklenir (https://engineering-sciences.uniroma2.it/call-for-applications/).",
        ucret: "Teyit gerekir: çağrı sayfası ücretlerin her yıl üniversite yönetimince belirlendiğini söylüyor ve tutar vermiyor; üniversitenin bulunabilen İngilizce ücret sayfası 2017/18 yılına ait. Güncel tutarı Welcome Office'e sor (welcome@uniroma2.it).",
        kaynak: "https://engineering-sciences.uniroma2.it/call-for-applications/",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "it-trento",
        ad: "Università di Trento",
        sehir: "Trento",
        web: "https://www.disi.unitn.it/prospective-students/bachelor-courses",
        programlar: [
          { ad: "Computer, Communications and Electronic Engineering", derece: "Laurea (B.Sc.)", dil: "English (2024/25'ten itibaren tamamen İngilizce müfredat)", sure: "3 yıl", kaynak: "https://www.disi.unitn.it/prospective-students/bachelor-courses" }
        ],
        isterler: [
          { baslik: "Giriş testi (çelişkili kaynak)", detay: "Bölüm sayfası seçimin TOLC-I ya da English TOLC-I ile yapıldığını söylüyor. 2026/27 kabul çağrısının arama dizinindeki metnine göre ise AB dışı adaylar için CEnT-S zorunlu ve yalnızca 1. oturuma katılabiliyorlar. 2026/27 İngilizce kabul çağrısının arama dizinindeki metnine göre İngilizce programın 1. oturumunda 25 yer CEnT-S ile başvuran AB dışı adaylara ayrılmış; bölüm sayfası ise hâlâ TOLC-I / English TOLC-I yazıyor. Normatif belge çağrı olduğu için AB dışı aday için test büyük olasılıkla CEnT-S. Asgari puan 2026/27 için bulunamadı (2025/26 çağrısında 50 üzerinden 18).", kaynak: "https://www.disi.unitn.it/prospective-students/bachelor-courses" },
          { baslik: "Oturum kısıtı", detay: "AB dışı adaylar yalnızca 1. oturuma başvurabilir; yurtdışında oturan AB dışı adaylar için son tarih Mart ayında.", kaynak: "https://www.disi.unitn.it/prospective-students/bachelor-courses" }
        ],
        basvuruDonemi: "AB dışı adaylar: yalnızca 1. oturum. 2026/27'de son tarih 23 Mart 2026 (aynı döngünün DICAM/DII çağrısına göre; DISI çağrısında doğrudan okunamadı). 2028/29 girişi için tarih yayımlanmadı; 2026/27 çağrıları Aralık 2025'te yayımlanmıştı.",
        ucret: "Teyit gerekir: Trento, yurtdışında oturan AB dışı öğrenciler için kabul puanına bağlı ücret modeli uyguluyor (Kasım 2024 yönetmeliği; yılda en fazla 6.000 €, kabul puanı yükseldikçe indirimli). 2026/27 tutarları resmi sayfa bot korumasıyla açılamadığı için doğrulanamadı; üniversiteye sor.",
        kaynak: "https://www.disi.unitn.it/prospective-students/bachelor-courses",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "it-milano-ai",
        ad: "Università degli Studi di Milano + Milano-Bicocca + Pavia (ortak program)",
        sehir: "Milano / Pavia",
        web: "https://www.unimi.it/en/education/bachelor/artificial-intelligence",
        programlar: [
          { ad: "Artificial Intelligence (L-31)", derece: "Laurea (B.Sc.)", dil: "English", sure: "3 yıl", kaynak: "https://www.unimi.it/en/education/bachelor/artificial-intelligence" }
        ],
        isterler: [
          { baslik: "SAT (yurtdışında oturan AB dışı adaylar)", detay: "Yurtdışında oturan AB dışı adaylar için giriş testi SAT. İngilizce B2 gerekir. Program sayfası 2025/26 için 180 kontenjan veriyordu; bunun 50'si yurtdışında oturan AB dışı öğrencilere ayrılmıştı. 2026/27 (Pavia başvuru portalı): asgari SAT 979/1600; Math bölümünde 510/800 altı OFA getirir. Yurtdışında oturan AB dışı adaylar için 45 yer + Marco Polo programı için 5 yer.", kaynak: "https://www.unimi.it/en/education/bachelor/artificial-intelligence" }
        ],
        basvuruDonemi: "2026/27 Universitaly ön kaydı için son gün 31 Temmuz 2026 (referans). AB dışı aday başvuru penceresi 2026/27'de 28 Nisan – 18 Mayıs 2026 (SAT sonucu başvuruyla yüklenir), sıralama 28 Mayıs 2026. 2028/29 girişi için pencere yayımlanmadı; Pavia başvuru portalında beklenir.",
        ucret: "2026/27 için yılda 1.500 € (AB dışı yurtdışı başvuru sayfası); sabit ya da gelire göre indirim mümkün. Başvuru ücreti 35 € (iade edilmez). Kaynak: https://apply.unipv.eu/it_IT/courses/course/162-artificial-intelligence-procedure-noneu-students",
        kaynak: "https://apply.unimi.it/news/new/8-universitaly---202627-pre-enrolment",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "it-genova",
        ad: "Università di Genova",
        sehir: "Imperia",
        web: "https://corsi.unige.it/en/corsi/12133",
        programlar: [
          { ad: "Computer Engineering", derece: "Laurea (B.Sc.)", dil: "English", sure: "3 yıl (180 CFU)", kaynak: "https://corsi.unige.it/en/corsi/12133" }
        ],
        isterler: [
          { baslik: "Kabul", detay: "Serbest giriş (free access). Seçici olmayan bir giriş değerlendirmesi var: A.T.H.E.N.A., İngilizce, 50 çoktan seçmeli soru, 90 dk (Bilişim 20, Mantık ve Matematik 20, İngilizce 10). Yalnızca bir kez girilir; asgari puan tutturulamazsa OFA verilir ve birinci dönem sonuna kadar kapatılmalıdır. İngilizce: B2 ya da üstü belge yoksa B2 düzeyinde İngilizce bölümüne girmek zorunludur. 2026/27 oturumları: 18 Eylül, 9 Ekim, 30 Ekim, 20 Kasım 2026 ve 22 Ocak 2027 (sonuncusu Aralık'tan sonra gelen AB dışı öğrenciler için).", kaynak: "https://corsi.unige.it/en/corsi/12133" }
        ],
        basvuruDonemi: "2028/29 girişi için takvim yayımlanmadı. 2026/27 vizeli adaylar: UniGeApply ön değerlendirme 26 Kasım 2025 – 20 Mart 2026 (bazı programlar erken kapanır), Universitaly vize başvurusu 4 Mayıs – 19 Haziran 2026, İtalya'ya varış için son gün 25 Ocak 2027. Kaynak: https://unige.it/en/internazionale/iscrizioni-internazionali/scadenze",
        ucret: "2026/27: gelire göre (ISEE-U ya da yabancı öğrenciler için özel prosedür); bilimsel programlarda (Sınıf 2) üniversite katkısı yılda 0–3.300 €, ISEE-U sunmayan en yüksek tutarı öder. Buna bölgesel vergi (en az 120 €) ve 16 € damga eklenir. Kaynak: https://unige.it/en/tasse-e-benefici/calcolo-contributo-universitario",
        kaynak: "https://corsi.unige.it/en/corsi/12133",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "it-napoli",
        ad: "Università di Napoli Federico II",
        sehir: "Napoli",
        web: "https://eeit.dieti.unina.it/",
        programlar: [
          { ad: "Electrical Engineering and Information Technology (EEIT)", derece: "Laurea (B.Sc.)", dil: "English (sayfa öğretim dilini açıkça yazmıyor; İngilizce B2 şartı var)", sure: "3 yıl (180 CFU; İtalyan Laurea'sının yasal standardı, program sayfası açıkça yazmıyor)", kaynak: "https://eeit.dieti.unina.it/" }
        ],
        isterler: [
          { baslik: "Giriş testi", detay: "CEnT-S zorunlu seçici testtir: asgari eşik azami puanın %20'si (9/45); Biyoloji bölümü sayılmaz. Matematikte 8/15'in ya da toplamda 23/45'in altı OFA getirir. 2026/27 için alternatifler: CISIA TOLC-I'de Matematik, Fen, Mantık ve Sözel Anlama bölümlerinden toplam en az 15 puan ya da SAT'ta en az 320/1600.", kaynak: "https://eeit.dieti.unina.it/" },
          { baslik: "İngilizce", detay: "En az B2 (CEFR) İngilizce belgesi.", kaynak: "https://eeit.dieti.unina.it/" }
        ],
        basvuruDonemi: "2028/29 girişi için takvim yayımlanmadı. 2026/27 vizeli AB dışı adaylar: ön kabul seçimi Ocak 2026'da açıldı, 31 Mayıs 2026'da kapandı; vize başvurusu ön kayıt mektubu çıkınca; kesin kayıt Temmuz–Ekim (Aralık'a uzayabilir) Napoli'de yüz yüze. Kaynak: https://eeit.dieti.unina.it/index.php/admission/admission-schedule",
        ucret: "AB dışı öğrenciler için yıllık 140 € bölgesel vergi + 16 € damga vergisi; sayfa harcı 'neredeyse sıfır' olarak tanımlıyor. Kaynak: https://eeit.dieti.unina.it/index.php/tuition-fees",
        kaynak: "https://eeit.dieti.unina.it/",
        dogrulamaTarihi: "2026-10-12"
      },
      {
        id: "it-ucbm",
        ad: "Università Campus Bio-Medico di Roma (özel)",
        sehir: "Roma",
        web: "https://www.unicampus.it/en/info/bachelor-s-degree-in-biomedical-engineering-in-english",
        programlar: [
          { ad: "Biomedical Engineering (L-8)", derece: "Laurea (B.Sc.)", dil: "English", sure: "3 yıl", kaynak: "https://www.unicampus.it/2.0/wp-content/uploads/2026/01/ENG_BIOMEDICAL_ENGINEERING_2026-27_call_for_admission-1.pdf" }
        ],
        isterler: [
          { baslik: "Kabul prosedürü", detay: "2026/27'de toplam 60 kontenjan var; 15'i yurtdışında yaşayan yabancı öğrencilere ayrılmış. Bu yerler, şartlar kontrol edildikten sonra başvuru sırasına göre test yapılmadan verilir. Başvuru ücreti 50 €. 'Percorso di Eccellenza' için İngilizce yapılan mülakatla seçilenler 3 yıl boyunca harçta %50 indirim alır.", kaynak: "https://www.unicampus.it/2.0/wp-content/uploads/2026/01/ENG_BIOMEDICAL_ENGINEERING_2026-27_call_for_admission-1.pdf" },
          { baslik: "İngilizce", detay: "Ek B'de listelenen belgelerden biriyle en az CEFR B2.", kaynak: "https://www.unicampus.it/2.0/wp-content/uploads/2026/01/ENG_BIOMEDICAL_ENGINEERING_2026-27_call_for_admission-1.pdf" }
        ],
        basvuruDonemi: "2026/27 döngüsü: II. çağrı 27 Şubat – 9 Nisan 2026, III. çağrı 10 Nisan – 9 Temmuz 2026, IV. çağrı 10 Temmuz – 10 Eylül 2026. Sonraki çağrılar boş yer kalırsa açılır. 2027/28 için şimdiye kadar yalnızca Summer School 2026 katılımcılarına ayrılmış erken oturum yayımlandı (9 Temmuz – 24 Eylül 2026); yurtdışında yaşayan yabancı öğrencilere ayrılan yerler için 2027/28 çağrısı yayımlanmadı. 2026/27 İngilizce çağrısı Ocak 2026'da yayımlanmıştı; 2027/28 çağrısı Ocak 2027, 2028/29 çağrısı Ocak 2028 civarında beklenir.",
        ucret: "Özel üniversite; 2026/27 Biomedical Engineering yıllık tutarı 6.571,50 € + 140 € bölgesel vergi, 3 taksit (kayıtta 2.500 € + 140 €, 25 Ocak 2027'ye kadar 2.000 €, Nisan 2027'de 2.071,50 €). Percorso di Eccellenza'ya seçilenler 3 yıl boyunca %50 indirim alır.",
        kaynak: "https://www.unicampus.it/2.0/wp-content/uploads/2026/01/ENG_BIOMEDICAL_ENGINEERING_2026-27_call_for_admission-1.pdf",
        dogrulamaTarihi: "2026-10-12"
      }
    ],
    kaynaklar: [
      "https://www.universitaly.it/it/studenti-stranieri",
      "https://www.cimea.it/en/statements-of-comparability-and-qualifications-certification.aspx",
      "https://www.cisiaonline.it/en/cent/cent-s/structure-and-syllabus",
      "https://www.polito.it/sites/default/files/2025-12/Call%20for%20applications%20for%20admissions%20Engineering%20_%20LP%202026-27.pdf",
      "https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf",
      "https://www.polimi.it/fileadmin/user_upload/studenti/tasse-borse-agevolazioni-economiche/dsu/bando_2026-2027/DSU_Call_a.y._2026-2027.pdf",
      "https://laziodisco.it/wp-content/uploads/2026/07/BANDO-DIRITTO-ALLO-STUDIO-ENG-26-27.pdf",
      "https://www.edisu.piemonte.it/"
    ]
  }
];
