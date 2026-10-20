"use strict";
// Denetim kaydı (audit log): kim, ne zaman, ne yaptı. Kişisel veri (şifre vb.) ayrıntıya yazılmaz.
const { simdi } = require("./db");

function denetimKaydi(db) {
  const ekle = db.prepare(`INSERT INTO audit_log (zaman, user_id, yapan_id, eylem, varlik, varlik_id, ip, tarayici, ayrinti)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  /**
   * k: { eylem, kullanici (etkilenen users.id), yapan (users.id), varlik, varlikId, ayrinti (nesne), istek (req) }
   */
  return function yaz(k) {
    const req = k.istek;
    ekle.run(
      simdi(), k.kullanici || null, k.yapan || k.kullanici || null, String(k.eylem),
      k.varlik || null, k.varlikId != null ? String(k.varlikId) : null,
      req ? req.ip : null, req ? String(req.headers["user-agent"] || "").slice(0, 300) : null,
      k.ayrinti ? JSON.stringify(k.ayrinti).slice(0, 4000) : null
    );
  };
}

module.exports = { denetimKaydi };
