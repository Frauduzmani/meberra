// rota.js birim testi (Ajan 11, Tur 6). Çalıştır: node araclar/testler/rota-birim-test.js
// Tarayıcı gerekmez. Gerçek data/mevzuat/ulke-rotalari.js varsa ayrıca şema ve tarih denetimi yapılır.
// FIXTURE: §8.1 şemasına uyan küçük SAHTE test verisi (yalnızca test; projeye veri dosyası olarak yazılmaz).
"use strict";
const path = require("path");
const fs = require("fs");

const SRC = "https://anabin.kmk.org/no_cache/filter/schulabschluesse-mit-hochschulzugang.html";
const FIXTURE = {
  de: {
    ad: "Almanya rotası",
    temelKural: { baslik: "SAHTE: YKS'de lisans programına yerleşme → alana bağlı giriş (TUR-BV05)", detay: "Sahte test detayı.", kaynak: SRC },
    kosullar: [
      { id: "de-k-yks", baslik: "YKS'de 180+ puan", detay: "Sahte", kaynak: SRC, kesinlik: "Doğrulandı" },
      { id: "de-k-alan", baslik: "Giriş hakkı yerleşilen alanla sınırlı", detay: "Sahte", kaynak: SRC, kesinlik: "Doğrulandı" },
      { id: "de-k-istisna", baslik: "Üniversitenin bireysel istisnası", detay: "Sahte", kaynak: SRC, kesinlik: "Doğrulanamadı" }
    ],
    adimlar: [
      { id: "de-uni-teyit", baslik: "Hedef üniversiteye kabul yolunu sor", detay: "Sahte", kaynak: SRC, kesinlik: "Doğrulandı", zaman: { mezuniyetGore: -2, ay: 12 }, siniflar: ["11", "12"], tur: "basvuru", bagli: { sablon: "de-uni-ap-yks-teyit" }, zorunlu: false },
      { id: "de-ap-kayit", baslik: "AP sınav kaydı (11. sınıf)", detay: "Sahte", kaynak: "https://apstudents.collegeboard.org", kesinlik: "Doğrulandı", zaman: { mezuniyetGore: -2, ay: 11 }, siniflar: ["11"], tur: "sinav", bagli: { sinav: "ap-calculus-ab" }, zorunlu: false },
      { id: "de-ielts", baslik: "IELTS Academic", detay: "Sahte", kaynak: "https://www.ielts.org", kesinlik: "Yoruma açık", zaman: { mezuniyetGore: -1, ay: 2 }, siniflar: null, tur: "sinav", bagli: { sinav: "ielts-academic" }, zorunlu: true },
      { id: "de-yks", baslik: "YKS'ye gir", detay: "Sahte", kaynak: "https://www.osym.gov.tr", kesinlik: "Doğrulandı", zaman: { mezuniyetGore: 0, ay: 6 }, siniflar: null, tur: "sinav", bagli: null, zorunlu: true },
      { id: "de-yks-yerlesme", baslik: "YKS'de lisans programına yerleş", detay: "Sahte", kaynak: SRC, kesinlik: "Doğrulandı", zaman: { mezuniyetGore: 0, ay: 7, metin: "YKS yerleştirme sonuçları (Temmuz–Ağustos)" }, siniflar: null, tur: "belge", bagli: null, zorunlu: true },
      { id: "de-uniassist", baslik: "uni-assist başvurusu", detay: "Sahte", kaynak: "https://www.uni-assist.de", kesinlik: "Yoruma açık", zaman: { mezuniyetGore: 0, ay: 7 }, siniflar: null, tur: "basvuru", bagli: { sablon: "de-uniassist-ap-yks" }, zorunlu: true },
      { id: "de-vize", baslik: "Öğrenci vizesi", detay: "Sahte", kaynak: "https://tuerkei.diplo.de", kesinlik: "Doğrulanamadı", zaman: { metin: "Kabul mektubundan sonra" }, siniflar: null, tur: "belge", bagli: { sayfa: "universiteler.html#de" }, zorunlu: true }
    ],
    belgeler: [
      { id: "de-b-diploma", ad: "Lise diploması + yeminli tercüme", detay: "Sahte", kaynak: "https://www.uni-assist.de", zorunlu: true },
      { id: "de-b-yerlesme", ad: "YKS yerleştirme belgesi", detay: "Sahte", kaynak: SRC, zorunlu: true },
      { id: "de-b-dil", ad: "İngilizce dil belgesi", detay: "Sahte", kaynak: "https://www.ielts.org", zorunlu: false }
    ],
    sinavlar: { zorunlu: ["ielts-academic|toefl-ibt"], secmeli: ["ap-calculus-ab", "ap-chemistry", "ap-physics-c-mechanics"], notlar: { "ap-chemistry": "Sahte not: KMK uyumu istiyorsan fen dersi." } },
    uyarilar: [{ metin: "Sahte uyarı: AP tek başına giriş hakkı vermez.", kaynak: SRC }],
    acikKararlar: []
  },
  it: {
    ad: "İtalya rotası",
    temelKural: { baslik: "SAHTE: Giriş sınavı + YKS sonuç belgesi", detay: "Sahte test detayı.", kaynak: "https://www.universitaly.it" },
    kosullar: [{ id: "it-k-sinav", baslik: "Programın giriş sınavı", detay: "Sahte", kaynak: "https://www.cisiaonline.it", kesinlik: "Doğrulandı" }],
    adimlar: [
      { id: "it-cents-prova", baslik: "Prova CEnT-S (11. sınıf)", detay: "Resmi başvuru değil; sınav deneyimi ve seviye ölçümü", kaynak: "https://www.cisiaonline.it", kesinlik: "Doğrulandı", zaman: { mezuniyetGore: -2, ay: 11 }, siniflar: ["11"], tur: "sinav", bagli: { sinav: "cent-s" }, zorunlu: false },
      { id: "it-cents", baslik: "CEnT-S (başvuru için)", detay: "Sahte", kaynak: "https://www.cisiaonline.it", kesinlik: "Yoruma açık", zaman: { mezuniyetGore: -1, ay: 11 }, siniflar: null, tur: "sinav", bagli: { sinav: "cent-s" }, zorunlu: true },
      { id: "it-polito-tili", baslik: "PoliTo TIL-I", detay: "Sahte", kaynak: "https://www.polito.it", kesinlik: "Doğrulandı", zaman: { mezuniyetGore: 0, ay: 3 }, siniflar: ["12", "mezun"], tur: "sinav", bagli: { sablon: "it-polito-tili-takvim" }, zorunlu: false },
      { id: "it-yks", baslik: "YKS sonuç belgesi", detay: "Sahte", kaynak: "https://www.osym.gov.tr", kesinlik: "Doğrulandı", zaman: { mezuniyetGore: 0, ay: 7 }, siniflar: null, tur: "belge", bagli: null, zorunlu: true },
      { id: "it-dov", baslik: "DoV / CIMEA", detay: "Sahte", kaynak: "https://www.cimea.it", kesinlik: "Yoruma açık", zaman: { mezuniyetGore: 0, ay: 7 }, siniflar: null, tur: "belge", bagli: { sablon: "it-uni-cimea-dov" }, zorunlu: true }
    ],
    belgeler: [{ id: "it-b-dov", ad: "DoV ya da CIMEA belgesi", detay: "Sahte", kaynak: "https://www.cimea.it", zorunlu: true }],
    sinavlar: { zorunlu: ["cent-s|til-i|polimi-tol|sat", "ielts-academic|toefl-ibt"], secmeli: ["ap-calculus-ab"], notlar: {} },
    uyarilar: [{ metin: "Sahte uyarı: AP kabul şartı değil.", kaynak: "https://www.polimi.it" }],
    acikKararlar: []
  }
};
module.exports = { FIXTURE };
if (require.main !== module) return;

