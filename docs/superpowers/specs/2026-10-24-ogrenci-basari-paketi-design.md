# Öğrenci başarı paketi (1.24.0 → 1.28.x) — tasarım

**Neden:** "A2 İngilizceli, AP'yi hiç bilmeyen öğrenci" gözüyle yapılan değerlendirmede bulunan beş eksik: FRQ az, İngilizce köprüsü yok,
"AP nedir" sıfır noktası dağınık, ilerleme hedefi somut değil, ders kapsamı dar. Sahip (2026-10-24): "sırayla yapalım; hayal gücü sana
kalmış; kaotik olmasın; woow sayfaları olabilir; güzel, eğlenceli; öğrenciyi içeride tutsun". İçeriğe güven (öğretmen incelemesi) kapsam dışı.

**Anti-hedefler:** menüye yeni sekme yok (Bugün tek yön, Çalış 4 giriş korunur); her yeni şey var olan bir akışın içine yerleşir.
Yapay zekâ öğretmen / çalışma anında API yok. Telif: yalnız özgün içerik (College Board sorusu kopyası ya da yakın yeniden yazımı yok).

## 1. FRQ dalgası — 1.24.0
- Ders başına gerçek sınav FRQ tiplerinin her birinden birkaç özgün FRQ; hedef toplam (mevcut + yeni):
  Calculus AB 14 · BC 8 · Physics 1 16 · Chemistry 17 · Biology 17 · English Language 9 · Macro 8 · Micro 8 · CS A 10.
- Şema: `server/frq.js dogrula` (değişmez). Akış MCQ ile aynı: yazar ajan `araclar/frq-yeni/<ders>.json` (taslak) → bağımsız
  doğrulayıcı `araclar/frq-onay/<ders>.json` (onay | duzelt | red) → `node araclar/frq-ekle.js` (doğrula, düzelt, aktif yap,
  `ek.onay`, tohum surum +1).
- Arayüz: tam puan alınca kutlama; liste tip çipleriyle (ör. "Deney tasarımı ×4").

## 2. A2 İngilizce köprüsü — 1.25.0
- **"🔍 Ne soruyor?"**: her MCQ'ya cevabı ele vermeyen tek satırlık Türkçe açıklama (`ek.neSoruyor`). Tıklayınca soru kartında açılır.
- **Kelimeye dokun:** soru metnindeki akademik/AP kelimesine dokununca Türkçe anlamı (sözlük `data/sozluk/ap-sozluk.json`
  + konu terimleri). Bilinen kelimeler noktalı alt çizgi alır.
- **Soru kalıpları:** ders başına sık komut ifadeleri ("justify", "best supports", "closest to"…) Türkçe karşılık + örnekle;
  kavram kartları destesi olarak (Tekrar et içinde), menüye yeni giriş değil.
- **İngilizce düzeyi** (profil): Başlangıç → yardımlar açık; İyi → kapalı. Yeterince doğru cevaptan sonra "Yardıma az
  ihtiyacın var 🎉" önerisi (kademeli bırakma).

## 3. AP'ye giriş — 1.26.0
- `/ap-nedir`: 10 dakikalık, 6 kartlık hikâye (Dede Korkut anlatır): AP nedir → 1–5 puan ve üniversiteler → sınav nasıl
  (MCQ + FRQ, süre, hesap makinesi) → Türkiye'den nasıl girilir (kayıt, son tarih; resmî kaynak bağlantısı, ücret "merkeze göre
  değişir") → Meberra ile çalışma yolu → 5 soruluk mini test + rozet + konfeti. Hedef sihirbazından sonra ve Bugün'de yeni
  öğrenciye bir kez önerilir; menüde yok.

## 4. İlerleme hedefi — 1.27.0
- Bugün'de ders başına **tahmini AP puanı göstergesi** (1–5, "tahmini" etiketiyle): ünite ustalığı × CED sınav ağırlıkları +
  FRQ öz puanları + deneme sonuçları. "Mayıs'a N hafta" ve "bir sonraki banda çıkmak için: Unit 6'yı bitir" önerisi.
  Bant yükselince kutlama anı.

## 5. Kapsam — 1.28.x
- Yeni dersler: Precalculus, Statistics, Physics 2; CS A derinleştirme; Macro/Micro/English Language soru ve FRQ kalınlaştırma.
  Her ders: konu anlatımı (konu modu), CED konusu başına ≥ 8 MCQ, FRQ. Sırası: Precalculus + Statistics → Physics 2 + CS A →
  Ekonomi + English.

## Builder'a kalanlar
Görsel ayrıntı mevcut temayla; her adım ayrı sürüm, CHANGELOG, test, PR.
