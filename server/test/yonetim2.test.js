"use strict";
// Yönetici v2: varlık (son görülme, IP, çevrimiçi), günlük giriş sayıları, engelleme (süreli/süresiz), oturum kapatma,
// IP engel listesi, bakım modu, destek merkezi (iç not, atama, hazır yanıtlar), sistem metrikleri, önbellek temizleme,
// Android assetlinks.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const config = require("../config");
const { olustur } = require("../uygulama");
const { varlikDurumu } = require("../varlik");
const { ayarServisi, bakimServisi, kapsamNormal, ipEslesir } = require("../erisim");

config.trustProxy = true; // X-Forwarded-For'un son adresi istemci IP'si sayılır (testte farklı IP'ler)

let app, base;
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, gunlukKonsol: false, varlikOtomatik: false });
  await new Promise(r => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
});
after(() => new Promise(r => app.server.close(r)));

function istemci(ip) {
  let cerez = "";
  const c = async function iste(yontem, yol, govde) {
    const h = Object.assign({ "Content-Type": "application/json", "X-Forwarded-For": "198.51.100.200, " + (ip || "10.0.0.50") },
      yontem === "GET" ? {} : { "X-Meberra": "1" }, cerez ? { Cookie: cerez } : {});
    const r = await fetch(base + yol, { method: yontem, headers: h, body: govde === undefined ? undefined : JSON.stringify(govde) });
    const sc = r.headers.get("set-cookie");
    if (sc) { const m = /meberra_sid=([^;]*)/.exec(sc); if (m) cerez = m[1] ? "meberra_sid=" + m[1] : ""; }
    const tur = r.headers.get("content-type") || "";
    return { durum: r.status, basliklar: r.headers, govde: tur.includes("json") ? await r.json() : await r.text() };
  };
  c.cerez = () => cerez;
  return c;
}
const db = () => app.db;
let yonC = null;
async function yonetici() {
  if (yonC) return yonC;
  app.hesap.yoneticiHazirla("yon2@ornek.com", "Yonetici-12345");
  yonC = istemci("10.0.0.1");
  assert.equal((await yonC("POST", "/api/auth/login", { kimlik: "yon2@ornek.com", sifre: "Yonetici-12345" })).durum, 200);
  return yonC;
}
async function ogrenci(ep, ip) {
  const c = istemci(ip);
  const r = await c("POST", "/api/auth/register", { ad: "Ece", soyad: "Demir", eposta: ep, sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  c.pid = r.govde.user.id;
  c.uid = db().prepare("SELECT id FROM users WHERE public_id = ?").get(c.pid).id;
  return c;
}
const denetimVar = (eylem, uid) => db().prepare("SELECT COUNT(*) AS n FROM audit_log WHERE eylem = ?" + (uid ? " AND user_id = ?" : "")).get(...[eylem].concat(uid ? [uid] : [])).n > 0;

test("varlık: çevrimiçi (5 dk), az önce (30 dk), çevrimdışı hesabı", () => {
  const t = Date.parse("2026-10-21T12:00:00Z");
  assert.equal(varlikDurumu("2026-10-21T11:57:00Z", t), "cevrimici");
  assert.equal(varlikDurumu("2026-10-21T11:55:00Z", t), "cevrimici");
  assert.equal(varlikDurumu("2026-10-21T11:40:00Z", t), "yakin");
  assert.equal(varlikDurumu("2026-10-21T10:00:00Z", t), "cevrimdisi");
  assert.equal(varlikDurumu(null, t), "cevrimdisi");
  assert.equal(varlikDurumu("bozuk", t), "cevrimdisi");
});

test("varlık: kimlikli istek son görülme + IP yazar (60 sn'de en fazla bir), çevrimiçi süzgeci ve sayaç", async () => {
  const yon = await yonetici();
  const o = await ogrenci("varlik@ornek.com", "10.20.30.40");
  // Eski bir son görülme: bu istek yeni değeri kuyruğa alır
  db().prepare("UPDATE users SET son_gorulme = ?, son_ip = NULL WHERE id = ?").run(new Date(Date.now() - 2 * 3600e3).toISOString(), o.uid);
  app.varlik.unut(o.uid);
  assert.equal((await o("GET", "/api/me")).durum, 200);
  assert.equal(app.varlik.bekleyenSayisi() >= 1, true);
  const ilk = db().prepare("SELECT son_gorulme FROM users WHERE id = ?").get(o.uid).son_gorulme;
  assert.ok(Date.now() - Date.parse(ilk) > 3600e3, "henüz boşaltılmadı (ucuz: istek başına yazım yok)");
  let r = await yon("GET", "/api/admin/users?varlik=cevrimici");
  const k = r.govde.kullanicilar.find(x => x.id === o.pid);
  assert.ok(k, "çevrimiçi listesinde");
  assert.equal(k.varlik, "cevrimici");
  assert.equal(k.sonIp, "10.20.30.40", "X-Forwarded-For'un son adresi");
  // 60 sn içinde ikinci istek yeni yazım kuyruğa almaz
  await o("GET", "/api/me");
  assert.equal(app.varlik.bekleyenSayisi(), 0);
  // 30 dk önce görülen: yakin süzgecinde var, çevrimiçi süzgecinde yok
  db().prepare("UPDATE users SET son_gorulme = ? WHERE id = ?").run(new Date(Date.now() - 20 * 60e3).toISOString(), o.uid);
  assert.ok(!(await yon("GET", "/api/admin/users?varlik=cevrimici")).govde.kullanicilar.some(x => x.id === o.pid));
  r = await yon("GET", "/api/admin/users?varlik=yakin&sirala=gorulme");
  assert.equal(r.govde.kullanicilar.find(x => x.id === o.pid).varlik, "yakin");
  const st = (await yon("GET", "/api/admin/stats")).govde.kullanici;
  assert.ok(st.cevrimici >= 1 && st.yakin >= st.cevrimici, "stats: cevrimici/yakin");
  // Oturum listesinde IP ve son görülme
  const d = (await yon("GET", "/api/admin/users/" + o.pid)).govde;
  assert.equal(d.user.varlik, "yakin");
  assert.equal(d.oturumlar.length, 1);
  assert.equal(d.oturumlar[0].ip, "10.20.30.40");
});

test("günlük giriş sayıları: başarılı ve hatalı girişler İstanbul gününe yazılır; 14 günlük seri", async () => {
  const yon = await yonetici();
  const o = await ogrenci("sayac@ornek.com", "10.1.1.1");
  const g = istemci("10.1.1.2");
  assert.equal((await g("POST", "/api/auth/login", { kimlik: "sayac@ornek.com", sifre: "Deneme-12345" })).durum, 200);
  assert.equal((await g("POST", "/api/auth/login", { kimlik: "sayac@ornek.com", sifre: "Deneme-12345" })).durum, 200);
  assert.equal((await g("POST", "/api/auth/login", { kimlik: "sayac@ornek.com", sifre: "yanlis-sifre" })).durum, 401);
  const d = (await yon("GET", "/api/admin/users/" + o.pid)).govde;
  assert.equal(d.girisler.gunler.length, 14);
  assert.equal(d.girisler.adet[13], 2, "bugün 2 başarılı giriş (kayıt sayılmaz)");
  assert.equal(d.girisler.basarisiz[13], 1);
  assert.equal(d.user.sonGirisIp, "10.1.1.2");
  const l = (await yon("GET", "/api/admin/users?q=sayac@ornek")).govde.kullanicilar[0];
  assert.equal(l.bugunGiris, 2);
  assert.ok(l.sonGiris);
  assert.equal(d.oturumlar.length, 3, "kayıt + iki giriş = üç açık oturum");
});

test("engelle: süreli engel oturumları kapatır, API 403, giriş açıklayıcı mesajla reddedilir; süre dolunca kalkar", async () => {
  const yon = await yonetici();
  const o = await ogrenci("engel@ornek.com", "10.2.2.2");
  assert.equal((await yon("POST", "/api/admin/users/" + o.pid + "/engel", { sure: "7g" })).durum, 400, "neden zorunlu");
  assert.equal((await yon("POST", "/api/admin/users/" + o.pid + "/engel", { neden: "x", sure: "99g" })).durum, 400, "geçersiz süre");
  const r = await yon("POST", "/api/admin/users/" + o.pid + "/engel", { neden: "Spam mesaj", sure: "1g" });
  assert.equal(r.durum, 200);
  assert.ok(r.govde.engel.bitis);
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM sessions WHERE user_id = ? AND iptal IS NULL").get(o.uid).n, 0, "oturumlar kapandı");
  assert.ok(denetimVar("hesap.engellendi", o.uid));
  // Eski çerezle API çağrısı: 403 + engelli
  const a = await o("GET", "/api/state");
  assert.equal(a.durum, 403);
  assert.equal(a.govde.engelli, true);
  assert.equal((await o("GET", "/api/me")).durum, 403);
  // Giriş reddedilir; mesajda bitiş tarihi
  const g = await istemci("10.2.2.3")("POST", "/api/auth/login", { kimlik: "engel@ornek.com", sifre: "Deneme-12345" });
  assert.equal(g.durum, 403);
  assert.match(g.govde.error, /engellendi.*tarihinde kalkacak/);
  assert.ok(g.govde.engelBitis);
  // Listede engelli süzgeci
  assert.ok((await yon("GET", "/api/admin/users?varlik=engelli")).govde.kullanicilar.some(x => x.id === o.pid && x.engel && x.engel.neden === "Spam mesaj"));
  // Süre dolunca: giriş başarılı, engel kalkar, denetime yazılır
  db().prepare("UPDATE users SET engel_bitis = ? WHERE id = ?").run(new Date(Date.now() - 1000).toISOString(), o.uid);
  assert.equal((await istemci("10.2.2.3")("POST", "/api/auth/login", { kimlik: "engel@ornek.com", sifre: "Deneme-12345" })).durum, 200);
  assert.equal(db().prepare("SELECT durum, engel_zamani FROM users WHERE id = ?").get(o.uid).durum, "aktif");
  assert.ok(denetimVar("hesap.engel-sona-erdi", o.uid));
});

test("engelle: süresiz engel + engeli kaldır; kendini engelleyemez; zamanlayıcı süresi dolan engeli kaldırır", async () => {
  const yon = await yonetici();
  const o = await ogrenci("engel2@ornek.com", "10.3.3.3");
  assert.equal((await yon("POST", "/api/admin/users/" + o.pid + "/engel", { neden: "Kural ihlali", sure: "suresiz" })).govde.engel.bitis, null);
  const g = await istemci()("POST", "/api/auth/login", { kimlik: "engel2@ornek.com", sifre: "Deneme-12345" });
  assert.equal(g.durum, 403);
  assert.doesNotMatch(g.govde.error, /tarihinde/);
  assert.equal((await yon("POST", "/api/admin/users/" + o.pid + "/engel-kaldir", {})).durum, 200);
  assert.ok(denetimVar("hesap.engel-kaldirildi", o.uid));
  assert.equal((await yon("POST", "/api/admin/users/" + o.pid + "/engel-kaldir", {})).durum, 409);
  assert.equal((await istemci()("POST", "/api/auth/login", { kimlik: "engel2@ornek.com", sifre: "Deneme-12345" })).durum, 200);
  const yid = db().prepare("SELECT public_id FROM users WHERE eposta = 'yon2@ornek.com'").get().public_id;
  assert.equal((await yon("POST", "/api/admin/users/" + yid + "/engel", { neden: "x", sure: "1g" })).durum, 400);
  // Zamanlayıcı: süresi dolmuş engel kalkar
  await yon("POST", "/api/admin/users/" + o.pid + "/engel", { neden: "Kısa", sure: "1g" });
  db().prepare("UPDATE users SET engel_bitis = ? WHERE id = ?").run(new Date(Date.now() - 1000).toISOString(), o.uid);
  assert.equal(app.zamanlayici.erisimTemizligi(Date.now()).engel, 1);
  assert.equal(db().prepare("SELECT durum FROM users WHERE id = ?").get(o.uid).durum, "aktif");
});

test("oturumlar: tek oturumu ve tümünü kapat (denetimli)", async () => {
  const yon = await yonetici();
  const o = await ogrenci("oturum@ornek.com");
  const o2 = istemci();
  await o2("POST", "/api/auth/login", { kimlik: "oturum@ornek.com", sifre: "Deneme-12345" });
  let d = (await yon("GET", "/api/admin/users/" + o.pid)).govde;
  assert.equal(d.oturumlar.length, 2);
  const sid = db().prepare("SELECT id FROM sessions WHERE user_id = ? ORDER BY id LIMIT 1").get(o.uid).id;
  const r = await yon("POST", "/api/admin/users/" + o.pid + "/oturumlar/" + sid + "/kapat", {});
  assert.equal(r.durum, 200);
  assert.equal(r.govde.oturumlar.length, 1);
  assert.equal((await o("GET", "/api/me")).durum, 401, "ilk oturum kapandı");
  assert.equal((await o2("GET", "/api/me")).durum, 200, "diğeri açık");
  assert.equal((await yon("POST", "/api/admin/users/" + o.pid + "/oturumlar/kapat", {})).govde.kapanan, 1);
  assert.equal((await o2("GET", "/api/me")).durum, 401);
  assert.ok(denetimVar("oturum.kapat", o.uid) && denetimVar("oturum.tumunu-kapat", o.uid));
  assert.equal((await o2("POST", "/api/admin/users/" + o.pid + "/oturumlar/kapat", {})).durum, 401);
});

test("IP engeli: /24 aralığı giriş, kayıt ve API'yi engeller; yönetici kendi IP'sini engelleyemez; kaldırılınca açılır", async () => {
  assert.equal(kapsamNormal("203.0.113.9/24"), "203.0.113.0/24");
  assert.equal(kapsamNormal("::ffff:203.0.113.9"), "203.0.113.9");
  assert.equal(kapsamNormal("300.1.1.1"), null);
  assert.equal(kapsamNormal("abc"), null);
  assert.ok(ipEslesir("203.0.113.77", "203.0.113.0/24"));
  assert.ok(!ipEslesir("203.0.114.77", "203.0.113.0/24"));
  const yon = await yonetici();
  const o = await ogrenci("ipengel@ornek.com", "10.9.9.5");
  assert.equal((await yon("POST", "/api/admin/ip-engelleri", { kapsam: "10.0.0.1", neden: "x" })).durum, 400, "kendi IP'si");
  assert.equal((await yon("POST", "/api/admin/ip-engelleri", { kapsam: "bozuk", neden: "x" })).durum, 400);
  assert.equal((await o("POST", "/api/admin/ip-engelleri", { kapsam: "10.8.0.0/24", neden: "x" })).durum, 403, "öğrenci ekleyemez");
  const r = await yon("POST", "/api/admin/ip-engelleri", { kapsam: "10.9.9.0/24", neden: "Kaba kuvvet denemesi", sure: "7g" });
  assert.equal(r.durum, 200);
  assert.ok(r.govde.engel.etkin && r.govde.engel.bitis);
  assert.equal((await yon("POST", "/api/admin/ip-engelleri", { kapsam: "10.9.9.0/24", neden: "y" })).durum, 409);
  assert.equal((await o("GET", "/api/state")).durum, 403, "aralıktaki öğrencinin API'si");
  const yeni = istemci("10.9.9.200");
  const k = await yeni("POST", "/api/auth/register", { ad: "A", soyad: "B", eposta: "ipkayit@ornek.com", sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true });
  assert.equal(k.durum, 403);
  assert.equal(k.govde.ipEngeli, true);
  assert.equal((await yeni("POST", "/api/auth/login", { kimlik: "ipengel@ornek.com", sifre: "Deneme-12345" })).durum, 403);
  assert.equal((await yeni("GET", "/api/health")).durum, 200, "sağlık denetimi açık");
  assert.equal((await istemci("10.9.10.1")("POST", "/api/auth/login", { kimlik: "ipengel@ornek.com", sifre: "Deneme-12345" })).durum, 200, "aralık dışı");
  assert.equal((await yon("GET", "/api/admin/ip-engelleri")).govde.engeller.length, 1);
  assert.equal((await yon("DELETE", "/api/admin/ip-engelleri/" + r.govde.engel.id)).durum, 200);
  assert.equal((await o("GET", "/api/state")).durum, 200);
  assert.ok(denetimVar("ip-engel.ekle") && denetimVar("ip-engel.kaldir"));
});

test("bakım modu: yönetici dışındakilere HTML 503 + Retry-After, API 503; izinli yollar ve yönetici açık; kalıcı", async () => {
  const yon = await yonetici();
  const o = await ogrenci("bakim@ornek.com");
  const anon = istemci();
  assert.equal((await o("POST", "/api/admin/bakim", { acik: true })).durum, 403);
  assert.equal((await yon("POST", "/api/admin/bakim", { acik: "evet" })).durum, 400);
  const bitis = new Date(Date.now() + 2 * 3600e3).toISOString();
  const r = await yon("POST", "/api/admin/bakim", { acik: true, mesaj: "Veritabanı bakımı yapıyoruz.", bitis });
  assert.equal(r.durum, 200);
  assert.equal(r.govde.bakim.acik, true);
  // Sayfalar
  for (const yol of ["/", "/index.html", "/calis.html"]) {
    const s = await anon("GET", yol);
    assert.equal(s.durum, 503, yol);
    assert.match(s.govde, /Kısa bir bakımdayız/);
    assert.ok(+s.basliklar.get("retry-after") >= 60);
  }
  assert.equal((await o("GET", "/index.html")).durum, 503, "öğrenci de bakım sayfasını görür");
  for (const yol of ["/assets/css/styles.css", "/assets/js/app.js", "/favicon.svg", "/bakim.html", "/giris.html", "/admin.html"]) assert.equal((await anon("GET", yol)).durum, 200, yol);
  // API
  const a = await o("GET", "/api/state");
  assert.equal(a.durum, 503);
  assert.equal(a.govde.bakim, true);
  assert.equal(a.govde.mesaj, "Veritabanı bakımı yapıyoruz.");
  assert.equal(a.govde.bitis, bitis);
  assert.ok(a.basliklar.get("retry-after"));
  assert.equal((await o("GET", "/api/me")).durum, 200);
  assert.equal((await anon("GET", "/api/health")).govde.bakim, true);
  const cfg = (await anon("GET", "/api/public/config")).govde;
  assert.equal(cfg.bakim.acik, true);
  assert.equal(cfg.bakim.mesaj, "Veritabanı bakımı yapıyoruz.");
  assert.equal((await anon("POST", "/api/auth/register", { ad: "A" })).durum, 503);
  assert.equal((await anon("GET", "/api/admin/stats")).durum, 401, "yönetici uç noktası bakımda da kendi yetki denetimini yapar");
  // Yönetici her şeyi kullanır
  assert.equal((await yon("GET", "/index.html")).durum, 200);
  assert.equal((await yon("GET", "/api/state")).durum, 200);
  // Yönetici bakımda giriş yapabilir
  assert.equal((await istemci("10.0.0.1")("POST", "/api/auth/login", { kimlik: "yon2@ornek.com", sifre: "Yonetici-12345" })).durum, 200);
  // Kalıcılık: ayarlar tablosundan yeni bir servis aynı durumu okur (yeniden başlatma)
  assert.equal(bakimServisi(ayarServisi(db())).acikMi(), true);
  // Kapat
  assert.equal((await yon("POST", "/api/admin/bakim", { acik: false })).govde.bakim.acik, false);
  assert.equal((await anon("GET", "/index.html")).durum, 200);
  assert.equal((await o("GET", "/api/state")).durum, 200);
  assert.equal(bakimServisi(ayarServisi(db())).acikMi(), false);
  assert.ok(denetimVar("bakim.ac") && denetimVar("bakim.kapat"));
});

test("destek merkezi: hazır yanıtlar CRUD + denetim; iç not öğrenciye görünmez; yanıtla & kapat; atama; okunmamış", async () => {
  const yon = await yonetici();
  const o = await ogrenci("destek@ornek.com");
  assert.equal((await o("GET", "/api/admin/hazir-yanitlar")).durum, 403);
  assert.equal((await yon("POST", "/api/admin/hazir-yanitlar", { baslik: "", metin: "x" })).durum, 400);
  let r = await yon("POST", "/api/admin/hazir-yanitlar", { baslik: "Selamlama", metin: "Merhaba,\nSorunu inceledik." });
  assert.equal(r.durum, 200);
  const hid = r.govde.yanit.id;
  r = await yon("PUT", "/api/admin/hazir-yanitlar/" + hid, { baslik: "Selamlama 2", metin: "Merhaba!" });
  assert.equal(r.govde.yanit.baslik, "Selamlama 2");
  assert.equal((await yon("GET", "/api/admin/hazir-yanitlar")).govde.yanitlar.length, 1);
  assert.equal((await yon("DELETE", "/api/admin/hazir-yanitlar/" + hid)).durum, 200);
  assert.equal((await yon("DELETE", "/api/admin/hazir-yanitlar/" + hid)).durum, 404);
  ["hazir-yanit.ekle", "hazir-yanit.duzenle", "hazir-yanit.sil"].forEach(e => assert.ok(denetimVar(e), e));

  const sid = (await o("POST", "/api/sorular", { metin: "Türev sorusunu anlamadım: $x^2$", sayfa: "ap-calculus" })).govde.soru.id;
  let l = (await yon("GET", "/api/admin/sorular?durum=bekliyor")).govde;
  let q = l.sorular.find(x => x.id === sid);
  assert.equal(q.okunmamis, true);
  assert.ok(q.beklemeBaslangic);
  assert.ok(l.sayilar.bekliyor >= 1 && l.sayilar.okunmamis >= 1);
  assert.ok((await yon("GET", "/api/admin/sorular?durum=hepsi&q=Türev")).govde.sorular.some(x => x.id === sid), "arama");
  let d = (await yon("GET", "/api/admin/sorular/" + sid)).govde.soru;
  assert.equal(d.kullanici.varlik, "cevrimici");
  assert.equal((await yon("GET", "/api/admin/sorular?durum=bekliyor")).govde.sorular.find(x => x.id === sid).okunmamis, false, "açınca okundu");
  // İç not
  d = (await yon("POST", "/api/admin/sorular/" + sid + "/not", { metin: "Öğrenci daha önce de sordu." })).govde.soru;
  assert.equal(d.notlar.length, 1);
  const ogr = (await o("GET", "/api/sorular/" + sid)).govde.soru;
  assert.equal(ogr.notlar, undefined);
  assert.ok(!JSON.stringify(ogr).includes("daha önce de sordu"), "öğrenci iç notu görmez");
  // Atama
  assert.equal((await yon("POST", "/api/admin/sorular/" + sid + "/ata", { atanan: "u0000" })).durum, 400);
  d = (await yon("POST", "/api/admin/sorular/" + sid + "/ata", { atanan: "ben" })).govde.soru;
  assert.equal(d.atanan.ad, "Yönetici");
  assert.ok((await yon("GET", "/api/admin/sorular?durum=hepsi&atanan=ben")).govde.sorular.some(x => x.id === sid));
  assert.ok((await yon("GET", "/api/admin/yoneticiler")).govde.yoneticiler.length >= 1);
  // Yanıtla & kapat
  d = (await yon("POST", "/api/admin/sorular/" + sid + "/yanit", { metin: "Zincir kuralını kullan.", kapat: true })).govde.soru;
  assert.equal(d.durum, "kapandi");
  assert.equal((await o("POST", "/api/sorular/" + sid + "/mesaj", { metin: "teşekkürler" })).durum, 409);
  // Bekliyor'a al (eski uç nokta)
  assert.equal((await yon("POST", "/api/admin/sorular/" + sid + "/durum", { durum: "bekliyor" })).govde.soru.durum, "bekliyor");
  assert.ok(denetimVar("soru.not") && denetimVar("soru.ata"));
});

test("sistem: metrikler yalnızca yöneticiye; önbellek temizleme yönetici işi ve denetimli", async () => {
  const yon = await yonetici();
  const o = await ogrenci("sistem@ornek.com");
  assert.equal((await istemci()("GET", "/api/admin/sistem")).durum, 401);
  assert.equal((await o("GET", "/api/admin/sistem")).durum, 403);
  await istemci()("GET", "/kvkk.html"); // HTML önbelleğine en az bir girdi
  const s = (await yon("GET", "/api/admin/sistem")).govde;
  assert.equal(s.surum, require("../../package.json").version);
  assert.ok(s.calismaSn >= 0 && s.bellek.rss > 0 && s.bellek.heapKullanilan > 0);
  assert.ok(s.onbellek.girdi >= 1);
  assert.ok(typeof s.kuyruk.eposta.bekleyen === "number" && typeof s.kuyruk.push.abonelik === "number");
  assert.ok(s.istek && s.istek.seri.length === 15);
  assert.ok(s.oturum.aktif >= 1 && s.oturum.cevrimici >= 1);
  assert.ok("giris" in s.hizSinirlari && "soru" in s.hizSinirlari);
  assert.ok(Array.isArray(s.zamanlayici.isler) && s.zamanlayici.isler.some(i => i.ad === "hatirlatma"));
  assert.equal((await o("POST", "/api/admin/sistem/onbellek-temizle", {})).durum, 403);
  assert.equal((await istemci()("POST", "/api/admin/sistem/onbellek-temizle", {})).durum, 401);
  const t = await yon("POST", "/api/admin/sistem/onbellek-temizle", {});
  assert.equal(t.durum, 200);
  assert.ok(t.govde.temizlenen >= 1);
  assert.equal(t.govde.onbellek.girdi, 0);
  assert.ok(denetimVar("sistem.onbellek-temizle"));
  assert.equal((await yon("POST", "/api/admin/sistem/yedek", {})).durum, 409, "bellek içi veritabanı yedeklenemez");
  assert.equal((await yon("POST", "/api/admin/sistem/zamanlayici/yok", {})).durum, 404);
  assert.equal((await yon("POST", "/api/admin/sistem/zamanlayici/erisim", {})).govde.calisti, true);
  assert.equal((await yon("GET", "/api/admin/sistem/eposta?durum=bekleyen")).durum, 200);
  assert.equal((await yon("POST", "/api/admin/sistem/eposta/isle", {})).durum, 409, "SMTP yok");
});

test("KVKK: 90 günden eski IP'ler silinir; dışa aktarma yeni alanları içerir", async () => {
  const o = await ogrenci("kvkkip@ornek.com", "10.4.4.4");
  const eski = new Date(Date.now() - 100 * 864e5).toISOString();
  db().prepare("UPDATE users SET son_gorulme = ?, son_ip = '10.4.4.4', son_giris = ?, son_giris_ip = '10.4.4.4' WHERE id = ?").run(eski, eski, o.uid);
  db().prepare("UPDATE sessions SET son_kullanim = ?, son_gorulme = ? WHERE user_id = ?").run(eski, eski, o.uid);
  app.zamanlayici.erisimTemizligi(Date.now());
  const u = db().prepare("SELECT son_ip, son_giris_ip FROM users WHERE id = ?").get(o.uid);
  assert.equal(u.son_ip, null);
  assert.equal(u.son_giris_ip, null);
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM sessions WHERE user_id = ? AND (ip IS NOT NULL OR son_ip IS NOT NULL)").get(o.uid).n, 0);
  db().prepare("UPDATE sessions SET son_kullanim = ?, son_gorulme = NULL WHERE user_id = ?").run(new Date().toISOString(), o.uid);
  const x = (await o("GET", "/api/account/export")).govde;
  assert.ok("erisim" in x && Array.isArray(x.girisSayilari));
});

test("Android TWA: assetlinks.json yapılandırılmamışsa 404, .env değerleriyle JSON", async () => {
  const eski = config.android;
  try {
    config.android = { paket: "", sha256: [] };
    assert.equal((await fetch(base + "/.well-known/assetlinks.json")).status, 404);
    const fp = Array.from({ length: 32 }, () => "AB").join(":");
    config.android = { paket: "com.meberra.app", sha256: [fp] };
    const r = await fetch(base + "/.well-known/assetlinks.json");
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /^application\/json/);
    const j = await r.json();
    assert.equal(j[0].target.package_name, "com.meberra.app");
    assert.deepEqual(j[0].target.sha256_cert_fingerprints, [fp]);
    assert.deepEqual(j[0].relation, ["delegate_permission/common.handle_all_urls"]);
    assert.equal((await fetch(base + "/.well-known/baska.json")).status, 404, "yalnızca assetlinks açık");
  } finally { config.android = eski; }
});

test("sağlık: sürüm package.json'dan", async () => {
  const h = (await istemci()("GET", "/api/health")).govde;
  assert.equal(h.surum, require("../../package.json").version);
  assert.equal(h.bakim, false);
});
