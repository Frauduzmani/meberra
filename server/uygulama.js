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
const { soruBankasiRotalari, tohumEsitle } = require("./sorubankasi");
const { ligServisi, ligRotalari } = require("./lig");
const { veriRotalari } = require("./veriyonetim");
const { zamanlayici } = require("./zamanlayici");
const { gunlukServisi, hataAyrinti } = require("./gunluk");
const { sistemRotalari, istekIzleyici } = require("./sistem");
const { varlikServisi } = require("./varlik");
const { ayarServisi, bakimServisi, ipEngelServisi } = require("./erisim");
const { operasyonRotalari } = require("./operasyon");
const { veliServisi, veliRotalari, veliYolIzinli } = require("./veli"); // 1.7.0
const zaman = require("./zaman");
const ADRES = require("./adresler"); // 1.8.0 temiz adresler
// 1.6.0
const { huniServisi, huniRotalari } = require("./huni");
const { kampanyaServisi, kampanyaRotalari } = require("./kampanya");

// Bakım modunda yönetici olmayanlara da açık API yolları (giriş yapabilmek ve durumu görebilmek için)
const BAKIM_ACIK_API = new Set(["/api/health", "/api/public/config", "/api/auth/login", "/api/auth/logout", "/api/me"]);
// Bakım sayfası yerine normal sunulan sayfalar (yönetici girişi için; /yonetim yalnızca yöneticiye açılır, yönetici bakımı zaten atlar)
const BAKIM_ACIK_SAYFA = new Set(["/bakim", "/giris"]);
// Engellenmiş kullanıcının eski çerezi bu yollarda 403'e çevrilmez
const ENGEL_ACIK_API = new Set(["/api/health", "/api/public/config", "/api/auth/login", "/api/auth/logout", "/api/auth/register", "/api/log"]);

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
  const varlik = varlikServisi(db, { otomatik: secenek.varlikOtomatik !== false });
  const ayar = ayarServisi(db);
  const bakim = bakimServisi(ayar);
  const ipEngel = ipEngelServisi(db);
  // Soru bankası: tablo boşsa tohumdan (server/tohum/soru-bankasi.json) doldurulur; v1.10.0: tohum sürümü veritabanındakinden
  // yeniyse yönetici düzenlemesi olmayan sorular güncellenir (sorubankasi.tohumEsitle; korunan düzenlemeler system_logs'a "bilgi")
  if (secenek.soruTohum !== false) {
    try { const t = tohumEsitle(db, secenek.soruTohumDosyasi, gunluk); if (t.mod === "ilk") gunluk.bilgi("sunucu", "Soru bankası tohumdan yüklendi: " + t.eklenen + " soru (tohum sürümü " + t.surum + ")"); }
    catch (e) { gunluk.hata("sunucu", "Soru bankası tohumu yüklenemedi", hataAyrinti(e)); }
  }
  const zamanlayiciS = zamanlayici({ db, bildirim, eposta, lig, gunluk, denetim, ipEngel });
  const r = yonlendirici();
  const sinir = {
    giris: hizSinirlayici(secenek.girisSiniri || 10, 15 * 60e3),
    kayit: hizSinirlayici(secenek.kayitSiniri || 10, 60 * 60e3),
    sifre: hizSinirlayici(5, 60 * 60e3)
  };
  const sinirlar = Object.assign({}, sinir); // Sistem sekmesi: hız sınırlayıcı boyutları

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
  r.get("/api/health", () => ({ ok: true, surum: SURUM, zaman: db_.simdi(), bakim: bakim.acikMi() }));
  r.get("/api/public/config", () => {
    const u = config.urun, b = bakim.durum();
    return { ok: true, marka: u.marka, para: u.para, destekEposta: u.destekEposta, ucretsiz: u.ucretsiz, banka: u.banka,
      bakim: { acik: !!b.acik, mesaj: b.acik ? b.mesaj || null : null, bitis: b.acik ? b.bitis || null : null },
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
    varlik.unut(req.kullanici.id); // bekleyen son görülme/IP yazımı silinmiş hesaba geri yazılmasın
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
  const soruS = soruRotalari(r, { db, hesap, denetim, bildirim, eposta, oturumGerekli, yoneticiGerekli, varlik, soruSiniri: secenek.soruSiniri });
  sinirlar.soru = soruS.sinir;
  const sbS = soruBankasiRotalari(r, { db, hesap, veri, denetim, oturumGerekli, yoneticiGerekli, cevapSiniri: secenek.cevapSiniri, denemeSiniri: secenek.denemeSiniri, seviyeSiniri: secenek.seviyeSiniri, demoSiniri: secenek.demoSiniri });
  Object.keys(sbS.sinir).forEach(k => { sinirlar["soruBankasi." + k] = sbS.sinir[k]; });
  ligRotalari(r, { lig, oturumGerekli, yoneticiGerekli });

  // 1.7.0 — veli paneli (server/veli.js): davet → veli hesabı → bağlantı; veli rolü öğrenci uçlarını kullanamaz
  const veliS = veliServisi(db, { hesap, eposta, denetim, bildirim, calismaDurumu: zamanlayiciS.calismaDurumu, saat: secenek.saat });
  zamanlayiciS.raporEkle(veliS.haftalikRaporlar);
  veliRotalari(r, { db, veli: veliS, oturumGerekli, yoneticiGerekli, htmlSayfa, oturumYanit, kayitSiniri: secenek.kayitSiniri });
  // 1.7.0 sonu

  // --- yönetici ---------------------------------------------------------------
  yonetimRotalari(r, { db, hesap, denetim, yoneticiGerekli, bildirim, varlik });
  veriRotalari(r, { db, denetim, yoneticiGerekli, lig });
  sistemRotalari(r, { db, denetim, gunluk, yoneticiGerekli, zamanlayici: zamanlayiciS, dbDosya, logSiniri: secenek.logSiniri, sinirlar,
    testRotalari: secenek.testRotalari != null ? !!secenek.testRotalari : (process.env.NODE_ENV === "test" || process.env.MEBERRA_TEST_ROTALARI === "1") });
  operasyonRotalari(r, { db, denetim, yoneticiGerekli, zamanlayici: zamanlayiciS, eposta, varlik, bakim, ipEngel, sinirlar, izle, dbDosya });

  // ==== 1.6.0 büyüme: ölçüm hunisi, 7 günlük Premium denemesi, indirim kodu, davet (server/huni.js, server/kampanya.js) ====
  const huni = huniServisi(db, { olaySiniri: secenek.olaySiniri });
  const kampanya = kampanyaServisi({ db, hesap, bildirim, huni, denetim, gunluk, kuponSiniri: secenek.kuponSiniri });
  huniRotalari(r, { huni, yoneticiGerekli });
  kampanyaRotalari(r, { db, kampanya, huni, hesap, denetim, oturumGerekli, yoneticiGerekli });
  zamanlayiciS.isEkle("denemeBildirim", "Premium denemesi bildirimleri", ms => kampanya.denemeBildirimleri(ms));
  zamanlayiciS.isEkle("davetOdul", "Davet ödülleri", () => kampanya.davetTarama(), { sessizde: true });
  zamanlayiciS.isEkle("olaySaklama", "Ölçüm saklama (400 gün)", ms => huni.saklama(ms), { sessizde: true });
  sinirlar.olay = huni.sinir; sinirlar.kupon = kampanya.kuponSinir;
  // ==== /1.6.0 ====

  // 1.11.0 FRQ — serbest yanıt pratiği (server/frq.js; tohum server/tohum/frq.json; rubrik yalnızca teslimden sonra)
  {
    const frq = require("./frq");
    if (secenek.frqTohum !== false) {
      try { const t = frq.tohumEsitle(db, secenek.frqTohumDosyasi, gunluk); if (t.mod === "ilk") gunluk.bilgi("sunucu", "FRQ bankası tohumdan yüklendi: " + t.eklenen + " FRQ"); }
      catch (e) { gunluk.hata("sunucu", "FRQ tohumu yüklenemedi", hataAyrinti(e)); }
    }
    const frqS = frq.frqRotalari(r, { db, hesap, denetim, oturumGerekli, yoneticiGerekli, teslimSiniri: secenek.frqTeslimSiniri });
    sinirlar["frq.teslim"] = frqS.sinir.teslim;
  }
  // 1.11.0 FRQ sonu

  // 1.12.0 Tam deneme sınavı (server/tamsinav.js; plan server/tohum/sinav-formatlari.json; süre sunucuda)
  {
    const tsS = require("./tamsinav").tamSinavRotalari(r, { db, hesap, veri, denetim, oturumGerekli, hiz: secenek.tamSinavHiz, saat: secenek.tamSinavSaat,
      olusturSiniri: secenek.tamSinavSiniri, cevapSiniri: secenek.tamSinavCevapSiniri });
    sinirlar["tamSinav.olustur"] = tsS.sinir.olustur; sinirlar["tamSinav.cevap"] = tsS.sinir.cevap;
  }

  /** Bakım sayfası (503). Yönetici oturumu olan bu sayfayı görmez. */
  function bakimSayfasi(req, res) {
    const k = hesap.oturumKullanici(cerezleriOku(req)[CEREZ]);
    if (k && k.rol === "yonetici") return false;
    if (statikSun(req, res, { yol: "/bakim.html", kod: 503, basliklar: { "Retry-After": String(bakim.tekrarSn()) } })) return true;
    res.statusCode = 503; res.setHeader("Retry-After", String(bakim.tekrarSn())); res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Meberra şu an bakımda. Lütfen biraz sonra tekrar dene.");
    return true;
  }

  // --- 1.8.0 temiz adresler (tablo: assets/js/adresler.js + server/adresler.js) ---------------------------------
  /** Bulunamadı: sayfa istekleri için maskotlu 404.html (durum 404), uzantılı varlık istekleri için kısa metin.
   *  Yönetim adresi yetkisiz istekte de birebir aynı yanıtı alır (yolun varlığı belli olmaz). */
  function bulunamadi(req, res, p) {
    if (!/\.[a-z0-9]+$/i.test(p) || /\.html?$/i.test(p)) {
      if (statikSun(req, res, { yol: "/404.html", kod: 404 })) return;
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end('<!doctype html><meta charset="utf-8"><title>Sayfa bulunamadı | Meberra</title><p style="font-family:sans-serif;padding:2rem">Sayfa bulunamadı. <a href="/">Ana sayfaya dön</a></p>');
    }
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(req.method === "HEAD" ? undefined : "Bulunamadı.");
  }
  function yonlendir(res, kod, hedef, ozelYanit) {
    res.statusCode = kod;
    res.setHeader("Location", hedef);
    res.setHeader("Cache-Control", kod === 301 && !ozelYanit ? "public, max-age=86400" : "private, no-store");
    res.end();
  }
  const sayfaKullanici = req => hesap.oturumKullanici(cerezleriOku(req)[CEREZ]);

  function sayfaIsle(req, res, u) {
    const p = u.pathname;
    // Sondaki eğik çizgi: /bugun/ → /bugun
    if (p.length > 1 && /\/+$/.test(p)) return yonlendir(res, 301, p.replace(/\/+$/, "") + u.search);
    // Eski adresler: /x.html → temiz yol (sorgu korunur; # parçasını tarayıcı kendisi taşır). Ders/rehber altında kalmış
    // göreli bağlantılar (/ders/x.html, eski önbellekteki JS) da aynı yere gider.
    const eski = /^\/(?:(?:ders|rehber)\/)?([A-Za-z0-9_-]+)\.html?$/.exec(p);
    if (eski) {
      const dosya = eski[1].toLowerCase() + ".html";
      if (dosya === ADRES.YONETIM.dosya) {
        const k = sayfaKullanici(req);
        // Yönlendirme yalnızca yöneticiye: paylaşılan önbellek saklamasın (yol başkasına görünmesin)
        if (k && k.rol === "yonetici") return yonlendir(res, 301, ADRES.YONETIM.yol + u.search, true);
        return bulunamadi(req, res, p);
      }
      const hedef = ADRES.dosyadan(dosya);
      return hedef ? yonlendir(res, 301, hedef + u.search) : bulunamadi(req, res, p);
    }
    // Ders/rehber sayfasına göre çözülmüş göreli varlık yolu (eski önbellekteki sayfa): /ders/assets/x → /assets/x
    const derin = /^\/(?:ders|rehber)\/((?:assets|data)\/.+)$/.exec(p);
    if (derin) return yonlendir(res, 301, "/" + derin[1] + u.search);
    // Kök: oturumu olan kullanıcı kendi ana ekranına, ziyaretçi tanıtım sayfasına
    if (p === "/") {
      const k = sayfaKullanici(req);
      if (k) return yonlendir(res, 302, k.rol === "veli" ? "/veli" : "/bugun");
    }
    const g = ADRES.yoldan(p);
    if (g) {
      if (g.yonetici) {
        const k = sayfaKullanici(req);
        if (!k || k.rol !== "yonetici") return bulunamadi(req, res, p);
      }
      // Bakım modu: sayfalar yönetici olmayanlara bakim.html (503 + Retry-After); giriş ve bakım sayfası açık
      if (bakim.acikMi() && !BAKIM_ACIK_SAYFA.has(p) && bakimSayfasi(req, res)) return;
      const kanonik = g.herkese ? config.baseUrl + g.yol : null;
      if (statikSun(req, res, { yol: "/" + g.dosya, onbellek: true, kanonik, cacheControl: g.yonetici ? "private, no-cache" : null })) return;
      return bulunamadi(req, res, p);
    }
    // Varlıklar (assets/, data/, sw.js, robots.txt, manifest...) bakımda da açık
    if (statikSun(req, res)) return;
    bulunamadi(req, res, p);
  }

  // --- istek işleyici ---------------------------------------------------------
  async function isle(req, res) {
    guvenlikBasliklari(res);
    req.ip = istemciIp(req);
    const u = new URL(req.url, "http://x");
    if (!u.pathname.startsWith("/api/")) {
      if (req.method !== "GET" && req.method !== "HEAD") { res.statusCode = 405; return res.end(); }
      return sayfaIsle(req, res, u);
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
      const yol = u.pathname;
      // Yönetici oturumu IP engelini, bakım modunu atlar
      if (!req.kullanici || req.kullanici.rol !== "yonetici") {
        if (yol !== "/api/health") ipEngel.denetle(req.ip);
        if (bakim.acikMi() && !BAKIM_ACIK_API.has(yol) && !yol.startsWith("/api/admin/")) {
          const b = bakim.durum();
          res.setHeader("Retry-After", String(bakim.tekrarSn()));
          throw new HttpHata(503, b.mesaj || "Meberra şu an bakımda. Lütfen biraz sonra tekrar dene.", null, { bakim: true, mesaj: b.mesaj || null, bitis: b.bitis || null });
        }
        // Engellenmiş kullanıcının (oturumları kapatılmış) çerezi: 401 yerine açıklayıcı 403
        if (!req.kullanici && req.cerezler[CEREZ] && !ENGEL_ACIK_API.has(yol) && !yol.startsWith("/api/public/")) {
          const e = hesap.oturumEngeli(req.cerezler[CEREZ]);
          if (e) throw new HttpHata(403, hesap.engelMesaji(e.bitis), null, { engelli: true, engelBitis: e.bitis });
        }
      }
      if (req.kullanici && req.kullanici.rol === "veli" && !veliYolIzinli(yol)) throw new HttpHata(403, "Veli hesabı bu işlemi yapamaz."); // 1.7.0
      if (req.kullanici) varlik.dokun(req.kullanici, req.ip);
      req.params = eslesme.params;
      req.sorgu = u.searchParams;
      // İstemci hata raporu küçük olmalı (16 KB); diğer istekler 6 MB
      req.body = req.method === "GET" ? {} : await govdeOku(req, (u.pathname === "/api/log" || u.pathname === "/api/olay") ? 16 * 1024 : 6 * 1024 * 1024);
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
  server.on("close", () => { varlik.durdur(); try { db.close(); } catch (e) { /* zaten kapalı */ } });
  return { server, db, hesap, veri, denetim, bildirim, lig, zamanlayici: zamanlayiciS, push, gunluk, varlik, bakim, ipEngel, izle, veli: veliS };
}

module.exports = { olustur };
