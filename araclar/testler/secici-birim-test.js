// Tur 11 (D1–D8) — seçici ve motor birim testi (tarayıcı gerekmez). Çalıştır: node araclar/testler/secici-birim-test.js
// Kapsam: secimCoz/secimAdres geriye uyum matrisi (plan §2.3), program durumu, ulkeBolumleri dil süzgeci, universiteSuz (K-B),
// duyuruSuz, genelYol, şema doğrulayıcılar, ozetUyari (K-D), app.js/auth.js/motor/rota.js ülke ve model listelerinin aynılığı.
"use strict";
const path = require("path");
const fs = require("fs");
const ROOT = path.join(__dirname, "..", "..");
const M = require(path.join(ROOT, "assets", "js", "sartlar-motor.js"));
const R = require(path.join(ROOT, "assets", "js", "rota.js"));
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (c || x === undefined ? "" : " -> " + JSON.stringify(x))); c ? pass++ : fail++; };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m, a);

// 1) secimCoz: plan §2.3 uyum matrisi
const C = s => { const c = M.secimCoz(s); return [c.model, c.sinif, c.ulke, c.dil, c.duzey]; };
const MATRIS = [
  ["", [null, null, null, "en", null]],
  ["?ulke=de&sinif=11", ["lise", "11", "de", "en", "lisans"]],
  ["?sinif=mezun", ["lise-mezun", null, null, "en", "lisans"]],
  ["?ulke=it&sinif=mezun", ["lise-mezun", null, "it", "en", "lisans"]],
  ["?sinif=Mezun&ulke=IT", ["lise-mezun", null, "it", "en", "lisans"]],
  ["?model=uni-mezun&sinif=11", ["uni-mezun", null, null, "en", "yl"]],
  ["?model=lise&sinif=mezun", ["lise-mezun", null, null, "en", "lisans"]],
  ["?model=lise-mezun&sinif=12", ["lise-mezun", null, null, "en", "lisans"]],
  ["?ulke=ie&dil=yerel", [null, null, "ie", "en", null]],
  ["?model=lise&sinif=11&ulke=ie&dil=yerel", ["lise", "11", "ie", "en", "lisans"]],
  ["?model=lise&sinif=11&ulke=nl&dil=en", ["lise", "11", "nl", "en", "lisans"]],
  ["?model=uni-mezun&ulke=se&dil=yerel", ["uni-mezun", null, "se", "yerel", "yl"]],
  ["?model=lise&ulke=ch&dil=yerel", ["lise", null, "ch", "yerel", "lisans"]],
  ["?model=LISE&sinif=9", ["lise", "9", null, "en", "lisans"]],
  ["?model=xx&sinif=13&ulke=us&dil=fr", [null, null, null, "en", null]],
  ["?ulke=%ZZ&model=lise", ["lise", null, null, "en", "lisans"]],
  ["?model=lise&model=uni-mezun", ["lise", null, null, "en", "lisans"]],
  ["?sinif=10", ["lise", "10", null, "en", "lisans"]],
  ["?model=lise-mezun&ulke=hu", ["lise-mezun", null, "hu", "en", "lisans"]],
  ["?model=uni-mezun&ulke=cz&dil=en#sr-ilk20", ["uni-mezun", null, "cz", "en", "yl"]]
];
MATRIS.forEach(([q, b]) => eq(C(q), b, "secimCoz " + (q || "(boş)")));
M.ULKE_KODLARI.forEach(k => ok(M.secimCoz("?model=lise-mezun&ulke=" + k).ulke === k, "secimCoz 15 ülke: " + k));
ok(M.secimCoz("?ulke=ie&dil=yerel").notlar.indexOf("ie-yerel") >= 0 && M.secimCoz("?model=uni-mezun&sinif=11").notlar.indexOf("sinif-yok-sayildi") >= 0, "secimCoz notları (ie-yerel, sinif-yok-sayildi)");

