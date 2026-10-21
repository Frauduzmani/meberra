"use strict";
// Zamanlayıcı: 10 dakikada bir tik(). Saat dışarıdan verilebilir (testler sahte saat kullanır).
//  - Lig: geçmiş haftaları kapatır (yükselme/düşme).
//  - Günlük hatırlatma: açık rıza vermiş (e-posta hatırlatması ya da push) kullanıcıya, kendi saatinde (İstanbul),
//    sessiz saatler (22:00–08:00) dışında, en fazla GÜNDE BİR mesaj. Serisi (≥1 gün) olup bugün henüz çalışmamışsa
//    ve/veya tekrar zamanı gelmiş sorusu varsa tek bir dostça mesajda birleştirilir. Bugün donmuş (seri dondurma) gün ise
//    gönderilmez. reminder_log (kullanıcı, tür, gün) birincil anahtarı tekrar gönderimi kesin olarak engeller.
//  - Sistem günlüğü saklama: bilgi 7 gün, uyarı/hata 90 gün (gunluk.temizlik).
//  - Haftalık veli raporu: pazar 18:00 (İstanbul) sonrası, veli e-postası onaylanmışsa.
const config = require("./config");
const { simdi } = require("./db");
const zaman = require("./zaman");

const SERI_ANAHTAR = "apmeberra:seri:v1", TEKRAR_ANAHTAR = "apmeberra:tekrar:v1";
const GERI_GUN = 120;
const isObj = v => v !== null && typeof v === "object" && !Array.isArray(v);
const coz = s => { try { return JSON.parse(s); } catch (e) { return null; } };
const TARIH_RE = /^\d{4}-\d{2}-\d{2}$/;
const IP_SAKLAMA_GUN = 90;
const ISLER = { lig: "Lig devri", temizlik: "Log temizliği", erisim: "IP saklama / engel süresi", hatirlatma: "Günlük hatırlatma", veliRaporu: "Veli raporu" };

