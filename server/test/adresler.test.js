"use strict";
// 1.8.0 Temiz adresler: her temiz yol doğru dosyayı sunar; eski /x.html adresleri 301 (sorgu korunur); yönetim adresi
// yalnızca yönetici oturumuna açık (diğerlerine 404, yönlendirme yok); bilinmeyen yol 404 sayfası; bakım modu temiz
// yollarla çalışır; kök "/" ziyaretçiye tanıtım, oturumluya ana ekran; canonical ve sayfa kimliği etiketi.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const config = require("../config");
const { olustur } = require("../uygulama");
const ADRES = require("../adresler");
const ORTAK = require("../../assets/js/adresler.js");

let app, base;
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, gunlukKonsol: false, varlikOtomatik: false });
  await new Promise(r => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
});
after(() => new Promise(r => app.server.close(r)));

/** Yönlendirmeleri İZLEMEYEN istemci (Location başlığını görmek için) */
function istemci() {
  let cerez = "";
  const c = async function (yontem, yol, govde) {
    const h = Object.assign({ "Content-Type": "application/json" }, yontem === "GET" || yontem === "HEAD" ? {} : { "X-Meberra": "1" }, cerez ? { Cookie: cerez } : {});
    const r = await fetch(base + yol, { method: yontem, headers: h, redirect: "manual", body: govde === undefined ? undefined : JSON.stringify(govde) });
    const sc = r.headers.get("set-cookie");
    if (sc) { const m = /meberra_sid=([^;]*)/.exec(sc); if (m) cerez = m[1] ? "meberra_sid=" + m[1] : ""; }
    const tur = r.headers.get("content-type") || "";
    return { durum: r.status, yer: r.headers.get("location"), basliklar: r.headers, govde: tur.includes("json") ? await r.json() : await r.text() };
  };
  return c;
}
async function ogrenci(ep) {
  const c = istemci();
  const r = await c("POST", "/api/auth/register", { ad: "Ece", soyad: "Demir", eposta: ep, sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  c.pid = r.govde.user.id;
  return c;
}
let yonC = null;
async function yonetici() {
  if (yonC) return yonC;
  app.hesap.yoneticiHazirla("adres-yon@ornek.com", "Yonetici-12345");
  yonC = istemci();
  assert.equal((await yonC("POST", "/api/auth/login", { kimlik: "adres-yon@ornek.com", sifre: "Yonetici-12345" })).durum, 200);
  return yonC;
}
const sayfaKimligi = govde => (/<meta name="meberra-sayfa" content="([^"]+)">/.exec(govde) || [])[1];
const KOK = path.join(__dirname, "..", "..");

test("tablo: her kayıtlı dosya diskte var; kökteki her sayfa tabloda (404.html hariç); yönetim yolu ortak tabloda yok", () => {
  for (const g of ADRES.LISTE) assert.ok(fs.existsSync(path.join(KOK, g.dosya)), g.dosya);
  const kokSayfalar = fs.readdirSync(KOK).filter(f => /\.html$/.test(f) && f !== "404.html");
  for (const f of kokSayfalar) assert.ok(ADRES.dosyadan(f), "tabloda yok: " + f);
  assert.equal(ORTAK.yoldan("/yonetim"), null);
  assert.ok(!JSON.stringify(ORTAK.LISTE).includes("admin"));
  assert.ok(!fs.readFileSync(path.join(KOK, "assets/js/adresler.js"), "utf8").includes("/yonetim"));
  // yardımcılar
  assert.equal(ORTAK.temiz("sartlar.html?ulke=de#x"), "/ulkem?ulke=de#x");
  assert.equal(ORTAK.temiz("/ap-calculus.html#q-card-1"), "/ders/calculus#q-card-1");
  assert.equal(ORTAK.temiz("https://x.ch/index.html"), "https://x.ch/index.html");
  assert.equal(ORTAK.temiz("/bugun"), "/bugun");
  assert.equal(ORTAK.sayfa("/ders/calculus"), "ap-calculus");
  assert.equal(ORTAK.sayfa("/kayit"), "giris");
  assert.equal(ORTAK.sayfa("/"), "vitrin");
  assert.equal(ORTAK.sayfa("/bugun/"), "index");
  assert.equal(ORTAK.sayfaAdres("rota"), "/takvim");
});

test("her temiz yol 200 ve doğru dosyayı sunar (ziyaretçi; yönetim hariç)", async () => {
  const c = istemci();
  for (const g of ADRES.LISTE.filter(x => !x.yonetici)) {
    const r = await c("GET", g.yol);
    assert.equal(r.durum, 200, g.yol);
    assert.match(r.basliklar.get("content-type"), /text\/html/);
    assert.equal(sayfaKimligi(r.govde), g.dosya.replace(/\.html$/, ""), g.yol);
    assert.match(r.govde, /<meta name="meberra-api" content="1">/);
    assert.equal((await c("HEAD", g.yol)).durum, 200, "HEAD " + g.yol);
  }
});

test("canonical yalnızca herkese açık sayfalarda, BASE_URL + temiz yol", async () => {
  const c = istemci();
  for (const g of ADRES.LISTE.filter(x => !x.yonetici)) {
    const r = await c("GET", g.yol);
    const m = /<link rel="canonical" href="([^"]+)">/.exec(r.govde);
    if (g.herkese) assert.equal(m && m[1], config.baseUrl + g.yol, g.yol);
    else assert.equal(m, null, g.yol);
  }
});