// 2) secimAdres: kanonik sıra ve gidiş-dönüş
eq(M.secimAdres("sartlar.html", { model: "lise", sinif: "11", ulke: "nl", dil: "en" }), "sartlar.html?model=lise&sinif=11&ulke=nl&dil=en", "secimAdres kanonik");
eq(M.secimAdres("giris.html", { model: "uni-mezun", sinif: "11", ulke: "se", dil: "yerel" }), "giris.html?model=uni-mezun&ulke=se&dil=yerel", "secimAdres uni-mezun sınıf yazmaz");
eq(M.secimAdres("sartlar.html", { model: "lise-mezun" }), "sartlar.html?model=lise-mezun", "secimAdres ülke yoksa dil yazılmaz");
eq(M.secimAdres("sartlar.html", { model: "lise", sinif: "11", ulke: "ie", dil: "yerel" }), "sartlar.html?model=lise&sinif=11&ulke=ie&dil=en", "secimAdres İrlanda dil=en");
eq(M.secimAdres("sartlar.html", {}), "sartlar.html", "secimAdres boş");
MATRIS.forEach(([q]) => { const c = M.secimCoz(q); const g = M.secimCoz("?" + (M.secimAdres("x", c).split("?")[1] || "")); ok(JSON.stringify([g.model, g.sinif, g.ulke, g.ulke ? g.dil : null]) === JSON.stringify([c.model, c.sinif, c.ulke, c.ulke ? c.dil : null]), "gidiş-dönüş " + (q || "(boş)")); });

// 3) app.js / auth.js / rota.js listeleri motorla aynı
const app = fs.readFileSync(path.join(ROOT, "assets", "js", "app.js"), "utf8");
const appUlke = Object.keys(eval("(" + /APMEBERRA_ULKE_ADLARI = (\{[^}]+\})/.exec(app)[1] + ")"));
const appModel = eval(/APMEBERRA_MODELLER = (\[[^\]]+\])/.exec(app)[1]);
global.window = { localStorage: { getItem: () => null, setItem() {}, removeItem() {}, key: () => null, length: 0 } };
require(path.join(ROOT, "assets", "js", "auth.js"));
const AUTH = global.window.APMEBERRA_AUTH; delete global.window;
eq([appUlke, AUTH.ULKE_KODLARI, R.ULKELER], [M.ULKE_KODLARI, M.ULKE_KODLARI, M.ULKE_KODLARI], "15 ülke listesi app.js = auth.js = rota.js = motor");
eq([appModel, AUTH.MODELLER], [M.MODELLER, M.MODELLER], "model listesi app.js = auth.js = motor");
ok(M.ULKE_KODLARI.every(k => AUTH.ulkeAd(k) === M.ULKE_ADLARI[k] && R.ULKE_AD[k] === M.ULKE_ADLARI[k]), "ülke adları aynı");
// app.js apSecimCoz ile motor secimCoz aynı sonucu verir (aynı kurallar iki yerde)
const apSrc = /function apSecimCoz\(search\) \{[\s\S]*?\n\}/.exec(app)[0];
const apSecimCoz = new Function("APMEBERRA_MODELLER", "APMEBERRA_ULKE_ADLARI", "window", apSrc + "; return apSecimCoz;")(appModel, eval("(" + /APMEBERRA_ULKE_ADLARI = (\{[^}]+\})/.exec(app)[1] + ")"), { location: { search: "" } });
const farkApp = MATRIS.filter(([q]) => { const a = apSecimCoz(q), m = M.secimCoz(q); return JSON.stringify([a.model, a.sinif, a.ulke, a.ulke ? a.dil : null]) !== JSON.stringify([m.model, m.sinif, m.ulke, m.ulke ? m.dil : null]); });
ok(farkApp.length === 0, "app.js apSecimCoz = motor secimCoz (" + MATRIS.length + " durum)", farkApp.map(x => x[0]));

