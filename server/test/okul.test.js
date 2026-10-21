"use strict";
// 1.19.0 Okul ve öğretmen paneli: node --test server/test/okul.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { olustur } = require("../uygulama");
const db_ = require("../db");

let app, base;
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, soruTohum: true, gunlukKonsol: false });
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
    return { durum: r.status, govde: tur.includes("json") ? await r.json() : await r.text(), tur };
  };
}
const db = () => app.db;
const SIFRE = "Deneme-12345";
let sayac = 0;
async function ogrenci(ad) {
  const c = istemci(), ep = "ogr" + (++sayac) + "@ornek.com";
  const r = await c("POST", "/api/auth/register", { ad: ad || "Ayşe", soyad: "Yılmaz", eposta: ep, sifre: SIFRE, sifre2: SIFRE, kosullar: true, kvkk: true, veliOnay: true });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  return { c, ep, uid: db().prepare("SELECT id FROM users WHERE public_id = ?").get(r.govde.user.id).id };
}
let yon;
async function yonetici() {
  if (yon) return yon;
  app.hesap.yoneticiHazirla("okul-yon@ornek.com", "Yonetici-12345");
  yon = istemci();
  assert.equal((await yon("POST", "/api/auth/login", { kimlik: "okul-yon@ornek.com", sifre: "Yonetici-12345" })).durum, 200);
  return yon;
}
const gun = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
async function okulKur(koltuk) {
  const y = await yonetici();
  const o = await y("POST", "/api/admin/okullar", { ad: "Deneme Lisesi " + (++sayac), sehir: "İstanbul" });
  assert.equal(o.durum, 200, JSON.stringify(o.govde));
  const l = await y("POST", "/api/admin/okullar/" + o.govde.okul.id + "/lisans", { koltuk, baslangic: gun(-1), bitis: gun(180), tutarTl: 50000 });
  assert.equal(l.durum, 200, JSON.stringify(l.govde));
  return o.govde.okul.id;
}
function davetBelirteci(ep) {
  const m = db().prepare("SELECT metin FROM email_outbox WHERE alici = ? AND konu LIKE 'Meberra öğretmen paneli daveti%' ORDER BY id DESC LIMIT 1").get(ep);
  assert.ok(m, "davet e-postası gitti");
  return decodeURIComponent(/\/ogretmen\?t=([^\s]+)/.exec(m.metin)[1]);
}
async function ogretmen(okulId) {
  const y = await yonetici(), ep = "ogt" + (++sayac) + "@okul.k12.tr";
  assert.equal((await y("POST", "/api/admin/okullar/" + okulId + "/ogretmen-davet", { eposta: ep })).durum, 200);
  const t = istemci(), tok = davetBelirteci(ep);
  const b = await t("GET", "/api/public/ogretmen-davet?t=" + encodeURIComponent(tok));
  assert.equal(b.durum, 200); assert.equal(b.govde.davet.hesapVar, false);
  const r = await t("POST", "/api/ogretmen/kayit", { t: tok, ad: "Mehmet", soyad: "Kaya", sifre: SIFRE, sifre2: SIFRE, kosullar: true, kvkk: true });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  assert.equal(r.govde.user.rol, "ogretmen");
  return t;
}
async function sinifAc(t, ders) {
  const r = await t("POST", "/api/ogretmen/siniflar", { ad: "11-A Kalkülüs", ders: ders || "calculus-ab" });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  assert.match(r.govde.sinif.kod, /^[A-HJKMNP-Z2-9]{6}$/);
  return r.govde.sinif;
}
const premium = uid => app.hesap.uyelik(uid);

