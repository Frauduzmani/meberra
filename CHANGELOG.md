# Sürüm notları

Meberra [anlamsal sürümleme](https://semver.org/lang/tr/) kullanır: `ANA.ARA.YAMA`.

- **YAMA** (1.3.**1**): hata düzeltmesi, metin düzeltmesi; davranış değişmez.
- **ARA** (1.**4**.0): yeni özellik, yeni sayfa ya da ekran; eski veriler ve bağlantılar çalışmaya devam eder.
- **ANA** (**2**.0.0): geriye uyumsuz değişiklik (ör. veri biçimi, API sözleşmesi, mobil uygulamanın güncellenmesini zorunlu kılan değişiklik).

Her sürümde: `package.json` → `version` güncellenir, bu dosyaya not eklenir, git'te `vX.Y.Z` etiketi atılır.
Sürüm numarası `/api/health` yanıtında ve yönetici panelinde görünür. Android uygulamasının (Google Play) `versionName` değeri buradaki sürümle aynı tutulur.

## [1.26.1] — 2026-10-25
### Düzeltildi
- **Sınav içi hesap makinesi**: "Hesap makinesi" düğmesi artık Desmos sitesine (yeni sekme, giriş isteyen sayfa) gitmiyor. Desmos'un **College Board sürümü** — gerçek AP'de Bluebook'a yerleşik olanın aynısı, girişsiz — sınav ekranının içinde açılır: masaüstünde sağ altta sürüklenebilir pencere, telefonda alttan açılan sayfa. Tür sınavdaki gibi: Calculus/Physics/Chemistry grafik, Biology bilimsel, ekonomi 4 işlem. Tam deneme sınavında hesap makinesiz kısma geçilince panel kapanır. Hesap makineli FRQ'larda da "Hesap makinesini aç" düğmesi. CSP'ye yalnız `frame-src https://www.desmos.com` eklendi.

## [1.26.0] — 2026-10-25
### Eklendi
- **`/ap-nedir` — "10 dakikada AP"** (giriş gerekmez): AP'yi hiç bilmeyen öğrenci için 6 sahnelik yolculuk, hedef sihirbazıyla aynı kart iskeleti ve Dede Korkut. 1) AP nedir (çevrilen kartlar) 2) 1–5 puan kaydırıcısı (College Board ölçeği) 3) MCQ / FRQ bölümleri 4) Türkiye'den kayıt takvimi (13 Kasım 2026 sipariş, geç sipariş +40 $, 3–14 Mayıs 2027, Temmuz puanlar) ve canlı geri sayım 5) Meberra'da yol 6) 5 soruluk mini test → **AP Kâşifi** rozeti + konfeti. Bütün sahneler aynı yükseklikte; telefonda yatay kaydırma yok.
- Giriş noktaları: vitrin "AP nedir? 10 dakikada öğren 🧭"; Bugün'de rozeti olmayan yeni öğrenciye tek bağlamsal kart (hiç soru çözmediyse en önde).

## [1.25.0] — 2026-10-25
### Eklendi
- **A2 İngilizce köprüsü.** Soru kökünde (ve FRQ metninde) bilmediğin kelimeye dokun → Türkçe anlam, kök, "AP terimi / sınav kelimesi" rozeti, 🔊 sesli okunuş; çok kelimeli terimler ("instantaneous rate of change") bütün olarak bulunur. Şıklarda basılı tut. Sayfa metni değiştirilmez (formüller bozulmaz). Sözlük: 4461 kelime + 1135 terim (`data/sozluk/ap-sozluk.json`, üretici `araclar/sozluk-olustur.js`). Yardım Profil'den ya da balondan kapatılır; 40 soruda neredeyse hiç kullanmayana "kapatabilirsin" önerisi.
- **"🔍 Ne soruyor?"** 3551 MCQ'da ve 75 yeni FRQ'nun her parçasında: sorunun ne istediğini cevabı vermeden anlatan Türkçe tek cümle. Cümleler cevabı bilmeyen yazarlarca yazıldı; doğru şıkka özgü kelime/sayı sızıntısı (`araclar/ne-soruyor-ekle.js`) ve eşitsizlik yönü ayrıca denetlendi.
- **İngilizce kalıplar destesi**: her derste 20 kartlık, her planda açık "Soru kalıpları" (Justify your answer, Derive an expression for…, Draw a correctly labeled graph…) — Türkçe anlam + puanlayıcının beklediği + İngilizce cümle kalıbı.
### Değişti
- Kelime balonu sınıf öneki `kb-` (kavram kartlarının `kk-` sınıflarıyla çakışıyordu).

