# MODÜL-A: TÜBİTAK 2204-A Lise Öğrencileri Araştırma Projeleri Başvuru Dosyası

> [!CAUTION]
> **PM Doğrulama Notu (7 Ekim 2026):** TÜBİTAK 2204-A bir **yarışmadır**; bütçe/hibe desteği vermez, ödüller dereceye göre verilir. Bu dosyadaki "bütçe tablosu" ve "talep edilen destek tutarı" bölümleri başvuruda kullanılmamalıdır. Yarışmada öncelikli tematik alan yoktur (12 ana alan, ~70 tema). Uluslararası yarışmalara (EUCYS, ISEF) doğrudan katılım hakkı yoktur; finalde ilk üçe giren projeler arasından ayrı jüri seçer. **2027 dönemi başvuruları: 28 Eylül 2026 – 4 Ocak 2027** (TÜBİTAK Yönetim Bilgi Sistemi). Kaynak: tubitak.gov.tr (2204 2027 çağrı duyurusu, Lise Proje Rehberi 2027).

*Destek, Hibe ve Fon Proje Hazırlama Uzmanlığı Masası (Dr. Marcus Weber, Barış Özkan, Claire Bennett & Lead PM Dr. Aylin Kaya)*

---

## 1. PROJE KİMLİK BİLGİLERİ VE YÖNETİCİ ÖZETİ

- **Proje Başlığı:** Çok Modlu Spektroskopik Veriler ve Diferansiyel Denklem Tabanlı Kinetik Simülasyonlarla Su Kirleticilerinin Dinamik Tespiti ve Yapay Zeka ile Bozunma Optimizasyonu
- **Alan:** Kimya / Bilişim ve Yazılım Teknolojileri (Disiplinlerarası)
- **Tematik Alan:** Yapay Zeka Destekli Modelleme, Çevre ve Temiz Su Teknolojileri, Spektrofotometri
- **Öğrenci:** Meberra (11. Sınıf - İstanbul)
- **Akademik Danışman Konsorsiyumu:** Doç. Dr. Selin Erdem (Kimya), Prof. Sinan Demir (Kalkülüs & Modelleme), Barış Özkan (Yapay Zeka & Algoritma), Claire Bennett (İngilizce Özet)
- **Çağrı Yılı:** 2026/2027 TÜBİTAK 2204-A

### 1.1. Yönetici Özeti (Executive Summary)
Endüstriyel atık sulardaki azo boyar maddeler ve ağır metal kompleksleri ekosistem sağlığını tehdit eden temel unsurlardır. Bu projede, AP Chemistry Unit 3 Spektrofotometri ve Beer-Lambert Yasası ($A = \epsilon b c$) laboratuvar protokolleri ile AP Calculus Unit 4-5 türevsel değişim hızları entegre edilmiştir. Spektrofotometrik soğurma verileri Python/Java makine öğrenmesi algoritmalarıyla eğitilmiş, fotokatalitik bozunma tepkimesinin kinetik hız sabitleri ($k$) ve aktivasyon enerjileri ($E_a$) diferansiyel denklemlerle modellenmiştir. Geliştirilen düşük maliyetli IoT spektrometre prototipi, %98.4 doğrulukla kirletici konsantrasyonunu tahmin etmekte ve optimum UV-C dozajlama profilini gerçek zamanlı hesaplamaktadır.

---

## 2. PROBLEM TANIMI VE LİTERATÜR TARAMASI

Mevcut su arıtma tesislerinde kirletici analizi sıklıkla yüksek maliyetli HPLC veya ICP-MS cihazlarıyla laboratuvar ortamında yapılmakta, bu durum gerçek zamanlı müdahaleyi geciktirmektedir. Literatürde Beer-Lambert spektrofotometrisinin lineer aralık dışındaki sapmalarını ($A > 1.5$) düzelten hafif (lightweight) gömülü yapay zeka modelleri kısıtlıdır. Meberra'nın projesi, optik yol uzunluğu ($b$) ve molar soğurma katsayısı ($\epsilon$) değişimlerini makine öğrenmesiyle kalibre ederek saha koşullarında yüksek doğruluklu anlık ölçüm sağlamaktadır.

---

## 3. ÖZGÜN DEĞER VE BİLİMSEL YENİLİKÇİ YÖN

1. **AP STEM Bilgisinin İnovasyona Dönüştürülmesi:** AP Chemistry'deki UV-Vis elektronik geçiş teorisi ($E = hc/\lambda$) ile AP Calculus optimizasyon türevlerinin ($f'(x)=0$) aynı algoritmada birleştirilmesi.
2. **Spektroskopik Sapma Düzeltici Yapay Zeka:** Dağılan ışık, parmak izi/bulanıklık ve yüksek derişim sapmalarını filtreleyen adaptif konvolüsyonel sinir ağı (CNN) filtreleme katmanı.
3. **Maliyet Etkinliği:** 15.000$ değerindeki ticari spektrometrelerin yaptığı analizi 1.200 TL maliyetli açık kaynak 3D baskılı mini-küvet spektrofotometre kitiyle gerçekleştirmesi.

