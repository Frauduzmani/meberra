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
const { bildirimServisi } = require("./bildirim");
const { vapidAnahtarlari, pushGondericisi } = require("./push");
const { soruRotalari } = require("./soru");
const { ligServisi, ligRotalari } = require("./lig");
const { veriRotalari } = require("./veriyonetim");
const { zamanlayici } = require("./zamanlayici");
const { gunlukServisi, hataAyrinti } = require("./gunluk");
const { sistemRotalari, istekIzleyici } = require("./sistem");
const zaman = require("./zaman");

const CEREZ = "meberra_sid";
const kirp = s => String(s == null ? "" : s).trim().replace(/\s+/g, " ");

/** İstemci IP'si. TRUST_PROXY açıkken X-Forwarded-For'un SON adresi alınır: nginx gerçek bağlantı adresini listenin
 *  sonuna ekler; baştaki adresleri istemci kendisi yazabilir (sahte IP ile hız sınırını atlatma). */
function istemciIp(req) {
  if (config.trustProxy) {
    const l = String(req.headers["x-forwarded-for"] || "").split(",").map(s => s.trim()).filter(Boolean);
    if (l.length) return l[l.length - 1];
  }
  return req.socket.remoteAddress || "";
}
const SURUM = require("../package.json").version;

/** Basit, kendi kendine yeten HTML sayfası (e-postadaki tek tıkla iptal/onay bağlantıları için) */
function htmlSayfa(res, kod, baslik, metin) {
  const e = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  res.statusCode = kod;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end('<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">' +
    "<title>" + e(baslik) + " | Meberra</title></head><body style=\"font-family:system-ui,sans-serif;max-width:560px;margin:3rem auto;padding:0 1rem;line-height:1.6;color:#1d1b2e\">" +
    '<p style="font-weight:800;color:#5B3DF5">Meberra</p><h1 style="font-size:1.4rem">' + e(baslik) + "</h1><p>" + e(metin) + '</p><p><a href="/" style="color:#5B3DF5">Ana sayfaya dön</a></p></body></html>');
}

