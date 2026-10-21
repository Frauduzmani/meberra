"use strict";
// v1.17.0 Hız turu + Günün sorusu: kuyruk (aktif, kolay/orta, hesap makinesiz, ücretsiz ünite), sunucu süresi, puan/kombo,
// cevapların cevaplanana dek gizli olması, mevcut cevap hattına yazım, günün sorusunun belirlenimliliği ve topluluk istatistiği, oturum.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { olustur } = require("../uygulama");
const H = require("../hiz");
const kural = require("../../assets/js/ucretsiz-kural.js");

let app, base, SAAT = Date.parse("2026-11-02T09:00:00Z");
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, gunlukKonsol: false, varlikOtomatik: false,
    hizSaat: () => SAAT, hizBasSiniri: 1000, hizCevapSiniri: 5000 });
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
    return { durum: r.status, govde: tur.includes("json") ? await r.json() : await r.text() };
  };
}
const db = () => app.db;
let sayac = 0;
async function ogrenci(premium) {
  const c = istemci(), ep = "hiz" + (++sayac) + "@ornek.com";
  const r = await c("POST", "/api/auth/register", { ad: "Ada", soyad: "Kaya", eposta: ep, sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true });
  assert.equal(r.durum, 200, JSON.stringify(r.govde));
  c.uid = db().prepare("SELECT id FROM users WHERE public_id = ?").get(r.govde.user.id).id;
  if (premium) app.hesap.premiumVer(c.uid, "aylik", null, { kaynak: "elle" });
  return c;
}
const satir = id => { const r = db().prepare("SELECT * FROM questions_bank WHERE id = ?").get(id); r.ek = JSON.parse(r.ek || "{}"); return r; };
const GIZLI = ["dogru", "dogruSecenek", "aciklama", "cozum", "hatalar", "genelHatirlatma"];
function gizliVar(o) {
  if (Array.isArray(o)) return o.some(gizliVar);
  if (o && typeof o === "object") return Object.keys(o).some(k => GIZLI.includes(k) || gizliVar(o[k]));
  return false;
}

test("saf: kombo çarpanı (×2 üç doğrudan sonra, ×3 altıdan sonra), yanlış sıfırlar, süre toleransı", () => {
  assert.deepEqual([0, 1, 2, 3, 5, 6, 10].map(H.carpan), [1, 1, 1, 2, 2, 3, 3]);
  assert.deepEqual(H.puanla(2, true), { kombo: 3, carpan: 1, kazanilan: 10 });
  assert.deepEqual(H.puanla(3, true), { kombo: 4, carpan: 2, kazanilan: 20 });
  assert.deepEqual(H.puanla(7, false), { kombo: 0, carpan: 1, kazanilan: 0 });
  assert.deepEqual(H.toplamPuan([1, 1, 1, 1, 1, 1, 1]), { puan: 10 * 3 + 20 * 3 + 30, enKombo: 7 });
  assert.equal(H.sureDurum(1000, 999).bitti, false);
  assert.equal(H.sureDurum(1000, 1000 + H.KURAL.toleransMs).gecikti, true);
  assert.equal(H.sureDurum(1000, 1001 + H.KURAL.toleransMs).bitti, true);
  assert.equal(H.gunSerisi(["2026-11-01", "2026-10-31", "2026-10-29"], "2026-11-02"), 2, "bugün cevaplanmadıysa dünden sayılır");
  assert.equal(H.gunSerisi(["2026-11-02", "2026-11-01"], "2026-11-02"), 2);
});

test("oturum gerekir (401) ve geçersiz ders 400", async () => {
  const g = istemci();
  for (const [y, p] of [["POST", "/api/hiz/basla"], ["POST", "/api/hiz/cevap"], ["GET", "/api/hiz/rekorlar"], ["GET", "/api/gunun-sorusu"], ["POST", "/api/gunun-sorusu/cevap"]])
    assert.equal((await g(y, p, y === "GET" ? undefined : {})).durum, 401, p);
  const c = await ogrenci();
  assert.equal((await c("POST", "/api/hiz/basla", { ders: "astroloji" })).durum, 400);
});