## [1.24.0] — 2026-10-25
### Eklendi
- **75 yeni özgün FRQ** (toplam 32 → 107), gerçek sınav tipleri ve puanlarıyla: Calculus AB 14 · BC 8 · Physics 1 16 (4 yeni tipin hepsi) · Chemistry 17 (uzun + kısa) · Biology 17 (6 tip) · English Language 9 (sentez, retorik analiz, argüman; tam puanlık örnek deneme + cümle kalıpları) · Macro 8 · Micro 8 · CS A 10. Hepsi yazardan bağımsız ikinci denetimden geçti (sayılar yeniden hesaplandı; ders kitabıyla aynı veri taşıyan bir tablo özgünleştirildi).
- Calculus tam deneme sınavı artık gerçek düzende (Bölüm II-B: 4 FRQ, kısaltılmış değil).
- Araç: `araclar/frq-ekle.js` (taslak + karar → doğrulama → aktif, tohum sürümü +1; 1.24.0 FRQ'larında `ne_soruyor` zorunlu).
### Düzeltildi
- `frq-eng-1` sentez rubriği: üçten az kaynak kullanan yanıt kanıt satırında en çok 1 puan alır (önceden 2 yazıyordu).

## [1.23.0] — 2026-10-24
### Eklendi
- **Konu modu** (ders sayfaları): ünite açılınca üstte konu yolu (CED konuları, her konuda çözülen/toplam). Konu seçilince hedefler, ayrıntılı Türkçe anlatım (AP terimleri İngilizcesiyle), çözümlü örnekler, sınav ipuçları, sık hatalar, terimler ve altında yalnız o konunun soruları. "Ünite testi" tüm soruları gösterir; adres `?unite=N&konu=N.M`. `assets/js/konu-modu.js`, `assets/css/konu-modu.css`; sunucu sorularla `konuKod` gönderir.
- **Konu anlatımları** `data/dersler/<ders>/unite-<n>.json`: Calculus AB/BC 1–10 (111 konu), Physics 1 1–8 (43), Chemistry 1–9 (91), Biology 1–8 (65) — toplam 35 ünite, 310 konu. Denetim ve dizin: `node araclar/ders-veri-denetim.js [--dizin]`.
- **2304 yeni özgün AP-style soru** (Calculus 724, Physics 1 418, Chemistry 626, Biology 536); her CED konusunda en az 8 aktif soru. Hepsi yazardan bağımsız ikinci denetimden geçti (yanlış anahtar 0; düzeltilenler `ek.onay` kaydında). Soru bankası 3625 aktif soru, tohum sürümü 42.
### Değişti
- `araclar/onay2-uygula.js`: onay tarihi `--tarih` (varsayılan bugün) ve `--onay-kaynak` ile.
- `pm-denetim`, `yeni-soru-ekle`, `ders-veri-denetim`: sekme dahil kontrol karakteri ve ters bölüsü kaybolmuş LaTeX komutu yakalanır.
- Sunucu testlerindeki sabit soru sayıları tohumdan hesaplanır.

## [1.22.1] — 2026-10-24
### Düzeltildi
- Ders sayfalarında ham görünen formüller (Calculus, Chemistry, Physics, Biology; `<code>` içindeki LaTeX) MathJax ile çizilir.
- "Kendini dene" mini sorularında şıklar soru başına kararlı biçimde karıştırılır; doğru cevap artık hep A (ya da B) değil (`siraKaristir`, etkilesim-kbe.js ve etkilesim-mf.js).
- Physics 1 formül kartı resmî formül sayfasına göre yeniden yazıldı (kinematik, dinamik, enerji, momentum, dönme, salınım, akışkanlar, çekim); Gauss yasası, integral/türev formülleri ve yazım hataları kaldırıldı. "Temel kavramlar" bölümü cebir tabanlı Physics 1'e uyarlandı.
- Soru bankası (tohum sürümü 7): `calc_u8_q24` negatif hacim çeldiricisi, `calc_u4_q6` cevabı ele veren ondalık, `calc_u6_q32` konu etiketi, `chem_u1_q2` kök ve şık uzunluğu, `calc_sk_u2_2` cevabı veren şekil alt metni düzeltildi; Physics 1 bankasındaki 6 Physics C (calculus gerektiren) soru arşive alındı.
### Kaldırıldı
- Ders sayfalarındaki Abitur / Maturità / INVALSI / IMAT "üçlü sınav havuzu" bölümleri (AP dışı içerik). İçlerindeki AP tarzı çözümlü FRQ örnekleri "Adım Adım Çözümlü AP FRQ" bölümünde korundu.

## [1.22.0] — 2026-10-24
### Eklendi
- **Hedef sihirbazı** (`/ulkem`): 3 ekran, her biri aynı iskelette (renkli başlık + ilerleme çubuğu, ortada tek iş, altta Dede Korkut ve tek turuncu düğme). 1) Bayraklı kartlardan en çok 5 ülke (çoklu seçim, canlı "N ülke · M üniversite" sayacı). 2) Seçilen ülkelerin üniversiteleri (arama, isteğe bağlı) ya da "🤷 Okul bilmiyorum, ülke yeter". 3) **Şart tablosu**: sütunlar okul ya da ülke (genel kural), satırlar lise diploması · YKS · AP · giriş sınavı · dil belgesi · başvuru dönemi; hücreler ✅/⚠️/❌/❔ ve dokununca açıklama + resmî kaynak. Altında "🧭 Hepsine birden yeten yol" (AP dersleri, dil eşiği, sınavlar, YKS uyarısı, Mayıs AP sınavına kalan hafta). Sınıf (9–12, Mezun) ve alan (Mühendislik · Tıp/Sağlık · İşletme/Ekonomi · Fen) çipleri tabloyu canlı değiştirir. İlk açılışta konfeti; azaltılmış harekette animasyon yok.
- **Bu planı uygula**: misafir kayıt/giriş sayfasına seçimiyle gider; hesap açılınca profil sihirbazı atlanır, seçim profile yazılır (ülkeler, okullar, AP dersleri, sınav yılı, alan) ve **Bugün** ekranı "Plan senin, <ad>!" kutlamasıyla açılır. Giriş yapmış öğrencide özet ("Planına 2 ülke, 3 ders eklenecek") ve onay; dolu sınıf, aktif rota ve sınav yılı korunur.
- Yapılandırılmış şart verisi: `data/mevzuat/kaynak/isterler-<cc>.json` (15 ülke + okul özel kayıtları). Her ✅/⚠️/❌ hücre kaynak bağlantısı ve kesinlik taşır; kaynağı olmayan hücre "❔ Teyit et". Denetim `araclar/isterler-denetim.js` (üretici `--kontrol` ile çalışır).
- Motor `assets/js/hedef-motor.js`, arayüz `assets/js/hedef-sihirbaz.js`, stil `assets/css/hedef.css`. Testler: `hedef-birim-test`, `isterler-birim-test`, `e2e/hedef.spec.js`.
### Değişti
- Vitrindeki "Ücretsiz başla" düğmeleri kayıt formu yerine sihirbaza (`/ulkem`) gider.
- Ülke ayrıntısı (tarihler, burslar, sık hatalar) sonuç ekranındaki "Ülke ayrıntısı" bağlantılarıyla açılır; eski tam seçim adresleri (`?model=…&ulke=…&dil=…`) aynen çalışır, `?ulke=de` gibi kısa eski adresler sihirbazın sonuç ekranını açar.
- Profil `hedefOkullar` alanını saklar.

