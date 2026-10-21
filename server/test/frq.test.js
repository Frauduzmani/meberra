"use strict";
// v1.11.0 FRQ pratiği: rubrik/çözüm teslimden önce asla gönderilmez; taslak öğrenciye gizli; ücretsiz hak (ders başına 1 FRQ,
// sunucuda sayılır); Premium sınırsız; yönetici onayı/arşivi/düzenlemesi (sürümlü, denetimli); öz puan kaydı; tohum yapısı.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { olustur } = require("../uygulama");
const { dogrula, TOHUM, DERSLER } = require("../frq");

// 1.11.0: gerçek tohumdaki 32 FRQ bağımsız denetimle onaylandı (aktif). Taslak/onay akışı, onay öncesi hâli (hepsi taslak)
// olan bir sınama tohumuyla sınanır.
const klasor = fs.mkdtempSync(path.join(os.tmpdir(), "meberra-frq-"));
const GERCEK = JSON.parse(fs.readFileSync(TOHUM, "utf8"));
const taslakTohum = surum => { const t = JSON.parse(JSON.stringify(GERCEK)); t.surum = surum; t.frq.forEach(f => { f.durum = "taslak"; delete f.ek; }); return t; };
const TASLAK_TOHUM = path.join(klasor, "frq-taslak.json");
fs.writeFileSync(TASLAK_TOHUM, JSON.stringify(taslakTohum(1)));