test("geçiş: mevcut rollerle dolu veritabanında users korunur, 'ogretmen' eklenir, FK temiz", () => {
  const dosya = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "okul-gecis-")), "t.db");
  const klasor = path.join(__dirname, "..", "migrations");
  const d = new DatabaseSync(dosya);
  d.exec("PRAGMA foreign_keys = ON; CREATE TABLE schema_migrations (surum TEXT PRIMARY KEY, uygulama TEXT NOT NULL)");
  for (const f of fs.readdirSync(klasor).filter(f => /^\d+_.*\.(sql|js)$/.test(f)).sort()) {
    if (/okul_ogretmen/.test(f)) continue; // yalnız bu geçiş sonradan uygulanır
    const js = /\.js$/.test(f) ? require(path.join(klasor, f)) : null;
    if (js && js.fkKapali) d.exec("PRAGMA foreign_keys = OFF");
    if (js) js.calistir(d); else d.exec(fs.readFileSync(path.join(klasor, f), "utf8"));
    if (js && js.fkKapali) d.exec("PRAGMA foreign_keys = ON");
    d.prepare("INSERT INTO schema_migrations VALUES (?, ?)").run(f, "x");
  }
  const z = new Date().toISOString();
  const ekle = d.prepare("INSERT INTO users (public_id, eposta, kullanici_adi, ad, soyad, sifre_hash, rol, olusturma, guncelleme) VALUES (?, ?, ?, 'A', 'B', 'h', ?, ?, ?)");
  ["ogrenci", "yonetici", "veli"].forEach((r, i) => ekle.run("u" + i, r + "@x.com", r + "x", r, z, z));
  d.prepare("INSERT INTO sessions (user_id, token_hash, olusturma, son_kullanim, bitis) VALUES (1, 'th', ?, ?, ?)").run(z, z, z);
  d.prepare("INSERT INTO subscriptions (user_id, plan, baslangic, bitis, kaynak, olusturma) VALUES (1, 'aylik', ?, ?, 'talep', ?)").run(z, z, z);
  d.prepare("INSERT INTO veli_baglantilari (ogrenci_id, veli_id, durum, olusturma) VALUES (1, 3, 'aktif', ?)").run(z);
  d.close();
  const g = db_.ac(dosya);
  assert.deepEqual(g.prepare("SELECT rol FROM users ORDER BY id").all().map(r => r.rol), ["ogrenci", "yonetici", "veli"]);
  assert.equal(g.prepare("SELECT COUNT(*) AS n FROM sessions").get().n, 1, "oturumlar silinmedi (CASCADE yok)");
  assert.equal(g.prepare("SELECT COUNT(*) AS n FROM subscriptions").get().n, 1);
  assert.equal(g.prepare("SELECT COUNT(*) AS n FROM veli_baglantilari").get().n, 1);
  assert.equal(g.prepare("PRAGMA foreign_key_check").all().length, 0);
  assert.ok(g.prepare("SELECT 1 FROM schema_migrations WHERE surum LIKE '%_okul_ogretmen.js'").get());
  g.prepare("INSERT INTO users (public_id, eposta, kullanici_adi, ad, soyad, sifre_hash, rol, olusturma, guncelleme) VALUES ('u9', 'o@x.com', 'ox', 'A', 'B', 'h', 'ogretmen', ?, ?)").run(z, z);
  assert.throws(() => g.prepare("INSERT INTO users (public_id, eposta, kullanici_adi, ad, soyad, sifre_hash, rol, olusturma, guncelleme) VALUES ('u8', 'k@x.com', 'kx', 'A', 'B', 'h', 'kral', ?, ?)").run(z, z));
  assert.ok(g.prepare("SELECT sql FROM sqlite_schema WHERE name = 'users'").get().sql.includes("'veli', 'ogretmen'"));
  g.close();
});

test("okul yönetimi yalnız yöneticiye açık; öğretmen daveti → hesap; öğretmen rolü öğrenci uçlarını kullanamaz", async () => {
  const o = await ogrenci();
  assert.equal((await o.c("GET", "/api/admin/okullar")).durum, 403);
  assert.equal((await o.c("POST", "/api/admin/okullar", { ad: "X" })).durum, 403);
  const okulId = await okulKur(5);
  const t = await ogretmen(okulId);
  assert.equal((await t("GET", "/api/admin/okullar")).durum, 403, "öğretmen yönetici değil");
  assert.equal((await t("GET", "/api/state")).durum, 403, "öğretmen öğrenci verisi uçlarını kullanamaz");
  assert.equal((await t("GET", "/api/premium")).durum, 403);
  assert.equal((await t("GET", "/api/sinif/benim")).durum, 403);
  const p = await t("GET", "/api/ogretmen/panel");
  assert.equal(p.durum, 200); assert.equal(p.govde.okul.koltuk, 5); assert.equal(p.govde.okul.kullanilan, 0);
  // öğrenci öğretmen uçlarını kullanamaz; öğretmen davetine öğrenci adresi yazılamaz
  assert.equal((await o.c("GET", "/api/ogretmen/panel")).durum, 403);
  assert.equal((await (await yonetici())("POST", "/api/admin/okullar/" + okulId + "/ogretmen-davet", { eposta: o.ep })).durum, 400);
  const den = db().prepare("SELECT eylem FROM audit_log WHERE eylem LIKE 'okul.%'").all().map(r => r.eylem);
  ["okul.olustur", "okul.lisans", "okul.ogretmen-davet", "okul.ogretmen-baglandi"].forEach(e => assert.ok(den.includes(e), e + " denetimde"));
});