## [1.21.0] — 2026-10-22
### Değişti
- Ülkem (`/ulkem`) giriş ekranı sadeleşti: mor hero "Nerede okumak istiyorsun?" + uçuşan bayraklar + 1-2-3 adım. Önce ülke seçilir (büyük bayraklı kartlar, tek rozet "İngilizce: Geniş/Kısıtlı", "Adım adım takvim"); soluk/kilitli görünüm ve kartlardaki uzun uyarı metinleri kaldırıldı (uyarı sonuç özetinde). Ülke seçilince tek soru kutusu: "Son bir soru: <ülke> için durumun ne?" + sınıf (yalnız lise öğrencisine). Dil seçimi girişten kalktı (sonuçta "Yerel dile geç"). Sonuç görünümünde hero sade başlık bandına döner. Stiller `assets/css/ulkem.css`.

## [1.20.0] — 2026-10-22
### Değişti
- Maskot Tilki (Tilo) yerine **Dede Korkut**: ak sakal, uzun ak börk, mor kaftan + altın kuşak, sırtında kopuz. Aynı çizgi stili, aynı 6 ifade ve API (`MeberraMaskot`); kuyruk sallama yerine üzerine gelince kopuz sallanır. Statik dosyalar `assets/img/maskot/korkut-*.svg` (eski `tilki-*.svg` kaldırıldı). Maskot adı geçen tüm metinler güncellendi.
- Vitrin (`/`) AP'yi hiç bilmeyen ziyaretçi için: başlık faydayı söyler ("Yurt dışında üniversite mi hedefin? AP sınavlarına buradan hazırlan."), alt metin AP'yi tek cümlede tanımlar; ikinci düğme "AP nedir? 1 dakikada öğren". Hero'nun hemen altına "Bir dakikada AP" bölümü: Nedir? · Kim girer? · Ne zaman, nerede? · Ne işe yarar? + rehber bağlantıları.
### Düzeltildi
- Statik maskot SVG'lerinde yinelenen `stroke-width` özniteliği `<img>` ile yüklemeyi bozuyordu (XML ayrıştırma hatası).

