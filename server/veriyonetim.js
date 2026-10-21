"use strict";
// Yönetici "Veri" sekmesi: tablo tarayıcı / düzenleyici.
// Güvenlik: tablo adı hem bu izin listesinde hem sqlite_master'da olmalı; sütun adları yalnızca PRAGMA table_info'dan gelir
// (istemciden gelen ad SQL'e asla doğrudan girmez). Gizli sütunlar (şifre özeti, belirteç özetleri, push anahtarları) "••••"
// olarak döner, aranamaz/sıralanamaz/süzülemez. Hiçbir tabloda silme yoktur; audit_log ve izin listesinde düzenlenebilir
// alanı olmayan tablolar salt okunurdur. Her düzenleme denetim kaydına önceki/sonraki değerlerle yazılır.
const { islem, simdi } = require("./db");
const { HttpHata } = require("./http");

const GIZLI = "••••";
const SAYFA_BOYU = 50;
const CSV_EN_FAZLA = 50000;

// --- alan kuralları -------------------------------------------------------------------
const metin = (min, max) => ({ tur: "metin", min, max });
const secim = degerler => ({ tur: "secim", degerler });
const tamsayi = (min, max) => ({ tur: "tamsayi", min, max });
const BOOL = { tur: "bool" };
const TARIH = { tur: "tarih" };
const JSON_ = { tur: "json", max: 20000 };

const TABLOLAR = {
  users: { aciklama: "Kullanıcı hesapları (silme yok: durum = askida)", gizli: ["sifre_hash"], damga: "guncelleme", kullanici: "id",
    alanlar: { ad: metin(1, 40), soyad: metin(1, 40), durum: secim(["aktif", "askida"]), rol: secim(["ogrenci", "yonetici", "veli"]) } },
  veli_baglantilari: { aciklama: "Veli bağlantıları (salt okunur; öğrenci ya da veli kaldırır)", gizli: ["belirtec_hash", "rapor_belirtec"], kullanici: "ogrenci_id" }, // 1.7.0
  profiles: { aciklama: "Öğrenci profilleri (sütun düzenlemesi veri JSON'una da işlenir)", anahtar: "user_id", damga: "guncelleme", kullanici: "user_id",
    alanlar: { ogrenci_modeli: metin(0, 20), sinif: metin(0, 20), ulkeler: Object.assign(metin(0, 60), { re: "^([a-z]{2}(,[a-z]{2})*)?$" }), okul: metin(0, 100), tamamlandi: BOOL, veri: JSON_ } },
  subscriptions: { aciklama: "Premium dönemleri", kullanici: "user_id", alanlar: { bitis: TARIH, durum: secim(["aktif", "iptal"]) } },
  upgrade_requests: { aciklama: "Ödeme bildirimleri (onay için Ödeme talepleri sekmesini kullan)", kullanici: "user_id",
    alanlar: { durum: secim(["bekliyor", "reddedildi", "iptal"]), islem_notu: metin(0, 300) } },
  questions: { aciklama: "Öğrenci soruları", damga: "guncelleme", kullanici: "user_id", alanlar: { durum: secim(["bekliyor", "cevaplandi", "kapandi"]) } },
  question_messages: { aciklama: "Soru yazışmaları (salt okunur)" },
  faq: { aciklama: "Sık sorulan sorular", damga: "guncelleme",
    alanlar: { soru: metin(1, 500), cevap: metin(1, 4000), sayfa: metin(0, 80), durum: secim(["yayinda", "gizli"]), sira: tamsayi(-1000, 1000) } },
  lig_uyeleri: { aciklama: "Lig üyeleri (takma ad moderasyonu)", anahtar: "user_id", damga: "guncelleme", kullanici: "user_id",
    alanlar: { takma_ad: { tur: "takmaAd", min: 3, max: 20 }, durum: secim(["aktif", "ayrildi", "gizli"]), kademe: tamsayi(1, 5) } },
  lig_haftalik: { aciklama: "Haftalık lig grupları (salt okunur)", kullanici: "user_id" },
  lig_haftalar: { aciklama: "Kapanmış lig haftaları (salt okunur)" },
  notifications: { aciklama: "Uygulama içi bildirimler (salt okunur)", kullanici: "user_id" },
  notification_prefs: { aciklama: "Bildirim tercihleri (salt okunur; öğrenci kendisi değiştirir)", anahtar: "user_id", gizli: ["iptal_belirtec", "veli_belirtec"], kullanici: "user_id" },
  push_subscriptions: { aciklama: "Web push abonelikleri (salt okunur)", gizli: ["endpoint", "p256dh", "auth"], kullanici: "user_id" },
  reminder_log: { aciklama: "Gönderilen hatırlatmalar (salt okunur)", kullanici: "user_id" },
  answers: { aciklama: "Cevap olayları (salt okunur)", kullanici: "user_id" },
  wrong_answers: { aciklama: "Yanlışlarım (salt okunur)", kullanici: "user_id" },
  exams: { aciklama: "Denemeler (salt okunur)", kullanici: "user_id" },
  level_tests: { aciklama: "Seviye testleri (salt okunur)", kullanici: "user_id" },
  user_state: { aciklama: "Tarayıcı deposu senkronu (salt okunur)", kullanici: "user_id" },
  state_tombstones: { aciklama: "Senkron silme izleri (salt okunur)", kullanici: "user_id" },
  sessions: { aciklama: "Oturumlar (salt okunur)", gizli: ["token_hash"], kullanici: "user_id" },
  password_resets: { aciklama: "Şifre sıfırlama istekleri (salt okunur)", gizli: ["token_hash"], kullanici: "user_id" },
  email_outbox: { aciklama: "Giden e-postalar (salt okunur; bağlantı belirteçleri gizlenir)", temizle: { metin: s => s == null ? s : String(s).replace(/([?&](?:t|token)=)[^\s&]+/g, "$1" + GIZLI) } },
  audit_log: { aciklama: "Denetim kaydı (salt okunur)", kullanici: "user_id" },
  system_logs: { aciklama: "Sistem logları (salt okunur; durum için Sistem sekmesini kullan)" },
  schema_migrations: { aciklama: "Uygulanan şema geçişleri (salt okunur)" }
};

