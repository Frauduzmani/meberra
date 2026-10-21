/**
 * Meberra — ürün yapılandırması (tarayıcı modu için yedek kaynak). Marka adı, fiyatlar ve ücretsiz/Premium sınırları.
 * Sunucu modunda (<meta name="meberra-api">) asıl kaynak sunucudur: server/config.js (ortam değişkenleriyle ezilebilir),
 * GET /api/public/config. Sayfalar fiyatı MEBERRA_URUN_AL(cb) ile okur: cb önce bu dosyadaki değerlerle, sunucu
 * yanıt verince de sunucunun değerleriyle yeniden çağrılır.
 */
(function () {
  "use strict";
  // Yıllık plan açıklaması fiyatlardan hesaplanır (server/config.js aynı formülü kullanır)
  function yillikAciklama(aylik, yillik) {
    var ay = Math.round(yillik / 12), tasarruf = Math.round((1 - yillik / (aylik * 12)) * 100);
    var ayYazi; try { ayYazi = ay.toLocaleString("tr-TR"); } catch (e) { ayYazi = String(ay); }
    return "Ayda yaklaşık " + ayYazi + " ₺" + (tasarruf > 0 ? " · %" + tasarruf + " tasarruf" : "");
  }
  var AYLIK = 199, YILLIK = 1490;
  var URUN = Object.freeze({
    marka: "Meberra",
    slogan: "AP sınavlarına ve Avrupa'da üniversiteye adım adım hazırlık",
    destekEposta: "destek@meberra.com",
    para: "₺",
    planlar: Object.freeze([
      Object.freeze({ id: "aylik", ad: "Aylık", fiyat: AYLIK, donem: "ay", aciklama: "İstediğin zaman bırak" }),
      Object.freeze({ id: "yillik", ad: "Yıllık", fiyat: YILLIK, donem: "yıl", aciklama: yillikAciklama(AYLIK, YILLIK), oneCikan: true })
    ]),
    // Ücretsiz kullanım sınırları (istemci arayüzü; sunucu da aynı kuralı uygular)
    ucretsiz: Object.freeze({
      uniteSayisi: 2,      // her derste ilk 2 ünite (konu anlatımı + sorular)
      dersDenemesi: 1      // her dersten 1 deneme
    })
  });
  window.MEBERRA_URUN = URUN;

  var sunucu = null; // GET /api/public/config sözü (bir kez istenir)
  /** cb(urun): önce yerel değerlerle, sunucu modunda yanıt gelince sunucu değerleriyle (planlar, sınırlar, e-posta) yeniden. */
  window.MEBERRA_URUN_AL = function (cb) {
    cb(URUN);
    if (typeof document === "undefined" || !document.querySelector('meta[name="meberra-api"]') || typeof fetch !== "function") return;
    if (!sunucu) sunucu = fetch("/api/public/config", { credentials: "same-origin" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    sunucu.then(function (c) {
      if (!c || !c.ok || !Array.isArray(c.planlar) || !c.planlar.length) return;
      cb({
        marka: c.marka || URUN.marka, slogan: URUN.slogan, destekEposta: c.destekEposta || URUN.destekEposta, para: c.para || URUN.para,
        planlar: c.planlar, ucretsiz: c.ucretsiz || URUN.ucretsiz, banka: c.banka || null
      });
    });
  };
})();