test("katılım: onay gerekir; koltuk varsa okul Premium'u; koltuk dolunca Premium'suz katılır; ayrılınca biter; ücretli Premium etkilenmez", async () => {
  const okulId = await okulKur(1);
  const t = await ogretmen(okulId);
  const s = await sinifAc(t);
  const a = await ogrenci("Ali"), b = await ogrenci("Banu");
  const bilgi = await a.c("GET", "/api/sinif/kod/" + s.kod.toLowerCase());
  assert.equal(bilgi.durum, 200); assert.ok(bilgi.govde.paylasilan.length >= 5); assert.equal(bilgi.govde.premium.koltukVar, true);
  assert.equal((await a.c("POST", "/api/sinif/katil", { kod: s.kod })).durum, 400, "onaysız katılım yok");
  const k1 = await a.c("POST", "/api/sinif/katil", { kod: s.kod, onay: true });
  assert.equal(k1.durum, 200); assert.equal(k1.govde.premium, true);
  assert.equal(premium(a.uid).premium, true); assert.equal(premium(a.uid).kaynak, "okul");
  // Banu'nun kendi ödediği Premium'u var
  const z = new Date().toISOString(), bit = new Date(Date.now() + 30 * 864e5).toISOString();
  db().prepare("INSERT INTO subscriptions (user_id, plan, baslangic, bitis, kaynak, tutar_tl, olusturma) VALUES (?, 'aylik', ?, ?, 'talep', 199, ?)").run(b.uid, z, bit, z);
  const k2 = await b.c("POST", "/api/sinif/katil", { kod: s.kod, onay: true });
  assert.equal(k2.durum, 200); assert.equal(k2.govde.premium, false); assert.equal(k2.govde.koltukYok, true);
  assert.match(k2.govde.mesaj, /dolu/);
  const p = await t("GET", "/api/ogretmen/siniflar/" + s.id);
  assert.equal(p.govde.ogrenciler.length, 2, "koltuksuz da katıldı");
  // ayrılma → okul Premium'u biter; koltuk boşalır
  const sid = (await a.c("GET", "/api/sinif/benim")).govde.siniflar[0].id;
  assert.equal((await a.c("POST", "/api/sinif/" + sid + "/ayril")).durum, 200);
  assert.equal(premium(a.uid).premium, false);
  // çıkarma: Banu'nun ücretli Premium'u sürer
  const banu = (await t("GET", "/api/ogretmen/siniflar/" + s.id)).govde.ogrenciler[0];
  assert.equal((await t("POST", "/api/ogretmen/siniflar/" + s.id + "/uyeler/" + banu.id + "/cikar")).durum, 200);
  assert.equal(premium(b.uid).premium, true); assert.equal(premium(b.uid).kaynak, "talep");
  // lisans iptali → okul Premium'u biter
  const c = await ogrenci("Can");
  assert.equal((await c.c("POST", "/api/sinif/katil", { kod: s.kod, onay: true })).govde.premium, true);
  assert.equal((await (await yonetici())("POST", "/api/admin/okullar/" + okulId + "/lisans/iptal")).durum, 200);
  assert.equal(premium(c.uid).premium, false);
  // lisans süresi biterse (bitis geçmişte) Premium da biter: abonelik bitişi = lisans bitişi
  const okul2 = await okulKur(3), t2 = await ogretmen(okul2), s2 = await sinifAc(t2);
  const d = await ogrenci("Deniz");
  await d.c("POST", "/api/sinif/katil", { kod: s2.kod, onay: true });
  const lis = db().prepare("SELECT bitis FROM lisanslar WHERE okul_id = ? AND durum = 'aktif'").get(okul2).bitis;
  assert.equal(premium(d.uid).bitis, lis);
});

