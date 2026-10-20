# Karar Notu: İlk-20 üniversite listelerinde "Doğrulanamadı" hücrelerinin ikinci turu
*Ajan 13 (Mevzuat Uzmanı), Lead PM Dr. Aylin Kaya'ya. Tur 12, 15–16 Ekim 2026. Erişim tarihi: 15–16 Ekim 2026. Veri: `.agents/mevzuat/dogrulama/uni-<cc>.json` (yerinde güncellendi, şema korundu). Kontrol: `node araclar/ulke-veri-olustur.js --kontrol --kaynak .agents/mevzuat/dogrulama` → **0 sorun**.*

## 1. Sonuç

1. **161 açık hücreden 155'i kapandı, 6'sı açık kaldı.** Açık hücre, değeri "Doğrulanamadı" olan ya da kaynak alanı boş olan dil hücresidir. Açık kalanlar:
   - UniBS: 4 hücre.
   - UniFi: İngilizce lisans hücresi.
   - Toulouse III: İngilizce YL hücresi.
2. **Yöntem.** Web arama kullanmadım. Playwright ve Chromium ile gerçek tarayıcı açtım; ayrıca resmi katalogların kendi sayfalarının çağırdığı açık veri uçlarını okudum. Kullandığım ulusal kataloglar:
   - Hollanda: Studiekeuze123.
   - İsviçre: swissuniversities studyprogrammes.ch.
   - İspanya: Bakanlığın QEDU kataloğu.
   - Fransa: Parcoursup ve Mon Master açık verisi.

   İtalya'da üniversitelerin kendi DreamApply başvuru portallarını kullandım. **Cloudflare, AWS WAF ya da "Human Verification" çıkan hiçbir sayfayı aşmaya çalışmadım.** Bu sayfalar şunlar: unimi, unifi, unitn, unimib, unisi, unibs, usi.ch, tilburguniversity.edu, web.ub.edu, Universitaly, felvi.hu, mesetudes.be, corsi.unitn.it.
3. **Meberra için yeni ve somut İngilizce mühendislik lisansları:**
   - **UPV (Valencia):** 4 lisans yalnızca İngilizce: Robotics Engineering, Computer Science and Technology, Communication Networks and Systems, Intelligent Manufacturing.
   - **UPF (Barselona):** 4 mühendislikte %100 İngilizce grup var: Computer Engineering, Telecommunications Network Engineering, Mathematical Engineering in Data Science, Computational Audiovisual Engineering.
   - **KU Leuven:** Bachelor of Engineering Technology ve Business Engineering İngilizce. Toplam 8 İngilizce lisans var.
   - **UAB:** Artificial Intelligence lisansı İngilizce.
   - **Siena:** Biotech Engineering for Health İngilizce.
   - **USI:** Informatics ve Data Science İngilizce.
   - **Comillas (ICAI):** iMAT (Mathematical Engineering and AI) İngilizce + İspanyolca.
4. **Olumsuz netleşenler.** Bu kurumlarda tamamen İngilizce lisans yok:
   - UMONS: hiç İngilizce lisans yok.
   - UCLouvain: yalnızca Fransızca-İngilizce iki dilli kollar var, hepsi Saint-Louis Brüksel kampüsünde.
   - ULiège: mühendislik ve bilgisayar lisansları Fransızca + İngilizce.
   - ULB: yalnızca 2 ekonomi/işletme kolu İngilizce.
   - UNIL, UniNE ve Basel: tek İngilizce lisans İngiliz filolojisi.
   - Graz: 2 lisans (Economics ve filoloji).
   - USC: yalnızca filoloji.
5. **İspanya'da 11 üniversite "Yoruma açık" kaldı.** Bakanlığın QEDU verisi her program için yalnızca "yabancı dil: Sí/No" işareti veriyor; tam İngilizce ile kısmi İngilizceyi ayırmıyor. Comillas örneğinde QEDU 3 lisansı işaretlerken üniversite sitesi 20 lisansta İngilizce gösteriyor. Bu yüzden yalnızca QEDU'ya dayanan İngilizce hücrelerini "kısıtlı" yazdım. Yerel dil hücreleri ise sağlam: işaretsiz programlar yalnızca yerel dilde.

