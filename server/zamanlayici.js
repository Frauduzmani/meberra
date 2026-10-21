"use strict";
// Zamanlayıcı: 10 dakikada bir tik(). Saat dışarıdan verilebilir (testler sahte saat kullanır).
//  - Lig: geçmiş haftaları kapatır (yükselme/düşme).
//  - Günlük hatırlatma: açık rıza vermiş (e-posta hatırlatması ya da push) kullanıcıya, kendi saatinde (İstanbul),
//    sessiz saatler (22:00–08:00) dışında, en fazla GÜNDE BİR mesaj. Serisi (≥1 gün) olup bugün henüz çalışmamışsa
//    ve/veya tekrar zamanı gelmiş sorusu varsa tek bir dostça mesajda birleştirilir. Bugün donmuş (seri dondurma) gün ise
//    gönderilmez. reminder_log (kullanıcı, tür, gün) birincil anahtarı tekrar gönderimi kesin olarak engeller.
//  - Haftalık veli raporu: pazar 18:00 (İstanbul) sonrası, veli e-postası onaylanmışsa.
const config = require("./config");
const { simdi } = require("./db");
const zaman = require("./zaman");

const SERI_ANAHTAR = "apmeberra:seri:v1", TEKRAR_ANAHTAR = "apmeberra:tekrar:v1";
const GERI_GUN = 120;
const isObj = v => v !== null && typeof v === "object" && !Array.isArray(v);
const coz = s => { try { return JSON.parse(s); } catch (e) { return null; } };
const TARIH_RE = /^\d{4}-\d{2}-\d{2}$/;

function zamanlayici(c) {
  const { db, bildirim, eposta, lig } = c;
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
        AND NOT EXISTS (SELECT 1 FROM reminder_log r WHERE r.user_id = n.user_id AND r.tur = 'veli-raporu' AND r.gun = ?)`).all(p.tarih);
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
    return n;
  }

  async function tik(simdiMs) {
    simdiMs = simdiMs == null ? Date.now() : simdiMs;
    const sonuc = { lig: 0, hatirlatma: 0, veliRaporu: 0 };
    try { sonuc.lig = lig.devir(simdiMs); } catch (e) { console.error("[zamanlayıcı] lig:", e); }
    if (zaman.sessizMi(simdiMs)) return sonuc;
    try { sonuc.hatirlatma = await hatirlatmalar(simdiMs); } catch (e) { console.error("[zamanlayıcı] hatırlatma:", e); }
    try { sonuc.veliRaporu = await veliRaporlari(simdiMs); } catch (e) { console.error("[zamanlayıcı] veli raporu:", e); }
    return sonuc;
  }

  let zamanlayiciId = null, ilk = null;
  return {
    tik, calismaDurumu,
    baslat(araligiMs) {
      if (zamanlayiciId) return;
      const calis = () => { tik().catch(e => console.error("[zamanlayıcı]", e)); };
      ilk = setTimeout(calis, 30e3); ilk.unref();
      zamanlayiciId = setInterval(calis, araligiMs || 10 * 60e3); zamanlayiciId.unref();
    },
    durdur() { clearInterval(zamanlayiciId); clearTimeout(ilk); zamanlayiciId = null; }
  };
}

module.exports = { zamanlayici };
