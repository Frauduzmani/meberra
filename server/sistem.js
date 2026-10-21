"use strict";
// Sistem izleme: istemci hata raporu (POST /api/log), yönetici "Sistem" sekmesi uç noktaları (loglar, özet, sağlık)
// ve istek izleyici (yavaş istekler, 4xx yoğunluğu → güvenlik uyarısı).
const fs = require("fs");
const path = require("path");
const config = require("./config");
const { simdi } = require("./db");
const { HttpHata } = require("./http");
const { hizSinirlayici } = require("./guvenlik");
const { SEVIYELER, KAYNAKLAR, ipOzet, yolNormal } = require("./gunluk");

const SAYFA_BOYU = 50;
const DURUMLAR = ["yeni", "incelendi", "cozuldu"];
const BASLANGIC = Date.now();
const YAVAS_MS = 2000;
// Aynı IP'den 10 dakikada bu kadar yanıt → güvenlik uyarısı (ardından sayaç sıfırlanır)
const YOGUNLUK = { pencereMs: 10 * 60e3, 401: 20, 403: 20, 429: 5 };

/**
 * İstek izleyici. bitti(req, durumKodu, sureMs) her API isteğinin sonunda çağrılır.
 * sec: { yavasMs } (testler küçültebilir)
 */
function istekIzleyici(gunluk, sec) {
  sec = sec || {};
  const yavasMs = sec.yavasMs || YAVAS_MS;
  const sayac = new Map(); // "ip|kod" → [zamanlar]
  setInterval(() => {
    const t = Date.now();
    for (const [k, v] of sayac) if (v.every(x => t - x > YOGUNLUK.pencereMs)) sayac.delete(k);
  }, YOGUNLUK.pencereMs).unref();
  // Dakika kovaları (son 15 dk): istek/dk ve 5xx oranı
  const kova = new Map(); // dakika (ms/60000) → { n, s5, sure }
  function say(kod, sure) {
    const d = Math.floor(Date.now() / 60e3);
    const k = kova.get(d) || { n: 0, s5: 0, sure: 0 };
    k.n++; if (kod >= 500) k.s5++; k.sure += sure || 0;
    kova.set(d, k);
    if (kova.size > 16) for (const x of kova.keys()) if (x < d - 15) kova.delete(x);
  }
  bitti.istatistik = function () {
    const d = Math.floor(Date.now() / 60e3), seri = [];
    for (let i = 14; i >= 0; i--) { const k = kova.get(d - i) || { n: 0, s5: 0 }; seri.push({ dakika: new Date((d - i) * 60e3).toISOString(), istek: k.n, hata5xx: k.s5 }); }
    // "Dakikada": tamamlanmış son dakika ile içinde bulunulan dakikanın büyüğü (yeni açılmış dakika 0 göstermesin)
    const son5 = seri.slice(-5), top5 = son5.reduce((t, x) => t + x.istek, 0), h5 = son5.reduce((t, x) => t + x.hata5xx, 0);
    const simdiki = kova.get(d) || { n: 0, sure: 0 }, onceki = kova.get(d - 1) || { n: 0, sure: 0 };
    const ref = simdiki.n >= onceki.n ? simdiki : onceki;
    return { dakikada: ref.n, ortSureMs: ref.n ? Math.round(ref.sure / ref.n) : null, son5dk: top5, hata5xx5dk: h5, hataOrani5dk: top5 ? h5 / top5 : 0, seri };
  };
  return bitti;
  function bitti(req, kod, sure) {
    say(kod, sure);
    const bilgi = gunluk.istekBilgisi(req);
    if (sure > yavasMs) gunluk.uyari("sunucu", "Yavaş istek: " + req.method + " " + yolNormal(bilgi.path), Object.assign(bilgi, { status: kod, sureMs: Math.round(sure) }));
    // 401 yalnızca değiştiren isteklerde sayılır (misafirin GET /api/me yanıtı olağandır)
    const sayilir = kod === 429 || kod === 403 || (kod === 401 && req.method !== "GET");
    if (!sayilir || !req.ip) return;
    const k = req.ip + "|" + kod, t = Date.now();
    const l = (sayac.get(k) || []).filter(x => t - x < YOGUNLUK.pencereMs);
    l.push(t);
    if (l.length >= YOGUNLUK[kod]) {
      sayac.delete(k);
      gunluk.uyari("guvenlik", "Bir IP'den kısa sürede çok sayıda " + kod + " yanıtı (IP özeti " + ipOzet(req.ip) + ")",
        { ip: req.ip, status: kod, adet: l.length, pencereDk: YOGUNLUK.pencereMs / 60e3, sonYol: req.method + " " + yolNormal(bilgi.path), ua: bilgi.ua });
    } else sayac.set(k, l);
  }
}

