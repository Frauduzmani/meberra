"use strict";
// v1.5.0 soru bankası güvenliği: liste yanıtlarında cevap yok; ücretsiz/Premium/misafir erişimi; sunucuda cevap kontrolü ve kaydı;
// deneme hakkı sunucuda; seviye testi; yönetici düzenleyicisi (sürüm, geçmiş, geri yükleme, arşiv, dışa aktarma); tohum sayıları.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { olustur } = require("../uygulama");
const { tohumUpsert, TOHUM } = require("../sorubankasi");
// 1.23.0: beklenen sayılar tohumdan hesaplanır (her içerik partisinde sabitleri elle güncellemek gerekmesin)
const TV = JSON.parse(fs.readFileSync(TOHUM, "utf8"));
const AKTIF_DERS = TV.sorular.filter(x => x.tur === "ders" && x.durum === "aktif").length;
const DERS_SAYI = TV.sorular.filter(x => x.tur === "ders" && x.durum !== "taslak").length;
const CALC1 = TV.sorular.filter(x => x.kutu === "calc-unit1-quiz-container" && x.durum === "aktif").length;
const AB_HAVUZ = TV.sorular.filter(x => x.tur === "ders" && x.durum === "aktif" && (x.deneme_kodlari || []).includes("calculus-ab")).length;
const KATALOG = TV.sorular.filter(x => x.tur === "ders" && x.durum === "aktif" && (x.deneme_kodlari || []).length).length;

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
    return { durum: r.status, basliklar: r.headers, govde: tur.includes("json") ? await r.json() : await r.text() };
  };
}
const db = () => app.db;
let sayac = 0;
async function ogrenci(premium) {
  const c = istemci(), ep = "sb" + (++sayac) + "@ornek.com";
  const r = await c("POST", "/api/auth/register", { ad: "Ada", soyad: "Kaya", eposta: ep, sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  c.uid = db().prepare("SELECT id FROM users WHERE public_id = ?").get(r.govde.user.id).id;
  if (premium) app.hesap.premiumVer(c.uid, "aylik", null, { kaynak: "elle" });
  return c;
}
let yonC = null;
async function yonetici() {
  if (yonC) return yonC;
  app.hesap.yoneticiHazirla("sbyon@ornek.com", "Yonetici-12345");
  yonC = istemci();
  assert.equal((await yonC("POST", "/api/auth/login", { kimlik: "sbyon@ornek.com", sifre: "Yonetici-12345" })).durum, 200);
  yonC.uid = db().prepare("SELECT id FROM users WHERE eposta = ?").get("sbyon@ornek.com").id;
  return yonC;
}
// Yanıtın herhangi bir yerinde cevap/çözüm alanı var mı?
const CEVAP_ALANLARI = ["isCorrect", "dogru", "dogruSecenek", "aciklama", "stepByStepSolution", "generalRemediation", "errorTag", "remediation", "cozum", "cozumler", "hatalar", "hata_aciklamalari"];
function cevapAlaniVar(o) {
  if (Array.isArray(o)) return o.some(cevapAlaniVar);
  if (o && typeof o === "object") return Object.keys(o).some(k => CEVAP_ALANLARI.includes(k) || cevapAlaniVar(o[k]));
  return false;
}
const dogruOf = id => db().prepare("SELECT dogru FROM questions_bank WHERE id = ?").get(id).dogru;
const yanlisOf = id => ["A", "B", "C", "D"].find(x => x !== dogruOf(id));

test("tohum: sayılar pm-denetim ile aynı (1338 ders [1327 aktif + 11 arşiv; 1.14.0 Ekonomi + English: +82 aktif; 1.14.1 şekilli: +50 aktif] + 153 seviye + 1 vitrin; onaylardan sonra taslak yok), veritabanı dolu, upsert idempotent", () => {
  const t = JSON.parse(fs.readFileSync(TOHUM, "utf8"));
  const say = (tur, durum) => t.sorular.filter(x => x.tur === tur && (durum ? x.durum === durum : x.durum !== "taslak")).length;
  assert.equal(say("ders", "aktif"), AKTIF_DERS); // 1.23.0: tohumdan; konu modu partileri (ek.uretim "1.23.0") ekledikçe büyür
  assert.ok(AKTIF_DERS >= 1321);
  assert.equal(say("ders", "arsiv"), 17); // 1.10.0: 2 birebir tekrar; 1.11.0: bağımsız denetimin reddettiği 9 taslak; 1.22.1: 6 Physics C sorusu
  assert.equal(say("ders", "taslak"), 0, "1.11.0 onayı: tohumda taslak kalmadı (araclar/onay/UYGULANAN.md)");
  assert.equal(say("ders"), DERS_SAYI);
  assert.equal(say("seviye"), 153);
  assert.equal(say("vitrin"), 1);
  assert.equal(new Set(t.sorular.map(x => x.id)).size, t.sorular.length, "kimlikler benzersiz");
  const n = db().prepare("SELECT tur, COUNT(*) AS n FROM questions_bank WHERE durum != 'taslak' GROUP BY tur").all().reduce((a, x) => (a[x.tur] = x.n, a), {});
  assert.deepEqual(n, { ders: DERS_SAYI, seviye: 153, vitrin: 1 });
  const s = tohumUpsert(db(), t.sorular, { guncelleyen: "test" });
  assert.equal(s.eklenen, 0); assert.equal(s.guncellenen, 0); assert.equal(s.ayni, t.sorular.length);
  // Tohum statik olarak sunulmaz (server/ klasörü açık değil)
  assert.ok(TOHUM.startsWith(path.join(__dirname, "..")));
});

test("tohum dosyası ve eski deneme bankası HTTP ile alınamaz; ders sayfasında cevap anahtarı yok", async () => {
  const c = istemci();
  assert.equal((await c("GET", "/server/tohum/soru-bankasi.json")).durum, 404);
  assert.equal((await c("GET", "/data/sorular/deneme-bankasi.js")).durum, 404);
  const sayfa = await c("GET", "/ders/calculus");
  assert.equal(sayfa.durum, 200);
  assert.doesNotMatch(sayfa.govde, /isCorrect|_QUESTIONS\s*=|stepByStepSolution/);
  const sv = await c("GET", "/data/sorular/seviye/calculus.js");
  assert.equal(sv.durum, 200);
  assert.doesNotMatch(sv.govde, /isCorrect|stepByStepSolution|generalRemediation/);
});

test("misafir: soru bankası, cevap, deneme ve seviye uçları 401; yalnızca vitrin demo sorusu açık (cevapsız)", async () => {
  const c = istemci();
  for (const [y, p, b] of [["GET", "/api/sorular-bankasi/ap-calculus"], ["GET", "/api/sorular-bankasi/ap-calculus/1"], ["POST", "/api/sorular-bankasi/cevap", { soruId: "calc_u1_q1", secim: "A" }],
    ["POST", "/api/sorular-bankasi/getir", { anahtarlar: ["ap-calculus|calc_u1_q1"] }], ["GET", "/api/deneme/katalog"], ["POST", "/api/deneme/olustur", { kod: "calculus-ab" }],
    ["GET", "/api/seviye/bankalar"], ["POST", "/api/seviye/teslim", { cevaplar: {} }]]) {
    assert.equal((await c(y, p, b)).durum, 401, y + " " + p);
  }
  const d = await c("GET", "/api/public/demo-soru");
  assert.equal(d.durum, 200);
  assert.equal(d.govde.soru.id, "vitrin_demo_1");
  assert.equal(d.govde.soru.options.length, 4);
  assert.equal(cevapAlaniVar(d.govde), false, "demo sorusunda cevap yok");
  const yan = await c("POST", "/api/public/demo-soru/cevap", { secim: "A" });
  assert.equal(yan.durum, 200);
  assert.equal(yan.govde.dogru, false); assert.equal(yan.govde.dogruSecenek, "B"); assert.ok(yan.govde.hataAciklamasi.aciklama);
  assert.equal((await c("POST", "/api/public/demo-soru/cevap", { secim: "B" })).govde.dogru, true);
  assert.match(yan.basliklar.get("cache-control"), /no-store/);
});

test("1.28.0 yeni dersler: sayfa adresi açılır; sorusu yokken özet 200 + boş liste, kutu 404 (Yakında); bilinmeyen sayfa 404", async () => {
  const o = await ogrenci(false);
  for (const [yol, sayfa, kutu] of [["/ders/precalculus", "ap-precalculus", "precalc-unit1-quiz-container"], ["/ders/statistics", "ap-statistics", "stat-unit1-quiz-container"],
    ["/ders/physics-2", "ap-physics-2", "phys2-unit9-quiz-container"]]) {
    const h = await o("GET", yol);
    assert.equal(h.durum, 200, yol);
    assert.match(String(h.govde), new RegExp('id="' + kutu + '"'), yol + " soru kutusu");
    const r = await o("GET", "/api/sorular-bankasi/" + sayfa);
    assert.equal(r.durum, 200, sayfa);
    assert.equal(r.govde.ok, true); assert.equal(r.govde.sayfa, sayfa);
    // Henüz onaylı soru yok (içerik sonra gelir); gelince bu ders de diğerleri gibi kutu listesi döner
    if (!r.govde.kutular.length) assert.equal((await o("GET", "/api/sorular-bankasi/" + sayfa + "/" + kutu)).durum, 404, kutu);
  }
  assert.equal((await o("GET", "/api/sorular-bankasi/ap-olmayan-ders")).durum, 404);
});

test("ücretsiz kullanıcı: açık ünite listesinde cevap yok; kilitli ünite 402; Premium açık", async () => {
  const o = await ogrenci(false);
  let r = await o("GET", "/api/sorular-bankasi/ap-calculus");
  assert.equal(r.durum, 200);
  const k1 = r.govde.kutular.find(k => k.kutu === "calc-unit1-quiz-container"), k3 = r.govde.kutular.find(k => k.kutu === "calc-unit3-quiz-container");
  assert.equal(k1.kilitli, false); assert.equal(k3.kilitli, true); assert.equal(k1.toplam, CALC1); // 1.11.0: +10 onaylı yeni soru; 1.14.1: +5 şekilli
  r = await o("GET", "/api/sorular-bankasi/ap-calculus/1");
  assert.equal(r.durum, 200);
  assert.equal(r.govde.kutular[0].sorular.length, CALC1);
  assert.equal(cevapAlaniVar(r.govde), false, "liste yanıtında doğru şık / çözüm yok");
  assert.match(r.basliklar.get("cache-control"), /private/); assert.match(r.basliklar.get("cache-control"), /no-store/);
  r = await o("GET", "/api/sorular-bankasi/ap-calculus/calc-unit1-quiz-container");
  assert.equal(r.durum, 200);
  for (const yol of ["/api/sorular-bankasi/ap-calculus/3", "/api/sorular-bankasi/ap-calculus/calc-unit3-quiz-container", "/api/sorular-bankasi/ap-physics/phys-unit3-wep-quiz-container"]) {
    r = await o("GET", yol);
    assert.equal(r.durum, 402, yol);
    assert.equal(r.govde.premiumGerekli, true);
    assert.equal(cevapAlaniVar(r.govde), false);
  }
  // Physics Unit 2 (cont.) kutusu (phys-unit3-quiz-container) ücretsiz kuralda açık
  assert.equal((await o("GET", "/api/sorular-bankasi/ap-physics/phys-unit3-quiz-container")).durum, 200);
  const p = await ogrenci(true);
  r = await p("GET", "/api/sorular-bankasi/ap-calculus/3");
  assert.equal(r.durum, 200);
  assert.equal(cevapAlaniVar(r.govde), false);
  assert.equal((await p("GET", "/api/sorular-bankasi/ap-calculus")).govde.kutular.every(k => !k.kilitli), true);
});

test("cevap kontrolü sunucuda: sonuç + açıklama döner, answers tablosuna ve quiz anahtarına yazılır; listede yalnız o sorunun çözümü", async () => {
  const o = await ogrenci(false);
  const id = "calc_u1_q1";
  let r = await o("POST", "/api/sorular-bankasi/cevap", { soruId: id, secim: yanlisOf(id) });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  assert.equal(r.govde.dogru, false);
  assert.equal(r.govde.dogruSecenek, dogruOf(id));
  assert.ok(r.govde.aciklama.length > 10);
  assert.ok(r.govde.hataAciklamasi && r.govde.hataAciklamasi.etiket);
  assert.match(r.basliklar.get("cache-control"), /private, no-store/);
  const t = r.govde.t;
  r = await o("POST", "/api/sorular-bankasi/cevap", { soruId: "calc_u1_q2", secim: dogruOf("calc_u1_q2") });
  assert.equal(r.govde.dogru, true); assert.equal(r.govde.hataAciklamasi, null);
  const rows = db().prepare("SELECT soru, secim, dogru, unite, zaman FROM answers WHERE user_id = ? ORDER BY soru").all(o.uid);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].unite, "calc-unit1-quiz-container");
  assert.equal(rows[0].zaman, t, "istemci aynı zaman damgasını yazınca tekrar satır oluşmaz");
  const st = JSON.parse(db().prepare("SELECT deger FROM user_state WHERE user_id = ? AND anahtar = 'apmeberra:quiz:v1'").get(o.uid).deger);
  assert.equal(st.pages["ap-calculus"].units["calc-unit1-quiz-container"].answers[id].c, false);
  assert.equal(st.pages["ap-calculus"].units["calc-unit1-quiz-container"].total, CALC1);
  // İstemci aynı kaydı eşitlerse (aynı t) yinelenen cevap satırı oluşmaz
  await o("PUT", "/api/state", { degisiklikler: { "apmeberra:quiz:v1": JSON.stringify(st) } });
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM answers WHERE user_id = ?").get(o.uid).n, 2);
  // Liste: cevaplanan iki sorunun çözümü var, diğerlerinin yok
  r = await o("GET", "/api/sorular-bankasi/ap-calculus/1");
  const qs = r.govde.kutular[0].sorular;
  assert.deepEqual(qs.filter(x => x.cozum).map(x => x.id).sort(), ["calc_u1_q1", "calc_u1_q2"]);
  assert.equal(cevapAlaniVar(qs.filter(x => !x.cozum)), false);
  // Kilitli soruya cevap: 402; geçersiz seçenek: 400; bilinmeyen soru: 404
  assert.equal((await o("POST", "/api/sorular-bankasi/cevap", { soruId: "calc_u3_q1", secim: "A" })).durum, 402);
  assert.equal((await o("POST", "/api/sorular-bankasi/cevap", { soruId: id, secim: "Z" })).durum, 400);
  assert.equal((await o("POST", "/api/sorular-bankasi/cevap", { soruId: "yok_boyle", secim: "A" })).durum, 404);
  // Seviye testi sorusu tek tek cevap ucundan açılmaz
  assert.equal((await o("POST", "/api/sorular-bankasi/cevap", { soruId: "sv_calcab_u1_1", secim: "A" })).durum, 404);
  // Tekrar (getir): ücretsiz kullanıcı kilitli soruyu ancak daha önce çözdüyse alır
  r = await o("POST", "/api/sorular-bankasi/getir", { anahtarlar: ["ap-calculus|calc_u1_q1", "ap-calculus|calc_u3_q1"] });
  assert.ok(r.govde.sorular["ap-calculus|calc_u1_q1"].cozum, "çözülen sorunun çözümü");
  assert.deepEqual(r.govde.eksik, ["ap-calculus|calc_u3_q1"]);
});

