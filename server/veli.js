"use strict";
// 1.7.0 Veli paneli: öğrenci velisini davet eder → veli e-postadaki bağlantıyla hafif bir veli hesabı açar (ya da girer)
// → öğrenciye bağlanır. Veli yalnızca TOPLU özetleri ve sonuçları görür (çalışma süresi tahmini, soru sayısı, doğruluk, seri,
// son etkinlik, ders ilerlemesi, deneme sonuçları, tarihler, Premium durumu). Soru-cevap yazışmaları, notlar, cevap ayrıntısı,
// tarayıcı verisi ASLA veliye gitmez. Öğrenci bağlantıyı istediği an kaldırır; bağlama/kaldırma denetim kaydına yazılır.
// Tek veli kimliği: eski "veli e-postası" (notification_prefs.veli_eposta) ile aynı adres bağlanınca o adres onaylı sayılır
// ve haftalık rapor yalnızca bir kez (veli hesabına) gider.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const config = require("./config");
const { islem, simdi } = require("./db");
const { sifreOzetle, belirtec, ozet, publicId, hizSinirlayici } = require("./guvenlik");
const { HttpHata } = require("./http");
const zaman = require("./zaman");
const AP = require("../assets/js/ap-hedef");
const ILERLEME = require("./ilerleme"); // 1.16.0 grafikler: haftalık etkinlik + puan geçmişi (salt okunur)

const EPOSTA_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[A-Za-z]{2,}$/;
const kirp = s => String(s == null ? "" : s).trim().replace(/\s+/g, " ");
const GUN = 864e5;
const DAVET_GUN = 7;
const EN_FAZLA_VELI = 3;            // öğrenci başına açık davet + aktif bağlantı
const SORU_SN = 90;                 // çalışma süresi tahmini: soru başına ~1,5 dk (+ deneme süreleri)
const KOK = path.resolve(__dirname, "..");

// Veli hesabının kullanabileceği API yolları (öğrenci özellikleri kapalı)
const VELI_ACIK = ["/api/health", "/api/me", "/api/log", "/api/account/export", "/api/account/delete"];
const VELI_ACIK_ONEK = ["/api/veli/", "/api/auth/", "/api/public/"];
function veliYolIzinli(yol) { return VELI_ACIK.indexOf(yol) >= 0 || VELI_ACIK_ONEK.some(o => yol.startsWith(o)); }

/** data/mevzuat/sinav-takvimi.js (window.APMEBERRA_TAKVIM) — sunucuda tarih uydurmadan aynı veriyi kullanmak için */
let takvimOnbellek = null;
function takvim() {
  if (takvimOnbellek) return takvimOnbellek;
  try {
    const ctx = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(KOK, "data/mevzuat/sinav-takvimi.js"), "utf8"), ctx, { timeout: 1000 });
    takvimOnbellek = ctx.window.APMEBERRA_TAKVIM || {};
  } catch (e) { takvimOnbellek = {}; }
  return takvimOnbellek;
}

