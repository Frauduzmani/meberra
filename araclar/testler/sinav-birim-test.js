// Tur 12 — sınav süzgeci motoru birim testi (tarayıcı gerekmez). Çalıştır: node araclar/testler/sinav-birim-test.js
// Kapsam: secimCoz/secimAdres (URL > profil > varsayılan, eski adresler), dil sınıflaması (kod/dizi/Türkçe ad/ülkeye göre yerel),
// düzey varsayılanları, suz (model × ülke × dil), sekme sırası/AP gizleme, şema denetimi, gerçek sinavlar.js 0 sorun,
// yl-genel.dilSinavlari (16) önizleme fixture'ı ile 15 ülke × 2 dil, birlestir + araclar/sinav-aktar.js (geçici dosyada).
"use strict";
const path = require("path");
const fs = require("fs");
const os = require("os");
const vm = require("vm");
const { execFileSync } = require("child_process");
const ROOT = path.join(__dirname, "..", "..");
const SM = require(path.join(ROOT, "assets", "js", "sinav-motor.js"));
let pass = 0, fail = 0;
const ok = (c, m, x) => { if (!c) console.log("FAIL " + m + (x === undefined ? "" : " -> " + JSON.stringify(x).slice(0, 400))); c ? pass++ : fail++; };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m, { gelen: a, beklenen: b });
const yukle = rel => { const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.resolve(ROOT, rel), "utf8"), ctx); return ctx.window; };

// Süzgeç ve aktarım testleri SABİT fixture ile çalışır (aktarım öncesi 18 kayıt; arsiv v11.0): diskteki sinavlar.js'in
// durumu (PM aktarımı öncesi/sonrası) sonucu etkilemez. Gerçek veri ayrıca §11'de tutarlılık için denetlenir.
const FIXTURE_REL = "araclar/testler/fixture/sinavlar-tur11.js";
const FIXTURE_YOL = path.join(ROOT, FIXTURE_REL);
const SINAVLAR = yukle(FIXTURE_REL).APMEBERRA_SINAVLAR;
const GERCEK = yukle("data/mevzuat/sinavlar.js").APMEBERRA_SINAVLAR;
const DIZIN = yukle("data/mevzuat/ulke-dizini.js").APMEBERRA_ULKE_DIZINI;
const YLG = yukle("data/mevzuat/yl-genel.js").APMEBERRA_YL_GENEL;
const DK = {}; DIZIN.ulkeler.forEach(u => { DK[u.kod] = u; });

// 1) secimCoz: URL > profil > varsayılan
const C = (q, p) => { const c = SM.secimCoz(q, p); return [c.model, c.sinif, c.ulke, c.dil, c.duzey, c.filtre]; };
const MATRIS = [
  ["", null, [null, null, null, "hepsi", null, null]],
  ["?ulke=de", null, [null, null, "de", "hepsi", null, null]],
  ["?ulke=it&sinif=mezun", null, ["lise-mezun", null, "it", "hepsi", "lisans", null]],
  ["?model=lise&sinif=11&ulke=de&dil=yerel", null, ["lise", "11", "de", "yerel", "lisans", null]],
  ["?model=uni-mezun&ulke=se&dil=en", null, ["uni-mezun", null, "se", "en", "yl", null]],
  ["?model=uni-mezun&sinif=11", null, ["uni-mezun", null, null, "hepsi", "yl", null]],
  ["?model=lise-mezun&ulke=fr&dil=yerel", null, ["lise-mezun", null, "fr", "yerel", "lisans", null]],
  ["?ulke=ie&dil=yerel", null, [null, null, "ie", "en", null, null]],
  ["?ulke=hepsi&dil=hepsi", null, [null, null, "hepsi", "hepsi", null, null]],
  ["?filtre=rota", null, [null, null, null, "hepsi", null, "rota"]],
  ["?model=XX&ulke=us&dil=fr&filtre=zz", null, [null, null, null, "hepsi", null, null]],
  ["?ulke=%ZZ", null, [null, null, null, "hepsi", null, null]],
  ["?model=LISE&sinif=9#ielts-academic", null, ["lise", "9", null, "hepsi", "lisans", null]],
  // profil varsayılanı
  ["", { ogrenciModeli: "uni-mezun", egitimDili: "yerel", ulkeler: ["se"] }, ["uni-mezun", null, null, "yerel", "yl", null]],
  ["", { sinif: "11", ulkeler: ["de", "it"] }, ["lise", "11", null, "hepsi", "lisans", null]],
  ["", { sinif: "11", egitimDili: "en" }, ["lise", "11", null, "en", "lisans", null]],
  ["", { sinif: "mezun" }, ["lise-mezun", null, null, "hepsi", "lisans", null]],
  ["", { sinif: "lisans-mezun" }, ["uni-mezun", null, null, "hepsi", "yl", null]],
  ["?model=lise-mezun&dil=hepsi", { ogrenciModeli: "uni-mezun", egitimDili: "en" }, ["lise-mezun", null, null, "hepsi", "lisans", null]],
  ["?dil=yerel", { ogrenciModeli: "lise", sinif: "10", egitimDili: "en" }, ["lise", "10", null, "yerel", "lisans", null]]
];
MATRIS.forEach(([q, p, b]) => eq(C(q, p), b, "secimCoz " + (q || "(boş)") + (p ? " + profil " + JSON.stringify(p) : "")));
const k1 = SM.secimCoz("?model=lise", { egitimDili: "yerel" }).kaynak;
ok(k1.model === "url" && k1.dil === "profil" && k1.ulke === "yok", "secimCoz kaynak bilgisi (url/profil/yok)", k1);
SM.ULKE_KODLARI.forEach(u => ok(SM.secimCoz("?ulke=" + u).ulke === u, "secimCoz 15 ülke: " + u));