test("deneme: ücretsiz hak sunucuda — aynı ders sayfasında ikinci deneme 402, genel 402; teslim sunucuda puanlanır ve exams'e yazılır", async () => {
  const o = await ogrenci(false);
  let r = await o("GET", "/api/deneme/katalog");
  assert.equal(r.durum, 200);
  assert.equal(r.govde.kodlar["calculus-ab"].soruSayisi, AB_HAVUZ);
  assert.equal(r.govde.sorular.length, KATALOG); // v1.10.0: 2 birebir tekrar arşivlendi; v1.11.0: 220 onaylı yeni soru; v1.14.0: 82 onaylı Ekonomi + English; v1.14.1: 50 onaylı şekilli (arşiv deneme havuzunda yok)
  assert.equal(cevapAlaniVar(r.govde.sorular), false);
  assert.equal(r.govde.sorular.some(x => "question" in x || "options" in x), false, "katalogda soru kökü/şık yok");
  assert.equal(r.govde.haklar["ap-calculus"], false);
  r = await o("POST", "/api/deneme/olustur", { kod: "calculus-ab", adet: 10, sureModu: "tempo", seed: 12345 });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  const d = r.govde.deneme;
  assert.equal(d.sorular.length, 10);
  assert.equal(Object.keys(r.govde.icerik).length, 10);
  assert.equal(cevapAlaniVar(r.govde), false, "deneme oluşturma yanıtında cevap yok");
  assert.equal(db().prepare("SELECT ucretsiz_hak FROM soru_oturumlari WHERE id = ?").get(d.id).ucretsiz_hak, 1);
  const hak = JSON.parse(db().prepare("SELECT deger FROM user_state WHERE user_id = ? AND anahtar = 'apmeberra:deneme-hak:v1'").get(o.uid).deger);
  assert.equal(hak["ap-calculus"].kod, "calculus-ab");
  // Aynı sayfa (calculus-bc de ap-calculus) → 402; başka ders hâlâ açık; genel → 402
  r = await o("POST", "/api/deneme/olustur", { kod: "calculus-bc", adet: 10 });
  assert.equal(r.durum, 402); assert.equal(r.govde.premiumGerekli, true); assert.equal(r.govde.hakKullanildi, true);
  assert.equal((await o("POST", "/api/deneme/olustur", { kod: "genel", dersler: ["biology"], adet: 10 })).durum, 402);
  assert.equal((await o("POST", "/api/deneme/olustur", { kod: "chemistry", adet: 5 })).durum, 200);
  // İstemci deneme-hak anahtarını silse bile hak geri gelmez
  await o("PUT", "/api/state", { degisiklikler: { "apmeberra:deneme-hak:v1": null } });
  assert.equal((await o("POST", "/api/deneme/olustur", { kod: "calculus-ab", adet: 10 })).durum, 402);
  // Teslim: 3 doğru, 1 yanlış, kalan boş
  const cev = {};
  d.sorular.slice(0, 3).forEach((x, i) => { cev[i] = dogruOf(x.k.split("|")[1]); });
  cev[3] = yanlisOf(d.sorular[3].k.split("|")[1]);
  r = await o("POST", "/api/deneme/teslim", { denemeId: d.id, cevaplar: cev, isaretli: { 0: true }, gecenSn: 321 });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  const s = r.govde.sonuc;
  assert.equal(s.dogru, 3); assert.equal(s.yanlis, 1); assert.equal(s.bos, 6); assert.equal(s.yuzde, 30); assert.equal(s.tahminiBand, 2);
  assert.equal(s.inceleme[0].st, "dogru"); assert.equal(s.inceleme[3].st, "yanlis"); assert.equal(s.inceleme[0].m, 1);
  assert.equal(Object.keys(r.govde.cozumler).length, 10);
  const ex = db().prepare("SELECT kod, dogru, soru_sayisi, sure_sn FROM exams WHERE user_id = ? AND istemci_id = ?").get(o.uid, d.id);
  assert.deepEqual({ ...ex }, { kod: "calculus-ab", dogru: 3, soru_sayisi: 10, sure_sn: 321 });
  // Tekrar teslim aynı sonucu verir (puan değiştirilemez)
  r = await o("POST", "/api/deneme/teslim", { denemeId: d.id, cevaplar: { 0: "A", 1: "A", 2: "A", 3: "A", 4: "A" } });
  assert.equal(r.govde.sonuc.dogru, 3); assert.equal(r.govde.tekrar, true);
  // Teslimden sonra inceleme (çözümlerle); başka kullanıcı göremez
  r = await o("GET", "/api/deneme/" + d.id);
  assert.equal(r.durum, 200); assert.ok(r.govde.cozumler);
  const baska = await ogrenci(false);
  assert.equal((await baska("GET", "/api/deneme/" + d.id)).durum, 404);
  assert.equal((await baska("POST", "/api/deneme/teslim", { denemeId: d.id, cevaplar: {} })).durum, 404);
  // Teslim edilmemiş denemede çözüm yok
  const d2 = (await o("POST", "/api/deneme/olustur", { kod: "chemistry", adet: 5 }));
  assert.equal(d2.durum, 402, "chemistry hakkı da kullanıldı");
  // Premium: sınırsız + genel
  const p = await ogrenci(true);
  assert.equal((await p("POST", "/api/deneme/olustur", { kod: "calculus-ab", adet: 5 })).durum, 200);
  assert.equal((await p("POST", "/api/deneme/olustur", { kod: "calculus-bc", adet: 5 })).durum, 200);
  r = await p("POST", "/api/deneme/olustur", { kod: "genel", dersler: ["biology", "chemistry"], adet: 10 });
  assert.equal(r.durum, 200);
  r = await p("GET", "/api/deneme/" + r.govde.deneme.id);
  assert.equal(r.durum, 200); assert.equal(r.govde.cozumler, undefined, "teslim edilmemiş denemede çözüm yok");
});

