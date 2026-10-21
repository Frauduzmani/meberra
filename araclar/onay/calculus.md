# AP Calculus taslak inceleme (bağımsız onay)

Kapsam: 63 taslak çoktan seçmeli soru (ek.uretim 1.11.0) ve 6 FRQ (AB 4, BC 2).

Yöntem: Her soru önce anahtara bakmadan çözüldü, sonra anahtar, çeldirici değerleri ve hata açıklamalarıyla karşılaştırıldı. Hesap makinesi gerektiren tüm değerler (kökler, integraller, türevler) node ile sayısal olarak doğrulandı. Gövdeler aktif bankayla karşılaştırıldı: normalize edilmiş metin, Jaccard benzerliği ve ayırt edici ifadeler arandı.

## Sayılar

| Karar | Soru | FRQ | Toplam |
|---|---|---|---|
| onay | 56 | 6 | 62 |
| duzelt | 1 | 0 | 1 |
| red | 6 | 0 | 6 |

Anahtar eşleşmesi: 63/63 soruda bağımsız cevap anahtarla aynı; 6/6 FRQ model çözümü ve rubrik puanları doğru. Hiçbir anahtar değiştirilmedi.

## Red (tekrar)

- **calc_y_u2_4**: Neredeyse tekrar: aktif calc_u2_q9 "x^3 on [1,3] average rate of change"; taslak yalnızca -2x ekliyor (cevap 13→11; C şıkkı 13 aktif sorunun cevabı). Matematik doğru (anahtar D doğru).
- **calc_y_u2_6**: Aktif calc_u2_q1 ile birebir aynı soru (lim (cos(π/3+h)-1/2)/h). Tekrar. Matematik doğru (anahtar A doğru).
- **calc_y_u3_4**: Aktif sv_calcab_u3_3 ile birebir aynı (f=x^3+2x+1, g'(4)). Tekrar. Matematik doğru (anahtar B doğru).
- **calc_y_u5_1**: Aktif sv_calcab_u5_2 ile birebir aynı (x^3-3x, [0,3], MVT). Tekrar. Matematik doğru (anahtar C doğru).
- **calc_y_u5_4**: Neredeyse tekrar: aktif sv_calcbc_u5_2 aynı kübik (2x^3-3x^2-12x+1) ve aynı [-2,3] aralığı (yalnız max/min farkı); calc_u5_q2 de aynı kübik. Kritik noktalar ve aday tablosu aynı. Matematik doğru (anahtar A doğru).
- **calc_y_u8_1**: Aktif calc_u8_q22 ile birebir aynı (y=x^2, y=4, y=4 etrafında). Tekrar. Matematik doğru (anahtar C doğru).

## Düzelt

- **calc_y_u5_14**: Anahtar doğru. Açıklamada işaret testi f'(-1) kullanıyor; x=-1 verilen açık aralık (-1<x<5) dışında. Aralık içi bir test noktasıyla değiştirildi: f'(-0.9)=0.81-2^{-0.9}≈0.27>0.

## Notlar (karar değiştirmeyen)

- calc_y_u8_2 ve calc_y_u8_3 aynı bölgeyi kullanıyor; eşli set olarak kabul edildi.
- Bazı şıklarda Unicode eksi (−) var, aktif bankada çoğunlukla "-" kullanılıyor; yalnızca biçim farkı.
- College Board yayımlanmış sorularının yakın kopyası bulunmadı. Gölge/fener, nehir kenarı çit ve disk yöntemi standart ders kitabı kalıplarıdır.
