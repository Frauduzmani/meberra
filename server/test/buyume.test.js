"use strict";
// v1.6.0 büyüme: olay ölçümü (sınırlar, gizlilik), huni hesabı, 7 günlük deneme (bir kez, silmeden sonra da), deneme bitişi,
// indirim kodu (doğrulama, sınır, süre, indirimli talep, onayda kullanım, gelir), davet (seviye testi sonrası ödül, kendine davet), yönetici yetkisi.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { olustur } = require("../uygulama");
const { huniHesapla } = require("../huni");
const { kuponFiyat } = require("../kampanya");

let app, base;
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, gunlukKonsol: false, varlikOtomatik: false, soruTohum: true });
  await new Promise(r => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
});
after(() => new Promise(r => app.server.close(r)));

function istemci(anon) {
  let cerez = "";
  const f = async function iste(yontem, yol, govde, ekBaslik) {
    const c = [cerez, anon ? "mb_anon=" + anon : ""].filter(Boolean).join("; ");
    const h = Object.assign({ "Content-Type": "application/json" }, yontem === "GET" ? {} : { "X-Meberra": "1" }, c ? { Cookie: c } : {}, ekBaslik || {});
    const r = await fetch(base + yol, { method: yontem, headers: h, body: govde === undefined ? undefined : typeof govde === "string" ? govde : JSON.stringify(govde) });
    const sc = r.headers.get("set-cookie");
    if (sc) { const m = /meberra_sid=([^;]*)/.exec(sc); if (m) cerez = m[1] ? "meberra_sid=" + m[1] : ""; }
    const tur = r.headers.get("content-type") || "";
    return { durum: r.status, govde: tur.includes("json") ? await r.json() : await r.text() };
  };
  return f;
}
const db = () => app.db;
let sayac = 0;
const anonUret = () => "anon" + String(++sayac).padStart(4, "0") + "abcdefghijkl";
async function ogrenci(ek) {
  const c = istemci(ek && ek.anon), ep = (ek && ek.eposta) || "by" + (++sayac) + "@ornek.com";
  const r = await c("POST", "/api/auth/register", Object.assign({ ad: "Ada", soyad: "Kaya", eposta: ep, sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true }, (ek && ek.govde) || {}));
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  c.uid = db().prepare("SELECT id FROM users WHERE public_id = ?").get(r.govde.user.id).id;
  c.pid = r.govde.user.id; c.eposta = ep;
  return c;
}
let yonC = null;
async function yonetici() {
  if (yonC) return yonC;
  app.hesap.yoneticiHazirla("byyon@ornek.com", "Yonetici-12345");
  yonC = istemci();
  assert.equal((await yonC("POST", "/api/auth/login", { kimlik: "byyon@ornek.com", sifre: "Yonetici-12345" })).durum, 200);
  return yonC;
}
const olaySay = (olay, uid) => db().prepare("SELECT COUNT(*) AS n FROM olaylar WHERE olay = ?" + (uid ? " AND user_id = ?" : "")).get(...[olay].concat(uid ? [uid] : [])).n;

// ===================================================================================== ölçüm
test("olay: anonim toplu gönderim; yalnız izinli olaylar, sunucu olayları istemciden yazılamaz, sayfa yolu temizlenir", async () => {
  const anon = anonUret(), c = istemci();
  const r = await c("POST", "/api/olay", { anon, utm: { source: "Instagram", medium: "social", campaign: "ekim" }, olaylar: [
    { ad: "page_view", sayfa: "/vitrin.html?e=gizli@x.com#a" }, { ad: "premium_aktif" }, { ad: "kotu_olay" }, { ad: "paywall_gordu", sayfa: "/ap-calculus.html", ozellikler: { unite: 3, metin: "x".repeat(200), nesne: { a: 1 } } }] });
  assert.equal(r.durum, 200); assert.equal(r.govde.alinan, 2);
  const s = db().prepare("SELECT * FROM olaylar WHERE anon_id = ? ORDER BY id").all(anon);
  assert.equal(s.length, 2);
  assert.equal(s[0].sayfa, "/vitrin.html"); assert.equal(s[0].utm_source, "instagram"); assert.equal(s[0].user_id, null);
  const o = JSON.parse(s[1].ozellikler);
  assert.equal(o.unite, 3); assert.equal(o.metin.length, 80); assert.equal(o.nesne, undefined);
  // IP / tarayıcı sütunu yok
  const sutunlar = db().prepare("PRAGMA table_info(olaylar)").all().map(x => x.name);
  assert.ok(!sutunlar.some(x => /ip|tarayici|agent|eposta/i.test(x)), sutunlar.join(","));
});

