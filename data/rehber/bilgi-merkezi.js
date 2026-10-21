// Meberra — Bilgi Merkezi veri dosyası
// PM onaylı doğrulama: 7 Ekim 2026. Her madde resmi kaynağa dayanır.
// durum: "dogrulandi" = resmi kaynakla teyitli | "dikkat" = doğru ama önemli kısıt/değişiklik var | "dogrulanamadi" = resmi teyit yok
window.BILGI_MERKEZI = {
  guncelleme: "12 Ekim 2026 — Mevzuat düzeltmeleri (anabin, uni-assist, CISIA, PoliMi, PoliTo, MUR) · 7 Ekim 2026 — Resmi kaynaklarla doğrulama (College Board, DAAD, uni-assist, CISIA, PoliMi, PoliTo, TÜBİTAK, DSU kurumları)",
  bolumler: [
    {
      baslik: "Acil Takvim",
      ikon: "⏰",
      maddeler: [
        {
          baslik: "AP 2027 sınav kaydı: son gün 13 Kasım 2026",
          ozet: "İstanbul'daki sınav merkezine dış aday olarak kayıt hemen yapılmalı. ABD dışında sınav başına ücret 129 $. 14 Kasım 2026 – 12 Mart 2027 arasında verilen siparişlere sınav başına +40 $ geç ücret eklenir. İptal edilen ya da girilmeyen sınav için de 40 $ alınır.",
          durum: "dogrulandi",
          kaynak: { ad: "College Board — Exam Fees", url: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/ordering-fees/exam-fees" }
        },
        {
          baslik: "AP 2027 sınav tarihleri: 3–7 ve 10–14 Mayıs 2027",
          ozet: "Physics C: Mechanics 3 Mayıs; Physics 1 ve Physics C: E&M 5 Mayıs; Chemistry 6 Mayıs; Calculus AB/BC 10 Mayıs; English Language ve Computer Science A 12 Mayıs. Geç sınav haftası 17–21 Mayıs.",
          durum: "dogrulandi",
          kaynak: { ad: "College Board — Exam Dates", url: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates" }
        },
        {
          baslik: "TÜBİTAK 2204-A: başvuru 28 Eylül 2026 – 4 Ocak 2027",
          ozet: "2027 dönemi (58. yarışma) başvuruları TÜBİTAK Yönetim Bilgi Sistemi üzerinden yapılır. 2204-A bir yarışmadır; bütçe desteği vermez, ödüller dereceye göre verilir.",
          durum: "dogrulandi",
          kaynak: { ad: "TÜBİTAK — 2204 2027 çağrıları", url: "https://www.tubitak.gov.tr/en/announcement/2204-high-school-students-research-project-competition-and-2204-b-secondary-school-students-research-projects-competition-2027-calls-published" }
        },
        {
          baslik: "PoliMi ≥75/100 erken kayıt yalnızca İtalyanca programlar için",
          ozet: "Düzeltme (12 Ekim 2026): 2026-27 çağrısı Art. 3'e göre son sınıftan bir önceki yılda ≥75/100 ile erken kayıt yalnızca İtalyanca programlar içindir. İngilizce programlara \"specific rankings\" ile girilir; çağrı bu sıralamanın eşiğini vermez. 2026-27 çağrısındaki pencere 2025/26'da 11. sınıf olanlar içindi. 2026/27'de 11. sınıfta olan adayların penceresini 2027-28 çağrısı belirleyecek; çağrı henüz yayımlanmadı (beklenen Kasım 2026).",
          durum: "dikkat",
          kaynak: { ad: "PoliMi — Engineering BSc Call 2026-27", url: "https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf" }
        },
        {
          baslik: "26 Kasım ve 17 Aralık 2026 CEnT-S oturumları 2027/28 kaydı içindir",
          ozet: "Düzeltme (12 Ekim 2026): Bu tarihler 2027/28 kaydı için ilk makro dönem oturumlarıdır. CISIA'ya göre bir CEnT yalnızca bir sonraki akademik yılın kaydında geçerlidir (https://guide.cisiaonline.it/en/node/206). Bu yüzden Padova'ya 2028/29'da başvuracak aday (2026/27'de 11. sınıfta) için geçersizdir; PoliMi için durum 2027-28 çağrısına bağlı (henüz yayımlanmadı): 2026-27 çağrısı 11. sınıftaki adayın 1 Eylül 2025–31 Ağustos 2026 arasında aldığı CEnT-S'yi erken kayıt için kabul ediyordu (Art. 3.2), ama erken kayıt yalnızca İtalyanca programlar içindi. 2028/29 girişli adayın asıl CEnT-S dönemi Kasım 2027 – 2028. Ücret 55 €; her makro dönemde bir kez girilebilir. Bu bilgi İtalya rotası içindir: İtalya rotasında 11. sınıftaki Kasım/Aralık oturumuna prova olarak girilir (isteğe bağlı adım). Bu resmi başvuru değildir; sınav deneyimi ve seviye ölçümü içindir, sonucu kayıt yılında kullanılmaz.",
          durum: "dikkat",
          kaynak: { ad: "Padova — Information Engineering (apply)", url: "https://apply.unipd.it/courses/course/182" }
        }
      ]
    },
    {
      baslik: "Almanya",
      ikon: "DE",
      maddeler: [
        {
          baslik: "Türk diploması + 4 AP ile doğrudan kabul: resmi dayanağı yok (Doğrulandı)",
          ozet: "Düzeltme (12 Ekim 2026): anabin'de Türk Lise Diplomasi için AP içeren bir kural yoktur; AP kuralı (USA-BV07) yalnızca ABD High School Diploma ile birlikte uygulanır (https://anabin.kmk.org). Türk diploması için resmi yol (uni-assist Türkiye ülke sayfası, https://www.uni-assist.de/tools/laenderhinweise/laenderdetails/country/tr/): Lise Diploması ile birlikte YKS'de ilgili puan türünde 180'in üzerinde puan ve en az 4 yıllık örgün bir lisans programına yerleşme; bu, yalnızca yerleşilen alan ve komşu alanlar için doğrudan giriş verir. Yerleşme yoksa Studienkolleg yolu da yoktur (tek istisna: Meslek Yüksekokulunda 1 yıl → yalnızca FH Studienkolleg'i). uni-assist 'Yerleştirme Sonuçları' belgesini ister. Bu bilgi Almanya rotası içindir: Almanya rotasında YKS'de hedef alanda bir lisans programına yerleşmek zorunlu adımdır; İtalya rotası bu şartı taşımaz.",
          durum: "dikkat",
          kaynak: { ad: "uni-assist — Türkiye ülke bilgisi", url: "https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/tr/" }
        },
        {
          baslik: "ABD diploması için KMK AP kuralı (referans)",
          ozet: "Yalnızca ABD High School Diploma ile birlikte (anabin USA-BV07, https://anabin.kmk.org): MINT alanında alana bağlı giriş için Calculus AB/BC + 1 doğa bilimi (Biology, Chemistry ya da Physics C Mechanics ile E&M birlikte; Physics 1 sayılmaz) + 1 dil (English Lang/Lit, French, Spanish, Latin, German) + 1 ek ders (ör. tarih, CS A ya da Micro + Macro birlikte), her birinden en az 3. Türk diplomasına uygulanmaz. Güncel anabin kayıtlarında AP ile yalnızca alana bağlı giriş var (MINT: BV07, beşeri/sosyal: BV08); \"5 AP ile genel giriş\" kuralı görünmüyor — Yoruma açık: aşağıdaki DAAD kılavuzu (Ocak 2024) eski kuralı yansıtıyor olabilir.",
          durum: "dikkat",
          kaynak: { ad: "DAAD — Guide for HS & IB Graduates", url: "https://www.daad.org/files/2023/03/Guide-to-German-Universities-for-HS-and-IB-Graduates.2024.1-1.pdf" }
        },
        {
          baslik: "uni-assist: VPD üniversiteye göre; APS Türkiye'ye uygulanmaz; yeminli tercüme şart",
          ozet: "Düzeltme (12 Ekim 2026): uni-assist Türk adaydan Lise Diploması + YKS 'Yerleştirme Sonuçları' (+ varsa üniversite transkripti) ister ve yalnızca Türkiye'deki yeminli tercüman çevirisini kabul eder; noter onayı tek başına yetmez. VPD'yi yalnızca bazı üniversiteler ister; karar üniversitenindir (https://www.uni-assist.de/en/how-to-apply/plan-your-application/vpd/). APS Türkiye'ye hiç uygulanmaz (\"muafiyet\" değil); yalnızca Çin, Hindistan ve Vietnam'dan gelen adaylardan istenir (https://www2.daad.de/deutschland/studienangebote/international-programmes/en/detail/9595/). AP, giriş hakkı belgesi değildir.",
          durum: "dikkat",
          kaynak: { ad: "uni-assist — Türkiye ülke bilgisi", url: "https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/tr/" }
        },
        {
          baslik: "Sperrkonto (bloke hesap): aylık 992 € / yıllık 11.904 €",
          ozet: "Şu an geçerli tutar budur (Auswärtiges Amt, 18.08.2025). 2028 ve sonrasında vize alacak adaylar için tutar artmış olabilir; bütçeyi tampon payıyla planlayın.",
          durum: "dogrulandi",
          kaynak: { ad: "Auswärtiges Amt", url: "https://tiflis.diplo.de/ge-de/service/visum/2722272-2722272" }
        },
        {
          baslik: "TUM harcı: Kış 2027/28'den itibaren 2.300 € / 3.400 € (dönem başına)",
          ozet: "AB dışı öğrencilerden alınır. Kış 2028/29'da başlayacak adaylar yeni tutara tabidir.",
          durum: "dikkat",
          kaynak: { ad: "TUM — Tuition fees", url: "https://www.tum.de/en/studies/fees/tuition" }
        },
        {
          baslik: "KIT ve Freiburg harçsız değil: 1.500 € / dönem",
          ozet: "Baden-Württemberg eyaleti AB dışı öğrencilerden dönem başına 1.500 € harç alır. KIT Carl Benz School'un kendi şartları da var: SAT, ACT ya da TestAS ve İngilizce B2.",
          durum: "dikkat",
          kaynak: { ad: "KIT Carl Benz School", url: "https://carlbenzschool.kit.edu/admission-requirements.php" }
        },
        {
          baslik: "Deutschlandstipendium: aylık 300 €",
          ozet: "En az 2 dönem verilir; birinci dönem ve uluslararası öğrenciler başvurabilir. DAAD'ın lisans eğitiminin tamamını kapsayan genel bir bursu yoktur. FES bursu Almanca (DSH-2) şartı arar.",
          durum: "dogrulandi",
          kaynak: { ad: "DAAD — Scholarship Database (Deutschlandstipendium)", url: "https://www.daad.de/en/" }
        },
        {
          baslik: "Eski \"İlk 20\" listesinin çoğu hatalıydı: doğrulanmış liste 15 program",
          ozet: "Resmi sayfalarla yapılan kontrolde eski listedeki programların çoğunun Almanca, kapanmış ya da yalnızca yüksek lisans düzeyinde İngilizce olduğu görüldü. Örnek: UDE Computer Engineering ISE son öğrencisini 2023/24'te aldı. Güncel liste Almanya sayfasında.",
          durum: "dikkat",
          kaynak: { ad: "UDE — Computer Engineering ISE", url: "https://www.uni-due.de/studienangebote/studiengang.php?id=26" }
        },
        {
          baslik: "\"Tamamen İngilizce\" programların bir kısmı Almanca A2 istiyor",
          ozet: "DIT Artificial Intelligence mezuniyete kadar Almanca A2 ister; TH Rosenheim A2, TUM Information Engineering ise Almanca sertifika ister. Bu programları hedefleyen adayın planına Almanca A2–B1 hedefi eklenmeli. Bavyera'da AB dışı öğrenciler dönem başına hizmet ücreti öder.",
          durum: "dikkat",
          kaynak: { ad: "DIT — Artificial Intelligence B.Sc.", url: "https://www.th-deg.de/ain-b-en" }
        }
      ]
    },
    {
      baslik: "İtalya",
      ikon: "IT",
      maddeler: [
        {
          baslik: "İtalya'da AP kabul şartı değil, resmi avantaj da getirmiyor; YKS sonuç belgesi gerekli",
          ozet: "Düzeltme (12 Ekim 2026): MUR genelgesine (2026-27/2027-28) göre gerekenler: 12 yıllık diploma, YKS sonuç belgesi (geçmiş olmak; yerleşme şartı yok), CIMEA belgesi ya da Dichiarazione di valore (üniversite belirler) ve üniversitenin giriş testi (TIL-I, TOL, CEnT-S ya da SAT). PoliMi sıralaması yalnızca test puanına dayanır (2026-27 çağrısı Art. 6.2); PoliTo AP'yi yalnızca ABD diploması sahiplerinden ister (Ek B/C). \"AP ek sıralama puanı / kredi muafiyeti\" iddiası kaldırıldı. 2028/29 girişi için yeni MUR genelgesi gerekecek.",
          durum: "dikkat",
          kaynak: { ad: "MUR genelgesi 2026-27 / 2027-28 (UniFE kopyası)", url: "https://www.unife.it/it/internazionale/venire/iscriversi/informazioni/circolare_2026-2027_studenti_internazionali.pdf" }
        },
        {
          baslik: "English TOLC-I yerine CEnT-S geldi",
          ozet: "CEnT-S 4 Kasım 2025'te başladı. 65 soru, 140 dk: Matematik 15, Metin ve Veri Muhakemesi 15, Biyoloji 10, Kimya 10, Fizik 5, Reading 10. Doğru +1, yanlış −0,25. Ücreti 55 €. Her makro dönemde bir kez girilebilir. PoliMi puan dönüşümünde Biyoloji ve Kimya bölümlerini saymaz.",
          durum: "dogrulandi",
          kaynak: { ad: "CISIA — CEnT-S structure", url: "https://www.cisiaonline.it/en/cent/cent-s/structure-and-syllabus" }
        },
        {
          baslik: "PoliTo: TIL-I 60/100 = garantili kabul",
          ozet: "Sıralamaya girme eşiği 30/100. Vize gerektiren AB dışı adaylar için son TIL oturumu 22 Mayıs, Universitaly ön kaydı 30 Haziran. SAT alternatifinde her bölümden 650 gerekir ve SAT ile garantili kabul yoktur. İngilizce B2 şart. Ülkede ulusal giriş sınavı varsa (YKS) onun belgesi istenebilir.",
          durum: "dogrulandi",
          kaynak: { ad: "PoliTo — Call for applications 2026-27", url: "https://www.polito.it/sites/default/files/2025-12/Call%20for%20applications%20for%20admissions%20Engineering%20_%20LP%202026-27.pdf" }
        },
        {
          baslik: "PoliMi: SAT her bölümden en az 620; İtalyanca OFA var",
          ozet: "SAT'ta ayrı bir toplam puan şartı yoktur. OFA English yalnızca İtalyanca programlar için geçerlidir. İngilizce programlarda İtalyanca bilmeyen öğrenciye İtalyanca OFA verilir; mezuniyetten önce İtalyanca B2 belgesi ya da PoliMi'nin kursu gerekir.",
          durum: "dikkat",
          kaynak: { ad: "PoliMi — Engineering BSc Call 2026-27", url: "https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf" }
        },
        {
          baslik: "DSU bursu: tavan bölgeye göre değişir",
          ozet: "Lombardiya: ISEE 26.887,93 € / ISPE 58.452,06 €, fuori sede ortalama ~7.172 €. Piemonte (EDISU): ISEE 26.306,25 €, fuori sede bursu ~8.097 €'ya kadar (STEM okuyan kız öğrencilere 8.455 €'ya kadar). Lazio (DiSCo) 2026/27: ISEE/ISEEUP en fazla 28.339,88 €, ISPE/ISPEUP en fazla 61.608,48 €; fuori sede bursu 6.571,11 €.",
          durum: "dikkat",
          kaynak: { ad: "EDISU Piemonte — Step by step 2026/27", url: "https://www.edisu.piemonte.it/" }
        },
        {
          baslik: "Sapienza ACSAI: İngilizce, 180 kişilik sınırlı kontenjan",
          ozet: "Kabul edilen testler: English TOLC-I, CEnT-S, TOLC-I/S ve SAT. İngilizce B2 gerekir. AB içi ve AB dışı adaylar ayrı sıralanır.",
          durum: "dogrulandi",
          kaynak: { ad: "Sapienza — Restricted access programmes", url: "https://www.uniroma1.it/en/pagina/restricted-access-degree-programmes-tolc-i-and-selections" }
        },
        {
          baslik: "Padova Information Engineering: yalnızca CEnT-S",
          ozet: "Şart: CEnT-S normalize puanı ≥38 ve Matematikte ≥7 doğru. AB dışı adaylara 100 kontenjan. 2027/28 için AB dışı başvuru penceresi 7 Ocak – 7 Mart 2027 (2026/27'de 11. sınıfta olanların giriş yılı 2028/29; takvim benzer olacaktır). Harç yılda 2.950 €, ayrıca 208 € depozito.",
          durum: "dogrulandi",
          kaynak: { ad: "Padova — Information Engineering", url: "https://apply.unipd.it/courses/course/182" }
        },
        {
          baslik: "Pisa, Floransa, Roma Tre, Bari, Trieste, UNIMORE: İngilizce mühendislik lisansı yok",
          ozet: "Bu üniversitelerde İngilizce mühendislik eğitimi yalnızca yüksek lisans düzeyinde var. Örneğin Pisa'nın tek İngilizce lisansı bir beşeri bilimler programı. Pavia'nın ECE programı İtalyanca. Doğrulanmış 10 program İtalya sayfasında.",
          durum: "dikkat",
          kaynak: { ad: "Pisa — Degree programmes in English", url: "https://www.unipi.it/en/international-students/programmes-taught-in-english/degree-programmes-held-in-english/" }
        },
        {
          baslik: "Tor Vergata Engineering Sciences: kendi sınavı + mülakat",
          ozet: "Vize gerektiren adaylar için \"Procedure C\": dosya, çevrimiçi yazılı sınav (ön-kalkülüs) ve mülakat. TOLC-I istenmiyor. Pencereler Ocak ve Mart–Nisan.",
          durum: "dogrulandi",
          kaynak: { ad: "Tor Vergata — Call for applications", url: "https://engineering-sciences.uniroma2.it/call-for-applications/" }
        }
      ]
    },
    {
      baslik: "AP Sınavları",
      ikon: "📝",
      maddeler: [
        {
          baslik: "Hibrit ve tam dijital dersler",
          ozet: "Hibrit (MCQ Bluebook'ta, FRQ kâğıda el yazısıyla): Calculus AB/BC, Chemistry, Biology, Physics 1/2/C, Precalculus, Macro ve Microeconomics. Tam dijital: English Language, Computer Science A ve 2027'den itibaren Statistics.",
          durum: "dogrulandi",
          kaynak: { ad: "College Board — Exam modes", url: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/digital-ap-exams/exam-modes" }
        },
        {
          baslik: "AP Physics 1 müfredatı değişti",
          ozet: "8 ünite: 1 Kinematics, 2 Force & Translational Dynamics (dairesel hareket ve kütleçekim burada), 3 Work, Energy & Power, 4 Linear Momentum, 5 Torque & Rotational Dynamics, 6 Energy & Momentum of Rotating Systems, 7 Oscillations, 8 Fluids. Sınav 42 MCQ (85 dk) + 4 FRQ (95 dk). FRQ türleri MR, TBR, LAB ve QQT; Paragraph-Length Response kaldırıldı.",
          durum: "dogrulandi",
          kaynak: { ad: "College Board — AP Physics 1", url: "https://apcentral.collegeboard.org/courses/ap-physics-1/exam" }
        },
        {
          baslik: "AP International Diploma lise diplomasının yerine geçmez",
          ozet: "Koşul: 5 AP'den 3+. Bunlar iki farklı dilde dil sınavı (English Lang + Lit birlikte sayılmaz), bir küresel perspektif dersi, bir matematik/fen/CS dersi ve bir ek dersi kapsamalıdır. Bu yüzden aday için İngilizce dışında bir dil AP'si de gerekir.",
          durum: "dikkat",
          kaynak: { ad: "College Board — AP International Diploma", url: "https://apstudents.collegeboard.org/awards-recognitions/ap-international-diploma" }
        },
        {
          baslik: "2027 AP Biology: grafik hesap makinesi YASAK",
          ozet: "2027 sınavlarında Biology'de yalnızca dört işlemli (karekök tuşlu) ya da bilimsel hesap makinesi kullanılabilir. Bu bir değişiklik; önceki yıllarda grafik hesap makinesine izin veriliyordu. Calculus'un hesap makineli bölümlerinde grafik hesap makinesi zorunlu. Physics 1 ve Chemistry'de her tür hesap makinesi serbest; Bluebook'taki Desmos da kullanılabilir.",
          durum: "dikkat",
          kaynak: { ad: "College Board — Calculator Policies", url: "https://apstudents.collegeboard.org/exam-policies-guidelines/calculator-policies" }
        },
        {
          baslik: "Okul bulunamazsa: Türkiye için yetkili test merkezi Prometric",
          ozet: "Okulu AP sunmayan öğrenci önce AP okullarının koordinatörlerine başvurur. Hiçbir okul dış aday kabul etmezse College Board'un Türkiye için listelediği yetkili test merkezi Prometric'tir. Kayıt koşulları ve ücretler Prometric'in sayfasından teyit edilmelidir.",
          durum: "dikkat",
          kaynak: { ad: "AP Students — Testing outside the US", url: "https://apstudents.collegeboard.org/help-center/can-i-sign-ap-exam-if-i-dont-live-united-states" }
        },
        {
          baslik: "Sınav saatleri (Türkiye, UTC+3): Session 1 10:00, Session 2 14:00",
          ozet: "2027'den itibaren saatler saat dilimine göre belirleniyor. Biology 3 Mayıs Session 2; Physics 1 5 Mayıs Session 2; Chemistry 6 Mayıs Session 2; Calculus AB/BC 10 Mayıs Session 1; English Language 12 Mayıs Session 1. Kesin saat sınav merkezinden teyit edilmeli.",
          durum: "dogrulandi",
          kaynak: { ad: "College Board — 2027 Exam Start Times", url: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates/start-times" }
        }
      ]
    },
    {
      baslik: "Burs ve Hibeler",
      ikon: "💶",
      maddeler: [
        {
          baslik: "Erasmus+ KA152'ye bireysel başvuru yapılamaz",
          ozet: "Başvuruyu bir kuruluş ya da gayriresmî bir gençlik grubu yapar (temsilci en az 18 yaşında). Öğrenci katılımcı olabilir (13–30 yaş). Sonraki son tarih 12 Şubat 2027.",
          durum: "dikkat",
          kaynak: { ad: "Erasmus+ Programme Guide — Youth exchanges", url: "https://erasmus-plus.ec.europa.eu/programme-guide/part-b/key-action-1/youth-exchanges" }
        },
        {
          baslik: "TÜBİTAK 2204-A'da öncelikli alan yok",
          ozet: "12 ana alan ve yaklaşık 70 tema var. Yapay Zekâ, Makine Öğrenmesi ve Malzeme Bilimi temalar arasında ama öncelikli değiller. Uluslararası yarışmaya (EUCYS, ISEF) gidecek projeler, ilk üçe girenler arasından ayrı bir jüri tarafından seçilir.",
          durum: "dogrulandi",
          kaynak: { ad: "TÜBİTAK — Lise Proje Rehberi 2027", url: "https://www.tubitak.gov.tr/sites/default/files/2026-09/lise_proje_rehberi_2027_onaya_sunulan.pdf" }
        }
      ]
    }
  ]
};
