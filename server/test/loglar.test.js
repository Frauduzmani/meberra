"use strict";
// Sistem logları: günlük servisi (birleştirme, gizli veri temizliği, saklama), 500 yakalama, istemci raporu (/api/log),
// yönetici uç noktaları (yetki, durum değişikliği + denetim kaydı), güvenlik uyarısı, yavaş istek.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { olustur } = require("../uygulama");
const db_ = require("../db");
const { gunlukServisi, temizle, metinTemizle } = require("../gunluk");
const { istekIzleyici } = require("../sistem");

let app, base;
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, logSiniri: 5, testRotalari: true, gunlukKonsol: false });
  await new Promise(r => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
});
after(() => new Promise(r => app.server.close(r)));

function istemci(ip) {
  let cerez = "";
  return async function iste(yontem, yol, govde, basliklar) {
    const h = Object.assign({ "Content-Type": "application/json" }, yontem === "GET" ? {} : { "X-Meberra": "1" }, cerez ? { Cookie: cerez } : {}, basliklar || {});
    const r = await fetch(base + yol, { method: yontem, headers: h, body: govde === undefined ? undefined : (typeof govde === "string" ? govde : JSON.stringify(govde)) });
    const sc = r.headers.get("set-cookie");
    if (sc) { const m = /meberra_sid=([^;]*)/.exec(sc); cerez = m && m[1] ? "meberra_sid=" + m[1] : ""; }
    const tur = r.headers.get("content-type") || "";
    return { durum: r.status, govde: tur.includes("json") ? await r.json() : await r.text() };
  };
}
const db = () => app.db;
let yonC = null;
async function yonetici() {
  if (yonC) return yonC;
  app.hesap.yoneticiHazirla("yon@ornek.com", "Yonetici-12345");
  yonC = istemci();
  assert.equal((await yonC("POST", "/api/auth/login", { kimlik: "yon@ornek.com", sifre: "Yonetici-12345" })).durum, 200);
  return yonC;
}
async function ogrenci(ep) {
  const c = istemci();
  const r = await c("POST", "/api/auth/register", { ad: "Ali", soyad: "Kaya", eposta: ep, sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true, veliOnay: true });
  assert.equal(r.durum, 200);
  return c;
}

test("günlük: aynı parmak izi 1 saat içinde birleşir, sonra yeni satır; çözülen hata tekrar ederse yeni satır", () => {
  const vt = db_.ac(":memory:");
  let t = Date.parse("2026-10-21T10:00:00Z");
  const g = gunlukServisi(vt, { konsol: false, saat: () => t });
  const hata = { stack: "Error: x\n    at f (/srv/a.js:1:2)" };
  const id = g.hata("sunucu", "Bir şey bozuldu", hata);
  t += 30 * 60e3;
  assert.equal(g.hata("sunucu", "Bir şey bozuldu", hata), id, "30 dk sonra aynı kayıt");
  let s = vt.prepare("SELECT * FROM system_logs WHERE id = ?").get(id);
  assert.equal(s.adet, 2);
  assert.equal(s.son_zaman, "2026-10-21T10:30:00.000Z");
  assert.equal(s.zaman, "2026-10-21T10:00:00.000Z");
  // Farklı ilk yığın çerçevesi → farklı parmak izi
  assert.notEqual(g.hata("sunucu", "Bir şey bozuldu", { stack: "Error: x\n    at g (/srv/b.js:9:9)" }), id);
  // Son görülmeden 1 saatten fazla sonra → yeni satır
  t += 61 * 60e3;
  const id2 = g.hata("sunucu", "Bir şey bozuldu", hata);
  assert.notEqual(id2, id);
  // Çözüldü olarak işaretlenen kayıt birleşmez (gerileme yeni kayıt açar); incelendi birleşir
  vt.prepare("UPDATE system_logs SET durum = 'cozuldu' WHERE id = ?").run(id2);
  const id3 = g.hata("sunucu", "Bir şey bozuldu", hata);
  assert.notEqual(id3, id2);
  vt.prepare("UPDATE system_logs SET durum = 'incelendi' WHERE id = ?").run(id3);
  assert.equal(g.hata("sunucu", "Bir şey bozuldu", hata), id3);
  // Geçersiz seviye/kaynak güvenli varsayılana döner
  const id4 = g.yaz("ölümcül", "uzay", "x");
  s = vt.prepare("SELECT seviye, kaynak FROM system_logs WHERE id = ?").get(id4);
  assert.deepEqual([s.seviye, s.kaynak], ["hata", "sunucu"]);
  vt.close();
});