## [1.19.1] — 2026-10-21
### Düzeltildi
- Ders sayfalarında ünite görünümü kayması (CLS 0,5–0,88 → 0,002): doğru ünite seçilene kadar içerik ilk boyamada gizlenir (6 sn güvenlik zaman aşımı).
- Canlıya alma: nginx CSS/JS önbelleği uygulamaya bırakıldı; `BUYUME_TUZ` üretimde zorunlu uyarısı; GitHub → sunucu kısa yolu `CANLIYA-ALMA.md` › A2.

## [1.19.0] — 2026-10-21
### Eklendi
- Okul ve öğretmen paneli: okul koltuk lisansı, öğretmen daveti, sınıf kodu (`/sinif?kod=`), ödevler, ilerleme ve ünite kapsamı ısı haritası, CSV. Öğrenci açık onayla katılır; boş koltuk varsa okul Premium'u. Öğretmen soru–cevap, not ve e-posta görmez.
### Değişti (sadeleştirme — sahip kararı: bu dalgadan sonra yeni özellik yok)
- Bugün tek yön: kişisel plandaki sıradaki görev; en fazla 4 blok; günün sorusu / ödev / yakın tarih tek "bağlamsal kart"ta.
- Çalış 4 giriş: Ders çalış · Tekrar et (Yanlışlarım, Bugünkü tekrar, Kavram kartları) · Kendini dene (deneme, FRQ, tam sınav, seviye testi) · Hız turu. Gezinmeye yalnızca "Odak" düğmesi eklendi.
- KVKK dışa aktarma ve silme 010–016 göçlerindeki tüm yeni tabloları kapsar. Okul koltukları Premium sayısına ve gelire girmez.