const ROOT = path.resolve(__dirname, "../..");
const R = require(path.join(ROOT, "assets", "js", "rota.js"));
const E = require(path.join(ROOT, "assets", "js", "eposta.js"));
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (c || x === undefined ? "" : " -> " + JSON.stringify(x))); if (c) pass++; else fail++; };
const ids = c => c.adimlar.map(a => a.id);

// 1. Mezuniyet yılı eposta.js ile aynı (kod çoğaltılmadı)
ok(R.mezuniyetYili({ sinif: "11" }, "2026-10-12") === 2028 && E.mezuniyetYili("11", null, new Date(2026, 9, 12)) === 2028, "11. sınıf 2026-10-12 -> 2028 (eposta.js ile aynı)");
ok(R.mezuniyetYili({ sinif: "12" }, "2026-10-12") === 2027, "12. sınıf -> 2027");
ok(R.mezuniyetYili({ sinif: "mezun", mezuniyetYili: "2025" }, "2026-10-12") === 2025, "mezun -> profildeki yıl");
ok(!/SINIF_FARKI|getMonth\(\) >= 8/.test(fs.readFileSync(path.join(ROOT, "assets", "js", "rota.js"), "utf8")), "rota.js mezuniyet hesabını kopyalamıyor");

// 2. aktifRota
ok(R.aktifRota({ ulkeler: ["de", "it"] }) === "de", "aktifRota: varsayılan ilk ülke");
ok(R.aktifRota({ ulkeler: ["de", "it"], aktifRota: "it" }) === "it", "aktifRota: profildeki seçim");
ok(R.aktifRota({ ulkeler: ["de", "it"], aktifRota: "it" }, "de") === "de", "aktifRota: ?ulke= önce gelir");
ok(R.aktifRota({ ulkeler: ["it"], aktifRota: "de" }, "de") === "it", "aktifRota: profilde olmayan ülke reddedilir");
ok(R.aktifRota({ ulkeler: [] }) === null, "aktifRota: ülke yoksa null");

