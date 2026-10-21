"use strict";
// Yönetici operasyon uç noktaları: sistem metrikleri (uptime, bellek, olay döngüsü, disk, önbellek, kuyruklar,
// istek hızı), önbellek temizleme, elle yedek, e-posta kuyruğu, zamanlayıcı işleri, bakım modu ve IP engel listesi.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { monitorEventLoopDelay } = require("perf_hooks");
const config = require("./config");
const { simdi } = require("./db");
const { HttpHata, onbellekDurum, onbellekTemizle } = require("./http");
const { sonYedek } = require("./sistem");
const { yedekAl } = require("./yedek");
const { kapsamNormal, ipEslesir } = require("./erisim");
const { esikler } = require("./varlik");

const SURUM = require("../package.json").version;

// Olay döngüsü gecikmesi: süreç başına tek ölçer; 5 dk'da bir sıfırlanır (değerler son pencereyi gösterir)
let olcer = null, olcerSifir = 0;
function olayDongusu() {
  if (!olcer) { olcer = monitorEventLoopDelay({ resolution: 20 }); olcer.enable(); olcerSifir = Date.now(); return null; }
  const ms = n => Math.round((n / 1e6) * 10) / 10;
  const o = { ortalamaMs: ms(olcer.mean || 0), p99Ms: ms(olcer.percentile(99) || 0), enCokMs: ms(olcer.max || 0), pencereSn: Math.round((Date.now() - olcerSifir) / 1000) };
  if (Date.now() - olcerSifir > 5 * 60e3) { olcer.reset(); olcerSifir = Date.now(); }
  return o;
}
olayDongusu();

function dosyaBoyut(p) { try { return fs.statSync(p).size; } catch (e) { return null; } }
function diskBos(klasor) {
  try {
    if (typeof fs.statfsSync !== "function") return null;
    const s = fs.statfsSync(klasor);
    return { bos: Number(s.bavail) * Number(s.bsize), toplam: Number(s.blocks) * Number(s.bsize) };
  } catch (e) { return null; }
}
const metinTemiz = s => String(s == null ? "" : s).replace(/\r\n?/g, "\n").replace(/[^\S\n]+/g, " ").trim();
const tarihMi = v => typeof v === "string" && !isNaN(Date.parse(v));