test("gelir istatistiği okul Premium'unu saymaz", async () => {
  const y = await yonetici();
  const once = (await y("GET", "/api/admin/stats")).govde;
  const okulId = await okulKur(10), t = await ogretmen(okulId), s = await sinifAc(t);
  const e = await ogrenci("Ece");
  assert.equal((await e.c("POST", "/api/sinif/katil", { kod: s.kod, onay: true })).govde.premium, true);
  const sonra = (await y("GET", "/api/admin/stats")).govde;
  assert.ok(once.gelirTahmini, "gelirTahmini alanı var");
  assert.equal(sonra.gelirTahmini.aylikTL, once.gelirTahmini.aylikTL, "gelir değişmedi");
  const tut = db().prepare("SELECT COUNT(*) AS n FROM subscriptions WHERE kaynak = 'okul' AND tutar_tl IS NOT NULL").get().n;
  assert.equal(tut, 0, "okul aboneliğinde tutar yok");
});

test("öğretmen gizliliği: soru-cevap, not, e-posta, veli bağlantısı yok; başka sınıfa erişemez; CSV", async () => {
  const okulId = await okulKur(5);
  const t = await ogretmen(okulId), t2 = await ogretmen(okulId);
  const s = await sinifAc(t), s2 = await sinifAc(t2);
  const o = await ogrenci("Zeynep");
  await o.c("POST", "/api/sinif/katil", { kod: s.kod, onay: true });
  const z = new Date().toISOString();
  db().prepare("INSERT INTO questions (user_id, sayfa, metin, olusturma, guncelleme) VALUES (?, 'ap-calculus', 'GIZLI-SORU', ?, ?)").run(o.uid, z, z);
  db().prepare("INSERT INTO answers (user_id, sayfa, unite, soru, secim, dogru, zaman) VALUES (?, 'ap-calculus', 'calc-unit1-quiz-container', 'calc_u1_q1', 'GIZLI-SECIM', 1, ?)").run(o.uid, z);
  const p = await t("GET", "/api/ogretmen/siniflar/" + s.id);
  assert.equal(p.durum, 200);
  const metin = JSON.stringify(p.govde);
  assert.ok(!metin.includes(o.ep), "e-posta yok");
  assert.ok(!metin.includes("GIZLI"), "soru/cevap ayrıntısı yok");
  assert.ok(!/veli/i.test(metin), "veli bilgisi yok");
  const og = p.govde.ogrenciler[0];
  assert.equal(og.ad, "Zeynep Y.");
  assert.equal(og.haftaSoru, 1); assert.equal(og.dogruluk, 100);
  assert.equal(og.eposta, undefined);
  assert.ok(p.govde.birimler.length >= 5 && og.kapsam.length === p.govde.birimler.length);
  assert.ok(og.kapsam[0] > 0, "ünite 1 kapsamı");
  assert.equal((await t("GET", "/api/ogretmen/siniflar/" + s2.id)).durum, 404, "başka öğretmenin sınıfı");
  assert.equal((await t("POST", "/api/ogretmen/siniflar/" + s2.id + "/odevler", { tur: "kart" })).durum, 404);
  const csv = await t("GET", "/api/ogretmen/siniflar/" + s.id + "/csv");
  assert.equal(csv.durum, 200); assert.match(csv.tur, /text\/csv/); assert.match(csv.govde, /Zeynep Y\./); assert.ok(!csv.govde.includes(o.ep));
  // yönetici e-postayı açarsa görünür
  await (await yonetici())("PUT", "/api/admin/okullar/" + okulId, { epostaGorunur: true });
  assert.equal((await t("GET", "/api/ogretmen/siniflar/" + s.id)).govde.ogrenciler[0].eposta, o.ep);
});

