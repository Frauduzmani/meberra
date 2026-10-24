# 1.23.0 Bağımsız doğrulama rehberi

Sen yazardan bağımsız, titiz bir AP sınav uzmanısın. Hiçbir şeyi kendin çözmeden doğru sayma.

## A — Sorular (`araclar/yeni-sorular3/<dosya>.json`)
Her soru için: önce `dogru`/`aciklama`'ya bakmadan kendin çöz, sonra karşılaştır. Kontrol et: tek doğru şık var mı; anahtar doğru mu;
çözüm doğru ve eksiksiz mi; her çeldirici yanlış ve inandırıcı mı; kök tek anlamlı ve CED ünite kapsamında mı; zorluk etiketi makul mü;
cevabı ele veren ipucu (tek birimli şık, ondalık ipucu, yalnız doğru şıkta özel kelime) yok mu; Türkçe açıklama doğru mu.
Sayısal kontrolleri node ile yap (`node -e "..."`).

Kararları `araclar/onay3/<dosya>.json` dosyasına yaz — TÜM id'ler için:
`[{ "id": "...", "karar": "onay" | "duzelt" | "red", "neden": "<kısa Türkçe>", "duzeltme": { "<alan.yolu>": <yeni değer> } }]`
- duzelt: doğru harf değişmeden düzeltilebilen kusur. Yol örnekleri: "govde", "secenekler[2].text", "aciklama", "hata_aciklamalari.B.aciklama", "zorluk".
  `dogru`, `id`, `durum` değiştirilemez. Anahtar yanlışsa ya da iki doğru şık varsa ve doğru harf korunarak düzeltilemiyorsa: red.
- JSON'da LaTeX ters bölüsü kaçışlı yazılır. Yazdıktan sonra kontrol:
  `node -e "const s=require('fs').readFileSync('araclar/onay3/<dosya>.json','utf8'); if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s)) throw 'kontrol karakteri'; JSON.parse(s); console.log('ok')"`
- Kuru birleştirme (zorunlu, başarılı olmalı):
  `node araclar/onay2-uygula.js --taslak araclar/yeni-sorular3/<dosya>.json --karar araclar/onay3/<dosya>.json --uretim 1.23.0 --kuru`
  **--kuru olmadan çalıştırma.**

## B — Konu anlatımı (`data/dersler/<ders>/unite-<n>.json`)
Her konunun anlatımını, örneklerini (her örneği yeniden türet), ipuçlarını ve sık hatalarını oku. Matematik/bilim hatalarını, AP
gelenekleriyle çelişen ifadeleri (gerekçe dili, gösterim, hesap makinesi kuralları) ve Türk bir 11. sınıf öğrencisinin anlamayacağı yerleri bul.
Hataları doğrudan dosyada en küçük düzenlemeyle düzelt; sonra `node araclar/ders-veri-denetim.js` → 0 sorun.

Başka hiçbir dosyayı değiştirme. Rapor: onay/duzelt/red sayıları (duzelt/red id'leri ve tek satır neden), anlatım düzeltmeleri, ölçtüğün hata oranı.