test("hız turu kuyruğu: yalnız aktif, kolay/orta, hesap makinesiz; ücretsiz kullanıcıya yalnız ücretsiz üniteler; cevap gizli", async () => {
  const c = await ogrenci();
  // Bir uygun soruyu arşivle: kuyruğa asla girmemeli
  const arsiv = db().prepare("SELECT id FROM questions_bank WHERE tur='ders' AND durum='aktif' AND sayfa='ap-calculus' AND zorluk='easy' AND kutu='calc-unit1-quiz-container' LIMIT 1").get().id;
  db().prepare("UPDATE questions_bank SET durum='arsiv' WHERE id = ?").run(arsiv);
  try {
    for (let i = 0; i < 4; i++) {
      const r = await c("POST", "/api/hiz/basla", { ders: "calculus" });
      assert.equal(r.durum, 200, JSON.stringify(r.govde));
      assert.ok(!gizliVar(r.govde.soru), "ilk soruda cevap yok");
      const kuyruk = JSON.parse(db().prepare("SELECT kuyruk FROM hiz_turlari WHERE id = ?").get(r.govde.oturum).kuyruk);
      assert.ok(kuyruk.length >= 5 && kuyruk.length <= 40);
      kuyruk.forEach(id => {
        const s = satir(id);
        assert.equal(s.durum, "aktif"); assert.equal(s.sayfa, "ap-calculus"); assert.ok(["easy", "medium"].includes(s.zorluk), s.zorluk);
        assert.equal(H.hmDuzey(s.ek), "gerekmez"); assert.equal(s.pasaj, null);
        assert.ok(kural.apKutuUcretsizMi(s.sayfa, s.kutu), "ücretsiz ünite: " + s.kutu);
        assert.notEqual(id, arsiv);
      });
    }
    const p = await ogrenci(true);
    const r = await p("POST", "/api/hiz/basla", { ders: "calculus" });
    const kuyruk = JSON.parse(db().prepare("SELECT kuyruk FROM hiz_turlari WHERE id = ?").get(r.govde.oturum).kuyruk);
    assert.equal(kuyruk.length, 40);
  } finally { db().prepare("UPDATE questions_bank SET durum='aktif' WHERE id = ?").run(arsiv); }
});

test("puan ve kombo sunucuda; yalnız sıradaki soru; cevap mevcut hatta (answers) yazılır; süre sonrası 409; rekorlar", async () => {
  const c = await ogrenci(true);
  SAAT = Date.parse("2026-11-02T10:00:00Z");
  const b = await c("POST", "/api/hiz/basla", { ders: "physics" });
  assert.equal(b.durum, 200);
  const oturum = b.govde.oturum;
  let soru = b.govde.soru, puan = 0;
  // sıra dışı soru reddedilir
  const kuyruk = JSON.parse(db().prepare("SELECT kuyruk FROM hiz_turlari WHERE id = ?").get(oturum).kuyruk);
  assert.equal((await c("POST", "/api/hiz/cevap", { oturum, soruId: kuyruk[3], secim: "A" })).durum, 409);
  const beklenen = [];
  for (let i = 0; i < 8; i++) {
    const s = satir(soru.id), dogruMu = i !== 4;
    const secim = dogruMu ? s.dogru : JSON.parse(s.secenekler).find(o => o.id !== s.dogru).id;
    const r = await c("POST", "/api/hiz/cevap", { oturum, soruId: soru.id, secim });
    assert.equal(r.durum, 200, JSON.stringify(r.govde));
    assert.equal(r.govde.dogru, dogruMu); assert.equal(r.govde.dogruSecenek, s.dogru);
    assert.ok(!gizliVar(r.govde.sonraki), "sonraki soruda cevap yok");
    beklenen.push(dogruMu);
    puan = H.toplamPuan(beklenen).puan;
    assert.equal(r.govde.puan, puan);
    soru = r.govde.sonraki;
    SAAT += 3000;
  }
  // 4 doğru (10+10+10+20), yanlış, 3 doğru (10+10+10)
  assert.equal(puan, 50 + 30);
  const n = db().prepare("SELECT COUNT(*) AS n FROM answers WHERE user_id = ? AND sayfa = 'ap-physics'").get(c.uid).n;
  assert.equal(n, 8, "cevaplar answers tablosunda");
  // aynı soruya ikinci cevap: sıra ilerlediği için 409
  // süre dolunca (60 sn + tolerans) 409 + sonuç
  SAAT = Date.parse("2026-11-02T10:00:00Z") + 60000 + H.KURAL.toleransMs + 1;
  const g = await c("POST", "/api/hiz/cevap", { oturum, soruId: soru.id, secim: "A" });
  assert.equal(g.durum, 409); assert.equal(g.govde.bitti, true); assert.equal(g.govde.sonuc.puan, 80); assert.equal(g.govde.sonuc.yeniRekor, true);
  const rk = await c("GET", "/api/hiz/rekorlar");
  assert.equal(rk.govde.rekorlar.physics.puan, 80); assert.equal(rk.govde.son.length, 1); assert.equal(rk.govde.son[0].enKombo, 4);
  // başka kullanıcı bu tura erişemez
  const d = await ogrenci();
  assert.equal((await d("POST", "/api/hiz/cevap", { oturum, soruId: soru.id, secim: "A" })).durum, 404);
});

