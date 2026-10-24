"use strict";
// 1.16.0 İlerleme grafikleri: GET /api/ilerleme/ozet (salt okunur) + veli paneli grafik verisi. node --test server/test/ilerleme.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { olustur } = require("../uygulama");
const I = require("../ilerleme");

const SIMDI = Date.parse("2026-10-21T15:00:00.000Z"); // Çarşamba, İstanbul 18:00
let app, base;
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, soruTohum: true, saat: () => SIMDI, gunlukKonsol: false });
  await new Promise(r => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
});
after(() => new Promise(r => app.server.close(r)));

function istemci() {
  let cerez = "";
  return async function iste(yontem, yol, govde) {
    const h = Object.assign({ "Content-Type": "application/json" }, yontem === "GET" ? {} : { "X-Meberra": "1" }, cerez ? { Cookie: cerez } : {});
    const r = await fetch(base + yol, { method: yontem, headers: h, body: govde ? JSON.stringify(govde) : undefined });
    const sc = r.headers.get("set-cookie");
    if (sc) { const m = /meberra_sid=([^;]*)/.exec(sc); cerez = m && m[1] ? "meberra_sid=" + m[1] : ""; }
    return { durum: r.status, basliklar: r.headers, govde: (r.headers.get("content-type") || "").includes("json") ? await r.json() : await r.text() };
  };
}
const SIFRE = "Deneme-12345";
async function ogrenci(ep) {
  const c = istemci();
  const r = await c("POST", "/api/auth/register", { ad: "Ece", soyad: "Kaya", eposta: ep, sifre: SIFRE, sifre2: SIFRE, kosullar: true, kvkk: true, veliOnay: true });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  await c("PUT", "/api/profile", { profile: { ogrenciModeli: "lise", sinif: "11", ulkeler: ["de"], tamamlandi: true, apDersleri: [{ ders: "calculus-ab", hedef: 4 }], sinavYili: 2027 } });
  return { c, uid: app.db.prepare("SELECT id FROM users WHERE eposta = ?").get(ep).id };
}
const gunOnce = (n, saat) => new Date(SIMDI - n * 864e5 + (saat || 0) * 36e5).toISOString();

test("oturumsuz istek 401", async () => {
  const r = await istemci()("GET", "/api/ilerleme/ozet");
  assert.equal(r.durum, 401);
});

test("yeni öğrenci: boş ama tam biçimli özet", async () => {
  const { c } = await ogrenci("bos@ornek.com");
  const r = await c("GET", "/api/ilerleme/ozet");
  assert.equal(r.durum, 200);
  assert.match(r.basliklar.get("cache-control") || "", /no-store/);
  const o = r.govde;
  assert.equal(o.gunler.length, I.GUN_SAYISI);
  assert.equal(o.gunler[o.gunler.length - 1].gun, "2026-10-21");
  assert.equal(o.haftalar.length, I.HAFTA_SAYISI);
  assert.equal(o.haftalar[o.haftalar.length - 1].hafta, "2026-W43");
  assert.equal(o.toplam.cevap, 0);
  assert.equal(o.seri.simdi, 0);
  assert.equal(o.dersler.length, 1);
  const d = o.dersler[0];
  assert.equal(d.ders, "calculus-ab"); assert.equal(d.hedef, 4); assert.equal(d.tahmini, null); assert.equal(d.tahminiInce, null);
  assert.ok(d.uniteler.length >= 10 && d.uniteler.every(u => u.cevap === 0 && u.bankada > 0 && /^\/ders\/calculus\?unite=\d+$/.test(u.link)));
  assert.deepEqual(o.puanGecmisi, []); assert.deepEqual(o.frq, []);
});