// 2) secimAdres
eq(SM.secimAdres("sinavlar.html", { model: "lise", sinif: "11", ulke: "de", dil: "yerel" }), "sinavlar.html?model=lise&sinif=11&ulke=de&dil=yerel", "secimAdres tam");
eq(SM.secimAdres("sinavlar.html", { model: "uni-mezun", sinif: "11", ulke: "se", dil: "en" }), "sinavlar.html?model=uni-mezun&ulke=se&dil=en", "secimAdres uni-mezun sınıf yazmaz");
eq(SM.secimAdres("sinavlar.html", { dil: "hepsi" }), "sinavlar.html", "secimAdres boş seçim");
eq(SM.secimAdres("sinavlar.html", { ulke: "ie", dil: "yerel" }), "sinavlar.html?ulke=ie&dil=en", "secimAdres İrlanda yerel -> en");
eq(SM.secimAdres("sinavlar.html", { model: "lise", filtre: "rota" }), "sinavlar.html?model=lise&filtre=rota", "secimAdres filtre=rota");
eq(SM.secimAdres("x.html", { model: "lise-mezun", ulke: "hepsi", dil: "hepsi" }), "x.html?model=lise-mezun&ulke=hepsi&dil=hepsi", "secimAdres ulke=hepsi");
// Gidiş-dönüş
[["lise", "12", "nl", "en"], ["lise-mezun", null, "fr", "yerel"], ["uni-mezun", null, "cz", "hepsi"]].forEach(([m, s, u, d]) => {
  const c = SM.secimCoz(SM.secimAdres("", { model: m, sinif: s, ulke: u, dil: d }).replace(/^[^?]*/, ""));
  eq([c.model, c.sinif, c.ulke, c.dil], [m, s, u, d], "secimAdres -> secimCoz gidiş-dönüş " + [m, s, u, d].join("·"));
});

