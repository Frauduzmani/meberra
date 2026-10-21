"use strict";
// Yeni özellikler: Veri editörü, soru-cevap, bildirimler, ayarlar, duyuru, push, zamanlayıcı, lig, senkron birleştirme, PWA.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { olustur } = require("../uygulama");
const { seriBirlestir, tekrarBirlestir, oyunBirlestir } = require("../veri");

// Gündüz (İstanbul 13:00) sabit saat: push sessiz saat denetimi testlerde belirleyici olsun
let saatMs = Date.parse("2026-10-21T10:00:00Z");
const pushlar = [];
let pushHatasi = null;
const sahtePush = async (abonelik, yuk) => {
  if (pushHatasi && abonelik.endpoint.includes(pushHatasi.parca)) { const e = new Error("gone"); e.statusCode = pushHatasi.kod; throw e; }
  pushlar.push({ endpoint: abonelik.endpoint, yuk: JSON.parse(yuk) });
};
const vapid = { publicKey: "BTestPublicKey", privateKey: "x", subject: "mailto:test@ornek.com" };

let app, base;
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, soruSiniri: 1000, pushGonderici: sahtePush, vapid, saat: () => saatMs });
  await new Promise(r => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
});
after(() => new Promise(r => app.server.close(r)));

function istemci() {
  let cerez = "";
  return async function iste(yontem, yol, govde, basliklar) {
    const h = Object.assign({ "Content-Type": "application/json" }, yontem === "GET" ? {} : { "X-Meberra": "1" }, cerez ? { Cookie: cerez } : {}, basliklar || {});
    const r = await fetch(base + yol, { method: yontem, headers: h, body: govde ? JSON.stringify(govde) : undefined });
    const sc = r.headers.get("set-cookie");
    if (sc) { const m = /meberra_sid=([^;]*)/.exec(sc); cerez = m && m[1] ? "meberra_sid=" + m[1] : ""; }
    const tur = r.headers.get("content-type") || "";
    return { durum: r.status, basliklar: r.headers, govde: tur.includes("json") ? await r.json() : await r.text() };
  };
}
const kayitBilgi = (ep, ad) => ({ ad: ad || "Ayşe", soyad: "Yılmaz", eposta: ep, sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true, veliOnay: true });
const db = () => app.db;
async function ogrenci(ep, ad) {
  const c = istemci();
  const r = await c("POST", "/api/auth/register", kayitBilgi(ep, ad));
  assert.equal(r.durum, 200, ep);
  const u = db().prepare("SELECT * FROM users WHERE eposta = ?").get(ep);
  return { c, uid: u.id, pid: u.public_id };
}
let yonC = null;
async function yonetici() {
  if (yonC) return yonC;
  app.hesap.yoneticiHazirla("yon@ornek.com", "Yonetici-12345");
  yonC = istemci();
  assert.equal((await yonC("POST", "/api/auth/login", { kimlik: "yon@ornek.com", sifre: "Yonetici-12345" })).durum, 200);
  return yonC;
}
const abonelik = n => ({ endpoint: "https://push.ornek.com/abone/" + n, keys: { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM", auth: "tBHItJI5svbpez7KI4CCXg" } });

// ---------------------------------------------------------------------------------
test("Veri: izin listesi, gizli sütunlar, salt okunur tablolar, denetimde önce/sonra", async () => {
  const yon = await yonetici();
  const o = await ogrenci("veri@ornek.com");
  assert.equal((await o.c("GET", "/api/admin/veri/tablolar")).durum, 403, "öğrenci erişemez");

  const t = (await yon("GET", "/api/admin/veri/tablolar")).govde;
  const users = t.tablolar.find(x => x.ad === "users");
  assert.ok(users.satir >= 2);
  assert.equal(users.sutunlar.find(s => s.ad === "sifre_hash").gizli, true);
  assert.deepEqual(users.duzenlenebilir.sort(), ["ad", "durum", "rol", "soyad"]);
  assert.equal(t.tablolar.find(x => x.ad === "audit_log").saltOkunur, true);
  assert.ok(!t.tablolar.some(x => x.ad === "sqlite_master" || x.ad === "sqlite_sequence"));

  // Tablo adı izin listesi: SQL enjeksiyonu ya da izinsiz tablo → 404
  for (const ad of ["sqlite_master", "users;DROP TABLE users", "users%20--", "yok"]) assert.equal((await yon("GET", "/api/admin/veri/" + encodeURIComponent(ad))).durum, 404, ad);
  assert.equal((await yon("GET", "/api/admin/veri/users?sirala=" + encodeURIComponent("ad; DROP TABLE users"))).durum, 400);
  assert.equal((await yon("GET", "/api/admin/veri/users?sirala=sifre_hash")).durum, 400, "gizli sütuna göre sıralanamaz");
  assert.equal((await yon("GET", "/api/admin/veri/users?alan=sifre_hash&deger=x")).durum, 400, "gizli sütunla süzülemez");

  let r = await yon("GET", "/api/admin/veri/users?q=veri@ornek");
  assert.equal(r.govde.toplam, 1);
  assert.equal(r.govde.satirlar[0].sifre_hash, "••••");
  assert.equal(r.govde.sayfaBoyu, 50);
  r = await yon("GET", "/api/admin/veri/sessions?alan=user_id&deger=" + o.uid);
  assert.ok(r.govde.satirlar.length >= 1);
  assert.ok(r.govde.satirlar.every(s => s.token_hash === "••••"));
  assert.ok(!JSON.stringify(r.govde).includes(db().prepare("SELECT token_hash FROM sessions WHERE user_id = ?").get(o.uid).token_hash));

  // Şifre sıfırlama e-postasındaki belirteç giden kutusu görünümünde gizlenir
  await istemci()("POST", "/api/auth/forgot", { eposta: "veri@ornek.com" });
  r = await yon("GET", "/api/admin/veri/email_outbox?q=veri@ornek.com");
  assert.match(r.govde.satirlar[0].metin, /sifre-sifirla\?t=••••/);

  // Düzenleme: yalnızca izinli alanlar; tür/enum doğrulaması; önce/sonra denetimde
  assert.equal((await yon("PUT", "/api/admin/veri/users/" + o.uid, { degisiklikler: { sifre_hash: "x" } })).durum, 403);
  assert.equal((await yon("PUT", "/api/admin/veri/users/" + o.uid, { degisiklikler: { eposta: "a@b.co" } })).durum, 403);
  assert.equal((await yon("PUT", "/api/admin/veri/users/" + o.uid, { degisiklikler: { durum: "silindi" } })).durum, 400, "enum dışı");
  assert.equal((await yon("PUT", "/api/admin/veri/users/" + o.uid, { degisiklikler: { ad: "" } })).durum, 400);
  assert.equal((await yon("PUT", "/api/admin/veri/audit_log/1", { degisiklikler: { eylem: "x" } })).durum, 403, "audit_log salt okunur");
  assert.equal((await yon("PUT", "/api/admin/veri/users/" + o.uid, { degisiklikler: { ad: "Ayşegül" }, onceki: { ad: "Başka" } })).durum, 409, "iyimser kilit");
  r = await yon("PUT", "/api/admin/veri/users/" + o.uid, { degisiklikler: { ad: "Ayşegül" }, onceki: { ad: "Ayşe" } });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.satir.ad, "Ayşegül");
  assert.equal(r.govde.satir.sifre_hash, "••••");
  const k = db().prepare("SELECT * FROM audit_log WHERE eylem = 'veri.duzenle' ORDER BY id DESC").get();
  assert.equal(k.varlik, "users");
  assert.equal(k.user_id, o.uid);
  assert.deepEqual(JSON.parse(k.ayrinti), { once: { ad: "Ayşe" }, sonra: { ad: "Ayşegül" } });
  assert.equal((await yon("PUT", "/api/admin/veri/users/" + o.uid, { degisiklikler: { ad: "Ayşegül" } })).durum, 400, "değişiklik yok");

  // Askıya alma oturumları kapatır; yönetici kendi rolünü değiştiremez; silme uç noktası yok
  r = await yon("PUT", "/api/admin/veri/users/" + o.uid, { degisiklikler: { durum: "askida" } });
  assert.equal(r.durum, 200);
  assert.equal((await o.c("GET", "/api/me")).durum, 401);
  const yid = db().prepare("SELECT id FROM users WHERE eposta = 'yon@ornek.com'").get().id;
  assert.equal((await yon("PUT", "/api/admin/veri/users/" + yid, { degisiklikler: { rol: "ogrenci" } })).durum, 400);
  assert.equal((await yon("DELETE", "/api/admin/veri/users/" + o.uid)).durum, 405);

  // CSV: UTF-8 BOM, ; ayraç, gizli sütun maskeli, formül enjeksiyonu önlenir
  db().prepare("UPDATE users SET soyad = '=HYPERLINK(1)' WHERE id = ?").run(o.uid);
  const csv = await fetch(base + "/api/admin/veri/users.csv?q=veri@ornek", { headers: { Cookie: await yonCerez() } });
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get("content-type"), /text\/csv/);
  const ham = Buffer.from(await csv.arrayBuffer());
  assert.deepEqual([...ham.slice(0, 3)], [0xef, 0xbb, 0xbf], "UTF-8 BOM");
  const metin = ham.toString("utf8");
  assert.match(metin, /id;public_id;eposta/);
  assert.match(metin, /••••/);
  assert.match(metin, /'=HYPERLINK\(1\)/);
  assert.ok(!metin.includes("scrypt$"));
  assert.ok(db().prepare("SELECT 1 FROM audit_log WHERE eylem = 'veri.disa-aktar'").get());
});
async function yonCerez() {
  const r = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-Meberra": "1" }, body: JSON.stringify({ kimlik: "yon@ornek.com", sifre: "Yonetici-12345" }) });
  return /meberra_sid=[^;]*/.exec(r.headers.get("set-cookie"))[0];
}

// ---------------------------------------------------------------------------------
test("Soru-cevap: ücretsiz ayda 3 soru, Premium sınırsız; yönetici yanıtı bildirim oluşturur", async () => {
  const yon = await yonetici();
  const o = await ogrenci("soru@ornek.com");
  let r = await o.c("GET", "/api/sorular");
  assert.deepEqual(r.govde.hak, { sinirsiz: false, limit: 3, kullanilan: 0, kalan: 3, donem: r.govde.hak.donem });
  assert.equal((await o.c("POST", "/api/sorular", { metin: "   " })).durum, 400);
  assert.equal((await o.c("POST", "/api/sorular", { metin: "x".repeat(2001) })).durum, 400);
  assert.equal((await o.c("POST", "/api/sorular", { metin: "a", baglam: { x: "y".repeat(9000) } })).durum, 413);

  const baglam = { soru: "lim x→0 sin x / x = ?", secenekler: ["0", "1", "∞"], ogrenciCevabi: "0", dogruCevap: "1" };
  r = await o.c("POST", "/api/sorular", { metin: "Bu sorunun çözümünü anlamadım.", sayfa: "ap-calculus", soruRef: "calc-unit1|q3", baglam });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.hak.kalan, 2);
  assert.deepEqual(r.govde.soru.baglam, baglam);
  const ilkId = r.govde.soru.id;
  await o.c("POST", "/api/sorular", { metin: "İkinci soru" });
  await o.c("POST", "/api/sorular", { metin: "Üçüncü soru" });
  r = await o.c("POST", "/api/sorular", { metin: "Dördüncü soru" });
  assert.equal(r.durum, 402);
  assert.equal(r.govde.kalan, 0);
  assert.equal(r.govde.premiumGerekli, true);
  // Takip mesajı hak tüketmez
  r = await o.c("POST", "/api/sorular/" + ilkId + "/mesaj", { metin: "Ek olarak: 2. adımı da anlamadım." });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.soru.mesajlar.length, 2);

  // Başkası göremez
  const b = await ogrenci("soru2@ornek.com");
  assert.equal((await b.c("GET", "/api/sorular/" + ilkId)).durum, 404);
  assert.equal((await b.c("POST", "/api/sorular/" + ilkId + "/mesaj", { metin: "x" })).durum, 404);

  // Premium sınırsız
  app.hesap.premiumVer(b.uid, "aylik", null, { kaynak: "elle" });
  for (let i = 0; i < 4; i++) assert.equal((await b.c("POST", "/api/sorular", { metin: "Premium soru " + i })).durum, 200);
  assert.equal((await b.c("GET", "/api/sorular")).govde.hak.sinirsiz, true);

  // Yönetici: liste, istatistik, yanıt → bildirim (+ e-posta tercihi açıksa e-posta)
  assert.ok((await yon("GET", "/api/admin/stats")).govde.soru.bekleyen >= 7);
  r = await yon("GET", "/api/admin/sorular?durum=bekliyor");
  assert.ok(r.govde.sorular.some(s => s.id === ilkId && s.kullanici.eposta === "soru@ornek.com"));
  await o.c("PUT", "/api/bildirim-ayarlari", { epostaBildirim: true });
  r = await yon("POST", "/api/admin/sorular/" + ilkId + "/yanit", { metin: "sin x / x ifadesi 0'a yaklaşırken 1'e gider. Birim çemberi düşün." });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.soru.durum, "cevaplandi");
  const bl = (await o.c("GET", "/api/bildirimler")).govde;
  assert.equal(bl.okunmamis, 1);
  assert.equal(bl.bildirimler[0].tur, "soru-yanit");
  assert.match(bl.bildirimler[0].link, /^\/sorularim\?soru=\d+/);
  const ileti = db().prepare("SELECT * FROM email_outbox WHERE alici = 'soru@ornek.com' ORDER BY id DESC").get();
  assert.equal(ileti.konu, "Meberra: sorun yanıtlandı");
  assert.match(ileti.metin, /bildirim-iptal\?tur=yanit&t=/, "tek tıkla iptal bağlantısı");
  assert.equal((await o.c("GET", "/api/sorular")).govde.sorular.find(s => s.id === ilkId).okunmamis, 1);
  r = await o.c("GET", "/api/sorular/" + ilkId);
  assert.equal(r.govde.soru.mesajlar[2].yazan, "Meberra ekibi", "yönetici adı öğrenciye gösterilmez");
  assert.equal((await o.c("GET", "/api/sorular")).govde.sorular.find(s => s.id === ilkId).okunmamis, 0, "açınca okundu");

  // Takip yeniden açar; kapatılan soruya yazılamaz
  await o.c("POST", "/api/sorular/" + ilkId + "/mesaj", { metin: "Teşekkürler, bir sorum daha var." });
  assert.equal(db().prepare("SELECT durum FROM questions WHERE id = ?").get(ilkId).durum, "bekliyor");
  assert.equal((await yon("POST", "/api/admin/sorular/" + ilkId + "/durum", { durum: "kapandi" })).durum, 200);
  assert.equal((await o.c("POST", "/api/sorular/" + ilkId + "/mesaj", { metin: "x" })).durum, 409);

  // SSS
  r = await yon("POST", "/api/admin/sss", { soru: "lim sin x / x neden 1?", cevap: "Birim çember ve sıkıştırma teoremiyle.", sayfa: "ap-calculus", kaynakSoruId: ilkId });
  assert.equal(r.durum, 200);
  await yon("POST", "/api/admin/sss", { soru: "Genel soru?", cevap: "Genel cevap." });
  r = await istemci()("GET", "/api/public/sss?sayfa=ap-calculus");
  assert.deepEqual(r.govde.sss.map(x => x.soru), ["lim sin x / x neden 1?", "Genel soru?"], "sayfaya özel önce, sonra genel");
  assert.equal((await istemci()("GET", "/api/public/sss?sayfa=ap-physics")).govde.sss.length, 1);
  assert.equal((await yon("GET", "/api/admin/sorular/" + ilkId)).govde.soru.sss.length, 1);
});