## [1.18.0] — 2026-10-21
### Eklendi
- Kişisel çalışma planı (`/plan`): sınava kadar haftalık görevler (CED ağırlığı + zayıf ünite), dersler dönüşümlü, son 6 haftada tam sınav, son 2 hafta tekrar; "plana göre önde / yolunda / geride"; ücretsiz planda kilitli üniteler arkada.
- Kavram kartları (`/kartlar`): 326 özgün kart, aralıklı tekrar (1/3/7/14/30), çevirme, klavye ve kaydırma.
- 6 herkese açık AP rehberi (`/rehber/ap-nedir`, `turkiyede-ap`, `ap-ile-avrupa`, `ap-calculus-nasil-calisilir`, `ap-fizik-kimya-biyoloji`, `ap-puan-tahmini`): resmi kaynaklı, SSS + yapılandırılmış veri, site haritasında.

## [1.17.0] — 2026-10-21
### Eklendi
- İnteraktif konu anlatımı: Calculus ve Physics 1'de 13 etkileşimli laboratuvar (limit, türev, Riemann, birikim, eğim alanı, Taylor; eğik atış, eğik düzlem, enerji çubukları, çarpışma, BHH, kaldırma kuvveti, Bernoulli); Chemistry, Biology, Ekonomi, CS A ve English araçları; her ünitede "Kendini dene", "Akılda kal", adım adım çözümlü örnekler.
- Hız turu (`/hiz-turu`): 60 sn, sunucuda süre ve kombo puanı, kişisel rekor ve paylaşım kartı. Günün sorusu: herkese aynı soru, anonim şık dağılımı. Odak sayacı (15/25/45 dk; dakikalar günlük hedefe sayılır).

## [1.16.0] — 2026-10-21
### Eklendi
- İlerleme grafikleri: hedefe yakınlık halkaları, 12 haftalık etkinlik takvimi, 7 günlük doğruluk eğrisi, tahmini AP puanı trendi, ünite ustalığı; veli panelinde aynı özet.
- Yönetici Premium sekmesi: aktif / bitiyor / deneme / bitti, kalan gün, toplu ver / uzat / iptal, abonelik geçmişi.
- Ünite ustalığı (Bronz/Gümüş/Altın), aylık görev ve rozeti, "Haftan nasıldı?" özeti, akıllı hatırlatma saati, dostça geri dönüş mesajı (3/7/14 gün).

## [1.15.0] — 2026-10-21
### Eklendi
- GitHub Actions CI (npm test, birim, pm-denetim, Playwright uçtan uca; haftalık); `e2e/` paketi (masaüstü + 390×844), `npm run test:e2e`, `npm run test:birim`.
- Çevrimdışı destek: sürümlü uygulama kabuğu önbelleği, maskotlu `/cevrimdisi` sayfası; API asla önbelleğe alınmaz. Eski Playwright betikleri `araclar/testler/eski/`.

## [1.14.0] — 2026-10-21
### Eklendi
- 82 yeni soru (bağımsız onaylı): Micro 67, Macro 67, English 86 aktif — Micro/Macro/English tam sınavları eksiksiz kurulur.
### Düzeltildi
- Almanya kaynağı: doğrulanamayan "anabin TUR-BV05" kodu kaldırıldı; YKS yerleşmesi şartı resmi uni-assist ülke sayfasına dayandırıldı.

## [1.13.0] — 2026-10-21
### Eklendi
- Şekilli sorular: gövdede, şıklarda (2×2 kart) ve çözümde (yalnız cevaptan sonra) SVG grafik; tema uyumlu, ekran okuyucu dostu, büyütme. Sunucu ve tarayıcıda katı SVG temizleyici; yönetici düzenleyicisinde canlı önizleme.
- 50 grafikli soru (Calculus 20, Ekonomi 12, Chemistry 10, Physics 8; bağımsız onaylı). Aktif soru bankası: 1.481.

## [1.12.1] — 2026-10-21
### Düzeltildi
- Bugün ve Çalış: AP kayıt son günü uyarısı yalnızca sınav yılı bu dönem olan öğrenciye gösterilir.

