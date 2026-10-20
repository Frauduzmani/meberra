# Mevzuat Takip Listesi
*Spec §10: "Yayımlanmadı" etiketli maddeler. Ajan 13 her turda kontrol eder. Her ülke kendi bölümünü yazar; var olan bölümler silinmez.*

## İtalya
*Ajan 13 (Elena Rossi ile), Tur 8. Son kontrol: 12 Ekim 2026. Ayrıntı ve kaynaklar: `.agents/mevzuat/dogrulama/bulgular-it.json`.*

| # | Ne bekleniyor | Beklenen tarih | Kontrol edilecek URL | Etkilediği dosya > id |
| :-- | :-- | :-- | :-- | :-- |
| IT-1 | CISIA CEnT-S 2026/27 kuralları (yapı 55→65 soru yürürlüğü, ücret) | 31 Ekim 2026'ya kadar | https://www.cisiaonline.it/en/cent/all-about-CEnT/CEnT-rules | sinavlar.js > cent-s; sinav-cents.html > #cents |
| IT-2 | CISIA CEnT-S 2026/27 oturum takvimi (ilk makro dönem; Padova'ya göre 26 Kasım ve 17 Aralık 2026) | Ekim–Kasım 2026 | https://testcisia.it/calendario.php?tolc=cents&lingua=inglese&date=tutte | sinavlar.js > cent-s; sinav-cents.html; ulke-rotalari.js > it-prova-cents |
| IT-3 | PoliMi mühendislik lisans çağrısı 2027/28 (+ 2028/29 erken kayıt; Meberra'nın 11. sınıf EARLY TEST pencereleri, İngilizce programların specific rankings kuralı, 65 soruluk CEnT-S dönüşümü) | Kasım 2026 ortası–sonu (önceki: 19 Kasım 2025) | https://www.polimi.it/en/prospective-students/how-to-apply/admission-to-laurea-programmes/engineering | ulkeler.js > it, it-polimi; ulke-rotalari.js > it-polimi-erken; sinavlar.js > polimi-tol; bilgi-merkezi.js; sinav-cents.html > #cents-polimi; eposta: it-polimi-erken-giris |
| IT-4 | PoliTo mühendislik çağrısı 2027/28 (sonra 2028/29: Meberra'nın TIL-I takvimi) | Aralık 2026; 2028/29 için Aralık 2027 | https://www.polito.it/didattica/iscriversi-studiare-laurearsi/iscrizione/corsi-di-laurea/bandi-regolamenti-e-graduatorie | ulkeler.js > it-polito; ulke-rotalari.js > it-tili, it-on-kabul; sinavlar.js > til-i; eposta: it-polito-tili-takvim |
| IT-5 | Sapienza ön seçim 2027/28 (sonra 2028/29) | Aralık 2026; Aralık 2027 | https://www.uniroma1.it/en/admissions | ulkeler.js > it-sapienza; ulke-rotalari.js > it-basvuru |
| IT-6 | Padova Information Engineering 2028/29 AB dışı penceresi (2027/28 çağrı PDF'i de hâlâ TBD) | 2027 sonbaharı | https://apply.unipd.it/courses/course/182 | ulkeler.js > it-padova; ulke-rotalari.js > it-basvuru; eposta: it-uni-cents-gecerlilik |
| IT-7 | Tor Vergata Engineering Sciences 2027/28 çağrısı (Procedure C) | Ocak 2027 | https://engineering-sciences.uniroma2.it/call-for-applications/ | ulkeler.js > it-torvergata |
| IT-8 | Trento DISI lisans çağrısı 2027/28 (AB dışı test ve eşik) | Aralık 2026 | https://corsi.unitn.it (bot koruması; tarayıcıdan kontrol) | ulkeler.js > it-trento |
| IT-9 | Milano/Pavia AI lisans 2027/28 AB dışı başvuru (SAT eşiği, kontenjan) | Mart–Nisan 2027 | https://apply.unipv.eu/it_IT/courses/course/162-artificial-intelligence-procedure-noneu-students | ulkeler.js > it-milano-ai |
| IT-10 | Genova 2027/28 uluslararası başvuru takvimi | Kasım 2026 | https://unige.it/en/internazionale/iscrizioni-internazionali/scadenze | ulkeler.js > it-genova |
| IT-11 | Napoli EEIT 2027/28 ön kabul takvimi | Ocak 2027 | https://eeit.dieti.unina.it/index.php/admission/admission-schedule | ulkeler.js > it-napoli |
| IT-12 | UCBM Biomedical Engineering 2027/28 İngilizce çağrısı (yurtdışı yabancı öğrenci kontenjanı) | Ocak 2027 | https://www.unicampus.it/en/corsi/offerta-formativa/corsi-di-laurea/facolta-dipartimentale-di-ingegneria/cdl-in-biomedical-engineering-l-8/ammissioni-cdl-in-biomedical-engineering-l-8/ | ulkeler.js > it-ucbm |
| IT-13 | MUR genelgesi 2028/29 (vize son tarihi) | 2028 ilkbaharı (mevcut iki yıllık genelge Nisan 2026'da iletildi) | https://www.universitaly.it/it/studenti-stranieri | ulkeler.js > it (kabulYolu[0]); ulke-rotalari.js > it-vize; eposta: it-konsolosluk-dov, it-uni-cimea-dov |
| IT-14 | DSU 2028/29 çağrıları (PoliMi/Lombardiya, EDISU, DiSCo, Padova) | Haziran–Temmuz 2028 | PoliMi DSU sayfası, edisu.piemonte.it, laziodisco.it, unipd.it/borse-studio-alloggi | ulke-rotalari.js > it-dsu-basvuru; eposta: it-dsu-turkiye-belgeleri |
| IT-15 | PoliTo ve diğer üniversitelerin 2028/29 ücret yönetmelikleri | Temmuz 2028 | ilgili üniversite ücret sayfaları | ulkeler.js > it-polito, it-sapienza, it-padova, it-genova, it-ucbm, it-milano-ai |
| IT-16 | ÖSYM 2028 sınav takvimi (YKS) | 2027'nin son çeyreği | https://www.osym.gov.tr | ulke-rotalari.js > it-yks |

## Almanya ve ortak
*Ajan 13 (Dr. Marcus Weber ile), Tur 8. Son kontrol: 12 Ekim 2026. Ayrıntı ve kaynaklar: `.agents/mevzuat/dogrulama/bulgular-de.json`.*

| # | Ne bekleniyor | Beklenen tarih | Kontrol edilecek URL | Etkilediği dosya > id |
| :-- | :-- | :-- | :-- | :-- |
| DE-1 | ÖSYM 2027 sınav takvimi (ara kontrol: yayın ayı kalıbının sürüp sürmediği; 2025 takvimi 13.11.2024'te açıklandı, 2026 takvim PDF'i 20.11.2025 tarihli) | Kasım 2026 ortası | https://www.osym.gov.tr/Sayfa/SinavTakvimi | ulke-rotalari.js > TAKVIM_NOTU_OSYM (bilgi amaçlı; Meberra'nın yılı 2028) |
| DE-2 | ÖSYM 2028 sınav takvimi: YKS başvuru, sınav, sonuç, tercih ve yerleştirme tarihleri (Meberra'nın mezuniyet yılı) | Kasım 2027 | https://www.osym.gov.tr/Sayfa/SinavTakvimi ; arşiv: https://www.osym.gov.tr/arsiv-osym-sinav-ve-yerlestirme-takvimleri | ulke-rotalari.js > de-yks-basvuru, de-yks-sinav, de-yks-tercih, de-yks-yerlesme, TAKVIM_NOTU_OSYM; eposta-sablonlari.js > de-uni-yks-gec-teslim (neZaman) |
| DE-3 | 2028 YKS yerleştirme sonuç günü (takvimdeki tarih; 15 Temmuz çakışmasının o yıl da sürüp sürmediği) | Takvimde Kasım 2027; açıklanma Ağustos 2028 | https://www.osym.gov.tr/Duyurular/Index | ulke-rotalari.js > de-yks-gec-teslim, de-yks-yerlesme, uyarilar[Takvim çakışması] |

## Tur 10 eklemeleri: mezun ve sınıfa göre şartlar
*Ajan 13, 14 Ekim 2026. Ayrıntı: `.agents/mevzuat/karar-notu-2026-10-14-mezun-sinif.md` §2–§5. Önerilen yeni adım id'leri henüz veri dosyasında yok; uygulanınca bu sütun geçerli olur.*

| # | Ne bekleniyor | Beklenen tarih | Kontrol edilecek URL | Etkilediği dosya > id |
| :-- | :-- | :-- | :-- | :-- |
| MS-1 | ÖSYM 2027-YKS Kılavuzu: OBP formülü (diploma × 5, × 0,12), bir önceki yıl yerleşene OBP katsayısının yarıya inmesi ("kayıt olsun veya olmasın") ve "yalnızca o yılın puanı" ilkesi sürüyor mu? | Şubat 2027 | https://www.osym.gov.tr (YKS kılavuzu sayfası; 2026 örneği: https://dokuman.osym.gov.tr/pdfdokuman/2026/YKS/basvuru_kilavuz06022026.pdf §4.1–4.2) | ulke-rotalari.js > de-mezun-yerlesme-kontrol, de-diploma-notu (önerilen) |
| MS-2 | PoliMi DSU 2027/28 çağrısı: Md. 4.2 "absolute first enrolment" (yurtdışında önceki kayıt → "subsequent years" profili) | Haziran–Temmuz 2027 | PoliMi DSU sayfası (2026/27 örneği: https://www.polimi.it/fileadmin/user_upload/studenti/tasse-borse-agevolazioni-economiche/dsu/bando_2026-2027/DSU_Call_a.y._2026-2027.pdf) | ulke-rotalari.js > it-mezun-dsu-ilk-kayit (önerilen) |
| MS-3 | EDISU, DiSCo ve ESU Padova DSU 2027/28 çağrıları: yurtdışında önceki lisans kaydının 1. sınıf profiline etkisi | Haziran–Eylül 2027 | edisu.piemonte.it ; laziodisco.it ; unipd.it/borse-studio-alloggi | ulke-rotalari.js > it-mezun-dsu-ilk-kayit (önerilen) |
| MS-4 | PoliMi 2027/28 mühendislik çağrısı: mezun uygunluk maddesi (2026-27'de Md. 6.3: önceki yıllarda alınmış diploma) | Kasım 2026 (IT-3 ile birlikte) | https://www.polimi.it/en/prospective-students/how-to-apply/admission-to-laurea-programmes/engineering | ulke-rotalari.js > it-mezun-uygunluk (önerilen) |
| MS-5 | CISIA 2026/27 CEnT kuralları: kayıt uygunluğu (mezun ya da sınıf kısıtı eklendi mi?) | 31 Ekim 2026'ya kadar (IT-1 ile birlikte; 14 Ekim'de sayfa hâlâ 2025/26 kurallarını gösteriyordu) | https://www.cisiaonline.it/en/cent/all-about-CEnT/CEnT-rules | ulke-rotalari.js > it-mezun-uygunluk, it-cents-asil |
| MS-6 | College Board 2027 AP: mezunların sınava girme şartı (international FAQ) ve sipariş son günü | Ağustos–Eylül 2027 (2028 sınavları için) | https://international.collegeboard.org/help-center/can-i-take-ap-exam-after-completing-grade-12 ; https://apcentral.collegeboard.org/exam-administration-ordering-scores/ordering-fees/exam-fees | ulke-rotalari.js > de-mezun-ap-uyari (önerilen), de-ap-profil |

*Durum notu (14 Ekim 2026):*
- **IT-1:** Kontrol edildi. CISIA sayfası hâlâ 2025/26 kurallarını gösteriyor (55 soru, 55 €). Hedef tarih henüz gelmedi.
- **DE-1:** 2026/27'de 12. sınıfta olan kullanıcılar için ÖSYM 2027 takvimi doğrudan mezuniyet yılı takvimi oldu. Öncelik yükseltildi.

## Tur 10 eklemeleri: mezun için diğer ülkeler (Mezun Menüsü ön araştırması)
*Ajan 13, 14 Ekim 2026. Ayrıntı: `.agents/mevzuat/karar-notu-2026-10-14-mezun-diger-ulkeler.md` §3–§5. Veri dosyalarında henüz karşılığı yok; "Etkilediği" sütunu, menü uygulanınca oluşacak ülke kayıtlarını gösterir.*

| # | Ne bekleniyor | Beklenen tarih | Kontrol edilecek URL | Etkilediği (önerilen) |
| :-- | :-- | :-- | :-- | :-- |
| DU-1 | Stipendium Hungaricum 2027/28 çağrısı (son tarih; 2026/27'de 15 Ocak 2026, 14:00 CET), harçlık ve konut tutarları, 18 yaş kuralı | Kasım 2026 | https://stipendiumhungaricum.hu/ ; https://apply.stipendiumhungaricum.hu | mezun-hu (SH adımı) |
| DU-2 | MEB ABDGM "Macaristan Hükümeti Bursu 2027-2028" duyurusu: lisans kontenjanı (2025/26'da 55), basvuru.meb.gov.tr son günü, Ankara'daki sözlü sınav tarihleri | Kasım 2026 | https://abdigm.meb.gov.tr/ | mezun-hu (MEB adımı) |
| DU-3 | BME 2027/28 ücret tablosu (2026/27: 3.200–3.500 €/dönem), Eylül 2027 başvuru dönemi (2026'da 1 Nisan–15 Mayıs), giriş sınavı tablosu | Mart–Nisan 2027 | https://xplore.bme.hu/tuition-fees/ ; https://xplore.bme.hu/admission | mezun-hu (BME) |
| DU-4 | WUT 2027/28 İngilizce B.Sc. teklifi, Rektör ücret kararı ve başvuru takvimi (2026/27'de son gün 21 Temmuz, belgeler 19 Ağustos) | Mayıs–Haziran 2027 | https://www.students.pw.edu.pl/Studies-Offer/B.Sc.-offer ; https://eng.pw.edu.pl/Admissions | mezun-pl |
| DU-5 | Twente AP şartları, Eylül 2028 dönemi (şu an Eylül 2027 için geçerli; her ekimde yenileniyor) ve "previous academic year" diploma cümlesi | Ekim 2027 (Eylül 2027 sürümü için ara kontrol Ekim 2026) | https://www.utwente.nl/en/education/bachelor/how-to-apply/diplomas/AP-CollegeBoard/ | mezun-nl |
| DU-6 | Groningen (RUG) Türkiye sayfası: 4 AP kuralı ve programa özel AP şartları | Her ekim | https://www.rug.nl/education/application-enrolment-tuition-fees/admission/non-dutch-qualification/bachelor/bachelor-entry-requirements/bachelorlinkscountry/turkey | mezun-nl |
| DU-7 | Twente 2028/29 ücreti (2027/28: 16.869 €) ve Holland Scholarship 2027/28 kurum son tarihleri | Kasım 2026 (HS); 2027 (ücret) | https://www.utwente.nl/en/education/bachelor/tuition-fees/ ; https://www.studyinnl.org/finances/holland-scholarship | mezun-nl |
| DU-8 | BMBWF/OeAD Türkiye kabul tavsiyesinin yeni sürümü (mevcut: Ekim 2025; YKS 180+, 5 yıl kuralı) | Her yıl ekim (sürüm kontrolü) | https://oead.at/fileadmin/Dokumente/oead.at/OeAD_Hauptmenueseiten/Studieren_Forschen_Lehren/ENIC_NARIC_PDFs/Tuerkei__Zulassung.pdf | mezun-at |
| DU-9 | JKU (AB dışı, 6 Şubat–31 Mart) ve AAU (1 Nisan–30 Haziran) 2027/28 başvuru dönemleri | Ocak 2027 | https://jku.at/en/degree-programs/prospective-students/register-to-enroll/bachelors-degree-diploma-degree ; https://www.aau.at/en/studien/bachelor-robotics-artificial-intelligence/ | mezun-at |
| DU-10 | Avusturya öğrenci oturum izni 2027 geçim tutarı (2026: 24 yaş altı için 722,58 €/ay; OeAD sayfası hâlâ 2025 tutarını gösteriyor) | Ocak 2027 | https://oead.at/en/to-austria/entry-and-residence/residence-permit-student-no-mobility-programme | mezun-at |

## Tur 11 eklemeleri: üniversite mezunu, Almanya yüksek lisans
*Ajan 13, 15 Ekim 2026. Ayrıntı: `.agents/mevzuat/karar-notu-2026-10-15-yl-almanya.md` ve `.agents/mevzuat/dogrulama/yl-de.json`. Veri dosyalarında henüz karşılığı yok; "Etkilediği" sütunu yl-de.json madde id'sidir.*
*Tur 11 takip kontrolü: 15 Ekim 2026 itibarıyla beklenen tarihi gelmiş madde yok (IT-1/MS-5 hedefi 31 Ekim, DE-1 hedefi Kasım ortası).*

| # | Ne bekleniyor | Beklenen tarih | Kontrol edilecek URL | Etkilediği (yl-de.json) |
| :-- | :-- | :-- | :-- | :-- |
| YL-DE-1 | BMI'nın 2027 takvim yılı öğrenci geçim tutarı ilanı (yasal son gün 31.08.2026; bu turda bulunamadı) ve 2028 ilanı (31.08.2027) | Hemen (2027); 31.08.2027 (2028) | https://www.bundesanzeiger.de ; yasal dayanak https://www.gesetze-im-internet.de/aufenthg_2004/__2.html | yl-de-sperrkonto-2026, yl-de-sperrkonto-2027 |
| YL-DE-2 | 30. BAföG değişiklik yasasının (Drucksache 21/8405) kabulü: konut payı 440 € (SS 2027), Bedarfssatz 503 € (WS 2027/28) | Kış 2026/27 | https://www.bundestag.de/presse/hib/kurzmeldungen-1223398 | yl-de-sperrkonto-2027 |
| YL-DE-3 | DAAD-TEV yüksek lisans bursu 2027 çağrısı (son tarih) | Aralık 2026 - Şubat 2027 | https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/?detail=50016578 | yl-de-burs-daad-tev |
| YL-DE-4 | DAAD 2028/29 burs son tarihleri (Study Scholarships, EPOS, Helmut-Schmidt) ve Türkiye uygunluğu | 2027 2. çeyrek | https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/?detail=50026200 | yl-de-burs-daad-genel, yl-de-burs-epos, yl-de-burs-helmut-schmidt |
| YL-DE-5 | TUM 2027/28 yüksek lisans harçlarının program bazında kademesi (4.600 / 6.800 €) | Şubat 2027 (başvuru açılışı) | https://www.tum.de/en/studies/fees/tuition | yl-de-harc-tum |
| YL-DE-6 | Stuttgart Computer Science / INFOTECH WS 2027/28 başvuru penceresinin açılması (15.11.2026) | 15 Kasım 2026 | https://www.uni-stuttgart.de/en/study/study-programs/Computer-Science-M.Sc.-00001/ | yl-de-en-t-stuttgart |
| YL-DE-7 | Goethe-Institut Türkiye 2027 C2 sınav tarihleri ve TL ücretleri; TestDaF Türkiye merkezleri | Kasım-Aralık 2026 | https://www.goethe.de/ins/tr/tr/spr/prf.html ; https://www.testdaf.de/de/testzentren/der-testdaf-an-ihrem-testzentrum/die-testzentren-von-gast/ | yl-de-yerel-tr-merkez |

## Tur 11 eklemeleri: üniversite mezunu → Avrupa'da yüksek lisans (Türkiye tarafı ve AB çapı)
*Ajan 13, 15 Ekim 2026. Ayrıntı: `.agents/mevzuat/karar-notu-2026-10-15-yl-turkiye-ab.md`; bulgular: `.agents/mevzuat/dogrulama/yl-genel.json`. Veri dosyalarında henüz karşılığı yok; "Etkilediği" sütunu JSON madde id'sidir.*

| # | Ne bekleniyor | Beklenen tarih | Kontrol edilecek URL | Etkilediği (JSON id) |
| :-- | :-- | :-- | :-- | :-- |
| ~~YL-1~~ | **KAPANDI (16.10.2026):** Jean Monnet 2027-2028 "Açıklamalar" yayımlandı (TR+EN PDF, https://jeanmonnet.org.tr/wp-content/uploads/2026/10/clarifications_2027_2028_academic_year.pdf); bulgu sinavlar-tur12.json > tur11Duzeltmeleri | ~~En geç 16 Ekim 2026~~ | https://www.cfcu.gov.tr/ ; https://www.jeanmonnet.org.tr/ | yl-genel-jm-aciklamalar |
| YL-2 | MEB "2026 Yılı 1416 Bursları" ilanı ve kılavuzu (kontenjan, ALES/GNO, yaş, başvuru günleri) | Aralık 2026 (2025 ilanı 18 Aralık 2025'te çıktı) | https://yyegm.meb.gov.tr/meb_iys_dosyalar/xml/rss_duyurular.xml | yl-genel-ylsy-2026-ilan, yl-genel-ylsy-sartlar |
| YL-3 | Jean Monnet 2027-2028 aylık burs tutarları tablosu (mevcut sayfa 02.12.2025 güncellemesi) | Aralık 2026 | https://www.ab.gov.tr/45645_en.html | yl-genel-jm-kapsam |
| YL-4 | MEB ABDGM yabancı hükümet bursları 2027-2028: AB ülkelerinin yüksek lisans kontenjanları | Kasım 2026 - Ocak 2027 | https://abdigm.meb.gov.tr/ | yl-genel-meb-yabanci-hukumet |
| YL-5 | Jean Monnet 2028-2029 duyurusu (2027/28'i kaçıranlar için) | Ağustos 2027 (2027-2028 duyurusu 27 Ağustos 2026) | https://www.jeanmonnet.org.tr/ | yl-genel-jm-son-gun |

*Durum notu (15 Ekim 2026, Ajan 13):*
- **IT-1 / MS-5:** Kontrol edildi. CISIA CEnT kuralları sayfası hâlâ 2025-2026 yapısını (55 soru) gösteriyor. Hedef tarih (31 Ekim) gelmedi.
- **DU-8:** Kontrol edildi. OeAD Türkiye PDF'i hâlâ "Stand: Oktober 2025". Yeni sürüm yok.
- **DU-5:** Kontrol edildi. Twente AP sayfası hâlâ "September 2027 intake" diyor.

## Tur 11 eklemeleri: üniversite mezunu, İtalya yüksek lisans
*Ajan 13, 15 Ekim 2026. Ayrıntı: `.agents/mevzuat/karar-notu-2026-10-15-yl-italya.md` ve `.agents/mevzuat/dogrulama/yl-it.json`. "Etkilediği" sütunu yl-it.json madde id'lerini gösterir. Bu tur takip listesinde tarihi gelmiş madde yoktu (IT-1 ve MS-5: 31 Ekim 2026).*

| # | Ne bekleniyor | Beklenen tarih | Kontrol edilecek URL | Etkilediği (yl-it.json id) |
| :-- | :-- | :-- | :-- | :-- |
| YL-IT-1 | PoliTo 2027/28 yüksek lisans çağrıları, yabancı diploma (tur tarihleri, Universitaly ön kayıt son günleri) | Aralık 2026 (2026/27: 19 Aralık 2025'te açıldı) | https://www.polito.it/en/education/applying-studying-graduating/admissions-and-enrolment/master-s-degree-programmes/applicants-with-a-non-italian-qualification | yl-it-en-t-polito, yl-it-yr-t-polito, yl-it-polito-degerlendirme |
| YL-IT-2 | Sapienza 2027/28 MoveIn ön seçim takvimi (AB dışı; İtalyanca programlar için geç pencere) | Kasım–Aralık 2026 | https://www.uniroma1.it/en/admissions | yl-it-en-t-sapienza, yl-it-yr-t-sapienza |
| YL-IT-3 | Invest Your Talent in Italy 2027/28 çağrısı (Türkiye uygunluğu, yaş sınırı, tutar, başvuru penceresi) | Mart–Nisan 2027 | https://investyourtalent.esteri.it/IYT/SitoIYT/IT/invest-your-talent-in-italy | yl-it-en-t-iyt, yl-it-burs-iyt |
| YL-IT-4 | MAECI 2027/28 burs çağrısı (son gün, yaş sınırı, tutar) | Şubat 2027 | https://studyinitaly.esteri.it/ | yl-it-en-t-maeci, yl-it-burs-maeci |
| YL-IT-5 | PoliMi DSU 2027/28 çağrısı ve ek çağrısı (ISEE/ISPE eşikleri, yurt dışı gelirde vize tutarı alt sınırı, CAF son günü) | Haziran–Temmuz 2027 (MS-2 ile birlikte) | https://www.polimi.it/diritto-allo-studio | yl-it-dsu-polimi, yl-it-dsu-asgari-gelir, yl-it-iseeu-parificato, yl-it-en-t-dsu |
| YL-IT-6 | PoliMi 2027/28 harç yönetmeliği (AB dışı yüksek lisans için en yüksek dilim tutarı) | Haziran 2027 | https://www.polimi.it/en/students/tuition-fees-scholarships-and-financial-aid/tuition-fees | yl-it-harc-polimi |
| YL-IT-7 | PoliTo 2027/28 harç yönetmeliği, Ek 2'de Türkiye tutarı | Temmuz 2027 (IT-15 ile birlikte) | https://www.polito.it/en/education/applying-studying-graduating/academic-experience/diritto-allo-studio-e-contribuzione-studentesca/regulations-bachelor-s-from-2526-and-master-s | yl-it-harc-polito |
| YL-IT-8 | CILS 2027 oturum takvimi (Siena) ve İstanbul İtalyan Kültür Merkezi'nin 2027 CELI/CILS/PLIDA tarihleri | Kasım 2026–Ocak 2027 | https://iicistanbul.esteri.it/it/lingua-e-cultura/certificazioni/ | yl-it-yr-t-cils, yl-it-yr-t-celi, yl-it-yr-iic |
| YL-IT-9 | Bologna International Talents @Unibo 2027/28 çağrısı | Ocak–Şubat 2027 | https://corsi.unibo.it/2cycle/InternationalRelations/notice-board/international-talents-unibo-scholarships-for-international-students-a-y-2025-26 | yl-it-burs-unibo |
| YL-IT-10 | EDISU Piemonte 2027/28 DSU çağrısı (yurt dışı gelir belgeleri, tarihler) | Temmuz 2027 | https://www.edisu.piemonte.it | yl-it-dsu-edisu |

## Tur 11 eklemeleri: üniversite mezunu, yüksek lisans (SE, FI, DK, IE, HU, PL, CZ)
*Ajan 13, 15 Ekim 2026. Ayrıntı: `.agents/mevzuat/karar-notu-2026-10-15-yl-kuzey-orta-avrupa.md` ve `.agents/mevzuat/dogrulama/yl-*.json`. Veri dosyalarında henüz karşılığı yok; "Etkilediği" sütunu JSON madde id'sini gösterir.*

| # | Ne bekleniyor | Beklenen tarih | Kontrol edilecek URL | Etkilediği (JSON > id) |
| :-- | :-- | :-- | :-- | :-- |
| YL-1 | SISGP 2027/28 uygun ülke listesi (Türkiye var mı?) ve program listesi | 19 Ekim 2026 (ülkeler); Kasım 2026 ortası (programlar) | https://si.se/en/apply/scholarships/swedish-institute-scholarships-for-global-professionals/ | yl-se > yl-se-burs-sisgp |
| YL-2 | Migrationsverket 2027 aylık geçim tutarı (2026: 10.656 SEK) | Ocak 2027 | https://www.migrationsverket.se/en/you-want-to-apply/study/higher-education.html | yl-se > yl-se-vize-gecim |
| YL-3 | DTU Güz 2027 harç tutarı (sayfa 7.500 €/dönem ve revizyon notu gösteriyor) ve 2027 takviminin yıllı sürümü | Kasım–Aralık 2026 | https://www.dtu.dk/english/education/graduate/fees-and-funding | yl-dk > yl-dk-dtu-harc, yl-dk-en-tarih-dtu |
| YL-4 | SIRI 2027 geçim tutarı (2026: aylık 7.426 DKK) | Ocak 2027 | https://www.nyidanmark.dk/en-GB/You-want-to-apply/Study/Higher-education | yl-dk > yl-dk-gecim |
| YL-5 | GOI-IES 2027 çağrısı (son tarih, uygun kurumlar) | 2026 sonu – 2027 başı | https://hea.ie/policy/internationalisation/goi-ies/ | yl-ie > yl-ie-burs-goies-2027 |
| YL-6 | Stipendium Hungaricum 2027/28 çağrısı (DU-1 ile aynı belge; YL ve Macarca hazırlık maddeleri) | Kasım 2026 | https://stipendiumhungaricum.hu/apply/ | yl-hu > yl-hu-en-tarih-sh, yl-hu-yerel-tarih-sh |
| YL-7 | MEB "Macaristan Hükümeti Bursu 2027-2028" YL kontenjanı (DU-2 ile aynı duyuru) | Kasım 2026 | https://abdigm.meb.gov.tr/ | yl-hu > yl-hu-burs-meb |
| YL-8 | BME Eylül 2027 başvuru dönemi ve 2027/28 MSc harçları (DU-3 ile birlikte) | Mart–Nisan 2027 | https://xplore.bme.hu/admission ; https://xplore.bme.hu/tuition-fees/ | yl-hu > yl-hu-en-tarih-bme-eylul, yl-hu-bme-harc |
| YL-9 | WUT 2027/28 M.Sc. takvimi ve harçları (DU-4 ile birlikte) | Mayıs 2027 | https://www.students.pw.edu.pl/How-to-Apply/Admission-to-M.Sc ; https://www.students.pw.edu.pl/Studies-Offer/M.Sc.-offer | yl-pl > yl-pl-en-tarih-wut, yl-pl-en-wut-harc |
| YL-10 | ČVUT FEL 2027/28 kabul koşulları (son tarih, harç) | 2026 sonu – 2027 başı | https://fel.cvut.cz/en/admission | yl-cz > yl-cz-en-tarih-fel, yl-cz-en-harc |

*Durum notu (15 Ekim 2026): Önceki bölümlerde beklenen tarihi geçmiş madde yok. IT-1 (31 Ekim) ve DE-1 (Kasım) henüz vadesinde değil. DU-5, DU-6 ve DU-8 "her ekim" maddeleri bu tur yeniden kontrol edilmedi (tur kapsamı ve arama kotası); bir sonraki turda öncelikli.*

## Tur 11 eklemeleri: üniversite mezunu, Batı Avrupa yüksek lisans (AT, CH, NL, BE, FR, ES)
*Ajan 13, 15 Ekim 2026. Ayrıntı: `.agents/mevzuat/karar-notu-2026-10-15-yl-bati-avrupa.md` ve `.agents/mevzuat/dogrulama/yl-at|ch|nl|be|fr|es.json`. Veri dosyalarında henüz karşılığı yok; "Etkilediği" sütunu JSON madde id'sini gösterir. Önek "YB", diğer Tur 11 bölümlerindeki "YL" numaralarıyla karışmasın diye seçildi.*

| # | Ne bekleniyor | Beklenen tarih | Kontrol edilecek URL | Etkilediği (JSON > id) |
| :-- | :-- | :-- | :-- | :-- |
| YB-1 | ULB 2027/28 AB dışı başvuru penceresi (2026/27: 16 Şubat–31 Mart) | Ocak–Şubat 2027 | https://www.ulb.be/fr/preparer-un-dossier/informations-pour-les-etudiants-etrangers | yl-be > yl-be-en-tarih-ulb, yl-be-yerel-tarih |
| YB-2 | Master Mind 2027/28 çağrısı (burs gözden geçiriliyor; tutar ve kurallar değişebilir) | Kasım 2026 – Ocak 2027 | https://www.studyinflanders.be/scholarships/master-mind-scholarships | yl-be > yl-be-burs-master-mind |
| YB-3 | ARES 2027/28 genelgesi ekleri: Türkiye ek ücretten (4.175 €) muaf mı? | 2027 başı (2026 genelgesi 12.02.2026'da çıktı) | https://www.ares-ac.be/ ; 2026 örneği: https://www.ares-ac.be/sites/default/files/2026-02/circulaire-ndeg2026-001-du-12-02-2026.pdf | yl-be > yl-be-ucret-ulb |
| YB-4 | İspanya 2027/28 ön kayıt (preinscripción) takvimleri: UPM, UPC, UC3M, UPV Faz 0 | Kasım 2026 – Şubat 2027 | https://www.upv.es/entidades/SESTU/mastersoficiales/InfoFase0.pdf ; UPM ve UC3M yüksek lisans sayfaları | yl-es > yl-es-en-tarih, yl-es-yerel-tarih |
| YB-5 | Holland Scholarship 2027/28 katılımcı kurumlar ve son tarihleri (DU-7 ile birlikte) | 1 Kasım 2026 | https://www.studyinnl.org/finances/holland-scholarship | yl-nl > yl-nl-burs-holland |
| YB-6 | EPFL 2027 yüksek lisans takvim sayfası güncellemesi (sayfa © 2025; 15 Aralık / 31 Mart) | Kasım 2026 | https://www.epfl.ch/education/admission/fr/admission/conditions-dadmission-inscription-master/ | yl-ch > yl-ch-en-tarih-epfl |
| YB-7 | TU Wien 2027/28 kayıt dönemleri (2026/27: 6 Temmuz–31 Ekim) | Ocak 2027 | https://www.tuwien.at/en/studies/admission/masters-programmes/other-inter-national-bachelors-degree | yl-at > yl-at-en-tarih-tuwien |
| YB-8 | Avusturya 2027 öğrenci geçim tutarları (2026: 722,58 € / 1.308,39 €; DU-10 ile birlikte) | Ocak 2027 | https://oead.at/en/to-austria/entry-and-residence/residence-permit-student-no-mobility-programme | yl-at > yl-at-oturum |
| YB-9 | Hollanda IND 2027 tutarları (2026: 1.130,77 €/ay) | Ocak 2027 | https://ind.nl/en/required-amounts-income-requirements | yl-nl > yl-nl-oturum |

*Durum notu (15 Ekim 2026, Batı Avrupa turu): DU-8 kontrol edildi. OeAD Türkiye PDF'i hâlâ "Stand: Oktober 2025"; madde açık. IT-1 kontrol edildi. CISIA CEnT kuralları sayfası hâlâ 2025/26 kurallarını gösteriyor (55 soru, 55 €); son tarih 31 Ekim 2026, madde açık.*

## Tur 11 eklemeleri: lisans, yerel dil yolu (Almanca / İtalyanca)
*Ajan 13, 15 Ekim 2026. Ayrıntı: `.agents/mevzuat/karar-notu-2026-10-15-lisans-de-it-dil.md`; bulgular: `dogrulama/lisans-de.json`, `dogrulama/lisans-it.json`. Önerilen id'ler henüz veri dosyasında yok.*

| # | Ne bekleniyor | Beklenen tarih | Kontrol edilecek URL | Etkilediği (önerilen) id |
| :-- | :-- | :-- | :-- | :-- |
| LD-1 | PoliTo 2027/28 çağrısı: İtalyanca programlar için vizeli adayın B2 belge son günü (2026/27: 22 Mayıs 2026) | Aralık 2026 (IT-4 ile birlikte) | https://www.polito.it/didattica/iscriversi-studiare-laurearsi/iscrizione/corsi-di-laurea/bandi-regolamenti-e-graduatorie | lis-it-yerel-polito-dil, lis-it-yerel-polito |
| LD-2 | PoliMi 2027/28 çağrısı Art. 3: İtalyanca programlara erken kayıt pencereleri (2026/27: 11 Mart–31 Mayıs, 1 Haziran–16 Temmuz) | Kasım 2026 (IT-3 ile birlikte) | https://www.polimi.it/en/prospective-students/how-to-apply/admission-to-laurea-programmes/engineering | lis-it-yerel-polimi-erken-pencere |
| LD-3 | MUR/konsolosluk 2027/28 notu: İtalyanca tıp, diş, veteriner eleme dönemi (2026/27: Universitaly 3 Ağustos, vize 10 Ağustos) | 2027 ilkbaharı–yazı | https://consistanbul.esteri.it/it/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/studiare-in-italia/universita/ | lis-it-yerel-tip-tarih |
| LD-4 | CILS 2028 sınav tarihleri (2026 ve 2027 yayımlandı) | 2027 sonbaharı | https://cils.unistrasi.it/1/212/mappa_del_sito.htm | lis-it-yerel-cils-aralik, lis-it-yerel-cils-haziran |

*Durum notu (15 Ekim 2026):* IT-1 yeniden kontrol edildi; CISIA CEnT kuralları sayfası hâlâ 2025/26 sürümünde (55 soru). Hedef tarih (31 Ekim) henüz gelmedi. Bu turda tarihi gelmiş madde yok.

## Tur 11 — lisans, Kuzey ve Orta Avrupa (SE, FI, DK, IE, HU, PL, CZ)
*Ajan 13, 15 Ekim 2026. Ayrıntı: `.agents/mevzuat/karar-notu-2026-10-15-lisans-kuzey-orta-avrupa.md`; veriler `dogrulama/lisans-{se,fi,dk,ie,hu,pl,cz}.json`. HU ve PL "Yayımlanmadı" maddeleri mevcut DU-1…DU-4 maddelerine bağlandı (aşağıda).*

| # | Ne bekleniyor | Beklenen tarih | Kontrol edilecek URL | Etkilediği dosya > id |
| :-- | :-- | :-- | :-- | :-- |
| LK-1 | Aalto 2027 Fince/İsveççe lisans başvuru kılavuzu: yabancı diploma için dil belgesi son günleri ve seçim yolu | 26 Ekim 2026'ya kadar | https://www.aalto.fi/fi/hakijapalvelut/hae-suomen-ja-ruotsinkielisiin-kandidaattiohjelmiin | lisans-fi.json > lis-fi-yerel-dil-son, lis-fi-yerel-sinav |
| LK-2 | Trinity College Dublin 2027/28 lisans ücretleri (AB dışı mühendislik) | 2027 ilkbaharı | https://www.tcd.ie/courses/undergraduate/fees/ | lisans-ie.json > lis-ie-en-ucret-2728, lis-ie-ucret |
| LK-3 | Gdańsk Teknik Üniversitesi 2027/28 takvimi ve ücret kararı | Mayıs 2027 | https://pg.edu.pl/en/admission/bachelor-studies-international-students/dates-and-deadlines | lisans-pl.json > lis-pl-en-pg, lis-pl-en-pg-ucret |
| LK-4 | Poznan Teknik Üniversitesi 2027/28 takvimi | Nisan–Mayıs 2027 | https://put.poznan.pl/en/admission-for-international/first-cycle/schedule | lisans-pl.json > lis-pl-en-put |
| LK-5 | ÇVUT Elektrik Fakültesi 2027/28 İngilizce lisans kabul koşulları (son başvuru tarihi; sayfa şu an Ağustos 2026 tarihlerini gösteriyor) | Kasım 2026–Ocak 2027 | https://fel.cvut.cz/en/admissions/admission-procedures/step-by-step | lisans-cz.json > lis-cz-en-ctu-tarih |

*Mevcut maddelere bağlanan yeni id'ler:* DU-1 → lisans-hu.json > lis-hu-en-sh, lis-hu-yerel-sh · DU-2 → lis-hu-burs-meb · DU-3 → lis-hu-en-bme-eylul · DU-4 → lisans-pl.json > lis-pl-en-wut.
*Durum notu (15 Ekim 2026):* DU-1 kontrol edildi; SH sitesinde 2027/28 çağrısı yok (son haber 10 Eylül 2026). Bu bölümde tarihi gelmiş madde yok.

## Tur 11 eklemeleri: lisans, Batı Avrupa (AT, CH, NL, BE, FR, ES)
*Ajan 13, 15 Ekim 2026. Ayrıntı: `.agents/mevzuat/karar-notu-2026-10-15-lisans-bati-avrupa.md` ve `dogrulama/lisans-{at,ch,nl,be,fr,es}.json`.*

| # | Ne bekleniyor | Beklenen tarih | Kontrol edilecek URL | Etkilediği dosya > id |
| :-- | :-- | :-- | :-- | :-- |
| LB-1 | ETH ülke şartları PDF'inin 2026/27 ve 2027/28 sürümü (indirilen PDF hâlâ "Academic Year 2025/26"; swissuniversities listesi 2026/27) ve ETH 2027 güzü başvuru tarihleri (tarih sayfasında boş) | Kasım–Aralık 2026 | https://ethz.ch/content/dam/ethz/main/education/admission/bachelor/andere-qual/ETH-Zulassungsbedingungen-EN.pdf ; https://ethz.ch/en/studies/bachelor/application/non-swiss-matriculation-certificate/dates.html | lisans-ch.json > lis-ch-eth-kural, lis-ch-eth-basvuru |
| LB-2 | swissuniversities 2027/28 Türkiye satırı | Her yıl sonbahar | https://www.swissuniversities.ch/en/topics/studying/admission-to-universities/countries-1 | lisans-ch.json > lis-ch-genel-kural, lis-ch-ap-abd |
| LB-3 | EPFL CMS ülke koşulları 2027 sürümü (mevcut: "valid for 2026") | Kasım 2026 | https://www.epfl.ch/education/admission/wp-content/uploads/2019/01/Conditions-CMS.pdf | lisans-ch.json > lis-ch-epfl-cms |
| LB-4 | KU Leuven 2027–28 başvuru son tarihi (Türk vatandaşı, vize gerektiren; sayfa seçim gerektiriyor) | Hemen (tarayıcıdan) | https://icts.kuleuven.be/apps/tuitionfees/application-windows | lisans-be.json > lis-be-en-kul-pencere |
| LB-5 | UCLouvain 2027-28 ücretleri ve ARES genelgesi ekleri (Türkiye muaf mı?) | Mayıs–Haziran 2027 | https://uclouvain.be/fr/inscriptions/montant-droits-inscription | lisans-be.json > lis-be-ucl-harc, lis-be-burs-ares |
| LB-6 | Campus France Türkiye DAP 2028 prosedürü (2028/29; şu an 11. sınıfta olanlar için) | Ekim 2027 | https://www.turquie.campusfrance.org/fr | lisans-fr.json > lis-fr-fr-dap-son, lis-fr-fr-mulakat, lis-fr-fr-cevap, lis-fr-fr-secim |
| LB-7 | École polytechnique Bachelor 2028 girişi dalgaları ve ücretleri | Eylül 2027 | https://programmes.polytechnique.edu/bachelor/admissions/criteres-et-procedure-dadmission | lisans-fr.json > lis-fr-en-x-dalga, lis-fr-en-x-ucret |
| LB-8 | UC3M Early Admission 2028 dönemi ve 2027/28 AB dışı ücretleri | Ekim 2027 (ücret: Temmuz 2027) | https://www.uc3m.es/bachelor-degree/admission/application/international-students/early-admission/deadline ; https://www.uc3m.es/bachelor-degree/admission/application/enrollment/prices/non-eu | lisans-es.json > lis-es-en-early, lis-es-es-early, lis-es-ucret |
| LB-9 | Belçika göç idaresi öğrenci geçim tutarı 2027-28 (sayfa insan doğrulaması nedeniyle okunamadı) | Hemen (tarayıcıdan) | https://dofi.ibz.be/en/themes/third-country-nationals/studies/higher-education/admission-and-stay | lisans-be.json > lis-be-vize |
| LB-10 | Klagenfurt (AAU) VFS Global yetkinlik kontrolü: Türkiye için başlangıç dönemi, ücret, içerik (program sayfası Türkiye'yi listeliyor; ayrıntı sayfası bulunamadı) | Hemen (e-posta) | https://www.aau.at/en/studien/bachelor-robotics-artificial-intelligence/ | lisans-at.json > lis-at-en-aau-vfs |

*Durum notu (15 Ekim 2026), mevcut maddeler:*
- **DU-5:** Kontrol edildi. Twente AP sayfası hâlâ "September 2027 intake" diyor; Eylül 2028 sürümü henüz yok. Twente son tarih sayfasında mezuniyet kanıtı tarihi artık **1 Temmuz** (14 Ekim notundaki 15 Haziran, eksik şartların son günüdür).
- **DU-6:** Kontrol edildi. RUG Türkiye sayfası 12 Ekim 2026 sürümünde; değişiklik yok. Yeni bulgu: fizik programlarında AP Physics 2 şart, Physics C yetersiz.
- **DU-8:** Kontrol edildi. OeAD Türkiye PDF'i hâlâ "Stand: Oktober 2025".
- **DU-10:** OeAD sayfası artık 2026 tutarlarını gösteriyor (24 yaş altı 722,58 €, 24 ve üstü 1.308,39 €). 2025/2026 farkı kapandı; madde yalnızca 2027 tutarı için (Ocak 2027) açık kalıyor.

## Tur 11 eklemeleri: ülkenin en iyi 20 üniversitesi (SE, FI, DK, IE, HU, PL, CZ)
*Ajan 13, 15 Ekim 2026. Ayrıntı: `.agents/mevzuat/karar-notu-2026-10-15-ilk20-kuzey-orta.md`; veri: `.agents/mevzuat/dogrulama/uni-<cc>.json`.*

| # | Ne bekleniyor | Beklenen tarih | Kontrol edilecek URL | Etkilediği (önerilen) |
| :-- | :-- | :-- | :-- | :-- |
| IL-1 | QS World University Rankings 2028 (7 ülke listesinin yenilenmesi) | Haziran 2027 | https://www.topuniversities.com/world-university-rankings ; uç nokta: https://www.topuniversities.com/rankings/endpoint?nid=<yeni>&countries=<cc> | uni-se…uni-cz.json > siralama, qsSira, sıra |
| IL-2 | Türk vatandaşının Macarca programda devlet burslu (állami ösztöndíjas) kontenjana girip giremeyeceği. Dil hücreleri Tur 12'de üniversite portallarından kapandı (felvi.BME, MATE Képzéskereső, felveteli.sze.hu); felvi.hu hâlâ zaman aşımı veriyor | Bir sonraki tur | https://www.felvi.hu/ | uni-hu.json > BME, MATE, SZE (harcNotu, kesinlik) |
| IL-3 | Pollub 2027/28 tam İngilizce program listesi (Lehçe katalog Tur 12'de kapandı: 31 I. düzey, 17 II. düzey; PULS: 26 I. düzey, 21 II. düzey) | Kasım 2026 – Mart 2027 | https://bkm.pollub.pl/en/admission/programs/2027-2028 | uni-pl.json > Pollub |
| IL-4 | Danimarka'da İngilizce lisans dil değişiklikleri (AU Cognitive Science 2027'de Danca'ya geçiyor) | Ocak 2027 (optagelse.dk başvuru dönemi öncesi) | https://bachelor.au.dk/en/ ; https://studyindenmark.dk/portal | uni-dk.json > AU |
| IL-5 | universityadmissions.se Güz 2028 uluslararası tur programları (Meberra'nın yılı) | Ekim 2027 | https://www.universityadmissions.se/intl/search | uni-se.json (tüm kayıtlar) |
| IL-6 | Studyinfo 2028 ortak başvuru (İngilizce lisans listesi ve tarihleri) | Ekim–Kasım 2027 | https://opintopolku.fi/konfo/en/ | uni-fi.json (tüm kayıtlar) |

*Durum notu (15 Ekim 2026):*
- **DU-5:** Kontrol edildi. Sayfa 02.10.2026'da güncellenmiş ama hâlâ Eylül 2027 dönemini gösteriyor. Kural değişmedi (4 AP, her biri 3+). Madde kalır.
- **DU-6:** Kontrol edildi. Sayfa 12.10.2026'da güncellenmiş. Genel kural 4 AP; Tıp, Diş ve Biyoloji dipnotlarında "3 AP" yazıyor (Yoruma açık). Madde kalır.
- **DU-8:** Kontrol edildi. PDF erişilebilir; sürüm tarihi okunamadı. Madde kalır.

## Tur 11 eklemeleri: ülkenin en iyi 20 üniversitesi (DE, IT, AT, CH, NL, BE, FR, ES)
*Ajan 13, 15 Ekim 2026. Ayrıntı: `.agents/mevzuat/karar-notu-2026-10-15-ilk20-bati.md`; veri: `.agents/mevzuat/dogrulama/uni-{de,it,at,ch,nl,be,fr,es}.json`.*

| # | Ne bekleniyor | Beklenen tarih | Kontrol edilecek URL | Etkilediği (önerilen) |
| :-- | :-- | :-- | :-- | :-- |
| IW-1 | QS WUR 2028 (8 ülke listesinin yenilenmesi; IL-1 ile birlikte) | Haziran 2027 | https://www.topuniversities.com/rankings/endpoint?nid=<yeni>&countries=<cc> | uni-de/it/at/ch/nl/be/fr/es.json (sira, qsSira) |
| IW-2 | Bot korumalı siteler: **UniBS** (4 hücre; unibs.it ve bölüm siteleri Cloudflare/insan doğrulaması gösteriyor) ve **UniFi** (İngilizce lisans; unifi.it Cloudflare, DreamApply yalnızca master). UniMi, UniMiB, UniSi, UniFi YL, UniTrento, USI, Tilburg, UB ve UPF Tur 12'de DreamApply, bölüm siteleri ya da ulusal kataloglarla kapandı | Bir sonraki tur ya da yazılı teyit (karar notu ikinci tur §4) | https://en.unibs.it/ ; https://www.unifi.it/en | uni-it.json > UniBS, UniFi |
| IW-4 | İspanya'da yalnızca QEDU işaretine dayanan 'Yoruma açık' İngilizce hücreleri: UB, UAM, Navarra, IE (YL), UGR, UV, US, USAL, USC, UPV/EHU, Unizar. QEDU 'Idioma extranjero' işareti tam ve kısmi İngilizceyi ayırmıyor; tam İngilizce program sayısı üniversite sayfasından ya da e-postayla teyit edilmeli | Bir sonraki tur | https://www.ciencia.gob.es/qedu.html ; ilgili `url` alanları | uni-es.json |
| IW-5 | Padova'nın onay bekleyen 4 yeni İngilizce lisansı (2027/28): Management, Finance and Business Analytics; Physics for Technology; Food Safety for Global Health; Innovative Technologies in Agriculture | Ocak–Mart 2027 | https://www.unipd.it/en/corsi-laurea-lingua-inglese | uni-it.json > Padova |
| IW-6 | Campus France "Taught in English" kataloğunun 2027-28 güncellemesi (FR lisans/YL sayıları) | Ocak 2027 | https://tie-api.campusfrance.org/sgetprograms/1 | uni-fr.json |
| IW-7 | Fransa AB dışı harç tutarları 2027-28 (2026-27: licence 2.902 €, master 3.950 €) | Mayıs–Temmuz 2027 | https://www.campusfrance.org/en/tuition-fees-france | uni-fr.json > harcNotu |
| IW-8 | Toulouse III – Paul Sabatier'in kurumsal durumu ve İngilizce master sayısı. Tur 12 bulgusu: Parcoursup 2025 kurumu 'Université Toulouse III - Université Toulouse', Mon Master 2025 'Université Toulouse III - Paul Sabatier' adıyla ayrı kayıtla gösteriyor; site utoulouse.fr'ye yönleniyor. YL İngilizce hücresi hâlâ Doğrulanamadı | Bir sonraki tur | https://www.utoulouse.fr/en ; https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-mon_master/ | uni-fr.json > sira 15 |

*Durum notu (15 Ekim 2026, Ajan 13 batı grubu):*
- **DU-8:** PDF'in sürüm satırı okundu: "Stand: Oktober 2025". Yeni sürüm yok; madde kalır.
- **IT-1 / MS-5:** CISIA CEnT kuralları hâlâ 2025/26 sürümü (55 soru, 55 €, sınıf ya da mezun kısıtı yok). 31 Ekim'e kadar bekleniyor; madde kalır.

*Durum notu (16 Ekim 2026, Ajan 13, ilk-20 ikinci tur; ayrıntı: `.agents/mevzuat/karar-notu-2026-10-15-ilk20-ikinci-tur.md`):*
- **IW-3:** Kapandı ve listeden düşüldü. 17 üniversitenin tarayıcıda yüklenen listeleri gerçek tarayıcıyla okundu (Leiden, VU, TU/e, WUR, EUR, Radboud ve Tilburg için ulusal Studiekeuze123 kataloğu; KU Leuven, UGent, VUB, Uni Graz, Salzburg, UNIL, UNIGE, Basel, UMONS, UNamur, ULiège için üniversite katalogları ya da studyprogrammes.ch).
- **IW-2, IW-4, IW-8, IL-2, IL-3:** Daraltıldı (yukarıdaki satırlar). 161 açık hücreden 155'i kapandı; kalan 6 hücre: UniBS 4, UniFi lisans EN 1, Toulouse III YL EN 1.

## Tur 12 eklemeleri: sınavlar sayfası (15 ülke dil sınavları + GRE/GMAT)
*Ajan 13, 15–16 Ekim 2026. Ayrıntı: `.agents/mevzuat/karar-notu-2026-10-15-sinavlar-15-ulke.md`; veri: `.agents/mevzuat/dogrulama/sinavlar-tur12.json`. "Etkilediği" sütunu önerilen sinavlar.js id'sidir.*

| # | Ne bekleniyor | Beklenen tarih | Kontrol edilecek URL | Etkilediği (önerilen id) |
| :-- | :-- | :-- | :-- | :-- |
| SN-1 | DELE 2027 dönemleri ve TL ücretleri (Cervantes İstanbul; 2026 kayıtları 1 Aralık 2025'te açıldı) | Aralık 2026 | https://estambul.cervantes.es/tr/ispanyolca-sinavlari/dele/dele_sinav_ucretleri.htm | dele |
| SN-2 | Institut français İstanbul 2027 DELF/DALF takvimi ve ücretleri (2026 Şubat dönemi kaydı Aralık 2025'teydi) | Aralık 2026 | https://www.ifturquie.org/istanbul/sinav-ve-diplomalar/delf-dalf-2/ | delf-dalf |
| SN-3 | PLIDA 2027 sınav takvimi (sitede yalnız 2026 PDF'i var) | Kasım 2026 – Ocak 2027 | https://plida.dante.global/it | plida |
| SN-4 | CNaVT Mayıs 2027 dönemi tarihleri ve kayıt penceresi | Mart 2027 | https://cnavt.org/inschrijven | cnavt |
| PT-1 | PoliTo 2027/28 lisans çağrısı: yalnız TOLC@UNI / CEnT@UNI; TIL-I ve AB dışı kuralı (Tur 14 bulgusu, Teyit gerekir) | Aralık 2026 | https://www.polito.it/didattica/iscriversi-studiare-laurearsi/iscrizione/corsi-di-laurea/test-di-ammissione | til-i, it-tili |
| RUG-1 | Groningen Eylül 2028 girişi son günleri ve geç AP sonucu kuralı (K14-5) | Ekim 2027 (teyit e-postası hemen) | https://www.rug.nl/education/application-enrolment-tuition-fees/admission/procedures/non-dutch-qualification/bachelor-non-dutch-qualification | lis-nl-rug-ap, ap-physics-2 |
| SN-5 | Lehçe devlet sertifikası Nisan ve Kasım 2027 C1 oturumlarının merkez listesi (Türkiye var mı?) | Her oturumdan yaklaşık 2 ay önce (Şubat 2027, Eylül 2027) | https://certyfikatpolski.pl/category/osrodki/ (Cloudflare; tarayıcıdan elle) | certyfikat-polski |

*Durum notu (16 Ekim 2026):* Bu turda vadesi gelen madde yoktu. YL-1 (Jean Monnet "Clarifications") 16 Ekim 2026 kontrol edildi: yayımlanmış; madde kapatıldı. yl-genel.json > yl-genel-jm-aciklamalar maddesi "Doğrulandı"ya çevrilmeli (dil belgesi kuralları sinavlar-tur12.json > tur11Duzeltmeleri). IT-1/MS-5 (31 Ekim) ve DE-1 (Kasım ortası) henüz vadesinde değil.