// ---------------------------------------------------------------------------------
test("Bildirimler: liste, okunmamış sayısı, okundu işaretleme, sayfalama", async () => {
  const o = await ogrenci("bildirim@ornek.com");
  for (let i = 0; i < 33; i++) app.bildirim.olustur(o.uid, { tur: "duyuru", baslik: "B" + i, metin: "m", link: "/x.html" });
  let r = (await o.c("GET", "/api/bildirimler")).govde;
  assert.equal(r.bildirimler.length, 30);
  assert.equal(r.okunmamis, 33);
  assert.equal(r.dahaVar, true);
  assert.equal(r.bildirimler[0].baslik, "B32", "en yeni önce");
  const r2 = (await o.c("GET", "/api/bildirimler?once=" + r.bildirimler[29].id)).govde;
  assert.equal(r2.bildirimler.length, 3);
  assert.equal(r2.dahaVar, false);
  assert.equal((await o.c("POST", "/api/bildirimler/okundu", {})).durum, 400);
  r = (await o.c("POST", "/api/bildirimler/okundu", { ids: [r.bildirimler[0].id, r.bildirimler[1].id] })).govde;
  assert.equal(r.okunmamis, 31);
  const baska = await ogrenci("bildirim2@ornek.com");
  const id = (await o.c("GET", "/api/bildirimler")).govde.bildirimler[5].id;
  await baska.c("POST", "/api/bildirimler/okundu", { ids: [id] });
  assert.equal((await o.c("GET", "/api/bildirimler")).govde.okunmamis, 31, "başkasının bildirimi işaretlenemez");
  assert.equal((await o.c("POST", "/api/bildirimler/okundu", { hepsi: true })).govde.okunmamis, 0);
  // Dış bağlantı kabul edilmez
  const t = app.bildirim.olustur(o.uid, { tur: "duyuru", baslik: "x", link: "https://kotu.ornek.com" });
  assert.equal(db().prepare("SELECT link FROM notifications WHERE id = ?").get(t.id).link, null);
  assert.equal((await istemci()("GET", "/api/bildirimler")).durum, 401);
});