test("tolerans içinde gelen son cevap kabul edilir, sonraki soru gelmez ve tur kapanır; pas komboyu sıfırlar", async () => {
  const c = await ogrenci(true);
  SAAT = Date.parse("2026-11-02T11:00:00Z");
  const b = await c("POST", "/api/hiz/basla", { ders: "biology" });
  const s0 = b.govde.soru;
  const p = await c("POST", "/api/hiz/cevap", { oturum: b.govde.oturum, soruId: s0.id, pas: true });
  assert.equal(p.durum, 200); assert.equal(p.govde.kombo, 0); assert.equal(p.govde.kazanilan, 0);
  SAAT += 60000 + 1000;
  const s1 = p.govde.sonraki, row = satir(s1.id);
  const r = await c("POST", "/api/hiz/cevap", { oturum: b.govde.oturum, soruId: s1.id, secim: row.dogru });
  assert.equal(r.durum, 200); assert.equal(r.govde.dogru, true); assert.equal(r.govde.sonraki, null); assert.equal(r.govde.bitti, true);
  assert.equal(r.govde.sonuc.puan, 10);
});

test("karışık: profildeki AP derslerinden; ders seçimi yoksa tüm dersler", async () => {
  const c = await ogrenci(true);
  db().prepare("INSERT INTO profiles (user_id, veri, guncelleme) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET veri = excluded.veri")
    .run(c.uid, JSON.stringify({ apDersleri: [{ ders: "chemistry", hedef: 4 }, { ders: "biology", hedef: 5 }] }), new Date().toISOString());
  const b = await c("POST", "/api/hiz/basla", { ders: "karisik" });
  assert.equal(b.durum, 200, JSON.stringify(b.govde));
  const kuyruk = JSON.parse(db().prepare("SELECT kuyruk FROM hiz_turlari WHERE id = ?").get(b.govde.oturum).kuyruk);
  const sayfalar = new Set(kuyruk.map(id => satir(id).sayfa));
  assert.ok([...sayfalar].every(s => s === "ap-chemistry" || s === "ap-biology"), [...sayfalar].join(","));
});

