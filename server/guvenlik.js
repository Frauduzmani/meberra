"use strict";
// Şifre özeti (scrypt), rastgele belirteçler ve basit hız sınırlayıcı.
const crypto = require("crypto");

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

function sifreOzetle(sifre) {
  const salt = crypto.randomBytes(16);
  const h = crypto.scryptSync(String(sifre).normalize("NFC"), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("hex"), h.toString("hex")].join("$");
}

function sifreDogrula(sifre, kayit) {
  const p = String(kayit || "").split("$");
  if (p.length !== 6 || p[0] !== "scrypt") {
    // Var olmayan kullanıcıda da benzer süre harcansın
    crypto.scryptSync("x", "yoksay-tuz-1234", SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
    return false;
  }
  const beklenen = Buffer.from(p[5], "hex");
  const h = crypto.scryptSync(String(sifre).normalize("NFC"), Buffer.from(p[4], "hex"), beklenen.length, { N: +p[1], r: +p[2], p: +p[3] });
  return h.length === beklenen.length && crypto.timingSafeEqual(h, beklenen);
}

function belirtec(bayt) { return crypto.randomBytes(bayt || 32).toString("base64url"); }
function ozet(s) { return crypto.createHash("sha256").update(String(s)).digest("hex"); }
function publicId() { return "u" + crypto.randomBytes(8).toString("hex"); }

/** Kayan pencereli bellek içi hız sınırlayıcı: anahtar başına pencere içinde en fazla `sinir` deneme. */
function hizSinirlayici(sinir, pencereMs) {
  const kayit = new Map();
  setInterval(() => {
    const t = Date.now();
    for (const [k, v] of kayit) if (v.every(x => t - x > pencereMs)) kayit.delete(k);
  }, pencereMs).unref();
  return {
    dene(anahtar) {
      const t = Date.now();
      const l = (kayit.get(anahtar) || []).filter(x => t - x < pencereMs);
      if (l.length >= sinir) { kayit.set(anahtar, l); return false; }
      l.push(t); kayit.set(anahtar, l); return true;
    },
    sifirla(anahtar) { kayit.delete(anahtar); },
    /** İzlenen anahtar sayısı (yönetici "Sistem" sekmesi) */
    boyut() { return kayit.size; }
  };
}

module.exports = { sifreOzetle, sifreDogrula, belirtec, ozet, publicId, hizSinirlayici };