### Ülke başına önce/sonra (açık hücre sayısı)

| Ülke | Önce | Sonra | Kapanan hücrelerin yeni değerleri | Kesinlik (önce → sonra) |
| :-- | :-: | :-: | :-- | :-- |
| İspanya | 56 | 0 | L-EN: 4 var, 10 kısıtlı · L-yerel: 5 var, 1 yok (IE) · YL-EN: 9 var, 10 kısıtlı · YL-yerel: 16 var, 1 kısıtlı | D.13 / Teyit 5 / Yoruma 2 → Doğrulandı 7 / Teyit 1 / Yoruma 12 |
| İtalya | 25 | 5 | L-EN: 1 var, 3 kısıtlı · L-yerel: 5 var · YL-EN: 6 var · YL-yerel: 5 var | D.5 / Teyit 3 → D.1 / Teyit 2 / Doğrulandı 15 / Yoruma 2 |
| Hollanda | 25 | 0 | L-EN: 4 var · L-yerel: 3 var, 1 kısıtlı · YL-EN: 7 var · YL-yerel: 8 var, 2 kısıtlı | D.4 / Teyit 4 → Doğrulandı 13 |
| Belçika | 16 | 0 | L-EN: 1 var, 4 kısıtlı, 2 yok · L-yerel: 2 var · YL-EN: 4 var, 1 kısıtlı · YL-yerel: 2 var | D.3 / Teyit 5 → Doğrulandı 9 / Yoruma 1 |
| İsviçre | 13 | 0 | L-EN: 4 kısıtlı · L-yerel: 2 var · YL-EN: 4 var · YL-yerel: 3 var | D.2 / Teyit 3 → Doğrulandı 10 / Yoruma 1 |
| Fransa | 9 | 1 | L-EN: 1 kısıtlı · L-yerel: 1 var, 2 kısıtlı, 1 yok · YL-EN: 1 kısıtlı · YL-yerel: 2 var | D.1 / Teyit 5 → Doğrulandı 18 / Teyit 2 |
| Avusturya | 8 | 0 | L-EN: 1 kısıtlı · L-yerel: 1 var · YL-EN: 2 var · YL-yerel: 4 var | D.1 / Teyit 1 → Doğrulandı 10 |
| Macaristan | 5 | 0 | L-yerel: 2 var · YL-yerel: 3 var | Teyit 4 aynen kaldı (devlet burslu kontenjan sorusu açık) |
| Polonya | 4 | 0 | L-yerel: 2 var · YL-yerel: 2 var | Teyit 5 → 3 |
| **Toplam** | **161** | **6** | | |

İsveç, Finlandiya, Danimarka, İrlanda, Çekya ve Almanya dosyalarında açık hücre yoktu.

### Hâlâ açık kalanlar ve nedeni

| Hücre | Neden | Önerilen yol |
| :-- | :-- | :-- |
| UniBS: lisans EN, lisans yerel, YL EN, YL yerel | unibs.it ve en.unibs.it Cloudflare doğrulaması gösteriyor; bölüm alt alan adları "Human Verification" sayfası açıyor. DreamApply portalı bulunamadı. Universitaly'nin arka ucu AWS WAF ile korunuyor. | Yazılı teyit (§4) ya da sonraki turda Universitaly arayüzünün elle okunması |
| UniFi: lisans EN | unifi.it Cloudflare. DreamApply yalnızca master için. Mühendislik okulunda 7 İtalyanca lisans görüldü, İngilizce lisans görülmedi; ama tüm okullar taranmadı. | Yazılı teyit (§4) |
| Toulouse III: YL EN | Campus France kataloğunda kurum kaydı yok. utoulouse.fr İngilizce sayfası program listesi vermiyor. Mon Master verisinde dil alanı yok. | utoulouse.fr formasyon arama sayfası (sonraki tur) |

## 2. Karar gerektiren konular