// 4) Program durumu (dizin) ve türetme kuralı (plan §5.2)
const U = (en, yerel) => ({ ad: "U", lisans: { en, yerel }, yuksekLisans: { en: yerel, yerel: en } });
// PM kararı (15 Ekim 2026): özet yalnızca "var" sayısına bakar
const coklu = (n, d) => Array.from({ length: n }, () => U(d));
eq([
  M.programDurumuTuret(coklu(5, "var"), "lisans", "en"),
  M.programDurumuTuret([U("var"), U("var"), U("kismi"), U("var"), U("var")], "lisans", "en"),
  M.programDurumuTuret(coklu(2, "var").concat(coklu(9, "kismi"), coklu(9, "yok")), "lisans", "en"),
  M.programDurumuTuret(coklu(3, "kismi").concat(coklu(2, "yok")), "lisans", "en"),
  M.programDurumuTuret([U("var"), U("yok"), U("yok")], "lisans", "en"),
  M.programDurumuTuret([U("yok"), U("yok")], "lisans", "en"),
  M.programDurumuTuret([U("teyit"), U("teyit"), U("var")], "lisans", "en"),
  M.programDurumuTuret(coklu(6, "var").concat(coklu(7, "teyit")), "lisans", "en"),
  M.programDurumuTuret([], "lisans", "en")],
  ["genis", "kisitli", "kisitli", "kisitli", "kisitli", "yok", "teyit", "genis", "veri-yok"],
  "programDurumuTuret: var≥5 genis; 4 var+1 kısıtlı kisitli; DE örneği (2 var/9 kısıtlı/9 yok) kisitli; yalnız kısıtlı kisitli; yok; çoğunluk teyit; liste yok");
eq(M.programDurumuTuret([U("yok", "var")], "yl", "en"), "kisitli", "programDurumuTuret YL alanını kullanır");
const k1 = { kod: "nl", yerelDil: ["nl"], program: { lisans: { en: "genis", yerel: "kisitli" }, yl: { en: "teyit", yerel: "veri-yok" } } };
eq([M.programDurumu(k1, "lisans", "en"), M.programDurumu(k1, "lisans", "yerel"), M.programDurumu(k1, "yl", "en"), M.programDurumu(null, "lisans", "en")], ["genis", "kisitli", "teyit", "veri-yok"], "programDurumu");
eq(M.programDurumu({ kod: "ie", yerelDil: ["en"], program: { lisans: { en: "genis", yerel: "yok" } } }, "lisans", "yerel"), "genis", "programDurumu İrlanda yerel = en");
eq(M.dilAd("yerel", { yerelDil: ["de", "fr", "it"] }, { de: "Almanca", fr: "Fransızca", it: "İtalyanca" }), "Almanca / Fransızca / İtalyanca", "dilAd çok dilli ülke");
// K-D özet uyarısı
eq(M.ozetUyari({ kod: "se", yerelDil: ["sv"], ozetUyari: { "lisans-en": "Mühendislikte İngilizce lisans çok dar" } }, "lisans", "en"), { metin: "Mühendislikte İngilizce lisans çok dar", kaynak: [] }, "ozetUyari lisans-en");
ok(M.ozetUyari({ kod: "se", ozetUyari: { "lisans-en": "x" } }, "yl", "en") === null && M.ozetUyari({ kod: "se" }, "lisans", "en") === null, "ozetUyari başka düzeyde / alan yoksa null");
ok(M.dizinDogrula({ ulkeler: [] }).length > 0, "dizinDogrula eksik ülkeleri yakalar");

