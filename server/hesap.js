"use strict";
// Hesap, oturum, profil, üyelik (Premium) ve KVKK işlemleri. HTTP'den bağımsız; rotalar bunu çağırır.
const config = require("./config");
const { islem, simdi } = require("./db");
const { sifreOzetle, sifreDogrula, belirtec, ozet, publicId } = require("./guvenlik");
const { HttpHata } = require("./http");

const EPOSTA_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[A-Za-z]{2,}$/;
const GUN = 864e5;
const tarihEkle = (iso, gun) => new Date(Date.parse(iso) + gun * GUN).toISOString();
const kirp = s => String(s == null ? "" : s).trim().replace(/\s+/g, " ");

function sifreKurali(sifre, sifre2, e, alan, alan2) {
  if (!sifre || String(sifre).length < 8) e[alan] = "Şifre en az 8 karakter olmalı.";
  else if (String(sifre).length > 128) e[alan] = "Şifre en fazla 128 karakter olabilir.";
  else if (sifre !== sifre2) e[alan2] = "Şifreler eşleşmiyor.";
}

function hesapServisi(db, denetim, eposta) {
  const q = {
    kullaniciId: db.prepare("SELECT * FROM users WHERE id = ?"),
    kullaniciKimlik: db.prepare("SELECT * FROM users WHERE (eposta = ? OR kullanici_adi = ?) AND durum != 'silindi'"),
    kullaniciEposta: db.prepare("SELECT * FROM users WHERE eposta = ?"),
    kullaniciEkle: db.prepare(`INSERT INTO users (public_id, eposta, kullanici_adi, ad, soyad, sifre_hash, rol, kvkk_onay, kosul_onay, veli_onay, olusturma, guncelleme)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
    sonGiris: db.prepare("UPDATE users SET son_giris = ? WHERE id = ?"),
    sifreGuncelle: db.prepare("UPDATE users SET sifre_hash = ?, guncelleme = ? WHERE id = ?"),
    profil: db.prepare("SELECT veri FROM profiles WHERE user_id = ?"),
    profilYaz: db.prepare(`INSERT INTO profiles (user_id, ogrenci_modeli, sinif, ulkeler, okul, tamamlandi, veri, guncelleme) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET ogrenci_modeli = excluded.ogrenci_modeli, sinif = excluded.sinif, ulkeler = excluded.ulkeler,
      okul = excluded.okul, tamamlandi = excluded.tamamlandi, veri = excluded.veri, guncelleme = excluded.guncelleme`),
    oturumEkle: db.prepare("INSERT INTO sessions (user_id, token_hash, olusturma, son_kullanim, bitis, ip, tarayici) VALUES (?, ?, ?, ?, ?, ?, ?)"),
    oturumBul: db.prepare("SELECT s.id AS sid, s.son_kullanim, s.bitis, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.iptal IS NULL"),
    oturumUzat: db.prepare("UPDATE sessions SET son_kullanim = ?, bitis = ? WHERE id = ?"),
    oturumIptal: db.prepare("UPDATE sessions SET iptal = ? WHERE token_hash = ?"),
    oturumlariIptal: db.prepare("UPDATE sessions SET iptal = ? WHERE user_id = ? AND iptal IS NULL"),
    resetEkle: db.prepare("INSERT INTO password_resets (user_id, token_hash, olusturma, bitis, ip) VALUES (?, ?, ?, ?, ?)"),
    resetBul: db.prepare("SELECT * FROM password_resets WHERE token_hash = ? AND kullanildi IS NULL"),
    resetKullan: db.prepare("UPDATE password_resets SET kullanildi = ? WHERE id = ?"),
    aktifAbonelik: db.prepare("SELECT * FROM subscriptions WHERE user_id = ? AND durum = 'aktif' AND bitis > ? ORDER BY bitis DESC LIMIT 1"),
    bekleyenTalep: db.prepare("SELECT id, plan, olusturma FROM upgrade_requests WHERE user_id = ? AND durum = 'bekliyor' ORDER BY id DESC LIMIT 1"),
    talepler: db.prepare("SELECT id, plan, tutar_tl, odeyen_ad, aciklama, durum, olusturma, islem_zamani, islem_notu FROM upgrade_requests WHERE user_id = ? ORDER BY id DESC"),
    talepEkle: db.prepare("INSERT INTO upgrade_requests (user_id, plan, tutar_tl, odeyen_ad, aciklama, olusturma) VALUES (?, ?, ?, ?, ?, ?)"),
    abonelikEkle: db.prepare(`INSERT INTO subscriptions (user_id, plan, baslangic, bitis, kaynak, tutar_tl, talep_id, not_, olusturan, olusturma)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  };

  function genel(u) {
    return { id: u.public_id, ad: u.ad, soyad: u.soyad, kullaniciAdi: u.kullanici_adi, eposta: u.eposta, rol: u.rol, olusturma: u.olusturma };
  }
  function profilAl(userId) {
    const r = q.profil.get(userId);
    if (!r) return null;
    try { return JSON.parse(r.veri); } catch (e) { return null; }
  }
  function uyelik(userId) {
    const a = q.aktifAbonelik.get(userId, simdi());
    const t = q.bekleyenTalep.get(userId);
    return { premium: !!a, plan: a ? a.plan : null, bitis: a ? a.bitis : null, bekleyenTalep: t ? { id: t.id, plan: t.plan, olusturma: t.olusturma } : null };
  }

  function oturumAc(userId, req) {
    const tok = belirtec(32), z = simdi();
    q.oturumEkle.run(userId, ozet(tok), z, z, tarihEkle(z, config.oturumGun), req ? req.ip : null, req ? String(req.headers["user-agent"] || "").slice(0, 300) : null);
    q.sonGiris.run(z, userId);
    return { belirtec: tok, sureSn: config.oturumGun * 86400 };
  }

  return {
    genel, profilAl, uyelik,

    kayit(f, req) {
      f = f || {};
      const ad = kirp(f.ad), soyad = kirp(f.soyad), ep = kirp(f.eposta).toLowerCase(), e = {};
      if (!ad) e.ad = "Adını yaz."; else if (ad.length > 40) e.ad = "Ad en fazla 40 karakter olabilir.";
      if (!soyad) e.soyad = "Soyadını yaz."; else if (soyad.length > 40) e.soyad = "Soyad en fazla 40 karakter olabilir.";
      if (!ep) e.eposta = "E-posta adresini yaz."; else if (ep.length > 120 || !EPOSTA_RE.test(ep)) e.eposta = "Geçerli bir e-posta adresi yaz.";
      sifreKurali(f.sifre, f.sifre2, e, "sifre", "sifre2");
      if (f.kosullar !== true) e.kosullar = "Devam etmek için kullanım koşullarını kabul et.";
      if (f.kvkk !== true) e.kvkk = "Devam etmek için KVKK aydınlatma metnini okuduğunu onayla.";
      if (!e.eposta && q.kullaniciEposta.get(ep)) e.eposta = "Bu e-posta ile kayıtlı bir hesap var. Giriş yap ya da şifreni sıfırla.";
      if (Object.keys(e).length) throw new HttpHata(400, "Lütfen işaretli alanları düzelt.", e);
      const z = simdi();
      const id = Number(q.kullaniciEkle.run(publicId(), ep, ep, ad, soyad, sifreOzetle(f.sifre), "ogrenci", z, z, f.veliOnay ? 1 : 0, z, z).lastInsertRowid);
      denetim({ eylem: "auth.kayit", kullanici: id, istek: req, ayrinti: { veliOnay: !!f.veliOnay } });
      return { kullanici: q.kullaniciId.get(id), oturum: oturumAc(id, req) };
    },

    giris(kimlik, sifre, req) {
      const k = kirp(kimlik).toLowerCase();
      const u = k ? q.kullaniciKimlik.get(k, k) : null;
      const dogru = sifreDogrula(String(sifre || ""), u ? u.sifre_hash : null);
      if (!u || !dogru) {
        denetim({ eylem: "auth.giris-basarisiz", kullanici: u ? u.id : null, istek: req, ayrinti: { kimlik: k.slice(0, 120) } });
        throw new HttpHata(401, "E-posta veya şifre hatalı.");
      }
      if (u.durum !== "aktif") {
        denetim({ eylem: "auth.giris-engellendi", kullanici: u.id, istek: req });
        throw new HttpHata(403, "Hesabın askıya alınmış. Destek için bize yaz: " + config.urun.destekEposta);
      }
      denetim({ eylem: "auth.giris", kullanici: u.id, istek: req });
      return { kullanici: u, oturum: oturumAc(u.id, req) };
    },

    /** Çerezdeki belirteçten kullanıcı (yoksa null). Oturum kayar: günde bir kez süresi uzar. */
    oturumKullanici(tok) {
      if (!tok) return null;
      const r = q.oturumBul.get(ozet(tok));
      if (!r) return null;
      const z = simdi();
      if (r.bitis <= z || r.durum !== "aktif") return null;
      if (Date.parse(z) - Date.parse(r.son_kullanim) > GUN) q.oturumUzat.run(z, tarihEkle(z, config.oturumGun), r.sid);
      return r;
    },
    cikis(tok, kullanici, req) {
      if (tok) q.oturumIptal.run(simdi(), ozet(tok));
      if (kullanici) denetim({ eylem: "auth.cikis", kullanici: kullanici.id, istek: req });
    },

    profilKaydet(u, profil, req) {
      if (!profil || typeof profil !== "object" || Array.isArray(profil)) throw new HttpHata(400, "Geçersiz profil.");
      const veri = JSON.stringify(profil);
      if (veri.length > 20000) throw new HttpHata(413, "Profil çok büyük.");
      const ulkeler = Array.isArray(profil.ulkeler) ? profil.ulkeler.filter(x => /^[a-z]{2}$/.test(x)).slice(0, 15) : [];
      const eski = profilAl(u.id);
      q.profilYaz.run(u.id, kirp(profil.ogrenciModeli).slice(0, 20) || null, kirp(profil.sinif).slice(0, 20) || null, ulkeler.join(","),
        kirp(profil.okul).slice(0, 100) || null, profil.tamamlandi ? 1 : 0, veri, simdi());
      const degisen = Object.keys(Object.assign({}, eski || {}, profil)).filter(k => k !== "guncelleme" && JSON.stringify((eski || {})[k]) !== JSON.stringify(profil[k]));
      denetim({ eylem: eski ? "profil.guncelle" : "profil.olustur", kullanici: u.id, istek: req, ayrinti: { alanlar: degisen.slice(0, 30) } });
      return profil;
    },

    sifreDegistir(u, f, req) {
      const e = {};
      if (!sifreDogrula(String(f.eski || ""), u.sifre_hash)) e.eski = "Mevcut şifre hatalı.";
      sifreKurali(f.yeni, f.yeni2, e, "sifre", "sifre2");
      if (Object.keys(e).length) throw new HttpHata(400, "Şifre değiştirilemedi.", e);
      q.sifreGuncelle.run(sifreOzetle(f.yeni), simdi(), u.id);
      denetim({ eylem: "auth.sifre-degisti", kullanici: u.id, istek: req });
    },

    sifreUnuttum(epostaAdresi, req) {
      const ep = kirp(epostaAdresi).toLowerCase();
      const u = EPOSTA_RE.test(ep) ? q.kullaniciEposta.get(ep) : null;
      if (!u || u.durum !== "aktif") { denetim({ eylem: "auth.sifre-sifirlama-istek-bilinmeyen", istek: req, ayrinti: { eposta: ep.slice(0, 120) } }); return; }
      const tok = belirtec(32), z = simdi();
      q.resetEkle.run(u.id, ozet(tok), z, tarihEkle(z, 1 / 24), req ? req.ip : null);
      const link = config.baseUrl + "/sifre-sifirla.html?t=" + encodeURIComponent(tok);
      eposta.gonder(u.eposta, "Meberra şifre sıfırlama", "Merhaba " + u.ad + ",\n\nŞifreni sıfırlamak için bu bağlantıyı aç (1 saat geçerli):\n" + link +
        "\n\nBu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; şifren değişmez.\n\nMeberra");
      denetim({ eylem: "auth.sifre-sifirlama-istek", kullanici: u.id, istek: req });
    },

    sifreSifirla(tok, yeni, yeni2, req) {
      const e = {};
      sifreKurali(yeni, yeni2, e, "sifre", "sifre2");
      const r = tok ? q.resetBul.get(ozet(tok)) : null;
      if (!r || r.bitis <= simdi()) throw new HttpHata(400, "Bağlantının süresi dolmuş ya da geçersiz. Yeniden şifre sıfırlama iste.");
      if (Object.keys(e).length) throw new HttpHata(400, "Şifre kaydedilemedi.", e);
      islem(db, () => {
        q.resetKullan.run(simdi(), r.id);
        q.sifreGuncelle.run(sifreOzetle(yeni), simdi(), r.user_id);
        q.oturumlariIptal.run(simdi(), r.user_id);
      });
      denetim({ eylem: "auth.sifre-sifirlandi", kullanici: r.user_id, istek: req });
    },

    // --- Premium ---------------------------------------------------------
    talepler(u) { return q.talepler.all(u.id); },
    talepOlustur(u, f, req) {
      const plan = config.plan(f && f.plan);
      const odeyen = kirp(f && f.odeyenAd), aciklama = kirp(f && f.aciklama).slice(0, 500), e = {};
      if (!plan) e.plan = "Bir plan seç.";
      if (!odeyen) e.odeyenAd = "Ödemeyi yapan kişinin adını yaz."; else if (odeyen.length > 100) e.odeyenAd = "En fazla 100 karakter.";
      if (Object.keys(e).length) throw new HttpHata(400, "Lütfen işaretli alanları düzelt.", e);
      if (q.bekleyenTalep.get(u.id)) throw new HttpHata(409, "Zaten onay bekleyen bir ödeme bildirimin var. Onaylandığında Premium otomatik açılır.");
      const id = Number(q.talepEkle.run(u.id, plan.id, plan.fiyat, odeyen, aciklama || null, simdi()).lastInsertRowid);
      denetim({ eylem: "premium.talep", kullanici: u.id, istek: req, varlik: "upgrade_requests", varlikId: id, ayrinti: { plan: plan.id, tutar: plan.fiyat } });
      return { id, plan: plan.id, tutar: plan.fiyat, durum: "bekliyor" };
    },

    /** Premium dönemi ekler: mevcut aktif dönemin sonundan (yoksa şimdiden) itibaren. */
    premiumVer(userId, plan, gun, ek) {
      const p = config.plan(plan);
      const sure = gun && +gun > 0 ? Math.min(3650, Math.floor(+gun)) : (p ? p.gun : 30);
      const z = simdi();
      const a = q.aktifAbonelik.get(userId, z);
      const bas = a ? a.bitis : z;
      const id = Number(q.abonelikEkle.run(userId, p ? p.id : "ozel", bas, tarihEkle(bas, sure), ek.kaynak || "elle", ek.tutar != null ? ek.tutar : null,
        ek.talepId || null, ek.not || null, ek.yapan || null, z).lastInsertRowid);
      return { id, baslangic: bas, bitis: tarihEkle(bas, sure), gun: sure };
    },

    // --- KVKK ---------------------------------------------------------------
    disaAktar(u) {
      const tablo = (sql) => db.prepare(sql).all(u.id);
      return {
        olusturma: simdi(),
        kullanici: genel(u),
        onaylar: { kvkk: u.kvkk_onay, kosullar: u.kosul_onay, veli: !!u.veli_onay },
        profil: profilAl(u.id),
        uyelik: uyelik(u.id),
        abonelikler: tablo("SELECT plan, baslangic, bitis, durum, kaynak, tutar_tl FROM subscriptions WHERE user_id = ?"),
        odemeBildirimleri: tablo("SELECT plan, tutar_tl, odeyen_ad, aciklama, durum, olusturma FROM upgrade_requests WHERE user_id = ?"),
        cevaplar: tablo("SELECT sayfa, unite, soru, secim, dogru, zaman FROM answers WHERE user_id = ? ORDER BY zaman"),
        yanlislar: tablo("SELECT sayfa, soru, konu, hata_etiketi, ilk_yanlis, son_yanlis, yanlis_sayisi, cozuldu FROM wrong_answers WHERE user_id = ?"),
        denemeler: tablo("SELECT kod, ad, tarih, soru_sayisi, dogru, yanlis, bos, yuzde, sure_sn FROM exams WHERE user_id = ?"),
        seviyeTestleri: tablo("SELECT tarih, veri FROM level_tests WHERE user_id = ?"),
        tarayiciVerisi: tablo("SELECT anahtar, guncelleme FROM user_state WHERE user_id = ?"),
        oturumlar: tablo("SELECT olusturma, son_kullanim, ip, tarayici FROM sessions WHERE user_id = ?"),
        denetimKaydi: tablo("SELECT zaman, eylem, ip FROM audit_log WHERE user_id = ? ORDER BY zaman")
      };
    },
    hesapSil(u, sifre, req) {
      if (!sifreDogrula(String(sifre || ""), u.sifre_hash)) throw new HttpHata(400, "Şifre hatalı.", { sifre: "Şifre hatalı." });
      islem(db, () => {
        ["profiles", "user_state", "answers", "wrong_answers", "exams", "level_tests", "sessions", "password_resets"].forEach(t => db.prepare("DELETE FROM " + t + " WHERE user_id = ?").run(u.id));
        // Muhasebe kayıtları (abonelik, ödeme bildirimi) yasal saklama için kalır; kişisel alanlar anonimleştirilir
        db.prepare("UPDATE upgrade_requests SET odeyen_ad = 'silindi', aciklama = NULL WHERE user_id = ?").run(u.id);
        db.prepare(`UPDATE users SET eposta = NULL, kullanici_adi = ?, ad = 'Silinmiş', soyad = 'Kullanıcı', sifre_hash = '!', durum = 'silindi', guncelleme = ? WHERE id = ?`)
          .run("silindi-" + u.id, simdi(), u.id);
      });
      denetim({ eylem: "hesap.silindi", kullanici: u.id, istek: req });
    },

    /** İlk çalıştırmada yönetici hesabı (ADMIN_EPOSTA + ADMIN_SIFRE) ya da var olanı yöneticiye yükseltme */
    yoneticiHazirla(epostaAdresi, sifre) {
      const ep = kirp(epostaAdresi).toLowerCase();
      if (!EPOSTA_RE.test(ep)) throw new Error("Geçerli bir e-posta gerekli.");
      const u = q.kullaniciEposta.get(ep);
      if (u) {
        db.prepare("UPDATE users SET rol = 'yonetici', durum = 'aktif', guncelleme = ? WHERE id = ?").run(simdi(), u.id);
        if (sifre) q.sifreGuncelle.run(sifreOzetle(sifre), simdi(), u.id);
        denetim({ eylem: "yonetici.yukseltildi", kullanici: u.id, ayrinti: { kaynak: "cli/ortam" } });
        return { yeni: false, id: u.id };
      }
      if (!sifre || String(sifre).length < 8) throw new Error("Yönetici şifresi en az 8 karakter olmalı.");
      const z = simdi();
      const id = Number(q.kullaniciEkle.run(publicId(), ep, ep, "Yönetici", "Meberra", sifreOzetle(sifre), "yonetici", z, z, 0, z, z).lastInsertRowid);
      q.profilYaz.run(id, "lise", "11", "de", null, 1, JSON.stringify({ ogrenciModeli: "lise", sinif: "11", ulkeler: ["de"], egitimDili: "en", tamamlandi: true, aktifRota: "de", hedefAlan: "Mühendislik", okulSehir: "İstanbul", guncelleme: z }), z);
      denetim({ eylem: "yonetici.olusturuldu", kullanici: id, ayrinti: { kaynak: "cli/ortam" } });
      return { yeni: true, id };
    }
  };
}

module.exports = { hesapServisi, EPOSTA_RE };