**K1. Eşik tutarsızlığı.** Görev metninde "var ≥3, kısıtlı 1–2" yazıyor. Ama uni-at/be/ch/de/es/fr/it/nl.json dosyalarının `tanim` alanında "var: en az 4 program; kısıtlı: 1–3" yazıyor. Dosyadaki 200'ü aşkın hücre bu kuralla doldurulduğu için tutarlılık adına dosyadaki kuralı uyguladım.
- Tam 3 programla "kısıtlı" kalan hücreler şunlar. PM'in ≥3 kuralıyla bunlar "var" olur:
  - VUB lisans EN: 3.
  - UniMiB lisans EN: 2 + ortak AI lisansı = 3.
  - Siena lisans EN: 2 + İngilizce Dentistry = 3.
  - UNamur YL EN: açıkça yazan 3.
- Seçenekler:
  - (a) Dosyadaki ≥4 kuralı kalsın, görev metni düzeltilsin. Artısı: 200+ hücreye dokunulmaz.
  - (b) ≥3 kuralına geçilsin. Eksisi: Tur 11'in tüm "kısıtlı" hücrelerinin yeniden taranması gerekir.
- **Önerim (a).**

**K2. QEDU'ya dayanan İspanyol İngilizce hücreleri.** 11 üniversitede (UB, UAM, Navarra, IE YL, UGR, UV, US, USAL, USC, UPV/EHU, Unizar) İngilizce hücreyi QEDU işaretine dayanarak "kısıtlı / Yoruma açık" yazdım.
- Seçenekler:
  - (a) Arayüzde "kısmi" rozetiyle gösterilsin ve not alanı görünsün.
  - (b) IW-4 kapanana kadar bu hücreler "teyit" olarak gösterilsin.
- **Önerim (a).** Not alanı iki okumayı da açıkça yazıyor. UB'de 185 masterın 82'si işaretli, yani "var" olma ihtimali yüksek. Bu da notta belirtildi.

**K3. Kesinlik yükseltmeleri.** Tüm hücreleri kapanan ve başka açık konusu olmayan üniversiteleri "Teyit gerekir / Doğrulanamadı"dan "Doğrulandı"ya çektim.
- Macaristan'daki 3 üniversite "Teyit gerekir" kaldı. Harç notunda "devlet burslu kontenjan doğrulanmadı" yazıyor.
- Yükseltilen üniversitelerin listesi PM'in denetimi için `uygula.js` raporunda var (§5). Sizin ayrıca bildiğiniz bir "Teyit" nedeni varsa geri alınabilir.

## 3. Düzeltilecek iddialar

Bu tur proje veri dosyalarına (`data/...`) dokunmadım. Aktarım `node araclar/mevzuat-aktar.js` ile PM'de. Tur 11 notlarında yer alan şu genel ifade düzeltilmeli:

| Dosya | Eski | Doğru | Kaynak |
| :-- | :-- | :-- | :-- |
| karar-notu-2026-10-15-ilk20-bati.md §1 madde 2 (ve onu kullanan özet metinler) | "İngilizce lisans 'var': İspanya 3/20, Belçika 0/10" | İspanya'da en az 7/20 (UAB, UPF, UPV, Comillas, IE, UC3M, URL'nin Tur 11 kaydı dahil). Belçika'da 1/10 (KU Leuven, 8 program). | §5'teki UAB, UPF, UPV, Comillas ve KU Leuven bağlantıları |
| aynı not, madde 3 (mühendislik listesi) | İspanya: "UC3M, UPC (1)" | Listeye eklenmeli: **UPV** (4 tam İngilizce mühendislik lisansı), **UPF** (4 mühendislikte %100 İngilizce grup), **UAB** (Artificial Intelligence), **Comillas** (iMAT, iki dilli). Belçika: **KU Leuven** (Engineering Technology, Business Engineering). İsviçre: **USI** (Informatics, Data Science). İtalya: **Siena** (Biotech Engineering for Health). | aynı |

### §3-ek: PM kararı K1 uygulandı (16 Ekim 2026; Tur 11 kararı K-C)
Batı grubunun 8 dosyasında (uni-de/it/at/ch/nl/be/fr/es) `tanim` alanı yeniden yazıldı:
- **var:** En az 3 ayrı program.
- **kısıtlı:** 1–2 program, ya da yalnızca L3 girişi, ya da dil değişimi duyurulmuş.

