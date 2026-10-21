"use strict";
// Sistem günlüğü (system_logs): seviye hata | uyari | bilgi; kaynak sunucu | istemci | zamanlayici | eposta | push | guvenlik.
// Her kayıt konsola da yazılır. Aynı parmak izi (kaynak + mesaj + yığının ilk çerçevesi) 1 saat içinde tekrar ederse yeni
// satır açılmaz: adet artar, son_zaman güncellenir (çözüldü olarak işaretlenmiş bir hata tekrar ederse yeni satır açılır).
// Gizlilik: şifre, belirteç, çerez, Authorization gibi alanlar ve URL'deki belirteç parametreleri "[gizli]" olarak yazılır;
// IP adresi yalnızca kısa bir özet (ipOzet) olarak saklanır; istek gövdesi hiçbir zaman yazılmaz.
const crypto = require("crypto");
const { simdi } = require("./db");

const SEVIYELER = ["hata", "uyari", "bilgi"];
const KAYNAKLAR = ["sunucu", "istemci", "zamanlayici", "eposta", "push", "guvenlik"];
const BIRLESTIRME_MS = 60 * 60e3;
const SAKLAMA_GUN = { bilgi: 7, uyari: 90, hata: 90 };
const GIZLI = "[gizli]";
const GIZLI_ANAHTAR_RE = /(sifre|şifre|parola|password|passwd|pass|token|belirtec|belirteç|secret|cookie|cerez|çerez|authorization|auth|session|sid|p256dh|api[-_]?key|private)/i;
const KONSOL = { hata: "error", uyari: "warn", bilgi: "log" };

/** Metindeki gizli değerleri maskeler: URL parametreleri (?t=, token=, sifre=…), Bearer başlıkları, oturum çerezi. */
function metinTemizle(s) {
  if (s == null) return s;
  return String(s)
    .replace(/([?&;](?:t|token|belirtec|sifre|password|pass|key|sid|code)=)[^&\s#"':)]+/gi, "$1" + GIZLI)
    .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/g, "$1 " + GIZLI)
    .replace(/(meberra_sid=)[^;\s"']+/gi, "$1" + GIZLI)
    .replace(/("?(?:sifre|password|token|belirtec)"?\s*[:=]\s*)"[^"]*"/gi, "$1\"" + GIZLI + "\"");
}

/** Nesneyi (derinlik ≤ 4) gizli alanlardan arındırır; dizeler metinTemizle'den geçer. */
function temizle(v, derinlik) {
  derinlik = derinlik || 0;
  if (v == null || typeof v === "number" || typeof v === "boolean") return v;
  if (typeof v === "string") return metinTemizle(v);
  if (derinlik > 4) return "[…]";
  if (Array.isArray(v)) return v.slice(0, 50).map(x => temizle(x, derinlik + 1));
  if (typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v).slice(0, 60)) o[k] = GIZLI_ANAHTAR_RE.test(k) ? GIZLI : temizle(v[k], derinlik + 1);
    return o;
  }
  return String(v);
}

const ipOzet = ip => (ip ? crypto.createHash("sha256").update("meberra-log:" + ip).digest("hex").slice(0, 12) : null);

/** Yığının ilk "at …" çerçevesi (satır/sütun numarası dahil) — parmak izine girer. */
function ilkCerceve(stack) {
  const satir = String(stack || "").split("\n").map(s => s.trim()).find(s => /^at\s|@/.test(s));
  return satir || "";
}
function parmakIzi(kaynak, mesaj, stack) {
  return crypto.createHash("sha256").update(kaynak + "\n" + mesaj + "\n" + ilkCerceve(stack)).digest("hex").slice(0, 32);
}

/** Yolu gruplamaya uygun hale getirir: sayısal ve uXXXXXXXX kimlikleri ":id" olur; sorgu dizesi atılır. */
function yolNormal(p) {
  return String(p || "").split("?")[0].split("/").map(s => /^\d+$/.test(s) || /^u[0-9a-f]{16}$/.test(s) ? ":id" : s).join("/").slice(0, 200);
}

/**
 * sec: { konsol: bool (varsayılan true), saat: () => ms }
 * Dönüş: { yaz, hata, uyari, bilgi, temizlik, istekBilgisi }
 */