// ---------------------------------------------------------------------------------
test("Bildirim ayarları, veli onayı, tek tıkla iptal, push aboneliği (maskeli)", async () => {
  const yon = await yonetici();
  const o = await ogrenci("ayar@ornek.com");
  let r = (await o.c("GET", "/api/bildirim-ayarlari")).govde;
  assert.deepEqual(r.ayarlar, { epostaHatirlatma: false, push: false, epostaBildirim: false, hatirlatmaSaati: 19, veliRaporu: false, veliEposta: null, veliDogrulandi: false, pushAbonelik: 0 }, "varsayılan: hepsi kapalı");
  assert.deepEqual(r.sessizSaatler, { bas: 22, bit: 8 });
  assert.equal((await o.c("PUT", "/api/bildirim-ayarlari", { hatirlatmaSaati: 23 })).durum, 400, "sessiz saate ayarlanamaz");
  assert.equal((await o.c("PUT", "/api/bildirim-ayarlari", { hatirlatmaSaati: 7 })).durum, 400);
  assert.equal((await o.c("PUT", "/api/bildirim-ayarlari", { epostaHatirlatma: "evet" })).durum, 400);
  assert.equal((await o.c("PUT", "/api/bildirim-ayarlari", { veliRaporu: true })).durum, 400, "veli e-postası gerekli");
  assert.equal((await o.c("PUT", "/api/bildirim-ayarlari", { veliEposta: "ayar@ornek.com" })).durum, 400, "kendi adresi olamaz");
  r = await o.c("PUT", "/api/bildirim-ayarlari", { epostaHatirlatma: true, hatirlatmaSaati: 20, veliRaporu: true, veliEposta: "Veli@Ornek.com" });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.ayarlar.hatirlatmaSaati, 20);
  assert.equal(r.govde.ayarlar.veliEposta, "veli@ornek.com");
  assert.equal(r.govde.ayarlar.veliDogrulandi, false);
  const onay = db().prepare("SELECT metin FROM email_outbox WHERE alici = 'veli@ornek.com' ORDER BY id DESC").get().metin;
  const link = /\/api\/public\/veli\?t=[^\s&]+&islem=onay/.exec(onay)[0];
  let h = await istemci()("GET", link);
  assert.equal(h.durum, 200);
  assert.match(h.govde, /Teşekkürler/);
  assert.equal((await o.c("GET", "/api/bildirim-ayarlari")).govde.ayarlar.veliDogrulandi, true);
  assert.equal((await istemci()("GET", "/api/public/veli?t=yanlis&islem=onay")).durum, 404);

  // Tek tıkla iptal: oturumsuz, belirteçle
  const tok = db().prepare("SELECT iptal_belirtec FROM notification_prefs WHERE user_id = ?").get(o.uid).iptal_belirtec;
  h = await istemci()("GET", "/api/public/bildirim-iptal?tur=hatirlatma&t=" + encodeURIComponent(tok));
  assert.equal(h.durum, 200);
  assert.equal((await o.c("GET", "/api/bildirim-ayarlari")).govde.ayarlar.epostaHatirlatma, false);

  // Push
  assert.equal((await istemci()("GET", "/api/push/anahtar")).govde.publicKey, "BTestPublicKey");
  assert.equal((await o.c("POST", "/api/push/abone", { subscription: { endpoint: "http://duz.ornek.com/x", keys: abonelik(1).keys } })).durum, 400, "https zorunlu");
  assert.equal((await o.c("POST", "/api/push/abone", { subscription: { endpoint: "https://a.b/x", keys: { p256dh: "<", auth: "x" } } })).durum, 400);
  r = await o.c("POST", "/api/push/abone", { subscription: abonelik("ayar-1") });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.ayarlar.push, true, "abonelik push tercihini açar");
  assert.equal(r.govde.ayarlar.pushAbonelik, 1);
  const v = (await yon("GET", "/api/admin/veri/push_subscriptions?alan=user_id&deger=" + o.uid)).govde.satirlar[0];
  assert.equal(v.endpoint, "••••");
  assert.equal(v.p256dh, "••••");
  assert.equal(v.auth, "••••");
  const pref = (await yon("GET", "/api/admin/veri/notification_prefs?alan=user_id&deger=" + o.uid)).govde.satirlar[0];
  assert.equal(pref.iptal_belirtec, "••••");
  assert.equal(pref.veli_belirtec, "••••");
  r = await o.c("POST", "/api/push/iptal", { endpoint: abonelik("ayar-1").endpoint });
  assert.equal(r.govde.ayarlar.pushAbonelik, 0);
  assert.equal(r.govde.ayarlar.push, false, "son abonelik gidince push kapanır");
});