function zamanlayici(c) {
  const { db, bildirim, eposta, lig, gunluk } = c;
  // Son çalışma bilgisi (yönetici "Sistem" sekmesi): bellekte; sunucu yeniden başlayınca sıfırlanır
  const durumBilgi = { acik: false, aralikMs: null, sonCalisma: null, sonSure: null, sonSonuc: null, sonHata: null };
  const isHatasi = (is, e) => {
    durumBilgi.sonHata = { is, zaman: simdi(), mesaj: String((e && e.message) || e).slice(0, 300) };
    if (gunluk) gunluk.hata("zamanlayici", "Zamanlayıcı işi başarısız: " + is, { stack: e && e.stack, hata: String((e && e.message) || e).slice(0, 500) });
    else console.error("[zamanlayıcı] " + is + ":", e);
  };
  const durumAl = db.prepare("SELECT deger FROM user_state WHERE user_id = ? AND anahtar = ?");
  const kaydet = db.prepare("INSERT OR IGNORE INTO reminder_log (user_id, tur, gun, zaman, ayrinti) VALUES (?, ?, ?, ?, ?)");

  /** Kullanıcının çalışma durumu: { bugunAktif, donmusBugun, seri, tekrar } (seri: dünden geriye ardışık gün; donmuş günler seriyi bozmaz) */
  function calismaDurumu(userId, simdiMs) {
    const bugun = zaman.gun(simdiMs);
    const bas = new Date(zaman.gunBaslangic(zaman.gunEkle(bugun, -GERI_GUN))).toISOString();
    const saatler = db.prepare(`SELECT DISTINCT substr(zaman, 1, 13) AS s FROM answers WHERE user_id = ? AND zaman >= ?
      UNION SELECT DISTINCT substr(tarih, 1, 13) FROM exams WHERE user_id = ? AND tarih >= ?`).all(userId, bas, userId, bas);
    const aktif = new Set();
    saatler.forEach(r => { const t = Date.parse(r.s + ":00:00Z"); if (!isNaN(t) && t <= simdiMs) aktif.add(zaman.gun(t)); });
    const seriVeri = coz((durumAl.get(userId, SERI_ANAHTAR) || {}).deger);
    const donmus = new Set(isObj(seriVeri) && Array.isArray(seriVeri.donmus) ? seriVeri.donmus.filter(d => TARIH_RE.test(d)) : []);
    let seri = 0, d = zaman.gunEkle(bugun, -1);
    for (let i = 0; i < GERI_GUN && (aktif.has(d) || donmus.has(d)); i++) { if (aktif.has(d)) seri++; d = zaman.gunEkle(d, -1); }
    const tekrarVeri = coz((durumAl.get(userId, TEKRAR_ANAHTAR) || {}).deger);
    let tekrar = 0;
    if (isObj(tekrarVeri)) Object.keys(tekrarVeri).forEach(k => {
      const e = tekrarVeri[k];
      if (isObj(e) && !e.silindi && TARIH_RE.test(String(e.sonraki)) && e.sonraki <= bugun) tekrar++;
    });
    return { bugun, bugunAktif: aktif.has(bugun), donmusBugun: donmus.has(bugun), seri, tekrar };
  }

  function hatirlatmaMetni(d) {
    if (d.seri >= 1) return {
      tur: "seri", baslik: "Serin seni bekliyor",
      metin: d.seri + " günlük serin harika gidiyor! Bugün birkaç soruyla devam etmek ister misin?" + (d.tekrar ? " Ayrıca tekrar zamanı gelen " + d.tekrar + " soru var." : "")
    };
    return { tur: "tekrar", baslik: "Tekrar zamanı", metin: "Tekrar zamanı gelen " + d.tekrar + " soru var. Kısa bir tekrar, öğrendiklerini kalıcı yapar." };
  }

  async function hatirlatmalar(simdiMs) {
    const p = zaman.parcalar(simdiMs);
    const adaylar = db.prepare(`SELECT n.*, u.ad FROM notification_prefs n JOIN users u ON u.id = n.user_id
      WHERE u.durum = 'aktif' AND (n.eposta_hatirlatma = 1 OR n.push = 1) AND n.hatirlatma_saati <= ?
        AND NOT EXISTS (SELECT 1 FROM reminder_log r WHERE r.user_id = n.user_id AND r.tur = 'hatirlatma' AND r.gun = ?)`).all(p.saat, p.tarih);
    let n = 0;
    for (const a of adaylar) {
      const d = calismaDurumu(a.user_id, simdiMs);
      if (d.bugunAktif || d.donmusBugun || (d.seri < 1 && d.tekrar < 1)) continue;
      if (Number(kaydet.run(a.user_id, "hatirlatma", p.tarih, simdi(), JSON.stringify({ seri: d.seri, tekrar: d.tekrar })).changes) !== 1) continue;
      const m = hatirlatmaMetni(d), link = "/calis.html";
      const b = bildirim.olustur(a.user_id, { tur: m.tur, baslik: m.baslik, metin: m.metin, link }, {
        push: !!a.push, simdiMs,
        eposta: a.eposta_hatirlatma ? {
          konu: "Meberra: " + m.baslik,
          metin: "Merhaba " + a.ad + ",\n\n" + m.metin + "\n\nKaldığın yerden devam et: " + config.baseUrl + link +
            "\n\nBu hatırlatmayı sen açtın; günde en fazla bir kez gelir. Almak istemiyorsan tek tıkla durdur: " + bildirim.iptalLinki(a, "hatirlatma") +
            "\n\nİyi çalışmalar,\nMeberra"
        } : null
      });
      await b.push;
      n++;
    }
    return n;
  }

  async function veliRaporlari(simdiMs) {
    const p = zaman.parcalar(simdiMs);
    if (p.haftaGunu !== 7 || p.saat < 18) return 0;
    const adaylar = db.prepare(`SELECT n.*, u.ad, u.soyad FROM notification_prefs n JOIN users u ON u.id = n.user_id
      WHERE u.durum = 'aktif' AND n.veli_raporu = 1 AND n.veli_eposta IS NOT NULL AND n.veli_dogrulandi IS NOT NULL AND n.veli_belirtec IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM reminder_log r WHERE r.user_id = n.user_id AND r.tur = 'veli-raporu' AND r.gun = ?)
        AND NOT EXISTS (SELECT 1 FROM veli_baglantilari b JOIN users v ON v.id = b.veli_id WHERE b.ogrenci_id = n.user_id AND b.durum = 'aktif'
          AND lower(v.eposta) = lower(n.veli_eposta))`).all(p.tarih); // 1.7.0: bu adres veli hesabı olarak bağlıysa rapor (ve tercihi) veli panelinden
    const aralik = zaman.haftaAraligi(zaman.hafta(simdiMs)), son = new Date(simdiMs).toISOString();
    let n = 0;
    for (const a of adaylar) {
      if (Number(kaydet.run(a.user_id, "veli-raporu", p.tarih, simdi(), null).changes) !== 1) continue;
      const c1 = db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(dogru), 0) AS d FROM answers WHERE user_id = ? AND zaman >= ? AND zaman <= ?").get(a.user_id, aralik.bas, son);
      const den = db.prepare("SELECT COUNT(*) AS n FROM exams WHERE user_id = ? AND tarih >= ? AND tarih <= ?").get(a.user_id, aralik.bas, son).n;
      const d = calismaDurumu(a.user_id, simdiMs), seri = d.seri + (d.bugunAktif ? 1 : 0);
      const satirlar = c1.n
        ? [a.ad + " bu hafta Meberra'da " + c1.n + " soru çözdü (doğruluk %" + Math.round(c1.d / c1.n * 100) + ")."]
        : [a.ad + " bu hafta henüz soru çözmedi. Yeni hafta, küçük adımlarla başlamak için harika bir fırsat."];
      if (seri > 0) satirlar.push("Çalışma serisi: " + seri + " gün.");
      if (den > 0) satirlar.push("Bu hafta tamamlanan deneme: " + den + ".");
      const tab = config.baseUrl + "/api/public/veli?t=" + encodeURIComponent(a.veli_belirtec);
      eposta.gonder(a.veli_eposta, "Meberra haftalık çalışma özeti: " + a.ad,
        "Merhaba,\n\n" + satirlar.join("\n") + "\n\nDüzenli ve küçük adımlar en iyi sonucu verir; desteğiniz için teşekkürler.\n\n" +
        "Bu özeti " + a.ad + " " + a.soyad + " istedi ve siz onayladınız. Almak istemiyorsanız tek tıkla durdurun: " + tab + "&islem=iptal\n\nMeberra");
      n++;
    }
    for (const f of ekRaporlar) n += (await f(simdiMs)) || 0; // 1.7.0: veli paneli raporları (server/veli.js)
    return n;
  }
  const ekRaporlar = [];

  /** KVKK saklama: 90 günden eski IP'ler silinir (users.son_ip / son_giris_ip, sessions.ip / son_ip); süresi dolan
   *  yönetici engelleri kalkar; 400 günden eski giriş sayaçları ve süresi dolan IP engelleri silinir. */
  function erisimTemizligi(simdiMs) {
    const sinir = new Date(simdiMs - IP_SAKLAMA_GUN * 864e5).toISOString(), z = simdi();
    const s = { ip: 0, oturumIp: 0, engel: 0, ipEngeli: 0, girisSayaci: 0 };
    s.ip += Number(db.prepare("UPDATE users SET son_ip = NULL WHERE son_ip IS NOT NULL AND (son_gorulme IS NULL OR son_gorulme < ?)").run(sinir).changes);
    s.ip += Number(db.prepare("UPDATE users SET son_giris_ip = NULL WHERE son_giris_ip IS NOT NULL AND (son_giris IS NULL OR son_giris < ?)").run(sinir).changes);
    s.oturumIp = Number(db.prepare("UPDATE sessions SET ip = NULL, son_ip = NULL WHERE (ip IS NOT NULL OR son_ip IS NOT NULL) AND COALESCE(son_gorulme, son_kullanim) < ?").run(sinir).changes);
    const bitenler = db.prepare("SELECT id, engel_bitis FROM users WHERE durum = 'askida' AND engel_zamani IS NOT NULL AND engel_bitis IS NOT NULL AND engel_bitis <= ?").all(z);
    bitenler.forEach(u => {
      if (Number(db.prepare("UPDATE users SET durum = 'aktif', engel_zamani = NULL, engel_bitis = NULL, engel_nedeni = NULL, engelleyen = NULL, guncelleme = ? WHERE id = ? AND durum = 'askida'").run(z, u.id).changes)) {
        s.engel++;
        if (c.denetim) c.denetim({ eylem: "hesap.engel-sona-erdi", kullanici: u.id, ayrinti: { bitis: u.engel_bitis } });
      }
    });
    s.ipEngeli = c.ipEngel ? c.ipEngel.temizle() : 0;
    s.girisSayaci = Number(db.prepare("DELETE FROM giris_sayilari WHERE gun < ?").run(zaman.gunEkle(zaman.gun(simdiMs), -400)).changes);
    return s;
  }

  // İş başına son çalışma (yönetici "Sistem" sekmesi)
  const isBilgi = {};
  async function isCalistir(ad, fn) {
    const bas = Date.now();
    try {
      const sonuc = await fn();
      isBilgi[ad] = { sonCalisma: simdi(), sureMs: Date.now() - bas, sonuc, hata: null };
      return sonuc;
    } catch (e) {
      isBilgi[ad] = { sonCalisma: simdi(), sureMs: Date.now() - bas, sonuc: null, hata: String((e && e.message) || e).slice(0, 300) };
      isHatasi(ISLER[ad] || ad, e);
      return null;
    }
  }

  async function tik(simdiMs) {
    simdiMs = simdiMs == null ? Date.now() : simdiMs;
    const bas = Date.now();
    const sonuc = { lig: 0, hatirlatma: 0, veliRaporu: 0, gunlukSilinen: 0, erisim: null };
    const bitir = () => { durumBilgi.sonCalisma = simdi(); durumBilgi.sonSure = Date.now() - bas; durumBilgi.sonSonuc = sonuc; return sonuc; };
    sonuc.lig = (await isCalistir("lig", () => lig.devir(simdiMs))) || 0;
    // Sistem günlüğü saklama: bilgi 7 gün, uyarı/hata 90 gün
    if (gunluk) sonuc.gunlukSilinen = (await isCalistir("temizlik", () => gunluk.temizlik(simdiMs))) || 0;
    sonuc.erisim = await isCalistir("erisim", () => erisimTemizligi(simdiMs));
    if (zaman.sessizMi(simdiMs)) return bitir();
    sonuc.hatirlatma = (await isCalistir("hatirlatma", () => hatirlatmalar(simdiMs))) || 0;
    sonuc.veliRaporu = (await isCalistir("veliRaporu", () => veliRaporlari(simdiMs))) || 0;
    return bitir();
  }

  /** Yönetici "Şimdi çalıştır": tek iş. Hatırlatma/veli raporu kendi kurallarına uyar (sessiz saat, günde bir). */
  async function calistir(ad, simdiMs) {
    simdiMs = simdiMs == null ? Date.now() : simdiMs;
    if (ad === "hatirlatma" || ad === "veliRaporu") {
      if (zaman.sessizMi(simdiMs)) return { calisti: false, neden: "Sessiz saatler (22:00–08:00): hatırlatma gönderilmez." };
      return { calisti: true, sonuc: await isCalistir(ad, () => (ad === "hatirlatma" ? hatirlatmalar(simdiMs) : veliRaporlari(simdiMs))) };
    }
    if (ad === "lig") return { calisti: true, sonuc: await isCalistir("lig", () => lig.devir(simdiMs)) };
    if (ad === "temizlik") return { calisti: true, sonuc: await isCalistir("temizlik", () => (gunluk ? gunluk.temizlik(simdiMs) : 0)) };
    if (ad === "erisim") return { calisti: true, sonuc: await isCalistir("erisim", () => erisimTemizligi(simdiMs)) };
    return null;
  }

  let zamanlayiciId = null, ilk = null;
  return {
    tik, calismaDurumu, calistir, erisimTemizligi,
    /** Haftalık veli raporu işine ek gönderici (pazar 18:00 kuralını gönderici kendisi uygular) */
    raporEkle(f) { if (typeof f === "function") ekRaporlar.push(f); },
    durum: () => Object.assign({}, durumBilgi, { isler: Object.keys(ISLER).map(ad => Object.assign({ ad, baslik: ISLER[ad] }, isBilgi[ad] || {})) }),
    baslat(araligiMs) {
      if (zamanlayiciId) return;
      durumBilgi.acik = true; durumBilgi.aralikMs = araligiMs || 10 * 60e3;
      const calis = () => { tik().catch(e => isHatasi("tik", e)); };
      ilk = setTimeout(calis, 30e3); ilk.unref();
      zamanlayiciId = setInterval(calis, araligiMs || 10 * 60e3); zamanlayiciId.unref();
    },
    durdur() { clearInterval(zamanlayiciId); clearTimeout(ilk); zamanlayiciId = null; durumBilgi.acik = false; }
  };
}

module.exports = { zamanlayici, IP_SAKLAMA_GUN, ISLER };