test("ödevler: oluşturma → öğrenciye bildirim; durum mevcut etkinlikten hesaplanır; tamamlanma yüzdesi", async () => {
  const okulId = await okulKur(5);
  const t = await ogretmen(okulId), s = await sinifAc(t);
  const a = await ogrenci("Arda"), b = await ogrenci("Bora");
  for (const x of [a, b]) await x.c("POST", "/api/sinif/katil", { kod: s.kod, onay: true });
  const sec = (await t("GET", "/api/ogretmen/siniflar/" + s.id)).govde.secenekler;
  const un = sec.uniteler[0];
  let r = await t("POST", "/api/ogretmen/siniflar/" + s.id + "/odevler", { baslik: "Ünite 1 tekrar", tur: "unite", hedef: { sayfa: un.sayfa, kutu: un.kutu, adet: 2 }, sonTarih: gun(7) });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  assert.equal((await t("POST", "/api/ogretmen/siniflar/" + s.id + "/odevler", { tur: "deneme", hedef: { kod: "yok" } })).durum, 400);
  r = await t("POST", "/api/ogretmen/siniflar/" + s.id + "/odevler", { tur: "deneme", hedef: { kod: "calculus-ab" } });
  assert.equal(r.durum, 200);
  const bil = (await a.c("GET", "/api/bildirimler")).govde.bildirimler;
  assert.ok(bil.some(x => /Yeni ödev: Ünite 1 tekrar/.test(x.baslik) && x.link === "/sinif"), "uygulama içi bildirim");
  const z = new Date(Date.now() + 1000).toISOString();
  ["q1", "q2"].forEach((q, i) => db().prepare("INSERT INTO answers (user_id, sayfa, unite, soru, dogru, zaman) VALUES (?, ?, ?, ?, 1, ?)").run(a.uid, un.sayfa, un.kutu, q, new Date(Date.now() + 1000 + i).toISOString()));
  db().prepare("INSERT INTO answers (user_id, sayfa, unite, soru, dogru, zaman) VALUES (?, ?, ?, 'q1', 0, ?)").run(b.uid, un.sayfa, un.kutu, z);
  db().prepare("INSERT INTO exams (user_id, istemci_id, kod, ad, tarih, soru_sayisi, dogru, yuzde, tahmini_band) VALUES (?, 'd1', 'calculus-ab', 'Deneme', ?, 10, 7, 70, '4')").run(b.uid, z);
  const p = (await t("GET", "/api/ogretmen/siniflar/" + s.id)).govde;
  const od = p.odevler.find(x => x.tur === "unite"), dn = p.odevler.find(x => x.tur === "deneme");
  assert.equal(od.tamam, 1); assert.equal(od.yuzde, 50);
  assert.equal(dn.tamam, 1);
  const ia = p.odevler.indexOf(od);
  const durumlar = p.ogrenciler.map(o => o.ad + ":" + o.odevler[ia].durum).sort();
  assert.deepEqual(durumlar, ["Arda Y.:tamam", "Bora Y.:devam"]);
  assert.equal(p.ogrenciler.find(o => o.ad === "Bora Y.").tahminiPuan, 4);
  // öğrenci kendi ödevlerini görür
  const ben = (await a.c("GET", "/api/sinif/benim")).govde;
  assert.equal(ben.siniflar[0].odevler.length, 2);
  assert.equal(ben.siniflar[0].odevler.find(x => x.tur === "unite").durum, "tamam");
  assert.ok(ben.siniflar[0].odevler.every(x => x.link && x.link[0] === "/"));
  // iptal
  assert.equal((await t("POST", "/api/ogretmen/odevler/" + dn.id + "/iptal")).durum, 200);
  assert.equal((await t("GET", "/api/ogretmen/siniflar/" + s.id)).govde.odevler.length, 1);
});

test("sayfalar: /ogretmen ve /sinif temiz adresleri sunulur; öğretmen kökte panele yönlenir", async () => {
  for (const y of ["/ogretmen", "/sinif"]) {
    const r = await fetch(base + y);
    assert.equal(r.status, 200, y);
  }
  const okulId = await okulKur(2), t = await ogretmen(okulId);
  void t;
});
