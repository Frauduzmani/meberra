"use strict";
// Erişim denetimleri: bakım modu (ayarlar tablosunda kalıcı) ve IP engel listesi (tek adres ya da IPv4 /24).
// Her ikisi de bellekte tutulur; değişince veritabanından yeniden yüklenir (istek başına sorgu yok).
const { simdi } = require("./db");
const { HttpHata } = require("./http");

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const IPV6_RE = /^[0-9a-f:]+$/i;

/** "::ffff:1.2.3.4" → "1.2.3.4"; boşluk kırpılır; küçük harf */
function ipNormal(ip) {
  const s = String(ip || "").trim().toLowerCase();
  return s.startsWith("::ffff:") && IPV4_RE.test(s.slice(7)) ? s.slice(7) : s;
}
const ipv4Gecerli = s => { const m = IPV4_RE.exec(s); return !!m && m.slice(1).every(x => +x <= 255); };

/** Engel kapsamını doğrular ve normalleştirir: "1.2.3.4", "1.2.3.0/24" (1.2.3.x/24 de kabul), IPv6 tam adres. Geçersizse null. */
function kapsamNormal(v) {
  const s = ipNormal(v);
  const m = /^(\d{1,3}\.\d{1,3}\.\d{1,3})\.(\d{1,3})\/24$/.exec(s);
  if (m) return ipv4Gecerli(m[1] + "." + m[2]) ? m[1] + ".0/24" : null;
  if (ipv4Gecerli(s)) return s;
  if (s.includes(":") && IPV6_RE.test(s) && s.length <= 45) return s;
  return null;
}
/** ip kapsamın içinde mi? */
function ipEslesir(ip, kapsam) {
  const a = ipNormal(ip);
  if (!a) return false;
  if (kapsam.endsWith("/24")) return ipv4Gecerli(a) && a.slice(0, a.lastIndexOf(".")) === kapsam.slice(0, kapsam.lastIndexOf(".0/24"));
  return a === kapsam;
}

function ayarServisi(db) {
  const al = db.prepare("SELECT deger FROM ayarlar WHERE anahtar = ?");
  const yaz = db.prepare(`INSERT INTO ayarlar (anahtar, deger, guncelleme, guncelleyen) VALUES (?, ?, ?, ?)
    ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger, guncelleme = excluded.guncelleme, guncelleyen = excluded.guncelleyen`);
  return {
    al(anahtar) { const r = al.get(anahtar); if (!r) return null; try { return JSON.parse(r.deger); } catch (e) { return null; } },
    yaz(anahtar, deger, yapan) { yaz.run(anahtar, JSON.stringify(deger), simdi(), yapan || null); }
  };
}

/** Bakım modu: { acik, mesaj, bitis, baslangic, baslatan } */
function bakimServisi(ayar) {
  let durum = ayar.al("bakim") || { acik: false };
  return {
    durum: () => Object.assign({}, durum),
    acikMi: () => !!durum.acik,
    ayarla(b, yapan) {
      const yeni = { acik: !!b.acik, mesaj: b.mesaj || null, bitis: b.bitis || null, baslangic: b.acik ? (durum.acik ? durum.baslangic : simdi()) : null, baslatan: b.acik ? yapan || null : null };
      ayar.yaz("bakim", yeni, yapan);
      durum = yeni;
      return Object.assign({}, durum);
    },
    /** Retry-After (sn): planlanan bitiş gelecekteyse oraya kadar (en az 60, en çok 1 gün), yoksa 60 */
    tekrarSn() {
      const t = durum.bitis ? Date.parse(durum.bitis) - Date.now() : NaN;
      return isNaN(t) || t <= 0 ? 60 : Math.min(86400, Math.max(60, Math.ceil(t / 1000)));
    }
  };
}

function ipEngelServisi(db) {
  let liste = [];
  function yukle() {
    liste = db.prepare("SELECT * FROM ip_engelleri ORDER BY id DESC").all();
  }
  yukle();
  return {
    yukle,
    liste: () => liste.slice(),
    /** Etkin engel (süresi dolmamış) ya da null */
    eslesen(ip) {
      if (!liste.length || !ip) return null;
      const z = simdi();
      return liste.find(e => (!e.bitis || e.bitis > z) && ipEslesir(ip, e.kapsam)) || null;
    },
    denetle(ip) {
      const e = this.eslesen(ip);
      if (e) throw new HttpHata(403, "Bu ağdan erişim geçici olarak engellendi. Bir yanlışlık olduğunu düşünüyorsan bize e-posta ile yaz.", null, { ipEngeli: true });
    },
    /** Süresi dolanları siler; dönüş: silinen sayısı */
    temizle() {
      const n = Number(db.prepare("DELETE FROM ip_engelleri WHERE bitis IS NOT NULL AND bitis <= ?").run(simdi()).changes);
      if (n) yukle();
      return n;
    }
  };
}

module.exports = { ayarServisi, bakimServisi, ipEngelServisi, ipEslesir, kapsamNormal, ipNormal };
