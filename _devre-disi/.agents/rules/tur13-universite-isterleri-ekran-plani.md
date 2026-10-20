# Tur 13 Ekran ve Bilgi Mimarisi Planı: Üniversite İsterleri, Sınavlar ve Ders Bağlantıları
*Tarih: 17 Ekim 2026 · Hazırlayan: Ajan 11 (Frontend & UX Tasarım Sorumlusu) · Onay: Lead PM Dr. Aylin Kaya*

## 1. Problem ve Kullanıcı İhtiyacı
- **Mevcut Durum:** `sartlar.html` ve `universiteler.html` sayfalarında kullanıcı (örneğin 11. sınıf öğrencisi) Almanya'yı veya başka bir ülkeyi seçtiğinde gelen ilk 20 üniversite kartlarında yalnızca üniversite adı, şehir, QS sırası ve EN/Yerel rozetleri yer alıyordu. Üniversitenin kabul için istediği dil sınavları (IELTS, TOEFL, TestDaF vb.) ve bilim sınavları (AP Calculus, AP Physics, AP Chemistry, TestAS, SAT, TOLC-I vb.) görünmüyordu.
- **Kullanıcı Talebi:**
  1. Filtreleme olduğunda gelen üniversiteler kendi isterleri ile gelsin (Hangi dil sınavları, hangi bilim sınavları).
  2. Bu sınavlara/derslere tıklandığında derslerin listelenmiş hâli açılsın.
  3. Buradan doğrudan dersin **Konu Anlatımı**na ve **Deneme Sınavları**na gidilebilsin.

## 2. Bilgi Mimarisi ve Ekran Düzeni (1280px Masaüstü & 360px Mobil)

### 2.1. Üniversite Kartı Düzeni (`.sr-uni`, `sartlar.html` ve `universiteler.html`)
- **Kart Başlığı ve Kimlik:** Sıra rozeti, Üniversite adı, Şehir, QS Dünya Sırası.
- **Dil ve Program Rozetleri:** EN Var / Yerel Var.
- **İsterler Özeti (Yeni Bileşen: `.sr-uni-reqs`):**
  - **🗣️ Dil Sınavları Rozetleri:** IELTS 6.5+ / TOEFL 90+ (İngilizce yol) veya TestDaF 4x4 / DSH-2 (Yerel yol).
  - **🔬 Bilim Sınavları Rozetleri:** AP Calculus, AP Physics, AP Chemistry, TestAS / SAT (veya İtalya için TOLC-I / TIL-I).
  - **Özel Şart Bildirimi (varsa):** TUM Yetenek Değerlendirmesi, KIT Carl Benz SAT 1200 / TestAS 75 vb.
  - **Etkileşim Butonu:** `İsterleri ve Dersleri İncele ▾` (erişilebilir açılır buton, `aria-expanded`).

### 2.2. Genişleyen Ders & Sınav İstasyonu Paneli (`.sr-uni-drawer`)
Kullanıcı butona veya çiplere tıkladığında kartın içinde akıcı bir şekilde açılan panel:
1. **🗣️ Dil Sınavları Grubu:**
   - IELTS Academic, TOEFL iBT, Duolingo, TestDaF, DSH.
   - Her sınav için: Asgari eşik, format özeti,
   - Eylemler: `📖 Konu Anlatımı & Strateji` (`ap-english.html`), `🎯 Deneme Sınavı` (`deneme.html?ders=english-language`), `ℹ️ Sınav Kartı` (`sinavlar.html#...`).
2. **🔬 Bilim Sınavları ve Dersleri Grubu:**
   - **AP Calculus (AB / BC):** Limit, Türev, İntegral, Diferansiyel Denklemler, Seriler.
     - Eylemler: `📖 Konu Anlatımı` (`ap-calculus.html`), `🎯 AB Denemesi` (`deneme.html?ders=calculus-ab`), `🎯 BC Denemesi` (`deneme.html?ders=calculus-bc`).
   - **AP Physics (Physics 1 / C Mechanics):** Newton Mekaniği, Enerji, Momentum, Rotasyon.
     - Eylemler: `📖 Konu Anlatımı` (`ap-physics.html`), `🎯 Deneme Sınavı` (`deneme.html?ders=physics-1`).
   - **AP Chemistry:** Kimyasal Bağlar, Kinetik, Termodinamik, Denge.
     - Eylemler: `📖 Konu Anlatımı` (`ap-chemistry.html`), `🎯 Deneme Sınavı` (`deneme.html?ders=chemistry`).
   - **AP Biology:** Biyomoleküller, Hücre Solunumu, Genetik.
     - Eylemler: `📖 Konu Anlatımı` (`ap-biology.html`), `🎯 Deneme Sınavı` (`deneme.html?ders=biology`).
   - **AP Computer Science A & Seçmeliler:** Java OOP, Veri Yapıları.
     - Eylemler: `📖 Konu Anlatımı` (`ap-electives.html#cs-a`), `🎯 Deneme Sınavı` (`deneme.html?ders=cs-a`).
   - **İtalya için TOLC-I / TIL-I:** Mühendislik matematik ve fizik soruları.
     - Eylemler: `📖 Calculus` (`ap-calculus.html`), `📖 Fizik` (`ap-physics.html`), `🎯 Deneme` (`deneme.html?ders=calculus-ab`).
   - **Almanya için TestAS:** Çekirdek + Mühendislik / Fen modülü.
     - Eylemler: `📖 Calculus & Fizik`, `🎯 Deneme`.

### 2.3. Hızlı Modal / Drawer Desteği
- Karttaki doğrudan bir sınav çipine tıklandığında ilgili ders kartına odaklanılır veya doğrudan konu anlatımı / denemeye geçiş seçeneği sunulur.

## 3. WCAG AA Erişilebilirlik & Tasarım Uyumu
- Klavye odağı (`Enter` / `Space` ile açma/kapama, `Esc` ile kapatma).
- `aria-expanded`, `aria-controls` semantik özellikleri.
- Yüksek kontrast (koyu ve açık temada `--surface-2`, `--border`, `--text`, `--accent` renk token'ları).
- Mobil 360px uyumu: Dikey yığınlama, taşmayan butonlar, parmak dostu dokunma hedefleri (min 44px).
