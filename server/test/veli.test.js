"use strict";
// 1.7.0 Veli paneli + AP ders/hedef/sınav yılı profil alanları: node --test server/test/veli.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { olustur } = require("../uygulama");
const AP = require("../../assets/js/ap-hedef");

let app, base;
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, soruTohum: true });
  await new Promise(r => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
});
after(() => new Promise(r => app.server.close(r)));

function istemci() {
  let cerez = "";
  return async function iste(yontem, yol, govde) {
    const h = Object.assign({ "Content-Type": "application/json" }, yontem === "GET" ? {} : { "X-Meberra": "1" }, cerez ? { Cookie: cerez } : {});
    const r = await fetch(base + yol, { method: yontem, headers: h, body: govde ? JSON.stringify(govde) : undefined });
    const sc = r.headers.get("set-cookie");
    if (sc) { const m = /meberra_sid=([^;]*)/.exec(sc); cerez = m && m[1] ? "meberra_sid=" + m[1] : ""; }
    const tur = r.headers.get("content-type") || "";
    return { durum: r.status, govde: tur.includes("json") ? await r.json() : await r.text() };
  };
}
const db = () => app.db;
const SIFRE = "Deneme-12345";
async function ogrenci(ep, ad) {
  const c = istemci();
  const r = await c("POST", "/api/auth/register", { ad: ad || "Ayşe", soyad: "Yılmaz", eposta: ep, sifre: SIFRE, sifre2: SIFRE, kosullar: true, kvkk: true, veliOnay: true });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  await c("PUT", "/api/profile", { profile: { ogrenciModeli: "lise", sinif: "11", ulkeler: ["de"], tamamlandi: true, apDersleri: [{ ders: "calculus-ab", hedef: 5 }, { ders: "computer-science-a", hedef: 4 }], sinavYili: 2027 } });
  return { c, id: r.govde.user.id, uid: db().prepare("SELECT id FROM users WHERE public_id = ?").get(r.govde.user.id).id };
}
/** e-posta kutusundaki son davet bağlantısının belirteci */
function davetBelirteci(ep) {
  const m = db().prepare("SELECT metin FROM email_outbox WHERE alici = ? AND konu LIKE 'Meberra veli paneli daveti%' ORDER BY id DESC LIMIT 1").get(ep);
  assert.ok(m, "davet e-postası gitti: " + ep);
  return decodeURIComponent(/\/veli\?t=([^\s]+)/.exec(m.metin)[1]);
}
const veliKayit = (t, ek) => Object.assign({ t, ad: "Fatma", soyad: "Yılmaz", sifre: SIFRE, sifre2: SIFRE, kosullar: true, kvkk: true, veliRiza: true }, ek || {});
async function veliBagla(o, ep) {
  assert.equal((await o.c("POST", "/api/veli/davet", { eposta: ep })).durum, 200);
  const v = istemci();
  const r = await v("POST", "/api/veli/kayit", veliKayit(davetBelirteci(ep)));
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  return v;
}

