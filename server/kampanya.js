"use strict";
// 1.6.0 Büyüme: 7 günlük ücretsiz Premium denemesi, indirim kodları (kupon), davet programı, ölçüm tercihi.
// Hesap servisine (hesap.js) dokunmadan bağlanır: kayit / profilKaydet / talepOlustur / premiumVer / hesapSil / disaAktar
// sarmalanır; rota sonrası kancalar (seviye testi, ilk soru, soru sorma, demo soru) sunucu tarafı olay yazar.
const crypto = require("crypto");
const config = require("./config");
const { islem, simdi } = require("./db");
const { HttpHata } = require("./http");
const { hizSinirlayici } = require("./guvenlik");
const zaman = require("./zaman");

const GUN = 864e5;
const DENEME_GUN = 7;
const DAVET_ODUL_GUN = 7;
const DAVET_YILLIK_SINIR = 10;
const AYNI_IP_SAAT = 24;
const KOD_RE = /^[A-Z0-9_-]{3,30}$/;
const DAVET_RE = /^[A-Z2-9]{6,12}$/;
const DAVET_ALFABE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // karışan harfler (0/O, 1/I) yok
const kirp = s => String(s == null ? "" : s).trim().replace(/\s+/g, " ");
/** Kod normalleştirme: Türkçe klavyedeki İ/ı → I (ekim25 / EKİM25 / EKIM25 aynı kod) */
const kodNorm = s => kirp(s).replace(/[İıi]/g, "I").toUpperCase();
const tarihEkle = (iso, gun) => new Date(Date.parse(iso) + gun * GUN).toISOString();
const yuvarla = n => Math.round(n * 100) / 100;
const trTarih = iso => new Date(iso).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long" });

/** E-posta karması: HMAC-SHA256 (sunucu tuzu). Hesap silindikten sonra da deneme/davet tekrarını tanımak için saklanır. */
function epostaHash(ep) {
  const tuz = process.env.BUYUME_TUZ || "meberra-buyume-v1";
  return crypto.createHmac("sha256", tuz).update(String(ep || "").trim().toLowerCase()).digest("hex");
}

/** Kupon fiyat hesabı (saf): { indirim, tutar } */
function kuponFiyat(k, fiyat) {
  const indirim = k.tur === "yuzde" ? yuvarla(fiyat * Math.min(100, k.deger) / 100) : Math.min(k.deger, fiyat);
  return { liste: fiyat, indirim: yuvarla(indirim), tutar: yuvarla(Math.max(0, fiyat - indirim)) };
}

