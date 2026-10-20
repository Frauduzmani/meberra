# Karar Notu — Üniversite Mezunu: Almanya'da Yüksek Lisans (İngilizce yol / Almanca yol)
*Ajan 13 (Kabul Mevzuatı) → Lead PM. Tur 11, 15 Ekim 2026. Hedef başlangıç: WS 2027/28 (ve SS 2028). Bulgu dosyası: `.agents/mevzuat/dogrulama/yl-de.json` (68 madde, 9 örnek program, 7 teyit taslağı).*

## Yönetici özeti (15 satır)
1. **Diploma sorun değil:** Türk Lisans (4 yıl, 240 ECTS) anabin'de Alman lisansına **eşdeğer (A4)**; sorgulanan 226 Türk üniversitesinin tamamı **H+**. KKTC üniversiteleri **H+/-** (risk). Önlisans (2 yıl) yüksek lisansa **yetmez**.
2. **Asıl eleme alan uyumu ve testler:** ECTS blokları (ör. TU Berlin CS: 36 CS + 18 matematik; başvuranların <%5'i karşılıyor), puanlı Eignungsverfahren (TUM), **GRE** (RWTH'de AB dışı derece için çoğu programda zorunlu, Almanca programlarda da).
3. **İngilizce yol:** Yüksek lisansların yalnızca **%18,2'si (1.944/10.659)** İngilizce. Türk üniversitesinin İngilizce eğitim yazısı **TUM ve KIT'te geçer, TU Berlin ve Stuttgart INFOTECH'te geçmez**. IELTS 6,5–7,0 bandı. En erken son tarih **15 Ocak 2027** (Stuttgart).
4. **Almanca yol:** Seçenek ~5,5 kat; gerekli belge **DSH-2 / TestDaF 4x4 / Goethe C2 / telc C1 Hochschule** (RO-DT, Kasım 2025). Goethe C1 yalnızca bazı üniversitelerde (KIT evet, TUM hayır). DSH Türkiye'de yapılamaz. **Harç farkı yok.**
5. **Para:** BW 1.500 €/dönem (konsekutif YL dahil); TUM 4.000/6.000 €, **WS 2027/28 yeni kayıtlarda 4.600/6.800 €**; uni-assist 75 € + 30 €. Bloke hesap 2026'da **992 €/ay (11.904 €/yıl)**; BAföG yasası geçerse **WS 2027/28 için artabilir**.
6. **Vize:** Türkiye'de öğrenim vizesi **yalnızca Auslandsportal**; bekleme 1–4 ay. Mezuniyet sonrası **18 ay** iş arama izni (§20 AufenthG).
7. **Kritik riskler:** (a) GRE'siz RWTH başvurusu anında ret; (b) Ocak son tarihleri; (c) "İngilizce program = Almancasız" yanılgısı (RWTH Informatik kayıtta Almanca da ister); (d) DAAD genel YL bursunda Türkiye uygunluğu belirsiz, 2027/28 son tarihi (31.08.2026) geçti.

---

## 1. Sonuç (PM'in bilmesi gerekenler)
- Üniversite mezunu modeli Almanya için **uygulanabilir**: denklik/Studienkolleg engeli yok; karar program düzeyinde verilir.
- İki yol aynı ortak çekirdeği paylaşır (anabin, uni-assist/portal, not dönüşümü, GRE, harç, vize); farklar **dil belgesi, program sayısı ve son tarih takvimidir**.
- Portalda "Üniversite mezunu" profili için zaman çizelgesi **başlangıçtan 12–18 ay önce** başlamalı (GRE + IELTS/TestDaF + ECTS analizi).
- Almanca yolda harç avantajı yok; avantaj **seçenek genişliği** ve Almanya'da kalış/iş için dil.
- İşletme/ekonomi: TUM SOM GRE kabul etmez, GMAT ister (Türkiye için isteğe bağlı); kredi blokları farklı — ayrı alt not yeterli.

## 2. Karar gerektiren konular
**K1 — "Üniversite mezunu" profilinde varsayılan yol hangisi gösterilsin?**
- A) İngilizce yol varsayılan, Almanca yol ikinci sekme. Artı: hedef kitlenin çoğu İngilizce eğitimli/IELTS'e yakın; hızlı. Eksi: program havuzu dar (%18), MOI tuzakları.
- B) İki yol yan yana, eşit ağırlık. Artı: kullanıcı talimatına birebir uygun; Almanca yolun 5,5 kat seçeneği görünür. Eksi: ekran yükü.
- **Öneri: B**, ortak çekirdek üstte tek blok, altında iki sütun (en / yerel).

**K2 — GRE uyarısı nasıl gösterilsin?** Öneri: ortak blokta "AB dışı derece = RWTH'de GRE" kırmızı uyarı; KIT'in EHEA muafiyeti yanında "teyit et" notu.

**K3 — Bloke hesap tutarı:** 992 € "Doğrulandı (2026)" + "WS 2027/28 için artabilir (Yayımlanmadı)" ikilisi. Öneri: bütçe hesaplayıcıda tampon (ör. +%10) ama rakam olarak yalnız 992 € yaz.

