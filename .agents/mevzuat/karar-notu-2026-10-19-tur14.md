# Karar Notu — Tur 14 (19–20 Ekim 2026) · Ajan 13 → Dr. Aylin Kaya

Kapsam: §28.9 madde 2–4 (açık ilk-20 hücreleri, Teyit gerekir sınav bilgileri ve GRE kapsamı, 12 alıcı adresi). Proje veri dosyalarına ve `proje.md`'ye dokunulmadı. E-posta gönderilmedi. Web arama: 25 (kota 60).

## 1. Sonuç

1. **Sınavlar:** 6 kayıt Doğrulandı'ya geçti: goethe-c1-c2, testdaf, cils, celi, tisus (önceden Teyit gerekir) ve studieproven-dansk (önceden Doğrulanamadı). Goethe Türkiye sayfası gerçek tarayıcıyla açıldı. C1 sınavı 2026 oturumlarında 19.030 TL, 2027 oturumlarında 20.930 TL. İstanbul'da 19 Ocak ve 16 Şubat 2027 oturumları var. Goethe C2'nin Türkiye'de şu an tarihi yok. TestDaF Türkiye'de 20 merkezde yapılıyor; bunların 7'si İstanbul'da.
2. **İki yanlış iddia düzeltildi:** "İstanbul İtalyan Kültür Merkezi CELI ve PLIDA yapıyor" ifadesi resmi listelerle uyuşmuyor; Kültür Merkezi yalnız CILS yapıyor. İstanbul'da CELI'yi İtalyan Liseleri (Şişli), PLIDA'yı tek merkez olarak Italyan dil merkezi yapıyor. Danca sınavlar (Studieprøven, Prøve i Dansk 3) yalnız Danimarka'daki dil merkezlerinde yapılıyor; Türkiye'de sınav yeri yok.
3. **GRE:** Diğer 11 ülkeden üçünde kaynaklı örnek bulundu. Hollanda'da Maastricht MSc International Business GMAT ya da GRE ister (AACSB/EQUIS akreditesi olmayan diplomalar için); Tilburg'un iktisat araştırma yüksek lisansında GRE zorunlu. Finlandiya'da Aalto School of Business, Finlandiya dışından lisans derecesi olanlardan GMAT ya da GRE ister (2027 kabulleri). İspanya'da UC3M Master in Economic Analysis GRE'yi zorunlu tutmuyor ama şiddetle öneriyor. Şart iktisat ve işletme yüksek lisanslarında; mühendislik yüksek lisanslarında GRE şartı görülmedi. SE, DK, IE, HU, PL ve FR'de resmi kaynakta örnek bulunamadı.
4. **Adresler:** 13 taslak kontrol edildi. 10 adres resmi iletişim sayfasında aynen doğrulandı. 2 adres düzeltildi: Tisus için `tisus.svefler@su.se`, DTU'nun Danca programları için `optagelse@dtu.dk`. Adresi olmayan 1 taslağa adres eklendi. Arayüz adresi yalnızca kaynak JSON'da kaynaklı bir maddede geçiyorsa gösterdiği için her adrese bir "kaynak maddesi" hazırlandı.
5. **İlk 20:** 6 açık hücrenin 6'sı da kapandı (UniBS 4, UniFi 1, Toulouse III 1). UniFi ve UniBS'de İngilizce lisans "kısıtlı" çıktı: ikisinde de 2 program var ve ikisi de mühendislik dışı. Toulouse III'te İngilizce yüksek lisans "var": en az 11 program, bunlardan 5'i mühendislik veya bilişim.

## 2. Karar gerektiren konular

**K-T14-1 — GRE kaydına hangi ülkeler eklensin?**
- **A) nl, fi, es (önerim):** Tur 12 ölçütüyle aynı: zorunlu ya da "şiddetle önerilir" (KU Leuven ve PoliTo emsali). Artısı tutarlı olması. Eksisi, İspanya'nın yalnız bir programa dayanması.
- **B) Yalnız nl ve fi** (yalnız zorunlu şart). Artısı daha sıkı olması. Eksisi Tur 12 ölçütüyle çelişmesi.
- Kaynak dosya A'ya göre hazırlandı. B seçilirse `gre-general.alanlar.ulkeler` alanından "es" silinir.

