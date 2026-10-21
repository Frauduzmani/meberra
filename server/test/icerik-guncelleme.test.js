"use strict";
// v1.10.0 içerik denetimi: tohum sürümü (ayarlar.soru_tohum_surum) ile mevcut veritabanlarına güvenli içerik güncellemesi,
// yönetici düzenlemesinin korunması, arşivlenen tekrarların listelerden/denemeden/seviyeden düşmesi ama cevap geçmişinin
// çözülmeye devam etmesi, cevaptan sonra gelen ek zenginleştirme (kavram, ipucu, sikHata, hesapMakinesi).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { olustur } = require("../uygulama");
const { TOHUM, TOHUM_AYAR, tohumSurumOku } = require("../sorubankasi");

const GUNCEL = JSON.parse(fs.readFileSync(TOHUM, "utf8"));
const ARSIVLENEN = GUNCEL.sorular.filter(r => r.durum === "arsiv").map(r => r.id);
// v1.11.0: tohumdaki taslaklar (onay kuyruğu) ayrı sayılır; 1.10.0 tohumu = taslaksız 1131 soru
const TASLAK = GUNCEL.sorular.filter(r => r.durum === "taslak").map(r => r.id);
const YAYIN = GUNCEL.sorular.length - TASLAK.length;
const klasor = fs.mkdtempSync(path.join(os.tmpdir(), "meberra-icerik-"));
after(() => { try { fs.rmSync(klasor, { recursive: true, force: true }); } catch (e) { /* Windows: WAL dosyası kilitli kalabilir */ } });

/** 1.10.0 öncesi tohumu taklit eder: sürüm 1, tekrarlar aktif, ek zenginleştirmesi yok, birkaç metin eski hâlinde. */
function eskiTohum() {
  const t = JSON.parse(JSON.stringify(GUNCEL));
  t.surum = 1;
  t.sorular = t.sorular.filter(r => r.durum !== "taslak"); // 1.10.0 öncesinde taslak üretimler yoktu
  for (const r of t.sorular) {
    if (r.durum === "arsiv") r.durum = "aktif";
    const ek = {};
    if (r.tur === "seviye") ["beceri", "sureSn", "hesapMakinesi"].forEach(k => { if (k in r.ek) ek[k] = r.ek[k]; });
    r.ek = ek;
  }
  const bul = id => t.sorular.find(r => r.id === id);
  bul("calc_u2_q2").govde = bul("calc_u2_q2").govde.replace("x \\le 1 \\\\ bx", "x \\le 1 \\ bx");
  bul("chem_u8_q9").genel_hatirlatma = bul("chem_u8_q9").genel_hatirlatma.replace("Topic 8.3:", "Topic 8.3 (Erdem standardı):");
  bul("bio_u2_q8").aciklama = bul("bio_u2_q8").aciklama.replace("güçlü biçimde destekler.", "tartışmasız şekilde kanıtlar.");
  const f = path.join(klasor, "tohum-v1.json");
  fs.writeFileSync(f, JSON.stringify(t));
  return f;
}

async function ac(dbDosya, tohumDosyasi) {
  const app = olustur({ dbDosya, yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, gunlukKonsol: false, varlikOtomatik: false, soruTohumDosyasi: tohumDosyasi });
  await new Promise(r => app.server.listen(0, "127.0.0.1", r));
  app.base = "http://127.0.0.1:" + app.server.address().port;
  return app;
}
const kapat = app => new Promise(r => app.server.close(r));