// ---------------------------------------------------------------------------------
test("Duyuru: hedef kitle (hepsi/premium/ücretsiz), push, ölü abonelik silinir", async () => {
  const yon = await yonetici();
  const p = await ogrenci("duyuru-p@ornek.com");
  const f = await ogrenci("duyuru-f@ornek.com");
  app.hesap.premiumVer(p.uid, "aylik", null, { kaynak: "elle" });
  await p.c("POST", "/api/push/abone", { subscription: abonelik("duyuru-p") });
  await f.c("POST", "/api/push/abone", { subscription: abonelik("duyuru-olu") });
  const ogr = await ogrenci("duyuru-o@ornek.com");
  assert.equal((await ogr.c("POST", "/api/admin/duyuru", { baslik: "x", metin: "y", hedef: "hepsi" })).durum, 403);
  assert.equal((await yon("POST", "/api/admin/duyuru", { baslik: "", metin: "", hedef: "kimse" })).durum, 400);
  assert.equal((await yon("POST", "/api/admin/duyuru", { baslik: "x", metin: "y", hedef: "hepsi", link: "https://kotu.com" })).durum, 400);

  const aktifSay = db().prepare("SELECT COUNT(*) AS n FROM users WHERE durum = 'aktif'").get().n;
  const premSay = db().prepare("SELECT COUNT(DISTINCT user_id) AS n FROM subscriptions s JOIN users u ON u.id = s.user_id WHERE s.durum = 'aktif' AND s.bitis > ? AND u.durum = 'aktif'").get(new Date().toISOString()).n;
  assert.equal((await yon("POST", "/api/admin/duyuru", { baslik: "onz", metin: "y", hedef: "hepsi", onizleme: true })).govde.alici, aktifSay);
  assert.equal((await yon("POST", "/api/admin/duyuru", { baslik: "onz", metin: "y", hedef: "ucretsiz", onizleme: true })).govde.alici, aktifSay - premSay);
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM notifications WHERE baslik = 'onz'").get().n, 0, "önizleme göndermez");

  pushlar.length = 0;
  let r = await yon("POST", "/api/admin/duyuru", { baslik: "Premium'a özel", metin: "Yeni denemeler eklendi.", link: "/sinavlar.html", hedef: "premium" });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.alici, premSay);
  assert.equal(r.govde.push, 1);
  assert.equal(pushlar[0].yuk.title, "Premium'a özel");
  assert.equal(pushlar[0].yuk.link, "/sinavlar.html");
  assert.equal((await p.c("GET", "/api/bildirimler")).govde.bildirimler[0].baslik, "Premium'a özel");
  assert.equal((await f.c("GET", "/api/bildirimler")).govde.bildirimler.filter(b => b.tur === "duyuru").length, 0, "ücretsiz kullanıcıya gitmez");

  pushHatasi = { parca: "duyuru-olu", kod: 410 };
  r = await yon("POST", "/api/admin/duyuru", { baslik: "Ücretsiz", metin: "Merhaba", hedef: "ucretsiz" });
  pushHatasi = null;
  assert.equal(r.govde.push, 0);
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM push_subscriptions WHERE user_id = ?").get(f.uid).n, 0, "410 alan abonelik silinir");
  assert.ok(db().prepare("SELECT 1 FROM audit_log WHERE eylem = 'duyuru.gonder'").get());

  // Sessiz saatte push gönderilmez (bildirim yine oluşur)
  saatMs = Date.parse("2026-10-21T20:00:00Z"); // 23:00 İstanbul
  pushlar.length = 0;
  r = await yon("POST", "/api/admin/duyuru", { baslik: "Gece", metin: "m", hedef: "premium" });
  saatMs = Date.parse("2026-10-21T10:00:00Z");
  assert.equal(r.govde.push, 0);
  assert.equal(pushlar.length, 0);
});

