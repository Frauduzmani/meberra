# 1.24.0 FRQ yazım rehberi

Hedef: yalnız Meberra ile çalışan Türk lise öğrencisi (İngilizcesi A2–B2) AP sınavının yazılı bölümünden yüksek puan alabilmeli.
**Telif: yalnız özgün içerik.** College Board'un yayımlanmış/gizli FRQ'larını, puanlama yönergelerini ya da AP Classroom maddelerini
kopyalama, yakın yeniden yazma da yapma (aynı senaryo + aynı sayılar + aynı soru zinciri = yakın yeniden yazma). Herkese açık CED
konularını ve sınav formatını (soru tipi, parça yapısı, puan, süre, hesap makinesi kuralı) izle. Pasajlar özgün ya da açıkça kamu
malı (1929 öncesi, yazarı ve tarihiyle belirtilmiş) olabilir.

## Şema — `server/tohum/frq.json` içindeki mevcut FRQ'ları oku (ders başına en az 2 tanesini baştan sona), `server/frq.js` `dogrula`
- Alanlar: id, sayfa, ders, tur, baslik, sure_dk, hesapMakinesi, zorluk (easy|medium|hard), giris (HTML), parcalar[], toplam_puan,
  kaynak, durum "taslak", ek { uretim: "1.24.0", cedKonu: "<n.m ya da ünite>", tip: "<sınavdaki FRQ tipi, İngilizce resmî adı>" }.
- id: `frq-<onek>-k<n>` — onek mevcut FRQ'lardaki gibi (calc-ab, calc-bc, phys1, chem, bio, eng, macro, micro, csa).
- kaynak: "AP-style original (Meberra 1.24.0)".
- Her parça: harf (a, b, c… sırayla), soru (İngilizce, sınav dili), puan, rubrik [{ puan, olcut (Türkçe, puanlayıcının
  aradığı somut şey), ornek_cevap (İngilizce, o puanı alan kısa cevap — puan getiren ifade kalıbıyla) }], ornek_cozum (Türkçe adım
  adım HTML; İngilizce tam puanlık cevap cümlesiyle biter), sik_hatalar [Türkçe], **ne_soruyor** (Türkçe tek cümle: bu parça ne
  istiyor — cevabı ele vermeden; ör. "Tablodaki verilerle integrale yaklaşık değer bulmanı ve sonucu birimiyle yorumlamanı istiyor.").
- Rubrik puanları toplamı = parça puanı; toplam_puan = parça toplamı. Matematik `\( \)` ve `\[ \]`; `$` YOK. JSON'da ters bölü `\\`.
- HTML: mevcut FRQ'lardaki etiket/sınıflar (p, table.frq-tablo, blockquote.frq-kaynak, pre>code.language-java, ul/ol, strong, em, sub, sup).
  Şekil gerekiyorsa tablo ya da metinle betimle; SVG şekil kullanma.

## Format (gerçek sınavla aynı tip, puan ve süre)
- **Calculus AB/BC:** 6 parçaya kadar, 9 puan; hesap makineli (1–2. soru tipi: oran/birikim tablosu, modelleme) ve hesap makinesiz
  (grafik analizi f′, parçacık hareketi, DE + eğim alanı, alan/hacim, tablo, örtük türev). sure_dk 15. BC: seriler (Taylor,
  Lagrange hata sınırı, yakınsaklık aralığı), parametrik/vektör, polar, Euler/lojistik. "Justify" parçaları zorunlu (MVT, IVT, EVT,
  1./2. türev testi, Riemann toplamı yorumu birimiyle).
- **Physics 1 (2025+ format):** Mathematical Routines (10 puan), Translation Between Representations (12), Experimental Design and
  Analysis (10), Qualitative/Quantitative Translation (8). Cebir tabanlı; Unit 1–8 dağılımı (akışkanlar dahil).
- **Chemistry:** uzun 10 puan (çok parçalı, hesap + açıklama + parçacık düzeyi gerekçe) ve kısa 4 puan. Ünite 1–9 dağılımı.
- **Biology:** uzun: Interpreting and Evaluating Experimental Results (+ graphing) 8–9 puan; kısa 4 puan: Scientific Investigation,
  Conceptual Analysis, Analysis of Model or Visual Representation, Analysis of Data. Parçalar "identify / describe / explain /
  predict / justify" komutlarıyla.
- **English Language:** Synthesis (6 özgün kısa kaynak, Source A–F, en az biri tablo/grafik), Rhetorical Analysis (özgün ya da kamu
  malı pasaj), Argument. Tek parça, 6 puan: Thesis 0–1, Evidence and Commentary 0–4, Sophistication 0–1 (rubrik maddeleri bu üçü
  ve her düzeyin ölçütü; ornek_cozum = tam puanlık örnek deneme + neden puan aldığı). sure_dk 40.
- **Macro/Micro:** uzun 10 puan, kısa 5 puan; grafik çizme parçaları ("draw a correctly labeled graph") rubrikte eksen/eğri/denge
  etiketleriyle puanlanır. ornek_cozum grafiği adım adım tarif eder.
- **CS A (2025–26 CED):** 1) Methods and Control Structures, 2) Class Design, 3) Data Analysis with ArrayList, 4) 2D Array. Java,
  `/* to be implemented */` imzaları, rubrik AP tarzı (doğru döngü, doğru koşul, doğru dönüş, …).

## Kalite
- Her FRQ'yu kendin baştan çöz; sayısal cevapları node ile doğrula (diskteki betikle). Rubrik, farklı ama doğru cevapları da kabul
  etmeli ("ya da eşdeğeri"). Zorluk dağılımı ≈ %25 easy, %45 medium, %30 hard. Senaryolar birbirini tekrar etmez, mevcut FRQ'ları
  da tekrar etmez.
- Türk A2 öğrencisi için: ornek_cozum Türkçe ve öğretici; İngilizce cevap kalıpları vurgulu (`<strong>`).

## Dosya yazma uyarısı
JSON'u **bash heredoc ya da `node -e` ile yazma** — kabuk ters bölüleri yer (`\text` → sekme+"ext", `\frac` → form besleme).
Dosya yazma aracını ya da diske kaydedilmiş bir node betiğini (String.raw) kullan.

## Kendi denetimin
1. `node -e` YERİNE diskteki betikle: her FRQ için `require("./server/frq.js").dogrula(f)` → [] ve
   `require("./araclar/frq-ekle.js").icerikDenetle(f)` → [].
2. Kuru deneme: geçici bir karar dosyası (hepsi onay) ile
   `node araclar/frq-ekle.js --taslak araclar/frq-yeni/<ders>.json --karar <geçici> --kuru` → 0 hata. **--kuru olmadan çalıştırma.**
3. Yalnız `araclar/frq-yeni/<ders>.json` dosyasını yaz; başka dosyayı değiştirme.
Rapor: FRQ listesi (id, tip, cedKonu, puan, zorluk), emin olmadığın noktalar.