**K-T14-2 — Kısmen doğrulanmış kayıtlar ne olsun?** testdaf, cils ve celi kayıtlarında konum ve tarih doğrulandı ama Türkiye ücreti hâlâ "Teyit gerekir". Önerim: kayıt düzeyinde Doğrulandı kalsın, ücret alanı Teyit gerekir olarak görünsün. `gre-general` kaydı aynı biçimde tutuluyor. Alternatif, kaydı tümüyle Teyit gerekir'de bırakmak; bu durumda doğrulanmış tarih ve merkez bilgisi arayüzde zayıf görünür.

**K-T14-3 — İtalyanca sertifika taslakları:** 12 ve 18 numaralı taslaklar Kültür Merkezi'ne CELI ve PLIDA da soruyor. Önerim: iki taslak yalnız CILS'e daraltılsın (yeni metinler adres dosyasında). CELI ve PLIDA için gerekirse yeni taslak açılsın: İtalyan Liseleri `m.vasapollo@ita.k12.tr`, Italyan dil merkezi `info@italyandilmerkezi.com`.

## 3. Düzeltilecek iddialar (dosya → eski → doğru → kaynak)

| Dosya > id | Eski | Doğru | Kaynak |
| :-- | :-- | :-- | :-- |
| sinavlar.js > celi (tarih) | "İstanbul İtalyan Kültür Merkezi CELI yapıyor" | Kültür Merkezi CVCL listesinde yok. Türkiye'deki CELI merkezleri: İtalyan Liseleri (İstanbul), Casa Italia (Ankara), İzmir Ekonomi Üniv., İtalyan İlkokulu (İzmir) | cvcl.unistrapg.it yurt dışı merkez PDF'i (güncelleme 19.03.2026) |
| sinavlar.js > plida (tarih) | "İstanbul İtalyan Kültür Merkezi PLIDA yapıyor" | Türkiye'deki tek PLIDA merkezi Italyan dil merkezi (İstanbul, Halaskargazi Cad. 143) | dante.global/it/contatti/lista-contatti |
| sinavlar.js > studieproven-dansk | "Türkiye'de sınav yapıldığına dair resmi bilgi bulunamadı (Doğrulanamadı)" | Sınav, Danimarka'da SIRI yetkili dil merkezlerinde yapılıyor; yurt dışı sınav yeri hükmü yok. 2027 tarihleri: Mayıs ve Kasım | Bek. nr. 1627/2024; danskogproever.dk Prøvedatoer 2027 |
| sinavlar.js > goethe-c1-c2 (tarih/ücret) | "Türkiye sayfası 403; ücret Teyit gerekir" | C1: 19.030 TL (2026) / 20.930 TL (2027); C2: Türkiye'de tarih yok | goethe.de/ins/tr/tr/spr/prf/gzc1.cfm, gzc2.cfm |
| sinavlar.js > tisus (ücret) | "Tutar İngilizce sayfada yok; Teyit gerekir" | Yurt dışı: 2.875 SEK + sınav görevlisi ücreti; Mayıs 2027 için ilgi bildirimi 11 Ocak–19 Mart 2027 | su.se Om Tisus |
| teyit-taslaklari > tt-se-l-2 (kime) | tisus@su.se | tisus.svefler@su.se | su.se Tisus contact |
| teyit-taslaklari > tt-dk-l-2 (kime) | optagelse@adm.dtu.dk | optagelse@dtu.dk (görünen resmi adres) | dtu.dk Kontakt optagelsen |
| uni-it.json > 19 UniBS | 4 hücre Doğrulanamadı | lisans: en kısıtlı / yerel var; YL: en var / yerel var | unibs.it english-study-programmes, facts-and-figures |
| uni-it.json > 13 UniFi | lisans.en Doğrulanamadı | kısıtlı (2/72, mühendislik dışı) | unifi.it 2026/27 kataloğu |
| uni-fr.json > 15 Toulouse III | yuksekLisans.en Doğrulanamadı | var (en az 11 parcours) | formations.univ-toulouse.fr master en anglais |