// 3. Şema
ok(R.rotaDogrula(FIXTURE.de).length === 0 && R.rotaDogrula(FIXTURE.it).length === 0, "sahte veri şemaya uyuyor");
ok(R.rotaDogrula({ ad: "x", temelKural: {}, adimlar: [{ id: "a", baslik: "b", zaman: { ay: 13 } }, { id: "a", baslik: "c" }] }).length === 2, "şema: geçersiz ay + tekrar eden id yakalanır");

// 4. Zaman çizelgesi — 11. sınıf, 12 Ekim 2026
const c11 = R.zamanCizelgesi(FIXTURE.de, { sinif: "11" }, "2026-10-12");
ok(c11.mezuniyetYili === 2028 && c11.adimlar.length === 7 && c11.gizlenen === 0, "11: 7 adım, gizlenen yok", { n: c11.adimlar.length, g: c11.gizlenen });
ok(ids(c11).join() === "de-ap-kayit,de-uni-teyit,de-ielts,de-yks,de-yks-yerlesme,de-uniassist,de-vize", "11: tarihe göre sıralı, tarihsiz en sonda (eşit tarihte veri sırası)", ids(c11));
const ap = c11.adimlar[0];
ok(ap.tarih.yil === 2026 && ap.tarih.ay === 11 && ap.tarih.etiket === "Kasım 2026" && ap.zamanDurumu === "gelecek", "11: AP kaydı Kasım 2026, gelecek", ap.tarih);
ok(c11.siradaki && c11.siradaki.id === "de-ap-kayit" && ap.siradaki, "11: sıradaki adım = AP kaydı");
ok(c11.adimlar.find(a => a.id === "de-yks-yerlesme").tarih.etiket === "Temmuz 2028" && c11.adimlar.find(a => a.id === "de-yks-yerlesme").tarih.metin.includes("Temmuz–Ağustos"), "11: YKS yerleşme Temmuz 2028 + metin");
ok(c11.adimlar.find(a => a.id === "de-vize").zamanDurumu === "belirsiz", "tarihsiz adım: belirsiz");

// 5. 12. sınıf: farklı tarih ve adımlar
const c12 = R.zamanCizelgesi(FIXTURE.de, { sinif: "12" }, "2026-10-12");
ok(c12.mezuniyetYili === 2027 && c12.gizlenen === 1 && !ids(c12).includes("de-ap-kayit"), "12: yalnız-11 adımı gizlendi", { g: c12.gizlenen });
const t12 = c12.adimlar.find(a => a.id === "de-uni-teyit");
ok(t12.tarih.etiket === "Aralık 2025" && t12.zamanDurumu === "gecmis" && !t12.gecikti, "12: teyit Aralık 2025, geçmiş, seçmeli olduğu için gecikmiş sayılmaz", t12);
ok(c12.adimlar.find(a => a.id === "de-ielts").tarih.etiket === "Şubat 2026" && c12.adimlar.find(a => a.id === "de-ielts").gecikti, "12: IELTS Şubat 2026 geçmiş + zorunlu -> gecikti");
ok(c12.siradaki.id === "de-yks" && c12.adimlar.find(a => a.id === "de-yks").tarih.etiket === "Haziran 2027", "12: sıradaki YKS Haziran 2027");
ok(c12.sayac.gecikmis === 1, "12: 1 gecikmiş adım", c12.sayac);

