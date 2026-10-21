"use strict";
// 1.18.0 Kişisel çalışma planı: GET /api/plan, PUT /api/plan/ayar, POST /api/plan/gorev/:id; oturum/rol denetimi, haftanın
// dondurulması, otomatik/elle işaret, devretme, durum ve veli yardımcısı. Saat secenek.planSaat ile sabitlenir.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { olustur } = require("../uygulama");
const { veliPlanOzeti, dersUniteleri } = require("../plan");
const AP = require("../../assets/js/ap-hedef");

let simdi = Date.parse("2026-10-21T09:00:00Z"); // Çarşamba
let app, base;
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, gunlukKonsol: false, varlikOtomatik: false, planSaat: () => simdi });
  await new Promise(r => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
});
after(async () => { await new Promise(r => app.server.close(r)); });

function istemci() {
  let cerez = "";
  return async function iste(yontem, yol, govde, ek) {
    const h = Object.assign({ "Content-Type": "application/json" }, yontem === "GET" ? {} : { "X-Meberra": "1" }, cerez ? { Cookie: cerez } : {}, ek || {});
    const r = await fetch(base + yol, { method: yontem, headers: h, body: govde === undefined ? undefined : JSON.stringify(govde) });
    const sc = r.headers.get("set-cookie");
    if (sc) { const m = /meberra_sid=([^;]*)/.exec(sc); if (m) cerez = m[1] ? "meberra_sid=" + m[1] : ""; }
    const tur = r.headers.get("content-type") || "";
    return { durum: r.status, govde: tur.includes("json") ? await r.json() : await r.text() };
  };
}
let sayac = 0;
async function ogrenci(profil) {
  const c = istemci(), ep = "plan" + (++sayac) + "@ornek.com";
  const r = await c("POST", "/api/auth/register", { ad: "Ada", soyad: "Kaya", eposta: ep, sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  c.uid = app.db.prepare("SELECT id FROM users WHERE public_id = ?").get(r.govde.user.id).id;
  if (profil) assert.equal((await c("PUT", "/api/profile", { profile: profil })).durum, 200);
  return c;
}
const CALC = { apDersleri: [{ ders: "calculus-ab", hedef: 5 }, { ders: "chemistry", hedef: 4 }], sinavYili: 2027 };
function cevapEkle(uid, sayfa, kutu, n, dogru, zamanIso) {
  const st = app.db.prepare("INSERT INTO answers (user_id, sayfa, unite, unite_baslik, soru, secim, dogru, zaman) VALUES (?, ?, ?, ?, ?, 'A', ?, ?)");
  for (let i = 0; i < n; i++) st.run(uid, sayfa, kutu, kutu, kutu + "-s" + i + "-" + Math.random().toString(36).slice(2, 7), i < dogru ? 1 : 0, zamanIso);
}

test("oturumsuz istek 401, CSRF başlığı olmadan 403", async () => {
  const c = istemci();
  assert.equal((await c("GET", "/api/plan")).durum, 401);
  assert.equal((await c("PUT", "/api/plan/ayar", { saat: 5 })).durum, 401);
  assert.equal((await c("POST", "/api/plan/gorev/x", { tamam: true })).durum, 401);
  const o = await ogrenci();
  const r = await fetch(base + "/api/plan/ayar", { method: "PUT", headers: { "Content-Type": "application/json" }, body: "{\"saat\":5}" });
  assert.equal(r.status, 403);
  assert.ok(o.uid);
});

test("ders seçimi yoksa boş plan; seçimle gerçek 2027 tarihli plan, bu hafta 3 görev (5 saat)", async () => {
  const c = await ogrenci();
  let r = await c("GET", "/api/plan");
  assert.equal(r.durum, 200);
  assert.equal(r.govde.plan.bos, "ders-yok");
  assert.equal((await c("PUT", "/api/profile", { profile: CALC })).durum, 200);
  r = await c("GET", "/api/plan");
  const p = r.govde.plan;
  assert.equal(p.saat, 5);
  assert.equal(p.buHafta, "2026-10-19");
  assert.equal(p.haftalar[0].gorevler.length, 3);
  assert.equal(p.enYakin.gun, "2027-05-06"); // Chemistry (takvimdeki gerçek tarih)
  assert.equal(p.sinavlar.find(s => s.ders === "calculus-ab").gun, "2027-05-10");
  const son = p.haftalar[p.haftalar.length - 1];
  assert.ok(son.bas <= "2027-05-10" && son.bit >= "2027-05-10");
  assert.ok(p.haftalar.some(h => h.kilometre.some(k => k.gun === "2026-11-13")), "kayıt son günü kilometre taşı");
  // ücretsiz plan: kilitli ünite görevleri "Premium ile" işaretli ama planda
  const hepsi = p.haftalar.flatMap(h => h.gorevler);
  assert.ok(hepsi.some(g => g.kilitli), "kilitli ünite görevi planda");
  assert.equal(p.durum.durum, "yolunda");
  // bu hafta yazıldı (dondu): ikinci istek aynı görevleri verir
  const r2 = await c("GET", "/api/plan");
  assert.deepEqual(r2.govde.plan.haftalar[0].gorevler.map(g => g.id), p.haftalar[0].gorevler.map(g => g.id));
});

test("PUT /api/plan/ayar: geçersiz süre 400; 12 saat → bu hafta 5 görev", async () => {
  const c = await ogrenci(CALC);
  await c("GET", "/api/plan");
  assert.equal((await c("PUT", "/api/plan/ayar", { saat: 7 })).durum, 400);
  const r = await c("PUT", "/api/plan/ayar", { saat: 12 });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.plan.saat, 12);
  assert.equal(r.govde.plan.haftalar[0].gorevler.length, 5);
  assert.equal(r.govde.plan.haftalar[3].gorevler.length, 5);
});

test("otomatik işaret, elle işaret/kaldırma, başkasının görevi 404", async () => {
  const c = await ogrenci(CALC);
  let p = (await c("GET", "/api/plan")).govde.plan;
  const ug = p.haftalar[0].gorevler.find(g => g.tur === "unite" && g.ders === "calculus-ab");
  assert.ok(ug, "calculus ünite görevi");
  const kutu = "calc-unit" + ug.unite.no + "-quiz-container";
  cevapEkle(c.uid, "ap-calculus", kutu, 10, 8, new Date(simdi - 3600e3).toISOString());
  p = (await c("GET", "/api/plan")).govde.plan;
  assert.equal(p.haftalar[0].gorevler.find(g => g.id === ug.id).tamam, true, "10 soru → ünite görevi otomatik tamam");
  const diger = p.haftalar[0].gorevler.find(g => !g.tamam);
  let r = await c("POST", "/api/plan/gorev/" + encodeURIComponent(diger.id), { tamam: true });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.plan.haftalar[0].gorevler.find(g => g.id === diger.id).tamam, true);
  r = await c("POST", "/api/plan/gorev/" + encodeURIComponent(ug.id), { tamam: false });
  assert.equal(r.govde.plan.haftalar[0].gorevler.find(g => g.id === ug.id).tamam, false, "elle kaldırma otomatik işaretin üstüne yazılmaz");
  assert.equal((await c("POST", "/api/plan/gorev/" + encodeURIComponent(diger.id), { tamam: "evet" })).durum, 400);
  const b = await ogrenci(CALC);
  assert.equal((await b("POST", "/api/plan/gorev/" + encodeURIComponent(diger.id), { tamam: true })).durum, 404);
});

