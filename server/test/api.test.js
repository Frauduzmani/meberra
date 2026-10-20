"use strict";
// Meberra API uçtan uca testleri: node --test server/test/
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { olustur } = require("../uygulama");

let app, base;
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000 });
  await new Promise(r => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
});
after(() => new Promise(r => app.server.close(r)));

// Basit tarayıcı: çerez saklar
function istemci() {
  let cerez = "";
  return async function iste(yontem, yol, govde, basliklar) {
    const h = Object.assign({ "Content-Type": "application/json" }, yontem === "GET" ? {} : { "X-Meberra": "1" }, cerez ? { Cookie: cerez } : {}, basliklar || {});
    const r = await fetch(base + yol, { method: yontem, headers: h, body: govde ? JSON.stringify(govde) : undefined });
    const sc = r.headers.get("set-cookie");
    if (sc) { const m = /meberra_sid=([^;]*)/.exec(sc); cerez = m && m[1] ? "meberra_sid=" + m[1] : ""; }
    const tur = r.headers.get("content-type") || "";
    return { durum: r.status, govde: tur.includes("json") ? await r.json() : await r.text() };
  };
}
const kayitBilgi = (ep) => ({ ad: "Ayşe", soyad: "Yılmaz", eposta: ep, sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true, veliOnay: true });
const db = () => app.db;

test("sağlık ve genel yapılandırma", async () => {
  const c = istemci();
  assert.equal((await c("GET", "/api/health")).govde.ok, true);
  const k = (await c("GET", "/api/public/config")).govde;
  assert.equal(k.marka, "Meberra");
  assert.deepEqual(k.planlar.map(p => [p.id, p.fiyat]), [["aylik", 199], ["yillik", 1490]]);
});

test("statik sunum: korumalı dosyalar açılmaz, HTML'e sunucu etiketi eklenir", async () => {
  const c = istemci();
  for (const y of ["/server/config.js", "/server/data/meberra.db", "/.env", "/TASKS.md", "/package.json", "/_devre-disi/AGENTS.md", "/assets/../server/db.js", "/%2e%2e/server/db.js"]) {
    assert.equal((await c("GET", y)).durum, 404, y);
  }
  const s = await c("GET", "/giris.html");
  assert.equal(s.durum, 200);
  assert.match(s.govde, /<meta name="meberra-api" content="1">/);
  assert.equal((await c("GET", "/assets/css/styles.css")).durum, 200);
});

test("kayıt doğrulaması ve CSRF başlığı", async () => {
  const c = istemci();
  let r = await c("POST", "/api/auth/register", { ad: "", eposta: "bozuk", sifre: "kisa", sifre2: "x" });
  assert.equal(r.durum, 400);
  assert.ok(r.govde.errors.ad && r.govde.errors.eposta && r.govde.errors.sifre && r.govde.errors.kosullar && r.govde.errors.kvkk);
  r = await c("POST", "/api/auth/register", kayitBilgi("csrf@ornek.com"), { "X-Meberra": "" });
  assert.equal(r.durum, 403, "X-Meberra başlığı olmadan reddedilir");
});

