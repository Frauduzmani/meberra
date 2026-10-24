# AP MEBERRA — Devam Noktası (son kayıt: 20 Ekim 2026, Tur 14, sürüm v14.10 — ekran planı 7/7 tamam, paket yenilendi)

> Yeni oturumda önce bu dosyayı okuyun. Asıl kayıt `proje.md`'dir: en üstteki **★ GÜNCEL DURUM** bölümü projenin son halini, §29 Tur 13 ayrıntısını (§29.4 kayıt düzeltmesi), §28.9 sıradaki işleri verir (§28 Tur 12, §27 Tur 11). Sonra:
> - `HARITA.md` (klasör yapısı ve sayfa → veri haritası)
> - `.agents/rules/tur11-ekran-plani.md` ve `tur12-ekran-plani.md` (ekran planları, veri sözleşmesi)
> - `SURUMLER.md` (sürüm listesi)
>
> **Kalıcı kurallar (kullanıcı talimatı):** (1) Her geliştirme `proje.md`'ye gerçek sayılarla işlenir ve "★ GÜNCEL DURUM" güncellenir. (2) Her eklemede sürüm arşivi: `node araclar/surum-arsivle.js --not "..."`. (3) Her eklemede Ajan 11 ekranı baştan planlar. (AGENTS.md §2.1 md. 6–8)

## Şu anki durum (Tur 14, 20 Ekim 2026 — v14.10)