test("günlük: şifre, belirteç, çerez ve Authorization yazılmaz; IP yalnızca özet", () => {
  const vt = db_.ac(":memory:");
  const g = gunlukServisi(vt, { konsol: false });
  const id = g.uyari("sunucu", "Giriş sorunu Bearer abc.def.ghi", {
    sifre: "Gizli-12345", password: "p", token: "t0k", headers: { Authorization: "Basic Zm9vOmJhcg==", cookie: "meberra_sid=OTURUM123" },
    ic: { yeniSifre: "x", liste: [{ belirtec: "b" }] }, url: "https://site/api/public/veli?t=VELIBELIRTEC&islem=iptal",
    stack: "Error\n    at x (https://site/a.js?token=ABC123:10:5)", not: 'gövde {"sifre":"Acik-Metin"}', ip: "203.0.113.7"
  });
  const s = vt.prepare("SELECT * FROM system_logs WHERE id = ?").get(id);
  const ham = s.mesaj + s.ayrinti;
  for (const sir of ["Gizli-12345", "t0k", "Zm9vOmJhcg", "OTURUM123", "VELIBELIRTEC", "ABC123", "Acik-Metin", "abc.def.ghi", "203.0.113.7"]) assert.ok(!ham.includes(sir), sir + " sızmamalı");
  const a = JSON.parse(s.ayrinti);
  assert.equal(a.sifre, "[gizli]");
  assert.equal(a.ic.yeniSifre, "[gizli]");
  assert.equal(a.ic.liste[0].belirtec, "[gizli]");
  assert.match(a.url, /islem=iptal/, "gizli olmayan parametre kalır");
  assert.match(a.stack, /:10:5\)/, "satır/sütun korunur");
  assert.match(a.ipOzet, /^[0-9a-f]{12}$/);
  assert.equal(a.ip, undefined);
  assert.equal(temizle({ Authorization: "x" }).Authorization, "[gizli]");
  assert.equal(metinTemizle("a?sifre=123&b=2"), "a?sifre=[gizli]&b=2");
  vt.close();
});

test("500: yöntem/yol/kullanıcı kaydedilir, istek gövdesi asla; yanıt genel mesaj", async () => {
  const c = await ogrenci("hata500@ornek.com");
  const r = await c("POST", "/api/test/hata", { sifre: "GovdeSifresi-999", not: "gizli-govde" });
  assert.equal(r.durum, 500);
  assert.doesNotMatch(JSON.stringify(r.govde), /Test hatası|at /, "yığın istemciye gitmez");
  const s = db().prepare("SELECT * FROM system_logs WHERE kaynak = 'sunucu' AND mesaj LIKE 'Test hatası%' ORDER BY id DESC").get();
  assert.ok(s);
  assert.equal(s.seviye, "hata");
  const a = JSON.parse(s.ayrinti);
  assert.equal(a.method, "POST");
  assert.equal(a.path, "/api/test/hata");
  assert.equal(a.status, 500);
  assert.ok(a.user_id > 0);
  assert.match(a.stack, /sistem\.js/);
  assert.ok(!s.ayrinti.includes("GovdeSifresi-999") && !s.ayrinti.includes("gizli-govde"));
  // Aynı hata tekrar → adet artar
  await c("POST", "/api/test/hata", {});
  assert.equal(db().prepare("SELECT adet FROM system_logs WHERE id = ?").get(s.id).adet, 2);
});

test("test rotası varsayılan olarak kapalı", async () => {
  const a2 = olustur({ dbDosya: ":memory:", yoneticiAtla: true, gunlukKonsol: false });
  await new Promise(r => a2.server.listen(0, "127.0.0.1", r));
  const r = await fetch("http://127.0.0.1:" + a2.server.address().port + "/api/test/hata");
  assert.equal(r.status, 404);
  await new Promise(r => a2.server.close(r));
});