## [1.12.0] — 2026-10-21
### Eklendi
- Tam deneme sınavı (`/deneme?tam=1`, Premium): gerçek AP bölüm yapısı, süreleri ve hesap makinesi kuralları (9 sınav; College Board kaynaklı, `server/tohum/sinav-formatlari.json`).
  Süre sunucuda tutulur, otomatik teslim, soru ızgarası, işaretleme, şık eleme, ara ekranı, gözden geçirme; resmi formül/başvuru PDF bağlantıları, izinli bölümlerde Desmos.
- Bölüm II FRQ öz puanlamasıyla bileşik puan ve tahmini 1–5 (kesme puanları "tahmini"); ünite, soru süresi ve geçmiş grafikleri; yanlışlar akıllı tekrara eklenir.
- Tam sınav sonuçları veli panelinde; KVKK dışa aktarma ve silme kapsar.
### Not
- Micro ve Macro için tam sınav yeterli soru olana dek "Yakında".

## [1.11.0] — 2026-10-21
### Eklendi
- 220 yeni soru yayında (yazan ekipten bağımsız denetçiler her birini yeniden çözerek onayladı; 9 tekrar/benzer soru arşivde).
  Aktif soru bankası: Calculus 351 · Physics 225 · Chemistry 270 · Biology 207 · English 80 · Seçmeliler 141 · CEnT-S 74 (toplam 1.349).
- 32 FRQ yayında. Physics Unit 8 Fluids ve Biology Unit 8 Ecology üniteleri açıldı.
### Değişti
- Sahip adına içerik kararları (`araclar/icerik-denetim/KARARLAR.md`): Physics C vaadi kaldırıldı ("AP Physics 1"); 5 ileri soru "Physics C · ileri" etiketiyle derste kalır, Physics 1 denemesine girmez.
- 17 soru yeniden yazıldı (seviye testindeki 9 tekrar dâhil; kimlikler ve cevap geçmişi korunur); 121 zorluk etiketi kalibre edildi; 21 kimya konu numarası güncel CED'e çekildi.
- Yönetici formunda şık karşılaştırması büyük/küçük harfe duyarlı. FRQ tohumu da mevcut veritabanlarına sürümle aktarılır.

## [1.10.0] — 2026-10-21
### Eklendi
- İçerik denetimi: 1.130 sorunun her biri bağımsız olarak yeniden çözüldü — **hatalı cevap anahtarı yok**. Raporlar `araclar/icerik-denetim/`.
- Cevaptan sonra geri bildirimde kavram, hesap makinesi bilgisi; "Daha fazla" altında ipucu ve sık hata (ders, tekrar, deneme, seviye testi).
- FRQ pratiği (`/frq`): 32 özgün serbest yanıt sorusu (taslak, onaydan sonra yayında), rubrikle öz puanlama; ücretsiz planda her dersten 1.
- 229 yeni çoktan seçmeli soru (taslak) ve yönetici › Soru bankası › Onay kuyruğu (önizleme, toplu onay/ret, klavye kısayolları); yönetici FRQ sekmesi.
- Physics Unit 8 Fluids, Biology Unit 8 Ecology üniteleri ve English 4–6. okuma parçaları (onaylanan soru yoksa "Yakında").
### Değişti
- 40 metin/çeldirici düzeltmesi, 20 konu etiketi, 29 zorluk; 2 birebir tekrar soru arşivde (cevap geçmişi korunur).
- Mevcut veritabanları tohum sürümüyle otomatik güncellenir; yönetici düzenlemeleri korunur. Taslak sorular hiçbir yoldan öğrenciye gitmez.
- Ücretsiz planda Genel deneme kilitli kart olarak görünür. KVKK dışa aktarma ve silme FRQ verisini kapsar.

## [1.9.0] — 2026-10-21
### Değişti
- Tasarım taraması (her sayfa masaüstü/telefon, açık/koyu ekran görüntüsüyle; notlar `araclar/tasarim-1.9/`):
  - Sınavlar: "sıradaki tarih" sayacı ve zaman şeridi, sade sınav kartları, "Benim sınavlarım" süzgeci.
  - Ülkem: bayraklı ülke seçici, "AP burada ne işe yarar?" bandı, şart listesi, katlanır bölümler (sayfa boyu ~4 kat kısaldı).
  - Takvim, Başvurular, Üniversiteler ve rehberler ortak başlık düzeninde; rehberlerde içindekiler.
  - Profil 4 bölüm (yan menü / sekmeler); sınav sırasında odak modu; tek kutulu cevap geri bildirimi; Çalış'ta tek maskot.
  - Yasal sayfalarda tablo düzeni, Premium'da tek odak, şifre sıfırlamada geçersiz bağlantı ekranı.