test("profil: AP dersleri, hedef puan ve sınav yılı doğrulanır ve normalleşir", async () => {
  const o = await ogrenci("prof@ornek.com");
  const p = { ogrenciModeli: "lise", sinif: "10", ulkeler: ["de"], tamamlandi: true };
  let r = await o.c("PUT", "/api/profile", { profile: Object.assign({}, p, { apDersleri: [{ ders: "astrology", hedef: 4 }] }) });
  assert.equal(r.durum, 400); assert.ok(r.govde.errors.apDersleri);
  r = await o.c("PUT", "/api/profile", { profile: Object.assign({}, p, { apDersleri: [{ ders: "biology", hedef: 6 }] }) });
  assert.equal(r.durum, 400, "hedef 3–5"); assert.match(r.govde.errors.apDersleri, /3, 4 ya da 5/);
  r = await o.c("PUT", "/api/profile", { profile: Object.assign({}, p, { apDersleri: ["biology", "biology"] }) });
  assert.equal(r.durum, 400, "aynı ders iki kez");
  r = await o.c("PUT", "/api/profile", { profile: Object.assign({}, p, { apDersleri: "biology" }) });
  assert.equal(r.durum, 400, "liste değil");
  r = await o.c("PUT", "/api/profile", { profile: Object.assign({}, p, { sinavYili: 2040 }) });
  assert.equal(r.durum, 400); assert.ok(r.govde.errors.sinavYili);
  r = await o.c("PUT", "/api/profile", { profile: Object.assign({}, p, { apDersleri: ["biology", { ders: "microeconomics", hedef: "5" }], sinavYili: "2028", apHedefSoruldu: "2026-10-21T10:00:00.000Z" }) });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  assert.deepEqual(r.govde.profile.apDersleri, [{ ders: "biology", hedef: 4 }, { ders: "microeconomics", hedef: 5 }], "varsayılan hedef 4, sayıya çevrilir");
  assert.equal(r.govde.profile.sinavYili, 2028);
  assert.equal((await o.c("GET", "/api/me")).govde.profile.sinavYili, 2028);
  // Ortak modül: bant eşikleri sunucudaki deneme bandıyla aynı; sınıfa göre yıl
  assert.equal(AP.tahminiPuan(72), 5); assert.equal(AP.tahminiPuan(57), 3); assert.equal(AP.tahminiPuan(29), 1);
  assert.equal(AP.varsayilanSinavYili("11", new Date("2026-10-21")), 2027);
  assert.equal(AP.varsayilanSinavYili("9", new Date("2026-10-21")), 2029);
  assert.deepEqual(AP.sinavYillari(new Date("2026-10-21")), [2027, 2028, 2029]);
});

test("davet → veli hesabı → bağlantı; öğrenci kimin bağlı olduğunu görür; denetim kaydı", async () => {
  const o = await ogrenci("ali@ornek.com", "Ali");
  let r = await o.c("POST", "/api/veli/davet", { eposta: "ali@ornek.com" });
  assert.equal(r.durum, 400, "kendi adresi olamaz");
  r = await o.c("POST", "/api/veli/davet", { eposta: "bozuk" });
  assert.equal(r.durum, 400);
  r = await o.c("POST", "/api/veli/davet", { eposta: "Veli.Ali@Ornek.com" });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.veliler[0].durum, "davet");
  const t = davetBelirteci("veli.ali@ornek.com");
  assert.ok(!db().prepare("SELECT 1 FROM veli_baglantilari WHERE belirtec_hash = ?").get(t), "belirteç düz saklanmaz");

  const anon = istemci();
  assert.equal((await anon("GET", "/api/public/veli-davet?t=yanlis")).durum, 404);
  r = await anon("GET", "/api/public/veli-davet?t=" + encodeURIComponent(t));
  assert.equal(r.durum, 200);
  assert.equal(r.govde.davet.ogrenci.ad, "Ali");
  assert.equal(r.govde.davet.hesapVar, false);

  const v = istemci();
  r = await v("POST", "/api/veli/kayit", veliKayit(t, { veliRiza: false }));
  assert.equal(r.durum, 400); assert.ok(r.govde.errors.veliRiza, "veli rızası zorunlu");
  r = await v("POST", "/api/veli/kayit", veliKayit(t));
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  assert.equal(r.govde.user.rol, "veli");
  assert.equal(r.govde.user.eposta, "veli.ali@ornek.com");
  assert.equal((await v("POST", "/api/veli/kayit", veliKayit(t))).durum, 400, "davet bir kez kullanılır");

  r = await v("GET", "/api/veli/panel");
  assert.equal(r.durum, 200);
  assert.equal(r.govde.cocuklar.length, 1);
  const k = r.govde.cocuklar[0];
  assert.equal(k.id, o.id);
  assert.deepEqual(k.dersler.map(d => [d.ders, d.hedef]), [["calculus-ab", 5], ["computer-science-a", 4]]);
  assert.equal(k.sinavYili, 2027);
  assert.ok(k.tarihler.some(x => x.tur === "sinav" && x.gun === "2027-05-10"), "seçilen dersin 2027 sınav günü");
  assert.ok(k.uyelik && k.uyelik.premium === false);

  r = await o.c("GET", "/api/veli/baglantilar");
  assert.equal(r.govde.veliler[0].durum, "aktif");
  assert.equal(r.govde.veliler[0].ad, "Fatma Yılmaz");
  assert.ok(db().prepare("SELECT 1 FROM audit_log WHERE eylem = 'veli.baglandi' AND user_id = ?").get(o.uid));
  assert.ok(db().prepare("SELECT 1 FROM audit_log WHERE eylem = 'veli.davet' AND user_id = ?").get(o.uid));
  // Öğrenciye bilgi bildirimi
  assert.ok((await o.c("GET", "/api/bildirimler")).govde.bildirimler.some(b => /Velin/.test(b.baslik)));
});