function operasyonRotalari(r, c) {
  const { db, denetim, yoneticiGerekli, zamanlayici, eposta, varlik, bakim, ipEngel, sinirlar, izle, dbDosya } = c;
  const tek = (sql, ...a) => db.prepare(sql).get(...a);
  const saatOnce = s => new Date(Date.now() - s * 3600e3).toISOString();
  const yedekKlasor = () => path.join(config.dataDir, "yedekler");

  function sistemDurumu() {
    varlik.bosalt();
    const m = process.memoryUsage(), z = simdi(), e = esikler();
    const bellekDb = !dbDosya || dbDosya === ":memory:";
    let dbBoyut = null;
    try { dbBoyut = Number(Object.values(tek("PRAGMA page_count"))[0]) * Number(Object.values(tek("PRAGMA page_size"))[0]); } catch (x) { /* yok say */ }
    const zd = zamanlayici && zamanlayici.durum ? zamanlayici.durum() : null;
    let yedekSayisi = 0;
    try { yedekSayisi = fs.readdirSync(yedekKlasor()).filter(f => /\.db$/i.test(f)).length; } catch (x) { /* klasör yok */ }
    const hiz = {};
    Object.keys(sinirlar || {}).forEach(k => { try { hiz[k] = sinirlar[k].boyut(); } catch (x) { hiz[k] = null; } });
    const yuk = os.loadavg();
    return {
      surum: SURUM, node: process.version, platform: process.platform + " " + os.arch(), pid: process.pid,
      baslangic: new Date(Date.now() - Math.round(process.uptime() * 1000)).toISOString(),
      calismaSn: Math.round(process.uptime()),
      bellek: { rss: m.rss, heapKullanilan: m.heapUsed, heapToplam: m.heapTotal, harici: m.external, sistemToplam: os.totalmem(), sistemBos: os.freemem() },
      olayDongusu: olayDongusu(),
      cpu: { cekirdek: (os.cpus() || []).length, yuk: process.platform === "win32" ? null : yuk.map(x => Math.round(x * 100) / 100) },
      veritabani: { boyut: dbBoyut, walBoyut: bellekDb ? null : dosyaBoyut(dbDosya + "-wal"), dosya: bellekDb ? ":memory:" : path.basename(dbDosya) },
      disk: diskBos(config.dataDir),
      yedek: { son: sonYedek(yedekKlasor()), adet: yedekSayisi, sakla: 14 },
      onbellek: onbellekDurum(),
      hizSinirlari: hiz,
      kuyruk: {
        eposta: {
          smtp: !!config.smtp.host,
          bekleyen: tek("SELECT COUNT(*) AS n FROM email_outbox WHERE gonderim IS NULL AND hata IS NULL").n,
          hata: tek("SELECT COUNT(*) AS n FROM email_outbox WHERE gonderim IS NULL AND hata IS NOT NULL").n,
          gonderilen24s: tek("SELECT COUNT(*) AS n FROM email_outbox WHERE gonderim >= ?", saatOnce(24)).n
        },
        push: { abonelik: tek("SELECT COUNT(*) AS n FROM push_subscriptions").n, kullanici: tek("SELECT COUNT(DISTINCT user_id) AS n FROM push_subscriptions").n }
      },
      zamanlayici: zd ? { acik: zd.acik, aralikDk: zd.aralikMs ? Math.round(zd.aralikMs / 60e3) : null, sonCalisma: zd.sonCalisma, sonSureMs: zd.sonSure, sonHata: zd.sonHata, isler: zd.isler || [] } : null,
      oturum: {
        aktif: tek("SELECT COUNT(*) AS n FROM sessions WHERE iptal IS NULL AND bitis > ?", z).n,
        cevrimici: tek("SELECT COUNT(*) AS n FROM users WHERE durum != 'silindi' AND son_gorulme >= ?", e.cevrimici).n,
        yakin: tek("SELECT COUNT(*) AS n FROM users WHERE durum != 'silindi' AND son_gorulme >= ?", e.yakin).n
      },
      istek: izle && izle.istatistik ? izle.istatistik() : null,
      bakim: bakim.durum(),
      ipEngeli: ipEngel.liste().filter(x => !x.bitis || x.bitis > z).length
    };
  }

  r.get("/api/admin/sistem", req => { yoneticiGerekli(req); return Object.assign({ ok: true }, sistemDurumu()); });

  r.post("/api/admin/sistem/onbellek-temizle", req => {
    yoneticiGerekli(req);
    const once = onbellekDurum();
    const n = onbellekTemizle();
    denetim({ eylem: "sistem.onbellek-temizle", yapan: req.kullanici.id, istek: req, ayrinti: { girdi: n, bayt: once.bayt } });
    return { ok: true, temizlenen: n, onbellek: onbellekDurum() };
  });

  let yedekSuruyor = false;
  r.post("/api/admin/sistem/yedek", async req => {
    yoneticiGerekli(req);
    if (!dbDosya || dbDosya === ":memory:") throw new HttpHata(409, "Bellek içi veritabanı yedeklenemez.");
    if (yedekSuruyor) throw new HttpHata(409, "Bir yedekleme zaten sürüyor.");
    yedekSuruyor = true;
    try {
      const s = await yedekAl(db, yedekKlasor(), { saniyeli: true });
      denetim({ eylem: "sistem.yedek", yapan: req.kullanici.id, istek: req, ayrinti: { dosya: s.dosya, boyut: s.boyut, sureMs: s.sureMs, silinen: s.silinen } });
      return { ok: true, yedek: { dosya: s.dosya, boyut: s.boyut, sureMs: s.sureMs, silinen: s.silinen }, son: sonYedek(yedekKlasor()) };
    } finally { yedekSuruyor = false; }
  });

  // --- e-posta kuyruğu ---------------------------------------------------------------
  r.get("/api/admin/sistem/eposta", req => {
    yoneticiGerekli(req);
    const d = String(req.sorgu.get("durum") || "bekleyen");
    const kosul = { bekleyen: "gonderim IS NULL AND hata IS NULL", hata: "gonderim IS NULL AND hata IS NOT NULL", gonderilen: "gonderim IS NOT NULL" }[d];
    if (!kosul) throw new HttpHata(400, "Durum bekleyen, hata ya da gonderilen olmalı.");
    const l = db.prepare("SELECT id, alici, konu, olusturma, gonderim, hata FROM email_outbox WHERE " + kosul + " ORDER BY id DESC LIMIT 100").all();
    return { ok: true, durum: d, smtp: !!config.smtp.host, epostalar: l };
  });
  r.post("/api/admin/sistem/eposta/isle", async req => {
    yoneticiGerekli(req);
    const s = await eposta.kuyruguIsle(50);
    if (!s.smtp) throw new HttpHata(409, "SMTP ayarlı değil (SMTP_HOST). E-postalar yalnızca kuyrukta tutuluyor.");
    denetim({ eylem: "sistem.eposta-kuyrugu", yapan: req.kullanici.id, istek: req, ayrinti: s });
    return Object.assign({ ok: true }, s);
  });
  r.post("/api/admin/sistem/eposta/:id/tekrar", async req => {
    yoneticiGerekli(req);
    const s = await eposta.tekrarDene(req.params.id);
    if (!s) throw new HttpHata(404, "Gönderilmemiş böyle bir e-posta yok.");
    if (!s.smtp) throw new HttpHata(409, "SMTP ayarlı değil (SMTP_HOST).");
    denetim({ eylem: "sistem.eposta-tekrar", yapan: req.kullanici.id, istek: req, varlik: "email_outbox", varlikId: req.params.id, ayrinti: { gonderildi: s.gonderildi } });
    return { ok: true, gonderildi: s.gonderildi };
  });

  // --- zamanlayıcı -------------------------------------------------------------------------
  r.post("/api/admin/sistem/zamanlayici/:is", async req => {
    yoneticiGerekli(req);
    const s = await zamanlayici.calistir(req.params.is);
    if (!s) throw new HttpHata(404, "Böyle bir zamanlayıcı işi yok.");
    denetim({ eylem: "sistem.zamanlayici-calistir", yapan: req.kullanici.id, istek: req, ayrinti: { is: req.params.is, calisti: s.calisti, neden: s.neden, sonuc: s.sonuc } });
    return Object.assign({ ok: true }, s);
  });

  // --- bakım modu --------------------------------------------------------------------------
  r.get("/api/admin/bakim", req => { yoneticiGerekli(req); return { ok: true, bakim: bakim.durum() }; });
  r.post("/api/admin/bakim", req => {
    yoneticiGerekli(req);
    const b = req.body || {}, e = {};
    if (typeof b.acik !== "boolean") e.acik = "acik true ya da false olmalı.";
    const mesaj = b.mesaj == null ? "" : metinTemiz(b.mesaj);
    if (mesaj.length > 500) e.mesaj = "En fazla 500 karakter.";
    let bitis = null;
    if (b.bitis != null && b.bitis !== "") {
      if (!tarihMi(b.bitis)) e.bitis = "Geçerli bir tarih/saat seç.";
      else bitis = new Date(b.bitis).toISOString();
    }
    if (Object.keys(e).length) throw new HttpHata(400, "Lütfen işaretli alanları düzelt.", e);
    const once = bakim.durum();
    const d = bakim.ayarla({ acik: b.acik, mesaj: mesaj || null, bitis }, req.kullanici.id);
    denetim({ eylem: b.acik ? (once.acik ? "bakim.guncelle" : "bakim.ac") : "bakim.kapat", yapan: req.kullanici.id, istek: req, ayrinti: { mesaj: d.mesaj, bitis: d.bitis } });
    return { ok: true, bakim: d };
  });

  // --- IP engel listesi ----------------------------------------------------------------------
  const engelGenel = x => {
    const u = x.olusturan ? db.prepare("SELECT ad, soyad FROM users WHERE id = ?").get(x.olusturan) : null;
    return { id: x.id, kapsam: x.kapsam, neden: x.neden, bitis: x.bitis, olusturma: x.olusturma, olusturan: u ? { ad: u.ad, soyad: u.soyad } : null, etkin: !x.bitis || x.bitis > simdi() };
  };
  r.get("/api/admin/ip-engelleri", req => { yoneticiGerekli(req); return { ok: true, sizinIp: req.ip, engeller: ipEngel.liste().map(engelGenel) }; });
  r.post("/api/admin/ip-engelleri", req => {
    yoneticiGerekli(req);
    const b = req.body || {}, e = {};
    const kapsam = kapsamNormal(b.kapsam);
    if (!kapsam) e.kapsam = "Geçerli bir IP adresi (ör. 203.0.113.7) ya da IPv4 /24 aralığı (ör. 203.0.113.0/24) yaz.";
    else if (ipEslesir(req.ip, kapsam)) e.kapsam = "Kendi IP adresini engelleyemezsin.";
    const neden = metinTemiz(b.neden).slice(0, 300);
    if (!neden) e.neden = "Neden yaz.";
    const GUN = { suresiz: null, "1g": 1, "7g": 7, "30g": 30 };
    const sure = b.sure || "suresiz";
    if (!Object.prototype.hasOwnProperty.call(GUN, sure)) e.sure = "Süre suresiz, 1g, 7g ya da 30g olmalı.";
    if (Object.keys(e).length) throw new HttpHata(400, "Lütfen işaretli alanları düzelt.", e);
    if (db.prepare("SELECT 1 FROM ip_engelleri WHERE kapsam = ?").get(kapsam)) throw new HttpHata(409, "Bu adres zaten engel listesinde.");
    const z = simdi(), bitis = GUN[sure] ? new Date(Date.now() + GUN[sure] * 864e5).toISOString() : null;
    const id = Number(db.prepare("INSERT INTO ip_engelleri (kapsam, neden, bitis, olusturan, olusturma) VALUES (?, ?, ?, ?, ?)").run(kapsam, neden, bitis, req.kullanici.id, z).lastInsertRowid);
    ipEngel.yukle();
    denetim({ eylem: "ip-engel.ekle", yapan: req.kullanici.id, istek: req, varlik: "ip_engelleri", varlikId: id, ayrinti: { kapsam, neden, sure, bitis } });
    return { ok: true, engel: engelGenel(db.prepare("SELECT * FROM ip_engelleri WHERE id = ?").get(id)) };
  });
  r.delete("/api/admin/ip-engelleri/:id", req => {
    yoneticiGerekli(req);
    const x = db.prepare("SELECT * FROM ip_engelleri WHERE id = ?").get(+req.params.id || 0);
    if (!x) throw new HttpHata(404, "Engel bulunamadı.");
    db.prepare("DELETE FROM ip_engelleri WHERE id = ?").run(x.id);
    ipEngel.yukle();
    denetim({ eylem: "ip-engel.kaldir", yapan: req.kullanici.id, istek: req, varlik: "ip_engelleri", varlikId: x.id, ayrinti: { kapsam: x.kapsam, neden: x.neden } });
    return { ok: true };
  });
}

module.exports = { operasyonRotalari };
