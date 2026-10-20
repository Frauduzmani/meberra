"use strict";
// Yönetici uç noktaları: özet istatistik, kullanıcılar, Premium verme/iptal, ödeme talepleri, denetim kaydı.
const config = require("./config");
const { islem, simdi } = require("./db");
const { HttpHata } = require("./http");

const SAYFA_BOYU = 25;
const sayfaNo = q => Math.max(1, Math.floor(+q.get("sayfa") || 1));

function yonetimRotalari(r, c) {
  const { db, hesap, denetim, yoneticiGerekli } = c;
  const kullaniciBul = pid => {
    const u = db.prepare("SELECT * FROM users WHERE public_id = ?").get(pid);
    if (!u) throw new HttpHata(404, "Kullanıcı bulunamadı.");
    return u;
  };
  const gunOnce = g => new Date(Date.now() - g * 864e5).toISOString();
  const json = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return s; } };

  r.get("/api/admin/stats", req => {
    yoneticiGerekli(req);
    const tek = (sql, ...a) => db.prepare(sql).get(...a);
    const z = simdi(), g7 = gunOnce(7);
    const prem = db.prepare(`SELECT plan, COUNT(DISTINCT user_id) AS n FROM subscriptions WHERE durum = 'aktif' AND bitis > ? AND baslangic <= ? GROUP BY plan`).all(z, z);
    const say = p => (prem.find(x => x.plan === p) || { n: 0 }).n;
    const aylik = say("aylik"), yillik = say("yillik"), ozel = say("ozel");
    const fiyat = id => (config.plan(id) || { fiyat: 0 }).fiyat;
    return {
      ok: true,
      kullanici: {
        toplam: tek("SELECT COUNT(*) AS n FROM users WHERE durum != 'silindi' AND rol = 'ogrenci'").n,
        son7gun: tek("SELECT COUNT(*) AS n FROM users WHERE durum != 'silindi' AND rol = 'ogrenci' AND olusturma >= ?", g7).n,
        aktif7gun: tek("SELECT COUNT(DISTINCT user_id) AS n FROM (SELECT user_id FROM answers WHERE zaman >= ? UNION SELECT id FROM users WHERE son_giris >= ? AND rol = 'ogrenci')", g7, g7).n
      },
      premium: { aktif: aylik + yillik + ozel, aylik, yillik, ozel },
      talep: { bekleyen: tek("SELECT COUNT(*) AS n FROM upgrade_requests WHERE durum = 'bekliyor'").n },
      cevap: { toplam: tek("SELECT COUNT(*) AS n FROM answers").n, son7gun: tek("SELECT COUNT(*) AS n FROM answers WHERE zaman >= ?", g7).n },
      gelirTahmini: { aylikTL: Math.round(aylik * fiyat("aylik") + yillik * fiyat("yillik") / 12) }
    };
  });

  r.get("/api/admin/users", req => {
    yoneticiGerekli(req);
    const q = String(req.sorgu.get("q") || "").trim().slice(0, 80), sayfa = sayfaNo(req.sorgu), z = simdi();
    const kosul = ["u.durum != 'silindi'"], arg = [];
    if (q) { kosul.push("(u.eposta LIKE ? OR u.ad LIKE ? OR u.soyad LIKE ? OR (u.ad || ' ' || u.soyad) LIKE ?)"); const l = "%" + q.replace(/[%_]/g, "") + "%"; arg.push(l, l, l, l); }
    if (req.sorgu.get("premium") === "1") { kosul.push("EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.durum = 'aktif' AND s.bitis > ?)"); arg.push(z); }
    const where = "WHERE " + kosul.join(" AND ");
    const toplam = db.prepare("SELECT COUNT(*) AS n FROM users u " + where).get(...arg).n;
    const satirlar = db.prepare(`SELECT u.*, (SELECT COUNT(*) FROM answers a WHERE a.user_id = u.id) AS cevap_sayisi
      FROM users u ${where} ORDER BY u.olusturma DESC LIMIT ? OFFSET ?`).all(...arg, SAYFA_BOYU, (sayfa - 1) * SAYFA_BOYU);
    return {
      ok: true, toplam, sayfa, sayfaBoyu: SAYFA_BOYU, sayfaBoyutu: SAYFA_BOYU,
      kullanicilar: satirlar.map(u => {
        const y = hesap.uyelik(u.id);
        return { id: u.public_id, ad: u.ad, soyad: u.soyad, eposta: u.eposta, rol: u.rol, olusturma: u.olusturma, sonGiris: u.son_giris, durum: u.durum,
          premium: y.premium, plan: y.plan, bitis: y.bitis, bekleyenTalep: !!y.bekleyenTalep, cevapSayisi: u.cevap_sayisi };
      })
    };
  });

  r.get("/api/admin/users/:id", req => {
    yoneticiGerekli(req);
    const u = kullaniciBul(req.params.id);
    const tek = (sql) => db.prepare(sql).get(u.id);
    const ist = tek("SELECT COUNT(*) AS cevap, COALESCE(SUM(dogru), 0) AS dogru, MAX(zaman) AS son FROM answers WHERE user_id = ?");
    return {
      ok: true,
      user: Object.assign(hesap.genel(u), { durum: u.durum, sonGiris: u.son_giris, veliOnay: !!u.veli_onay, kvkkOnay: u.kvkk_onay }),
      profile: hesap.profilAl(u.id),
      uyelik: hesap.uyelik(u.id),
      abonelikler: db.prepare("SELECT id, plan, baslangic, bitis, durum, kaynak, tutar_tl AS tutar, not_ AS 'not', olusturma FROM subscriptions WHERE user_id = ? ORDER BY id DESC").all(u.id),
      talepler: hesap.talepler(u),
      istatistik: {
        cevap: ist.cevap, dogru: ist.dogru, dogruYuzde: ist.cevap ? Math.round(ist.dogru / ist.cevap * 100) : null,
        yanlisAcik: tek("SELECT COUNT(*) AS n FROM wrong_answers WHERE user_id = ? AND cozuldu IS NULL").n,
        deneme: tek("SELECT COUNT(*) AS n FROM exams WHERE user_id = ?").n,
        sonEtkinlik: [ist.son, u.son_giris].filter(Boolean).sort().pop() || null
      },
      dersler: db.prepare("SELECT sayfa, COUNT(*) AS cevap, SUM(dogru) AS dogru FROM answers WHERE user_id = ? GROUP BY sayfa ORDER BY cevap DESC").all(u.id)
    };
  });

  r.post("/api/admin/users/:id/premium", req => {
    yoneticiGerekli(req);
    const u = kullaniciBul(req.params.id), b = req.body || {};
    if (!config.plan(b.plan) && !(b.gun > 0)) throw new HttpHata(400, "Plan (aylik/yillik) ya da gün sayısı gerekli.");
    const not = String(b.not || "").slice(0, 300) || null;
    const s = hesap.premiumVer(u.id, b.plan, b.gun, { kaynak: "elle", not, yapan: req.kullanici.id });
    denetim({ eylem: "premium.ver", kullanici: u.id, yapan: req.kullanici.id, istek: req, varlik: "subscriptions", varlikId: s.id, ayrinti: { plan: b.plan || "ozel", gun: s.gun, not } });
    return { ok: true, abonelik: s, uyelik: hesap.uyelik(u.id) };
  });

  r.post("/api/admin/users/:id/premium/iptal", req => {
    yoneticiGerekli(req);
    const u = kullaniciBul(req.params.id), z = simdi();
    const n = Number(db.prepare("UPDATE subscriptions SET durum = 'iptal', iptal_zamani = ? WHERE user_id = ? AND durum = 'aktif' AND bitis > ?").run(z, u.id, z).changes);
    denetim({ eylem: "premium.iptal", kullanici: u.id, yapan: req.kullanici.id, istek: req, ayrinti: { donem: n, not: String((req.body || {}).not || "").slice(0, 300) || null } });
    return { ok: true, iptalEdilen: n, uyelik: hesap.uyelik(u.id) };
  });

  r.post("/api/admin/users/:id/durum", req => {
    yoneticiGerekli(req);
    const u = kullaniciBul(req.params.id), d = (req.body || {}).durum;
    if (d !== "aktif" && d !== "askida") throw new HttpHata(400, "Durum aktif ya da askida olmalı.");
    if (u.id === req.kullanici.id) throw new HttpHata(400, "Kendi hesabını askıya alamazsın.");
    islem(db, () => {
      db.prepare("UPDATE users SET durum = ?, guncelleme = ? WHERE id = ?").run(d, simdi(), u.id);
      if (d === "askida") db.prepare("UPDATE sessions SET iptal = ? WHERE user_id = ? AND iptal IS NULL").run(simdi(), u.id);
    });
    denetim({ eylem: d === "askida" ? "hesap.askiya-alindi" : "hesap.etkinlestirildi", kullanici: u.id, yapan: req.kullanici.id, istek: req });
    return { ok: true, durum: d };
  });

  r.get("/api/admin/talepler", req => {
    yoneticiGerekli(req);
    const d = String(req.sorgu.get("durum") || "bekliyor");
    const where = ["bekliyor", "onaylandi", "reddedildi", "iptal"].indexOf(d) >= 0 ? "WHERE t.durum = ?" : "";
    const satirlar = db.prepare(`SELECT t.*, u.public_id, u.ad, u.soyad, u.eposta FROM upgrade_requests t JOIN users u ON u.id = t.user_id ${where}
      ORDER BY t.id DESC LIMIT 200`).all(...(where ? [d] : []));
    return {
      ok: true,
      talepler: satirlar.map(t => ({ id: t.id, kullanici: { id: t.public_id, ad: t.ad, soyad: t.soyad, eposta: t.eposta }, plan: t.plan, tutar: t.tutar_tl,
        odeyenAd: t.odeyen_ad, aciklama: t.aciklama, durum: t.durum, olusturma: t.olusturma, islemZamani: t.islem_zamani, islemNotu: t.islem_notu }))
    };
  });

  r.post("/api/admin/talepler/:id", req => {
    yoneticiGerekli(req);
    const b = req.body || {}, not = String(b.not || "").slice(0, 300) || null;
    if (b.islem !== "onayla" && b.islem !== "reddet") throw new HttpHata(400, "islem onayla ya da reddet olmalı.");
    const t = db.prepare("SELECT * FROM upgrade_requests WHERE id = ?").get(+req.params.id);
    if (!t) throw new HttpHata(404, "Talep bulunamadı.");
    if (t.durum !== "bekliyor") throw new HttpHata(409, "Bu talep zaten işlenmiş (" + t.durum + ").");
    let abonelik = null;
    islem(db, () => {
      db.prepare("UPDATE upgrade_requests SET durum = ?, isleyen = ?, islem_zamani = ?, islem_notu = ? WHERE id = ?")
        .run(b.islem === "onayla" ? "onaylandi" : "reddedildi", req.kullanici.id, simdi(), not, t.id);
      if (b.islem === "onayla") abonelik = hesap.premiumVer(t.user_id, t.plan, null, { kaynak: "talep", tutar: t.tutar_tl, talepId: t.id, not, yapan: req.kullanici.id });
    });
    if (abonelik) hesap.premiumBildir(t.user_id, abonelik.bitis);
    denetim({ eylem: b.islem === "onayla" ? "premium.talep-onay" : "premium.talep-red", kullanici: t.user_id, yapan: req.kullanici.id, istek: req,
      varlik: "upgrade_requests", varlikId: t.id, ayrinti: { plan: t.plan, tutar: t.tutar_tl, not } });
    return { ok: true, abonelik };
  });

  r.get("/api/admin/audit", req => {
    yoneticiGerekli(req);
    const sayfa = sayfaNo(req.sorgu), kosul = [], arg = [];
    const kid = req.sorgu.get("kullanici"), eylem = String(req.sorgu.get("eylem") || "").trim();
    if (kid) { const u = kullaniciBul(kid); kosul.push("(a.user_id = ? OR a.yapan_id = ?)"); arg.push(u.id, u.id); }
    if (eylem) { kosul.push("a.eylem LIKE ?"); arg.push("%" + eylem.replace(/[%_]/g, "") + "%"); }
    const where = kosul.length ? "WHERE " + kosul.join(" AND ") : "";
    const toplam = db.prepare("SELECT COUNT(*) AS n FROM audit_log a " + where).get(...arg).n;
    const satirlar = db.prepare(`SELECT a.*, ku.public_id AS k_id, ku.ad AS k_ad, ku.soyad AS k_soyad, ku.eposta AS k_eposta,
        yu.public_id AS y_id, yu.ad AS y_ad, yu.soyad AS y_soyad
      FROM audit_log a LEFT JOIN users ku ON ku.id = a.user_id LEFT JOIN users yu ON yu.id = a.yapan_id ${where}
      ORDER BY a.id DESC LIMIT ? OFFSET ?`).all(...arg, 50, (sayfa - 1) * 50);
    return {
      ok: true, toplam, sayfa, sayfaBoyu: 50, sayfaBoyutu: 50,
      kayitlar: satirlar.map(a => ({
        id: a.id, zaman: a.zaman, eylem: a.eylem, varlik: a.varlik, varlikId: a.varlik_id, ip: a.ip, ayrinti: json(a.ayrinti),
        kullanici: a.k_id ? { id: a.k_id, ad: a.k_ad, soyad: a.k_soyad, eposta: a.k_eposta } : null,
        yapan: a.y_id ? { id: a.y_id, ad: a.y_ad, soyad: a.y_soyad } : null
      }))
    };
  });
}

module.exports = { yonetimRotalari };
