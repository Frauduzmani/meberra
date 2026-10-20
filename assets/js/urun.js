/**
 * Meberra — ürün yapılandırması (tek kaynak). Marka adı, fiyatlar ve ücretsiz/Premium sınırları buradan okunur.
 * Sunucu tarafı aynı değerleri server/config.js içinde ortam değişkenleriyle ezebilir (GET /api/public/config).
 */
(function () {
  "use strict";
  window.MEBERRA_URUN = Object.freeze({
    marka: "Meberra",
    slogan: "AP sınavlarına ve Avrupa'da üniversiteye adım adım hazırlık",
    destekEposta: "destek@meberra.com",
    para: "₺",
    planlar: Object.freeze([
      Object.freeze({ id: "aylik", ad: "Aylık", fiyat: 199, donem: "ay", aciklama: "İstediğin zaman bırak" }),
      Object.freeze({ id: "yillik", ad: "Yıllık", fiyat: 1490, donem: "yıl", aciklama: "Ayda yaklaşık 124 ₺ · %38 tasarruf", oneCikan: true })
    ]),
    // Ücretsiz kullanım sınırları (istemci arayüzü; sunucu da aynı kuralı uygular)
    ucretsiz: Object.freeze({
      uniteSayisi: 2,      // her derste ilk 2 ünite (konu anlatımı + sorular)
      dersDenemesi: 1      // her dersten 1 deneme
    })
  });
})();