Tur 11 ve Tur 12 notlarının hepsi tarandı. Değişen hücreler (10):

| Dosya | Üniversite | Hücre | Eski → yeni | Gerekçe (not alanında) |
| :-- | :-- | :-- | :-- | :-- |
| uni-it | 11 Torino | lisans.en | kısıtlı → var | DreamApply'da 3 İngilizce lisans |
| uni-it | 17 Milano-Bicocca | lisans.en | kısıtlı → var | 2 lisans + ortak AI lisansı |
| uni-it | 18 Siena | lisans.en | kısıtlı → var | 2 lisans + İngilizce Dentistry |
| uni-at | 3 CEU | lisans.en | kısıtlı → var | 3 İngilizce lisans |
| uni-at | 10 Leoben | lisans.en | kısıtlı → var | 3 İngilizce lisans |
| uni-ch | 10 ZHAW | yuksekLisans.en | kısıtlı → var | 3 İngilizce ya da ağırlıklı İngilizce master |
| uni-be | 6 VUB | lisans.en | kısıtlı → var | 3 İngilizce lisans |
| uni-be | 10 UNamur | yuksekLisans.en | kısıtlı → var | Sayfasında İngilizce yazan 3 master |
| uni-nl | 10 Twente | lisans.yerel | kısıtlı → var | 3 Felemenkçe lisans |
| uni-ch | 4 Basel | yuksekLisans.yerel | kısıtlı → var | Tutarlılık: 56 masterın dilleri arasında Almanca var |

**Bilerek değiştirilmeyenler:**
- **UGent lisans.en kısıtlı kaldı.** Üç İngilizce lisansın üçü de Güney Kore kampüsünde. Bu hücre Yoruma açık; not alanına eklendi.
- **İspanya'nın yalnızca QEDU'ya dayanan İngilizce hücreleri kısıtlı kaldı (K2).** Not alanlarına K2 açıklaması eklendi.

**İngilizce lisans "var" sayısı (önce → sonra):** DE 2→2, IT 10→13, AT 2→4, CH 0→0, NL 13→13, BE 1→2, FR 1→1, ES 7→7.

Kontrol aracının sonucu: 0 sorun.

## 4. Yazılı teyit taslakları

**UniBS (İtalyanca):**
> Oggetto: Corsi di laurea e laurea magistrale erogati in lingua inglese – a.a. 2027/28
> Gentile Ufficio Relazioni Internazionali, sono una studentessa turca (diploma di scuola superiore MEB, 12 anni di scolarità) interessata all'a.a. 2028/29. Il vostro sito non è accessibile dall'estero per un controllo di sicurezza. Potreste indicarmi (1) quali corsi di laurea triennale e a ciclo unico sono erogati interamente in inglese, (2) quali lauree magistrali sono in inglese, e (3) se esiste un portale di preiscrizione per candidati extra-UE? Grazie mille.

**UniFi (İngilizce):**
> Subject: Bachelor's degrees fully taught in English – 2027/28 and 2028/29
> Dear International Admissions Office, I am a Turkish high-school student (MEB diploma) planning to enrol in 2028/29. Your DreamApply portal lists only master's programmes. Could you confirm whether the University of Florence offers any first-cycle (laurea triennale) or single-cycle degree taught entirely in English, and if so, which ones? Thank you.

**Toulouse III / Université de Toulouse (İngilizce):**
> Subject: Master's programmes taught in English at Université Toulouse III – Paul Sabatier
> Dear International Office, could you send the list of master's tracks (parcours) at UT3 / Université de Toulouse that are taught entirely in English for 2027-28? Campus France's "Taught in English" catalogue currently shows no entries for your institution. Thank you.

## 5. Kaynaklar

Hepsine 15–16 Ekim 2026'da eriştim. Hücre başına tam URL ilgili JSON'un `kaynak` alanında.

- **Hollanda:** Studiekeuze123, kurum + düzey + dil filtresi, Ekim 2026 kaydı. https://www.studiekeuze123.nl/opleidingen
- **İsviçre:** swissuniversities studyprogrammes.ch, kurum + dil filtresi. https://www.studyprogrammes.ch/en
  - Veri ucu: https://api.studyprogrammes.ch/list_studyprogrammes