function gunlukServisi(db, sec) {
  sec = sec || {};
  const saat = sec.saat || (() => Date.now());
  const konsol = sec.konsol !== false;
  let q = null;
  const hazirla = () => q || (q = {
    son: db.prepare("SELECT id, durum FROM system_logs WHERE parmak_izi = ? AND son_zaman >= ? ORDER BY id DESC LIMIT 1"),
    artir: db.prepare("UPDATE system_logs SET adet = adet + 1, son_zaman = ?, ayrinti = COALESCE(?, ayrinti) WHERE id = ?"),
    ekle: db.prepare("INSERT INTO system_logs (zaman, son_zaman, seviye, kaynak, mesaj, ayrinti, parmak_izi) VALUES (?, ?, ?, ?, ?, ?, ?)"),
    sil: db.prepare("DELETE FROM system_logs WHERE seviye = ? AND son_zaman < ?")
  });
  let yaziyor = false;

  /** ayrinti: { stack, path, method, status, user_id, ip (özetlenir), ua, url, ... } → dönüş: satır id ya da null */
  function yaz(seviye, kaynak, mesaj, ayrinti) {
    if (SEVIYELER.indexOf(seviye) < 0) seviye = "hata";
    if (KAYNAKLAR.indexOf(kaynak) < 0) kaynak = "sunucu";
    mesaj = metinTemizle(String(mesaj == null ? "" : mesaj).replace(/\s+/g, " ").trim()).slice(0, 500) || "(mesaj yok)";
    let a = ayrinti && typeof ayrinti === "object" ? Object.assign({}, ayrinti) : {};
    if (a.ip) { a.ipOzet = ipOzet(a.ip); delete a.ip; }
    if (a.stack) a.stack = String(a.stack).slice(0, 4000);
    if (a.ua) a.ua = String(a.ua).slice(0, 300);
    a = temizle(a);
    if (konsol) {
      const f = console[KONSOL[seviye]] || console.log;
      f.call(console, "[" + seviye + "][" + kaynak + "] " + mesaj + (a.stack && seviye === "hata" ? "\n" + a.stack : ""));
    }
    if (yaziyor) return null; // günlük yazarken oluşan hata kendini tekrar günlüğe yazmaya çalışmasın
    yaziyor = true;
    try {
      const s = hazirla(), z = new Date(saat()).toISOString();
      const iz = parmakIzi(kaynak, mesaj, a.stack);
      const json = Object.keys(a).length ? JSON.stringify(a).slice(0, 12000) : null;
      const onceki = s.son.get(iz, new Date(saat() - BIRLESTIRME_MS).toISOString());
      if (onceki && onceki.durum !== "cozuldu") { s.artir.run(z, json, onceki.id); return onceki.id; }
      return Number(s.ekle.run(z, z, seviye, kaynak, mesaj, json, iz).lastInsertRowid);
    } catch (e) {
      if (konsol) console.error("[günlük] yazılamadı:", e && e.message);
      return null;
    } finally { yaziyor = false; }
  }

  /** Saklama süresi dolan kayıtları siler (bilgi 7 gün, uyarı/hata 90 gün). Dönüş: silinen satır sayısı */
  function temizlik(simdiMs) {
    const t = simdiMs == null ? saat() : simdiMs;
    let n = 0;
    for (const sv of SEVIYELER) n += Number(hazirla().sil.run(sv, new Date(t - SAKLAMA_GUN[sv] * 864e5).toISOString()).changes);
    return n;
  }

  /** İstekten güvenli ayrıntı: yöntem, yol (sorgusuz), kullanıcı, IP (özetlenir), tarayıcı. Gövde/çerez/başlık yok. */
  function istekBilgisi(req) {
    if (!req) return {};
    let yol = "";
    try { yol = new URL(req.url, "http://x").pathname; } catch (e) { yol = String(req.url || "").split("?")[0]; }
    return { method: req.method, path: yol, user_id: req.kullanici ? req.kullanici.id : undefined, ip: req.ip, ua: req.headers && req.headers["user-agent"] };
  }

  return {
    yaz, temizlik, istekBilgisi,
    hata: (kaynak, mesaj, ayrinti) => yaz("hata", kaynak, mesaj, ayrinti),
    uyari: (kaynak, mesaj, ayrinti) => yaz("uyari", kaynak, mesaj, ayrinti),
    bilgi: (kaynak, mesaj, ayrinti) => yaz("bilgi", kaynak, mesaj, ayrinti)
  };
}

/** Hata nesnesinden ayrıntı: { stack, ad, kod } */
function hataAyrinti(e) {
  if (!e || typeof e !== "object") return { deger: String(e) };
  return { stack: e.stack ? String(e.stack) : undefined, ad: e.name, kod: e.code || e.errcode || undefined };
}

module.exports = { gunlukServisi, temizle, metinTemizle, ipOzet, parmakIzi, yolNormal, hataAyrinti, SEVIYELER, KAYNAKLAR, SAKLAMA_GUN };