const csvHucre = (v, ayrac) => {
  if (v == null) return "";
  let s = String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s; // CSV/formül enjeksiyonuna karşı
  if (s.length > 32000) s = s.slice(0, 32000) + "…";
  return s.includes(ayrac) || /["\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

function veriRotalari(r, c) {
  const { db, denetim, yoneticiGerekli, lig } = c;
  const sema = new Map(); // tablo → sütunlar (önbellek; şema çalışırken değişmez)

  function tabloAl(ad) {
    const t = String(ad || "");
    if (!Object.prototype.hasOwnProperty.call(TABLOLAR, t)) throw new HttpHata(404, "Tablo bulunamadı ya da izin listesinde değil.");
    if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(t)) throw new HttpHata(404, "Tablo bulunamadı.");
    if (!sema.has(t)) sema.set(t, db.prepare("SELECT name, type, pk FROM pragma_table_info(?)").all(t));
    const k = TABLOLAR[t], sutunlar = sema.get(t);
    const adlar = sutunlar.map(s => s.name);
    const tekPk = sutunlar.filter(s => s.pk > 0);
    const anahtar = k.anahtar || (tekPk.length === 1 ? tekPk[0].name : null); // null → rowid
    return {
      ad: t, k, sutunlar, adlar, anahtar,
      gizli: new Set(k.gizli || []),
      alanlar: Object.keys(k.alanlar || {}).filter(a => adlar.indexOf(a) >= 0)
    };
  }
  const q_ = s => '"' + s.replace(/"/g, '""') + '"'; // yalnızca şemadan gelen adlar için

  function satirGoster(T, row, kisalt) {
    const o = { _id: T.anahtar ? row[T.anahtar] : row._rid };
    T.adlar.forEach(a => {
      let v = row[a];
      if (T.gizli.has(a)) v = v == null ? null : GIZLI;
      else if (T.k.temizle && T.k.temizle[a]) v = T.k.temizle[a](v);
      if (kisalt && typeof v === "string" && v.length > 200) v = v.slice(0, 200) + "…";
      o[a] = v;
    });
    return o;
  }
  function sutunBilgisi(T) {
    return T.sutunlar.map(s => {
      const kural = T.alanlar.indexOf(s.name) >= 0 ? T.k.alanlar[s.name] : null;
      return { ad: s.name, tur: s.type || "", anahtar: s.name === T.anahtar, gizli: T.gizli.has(s.name), duzenlenebilir: !!kural,
        kural: kural ? Object.assign({}, kural, kural.re ? { re: kural.re } : {}) : null };
    });
  }

  function sorguKur(T, sorgu) {
    const kosul = [], arg = [];
    const q = String(sorgu.get("q") || "").trim().slice(0, 100);
    if (q) {
      const metinler = T.sutunlar.filter(s => !T.gizli.has(s.name) && /TEXT|CHAR|CLOB|^$/i.test(s.type || "")).map(s => s.name);
      if (metinler.length) {
        const l = "%" + q.replace(/[\\%_]/g, m => "\\" + m) + "%";
        kosul.push("(" + metinler.map(a => q_(a) + " LIKE ? ESCAPE '\\'").join(" OR ") + ")");
        metinler.forEach(() => arg.push(l));
      }
    }
    const alan = sorgu.get("alan");
    if (alan) {
      if (T.adlar.indexOf(alan) < 0) throw new HttpHata(400, "Bilinmeyen sütun: " + String(alan).slice(0, 40));
      if (T.gizli.has(alan)) throw new HttpHata(400, "Gizli sütunla süzülemez.");
      const d = sorgu.get("deger");
      if (d === null || d === "__null__") kosul.push(q_(alan) + " IS NULL");
      else { kosul.push("CAST(" + q_(alan) + " AS TEXT) = ?"); arg.push(String(d).slice(0, 500)); }
    }
    let sira = T.anahtar ? q_(T.anahtar) : "rowid";
    const sirala = sorgu.get("sirala");
    if (sirala) {
      if (T.adlar.indexOf(sirala) < 0) throw new HttpHata(400, "Bilinmeyen sütun: " + String(sirala).slice(0, 40));
      if (T.gizli.has(sirala)) throw new HttpHata(400, "Gizli sütuna göre sıralanamaz.");
      sira = q_(sirala);
    }
    const yon = String(sorgu.get("yon") || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
    return { where: kosul.length ? "WHERE " + kosul.join(" AND ") : "", arg, order: "ORDER BY " + sira + " " + yon + (sira === "rowid" ? "" : ", rowid " + yon) };
  }

  function satirBul(T, id) {
    const s = T.anahtar
      ? db.prepare("SELECT rowid AS _rid, * FROM " + q_(T.ad) + " WHERE " + q_(T.anahtar) + " = ?").get(Number.isInteger(+id) && String(id).trim() !== "" ? +id : String(id))
      : (Number.isInteger(+id) ? db.prepare("SELECT rowid AS _rid, * FROM " + q_(T.ad) + " WHERE rowid = ?").get(+id) : null);
    if (!s) throw new HttpHata(404, "Satır bulunamadı.");
    return s;
  }

  function csvGonder(req, res, T) {
    const s = sorguKur(T, req.sorgu);
    const ayrac = req.sorgu.get("ayrac") === "virgul" ? "," : ";";
    const satirlar = db.prepare("SELECT rowid AS _rid, * FROM " + q_(T.ad) + " " + s.where + " " + s.order + " LIMIT ?").all(...s.arg, CSV_EN_FAZLA);
    const govde = [T.adlar.map(a => csvHucre(a, ayrac)).join(ayrac)]
      .concat(satirlar.map(r => { const g = satirGoster(T, r, false); return T.adlar.map(a => csvHucre(g[a], ayrac)).join(ayrac); })).join("\r\n");
    denetim({ eylem: "veri.disa-aktar", yapan: req.kullanici.id, istek: req, varlik: T.ad, ayrinti: { satir: satirlar.length, q: req.sorgu.get("q") || undefined } });
    const tarih = new Date().toISOString().slice(0, 10);
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Disposition", 'attachment; filename="meberra-' + T.ad + "-" + tarih + '.csv"');
    res.end("﻿" + govde + "\r\n");
  }

  // --- doğrulama ---------------------------------------------------------------------
  function degerDogrula(T, alan, v, satir, yapanId) {
    const k = T.k.alanlar[alan];
    const hata = m => { throw new HttpHata(400, alan + ": " + m, { [alan]: m }); };
    if (k.tur === "metin") {
      if (v == null) v = "";
      if (typeof v !== "string" && typeof v !== "number") hata("Metin olmalı.");
      let s = String(v).trim();
      if (!s) { if (k.min > 0) hata("Boş bırakılamaz."); return null; }
      if (s.length > k.max) hata("En fazla " + k.max + " karakter.");
      if (k.re && !new RegExp(k.re).test(s)) hata("Biçim geçersiz.");
      return s;
    }
    if (k.tur === "secim") { if (k.degerler.indexOf(v) < 0) hata("Şunlardan biri olmalı: " + k.degerler.join(", ")); return v; }
    if (k.tur === "tamsayi") { const n = +v; if (v === "" || v == null || !Number.isInteger(n) || n < k.min || n > k.max) hata(k.min + "–" + k.max + " arası tam sayı olmalı."); return n; }
    if (k.tur === "bool") { if ([true, false, 0, 1, "0", "1", "true", "false"].indexOf(v) < 0) hata("0/1 olmalı."); return v === true || v === 1 || v === "1" || v === "true" ? 1 : 0; }
    if (k.tur === "tarih") { const t = Date.parse(v); if (typeof v !== "string" || isNaN(t)) hata("Geçerli bir tarih (ISO) olmalı."); return new Date(t).toISOString(); }
    if (k.tur === "json") {
      let o = v;
      if (typeof v === "string") { try { o = JSON.parse(v); } catch (e) { hata("Geçerli JSON olmalı."); } }
      if (!o || typeof o !== "object" || Array.isArray(o)) hata("JSON nesnesi olmalı.");
      const s = JSON.stringify(o);
      if (s.length > k.max) hata("En fazla " + k.max + " karakter.");
      return s;
    }
    if (k.tur === "takmaAd") {
      const t = lig.takmaAdTemiz(v);
      const sahip = db.prepare("SELECT user_id FROM lig_uyeleri WHERE takma_anahtar = ?").get(t.anahtar);
      if (sahip && sahip.user_id !== satir.user_id) throw new HttpHata(409, "Bu takma ad başka bir üyede.", { takma_ad: "Bu takma ad alınmış." });
      return t.ad;
    }
    hata("Desteklenmeyen alan.");
  }

  // Tabloya özgü kurallar ve yan etkiler (aynı işlem içinde)
  function ozelKurallar(T, satir, yeni, req) {
    const ek = {};
    if (T.ad === "users") {
      if (satir.durum === "silindi") throw new HttpHata(409, "Silinmiş hesap düzenlenemez.");
      if (satir.id === req.kullanici.id && ("rol" in yeni || "durum" in yeni)) throw new HttpHata(400, "Kendi rolünü ya da hesap durumunu buradan değiştiremezsin.");
      if (yeni.rol === "ogrenci" && satir.rol === "yonetici" && db.prepare("SELECT COUNT(*) AS n FROM users WHERE rol = 'yonetici' AND durum = 'aktif' AND id != ?").get(satir.id).n < 1)
        throw new HttpHata(409, "Son yöneticinin yetkisi kaldırılamaz.");
    }
    if (T.ad === "lig_uyeleri" && "takma_ad" in yeni) ek.takma_anahtar = String(yeni.takma_ad).toLocaleLowerCase("tr-TR");
    if (T.ad === "profiles" && !("veri" in yeni)) {
      // Sütun düzenlemesi istemcinin gördüğü profil JSON'una da işlenir
      let p = {};
      try { p = JSON.parse(satir.veri) || {}; } catch (e) { p = {}; }
      const esle = { ogrenci_modeli: "ogrenciModeli", sinif: "sinif", okul: "okul" };
      Object.keys(esle).forEach(a => { if (a in yeni) p[esle[a]] = yeni[a]; });
      if ("tamamlandi" in yeni) p.tamamlandi = !!yeni.tamamlandi;
      if ("ulkeler" in yeni) p.ulkeler = yeni.ulkeler ? yeni.ulkeler.split(",") : [];
      ek.veri = JSON.stringify(p);
    }
    return ek;
  }
  function yanEtkiler(T, satir, yeni) {
    if (T.ad === "users" && yeni.durum === "askida") db.prepare("UPDATE sessions SET iptal = ? WHERE user_id = ? AND iptal IS NULL").run(simdi(), satir.id);
    if (T.ad === "lig_uyeleri" && yeni.durum === "ayrildi") db.prepare("DELETE FROM lig_haftalik WHERE user_id = ? AND hafta NOT IN (SELECT hafta FROM lig_haftalar)").run(satir.user_id);
  }

  // --- rotalar -----------------------------------------------------------------------
  r.get("/api/admin/veri/tablolar", req => {
    yoneticiGerekli(req);
    const varOlan = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(x => x.name));
    return {
      ok: true, sayfaBoyu: SAYFA_BOYU,
      tablolar: Object.keys(TABLOLAR).filter(t => varOlan.has(t)).map(t => {
        const T = tabloAl(t);
        return { ad: t, aciklama: T.k.aciklama || "", satir: db.prepare("SELECT COUNT(*) AS n FROM " + q_(t)).get().n, anahtar: T.anahtar || "rowid",
          saltOkunur: !T.alanlar.length, duzenlenebilir: T.alanlar, sutunlar: sutunBilgisi(T) };
      })
    };
  });

  r.get("/api/admin/veri/:tablo", (req, res) => {
    yoneticiGerekli(req);
    let ad = req.params.tablo, csv = req.sorgu.get("bicim") === "csv";
    if (/\.csv$/i.test(ad)) { ad = ad.slice(0, -4); csv = true; }
    const T = tabloAl(ad);
    if (csv) return csvGonder(req, res, T);
    const s = sorguKur(T, req.sorgu), sayfa = Math.max(1, Math.floor(+req.sorgu.get("sayfa") || 1));
    const toplam = db.prepare("SELECT COUNT(*) AS n FROM " + q_(T.ad) + " " + s.where).get(...s.arg).n;
    const satirlar = db.prepare("SELECT rowid AS _rid, * FROM " + q_(T.ad) + " " + s.where + " " + s.order + " LIMIT ? OFFSET ?").all(...s.arg, SAYFA_BOYU, (sayfa - 1) * SAYFA_BOYU);
    return { ok: true, tablo: T.ad, toplam, sayfa, sayfaBoyu: SAYFA_BOYU, sayfaBoyutu: SAYFA_BOYU, anahtar: T.anahtar || "rowid", saltOkunur: !T.alanlar.length,
      sutunlar: sutunBilgisi(T), satirlar: satirlar.map(x => satirGoster(T, x, true)) };
  });

  r.get("/api/admin/veri/:tablo/:id", req => {
    yoneticiGerekli(req);
    const T = tabloAl(req.params.tablo);
    return { ok: true, tablo: T.ad, saltOkunur: !T.alanlar.length, sutunlar: sutunBilgisi(T), satir: satirGoster(T, satirBul(T, req.params.id), false) };
  });

  r.put("/api/admin/veri/:tablo/:id", req => {
    yoneticiGerekli(req);
    const T = tabloAl(req.params.tablo);
    if (!T.alanlar.length) throw new HttpHata(403, "Bu tablo salt okunur.");
    const b = req.body || {}, d = b.degisiklikler;
    if (!d || typeof d !== "object" || Array.isArray(d) || !Object.keys(d).length) throw new HttpHata(400, "degisiklikler nesnesi gerekli.");
    const yasak = Object.keys(d).filter(a => T.alanlar.indexOf(a) < 0);
    if (yasak.length) throw new HttpHata(403, "Düzenlenemeyen alan: " + yasak.slice(0, 5).join(", "));
    let sonuc = null, once = {}, sonra = {}, kullanici = null;
    islem(db, () => {
      const satir = satirBul(T, req.params.id);
      // İsteğe bağlı iyimser kilit: istemcinin gördüğü değer değiştiyse 409
      if (b.onceki && typeof b.onceki === "object") {
        const fark = Object.keys(b.onceki).filter(a => T.adlar.indexOf(a) >= 0 && !T.gizli.has(a) && String(satir[a] == null ? "" : satir[a]) !== String(b.onceki[a] == null ? "" : b.onceki[a]));
        if (fark.length) throw new HttpHata(409, "Satır sen bakarken değişmiş (" + fark.join(", ") + "). Yenileyip tekrar dene.", null, { guncel: satirGoster(T, satir, false) });
      }
      const yeni = {};
      Object.keys(d).forEach(a => {
        const v = degerDogrula(T, a, d[a], satir, req.kullanici.id);
        if (String(v == null ? "" : v) !== String(satir[a] == null ? "" : satir[a]) || (v === null) !== (satir[a] === null)) yeni[a] = v;
      });
      if (!Object.keys(yeni).length) throw new HttpHata(400, "Değişiklik yok.");
      const ek = ozelKurallar(T, satir, yeni, req);
      const yaz = Object.assign({}, yeni, ek);
      if (T.k.damga && T.adlar.indexOf(T.k.damga) >= 0 && !(T.k.damga in yaz)) yaz[T.k.damga] = simdi();
      const adlar = Object.keys(yaz).filter(a => T.adlar.indexOf(a) >= 0);
      db.prepare("UPDATE " + q_(T.ad) + " SET " + adlar.map(a => q_(a) + " = ?").join(", ") + " WHERE rowid = ?").run(...adlar.map(a => yaz[a]), satir._rid);
      yanEtkiler(T, satir, yeni);
      const kisa = v => (typeof v === "string" && v.length > 1200 ? v.slice(0, 1200) + "…" : v); // denetim ayrıntısı 4000 karakterle sınırlı
      Object.keys(yeni).forEach(a => { once[a] = kisa(satir[a]); sonra[a] = kisa(yeni[a]); });
      kullanici = T.k.kullanici ? satir[T.k.kullanici] : null;
      sonuc = db.prepare("SELECT rowid AS _rid, * FROM " + q_(T.ad) + " WHERE rowid = ?").get(satir._rid);
    });
    const id = T.anahtar ? sonuc[T.anahtar] : sonuc._rid;
    denetim({ eylem: "veri.duzenle", kullanici, yapan: req.kullanici.id, istek: req, varlik: T.ad, varlikId: id, ayrinti: { once, sonra } });
    return { ok: true, satir: satirGoster(T, sonuc, false), degisen: Object.keys(sonra) };
  });
}

module.exports = { veriRotalari, TABLOLAR, GIZLI };