// ---------------------------------------------------------------------------------
test("Premium onayı öğrenciye bildirim oluşturur", async () => {
  const yon = await yonetici();
  const o = await ogrenci("prem-bildirim@ornek.com");
  const t = (await o.c("POST", "/api/premium/talep", { plan: "aylik", odeyenAd: "Ali" })).govde.talep.id;
  assert.equal((await yon("POST", "/api/admin/talepler/" + t, { islem: "onayla" })).durum, 200);
  const b = (await o.c("GET", "/api/bildirimler")).govde.bildirimler;
  assert.equal(b[0].tur, "premium");
});

// ---------------------------------------------------------------------------------
test("Zamanlayıcı: günde en fazla 1, sessiz saat, açık rıza, seri dondurma, tekrar, veli raporu", async () => {
  const pl = [];
  const z = olustur({ dbDosya: ":memory:", yoneticiAtla: true, vapid, pushGonderici: async (a, y) => { pl.push(JSON.parse(y)); } });
  const D = z.db;
  const kul = (ep, ayar) => {
    const u = z.hesap.kayit(kayitBilgi(ep, "Deniz")).kullanici;
    if (ayar) z.bildirim.ayarKaydet(u, ayar, null);
    return u;
  };
  const cevap = (u, iso) => D.prepare("INSERT INTO answers (user_id, sayfa, unite, soru, secim, dogru, zaman) VALUES (?, 'ap-calculus', 'u1', ?, 'A', 1, ?)").run(u.id, "q" + Math.random(), iso);
  const durum = (u, anahtar, deger) => D.prepare("INSERT INTO user_state (user_id, anahtar, deger, guncelleme) VALUES (?, ?, ?, ?)").run(u.id, anahtar, JSON.stringify(deger), new Date().toISOString());
  const SAAT = iso => Date.parse(iso);
  // Çarşamba 21 Ekim 2026; 19:05 İstanbul = 16:05Z
  const u1 = kul("z1@ornek.com", { epostaHatirlatma: true, hatirlatmaSaati: 19 });
  cevap(u1, "2026-10-20T10:00:00.000Z"); cevap(u1, "2026-10-19T10:00:00.000Z");
  z.bildirim.abone(u1, abonelik("z1"), null);
  const u2 = kul("z2@ornek.com", { epostaHatirlatma: true, hatirlatmaSaati: 19 }); // bugün donmuş
  cevap(u2, "2026-10-20T10:00:00.000Z");
  durum(u2, "apmeberra:seri:v1", { donmus: ["2026-10-21"] });
  const u3 = kul("z3@ornek.com"); // rıza yok
  cevap(u3, "2026-10-20T10:00:00.000Z");
  const u4 = kul("z4@ornek.com", { epostaHatirlatma: true, hatirlatmaSaati: 20 }); // saati gelmedi
  cevap(u4, "2026-10-20T10:00:00.000Z");
  const u5 = kul("z5@ornek.com", { epostaHatirlatma: true, hatirlatmaSaati: 8 }); // bugün zaten çalıştı
  cevap(u5, "2026-10-20T10:00:00.000Z"); cevap(u5, "2026-10-21T06:00:00.000Z");
  const u6 = kul("z6@ornek.com", { epostaHatirlatma: true, hatirlatmaSaati: 9 }); // seri yok, tekrar zamanı gelmiş 2 soru
  durum(u6, "apmeberra:tekrar:v1", { "ap-calculus|q1": { kutu: 2, sonraki: "2026-10-20", guncelleme: 1 }, "ap-calculus|q2": { kutu: 1, sonraki: "2026-10-21", guncelleme: 1 }, "ap-calculus|q3": { kutu: 3, sonraki: "2026-10-30", guncelleme: 1 }, "ap-calculus|q4": { kutu: 1, sonraki: "2026-10-01", silindi: true, guncelleme: 2 } });
  const u7 = kul("z7@ornek.com", { epostaHatirlatma: true, hatirlatmaSaati: 9 }); // seri dondurulmuş dün: seri bozulmaz
  cevap(u7, "2026-10-19T10:00:00.000Z");
  durum(u7, "apmeberra:seri:v1", { donmus: ["2026-10-20"] });

  const bildirimSay = u => D.prepare("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND tur IN ('seri', 'tekrar')").get(u.id).n;

  // Sessiz saat (07:30 İstanbul): hiçbir şey gitmez
  assert.equal((await z.zamanlayici.tik(SAAT("2026-10-21T04:30:00Z"))).hatirlatma, 0);
  let s = await z.zamanlayici.tik(SAAT("2026-10-21T16:05:00Z"));
  assert.equal(s.hatirlatma, 3, "u1, u6, u7");
  assert.equal(bildirimSay(u1), 1);
  assert.equal(bildirimSay(u2), 0, "bugün donmuş");
  assert.equal(bildirimSay(u3), 0, "rıza yok");
  assert.equal(bildirimSay(u4), 0, "saati gelmedi");
  assert.equal(bildirimSay(u5), 0, "bugün çalıştı");
  const b1 = D.prepare("SELECT * FROM notifications WHERE user_id = ?").get(u1.id);
  assert.equal(b1.tur, "seri");
  assert.match(b1.metin, /2 günlük serin/);
  assert.ok(!/kaybet|üzül|hayal kırıklığı/i.test(b1.metin), "suçlayıcı dil yok");
  const b6 = D.prepare("SELECT * FROM notifications WHERE user_id = ?").get(u6.id);
  assert.equal(b6.tur, "tekrar");
  assert.match(b6.metin, /2 soru/);
  assert.match(D.prepare("SELECT metin FROM notifications WHERE user_id = ?").get(u7.id).metin, /1 günlük serin/);
  assert.equal(pl.length, 1, "push yalnızca abone olan u1'e");
  const ep = D.prepare("SELECT * FROM email_outbox WHERE alici = 'z1@ornek.com' AND konu LIKE 'Meberra: %' ORDER BY id DESC").get();
  assert.match(ep.metin, /bildirim-iptal\?tur=hatirlatma&t=/);

  // Aynı gün tekrar: gitmez (u4'ün saati geldi → yalnızca u4)
  s = await z.zamanlayici.tik(SAAT("2026-10-21T17:05:00Z"));
  assert.equal(s.hatirlatma, 1);
  assert.equal(bildirimSay(u1), 1);
  assert.equal(bildirimSay(u4), 1);
  s = await z.zamanlayici.tik(SAAT("2026-10-21T18:55:00Z"));
  assert.equal(s.hatirlatma, 0, "günde en fazla 1");
  // 22:00 sonrası (sessiz) — u3 rıza verse bile gitmez
  z.bildirim.ayarKaydet(u3, { push: true }, null);
  assert.equal((await z.zamanlayici.tik(SAAT("2026-10-21T19:30:00Z"))).hatirlatma, 0);
  // Ertesi gün: u1 dün (21'i) çalışmadı → seri bitti, hatırlatma yok (ısrar yok)
  s = await z.zamanlayici.tik(SAAT("2026-10-22T16:05:00Z"));
  assert.equal(bildirimSay(u1), 1);
  assert.equal(D.prepare("SELECT COUNT(*) AS n FROM reminder_log WHERE user_id = ? AND tur = 'hatirlatma'").get(u1.id).n, 1);

  // Veli raporu: pazar 18:00 sonrası, yalnızca onaylı veli adresine, haftada bir
  z.bildirim.ayarKaydet(u1, { veliRaporu: true, veliEposta: "veli1@ornek.com" }, null);
  const tok = D.prepare("SELECT veli_belirtec FROM notification_prefs WHERE user_id = ?").get(u1.id).veli_belirtec;
  cevap(u1, "2026-10-24T10:00:00.000Z");
  assert.equal((await z.zamanlayici.tik(SAAT("2026-10-25T15:30:00Z"))).veliRaporu, 0, "onaysız veliye gitmez");
  z.bildirim.veliIslem(tok, "onay");
  assert.equal((await z.zamanlayici.tik(SAAT("2026-10-25T14:30:00Z"))).veliRaporu, 0, "17:30: henüz değil");
  assert.equal((await z.zamanlayici.tik(SAAT("2026-10-25T15:30:00Z"))).veliRaporu, 1);
  assert.equal((await z.zamanlayici.tik(SAAT("2026-10-25T16:30:00Z"))).veliRaporu, 0);
  const rapor = D.prepare("SELECT * FROM email_outbox WHERE alici = 'veli1@ornek.com' AND konu LIKE '%haftalık çalışma özeti%'").get();
  assert.match(rapor.metin, /bu hafta Meberra'da 3 soru çözdü \(doğruluk %100\)/);
  assert.match(rapor.metin, /islem=iptal/);
  z.db.close();
});

// ---------------------------------------------------------------------------------
test("Lig: katılım, takma ad denetimi, sıralama gizliliği", async () => {
  const a = await ogrenci("lig-a@ornek.com", "Gizliadli");
  const b = await ogrenci("lig-b@ornek.com");
  let r = await a.c("GET", "/api/lig");
  assert.equal(r.govde.katildi, false);
  assert.deepEqual(r.govde.kurallar.xp, { soru: 5, dogru: 5, deneme: 50 });
  for (const ad of ["ab", "a b c", "x".repeat(21), "<script>", "orospu_1", "amk", "Amk_42", "F_U_C_K", "fuuuck", "s1kt1r", "meberra_admin"]) {
    assert.equal((await a.c("POST", "/api/lig/katil", { takmaAd: ad })).durum, 400, ad);
  }
  r = await a.c("POST", "/api/lig/katil", { takmaAd: "Çağrı_12" });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.katildi, true);
  assert.equal(r.govde.uye.kademeAd, "Bronz");
  assert.equal((await b.c("POST", "/api/lig/katil", { takmaAd: "çAĞRI_12" })).durum, 409, "büyük/küçük harf duyarsız benzersiz");
  assert.equal((await b.c("POST", "/api/lig/katil", { takmaAd: "Kemal_x" })).durum, 200);
  db().prepare("INSERT INTO answers (user_id, sayfa, unite, soru, secim, dogru, zaman) VALUES (?, 'ap-physics', 'u', 'q1', 'A', 1, ?)").run(a.uid, new Date().toISOString());
  r = await b.c("GET", "/api/lig");
  const metin = JSON.stringify(r.govde);
  assert.ok(!metin.includes("@ornek.com") && !metin.includes("Gizliadli") && !metin.includes(a.pid), "gerçek ad/e-posta/kimlik yok");
  assert.ok(r.govde.grup.siralama.every(s => Object.keys(s).sort().join() === "ben,sira,takmaAd,xp"));
  const ilk = r.govde.grup.siralama[0];
  assert.equal(ilk.takmaAd, "Çağrı_12");
  assert.equal(ilk.xp, 10, "cevap 5 + doğru 5");
  assert.ok(r.govde.kalanSn > 0);

  // Yönetici gizler → diğerleri "Gizli üye" görür; öğrenci yeni ad seçince açılır
  const yon = await yonetici();
  assert.equal((await yon("PUT", "/api/admin/veri/lig_uyeleri/" + a.uid, { degisiklikler: { takma_ad: "s1kt1r" } })).durum, 400);
  assert.equal((await yon("PUT", "/api/admin/veri/lig_uyeleri/" + a.uid, { degisiklikler: { takma_ad: "Kemal_X" } })).durum, 409);
  assert.equal((await yon("PUT", "/api/admin/veri/lig_uyeleri/" + a.uid, { degisiklikler: { durum: "gizli" } })).durum, 200);
  assert.equal((await b.c("GET", "/api/lig")).govde.grup.siralama.find(s => s.xp === 10).takmaAd, "Gizli üye");
  assert.ok((await a.c("GET", "/api/lig")).govde.uye.uyari);
  const ad = (await yon("GET", "/api/admin/lig")).govde;
  assert.ok(ad.gruplar[0].uyeler.some(u => u.ad === "Gizliadli"), "yönetici gerçek adı görür");
  r = await a.c("POST", "/api/lig/katil", { takmaAd: "Yeni_Ad" });
  assert.equal(r.govde.uye.durum, "aktif");
  r = await a.c("POST", "/api/lig/ayril");
  assert.equal(r.govde.katildi, false);
  assert.equal((await b.c("GET", "/api/lig")).govde.grup.siralama.length, 1, "ayrılan sıralamada görünmez");
  assert.equal((await a.c("POST", "/api/lig/ayril")).durum, 409);
});

