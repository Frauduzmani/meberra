# AP MEBERRA: Uluslararası Üniversite Hazırlık ve AP Master Protokolü (proje.md)
*Vibe Coding Yöntemiyle Geliştirilen Akıllı Öğrenci Mentörlük ve Yönetim Mimarisi*

---

## ★ GÜNCEL DURUM (her teslimde PM günceller — projenin son hali burada)

> **Kural (kullanıcı talimatı, 15 Ekim 2026):** Bu bölüm her eklemede güncellenir ve daima projenin SON halini gösterir. Tarihsel ayrıntı aşağıdaki tur bölümlerindedir (§26 Tur 10, §27 Tur 11 …). Her eklemede sürüm arşivi alınır (`SURUMLER.md`).

**Son güncelleme:** 20 Ekim 2026 (Tur 14) · **Güncel sürüm:** v14.10 (Tur 13 = v12.1 + v12.2; v13.x yok — §29.4) (`arsiv/surumler/`, liste `SURUMLER.md`) · **Ayrıntı:** §30 (Tur 14), §29 (Tur 13), §28 (Tur 12)

| Alan | Son hal |
| :--- | :--- |
| Öğrenci modelleri | **Lise öğrencisi (9–12) · Lise mezunu · Üniversite mezunu** (Avrupa'da yüksek lisans) |
| Ülkeler | **15 ülke, tüm modellerde serbest:** de it at ch nl be fr es se fi dk ie hu pl cz. Rozet: dk, ie "Teyit gerekir" |
| Eğitim dili | **İngilizce / yerel dil** seçmeli; maddeler `dil` etiketine göre süzülür (İrlanda'da yalnız İngilizce) |
| Mevzuat verisi | Lisans **610** madde · YL **455** madde (409 ülke + 46 genel) · ilk-20 Doğrulanamadı hücresi **0** · tek kaynak `data/mevzuat/kaynak/` → üretici `ulke-veri-olustur.js` → `data/mevzuat/ulke/<cc>.js` |
| Üniversite listeleri | **QS WUR 2027 ülke içi ilk 20:** 202 üniversite. **Üniversite İsterleri & Ders İstasyonu (Tur 13):** Her üniversite kartında gereken dil sınavları (IELTS/TOEFL/TestDaF) ve bilim sınavları (AP Calculus, AP Physics, AP Chemistry, AP CS A, TestAS, TOLC-I vb.) rozetlerle görünür; açılır ders istasyonu üzerinden doğrudan ilgili dersin **Konu Anlatımı**na ve **Deneme Sınavı**na geçiş sağlanır. |
| Sınavlar | **47 kayıt** (Doğrulandı 35 · Teyit gerekir 7 · Doğrulanamadı 0), 15 ülke, 12 dil; GRE 7 ülke: AP (Physics 2 dahil), giriş sınavları, dil sınavları, GRE/GMAT; durum → sınıf → ülke → dil süzgeci |
| Yazışmalar | 9 kişisel şablon (DE/IT) + **72 hazır teyit taslağı** (15 ülke, lisans/YL; kaynaklı alıcı 15, kaynaksız 0) + **İlk başvuru e-postası motoru (Tur 14, Ajan 14):** 36 İngilizce şablon (3 model × genel/DE/IT/NL/FR/SE × ilk iletişim/takip), profil + üniversite → hazır metin; 11 resmi yönergeye dayalı; arayüzü ekran planı A5'te |
| Sayfalar | `sartlar.html` seçicili (durum → sınıf → ülke → dil) + üniversite isterleri ve ders istasyonu · `universiteler.html` ilk 20 ve seçilmiş üniversiteler · `sinavlar.html` ve `yazismalar.html` 15 ülke · `deneme.html` doğrudan ders parametresiyle başlatma (`?ders=...`) · `ap-*.html` ders portalları |
| Calculus kaynakları | Resmi FRQ Arşivi (2025 + 2026 BC, 12 FRQ, 108 ölçüt) · hesap makinesi kartı · referans kitaplığı; PDF envanteri `kaynaklar/pdf/kaynak-listesi.json` (26 PDF; 7 ticari/yerel) |
| Profil | Şema v2: `ogrenciModeli`, `egitimDili`, en fazla 5 ülke, üniversite mezunu bilgileri; eski kayıtlar otomatik taşınır |
| Erişim (K4) | Şartlar, üniversiteler, sınavlar girişsiz açık; ders, soru, deneme, rota girişten sonra. Menü modele göre süzülür |
| Soru bankası | Portal **977** soru (Calculus 241 · Physics 1 161, 7/8 ünite · Chemistry 200, **9/9** · Biology 161, 7/8) · deneme havuzu **971** · seviye testi 153 |
| Denetimler | `pm-denetim` 977 soru 0 sorun · `ad-denetimi` 0 sorun |
| Testler | 13 Node birim testi (yeni: ilk-basvuru, toc, bugun 50) + 20 tarayıcı testi (yeni ilk-eposta 49, yanlislar 32; §30.6, §30.8, §30.10, §30.11) |
| Ajanlar | 14 ajan; yeni **Ajan 14 `eposta-uzmani`** (19 Ekim) |
| Ekran planı | **Öğrenci odaklı ekran planı onaylandı (20 Ekim):** 5 öğeli menü (Bugün · Hedefim · Çalış · Başvuru · Ben), telefonda alt gezinme, Sıradaki adım, Son tarihler, Yanlışlarım; A1–A7 aşama aşama (`.agents/rules/tur14-ogrenci-odakli-ekran-plani.md`). **Uygulanan: A1 menü (v14.2), A2 alt gezinme (v14.3), A3 Bugün (v14.4), A4 Hedefim (v14.5), A5 Başvuru + İlk e-posta arayüzü (v14.6), A6 Çalış merkezi `calis.html` (v14.8), A7 Yanlışlarım modu (v14.9)** — **7/7 aşama tamam** (§30.8, §30.10, §30.11) |
| Sürüm arşivi | `node araclar/surum-arsivle.js --not "..."` → `arsiv/surumler/`, günlük `SURUMLER.md` |

**Yaklaşan kritik tarihler:** 27 Ekim 2026 Jean Monnet son gün (YL) · 30 Kasım ETH (YL, yurt dışı lisans) · 1 Aralık PoliMi YL erken tur · 13 Kasım AP sınav kaydı · 15 Kasım BME / Padova YL 1. pencere · 15 Aralık Campus France DAP (lisans) · 15 Ocak 2027 İsveç (YL) · 31 Ekim CISIA kuralları.

**Kullanıcı kararı (20 Ekim, K14-5):** Groningen hedeflere eklendi (Physics / Applied Physics → AP Physics 2). Süresi dolan tarih silinmez, bir sonraki dönemin tarihiyle tutulur. **Ajan 13 (20 Ekim, §30.9):** RUG AB dışı adaydan şartları 1 Temmuz'a (koşullu kabulde vize nedeniyle 1 Haziran'a) kadar ister, AP puanları Temmuz'da gelir → **Physics 2 için Mayıs 2027 önerilir** (kullanıcı/pedagojik karar bekliyor); 13 Kasım 2026 kaçarsa 12 Mart 2027'ye kadar geç sipariş (+40 $).

**Sıradaki iş:** §30.7 — ekran planı A1 → A7 (v14.x), Physics 1 U8 · Biology U8 · Ajan 13 açıkları (§30.5).

**Kalıcı çalışma kuralları (kullanıcı talimatları):**
1. Her geliştirme `proje.md`'ye gerçek sayılarla işlenir; bu "Güncel Durum" bölümü her teslimde yenilenir.
2. Her eklemede sürüm arşivi alınır (`araclar/surum-arsivle.js`).
3. Her eklemede Ajan 11 (ekran) tüm ekran düzenini yeni eklemeye göre baştan planlar; yama yerine bilgi mimarisi yeniden kurulur.
4. PM Doğruluk Kapısı (`AGENTS.md` §2.1): kaynaksız bilgi yayına girmez.

---

## 0. PM DOĞRULAMA RAPORU VE ACİL EYLEMLER (7 Ekim 2026)

> [!CAUTION]
> **Bu bölüm, aşağıdaki eski bölümlerle çeliştiğinde geçerli olan bölümdür.** 7 Ekim 2026'da proje.md'deki iddialar resmi kaynaklardan (College Board, DAAD, uni-assist, CISIA, PoliMi, PoliTo, TÜBİTAK, bölgesel DSU kurumları) tek tek kontrol edildi. Ayrıntılı ve kaynaklı liste portalda **`bilgi-merkezi.html`** sayfasındadır.

### 0.1. Acil Takvim (tarih sırasıyla)
| Son Tarih | Ne Yapılmalı | Kaynak |
| :--- | :--- | :--- |
| **13 Kasım 2026** | 2027 AP sınav siparişi son günü. İstanbul'daki sınav merkezine (dış aday) kayıt **hemen** yapılmalı. Sınav başına 129 $; 14 Kasım 2026 – 12 Mart 2027 arası sipariş +40 $ geç ücreti. | apcentral.collegeboard.org (exam fees) |
| **26 Kasım / 17 Aralık 2026** | CEnT-S oturumları (55 €). **Mevzuat düzeltmesi (12 Ekim 2026):** Bu tarihler **2027/28 kaydı** için ilk makro dönem oturumlarıdır. CISIA kuralına göre bir CEnT yalnızca bir sonraki akademik yılın kaydında geçerlidir; Meberra'nın Padova 2028/29 başvurusu için **geçersizdir**. PoliMi için durum **Doğrulanamadı** (2027-28 çağrısı yayımlanmadı). Meberra'nın asıl CEnT-S dönemi Kasım 2027 – 2028. Bu oturumlara prova amacıyla girilip girilmeyeceği: **PM/aile kararı bekleniyor (Karar notu K3).** | https://apply.unipd.it/courses/course/182 · https://guide.cisiaonline.it/en/node/206 |
| **4 Ocak 2027** | TÜBİTAK 2204-A (58. dönem) başvuru son günü (başvurular 28 Eylül 2026'da açıldı). | tubitak.gov.tr |
| **2026-27 öğretim yılı** | **Mevzuat düzeltmesi (12 Ekim 2026):** PoliMi 2026-27 çağrısı Art. 3'e göre son sınıftan bir önceki yılda ≥75/100 ile erken kayıt **yalnızca İtalyanca programlar** içindir; İngilizce programlara "specific rankings" ile girilir (çağrı eşik vermiyor). 2026-27 çağrısındaki pencere 2025/26'da 11. sınıf olanlar içindi. Meberra'nın penceresini 2027-28 çağrısı belirleyecek: **Doğrulanamadı.** | https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf (Art. 3) |
| **3–14 Mayıs 2027** | AP sınavları (geç sınav haftası 17–21 Mayıs). Calculus AB/BC: 10 Mayıs; Physics 1: 5 Mayıs; Chemistry: 6 Mayıs; English Language ve CS A: 12 Mayıs. | apcentral.collegeboard.org (exam dates) |

### 0.2. Düzeltilen Kritik İddialar
| # | Eski İddia | Doğrulanmış Bilgi | Durum |
| :--- | :--- | :--- | :--- |
| 1 | Türk lise diploması + KMK 4 AP = Almanya'da doğrudan kabul ("altın anahtar"). | KMK/DAAD AP kuralı **ABD High School Diploma** için tanımlıdır. Türk diploması için resmi yol (anabin TUR-BV05): YKS'de ilgili puan türünde **180'in üzerinde puan** ve **en az 4 yıllık örgün bir lisans programına yerleşmek**; bu yol yalnızca **yerleşilen alan ve komşu alanlar** için doğrudan giriş verir (uni-assist "Yerleştirme Sonuçları" belgesini ister). **12 Ekim 2026 düzeltmesi:** Yerleşme yoksa Studienkolleg yolu da yoktur (tek istisna: Meslek Yüksekokulunda 1 yıl → yalnızca FH Studienkolleg'i, TUR-BV07). Türk diploması + AP için anabin'de kural yok. AP'ler yine de değerli: test hazırlığı ve rekabetçi profil. | ⚠️ Resmi dayanak yok (Doğrulandı — https://anabin.kmk.org): hedef üniversite + uni-assist ile yazılı teyit önerilir |
| 2 | AP Physics 1 Unit 3 = Circular Motion & Gravitation; FRQ'da Paragraph-Length Response var. | Güncel CED: Unit 3 = **Work, Energy, and Power**; dairesel hareket ve kütleçekim Unit 2 içinde (2.6, 2.9); **Unit 8 Fluids** eklendi; PLR kaldırıldı. Yeni FRQ türleri: MR, TBR, LAB, QQT. Sınav: 42 MCQ/85 dk + 4 FRQ/95 dk. | ❌ Düzeltildi (portal güncellendi) |
| 3 | APID, uluslararası lise diploması eşdeğeridir. | College Board: APID "lise diplomasının yerine geçmez". Koşul: 5 AP'de 3+, **iki farklı dilde** dil sınavı dahil. | ❌ Düzeltildi |
| 4 | English TOLC-I geçerli. | **CEnT-S** English TOLC'un yerini aldı (4 Kasım 2025). Güncel yapı: 65 soru, 140 dk, doğru +1 / yanlış −0,25; ücreti 55 €. | ✅ Güncellendi |
| 5 | PoliMi: SAT toplam 1240; IELTS ile OFA English muafiyeti; İtalyanca şartı yok. | SAT'ta yalnızca **her bölümde en az 620** şartı var. OFA English yalnızca İtalyanca programlar için geçerli. İngilizce programlarda **İtalyanca OFA** verilir: mezuniyetten önce İtalyanca B2 gerekir. | ❌ Düzeltildi |
| 6 | PoliTo TIL-I 60/100 garantili kabul; SAT 1250+. | 60/100 garantili kabul **doğru** (sıralama eşiği 30/100). SAT için her bölümde 650 gerekir ve SAT ile garantili kabul yoktur. Vize gerektiren adaylar için son TIL oturumu Mayıs sonunda. "AP Calculus kredi muafiyeti" doğrulanamadı. | ✅/❌ Kısmen |
| 7 | TUM harcı 2.000–3.000 €/dönem; KIT ve Freiburg harçsız. | TUM: **Kış 2027/28'den itibaren yeni kayıtlara 2.300 / 3.400 €/dönem**. Baden-Württemberg (KIT, Freiburg) AB dışı öğrencilere **1.500 €/dönem** harç uygular. | ❌ Düzeltildi |
| 8 | DSU bursu yıllık 8.000–8.500 €; tek ISEE tavanı 26.887,93 €; Türk öğrencilerin %90'ı hak kazanır. | Tavan bölgeye göre değişir: Lombardiya ISEE 26.887,93 € / ISPE 58.452,06 € (fuori sede ort. ~7.172 €); Piemonte ISEE 26.306,25 € (fuori sede ~8.097 €'ya kadar). "%90" iddiasının kaynağı yok. | ⚠️ Kısmen |
| 9 | TÜBİTAK 2204-A: öncelikli alanlar; doğrudan EUCYS/ISEF; bütçe desteği. | 2204-A bir **yarışmadır**: bütçe desteği vermez, öncelikli alanı yoktur. Uluslararası yarışmaya gidecek projeler, ilk üçe girenler arasından ayrı bir jüriyle seçilir. | ❌ Düzeltildi |
| 10 | DAAD lisans bursu; FES 300–934 €. | DAAD'ın tam lisans bursu yok. FES bursu DSH-2 Almanca şartı ister. Deutschlandstipendium: aylık 300 € (doğru). | ❌ Düzeltildi |
| 11 | Erasmus+ KA152'ye Meberra başvurur. | Bireyler başvuramaz; başvuruyu kuruluş veya gayriresmi gençlik grubu yapar (temsilci 18+). Meberra yalnızca katılımcı olabilir (13–30 yaş). | ❌ Düzeltildi |
| 12 | Sperrkonto 11.904 € (aylık 992 €). | Şu an doğru. 2028'de artmış olması muhtemel, bütçe tampon payıyla planlanmalı. | ✅ Doğru (şimdilik) |
| 13 | Almanya "İlk 20 %100 İngilizce mühendislik" listesi (29 program). | Programların çoğu Almanca, kapanmış (ör. UDE Computer Eng. ISE, HSRW Mechanical/EEE) ya da yalnızca yüksek lisans düzeyinde İngilizce. Yerine resmi sayfalarla doğrulanmış **15 programlık liste** kondu (§5.2). | ❌ Düzeltildi |
| 14 | İtalya "İlk 20" listesi; her yerde TOLC-I. | Pisa, Floransa, Roma Tre, Bari, Trieste, UNIMORE, Brescia, Salerno ve Pavia ECE için İngilizce mühendislik lisansı yok. Sınav yolu programa göre değişiyor: TIL-I, CEnT-S, kendi sınavı ya da SAT. Yerine **10 programlık doğrulanmış liste** kondu (§6.2). | ❌ Düzeltildi |
| 15 | %100 İngilizce programlarda Almanca hiç gerekmez. | DIT AI (mezuniyete kadar A2), TH Rosenheim (A2), TUM Information Engineering (Almanca sertifika). **Almanca A2–B1 hedefi plana eklenmeli.** Bavyera'da AB dışı öğrenciler dönem başına hizmet ücreti öder. | ❌ Düzeltildi |

### 0.3. Soru Bankası Gerçek Durumu
Önceki sürümde her ünite için "250+ soru — Tamamlandı" yazıyordu. 7 Ekim 2026 sayımında portallarda toplam **~105 soru** vardı (ünite başına 8). "250+" bir **hedeftir**; tamamlanma durumu artık §14.1'deki gerçek soru sayılarıyla raporlanır. Ayrıca eski 88 sorunun tamamında doğru şık "A" idi; dağılım dengelendi. Kaynak etiketlerindeki "College Board Official Exam" ibareleri, sorular özgün olduğu için `AP-style original (CED Topic x.y)` olarak düzeltildi.

---

## 1. VİZYON VE ÖĞRENCİ PROFİLİ

### 1.1. Öğrenci Tanımı
- **İsim:** Meberra
- **Konum / İkametgah:** **İstanbul, Türkiye**
- **Akademik Düzey:** 11. Sınıf Lise Öğrencisi (Türkiye MEB / Anadolu Lisesi veya Özel Lise Müfredatı)
- **Hedef Coğrafya:** **Almanya** ve **İtalya** seçkin araştırma ve teknik üniversiteleri
- **Hedef Alan:** **Mühendislik Fakülteleri** (Bilgisayar Mühendisliği / AI, Makine, Biyomedikal, Elektrik-Elektronik, Mekatronik, Robotik)
- **Eğitim Dili Tercihi:** **%100 İngilizce Lisans Programları (Strict English-Taught Bachelor Degrees)**. Meberra tüm üniversite lisans eğitimini İngilizce dilinde tamamlayacaktır. Bu sebeple Almanca (Goethe/TestDaF) veya İtalyanca dil sınavı zorunluluğu bulunmayan; doğrudan **IELTS Academic (7.0 - 7.5) / TOEFL iBT (95 - 105)** ve **AP / TOLC-I / TIL-I** ile doğrudan kabul veren uluslararası programlar önceliklendirilmiştir.
- **Zaman Çizelgesi:** 2 Yıllık Entegre Strateji (11. Sınıf: 2026-2027 Temel & İlk AP Fazı | 12. Sınıf: 2027-2028 İleri Düzey AP'ler, Dil Yeterlilikleri ve Üniversite Başvuru Portalları)

---

## 2. HEDEF ÜLKE KABUL MEVZUATI VE AP ZORUNLULUKLARI

### 2.1. Almanya Üniversitesi Kabul Kriterleri (KMK & Anabin Yönergesi)
Almanya Eyaletleri Eğitim ve Kültür Bakanları Konferansı (**KMK - Kultusministerkonferenz**) ve **Anabin** veri tabanı kararlarına göre, 12 yıllık Türk lise diploması doğrudan Alman üniversitelerine giriş hakkı (*Direkter Hochschulzugang*) vermez. AP'nin bu süreçteki rolü aşağıdaki PM düzeltmesiyle birlikte okunmalıdır.

> [!WARNING]
> **PM Düzeltmesi (7 Ekim 2026):** Aşağıdaki KMK 4 AP kuralı, resmi kaynaklarda (DAAD, uni-assist, KMK) **ABD High School Diploma** sahipleri için tanımlıdır. Türk lise diploması için resmi doğrudan giriş yolu, **YKS'yi geçip bir lisans programına yerleşmektir**. Türk diploması ile AP'yi birleştiren resmi bir düzenleme bulunamamıştır. Bu strateji, hedef üniversiteden ve uni-assist'ten **yazılı teyit alınmadan** kesin kabul edilmemelidir. ABD diploması sahipleri için MINT alanında kural şudur: Calculus AB/BC + 1 doğa bilimi (Biology, Chemistry ya da Physics C Mech + E&M) + 1 dil + 1 ek AP, her birinden 3+.

> [!IMPORTANT]
> **Mevzuat düzeltmesi (12 Ekim 2026, Karar notu `.agents/mevzuat/karar-notu-2026-10-12.md`):** YKS her iki ülke için zorunlu belgedir. **Almanya:** anabin TUR-BV05'e göre Türk lise diploması + YKS'de ilgili puan türünde 180'in üzerinde puan + en az 4 yıllık örgün bir lisans programına **yerleşme** → yalnızca yerleşilen alan ve komşu alanlar için doğrudan giriş. Yerleşme yoksa Studienkolleg yolu da yoktur (tek istisna: Meslek Yüksekokulunda 1 yıl → yalnızca FH Studienkolleg'i, TUR-BV07). **İtalya:** YKS sonuç belgesi (sınavı geçmiş olmak) istenir; yerleşme şartı yoktur (MUR genelgesi 2026-27/2027-28). Kaynak: https://anabin.kmk.org · https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/tr/ · https://www.unife.it/it/internazionale/venire/iscriversi/informazioni/circolare_2026-2027_studenti_internazionali.pdf. Almanya stratejisinin dayanağı (YKS yolu / İtalya'nın ana hedef olup olmayacağı): **PM/aile kararı bekleniyor (Karar notu K1).**

#### KMK 4 AP Sınavı Kuralı — anabin USA-BV07 (yalnızca ABD High School Diploma ile birlikte; Türk diplomasına uygulanmaz), her birinden en az 3:
1. **Matematik Şartı:** AP Calculus AB veya AP Calculus BC.
2. **Doğa Bilimi Şartı:** AP Biology, AP Chemistry ya da **AP Physics C: Mechanics + Physics C: E&M birlikte**. **Physics 1 / Physics 2 fen dersi olarak sayılmaz.** (Kaynak: anabin USA-BV07, https://anabin.kmk.org)
3. **Dil Şartı:** AP English Language, AP English Literature, AP French, AP Spanish, AP Latin ya da AP German.
4. **Ek Ders Şartı:** "Lise üst kademesine uygun ek ders" — ör. European/World/US History, Computer Science A ya da **Macroeconomics + Microeconomics birlikte** (her biri 0,5). (Kaynak: anabin USA-BV07; DAAD Zulassungsdatenbank https://www.daad.de/de/in-deutschland-studieren/voraussetzungen/zulassungsdatenbank/?ad-layer=5&ad-layerId=417)
- Tüm AP'ler lise bitmeden alınmış olmalıdır. anabin sertifika notu: AP belgesi tek başına giriş hakkı vermez.
- **Dil Koşulu (%100 İngilizce Programlar İçin):** Yalnızca **IELTS Academic 6.5 - 7.5 / TOEFL iBT 90 - 105**. Meberra %100 İngilizce lisans okuyacağı için Goethe C1 veya TestDaF gibi Almanca dil yeterlilik sınavlarına girmesine gerek YOKTUR.
- **Başvuru Portalı:** **uni-assist** ve üniversite doğrudan başvuru sistemleri. VPD'yi yalnızca bazı üniversiteler ister; karar üniversitenindir (https://www.uni-assist.de/en/how-to-apply/plan-your-application/vpd/).

### 2.2. İtalya Üniversitesi Kabul Kriterleri (MIUR & Cimea Yönergesi)
İtalya Eğitim ve Araştırma Bakanlığı (**MIUR**) mevzuatına göre:
- Türk lisesi 12 yıllık eğitime karşılık geldiği için temel başvuru hakkı mevcuttur. (PM notu: PoliTo ve PoliMi, adayın ülkesinde ulusal giriş sınavı varsa onun belgesini isteyebilir. Bu yüzden YKS İtalya için de önemlidir.)
- **AP'nin İtalya'daki rolü (Mevzuat düzeltmesi, 12 Ekim 2026):** Türk diploması sahibi için AP **ne kabul şartı ne de resmi avantajdır**. PoliMi'nin sıralaması yalnızca test puanına dayanır (TOL ya da çevrilmiş alternatif test puanı; eşitlikte matematik bölümü — 2026-27 çağrısı Art. 6.2). PoliTo'da AP yalnızca ABD diploması sahiplerinin giriş şartıdır (3 AP; 2026-27 çağrısı Ek B/C). "Ek sıralama puanı / kredi muafiyeti / kabul önceliği" iddiası kaldırıldı. Dolaylı fayda: test hazırlığı ve profil. Kaynak: https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf · https://www.polito.it/sites/default/files/2025-12/Call%20for%20applications%20for%20admissions%20Engineering%20_%20LP%202026-27.pdf
- **İtalya'da istenen belgeler (MUR genelgesi 2026-27/2027-28):** 12 yıllık diploma, **YKS sonuç belgesi**, CIMEA belgesi ya da Dichiarazione di valore (üniversite belirler), üniversitenin giriş testi (TIL-I, TOL, CEnT-S ya da SAT). Meberra'nın yılı (2028/29) için yeni MUR genelgesi gerekecek.
- **Giriş Sınavı:** **TOLC-I** (İngilizce Online Mühendislik Sınavı - CISIA) veya Politecnico di Torino'nun kendi sınavı **TIL-I** (veya SAT 1250+).
- **Başvuru Portalı:** **Universitaly** ön kayıt sistemi ve CIMEA Denklik Belgesi (Statement of Comparability).
- **Ekonomik Fırsat (DSU Bursu):** Gelir durumuna göre yıllık 7.000€ - 8.500€ karşılıksız burs, ücretsiz yurt ve tam üniversite harç muafiyeti.

---

## 3. İSTANBUL AP SINAV MERKEZLERİ, TAKVİM VE SINAV GÜNÜ YÖNERGESİ

### 3.1. Meberra İstanbul'da Nerede ve Ne Zaman Sınava Girecek?
Meberra lisesinde AP açılmasa dahi, College Board onaylı **Dışarıdan Aday Kabul Eden (Open Test Center)** liselerde sınava girebilir.

> [!WARNING]
> **PM Doğrulama Notu (7 Ekim 2026):** Aşağıdaki okul listesinin dış adaylara sınav yaptırdığı **resmi bir kaynakla doğrulanmadı.** College Board'un resmi süreci şöyle:
> 1. AP Course Ledger'da İstanbul'daki AP okullarını bul, AP koordinatörlerini ara ve dış aday kabul edip etmediklerini sor. Okulların kendi iç son tarihleri 13 Kasım'dan önce olabilir.
> 2. Koordinatör sınavı sipariş eder ve 6 karakterlik **join code** verir. Bu kodla My AP'de "exam only" bölümüne katılınır.
> 3. Okul bulunamazsa College Board'un Türkiye için listelediği **yetkili test merkezi Prometric**'tir (prometric.com/exams/cbaptr); koşullar ve ücretler oradan teyit edilmelidir.
> Kaynaklar: apstudents.collegeboard.org/help-center/im-homeschooled-how-can-i-take-ap-exam · …/can-i-sign-ap-exam-if-i-dont-live-united-states

#### İstanbul'da AP Okulu Olarak Bilinen Kurumlar (dış aday kabulü her okulla ayrıca teyit edilmeli):
1. **Hisar Okulları (Göktürk / Eyüpsultan):** Türkiye'nin en köklü ve en büyük AP test merkezlerinden biridir. Dışarıdan öğrenci kaydı alır.
2. **MEF Okulları (Ulus / Beşiktaş):** MEF Ulus kampüsü her yıl düzenli dış aday kabul eden resmi merkezdir.
3. **Bilfen Liseleri (Çamlıca & Ataşehir):** Anadolu ve Avrupa yakasında geniş Bluebook altyapısına sahip yetkili merkez.
4. **Koç Lisesi (Tuzla):** Anadolu yakasında geniş kapasiteli uluslararası sınav merkezi.
5. **Açı Okulları (Sarıyer / Bahçeköy):** Avrupa yakasında düzenli AP oturumları düzenler.
6. **Eyüboğlu Koleji (Ümraniye):** Anadolu yakasında yetkili sınav merkezi.
7. **Özel SEV & Üsküdar Amerikan Lisesi:** AP sınav kayıt dönemlerinde dış aday kontenjanı açabilmektedir.

### 3.2. Sınav Takvimi
*(PM tarafından 7 Ekim 2026'da College Board kaynaklarıyla güncellendi; ayrıntılar `data/sinav-takvimi.js` dosyasında.)*
- **13 Kasım 2026 (23:59 ET):** Sınav siparişi son günü. Sınav başına 129 $.
- **14 Kasım 2026 – 12 Mart 2027:** Geç sipariş; sınav başına +40 $. İptal edilen ya da girilmeyen sınav için 40 $.
- **22 Ocak 2027:** Engelli öğrenci düzenlemeleri (SSD) başvurusu son günü.
- **3–14 Mayıs 2027:** Sınavlar. Türkiye (UTC+3) için Session 1 saat 10:00, Session 2 saat 14:00; kesin saat sınav merkezinden teyit edilmeli.
  - Biology: 3 Mayıs, Session 2.
  - Physics 1: 5 Mayıs, Session 2.
  - Chemistry: 6 Mayıs, Session 2.
  - Calculus AB/BC: 10 Mayıs, Session 1.
  - English Language: 12 Mayıs, Session 1.
- **17–21 Mayıs 2027:** Geç sınav haftası (yalnızca geçerli mazeretle).
- **20 Haziran 2027:** Ücretsiz puan gönderimi için üniversite seçme son günü.
- **Temmuz 2027:** Puanlar açıklanır (kesin gün henüz duyurulmadı).

### 3.3. Sınav Günü Yanında Bulundurulması Zorunlu Olanlar (Bilfen Kılavuzu)
- **Cihaz:** Bluebook uygulaması önceden yüklenmiş ve sınav kurulumu (Exam Setup) 1-3 gün önce tamamlanmış şarjı tam kişisel laptop (Windows/Mac) veya iPad + Orijinal Şarj Cihazı.
- **Kimlik:** Fotoğraflı ve geçerli T.C. Kimlik Kartı veya Pasaport.
- **Yazı Gereçleri:** 2 adet yumuşak uçlu kurşun kalem ve silgi; 2 adet siyah veya lacivert tükenmez kalem (Hibrit FRQ kitapçığı el yazısı için zorunlu).
- **Hesap Makinesi (PM düzeltmesi, College Board 2027 politikası):**
  - **Calculus AB/BC:** Hesap makineli bölümlerde grafik hesap makinesi zorunlu (Part B MCQ, Part A FRQ). Bluebook'taki Desmos yalnızca bu bölümlerde açılır.
  - **Physics 1 ve Chemistry:** Dört işlemli, bilimsel ya da grafik hesap makinesi kullanılabilir. Bluebook'taki Desmos da açıktır.
  - **Biology:** 2027 sınavlarında **grafik hesap makinesi YASAK**. Yalnızca dört işlemli (karekök tuşlu) ya da bilimsel hesap makinesi kullanılabilir.
  - Kaynak: apstudents.collegeboard.org/exam-policies-guidelines/calculator-policies
- **Giriş Belgesi:** MyAP portalından alınan fotoğraflı AP Sınav Giriş Belgesi (AP Exam Ticket). *(PM notu: Bluebook'un resmi sayfası "exam setup + admission ticket" adımlarını yalnızca SAT için tarif ediyor. AP için hangi ön hazırlığın gerektiğini sınav koordinatörüne sorun.)*
- **Cihaz gereksinimleri (doğrulandı):** Windows 11 24H2, macOS 15 ya da iPadOS 18 ve üzeri. Kişisel Chromebook ve telefon kabul edilmez. Pil 3–4 saat dayanmalı. Kaynak: bluebook.collegeboard.org
- **Yasaklar:** Akıllı saat, cep telefonu, bluetooth kulaklık salona alınmaz; özel kilitli poşetlere teslim edilir.

---

## 4. ALTERNATİF SINAV MODELLERİ VE HEDEF ODAKLI KIYASLAMA

Meberra'nın hedefi olan Almanya ve İtalya mühendislik programları için AP dışında masada olan alternatif sınav modelleri:

| Sınav Türü | Ne İşe Yarar? | Almanya Geçerliliği | İtalya Geçerliliği | Meberra İçin Stratejik Öneri |
| :--- | :--- | :--- | :--- | :--- |
| **AP (Advanced Placement)** | Üniversite seviyesi ders tamamlama | **12 Ekim 2026 düzeltmesi:** Türk diplomasıyla giriş hakkı sağlamaz (KMK/anabin AP kuralı USA-BV07 yalnızca ABD diploması için; https://anabin.kmk.org) | Kabul şartı değil, resmi avantajı yok (PoliMi çağrısı Art. 6.2; PoliTo Ek B/C) | Profil gücü ve test hazırlığı; ders seçimi için **PM/aile kararı bekleniyor (Karar notu K2)** |
| **TOLC-I (English)** | İtalya mühendislik giriş sınavı | Geçerli değil | **PoliMi, Sapienza, Bologna için ZORUNLU** | **11. Sınıf baharında girilmeli** |
| **TIL-I** | Politecnico di Torino sınavı | Geçerli değil | **PoliTo Mühendislik için ZORUNLU** | **PoliTo düşünülüyorsa girilmeli** |
| **TestAS (Engineering)** | Yabancı öğrenciler için akademik yetenek | **RWTH Aachen, TUM vb. ek puan/şart koşar** | Geçerli değil | **12. Sınıf başında girilmeli** |
| **SAT (Scholastic Aptitude)** | Matematik ve okuma genel sınavı | Tek başına doğrudan kabul SAĞLAMAZ | PoliMi, Bocconi ve Roma alternatif kabul yolu | AP Calculus alan öğrenci SAT Matematikten 800 alır |
| **IELTS Academic** | Uluslararası İngilizce dil yeterliliği | İngilizce bölümler için zorunlu (Min 6.5 - 7.5) | İngilizce bölümler için zorunlu (Min 6.5) | **11. Sınıf sömestrinde 7.5+ alınmalı** |
| **Goethe-Zertifikat (B2/C1)** | Almanca dil yeterliliği | Sadece Almanca lisanslar için zorunlu | Geçerli değil | **MEBERRA İÇİN GEREKSİZ (%100 İngilizce lisans hedeflendiği için sadece IELTS 7.5 gerekir)** |
| **FSP (Feststellungsprüfung)**| Studienkolleg bitirme sınavı | Doğrudan kabul sağlayamayanlar için hazırlık | Geçerli değil | **12 Ekim 2026 düzeltmesi:** 12 yıllık genel lise mezunu YKS'de lisans programına yerleşmezse anabin'de Studienkolleg yolu da yoktur (tek istisna: MYO'da 1 yıl → yalnızca FH Studienkolleg'i, TUR-BV07). AP, FSP'nin yerine geçmez. Kaynak: https://anabin.kmk.org |

---

## 5. ALMANYA İLK 20 %100 İNGİLİZCE MÜHENDİSLİK ÜNİVERSİTESİ YOL HARİTASI

> [!IMPORTANT]
> **%100 İngilizce Lisans (English-Taught Bachelor) İlkesi:**
> Meberra'nın tüm lisans eğitimi İngilizce dilinde yürütülecektir. Bu doğrultuda Almanya Federal Akademik Değişim Servisi (**DAAD**) veri tabanı filtrelenerek hazırlanan aşağıdaki 20 üniversite ve program, **Almanca dil sınavı (Goethe C1 / TestDaF) şartı aramaksızın**, yalnızca **IELTS Academic (6.5 - 7.5)** ve **KMK 4 AP** sınavı ile %100 İngilizce eğitim vermektedir.
> **Mevzuat düzeltmesi (12 Ekim 2026):** "KMK 4 AP ile kabul" ifadesi Türk diploması için geçersizdir (anabin USA-BV07 yalnızca ABD diploması). Türk adayın giriş hakkı: Lise Diploması + YKS'de lisans programına yerleşme (TUR-BV05), alana bağlı. Kaynak: https://anabin.kmk.org

### 5.1. Adım Adım Başvuru Sırası
1. **1. Adım (11. ve 12. Sınıf):** KMK uyumlu 4 AP sınavından (Calculus BC, Physics C (Mech + E&M) ya da Chemistry, English Lang, CS A) en az 3 ve üzeri skor almak. **Not (12 Ekim 2026):** Bu KMK kuralı (anabin USA-BV07) ABD diploması için tanımlıdır ve **Türk diplomasına uygulanmaz**; Türk diplomasıyla giriş hakkı YKS'de lisans programına yerleşmeyle doğar (TUR-BV05). Kaynak: https://anabin.kmk.org. Fen dersi seçimi (Physics C ya da Chemistry): **PM/aile kararı bekleniyor (Karar notu K2).**
   - **YKS adımı (olgusal):** Haziran 2028 YKS'de ilgili puan türünde 180'in üzerinde puan ve en az 4 yıllık örgün bir mühendislik lisans programına yerleşme (alana bağlı giriş). YKS'nin plandaki yeri ve Almanya'nın öncelik sırası: **PM/aile kararı bekleniyor (Karar notu K1).**
2. **2. Adım (11. Sınıf Bahar - Yaz):** **IELTS Academic sınavından en az 7.0 - 7.5** (veya TOEFL iBT 95-105) sertifikası almak. (Almanca dil sınavı gerekmez!).
3. **3. Adım (12. Sınıf Güz):** Mühendislik modülü içeren **TestAS** sınavına İngilizce dilinde girmek (Özellikle KIT, Aachen ve TUM gibi üniversitelerde kabul şansını zirveye taşır).
4. **4. Adım (2028):** **uni-assist** belgeleri: Lise Diploması + YKS "Yerleştirme Sonuçları" (+ varsa üniversite transkripti), yalnızca Türkiye'deki yeminli tercüman çevirisiyle. VPD'yi yalnızca bazı üniversiteler ister; karar üniversitenindir, ülkenin değil. AP, giriş hakkı belgesi değildir. Kaynak: https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/tr/ · https://www.uni-assist.de/en/how-to-apply/plan-your-application/vpd/
5. **5. Adım (Haziran - 15 Temmuz 2028):** Üniversitelerin kendi başvuru portallarından nihai %100 İngilizce lisans başvurusunu göndermek.
6. **6. Adım (Temmuz - Ağustos 2028):** Kabul belgesiyle birlikte Alman Konsolosluğu vize başvurusu için Bloke Hesap (*Sperrkonto* - yaklaşık 11.904€) açmak ve ulusal vizeyi almak.

### 5.2. Almanya — Doğrulanmış %100 (veya Ağırlıklı) İngilizce Mühendislik Lisansları (PM Onaylı, 7 Ekim 2026)

> [!CAUTION]
> **Önceki "İlk 20" listesi kaldırıldı.** 7 Ekim 2026'da resmi üniversite sayfalarıyla yapılan kontrolde 29 programdan çoğunun **Almanca**, **kapanmış** ya da yalnızca **yüksek lisans** düzeyinde İngilizce olduğu görüldü. Kaldırılanlar: UDE Computer Eng. ISE (kapandı), HSRW Mechanical/EEE (kapanıyor), DIT Mechatronics ve Cyber Security, HS Bremen, Frankfurt UAS, HS Anhalt, FH Südwestfalen, TUHH Data Science, Freiburg, TU Darmstadt, RUB, Siegen, Constructor Software Eng.
> **Genel koşullar (tüm satırlar için geçerli):**
> 1. **Kabul yolu (12 Ekim 2026 düzeltmesi).** Türk diploması + AP ile doğrudan giriş için anabin'de kural yok (Doğrulandı). YKS + lisans programına yerleşme **yedek değil, anabin'deki tek resmi yoldur** (TUR-BV05, alana bağlı). Kaynak: https://anabin.kmk.org. Strateji: **PM/aile kararı bekleniyor (Karar notu K1).**
> 2. **"Tamamen İngilizce" programların bir kısmı Almanca istiyor.** Bunlar DIT AI (mezuniyete kadar A2), TH Rosenheim (A2), TUM (Almanca sertifika) ve Schmalkalden (zorunlu Almanca modülü). Meberra'nın planına **Almanca A2–B1** hedefi eklenmelidir.
> 3. **Bavyera ve Baden-Württemberg harçsız değil.** AB dışı öğrenci harcı: TUM dönem başına 2.000–3.400 €; DIT ve Rosenheim'da dönem başına hizmet ücreti; KIT dönem başına 1.500 €.

| # | Üniversite | Program | Dil | Kabul Yolu | Dil Şartı | Harç (AB dışı) | Durum | Resmi Kaynak |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Saarland University | Computer Science B.Sc. | Tam İngilizce | Olympiad / Aptitude / Interview yolları; son başvuru 15 Temmuz | İngilizce yeterlilik | Harçsız | ✅ Doğrulandı | uni-saarland.de/en/study/programmes/bachelor/computer-science.html |
| 2 | FAU Erlangen-Nürnberg | Artificial Intelligence B.Sc. | Tam İngilizce (bazı dersler Almanca da sunulabilir) | Uygunluk değerlendirmesi | İngilizce yeterlilik | Bavyera harç kuralına tabi | ✅ Doğrulandı | fau.eu/degree-program/artificial-intelligence-b-sc/ |
| 3 | DIT Deggendorf | Artificial Intelligence B.Sc. (7 dönem) | Tam İngilizce | Kabul sınavı (analiz, lineer cebir, olasılık, mantık, bilgisayar bilimi + kısa essay); başvuru 15 Nis–15 Haz | İngilizce B2; **mezuniyete kadar Almanca A2** | AB dışı öğrencilere dönem başına hizmet ücreti | ✅ Doğrulandı (PM örneklemi) | th-deg.de/ain-b-en |
| 4 | TH Rosenheim | Applied Artificial Intelligence B.Sc. (7 dönem) | Tam İngilizce | Kontenjansız | IELTS 6.0 / TOEFL 72; **Almanca A2** | Dönem başına hizmet ücreti | ✅ Doğrulandı | th-rosenheim.de (Applied AI) |
| 5 | TUHH Hamburg | **Engineering Science B.Sc.** (7 dönem; eski listedeki "International Engineering Tracks" bu) | İngilizce uzmanlık seçilebilir | Kontenjanlı; başvuru 1 Haz–15 Tem; yalnızca kış başlangıcı | IELTS 6.5 / TOEFL 90; Almanca şartı yok | Harçsız | ✅ Doğrulandı | tuhh.de (Engineering Science) |
| 6 | Hochschule Rhein-Waal | **Engineering B.Sc.** (robotik, elektronik, ICT, ürün geliştirme) | Tam İngilizce | Kontenjansız; son başvuru 15 Temmuz | B2 (resmi sayfada eşik yok) | Harçsız | ✅ Doğrulandı (yeni) | hochschule-rhein-waal.de (Engineering B.Sc.) |
| 7 | Hochschule Hamm-Lippstadt | Electronic Engineering B.Eng. | Tam İngilizce | Kontenjansız | IELTS 6.0 / TOEFL 80 | Harçsız | ✅ Doğrulandı (yeni) | hshl.de/en/studying/en-study-programs/en-bachelors-programs/en-electronic-engineering/ |
| 8 | KIT (Carl Benz School) | Mechanical Engineering (International) B.Sc. | Tam İngilizce | SAT, ACT ya da TestAS (Engineering, %75'lik dilim) | İngilizce B2 | **Dönem başına 1.500 €** | ⚠️ Kısmen | carlbenzschool.kit.edu/admission-requirements.php |
| 9 | TUM (Heilbronn) | Information Engineering B.Sc. | Ağırlıklı İngilizce (bazı seçmeliler Almanca) | Yetenek değerlendirmesi (aptitude assessment); başvuru 15 May–15 Tem | İngilizce + **Almanca sertifika zorunlu** | Kış 2027/28'den itibaren dönem başına 2.300 / 3.400 € | ⚠️ Kısmen | tum.de (Information Engineering Heilbronn) |
| 10 | TUM | Management & Technology B.Sc. | İngilizce + Almanca | Yetenek değerlendirmesi | Almanca veya İngilizce | Aynı | ⚠️ Kısmen | tum.de (Management and Technology) |
| 11 | THWS Schweinfurt | Robotics B.Eng. (TWIN) | Almanca/İngilizce paralel modüller | — | — | — | ⚠️ Kısmen (tamamen İngilizce bitirilebileceği teyit edilmedi) | iro.thws.de/studieninteressierte/twin-studiengang-robotik/ |
| 12 | HS Schmalkalden | Mechatronics & Robotics B.Eng. | Tam İngilizce + zorunlu Almanca modülü | **Yalnızca Nisan başlangıcı** (başvuru 1 Eyl–15 Kas) | IELTS 6.5 / TOEFL 86 | Harçsız (dönem ücreti ~304 €) | ⚠️ Takvim Eylül 2028 hedefine uymuyor | hs-schmalkalden.de (Mechatronics and Robotics) |
| 13 | UDE Duisburg-Essen | Mechanical Engineering ISE B.Sc. | 1. yıl İngilizce, sonrası Almanca | uni-assist | Almanca B1 giriş / B2 mezuniyet | Harçsız | ⚠️ Tamamen İngilizce değil | uni-due.de/studienangebote/studiengang.php?id=68 |
| 14 | Constructor University (özel) | Computer Science B.Sc. | Tam İngilizce | SAT/ACT isteğe bağlı; diploma yetmezse SAT veya kendi sınavı | IELTS 6.5 / TOEFL 90 | **Yılda ~23.850 €** (en fazla 10.000 € burs) | ✅ Doğrulandı | constructor.university (Computer Science) |
| 15 | Constructor University (özel) | Robotics and Intelligent Systems B.Sc. | Tam İngilizce | Aynı; 2027 erken başvuru 1 Eki 2026 – 1 Şub 2027 | Aynı | Aynı | ✅ Doğrulandı | constructor.university (Robotics and Intelligent Systems) |

**İncelenmesi önerilen ek adaylar** (resmi listede var, ayrıntıları henüz doğrulanmadı): DIT Electrical Eng. & IT B.Eng. ve diğer İngilizce B.Eng. programları (th-deg.de/studying-in-english), TH Rosenheim Robotics and Machine Intelligence B.Eng., Constructor Electrical & Computer Engineering B.Sc.

---

## 6. İTALYA İLK 20 %100 İNGİLİZCE MÜHENDİSLİK ÜNİVERSİTESİ YOL HARİTASI

> [!TIP]
> **İtalya'da İngilizce Mühendislik Gücü:**
> İtalya'daki teknik üniversiteler (Politecnico di Milano ve Politecnico di Torino) ve köklü devlet üniversiteleri, mühendislik lisans programlarını **tamamen İngilizce (100% English-Taught Bachelor)** olarak vermektedir. Sınavlar ve mülakatlar İngilizcedir. (PM Düzeltmesi: PoliMi'nin İngilizce programlarında İtalyanca bilmeyen öğrenciye İtalyanca OFA verilir. Mezuniyetten önce İtalyanca B2 belgesi ya da PoliMi kursu gerekir.)

### 6.1. Adım Adım Başvuru Sırası
1. **1. Adım (11. Sınıf Bahar - Yaz):** CISIA web sitesinden kayıt olarak **English TOLC-I / CEnT-S** sınavına girmek (veya PoliTo için TIL-I). AP Calculus ve Physics alan öğrenci bu sınavda rahatlıkla 35+ puan alır.
2. **2. Adım (11. Sınıf Sonu):** **IELTS Academic (en az 6.5 - 7.0)** belgesini hazır etmek (PoliMi OFA dil muafiyeti sağlar).
3. **3. Adım (Kasım - Nisan):** Üniversitelerin uluslararası başvuru çağrılarına (Call for Applications) doğrudan başvuru yapmak.
4. **4. Adım (Nisan - Haziran):** İtalyan Hükümeti resmi portalı olan **Universitaly** üzerinden ön kayıt (Pre-iscrizione) belgesini doldurmak.
5. **5. Adım (Mayıs - Temmuz):** **CIMEA** web sitesinden Diploma Denklik ve Doğrulama Belgesi (Statement of Comparability) almak.
6. **6. Adım (Haziran - Ağustos):** Üniversitenin bağlı olduğu bölgenin **DSU / EDISU Bursuna** (Borsa di Studio) aile gelir beyanı (ISEE Parificato) ile başvurmak (Yıllık ~8.000€ karşılıksız ödeme + ücretsiz yemek/yurt hakkı).
7. **7. Adım (Temmuz - Ağustos):** iDATA üzerinden İtalya Öğrenci Vizesi (Ulusal D Tipi) başvurusu yapmak.

### 6.2. İtalya — Doğrulanmış %100 İngilizce Mühendislik Lisansları (PM Onaylı, 7 Ekim 2026)

> [!CAUTION]
> **Önceki "İlk 20" listesi kaldırıldı.** Resmi kontrolde şu programların İngilizce lisans olmadığı görüldü: Pavia ECE (İtalyanca), Pisa (İngilizce mühendislik yalnızca yüksek lisansta), Napoli Biomedical, Floransa, Roma Tre, Politecnico di Bari, Trieste, UNIMORE, Brescia, Salerno, Bologna Bioinformatics ve Bicocca Materials. unibz üç dillidir (mezuniyette iki dilde C1); Meberra'ya uygun değil.
> **Sınav yolu her üniversitede farklıdır ("her yerde TOLC-I" yanlış).** AP giriş sınavının yerine geçmez. AB dışı adayların başvuru pencereleri genellikle Ocak–Nisan arasıdır; vize gerektiren adaylar için takvim daha erken kapanır. 2028/29 çağrıları Aralık 2027 – Ocak 2028'de yayımlanacak; tüm baremler o tarihte yeniden kontrol edilmelidir.

| # | Üniversite | Program | Kabul Sınavı / Yolu | Dil Şartı | Harç (AB dışı) | Durum | Resmi Kaynak |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Politecnico di Torino | Computer Eng., Automotive Eng., Electronic & Communications Eng., Mechanical Eng., Civil & Environmental Eng. | **TIL-I** (Torino'da yüz yüze); ≥60/100 garantili kabul, ≥30 sıralama; sonra SAT ≥650 (her bölüm); vize adayları için Şubat–Mayıs oturumları | İngilizce B2 (İtalyanca şartı yok) | Yılda 600–3.600 € (vatandaşlık ülkesinin GSYH'sine göre) + 140 € EDISU vergisi | ✅ Doğrulandı | polito.it/en/education/bachelor-s-degree-programmes |
| 2 | Politecnico di Milano | Civil Engineering; yeni (Eylül 2026): Engineering Science, Industrial Eng. (Piacenza), Process Eng. (Cremona) | TOL / CEnT-S / SAT (her bölümden ≥620); İngilizce programlara "specific rankings" ile giriş (≥75/100 erken kayıt yalnızca İtalyanca programlar için — 2026-27 çağrısı Art. 3; 12 Ekim 2026 düzeltmesi) | İngilizce B2+; **mezuniyetten önce İtalyanca B2 (İtalyanca OFA)** | Gelire göre | ✅ Doğrulandı (yeni programların sınav türü doğrulanmadı) | polimi.it (Engineering BSc Call 2026-27) |
| 3 | Sapienza Roma | Applied Computer Science & AI (ACSAI) | English TOLC-I / CEnT-S / TOLC-I/S / SAT; 180 kontenjan; AB dışı adaylar ayrı sıralanır | İngilizce B2 | Gelire göre | ✅ Doğrulandı | uniroma1.it (TOLC-I selections) |
| 4 | Padova | Information Engineering | **Yalnızca CEnT-S** (≥38 normalize puan + Matematikte ≥7 doğru); 100 AB dışı kontenjan; ilk CEnT-S tarihleri 26 Kas ve 17 Ara 2026 | İngilizce B2 | **Yılda 2.950 €** + 208 € depozito | ✅ Doğrulandı (PM örneklemi) | apply.unipd.it/courses/course/182 |
| 5 | Tor Vergata Roma | Engineering Sciences | **Kendi çevrimiçi yazılı sınavı + mülakat** (Procedure C; TOLC-I istenmez); pencereler Ocak ve Mart–Nisan | İngilizce B2 | Doğrulanmadı | ✅ Doğrulandı | engineering-sciences.uniroma2.it/call-for-applications/ |
| 6 | Trento | Computer, Communications & Electronic Eng. | English TOLC-I veya TOLC-I; AB dışı adaylar yalnızca 1. oturum (Şubat–Mart) | Doğrulanmadı | Doğrulanmadı | ✅ Doğrulandı | disi.unitn.it/prospective-students/bachelor-courses |
| 7 | Statale + Bicocca + Pavia (ortak) | Artificial Intelligence (L-31) | Yurtdışındaki AB dışı adaylar için **SAT ≥979/1600**; 45 kontenjan; Nisan–Mayıs | İngilizce B2 | Doğrulanmadı | ✅ Doğrulandı | unimi.it/en/education/bachelor/artificial-intelligence |
| 8 | Genova | Computer Engineering (Imperia kampüsü) | Serbest giriş + seviye belirleme testi | Doğrulanmadı | Doğrulanmadı | ⚠️ Kısmen | corsi.unige.it/en/corsi/12133 |
| 9 | Napoli Federico II | Electrical Engineering & Information Technology | Doğrulanmadı | Doğrulanmadı | Bölüm sayfasına göre AB dışı: 140 € vergi + 16 € pul | ⚠️ Kısmen (yeni aday) | eeit.dieti.unina.it/index.php/tuition-fees |
| 10 | Campus Bio-Medico Roma (özel) | Biomedical Engineering (L-8) | Üniversitenin kendi çağrısı; 60 kontenjan, 15'i yurtdışında yaşayan yabancılara | İngilizce | Özel üniversite; seçilenlere %50 indirim | ⚠️ Kısmen (yeni aday) | unicampus.it (Biomedical Engineering call 2026-27) |

**Mühendislik dışı, bilgi amaçlı:** Bologna Genomics ve CLaBE (Business & Economics). Yurtdışındaki AB dışı adaylar bu programlara yalnızca SAT ile başvurabilir.

---

## 7. PROJE KÜTÜPHANESİNDEKİ PDF KILAVUZLARININ ANALİZİ VE ENTEGRASYONU

Tüm ajanlar kararlarını ve ders planlamalarını klasörde bulunan aşağıdaki resmi kılavuzlara dayandırır:

1. **`a00818aa8456d5ce9df32c60d6147908.pdf` (Bilfen Liseleri - Dijital ve Hibrit AP Sınav Kılavuzu):**
   - **Bluebook Platformu:** 2025/2026 itibarıyla AP sınavları dijital platform Bluebook üzerinden yapılır.
   - **Tamamen Dijital:** AP English Language & Composition, AP Computer Science A, Tarih ve Sosyal Bilimler.
   - **Hibrit Dijital:** AP Calculus AB/BC, AP Physics (1/2/C), AP Chemistry, AP Biology. Bu sınavlarda çoktan seçmeli bölüm (MCQ) Bluebook'ta bilgisayar ekranından çözülür; serbest yanıtlı açık uçlu sorular (FRQ) ekranda görüntülenip basılı sınav kitapçığına tükenmez/kurşun kalem ile el yazısıyla yazılır.
   - **Kurallar:** Onaylı grafik hesap makinesi politikası, 10 dk mola kuralı, cihaz şarj ve çevrimdışı çalışma protokolleri.

2. **`mefte-ap.pdf` (MEF Okulları - AP Programına Bakış ve Kredilendirme):**
   - AP derslerinin üniversite seviyesinde olduğu, lisede bu dersleri almanın öğrenciye zaman yönetimi, analitik yazma ve üniversite derslerinden muafiyet (Credit Placement) kazandırdığı vurgulanır.
   - `myap.collegeboard.org` üzerindeki AP Classroom, AP Daily Videos ve Personal Progress Checks araçlarının ders çalışma rutinine dahil edilmesi esastır.

3. **`21142648_AP-hakkinda.pdf` & `21142827_AP-Nedir.pdf` (WCEP AP Kılavuzu):**
   - 3 adet AP sınavından en az 3 alan öğrencilere **AP Scholar** unvanı verilir.
   - 4 farklı alanda 5 farklı AP dersini 3+ ile tamamlayan öğrencilere **APID (AP International Diploma)** diploması verilir. **PM Düzeltmesi:** College Board'a göre APID lise diplomasının yerine **geçmez**. Koşul: 5 AP'den 3+. Bunlar iki farklı dilde dil sınavı, bir küresel perspektif dersi, bir matematik/fen/CS dersi ve bir ek dersi kapsamalıdır.

4. **`advanced _placement.pdf` (Gelişim Koleji AP Yönergesi):**
   - AP ve IB arasındaki temel farklar: AP, öğrenciye bağımsız uzmanlaşma ve esneklik tanır. 11. ve 12. sınıfta ders dağılım stratejisinin önemi.

5. **`ap-web.pdf` (Pearson International Connections Academy):**
   - Başarılı bir AP öğrencisi için CEFR B2/C1 İngilizce seviyesi, haftalık düzenli 2-4 saat odaklı derin çalışma periyotları ve düzenli deneme çözümü gerekliliği.

---

## 8. OLUŞTURULAN AGENT EKİBİ VE TEKNİK AJAN MİMARİSİ

> [!NOTE]
> **Teknik Mimari Dokümantasyonu:**
> Ajan konseyinin detaylı sistem promptları, karar alma yetkileri, hiyerarşisi ve operasyonel protokolleri çalışma alanı kökünde yer alan [AGENTS.md](file:///c:/Users/hp/Desktop/AP%20AZRA/AGENTS.md) ve [.agents/rules/agent-roster.md](file:///c:/Users/hp/Desktop/AP%20AZRA/.agents/rules/agent-roster.md) dosyalarında kalıcı olarak tanımlanmıştır. Ayrıca Meberra'nın 9 ajanla canlı görüşebildiği ve yuvarlak masa müzakerelerini yürütebildiği [ajanlar.html](file:///c:/Users/hp/Desktop/AP%20AZRA/ajanlar.html) komuta portalı kurulmuştur.

1. **Lead PM & Baş Eğitim Direktörü (Dr. Aylin Kaya):** Meberra'nın 2 yıllık bütünsel mentoru, pedagojik rehberi ve motivasyon koçu.
2. **Uluslararası Eğitim Kıdemli Uzman Danışmanı (Dr. Marcus Weber & Elena Rossi):** KMK/Anabin ve Universitaly/CIMEA mevzuat uzmanı.
3. **AP Sınav Stratejisti & College Board Uzman Danışmanı (Canan Yılmaz):** Bluebook sınav formatı, kayıt takvimi ve puanlama uzmanı.
4. **AP Calculus (AB / BC) Baş Eğitmeni (Prof. Sinan Demir):** Limit, türev, integral ve diferansiyel denklemler lideri.
5. **AP Fizik (Physics 1 & Physics C) Baş Eğitmeni (Dr. Emre Yıldız):** Mekanik, elektrik ve laboratuvar tasarım FRQ uzmanı.
6. **AP Kimya Baş Eğitmeni (Doç. Dr. Selin Erdem):** Termodinamik, denge ve elektrokimya lideri.
7. **AP Biyoloji Baş Eğitmeni (Dr. Zeynep Aksoy):** Moleküler genetik, biyokimya ve İtalya IMAT eşleştirme uzmanı.
8. **Kıdemli Akademik İngilizce, Terminoloji ve Dil Uzmanı (Claire Bennett, MA Oxon):**
   - Oxford Üniversitesi mezunu, AP English Language & Literature Baş Eğitmeni.
   - **Özel Görevi (Mandate):** Sistemdeki tüm sayısal ve sözel derslerin **%100 İngilizce akademik standartta** yürütülmesini denetler. Türk lise eğitimi ile Avrupa mühendislik/AP terminolojisi arasındaki dil köprüsünü kurar; kavramların Türkçe çevirilerle anlam kaybına uğramasını engeller.
   - Meberra'yı **IELTS Academic 8.5**, TOEFL iBT ve uluslararası bilimsel araştırma makalesi (*scientific paper & technical abstract*) yazım standartlarına hazırlar. İtalya'da PoliMi OFA dil muafiyeti ve Almanya KMK Dil Kriteri tamamlama garantörüdür.
9. **AP Seçmeli Dersler (Ekonomi & Bilgisayar Bilimi) Eğitmeni (Barış Özkan):** Bocconi ve Almanya Enformatik hedefleri için Java OOP ve piyasa modelleri mentoru.
10. **Uluslararası Destek, Burs ve Hibe Proje Hazırlama Uzmanı (Grant & Funding Proposal Specialist - Konsorsiyum Masası):**
   - **Liderlik:** Dr. Marcus Weber, Barış Özkan ve Claire Bennett ortaklığında; Lead PM Dr. Aylin Kaya denetiminde yönetilen uzman hibe hazırlama organıdır.
   - **Temel Fonksiyonu:** TÜBİTAK 2204-A, İtalya DSU / EDISU, DAAD, Erasmus+ Gençlik, Horizon Europe Youth ve uluslararası STEM bursları için **profesyonel bir hibe proje uzmanı standardında A'dan Z'ye proje teklifleri, iş paketleri ve bütçe planları hazırlar**.
   - **Çağrı Takip Motoru:** Sistem her güncellendiğinde açık çağrıları tarar; her yeni çağrı için bağımsız, özelleştirilmiş başvuru dosyaları oluşturur ve günceller.

---

## 9. DERS İÇERİKLERİNİN SÜREKLİ GELİŞİM VE DERİNLEŞME PROTOKOLÜ (Continuous Curriculum Evolution)

> [!IMPORTANT]
> **Sürekli Gelişim İlkesi:** Projedeki hiçbir ders içeriği statik değildir. Meberra'nın 11. sınıftan 12. sınıfa uzanan 2 yıllık maratonunda, dersler 4 aşamalı bir pedagojik derinleşme döngüsüyle sürekli zenginleştirilir, güncellenir ve yeni soru tipleriyle genişletilir.

### 9.1. Dört Aşamalı Derinleşme Döngüsü (Progressive Mastery Cycle)
1. **Faz 1: Kavramsal Temel & Teori (Concept Deep-Dive):**
   - AP Daily videoları ve akredite kaynaklar (Barron's, Princeton Review) sentezlenerek her konunun arkasındaki temel bilimsel ve matematiksel mantık kurulur.
2. **Faz 2: Çoktan Seçmeli Soru (MCQ) Ustalığı & Çeldirici Eleme:**
   - Bluebook arayüzünde seçenek eleme, soru işaretleme ve süreyi doğru kullanma pratikleri yapılır (Soru başına ortalama 1.2 - 1.5 dakika).
3. **Faz 3: Serbest Yanıtlı Soru (FRQ) & Adım Puanlama Disiplini:**
   - College Board'un 2018-2025 yılları arasında çıkmış resmi sınav soruları taranır. Cevap sadece doğru sonuç odaklı değil, College Board puanlama rubriğine (Scoring Guidelines) birebir uygun basamaklı el yazısıyla inşa edilir.
4. **Faz 4: Gerçek Bluebook Denemesi & Hata Defteri (Error Log):**
   - Tam zamanlı deneme sınavları uygulanır. Yapılan her hata "Kavramsal Eksik", "İşlem Hatası" veya "Zaman Yönetimi" olarak kategorize edilip sistem tarafından anında kapatılır.

### 9.2. Branş Bazında Derinleşme ve İçerik Geliştirme Haritası

#### 1. AP Calculus (AB / BC) — Baş Eğitmen: Prof. Sinan Demir
- **Temel Kazanımlar:** Limit & Süreklilik, Türev Alma Kuralları (Zincir Kuralı, Kapalı Fonksiyon Türevi), Türev Uygulamaları (Related Rates, Optimizasyon, Ortalama Değer Teoremi MVT, L'Hôpital), İntegrasyon Teknikleri, Kalkülüsün Temel Teoremi (FTC Part 1 & 2), Diferansiyel Denklemler & Eğim Alanları, Dönel Cisim Hacimleri (Disk/Pul Yöntemi).
- **BC İleri Modülleri:** Kısmi Kesirlerle İntegrasyon, Yanlış İntegraller (Improper Integrals), Lojistik Büyüme Modelleri, Euler Yöntemi, Kutupsal ve Parametrik Eğrilerde Yay Uzunluğu ve Alan, Sonsuz Seriler (Taylor & Maclaurin Polinomları, Yakınsaklık Testleri, Lagrange Hata Sınırı).
- **Sürekli Gelişim Eylemi:** Her ay portala 5 adet yeni "Zorlu FRQ Çözüm Basamağı" ve Desmos grafik modelleme senaryosu eklenir.

#### 2. AP Fizik (Physics 1 & Physics C) — Baş Eğitmen: Dr. Emre Yıldız
- **Temel Kazanımlar (Physics 1):** 1D/2D Kinematik, Newton Hareket Yasaları, Serbest Cisim Diyagramları (FBD), Dairesel Hareket ve Yerçekimi, İş-Enerji-Güç, Doğrusal Momentum ve Çarpışmalar, Basit Harmonik Hareket, Tork ve Dönme Hareketi.
- **Physics C Derinleşmesi:** Mekanikte kalkülüs temelli hız-ivme türevleri, değişken kuvvetlerin iş integrali, dönme eylemsizlik momentinin (I = ∫ r² dm) integralle hesabı. Elektromanyetizmada Gauss Yasası, Amper Yasası, Faraday-Lenz İndüksiyonu ve RC/RL/RLC devre diferansiyel denklemleri.
- **Sürekli Gelişim Eylemi:** Portala düzenli olarak "Laboratuvar Deney Tasarımı (Experimental Design)" ve "Paragraf Kanıtlama (Paragraph-Length Response)" analizleri yüklenir.

#### 3. AP English Language & Composition — Baş Eğitmen: Claire Bennett (Oxon)
- **Temel Kazanımlar:** Retorik Durum (SPACE-CAT: Speaker, Purpose, Audience, Context, Exigence, Choices, Appeals, Tone), 40'tan fazla retorik araç (Anaphora, Antithesis, Chiasmus, Hypophora, Juxtaposition, Polysyndeton), Sentez Makalesi mimarisi (en az 3 kaynağı sentezleyerek tez savunma), Argümantasyon Makalesi (CHORES kanıt matrisi).
- **Bluebook Dijital Yazım Hızı:** Klavyeyle süreli kompozisyon yazımı, paragraf geçiş bağlaçları (transitions), tez cümlesi kurgusu ("Although X, because Y, therefore Z").
- **Sürekli Gelişim Eylemi:** İki haftada bir güncel bir uluslararası editoryal makale taranarak sisteme retorik analiz ödevi olarak aktarılır.

#### 4. AP Kimya — Baş Eğitmen: Doç. Dr. Selin Erdem
- **Temel Kazanımlar:** Fotoelektron Spektroskopisi (PES), Periyodik Eğilimler, Lewis ve VSEPR Geometrisi, Moleküller Arası Kuvvetler (IMF), İdeal Gaz Yasaları, Kinetik Hız Yasaları ve Aktivasyon Enerjisi (Arrhenius), Kimyasal Denge (Le Chatelier, Kp/Kc/Ksp), Tampon Çözeltiler ve Titrasyon Eğrileri, Termodinamik (ΔH, ΔS, ΔG) ve Elektrokimyasal Hücreler.
- **Sürekli Gelişim Eylemi:** Hibrit sınav için el yazılı basamak puanı getiren titrasyon ve termodinamik hesaplama şablonları güncellenir.

#### 5. AP Biyoloji — Baş Eğitmen: Dr. Zeynep Aksoy
- **Temel Kazanımlar:** Biyomoleküller, Hücre Zarı ve Su Potansiyeli (Ψ = Ψp + Ψs), Enzim Kinetiği, Fotosentez (Işık ve Calvin Döngüsü), Hücresel Solunum (Glikoliz, Krebs, ETS), Sinyal İletim Kaskadı, Mitoz/Mayoz, Mendel Genetiği, Moleküler Biyoloji (DNA Replikasyonu, Transkripsiyon, Translasyon, Operonlar), Doğal Seçilim, Hardy-Weinberg Dengesi ve Biyoistatistik (Kay-Kare χ² testi, ±2 SEM Hata Çubukları).
- **IMAT Tıp Entegrasyonu:** İtalya İngilizce Tıp (IMAT) sınavının biyoloji soruları AP müfredatıyla harmanlanarak ortak denemeler üretilir.

#### 6. AP Seçmeliler (Ekonomi & Bilgisayar Bilimi) — Eğitmen: Barış Özkan
- **AP CS A (Java):** İlkel Tipler, Nesne Kullanımı, Boolean İfadeleri, Döngüler (while/for/for-each), Sınıf Yazımı (Encapsulation, Constructors), 1D/2D Diziler (Arrays & ArrayLists), Kalıtım (Inheritance & Polymorphism), Özyineleme (Recursion), Sıralama ve Arama Algoritmaları (Binary Search, Merge Sort, Insertion Sort).
- **AP Ekonomi:** Mikroekonomide marjinal fayda, esneklik, piyasa modelleri (Mükemmel Rekabet, Monopol, Oligopol, Monopolistik Rekabet); Makroekonomide GSYİH, Enflasyon, AD-AS Modeli, Maliye ve Para Politikası, Phillips Eğrisi, FOREX Döviz Piyasası.

### 9.4. Uluslararası Üçlü Soru Havuzu ve Resmî PDF Arşivi (AP + Abitur + Maturità)

> [!TIP]
> **Üçlü Sınav Gücü:** AP sınavı ABD merkezli bir sistemdir; Almanya ve İtalya'da birebir "AP soru bankası" yoktur. Bu sebeple Meberra'nın hem hedef ülkelerin akademik rigoruna (zorluk seviyesine) alışması hem de AP'de 5/5 yapabilmesi için sistemimiz **Üçlü Uluslararası Arşiv Sentezi** uygular:

#### 1. Öncelikli Resmî AP Kaynakları (College Board AP Central)
AP'nin resmî soru arşivi College Board'un AP Central sayfasıdır. Buradan geçmiş sınavların Free-Response Questions (FRQ), puanlama rubrikleri (*Scoring Guidelines*) ve örnek öğrenci cevaplarına ulaşılır:
- 🌐 [Tüm AP Dersleri – Geçmiş Sınav Soruları Ana Portalı](https://apcentral.collegeboard.org/courses/past-exam-questions)
- 📐 [AP Calculus AB Geçmiş Sınav Soruları](https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam/past-exam-questions)
- 📊 [AP Statistics Geçmiş Sınav Soruları](https://apcentral.collegeboard.org/courses/ap-statistics/exam/past-exam-questions)
- 🔬 [AP Physics 1 Geçmiş Sınav Soruları](https://apcentral.collegeboard.org/courses/ap-physics-1/exam/past-exam-questions)
- ⚗️ [AP Chemistry Geçmiş Sınav Soruları](https://apcentral.collegeboard.org/courses/ap-chemistry/exam/past-exam-questions)
- 🧬 [AP Biology Geçmiş Sınav Soruları](https://apcentral.collegeboard.org/courses/ap-biology/exam/past-exam-questions)
- 📝 [AP English Language and Composition Geçmiş Sınav Soruları](https://apcentral.collegeboard.org/courses/ap-english-language-and-composition/exam/past-exam-questions)
- 📚 [AP English Literature and Composition Geçmiş Sınav Soruları](https://apcentral.collegeboard.org/courses/ap-english-literature-and-composition/exam/past-exam-questions)
- 🏛️ [AP U.S. History Geçmiş Sınav Soruları](https://apcentral.collegeboard.org/courses/ap-united-states-history/exam/past-exam-questions)
- 🌍 [AP World History: Modern Geçmiş Sınav Soruları](https://apcentral.collegeboard.org/courses/ap-world-history-modern/exam/past-exam-questions)
- 🏰 [AP European History Geçmiş Sınav Soruları](https://apcentral.collegeboard.org/courses/ap-european-history/exam/past-exam-questions)
- 🧠 [AP Psychology Geçmiş Sınav Soruları](https://apcentral.collegeboard.org/courses/ap-psychology/exam/past-exam-questions)
- 💻 [AP Computer Science A Geçmiş Sınav Soruları](https://apcentral.collegeboard.org/courses/ap-computer-science-a/exam/past-exam-questions)
- 📉 [AP Microeconomics Geçmiş Sınav Soruları](https://apcentral.collegeboard.org/courses/ap-microeconomics/exam/past-exam-questions)
- 📈 [AP Macroeconomics Geçmiş Sınav Soruları](https://apcentral.collegeboard.org/courses/ap-macroeconomics/exam/past-exam-questions)

#### 2. Almanya: Abitur Resmî PDF Soru Bankaları ve Eyalet Havuzları
Almanya için en güçlü resmî kaynak Berlin Humboldt Üniversitesi bünyesindeki **IQB (Institut zur Qualitätsentwicklung im Bildungswesen)** platformudur. Almanca, İngilizce ve Matematik için 2017'den; Biyoloji, Kimya ve Fizik için ise 2025'ten itibaren eyaletlerin ortak sınav havuzları yayımlanmaktadır:
- 🇩🇪 [IQB Sekundarstufe II – Abitur Ortak Soru Havuzu Ana Sayfası](https://www.iqb.hu-berlin.de/de/schule/aufgaben/sekii/)
  - [IQB Mathematik (Kalkülüs, Olasılık, Vektör Geometrisi)](https://www.iqb.hu-berlin.de/de/schule/aufgaben/sekii/mathematik/)
  - [IQB Physik (Mekanik, Elektromanyetizma, Kuantum)](https://www.iqb.hu-berlin.de/de/schule/aufgaben/sekii/physik/)
  - [IQB Chemie (Termodinamik, Denge, Organik Reaksiyonlar)](https://www.iqb.hu-berlin.de/de/schule/aufgaben/sekii/chemie/)
  - [IQB Biologie (Hücre Fizyolojisi, Genetik, Nörobiyoloji, Ekoloji)](https://www.iqb.hu-berlin.de/de/schule/aufgaben/sekii/biologie/)
  - [IQB Englisch (Metin Analizi, Sentez, Essay Görevleri)](https://www.iqb.hu-berlin.de/de/schule/aufgaben/sekii/englisch/)
  - [IQB Deutsch (Retorik ve Edebiyat Çözümlemeleri)](https://www.iqb.hu-berlin.de/de/schule/aufgaben/sekii/deutsch/)
- **Almanya Ek Eyalet ve Federal PDF Arşivleri:**
  - [Hamburg Abitur Örnekleri (Chemie, Biologie, Deutsch, Englisch, Mathematik)](https://li.hamburg.de/fortbildung/faecher-lernbereiche/mint/chemie/artikel-abitur-pruefungsaufgaben-652168)
  - [Bayern Illustrierende Abituraufgaben (ISB München)](https://www.isb.bayern.de/schularten/gymnasium/illustrierende-pruefungsaufgaben/)
  - [Deutscher Bildungsserver – Eyaletlere Göre Abitur Sınav Kaynakları Portalı](https://www.bildungsserver.de/schule/pruefungsvorbeitung-fuer-das-abitur-638-de.html)
  - [NRW (Kuzey Ren-Vestfalya) Geçmiş Abitur Sınav Görevleri İndirme Portalı](https://www.schulministerium.nrw/abituraufgaben-vergangener-jahre-zum-herunterladen)
  - [Abitur Berlin ve Brandenburg Orijinal Sınav Arşivleri](https://www.abitur-berlin.de/originalpruefungen)
- **Almanca Resmî Çözümlü PDF Arama Anahtarları:**
  - `Abitur Mathematik Aufgaben mit Lösungen PDF`
  - `Abitur Physik Aufgaben Lösungen PDF`
  - `Abitur Chemie Aufgaben Lösungen PDF`
  - `Abitur Biologie Klausuren PDF`
  - `Abitur Englisch Leistungskurs Aufgaben PDF`

#### 3. İtalya: Esame di Stato (Maturità) ve INVALSI Resmî PDF Kaynakları
İtalya'da lise bitirme ve üniversiteye giriş seviyesi *Esame di Stato conclusivo del secondo ciclo di istruzione* sınavıdır. Resmî arşivde *Prima Prova* (İtalyanca/Yazma) ve *Seconda Prova Scritta* (Fen ve Teknik Liseler branş sınavı) yer alır:
- 🇮🇹 [İtalya Eğitim ve Liyakat Bakanlığı (MIM) – 2025/2026 Resmî Yazılı Sınav Arşivi](https://www.istruzione.it/esame_di_stato/202526/default_anno.htm)
- 🏛️ [Esami di Stato – Geçmiş Yıllar Yazılı Sınav İzleri (MIUR Portalı)](https://www.miur.gov.it/tracce-prove-scritte)
- 📐 [2024/2025 Matematik Liceo Scientifico İkinci Yazılı Sınavı Resmî PDF (A002_ORD25.pdf)](https://www.istruzione.it/esame_di_stato/202425/Licei/Ordinaria/A002_ORD25.pdf)
- 📊 [INVALSI Matematik Örnek Sınavları ve Çözümlü Rehber PDF](https://www.invalsi.it/EsamiDiStato/documenti/esempi_mat/esempiMAT.pdf)
- 🧬 [INVALSI Ulusal Örnek Sınavlar (Fen Bilimleri, İngilizce ve Matematik)](https://www.invalsi.it/rilevazioni-nazionali/prove-invalsi-esempi/)
- **İtalyanca Resmî Çözümlü PDF Arama Anahtarları:**
  - `prove maturità matematica PDF con soluzioni`
  - `seconda prova matematica liceo scientifico PDF`
  - `prove maturità fisica PDF`
  - `prove maturità chimica PDF`
  - `simulazione esame di stato biologia PDF`
  - `prove invalsi inglese PDF`
  - `prove maturità italiano PDF svolte`

#### 4. Kapsamlı Ders Eşleştirme Matrisi (AP ↔ Almanya ↔ İtalya)

| AP Dersi | Almanya Karşılığı (Abitur) | İtalya Karşılığı (Maturità / INVALSI) | Pedagojik Kazanım & Sentez |
| :--- | :--- | :--- | :--- |
| **AP Calculus AB / BC** | Abitur Mathematik (Analysis & Integral) | Liceo Scientifico Matematica (Seconda Prova) | Fonksiyon modelleme, teğet/normal, has olmayan integraller ve alan-hacim |
| **AP Statistics** | Abitur Mathematik (Stochastik / Veri Analizi) | INVALSI Matematica (Statistica e Probabilità) | Hipotez testleri, normal dağılım, regresyon analizi |
| **AP Physics (1 & C)** | Abitur Physik (Mechanik & Elektrodynamik) | Maturità Fisica (Liceo Scientifico) | Serbest cisim diyagramı, kalkülüs temelli dinamik, Faraday ve Lorentz |
| **AP Chemistry** | Abitur Chemie (Kinetik, Gleichgewicht) | Maturità Chimica (Licei & Istituti Tecnici) | Titrasyon basamakları, Nernst eşitliği, Le Chatelier prensibi |
| **AP Biology** | Abitur Biologie (Genetik & Zellphysiologie) | INVALSI Scienze & IMAT Tıp Soruları | Biyoistatistik ($\chi^2$), gen klonlama, hücresel solunum mekanizmaları |
| **AP English Language** | Abitur Englisch (Non-fictional Analysis) | INVALSI Inglese (C1 Reading & Production) | Retorik stratejiler, tez cümlesi mimarisi, kaynak sentezi |
| **AP English Literature**| Abitur Englisch (Literary Text Analysis) | Maturità Lingue e Letterature Straniere | Şiir ve düzyazıda imgelem, ton, alt metin ve yapı analizi |
| **AP European History** | Abitur Geschichte (Neuere Geschichte) | Esame di Stato Storia (Documento Storico) | Belge analizi (DBQ), tarihsel nedensellik ve bağlamsallaştırma |
| **AP Computer Science A**| Abitur Informatik / Mathematik (Algorithmen)| Istituto Tecnico Informatica (Java & OOP) | Nesne yönelimli tasarım, özyineleme (recursion), veri yapıları |
| **AP Economics (Micro/Macro)**| Abitur Wirtschaftsgymnasium (VWL) | Istituto Tecnico Economico (AFM / Economia) | Piyasa modelleri, para-maliye politikaları, dışsallıklar ve döviz kurları |

#### 5. Meberra İçin Altın Çalışma Sırası (Study Workflow) ve Telif İlkeleri
1. **Önce College Board AP Central:** İlgili ünitenin geçmiş resmî FRQ dosyaları indirilir ve *Scoring Guidelines* puan anahtarı esas alınarak süreyle çözülür.
2. **Almanya Abitur Analitik Derinliği:** Aynı konunun matematiksel ve bilimsel rigor düzeyi IQB veya Bavyera/NRW Abitur havuzundan çözülerek pekiştirilir.
3. **İtalya Maturità Farklı Soru Dili:** Matematik ve Fizikte Liceo Scientifico *Seconda Prova* ve INVALSI soruları ikinci bir soru dili olarak çözülür.
4. **Hata Defteri & Rubrik Kaydı:** Çözülen her soru konu, zorluk derecesi ve hata türüyle sisteme kaydedilir.
5. **Telif ve Açık Erişim Güvencesi:** Sistemimiz telif ihlali barındıran korsan/taranmış dokümanlar yerine münhasıran **College Board, IQB, Almanya Eyalet Eğitim Bakanlıkları, İtalya MIM ve INVALSI** tarafından yayımlanmış resmî ve açık erişimli PDF arşivlerini kullanır.

---

### 9.5. Sürekli Gelişim Takip Paneli (KPI & Progress Dashboard)
MEF ve Pearson resmi kılavuzlarında tavsiye edildiği üzere, Meberra'nın her ünitedeki kavrayış düzeyi portallarda takip edilir:
- **Kırmızı Bölge (%0 - %49):** Kavramsal eksik var; ilgili ünitenin AP Daily videosu ve formül kartları yeniden çalışılır.
- **Sarı Bölge (%50 - %74):** Temel oturmuş; soru çözüm hızı ve çeldirici analizine odaklanılır.
- **Yeşil Bölge (%75 - %100):** Ünite tam hakimiyet düzeyindedir; FRQ çıkmış sorularına geçilir.

---

## 10. DİNAMİK İNTERNET TARAMA VE SİSTEM GÜNCELLEME KURALI

> [!IMPORTANT]
> **Dinamik Tarama Protokolü:**
> Kullanıcı veya ajanlar `proje.md` dosyasını referans aldığında veya güncellediğinde, yapay zeka ajanları aşağıdaki kaynaklarda otomatik tarama yaparak güncel değişiklikleri not düşmelidir:
> 1. **College Board:** AP sınav takvimleri, Bluebook yazılım güncellemeleri, sınav formatı ve hesap makinesi yönergeleri.
> 2. **Almanya KMK / Anabin:** Türk lise diploması ve AP ders kabul şartlarında yapılan olası değişiklikler veya eyalet bazlı yeni düzenlemeler.
> 3. **İtalya Universitaly & MIUR:** Yabancı öğrenci kontenjanları, İngilizce mühendislik lisans programları başvuru dönemleri ve TOLC-I / TIL-I sınav tarihleri.
> 4. **Ulusal ve Uluslararası Hibe, Destek ve Burs Çağrıları:** TÜBİTAK (2204-A, 2209 vb.), İtalya Bölgesel DSU/EDISU bursları, DAAD ve Almanya vakıf bursları, Erasmus+ Gençlik ve Horizon Europe Youth & STEM açık çağrıları. Tespit edilen her yeni çağrı için bağımsız başvuru dosyaları oluşturulur ve güncellenir.

---

## 11. VİBE CODING WEB PORTAL MİMARİSİ

| Dosya Adı | Açıklama |
| :--- | :--- |
| **`index.html`** | **Master Komuta Merkezi:** Meberra'nın 2 yıllık yol haritası, KMK Hesaplayıcısı, İtalya Seçicisi, 9 Ajan Vitrini ve Sayaçlar. |
| **`ajanlar.html`** | **Ajan Konseyi & Mentörlük Merkezi:** 9 ajanın detaylı dosyaları, interaktif canlı terminali, hızlı komut çipleri ve yuvarlak masa müzakere simülatörü. |
| **`AGENTS.md`** | **Ajan Sistem Protokolü:** 9 ajanın rol sınırları, Kural 13 denetimi, karar alma hiyerarşisi ve iş birliği yönergeleri. |
| **`istanbul-sinav-rehberi.html`** | **İstanbul AP Sınav Merkezleri & Alternatif Sınavlar:** Merkez listesi, Bluebook hazırlığı, SAT/TestAS/TOLC-I karşılaştırmaları. |
| **`almanya-muhendislik.html`** | **Almanya İlk 20 Mühendislik Üniversitesi:** Adım adım başvuru kılavuzu, üniversite bazında AP/dil/TestAS şartları, bloke hesap rehberi. |
| **`italya-muhendislik.html`** | **İtalya İlk 20 Mühendislik Üniversitesi:** TOLC-I hazırlığı, Universitaly & CIMEA adımları, DSU bursu alma taktikleri. |
| **`ap-calculus.html`** | **AP Calculus Portalı:** Formül bankası, interaktif ünite izleyici, FRQ ipuçları ve hesap makinesi tüyoları. |
| **`ap-physics.html`** | **AP Physics Portalı:** Mekanik & Elektrik formül kartları, laboratuvar soru stratejileri, Almanya doğa bilimi kriter uyumluluğu. |
| **`ap-chemistry.html`** | **AP Chemistry Portalı:** İnteraktif periyodik tablo, kinetik, denge, termodinamik özetleri ve el yazılı FRQ taktikleri. |
| **`ap-biology.html`** | **AP Biology Portalı:** Biyokimya, hücre, genetik haritaları ve veri analizi çözüm yönergeleri. |
| **`ap-english.html`** | **AP English Language Portalı:** Retorik analiz araç kutusu, sentez ve argüman kompozisyon şablonları. |
| **`ap-electives.html`** | **AP Seçmeliler Portalı:** Mikro/Makroekonomi grafik kütüphanesi, Bilgisayar Bilimi A Java algoritmaları. |
| **`bilgi-merkezi.html`** | **Bilgi Merkezi (YENİ, 7 Ekim 2026):** Doğrulanmış kritik bilgiler. Her kartta durum rozeti (✅ Doğrulandı / ⚠️ Dikkat / ❓ Doğrulanamadı) ve resmi kaynak bağlantısı var; arama ve durum filtresi bulunur. İçerik `data/bilgi-merkezi.js` dosyasından gelir. |
| **`data/bilgi-merkezi.js`** | Bilgi Merkezi veri dosyası. Yalnızca PM doğrulamasından geçmiş, kaynaklı bilgiler eklenir. |
| **`araclar/pm-denetim.js`** | **PM Doğruluk Kapısı aracı (Tur 2):** `node araclar/pm-denetim.js` tüm soru bankasını tarar. Kontrol edilenler: şema, tek doğru şık, A–D sırası, tekrar eden id, errorTag/remediation, yanıltıcı kaynak etiketi, ham Markdown, kaçış hataları, `$` dengesi, doğru şık dağılımı, "doğru şık hep en uzun" kalıbı ve çözüm metnindeki harf ile işaretli doğru şıkkın uyumu. Teslim şartı: **0 sorun**. |
| **`araclar/sunum-olustur.js`** | **Sunum paketi oluşturucu (Tur 2):** `node araclar/sunum-olustur.js` → `sunum/AP-MEBERRA-Sunum-<tarih>.zip`. Adımlar: PM denetimi (sorun varsa paketi üretmez), MathJax'i yerel kopyaya bağlama, belge bağlantılarını yeniden yazma, kırık bağlantı kontrolü, SHA-256 bütünlük listesi, zip'i açıp her dosyayı yeniden doğrulama. |
| **`araclar/vendor/mathjax/`** | MathJax 3.2.2 (`tex-svg.js`, Apache-2.0). Paketin internetsiz formül çizmesi için. |
| **`sunum/`** | **Taşınabilir teslim klasörü:** `AP-MEBERRA/` (açılmış paket: `BASLA.html`, `BENIOKU.txt`, `portal/`, `belgeler/`, `kaynak-pdf/`, `BUTUNLUK.sha256`, `dogrula.ps1`) ve iletilecek `.zip`. Elle düzenlenmez; her tur sonunda yeniden üretilir. |
| **`seviye-testi.html` + `seviye.js`** | **Seviye Testi + Sınav Hazırlık Raporu (Tur 3):** Kayıt öncesi tanı testi; tüm CED ünitelerini kapsar. Rapor ünite bantlarını, kalan süre fizibilitesini, kayıt önerisini, öncelik listesini ve kaynaklı kontrol listesini içerir. |
| **`data/seviye/*.js`** | Tanı bankaları (153 soru): `calculus.js` (AB + BC), `physics-1.js`, `chemistry.js`, `biology.js`, `english-language.js`. `_` ile başlayan dosyalar yalnızca geliştirme örneğidir; pakete girmez. |
| **`data/sinav-takvimi.js`** | AP 2027 sınav tarihleri ve oturumları (13 ders), kayıt tarihleri ve ücretleri, 16 kaynaklı kayıt ve sınav günü gerekliliği. Rapor bu dosyayı okur. |
| **`ilerleme.html`** | **İlerleme Panosu (YENİ):** Ders ve ünite bazında çözülen, doğru ve yanlış sayıları; Kırmızı/Sarı/Yeşil bölge rozetleri; Hata Defteri (soruya giden bağlantılarla); sıfırlama. |
| **`styles.css`** | Tasarım sistemi (7 Ekim 2026'da yeniden yazıldı): renk, boşluk ve tipografi token'ları; açık/koyu tema; WCAG AA kontrast; 360px'e kadar mobil uyum; yazdırma stili. Eski sınıf adları korundu. |
| **`app.js`** | Ortak gezinme menüsü (tüm sayfalara JS ile eklenir), tema geçişi, kalıcı soru motoru (localStorage: `apazra:quiz:v1`, Hata Defteri `apazra:errors:v1`), KMK ön kontrolü (artık ABD diploması uyarısıyla), geri sayım (3 Mayıs 2027) ve ajan diyalog motoru. |

## 12. GÜNCEL GELİŞMELER VE İNTERNET TARAMA GÜNLÜĞÜ (Canlı Ajan Taraması)

*Protokol gereği proje.md her çağrıldığında yapay zeka ajanları tarafından yapılan canlı küresel web taraması neticesinde kaydedilen en sıcak gelişmeler:*

### 12.1. İtalya CISIA Sınavlarında Kritik Reform: CEnT-S Dönemi
- **Doğrulama (7 Ekim 2026):** CEnT-S 4 Kasım 2025'te başladı. CISIA'nın güncel yapısı: 65 soru, 140 dk (Matematik 15, Metin ve Veri Muhakemesi 15, Biyoloji 10, Kimya 10, Fizik 5, Reading 10). Doğru +1, yanlış −0,25. Ücreti 55 €. Her makro dönemde bir kez girilebilir. PoliMi puan dönüşümünde Biyoloji ve Kimya bölümlerini saymaz.
- **Gelişme:** CISIA, İngilizce lisans programlarında uygulanan **English TOLC-I, English TOLC-E ve English TOLC-F** sınavlarını aşamalı olarak tek bir çatı altında birleştirerek **CEnT-S (CISIA English Test – Sciences)** sınavına dönüştürmüştür.
- **Meberra İçin Anlamı:** İtalya'daki İngilizce Mühendislik, Biyoteknoloji ve Doğa Bilimleri başvurularında üniversitelerin başvuru çağrılarında (bando) artık "English TOLC-I veya CEnT-S" ibaresi yer almaktadır. Sınav yapısı yine Matematik, Mantık ve Fen ağırlıklıdır; AP Calculus ve AP Physics temeli bu sınavda tam puan için en büyük kozdur.
- **Takvim:** CISIA'da tek bir merkezi tarih yoktur; üniversiteler yıl boyunca kendi oturumlarını CISIA portalında açar. Meberra 11. sınıf baharından itibaren CISIA öğrenci panelinden CEnT-S randevularını takip edecektir.

### 12.2. College Board Bluebook ve Dijital Sınav Yenilikleri
- **Gelişme:** 2025/2026 döneminde 28 AP dersi Bluebook üzerinden verilmektedir. Sisteme yerleşik **Desmos Grafik Hesap Makinesi** entegre edilmiş, ekran içi formül sayfaları (Reference Sheets) ve yakınlaştırma (Zoom/Pan) araçları optimize edilmiştir.
- **Hibrit Sayısal Kuralı:** Sayısal derslerde (Calculus AB/BC, Physics 1/C, Chemistry, Biology) çoktan seçmeli sorular ekranda Bluebook'ta, serbest yanıtlı açık uçlu sorular (FRQ) ise basılı kitapçığa el yazısıyla çözülmeye devam etmektedir.

### 12.3. Almanya Öğrenci Vizesi ve Bloke Hesap (Sperrkonto) Kesin Rakamı
- **Gelişme:** Alman Dışişleri Bakanlığı (*Auswärtiges Amt*) yabancı öğrencilerin vize alabilmesi için zorunlu olan yıllık Bloke Hesap tutarını **11.904 € (aylık 992 €)** olarak teyit etmiştir.
- **Stratejik Tavsiye:** Banka havale ve kur kesintileri nedeniyle bloke hesaba (Expatrio veya Fintiba üzerinden) en az **12.050 €** yatırılması; eksik bakiye sebebiyle vize gecikmesi riskini sıfıra indirmektedir.

### 12.4. TUM (TU München) Lisans Harç Reformu ve Finansal Planlama
- **Gelişme:** Bavyera Eyaleti yükseköğrenim yasası değişikliğiyle, **TUM (TU München)** 2024/2025 kış döneminden itibaren AB dışından (Non-EU) gelen lisans mühendislik öğrencileri için dönemlik **2.000 € ile 3.000 € (yıllık 4.000 € - 6.000 €)** arasında öğrenim harcı uygulamaya başlamıştır. **PM güncellemesi:** Kış 2027/28'den itibaren yeni kayıtlarda tutar **2.300 € / 3.400 €** olacak. Meberra (Kış 2028/29) bu tutara tabi olacaktır.
- **Meberra İçin Stratejik Anlamı:** Almanya genelinde üniversiteler (örneğin Kuzey Ren-Vestfalya eyaletindeki **RWTH Aachen**, Berlin'deki **TU Berlin** ve Hessen'deki **TU Darmstadt**) harçsız (yalnızca dönemlik ~300 € sömestr bileti; PM notu: Baden-Württemberg'deki **KIT ve Freiburg** AB dışı öğrencilerden 1.500 €/dönem harç alır) olmaya devam etmektedir. Meberra'nın bütçe planlamasında TUM hedefleniyorsa bu harç bütçeye eklenmeli veya RWTH Aachen gibi eşit kalitede harçsız TU9 devleri önceliklendirilebilir.

### 12.5. Politecnico di Milano Erken Başvuru (Early Session) ve OFA Muafiyeti
- **Gelişme:** PoliMi mühendislik programlarında AB dışı kontenjanlar için kabul sıralaması (*positional ranking*) uygulanmaktadır. Minimum baraj 30/100 olsa da rekabetçi programlarda (Bilgisayar, Biyomedikal, Makine) 60+/100 TOL puanı veya TOLC-I'de 33+/50 hedeflenmelidir.
- **SAT Alternatifi:** SAT kabulünde resmi şart, **her iki bölümden de en az 620** puandır. Ayrı bir toplam puan şartı yoktur (PM düzeltmesi).
- **Erken Kabul (12 Ekim 2026 düzeltmesi):** PoliMi 2026-27 çağrısı Art. 3'e göre son sınıftan bir önceki yılda ≥75/100 ile erken kayıt **yalnızca İtalyanca programlar** içindir; İngilizce programlara "specific rankings" ile girilir ve çağrı bu sıralamanın eşiğini vermez. 2026-27 çağrısındaki pencere 2025/26'da 11. sınıf olanlar içindi. Meberra'nın 11. sınıf penceresini 2027-28 çağrısı belirleyecek: **Doğrulanamadı.** Kasım–Aralık 2026 CEnT-S'e girilip girilmeyeceği: **PM/aile kararı bekleniyor (Karar notu K3).** Kaynak: https://www.polimi.it/fileadmin/user_upload/futuri_studenti/Engineering_BSc_call_for_admission_2026-27__English_.pdf · https://www.polimi.it/en/prospective-students/how-to-apply/admission-to-laurea-programmes/engineering/when-to-enrol/you-take-a-test-when-you-are-in-the-penultimate-year
- **OFA Kuralı (PM Düzeltmesi):** OFA English yalnızca İtalyanca eğitim veren programlar için geçerlidir. İngilizce programlarda İngilizce yeterliliği (B2+) kayıttan önce zorunlu bir giriş şartıdır. Ayrıca İtalyanca bilmeyen öğrenciye **İtalyanca OFA** verilir.
- **Kritik Tavsiye:** PoliMi başvurusu mutlaka kontenjanların en açık olduğu 1. çağrıda (**Early Bird / Early Admission**) yapılmalıdır.

### 12.6. Politecnico di Torino (PoliTo) Garantili Kabul Barajı (TIL-I 60/100)
- **Gelişme:** Politecnico di Torino mühendislik lisans programlarında **TIL-I** giriş sınavında **60/100 ve üzeri** puan alan öğrenciler, genel kontenjan sıralamasını beklemeden doğrudan **"Garantili Kabul" (*Guaranteed Admission*)** hakkı kazanmaktadır.
- **Doğrulama (7 Ekim 2026):** PoliTo 2026/27 duyurusu 60/100 garantili kabul ve 30/100 sıralama eşiğini doğruluyor. Vize gerektiren AB dışı adaylar için son TIL oturumu 22 Mayıs, Universitaly ön kaydı 30 Haziran. SAT alternatifinde her bölümden 650 gerekir ve SAT ile garantili kabul yoktur.
- **Meberra İçin Strateji:** AP Calculus BC ve AP Physics C çalışan bir öğrencinin TIL-I matematik ve fizik sorularında 60 barajını rahatlıkla aşması beklenir. Bu durum Meberra için İtalya'da garanti bir "Güvenli Liman" (Safety School) oluşturur.

### 12.7. İtalya DSU / EDISU Bölgesel Bursu ISEE Parificato Tavanı
- **PM Düzeltmesi:** Tavan bölgeye göre değişir. 26.887,93 € **Lombardiya**'nın tavanıdır (ISPE 58.452,06 €; fuori sede ortalama ~7.172 €). Piemonte/EDISU tavanı 26.306,25 €'dur (fuori sede ~8.097 €'ya kadar). Aşağıdaki "%90" oranının kaynağı yoktur.
- **Gelişme (eski metin):** İtalya'da uluslararası öğrencilerin yıllık ~8.000 € karşılıksız burs + ücretsiz yemekhane + üniversite harç muafiyeti alabilmesi için resmi **ISEE Parificato (Ekonomik Durum Göstergesi)** tavanı **26.887,93 €** olarak belirlenmiştir.
- **Meberra İçin Fırsat:** Türkiye'deki aile gelir ve gayrimenkul beyanları Euro kuruna çevrildiğinde Türk öğrencilerin %90'ından fazlası bu sınırın rahatlıkla altında kalarak tam burs (1. Kategori) almaya hak kazanmaktadır. Belgelerin İtalyanca yeminli tercüme-apostil edilip İtalyan CAF (*Centro di Assistenza Fiscale*) üzerinden onaylatılması yeterlidir.

### 12.8. Almanya uni-assist VPD & Türkiye MEB Diploması Prosedürü
- **Mevzuat düzeltmesi (12 Ekim 2026; eski "Türk diploması + KMK 4 AP VPD ile işlenir / APS muafiyeti / noter onaylı tercüme" metni kaldırıldı):**
  - (a) Türk diploması + AP için anabin'de kural yoktur. Türk adayın giriş hakkı: Lise Diploması + YKS'de lisans programına yerleşme (TUR-BV05, alana bağlı). Kaynak: https://anabin.kmk.org
  - (b) APS Türkiye'ye hiç uygulanmaz; bu bir "muafiyet" değildir. APS yalnızca Çin, Hindistan ve Vietnam'dan gelen adaylardan istenir. Kaynak: https://www2.daad.de/deutschland/studienangebote/international-programmes/en/detail/9595/
  - (c) uni-assist Türk adaydan Lise Diploması + YKS "Yerleştirme Sonuçları" (+ varsa üniversite transkripti) ister ve yalnızca Türkiye'deki yeminli tercüman çevirisini kabul eder; noter onayı tek başına yetmez. Kaynak: https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/tr/
  - (d) VPD'yi yalnızca bazı üniversiteler ister; karar üniversitenindir, ülkenin değil (süre 4–6 hafta, geçerlilik 1 yıl). Kaynak: https://www.uni-assist.de/en/how-to-apply/plan-your-application/vpd/

### 12.9. TÜBİTAK 2204-A Lise Araştırma Projeleri & Uluslararası STEM Entegrasyonu
- **PM Düzeltmesi:** 2204-A bir yarışmadır ve bütçe desteği vermez. Öncelikli tematik alanı yoktur (12 ana alan, ~70 tema; "kimyasal spektroskopi" diye bir tema bulunmaz). Uluslararası yarışmalara gidecek projeler, ilk üçe girenler arasından ayrı bir jüri tarafından seçilir. **2027 dönemi başvuruları: 28 Eylül 2026 – 4 Ocak 2027.**
- **Gelişme (eski metin; düzeltilmiş hali yukarıda):** TÜBİTAK 2204-A lise araştırma yarışmasında yapay zeka, kimyasal spektroskopi ve malzeme modelleme tematik alanları öncelikli çağrı statüsüne alınmıştır. Derece alan projeler Türkiye üniversite yerleştirmesinde ek katsayı sağladığı gibi, Avrupa Birliği Genç Bilim İnsanları Yarışması (EUCYS) ve Regeneron ISEF'e doğrudan Türkiye milli takımı olarak katılma hakkı tanır. Meberra'nın AP Chemistry spektroskopi ve AP Calculus modelleme birikimi bu çağrı için eşsiz bir projelendirme zemini sunar.

---

## 13. %100 İNGİLİZCE MÜFREDAT VE AKADEMİK DİL ZORUNLULUĞU (Strict 100% English Academic Medium)

> [!IMPORTANT]
> **Kural 13 — İngilizce Ders Anlatımı ve Terminoloji İlkesi:**
> Meberra'nın hedeflediği College Board AP sınavları, Almanya'nın İngilizce lisans programları (TUM, RWTH Aachen) ve İtalya'nın mühendislik fakülteleri (PoliMi, PoliTo, Bologna) %100 İngilizce dilinde icra edilmektedir.
>
> **PM düzeltmesi (15 Ekim 2026, Tur 11 — Ajan 13, QS ilk 20 taraması):** Bu cümle yanlış. RWTH Aachen'de İngilizce lisans programı yok (İngilizce programların hepsi yüksek lisans). Kurumlar "%100 İngilizce" değil; İngilizce olan programlardır: PoliMi'de 29 lisansın 22'si, PoliTo'da 26 lisansın 19'u yalnızca İtalyanca; Bologna'da 118 lisans ve tek döngülü programdan 15'i İngilizce. Güncel liste: `data/mevzuat/kaynak/uni-de.json`, `uni-it.json` (§27).
> Bu sebeple projedeki **tüm konu anlatımları (Comprehensive Lecture Notes), formül açıklamaları, teorik ispatlar, kavramsal analizler ve FRQ rubrikleri istisnasız İNGİLİZCE olmak zorundadır.**

### 13.1. Neden %100 İngilizce Konu Anlatımı?
1. **Sınavda Anlam Kaybının (Translation Loss) Önlenmesi:** Türk müfredatındaki kavramlar (örneğin "türevlenebilirlik", "eylemsizlik momenti", "tampon çözelti", "bağ enerjisi") AP sınavlarında doğrudan "differentiability", "moment of inertia", "buffer solution", "bond dissociation energy" olarak sorulur. Konuyu Türkçe öğrenmek öğrenciye sınav anında çift aşamalı zihinsel tercüme yükü getirir ve süre kaybına yol açar.
2. **Kapsamlı Konu Anlatımı Zorunluluğu ("Konu Anlatımı Şartı"):** Sadece soru çözmek yeterli değildir. Her portalda öğrencinin konunun mantığını derinlemesine kavrayacağı, teoremlerin ön koşullarını (*preconditions*) ve bilimsel modelleri görebileceği **Ayrıntılı İngilizce Ders Notları (Lecture Notes)** bulunmalıdır.
3. **Avrupa Mühendislik Amfilerine Hazırlık:** Meberra Politecnico di Milano veya Münih Teknik Üniversitesi amfisine oturduğu ilk gün kalkülüs ve fizik derslerini İngilizce dinleyecektir. 2 yıllık hazırlık sürecimiz bu akademik dili Meberra'nın ana dili gibi kullanmasını sağlar.

### 13.2. Dil ve Terminoloji Denetim Protokolü
- **Sorumlu Ajan:** Claire Bennett (MA, Oxon) - Kıdemli Akademik İngilizce ve Terminoloji Uzmanı.
- **Denetim Kapsamı:** Tüm portal ders notlarında akademik dil seviyesinin (CEFR C1/C2) korunması, College Board'un puan kırdığı belirsiz ifadelerin (*vague phrasing*) elenmesi, bilimsel terimlerin uluslararası standartlara uygunluğu.

---

## 14. DÖNGÜSEL MÜFREDAT VE 250+ SORU GENİŞLEME PROTOKOLÜ (Continuous Curriculum & 250+ Question Expansion Protocol)

> [!IMPORTANT]
> **Otonom Genişleme Kuralı (Autonomous Iteration Mandate):**
> Kullanıcı her `proje.md` komutunu verdiğinde, 9 uzman yapay zeka ajanı eş zamanlı devreye girer. Sıradaki ders ve ünite devralınarak:
> 1. **Ultra-Kapsamlı Konu Anlatımı (%100 İngilizce - Kural 13):** Teorem tanımları, $\epsilon-\delta$ ispatları, kavramsal modeller ve yaygın çeldiriciler eksiksiz inşa edilir.
> 2. **250+ Soru Hedefli İnteraktif Soru Bankası:** College Board çıkmış sınavları (Past FRQs & MCQs), Almanya Abitur analiz soruları ve İtalya Maturità/TOLC-I sentezi sorular sisteme entegre edilir.
> 3. **Anında Geri Bildirimli Hata ve Telafi Motoru (Diagnostic Remediation Engine):**
>    - Öğrenci bir seçeneğe tıkladığında sistem anında **✅ DOĞRU** veya **❌ YANLIŞ** sonucunu gösterir.
>    - **Yanlış cevap verildiğinde;** sistem sadece doğru şıkkı göstermekle kalmaz; **öğrencinin hangi kavramsal hataya düştüğünü (Error Category), ilgili konunun/teoremin kural özetini (Topic Remediation) ve adım adım basamaklı çözümünü (Step-by-step Solution)** anında ekrana yansıtır!

### 14.1. Ünite İlerleme Tablosu (Gerçek Sayılar — `araclar/pm-denetim.js` çıktısından üretildi, 10 Ekim 2026)

> [!NOTE]
> "Soru" sütunu dosyadaki **gerçek** soru sayısıdır; ünite başına 250+ uzun vadeli **hedeftir**. Bir ünite yalnızca AGENTS.md §2.1'deki PM Doğruluk Kapısı'ndan geçerse (denetim aracı: 0 sorun + PM örneklem kontrolü) onaylı sayılır. **Güncel toplam: 569 soru, 0 denetim sorunu** (10 Ekim 2026, Tur 4; 7 Ekim Tur 3 sonu: 373).

| Faz | Ders & Ünite (güncel CED numarası) | Sorumlu | Soru | Durum |
| :--- | :--- | :--- | :---: | :--- |
| | **AP CALCULUS AB/BC** — `ap-calculus.html` | | **160** | |
| Faz 1 | Unit 1: Limits & Continuity | Prof. Sinan Demir | 15 | ✅ PM Onaylı · Tur 2'de +7 soru |
| Faz 3 | Unit 2: Differentiation: Definition & Fundamental Properties | Prof. Sinan Demir | 15 | ✅ PM Onaylı · Tur 4'te +7 soru |
| Faz 6 | Unit 3: Composite, Implicit & Inverse Functions | Prof. Sinan Demir | 15 | ✅ PM Onaylı · Tur 4'te +7 soru |
| Faz 9 | Unit 4: Contextual Applications of Differentiation | Prof. Sinan Demir | 15 | ✅ PM Onaylı · Tur 4'te +7 soru |
| Faz 13 | Unit 5: Analytical Applications of Differentiation | Prof. Sinan Demir | 15 | ✅ PM Onaylı · Tur 4'te +7 soru |
| Faz 15 | Unit 6: Integration & Accumulation of Change (BC bölümleri işaretli) | Prof. Sinan Demir | 30 | ✅ PM Onaylı (Tur 1) |
| Faz 18 | Unit 7: Differential Equations (Euler, Logistic: BC ONLY; slope field SVG'leri) | Prof. Sinan Demir | 30 | ✅ PM Onaylı (Tur 2) |
| **Faz 25** | **Unit 8: Applications of Integration** (8.13 Arc Length: BC ONLY) | Prof. Sinan Demir | 25 | 🆕 **Tur 4 — PM Onaylı** |
| | **AP PHYSICS 1** — `ap-physics.html` | | **115** | |
| Faz 2 | Unit 1: Kinematics | Dr. Emre Yıldız | 15 | ✅ PM Onaylı · Tur 2'de +7 soru |
| Faz 7 | Unit 2: Force & Translational Dynamics | Dr. Emre Yıldız | 15 | ✅ PM Onaylı · Tur 4'te +7 soru |
| Faz 11 | Unit 2 (cont.): Circular Motion & Gravitation (CED 2.6, 2.9) | Dr. Emre Yıldız | 15 | ✅ PM Onaylı · Tur 4'te +7 soru |
| Faz 14 | Unit 3: Work, Energy, and Power | Dr. Emre Yıldız | 22 | ✅ PM Onaylı (Tur 1) |
| Faz 19 | Unit 4: Linear Momentum | Dr. Emre Yıldız | 23 | ✅ PM Onaylı (Tur 2) |
| **Faz 24** | **Unit 5: Torque and Rotational Dynamics** | Dr. Emre Yıldız | 25 | 🆕 **Tur 4 — PM Onaylı** |
| | **AP CHEMISTRY** — `ap-chemistry.html` | | **119** | |
| Faz 4 | Unit 1: Atomic Structure & Properties | Doç. Dr. Selin Erdem | 15 | ✅ PM Onaylı · Tur 2'de +7 soru |
| Faz 8 | Unit 2: Compound Structure & Properties | Doç. Dr. Selin Erdem | 15 | ✅ PM Onaylı · Tur 4'te +7 soru · chem_u2_q3/q4 CED numaraları güncellendi (2.6/2.7) |
| Faz 12 | Unit 3: Intermolecular Forces & Properties | Doç. Dr. Selin Erdem | 15 | ✅ PM Onaylı · Tur 4'te +7 soru |
| Faz 16 | Unit 4: Chemical Reactions | Doç. Dr. Selin Erdem | 24 | ✅ PM Onaylı (Tur 1) |
| Faz 20 | Unit 5: Kinetics | Doç. Dr. Selin Erdem | 25 | ✅ PM Onaylı (Tur 2) |
| **Faz 26** | **Unit 6: Thermochemistry** | Doç. Dr. Selin Erdem | 25 | 🆕 **Tur 4 — PM Onaylı** |
| | **AP BIOLOGY** — `ap-biology.html` | | **103** | |
| Faz 5 | Unit 1: Chemistry of Life | Dr. Zeynep Aksoy | 15 | ✅ PM Onaylı · Tur 2'de +7 soru · şık uzunlukları dengelendi |
| Faz 10 | Unit 2: Cell Structure & Function | Dr. Zeynep Aksoy | 13 | ✅ PM Onaylı (Tur 1) · şık uzunlukları dengelendi |
| Faz 17 | Unit 3: Cellular Energetics | Dr. Zeynep Aksoy | 24 | ✅ PM Onaylı (Tur 1) · 24 sorunun tamamı yeniden dengelendi |
| Faz 21 | Unit 4: Cell Communication & Cell Cycle | Dr. Zeynep Aksoy | 26 | ✅ PM Onaylı (Tur 2) |
| **Faz 27** | **Unit 5: Heredity** (chi-square dahil) | Dr. Zeynep Aksoy | 25 | 🆕 **Tur 4 — PM Onaylı** |
| | **AP ENGLISH LANGUAGE** — `ap-english.html` | | **32** | |
| Faz 22 | Unit A: Rhetorical Analysis & Reading MCQ (özgün pasajlar) | Claire Bennett | 16 | ✅ PM Onaylı (Tur 2) |
| Faz 23 | Unit B: Writing MCQ (Revision & Composition) | Claire Bennett | 16 | ✅ PM Onaylı (Tur 2) |
| | **AP SEÇMELİLER** — `ap-electives.html` | | **40** | |
| **Faz 29a** | **AP Computer Science A** (2025-26 CED, Unit 1–4) | Barış Özkan | 20 | 🆕 **Tur 4 — PM Onaylı** |
| **Faz 29b** | **AP Microeconomics & Macroeconomics** (10 + 10) | Barış Özkan | 20 | 🆕 **Tur 4 — PM Onaylı** |
| | **TOPLAM** | | **569** | |

### 14.2. Sıradaki Üniteler (Backlog — Tur 11)
> Tur 10 (§26) platform ve mevzuat turuydu. Aşağıdaki içerik fazları (34–37, CS A, Ekonomi, English) hâlâ bekliyor.

**Tur 9'da tamamlananlar (§25):**
- Faz 28: English FRQ istasyonu + Skill 8
- Faz 30: Physics 1 Unit 6
- Faz 31: Calculus BC Unit 9
- Faz 32: Chemistry Unit 7
- Faz 33: Biology Unit 6
- Biology Unit 2 → 18 soru
- CS A ve Ekonomi havuzları (48 / 65)

| Sıra | Ünite | Not |
| :--- | :--- | :--- |
| Faz 34 | AP Calculus BC — Unit 10: Infinite Sequences and Series | BC ONLY; Calculus'ta son eksik ünite |
| Faz 35 | AP Chemistry — Unit 8: Acids and Bases | %11–15; 8.11 (nitel pH–çözünürlük) burada işlenmeli |
| Faz 36 | AP Biology — Unit 7: Natural Selection | %13–20; portalda henüz yok |
| Faz 37 | AP Physics 1 — Unit 7: Oscillations | Ardından Unit 8: Fluids |
| Sonra | Chemistry Unit 9 (Thermodynamics/Electrochemistry), Biology Unit 8 (Ecology), Physics 1 Unit 8 (Fluids) | Kalan CED üniteleri |
| Sonra | CS A — 2025-26 CED'e yeni giren konular: 4.1–4.2 (veri setleri, etik), 4.6 (metin dosyaları), 4.7 (wrapper sınıfları) | Şu an sorusu yok |
| Sürekli | Ekonomi zayıf üniteleri: Micro 1 (2), Micro 2 (5), Macro 2 (4), Macro 3 (4) → her biri 6+ | Ders bazlı denemede çeşitlilik |
| Sürekli | English: kategori 2, 5, 7 (4'er soru) → 6+ | |
| Sonra | Physics C için deneme kodu (`physics-c`) ve havuz | Şu an deneme kodu yok; 6 Physics C sorusu bekliyor |
| Sonra | Seviye testi: Physics C, CS A, Ekonomi tanı bankaları | |
| Ajan 11 | Yedekte "birleştir" modunda `apmeberra:frq:v1` için `guncelleme` alanına göre birleştirme | Şu an cihazdaki taslak korunuyor (§25.3) |
| Ajan 11 (Tur 10 sonrası) | Klasör adı değişince test betiklerindeki mutlak yollar (`AP AZRA` → `AP MEBERRA`) ve `ad-denetimi.js` `PATH_ALLOW` | §26.8; yeni oturumun ilk işi |
| Ajan 11 | Kilitli sayfalarda kalan "Meberra" hitapları ve "AP Meberra Mentorship System" altbilgisi | §26.6 |
| Ajan 11 | Taşıma sonrası ilk açılışta tema yanıp sönmesi (`<head>` tema betiği eski anahtarı da okusun) | §26.7 |
| Ajan 12 | Soruları `ap-*.html`'den `data/sorular/ders/<ders>.js`'e ayırma (HARITA.md §3, 2. aşama) | Şema değişmez |
| Ajan 13 + PM | Mezun Menüsü'ne Avusturya ve Hollanda (T-D1/T-D2 teyit yanıtları gelince); Polonya "Teyit gerekir" rozetinin kaldırılması | §26.5 (K-A) |
| Ajan 11 | `styles.css` sadeleştirme (eski bileşen tanımları ve açık tema yamaları) | §23.6 |
| Ajan 13 | Takip listesi: 31 Ekim CISIA kuralları; Kasım PoliMi 2027/28 çağrısı ve ÖSYM 2027 takvimi | `.agents/mevzuat/takip-listesi.md` |

### 14.3. Bilinen Kalite Notları
- **Dil tercihi:** Soru metinleri İngilizce, yanlış şık açıklamaları Türkçe (İngilizce terimlerle). Bu, Kural 13'ün "%100 İngilizce" ifadesiyle kısmen çelişir. Karar Lead PM ve Claire Bennett'e aittir; şimdilik mevcut düzen korunuyor.
- **Tur 1 şık dağıtma hatası (düzeltildi):** Eski soruların doğru şıkları yeniden dağıtılırken 8 sorunun çözüm metninde eski harf kalmıştı. Denetim aracı artık çözüm metnindeki harf ile işaretli doğru şıkkın uyuşmasını otomatik kontrol ediyor.
- **Kaynak etiketi:** English, CED'de konu (topic) yerine beceri (skill) numaralarıyla düzenlendiği için `AP-style original (CED Skill x.y — …)` biçimini kullanıyor.

---

## 15. TÜM AJANLARIN TAM OTONOM GÖREV İCRASI (AUTONOMOUS AGENT TASK EXECUTION PROTOCOL)

> [!IMPORTANT]
> **Otonom Görev İcrası İlkesi (Self-Governing Agent Mandate):**
> Sistemdeki tüm yapay zeka ajanları, manuel yönlendirmeye veya mikro-yönetime ihtiyaç duymaksızın kendilerine tanımlanan uzmanlık görevlerini **kendi kendilerine (otonom olarak)** eksiksiz icra ederler. Her ajan kendi etki alanındaki veri taramasını, analizini, içerik üretimini ve kalite kontrolünü bağımsız olarak yürütür:

1. **Dr. Aylin Kaya (Lead PM):**
   - Meberra'nın 11. sınıftaki okul dersleri (OBP) ile AP hazırlığı arasındaki haftalık 15-18 saatlik derin çalışma (Deep Work) bloklarını otonom optimize eder.
   - Bilişsel aşırı yüklenme (cognitive overload) ve tükenmişlik (burnout) risklerini önceden tespit edip dinlenme ve toparlanma periyotlarını otomatik planlar.
2. **Dr. Marcus Weber & Elena Rossi (Avrupa Kabul & Mevzuat):**
   - KMK Anabin ve Universitaly/CIMEA mevzuat değişikliklerini otonom tarar.
   - Almanya'nın %100 İngilizce lisans programlarında ve İtalya teknik üniversitelerinde güncellenen kontenjan ve vize şartlarını eş zamanlı denetler.
3. **Canan Yılmaz (AP Sınav Stratejisti):**
   - College Board Bluebook yazılım güncellemelerini, test merkezi Join Code kontenjanlarını ve sınav günü protokollerini otonom takip eder.
4. **STEM Branş Eğitmenleri (Prof. Sinan Demir, Dr. Emre Yıldız, Doç. Dr. Selin Erdem, Dr. Zeynep Aksoy):**
   - Sıradaki ünitelerin ultra-kapsamlı konu anlatımlarını, formül sayfalarını, teorem ispatlarını ve 250+ soru hedefli interaktif hata teşhis motorunu otonom inşa eder.
5. **Claire Bennett (MA, Oxon - Kural 13 Koruyucusu):**
   - Tüm eğitim materyallerinin, teorem tanımlarının ve FRQ rubriklerinin eksiksiz ve hatasız %100 İngilizce (CEFR C1/C2) olmasını otonom garanti eder.
   - IELTS Academic 8.5 seviyesinde bilimsel yazım ve kompozisyon kurallarını uygular.
6. **Barış Özkan (CS & Ekonomi):**
   - AP Computer Science A Java kodlama pratiklerini, nesne yönelimli programlama (OOP) ve AP Ekonomi piyasa modellerini otonom yönetir.
7. **Önceki Görevlerin ve Proje Gelişiminin Kesintisiz Sürmesi Güvencesi:**
   - Ajanların otonom görev icrası esnasında, projenin daha önce belirlenen müfredat gelişim hedefleri, ünite genişleme takvimi (Faz 1 - Faz 17 tamamlandı; Faz 18+ backlog, bkz. §14.2), interaktif portal geliştirmeleri ve üniversite kabul hazırlıkları hiçbir kesintiye uğramadan eş zamanlı ve paralel olarak devam eder.

---

## 16. DESTEK, HİBE VE BURS PROJE HAZIRLAMA UZMANI AJAN SİSTEMİ VE ÇAĞRI BAZLI GÜNCELLEME PROTOKOLÜ (GRANT & FUNDING PROPOSAL SPECIALIST AGENT ARCHITECTURE)

> [!TIP]
> **Profesyonel Proje Hazırlama Uzmanlığı Standardı:**
> Destek ve hibe araştırma ajanı, yalnızca pasif burs web linkleri derleyen bir arama motoru gibi değil; **yetkin bir "Destek Proje Hazırlama Uzmanı" (Senior Grant Proposal & Project Design Specialist)** sıfatıyla hareket eder. Öğrencinin akademik profilini, AP derslerini ve bilimsel yetkinliklerini ulusal ve uluslararası fon sağlayıcıların resmi hibe formatlarına dönüştürerek doğrudan teslim edilebilir nitelikte profesyonel proje dosyaları hazırlar.

### 16.1. Hazırlanan Destek Proje Dosyası Mimarisi (Profesyonel Şartname Standardı)
Ajan, her destek başvurusu için fon sağlayıcının resmi başvuru kılavuzuna (Guide for Applicants) tam uyumlu şu 8 ana bileşeni sıfırdan oluşturur:
1. **Proje Başlığı ve Yönetici Özeti (Executive Summary & Project Abstract):** Projenin amacı, yöntemi, beklenen somut çıktıları ve ulusal/uluslararası katkısı.
2. **Arka Plan, Problem Tanımı ve Literatür Taraması (Statement of Need & Scientific Background):** Çözülmek istenen problemin güncelliği, literatürdeki boşluklar ve Meberra'nın projesinin getirdiği çözüm.
3. **Özgün Değer ve Yenilikçi Yön (Scientific Novelty & Innovation):** Projenin mevcut benzerlerinden farkı, teknolojik/bilimsel katma değeri ve AP STEM bilgisinin projeye entegrasyonu.
4. **Yöntem ve İş Paketleri (Methodology & Work Packages - WP1, WP2, WP3):**
   - *WP1:* Literatür Taraması, Veri Toplama ve Model Tasarımı.
   - *WP2:* Deneysel Prototipleme, Matematiksel Modelleme / Kodlama ve Simülasyon.
   - *WP3:* Test, Hata Analizi, Validasyon ve Raporlama.
5. **Zaman Planı ve Kilometre Taşları (Gantt Chart & Key Milestones):** Hafta hafta iş akışı, kritik karar noktaları (Go/No-Go) ve teslim edilecek ara raporlar.
6. **Ayrıntılı Bütçe Tablosu ve Finansal Gerekçelendirme (Itemized Budget Breakdown & Financial Justification):** Sarf malzeme, yazılım lisansı, test/analiz giderleri, seyahat ve katılım maliyetlerinin gerekçeli dökümü.
7. **Risk Analizi, B Planı ve Etik Kurul Uyumu (Risk Mitigation Matrix & Ethical Compliance):** Olası metodolojik/teknik riskler, her bir risk için geliştirilen acil durum senaryoları ve veri güvenliği önlemleri.
8. **Yaygın Etki, Sürdürülebilirlik ve Çıktı Paylaşımı (Impact, Dissemination & Exploitation Plan):** Bilimsel makale yazımı, açık kaynak kod paylaşımı, ulusal lise bilim fuarı sunumu ve fikri mülkiyet (patent/faydalı model) potansiyeli.

### 16.2. Her Güncellemede Otomatik Tarama ve Çağrı Bazında Ayrı Ayrı Güncelleme Protokolü
Ajan, sistem her güncellendiğinde veya `proje.md` çağrıldığında ulusal ve küresel fon portallarını otomatik tarar. Yeni bir çağrı yayımlandığında veya takvim güncellendiğinde **tüm başvuruları tek bir genel metne sıkıştırmak yerine HER BİR ÇAĞRI İÇİN AYRI AYRI BAŞVURU DOSYASI / MODÜLÜ** üretir ve günceller:

| Çağrı Kodu & Başvuru Modülü | Fon Kuruluşu / Destek Programı | Destek Kapsamı & Bütçe | Proje Hazırlama Uzmanı Görevi | Güncelleme & Tarama Periyodu |
| :--- | :--- | :--- | :--- | :--- |
| **[MODÜL-A: TÜBİTAK 2204-A](file:///c:/Users/hp/Desktop/AP%20AZRA/grants/MODUL-A-TUBITAK-2204A.md)** | TÜBİTAK Lise Öğrencileri Araştırma Projeleri Yarışması | Proje geliştirme desteği, para ödülü, üniversite sınavı ek katsayı / doğrudan kabul | AP Calculus & Physics destekli Yapay Zeka / Mühendislik araştırma proje metnini, literatür taramasını ve rapor formatını hazırlar. | [MODUL-A-TUBITAK-2204A.md](file:///c:/Users/hp/Desktop/AP%20AZRA/grants/MODUL-A-TUBITAK-2204A.md) dosyasında her güncellemede ayrı güncellenir. |
| **[MODÜL-B: İtalya DSU / EDISU](file:///c:/Users/hp/Desktop/AP%20AZRA/grants/MODUL-B-ITALYA-DSU-BURSU.md)** | İtalya Bölgesel Üniversite Bursları (Lombardia, Piemonte, Lazio) | Yıllık 8.000€ - 8.500€ karşılıksız burs + ücretsiz yurt + yemek hakkı | ISEE Parificato gelir sınırlarını (26.887,93€ tavanı), İtalyan konsolosluk apostil ve CAF doğrulama dosyalarını ayrı ayrı optimize eder. | [MODUL-B-ITALYA-DSU-BURSU.md](file:///c:/Users/hp/Desktop/AP%20AZRA/grants/MODUL-B-ITALYA-DSU-BURSU.md) dosyasında bando duyurularına göre güncellenir. |
| **[MODÜL-C: DAAD & Almanya Vakıfları](file:///c:/Users/hp/Desktop/AP%20AZRA/grants/MODUL-C-DAAD-ALMANYA.md)** | DAAD Studienbeihilfe, Deutschlandstipendium, Friedrich Ebert Vakfı | Aylık 300€ - 934€ hibe ve mentorluk ağı | Akademik portfolyo, niyet mektubu (Letter of Motivation) ve AP transkript bazlı akademik başarı dosyasını hazırlar. | [MODUL-C-DAAD-ALMANYA.md](file:///c:/Users/hp/Desktop/AP%20AZRA/grants/MODUL-C-DAAD-ALMANYA.md) dosyasında çağrılara göre güncellenir. |
| **[MODÜL-D: Erasmus+ & Horizon Youth](file:///c:/Users/hp/Desktop/AP%20AZRA/grants/MODUL-D-ERASMUS-KA152.md)** | Avrupa Komisyonu Gençlik Değişimleri (KA152) & Horizon Genç Araştırmacı Fonları | %100 seyahat, konaklama ve proje uygulama hibesi | Çok uluslu gençlik STEM projesi hibe formunu, öğrenme çıktılarını (Youthpass) ve ortaklık mutabakatını hazırlar. | [MODUL-D-ERASMUS-KA152.md](file:///c:/Users/hp/Desktop/AP%20AZRA/grants/MODUL-D-ERASMUS-KA152.md) dosyasında dönem bazında ayrı güncellenir. |
| **MODÜL-E: Uluslararası STEM & Vakıf Fonları** | TEV Üstün Başarı Bursu, Google Generation Scholarship, NYAS Junior Academy | Eğitim bursu, uluslararası konferans desteği ve araştırma mentorluğu | İngilizce araştırma özeti, bilimsel essay'ler ve liderlik gerekçelendirmesini hazırlar. | Kurumların resmi başvuru pencereleri açıldığında ayrı ayrı güncellenir. |

### 16.3. Mevcut Görevler ve Proje Gelişiminin Kesintisiz Sürmesi İlkesi
- Destek proje hazırlama uzmanı ajanının yürüttüğü bu hibe yazımı ve çağrı tarama faaliyetleri, **mevcut AP müfredat geliştirme (Faz 1–17 tamamlandı, 209 soru; ünite başına 250+ uzun vadeli hedef), konu anlatımları, interaktif hata teşhis motoru, okul OBP dengesi ve üniversite kabul takvimine asla engel olmaz; tüm görevler paralel ve kesintisiz devam eder.**

---

## 17. 7 EKİM 2026 GELİŞTİRME TURU — EKLENEN ÖZELLİKLER (PM Onaylı)

### 17.1. Yeni Ajan
- **Ajan 11 — Frontend & UX Tasarım Sorumlusu** (`frontend-tasarimci`) kadroya eklendi (AGENTS.md §2, roster). Arayüz, okunabilirlik ve soru motoru arayüzünden sorumludur; ders içeriğine dokunmaz.
- **PM Doğruluk Kapısı** (AGENTS.md §2.1) getirildi: bağımsız cevap doğrulaması, dürüst kaynak etiketi, kaynaklı mevzuat bilgisi ve gerçek sayılarla raporlama.

### 17.2. İçerik (4 yeni ünite, +105 soru → toplam 209)
| Ders | Yeni Ünite | Yeni Soru | Mevcut Sorulardaki Düzeltmeler |
| :--- | :--- | :---: | :--- |
| AP Physics 1 | Unit 3: Work, Energy, and Power | 22 | Müfredat güncel CED'e göre yeniden numaralandı (Circular Motion → Unit 2 cont.). PLR kaldırıldı, 4 güncel FRQ türü eklendi. MCQ formatı güncellendi. 5 soruda LaTeX kaçış hatası giderildi. |
| AP Calculus AB/BC | Unit 6: Integration & Accumulation of Change (BC-only bölümler işaretli) | 30 | calc_u5_q3 grafik çelişkisi; calc_u4_q1 ve q3'te iki doğru şık sorunu; calc_u4_q6'da tekrarlanan şık; LaTeX hataları; Türkçe kalmış şıklar. |
| AP Chemistry | Unit 4: Chemical Reactions | 24 | chem_u1_q7 çeldirici değerleri, chem_u1_q8 kütle tutarsızlığı, chem_u3_q7 sayısal hatalar, chem_u3_q8 bilgi hatası, LaTeX/TAB hataları. |
| AP Biology | Unit 3: Cellular Energetics (+5 soru Unit 2'ye) | 29 | bio_u2_q4 (Brefeldin A mekanizması), bio_u2_q5 (ouabain bağlanma bölgesi), CED topic numaraları. |

**Tüm derslerde:** Eski 88 sorunun hepsinde doğru şık "A" idi; dağılım dengelendi. "College Board Official Exam" gibi yanıltıcı kaynak etiketleri `AP-style original (CED Topic x.y)` biçimine çevrildi. Ham Markdown `**` işaretleri HTML'e dönüştürüldü.

### 17.3. Arayüz ve Özellikler
1. **Ortak menü:** Tüm sayfalarda aynı menü; Dersler açılır listesi; klavyeyle kullanılabilir; mobilde hamburger menü.
2. **Açık/koyu tema:** Sistem tercihine uyar; seçim sayfalar arasında korunur.
3. **Kalıcı soru motoru:** Cevaplar sayfa yenilenince korunur. Her ünitede ilerleme çubuğu, "Sadece yanlışlarımı tekrar çöz" filtresi, A–E tuşlarıyla seçim ve ekran okuyucu desteği var. Ünite sayaçları artık birbirine karışmıyor.
4. **Hata Defteri:** Her yanlış soru; ünite, konu, hata kategorisi ve tarihle kaydedilir. Sonradan doğru çözülürse "düzeltildi" olarak işaretlenir.
5. **İlerleme Panosu (`ilerleme.html`):** Ders ve ünite bazında §9.5'teki Kırmızı/Sarı/Yeşil bölgeler otomatik hesaplanır.
6. **Bilgi Merkezi (`bilgi-merkezi.html`):** 20 doğrulanmış madde (12 Doğrulandı, 7 Dikkat, 1 Doğrulanamadı); her maddede resmi kaynak bağlantısı var.
7. **Ana sayfa:** "Bugün ne yapmalıyım?" önerileri kayıtlı ilerlemeden hesaplanır; AP 2027 geri sayımı doğrulanmış tarihe göre çalışır.
8. **Doğruluk uyarıları:** KMK hesaplayıcısı artık koşulsuz "doğrudan kabul" sonucu vermiyor. Almanya sayfasına ve 4 hibe modülüne PM doğrulama notları eklendi.

### 17.4. Doğrulama Kanıtı
- 4 ders dosyasında tüm soru dizileri node ile çalıştırıldı: her soruda tek doğru şık, A–D sırası ve benzersiz id doğrulandı. Sayısal cevaplar python/sympy ve node ile bağımsız hesaplandı. PM, her dersten 4 soruluk örneklemi elle yeniden hesapladı.
- Playwright testi: 13 sayfa × 1280/390 px × açık/koyu temada sayfa hatası ve yatay kaydırma yok. Etkileşim testlerinin tamamı geçti.

### 17.5. Açık Riskler ve Bekleyen Kararlar
- **Almanya stratejisi:** Türk diploması + AP yolu için hedef üniversitelerden ve uni-assist'ten yazılı teyit alınmalı. YKS'ye girip bir programa yerleşmek, hem Almanya hem İtalya için güvence olarak planlanmalı.
- **Kural 13 çelişkisi:** Soru açıklamaları Türkçe. Bu anlaşılırlığı artırıyor ama "%100 İngilizce" kuralıyla çelişiyor; karar Lead PM ve Claire Bennett'te.
- **Almanya/İtalya top-20 tabloları:** Yalnızca 6 program kontrol edildi. Kalan programların dil ve şart bilgileri doğrulanmalı (THWS Robotics'in tamamen İngilizce bitirilip bitirilemeyeceği belirsiz; PoliMi'nin İngilizce Biomedical/Materials lisansı bulunamadı).
- **İlerleme verisi** yalnızca kullanılan tarayıcıda saklanır; cihazlar arasında taşınmaz.

---

## 18. TUR 2 (7 EKİM 2026) — EKLENEN ÖZELLİKLER VE DÜZELTMELER (PM Onaylı)

### 18.1. İçerik: 209 → 373 soru (+164), denetim 0 sorun
| Ders | Bu Turda Eklenen | Sayfa Toplamı |
| :--- | :--- | :---: |
| AP Calculus | Unit 7: Differential Equations (30; slope field SVG'leri 146 segmentte sayısal doğrulandı) + Unit 1'e 7 soru | 107 |
| AP Physics 1 | Unit 4: Linear Momentum (23) + Unit 1'e 7 soru | 76 |
| AP Chemistry | Unit 5: Kinetics (25) + Unit 1'e 7 soru | 80 |
| AP Biology | Unit 4: Cell Communication & Cell Cycle (26) + Unit 1'e 7 soru | 78 |
| AP English Language | **İlk soru istasyonları:** Reading MCQ (16) + Writing MCQ (16), özgün pasajlarla | 32 |

**Kalite düzeltmeleri:**
- **"Doğru şık hep en uzun" kalıbı giderildi.** Biyoloji Unit 3'te 24/24, Unit 2'de 12/13 soruda doğru şık belirgin biçimde en uzundu; diğer derslerde de benzer üniteler vardı. Öğrenci konuyu bilmeden en uzun şıkkı seçerek tam puan alabiliyordu. Cevap anahtarı değişmeden şık uzunlukları dengelendi.
- **8 çözüm metni düzeltildi.** Tur 1'deki şık dağıtma sırasında 8 sorunun çözüm metninde eski harf kalmıştı. Fizik ajanı ve genişletilmiş tarama ile bulunup düzeltildi.
- **AP English sayfasındaki 11 hata düzeltildi.** Örnekler: uydurma Florence Kelley alıntıları ve yanlış bağlam, yanlış rubrik adları, eksik sınav formatı (45 MCQ/1 saat; 3 FRQ/2 saat 15 dk; Thesis 0–1, Evidence & Commentary 0–4, Sophistication 0–1), kimya sayfasına giden yanlış bağlantı.
- **bio_u3_q22 çeldirici değerleri** ilgili hatanın gerçek sonucuyla değiştirildi.

### 18.2. Doğrulama: Üniversite Listeleri Yeniden Kuruldu
- **Almanya:** Eski 29 programlık listenin çoğu Almanca, kapanmış ya da yalnızca yüksek lisans düzeyinde İngilizceydi. Yerine **15 doğrulanmış program** kondu (§5.2): 9 Doğrulandı, 6 Kısmen.
- **İtalya:** Eski listedeki 9 üniversitenin İngilizce mühendislik lisansı yoktu. Yerine **10 doğrulanmış program** kondu (§6.2). Sınav yolları programa göre ayrıldı: TIL-I, CEnT-S, kendi sınavı, SAT.
- **Yeni kritik bulgular:**
  - Bazı "tamamen İngilizce" Alman programları **Almanca A2** istiyor.
  - Bavyera'da AB dışı öğrenciler harç ya da hizmet ücreti ödüyor.
  - **İlk CEnT-S oturumları 26 Kasım ve 17 Aralık 2026.** (12 Ekim 2026 notu: bu oturumlar 2027/28 kaydı içindir; Meberra'nın 2028/29 kaydı için geçersiz — bkz. §0.1 ve §21.3.)
- **PM örneklem kontrolü:** 4 iddia resmi sayfalardan bizzat doğrulandı (DIT A2, Pisa'da İngilizce mühendislik lisansı olmaması, Padova CEnT-S ve 2.950 €, UDE ISE'nin kapanması); 4'ü de doğru çıktı.
- **Portalda güncellenenler:**
  - Sayfalar: `almanya-muhendislik.html`, `italya-muhendislik.html` ve `istanbul-sinav-rehberi.html` doğrulanmış verilerle yeniden yazıldı.
  - Ajan yanıtları ve konsey tartışmaları (`app.js`) düzeltildi.
  - Yanlış veri içeren kullanılmayan İtalya eşleştiricisi (`ITALY_DATA`) kaldırıldı.
  - Bilgi Merkezi: 20 → **26 madde**.

### 18.3. Yeni Özellikler
1. **PM denetim aracı** (`araclar/pm-denetim.js`): 12 kural; teslim şartı 0 sorun (AGENTS.md §2.1 madde 5).
2. **İlerlemeyi Yedekle / Taşı** (`ilerleme.html`):
   - Çözülen sorular ve Hata Defteri bir JSON dosyasına aktarılır, başka cihazda ya da tarayıcıda geri yüklenir.
   - **Birleştir** modunda veri kaybı olmaz: aynı soruda yeni cevap kazanır, hata sayılarında büyük olan alınır, "düzeltildi" bilgisi korunur.
   - Bozuk ya da yabancı dosyada hiçbir veri değişmez.
   - Son yedeğin üzerinden 7 günden fazla geçtiyse hatırlatma gösterilir.
3. **Sunum paketi** (`araclar/sunum-olustur.js` → `sunum/`):
   - Tek komutla taşınabilir, internetsiz çalışan zip üretilir.
   - Formül motoru (MathJax 3.2.2) pakete gömülü.
   - SHA-256 bütünlük listesi ve `dogrula.ps1` ile alıcı paketi kendisi doğrulayabilir.
   - Zip açılıp her dosya yeniden doğrulanır.
   - PM denetimi temiz değilse paket üretilmez.

### 18.4. Doğrulama Kanıtı
- `node araclar/pm-denetim.js` sonucu: **373 soru, 0 sorun**. PM, her yeni üniteden örneklem alıp cevapları elle yeniden hesapladı (8/8 doğru).
- **Tarayıcı regresyonu:**
  - Frontend etkileşim testleri: tamamı geçti.
  - Yedekleme testleri: 51/51 geçti.
  - Ülke sayfaları: 4 sayfa × 2 genişlik × 2 tema, 0 hata.
- **Paket testi (internet tamamen kapalı):**
  - 23 soru istasyonunun tamamı yüklen
---

## 19. TUR 3 (7 EKİM 2026) — SEVİYE TESTİ VE SINAV HAZIRLIK RAPORU (PM Onaylı)

### 19.1. Amaç
Öğrenci, AP sınav kaydından önce (son gün **13 Kasım 2026**) siteye girip seviye testi çözer. Site ona şunları içeren bir rapor üretir:
- hangi derste ve hangi ünitede ne kadar hazır olduğu,
- sınava kalan sürede açıkların kapanıp kapanamayacağı,
- kayıt ve sınav günü için eksikleri ve gerekenler.

### 19.2. PM Tasarım Kararları (doğruluk için)
1. **Tanı testi dersin tamamını kapsar.** Portaldaki soru bankası yalnızca işlenen üniteleri kapsadığı için ayrı bir tanı bankası yazıldı. Her CED ünitesinde 3 soru (kolay / orta / zor) var. Portalda henüz içeriği olmayan üniteler raporda "ek kaynak gerekir" diye işaretlenir.
2. **Rapor AP puanı tahmini yapmaz.** Kısa bir tanı testi puan tahmini için yeterli değildir. Raporun en üstünde "Bu rapor AP puanı tahmini değildir" uyarısı yer alır.
3. **Hesap yöntemi raporda yazılı ve değiştirilebilir:**
   - Skor ağırlıkları: kolay 1, orta 1.5, zor 2.
   - Bant: <%50 Kırmızı, %50–74 Sarı, ≥%75 Yeşil.
   - Gereken çalışma: Kırmızı ünite 10 sa, Sarı 5 sa, Yeşil 1.5 sa; ders başına ayrıca 4 deneme × 3.5 sa.
   - Kullanılabilir süre: (kalan hafta − 2 haftalık tampon) × (haftalık saat ÷ ders sayısı).
   - Sonuç: ✅ yetişir / ⚠️ sıkı (≤ %120) / ❌ yetişmez.
   - Haftalık 18 saat tavanı aşılırsa uyarı verilir (Lead PM kuralı).
4. **Tarih ve gereklilikler yalnızca doğrulanmış kaynaktan gelir.** Tarihi bilinmeyen bir derste rapor hesap yapmaz ve "tarih doğrulanmadı" yazar; varsayılan tarih uydurulmaz.

### 19.3. Tanı Bankaları: 153 soru, denetim 0 sorun
| Ders | Ünite | Soru | Portalda içerik olmayan üniteler |
| :--- | :---: | :---: | :--- |
| AP Calculus AB | 8 | 24 | Unit 8 |
| AP Calculus BC | 10 | 30 | Unit 8, 9, 10 |
| AP Physics 1 | 8 | 24 | Unit 5–8 |
| AP Chemistry | 9 | 27 | Unit 6–9 |
| AP Biology | 8 | 24 | Unit 5–8 |
| AP English Language | 8 (4 Big Idea × Reading/Writing) | 24 | — |

**PM düzeltmeleri:**
- **Ünite sınav ağırlıkları** College Board'un güncel resmi ders sayfalarıyla tek tek karşılaştırıldı. Ajanların bilgiden yazdığı Calculus AB/BC ağırlıkları eski CED'e aitti; resmi değerlerle düzeltildi (ör. AB Unit 1: 10–15%, BC Unit 10: 15–20%). `ap-calculus.html`'deki eski ağırlık ifadeleri de düzeltildi.
- **Kimya ünite adları** güncel CED'e göre güncellendi:
  - Unit 2: Compound Structure and Properties.
  - Unit 3: Properties of Substances and Mixtures.
  - Unit 6: Thermochemistry.
  - Unit 9: Thermodynamics and Electrochemistry.
  - Ders sayfasındaki başlıklar da güncellendi; eski adlar parantez içinde bırakıldı.
- **Biology Unit 2'nin güncel resmi adı** "Cells".
- **Denetim aracı yeni kontrollerle genişletildi:** her ünitenin en az 3 soru ve farklı zorlukla kapsanması, soru bankasından kopya soru. Kopya kontrolü bir Calculus BC Euler sorusunu yakaladı; soru yenisiyle değiştirildi.
- **PM örneklem kontrolü:** 20 tanı sorusu elle yeniden hesaplandı; hepsi doğru.

### 19.4. Doğrulanmış Takvim ve Gereklilikler (`data/sinav-takvimi.js`)
- **Sınav tarihleri ve oturumlar:** 13 dersin tarihi ve oturumu var. Türkiye için (UTC+3) Session 1 saat 10:00, Session 2 saat 14:00.
  - Biology: **3 Mayıs** (S2)
  - Physics 1: 5 Mayıs (S2)
  - Chemistry: 6 Mayıs (S2)
  - Calculus AB/BC: 10 Mayıs (S1)
  - English Language: 12 Mayıs (S1)
- **16 kaynaklı gereklilik:** dış aday kaydı, join code, My AP kayıt onayı, Bluebook cihaz şartları, hibrit FRQ, hesap makinesi, kimlik, getirilecek ve getirilmeyecek eşyalar, puan açıklama, ücretsiz puan gönderimi (20 Haziran 2027), SSD (22 Ocak 2027).
- **Yeni kritik bulgular (PM bizzat doğruladı):**
  - **2027 AP Biology'de grafik hesap makinesi yasak**; yalnızca dört işlemli ya da bilimsel hesap makinesi kullanılabilir.
  - **Türkiye için College Board'un listelediği yetkili test merkezi Prometric.** Okullarda yer bulunamazsa kullanılacak resmi yedek yol budur.
  - §3.1'deki İstanbul okul listesinin dış aday kabul ettiği resmi olarak doğrulanmadı; uyarı eklendi.

### 19.5. Arayüz (Ajan 11)
- **Başlangıç:** ders seçimi (AB/BC'den yalnızca biri), haftalık saat (5–18), isteğe bağlı süreli mod, tahmini süre.
- **Test:**
  - Test sırasında doğru/yanlış gösterilmez. "Bilmiyorum" seçilen soru cevapsız sayılır ve raporda ayrıca listelenir.
  - Klavyeyle kullanılabilir.
  - Yarıda bırakılan test kaldığı yerden sürer.
- **Rapor:**
  - a. Özet: kayıt son gününe ve sınavlara kalan süre.
  - b. Ders ve ünite tablosu.
  - c. Fizibilite: varsayımlar düzenlenebilir.
  - d. Kayıt önerisi.
  - e. Öncelik listesi: ağırlık × açık oranına göre.
  - f. İşaretlenebilir kontrol listesi.
  - g. Yanlış soruların çözümleri.
  - Rapor yazdırılabilir; son 5 rapor saklanır ve önceki raporla karşılaştırılabilir.
- **Entegrasyon:**
  - Ana sayfadaki "Bugün ne yapmalıyım?" listesi kayıt son gününe göre seviye testini öneriyor.
  - İlerleme sayfası son raporun özetini gösteriyor.
  - Raporlar yedekleme ve taşıma dosyasına dahil.

### 19.6. Doğrulama Kanıtı
- **Frontend uçtan uca testi:** 104 kontrol geçti (örnek ve gerçek veri; süreli mod, geç kayıt, eksik dosya, yedekleme senaryoları).
- **PM bağımsız kabul testi (gerçek Calculus AB bankasıyla):** Unit 1–7 doğru, Unit 8 yanlış senaryosunda rapor beklenen değerleri verdi:
  - Ünite bantları doğru.
  - Genel skor 31.5/36 (%88 gösterim).
  - Gereken 34.5 sa, kullanılabilir 420 sa (215 gün → 28 hafta × 15).
  - Karar "Kaydol"; öncelik listesinin ilki Unit 8.
  - Kontrol listesi 16/16.
- **Regresyon:**
  - Soru motoru, yedekleme, ülke sayfaları ve seviye testleri: tamamı geçti.
  - Denetim aracı: 373 soru + 153 tanı sorusu, 0 sorun.

### 19.7. Bilinen Sınırlamalar ve Sonraki Adımlar
- **Varsayımlar:** Saat varsayımları (10 / 5 / 1.5 sa) bir planlama varsayımıdır, ölçülmüş değil. Lead PM ve öğretmenle birlikte kalibre edilmeli; raporda değiştirilebilir.
- **Portal bağlantıları:** Bağlantılar ders sayfasına gidiyor ama ilgili ünite bölümüne doğrudan atlamıyor (ünite çapası henüz yok).
- **Kapsanmayan sınavlar:** Physics C, CS A ve Ekonomi için tanı bankası yok (backlog).

## 20. TUR 4 (10 EKİM 2026) — YENİ ÜNİTELER, SEÇMELİ İSTASYONLARI VE ÜNİTE ÇAPALARI (PM Onaylı)

### 20.1. İçerik: 373 → 569 soru (+196), denetim 0 sorun
| Ders | Yeni | Genişletme | Sayfa toplamı |
| :--- | :--- | :--- | :---: |
| Calculus | Unit 8 Applications of Integration: anlatım (8.1–8.13, alan SVG'si) + 25 soru | Unit 2–5: 8 → 15 (+28) | 160 |
| Physics 1 | Unit 5 Torque and Rotational Dynamics: anlatım (5.1–5.6) + 25 soru | Unit 2 ve 2 (cont.): 8 → 15 (+14) | 115 |
| Chemistry | Unit 6 Thermochemistry: anlatım (6.1–6.9) + 25 soru | Unit 2–3: 8 → 15 (+14) | 119 |
| Biology | Unit 5 Heredity: anlatım (5.1–5.6, ayrı chi-square kartı) + 25 soru | — | 103 |
| Seçmeliler | İlk istasyonlar: CS A 20 soru (2025-26 CED Unit 1–4) + Micro/Macro 20 soru | — | 40 |

- Her doğru cevap ve her çeldirici değeri ajanlar tarafından proje dışı Python (sympy/Fraction) ile bağımsız hesaplandı. CS A kod izleme soruları Java semantiğine sadık Python çevirisiyle çalıştırıldı (sistemde `javac` yok).
- **PM örneklem kontrolü:** 15 soru (Calc u8 q4/q9/q17/q25, Phys rot q6/q13/q19, Chem u6 q4/q7/q21, Bio u5 q3/q11/q20, Econ q4/q15) PM tarafından ayrı bir betikle yeniden hesaplandı: 15/15 doğru.

### 20.2. Doğruluk Düzeltmeleri
- **Calculus ünite ağırlıkları:** Sayfadaki yol haritası eski (2019 dönemi) değerleri gösteriyordu. Resmi AP Central tablolarıyla değiştirildi:
  - AB kaynağı: https://apcentral.collegeboard.org/courses/ap-calculus-ab
  - BC kaynağı: https://apcentral.collegeboard.org/courses/ap-calculus-bc/course
  - 10 Ekim 2026'da kontrol edildi.
  - Örnek: Unit 8 AB %10–15, BC %5–10. Önceki "BC %6–9" değeri yanlıştı.
- **Chemistry:** `chem_u2_q3` (Resonance) 2.5 → 2.6, `chem_u2_q4` (VSEPR) 2.6 → 2.7 olarak güncel CED'e uyarlandı.
- **Konu başlıkları:** 7 başlıktaki ham alt çizgi (`ΔH_vap`, `R_E` vb.) `<sub>` etiketine çevrildi.

### 20.3. Arayüz ve Altyapı
- **Seviye raporu ünite çapaları:** Her ünitenin `portalCapa` alanı eklendi (40 ünite kaydı). "Portalda çalış →" bağlantısı artık ilgili ünite bölümüne atlıyor; ör. `ap-calculus.html#calc-unit8-lecture-section`.
  - Eski kayıtlı raporlar çapayı güncel bankadan alır.
  - `pm-denetim.js` her çapanın sayfada var olduğunu kontrol eder. `portaldaVar: true` olup çapası olmayan ünite artık sorun sayılır.
- **Seviye verisi:** Calc Unit 8 (AB+BC), Phys Unit 5, Chem Unit 6 ve Bio Unit 5 `portaldaVar: true` yapıldı.
- **Seçmeliler sayfası:** MathJax eklendi. Önceden ders notlarındaki `$MR = MC$` gibi formüller ham görünüyordu. Paketleyici bu bağlantıyı da yerelleştiriyor.
- **Physics telefon taşması:** Ünite haritasındaki uzun Unit 5 bağlantısı 390 px'te sayfayı 478 px'e taşırıyordu; bağlantılarda satır kırma açıldı.
- **Test betikleri:** `araclar/testler/*.js` eski proje yolunu (`Desktop/AP AZRA`) kullanıyordu; `Desktop/projelerim/AP AZRA` olarak düzeltildi. PM kabul testine çapa kontrolü eklendi.

### 20.4. Doğrulama Kanıtı
- `node araclar/pm-denetim.js` → **TOPLAM 569 soru, 0 sorun** (seviye: 153).
- Tarayıcı testleri: `interact`, `backup-test`, `ulke-test`, `seviye-test` ve `pm-seviye-test` geçti.
- Yeni bölümlerin render kontrolü: 5 sayfa × 2 tema × 2 genişlik (1280 / 390). Sonuç: sayfa hatası 0, yatay taşma 0, ham TeX 0. Tüm istasyonlar beklenen soru sayısını gösteriyor.
- Paket: `node araclar/sunum-olustur.js`, ardından `paket-test` ve `sv-paket` (sonuç §20.5'te).

### 20.5. Açık Konular
- Unit 8 anlatımındaki ağırlık cümlesi düzeltildi. Diğer ders sayfalarının ağırlık rozetleri bu turda resmi tabloyla karşılaştırılmadı (Tur 5 PM görevi).
- Ekran görüntüleri ajanlar tarafından değil, PM tarafından toplu alındı.
- Dizi adları ile ünite numaraları arasındaki tarihsel uyumsuzluk korunuyor: `PHYS_UNIT3_QUESTIONS` = Unit 2 (cont.), `PHYS_UNIT4_QUESTIONS` = Unit 3. İlerleme kayıtları bozulmasın diye adlar değiştirilmedi.

## 21. TUR 5 (12 EKİM 2026) — ÇOK ÖĞRENCİLİ PLATFORM VE MEVZUAT DÜZELTMELERİ (PM Onaylı)

### 21.1. Yeni Platform
- **Kayıt / giriş:** `giris.html` + `auth.js`. Şifre düz metin saklanmaz: PBKDF2-SHA-256 (Web Crypto, rastgele 16 bayt salt, ≥150.000 iterasyon; `crypto.subtle` yoksa saf JS yedek). Hesaplar ve ilerleme yalnızca bu cihazdaki tarayıcıda (yerel depolama) tutulur; sunucu ileride. Sözleşme: `.agents/rules/tur5-platform-spec.md`.
- **Profil sihirbazı** (`profil.html`): okul, sınıf, hedef ülke(ler). Tamamlanmadan panele geçilmez.
- **Üniversitelerim** (`universiteler.html`, veri `data/ulkeler.js`), **Sınavlar** (`sinavlar.html`, veri `data/sinavlar.js`).
- **Denemeler** (`deneme.html`, havuz `data/deneme-bankasi.js`): ders bazlı ve karma genel deneme; havuz **623 soru** (`araclar/deneme-bankasi-olustur.js` çıktısı).
- **CEnT-S sayfası** (`sinav-cents.html`): resmi yapıya göre konu anlatımı + **60 soru** (6 bölüm × 10).
- **Yeni menü:** oturum koruması ve menü `app.js` üzerinden; `index.html` kişisel panel.

### 21.2. Yeni Ajanlar
- **Ajan 12 — İçerik & Deneme Sorumlusu:** deneme havuzu, deneme motoru ve backlog önerileri (§14.2).
- **Ajan 13 — Kıdemli Uluslararası Kabul Mevzuatı Uzmanı:** anabin, uni-assist, MUR, PoliMi/PoliTo çağrıları ve CISIA kurallarını tek tek kontrol etti. Karar notu: `.agents/mevzuat/karar-notu-2026-10-12.md`.

### 21.3. Mevzuat Düzeltmeleri (karar notu §3'teki 13 madde)
| # | Düzeltme | Uygulandığı yer |
| :--- | :--- | :--- |
| 1 | Fen dersi yalnızca Biology, Chemistry ya da Physics C Mech + E&M birlikte; Physics 1/2 sayılmaz (anabin USA-BV07) | proje.md §2.1 |
| 2 | Dil: English Lang/Lit, French, Spanish, Latin, German; ek ders: tarih, CS A, Micro + Macro birlikte | proje.md §2.1; `index.html` KMK seçimleri |
| 3 | "Physics C/1" → "Physics C (Mech + E&M) ya da Chemistry"; kural Türk diplomasına uygulanmaz | proje.md §5.1 adım 1 |
| 4 | VPD'yi üniversite ister, ülke değil; Türk adaydan Lise Diploması + YKS "Yerleştirme Sonuçları" | proje.md §2.1, §5.1 adım 4; `data/bilgi-merkezi.js` |
| 5 | Türk diploması + AP için anabin kuralı yok; APS Türkiye'ye hiç uygulanmaz (Çin, Hindistan, Vietnam); uni-assist yalnızca yeminli tercüman çevirisi kabul eder | proje.md §12.8; `data/bilgi-merkezi.js`; `app.js` |
| 6 | İtalya'da AP ek sıralama puanı / kredi muafiyeti / kabul önceliği vermez (PoliMi Art. 6.2; PoliTo Ek B/C) | proje.md §2.2, §4; `data/bilgi-merkezi.js`; `data/ulkeler.js`; `italya-muhendislik.html` |
| 7 | PoliMi ≥75/100 erken kayıt yalnızca İtalyanca programlar; İngilizce programlar "specific rankings"; Meberra'nın penceresi Doğrulanamadı | proje.md §0.1, §6.2, §12.5; `data/bilgi-merkezi.js`; `data/ulkeler.js`; `data/sinavlar.js`; `app.js`; `istanbul-sinav-rehberi.html` |
| 8 | 26 Kasım / 17 Aralık 2026 CEnT-S oturumları 2027/28 kaydı içindir; Meberra'nın Padova 2028/29 başvurusu için geçersiz (CISIA) | proje.md §0.1, §18.2; `data/bilgi-merkezi.js`; `data/ulkeler.js`; `data/sinavlar.js`; `italya-muhendislik.html` |
| 9 | "Yedek yol Studienkolleg" yanlış: yerleşme yoksa Studienkolleg de yok (tek istisna MYO 1 yıl → FH Studienkolleg'i) | `data/ulkeler.js`; proje.md §0.2, §4, §5.2; `data/bilgi-merkezi.js`; `app.js`; `almanya-muhendislik.html` |
| 10 | "5 AP ile genel giriş" ve "GPA ≥3.0" güncel anabin kayıtlarında yok → Yoruma açık | `data/ulkeler.js`; `data/bilgi-merkezi.js` |
| 11 | KMK denetleyicisi: Physics 1 fen sayılmaz; Micro/Macro tek başına sayılmaz; sonuç metni Türk diplomasına giriş hakkı vermediğini söyler | `app.js` `initKMKChecker`; `index.html` |
| 12 | Physics 1'in ek ders sayılması Yoruma açık — teyit gerekir | `data/sinavlar.js` |
| 13 | MUR genelgesi 2026/27–2027/28 için; 2028/29 için yeni genelge gerekecek; vize son tarihi 2028/29 Doğrulanamadı | `data/ulkeler.js` İtalya Universitaly maddesi |

Olgusal temel (karar notu S1–S4): **YKS her iki ülke için zorunlu belgedir.** İtalya'da YKS sonuç belgesi (geçmiş olmak) istenir; Almanya'da YKS'de en az 4 yıllık örgün bir lisans programına yerleşme, yalnızca yerleşilen alan ve komşu alanlar için doğrudan giriş sağlar (anabin TUR-BV05, https://anabin.kmk.org).

### 21.4. Kararlar (kullanıcı, 12 Ekim 2026 — üçü de KAPANDI)
- **K1 — Almanya / İtalya:** "Her iki ülke ayrı ayrı olsun; öğrenci seçince o ülkenin isterleri ve kuralları devreye alınarak devam edilsin."
  - Almanya ve İtalya iki bağımsız rotadır; biri diğerinin yedeği değildir.
  - Öğrenci profilde seçtiği ülkenin rotasını izler: ülkenin temel kuralı, sınıfa ve mezuniyet yılına göre tarihlenen adımlar, belgeler ve sınavlar.
  - Uygulama: Tur 6, §22. Sözleşme: `.agents/rules/tur5-platform-spec.md` §8.
- **K2 — AP fen dersi:** Physics C (Mechanics + E&M) ve Chemistry ayrı derslerdir, ikisi de alınabilir; "ya o ya bu" kararı yoktur.
  - Almanya rotasında ikisi de KMK fen dersi şartını karşılar.
  - İkisi birlikte alınırsa ikincinin 4. ders sayılması Yoruma açık; güvenli 4. ders CS A ya da Micro + Macro.
  - Physics 1 fen dersi sayılmaz.
  - Ders yükü öğrencinin planına bırakılır.
- **K3 — Kasım/Aralık 2026 CEnT-S:** Prova olarak girilecek. Resmi başvuru değildir; sonuç 2028/29 kaydında kullanılmaz. İtalya rotasında 11. sınıf için isteğe bağlı adım olarak yer alır.

### 21.5. Doğrulama
- `node araclar/pm-denetim.js` → **TOPLAM 629 soru, 0 sorun.**
- `node araclar/deneme-bankasi-olustur.js` → havuz 623 soru (CEnT-S 60).
- Tarayıcı testleri: `interact` (KMK denetleyicisi dahil), `ulke-test` (FAILS 0), `hesap-test` **156/156**, `deneme-test` geçti. Ek kontrol: KMK denetleyicisi Physics 1 ve tek başına Micro/Macro seçimini reddediyor.
- Paket: `sunum/AP-MEBERRA-Sunum-2026-10-12.zip` (`node araclar/sunum-olustur.js`, ardından `paket-test` ve `sv-paket`).

### 21.6. Sunucu Kararı ve Depolama Mimarisi (kullanıcı kararı, 12 Ekim 2026)
- **Karar:** Sunucu daha sonra alınacak. Şimdilik sistem yerelde çalışır; testler tek öğrenciyle yapılır.
- **Sunucuya hazırlık:**
  - Tüm hesap depolaması `auth.js` içindeki tek bir adaptörden geçer: `APAZRA_AUTH.store`. Her işlem Promise döner; işlemler `getUsers`, `saveUser`, `getProfile`, `saveProfile`, `getSession`, `stashLive`, `restoreLive` …
  - Sunucu gelince yalnızca bu adaptör REST çağrılarıyla değişecek.
- **Sunucuya geçişte değişecek noktalar:**
  1. Şifre hash'i ve kurtarma kodu doğrulaması sunucuya taşınacak.
  2. `app.js`'teki eşzamanlı oturum koruması çerez/token kontrolüne dönecek.
  3. `apazra:*` ilerleme verisi sunucuyla senkronize edilecek.
  4. Giriş ekranındaki "şifren hiçbir sunucuya gönderilmez" notu güncellenecek.
- **Kişi verisi takası:** Çıkışta canlı `apazra:*` anahtarları `apazra-hesap:v1:veri:<id>` içine saklanır, girişte geri yüklenir.
  - Eski (sahipsiz) ilerleme ilk kullanıcıya aktarılmayı teklif edilerek bekletilir.
  - Anahtar listesi: `.agents/rules/tur5-platform-spec.md` §2.
- **Bilinen sınır:** Oturum koruması yalnızca istemci tarafındadır. Gerçek güvenlik sınırı sunucuyla gelecek.

### 21.7. Test Altyapısı
- Oturum koruması nedeniyle tüm tarayıcı testleri `araclar/testler/oturum-tohum.js` ile bir test hesabı açarak çalışır.
- Yeni testler:
  - `hesap-test.js` (156 kontrol)
  - `deneme-test.js`
  - `yazisma-test.js` (§21.8)
- Paket akışı internetsiz denendi: tüm ağ istekleri engellendi, `hesap-test` paketin içinde 156/156 geçti.
- Teslim sırasına yeni adım eklendi (`araclar/testler/BENIOKU.md`): ders sayfalarına soru eklendiyse önce `node araclar/deneme-bankasi-olustur.js` çalıştırılır.

### 21.8. Resmi Yazışma (E-posta) Mekanizması
- **Amaç:** Üniversitelere, uni-assist'e, konsolosluğa ve burs kurumlarına gönderilecek teyit e-postalarını öğrencinin profil bilgileriyle otomatik oluşturmak.
- **Şimdi (yerel):** Öğrenci e-postayı kopyalar ya da `mailto` ile kendi programında açar, gönderir ve "gönderildi" olarak işaretler.
- **Sunucu gelince:** Aynı motor sunucuda çalışır; gönderim ve yanıt takibi otomatikleşir.
- **Sözleşme:** `.agents/rules/tur5-platform-spec.md` §7.
- **Şablonlar** (`data/eposta-sablonlari.js`, sahibi Ajan 13): **9 şablon.**

  | Şablon | Alıcı | Karar notu |
  | :--- | :--- | :--- |
  | Alman üniversitesine kabul yolu teyidi (T1) | Seçilen Alman üniversitesi (13 üniversitenin resmi kanalı) | K1 |
  | uni-assist: AP mi, YKS yerleştirmesi mi? (T2) | uni-assist iletişim formu | K1 |
  | YKS yerleştirme sonucunun son tarihten sonra teslimi | Seçilen Alman üniversitesi | K1 |
  | PoliMi İngilizce programlara erken giriş (T3; yalnızca 11. sınıfa gösterilir) | PoliMi International Students Office | K3 |
  | PoliTo TIL-I uygunluğu ve AB dışı oturum takvimi | PoliTo Guest ticket | — |
  | CEnT-S geçerlilik dönemi ve AB dışı kontenjan | Padova / Sapienza | — |
  | Türk diploması için CIMEA / DoV gerekliliği | Seçilen İtalyan üniversitesi | — |
  | DoV süreci | İtalya İstanbul Başkonsolosluğu | — |
  | DSU bursu için Türkiye'den gereken belgeler | EDISU Piemonte / PoliMi DSU | — |

  - Alıcı adresleri yalnızca resmi sayfalardan alındı; resmi e-posta adresi yoksa iletişim formu verilir.
  - CIMEA bireysel e-postaları kabul etmediği için CIMEA sorusu üniversiteye yöneltildi.
- **Motor ve sayfa** (Ajan 11):
  - `eposta.js`: DOM'dan bağımsız, Node'da da çalışır.
  - `yazismalar.html` ("Resmi Yazışmalarım"): şablon seçimi, üniversite/program seçimi, eksik bilgi uyarısı, düzenlenebilir önizleme, kopyala/mailto, yazışma geçmişi (taslak / gönderildi / yanıt geldi).
  - Mezuniyet yılı sınıftan otomatik hesaplanır.
  - Profile isteğe bağlı alanlar eklendi: e-posta, doğum tarihi, okul şehri.
  - Depolama: `apazra:yazisma:v1`.
- **Menü ve panel:** "Yazışmalarım" ana menüde. Panelde "Profili düzenle" bağlantısının yanında "Resmi yazışmalarım" bağlantısı var.
- **Motor ayrıntıları:**
  - `resmiAd`: üniversite adlarını e-postada parantezsiz, resmi haliyle yazar.
  - `siniflar`: sınıfa göre şablon süzer; PoliMi erken giriş şablonu yalnızca 11. sınıfa görünür.
  - `aliciCoz`: seçilen üniversitenin resmi kanalını bulur.
  - 2000 karakteri aşan e-postada gövde panoya kopyalanır; e-posta programı yalnızca alıcı ve konuyla açılır.
- **Hata düzeltmesi:** `auth.js` `saveProfile` artık kayıtlı isteğe bağlı profil alanlarını silmiyor. Yeni işlev: `updateProfileExtras`.
- **Şema eki (PM onaylı):**
  - Şablonlarda `alici.secenekler`, `alici.not`, `dayanak`, `siniflar`.
  - Yazışma kayıtlarında `aliciAd`, `guncelleme`, `yanitTarihi`.
- **Doğrulama (12 Ekim 2026):**
  - `eposta-birim-test` 106/106; `yazisma-test` 64/64. Bu test proje klasöründe ve internetsiz pakette ayrı ayrı çalıştırıldı.
  - Tam regresyon geçti: interact, backup, ulke, seviye, pm-seviye, hesap 156/156, deneme.
  - Menü 1280/1024/390 px'te taşmıyor.
  - pm-denetim 629 soru, 0 sorun.
  - Paket `sunum/AP-MEBERRA-Sunum-2026-10-12.zip`: 60 dosya, 13,7 MB, kırık bağlantı yok; paket-test ve sv-paket ağ isteği 0.
- **Sunucuya geçişte:**
  - `eposta.js` sunucuda `require` edilir.
  - "Gönderildi olarak işaretle" düğmesi "Gönder" olur.
  - Yazışma kayıtları `GET/PUT /yazismalar` ile tutulur.
  - Yanıt takibi için kayıtlara `mesajId` alanı eklenir.

### 21.9. Kayıt Kuralı (kullanıcı talimatı, 12 Ekim 2026)
**Tüm proje gelişmeleri `proje.md`'ye yazılır.** Her tur, her yeni özellik, her ajan ataması, her mevzuat düzeltmesi ve her kullanıcı kararı, gerçek sayılarla ilgili bölüme ya da yeni bir tur bölümüne işlenmeden "Tamamlandı" sayılmaz (`AGENTS.md` §2.1, madde 6). `DEVAM-NOKTASI.md` yalnızca kısa bir devam özetidir; asıl kayıt `proje.md`'dir.

---

## 22. TUR 6 (12 EKİM 2026) — ÜLKEYE ÖZEL ROTALAR VE PROJE ADI: AP MEBERRA (PM Onaylı)

### 22.1. Kullanıcı Kararları
- **K1:** "Her iki ülke ayrı ayrı olsun; öğrenci seçince o ülkenin isterleri ve kuralları devreye alınarak devam edilsin." Almanya ve İtalya iki bağımsız rotadır.
- **K2:** Physics C ve Chemistry ayrı derslerdir; ikisi de alınabilir (ayrıntı §21.4).
- **K3:** Kasım/Aralık 2026 CEnT-S oturumuna prova olarak girilecek; resmi başvuru değildir.
- **Proje adı:** "AP AZRA" → **"AP MEBERRA"**. Sabit metinlerdeki öğrenci adı "Azra" → **"Meberra"**. Klasör yolu (`Desktop\projelerim\AP AZRA`) aynı kaldı.
- Sözleşme: `.agents/rules/tur5-platform-spec.md` §8 (rota motoru), §8.3 (K2/K3), §9 (ad değişikliği).

### 22.2. Rota Kuralları — `data/ulke-rotalari.js` (Ajan 13 + Ajan 2)
| Rota | Adım | Koşul | Belge | Uyarı | Temel kural |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Almanya | 16 | 6 | 12 | 5 | anabin TUR-BV05: YKS'de hedef alanda en az 4 yıllık örgün lisans programına yerleşme → alana bağlı doğrudan giriş |
| İtalya | 17 | 6 | 10 | 5 | MUR genelgesi: 12 yıllık diploma + YKS sonuç belgesi + üniversitenin kendi testi |

- **Tarihler:** Mezuniyet yılına göre görelidir. 9., 10., 11., 12. sınıf ve mezun öğrenci aynı veriden kendi tarihli takvimini alır. Her madde resmi kaynak URL'si ve kesinlik etiketi taşır: Doğrulandı / Yoruma açık / Doğrulanamadı.
- **Adım sayısı sınıfa göre değişir:** 11. sınıfta Almanya 16, İtalya 17 adım; 12. sınıfta ikisi de 15 adım. Prova CEnT-S ve PoliMi erken giriş adımları yalnızca 11. sınıfa görünür; TIL-I son sınıftadır.
- **Almanya rotasında AP'nin yeri:** Giriş hakkı vermez, profil gücüdür.
- **Takvim riski (önemli):** 2026 takvimine göre YKS yerleştirme sonucu (18 Ağustos), Alman üniversitelerinin kış dönemi son tarihine (15 Temmuz) yetişmez. Rotada iki çözüm adımı var:
  - "Geç teslim teyidi" (e-posta şablonuna bağlı)
  - "Yaz dönemi ya da bir sonraki kış"
- **Doğrulanamadı:** ÖSYM 2027/2028 takvimleri ile 2027/28 ve sonrası çağrı ve genelge tarihleri. Aylar 2026 ve 2026/27 takvimlerinden alındı.
- **Temizlenen notlar:**
  - "PM/aile kararı bekleniyor (K1/K2/K3)" notları rotaya özel olgusal ifadelerle değiştirildi. Değişen dosyalar: `data/ulkeler.js`, `data/bilgi-merkezi.js`, `data/sinavlar.js`, `data/eposta-sablonlari.js` (`kararNotu` → null), `almanya-muhendislik.html`, `italya-muhendislik.html`, `app.js`, `index.html`.
  - `acikKararlar` boş.

### 22.3. Rotam ve Rota Bağlamı (Ajan 11)
- **Yeni sayfa `rota.html` ("Rotam"):** Menüde Panelim'den hemen sonra. Hesaplar `rota.js`'te yapılır: saf fonksiyonlar, Node uyumlu; mezuniyet yılı `eposta.js`'ten alınır.
- **İçerik:**
  - Rota seçici
  - Temel kural ve koşullar
  - Zaman çizelgesi (Geçmiş / Bu ay / Gelecek / Tarihi belirsiz; "Sıradaki adım" vurgulu)
  - Adım ve belge işaretleme
  - Rotanın sınavları (zorunlu / seçmeli; "a|b" = biri yeterli)
  - Uyarılar
- **Durum deposu:** `apazra:rota:v1`. Yedeğe dahildir; birleştirmede daha yeni tarih kazanır.
- **Profil:**
  - Yeni alanlar `aktifRota` ve `hedefAlan` (varsayılan Mühendislik).
  - Sihirbazda iki ülke seçilince "Önce hangi rotayla başlamak istersin?" sorulur.
  - `saveProfile` bilinmeyen alanları korur.
- **Rota bağlamı diğer sayfalarda:**
  - **Panel:** aktif rotanın sıradaki 4 adımı.
  - **Sınavlar:** "Bu rotada zorunlu / seçmeli" rozetleri ve "Rotamın sınavları" filtresi.
  - **Yazışmalarım:** aktif rotanın şablonları önce gelir; "Rotamda" rozeti.
  - **Üniversitelerim:** aktif rota sekmesi açık gelir.
  - **KMK denetleyicisi:** yalnızca Almanya rotası aktifken görünür ("ABD diploması kuralı — bilgi amaçlı").
- **Görsel:** Ülke rengi rotaya göre değişir (Almanya amber, İtalya zümrüt).
- **Menü:** 1180 px üstünde tek satır; altında hamburger menü. Üst menüye yeni bağlantı eklenirse "Yazışmalarım" Rotam grubuna taşınmalı.

### 22.4. Proje Adı Değişikliği ve Ad Denetimi
- **Toplu değişiklik:** 60 dosyada 319 değişiklik yapıldı. Kapsam: sayfalar, kod, veri, `AGENTS.md`, ajan tanımları, kurallar, hibe modülleri, testler, `proje.md`, `DEVAM-NOKTASI.md`, karar notu.
- **Korunanlar:**
  - Klasör yolu
  - `apazra:` / `apazra-hesap:` depolama anahtarları. Değişseydi mevcut hesaplar ve ilerleme kaybolurdu.
  - `APAZRA_*` kod adları
- **Kalıcı denetim aracı: `node araclar/ad-denetimi.js`** (kullanıcı talimatı: "Ad değişikliği her dosyada kontrol edilsin").
  - Proje klasöründeki tüm metin dosyalarını satır satır tarar (76 dosya); dosya adlarını da kontrol eder.
  - Yalnızca klasör yolları ve kod/depolama adları izinlidir.
  - Teslim sırasında 1b. adımdır (`araclar/testler/BENIOKU.md`).
  - Sonuç: **0 sorun**.
  - Ek kontrol: üretilen paketin içi ayrıca tarandı; eski ad yalnızca izinli tarihsel klasör yolunda geçiyor.
- **Düzeltme:** Toplu değişiklik §20'deki tarihsel bir klasör yolunu (`Desktop/AP AZRA`) yanlışlıkla değiştirmişti; geri alındı ve yol izin listesine eklendi.
- **Paket adı:** `sunum/AP-MEBERRA-Sunum-2026-10-12.zip`. Eski arşiv paketleri (`AP-AZRA-Sunum-2026-10-07/10/12.zip` ve `sunum/AP-AZRA` klasörü) tarihsel kayıt olarak `sunum/` altında duruyor.
- **Yedek:** Değişiklik öncesi tüm proje (PDF ve paketler hariç) scratchpad'e tar olarak yedeklendi.

### 22.5. Doğrulama (12 Ekim 2026, ad değişikliğinden sonra)
- `node araclar/pm-denetim.js` → **629 soru, 0 sorun**
- `node araclar/ad-denetimi.js` → **0 sorun**
- `node araclar/deneme-bankasi-olustur.js` → 623 soru (CEnT-S 60)
- Tüm düzenlenen JS dosyaları `node --check` ile ayrıştırıldı.
- **Birim testleri:** `eposta-birim-test` 106/106, `rota-birim-test` 51/51.
- **Tarayıcı testleri:**
  - interact, backup-test, ulke-test (FAILS 0), seviye-test, pm-seviye-test: geçti
  - hesap-test 156/156, deneme-test geçti, yazisma-test 64/64
  - **rota-test 225/225**: iki rota, rota değiştirme, işaretleme ve kalıcılık, 11/12. sınıf farkı, sayfalar arası rota bağlamı, 360–1280 px × açık/koyu tema
- **Paket:** `sunum/AP-MEBERRA-Sunum-2026-10-12.zip` (63 dosya, 13,7 MB, kırık bağlantı yok). paket-test 0 FAIL, sv-paket ağ isteği 0.

---

## 23. TUR 7 (12 EKİM 2026) — PROFESYONEL EKRAN TASARIMI: TASARIM SİSTEMİ v3 (PM Onaylı)

Kullanıcı isteği: "Ekran dizaynını profesyonelleştirelim." Uygulayan: Ajan 11 (Frontend). PM önce/sonra ekran görüntülerini inceledi; soru içeriğini yedekle bağımsız olarak karşılaştırdı.

### 23.1. Denetim (önce)
22 sayfa üç görünümde fotoğraflandı (1280 px açık, 1280 px koyu, 390 px açık; 66 görüntü). Bulunan sorunlar:
- **Satır içi stil ve sabit renk:** 1.166 satır içi stil; açık temada okunabilirlik `!important` yamalarına bağlıydı.
- **Arayüzde emoji:** 187 emoji, ör. "📐 … Past FRQs →".
- **Rastgele renkli bölüm kenarlıkları.**
- **İçindekiler yok:** 25.000–117.000 px uzunluğundaki ders sayfalarında yön bulmak zordu.
- **Tutarsız marka satırı ve menü taşması.**
- **Ölçü ve bileşen karmaşası:** 11 farklı küçük yazı boyu, 4 farklı düğme görünümü.
- **Panelde yanlış görsel ağırlık:** sayaç ilerlemeden baskın, KMK aracı ana akışın içinde.
- **Yoğun metin:** Sınavlar notları ve Rotam adımları tam paragrafla açıktı; Rotam telefonda 16.000 px uzunluğundaydı.
- **Kontrast:** açık temada `--text-dim` 4.49:1 ile AA sınırının altındaydı.

### 23.2. Tasarım Sistemi v3 (`styles.css`)
- **Renk:**
  - Tek marka rengi: lacivert-indigo `#3347c4` (beyaz metinle 7.4:1).
  - Nötr gri skala; anlamsal renkler (başarı / uyarı / hata / bilgi).
  - Ülke renkleri (Almanya amber, İtalya zümrüt) ve ders renkleri yalnızca vurgu: çizgi, nokta, etiket.
- **Tipografi:** ölçek 12/14/16/18/22/28/36; başlıklar 700 ağırlıkta; okunabilir metin genişliği 70ch.
- **Ölçüler:** 4/8 px ızgarası, yarıçaplar 4/6/8/12 px, içerik genişliği 1200 px.
- **Bileşenler:** düğme (birincil / ikincil / hayalet / tehlike; küçük ve büyük boy), kart, rozet, sekme, form, tablo, uyarı kutusu, boş durum ve sayfa başlığı tek tipe indirildi. Ayrıca `u-*` yardımcı sınıfları, kısaltılabilir not ve içindekiler bileşenleri eklendi.
- **İkonlar:** Emojiler yerine tek çizgili, satır içi SVG ikon seti kullanılıyor. Eğitmen avatarları ad baş harfli monogram oldu (SD, EY …).
- **Kontrast (ölçüldü):** WCAG AA; açık temada 4.9–17.7:1, koyu temada 5.5–14.7:1.
- **Diğer:** `prefers-reduced-motion` ve yazdırma stili genişletildi.

### 23.3. Sayfalar
- **Ders sayfaları ve CEnT-S:**
  - Satır içi stil 1.166'dan 18'e indi.
  - Yapışkan içindekiler eklendi: geniş ekranda yan sütun, telefonda açılır liste; okunan bölüm vurgulanıyor.
  - Ders rengi yalnızca vurgu olarak kullanılıyor.
- **Panel:** Sıra şöyle: karşılama ve sıradaki adım → Rotam → başlangıç adımları → Bugün (ilerleme, son deneme, sayaç) → dersler → "Rehberler ve araçlar". KMK aracı ikincil grupta; hukuki açıklaması "Kural ayrıntıları" altında.
- **Sınavlar, Rotam, Üniversitelerim:** Uzun notlar açılır alanlara alındı. Rotam 1280 px'te yaklaşık %22 kısaldı.
- **Kabuk:**
  - Marka satırı her sayfada "AP MEBERRA · Hazırlık Portalı".
  - Dar menüde danışman düğmesi yalnızca ikon olarak görünüyor.
  - Soru geri bildiriminde emoji yerine ikon kullanılıyor.
  - "Dr. ile Görüş" etiket hatası düzeltildi.
- **Rehberler** (Almanya, İtalya, İstanbul, Ajanlar, Bilgi Merkezi) ve diğer sayfalar aynı sisteme getirildi.

### 23.4. İçerik Bütünlüğü (PM bağımsız kontrolü)
- Ders içeriğine dokunulmadı.
- PM, tasarım öncesi yedekle bağımsız karşılaştırma yaptı: 7 sayfanın (`ap-*.html`, `sinav-cents.html`) tüm `*_QUESTIONS` dizileri **birebir aynı**.
- Deneme havuzu yeniden üretildi; içerik aynı (623 soru).

### 23.5. Doğrulama
- **Denetimler:** `pm-denetim` 629 soru, 0 sorun · `ad-denetimi` 0 sorun.
- **Birim testleri:** eposta 106/106, rota 51/51.
- **Tarayıcı testleri:** interact, backup, ulke, seviye, pm-seviye, deneme geçti; hesap 156/156, yazisma 64/64, rota 225/225.
- **Yeni `tasarim-test.js` (51 kontrol):**
  - 21 sayfada 360 px taşma ve sayfa hatası
  - İçindekiler bağlantıları
  - Tema geçişi
  - Panel bölüm sırası
  - 257 yerel bağlantı
- **Paket:** `sunum/AP-MEBERRA-Sunum-2026-10-12.zip` (63 dosya); internetsiz paket testleri geçti.
- **Görüntüler:** Önce/sonra ekran görüntüleri oturum scratchpad'inde (`tasarim-shots/once`, `tasarim-shots/sonra`).

### 23.6. Bilinen Sınırlamalar ve Sonraki Adım
- **`styles.css` (2.872 satır):** Eski bileşen tanımları ve açık tema yamaları hâlâ duruyor; v3 katmanı bunları dosya sonundan geçersiz kılıyor. Bir sadeleştirme turu yapılabilir.
- **JS şablonları:** Bazı şablonlarda CSS değişkenli satır içi stil kaldı; iki temada da doğru görünüyor.
- **İçindekiler kapsamı:** Yalnızca ders sayfalarında ve CEnT-S'te var; kısa rehber sayfalarına bilinçli olarak eklenmedi.

---

## 24. TUR 8 (13 EKİM 2026) — "DOĞRULANAMADI" BİLGİLERİN TAMAMLANMASI (PM Onaylı)

Kullanıcı isteği: "Doğrulanamadı olan bilgileri tamamlamaya çalışalım." Uygulayanlar: Ajan 13 ve Elena Rossi (araştırma, iki paralel ajan: Almanya ve İtalya) ile PM (uygulama ve doğrulama). Protokol: `.agents/rules/tur5-platform-spec.md` §10.

### 24.1. Yöntem
- Veri dosyalarındaki her "Doğrulanamadı" maddesi birincil kaynaklardan yeniden araştırıldı. Kaynaklar: üniversite çağrıları ve ücret yönetmelikleri, ÖSYM, CISIA, MUR, CIMEA, DSU kurumları, uni-assist, DAAD, ETS, IDP, TestAS. Gerektiğinde İtalyanca ve Almanca sayfalar da okundu.
- **İki yeni kesinlik etiketi eklendi:**
  - **Yayımlanmadı:** Resmi belge henüz çıkmadı. Son yayımlanan yılın bilgisi yazılır, beklenen yayın dönemi belirtilir ve madde takip listesine alınır.
  - **Teyit gerekir:** Bilgiyi yalnızca kurum verebilir. İlgili e-posta şablonuna bağlanır.
- **Uygulama:**
  - Araştırmacılar dosyaları değiştirmedi; bulguları `.agents/mevzuat/dogrulama/bulgular-de.json` (32) ve `bulgular-it.json` (60) dosyalarına yazdı.
  - PM bu bulguları bir betikle uyguladı. Betik her eski metnin dosyada tam 1 kez geçtiğini kontrol etti ve JS sözdizimini doğruladı.
  - Sonuç: 92/92 bulgu uygulandı, 0 atlandı. Değişiklik öncesi veri dosyaları scratchpad'e yedeklendi.
- **Arayüz:** Rota sayfası ve panel iki yeni etiketi tanıyor. "Yayımlanmadı" mavi bilgi rozetiyle, "Teyit gerekir" uyarı rozetiyle gösteriliyor. `rota.js` doğrulayıcısı güncellendi.

### 24.2. Sonuç
| Sonuç | Bulgu |
| :--- | :--- |
| Doğrulandı | 32 |
| Yayımlanmadı | 41 |
| Teyit gerekir | 11 |
| Yoruma açık | 8 |
| **Hâlâ Doğrulanamadı** | **0** |

- Veri dosyalarında (`ulkeler.js`, `ulke-rotalari.js`, `sinavlar.js`, `eposta-sablonlari.js`, `bilgi-merkezi.js`, `sinav-cents.html`) "Doğrulanamadı" etiketli madde kalmadı. Yalnızca etiket sistemini anlatan açıklama satırları duruyor.
- Rota adımlarının kesinlik dağılımı: Doğrulandı 33, Yayımlanmadı 11, Teyit gerekir 2, Yoruma açık 1.

### 24.3. Öğrencinin Planını Etkileyen Yeni Bilgiler
- **Almanya — 15 Temmuz çakışması her yıl yaşanıyor:**
  - YKS yerleştirme sonuçları 2023–2026 arasında 13–25 Ağustos'ta açıklandı.
  - YKS puan sonuçları da her yıl 15 Temmuz'dan sonra (16–22 Temmuz) geldi. Kaynak: ÖSYM duyuruları.
  - Almanya rotasındaki "geç teslim teyidi" adımı bu yüzden zorunlu; kesinliği "Teyit gerekir".
- **Almanya — Türk üniversitesine kayıt yaptırmak gerekmiyor:** Yerleştirme belgesi yeterli (uni-assist TR; temsilcilik bilgi notu).
- **KIT Carl Benz School:**
  - SAT ≥1200 / ACT 24 / TestAS Core 75. yüzdelik dilim ve bir yıl lise fiziği isteniyor.
  - Başvuru "beklenen diploma" ile yapılabiliyor, belgeler Ekim'e kadar teslim edilebiliyor. Bu, YKS belge sorununu KIT için çözebilir; kesinliği "Teyit gerekir".
  - Portal Aralık 2026'da açılıyor.
- **THWS Robotics:** İngilizce; 7 dönem; dönem katkısı 117,70 €. Almanya giriş yeterliliği (HZB) olmayan AB dışı adaylardan TestAS (≥100) ya da SAT (≥1050) isteniyor.
- **Saarland:** Dil ve yetenek testlerinde asgari puan yok; kabul sıralamayla. Başarılı adaylar yaklaşık 95. yüzdelik dilimde.
- **Constructor:** IELTS 6.5 / TOEFL 90. SAT başvuruda zorunlu değil.
- **TUM Information Engineering:** En az A2 Almanca isteniyor.
- **Dil sınavları:** TOEFL Türkiye ücreti 185 $. IELTS İstanbul'da bilgisayarda neredeyse her gün yapılıyor; IDP ücreti 12.210 TL.
- **İtalya:** 2027/28 çağrıları ve CISIA'nın 2026/27 takvimi henüz yayımlanmadı. Beklenen yayın tarihleri:
  - PoliMi: Kasım 2026 ortası–sonu (Meberra'nın 11. sınıf erken test pencereleri bu çağrıda)
  - PoliTo ve Sapienza: Aralık 2026
  - Tor Vergata, UCBM, Napoli: Ocak 2027
- **İtalya — 2026/27 burs tutarları (doğrulandı), fuori sede:**
  - PoliMi/Lombardiya: 8.248 €'ya kadar (yemek dahil)
  - EDISU Piemonte: 8.096,78 €'ya kadar
  - DiSCo: ISEE tavanı 28.339,88 €
- **İtalya — ücretler:**
  - Sapienza: Türkiye B bandı, yılda 700 €.
  - PoliTo: Türkiye için 1.709 €. Vergilerin dahil olup olmadığı açık değil, bu yüzden "Yoruma açık".
  - PoliMi: Belge sunulmazsa en yüksek tutar 3.943,04 €.
  - Milano/Pavia AI: 1.500 €.
  - UCBM: 6.571,50 €.
  - CIMEA Statement of Comparability: 150 € / 60 iş günü (hızlı işlem +100 € / 30 iş günü).

### 24.4. Düzeltilen Eski İddialar
- **PoliMi DSU:** Vize asgari gelir kontrolü 2027/28'de değil, 2026/27'de başladı.
- **PoliMi 2026-27 çağrısı Art. 3.2:** 11. sınıfta alınan CEnT-S iki yıl sonraki kayıtta geçerli. Ancak bu yalnızca İtalyanca programlar için.
- **Padova:** "208 € depozito" aslında 1. taksit (192 € bölgesel vergi + 16 € damga). Yıllık ücret iki resmi sayfada 2.950 € ve 2.990 € olarak farklı geçiyor, bu yüzden "Yoruma açık".
- **Trento:** 2026/27 çağrısı AB dışı adaylar için CEnT-S ile 25 yer ayırıyor. Bölüm sayfasındaki TOLC-I bilgisi eski.
- **Milano AI:** Başvuru Pavia portalı üzerinden, Nisan–Mayıs arasında yapılıyor; SAT ≥979, 45 + 5 kontenjan.
- **CEnT-S 65 soru:** PoliMi ve Napoli 2026/27'de hâlâ 55 soruluk yapıyı kullanıyor. Yeni yapı büyük olasılıkla Kasım 2026'dan itibaren geçerli, bu yüzden "Yoruma açık".
- **HSRW İngilizce eşiği:** IELTS 5.5 / TOEFL iBT 72 (eski IELTS 6.0 / TOEFL 80 bilgisi düzeltildi).
- **Sağlık sigortası:** Kaynak DAAD olarak değiştirildi; eski kaynak yalnızca Schengen vizesini anlatıyordu.
- **Bilinen çelişkiler "Yoruma açık" olarak kaldı:**
  - THWS başvuru dönemi: 1 Nisan–15 Haziran mı, 1 Mayıs–15 Temmuz mu?
  - THWS A2 Almanca şartı: başvuruda mı, 2. dönem sonunda mı?
  - TUM Heilbronn dönem ücreti: 97 € mi, 102 € mi?

### 24.5. Takip Listesi
- **Dosya:** `.agents/mevzuat/takip-listesi.md`, 19 madde (İtalya IT-1…IT-16, Almanya ve ortak DE-1…DE-3). Her maddede ne beklendiği, beklenen tarih, kontrol edilecek resmi URL ve etkilenen dosya/id var.
- **Yakın tarihler:**
  - 31 Ekim 2026: CISIA 2026/27 kuralları
  - Kasım 2026: PoliMi 2027/28 çağrısı ve ÖSYM 2027 takvimi
  - Aralık 2026: PoliTo, Sapienza, Trento çağrıları ve KIT başvuru portalının açılması
- **Sorumlu:** Ajan 13 her turda bu listeyi kontrol eder; yayımlanan belgeyle "Yayımlanmadı" etiketini "Doğrulandı"ya çevirir.

### 24.6. Doğrulama (13 Ekim 2026)
- **Denetimler:** pm-denetim 629 soru, 0 sorun · ad-denetimi 0 sorun · tüm veri dosyaları `node --check` ile ayrıştırıldı.
- **Birim testleri:** eposta 106/106 · rota 51/51.
- **Tarayıcı testleri:** interact, backup, ulke, seviye, pm-seviye, deneme geçti · hesap 156/156 · yazisma 64/64 · rota 225/225 · tasarim 51/51.
- **Görsel kontrol:** Rota sayfasında "Yayımlanmadı" rozeti (4) ve "Teyit gerekir" rozeti (2) doğru görünüyor.

---

## 25. TUR 9 (13 EKİM 2026) — İÇERİK TURU: 6 DERS, +184 SORU (PM Onaylı)

Kullanıcı "proje.md" dedi (AGENTS.md Kural 14). §14.2 backlog'u altı paralel içerik ajanına dağıtıldı. Her ders dosyası yalnızca bir ajanın sorumluluğundaydı. Süreç Ajan 12'ye göre yürütüldü; ortak brifing `.agents/rules/tur9-icerik-brifing.md`.

### 25.1. Eklenenler (gerçek sayılar)
| Faz / İş | Eğitmen | Dosya | Eklenen | Doğrulama |
| :--- | :--- | :--- | :--- | :--- |
| Faz 31 — Calculus BC Unit 9 (Parametric, Polar, Vector-Valued; CED 9.1–9.9) | Prof. Sinan Demir | `ap-calculus.html` | Konu anlatımı + **24 soru** (`calc_u9_q1–q24`; 7 hesap makineli) | sympy; yay uzunluğu ve polar alan sembolik + sayısal |
| Faz 30 — Physics 1 Unit 6 (Rotating Systems; CED 6.1–6.6) | Dr. Emre Yıldız | `ap-physics.html` | Konu anlatımı + **22 soru** (`phys_u6_q1–q22`) | Python/sympy; yuvarlanma oranları sembolik |
| Faz 32 — Chemistry Unit 7 (Equilibrium; CED 7.1–7.12) | Doç. Dr. Selin Erdem | `ap-chemistry.html` | Konu anlatımı + **25 soru** (`chem_u7_q1–q25`) | Python/sympy; küçük-x yaklaşımlı her soru tam ikinci derece çözümle karşılaştırıldı |
| Faz 33 — Biology Unit 6 (Gene Expression; CED 6.1–6.8) + Unit 2 genişletme | Dr. Zeynep Aksoy | `ap-biology.html` | Konu anlatımı + **26 soru** (`bio_u6_q1–q26`); Unit 2'ye **+5 soru** (13 → 18) | Kodlanmış standart genetik kod tablosu; PCR ve jel hesapları |
| CS A + Ekonomi havuzu | Barış Özkan | `ap-electives.html` | **73 soru**, 6 yeni istasyon. CS A 20 → 48, Micro 10 → 32, Macro 10 → 33. Micro 5–6 ve Macro 1, 6 için konu anlatımı | CS A: Java semantiğine sadık Python çevirisi; ekonomi: sympy; 46 sayısal soru çapraz kontrol |
| Faz 28 — English FRQ istasyonu + Skill Category 8 | Claire Bennett | `ap-english.html` | Rubrikli FRQ yazım istasyonu (Synthesis / Rhetorical Analysis / Argument) + **9 soru** (Skill 8: 2 → 10; Skill 1: 3 → 4) | Rubrik ve süreler AP Central 2025 resmî PDF'lerinden; Draft 6 sayıları node ile |

**Toplam:** Portal soruları **629 → 813 (+184)**. Seviye testi 153 (değişmedi).

### 25.2. CED Bulguları (resmî kaynaktan)
- **Chemistry (CED Fall 2024):**
  - Unit 7 = 7.1–7.12.
  - pH–çözünürlük 8.11'e taşındı (nitel); 1 soru dürüstçe "CED Topic 8.11" etiketli.
  - ΔG°–K ilişkisi 9.5'e, çözünme serbest enerjisi 9.6'ya taşındı.
  - Kc ↔ Kp dönüşümü sınav dışı; yalnızca "Beyond the Exam" notu olarak işlendi.
- **CS A (2025-26 CED):**
  - 4 ünite: Using Objects and Methods, Selection and Iteration, Class Creation, Data Collections.
  - MCQ 42 soru, 4 şık.
  - Kalıtımın uygulanması (`extends`, `super`, overriding) kapsam dışı; soru eklenmedi, sayfaya kaynaklı not kondu.
- **Physics 1:**
  - Eylemsizlik momenti tablosu ve paralel eksen teoremi 5.4'te; Unit 6 bu konuya bağlantı veriyor.
  - Yörünge enerjisi 6.6'da.
- **English:**
  - Skill Category 8 = "Style – Writing": 8.A, 8.B ve 8.C.
  - FRQ rubriği: Row A 0–1 · Row B 0–4 · Row C 0–1.
  - Section II 2 saat 15 dakika; buna 15 dakikalık okuma süresi dahil.

### 25.3. Yeni Özellik: FRQ Yazım İstasyonu (`ap-english.html#eng-frq-station`)
- **Özgün promptlar:** Üç tür için özgün prompt. Synthesis kaynakları kurgusal ve "Fictional • Original" etiketli.
- **Öz değerlendirme:** Kelime sayacı, Synthesis için kaynak atıf sayacı, isteğe bağlı süre sayacı (55 dakika modunda okuma süresi duyurusu) ve rubrik satırlarına göre kontrol listesi. Toplam puan 0–6 olarak canlı hesaplanır.
- **Saklama:** `apazra:frq:v1`. Kişi verisi takasına ve yedeğe dahildir.
- **Bilinen sınır:** Yedek "birleştir" modunda içe aktarılırsa cihazdaki taslak korunur; içe aktarılan taslak birleştirilmez. "Değiştir" modunda sorun yok. Bu iş Ajan 11'in backlog'unda (§14.2).

### 25.4. Mevcut İçerikte Düzeltmeler
- `econ_q6` (kapanma kuralı) Micro 3.5'ten 3.6'ya taşındı.
- CS A kartı "40 MCQ" → "42 MCQ (4 şık)" oldu ve 2025-26 CED'e uyarlandı.
- `sv_phys1_u6_2` seviye sorusunun kaynak etiketi 6.6 → 6.5 (Rolling) olarak düzeltildi.

### 25.5. Deneme Havuzu (`data/deneme-bankasi.js`, PM üretti)
| Kod | Önce | Sonra |
| :--- | :--- | :--- |
| calculus-ab | 148 | 148 |
| calculus-bc | 160 | **184** (Unit 9: 24) |
| physics-1 | 109 | **131** (Unit 6: 1 → 23) |
| chemistry | 119 | **144** (Unit 7: 24; Unit 8: 1) |
| biology | 103 | **134** (Unit 2: 18; Unit 6: 26) |
| english-language | 32 | **41** (Skill 8: 10) |
| cs-a | 20 | **48** |
| economics | 20 | **65** (12 ünitenin hepsi kapsanıyor) |
| cents | 60 | 60 |

Havuz toplamı 623 → **807**. Eşlenemeyen soru: yalnızca bilinçli olarak dışarıda tutulan 6 Physics C sorusu.

### 25.6. PM Doğrulaması
- **Bağımsız yeniden hesap:** Her dersten bir örnek soru, ajanın çıktısından bağımsız olarak hesaplandı. 6/6 işaretli doğru şıkla uyuştu:
  - `calc_u9_q6`: yay uzunluğu 52/3 (sayısal 17,3333)
  - `phys_u6_q12`: ω = 240/360 = 0,67 rad/s
  - `chem_u7_q17`: K = 49, [HI] = 0,761 M
  - `bio_u6_q23`: 5·2²⁰ = 5.242.880
  - `csa_d12`: mystery(13) = 23
  - `econ_mi5c`: L = 6, W = 16
- **Denetimler:** `pm-denetim` **813 soru, 0 sorun** · `ad-denetimi` 0 sorun.
- **Birim testleri:** eposta 106/106, rota 51/51.
- **Tarayıcı testleri:** interact, backup, ulke, seviye, pm-seviye, deneme geçti; hesap 156/156; yazisma 64/64; rota 225/225; tasarim 51/51.
- **Tasarım uyumu:** Yeni bölümler tasarım sistemi v3'e uygun. Satır içi stil ve emoji yok; içindekilerde görünüyorlar.

---

## 26. TUR 10 (14 EKİM 2026) — AÇIK ŞARTLAR, MEZUN PROFİLİ, MEZUN MENÜSÜ, KLASÖR DÜZENİ (PM Onaylı)

Kullanıcının üç talebi vardı:
- Giriş yapmayan öğrenci (9–12. sınıf ve mezun) ülke bazındaki şartları görebilmeli.
- Ders, soru ve deneme girişten sonra açılmalı; kişisel koçluk girişle başlamalı.
- Mezunlar da planlanmalı.

PM planı kullanıcı tarafından onaylandı ("onaylıyorum, başlat"). İşleri Ajan 11 (arayüz), Ajan 13 (mevzuat) ve PM (veri dosyaları) yürüttü.

### 26.1. Kullanıcı kararları (14 Ekim 2026)
| Kod | Karar |
| :--- | :--- |
| **K4** | Girişsiz erişim yalnızca ülke × sınıf şartları ve genel bilgi sayfalarıyla sınırlı. Ders, soru, deneme, rota ve yazışmalar girişten sonra açılıyor. Mezunlar da kapsamda. |
| **K4-a** | Hem Almanya hem İtalya'yı seçen mezuna Türkiye'de lisans kaydı / DSU uyarısı gösterilir. |
| **K5-a** | Mezun profilinde hedef başlangıç yılı ve YKS yerleşme durumu sorulur. |
| **K5-b** | Mezunda AP adımları gizlenir; yalnızca bilgi notu kalır. |
| **K5-c** | Proje adı **AP MEBERRA** olarak kalır. Klasör `AP AZRA` → `AP MEBERRA` olarak tur sonunda yeniden adlandırılır. Kod adları `apazra:`/`APAZRA_*` → `apmeberra:`/`APMEBERRA_*` olarak değişir ve eski kayıtlar taşınır. |
| **K-A** | Mezun Menüsü Macaristan + Polonya ile başlar. Avusturya ve Hollanda, teyit e-postaları (T-D1/T-D2) yanıtlanınca eklenir. |
| **K-C** | BME duyurusu eklenir (15 Ekim–15 Kasım 2026); 15 Kasım'dan sonra otomatik kalkar. |

### 26.2. K4 — Açık ve kilitli sayfalar (Ajan 11 + PM)
- **Açık sayfa listesi:** Tek kaynak `assets/js/app.js` içindeki `APMEBERRA_ACIK_SAYFALAR`. Açık sayfalar:
  - giris, sartlar, mezun
  - almanya-muhendislik, italya-muhendislik
  - universiteler, sinavlar, istanbul-sinav-rehberi
  - bilgi-merkezi, ajanlar

  Diğer sayfalar kilitli. Oturum yoksa `index.html` → `sartlar.html` yönlendirmesi yapılıyor.
- **`sartlar.html` (yeni):** Ülke (DE/IT) ve sınıf (9/10/11/12/mezun) seçimine göre şartları ve genel yol haritasını gösteriyor. Motoru `assets/js/sartlar-motor.js`.
- **`data/mevzuat/sartlar.js` (PM):** **74 madde** (74 tekil id), sürüm 1.1.0, son kontrol 14 Ekim 2026.
- **Ön doldurma:** Ziyaretçi `sartlar.html`'den kayda geçince ülke ve sınıf seçimi `giris.html` ve `profil.html`'ye taşınıyor.
- **Ziyaretçi görünümü:** `sinavlar.html` ve `universiteler.html` girişsiz açılıyor.
- **Kişi adı:** Açık sayfalarda kişi adı yok (ad genelleştirme, §26.6).

### 26.3. K5 — Mezun profili ve rota (Ajan 11)
- **Profil (`auth.js`):** İki yeni alan var:
  - `hedefBaslangicYili`: varsayılan 2027/28.
  - `yerlesmeDurumu`: `uygun` / `yok` / `alan-uyumsuz`.
- **Rota (`rota.js`):**
  - Mezunda tarihler, hedef yıla göre hesaplanan sanal mezuniyet yılından üretiliyor.
  - `kosul: "yerlesme-yok"` alanı geldi.
  - Kesinlik etiketleri hedef yıla göre değişiyor (`kesinlikYila`).
  - `profilUyarilari` ve "bilgi" adım türü eklendi.
  - Mezunda okul dönemi adımları "Şimdi" olarak gösteriliyor.
- **`data/mevzuat/ulke-rotalari.js`:**
  - Ajan 13'ün önerisiyle 8 yeni adım eklendi: Almanya 16 → **20**, İtalya 17 → **21**.
  - K4-a uyarısı `APMEBERRA_ROTA_UYARILARI` içinde. Panelim ve Rotam'da gösteriliyor.
- **Ekranlar:** `profil.html`'de mezun kutusu var. `rota.html`, `index.html` ve `sinavlar.html` mezun için düzenlendi.

### 26.4. Ajan 13 — mezun mevzuatı
| Not | İçerik |
| :--- | :--- |
| `.agents/mevzuat/karar-notu-2026-10-14-mezun-sinif.md` | **34 bulgu**: 26 Doğrulandı, 7 Teyit gerekir, 1 Yoruma açık. Ayrıca 8 rota adımı önerisi, MS-1…MS-6 ve teyit taslakları T-M1…T-M4. |
| `.agents/mevzuat/karar-notu-2026-10-14-mezun-diger-ulkeler.md` | 11 ülke, **55 bulgu**, 47 kaynak. DU-1…DU-10 ve teyit taslakları T-D1…T-D4. |

Kritik bulgular:
- **Almanya:** Mezun için AP yolu kapalı. Geçmiş yıl YKS yerleşmesi yolu açık.
- **YKS yerleşmesi:** Önceki yıl yerleşen adayın OBP katsayısı yarıya iner.
- **İtalya:** Mezunlara açık.
- **PoliMi DSU:** Türkiye'de lisans kaydı yaptıran öğrenci 1. sınıf burs profilini kaybeder. K4-a uyarısının dayanağı bu.

Takip listesi `.agents/mevzuat/takip-listesi.md` güncellendi.

### 26.5. Mezun Menüsü (`mezun.html`, açık sayfa)
- **Veri (PM):** `data/mevzuat/mezun-ulkeler.js` (`APMEBERRA_MEZUN_ULKELER`), toplam **26 madde**:
  - Macaristan 16 madde.
  - Polonya 9 madde; ülke rozeti "Teyit gerekir".
  - 1 duyuru: BME, bitiş 15 Kasım 2026.
  - Ayrıca menüye alınmayan 9 ülke, nedeni ve kaynağıyla listeleniyor.
- **Arayüz (Ajan 11):**
  - Almanya ve İtalya mezun şartlarına giden iki rota kartı.
  - Duyurular bitiş gününe kadar (o gün dahil) gösteriliyor.
  - Macaristan / Polonya sekmeleri klavyeyle kullanılabiliyor; `?ulke=hu|pl` adresiyle açılıyor.
  - Altta diğer ülkeler listesi var.
  - Ortak madde bileşeni `assets/js/sartlar-ui.js`'e taşındı; `sartlar.html` ile paylaşılıyor.
- **Bağlantılar:**
  - `sartlar.html`'de mezun seçilince Mezun Menüsü kutusu çıkıyor.
  - Mezunun Panelim'inde Mezun Menüsü kartı ve BME duyurusu var.
  - Menüde "Mezunlar" bağlantısı var.

### 26.6. İçerik düzeltmeleri ve ad genelleştirme
- **`italya-muhendislik.html`:** 75/100 erken kabul bilgisi iki yerde düzeltildi. Bilgi yalnızca İtalyanca programlar için geçerli (Art. 3); rozet "Yayımlanmadı".
- **Ad genelleştirme ("Meberra" → genel hitap):**
  - 8 açık dosyada 56 satır.
  - `assets/js/app.js` ajan metinlerinde 20 geçiş.
  - Olgu, tarih ve kaynaklara dokunulmadı.
- **Kalan "Meberra" geçişleri:** Kilitli ders sayfaları, `deneme.html`, `ilerleme.html`, `index.html`, `seviye-testi.html`, `sinav-cents.html` ve `eposta-sablonlari.js`'te hâlâ var. Bir kısmı "AP Meberra Mentorship System" altbilgisi. Bunlar backlog'da (§14.2).

### 26.7. Klasör düzeni ve kod adları (Ajan 11)
- **Klasör düzeni:** `HARITA.md` §1'e göre **39 taşıma** yapıldı:
  - `assets/css`, `assets/js`
  - `data/mevzuat`, `data/rehber`, `data/kocluk`, `data/sorular` (+`seviye/`)
  - `kaynaklar/pdf`, `belgeler/hibe` (eski `grants/`), `sunum/arsiv`

  54 dosyada yollar güncellendi. Sayfalar kökte kaldı. `HARITA.md` sayfa → veri haritasıyla birlikte gerçek duruma güncellendi.
- **Kod adları:** 67 dosyada 535 geçiş değişti: `apazra:` → `apmeberra:`, `APAZRA_*` → `APMEBERRA_*`.
- **Eski kayıtların taşınması:** `assets/js/app.js` başındaki `apMeberraTasima` işlevi eski anahtarları kopyalıyor ve her kopyayı geri okuyarak doğruluyor. Hepsi doğruysa eski anahtarları siliyor ve `apmeberra-tasima` işaretini yazıyor. Hata olursa eski anahtarlar silinmiyor; sonraki açılışta yeniden deneniyor.
- **Eski yedekler:** Eski biçimli yedekler (`apazra-yedek`) de kabul ediliyor.
- **`ad-denetimi.js`:** Artık `apazra` de eski ad sayılıyor. Gerekçeli izin listesi `KOD_ADI_IZIN`'de: taşıma sabitleri, `tasima-test.js`, `proje.md` ve `DEVAM-NOKTASI.md` (tarihsel kayıt).
- **Bilinen sınır:** Taşımadan sonraki ilk açılışta koyu tema kullanıcısı kısa bir açık tema görebilir; `app.js` çalışınca tema düzeliyor.

### 26.8. PM doğrulaması ve teslim
- **Denetimler:** `pm-denetim` **813 soru, 0 sorun** (PM yeniden çalıştırdı) · `ad-denetimi` **0 sorun**.
- **Deneme havuzu:** Yeniden üretildi; 807 soru, değişmedi.
- **Birim testleri:**
  | Test | Sonuç |
  | :--- | :--- |
  | sartlar-birim | 45/0 |
  | rota-birim | 51/0 |
  | eposta-birim | 119/0 |
  | mezun-birim (yeni) | 59/0 |
  | tasima-test (yeni) | 17/0 |
- **Tarayıcı testleri:**
  | Test | Sonuç |
  | :--- | :--- |
  | mezun-menu-test (yeni) | 27/0 |
  | mezun-test (yeni) | 56/0 |
  | erisim-test (yeni) | 79/0 |
  | rota | 225/0 |
  | hesap | 157/0 |
  | yazisma | 64/0 |
  | tasarim | 52/0 |
  | interact | 27/0 |
  | backup | 51/0 |
  | deneme | 58/0 |
  | seviye | 104/0 |
  | pm-seviye | 17/0 |
  | ulke | 0 hata |
- **Paket:** `sunum/AP-MEBERRA-Sunum-2026-10-14.zip`: 14,0 MB, 69 dosya. paket-test 11/0, sv-paket 4/0; ağ isteği 0, sayfa hatası 0.
- **Klasör adı:** Test betikleri mutlak proje yolunu kullanıyor. Klasör yeniden adlandırıldıktan sonra bu yollar ve `ad-denetimi.js` `PATH_ALLOW` güncellenmeli (§14.2, Ajan 11).

---

## 27. TUR 11 (15 EKİM 2026) — ÜÇ ÖĞRENCİ MODELİ × 15 ÜLKE × EĞİTİM DİLİ, İLK 20 ÜNİVERSİTE, SÜRÜM ARŞİVİ (PM Onaylı)

### 27.1. Kullanıcı kararları (15 Ekim 2026)
| Kod | Karar |
| :--- | :--- |
| **K6** | Yeni öğrenci modeli **Üniversite mezunu** (Avrupa'da yüksek lisans). "Mezun" ikiye ayrıldı: **Lise mezunu** / **Üniversite mezunu**. |
| **K7** | Öğrenci modeli × ülke × eğitim dili seçilebilir. Almanya/İtalya kısıtı tüm modellerde kalktı; 15 ülke: de, it, at, ch, nl, be, fr, es, se, fi, dk, ie, hu, pl, cz. |
| **K8** | Her ülkede **en iyi 20 üniversite** (PM: QS World University Rankings'in en güncel baskısı = QS WUR 2027, Haziran 2026; ülkede 20'den az varsa hepsi). |
| **K9** | Eğitim dili **İngilizce / yerel dil** seçmeli; şartlar, tarihler, hatalar ve burslar seçime göre gelir. |
| **K10** | Her eklemede **sürüm arşivi**; `proje.md` "★ GÜNCEL DURUM" bölümü her teslimde güncellenir; Ajan 11 her eklemede ekranı baştan planlar (AGENTS.md §2.1 md. 6–8). |

### 27.2. Ön iş (PM)
- Klasör adı `AP MEBERRA` oldu. 16 test betiğindeki eski `AP AZRA` yolları güncellendi; tam regresyon geçti (5 birim + 15 tarayıcı).
- **Sürüm arşivi:** `araclar/surum-arsivle.js` (zip + `SURUM.json` içinde her dosyanın SHA-256'sı + açıp yeniden doğrulama) ve `SURUMLER.md` günlüğü. Başlangıç: **v10.1** (101 dosya, 2,5 MB). `ad-denetimi` `arsiv/` klasörünü atlar.
- `proje.md` en üstüne "★ GÜNCEL DURUM" bölümü; AGENTS.md §2.1 madde 7–8.

### 27.3. Ajan 13 — araştırma (10 kol, birincil kaynak)
| Kol | Çıktı | Madde | Kesinlik |
| :--- | :--- | ---: | :--- |
| YL Almanya | `yl-de.json`, karar notu | 68 | 56 D · 7 T · 2 Y · 2 YA · 1 DY |
| YL İtalya | `yl-it.json` | 74 | 51 D · 9 T · 9 Y · 3 YA · 2 DY |
| YL Batı (AT CH NL BE FR ES) | 6 dosya | 131 | 99 D · 21 T · 5 Y · 1 YA · 5 DY |
| YL Kuzey/Orta (SE FI DK IE HU PL CZ) | 7 dosya | 133 | 98 D · 20 T · 8 Y · 2 YA · 5 DY |
| YL Türkiye + AB + dil sınavları | `yl-genel.json` | 46 + 16 sınav | 35 D · 11 T · 2 Y · 13 YA · 1 DY |
| Lisans DE/IT yerel dil yolu | `lisans-de/it.json` | 82 yeni + 74 eski madde sınıflandı | 66 D · 10 T · 3 YA · 3 Y |
| Lisans Batı | 6 dosya | 203 | 148 D · 27 T · 25 YA · 3 DY |
| Lisans Kuzey/Orta | 7 dosya | 219 | 170 D · 22 T · 9 YA · 9 Y · 9 DY |
| İlk 20 Batı (8 ülke) | `uni-*.json` | 124 üniversite | QS WUR 2027 |
| İlk 20 Kuzey/Orta (7 ülke) | `uni-*.json` | 78 üniversite | QS WUR 2027 |

(D = Doğrulandı, T = Teyit gerekir, Y = Yayımlanmadı, YA = Yoruma açık, DY = Doğrulanamadı.) Karar notları `.agents/mevzuat/karar-notu-2026-10-15-*.md` (10 not). Takip listesine yeni bölümler: YL-DE, YL-IT, YL, YB, LD, LB, LK, IL, IW. **72 teyit e-postası taslağı** tek listede: `.agents/mevzuat/teyit-taslaklari-tur11.json`.
**Sınır:** Oturumun ortak web arama kotası (200) tur ortasında doldu; kalan kontroller resmi URL'lere doğrudan erişimle yapıldı. Erişilemeyen noktalar "Teyit gerekir"/"Doğrulanamadı" olarak kaldı (tahmin yok).

**PM bağımsız doğrulamaları (resmi kaynaktan, 15 Ekim 2026):** TUM YL harcı 4.000/6.000 € → 2027/28'den 4.600/6.800 € ✓ · Jean Monnet 2027-28 son başvuru 27 Ekim 2026, TOEFL 86 (4.5) / IELTS 6.5 ✓ · ETH Zürich yurt dışı lisanslılar 1–30 Kasım 2026 ✓ · universityadmissions.se güz 2027: 16 Ekim 2026 – 15 Ocak 2027, belgeler 1 Şubat ✓ · Groningen Türk diploması: 4 AP, Physics/Applied Physics için AP Physics 2, Physics C yetersiz ✓. Otomatik şema denetimi: 504 lisans + 452 YL maddesi, 0 sorun.

### 27.4. PM kararları (ajan önerilerinden)
- **Almanca lisans yolu:** 9–10. sınıfa önerilir; 11. sınıfa yalnız B2'ye yakınsa; 12. sınıf ve mezuna yoğun kurs / bir yıl kayma uyarısıyla (C1 için 800–1.000 ders saati, Goethe). Goethe C1 "üniversiteye göre değişir".
- **`it-sartlar` düzeltildi:** "İngilizce B2" → "programın öğretim dilinde B2" (MUR genelgesi §6). `it-test-suresi` İngilizce yola etiketlendi; TOLC geçerlilik maddesi yerel yola eklendi.
- **İlk 20:** "kısıtlı" → `kismi`, "Doğrulanamadı" → `teyit` (üreticide). Doğrulanamayan hücreler gizlenmez, listenin sonunda rozetle gösterilir. "Var" = en az 3 program. Kaynaksız 35 hücre "Doğrulanamadı"ya çevrildi; kaynak = üniversitenin resmi sitesi.
- **Özet uyarıları (K-D):** de, ch, fr, se, dk için "İngilizce lisans dar" uyarısı (kaynaklı). Özet seviyesi yalnızca "var" sayısıyla hesaplanır.
- **Ülke rozetleri:** dk ve ie "Teyit gerekir" (DTU/Trinity teyitleri bekleniyor); pl rozeti kaldırıldı (Gdańsk TÜ Türkiye'yi tanınma muafiyetinde sayıyor). 15 ülkenin hiçbiri gizlenmez.
- **Jean Monnet:** yalnız uygun profile (≤12 ay, AB politika alanı, Türkiye'de çalışan/öğrenci) gösterilir. **MEB 1416 (YLSY):** 2028/29 yedek planı. **Duolingo:** yalnız programın kabul ettiği yazılıysa.

### 27.5. PM aktarımı (`araclar/mevzuat-aktar.js`, yeni)
- `.agents/mevzuat/dogrulama/` + Ajan 11'in eski DE/IT/HU/PL taşıması (`.agents/mevzuat/tasima/`) → `data/mevzuat/kaynak/` (46 dosya). Eski maddeler Ajan 13 sınıflandırmasıyla `dil="en"` aldı.
- Sonuç: **15 ülke · lisans 604 madde** (462 D · 67 T · 41 YA · 22 Y · 12 DY) · **YL 452 madde** (406 ülke + 46 genel; 332 D · 62 T · 26 Y · 19 YA · 13 DY) · **202 üniversite** (İngilizce lisans: 89 var · 44 kısıtlı · 32 yok · 37 Doğrulanamadı).
- `mezun-notlari.json` > fi: "12.000 € ve üzeri" → "İngilizce programlar genellikle 9.000–20.000 €/yıl (Aalto 12.000 €); Fince/İsveççe ücretsiz" (Study in Finland).

### 27.6. Ajan 11 — ekran planı ve uygulama
- **Plan:** `.agents/rules/tur11-ekran-plani.md`, kararlar D1–D8 (PM onaylı): yeni sayfa yok; `sartlar.html` tek seçicili sayfa (durum → sınıf → ülke → dil); `mezun.html` yönlendirme; `universiteler.html` QS ilk 20 + DE/IT seçilmiş liste; profil v2; ülke başına tek veri dosyası (üretici); DE/IT dışı ve YL için genel yol haritası.
- **URL:** `sartlar.html?model=lise|lise-mezun|uni-mezun&sinif=9..12&ulke=<cc>&dil=en|yerel`. Eski adresler çalışır (`?sinif=mezun` → lise mezunu). İrlanda'da dil her zaman İngilizce.
- **Yeni dosyalar:** `araclar/ulke-veri-olustur.js` (üretici + şema denetimi), `araclar/kaynak-tasima.js`, `data/mevzuat/kaynak/{ulkeler-meta,duyurular,mezun-notlari}.json`; üretilenler `data/mevzuat/ulke-dizini.js`, `data/mevzuat/ulke/<cc>.js` (15), `yl-genel.js`, `duyurular.js`.
- **Değişen:** sartlar, mezun, universiteler, profil (4 adımlı sihirbaz), index (YL kartı, AP bölümleri üniversite mezununda gizli), rota (genel yol haritası), sinavlar, giris; `sartlar-motor.js`, `sartlar-ui.js`, `app.js` (menü modele göre süzülür), `auth.js` (profil şeması v2: `ogrenciModeli`, `egitimDili`, en fazla 5 ülke, lisans bilgileri; eski kayıt okuma anında taşınır), `rota.js`, `eposta.js`, `styles.css`, `sunum-olustur.js`.
- `sartlar.js` ve `mezun-ulkeler.js` taşındı ama silinmedi (eşdeğerlik testi okuyor).

### 27.7. Doğruluk düzeltmeleri
- `proje.md` §(eski) "TUM, RWTH İngilizce lisans; PoliMi/PoliTo/Bologna %100 İngilizce" → yanlış; satıra PM düzeltme notu eklendi (RWTH'de İngilizce lisans yok; PoliMi 22/29, PoliTo 19/26 lisans yalnız İtalyanca).
- `AGENTS.md` §1 "%100 İngilizce PoliMi/PoliTo/Sapienza" → "üniversitelerin İngilizce programları"; Tur 11 kapsamı eklendi.

### 27.8. PM doğrulaması ve teslim
- **Denetimler:** `pm-denetim` 813 soru, 0 sorun · `ad-denetimi` 0 sorun · `ulke-veri-olustur` 0 sorun · `mevzuat-aktar` 0 sorun.
- **Birim testleri:** sartlar-birim 45/0 · rota-birim 52/0 · eposta-birim 119/0 · mezun-birim 59/0 · **secici-birim 95/0 (yeni)** · **profil-v2-birim 30/0 (yeni)** · **ulke-veri 55/0 (yeni)**.
- **Tarayıcı testleri:** **tur11 89/0 (yeni)** · erisim 88/0 · mezun-menu 24/0 · mezun 54/0 · rota 225/0 · hesap 159/0 · yazisma 64/0 · tasarim 52/0 · interact, backup, deneme, seviye, pm-seviye geçti · ulke 0 hata · tasima 17/0. Testler PM tarafından yeniden çalıştırıldı.
- **Ekran görüntüleri** (1280/390, açık/koyu): lise·11·de·en, lise·11·de·yerel, uni-mezun·se·en, lise-mezun·nl·en, universiteler·de·lisans·en; 360/390 px'te taşma 0. PM inceledi; şehir alanındaki posta kodu (uni-de) aktarımda temizlendi.
- **Paket:** `sunum/AP-MEBERRA-Sunum-2026-10-15.zip`: 14,2 MB, 106 dosya; paket-test ve sv-paket geçti (ağ isteği 0, sayfa hatası 0). `kaynak/` pakete girmez.
- **Sürüm:** v11.0 (`arsiv/surumler/`), `SURUMLER.md`.

### 27.9. Açık kalanlar (Tur 12 backlog'u)
1. **Sınav verisi:** `sinavlar.js` yalnız DE/IT; 13 ülkenin yerel dil sınavları (NT2, TISUS, DELE, DELF, YKI…) ve GRE `yl-genel.json` > dilSinavlari'nden `sinavlar.js`'e taşınmalı (Ajan 2 + Ajan 11).
2. **Yazışma şablonları** yalnız DE/IT; 72 teyit taslağı (`teyit-taslaklari-tur11.json`) Yazışmalarım'a eklenmeli.
3. **Doğrulanamadı hücreleri:** 37 üniversite × lisans-EN (çoğu İspanya, İtalya, Hollanda; bot koruması / tarayıcı gerektiren kataloglar) — tarayıcıyla ikinci tur.
4. **Rota düzeltmeleri** (`ulke-rotalari.js`): `de-vize` (Auslandsportal, 1–4 ay), `it-vize` (10.179,85 €), `de-almanca` İngilizce yola etiketlenmeli.
5. **Ertelenen:** ülke başına ayrı dil tercihi (R6), İsviçre/Belçika ikinci yerel dil parametresi (R7); `sartlar.js` / `mezun-ulkeler.js`'in silinmesi (PM kararı).
6. **Öğrenciye özel stratejik konu:** Groningen fizik programları AP Physics 2 istiyor (Physics C yetersiz). 12. sınıf fizik AP seçimi Konsensüs Kuralı (AGENTS.md §3/1) ile değerlendirilecek: Dr. Emre Yıldız + Dr. Weber + PM.

---

## 28. TUR 12 (15–16 EKİM 2026) — SINAVLAR VE YAZIŞMALAR 15 ÜLKEDE, İLK 20 İKİNCİ TUR, 2 YENİ ÜNİTE, KAYNAK PDF'LER (PM Onaylı)

Kullanıcı talimatı: "devam edelim" (Tur 11 backlog'u §27.9) ve 16 Ekim 2026'da "Kaynaklar içine yeni dökümanlar ekledim, işine yarayanları kullan". 7 kol paralel yürüdü.

### 28.1. Ajan 13 — ilk 20 ikinci tur (tarayıcı + ulusal kataloglar)
- Web araması kullanılmadan Playwright ve resmi açık veri kaynaklarıyla (Studiekeuze123, studyprogrammes.ch, QEDU, Parcoursup/Mon Master, DreamApply) **161 açık dil hücresinin 155'i kapandı**: İspanya 56→0, İtalya 25→5, Hollanda 25→0, Belçika 16→0, İsviçre 13→0, Fransa 9→1, Avusturya 8→0, Macaristan 5→0, Polonya 4→0. Bot doğrulaması aşılmaya çalışılmadı. Açık kalan 6: UniBS (4), UniFi lisans EN, Toulouse III YL EN (teyit taslakları karar notu §4).
- **Eşik tek kural (PM kararı, Tur 11 K-C):** "var" = en az 3 program. Batı grubu 8 dosyada "en az 4" kullanmıştı; düzeltildi, 10 hücre kısıtlı → var. UGent İngilizce lisans "kısıtlı" kaldı (3 programın üçü Güney Kore kampüsünde). Yalnız QEDU'ya dayanan İspanya hücreleri "kısıtlı" (QEDU tam/kısmi İngilizceyi ayırmıyor).
- **Sonuç (202 üniversite):** İngilizce lisans **105 var · 61 kısıtlı · 34 yok · 2 Doğrulanamadı** (Tur 11: 89 · 44 · 32 · 37). İngilizce YL 185 var · 15 kısıtlı · 2 Doğrulanamadı.
- Yeni İngilizce mühendislik lisansları: UPV (4), UPF (4), KU Leuven (8, Engineering Technology dahil), UAB (AI), Siena (Biotech Eng.), USI. Karar notu: `.agents/mevzuat/karar-notu-2026-10-15-ilk20-ikinci-tur.md`.

### 28.2. Ajan 13 — 15 ülke dil sınavları + GRE/GMAT
- `sinavlar-tur12.json`: **29 yeni kayıt** (15 Doğrulandı, 12 Teyit gerekir, 1 Yoruma açık, 1 Doğrulanamadı) + **14 güncelleme**. `sinavlar.js` **18 → 47 kayıt**, 12 dil (en 20 · de 6 · it 3 · fr 3 · nl 3 · es 2 · sv, fi, da, pl, cs, hu 1'er).
- **PM kararları:** AP kayıtlarında `ulkeler` = "ilgili ülke" (de/it kalır, nl ve Calculus'ta be eklenir; not alanı Türk diplomasında resmi rolün yalnız Hollanda'da olduğunu yazar). **AP Physics 2** kaydı eklendi (6 Mayıs 2027 Session 1; PM College Board sayfasından doğruladı) ve `sinav-takvimi.js`'e satırı eklendi.
- **Kritik bulgular:** Polonya'da C1 Lehçe devlet sertifikasıyla devlet üniversitesinde Lehçe eğitim ücretsiz (Yükseköğretim Kanunu md. 324; Tur 11 ilk-20 ajanıyla bağımsız tutarlı). Twente: mühendislikte matematik şartını yalnız **Calculus BC** karşılıyor (AB yetmez); fizik için Physics 1+2 birlikte ya da tek bir Physics C. Jean Monnet 2027-28 "Açıklamalar" belgesi yayımlandı (YL-1 kapandı).
- **Tur 11 düzeltmeleri:** 11 düzeltme + 4 tutarlılık = 21 madde, 10 bulgu dosyası (Polonya C1, CILS/CELI 2027 takvimi, TCF 2 yıl, PTE/GMAT Türkiye ücreti, YKI yalnız Finlandiya'da, CNaVT İstanbul/Bodrum, DELE İstanbul ücretleri).

### 28.3. Ajan 11 — Sınavlar ve Yazışmalarım (plan `.agents/rules/tur12-ekran-plani.md`, S1–S8 / Y1–Y6 / R1)
- **Sınavlar:** durum → sınıf → ülke → sınav dili seçim çubuğu (URL `model/sinif/ulke/dil`, profil varsayılan); üniversite mezununda AP gizli (bantla açılır), "GRE / GMAT" sekmesi; kartlarda dil, düzey, kesinlik, ücret, son kontrol. Yeni `assets/js/sinav-motor.js`, `araclar/sinav-aktar.js` (idempotent, `--kuru`, `--mevcut`). Şartlar sayfasında "Dil sınavları" bölümü 15 ülkede açık.
- **Yazışmalarım:** durum × 15 ülke süzgeci; **72 hazır teyit taslağı** (`araclar/teyit-taslak-olustur.js` → `data/kocluk/teyit-taslaklari.js`). E-posta programına yalnızca kaynaklı adres yazılır (13 adresten 1'i: `study@tcd.ie`); diğerleri uyarıyla gösterilir. Doldurulmamış `[Name]` alanları gönderim öncesi uyarılır.
- **Rota dili (R1):** adımlarda `dil` süzgeci; Almanca yolda `de-almanca` gizli.

### 28.4. Ajan 12 — içerik
- **Faz 34 — Calculus BC Unit 10** (Infinite Sequences and Series, CED 10.1–10.15): İngilizce anlatım + **39 soru** (`calc_u10_q1–39`; 31 tek konulu + 2 FRQ tarzı set × 4 parça; A10 B10 C9 D10). 29 sayısal/sembolik cevap node + sympy ile bağımsız hesaplandı. Calculus BC'nin 10 ünitesi tamam → `sinavlar.js` ap-calculus-bc **"hazir"**.
- **Faz 35 — Chemistry Unit 8** (Acids and Bases, CED 8.1–8.10): İngilizce anlatım + 4 parçalı HOCl FRQ + **28 soru** (`chem_u8_q1–28`; A7 B7 C7 D7). 18 sayısal cevap bağımsız hesaplandı.
- **PM bağımsız doğrulaması:** Unit 8'den 6 soru (q3, q6, q13, q14, q17, q25) ve Unit 10'dan 6 soru (q4, q20, q33, q34, q36, q37) PM tarafından yeniden hesaplandı: **12/12 doğru**.
- PM düzeltmeleri: seviye bankalarında Chemistry Unit 8 ve Calculus Unit 10 `portaldaVar: true`; `ap-calculus.html` sınav yönergesi May 2027 biçimine (42 MCQ: 29 + 13) düzeltildi.

### 28.5. Kullanıcının eklediği kaynak PDF'ler (19 yeni + PM'in indirdiği 1)
- **Envanter** `kaynaklar/pdf/kaynak-listesi.json`: 26 PDF — resmi CB 4, formül/referans 8, hesap makinesi 1, ticari kitap 5, Türkçe rehber 6, diğer 2; **pakete 19, yerelde 7** (ticari kitaplar ve TI-Nspire kılavuzu).
- **ap-calculus.html'e 3 bölüm:** **Resmi FRQ Arşivi** (2025 + 2026 BC, 12 FRQ, **108 öz değerlendirme ölçütü**, "College Board Official Exam" etiketi, yerel PDF sayfa bağlantıları; depolama `apmeberra:calc-frq:v1`, platform sözleşmesine işlendi) · **Hesap makinesi kartı** (TI-84 / TI-Nspire, AP'de izinli 4 işlev; kılavuzdaki bir menü hatası düzeltildi) · **Referans kitaplığı** (9 PDF + "AP Calculus sınavında formül sayfası verilmez" uyarısı, AP Central kaynaklı).
- **AP-Calculus-BC-2.pdf resmi College Board yayını değil** (© yok, 5 şık, crackap.com reklamı, eski biçim): portala eklenmedi. Ticari kitaplardan (Stewart, George Best, iki Study Guide) metin/soru kopyalanmadı; yalnız kapsam karşılaştırması yapıldı → `.agents/icerik/calculus-kapsam-tur12.md` (8 sorusuz CED topic: 1.1–1.4, 1.9, 1.12, 5.8, 6.14; 6 zayıf alan).
- PM: 2026 BC puanlama kılavuzu AP Central'dan indirildi (`ap26-sg-calculus-bc.pdf`, 23 s.). `sunum-olustur.js`: envanterdeki paket=false PDF'ler pakete girmez; portaldaki `kaynaklar/pdf/` bağlantıları pakette `../kaynak-pdf/`'e çevrilir.

### 28.6. PM — rota ve araç düzeltmeleri
- `ulke-rotalari.js`: `de-vize` (Auslandsportal zorunlu, kayıttan başvuruya 1–4 ay; kaynak Almanya'nın Türkiye temsilcilikleri), `it-vize` (yıllık 10.179,85 € geçim kanıtı, DSU başvurusu kanıt sayılmaz; MUR genelgesi), `de-almanca` → `dil: "en"`.
- **Paket tarihi hatası:** `sunum-olustur.js` UTC tarih kullandığı için gece yarısından sonra Tur 11 paketinin (`2026-10-15.zip`) üzerine yazdı. Yerel tarihe çevrildi; **Tur 11 paketi v11.0 sürüm arşivinden yeniden üretildi** (6 PDF hash doğrulandı, 106 dosya). Sürüm arşivinin ilk pratik kullanımı.

### 28.7. Groningen / AP Physics 2 — karar önerisi (kullanıcı kararı bekleniyor)
Groningen yalnız *Physics* ve *Applied Physics* programlarında AP Physics 2 istiyor (Physics C yetersiz); Industrial Engineering, Computing Science ve Mathematics yalnız Calculus istiyor; Twente Physics C kabul ediyor. Ana rota Almanya/İtalya'da AP'nin Türk diplomasında resmi rolü yok. **PM önerisi:** Physics 1 → Physics C planı kalsın; Groningen Physics/Applied Physics hedefe girerse 12. sınıfta Physics C yerine Physics 2.

### 28.8. PM doğrulaması ve teslim
- **Denetimler:** `pm-denetim` **880 soru, 0 sorun** · `ad-denetimi` 0 · `mevzuat-aktar` 0 (2 kaynaksız hücre → Doğrulanamadı) · `ulke-veri-olustur` 0 · `sinav-aktar` 0 · `teyit-taslak-olustur` 0.
- **Mevzuat verisi:** lisans 604 madde (465 D · 66 T · 41 YA · 22 Y · 10 DY) · YL 452 madde (339 D · 60 T · 24 Y · 19 YA · 10 DY).
- **Birim testleri:** sartlar-birim 45 · rota-birim **62** (52 + 10 yeni) · eposta-birim 119 · mezun-birim 59 · secici-birim 95 · profil-v2-birim 30 · ulke-veri 55 · **sinav-birim 183 (yeni)** · **taslak-birim 57 (yeni)** — hepsi 0 kaldı.
- **Tarayıcı testleri:** **sinav 111 (yeni)** · **yazisma-taslak 87 (yeni)** · **calc-frq 20 (yeni)** · tur11 89 · erisim 88 · mezun-menu 24 · mezun 54 · rota 225 · hesap 159 · yazisma 64 · tasarim 52 · tasima 17 · interact, backup, deneme, seviye, pm-seviye geçti · ulke 0 hata. Testler PM tarafından yeniden çalıştırıldı. `sinav-birim` ilk çalıştırmada aktarım sonrası veriyle 15 hata verdi (test aktarım öncesi veriyi varsayıyordu); Ajan 11 testi sabit fixture'a bağladı (`araclar/testler/fixture/sinavlar-tur11.js`).
- **Deneme havuzu:** 807 → **874** (calculus-bc 184 → 223, chemistry 144 → 172).
- **Paket:** `sunum/AP-MEBERRA-Sunum-2026-10-16.zip` (25,8 MB; 19 PDF) — paket-test ve sv-paket geçti (ağ isteği 0, sayfa hatası 0).
- **Sürüm:** v12.0. `HARITA.md` Tur 12 dosyalarıyla güncellendi.

### 28.9. Açık kalanlar (Tur 13 backlog'u)
1. Groningen / AP Physics 2 kararı (kullanıcı) — §28.7.
2. İlk 20: 6 açık hücre (UniBS, UniFi, Toulouse III) teyit e-postalarıyla; İspanya'da QEDU'ya dayanan İngilizce hücrelerin üniversite sitelerinden tek tek doğrulanması.
3. Teyit gerekir: Goethe Türkiye (403), TestDaF/telc Türkiye merkezleri, CILS/CELI/PLIDA İstanbul, Tisus 2027 İstanbul oturumu, Danca sınav (Doğrulanamadı); GRE kapsamı yalnız de/be/it/ch — diğer ülkelerdeki GRE isteyen programlar.
4. Yazışma alıcı adresleri: 12 taslak adresi kaynakla eşleşmedi; resmi iletişim sayfalarıyla doğrulanmalı.
5. Calculus kapsam boşlukları (~16 soru: CED 1.1–1.4, 1.9, 1.12, 5.8, 6.14; arc length, partial fractions, Euler, polar).
6. İçerik backlog'u: Faz 36 Biology Unit 7 · Faz 37 Physics 1 Unit 7 · Faz 38 Chemistry Unit 9 · English kategori 2/5/7 · CS A Unit 3.
7. Ajan 11: kalan "Meberra" hitapları, tema yanıp sönmesi, FRQ yedek birleştirme, styles.css sadeleştirme; R6/R7.

---

## 29. TUR 13 — ÜNİVERSİTE İSTERLERİ, SINAVLAR VE DERS BAĞLANTILARI (17 Ekim 2026)

### 29.1. Kullanıcı Talebi ve Çözülen Problem
- **Problem:** `sartlar.html` ve `universiteler.html` sayfalarında bir öğrenci (örneğin 11. sınıf öğrencisi) Almanya veya başka bir ülkeyi seçtiğinde, gelen üniversite kartlarında o üniversitenin istediği sınavlar (dil ve bilim sınavları) yer almıyor; kullanıcı bu sınavların derslerine ve denemelerine doğrudan ulaşamıyordu.
- **Kullanıcı Talimatı:**
  > "filtreleme olduğunda örneğin 11. sınıf öğrencisi almanyayı seçtiğinde gelen üniversiteler isterleri ile gelsin
  > Hangi dil sınavları
  > hangi Bilim sınavları
  > bunlara tıklandığında derslerin listelenmiş hali ve oradan konu anlatımı ve denemelere gidilebiliyor olsun"

### 29.2. Mimari ve Geliştirilen Bileşenler
1. **Ajan 11 Ekran ve Bilgi Mimarisi Planı (`.agents/rules/tur13-universite-isterleri-ekran-plani.md`):**
   - Masaüstü (1280px) ve mobil (360px) için bilgi hiyerarşisi yeniden planlandı.
   - Her üniversite kartında (`.sr-uni`):
     - Kimlik: Sıra, ad, şehir, QS sırası, dil rozetleri (EN / Yerel).
     - **İsterler Özeti (`.sr-uni-reqs`):**
       - 🗣️ **Dil İsteri Rozetleri:** IELTS Academic (6.5+), TOEFL iBT (90+), TestDaF (TDN 4x4), DSH-2 vb.
       - 🔬 **Bilim İsteri Rozetleri:** AP Calculus (AB/BC), AP Physics (1/C), AP Chemistry, AP CS A, TestAS, TOLC-I, TIL-I vb.
       - **Etkileşim Butonu:** `Dersler ve İsterler ▾` (erişilebilir `aria-expanded`, klavye dostu).
2. **Üniversite İsterleri ve Ders Motoru (`assets/js/universite-isterleri.js`):**
   - Saf JavaScript modülü (`window.APMEBERRA_UNI_ISTERLERI` ve Node `module.exports`).
   - `isterleriCoz(uni, ulkeKod, secim)`: Kurumsal özel isterleri (TUM Aptitude, KIT Carl Benz SAT/TestAS/Fizik şartı, THWS B2/TestAS şartı, PoliMi OFA/TOLC-I şartı, PoliTo TIL-I vb.) ve ülke bazlı genel şartları çözer.
   - `kartIsterHtml(uni, ulkeKod, secim, idPrefix)`: Üniversite kartı için ister rozetleri ve açılır **Ders İstasyonu Çekmecesi** (`.sr-uni-drawer`) üretir.
3. **Ders İstasyonu ve Doğrudan Eylemler:**
   - Çekmece açıldığında iki sütun halinde:
     - **🗣️ GEREKEN DİL SINAVLARI:** IELTS, TOEFL, TestDaF eşikleri ve `📖 Konu Anlatımı` (`ap-english.html`), `🎯 Deneme Sınavı` (`deneme.html?ders=english-language`).
     - **🔬 GEREKEN BİLİM & GİRİŞ SINAVLARI:** AP Calculus, AP Physics, AP Chemistry, AP Biology, AP CS A, TestAS, TOLC-I; her birinde doğrudan `📖 Konu Anlatımı` ve `🎯 Deneme Sınavı` (`deneme.html?ders=calculus-ab`, `deneme.html?ders=physics-1`, `deneme.html?ders=chemistry`, `deneme.html?ders=cs-a` vb.) bağlantıları.
4. **CSS Tasarım Sistemi (`assets/css/styles.css`):**
   - Açık ve koyu tema tam uyumlu renk ve kontrast token'ları (`.sr-req-badge.is-lang`, `.sr-req-badge.is-stem`, `.sr-lesson-card.is-stem-card`).
   - Mobil 360px uyumlu esnek ızgara ve tek sütun düzeni.

### 29.3. QS Dünya Sırası ve Sıralama Formatı İyileştirmesi (Kullanıcı Talebi)
- **Problem:** Kullanıcı sütun başlığındaki tek başına "QS" kısaltmasının ne olduğunu ve bazı satırlarda yer alan `=140`, `=158` gibi `=` işaretli ham değerlerin hata olup olmadığını sordu.
- **Düzeltme & Bilgilendirme:**
  - **QS Nedir?:** Quacquarelli Symonds World University Rankings (WUR 2027) küresel dünya sıralamasıdır. Tablodaki ilk `#` sütunu ülke içi sırayı, `QS Dünya Sırası` sütunu ise küresel dünya sırasını belirtir.
  - **Eşittir (`=`) İşareti:** QS resmi verisinde iki veya daha fazla üniversite aynı puanı paylaştığında (tie) verilen teknik simgedir. Kullanıcı deneyimini bozmaması için tüm kaynak JSON dosyalarındaki (`uni-*.json`) ve derlenmiş ülke dosyalarındaki (`ulke/*.js`) 108 adet `qsSira` değerindeki `=` işaretleri temizlendi.
  - **Arayüz:** `universiteler.html` tablosunda sütun başlığı `<th title="...">QS Dünya Sırası</th>` yapıldı, mobilde `data-etiket="QS Dünya Sırası"` olarak güncellendi. `sartlar.html` kartlarında da `Berlin · QS Dünya #98` biçimine dönüştürüldü.
  - **Derleyici Koruması:** `araclar/ulke-veri-olustur.js` içine `uniNorm` normalizasyonu eklenerek gelecekte eklenecek verilerde de olası `=` işaretlerinin otomatik arındırılması güvenceye alındı.

### 29.4. Kayıt Düzeltmesi (PM, 19 Ekim 2026)
- **Sürüm:** Tur 13 iki arşivle kapandı: **v12.1** (üniversite isterleri + ders istasyonu, 256 dosya) ve **v12.2** (QS başlığı ve `=` temizliği, 256 dosya). ★ GÜNCEL DURUM ve dipnotta yazan "v13.0" hatalıydı; böyle bir arşiv yok. Düzeltildi. Tur 14 numaralandırmayı tur numarasıyla yeniden hizalar (`--surum 14.0`); v13.x boş kalır.
- **Bölüm numarası:** §29'da 29.3 eksikti; QS bölümü 29.3 oldu.
- **DEVAM-NOKTASI.md** Tur 12'de kalmıştı; Tur 13 sonuna getirildi.
- **Yeniden doğrulama (19 Ekim):** `pm-denetim` 880 soru, 0 sorun · `ad-denetimi` 0 sorun · 10 Node birim testi geçti (eposta 119, mezun 59, profil-v2 30, rota 62, şartlar 45, seçici 95, sınav 183, taslak 57, ülke-veri 55, üniversite-ister). 18 tarayıcı testi de geçti (19 Ekim; Tur 13 kaydındaki "tarayıcı testleri geçti" böylece çıktıyla doğrulandı).

---

## 30. TUR 14 — İÇERİK, E-POSTA UZMANI VE ÖĞRENCİ ODAKLI EKRAN PLANI (19–20 Ekim 2026)

### 30.1. Kullanıcı kararları
| # | Karar (tarih) |
| :--- | :--- |
| K14-1 | Kayıtlar düzeltilsin, sonra Tur 14 (19 Ekim). |
| K14-2 | E-posta için uzman ajan oluşturulsun: kayıtlı öğrenci üniversiteyi seçince İngilizce ilk başvuru e-postası profil bilgileriyle hazır üretilsin (19 Ekim). |
| K14-3 | Gerçek e-posta örneği yok; şablonlar resmi yönergelerle hazırlansın (19 Ekim). |
| K14-4 | Tasarımcı, öğrencinin en kolay ve istediğine ulaşabileceği ekran yapısını hazırlasın (19 Ekim). Plan **onaylandı: 7 aşamanın hepsi, A1 → A7** (20 Ekim). |
| K14-5 | **Groningen hedeflere eklensin; süresi biten tarih bir sonraki dönemin tarihiyle tutulsun** (20 Ekim). Uygulama: (1) Groningen Physics / Applied Physics için AP Physics 2 plana girer; Physics 1 (5 Mayıs 2027) ile Physics 2 (6 Mayıs 2027) aynı oturumda değil. ~~13 Kasım 2026 kaçarsa Mayıs 2028~~ (PM hatası, Ajan 13 düzeltti): 13 Kasım kaçarsa 12 Mart 2027'ye kadar geç sipariş mümkün (+40 $, AP Central Exam Fees 2026-27); Mayıs 2028 ancak o da kaçarsa. (2) Genel kural: portalda tarihi geçen sınav, kayıt ya da başvuru adımı listeden düşmez; kaynakta sonraki dönem tarihi varsa o tarih gösterilir, yoksa "sonraki dönem tarihi henüz açıklanmadı" yazılır, tarih uydurulmaz. (3) Ajan 13 doğruluyor: Groningen 2028 girişinde Mayıs 2028 AP sonucunun kabulü, başvuru son günü, Physics 2'nin Physics 1 olmadan alınabilirliği, 2027-28 AP sipariş tarihi. |

### 30.2. Yeni ajan: Ajan 14 `eposta-uzmani`
- Tanım `.claude/agents/eposta-uzmani.md`, `AGENTS.md` §2 madde 14.
- **Faz 1 (tamam):** `data/kocluk/ilk-basvuru-sablonlari.js` — **36 şablon** (3 model × genel + DE/IT/NL/FR/SE × `ilk-iletisim` / `takip`). `assets/js/eposta.js` 1.1.0 (geriye uyumlu): `{{#if}}…{{else}}…{{/if}}` koşullu bloklar, `ilkBasvuruHazirla()` → konu, gövde, alıcı, eksikler, kelime sayısı, mailto. Profilde olmayan sınav metne girmez.
- **Dayanak:** 11 resmi yönerge, 10 kural (`kaynaklar/eposta-ornekleri/anonim/yonergeler.md`, erişim 19 Ekim 2026). Gerçek örnek yok; `ham/` boş ve `surum-arsivle.js` tarafından arşiv dışı tutulur (kişisel veri koruması).
- **Alıcı:** yalnızca kaynaklı adres; bugün 202 üniversitenin 5'inde (TUM, KIT-CBS, FAU, Sapienza, TCD), diğerlerinde resmi iletişim sayfası.
- **Test:** `ilk-basvuru-birim-test.js` 4694/0 (252 üretim, 131–201 kelime).
- **Faz 2:** arayüz, ekran planı aşama A5'te. Açık: KIT-CBS adresinin genel e-postada kullanımı (Ajan 13), `lisansAlaniEn` profil alanı, Claire Bennett dil incelemesi.

### 30.3. Ajan 12 — içerik
| Ders | Eklenen | Sayfa sorusu |
| :--- | :--- | ---: |
| Calculus | Kapsam boşlukları: sorusuz 8 CED topic'in tamamı (1.1–1.4, 1.9, 1.12, 5.8, 6.14) + arc length 1→3, partial fractions 1→3, Euler 2→3, polar +2; SVG grafikli ve tablolu sorular | 223 → **241** |
| Physics 1 | **Unit 7 Oscillations** (CED Fall 2024, 7.1–7.4): anlatım + MR/TBR/LAB/QQT FRQ kartı + 24 soru | 137 → **161** |
| Biology | **Unit 7 Natural Selection** (CED Fall 2025, 7.1–7.12): anlatım + 27 soru (6 Hardy–Weinberg, 2 ki-kare) | 134 → **161** |
| Chemistry | **Unit 9 Thermodynamics and Electrochemistry** (CED Fall 2024, 9.1–9.11): anlatım + 8 puanlık FRQ + 28 soru. **Chemistry 9/9 ünite, `durum: "hazir"`** | 172 → **200** |

- Tüm sayısal cevaplar ve çeldiriciler Python/sympy ile bağımsız hesaplandı; kaynak etiketi "AP-style original (CED Topic x.y)".
- **Portal 880 → 977 soru** · **deneme havuzu 874 → 971** (calculus-bc 241, physics-1 155, chemistry 200, biology 161) · seviye dosyalarında Physics 1 U7, Biology U7, Chemistry U9 `portaldaVar: true`.
- Olay: içerik ajanı `deneme-bankasi-olustur.js`'i yanlışlıkla bir kez çalıştırdı, dosyayı v12.2 arşivinden geri yükledi; PM havuzu resmi olarak yeniden üretti.

### 30.4. Ajan 11 — arayüz
- İçindekiler veri odaklı ve gruplu (`apTocParse`/`apTocHtml`): Calculus 29→21, Physics 20→14, Chemistry 20→13, Biology 16→11 satır; yeni `toc-birim-test.js` (19/0).
- FRQ yedek birleştirme hatası düzeltildi (önceden birleştirmede yedekteki FRQ verisi atılıyordu): `mergeFrq`, `mergeCalcFrq`; backup-test 5c.
- styles.css: 6 tekrar kural silindi, sabit renkler token'a; açık/koyu 50.157 öğede 0 stil farkı. Tur 13 rozetleri otomatik-koyu temada okunur oldu.
- Tema: sekmeler arası eşitleme; erken tema betiği 20 sayfada vardı, PM 4 ders sayfasına (calculus, physics, chemistry, biology) ekledi → yanıp sönme tüm sayfalarda giderildi.
- Kişisel hitaplar: Ajan 11 2 satır, PM ap-*.html'de 34 değişiklik + `eposta-sablonlari.js` 1 not → portal metinleri nötr ("AP Meberra" marka adı kalır).
- **Öğrenci odaklı ekran planı** (`.agents/rules/tur14-ogrenci-odakli-ekran-plani.md`): ölçüm — telefonda üniversite listesi 12,7–17 ekran aşağıda, menü 8 ana + 16 alt öğe, son tarihler 3–4 sayfaya dağınık. Öneri — 5 öğeli menü (Bugün · Hedefim · Çalış · Başvuru · Ben), telefonda alt gezinme, "Sıradaki adım" kartı, tek "Son tarihler", Yanlışlarım tek oturum, kartta İlk e-posta. **Onaylandı; A1–A7 v14.x olarak aşama aşama teslim edilecek.**
- Açık: tanımsız token'lar `--t-fast` (geçiş animasyonları çalışmıyor), `--fs-15`.

### 30.5. Ajan 13 — mevzuat (araştırma 19–20 Ekim, aktarım v14.1)
- Karar notu `.agents/mevzuat/karar-notu-2026-10-19-tur14.md`; girdi `tur14-sinav-duzeltmeleri.json`, `tur14-adres-duzeltmeleri.json`, `tur14-ilk20-duzeltmeleri.json`.
- **PM kararları:** GRE Tur 12 ölçütüyle (zorunlu ya da şiddetle önerilir) nl, fi, es'ye genişler · testdaf, cils, celi Doğrulandı, Türkiye ücreti Teyit gerekir · İtalyanca 12 ve 18 numaralı taslaklar yalnız CILS'e daraltılır.
- **Sınavlar (47 kayıt, 10 güncelleme):** Doğrulandı 29 → **35**, Teyit gerekir 12 → 7, Doğrulanamadı 1 → **0**. GRE 4 → 7 ülke, GMAT 1 → 3. Düzeltilen iddia: İstanbul İtalyan Kültür Merkezi yalnız CILS yapar (CELI: İtalyan Liseleri, PLIDA: ayrı merkez). Danca Studieprøven yalnız Danimarka'da. Goethe C1 2027: 20.930 TL; TestDaF Türkiye'de 20 merkez (7 İstanbul).
- **Teyit taslakları (72):** Tisus (tisus.svefler@su.se) ve DTU (optagelse@dtu.dk) adresleri düzeltildi; 9 kaynaklı iletişim maddesi eklendi. **Kaynaklı alıcı 1 → 15, kaynaksız adres adayı 12 → 0.**
- **İlk 20:** UniFi, UniBS, Toulouse III hücreleri kapandı → **Doğrulanamadı üniversite hücresi 6 → 0** (var 677, kısıtlı 92, yok 39).
- **Madde sayıları:** lisans 604 → **610**, YL ülke maddesi 406 → **409** (+46 genel); Doğrulandı 814 → 823. `ulke-veri-olustur` 0 sorun.
- 3 testin beklentisi gerçek veriye göre güncellendi (taslak-birim, ulke-veri, yazisma-taslak); kaynaksız adres kuralı artık yapay adayla sınanıyor.
- **Açık:** taslak metin önerileri 2, 9, 44 (PM, sonraki tur) · telc C1 Hochschule ve PLIDA Teyit gerekir · ÖSD, SIELE, Cambridge/ECL Türkiye merkezleri · YL-DE-1 2027 Sperrkonto tutarı · IT-1 CISIA kuralları 31 Ekim.

### 30.6. Denetim ve test (20 Ekim 2026)
- `pm-denetim` 977 soru, 0 sorun · `ad-denetimi` 0 sorun.
- 12 Node birim testi geçti: eposta 119, ilk-basvuru 4694, mezun 59, profil-v2 30, rota 62, şartlar 45, seçici 95, sınav 183, taslak 57, toc 19, ülke-veri 55, üniversite-ister 0 hata.
- 18 tarayıcı testi geçti (20 Ekim, son durumda): interact, backup (5c dahil), ülke, seviye, pm-seviye, hesap 159, deneme, tasarım 53, mezun 54, mezun-menü 24, taşıma 17, tur11 89, sınav 111, yazışma-taslak 87, yazışma 64, calc-frq 20, erişim 88, rota 225.
- Paket: `sunum/AP-MEBERRA-Sunum-2026-10-20.zip` (26,0 MB); paket-test ve sv-paket internet kapalıyken geçti (ağ isteği 0, sayfa hatası 0).

### 30.7. Sıradaki (Tur 14 devamı)
1. Ekran planı ~~A1 menü → A2 alt gezinme → A3 Bugün~~ (v14.2–v14.4, §30.8) → ~~A4 Hedefim → A5 Başvuru + İlk e-posta arayüzü~~ (v14.5–v14.6, §30.10) → ~~A6 Çalış → A7 Yanlışlarım~~ (v14.8–v14.9, §30.11). **Ekran planı tamamlandı.**
2. ~~Ajan 13 aktarımı~~ → v14.1'de tamamlandı (§30.5).
3. ~~Groningen kararı~~ → K14-5 (20 Ekim): Groningen eklendi, süresi biten tarih sonraki dönemle tutulur. Ajan 13 doğrulaması + sonraki dönem tarihleri → PM aktarımı; Ajan 11 "süresi doldu → sonraki dönem" gösterimi; Ajan 12 ileride AP Physics 2 içeriği.
4. İçerik: Physics 1 Unit 8 Fluids, Biology Unit 8 Ecology, Chemistry Unit 1–3'ü 24+ soruya, English 2/5/7, CS A Unit 3; Biology sayfasında Unit 2 adı "Cells" (CED Fall 2025).

### 30.8. Ekran planı 1. grup: A1–A3 (Ajan 11, 20 Ekim 2026)
Ayrıntılı kayıt: `.agents/rules/tur14-asama-kayitlari.md`. Ders içeriği, soru şeması, `data/**`, `apmeberra:*` anahtarları ve `APMEBERRA_ACIK_SAYFALAR` değişmedi; kırık bağlantı yok.
- **A1 — 5 öğeli menü (v14.2):** `APMEBERRA_NAV` 8 ana + 16 alt öğeden 5 ana öğeye indi: Bugün · Hedefim · Çalış · Başvuru · Ben. Hedefim, Başvuru ve Ben bölünmüş öğe (etiket sayfayı, ok alt menüyü açar). Üniversite mezununda Çalış yerine Sınavlar; misafirde Şartlar · Üniversiteler · Sınavlar. "Panelim" → "Bugün". Rehberler altbilgiye taşındı (`initFooterRehber`). Hamburger kırılımı 1180 → 760 px. 7 tarayıcı testi `data-nav` sözleşmesine güncellendi.
- **A2 — telefonda alt gezinme (v14.3):** ≤ 760 px'te sabit alt çubuk: 5 öğe, 56 px (`--bottom-nav-h`), güvenli alan, `aria-current`, ≥ 44 px dokunma alanı. Hedefim, Çalış ve Başvuru alttan liste açar (Escape/dışarı tıklama kapatır); misafirde 4. öğe "Kayıt ol". Hamburger kalktı. `tasarim-test` 53 → 77 kontrol.
- **A3 — Bugün ekranı (v14.4):** Sıradaki adım kartı (öncelik: yarım deneme > 14 gün içinde dolan rota adımı > ≥ 5 açık hata > çalışma planı > profil eksiği), Yaklaşan 3 tarih (yalnız veride olan tarih; rota adımları ay düzeyinde, gün uydurulmaz), Devam et satırı (Kaldığın yer · Yanlışlarım · Son deneme), rota özeti 3 adım, ikincil paneller "Daha fazla" altında. Yeni saf fonksiyonlar `apSiradakiAdim`, `apYaklasanTarihler`, `apKaldiginYer`, `apTrTarihCoz` (`app.js`); yeni `bugun-birim-test` (40 kontrol); `tasarim-test` 85 kontrol.
- **Tık hedefleri (plan §2.4):** G3 "bugün ne çalışayım" 0–1 tık + 2,7 ekran kaydırma → **0 tık, kaydırma yok**; G6 "son tarihler" 3–6 tık → ilk 3 tarih **0**, tamamı **1** tık.
- **PM kararı:** Üniversite mezunu menüsü 5 öğe kalır (Çalış yerine Sınavlar); alt çubukla aynı düzen korunur.
- **PM doğrulaması (20 Ekim):** `pm-denetim` 977 soru 0 sorun · `ad-denetimi` 0 · 13 Node birim testi geçti (bugun 40, eposta 119, ilk-basvuru 4694, mezun 59, profil-v2 30, rota 62, şartlar 45, seçici 95, sınav 183, taslak 58, toc 19, üniversite-ister 0 hata; ülke-veri 55) · 18 tarayıcı testi geçti (ajan çıktısı: hesap 163, tasarım 85, rota 221, erişim 88, yazışma-taslak 90 …). Ekran görüntüleri 3 model + misafir × 1280/360 × açık/koyu: sayfa hatası ve yatay taşma yok.
- **Açık (A4–A7'de kapanacak):** telefonda Hedefim/Başvuru şimdilik liste açar (A4/A5 sekmeleri); "Tümü →" Rotam'a gider (A5'te Son tarihler); mezun/YL panelleri A4'te Hedefim'e; "Yanlışlarımı çöz" A7'ye kadar Hata Defteri'ne; üniversite mezununda Yaklaşan tarihler çoğu zaman boş (IELTS/GRE verisinde sabit tarih yok); `index.html` altbilgisindeki eski "Portal" sütunu Rehberler satırını kısmen yineliyor.

### 30.9. Ajan 13 — Groningen ve sonraki dönem (20 Ekim 2026, K14-5)
Girdi `.agents/mevzuat/dogrulama/tur14-groningen-sonraki-donem.json` (groningen 7, collegeBoard 6, sonrakiDonem 25 kayıt), karar notu `.agents/mevzuat/karar-notu-2026-10-20-groningen.md` (RUG'a İngilizce teyit taslağı dahil).
- **Groningen (Doğrulandı, RUG Türkiye sayfası 19.10.2026):** en az 4 AP (3–5); Physics, Applied Physics ve yeni Astronomy için AP Calculus AB/BC + **AP Physics 2**; Physics C yetersiz. Bitmemiş AP için okul beyanı yeterli.
- **Takvim (PM WebFetch ile ayrıca doğruladı):** AB dışı başvuru son günü 1 Mayıs; şartları tamamlama 1 Temmuz; koşullu kabulde vize nedeniyle **1 Haziran**. RUG sayfası geç gelen (Temmuz) AP sonucunu düzenlemiyor → Teyit gerekir. Eylül 2028 tarihleri henüz açıklanmadı (yukarıdakiler 2027 dönemi).
- **College Board (Doğrulandı):** Physics 2 için Physics 1 dersi zorunlu değil ("recommend… but it's not required"); 2027'de Physics 1 (5 Mayıs, Session 2) ile Physics 2 (6 Mayıs, Session 1) çakışmaz; geç sipariş 12 Mart 2027'ye kadar (+40 $).
- **Öneri:** Physics 2 **Mayıs 2027** (11. sınıf); Mayıs 2028 yalnız RUG geç AP sonucunu yazılı kabul ederse yedek. Groningen için 4 AP'nin tamamı Mayıs 2027'de bitmeli. Pedagojik yük kararı: kullanıcı + Dr. Emre Yıldız.
- **Düzeltilecek veri (A5 bitince PM aktarımı, ayrı sürüm):** K14-5 metni (düzeltildi) · `sinavlar.js > cent-s` "15 Ekim'den sonra oturum yok" yanlış → CISIA 26.11.2026 ve 17.12.2026 · `lisans-nl.json > lis-nl-rug-ap` tarih 19 Ekim + Astronomy · sonrakiDonem 25 kayıt (Doğrulandı 10 · Teyit gerekir 3 · Henüz açıklanmadı 12).
- **Yeni bulgu (Teyit gerekir):** PoliTo 2027/28'den lisans girişinde yalnız TOLC@UNI / CEnT@UNI kabul ediyor; TIL-I ve AB dışı kuralı yazmıyor → `til-i`, `it-tili` etkilenir. Takip listesine önerilen: PT-1 (PoliTo 2027/28 çağrısı, Aralık 2026), RUG-1 (RUG 2028 tarihleri, Ekim 2027). DU-6 değişmedi; YL-1 (SISGP) si.se 403, açık.

### 30.10. Ekran planı 2. grup: A4–A5 (Ajan 11, 20 Ekim 2026) ve v14.7 veri aktarımı
Ayrıntı: `.agents/rules/tur14-asama-kayitlari.md`. `data/**`, ders içeriği, soru şeması ve `APMEBERRA_ACIK_SAYFALAR` değişmedi; yeni depolama anahtarı yok.
- **A4 — Hedefim (v14.5):** Şartlar · Üniversiteler · Rotam ortak sekme çubuğu (`app.js`, seçim adresten/profilden taşınır; misafirde 2 sekme). Üniversiteler'de İlk 20 listesi en üstte, kabul bilgileri açılır bölümlerde (eski çapalar çalışır). Her kartta **Dersler ve İsterler · İlk e-posta · Listeme ekle**; misafirde kilitli, giriş sayfasına dönüş adresiyle. "Listeme ekle" mevcut `apmeberra:panel:v1` içinde `universitelerim` alanı (yedek anahtarı değişmedi) + "Yalnızca listem" süzgeci. Şartlar'da İlk 20 yerine bağlantı kartı. Mezun duyuruları ve YL belge paneli Bugün'den Hedefim › Şartlar'a (`#sr-kisisel`) taşındı. Telefonda Hedefim doğrudan sayfa. **G1 uygun üniversite: 2–3 tık + 12–17 ekran kaydırma → 1 tık; G2 isterler 4–5 → 2 tık.** Testler: tasarım 96, tur11 93, hesap 164, mezun-menü 25.
- **A5 — Başvuru + İlk e-posta (v14.6, Ajan 14 Faz 2):** `yazismalar.html` üç sekme (Üniversiteye ilk e-posta [varsayılan] · Teyit taslakları · Yazışma geçmişi; klavye ok/Home/End, eski çapalar). İlk e-posta: ülke/üniversite/program/amaç seçimi; düzenlenebilir İngilizce konu + gövde; kelime sayacı (120–220); Kontrol kartı (yalnız kaynaklı alıcı + kaynak bağlantısı, yoksa iletişim formu uyarısı; eksik → "Profilini tamamla"; prosedür notu; "kendi adresinden gönder"; Dayanak). Kopyala · E-posta programında aç (mailto) · Taslak olarak kaydet (`apmeberra:yazisma:v1`) · Gönderildi (eksik varken iki adımlı onay). **Portal e-posta göndermez; testte yerel dışı ağ isteği 0.** Son tarihler şeridi; Bugün "Tümü →" buraya. **K14-5:** süresi dolan tarih "Süresi doldu" + `sonrakiTarih` ya da "henüz açıklanmadı", yaklaşanların arkasında. Telefonda Başvuru doğrudan sayfa. **G7 ilk e-posta: kart → 1 tık (dolu metin).** Yeni `ilk-eposta-test` 49 (PM yeniden çalıştırdı: 49/0); bugun-birim 50; yazışma 65; yazışma-taslak 91.
- **PM doğrulaması:** pm-denetim 977/0 · ad-denetimi 0 · 13 Node birim testi geçti · ilk e-posta ekranı incelendi (TUM örneği: 187 kelime, kaynaklı alıcı studium@tum.de, 3 soru, bilgiler tam).
- **Ajan 14'e (sıradaki):** ülke notlarında öğrenciye çözülemeyen yönerge kodları "(Y1)", "(K1, K8)" görünüyor (`ilk-basvuru-sablonlari.js:217-221`); `eposta.js:92,104` profil çapaları (`pf-sinif`, `pf-yerlesmeDurumu` yok) — KAYNAK'a çapa alanı önerisi; KIT genel adresi (Ajan 13).
- **Açık:** süresi dolan duyurular `duyuruSuz` tarafından elendiği için Son tarihler'e ulaşmıyor (motor davranışı, karar PM); SURUMLER.md v14.6 notu ASCII.
- **v14.7 — Ajan 13 aktarımı (§30.9, PM):** `sinavlar.js`: cent-s yanlış "15 Ekim'den sonra oturum yok" → CISIA 26 Kasım + 17 Aralık 2026; testas `sonrakiTarih: 2027-02-25` (K14-5 alanının ilk verisi); ap-physics-2 geç sipariş 12 Mart 2027 (+40 $), Physics 1 ön koşul değil, Groningen Astronomy + AB dışı 1 Haziran/1 Temmuz son günü. `lisans-nl.json > lis-nl-rug-ap`: Astronomy, okul beyanı, 19 Ekim güncellemesi, prosedür kaynağı → `mevzuat-aktar` + `ulke-veri-olustur` 0 sorun (lisans 610 · YL 409). Takip listesine PT-1 (PoliTo CISIA geçişi, Aralık 2026) ve RUG-1 (Groningen 2028, Ekim 2027). Diğer sonrakiDonem kayıtlarının metninde sonraki tarihler zaten yazılı; metni tarihle başlamayan kayıtlar Yaklaşan listesine girmediği için ek alan gerekmedi.

### 30.11. Ekran planı 3. grup: A6–A7 (Ajan 11, 20 Ekim 2026) — plan tamamlandı
- **A6 — Çalış merkezi (v14.8):** yeni `calis.html`: Sıradaki çalışma kartı, Kaldığın yer, 7 ders kartı (6 AP + CEnT-S; ilerleme halkası, açık hata, kaldığın ünite, Konu anlatımı + 9 deneme kodu), Ölç ve tekrar et (Denemeler · Yanlışlarım · Seviye testi). Çalışma planı hesabı `index.html`'den `apCalismaPlani` (`app.js`) olarak taşındı; Bugün ve Çalış aynı fonksiyonları kullanır (`tasarim-test` 5c doğrular). Menüde ve alt çubukta Çalış doğrudan sayfa; A1 geçici açılır menüsü kalktı, alt çubuğun 5 öğesi de doğrudan bağlantı. K4: `calis.html` giriş gerektirir, misafir listesi değişmedi (PM kontrol etti). Üniversite mezununa Sınavlar'a yönlendiren kart.
- **A7 — Yanlışlarım modu (v14.9):** `deneme.html?mod=yanlislar` (isteğe bağlı `&ders=`, `&deneme=`): Hata Defteri'ndeki açık hatalardan, deneme bankasıyla eşleşenlerle tek oturum; doğru cevap hatayı kapatır (mevcut `writeErrors`), yanlış açık kalır; yenilemede kaldığı yerden; üç boş durum. Sonuç ekranı eylemleri: "Yanlış N soruyu şimdi çöz" / "Yanlışlarımı tekrar çöz", "Konu anlatımı: Unit X" (`#konu-<kap>` çapası, en düşük oranlı ünite), "Bugün'e dön"; Yanlışlarım oturumunda "N hata kapandı · M açık kaldı". Bugün, Çalış ve İlerleme (yeni "Tek oturumda çöz") bağlantıları moda gider. Yeni depolama anahtarı yok; soru şeması ve `data/**` değişmedi.
- **Tık hedefleri:** G3 Bugün ne çalışayım 0 tık · G4 yarım deneme 1 · G5 Yanlışlarım 2 tık, tek oturum (önce Hata Defteri'nde dağınık) · zayıf ünitenin konu anlatımı sonuçtan 1 tık · yeni ders denemesi 3 tık (hedef 2; açık).
- **PM doğrulaması:** pm-denetim 977/0 · ad-denetimi 0 · 13 Node birim testi (bugun 58) · yeni `yanlislar-test` PM tarafından yeniden çalıştırıldı 32/0 · ajan çıktısı 20/20 tarayıcı testi (sırayla, tek Chromium; bellek uyarısından sonra). Ekran görüntüleri incelendi.
- **Açık:** yeni ders denemesi 3 tık; deneme havuzunda olmayan hatalar moda girmez (sayısı gösterilir); ders kartı adı "AP Physics 1 / C" (portalda yalnız Physics 1 içeriği var; K14-5 sonrası Physics 2 plana girdi → ad ve içerik sonraki tur); üniversite mezunu menüsü 5 öğe (PM kararı §30.8, plan tablosundaki "4 öğe" geçersiz).

### 30.12. Ajan 14 düzeltmesi + paket + v14.10 (20 Ekim 2026)
- **eposta.js 1.1.1 (Ajan 14):** ilk başvuru şablonlarının öğrenciye görünen notlarından yönerge kodları (Y1, K8 …) kaldırıldı, 6 ülke notu sade Türkçe yeniden yazıldı; kodlar makine alanı `yonergeKodlari` / `kodlar`'a taşındı (36 şablon; doğrulayıcı kodlu notu reddeder). Takip notunda "10 iş günü portalın önerisidir" açıkça yazıldı. KAYNAK'a `capa` (`pf-sinif-group`, `pf-yerlesmeDurumu-group`); `yazismalar.html` eşlemesi kaldırıldı. Testler: ilk-basvuru 4694 → **5198**/0 (PM yeniden çalıştırdı), eposta 119/0, ilk-eposta 49/0, yazışma 65/0, yazışma-taslak 91/0. Açık: `yazismalar.html:727-729` eski şablon sekmesindeki çapa (etkisiz; Ajan 11 ileride).
- **Paket:** `sunum/AP-MEBERRA-Sunum-2026-10-20.zip` (26,1 MB) yeniden üretildi; paket-test ve sv-paket geçti (ağ isteği 0, sayfa hatası 0).
- **Tur 14 ekran turu sonu:** pm-denetim 977/0 · ad-denetimi 0 · 13 Node birim testi · 20 tarayıcı testi · 2 paket testi · sürümler v14.2–v14.10.

---

*Son Güncelleme: 20 Ekim 2026 (Tur 14, v14.10) | eposta.js 1.1.1 (yönerge kodları öğrenciden gizlendi), sunum paketi · Ekran planı 7/7: menü, alt gezinme, Bugün, Hedefim, Başvuru + İlk e-posta, Çalış merkezi, Yanlışlarım modu (v14.2–v14.9) · Ekran planı A1–A5: menü, alt gezinme, Bugün, Hedefim, Başvuru + İlk e-posta arayüzü (v14.2–v14.6) · K14-5 Groningen + sonraki dönem kuralı, Ajan 13 aktarımı (v14.7) · v14.1 Ajan 13 aktarımı · Calculus kapsam boşlukları (+18), Physics 1 U7, Biology U7, Chemistry U9 (9/9): 880 → 977 soru, havuz 874 → 971 · Ajan 14 eposta-uzmani + ilk başvuru e-postası motoru (36 şablon) · İçindekiler, FRQ yedek, tema, CSS · öğrenci odaklı ekran planı onaylandı · sürüm v14.0.*

*Önceki güncelleme: 17 Ekim 2026 (Tur 13) | Üniversite İsterleri ve Ders İstasyonu (Almanya, İtalya ve 15 ülke): Dil ve bilim sınavı isterleri, doğrudan ders konu anlatımı ve deneme bağlantıları · yeni universite-isterleri.js ve universite-ister-test.js · sartlar.html ve universiteler.html entegrasyonu · pm-denetim 880 soru 0 sorun · sürüm v12.1 + v12.2 (19 Ekim düzeltmesi: "v13.0" hatalıydı, §29.4).*

*Önceki güncelleme: 16 Ekim 2026 (Tur 12) | Sınavlar 18 → 47 kayıt (15 ülke, 12 dil, GRE/GMAT, AP Physics 2) · Yazışmalarım 15 ülke + 72 hazır taslak · ilk 20 ikinci tur: Doğrulanamadı 37 → 2 · Calculus BC Unit 10 (+39) ve Chemistry Unit 8 (+28): 813 → 880 soru, havuz 807 → 874 · Resmi FRQ arşivi (12 FRQ, 108 ölçüt) · rota dili süzgeci · 6 yeni test · denetimler 0 sorun · tam regresyon + paket testleri geçti · sürüm v12.0.*