function kampanyaServisi(c) {
  const { db, hesap, bildirim, huni, denetim, gunluk } = c;
  const q = {
    kullanici: db.prepare("SELECT * FROM users WHERE id = ?"),
    bk: db.prepare("SELECT * FROM buyume_kullanici WHERE user_id = ?"),
    bkKod: db.prepare("SELECT b.*, u.durum, u.eposta, u.rol FROM buyume_kullanici b JOIN users u ON u.id = b.user_id WHERE b.davet_kodu = ?"),
    bkEkle: db.prepare("INSERT OR IGNORE INTO buyume_kullanici (user_id, davet_kodu, olcum_kapali, guncelleme) VALUES (?, ?, 0, ?)"),
    denemeUser: db.prepare("SELECT * FROM premium_denemeleri WHERE user_id = ?"),
    denemeHash: db.prepare("SELECT * FROM premium_denemeleri WHERE eposta_hash = ?"),
    kupon: db.prepare("SELECT * FROM kuponlar WHERE kod = ?"),
    kuponId: db.prepare("SELECT * FROM kuponlar WHERE id = ?"),
    kuponKullanilan: db.prepare(`SELECT (SELECT COUNT(*) FROM kupon_kullanimlari WHERE kupon_id = ?) +
      (SELECT COUNT(*) FROM upgrade_requests WHERE kupon_id = ? AND durum = 'bekliyor') AS n`),
    kuponKisi: db.prepare(`SELECT (SELECT COUNT(*) FROM kupon_kullanimlari WHERE kupon_id = ? AND user_id = ?) +
      (SELECT COUNT(*) FROM upgrade_requests WHERE kupon_id = ? AND user_id = ? AND durum = 'bekliyor') AS n`),
    davetEdilen: db.prepare("SELECT * FROM davetler WHERE davet_edilen = ?"),
    seviyeVar: db.prepare("SELECT 1 FROM soru_oturumlari WHERE user_id = ? AND tur = 'seviye' AND teslim IS NOT NULL LIMIT 1")
  };

  // ---- yardımcılar ---------------------------------------------------------------------------------------
  function yeniDavetKodu() {
    for (let i = 0; i < 20; i++) {
      const b = crypto.randomBytes(8);
      let s = "";
      for (let j = 0; j < 8; j++) s += DAVET_ALFABE[b[j] % DAVET_ALFABE.length];
      if (!db.prepare("SELECT 1 FROM buyume_kullanici WHERE davet_kodu = ?").get(s)) return s;
    }
    throw new Error("Davet kodu üretilemedi.");
  }
  function bkSatiri(uid) {
    let r = q.bk.get(uid);
    if (!r) { q.bkEkle.run(uid, yeniDavetKodu(), simdi()); r = q.bk.get(uid); }
    return r;
  }
  const anonOf = req => (req && req.cerezler && req.cerezler.mb_anon) || null;
  function olay(ad, uid, req, ozellikler) {
    try { huni.kaydet(ad, { userId: uid, anonId: anonOf(req), ozellikler, sayfa: req && req.headers && req.headers.referer ? (() => { try { return new URL(req.headers.referer).pathname; } catch (e) { return null; } })() : null }); }
    catch (e) { if (gunluk) gunluk.uyari("buyume", "Olay yazılamadı: " + ad, { hata: String(e.message || e) }); }
  }
  async function bildir(uid, b, epostaMetin) {
    try {
      const ayar = db.prepare("SELECT push FROM notification_prefs WHERE user_id = ?").get(uid) || {};
      const u = q.kullanici.get(uid);
      const r = bildirim.olustur(uid, Object.assign({ tur: "premium" }, b), {
        push: !!ayar.push,
        eposta: epostaMetin && u ? { konu: "Meberra: " + b.baslik, metin: "Merhaba " + u.ad + ",\n\n" + epostaMetin + "\n\nİyi çalışmalar,\nMeberra" } : null
      });
      await r.push;
    } catch (e) { if (gunluk) gunluk.uyari("buyume", "Bildirim gönderilemedi", { hata: String(e.message || e) }); }
  }

  // ==== ölçüm tercihi =====================================================================================
  function olcumTercih(uid) { return { kapali: !!bkSatiri(uid).olcum_kapali }; }
  function olcumKaydet(u, kapali, req) {
    bkSatiri(u.id);
    db.prepare("UPDATE buyume_kullanici SET olcum_kapali = ?, guncelleme = ? WHERE user_id = ?").run(kapali ? 1 : 0, simdi(), u.id);
    denetim({ eylem: "olcum.tercih", kullanici: u.id, istek: req, ayrinti: { kapali: !!kapali } });
    return { kapali: !!kapali };
  }

  // ==== 7 günlük deneme ===================================================================================
  function denemeDurum(u) {
    const y = hesap.uyelik(u.id);
    const d = q.denemeUser.get(u.id) || (u.eposta ? q.denemeHash.get(epostaHash(u.eposta)) : null);
    let neden = null;
    if (u.rol === "yonetici") neden = "yonetici";
    else if (d) neden = "kullanildi";
    else if (y.premium) neden = "premium";
    return { uygun: !neden, neden, gun: DENEME_GUN, aktif: !!y.deneme, bitis: y.deneme ? y.bitis : d ? d.bitis : null, kullanildi: !!d };
  }
  function denemeBaslat(u, req) {
    const NEDEN = { yonetici: "Yönetici hesapları zaten Premium.", kullanildi: "Ücretsiz deneme hakkını daha önce kullandın.", premium: "Premium hesabın zaten aktif." };
    let s = null;
    islem(db, () => {
      const d = denemeDurum(u);
      if (!d.uygun) throw new HttpHata(409, NEDEN[d.neden], null, { neden: d.neden });
      s = hesap.premiumVer(u.id, null, DENEME_GUN, { kaynak: "deneme", not: DENEME_GUN + " gün ücretsiz deneme" });
      db.prepare("INSERT INTO premium_denemeleri (eposta_hash, user_id, abonelik_id, baslangic, bitis) VALUES (?, ?, ?, ?, ?)")
        .run(epostaHash(u.eposta || ("id:" + u.id)), u.id, s.id, s.baslangic, s.bitis);
    });
    denetim({ eylem: "premium.deneme-basla", kullanici: u.id, istek: req, varlik: "subscriptions", varlikId: s.id, ayrinti: { bitis: s.bitis } });
    olay("deneme_basla", u.id, req);
    bildir(u.id, { baslik: "Premium denemen başladı", link: "/calis.html",
      metin: DENEME_GUN + " gün boyunca tüm ünitelere, sınırsız denemeye ve sınırsız soru sormaya erişebilirsin. Bitiş: " + trTarih(s.bitis) + ". Otomatik ücret alınmaz." });
    return { bitis: s.bitis, uyelik: hesap.uyelik(u.id) };
  }

  /** Zamanlayıcı: "2 gün kaldı" ve bitiş bildirimi. Sessiz saatlerde çalışmaz (zamanlayıcı kuralı); günde en fazla bir mesaj. */
  async function denemeBildirimleri(simdiMs) {
    simdiMs = simdiMs == null ? Date.now() : simdiMs;
    const z = new Date(simdiMs).toISOString(), bugun = zaman.gun(simdiMs);
    const satirlar = db.prepare(`SELECT d.*, s.bitis AS s_bitis, s.durum AS s_durum, u.durum AS u_durum FROM premium_denemeleri d
      JOIN subscriptions s ON s.id = d.abonelik_id JOIN users u ON u.id = d.user_id
      WHERE d.bitti_bildirim IS NULL AND u.durum = 'aktif'`).all();
    const bugunMesajVar = uid => !!db.prepare("SELECT 1 FROM reminder_log WHERE user_id = ? AND gun = ? AND tur IN ('hatirlatma', 'deneme')").get(uid, bugun);
    const isaretle = uid => Number(db.prepare("INSERT OR IGNORE INTO reminder_log (user_id, tur, gun, zaman, ayrinti) VALUES (?, 'deneme', ?, ?, NULL)").run(uid, bugun, simdi()).changes) === 1;
    let n = 0;
    for (const d of satirlar) {
      const bitis = d.s_durum === "iptal" ? null : d.s_bitis;
      const y = hesap.uyelik(d.user_id);
      const ucretli = y.premium && !y.deneme;
      if (bitis && bitis > z) {
        // 2 gün kaldı (5. gün)
        if (d.hatirlatma || Date.parse(bitis) - simdiMs > 2 * GUN || ucretli) continue;
        if (bugunMesajVar(d.user_id) || !isaretle(d.user_id)) continue;
        db.prepare("UPDATE premium_denemeleri SET hatirlatma = ? WHERE eposta_hash = ?").run(simdi(), d.eposta_hash);
        await bildir(d.user_id, { baslik: "Premium denemende 2 gün kaldı", link: "/premium.html",
          metin: "Denemen " + trTarih(bitis) + " tarihinde bitiyor. Kaldığın yerden kesintisiz devam etmek için Premium'a geçebilirsin." },
          "Premium denemende 2 gün kaldı (bitiş: " + trTarih(bitis) + "). Bu sürede tüm ünitelere ve sınırsız denemeye erişebilirsin.\n\n" +
          "Kesintisiz devam etmek istersen Premium'a geçebilirsin: " + config.baseUrl + "/premium.html\nOtomatik ücret alınmaz; deneme bitince hesabın ücretsiz plana döner.");
        n++;
      } else {
        // Bitti (ya da yönetici iptal etti): bir kez, ücretli Premium'a geçtiyse sessizce kapatılır
        if (ucretli) { db.prepare("UPDATE premium_denemeleri SET bitti_bildirim = ? WHERE eposta_hash = ?").run(simdi(), d.eposta_hash); continue; }
        if (bugunMesajVar(d.user_id) || !isaretle(d.user_id)) continue;
        db.prepare("UPDATE premium_denemeleri SET bitti_bildirim = ? WHERE eposta_hash = ?").run(simdi(), d.eposta_hash);
        olay("deneme_bitti", d.user_id, null);
        await bildir(d.user_id, { baslik: "Premium denemen bitti", link: "/premium.html",
          metin: "Denediğin için teşekkürler! Ücretsiz plandaki ünitelerin açık kalıyor. Tüm ünitelere dönmek için Premium'a geçebilirsin." },
          "Premium denemen sona erdi. Ücretsiz plandaki ünitelerin ve ilerlemen yerinde duruyor.\n\nTüm ünitelere, sınırsız denemeye ve sınırsız soru sormaya dönmek istersen: " +
          config.baseUrl + "/premium.html");
        n++;
      }
    }
    return n;
  }

  // ==== indirim kodları ====================================================================================
  function kuponHata(m) { return new HttpHata(400, m, { kupon: m }); }
  /** Kodu doğrular ve fiyatı hesaplar. Geçersizse 400 { errors.kupon }. */
  function kuponHesapla(kod, planId, uid) {
    const k = kodNorm(kod);
    if (!KOD_RE.test(k)) throw kuponHata("Bu indirim kodu geçerli değil.");
    const plan = config.plan(planId);
    if (!plan) throw new HttpHata(400, "Bir plan seç.", { plan: "Bir plan seç." });
    const r = q.kupon.get(k);
    const z = simdi();
    if (!r || !r.aktif) throw kuponHata("Bu indirim kodu geçerli değil.");
    if (r.baslangic && r.baslangic > z) throw kuponHata("Bu indirim kodu henüz başlamadı.");
    if (r.bitis && r.bitis <= z) throw kuponHata("Bu indirim kodunun süresi doldu.");
    if (r.plan !== "hepsi" && r.plan !== plan.id) throw kuponHata("Bu kod yalnızca " + (r.plan === "aylik" ? "Aylık" : "Yıllık") + " planda geçerli.");
    if (r.max_kullanim != null && q.kuponKullanilan.get(r.id, r.id).n >= r.max_kullanim) throw kuponHata("Bu indirim kodunun kullanım sınırı doldu.");
    if (uid && q.kuponKisi.get(r.id, uid, r.id, uid).n >= (r.kisi_basi || 1)) throw kuponHata("Bu indirim kodunu zaten kullandın.");
    return Object.assign({ kupon: r, kod: r.kod, plan: plan.id, aciklama: r.aciklama || null }, kuponFiyat(r, plan.fiyat));
  }
  function kuponGenel(k) {
    const kul = db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(indirim), 0) AS indirim, COALESCE(SUM(tutar), 0) AS gelir FROM kupon_kullanimlari WHERE kupon_id = ?").get(k.id);
    const bekleyen = db.prepare("SELECT COUNT(*) AS n FROM upgrade_requests WHERE kupon_id = ? AND durum = 'bekliyor'").get(k.id).n;
    return { id: k.id, kod: k.kod, tur: k.tur, deger: k.deger, plan: k.plan, baslangic: k.baslangic, bitis: k.bitis, maxKullanim: k.max_kullanim,
      kisiBasi: k.kisi_basi, aktif: !!k.aktif, aciklama: k.aciklama, olusturma: k.olusturma,
      kullanim: kul.n, bekleyen, toplamIndirim: yuvarla(kul.indirim), gelir: yuvarla(kul.gelir) };
  }
  function kuponAlanlari(b, eski) {
    const e = {}, o = {};
    const kod = kodNorm(b.kod != null ? b.kod : eski && eski.kod);
    if (!KOD_RE.test(kod)) e.kod = "3–30 karakter: harf, rakam, - ya da _.";
    o.kod = kod;
    o.tur = b.tur != null ? b.tur : eski && eski.tur;
    if (o.tur !== "yuzde" && o.tur !== "tutar") e.tur = "Tür yuzde ya da tutar olmalı.";
    o.deger = b.deger != null ? +b.deger : eski && eski.deger;
    if (!(o.deger > 0) || (o.tur === "yuzde" && o.deger > 100) || o.deger > 100000) e.deger = o.tur === "yuzde" ? "1–100 arası yüzde yaz." : "Pozitif bir tutar yaz.";
    o.plan = b.plan != null ? b.plan : (eski ? eski.plan : "hepsi");
    if (["aylik", "yillik", "hepsi"].indexOf(o.plan) < 0) e.plan = "Plan aylik, yillik ya da hepsi olmalı.";
    const tarih = (alan, v) => {
      if (v === "" || v === null) return null;
      if (v === undefined) return eski ? eski[alan] : null;
      const t = Date.parse(v);
      if (isNaN(t)) { e[alan] = "Geçerli bir tarih yaz."; return null; }
      return new Date(t).toISOString();
    };
    o.baslangic = tarih("baslangic", b.baslangic);
    o.bitis = tarih("bitis", b.bitis);
    if (o.baslangic && o.bitis && o.bitis <= o.baslangic) e.bitis = "Bitiş başlangıçtan sonra olmalı.";
    const tam = (v, d) => (v === "" || v === null ? null : v === undefined ? d : +v);
    o.max_kullanim = tam(b.maxKullanim, eski ? eski.max_kullanim : null);
    if (o.max_kullanim != null && !(Number.isInteger(o.max_kullanim) && o.max_kullanim >= 1 && o.max_kullanim <= 1e6)) e.maxKullanim = "1 ya da daha büyük tam sayı (boş: sınırsız).";
    o.kisi_basi = tam(b.kisiBasi, eski ? eski.kisi_basi : 1);
    if (!(Number.isInteger(o.kisi_basi) && o.kisi_basi >= 1 && o.kisi_basi <= 100)) e.kisiBasi = "1–100 arası tam sayı.";
    o.aktif = b.aktif != null ? (b.aktif === true || b.aktif === 1 ? 1 : 0) : eski ? eski.aktif : 1;
    o.aciklama = b.aciklama !== undefined ? kirp(b.aciklama).slice(0, 200) || null : eski ? eski.aciklama : null;
    if (Object.keys(e).length) throw new HttpHata(400, "Lütfen işaretli alanları düzelt.", e);
    return o;
  }

  // ==== davet programı ====================================================================================
  function davetBilgi(u) {
    const b = bkSatiri(u.id);
    const say = durum => db.prepare("SELECT COUNT(*) AS n FROM davetler WHERE davet_eden = ? AND durum = ?").get(u.id, durum).n;
    const yil = db.prepare("SELECT COUNT(*) AS n FROM davetler WHERE davet_eden = ? AND eden_odul = 1 AND odul_zamani >= ?").get(u.id, new Date(Date.now() - 365 * GUN).toISOString()).n;
    return { kod: b.davet_kodu, link: config.baseUrl + "/giris.html?davet=" + b.davet_kodu + "#kayit", odulGun: DAVET_ODUL_GUN,
      basarili: say("odullendi"), bekleyen: say("bekliyor"), yillikSinir: DAVET_YILLIK_SINIR, buYilOdul: yil };
  }
  /** Kayıt sırasında davet kodu: kendi kodu, aynı e-posta karması (yeniden kayıt) ya da 24 saat içinde aynı IP → reddedildi. */
  function davetKaydet(yeni, kodHam, req) {
    const kod = kodNorm(kodHam);
    if (!DAVET_RE.test(kod)) return null;
    const eden = q.bkKod.get(kod);
    if (!eden || eden.durum !== "aktif") return null;
    const hash = epostaHash(yeni.eposta);
    let neden = null;
    if (eden.user_id === yeni.id || (eden.eposta && epostaHash(eden.eposta) === hash)) neden = "kendi-kodu";
    else if (db.prepare("SELECT 1 FROM davetler WHERE eposta_hash = ?").get(hash)) neden = "tekrar-eposta";
    else if (req && req.ip) {
      const sinir = new Date(Date.now() - AYNI_IP_SAAT * 3600e3).toISOString();
      const ayni = db.prepare(`SELECT 1 FROM sessions WHERE user_id = ? AND (ip = ? OR son_ip = ?) AND COALESCE(son_gorulme, son_kullanim) >= ? LIMIT 1`).get(eden.user_id, req.ip, req.ip, sinir)
        || db.prepare("SELECT 1 FROM users WHERE id = ? AND son_ip = ? AND son_gorulme >= ?").get(eden.user_id, req.ip, sinir);
      if (ayni) neden = "ayni-ip";
    }
    db.prepare("INSERT OR IGNORE INTO davetler (davet_eden, davet_edilen, kod, eposta_hash, durum, neden, olusturma) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(eden.user_id, yeni.id, kod, hash, neden ? "reddedildi" : "bekliyor", neden, simdi());
    denetim({ eylem: "davet.kayit", kullanici: yeni.id, ayrinti: { davetEden: eden.user_id, durum: neden ? "reddedildi" : "bekliyor", neden } });
    return { durum: neden ? "reddedildi" : "bekliyor", neden };
  }
  /** Davet edilen seviye testini bitirdiyse iki tarafa da +7 gün Premium (davet eden yılda en çok 10 ödül). */
  async function davetKontrol(uid) {
    const d = q.davetEdilen.get(uid);
    if (!d || d.durum !== "bekliyor" || !q.seviyeVar.get(uid)) return false;
    let edenOdul = false;
    const tamam = islem(db, () => {
      if (Number(db.prepare("UPDATE davetler SET durum = 'odullendi', odul_zamani = ? WHERE id = ? AND durum = 'bekliyor'").run(simdi(), d.id).changes) !== 1) return false;
      hesap.premiumVer(uid, null, DAVET_ODUL_GUN, { kaynak: "davet", not: "Davet ödülü (davet edilen)" });
      const eden = d.davet_eden ? q.kullanici.get(d.davet_eden) : null;
      if (eden && eden.durum === "aktif") {
        const yil = db.prepare("SELECT COUNT(*) AS n FROM davetler WHERE davet_eden = ? AND eden_odul = 1 AND odul_zamani >= ?").get(eden.id, new Date(Date.now() - 365 * GUN).toISOString()).n;
        if (yil < DAVET_YILLIK_SINIR) {
          hesap.premiumVer(eden.id, null, DAVET_ODUL_GUN, { kaynak: "davet", not: "Davet ödülü (davet eden)" });
          db.prepare("UPDATE davetler SET eden_odul = 1 WHERE id = ?").run(d.id);
          edenOdul = true;
        }
      }
      return true;
    });
    if (!tamam) return false;
    denetim({ eylem: "davet.odul", kullanici: uid, ayrinti: { davetEden: d.davet_eden, edenOdul } });
    await bildir(uid, { baslik: DAVET_ODUL_GUN + " gün Premium hediye", link: "/calis.html", metin: "Seviye testini bitirdin; davet hediyen olan " + DAVET_ODUL_GUN + " gün Premium hesabına tanımlandı." });
    if (edenOdul) await bildir(d.davet_eden, { baslik: "Davetin işe yaradı", link: "/profil.html#davet", metin: "Davet ettiğin arkadaşın seviye testini bitirdi. Hesabına " + DAVET_ODUL_GUN + " gün Premium eklendi." });
    return true;
  }
  async function davetTarama() {
    const l = db.prepare(`SELECT d.davet_edilen AS uid FROM davetler d WHERE d.durum = 'bekliyor' AND d.davet_edilen IS NOT NULL
      AND EXISTS (SELECT 1 FROM soru_oturumlari s WHERE s.user_id = d.davet_edilen AND s.tur = 'seviye' AND s.teslim IS NOT NULL) LIMIT 500`).all();
    let n = 0;
    for (const x of l) if (await davetKontrol(x.uid)) n++;
    return n;
  }

  // ==== hesap servisi sarmalayıcıları =======================================================================
  const asil = { kayit: hesap.kayit, profilKaydet: hesap.profilKaydet, talepOlustur: hesap.talepOlustur, premiumVer: hesap.premiumVer, hesapSil: hesap.hesapSil, disaAktar: hesap.disaAktar };
  hesap.kayit = function (f, req) {
    const s = asil.kayit.call(this, f, req);
    try {
      bkSatiri(s.kullanici.id);
      olay("kayit_tamam", s.kullanici.id, req);
      if (f && f.davet) davetKaydet(s.kullanici, f.davet, req);
    } catch (e) { if (gunluk) gunluk.uyari("buyume", "Kayıt sonrası büyüme işlemi başarısız", { hata: String(e.message || e) }); }
    return s;
  };
  hesap.profilKaydet = function (u, profil, req) {
    const eski = hesap.profilAl(u.id);
    const r = asil.profilKaydet.call(this, u, profil, req);
    if (!(eski && eski.tamamlandi) && profil && profil.tamamlandi) olay("karsilama_tamam", u.id, req);
    return r;
  };
  hesap.talepOlustur = function (u, f, req) {
    f = f || {};
    let t;
    if (kirp(f.kupon)) {
      islem(db, () => {
        const k = kuponHesapla(f.kupon, f.plan, u.id);
        t = asil.talepOlustur.call(this, u, f, req, { tutar: k.tutar, kuponKod: k.kod });
        db.prepare("UPDATE upgrade_requests SET kupon_id = ?, liste_tutar_tl = ? WHERE id = ?").run(k.kupon.id, k.liste, t.id);
        t.kupon = { kod: k.kod, indirim: k.indirim, liste: k.liste };
      });
    } else t = asil.talepOlustur.call(this, u, f, req);
    olay("odeme_bildirdi", u.id, req, { plan: t.plan, kupon: !!t.kupon });
    return t;
  };
  hesap.premiumVer = function (userId, plan, gun, ek) {
    const s = asil.premiumVer.call(this, userId, plan, gun, ek);
    if (ek && ek.kaynak === "talep" && ek.talepId) {
      const t = db.prepare("SELECT * FROM upgrade_requests WHERE id = ?").get(ek.talepId);
      if (t && t.kupon_id) db.prepare(`INSERT OR IGNORE INTO kupon_kullanimlari (kupon_id, user_id, talep_id, plan, liste_tutar, indirim, tutar, zaman)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(t.kupon_id, t.user_id, t.id, t.plan, t.liste_tutar_tl || t.tutar_tl, yuvarla((t.liste_tutar_tl || t.tutar_tl) - t.tutar_tl), t.tutar_tl, simdi());
      olay("premium_aktif", userId, null, { plan: t ? t.plan : plan || "ozel" });
    }
    return s;
  };
  hesap.hesapSil = function (u, sifre, req) {
    asil.hesapSil.call(this, u, sifre, req);
    // Ölçüm olayları ve büyüme ayarları silinir; deneme/davet e-posta karmaları kötüye kullanımı önlemek için kalır
    db.prepare("DELETE FROM olaylar WHERE user_id = ?").run(u.id);
    db.prepare("DELETE FROM buyume_kullanici WHERE user_id = ?").run(u.id);
  };
  hesap.disaAktar = function (u) {
    const o = asil.disaAktar.call(this, u);
    o.buyume = {
      olcum: Object.assign(olcumTercih(u.id), { olaylar: db.prepare("SELECT zaman, olay, sayfa, ozellikler, utm_source, utm_medium, utm_campaign FROM olaylar WHERE user_id = ? ORDER BY id").all(u.id) }),
      davetKodu: bkSatiri(u.id).davet_kodu,
      davetler: db.prepare("SELECT durum, olusturma, odul_zamani FROM davetler WHERE davet_eden = ? OR davet_edilen = ?").all(u.id, u.id),
      premiumDenemesi: db.prepare("SELECT baslangic, bitis FROM premium_denemeleri WHERE user_id = ?").get(u.id) || null,
      kuponlar: db.prepare("SELECT k.kod, kk.plan, kk.indirim, kk.tutar, kk.zaman FROM kupon_kullanimlari kk JOIN kuponlar k ON k.id = kk.kupon_id WHERE kk.user_id = ?").all(u.id)
    };
    return o;
  };

  return { epostaHash, olcumTercih, olcumKaydet, denemeDurum, denemeBaslat, denemeBildirimleri, kuponHesapla, kuponGenel, kuponAlanlari,
    davetBilgi, davetKaydet, davetKontrol, davetTarama, olay, bkSatiri,
    kuponSinir: hizSinirlayici(c.kuponSiniri || 20, 10 * 60e3) };
}

/** Rotalar (öğrenci + yönetici) ve rota sonrası kancalar */
function kampanyaRotalari(r, c) {
  const { db, kampanya: K, huni, hesap, denetim, oturumGerekli, yoneticiGerekli } = c;

  // ---- rota sonrası kancalar: başarılı yanıttan sonra sunucu tarafı olay ----------------------------------
  const kancalar = {};
  const bul0 = r.bul;
  r.bul = function (yontem, yol) {
    const m = bul0.call(r, yontem, yol);
    const k = kancalar[yontem + " " + yol];
    if (!m || typeof m !== "object" || !k) return m;
    return Object.assign({}, m, { isleyiciler: [async (req, res) => {
      let s;
      for (const f of m.isleyiciler) s = await f(req, res);
      try { await k(req, s); } catch (e) { /* ölçüm yanıtı bozmaz */ }
      return s;
    }] });
  };
  kancalar["POST /api/seviye/teslim"] = async req => { K.olay("seviye_bitti", req.kullanici.id, req); await K.davetKontrol(req.kullanici.id); };
  kancalar["POST /api/sorular-bankasi/cevap"] = async req => { K.olay("ilk_soru", req.kullanici.id, req); };
  kancalar["POST /api/sorular"] = async req => { K.olay("soru_sordu", req.kullanici.id, req); };
  kancalar["POST /api/public/demo-soru/cevap"] = async req => { K.olay("demo_soru_cevaplandi", req.kullanici ? req.kullanici.id : null, req); };

  // ---- öğrenci ------------------------------------------------------------------------------------------
  r.get("/api/olcum-tercih", req => { oturumGerekli(req); return Object.assign({ ok: true }, K.olcumTercih(req.kullanici.id)); });
  r.put("/api/olcum-tercih", req => {
    oturumGerekli(req);
    const b = req.body || {};
    if (typeof b.kapali !== "boolean") throw new HttpHata(400, "kapali true ya da false olmalı.");
    return Object.assign({ ok: true }, K.olcumKaydet(req.kullanici, b.kapali, req));
  });
  r.get("/api/premium/deneme", req => { oturumGerekli(req); return Object.assign({ ok: true }, K.denemeDurum(req.kullanici)); });
  r.post("/api/premium/deneme", req => { oturumGerekli(req); return Object.assign({ ok: true }, K.denemeBaslat(req.kullanici, req)); });
  r.post("/api/kupon/dogrula", req => {
    oturumGerekli(req);
    if (!K.kuponSinir.dene("u:" + req.kullanici.id) || !K.kuponSinir.dene("ip:" + req.ip)) throw new HttpHata(429, "Çok fazla kod denemesi. Biraz sonra tekrar dene.");
    const b = req.body || {};
    const k = K.kuponHesapla(b.kod, b.plan, req.kullanici.id);
    return { ok: true, kod: k.kod, plan: k.plan, liste: k.liste, indirim: k.indirim, tutar: k.tutar, aciklama: k.aciklama };
  });
  r.get("/api/davet", async req => {
    oturumGerekli(req);
    await K.davetKontrol(req.kullanici.id);
    return Object.assign({ ok: true }, K.davetBilgi(req.kullanici));
  });

  // ---- yönetici ------------------------------------------------------------------------------------------
  const kullaniciBul = pid => {
    const u = db.prepare("SELECT * FROM users WHERE public_id = ?").get(String(pid));
    if (!u) throw new HttpHata(404, "Kullanıcı bulunamadı.");
    return u;
  };
  r.get("/api/admin/buyume/ozet", req => {
    yoneticiGerekli(req);
    const z = simdi(), tek = (sql, ...a) => db.prepare(sql).get(...a).n;
    const denemeToplam = tek("SELECT COUNT(*) AS n FROM premium_denemeleri");
    const denemeUcretli = tek(`SELECT COUNT(*) AS n FROM premium_denemeleri d WHERE EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = d.user_id AND s.kaynak = 'talep' AND s.olusturma >= d.baslangic)`);
    return { ok: true,
      deneme: { aktif: tek("SELECT COUNT(*) AS n FROM subscriptions WHERE kaynak = 'deneme' AND durum = 'aktif' AND bitis > ?", z), toplam: denemeToplam, ucretliyeGecen: denemeUcretli,
        donusum: denemeToplam ? Math.round(denemeUcretli / denemeToplam * 1000) / 10 : null },
      kupon: { aktif: tek("SELECT COUNT(*) AS n FROM kuponlar WHERE aktif = 1"), kullanim: tek("SELECT COUNT(*) AS n FROM kupon_kullanimlari") },
      davet: { odullendi: tek("SELECT COUNT(*) AS n FROM davetler WHERE durum = 'odullendi'"), bekliyor: tek("SELECT COUNT(*) AS n FROM davetler WHERE durum = 'bekliyor'"),
        reddedildi: tek("SELECT COUNT(*) AS n FROM davetler WHERE durum = 'reddedildi'") } };
  });
  r.get("/api/admin/buyume/denemeler", req => {
    yoneticiGerekli(req);
    const z = simdi(), hepsi = req.sorgu.get("durum") === "hepsi";
    const satirlar = db.prepare(`SELECT d.baslangic, d.hatirlatma, d.bitti_bildirim, s.id AS sid, s.bitis, s.durum AS s_durum, u.public_id, u.ad, u.soyad, u.eposta, u.durum AS u_durum,
        EXISTS (SELECT 1 FROM subscriptions p WHERE p.user_id = d.user_id AND p.kaynak = 'talep' AND p.olusturma >= d.baslangic) AS ucretli
      FROM premium_denemeleri d JOIN subscriptions s ON s.id = d.abonelik_id JOIN users u ON u.id = d.user_id
      ${hepsi ? "" : "WHERE s.durum = 'aktif' AND s.bitis > ?"} ORDER BY d.baslangic DESC LIMIT 200`).all(...(hepsi ? [] : [z]));
    return { ok: true, denemeler: satirlar.map(x => ({ kullanici: { id: x.public_id, ad: x.ad, soyad: x.soyad, eposta: x.eposta, durum: x.u_durum },
      baslangic: x.baslangic, bitis: x.bitis, durum: x.s_durum === "iptal" ? "iptal" : x.bitis > z ? "aktif" : "bitti", hatirlatma: x.hatirlatma, bittiBildirim: x.bitti_bildirim, ucretliyeGecti: !!x.ucretli })) };
  });
  const denemeAboneligi = u => {
    const d = db.prepare("SELECT d.*, s.bitis AS s_bitis, s.durum AS s_durum FROM premium_denemeleri d JOIN subscriptions s ON s.id = d.abonelik_id WHERE d.user_id = ?").get(u.id);
    if (!d) throw new HttpHata(404, "Bu kullanıcının denemesi yok.");
    return d;
  };
  r.post("/api/admin/buyume/denemeler/:id/uzat", req => {
    yoneticiGerekli(req);
    const u = kullaniciBul(req.params.id), d = denemeAboneligi(u), gun = +(req.body || {}).gun;
    if (!(Number.isInteger(gun) && gun >= 1 && gun <= 30)) throw new HttpHata(400, "1–30 arası gün yaz.", { gun: "1–30 arası tam sayı." });
    if (d.s_durum !== "aktif") throw new HttpHata(409, "İptal edilmiş deneme uzatılamaz.");
    const temel = d.s_bitis > simdi() ? d.s_bitis : simdi();
    const bitis = tarihEkle(temel, gun);
    db.prepare("UPDATE subscriptions SET bitis = ? WHERE id = ?").run(bitis, d.abonelik_id);
    db.prepare("UPDATE premium_denemeleri SET bitis = ?, hatirlatma = NULL, bitti_bildirim = NULL WHERE eposta_hash = ?").run(bitis, d.eposta_hash);
    denetim({ eylem: "premium.deneme-uzat", kullanici: u.id, yapan: req.kullanici.id, istek: req, ayrinti: { gun, bitis } });
    return { ok: true, bitis, uyelik: hesap.uyelik(u.id) };
  });
  r.post("/api/admin/buyume/denemeler/:id/iptal", req => {
    yoneticiGerekli(req);
    const u = kullaniciBul(req.params.id), d = denemeAboneligi(u);
    db.prepare("UPDATE subscriptions SET durum = 'iptal', iptal_zamani = ? WHERE id = ? AND durum = 'aktif'").run(simdi(), d.abonelik_id);
    db.prepare("UPDATE premium_denemeleri SET bitti_bildirim = COALESCE(bitti_bildirim, ?) WHERE eposta_hash = ?").run(simdi(), d.eposta_hash);
    denetim({ eylem: "premium.deneme-iptal", kullanici: u.id, yapan: req.kullanici.id, istek: req });
    return { ok: true, uyelik: hesap.uyelik(u.id) };
  });

  r.get("/api/admin/kuponlar", req => {
    yoneticiGerekli(req);
    const kuponlar = db.prepare("SELECT * FROM kuponlar ORDER BY aktif DESC, id DESC LIMIT 500").all().map(K.kuponGenel);
    const son = db.prepare(`SELECT kk.zaman, kk.plan, kk.liste_tutar, kk.indirim, kk.tutar, k.kod, u.public_id, u.ad, u.soyad FROM kupon_kullanimlari kk
      JOIN kuponlar k ON k.id = kk.kupon_id LEFT JOIN users u ON u.id = kk.user_id ORDER BY kk.id DESC LIMIT 50`).all()
      .map(x => ({ zaman: x.zaman, kod: x.kod, plan: x.plan, liste: x.liste_tutar, indirim: x.indirim, tutar: x.tutar, kullanici: x.public_id ? { id: x.public_id, ad: x.ad, soyad: x.soyad } : null }));
    return { ok: true, kuponlar, sonKullanimlar: son };
  });
  r.post("/api/admin/kuponlar", req => {
    yoneticiGerekli(req);
    const o = K.kuponAlanlari(req.body || {}, null), z = simdi();
    if (db.prepare("SELECT 1 FROM kuponlar WHERE kod = ?").get(o.kod)) throw new HttpHata(409, "Bu kod zaten var.", { kod: "Bu kod zaten var." });
    const id = Number(db.prepare(`INSERT INTO kuponlar (kod, tur, deger, plan, baslangic, bitis, max_kullanim, kisi_basi, aktif, aciklama, olusturan, olusturma, guncelleme)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(o.kod, o.tur, o.deger, o.plan, o.baslangic, o.bitis, o.max_kullanim, o.kisi_basi, o.aktif, o.aciklama, req.kullanici.id, z, z).lastInsertRowid);
    denetim({ eylem: "kupon.olustur", yapan: req.kullanici.id, istek: req, varlik: "kuponlar", varlikId: id, ayrinti: { kod: o.kod, tur: o.tur, deger: o.deger } });
    return { ok: true, kupon: K.kuponGenel(db.prepare("SELECT * FROM kuponlar WHERE id = ?").get(id)) };
  });
  r.put("/api/admin/kuponlar/:id", req => {
    yoneticiGerekli(req);
    const eski = db.prepare("SELECT * FROM kuponlar WHERE id = ?").get(+req.params.id || 0);
    if (!eski) throw new HttpHata(404, "Kupon bulunamadı.");
    const o = K.kuponAlanlari(req.body || {}, eski);
    if (o.kod !== eski.kod.toUpperCase() && db.prepare("SELECT 1 FROM kuponlar WHERE kod = ? AND id != ?").get(o.kod, eski.id)) throw new HttpHata(409, "Bu kod zaten var.", { kod: "Bu kod zaten var." });
    db.prepare(`UPDATE kuponlar SET kod = ?, tur = ?, deger = ?, plan = ?, baslangic = ?, bitis = ?, max_kullanim = ?, kisi_basi = ?, aktif = ?, aciklama = ?, guncelleme = ? WHERE id = ?`)
      .run(o.kod, o.tur, o.deger, o.plan, o.baslangic, o.bitis, o.max_kullanim, o.kisi_basi, o.aktif, o.aciklama, simdi(), eski.id);
    denetim({ eylem: "kupon.guncelle", yapan: req.kullanici.id, istek: req, varlik: "kuponlar", varlikId: eski.id, ayrinti: { kod: o.kod, aktif: !!o.aktif } });
    return { ok: true, kupon: K.kuponGenel(db.prepare("SELECT * FROM kuponlar WHERE id = ?").get(eski.id)) };
  });

  r.get("/api/admin/davetler", req => {
    yoneticiGerekli(req);
    const d = req.sorgu.get("durum");
    const where = ["bekliyor", "odullendi", "reddedildi"].indexOf(d) >= 0 ? "WHERE d.durum = ?" : "";
    const satirlar = db.prepare(`SELECT d.*, e.public_id AS e_id, e.ad AS e_ad, e.soyad AS e_soyad, n.public_id AS n_id, n.ad AS n_ad, n.soyad AS n_soyad, n.durum AS n_durum,
        (SELECT COUNT(*) FROM davetler x WHERE x.davet_eden = d.davet_eden AND x.olusturma >= ?) AS eden_24s
      FROM davetler d LEFT JOIN users e ON e.id = d.davet_eden LEFT JOIN users n ON n.id = d.davet_edilen ${where} ORDER BY d.id DESC LIMIT 300`)
      .all(new Date(Date.now() - 86400e3).toISOString(), ...(where ? [d] : []));
    return { ok: true, davetler: satirlar.map(x => {
      const bayraklar = [];
      if (x.neden) bayraklar.push(x.neden);
      if (x.eden_24s >= 5) bayraklar.push("yogun-davet"); // 24 saatte 5+ kayıt: elle bak
      if (x.n_durum === "silindi") bayraklar.push("hesap-silindi");
      return { id: x.id, kod: x.kod, durum: x.durum, neden: x.neden, edenOdul: !!x.eden_odul, olusturma: x.olusturma, odulZamani: x.odul_zamani, bayraklar,
        davetEden: x.e_id ? { id: x.e_id, ad: x.e_ad, soyad: x.e_soyad } : null, davetEdilen: x.n_id ? { id: x.n_id, ad: x.n_ad, soyad: x.n_soyad } : null };
    }) };
  });
}

module.exports = { kampanyaServisi, kampanyaRotalari, epostaHash, kuponFiyat, DENEME_GUN, DAVET_ODUL_GUN, DAVET_YILLIK_SINIR };
