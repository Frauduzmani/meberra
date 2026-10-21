"use strict";
// v1.11.0 onay kuyruğu: tohumdaki taslak sorular öğrenciye HİÇBİR uçta sunulmaz (ünite listeleri, cevap, getir, deneme katalog /
// kurulum / yanlışlar / eski deneme incelemesi, seviye, demo); yönetici toplu onaylar (taslak → aktif, yeni sürüm + geçmiş)
// ya da reddeder (→ arsiv, neden); uçlar yalnız yöneticiye ve denetim kaydına yazılır; tohum güncellemesi yeni taslakları ekler.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { olustur } = require("../uygulama");
const { TOHUM, TOHUM_AYAR, tohumSurumOku } = require("../sorubankasi");

const GUNCEL = JSON.parse(fs.readFileSync(TOHUM, "utf8"));
const TASLAK = GUNCEL.sorular.filter(r => r.durum === "taslak");
const FIZIK8 = TASLAK.filter(r => r.kutu === "phys-unit8-quiz-container").map(r => r.id);
const BIYO8 = TASLAK.filter(r => r.kutu === "bio-unit8-quiz-container").map(r => r.id);
const CALC1 = TASLAK.filter(r => r.kutu === "calc-unit1-quiz-container").map(r => r.id);
const ENG = TASLAK.filter(r => r.pasaj).map(r => r.id);
const klasor = fs.mkdtempSync(path.join(os.tmpdir(), "meberra-onay-"));

let app, base;
before(async () => { app = await ac(":memory:"); base = app.base; });
after(async () => {
  await kapat(app);
  try { fs.rmSync(klasor, { recursive: true, force: true }); } catch (e) { /* Windows: WAL kilidi */ }
});