// 3) Dil sınıflaması
eq(SM.sinavDilleri({ kategori: "Dil Sınavı" }), ["en"], "dil yok + Dil Sınavı -> en (IELTS/TOEFL)");
eq(SM.sinavDilleri({ kategori: "AP" }), [], "dil yok + AP -> bilinmiyor");
eq(SM.sinavDilleri({ dil: "Almanca" }), ["de"], "Türkçe ad Almanca -> de");
eq(SM.sinavDilleri({ dil: "Lehçe / Çekçe / Macarca" }), ["pl", "cs", "hu"], "çoklu Türkçe ad");
eq(SM.sinavDilleri({ dil: "Fince (İsveççe de var)" }), ["fi", "sv"], "serbest metin içinde dil adları");
eq(SM.sinavDilleri({ dil: ["de", "en"] }), ["de", "en"], "kod dizisi");
eq(SM.sinavDilleri({ dil: "yerel" }), ["yerel"], "yerel belirteci");
eq(SM.sinavDilleri({ dil: "İngilizce" }), ["en"], "İngilizce -> en");
eq(SM.sinavDilleri({ dil: "Hollandaca" }), ["nl"], "Hollandaca eş anlamlı");
eq(SM.sinavDilleri({ dil: "Klingon" }), [], "tanınmayan dil -> boş");
const DELF = { id: "delf", kategori: "Dil Sınavı", ulkeler: ["fr", "be", "ch"], dil: "fr" };
ok(SM.dilTuru(DELF, "fr").yerel && SM.dilTuru(DELF, "be").yerel && SM.dilTuru(DELF, "ch").yerel, "DELF: fr, be, ch'de yerel");
ok(SM.dilTuru(DELF, "de").diger && !SM.dilTuru(DELF, "de").yerel, "DELF: Almanya'da 'diğer' (yerel değil)");
ok(SM.dilTuru(DELF, null).yerel, "ülke yokken İngilizce dışı dil yerel sayılır");
const IELTS = SINAVLAR.find(s => s.id === "ielts-academic");
ok(SM.dilTuru(IELTS, "ie").en && SM.dilTuru(IELTS, "ie").yerel, "İrlanda: İngilizce sınav hem en hem yerel");
ok(SM.dilUygun(IELTS, "en", "de") && !SM.dilUygun(IELTS, "yerel", "de") && SM.dilUygun(IELTS, "hepsi", "de"), "IELTS: de'de en ve hepsi var, yerel yok");
ok(SM.dilUygun(DELF, "yerel", "fr") && !SM.dilUygun(DELF, "en", "fr") && !SM.dilUygun(DELF, "hepsi", "de"), "DELF: fr'de yerel; en'de yok; de'de hiç yok");
const AP = SINAVLAR.find(s => s.id === "ap-calculus-ab");
ok(SM.dilUygun(AP, "en", "de") && SM.dilUygun(AP, "yerel", "de"), "AP: dil bilgisi yok -> dil süzgecinden etkilenmez");
const TESTAS2 = { id: "t", kategori: "Giriş Sınavı", ulkeler: ["de"], dil: ["de", "en"] };
ok(SM.dilUygun(TESTAS2, "en", "de") && SM.dilUygun(TESTAS2, "yerel", "de"), "iki dilli sınav iki yolda da");
ok(SM.yerelDiller("ch", DK.ch).join() === "de,fr,it" && SM.yerelDiller("be").join() === "nl,fr", "yerelDiller dizin ve sabit tablo");
ok(SM.ULKE_KODLARI.every(u => JSON.stringify(SM.YEREL_DIL[u]) === JSON.stringify(DK[u].yerelDil)), "YEREL_DIL sabit tablosu ulke-dizini.js ile aynı (15 ülke)");
eq(SM.dilEtiketi({ dil: ["de", "en"] }), "Almanca / İngilizce", "dilEtiketi");

// 4) Düzey ve model
eq(SM.duzeyleri(AP), ["lisans"], "AP varsayılan düzey lisans");
eq(SM.duzeyleri({ id: "sat", kategori: "Giriş Sınavı" }), ["lisans"], "Giriş Sınavı varsayılan lisans");
eq(SM.duzeyleri(IELTS), ["lisans", "yl"], "Dil Sınavı varsayılan iki düzey");
eq(SM.duzeyleri({ id: "gre-general", kategori: "Giriş Sınavı" }), ["yl"], "gre* -> yl");
eq(SM.duzeyleri({ id: "gmat-focus", kategori: "Giriş Sınavı" }), ["yl"], "gmat* -> yl");
eq(SM.duzeyleri({ id: "x", kategori: "Giriş Sınavı", duzey: ["yl"] }), ["yl"], "açık duzey alanı önceliklidir");
ok(!SM.modelUygun(AP, "uni-mezun") && SM.modelUygun(AP, "lise") && SM.modelUygun(AP, "lise-mezun") && SM.modelUygun(AP, null), "modelUygun AP");
ok(SM.apGizli("uni-mezun") && !SM.apGizli("lise") && !SM.apGizli(null), "apGizli yalnız üniversite mezunu");
eq(SM.sekmeSirasi("lise"), ["AP", "Giriş Sınavı", "Dil Sınavı"], "sekme sırası lise");
eq(SM.sekmeSirasi("lise-mezun"), ["Giriş Sınavı", "Dil Sınavı", "AP"], "sekme sırası lise mezunu");
eq(SM.sekmeSirasi("uni-mezun"), ["Dil Sınavı", "Giriş Sınavı", "AP"], "sekme sırası üniversite mezunu");
eq(SM.sekmeSirasi(null), ["AP", "Giriş Sınavı", "Dil Sınavı"], "sekme sırası model yok");