test("veli öğrenci özelliklerini kullanamaz; bağlı olmadığı öğrenciyi göremez; soru-cevabı göremez", async () => {
  const o = await ogrenci("gizli@ornek.com");
  const baska = await ogrenci("baska@ornek.com");
  assert.equal((await o.c("POST", "/api/sorular", { metin: "GIZLI-SORU-METNI integral nasıl?" })).durum, 200);
  db().prepare("INSERT INTO answers (user_id, sayfa, unite, soru, dogru, zaman) VALUES (?, 'ap-calculus', 'calc-unit1-quiz-container', 'calc_u1_q1', 1, ?)").run(o.uid, new Date().toISOString());
  const v = await veliBagla(o, "veli.gizli@ornek.com");
  for (const [y, yol, g] of [["GET", "/api/state"], ["PUT", "/api/state", { degisiklikler: {} }], ["GET", "/api/sorular"], ["POST", "/api/sorular", { metin: "x" }],
    ["PUT", "/api/profile", { profile: { a: 1 } }], ["GET", "/api/premium"], ["POST", "/api/premium/talep", { plan: "aylik", odeyenAd: "x" }], ["GET", "/api/lig"],
    ["GET", "/api/bildirimler"], ["GET", "/api/veli/baglantilar"], ["POST", "/api/veli/davet", { eposta: "z@ornek.com" }], ["GET", "/api/admin/users"]]) {
    assert.equal((await v(y, yol, g)).durum, 403, y + " " + yol);
  }
  const panel = await v("GET", "/api/veli/panel");
  assert.equal(panel.durum, 200);
  const metin = JSON.stringify(panel.govde);
  assert.ok(!/GIZLI-SORU-METNI/.test(metin), "soru metni panelde yok");
  assert.ok(!/calc_u1_q1/.test(metin), "cevap ayrıntısı panelde yok");
  assert.equal(panel.govde.cocuklar[0].toplam.soru, 1, "toplu sayı var");
  // Bağlı olmayan öğrenci: 404 (varlığı sızdırılmaz)
  assert.equal((await v("POST", "/api/veli/cocuk/" + baska.id + "/premium-talep", { plan: "aylik", odeyenAd: "Fatma Yılmaz" })).durum, 404);
  assert.equal((await v("POST", "/api/veli/cocuk/" + baska.id + "/ayril")).durum, 404);
  assert.equal((await v("POST", "/api/veli/cocuk/" + baska.id + "/rapor", { rapor: false })).durum, 404);
  // Öğrenci veli paneline giremez
  assert.equal((await o.c("GET", "/api/veli/panel")).durum, 403);
  // Veli giriş yapabilir, /api/me çalışır
  const v2 = istemci();
  assert.equal((await v2("POST", "/api/auth/login", { kimlik: "veli.gizli@ornek.com", sifre: SIFRE })).durum, 200);
  assert.equal((await v2("GET", "/api/me")).govde.user.rol, "veli");
});

