// Tur 10 (K4) — sartlar-motor.js birim testi + data/mevzuat/sartlar.js şema denetimi (tarayıcı gerekmez)
// Çalıştır (proje klasöründen): node araclar/testler/sartlar-birim-test.js
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const M = require(path.join(ROOT, "assets", "js", "sartlar-motor.js"));
global.window = {};
require(path.join(ROOT, "data", "mevzuat", "sartlar.js"));
require(path.join(ROOT, "data", "mevzuat", "ulke-rotalari.js"));
const VERI = global.window.APMEBERRA_SARTLAR, ROT = global.window.APMEBERRA_ROTALAR;
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m + " -> " + JSON.stringify(a));

// 1) Seçim (URL)
eq(M.secimOku("?ulke=de&sinif=11"), { ulke: "de", sinif: "11" }, "secimOku de/11");
eq(M.secimOku("?sinif=Mezun&ulke=IT"), { ulke: "it", sinif: "mezun" }, "secimOku büyük harf toleransı");
eq(M.secimOku("?ulke=fr&sinif=13"), { ulke: null, sinif: null }, "secimOku geçersiz değerler null");
eq(M.secimOku(""), { ulke: null, sinif: null }, "secimOku boş");
eq(M.secimOku("?ulke=%ZZ"), { ulke: null, sinif: null }, "secimOku bozuk kodlama çökmez");
eq(M.secimUrl("sartlar.html", "it", "mezun"), "sartlar.html?ulke=it&sinif=mezun", "secimUrl");
eq(M.secimUrl("giris.html", "x", "11"), "giris.html?sinif=11", "secimUrl geçersiz ülkeyi yazmaz");
eq(M.sinifAd("mezun"), "Mezun", "sinifAd mezun");

// 2) Göreli zaman
const gz = z => M.goreliZaman(z).etiket;
eq(gz({ mezuniyetGore: -2, ay: 11 }), "11. sınıf · Kasım", "göreli: -2/11");
eq(gz({ mezuniyetGore: -1, ay: 9 }), "12. sınıf · Eylül", "göreli: -1/9");
eq(gz({ mezuniyetGore: 0, ay: 6 }), "12. sınıf · Haziran", "göreli: 0/6");
eq(gz({ mezuniyetGore: 0, ay: 7 }), "Mezuniyet yazı · Temmuz", "göreli: 0/7");
eq(gz({ mezuniyetGore: -1, ay: 7 }), "11. sınıftan sonraki yaz · Temmuz", "göreli: -1/7");
eq(gz({ mezuniyetGore: 0, ay: 9 }), "Mezuniyetten sonra · Eylül", "göreli: 0/9");
eq(gz({ mezuniyetGore: 1, ay: 1 }), "Mezuniyetten sonra · Ocak", "göreli: 1/1");
eq(gz({ metin: "Programa göre" }), "Programa göre", "göreli: yalnızca metin");
ok(M.buYilMi(M.goreliZaman({ mezuniyetGore: -2, ay: 11 }).donem, "11") && !M.buYilMi(M.goreliZaman({ mezuniyetGore: -2, ay: 11 }).donem, "12"), "buYilMi sınıfa göre");

// 3) Mezuniyet yılı (eposta.js tek hesap; 14 Ekim 2026)
eq(["9", "10", "11", "12", "mezun"].map(s => M.mezuniyetYili(s, "2026-10-14")), [2030, 2029, 2028, 2027, null], "mezuniyetYili 9..mezun");

// 4) Şema: gerçek veri dosyası
const sorun = M.veriDogrula(VERI);
ok(sorun.length === 0, "data/mevzuat/sartlar.js şemaya uygun" + (sorun.length ? ": " + sorun.slice(0, 5).join(" | ") : ""));
const toplam = ["de", "it"].reduce((n, u) => n + VERI.ulkeler[u].ortak.length + ["9", "10", "11", "12", "mezun"].reduce((k, s) => k + ["gerekenler", "buYil", "tarihler", "hatalar"].reduce((x, a) => x + VERI.ulkeler[u].siniflar[s][a].length, 0), 0), 0);
console.log("INFO data/mevzuat/sartlar.js madde sayısı: " + toplam);