// 5) suz — gerçek veriyle
const ids = l => l.map(s => s.id);
ok(SM.suz(SINAVLAR, {}).length === SINAVLAR.length, "suz boş seçim: hepsi (" + SINAVLAR.length + ")");
ok(SM.suz(SINAVLAR, { model: "uni-mezun" }).every(s => s.kategori === "Dil Sınavı"), "suz uni-mezun: AP ve lisans giriş sınavları yok");
ok(SM.suz(SINAVLAR, { model: "lise", ulke: "de" }).every(s => s.ulkeler.includes("de")) && !ids(SM.suz(SINAVLAR, { model: "lise", ulke: "de" })).includes("cent-s"), "suz ülke DE: CEnT-S yok");
ok(SM.suz(SINAVLAR, { model: "lise", ulke: ["de", "it"] }).length === SINAVLAR.length, "suz ülke dizisi (hedef ülkelerim de+it): hepsi");
ok(ids(SM.suz(SINAVLAR, { model: "lise", ulke: "de", dil: "yerel" }, { dizin: DK })).every(id => !["ielts-academic", "toefl-ibt"].includes(id)), "suz de+yerel: İngilizce dil sınavı yok");
ok(ids(SM.suz(SINAVLAR, { model: "lise", ulke: "de", dil: "en", kategori: "Dil Sınavı" }, { dizin: DK })).join() === "ielts-academic,toefl-ibt", "suz de+en Dil Sınavı: IELTS, TOEFL");
ok(SM.suz(SINAVLAR, { ulke: "se", dil: "en" }).length === 0, "suz se (veri yok): 0 — sayfa boş durumu gösterir");
ok(SM.suz([null, {}, { id: "" }], {}).length === 0, "suz geçersiz kayıtları atlar");

// 6) Şema
ok(SM.listeDogrula(SINAVLAR).length === 0, "fixture (aktarım öncesi sinavlar.js) şemadan geçer (" + SINAVLAR.length + " kayıt)", SM.listeDogrula(SINAVLAR));
const kotu = SM.sinavDogrula({ id: "X Y", ad: "", kategori: "Q", ulkeler: ["us", "de", "de"], durum: "z", kaynak: "ftp://x", dil: "Klingon", duzey: ["phd"], kesinlik: "Belki", sonKontrol: "2026-13-01", ucret: 5, dersSayfasi: "../x.html" });
["id küçük", "ad eksik", "kategori", "tanınmayan ülke", "tekrar", "durum", "kaynak", "dil tanınmadı", "duzey", "kesinlik", "sonKontrol", "ucret", "dersSayfasi"].forEach(k => ok(kotu.some(x => x.includes(k)), "sinavDogrula yakalar: " + k, kotu));
ok(SM.listeDogrula([{ id: "a", ad: "A", kategori: "AP", ulkeler: ["de"] }, { id: "a", ad: "A", kategori: "AP", ulkeler: ["de"] }]).some(x => /tekrar eden id/.test(x)), "listeDogrula tekrar eden id");
ok(SM.sinavDogrula({ id: "gre-general", ad: "GRE", kategori: "Giriş Sınavı", ulkeler: ["de"], dil: "en", duzey: ["yl"], kesinlik: "Doğrulandı", sonKontrol: "2026-10-15", ucret: "249 USD" }).length === 0, "ek alanlarla geçerli kayıt");

