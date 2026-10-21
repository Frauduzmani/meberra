# İçerik kararları (sahip adına, 2026-10-21)

Sahip, `UYGULAMA.md` › "İnsan incelemesi gerekenler" listesindeki kararları ve taslak soruların onayını bize bıraktı.
Aşağıdaki kararlar uygulanır; her biri denetim kaydına ve bu dosyaya işlenir.

## Ürün kararları
1. **Physics C:** Sayfa ve tanıtım metinleri "AP Physics 1" olarak düzeltilir; Physics C vaadi kaldırılır. Calculus gerektiren 5 soru
   (`phys_u2_q7`, `phys_u1_q6`, `phys_wep_q16`, `phys_wep_q21`, `phys_mom_q21`) silinmez: konu etiketine "Physics C · ileri" yazılır,
   `deneme_kodlari`'ndan Physics 1 denemesi çıkarılır, ek.ileri = true (ünite içinde "İleri düzey" rozetiyle kalır).
2. **calc_u6_q32:** Çözüm AB tekniği istiyor → konu AB 6.10 olarak etiketlenir, "[BC ONLY]" eklenmez.
3. **Kimya konu etiketleri (21 soru):** `ek.cedKonu`'daki güncel CED numarası `konu` alanına taşınır (güncel AP Chemistry CED: 2.3 Structure of Ionic Solids,
   7.13/7.14, 9.6–9.10 numaraları doğru).
4. **Gerekçesiz zorluk önerileri (121):** Uygulanır. Bağımsız denetçi her soruyu çözerek değerlendirdi; mevcut "hard" oranı (%30) gerçekçi değil ve
   puan tahminini bozuyor. Değişiklikler geçmişe yazılır.
5. **Seviye hesap makinesi bayrakları (6):** Değiştirilmez ("yardımcı" ≠ "gerekli").
6. **calc_u7_q1 (t / T şıkları):** Yönetici formundaki "aynı metinli şık" kontrolü büyük/küçük harfe duyarlı yapılır (şıklar bilinçli olarak yalnız harfle ayrılıyor).

## Yeniden yazılacaklar (yeni kök + şıklar + çözüm + her yanlış şık için açıklama; bağımsız çözümle doğrulanır)
- Seviye testi tekrarları (9): `sv_calcab_u3_2` (x² − xy + y² = 7, (−1, 2)), `sv_calcab_u4_3` ((e^{3x} − 1 − 3x)/x² = 9/2),
  `sv_calcbc_u3_2` (x² + y² = 169, (5, 12)), `sv_calcbc_u6_3` (∫₃⁴ 2/(x² − 4) dx), `sv_chem_u1_2` (Be/B ya da Mg/Al anomalisi),
  `sv_chem_u6_2` (NH₃ sentezi bağ entalpisi), `sv_chem_u9_1` (farklı dört süreç), `sv_bio_u1_3` (%28 A), `sv_bio_u4_2` (farklı sayılar).
  Kimlik aynı kalır (geçmiş korunur), içerik yenilenir.
- `calc_u4_q14`: (x − sin x)/x³ = 1/6 ile yeniden.
- `bio_u1_q7`: Ünite 1 (CED 1.x) için yeni makromolekül sorusu.
- `phys_u3_q3`: C çeldiricisi tanımlı bir hataya göre yeniden yazılır.
- `chem_u1_q6`: D çeldiricisi anlamlı bir hatayla yeniden yazılır.
- `chem_u2_q3`: Lewis yapıları ortaklanmamış çift sayılarıyla açıkça yazılır (SVG gerekmeden).
- `eng_write_q15`, `eng_write_q18`: Kök, AP Lang'e uygun retorik amaç/etki sorusu olarak yeniden çerçevelenir.
- `eng_read_q12`: Pasaj başlığı nötrleştirilir: "From an address on communication in engineering".
- `eng_read_q16`: Değişmez (anahtar doğru; şık sırası anahtarı değiştirirdi).
- `calc_u5_q3`: Grafik sözel betimle kalır; SVG çizimli soru altyapısı gelince eklenir.

## Taslak onayı
229 taslak soru ve 32 FRQ, yazan ekipten bağımsız denetçilerin (`araclar/onay/*.json`) kararına göre:
`onay` → aktif · `duzelt` → düzeltilip aktif · `red` → arşiv (neden notuyla).
