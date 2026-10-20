# Tur 9 — İçerik Turu Ortak Brifingi (PM, 13 Ekim 2026)

Kullanıcı "proje.md" dedi. AGENTS.md Kural 14 gereği ajanlar `proje.md` §14.2 backlog'undaki sıradaki üniteleri devralır. Her ajan YALNIZCA kendisine verilen ders dosyasında (ve o dersin `data/sorular/seviye/*.js` dosyasında) çalışır.

## Önce oku
1. `.claude/agents/icerik-deneme-sorumlusu.md`: Ajan 12'nin tur döngüsü; uyulacak süreç bu.
2. `.agents/rules/icerik-kurallari.md`: soru şeması ve biçim kuralları; harfiyen uyulur.
3. `AGENTS.md` §2.1: PM Doğruluk Kapısı.
4. Kendi ders dosyanın mevcut ünite yapısı: içindekiler (`.doc-toc`), konu anlatımı bölümleri, soru istasyonu bölümleri, `initInteractiveQuiz` mount satırları.

## Tasarım sistemi v3 (Tur 7) — yeni HTML bu dile uymalı
- **Satır içi stil yasak:** `style="..."` kullanma. Mevcut sınıfları kullan: `surface`, `panel-title`, `u-*` yardımcıları, `alert`, `card-badge` vb. En yakın mevcut ünite bölümünü KOPYALAYIP uyarla.
- **Emoji yok:** Arayüz metninde emoji kullanma.
- **İçindekiler:** Yeni ünite bölümünün başlığında `id` olsun. İçindekiler otomatik üretiliyorsa başlık sınıfını mevcut ünitelerle aynı tut; elle üretiliyorsa yeni üniteyi ekle.
- **Proje adı:** AP MEBERRA. Öğrenci adı gerekiyorsa "Meberra". Eski adı ("AP AZRA", "Azra") yazma.

## Doğruluk (PM kapısı)
- **Bağımsız hesap:** Her sayısal cevabı node ya da Python ile bağımsız hesapla. Python'u proje DIŞINDAN çalıştır: `C:\Users\hp\AppData\Local\Programs\Python\Python311\python.exe`; sympy kurulu.
- **Şıklar:**
  - Her soruda tek doğru şık olmalı.
  - A–D konumları dengeli dağılmalı.
  - Doğru şık sistematik olarak en uzun şık olmamalı.
  - Her çeldirici gerçek bir öğrenci hatasını temsil etmeli.
- **Kaynak alanı (`source`):** `"AP-style original (CED Topic x.y)"`. "Official", "Past Exam" ve "College Board Exam" ifadeleri YASAK.
- **CED:** Güncel CED ünite ve konu numaralarını kullan. Gerekirse AP Central'dan kontrol et.
- **Java (CS A):** `javac` yok. CS A soruları Java semantiğine sadık bir Python çevirisiyle doğrulanır.

## Senkronizasyon
- Dersin `data/sorular/seviye/<ders>.js` dosyasında yeni ünite için `portaldaVar: true` ve `portalCapa: "<bölüm-id>"` güncellenir. pm-denetim bunu kontrol eder.
- `data/sorular/deneme-bankasi.js` dosyasını SEN ÜRETME. Tüm ajanlar bitince PM bir kez yeniden üretecek.
- `proje.md` ve `DEVAM-NOKTASI.md` dosyalarına DOKUNMA; kaydı PM tutar. Raporunda `proje.md`'ye girecek 3–5 satırlık özeti ver.

## Son kontrol (teslimden önce)
1. Dosyanın yedeğini başlamadan önce scratchpad'e al: `C:\Users\hp\AppData\Local\Temp\claude\C--Users-hp-Desktop-projelerim-AP-AZRA\ebd20cac-f1cf-458b-86b3-37d377e101b2\scratchpad\yedek-tur9\`.
2. `node araclar/pm-denetim.js` 0 sorun vermeli. Başka bir ajanın dosyasından gelen sorun varsa yalnızca raporla, düzeltme.
3. `node araclar/ad-denetimi.js` 0 sorun vermeli.
4. Inline script'leri node `vm` ile çalıştırarak ayrıştır.
5. Mümkünse sayfayı headless tarayıcıda aç ve konsol hatası olmadığını, yeni soruların çizildiğini doğrula. Kurulum: `...\scratchpad\regresyon\testler`. node_modules orada; oturum için `require('./oturum-tohum')(ctx)` kullan.

## Rapor (Türkçe, kısa)
- Eklenen ve genişletilen soru sayıları, id aralıklarıyla
- Ünite başına toplam
- Doğrulama yöntemi; örnek 3 soru için bağımsız hesap çıktısı
- pm-denetim satırı
- `proje.md` için 3–5 satırlık özet