test("kayıt → oturum → profil → çıkış → giriş", async () => {
  const c = istemci();
  let r = await c("POST", "/api/auth/register", kayitBilgi("Ayse@Ornek.com"));
  assert.equal(r.durum, 200);
  assert.equal(r.govde.user.eposta, "ayse@ornek.com");
  assert.equal(r.govde.user.rol, "ogrenci");
  assert.equal(r.govde.uyelik.premium, false);
  assert.equal((await c("POST", "/api/auth/register", kayitBilgi("ayse@ornek.com"))).durum, 400, "aynı e-posta ikinci kez kaydolamaz");

  r = await c("PUT", "/api/profile", { profile: { ogrenciModeli: "lise", sinif: "11", ulkeler: ["de", "it"], tamamlandi: true, egitimDili: "en" } });
  assert.equal(r.durum, 200);
  const p = db().prepare("SELECT * FROM profiles").get();
  assert.equal(p.ulkeler, "de,it");
  assert.equal(p.tamamlandi, 1);

  assert.equal((await c("GET", "/api/me")).govde.profile.sinif, "11");
  assert.equal((await c("POST", "/api/auth/logout")).durum, 200);
  assert.equal((await c("GET", "/api/me")).durum, 401, "çıkıştan sonra oturum yok");

  assert.equal((await c("POST", "/api/auth/login", { kimlik: "ayse@ornek.com", sifre: "yanlis-sifre" })).durum, 401);
  r = await c("POST", "/api/auth/login", { kimlik: "AYSE@ornek.com", sifre: "Deneme-12345" });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.profile.ulkeler[1], "it");

  const eylemler = db().prepare("SELECT eylem FROM audit_log ORDER BY id").all().map(x => x.eylem);
  ["auth.kayit", "profil.olustur", "auth.cikis", "auth.giris-basarisiz", "auth.giris"].forEach(e => assert.ok(eylemler.includes(e), e + " denetim kaydında"));
  const sifre = db().prepare("SELECT sifre_hash FROM users WHERE eposta = 'ayse@ornek.com'").get().sifre_hash;
  assert.match(sifre, /^scrypt\$/);
  assert.ok(!sifre.includes("Deneme-12345"));
});

test("senkron: ilerleme birleşir ve cevap/yanlış/deneme tablolarına ayrışır", async () => {
  const c = istemci();
  await c("POST", "/api/auth/register", kayitBilgi("senkron@ornek.com"));
  const uid = db().prepare("SELECT id FROM users WHERE eposta = 'senkron@ornek.com'").get().id;
  const ilerleme = ans => JSON.stringify({ v: 1, pages: { "ap-calculus": { units: { "calc-unit1-quiz-container": { title: "Unit 1", total: 22, answers: ans } } } } });

  let r = await c("PUT", "/api/state", { degisiklikler: { "apmeberra:quiz:v1": ilerleme({ q1: { s: "A", c: false, t: "2026-10-20T10:00:00.000Z" } }) } });
  assert.equal(r.durum, 200);
  // İkinci cihaz: farklı soru + aynı sorunun daha yeni cevabı → birleşir
  r = await c("PUT", "/api/state", { degisiklikler: { "apmeberra:quiz:v1": ilerleme({ q1: { s: "D", c: true, t: "2026-10-20T11:00:00.000Z" }, q2: { s: "B", c: true, t: "2026-10-20T11:05:00.000Z" } }) } });
  // Eski bir cihazdan gelen eski veri yenisini ezmez, eksik soruyu da silmez
  r = await c("PUT", "/api/state", { degisiklikler: { "apmeberra:quiz:v1": ilerleme({ q1: { s: "A", c: false, t: "2026-10-20T10:00:00.000Z" } }) } });
  const birlesik = JSON.parse(r.govde.birlesen["apmeberra:quiz:v1"]);
  const a = birlesik.pages["ap-calculus"].units["calc-unit1-quiz-container"].answers;
  assert.equal(a.q1.s, "D");
  assert.ok(a.q2, "q2 korunur");

  const cevaplar = db().prepare("SELECT soru, secim, dogru FROM answers WHERE user_id = ? ORDER BY zaman").all(uid);
  assert.deepEqual(cevaplar.map(x => x.soru + x.secim + x.dogru), ["q1A0", "q1D1", "q2B1"], "her cevap olayı ayrı satır, tekrar gönderim çoğaltmaz");

  await c("PUT", "/api/state", { degisiklikler: { "apmeberra:errors:v1": JSON.stringify({ v: 1, items: { "ap-calculus|q1": { id: "q1", page: "ap-calculus", unit: "calc-unit1-quiz-container", topic: "Limits", errorTag: "Kavram", selected: "A", correct: "D", date: "2026-10-20T10:00:00.000Z", count: 1, resolved: true, resolvedDate: "2026-10-20T11:00:00.000Z" } } }) } });
  const y = db().prepare("SELECT * FROM wrong_answers WHERE user_id = ?").get(uid);
  assert.equal(y.konu, "Limits");
  assert.ok(y.cozuldu);

  await c("PUT", "/api/state", { degisiklikler: { "apmeberra:deneme:v1": JSON.stringify({ v: 1, aktif: null, gecmis: [{ id: "d1", kod: "calc-ab", ad: "AP Calculus AB", tarih: "2026-10-20T12:00:00.000Z", soruSayisi: 20, dogru: 14, yanlis: 5, bos: 1, yuzde: 70, sureSn: 1800 }] }) } });
  assert.equal(db().prepare("SELECT yuzde FROM exams WHERE user_id = ?").get(uid).yuzde, 70);

  r = await c("PUT", "/api/state", { degisiklikler: { "kotu-anahtar": "{}", "apmeberra:x": "bozuk json{" } });
  assert.deepEqual(r.govde.reddedilen.sort(), ["apmeberra:x", "kotu-anahtar"]);
  const durum = (await c("GET", "/api/state")).govde.keys;
  assert.ok(durum["apmeberra:quiz:v1"] && durum["apmeberra:deneme:v1"]);
  assert.equal(durum["kotu-anahtar"], undefined);

  // Silme
  await c("PUT", "/api/state", { degisiklikler: { "apmeberra:errors:v1": null } });
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM wrong_answers WHERE user_id = ?").get(uid).n, 0);
});

