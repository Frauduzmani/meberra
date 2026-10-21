"use strict";
// v1.12.0 Tam deneme sınavı: plan yapısı, kurulum (yalnız aktif soru, doğru sayılar, hesap makinesi kısımları, ünite ağırlığı),
// sunucu tarafı süre (geç cevap reddi, kendiliğinden kapanma), cevapların sınav bitene kadar gizli olması, bileşik puan hesabı,
// Premium kapısı, deneme geçmişine (veli paneli) yazım.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { olustur } = require("../uygulama");
const T = require("../tamsinav");

let app, base, SAAT = Date.parse("2026-11-02T09:00:00Z");
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, gunlukKonsol: false, varlikOtomatik: false,
    tamSinavSaat: () => SAAT, tamSinavSiniri: 1000 });
  await new Promise(r => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
});
after(() => new Promise(r => app.server.close(r)));

function istemci() {
  let cerez = "";
  return async function iste(yontem, yol, govde) {
    const h = Object.assign({ "Content-Type": "application/json" }, yontem === "GET" ? {} : { "X-Meberra": "1" }, cerez ? { Cookie: cerez } : {});
    const r = await fetch(base + yol, { method: yontem, headers: h, body: govde === undefined ? undefined : JSON.stringify(govde) });
    const sc = r.headers.get("set-cookie");
    if (sc) { const m = /meberra_sid=([^;]*)/.exec(sc); if (m) cerez = m[1] ? "meberra_sid=" + m[1] : ""; }
    const tur = r.headers.get("content-type") || "";
    return { durum: r.status, govde: tur.includes("json") ? await r.json() : await r.text() };
  };
}
const db = () => app.db;
let sayac = 0;
async function ogrenci(premium) {
  const c = istemci(), ep = "tam" + (++sayac) + "@ornek.com";
  const r = await c("POST", "/api/auth/register", { ad: "Ada", soyad: "Kaya", eposta: ep, sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  c.uid = db().prepare("SELECT id FROM users WHERE public_id = ?").get(r.govde.user.id).id;
  if (premium) app.hesap.premiumVer(c.uid, "aylik", null, { kaynak: "elle" });
  return c;
}
const frqAktifEt = ders => db().prepare("UPDATE frq SET durum = 'aktif' WHERE ders = ?").run(ders);
const GIZLI = ["dogru", "dogruSecenek", "aciklama", "cozum", "cozumler", "hatalar", "rubrik", "ornek_cozum", "sik_hatalar"];
function gizliVar(o) {
  if (Array.isArray(o)) return o.some(gizliVar);
  if (o && typeof o === "object") return Object.keys(o).some(k => GIZLI.includes(k) || gizliVar(o[k]));
  return false;
}
const satir = k => db().prepare("SELECT * FROM questions_bank WHERE id = ?").get(k.split("|")[1]);
const plan = id => JSON.parse(db().prepare("SELECT plan FROM tam_sinavlar WHERE id = ?").get(id).plan);

test("plan dosyası: yapı geçerli; Calculus 29+13 MCQ / 2+4 FRQ ve hesap makinesi kuralları; ağırlık 100; eşikler tahmini", () => {
  assert.deepEqual(T.dogrula(), []);
  const P = T.planlar();
  assert.match(P.aciklama, /TAHMİNİ/);
  ["calculus-ab", "calculus-bc", "physics-1", "chemistry", "biology", "english-language", "microeconomics", "macroeconomics", "computer-science-a"].forEach(k => assert.ok(P.sinavlar[k], k));
  const c = P.sinavlar["calculus-ab"].bolumler.map(b => [b.kod, b.tur, b.soru, b.dk, b.hesapMakinesi].join(" "));
  assert.deepEqual(c, ["I-A mcq 29 62 yasak", "I-B mcq 13 38 gerekli", "II-A frq 2 30 gerekli", "II-B frq 4 60 yasak"]);
  assert.equal(P.sinavlar.chemistry.bolumler[0].soru, 60);
  assert.equal(P.sinavlar.chemistry.referans.url, "https://apcentral.collegeboard.org/media/pdf/ap-chemistry-equations-sheet.pdf");
  assert.equal(P.sinavlar["calculus-ab"].referans, null, "Calculus'ta referans sayfası yok");
  assert.equal(P.sinavlar["english-language"].hesapMakinesi, null);
  // Bozuk plan yakalanır
  const bozuk = JSON.parse(JSON.stringify(P)); bozuk.sinavlar["calculus-ab"].agirlik.I = 70; bozuk.sinavlar["calculus-ab"].esikler[1].min = 90;
  const s = T.dogrula(bozuk);
  assert.ok(s.some(x => /ağırlıkları toplamı/.test(x)) && s.some(x => /azalan/.test(x)), s.join("; "));
});

test("saf: ünite kotaları (en büyük kalan + kapasite taşması), bileşik puan ve AP eşikleri", () => {
  const { kota, eksik } = T.kotalar(10, { 1: 50, 2: 30, 3: 20 }, { 1: 100, 2: 1, 3: 100 });
  assert.equal(kota[2], 1, "kapasite sınırı");
  assert.equal(kota[1] + kota[2] + kota[3], 10); assert.equal(eksik, 0);
  assert.ok(kota[1] > kota[3]);
  assert.deepEqual(T.kotalar(5, { 1: 1 }, { 1: 3 }), { kota: { 1: 3 }, eksik: 2 });
  const p = T.planlar().sinavlar["calculus-ab"];
  const k = T.kompozit(p, 60, 40);
  assert.equal(k.kompozit, 50); assert.deepEqual(k.katki, { I: 30, II: 20 }); assert.equal(k.tahminiPuan, 4);
  assert.equal(T.kompozit(p, 20, null).tahminiPuan, 1);
  assert.equal(T.kompozit(p, 58, 58).tahminiPuan, 5);
  const m = T.kompozit(T.planlar().sinavlar.microeconomics, 90, 30);
  assert.equal(m.kompozit, Math.round((66.7 * 90 + 33.3 * 30) / 100 * 10) / 10);
  assert.equal(T.hmDuzey({ hesapMakinesi: "gerekir" }), "gerekli");
  assert.equal(T.hmDuzey({ hesapMakinesi: "basit hesap" }), "yardımcı");
  assert.equal(T.hizOku(undefined), 1, "test dışı ortamda hız 1");
});

test("Premium kapısı: ücretsiz kullanıcı katalog görür, sınav kuramaz (402); oturumsuz 401", async () => {
  const anon = istemci();
  assert.equal((await anon("GET", "/api/tam-sinav/katalog")).durum, 401);
  const o = await ogrenci(false);
  const k = await o("GET", "/api/tam-sinav/katalog");
  assert.equal(k.durum, 200); assert.equal(k.govde.premium, false);
  const r = await o("POST", "/api/tam-sinav/olustur", { kod: "calculus-ab" });
  assert.equal(r.durum, 402); assert.equal(r.govde.premiumGerekli, true); assert.equal(r.govde.neden, "tam-sinav");
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM tam_sinavlar WHERE user_id = ?").get(o.uid).n, 0);
});

test("aktif FRQ yoksa sınav yalnız Bölüm I; havuzu yetersiz derste kurulmaz", async () => {
  db().prepare("UPDATE frq SET durum = 'taslak'").run(); // tohumdaki onay durumundan bağımsız
  const o = await ogrenci(true);
  const k = (await o("GET", "/api/tam-sinav/katalog")).govde;
  const ph = k.sinavlar.find(s => s.kod === "physics-1");
  assert.equal(ph.hazir, true); assert.equal(ph.frqDurumu, "yok");
  const en = k.sinavlar.find(s => s.kod === "english-language");
  const enAktif = db().prepare("SELECT COUNT(*) AS n FROM questions_bank WHERE durum = 'aktif' AND deneme_kodlari LIKE '%\"english-language\"%'").get().n;
  assert.equal(en.hazir, enAktif >= 45, "English: " + enAktif + " aktif soru / 45");
  // Yetersiz havuz: Macro aktif sorularının çoğunu geçici arşive al → kurulamaz (400), taslak/arşiv asla kullanılmaz
  const macro = db().prepare("SELECT id FROM questions_bank WHERE durum = 'aktif' AND unite LIKE 'Macro %'").all().map(x => x.id);
  const gecici = macro.slice(10);
  gecici.forEach(id => db().prepare("UPDATE questions_bank SET durum = 'arsiv' WHERE id = ?").run(id));
  const ym = await o("POST", "/api/tam-sinav/olustur", { kod: "macroeconomics" });
  assert.equal(ym.durum, 400); assert.ok(ym.govde.yetersiz.length);
  gecici.forEach(id => db().prepare("UPDATE questions_bank SET durum = 'aktif' WHERE id = ?").run(id));
  const r = await o("POST", "/api/tam-sinav/olustur", { kod: "physics-1" });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  assert.equal(r.govde.sinav.yalnizMcq, true);
  assert.deepEqual(r.govde.sinav.bolumler.map(b => [b.tur, b.soru]), [["mcq", 42]]);
  // Tek aktif sınav kuralı
  const r2 = await o("POST", "/api/tam-sinav/olustur", { kod: "chemistry" });
  assert.equal(r2.durum, 409); assert.equal(r2.govde.aktifId, r.govde.sinav.id);
  assert.equal((await o("POST", "/api/tam-sinav/" + r.govde.sinav.id + "/birak", {})).durum, 200);
});

let C, SID;
test("kurulum: yalnız aktif sorular, Calculus kısımları doğru sayıda; Kısım A hesap makinesiz; FRQ kısaltılmış Bölüm II", async () => {
  frqAktifEt("calculus-ab");
  // Taslak bir soruya ek kod ekleyip havuzu "kirletelim": yine seçilmemeli
  C = await ogrenci(true);
  const r = await C("POST", "/api/tam-sinav/olustur", { kod: "calculus-ab" });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  SID = r.govde.sinav.id;
  const p = plan(SID);
  assert.deepEqual(p.bolumler.map(b => [b.kod, (b.sorular || b.frq).length, b.sureSn]), [["I-A", 29, 3720], ["I-B", 13, 2280], ["II-A", 2, 1800], ["II-B", 2, 1800]]);
  assert.equal(p.bolumler[3].kisaltilmis, true, "4 yerine 2 FRQ → süre yarıya");
  const tum = p.bolumler[0].sorular.concat(p.bolumler[1].sorular);
  assert.equal(new Set(tum).size, 42, "yinelenen soru yok");
  tum.forEach(k => { const s = satir(k); assert.equal(s.durum, "aktif", k); assert.ok(JSON.parse(s.deneme_kodlari).includes("calculus-ab")); });
  p.bolumler[0].sorular.forEach(k => assert.equal(T.hmDuzey(JSON.parse(satir(k).ek)), "gerekmez", "Kısım A hesap makinesiz: " + k));
  const hmB = p.bolumler[1].sorular.map(k => T.hmDuzey(JSON.parse(satir(k).ek)));
  assert.ok(hmB.filter(x => x !== "gerekmez").length >= 3, "hesap makineli sorular Kısım B'ye: " + hmB.join(","));
  const uniteler = new Set(tum.map(k => satir(k).unite));
  assert.equal(uniteler.size, 8, "8 ünitenin hepsi temsil edilir");
  const u6 = tum.filter(k => satir(k).unite === "6").length, u7 = tum.filter(k => satir(k).unite === "7").length;
  assert.ok(u6 > u7, "Ünite 6 (%17–20) Ünite 7'den (%6–12) fazla");
  p.bolumler[2].frq.concat(p.bolumler[3].frq).forEach(id => assert.equal(db().prepare("SELECT durum FROM frq WHERE id = ?").get(id).durum, "aktif"));
  assert.ok(p.bolumler[2].frq.every(id => JSON.parse(db().prepare("SELECT veri FROM frq WHERE id = ?").get(id).veri).hesapMakinesi === true));
  // Yanıtta doğru cevap / çözüm yok; içerik henüz başlamamış bölüm için gelmez
  assert.equal(gizliVar(r.govde), false);
  assert.equal(r.govde.icerik, undefined);
});

test("süre sunucuda: sıra zorunlu, cevaplar gizli, bitişten sonra cevap reddedilir ve bölüm kendiliğinden kapanır", async () => {
  assert.equal((await C("POST", "/api/tam-sinav/" + SID + "/bolum-baslat", { bolum: 1 })).durum, 409, "önce Kısım A");
  const b = await C("POST", "/api/tam-sinav/" + SID + "/bolum-baslat", { bolum: 0 });
  assert.equal(b.durum, 200);
  assert.equal(b.govde.icerik.sorular.length, 29);
  assert.equal(gizliVar(b.govde), false, "soru içeriğinde doğru şık/çözüm yok");
  assert.equal(b.govde.sinav.bolumler[0].kalanMs, 3720 * 1000);
  const ilk = b.govde.icerik.sorular[0];
  const c1 = await C("POST", "/api/tam-sinav/" + SID + "/cevap", { bolum: 0, i: 0, secim: ilk.options[0].id, sureSn: 40, isaret: true, eleme: ["B"] });
  assert.equal(c1.durum, 200, JSON.stringify(c1.govde));
  assert.equal(gizliVar(c1.govde), false, "cevap kaydı doğru/yanlış söylemez");
  assert.equal((await C("POST", "/api/tam-sinav/" + SID + "/cevap", { bolum: 0, i: 0, secim: "Z" })).durum, 400);
  assert.equal((await C("POST", "/api/tam-sinav/" + SID + "/cevap", { bolum: 1, i: 0, secim: "A" })).durum, 409, "başlamamış bölüm");
  // Tolerans içinde (bitiş + 10 sn) kabul; sonrasında ret
  SAAT += 3720 * 1000 + 10000;
  assert.equal((await C("POST", "/api/tam-sinav/" + SID + "/cevap", { bolum: 0, i: 1, secim: "A" })).durum, 200);
  SAAT += 20000;
  const gec = await C("POST", "/api/tam-sinav/" + SID + "/cevap", { bolum: 0, i: 2, secim: "A" });
  assert.equal(gec.durum, 409); assert.equal(gec.govde.kapandi, true);
  const g = await C("GET", "/api/tam-sinav/" + SID);
  assert.equal(g.govde.sinav.bolumler[0].durum, "kapandi"); assert.equal(g.govde.sinav.bolumler[0].otomatik, true);
  assert.equal(g.govde.cevaplar[0][2], undefined, "geç cevap yazılmadı");
  assert.equal(g.govde.cevaplar[0][0], ilk.options[0].id); assert.equal(g.govde.isaret[0][0], 1); assert.deepEqual(g.govde.eleme[0][0], ["B"]);
  assert.equal(gizliVar(g.govde), false);
  assert.equal((await C("POST", "/api/tam-sinav/" + SID + "/bitir", {})).durum, 409, "bölümler bitmeden sonuç yok");
});

test("tam akış: Kısım B, FRQ teslim → rubrik (önce değil), öz puan, bileşik puan ve tahmini AP puanı; deneme geçmişi ve veli", async () => {
  const p = plan(SID);
  const b1 = await C("POST", "/api/tam-sinav/" + SID + "/bolum-baslat", { bolum: 1 });
  assert.equal(b1.govde.icerik.sorular.length, 13);
  for (let i = 0; i < 13; i++) {
    const r = await C("POST", "/api/tam-sinav/" + SID + "/cevap", { bolum: 1, i, secim: satir(p.bolumler[1].sorular[i]).dogru, sureSn: i === 0 ? 900 : 30 });
    assert.equal(r.durum, 200);
  }
  SAAT += 60000;
  assert.equal((await C("POST", "/api/tam-sinav/" + SID + "/bolum-teslim", { bolum: 1 })).durum, 200);
  assert.equal((await C("POST", "/api/tam-sinav/" + SID + "/cevap", { bolum: 1, i: 0, secim: "A" })).durum, 409, "teslimden sonra değişmez");
  // FRQ Kısım A
  const f = await C("POST", "/api/tam-sinav/" + SID + "/bolum-baslat", { bolum: 2 });
  assert.equal(f.govde.icerik.frq.length, 2);
  assert.equal(gizliVar(f.govde), false, "FRQ rubriği teslimden önce yok");
  assert.equal(f.govde.rubrikler, undefined);
  const harf = f.govde.icerik.frq[0].parcalar[0].harf;
  assert.equal((await C("POST", "/api/tam-sinav/" + SID + "/cevap", { bolum: 2, i: 0, frq: { [harf]: "f'(2) = 3 çünkü …" } })).durum, 200);
  SAAT += 1000;
  const t2 = await C("POST", "/api/tam-sinav/" + SID + "/bolum-teslim", { bolum: 2 });
  assert.equal(t2.govde.rubrikler.length, 2, "kapanan kısmın rubriği gelir");
  assert.ok(t2.govde.rubrikler[0].frq.parcalar[0].rubrik.length);
  assert.equal(t2.govde.rubrikler[0].cevaplar[harf], "f'(2) = 3 çünkü …");
  await C("POST", "/api/tam-sinav/" + SID + "/bolum-baslat", { bolum: 3 });
  SAAT += 1000;
  const t3 = await C("POST", "/api/tam-sinav/" + SID + "/bolum-teslim", { bolum: 3 });
  assert.equal(t3.govde.rubrikler.length, 4);
  // Öz puanlama: ilk FRQ tam puan, diğerleri 0 (mevcut FRQ API'si)
  let frqKazanilan = 0, frqToplam = 0;
  for (const [j, rb] of t3.govde.rubrikler.entries()) {
    const puanlar = {};
    rb.frq.parcalar.forEach(pc => { puanlar[pc.harf] = pc.rubrik.map(x => j === 0 ? x.puan : 0); });
    const r = await C("POST", "/api/frq/" + rb.frq.id + "/puanla", { denemeId: rb.denemeId, puanlar });
    assert.equal(r.durum, 200, JSON.stringify(r.govde));
    frqToplam += rb.frq.toplam_puan; if (j === 0) frqKazanilan += rb.frq.toplam_puan;
  }
  const s = await C("POST", "/api/tam-sinav/" + SID + "/bitir", {});
  assert.equal(s.durum, 200, JSON.stringify(s.govde));
  const so = s.govde.sonuc;
  const dogruA = p.bolumler[0].sorular.filter((k, i) => i < 2 && (i === 0 ? s.govde.cevaplar[0][0] : "A") === satir(k).dogru).length;
  assert.equal(so.mcq.toplam, 42); assert.equal(so.mcq.dogru, 13 + dogruA);
  const mcqY = so.mcq.dogru / 42 * 100, frqY = Math.round(frqKazanilan / frqToplam * 1000) / 10;
  assert.equal(so.frq.yuzde, frqY); assert.equal(so.frq.puanlanmamis, 0);
  assert.equal(so.kompozit, Math.round((50 * mcqY + 50 * frqY) / 100 * 10) / 10);
  assert.equal(so.tahminiPuan, T.apPuan(T.planlar().sinavlar["calculus-ab"].esikler, so.kompozit));
  assert.equal(so.zaman.find(z => z.b === 1 && z.i === 0).uzun, true, "900 sn > 2 × tempo");
  assert.equal(so.uniteler.reduce((a, u) => a + u.soru, 0), 42);
  assert.ok(s.govde.cozumler && Object.keys(s.govde.cozumler).length === 42, "bitince çözümler gelir");
  // Deneme geçmişi (exams) → veli paneli tahmini puanı görür
  const e = db().prepare("SELECT kod, ad, yuzde, tahmini_band, veri FROM exams WHERE user_id = ? AND istemci_id = ?").get(C.uid, SID);
  assert.equal(e.kod, "calculus-ab"); assert.match(e.ad, /^Tam sınav/); assert.equal(+e.tahmini_band, so.tahminiPuan);
  assert.equal(JSON.parse(e.veri).mod, "tam");
  // Bitmiş sınavda yeniden bitir: FRQ öz puanı değişince bileşik güncellenir
  const rb0 = t3.govde.rubrikler[1], pz = {};
  rb0.frq.parcalar.forEach(pc => { pz[pc.harf] = pc.rubrik.map(x => x.puan); });
  await C("POST", "/api/frq/" + rb0.frq.id + "/puanla", { denemeId: rb0.denemeId, puanlar: pz });
  const s2 = await C("POST", "/api/tam-sinav/" + SID + "/bitir", {});
  assert.ok(s2.govde.sonuc.frq.kazanilan > so.frq.kazanilan); assert.equal(s2.govde.ilk, false);
  const gc = await C("GET", "/api/tam-sinav/gecmis");
  assert.equal(gc.govde.gecmis[0].id, SID);
  // Başka öğrenci göremez
  const baska = await ogrenci(true);
  assert.equal((await baska("GET", "/api/tam-sinav/" + SID)).durum, 404);
});

test("veli paneli: tam sınav son denemeler listesinde tahmini puanıyla", async () => {
  const u = db().prepare("SELECT * FROM users WHERE id = ?").get(C.uid);
  const o = app.veli.ozetAl(u, { rapor: 0, kabul: null }, SAAT);
  const d = o.denemeler.find(x => /^Tam sınav/.test(x.ad));
  assert.ok(d); assert.ok(d.tahminiPuan >= 1); assert.equal(d.tamSinav, true);
});