test("Lig: hafta devri — ilk 5 yükselir, son 5 düşer, bir kez uygulanır", async () => {
  const z = olustur({ dbDosya: ":memory:", yoneticiAtla: true, vapid, pushGonderici: async () => {} });
  const D = z.db;
  const W = Date.parse("2026-10-21T10:00:00Z"), SONRAKI = Date.parse("2026-10-27T10:00:00Z");
  const uyeler = [];
  for (let i = 0; i < 12; i++) {
    const u = z.hesap.kayit(kayitBilgi("lig" + i + "@ornek.com")).kullanici;
    z.lig.katil(u, "oyuncu_" + i, null, W);
    uyeler.push(u);
  }
  D.prepare("UPDATE lig_uyeleri SET kademe = 2").run();
  D.prepare("DELETE FROM lig_haftalik").run(); // kademe 2'de yeniden yerleşsinler
  const d = z.lig.durum(uyeler[0], W);
  assert.equal(d.grup.uyeSayisi, 12);
  assert.equal(d.grup.kademeAd, "Gümüş");
  // i. kullanıcı i soru çözer (hepsi doğru): xp = 10*i; 11. kullanıcı ayrıca deneme bitirir
  uyeler.forEach((u, i) => { for (let k = 0; k < i; k++) D.prepare("INSERT INTO answers (user_id, sayfa, unite, soru, secim, dogru, zaman) VALUES (?, 'p', 'u', ?, 'A', 1, ?)").run(u.id, "q" + k, "2026-10-2" + (k % 3) + "T09:00:00.000Z"); });
  D.prepare("INSERT INTO exams (user_id, istemci_id, tarih) VALUES (?, 'd1', '2026-10-22T09:00:00.000Z')").run(uyeler[11].id);
  D.prepare("INSERT INTO answers (user_id, sayfa, unite, soru, secim, dogru, zaman) VALUES (?, 'p', 'u', 'gec', 'A', 1, '2026-10-26T09:00:00.000Z')").run(uyeler[0].id); // sonraki hafta: sayılmaz
  assert.equal(z.lig.durum(uyeler[11], W).benimXp, 160);

  const s = await z.zamanlayici.tik(SONRAKI);
  assert.ok(s.lig > 0);
  const kademe = i => D.prepare("SELECT kademe FROM lig_uyeleri WHERE user_id = ?").get(uyeler[i].id).kademe;
  assert.deepEqual(uyeler.map((u, i) => kademe(i)), [1, 1, 1, 1, 1, 2, 2, 3, 3, 3, 3, 3]);
  const n = D.prepare("SELECT * FROM notifications WHERE user_id = ? AND tur = 'lig'").all(uyeler[11].id);
  assert.equal(n.length, 1);
  assert.match(n[0].baslik, /Altın ligine yükseldin/);
  assert.match(D.prepare("SELECT baslik FROM notifications WHERE user_id = ? AND tur = 'lig'").get(uyeler[0].id).baslik, /Yeni hafta/);
  assert.equal(D.prepare("SELECT xp FROM lig_haftalik WHERE user_id = ? AND hafta = '2026-W43'").get(uyeler[0].id).xp, 0);
  // Tekrar çağrı: değişiklik yok
  await z.zamanlayici.tik(SONRAKI + 3600e3);
  z.lig.devir(SONRAKI);
  assert.equal(D.prepare("SELECT COUNT(*) AS n FROM notifications WHERE tur = 'lig'").get().n, 12);
  assert.equal(kademe(11), 3);
  const yeni = z.lig.durum(uyeler[11], SONRAKI);
  assert.equal(yeni.hafta, "2026-W44");
  assert.equal(yeni.grup.kademeAd, "Altın");
  assert.equal(yeni.sonSonuc.sonuc, "yukseldi");

  // 10'dan küçük grupta yükselme/düşme yok
  const k = z.hesap.kayit(kayitBilgi("kucuk@ornek.com")).kullanici;
  D.prepare("INSERT INTO answers (user_id, sayfa, unite, soru, secim, dogru, zaman) VALUES (?, 'p', 'u', 'k', 'A', 1, '2026-11-03T09:00:00.000Z')").run(k.id);
  z.lig.katil(k, "tek_basina", null, Date.parse("2026-11-03T10:00:00Z"));
  z.lig.devir(Date.parse("2026-11-10T10:00:00Z"));
  assert.equal(D.prepare("SELECT kademe FROM lig_uyeleri WHERE user_id = ?").get(k.id).kademe, 1);
  z.db.close();
});