// 6. Bu ay
const buay = R.zamanCizelgesi(FIXTURE.de, { sinif: "11" }, "2026-11-03");
ok(buay.adimlar[0].zamanDurumu === "buay" && buay.siradaki.id === "de-ap-kayit", "Kasım 2026'da AP kaydı 'bu ay'");

// 7. Durum: yapıldı
let st = R.adimIsaretle({}, "de", "de-ap-kayit", true, "2026-10-12");
ok(st.de.adimlar["de-ap-kayit"].durum === "yapildi" && st.it && st.it.adimlar, "adimIsaretle: yapıldı + şema normalize");
const c11b = R.zamanCizelgesi(FIXTURE.de, { sinif: "11" }, "2026-10-12", st.de);
ok(c11b.adimlar[0].yapildi && c11b.siradaki.id === "de-uni-teyit" && c11b.sayac.yapildi === 1, "yapılan adım atlanır, sıradaki ilerler");
st = R.adimIsaretle(st, "de", "de-ap-kayit", false);
ok(st.de.adimlar["de-ap-kayit"].durum === "bekliyor", "işaret geri alınır");
st = R.belgeIsaretle(st, "de", "de-b-diploma", true);
ok(st.de.belgeler["de-b-diploma"] === true && R.belgeIsaretle(st, "de", "de-b-diploma", false).de.belgeler["de-b-diploma"] === undefined, "belgeIsaretle aç/kapat");
ok(JSON.stringify(R.durumNormalize({ de: { adimlar: { x: "bozuk", y: { durum: "zzz" } }, belgeler: { a: "evet", b: true } }, xx: 1 })) === JSON.stringify({ de: { adimlar: { y: { durum: "bekliyor", tarih: null } }, belgeler: { b: true } }, it: { adimlar: {}, belgeler: {} } }), "durumNormalize bozuk girdiyi temizler");
ok(R.adimIsaretle({}, "xx", "x", true).xx === undefined, "tanınmayan ülke yazılmaz");
// Tur 11 (D7): 15 ülke ve YL anahtarı genel yol haritası için yazılabilir
ok(R.adimIsaretle({}, "fr", "genel-vize", true).fr.adimlar["genel-vize"].durum === "yapildi" && R.adimIsaretle({}, "nl-yl", "genel-vize", true)["nl-yl"] && R.durumNormalize({ "nl-yl": { adimlar: { a: { durum: "yapildi" } } } })["nl-yl"].adimlar.a.durum === "yapildi", "Tur 11: fr ve nl-yl durum anahtarları yazılır ve korunur");

// 8. Panel: sıradaki n adım
const s3 = R.siradakiAdimlar(c11b, 3);
ok(s3.map(a => a.id).join() === "de-uni-teyit,de-ielts,de-yks", "siradakiAdimlar(3)", s3.map(a => a.id));

// 9. Sınavlar
ok(R.sinavRolu(FIXTURE.de, "toefl-ibt") === "zorunlu" && R.sinavRolu(FIXTURE.de, "ap-chemistry") === "secmeli" && R.sinavRolu(FIXTURE.de, "cent-s") === null, "sinavRolu: a|b zorunlu, seçmeli, ilgisiz");
ok(R.alternatifler(FIXTURE.it, "til-i").join() === "cent-s,polimi-tol,sat", "alternatifler (biri yeterli)");
ok(R.sinavGruplari(FIXTURE.it).zorunlu.length === 2, "sinavGruplari");

// 10. İtalya + prova CEnT-S yalnızca 11
const i11 = R.zamanCizelgesi(FIXTURE.it, { sinif: "11" }, "2026-10-12");
const i12 = R.zamanCizelgesi(FIXTURE.it, { sinif: "12" }, "2026-10-12");
ok(ids(i11).includes("it-cents-prova") && !ids(i11).includes("it-polito-tili") && i11.siradaki.id === "it-cents-prova", "İtalya 11: prova CEnT-S var, TIL-I yok, sıradaki prova");
ok(!ids(i12).includes("it-cents-prova") && ids(i12).includes("it-polito-tili") && i12.adimlar.find(a => a.id === "it-polito-tili").tarih.etiket === "Mart 2027", "İtalya 12: prova yok, TIL-I Mart 2027");