test("eski .html adresleri 301 ile temiz yola (sorgu korunur); bilinmeyen .html 404", async () => {
  const c = istemci();
  const bekle = [
    ["/index.html", "/bugun"], ["/vitrin.html", "/"], ["/sartlar.html?ulke=de&sinif=11", "/ulkem?ulke=de&sinif=11"],
    ["/profil.html?soru=1", "/profil?soru=1"], ["/ap-calculus.html?unite=3", "/ders/calculus?unite=3"],
    ["/sinav-cents.html", "/ders/cent-s"], ["/giris.html?davet=ABCDEFGH", "/giris?davet=ABCDEFGH"],
    ["/sifre-sifirla.html?t=x%2By", "/sifre-sifirla?t=x%2By"], ["/veli.html?t=abc", "/veli?t=abc"], ["/rota.html", "/takvim"],
    ["/yazismalar.html?sablon=x", "/basvurular?sablon=x"], ["/bilgi-merkezi.html", "/kaynaklar"], ["/mezun.html?ulke=hu", "/mezun?ulke=hu"],
    ["/istanbul-sinav-rehberi.html", "/rehber/istanbul-sinav"], ["/bakim.html", "/bakim"],
    // ders/rehber sayfasına göre çözülmüş eski göreli bağlantılar
    ["/ders/calis.html", "/calis"], ["/rehber/sartlar.html?x=1", "/ulkem?x=1"], ["/ders/assets/css/styles.css?v=1", "/assets/css/styles.css?v=1"],
    ["/bugun/", "/bugun"]
  ];
  for (const [eski, yeni] of bekle) {
    const r = await c("GET", eski);
    assert.equal(r.durum, 301, eski);
    assert.equal(r.yer, yeni, eski);
  }
  for (const y of ["/yok.html", "/404.html", "/ornek/maskot.html", "/ders/yok.html"]) {
    const r = await c("GET", y);
    assert.equal(r.durum, 404, y);
  }
});

test("yönetim: /yonetim ve /admin.html ziyaretçiye ve öğrenciye 404 (yönlendirme yok); yöneticiye 200 / 301", async () => {
  const anon = istemci(), o = await ogrenci("adres-ogr@ornek.com"), yon = await yonetici();
  const bulunamadi = (await anon("GET", "/olmayan-sayfa")).govde;
  for (const c of [anon, o]) {
    for (const y of ["/yonetim", "/admin.html", "/yonetim?x=1"]) {
      const r = await c("GET", y);
      assert.equal(r.durum, 404, y);
      assert.equal(r.yer, null, y);
      assert.equal(r.govde, bulunamadi, "yönetim adresinin 404'ü sıradan 404 ile aynı: " + y);
      assert.doesNotMatch(r.govde, /yonetim/);
    }
  }
  const r = await yon("GET", "/yonetim");
  assert.equal(r.durum, 200);
  assert.equal(sayfaKimligi(r.govde), "admin");
  assert.match(r.basliklar.get("cache-control"), /private/);
  const y = await yon("GET", "/admin.html?x=1");
  assert.equal(y.durum, 301);
  assert.equal(y.yer, "/yonetim?x=1");
  assert.match(y.basliklar.get("cache-control"), /private/);
  // Herkese açık dosyalarda yönetim yolu geçmez
  for (const f of ["robots.txt", "sitemap.xml", "manifest.webmanifest", "sw.js"]) assert.doesNotMatch(fs.readFileSync(path.join(KOK, f), "utf8"), /yonetim/, f);
});

test("bilinmeyen yol: HTML 404 sayfası (maskotlu 404.html); varlık 404 kısa metin; API JSON 404", async () => {
  const c = istemci();
  const r = await c("GET", "/boyle-bir-sayfa-yok");
  assert.equal(r.durum, 404);
  assert.match(r.basliklar.get("content-type"), /text\/html/);
  assert.equal(sayfaKimligi(r.govde), "404");
  assert.match(r.govde, /<title>[^<]*bulunamad/i);
  const d = await c("GET", "/ders/yok-ders");
  assert.equal(d.durum, 404);
  const v = await c("GET", "/assets/js/yok.js");
  assert.equal(v.durum, 404);
  assert.match(v.basliklar.get("content-type"), /text\/plain/);
  const a = await c("GET", "/api/yok");
  assert.equal(a.durum, 404);
  assert.equal(a.govde.ok, false);
});

