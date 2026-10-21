"use strict";
// 1.16.0 Premium yönetimi: liste süzgeçleri ve kalan gün (İstanbul), toplu ver / uzat / iptal (mevcut bitişten uzatma,
// iptal şimdi biter), yalnız yönetici, denetim satırları (önceki/yeni bitiş), öğrenci bildirimi, gelir tahmini elle
// verilen dönemlerden etkilenmez, abonelik geçmişi.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { olustur } = require("../uygulama");

let app, base;
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, gunlukKonsol: false, varlikOtomatik: false });
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
const GUN = 864e5;
let yonC = null;
async function yonetici() {
  if (yonC) return yonC;
  app.hesap.yoneticiHazirla("prem-yon@ornek.com", "Yonetici-12345");
  yonC = istemci();
  assert.equal((await yonC("POST", "/api/auth/login", { kimlik: "prem-yon@ornek.com", sifre: "Yonetici-12345" })).durum, 200);
  return yonC;
}
let sira = 0;
async function ogrenci(ad) {
  const c = istemci(), ep = "prem" + (++sira) + "@ornek.com";
  const r = await c("POST", "/api/auth/register", { ad: ad || "Ece", soyad: "Demir", eposta: ep, sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  c.pid = r.govde.user.id;
  c.uid = db().prepare("SELECT id FROM users WHERE public_id = ?").get(c.pid).id;
  return c;
}
/** Doğrudan dönem yazar (bitis şimdiden ms kadar sonra) */
function donem(uid, bitisMs, ek) {
  ek = ek || {};
  const z = Date.now();
  db().prepare(`INSERT INTO subscriptions (user_id, plan, baslangic, bitis, durum, kaynak, tutar_tl, olusturma) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uid, ek.plan || "aylik", new Date(z - (ek.onceMs || 10 * GUN)).toISOString(), new Date(z + bitisMs).toISOString(), ek.durum || "aktif", ek.kaynak || "talep",
      ek.tutar === undefined ? 199 : ek.tutar, new Date(z).toISOString());
}
const aktifBitis = uid => db().prepare("SELECT MAX(bitis) AS b FROM subscriptions WHERE user_id = ? AND durum = 'aktif' AND bitis > ?").get(uid, new Date().toISOString()).b;
const denetimler = (eylem, uid) => db().prepare("SELECT * FROM audit_log WHERE eylem = ? AND user_id = ? ORDER BY id").all(eylem, uid);

test("kalanGun: kalan süre yukarı yuvarlanır; bitmiş/boş → 0", () => {
  const t = Date.parse("2026-10-21T12:00:00Z");
  assert.equal(app.hesap.kalanGun("2026-10-21T14:00:00Z", t), 1, "2 saat → 1 gün");
  assert.equal(app.hesap.kalanGun("2026-10-28T12:00:00Z", t), 7);
  assert.equal(app.hesap.kalanGun("2026-10-28T12:00:01Z", t), 8);
  assert.equal(app.hesap.kalanGun("2026-10-21T11:00:00Z", t), 0);
  assert.equal(app.hesap.kalanGun(null, t), 0);
});

test("yalnız yönetici: öğrenci ve anonim 401/403", async () => {
  const o = await ogrenci();
  const anon = istemci();
  for (const [y, yol, g] of [["GET", "/api/admin/premium"], ["POST", "/api/admin/premium/ver", { userIds: [o.pid], gun: 5 }],
    ["POST", "/api/admin/premium/uzat", { userIds: [o.pid], gun: 5 }], ["POST", "/api/admin/premium/iptal", { userIds: [o.pid] }],
    ["GET", "/api/admin/users/" + o.pid + "/abonelikler"]]) {
    assert.ok([401, 403].includes((await o(y, yol, g)).durum), "öğrenci " + yol);
    assert.ok([401, 403].includes((await anon(y, yol, g)).durum), "anonim " + yol);
  }
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM subscriptions WHERE user_id = ?").get(o.uid).n, 0);
});

test("liste süzgeçleri: aktif / bitiyor (≤7 gün) / deneme / bitti, kalanGun, bitisGun İstanbul, ödenen toplamı", async () => {
  const yon = await yonetici();
  const a = await ogrenci("Aktifuzun"), b = await ogrenci("Bitiyorr"), d = await ogrenci("Denemeci"), e = await ogrenci("Bittii"), h = await ogrenci("Hicyok");
  donem(a.uid, 40 * GUN, { tutar: 199 });
  donem(b.uid, 3 * GUN - 3600e3, { kaynak: "elle", tutar: null });
  donem(d.uid, 2 * GUN, { kaynak: "deneme", tutar: null });
  donem(e.uid, -2 * GUN, { tutar: 1490, plan: "yillik", onceMs: 400 * GUN });
  const liste = async durum => (await yon("GET", "/api/admin/premium?durum=" + durum + "&q=" + encodeURIComponent("Demir"))).govde;
  const idler = v => v.kullanicilar.map(x => x.id);
  let v = await liste("aktif");
  assert.ok(v.ok, JSON.stringify(v));
  assert.ok(idler(v).includes(a.pid) && idler(v).includes(b.pid));
  assert.ok(!idler(v).includes(d.pid), "deneme aktif sayılmaz");
  assert.ok(!idler(v).includes(e.pid) && !idler(v).includes(h.pid));
  assert.ok(idler(v).indexOf(b.pid) < idler(v).indexOf(a.pid), "en yakın bitiş önce");
  const ra = v.kullanicilar.find(x => x.id === a.pid), rb = v.kullanicilar.find(x => x.id === b.pid);
  assert.equal(ra.kalanGun, 40); assert.equal(ra.durum, "aktif"); assert.equal(ra.bitiyor, false); assert.equal(ra.toplamOdenen, 199); assert.equal(ra.kaynak, "talep");
  assert.equal(rb.kalanGun, 3, "2 gün 23 saat → 3"); assert.equal(rb.bitiyor, true); assert.equal(rb.kaynak, "elle"); assert.equal(rb.toplamOdenen, 0);
  v = await liste("bitiyor");
  assert.ok(idler(v).includes(b.pid) && idler(v).includes(d.pid), "bitiyor denemeyi de kapsar");
  assert.ok(!idler(v).includes(a.pid));
  v = await liste("deneme");
  assert.deepEqual(idler(v).filter(x => [a.pid, b.pid, d.pid, e.pid].includes(x)), [d.pid]);
  assert.equal(v.kullanicilar.find(x => x.id === d.pid).durum, "deneme");
  v = await liste("bitti");
  const re = v.kullanicilar.find(x => x.id === e.pid);
  assert.ok(re && !idler(v).includes(h.pid));
  assert.equal(re.kalanGun, 0); assert.equal(re.durum, "bitti"); assert.equal(re.plan, "yillik"); assert.equal(re.toplamOdenen, 1490);
  v = await liste("hepsi");
  assert.ok([a, b, d, e].every(x => idler(v).includes(x.pid)) && !idler(v).includes(h.pid));
  assert.ok(v.sayac.aktif >= 2 && v.sayac.deneme >= 1 && v.sayac.bitti >= 1 && v.sayac.bitiyor >= 2);
  // bitisGun İstanbul takvim günüdür: 21:30 UTC → ertesi gün
  const k = await ogrenci("Gecegece");
  const z = new Date(Date.now() + 10 * GUN); z.setUTCHours(21, 30, 0, 0);
  db().prepare("INSERT INTO subscriptions (user_id, plan, baslangic, bitis, kaynak, olusturma) VALUES (?, 'ozel', ?, ?, 'elle', ?)").run(k.uid, new Date().toISOString(), z.toISOString(), new Date().toISOString());
  const rk = (await yon("GET", "/api/admin/premium?durum=aktif&q=Gecegece")).govde.kullanicilar[0];
  assert.equal(rk.bitisGun, new Date(z.getTime() + 3 * 3600e3).toISOString().slice(0, 10));
  assert.notEqual(rk.bitisGun, z.toISOString().slice(0, 10));
  // Kullanıcılar listesi: premiumDurum süzgeci + kalan gün sıralaması + kalanGun alanı
  const ul = (await yon("GET", "/api/admin/users?premiumDurum=bitiyor&sirala=kalan&q=Demir")).govde.kullanicilar;
  assert.ok(ul.some(x => x.id === b.pid) && !ul.some(x => x.id === a.pid));
  assert.equal(ul.find(x => x.id === b.pid).kalanGun, 3);
  const us = (await yon("GET", "/api/admin/users?sirala=kalan&q=Demir")).govde.kullanicilar.map(x => x.id);
  assert.ok(us.indexOf(d.pid) < us.indexOf(a.pid) && us.indexOf(a.pid) < us.indexOf(h.pid), "en az kalan önce, Premium olmayan sonda");
  assert.equal((await yon("GET", "/api/admin/users?premiumDurum=bitti&q=Bittii")).govde.kullanicilar[0].premiumGecmis, true);
});

test("toplu ver: aktifse mevcut bitişten uzatır, değilse şimdiden açar; denetim + bildirim; doğrulama", async () => {
  const yon = await yonetici();
  const a = await ogrenci("Uzatilan"), b = await ogrenci("Yenigelen");
  donem(a.uid, 10 * GUN);
  const onceA = aktifBitis(a.uid);
  // doğrulama
  assert.equal((await yon("POST", "/api/admin/premium/ver", { userIds: [a.pid] })).durum, 400, "plan ya da gün yok");
  assert.equal((await yon("POST", "/api/admin/premium/ver", { userIds: [a.pid], gun: 0 })).durum, 400);
  assert.equal((await yon("POST", "/api/admin/premium/ver", { userIds: [a.pid], gun: 3651 })).durum, 400);
  assert.equal((await yon("POST", "/api/admin/premium/ver", { userIds: [a.pid], gun: 2.5 })).durum, 400);
  assert.equal((await yon("POST", "/api/admin/premium/ver", { userIds: [], gun: 5 })).durum, 400);
  assert.equal((await yon("POST", "/api/admin/premium/ver", { gun: 5 })).durum, 400);
  assert.equal((await yon("POST", "/api/admin/premium/ver", { userIds: new Array(201).fill(a.pid), gun: 5 })).durum, 400);
  assert.equal(aktifBitis(a.uid), onceA, "geçersiz istek dönem eklemez");

  const t0 = Date.now();
  const r = await yon("POST", "/api/admin/premium/ver", { userIds: [a.pid, b.pid, a.pid, "yok-boyle-biri"], gun: 30, not: "telafi" });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  assert.equal(r.govde.islenen, 2, "yinelenen tekilleşir");
  assert.deepEqual(r.govde.atlanan.map(x => x.id), ["yok-boyle-biri"]);
  assert.equal(Date.parse(aktifBitis(a.uid)) - Date.parse(onceA), 30 * GUN, "mevcut bitişin sonuna eklendi");
  const bb = Date.parse(aktifBitis(b.uid));
  assert.ok(bb - t0 >= 30 * GUN - 5000 && bb - Date.now() <= 30 * GUN + 5000, "şimdiden 30 gün");
  // elle: tutar NULL, kaynak elle
  const s = db().prepare("SELECT * FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1").get(b.uid);
  assert.equal(s.kaynak, "elle"); assert.equal(s.tutar_tl, null); assert.equal(s.not_, "telafi");
  // denetim: önceki/yeni bitiş
  const da = denetimler("premium.ver", a.uid).pop(), ay = JSON.parse(da.ayrinti);
  assert.equal(ay.oncekiBitis, onceA); assert.equal(ay.yeniBitis, aktifBitis(a.uid)); assert.equal(ay.gun, 30); assert.equal(ay.not, "telafi"); assert.equal(ay.toplu, true);
  const dbb = JSON.parse(denetimler("premium.ver", b.uid).pop().ayrinti);
  assert.equal(dbb.oncekiBitis, null);
  // bildirim: uzatma / açılış metni
  const bil = uid => db().prepare("SELECT * FROM notifications WHERE user_id = ? AND tur = 'premium' ORDER BY id DESC LIMIT 1").get(uid);
  assert.equal(bil(a.uid).baslik, "Premium'un 30 gün uzatıldı");
  assert.equal(bil(b.uid).baslik, "Premium açıldı");
  // plan ile
  const r2 = await yon("POST", "/api/admin/premium/ver", { userIds: [b.pid], plan: "yillik" });
  assert.equal(r2.govde.sonuc[0].gun, 365);
  assert.equal(db().prepare("SELECT plan FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1").get(b.uid).plan, "yillik");
});

test("toplu uzat: yalnız aktif olanlar, bitişten itibaren; gün 1–3650 zorunlu", async () => {
  const yon = await yonetici();
  const a = await ogrenci("Uzat1"), b = await ogrenci("Uzat2"), c = await ogrenci("Uzatyok");
  donem(a.uid, 5 * GUN); donem(b.uid, 100 * GUN, { kaynak: "deneme", tutar: null });
  const oa = aktifBitis(a.uid), ob = aktifBitis(b.uid);
  assert.equal((await yon("POST", "/api/admin/premium/uzat", { userIds: [a.pid] })).durum, 400);
  assert.equal((await yon("POST", "/api/admin/premium/uzat", { userIds: [a.pid], gun: 4000 })).durum, 400);
  const r = await yon("POST", "/api/admin/premium/uzat", { userIds: [a.pid, b.pid, c.pid], gun: 7, not: "kampanya" });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.islenen, 2);
  assert.equal(r.govde.atlanan[0].id, c.pid, "aktif olmayan atlanır");
  assert.equal(Date.parse(aktifBitis(a.uid)) - Date.parse(oa), 7 * GUN);
  assert.equal(Date.parse(aktifBitis(b.uid)) - Date.parse(ob), 7 * GUN);
  assert.equal(aktifBitis(c.uid), null);
  const d = JSON.parse(denetimler("premium.uzat", a.uid).pop().ayrinti);
  assert.equal(d.oncekiBitis, oa); assert.equal(d.yeniBitis, aktifBitis(a.uid));
  assert.equal(db().prepare("SELECT baslik FROM notifications WHERE user_id = ? AND tur = 'premium' ORDER BY id DESC").get(a.uid).baslik, "Premium'un 7 gün uzatıldı");
});

test("toplu iptal: şimdi biter (ileri tarihli dönemler dahil), denetim önceki/yeni bitiş", async () => {
  const yon = await yonetici();
  const a = await ogrenci("Iptal1"), c = await ogrenci("Iptalyok");
  donem(a.uid, 5 * GUN);
  await yon("POST", "/api/admin/premium/uzat", { userIds: [a.pid], gun: 30 }); // ileri tarihli ikinci dönem
  const once = aktifBitis(a.uid);
  const t0 = Date.now();
  const r = await yon("POST", "/api/admin/premium/iptal", { userIds: [a.pid, c.pid], not: "iade" });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.islenen, 1);
  assert.equal(r.govde.sonuc[0].iptalEdilen, 2);
  assert.equal(r.govde.atlanan[0].id, c.pid);
  assert.equal(aktifBitis(a.uid), null, "Premium hemen sona erdi");
  assert.equal(app.hesap.uyelik(a.uid).premium, false);
  const d = JSON.parse(denetimler("premium.iptal", a.uid).pop().ayrinti);
  assert.equal(d.oncekiBitis, once); assert.ok(Math.abs(Date.parse(d.yeniBitis) - t0) < 5000); assert.equal(d.not, "iade"); assert.equal(d.donem, 2);
  // abonelik geçmişi: iptal edilen dönemlerin etkin bitişi iptal anı; ileri tarihli olan hiç başlamamış
  const g = (await yon("GET", "/api/admin/users/" + a.pid + "/abonelikler")).govde;
  assert.equal(g.ok, true);
  assert.equal(g.uyelik.premium, false); assert.equal(g.uyelik.kalanGun, 0);
  assert.equal(g.abonelikler.length, 2);
  assert.ok(g.abonelikler.every(s => s.durum === "iptal"));
  const ileri = g.abonelikler.find(s => s.kaynak === "elle");
  assert.equal(ileri.etkinBitis, ileri.baslangic);
  assert.equal(ileri.gun, 30);
  assert.equal(g.toplamOdenen, 199);
  assert.equal((await yon("GET", "/api/admin/users/yok/abonelikler")).durum, 404);
});

test("gelir tahmini elle verilen dönemlerden etkilenmez; tekil uç da önceki/yeni bitişi denetler", async () => {
  const yon = await yonetici();
  const gelir = async () => (await yon("GET", "/api/admin/stats")).govde.gelirTahmini.aylikTL;
  const once = await gelir();
  const a = await ogrenci("Gelirsiz");
  assert.equal((await yon("POST", "/api/admin/premium/ver", { userIds: [a.pid], plan: "yillik" })).durum, 200);
  assert.equal((await yon("POST", "/api/admin/users/" + a.pid + "/premium", { gun: 90 })).durum, 200);
  assert.equal(await gelir(), once, "elle verilen Premium gelire girmez");
  const p = await ogrenci("Odeyen");
  donem(p.uid, 30 * GUN, { onceMs: 0, tutar: 199 });
  db().prepare("UPDATE subscriptions SET baslangic = ? WHERE user_id = ?").run(new Date(Date.now() - 1000).toISOString(), p.uid);
  const sonra = await gelir();
  assert.ok(sonra - once >= 198 && sonra - once <= 200, "ödenen dönem gelire girer: " + (sonra - once));
  const d = JSON.parse(denetimler("premium.ver", a.uid).pop().ayrinti);
  assert.equal(d.gun, 90); assert.ok(d.oncekiBitis); assert.equal(Date.parse(d.yeniBitis) - Date.parse(d.oncekiBitis), 90 * GUN);
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM subscriptions WHERE user_id = ? AND (kaynak != 'elle' OR tutar_tl IS NOT NULL)").get(a.uid).n, 0);
  // tekil iptal
  assert.equal((await yon("POST", "/api/admin/users/" + a.pid + "/premium/iptal", { not: "x" })).govde.iptalEdilen, 2);
  assert.ok(JSON.parse(denetimler("premium.iptal", a.uid).pop().ayrinti).oncekiBitis);
});