/** DATA_DIR/yedekler içindeki en yeni yedek dosyası: { dosya, zaman, boyut } | null */
function sonYedek(klasor) {
  try {
    let en = null;
    for (const f of fs.readdirSync(klasor)) {
      if (!/\.(db|sqlite|gz|zip)$/i.test(f)) continue;
      const st = fs.statSync(path.join(klasor, f));
      if (st.isFile() && (!en || st.mtimeMs > en.ms)) en = { dosya: f, ms: st.mtimeMs, boyut: st.size };
    }
    return en ? { dosya: en.dosya, zaman: new Date(en.ms).toISOString(), boyut: en.boyut } : null;
  } catch (e) { return null; }
}

function sistemRotalari(r, c) {
  const { db, denetim, gunluk, yoneticiGerekli, zamanlayici, dbDosya } = c;
  const istemciSinir = hizSinirlayici(c.logSiniri || 30, 10 * 60e3);
  if (c.sinirlar) c.sinirlar.hataRaporu = istemciSinir;
  const json = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return s; } };
  const kirp = (v, n) => String(v == null ? "" : v).replace(/\r\n?/g, "\n").slice(0, n);
  const tamsayi = v => (Number.isFinite(+v) && v !== null && v !== "" ? Math.max(0, Math.min(1e7, Math.floor(+v))) : undefined);

  // --- istemci hata raporu (misafir de gönderebilir) ------------------------------------
  r.post("/api/log", req => {
    if (!istemciSinir.dene(req.ip)) throw new HttpHata(429, "Çok fazla hata raporu.");
    const b = req.body || {};
    const mesaj = kirp(b.mesaj, 500).trim();
    if (!mesaj) throw new HttpHata(400, "mesaj gerekli.");
    const seviye = b.seviye === "uyari" ? "uyari" : "hata";
    const bilgi = gunluk.istekBilgisi(req);
    gunluk.yaz(seviye, "istemci", mesaj, {
      stack: b.stack ? kirp(b.stack, 4000) : undefined,
      url: b.url ? kirp(b.url, 500) : undefined, satir: tamsayi(b.satir), sutun: tamsayi(b.sutun),
      user_id: bilgi.user_id, ip: bilgi.ip, ua: bilgi.ua
    });
    return { ok: true };
  });

  // --- yönetici: özet + sağlık (/:id'den önce tanımlanmalı) ------------------------------
  const saatOnce = s => new Date(Date.now() - s * 3600e3).toISOString();
  function seviyeSayilari(bas) {
    const o = { hata: 0, uyari: 0, bilgi: 0 };
    db.prepare("SELECT seviye, SUM(adet) AS n FROM system_logs WHERE son_zaman >= ? GROUP BY seviye").all(bas).forEach(x => { o[x.seviye] = x.n; });
    return o;
  }
  function saglik() {
    const tek = (sql, ...a) => db.prepare(sql).get(...a);
    let dbBoyut = null;
    try {
      const p = tek("PRAGMA page_count"), s = tek("PRAGMA page_size");
      dbBoyut = Number(Object.values(p)[0]) * Number(Object.values(s)[0]);
      if (dbDosya && dbDosya !== ":memory:") { try { dbBoyut += fs.statSync(dbDosya + "-wal").size; } catch (e) { /* WAL yok */ } }
    } catch (e) { /* yok say */ }
    const m = process.memoryUsage();
    const zd = zamanlayici && zamanlayici.durum ? zamanlayici.durum() : null;
    return {
      baslangic: new Date(BASLANGIC).toISOString(), calismaSn: Math.round(process.uptime()),
      bellek: { rss: m.rss, heapKullanilan: m.heapUsed, heapToplam: m.heapTotal },
      dbBoyut, node: process.version, platform: process.platform,
      sonYedek: sonYedek(path.join(config.dataDir, "yedekler")),
      eposta: {
        smtp: !!config.smtp.host,
        bekleyen: tek("SELECT COUNT(*) AS n FROM email_outbox WHERE gonderim IS NULL AND hata IS NULL").n,
        hatali24s: tek("SELECT COUNT(*) AS n FROM email_outbox WHERE hata IS NOT NULL AND olusturma >= ?", saatOnce(24)).n
      },
      zamanlayici: zd ? { acik: zd.acik, aralikDk: zd.aralikMs ? Math.round(zd.aralikMs / 60e3) : null, sonCalisma: zd.sonCalisma, sonSureMs: zd.sonSure, sonHata: zd.sonHata } : null
    };
  }
  r.get("/api/admin/loglar/ozet", req => {
    yoneticiGerekli(req);
    const acik = db.prepare("SELECT seviye, COUNT(*) AS n FROM system_logs WHERE durum = 'yeni' GROUP BY seviye").all();
    const say = sv => (acik.find(x => x.seviye === sv) || { n: 0 }).n;
    // Son 7 günün günlük hata/uyarı sayısı (mini çubuklar için; en eski → en yeni, UTC günleri)
    const gunler = [];
    for (let i = 6; i >= 0; i--) gunler.push(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
    const seri = db.prepare(`SELECT substr(son_zaman, 1, 10) AS g, seviye, SUM(adet) AS n FROM system_logs
      WHERE son_zaman >= ? AND seviye != 'bilgi' GROUP BY g, seviye`).all(gunler[0]);
    const deger = (g, sv) => (seri.find(x => x.g === g && x.seviye === sv) || { n: 0 }).n;
    return {
      ok: true,
      son24s: seviyeSayilari(saatOnce(24)), son7g: seviyeSayilari(saatOnce(24 * 7)),
      yeni: { hata: say("hata"), uyari: say("uyari"), bilgi: say("bilgi") },
      gunluk: gunler.map(g => ({ gun: g, hata: deger(g, "hata"), uyari: deger(g, "uyari") })),
      saglik: saglik()
    };
  });

  // --- yönetici: liste ---------------------------------------------------------------
  r.get("/api/admin/loglar", req => {
    yoneticiGerekli(req);
    const q = req.sorgu, kosul = [], arg = [];
    const sayfa = Math.max(1, Math.floor(+q.get("sayfa") || 1));
    const seviye = q.get("seviye"), kaynak = q.get("kaynak"), durum = q.get("durum"), ara = String(q.get("q") || "").trim().slice(0, 100);
    if (seviye) { if (SEVIYELER.indexOf(seviye) < 0) throw new HttpHata(400, "Geçersiz seviye."); kosul.push("seviye = ?"); arg.push(seviye); }
    if (kaynak) { if (KAYNAKLAR.indexOf(kaynak) < 0) throw new HttpHata(400, "Geçersiz kaynak."); kosul.push("kaynak = ?"); arg.push(kaynak); }
    if (durum === "acik") kosul.push("durum != 'cozuldu'");
    else if (durum) { if (DURUMLAR.indexOf(durum) < 0) throw new HttpHata(400, "Geçersiz durum."); kosul.push("durum = ?"); arg.push(durum); }
    if (ara) { const l = "%" + ara.replace(/[%_\\]/g, "") + "%"; kosul.push("(mesaj LIKE ? OR ayrinti LIKE ?)"); arg.push(l, l); }
    const where = kosul.length ? "WHERE " + kosul.join(" AND ") : "";
    const toplam = db.prepare("SELECT COUNT(*) AS n FROM system_logs " + where).get(...arg).n;
    const satirlar = db.prepare("SELECT * FROM system_logs " + where + " ORDER BY son_zaman DESC, id DESC LIMIT ? OFFSET ?").all(...arg, SAYFA_BOYU, (sayfa - 1) * SAYFA_BOYU);
    return {
      ok: true, toplam, sayfa, sayfaBoyu: SAYFA_BOYU, sayfaBoyutu: SAYFA_BOYU,
      loglar: satirlar.map(l => {
        const a = json(l.ayrinti) || {};
        return { id: l.id, zaman: l.zaman, sonZaman: l.son_zaman, seviye: l.seviye, kaynak: l.kaynak, mesaj: l.mesaj, adet: l.adet, durum: l.durum,
          ozet: { method: a.method, path: a.path, status: a.status, url: a.url ? String(a.url).slice(0, 160) : undefined } };
      })
    };
  });

  const logBul = id => {
    const l = db.prepare("SELECT s.*, u.ad AS i_ad, u.soyad AS i_soyad FROM system_logs s LEFT JOIN users u ON u.id = s.isleyen WHERE s.id = ?").get(+id || 0);
    if (!l) throw new HttpHata(404, "Kayıt bulunamadı.");
    return l;
  };
  const logGenel = l => {
    const a = json(l.ayrinti) || {};
    let kullanici = null;
    if (a.user_id) { const u = db.prepare("SELECT public_id, ad, soyad FROM users WHERE id = ?").get(a.user_id); if (u) kullanici = { id: u.public_id, ad: u.ad, soyad: u.soyad }; }
    return { id: l.id, zaman: l.zaman, sonZaman: l.son_zaman, seviye: l.seviye, kaynak: l.kaynak, mesaj: l.mesaj, adet: l.adet, durum: l.durum,
      cozumNotu: l.cozum_notu, islemZamani: l.islem_zamani, isleyen: l.isleyen ? { ad: l.i_ad, soyad: l.i_soyad } : null,
      parmakIzi: l.parmak_izi, ayrinti: a, kullanici };
  };
  r.get("/api/admin/loglar/:id", req => {
    yoneticiGerekli(req);
    return { ok: true, log: logGenel(logBul(req.params.id)) };
  });

  r.post("/api/admin/loglar/toplu", req => {
    yoneticiGerekli(req);
    const b = req.body || {};
    if (DURUMLAR.indexOf(b.durum) < 0) throw new HttpHata(400, "Durum yeni, incelendi ya da cozuldu olmalı.");
    const ids = Array.isArray(b.ids) ? [...new Set(b.ids.map(x => Math.floor(+x)).filter(x => x > 0))] : [];
    if (!ids.length || ids.length > 200) throw new HttpHata(400, "1–200 kayıt seç.");
    const not = b.not == null ? null : String(b.not).slice(0, 500) || null;
    const n = Number(db.prepare(`UPDATE system_logs SET durum = ?, cozum_notu = COALESCE(?, cozum_notu), isleyen = ?, islem_zamani = ? WHERE id IN (${ids.map(() => "?").join(",")})`)
      .run(b.durum, not, req.kullanici.id, simdi(), ...ids).changes);
    denetim({ eylem: "log.toplu-durum", yapan: req.kullanici.id, istek: req, varlik: "system_logs", ayrinti: { durum: b.durum, ids: ids.slice(0, 50), adet: n, not } });
    return { ok: true, guncellenen: n };
  });

  r.post("/api/admin/loglar/:id/durum", req => {
    yoneticiGerekli(req);
    const b = req.body || {}, l = logBul(req.params.id);
    if (DURUMLAR.indexOf(b.durum) < 0) throw new HttpHata(400, "Durum yeni, incelendi ya da cozuldu olmalı.");
    const not = b.not == null ? l.cozum_notu : String(b.not).slice(0, 500) || null;
    db.prepare("UPDATE system_logs SET durum = ?, cozum_notu = ?, isleyen = ?, islem_zamani = ? WHERE id = ?").run(b.durum, not, req.kullanici.id, simdi(), l.id);
    denetim({ eylem: "log.durum", yapan: req.kullanici.id, istek: req, varlik: "system_logs", varlikId: l.id, ayrinti: { onceki: l.durum, durum: b.durum, not } });
    return { ok: true, log: logGenel(logBul(l.id)) };
  });

  // --- yalnızca test/hata ayıklama: sunucu 500'ü üretir (MEBERRA_TEST_ROTALARI=1 ya da NODE_ENV=test) -----------
  if (c.testRotalari) {
    const at = () => { throw new Error("Test hatası: bilinçli olarak üretilen sunucu hatası"); };
    r.get("/api/test/hata", at);
    r.post("/api/test/hata", at);
  }
}

module.exports = { sistemRotalari, istekIzleyici, sonYedek };