**PM'in aktarması gereken dosyalar:**
- `tur14-sinav-duzeltmeleri.json` → `node araclar/sinav-aktar.js --girdi .agents/mevzuat/tur14-sinav-duzeltmeleri.json`. Kuru çalıştırma denendi: 10 kayıt güncelleniyor, 0 hata, dosyaya yazılmadı.
- `tur14-adres-duzeltmeleri.json`, iki adımda uygulanır:
  1. Aşağıdaki taslaklarda `kime` alanı `yeniKime` ile değiştirilir (dosyalar `dogrulama/` altında): `lisans-se.json > teyitTaslaklari[1]`, `yl-se.json > [1]`, `lisans-dk.json > [1]`. Gerekirse `lisans-it.json > [2]` ve `yl-it.json > [4]` metinleri de değiştirilir.
  2. Her `kaynakMaddesi`, ilgili `dogrulama/<dosya>` içindeki `ortak` dizisine eklenir.
  Sonra `mevzuat-aktar.js` ve `teyit-taslak-olustur.js` çalıştırılır; hedef "kaynaksız adres adayı: 0".
- `tur14-ilk20-duzeltmeleri.json` → `dogrulama/uni-it.json` (sira 13 ve 19) ve `uni-fr.json` (sira 15) kayıtlarının yerine konur. `_tur14` alanı aktarılmaz.

## 4. Yazılı teyit taslakları

Yeni taslak gerekmedi. Mevcut taslaklarda yapılacak değişiklikler `tur14-adres-duzeltmeleri.json > taslakMetinDuzeltmeleri` içinde:
- 12 ve 18 numaralı taslaklar yalnız CILS'e daraltılır (İtalyanca metin hazır).
- 44 numaralı taslakta ücret sorusu çıkar; yerine sınav görevlisi ücreti ve İstanbul ya da Ankara oturumu sorulur.
- 2 ve 9 numaralı taslaklar (Goethe) daraltılır. 9 numara öncelikli kalır, çünkü Türkiye'de C2 tarihi yok.

## 5. Kalan açıklar

- **Teyit gerekir kalan sınavlar:**
  - telc C1 Hochschule: Türkiye'de 14 merkez bulundu, ama hangisinin C1 Hochschule yaptığı belli değil.
  - PLIDA: 2027 takvimi henüz yayımlanmadı.
  - ÖSD, SIELE (Cervantes sitesi bakımda), ÇCE yurt dışı, ECL Türkiye ve Cambridge Türkiye merkezleri bu turda ele alınmadı.
