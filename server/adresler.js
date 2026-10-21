"use strict";
// 1.8.0 Temiz adresler: sunucu tarafı adres tablosu. Ortak liste assets/js/adresler.js'tedir (istemci de kullanır);
// yönetim paneli yalnızca burada tanımlıdır, böylece herkese açık JS dosyalarında yolu görünmez.
const ORTAK = require("../assets/js/adresler.js");

const YONETIM = { yol: "/yonetim", dosya: "admin.html", yonetici: true };
const LISTE = ORTAK.LISTE.concat([YONETIM]);

/** Temiz yol → kayıt ({ yol, dosya, herkese?, takma?, yonetici? }) | null */
function yoldan(yol) { return yol === YONETIM.yol ? YONETIM : ORTAK.yoldan(yol); }
/** Dosya adı → temiz yol (admin.html → /yonetim; çağıran yetkiyi kendisi denetler) | null */
function dosyadan(dosya) { return String(dosya || "").toLowerCase() === YONETIM.dosya ? YONETIM.yol : ORTAK.dosyadan(dosya); }
/** Herkese açık sayfaların yolları (site haritası, canonical) */
const herkeseAcik = () => ORTAK.LISTE.filter(g => g.herkese).map(g => g.yol);

module.exports = { LISTE, YONETIM, yoldan, dosyadan, herkeseAcik, temiz: ORTAK.temiz, sayfaAdres: ORTAK.sayfaAdres };
