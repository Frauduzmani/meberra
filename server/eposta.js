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

  /** Kuyruktaki tek satırı (yeniden) gönderir; SMTP yoksa false. Dönüş: Promise<bool> */
  function satirGonder(r) {
    const t = tasiyiciAl();
    if (!t) return Promise.resolve(false);
    db.prepare("UPDATE email_outbox SET hata = NULL WHERE id = ?").run(r.id);
    return t.sendMail({ from: config.smtp.from, to: r.alici, subject: r.konu, text: r.metin })
      .then(() => { gitti.run(simdi(), r.id); return true; })
      .catch(e => {
        hata.run(String(e && e.message || e).slice(0, 500), r.id);
        if (gunluk) gunluk.hata("eposta", "E-posta gönderilemedi (yeniden deneme)" + (e && e.code ? " (" + e.code + ")" : ""),
          { hata: String(e && e.message || e).slice(0, 500), kod: e && e.code, aliciAlan: String(r.alici).split("@")[1] || null, outboxId: r.id });
        return false;
      });
  }
  return {
    smtpVar: () => !!config.smtp.host,
    /** Gönderilmemiş (bekleyen + hatalı) en eski `sinir` kaydı sırayla gönderir → { denenen, gonderilen, hatali } */
    async kuyruguIsle(sinir) {
      if (!tasiyiciAl()) return { smtp: false, denenen: 0, gonderilen: 0, hatali: 0 };
      const l = db.prepare("SELECT * FROM email_outbox WHERE gonderim IS NULL AND alici != 'silindi' ORDER BY id LIMIT ?").all(sinir || 50);
      let gonderilen = 0;
      for (const r of l) if (await satirGonder(r)) gonderilen++;
      return { smtp: true, denenen: l.length, gonderilen, hatali: l.length - gonderilen };
    },
    /** Tek kaydı yeniden dener → { smtp, gonderildi } (null: kayıt yok ya da zaten gönderilmiş) */
    async tekrarDene(id) {
      const r = db.prepare("SELECT * FROM email_outbox WHERE id = ? AND gonderim IS NULL AND alici != 'silindi'").get(+id || 0);
      if (!r) return null;
      if (!tasiyiciAl()) return { smtp: false, gonderildi: false };
      return { smtp: true, gonderildi: await satirGonder(r) };
    },
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