- **Alan düzeyinde açık kalanlar:** TestDaF Türkiye ücreti (yalnız kayıt portalında görünüyor), CILS/CELI/PLIDA İstanbul ücretleri, Studieprøven ücreti, Goethe C2 tarihi ve ücreti, Tisus 2027 İstanbul oturumu (yapısı gereği önceden doğrulanamaz).
- **GRE:** Tilburg sayfası otomatik erişime 403 veriyor; bilgi resmi sayfanın arama dizinindeki metinden alındı. Ayrıca Tilburg, lisans derecesini belirli ülkelerle sınırlıyor ve Türkiye bu listede görünmüyor. Maastricht belgesi 2025-26 yılına ait; 2027-28 sürümü kontrol edilmeli.
- **Takip listesi:** YL-DE-1 (BMI'nın 2027 Sperrkonto tutarı) için yine resmi ilan bulunamadı; madde açık kalıyor. Bu turda tarihi gelen başka madde yok. IT-1 (CISIA, 31 Ekim) sonraki turda kontrol edilecek.

## 6. Kaynaklar (erişim: 19 Ekim 2026; ilk-20 ve Goethe B2: 20 Ekim 2026)

**Almanca sınavları**
- Goethe-Institut Türkiye, C1 / C2 / B2 / TestDaF sayfaları (2026): https://www.goethe.de/ins/tr/tr/spr/prf/gzc1.cfm · https://www.goethe.de/ins/tr/tr/spr/prf/gzc2.cfm · https://www.goethe.de/ins/tr/tr/spr/prf/gzb2.cfm · https://www.goethe.de/ins/tr/tr/spr/prf/testdaf.html
- TestDaF / g.a.s.t. (2026–2027):
  - https://www.testdaf.de/de/teilnehmende/mein-testdaf/testzentrum-finden/
  - https://api.gast.de/event/api/public/events/testdaf
  - https://api.gast.de/event/api/public/center-search/world/by-country/with-event-availability?isoCode=TR&product=1
  - Bölüm süreleri: https://www.testdaf.de/de/teilnehmende/der-digitale-testdaf/aufbau-des-digitalen-testdaf/ · https://www.testdaf.de/de/teilnehmende/der-papierbasierte-testdaf/aufbau-des-papierbasierten-testdaf/
- telc merkez haritası (2026): https://www.telc.net/sprachpruefungen/pruefungszentrum-finden/

**İtalyanca sınavları**
- CILS Türkiye sınav yerleri: https://cils.unistrasi.it/1/180/123/TURCHIA.htm
- CVCL yurt dışı CELI merkezleri (PDF, 19.03.2026): https://cvcl.unistrapg.it/MC-API/Risorse/StreamRisorsa.ashx?guid=0c566c9e-fef7-4b02-815d-328ce3329a5d
- Dante Alighieri merkez listesi: https://www.dante.global/it/contatti/lista-contatti
- PLIDA ana sayfa: https://plida.dante.global/it
- İstanbul İtalyan Kültür Merkezi: https://iicistanbul.esteri.it/it/lingua-e-cultura/certificazioni/ · https://iicistanbul.esteri.it/chi-siamo/contatti

**İsveççe ve Danca sınavları**
- Tisus (2026): https://www.su.se/enheter/tisus---test-i-svenska-for-universitets--och-hogskolestudier/om-tisus · https://www.su.se/english/divisions/tisus---test-in-swedish-for-university-studies/about-tisus · https://www.su.se/english/divisions/tisus---test-in-swedish-for-university-studies/contact
- Danca:
  - Yönetmelik, Bek. nr. 1627 (6.12.2024): https://www.lovtidende.dk/api/pdf/247028
  - Takvim: https://danskogproever.dk/tilmeldingsfrister-og-proevedatoer/ · https://danskogproever.dk/media/hjhnubl1/proevedatoer-2027.pdf
  - Kopenhag Belediyesi: https://www.kk.dk/borger/uddannelse/danskuddannelse-til-nyankomne-udlaendinge/danskproever-selvbetalt

**GRE / GMAT**
- Maastricht IB 2025-26 (eski yıl): https://www.maastrichtuniversity.nl/file/admissionrequirementsmainternationalbusiness-marketing-finance2025-2026pdf
- Tilburg RM Economics SSS: https://www.tilburguniversity.edu/education/masters-programmes/research-master-economics/faq
- Aalto (16.9.2026 güncellemesi, 2027 kabulleri): https://www.aalto.fi/en/admission-services/gmat-and-gre-exams
- UC3M MEA (2026/27): https://www.uc3m.es/master/economic-analysis
- CERGE-EI: https://ei.cerge-ei.cz/ma-in-economic-research/ma-in-economic-research-faq

**İletişim adresleri**
- İtalya İstanbul Başkonsolosluğu: https://consistanbul.esteri.it/it/chi-siamo/gli-uffici/
- Campus France Türkiye 2026 kılavuzu: https://www.turquie.campusfrance.org/system/files/medias/documents/2025-10/Lisans%202.%20ve%203.%20s%C4%B1n%C4%B1f%2C%20BUT%20ve%20Master%20ba%C5%9Fvuru%20i%C5%9Flemleri%202026.pdf
- UC3M: https://www.uc3m.es/bachelor-degree/admission/application/international-students/early-admission/contact
- Aalto: https://www.aalto.fi/en/admission-services/contact-admission-services
- DTU: https://www.dtu.dk/english/education/undergraduate/general-engineering/admission-and-deadlines/contact · https://www.dtu.dk/uddannelse/ansoegning-og-optagelse/diplomingenioer-bachelor-optagelse/kontakt-optagelsen
- Trinity College Dublin: https://www.tcd.ie/academicregistry/contact/
- Charles Üniversitesi ÚJOP: https://ujop.cuni.cz/UJOPEN-30.html

**İlk 20**
- UniBS: https://www.unibs.it/en/english-study-programmes · https://www.unibs.it/en/international/unibs-international/facts-and-figures · https://www.unibs.it/en/education/enrolling/admission-degree-programs/bachelors-degree-courses · https://www.unibs.it/en/education/enrolling/admission-degree-programs/graduate-degree-programmes
- UniFi 2026/27 kataloğu: https://www.unifi.it/en/study-us/what-study/first-and-second-cycle-degree-programmes/first-cycle-and-single-cycle-degrees
- Toulouse (sayfa ©2025): https://formations.univ-toulouse.fr/fr/formations-master-en-anglais.html

*"Kabul kararını niyet değil, yürürlükteki metin verir; ben metni okur, sonucu tek sayfada söylerim."*