test("öğrenci bağlantıyı istediği an kaldırır; veli artık göremez; denetim kaydı", async () => {
  const o = await ogrenci("kaldir@ornek.com");
  const v = await veliBagla(o, "veli.kaldir@ornek.com");
  assert.equal((await v("GET", "/api/veli/panel")).govde.cocuklar.length, 1);
  const id = (await o.c("GET", "/api/veli/baglantilar")).govde.veliler[0].id;
  const baska = await ogrenci("kaldir2@ornek.com");
  assert.equal((await baska.c("POST", "/api/veli/baglantilar/" + id + "/iptal")).durum, 404, "başkasının bağlantısı");
  const r = await o.c("POST", "/api/veli/baglantilar/" + id + "/iptal");
  assert.equal(r.durum, 200);
  assert.equal(r.govde.veliler.length, 0);
  assert.equal((await v("GET", "/api/veli/panel")).govde.cocuklar.length, 0);
  assert.equal((await v("POST", "/api/veli/cocuk/" + o.id + "/premium-talep", { plan: "aylik", odeyenAd: "F Y" })).durum, 404);
  assert.ok(db().prepare("SELECT 1 FROM audit_log WHERE eylem = 'veli.kaldirildi' AND user_id = ?").get(o.uid));
  // Açık davet de geri çekilebilir; bağlantı belirteci geçersizleşir
  await o.c("POST", "/api/veli/davet", { eposta: "yeni.veli@ornek.com" });
  const t = davetBelirteci("yeni.veli@ornek.com");
  const did = (await o.c("GET", "/api/veli/baglantilar")).govde.veliler[0].id;
  assert.equal((await o.c("POST", "/api/veli/baglantilar/" + did + "/iptal")).durum, 200);
  assert.equal((await istemci()("GET", "/api/public/veli-davet?t=" + encodeURIComponent(t))).durum, 404);
});

test("bir veli birden çok çocuğa bağlanır; davet yalnızca kendi adresine; öğrenci hesabı veli olarak kabul edemez", async () => {
  const o1 = await ogrenci("kardes1@ornek.com", "Can");
  const o2 = await ogrenci("kardes2@ornek.com", "Ece");
  const v = await veliBagla(o1, "anne@ornek.com");
  assert.equal((await o2.c("POST", "/api/veli/davet", { eposta: "anne@ornek.com" })).durum, 200);
  const t2 = davetBelirteci("anne@ornek.com");
  let r = await istemci()("GET", "/api/public/veli-davet?t=" + encodeURIComponent(t2));
  assert.equal(r.govde.davet.hesapVar, true);
  assert.equal((await istemci()("POST", "/api/veli/kayit", veliKayit(t2))).durum, 409, "hesap varken yeni kayıt yok");
  assert.equal((await o1.c("POST", "/api/veli/kabul", { t: t2 })).durum, 403, "öğrenci hesabı kabul edemez");
  // Başka bir veli bu daveti kabul edemez
  const o3 = await ogrenci("kardes3@ornek.com");
  const baskaVeli = await veliBagla(o3, "baba@ornek.com");
  assert.equal((await baskaVeli("POST", "/api/veli/kabul", { t: t2 })).durum, 403);
  assert.equal((await v("POST", "/api/veli/kabul", { t: t2 })).durum, 200);
  r = await v("GET", "/api/veli/panel");
  assert.deepEqual(r.govde.cocuklar.map(c => c.ad).sort(), ["Can", "Ece"]);
  // Aynı çifte ikinci davet: zaten bağlı
  assert.equal((await o2.c("POST", "/api/veli/davet", { eposta: "anne@ornek.com" })).durum, 409);
  // En fazla 3 veli
  for (const e of ["a1@ornek.com", "a2@ornek.com"]) assert.equal((await o2.c("POST", "/api/veli/davet", { eposta: e })).durum, 200);
  assert.equal((await o2.c("POST", "/api/veli/davet", { eposta: "a3@ornek.com" })).durum, 409);
  // Öğrenci hesabının adresi veli olarak davet edilemez
  assert.equal((await o3.c("POST", "/api/veli/davet", { eposta: "kardes1@ornek.com" })).durum, 400);
});