test("deneme: aynı tohum aynı soruları verir (eski istemci seçimiyle uyumlu); Yanlışlarım modu kilitli içeriğe kapı açmaz", async () => {
  const p = await ogrenci(true);
  const a = await p("POST", "/api/deneme/olustur", { kod: "biology", adet: 12, seed: 777 });
  const b = await p("POST", "/api/deneme/olustur", { kod: "biology", adet: 12, seed: 777 });
  assert.deepEqual(a.govde.deneme.sorular, b.govde.deneme.sorular);
  const o = await ogrenci(false);
  // Kilitli ünite sorusu (yanlışı yok) → reddedilir; açık ünite sorusu kabul
  let r = await o("POST", "/api/deneme/olustur", { mod: "yanlislar", sorular: [{ k: "ap-calculus.html|calc_u3_q1", kod: "calculus-ab" }] });
  assert.equal(r.durum, 400);
  r = await o("POST", "/api/deneme/olustur", { mod: "yanlislar", sorular: [{ k: "ap-calculus.html|calc_u1_q3", kod: "calculus-ab" }, { k: "ap-calculus.html|calc_u3_q1", kod: "calculus-ab" }] });
  assert.equal(r.durum, 200);
  assert.deepEqual(r.govde.deneme.sorular.map(x => x.k), ["ap-calculus.html|calc_u1_q3"]);
});