// 5) ulkeBolumleri: dil süzgeci, sınıf notları (dizi ve nesne biçimi), YL
const T = "2026-10-15";
const md = (id, ek) => Object.assign({ id, metin: "Madde " + id, kaynak: [{ ad: "Kaynak", url: "https://example.org" }], kesinlik: "Doğrulandı", sonKontrol: T }, ek || {});
const V = {
  ulke: "nl", ad: "Hollanda", yerelDil: ["nl"],
  lisans: {
    ortak: [md("o1"), md("o2", { dil: "yerel" })],
    en: { gerekenler: [md("en-g")], tarihler: [md("en-t2", { zaman: { mezuniyetGore: 0, ay: 1 } }), md("en-t1", { zaman: { mezuniyetGore: -1, ay: 10 } })], hatalar: [md("en-h")] },
    yerel: { gerekenler: [md("y-g")], tarihler: [], hatalar: [] },
    sinifNotlari: { "11": [md("s11")], mezun: { buYil: [md("mz-b")], tarihler: [md("mz-t", { zaman: { mezuniyetGore: 0, ay: 3 } })] } },
    apEtkisi: [md("ap")], burslar: [md("b1", { dil: "en" }), md("b2", { dil: "yerel" })], uyarilar: [{ metin: "bozuk" }]
  },
  yl: { ortak: [md("yl-o")], en: { gerekenler: [], tarihler: [md("yl-t", { zaman: { hedefYilaGore: 0, ay: 1 } })], hatalar: [] }, yerel: {}, burslar: [],
    ornekProgramlar: [{ universite: "TU Delft", program: "MSc X", dil: "en", url: "https://www.tudelft.nl" }, { universite: "UvA", program: "MSc Y", dil: "yerel", url: "https://www.uva.nl" }, { universite: "Bozuk", program: "Z", url: "ftp://x" }] }
};
ok(M.ulkeVeriDogrula(Object.assign({}, V, { lisans: Object.assign({}, V.lisans, { uyarilar: [] }), yl: Object.assign({}, V.yl, { ornekProgramlar: V.yl.ornekProgramlar.slice(0, 2) }) })).length === 0, "ulkeVeriDogrula örnek veri");
ok(M.ulkeVeriDogrula(V).some(x => /uyarilar/.test(x)), "ulkeVeriDogrula bozuk maddeyi yakalar");
const ids = l => l.map(m => m.id);
let B = M.ulkeBolumleri(V, { model: "lise", sinif: "11", ulke: "nl", dil: "en" });
eq([ids(B.gerekenler), ids(B.buYil), ids(B.tarihler), ids(B.hatalar), ids(B.apEtkisi), ids(B.burslar), B.atlanan, B.var], [["o1", "en-g"], ["s11"], ["en-t1", "en-t2"], ["en-h"], ["ap"], ["b1"], 1, true], "ulkeBolumleri lise/11/en: dil süzgeci, dizi sınıf notu = buYil, tarihler sıralı");
B = M.ulkeBolumleri(V, { model: "lise", sinif: "11", ulke: "nl", dil: "yerel" });
eq([ids(B.gerekenler), ids(B.burslar), ids(B.tarihler)], [["o1", "o2", "y-g"], ["b2"], []], "ulkeBolumleri yerel dil");
B = M.ulkeBolumleri(V, { model: "lise-mezun", ulke: "nl", dil: "en" });
eq([ids(B.buYil), ids(B.tarihler)], [["mz-b"], ["en-t1", "en-t2", "mz-t"]], "ulkeBolumleri lise mezunu: sinifNotlari.mezun nesne biçimi");
B = M.ulkeBolumleri(V, { model: "uni-mezun", ulke: "nl", dil: "en" }, { belgeler: [md("yb")], gre: [{ metin: "bozuk" }] });
eq([ids(B.gerekenler), ids(B.tarihler), B.buYil.length, B.apEtkisi.length, B.ornekProgramlar.map(p => p.universite), ids(B.ylOrtak.belgeler), B.ylOrtak.gre.length], [["yl-o"], ["yl-t"], 0, 0, ["TU Delft"], ["yb"], 0], "ulkeBolumleri YL: ornekProgramlar dile göre, yl-genel geçersiz madde atlanır");
eq(M.ulkeBolumleri(null, { model: "lise", sinif: "9" }).var, false, "ulkeBolumleri veri yoksa var=false");
eq(M.ulkeBolumleri({ ulke: "de", lisans: { ortak: [md("x")] } }, { model: "uni-mezun", ulke: "de", dil: "en" }).var, false, "ulkeBolumleri YL bloğu yoksa var=false (hazırlanıyor)");
eq(M.goreliZaman({ hedefYilaGore: -1, ay: 11 }).etiket, "Başlangıçtan önceki yıl · Kasım", "goreliZaman hedefYilaGore");
ok(M.maddeDogrula(md("zz", { zaman: { hedefYilaGore: 0, ay: 2 } })).length === 0 && M.maddeDogrula(md("zz", { zaman: { hedefYilaGore: "x" } })).length > 0, "maddeDogrula hedefYilaGore");