// 7) yl-genel.dilSinavlari (16) önizleme fixture'ı: 15 ülke × 2 dil
const FIX = YLG.dilSinavlari.map(m => SM.ylGenelKaydi(m, DK));
ok(FIX.length === 16 && SM.listeDogrula(FIX).length === 0, "yl-genel 16 kayıt sınav şemasına dönüşür", SM.listeDogrula(FIX));
const TUM = SINAVLAR.concat(FIX);
SM.ULKE_KODLARI.forEach(u => {
  const en = SM.suz(TUM, { model: "uni-mezun", ulke: u, dil: "en", kategori: "Dil Sınavı" }, { dizin: DK });
  const yr = SM.suz(TUM, { model: "uni-mezun", ulke: u, dil: "yerel", kategori: "Dil Sınavı" }, { dizin: DK });
  ok(en.length >= 5, u + ": İngilizce dil sınavları (" + en.length + ")");
  ok(u === "ie" ? yr.length === en.length : (yr.length >= 1 && yr.every(s => SM.sinavDilleri(s).some(d => DK[u].yerelDil.includes(d)))), u + ": yerel dil sınavları ülkenin dilinde (" + yr.length + ")", ids(yr));
});
eq(ids(SM.suz(FIX, { ulke: "fr", dil: "yerel" }, { dizin: DK })), ["yl-dil-fransizca"], "fr yerel: DELF/DALF/TCF");
eq(ids(SM.suz(FIX, { ulke: "ch", dil: "yerel" }, { dizin: DK })).sort(), ["yl-dil-dsh-telc-osd", "yl-dil-fransizca", "yl-dil-goethe", "yl-dil-italyanca", "yl-dil-testdaf"].sort(), "ch yerel: Almanca + Fransızca + İtalyanca");
ok(!ids(SM.suz(FIX, { ulke: "de", dil: "hepsi" }, { dizin: DK })).includes("yl-dil-fransizca"), "de hepsi: Fransızca sınav görünmez");

// 8) birlestir (sinav-aktar çekirdeği)
const r = SM.birlestir(SINAVLAR, [
  { id: "ielts-academic", ulkeler: ["nl", "de"], dil: "en", kesinlik: "Doğrulandı", sonKontrol: "2026-10-15", bilinmeyen: 1 },
  { id: "nt2", ad: "Staatsexamen NT2", kategori: "Dil Sınavı", ulkeler: ["nl", "be"], dil: "Felemenkçe", kaynak: "https://www.staatsexamensnt2.nl" },
  { id: "bozuk", ad: "B", kategori: "Q", ulkeler: ["nl"] },
  { ad: "idsiz" }
]);
const ie = r.liste.find(s => s.id === "ielts-academic");
eq(ie.ulkeler, ["de", "it", "nl"], "birlestir: ulkeler birleşir, mevcut sıra korunur");
ok(ie.kesinlik === "Doğrulandı" && ie.format === IELTS.format && !("bilinmeyen" in ie), "birlestir: izinli alan güncellenir, içerik korunur, bilinmeyen alan yazılmaz");
ok(r.eklenen.join() === "nt2" && r.liste.find(s => s.id === "nt2").durum === "yakinda" && r.liste.find(s => s.id === "nt2").dersSayfasi === null, "birlestir: yeni kayıt varsayılanlarla eklenir");
ok(r.atlanan.some(x => /bozuk/.test(x)) && r.atlanan.some(x => /id yok/.test(x)) && r.atlanan.some(x => /bilinmeyen/.test(x)), "birlestir: geçersiz/kimliksiz/bilinmeyen raporlanır", r.atlanan);
ok(r.liste.length === SINAVLAR.length + 1 && SINAVLAR.find(s => s.id === "ielts-academic").ulkeler.join() === "de,it", "birlestir: girdi listesi değişmez (kopya)");