test("seviye testi: sorular cevapsız; teslimde sunucu kontrol eder; çözümler yalnız teslim edilen sorular için", async () => {
  const o = await ogrenci(false);
  let r = await o("GET", "/api/seviye/bankalar");
  assert.equal(r.durum, 200);
  const toplam = Object.values(r.govde.bankalar).reduce((s, b) => s + b.sorular.length, 0);
  assert.equal(toplam, 153);
  assert.ok(r.govde.bankalar["calculus-ab"].uniteler.length === 8);
  assert.equal(cevapAlaniVar(r.govde), false);
  const id = "sv_calcab_u1_1";
  r = await o("POST", "/api/seviye/cozumler", { anahtarlar: ["calculus-ab|" + id] });
  assert.deepEqual(r.govde.cozumler, {}, "teslim etmeden çözüm yok");
  r = await o("POST", "/api/seviye/teslim", { cevaplar: { ["calculus-ab|" + id]: dogruOf(id), "calculus-ab|sv_calcab_u1_2": null, "uydurma|x": "A" } });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.sonuclar["calculus-ab|" + id].dogru, true);
  assert.equal(r.govde.sonuclar["calculus-ab|sv_calcab_u1_2"].dogru, null);
  assert.ok(r.govde.cozumler["calculus-ab|" + id].aciklama);
  assert.equal(r.govde.sonuclar["uydurma|x"], undefined);
  r = await o("POST", "/api/seviye/cozumler", { anahtarlar: ["calculus-ab|" + id, "calculus-ab|sv_calcab_u2_1"] });
  assert.deepEqual(Object.keys(r.govde.cozumler), ["calculus-ab|" + id]);
});