async function ac(dbDosya, tohumDosyasi) {
  const a = olustur({ dbDosya, yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, gunlukKonsol: false, varlikOtomatik: false, soruTohumDosyasi: tohumDosyasi });
  await new Promise(r => a.server.listen(0, "127.0.0.1", r));
  a.base = "http://127.0.0.1:" + a.server.address().port;
  return a;
}
const kapat = a => new Promise(r => a.server.close(r));
function istemci(a) {
  let cerez = "";
  return async function iste(yontem, yol, govde) {
    const h = Object.assign({ "Content-Type": "application/json" }, yontem === "GET" ? {} : { "X-Meberra": "1" }, cerez ? { Cookie: cerez } : {});
    const r = await fetch((a || app).base + yol, { method: yontem, headers: h, body: govde === undefined ? undefined : JSON.stringify(govde) });
    const sc = r.headers.get("set-cookie");
    if (sc) { const m = /meberra_sid=([^;]*)/.exec(sc); if (m) cerez = m[1] ? "meberra_sid=" + m[1] : ""; }
    const tur = r.headers.get("content-type") || "";
    return { durum: r.status, govde: tur.includes("json") ? await r.json() : await r.text() };
  };
}
let sayac = 0;
async function ogrenci(premium, a) {
  a = a || app;
  const c = istemci(a), ep = "ok" + (++sayac) + "@ornek.com";
  const r = await c("POST", "/api/auth/register", { ad: "Ada", soyad: "Kaya", eposta: ep, sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  c.uid = a.db.prepare("SELECT id FROM users WHERE public_id = ?").get(r.govde.user.id).id;
  if (premium) a.hesap.premiumVer(c.uid, "aylik", null, { kaynak: "elle" });
  return c;
}
async function yonetici(a, ep) {
  a = a || app; ep = ep || "okyon@ornek.com";
  a.hesap.yoneticiHazirla(ep, "Yonetici-12345");
  const c = istemci(a);
  assert.equal((await c("POST", "/api/auth/login", { kimlik: ep, sifre: "Yonetici-12345" })).durum, 200);
  c.uid = a.db.prepare("SELECT id FROM users WHERE eposta = ?").get(ep).id;
  return c;
}
const satir = (id, a) => (a || app).db.prepare("SELECT * FROM questions_bank WHERE id = ?").get(id);
const icerir = (o, ids) => { const s = JSON.stringify(o); return ids.some(id => s.includes('"' + id + '"') || s.includes("|" + id + '"')); };

test("tohum: 229 taslak, hepsi 1.11.0 üretimi; yeni kutular ücretsiz kurala göre Premium", () => {
  assert.equal(TASLAK.length, 229);
  assert.ok(TASLAK.every(r => r.ek && r.ek.uretim === "1.11.0"));
  assert.equal(FIZIK8.length, 20); assert.equal(BIYO8.length, 20);
  const kural = require("../../assets/js/ucretsiz-kural.js");
  assert.equal(kural.apKutuUcretsizMi("ap-physics", "phys-unit8-quiz-container"), false);
  assert.equal(kural.apKutuUcretsizMi("ap-biology", "bio-unit8-quiz-container"), false);
  assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM questions_bank WHERE durum = 'taslak'").get().n, 229);
});

test("taslak öğrenciye hiçbir uçta sunulmaz (Premium öğrenci bile)", async () => {
  const o = await ogrenci(true);
  // ünite listeleri
  let r = await o("GET", "/api/sorular-bankasi/ap-physics");
  assert.equal(r.durum, 200);
  assert.ok(!r.govde.kutular.some(k => k.kutu === "phys-unit8-quiz-container"), "taslak-yalnız kutu listede yok");
  assert.equal((await o("GET", "/api/sorular-bankasi/ap-physics/phys-unit8-quiz-container")).durum, 404);
  assert.equal((await o("GET", "/api/sorular-bankasi/ap-physics/9")).durum, 404);
  assert.equal((await o("GET", "/api/sorular-bankasi/ap-biology/bio-unit8-quiz-container")).durum, 404);
  r = await o("GET", "/api/sorular-bankasi/ap-calculus/1");
  assert.equal(r.govde.kutular[0].sorular.length, 22);
  assert.equal(icerir(r.govde, CALC1), false);
  r = await o("GET", "/api/sorular-bankasi/ap-calculus");
  assert.equal(r.govde.kutular.find(k => k.kutu === "calc-unit1-quiz-container").toplam, 22, "sayılar taslağı içermez");
  // cevap ve getir (Bugünkü tekrar)
  assert.equal((await o("POST", "/api/sorular-bankasi/cevap", { soruId: CALC1[0], secim: "A" })).durum, 404);
  r = await o("POST", "/api/sorular-bankasi/getir", { anahtarlar: ["ap-calculus|" + CALC1[0], "ap-physics|" + FIZIK8[0]] });
  assert.equal(r.durum, 200);
  assert.deepEqual(Object.keys(r.govde.sorular), []);
  assert.equal(r.govde.eksik.length, 2);
  // deneme katalog + kurulum + yanlışlar
  r = await o("GET", "/api/deneme/katalog");
  assert.equal(icerir(r.govde.sorular, TASLAK.map(x => x.id)), false);
  assert.ok(!Object.keys(r.govde.pasajlar).some(k => /Passage [456]$/.test(k)), "taslak pasajları gönderilmez");
  assert.ok(r.govde.pasajlar["eng-reading-quiz-container:Passage 1"]);
  for (const kod of ["physics-1", "biology", "calculus-ab", "english-language", "economics", "chemistry"]) {
    r = await o("POST", "/api/deneme/olustur", { kod, adet: "tam", seed: 11 });
    assert.equal(r.durum, 200, kod + " " + JSON.stringify(r.govde));
    assert.equal(icerir(r.govde, TASLAK.map(x => x.id)), false, kod);
  }
  r = await o("POST", "/api/deneme/olustur", { mod: "yanlislar", sorular: FIZIK8.slice(0, 3).map(id => ({ k: "ap-physics.html|" + id, kod: "physics-1" })) });
  assert.equal(r.durum, 400);
  // istemciden eşitlenmiş eski deneme kaydı taslak anahtarı taşısa bile içerik/çözüm verilmez
  const aktifFizik = app.db.prepare("SELECT id FROM questions_bank WHERE sayfa = 'ap-physics' AND durum = 'aktif' LIMIT 1").get().id;
  app.veri.uygula(o.uid, { "apmeberra:deneme:v1": JSON.stringify({ v: 1, gecmis: [{ id: "eski-onay-1", kod: "physics-1", ad: "Eski", tarih: new Date().toISOString(), soruSayisi: 2,
    dogru: 0, yanlis: 0, bos: 2, yuzde: 0, inceleme: [{ k: "ap-physics.html|" + FIZIK8[0], kod: "physics-1" }, { k: "ap-physics.html|" + aktifFizik, kod: "physics-1" }] }] }) });
  r = await o("GET", "/api/deneme/eski-onay-1");
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  assert.ok(r.govde.icerik["ap-physics.html|" + aktifFizik]);
  assert.equal(r.govde.icerik["ap-physics.html|" + FIZIK8[0]], undefined);
  assert.equal(r.govde.cozumler["ap-physics.html|" + FIZIK8[0]], undefined);
  // demo sorusu taslağa alınırsa kapanır
  app.db.prepare("UPDATE questions_bank SET durum = 'taslak' WHERE id = 'vitrin_demo_1'").run();
  try {
    assert.equal((await istemci()("GET", "/api/public/demo-soru")).durum, 404);
    assert.equal((await istemci()("POST", "/api/public/demo-soru/cevap", { secim: "B" })).durum, 404);
  } finally { app.db.prepare("UPDATE questions_bank SET durum = 'aktif' WHERE id = 'vitrin_demo_1'").run(); }
});

test("seviye: panelde eklenen taslak seviye sorusu bankada görünmez, teslimde puanlanmaz", async () => {
  const y = await yonetici();
  const ek = await y("POST", "/api/admin/soru-bankasi/soru", { tur: "seviye", ders: "chemistry", unite: "1", govde: "Taslak seviye sorusu: hangisi soy gazdır?",
    secenekler: [{ text: "Neon" }, { text: "Azot" }, { text: "Oksijen" }, { text: "Klor" }], dogru: "A", zorluk: "easy", konu: "Periyodik tablo" });
  assert.equal(ek.durum, 200, JSON.stringify(ek.govde));
  assert.equal(satir(ek.govde.id).durum, "taslak");
  const o = await ogrenci(false);
  const b = await o("GET", "/api/seviye/bankalar");
  assert.ok(!b.govde.bankalar.chemistry.sorular.some(x => x.id === ek.govde.id));
  const t = await o("POST", "/api/seviye/teslim", { cevaplar: { ["chemistry|" + ek.govde.id]: "A" } });
  assert.equal(t.durum, 400, "yalnız taslak anahtarı → geçerli soru yok");
  const c = await o("POST", "/api/seviye/cozumler", { anahtarlar: ["chemistry|" + ek.govde.id] });
  assert.deepEqual(c.govde.cozumler, {});
});

test("onay kuyruğu uçları yalnız yöneticiye", async () => {
  const misafir = istemci(), o = await ogrenci(true);
  for (const [y, p, b] of [["GET", "/api/admin/soru-bankasi/onay-kuyrugu"], ["POST", "/api/admin/soru-bankasi/onayla", { ids: [FIZIK8[0]] }],
    ["POST", "/api/admin/soru-bankasi/reddet", { ids: [FIZIK8[0]], neden: "deneme" }]]) {
    assert.equal((await misafir(y, p, b)).durum, 401, "misafir " + p);
    assert.equal((await o(y, p, b)).durum, 403, "öğrenci " + p);
  }
  assert.equal(satir(FIZIK8[0]).durum, "taslak");
});

test("onay kuyruğu listesi: sayılar, filtreler, önizleme (doğru şık + açıklama + pasaj)", async () => {
  const y = await yonetici();
  let r = await y("GET", "/api/admin/soru-bankasi/onay-kuyrugu");
  assert.equal(r.durum, 200);
  const toplamTaslak = app.db.prepare("SELECT COUNT(*) AS n FROM questions_bank WHERE durum = 'taslak'").get().n;
  assert.equal(r.govde.sayilar.toplam, toplamTaslak);
  assert.equal(r.govde.toplam, toplamTaslak);
  assert.equal(r.govde.sorular.length, 50);
  const k8 = r.govde.sayilar.kutu.find(k => k.kutu === "phys-unit8-quiz-container");
  assert.equal(k8.n, 20); assert.equal(k8.yeniKutu, true); assert.equal(k8.baslik, "Unit 8 Fluids"); assert.equal(k8.unite_no, 9);
  assert.equal(r.govde.sayilar.kutu.find(k => k.kutu === "calc-unit1-quiz-container").yeniKutu, false);
  assert.ok(r.govde.sayilar.uretim.some(u => u.uretim === "1.11.0" && u.n === 229));
  r = await y("GET", "/api/admin/soru-bankasi/onay-kuyrugu?sayfa=ap-physics&unite=9");
  assert.equal(r.govde.toplam, 20);
  assert.ok(r.govde.sorular.every(x => x.durum === "taslak" && x.dogru && x.aciklama && x.hata_aciklamalari));
  r = await y("GET", "/api/admin/soru-bankasi/onay-kuyrugu?uretim=1.11.0&sayfaBoyu=200&sayfaNo=2");
  assert.equal(r.govde.toplam, 229); assert.equal(r.govde.sorular.length, 29);
  assert.equal((await y("GET", "/api/admin/soru-bankasi/onay-kuyrugu?uretim=0.0.0")).govde.toplam, 0);
  r = await y("GET", "/api/admin/soru-bankasi/onay-kuyrugu?sayfa=ap-english&kutu=eng-reading-quiz-container");
  assert.equal(r.govde.toplam, ENG.length);
  assert.ok(r.govde.pasajlar["eng-reading-quiz-container:Passage 4"].html.length > 100, "önizleme pasaj metni");
});

test("onay: taslak → aktif (yeni sürüm, geçmiş, denetim); öğrenci görür; ücretsiz planda Premium kilidi", async () => {
  const y = await yonetici();
  assert.equal((await y("POST", "/api/admin/soru-bankasi/onayla", { ids: [] })).durum, 400);
  const r = await y("POST", "/api/admin/soru-bankasi/onayla", { ids: FIZIK8.concat(["yok_boyle_soru"]) });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  assert.equal(r.govde.onaylanan, 20);
  assert.deepEqual(r.govde.atlanan, [{ id: "yok_boyle_soru", neden: "bulunamadı" }]);
  const s = satir(FIZIK8[0]);
  assert.equal(s.durum, "aktif"); assert.equal(s.surum, 2); assert.equal(s.guncelleyen, String(y.uid));
  const h = app.db.prepare("SELECT surum, veri, not_, degistiren FROM questions_bank_history WHERE soru_id = ?").get(FIZIK8[0]);
  assert.equal(h.surum, 1); assert.equal(JSON.parse(h.veri).durum, "taslak"); assert.match(h.not_, /onaylandı/); assert.equal(h.degistiren, String(y.uid));
  const denetim = app.db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE eylem = 'soru-bankasi.onayla' AND yapan_id = ?").get(y.uid).n;
  assert.equal(denetim, 20);
  // ikinci kez: taslak değil → atlanır
  const iki = await y("POST", "/api/admin/soru-bankasi/onayla", { ids: [FIZIK8[0]] });
  assert.equal(iki.govde.onaylanan, 0); assert.match(iki.govde.atlanan[0].neden, /taslak değil/);
  // Premium öğrenci yeni kutuyu görür ve cevaplar
  const p = await ogrenci(true);
  let l = await p("GET", "/api/sorular-bankasi/ap-physics");
  const k = l.govde.kutular.find(x => x.kutu === "phys-unit8-quiz-container");
  assert.ok(k); assert.equal(k.toplam, 20); assert.equal(k.baslik, "Unit 8 Fluids");
  l = await p("GET", "/api/sorular-bankasi/ap-physics/phys-unit8-quiz-container");
  assert.equal(l.durum, 200); assert.equal(l.govde.kutular[0].sorular.length, 20);
  assert.equal((await p("POST", "/api/sorular-bankasi/cevap", { soruId: FIZIK8[0], secim: "A" })).durum, 200);
  const kat = await p("GET", "/api/deneme/katalog");
  assert.ok(kat.govde.sorular.some(x => x.id === FIZIK8[0]));
  // Ücretsiz öğrenci: kilitli (402)
  const u = await ogrenci(false);
  l = await u("GET", "/api/sorular-bankasi/ap-physics");
  assert.equal(l.govde.kutular.find(x => x.kutu === "phys-unit8-quiz-container").kilitli, true);
  assert.equal((await u("GET", "/api/sorular-bankasi/ap-physics/phys-unit8-quiz-container")).durum, 402);
  // kuyruk sayısı düştü
  assert.equal((await y("GET", "/api/admin/soru-bankasi/onay-kuyrugu?sayfa=ap-physics&unite=9")).govde.toplam, 0);
});

test("ret: taslak → arsiv, neden kaydedilir (ek.red + geçmiş notu), denetimli; neden zorunlu", async () => {
  const y = await yonetici();
  const ids = BIYO8.slice(0, 2);
  assert.equal((await y("POST", "/api/admin/soru-bankasi/reddet", { ids })).durum, 400, "neden yok");
  const r = await y("POST", "/api/admin/soru-bankasi/reddet", { ids, neden: "Şıklar fazla benzer; yeniden yazılacak." });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  assert.equal(r.govde.reddedilen, 2);
  const s = satir(ids[0]);
  assert.equal(s.durum, "arsiv");
  assert.equal(JSON.parse(s.ek).red.neden, "Şıklar fazla benzer; yeniden yazılacak.");
  assert.match(app.db.prepare("SELECT not_ FROM questions_bank_history WHERE soru_id = ?").get(ids[0]).not_, /^reddedildi: Şıklar/);
  const a = app.db.prepare("SELECT ayrinti FROM audit_log WHERE eylem = 'soru-bankasi.reddet' AND varlik_id = ?").get(ids[0]);
  assert.match(a.ayrinti, /Şıklar fazla benzer/);
  // aktif soru reddedilemez
  const aktif = await y("POST", "/api/admin/soru-bankasi/reddet", { ids: [FIZIK8[1]], neden: "olmaz" });
  assert.equal(aktif.govde.reddedilen, 0);
  assert.equal(satir(FIZIK8[1]).durum, "aktif");
  // reddedilen öğrenciye gitmez
  const o = await ogrenci(true);
  assert.equal((await o("POST", "/api/sorular-bankasi/cevap", { soruId: ids[0], secim: "A" })).durum, 404);
});

test("tohum güncellemesi (sürüm 2 → 3): yeni taslaklar eklenir ve taslak kalır; onaylanan sonraki tohumda korunur", async () => {
  const v2 = JSON.parse(JSON.stringify(GUNCEL));
  v2.surum = GUNCEL.surum - 1;
  v2.sorular = v2.sorular.filter(r => r.durum !== "taslak");
  const f2 = path.join(klasor, "tohum-v2.json"), f4 = path.join(klasor, "tohum-v4.json");
  fs.writeFileSync(f2, JSON.stringify(v2));
  const dbDosya = path.join(klasor, "yukselt.db");
  let a = await ac(dbDosya, f2);
  try {
    assert.equal(a.db.prepare("SELECT COUNT(*) AS n FROM questions_bank WHERE durum = 'taslak'").get().n, 0);
  } finally { await kapat(a); }
  a = await ac(dbDosya, TOHUM);
  let yid;
  try {
    assert.equal(tohumSurumOku(a.db), GUNCEL.surum);
    assert.equal(a.db.prepare("SELECT COUNT(*) AS n FROM questions_bank WHERE durum = 'taslak'").get().n, 229);
    assert.equal(a.db.prepare("SELECT COUNT(*) AS n FROM questions_bank WHERE durum = 'aktif'").get().n, v2.sorular.filter(r => r.durum === "aktif").length);
    assert.ok(a.db.prepare("SELECT 1 FROM system_logs WHERE mesaj LIKE ?").get("%229 eklendi%"));
    const y = await yonetici(a, "okyon2@ornek.com");
    yid = y.uid;
    assert.equal((await y("POST", "/api/admin/soru-bankasi/onayla", { ids: [CALC1[0]] })).govde.onaylanan, 1);
  } finally { await kapat(a); }
  // Sonraki tohum sürümü soruyu yine "taslak" taşır: yönetici onayı korunur
  fs.writeFileSync(f4, JSON.stringify(Object.assign({}, GUNCEL, { surum: GUNCEL.surum + 1 })));
  a = await ac(dbDosya, f4);
  try {
    assert.equal(satir(CALC1[0], a).durum, "aktif");
    assert.equal(satir(CALC1[0], a).guncelleyen, String(yid));
    assert.equal(a.db.prepare("SELECT deger FROM ayarlar WHERE anahtar = ?").get(TOHUM_AYAR).deger, String(GUNCEL.surum + 1));
  } finally { await kapat(a); }
});
