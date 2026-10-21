"use strict";
// Hesap, oturum, profil, üyelik (Premium) ve KVKK işlemleri. HTTP'den bağımsız; rotalar bunu çağırır.
const config = require("./config");
const { islem, simdi } = require("./db");
const { sifreOzetle, sifreDogrula, belirtec, ozet, publicId } = require("./guvenlik");
const { HttpHata } = require("./http");
const zaman = require("./zaman");

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
    sonGiris: db.prepare("UPDATE users SET son_giris = ?, son_giris_ip = ? WHERE id = ?"),
    girisSay: db.prepare(`INSERT INTO giris_sayilari (user_id, gun, adet, basarisiz) VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, gun) DO UPDATE SET adet = adet + excluded.adet, basarisiz = basarisiz + excluded.basarisiz`),
    oturumEngel: db.prepare(`SELECT u.id, u.durum, u.engel_zamani, u.engel_bitis FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND u.durum = 'askida' AND u.engel_zamani IS NOT NULL`),
    engelKaldir: db.prepare(`UPDATE users SET durum = 'aktif', engel_zamani = NULL, engel_bitis = NULL, engel_nedeni = NULL, engelleyen = NULL, guncelleme = ?
      WHERE id = ? AND durum = 'askida'`),
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
    digerOturumlariIptal: db.prepare("UPDATE sessions SET iptal = ? WHERE user_id = ? AND iptal IS NULL AND id != ?"),
    resetleriIptal: db.prepare("UPDATE password_resets SET kullanildi = ? WHERE user_id = ? AND kullanildi IS NULL"),
    resetEkle: db.prepare("INSERT INTO password_resets (user_id, token_hash, olusturma, bitis, ip) VALUES (?, ?, ?, ?, ?)"),
    resetBul: db.prepare("SELECT * FROM password_resets WHERE token_hash = ? AND kullanildi IS NULL"),
    resetKullan: db.prepare("UPDATE password_resets SET kullanildi = ? WHERE id = ?"),
    aktifAbonelik: db.prepare("SELECT * FROM subscriptions WHERE user_id = ? AND durum = 'aktif' AND bitis > ? ORDER BY bitis DESC LIMIT 1"),
    bekleyenTalep: db.prepare("SELECT id, plan, olusturma FROM upgrade_requests WHERE user_id = ? AND durum = 'bekliyor' ORDER BY id DESC LIMIT 1"),
    talepler: db.prepare("SELECT id, plan, tutar_tl, odeyen_ad, aciklama, durum, olusturma, islem_zamani, islem_notu FROM upgrade_requests WHERE user_id = ? ORDER BY id DESC"),
    talepEkle: db.prepare("INSERT INTO upgrade_requests (user_id, plan, tutar_tl, odeyen_ad, aciklama, olusturma) VALUES (?, ?, ?, ?, ?, ?)"),
    talepIptal: db.prepare("UPDATE upgrade_requests SET durum = 'iptal', isleyen = ?, islem_zamani = ?, islem_notu = ? WHERE id = ? AND user_id = ? AND durum = 'bekliyor'"),
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
    q.sonGiris.run(z, req ? req.ip || null : null, userId);
    return { belirtec: tok, sureSn: config.oturumGun * 86400 };
  }
  /** Günlük giriş sayacı (İstanbul günü). basarili: true → adet, false → basarisiz */
  function girisSay(userId, basarili) {
    try { q.girisSay.run(userId, zaman.gun(Date.now()), basarili ? 1 : 0, basarili ? 0 : 1); } catch (e) { /* sayaç girişi bozmaz */ }
  }
  /** Engel etkin mi? Süreli engelin süresi dolmuşsa engeli kaldırır (denetim kaydıyla) ve false döner. */
  function engelEtkin(u) {
    if (!u || u.durum !== "askida" || !u.engel_zamani) return false;
    if (u.engel_bitis && u.engel_bitis <= simdi()) {
      if (Number(q.engelKaldir.run(simdi(), u.id).changes)) denetim({ eylem: "hesap.engel-sona-erdi", kullanici: u.id, ayrinti: { bitis: u.engel_bitis } });
      return false;
    }
    return true;
  }
  function engelMesaji(bitis) {
    return "Hesabın engellendi." + (bitis ? " Engel " + new Date(bitis).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "long", timeStyle: "short" }) +
      " tarihinde kalkacak." : "") + " Bir yanlışlık olduğunu düşünüyorsan bize yaz: " + config.urun.destekEposta;
  }

  return {
    genel, profilAl, uyelik, engelMesaji,
    /** Engellenmiş kullanıcının (oturumları kapatılmış) çerezi: { bitis } ya da null. API bunu 403'e çevirir. */
    oturumEngeli(tok) {
      if (!tok) return null;
      const u = q.oturumEngel.get(ozet(tok));
      if (!u) return null;
      const tam = q.kullaniciId.get(u.id);
      return engelEtkin(tam) ? { bitis: tam.engel_bitis || null } : null;
    },
    /** sure: "suresiz" | "1g" | "7g" | "30g". Tüm oturumlar kapanır. */
    engelle(u, b, yapan, req) {
      const SURE = { suresiz: null, "1g": 1, "7g": 7, "30g": 30 };
      b = b || {};
      const neden = kirp(b.neden).slice(0, 300);
      if (!neden) throw new HttpHata(400, "Engelleme nedenini yaz.", { neden: "Neden gerekli (yalnızca yöneticiler görür)." });
      if (!Object.prototype.hasOwnProperty.call(SURE, b.sure || "suresiz")) throw new HttpHata(400, "Süre suresiz, 1g, 7g ya da 30g olmalı.", { sure: "Geçersiz süre." });
      if (u.durum === "silindi") throw new HttpHata(409, "Silinmiş hesap engellenemez.");
      if (yapan && u.id === yapan.id) throw new HttpHata(400, "Kendi hesabını engelleyemezsin.");
      const gun = SURE[b.sure || "suresiz"], z = simdi(), bitis = gun ? tarihEkle(z, gun) : null;
      let kapanan = 0;
      islem(db, () => {
        db.prepare("UPDATE users SET durum = 'askida', engel_zamani = ?, engel_bitis = ?, engel_nedeni = ?, engelleyen = ?, guncelleme = ? WHERE id = ?")
          .run(z, bitis, neden, yapan ? yapan.id : null, z, u.id);
        kapanan = Number(q.oturumlariIptal.run(z, u.id).changes);
      });
      denetim({ eylem: "hesap.engellendi", kullanici: u.id, yapan: yapan ? yapan.id : null, istek: req, ayrinti: { neden, sure: b.sure || "suresiz", bitis, kapananOturum: kapanan } });
      return { durum: "askida", engel: { zaman: z, bitis, neden }, kapananOturum: kapanan };
    },
    engelKaldir(u, yapan, req) {
      const n = Number(q.engelKaldir.run(simdi(), u.id).changes);
      if (!n) throw new HttpHata(409, "Bu hesap engelli değil.");
      denetim({ eylem: "hesap.engel-kaldirildi", kullanici: u.id, yapan: yapan ? yapan.id : null, istek: req, ayrinti: { onceki: { neden: u.engel_nedeni, bitis: u.engel_bitis } } });
      return { durum: "aktif" };
    },

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
        if (u) girisSay(u.id, false);
        throw new HttpHata(401, "E-posta veya şifre hatalı.");
      }
      // Yönetici engeli (süreliyse ve süresi dolduysa burada kalkar)
      if (u.durum === "askida" && u.engel_zamani) {
        if (engelEtkin(u)) {
          denetim({ eylem: "auth.giris-engellendi", kullanici: u.id, istek: req, ayrinti: { engel: true } });
          throw new HttpHata(403, engelMesaji(u.engel_bitis), null, { engelli: true, engelBitis: u.engel_bitis || null });
        }
        u.durum = "aktif";
      }
      if (u.durum !== "aktif") {
        denetim({ eylem: "auth.giris-engellendi", kullanici: u.id, istek: req });
        throw new HttpHata(403, "Hesabın askıya alınmış. Destek için bize yaz: " + config.urun.destekEposta);
      }
      denetim({ eylem: "auth.giris", kullanici: u.id, istek: req });
      girisSay(u.id, true);
      return { kullanici: u, oturum: oturumAc(u.id, req) };
    },

    /** Çerezdeki belirteçten kullanıcı (yoksa null). Oturum kayar: günde bir kez süresi uzar; o zaman r.uzatildi işaretlenir
     *  ve çağıran çerezi yeni Max-Age ile yeniden yazar (yoksa tarayıcı çerezi ilk girişteki süreyle siler). */
    oturumKullanici(tok) {
      if (!tok) return null;
      const r = q.oturumBul.get(ozet(tok));
      if (!r) return null;
      const z = simdi();
      if (r.bitis <= z || r.durum !== "aktif") return null;
      if (Date.parse(z) - Date.parse(r.son_kullanim) > GUN) {
        q.oturumUzat.run(z, tarihEkle(z, config.oturumGun), r.sid);
        r.uzatildi = true;
      }
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
      // Şifre değişince bu oturum dışındaki tüm oturumlar ve açık sıfırlama bağlantıları geçersiz olur
      let kapanan = 0;
      islem(db, () => {
        const z = simdi();
        q.sifreGuncelle.run(sifreOzetle(f.yeni), z, u.id);
        kapanan = Number(q.digerOturumlariIptal.run(z, u.id, u.sid || 0).changes);
        q.resetleriIptal.run(z, u.id);
      });
      denetim({ eylem: "auth.sifre-degisti", kullanici: u.id, istek: req, ayrinti: { kapananOturum: kapanan } });
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
        q.resetleriIptal.run(simdi(), r.user_id); // aynı kullanıcının diğer açık bağlantıları da kapanır
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
      // Yöneticiye bildirim (ADMIN_EPOSTA tanımlıysa)
      if (config.yonetici.eposta) eposta.gonder(config.yonetici.eposta, "Yeni ödeme bildirimi: " + u.ad + " " + u.soyad + " · " + plan.ad,
        "Yeni Premium ödeme bildirimi\n\nÖğrenci: " + u.ad + " " + u.soyad + " <" + u.eposta + ">\nPlan: " + plan.ad + " · " + plan.fiyat + " TL\nÖdeyen: " + odeyen +
        (aciklama ? "\nNot: " + aciklama : "") + "\n\nDekontu kontrol edip onaylamak için: " + config.baseUrl + "/admin.html#talepler");
      return { id, plan: plan.id, tutar: plan.fiyat, durum: "bekliyor" };
    },
    /** Öğrenci kendi bekleyen ödeme bildirimini geri çeker (ör. yanlış plan seçtiyse). */
    talepIptal(u, req) {
      const t = q.bekleyenTalep.get(u.id);
      if (!t || Number(q.talepIptal.run(u.id, simdi(), "Öğrenci tarafından iptal edildi", t.id, u.id).changes) !== 1)
        throw new HttpHata(409, "İptal edilecek bekleyen bir ödeme bildirimin yok.");
      denetim({ eylem: "premium.talep-iptal", kullanici: u.id, istek: req, varlik: "upgrade_requests", varlikId: t.id, ayrinti: { plan: t.plan } });
      return { id: t.id, plan: t.plan, durum: "iptal" };
    },

    /** Premium açıldığında öğrenciye bilgi e-postası */
    premiumBildir(userId, bitis) {
      const u = q.kullaniciId.get(userId);
      if (!u || !u.eposta) return;
      eposta.gonder(u.eposta, "Meberra Premium hesabın açıldı", "Merhaba " + u.ad + ",\n\nÖdemen onaylandı; Premium hesabın açıldı. Bitiş tarihi: " +
        new Date(bitis).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" }) + ".\n\nTüm ünitelere ve sınırsız denemeye şimdi erişebilirsin: " + config.baseUrl + "/calis.html\n\nİyi çalışmalar,\nMeberra");
    },

    /** Premium dönemi ekler: mevcut aktif dönemin sonundan (yoksa şimdiden) itibaren. */
    premiumVer(userId, plan, gun, ek) {
      const p = config.plan(plan);
      // gun verildiyse 1..3650 arası tam sayı olmalı; verilmediyse plan süresi
      if (gun != null && !(Number.isInteger(+gun) && +gun >= 1 && +gun <= 3650)) throw new HttpHata(400, "Gün sayısı 1 ile 3650 arasında tam sayı olmalı.", { gun: "1–3650 arası tam sayı yaz." });
      if (gun == null && !p) throw new HttpHata(400, "Plan (aylik/yillik) ya da gün sayısı gerekli.");
      const sure = gun != null ? +gun : p.gun;
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
        erisim: { sonGiris: u.son_giris, sonGirisIp: u.son_giris_ip, sonGorulme: u.son_gorulme, sonIp: u.son_ip },
        girisSayilari: tablo("SELECT gun, adet, basarisiz FROM giris_sayilari WHERE user_id = ? ORDER BY gun"),
        profil: profilAl(u.id),
        uyelik: uyelik(u.id),
        abonelikler: tablo("SELECT plan, baslangic, bitis, durum, kaynak, tutar_tl FROM subscriptions WHERE user_id = ?"),
        odemeBildirimleri: tablo("SELECT plan, tutar_tl, odeyen_ad, aciklama, durum, olusturma FROM upgrade_requests WHERE user_id = ?"),
        cevaplar: tablo("SELECT sayfa, unite, soru, secim, dogru, zaman FROM answers WHERE user_id = ? ORDER BY zaman"),
        yanlislar: tablo("SELECT sayfa, soru, konu, hata_etiketi, ilk_yanlis, son_yanlis, yanlis_sayisi, cozuldu FROM wrong_answers WHERE user_id = ?"),
        denemeler: tablo("SELECT kod, ad, tarih, soru_sayisi, dogru, yanlis, bos, yuzde, sure_sn FROM exams WHERE user_id = ?"),
        seviyeTestleri: tablo("SELECT tarih, veri FROM level_tests WHERE user_id = ?"),
        tarayiciVerisi: tablo("SELECT anahtar, guncelleme FROM user_state WHERE user_id = ?"),
        oturumlar: tablo("SELECT olusturma, son_kullanim, son_gorulme, ip, son_ip, tarayici FROM sessions WHERE user_id = ?"),
        denetimKaydi: tablo("SELECT zaman, eylem, ip FROM audit_log WHERE user_id = ? ORDER BY zaman"),
        sorular: tablo("SELECT id, sayfa, soru_ref, metin, durum, olusturma FROM questions WHERE user_id = ? ORDER BY id"),
        soruMesajlari: tablo("SELECT m.question_id, m.rol, m.metin, m.tarih FROM question_messages m JOIN questions q ON q.id = m.question_id WHERE q.user_id = ? ORDER BY m.id"),
        bildirimler: tablo("SELECT tur, baslik, metin, link, okundu, olusturma FROM notifications WHERE user_id = ? ORDER BY id"),
        bildirimAyarlari: tablo("SELECT eposta_hatirlatma, push, eposta_bildirim, hatirlatma_saati, veli_raporu, veli_eposta, veli_dogrulandi FROM notification_prefs WHERE user_id = ?"),
        pushCihazlari: tablo("SELECT tarayici, olusturma, son_basari FROM push_subscriptions WHERE user_id = ?"),
        lig: tablo("SELECT takma_ad, kademe, durum, katilma FROM lig_uyeleri WHERE user_id = ?"),
        ligHaftalari: tablo("SELECT hafta, kademe, grup, xp, sonuc FROM lig_haftalik WHERE user_id = ? ORDER BY hafta")
      };
    },
    hesapSil(u, sifre, req) {
      if (!sifreDogrula(String(sifre || ""), u.sifre_hash)) throw new HttpHata(400, "Şifre hatalı.", { sifre: "Şifre hatalı." });
      const z = simdi(), ep = String(u.eposta || "").toLowerCase();
      islem(db, () => {
        ["profiles", "user_state", "state_tombstones", "answers", "wrong_answers", "exams", "level_tests", "sessions", "password_resets",
          "questions", "notifications", "notification_prefs", "push_subscriptions", "reminder_log", "lig_uyeleri", "lig_haftalik", "giris_sayilari"].forEach(t => db.prepare("DELETE FROM " + t + " WHERE user_id = ?").run(u.id));
        // Muhasebe kayıtları (abonelik, ödeme bildirimi) yasal saklama için kalır; kişisel alanlar anonimleştirilir.
        // Bekleyen bildirim iptal edilir (silinmiş hesaba Premium açılmasın), aktif dönem sonlandırılır.
        db.prepare("UPDATE upgrade_requests SET durum = 'iptal', islem_zamani = ?, islem_notu = 'Hesap silindi' WHERE user_id = ? AND durum = 'bekliyor'").run(z, u.id);
        db.prepare("UPDATE upgrade_requests SET odeyen_ad = 'silindi', aciklama = NULL WHERE user_id = ?").run(u.id);
        db.prepare("UPDATE subscriptions SET durum = 'iptal', iptal_zamani = ? WHERE user_id = ? AND durum = 'aktif' AND bitis > ?").run(z, u.id, z);
        // Denetim kaydı: satırlar kalır (kim ne yaptı); IP, tarayıcı ve ayrıntıdaki e-posta silinir
        db.prepare("UPDATE audit_log SET ip = NULL, tarayici = NULL WHERE user_id = ? OR yapan_id = ?").run(u.id, u.id);
        if (ep) {
          db.prepare("UPDATE audit_log SET ayrinti = REPLACE(ayrinti, ?, 'silindi') WHERE instr(ayrinti, ?) > 0").run(ep, ep);
          db.prepare("UPDATE audit_log SET ayrinti = NULL WHERE instr(lower(ayrinti), ?) > 0").run(ep); // harf büyüklüğü farklı kalanlar
          // Giden e-postalar: öğrenciye gidenler ve adını/adresini içeren yönetici bildirimleri (bağlantılar metinde)
          db.prepare("UPDATE email_outbox SET alici = 'silindi', konu = '[silinmiş kullanıcı]', metin = '[silindi]', html = NULL WHERE lower(alici) = ? OR instr(lower(metin), ?) > 0")
            .run(ep, "<" + ep + ">");
        }
        db.prepare(`UPDATE users SET eposta = NULL, kullanici_adi = ?, ad = 'Silinmiş', soyad = 'Kullanıcı', sifre_hash = '!', durum = 'silindi', guncelleme = ?,
          son_ip = NULL, son_giris_ip = NULL, son_gorulme = NULL, engel_nedeni = NULL WHERE id = ?`)
          .run("silindi-" + u.id, z, u.id);
      });
      denetim({ eylem: "hesap.silindi", kullanici: u.id }); // istek verilmez: IP/tarayıcı yazılmaz
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