test("yönetici düzenleyicisi yalnız yöneticiye açık", async () => {
  const misafir = istemci(), o = await ogrenci(true);
  for (const [y, p, b] of [["GET", "/api/admin/soru-bankasi"], ["GET", "/api/admin/soru-bankasi/meta"], ["GET", "/api/admin/soru-bankasi/soru/calc_u1_q1"],
    ["PUT", "/api/admin/soru-bankasi/soru/calc_u1_q1", { surum: 1 }], ["POST", "/api/admin/soru-bankasi/soru", {}], ["POST", "/api/admin/soru-bankasi/soru/calc_u1_q1/arsiv", {}],
    ["POST", "/api/admin/soru-bankasi/soru/calc_u1_q1/geri-yukle", { surum: 1 }], ["GET", "/api/admin/soru-bankasi/disa-aktar"]]) {
    assert.equal((await misafir(y, p, b)).durum, 401, "misafir " + p);
    assert.equal((await o(y, p, b)).durum, 403, "öğrenci " + p);
  }
});

test("yönetici: liste + istatistik (şüpheli), düzenleme yeni sürüm, doğrulama, eşzamanlılık, geçmiş + geri yükleme, arşiv, yeni soru, dışa aktarma; hepsi denetimli", async () => {
  const y = await yonetici();
  const id = "calc_u1_q5";
  // 5 öğrenci hepsi doğru → %100 → şüpheli
  for (let i = 0; i < 5; i++) { const o = await ogrenci(false); await o("POST", "/api/sorular-bankasi/cevap", { soruId: id, secim: dogruOf(id) }); }
  let r = await y("GET", "/api/admin/soru-bankasi?sayfa=ap-calculus&unite=1&durum=aktif");
  assert.equal(r.durum, 200);
  assert.equal(r.govde.toplam, CALC1);
  const satir = r.govde.sorular.find(x => x.id === id);
  assert.equal(satir.istatistik.cevap >= 5, true); assert.equal(satir.istatistik.supheli, true);
  r = await y("GET", "/api/admin/soru-bankasi?supheli=1");
  assert.ok(r.govde.sorular.some(x => x.id === id));
  r = await y("GET", "/api/admin/soru-bankasi?q=" + encodeURIComponent("calc_u1_q5"));
  assert.equal(r.govde.sorular[0].id, id);
  r = await y("GET", "/api/admin/soru-bankasi/soru/" + id);
  const s1 = r.govde.soru;
  assert.equal(s1.surum, 1); assert.ok(s1.dogru); assert.deepEqual(r.govde.gecmis, []);
  const form = { surum: 1, govde: s1.govde + " <em>(düzenlendi)</em>", secenekler: s1.secenekler, dogru: s1.dogru, zorluk: s1.zorluk, durum: s1.durum, aciklama: s1.aciklama,
    genel_hatirlatma: s1.genel_hatirlatma, hata_aciklamalari: s1.hata_aciklamalari, konu: s1.konu, kaynak: s1.kaynak };
  // Doğrulama: 1 seçenek, doğru şık yok, 6 seçenek, tek sayıda $
  assert.equal((await y("PUT", "/api/admin/soru-bankasi/soru/" + id, Object.assign({}, form, { secenekler: [{ text: "x" }] }))).durum, 400);
  assert.equal((await y("PUT", "/api/admin/soru-bankasi/soru/" + id, Object.assign({}, form, { dogru: "" }))).govde.errors.dogru !== undefined, true);
  assert.equal((await y("PUT", "/api/admin/soru-bankasi/soru/" + id, Object.assign({}, form, { secenekler: "ABCDEF".split("").map(t => ({ text: t })) }))).durum, 400);
  assert.equal((await y("PUT", "/api/admin/soru-bankasi/soru/" + id, Object.assign({}, form, { govde: "Kök $x" }))).govde.errors.govde !== undefined, true);
  r = await y("PUT", "/api/admin/soru-bankasi/soru/" + id, form);
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  assert.equal(r.govde.surum, 2); assert.deepEqual(r.govde.fark, ["govde"]);
  // Eski sürümle kaydetme → 409
  assert.equal((await y("PUT", "/api/admin/soru-bankasi/soru/" + id, form)).durum, 409);
  // Öğrenci değişikliği görür
  const o = await ogrenci(false);
  r = await o("GET", "/api/sorular-bankasi/ap-calculus/1");
  assert.match(r.govde.kutular[0].sorular.find(x => x.id === id).question, /\(düzenlendi\)/);
  // Doğru şıkkı değiştir (sürüm 3) → öğrencinin cevap kontrolü yeni anahtara göre
  const yeniDogru = s1.dogru === "A" ? "B" : "A";
  r = await y("PUT", "/api/admin/soru-bankasi/soru/" + id, Object.assign({}, form, { surum: 2, dogru: yeniDogru, hata_aciklamalari: {} }));
  assert.equal(r.govde.surum, 3);
  assert.equal((await o("POST", "/api/sorular-bankasi/cevap", { soruId: id, secim: yeniDogru })).govde.dogru, true);
  // Geçmiş + geri yükleme (v1)
  r = await y("GET", "/api/admin/soru-bankasi/soru/" + id + "/gecmis");
  assert.deepEqual(r.govde.gecmis.map(x => x.surum), [2, 1]);
  assert.deepEqual(r.govde.gecmis[1].fark, ["govde"]);
  r = await y("POST", "/api/admin/soru-bankasi/soru/" + id + "/geri-yukle", { surum: 1 });
  assert.equal(r.durum, 200); assert.equal(r.govde.surum, 4);
  r = await y("GET", "/api/admin/soru-bankasi/soru/" + id);
  assert.equal(r.govde.soru.govde, s1.govde); assert.equal(r.govde.soru.dogru, s1.dogru);
  // Arşiv: öğrenci listesinden düşer; silme yok
  r = await y("POST", "/api/admin/soru-bankasi/soru/" + id + "/arsiv", {});
  assert.equal(r.govde.durum, "arsiv");
  r = await o("GET", "/api/sorular-bankasi/ap-calculus/1");
  assert.equal(r.govde.kutular[0].sorular.some(x => x.id === id), false);
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM questions_bank WHERE id = ?").get(id).n, 1);
  await y("POST", "/api/admin/soru-bankasi/soru/" + id + "/arsiv", { geriAl: true });
  // Yeni soru (taslak öğrenciye görünmez → aktif yapınca görünür)
  r = await y("POST", "/api/admin/soru-bankasi/soru", { tur: "ders", sayfa: "ap-calculus", kutu: "calc-unit1-quiz-container", govde: "Yeni soru: $2+2$?", secenekler: [{ text: "3" }, { text: "4" }, { text: "5" }],
    dogru: "B", zorluk: "easy", aciklama: "$2+2=4$", konu: "1.1 Test", kaynak: "Meberra original", durum: "taslak" });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  const yeniId = r.govde.id;
  assert.equal(r.govde.soru.unite_no, 1);
  assert.equal((await o("GET", "/api/sorular-bankasi/ap-calculus/1")).govde.kutular[0].sorular.some(x => x.id === yeniId), false);
  r = await y("GET", "/api/admin/soru-bankasi/soru/" + yeniId);
  await y("PUT", "/api/admin/soru-bankasi/soru/" + yeniId, Object.assign({}, r.govde.soru, { surum: r.govde.soru.surum, durum: "aktif" }));
  assert.equal((await o("GET", "/api/sorular-bankasi/ap-calculus/1")).govde.kutular[0].sorular.some(x => x.id === yeniId), true);
  // Dışa aktarma
  r = await y("GET", "/api/admin/soru-bankasi/disa-aktar?sayfa=ap-calculus");
  assert.equal(r.durum, 200);
  assert.match(r.basliklar.get("content-disposition"), /attachment/);
  assert.ok(r.govde.sorular.some(x => x.id === yeniId && x.dogru === "B"));
  // Denetim kaydı
  const eylemler = db().prepare("SELECT eylem FROM audit_log WHERE eylem LIKE 'soru-bankasi.%'").all().map(x => x.eylem);
  for (const e of ["soru-bankasi.duzenle", "soru-bankasi.geri-yukle", "soru-bankasi.arsiv", "soru-bankasi.ekle", "soru-bankasi.disa-aktar"]) assert.ok(eylemler.includes(e), e);
});