test("veli çocuğu için Premium ödeme bildirimi verir; talep çocuğun hesabına açılır, yönetici onayı aynı akış", async () => {
  const o = await ogrenci("prem@ornek.com");
  const v = await veliBagla(o, "veli.prem@ornek.com");
  let r = await v("POST", "/api/veli/cocuk/" + o.id + "/premium-talep", { plan: "yillik" });
  assert.equal(r.durum, 400, "ödeyen adı gerekli");
  r = await v("POST", "/api/veli/cocuk/" + o.id + "/premium-talep", { plan: "yillik", odeyenAd: "Fatma Yılmaz", aciklama: "Havale" });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  assert.equal(r.govde.uyelik.bekleyenTalep.plan, "yillik");
  const t = db().prepare("SELECT * FROM upgrade_requests WHERE id = ?").get(r.govde.talep.id);
  assert.equal(t.user_id, o.uid, "talep çocuğun hesabında");
  assert.equal(t.veli_id, db().prepare("SELECT id FROM users WHERE eposta = 'veli.prem@ornek.com'").get().id);
  assert.equal((await o.c("GET", "/api/premium")).govde.uyelik.bekleyenTalep.plan, "yillik", "öğrenci bekleyen talebi görür");
  assert.equal((await v("POST", "/api/veli/cocuk/" + o.id + "/premium-talep", { plan: "aylik", odeyenAd: "F" })).durum, 409, "bekleyen varken ikinci yok");
  assert.ok(db().prepare("SELECT 1 FROM audit_log WHERE eylem = 'veli.premium-talep' AND user_id = ?").get(o.uid));
  // Yönetici onaylar → çocuk Premium
  app.hesap.yoneticiHazirla("yonetici.veli@ornek.com", "Yonetici-12345");
  const y = istemci();
  assert.equal((await y("POST", "/api/auth/login", { kimlik: "yonetici.veli@ornek.com", sifre: "Yonetici-12345" })).durum, 200);
  assert.equal((await y("POST", "/api/admin/talepler/" + t.id, { islem: "onayla" })).durum, 200);
  r = await v("GET", "/api/veli/panel");
  assert.equal(r.govde.cocuklar[0].uyelik.premium, true);
  // Yönetici: kullanıcı listesinde rol süzgeci ve bağlantı listesi
  r = await y("GET", "/api/admin/users?rol=veli");
  assert.ok(r.govde.kullanicilar.length >= 1 && r.govde.kullanicilar.every(u => u.rol === "veli"), "rol=veli süzgeci");
  assert.ok(r.govde.kullanicilar.some(u => u.bagliSayisi >= 1));
  r = await y("GET", "/api/admin/veli-baglantilari?kullanici=" + o.id);
  assert.equal(r.durum, 200);
  assert.equal(r.govde.baglantilar[0].veli.eposta, "veli.prem@ornek.com");
});