test("istemci raporu: misafir gönderebilir, CSRF, boyut sınırları, IP başına hız sınırı", async () => {
  const c = istemci();
  assert.equal((await c("POST", "/api/log", { mesaj: "x" }, { "X-Meberra": "" })).durum, 403, "CSRF başlığı gerekli");
  assert.equal((await c("POST", "/api/log", { mesaj: "   " })).durum, 400);
  const uzun = await c("POST", "/api/log", { seviye: "uyari", mesaj: "M".repeat(900), stack: "S".repeat(9000), url: "https://site/sayfa.html?token=GIZLI", satir: 12, sutun: "7" });
  assert.equal(uzun.durum, 200);
  const s = db().prepare("SELECT * FROM system_logs WHERE kaynak = 'istemci' ORDER BY id DESC").get();
  assert.equal(s.seviye, "uyari");
  assert.equal(s.mesaj.length, 500);
  const a = JSON.parse(s.ayrinti);
  assert.equal(a.stack.length, 4000);
  assert.equal(a.satir, 12);
  assert.equal(a.sutun, 7);
  assert.ok(!a.url.includes("GIZLI"));
  // 16 KB üstü gövde reddedilir
  assert.equal((await c("POST", "/api/log", { mesaj: "x", stack: "y".repeat(20000) })).durum, 413);
  // Yalnızca hata/uyari: "bilgi" istemciden gelirse hata sayılır
  await c("POST", "/api/log", { seviye: "bilgi", mesaj: "istemci bilgisi" });
  assert.equal(db().prepare("SELECT seviye FROM system_logs WHERE mesaj = 'istemci bilgisi'").get().seviye, "hata");
  // logSiniri: 5 → toplamda (403/400 hariç) 5 kabul, sonra 429
  const kodlar = [];
  for (let i = 0; i < 4; i++) kodlar.push((await c("POST", "/api/log", { mesaj: "seri " + i })).durum);
  assert.ok(kodlar.includes(429), "hız sınırı devreye girer: " + kodlar.join(","));
});

test("yönetici uç noktaları: yalnızca yönetici; liste, filtre, ayrıntı, özet + sağlık", async () => {
  const misafir = istemci(), o = await ogrenci("logogr@ornek.com");
  for (const [y, yol, g] of [["GET", "/api/admin/loglar"], ["GET", "/api/admin/loglar/ozet"], ["GET", "/api/admin/loglar/1"],
    ["POST", "/api/admin/loglar/1/durum", { durum: "cozuldu" }], ["POST", "/api/admin/loglar/toplu", { ids: [1], durum: "cozuldu" }]]) {
    assert.equal((await misafir(y, yol, g)).durum, 401, "misafir " + yol);
    assert.equal((await o(y, yol, g)).durum, 403, "öğrenci " + yol);
  }
  const yon = await yonetici();
  app.gunluk.bilgi("sunucu", "Sunucu başladı");
  app.gunluk.uyari("eposta", "E-posta gönderilemedi (ECONNREFUSED)", { hata: "connect ECONNREFUSED" });
  let r = await yon("GET", "/api/admin/loglar");
  assert.equal(r.durum, 200);
  assert.ok(r.govde.toplam >= 3 && r.govde.loglar.length >= 3);
  assert.ok(r.govde.loglar.every(l => l.id && l.seviye && l.kaynak && l.durum && l.sonZaman && l.adet >= 1));
  r = await yon("GET", "/api/admin/loglar?seviye=uyari&kaynak=eposta&durum=yeni");
  assert.deepEqual(r.govde.loglar.map(l => l.mesaj), ["E-posta gönderilemedi (ECONNREFUSED)"]);
  r = await yon("GET", "/api/admin/loglar?q=ECONNREFUSED");
  assert.equal(r.govde.toplam, 1);
  assert.equal((await yon("GET", "/api/admin/loglar?seviye=kritik")).durum, 400);
  assert.equal((await yon("GET", "/api/admin/loglar?kaynak=x")).durum, 400);
  assert.equal((await yon("GET", "/api/admin/loglar/999999")).durum, 404);
  const id = r.govde.loglar[0].id;
  const d = (await yon("GET", "/api/admin/loglar/" + id)).govde.log;
  assert.equal(d.ayrinti.hata, "connect ECONNREFUSED");
  const oz = (await yon("GET", "/api/admin/loglar/ozet")).govde;
  assert.ok(oz.son24s.hata >= 1 && oz.son24s.uyari >= 1 && oz.son24s.bilgi >= 1);
  assert.ok(oz.yeni.hata >= 1);
  assert.equal(oz.gunluk.length, 7);
  for (const k of ["calismaSn", "bellek", "dbBoyut", "node", "eposta", "zamanlayici"]) assert.ok(k in oz.saglik, k);
  assert.ok(oz.saglik.dbBoyut > 0);
  assert.equal(typeof oz.saglik.eposta.bekleyen, "number");
  assert.ok((await yon("GET", "/api/admin/stats")).govde.sistem.yeniHata >= 1, "özet istatistiğinde yeni hata sayısı");
});