- JS ve CSS her açılışta doğrulanır (ETag); yeni sürüme geçişte eski stil/betik kalmaz.
### Düzeltildi
- Sayfa kaymaları: deneme 0,134 → 0,003; Premium 0,090 → 0,008; tüm ana sayfalar ≤ 0,011.

## [1.8.0] — 2026-10-21
### Değişti
- Temiz adresler: `/bugun`, `/calis`, `/ders/calculus`, `/ulkem`, `/takvim`, `/basvurular`, `/rehber/almanya`…; URL'lerde .html yok. Eski `/x.html` adresleri 301 ile yönlenir (sorgu korunur).
- Yönetim paneli `/yonetim`: yalnızca yönetici oturumunda açılır, diğerlerine 404; adres herkese açık dosyalarda geçmez.
- E-posta ve bildirim bağlantıları temiz adreslerle; giriş yapmış kullanıcı `/` adresinde Bugün'e (veli kendi paneline) gider.
### Eklendi
- Bilinmeyen adreslerde maskotlu 404 sayfası; tanıtım sayfalarına `<link rel="canonical">`; site haritası, robots.txt ve PWA manifest (`start_url /bugun`) güncellendi.
### Not
- Site artık dosyadan (`file://`) açılmaz; `npm start` / `baslat.bat` ile açın.

## [1.7.0] — 2026-10-21
### Eklendi
- Veli paneli (`veli.html`): öğrenci davetiyle veli hesabı; haftalık özet, ders hedef ilerlemesi, son denemeler, AP tarihleri, Premium durumu; veli çocuğu için ödeme bildirimi verir.
- Karşılamada ve profilde AP dersleri, hedef puan (3/4/5), sınav yılı; Bugün planı, Çalış, deneme önerileri ve geri sayım seçime göre.
- Haftalık veli e-postası bağlı velilere (tek tıkla iptal); öğrenci bağlantıyı istediği an kaldırır; tüm bağlama işlemleri denetim kaydında.
### Değişti
- Yönetici kullanıcı listesinde rol süzgeci ve veli bağlantıları. Veritabanı göçleri artık `.js` de olabilir.

## [1.6.0] — 2026-10-21
### Eklendi
- Birinci taraf dönüşüm hunisi ölçümü (üçüncü taraf betik yok; DNT/GPC ve profil tercihi; 400 gün saklama) ve yönetici "Büyüme" sekmesi: huni, kohort, günlük grafikler, paywall yerleri.
- 7 gün ücretsiz Premium denemesi: kişi ve e-posta başına bir kez, ödeme bilgisi gerekmez; 2 gün kala ve bitişte bildirim; yönetici uzatır veya iptal eder; gelir tahminine girmez.
- İndirim kodları (yüzde/tutar, plan, tarih, kullanım sınırı); ödeme bildirimi indirimli tutarla kaydedilir.
- Davet programı: davet edilen seviye testini bitirince iki tarafa +7 gün Premium (davet edene yılda en çok 10); kötüye kullanım bayrakları.
- `HUKUK-NOTLARI.md`: yasal metinlere eklenecek maddeler.

## [1.5.0] — 2026-10-21
### Eklendi
- Soru bankası veritabanında (1.131 soru: 977 ders + 153 seviye testi + 1 vitrin örneği); tohum dosyası `server/tohum/soru-bankasi.json`, aktarıcı `araclar/soru-aktar.js`.
- Yönetici paneline "Soru bankası" sekmesi: istatistik, şüpheli soru vurgusu, önizleme, sürüm geçmişi ve geri yükleme, arşiv, JSON dışa aktarma.
### Değişti
- Cevap anahtarları artık herkese açık dosyalarda yok; cevap kontrolü, deneme ve seviye testi puanlaması sunucuda.
- Kilitli ünite ve ücretsiz deneme hakkı sunucuda denetleniyor; ücretsiz ünite kuralı tek ortak dosyada (`assets/js/ucretsiz-kural.js`).

