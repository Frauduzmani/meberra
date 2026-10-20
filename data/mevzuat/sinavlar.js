// AP MEBERRA — Sınav kartları (Tur 5, spec §5.2). Her sınav ayrı kayıt.
// Hazırlayan: Ajan 3 Canan Yılmaz + Ajan 2 Weber & Rossi. Doğrulama: 12 Ekim 2026.
// AP format/süre: College Board AP Central sınav sayfaları (May 2027 sınavı için gösterilen değerler).
// AP tarih/oturum ve hibrit/tam dijital bilgisi data/mevzuat/sinav-takvimi.js ile aynıdır (Türkiye UTC+3: Session 1 10:00, Session 2 14:00).
// denemeKodu yalnızca spec §5.3 listesinden: calculus-ab, calculus-bc, physics-1, chemistry, biology,
// english-language, cs-a, economics, cents. Karşılığı olmayan sınavda null.
// durum: "hazir" = ders sayfası ve deneme sınavı tüm sınav kapsamını karşılıyor; "kismi" = içerik var ama
// eksik ünite ya da bölüm var; "yakinda" = portalda bu sınav için içerik yok.
// Tur 12 aktarımı: araclar/sinav-aktar.js (ek alanlar: dil, duzey, kesinlik, sonKontrol, ucret; şema assets/js/sinav-motor.js).
window.APMEBERRA_SINAVLAR = [
  {
    id: "ap-calculus-ab",
    ad: "AP Calculus AB",
    kategori: "AP",
    kurum: "College Board",
    ulkeler: ["de", "it", "nl", "be"],
    format: "Hibrit dijital: çoktan seçmeliler Bluebook'ta, açık uçlu sorular kağıt kitapçığa el yazısıyla. Section I: 42 MCQ (Part A 29 soru/62 dk hesap makinesiz, Part B 13 soru/38 dk grafik hesap makinesi zorunlu), %50. Section II: 6 FRQ (Part A 2 soru/30 dk hesap makineli, Part B 4 soru/60 dk hesap makinesiz), %50.",
    sure: "3 saat 10 dk (1 sa 40 dk MCQ + 1 sa 30 dk FRQ)",
    puanlama: "1–5 (3 ve üzeri 'qualified'; KMK kuralı (yalnızca ABD diploması için) her AP için en az 3 ister)",
    tarih: "10 Mayıs 2027 Pazartesi, Session 1 (Türkiye saatiyle 10:00). Sipariş son günü 13 Kasım 2026.",
    dersSayfasi: "ap-calculus.html",
    denemeKodu: "calculus-ab",
    durum: "hazir",
    not: "Portalda AB kapsamındaki Unit 1–8'in tümü var (160 soru). College Board, MCQ sayısının ve sürelerin May 2027 sınavıyla güncellendiğini belirtiyor (eski: 45 MCQ / 1 sa 45 dk). KMK kuralında (anabin USA-BV07, yalnızca ABD diploması için; Türk diplomasına uygulanmaz) matematik şartını karşılar. Hollanda: Twente/Groningen Türk diplomasıyla 4 AP (3–5) ister; bu ders Twente'nin kabul ettiği AP listesinde ve 4 AP'den biri olarak sayılır. Şartlar Eylül 2027 dönemi içindir (Twente sayfası, son güncelleme 2 Ekim 2026; Groningen Türkiye sayfası, 12 Ekim 2026). Dikkat: Twente'nin mühendislik ve teknik lisansları matematik şartı için AP Calculus BC ister; AB bu şartı karşılamaz (ama 4 AP sayısına girer). Groningen Computing Science, AI, Mathematics ve IEM için Calculus AB ya da BC yeterli. Belçika: KU Leuven, program gerektiriyorsa AP Calculus sonucunu matematik kanıtı olarak kabul ediyor (SAT, ACT ve SOWISO OMPT ile birlikte; lisans-be.json > lis-be-ap-calc).",
    kaynak: "https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam",
    dil: "en",
    duzey: ["lisans"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    kaynaklar: [
      {
        "ad": "University of Twente, AP CollegeBoard (Eylül 2027 dönemi)",
        "url": "https://www.utwente.nl/en/education/bachelor/application-admission/admission/diplomas/AP-CollegeBoard/",
        "belgeYili": "2026 (Eylül 2027 girişi; güncelleme 02.10.2026)",
        "erisim": "2026-10-16"
      },
      {
        "ad": "University of Groningen, Türkiye lisans giriş şartları (güncelleme 12.10.2026)",
        "url": "https://www.rug.nl/education/application-enrolment-tuition-fees/admission/non-dutch-qualification/bachelor/bachelor-entry-requirements/bachelorlinkscountry/turkey",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "KU Leuven, istenen belgeler",
        "url": "https://www.kuleuven.be/english/apply/requested-documents",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "ap-calculus-bc",
    ad: "AP Calculus BC",
    kategori: "AP",
    kurum: "College Board",
    ulkeler: ["de", "it", "nl", "be"],
    format: "Hibrit dijital. Section I: 42 MCQ (Part A 29 soru/62 dk hesap makinesiz, Part B 13 soru/38 dk grafik hesap makinesi zorunlu), %50. Section II: 6 FRQ (Part A 2 soru/30 dk, Part B 4 soru/60 dk hesap makinesiz), %50.",
    sure: "3 saat 10 dk",
    puanlama: "1–5",
    tarih: "10 Mayıs 2027 Pazartesi, Session 1 (Türkiye saatiyle 10:00). AB ile aynı oturumda olduğu için ikisine birden girilemez.",
    dersSayfasi: "ap-calculus.html",
    denemeKodu: "calculus-bc",
    durum: "hazir",
    not: "Portalda BC kapsamındaki Unit 1–10'un tümü var (223 soru): Unit 9 (Parametric, Polar, Vector-Valued; 24 soru, Tur 9) ve Unit 10 (Infinite Sequences and Series; 39 soru, 2 çok parçalı FRQ tarzı set dahil, Tur 12). KMK kuralında (anabin USA-BV07, yalnızca ABD diploması için; Türk diplomasına uygulanmaz) matematik şartını karşılar. Hollanda: Twente/Groningen Türk diplomasıyla 4 AP (3–5) ister; bu ders Twente'nin kabul ettiği AP listesinde ve 4 AP'den biri olarak sayılır. Şartlar Eylül 2027 dönemi içindir (Twente sayfası, son güncelleme 2 Ekim 2026; Groningen Türkiye sayfası, 12 Ekim 2026). Twente'nin mühendislik ve teknik lisanslarında (Applied Physics, Civil, Electrical, Mechanical, BME, Chemical vb.) matematik şartı yalnız AP Calculus BC ile karşılanır. Belçika: KU Leuven, program gerektiriyorsa AP Calculus sonucunu matematik kanıtı olarak kabul ediyor (SAT, ACT ve SOWISO OMPT ile birlikte; lisans-be.json > lis-be-ap-calc).",
    kaynak: "https://apcentral.collegeboard.org/courses/ap-calculus-bc/exam",
    dil: "en",
    duzey: ["lisans"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    kaynaklar: [
      {
        "ad": "University of Twente, AP CollegeBoard (Eylül 2027 dönemi)",
        "url": "https://www.utwente.nl/en/education/bachelor/application-admission/admission/diplomas/AP-CollegeBoard/",
        "belgeYili": "2026 (Eylül 2027 girişi; güncelleme 02.10.2026)",
        "erisim": "2026-10-16"
      },
      {
        "ad": "University of Groningen, Türkiye lisans giriş şartları (güncelleme 12.10.2026)",
        "url": "https://www.rug.nl/education/application-enrolment-tuition-fees/admission/non-dutch-qualification/bachelor/bachelor-entry-requirements/bachelorlinkscountry/turkey",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "KU Leuven, istenen belgeler",
        "url": "https://www.kuleuven.be/english/apply/requested-documents",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "ap-physics-1",
    ad: "AP Physics 1: Algebra-Based",
    kategori: "AP",
    kurum: "College Board",
    ulkeler: ["de", "it", "nl"],
    format: "Hibrit dijital. Section I: 42 MCQ, 85 dk, %50. Section II: 4 FRQ, 95 dk, %50. Her türden bir FRQ: Mathematical Routines, Translation Between Representations, Experimental Design and Analysis, Qualitative/Quantitative Translation.",
    sure: "3 saat (85 dk + 95 dk)",
    puanlama: "1–5",
    tarih: "5 Mayıs 2027 Çarşamba, Session 2 (Türkiye saatiyle 14:00).",
    dersSayfasi: "ap-physics.html",
    denemeKodu: "physics-1",
    durum: "kismi",
    not: "Portalda 8 üniteden Unit 1–7 var (161 soru; Unit 7 Oscillations 24 soru, Tur 14). Unit 8 (Fluids) henüz yok. Dikkat: anabin USA-BV07 (KMK; yalnızca ABD diploması için) MINT alanında doğa bilimi olarak fiziği yalnızca Physics C: Mechanics ve Physics C: E&M birlikte alındığında sayıyor; Physics 1 fen dersi sayılmaz. anabin ek ders için 'lise üst kademesine uygun ek ders' diyor; Physics 1'in ek ders olarak sayılıp sayılmayacağı Yoruma açık — teyit gerekir (https://anabin.kmk.org). Almanya rotasında bilgi notu: Physics C (Mechanics + E&M) ve Chemistry ayrı derslerdir, ikisi de alınabilir ve ikisi de KMK fen dersi şartını karşılar; ikinci fen dersinin 4. ders sayılması Yoruma açık, güvenli 4. ders CS A ya da Micro + Macro birlikte. KMK kuralı Türk diplomasına giriş hakkı vermez; bu yalnızca uyum ve profil bilgisidir. Hollanda: Twente/Groningen Türk diplomasıyla 4 AP (3–5) ister; bu ders Twente'nin kabul ettiği AP listesinde ve 4 AP'den biri olarak sayılır. Şartlar Eylül 2027 dönemi içindir (Twente sayfası, son güncelleme 2 Ekim 2026; Groningen Türkiye sayfası, 12 Ekim 2026). Fizik şartı: Twente'de Physics 1 tek başına yetmez; şart 'Physics 1 + Physics 2' birlikte ya da Physics C: Mechanics ya da Physics C: E&M ile karşılanır. Groningen Physics ve Applied Physics için AP Physics 2 ister.",
    kaynak: "https://apcentral.collegeboard.org/courses/ap-physics-1/exam",
    dil: "en",
    duzey: ["lisans"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    kaynaklar: [
      {
        "ad": "University of Twente, AP CollegeBoard (Eylül 2027 dönemi)",
        "url": "https://www.utwente.nl/en/education/bachelor/application-admission/admission/diplomas/AP-CollegeBoard/",
        "belgeYili": "2026 (Eylül 2027 girişi; güncelleme 02.10.2026)",
        "erisim": "2026-10-16"
      },
      {
        "ad": "University of Groningen, Türkiye lisans giriş şartları (güncelleme 12.10.2026)",
        "url": "https://www.rug.nl/education/application-enrolment-tuition-fees/admission/non-dutch-qualification/bachelor/bachelor-entry-requirements/bachelorlinkscountry/turkey",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "ap-physics-c-mechanics",
    ad: "AP Physics C: Mechanics",
    kategori: "AP",
    kurum: "College Board",
    ulkeler: ["de", "it", "nl"],
    format: "Hibrit dijital. Section I: 42 MCQ, 85 dk, %50. Section II: 4 FRQ, 95 dk, %50.",
    sure: "3 saat (85 dk + 95 dk)",
    puanlama: "1–5",
    tarih: "3 Mayıs 2027 Pazartesi, Session 1 (Türkiye saatiyle 10:00).",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Portalda Physics C içeriği yok; ap-physics.html yalnızca Physics 1'i kapsıyor. KMK kuralında fizik ancak Physics C: Mechanics ve Physics C: E&M birlikte alınırsa doğa bilimi şartını karşılar. Hollanda: Twente/Groningen Türk diplomasıyla 4 AP (3–5) ister; bu ders Twente'nin kabul ettiği AP listesinde ve 4 AP'den biri olarak sayılır. Şartlar Eylül 2027 dönemi içindir (Twente sayfası, son güncelleme 2 Ekim 2026; Groningen Türkiye sayfası, 12 Ekim 2026). Fizik şartı: Twente'de Physics C: Mechanics tek başına fizik şartını karşılar. Groningen ise Physics ve Applied Physics için Physics C'yi yetersiz bulur, AP Physics 2 ister.",
    kaynak: "https://apcentral.collegeboard.org/courses/ap-physics-c-mechanics/exam",
    dil: "en",
    duzey: ["lisans"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    kaynaklar: [
      {
        "ad": "University of Twente, AP CollegeBoard (Eylül 2027 dönemi)",
        "url": "https://www.utwente.nl/en/education/bachelor/application-admission/admission/diplomas/AP-CollegeBoard/",
        "belgeYili": "2026 (Eylül 2027 girişi; güncelleme 02.10.2026)",
        "erisim": "2026-10-16"
      },
      {
        "ad": "University of Groningen, Türkiye lisans giriş şartları (güncelleme 12.10.2026)",
        "url": "https://www.rug.nl/education/application-enrolment-tuition-fees/admission/non-dutch-qualification/bachelor/bachelor-entry-requirements/bachelorlinkscountry/turkey",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "ap-physics-c-em",
    ad: "AP Physics C: Electricity and Magnetism",
    kategori: "AP",
    kurum: "College Board",
    ulkeler: ["de", "it", "nl"],
    format: "Hibrit dijital. Section I: 42 MCQ, 85 dk, %50. Section II: 4 FRQ, 95 dk, %50.",
    sure: "3 saat (85 dk + 95 dk)",
    puanlama: "1–5",
    tarih: "5 Mayıs 2027 Çarşamba, Session 2 (Türkiye saatiyle 14:00). Physics 1 ile aynı oturumda.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Portalda içerik yok. Physics 1 ile aynı gün ve oturumda olduğu için ikisine aynı yıl girilemez; biri geç sınav haftasına (17–21 Mayıs 2027) alınmalı ya da farklı yıla bırakılmalı. Hollanda: Twente/Groningen Türk diplomasıyla 4 AP (3–5) ister; bu ders Twente'nin kabul ettiği AP listesinde ve 4 AP'den biri olarak sayılır. Şartlar Eylül 2027 dönemi içindir (Twente sayfası, son güncelleme 2 Ekim 2026; Groningen Türkiye sayfası, 12 Ekim 2026). Fizik şartı: Twente'de Physics C: E&M tek başına fizik şartını karşılar. Groningen ise Physics ve Applied Physics için Physics C'yi yetersiz bulur, AP Physics 2 ister.",
    kaynak: "https://apcentral.collegeboard.org/courses/ap-physics-c-electricity-and-magnetism/exam",
    dil: "en",
    duzey: ["lisans"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    kaynaklar: [
      {
        "ad": "University of Twente, AP CollegeBoard (Eylül 2027 dönemi)",
        "url": "https://www.utwente.nl/en/education/bachelor/application-admission/admission/diplomas/AP-CollegeBoard/",
        "belgeYili": "2026 (Eylül 2027 girişi; güncelleme 02.10.2026)",
        "erisim": "2026-10-16"
      },
      {
        "ad": "University of Groningen, Türkiye lisans giriş şartları (güncelleme 12.10.2026)",
        "url": "https://www.rug.nl/education/application-enrolment-tuition-fees/admission/non-dutch-qualification/bachelor/bachelor-entry-requirements/bachelorlinkscountry/turkey",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "ap-chemistry",
    ad: "AP Chemistry",
    kategori: "AP",
    kurum: "College Board",
    ulkeler: ["de", "it", "nl"],
    format: "Hibrit dijital. Section I: 60 MCQ, 1 sa 30 dk, %50. Section II: 7 FRQ (3 uzun soru 10'ar puan + 4 kısa soru 4'er puan), 1 sa 45 dk, %50.",
    sure: "3 saat 15 dk",
    puanlama: "1–5",
    tarih: "6 Mayıs 2027 Perşembe, Session 2 (Türkiye saatiyle 14:00).",
    dersSayfasi: "ap-chemistry.html",
    denemeKodu: "chemistry",
    durum: "hazir",
    not: "Portalda 9 ünitenin tamamı var (Unit 1–9, 200 soru; Unit 9 Thermodynamics and Electrochemistry 28 soru, Tur 14). KMK kuralında (anabin USA-BV07, yalnızca ABD diploması için; Türk diplomasına uygulanmaz) doğa bilimi şartını karşılar. Hollanda: Twente/Groningen Türk diplomasıyla 4 AP (3–5) ister; bu ders Twente'nin kabul ettiği AP listesinde ve 4 AP'den biri olarak sayılır. Şartlar Eylül 2027 dönemi içindir (Twente sayfası, son güncelleme 2 Ekim 2026; Groningen Türkiye sayfası, 12 Ekim 2026). Twente BME, Chemical Science & Engineering ve Technical Medicine için AP Chemistry zorunlu; Groningen Biomedical ve Chemical Engineering için de istiyor.",
    kaynak: "https://apcentral.collegeboard.org/courses/ap-chemistry/exam",
    dil: "en",
    duzey: ["lisans"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    kaynaklar: [
      {
        "ad": "University of Twente, AP CollegeBoard (Eylül 2027 dönemi)",
        "url": "https://www.utwente.nl/en/education/bachelor/application-admission/admission/diplomas/AP-CollegeBoard/",
        "belgeYili": "2026 (Eylül 2027 girişi; güncelleme 02.10.2026)",
        "erisim": "2026-10-16"
      },
      {
        "ad": "University of Groningen, Türkiye lisans giriş şartları (güncelleme 12.10.2026)",
        "url": "https://www.rug.nl/education/application-enrolment-tuition-fees/admission/non-dutch-qualification/bachelor/bachelor-entry-requirements/bachelorlinkscountry/turkey",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "ap-biology",
    ad: "AP Biology",
    kategori: "AP",
    kurum: "College Board",
    ulkeler: ["de", "it", "nl"],
    format: "Hibrit dijital. Section I: 60 MCQ, 1 sa 30 dk, %50. Section II: 6 FRQ (2 uzun soru 9'ar puan + 4 kısa soru 4'er puan), 1 sa 30 dk, %50.",
    sure: "3 saat",
    puanlama: "1–5",
    tarih: "3 Mayıs 2027 Pazartesi, Session 2 (Türkiye saatiyle 14:00).",
    dersSayfasi: "ap-biology.html",
    denemeKodu: "biology",
    durum: "kismi",
    not: "Portalda 8 üniteden Unit 1–7 var (161 soru; Unit 7 Natural Selection 27 soru, Tur 14). Unit 8 (Ecology) henüz yok. 2027'de grafik hesap makinesi yasak; yalnızca dört işlemli (karekök tuşlu) ya da grafik olmayan bilimsel hesap makinesi kullanılabilir. KMK kuralında (anabin USA-BV07, yalnızca ABD diploması için; Türk diplomasına uygulanmaz) doğa bilimi şartını karşılar. Hollanda: Twente/Groningen Türk diplomasıyla 4 AP (3–5) ister; bu ders Twente'nin kabul ettiği AP listesinde ve 4 AP'den biri olarak sayılır. Şartlar Eylül 2027 dönemi içindir (Twente sayfası, son güncelleme 2 Ekim 2026; Groningen Türkiye sayfası, 12 Ekim 2026).",
    kaynak: "https://apcentral.collegeboard.org/courses/ap-biology/exam",
    dil: "en",
    duzey: ["lisans"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    kaynaklar: [
      {
        "ad": "University of Twente, AP CollegeBoard (Eylül 2027 dönemi)",
        "url": "https://www.utwente.nl/en/education/bachelor/application-admission/admission/diplomas/AP-CollegeBoard/",
        "belgeYili": "2026 (Eylül 2027 girişi; güncelleme 02.10.2026)",
        "erisim": "2026-10-16"
      },
      {
        "ad": "University of Groningen, Türkiye lisans giriş şartları (güncelleme 12.10.2026)",
        "url": "https://www.rug.nl/education/application-enrolment-tuition-fees/admission/non-dutch-qualification/bachelor/bachelor-entry-requirements/bachelorlinkscountry/turkey",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "ap-english-language",
    ad: "AP English Language and Composition",
    kategori: "AP",
    kurum: "College Board",
    ulkeler: ["de", "it", "nl"],
    format: "Tam dijital (Bluebook). Section I: 45 MCQ (23–25 okuma, 20–22 yazma sorusu), 1 saat, %45. Section II: 3 FRQ (Synthesis, Rhetorical Analysis, Argument), 2 sa 15 dk (15 dk okuma süresi dahil), %55.",
    sure: "3 saat 15 dk",
    puanlama: "1–5",
    tarih: "12 Mayıs 2027 Çarşamba, Session 1 (Türkiye saatiyle 10:00).",
    dersSayfasi: "ap-english.html",
    denemeKodu: "english-language",
    durum: "kismi",
    not: "Portalda Reading ve Writing MCQ istasyonları var (32 soru). FRQ yazım istasyonu yok. KMK kuralında (anabin USA-BV07, yalnızca ABD diploması için; Türk diplomasına uygulanmaz) dil şartını karşılar. Tablet kullanılıyorsa harici klavye zorunludur. Hollanda: Twente/Groningen Türk diplomasıyla 4 AP (3–5) ister; bu ders Twente'nin kabul ettiği AP listesinde ve 4 AP'den biri olarak sayılır. Şartlar Eylül 2027 dönemi içindir (Twente sayfası, son güncelleme 2 Ekim 2026; Groningen Türkiye sayfası, 12 Ekim 2026).",
    kaynak: "https://apcentral.collegeboard.org/courses/ap-english-language-and-composition/exam",
    dil: "en",
    duzey: ["lisans"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    kaynaklar: [
      {
        "ad": "University of Twente, AP CollegeBoard (Eylül 2027 dönemi)",
        "url": "https://www.utwente.nl/en/education/bachelor/application-admission/admission/diplomas/AP-CollegeBoard/",
        "belgeYili": "2026 (Eylül 2027 girişi; güncelleme 02.10.2026)",
        "erisim": "2026-10-16"
      },
      {
        "ad": "University of Groningen, Türkiye lisans giriş şartları (güncelleme 12.10.2026)",
        "url": "https://www.rug.nl/education/application-enrolment-tuition-fees/admission/non-dutch-qualification/bachelor/bachelor-entry-requirements/bachelorlinkscountry/turkey",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "ap-computer-science-a",
    ad: "AP Computer Science A",
    kategori: "AP",
    kurum: "College Board",
    ulkeler: ["de", "it", "nl"],
    format: "Tam dijital (Bluebook). Section I: 42 MCQ, 1 sa 30 dk, %55. Section II: 4 FRQ (kod yazma), 1 sa 30 dk, %45. Java Quick Reference Bluebook'ta verilir.",
    sure: "3 saat",
    puanlama: "1–5",
    tarih: "12 Mayıs 2027 Çarşamba, Session 2 (Türkiye saatiyle 14:00).",
    dersSayfasi: "ap-electives.html",
    denemeKodu: "cs-a",
    durum: "kismi",
    not: "Portalda Unit 1–4 MCQ istasyonu var (20 soru); FRQ kod yazma çalışması yok. KMK kuralında (anabin USA-BV07, yalnızca ABD diploması için; Türk diplomasına uygulanmaz) 'ek AP' olarak kullanılabilir. Hollanda: Twente/Groningen Türk diplomasıyla 4 AP (3–5) ister; bu ders Twente'nin kabul ettiği AP listesinde ve 4 AP'den biri olarak sayılır. Şartlar Eylül 2027 dönemi içindir (Twente sayfası, son güncelleme 2 Ekim 2026; Groningen Türkiye sayfası, 12 Ekim 2026).",
    kaynak: "https://apcentral.collegeboard.org/courses/ap-computer-science-a/exam",
    dil: "en",
    duzey: ["lisans"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    kaynaklar: [
      {
        "ad": "University of Twente, AP CollegeBoard (Eylül 2027 dönemi)",
        "url": "https://www.utwente.nl/en/education/bachelor/application-admission/admission/diplomas/AP-CollegeBoard/",
        "belgeYili": "2026 (Eylül 2027 girişi; güncelleme 02.10.2026)",
        "erisim": "2026-10-16"
      },
      {
        "ad": "University of Groningen, Türkiye lisans giriş şartları (güncelleme 12.10.2026)",
        "url": "https://www.rug.nl/education/application-enrolment-tuition-fees/admission/non-dutch-qualification/bachelor/bachelor-entry-requirements/bachelorlinkscountry/turkey",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "ap-microeconomics",
    ad: "AP Microeconomics",
    kategori: "AP",
    kurum: "College Board",
    ulkeler: ["de", "it", "nl"],
    format: "Hibrit dijital. Section I: 60 MCQ, 1 sa 10 dk, %66. Section II: 3 FRQ (1 uzun + 2 kısa), 1 saat (10 dk okuma süresi dahil), %33. Yalnızca dört işlemli hesap makinesi.",
    sure: "2 saat 10 dk",
    puanlama: "1–5",
    tarih: "4 Mayıs 2027 Salı, Session 2 (Türkiye saatiyle 14:00).",
    dersSayfasi: "ap-electives.html",
    denemeKodu: "economics",
    durum: "kismi",
    not: "'economics' deneme kodu karma Micro + Macro bankasını açar (10 Micro + 10 Macro soru). Yalnızca Micro'ya ayrılmış bir deneme yok. KMK kuralında (anabin USA-BV07, yalnızca ABD diploması için) Micro tek başına ek ders sayılmaz; yalnızca Microeconomics + Macroeconomics birlikte (her biri 0,5) ek ders şartını karşılar (https://anabin.kmk.org). Hollanda: Twente/Groningen Türk diplomasıyla 4 AP (3–5) ister; bu ders Twente'nin kabul ettiği AP listesinde ve 4 AP'den biri olarak sayılır. Şartlar Eylül 2027 dönemi içindir (Twente sayfası, son güncelleme 2 Ekim 2026; Groningen Türkiye sayfası, 12 Ekim 2026).",
    kaynak: "https://apcentral.collegeboard.org/courses/ap-microeconomics/exam",
    dil: "en",
    duzey: ["lisans"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    kaynaklar: [
      {
        "ad": "University of Twente, AP CollegeBoard (Eylül 2027 dönemi)",
        "url": "https://www.utwente.nl/en/education/bachelor/application-admission/admission/diplomas/AP-CollegeBoard/",
        "belgeYili": "2026 (Eylül 2027 girişi; güncelleme 02.10.2026)",
        "erisim": "2026-10-16"
      },
      {
        "ad": "University of Groningen, Türkiye lisans giriş şartları (güncelleme 12.10.2026)",
        "url": "https://www.rug.nl/education/application-enrolment-tuition-fees/admission/non-dutch-qualification/bachelor/bachelor-entry-requirements/bachelorlinkscountry/turkey",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "ap-macroeconomics",
    ad: "AP Macroeconomics",
    kategori: "AP",
    kurum: "College Board",
    ulkeler: ["de", "it", "nl"],
    format: "Hibrit dijital. Section I: 60 MCQ, 1 sa 10 dk, %66. Section II: 3 FRQ (1 uzun + 2 kısa), 1 saat (10 dk okuma süresi dahil), %33. Yalnızca dört işlemli hesap makinesi.",
    sure: "2 saat 10 dk",
    puanlama: "1–5",
    tarih: "7 Mayıs 2027 Cuma, Session 2 (Türkiye saatiyle 14:00).",
    dersSayfasi: "ap-electives.html",
    denemeKodu: "economics",
    durum: "kismi",
    not: "'economics' deneme kodu karma Micro + Macro bankasını açar (10 Micro + 10 Macro soru). Yalnızca Macro'ya ayrılmış bir deneme yok. KMK kuralında (anabin USA-BV07, yalnızca ABD diploması için) Macro tek başına ek ders sayılmaz; yalnızca Micro + Macro birlikte geçerlidir (https://anabin.kmk.org). Hollanda: Twente/Groningen Türk diplomasıyla 4 AP (3–5) ister; bu ders Twente'nin kabul ettiği AP listesinde ve 4 AP'den biri olarak sayılır. Şartlar Eylül 2027 dönemi içindir (Twente sayfası, son güncelleme 2 Ekim 2026; Groningen Türkiye sayfası, 12 Ekim 2026).",
    kaynak: "https://apcentral.collegeboard.org/courses/ap-macroeconomics/exam",
    dil: "en",
    duzey: ["lisans"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    kaynaklar: [
      {
        "ad": "University of Twente, AP CollegeBoard (Eylül 2027 dönemi)",
        "url": "https://www.utwente.nl/en/education/bachelor/application-admission/admission/diplomas/AP-CollegeBoard/",
        "belgeYili": "2026 (Eylül 2027 girişi; güncelleme 02.10.2026)",
        "erisim": "2026-10-16"
      },
      {
        "ad": "University of Groningen, Türkiye lisans giriş şartları (güncelleme 12.10.2026)",
        "url": "https://www.rug.nl/education/application-enrolment-tuition-fees/admission/non-dutch-qualification/bachelor/bachelor-entry-requirements/bachelorlinkscountry/turkey",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "cent-s",
    ad: "CEnT-S (CISIA English Test – Sciences)",
    kategori: "Giriş Sınavı",
    kurum: "CISIA",
    ulkeler: ["it"],
    format: "Bilgisayarda; üniversitede (@UNI) ya da evde (CEnT@HOME / @CASA; hangi biçimi kabul ettiğine her üniversite kendisi karar verir). 65 soru, 6 bölüm: Reading and comprehension 10 soru/30 dk, Mathematics 15/30 dk, Reasoning on texts and data 15/30 dk, Biology 10/20 dk, Chemistry 10/20 dk, Physics 5/10 dk. Her bölümün süresi ayrıdır; artan süre başka bölüme aktarılmaz ve önceki bölüme dönülmez.",
    sure: "140 dk",
    puanlama: "Doğru +1, yanlış −0,25, boş 0 (ham puan); resmi sonuç zorluk katsayısıyla normalize edilmiş puandır.",
    tarih: "Her makro dönemde yalnızca 1 kez alınabilir. Tarihleri üniversiteler açar. 2025/26 tarihleri 27 Kasım 2025'ten 15 Ekim 2026'ya kadardı. 2026/27 tarihleri ve ücreti henüz yayımlanmadı: CISIA 2025/26 kurallarına göre değişiklikler her yıl 31 Ekim'e kadar duyurulur; CISIA takvimi 2026/27 ilk makro dönem için 26 Kasım ve 17 Aralık 2026 oturumlarını gösteriyor (Messina, @UNI; testcisia.it takvimi, 20 Ekim 2026); Padova sayfası da aynı tarihleri veriyor. 2025/26 ücreti 55 €'du ('All about CEnT' sayfası hâlâ 55 € yazıyor).",
    dersSayfasi: "sinav-cents.html",
    denemeKodu: "cents",
    durum: "kismi",
    not: "Kullanan üniversiteler: Padova Information Engineering (tek seçenek; 2026 çağrısında ≥38 normalize puan + Matematikte en az 7 doğru); Sapienza ACSAI (English TOLC-I ve SAT ile birlikte); PoliMi (TOL alternatifi; ≥75/100 ile erken kayıt 2026-27 çağrısı Art. 3'e göre yalnızca İtalyanca programlar için, İngilizce programlarda \"specific rankings\"; PoliMi dönüşümünde Biyoloji ve Kimya sayılmaz); CEnT-S geçerliliği: bir test sezonu yalnızca bir sonraki akademik yılın kaydına sayılır, Kasım–Aralık 2026 oturumları 2027/28 kaydı içindir (https://guide.cisiaonline.it/en/node/206); Napoli EEIT; Trento (2026/27 çağrısına göre AB dışı adaylar için, kısmen doğrulandı). CISIA'nın Kasım 2025 tarihli duyurusu ilk sürümü 55 soru/110 dk olarak anlatıyordu; güncel yapı sayfası 65 soru/140 dk diyor ve burada güncel sayfa esas alındı.",
    kaynak: "https://www.cisiaonline.it/en/cent/cent-s/structure-and-syllabus"
  },
  {
    id: "til-i",
    ad: "TIL-I (Test in Laib – Ingegneria)",
    kategori: "Giriş Sınavı",
    kurum: "Politecnico di Torino",
    ulkeler: ["it"],
    format: "Torino ya da Mondovì kampüsündeki bilgisayar laboratuvarında (LAIB) yüz yüze; İngilizce ya da İtalyanca. Her adaya rastgele seçilmiş farklı sorular gelir. 42 soru, 5 şık: Math 16 soru/36 dk, Reading Comprehension and Logical Reasoning 10/20 dk, Physics 10/22 dk, Basic Technical Knowledge 6/12 dk.",
    sure: "1 saat 30 dk",
    puanlama: "Doğru +1, boş 0, yanlış −0,25; puan 100 üzerinden. ≥60/100 garantili kabul (ilk tercih), ≥30/100 sıralamaya girme eşiği. Matematik bölümünde 4,8/16'nın altı OFA (ek eğitim yükümlülüğü) getirir.",
    tarih: "2026/27 döngüsü (referans): vize gerektiren adaylar için oturumlar 19 Şubat – 22 Mayıs 2026. Ücret 50 €; toplamda en fazla 3 kez girilebilir. Kayıt anında lise son sınıfta olmak gerekir; 2026/27'de 11. sınıfta olan aday için bu 2027/28 öğretim yılıdır. 2028 oturum tarihleri yayımlanmadı: PoliTo 2028/29 çağrısında (beklenen Aralık 2027) yer alacak.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Yalnızca PoliTo kullanır. SAT alternatifi (her bölümden ≥650) garantili kabul sağlamaz.",
    kaynak: "https://www.polito.it/sites/default/files/2025-12/Call%20for%20applications%20for%20admissions%20Engineering%20_%20LP%202026-27.pdf"
  },
  {
    id: "polimi-tol",
    ad: "TOL (Test OnLine) — Politecnico di Milano",
    kategori: "Giriş Sınavı",
    kurum: "Politecnico di Milano",
    ulkeler: ["it"],
    format: "Uzaktan gözetimli çevrimiçi sınav (Safe Exam Browser, webcam ve telefonla izleme); İtalyanca yapılır. 65 soru, 5 şık: English 30 soru/15 dk, Logic-Mathematics-Statistics 25/65 dk, Verbal Comprehension 5/10 dk, Physics 5/10 dk.",
    sure: "100 dk",
    puanlama: "Doğru +1, yanlış −0,25, boş 0. Bölüm ağırlıkları: English 1/3, Matematik 2,6, Sözel 3, Fizik 2. 100 üzerinden; kabul için ≥30/100. Son sınıftan bir önceki yıl ≥75/100 alan erken kayda girer (2026-27 çağrısı Art. 3: yalnızca İtalyanca programlar; İngilizce programlarda \"specific rankings\"). English bölümünde 24'ten az doğru OFA English getirir.",
    tarih: "2026-27 çağrısı: EARLY TEST pencereleri 11 Mart – 31 Mayıs 2026 ve 1 Haziran – 16 Temmuz 2026 (2025/26'da 11. sınıf olanlar için); STANDARD TEST pencereleri 1 Şubat – 10 Mart ve 11 Mart – 31 Mayıs 2026. Ücret 35 €. 2026/27'de 11. sınıfta olan adayların 2027 pencereleri yayımlanmadı: 2027-28 çağrısında yer alacak (beklenen Kasım 2026; önceki çağrı 19 Kasım 2025).",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "TOL İtalyanca yapıldığı için İngilizce programlara başvuran adayın PoliMi'nin kabul ettiği CEnT-S ya da SAT'a (her bölümden ≥620) girmesi daha uygun. Alternatif test puanları PoliMi'nin formülüyle TOL ölçeğine çevrilir.",
    kaynak: "https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf"
  },
  {
    id: "sat",
    ad: "SAT (Digital SAT)",
    kategori: "Giriş Sınavı",
    kurum: "College Board",
    ulkeler: ["it", "de", "fi", "be"],
    format: "Dijital (Bluebook), test merkezinde. Reading and Writing: 2 modül, 54 soru, 64 dk. Math: 2 modül, 44 soru, 70 dk (bazı sorularda cevap yazılır). Bölümler arasında 10 dk ara.",
    sure: "2 saat 14 dk (+10 dk ara)",
    puanlama: "400–1600 (her bölüm 200–800)",
    tarih: "2026-27 tarihleri: 7 Kasım 2026, 5 Aralık 2026, 6 Mart 2027, 1 Mayıs 2027, 5 Haziran 2027 (3 Ekim 2026 geçti). Kayıt son günleri sınavdan yaklaşık 2 hafta önce.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Kullanan üniversiteler: PoliMi (her bölümden ≥620); PoliTo (her bölümden ≥650, garantili kabul yok, kurum kodu 7679); Sapienza ACSAI (kurum kodu 9038); Milano AI (yurtdışında oturan AB dışı adaylar için giriş testi); Napoli EEIT (≥320/1600); KIT CBS (yetenek testi seçeneklerinden biri). Puan ölçeği kaynağı: https://satsuite.collegeboard.org/scores/what-scores-mean Finlandiya: Aalto İngilizce lisanslarında Türk diplomalı adayı yalnızca SAT ya da ACT ile sıralıyor; Science and Technology için en az SAT 1350 ve matematik 700. 2027 alımında 1 Ocak 2025 ve sonrası sınavlar sayılıyor, sonuç Aalto'ya 29 Ocak 2027 15.00'e kadar ulaşmalı. Belçika: KU Leuven, program gerektiriyorsa SAT'ı matematik kanıtı olarak kabul ediyor. İrlanda (Trinity) SAT'ı yalnızca ABD lise diplomasıyla birlikte sayıyor; Türk diploması için geçerli değil, bu yüzden 'ie' eklenmedi.",
    kaynak: "https://satsuite.collegeboard.org/sat/whats-on-the-test/structure",
    dil: "en",
    duzey: ["lisans"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    kaynaklar: [
      {
        "ad": "Aalto, İngilizce lisans: lise diplomasıyla başvuru (2027)",
        "url": "https://www.aalto.fi/en/admission-services/english-taught-bachelors-programmes-i-am-applying-with-a-high-school-diploma",
        "belgeYili": "2027 alımı",
        "erisim": "2026-10-15"
      },
      {
        "ad": "KU Leuven, istenen belgeler",
        "url": "https://www.kuleuven.be/english/apply/requested-documents",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Trinity College Dublin, Türkiye sayfası",
        "url": "https://www.tcd.ie/study/country/turkey/",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "testas",
    ad: "TestAS",
    kategori: "Giriş Sınavı",
    kurum: "g.a.s.t. (TestAS)",
    ulkeler: ["de"],
    format: "Dijital ya da kağıt tabanlı; Almanca ya da İngilizce. Genel ve alana özgü çalışma yeteneğini ölçer. Dijital TestAS iki bölümdür: Core Module (üç alt test: Figure Sequences, Mathematical Equations, Latin Squares; her biri 20 madde ve 25 dk) ve seçilen bir Subject Module (10–15 testlet, her birinde 4–8 soru, 90 dk). Altı alan modülü var; mühendislik için Engineering modülü.",
    sure: "Dijital: Core Module yaklaşık 90 dk (yönergeler dahil), 30 dk ara, Subject Module 90 dk; toplam yaklaşık 3,5 saat (resmi sayfadaki sürelerin toplamı).",
    puanlama: "Dijital: Core ve Subject Module için ayrı ayrı TestAS puanı (0–200) ve yüzdelik sıra (1–100); toplam puan 0–400. Kağıt tabanlı sürümde standart puan (70–130) ve yüzdelik sıra verilir; iki biçim dönüşüm tablosuyla karşılaştırılır. Üniversite eşikleri: KIT Core Test'te 75. yüzdelik; THWS Core ve Engineering'de en az 100 (THWS hangi ölçek olduğunu yazmıyor).",
    tarih: "26 Kasım 2026, 25 Şubat 2027, 18 Mart 2027.",
    sonrakiTarih: "2027-02-25", // K14-5 (Ajan 13, 20 Ekim 2026)
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "KIT Carl Benz School başvurusunda SAT ya da ACT yerine kullanılabilir. Saarland Computer Science'ın 'yetenek yolu' tanınan bir standart yetenek testi istiyor. Saarland SSS'sine göre TestAS ve dijital TestAS bu yolda kabul edilir; asgari puan yok, yerler sıralamayla doluyor. THWS Robotics, Almanya giriş yeterliliği olmayan AB dışı adaylardan TestAS (Core ve Engineering en az 100) ya da SAT (en az 1.050) istiyor.",
    kaynak: "https://www.testas.de/en/"
  },
  {
    id: "ielts-academic",
    ad: "IELTS Academic",
    kategori: "Dil Sınavı",
    kurum: "IELTS (British Council / IDP / Cambridge)",
    ulkeler: ["de", "it", "at", "ch", "nl", "be", "fr", "es", "se", "fi", "dk", "ie", "hu", "pl", "cz"],
    format: "Test merkezinde (kağıt ya da bilgisayar) veya çevrimiçi; biçim her yerde aynı. Listening yaklaşık 30 dk, Reading 60 dk (aktarma dahil), Writing 60 dk, Speaking 11–14 dk.",
    sure: "2 saat 45 dk",
    puanlama: "Bant 1–9 (yarım bant). Genel puan dört bölümün eşit ağırlıklı ortalamasıdır; .25 yukarı yarım banda, .75 yukarı tam banda yuvarlanır.",
    tarih: "Bilgisayarda neredeyse her gün. British Council Türkiye 24 şehirde sınav yapıyor (Adana, Aksaray, Ankara, Antalya, Bursa, Erzurum, Eskişehir, Gaziantep, İstanbul, İzmir, Karabük, Karaman, Kayseri, Kırklareli, Kocaeli, Konya, Manisa, Mersin, Muğla, Ordu, Samsun, Tekirdağ, Uşak, Van). IDP İstanbul'da da günlük oturum var. Sınava yalnızca geçerli, fotoğraflı T.C. kimlik kartı ya da pasaportla girilir.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Eşik örnekleri: TUHH 6.5 (kayıtta), KIT 6.5 (hiçbir bölüm <5.5), Schmalkalden 6.5, HSHL 6.0, TH Rosenheim 6.0. İtalya'daki programların çoğu B2 istiyor. Puan ölçeği kaynağı: https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail Ülke eşikleri (Tur 11): Lisans: Twente 6.0 (bölüm en az 5.5), Delft 6.5, DTU 6.5, Trinity 6.5 (bölüm 6.0), İsveç 6.5 (bölüm 5.5), BME 5.5, Gdańsk 5.5, ÇVUT 6.0; Aalto İngilizce lisans dil belgesi istemiyor. Yüksek lisans: TUM 6.5, KIT 6.5, Stuttgart INFOTECH 7.0, TU Graz 7.0, ETH (puan programda), Delft 7.0 (bölüm 6.5), KU Leuven 6.5, Gent B2 6.0 / C1 7.0, UC3M 5.5–6.5, PoliMi 6.0, PoliTo 5.5, Aalto 6.5, DTU 6.5 (bölüm 6.0), UCD 6.5. Dikkat: Delft YL IELTS Online kabul etmiyor; DTU IELTS Online ve One Skill Retake kabul etmiyor. Türkiye'de İngilizce okunmuş lisans Delft, KU Leuven, TU Graz ve PoliTo'da muafiyet sağlamıyor. Jean Monnet 2027-2028 (YL bursu): bilgisayarda, çevrimiçi ve kağıt IELTS Academic kabul; One Skill Retake belgesi tüm bölüm puanlarını ve genel bandı içeriyorsa kabul, yalnız genel puan dikkate alınır (Açıklamalar, Ekim 2026).",
    kaynak: "https://ielts.org/take-a-test/test-types/ielts-academic-test",
    dil: "en",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-16",
    ucret: "Türkiye: British Council bilgisayarda IELTS Academic 12.000 TRY (BC tarih tablosu, 18 Ekim 2026 Ankara oturumu); IDP bilgisayarda Academic 12.210 TL (12 Ekim 2026 okuması). Kayıt ekranında son fiyatı kontrol et.",
    kaynaklar: [
      {
        "ad": "British Council Türkiye, IELTS tarihleri, ücretleri ve yerleri",
        "url": "https://www.britishcouncil.org.tr/exam/ielts/dates-fees-locations",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "IDP IELTS Türkiye, tarihler ve ücretler",
        "url": "https://ielts.idp.com/turkey/test-dates",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "toefl-ibt",
    ad: "TOEFL iBT",
    kategori: "Dil Sınavı",
    kurum: "ETS",
    ulkeler: ["de", "it", "at", "ch", "nl", "be", "fr", "es", "se", "fi", "dk", "ie", "hu", "pl", "cz"],
    format: "Test merkezinde ya da evde. Reading 50 madde (~30 dk), Listening 47 madde (~29 dk), Writing 12 madde (~23 dk), Speaking 11 madde (~8 dk). Reading ve Listening adaptif olduğu için süre ve madde sayısı değişebilir.",
    sure: "Yaklaşık 2 saat (yönergeler dahil)",
    puanlama: "21 Ocak 2026'dan itibaren 1–6 bant (yarım puan aralıklı, CEFR uyumlu). Geçiş döneminde (Ocak 2028'e kadar) karşılaştırmalı 0–120 toplam da raporlanır.",
    tarih: "Türkiye kayıt ücreti 185 ABD doları (ETS ücret tablosu). Sınava 7 günden az kala yapılan hızlı kayıt 49 $, tarih değişikliği 69 $. ETS ücret sayfası tarih listesi vermiyor; İstanbul merkez tarihleri ETS hesabından kayıt sırasında seçilir.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Üniversite eşikleri hâlâ 0–120 ölçeğinde: TUHH 90, KIT 90, Schmalkalden 86, HSHL 80, TH Rosenheim 72. Puan ölçeği kaynağı: https://www.ets.org/toefl/test-takers/ibt/scores/understand-scores.html Yeni 1–6 ölçeğinde eşikler (21 Ocak 2026 sonrası sınavlar): Twente 4.5, Delft lisans 5 (öncesi 90), Delft YL 5 (bölüm 4.5), İsveç 4.5 (bölüm 4), DTU 4.5, Trinity 4.5, Gdańsk 4, Aalto YL 4.5 (bölüm 4.0). Eski 0–120 ölçeğinde: TUM 88 (MyBest kabul edilmez), KIT 90, Stuttgart INFOTECH 95, TU Graz 95, KU Leuven 85, PoliMi YL 78, BME 72, ÇVUT 70. Sonuç 2 yıl geçerli.",
    kaynak: "https://www.ets.org/toefl/test-takers/ibt/about/content.html",
    dil: "en",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    ucret: "Türkiye: 185 ABD doları (ETS ücret tablosu, 12 Ekim 2026 okuması; tablo dinamik, kayıtta kontrol et). Hızlı kayıt 49, tarih değişikliği 69 dolar.",
    kaynaklar: [
      {
        "ad": "ETS, TOEFL iBT ücretleri",
        "url": "https://www.ets.org/toefl/test-takers/ibt/register/fees.html",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "ETS, 1–6 ölçek güncellemesi",
        "url": "https://www.ets.org/toefl/institutions/ibt/score-scale-update.html",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "goethe-c1-c2",
    ad: "Goethe-Zertifikat C1 / C2: GDS",
    kategori: "Dil Sınavı",
    kurum: "Goethe-Institut",
    ulkeler: ["de", "at", "ch"],
    format: "Dört modül: Lesen, Hören, Schreiben, Sprechen (C1'de sözlü sınav çiftler hâlinde). Seçili merkezlerde dijital ya da kağıt. C1 süreleri: Lesen 65 dk, Hören yaklaşık 40 dk, Schreiben 75 dk, Sprechen 20 dk. C2 süreleri bu turda resmi sayfadan okunamadı.",
    sure: "C1: Okuma 65 dk, Dinleme 40 dk, Yazma 75 dk, Konuşma 20 dk (toplam yaklaşık 3 saat 20 dk). C2: Dinleme 35 dk, Okuma 80 dk, Yazma 80 dk, Konuşma 15 dk (toplam yaklaşık 3 saat 30 dk). Kaynak: Goethe-Institut Türkiye C1 ve C2 sayfaları.",
    puanlama: "C1 sertifikası CEFR C1, C2: GDS sertifikası CEFR C2 düzeyini belgeler. Modüller ayrı ayrı ya da birlikte alınabilir (C2 sayfası: 'Dört modül tek tek veya kombinasyon halinde kaydedilebilir'). Geçme eşiği bu turda okunmadı (sınav yönetmeliği PDF'inde).",
    tarih: "Türkiye'de sınav birimleri: Ankara, İstanbul (Beyoğlu), İzmir; tarih listesinde Adana da var. C1 oturumları (Goethe-Institut Türkiye C1 sayfası, 19 Ekim 2026): 2 Kasım 2026 İstanbul (bilgisayarda), 4 Kasım Ankara (kağıt), 17 Kasım İstanbul (kağıt), 1 Aralık İstanbul (kağıt), 9 Aralık Ankara (bilgisayarda), 19 Ocak 2027 İstanbul (kağıt), 16 Şubat 2027 İstanbul (kağıt). 2027 oturumlarına kayıt 22 Ekim 2026 saat 11:00'de açılıyor. C2: Türkiye sayfasında şu an tarih yok ('Şu anda sınav tarihi bulunmamaktadır'); enstitüyle iletişim isteniyor. İstanbul sınav birimi: pruefung-istanbul@goethe.de (telefonla bilgi Pzt–Cum 10:00–12:00 ve 15:30–16:30). Goethe, C1'e 16, C2'ye 18 yaşından itibaren girmeyi öneriyor.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Almanya: Goethe C2 (GDS) çerçeve yönetmelikte (RO-DT, Kasım 2025) DSH'den muafiyet sağlar; Goethe C1 listede yok, kabulü üniversiteye kalır (KIT Informatik kabul ediyor, TUM Goethe için C2 istiyor). İsviçre: ETH Goethe C1 kabul eder (2 yıl geçerli), Goethe C2 5 yıl geçerli; lisans dil belgesi en geç 31 Mart'ta teslim. Avusturya: TU Wien YL Goethe C1 kabul ediyor (2 yıl). Lisans ve YL farkı yok; fark üniversitenin kabul listesinde. Tur 11: lisans-de.json > lis-de-yerel-goethe-c1, yl-de.json > yl-de-yerel-goethe-c1, lisans-ch.json > lis-ch-de-c1, yl-at.json > yl-at-yerel-dil-c1. Tur 14 (19–20 Ekim 2026): Türkiye sınav sayfaları gerçek tarayıcıyla açıldı; C1 tarih ve TL ücretleri doğrulandı. Bilgi: Goethe-Zertifikat B2 İstanbul oturumları 12, 16, 23 Kasım ve 7 Aralık 2026 (tam sınav 17.860 TL, tek modül 6.410 TL; Adana 19.860 TL). Türk öğrenci için: C2 Türkiye'de şu an takvimde yok; DSH muafiyeti C2'ye bağlı olduğundan (RO-DT) C2 isteyen programlar için tarih Goethe İstanbul'dan yazılı sorulmalı.",
    kaynak: "https://www.goethe.de/ins/tr/tr/spr/prf.html",
    dil: "de",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-19",
    ucret: "C1 (KDV'den muaf): 2026 oturumları tam sınav 19.030 TL, tek modül 8.570 TL; 2027 oturumları tam sınav 20.930 TL, tek modül 9.430 TL. C2: tarih yayımlanmadığı için ücret görünmüyor (Teyit gerekir).",
    kaynaklar: [
      {
        "ad": "Goethe-Institut Türkiye, Almanca sınavları (merkezler ve iletişim)",
        "url": "https://www.goethe.de/ins/tr/tr/spr/prf.html",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Goethe-Institut London, Goethe-Zertifikat C1 modülleri",
        "url": "https://www.goethe.de/ins/gb/de/m/sta/lon/prf/gzc1/w24.html",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "HRK/KMK RO-DT (HRK 04.11.2025, KMK 27.11.2025)",
        "url": "https://www.hrk.de/fileadmin/redaktion/hrk/02-Dokumente/02-07-Internationales/02-07-22_DSH/20260105_RO-DT_Fassung-HRK-v-04-11-2025-und-KMK-v-27-11-2025.pdf",
        "belgeYili": "2025",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Goethe-Institut Türkiye, Goethe-Zertifikat C1 (tarihler ve TL ücretleri)",
        "url": "https://www.goethe.de/ins/tr/tr/spr/prf/gzc1.cfm",
        "belgeYili": "2026 (Kasım 2026–Şubat 2027 oturumları)",
        "erisim": "2026-10-19"
      },
      {
        "ad": "Goethe-Institut Türkiye, Goethe-Zertifikat C2: GDS (modül süreleri; Türkiye'de tarih yok)",
        "url": "https://www.goethe.de/ins/tr/tr/spr/prf/gzc2.cfm",
        "belgeYili": "2026",
        "erisim": "2026-10-19"
      },
      {
        "ad": "Goethe-Institut Türkiye, Goethe-Zertifikat B2 (tarihler ve TL ücretleri)",
        "url": "https://www.goethe.de/ins/tr/tr/spr/prf/gzb2.cfm",
        "belgeYili": "2026 (Kasım–Aralık 2026 oturumları)",
        "erisim": "2026-10-20"
      }
    ]
  },
  {
    id: "testdaf",
    ad: "TestDaF (dijital ve kağıt)",
    kategori: "Dil Sınavı",
    kurum: "g.a.s.t. (TestDaF-Institut)",
    ulkeler: ["de", "at", "ch"],
    format: "Okuma, dinleme, yazma ve konuşma; dört bölüm aynı gün ayrı puanlanır. Dijital ve kağıt tabanlı iki eşdeğer biçim. İstenildiği kadar tekrar edilebilir.",
    sure: "Dijital TestDaF: Okuma yaklaşık 55 dk, Dinleme yaklaşık 40 dk, Yazma yaklaşık 60 dk, Konuşma yaklaşık 35 dk (toplam yaklaşık 3 saat 10 dk; görev sayısı ve süre değişebilir). Kağıt TestDaF: 60 + 40 + 60 + 35 dk, 'reine Prüfungszeit' 3 saat 15 dk; bölümler arasında mola var (süresini test merkezi bildirir).",
    puanlama: "Her bölüm için TDN 3, 4 ya da 5 (B2–C1 aralığı). Almanya'da tam giriş için dört bölümün her birinde en az TDN 4; ortalama sayılmaz.",
    tarih: "Sınav tarihleri ve kayıt son günleri (g.a.s.t./TestDaF-Institut, 19 Ekim 2026): Dijital 12 Kasım 2026 (kayıt 31 Ekim), Dijital 10 Aralık 2026 (kayıt 28 Kasım), Dijital 20 Ocak 2027 (kayıt 11 Ocak), Kağıt 2 Şubat 2027 (kayıt 14 Aralık 2026), Dijital 3 Mart 2027 (kayıt 20 Şubat), Dijital 14 Nisan 2027 (kayıt 3 Nisan), Kağıt 13 Mayıs 2027 (kayıt 13 Nisan), Dijital 8 Haziran 2027 (kayıt 26 Mayıs), Dijital ve kağıt 19 Ağustos 2027, Dijital ve kağıt 15 Eylül 2027, Dijital ve kağıt 7 Ekim 2027, Dijital ve kağıt 11 Kasım 2027. Kayıt yalnızca testdaf.de üzerinden; her merkez bu tarihlerin hangilerini açacağını kendisi seçer, kontenjan sınırlı. Sonuç dijitalde yaklaşık 3, kağıtta yaklaşık 6 hafta. Türkiye'deki lisanslı TestDaF merkezleri (20): İstanbul — Goethe-Institut İstanbul, İstanbul Üniversitesi-Cerrahpaşa, Marmara Üniversitesi (Göztepe), Türk-Alman Üniversitesi (Beykoz), ALKEV Özel Okulu, ALEV Okulu, Carl Duisberg Centren; Ankara — Goethe-Institut Ankara, Ankara Üniversitesi TÖMER, Hacettepe Üniversitesi YDYO; İzmir — Goethe-Institut İzmir, Ege Üniversitesi; ayrıca Bursa (Uludağ Üniv. YDYO), Eskişehir (Anadolu Üniv.), Antalya (Akdeniz Üniv., ARTI Dil Okulu, Antalya Koleji), Adana (Çukurova Üniv.), Erzurum (Atatürk Üniv., Bilkent Erzurum Laboratuvar Okulu). 19 Ekim'de önümüzdeki 6 ayda boş yeri görünen İstanbul merkezleri: İÜ-Cerrahpaşa, Marmara Üniversitesi, Türk-Alman Üniversitesi.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Almanya: RO-DT'ye göre dört bölümde TDN 4 Almanca lisans ve YL için yeterlik kanıtı; bazı programlar TDN 3 ya da 5 isteyebilir. Avusturya: TU Wien YL dört bölümde TDN 4 (2 yıl geçerli). İsviçre: ETH kabul ediyor. Not: mevcut sinavlar.js'te TestDaF kaydı yok; PM'in görev metnindeki 'mevcut 18 kayıt' listesinde TestDaF ve YKS geçiyor ama dosyada ikisi de yok. Tur 11: lisans-de.json > lis-de-yerel-testdaf, yl-de.json > yl-de-yerel-testdaf. Tur 14: Türkiye merkezleri ve 2026–2027 tarihleri g.a.s.t.'nin (TestDaF-Institut) testdaf.de merkez arama aracının kullandığı açık API'den okundu (api.gast.de/event/api/public/...). Türk öğrenci için: İstanbul'da en az üç merkez boş yer gösteriyor; 2028 güzü başvurusu için 2027 Mart–Haziran dijital oturumları son sınıfla çakışmayan güvenli pencere.",
    kaynak: "https://www.testdaf.de/de/teilnehmende/mein-testdaf/testdaf-termine-und-anmeldung/",
    dil: "de",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-19",
    ucret: "Türkiye tutarı yalnızca kayıt portalında (g.a.s.t. katılımcı portalı) seçim yapınca görünüyor; testdaf.de ve g.a.s.t. açık sayfalarında ülke tutarı yok. Teyit gerekir.",
    kaynaklar: [
      {
        "ad": "TestDaF, tarihler ve kayıt",
        "url": "https://www.testdaf.de/de/teilnehmende/mein-testdaf/testdaf-termine-und-anmeldung/",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "HRK/KMK RO-DT (Kasım 2025)",
        "url": "https://www.hrk.de/fileadmin/redaktion/hrk/02-Dokumente/02-07-Internationales/02-07-22_DSH/20260105_RO-DT_Fassung-HRK-v-04-11-2025-und-KMK-v-27-11-2025.pdf",
        "belgeYili": "2025",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Goethe-Institut Türkiye, Almanca sınavları",
        "url": "https://www.goethe.de/ins/tr/tr/spr/prf.html",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "TestDaF, test merkezi bul (g.a.s.t. merkez arama aracı; Türkei)",
        "url": "https://www.testdaf.de/de/teilnehmende/mein-testdaf/testzentrum-finden/",
        "belgeYili": "2026",
        "erisim": "2026-10-19"
      },
      {
        "ad": "g.a.s.t. açık API: Türkiye TestDaF merkezleri (aracın veri ucu)",
        "url": "https://api.gast.de/event/api/public/center-search/world/by-country/with-event-availability?isoCode=TR&product=1",
        "belgeYili": "2026",
        "erisim": "2026-10-19"
      },
      {
        "ad": "g.a.s.t. açık API: TestDaF sınav tarihleri ve kayıt son günleri",
        "url": "https://api.gast.de/event/api/public/events/testdaf",
        "belgeYili": "2026–2027",
        "erisim": "2026-10-19"
      },
      {
        "ad": "TestDaF, dijital TestDaF yapısı (bölüm süreleri)",
        "url": "https://www.testdaf.de/de/teilnehmende/der-digitale-testdaf/aufbau-des-digitalen-testdaf/",
        "belgeYili": "2026",
        "erisim": "2026-10-19"
      },
      {
        "ad": "TestDaF, kağıt TestDaF yapısı (3 sa 15 dk)",
        "url": "https://www.testdaf.de/de/teilnehmende/der-papierbasierte-testdaf/aufbau-des-papierbasierten-testdaf/",
        "belgeYili": "2026",
        "erisim": "2026-10-19"
      },
      {
        "ad": "Goethe-Institut Türkiye, TestDaF sayfası (kayıt yalnız testdaf.de, yılda altı sabit tarih ifadesi)",
        "url": "https://www.goethe.de/ins/tr/tr/spr/prf/testdaf.html",
        "belgeYili": "2026",
        "erisim": "2026-10-19"
      }
    ]
  },
  {
    id: "telc-c1-hochschule",
    ad: "telc Deutsch C1 Hochschule",
    kategori: "Dil Sınavı",
    kurum: "telc gGmbH",
    ulkeler: ["de", "at", "ch"],
    format: "Yazılı ve sözlü bölümler; üniversite girişi için tasarlanmış C1 sınavı. Bölüm süreleri bu turda resmi sayfadan okunamadı (telc sınav sayfası 404; yalnızca hazırlık materyali sayfası okundu).",
    sure: "Teyit gerekir.",
    puanlama: "CEFR C1. Puan ve geçme eşiği: Teyit gerekir.",
    tarih: "telc'in resmi merkez haritasında Türkiye'de 14 lisanslı telc sınav merkezi var: İstanbul — DAS Akademie İstanbul (Ataşehir), Euroversity Yurtdışı Eğitim (Halaskargazi Cad., Şişli), Yabancı Hocam Eğitim Hizmetleri, deutschmitspring/Mısra (Ümraniye), İstanbul Üniversitesi-Cerrahpaşa Sosyal Bilimler MYO (sinavmerkezi.iuc.edu.tr); Ankara — ANKA Dil Okulu, TOBB ETÜ, Berliner Tercüme, Lingosmart, TEOL; İzmir — DAS Akademie İzmir, İzdaf Akademi (Narlıdere); Adana ve Antalya — Kökdil. Hangi merkezin 'telc Deutsch C1 Hochschule' sınavını, hangi tarihlerde yaptığı haritada yazmıyor: merkezden teyit gerekir.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Almanya: RO-DT § 8'e göre telc Deutsch C1 Hochschule DSH'den muafiyet sağlar. Genel telc Deutsch C1 bu muafiyeti vermez; doğru sınavı seçmek gerekir. Avusturya: TU Wien YL kabul ediyor. İsviçre: ETH YL listesinde 'telc Deutsch C1' geçiyor. Tur 11: yl-de.json > yl-de-yerel-h-telc, yl-at.json > yl-at-yerel-dil-c1, yl-ch.json > yl-ch-yerel-de-eth. Tur 14: Türkiye merkez listesi telc.net merkez haritasının sayfa verisinden okundu (14 merkez). Dikkat: genel 'telc Deutsch C1' DSH muafiyeti vermez; merkezden özellikle 'C1 Hochschule' oturumu sorulmalı.",
    kaynak: "https://www.telc.net/lehrmaterialien/deutsch-fuer-die-hochschule/",
    dil: "de",
    duzey: ["lisans", "yl"],
    kesinlik: "Teyit gerekir",
    sonKontrol: "2026-10-19",
    ucret: "Merkeze göre; Türkiye tutarı Teyit gerekir.",
    kaynaklar: [
      {
        "ad": "telc, Deutsch für die Hochschule",
        "url": "https://www.telc.net/lehrmaterialien/deutsch-fuer-die-hochschule/",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "HRK/KMK RO-DT § 8 Abs. 2 (e)",
        "url": "https://www.hrk.de/fileadmin/redaktion/hrk/02-Dokumente/02-07-Internationales/02-07-22_DSH/20260105_RO-DT_Fassung-HRK-v-04-11-2025-und-KMK-v-27-11-2025.pdf",
        "belgeYili": "2025",
        "erisim": "2026-10-15"
      },
      {
        "ad": "telc, Prüfungszentrum finden (resmi merkez haritası; Türkiye kayıtları)",
        "url": "https://www.telc.net/sprachpruefungen/pruefungszentrum-finden/",
        "belgeYili": "2026",
        "erisim": "2026-10-19"
      }
    ]
  },
  {
    id: "dsh",
    ad: "DSH (Deutsche Sprachprüfung für den Hochschulzugang)",
    kategori: "Dil Sınavı",
    kurum: "Alman üniversiteleri ve devletçe tanınmış Studienkolleg'ler",
    ulkeler: ["de", "ch"],
    format: "Yazılı ve sözlü bölüm; içeriği sınavı yapan üniversite belirler (çerçeve: DSH-Musterprüfungsordnung).",
    sure: "Üniversiteye göre değişir.",
    puanlama: "Yazılıda ve sözlüde en az %57 DSH-1, %67 DSH-2, %82 DSH-3. Almanca program için genel eşik DSH-2.",
    tarih: "Türkiye'de yapılmıyor. Sınav yalnızca Almanya'daki üniversite ve Studienkolleg'lerde yapılır; tarihleri her üniversite kendisi ilan eder.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Türkiye'den başvuran için pratik yol TestDaF, Goethe C2 ya da telc C1 Hochschule'dür. DSH-1 ile verilen kabul başka programa ya da üniversiteye geçişte bağlayıcı değildir. İsviçre: ETH YL DSH-3 kabul ediyor. Lisans ve YL için aynı kural. Tur 11: yl-de.json > yl-de-yerel-dsh, yl-de-yerel-h-dsh-tr.",
    kaynak: "https://www.hrk.de/fileadmin/redaktion/hrk/02-Dokumente/02-07-Internationales/02-07-22_DSH/20260105_RO-DT_Fassung-HRK-v-04-11-2025-und-KMK-v-27-11-2025.pdf",
    dil: "de",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    ucret: "Üniversiteye göre.",
    kaynaklar: [
      {
        "ad": "HRK/KMK RO-DT § 3 ve DSH-Musterprüfungsordnung § 5",
        "url": "https://www.hrk.de/fileadmin/redaktion/hrk/02-Dokumente/02-07-Internationales/02-07-22_DSH/20260105_RO-DT_Fassung-HRK-v-04-11-2025-und-KMK-v-27-11-2025.pdf",
        "belgeYili": "2025",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "osd-c1-c2",
    ad: "ÖSD Zertifikat C1 / C2",
    kategori: "Dil Sınavı",
    kurum: "Österreichisches Sprachdiplom Deutsch (ÖSD)",
    ulkeler: ["at", "de", "ch"],
    format: "C1: iki modül. Yazılı modül: Lesen 90 dk, Hören yaklaşık 40 dk, Schreiben 90 dk. Sözlü modül: Sprechen 15–20 dk (telefon görüşmesi, tartışma, kısa sunum). 1 Ocak 2024'ten beri kağıdın yanında dijital olarak da yapılıyor. Modüller ayrı ayrı alınıp belgelenebilir; aynı merkezde bir yıl içinde iki modülü geçen tam sertifika alır.",
    sure: "C1: yaklaşık 4 saat yazılı + 15–20 dk sözlü.",
    puanlama: "CEFR C1 / C2; iki sınav görevlisi değerlendirir. Puan eşiği bu turda okunmadı.",
    tarih: "Türkiye'de lisanslı merkezler: İstanbul (Beşiktaş ve Kadıköy), Ankara, İzmir, Bursa (ÖSD duyuruları, 2024). İstanbul Kadıköy'deki Norden Akademi ZA1–ZC1 sınavı yapıyor. 2027 tarihleri ve C1 oturumları merkezden teyit edilmeli.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "ÖSD C1 özellikle Almanca konuşulan bir üniversitede okumak isteyenler için tasarlanmış; 16 yaşından itibaren (gençler sürümü 14). Avusturya: Universität Wien ve TU Wien düzenli kabul için C1 ister (başvuruda A2 yeter; C1 yoksa ek Almanca sınavı); TU Wien YL ÖSD C1 kabul ediyor (2 yıl). Almanya: RO-DT'de muafiyet ÖSD C2'ye bağlı; ÖSD C1'in kabulü üniversiteye kalır. İsviçre: ETH ÖSD C1 kabul eder (2 yıl), ÖSD C2 lisans için 5 yıl. Tur 11: lisans-at.json > lis-at-de-osd, lis-at-de-c1, yl-at.json > yl-at-yerel-sinav-merkezi.",
    kaynak: "https://osd.at/portfolio-item/osd-zertifikat-c1-zc1/",
    dil: "de",
    duzey: ["lisans", "yl"],
    kesinlik: "Teyit gerekir",
    sonKontrol: "2026-10-16",
    ucret: "Merkeze göre; Teyit gerekir.",
    kaynaklar: [
      {
        "ad": "ÖSD Zertifikat C1 (ZC1)",
        "url": "https://osd.at/portfolio-item/osd-zertifikat-c1-zc1/",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "ÖSD, Ankara sınav merkezi duyurusu (Aralık 2024)",
        "url": "https://osd.at/en/german-examinations-in-ankara-asm-expanding-its-network-in-the-capital-city/",
        "belgeYili": "2024",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "cils",
    ad: "CILS (Certificazione di Italiano come Lingua Straniera)",
    kategori: "Dil Sınavı",
    kurum: "Università per Stranieri di Siena",
    ulkeler: ["it"],
    format: "Dinleme, okuma, dil yapıları, yazma ve konuşma bölümleri; A1–C2. B2 karşılığı CILS Due-B2, C1 karşılığı CILS Tre-C1.",
    sure: "Teyit gerekir (düzeye göre).",
    puanlama: "Düzey bazlı geçti/kaldı sertifikası (CEFR). Bölüm puanları ve eşik bu turda okunmadı.",
    tarih: "2027 oturumları (Siena takvimi): 18 Şubat (kayıt 18 Ocak), 8 Nisan (8 Mart), 10 Haziran (1 Mayıs), 22 Temmuz (22 Haziran), 21 Ekim (21 Eylül), 2 Aralık 2027 (23 Ekim). B2 oturumları Haziran ve Aralık'ta (Tur 11). 2026'nın son oturumu 3 Aralık 2026 (kayıt 24 Ekim 2026). Türkiye'deki CILS sınav yerleri (Siena resmi listesi): İstanbul — İtalyan Kültür Merkezi (Tepebaşı, Meşrutiyet Cad. 75; +90 212 293 98 48), Desk Unistrasi Turchia (Bomonti–Şişli, Kazım Orbay Cad. 15, Evrim Okulu içinde; +90 212 231 34 31), Firenze Yurtdışı Eğitim (Bağdat Cad. 374/5, Şaşkınbakkal; +90 216 302 24 55); İzmir — İtalyan Dostluk ve Kültür Derneği (Kıbrıs Şehitleri Cad. 58). Her yerin hangi oturumu açtığı merkezden sorulur.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "İtalya: İtalyanca lisans ve YL programları için en az B2 zorunlu (MUR genelgesi 2026-27 / 2027-28); CLIQ sistemindeki bir B2 belgesi üniversitenin kendi İtalyanca sınavından muaf tutar ve vizeden önce elde olmalı. İngilizce programlarda gerekmez. Aralık oturumu son sınıf için güvenli son B2 oturumudur. Tur 11: lisans-it.json > lis-it-yerel-cils-haziran, lis-it-yerel-cils-aralik; yl-it.json > yl-it-yr-sertifikalar. Tur 14: İstanbul'da CILS yapan üç yer Siena'nın resmi yurt dışı sınav yeri listesinden doğrulandı. Ücret merkeze göre değişir; İstanbul tutarı hâlâ Teyit gerekir (iicistanbul@esteri.it).",
    kaynak: "https://cils.unistrasi.it/1/213/428/Le_date_degli_esami_2027.htm",
    dil: "it",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-19",
    ucret: "Merkeze göre; İstanbul tutarı Teyit gerekir (iicistanbul@esteri.it).",
    kaynaklar: [
      {
        "ad": "Università per Stranieri di Siena, CILS 2027 tarihleri",
        "url": "https://cils.unistrasi.it/1/213/428/Le_date_degli_esami_2027.htm",
        "belgeYili": "2027",
        "erisim": "2026-10-15"
      },
      {
        "ad": "İstanbul İtalyan Kültür Merkezi, sertifikalar",
        "url": "https://iicistanbul.esteri.it/it/lingua-e-cultura/certificazioni/",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "PoliTo, kabul edilen İtalyanca sertifikalar tablosu (18.12.2024)",
        "url": "https://www.polito.it/sites/default/files/2026-01/ultimo_tab_italiano%20ENG_20241218%20_1.pdf",
        "belgeYili": "2024",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Università per Stranieri di Siena, CILS sınav yerleri: Türkiye",
        "url": "https://cils.unistrasi.it/1/180/123/TURCHIA.htm",
        "belgeYili": "2026",
        "erisim": "2026-10-19"
      },
      {
        "ad": "İstanbul İtalyan Kültür Merkezi, iletişim (iicistanbul@esteri.it)",
        "url": "https://iicistanbul.esteri.it/chi-siamo/contatti",
        "belgeYili": "2026",
        "erisim": "2026-10-19"
      }
    ]
  },
  {
    id: "celi",
    ad: "CELI (Certificati di Lingua Italiana)",
    kategori: "Dil Sınavı",
    kurum: "Università per Stranieri di Perugia (CVCL)",
    ulkeler: ["it"],
    format: "Genel CELI: A1 (CELI Impatto), A2 (CELI 1), B1 (CELI 2), B2 (CELI 3), C1 (CELI 4), C2 (CELI 5). Adolesan sürümü (12–18 yaş) A2–B2.",
    sure: "Teyit gerekir (düzeye göre).",
    puanlama: "Düzey bazlı sertifika (CEFR). B2 karşılığı CELI 3, C1 karşılığı CELI 4.",
    tarih: "2027 genel CELI oturumları (CVCL takvimi): 9 Mart 2027, yalnızca A1–B2 (kayıt son günü 9 Şubat 2027); 11 Haziran 2027, A1–C2 (11 Mayıs 2027); 16 Kasım 2027, A1–C2 (16 Ekim 2027). Sınav merkezleri kayıt son gününü öne çekebilir. Türkiye'deki CELI merkezleri (Perugia CVCL'nin yurt dışı anlaşmalı merkez listesi, güncelleme 19.03.2026): İstanbul — İtalyan Liseleri / Ita Okulları (Abide-i Hürriyet Cad. 5/7, Şişli; m.vasapollo@ita.k12.tr); Ankara — Casa Italia (Kuzgun Cad. 95/A, Ayrancı; casaitaliaankara@gmail.com); İzmir — İzmir Ekonomi Üniversitesi (Sakarya Cad. 156), Özel İtalyan Ana ve İlkokulu (Alsancak). İstanbul İtalyan Kültür Merkezi bu listede yok.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "İtalya: İtalyanca programlar için B2 (CELI 3) yeterli. Eylül başlangıcına göre Mart oturumu Şubat–Nisan başvuru turlarına yetişebilecek tek CELI oturumu. Tur 11: yl-it.json > yl-it-yr-t-celi (o maddedeki 3 Şubat kayıt günü San Francisco merkezine aitti; CVCL'nin genel son günü 9 Şubat 2027). Tur 14 düzeltmesi: 'İstanbul İtalyan Kültür Merkezi CELI yapıyor' ifadesi resmi listeyle desteklenmiyor; İstanbul'daki CELI merkezi İtalyan Liseleri (Şişli). Türk öğrenci için: Mart 2027 oturumu (yalnız A1–B2) İstanbul'da açılıyor mu, okuldan sorulmalı.",
    kaynak: "https://cvcl.unistrapg.it/pagine/calendario-esami-celi-e-dils-pg-000",
    dil: "it",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-19",
    ucret: "Perugia dışındaki merkezlerde merkeze göre; Türkiye tutarı Teyit gerekir.",
    kaynaklar: [
      {
        "ad": "CVCL Perugia, CELI ve DILS-PG takvimi 2026 ve 2027 (01.07.2026)",
        "url": "https://cvcl.unistrapg.it/pagine/calendario-esami-celi-e-dils-pg-000",
        "belgeYili": "2026–2027",
        "erisim": "2026-10-16"
      },
      {
        "ad": "İstanbul İtalyan Kültür Merkezi, sertifikalar",
        "url": "https://iicistanbul.esteri.it/it/lingua-e-cultura/certificazioni/",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "CVCL Perugia, yurt dışı anlaşmalı CELI merkezleri (PDF, güncelleme 19.03.2026)",
        "url": "https://cvcl.unistrapg.it/MC-API/Risorse/StreamRisorsa.ashx?guid=0c566c9e-fef7-4b02-815d-328ce3329a5d",
        "belgeYili": "2026",
        "erisim": "2026-10-19"
      },
      {
        "ad": "CVCL Perugia, Centri d'esame convenzionati CELI",
        "url": "https://cvcl.unistrapg.it/pagine/centri-desame-convenzionati-celi-000",
        "belgeYili": "2026",
        "erisim": "2026-10-19"
      }
    ]
  },
  {
    id: "plida",
    ad: "PLIDA (Progetto Lingua Italiana Dante Alighieri)",
    kategori: "Dil Sınavı",
    kurum: "Società Dante Alighieri",
    ulkeler: ["it"],
    format: "Yetişkin PLIDA: A2, B1, B2, C1, C2. PLIDA Juniores (13–18 yaş): A1–B2.",
    sure: "Teyit gerekir (düzeye göre).",
    puanlama: "Düzey bazlı sertifika (CEFR). B2 karşılığı PLIDA B2.",
    tarih: "60'tan fazla ülkede 300'den fazla merkez. PLIDA sitesinde 19 Ekim 2026'da hâlâ 2026 takvimi var; 2027 takvimi yayımlanmadı. Türkiye'deki tek PLIDA merkezi (Società Dante Alighieri resmi merkez listesi): 'Italyan dil merkezi (Centro PLIDA)', Merkez Mah. Halaskargazi Cad. No. 143, İstanbul (listede posta kodu 34716 Kadıköy yazıyor); info@italyandilmerkezi.com, +90 212 612 00 39. İstanbul İtalyan Kültür Merkezi PLIDA merkezleri listesinde yok.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "İtalya: CLIQ sistemindeki dört belgeden biri; PoliTo tablosu PLIDA B2'yi kabul ediyor. Tur 11: lisans-it.json > lis-it-yerel-sertifikalar, yl-it.json > yl-it-yr-sertifikalar. Tur 14 düzeltmesi: 'İstanbul İtalyan Kültür Merkezi PLIDA yapıyor' ifadesi resmi listeyle desteklenmiyor. 2027 takvimi yayımlanınca kayıt Doğrulandı'ya çevrilebilir.",
    kaynak: "https://plida.dante.global/it",
    dil: "it",
    duzey: ["lisans", "yl"],
    kesinlik: "Teyit gerekir",
    sonKontrol: "2026-10-19",
    ucret: "Merkeze göre; Teyit gerekir.",
    kaynaklar: [
      {
        "ad": "PLIDA (Dante Alighieri) ana sayfa ve 2026 takvimi",
        "url": "https://plida.dante.global/it",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "İstanbul İtalyan Kültür Merkezi, sertifikalar",
        "url": "https://iicistanbul.esteri.it/it/lingua-e-cultura/certificazioni/",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Società Dante Alighieri, merkezler listesi (Turchia)",
        "url": "https://www.dante.global/it/contatti/lista-contatti",
        "belgeYili": "2026",
        "erisim": "2026-10-19"
      }
    ]
  },
  {
    id: "delf-dalf",
    ad: "DELF B2 / DALF C1",
    kategori: "Dil Sınavı",
    kurum: "France Éducation international (Fransa Milli Eğitim Bakanlığı)",
    ulkeler: ["fr", "be", "ch"],
    format: "Dört beceri (dinleme, okuma, yazma, konuşma). DELF tout public A1–B2, DALF C1–C2; her düzey bağımsız diplomadır. Gençler için DELF Junior sürümü var.",
    sure: "Teyit gerekir (düzeye göre).",
    puanlama: "Düzey bazlı diploma (CEFR). Cenevre Üniversitesi muafiyet için DELF B2'de en az 60 puan ve yazılı anlatımda en az 15 istiyor.",
    tarih: "Institut français İstanbul 2026 yetişkin oturumları: B2 5 Şubat, 16 Mart, 15 Haziran, 8 Ekim, 16 Kasım 2026; C1 6 Şubat, 17 Mart, 16 Haziran, 9 Ekim, 17 Kasım 2026. Kasım 2026 dönemi kaydı 14 Eylül–9 Ekim 2026 (geçti). Yazılı sınav tarihleri ülke genelinde aynı; Ankara ve İzmir'de de sınav birimi var. 2027 takvimi henüz yok.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Diplomalar ömür boyu geçerli. Fransa: Fransızca lisans (DAP) ve YL için en az B2; bazı programlar daha yüksek ister. DAP dosyası son sınıfın 15 Aralık'ına kadar kapanır; belgeyi 11. sınıf sonu ya da 12. sınıf başı hedefle. YL için dil belgesi 30 Aralık 2026'ya kadar dosyada. İsviçre: EPFL lisans B2 zorunlu, C1 önerilir; Cenevre YL B2. Belçika: ULB lisansında Fransızca belge şartı Teyit gerekir. Tur 11: lisans-fr.json > lis-fr-fr-b2, lis-fr-11-dil-sinav; yl-fr.json > yl-fr-yerel-dil; yl-ch.json > yl-ch-yerel-fr-unige.",
    kaynak: "https://www.ifturquie.org/istanbul/sinav-ve-diplomalar/delf-dalf-2/",
    dil: "fr",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-16",
    ucret: "Institut français İstanbul 2026: DELF B2 (tout public) 5.850 TL, öğrenci indirimli 4.050 TL; DALF C1 10.050 TL, öğrenci 7.650 TL; DELF Junior B2 4.050 TL.",
    kaynaklar: [
      {
        "ad": "Institut français İstanbul, DELF–DALF (2026 ücretleri ve oturumları)",
        "url": "https://www.ifturquie.org/istanbul/sinav-ve-diplomalar/delf-dalf-2/",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "France Éducation international, DELF tout public",
        "url": "https://www.france-education-international.fr/en/diplome/delf-tout-public",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "France Éducation international, DALF",
        "url": "https://www.france-education-international.fr/en/diplome/dalf",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "Campus France Türkiye, Procédure DAP 2027",
        "url": "https://www.turquie.campusfrance.org/system/files/medias/documents/2026-10/Proc%C3%A9dure%20DAP%202027.pdf",
        "belgeYili": "2027/28",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "tcf",
    ad: "TCF tout public (TCF DAP dahil)",
    kategori: "Dil Sınavı",
    kurum: "France Éducation international",
    ulkeler: ["fr", "ch", "be"],
    format: "Üç zorunlu çoktan seçmeli test: dinleme 29 soru/25 dk, dil yapıları 18 soru/15 dk, okuma 29 soru/45 dk. İsteğe bağlı: yazılı anlatım (3 görev, 60 dk) ve sözlü anlatım (12 dk, 2'si hazırlık). Bilgisayarda yapılırsa ÇSS bölümü 91 soru (15'i puana sayılmaz). TCF DAP = TCF tout public + zorunlu yazılı anlatım testi.",
    sure: "1 sa 25 dk (yalnız zorunlu testler) ile 2 sa 37 dk (tüm testler) arası.",
    puanlama: "Zorunlu bölümler (dinleme, dil yapıları, okuma) 100–699 ölçeğinde, isteğe bağlı yazılı ve sözlü bölümler 20 üzerinden; sonuç altı düzey (A1–C2) olarak raporlanır. Cenevre Üniversitesi zorunlu ve tamamlayıcı bölümlerde en az B2 istiyor. Jean Monnet 2027-2028: yalnız TCF tout public geçerli; aynı oturumdaki üç zorunlu bölümün her birinde en az 400.",
    tarih: "Oturumları onaylı merkezler yıl boyunca kendileri açar. Türkiye'de Institut français Ankara, İstanbul ve İzmir birimleri sınav iletişim adresi (Campus France DAP 2027). İstanbul TCF oturum tarihleri bu turda okunmadı. Sonuç merkeze 15 iş günü içinde (bilgisayarda yalnız ÇSS ise 10 iş günü).",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Geçerlilik: sonuç tarihinden itibaren 2 yıl (belgede yazılı). Bu, Tur 11'deki 'TCF tout public geçerliliği bulunamadı' maddesini kapatır. DAP'ta resmi tanınan test TCF DAP biçimidir (yazılı anlatım zorunlu). 1 Eylül 2026 oturumlarından itibaren yaklaşık bir yıl yazılı ve sözlü bölümlerde yeniden notlandırma talebi kabul edilmiyor. Fransa lisans ve YL: B2. Tur 11: yl-genel.json > yl-dil-fransizca, lisans-fr.json > lis-fr-fr-b2.",
    kaynak: "https://www.france-education-international.fr/en/test/tcf-tout-public",
    dil: "fr",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    ucret: "Merkeze göre; Türkiye tutarı Teyit gerekir.",
    kaynaklar: [
      {
        "ad": "France Éducation international, TCF tout public",
        "url": "https://www.france-education-international.fr/en/test/tcf-tout-public",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Campus France Türkiye, Procédure DAP 2027",
        "url": "https://www.turquie.campusfrance.org/system/files/medias/documents/2026-10/Proc%C3%A9dure%20DAP%202027.pdf",
        "belgeYili": "2027/28",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "dele",
    ad: "DELE (Diplomas de Español como Lengua Extranjera)",
    kategori: "Dil Sınavı",
    kurum: "Instituto Cervantes (İspanya Eğitim Bakanlığı adına)",
    ulkeler: ["es"],
    format: "Kağıt üzerinde dört test: okuduğunu anlama, dinlediğini anlama, yazılı ifade ve etkileşim, sözlü ifade ve etkileşim. A1–C2; aday düzeyi önceden seçer. Okul sürümleri (11–17 yaş): A1, A2/B1, B2/C1.",
    sure: "Düzeye göre; B2 ve C1 süreleri Cervantes sınav rehberlerinde (bu turda açılmadı).",
    puanlama: "Seçilen düzeyde geçti/kaldı diploması.",
    tarih: "Cervantes İstanbul 2026: 22–23 Mayıs 2026 (son kayıt 8 Nisan), 16 Ekim 2026 (B1, B2, C1; son kayıt 2 Eylül), 13–14 Kasım 2026 (B2/C1 okul sürümü 13 Kasım; B1, B2, C1, C2 14 Kasım; son kayıt 30 Eylül, geçti). Sözlü sınav tarihi farklı olabilir. Sonuç yaklaşık 3 ay. 2027 dönemleri yayımlanmadı (2026 kayıtları 1 Aralık 2025'te açılmıştı).",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Süresiz geçerli. İspanya: UC3M Early Admission (lisans) derecenin dilinde B2 kanıtı ister; İspanyolca YL'lerde DELE ya da SIELE GLOBAL ile en az B2. Sonuç 3 ay sürdüğü için ön kayıt takvimine göre erken planla. ÖSYM, DELE'yi YDS ile eşdeğer sayıyor. Tur 11: lisans-es.json > lis-es-es-dele, lis-es-es-b2; yl-es.json > yl-es-yerel-dil.",
    kaynak: "https://estambul.cervantes.es/tr/ispanyolca-sinavlari/dele/dele_sinav_ucretleri.htm",
    dil: "es",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-16",
    ucret: "Cervantes İstanbul 2026: B2 4.800 TL, C1 5.450 TL, B2/C1 okul sürümü 5.450 TL, C2 6.100 TL.",
    kaynaklar: [
      {
        "ad": "Cervantes İstanbul, DELE ücretleri ve kayıt tarihleri (2026)",
        "url": "https://estambul.cervantes.es/tr/ispanyolca-sinavlari/dele/dele_sinav_ucretleri.htm",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "Cervantes İstanbul, DELE genel bilgi",
        "url": "https://estambul.cervantes.es/tr/ispanyolca-sinavlari/dele/diplomalarin_bilgilsi.htm",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "UC3M, lisansüstü dil şartları",
        "url": "https://uc3m.es/postgrado/requisitos-idiomas",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "siele",
    ad: "SIELE (Servicio Internacional de Evaluación de la Lengua Española)",
    kategori: "Dil Sınavı",
    kurum: "Instituto Cervantes, UNAM, Salamanca Üniversitesi, Buenos Aires Üniversitesi",
    ulkeler: ["es"],
    format: "Bilgisayarda, test merkezinde, randevuyla. Dört test (okuma, dinleme, yazılı ifade, sözlü ifade); tamamı (SIELE GLOBAL) ya da tek tek alınabilir.",
    sure: "Teyit gerekir.",
    puanlama: "1.000 puanlık ölçek; A1–C1 eşdeğerliği. C2 belgelemez.",
    tarih: "Tarih ve saati aday seçer. Cervantes İstanbul SIELE yapıyor. Sonuç en fazla 3 hafta.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Belge 5 yıl geçerli. İspanya: UC3M İspanyolca YL'ler için SIELE GLOBAL ile en az B2 kabul ediyor; sonuç hızlı olduğu için son dakika için DELE'den uygun. Tur 11: yl-es.json > yl-es-yerel-dil, yl-es-yerel-sinav-tr.",
    kaynak: "https://estambul.cervantes.es/tr/ispanyolca-sinavlari/info_ispanyolca_sinavlari.htm",
    dil: "es",
    duzey: ["lisans", "yl"],
    kesinlik: "Teyit gerekir",
    sonKontrol: "2026-10-15",
    ucret: "Teyit gerekir (Cervantes İstanbul SIELE ücret sayfası okunmadı).",
    kaynaklar: [
      {
        "ad": "Cervantes İstanbul, İspanyolca sınavları (DELE–SIELE karşılaştırması)",
        "url": "https://estambul.cervantes.es/tr/ispanyolca-sinavlari/info_ispanyolca_sinavlari.htm",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Cervantes İstanbul, SIELE nedir",
        "url": "https://estambul.cervantes.es/tr/ispanyolca-sinavlari/siele/siele_nedir.htm",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "nt2-programma-2",
    ad: "Staatsexamen NT2 Programma II",
    kategori: "Dil Sınavı",
    kurum: "College voor Toetsen en Examens / DUO",
    ulkeler: ["nl", "be"],
    format: "Dört ayrı sınav: okuma, dinleme, yazma, konuşma. Yüz yüze, fiziksel katılım şart.",
    sure: "Teyit gerekir.",
    puanlama: "Programma II = B2 (üniversite ve uygulamalı bilimler düzeyi). Diplomanın süresi dolmaz.",
    tarih: "Türkiye'de yapılmıyor. Yalnızca Hollanda'da altı şehirde: Amsterdam, Eindhoven, Rijswijk, Rotterdam, Utrecht, Zwolle. Yıl boyunca oturum var; kayıt DUO üzerinden sınavdan sekiz hafta önce açılır.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Hollanda: Felemenkçe programlarda genelde B2 istenir; ancak Delft'in Felemenkçe lisansları NT2-II'yi kabul etmiyor (VWO düzeyi ya da CNaVT EDUP istiyor). Felemenkçe programda da İngilizce belgesi istenir (Delft: IELTS 5.5). Belçika: Gent NT2 Programma II'yi B2 kanıtı sayıyor. Tur 11: lisans-nl.json > lis-nl-nl-nt2, lis-nl-nl-delft; yl-nl.json > yl-nl-yerel-nt2; yl-be.json > yl-be-yerel-nl-dil.",
    kaynak: "https://staatsexamensnt2.nl/English",
    dil: "nl",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    ucret: "Sınav başına 50 €, dört sınav 200 €.",
    kaynaklar: [
      {
        "ad": "Staatsexamens NT2 (İngilizce)",
        "url": "https://staatsexamensnt2.nl/English",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "DUO, Staatsexamen NT2 nerede ve ne zaman",
        "url": "https://duo.nl/particulier/staatsexamen-nt2/waar-en-wanneer.jsp",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "itna",
    ad: "ITNA (Interuniversitaire Taaltest Nederlands voor Anderstaligen)",
    kategori: "Dil Sınavı",
    kurum: "Interuniversity Testing Consortium (KU Leuven, UAntwerpen, UGent, VUB)",
    ulkeler: ["be"],
    format: "Bilgisayar testi + sözlü sınav; C1 için ek yazma testi (koşulları sağlayana).",
    sure: "Teyit gerekir.",
    puanlama: "ERK-B2 sertifikası; ek testle ERK-C1. Flaman yükseköğretiminde başlangıç düzeyi B2, bazı programlar C1.",
    tarih: "Türkiye'de yapılmıyor. Yalnızca Belçika'da (Antwerpen, Gent, Leuven, Brüksel). Açık oturumlar: 14 Aralık 2026 (Brüksel), 7 Ocak 2027 (Gent), 13, 20 ve 22 Ocak 2027, 10 ve 25 Mart 2027, Mayıs–Eylül 2027 arasında Antwerpen ağırlıklı oturumlar. Ağustos–Eylül oturumlarında yer sınırlı; birinci dönemde başlamak isteyenin yazdan önce girmesi öneriliyor.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Belçika (Flaman): Gent ve KU Leuven Felemenkçe programlar için ITNA B2 / C1 kabul ediyor. Hollanda'da kabulü program bazında doğrulanmadı. Tur 11: yl-be.json > yl-be-yerel-nl-dil; lisans-be.json > lis-be-nl-b2.",
    kaynak: "https://www.itna.be/boek-een-test/testdata-en-plaats/",
    dil: "nl",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-16",
    ucret: "Açık oturum 125 €, randevulu test 235 €. 12 ayda en çok 4 deneme, aralarında en az 2 hafta.",
    kaynaklar: [
      {
        "ad": "ITNA, test tarihleri ve yerleri",
        "url": "https://www.itna.be/boek-een-test/testdata-en-plaats/",
        "belgeYili": "2026–2027",
        "erisim": "2026-10-16"
      },
      {
        "ad": "ITNA, prosedür ve ücret",
        "url": "https://www.itna.be/boek-een-test/inschrijvingsprocedure/",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "ITNA ana sayfa",
        "url": "https://www.itna.be/",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "cnavt",
    ad: "CNaVT Educatief Startbekwaam (STRT, B2) / Educatief Professioneel (EDUP, C1)",
    kategori: "Dil Sınavı",
    kurum: "Nederlandse Taalunie (CNaVT)",
    ulkeler: ["be", "nl"],
    format: "Üç bölüm: A (dinleme/okuma ve yazma, sınıfta), B (okuma ve yazma, sınıfta), C (konuşma ve dinleme, B2–C1'de sunum; bireysel). A ve B'de kağıt sözlük serbest. 2026'dan itibaren dijital.",
    sure: "Teyit gerekir (bölüm süreleri ayrı sayfada).",
    puanlama: "STRT = ERK B2 (Flaman ya da Hollanda yükseköğretimine başlangıç); EDUP = ERK C1.",
    tarih: "Yılda iki dönem: Mayıs ve Kasım. Sonraki dönem 11–20 Kasım 2026 (kayıt 21 Eylül–12 Ekim 2026, kapandı); sonuç Ocak 2027'nin ikinci yarısı. Türkiye'de sınav kurumları var: İstanbul (De Nederlandse School Istanbul; Nederlands Taalinstituut Istanbul, İstiklal Cd. 189) ve Bodrum. Mayıs 2027 dönemi tarihleri henüz yok.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Belçika: Gent CNaVT STRT'yi B2, EDUP'u C1 kanıtı sayıyor. Hollanda: Delft Felemenkçe lisansları NT2-II'yi değil CNaVT EDUP'u kabul ediyor. Türkiye'den sınava girilebilen tek Felemenkçe üniversite belgesi bu (NT2 ve ITNA yalnız NL/BE'de). Bu bulgu Tur 11'deki 'CNaVT'nin Türkiye'de merkezi doğrulanamadı' maddelerini kapatır. Tur 11: yl-be.json > yl-be-yerel-sinav-tr; yl-nl.json > yl-nl-yerel-diger-belge; lisans-nl.json > lis-nl-nl-delft.",
    kaynak: "https://cnavt.org/inschrijven",
    dil: "nl",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-16",
    ucret: "Ülkeye göre taban ücret + kurumun idari ücreti; Türkiye tutarı Teyit gerekir.",
    kaynaklar: [
      {
        "ad": "CNaVT, sınava kayıt (2026 dönemleri)",
        "url": "https://cnavt.org/inschrijven",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "CNaVT, Asya sınav kurumları (İstanbul, Bodrum)",
        "url": "https://cnavt.org/examencentra/continent/azie",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "CNaVT, sınav seçimi",
        "url": "https://cnavt.org/het-examen-nederlands",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      }
    ]
  },
  {
    id: "tisus",
    ad: "Tisus (Svenska 3 eşdeğeri)",
    kategori: "Dil Sınavı",
    kurum: "Stockholm Üniversitesi",
    ulkeler: ["se", "fi", "dk"],
    format: "Üç alt test: okuduğunu anlama, yazma, konuşma (yurt dışında konuşma testi ayrı biçimde).",
    sure: "Okuma ve Yazma alt testleri genellikle salı sabahı birlikte, yaklaşık dört saat. Sözlü alt test ayrı yapılır (yurt dışında sınav görevlisiyle).",
    puanlama: "Geçti/kaldı. Tüm bölümleri geçmek İsveç lisesi Svenska 3'e eşdeğer sayılır; resmi sayfa CEFR düzeyi vermiyor. Geçer sonucun süresi dolmaz.",
    tarih: "Yurt dışı oturumlar ve ilgi bildirimi pencereleri: 20 Ekim 2026 (ilgi bildirimi 22 Haziran–28 Ağustos 2026, ödeme son günü 4 Eylül 2026); 11 Mayıs 2027 (ilgi bildirimi 11 Ocak 2027 08:00–19 Mart 2027 17:00, ödeme 26 Mart 2027); 26 Ekim 2027 (28 Haziran–3 Eylül 2027, ödeme 10 Eylül 2027); 9 Mayıs 2028 (10 Ocak–17 Mart 2028, ödeme 24 Mart 2028). Saatler İsveç saati. Yurt dışında kalıcı sınav yeri yok: aday ilgi bildirir, Stockholm Üniversitesi istenen yerde sınav görevlisi bulabilirse e-postayla onay ve ödeme bağlantısı gönderir, bulamazsa başka yer önerir. İstanbul 2025 yurt dışı sınav yerleri haritasında vardı; 2027 İstanbul oturumu önceden doğrulanamaz (yapısı gereği talebe bağlı). Sonuç yaklaşık 5 hafta.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "İsveç: İsveççe lisans ve YL programları Svenska 3 ister; yabancı diplomalı aday bunu Tisus'la karşılar ve çoğu program ayrıca English 6 da ister. Finlandiya: Aalto İsveççe programlarda Tisus'u kabul ediyor. Danimarka: Kopenhag Üniversitesi Danca programlar için Tisus'u kabul ediyor. 'Svenska 3' ayrı bir sınav değil, İsveç lise dersidir; portalda ayrı kayıt açılmamalı. Bu bulgu Tur 11'deki 'Tisus Türkiye'de var mı' maddesini kısmen kapatır: İstanbul 2025'te yurt dışı sınav yeriydi; 2027 için yine talebe bağlı. Tur 11: lisans-se.json > lis-se-yerel-svenska3, lis-se-yerel-tisus-yurtdisi; yl-se.json > yl-se-yerel-tisus-turkiye. Tur 14: ücret ve 2027 pencereleri Stockholm Üniversitesi'nin İsveççe 'Om Tisus' sayfasından doğrulandı. Türk öğrenci için: Mayıs 2027 oturumu için ilgi bildirimi 11 Ocak–19 Mart 2027; İstanbul açılmazsa en yakın yer SU tarafından önerilir. Resmi iletişim adresi tisus.svefler@su.se (tisus@su.se değil).",
    kaynak: "https://www.su.se/english/divisions/tisus---test-in-swedish-for-university-studies/about-tisus",
    dil: "sv",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-19",
    ucret: "Yurt dışı Tisus (2026'dan itibaren): tam sınav 2.875 SEK, kalan bölüm (restprov) 1.440 SEK; kartla ödenir. Buna ek olarak yurt dışındaki sınav görevlisine sınav günü doğrudan ödenen bir ücret (posta, salon, gözetmen) çoğu zaman eklenir. İptal: sınavdan en geç 11 gün önce, idari kesintiyle.",
    kaynaklar: [
      {
        "ad": "Stockholm Üniversitesi, About Tisus (güncelleme 01.09.2026)",
        "url": "https://www.su.se/english/divisions/tisus---test-in-swedish-for-university-studies/about-tisus",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Stockholm Üniversitesi, Provorter Tisus utland 2025 (PDF, harita 02.12.2025)",
        "url": "https://www.su.se/download/18.39dc5cbc19afcf09c00165a/1765377242786/Provorter_Tisus_utland_2025.pdf",
        "belgeYili": "2025",
        "erisim": "2026-10-16"
      },
      {
        "ad": "Aalto, Fince/İsveççe dil yeterliliği",
        "url": "https://www.aalto.fi/fi/hakijapalvelut/suomen-tai-ruotsin-kielen-taidon-osoittaminen-kandidaattivalinnoissa",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Stockholm Üniversitesi, Om Tisus (Anmälan och avgift Tisus utland)",
        "url": "https://www.su.se/enheter/tisus---test-i-svenska-for-universitets--och-hogskolestudier/om-tisus",
        "belgeYili": "2026",
        "erisim": "2026-10-19"
      },
      {
        "ad": "Stockholm University, Tisus contact",
        "url": "https://www.su.se/english/divisions/tisus---test-in-swedish-for-university-studies/contact",
        "belgeYili": "2026",
        "erisim": "2026-10-19"
      }
    ]
  },
  {
    id: "yki",
    ad: "YKI (Yleiset kielitutkinnot, Ulusal Dil Yeterlik Sertifikası)",
    kategori: "Dil Sınavı",
    kurum: "Opetushallitus (Finlandiya Ulusal Eğitim Ajansı)",
    ulkeler: ["fi"],
    format: "Dört alt test: dinleme, konuşma, okuma, yazma; her biri ayrı değerlendirilir. Temel, orta ve ileri düzey sınavları. 2027 baharında tüm Fince ve İsveççe sınavlar dijital (merkezde bilgisayarda).",
    sure: "Teyit gerekir.",
    puanlama: "Altı basamaklı ölçek, CEFR A1–C2'ye karşılık gelir. Aalto: orta düzeyde dört alt testin hepsinde 4 ya da ileri düzeyde en az üç alt testte 5–6.",
    tarih: "Türkiye'de yapılmıyor: resmi sayfaya göre sınava Finlandiya'daki merkezlerde yüz yüze girilir. Fince 2027 bahar tarihleri: 16 Ocak, 13 Şubat, 10 Mart, 10 Nisan, 24 Nisan, 12 Mayıs, 22 Mayıs, 2 Haziran 2027. Sonuç yaklaşık 2 ay.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Finlandiya: Aalto Fince/İsveççe lisans ve YL seçeneklerinde YKI'yı kabul ediyor; farklı oturumlardaki alt testler birleştirilebilir. Sonuç 2 ay sürdüğü için başvuru son gününden en az 3 ay önce sınava gir. Bu bulgu Tur 11'deki 'YKI Türkiye'de var mı' maddesini kapatır. Tur 11: lisans-fi.json > lis-fi-yerel-yki, lis-fi-yerel-yki-yer; yl-fi.json > yl-fi-yerel-yki, yl-fi-yerel-yki-yer.",
    kaynak: "https://www.oph.fi/en/education-and-qualifications/selecting-right-yki-test-test-days",
    dil: "fi",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-16",
    ucret: "Temel düzey 165 €, orta düzey 190 €, ileri düzey 216 € (alt test tek tek: dinleme 43 €, konuşma 84 €, okuma 43 €, yazma 70 €; KDV %0).",
    kaynaklar: [
      {
        "ad": "OPH, doğru YKI sınavını seçmek ve sınav günleri",
        "url": "https://www.oph.fi/en/education-and-qualifications/selecting-right-yki-test-test-days",
        "belgeYili": "2026–2027",
        "erisim": "2026-10-16"
      },
      {
        "ad": "OPH, YKI kaydı ve ücretler (Kararname 1508/2025)",
        "url": "https://www.oph.fi/en/education-and-qualifications/registering-yki-test",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "OPH, Dijital YKI pilotu (18.09.2026)",
        "url": "https://www.oph.fi/en/news/2026/digital-yki-tests-will-be-piloted-november-2026",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      }
    ]
  },
  {
    id: "studieproven-dansk",
    ad: "Studieprøven i dansk som andetsprog / Danskprøve 2–3",
    kategori: "Dil Sınavı",
    kurum: "Danimarka dil eğitim merkezleri (Danimarka Bakanlığı çerçevesi)",
    ulkeler: ["dk"],
    format: "Dört bölüm (okuma, dinleme, yazma, konuşma); Danimarka dil eğitimi sisteminin bitirme sınavları.",
    sure: "Yazılı ve sözlü bölüm; yazılı bölüm tek günde, sözlü bölüm ayrı dönemde. Bölüm süreleri bu turda okunmadı.",
    puanlama: "Danimarka 7'li not ölçeği. Kopenhag Üniversitesi her bölümde en az 02; Aarhus YL için dört bölümün her birinde en az 2 (Danskuddannelse 3 Modül 6 sonrası).",
    tarih: "Sınavlar Danimarka'da, Göç ve Entegrasyon Bakanlığı'na bağlı SIRI'nin yetkilendirdiği sınav yapan dil merkezlerinde (prøveafholdende udbyder) yapılır; aday sınava girmek istediği sprogcenter'a doğrudan kaydolur. Yönetmelikte yurt dışında sınav yeri öngören bir hüküm yok; Türkiye'de sınav yeri yok. 2027: Mayıs–Haziran dönemi yazılı sınavlar 10–13 Mayıs 2027, sözlü 14–25 Haziran 2027, kayıt son günü 1 Mart 2027; Kasım–Aralık dönemi Studieprøven 8 Kasım 2027, Prøve i Dansk 3 9 Kasım 2027, sözlü 6–17 Aralık 2027, kayıt son günü 30 Ağustos 2027. Kayıt, dönem başlangıcından en az 10 hafta önce.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Danimarka: Danca programlar için Studieprøven ya da Danskprøve 2, bazı programlar Danskprøve 3 ister; şart program başlamadan karşılanmalı. Bakanlık önerisi: İngilizce lisansla başlayıp Danca'yı Danimarka'da ücretsiz öğrenerek YL'ye Danca devam etmek. Kopenhag Üniversitesi Tisus'u da kabul ediyor. Tur 11: lisans-dk.json > lis-dk-yerel-dil, lis-dk-yerel-sinav-yeri; yl-dk.json > yl-dk-yerel-dil. Tur 14: 'Türkiye'de mi, Danimarka'da mı' sorusu kapandı: Danimarka'da. Türk öğrenci için pratik yol: İngilizce programla Danimarka'ya gidip Danca'yı orada öğrenmek ve sınava orada girmek (Bakanlık önerisiyle uyumlu). Danca lisansa doğrudan başvuru, Türkiye'den sınav yapılamadığı için gerçekçi değil.",
    kaynak: "https://studyindenmark.dk/study-options/how-to-apply/language-requirements",
    dil: "da",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-19",
    ucret: "Kendi parasıyla giren aday için ücret merkezde ödenir; Kopenhag Belediyesi dil merkezinde Danca sınav kaydı 1.646 DKK. Studieprøven tutarı merkeze göre; Teyit gerekir.",
    kaynaklar: [
      {
        "ad": "Study in Denmark (Bakanlık), dil şartları",
        "url": "https://studyindenmark.dk/study-options/how-to-apply/language-requirements",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "Kopenhag Üniversitesi, Dansk A og danskkvalifikationer",
        "url": "https://www.ku.dk/studier/bachelor/ansoegning-og-optagelse/individuelle-forhold/ansoeg-med-en-ikke-dansk-eksamen/dansk-a-og-danskkvalifikationer",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Aarhus University, Danca dil şartları (YL)",
        "url": "https://masters.au.dk/danish-language-requirements",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Bekendtgørelse nr. 1627 af 6. december 2024 om prøver inden for danskuddannelse til voksne udlændinge m.fl. (Lovtidende A 2024)",
        "url": "https://www.lovtidende.dk/api/pdf/247028",
        "belgeYili": "2024 (yürürlükteki son metin olarak bulundu)",
        "erisim": "2026-10-19"
      },
      {
        "ad": "danskogproever.dk, kayıt son günleri ve sınav tarihleri",
        "url": "https://danskogproever.dk/tilmeldingsfrister-og-proevedatoer/",
        "belgeYili": "2026",
        "erisim": "2026-10-19"
      },
      {
        "ad": "danskogproever.dk, Prøvedatoer 2027 (PDF)",
        "url": "https://danskogproever.dk/media/hjhnubl1/proevedatoer-2027.pdf",
        "belgeYili": "2027",
        "erisim": "2026-10-19"
      },
      {
        "ad": "Københavns Kommune, Danskprøver – selvbetalt",
        "url": "https://www.kk.dk/borger/uddannelse/danskuddannelse-til-nyankomne-udlaendinge/danskproever-selvbetalt",
        "belgeYili": "2026",
        "erisim": "2026-10-19"
      }
    ]
  },
  {
    id: "certyfikat-polski",
    ad: "Lehçe devlet sertifikası (B2 / C1)",
    kategori: "Dil Sınavı",
    kurum: "Państwowa Komisja do spraw Poświadczania Znajomości Języka Polskiego jako Obcego (NAWA bünyesinde)",
    ulkeler: ["pl"],
    format: "Yazılı bölüm dört modül (dinleme, okuma, dil yapıları, yazma) + sözlü bölüm. Yetişkin B2 ve C1: dinleme 30 dk, okuma 60 dk, dil yapıları 60 dk, yazma 90 dk (toplam 240 dk); konuşma B2'de en çok 15 dk, C1'de en çok 20 dk.",
    sure: "B2 ve C1: yazılı en çok 250 dk + sözlü 15–20 dk.",
    puanlama: "Yetişkin B2 ve C1: her modülde en az %60. B2 yazılı 160 puan + sözlü 40 puan; C1 aynı.",
    tarih: "2027 oturumları: 6–7 Şubat (B1, B2), 10–11 Nisan (B1, B2, C1), 12–13 Haziran (B1, B2 + gençler B1, B2), 2–3 Ekim (B1, C2), 27–28 Kasım 2027 (B1, C1 + gençler B2). Yetişkin sınavına girmek için sınav günü 18 yaşını doldurmuş olmak gerekir; 14–17 yaş grubu yalnızca B1 ve B2'ye girebilir. Türkiye'de sınav merkezi olup olmadığı okunamadı (merkez listesi Cloudflare doğrulaması arkasında; aşılmadı).",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Kritik: Polonya Yükseköğretim ve Bilim Kanunu md. 324/2-5'e göre en az C1 düzeyinde devlet sertifikası olan yabancı, devlet üniversitesinde Lehçe tam zamanlı eğitim için ücret (md. 79/1-5) ödemez. Bu muafiyet İngilizce programları kapsamaz (md. 79/1-3 ayrı kalem). B2: yasa öğretim dilinde en az B2 istiyor (lisans ve YL). Lise öğrencisi için sınırlama: C1 yetişkin sınavına ancak 18 yaşında girilebilir; 2027'de C1 yalnız Nisan ve Kasım'da. Bu bulgu Tur 11'deki 'Lehçe okuyunca ücretsiz sanmak' maddesini düzeltir (lisans-pl.json > lis-pl-yerel-hata-ucretsiz, lis-pl-yerel-ucretli).",
    kaynak: "https://certyfikatpolski.pl/terminy-sesji-egzaminacyjnych-w-2027-roku/",
    dil: "pl",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-16",
    ucret: "Merkez belirler; yasal üst sınır B1/B2 yetişkin 150 €, C1/C2 yetişkin 180 €, gençler 90 €. Sertifika ücreti 20 € karşılığı zloti.",
    kaynaklar: [
      {
        "ad": "Państwowa Komisja, 2027 sınav oturumları (14.07.2026)",
        "url": "https://certyfikatpolski.pl/terminy-sesji-egzaminacyjnych-w-2027-roku/",
        "belgeYili": "2027",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Państwowa Komisja, sınav ücretleri",
        "url": "https://certyfikatpolski.pl/o-egzaminie/oplaty-za-egzamin/",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Państwowa Komisja, kimler girebilir ve sınav yapısı",
        "url": "https://certyfikatpolski.pl/o-egzaminie/kto-moze-zdawac-egzamin/",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Państwowa Komisja, sınav yapısı ve geçme eşikleri",
        "url": "https://certyfikatpolski.pl/o-egzaminie/struktura-egzaminu/",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Ustawa Prawo o szkolnictwie wyższym i nauce, tekst jednolity Dz.U. 2024 poz. 1571, md. 79 ve 324",
        "url": "https://eli.gov.pl/api/acts/DU/2024/1571/text.html",
        "belgeYili": "2024",
        "erisim": "2026-10-16"
      }
    ]
  },
  {
    id: "cce-b2",
    ad: "CCE (Czech Language Certificate Exam) B2",
    kategori: "Dil Sınavı",
    kurum: "Charles Üniversitesi ÚJOP",
    ulkeler: ["cz"],
    format: "Yazılı alt testler + konuşma alt testi. 1 Ocak 2026'dan itibaren konuşma B1–C1'de bireysel ve sınav merkezinden MS Teams ile görüntülü yapılıyor; B2 ve C1 iki güne yayılıyor (1. gün yazılı, 2. gün konuşma). Konuşma kaydedilip iki değerlendiriciyle puanlanıyor.",
    sure: "Teyit gerekir.",
    puanlama: "CEFR A1–C1 düzey sınavları; ALTE Q işaretli. Puan eşiği bu turda okunmadı.",
    tarih: "Çekya'da ve yurt dışında yapılıyor; yer seçimi kayıt sayfasında. Türkiye'de merkez görülmedi (Tur 11). Kayıtlar saat 08:00'de açılıyor.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Çekya: Çekçe programların çoğu en az B2 istiyor; devlet üniversitelerinde Çekçe eğitim ücretsiz (Study in Czechia). Çekçe B2'ye Türkiye'den ulaşmanın resmi yolu ÚJOP hazırlık yılı (Mühendislik ve BT COMPLEX: 3 dönem, 170.100 CZK ≈ 7.300 €). Lisans ve YL için aynı. Tur 11: lisans-cz.json > lis-cz-yerel-cce, lis-cz-yerel-ujop; yl-cz.json > yl-cz-yerel-sinav.",
    kaynak: "https://ujop.cuni.cz/UJOPEN-70.html?ujopcmsid=12:czech-language-certificate-exam-cce",
    dil: "cs",
    duzey: ["lisans", "yl"],
    kesinlik: "Teyit gerekir",
    sonKontrol: "2026-10-16",
    ucret: "Çekya'daki ücret kayıt onay e-postasında; iptal ücreti 500 CZK. Yurt dışı ücreti Teyit gerekir.",
    kaynaklar: [
      {
        "ad": "ÚJOP, CCE sınavı (2026 konuşma biçimi değişikliği)",
        "url": "https://ujop.cuni.cz/UJOPEN-70.html?ujopcmsid=12:czech-language-certificate-exam-cce",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "Study in Czechia (DZS), Çekçe öğren harçsız oku",
        "url": "https://www.studyin.cz/plan-your-studies/learn-czech-study-tuition-free/",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "macarca-ecl-hazirlik",
    ad: "Macarca: ECL sınavı ve Macarca hazırlık yılı",
    kategori: "Dil Sınavı",
    kurum: "ECL Konsorsiyumu (Pécs) / Stipendium Hungaricum",
    ulkeler: ["hu"],
    format: "ECL: iletişim odaklı, 15 dilde, A2–C1 sınav sistemi. Macarca programlara kabulde belirleyici olan ise kurumun kendi giriş sınavında ölçülen Macarca düzeyidir.",
    sure: "Teyit gerekir.",
    puanlama: "ECL: A2, B1, B2, C1. Macar üniversitelerinin hangi düzeyi istediği programa göre; Teyit gerekir.",
    tarih: "ECL 39 ülkede 180 merkezde yapılıyor; ecl.hu yalnızca Macaristan'daki sınavları anlatıyor. Türkiye'de ECL merkezi olup olmadığı doğrulanamadı.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Asıl yol hazırlık yılı: Stipendium Hungaricum'da Macarcası yetersiz aday, Macarca lisanstan önce zorunlu bir yıllık dil hazırlık kursuna başvurur (lisans programına değil). Doğrudan Macarca programa başvuran adayın düzeyi kurumun giriş sınavında ölçülür; yalnız Macarca programlara başvurup dil sınavını geçemeyen hiçbir yere kabul edilmez. İngilizce programlarda Macarca gerekmez (SH bursiyerine zorunlu Macarca dersi var). Tur 11: lisans-hu.json > lis-hu-yerel-hazirlik, lis-hu-yerel-dil, lis-hu-yerel-sinav-tr.",
    kaynak: "https://ecl.hu/",
    dil: "hu",
    duzey: ["lisans", "yl"],
    kesinlik: "Teyit gerekir",
    sonKontrol: "2026-10-16",
    ucret: "Teyit gerekir.",
    kaynaklar: [
      {
        "ad": "ECL Vizsgaközpont ana sayfa",
        "url": "https://ecl.hu/",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "Stipendium Hungaricum, Call for Applications (2025/26 metni)",
        "url": "https://stipendiumhungaricum.hu/documents/stipendium_hungaricum/Call/BA_MA_OTM_Call_for_Applications.pdf",
        "belgeYili": "2025/26",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "pte-academic",
    ad: "PTE Academic",
    kategori: "Dil Sınavı",
    kurum: "Pearson",
    ulkeler: ["de", "it", "at", "se", "hu"],
    format: "Bilgisayarda, test merkezinde; dört beceri (konuşma ve yazma, okuma, dinleme). Oda başına en çok 15 aday.",
    sure: "2 saat",
    puanlama: "10–90 (Global Scale of English); genel puan + beceri dökümü. Sonuç genellikle 2 gün.",
    tarih: "Türkiye'de 12 test merkezi (Ankara, Erzurum, Denizli, İstanbul, Van dahil); sık ve son dakika tarihleri.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Eşikler: TUM YL 65, Stuttgart INFOTECH ve TU Graz YL 76, İsveç English 6: 62 (yazma 61), English 7: 68, PoliMi YL 59, BME YL 50. Sonuç 2 yıl geçerli (kurum farklı süre kabul edebilir). Avrupa'da kabul IELTS/TOEFL'dan dar; programın listesinde görmeden seçme. Tur 11: yl-genel.json > yl-dil-pte (Türkiye ücreti ve merkezleri bu turda doğrulandı).",
    kaynak: "https://www.pearsonpte.com/test-centers-and-fees/",
    dil: "en",
    duzey: ["lisans", "yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-16",
    ucret: "Türkiye: 10.000 TRY (Pearson Türkiye fiyatı).",
    kaynaklar: [
      {
        "ad": "Pearson PTE, test merkezleri ve ücretler (Türkiye seçimi)",
        "url": "https://www.pearsonpte.com/test-centers-and-fees/",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "Pearson PTE Academic",
        "url": "https://www.pearsonpte.com/pte-academic/",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      }
    ]
  },
  {
    id: "cambridge-c1-c2",
    ad: "Cambridge C1 Advanced / C2 Proficiency",
    kategori: "Dil Sınavı",
    kurum: "Cambridge University Press & Assessment",
    ulkeler: ["de", "it", "at", "ch", "nl", "be", "es", "se", "dk", "hu", "pl"],
    format: "Dijital ya da kağıt; dört beceri + dil kullanımı.",
    sure: "Her biri yaklaşık 4 saat.",
    puanlama: "Cambridge English Scale: C1 Advanced 180–199 (C1), C2 Proficiency 200–230 (C2).",
    tarih: "Yetkili Cambridge merkezleri üzerinden. Türkiye'deki merkez ve tarih listesi bu turda okunmadı.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Sertifikanın süresi dolmaz ama kurumlar yakın tarih isteyebilir (ETH: C1 Advanced 2 yıl, C2 ve A notlu C1 5 yıl). Eşikler: DTU 180, Delft YL 185, KU Leuven YL 176 (bölüm 169), TU Graz 180, İsveç English 6: 180, TUM CAE/CPE A–C, PoliMi YL C1 Advanced C notu, BME YL B2 First 160, Gdańsk B2. Tur 11: yl-genel.json > yl-dil-cambridge.",
    kaynak: "https://www.cambridgeenglish.org/exams-and-tests/qualifications/advanced/",
    dil: "en",
    duzey: ["lisans", "yl"],
    kesinlik: "Teyit gerekir",
    sonKontrol: "2026-10-16",
    ucret: "Merkeze göre; Teyit gerekir.",
    kaynaklar: [
      {
        "ad": "Cambridge English, C1 Advanced",
        "url": "https://www.cambridgeenglish.org/exams-and-tests/qualifications/advanced/",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Cambridge English, C2 Proficiency",
        "url": "https://www.cambridgeenglish.org/exams-and-tests/qualifications/proficiency/",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      }
    ]
  },
  {
    id: "duolingo-english-test",
    ad: "Duolingo English Test",
    kategori: "Dil Sınavı",
    kurum: "Duolingo",
    ulkeler: ["hu", "ie"],
    format: "Evden, çevrimiçi; randevu gerekmez. Kurulum ve kimlik doğrulama 5 dk, puanlanan bölüm 45 dk, yazma ve konuşma örnekleri 10 dk.",
    sure: "Yaklaşık 1 saat",
    puanlama: "10–160. ETS, Duolingo ile karşılaştırma çalışması yapmadığını belirtiyor.",
    tarih: "Her an; sonuç yaklaşık 2 gün.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "UYARI: Avrupa'da kabulü sınırlı. Kabul edenler: BME (lisans ve YL 100), Trinity College Dublin (lisans 120, Foundation 80). Kabul etmeyenler: ÇVUT Elektrik Fakültesi, İsveç ulusal listesi, PoliMi YL listesi; Jean Monnet listesinde yok. Başvurmadan önce programın kabul ettiğini yazılı gör. Sonuç 2 yıl geçerli.",
    kaynak: "https://testcenter.zendesk.com/hc/en-us/articles/360011075571-How-long-are-my-Duolingo-English-Test-results-valid",
    dil: "en",
    duzey: ["lisans", "yl"],
    kesinlik: "Yoruma açık",
    sonKontrol: "2026-10-16",
    ucret: "Duolingo'nun Şubat 2026 tarihli resmi blog yazısına göre 70 ABD doları; yardım merkezinde fiyat yazmıyor. Teyit gerekir.",
    kaynaklar: [
      {
        "ad": "Duolingo English Test, test sayfası",
        "url": "https://englishtest.duolingo.com/applicants",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Duolingo yardım merkezi, sonuç geçerliliği",
        "url": "https://testcenter.zendesk.com/hc/en-us/articles/360011075571-How-long-are-my-Duolingo-English-Test-results-valid",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      }
    ]
  },
  {
    id: "gre-general",
    ad: "GRE General Test",
    kategori: "Giriş Sınavı",
    kurum: "ETS",
    ulkeler: ["de", "be", "it", "ch", "nl", "fi", "es"],
    format: "Bilgisayarda (test merkezinde ya da evden). Beş bölüm: Analytical Writing 1 görev ('Analyze an Issue', 30 dk, her zaman ilk); Verbal Reasoning 12 soru/18 dk + 15 soru/23 dk; Quantitative Reasoning 12 soru/21 dk + 15 soru/26 dk. Sözel ve sayısal bölümler bölüm düzeyinde uyarlamalı; ekranda hesap makinesi var.",
    sure: "Yaklaşık 1 saat 58 dk (22 Eylül 2023'ten beri)",
    puanlama: "Sözel ve sayısal ayrı ölçekli puan; Analytical Writing 6 puanlık bütüncül ölçek. Sözel/sayısal ölçek aralığı ETS sayfasında yazmıyor (Teyit gerekir).",
    tarih: "Evden sınav haftanın 7 günü, 24 saat. 21 günde bir, 12 ayda en çok 5 kez. Puan 8–10 günde, 5 yıl raporlanabilir.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Yalnız yüksek lisans. Almanya: RWTH, AB dışından lisans derecesi olan aday için birçok programda GRE'yi zorunlu tutuyor (Informatik/Data Science: sözel %15, sayısal %75 dilimi, yazma 3,5; Makine vb.: sözel 145, sayısal 160, yazma 3,0); şartı tutmayan başvuru reddedilir. Belçika: KU Leuven bazı mühendislik teknolojisi YL'lerinde 'şiddetle önerilir'. İtalya: PoliTo ICT programlarında isteğe bağlı ama şiddetle önerilir. İsviçre: ETH yalnızca programın şart profilinde varsa değerlendirir. Diğer ülkelerde (AT, NL, FR, ES) genel şart yok; program sayfasına bak. TÜBİTAK 2213-A ALES yerine eşdeğer GRE kabul ediyor. Tur 11: yl-de.json > yl-de-gre; yl-genel.json > yl-genel-gre-*. Tur 14 (ilk-20 kapsam taraması): Hollanda — Maastricht MSc International Business: AACSB/EQUIS akreditesi olmayan uluslararası lisans diploması olan aday GMAT (Focus 515+, 595+ otomatik kabul) ya da eşdeğer GRE sunmak zorunda (2025-26 belgesi); Tilburg Research Master Economics: GRE zorunlu, sayısal en az 164, sınav en fazla 2 yıllık (resmi SSS sayfası; sayfa otomatik erişime 403, metin arama dizininden; ayrıca bu program lisans derecesini belirli ülkelerle sınırlıyor, Türkiye listede görünmüyor). Finlandiya — Aalto School of Business: Finlandiya dışından lisans derecesi olan aday (Kabul grubu 2) için GMAT ya da GRE zorunlu; GRE en az 154 sözel / 155 sayısal, Business Analytics ve International Management için 157/158; skor 12 Ocak 2027'ye kadar ulaşmalı, en eski sınav tarihi 7 Aralık 2021 (2027 kabulleri). İspanya — UC3M Master in Economic Analysis: GRE zorunlu değil ama şiddetle önerilir; sayısal bölümde 80. yüzdeliğin altı genellikle değerlendirilmez. Örnek bulunamayan ülkeler (resmi kaynakta zorunlu GRE görmedik): İsveç, Danimarka, İrlanda, Macaristan, Polonya, Fransa. Avusturya: CEU MA programları için 'bölüm sınavı ya da GRE' bilgisi yalnız ÖPUK sayfasında (Yoruma açık). Çekya: CERGE-EI (Charles) MA in Economic Research GRE/GMAT'ı 'şiddetle teşvik ediyor, zorunlu değil'. Mühendislik YL'lerinde bu ülkelerde GRE şartı görmedik; şart iktisat ve işletme YL'lerinde yoğunlaşıyor.",
    kaynak: "https://www.ets.org/gre/test-takers/general-test/prepare/test-structure.html",
    dil: "en",
    duzey: ["yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-19",
    ucret: "249 ABD doları (1 Ağustos 2026'dan itibaren; Türkiye için ayrı tutar yok, vergi eklenebilir). Tarih ve merkez değişikliği 55'er dolar.",
    kaynaklar: [
      {
        "ad": "ETS, GRE General Test yapısı",
        "url": "https://www.ets.org/gre/test-takers/general-test/prepare/test-structure.html",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "ETS, GRE puanlarını anlamak",
        "url": "https://www.ets.org/gre/test-takers/general-test/scores/understand-scores.html",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "ETS, GRE ücretleri",
        "url": "https://www.ets.org/gre/test-takers/general-test/register/fees.html",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "RWTH, GRE Requirements (Mart 2025)",
        "url": "https://www.rwth-aachen.de/global/show_document.asp?id=aaaaaaaacuuhvtx",
        "belgeYili": "2025",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Maastricht University, MSc International Business – Marketing-Finance, admission requirements 2025-2026 (PDF)",
        "url": "https://www.maastrichtuniversity.nl/file/admissionrequirementsmainternationalbusiness-marketing-finance2025-2026pdf",
        "belgeYili": "2025-26 (eski akademik yıl; 2027-28 sürümü kontrol edilmeli)",
        "erisim": "2026-10-19"
      },
      {
        "ad": "Tilburg University, Research Master Economics – FAQ (GRE zorunlu, QR 164)",
        "url": "https://www.tilburguniversity.edu/education/masters-programmes/research-master-economics/faq",
        "belgeYili": "2026 (sayfa 403; metin arama dizininden)",
        "erisim": "2026-10-19"
      },
      {
        "ad": "Aalto University, GMAT and GRE exams (Updated 16.9.2026; 2027 admissions)",
        "url": "https://www.aalto.fi/en/admission-services/gmat-and-gre-exams",
        "belgeYili": "2026 (2027 kabulleri)",
        "erisim": "2026-10-19"
      },
      {
        "ad": "UC3M, Master in Economic Analysis (GRE not compulsory but highly recommended; 80th percentile)",
        "url": "https://www.uc3m.es/master/economic-analysis",
        "belgeYili": "2026/27",
        "erisim": "2026-10-19"
      },
      {
        "ad": "CERGE-EI, MA in Economic Research FAQ (GRE/GMAT encouraged, not required)",
        "url": "https://ei.cerge-ei.cz/ma-in-economic-research/ma-in-economic-research-faq",
        "belgeYili": "2026",
        "erisim": "2026-10-19"
      }
    ]
  },
  {
    id: "gmat",
    ad: "GMAT (eski adıyla GMAT Focus Edition)",
    kategori: "Giriş Sınavı",
    kurum: "GMAC",
    ulkeler: ["de", "nl", "fi"],
    format: "Üç bölüm, toplam 64 soru: Quantitative Reasoning 21 soru/45 dk, Verbal Reasoning 23 soru/45 dk, Data Insights 20 soru/45 dk. Bölüm sırası seçilebilir; bölüm başına en çok 3 cevap değiştirilebilir. Test merkezinde ya da çevrimiçi.",
    sure: "2 saat 15 dk (+ isteğe bağlı 10 dk ara)",
    puanlama: "Toplam 205–805 (hepsi 5 ile biter); bölüm puanları 60–90. Birden fazla girişte otomatik GMAT Superscore. Boş bırakılan soru puan düşürür.",
    tarih: "Sürekli randevu; tekrar için 16 gün beklemek gerekir. Resmi puan raporu 3–5 gün. Puan 5 yıl geçerli.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Yalnız işletme ve yönetim yüksek lisansları. mba.com artık sınavı yalnızca 'GMAT exam' diye anıyor; 'Focus Edition' adresi bu sayfaya yönleniyor. Almanya: TUM Management and Technology YL'si GRE kabul etmiyor, yalnız GMAT; 2026/27 belgesine göre Türk derecesi için isteğe bağlı ama yüksek yüzdelik ek puan getiriyor (Teyit gerekir). İtalya ve diğer ülkelerde işletme YL'lerinin GMAT şartı Tur 11'de doğrulanmadı; bu yüzden ulkeler yalnız 'de'. Tur 11: yl-de.json > yl-de-isletme-farki; yl-genel.json > yl-genel-gmat. Tur 14: Hollanda — Maastricht MSc International Business, AACSB/EQUIS akreditesi olmayan uluslararası diplomalı aday için GMAT (Focus 515+) ya da GRE zorunlu (2025-26 belgesi). Finlandiya — Aalto School of Business, Finlandiya dışı lisans derecesi için GMAT ya da GRE zorunlu (GMAT Focus 515, Business Analytics ve International Management için 555; 2027 kabulleri). Türk öğrenci için: Türk üniversitesinin AACSB/EQUIS akreditesi Maastricht'te sınav muafiyeti yerine portfolyo seçeneği açar; akreditasyon üniversiteden teyit edilmeli.",
    kaynak: "https://www.mba.com/exams/gmat-exam/about/exam-structure",
    dil: "en",
    duzey: ["yl"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-19",
    ucret: "Türkiye: test merkezinde 250 ABD doları, çevrimiçi 275 ABD doları; ek puan raporu 35 dolar.",
    kaynaklar: [
      {
        "ad": "mba.com, GMAT yapısı",
        "url": "https://www.mba.com/exams/gmat-exam/about/exam-structure",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "mba.com, GMAT puanları",
        "url": "https://www.mba.com/exams/gmat-exam/scores",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "mba.com, sınav ödemesi (Türkiye seçimi)",
        "url": "https://www.mba.com/exams/gmat-exam/register/exam-payment",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "TUM School of Management, MMT başvuru",
        "url": "https://www.mgt.tum.de/programs/master-in-management-technology/how-to-apply",
        "belgeYili": "2026/27",
        "erisim": "2026-10-15"
      },
      {
        "ad": "Maastricht University, MSc International Business – Marketing-Finance, admission requirements 2025-2026 (PDF)",
        "url": "https://www.maastrichtuniversity.nl/file/admissionrequirementsmainternationalbusiness-marketing-finance2025-2026pdf",
        "belgeYili": "2025-26",
        "erisim": "2026-10-19"
      },
      {
        "ad": "Aalto University, GMAT and GRE exams (Updated 16.9.2026)",
        "url": "https://www.aalto.fi/en/admission-services/gmat-and-gre-exams",
        "belgeYili": "2026 (2027 kabulleri)",
        "erisim": "2026-10-19"
      }
    ]
  },
  {
    id: "eth-giris-sinavi",
    ad: "ETH Zürich giriş sınavı (indirgenmiş / tam)",
    kategori: "Giriş Sınavı",
    kurum: "ETH Zürich",
    ulkeler: ["ch"],
    format: "İndirgenmiş sınav: matematik (yazılı ve sözlü), biyoloji, kimya, fizik. Tam sınav daha geniş kapsamlı. ETH ana binasında, Almanca.",
    sure: "Teyit gerekir (Ocak oturumu 18–28 Ocak 2027 arasına yayılıyor).",
    puanlama: "Teyit gerekir (sınav yönetmeliğinde).",
    tarih: "Türkiye'de yapılmıyor; Zürih'te. Kayıt eApply'da 15 Eylül–15 Ekim (2026 penceresi 15 Ekim 2026'da kapandı); Ocak 2027 oturumu 18–28 Ocak 2027. Bir sonraki pencere 15 Eylül–15 Ekim 2027 (Ocak 2028 oturumu; bu tarih kalıbı Tur 11 sayfasına dayanıyor).",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Türk diploması için ETH, istenen alanda Türkiye'de tanınmış bir üniversiteye kabul belgesi (YKS yerleşmesi) + indirgenmiş sınav ister; bu belge yoksa tam sınav. Ayrıca Almanca C1 belgesi en geç 31 Mart'ta. ETH'de İngilizce mühendislik lisansı yok. AP yalnız ABD diploması satırında geçiyor. Tur 11: lisans-ch.json > lis-ch-eth-kural, lis-ch-eth-sinav, lis-ch-eth-sinav-kayit.",
    kaynak: "https://ethz.ch/en/studies/bachelor/application/non-swiss-matriculation-certificate/eth-entrance-examination.html",
    dil: "de",
    duzey: ["lisans"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    ucret: "İndirgenmiş sınav 550 CHF, tam sınav 800 CHF.",
    kaynaklar: [
      {
        "ad": "ETH Zürich, giriş sınavı (Ocak 2027 oturumu)",
        "url": "https://ethz.ch/en/studies/bachelor/application/non-swiss-matriculation-certificate/eth-entrance-examination.html",
        "belgeYili": "2026/27",
        "erisim": "2026-10-15"
      },
      {
        "ad": "ETH, indirgenmiş sınav içerikleri (PDF)",
        "url": "https://ethz.ch/content/dam/ethz/main/education/admission/bachelor/andere-qual/pruefungsinhalte/rAP.pdf",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      },
      {
        "ad": "swissuniversities, Türkiye satırı (2026/27)",
        "url": "https://www.swissuniversities.ch/en/topics/studying/admission-to-universities/countries-1",
        "belgeYili": "2026/27",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "epfl-giris-sinavi",
    ad: "EPFL giriş sınavı (lisans 1. sınıf)",
    kategori: "Giriş Sınavı",
    kurum: "EPFL",
    ulkeler: ["ch"],
    format: "Bilimsel dersler (Ocak) ve genel kültür dersleri (Ağustos–Eylül); Fransızca. İndirgenmiş ya da tam sınav.",
    sure: "Teyit gerekir.",
    puanlama: "Teyit gerekir (sınav yönetmeliğinde). Kontenjan sınırı yok.",
    tarih: "Türkiye'de yapılmıyor; Lozan'da. 2027 girişi: kayıt 1 Ekim–1 Aralık 2026, çekilme son günü 11 Ocak 2027; bilimsel dersler 18–22 Ocak 2027; genel kültür Ağustos–Eylül 2027.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "EPFL, AB/EFTA/İngiltere dışı diploma için iki yol sunar: koşulsuz giriş sınavı ya da kontenjanlı bir yıllık CMS matematik hazırlık sınıfı (Türkiye için %80 eşiği). YKS aranmaz. Fransızca B2 zorunlu, C1 önerilir. Önceki üniversite eğitimi nedeniyle reddedilmiş adaylar kayıt olamaz. Tur 11: lisans-ch.json > lis-ch-epfl-kural, lis-ch-epfl-sinav, lis-ch-epfl-sinav-kayit, lis-ch-epfl-cms.",
    kaynak: "https://www.epfl.ch/education/admission/admission-2/bachelor-admission-criteria-and-application/admission-examination/",
    dil: "fr",
    duzey: ["lisans"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-15",
    ucret: "Yabancı diploma kayıt ücreti 150 CHF; sınav ücreti indirgenmiş 550 CHF, tam 800 CHF.",
    kaynaklar: [
      {
        "ad": "EPFL, giriş sınavı (2026/27 kayıt dönemi)",
        "url": "https://www.epfl.ch/education/admission/admission-2/bachelor-admission-criteria-and-application/admission-examination/",
        "belgeYili": "2026/27",
        "erisim": "2026-10-15"
      },
      {
        "ad": "EPFL, lisans ve CMS kabul kriterleri",
        "url": "https://www.epfl.ch/education/admission/admission-2/bachelor-admission-criteria-and-application/",
        "belgeYili": "2026/27",
        "erisim": "2026-10-15"
      }
    ]
  },
  {
    id: "ap-physics-2",
    ad: "AP Physics 2: Algebra-Based",
    kategori: "AP",
    kurum: "College Board",
    ulkeler: ["nl"],
    format: "Hibrit dijital: çoktan seçmeliler Bluebook'ta, açık uçlu sorular Bluebook'ta görüntülenir, cevaplar kağıt kitapçığa el yazısıyla. Section I: 42 MCQ (tekil sorular ya da veri/uyaran tabanlı soru setleri), 85 dk, %50. Section II: 4 FRQ, 95 dk, %50; her türden bir soru: Mathematical Routines, Translation Between Representations, Experimental Design and Analysis, Qualitative/Quantitative Translation. Hesap makinesi serbest; referans sayfası verilir.",
    sure: "3 saat (85 dk + 95 dk)",
    puanlama: "1–5",
    tarih: "6 Mayıs 2027 Perşembe, Session 1 (Türkiye saatiyle 10:00). Sipariş son günü 13 Kasım 2026; geç sipariş 12 Mart 2027'ye kadar, sınav başına 40 $ ek ücretle (AP Central Exam Fees 2026-27). Physics 1 dersi ön koşul değil, yalnızca önerilir (AP Students, 20 Ekim 2026). Aynı gün Session 2'de AP Chemistry var; ikisine aynı gün girilebilir. College Board, MCQ sayısının ve sürelerin May 2027 sınavıyla güncellendiğini belirtiyor.",
    dersSayfasi: null,
    denemeKodu: null,
    durum: "yakinda",
    not: "Portalda Physics 2 içeriği yok. Hollanda: Groningen Physics, Applied Physics ve Astronomy lisansları Türk diplomasıyla AP Physics 2 ister (Türkiye sayfası güncellemesi 19 Ekim 2026); AB dışı aday şartları 1 Temmuz'a, koşullu kabulde vize nedeniyle 1 Haziran'a kadar tamamlar, AP puanı Temmuz'da açıklandığı için Physics 2'nin son sınıftan önceki Mayıs döneminde alınması önerilir; kabul kurulu Physics C'yi bu programlar için yetersiz buluyor. Twente fizik şartını üç yoldan biriyle kabul eder: Physics 1 + Physics 2 birlikte, Physics C: Mechanics ya da Physics C: E&M. Twente/Groningen Türk diplomasıyla 4 AP (3–5) ister; Physics 2 bunlardan biri sayılır. KMK kuralında (anabin USA-BV07, yalnızca ABD diploması için; Türk diplomasına uygulanmaz) fizik yalnız Physics C (Mechanics + E&M birlikte) ile sayılır. Not: data/mevzuat/sinav-takvimi.js'te Physics 2 satırı yok; tarih/oturum oraya da eklenmeli (2027-05-06, sabah, hibrit).",
    kaynak: "https://apcentral.collegeboard.org/courses/ap-physics-2/exam",
    dil: "en",
    duzey: ["lisans"],
    kesinlik: "Doğrulandı",
    sonKontrol: "2026-10-16",
    ucret: "ABD dışı temel ücret sınav başına 129 $ (sinav-takvimi.js ile aynı College Board kaynağı; bu turda yeniden okunmadı).",
    kaynaklar: [
      {
        "ad": "College Board AP Central, AP Physics 2 Exam (May 2027 biçimi)",
        "url": "https://apcentral.collegeboard.org/courses/ap-physics-2/exam",
        "belgeYili": "2026-27",
        "erisim": "2026-10-16"
      },
      {
        "ad": "College Board AP Central, 2027 AP Exam Dates",
        "url": "https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates",
        "belgeYili": "2027",
        "erisim": "2026-10-16"
      },
      {
        "ad": "University of Twente, AP CollegeBoard (Eylül 2027 dönemi; güncelleme 02.10.2026)",
        "url": "https://www.utwente.nl/en/education/bachelor/application-admission/admission/diplomas/AP-CollegeBoard/",
        "belgeYili": "2026",
        "erisim": "2026-10-16"
      },
      {
        "ad": "University of Groningen, Türkiye lisans giriş şartları (güncelleme 12.10.2026)",
        "url": "https://www.rug.nl/education/application-enrolment-tuition-fees/admission/non-dutch-qualification/bachelor/bachelor-entry-requirements/bachelorlinkscountry/turkey",
        "belgeYili": "2026",
        "erisim": "2026-10-15"
      }
    ]
  }
];
