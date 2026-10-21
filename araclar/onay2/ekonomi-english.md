# 1.14.0 Ekonomi + English taslakları: bağımsız denetim ve birleştirme

Girdi: `araclar/yeni-sorular2/ekonomi-english.json` (85 taslak: 55 Micro/Macro + 30 English, 4 pasaj).
Kararlar: `araclar/onay2/ekonomi-english.json` (`{ id, karar, neden, duzeltme?, kontrol }`).
Uygulama aracı: `node araclar/onay2-uygula.js [--kuru]`. Araç düzeltmeleri uygular, ardından `araclar/yeni-soru-ekle.js` doğrulama ve ekleme mantığını bu dosya için (`URETIM = "1.14.0"`) çalıştırır, en son eklenenleri `aktif` yapar ve `ek.onay` yazar. Araç idempotenttir: ikinci çalıştırmada değişiklik olmaz.
Sahip yetkisiyle verilen onay: `ek.onay = { tarih: "2026-10-21", kaynak: "bağımsız denetim (sahip yetkisiyle)" }`.

## Sonuç: 45 onay · 37 düzelt · 3 ret

**Bağımsız çözüm:** 85 sorunun hepsi anahtara bakılmadan, yalnızca kök ve şıklarla baştan çözüldü. **85/85 anahtarla aynı.** Hiçbir anahtar değiştirilmedi.

### Reddedilenler (bankaya eklenmedi)
| Kimlik | Neden |
|---|---|
| `micro_y2_4_3` | Aktif `econ_q9` ile neredeyse aynı: simetrik mahkûmlar ikilemi, (50, 50), baskın strateji Low, Nash dengesi sorusu. `econ_mi4d` de Alfa/Beta oyunu. |
| `micro_y2_5_1` | Aktif `econ_mi5a` ile neredeyse birebir: aynı MP dizisi 10-8-6-4-2, P = \$5, yalnızca ücret 25 yerine 22, cevap yine 3 işçi. |
| `macro_y2_4_2` | Aktif `econ_ma4a` ile aynı kurgu: %7 nominal faizle bir yıllık kredide gerçekleşen reel faiz, yalnızca enflasyon sayıları farklı. |

### İçerik düzeltmeleri
- `micro_y2_3_5`: **D şıkkı yanlış gerekçeliydi.** \$65,000 sonucu yalnızca kira düşülünce çıkar, şık ise "only the forgone salary" diyordu (o hesap C şıkkı). Şık "forgone rent" olarak düzeltildi. Ayrıca `econ_mi3c` ile aynı ad ve kurgu ayrışsın diye "Selin" adı "Ayla" yapıldı.
- `micro_y2_2_3`: B hata açıklamasında terim hatası vardı. "talebin tam esnek olmaması" ifadesi "talebin tam esneksiz (perfectly inelastic) olması" olarak düzeltildi.
- `macro_y2_2_3`: Köke "She is actively looking for work" eklendi. Böylece "not in the labor force" çeldiricisi kesin olarak yanlış oldu ve C hata açıklamasıyla tutarlı hâle geldi.
- `micro_y2_1_3`: "Deniz" adı "Ece" yapıldı, çünkü aktif `micro_y_1_4` de "Deniz + konser" kurgusunu kullanıyor. Kavramlar farklı: biri batık maliyet, diğeri fırsat maliyeti.

### "Doğru şık en uzun" sızıntısı (33 soru, yalnızca şık metni; anahtar sabit)
Taslakta English sorularının 22/30'unda, Ekonomi sorularının 10/52'sinde doğru şık en uzun şıktı. Bazılarında doğru şık diğerlerinin 1,3–2,3 katı uzunluktaydı.
Bu sızıntı iki yolla giderildi: çeldiriciler makul ve yine yanlış kalacak biçimde uzatıldı, aşırı uzun doğru şıklar kısaltıldı. Her değişiklikte hata açıklamalarının hâlâ geçerli olduğu denetlendi.
**Sonuç:** doğru şık English'te 2/30, Ekonomi'de 6/52 soruda en uzun kaldı. Kalanların hiçbirinde doğru şık en yakın şıktan %25'ten fazla uzun değil.