// 9) araclar/sinav-aktar.js uçtan uca (geçici klasörde; proje dosyası yazılmaz)
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "sinav-aktar-"));
try {
  const girdi = path.join(TMP, "girdi.json"), cikti = path.join(TMP, "sinavlar.js");
  fs.writeFileSync(girdi, JSON.stringify({ sinavlar: [{ id: "toefl-ibt", ulkeler: ["SE"], duzey: "lisans, YL" }], yeniKayitlar: [{ id: "tisus", ad: "Tisus", kategori: "Dil Sınavı", ulkeler: ["se"], dil: "İsveççe", kaynak: [{ url: "https://www.su.se/tisus" }, { url: "https://www.su.se/tisus/en" }] }] }));
  const out = execFileSync(process.execPath, [path.join(ROOT, "araclar", "sinav-aktar.js"), "--girdi", girdi, "--mevcut", FIXTURE_YOL, "--cikti", cikti], { cwd: ROOT, encoding: "utf8" });
  const yeni = yukle(path.relative(ROOT, cikti)).APMEBERRA_SINAVLAR;
  ok(/Eklenen: 1/.test(out) && /Güncellenen: 1/.test(out) && /geri okuma aynı/.test(out), "sinav-aktar: rapor (1 ekleme, 1 güncelleme, geri okuma aynı)", out);
  ok(yeni.length === SINAVLAR.length + 1 && yeni.find(s => s.id === "toefl-ibt").ulkeler.join() === "de,it,se" && JSON.stringify(yeni.find(s => s.id === "toefl-ibt").duzey) === '["lisans","yl"]', "sinav-aktar: ulkeler birleşti, düzey metni diziye çevrildi");
  const t = yeni.find(s => s.id === "tisus");
  ok(t.kaynak === "https://www.su.se/tisus" && t.kaynaklar.map(k => k.url).join() === "https://www.su.se/tisus,https://www.su.se/tisus/en" && !t.not, "sinav-aktar: kaynak dizisi -> ilk adres 'kaynak', tümü 'kaynaklar' (not değişmez)");
  ok(SM.listeDogrula(yeni).length === 0, "sinav-aktar: çıktı şemadan geçer");
  const eskiler = yeni.filter(s => s.id !== "tisus" && s.id !== "toefl-ibt");
  ok(JSON.stringify(eskiler) === JSON.stringify(SINAVLAR.filter(s => s.id !== "toefl-ibt")), "sinav-aktar: diğer kayıtlar birebir korunur");
  const kuru = execFileSync(process.execPath, [path.join(ROOT, "araclar", "sinav-aktar.js"), "--girdi", girdi, "--mevcut", FIXTURE_YOL, "--cikti", path.join(TMP, "yok.js"), "--kuru"], { cwd: ROOT, encoding: "utf8" });
  ok(/--kuru: dosya yazılmadı/.test(kuru) && !fs.existsSync(path.join(TMP, "yok.js")), "sinav-aktar --kuru yazmaz");
  fs.writeFileSync(girdi, JSON.stringify([{ id: "ielts-academic", ulkeler: ["xx"] }]));
  let kod = 0; try { execFileSync(process.execPath, [path.join(ROOT, "araclar", "sinav-aktar.js"), "--girdi", girdi, "--mevcut", FIXTURE_YOL, "--cikti", path.join(TMP, "hata.js")], { cwd: ROOT, encoding: "utf8" }); } catch (e) { kod = e.status; }
  ok(kod === 1 && !fs.existsSync(path.join(TMP, "hata.js")), "sinav-aktar: şema hatasında yazmaz, çıkış kodu 1");
  // Ajan 13 biçimi: mevcutGuncellemeler[{id, alanlar, notEki, gerekce, kaynak[]}] + yeniKayitlar[{..., kaynaklar[]}]
  const g13 = path.join(TMP, "a13.json"), c13 = path.join(TMP, "a13.js");
  fs.writeFileSync(g13, JSON.stringify({ _meta: { not: "x" },
    mevcutGuncellemeler: [{ id: "ap-calculus-ab", alanlar: { ulkeler: ["de", "it", "nl"], dil: "en", duzey: ["lisans"], kesinlik: "Doğrulandı", sonKontrol: "2026-10-15" }, notEki: "Hollanda: Twente 4 AP ister.", gerekce: "PM Kararı 1",
      kaynak: [{ ad: "Twente", url: "https://www.utwente.nl/x", belgeYili: "2026", erisim: "2026-10-15" }, { ad: "iç", url: ".agents/mevzuat/dogrulama/" }] }],
    yeniKayitlar: [{ id: "gre-general", ad: "GRE General Test", kategori: "Giriş Sınavı", kurum: "ETS", ulkeler: ["de"], dil: "en", duzey: ["yl"], kaynak: "https://www.ets.org/gre.html",
      kaynaklar: [{ ad: "ETS", url: "https://www.ets.org/gre.html" }, { ad: "RWTH", url: "https://www.rwth-aachen.de/gre" }], kesinlik: "Doğrulandı", sonKontrol: "2026-10-16", ucret: "249 USD" }],
    tur11Duzeltmeleri: [{ dosya: "x", eski: "y" }] }));
  const o13 = execFileSync(process.execPath, [path.join(ROOT, "araclar", "sinav-aktar.js"), "--girdi", g13, "--mevcut", FIXTURE_YOL, "--cikti", c13], { cwd: ROOT, encoding: "utf8" });
  const l13 = yukle(path.relative(ROOT, c13)).APMEBERRA_SINAVLAR, ab = l13.find(s => s.id === "ap-calculus-ab"), ab0 = SINAVLAR.find(s => s.id === "ap-calculus-ab");
  ok(/Eklenen: 1/.test(o13) && /Güncellenen: 1/.test(o13) && /Atlanan: 0/.test(o13), "Ajan 13 biçimi: 1 ekleme, 1 güncelleme, bilinmeyen alan yok (gerekce ve tur11Duzeltmeleri işlenir/atlanır)", o13);
  ok(ab.not.startsWith(ab0.not) && ab.not.endsWith("Hollanda: Twente 4 AP ister.") && ab.kaynak === ab0.kaynak, "notEki mevcut notun sonuna eklenir, mevcut not ve kaynak korunur");
  ok(ab.kaynaklar.length === 1 && ab.kaynaklar[0].url === "https://www.utwente.nl/x" && /http\(s\) olmayan kaynak atlandı/.test(o13), "güncelleme kaynağı kaynaklar'a eklenir; proje içi yol atlanır ve raporlanır");
  ok(ab.ulkeler.join() === "de,it,nl" && ab.dil === "en" && !("gerekce" in ab) && !("_gerekce" in ab), "alanlar uygulanır; gerekce kayda yazılmaz");
  ok(l13.find(s => s.id === "gre-general").kaynaklar.length === 2 && SM.duzeyleri(l13.find(s => s.id === "gre-general")).join() === "yl", "yeni kayıt kaynaklar dizisiyle eklenir");
  const tekrar = execFileSync(process.execPath, [path.join(ROOT, "araclar", "sinav-aktar.js"), "--girdi", g13, "--mevcut", c13, "--cikti", path.join(TMP, "a13b.js")], { cwd: ROOT, encoding: "utf8" });
  ok(/Eklenen: 0/.test(tekrar) && /Güncellenen: 0/.test(tekrar) && fs.readFileSync(path.join(TMP, "a13b.js"), "utf8") === fs.readFileSync(c13, "utf8"), "aktarım idempotent: ikinci çalıştırmada değişiklik yok (notEki çiftlenmez)", tekrar);
  ok(SM.sinavDogrula(Object.assign({}, ab, { kaynaklar: [{ ad: "x", url: "yerel/yol" }] })).some(x => /kaynaklar/.test(x)), "sinavDogrula: kaynaklar içinde http(s) olmayan adres hatadır");
  const A = require(path.join(ROOT, "araclar", "sinav-aktar.js"));
  const m = A.mevcutOku(FIXTURE_YOL);
  fs.writeFileSync(path.join(TMP, "rt.js"), A.yaz(m.liste, m.baslik));
  ok(JSON.stringify(yukle(path.relative(ROOT, path.join(TMP, "rt.js"))).APMEBERRA_SINAVLAR) === JSON.stringify(SINAVLAR), "sinav-aktar yazıcı: fixture liste gidiş-dönüşte birebir aynı");
} finally { fs.rmSync(TMP, { recursive: true, force: true }); }

