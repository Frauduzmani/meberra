# 1.23.0 İçerik yazım rehberi (konu anlatımı + MCQ)

Hedef: yalnız Meberra ile çalışan Türk bir lise öğrencisi (İngilizcesi B1–B2, sınava İngilizce girer) AP sınavından 4–5 alabilmeli.
Telif: **yalnız özgün içerik.** College Board'un yayımlanmış/gizli sınav sorularını ya da AP Classroom maddelerini kopyalama, yakın
yeniden yazma (paraphrase) da yapma. Herkese açık CED konularını ve sınav formatını (soru tipleri, zorluk, hesap makinesi kuralı) izle.

## 1. Konu anlatımı — `data/dersler/<ders>/unite-<n>.json`
Şema ve kurallar: `araclar/ders-veri-denetim.js` (oku). Örnek dosya: `data/dersler/calculus/unite-1.json` (kalite çıtası budur).
- Ünitenin **tüm CED konuları** (resmî İngilizce başlık + Türkçe başlık). BC'ye özgü konularda `"sadeceBC": true`.
- `hedefler` 2–4 (Türkçe) · `anlatim` sıfırdan öğretir, ≥1200 görünür karakter (hedef 2000–4000): Türkçe açıklama, her AP terimi
  İngilizcesiyle (**sürekli (continuous)**), tablolar, adım adım akıl yürütme, FRQ'da puan getiren ifade kalıpları (İngilizce).
- `ornekler` ≥2 (hedef 3) AP zorluğunda, her `cozum` ≥2 adım; konuya uygunsa en az biri FRQ "justify/explain" tarzı.
- `ipuclari` ≥3 (hesap makinesi kuralı, gerekçe ifadeleri, puanlayıcının aradığı) · `sikHatalar` ≥2 · `terimler` [{en,tr}].
- İzinli etiketler: p strong em b i u ul ol li br span div table thead tbody tr th td code sub sup h4 h5 blockquote figure figcaption hr small mark.
  İzinli sınıflar: kn-tanim, kn-kural, kn-dikkat, formul. style/img/script yok.
- Matematik: `\( … \)` satır içi, `\[ … \]` blok. JSON'da ters bölü `\\` yazılır. Matematik içinde `<` `>` yerine `\lt` `\gt`.
- Sınavda olmayan konu (ör. ε-δ) en çok tek cümle "ileri okuma".

## 2. Yeni MCQ — `araclar/yeni-sorular3/<kisa>-u<n>.json` (tam kayıt dizisi)
Şema: mevcut sorular (`server/tohum/soru-bankasi.json`) + denetleyici `araclar/yeni-soru-ekle.js` (satır ~30–190, oku).
- Her CED konusu **en az 8 aktif soru** (mevcut aktif + yeni) olacak şekilde ekle; zaten ≥8 olan konulara 2 zor soru ekle.
  Mevcutları say: `sayfa`, `kutu` ünitenin istasyonu, `durum: "aktif"`, `ek.cedKonu`'ya göre grupla.
- İstasyon alanları ünitenin mevcut sorularından birebir kopyalanır: tur "ders", sayfa, ders null, unite_no, unite, kutu, kutu_baslik, dizi.
  sira/numara herhangi (araç numaralar) · durum "taslak" · pasaj null.
- id: `<onek>_k_u<n>_<sıra>` (ör. calc_k_u2_1), benzersiz, `^[a-z0-9_]{3,60}$`.
- konu: "<CED no> <İngilizce konu adı>" · ek: {kavram, ipucu, sikHata, cedKonu: "2.4", hesapMakinesi: "gerekmez"|"yardımcı"|"gerekli", uretim: "1.23.0"}.
- kaynak: "AP-style original (CED Topic n.m)" · deneme_kodlari: dersin kodları (Calculus AB konuları ["calculus-ab","calculus-bc"],
  yalnız BC konuları ["calculus-bc"]; physics-1; chemistry; biology).
- Zorluk ≈ %25 kolay · %45 orta · %30 zor; zorlar gerçek AP zorluğunda (çok adımlı, tablo/grafik yorumlu, "hangisi doğru gerekçe" tipi).
- 4 şık A–D; doğru harf partide ≈ eşit dağılır; doğru şık sistematik olarak en uzun OLMAZ (istasyonda ≤%40 kuralı).
- aciklama: Türkçe adım adım çözüm (`$…$` MathJax, para `\$`) · genel_hatirlatma: ana fikir · hata_aciklamalari: HER yanlış harf için
  {etiket, aciklama} — çeldirici gerçek bir öğrenci hatasından gelir ve o hata adlandırılır.
- Kök tekrarı yok. Şekil gerekiyorsa `araclar/yeni-sorular2/SEKIL-BICIMI.md` (isteğe bağlı; HTML tablo tercih edilir).

## 3. Kendi denetimin (bitirmeden önce)
1. Her soruyu ikinci kez bağımsız çöz; sayısal cevapları node ile doğrula; uyuşmazlığı düzelt.
2. `node araclar/ders-veri-denetim.js` → 0 sorun.
3. `node araclar/yeni-soru-ekle.js --girdi araclar/yeni-sorular3/<dosya>.json --uretim 1.23.0 --kuru` → 0 hata. **--kuru olmadan çalıştırma.**
4. Başka hiçbir dosyayı değiştirme (soru bankası, dizin.json, sayfalar dahil).
Rapor: konu sayısı ve ortalama anlatım uzunluğu, konu başına yeni/toplam soru, zorluk ve doğru harf dağılımı, emin olmadığın soru id'leri.
