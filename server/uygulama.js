"use strict";
// Uygulama fabrikası: veritabanı + hizmetler + rotalar → http.Server. Testler bellek içi veritabanıyla kullanır.
const http = require("http");
const path = require("path");
const config = require("./config");
const db_ = require("./db");
const { HttpHata, cerezleriOku, cerezYaz, guvenlikBasliklari, json, govdeOku, yonlendirici, statikSun } = require("./http");
const { hizSinirlayici } = require("./guvenlik");
const { denetimKaydi } = require("./denetim");
const { epostaServisi } = require("./eposta");
const { hesapServisi } = require("./hesap");
const { veriServisi } = require("./veri");
const { yonetimRotalari } = require("./yonetim");

const CEREZ = "meberra_sid";
const SURUM = require("../package.json").version;

function olustur(secenek) {
  secenek = secenek || {};
  const db = db_.ac(secenek.dbDosya || path.join(config.dataDir, "meberra.db"));
  const denetim = denetimKaydi(db);
  const eposta = epostaServisi(db);
  const hesap = hesapServisi(db, denetim, eposta);
  const veri = veriServisi(db);
  const r = yonlendirici();
  const sinir = {
    giris: hizSinirlayici(secenek.girisSiniri || 10, 15 * 60e3),
    kayit: hizSinirlayici(secenek.kayitSiniri || 10, 60 * 60e3),
    sifre: hizSinirlayici(5, 60 * 60e3)
  };

  // İlk çalıştırma: ADMIN_EPOSTA + ADMIN_SIFRE ile yönetici. Hesap zaten varsa yalnızca yetki verilir, şifre değişmez.
  if (config.yonetici.eposta && config.yonetici.sifre && !secenek.yoneticiAtla) {
    try {
      const var_ = db.prepare("SELECT id FROM users WHERE eposta = ?").get(config.yonetici.eposta.trim().toLowerCase());
      hesap.yoneticiHazirla(config.yonetici.eposta, var_ ? null : config.yonetici.sifre);
    } catch (e) { console.error("[yönetici] hazırlanamadı:", e.message); }
  }

  // --- ara katmanlar ---------------------------------------------------------
  const oturumGerekli = (req) => { if (!req.kullanici) throw new HttpHata(401, "Oturum açman gerekiyor."); };
  const yoneticiGerekli = (req) => { oturumGerekli(req); if (req.kullanici.rol !== "yonetici") throw new HttpHata(403, "Bu işlem için yönetici yetkisi gerekiyor."); };
  const oturumYanit = (res, k, ot) => {
    cerezYaz(res, CEREZ, ot.belirtec, ot.sureSn);
    return { ok: true, user: hesap.genel(k), profile: hesap.profilAl(k.id), uyelik: hesap.uyelik(k.id), state: veri.hepsi(k.id) };
  };

  // --- genel -----------------------------------------------------------------
  r.get("/api/health", () => ({ ok: true, surum: SURUM, zaman: db_.simdi() }));
  r.get("/api/public/config", () => {
    const u = config.urun;
    return { ok: true, marka: u.marka, para: u.para, destekEposta: u.destekEposta, ucretsiz: u.ucretsiz, banka: u.banka,
      planlar: u.planlar.map(p => ({ id: p.id, ad: p.ad, fiyat: p.fiyat, donem: p.donem, aciklama: p.aciklama, oneCikan: !!p.oneCikan })) };
  });

  // --- hesap -----------------------------------------------------------------
  r.post("/api/auth/register", (req, res) => {
    if (!sinir.kayit.dene(req.ip)) throw new HttpHata(429, "Çok fazla kayıt denemesi. Biraz sonra tekrar dene.");
    const s = hesap.kayit(req.body, req);
    return oturumYanit(res, s.kullanici, s.oturum);
  });
  r.post("/api/auth/login", (req, res) => {
    const kim = String((req.body && req.body.kimlik) || "").toLowerCase();
    if (!sinir.giris.dene(req.ip) || !sinir.giris.dene("k:" + kim)) throw new HttpHata(429, "Çok fazla hatalı deneme. 15 dakika sonra tekrar dene ya da şifreni sıfırla.");
    const s = hesap.giris(req.body && req.body.kimlik, req.body && req.body.sifre, req);
    sinir.giris.sifirla("k:" + kim);
    return oturumYanit(res, s.kullanici, s.oturum);
  });
  r.post("/api/auth/logout", (req, res) => {
    hesap.cikis(req.cerezler[CEREZ], req.kullanici, req);
    cerezYaz(res, CEREZ, "", 0);
    return { ok: true };
  });
  r.get("/api/me", req => {
    oturumGerekli(req);
    return { ok: true, user: hesap.genel(req.kullanici), profile: hesap.profilAl(req.kullanici.id), uyelik: hesap.uyelik(req.kullanici.id) };
  });
  r.put("/api/profile", req => {
    oturumGerekli(req);
    return { ok: true, profile: hesap.profilKaydet(req.kullanici, req.body && req.body.profile, req) };
  });
  r.post("/api/auth/password", req => {
    oturumGerekli(req);
    hesap.sifreDegistir(req.kullanici, req.body || {}, req);
    return { ok: true };
  });
  r.post("/api/auth/forgot", req => {
    if (sinir.sifre.dene(req.ip)) hesap.sifreUnuttum(req.body && req.body.eposta, req);
    return { ok: true };
  });
  r.post("/api/auth/reset", req => {
    const b = req.body || {};
    hesap.sifreSifirla(b.token, b.yeni, b.yeni2, req);
    return { ok: true };
  });
  r.get("/api/account/export", (req, res) => {
    oturumGerekli(req);
    denetim({ eylem: "hesap.veri-indir", kullanici: req.kullanici.id, istek: req });
    res.setHeader("Content-Disposition", 'attachment; filename="meberra-verilerim.json"');
    return Object.assign({ ok: true }, hesap.disaAktar(req.kullanici));
  });
  r.post("/api/account/delete", (req, res) => {
    oturumGerekli(req);
    hesap.hesapSil(req.kullanici, req.body && req.body.sifre, req);
    cerezYaz(res, CEREZ, "", 0);
    return { ok: true };
  });

  // --- öğrenci verisi (senkron) ---------------------------------------------
  r.get("/api/state", req => { oturumGerekli(req); return { ok: true, keys: veri.hepsi(req.kullanici.id) }; });
  r.put("/api/state", req => {
    oturumGerekli(req);
    const d = req.body && req.body.degisiklikler;
    if (!d || typeof d !== "object" || Array.isArray(d)) throw new HttpHata(400, "degisiklikler nesnesi gerekli.");
    const sonuc = veri.uygula(req.kullanici.id, d);
    const anahtarlar = Object.keys(d);
    denetim({ eylem: "veri.senkron", kullanici: req.kullanici.id, istek: req, ayrinti: { anahtarlar: anahtarlar.slice(0, 20), silinen: anahtarlar.filter(k => d[k] === null), reddedilen: sonuc.reddedilen } });
    return { ok: true, birlesen: sonuc.birlesen, reddedilen: sonuc.reddedilen };
  });

  // --- Premium ---------------------------------------------------------------
  r.get("/api/premium", req => { oturumGerekli(req); return { ok: true, uyelik: hesap.uyelik(req.kullanici.id), talepler: hesap.talepler(req.kullanici) }; });
  r.post("/api/premium/talep", req => {
    oturumGerekli(req);
    const talep = hesap.talepOlustur(req.kullanici, req.body || {}, req);
    return { ok: true, talep, uyelik: hesap.uyelik(req.kullanici.id) };
  });

  // --- yönetici ---------------------------------------------------------------
  yonetimRotalari(r, { db, hesap, denetim, yoneticiGerekli });

  // --- istek işleyici ---------------------------------------------------------
  async function isle(req, res) {
    guvenlikBasliklari(res);
    req.ip = (config.trustProxy && String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()) || req.socket.remoteAddress || "";
    const u = new URL(req.url, "http://x");
    if (!u.pathname.startsWith("/api/")) {
      if (req.method !== "GET" && req.method !== "HEAD") { res.statusCode = 405; return res.end(); }
      if (statikSun(req, res)) return;
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end('<!doctype html><meta charset="utf-8"><title>Sayfa bulunamadı | Meberra</title><p style="font-family:sans-serif;padding:2rem">Sayfa bulunamadı. <a href="/">Ana sayfaya dön</a></p>');
    }
    try {
      const eslesme = r.bul(req.method, u.pathname);
      if (!eslesme) throw new HttpHata(404, "Uç nokta bulunamadı.");
      if (eslesme === "yontem") throw new HttpHata(405, "Bu yöntem desteklenmiyor.");
      // CSRF: değiştiren isteklerde özel başlık (siteler arası istek bunu ön kontrolsüz gönderemez)
      if (req.method !== "GET" && req.headers["x-meberra"] !== "1") throw new HttpHata(403, "Geçersiz istek kaynağı.");
      req.cerezler = cerezleriOku(req);
      req.kullanici = hesap.oturumKullanici(req.cerezler[CEREZ]);
      req.params = eslesme.params;
      req.sorgu = u.searchParams;
      req.body = req.method === "GET" ? {} : await govdeOku(req, 6 * 1024 * 1024);
      let sonuc;
      for (const f of eslesme.isleyiciler) sonuc = await f(req, res);
      if (!res.writableEnded) json(res, 200, sonuc === undefined ? { ok: true } : sonuc);
    } catch (e) {
      if (e instanceof HttpHata) return json(res, e.kod, { ok: false, error: e.message, errors: e.alanlar || undefined });
      console.error("[hata]", req.method, u.pathname, e);
      json(res, 500, { ok: false, error: "Beklenmeyen bir hata oluştu. Lütfen tekrar dene." });
    }
  }

  const server = http.createServer((req, res) => { isle(req, res); });
  server.on("close", () => { try { db.close(); } catch (e) { /* zaten kapalı */ } });
  return { server, db, hesap, veri, denetim };
}

module.exports = { olustur };
