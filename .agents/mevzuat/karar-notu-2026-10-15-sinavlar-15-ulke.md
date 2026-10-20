# Karar Notu: Sınavlar sayfası, 15 ülke dil sınavları + GRE/GMAT (Tur 12)
*Ajan 13 → Lead PM Dr. Aylin Kaya. Hazırlık: 15–16 Ekim 2026. Veri: `.agents/mevzuat/dogrulama/sinavlar-tur12.json`. Proje veri dosyası düzenlenmedi.*

## 1. Sonuç
1. **Gerçek sayılar (PM kararlarından sonra, 16 Ekim):** 14 mevcut kayıt güncellemesi (11 AP, SAT, IELTS, TOEFL), 29 yeni kayıt (AP Physics 2 dahil) ve Tur 11 dosyalarında 11 düzeltme var. Yeni kayıtların kesinlik dağılımı: 15 Doğrulandı, 12 Teyit gerekir, 1 Yoruma açık (Duolingo), 1 Doğrulanamadı (Danca sınavı). Güncellemelerin 14'ü de Doğrulandı.
2. **Polonya'da kritik düzeltme:** Polonya Yükseköğretim Kanunu md. 324/2-5'e göre en az **C1 Lehçe devlet sertifikası** olan yabancı, devlet üniversitesindeki Lehçe tam zamanlı eğitimde ücret ödemez. Tur 11'deki "Türk vatandaşı Lehçe okursa ücret öder" iddiası bu istisnayı atlıyor. Yetişkin C1 sınavına ancak **18 yaşında** girilebiliyor; 2027'de C1 oturumu yalnız Nisan ve Kasım'da var.
3. **Türkiye'de yapılmayan sınavlar:** DSH, NT2 (yalnız Hollanda), ITNA (yalnız Belçika), YKI (yalnız Finlandiya), ETH ve EPFL giriş sınavları (İsviçre). Türkiye'den yapılabilen tek Felemenkçe üniversite belgesi **CNaVT**: İstanbul'da ve Bodrum'da sınav kurumu var. Tisus için İstanbul 2025 yurt dışı sınav yerleri listesindeydi; 2027 için oturum talebe bağlı.
4. **Türkiye ücretleri artık resmi kaynaklı:**

   | Sınav | Türkiye ücreti |
   | :-- | :-- |
   | IELTS Academic (British Council) | 12.000 TRY |
   | PTE Academic (12 merkez) | 10.000 TRY |
   | GMAT | test merkezinde 250 $, çevrimiçi 275 $ |
   | GRE | 249 $ |
   | DELE B2 / C1 (İstanbul 2026) | 4.800 / 5.450 TL |
   | DELF B2 (İstanbul 2026) | 5.850 TL (öğrenci 4.050 TL) |
   | DALF C1 (İstanbul 2026) | 10.050 TL (öğrenci 7.650 TL) |
   | YKI (Finlandiya'da) | 165 / 190 / 216 € |
   | ITNA (Belçika'da) | 125 € |
   | Lehçe sertifika | yasal üst sınır B2 150 €, C1 180 € |

   TCF geçerliliği de netleşti: 2 yıl.
5. **Kapanmayanlar:** Goethe Türkiye tarih ve ücretleri hâlâ okunamıyor. Sayfa hem WebFetch'te hem gerçek tarayıcıda 403 veriyor; yalnız merkezler ve iletişim bilgisi doğrulandı. Şunlar da kapanmadı: TestDaF ve telc'in Türkiye merkezleri, CILS/CELI/PLIDA'nın İstanbul oturum ve ücretleri, Cambridge Türkiye, Lehçe sertifikanın Türkiye merkezi (liste Cloudflare doğrulaması arkasında, aşılmadı) ve Duolingo fiyatı.

## 2. Karar gerektiren konular
> **PM kararları (16 Ekim 2026), JSON'a uygulandı:** Karar 1 → B ("ilgili ülke"): de/it kalır, nl (Calculus'ta be) eklenir; mevcut KMK/"Türk diplomasında resmi rolü yok" ifadeleri korunur, Hollanda notu notEki alanıyla eklenir. Karar 2 → yeni kategori yok; ek alanlar Ajan 11'e iletildi. Karar 4 → AP Physics 2 kaydı eklendi (6 Mayıs 2027, Session 1; ulkeler ["nl"]). Ek doğrulama (Twente sayfası, 2 Ekim 2026): fizik şartı Physics 1 + Physics 2 birlikte, ya da tek bir Physics C (Mechanics veya E&M); mühendislikte matematik şartı yalnız Calculus BC (AB yetmez); 12 AP dersinin hepsi Twente'nin kabul listesinde. sinav-takvimi.js'te Physics 2 satırı yok; oraya da eklenmeli.

**Karar 1: AP kayıtlarında `ulkeler` neyi göstersin?** Mevcut 11 AP kaydında `["de","it"]` var. Ancak iki ülkede de Türk diplomasına AP'nin kabul rolü yok: Almanya'daki KMK kuralı yalnız ABD diploması için, İtalya'da ise AP ne şart ne avantaj.
- **A) "Resmi kabul rolü"** (önerim): `nl` eklenir (Calculus için `be` de). `de` ve `it` çıkarılır, Almanya için "profil bilgisi" notta kalır.
  - Artısı: kullanıcı ülke filtresinde AP'nin işe yaradığını sanmaz.
  - Eksisi: Meberra'nın DE/IT odaklı AP planı sayfada ülke etiketsiz görünür.