// 11. Şablon sırası ve bağlı hedefler
const SB = [{ id: "it-a", ulke: "it" }, { id: "g", ulke: "genel" }, { id: "de-x", ulke: "de" }, { id: "de-uniassist-ap-yks", ulke: "de" }, { id: "de-uni-ap-yks-teyit", ulke: "de" }];
ok(R.sablonSirala(SB, "de", FIXTURE.de).map(s => s.id).join() === "de-uniassist-ap-yks,de-uni-ap-yks-teyit,de-x,g,it-a", "sablonSirala: rota şablonları > ülke > genel > diğer");
ok(R.sablonSirala(SB, "it", null).map(s => s.id).join() === "it-a,g,de-x,de-uniassist-ap-yks,de-uni-ap-yks-teyit", "sablonSirala: rota verisi yokken ülkeye göre");
ok(R.bagliHedef({ sablon: "de-uni-ap-yks-teyit" }).href === "/basvurular?sablon=de-uni-ap-yks-teyit" && R.bagliHedef({ sinav: "ielts-academic" }).href === "/sinavlar#ielts-academic" && R.bagliHedef({ sayfa: "universiteler.html#de" }).href === "/universiteler#de", "bagliHedef: şablon/sınav/sayfa");
ok(R.bagliHedef({ sayfa: "javascript:alert(1)" }) === null && R.bagliHedef({ sayfa: "https://x.de" }) === null && R.bagliHedef(null) === null, "bagliHedef: güvensiz yol reddedilir");

