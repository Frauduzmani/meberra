"use strict";
// 1.19.0 KVKK: göç 010–016 tablolarının dışa aktarım + hesap silme kapsamı; odakDk birleştirme. node --test server/test/kvkk-119.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { olustur } = require("../uygulama");
const { oyunBirlestir, odakDkBirlestir } = require("../veri");

let app, base;
before(async () => {
  app = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, gunlukKonsol: false });
  await new Promise(r => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
});
after(() => new Promise(r => app.server.close(r)));
const SIFRE = "Deneme-12345";
async function kayit(ep) {
  const r = await fetch(base + "/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json", "X-Meberra": "1" },
    body: JSON.stringify({ ad: "Ayşe", soyad: "Yılmaz", eposta: ep, sifre: SIFRE, sifre2: SIFRE, kosullar: true, kvkk: true, veliOnay: true }) });
  const j = await r.json();
  assert.equal(r.status, 200, JSON.stringify(j));
  return app.db.prepare("SELECT * FROM users WHERE public_id = ?").get(j.user.id);
}

test("odakDk: gün başına büyük değer, geçersiz anahtar/değer atlanır, yalnızca varsa yazılır", () => {
  assert.deepEqual(odakDkBirlestir({ "2026-10-20": 25, "2026-10-21": 10, kotu: 5 }, { "2026-10-21": 40, "2026-10-22": -3 }), { "2026-10-20": 25, "2026-10-21": 40 });
  const o = oyunBirlestir({ xp: 5, odakDk: { "2026-10-21": 15 } }, { xp: 9, odakDk: { "2026-10-21": 12 } });
  assert.equal(o.odakDk["2026-10-21"], 15);
  assert.ok(!("odakDk" in oyunBirlestir({ xp: 1 }, { xp: 2 })));
});

test("KVKK: yeni tablolar dışa aktarılır; hesap silinince öğrenci satırları ve sınıf üyeliği silinir, öğretmenin sınıfı kalır", async () => {
  const u = await kayit("kvkk119@ornek.com"), ogt = await kayit("kvkk119-ogt@ornek.com");
  const d = app.db, z = new Date().toISOString();
  d.prepare("INSERT INTO hiz_turlari (id, user_id, ders, kuyruk, baslangic, bitis, olusturma) VALUES ('hz-1', ?, 'calculus', '[]', 1, 2, ?)").run(u.id, z);
  d.prepare("INSERT INTO gunun_sorusu_katilim (user_id, tarih) VALUES (?, '2026-10-21')").run(u.id);
  d.prepare("INSERT INTO kart_durumu (user_id, kart_id, aralik, sonraki, son_sonuc, son_gun, guncelleme) VALUES (?, 'calc-u1-01', 3, '2026-10-24', 'biliyorum', '2026-10-21', ?)").run(u.id, z);
  d.prepare("INSERT INTO plan_ayar (user_id, saat, created, updated) VALUES (?, 5, ?, ?)").run(u.id, z, z);
  d.prepare("INSERT INTO plan_gorevler (user_id, id, hafta, ilk_hafta, veri, created) VALUES (?, 'g1', '2026-10-19', '2026-10-19', '{}', ?)").run(u.id, z);
  d.prepare("INSERT INTO tam_sinavlar (id, user_id, kod, plan, veri, olusturma) VALUES ('ts-1', ?, 'calculus-ab', '{}', '{}', ?)").run(u.id, z);
  const okul = Number(d.prepare("INSERT INTO okullar (ad, olusturma) VALUES ('Deneme Lisesi', ?)").run(z).lastInsertRowid);
  const sinif = Number(d.prepare("INSERT INTO siniflar (okul_id, ogretmen_id, ad, ders, kod, olusturma) VALUES (?, ?, '11-A', 'calculus-ab', 'ABCDEF', ?)").run(okul, ogt.id, z).lastInsertRowid);
  d.prepare("INSERT INTO sinif_uyeleri (sinif_id, ogrenci_id, katilma) VALUES (?, ?, ?)").run(sinif, u.id, z);
  d.prepare("INSERT INTO odevler (sinif_id, baslik, tur, olusturma, olusturan) VALUES (?, 'Ünite 1', 'unite', ?, ?)").run(sinif, z, ogt.id);
  d.prepare("INSERT INTO ogretmenler (okul_id, user_id, eposta, belirtec_hash, durum, olusturma) VALUES (?, ?, 'kvkk119-ogt@ornek.com', 'h1', 'aktif', ?)").run(okul, ogt.id, z);

  const x = app.hesap.disaAktar(u);
  assert.equal(x.hizTurlari.length, 1);
  assert.equal(x.gununSorusu.length, 1);
  assert.equal(x.kavramKartlari.length, 1);
  assert.equal(x.planAyari.length, 1);
  assert.equal(x.planGorevleri.length, 1);
  assert.equal(x.tamSinavlar.length, 1);
  assert.equal(x.sinifUyelikleri[0].sinif, "11-A");
  assert.equal(app.hesap.disaAktar(ogt).ogretmenlik[0].okul, "Deneme Lisesi");

  app.hesap.hesapSil(u, SIFRE);
  for (const t of ["hiz_turlari", "gunun_sorusu_katilim", "kart_durumu", "plan_ayar", "plan_gorevler", "tam_sinavlar"])
    assert.equal(d.prepare("SELECT COUNT(*) n FROM " + t + " WHERE user_id = ?").get(u.id).n, 0, t);
  assert.equal(d.prepare("SELECT COUNT(*) n FROM sinif_uyeleri WHERE ogrenci_id = ?").get(u.id).n, 0);

  app.hesap.hesapSil(app.db.prepare("SELECT * FROM users WHERE id = ?").get(ogt.id), SIFRE);
  assert.ok(d.prepare("SELECT 1 FROM siniflar WHERE id = ?").get(sinif), "öğretmenin sınıfı kalır");
  assert.equal(d.prepare("SELECT COUNT(*) n FROM odevler WHERE sinif_id = ?").get(sinif).n, 1, "ödevler kalır");
  const o = d.prepare("SELECT durum, eposta, belirtec_hash FROM ogretmenler WHERE user_id = ?").get(ogt.id);
  assert.deepEqual({ ...o }, { durum: "iptal", eposta: null, belirtec_hash: null });
});
