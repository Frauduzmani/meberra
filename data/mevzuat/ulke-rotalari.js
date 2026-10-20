// AP MEBERRA — Ülkeye özel yol (rota) kural verisi (Tur 6, spec §8.1 ve §8.3)
// Sahibi: Ajan 13 (Kıdemli Uluslararası Kabul Mevzuatı Uzmanı) + Ajan 2 (Weber & Rossi). Hazırlanma: 12 Ekim 2026.
// Dayanak: .agents/mevzuat/karar-notu-2026-10-12.md + bu turda yeniden kontrol edilen resmi kaynaklar (erişim: 12 Ekim 2026).
// Kullanıcı kararı K1: Almanya ve İtalya iki bağımsız rotadır; biri diğerinin yedeği değildir.
// Kullanıcı kararları K2 ve K3 kapandı (§8.3): açık karar yok, acikKararlar boş.
// KURALLAR:
//  - Her adım, koşul, belge ve uyarı resmi kaynak URL'si taşır.
//  - zaman.mezuniyetGore: mezuniyet yılına göre yıl farkı (0 = mezuniyet yılı, −1 = son sınıfın başladığı yıl).
//    ay: 1–12. Mezuniyet Haziran'dadır; buna göre "mezuniyetGore: −1, ay: 9" son sınıfın Eylül'üdür.
//  - kesinlik (spec §10): "Doğrulandı" | "Yoruma açık" | "Yayımlanmadı" | "Teyit gerekir" | "Doğrulanamadı".
//    Mezuniyet yılının takvimi henüz yayımlanmadıysa kesinlik "Yayımlanmadı" yazılır; metinde hangi yılın takvimine
//    dayandığı belirtilir ve madde .agents/mevzuat/takip-listesi.md'ye eklenir.
//  - bagli.sinav -> data/mevzuat/sinavlar.js id'si; bagli.sablon -> data/kocluk/eposta-sablonlari.js id'si; bagli.sayfa -> proje içi sayfa.
//  - siniflar: "9" | "10" | "11" | "12" | "mezun"; null = herkes.
//  - Tur 10 (14 Ekim 2026, kararlar K4/K5; dayanak .agents/mevzuat/karar-notu-2026-10-14-mezun-sinif.md §4):
//    kosul: "yerlesme-yok" -> adım, hedef alanla uyumlu yerleşmesi olan ("uygun") mezunda gizlenir; diğer herkese
//      (mezun olmayanlar, yerleşmesi "yok" ya da "alan-uyumsuz" olan ve yerleşme durumunu henüz girmemiş mezun) gösterilir.
//    kesinlikYila: { "YYYY": etiket } -> takvim yılına göre kesinlik. Takvim yılı = mezuniyet yılı; mezunda hedef
//      başlangıç yılı (2027 = 2027/28). Eşleşme yoksa kesinlik kullanılır.
//    tur: "bilgi" -> işaretlenebilir bilgi notu (eylem değil).
//    Mezunda zaman: takvim hedef başlangıç yılına göre hesaplanır; mezuniyetGore < 0 olup bugünden önceye düşen
//      adımlar "Şimdi" olarak bu aya alınır (rota.js adimTarihi).
(function () {
  "use strict";

  // Sık kullanılan resmi kaynaklar
  var ANABIN = "https://anabin.kmk.org";
  var DE_TEMSILCILIK_NOTU = "https://tuerkei.diplo.de/resource/blob/2705882/e2f501fcfae013d26f393ea8e6441bdf/studium-info-2025-tur-data.pdf"; // Almanya'nın Türkiye temsilcilikleri, "Almanya'da yüksek öğrenim görmek isteyenler için bilgi notu" (Mart 2025)
  var UA_TR = "https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/tr/";
  var UA_VPD = "https://www.uni-assist.de/en/how-to-apply/plan-your-application/vpd/";
  var UA_SURE = "https://www.uni-assist.de/en/how-to-apply/plan-your-application/deadlines-processing-time/";
  var DAAD_SUREC = "https://www.daad.de/en/studying-in-germany/requirements/application-process/";
  var DAAD_GENEL = "https://www.daad.de/en/studying-in-germany/requirements/overview/";
  var OSYM_BASVURU = "https://www.osym.gov.tr/2026yks-basvurularin-alinmasi";
  var OSYM_SONUC = "https://www.osym.gov.tr/2026-yks-sonuclari-aciklandi";
  var OSYM_DUYURU = "https://www.osym.gov.tr/Duyurular/Index";
  var OSYM_KONT = "https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/TERCIH/kontkilavuz_yktd21072026.pdf";
  var AP_UCRET = "https://apcentral.collegeboard.org/exam-administration-ordering-scores/ordering-fees/exam-fees";
  var MEB_YONETMELIK = "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=18812&MevzuatTur=7&MevzuatTertip=5"; // MEB Ortaöğretim Kurumları Yönetmeliği, Md. 65 "Mezuniyet puanı" (karar notu 14 Ekim 2026, K8)

  var MUR = "https://www.unife.it/it/internazionale/venire/iscriversi/informazioni/circolare_2026-2027_studenti_internazionali.pdf"; // MUR genelgesi 2026-27 ve 2027-28 (Ferrara Üniversitesi'nin yayımladığı kopya)
  var UNIVERSITALY = "https://www.universitaly.it/it/studenti-stranieri";
  var KONS_IST = "https://consistanbul.esteri.it/it/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/studiare-in-italia/universita/laurea-triennale-e-laurea-magistrale-a-ciclo-unico/";
  var CISIA_GEC = "https://guide.cisiaonline.it/en/node/206";
  var CISIA_CENTS = "https://www.cisiaonline.it/en/cent/cent-s/structure-and-syllabus";
  var PADOVA = "https://apply.unipd.it/courses/course/182";
  var POLITO = "https://www.polito.it/sites/default/files/2025-12/Call%20for%20applications%20for%20admissions%20Engineering%20_%20LP%202026-27.pdf";
  var POLIMI = "https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf";
  var POLIMI_11 = "https://www.polimi.it/en/prospective-students/how-to-apply/admission-to-laurea-programmes/engineering/when-to-enrol/you-take-a-test-when-you-are-in-the-penultimate-year";
  var POLIMI_DSU = "https://www.polimi.it/fileadmin/user_upload/studenti/tasse-borse-agevolazioni-economiche/dsu/bando_2026-2027/DSU_Call_a.y._2026-2027.pdf";
  var POLIMI_YURTDISI = "https://www.polimi.it/en/students/tuition-fees-scholarships-and-financial-aid/tuition-fees/students-with-income-and-property-abroad";
  var SAPIENZA = "https://www.uniroma1.it/sites/default/files/field_file_allegati/14824_en_0.pdf";
  var DISCO = "https://laziodisco.it/wp-content/uploads/2026/07/BANDO-DIRITTO-ALLO-STUDIO-ENG-26-27.pdf";
  var EDISU = "https://www.edisu.piemonte.it/sites/default/files/documentazione/bandi-di-concorso/Bando_borsa_di_studio_servizio_abitativo_premio_di_laurea_contributo_studenti_con_disabilit%C3%A0_dal_46_p.c._iscritti_al_collocamento_mirato_a.a._2026-27_0.pdf";

  var TAKVIM_NOTU_OSYM = "(ÖSYM 2026 takvimine göre; mezuniyet yılının ÖSYM takvimi henüz yayımlanmadı, ÖSYM yıllık takvimi genellikle bir önceki yılın Kasım ayında açıklar)";

  window.APMEBERRA_ROTALAR = {

    // =====================================================================================
    // ALMANYA ROTASI
    // =====================================================================================
    de: {
      ad: "Almanya rotası",
      temelKural: {
        baslik: "YKS'de lisans programına yerleşme → yerleşilen alanda doğrudan giriş (anabin TUR-BV05)",
        detay: "Türk lise diplomasıyla Almanya'da lisansa doğrudan girişin resmi yolu tektir: YKS'de ilgili puan türünde 180'in üzerinde puan almak ve Türkiye'de en az 4 yıllık, örgün bir lisans programına yerleşmek. Bu yerleşme, yalnızca yerleşilen alan ve komşu alanlar için giriş hakkı verir (\"für das auf der Code-Karte genannte Fach und benachbarte Fächer\"). Mühendislik okumak istiyorsan YKS tercihinde mühendislik programı yazmalı ve birine yerleşmelisin. Türk diploması + AP için anabin'de kural yoktur; AP bu rotada giriş hakkı değil, profil gücüdür. Yerleşme yoksa Studienkolleg yolu da yoktur. Son kararı her zaman başvurduğun üniversite verir.",
        kaynak: ANABIN,
        kesinlik: "Doğrulandı"
      },

      kosullar: [
        {
          id: "de-k-alan",
          baslik: "Yerleştiğin alan, Almanya'da okuyacağın alanla uyumlu olmalı",
          detay: "TUR-BV05 giriş hakkını ÖSYM belgesinde yazan alanla ve komşu alanlarla sınırlar. Örnek: Türkiye'de Makine Mühendisliği'ne yerleşen aday Almanya'da makine ve yakın mühendislik programlarına başvurabilir; İşletme'ye yerleşen aday mühendislik programına başvuramaz. Hangi alanların \"komşu\" sayıldığına üniversite karar verir; emin değilsen yazılı sor.",
          kaynak: ANABIN,
          kesinlik: "Doğrulandı"
        },
        {
          id: "de-k-puan",
          baslik: "Puan türü ve eşik: ilgili puan türünde 180'in üzerinde",
          detay: "anabin, 2018'den bu yana SAY, SÖZ, EA ya da DİL puan türünde 180'in üzerinde puan ister (yalnızca 2020 için eşik 170'ti). Mühendislik lisans programlarına Türkiye'de SAY puanıyla yerleşilir; bu yüzden mühendislik hedefinde SAY puanın 180'i aşmalı. Almanya'daki temsilciliklerin bilgi notu da aynı eşiği yazıyor.",
          kaynak: ANABIN,
          kesinlik: "Doğrulandı"
        },
        {
          id: "de-k-dortyil",
          baslik: "En az 4 yıllık, örgün (yüz yüze) bir lisans programına yerleşme",
          detay: "Yerleşme \"mindestens vierjährig\" bir Lisans/Mühendis programına ve örgün öğretim yapan bir fakülteye olmalı. Açıköğretim ve uzaktan öğretim programları bu kuralı sağlamaz. Bir Yüksekokulun 4 yıllık programına yerleşme (TUR-BV14) yalnızca Fachhochschule'lere alana bağlı giriş verir.",
          kaynak: ANABIN,
          kesinlik: "Doğrulandı"
        },
        {
          id: "de-k-myo",
          baslik: "MYO (önlisans) istisnası: yalnızca FH Studienkolleg'i",
          detay: "Meslek Yüksekokulu'na (2 yıllık önlisans) yerleşmek doğrudan giriş vermez. Meslek Yüksekokulunda 1 yıl okuyup TYT'de 150'nin üzerinde puanı olan aday yalnızca Fachhochschule'lere açılan Studienkolleg'e girebilir (TUR-BV07). Önlisans diplomasını bitiren aday alana bağlı doğrudan giriş alır (TUR-BV08). Açıköğretim fakültesinde 2 yıl başarıyla okuyan aday da alana bağlı giriş alır (TUR-BV06). Bunlar uzun ve dar yollardır; asıl hedef 4 yıllık lisans programına yerleşmektir.",
          kaynak: ANABIN,
          kesinlik: "Doğrulandı"
        },
        {
          id: "de-k-dil",
          baslik: "Dil belgesi programa göre değişir",
          detay: "İngilizce programlar genellikle IELTS 6.0–6.5 ya da TOEFL iBT 72–90 ister (ör. TUHH ve KIT 6.5/90, HSHL ve TH Rosenheim 6.0). Bazı programlar ayrıca Almanca A2–B1 ister. Eşik her programın resmi sayfasında yazar; Üniversitelerim sayfasında kaynaklarıyla listelidir.",
          kaynak: "https://www.tuhh.de/tuhh/en/studying/before-studying/application/bachelor/language-proficiency",
          kesinlik: "Doğrulandı"
        },
        {
          id: "de-k-istisna",
          baslik: "Üniversitenin bireysel istisna tanıması",
          detay: "anabin bir değerlendirme önerisidir; son kararı üniversite ya da eyaletin tanıma birimi verir. Bir üniversitenin Türk diploması + AP ile ya da yerleşme belgesi olmadan istisna tanıyıp tanımayacağını yalnızca üniversite söyleyebilir; resmi kaynaklarda bu konuda genel bir kural yok. Rotadaki teyit e-postasını gönder (şablon: de-uni-ap-yks-teyit). Örnek: KIT Carl Benz School kabul sayfası Türk adaylar için açıkça 'Lise Diplomasi + ÖSYM / YKS' yazıyor.",
          kaynak: DAAD_GENEL,
          kesinlik: "Teyit gerekir"
        }
      ],

      adimlar: [
        {
          id: "de-diploma-notu",
          baslik: "Her yılın notu diplomanın dörtte biri",
          detay: "Mezuniyet puanı 9, 10, 11 ve 12. sınıfların yılsonu başarı puanlarının eşit ağırlıklı ortalamasıdır; hazırlık sınıfı sayılmaz. Bu puan YKS'de OBP'ye çevrilir: OBP = diploma notu × 5 (250–500) ve yerleştirme puanına OBP × 0,12 eklenir (en fazla 60 puan). Almanya'da diploma notu modifiye Bavyera formülüyle Alman notuna çevrilir. Türk diploması için formülde kullanılacak en yüksek ve en düşük not değerlerini uni-assist ve ZAB belirler; bu değerler resmi kaynakta yayımlanmadığı için teyit gerekir.",
          kaynak: MEB_YONETMELIK,
          kesinlik: "Doğrulandı",
          zaman: { metin: "Her öğretim yılı (9–12. sınıf); yılsonu notları" },
          siniflar: ["9", "10"],
          tur: "hazirlik",
          bagli: null,
          zorunlu: false
        },
        {
          id: "de-mezun-yerlesme-kontrol",
          baslik: "Elindeki yerleşme belgesi hangi alanda?",
          detay: "Önce elindeki ÖSYM \"Yerleştirme Sonuçları\" belgesinin alanını kontrol et. Hedef Alman programıyla aynı ya da komşu alandaysa YKS'ye yeniden girmen gerekmez: anabin TUR-BV05 eşikleri sınav yılına göre verir ve yerleşmenin hangi yılda olduğuna dair bir süre sınırı koymaz. Üniversitenin geçmiş yıl yerleşme belgesini kabul ettiğini yine de yazılı teyit et; bunu yalnızca üniversite söyleyebilir (teyit gerekir). Yerleşmen yoksa ya da alan uymuyorsa YKS'ye yeniden girmen gerekir. Önceki yıl bir programa yerleştiysen (kayıt yaptırmasan da) yeni yılın yerleştirmesinde OBP katsayın yarıya iner (ÖSYM 2026-YKS Kılavuzu §4.2). Yerleşme durumunu profilinde belirtirsen Rotam yalnızca sana uyan adımları gösterir.",
          kaynak: ANABIN,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: -1, ay: 9, metin: "Hemen; YKS'ye yeniden girip girmeyeceğine karar vermeden önce" },
          siniflar: ["mezun"],
          tur: "karar",
          bagli: { sayfa: "profil.html#pf-yerlesme" },
          zorunlu: true
        },
        {
          id: "de-mezun-ap-uyari",
          baslik: "Mezuniyetten sonra alınan AP Almanya'da giriş hakkı vermez",
          detay: "Türk lise diploması için anabin'de AP'ye dayanan bir giriş kuralı yoktur. AP kuralı (USA-BV07/08) yalnızca ABD High School Diploma ile birlikte geçerlidir ve AP sınavlarının lise bitmeden alınmasını şart koşar. AP sertifikası tek başına giriş hakkı açmaz. Bu yüzden Almanya hedefinde AP'ye para ve zaman ayırman önerilmez; mezun profilinde AP adımları ve AP sınavları gösterilmez. AP'yi başka bir ülkedeki bir üniversite gerçekten istiyorsa, dış aday kabul edip etmediğini İstanbul'daki sınav merkezlerine sorabilirsin.",
          kaynak: ANABIN,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: -1, ay: 9, metin: "Planını kurarken" },
          siniflar: ["mezun"],
          tur: "bilgi",
          bagli: null,
          zorunlu: false
        },
        {
          id: "de-mezun-aday-vizesi",
          baslik: "İsteğe bağlı: öğrenci adayı vizesi (9 ay)",
          detay: "Henüz kabul almadıysan başvuru sürecini Almanya'da yürütmek için öğrenci adayı vizesi seçeneği var. Almanya'nın Türkiye temsilciliklerinin Mart 2025 bilgi notuna göre bu vize 9 ay geçerlidir; lise diploması, ÖSYM sonuç belgesi ve finansman kanıtı istenir. Şartlar değişebilir; başvurmadan önce temsilciliğin güncel listesini kontrol et.",
          kaynak: DE_TEMSILCILIK_NOTU,
          kesinlik: "Doğrulandı",
          zaman: { metin: "Kabul gelmeden önce; yalnızca başvuruyu Almanya'da yürütmek istersen" },
          siniflar: ["mezun"],
          tur: "basvuru",
          bagli: null,
          zorunlu: false
        },
        {
          id: "de-ap-profil",
          baslik: "AP sınavları (isteğe bağlı): profil gücü için",
          detay: "AP bu rotada giriş hakkı vermez; yine de matematik ve fen altyapını belgeler, KIT ya da TUM gibi seçici programlarda dosyanı güçlendirebilir. Sipariş son günü 2027 sınavları için 13 Kasım 2026'dır; geç siparişe sınav başına 40 $ eklenir. Physics C (Mechanics + E&M) ve Chemistry ayrı derslerdir; ikisini de alabilirsin. KMK uyumunu izlemek istersen bilgi notu: ikisi de KMK fen dersi şartını karşılar; ikinci fen dersinin 4. ders sayılması Yoruma açık, güvenli 4. ders CS A ya da Micro + Macro birlikte. Physics 1 fen dersi sayılmaz. KMK kuralı yalnızca ABD diploması için geçerli olduğundan bu bilgi giriş hakkı değil, uyum ve profil bilgisidir.",
          kaynak: AP_UCRET,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: -2, ay: 11, metin: "Sipariş son günü Kasım ortası (2027 sınavları için 13 Kasım 2026); sınavlar Mayıs'ta" },
          siniflar: ["9", "10", "11"],
          tur: "sinav",
          bagli: { sinav: "ap-calculus-bc" },
          zorunlu: false
        },
        {
          id: "de-almanca",
          // Tur 12 (15 Ekim 2026, Ajan 13 karar-notu-2026-10-15-lisans-de-it-dil.md §3/5): bu adım İngilizce yola aittir.
          // Almanca yolda giriş şartı C1 düzeyinde Almanca belgesidir (DSH-2, TestDaF 4x4, Goethe C2, telc C1 Hochschule; KMK/HRK RO-DT 2025).
          dil: "en",
          baslik: "Almanca A2–B1 (yalnızca bazı programlarda)",
          detay: "İngilizce programların çoğu Almanca istemez; ama bazıları ister: DIT Artificial Intelligence mezuniyete kadar A2; TH Rosenheim Applied AI başvuruda A2 (Goethe A2, TELC A2 ya da TestDaF TDN 3); TUM Information Engineering başvuruda Almanca sertifikası; Duisburg-Essen Mechanical Engineering (ISE) girişte B1. Bu programlardan birini hedefliyorsan son sınıfa girmeden Almanca kursuna başla. Almanca, programın zorunlu tutmadığı yerde de günlük yaşam ve staj için işine yarar.",
          kaynak: "https://th-deg.de/ain-b-en",
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: -1, ay: 6, metin: "Son sınıftan önceki yaz başlanır; belge programa göre başvuruda ya da mezuniyete kadar" },
          siniflar: null,
          tur: "hazirlik",
          bagli: { sayfa: "universiteler.html#de" },
          zorunlu: false
        },
        {
          id: "de-hedef-program",
          baslik: "Hedef alanı ve 2–4 programı kesinleştir",
          detay: "Giriş hakkı yerleştiğin alana bağlı olduğu için önce Almanya'da okuyacağın alanı seç (ör. makine, elektrik-elektronik, bilgisayar mühendisliği). YKS tercih listeni bu alana göre kuracaksın. Her program için şunları not et: başvuru kanalı (uni-assist ya da doğrudan), son tarih, yalnızca kış mı yoksa yaz döneminde de mi başladığı, dil eşiği, VPD isteyip istemediği, harç. Bavyera ve Baden-Württemberg AB dışı öğrencilerden harç alır.",
          kaynak: DAAD_GENEL,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: -1, ay: 9, metin: "Son sınıfın başında (Eylül)" },
          siniflar: null,
          tur: "karar",
          bagli: { sayfa: "universiteler.html#de" },
          zorunlu: true
        },
        {
          id: "de-teyit-universite",
          baslik: "Hedef üniversiteye yazılı teyit e-postası",
          detay: "Her hedef üniversiteye şunu yazılı olarak sor: (1) Türk diploması + AP ile giriş mümkün mü, yoksa TUR-BV05 (YKS yerleşmesi) tek yol mu; (2) YKS yerleştirme sonucu son başvuru tarihinden sonra gelirse sonradan teslim edilebilir mi; (3) bu program uni-assist VPD istiyor mu. 11. sınıftaysan beklemeden şimdi gönderebilirsin; yanıtlar planını erken netleştirir. Mezunsan ayrıca sor: geçmiş yılın YKS yerleşme belgesini kabul ediyorlar mı (anabin bir süre sınırı koymuyor, ama üniversitenin kendi kuralı olabilir) ve mezuniyetten sonraki dönemi ayrıca belgelemen gerekiyor mu. Kendi durumuna özel bir belge sorusu varsa uni-assist için de hazır bir şablon var (Yazışmalarım).",
          kaynak: ANABIN,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: -1, ay: 10, metin: "En geç son sınıfın güzünde (Ekim–Aralık)" },
          siniflar: null,
          tur: "basvuru",
          bagli: { sablon: "de-uni-ap-yks-teyit" },
          zorunlu: true
        },
        {
          id: "de-yks-gec-teslim",
          baslik: "Yerleştirme sonucunun geç teslimi için üniversiteye sor",
          detay: "Son dört yılda YKS yerleştirme sonuçları hep 15 Temmuz'dan sonra açıklandı: 19 Ağustos 2023, 13 Ağustos 2024, 25 Ağustos 2025, 18 Ağustos 2026. YKS puan sonuçları da 15 Temmuz'dan sonra geldi: 20 Temmuz 2023, 16 Temmuz 2024, 22 Temmuz 2025, 21 Temmuz 2026. Kış dönemi başvurularının çoğu 15 Temmuz'da kapandığı için bu dört yılın hiçbirinde ne yerleştirme belgesi ne de YKS puan belgesi bu son tarihe yetişti. Hedef programa, başvuruyu diploma ile zamanında yapıp YKS sonuç ve yerleştirme belgelerini sonradan teslim etmenin mümkün olup olmadığını yazılı sor. Örnek: KIT Carl Benz School başvuruyu 'beklenen diploma onayı' formuyla kabul ediyor ve kesin belgeleri en geç Ekim'deki kayıt son gününe kadar istiyor; YKS belgelerinin bu kurala girip girmediğini sor. Olumsuz yanıt gelirse yaz dönemi ya da bir sonraki kış dönemi planlanır.",
          kaynak: OSYM_DUYURU,
          kesinlik: "Teyit gerekir",
          zaman: { mezuniyetGore: -1, ay: 11, metin: "Son sınıfın Kasım–Aralık döneminde, hedef program kesinleşince" },
          siniflar: ["11", "12", "mezun"],
          kosul: "yerlesme-yok",
          tur: "basvuru",
          bagli: { sablon: "de-uni-yks-gec-teslim" },
          zorunlu: true
        },
        {
          id: "de-dil-sinavi",
          baslik: "İngilizce dil sınavı: IELTS Academic ya da TOEFL iBT",
          detay: "Hedef programların en yüksek eşiğini hedefle (çoğunlukla IELTS 6.5 / TOEFL iBT 90). Sonuç belgesi başvuruda ya da (TUHH gibi) kayıtta istenir. Sınava başvuru son tarihinden en az 2–3 ay önce gir; eşik tutmazsa tekrar şansın olur. Sonuçların geçerlilik süresine dikkat et (IELTS ve TOEFL genellikle 2 yıl kabul edilir; programın kuralını kontrol et).",
          kaynak: "https://www.sle.kit.edu/english/vorstudium/bachelor-mechanical-engineering-international.php",
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: -1, ay: 12, metin: "Son sınıfın Aralık–Mart döneminde (KIT gibi Nisan son tarihli programlar için en geç Mart)" },
          siniflar: null,
          tur: "sinav",
          bagli: { sinav: "ielts-academic" },
          zorunlu: true
        },
        {
          id: "de-yks-basvuru",
          baslik: "YKS başvurusu",
          detay: "YKS'ye ÖSYM üzerinden başvur (ais.osym.gov.tr, mobil uygulama ya da başvuru merkezi). Mühendislik hedefi için TYT ve AYT oturumlarına gir (SAY puanı AYT'nin matematik ve fen testlerinden hesaplanır). 2026'da başvurular 6 Şubat–2 Mart arasında alındı " + TAKVIM_NOTU_OSYM + ".",
          kaynak: OSYM_BASVURU,
          kesinlik: "Yayımlanmadı",
          zaman: { mezuniyetGore: 0, ay: 2, metin: "Şubat–Mart " + TAKVIM_NOTU_OSYM },
          siniflar: null,
          kosul: "yerlesme-yok",
          tur: "basvuru",
          bagli: null,
          zorunlu: true
        },
        {
          id: "de-program-testi",
          baslik: "Programa özel test ve erken son tarihler (yalnızca ilgili programlarda)",
          detay: "Bazı programlar ek değerlendirme yapar ve daha erken kapanır: KIT Mechanical Engineering (International) için SAT, ACT ya da TestAS sonucu, motivasyon mektubu ve dil belgesi 30 Nisan'a kadar yüklenir. DIT Artificial Intelligence kendi kabul sınavını Mayıs–Haziran'da yapar (başvuru 15 Nisan–15 Haziran). TUM programlarında yetenek değerlendirmesi ve gerekirse mülakat vardır. Bu testler giriş hakkının yerine geçmez; YKS yerleşmesine ek olarak istenir.",
          kaynak: "https://www.sle.kit.edu/english/vorstudium/bachelor-mechanical-engineering-international.php",
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: 0, ay: 4, metin: "Nisan–Haziran (programa göre)" },
          siniflar: null,
          tur: "sinav",
          bagli: { sinav: "testas" },
          zorunlu: false
        },
        {
          id: "de-yks-sinav",
          baslik: "YKS'ye gir (TYT + AYT)",
          detay: "2026'da YKS 20–21 Haziran'da yapıldı (TYT 20 Haziran; AYT ve YDT 21 Haziran) " + TAKVIM_NOTU_OSYM + ". Almanya için SAY puanında 180'in üzerine çıkman ve bir mühendislik lisans programına yerleşecek sıralamayı yakalaman gerekir.",
          kaynak: OSYM_BASVURU,
          kesinlik: "Yayımlanmadı",
          zaman: { mezuniyetGore: 0, ay: 6, metin: "Haziran " + TAKVIM_NOTU_OSYM },
          siniflar: null,
          kosul: "yerlesme-yok",
          tur: "sinav",
          bagli: null,
          zorunlu: true
        },
        {
          id: "de-basvuru-kis",
          baslik: "Kış dönemi başvurusu: uni-assist ya da üniversite portalı (VPD üniversiteye göre)",
          detay: "Kış dönemi başvuruları genellikle Mayıs başı–15 Temmuz arasındadır (programa göre daha erken olabilir; kesin tarih programın sayfasındadır). uni-assist işlemi 4–6 hafta sürer; son tarihten en az 8 hafta önce başvurulması önerilir. Bazı üniversiteler önce uni-assist'ten VPD ister (geçerlilik 1 yıl); bunu ülke değil üniversite belirler. Dikkat: YKS yerleştirme belgesi Ağustos'ta çıktığı için bu tarihe yetişmez. Başvuruyu yalnızca üniversite geç teslime yazılı izin verdiyse kış dönemi için yap; yoksa yaz dönemi adımına geç.",
          kaynak: UA_SURE,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: 0, ay: 7, metin: "Son tarih çoğunlukla 15 Temmuz (programa göre değişir)" },
          siniflar: null,
          tur: "basvuru",
          bagli: { sayfa: "universiteler.html#de" },
          zorunlu: false
        },
        {
          id: "de-yks-tercih",
          baslik: "YKS tercihi: hedef alanda 4 yıllık örgün lisans programı yaz",
          detay: "YKS sonuçları 2026'da 21 Temmuz'da açıklandı, tercihler 29 Temmuz–10 Ağustos arasında yapıldı " + TAKVIM_NOTU_OSYM + ". Almanya'da okumak istediğin alanla aynı ya da çok yakın mühendislik programlarını yaz. Önlisans (MYO), açıköğretim ve uzaktan öğretim programları TUR-BV05 şartını sağlamaz. Puanın SAY'da 180'i aşmıyorsa bu rota o yıl kapanır; seçenekleri Bilgi Merkezi'nde ve rota uyarılarında gör.",
          kaynak: OSYM_SONUC,
          kesinlik: "Yayımlanmadı",
          zaman: { mezuniyetGore: 0, ay: 7, metin: "Temmuz sonu–Ağustos başı " + TAKVIM_NOTU_OSYM },
          siniflar: null,
          kosul: "yerlesme-yok",
          tur: "karar",
          bagli: null,
          zorunlu: true
        },
        {
          id: "de-yks-yerlesme",
          baslik: "Yerleştirme sonucu: \"Yerleştirme Sonuçları\" belgesini al ve tercüme ettir",
          detay: "2026'da yerleştirme sonuçları 18 Ağustos'ta duyuruldu " + TAKVIM_NOTU_OSYM + ". ÖSYM'nin yerleştirme sonuç belgesi üniversiteyi, fakülteyi, programı ve puan türünü göstermelidir; uni-assist bu belgeyi ister. Belgeyi yalnızca Türkiye'de yeminli tercümana tercüme ettir (uni-assist yalnızca İngilizce ya da Almanca kaşeli çevirileri kabul etmez). anabin ve Alman temsilciliklerinin bilgi notu kaydı değil yerleşmeyi şart koşar ('yerleştirildiklerini belgeledikleri takdirde'). uni-assist yerleştirme belgesini kayıt yaptırmış olsan da olmasan da ister; kayıt yaptırdıysan ayrıca e-Devlet transkripti istenir. Yani Türk üniversitesine kayıt yaptırmak şart değildir. ÖSYM yerleştirme sonuç belgesini basıp postayla göndermez; sonuç ÖSYM sonuç sisteminden alınır.",
          kaynak: UA_TR,
          kesinlik: "Yayımlanmadı",
          zaman: { mezuniyetGore: 0, ay: 8, metin: "Ağustos ortası " + TAKVIM_NOTU_OSYM },
          siniflar: null,
          kosul: "yerlesme-yok",
          tur: "belge",
          bagli: null,
          zorunlu: true
        },
        {
          id: "de-sperrkonto",
          baslik: "Kabul sonrası: bloke hesap (Sperrkonto)",
          detay: "Öğrenim vizesi için bir yıllık geçim kanıtlanır. Almanya'nın Türkiye temsilciliklerinin Mart 2025 bilgi notuna göre aylık 992 €, yıllık 11.904 € bloke hesaba yatırılır ve her ay 1/12'si çekilebilir. Alternatif: Almanya'da yaşayan birinin yabancılar dairesinde düzenlenen taahhüt belgesi. Tutar her yıl değişebilir; vize başvurusundan önce güncel tutarı kontrol et.",
          kaynak: DE_TEMSILCILIK_NOTU,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: 0, ay: 8, metin: "Kabul yazısı gelir gelmez (kış başlangıcında Ağustos; yaz başlangıcında Ocak–Şubat)" },
          siniflar: null,
          tur: "belge",
          bagli: null,
          zorunlu: true
        },
        {
          id: "de-vize",
          baslik: "Kabul sonrası: öğrenim vizesi başvurusu",
          detay: "3 aydan uzun kalış için Almanya'ya girmeden önce Türkiye'deki Alman temsilciliğinden ulusal vize alınır. Turistik vize Almanya'da öğrenim amacıyla uzatılamaz. Almanya'nın Türkiye temsilcilikleri öğrenim vizesini yalnızca Auslandsportal (digital.diplo.de/studium) üzerinden yürütür; portala kayıt tek başına başvuru sayılmaz. Kayıttan başvuruya bekleme temsilciliğe göre 1–4 ay, işlem en az 15 gün (tekil durumlarda 45 güne kadar) sürer; başvuru en erken seyahatten 6 ay önce yapılabilir. Vize 6 ay geçerlidir; bu sürede Almanya'da oturma izni alınır. Pasaport en az 1 yıl geçerli olmalı. Kabul yazısını alır almaz bloke hesabı aç ve portal kaydını aynı hafta başlat.",
          // Tur 12 düzeltmesi (15 Ekim 2026, Ajan 13 yl-de-vize-kanal): Auslandsportal zorunluluğu ve 1–4 ay bekleme eklendi.
          kaynak: "https://tuerkei.diplo.de/tr-de/service/05-visaeinreise/2720740-2720740",
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: 0, ay: 8, metin: "Kabul yazısından hemen sonra; portal kaydından başvuruya 1–4 ay bekleme" },
          siniflar: null,
          tur: "basvuru",
          bagli: null,
          zorunlu: true
        },
        {
          id: "de-saglik-sigortasi",
          baslik: "Kabul sonrası: sağlık sigortası",
          detay: "Almanya'da üniversiteye kayıt için Alman standartlarını karşılayan bir sağlık sigortası kanıtlanmalıdır (DAAD). 30 yaş altı öğrenciler kamu sigortasında indirimli öğrenci tarifesinden yararlanır; DAAD bunu ayda yaklaşık 120–130 € olarak veriyor. Ülkendeki sigortayı Almanya'da kullanma imkânı DAAD'a göre çoğunlukla AB/AEA öğrencileri içindir; Türkiye bu sayfada anılmıyor. Temsilciliğin bilgi notu da her dönem sosyal ve sağlık sigortası primi ödendiğini yazıyor. Türkiye'de yapılan seyahat sağlık sigortası bu standardı karşılamaz; vize aşaması için temsilciliğin öğrenim vizesi bilgi notundaki güncel şartı kontrol et.",
          kaynak: "https://www.daad.de/en/studying-in-germany/living-in-germany/health-insurance/",
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: 0, ay: 9, metin: "Kayıttan (immatrikulation) önce" },
          siniflar: null,
          tur: "belge",
          bagli: null,
          zorunlu: true
        },
        {
          id: "de-basvuru-yaz",
          baslik: "Kış dönemi yetişmediyse: yaz dönemi ya da bir sonraki kış",
          detay: "Yaz dönemi (Nisan başlangıcı) başvuruları genellikle Aralık başı–15 Ocak arasındadır. Ancak bu rotadaki İngilizce programların çoğu yalnızca kış döneminde başlar (Saarland, TUHH, KIT, FAU, DIT, TUM). Hochschule Schmalkalden Mechatronics and Robotics ise yalnızca yaz döneminde başlar (başvuru 1 Eylül–15 Kasım). Yaz dönemi programı yoksa yerleştirme belgesiyle bir sonraki kış dönemine (mezuniyetten sonraki yılın 15 Temmuz'una kadar) başvurulur. Bu arada yerleştiğin Türk programında okumak da bir seçenektir.",
          kaynak: DAAD_SUREC,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: 1, ay: 1, metin: "Yaz dönemi için çoğunlukla 15 Ocak (mezuniyetten sonraki yıl)" },
          siniflar: null,
          tur: "basvuru",
          bagli: { sayfa: "universiteler.html#de" },
          zorunlu: false
        }
      ],

      belgeler: [
        { id: "de-b-diploma", ad: "Lise diploması + yeminli tercüme", detay: "Türkiye'de yemin etmiş tercümanın (kaşede 'yeminli tercüman') yaptığı Almanca ya da İngilizce çeviri. Temsilcilik bilgi notu ayrıca noter tasdikli fotokopi istiyor.", kaynak: UA_TR, zorunlu: true },
        { id: "de-b-yks-sonuc", ad: "YKS sonuç belgesi (puan türü ve puan)", detay: "İlgili puan türünde (mühendislik için SAY) 180'in üzerinde puanı gösterir.", kaynak: ANABIN, zorunlu: true },
        { id: "de-b-yerlesme", ad: "YKS \"Yerleştirme Sonuçları\" belgesi + yeminli tercüme", detay: "Yerleştiğin üniversiteyi, fakülteyi, programı ve puan türünü göstermelidir. Giriş hakkının asıl belgesidir.", kaynak: UA_TR, zorunlu: true },
        { id: "de-b-transkript", ad: "Türk üniversitesi transkripti (varsa)", detay: "Türkiye'de bir üniversiteye kayıt yaptırdıysan e-Devlet transkripti istenir.", kaynak: UA_TR, zorunlu: false },
        { id: "de-b-ingilizce", ad: "İngilizce dil belgesi (IELTS Academic ya da TOEFL iBT)", detay: "Eşik programa göre; bazı programlar belgeyi kayıtta ister.", kaynak: "https://www.tuhh.de/tuhh/en/studying/before-studying/application/bachelor/language-proficiency", zorunlu: true },
        { id: "de-b-almanca", ad: "Almanca belgesi (yalnızca isteyen programlarda)", detay: "DIT A2 (mezuniyete kadar), TH Rosenheim A2, TUM Information Engineering sertifika, UDE B1.", kaynak: "https://www.th-rosenheim.de/en/studies-and-further-education/courses-of-study/bachelors-degree-programmes/applied-artificial-intelligence", zorunlu: false },
        { id: "de-b-vpd", ad: "uni-assist VPD (yalnızca isteyen üniversitelerde)", detay: "4–6 haftada çıkar, 1 yıl geçerlidir; başvuru sonra üniversiteye doğrudan yapılır.", kaynak: UA_VPD, zorunlu: false },
        { id: "de-b-cv-motivasyon", ad: "CV ve (isteyen programlarda) motivasyon mektubu", detay: "Temsilcilik bilgi notu Almanca ya da İngilizce CV'yi listeler; KIT gibi programlar motivasyon mektubu ister.", kaynak: DE_TEMSILCILIK_NOTU, zorunlu: false },
        { id: "de-b-test", ad: "Programa özel test sonucu (SAT/ACT/TestAS; yalnızca isteyen programlarda)", detay: "Ör. KIT Mechanical Engineering (International).", kaynak: "https://www.sle.kit.edu/english/vorstudium/bachelor-mechanical-engineering-international.php", zorunlu: false },
        { id: "de-b-pasaport", ad: "Pasaport (en az 1 yıl geçerli)", detay: "Vize başvurusu için.", kaynak: DE_TEMSILCILIK_NOTU, zorunlu: true },
        { id: "de-b-sperrkonto", ad: "Bloke hesap kanıtı ya da taahhüt belgesi", detay: "Mart 2025 bilgi notuna göre yıllık 11.904 € (aylık 992 €).", kaynak: DE_TEMSILCILIK_NOTU, zorunlu: true },
        { id: "de-b-saglik", ad: "Sağlık sigortası belgesi", detay: "Türk seyahat sağlık sigortası öğrenim kaydı için yeterli değildir.", kaynak: "https://tuerkei.diplo.de/tr-de/service/05-visaeinreise/2620848-2620848", zorunlu: true }
      ],

      sinavlar: {
        zorunlu: ["ielts-academic|toefl-ibt"],
        secmeli: [
          "ap-calculus-ab", "ap-calculus-bc", "ap-physics-c-mechanics", "ap-physics-c-em", "ap-chemistry",
          "ap-biology", "ap-english-language", "ap-computer-science-a", "ap-microeconomics", "ap-macroeconomics",
          "ap-physics-1", "sat", "testas"
        ],
        notlar: {
          "ielts-academic|toefl-ibt": "Biri yeterli; eşik programa göre (çoğunlukla IELTS 6.0–6.5 / TOEFL iBT 72–90). Asıl giriş hakkı YKS yerleşmesidir; YKS data/mevzuat/sinavlar.js kartlarında yer almaz.",
          "ap-physics-c-mechanics": "Physics C (Mechanics + E&M birlikte) KMK fen dersi şartını karşılar. Chemistry'den ayrı bir derstir; ikisi de alınabilir. KMK bu rotada giriş hakkı vermez; bilgi notu.",
          "ap-physics-c-em": "Mechanics ile birlikte alındığında KMK fen dersi sayılır.",
          "ap-chemistry": "KMK fen dersi şartını karşılar. Physics C ile birlikte alınırsa biri fen dersi sayılır; ikincisinin 4. ders sayılması Yoruma açık. Güvenli 4. ders CS A ya da Micro + Macro birlikte.",
          "ap-physics-1": "KMK fen dersi sayılmaz; ek ders sayılıp sayılmayacağı Yoruma açık.",
          "ap-microeconomics": "KMK'da tek başına sayılmaz; Macroeconomics ile birlikte 4. ders olur.",
          "ap-macroeconomics": "KMK'da tek başına sayılmaz; Microeconomics ile birlikte 4. ders olur.",
          "sat": "Bu rotada yalnızca KIT Mechanical Engineering (International) gibi yetenek testi isteyen programlarda.",
          "testas": "KIT'te SAT/ACT yerine kullanılabilir (Core Test'te 75. yüzdelik dilim). Saarland yetenek yolunda kabul edilir (asgari puan yok, sıralama). THWS Robotics'te HZB'si olmayan AB dışı adaylardan Core ve Engineering modüllerinde en az 100 ya da SAT en az 1.050 istenir."
        }
      },

      uyarilar: [
        { metin: "AP bu rotada giriş hakkı vermez. Türk diploması + AP için anabin'de kural yoktur; KMK'nın AP kuralı (USA-BV07) yalnızca ABD High School Diploma ile birlikte geçerlidir. AP'ler profil gücü ve sınav hazırlığı içindir.", kaynak: ANABIN },
        { metin: "YKS'de lisans programına yerleşmezsen bu rota o yıl için kapanır; Studienkolleg de açılmaz (tek istisna: MYO'da 1 yıl → yalnızca FH Studienkolleg'i).", kaynak: ANABIN },
        { metin: "Takvim çakışması: kış dönemi son tarihleri çoğunlukla 15 Temmuz, YKS yerleştirme sonuçları ise Ağustos ortası (2026'da 18 Ağustos). Geç teslime izin veren program yoksa başlangıç yaz dönemine ya da bir sonraki kış dönemine kayar.", kaynak: OSYM_DUYURU },
        { metin: "Bavyera (ör. TUM, FAU, DIT, TH Rosenheim) ve Baden-Württemberg (KIT) AB dışı öğrencilerden harç ya da hizmet ücreti alır; tutarlar Üniversitelerim sayfasında kaynaklarıyla.", kaynak: "https://www.tum.de/en/studies/fees/tuition" },
        { metin: "APS sertifikası Türkiye'den gelen adaylara uygulanmaz (yalnızca Çin, Hindistan ve Vietnam).", kaynak: "https://www2.daad.de/deutschland/studienangebote/international-programmes/en/detail/9595/" }
      ],

      acikKararlar: []
    },

    // =====================================================================================
    // İTALYA ROTASI
    // =====================================================================================
    it: {
      ad: "İtalya rotası",
      temelKural: {
        baslik: "12 yıllık diploma + YKS sonuç belgesi + üniversitenin kendi giriş testi (MUR genelgesi)",
        detay: "MUR'un uluslararası öğrenci genelgesine göre lisans (1. döngü) için: (a) en az 12 yıllık eğitimle alınmış lise diploması (üniversite isterse CIMEA belgesi ya da Dichiarazione di valore ile), (b) ülkendeki akademik yeterlilik sınavını geçtiğini gösteren belge (Türkiye için YKS), (c) İtalyanca çeviriler ve (d) üniversitenin istediği diğer belgeler. Ayrıca her üniversite kendi giriş testini ister (PoliTo TIL-I; PoliMi TOL, CEnT-S ya da SAT; Padova CEnT-S; Sapienza CEnT-S ya da SAT). İtalya'da YKS'yi geçmiş olmak yeterlidir; Almanya'daki gibi bir programa yerleşme şartı yoktur. AP bu rotada kabul şartı değildir ve resmi avantaj sağlamaz. Vize gerektiren aday Universitaly ön başvurusu yapar. Genelge 2026/27 ve 2027/28 için geçerlidir; sonraki yıllar için yeni genelge yayımlanacak.",
        kaynak: MUR,
        kesinlik: "Doğrulandı"
      },

      kosullar: [
        {
          id: "it-k-12yil",
          baslik: "En az 12 yıllık eğitim",
          detay: "Türkiye'de 4+4+4 = 12 yıl olduğu için MEB lise diploması bu şartı karşılar. İstanbul Başkonsolosluğu 8 yıl zorunlu eğitim + 4 yıl lise sayar; hazırlık sınıfları sayılmaz.",
          kaynak: KONS_IST,
          kesinlik: "Doğrulandı"
        },
        {
          id: "it-k-yks",
          baslik: "YKS'yi geçtiğini gösteren belge",
          detay: "MUR genelgesinin (b) bendi ve PoliTo çağrısı Türkiye için YKS'yi açıkça istiyor. Yerleşme şartı yok. \"Geçmek\" için hangi puanın gerektiği resmi metinlerde yazmıyor.",
          kaynak: POLITO,
          kesinlik: "Yoruma açık"
        },
        {
          id: "it-k-test",
          baslik: "Üniversitenin giriş testi ve eşiği",
          detay: "PoliTo: TIL-I ≥60/100 garantili kabul, ≥30 sıralama; SAT her bölümden ≥650 (garantisiz). PoliMi: TOL ya da alternatif test (CEnT-S, TOLC-I, SAT her bölümden ≥620); İngilizce programlarda \"specific rankings\". Padova Information Engineering: yalnızca CEnT-S (2026 çağrısında normalize ≥38 ve Matematikte en az 7 doğru). Sapienza ACSAI: CEnT-S ya da SAT. Eşikler her yıl çağrıda yeniden yayımlanır.",
          kaynak: POLITO,
          kesinlik: "Doğrulandı"
        },
        {
          id: "it-k-gecerlilik",
          baslik: "Test sonucu yalnızca belirli bir akademik yıl için geçerli",
          detay: "CISIA: bir CEnT yalnızca bir sonraki akademik yılın kaydında geçerlidir (ör. 1 Kasım 2025 – 31 Ekim 2026 arasında alınan test 2026/27 kaydı için). PoliTo: TIL-I puanı yalnızca o yılın kaydı için geçerlidir ve kayıtta son sınıfta ya da mezun olmak gerekir. Bu yüzden asıl testler son sınıfta alınır.",
          kaynak: CISIA_GEC,
          kesinlik: "Doğrulandı"
        },
        {
          id: "it-k-dil",
          baslik: "İngilizce en az B2",
          detay: "PoliTo, PoliMi, Sapienza ACSAI, Padova ve diğer İngilizce programlar CEFR B2 ister; kabul edilen belgeler üniversiteye göre değişir.",
          kaynak: POLITO,
          kesinlik: "Doğrulandı"
        },
        {
          id: "it-k-kontenjan",
          baslik: "AB dışı (vize gerektiren) aday kontenjanı ve tek program kuralı",
          detay: "Üniversiteler AB dışı adaylara ayrı kontenjan ayırır ve kontenjanın en fazla %20 fazlası kadar ön başvuruyu onaylayabilir. Universitaly ön başvurusunda yalnızca bir program seçilebilir.",
          kaynak: MUR,
          kesinlik: "Doğrulandı"
        }
      ],

      adimlar: [
        {
          id: "it-diploma-notu",
          baslik: "Diploma notu İtalya'da sıralamayı etkilemiyor, Türkiye'de etkiliyor",
          detay: "PoliMi'nin mühendislik sıralaması yalnızca test puanına dayanır (2026-27 çağrısı Md. 6.2); PoliTo'da kabul TIL-I ya da SAT sonucuna dayanır. Yine de diploma notun önemlidir: YKS'de OBP olarak yerleştirme puanına eklenir ve Almanya seçeneğinde Alman notuna çevrilir. Diğer İtalyan üniversitelerinin diploma notunu kullanıp kullanmadığı için teyit gerekir.",
          kaynak: POLIMI,
          kesinlik: "Doğrulandı",
          zaman: { metin: "Her öğretim yılı (9–12. sınıf); yılsonu notları" },
          siniflar: ["9", "10"],
          tur: "hazirlik",
          bagli: null,
          zorunlu: false
        },
        {
          id: "it-mezun-uygunluk",
          baslik: "Mezunlar başvurabilir",
          detay: "Mezun olman İtalya başvurusuna engel değildir. PoliMi 2026-27 çağrısı önceki öğretim yıllarında alınmış lise diplomasını kabul eder (Md. 6.3). PoliTo TIL-I'ye mezunlar da kayıt olabilir (Md. 1.5). CISIA'nın CEnT kurallarında sınıf ya da diploma tarihi kısıtı yoktur. MUR genelgesinde mezuniyetten bu yana geçen süre için bir kural bulunmuyor. Dikkat: giriş testi sonucu yalnızca bir kayıt yılı için geçerlidir; önceki yıllarda girdiğin bir CEnT yeni kayıt yılında geçmez.",
          kaynak: POLIMI,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: -1, ay: 9, metin: "Planını kurarken" },
          siniflar: ["mezun"],
          tur: "bilgi",
          bagli: { sayfa: "universiteler.html#it" },
          zorunlu: false
        },
        {
          id: "it-mezun-yks-belgesi",
          baslik: "YKS sonuç belgenin yılını üniversiteye sor",
          detay: "MUR genelgesi ve PoliTo çağrısı YKS'yi geçtiğini gösteren belgeyi ister ama sınavın yılını belirtmez. Geçmiş yılın YKS sonuç belgesinin kabul edilip edilmediğini hedef üniversiteye yazılı sor; kabul edilmiyorsa yeni yılın YKS'sine gir. İtalya OBP'ye bakmadığı için yeniden girmek İtalya başvurunda OBP kaybı yaratmaz; OBP yalnızca Türkiye'deki yerleştirmeyi etkiler. Yanıt gelene kadar bu bilgi teyit gerektirir.",
          kaynak: POLITO,
          kesinlik: "Teyit gerekir",
          zaman: { mezuniyetGore: -1, ay: 10, metin: "Hemen; YKS başvurusu açılmadan önce" },
          siniflar: ["mezun"],
          tur: "basvuru",
          bagli: null,
          zorunlu: true
        },
        {
          id: "it-mezun-dsu-ilk-kayit",
          baslik: "Türkiye'de üniversiteye kayıt yaptırdıysan DSU'da 1. sınıf sayılmazsın (PoliMi)",
          detay: "PoliMi DSU 2026/27 çağrısına göre gereken kredi, öğrencinin İtalya'da ya da yurtdışında aynı düzeyde ilk kez kayıt yaptırdığı yıla göre hesaplanır (\"absolute first enrolment\", Md. 4.2). Türkiye'de bir lisans programına kayıt yaptırmış mezun 1. sınıf burs profilini kaybeder ve \"subsequent years\" profiliyle, kredi şartıyla başvurur. EDISU, DiSCo ve Padova gibi diğer bölgelerde aynı kuralın olup olmadığı için teyit gerekir. Kayıt yaptırmayı düşünüyorsan önce bölgenin DSU kurumuna yazılı sor.",
          kaynak: POLIMI_DSU,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: -1, ay: 9, metin: "Hemen; Türkiye'de bir programa kayıt kararından önce" },
          siniflar: ["mezun"],
          tur: "karar",
          bagli: null,
          zorunlu: false
        },
        {
          id: "it-prova-cents",
          baslik: "Prova CEnT-S (11. sınıf)",
          detay: "Resmi başvuru değil; sınav deneyimi ve seviye ölçümü. Kasım/Aralık oturumundaki CEnT-S, CISIA kuralına göre yalnızca bir sonraki akademik yılın kaydında geçerlidir; bu yüzden senin kayıt yılında kullanılmaz. Sonucu, son sınıftaki asıl CEnT-S'ye hazırlıkta hangi bölüme (Matematik, Reasoning, Fizik vb.) ağırlık vereceğini belirlemek için kullan. 2026/27 sezonunda ilk makro dönem oturumları 26 Kasım ve 17 Aralık 2026 (Padova sayfası); 2025/26 ücreti 55 €'du.",
          kaynak: PADOVA,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: -2, ay: 11, metin: "Kasım–Aralık (2026'da 26 Kasım ve 17 Aralık)" },
          siniflar: ["11"],
          tur: "sinav",
          bagli: { sinav: "cent-s" },
          zorunlu: false
        },
        {
          id: "it-polimi-erken",
          baslik: "PoliMi'ye 11. sınıf erken giriş penceresini sor (isteğe bağlı)",
          detay: "PoliMi 2026-27 çağrısında son sınıftan bir önceki yılda ≥75/100 ile erken kayıt yalnızca İtalyanca programlar içindi; İngilizce programlara \"specific rankings\" ile girilir. Senin yılın için kuralı bir sonraki çağrı belirleyecek (henüz yayımlanmadı). Prova CEnT-S'ye gireceksen PoliMi'ye bu sonucun İngilizce programlarda bir işe yarayıp yaramayacağını yazılı sor.",
          kaynak: POLIMI_11,
          kesinlik: "Yayımlanmadı",
          zaman: { mezuniyetGore: -2, ay: 11, metin: "11. sınıfın Ekim–Kasım ayı, CEnT-S kaydından önce" },
          siniflar: ["11"],
          tur: "basvuru",
          bagli: { sablon: "it-polimi-erken-giris" },
          zorunlu: false
        },
        {
          id: "it-hedef-universite",
          baslik: "Hedef üniversiteleri ve her birinin test yolunu kesinleştir",
          detay: "Her üniversite kendi testini ve takvimini belirler. Örnekler: PoliTo → TIL-I (yalnızca son sınıfta ya da mezunken; Torino ya da Mondovì'de yüz yüze) ya da SAT. PoliMi → CEnT-S ya da SAT (TOL İtalyancadır). Padova → yalnızca CEnT-S. Sapienza ACSAI → CEnT-S ya da SAT. Milano AI → SAT. Test yolunu seçerken birden fazla üniversiteyi kapsayan testi (CEnT-S ya da SAT) öncele.",
          kaynak: POLIMI,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: -1, ay: 9, metin: "Son sınıfın başında (Eylül)" },
          siniflar: null,
          tur: "karar",
          bagli: { sayfa: "universiteler.html#it" },
          zorunlu: true
        },
        {
          id: "it-tili-teyit",
          baslik: "PoliTo TIL-I uygunluğunu ve AB dışı oturum takvimini sor",
          detay: "TIL-I'ye kayıt olurken son sınıfta ya da mezun olmak gerekir. AB dışı (vize gerektiren) adayların oturumları erken biter (2026/27 döngüsünde son oturum 22 Mayıs 2026). PoliTo hedefindeysen çağrı yayımlanmadan önce takvimi sor.",
          kaynak: POLITO,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: -1, ay: 10, metin: "Son sınıfın Ekim–Kasım ayı" },
          siniflar: null,
          tur: "basvuru",
          bagli: { sablon: "it-polito-tili-takvim" },
          zorunlu: false
        },
        {
          id: "it-dil-sinavi",
          baslik: "İngilizce B2 belgesi: IELTS Academic ya da TOEFL iBT",
          detay: "İngilizce programlar en az CEFR B2 ister. Belge çoğu üniversitede başvuruda ya da kayıttan önce istenir; kabul edilen sınav listesini hedef üniversitenin çağrısında kontrol et.",
          kaynak: POLITO,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: -1, ay: 10, metin: "Son sınıfın Ekim–Aralık döneminde (üniversite başvurusundan önce)" },
          siniflar: null,
          tur: "sinav",
          bagli: { sinav: "ielts-academic" },
          zorunlu: true
        },
        {
          id: "it-sat",
          baslik: "SAT (isteğe bağlı alternatif test)",
          detay: "PoliMi (her bölümden ≥620), PoliTo (her bölümden ≥650; garantili kabul yok), Sapienza ACSAI ve Milano AI SAT kabul eder. CEnT-S'den farklı olarak bir sezonla sınırlı değildir; ama üniversitenin kabul ettiği tarih aralığını kontrol et (ör. Sapienza 2026/27'de 1 Ocak 2024'ten sonra alınan SAT'ı kabul etti).",
          kaynak: SAPIENZA,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: -1, ay: 10, metin: "Son sınıfın Ekim–Aralık oturumları (ya da daha önce)" },
          siniflar: null,
          tur: "sinav",
          bagli: { sinav: "sat" },
          zorunlu: false
        },
        {
          id: "it-cents-asil",
          baslik: "Asıl CEnT-S: kayıt yılın için geçerli sezonda gir",
          detay: "Kayıt yılın için geçerli CEnT-S sezonu, mezuniyetinden önceki yılın Kasım ayında başlar ve mezuniyet yılının Ekim ayında biter. Her makro dönemde bir kez girilebilir. Padova gibi üniversiteler testin belirli bir makro dönemin sonuna kadar alınmasını ister ve AB dışı başvuru penceresi erkendir (2027/28 için 7 Ocak–7 Mart 2027). Bu yüzden ilk makro dönemde (Kasım–Ocak) gir; gerekirse sonraki dönemde tekrarla. Hangi oturumların geçerli olduğunu hedef üniversiteye Yazışmalarım sayfasındaki \"CEnT-S geçerlilik dönemi ve AB dışı kontenjan\" şablonuyla yazılı sor.",
          kaynak: CISIA_GEC,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: -1, ay: 11, metin: "Son sınıfın Kasım–Ocak döneminde (ilk makro dönem)" },
          siniflar: null,
          tur: "sinav",
          bagli: { sinav: "cent-s" },
          zorunlu: false
        },
        {
          id: "it-basvuru",
          baslik: "Üniversite başvuruları (AB dışı aday pencereleri)",
          detay: "AB dışı aday pencereleri erken açılır ve kapanır. 2026/27–2027/28 çağrılarından örnekler: Padova Information Engineering 7 Ocak–7 Mart (2027/28); Sapienza ACSAI ön seçimi 15 Mayıs'ta kapandı (2026/27); PoliMi'de çağrı Kasım'da yayımlanır, TOL pencereleri Şubat–Mayıs (2026/27). 2027/28 için şimdiye kadar yalnızca Padova penceresi yayımlandı; diğer 2027/28 çağrıları (PoliMi Kasım 2026, PoliTo Aralık 2026, Sapienza Aralık 2026, Tor Vergata ve UCBM Ocak 2027 civarı) ve 2028/29 çağrıları henüz yayımlanmadı; tarihler önceki yılın takvimine göre verilmiştir. Son sınıftaysan başvuru ve Universitaly ön başvurusu \"con riserva\" (diploma ve YKS sonucu sonradan) kabul edilir.",
          kaynak: PADOVA,
          kesinlik: "Yayımlanmadı",
          zaman: { mezuniyetGore: 0, ay: 1, metin: "Ocak–Mayıs (2026/27 ve 2027/28 çağrılarına göre; çoğu çağrı henüz yayımlanmadı)" },
          siniflar: null,
          tur: "basvuru",
          bagli: { sayfa: "universiteler.html#it" },
          zorunlu: true
        },
        {
          id: "it-tili",
          baslik: "PoliTo TIL-I (PoliTo hedefindeysen)",
          detay: "2026/27 döngüsünde AB dışı adaylar için kayıtlar 27 Ocak'ta açıldı; oturumlar 19 Şubat, 14 ya da 26 Mart, 17 Nisan ve 22 Mayıs 2026'daydı; sıralama 28 Mayıs, garantili kabulde yer ayırtma 4 Haziran'a kadardı. Torino ya da Mondovì'de yüz yüze; ücret 50 €; toplamda en fazla 3 kez. Mezuniyet yılının çağrısı henüz yayımlanmadı (2026/27 takvimine göre).",
          kaynak: POLITO,
          kesinlik: "Yayımlanmadı",
          zaman: { mezuniyetGore: 0, ay: 2, metin: "Şubat–Mayıs (2026/27 takvimine göre; mezuniyet yılının takvimi yayımlanmadı)" },
          siniflar: null,
          tur: "sinav",
          bagli: { sinav: "til-i" },
          zorunlu: false
        },
        {
          id: "it-isee-belgeleri",
          baslik: "DSU bursu için Türkiye'den gelir ve mal varlığı belgeleri (ISEE parificato)",
          detay: "Yurtdışında geliri olan aile ISEE yerine ISEEU parificato alır. Gerekenler: hane halkının ikinci önceki yıla ait gelirleri, 31 Aralık itibarıyla taşınmazlar (m² ile) ve taşınır varlıklar. Belgeler Türkiye'deki yetkili kurumlarca verilir, İtalyan temsilciliğinde legalize edilir ve resmi İtalyanca çeviriyle sunulur. Toplaması haftalar sürer; erken başla. Bölgenin hangi belgeyi istediğini sor.",
          kaynak: POLIMI_YURTDISI,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: 0, ay: 3, metin: "Son sınıfın Şubat–Nisan döneminde" },
          siniflar: null,
          tur: "belge",
          bagli: { sablon: "it-dsu-turkiye-belgeleri" },
          zorunlu: false
        },
        {
          id: "it-on-kabul",
          baslik: "Üniversite ön kabulü / sıralama sonucu",
          detay: "Testine ve başvurusuna göre üniversite kabul ya da sıralama sonucunu açıklar (ör. PoliTo 2026/27'de 28 Mayıs; garantili kabulde yer ayırtma 4 Haziran'a kadar). Son sınıf öğrencisinin kabulü diploma ve YKS sonucu gelene kadar şartlıdır. Mezuniyet yılının tarihleri henüz yayımlanmadı (2026/27 takvimine göre).",
          kaynak: POLITO,
          kesinlik: "Yayımlanmadı",
          zaman: { mezuniyetGore: 0, ay: 5, metin: "Mart–Haziran (üniversiteye göre; 2026/27 takvimine göre)" },
          siniflar: null,
          tur: "basvuru",
          bagli: null,
          zorunlu: true
        },
        {
          id: "it-universitaly",
          baslik: "Universitaly ön başvurusu (vize için zorunlu)",
          detay: "Vize gerektiren aday, kabul aldığı programa Universitaly portalından ön başvuru yapar; yalnızca bir program seçilebilir. Üniversite ön başvuruyu dijital olarak onaylar; onaylanmayan aday vize başvurusu yapamaz. Son sınıftaki adayın ön başvurusu \"con riserva\" (şartlı) kabul edilir. Ön başvuru tarihlerini her üniversite kendisi belirler.",
          kaynak: MUR,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: 0, ay: 6, metin: "Kabulden hemen sonra (tarih üniversiteye göre)" },
          siniflar: null,
          tur: "basvuru",
          bagli: null,
          zorunlu: true
        },
        {
          id: "it-yks",
          baslik: "YKS'ye gir ve sonuç belgesini al",
          detay: "İtalya için YKS'yi geçtiğini gösteren sonuç belgesi gerekir; yerleşme şartı yoktur. 2026'da YKS 20–21 Haziran'da yapıldı, sonuçlar 21 Temmuz'da açıklandı " + TAKVIM_NOTU_OSYM + ". Başvurusu Şubat–Mart'tadır (2026'da 6 Şubat–2 Mart). Sonuç belgesini apostil ve İtalyanca çeviriyle hazırla.",
          kaynak: OSYM_SONUC,
          kesinlik: "Yayımlanmadı",
          zaman: { mezuniyetGore: 0, ay: 6, metin: "Haziran sınav, Temmuz sonuç " + TAKVIM_NOTU_OSYM },
          siniflar: null,
          tur: "sinav",
          bagli: null,
          zorunlu: true
        },
        {
          id: "it-dov-cimea",
          baslik: "Diploma değerlendirmesi: Dichiarazione di valore (DoV) ya da CIMEA",
          detay: "Üniversite hangisini istediğine karar verir. DoV İstanbul Başkonsolosluğu'ndan alınır: kabulün şartlıysa (con riserva) Prenot@Mi randevusuyla konsolosluğa başvurulur, DoV Universitaly'ye yüklenir; kabul kesinse DoV belgeleri vize başvurusuyla birlikte verilebilir. Tüm belgeler aslı ve apostilli olmalı (+ bir fotokopi). Diploma Haziran'da çıktığı için bu adım mezuniyetten hemen sonradır. CIMEA isteniyorsa süre ve ücreti CIMEA'dan kontrol et.",
          kaynak: KONS_IST,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: 0, ay: 7, metin: "Diploma ve YKS sonucu çıkınca (Temmuz)" },
          siniflar: null,
          tur: "belge",
          bagli: { sablon: "it-konsolosluk-dov" },
          zorunlu: true
        },
        {
          id: "it-konaklama",
          baslik: "Konaklama ve \"fuori sede\" kira sözleşmesi",
          detay: "Yüksek DSU bursu (fuori sede) için okuduğun şehirde kayıtlı, adına düzenlenmiş bir kira sözleşmesi gerekir: PoliMi'de 1 Ekim–31 Temmuz'u kapsamalı; Lazio DiSCo'da en az 10 aylık olmalı. Üniversitenin ve DSU kurumunun yurt (residenza) çağrılarını da izle.",
          kaynak: DISCO,
          kesinlik: "Doğrulandı",
          zaman: { mezuniyetGore: 0, ay: 7, metin: "Temmuz–Eylül" },
          siniflar: null,
          tur: "hazirlik",
          bagli: null,
          zorunlu: false
        },
        {
          id: "it-dsu-basvuru",
          baslik: "DSU burs başvurusu",
          detay: "Burs bölgeye göre verilir ve her yıl yeniden başvurulur. PoliMi 2026/27 çağrısında birinci sınıf için son gün 5 Ağustos 2026 idi; ISEE/ISEEU parificato üst sınırı 26.887,93 €. Piemonte (EDISU, PoliTo) ve Lazio (DiSCo, Sapienza) kendi takvimlerini uygular. Mezuniyet yılının çağrıları henüz yayımlanmadı (2026/27 takvimine göre). Not: PoliMi 2026/27 ek çağrısı (Madde 2), yurtdışında beyan edilen gelirin öğrenci vizesi için istenen asgari geçim tutarından düşük olamayacağını şimdiden uyguluyor; ana çağrı bu kontrolün 2027/28'den itibaren belgelerin geçerliliği için de yapılacağını duyurdu.",
          kaynak: POLIMI_DSU,
          kesinlik: "Yayımlanmadı",
          zaman: { mezuniyetGore: 0, ay: 8, metin: "Temmuz–Ağustos (PoliMi 2026/27: 5 Ağustos; bölgeye göre değişir)" },
          siniflar: null,
          tur: "basvuru",
          bagli: { sablon: "it-dsu-turkiye-belgeleri" },
          zorunlu: false
        },
        {
          id: "it-vize",
          baslik: "Öğrenim vizesi (studio/immatricolazione universitaria)",
          detay: "Universitaly ön başvurun onaylandıktan sonra İstanbul'da iDATA üzerinden vize başvurusu yapılır. Genel son tarih 2026/27 için 30 Kasım 2026, 2027/28 için 31 Ekim 2027 idi; üniversiteler daha erken tarih koyabilir. Mevcut genelge yalnızca 2027/28 kayıt yılına kadar geçerli; 2028/29 ve sonrası için son tarih yeni MUR genelgesiyle belirlenecek; genelge henüz yayımlanmadı (beklenen: 2028 ilkbaharı). Vize için güncel genelgeye göre yıllık 10.179,85 € geçim kanıtı ve uygun konaklama kanıtı gerekir; DSU bursuna başvurmuş olmak, burs açıkça verilmedikçe geçim kanıtı sayılmaz (MUR genelgesi Bölüm II, 2). Ders başlangıcına yetişmek için Ağustos'ta başvur.",
          kaynak: KONS_IST,
          kesinlik: "Yayımlanmadı",
          // K5-c: MUR genelgesi 2026/27 ve 2027/28 kayıt yıllarını kapsıyor (vize son tarihleri 30 Kasım 2026 ve 31 Ekim 2027)
          kesinlikYila: { "2026": "Doğrulandı", "2027": "Doğrulandı" },
          zaman: { mezuniyetGore: 0, ay: 8, metin: "Ağustos (genel son tarih 2027/28 için 31 Ekim 2027; 2028/29 ve sonrası için genelge yayımlanmadı)" },
          siniflar: null,
          tur: "basvuru",
          bagli: null,
          zorunlu: true
        }
      ],

      belgeler: [
        { id: "it-b-diploma", ad: "Lise diploması (aslı, apostilli) + İtalyanca çeviri", detay: "12 yıllık eğitimi gösterir. Konsolosluk tüm belgelerin aslını ve apostilini ister.", kaynak: KONS_IST, zorunlu: true },
        { id: "it-b-yks", ad: "YKS sonuç belgesi (apostilli) + İtalyanca çeviri", detay: "Akademik yeterlilik sınavını geçtiğini gösterir; yerleşme belgesi gerekmez.", kaynak: POLITO, zorunlu: true },
        { id: "it-b-dov", ad: "Dichiarazione di valore ya da CIMEA belgesi (üniversiteye göre)", detay: "PoliTo DoV ya da CIMEA/ARDI belgesini kabul eder; hangisinin isteneceğine üniversite karar verir.", kaynak: MUR, zorunlu: true },
        { id: "it-b-test", ad: "Giriş testi sonucu (CEnT-S, TIL-I, TOL ya da SAT)", detay: "Kayıt yılı için geçerli sezonda alınmış olmalı.", kaynak: CISIA_GEC, zorunlu: true },
        { id: "it-b-ingilizce", ad: "İngilizce B2 belgesi", detay: "IELTS Academic ya da TOEFL iBT; kabul edilen liste üniversiteye göre.", kaynak: POLITO, zorunlu: true },
        { id: "it-b-universitaly", ad: "Onaylanmış Universitaly ön başvuru özeti", detay: "Vize başvurusunun ön şartıdır.", kaynak: MUR, zorunlu: true },
        { id: "it-b-pasaport", ad: "Pasaport", detay: "Vize ve kayıt için.", kaynak: POLITO, zorunlu: true },
        { id: "it-b-codice-fiscale", ad: "Codice fiscale (vergi numarası)", detay: "Agenzia delle Entrate ya da İtalyan temsilciliği verir; kayıtta istenir.", kaynak: POLITO, zorunlu: true },
        { id: "it-b-isee", ad: "ISEEU parificato için gelir ve mal varlığı belgeleri (legalize + İtalyanca çeviri)", detay: "Yalnızca DSU bursuna ya da gelire göre harç indirimine başvuracaksan.", kaynak: POLIMI_YURTDISI, zorunlu: false },
        { id: "it-b-kira", ad: "Kayıtlı kira sözleşmesi (fuori sede için)", detay: "Süre şartı bölgeye göre (ör. DiSCo en az 10 ay).", kaynak: DISCO, zorunlu: false }
      ],

      sinavlar: {
        zorunlu: ["ielts-academic|toefl-ibt", "cent-s|til-i|sat|polimi-tol"],
        secmeli: [
          "ap-calculus-ab", "ap-calculus-bc", "ap-physics-1", "ap-physics-c-mechanics", "ap-physics-c-em",
          "ap-chemistry", "ap-biology", "ap-english-language", "ap-computer-science-a",
          "ap-microeconomics", "ap-macroeconomics"
        ],
        notlar: {
          "ielts-academic|toefl-ibt": "Biri yeterli; en az CEFR B2.",
          "cent-s|til-i|sat|polimi-tol": "Hedef üniversitenin istediği test: Padova yalnızca CEnT-S; PoliTo TIL-I ya da SAT; PoliMi CEnT-S, SAT ya da TOL (İtalyanca); Sapienza CEnT-S ya da SAT.",
          "cent-s": "11. sınıftaki Kasım/Aralık oturumu yalnızca prova; asıl sınav son sınıfta (CISIA geçerlilik kuralı).",
          "til-i": "Yalnızca son sınıfta ya da mezunken; PoliTo.",
          "polimi-tol": "İtalyanca yapılır; İngilizce programlar için CEnT-S ya da SAT daha uygun.",
          "ap-calculus-ab": "AP bu rotada kabul şartı değildir ve resmi avantaj sağlamaz; matematik ve fizik testlerine hazırlıkta işe yarar."
        }
      },

      uyarilar: [
        { metin: "AP, Türk diploması sahibi için İtalya'da kabul şartı değildir ve resmi ek puan ya da kredi muafiyeti sağlamaz. PoliTo AP şartını yalnızca ABD diploması sahiplerinden ister.", kaynak: POLITO },
        { metin: "MUR genelgesi 2026/27 ve 2027/28 için geçerlidir. Daha sonraki kayıt yılları için yeni genelge yayımlanacak; vize son tarihi o zaman kesinleşir.", kaynak: MUR },
        { metin: "PoliMi'de ≥75/100 ile erken kayıt (2026-27 çağrısı) yalnızca İtalyanca programlar içindir; İngilizce programlarda bunu garantili kabul olarak sayma.", kaynak: POLIMI },
        { metin: "11. sınıftaki CEnT-S sonucu senin kayıt yılında geçerli değildir; yalnızca prova olarak değerlendir.", kaynak: CISIA_GEC },
        { metin: "Universitaly ön başvurusunda yalnızca bir program seçilebilir; birden fazla kabul aldıysan hangisine gideceğine karar verip ön başvuruyu ona yap.", kaynak: MUR }
      ],

      acikKararlar: []
    }
  };

  // =====================================================================================
  // PROFİLE ÖZEL ORTAK UYARILAR (Tur 10, K4-a) — Panelim ve Rotam'da, koşulu tutan profile gösterilir.
  // kosul: "mezun-de-it" -> mezun ve hedef ülkelerinde hem Almanya hem İtalya var (rota.js profilUyarilari).
  // =====================================================================================
  window.APMEBERRA_ROTA_UYARILARI = [
    {
      id: "mezun-de-it-kayit",
      kosul: "mezun-de-it",
      baslik: "Türkiye'de bir lisans programına kayıt yaptırmadan önce düşün",
      metin: "Almanya için Türkiye'de bir lisans programına kayıt yaptırman gerekmez. Kayıt yaptırmak İtalya'da 1. sınıf DSU bursunu etkileyebilir (PoliMi DSU 2026/27 Md. 4.2; diğer bölgeler için teyit gerekir).",
      kesinlik: "Doğrulandı",
      kaynaklar: [
        { ad: "uni-assist · Türkiye", url: UA_TR },
        { ad: "PoliMi DSU 2026/27 · Md. 4.2", url: POLIMI_DSU }
      ]
    }
  ];
})();