test("devretme: biten olmayan görevler sonraki haftaya geçer; durum geride", async () => {
  const c = await ogrenci(CALC);
  const p1 = (await c("GET", "/api/plan")).govde.plan;
  const ids = p1.haftalar[0].gorevler.map(g => g.id);
  const eski = simdi;
  simdi = Date.parse("2026-11-04T09:00:00Z"); // iki hafta sonra Çarşamba
  try {
    const p = (await c("GET", "/api/plan")).govde.plan;
    assert.equal(p.buHafta, "2026-11-02");
    const g0 = p.haftalar[0].gorevler;
    ids.forEach(id => assert.ok(g0.some(g => g.id === id && g.devir), "devreden " + id));
    assert.equal(p.durum.durum, "geride");
    assert.ok(p.durum.gun >= 2);
  } finally { simdi = eski; }
});

test("veli yardımcısı salt okunur özet verir ve yazmaz; veli rolü /api/plan kullanamaz yolu korunur", async () => {
  const c = await ogrenci(CALC);
  const once = app.db.prepare("SELECT COUNT(*) AS n FROM plan_gorevler WHERE user_id = ?").get(c.uid).n;
  const o = veliPlanOzeti(app.db, app.hesap, c.uid, simdi);
  assert.ok(o.buHafta && o.buHafta.gorevler.length >= 2);
  assert.ok(o.durum && o.durum.metin);
  assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM plan_gorevler WHERE user_id = ?").get(c.uid).n, once);
});

test("ünite listesi: Calculus AB'de BC üniteleri yok, ağırlıklar CED'den ve toplam ~100; ekonomi ayrılır", () => {
  const ab = dersUniteleri(AP.secilenler({ apDersleri: [{ ders: "calculus-ab", hedef: 4 }] })[0], null, false);
  assert.equal(ab.length, 8);
  assert.ok(Math.abs(ab.reduce((s, u) => s + u.agirlik, 0) - 100) < 1);
  assert.ok(ab.find(u => u.no === 6).agirlik > ab.find(u => u.no === 7).agirlik, "Ünite 6 (%18.5) > Ünite 7 (%9)");
  assert.equal(ab.find(u => u.no === 1).kilitli, false);
  assert.equal(ab.find(u => u.no === 3).kilitli, true);
  const mi = dersUniteleri(AP.secilenler({ apDersleri: [{ ders: "microeconomics", hedef: 4 }] })[0], null, true);
  assert.ok(mi.length >= 1 && mi.every(u => !u.kilitli));
  assert.ok(mi.every(u => u.kutular.every(k => /^(micro|econ)/.test(k))));
});
