"use strict";
// 1.16.0 oyun: senkron birleştirme (ustalik / aylik / haftalik), önerilen hatırlatma saati, geri dönüş mesajları.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { olustur } = require("../uygulama");
const { oyunBirlestir, ustalikBirlestir, aylikBirlestir, haftalikBirlestir } = require("../veri");
const { geriDonusAsamasi } = require("../zamanlayici");

const kayitBilgi = (ep, ad) => ({ ad: ad || "Deniz", soyad: "Yılmaz", eposta: ep, sifre: "Deneme-12345", sifre2: "Deneme-12345", kosullar: true, kvkk: true, veliOnay: true });
const vapid = { publicKey: "BTestPublicKey", privateKey: "x", subject: "mailto:test@ornek.com" };
const abonelik = n => ({ endpoint: "https://push.ornek.com/abone/" + n, keys: { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM", auth: "tBHItJI5svbpez7KI4CCXg" } });

test("Birleştirme: ustalık en yüksek seviye + en erken t; aylık tamam kazanır; haftalık birleşim", () => {
  const u = ustalikBirlestir(
    { "ap-calculus|1": { seviye: "gumus", t: 50 }, "ap-calculus|2": { seviye: "altin", t: 90 }, "x|1": { seviye: "elmas", t: 1 } },
    { "ap-calculus|1": { seviye: "bronz", t: 10 }, "ap-calculus|2": { seviye: "altin", t: 70 }, "ap-physics|3": { seviye: "bronz", t: 5 } });
  assert.deepEqual(u, { "ap-calculus|1": { seviye: "gumus", t: 50 }, "ap-calculus|2": { seviye: "altin", t: 70 }, "ap-physics|3": { seviye: "bronz", t: 5 } });
  assert.deepEqual(ustalikBirlestir({ "a|1": { seviye: "bronz", t: 1 } }, { "a|1": { seviye: "altin", t: 99 } }), { "a|1": { seviye: "altin", t: 99 } }, "yüksek seviye geç t'li olsa da kazanır");

  const a = aylikBirlestir(
    { "2026-09": { hedef: { tur: "gun", miktar: 15 }, tamam: true, t: 30 }, "2026-10": { hedef: { tur: "soru", miktar: 200 }, tamam: false, t: 1 }, bozuk: { tamam: true } },
    { "2026-09": { hedef: { tur: "gun", miktar: 15 }, tamam: false, t: 5 }, "2026-10": { hedef: { tur: "soru", miktar: 200 }, tamam: true, t: 80 } });
  assert.equal(a["2026-09"].tamam, true, "tamam geri alınmaz");
  assert.equal(a["2026-10"].tamam, true);
  assert.equal(a["2026-10"].t, 80);
  assert.ok(!("bozuk" in a));
  assert.equal(aylikBirlestir({ "2026-10": { tamam: true, t: 40 } }, { "2026-10": { tamam: true, t: 20 } })["2026-10"].t, 20, "ikisi de tamam → en erken t");

  const h = haftalikBirlestir({ "2026-W42": 10, "2026-W43": 50 }, { "2026-W43": 20, "kotu": 1 });
  assert.deepEqual(h, { "2026-W42": 10, "2026-W43": 20 });

  // oyunBirlestir içinden: eski alanlar korunur, yeni alanlar yalnızca varsa yazılır
  const o = oyunBirlestir({ xp: 100, rozetler: { "aylik-2026-09": { t: 9 } }, ustalik: { "p|1": { seviye: "bronz", t: 3 } } },
    { xp: 80, rozetler: { "aylik-2026-09": { t: 4 } }, ustalik: { "p|1": { seviye: "gumus", t: 7 } }, aylik: { "2026-10": { tamam: false, t: 1 } } });
  assert.equal(o.xp, 100);
  assert.equal(o.rozetler["aylik-2026-09"].t, 4, "aya özel rozet: en erken t");
  assert.equal(o.ustalik["p|1"].seviye, "gumus");
  assert.equal(o.aylik["2026-10"].tamam, false);
  assert.ok(!("haftalik" in o), "hiç olmayan alan eklenmez");
  assert.ok(!("ustalik" in oyunBirlestir({ xp: 1 }, { xp: 2 })));
});

test("Önerilen hatırlatma saati: son 30 gün, ≥10 cevap, İstanbul saati, sessiz saatlere çekilir; elle seçim önceliklidir", async () => {
  let saatMs = Date.parse("2026-10-21T10:00:00Z");
  const z = olustur({ dbDosya: ":memory:", yoneticiAtla: true, girisSiniri: 1000, kayitSiniri: 1000, saat: () => saatMs });
  await new Promise(r => z.server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + z.server.address().port;
  try {
    let cerez = "";
    const c = async (yontem, yol, govde) => {
      const h = Object.assign({ "Content-Type": "application/json" }, yontem === "GET" ? {} : { "X-Meberra": "1" }, cerez ? { Cookie: cerez } : {});
      const r = await fetch(base + yol, { method: yontem, headers: h, body: govde ? JSON.stringify(govde) : undefined });
      const sc = r.headers.get("set-cookie");
      if (sc) { const m = /meberra_sid=([^;]*)/.exec(sc); cerez = m && m[1] ? "meberra_sid=" + m[1] : ""; }
      return { durum: r.status, govde: await r.json() };
    };
    assert.equal((await c("POST", "/api/auth/register", kayitBilgi("saat@ornek.com"))).durum, 200);
    const D = z.db, uid = D.prepare("SELECT id FROM users WHERE eposta = 'saat@ornek.com'").get().id;
    const cevap = iso => D.prepare("INSERT INTO answers (user_id, sayfa, unite, soru, secim, dogru, zaman) VALUES (?, 'ap-calculus', 'u1', ?, 'A', 1, ?)").run(uid, "q" + Math.random(), iso);

    let r = await c("GET", "/api/bildirim-ayarlari");
    assert.equal(r.govde.onerilenSaat, null, "cevap yok → öneri yok");
    assert.equal(r.govde.saatElle, false);
    assert.equal(r.govde.ayarlar.hatirlatmaSaati, 19, "ayarlar nesnesi değişmedi");

    // 9 cevap 17:xx UTC (= 20:xx İstanbul) → henüz 10 değil
    for (let i = 0; i < 9; i++) cevap("2026-10-" + String(10 + i).padStart(2, "0") + "T17:15:00.000Z");
    assert.equal((await c("GET", "/api/bildirim-ayarlari")).govde.onerilenSaat, null, "9 cevap: yetersiz");
    cevap("2026-10-19T17:40:00.000Z");
    cevap("2026-10-19T12:00:00.000Z"); cevap("2026-10-18T12:00:00.000Z"); // 15:00 İstanbul (2 cevap)
    cevap("2026-08-01T05:00:00.000Z"); cevap("2026-08-02T05:00:00.000Z"); // 30 günden eski: sayılmaz
    r = await c("GET", "/api/bildirim-ayarlari");
    assert.equal(r.govde.onerilenSaat, 20, "en çok 20:00 İstanbul");
    assert.equal(r.govde.etkinSaat, 20, "saat seçilmedi → önerilen saat kullanılır");

    // Gece çalışan: 23:00 İstanbul → 21'e çekilir
    for (let i = 0; i < 12; i++) cevap("2026-10-" + String(5 + i).padStart(2, "0") + "T20:10:00.000Z");
    assert.equal((await c("GET", "/api/bildirim-ayarlari")).govde.onerilenSaat, 21, "sessiz saate denk gelirse 21:00");

    // Elle seçim
    r = await c("PUT", "/api/bildirim-ayarlari", { epostaHatirlatma: true });
    assert.equal(r.govde.saatElle, false, "başka alan saat seçimi sayılmaz");
    r = await c("PUT", "/api/bildirim-ayarlari", { hatirlatmaSaati: 9 });
    assert.equal(r.govde.saatElle, true);
    assert.equal(r.govde.etkinSaat, 9);
    assert.equal(r.govde.onerilenSaat, 21, "öneri yine gösterilir");
  } finally {
    await new Promise(r => z.server.close(r));
  }
});

test("Hatırlatma: saat seçmeyen öğrenciye önerilen saatte gider", async () => {
  const z = olustur({ dbDosya: ":memory:", yoneticiAtla: true, vapid, pushGonderici: async () => {} });
  const D = z.db;
  const u = z.hesap.kayit(kayitBilgi("oto@ornek.com")).kullanici;
  z.bildirim.ayarKaydet(u, { epostaHatirlatma: true }, null); // saat seçmedi (varsayılan 19)
  // Son 30 günde 12 cevap 11:xx UTC = 14:00 İstanbul; dün de çalıştı (seri 1)
  for (let i = 0; i < 12; i++) D.prepare("INSERT INTO answers (user_id, sayfa, unite, soru, secim, dogru, zaman) VALUES (?, 'ap-calculus', 'u1', ?, 'A', 1, ?)").run(u.id, "q" + i, "2026-10-" + String(9 + i).padStart(2, "0") + "T11:05:00.000Z");
  assert.equal((await z.zamanlayici.tik(Date.parse("2026-10-21T10:30:00Z"))).hatirlatma, 0, "13:30: önerilen saat (14) gelmedi");
  assert.equal((await z.zamanlayici.tik(Date.parse("2026-10-21T11:05:00Z"))).hatirlatma, 1, "14:05: gider (varsayılan 19 beklenmez)");
});

test("Geri dönüş mesajı: 3/7/14 gün, her ara bir kez, günlük sınır, sessiz saat, açık rıza, 30 gün sonrası yok", async () => {
  assert.equal(geriDonusAsamasi(2), null);
  assert.equal(geriDonusAsamasi(3), 3);
  assert.equal(geriDonusAsamasi(6), 3);
  assert.equal(geriDonusAsamasi(7), 7);
  assert.equal(geriDonusAsamasi(14), 14);
  assert.equal(geriDonusAsamasi(30), 14);
  assert.equal(geriDonusAsamasi(31), null);

  const pl = [];
  const z = olustur({ dbDosya: ":memory:", yoneticiAtla: true, vapid, pushGonderici: async (a, y) => { pl.push(JSON.parse(y)); } });
  const D = z.db;
  const kul = (ep, ayar) => { const u = z.hesap.kayit(kayitBilgi(ep)).kullanici; if (ayar) z.bildirim.ayarKaydet(u, ayar, null); return u; };
  const cevap = (u, iso) => D.prepare("INSERT INTO answers (user_id, sayfa, unite, soru, secim, dogru, zaman) VALUES (?, 'ap-calculus', 'u1', ?, 'A', 1, ?)").run(u.id, "q" + Math.random(), iso);
  const geri = u => D.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY id").all(u.id);
  const log = (u, tur) => D.prepare("SELECT * FROM reminder_log WHERE user_id = ? AND tur LIKE ? ORDER BY gun").all(u.id, tur);
  const T = (gun, saat) => Date.parse(gun + "T" + saat + ":00Z"); // UTC; İstanbul = +3

  const a = kul("g1@ornek.com", { epostaHatirlatma: true, hatirlatmaSaati: 10 }); // son çalışma 1 Ekim
  cevap(a, "2026-10-01T09:00:00.000Z");
  z.bildirim.abone(a, abonelik("g1"), null);
  const b = kul("g2@ornek.com"); // rıza yok
  cevap(b, "2026-10-01T09:00:00.000Z");
  const c = kul("g3@ornek.com", { push: true, hatirlatmaSaati: 10 }); // 40 gün önce çalıştı
  cevap(c, "2026-08-22T09:00:00.000Z");
  const d = kul("g4@ornek.com", { epostaHatirlatma: true, hatirlatmaSaati: 10 }); // hiç çalışmadı
  void d;

  // 3 Ekim (2 gün): yok
  let s = await z.zamanlayici.tik(T("2026-10-03", "08:00"));
  assert.equal(s.geriDonus, 0);
  // 4 Ekim (3 gün) sessiz saat (02:00 İstanbul): yok
  s = await z.zamanlayici.tik(T("2026-10-03", "23:00"));
  assert.equal(s.geriDonus, 0, "sessiz saat");
  // 4 Ekim 09:30 İstanbul: hatırlatma saati (10) gelmedi
  s = await z.zamanlayici.tik(T("2026-10-04", "06:30"));
  assert.equal(s.geriDonus, 0, "saati gelmedi");
  // 4 Ekim 13:00 İstanbul → 3 gün mesajı
  s = await z.zamanlayici.tik(T("2026-10-04", "10:00"));
  assert.equal(s.geriDonus, 1);
  let n = geri(a);
  assert.equal(n.length, 1);
  assert.equal(n[0].tur, "tekrar");
  assert.match(n[0].metin, /Kaldığın yerden 5 dakikalık bir tekrarla dönmeye ne dersin\?/);
  assert.ok(!/kaybet|üzül|hayal kırıklığı|özledik/i.test(n[0].baslik + n[0].metin), "suçlayıcı dil yok");
  assert.equal(pl.length, 1, "abone olduğu için push");
  const ep = D.prepare("SELECT * FROM email_outbox WHERE alici = 'g1@ornek.com' ORDER BY id DESC").get();
  assert.ok(ep && /bildirim-iptal\?tur=hatirlatma/.test(ep.metin), "e-posta hatırlatması açık → e-posta (tek tık iptal)");
  assert.equal(geri(b).length, 0, "rıza yok");
  assert.equal(geri(c).length, 0, "30 günden sonra yok");
  assert.equal(geri(d).length, 0, "hiç çalışmayana yok");
  assert.equal(log(a, "hatirlatma").length, 1, "günlük tek mesaj sınırına sayılır");
  assert.equal(log(a, "geri-donus-3")[0].gun, "2026-10-01", "ara, son çalışılan günle kaydedilir");

  // Aynı gün: ne geri dönüş ne günlük hatırlatma
  s = await z.zamanlayici.tik(T("2026-10-04", "15:00"));
  assert.equal(s.geriDonus + s.hatirlatma, 0);
  // 5–7 Ekim (4–6 gün): 3 günlük ara zaten gönderildi
  for (const g of ["2026-10-05", "2026-10-06", "2026-10-07"]) assert.equal((await z.zamanlayici.tik(T(g, "10:00"))).geriDonus, 0, g);
  // 8 Ekim (7 gün) → 7 gün mesajı, bir kez
  assert.equal((await z.zamanlayici.tik(T("2026-10-08", "10:00"))).geriDonus, 1);
  assert.equal((await z.zamanlayici.tik(T("2026-10-08", "12:00"))).geriDonus, 0);
  assert.equal((await z.zamanlayici.tik(T("2026-10-09", "10:00"))).geriDonus, 0);
  // 15 Ekim (14 gün) → 14 gün mesajı
  assert.equal((await z.zamanlayici.tik(T("2026-10-15", "10:00"))).geriDonus, 1);
  for (const g of ["2026-10-16", "2026-10-25", "2026-10-31", "2026-11-05"]) assert.equal((await z.zamanlayici.tik(T(g, "10:00"))).geriDonus, 0, g);
  assert.equal(geri(a).length, 3, "3 / 7 / 14 — her biri bir kez");
  assert.deepEqual(log(a, "geri-donus-%").map(r => r.tur).sort(), ["geri-donus-14", "geri-donus-3", "geri-donus-7"]);

  // Öğrenci döndü (6 Kasım), sonra yeniden ara: yeni ara için 3 gün mesajı yeniden hak edilir
  cevap(a, "2026-11-06T09:00:00.000Z");
  assert.equal((await z.zamanlayici.tik(T("2026-11-09", "10:00"))).geriDonus, 1, "yeni çalışmama arası");

  // Aynı gün başka bir mesaj (premium denemesi) gönderildiyse geri dönüş beklemeye girer
  const e = kul("g5@ornek.com", { epostaHatirlatma: true, hatirlatmaSaati: 10 });
  cevap(e, "2026-11-06T09:00:00.000Z");
  D.prepare("INSERT INTO reminder_log (user_id, tur, gun, zaman, ayrinti) VALUES (?, 'deneme', '2026-11-09', ?, NULL)").run(e.id, new Date().toISOString());
  await z.zamanlayici.tik(T("2026-11-09", "11:00"));
  assert.equal(geri(e).length, 0, "günde en fazla bir mesaj");
  await z.zamanlayici.tik(T("2026-11-10", "10:00"));
  assert.equal(geri(e).length, 1, "ertesi gün (4 gün) gider");

  // Yönetici "Şimdi çalıştır": sessiz saatte çalışmaz
  const r = await z.zamanlayici.calistir("geriDonus", T("2026-11-10", "20:00"));
  assert.equal(r.calisti, false);
});
