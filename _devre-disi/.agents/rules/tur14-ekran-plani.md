# Tur 14 — Ders Portalları Ünite Gezinmesi Ekran Planı (Ajan 11, 19–20 Ekim 2026)

> Kural: AGENTS.md §2.1 md. 8 (yeni eklemede ekran baştan değerlendirilir). Kapsam: Tur 14 içerik eklemeleri —
> Calculus ~16 soru (mevcut ünitelere), Faz 37 Physics 1 Unit 7, Faz 36 Biology Unit 7, Faz 38 Chemistry Unit 9 — ve sınav bilgisi güncellemesi.
> Değişmeyen sözleşmeler: soru nesnesi şeması, quiz konteyner kimlikleri (`*-quiz-container`), `apmeberra:quiz:v1` sayfa/ünite anahtarları, h2 kimlikleri.

## 1. Mevcut durumun değerlendirmesi (ölçüm, 1280 px)

İçindekiler (`initDocToc`, `assets/js/app.js`) zaten veri odaklıdır: ders sayfasındaki her `h2`'den bir satır üretir. Yeni ünite girer, ama ölçek sorunu vardı:

| Sayfa | h2 | Eski satır | Liste yüksekliği | Sorun |
| :--- | ---: | ---: | ---: | :--- |
| ap-calculus | 29 | 29 | 1152 px | 10 satır bağlamsız "Soru istasyonu"; ekrandan uzun |
| ap-physics | 20 | 20 | 750 px | aynı |
| ap-chemistry | 20 | 20 | 710 px | aynı |
| ap-biology | 16 | 16 | 572 px | aynı |
| ap-electives / ap-english | 14 / 8 | 14 / 8 | — | istasyon adları kayboluyordu ("Soru istasyonu" ×8) |

Tur 14 eklemeleriyle eski yapıda Physics 22, Chemistry 22, Biology 18 satıra çıkacaktı.

## 2. Kararlar

| No | Karar |
| :--- | :--- |
| T1 | **Ünite satırı = anlatım + "Sorular" çipi.** "Unit N: …" anlatım başlığından hemen sonra aynı ünite anahtarlı soru istasyonu geliyorsa tek satırda birleşir: numara rozeti · kısa ad · [Sorular]. Her ünite eklemesi İçindekiler'e yalnızca **+1 satır** ekler. |
| T2 | **Grup başlıkları:** en az 3 ünite satırı varsa "Üniteler" (CEnT-S'te "Bölümler") başlığı; ünitelerden sonraki bölümler "Ek bölümler" altında. Özet satırı "İçindekiler · 10 ünite". |
| T3 | **Eşleşmeyen istasyon** (English Unit A/B, Seçmeliler) ayrı satırda bağlamlı adla: "Sorular · Unit 1–3 (AP CSA) Strings…". Grup yoksa numara rozeti gösterilmez; ad "Unit 5: …" biçiminde kalır. |
| T4 | **Veri kaynağı yalnızca başlık metni.** Ayrıştırma saf fonksiyonlarda: `apTocParse(text)` → `{key, num, label, quiz, bc}`; `apTocHtml(items)`. Ünite listesi için ayrı bir veri dosyası açılmaz; içerik ajanının yapacağı tek şey bugünkü başlık kalıbını korumaktır: anlatım `"Unit 7: <ad>"` (önünde "AP Physics 1 — " olabilir), istasyon `"Unit 7 <ad>: İnteraktif Soru İstasyonu"`. "BC ONLY" → "BC" etiketi. |
| T5 | **Etkin satır görünür kalır:** masaüstünde liste kendi alanında kaydırılır (pencere kaydırılmaz), etkin ünite/çip vurgulanır. |
| T6 | Sözleşme korunur: bağlantı sayısı = h2 sayısı (tasarim-test), telefonda liste kapalı başlar, bağlantı seçilince kapanır. |

## 3. Tel çerçeve

```
1280 px (yapışkan yan sütun 248 px)          360 px (içerik üstünde açılır liste)
İÇİNDEKİLER · 10 ÜNİTE                        ┌ İçindekiler · 10 ünite        ˄ ┐
 Sınav yönergesi                              │ Sınav yönergesi                  │
 Kritik formüller                             │ …                                │
 …                                            │ ÜNİTELER                         │
 ÜNİTELER                                     │ [1] Limits and Continuity [Sorular]
 [1] Limits and Continuity        (Sorular)   │ [2] Differentiation       [Sorular]
 [2] Differentiation              (Sorular)   │ …  (liste en fazla 70vh, kayar)  │
 …                                            └──────────────────────────────────┘
 [9] Parametric… BC               (Sorular)   Çip dokunma hedefi ≥ 32 px (dar ekranda 6×10 dolgu)
 EK BÖLÜMLER
 Official FRQ Archive
```

## 4. Tur 14 sonrası beklenen satır sayıları
Calculus 21 (soru eklemesi satır eklemez) · Physics 14→15 · Chemistry 13→14 · Biology 11→12 (her biri yalnızca h2 kalıbı korunursa).

## 5. Diğer ekranlar
- Panelim / İlerleme ünite listeleri `apmeberra:quiz:v1` kayıtlarından ve quiz başlığından türetilir (sabit ünite sayısı yok); yeni ünite ilk açılışta görünür. Değişiklik gerekmez.
- Sınav bilgisi güncellemesi `sinavlar.html` kart şemasını değiştirmez (Tur 12 S6 isteğe bağlı alanları yeter).
- Ders sayfalarının sayfa içi "Ünite haritası" bölümleri (ap-physics "Ünite İlerleme Haritası", ap-chemistry "9 Temel Ünite Haritası") elle yazılmış HTML'dir; yeni ünite eklenince içerik ajanı orayı da güncellemelidir.

## 6. Test
- `araclar/testler/toc-birim-test.js` (yeni, Node, 19 kontrol): gerçek başlık biçimleri + Physics U7 / Chemistry U9 benzetimi, bağlantı = başlık, grup/çip/kaçış.
- `tasarim-test.js`: mevcut İçindekiler kontrolleri değişmeden geçer; erken tema betiği denetimi eklendi.

*Hazırlayan: Ajan 11 (Frontend & UX). Uygulandı: `assets/js/app.js` (apTocParse, apTocHtml, initDocToc), `assets/css/styles.css` (30.11 İçindekiler).*