// ---------------------------------------------------------------------------------
test("Senkron: seri, tekrar ve oyun anahtarları birleşir", async () => {
  assert.deepEqual(seriBirlestir({ donmus: ["2026-10-01", "2026-10-05"], hakKullanim: { "2026-W40": 1 } }, { donmus: ["2026-10-03", "bozuk", "2026-10-01"], hakKullanim: { "2026-W40": 0, "2026-W41": 2 } }),
    { donmus: ["2026-10-01", "2026-10-03", "2026-10-05"], hakKullanim: { "2026-W40": 1, "2026-W41": 2 } });
  assert.deepEqual(tekrarBirlestir({ a: { kutu: 2, sonraki: "2026-10-10", guncelleme: 100 }, b: { kutu: 1, guncelleme: 300 } }, { a: { kutu: 3, sonraki: "2026-10-20", guncelleme: 200 }, b: { kutu: 4, guncelleme: 50 }, c: { kutu: 1, guncelleme: 1 } }),
    { a: { kutu: 3, sonraki: "2026-10-20", guncelleme: 200 }, b: { kutu: 1, guncelleme: 300 }, c: { kutu: 1, guncelleme: 1 } });
  const o = oyunBirlestir(
    { xp: 120, rozetler: { ilk: { t: 50 }, seri7: { t: 900 } }, gorevler: { "2026-10-20": { g1: { tamam: true, t: 10 }, g2: { tamam: false } } }, hedef: { tur: "soru", miktar: 10 } },
    { xp: 80, rozetler: { ilk: { t: 70 }, yeni: { t: 5 } }, gorevler: { "2026-10-20": { g1: { tamam: false }, g2: { tamam: true, t: 30 } }, "2026-10-21": { g1: { tamam: false } } }, hedef: { tur: "soru", miktar: 20 } });
  assert.equal(o.xp, 120);
  assert.deepEqual(o.rozetler, { ilk: { t: 50 }, seri7: { t: 900 }, yeni: { t: 5 } });
  assert.deepEqual(o.gorevler["2026-10-20"], { g1: { tamam: true, t: 10 }, g2: { tamam: true, t: 30 } });
  assert.ok(o.gorevler["2026-10-21"]);
  assert.deepEqual(o.hedef, { tur: "soru", miktar: 20 }, "hedef: son yazan");

  const c = (await ogrenci("senkron-yeni@ornek.com")).c;
  await c("PUT", "/api/state", { degisiklikler: { "apmeberra:oyun:v1": JSON.stringify({ xp: 300, rozetler: {}, gorevler: {}, hedef: null }) } });
  const r = await c("PUT", "/api/state", { degisiklikler: { "apmeberra:oyun:v1": JSON.stringify({ xp: 10, rozetler: { a: { t: 1 } }, gorevler: {}, hedef: { tur: "soru", miktar: 5 } }) } });
  const s = JSON.parse(r.govde.birlesen["apmeberra:oyun:v1"]);
  assert.equal(s.xp, 300);
  assert.ok(s.rozetler.a);
});