test("Premium: talep → yönetici onayı → aktif üyelik; yetkisiz erişim engellenir", async () => {
  const ogr = istemci(), yon = istemci();
  await ogr("POST", "/api/auth/register", kayitBilgi("premium@ornek.com"));
  app.hesap.yoneticiHazirla("yonetici@ornek.com", "Yonetici-12345");
  await yon("POST", "/api/auth/login", { kimlik: "yonetici@ornek.com", sifre: "Yonetici-12345" });

  assert.equal((await ogr("GET", "/api/admin/stats")).durum, 403, "öğrenci yönetici uç noktasına erişemez");
  assert.equal((await istemci()("GET", "/api/admin/stats")).durum, 401);

  let r = await ogr("POST", "/api/premium/talep", { plan: "yillik", odeyenAd: "Fatma Yılmaz", aciklama: "Ziraat EFT" });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.uyelik.bekleyenTalep.plan, "yillik");
  assert.equal((await ogr("POST", "/api/premium/talep", { plan: "aylik", odeyenAd: "X" })).durum, 409, "ikinci bekleyen talep açılamaz");

  const talepler = (await yon("GET", "/api/admin/talepler?durum=bekliyor")).govde.talepler;
  assert.equal(talepler.length, 1);
  assert.equal(talepler[0].tutar, 1490);
  r = await yon("POST", "/api/admin/talepler/" + talepler[0].id, { islem: "onayla", not: "Dekont kontrol edildi" });
  assert.equal(r.durum, 200);
  assert.equal((await yon("POST", "/api/admin/talepler/" + talepler[0].id, { islem: "onayla" })).durum, 409, "aynı talep iki kez onaylanmaz");

  const u = (await ogr("GET", "/api/me")).govde.uyelik;
  assert.equal(u.premium, true);
  assert.equal(u.plan, "yillik");
  const gun = (Date.parse(u.bitis) - Date.now()) / 864e5;
  assert.ok(gun > 364 && gun < 366, "yıllık plan 365 gün");

  const st = (await yon("GET", "/api/admin/stats")).govde;
  assert.equal(st.premium.yillik, 1);
  assert.equal(st.gelirTahmini.aylikTL, Math.round(1490 / 12));

  // Elle ek süre: mevcut bitişin üstüne eklenir; iptal
  const liste = (await yon("GET", "/api/admin/users?q=premium@")).govde.kullanicilar;
  assert.equal(liste.length, 1);
  r = await yon("POST", "/api/admin/users/" + liste[0].id + "/premium", { gun: 10, not: "Hediye" });
  assert.ok(Date.parse(r.govde.uyelik.bitis) > Date.parse(u.bitis));
  r = await yon("POST", "/api/admin/users/" + liste[0].id + "/premium/iptal", {});
  assert.equal(r.govde.uyelik.premium, false);

  const detay = (await yon("GET", "/api/admin/users/" + liste[0].id)).govde;
  assert.equal(detay.abonelikler.length, 2);
  const kayit = (await yon("GET", "/api/admin/audit?kullanici=" + liste[0].id)).govde.kayitlar.map(k => k.eylem);
  ["premium.talep", "premium.talep-onay", "premium.ver", "premium.iptal"].forEach(e => assert.ok(kayit.includes(e), e));

  // Askıya alma oturumu kapatır ve girişi engeller
  await yon("POST", "/api/admin/users/" + liste[0].id + "/durum", { durum: "askida" });
  assert.equal((await ogr("GET", "/api/me")).durum, 401);
  assert.equal((await ogr("POST", "/api/auth/login", { kimlik: "premium@ornek.com", sifre: "Deneme-12345" })).durum, 403);
});