test("günün sorusu: tarihe göre belirlenimli, ücretsiz/aktif/orta; cevap önce gizli; anonim dağılım; seri; tekrar sayılmaz", async () => {
  const havuz = [{ id: "b", sayfa: "ap-calculus" }, { id: "a", sayfa: "ap-calculus" }, { id: "c", sayfa: "ap-physics" }];
  assert.equal(H.gununSorusuSec(havuz, "2026-11-02"), H.gununSorusuSec(havuz.slice().reverse(), "2026-11-02"), "sıra bağımsız");
  const gunler = ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"].map(t => H.gununSorusuSec(havuz, t));
  assert.ok(gunler.some(id => id === "c") && gunler.some(id => id !== "c"), "ders döner");
  assert.equal(H.gununSorusuSec([], "2026-11-02"), null);

  SAAT = Date.parse("2026-11-02T09:00:00Z");
  const a = await ogrenci(), b = await ogrenci();
  const r1 = await a("GET", "/api/gunun-sorusu"), r2 = await b("GET", "/api/gunun-sorusu");
  assert.equal(r1.durum, 200); assert.equal(r1.govde.soru.id, r2.govde.soru.id, "herkese aynı soru");
  assert.equal(r1.govde.cevaplandi, false); assert.ok(!gizliVar(r1.govde.soru)); assert.equal(r1.govde.sonuc, undefined);
  const s = satir(r1.govde.soru.id);
  assert.equal(s.durum, "aktif"); assert.equal(s.zorluk, "medium"); assert.ok(kural.apKutuUcretsizMi(s.sayfa, s.kutu));
  const yanlisSik = JSON.parse(s.secenekler).find(o => o.id !== s.dogru).id;
  const c1 = await a("POST", "/api/gunun-sorusu/cevap", { soruId: s.id, secim: s.dogru });
  assert.equal(c1.durum, 200); assert.equal(c1.govde.dogru, true); assert.ok(c1.govde.aciklama !== undefined); assert.ok(c1.govde.ek);
  assert.equal(c1.govde.istatistik.toplam, 1); assert.equal(c1.govde.istatistik.dogruYuzde, 100); assert.equal(c1.govde.seri, 1);
  const c2 = await b("POST", "/api/gunun-sorusu/cevap", { soruId: s.id, secim: yanlisSik });
  assert.equal(c2.govde.dogru, false); assert.equal(c2.govde.istatistik.toplam, 2); assert.equal(c2.govde.istatistik.dogruYuzde, 50);
  assert.equal(c2.govde.istatistik.dagilim.find(x => x.secim === yanlisSik).n, 1);
  // tekrar cevap: sayılmaz, ilk cevap korunur
  const c3 = await b("POST", "/api/gunun-sorusu/cevap", { soruId: s.id, secim: s.dogru });
  assert.equal(c3.govde.tekrar, true); assert.equal(c3.govde.istatistik.toplam, 2); assert.equal(c3.govde.secim, yanlisSik);
  // anonim: dağılım tablosunda kullanıcı yok, katılım tablosunda şık yok
  assert.deepEqual(db().prepare("PRAGMA table_info(gunun_sorusu_dagilim)").all().map(x => x.name).sort(), ["n", "secim", "tarih"]);
  assert.deepEqual(db().prepare("PRAGMA table_info(gunun_sorusu_katilim)").all().map(x => x.name).sort(), ["tarih", "user_id"]);
  // kendi cevabı mevcut hatta
  assert.equal(db().prepare("SELECT COUNT(*) AS n FROM answers WHERE user_id = ? AND soru = ?").get(a.uid, s.id).n, 1);
  const g = await a("GET", "/api/gunun-sorusu");
  assert.equal(g.govde.cevaplandi, true); assert.equal(g.govde.sonuc.secim, s.dogru); assert.equal(g.govde.sonuc.dogruSecenek, s.dogru);
  // ertesi gün: yeni soru (ya da aynı havuzdan belirlenimli), seri 2
  SAAT += 864e5;
  const y = await a("GET", "/api/gunun-sorusu");
  assert.equal(y.govde.cevaplandi, false); assert.equal(y.govde.seri, 1, "bugün henüz cevaplanmadı → dünkü seri");
  const ys = satir(y.govde.soru.id);
  const yc = await a("POST", "/api/gunun-sorusu/cevap", { soruId: ys.id, secim: ys.dogru });
  assert.equal(yc.govde.seri, 2);
  // gün içinde sabit: aynı tarihte aynı soru
  assert.equal((await b("GET", "/api/gunun-sorusu")).govde.soru.id, ys.id);
});