let app, base;
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, gunlukKonsol: false, varlikOtomatik: false, soruTohum: false, frqTohumDosyasi: TASLAK_TOHUM });
  await new Promise(r => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
});
after(async () => {
  await new Promise(r => app.server.close(r));
  try { fs.rmSync(klasor, { recursive: true, force: true }); } catch (e) { /* Windows: WAL kilidi */ }
});

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
  const c = istemci(), ep = "frq" + (++sayac) + "@ornek.com";
  const r = await c("POST", "/api/auth/register", { ad: "Ada", soyad: "Kaya", eposta: ep, sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  c.uid = db().prepare("SELECT id FROM users WHERE public_id = ?").get(r.govde.user.id).id;
  if (premium) app.hesap.premiumVer(c.uid, "aylik", null, { kaynak: "elle" });
  return c;
}
let yonC = null;
async function yonetici() {
  if (yonC) return yonC;
  app.hesap.yoneticiHazirla("frqyon@ornek.com", "Yonetici-12345");
  yonC = istemci();
  assert.equal((await yonC("POST", "/api/auth/login", { kimlik: "frqyon@ornek.com", sifre: "Yonetici-12345" })).durum, 200);
  yonC.uid = db().prepare("SELECT id FROM users WHERE eposta = ?").get("frqyon@ornek.com").id;
  return yonC;
}
const GIZLI = ["rubrik", "ornek_cozum", "sik_hatalar", "ornek_cevap", "olcut"];
function gizliVar(o) {
  if (Array.isArray(o)) return o.some(gizliVar);
  if (o && typeof o === "object") return Object.keys(o).some(k => GIZLI.includes(k) || gizliVar(o[k]));
  return false;
}
const onayla = async (id) => { const y = await yonetici(); const r = await y("POST", "/api/admin/frq/" + id + "/durum", { durum: "aktif" }); assert.equal(r.durum, 200, JSON.stringify(r.govde)); return r; };

test("tohum: yapı geçerli, sayılar (calc AB 4 + BC 2, phys 5, chem 5, bio 5, eng 3, macro 2, micro 2, csa 4), hepsi onaylı (aktif) ve özgün", () => {
  const t = JSON.parse(fs.readFileSync(TOHUM, "utf8"));
  const say = {};
  assert.ok(t.surum >= 2, "1.11.0 onayı için FRQ tohum sürümü artırıldı");
  t.frq.forEach(f => { say[f.ders] = (say[f.ders] || 0) + 1; assert.deepEqual(dogrula(f), [], f.id); assert.equal(f.durum, "aktif"); assert.equal(f.kaynak, "AP-style original");
    assert.ok(f.ek && f.ek.onay && /bağımsız denetim/.test(f.ek.onay.kaynak), f.id + " onay izi"); });
  assert.deepEqual(say, { "calculus-ab": 4, "calculus-bc": 2, "physics-1": 5, chemistry: 5, biology: 5, "english-language": 3, macroeconomics: 2, microeconomics: 2, "computer-science-a": 4 });
  assert.equal(new Set(t.frq.map(f => f.id)).size, t.frq.length);
  t.frq.filter(f => f.ders === "english-language").forEach(f => assert.deepEqual(f.parcalar[0].rubrik.map(r => r.puan), [1, 4, 1], f.id + " 6 puanlık rubrik"));
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM frq").get().n, t.frq.length, "veritabanına yüklendi");
  Object.keys(DERSLER).forEach(k => assert.ok(say[k], k));
});

test("dogrula: rubrik toplamı ≠ parça puanı, toplam_puan hatası ve $ yakalanır", () => {
  const t = JSON.parse(fs.readFileSync(TOHUM, "utf8"));
  const f = JSON.parse(JSON.stringify(t.frq[0]));
  f.parcalar[0].rubrik[0].puan += 1;
  assert.ok(dogrula(f).some(s => /rubrik toplamı/.test(s)));
  const g = JSON.parse(JSON.stringify(t.frq[0])); g.toplam_puan += 1;
  assert.ok(dogrula(g).some(s => /toplam_puan/.test(s)));
  const h = JSON.parse(JSON.stringify(t.frq[0])); h.giris += " costs $5";
  assert.ok(dogrula(h).some(s => /\$/.test(s)));
});

test("taslak öğrenciye gizli: liste boş, doğrudan erişim 404, teslim 404; oturumsuz 401", async () => {
  const o = await ogrenci();
  const l = await o("GET", "/api/frq");
  assert.equal(l.durum, 200);
  assert.ok(!l.govde.frq.some(f => f.id === "frq-micro-2"));
  assert.equal((await o("GET", "/api/frq/frq-micro-2")).durum, 404);
  assert.equal((await o("POST", "/api/frq/frq-micro-2/teslim", { cevaplar: {} })).durum, 404);
  assert.equal((await istemci()("GET", "/api/frq")).durum, 401);
  // yönetici taslakları listede görür
  const y = await yonetici();
  const yl = await y("GET", "/api/frq");
  assert.ok(yl.govde.frq.some(f => f.id === "frq-micro-2" && f.durum === "taslak"));
});

test("yönetici onayı (taslak → aktif) sürüm + denetim; öğrenci yanıtlarında teslimden önce rubrik/çözüm yok", async () => {
  const r = await onayla("frq-calc-ab-1");
  assert.equal(r.govde.durum, "aktif"); assert.equal(r.govde.surum, 2);
  await onayla("frq-calc-ab-2"); await onayla("frq-calc-bc-1");
  assert.ok(db().prepare("SELECT 1 FROM audit_log WHERE eylem = 'frq.onayla' AND varlik_id = 'frq-calc-ab-1'").get());
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM frq_gecmis WHERE frq_id = 'frq-calc-ab-1'").get().n, 1);
  const o = await ogrenci();
  const l = await o("GET", "/api/frq?ders=calculus");
  assert.equal(l.durum, 200);
  assert.deepEqual(l.govde.frq.map(f => f.id).sort(), ["frq-calc-ab-1", "frq-calc-ab-2", "frq-calc-bc-1"]);
  assert.ok(!gizliVar(l.govde), "liste yanıtında rubrik/çözüm var");
  const s = await o("GET", "/api/frq/frq-calc-ab-1");
  assert.equal(s.durum, 200);
  assert.ok(s.govde.frq.giris && s.govde.frq.parcalar.length >= 3);
  assert.ok(!gizliVar(s.govde), "soru yanıtında rubrik/çözüm var");
  const ham = JSON.stringify(s.govde), tohum = JSON.parse(fs.readFileSync(TOHUM, "utf8")).frq.find(f => f.id === "frq-calc-ab-1");
  tohum.parcalar.forEach(p => assert.ok(!ham.includes(p.ornek_cozum.slice(0, 60)), "örnek çözüm metni sızdı"));
  const g = await o("GET", "/api/frq/gecmis");
  assert.ok(!gizliVar(g.govde));
});

test("teslim → rubrik + örnek çözüm; öz puan kaydı (toplam, katkı notu, sınırlar); geçmiş ve deneme ayrıntısı", async () => {
  const o = await ogrenci();
  const t = await o("POST", "/api/frq/frq-calc-ab-1/teslim", { cevaplar: { a: "126 liters", b: "MVT", z: "yok sayılır" }, sure_sn: 640 });
  assert.equal(t.durum, 200, JSON.stringify(t.govde));
  assert.ok(t.govde.denemeId > 0);
  assert.ok(t.govde.frq.parcalar.every(p => Array.isArray(p.rubrik) && p.rubrik.length && p.ornek_cozum && p.sik_hatalar.length));
  assert.equal(t.govde.cevaplar.z, undefined);
  const f = t.govde.frq;
  // her ölçütün tam puanı
  const tam = {}; f.parcalar.forEach(p => { tam[p.harf] = p.rubrik.map(r => r.puan); });
  const p = await o("POST", "/api/frq/frq-calc-ab-1/puanla", { denemeId: t.govde.denemeId, puanlar: tam });
  assert.equal(p.durum, 200, JSON.stringify(p.govde));
  assert.equal(p.govde.toplam, f.toplam_puan); assert.equal(p.govde.yuzde, 100);
  assert.match(p.govde.katki.metin, /Tahmindir/);
  const row = db().prepare("SELECT toplam, puanlar, cevaplar, sure_sn FROM frq_denemeleri WHERE id = ?").get(t.govde.denemeId);
  assert.equal(row.toplam, f.toplam_puan); assert.equal(row.sure_sn, 640);
  assert.deepEqual(JSON.parse(row.puanlar), tam);
  assert.equal(JSON.parse(row.cevaplar).a, "126 liters");
  // yeniden puanlama (true/false da kabul) ve aralık dışı puan 400
  const ilk = f.parcalar[0];
  const kis = { [ilk.harf]: ilk.rubrik.map(() => false) };
  const p2 = await o("POST", "/api/frq/frq-calc-ab-1/puanla", { denemeId: t.govde.denemeId, puanlar: kis });
  assert.equal(p2.govde.toplam, 0);
  assert.equal((await o("POST", "/api/frq/frq-calc-ab-1/puanla", { denemeId: t.govde.denemeId, puanlar: { a: [99] } })).durum, 400);
  // başkasının denemesi
  const b = await ogrenci();
  assert.equal((await b("POST", "/api/frq/frq-calc-ab-1/puanla", { denemeId: t.govde.denemeId, puanlar: tam })).durum, 404);
  assert.equal((await b("GET", "/api/frq/deneme/" + t.govde.denemeId)).durum, 404);
  const g = await o("GET", "/api/frq/gecmis");
  assert.equal(g.govde.gecmis[0].frqId, "frq-calc-ab-1"); assert.equal(g.govde.gecmis[0].toplam, 0); assert.equal(g.govde.gecmis[0].puanlandi, true);
  const d = await o("GET", "/api/frq/deneme/" + t.govde.denemeId);
  assert.equal(d.durum, 200); assert.ok(d.govde.frq.parcalar[0].rubrik.length);
  const l = await o("GET", "/api/frq?ders=calculus");
  assert.equal(l.govde.frq.find(x => x.id === "frq-calc-ab-1").son.toplam, 0);
  assert.ok(db().prepare("SELECT 1 FROM audit_log WHERE eylem = 'frq.puanla' AND user_id = ?").get(o.uid));
});

test("ücretsiz plan: ders başına 1 FRQ (aynısı yeniden çözülebilir, diğeri 402); başka ders ayrı hak; Premium sınırsız", async () => {
  const o = await ogrenci();
  assert.equal((await o("POST", "/api/frq/frq-calc-ab-1/teslim", { cevaplar: { a: "x" } })).durum, 200);
  assert.equal((await o("POST", "/api/frq/frq-calc-ab-1/teslim", { cevaplar: { a: "tekrar" } })).durum, 200, "aynı FRQ yeniden");
  const k = await o("POST", "/api/frq/frq-calc-ab-2/teslim", { cevaplar: { a: "y" } });
  assert.equal(k.durum, 402); assert.equal(k.govde.premiumGerekli, true); assert.equal(k.govde.ders, "calculus-ab");
  assert.equal((await o("GET", "/api/frq/frq-calc-ab-2")).durum, 402, "kilitli soru metni de açılmaz");
  const l = await o("GET", "/api/frq?ders=calculus");
  const by = Object.fromEntries(l.govde.frq.map(f => [f.id, f]));
  assert.equal(by["frq-calc-ab-1"].kilitli, false); assert.equal(by["frq-calc-ab-2"].kilitli, true);
  assert.equal(by["frq-calc-bc-1"].kilitli, false, "BC ayrı ders anahtarı");
  assert.equal(l.govde.haklar["calculus-ab"].kullanilan, 1);
  assert.equal((await o("POST", "/api/frq/frq-calc-bc-1/teslim", { cevaplar: {} })).durum, 200);
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM frq_denemeleri WHERE user_id = ? AND frq_id = 'frq-calc-ab-2'").get(o.uid).n, 0);
  // Premium
  const p = await ogrenci(true);
  for (const id of ["frq-calc-ab-1", "frq-calc-ab-2"]) assert.equal((await p("POST", "/api/frq/" + id + "/teslim", { cevaplar: { a: "p" } })).durum, 200, id);
  const pl = await p("GET", "/api/frq?ders=calculus");
  assert.equal(pl.govde.premium, true);
  assert.ok(pl.govde.frq.every(f => !f.kilitli));
  // ücretsiz kullanıcı sonradan Premium olunca kilit kalkar
  app.hesap.premiumVer(o.uid, "aylik", null, { kaynak: "elle" });
  assert.equal((await o("POST", "/api/frq/frq-calc-ab-2/teslim", { cevaplar: {} })).durum, 200);
});

test("yönetici: arşiv öğrenciden gizler; JSON düzenleme sürümlü + doğrulamalı + çakışma 409; öğrenci yönetici uçlarına 403", async () => {
  const y = await yonetici(), o = await ogrenci();
  await onayla("frq-phys1-1");
  assert.equal((await o("GET", "/api/frq/frq-phys1-1")).durum, 200);
  const a = await y("POST", "/api/admin/frq/frq-phys1-1/durum", { durum: "arsiv" });
  assert.equal(a.durum, 200);
  assert.equal((await o("GET", "/api/frq/frq-phys1-1")).durum, 404);
  assert.ok(db().prepare("SELECT 1 FROM audit_log WHERE eylem = 'frq.arsiv' AND varlik_id = 'frq-phys1-1'").get());
  const d = await y("GET", "/api/admin/frq/frq-phys1-1");
  assert.equal(d.durum, 200); assert.equal(d.govde.frq.durum, "arsiv");
  const veri = Object.assign({}, d.govde.frq); ["durum", "surum", "guncelleme", "elle"].forEach(k => delete veri[k]);
  veri.baslik = veri.baslik + " (revised)";
  const bozuk = JSON.parse(JSON.stringify(veri)); bozuk.parcalar[0].puan += 1;
  const b = await y("PUT", "/api/admin/frq/frq-phys1-1", { veri: bozuk, surum: d.govde.frq.surum });
  assert.equal(b.durum, 400); assert.ok(b.govde.sorunlar.length);
  const k = await y("PUT", "/api/admin/frq/frq-phys1-1", { veri, surum: d.govde.frq.surum, not: "başlık" });
  assert.equal(k.durum, 200); assert.equal(k.govde.surum, d.govde.frq.surum + 1);
  assert.equal((await y("PUT", "/api/admin/frq/frq-phys1-1", { veri, surum: d.govde.frq.surum })).durum, 409);
  const s = db().prepare("SELECT baslik, elle, durum FROM frq WHERE id = 'frq-phys1-1'").get();
  assert.match(s.baslik, /revised/); assert.equal(s.elle, 1); assert.equal(s.durum, "arsiv");
  const eski = await y("GET", "/api/admin/frq/frq-phys1-1?surum=1");
  assert.equal(eski.govde.eskiSurum.durum, "taslak");
  assert.ok(db().prepare("SELECT 1 FROM audit_log WHERE eylem = 'frq.duzenle' AND varlik_id = 'frq-phys1-1'").get());
  const liste = await y("GET", "/api/admin/frq?durum=taslak");
  assert.equal(liste.durum, 200); assert.ok(liste.govde.frq.every(f => f.durum === "taslak")); assert.ok(liste.govde.durumSay.arsiv >= 1);
  assert.equal((await o("GET", "/api/admin/frq")).durum, 403);
  assert.equal((await o("POST", "/api/admin/frq/frq-bio-1/durum", { durum: "aktif" })).durum, 403);
});

test("tohum sürümü 1 → 2: yöneticinin dokunmadığı taslak FRQ tohumdaki onayı alır; yönetici kararı ve düzenlemesi korunur", () => {
  const { tohumEsitle } = require("../frq");
  const db = app.db;
  // Bu noktada sınama veritabanı sürüm 1 (hepsi taslak) tohumuyla kurulu; önceki testlerde yönetici bazılarını onayladı/arşivledi/düzenledi.
  const dokunulan = new Set(db.prepare("SELECT DISTINCT frq_id FROM frq_gecmis WHERE degistiren GLOB '[0-9]*'").all().map(x => x.frq_id));
  assert.ok(dokunulan.has("frq-phys1-1") && dokunulan.has("frq-calc-ab-1"));
  const once = Object.fromEntries(db.prepare("SELECT id, durum, veri FROM frq").all().map(r => [r.id, r]));
  const f2 = path.join(klasor, "frq-v2.json");
  fs.writeFileSync(f2, JSON.stringify(GERCEK));
  const s = tohumEsitle(db, f2);
  assert.equal(s.mod, "guncelleme");
  const sonra = Object.fromEntries(db.prepare("SELECT id, durum, veri, guncelleyen FROM frq").all().map(r => [r.id, r]));
  for (const f of GERCEK.frq) {
    if (dokunulan.has(f.id)) assert.equal(sonra[f.id].durum, once[f.id].durum, f.id + " yönetici kararı korunur");
    else { assert.equal(sonra[f.id].durum, "aktif", f.id); assert.equal(sonra[f.id].guncelleyen, "tohum"); assert.ok(JSON.parse(sonra[f.id].veri).ek.onay, f.id); }
  }
  assert.equal(sonra["frq-phys1-1"].durum, "arsiv", "yönetici arşivi korunur");
  assert.match(JSON.parse(sonra["frq-phys1-1"].veri).baslik, /revised/, "yönetici düzenlemesi korunur");
  // ikinci çalıştırma: güncel
  assert.equal(tohumEsitle(db, f2).mod, "guncel");
});

test("tohum yeniden eşitleme: yeni sürümde yönetici düzenlemesi korunur, durum korunur", () => {
  const { tohumEsitle } = require("../frq");
  const t = JSON.parse(fs.readFileSync(TOHUM, "utf8"));
  t.surum = 99;
  t.frq.forEach(f => { f.baslik = f.baslik + " v99"; });
  const dosya = require("path").join(require("os").tmpdir(), "frq-tohum-test-" + process.pid + ".json");
  fs.writeFileSync(dosya, JSON.stringify(t));
  try {
    const s = tohumEsitle(db(), dosya);
    assert.equal(s.mod, "guncelleme");
    assert.ok(s.korunan.includes("frq-phys1-1"));
    assert.match(db().prepare("SELECT baslik FROM frq WHERE id = 'frq-bio-1'").get().baslik, / v99$/);
    assert.equal(db().prepare("SELECT durum FROM frq WHERE id = 'frq-calc-ab-1'").get().durum, "aktif");
    assert.doesNotMatch(db().prepare("SELECT baslik FROM frq WHERE id = 'frq-phys1-1'").get().baslik, / v99$/);
  } finally { fs.unlinkSync(dosya); }
});

test("sayfa: /frq frq.html'i sunar; tohum HTTP ile alınamaz", async () => {
  const c = istemci();
  const r = await c("GET", "/frq");
  assert.equal(r.durum, 200);
  assert.match(r.govde, /<meta name="meberra-sayfa" content="frq">/);
  assert.equal((await c("GET", "/server/tohum/frq.json")).durum, 404);
});
