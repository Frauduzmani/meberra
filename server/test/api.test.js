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
  assert.equal(k.planlar[1].aciklama, "Ayda yaklaşık 124 ₺ · %38 tasarruf", "yıllık açıklama fiyatlardan hesaplanır (urun.js ile aynı)");
});

test("statik sunum: korumalı dosyalar açılmaz, HTML'e sunucu etiketi eklenir", async () => {
  const c = istemci();
  for (const y of ["/server/config.js", "/server/data/meberra.db", "/.env", "/TASKS.md", "/package.json", "/_devre-disi/AGENTS.md", "/assets/../server/db.js", "/%2e%2e/server/db.js"]) {
    assert.equal((await c("GET", y)).durum, 404, y);
  }
  const s = await c("GET", "/giris");
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
  const ileti = db().prepare("SELECT konu FROM email_outbox WHERE alici = 'premium@ornek.com' ORDER BY id DESC").get();
  assert.equal(ileti && ileti.konu, "Meberra Premium hesabın açıldı", "öğrenciye onay e-postası kuyruğa yazılır");

  const u = (await ogr("GET", "/api/me")).govde.uyelik;
  assert.equal(u.premium, true);
  assert.equal(u.plan, "yillik");
  const gun = (Date.parse(u.bitis) - Date.now()) / 864e5;
  assert.ok(gun > 364 && gun < 366, "yıllık plan 365 gün");

  const st = (await yon("GET", "/api/admin/stats")).govde;
  assert.equal(st.premium.yillik, 1);
  assert.equal(st.gelirTahmini.aylikTL, Math.round(1490 / 365 * 30), "ödenen tutar dönem gününe bölünüp 30 güne çevrilir");

  // Elle ek süre: mevcut bitişin üstüne eklenir; iptal
  const liste = (await yon("GET", "/api/admin/users?q=premium@")).govde.kullanicilar;
  assert.equal(liste.length, 1);
  assert.equal((await yon("POST", "/api/admin/users/" + liste[0].id + "/premium", { gun: 0.5 })).durum, 400, "gün tam sayı olmalı");
  assert.equal((await yon("POST", "/api/admin/users/" + liste[0].id + "/premium", { gun: 0 })).durum, 400, "gün en az 1");
  r = await yon("POST", "/api/admin/users/" + liste[0].id + "/premium", { gun: 10, not: "Hediye" });
  assert.ok(Date.parse(r.govde.uyelik.bitis) > Date.parse(u.bitis));
  assert.equal((await yon("GET", "/api/admin/stats")).govde.gelirTahmini.aylikTL, Math.round(1490 / 365 * 30), "elle verilen (ücretsiz) dönem gelire sayılmaz");
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
  const tok = decodeURIComponent(/sifre-sifirla\?t=([^\s]+)/.exec(ileti.metin)[1]);
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

test("senkron: kullanıcı başına anahtar sınırı", async () => {
  const c = istemci();
  await c("POST", "/api/auth/register", kayitBilgi("sinir@ornek.com"));
  const d = {};
  for (let i = 0; i < 65; i++) d["apmeberra:deneme-" + i] = "{}";
  const r = await c("PUT", "/api/state", { degisiklikler: d });
  assert.equal(r.govde.reddedilen.length, 5, "60'tan sonrası reddedilir");
});

test("kayan oturum: süre uzayınca çerez yeni Max-Age ile yeniden yazılır", async () => {
  const k = await fetch(base + "/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json", "X-Meberra": "1" }, body: JSON.stringify(kayitBilgi("kayan@ornek.com")) });
  const cerez = /meberra_sid=[^;]*/.exec(k.headers.get("set-cookie"))[0];
  let r = await fetch(base + "/api/me", { headers: { Cookie: cerez } });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("set-cookie"), null, "aynı gün içinde çerez yeniden yazılmaz");
  const uid = db().prepare("SELECT id FROM users WHERE eposta = 'kayan@ornek.com'").get().id;
  db().prepare("UPDATE sessions SET son_kullanim = ? WHERE user_id = ?").run(new Date(Date.now() - 2 * 864e5).toISOString(), uid);
  r = await fetch(base + "/api/me", { headers: { Cookie: cerez } });
  assert.equal(r.status, 200);
  const sc = r.headers.get("set-cookie") || "";
  assert.ok(sc.includes(cerez + ";"), "aynı belirteç");
  assert.match(sc, /Max-Age=2592000/, "30 günlük yeni süre");
});