- **B) "İlgili ülke"**: `de`, `it` kalır, `nl` (ve Calculus'ta `be`) eklenir.
  - Artısı: mevcut DE/IT kurgusu bozulmaz.
  - Eksisi: filtre yanıltıcı olur. AGENTS.md §2'deki "KMK 4 AP şartı" ifadesiyle aynı yanlış izlenimi yeniden üretir.

JSON şu an **B**'ye göre hazır. A seçilirse Ajan 11 `de` ve `it`'yi çıkarır.

**Karar 2: Yeni kategori gerekmiyor.** Mevcut sözlük ("AP", "Giriş Sınavı", "Dil Sınavı") yeterli. Dil ayrımı yeni `dil` alanıyla, lisans/YL ayrımı `duzey` alanıyla yapılır. GRE, GMAT, ETH ve EPFL "Giriş Sınavı" kategorisinde. Önerilen ek alanlar: `dil`, `duzey`, `kesinlik`, `sonKontrol`, `ucret`, `kaynaklar`. `kaynaklar` alanı belge yılı ve erişim tarihini taşıyor.

**Karar 3: Görev metnindeki varsayım düzeltmesi.** sinavlar.js'te **TestDaF ve YKS kaydı yok.** Dosyadaki 18 kayıt şunlar: 11 AP, CEnT-S, TIL-I, TOL, SAT, TestAS, IELTS, TOEFL. TestDaF yeni kayıt olarak eklendi. YKS bu turun kapsamı dışında; eklenmesi isteniyorsa ayrı iş.

**Karar 4 (isteğe bağlı): AP Physics 2.** Groningen'in fizik programları AP Physics 2 istiyor, Physics C'yi kabul etmiyor. Dosyada Physics 2 kaydı yok. Hollanda rotası öne çıkarsa Ajan 3 ve Ajan 5'e kayıt açtırılabilir.

## 3. Ülke × dil × düzey → gereken sınav
*L = lisans, YL = yüksek lisans. Eşikler Tur 11 dosyalarından. Ayrıntı her kaydın `not` alanında.*

| Ülke | İngilizce program | Yerel dil programı | Ek giriş sınavı |
| :-- | :-- | :-- | :-- |
| DE | IELTS 6.5 / TOEFL 88–90; YL'de PTE ve Cambridge de (TUM, KIT, Stuttgart) | TestDaF 4×TDN4, DSH-2, Goethe C2, telc C1 Hochschule; Goethe C1 üniversiteye bağlı | YL: GRE (RWTH, AB dışı derece), GMAT (TUM MMT); L: TestAS/SAT (bazı programlar) |
| IT | L: B2 + CEnT-S/SAT; YL: IELTS 6.0 (PoliMi), 5.5 (PoliTo), PTE 59 | CILS/CELI/PLIDA B2 (vizeden önce) | L: CEnT-S, TIL-I, TOL; YL: GRE PoliTo ICT'de önerilir |
| AT | L: B2 (puan yok, Teyit gerekir); YL: TU Graz C1 (IELTS 7.0, PTE 76) | C1: ÖSD, Goethe, telc C1 Hochschule, TestDaF; başvuruda A2 | — |
| CH | L: İngilizce mühendislik lisansı yok; YL: ETH IELTS/TOEFL/Cambridge | ETH: Almanca C1 (31 Mart); EPFL: Fransızca B2 | L: ETH indirgenmiş sınav (YKS yerleşmesi + sınav), EPFL giriş sınavı ya da CMS |
| NL | L: Twente IELTS 6.0, Delft 6.5; YL: Delft 7.0 | NT2-II (yalnız NL); Delft Felemenkçe lisans için CNaVT EDUP | L: 4 AP (Twente, RUG) |
| BE | YL: KU Leuven IELTS 6.5, Gent B2/C1 | Flaman: ITNA, CNaVT STRT, NT2-II; Fransızca: DELF/DALF/TCF | L: KU Leuven matematik kanıtı (SAT, ACT, AP Calculus); ULB mühendislik giriş sınavı |
| FR | Eşiği kurum belirler | DELF B2 / DALF C1 / TCF DAP (DAP 15 Aralık) | — |
| ES | YL: UC3M B2 (IELTS 5.5–6.5) | DELE / SIELE B2 | — |
| SE | IELTS 6.5 (English 6), 7.0 (English 7); PTE 62 | Tisus (+ English 6) | — |
| FI | L: Aalto dil belgesi istemiyor; YL: IELTS 6.5 | YKI (yalnız Finlandiya) ya da Tisus | L: Aalto SAT 1350 / Math 700 |
| DK | IELTS 6.5, Cambridge 180 | Studieprøven / Danskprøve 2–3 (Türkiye'de yok) | — |
| IE | L: Trinity IELTS 6.5, Duolingo 120; YL: UCD 6.5 | Yerel dil yolu yok | L: Trinity Türk diplomasını doğrudan almıyor (Foundation) |
| HU | BME IELTS 5.5, TOEFL 72, Duolingo 100; YL'de PTE 50 | Macarca hazırlık yılı (SH); kurum sınavı | L: BME giriş sınavı |
| PL | IELTS 5.5 (Gdańsk), Cambridge B2 | Lehçe sertifika B2 (yasal asgari); C1 = ücretsiz Lehçe eğitim | L: Gdańsk matematik sınavı |
| CZ | ÇVUT: IELTS 6.0 / TOEFL 70 (Duolingo yok) | CCE B2 (Türkiye'de merkez yok) + ÚJOP hazırlık yılı | L: ÇVUT çevrim içi mülakat |

## 4. Düzeltilecek iddialar (dosya → eski → doğru → kaynak)
*Tam liste: JSON > `tur11Duzeltmeleri` (10 madde).*
- **`dogrulama/lisans-pl.json` > lis-pl-yerel-hata-ucretsiz:** "Türk vatandaşı ücret öder" → "C1 Lehçe sertifikası varsa Lehçe tam zamanlı eğitim ücretsiz (md. 324/2-5)". Kaynak: https://eli.gov.pl/api/acts/DU/2024/1571/text.html (Dz.U. 2024 poz. 1571, erişim 16.10.2026).
- **`dogrulama/yl-it.json` > yl-it-yr-t-cils:** "2027 CILS takvimi yayımlanmadı" → 2027 takvimi yayımlandı (6 oturum). Kaynak: https://cils.unistrasi.it/1/213/428/Le_date_degli_esami_2027.htm.
- **`dogrulama/yl-it.json` > yl-it-yr-t-celi:** kayıt son günü "3 Şubat" (San Francisco merkezi) → CVCL genel son günü 9 Şubat 2027; merkezler öne çekebilir. Kaynak: https://cvcl.unistrapg.it/pagine/calendario-esami-celi-e-dils-pg-000.
- **`dogrulama/yl-genel.json` > yl-dil-fransizca:** "TCF geçerliliği bulunamadı" → 2 yıl. Kaynak: https://www.france-education-international.fr/en/test/tcf-tout-public.
- **`dogrulama/yl-be.json`, `yl-nl.json`:** "CNaVT Türkiye merkezi doğrulanamadı" → İstanbul ve Bodrum'da kurum var. Kaynak: https://cnavt.org/examencentra/continent/azie.
- **`dogrulama/lisans-fi.json`, `yl-fi.json` > *-yki-yer:** "Doğrulanamadı" → YKI yalnız Finlandiya'daki merkezlerde. Kaynak: https://www.oph.fi/en/education-and-qualifications/selecting-right-yki-test-test-days.
- **`data/mevzuat/sinavlar.js`:** IELTS, TOEFL, SAT ve 11 AP kaydında `ulkeler` güncellemesi. Değerler JSON > `mevcutGuncellemeler` altında; mevcut `not` metni silinmez, `notEki` sona eklenir.

## 5. Yazılı teyit taslakları
**a) Goethe-Institut İstanbul** (pruefung-istanbul@goethe.de)
> Sehr geehrte Damen und Herren, ich bin Schülerin in Istanbul und plane, das Goethe-Zertifikat C1 bzw. C2: GDS und den TestDaF abzulegen. Könnten Sie mir bitte schriftlich mitteilen: (1) die Prüfungstermine 2027 in Istanbul und die jeweiligen Anmeldefristen, (2) die Prüfungsgebühren in TL bzw. EUR, (3) ob der TestDaF 2027 digital oder papierbasiert an Ihrem Institut angeboten wird? Vielen Dank. Mit freundlichen Grüßen, [Name]

**b) İstanbul İtalyan Kültür Merkezi** (iicistanbul@esteri.it)
> Gentili Signore e Signori, sono una studentessa di Istanbul e devo ottenere una certificazione di italiano di livello B2 prima della preiscrizione universitaria. Vi chiedo cortesemente di confermare per iscritto: (1) quali sessioni CILS, CELI e PLIDA del 2027 si terranno presso il vostro Istituto, (2) le scadenze di iscrizione presso la vostra sede (che possono essere anticipate rispetto a quelle degli enti certificatori), (3) le tasse d'esame per il livello B2. Grazie. Cordiali saluti, [Nome]

**c) NAWA Państwowa Komisja** (certyfikacja@nawa.gov.pl)
> Dear Sir or Madam, I am a Turkish high school student considering Polish-taught studies. Could you please confirm in writing: (1) whether any authorised centre in Türkiye will organise the C1 adult examination in 2027 (10–11 April or 27–28 November), (2) that a candidate must be 18 on the day of the adult C1 exam, and (3) that the C1 certificate entitles a foreign national to fee-free full-time Polish-taught studies at a public university under Art. 324(2)(5) of the Act. Thank you. Kind regards, [Name]