test("olay: CSRF başlığı, boyut (16 KB), toplu sınır (25), kimliksiz istek ve hız sınırı", async () => {
  const anon = anonUret();
  const ham = await fetch(base + "/api/olay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anon, olaylar: [{ ad: "page_view" }] }) });
  assert.equal(ham.status, 403);
  const c = istemci();
  assert.equal((await c("POST", "/api/olay", { anon, olaylar: [{ ad: "page_view", sayfa: "/" + "a".repeat(20000) }] })).durum, 413);
  assert.equal((await c("POST", "/api/olay", { anon, olaylar: new Array(26).fill({ ad: "page_view" }) })).durum, 413);
  assert.equal((await c("POST", "/api/olay", { anon: "kısa", olaylar: [{ ad: "page_view" }] })).durum, 400);
  // hız sınırı: ayrı uygulama (sınır 3/dk)
  const a2 = olustur({ dbDosya: ":memory:", yoneticiAtla: true, gunlukKonsol: false, varlikOtomatik: false, soruTohum: false, olaySiniri: 3 });
  await new Promise(r => a2.server.listen(0, "127.0.0.1", r));
  const b2 = "http://127.0.0.1:" + a2.server.address().port;
  const kodlar = [];
  for (let i = 0; i < 4; i++) kodlar.push((await fetch(b2 + "/api/olay", { method: "POST", headers: { "Content-Type": "application/json", "X-Meberra": "1" }, body: JSON.stringify({ anon, olaylar: [{ ad: "page_view" }] }) })).status);
  await new Promise(r => a2.server.close(r));
  assert.deepEqual(kodlar, [200, 200, 200, 429]);
});

test("olay: ölçümü kapatan kullanıcının (ve izinYok) olayları yazılmaz; sunucu olayları da", async () => {
  const c = await ogrenci({ anon: anonUret() });
  assert.equal(olaySay("kayit_tamam", c.uid), 1);
  assert.equal((await c("GET", "/api/olcum-tercih")).govde.kapali, false);
  assert.equal((await c("PUT", "/api/olcum-tercih", { kapali: true })).govde.kapali, true);
  const r = await c("POST", "/api/olay", { olaylar: [{ ad: "page_view", sayfa: "/calis.html" }] });
  assert.equal(r.govde.alinan, 0);
  assert.equal(olaySay("page_view", c.uid), 0);
  await c("POST", "/api/premium/deneme", {});
  assert.equal(olaySay("deneme_basla", c.uid), 0);
  const anon = anonUret();
  assert.equal((await istemci()("POST", "/api/olay", { anon, izinYok: true, olaylar: [{ ad: "page_view" }] })).govde.alinan, 0);
  // hesap silinince olaylar da silinir
  const d = await ogrenci({ anon: anonUret() });
  await d("POST", "/api/olay", { olaylar: [{ ad: "page_view" }] });
  assert.ok(db().prepare("SELECT COUNT(*) AS n FROM olaylar WHERE user_id = ?").get(d.uid).n > 0);
  assert.equal((await d("POST", "/api/account/delete", { sifre: "Deneme-12345" })).durum, 200);
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM olaylar WHERE user_id = ?").get(d.uid).n, 0);
});

test("huni hesabı: kümülatif kesişim, anon→kullanıcı eşleşmesi, adım oranı, kaynak süzgeci", () => {
  const es = new Map([["A1", 1], ["A2", 2]]);
  const s = [
    { olay: "page_view", anon_id: "A1", user_id: null }, { olay: "page_view", anon_id: "A2", user_id: null }, { olay: "page_view", anon_id: "A3", user_id: null },
    { olay: "page_view", anon_id: "A4", user_id: null },
    { olay: "kayit_tamam", anon_id: null, user_id: 1 }, { olay: "kayit_tamam", anon_id: "A2", user_id: 2 },
    { olay: "karsilama_tamam", anon_id: null, user_id: 1 },
    { olay: "premium_sayfa", anon_id: "A3", user_id: null } // kayıtsız: önceki adımlar yok → hunide sayılmaz, ham'da sayılır
  ];
  const kay = new Map([["u1", "instagram"], ["u2", "google"], ["aA3", "instagram"]]);
  const h = huniHesapla(s, es, kay, "");
  const al = k => h.find(x => x.anahtar === k);
  assert.equal(al("ziyaret").kisi, 4);
  assert.equal(al("kayit").kisi, 2); assert.equal(al("kayit").adimOrani, 50);
  assert.equal(al("karsilama").kisi, 1); assert.equal(al("karsilama").adimOrani, 50);
  assert.equal(al("premium_sayfa").kisi, 0); assert.equal(al("premium_sayfa").ham, 1);
  const i = huniHesapla(s, es, kay, "instagram");
  assert.equal(i.find(x => x.anahtar === "ziyaret").kisi, 2);
  assert.equal(i.find(x => x.anahtar === "kayit").kisi, 1);
  const yok = huniHesapla(s, es, kay, "(yok)");
  assert.equal(yok.find(x => x.anahtar === "ziyaret").kisi, 1); // A4
});

test("huni uç noktası: yalnız yönetici; kayıt + karşılama sunucu olayları anon kimliğe bağlanır", async () => {
  const anon = anonUret();
  const v = istemci(anon);
  await v("POST", "/api/olay", { anon, utm: { source: "tiktok" }, olaylar: [{ ad: "page_view", sayfa: "/vitrin.html" }, { ad: "vitrin_gorundu" }] });
  const c = await ogrenci({ anon });
  await c("PUT", "/api/profile", { profile: { tamamlandi: true, ogrenciModeli: "lise", sinif: "11", ulkeler: ["de"] } });
  await c("PUT", "/api/profile", { profile: { tamamlandi: true, ogrenciModeli: "lise", sinif: "12", ulkeler: ["de"] } });
  assert.equal(olaySay("karsilama_tamam", c.uid), 1, "karşılama bir kez");
  assert.equal((await c("GET", "/api/admin/buyume/analiz")).durum, 403);
  assert.equal((await istemci()("GET", "/api/admin/buyume/analiz")).durum, 401);
  const y = await yonetici();
  const r = await y("GET", "/api/admin/buyume/analiz?gun=7&kaynak=tiktok");
  assert.equal(r.durum, 200);
  const h = r.govde.huni;
  assert.equal(h[0].kisi, 1); assert.equal(h[1].kisi, 1); assert.equal(h[2].kisi, 1);
  assert.ok(r.govde.kaynaklar.some(k => k.ad === "tiktok"));
  assert.equal(r.govde.gunluk.gunler.length, 7);
  assert.ok(Array.isArray(r.govde.kohort) && r.govde.kohort.length >= 1);
});

test("olay saklama: 400 günden eski olaylar günlük özete toplanıp silinir", async () => {
  const eski = new Date(Date.now() - 401 * 864e5).toISOString();
  db().prepare("INSERT INTO olaylar (zaman, anon_id, olay, utm_source) VALUES (?, 'eskiANONabcdefghij', 'page_view', 'x'), (?, 'eskiANONabcdefghij', 'page_view', 'x')").run(eski, eski);
  const s = await app.zamanlayici.calistir("olaySaklama");
  assert.ok(s.calisti); assert.equal(s.sonuc, 2);
  assert.equal(db().prepare("SELECT adet FROM olay_ozet WHERE gun = ? AND olay = 'page_view' AND utm_source = 'x'").get(eski.slice(0, 10)).adet, 2);
});

// ===================================================================================== deneme
test("deneme: 7 gün Premium, bir kez; hesap silinip aynı e-postayla yeniden kayıtta da kullanılamaz", async () => {
  const ep = "deneme-tekrar@ornek.com";
  const c = await ogrenci({ eposta: ep });
  let d = (await c("GET", "/api/premium/deneme")).govde;
  assert.equal(d.uygun, true); assert.equal(d.gun, 7);
  const r = await c("POST", "/api/premium/deneme", {});
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  assert.equal(r.govde.uyelik.premium, true); assert.equal(r.govde.uyelik.deneme, true);
  const gun = (Date.parse(r.govde.bitis) - Date.now()) / 864e5;
  assert.ok(gun > 6.9 && gun <= 7, String(gun));
  assert.equal(db().prepare("SELECT kaynak FROM subscriptions WHERE user_id = ?").get(c.uid).kaynak, "deneme");
  assert.equal((await c("POST", "/api/premium/deneme", {})).durum, 409);
  // Premium uçlarında Premium sayılır
  assert.equal((await c("GET", "/api/me")).govde.uyelik.premium, true);
  // silme → yeniden kayıt
  assert.equal((await c("POST", "/api/account/delete", { sifre: "Deneme-12345" })).durum, 200);
  const c2 = await ogrenci({ eposta: ep });
  d = (await c2("GET", "/api/premium/deneme")).govde;
  assert.equal(d.uygun, false); assert.equal(d.neden, "kullanildi");
  const r2 = await c2("POST", "/api/premium/deneme", {});
  assert.equal(r2.durum, 409); assert.equal(r2.govde.neden, "kullanildi");
  // gelir tahmini denemeyi saymaz
  const y = await yonetici();
  const st = (await y("GET", "/api/admin/stats")).govde;
  assert.equal(st.gelirTahmini.aylikTL, 0);
});

test("deneme: süresi dolunca Premium değil; 2 gün kala ve bitişte bir kez bildirim + e-posta (sessiz saat dışında)", async () => {
  const c = await ogrenci();
  await c("POST", "/api/premium/deneme", {});
  const sid = db().prepare("SELECT abonelik_id FROM premium_denemeleri WHERE user_id = ?").get(c.uid).abonelik_id;
  // 5. gün: bitişe 1,5 gün
  db().prepare("UPDATE subscriptions SET bitis = ? WHERE id = ?").run(new Date(Date.now() + 1.5 * 864e5).toISOString(), sid);
  const ogle = (() => { const d = new Date(); d.setUTCHours(10, 0, 0, 0); return d.getTime(); })(); // 13:00 İstanbul
  const gece = (() => { const d = new Date(); d.setUTCHours(21, 0, 0, 0); return d.getTime(); })(); // 00:00 İstanbul
  assert.equal((await app.zamanlayici.calistir("denemeBildirim", gece)).calisti, false);
  const bild = () => db().prepare("SELECT baslik FROM notifications WHERE user_id = ? ORDER BY id").all(c.uid).map(x => x.baslik);
  await app.zamanlayici.calistir("denemeBildirim", ogle);
  assert.ok(bild().includes("Premium denemende 2 gün kaldı"));
  assert.ok(db().prepare("SELECT 1 FROM email_outbox WHERE alici = ? AND konu LIKE '%2 gün kaldı%'").get(c.eposta));
  await app.zamanlayici.calistir("denemeBildirim", ogle);
  assert.equal(bild().filter(x => /2 gün kaldı/.test(x)).length, 1, "bir kez");
  // bitiş
  db().prepare("UPDATE subscriptions SET bitis = ? WHERE id = ?").run(new Date(Date.now() - 60e3).toISOString(), sid);
  assert.equal((await c("GET", "/api/me")).govde.uyelik.premium, false);
  const sb = await c("POST", "/api/sorular-bankasi/getir", { anahtarlar: [] });
  assert.ok(sb.durum < 500);
  // aynı gün zaten mesaj aldı → bitiş bildirimi ertesi güne kalır (günde bir mesaj)
  await app.zamanlayici.calistir("denemeBildirim", ogle);
  assert.ok(!bild().includes("Premium denemen bitti"));
  await app.zamanlayici.calistir("denemeBildirim", ogle + 864e5);
  assert.ok(bild().includes("Premium denemen bitti"));
  await app.zamanlayici.calistir("denemeBildirim", ogle + 2 * 864e5);
  assert.equal(bild().filter(x => x === "Premium denemen bitti").length, 1);
  assert.equal(olaySay("deneme_bitti", c.uid), 1);
});

test("deneme: yönetici listeler, uzatır, iptal eder; öğrenci bu uçlara erişemez", async () => {
  const c = await ogrenci();
  await c("POST", "/api/premium/deneme", {});
  assert.equal((await c("GET", "/api/admin/buyume/denemeler")).durum, 403);
  assert.equal((await c("POST", "/api/admin/buyume/denemeler/" + c.pid + "/uzat", { gun: 3 })).durum, 403);
  const y = await yonetici();
  const l = (await y("GET", "/api/admin/buyume/denemeler")).govde.denemeler;
  assert.ok(l.some(x => x.kullanici.id === c.pid && x.durum === "aktif"));
  const u = await y("POST", "/api/admin/buyume/denemeler/" + c.pid + "/uzat", { gun: 3 });
  assert.equal(u.durum, 200);
  assert.ok((Date.parse(u.govde.bitis) - Date.now()) / 864e5 > 9.9);
  assert.equal((await y("POST", "/api/admin/buyume/denemeler/" + c.pid + "/uzat", { gun: 99 })).durum, 400);
  assert.equal((await y("POST", "/api/admin/buyume/denemeler/" + c.pid + "/iptal", {})).durum, 200);
  assert.equal((await c("GET", "/api/me")).govde.uyelik.premium, false);
  assert.equal((await y("GET", "/api/admin/buyume/ozet")).durum, 200);
});

// ===================================================================================== kupon
test("kupon: yönetici oluşturur; doğrulama (büyük/küçük harf, plan kısıtı, süre, pasif); öğrenci oluşturamaz", async () => {
  const c = await ogrenci();
  assert.equal((await c("POST", "/api/admin/kuponlar", { kod: "X", tur: "yuzde", deger: 10 })).durum, 403);
  const y = await yonetici();
  const k = await y("POST", "/api/admin/kuponlar", { kod: "ekim20", tur: "yuzde", deger: 20, plan: "yillik", aciklama: "Ekim" });
  assert.equal(k.durum, 200, JSON.stringify(k.govde)); assert.equal(k.govde.kupon.kod, "EKIM20");
  assert.equal((await y("POST", "/api/admin/kuponlar", { kod: "Ekim20", tur: "yuzde", deger: 5 })).durum, 409, "büyük/küçük harf duyarsız benzersiz");
  assert.equal((await y("POST", "/api/admin/kuponlar", { kod: "COK", tur: "yuzde", deger: 150 })).durum, 400);
  let r = await c("POST", "/api/kupon/dogrula", { kod: " ekim20 ", plan: "yillik" });
  assert.equal(r.durum, 200); assert.equal(r.govde.liste, 1490); assert.equal(r.govde.indirim, 298); assert.equal(r.govde.tutar, 1192);
  assert.equal((await c("POST", "/api/kupon/dogrula", { kod: "EKİM20", plan: "yillik" })).govde.kod, "EKIM20", "Türkçe İ normalleşir");
  r = await c("POST", "/api/kupon/dogrula", { kod: "EKIM20", plan: "aylik" });
  assert.equal(r.durum, 400); assert.match(r.govde.errors.kupon, /Yıllık/);
  assert.equal((await c("POST", "/api/kupon/dogrula", { kod: "YOKBOYLE", plan: "aylik" })).durum, 400);
  await y("POST", "/api/admin/kuponlar", { kod: "ESKI50", tur: "tutar", deger: 50, bitis: new Date(Date.now() - 864e5).toISOString() });
  r = await c("POST", "/api/kupon/dogrula", { kod: "eski50", plan: "aylik" });
  assert.equal(r.durum, 400); assert.match(r.govde.errors.kupon, /süresi doldu/);
  await y("POST", "/api/admin/kuponlar", { kod: "GELECEK", tur: "tutar", deger: 50, baslangic: new Date(Date.now() + 864e5).toISOString() });
  assert.match((await c("POST", "/api/kupon/dogrula", { kod: "GELECEK", plan: "aylik" })).govde.errors.kupon, /henüz/);
  const id = k.govde.kupon.id;
  assert.equal((await y("PUT", "/api/admin/kuponlar/" + id, { aktif: false })).govde.kupon.aktif, false);
  assert.equal((await c("POST", "/api/kupon/dogrula", { kod: "EKIM20", plan: "yillik" })).durum, 400);
  // misafir doğrulayamaz
  assert.equal((await istemci()("POST", "/api/kupon/dogrula", { kod: "EKIM20", plan: "yillik" })).durum, 401);
  assert.deepEqual(kuponFiyat({ tur: "tutar", deger: 500 }, 199), { liste: 199, indirim: 199, tutar: 0 });
});

test("kupon: indirimli ödeme bildirimi; onayda kullanım kaydı; kişi başı ve toplam sınır; gelir indirimli tutardan", async () => {
  const y = await yonetici();
  await y("POST", "/api/admin/kuponlar", { kod: "TEKSEFER", tur: "tutar", deger: 49, plan: "hepsi", maxKullanim: 2, kisiBasi: 1 });
  const a = await ogrenci(), b = await ogrenci(), c = await ogrenci();
  const t = await a("POST", "/api/premium/talep", { plan: "aylik", odeyenAd: "Ada Kaya", kupon: "teksefer" });
  assert.equal(t.durum, 200, JSON.stringify(t.govde));
  assert.equal(t.govde.talep.tutar, 150);
  const satir = db().prepare("SELECT * FROM upgrade_requests WHERE id = ?").get(t.govde.talep.id);
  assert.equal(satir.tutar_tl, 150); assert.equal(satir.liste_tutar_tl, 199); assert.ok(satir.kupon_id);
  // geçersiz kodla talep oluşmaz
  const g = await b("POST", "/api/premium/talep", { plan: "aylik", odeyenAd: "B", kupon: "YANLIS" });
  assert.equal(g.durum, 400); assert.ok(g.govde.errors.kupon);
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM upgrade_requests WHERE user_id = ?").get(b.uid).n, 0);
  // kişi başı: bekleyen bildirim de sayılır
  assert.match((await a("POST", "/api/kupon/dogrula", { kod: "TEKSEFER", plan: "aylik" })).govde.errors.kupon, /zaten/);
  assert.equal((await b("POST", "/api/premium/talep", { plan: "yillik", odeyenAd: "B", kupon: "TEKSEFER" })).durum, 200);
  // toplam sınır (2): üçüncü kişi kullanamaz
  assert.match((await c("POST", "/api/kupon/dogrula", { kod: "TEKSEFER", plan: "aylik" })).govde.errors.kupon, /sınırı/);
  // onay → kullanım kaydı + Premium + gelir indirimli
  const on = await y("POST", "/api/admin/talepler/" + t.govde.talep.id, { islem: "onayla" });
  assert.equal(on.durum, 200);
  const kk = db().prepare("SELECT * FROM kupon_kullanimlari WHERE talep_id = ?").get(t.govde.talep.id);
  assert.equal(kk.tutar, 150); assert.equal(kk.indirim, 49); assert.equal(kk.user_id, a.uid);
  assert.equal(olaySay("premium_aktif", a.uid), 1);
  assert.equal(olaySay("odeme_bildirdi", a.uid), 1);
  const st = (await y("GET", "/api/admin/stats")).govde;
  assert.equal(st.gelirTahmini.aylikTL, Math.round(150 / 30 * 30));
  const liste = (await y("GET", "/api/admin/kuponlar")).govde;
  const ks = liste.kuponlar.find(x => x.kod === "TEKSEFER");
  assert.equal(ks.kullanim, 1); assert.equal(ks.bekleyen, 1); assert.equal(ks.gelir, 150);
});

// ===================================================================================== davet
async function seviyeBitir(c) {
  const bank = (await c("GET", "/api/seviye/bankalar")).govde.bankalar;
  const ders = Object.keys(bank)[0], soru = bank[ders].sorular[0];
  const r = await c("POST", "/api/seviye/teslim", { cevaplar: { [soru.k || (ders + "|" + soru.id)]: "A" } });
  assert.equal(r.durum, 200, JSON.stringify(r.govde).slice(0, 300));
}
const premiumGun = uid => db().prepare("SELECT COALESCE(SUM(julianday(bitis) - julianday(baslangic)), 0) AS g FROM subscriptions WHERE user_id = ? AND kaynak = 'davet'").get(uid).g;

test("davet: kayıt kodu bağlar; ödül yalnızca seviye testi bitince, iki tarafa +7 gün; bir kez", async () => {
  const eden = await ogrenci();
  // davet eden başka bir IP'den görülmüş olsun (testlerde tümü 127.0.0.1)
  db().prepare("UPDATE sessions SET ip = '198.51.100.7', son_ip = NULL WHERE user_id = ?").run(eden.uid);
  db().prepare("UPDATE users SET son_ip = NULL WHERE id = ?").run(eden.uid);
  const bilgi = (await eden("GET", "/api/davet")).govde;
  assert.match(bilgi.kod, /^[A-Z2-9]{8}$/); assert.match(bilgi.link, /\/kayit\?davet=[A-Z2-9]{8}$/);
  const yeni = await ogrenci({ govde: { davet: bilgi.kod.toLowerCase() } });
  assert.equal(db().prepare("SELECT durum FROM davetler WHERE davet_edilen = ?").get(yeni.uid).durum, "bekliyor");
  assert.equal(premiumGun(yeni.uid), 0, "kayıt tek başına ödül vermez");
  assert.equal((await yeni("GET", "/api/me")).govde.uyelik.premium, false);
  await seviyeBitir(yeni);
  assert.equal(db().prepare("SELECT durum FROM davetler WHERE davet_edilen = ?").get(yeni.uid).durum, "odullendi");
  assert.ok(Math.abs(premiumGun(yeni.uid) - 7) < 0.01); assert.ok(Math.abs(premiumGun(eden.uid) - 7) < 0.01);
  assert.equal((await yeni("GET", "/api/me")).govde.uyelik.premium, true);
  await seviyeBitir(yeni);
  assert.ok(Math.abs(premiumGun(eden.uid) - 7) < 0.01, "ikinci test yeni ödül vermez");
  const b2 = (await eden("GET", "/api/davet")).govde;
  assert.equal(b2.basarili, 1);
  assert.equal(olaySay("seviye_bitti", yeni.uid), 2);
});

test("davet: aynı IP (24 saat), aynı e-posta ile yeniden kayıt ve geçersiz kod ödül vermez; yönetici listesinde bayrak", async () => {
  const eden = await ogrenci(); // oturumu 127.0.0.1'den: aynı IP
  const kod = (await eden("GET", "/api/davet")).govde.kod;
  const ayni = await ogrenci({ govde: { davet: kod } });
  const d = db().prepare("SELECT * FROM davetler WHERE davet_edilen = ?").get(ayni.uid);
  assert.equal(d.durum, "reddedildi"); assert.equal(d.neden, "ayni-ip");
  await seviyeBitir(ayni);
  assert.equal(premiumGun(ayni.uid), 0); assert.equal(premiumGun(eden.uid), 0);
  // yeniden kayıt: önceki davetli hesabını silip aynı e-postayla tekrar
  db().prepare("UPDATE sessions SET ip = '198.51.100.9', son_ip = NULL WHERE user_id = ?").run(eden.uid);
  db().prepare("UPDATE users SET son_ip = NULL WHERE id = ?").run(eden.uid);
  await ayni("POST", "/api/account/delete", { sifre: "Deneme-12345" });
  const tekrar = await ogrenci({ eposta: ayni.eposta, govde: { davet: kod } });
  assert.equal(db().prepare("SELECT neden FROM davetler WHERE davet_edilen = ?").get(tekrar.uid).neden, "tekrar-eposta");
  // kendi kodu (kendi e-postası karması) → kendi-kodu; geçersiz kod sessizce yok sayılır
  const yok = await ogrenci({ govde: { davet: "ZZZZZZZZ" } });
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM davetler WHERE davet_edilen = ?").get(yok.uid).n, 0);
  const y = await yonetici();
  assert.equal((await eden("GET", "/api/admin/davetler")).durum, 403);
  const l = (await y("GET", "/api/admin/davetler")).govde.davetler;
  assert.ok(l.some(x => x.bayraklar.includes("ayni-ip")));
  assert.ok(l.some(x => x.bayraklar.includes("tekrar-eposta")));
});

test("davet: davet edene yılda en çok 10 ödül", async () => {
  const eden = await ogrenci();
  db().prepare("UPDATE sessions SET ip = '198.51.100.20', son_ip = NULL WHERE user_id = ?").run(eden.uid);
  db().prepare("UPDATE users SET son_ip = NULL WHERE id = ?").run(eden.uid);
  const kod = (await eden("GET", "/api/davet")).govde.kod;
  // 10 ödül önceden verilmiş say
  const z = new Date().toISOString();
  for (let i = 0; i < 10; i++) db().prepare("INSERT INTO davetler (davet_eden, kod, eposta_hash, durum, eden_odul, olusturma, odul_zamani) VALUES (?, ?, ?, 'odullendi', 1, ?, ?)").run(eden.uid, kod, "h" + i + "-" + eden.uid, z, z);
  const yeni = await ogrenci({ govde: { davet: kod } });
  await seviyeBitir(yeni);
  assert.ok(Math.abs(premiumGun(yeni.uid) - 7) < 0.01, "davet edilen yine ödül alır");
  assert.equal(premiumGun(eden.uid), 0, "sınırdaki davet eden almaz");
});

test("KVKK dışa aktarma büyüme verisini içerir", async () => {
  const c = await ogrenci();
  const r = await c("GET", "/api/account/export");
  assert.ok(r.govde.buyume && r.govde.buyume.davetKodu);
  assert.ok(Array.isArray(r.govde.buyume.olcum.olaylar));
});