test("yönetici formu: aynı şık kontrolü büyük/küçük harfe duyarlı (calc_u7_q1 t / T kaydedilir; birebir aynı şık 400)", async () => {
  const y = await yonetici();
  const s = (await y("GET", "/api/admin/soru-bankasi/soru/calc_u7_q1")).govde.soru;
  assert.ok(s.secenekler.some(o => o.text.includes("k(t - 20)")) && s.secenekler.some(o => o.text.includes("k(T - 20)")));
  const form = { surum: s.surum, govde: s.govde, secenekler: s.secenekler, dogru: s.dogru, zorluk: s.zorluk, durum: s.durum, aciklama: s.aciklama,
    genel_hatirlatma: s.genel_hatirlatma + " ", hata_aciklamalari: s.hata_aciklamalari, konu: s.konu, kaynak: s.kaynak, not: "t/T şıkları" };
  const ok = await y("PUT", "/api/admin/soru-bankasi/soru/calc_u7_q1", form);
  assert.equal(ok.durum, 200, JSON.stringify(ok.govde));
  const ayni = await y("PUT", "/api/admin/soru-bankasi/soru/calc_u7_q1", Object.assign({}, form, { surum: ok.govde.surum,
    secenekler: s.secenekler.map((o, i) => i === 3 ? { id: o.id, text: s.secenekler[2].text } : o) }));
  assert.equal(ayni.durum, 400); assert.match(JSON.stringify(ayni.govde), /Aynı metinli/);
});
