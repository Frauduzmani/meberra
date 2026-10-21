"use strict";
// Soru-cevap: öğrenci bir soruyu (bağlamıyla) Meberra ekibine sorar; yönetici yanıtlar; iyi yanıtlar SSS'ye eklenir.
// Kota: ücretsiz planda takvim ayı (Europe/Istanbul) başına config.soruHakki (varsayılan 3) yeni soru; Premium ve
// yöneticiler sınırsız. Takip mesajları hak tüketmez.
const config = require("./config");
const { islem, simdi } = require("./db");
const { HttpHata } = require("./http");
const { hizSinirlayici } = require("./guvenlik");
const zaman = require("./zaman");
const { varlikDurumu } = require("./varlik");

const METIN_EN_FAZLA = 2000, BAGLAM_EN_FAZLA = 8000, TAKIP_EN_FAZLA = 20, SAYFA_BOYU = 25;
const DURUMLAR = ["bekliyor", "cevaplandi", "kapandi"];
const kirp = s => String(s == null ? "" : s).trim().replace(/\s+/g, " ");
// Çok satırlı metin: satır sonları korunur, baştaki/sondaki boşluk ve 3+ boş satır kırpılır
const metinTemiz = s => String(s == null ? "" : s).replace(/\r\n?/g, "\n").replace(/[^\S\n]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
const sayfaNo = q => Math.max(1, Math.floor(+q.get("sayfa") || 1));
const jsonCoz = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };

function metinDogrula(v, alan) {
  const m = metinTemiz(v);
  if (!m) throw new HttpHata(400, "Mesajını yaz.", { [alan]: "Mesajını yaz." });
  if (m.length > METIN_EN_FAZLA) throw new HttpHata(400, "Mesaj en fazla " + METIN_EN_FAZLA + " karakter olabilir.", { [alan]: "En fazla " + METIN_EN_FAZLA + " karakter." });
  return m;
}