function veliServisi(db, c) {
  const { hesap, eposta, denetim, bildirim } = c;
  const calismaDurumu = c.calismaDurumu || null;
  const saat = c.saat || Date.now;
  const q = {
    kullanici: db.prepare("SELECT * FROM users WHERE id = ?"),
    kullaniciPid: db.prepare("SELECT * FROM users WHERE public_id = ?"),
    kullaniciEposta: db.prepare("SELECT * FROM users WHERE eposta = ?"),
    davetBelirtec: db.prepare("SELECT * FROM veli_baglantilari WHERE belirtec_hash = ? AND durum = 'davet'"),
    acikSay: db.prepare("SELECT COUNT(*) AS n FROM veli_baglantilari WHERE ogrenci_id = ? AND durum IN ('davet', 'aktif')"),
    acikDavetEposta: db.prepare("SELECT * FROM veli_baglantilari WHERE ogrenci_id = ? AND durum = 'davet' AND eposta = ?"),
    aktifCift: db.prepare("SELECT * FROM veli_baglantilari WHERE ogrenci_id = ? AND veli_id = ? AND durum = 'aktif'"),
    ogrenciListe: db.prepare(`SELECT b.*, v.ad AS v_ad, v.soyad AS v_soyad, v.eposta AS v_eposta FROM veli_baglantilari b
      LEFT JOIN users v ON v.id = b.veli_id WHERE b.ogrenci_id = ? AND b.durum IN ('davet', 'aktif') ORDER BY b.id`),
    cocuklar: db.prepare(`SELECT b.id AS bid, b.rapor, b.kabul, u.* FROM veli_baglantilari b JOIN users u ON u.id = b.ogrenci_id
      WHERE b.veli_id = ? AND b.durum = 'aktif' AND u.durum != 'silindi' ORDER BY b.id`),
    kayitEkle: db.prepare(`INSERT INTO users (public_id, eposta, kullanici_adi, ad, soyad, sifre_hash, rol, kvkk_onay, kosul_onay, veli_onay, olusturma, guncelleme)
      VALUES (?, ?, ?, ?, ?, ?, 'veli', ?, ?, 1, ?, ?)`),
    iptal: db.prepare("UPDATE veli_baglantilari SET durum = 'iptal', iptal_zamani = ?, iptal_eden = ?, belirtec_hash = NULL, rapor_belirtec = NULL WHERE id = ? AND durum IN ('davet', 'aktif')")
  };

  const genelVeli = b => ({
    id: b.id, durum: b.durum, eposta: b.v_eposta || b.eposta || null,
    ad: b.durum === "aktif" && b.v_ad ? (b.v_ad + " " + b.v_soyad).trim() : null,
    olusturma: b.olusturma, kabul: b.kabul || null, davetBitis: b.durum === "davet" ? b.davet_bitis : null
  });
  const davetLinki = tok => config.baseUrl + "/veli?t=" + encodeURIComponent(tok);
  const raporIptalLinki = tok => config.baseUrl + "/api/public/veli-rapor-iptal?t=" + encodeURIComponent(tok);
  function davetBul(tok) {
    if (!tok || typeof tok !== "string" || tok.length > 100) return null;
    const r = q.davetBelirtec.get(ozet(tok));
    if (!r || !r.davet_bitis || r.davet_bitis <= simdi()) return null;
    return r;
  }

  /** Davet satırını veliye bağlar (aynı çift zaten aktifse davet kapanır). Dönüş: bağlantı satırı */
  function baglan(davet, veli, req) {
    const z = simdi();
    let sonuc = null;
    islem(db, () => {
      const var_ = q.aktifCift.get(davet.ogrenci_id, veli.id);
      if (var_) {
        q.iptal.run(z, veli.id, davet.id);
        sonuc = var_;
        return;
      }
      db.prepare("UPDATE veli_baglantilari SET veli_id = ?, durum = 'aktif', kabul = ?, belirtec_hash = NULL, eposta = ?, rapor_belirtec = ? WHERE id = ? AND durum = 'davet'")
        .run(veli.id, z, veli.eposta, belirtec(24), davet.id);
      // Tek veli kimliği: eski veli raporu adresi bu veliyse adres onaylı sayılır (rapor artık veli hesabına gider)
      db.prepare("UPDATE notification_prefs SET veli_dogrulandi = COALESCE(veli_dogrulandi, ?), guncelleme = ? WHERE user_id = ? AND lower(veli_eposta) = lower(?)")
        .run(z, z, davet.ogrenci_id, veli.eposta);
      sonuc = db.prepare("SELECT * FROM veli_baglantilari WHERE id = ?").get(davet.id);
    });
    denetim({ eylem: "veli.baglandi", kullanici: davet.ogrenci_id, yapan: veli.id, istek: req, varlik: "veli_baglantilari", varlikId: sonuc.id });
    if (bildirim) {
      try {
        bildirim.olustur(davet.ogrenci_id, { tur: "duyuru", baslik: "Velin hesabına bağlandı",
          metin: (veli.ad + " " + veli.soyad).trim() + " artık haftalık çalışma özetini ve deneme sonuçlarını görebilir. Sorularını ve notlarını göremez. Profil › Veli bölümünden istediğin an kaldırabilirsin.",
          link: "/profil#veli" });
      } catch (e) { /* bildirim bağlamayı bozmaz */ }
    }
    return sonuc;
  }

  /** Aktif bağlantıyla veliye bağlı öğrenci (yoksa 404: başka öğrencinin varlığı sızdırılmaz) */
  function cocukAl(veli, pid) {
    const u = q.kullaniciPid.get(String(pid || ""));
    const b = u && u.durum !== "silindi" ? q.aktifCift.get(u.id, veli.id) : null;
    if (!b) throw new HttpHata(404, "Bu öğrenci hesabınıza bağlı değil.");
    return { u, b };
  }

  /** Bir öğrencinin veliye gösterilen özeti (yalnızca toplu sayılar ve sonuçlar). */
  function ozetAl(u, b, simdiMs) {
    simdiMs = simdiMs == null ? saat() : simdiMs;
    const aralik = zaman.haftaAraligi(zaman.hafta(simdiMs)), son = new Date(simdiMs).toISOString();
    const hafta = db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(dogru), 0) AS d FROM answers WHERE user_id = ? AND zaman >= ? AND zaman <= ?").get(u.id, aralik.bas, son);
    const haftaDeneme = db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(sure_sn), 0) AS sn FROM exams WHERE user_id = ? AND tarih >= ? AND tarih <= ?").get(u.id, aralik.bas, son);
    const toplam = db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(dogru), 0) AS d, MAX(zaman) AS son FROM answers WHERE user_id = ?").get(u.id);
    const sonDeneme = db.prepare("SELECT MAX(tarih) AS t FROM exams WHERE user_id = ?").get(u.id).t;
    const d = calismaDurumu ? calismaDurumu(u.id, simdiMs) : { seri: 0, bugunAktif: false };
    const profil = hesap.profilAl(u.id) || {};
    const T = takvim();
    // Ders ilerlemesi: seçilen dersler (seçim yoksa çalışılmış ders sayfaları)
    let dersler = AP.secilenler(profil);
    if (!dersler.length) {
      const sayfalar = db.prepare("SELECT DISTINCT sayfa FROM answers WHERE user_id = ?").all(u.id).map(r => r.sayfa);
      dersler = AP.DERSLER.filter(x => sayfalar.indexOf(x.sayfa) >= 0 && !x.kutu && x.ders !== "calculus-bc")
        .map(x => ({ ders: x.ders, hedef: null, ad: x.ad, sayfa: x.sayfa, kutu: null, deneme: x.deneme }));
    }
    const dersOzet = dersler.map(x => {
      const re = x.kutu ? new RegExp(x.kutu) : null;
      const cev = db.prepare("SELECT unite, soru, dogru FROM answers WHERE user_id = ? AND sayfa = ?").all(u.id, x.sayfa).filter(a => !re || re.test(a.unite));
      const banka = db.prepare("SELECT kutu FROM questions_bank WHERE tur = 'ders' AND durum = 'aktif' AND sayfa = ?").all(x.sayfa).filter(r => !re || re.test(r.kutu || "")).length;
      const cozulen = new Set(cev.map(a => a.soru)).size, dogru = cev.reduce((s, a) => s + (a.dogru ? 1 : 0), 0);
      const yuzde = cev.length ? Math.round(dogru / cev.length * 100) : null;
      const sd = db.prepare("SELECT yuzde, tahmini_band, tarih FROM exams WHERE user_id = ? AND kod = ? ORDER BY tarih DESC LIMIT 1").get(u.id, x.deneme);
      // Tahmini puan: son ders denemesinin bandı; deneme yoksa en az 10 cevabın doğruluğu (aynı eşikler)
      const tahmini = sd && sd.tahmini_band != null ? +sd.tahmini_band : cev.length >= 10 ? AP.tahminiPuan(yuzde) : null;
      // 1.27.0: en az 10 cevapta öğrencinin gördüğü modelle aynı tahmin (server/ilerleme.js dersOzeti → tahminModel)
      const mo = cev.length >= 10 ? ILERLEME.dersOzeti(db, u.id, x).tahminModel : null;
      return { ders: x.ders, ad: "AP " + x.ad, hedef: x.hedef, cevap: cev.length, cozulen, bankada: banka, kapsam: banka ? Math.min(100, Math.round(cozulen / banka * 100)) : null,
        dogruluk: yuzde, tahmini: mo ? mo.puan : tahmini, tahminiInce: mo ? mo.ince : sd && sd.tahmini_band != null ? +sd.tahmini_band : tahmini != null ? ILERLEME.inceTahmin(yuzde) : null,
        tahminKaynagi: mo ? mo.kaynak : sd && sd.tahmini_band != null ? "deneme" : tahmini != null ? "sorular" : null };
    });
    // 1.12.0: tam deneme sınavları (istemci_id "ts-…") da listede; yuzde = bileşik puan, tahminiPuan = tahmini AP puanı (1–5)
    const denemeler = db.prepare("SELECT istemci_id, kod, ad, tarih, soru_sayisi, dogru, yuzde, tahmini_band, sure_sn FROM exams WHERE user_id = ? ORDER BY tarih DESC LIMIT 5").all(u.id)
      .map(e => ({ kod: e.kod, ad: e.ad || e.kod, tarih: e.tarih, soru: e.soru_sayisi, dogru: e.dogru, yuzde: e.yuzde, tahminiPuan: e.tahmini_band != null ? +e.tahmini_band : null, sureDk: e.sure_sn ? Math.round(e.sure_sn / 60) : null,
        tamSinav: /^ts-/.test(String(e.istemci_id || "")) }));
    // Tarihler: AP sipariş son günü (okul koordinatörü) + seçilen derslerin sınav günleri (takvimde o yıl yoksa yalnızca ay)
    const bugun = zaman.gun(simdiMs), tarihler = [];
    if (T.kayit && T.kayit.sonGun && T.kayit.sonGun >= bugun) tarihler.push({ tur: "kayit", baslik: "AP sınav siparişi (kayıt) son günü", gun: T.kayit.sonGun, kesin: true });
    else if (T.kayit && T.kayit.gecKayitSon && T.kayit.gecKayitSon >= bugun) tarihler.push({ tur: "kayit", baslik: "AP geç sipariş son günü (ek ücretli)", gun: T.kayit.gecKayitSon, kesin: true });
    AP.sinavTarihleri(profil, T, new Date(simdiMs)).forEach(s => {
      if (!s.gun || s.gun >= bugun) tarihler.push({ tur: "sinav", baslik: s.ad + " sınavı", gun: s.gun, ay: s.gun ? null : "Mayıs " + s.yil, kesin: s.kesin });
    });
    const sonAktif = [toplam.son, sonDeneme, u.son_gorulme].filter(Boolean).sort().pop() || null;
    const uy = hesap.uyelik(u.id);
    return {
      id: u.public_id, ad: u.ad, soyad: u.soyad, sinif: profil.sinif || null, sinavYili: profil.sinavYili || AP.varsayilanSinavYili(profil.sinif, new Date(simdiMs)),
      rapor: !!b.rapor, baglanti: { kabul: b.kabul },
      hafta: { kod: zaman.hafta(simdiMs), soru: hafta.n, dogruluk: hafta.n ? Math.round(hafta.d / hafta.n * 100) : null, deneme: haftaDeneme.n,
        calismaDk: Math.round((hafta.n * SORU_SN + haftaDeneme.sn) / 60) },
      toplam: { soru: toplam.n, dogruluk: toplam.n ? Math.round(toplam.d / toplam.n * 100) : null },
      seri: d.seri + (d.bugunAktif ? 1 : 0), sonAktif,
      dersler: dersOzet, denemeler, tarihler,
      // 1.16.0: veli grafikleri (son 8 hafta soru/doğru/deneme; tahmini puan geçmişi, en çok 30 kayıt)
      grafik: { haftalik: ILERLEME.haftalik(db, u.id, simdiMs, 8).map(h => ({ hafta: h.hafta, pazartesi: h.pazartesi, soru: h.soru, dogru: h.dogru, deneme: h.deneme })),
        puanGecmisi: ILERLEME.puanGecmisi(db, u.id, 30) },
      uyelik: { premium: uy.premium, plan: uy.plan, bitis: uy.bitis, bekleyenTalep: uy.bekleyenTalep ? { plan: uy.bekleyenTalep.plan, olusturma: uy.bekleyenTalep.olusturma } : null }
    };
  }

  /** Haftalık rapor e-postasının metni (paneldeki özetle aynı veri) */
  function raporMetni(o, veli, b) {
    const s = [];
    s.push(o.ad + " bu hafta (" + o.hafta.kod + ")");
    s.push("• Çözülen soru: " + o.hafta.soru + (o.hafta.dogruluk != null ? " (doğruluk %" + o.hafta.dogruluk + ")" : ""));
    s.push("• Tahmini çalışma süresi: " + o.hafta.calismaDk + " dk" + (o.hafta.deneme ? " · tamamlanan deneme: " + o.hafta.deneme : ""));
    s.push("• Çalışma serisi: " + o.seri + " gün");
    if (o.sonAktif) s.push("• Son etkinlik: " + new Date(o.sonAktif).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long" }));
    if (o.dersler.length) {
      s.push("", "Dersler:");
      o.dersler.forEach(d => s.push("• " + d.ad + ": " + (d.tahmini != null ? "tahmini puan " + d.tahmini : "henüz tahmin yok") + (d.hedef ? " · hedef " + d.hedef : "") +
        (d.dogruluk != null ? " · doğruluk %" + d.dogruluk : "")));
    }
    if (o.denemeler[0]) { const e = o.denemeler[0]; s.push("", "Son deneme: " + e.ad + " · %" + e.yuzde + (e.tahminiPuan != null ? " · tahmini puan " + e.tahminiPuan : "")); }
    if (o.tarihler.length) {
      s.push("", "Yaklaşan tarihler:");
      o.tarihler.slice(0, 4).forEach(t => s.push("• " + t.baslik + ": " + (t.gun ? new Date(t.gun + "T12:00:00Z").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : t.ay + " (tarih henüz açıklanmadı)")));
    }
    s.push("", "Premium: " + (o.uyelik.premium ? "açık (bitiş " + new Date(o.uyelik.bitis).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" }) + ")" : "kapalı"));
    return "Merhaba " + veli.ad + ",\n\n" + s.join("\n") + "\n\nAyrıntılar veli panelinizde: " + config.baseUrl + "/veli\n\n" +
      "Bu özet, " + o.ad + " sizi veli olarak bağladığı için gönderiliyor. Soru-cevap yazışmaları ve notlar paylaşılmaz.\n" +
      "Haftalık özeti almak istemiyorsanız tek tıkla durdurun: " + raporIptalLinki(b.rapor_belirtec) + "\n\nMeberra";
  }

  return {
    veliYolIzinli, ozetAl, takvim,

    // --- öğrenci tarafı ------------------------------------------------------
    liste(ogrenci) { return q.ogrenciListe.all(ogrenci.id).map(genelVeli); },
    davetEt(ogrenci, f, req) {
      if (ogrenci.rol === "veli") throw new HttpHata(403, "Veli hesabı veli davet edemez.");
      const ep = kirp(f && f.eposta).toLowerCase();
      if (!ep || ep.length > 120 || !EPOSTA_RE.test(ep)) throw new HttpHata(400, "Geçerli bir e-posta adresi yaz.", { eposta: "Geçerli bir e-posta adresi yaz." });
      if (ogrenci.eposta && ep === String(ogrenci.eposta).toLowerCase()) throw new HttpHata(400, "Veli e-postası kendi adresinden farklı olmalı.", { eposta: "Kendi adresinden farklı olmalı." });
      const var_ = q.kullaniciEposta.get(ep);
      if (var_ && var_.rol !== "veli") throw new HttpHata(400, "Bu adres veli olarak eklenemez. Velinin kendi e-posta adresini yaz.", { eposta: "Bu adres veli olarak eklenemez." });
      if (var_ && q.aktifCift.get(ogrenci.id, var_.id)) throw new HttpHata(409, "Bu veli zaten hesabına bağlı.", { eposta: "Bu veli zaten bağlı." });
      const tok = belirtec(24), z = simdi(), bitis = new Date(Date.parse(z) + DAVET_GUN * GUN).toISOString();
      const eski = q.acikDavetEposta.get(ogrenci.id, ep);
      let id;
      if (eski) { // aynı adrese yeniden gönderim: yeni bağlantı, eskisi geçersiz
        db.prepare("UPDATE veli_baglantilari SET belirtec_hash = ?, davet_bitis = ?, olusturma = ? WHERE id = ?").run(ozet(tok), bitis, z, eski.id);
        id = eski.id;
      } else {
        if (q.acikSay.get(ogrenci.id).n >= EN_FAZLA_VELI) throw new HttpHata(409, "En fazla " + EN_FAZLA_VELI + " veli ekleyebilirsin. Önce birini kaldır.");
        id = Number(db.prepare("INSERT INTO veli_baglantilari (ogrenci_id, eposta, belirtec_hash, durum, olusturma, davet_bitis) VALUES (?, ?, ?, 'davet', ?, ?)")
          .run(ogrenci.id, ep, ozet(tok), z, bitis).lastInsertRowid);
      }
      eposta.gonder(ep, "Meberra veli paneli daveti: " + ogrenci.ad + " " + ogrenci.soyad,
        "Merhaba,\n\n" + ogrenci.ad + " " + ogrenci.soyad + " sizi Meberra'da veli olarak ekledi. Veli panelinde haftalık çalışma süresini, çözülen soruları, " +
        "doğruluk oranını, ders ilerlemesini, deneme sonuçlarını ve yaklaşan AP tarihlerini görebilirsiniz. Öğrencinin soru-cevap yazışmaları ve notları paylaşılmaz.\n\n" +
        "Daveti kabul etmek için bu bağlantıyı açın (" + DAVET_GUN + " gün geçerli):\n" + davetLinki(tok) + "\n\n" +
        "Meberra hesabınız yoksa bağlantıdan birkaç saniyede veli hesabı açabilirsiniz. Bu daveti beklemiyorsanız hiçbir şey yapmanız gerekmez.\n\nMeberra");
      denetim({ eylem: eski ? "veli.davet-yeniden" : "veli.davet", kullanici: ogrenci.id, istek: req, varlik: "veli_baglantilari", varlikId: id, ayrinti: { eposta: ep } });
      return genelVeli(db.prepare("SELECT * FROM veli_baglantilari WHERE id = ?").get(id));
    },
    ogrenciIptal(ogrenci, id, req) {
      const b = db.prepare("SELECT * FROM veli_baglantilari WHERE id = ? AND ogrenci_id = ?").get(+id || 0, ogrenci.id);
      if (!b || b.durum === "iptal") throw new HttpHata(404, "Bağlantı bulunamadı.");
      q.iptal.run(simdi(), ogrenci.id, b.id);
      // Tek veli kimliği: aynı adrese eski (veli e-postası) akışla giden haftalık rapor da durur
      const ep = b.veli_id ? (q.kullanici.get(b.veli_id) || {}).eposta : b.eposta;
      if (ep) db.prepare("UPDATE notification_prefs SET veli_raporu = 0, veli_dogrulandi = NULL, guncelleme = ? WHERE user_id = ? AND lower(veli_eposta) = lower(?)").run(simdi(), ogrenci.id, ep);
      denetim({ eylem: b.durum === "aktif" ? "veli.kaldirildi" : "veli.davet-iptal", kullanici: ogrenci.id, istek: req, varlik: "veli_baglantilari", varlikId: b.id,
        ayrinti: { veli: b.veli_id || null, kaldiran: "ogrenci" } });
      return true;
    },

    // --- davet / veli hesabı ---------------------------------------------------
    davetBilgi(tok) {
      const r = davetBul(tok);
      if (!r) return null;
      const o = q.kullanici.get(r.ogrenci_id);
      if (!o || o.durum !== "aktif") return null;
      const v = q.kullaniciEposta.get(r.eposta);
      return { ogrenci: { ad: o.ad, soyad: o.soyad.slice(0, 1) + "." }, eposta: r.eposta, hesapVar: !!v, hesapVeli: !!(v && v.rol === "veli"), bitis: r.davet_bitis };
    },
    /** Yeni veli hesabı + bağlantı. Dönüş: { kullanici, oturum } (hesap.giris ile oturum açılır) */
    kayit(f, req) {
      f = f || {};
      const r = davetBul(f.t);
      if (!r) throw new HttpHata(400, "Davet bağlantısının süresi dolmuş ya da geçersiz. Öğrenciden yeni davet isteyin.");
      const ad = kirp(f.ad), soyad = kirp(f.soyad), e = {};
      if (!ad) e.ad = "Adınızı yazın."; else if (ad.length > 40) e.ad = "En fazla 40 karakter.";
      if (!soyad) e.soyad = "Soyadınızı yazın."; else if (soyad.length > 40) e.soyad = "En fazla 40 karakter.";
      if (!f.sifre || String(f.sifre).length < 8) e.sifre = "Şifre en az 8 karakter olmalı.";
      else if (String(f.sifre).length > 128) e.sifre = "Şifre en fazla 128 karakter olabilir.";
      else if (f.sifre !== f.sifre2) e.sifre2 = "Şifreler eşleşmiyor.";
      if (f.kosullar !== true) e.kosullar = "Devam etmek için kullanım koşullarını kabul edin.";
      if (f.kvkk !== true) e.kvkk = "Devam etmek için KVKK aydınlatma metnini okuduğunuzu onaylayın.";
      if (f.veliRiza !== true) e.veliRiza = "Öğrencinin velisi olduğunuzu ve özet verilerin size gösterilmesini onaylayın.";
      if (Object.keys(e).length) throw new HttpHata(400, "Lütfen işaretli alanları düzeltin.", e);
      if (q.kullaniciEposta.get(r.eposta)) throw new HttpHata(409, "Bu e-posta ile bir hesap var. Giriş yapıp daveti kabul edin.", { eposta: "Hesap var: giriş yapın." });
      const z = simdi();
      const id = Number(q.kayitEkle.run(publicId(), r.eposta, r.eposta, ad, soyad, sifreOzetle(f.sifre), z, z, z, z).lastInsertRowid);
      denetim({ eylem: "auth.kayit", kullanici: id, istek: req, ayrinti: { rol: "veli", davet: r.id } });
      baglan(r, q.kullanici.get(id), req);
      return hesap.giris(r.eposta, f.sifre, req);
    },
    /** Oturum açmış veli daveti kabul eder (davet bu velinin adresine gönderilmiş olmalı) */
    kabul(veli, tok, req) {
      if (veli.rol !== "veli") throw new HttpHata(403, "Daveti kabul etmek için veli hesabıyla giriş yapın. Öğrenci hesabı veli olarak bağlanamaz.");
      const r = davetBul(tok);
      if (!r) throw new HttpHata(400, "Davet bağlantısının süresi dolmuş ya da geçersiz. Öğrenciden yeni davet isteyin.");
      if (String(r.eposta || "").toLowerCase() !== String(veli.eposta || "").toLowerCase()) throw new HttpHata(403, "Bu davet başka bir e-posta adresine gönderildi.");
      baglan(r, veli, req);
      return true;
    },

    // --- veli paneli -------------------------------------------------------------
    panel(veli, simdiMs) {
      return { veli: { ad: veli.ad, soyad: veli.soyad, eposta: veli.eposta }, cocuklar: q.cocuklar.all(veli.id).map(r => ozetAl(r, { rapor: r.rapor, kabul: r.kabul }, simdiMs)) };
    },
    raporAyar(veli, pid, rapor, req) {
      const { u, b } = cocukAl(veli, pid);
      const v = rapor === true || rapor === 1 || rapor === "1" || rapor === "true";
      db.prepare("UPDATE veli_baglantilari SET rapor = ?, rapor_belirtec = COALESCE(rapor_belirtec, ?) WHERE id = ?").run(v ? 1 : 0, belirtec(24), b.id);
      denetim({ eylem: "veli.rapor-ayar", kullanici: u.id, yapan: veli.id, istek: req, ayrinti: { rapor: v } });
      return v;
    },
    veliAyril(veli, pid, req) {
      const { u, b } = cocukAl(veli, pid);
      q.iptal.run(simdi(), veli.id, b.id);
      denetim({ eylem: "veli.kaldirildi", kullanici: u.id, yapan: veli.id, istek: req, varlik: "veli_baglantilari", varlikId: b.id, ayrinti: { veli: veli.id, kaldiran: "veli" } });
      return true;
    },
    /** Veli, çocuğunun hesabı için ödeme bildirimi verir (talep çocuğun hesabına açılır; yönetici onayı aynı akış) */
    premiumTalep(veli, pid, f, req) {
      const { u } = cocukAl(veli, pid);
      if (u.durum !== "aktif") throw new HttpHata(409, "Öğrenci hesabı aktif değil.");
      const talep = hesap.talepOlustur(u, f || {}, req);
      db.prepare("UPDATE upgrade_requests SET veli_id = ? WHERE id = ?").run(veli.id, talep.id);
      denetim({ eylem: "veli.premium-talep", kullanici: u.id, yapan: veli.id, istek: req, varlik: "upgrade_requests", varlikId: talep.id, ayrinti: { plan: talep.plan } });
      return { talep, uyelik: hesap.uyelik(u.id) };
    },
    raporIptal(tok) {
      if (!tok || typeof tok !== "string" || tok.length > 100) return null;
      const b = db.prepare("SELECT * FROM veli_baglantilari WHERE rapor_belirtec = ? AND durum = 'aktif'").get(tok);
      if (!b) return null;
      db.prepare("UPDATE veli_baglantilari SET rapor = 0 WHERE id = ?").run(b.id);
      denetim({ eylem: "veli.rapor-ayar", kullanici: b.ogrenci_id, yapan: b.veli_id, ayrinti: { rapor: false, kaynak: "e-posta" } });
      return "Haftalık çalışma özeti durduruldu. Veli panelinizden istediğiniz zaman yeniden açabilirsiniz.";
    },

    /** Zamanlayıcı: pazar 18:00 (İstanbul) sonrası, aktif bağlantısı ve raporu açık her veliye çocuk başına bir e-posta */
    haftalikRaporlar(simdiMs) {
      const p = zaman.parcalar(simdiMs);
      if (p.haftaGunu !== 7 || p.saat < 18) return 0;
      const adaylar = db.prepare(`SELECT b.id AS bid, b.rapor_belirtec, b.veli_id, v.ad AS v_ad, v.eposta AS v_eposta, u.* FROM veli_baglantilari b
        JOIN users u ON u.id = b.ogrenci_id JOIN users v ON v.id = b.veli_id
        WHERE b.durum = 'aktif' AND b.rapor = 1 AND u.durum = 'aktif' AND v.durum = 'aktif' AND v.eposta IS NOT NULL`).all();
      const kaydet = db.prepare("INSERT OR IGNORE INTO reminder_log (user_id, tur, gun, zaman, ayrinti) VALUES (?, ?, ?, ?, ?)");
      let n = 0;
      for (const a of adaylar) {
        if (Number(kaydet.run(a.id, "veli-panel:" + a.veli_id, p.tarih, simdi(), null).changes) !== 1) continue;
        let tok = a.rapor_belirtec;
        if (!tok) { tok = belirtec(24); db.prepare("UPDATE veli_baglantilari SET rapor_belirtec = ? WHERE id = ?").run(tok, a.bid); }
        const o = ozetAl(a, { rapor: 1 }, simdiMs);
        eposta.gonder(a.v_eposta, "Meberra haftalık özet: " + a.ad, raporMetni(o, { ad: a.v_ad }, { rapor_belirtec: tok }));
        n++;
      }
      return n;
    },

    /** Yönetici: bir kullanıcının veli/öğrenci bağlantıları */
    yoneticiListe(u) {
      return db.prepare(`SELECT b.id, b.durum, b.eposta, b.olusturma, b.kabul, b.iptal_zamani, b.rapor,
          o.public_id AS o_id, o.ad AS o_ad, o.soyad AS o_soyad, v.public_id AS v_id, v.ad AS v_ad, v.soyad AS v_soyad, v.eposta AS v_eposta
        FROM veli_baglantilari b JOIN users o ON o.id = b.ogrenci_id LEFT JOIN users v ON v.id = b.veli_id
        WHERE b.ogrenci_id = ? OR b.veli_id = ? ORDER BY b.id DESC LIMIT 100`).all(u.id, u.id).map(r => ({
        id: r.id, durum: r.durum, olusturma: r.olusturma, kabul: r.kabul, iptal: r.iptal_zamani, rapor: !!r.rapor,
        ogrenci: { id: r.o_id, ad: r.o_ad + " " + r.o_soyad }, veli: r.v_id ? { id: r.v_id, ad: r.v_ad + " " + r.v_soyad, eposta: r.v_eposta } : { eposta: r.eposta }
      }));
    }
  };
}

/** Rotalar. c: { veli, hesap, oturumGerekli, yoneticiGerekli, htmlSayfa, oturumYanit, kayitSiniri } */
function veliRotalari(r, c) {
  const { veli, oturumGerekli, yoneticiGerekli, htmlSayfa, oturumYanit } = c;
  const sinir = { davet: hizSinirlayici(10, 60 * 60e3), kayit: hizSinirlayici(c.kayitSiniri || 10, 60 * 60e3), bilgi: hizSinirlayici(60, 15 * 60e3) };
  const ogrenciGerekli = req => { oturumGerekli(req); if (req.kullanici.rol === "veli") throw new HttpHata(403, "Bu işlem öğrenci hesabı içindir."); };
  const veliGerekli = req => { oturumGerekli(req); if (req.kullanici.rol !== "veli") throw new HttpHata(403, "Bu sayfa veli hesapları içindir."); };

  // Öğrenci: velilerim
  r.get("/api/veli/baglantilar", req => { ogrenciGerekli(req); return { ok: true, veliler: veli.liste(req.kullanici) }; });
  r.post("/api/veli/davet", req => {
    ogrenciGerekli(req);
    if (!sinir.davet.dene("u:" + req.kullanici.id)) throw new HttpHata(429, "Çok fazla davet gönderdin. Biraz sonra tekrar dene.");
    return { ok: true, davet: veli.davetEt(req.kullanici, req.body || {}, req), veliler: veli.liste(req.kullanici) };
  });
  r.post("/api/veli/baglantilar/:id/iptal", req => {
    ogrenciGerekli(req);
    veli.ogrenciIptal(req.kullanici, req.params.id, req);
    return { ok: true, veliler: veli.liste(req.kullanici) };
  });

  // Davet (oturum gerekmez; belirteç yeterli)
  r.get("/api/public/veli-davet", req => {
    if (!sinir.bilgi.dene(req.ip)) throw new HttpHata(429, "Çok fazla istek. Biraz sonra tekrar deneyin.");
    const b = veli.davetBilgi(req.sorgu.get("t"));
    if (!b) throw new HttpHata(404, "Davet bağlantısının süresi dolmuş ya da geçersiz. Öğrenciden yeni davet isteyin.");
    return { ok: true, davet: b };
  });
  r.get("/api/public/veli-rapor-iptal", (req, res) => {
    const m = veli.raporIptal(req.sorgu.get("t"));
    if (!m) return htmlSayfa(res, 404, "Bağlantı geçersiz", "Bu bağlantı geçersiz ya da artık kullanılmıyor. Rapor ayarını veli panelinizden değiştirebilirsiniz.");
    htmlSayfa(res, 200, "Tamam", m);
  });
  r.post("/api/veli/kayit", (req, res) => {
    if (!sinir.kayit.dene(req.ip)) throw new HttpHata(429, "Çok fazla kayıt denemesi. Biraz sonra tekrar deneyin.");
    const s = veli.kayit(req.body || {}, req);
    return oturumYanit(res, s.kullanici, s.oturum);
  });
  r.post("/api/veli/kabul", req => {
    oturumGerekli(req);
    veli.kabul(req.kullanici, (req.body || {}).t, req);
    return { ok: true };
  });

  // Veli paneli
  r.get("/api/veli/panel", req => { veliGerekli(req); return Object.assign({ ok: true }, veli.panel(req.kullanici)); });
  r.post("/api/veli/cocuk/:id/rapor", req => { veliGerekli(req); return { ok: true, rapor: veli.raporAyar(req.kullanici, req.params.id, (req.body || {}).rapor, req) }; });
  r.post("/api/veli/cocuk/:id/ayril", req => { veliGerekli(req); veli.veliAyril(req.kullanici, req.params.id, req); return { ok: true }; });
  r.post("/api/veli/cocuk/:id/premium-talep", req => {
    veliGerekli(req);
    return Object.assign({ ok: true }, veli.premiumTalep(req.kullanici, req.params.id, req.body || {}, req));
  });

  // Yönetici
  r.get("/api/admin/veli-baglantilari", req => {
    yoneticiGerekli(req);
    const u = c.db.prepare("SELECT * FROM users WHERE public_id = ?").get(String(req.sorgu.get("kullanici") || ""));
    if (!u) throw new HttpHata(404, "Kullanıcı bulunamadı.");
    return { ok: true, baglantilar: veli.yoneticiListe(u) };
  });
  return { sinir };
}

module.exports = { veliServisi, veliRotalari, veliYolIzinli, takvim };