test("şifre değiştirme diğer oturumları ve açık sıfırlama bağlantılarını kapatır", async () => {
  const a = istemci(), b = istemci();
  await a("POST", "/api/auth/register", kayitBilgi("sifredegis@ornek.com"));
  await b("POST", "/api/auth/login", { kimlik: "sifredegis@ornek.com", sifre: "Deneme-12345" });
  await istemci()("POST", "/api/auth/forgot", { eposta: "sifredegis@ornek.com" });
  const ileti = db().prepare("SELECT metin FROM email_outbox WHERE alici = 'sifredegis@ornek.com' ORDER BY id DESC").get();
  const tok = decodeURIComponent(/sifre-sifirla\?t=([^\s]+)/.exec(ileti.metin)[1]);
  assert.equal((await a("POST", "/api/auth/password", { eski: "Deneme-12345", yeni: "Yeni-sifre-77", yeni2: "Yeni-sifre-77" })).durum, 200);
  assert.equal((await a("GET", "/api/me")).durum, 200, "şifreyi değiştiren oturum açık kalır");
  assert.equal((await b("GET", "/api/me")).durum, 401, "diğer cihazın oturumu kapanır");
  assert.equal((await istemci()("POST", "/api/auth/reset", { token: tok, yeni: "Baska-sifre-88", yeni2: "Baska-sifre-88" })).durum, 400, "eski sıfırlama bağlantısı geçersiz");
});

test("öğrenci bekleyen ödeme bildirimini iptal eder", async () => {
  const c = istemci();
  await c("POST", "/api/auth/register", kayitBilgi("talepiptal@ornek.com"));
  assert.equal((await c("POST", "/api/premium/talep/iptal")).durum, 409, "bekleyen talep yoksa 409");
  await c("POST", "/api/premium/talep", { plan: "aylik", odeyenAd: "Ali Veli" });
  assert.equal((await c("POST", "/api/premium/talep/iptal", null, { "X-Meberra": "" })).durum, 403, "CSRF başlığı zorunlu");
  const r = await c("POST", "/api/premium/talep/iptal");
  assert.equal(r.durum, 200);
  assert.equal(r.govde.talep.durum, "iptal");
  assert.equal(r.govde.uyelik.bekleyenTalep, null);
  const p = (await c("GET", "/api/premium")).govde;
  assert.equal(p.talepler[0].durum, "iptal");
  const uid = db().prepare("SELECT id FROM users WHERE eposta = 'talepiptal@ornek.com'").get().id;
  assert.ok(db().prepare("SELECT 1 FROM audit_log WHERE user_id = ? AND eylem = 'premium.talep-iptal'").get(uid));
  assert.equal((await c("POST", "/api/premium/talep", { plan: "yillik", odeyenAd: "Ali Veli" })).durum, 200, "iptalden sonra yeni bildirim açılabilir");
});

