# Fizik taslak onay raporu (AP Physics 1 + CEnT-S)

Kapsam: `soru-bankasi.json` içindeki taslaklar (ap-physics 40, sinav-cents 15) ve `frq.json` içindeki Physics 1 FRQ taslakları (5). Toplam 60 öğe.

Yöntem: Her soru, anahtara ve rubriğe bakmadan önce baştan çözüldü; sayısal sonuçlar node ile doğrulandı. Ayrıca şunlar denetlendi: hata açıklamalarının şık değerlerini doğru üretmesi, LaTeX'te `$` ve süslü parantez dengesi, aktif bankayla benzerlik (normalize gövde + 3-gram Jaccard), CED 2024-25 konu eşlemesi ve FRQ puan toplamları.

## Sayılar

| Karar | Adet |
|---|---|
| onay | 56 |
| duzelt | 3 |
| red | 1 |

- 55 çoktan seçmeli sorunun 55'inde bağımsız cevabım anahtarla aynı çıktı. Anahtar değişikliği yok.
- 5 FRQ'nun 5'inde model çözümler doğru, puan toplamları tutuyor (10, 12, 10, 8, 10).

## Düzeltilecekler (duzelt)

1. **phys_y_u1_1**: B şıkkının hata etiketinde fazladan ters eğik çizgi var (`velocity\'yi`). Ekranda ters eğik çizgiyle görünür. Yeni değer: "Speed ile velocity'yi karıştırmak."
2. **phys_y_u8_19**: D şıkkının hata açıklaması "basınç farkı topları birbirine doğru **çeker**" diyor. Basınç iter, çekmez; sorunun kendi genel hatırlatması da "iter" diyor. Bu kelime "iter" olarak düzeltildi.
3. **frq-phys1-3, (c) şıkkı**: Rubrik eğimin "veri noktalarından değil, doğru üzerindeki noktalardan" alınmasını istiyor, ama model çözüm eğimi uçtaki iki veri noktasından alıyor. Model çözüm, aynı değerleri en iyi doğru üzerindeki noktalar olarak verecek biçimde yeniden yazıldı (regresyon doğrusu bu noktalardan geçiyor; eğim 1.578 s²/kg, k ≈ 25 N/m). Sonuç değişmiyor.

## Reddedilen (red)

- **cents_y_9**: Anahtar doğru (0.50 m/s), ancak soru aktif bankadaki **phys_mom_q7** sorusunun neredeyse kopyası. İkisinde de aynı 60 kg patenci, aynı 3.0 kg top ve aynı kurgu var; yalnız hız 8.0 m/s yerine 10 m/s. Çeldiriciler de aynı mantıkla kurulmuş. Farklı bir geri tepme kurgusuyla yeniden yazılmalı.

## Notlar

- Unit 8 (Akışkanlar) soruları 2024-25 CED'deki 8.1–8.4 konularıyla örtüşüyor. Ünite 1–5 soruları da etiketlendikleri CED konularıyla uyumlu.
- CEnT-S dalga soruları (y_14, y_15), sitenin kendi CEnT-S formül sayfasındaki "Waves" kapsamıyla tutarlı.
- Bilinen College Board sorularının kopyası bulunmadı (kurgular genel ders kitabı kalıpları).
