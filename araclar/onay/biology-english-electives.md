# Onay Raporu: AP Biology, AP English Language, AP Electives (Macro, Micro, CS A)

Tarih: 2026-10-21. Yöntem: Her maddeyi önce anahtara/rubriğe bakmadan çözdüm, sonra karşılaştırdım. Java kodlarını elle izledim, FRQ çözümlerini JS'e çevirip test ettim. Aktif bankayla benzerlik taraması yaptım.

## Sayılar

| Ders | Tür | Toplam | Onay | Düzelt | Red |
|---|---|---|---|---|---|
| AP Biology | Soru | 22 | 22 | 0 | 0 |
| AP Macroeconomics | Soru | 10 | 10 | 0 | 0 |
| AP Microeconomics | Soru | 8 | 7 | 0 | 1 |
| AP CS A | Soru | 11 | 10 | 1 | 0 |
| AP English Language | Soru | 15 | 14 | 1 | 0 |
| AP Biology | FRQ | 5 | 5 | 0 | 0 |
| AP English Language | FRQ | 3 | 3 | 0 | 0 |
| AP Macroeconomics | FRQ | 2 | 2 | 0 | 0 |
| AP Microeconomics | FRQ | 2 | 2 | 0 | 0 |
| AP CS A | FRQ | 4 | 3 | 1 | 0 |
| **Toplam** | | **82** | **78** | **3** | **1** |

Bağımsız cevaplarım 66 sorunun 66'sında anahtarla eşleşti. Hiçbir anahtar değiştirilmedi. FRQ rubrik toplamları hem parça bazında hem toplamda tutarlı. English rubrikleri 1/4/1 = 6. Passage 4–6 ve FRQ kaynakları özgün ve tutarlı.

## Red

- **micro_y_1_1**: İçerik doğru (cevap 30 birim buğday). Ancak aktif `econ_ma1a` ile neredeyse aynı: aynı PPC tablosu (0/100, 10/90, 20/70, 30/40, 40/0) ve aynı C→D geçişi kullanılıyor. Tek fark, birinin toplam maliyeti, diğerinin birim başına maliyeti sorması. Soru farklı verilerle yeniden üretilmeli.

## Düzelt

- **csa_y_4_1**: Anahtar doğru (21). `Scanner.hasNextInt()` 2025-26 AP CSA Java Quick Reference'ta yer almıyor; orada yalnızca `hasNext()` var. Kodda, konu başlığında, açıklamada ve genel hatırlatmada `hasNext()` kullanılmalı. Dosyada yalnızca tam sayı olduğu için davranış ve cevap değişmez.
- **eng_y_r_7**: Anahtar doğru. C hata açıklamasında dil bilgisi hatası var: "kendi şehre" yerine "kendi şehrine" olmalı.
- **frq-csa-4**:
  - (1) Part (b)'deki "Using the example array" ifadesi belirsiz. Part (a)'daki örnek çağrılardan sonra sütun 5 de dolar ve cevap 2 yerine 3 olur. Metinde orijinal dizinin kastedildiği açıkça yazılmalı.
  - (2) (b) rubriğinin ilk ölçütü yalnızca sütun öncelikli dolaşımı kabul ediyor. Satır öncelikli ama doğru çalışan çözümler de puan alabilmeli.

## Notlar (onaylanan maddeler)

- csa_y_4_2 (nextInt/nextLine karışımı) CED 4.6 kapsamında ve izleme doğru.
- bio_y_8_15, Paine'in bilinen deniz yıldızı deneyinden esinleniyor. Bilimsel bir çalışmaya dayanıyor ama bir College Board sorusunun kopyası değil.
- Diğer yüksek benzerlik eşleşmeleri (ör. csa_y_4_7 ile csa_d2, macro_y_3_9 ile econ_q16) yalnızca aynı soru biçiminden kaynaklanıyor. Veriler ve cevaplar farklı.