function olustur(secenek) {
  secenek = secenek || {};
  const dbDosya = secenek.dbDosya || path.join(config.dataDir, "meberra.db");
  const db = db_.ac(dbDosya);
  const denetim = denetimKaydi(db);
  // Sistem günlüğü (system_logs + konsol). secenek.gunlukKonsol === false: testlerde konsola yazılmaz
  const gunluk = gunlukServisi(db, { konsol: secenek.gunlukKonsol !== false, saat: secenek.gunlukSaat });
  const izle = istekIzleyici(gunluk, { yavasMs: secenek.yavasMs });
  const eposta = epostaServisi(db, gunluk);
  const hesap = hesapServisi(db, denetim, eposta);
  const veri = veriServisi(db);
  // Web push: testler sahte gönderici verir (secenek.pushGonderici); VAPID anahtarı bellek içi veritabanında diske yazılmaz
  let push = null;
  try {
    const vapid = vapidAnahtarlari({ vapid: secenek.vapid, gecici: dbDosya === ":memory:" });
    push = { publicKey: vapid.publicKey, gonder: secenek.pushGonderici || pushGondericisi(vapid) };
  } catch (e) { gunluk.uyari("push", "Web push devre dışı: " + e.message, hataAyrinti(e)); }
  const bildirim = bildirimServisi(db, eposta, push, denetim, { saat: secenek.saat, gunluk });
  const lig = ligServisi(db, bildirim, denetim);
  const zamanlayiciS = zamanlayici({ db, bildirim, eposta, lig, gunluk });
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
    } catch (e) { gunluk.hata("sunucu", "Yönetici hesabı hazırlanamadı", hataAyrinti(e)); }
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
    // Hesap anahtarı girişteki kimlik normalleştirmesiyle aynı (boşluk kırpma + küçük harf): " Ali@x.com" ayrı sayılmaz
    const kim = kirp(req.body && req.body.kimlik).toLowerCase();
    if (!sinir.giris.dene(req.ip) || !sinir.giris.dene("k:" + kim)) throw new HttpHata(429, "Çok fazla hatalı deneme. 15 dakika sonra tekrar dene ya da şifreni sıfırla.");
    const s = hesap.giris(req.body && req.body.kimlik, req.body && req.body.sifre, req);
    // Başarılı girişte IP sayacı da sıfırlanır (okul/ev NAT'ı arkasındaki diğer öğrenciler kilitlenmesin)
    sinir.giris.sifirla("k:" + kim);
    sinir.giris.sifirla(req.ip);
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
  r.post("/api/premium/talep/iptal", req => {
    oturumGerekli(req);
    const talep = hesap.talepIptal(req.kullanici, req);
    return { ok: true, talep, uyelik: hesap.uyelik(req.kullanici.id) };
  });

  // --- bildirimler -------------------------------------------------------------
  r.get("/api/bildirimler", req => { oturumGerekli(req); return Object.assign({ ok: true }, bildirim.liste(req.kullanici.id, req.sorgu.get("once"))); });
  r.post("/api/bildirimler/okundu", req => { oturumGerekli(req); return { ok: true, okunmamis: bildirim.okundu(req.kullanici.id, req.body) }; });
  r.get("/api/bildirim-ayarlari", req => {
    oturumGerekli(req);
    return { ok: true, ayarlar: bildirim.ayarlar(req.kullanici.id), sessizSaatler: zaman.SESSIZ, pushDestek: !!(push && push.publicKey) };
  });
  r.put("/api/bildirim-ayarlari", req => {
    oturumGerekli(req);
    return { ok: true, ayarlar: bildirim.ayarKaydet(req.kullanici, req.body && (req.body.ayarlar || req.body), req), sessizSaatler: zaman.SESSIZ, pushDestek: !!(push && push.publicKey) };
  });
  r.get("/api/push/anahtar", () => {
    if (!push || !push.publicKey) throw new HttpHata(503, "Tarayıcı bildirimleri şu an kullanılamıyor.");
    return { ok: true, publicKey: push.publicKey };
  });
  r.post("/api/push/abone", req => {
    oturumGerekli(req);
    if (!push) throw new HttpHata(503, "Tarayıcı bildirimleri şu an kullanılamıyor.");
    return { ok: true, abonelik: bildirim.abone(req.kullanici, (req.body || {}).subscription, req), ayarlar: bildirim.ayarlar(req.kullanici.id) };
  });
  r.post("/api/push/iptal", req => {
    oturumGerekli(req);
    const ep = req.body && (req.body.endpoint || (req.body.subscription && req.body.subscription.endpoint));
    return { ok: true, abonelik: bildirim.iptal(req.kullanici, ep, req), ayarlar: bildirim.ayarlar(req.kullanici.id) };
  });
  // E-postadaki tek tıkla iptal / veli onay bağlantıları (oturum gerekmez; belirteç yeterli)
  r.get("/api/public/bildirim-iptal", (req, res) => {
    const tur = ["hatirlatma", "yanit", "hepsi"].indexOf(req.sorgu.get("tur")) >= 0 ? req.sorgu.get("tur") : "hepsi";
    const m = bildirim.tekTikIptal(req.sorgu.get("t"), tur);
    if (!m) return htmlSayfa(res, 404, "Bağlantı geçersiz", "Bu bağlantı geçersiz ya da artık kullanılmıyor. Bildirim ayarlarını hesabındaki Bildirimler bölümünden değiştirebilirsin.");
    htmlSayfa(res, 200, "Tamam", m + " Ayarlarını istediğin zaman hesabındaki Bildirimler bölümünden yeniden açabilirsin.");
  });
  r.get("/api/public/veli", (req, res) => {
    const m = bildirim.veliIslem(req.sorgu.get("t"), req.sorgu.get("islem"));
    if (!m) return htmlSayfa(res, 404, "Bağlantı geçersiz", "Bu bağlantı geçersiz ya da artık kullanılmıyor.");
    htmlSayfa(res, 200, "Tamam", m);
  });

  // --- soru-cevap, lig ---------------------------------------------------------------
  soruRotalari(r, { db, hesap, denetim, bildirim, eposta, oturumGerekli, yoneticiGerekli, soruSiniri: secenek.soruSiniri });
  ligRotalari(r, { lig, oturumGerekli, yoneticiGerekli });

  // --- yönetici ---------------------------------------------------------------
  yonetimRotalari(r, { db, hesap, denetim, yoneticiGerekli, bildirim });
  veriRotalari(r, { db, denetim, yoneticiGerekli, lig });
  sistemRotalari(r, { db, denetim, gunluk, yoneticiGerekli, zamanlayici: zamanlayiciS, dbDosya, logSiniri: secenek.logSiniri,
    testRotalari: secenek.testRotalari != null ? !!secenek.testRotalari : (process.env.NODE_ENV === "test" || process.env.MEBERRA_TEST_ROTALARI === "1") });

  // --- istek işleyici ---------------------------------------------------------
  async function isle(req, res) {
    guvenlikBasliklari(res);
    req.ip = istemciIp(req);
    const u = new URL(req.url, "http://x");
    if (!u.pathname.startsWith("/api/")) {
      if (req.method !== "GET" && req.method !== "HEAD") { res.statusCode = 405; return res.end(); }
      if (statikSun(req, res)) return;
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end('<!doctype html><meta charset="utf-8"><title>Sayfa bulunamadı | Meberra</title><p style="font-family:sans-serif;padding:2rem">Sayfa bulunamadı. <a href="/">Ana sayfaya dön</a></p>');
    }
    const bas = process.hrtime.bigint();
    res.on("finish", () => { try { izle(req, res.statusCode, Number(process.hrtime.bigint() - bas) / 1e6); } catch (e) { /* izleme isteği bozmaz */ } });
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
      // İstemci hata raporu küçük olmalı (16 KB); diğer istekler 6 MB
      req.body = req.method === "GET" ? {} : await govdeOku(req, u.pathname === "/api/log" ? 16 * 1024 : 6 * 1024 * 1024);
      let sonuc;
      for (const f of eslesme.isleyiciler) sonuc = await f(req, res);
      // Kayan oturum: sunucuda süre uzadıysa çerez de yeni Max-Age ile yazılır (rota çerezi kendisi yazmadıysa)
      if (req.kullanici && req.kullanici.uzatildi && !res.headersSent && !String(res.getHeader("Set-Cookie") || "").includes(CEREZ + "="))
        cerezYaz(res, CEREZ, req.cerezler[CEREZ], config.oturumGun * 86400);
      if (!res.writableEnded) json(res, 200, sonuc === undefined ? { ok: true } : sonuc);
    } catch (e) {
      if (e instanceof HttpHata) return json(res, e.kod, Object.assign({ ok: false, error: e.message, errors: e.alanlar || undefined }, e.ek || {}));
      // Beklenmeyen hata: günlüğe yöntem/yol/kullanıcı/IP özeti/tarayıcı ile yazılır (istek gövdesi asla yazılmaz)
      const vt = e && (/^ERR_SQLITE/.test(String(e.code || "")) || /SQLITE|database is locked/i.test(String(e.message || "")));
      gunluk.hata("sunucu", (vt ? "Veritabanı hatası: " : "") + String((e && e.message) || e), Object.assign(gunluk.istekBilgisi(req), hataAyrinti(e), { status: 500, tur: vt ? "veritabani" : undefined }));
      if (res.headersSent) { try { res.end(); } catch (_) { /* */ } return; }
      json(res, 500, { ok: false, error: "Beklenmeyen bir hata oluştu. Lütfen tekrar dene." });
    }
  }

  const server = http.createServer((req, res) => { isle(req, res); });
  server.on("close", () => { try { db.close(); } catch (e) { /* zaten kapalı */ } });
  return { server, db, hesap, veri, denetim, bildirim, lig, zamanlayici: zamanlayiciS, push, gunluk };
}

module.exports = { olustur };