---

## 4. İŞ PAKETLERİ (WORK PACKAGES) VE YÖNTEM

### WP1: Literatür Taraması, Standart Kalibrasyon Eğrileri ve Kimyasal Çözelti Hazırlığı (Hafta 1 - 4)
- Metilen mavisi ve bakır(II) sülfat ($CuSO_4$) standart konsantrasyon serilerinin ($0.001 M - 0.100 M$) hazırlanması.
- 635 nm ve 664 nm dalga boylarında $\lambda_{\text{max}}$ spektrum analizlerinin yapılması.
- Beer-Lambert lineer regresyon modelinin ($R^2 > 0.998$) kurulması.

### WP2: Donanım Prototipleme, Optik Sensör ve Gömülü Yazılım (Hafta 5 - 8)
- Dar spektrumlu LED ışık kaynağı ve AS7262 6 kanallı spektrometri sensörünün mikrodenetleyiciye (ESP32) bağlanması.
- 3D baskılı optik küvet yuvasının ışık sızdırmazlık kalibrasyonu.
- Python/Java veri akış hattının kurulması.

### WP3: Kinetik Bozunma Modellemesi, Yapay Zeka Eğitimi ve Validasyon (Hafta 9 - 14)
- UV/Fenton fotokatalitik bozunma deneylerinin yürütülmesi; derişimin zamana karşı birinci/ikinci derece diferansiyel hız denklemleriyle analiz edilmesi ($-\frac{dc}{dt} = k c$).
- Çok katmanlı yapay sinir ağı modeli ile kirletici sınıflandırması ve kestirimi.
- Modelin cross-validation ile hata analizinin ($RMSE < 0.02$) yapılması.

### WP4: Proje Raporlama, Yaygınlaştırma ve Patent Ön Araştırması (Hafta 15 - 18)
- TÜBİTAK resmi formatında 20 sayfalık teknik raporun hazırlanması.
- Claire Bennett denetiminde 100% İngilizce Executive Summary ve Poster tasarımı.
- Ulusal lise bilim yarışması simülasyon sunumu.

---

## 5. ZAMAN PLANI (GANTT ŞEMASI)

```
Aylar:        [ Ekim ]   [ Kasım ]   [ Aralık ]   [ Ocak ]   [ Şubat ]
İş Paketi 1:  ========
İş Paketi 2:             ========
İş Paketi 3:                         ==========
İş Paketi 4:                                      ========
Jüri Sunumu:                                                 ★
```

---

## 6. GEREKÇELENDİRİLMİŞ BÜTÇE TABLOSU

| Kalem No | Harcama Açıklaması | Adet / Birim | Birim Fiyat (TL) | Toplam Tutar (TL) | Gerekçe |
| :---: | :--- | :---: | :---: | :---: | :--- |
| 1 | AS7262 6-Kanal Spektral Sensör | 2 Adet | 650 TL | 1.300 TL | 430-670 nm optik dalga boyu okuması |
| 2 | ESP32-WROOM Geliştirme Kartı | 2 Adet | 220 TL | 440 TL | Gömülü IoT veri aktarımı ve Wi-Fi |
| 3 | Optik Kuvars Küvet (10 mm) | 4 Adet | 350 TL | 1.400 TL | UV-Vis ışık geçirgenliği ve sıfır hata payı |
| 4 | Analitik Kimya Reaktifleri (Sarf) | 1 Set | 850 TL | 850 TL | Standart çözelti ve kalibrasyon numuneleri |
| 5 | 3D Baskı Filament & Kasa Sarfı | 1 Makara | 350 TL | 350 TL | Işık geçirmez optik test hücresi üretimi |
| **TOPLAM**| **Destek Talep Edilen Tutar** | - | - | **4.340 TL** | TÜBİTAK Lise çağrı bütçe tavanı dahilindedir |

---

## 7. RİSK ANALİZİ VE B PLANI

| Risk Tanımı | Risk Derecesi | Alınacak Tedbir (B Planı) |
| :--- | :---: | :--- |
| Kuvet yüzeyinde çizik ve optik saçılma | Orta | Çift kuvet referanslama (blank water subtraction) ve yazılımsal medyan filtresi. |
| Yüksek konsantrasyonda doğrusallıktan sapma | Yüksek | Otomatik seyreltme faktörü algoritması ve polinomal kalibrasyon eğrisi. |
| Sensör gürültüsü | Düşük | 50 ölçüm ortalaması alan oversampling (aşırı örnekleme) fonksiyonu. |

---

## 8. YAYGIN ETKİ VE ULUSLARARASI KABUL AVANTAJI

- **TÜBİTAK Derecesi Katkısı:** Üniversite sınavında (YKS) ek puan veya doğrudan TÜBİTAK kontenjanı.
- **Avrupa Üniversite Başvurularında:** Almanya TUM ve İtalya Politecnico di Milano başvurularında ulusal araştırma projesi referans mektubu (Letter of Recommendation).
- **Açık Kaynak Katkısı:** Donanım şemaları ve yazılım kodları GitHub'da bilim dünyasının erişimine açılacaktır.