**d) Tisus, Stockholm Üniversitesi** (tisus iletişim sayfası)
> Dear Tisus team, I live in Istanbul and plan to take Tisus in May or October 2027. Istanbul appears in your 2025 list of test locations abroad. Could you confirm whether an Istanbul session is planned for 2027, the registration period for the abroad sessions, and the registration and test administrator fees? Kind regards, [Name]

## 6. Takip listesi
- **YL-1 KAPANDI (16.10.2026):** Jean Monnet 2027-2028 "Açıklamalar" yayımlandı. Dil belgesi kuralları: IELTS bilgisayar/çevrimiçi/kağıt kabul; IELTS/PTE One Skill Retake kabul (yalnız genel puan); TCF'de yalnız tout public, aynı oturumda üç zorunlu bölümün her birinde ≥400 (100–699 ölçeği). Kaynak: https://jeanmonnet.org.tr/wp-content/uploads/2026/10/clarifications_2027_2028_academic_year.pdf

**Eklenenler (Yayımlanmadı):**
*Aşağıdaki maddeler `takip-listesi.md` dosyasına "Tur 12" bölümü olarak eklendi.*
- DELE 2027 dönemleri ve ücretleri (Cervantes İstanbul, Aralık 2026 bekleniyor)
- Institut français İstanbul 2027 DELF/DALF takvimi (Aralık 2026)
- PLIDA 2027 takvimi (Kasım 2026 – Ocak 2027)
- CNaVT Mayıs 2027 dönemi (Mart 2027)
- Lehçe sertifikanın Kasım 2027 merkez listesi (her oturumdan yaklaşık 2 ay önce)