test("etkinlik, ünite ustalığı, zayıf üniteler, puan geçmişi, XP", async () => {
  const { c, uid } = await ogrenci("dolu@ornek.com");
  const sorular = app.db.prepare("SELECT id, kutu FROM questions_bank WHERE tur = 'ders' AND durum = 'aktif' AND sayfa = 'ap-calculus' ORDER BY kutu, sira").all();
  const u1 = sorular.filter(s => s.kutu === "calc-unit1-quiz-container").slice(0, 12);
  const u2 = sorular.filter(s => s.kutu === "calc-unit2-quiz-container").slice(0, 8);
  const units = { "calc-unit1-quiz-container": { title: "Unit 1", answers: {} }, "calc-unit2-quiz-container": { title: "Unit 2", answers: {} } };
  // Unit 1: 12 soru, 10 doğru (son 3 gün); Unit 2: 8 soru, 2 doğru (bugün)
  u1.forEach((s, i) => { units["calc-unit1-quiz-container"].answers[s.id] = { s: "A", c: i < 10, t: gunOnce(i % 3 + 1, i / 10) }; });
  u2.forEach((s, i) => { units["calc-unit2-quiz-container"].answers[s.id] = { s: "B", c: i < 2, t: gunOnce(0, -1 - i / 10) }; });
  let r = await c("PUT", "/api/state", { degisiklikler: { "apmeberra:quiz:v1": JSON.stringify({ v: 1, pages: { "ap-calculus": { units } } }) } });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  r = await c("PUT", "/api/state", { degisiklikler: { "apmeberra:deneme:v1": JSON.stringify({ v: 1, aktif: null, gecmis: [
    { id: "d1", kod: "calculus-ab", ad: "AP Calculus AB", tarih: gunOnce(20), soruSayisi: 20, dogru: 9, yanlis: 11, bos: 0, yuzde: 45, sureSn: 1800, tahminiBand: 3 },
    { id: "d2", kod: "calculus-ab", ad: "AP Calculus AB", tarih: gunOnce(2), soruSayisi: 20, dogru: 13, yanlis: 7, bos: 0, yuzde: 65, sureSn: 1700, tahminiBand: 4 }] }) } });
  assert.equal(r.durum, 200);
  // FRQ öz puan (tablo doğrudan; uç başka testte sınanıyor)
  app.db.prepare("INSERT INTO frq_denemeleri (user_id, frq_id, ders, frq_surum, cevaplar, puanlar, toplam, toplam_puan, created, puanlama) VALUES (?, 'frq-calc-ab-1', 'calculus-ab', 1, '{}', '{}', 6, 9, ?, ?)")
    .run(uid, gunOnce(5), gunOnce(5));

  const before = app.db.prepare("SELECT (SELECT COUNT(*) FROM answers) a, (SELECT COUNT(*) FROM exams) e, (SELECT COUNT(*) FROM frq_denemeleri) f").get();
  const o = (await c("GET", "/api/ilerleme/ozet")).govde;
  const after_ = app.db.prepare("SELECT (SELECT COUNT(*) FROM answers) a, (SELECT COUNT(*) FROM exams) e, (SELECT COUNT(*) FROM frq_denemeleri) f").get();
  assert.deepEqual(after_, before, "uç salt okunur");

  assert.equal(o.toplam.cevap, 20); assert.equal(o.toplam.dogru, 12); assert.equal(o.toplam.deneme, 2);
  const bugun = o.gunler[o.gunler.length - 1];
  assert.equal(bugun.cevap, 8); assert.equal(bugun.dogru, 2);
  assert.equal(o.gunler.reduce((s, g) => s + g.cevap, 0), 20);
  assert.ok(o.seri.simdi >= 4, "bugün + son 3 gün aktif: " + o.seri.simdi);
  assert.ok(o.seri.enUzun >= 4);
  const hBu = o.haftalar[o.haftalar.length - 1];
  assert.equal(hBu.xp, hBu.soru * 5 + hBu.dogru * 5 + hBu.deneme * 50);
  assert.ok(o.haftalar.reduce((s, h) => s + h.deneme, 0) === 2);

  const d = o.dersler[0];
  // 1.27.0: model varsa (≥ 10 cevap) her ekranda aynı tahmin (Bugün, İlerleme, veli): tahmini = tahminModel
  assert.equal(d.tahmini, d.tahminModel.puan); assert.equal(d.tahminKaynagi, "model+deneme"); assert.equal(d.tahminiInce, d.tahminModel.ince);
  // 1.27.0 tahmin modeli: CED ünite ağırlıkları + FRQ öz puanı (6/9) + 2 gün önceki deneme (4) harmanı; kaldıraç en ağır çalışılmamış ünite
  const tm = d.tahminModel;
  assert.ok(tm && tm.puan >= 1 && tm.puan <= 5, JSON.stringify(tm));
  assert.equal(tm.kaynak, "model+deneme"); assert.equal(tm.frqKaynak, "oz"); assert.ok(Math.abs(tm.frq - 66.7) < 0.1, String(tm.frq));
  assert.equal(tm.guven, "dusuk", "20 cevap → düşük güven");
  assert.equal(tm.cevap, 20);
  assert.equal(tm.kaldirac.unite, "6"); assert.equal(tm.kaldirac.link, "/ders/calculus?unite=6"); assert.match(tm.kaldirac.ad, /Integration/);
  assert.ok(tm.oranlar["1"] > tm.oranlar["2"] && tm.oranlar["8"] === 25, JSON.stringify(tm.oranlar));
  const un1 = d.uniteler.find(u => u.kutu === "calc-unit1-quiz-container"), un2 = d.uniteler.find(u => u.kutu === "calc-unit2-quiz-container");
  assert.equal(un1.dogruluk, 83); assert.equal(un1.cozulen, 12); assert.equal(un1.kapsam, Math.round(12 / un1.bankada * 100));
  assert.equal(un2.dogruluk, 25); assert.equal(un2.zayif, true); assert.equal(un1.zayif, false, "%75 üstü zayıf sayılmaz");
  assert.equal(d.uniteler.filter(u => u.zayif).length, 1);
  assert.equal(un2.link, "/ders/calculus?unite=2");

  assert.equal(o.puanGecmisi.length, 2);
  assert.deepEqual(o.puanGecmisi.map(p => p.puan), [3, 4], "eskiden yeniye");
  assert.ok(o.puanGecmisi.every(p => p.ders === "calculus-ab" && p.tur === "deneme"));
  assert.equal(o.frq.length, 1); assert.equal(o.frq[0].yuzde, 67);
});

test("yardımcılar: haftalık etkinlik ve puan geçmişi (veli paneliyle ortak)", async () => {
  const { uid } = await ogrenci("yardimci@ornek.com");
  const h = I.haftalik(app.db, uid, SIMDI, 8);
  assert.equal(h.length, 8);
  assert.equal(h[7].pazartesi, "2026-10-19");
  assert.ok(h.every(x => x.soru === 0 && x.xp === 0));
  assert.deepEqual(I.puanGecmisi(app.db, uid, 10), []);
});