test("durum değişikliği ve toplu işlem denetim kaydına yazılır", async () => {
  const yon = await yonetici();
  const a = app.gunluk.hata("zamanlayici", "Zamanlayıcı işi başarısız: lig", { stack: "Error\n    at lig (/x.js:1:1)" });
  const b = app.gunluk.hata("push", "Push gönderimi başarısız", {});
  assert.equal((await yon("POST", "/api/admin/loglar/" + a + "/durum", { durum: "bitti" })).durum, 400);
  let r = await yon("POST", "/api/admin/loglar/" + a + "/durum", { durum: "cozuldu", not: "Lig tablosu düzeltildi" });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.log.durum, "cozuldu");
  assert.equal(r.govde.log.cozumNotu, "Lig tablosu düzeltildi");
  assert.ok(r.govde.log.isleyen);
  let den = db().prepare("SELECT * FROM audit_log WHERE eylem = 'log.durum' ORDER BY id DESC").get();
  assert.equal(den.varlik_id, String(a));
  assert.deepEqual(JSON.parse(den.ayrinti), { onceki: "yeni", durum: "cozuldu", not: "Lig tablosu düzeltildi" });
  assert.equal((await yon("POST", "/api/admin/loglar/toplu", { ids: [], durum: "incelendi" })).durum, 400);
  r = await yon("POST", "/api/admin/loglar/toplu", { ids: [a, b, b, "x"], durum: "incelendi" });
  assert.equal(r.govde.guncellenen, 2);
  den = db().prepare("SELECT * FROM audit_log WHERE eylem = 'log.toplu-durum' ORDER BY id DESC").get();
  assert.equal(JSON.parse(den.ayrinti).adet, 2);
  assert.equal(db().prepare("SELECT durum FROM system_logs WHERE id = ?").get(b).durum, "incelendi");
  r = await yon("GET", "/api/admin/loglar?durum=acik");
  assert.ok(r.govde.loglar.every(l => l.durum !== "cozuldu"));
});

test("saklama: bilgi 7 gün, uyarı/hata 90 gün; zamanlayıcı temizler", async () => {
  const ekle = db().prepare("INSERT INTO system_logs (zaman, son_zaman, seviye, kaynak, mesaj, parmak_izi) VALUES (?, ?, ?, 'sunucu', ?, ?)");
  const once = g => new Date(Date.now() - g * 864e5).toISOString();
  const k = (sv, g) => Number(ekle.run(once(g), once(g), sv, "saklama " + sv + " " + g, "pi-" + sv + g).lastInsertRowid);
  const ids = { b8: k("bilgi", 8), b6: k("bilgi", 6), u89: k("uyari", 89), u91: k("uyari", 91), h91: k("hata", 91), h30: k("hata", 30) };
  const s = await app.zamanlayici.tik();
  assert.ok(s.gunlukSilinen >= 3);
  const var_ = id => !!db().prepare("SELECT 1 FROM system_logs WHERE id = ?").get(id);
  assert.deepEqual(Object.keys(ids).filter(x => var_(ids[x])).sort(), ["b6", "h30", "u89"]);
  assert.ok(app.zamanlayici.durum().sonCalisma, "son çalışma zamanı tutulur");
});

test("güvenlik uyarısı: bir IP'den çok sayıda 403 → tek, birleşen guvenlik uyarısı", async () => {
  const c = istemci();
  for (let i = 0; i < 20; i++) await c("POST", "/api/auth/logout", {}, { "X-Meberra": "" });
  const l = db().prepare("SELECT * FROM system_logs WHERE kaynak = 'guvenlik' AND mesaj LIKE '%403%'").all();
  assert.equal(l.length, 1);
  assert.equal(l[0].seviye, "uyari");
  assert.ok(!l[0].ayrinti.includes("127.0.0.1"), "IP açık yazılmaz");
});

test("yavaş istek (>2 sn) uyarı olarak yazılır, yol kimlikleri gruplanır", () => {
  const vt = db_.ac(":memory:");
  const g = gunlukServisi(vt, { konsol: false });
  const izle = istekIzleyici(g);
  const req = { method: "GET", url: "/api/admin/users/u0123456789abcdef?q=x", headers: {}, ip: "1.2.3.4" };
  izle(req, 200, 150);
  assert.equal(vt.prepare("SELECT COUNT(*) AS n FROM system_logs").get().n, 0);
  izle(req, 200, 2500);
  const s = vt.prepare("SELECT * FROM system_logs").get();
  assert.equal(s.seviye, "uyari");
  assert.equal(s.mesaj, "Yavaş istek: GET /api/admin/users/:id");
  assert.equal(JSON.parse(s.ayrinti).sureMs, 2500);
  vt.close();
});