**Tur 14 (`proje.md` §30):** Calculus +18 (241), Physics 1 U7, Biology U7, Chemistry U9 (9/9) → portal 977 soru, havuz 971. Yeni **Ajan 14 `eposta-uzmani`**: `data/kocluk/ilk-basvuru-sablonlari.js` (36 şablon) + `eposta.js` 1.1.0 `ilkBasvuruHazirla()` (arayüz henüz yok → A5). Ajan 11: İçindekiler, FRQ yedek birleştirme, tema, CSS. **Öğrenci odaklı ekran planı onaylandı** (`.agents/rules/tur14-ogrenci-odakli-ekran-plani.md`, A1–A7, her aşama v14.x). **v14.1:** Ajan 13 aktarıldı (proje.md §30.5): sınav Doğrulandı 35/47, Doğrulanamadı 0; kaynaklı taslak alıcısı 15, kaynaksız 0; ilk-20 Doğrulanamadı hücresi 0; lisans 610 · YL 409+46. **v14.2–v14.4 (§30.8):** A1 5 öğeli menü (Bugün · Hedefim · Çalış · Başvuru · Ben), A2 telefonda alt gezinme (≤ 760 px), A3 Bugün ekranı (Sıradaki adım, Yaklaşan 3 tarih, Devam et); yeni `bugun-birim-test`. Kayıt: `.agents/rules/tur14-asama-kayitlari.md`. **v14.5–v14.7 (§30.10):** A4 Hedefim (sekme çubuğu, kartta İlk e-posta / Listeme ekle), A5 Başvuru üç sekme + İlk e-posta arayüzü + Son tarihler (K14-5), v14.7 Ajan 13 aktarımı (CEnT-S, Physics 2 geç sipariş, Groningen). **v14.8–v14.9 (§30.11):** A6 Çalış merkezi `calis.html`, A7 Yanlışlarım modu `deneme.html?mod=yanlislar` → ekran planı tamamlandı. **v14.10 (§30.12):** eposta.js 1.1.1 (yönerge kodları öğrenciden gizlendi, profil çapaları), paket `sunum/AP-MEBERRA-Sunum-2026-10-20.zip` (26,1 MB) yeniden üretildi.
Testler: 13 Node birim + 20 tarayıcı (yeni ilk-eposta, yanlislar) geçti; tarayıcı testlerini bellek nedeniyle sırayla çalıştırın (paket testleri v14.0'da; paket A7 sonunda yeniden üretilecek). Paket `sunum/AP-MEBERRA-Sunum-2026-10-20.zip`.

### Önceki: Tur 13 sonu

**Tur 13 (17 Ekim):** üniversite kartlarında dil + bilim sınavı isterleri ve açılır ders istasyonu (Konu Anlatımı + `deneme.html?ders=...`), `assets/js/universite-isterleri.js`, `universite-ister-test.js`; QS sütunu "QS Dünya Sırası", 108 `=` (eşitlik) işareti temizlendi. Arşiv v12.1 + v12.2 (v13.0 yok; Tur 14 = v14.0).

| Alan | Durum |
| :--- | :--- |
| Modeller | Lise öğrencisi (9–12) · Lise mezunu · Üniversite mezunu (YL) |
| Ülke × dil | 15 ülke serbest (de it at ch nl be fr es se fi dk ie hu pl cz) × İngilizce / yerel |
| Veri hattı (mevzuat) | `.agents/mevzuat/dogrulama/` (Ajan 13) → `node araclar/mevzuat-aktar.js` (PM) → `data/mevzuat/kaynak/` → `node araclar/ulke-veri-olustur.js` → `data/mevzuat/ulke/<cc>.js`, `ulke-dizini.js`, `yl-genel.js`, `duyurular.js` |
| Veri hattı (sınav, taslak) | `sinavlar-tur12.json` → `node araclar/sinav-aktar.js` → `sinavlar.js` · `teyit-taslaklari-tur11.json` → `node araclar/teyit-taslak-olustur.js` → `data/kocluk/teyit-taslaklari.js`. Üretilen dosyalar elle düzenlenmez. |
| Veri | Lisans 604 · YL 452 madde · QS WUR 2027 ilk 20: 202 üniversite (İngilizce lisans 105 var, 2 Doğrulanamadı; "var" = en az 3 program) · sınavlar 47 kayıt (12 dil) · 72 hazır teyit taslağı |
| Soru | Portal 880 · deneme havuzu 874 · seviye 153 · Calculus Resmi FRQ Arşivi (12 FRQ, 108 ölçüt) |
| Kaynak PDF | 26 PDF, envanter `kaynaklar/pdf/kaynak-listesi.json`; ticari kitaplar (paket=false) pakete girmez, portaldan bağlantı verilmez, metinleri kopyalanmaz |
| Denetim/test | pm-denetim 0 · ad-denetimi 0 · 10 birim testi geçti (19 Ekim yeniden çalıştırıldı) |
| Paket | `sunum/AP-MEBERRA-Sunum-2026-10-16.zip` (25,8 MB) |
| Sürüm | v12.2 (`arsiv/surumler/`) |

## Kullanıcı kararı (20 Ekim, K14-5)
- **Groningen eklendi** (Physics/Applied Physics → AP Physics 2). **Süresi biten tarih silinmez, sonraki dönem tarihiyle tutulur** (kaynakta yoksa "henüz açıklanmadı"). Ajan 13 (§30.9): RUG AB dışı şart son günü 1 Temmuz / koşullu kabulde 1 Haziran, AP puanı Temmuz → **Physics 2 Mayıs 2027 önerilir (kullanıcı kararı bekliyor)**; 13 Kasım kaçarsa geç sipariş 12 Mart 2027 (+40 $). Veri aktarımı (cent-s, lis-nl-rug-ap, sonrakiDonem 25) A5 bitince.

## Yaklaşan tarihler (kullanıcıya hatırlat)
1. **27 Ekim 2026:** Jean Monnet 2027-28 son gün (kâğıt başvuru, Ankara MFİB; ≤12 ay program, Türkiye'de çalışan/öğrenci).
2. **31 Ekim 2026:** CISIA kuralları (IT-1).
3. **1 Kasım 2026:** DTU ön değerlendirme; T-DK1 teyit e-postası bundan önce.
4. **13 Kasım 2026:** AP sınav kaydının son günü (AP Physics 2 dahil siparişler).
5. **15 Kasım 2026:** BME duyurusu kalkar; Padova YL 1. pencere; Stuttgart YL penceresi açılır.
6. **30 Kasım 2026:** ETH Zürich YL. **1 Aralık:** PoliMi YL erken tur; EPFL sınav kaydı.
7. **15 Aralık 2026:** Campus France DAP (lisans), EPFL YL. **30 Aralık:** Campus France YL ücreti.
8. **15 Ocak 2027:** İsveç güz 2027 (YL); TU Delft; DTU.
9. Teyit e-postaları: 72 hazır taslak Yazışmalarım'da; ilk-20 açık hücreleri için 3 taslak (karar notu ilk20-ikinci-tur §4).

## Oturum notu (20 Ekim 2026)
Kullanıcı isteğiyle burada durduk. Devamda sırayla: (1) Physics 2 kararını sor — öneri Mayıs 2027; sipariş son günü 13 Kasım 2026, geç sipariş 12 Mart 2027 (+40 $). (2) Karar evetse Ajan 12 AP Physics 2 içeriği + ders kartı adı; hayırsa önce Groningen teyit e-postası (`.agents/mevzuat/karar-notu-2026-10-20-groningen.md` §4). (3) Physics 1 U8, Biology U8. Yaklaşan: 27 Ekim Jean Monnet · 31 Ekim CISIA · 1 Kasım DTU · 13 Kasım AP sipariş · 15 Kasım BME/Padova/Stuttgart.

## Sıradaki iş (Tur 14 devamı — `proje.md` §30.7)
- **Sıradaki:** Physics 2 dönemi kullanıcı kararı (öneri Mayıs 2027; sipariş 13 Kasım) · içerik: Physics 1 U8, Biology U8, (karar olursa) AP Physics 2

### Eski liste (§28.9, kısmen tamamlandı)
- Groningen kararı; teyit e-postaları (6 ilk-20 hücresi, 12 alıcı adresi); Teyit gerekir sınav bilgileri (Goethe, TestDaF/telc, CILS/CELI, Tisus, Danca)
- Calculus kapsam boşlukları (~16 soru; `.agents/icerik/calculus-kapsam-tur12.md`)
- İçerik: Faz 36 Biology Unit 7 · Faz 37 Physics 1 Unit 7 · Faz 38 Chemistry Unit 9 · English kategori 2/5/7 · CS A Unit 3
- Ajan 11: kalan "Meberra" hitapları, tema yanıp sönmesi, FRQ yedek birleştirme, styles.css sadeleştirme; R6 (ülke başına dil), R7 (CH/BE ikinci yerel dil)
- Ajan 12: soruları `data/sorular/ders/` klasörüne ayırma (HARITA.md §3, 2. aşama)

## Teknik notlar
- **Teslim sırası:** 0 `deneme-bankasi-olustur` (soru eklendiyse) → 0b `mevzuat-aktar` + `ulke-veri-olustur` / `sinav-aktar` / `teyit-taslak-olustur` (veri değiştiyse) → 1 `pm-denetim` → 1b `ad-denetimi` → 2 birim (10 Node testi; `universite-ister-test`, 1.22.0'dan beri `hedef-birim-test` ve `isterler-birim-test` dahil) + tarayıcı testleri → 3 `sunum-olustur` + paket testleri → 4 `proje.md` (§ + ★ GÜNCEL DURUM) + bu dosya + `HARITA.md` → 5 `surum-arsivle`.
- **Tarayıcı testleri:** `araclar/testler` klasörünü proje dışına kopyalayıp `npm install`; Chromium yolu `C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/`. Ajanlar Playwright'ı resmi sayfaları okumak için de kullanabilir (bot doğrulaması aşılmaz).
- **Python:** proje klasöründe bozuk; `C:\Users\hp\AppData\Local\Programs\Python\Python311\python.exe -I` kullanın (pypdf, sympy kurulu).
- **Dosya düzenleme:** Git Bash heredoc'u ve tek tırnaklı `node -e` metinleri kesme işareti (') içeren Türkçe metinlerde bozulur; Edit/Write aracını kullanın.
- **Web arama kotası:** oturum başına ~200 arama; büyük araştırmalarda WebFetch + Playwright tercih edin.
- **Paket tarihi** artık yerel tarih (Tur 12 düzeltmesi). Eski bir paketi yeniden üretmek için ilgili sürüm zip'ini açıp `kaynaklar/pdf`'i SURUM.json hash'leriyle doldurup `sunum-olustur` çalıştırın (Tur 12'de Tur 11 paketi böyle geri getirildi).