test("talep onayı: yarış güvenli, aktif olmayan hesap onaylanamaz; hesap silme kişisel izleri temizler", async () => {
  const yon = istemci();
  app.hesap.yoneticiHazirla("yonetici2@ornek.com", "Yonetici-12345");
  await yon("POST", "/api/auth/login", { kimlik: "yonetici2@ornek.com", sifre: "Yonetici-12345" });

  // Aynı talebe eşzamanlı iki onay: biri başarılı, diğeri 409; tek dönem açılır
  const a = istemci();
  await a("POST", "/api/auth/register", kayitBilgi("yaris@ornek.com"));
  const t1 = (await a("POST", "/api/premium/talep", { plan: "aylik", odeyenAd: "Ali" })).govde.talep.id;
  const sonuc = await Promise.all([yon("POST", "/api/admin/talepler/" + t1, { islem: "onayla" }), yon("POST", "/api/admin/talepler/" + t1, { islem: "onayla" })]);
  assert.deepEqual(sonuc.map(x => x.durum).sort(), [200, 409]);
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM subscriptions WHERE talep_id = ?").get(t1).n, 1);

  // Askıdaki kullanıcının talebi onaylanamaz
  const b = istemci();
  await b("POST", "/api/auth/register", kayitBilgi("askida@ornek.com"));
  const t2 = (await b("POST", "/api/premium/talep", { plan: "aylik", odeyenAd: "Ali" })).govde.talep.id;
  const pid = db().prepare("SELECT public_id FROM users WHERE eposta = 'askida@ornek.com'").get().public_id;
  await yon("POST", "/api/admin/users/" + pid + "/durum", { durum: "askida" });
  assert.equal((await yon("POST", "/api/admin/talepler/" + t2, { islem: "onayla" })).durum, 409);
  assert.equal(db().prepare("SELECT durum FROM upgrade_requests WHERE id = ?").get(t2).durum, "bekliyor", "onaylanmayan talep bekliyor kalır");

  // Hesap silme: bekleyen talep iptal, aktif dönem biter, denetim/e-posta kişisel alanları anonim
  const c = istemci();
  await c("POST", "/api/auth/register", kayitBilgi("kvkk2@ornek.com"));
  const uid = db().prepare("SELECT id FROM users WHERE eposta = 'kvkk2@ornek.com'").get().id;
  app.hesap.premiumVer(uid, "aylik", null, { kaynak: "elle" });
  await istemci()("POST", "/api/auth/login", { kimlik: "kvkk2@ornek.com", sifre: "yanlis" }); // ayrıntıda e-posta olan kayıt
  await istemci()("POST", "/api/auth/forgot", { eposta: "kvkk2@ornek.com" });
  const t3 = (await c("POST", "/api/premium/talep", { plan: "yillik", odeyenAd: "Veli" })).govde.talep.id;
  assert.equal((await c("POST", "/api/account/delete", { sifre: "Deneme-12345" })).durum, 200);
  assert.equal(db().prepare("SELECT durum FROM upgrade_requests WHERE id = ?").get(t3).durum, "iptal");
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM subscriptions WHERE user_id = ? AND durum = 'aktif'").get(uid).n, 0);
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM audit_log WHERE (user_id = ? OR yapan_id = ?) AND (ip IS NOT NULL OR tarayici IS NOT NULL)").get(uid, uid).n, 0);
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM audit_log WHERE ayrinti LIKE '%kvkk2@ornek.com%'").get().n, 0);
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM email_outbox WHERE alici = 'kvkk2@ornek.com' OR metin LIKE '%kvkk2@ornek.com%'").get().n, 0);
  assert.equal((await yon("POST", "/api/admin/talepler/" + t3, { islem: "onayla" })).durum, 409, "silinen hesabın talebi onaylanamaz");
});