## [1.4.0] — 2026-10-21
### Eklendi
- Maskot Tilo (6 ifade) ve hareket sistemi; tek seferde tek kutlama (kuyruk), ünite bitince paylaşılabilir hikâye kartı.
- Doğru cevapta "+10 XP" uçuşu ve gezinme çubuğunda XP sayacı; yanlışta açıklama kayarak açılır.
- Kıvrımlı öğrenme yolu (Çalış ve ders sayfaları), deneme puanının sayarak belirmesi, 7/30/100 gün seri kartları.
- Akşam seri tehlikedeyken uykulu Tilo hatırlatması; maskotlu boş ekranlar ve 404 sayfası.
### Değişti
- Bugün en fazla 4 blok; geri kalanı "Daha fazla" altında. Ders kartı → ders sayfası geçiş animasyonu.
- Yinelenen konfeti/toast ve sonsuz döngü animasyonları kaldırıldı.

## [1.3.0] — 2026-10-21
### Eklendi
- Yönetici paneli: kullanıcıların IP'si, son görülme, çevrimiçi durumu, günlük giriş sayısı, son giriş; oturum listesi.
- Kullanıcı ve IP engelleme (süreli/süresiz), destek merkezi (hazır yanıtlar, iç not, bekleme süresi), sistem bilgileri (uptime, bellek, önbellek, kuyruklar), elle yedek, bakım modu.
- Google Play (TWA) hazırlığı: `/.well-known/assetlinks.json`.
- Sürüm numarası ve bu sürüm notları.
### Değişti
- Telifli PDF'ler repodan ve siteden çıkarıldı; Calculus sayfası College Board'un resmi bağlantılarını kullanıyor.

## [1.2.0] — 2026-10-21
### Eklendi
- Sistem logları: sunucu ve tarayıcı hataları, yavaş istekler, güvenlik uyarıları; yönetici panelinde Sistem sekmesi.
- Sorularım ayrı sayfa; vitrinde canlı örnek soru; Premium ödeme adımları.
### Değişti
- Tasarım v5: tüm sayfalar yenilendi, sayfa kaymaları giderildi, geçiş animasyonları.
- Tarayıcı depolaması, yedekleme ve kurtarma kodu metinleri kaldırıldı (ürün yalnızca sunucu modunda çalışır).
- Resmi kaynaklardan bilgi düzeltmeleri (AP Calculus sınav yapısı, CEnT-S tarihleri).

## [1.1.0] — 2026-10-21
### Eklendi
- Yönetici paneli: Veri (tablo görüntüle/düzenle/CSV), Sorular, Duyuru, Lig.
- Soru–cevap (ücretsiz ayda 3), bildirim zili, e-posta hatırlatma, veli haftalık raporu, telefon bildirimi (PWA), haftalık lig.
- Oyunlaştırma: günlük hedef, seri koruma, akıllı tekrar, görevler, rozetler, kutlama, öğrenme yolu.
- Yeni vitrin (3 adımlı anlatım), üniversiteler sayfası yeniden tasarım.
### Değişti
- Hedefim üç bölüm: Ülkem, Takvimim, Başvurularım. Terim birliği; yüksek lisans yolu gizlendi.
### Düzeltildi
- Oturum süresi, şifre değişikliği, hesap silme, gelir tahmini, cihazlar arası eşitleme, ücretsiz ünite ve deneme hakkı kuralları.

## [1.0.0] — 2026-10-21
### Eklendi
- Node.js + SQLite sunucu: hesaplar, oturumlar, ilerleme senkronu, denetim kaydı.
- Ücretsiz / Premium (havale/EFT + yönetici onayı), yönetici paneli, yasal sayfa taslakları, canlıya alma dosyaları.