function istemci(app) {
  let cerez = "";
  return async function iste(yontem, yol, govde) {
    const h = Object.assign({ "Content-Type": "application/json" }, yontem === "GET" ? {} : { "X-Meberra": "1" }, cerez ? { Cookie: cerez } : {});
    const r = await fetch(app.base + yol, { method: yontem, headers: h, body: govde === undefined ? undefined : JSON.stringify(govde) });
    const sc = r.headers.get("set-cookie");
    if (sc) { const m = /meberra_sid=([^;]*)/.exec(sc); if (m) cerez = m[1] ? "meberra_sid=" + m[1] : ""; }
    const tur = r.headers.get("content-type") || "";
    return { durum: r.status, govde: tur.includes("json") ? await r.json() : await r.text() };
  };
}
let sayac = 0;
async function ogrenci(app, premium) {
  const c = istemci(app), ep = "ig" + (++sayac) + "@ornek.com";
  const r = await c("POST", "/api/auth/register", { ad: "Ada", soyad: "Kaya", eposta: ep, sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  c.uid = app.db.prepare("SELECT id FROM users WHERE public_id = ?").get(r.govde.user.id).id;
  c.eposta = ep;
  if (premium) app.hesap.premiumVer(c.uid, "aylik", null, { kaynak: "elle" });
  return c;
}
async function yonetici(app, ep) {
  app.hesap.yoneticiHazirla(ep, "Yonetici-12345");
  const c = istemci(app);
  assert.equal((await c("POST", "/api/auth/login", { kimlik: ep, sifre: "Yonetici-12345" })).durum, 200);
  return c;
}
/** Aynı kullanıcıyla yeni açılan sunucuya giriş (oturum çerezi sunucu örneğine bağlı değil ama adres değişir). */
async function yenidenGir(app, eski) {
  const c = istemci(app);
  assert.equal((await c("POST", "/api/auth/login", { kimlik: eski.eposta, sifre: "Deneme-12345" })).durum, 200);
  c.uid = eski.uid; c.eposta = eski.eposta;
  return c;
}
const satir = (app, id) => app.db.prepare("SELECT * FROM questions_bank WHERE id = ?").get(id);

test("tohum: arşivlenen birebir tekrarlar var, satırlar silinmedi; aktif içerikte iç not yok", () => {
  assert.ok(GUNCEL.surum >= 2, "tohum sürümü artırıldı");
  assert.deepEqual(ARSIVLENEN.sort(), ["calc_u6_q33", "chem_u8_q11"]);
  assert.equal(YAYIN, 1131);
  assert.equal(TASLAK.length, 229, "1.11.0 taslakları");
  assert.doesNotMatch(JSON.stringify(GUNCEL.sorular), /Erdem standardı/);
  const ekli = GUNCEL.sorular.filter(r => r.tur !== "vitrin" && r.durum !== "taslak" && r.ek.kavram && r.ek.ipucu && r.ek.sikHata && r.ek.cedKonu).length;
  assert.equal(ekli, 1130);
});

test("yeni veritabanı tohumdan kurulur ve tohum sürümü ayarlara yazılır", async () => {
  const app = await ac(":memory:");
  try {
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM questions_bank").get().n, GUNCEL.sorular.length);
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM questions_bank WHERE durum = 'taslak'").get().n, TASLAK.length, "taslaklar taslak kalır");
    assert.equal(tohumSurumOku(app.db), GUNCEL.surum);
    for (const id of ARSIVLENEN) assert.equal(satir(app, id).durum, "arsiv");
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM questions_bank_history").get().n, 0, "ilk kurulumda geçmiş yok");
  } finally { await kapat(app); }
});

test("eski veritabanı güncellenir; yönetici düzenlemesi korunur; arşivlenenler listelerden düşer ama geçmiş çözülür", async () => {
  const dbDosya = path.join(klasor, "eski.db"), v1 = eskiTohum();
  // --- 1) 1.10.0 öncesi kurulum: sürüm 1 tohumu, ayarlarda sürüm anahtarı YOK (eski sunucu yazmazdı)
  let app = await ac(dbDosya, v1);
  let denemeId, ogr, yonEp = "igyon@ornek.com";
  try {
    app.db.prepare("DELETE FROM ayarlar WHERE anahtar = ?").run(TOHUM_AYAR);
    assert.equal(satir(app, "chem_u8_q11").durum, "aktif");
    ogr = await ogrenci(app, true);
    // öğrenci tekrar soruyu cevaplar (cevap geçmişi) ve onu içeren bir deneme kurar
    const cv = await ogr("POST", "/api/sorular-bankasi/cevap", { soruId: "chem_u8_q11", secim: "B" });
    assert.equal(cv.durum, 200, JSON.stringify(cv.govde));
    const dn = await ogr("POST", "/api/deneme/olustur", { kod: "chemistry", adet: "tam", seed: 7 });
    assert.equal(dn.durum, 200, JSON.stringify(dn.govde));
    assert.ok(dn.govde.deneme.sorular.some(x => x.k === "ap-chemistry.html|chem_u8_q11"));
    denemeId = dn.govde.deneme.id;
    // yönetici chem_u8_q9'u panelde düzenler (iç notu kendi metniyle değiştirir)
    const yon = await yonetici(app, yonEp);
    const s = (await yon("GET", "/api/admin/soru-bankasi/soru/chem_u8_q9")).govde.soru;
    const put = await yon("PUT", "/api/admin/soru-bankasi/soru/chem_u8_q9", Object.assign({}, s, { genel_hatirlatma: "Yönetici metni: Topic 8.3 seyreltme.", not: "elle" }));
    assert.equal(put.durum, 200, JSON.stringify(put.govde));
  } finally { await kapat(app); }

  // --- 2) 1.10.0 açılışı: güncel tohum (sürüm 2+)
  app = await ac(dbDosya, TOHUM);
  try {
    assert.equal(tohumSurumOku(app.db), GUNCEL.surum);
    // yönetici düzenlemesi olmayan sorular güncellendi (geçmiş kaydıyla)
    assert.match(satir(app, "calc_u2_q2").govde, /x \\le 1 \\\\ bx/);
    assert.equal(satir(app, "calc_u2_q2").guncelleyen, "tohum");
    assert.ok(app.db.prepare("SELECT 1 FROM questions_bank_history WHERE soru_id = 'calc_u2_q2' AND degistiren = 'tohum'").get());
    assert.match(satir(app, "bio_u2_q8").aciklama, /güçlü biçimde destekler/);
    assert.ok(JSON.parse(satir(app, "calc_u1_q2").ek).kavram, "ek zenginleştirmesi geldi");
    for (const id of ARSIVLENEN) assert.equal(satir(app, id).durum, "arsiv");
    // 1.11.0: tohumdaki YENİ taslak sorular eklendi ve taslak kaldı
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM questions_bank WHERE durum = 'taslak'").get().n, TASLAK.length);
    assert.equal(satir(app, TASLAK[0]).guncelleyen, "tohum");
    // yönetici düzenlemesi korundu ve sistem günlüğüne bilgi olarak yazıldı
    assert.equal(satir(app, "chem_u8_q9").genel_hatirlatma, "Yönetici metni: Topic 8.3 seyreltme.");
    const log = app.db.prepare("SELECT seviye, mesaj FROM system_logs WHERE mesaj LIKE '%chem_u8_q9%'").get();
    assert.ok(log, "korunan düzenleme günlükte");
    assert.equal(log.seviye, "bilgi");
    assert.ok(app.db.prepare("SELECT 1 FROM system_logs WHERE seviye = 'bilgi' AND mesaj LIKE 'Soru bankası tohum sürümü 1 → %'").get());

    ogr = await yenidenGir(app, ogr);
    // cevap geçmişi ve satır duruyor
    assert.ok(app.db.prepare("SELECT 1 FROM answers WHERE user_id = ? AND soru = 'chem_u8_q11'").get(ogr.uid), "cevap geçmişi silinmedi");
    const o2 = await ogrenci(app, true);
    // ünite listesi ve deneme katalog/olusturma arşivli soruyu göstermez; yeni cevap kabul edilmez
    const u8 = await o2("GET", "/api/sorular-bankasi/ap-chemistry/8");
    assert.equal(u8.durum, 200);
    assert.ok(!JSON.stringify(u8.govde).includes("chem_u8_q11"));
    const u6 = await o2("GET", "/api/sorular-bankasi/ap-calculus/6");
    assert.ok(!JSON.stringify(u6.govde).includes("calc_u6_q33"));
    const kat = await o2("GET", "/api/deneme/katalog");
    assert.ok(!kat.govde.sorular.some(x => ARSIVLENEN.includes(x.id)));
    const dn2 = await o2("POST", "/api/deneme/olustur", { kod: "chemistry", adet: "tam", seed: 7 });
    assert.ok(!dn2.govde.deneme.sorular.some(x => x.k.endsWith("|chem_u8_q11")));
    assert.equal((await o2("POST", "/api/sorular-bankasi/cevap", { soruId: "chem_u8_q11", secim: "A" })).durum, 404);

    // eski öğrencinin önceden kurduğu deneme arşivli soruyu hâlâ çözer ve teslimde çözümünü verir
    const eski = await ogr("GET", "/api/deneme/" + denemeId);
    assert.equal(eski.durum, 200);
    assert.ok(eski.govde.icerik["ap-chemistry.html|chem_u8_q11"], "arşivli soru içeriği çözülür");
    const teslim = await ogr("POST", "/api/deneme/teslim", { denemeId, cevaplar: {}, gecenSn: 60 });
    assert.equal(teslim.durum, 200, JSON.stringify(teslim.govde));
    const coz = teslim.govde.cozumler["ap-chemistry.html|chem_u8_q11"];
    assert.ok(coz && coz.dogru, "arşivli sorunun çözümü teslimde var");
    assert.ok(coz.ek && coz.ek.kavram, "teslim çözümünde ek zenginleştirme");

    // seviye testi: arşivlenen seviye sorusu bankada görünmez, eski raporun çözümü çözülür
    const yon = await yonetici(app, yonEp);
    const svTeslim = await ogr("POST", "/api/seviye/teslim", { cevaplar: { "chemistry|sv_chem_u1_1": "A" } });
    assert.equal(svTeslim.durum, 200);
    assert.equal((await yon("POST", "/api/admin/soru-bankasi/soru/sv_chem_u1_1/arsiv", {})).durum, 200);
    const bank = await o2("GET", "/api/seviye/bankalar");
    assert.ok(!bank.govde.bankalar.chemistry.sorular.some(x => x.id === "sv_chem_u1_1"));
    const svCoz = await ogr("POST", "/api/seviye/cozumler", { anahtarlar: ["chemistry|sv_chem_u1_1"] });
    assert.ok(svCoz.govde.cozumler["chemistry|sv_chem_u1_1"], "arşivli seviye sorusunun eski çözümü çözülür");
  } finally { await kapat(app); }

  // --- 3) Tekrar açılış: tohum güncel, değişiklik yok
  app = await ac(dbDosya, TOHUM);
  try {
    const n = app.db.prepare("SELECT COUNT(*) AS n FROM questions_bank_history").get().n;
    assert.equal(tohumSurumOku(app.db), GUNCEL.surum);
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM questions_bank_history").get().n, n, "ikinci açılış yeni sürüm yazmaz");
    assert.equal(satir(app, "chem_u8_q9").genel_hatirlatma, "Yönetici metni: Topic 8.3 seyreltme.");
  } finally { await kapat(app); }
});

test("cevap kontrolü ek zenginleştirmeyi cevaptan SONRA verir; listelerde yoktur", async () => {
  const app = await ac(":memory:");
  try {
    const o = await ogrenci(app, true);
    const liste = await o("GET", "/api/sorular-bankasi/ap-calculus/1");
    assert.equal(liste.durum, 200);
    assert.doesNotMatch(JSON.stringify(liste.govde), /"kavram"|"ipucu"|"sikHata"|"cedKonu"|"zorlukOnerisi"/);
    const dn = await o("POST", "/api/deneme/olustur", { kod: "calculus-ab", adet: 5, seed: 3 });
    assert.doesNotMatch(JSON.stringify(dn.govde), /"kavram"|"ipucu"|"sikHata"/);
    const bank = await o("GET", "/api/seviye/bankalar");
    assert.doesNotMatch(JSON.stringify(bank.govde), /"kavram"|"ipucu"|"sikHata"/);
    const r = await o("POST", "/api/sorular-bankasi/cevap", { soruId: "calc_u1_q2", secim: "A" });
    assert.equal(r.durum, 200);
    assert.ok(r.govde.ek.kavram && r.govde.ek.ipucu && r.govde.ek.sikHata);
    assert.ok(["gerekmez", "yardımcı", "gerekli"].includes(r.govde.ek.hesapMakinesi));
    assert.deepEqual(r.govde.cozum.ek, r.govde.ek);
    assert.ok(!("cedKonu" in r.govde.ek) && !("zorlukOnerisi" in r.govde.ek), "iç alanlar öğrenciye gitmez");
    const sv = await o("POST", "/api/seviye/teslim", { cevaplar: { "calculus-ab|sv_calcab_u1_1": "A" } });
    const ek = sv.govde.cozumler["calculus-ab|sv_calcab_u1_1"].ek;
    assert.ok(ek.kavram && ["gerekmez", "yardımcı", "gerekli"].includes(ek.hesapMakinesi), "seviye çözümünde üç düzeyli hesap makinesi");
  } finally { await kapat(app); }
});