// 10) Arayüz bağlantısı: sayfalar motoru yüklüyor
// 11) Gerçek data/mevzuat/sinavlar.js tutarlılığı (PM aktarımı sonrası; içerik değiştirilmez)
{
  ok(SM.listeDogrula(GERCEK).length === 0, "gerçek sinavlar.js şemadan geçer (" + GERCEK.length + " kayıt)", SM.listeDogrula(GERCEK));
  ok(GERCEK.length >= SINAVLAR.length && SINAVLAR.every(s => GERCEK.some(g => g.id === s.id)), "gerçek veri aktarım öncesi 18 kaydın hepsini içerir (" + GERCEK.length + ")");
  const ger = GERCEK.length === 18 ? "aktarım öncesi" : "aktarım sonrası";
  console.log("INFO gerçek sinavlar.js: " + GERCEK.length + " kayıt (" + ger + ")");
  if (GERCEK.length > 18) {
    ok(GERCEK.length === 47, "Tur 12 aktarımı: 47 kayıt", GERCEK.length);
    const tum = [];
    GERCEK.forEach(s => { if (s.kaynak) tum.push([s.id, s.kaynak]); (s.kaynaklar || []).forEach(k => tum.push([s.id, k.url])); });
    ok(tum.every(([, u]) => u.startsWith("https://")), "tüm kaynak ve kaynaklar adresleri https (" + tum.length + ")", tum.filter(([, u]) => !u.startsWith("https://")));
    SM.ULKE_KODLARI.forEach(u => ok(SM.suz(GERCEK, { ulke: u, kategori: "Dil Sınavı" }, { dizin: DK }).length >= 1, "gerçek veri " + u + ": en az 1 dil sınavı"));
    ok(SM.suz(GERCEK, { model: "uni-mezun", ulke: "se", dil: "yerel", kategori: "Dil Sınavı" }, { dizin: DK }).length >= 1, "gerçek veri se: en az 1 yerel (İsveççe) dil sınavı");
    ok(GERCEK.filter(s => s.kategori === "Dil Sınavı").every(s => SM.sinavDilleri(s).length && s.dil != null), "gerçek veri: her dil sınavında açık dil alanı");
    ok(GERCEK.filter(s => s.kategori === "Giriş Sınavı" && SM.duzeyleri(s).join() === "yl").length >= 1, "gerçek veri: en az 1 YL giriş sınavı (GRE/GMAT)");
    // Not: ders içeriği ajanları mevcut notlardaki ünite/soru sayılarını güncelleyebilir; bu yüzden eski metin önek olarak aranmaz.
    // Aktarım denetimi: Ajan 13'ün her notEki metni ilgili notun SONUNDA bir kez geçer ve not ondan önce boş değildir.
    const A13 = path.join(ROOT, ".agents", "mevzuat", "dogrulama", "sinavlar-tur12.json");
    if (fs.existsSync(A13)) {
      const gun = JSON.parse(fs.readFileSync(A13, "utf8")).mevcutGuncellemeler || [];
      ok(gun.length > 0 && gun.every(u => { const g = GERCEK.find(x => x.id === u.id); const n = String(g && g.not || ""), e = String(u.notEki || "").trim(); return !e || (n.endsWith(e) && n.indexOf(e) === n.lastIndexOf(e) && n.length > e.length); }),
        "aktarım: " + gun.length + " notEki mevcut notların sonunda, bir kez (mevcut metin korunmuş)");
    }
    ok(SINAVLAR.every(s => GERCEK.find(x => x.id === s.id).kaynak === s.kaynak), "aktarım mevcut 'kaynak' alanlarını değiştirmedi");
  }
  const A2 = require(path.join(ROOT, "araclar", "sinav-aktar.js"));
  const TMP2 = fs.mkdtempSync(path.join(os.tmpdir(), "sinav-rt-"));
  try {
    const mg = A2.mevcutOku(path.join(ROOT, "data", "mevzuat", "sinavlar.js"));
    fs.writeFileSync(path.join(TMP2, "rt.js"), A2.yaz(mg.liste, mg.baslik));
    const c = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(TMP2, "rt.js"), "utf8"), c);
    ok(JSON.stringify(c.window.APMEBERRA_SINAVLAR) === JSON.stringify(GERCEK), "sinav-aktar yazıcı: gerçek liste gidiş-dönüşte birebir aynı");
  } finally { fs.rmSync(TMP2, { recursive: true, force: true }); }
}

["sinavlar.html", "sartlar.html"].forEach(f => ok(fs.readFileSync(path.join(ROOT, f), "utf8").includes('src="/assets/js/sinav-motor.js"'), f + " sinav-motor.js'i yükler"));

console.log(`\nsinav-birim-test: ${pass} geçti, ${fail} kaldı`);
process.exit(fail ? 1 : 0);
