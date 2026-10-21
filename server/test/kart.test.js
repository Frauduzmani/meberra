"use strict";
// 1.18.0 Kavram kartları: oturum zorunlu; ücretsiz planda her dersin ilk 2 destesi (402 premiumGerekli); Premium hepsi;
// SM-2-lite zamanlama sunucuda (tekrar → 1, zor → ×1,2, biliyorum → 1/3/7/14/30); "bugün" listesi (vadeli + yeni, en çok 30).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { olustur } = require("../uygulama");
const { BUGUN_EN_COK, YENI_GUNLUK } = require("../kart");

const GUN = 86400e3;
let simdiMs = Date.parse("2026-10-21T09:00:00Z");
let app, base;
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, gunlukKonsol: false, varlikOtomatik: false, soruTohum: false, frqTohum: false,
    kartSaat: () => simdiMs });
  await new Promise(r => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
});
after(async () => { await new Promise(r => app.server.close(r)); });

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
let sayac = 0;
async function ogrenci(premium) {
  const c = istemci(), ep = "kart" + (++sayac) + "@ornek.com";
  const r = await c("POST", "/api/auth/register", { ad: "Ada", soyad: "Kaya", eposta: ep, sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  c.uid = app.db.prepare("SELECT id FROM users WHERE public_id = ?").get(r.govde.user.id).id;
  if (premium) app.hesap.premiumVer(c.uid, "aylik", null, { kaynak: "elle" });
  return c;
}
const degerlendir = (c, id, sonuc) => c("POST", "/api/kartlar/" + encodeURIComponent(id) + "/degerlendir", { sonuc });
const durum = (c, id) => app.db.prepare("SELECT * FROM kart_durumu WHERE user_id = ? AND kart_id = ?").get(c.uid, id);

test("oturum olmadan 401", async () => {
  const c = istemci();
  assert.equal((await c("GET", "/api/kartlar")).durum, 401);
  assert.equal((await c("GET", "/api/kartlar/bugun")).durum, 401);
  assert.equal((await degerlendir(c, "calc-u1-01", "biliyorum")).durum, 401);
});

test("ücretsiz plan: ilk 2 deste açık, diğerleri 402", async () => {
  const c = await ogrenci(false);
  const r = await c("GET", "/api/kartlar");
  assert.equal(r.durum, 200);
  assert.equal(r.govde.premium, false);
  const calc = r.govde.dersler.find(d => d.ders === "calculus");
  assert.deepEqual(calc.desteler.filter(u => !u.kilitli).map(u => u.unite), ["1", "2"]);
  const micro = r.govde.dersler.find(d => d.ders === "micro");
  assert.deepEqual(micro.desteler.filter(u => !u.kilitli).map(u => u.unite), ["Micro 1", "Micro 2"]);
  assert.ok(r.govde.dersler.every(d => d.desteler.filter(u => !u.kilitli).length === 2));
  const ac = await c("GET", "/api/kartlar?ders=calculus&unite=2");
  assert.equal(ac.durum, 200);
  assert.ok(ac.govde.kartlar.length >= 8 && ac.govde.kartlar.every(k => k.unite === "2" && k.arka && k.durum === null));
  const kilit = await c("GET", "/api/kartlar?ders=calculus&unite=3");
  assert.equal(kilit.durum, 402);
  assert.equal(kilit.govde.premiumGerekli, true);
  assert.equal((await degerlendir(c, "calc-u3-01", "biliyorum")).durum, 402);
  assert.equal(durum(c, "calc-u3-01"), undefined);
  // sayfa ile de seçilebilir (ap-electives içinde ünite adı benzersiz)
  assert.equal((await c("GET", "/api/kartlar?sayfa=ap-electives&unite=Macro%201")).durum, 200);
  assert.equal((await c("GET", "/api/kartlar?ders=calculus&unite=99")).durum, 404);
  // bugün listesi yalnız ücretsiz destelerden
  const b = await c("GET", "/api/kartlar/bugun");
  assert.equal(b.durum, 200);
  assert.ok(b.govde.kartlar.length > 0);
  const acik = new Set();
  r.govde.dersler.forEach(d => d.desteler.forEach(u => { if (!u.kilitli) acik.add(d.ders + "|" + u.unite); }));
  assert.ok(b.govde.kartlar.every(k => acik.has(k.ders + "|" + k.unite)));
});

test("Premium tüm destelere erişir", async () => {
  const c = await ogrenci(true);
  const r = await c("GET", "/api/kartlar");
  assert.equal(r.govde.premium, true);
  assert.ok(r.govde.dersler.every(d => d.desteler.every(u => !u.kilitli)));
  const k = await c("GET", "/api/kartlar?ders=calculus&unite=10");
  assert.equal(k.durum, 200);
  assert.ok(k.govde.kartlar.every(x => x.bc === true));
  assert.equal((await degerlendir(c, "calc-u10-01", "zor")).durum, 200);
});

test("değerlendirme doğrulaması", async () => {
  const c = await ogrenci(false);
  assert.equal((await degerlendir(c, "calc-u1-01", "kolay")).durum, 400);
  assert.equal((await c("POST", "/api/kartlar/calc-u1-01/degerlendir", {})).durum, 400);
  assert.equal((await degerlendir(c, "yok-u1-01", "biliyorum")).durum, 404);
});

test("zamanlama: biliyorum 1→3→7, zor ×1,2, tekrar → 1; vade listesi", async () => {
  simdiMs = Date.parse("2026-10-21T09:00:00Z");
  const c = await ogrenci(false), id = "calc-u1-01";
  let r = await degerlendir(c, id, "biliyorum");
  assert.equal(r.durum, 200);
  assert.deepEqual([r.govde.durum.aralik, r.govde.durum.sonraki, r.govde.durum.tekrar, r.govde.bugunTekrar], [1, "2026-10-22", 1, 1]);
  // bugün vadeli değil ve "yeni" de sayılmaz
  let b = (await c("GET", "/api/kartlar/bugun?dersler=calculus")).govde;
  assert.ok(!b.kartlar.some(k => k.id === id));
  assert.equal(b.vadesi, 0);
  simdiMs += GUN;
  b = (await c("GET", "/api/kartlar/bugun?dersler=calculus")).govde;
  assert.equal(b.kartlar[0].id, id, "vadesi gelen kart önce gelir");
  assert.equal(b.vadesi, 1);
  assert.equal(b.bugunTekrar, 0);
  const ozet = (await c("GET", "/api/kartlar?ders=calculus")).govde;
  assert.equal(ozet.dersler[0].desteler[0].vadesi, 1);
  assert.equal(ozet.dersler[0].desteler[0].gorulen, 1);
  r = await degerlendir(c, id, "biliyorum");
  assert.equal(r.govde.durum.aralik, 3);
  assert.equal(r.govde.durum.sonraki, "2026-10-25");
  r = await degerlendir(c, id, "biliyorum");
  assert.equal(r.govde.durum.aralik, 7);
  r = await degerlendir(c, id, "zor");
  assert.equal(r.govde.durum.aralik, 8); // 7 × 1,2 = 8,4 → 8
  r = await degerlendir(c, id, "biliyorum");
  assert.equal(r.govde.durum.aralik, 14);
  r = await degerlendir(c, id, "tekrar");
  assert.equal(r.govde.durum.aralik, 1);
  assert.equal(r.govde.durum.sonSonuc, "tekrar");
  assert.equal(durum(c, id).tekrar_sayisi, 6);
  // öğrenilme: aralık ≥ 7
  await degerlendir(c, "calc-u1-02", "biliyorum"); app.db.prepare("UPDATE kart_durumu SET aralik = 14 WHERE user_id = ? AND kart_id = ?").run(c.uid, "calc-u1-02");
  const d1 = (await c("GET", "/api/kartlar?ders=calculus")).govde.dersler[0].desteler[0];
  assert.equal(d1.ogrenilen, 1);
});

test("bugün listesi: en çok 30, günde en çok 10 yeni, seçili dersler", async () => {
  simdiMs = Date.parse("2026-11-01T09:00:00Z");
  const c = await ogrenci(true);
  let b = (await c("GET", "/api/kartlar/bugun")).govde;
  assert.equal(b.yeni, YENI_GUNLUK);
  assert.equal(b.kartlar.length, YENI_GUNLUK);
  assert.ok(new Set(b.kartlar.map(k => k.ders)).size > 1, "yeni kartlar derslere dağıtılır");
  // 10 yeni kartı bugün gör → bugün yeni hak kalmaz
  for (const k of b.kartlar) assert.equal((await degerlendir(c, k.id, "tekrar")).durum, 200);
  b = (await c("GET", "/api/kartlar/bugun")).govde;
  assert.equal(b.yeni, 0);
  assert.equal(b.bugunTekrar, YENI_GUNLUK);
  // 40 kartı geçmiş tarihli vadeye çek → liste 30 ile sınırlı, en eski önce
  const idler = app.db.prepare("SELECT kart_id FROM kart_durumu WHERE user_id = ?").all(c.uid).map(x => x.kart_id);
  const ekle = app.db.prepare("INSERT OR REPLACE INTO kart_durumu (user_id, kart_id, aralik, sonraki, tekrar_sayisi, son_sonuc, son_gun, guncelleme) VALUES (?, ?, 3, ?, 2, 'zor', '2026-10-01', '2026-10-01')");
  const tum = (await c("GET", "/api/kartlar?ders=physics&unite=1")).govde.kartlar.map(k => k.id)
    .concat((await c("GET", "/api/kartlar?ders=chemistry&unite=1")).govde.kartlar.map(k => k.id));
  const cagir = [];
  for (const d of ["calculus", "biology", "chemistry", "physics"]) {
    const o = (await c("GET", "/api/kartlar?ders=" + d)).govde.dersler[0];
    for (const u of o.desteler.slice(0, 3)) cagir.push(...(await c("GET", "/api/kartlar?ders=" + d + "&unite=" + encodeURIComponent(u.unite))).govde.kartlar.map(k => k.id));
  }
  const yeniIdler = cagir.filter(id => idler.indexOf(id) < 0 && tum.indexOf(id) < 0).slice(0, 40);
  yeniIdler.forEach((id, i) => ekle.run(c.uid, id, "2026-10-" + String(10 + (i % 20)).padStart(2, "0")));
  b = (await c("GET", "/api/kartlar/bugun")).govde;
  assert.equal(b.kartlar.length, BUGUN_EN_COK);
  assert.equal(b.yeni, 0);
  const vadeler = b.kartlar.map(k => k.durum.sonraki);
  assert.deepEqual(vadeler, vadeler.slice().sort());
  // yalnız istenen dersler
  b = (await c("GET", "/api/kartlar/bugun?dersler=micro,macro")).govde;
  assert.deepEqual(b.dersler.sort(), ["macro", "micro"]);
  assert.ok(b.kartlar.length > 0 && b.kartlar.every(k => k.ders === "micro" || k.ders === "macro"));
  // profil ders anahtarı da kabul edilir
  b = (await c("GET", "/api/kartlar/bugun?dersler=calculus-bc")).govde;
  assert.deepEqual(b.dersler, ["calculus"]);
});

test("hesap silinince kart durumu da silinir (CASCADE)", async () => {
  const c = await ogrenci(false);
  await degerlendir(c, "bio-u1-01", "biliyorum");
  assert.ok(durum(c, "bio-u1-01"));
  app.db.prepare("DELETE FROM users WHERE id = ?").run(c.uid);
  assert.equal(durum(c, "bio-u1-01"), undefined);
});