test("şifre sıfırlama e-postası ve tek kullanımlık bağlantı", async () => {
  const c = istemci();
  await c("POST", "/api/auth/register", kayitBilgi("unuttum@ornek.com"));
  assert.equal((await istemci()("POST", "/api/auth/forgot", { eposta: "yok@ornek.com" })).govde.ok, true, "bilinmeyen e-posta da aynı yanıtı alır");
  await istemci()("POST", "/api/auth/forgot", { eposta: "unuttum@ornek.com" });
  const ileti = db().prepare("SELECT metin FROM email_outbox WHERE alici = 'unuttum@ornek.com' ORDER BY id DESC").get();
  const tok = decodeURIComponent(/sifre-sifirla\.html\?t=([^\s]+)/.exec(ileti.metin)[1]);
  assert.equal((await istemci()("POST", "/api/auth/reset", { token: tok, yeni: "Yeni-sifre-99", yeni2: "Yeni-sifre-99" })).durum, 200);
  assert.equal((await istemci()("POST", "/api/auth/reset", { token: tok, yeni: "Baska-sifre-99", yeni2: "Baska-sifre-99" })).durum, 400, "bağlantı ikinci kez kullanılamaz");
  assert.equal((await c("GET", "/api/me")).durum, 401, "sıfırlama tüm oturumları kapatır");
  assert.equal((await istemci()("POST", "/api/auth/login", { kimlik: "unuttum@ornek.com", sifre: "Yeni-sifre-99" })).durum, 200);
});

test("KVKK: veri dışa aktarma ve hesap silme", async () => {
  const c = istemci();
  await c("POST", "/api/auth/register", kayitBilgi("sil@ornek.com"));
  await c("PUT", "/api/state", { degisiklikler: { "apmeberra:quiz:v1": JSON.stringify({ v: 1, pages: { "ap-physics": { units: { u: { answers: { q: { s: "A", c: true, t: "2026-10-20T10:00:00.000Z" } } } } } } }) } });
  const ex = (await c("GET", "/api/account/export")).govde;
  assert.equal(ex.kullanici.eposta, "sil@ornek.com");
  assert.equal(ex.cevaplar.length, 1);
  assert.equal((await c("POST", "/api/account/delete", { sifre: "yanlis" })).durum, 400);
  assert.equal((await c("POST", "/api/account/delete", { sifre: "Deneme-12345" })).durum, 200);
  const u = db().prepare("SELECT * FROM users WHERE kullanici_adi LIKE 'silindi-%'").get();
  assert.equal(u.eposta, null);
  assert.equal(u.durum, "silindi");
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM answers WHERE user_id = ?").get(u.id).n, 0);
  assert.equal((await istemci()("POST", "/api/auth/login", { kimlik: "sil@ornek.com", sifre: "Deneme-12345" })).durum, 401);
  assert.equal((await istemci()("POST", "/api/auth/register", kayitBilgi("sil@ornek.com"))).durum, 200, "silinen e-posta yeniden kaydolabilir");
});

test("hız sınırı: çok fazla hatalı giriş 429 döner", async () => {
  const kucuk = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 3 });
  await new Promise(r => kucuk.server.listen(0, "127.0.0.1", r));
  const b = "http://127.0.0.1:" + kucuk.server.address().port;
  const dene = () => fetch(b + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-Meberra": "1" }, body: JSON.stringify({ kimlik: "a@b.co", sifre: "x" }) }).then(r => r.status);
  const sonuc = [await dene(), await dene(), await dene(), await dene()];
  await new Promise(r => kucuk.server.close(r));
  assert.deepEqual(sonuc, [401, 401, 401, 429], "3 denemeye izin verilir, 4. engellenir");
});