test("haftalık rapor: bağlı velilere (tercihe uyarak), eski veli e-postasıyla tek kimlik, tekrar yok", async () => {
  const PAZAR = Date.parse("2026-10-25T16:00:00Z"), PAZARTESI = Date.parse("2026-10-26T16:00:00Z"); // İstanbul 19:00
  const o = await ogrenci("rapor@ornek.com", "Deniz");
  // Eski akış: veli e-postası + onay (aynı adres sonra veli hesabı olarak bağlanacak)
  assert.equal((await o.c("PUT", "/api/bildirim-ayarlari", { veliEposta: "veli.rapor@ornek.com", veliRaporu: true })).durum, 200);
  const v = await veliBagla(o, "veli.rapor@ornek.com");
  assert.ok(db().prepare("SELECT veli_dogrulandi FROM notification_prefs WHERE user_id = ?").get(o.uid).veli_dogrulandi, "bağlanınca eski adres onaylı sayılır");
  const v2 = await veliBagla(o, "ikinci.veli@ornek.com");
  const v3 = await veliBagla(o, "ucuncu.veli@ornek.com");
  assert.equal((await v3("POST", "/api/veli/cocuk/" + o.id + "/rapor", { rapor: false })).durum, 200, "veli raporu kapatır");
  db().prepare("INSERT INTO answers (user_id, sayfa, unite, soru, dogru, zaman) VALUES (?, 'ap-calculus', 'calc-unit1-quiz-container', 'q1', 1, '2026-10-24T10:00:00.000Z')").run(o.uid);
  const say = ep => db().prepare("SELECT COUNT(*) AS n FROM email_outbox WHERE alici = ? AND konu LIKE 'Meberra haftalık%'").get(ep).n;

  assert.equal(app.veli.haftalikRaporlar(PAZARTESI), 0, "pazar dışında yok");
  await app.zamanlayici.calistir("veliRaporu", PAZAR);
  assert.equal(say("veli.rapor@ornek.com"), 1, "aynı adres yalnızca bir kez (veli hesabı)");
  assert.equal(say("ikinci.veli@ornek.com"), 1);
  assert.equal(say("ucuncu.veli@ornek.com"), 0, "raporu kapatan veli almaz");
  const m = db().prepare("SELECT metin FROM email_outbox WHERE alici = 'ikinci.veli@ornek.com' AND konu LIKE 'Meberra haftalık%'").get().metin;
  assert.match(m, /Çözülen soru: 1/); assert.match(m, /AP Calculus AB/); assert.match(m, /veli-rapor-iptal\?t=/);
  await app.zamanlayici.calistir("veliRaporu", PAZAR + 3600e3);
  assert.equal(say("ikinci.veli@ornek.com"), 1, "aynı gün tekrar gönderilmez");
  // Tek tıkla iptal
  const tok = decodeURIComponent(/veli-rapor-iptal\?t=([^\s]+)/.exec(m)[1]);
  const r = await istemci()("GET", "/api/public/veli-rapor-iptal?t=" + encodeURIComponent(tok));
  assert.equal(r.durum, 200);
  assert.equal(db().prepare("SELECT rapor FROM veli_baglantilari b JOIN users v ON v.id = b.veli_id WHERE v.eposta = 'ikinci.veli@ornek.com'").get().rapor, 0);
  // Öğrenci bağlantıyı kaldırırsa rapor gitmez
  const id = (await o.c("GET", "/api/veli/baglantilar")).govde.veliler.find(x => x.eposta === "veli.rapor@ornek.com").id;
  await o.c("POST", "/api/veli/baglantilar/" + id + "/iptal");
  const SONRAKI = PAZAR + 7 * 864e5;
  await app.zamanlayici.calistir("veliRaporu", SONRAKI);
  assert.equal(say("veli.rapor@ornek.com"), 1, "bağlantı kalkınca aynı adrese eski akışla da rapor gitmez (tek kimlik)");
  assert.equal(db().prepare("SELECT veli_raporu FROM notification_prefs WHERE user_id = ?").get(o.uid).veli_raporu, 0);
  assert.equal(say("ikinci.veli@ornek.com"), 1);
  void v; void v2;
});

test("hesap silinince veli bağlantıları kapanır; dışa aktarma bağlantıları içerir", async () => {
  const o = await ogrenci("sil@ornek.com");
  const v = await veliBagla(o, "veli.sil@ornek.com");
  const ex = await o.c("GET", "/api/account/export");
  assert.equal(ex.govde.veliBaglantilari[0].durum, "aktif");
  assert.equal((await o.c("POST", "/api/account/delete", { sifre: SIFRE })).durum, 200);
  assert.equal((await v("GET", "/api/veli/panel")).govde.cocuklar.length, 0);
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM veli_baglantilari WHERE ogrenci_id = ? AND (durum != 'iptal' OR eposta IS NOT NULL)").get(o.uid).n, 0);
});
