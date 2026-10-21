# AP Chemistry taslak inceleme raporu

Kapsam: `soru-bankasi.json` içindeki 45 taslak soru (sayfa `ap-chemistry`) ve `frq.json` içindeki 5 taslak Chemistry FRQ.
Her madde, anahtar görülmeden önce bağımsız olarak çözüldü; sayısal sonuçlar node ile doğrulandı.

## Sayılar

| Tür | Onay | Düzelt | Red |
|---|---|---|---|
| Soru (45) | 44 | 0 | 1 |
| FRQ (5) | 5 | 0 | 0 |
| **Toplam (50)** | **49** | **0** | **1** |

Bağımsız çözümlerin 45'i de anahtarla eşleşti. Doğru şık dağılımı dengeli: A 11, B 11, C 11, D 12. Her soruda dört farklı seçenek var ve hata açıklamaları her yanlış şıkkı karşılıyor. Tablolar ve `$` sınırlayıcıları dengeli.

## Red

- **chem_y_u7_2** (7.13 pH ve çözünürlük): Kimyası doğru (cevap C). Ancak aktif **chem_u7_q25** ile neredeyse aynı soru: AgCl ve CaF₂'nin doymuş çözeltileri HNO₃ ile asitlendiriliyor. Doğru cevap ve gerekçe (H⁺ + F⁻ → HF, Q_sp < K_sp) aynı. AgCl çeldiricisi de (H⁺ + Cl⁻ → HCl) birebir aynı. Tekrar olduğu için reddedildi.

## Düzelt

Yok.

## Notlar (onaylandı, bilgi için)

- **chem_y_u3_1**: Aynı üç bileşik aktif sv_chem_u3_1'de de var. Ancak burada sıralama isteniyor ve eter > propan ayrımı ek beceri ölçtüğü için tekrar sayılmadı.
- **chem_y_u6_1**: Aktif chem_u5_q16 ile aynı kalıpta, ama sayılar farklı ve ek olarak ΔH soruluyor. Varyant olarak kabul edildi.
- **chem_y_u1_1 ve chem_y_u1_4**: İkisi de aynı kavramı (3p elektronunun 3s tarafından perdelenmesi) ölçüyor; biri PES, diğeri IE verisiyle.
- **frq-chem-3 (e)**: Eşdeğerlik pH'ı tam hesapta 8.745 çıkıyor. Yuvarlanmış K_b = 5.6×10⁻¹⁰ ile 8.75 bulunur; rubrikteki "≈ 8.74" ifadesi her ikisini de kapsar.
- **frq-chem-2 (e)**: Yaklaşıklıkla x = 0.010 M, tam çözümle 0.0097 M bulunur. Rubrik ikisini de kabul ediyor.