## 7. Kaynaklar (belge yılı · erişim)
Her kaydın `kaynaklar` alanında URL, belge yılı ve erişim tarihi var. Bu turda yeni okunan başlıca birincil kaynaklar şunlar:
- Polonya Kanunu Dz.U. 2024 poz. 1571, md. 79 ve 324: https://eli.gov.pl/api/acts/DU/2024/1571/text.html (2024 · 16.10.2026)
- Lehçe sertifika: 2027 oturumları (14.07.2026), ücretler ve yapı: https://certyfikatpolski.pl/terminy-sesji-egzaminacyjnych-w-2027-roku/ (2027 · 15.10.2026)
- Pearson PTE Türkiye: https://www.pearsonpte.com/test-centers-and-fees/ (2026 · 16.10.2026)
- GMAT Türkiye ücreti: https://www.mba.com/exams/gmat-exam/register/exam-payment
- GMAT yapı ve puanlar: https://www.mba.com/exams/gmat-exam/about/exam-structure
  (2026 · 15–16.10.2026)
- GRE yapısı: https://www.ets.org/gre/test-takers/general-test/prepare/test-structure.html (2026 · 15.10.2026)
- British Council IELTS Türkiye: https://www.britishcouncil.org.tr/exam/ielts/dates-fees-locations (2026 · 16.10.2026)
- Institut français İstanbul DELF/DALF: https://www.ifturquie.org/istanbul/sinav-ve-diplomalar/delf-dalf-2/ (2026 · 16.10.2026)
- FEI TCF: https://www.france-education-international.fr/en/test/tcf-tout-public (2026 · 15.10.2026)
- Cervantes İstanbul DELE: https://estambul.cervantes.es/tr/ispanyolca-sinavlari/dele/dele_sinav_ucretleri.htm (2026 · 16.10.2026)
- CVCL CELI 2026–2027: https://cvcl.unistrapg.it/pagine/calendario-esami-celi-e-dils-pg-000 (01.07.2026 · 16.10.2026)
- CILS 2027: https://cils.unistrasi.it/1/213/428/Le_date_degli_esami_2027.htm (2027 · 15.10.2026)
- OPH YKI tarihler ve ücretler: https://www.oph.fi/en/education-and-qualifications/registering-yki-test (Kararname 1508/2025 · 16.10.2026)
- ITNA: https://www.itna.be/boek-een-test/inschrijvingsprocedure/ (2026–2027 · 16.10.2026)
- CNaVT: https://cnavt.org/inschrijven ve https://cnavt.org/examencentra/continent/azie (2026 · 16.10.2026)
- Tisus yurt dışı yerleri 2025: https://www.su.se/download/18.39dc5cbc19afcf09c00165a/1765377242786/Provorter_Tisus_utland_2025.pdf (2025 · 16.10.2026)
- ÚJOP CCE: https://ujop.cuni.cz/UJOPEN-70.html?ujopcmsid=12:czech-language-certificate-exam-cce (2026 · 16.10.2026)
- ÖSD C1: https://osd.at/portfolio-item/osd-zertifikat-c1-zc1/ (2026 · 15.10.2026)
- Goethe C1 modülleri: https://www.goethe.de/ins/gb/de/m/sta/lon/prf/gzc1/w24.html (2026 · 15.10.2026)