// 5) Madde doğrulama ve bölümler (sahte veri; projeye yazılmaz)
const iyi = { id: "de-11-test", metin: "Test maddesi.", kaynak: [{ ad: "anabin", url: "https://anabin.kmk.org" }], kesinlik: "Doğrulandı", sonKontrol: "2026-10-14" };
ok(M.maddeDogrula(iyi).length === 0, "geçerli madde");
ok(M.maddeDogrula(Object.assign({}, iyi, { kaynak: [] })).length > 0, "kaynaksız madde reddedilir");
ok(M.maddeDogrula(Object.assign({}, iyi, { kesinlik: "Kesin" })).length > 0, "tanınmayan kesinlik reddedilir");
ok(M.maddeDogrula(Object.assign({}, iyi, { sonKontrol: "2026-02-30" })).length > 0, "geçersiz tarih reddedilir");
ok(M.maddeDogrula(Object.assign({}, iyi, { metin: "<b>x</b>" })).length > 0, "HTML reddedilir");
ok(M.maddeDogrula(Object.assign({}, iyi, { kaynak: [{ ad: "x", url: "javascript:alert(1)" }] })).length > 0, "javascript: adresi reddedilir");
// Gerçek veriden bağımsız boş iskelet (data/mevzuat/sartlar.js dolu olsa da sayımlar sabit kalır)
const bosSinif = () => ({ gerekenler: [], buYil: [], tarihler: [], hatalar: [] });
const bosUlke = ad => ({ ad, ortak: [], siniflar: { "9": bosSinif(), "10": bosSinif(), "11": bosSinif(), "12": bosSinif(), mezun: bosSinif() } });
const sahte = { surum: "test", sonKontrol: null, ulkeler: { de: bosUlke("Almanya"), it: bosUlke("İtalya") } };
ok(M.veriDogrula(sahte).length === 0, "boş iskelet şemaya uygun");
sahte.ulkeler.de.ortak.push(iyi);
sahte.ulkeler.de.siniflar["11"].tarihler.push(Object.assign({}, iyi, { id: "t2", zaman: { mezuniyetGore: 0, ay: 6 } }), Object.assign({}, iyi, { id: "t1", zaman: { mezuniyetGore: -2, ay: 11 } }), { metin: "bozuk" });
const B = M.bolumler(sahte, "de", "11");
eq([B.gerekenler.length, B.tarihler.map(m => m.id), B.atlanan], [1, ["t1", "t2"], 1], "bolumler: ortak + sıralı tarihler, bozuk madde atlandı");
eq(M.bolumler(sahte, "de", "12").tarihler.length, 0, "bolumler: başka sınıfa sızmaz");
ok(M.veriDogrula(sahte).length > 0, "veriDogrula bozuk maddeyi yakalar");

// 6) Genel yol haritası (gerçek ulke-rotalari.js), bağımsız sayımla
for (const u of ["de", "it"]) {
  for (const s of ["9", "10", "11", "12", "mezun"]) {
    const y = M.yolHaritasi(ROT[u], s, "2026-10-14");
    const beklenen = ROT[u].adimlar.filter(a => !Array.isArray(a.siniflar) || !a.siniflar.length || a.siniflar.indexOf(s) >= 0).length;
    ok(y.adimlar.length === beklenen && y.gizlenen === ROT[u].adimlar.length - beklenen, `${u}/${s}: ${y.adimlar.length} adım (beklenen ${beklenen})`);
    if (s === "mezun") ok(y.adimlar.every(a => a.tarih === null && a.goreli), `${u}/mezun: takvim tarihi yok, göreli zaman var`);
  }
}
const de11 = M.yolHaritasi(ROT.de, "11", "2026-10-14");
const ap = de11.adimlar.find(a => a.id === "de-ap-profil");
eq(ap && [ap.tarih, ap.goreli, ap.buYil, ap.gecti], ["Kasım 2026", "11. sınıf · Kasım", true, false], "de/11 AP adımı tarihi");
const sira = id => { const z = ROT.de.adimlar.find(a => a.id === id).zaman || {}; return typeof z.mezuniyetGore === "number" ? z.mezuniyetGore * 100 + (z.ay || 13) : Infinity; };
ok(de11.adimlar.every((a, i, l) => i === 0 || sira(l[i - 1].id) <= sira(a.id)), "yol haritası göreli zamana göre sıralı");
const de12 = M.yolHaritasi(ROT.de, "12", "2026-10-14");
ok(!de12.adimlar.some(a => a.id === "de-ap-profil"), "de/12: yalnızca 9–11 adımı gizli");
const gecmis = M.yolHaritasi(ROT.de, "12", "2027-10-01").adimlar.filter(a => a.gecti).length;
ok(gecmis > 0, "ileri tarihte geçmiş adımlar işaretlenir (" + gecmis + ")");

console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi.`);
process.exit(fail ? 1 : 0);