test("senkron: deneme/seviye geçmişi cihazlar arasında birleşir, deneme hakkı silinmez", async () => {
  const c = istemci();
  await c("POST", "/api/auth/register", kayitBilgi("deneme-birles@ornek.com"));
  const uid = db().prepare("SELECT id FROM users WHERE eposta = 'deneme-birles@ornek.com'").get().id;
  const kayit = (id, tarih) => ({ id, kod: "calc-ab", ad: "AP Calculus AB", tarih, soruSayisi: 10, dogru: 5, yanlis: 5, bos: 0, yuzde: 50, sureSn: 600 });
  const DK = "apmeberra:deneme:v1";
  await c("PUT", "/api/state", { degisiklikler: { [DK]: JSON.stringify({ v: 1, aktif: null, gecmis: [kayit("d1", "2026-10-20T10:00:00.000Z")] }) } });
  // Diğer cihaz: d1'den habersiz, d2'yi bitirmiş; yarım deneme d3
  let r = await c("PUT", "/api/state", { degisiklikler: { [DK]: JSON.stringify({ v: 1, aktif: { id: "d3", sorular: [] }, gecmis: [kayit("d2", "2026-10-21T10:00:00.000Z")] }) } });
  let d = JSON.parse(r.govde.birlesen[DK]);
  assert.deepEqual(d.gecmis.map(x => x.id), ["d2", "d1"], "iki cihazın denemeleri birleşir, en yeni başta");
  assert.equal(d.aktif.id, "d3");
  // Bitmiş görünen deneme (geçmişte d3 var) yarım deneme olarak geri dönmez
  r = await c("PUT", "/api/state", { degisiklikler: { [DK]: JSON.stringify({ v: 1, aktif: { id: "d3", sorular: [] }, gecmis: [kayit("d3", "2026-10-21T11:00:00.000Z")] }) } });
  d = JSON.parse(r.govde.birlesen[DK]);
  assert.equal(d.aktif, null);
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM exams WHERE user_id = ?").get(uid).n, 3);

  const SK = "apmeberra:seviye:v1", rap = (id, tarih) => ({ id, tarih, guncelleme: tarih, dersler: ["calc"], sonuclar: {} });
  await c("PUT", "/api/state", { degisiklikler: { [SK]: JSON.stringify({ v: 1, devam: null, raporlar: [rap("r1", "2026-10-20T10:00:00.000Z")], kontrol: { g1: { c: true, t: "2026-10-20T10:00:00.000Z" } } }) } });
  r = await c("PUT", "/api/state", { degisiklikler: { [SK]: JSON.stringify({ v: 1, devam: null, raporlar: [rap("r2", "2026-10-21T10:00:00.000Z")], kontrol: { g1: { c: false, t: "2026-10-19T10:00:00.000Z" } } }) } });
  const s = JSON.parse(r.govde.birlesen[SK]);
  assert.deepEqual(s.raporlar.map(x => x.id), ["r2", "r1"]);
  assert.equal(s.kontrol.g1.c, true, "kontrol işaretinde daha yeni damga kazanır");

  const HK = "apmeberra:deneme-hak:v1";
  await c("PUT", "/api/state", { degisiklikler: { [HK]: JSON.stringify({ "ap-calculus": { t: 2000, kod: "calc-ab" } }) } });
  r = await c("PUT", "/api/state", { degisiklikler: { [HK]: JSON.stringify({ "ap-calculus": { t: 5000, kod: "calc-ab" }, "ap-physics": { t: 3000, kod: "phys-1" } }) } });
  assert.deepEqual(JSON.parse(r.govde.birlesen[HK]), { "ap-calculus": { t: 2000, kod: "calc-ab" }, "ap-physics": { t: 3000, kod: "phys-1" } }, "en erken kullanım kalır");
  r = await c("PUT", "/api/state", { degisiklikler: { [HK]: "{}" } });
  assert.equal(Object.keys(JSON.parse(r.govde.birlesen[HK])).length, 2, "eksik gönderim kaydı silmez");
  await c("PUT", "/api/state", { degisiklikler: { [HK]: null } });
  assert.equal(Object.keys(JSON.parse((await c("GET", "/api/state")).govde.keys[HK].deger)).length, 2, "silme isteği de kaydı silmez");
});

