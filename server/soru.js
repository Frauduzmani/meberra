"use strict";
// Soru-cevap: öğrenci bir soruyu (bağlamıyla) Meberra ekibine sorar; yönetici yanıtlar; iyi yanıtlar SSS'ye eklenir.
// Kota: ücretsiz planda takvim ayı (Europe/Istanbul) başına config.soruHakki (varsayılan 3) yeni soru; Premium ve
// yöneticiler sınırsız. Takip mesajları hak tüketmez.
const config = require("./config");
const { islem, simdi } = require("./db");
const { HttpHata } = require("./http");
const { hizSinirlayici } = require("./guvenlik");
const zaman = require("./zaman");

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
    const u = db.prepare("SELECT public_id, ad, soyad, eposta, durum FROM users WHERE id = ?").get(uid);
    return u ? { id: u.public_id, ad: u.ad, soyad: u.soyad, eposta: u.eposta, durum: u.durum, premium: hesap.uyelik(uid).premium } : null;
  }

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
    const d = String(req.sorgu.get("durum") || "bekliyor"), sayfa = sayfaNo(req.sorgu);
    const where = DURUMLAR.indexOf(d) >= 0 ? "WHERE q.durum = ?" : "", arg = where ? [d] : [];
    const toplam = db.prepare("SELECT COUNT(*) AS n FROM questions q " + where).get(...arg).n;
    // Bekleyenler en eski önce (sıra bekleyen öğrenci), diğerleri en yeni önce
    const sira = d === "bekliyor" ? "q.guncelleme ASC" : "q.guncelleme DESC";
    const satirlar = db.prepare(`SELECT q.*, (SELECT COUNT(*) FROM question_messages m WHERE m.question_id = q.id) AS mesaj_sayisi,
        (SELECT rol FROM question_messages m WHERE m.question_id = q.id ORDER BY m.id DESC LIMIT 1) AS son_rol
      FROM questions q ${where} ORDER BY ${sira} LIMIT ? OFFSET ?`).all(...arg, SAYFA_BOYU, (sayfa - 1) * SAYFA_BOYU);
    return {
      ok: true, toplam, sayfa, sayfaBoyu: SAYFA_BOYU, sayfaBoyutu: SAYFA_BOYU,
      sorular: satirlar.map(s => ({ id: s.id, kullanici: kullaniciOzet(s.user_id), sayfa: s.sayfa, soruRef: s.soru_ref, metin: s.metin, durum: s.durum,
        olusturma: s.olusturma, guncelleme: s.guncelleme, mesajSayisi: s.mesaj_sayisi, sonMesajRol: s.son_rol }))
    };
  });

  function yoneticiGorunum(s) {
    const adlar = {};
    return {
      id: s.id, kullanici: kullaniciOzet(s.user_id), sayfa: s.sayfa, soruRef: s.soru_ref, baglam: jsonCoz(s.baglam), metin: s.metin, durum: s.durum,
      olusturma: s.olusturma, guncelleme: s.guncelleme,
      mesajlar: mesajlar(s.id).map(m => {
        if (m.yazan_id && !(m.yazan_id in adlar)) { const y = db.prepare("SELECT ad, soyad FROM users WHERE id = ?").get(m.yazan_id); adlar[m.yazan_id] = y ? { ad: y.ad, soyad: y.soyad } : null; }
        return { id: m.id, rol: m.rol, metin: m.metin, tarih: m.tarih, okundu: m.okundu, yazan: m.yazan_id ? adlar[m.yazan_id] : null };
      }),
      sss: db.prepare("SELECT * FROM faq WHERE kaynak_soru_id = ? ORDER BY id").all(s.id).map(f => Object.assign(sssGenel(f), { durum: f.durum }))
    };
  }

  r.get("/api/admin/sorular/:id", req => { yoneticiGerekli(req); return { ok: true, soru: yoneticiGorunum(soruBul(req.params.id)) }; });

  r.post("/api/admin/sorular/:id/yanit", async req => {
    yoneticiGerekli(req);
    const s = soruBul(req.params.id);
    const metin = metinDogrula(req.body && req.body.metin, "metin");
    const sahip = db.prepare("SELECT durum FROM users WHERE id = ?").get(s.user_id);
    if (!sahip || sahip.durum === "silindi") throw new HttpHata(409, "Bu sorunun sahibi hesabını silmiş.");
    const z = simdi();
    islem(db, () => {
      db.prepare("INSERT INTO question_messages (question_id, yazan_id, rol, metin, tarih) VALUES (?, ?, 'yonetici', ?, ?)").run(s.id, req.kullanici.id, metin, z);
      db.prepare("UPDATE questions SET durum = 'cevaplandi', guncelleme = ? WHERE id = ?").run(z, s.id);
    });
    const ayar = bildirim.ayarSatiri(s.user_id);
    const link = "/profil.html?soru=" + s.id + "#sorularim";
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
    denetim({ eylem: "soru.yanit", kullanici: s.user_id, yapan: req.kullanici.id, istek: req, varlik: "questions", varlikId: s.id });
    return { ok: true, soru: yoneticiGorunum(soruBul(s.id)) };
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

  return { hak };
}

module.exports = { soruRotalari, METIN_EN_FAZLA };
