"use strict";
// Kullanıcı varlığı (presence): son görülme, son IP, oturum son görülme. Ucuz olsun diye her istekte veritabanına
// yazılmaz: kullanıcı başına en fazla 60 sn'de bir bellekteki kuyruğa alınır, kuyruk 30 sn'de bir (ve kapanışta)
// tek işlemde veritabanına boşaltılır. Yönetici uç noktaları okumadan önce bosalt() çağırır (her zaman taze).
const { islem } = require("./db");

const YAZMA_ARALIGI_MS = 60e3;
const BOSALTMA_MS = 30e3;
const CEVRIMICI_MS = 5 * 60e3;   // son 5 dk: çevrimiçi
const YAKIN_MS = 30 * 60e3;      // son 30 dk: "az önce aktif"

/** "cevrimici" | "yakin" | "cevrimdisi" */
function varlikDurumu(sonGorulme, simdiMs) {
  const t = sonGorulme ? Date.parse(sonGorulme) : NaN;
  if (isNaN(t)) return "cevrimdisi";
  const f = (simdiMs == null ? Date.now() : simdiMs) - t;
  if (f <= CEVRIMICI_MS) return "cevrimici";
  if (f <= YAKIN_MS) return "yakin";
  return "cevrimdisi";
}
/** SQL karşılaştırması için eşik ISO zamanları */
const esikler = simdiMs => ({
  cevrimici: new Date((simdiMs == null ? Date.now() : simdiMs) - CEVRIMICI_MS).toISOString(),
  yakin: new Date((simdiMs == null ? Date.now() : simdiMs) - YAKIN_MS).toISOString()
});

/** sec: { saat: () => ms, otomatik: bool (varsayılan true: 30 sn'de bir boşaltır) } */
function varlikServisi(db, sec) {
  sec = sec || {};
  const saat = sec.saat || (() => Date.now());
  const son = new Map();        // userId → son kuyruğa alma zamanı (ms)
  const bekleyen = new Map();   // userId → { zaman, ip, sid }
  const kullaniciYaz = db.prepare("UPDATE users SET son_gorulme = ?, son_ip = ? WHERE id = ?");
  const oturumYaz = db.prepare("UPDATE sessions SET son_gorulme = ?, son_ip = ? WHERE id = ?");

  /** Kimliği doğrulanmış her API isteğinde çağrılır (k: oturumKullanici sonucu: id, sid, son_gorulme) */
  function dokun(k, ip) {
    if (!k || !k.id) return;
    const t = saat();
    let onceki = son.get(k.id);
    if (onceki == null && k.son_gorulme) onceki = Date.parse(k.son_gorulme) || 0;
    if (onceki != null && t - onceki < YAZMA_ARALIGI_MS) return;
    son.set(k.id, t);
    bekleyen.set(k.id, { zaman: new Date(t).toISOString(), ip: ip || null, sid: k.sid || null });
  }

  function bosalt() {
    if (!bekleyen.size) return 0;
    const l = [...bekleyen.entries()];
    bekleyen.clear();
    try {
      islem(db, () => l.forEach(([uid, v]) => {
        kullaniciYaz.run(v.zaman, v.ip, uid);
        if (v.sid) oturumYaz.run(v.zaman, v.ip, v.sid);
      }));
    } catch (e) { /* veritabanı kapalıysa (kapanış) sessizce geç */ }
    // Bellek sınırı: çok eski kayıtlar atılır (60 sn kuralı veritabanındaki son_gorulme ile sürer)
    if (son.size > 20000) { const t = saat(); for (const [k, v] of son) if (t - v > YAZMA_ARALIGI_MS) son.delete(k); }
    return l.length;
  }

  let zamanlayici = null;
  if (sec.otomatik !== false) { zamanlayici = setInterval(bosalt, BOSALTMA_MS); zamanlayici.unref(); }

  return {
    dokun, bosalt,
    durdur() { clearInterval(zamanlayici); bosalt(); },
    bekleyenSayisi: () => bekleyen.size,
    unut(userId) { son.delete(userId); bekleyen.delete(userId); }
  };
}

module.exports = { varlikServisi, varlikDurumu, esikler, CEVRIMICI_MS, YAKIN_MS };