// 6) universiteSuz (PM K-B: Doğrulanamadı gizlenmez, sonda)
const L = [
  { sira: 3, ad: "C", sehir: "Lund", lisans: { en: "teyit", yerel: "var" } },
  { sira: 1, ad: "A", sehir: "Stockholm", lisans: { en: "var", yerel: "var" } },
  { sira: 2, ad: "B", sehir: "Stockholm", lisans: { en: "kismi", yerel: "var" } },
  { sira: 4, ad: "D", sehir: "Umeå", lisans: { en: "yok", yerel: "var" } }
];
let r = M.universiteSuz(L, { duzey: "lisans", dil: "en" });
eq([r.liste.map(u => u.ad), r.eslesen, r.teyit, r.toplam, r.liste[2]._teyit], [["A", "B", "C"], 2, 1, 4, true], "universiteSuz dil=en: var+kısıtlı sırayla, Doğrulanamadı sonda, yok gizli");
r = M.universiteSuz(L, { duzey: "lisans", dil: "hepsi", q: "stock" });
eq([r.liste.map(u => u.ad), r.teyit], [["A", "B"], 0], "universiteSuz arama (tr küçük harf)");
eq(M.universiteSuz(L, { duzey: "lisans", dil: "yerel", sehir: "Umeå" }).liste.map(u => u.ad), ["D"], "universiteSuz şehir");
ok(!("_teyit" in L[0]), "universiteSuz girdiyi değiştirmez");

// 7) duyuruSuz
const DY = [md("d1", { bitis: "2026-11-15", hedef: { modeller: ["lise-mezun"], ulkeler: ["hu"], diller: [] } }), md("d2", { bitis: "2026-10-01" }), md("d3", { bitis: "2026-12-01", hedef: { modeller: ["uni-mezun"] } })];
eq(ids(M.duyuruSuz(DY, { model: "lise-mezun", ulke: "hu", dil: "en" }, "2026-11-15")), ["d1"], "duyuruSuz bitiş günü dahil, hedef eşleşir");
eq(ids(M.duyuruSuz(DY, { model: "lise-mezun", ulke: "de", dil: "en" }, "2026-10-15")), [], "duyuruSuz ülke eşleşmezse yok");
eq(ids(M.duyuruSuz(DY, { model: "uni-mezun" }, "2026-10-15")), ["d3"], "duyuruSuz ülke süzülmeden (Panelim)");
ok(M.duyuruDogrula([md("x", { bitis: "2026-13-01", hedef: { modeller: ["abc"] } })]).length >= 2, "duyuruDogrula bozuk bitiş ve modeli yakalar");

// 8) genelYol (D7)
const SABLON = [{ id: "g-dil", baslik: "Dil", baslangicaAy: -15 }, { id: "g-vize", baslik: "Vize", baslangicaAy: -4 }, { id: "g-varis", baslik: "Varış", baslangicaAy: 0 }];
let g = M.genelYol(V, SABLON, { model: "lise", sinif: "11", ulke: "nl", dil: "en", duzey: "lisans" }, {}, "2026-10-15");
eq([g.baslangicYili, g.adimlar.map(a => a.id), g.adimlar.map(a => a.tarih)], [2028,
  ["g-dil", "en-t1", "en-t2", "g-vize", "g-varis"],
  ["Haziran 2027", "Ekim 2027", "Ocak 2028", "Mayıs 2028", "Eylül 2028"]], "genelYol lise 11: şablon + zamanlı maddeler, tahmini takvim (Eylül 2028 başlangıç)");
ok(g.adimlar.filter(a => a.genel).every(a => a.kesinlik === "" && !a.kaynak.length) && g.adimlar.filter(a => !a.genel).every(a => a.kesinlik && a.kaynak.length), "genelYol: genel öneri kaynaksız/kesinliksiz, veri adımı kaynaklı");
g = M.genelYol(V, SABLON, { model: "uni-mezun", ulke: "nl", dil: "en", duzey: "yl" }, { hedefYil: "2028" }, "2026-10-15");
eq([g.baslangicYili, g.adimlar.map(a => a.id), g.adimlar[0].goreli], [2028, ["g-dil", "yl-t", "g-vize", "g-varis"], "Başlangıçtan 15 ay önce"], "genelYol YL: profil hedef yılı + hedefYilaGore");
g = M.genelYol(null, SABLON, { model: "lise-mezun", ulke: "fr", dil: "en" }, {}, "2026-10-15");
eq([g.baslangicYili, g.adimlar.length, g.adimlar[0].gecti], [2027, 3, true], "genelYol veri yok: varsayılan hedef 2027, yalnız şablon, geçmiş ay işaretli");

console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi.`);
process.exit(fail ? 1 : 0);