## 3. Düzeltilecek iddialar (mevcut dosyalar)
| Dosya > konum | Eski | Doğru | Kaynak |
| :-- | :-- | :-- | :-- |
| `data/mevzuat/ulke-rotalari.js` > `de-vize` > detay | "Temsilcilik bilgi notuna göre vize genellikle 4–6 haftada çıkar…" (kanal belirtilmemiş) | Türkiye'de öğrenim vizesi **yalnızca Auslandsportal** (digital.diplo.de/studium) üzerinden; kayıttan başvuruya bekleme **1–4 ay**, işlem en az 15 gün (45 güne kadar); başvuru en erken seyahatten 6 ay önce. Kesinlik: Doğrulandı | https://tuerkei.diplo.de/tr-de/service/05-visaeinreise/2720740-2720740 ; https://tuerkei.diplo.de/tr-de/service/05-visaeinreise/2729790-2729790 |
| `proje.md` §6 tablo satır 12 ve §12.3 | "Şu an doğru. 2028'de artmış olması muhtemel" | Dayanak eklenmeli: tutar BAföG'e bağlı (§2 Abs. 3 AufenthG); 30. BAföG değişiklik yasası (Drs. 21/8405) konut payını SS 2027'den 440 €'ya, Bedarfssatz'ı WS 2027/28'den 503 €'ya çıkarmayı öngörüyor → artış 2027'de de olabilir. Kesinlik: Yayımlanmadı | https://www.bundestag.de/presse/hib/kurzmeldungen-1223398 ; https://www.gesetze-im-internet.de/aufenthg_2004/__2.html |
| `data/mevzuat/sartlar.js` (şema) | Yalnız lise öğrencisi/lise mezunu | "Üniversite mezunu" profili için yeni kayıt gerekiyor (veri sahibi ajan); içerik `yl-de.json`'dan alınır | — |

Not: `ulkeler.js` içindeki "Türkiye temsilciliğinin öğrenci bilgi notunda hâlâ 853 €/ay" ifadesi bu turda da doğrulandı (eski Merkblatt hâlâ yayında); değişiklik gerekmez.

## 4. Yazılı teyit taslakları
`yl-de.json > teyitTaslaklari` içinde tam metin (7 adet): uni-assist (not dönüşümü Nmin, e-Devlet transkripti, çeviri), TUM (MOI kabulü + 2027/28 harç kademesi), RWTH (GRE + Almanca seviye), KIT (GRE muafiyeti), İstanbul Başkonsolosluğu (2027 Sperrkonto tutarı, randevu yeri/iDATA ücreti, sigorta), DAAD İstanbul (Türkiye uygunluğu, DAAD-TEV takvimi), Goethe-Institut İstanbul (C2 ve TestDaF tarih/ücret).

## 5. Kesinlik dağılımı ve açık noktalar
68 madde: Doğrulandı 56, Teyit gerekir 7, Yayımlanmadı 2, Yoruma açık 2, Doğrulanamadı 1.
- **Teyit gerekir:** yl-de-isletme-farki, yl-de-harc-diger, yl-de-saglik-sigortasi, yl-de-yerel-tr-merkez, yl-de-yerel-kosullu, yl-de-burs-daad-genel, yl-de-burs-tum-muafiyet.
- **Yayımlanmadı:** yl-de-sperrkonto-2027, yl-de-burs-daad-tev. **Yoruma açık:** yl-de-vize-idata, yl-de-burs-epos. **Doğrulanamadı:** yl-de-not-esigi (genel "2,5" eşiği yok; program yönetmeliği esas).
- Takip listesine YL-DE-1…7 eklendi. Bu turda web arama kotası doldu; TU Darmstadt programı, RWTH dönem katkı payı ve Goethe Türkiye ücret sayfası (403) okunamadı.

## 6. Kaynaklar (erişim: 15.10.2026)
- anabin (KMK/ZAB) — Lisans/Bachelor A4, Önlisans A2, Türk kurumları H+: https://anabin.kmk.org/db/hochschulabschluesse ; https://anabin.kmk.org/db/institutionen (canlı veritabanı)
- uni-assist — ücretler: https://www.uni-assist.de/en/how-to-apply/pay-all-fees/handling-fees/ ; Türkiye: https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/tr/
- TUM — Informatics, Mechanical Engineering, dil belgeleri, VPD, harç (WS 2027/28 artışı), Bavyera formülü (Temmuz 2020): tum.de sayfaları (yl-de.json'da tam URL)
- RWTH — GRE tablosu (Mart 2025): https://www.rwth-aachen.de/global/show_document.asp?id=aaaaaaaacuuhvtx ; uluslararası başvuru ve Informatik başvuru sayfaları
- KIT — Computer Science / Informatik M.Sc., harç: sle.kit.edu, intl.kit.edu
- TU Berlin — M.Sc. CS ve EECS FAQ; Uni Stuttgart — CS M.Sc., INFOTECH FAQ, ücretler
- MWK Baden-Württemberg — 1.500 € / 650 €
- HRK — Statistische Daten WiSe 2025/26 (§1.10); RO-DT (HRK 04.11.2025, KMK 27.11.2025)
- TestDaF — tarihler ve FAQ; Goethe-Institut Türkiye (erişim engelli)
- Alman temsilcilikleri — Türkiye (Studium, Aktuelle Hinweise), Tiflis D3f, Beyrut; Auslandsportal
- AufenthG §2, §16b, §17, §20 (gesetze-im-internet.de); Bundestag hib 800/2026 (BAföG)
- DAAD — DAAD-TEV, Study Scholarships, EPOS, Helmut-Schmidt (DAC 2025 listesi); Deutschlandstipendium FAQ; EHEA üye listesi