// ---------------------------------------------------------------------------------
test("PWA: sw.js ve manifest sunulur, CSP worker-src içerir; hesap silme yeni verileri de siler", async () => {
  const c = istemci();
  const sw = await c("GET", "/sw.js");
  assert.equal(sw.durum, 200);
  assert.match(sw.basliklar.get("cache-control"), /no-cache/);
  assert.match(sw.basliklar.get("content-security-policy"), /worker-src 'self'/);
  assert.match(sw.govde, /addEventListener\("push"/);
  const m = await fetch(base + "/manifest.webmanifest");
  assert.equal(m.status, 200);
  const man = await m.json();
  assert.equal(man.theme_color, "#5B3DF5");
  assert.ok(man.icons.some(i => i.purpose === "maskable"));
  for (const i of man.icons) assert.equal((await fetch(base + "/" + i.src.replace(/^\//, ""))).status, 200, i.src);
  assert.equal((await c("GET", "/server.js")).durum, 404);
  assert.equal((await c("GET", "/araclar/testler/admin-arayuz-test.html")).durum, 404);

  const o = await ogrenci("silinecek-yeni@ornek.com");
  await o.c("POST", "/api/sorular", { metin: "Silinecek soru" });
  await o.c("POST", "/api/lig/katil", { takmaAd: "silinecek_1" });
  await o.c("POST", "/api/push/abone", { subscription: abonelik("silinecek") });
  const ex = (await o.c("GET", "/api/account/export")).govde;
  assert.equal(ex.sorular.length, 1);
  assert.equal(ex.lig[0].takma_ad, "silinecek_1");
  assert.equal((await o.c("POST", "/api/account/delete", { sifre: "Deneme-12345" })).durum, 200);
  for (const t of ["questions", "notification_prefs", "push_subscriptions", "lig_uyeleri", "lig_haftalik", "notifications"])
    assert.equal(db().prepare("SELECT COUNT(*) AS n FROM " + t + " WHERE user_id = ?").get(o.uid).n, 0, t);
});
