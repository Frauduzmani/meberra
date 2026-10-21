"use strict";
// Yönetici uç noktaları: özet istatistik, kullanıcılar, Premium verme/iptal, ödeme talepleri, denetim kaydı.
const config = require("./config");
const { islem, simdi } = require("./db");
const { HttpHata } = require("./http");
const zaman = require("./zaman");
const { varlikDurumu, esikler } = require("./varlik");

const SAYFA_BOYU = 25;
const sayfaNo = q => Math.max(1, Math.floor(+q.get("sayfa") || 1));

function yonetimRotalari(r, c) {
  const { db, hesap, denetim, yoneticiGerekli, bildirim } = c;
  const varlik = c.varlik || { bosalt() {} };
  const bugun = () => zaman.gun(Date.now());
  /** Son n İstanbul günü (en eski → bugün) */
  const sonGunler = n => { const b = bugun(), l = []; for (let i = n - 1; i >= 0; i--) l.push(zaman.gunEkle(b, -i)); return l; };
  const engelBilgisi = u => (u.durum === "askida" && u.engel_zamani
    ? { zaman: u.engel_zamani, bitis: u.engel_bitis, neden: u.engel_nedeni, dolmus: !!(u.engel_bitis && u.engel_bitis <= simdi()) } : null);
  const kullaniciBul = pid => {
    const u = db.prepare("SELECT * FROM users WHERE public_id = ?").get(pid);
    if (!u) throw new HttpHata(404, "Kullanıcı bulunamadı.");
    return u;
  };
  const gunOnce = g => new Date(Date.now() - g * 864e5).toISOString();
  const json = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return s; } };

  r.get("/api/admin/stats", req => {
    yoneticiGerekli(req);
    varlik.bosalt();
    const tek = (sql, ...a) => db.prepare(sql).get(...a);
    const es = esikler();
    const z = simdi(), g7 = gunOnce(7);
    const gunler7 = [];
    for (let i = 6; i >= 0; i--) gunler7.push(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
    const seri7 = sql => { const m = new Map(db.prepare(sql).all(gunler7[0]).map(x => [x.g, x.n])); return gunler7.map(g => m.get(g) || 0); };
    const prem = db.prepare(`SELECT plan, COUNT(DISTINCT user_id) AS n FROM subscriptions WHERE durum = 'aktif' AND bitis > ? AND baslangic <= ? GROUP BY plan`).all(z, z);
    const say = p => (prem.find(x => x.plan === p) || { n: 0 }).n;
    const aylik = say("aylik"), yillik = say("yillik"), ozel = say("ozel");
    // Gelir tahmini: yalnızca ödemesi onaylanmış (talep kaynaklı, tutarlı) ve hesabı aktif kullanıcıların şu an geçerli
    // dönemleri; ödenen gerçek tutar dönem uzunluğuna bölünüp 30 güne çevrilir (bugünkü fiyat değil)
    const odenen = db.prepare(`SELECT s.tutar_tl, s.baslangic, s.bitis FROM subscriptions s JOIN users u ON u.id = s.user_id
      WHERE s.durum = 'aktif' AND s.bitis > ? AND s.baslangic <= ? AND s.kaynak = 'talep' AND s.tutar_tl > 0 AND u.durum = 'aktif'`).all(z, z);
    const aylikGelir = odenen.reduce((t, s) => {
      const gun = (Date.parse(s.bitis) - Date.parse(s.baslangic)) / 864e5;
      return gun > 0 ? t + s.tutar_tl / gun * 30 : t;
    }, 0);
    return {
      ok: true,
      kullanici: {
        toplam: tek("SELECT COUNT(*) AS n FROM users WHERE durum != 'silindi' AND rol = 'ogrenci'").n,
        son7gun: tek("SELECT COUNT(*) AS n FROM users WHERE durum != 'silindi' AND rol = 'ogrenci' AND olusturma >= ?", g7).n,
        aktif7gun: tek("SELECT COUNT(DISTINCT user_id) AS n FROM (SELECT user_id FROM answers WHERE zaman >= ? UNION SELECT id FROM users WHERE son_giris >= ? AND rol = 'ogrenci')", g7, g7).n,
        cevrimici: tek("SELECT COUNT(*) AS n FROM users WHERE durum != 'silindi' AND son_gorulme >= ?", es.cevrimici).n,
        yakin: tek("SELECT COUNT(*) AS n FROM users WHERE durum != 'silindi' AND son_gorulme >= ?", es.yakin).n,
        engelli: tek("SELECT COUNT(*) AS n FROM users WHERE durum = 'askida'").n,
        bugunGiris: tek("SELECT COALESCE(SUM(adet), 0) AS n FROM giris_sayilari WHERE gun = ?", bugun()).n
      },
      premium: { aktif: aylik + yillik + ozel, aylik, yillik, ozel },
      talep: { bekleyen: tek("SELECT COUNT(*) AS n FROM upgrade_requests WHERE durum = 'bekliyor'").n },
      soru: { bekleyen: tek("SELECT COUNT(*) AS n FROM questions WHERE durum = 'bekliyor'").n, son7gun: tek("SELECT COUNT(*) AS n FROM questions WHERE olusturma >= ?", g7).n },
      cevap: { toplam: tek("SELECT COUNT(*) AS n FROM answers").n, son7gun: tek("SELECT COUNT(*) AS n FROM answers WHERE zaman >= ?", g7).n },
      gelirTahmini: { aylikTL: Math.round(aylikGelir) },
      // Son 7 günün günlük dağılımı (en eski → bugün, UTC günü): özet karolarındaki mini çubuklar
      seri: { gunler: gunler7, kayit: seri7("SELECT substr(olusturma, 1, 10) AS g, COUNT(*) AS n FROM users WHERE durum != 'silindi' AND rol = 'ogrenci' AND olusturma >= ? GROUP BY g"),
        cevap: seri7("SELECT substr(zaman, 1, 10) AS g, COUNT(*) AS n FROM answers WHERE zaman >= ? GROUP BY g") },
      sistem: { yeniHata: tek("SELECT COUNT(*) AS n FROM system_logs WHERE durum = 'yeni' AND seviye = 'hata'").n,
        yeniUyari: tek("SELECT COUNT(*) AS n FROM system_logs WHERE durum = 'yeni' AND seviye = 'uyari'").n }
    };
  });

  r.get("/api/admin/users", req => {
    yoneticiGerekli(req);
    const q = String(req.sorgu.get("q") || "").trim().slice(0, 80), sayfa = sayfaNo(req.sorgu), z = simdi();
    const kosul = ["u.durum != 'silindi'"], arg = [];
    if (q) { kosul.push("(u.eposta LIKE ? OR u.ad LIKE ? OR u.soyad LIKE ? OR (u.ad || ' ' || u.soyad) LIKE ?)"); const l = "%" + q.replace(/[%_]/g, "") + "%"; arg.push(l, l, l, l); }
    if (req.sorgu.get("premium") === "1") { kosul.push("EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.durum = 'aktif' AND s.bitis > ?)"); arg.push(z); }
    // Varlık / engel süzgeci: cevrimici (5 dk) | yakin (30 dk) | engelli (askıda)
    varlik.bosalt();
    const es = esikler(), v = req.sorgu.get("varlik");
    if (v === "cevrimici" || v === "yakin") { kosul.push("u.son_gorulme >= ?"); arg.push(es[v]); }
    else if (v === "engelli") kosul.push("u.durum = 'askida'");
    const rol = req.sorgu.get("rol"); // 1.7.0: ogrenci | veli | yonetici
    if (rol === "ogrenci" || rol === "veli" || rol === "yonetici") { kosul.push("u.rol = ?"); arg.push(rol); }
    const SIRA = { kayit: "u.olusturma DESC", gorulme: "u.son_gorulme IS NULL, u.son_gorulme DESC, u.olusturma DESC", giris: "u.son_giris IS NULL, u.son_giris DESC, u.olusturma DESC" };
    const sira = SIRA[req.sorgu.get("sirala")] || SIRA.kayit;
    const where = "WHERE " + kosul.join(" AND ");
    const toplam = db.prepare("SELECT COUNT(*) AS n FROM users u " + where).get(...arg).n;
    const satirlar = db.prepare(`SELECT u.*, (SELECT COUNT(*) FROM answers a WHERE a.user_id = u.id) AS cevap_sayisi,
        (SELECT adet FROM giris_sayilari g WHERE g.user_id = u.id AND g.gun = ?) AS bugun_giris,
        (SELECT COUNT(*) FROM veli_baglantilari b WHERE b.durum = 'aktif' AND (b.ogrenci_id = u.id OR b.veli_id = u.id)) AS bagli_sayisi
      FROM users u ${where} ORDER BY ${sira} LIMIT ? OFFSET ?`).all(bugun(), ...arg, SAYFA_BOYU, (sayfa - 1) * SAYFA_BOYU);
    return {
      ok: true, toplam, sayfa, sayfaBoyu: SAYFA_BOYU, sayfaBoyutu: SAYFA_BOYU,
      kullanicilar: satirlar.map(u => {
        const y = hesap.uyelik(u.id);
        return { id: u.public_id, ad: u.ad, soyad: u.soyad, eposta: u.eposta, rol: u.rol, olusturma: u.olusturma, sonGiris: u.son_giris, durum: u.durum,
          premium: y.premium, plan: y.plan, bitis: y.bitis, bekleyenTalep: !!y.bekleyenTalep, cevapSayisi: u.cevap_sayisi,
          sonGorulme: u.son_gorulme, sonIp: u.son_ip, sonGirisIp: u.son_giris_ip, varlik: varlikDurumu(u.son_gorulme), bugunGiris: u.bugun_giris || 0, engel: engelBilgisi(u), bagliSayisi: u.bagli_sayisi || 0 };
      })
    };
  });

  /** Kullanıcının etkin oturumları (en son görülen önce) */
  const oturumlar = uid => db.prepare(`SELECT id, olusturma, son_kullanim, son_gorulme, ip, son_ip, tarayici, bitis FROM sessions
    WHERE user_id = ? AND iptal IS NULL AND bitis > ? ORDER BY COALESCE(son_gorulme, son_kullanim) DESC LIMIT 50`).all(uid, simdi())
    .map(s => ({ id: s.id, olusturma: s.olusturma, sonGorulme: s.son_gorulme || s.son_kullanim, ip: s.son_ip || s.ip, ilkIp: s.ip, tarayici: s.tarayici, bitis: s.bitis }));

  r.get("/api/admin/users/:id", req => {
    yoneticiGerekli(req);
    const u = kullaniciBul(req.params.id);
    const tek = (sql) => db.prepare(sql).get(u.id);
    const ist = tek("SELECT COUNT(*) AS cevap, COALESCE(SUM(dogru), 0) AS dogru, MAX(zaman) AS son FROM answers WHERE user_id = ?");
    varlik.bosalt();
    const taze = db.prepare("SELECT son_gorulme, son_ip FROM users WHERE id = ?").get(u.id);
    const gunler = sonGunler(14);
    const gs = new Map(db.prepare("SELECT gun, adet, basarisiz FROM giris_sayilari WHERE user_id = ? AND gun >= ?").all(u.id, gunler[0]).map(x => [x.gun, x]));
    return {
      ok: true,
      user: Object.assign(hesap.genel(u), { durum: u.durum, sonGiris: u.son_giris, sonGirisIp: u.son_giris_ip, veliOnay: !!u.veli_onay, kvkkOnay: u.kvkk_onay,
        sonGorulme: taze.son_gorulme, sonIp: taze.son_ip, varlik: varlikDurumu(taze.son_gorulme), engel: engelBilgisi(u) }),
      girisler: { gunler, adet: gunler.map(g => (gs.get(g) || {}).adet || 0), basarisiz: gunler.map(g => (gs.get(g) || {}).basarisiz || 0) },
      oturumlar: oturumlar(u.id),
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
    const gun = b.gun === undefined || b.gun === null || b.gun === "" ? null : b.gun;
    if (!config.plan(b.plan) && gun == null) throw new HttpHata(400, "Plan (aylik/yillik) ya da gün sayısı gerekli.");
    if (u.durum === "silindi") throw new HttpHata(409, "Silinmiş hesaba Premium verilemez.");
    const not = String(b.not || "").slice(0, 300) || null;
    const s = hesap.premiumVer(u.id, b.plan, gun, { kaynak: "elle", not, yapan: req.kullanici.id });
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
      // Etkinleştirme yönetici engelini de temizler
      if (d === "aktif") db.prepare("UPDATE users SET engel_zamani = NULL, engel_bitis = NULL, engel_nedeni = NULL, engelleyen = NULL WHERE id = ?").run(u.id);
      if (d === "askida") db.prepare("UPDATE sessions SET iptal = ? WHERE user_id = ? AND iptal IS NULL").run(simdi(), u.id);
    });
    denetim({ eylem: d === "askida" ? "hesap.askiya-alindi" : "hesap.etkinlestirildi", kullanici: u.id, yapan: req.kullanici.id, istek: req });
    return { ok: true, durum: d };
  });

  // Engelle: neden (zorunlu, yalnızca yöneticiler görür) + süre (suresiz | 1g | 7g | 30g). Tüm oturumlar kapanır.
  r.post("/api/admin/users/:id/engel", req => {
    yoneticiGerekli(req);
    const u = kullaniciBul(req.params.id);
    const s = hesap.engelle(u, req.body || {}, req.kullanici, req);
    varlik.unut && varlik.unut(u.id);
    return Object.assign({ ok: true }, s);
  });
  r.post("/api/admin/users/:id/engel-kaldir", req => {
    yoneticiGerekli(req);
    return Object.assign({ ok: true }, hesap.engelKaldir(kullaniciBul(req.params.id), req.kullanici, req));
  });

  // Oturumlar: tek oturumu ya da tümünü kapat
  r.post("/api/admin/users/:id/oturumlar/kapat", req => {
    yoneticiGerekli(req);
    const u = kullaniciBul(req.params.id);
    const n = Number(db.prepare("UPDATE sessions SET iptal = ? WHERE user_id = ? AND iptal IS NULL").run(simdi(), u.id).changes);
    denetim({ eylem: "oturum.tumunu-kapat", kullanici: u.id, yapan: req.kullanici.id, istek: req, ayrinti: { adet: n } });
    return { ok: true, kapanan: n, oturumlar: oturumlar(u.id) };
  });
  r.post("/api/admin/users/:id/oturumlar/:sid/kapat", req => {
    yoneticiGerekli(req);
    const u = kullaniciBul(req.params.id);
    const n = Number(db.prepare("UPDATE sessions SET iptal = ? WHERE id = ? AND user_id = ? AND iptal IS NULL").run(simdi(), +req.params.sid || 0, u.id).changes);
    if (!n) throw new HttpHata(404, "Açık oturum bulunamadı.");
    denetim({ eylem: "oturum.kapat", kullanici: u.id, yapan: req.kullanici.id, istek: req, varlik: "sessions", varlikId: +req.params.sid });
    return { ok: true, kapanan: n, oturumlar: oturumlar(u.id) };
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

  r.post("/api/admin/talepler/:id", async req => {
    yoneticiGerekli(req);
    const b = req.body || {}, not = String(b.not || "").slice(0, 300) || null;
    if (b.islem !== "onayla" && b.islem !== "reddet") throw new HttpHata(400, "islem onayla ya da reddet olmalı.");
    let t = null, abonelik = null;
    // Durum kontrolü işlemin içinde ve koşullu UPDATE ile: iki yönetici aynı anda onaylasa da tek dönem açılır
    islem(db, () => {
      t = db.prepare("SELECT t.*, u.durum AS kullanici_durum FROM upgrade_requests t JOIN users u ON u.id = t.user_id WHERE t.id = ?").get(+req.params.id);
      if (!t) throw new HttpHata(404, "Talep bulunamadı.");
      if (t.durum !== "bekliyor") throw new HttpHata(409, "Bu talep zaten işlenmiş (" + t.durum + ").");
      if (b.islem === "onayla" && t.kullanici_durum !== "aktif") throw new HttpHata(409, "Hesap aktif değil (" + t.kullanici_durum + "); talep onaylanamaz, reddedebilirsin.");
      const n = Number(db.prepare("UPDATE upgrade_requests SET durum = ?, isleyen = ?, islem_zamani = ?, islem_notu = ? WHERE id = ? AND durum = 'bekliyor'")
        .run(b.islem === "onayla" ? "onaylandi" : "reddedildi", req.kullanici.id, simdi(), not, t.id).changes);
      if (n !== 1) throw new HttpHata(409, "Bu talep zaten işlenmiş.");
      if (b.islem === "onayla") abonelik = hesap.premiumVer(t.user_id, t.plan, null, { kaynak: "talep", tutar: t.tutar_tl, talepId: t.id, not, yapan: req.kullanici.id });
    });
    if (abonelik) {
      hesap.premiumBildir(t.user_id, abonelik.bitis);
      if (bildirim) await bildirim.olustur(t.user_id, { tur: "premium", baslik: "Premium hesabın açıldı", link: "/calis.html",
        metin: "Ödemen onaylandı. Tüm ünitelere, sınırsız denemeye ve sınırsız soru sormaya artık erişebilirsin. Bitiş: " +
          new Date(abonelik.bitis).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" }) + "." }, { push: true }).push;
    }
    denetim({ eylem: b.islem === "onayla" ? "premium.talep-onay" : "premium.talep-red", kullanici: t.user_id, yapan: req.kullanici.id, istek: req,
      varlik: "upgrade_requests", varlikId: t.id, ayrinti: { plan: t.plan, tutar: t.tutar_tl, not } });
    return { ok: true, abonelik };
  });

  // Duyuru: hedef kitleye uygulama içi bildirim (+ push tercihi açık ve sessiz saat değilse push). onizleme:true → yalnızca alıcı sayısı
  const HEDEF_SQL = {
    hepsi: "",
    premium: "AND EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.durum = 'aktif' AND s.bitis > ?)",
    ucretsiz: "AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.durum = 'aktif' AND s.bitis > ?)"
  };
  r.post("/api/admin/duyuru", async req => {
    yoneticiGerekli(req);
    const b = req.body || {}, e = {};
    const baslik = String(b.baslik == null ? "" : b.baslik).trim().replace(/\s+/g, " ");
    const metin = String(b.metin == null ? "" : b.metin).replace(/\r\n?/g, "\n").trim();
    if (!baslik) e.baslik = "Başlık yaz."; else if (baslik.length > 120) e.baslik = "En fazla 120 karakter.";
    if (!metin) e.metin = "Metin yaz."; else if (metin.length > 1000) e.metin = "En fazla 1000 karakter.";
    const link = b.link == null || b.link === "" ? null : bildirim.linkTemiz(b.link);
    if (b.link && !link) e.link = "Yalnızca site içi bağlantı (/ ile başlayan yol) kullanılabilir.";
    if (!Object.prototype.hasOwnProperty.call(HEDEF_SQL, b.hedef)) e.hedef = "Hedef hepsi, premium ya da ucretsiz olmalı.";
    if (Object.keys(e).length) throw new HttpHata(400, "Lütfen işaretli alanları düzelt.", e);
    const arg = b.hedef === "hepsi" ? [] : [simdi()];
    const alicilar = db.prepare("SELECT u.id FROM users u WHERE u.durum = 'aktif' " + HEDEF_SQL[b.hedef]).all(...arg).map(x => x.id);
    if (b.onizleme === true) return { ok: true, onizleme: true, alici: alicilar.length };
    const sozler = [];
    islem(db, () => { alicilar.forEach(id => sozler.push(bildirim.olustur(id, { tur: "duyuru", baslik, metin, link }, { push: true }).push)); });
    const push = (await Promise.all(sozler)).reduce((t, n) => t + n, 0);
    denetim({ eylem: "duyuru.gonder", yapan: req.kullanici.id, istek: req, ayrinti: { hedef: b.hedef, alici: alicilar.length, push, baslik } });
    return { ok: true, alici: alicilar.length, push };
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