function soruRotalari(r, c) {
  const { db, hesap, denetim, bildirim, eposta, oturumGerekli, yoneticiGerekli } = c;
  const sinir = hizSinirlayici(c.soruSiniri || 20, 60 * 60e3); // kullanıcı başına saatte 20 mesaj (soru + takip)
  const sinirsizMi = u => u.rol === "yonetici" || hesap.uyelik(u.id).premium;

  function hak(u, simdiMs) {
    const a = zaman.ay(simdiMs == null ? Date.now() : simdiMs);
    const kullanilan = db.prepare("SELECT COUNT(*) AS n FROM questions WHERE user_id = ? AND olusturma >= ?").get(u.id, a.bas).n;
    if (sinirsizMi(u)) return { sinirsiz: true, limit: null, kullanilan, kalan: null, donem: a.anahtar };
    return { sinirsiz: false, limit: config.soruHakki, kullanilan, kalan: Math.max(0, config.soruHakki - kullanilan), donem: a.anahtar };
  }

  function soruBul(id) {
    const s = Number.isInteger(+id) ? db.prepare("SELECT * FROM questions WHERE id = ?").get(+id) : null;
    if (!s) throw new HttpHata(404, "Soru bulunamadı.");
    return s;
  }
  const mesajlar = id => db.prepare("SELECT * FROM question_messages WHERE question_id = ? ORDER BY id").all(id);
  function ogrenciGorunum(s) {
    return {
      id: s.id, sayfa: s.sayfa, soruRef: s.soru_ref, baglam: jsonCoz(s.baglam), metin: s.metin, durum: s.durum, olusturma: s.olusturma, guncelleme: s.guncelleme,
      // Öğrenciye yöneticinin adı gösterilmez: yanıtlar "Meberra ekibi" imzasıyla görünür
      mesajlar: mesajlar(s.id).map(m => ({ id: m.id, rol: m.rol, yazan: m.rol === "yonetici" ? "Meberra ekibi" : "Sen", metin: m.metin, tarih: m.tarih }))
    };
  }
  function kullaniciOzet(uid) {
    const u = db.prepare("SELECT public_id, ad, soyad, eposta, durum, son_gorulme FROM users WHERE id = ?").get(uid);
    if (!u) return null;
    const y = hesap.uyelik(uid);
    return { id: u.public_id, ad: u.ad, soyad: u.soyad, eposta: u.eposta, durum: u.durum, premium: y.premium, plan: y.plan, bitis: y.bitis,
      sonGorulme: u.son_gorulme, varlik: varlikDurumu(u.son_gorulme) };
  }
  const yoneticiAd = id => { if (!id) return null; const y = db.prepare("SELECT public_id, ad, soyad FROM users WHERE id = ?").get(id); return y ? { id: y.public_id, ad: y.ad, soyad: y.soyad } : null; };
  // Bekleme başlangıcı: son yönetici mesajından sonraki ilk öğrenci mesajı (SLA rozeti ve "en uzun bekleyen" sırası)
  const BEKLEME_SQL = `(SELECT MIN(m.tarih) FROM question_messages m WHERE m.question_id = q.id AND m.rol = 'ogrenci'
    AND m.id > COALESCE((SELECT MAX(y.id) FROM question_messages y WHERE y.question_id = q.id AND y.rol = 'yonetici'), 0))`;
  const SON_OGRENCI_SQL = "(SELECT MAX(m.tarih) FROM question_messages m WHERE m.question_id = q.id AND m.rol = 'ogrenci')";

  // --- öğrenci ------------------------------------------------------------------
  r.get("/api/sorular", req => {
    oturumGerekli(req);
    const u = req.kullanici;
    const satirlar = db.prepare(`SELECT q.*, (SELECT COUNT(*) FROM question_messages m WHERE m.question_id = q.id AND m.rol = 'yonetici' AND m.okundu IS NULL) AS okunmamis,
        (SELECT COUNT(*) FROM question_messages m WHERE m.question_id = q.id) AS mesaj_sayisi
      FROM questions q WHERE q.user_id = ? ORDER BY q.guncelleme DESC LIMIT 200`).all(u.id);
    return {
      ok: true, hak: hak(u),
      sorular: satirlar.map(s => ({ id: s.id, sayfa: s.sayfa, soruRef: s.soru_ref, metin: s.metin, durum: s.durum, olusturma: s.olusturma, guncelleme: s.guncelleme,
        mesajSayisi: s.mesaj_sayisi, okunmamis: s.okunmamis }))
    };
  });

  r.post("/api/sorular", req => {
    oturumGerekli(req);
    const u = req.kullanici, b = req.body || {};
    const metin = metinDogrula(b.metin, "metin");
    const sayfa = b.sayfa == null || b.sayfa === "" ? null : kirp(b.sayfa).slice(0, 80);
    const soruRef = b.soruRef == null || b.soruRef === "" ? null : kirp(b.soruRef).slice(0, 120);
    let baglam = null;
    if (b.baglam != null) {
      if (typeof b.baglam !== "object") throw new HttpHata(400, "baglam bir JSON nesnesi olmalı.", { baglam: "Nesne olmalı." });
      baglam = JSON.stringify(b.baglam);
      if (baglam.length > BAGLAM_EN_FAZLA) throw new HttpHata(413, "Soru bağlamı çok büyük (en fazla " + BAGLAM_EN_FAZLA + " karakter).");
    }
    if (!sinir.dene("u:" + u.id)) throw new HttpHata(429, "Çok kısa sürede çok fazla mesaj gönderdin. Biraz sonra tekrar dene.");
    let id;
    // Kota denetimi ve ekleme aynı işlemde: aynı anda iki istek hakkı aşamaz
    islem(db, () => {
      const h = hak(u);
      if (!h.sinirsiz && h.kalan <= 0)
        throw new HttpHata(402, "Bu ayki " + config.soruHakki + " ücretsiz soru hakkını kullandın. Premium ile sınırsız soru sorabilirsin; hakların ayın başında yenilenir.", null,
          { kalan: 0, premiumGerekli: true, hak: h });
      const z = simdi();
      id = Number(db.prepare("INSERT INTO questions (user_id, sayfa, soru_ref, baglam, metin, durum, olusturma, guncelleme) VALUES (?, ?, ?, ?, ?, 'bekliyor', ?, ?)")
        .run(u.id, sayfa, soruRef, baglam, metin, z, z).lastInsertRowid);
      db.prepare("INSERT INTO question_messages (question_id, yazan_id, rol, metin, tarih) VALUES (?, ?, 'ogrenci', ?, ?)").run(id, u.id, metin, z);
    });
    denetim({ eylem: "soru.sor", kullanici: u.id, istek: req, varlik: "questions", varlikId: id, ayrinti: { sayfa, soruRef } });
    return { ok: true, soru: ogrenciGorunum(soruBul(id)), hak: hak(u) };
  });

  r.get("/api/sorular/:id", req => {
    oturumGerekli(req);
    const s = soruBul(req.params.id);
    if (s.user_id !== req.kullanici.id) throw new HttpHata(404, "Soru bulunamadı.");
    db.prepare("UPDATE question_messages SET okundu = ? WHERE question_id = ? AND rol = 'yonetici' AND okundu IS NULL").run(simdi(), s.id);
    return { ok: true, soru: ogrenciGorunum(s) };
  });

  r.post("/api/sorular/:id/mesaj", req => {
    oturumGerekli(req);
    const u = req.kullanici, s = soruBul(req.params.id);
    if (s.user_id !== u.id) throw new HttpHata(404, "Soru bulunamadı.");
    if (s.durum === "kapandi") throw new HttpHata(409, "Bu soru kapatıldı. Yeni bir soru sorabilirsin.");
    const metin = metinDogrula(req.body && req.body.metin, "metin");
    const n = db.prepare("SELECT COUNT(*) AS n FROM question_messages WHERE question_id = ? AND rol = 'ogrenci'").get(s.id).n;
    if (n > TAKIP_EN_FAZLA) throw new HttpHata(409, "Bu soruda çok fazla mesaj var. Lütfen yeni bir soru aç.");
    if (!sinir.dene("u:" + u.id)) throw new HttpHata(429, "Çok kısa sürede çok fazla mesaj gönderdin. Biraz sonra tekrar dene.");
    const z = simdi();
    islem(db, () => {
      db.prepare("INSERT INTO question_messages (question_id, yazan_id, rol, metin, tarih) VALUES (?, ?, 'ogrenci', ?, ?)").run(s.id, u.id, metin, z);
      db.prepare("UPDATE questions SET durum = 'bekliyor', guncelleme = ? WHERE id = ?").run(z, s.id);
    });
    denetim({ eylem: "soru.takip", kullanici: u.id, istek: req, varlik: "questions", varlikId: s.id });
    return { ok: true, soru: ogrenciGorunum(soruBul(s.id)) };
  });

  // --- SSS (herkese açık) ------------------------------------------------------------
  const sssGenel = f => ({ id: f.id, soru: f.soru, cevap: f.cevap, sayfa: f.sayfa });
  r.get("/api/public/sss", req => {
    const sayfa = kirp(req.sorgu.get("sayfa")).slice(0, 80);
    const satirlar = sayfa
      ? db.prepare("SELECT * FROM faq WHERE durum = 'yayinda' AND (sayfa = ? OR sayfa IS NULL) ORDER BY (sayfa IS NULL), sira, id DESC LIMIT 200").all(sayfa)
      : db.prepare("SELECT * FROM faq WHERE durum = 'yayinda' ORDER BY sira, id DESC LIMIT 500").all();
    return { ok: true, sss: satirlar.map(sssGenel) };
  });

  // --- yönetici ------------------------------------------------------------------
  r.get("/api/admin/sorular", req => {
    yoneticiGerekli(req);
    if (c.varlik) c.varlik.bosalt();
    const d = String(req.sorgu.get("durum") || "bekliyor"), sayfa = sayfaNo(req.sorgu);
    const kosul = [], arg = [];
    if (DURUMLAR.indexOf(d) >= 0) { kosul.push("q.durum = ?"); arg.push(d); }
    const ara = kirp(req.sorgu.get("q")).slice(0, 80);
    if (ara) {
      const l = "%" + ara.replace(/[%_\\]/g, "") + "%";
      kosul.push("(q.metin LIKE ? OR q.sayfa LIKE ? OR EXISTS (SELECT 1 FROM users u WHERE u.id = q.user_id AND (u.ad || ' ' || u.soyad LIKE ? OR u.eposta LIKE ?)))");
      arg.push(l, l, l, l);
    }
    if (req.sorgu.get("atanan") === "ben") { kosul.push("q.atanan_id = ?"); arg.push(req.kullanici.id); }
    if (/^\d+$/.test(String(req.sorgu.get("soru") || ""))) { kosul.push("q.id = ?"); arg.push(+req.sorgu.get("soru")); }
    const where = kosul.length ? "WHERE " + kosul.join(" AND ") : "";
    const toplam = db.prepare("SELECT COUNT(*) AS n FROM questions q " + where).get(...arg).n;
    // Varsayılan: bekleyenler en uzun bekleyen önce, diğerleri en yeni önce. sirala=eski|yeni ile değiştirilebilir.
    const s_ = req.sorgu.get("sirala");
    const sira = s_ === "yeni" ? "q.guncelleme DESC" : s_ === "eski" || d === "bekliyor" ? "COALESCE(bekleme, q.guncelleme) ASC" : "q.guncelleme DESC";
    const satirlar = db.prepare(`SELECT q.*, (SELECT COUNT(*) FROM question_messages m WHERE m.question_id = q.id) AS mesaj_sayisi,
        (SELECT rol FROM question_messages m WHERE m.question_id = q.id ORDER BY m.id DESC LIMIT 1) AS son_rol,
        ${BEKLEME_SQL} AS bekleme, ${SON_OGRENCI_SQL} AS son_ogrenci,
        (SELECT COUNT(*) FROM soru_notlari n WHERE n.question_id = q.id) AS not_sayisi
      FROM questions q ${where} ORDER BY ${sira}, q.id LIMIT ? OFFSET ?`).all(...arg, SAYFA_BOYU, (sayfa - 1) * SAYFA_BOYU);
    const sayilar = { bekliyor: 0, cevaplandi: 0, kapandi: 0 };
    db.prepare("SELECT durum, COUNT(*) AS n FROM questions GROUP BY durum").all().forEach(x => { sayilar[x.durum] = x.n; });
    sayilar.okunmamis = db.prepare(`SELECT COUNT(*) AS n FROM questions q WHERE q.durum = 'bekliyor' AND ${SON_OGRENCI_SQL} > COALESCE(q.yonetici_okundu, '')`).get().n;
    return {
      ok: true, toplam, sayfa, sayfaBoyu: SAYFA_BOYU, sayfaBoyutu: SAYFA_BOYU, sayilar,
      sorular: satirlar.map(s => ({ id: s.id, kullanici: kullaniciOzet(s.user_id), sayfa: s.sayfa, soruRef: s.soru_ref, metin: s.metin, durum: s.durum,
        olusturma: s.olusturma, guncelleme: s.guncelleme, mesajSayisi: s.mesaj_sayisi, sonMesajRol: s.son_rol,
        beklemeBaslangic: s.durum === "bekliyor" ? s.bekleme || s.guncelleme : null,
        okunmamis: !!(s.son_ogrenci && s.son_ogrenci > (s.yonetici_okundu || "")), atanan: yoneticiAd(s.atanan_id), notSayisi: s.not_sayisi }))
    };
  });

  function yoneticiGorunum(s) {
    const adlar = {};
    const bek = s.durum === "bekliyor" ? db.prepare("SELECT " + BEKLEME_SQL.replace(/q\.id/g, "?") + " AS b").get(s.id, s.id).b : null;
    return {
      id: s.id, kullanici: kullaniciOzet(s.user_id), sayfa: s.sayfa, soruRef: s.soru_ref, baglam: jsonCoz(s.baglam), metin: s.metin, durum: s.durum,
      olusturma: s.olusturma, guncelleme: s.guncelleme, atanan: yoneticiAd(s.atanan_id), beklemeBaslangic: s.durum === "bekliyor" ? bek || s.guncelleme : null,
      // İç notlar: yalnızca yönetici görünümünde; öğrenci uç noktaları bu tabloyu hiç okumaz
      notlar: db.prepare("SELECT n.id, n.metin, n.tarih, u.ad, u.soyad FROM soru_notlari n LEFT JOIN users u ON u.id = n.yazan_id WHERE n.question_id = ? ORDER BY n.id").all(s.id)
        .map(n => ({ id: n.id, metin: n.metin, tarih: n.tarih, yazan: n.ad ? { ad: n.ad, soyad: n.soyad } : null })),
      mesajlar: mesajlar(s.id).map(m => {
        if (m.yazan_id && !(m.yazan_id in adlar)) { const y = db.prepare("SELECT ad, soyad FROM users WHERE id = ?").get(m.yazan_id); adlar[m.yazan_id] = y ? { ad: y.ad, soyad: y.soyad } : null; }
        return { id: m.id, rol: m.rol, metin: m.metin, tarih: m.tarih, okundu: m.okundu, yazan: m.yazan_id ? adlar[m.yazan_id] : null };
      }),
      sss: db.prepare("SELECT * FROM faq WHERE kaynak_soru_id = ? ORDER BY id").all(s.id).map(f => Object.assign(sssGenel(f), { durum: f.durum }))
    };
  }

  r.get("/api/admin/sorular/:id", req => {
    yoneticiGerekli(req);
    if (c.varlik) c.varlik.bosalt();
    const s = soruBul(req.params.id);
    db.prepare("UPDATE questions SET yonetici_okundu = ? WHERE id = ?").run(simdi(), s.id);
    return { ok: true, soru: yoneticiGorunum(s) };
  });

  r.post("/api/admin/sorular/:id/yanit", async req => {
    yoneticiGerekli(req);
    const s = soruBul(req.params.id);
    const metin = metinDogrula(req.body && req.body.metin, "metin");
    const sahip = db.prepare("SELECT durum FROM users WHERE id = ?").get(s.user_id);
    if (!sahip || sahip.durum === "silindi") throw new HttpHata(409, "Bu sorunun sahibi hesabını silmiş.");
    const z = simdi(), kapat = (req.body || {}).kapat === true;
    islem(db, () => {
      db.prepare("INSERT INTO question_messages (question_id, yazan_id, rol, metin, tarih) VALUES (?, ?, 'yonetici', ?, ?)").run(s.id, req.kullanici.id, metin, z);
      // Atanmamış konuşma yanıtlayan yöneticiye atanır
      db.prepare("UPDATE questions SET durum = ?, guncelleme = ?, yonetici_okundu = ?, atanan_id = COALESCE(atanan_id, ?) WHERE id = ?")
        .run(kapat ? "kapandi" : "cevaplandi", z, z, req.kullanici.id, s.id);
    });
    const ayar = bildirim.ayarSatiri(s.user_id);
    const link = "/sorularim?soru=" + s.id;
    const ozet = metin.length > 140 ? metin.slice(0, 137) + "…" : metin;
    const b = bildirim.olustur(s.user_id, { tur: "soru-yanit", baslik: "Sorun yanıtlandı", metin: ozet, link }, {
      push: true,
      eposta: ayar.eposta_bildirim ? {
        konu: "Meberra: sorun yanıtlandı",
        metin: "Merhaba,\n\nMeberra ekibi sorunu yanıtladı:\n\n\"" + ozet + "\"\n\nYanıtın tamamını görmek için: " + config.baseUrl + link +
          "\n\nBu e-postaları almak istemiyorsan tek tıkla durdur: " + bildirim.iptalLinki(ayar, "yanit") + "\n\nİyi çalışmalar,\nMeberra"
      } : null
    });
    await b.push;
    denetim({ eylem: "soru.yanit", kullanici: s.user_id, yapan: req.kullanici.id, istek: req, varlik: "questions", varlikId: s.id, ayrinti: kapat ? { kapat: true } : undefined });
    return { ok: true, soru: yoneticiGorunum(soruBul(s.id)) };
  });

  // İç not: öğrenci görmez, bildirim gitmez
  r.post("/api/admin/sorular/:id/not", req => {
    yoneticiGerekli(req);
    const s = soruBul(req.params.id);
    const metin = metinDogrula(req.body && req.body.metin, "metin");
    const id = Number(db.prepare("INSERT INTO soru_notlari (question_id, yazan_id, metin, tarih) VALUES (?, ?, ?, ?)").run(s.id, req.kullanici.id, metin, simdi()).lastInsertRowid);
    denetim({ eylem: "soru.not", kullanici: s.user_id, yapan: req.kullanici.id, istek: req, varlik: "questions", varlikId: s.id, ayrinti: { notId: id } });
    return { ok: true, soru: yoneticiGorunum(soruBul(s.id)) };
  });

  // Atanan yönetici (çok yöneticili kullanım için). atanan: yönetici kimliği (public id) | "ben" | null
  r.post("/api/admin/sorular/:id/ata", req => {
    yoneticiGerekli(req);
    const s = soruBul(req.params.id), a = (req.body || {}).atanan;
    let yid = null;
    if (a === "ben") yid = req.kullanici.id;
    else if (a != null && a !== "") {
      const y = db.prepare("SELECT id FROM users WHERE public_id = ? AND rol = 'yonetici' AND durum = 'aktif'").get(String(a));
      if (!y) throw new HttpHata(400, "Atanacak kişi etkin bir yönetici olmalı.", { atanan: "Geçersiz yönetici." });
      yid = y.id;
    }
    db.prepare("UPDATE questions SET atanan_id = ? WHERE id = ?").run(yid, s.id);
    denetim({ eylem: "soru.ata", kullanici: s.user_id, yapan: req.kullanici.id, istek: req, varlik: "questions", varlikId: s.id, ayrinti: { once: yoneticiAd(s.atanan_id), sonra: yoneticiAd(yid) } });
    return { ok: true, soru: yoneticiGorunum(soruBul(s.id)) };
  });

  r.get("/api/admin/yoneticiler", req => {
    yoneticiGerekli(req);
    return { ok: true, ben: req.kullanici.public_id, yoneticiler: db.prepare("SELECT public_id, ad, soyad FROM users WHERE rol = 'yonetici' AND durum = 'aktif' ORDER BY ad").all()
      .map(y => ({ id: y.public_id, ad: y.ad, soyad: y.soyad })) };
  });

  // --- Hazır yanıtlar (yöneticiler arasında ortak) ----------------------------------------
  const hazirGenel = h => ({ id: h.id, baslik: h.baslik, metin: h.metin, guncelleme: h.guncelleme });
  function hazirDogrula(b) {
    const e = {}, baslik = kirp(b && b.baslik), metin = metinTemiz(b && b.metin);
    if (!baslik) e.baslik = "Başlık yaz."; else if (baslik.length > 80) e.baslik = "En fazla 80 karakter.";
    if (!metin) e.metin = "Metni yaz."; else if (metin.length > METIN_EN_FAZLA) e.metin = "En fazla " + METIN_EN_FAZLA + " karakter.";
    if (Object.keys(e).length) throw new HttpHata(400, "Lütfen işaretli alanları düzelt.", e);
    return { baslik, metin };
  }
  const hazirBul = id => { const h = db.prepare("SELECT * FROM hazir_yanitlar WHERE id = ?").get(+id || 0); if (!h) throw new HttpHata(404, "Hazır yanıt bulunamadı."); return h; };
  r.get("/api/admin/hazir-yanitlar", req => {
    yoneticiGerekli(req);
    return { ok: true, yanitlar: db.prepare("SELECT * FROM hazir_yanitlar ORDER BY baslik COLLATE NOCASE, id LIMIT 200").all().map(hazirGenel) };
  });
  r.post("/api/admin/hazir-yanitlar", req => {
    yoneticiGerekli(req);
    const v = hazirDogrula(req.body), z = simdi();
    if (db.prepare("SELECT COUNT(*) AS n FROM hazir_yanitlar").get().n >= 200) throw new HttpHata(409, "En fazla 200 hazır yanıt kaydedilebilir.");
    const id = Number(db.prepare("INSERT INTO hazir_yanitlar (baslik, metin, olusturan, olusturma, guncelleme) VALUES (?, ?, ?, ?, ?)").run(v.baslik, v.metin, req.kullanici.id, z, z).lastInsertRowid);
    denetim({ eylem: "hazir-yanit.ekle", yapan: req.kullanici.id, istek: req, varlik: "hazir_yanitlar", varlikId: id, ayrinti: { baslik: v.baslik } });
    return { ok: true, yanit: hazirGenel(hazirBul(id)) };
  });
  r.put("/api/admin/hazir-yanitlar/:id", req => {
    yoneticiGerekli(req);
    const h = hazirBul(req.params.id), v = hazirDogrula(req.body);
    db.prepare("UPDATE hazir_yanitlar SET baslik = ?, metin = ?, guncelleme = ? WHERE id = ?").run(v.baslik, v.metin, simdi(), h.id);
    denetim({ eylem: "hazir-yanit.duzenle", yapan: req.kullanici.id, istek: req, varlik: "hazir_yanitlar", varlikId: h.id, ayrinti: { once: h.baslik, sonra: v.baslik } });
    return { ok: true, yanit: hazirGenel(hazirBul(h.id)) };
  });
  r.delete("/api/admin/hazir-yanitlar/:id", req => {
    yoneticiGerekli(req);
    const h = hazirBul(req.params.id);
    db.prepare("DELETE FROM hazir_yanitlar WHERE id = ?").run(h.id);
    denetim({ eylem: "hazir-yanit.sil", yapan: req.kullanici.id, istek: req, varlik: "hazir_yanitlar", varlikId: h.id, ayrinti: { baslik: h.baslik } });
    return { ok: true };
  });

  r.post("/api/admin/sorular/:id/durum", req => {
    yoneticiGerekli(req);
    const s = soruBul(req.params.id), d = (req.body || {}).durum;
    if (DURUMLAR.indexOf(d) < 0) throw new HttpHata(400, "Durum bekliyor, cevaplandi ya da kapandi olmalı.");
    db.prepare("UPDATE questions SET durum = ?, guncelleme = ? WHERE id = ?").run(d, simdi(), s.id);
    denetim({ eylem: "soru.durum", kullanici: s.user_id, yapan: req.kullanici.id, istek: req, varlik: "questions", varlikId: s.id, ayrinti: { once: s.durum, sonra: d } });
    return { ok: true, soru: yoneticiGorunum(soruBul(s.id)) };
  });

  r.get("/api/admin/sss", req => {
    yoneticiGerekli(req);
    return { ok: true, sss: db.prepare("SELECT * FROM faq ORDER BY id DESC LIMIT 500").all().map(f => Object.assign(sssGenel(f), { durum: f.durum, sira: f.sira, kaynakSoruId: f.kaynak_soru_id, olusturma: f.olusturma })) };
  });

  r.post("/api/admin/sss", req => {
    yoneticiGerekli(req);
    const b = req.body || {}, e = {};
    const soru = metinTemiz(b.soru), cevap = metinTemiz(b.cevap);
    if (!soru) e.soru = "Soruyu yaz."; else if (soru.length > 500) e.soru = "En fazla 500 karakter.";
    if (!cevap) e.cevap = "Cevabı yaz."; else if (cevap.length > 4000) e.cevap = "En fazla 4000 karakter.";
    const sayfa = b.sayfa == null || b.sayfa === "" ? null : kirp(b.sayfa).slice(0, 80);
    let kaynak = null;
    if (b.kaynakSoruId != null && b.kaynakSoruId !== "") {
      kaynak = soruBul(b.kaynakSoruId).id;
    }
    if (Object.keys(e).length) throw new HttpHata(400, "Lütfen işaretli alanları düzelt.", e);
    const z = simdi();
    const id = Number(db.prepare("INSERT INTO faq (soru, cevap, sayfa, kaynak_soru_id, durum, sira, olusturan, olusturma, guncelleme) VALUES (?, ?, ?, ?, 'yayinda', 0, ?, ?, ?)")
      .run(soru, cevap, sayfa, kaynak, req.kullanici.id, z, z).lastInsertRowid);
    denetim({ eylem: "sss.ekle", yapan: req.kullanici.id, istek: req, varlik: "faq", varlikId: id, ayrinti: { sayfa, kaynakSoruId: kaynak } });
    return { ok: true, sss: sssGenel(db.prepare("SELECT * FROM faq WHERE id = ?").get(id)) };
  });

  return { hak, sinir };
}

module.exports = { soruRotalari, METIN_EN_FAZLA };
