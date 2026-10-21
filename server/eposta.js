"use strict";
// Giden e-posta: her ileti önce email_outbox tablosuna yazılır; SMTP ayarlıysa gönderilir.
const config = require("./config");
const { simdi } = require("./db");

let tasiyici = null;
function tasiyiciAl() {
  if (!config.smtp.host) return null;
  if (!tasiyici) {
    const nodemailer = require("nodemailer");
    tasiyici = nodemailer.createTransport({
      host: config.smtp.host, port: config.smtp.port, secure: config.smtp.port === 465,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined
    });
  }
  return tasiyici;
}

function epostaServisi(db, gunluk) {
  const ekle = db.prepare("INSERT INTO email_outbox (alici, konu, metin, html, olusturma) VALUES (?, ?, ?, ?, ?)");
  const gitti = db.prepare("UPDATE email_outbox SET gonderim = ? WHERE id = ?");
  const hata = db.prepare("UPDATE email_outbox SET hata = ? WHERE id = ?");
  return {
    /** Kuyruğa yazar ve (SMTP varsa) arka planda gönderir. Dönüş: outbox id */
    gonder(alici, konu, metin) {
      const id = Number(ekle.run(alici, konu, metin, null, simdi()).lastInsertRowid);
      const t = tasiyiciAl();
      if (!t) {
        if (!config.uretim) console.log("[e-posta] SMTP yok, yalnızca kuyrukta: " + alici + " · " + konu + "\n" + metin);
        return id;
      }
      t.sendMail({ from: config.smtp.from, to: alici, subject: konu, text: metin })
        .then(() => gitti.run(simdi(), id))
        .catch(e => {
          hata.run(String(e && e.message || e).slice(0, 500), id);
          // Alıcı adresi günlüğe yazılmaz; yalnızca alan adı (hangi sağlayıcıda sorun var görülsün)
          if (gunluk) gunluk.hata("eposta", "E-posta gönderilemedi" + (e && e.code ? " (" + e.code + ")" : ""),
            { hata: String(e && e.message || e).slice(0, 500), kod: e && e.code, yanitKodu: e && e.responseCode, aliciAlan: String(alici).split("@")[1] || null, outboxId: id });
          else console.error("[e-posta] gönderilemedi:", e && e.message);
        });
      return id;
    }
  };
}

module.exports = { epostaServisi };