### Diğer denetimler
- Aktif bankayla tekrar: normalleştirilmiş kök ve kök + şık özetinde 0 tekrar. Anahtar kelime taramasıyla yakın tekrarlar ayrıca elle incelendi; yukarıdaki 3 ret bu incelemeden çıktı.
  `macro_y2_2_4` (`econ_q14`) ve `macro_y2_4_3` (`econ_q17`) farklı beceriyi ölçtüğü için korundu.
- College Board yayımlanmış sorusu kopyası bulunmadı. Bütün senaryolar ve sayılar özgün; kaynak alanı "AP-style original (CED Topic …)".
- CED terminolojisi (MES, shutdown, MRP = MRC, LRPC, crowding out, loanable funds, M1) ve Türkçe açıklamalardaki hesaplar tek tek doğrulandı.
- English: pasaj olguları ve cümle numaraları kontrol edildi. `w7_5` hesabı doğru: 416 × 60 × 30 = 748,800 > 600,000. `w8_2` için 2015 − 2008 = 7.

## Bankaya etkisi
- `server/tohum/soru-bankasi.json`: +82 soru, hepsi `aktif`; tohum `surum` 4 → 5. Mevcut veritabanları açılışta `tohumEsitle` ile alır.
- `server/tohum/deneme-meta.json`: +4 pasaj `{ baslik, html }` (Passage 7–8, Draft 7–8; 1.11.0 kuralı).
- Aktif toplamlar (önce → sonra):

| Ünite | Aktif | Ünite | Aktif |
|---|---|---|---|
| Micro 1 | 5 → 9 | Macro 1 | 5 → 6 |
| Micro 2 | 9 → 15 | Macro 2 | 4 → 10 |
| Micro 3 | 6 → 16 | Macro 3 | 14 → 15 |
| Micro 4 | 7 → 11 | Macro 4 | 7 → 13 |
| Micro 5 | 5 → 7 | Macro 5 | 7 → 16 |
| Micro 6 | 7 → 9 | Macro 6 | 6 → 7 |
| **Micro** | **39 → 67** | **Macro** | **43 → 67** |

English Language (`english-language`): 56 → **86** aktif.

## Tam sınav
`server/tamsinav.js` `planKur` gerçek plan (`sinav-formatlari.json`) ve aktif havuzla çalıştırıldı:
- microeconomics: **60/60 MCQ**, yetersiz yok, kota eksiği 0
- macroeconomics: **60/60 MCQ**, yetersiz yok, kota eksiği 0
- english-language: 45/45 MCQ

## Doğrulama
- `node araclar/pm-denetim.js`: **0 sorun** (aktif 1431 · arşiv 11, taslak 0, 0 aktif tekrar grubu).
- `araclar/testler/*-birim-test.js`: 24/25 geçti. Kalan `ek-birim-test.js` "ders sayfası: doğru ve yanlış geri bildirim kutusunda ek satırları", `assets/js/app.js` üzerinde statik bir kontrol. Başka ajanların süren `app.js` çalışmasıyla ilgili, bu işle ilgisi yok.
- `npm test`: 184/185 geçti. Kalan `adresler.test.js` "sayfalarda göreli varlık…", `index.html` dönüştürücü farkı. Başka ajanların süren sayfa çalışmasıyla ilgili, bu işle ilgisi yok.
- Güncellenen test beklentileri:
  - `server/test/soru-bankasi.test.js`: ders aktif 1195 → 1277, ders toplam 1206 → 1288, deneme kataloğu 1189 → 1271
  - `server/test/icerik-guncelleme.test.js`: 1.11.0 sonrası üretimler (`SONRAKI`) 1.10.0 taklidinden ve sayımlardan çıkarıldı

## Arayüz notu (bu işin kapsamı dışında)
`ap-english.html` pasaj kartları HTML'den okunur. Passage 7–8 ve Draft 7–8 kartları sayfaya eklenmeden `deneme-bankasi-olustur.js` çalıştırılırsa bu pasajlar meta'dan düşer (bkz. `yeni-sorular/BIRLESTIRME.md`).
