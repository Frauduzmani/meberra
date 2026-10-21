"use strict";
// Bildirimler: uygulama içi bildirim, bildirim tercihleri (açık rıza), web push abonelikleri, tek tıkla iptal.
// Kurallar: tüm e-posta/push tercihleri varsayılan KAPALI; push ve hatırlatmalar sessiz saatlerde (22:00–08:00
// İstanbul) gönderilmez; bildirim bağlantıları yalnızca site içi göreli yoldur.
const config = require("./config");
const { simdi } = require("./db");
const { belirtec } = require("./guvenlik");
const { HttpHata } = require("./http");
const zaman = require("./zaman");

const TURLER = ["soru-yanit", "seri", "premium", "duyuru", "rozet", "lig", "tekrar"];
const EPOSTA_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[A-Za-z]{2,}$/;
const SAYFA = 30;
const ONERI_EN_AZ = 10; // 1.16.0 oyun: önerilen saat için son 30 günde en az bu kadar cevap
const kirp = s => String(s == null ? "" : s).trim().replace(/\s+/g, " ");

/** Yalnızca site içi göreli bağlantı: "/calis#x" geçer; "//evil", "https://", "javascript:" geçmez. */
function linkTemiz(l) {
  const s = String(l == null ? "" : l).trim();
  if (!s) return null;
  if (s.length > 300 || !/^\/(?![\/\\])[^\s<>"']*$/.test(s)) return null;
  return s;
}
const evetMi = v => v === true || v === 1 || v === "1" || v === "true";
const boolMu = v => v === true || v === false || v === 0 || v === 1 || v === "0" || v === "1" || v === "true" || v === "false";

/** sec.saat: () => ms (testlerde sahte saat; sessiz saat denetimi için) · sec.gunluk: sistem günlüğü (gunluk.js) */
function bildirimServisi(db, eposta, push, denetim, sec) {
  const saat = (sec && sec.saat) || Date.now;
  const gunluk = (sec && sec.gunluk) || null;
  const q = {
    ekle: db.prepare("INSERT INTO notifications (user_id, tur, baslik, metin, link, olusturma) VALUES (?, ?, ?, ?, ?, ?)"),
    liste: db.prepare("SELECT * FROM notifications WHERE user_id = ? AND id < ? ORDER BY id DESC LIMIT ?"),
    okunmamis: db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND okundu IS NULL"),
    okuHepsi: db.prepare("UPDATE notifications SET okundu = ? WHERE user_id = ? AND okundu IS NULL"),
    okuTek: db.prepare("UPDATE notifications SET okundu = ? WHERE user_id = ? AND id = ? AND okundu IS NULL"),
    ayar: db.prepare("SELECT * FROM notification_prefs WHERE user_id = ?"),
    ayarEkle: db.prepare("INSERT OR IGNORE INTO notification_prefs (user_id, hatirlatma_saati, iptal_belirtec, guncelleme) VALUES (?, ?, ?, ?)"),
    ayarYaz: db.prepare(`UPDATE notification_prefs SET eposta_hatirlatma = ?, push = ?, eposta_bildirim = ?, hatirlatma_saati = ?, veli_raporu = ?,
      veli_eposta = ?, veli_dogrulandi = ?, veli_belirtec = ?, guncelleme = ? WHERE user_id = ?`),
    iptalBelirtec: db.prepare("SELECT * FROM notification_prefs WHERE iptal_belirtec = ?"),
    veliBelirtec: db.prepare("SELECT * FROM notification_prefs WHERE veli_belirtec = ?"),
    kullanici: db.prepare("SELECT id, ad, soyad, eposta, durum FROM users WHERE id = ?"),
    abonelikler: db.prepare("SELECT * FROM push_subscriptions WHERE user_id = ?"),
    aboneSay: db.prepare("SELECT COUNT(*) AS n FROM push_subscriptions WHERE user_id = ?"),
    aboneYaz: db.prepare(`INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, tarayici, olusturma) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, tarayici = excluded.tarayici`),
    aboneSil: db.prepare("DELETE FROM push_subscriptions WHERE id = ?"),
    aboneSilEndpoint: db.prepare("DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?"),
    aboneSilHepsi: db.prepare("DELETE FROM push_subscriptions WHERE user_id = ?"),
    aboneBasari: db.prepare("UPDATE push_subscriptions SET son_basari = ? WHERE id = ?"),
    // 1.16.0 oyun: akıllı hatırlatma saati
    saatElle: db.prepare("UPDATE notification_prefs SET saat_elle = 1 WHERE user_id = ?"),
    cevapSaatleri: db.prepare("SELECT substr(zaman, 1, 13) AS s, COUNT(*) AS n FROM answers WHERE user_id = ? AND zaman >= ? AND zaman <= ? GROUP BY s")
  };

  // 1.16.0 oyun — önerilen hatırlatma saati: son 30 günde (≥ ONERI_EN_AZ cevap) en çok çalışılan İstanbul saati.
  // Sessiz saatlere (22:00–08:00) denk gelirse en yakın izinli saate (8 ya da 21) çekilir. Eşitlikte erken saat.
  function onerilenSaat(userId, simdiMs) {
    const t = simdiMs == null ? saat() : simdiMs;
    const satirlar = q.cevapSaatleri.all(userId, new Date(t - 30 * 864e5).toISOString(), new Date(t).toISOString());
    const say = new Array(24).fill(0);
    let top = 0;
    satirlar.forEach(r => { const ms = Date.parse(r.s + ":00:00Z"); if (isNaN(ms)) return; say[zaman.parcalar(ms).saat] += r.n; top += r.n; });
    if (top < ONERI_EN_AZ) return null;
    let en = 0;
    for (let h = 1; h < 24; h++) if (say[h] > say[en]) en = h;
    return Math.min(21, Math.max(8, en));
  }
  /** Hatırlatmanın kullanılacağı saat: öğrenci saat seçmediyse (saat_elle = 0) önerilen saat, yoksa kayıtlı saat */
  function etkinSaat(r, simdiMs) {
    if (!r) return config.hatirlatmaSaati;
    if (r.saat_elle) return r.hatirlatma_saati;
    const o = onerilenSaat(r.user_id, simdiMs);
    return o == null ? r.hatirlatma_saati : o;
  }

  function genel(n) {
    return { id: n.id, tur: n.tur, baslik: n.baslik, metin: n.metin, link: n.link, okundu: !!n.okundu, olusturma: n.olusturma };
  }

  /** Tercih satırı (yoksa oluşturulur: varsayılanlar kapalı, iptal belirteci üretilir) */
  function ayarSatiri(userId) {
    let r = q.ayar.get(userId);
    if (!r) { q.ayarEkle.run(userId, config.hatirlatmaSaati, belirtec(24), simdi()); r = q.ayar.get(userId); }
    return r;
  }
  function ayarGenel(r) {
    return {
      epostaHatirlatma: !!r.eposta_hatirlatma, push: !!r.push, epostaBildirim: !!r.eposta_bildirim, hatirlatmaSaati: r.hatirlatma_saati,
      veliRaporu: !!r.veli_raporu, veliEposta: r.veli_eposta || null, veliDogrulandi: !!r.veli_dogrulandi
    };
  }
  const iptalLinki = (r, tur) => config.baseUrl + "/api/public/bildirim-iptal?tur=" + tur + "&t=" + encodeURIComponent(r.iptal_belirtec);

  /** Push: tercihi açık ve aboneliği olan kullanıcıya, sessiz saatler dışında. Ölü abonelikler (404/410) silinir. */
  async function pushGonder(userId, yuk, simdiMs) {
    if (!push || !push.gonder) return 0;
    if (zaman.sessizMi(simdiMs == null ? saat() : simdiMs)) return 0;
    const r = q.ayar.get(userId);
    if (!r || !r.push) return 0;
    const liste = q.abonelikler.all(userId);
    let n = 0;
    const veri = JSON.stringify({ title: String(yuk.baslik || "Meberra").slice(0, 120), body: String(yuk.metin || "").slice(0, 300), link: linkTemiz(yuk.link) || "/", tag: yuk.tur || "meberra" });
    for (const a of liste) {
      try {
        await push.gonder({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, veri);
        q.aboneBasari.run(simdi(), a.id);
        n++;
      } catch (e) {
        const kod = e && (e.statusCode || e.status);
        if (kod === 404 || kod === 410) q.aboneSil.run(a.id);
        else if (gunluk) gunluk.uyari("push", "Push gönderilemedi" + (kod ? " (HTTP " + kod + ")" : ""), { hata: String((e && e.message) || e).slice(0, 500), status: kod || undefined, aboneId: a.id });
        else console.error("[push] gönderilemedi:", (e && e.message) || e);
      }
    }
    return n;
  }

  /**
   * Bildirim oluşturur. b: { tur, baslik, metin, link }. sec: { eposta: { konu, metin } | null, push: bool, simdiMs }
   * Dönüş: { id, push: Promise<number> } — push arka planda; testler bekleyebilir.
   */
  function olustur(userId, b, sec) {
    sec = sec || {};
    if (TURLER.indexOf(b.tur) < 0) throw new Error("Geçersiz bildirim türü: " + b.tur);
    const id = Number(q.ekle.run(userId, b.tur, String(b.baslik).slice(0, 160), b.metin == null ? null : String(b.metin).slice(0, 2000), linkTemiz(b.link), simdi()).lastInsertRowid);
    if (sec.eposta) {
      const u = q.kullanici.get(userId);
      if (u && u.eposta && u.durum === "aktif") eposta.gonder(u.eposta, sec.eposta.konu, sec.eposta.metin);
    }
    const p = sec.push ? pushGonder(userId, b, sec.simdiMs).catch(e => { if (gunluk) gunluk.hata("push", "Push gönderimi başarısız", { stack: e && e.stack, hata: String((e && e.message) || e) }); else console.error("[push]", e); return 0; }) : Promise.resolve(0);
    return { id, push: p };
  }

  return {
    TURLER, linkTemiz, olustur, pushGonder, ayarSatiri, ayarGenel, iptalLinki, onerilenSaat, etkinSaat,
    /** 1.16.0 oyun: GET /api/bildirim-ayarlari ek alanları { onerilenSaat, saatElle, etkinSaat } */
    saatBilgisi(userId) {
      const r = q.ayar.get(userId);
      return { onerilenSaat: onerilenSaat(userId), saatElle: !!(r && r.saat_elle), etkinSaat: r ? etkinSaat(r) : (onerilenSaat(userId) || config.hatirlatmaSaati) };
    },
    publicKey: push ? push.publicKey : null,

    liste(userId, once) {
      const o = Number.isInteger(+once) && +once > 0 ? +once : Number.MAX_SAFE_INTEGER;
      const satirlar = q.liste.all(userId, o, SAYFA + 1);
      return { bildirimler: satirlar.slice(0, SAYFA).map(genel), okunmamis: q.okunmamis.get(userId).n, dahaVar: satirlar.length > SAYFA };
    },
    okundu(userId, f) {
      f = f || {};
      const z = simdi();
      if (f.hepsi === true) q.okuHepsi.run(z, userId);
      else {
        if (!Array.isArray(f.ids) || !f.ids.length) throw new HttpHata(400, "ids (dizi) ya da hepsi:true gerekli.");
        f.ids.slice(0, 200).forEach(id => { if (Number.isInteger(+id)) q.okuTek.run(z, userId, +id); });
      }
      return q.okunmamis.get(userId).n;
    },
    okunmamis: userId => q.okunmamis.get(userId).n,

    ayarlar(userId) {
      const r = q.ayar.get(userId);
      const varsayilan = { eposta_hatirlatma: 0, push: 0, eposta_bildirim: 0, hatirlatma_saati: config.hatirlatmaSaati, veli_raporu: 0, veli_eposta: null, veli_dogrulandi: null };
      return Object.assign(ayarGenel(r || varsayilan), { pushAbonelik: q.aboneSay.get(userId).n });
    },
    /** Kısmi güncelleme. Veli e-postası değişirse veliye onay e-postası gider; rapor yalnızca onaydan sonra gönderilir. */
    ayarKaydet(u, f, req) {
      if (!f || typeof f !== "object" || Array.isArray(f)) throw new HttpHata(400, "Ayar nesnesi gerekli.");
      const r = ayarSatiri(u.id), e = {};
      const yeni = {
        eposta_hatirlatma: r.eposta_hatirlatma, push: r.push, eposta_bildirim: r.eposta_bildirim, hatirlatma_saati: r.hatirlatma_saati,
        veli_raporu: r.veli_raporu, veli_eposta: r.veli_eposta, veli_dogrulandi: r.veli_dogrulandi, veli_belirtec: r.veli_belirtec
      };
      [["epostaHatirlatma", "eposta_hatirlatma"], ["push", "push"], ["epostaBildirim", "eposta_bildirim"], ["veliRaporu", "veli_raporu"]].forEach(([a, s]) => {
        if (f[a] === undefined) return;
        if (!boolMu(f[a])) e[a] = "true ya da false olmalı.";
        else yeni[s] = evetMi(f[a]) ? 1 : 0;
      });
      if (f.hatirlatmaSaati !== undefined) {
        const s = +f.hatirlatmaSaati;
        if (!Number.isInteger(s) || s < 8 || s > 21) e.hatirlatmaSaati = "Saat 8 ile 21 arasında tam sayı olmalı (sessiz saatler 22:00–08:00).";
        else yeni.hatirlatma_saati = s;
      }
      let veliDegisti = false;
      if (f.veliEposta !== undefined) {
        const v = kirp(f.veliEposta).toLowerCase();
        if (v && (v.length > 120 || !EPOSTA_RE.test(v))) e.veliEposta = "Geçerli bir e-posta adresi yaz.";
        else if (v && u.eposta && v === String(u.eposta).toLowerCase()) e.veliEposta = "Veli e-postası kendi adresinden farklı olmalı.";
        else if ((v || null) !== (r.veli_eposta || null)) {
          veliDegisti = true;
          yeni.veli_eposta = v || null;
          yeni.veli_dogrulandi = null;
          yeni.veli_belirtec = v ? belirtec(24) : null;
        }
      }
      if (yeni.veli_raporu && !yeni.veli_eposta) e.veliEposta = "Haftalık veli raporu için veli e-postasını yaz.";
      if (Object.keys(e).length) throw new HttpHata(400, "Lütfen işaretli alanları düzelt.", e);
      q.ayarYaz.run(yeni.eposta_hatirlatma, yeni.push, yeni.eposta_bildirim, yeni.hatirlatma_saati, yeni.veli_raporu, yeni.veli_eposta,
        yeni.veli_dogrulandi, yeni.veli_belirtec, simdi(), u.id);
      if (f.hatirlatmaSaati !== undefined) q.saatElle.run(u.id); // 1.16.0 oyun: saati öğrenci seçti → önerilen saat kullanılmaz
      if (veliDegisti && yeni.veli_eposta) {
        const tab = config.baseUrl + "/api/public/veli?t=" + encodeURIComponent(yeni.veli_belirtec);
        eposta.gonder(yeni.veli_eposta, "Meberra: haftalık çalışma raporu onayı",
          "Merhaba,\n\n" + u.ad + " " + u.soyad + ", Meberra'daki haftalık çalışma özetinin bu adrese gönderilmesini istedi.\n\n" +
          "Onaylıyorsanız bu bağlantıyı açın:\n" + tab + "&islem=onay\n\n" +
          "İstemiyorsanız hiçbir şey yapmanız gerekmez; onay olmadan rapor gönderilmez. Daha sonra raporları durdurmak için:\n" + tab + "&islem=iptal\n\nMeberra");
      }
      // Push kapatılınca kayıtlı abonelikler de silinir (tarayıcıya bir daha bildirim gitmez)
      if (!yeni.push && r.push) q.aboneSilHepsi.run(u.id);
      const degisen = Object.keys(f).filter(k => ["epostaHatirlatma", "push", "epostaBildirim", "hatirlatmaSaati", "veliRaporu", "veliEposta"].indexOf(k) >= 0);
      denetim({ eylem: "bildirim.ayar", kullanici: u.id, istek: req, ayrinti: { alanlar: degisen, veliEpostaDegisti: veliDegisti } });
      return this.ayarlar(u.id);
    },

    /** Tek tıkla iptal (e-postadaki bağlantı). tur: hatirlatma | yanit | hepsi. Dönüş: yapılan işlemin metni ya da null */
    tekTikIptal(tok, tur) {
      const r = tok ? q.iptalBelirtec.get(String(tok)) : null;
      if (!r) return null;
      const yeni = { h: r.eposta_hatirlatma, b: r.eposta_bildirim };
      if (tur === "hatirlatma" || tur === "hepsi") yeni.h = 0;
      if (tur === "yanit" || tur === "hepsi") yeni.b = 0;
      db.prepare("UPDATE notification_prefs SET eposta_hatirlatma = ?, eposta_bildirim = ?, guncelleme = ? WHERE user_id = ?").run(yeni.h, yeni.b, simdi(), r.user_id);
      denetim({ eylem: "bildirim.tek-tik-iptal", kullanici: r.user_id, ayrinti: { tur } });
      return tur === "hatirlatma" ? "Günlük hatırlatma e-postaları durduruldu." : tur === "yanit" ? "Soru yanıtı e-postaları durduruldu." : "Meberra'dan gelen bildirim e-postaları durduruldu.";
    },
    /** Veli bağlantısı: islem onay | iptal */
    veliIslem(tok, islem) {
      const r = tok ? q.veliBelirtec.get(String(tok)) : null;
      if (!r || !r.veli_eposta) return null;
      if (islem === "onay") {
        db.prepare("UPDATE notification_prefs SET veli_dogrulandi = ?, guncelleme = ? WHERE user_id = ?").run(simdi(), simdi(), r.user_id);
        denetim({ eylem: "bildirim.veli-onay", kullanici: r.user_id });
        return "Teşekkürler! Haftalık çalışma özeti her pazar akşamı bu adrese gönderilecek. İstediğiniz zaman e-postadaki bağlantıyla durdurabilirsiniz.";
      }
      if (islem === "iptal") {
        db.prepare("UPDATE notification_prefs SET veli_raporu = 0, veli_dogrulandi = NULL, guncelleme = ? WHERE user_id = ?").run(simdi(), r.user_id);
        denetim({ eylem: "bildirim.veli-iptal", kullanici: r.user_id });
        return "Haftalık çalışma özeti durduruldu. Bu adrese artık rapor gönderilmeyecek.";
      }
      return null;
    },

    // --- push abonelikleri ---------------------------------------------------------
    abone(u, s, req) {
      const e = s && typeof s === "object" ? s : null;
      const ep = e && String(e.endpoint || ""), k = e && e.keys && typeof e.keys === "object" ? e.keys : {};
      if (!ep || ep.length > 1000 || !/^https:\/\/[^\s]+$/.test(ep)) throw new HttpHata(400, "Geçersiz abonelik: endpoint https adresi olmalı.");
      const p256dh = String(k.p256dh || ""), auth = String(k.auth || "");
      if (!/^[A-Za-z0-9_=-]{20,200}$/.test(p256dh) || !/^[A-Za-z0-9_=-]{8,100}$/.test(auth)) throw new HttpHata(400, "Geçersiz abonelik anahtarları.");
      if (q.aboneSay.get(u.id).n >= 10 && !db.prepare("SELECT 1 FROM push_subscriptions WHERE endpoint = ? AND user_id = ?").get(ep, u.id))
        throw new HttpHata(409, "En fazla 10 cihazda bildirim açılabilir. Eski bir cihazda bildirimleri kapat.");
      ayarSatiri(u.id);
      q.aboneYaz.run(u.id, ep, p256dh, auth, req ? String(req.headers["user-agent"] || "").slice(0, 200) : null, simdi());
      // Tarayıcı izni + abonelik açık rızadır: push tercihi açılır
      db.prepare("UPDATE notification_prefs SET push = 1, guncelleme = ? WHERE user_id = ?").run(simdi(), u.id);
      denetim({ eylem: "push.abone", kullanici: u.id, istek: req });
      return q.aboneSay.get(u.id).n;
    },
    /** endpoint verilirse o cihaz; verilmezse tüm cihazlar. Hiç abonelik kalmazsa push tercihi kapanır. */
    iptal(u, endpoint, req) {
      if (endpoint) q.aboneSilEndpoint.run(u.id, String(endpoint));
      else q.aboneSilHepsi.run(u.id);
      const n = q.aboneSay.get(u.id).n;
      if (!n) db.prepare("UPDATE notification_prefs SET push = 0, guncelleme = ? WHERE user_id = ?").run(simdi(), u.id);
      denetim({ eylem: "push.iptal", kullanici: u.id, istek: req, ayrinti: { kalan: n } });
      return n;
    }
  };
}

module.exports = { bildirimServisi, linkTemiz, TURLER };