test("kök: ziyaretçiye tanıtım (vitrin), öğrenciye 302 /bugun, veliye 302 /veli, yöneticiye 302 /bugun", async () => {
  const anon = istemci();
  const r = await anon("GET", "/");
  assert.equal(r.durum, 200);
  assert.equal(sayfaKimligi(r.govde), "vitrin");
  const o = await ogrenci("adres-kok@ornek.com");
  let k = await o("GET", "/");
  assert.equal(k.durum, 302); assert.equal(k.yer, "/bugun");
  const v = await ogrenci("adres-veli@ornek.com");
  app.db.prepare("UPDATE users SET rol = 'veli' WHERE public_id = ?").run(v.pid);
  k = await v("GET", "/");
  assert.equal(k.durum, 302); assert.equal(k.yer, "/veli");
  const yon = await yonetici();
  k = await yon("GET", "/");
  assert.equal(k.durum, 302); assert.equal(k.yer, "/bugun");
  // Geçersiz çerez: ziyaretçi gibi
  const s = await fetch(base + "/", { redirect: "manual", headers: { Cookie: "meberra_sid=bozuk" } });
  assert.equal(s.status, 200);
});

test("bakım modu temiz yollarla: sayfalar 503, /giris ve /bakim açık, varlıklar açık, /yonetim yalnızca yöneticiye", async () => {
  const yon = await yonetici(), anon = istemci(), o = await ogrenci("adres-bakim@ornek.com");
  assert.equal((await yon("POST", "/api/admin/bakim", { acik: true, mesaj: "Kısa bakım" })).durum, 200);
  try {
    for (const y of ["/", "/bugun", "/ders/calculus", "/ulkem", "/kayit", "/fiyatlar"]) {
      const r = await anon("GET", y);
      assert.equal(r.durum, 503, y);
      assert.equal(sayfaKimligi(r.govde), "bakim", y);
      assert.ok(+r.basliklar.get("retry-after") >= 60, y);
    }
    assert.equal((await o("GET", "/ders/calculus")).durum, 503);
    for (const y of ["/giris", "/bakim", "/assets/css/styles.css", "/assets/js/adresler.js", "/manifest.webmanifest"]) assert.equal((await anon("GET", y)).durum, 200, y);
    // eski adres önce 301, sonra temiz yolda bakım
    const e = await anon("GET", "/calis.html?a=1");
    assert.equal(e.durum, 301); assert.equal(e.yer, "/calis?a=1");
    assert.equal((await anon("GET", "/yonetim")).durum, 404);
    assert.equal((await yon("GET", "/yonetim")).durum, 200);
    assert.equal((await yon("GET", "/ders/calculus")).durum, 200, "yönetici bakımı atlar");
  } finally {
    assert.equal((await yon("POST", "/api/admin/bakim", { acik: false })).durum, 200);
  }
  assert.equal((await anon("GET", "/bugun")).durum, 200);
});

test("sunucunun ürettiği bağlantılar temiz: davet, şifre sıfırlama, soru yanıtı bildirimi", async () => {
  for (const f of ["hesap.js", "kampanya.js", "soru.js", "veli.js", "lig.js", "zamanlayici.js", "yonetim.js"]) {
    const s = fs.readFileSync(path.join(__dirname, "..", f), "utf8");
    assert.doesNotMatch(s, /["'`]\/[a-z0-9-]+\.html/, f + " içinde eski .html bağlantısı");
  }
  const sm = fs.readFileSync(path.join(KOK, "sitemap.xml"), "utf8");
  assert.doesNotMatch(sm, /\.html/);
  for (const y of ADRES.herkeseAcik()) assert.ok(sm.includes("<loc>https://meberra.com" + y + "</loc>"), y);
  const mf = JSON.parse(fs.readFileSync(path.join(KOK, "manifest.webmanifest"), "utf8"));
  assert.equal(mf.start_url, "/bugun"); assert.equal(mf.id, "/bugun"); assert.equal(mf.scope, "/");
});

test("sayfalarda göreli varlık/sayfa bağlantısı kalmadı (ders sayfaları /ders/ altında da çalışsın)", () => {
  const { donustur } = require("../../araclar/adres-donustur.js");
  const sayfalar = fs.readdirSync(KOK).filter(f => /\.html$/.test(f));
  for (const f of sayfalar) {
    const s = fs.readFileSync(path.join(KOK, f), "utf8");
    assert.equal(donustur(s, true), s, f + ": dönüştürücü değişiklik buldu (node araclar/adres-donustur.js)");
    assert.doesNotMatch(s, /(?:href|src)="(?!\/|#|https?:|mailto:|tel:|data:|javascript:|'|\$\{)[^"]+"/, f + ": göreli href/src");
  }
});