- **İspanya:**
  - QEDU (RUCT/SIIU, 2025-2026): https://www.ciencia.gob.es/qedu.html
  - UAB: https://www.uab.cat/web/study/undergraduate/undergraduate-offer/bachelor-s-degrees-in-english-1345667078818.html
  - UPF: https://www.upf.edu/en/web/graus/ordre-alfabetic ve https://www.upf.edu/web/masters/masters-universitaris
  - UPV: https://www.upv.es/estudios/grado/index-en.html ve https://www.upv.es/estudios/posgrado/index-en.html
  - UC3M: https://www.uc3m.es/postgraduate/home
  - UPC (2026-27): https://www.upc.edu/en/masters/index
  - URL: https://www.url.edu/en/programmes/university-masters
  - Comillas: https://www.comillas.edu/en/degrees/ ve https://www.comillas.edu/en/postgraduate/
  - IE: https://www.ie.edu/university/studies/academic-programs/
  - UCM: https://www.ucm.es/pci/master-programmes-in-english
- **İtalya:**
  - DreamApply portalları: https://apply.unimi.it, https://apply.unimib.it (2027/28), https://apply.unisi.it, https://apply.unifi.it. UniMi, UniSi ve UniFi portalları 2026/27 dönemini gösteriyor.
  - Cattolica: https://international.unicatt.it/ucscinternational-graduate-programs-2-year-graduate-degrees-in-english
  - UniTrento bölüm siteleri: disi, economia, physics, sis .unitn.it
  - UniFi Mühendislik: https://www.ingegneria.unifi.it/vp-48-lauree-triennali.html
- **Belçika:**
  - KU Leuven Programme guide 2026-2027: https://onderwijsaanbod.kuleuven.be/opleidingen/e
  - UGent Studiekiezer 2027-2028
  - UCLouvain 2026-2027: https://uclouvain.be/en/study-programme/bachelors-programmes-2026
  - ULB: https://www.ulb.be/en/programme
  - VUB
  - ULiège: https://www.enseignement.uliege.be/prog-cours
  - UMONS: https://web.umons.ac.be/en/training-offer/
  - UNamur
- **Avusturya:**
  - Uni Graz bachelor/master katalogları ("Languages" filtresi)
  - Salzburg: 48 program sayfası
  - AAU: https://www.aau.at/studium/studienangebot/
  - Leoben: https://www.unileoben.ac.at/en/studying/
- **Fransa:**
  - Parcoursup 2025 açık verisi: https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-parcoursup/
  - Mon Master 2025 açık verisi: https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-mon_master/
  - Campus France TIE: https://tie-api.campusfrance.org/sgetprograms/1
  - ENS Lyon: https://www.ens-lyon.fr/en/studies/academic-programs/z-courses
  - Centrale Lyon bachelor sayfaları
- **Macaristan:**
  - BME: https://felvi.bme.hu/szakkereso?szint=2
  - MATE Képzéskereső
  - SZE: https://felveteli.sze.hu/alapkepzesi-szakok-5 ve https://felveteli.sze.hu/mesterkepzesi-szakok-5
- **Polonya:**
  - PULS 2026/27 kontenjanları: https://up.poznan.pl/kandydat/stopien-1 ve https://up.poznan.pl/kandydat/stopien-2
  - Pollub: https://bkm.pollub.pl/rekrutacja/studia-po-polsku/kierunki-studiow

**proje.md için özet:**
> Tur 12 (16 Ekim 2026), Ajan 13. İlk-20 üniversite listelerinde 161 açık dil hücresinin 155'i gerçek tarayıcı ve ulusal kataloglarla kapandı (ES 56→0, IT 25→5, NL 25→0, BE 16→0, CH 13→0, FR 9→1, AT 8→0, HU 5→0, PL 4→0). Kalan 6 hücre: UniBS 4, UniFi lisans EN, Toulouse III YL EN. Doğrulama aracı 0 sorun. Yeni İngilizce mühendislik lisansları: UPV 4, UPF 4 (İngilizce grup), KU Leuven, UAB AI, Siena, USI.