// 12. Gerçek veri (varsa)
const REAL = path.join(ROOT, "data", "mevzuat", "ulke-rotalari.js");
if (fs.existsSync(REAL)) {
  global.window = {};
  require(REAL);
  const RR = global.window.APMEBERRA_ROTALAR;
  delete global.window;
  ok(RR && typeof RR === "object", "gerçek data/mevzuat/ulke-rotalari.js yüklendi");
  const SINAV = (() => { global.window = {}; require(path.join(ROOT, "data", "mevzuat", "sinavlar.js")); const x = global.window.APMEBERRA_SINAVLAR; delete global.window; return x.map(s => s.id); })();
  const SABLON = (() => { global.window = {}; require(path.join(ROOT, "data", "kocluk", "eposta-sablonlari.js")); const x = global.window.APMEBERRA_EPOSTA_SABLONLARI; delete global.window; return x.map(s => s.id); })();
  ["de", "it"].forEach(u => {
    const r = RR && RR[u];
    if (!r) { ok(false, `gerçek veri: ${u} rotası yok`); return; }
    const sorun = R.rotaDogrula(r);
    ok(sorun.length === 0, `gerçek veri ${u}: şema (${sorun.length} sorun)`, sorun);
    const g = R.sinavGruplari(r), tumSinav = [].concat(...g.zorunlu, ...g.secmeli);
    const bagliSinav = r.adimlar.map(a => a.bagli && a.bagli.sinav).filter(Boolean);
    const bilinmeyen = tumSinav.concat(bagliSinav).filter(id => !SINAV.includes(id));
    ok(bilinmeyen.length === 0, `gerçek veri ${u}: sınav id'leri data/mevzuat/sinavlar.js'te var`, bilinmeyen);
    const bs = r.adimlar.map(a => a.bagli && a.bagli.sablon).filter(Boolean).filter(id => !SABLON.includes(id));
    ok(bs.length === 0, `gerçek veri ${u}: şablon id'leri data/kocluk/eposta-sablonlari.js'te var`, bs);
    const sayfa = r.adimlar.map(a => a.bagli && a.bagli.sayfa).filter(Boolean).filter(h => !fs.existsSync(path.join(ROOT, h.split(/[?#]/)[0])));
    ok(sayfa.length === 0, `gerçek veri ${u}: bağlı sayfalar mevcut`, sayfa);
    const c1 = R.zamanCizelgesi(r, { sinif: "11" }, "2026-10-12"), c2 = R.zamanCizelgesi(r, { sinif: "12" }, "2026-10-12");
    console.log(`INFO ${u}: 11. sınıf ${c1.adimlar.length} adım (sıradaki: ${c1.siradaki && c1.siradaki.id} ${c1.siradaki && c1.siradaki.tarih && c1.siradaki.tarih.etiket}); 12. sınıf ${c2.adimlar.length} adım (sıradaki: ${c2.siradaki && c2.siradaki.id})`);
    ok(c1.adimlar.length > 0 && c2.adimlar.length > 0, `gerçek veri ${u}: 11 ve 12 için adım üretildi`);
  });
  // Tur 12 (PM ek işi): adım.dil süzgeci — madde.dil kuralı (alan yoksa iki yola da ait)
  if (RR.de && RR.de.adimlar.some(a => a.id === "de-almanca")) {
    const idler = p => R.zamanCizelgesi(RR.de, p, "2026-10-15").adimlar.map(a => a.id);
    ok(!idler({ sinif: "11", egitimDili: "yerel" }).includes("de-almanca"), "Tur 12: de + yerel -> de-almanca gösterilmez");
    ok(idler({ sinif: "11", egitimDili: "en" }).includes("de-almanca"), "Tur 12: de + en -> de-almanca var");
    ok(idler({ sinif: "11" }).includes("de-almanca"), "Tur 12: profilde egitimDili yok -> en varsayılır, de-almanca var");
    const cy = R.zamanCizelgesi(RR.de, { sinif: "11", egitimDili: "yerel" }, "2026-10-15");
    ok(cy.gizlenenDil === RR.de.adimlar.filter(a => a.dil === "en" && R.sinifUygun(a, "11") && R.kosulUygun(a, { sinif: "11" })).length && cy.egitimDili === "yerel", "Tur 12: gizlenenDil sayısı ve egitimDili alanı", { gizlenenDil: cy.gizlenenDil });
    const yerelIdler = idler({ sinif: "11", egitimDili: "yerel" }), enIdler = idler({ sinif: "11", egitimDili: "en" });
    ok(enIdler.filter(id => !yerelIdler.includes(id)).every(id => RR.de.adimlar.find(a => a.id === id).dil === "en"), "Tur 12: yerel yolda yalnız dil=en adımları düşer, dilsiz adımlar iki yolda da var");
    ok(R.dilUygun({ id: "x" }, "yerel") && R.dilUygun({ id: "x", dil: "en" }, undefined) && !R.dilUygun({ id: "x", dil: "yerel" }, "en"), "Tur 12: dilUygun (alan yok -> iki yol; dil seçimi yok -> süzme yok; yerel adım en yolunda yok)");
    ok(R.adimUygun(RR.de.adimlar.find(a => a.id === "de-almanca"), { sinif: "11", egitimDili: "en" }) && !R.adimUygun(RR.de.adimlar.find(a => a.id === "de-almanca"), { sinif: "11", egitimDili: "yerel" }), "Tur 12: adimUygun dil süzgecini içerir");
    ok(R.rotaDogrula({ ad: "x", temelKural: {}, adimlar: [{ id: "a", baslik: "b", dil: "fr" }] }).some(x => /dil en \| yerel/.test(x)), "Tur 12: rotaDogrula geçersiz dil değerini bildirir");
    const M = require(path.join(ROOT, "assets", "js", "sartlar-motor.js"));
    const yh = d => M.yolHaritasi(RR.de, "11", "2026-10-15", d).adimlar.map(a => a.id);
    ok(!yh("yerel").includes("de-almanca") && yh("en").includes("de-almanca") && yh().includes("de-almanca"), "Tur 12: sartlar yolHaritasi dil parametresi (yerel yok, en var, verilmezse var)");
    ok(M.yolHaritasi(RR.de, "11", "2026-10-15", "yerel").gizlenenDil >= 1 && M.yolHaritasi(RR.de, "11", "2026-10-15", "en").gizlenenDil === 0, "Tur 12: yolHaritasi gizlenenDil sayacı");
  }
  const prova = RR && RR.it && RR.it.adimlar.find(a => /prova/i.test(a.baslik || ""));
  if (prova) ok(prova.zorunlu === false && JSON.stringify(prova.siniflar) === '["11"]', "gerçek veri: prova CEnT-S yalnız 11, zorunlu değil (§8.3)", prova);
} else {
  console.log("INFO data/mevzuat/ulke-rotalari.js yok: gerçek veri denetimi atlandı");
}

console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi.`);
process.exit(fail ? 1 : 0);