test("senkron: silinen Yanlışlarım eski cihazdan geri gelmez (silme izi)", async () => {
  const c = istemci();
  await c("POST", "/api/auth/register", kayitBilgi("silmeizi@ornek.com"));
  const uid = db().prepare("SELECT id FROM users WHERE eposta = 'silmeizi@ornek.com'").get().id;
  const EK = "apmeberra:errors:v1";
  const hata = (id, date) => ({ id, page: "ap-calculus", unit: "u1", topic: "Limits", selected: "A", correct: "B", date, count: 1, resolved: false });
  const eski = new Date(Date.now() - 864e5).toISOString();
  await c("PUT", "/api/state", { degisiklikler: { [EK]: JSON.stringify({ v: 1, items: { "ap-calculus|q1": hata("q1", eski) } }) } });
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM wrong_answers WHERE user_id = ?").get(uid).n, 1);
  // Cihaz A Yanlışlarım'ı sıfırlar
  await c("PUT", "/api/state", { degisiklikler: { [EK]: null } });
  const st = (await c("GET", "/api/state")).govde.keys[EK];
  assert.deepEqual(JSON.parse(st.deger).items, {}, "diğer cihazlar çekince boş değeri alır");
  // Eski cihaz B silinen q1'i ve silmeden sonra yaptığı yeni yanlışı (q2) gönderir
  const yeni = new Date(Date.now() + 60e3).toISOString();
  const r = await c("PUT", "/api/state", { degisiklikler: { [EK]: JSON.stringify({ v: 1, items: { "ap-calculus|q1": hata("q1", eski), "ap-calculus|q2": hata("q2", yeni) } }) } });
  assert.deepEqual(Object.keys(JSON.parse(r.govde.birlesen[EK]).items), ["ap-calculus|q2"], "silinen kayıt geri gelmez, yenisi kalır");
  assert.deepEqual(db().prepare("SELECT soru FROM wrong_answers WHERE user_id = ?").all(uid).map(x => x.soru), ["q2"]);
});

test("hız sınırı: vekilde son X-Forwarded-For adresi, başarılı giriş IP sayacını sıfırlar, kimlik normalleşir", async () => {
  const config = require("../config");
  const onceki = config.trustProxy;
  config.trustProxy = true;
  const kucuk = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 3 });
  await new Promise(r => kucuk.server.listen(0, "127.0.0.1", r));
  const b = "http://127.0.0.1:" + kucuk.server.address().port;
  const dene = (kimlik, sifre, xff) => fetch(b + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-Meberra": "1", "X-Forwarded-For": xff },
    body: JSON.stringify({ kimlik, sifre }) }).then(r => r.status);
  try {
    // Baştaki (istemcinin yazabildiği) adres değişse de son adres aynı: sınır işler
    const s1 = [];
    for (let i = 0; i < 4; i++) s1.push(await dene("x" + i + "@b.co", "x", "10.0.0." + i + ", 203.0.113.5"));
    assert.deepEqual(s1, [401, 401, 401, 429]);
    // Başarılı giriş IP sayacını sıfırlar
    await fetch(b + "/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json", "X-Meberra": "1", "X-Forwarded-For": "203.0.113.9" }, body: JSON.stringify(kayitBilgi("nat@ornek.com")) });
    assert.deepEqual([await dene("y1@b.co", "x", "203.0.113.9"), await dene("y2@b.co", "x", "203.0.113.9")], [401, 401]);
    assert.equal(await dene("nat@ornek.com", "Deneme-12345", "203.0.113.9"), 200);
    assert.deepEqual([await dene("y3@b.co", "x", "203.0.113.9"), await dene("y4@b.co", "x", "203.0.113.9"), await dene("y5@b.co", "x", "203.0.113.9")], [401, 401, 401]);
    // Hesap anahtarı kırpılır/küçültülür: farklı yazımlar aynı sayaca düşer
    const s2 = [await dene(" Z@B.co ", "x", "198.51.100.1"), await dene("z@b.co", "x", "198.51.100.2"), await dene("Z@b.CO", "x", "198.51.100.3"), await dene("  z@b.co", "x", "198.51.100.4")];
    assert.deepEqual(s2, [401, 401, 401, 429]);
  } finally {
    config.trustProxy = onceki;
    await new Promise(r => kucuk.server.close(r));
  }
});
