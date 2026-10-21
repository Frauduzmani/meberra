"use strict";
// Europe/Istanbul takvim yardımcıları (gün, ay, ISO hafta, sessiz saatler). Tüm fonksiyonlar dışarıdan verilen
// zamanla (ms) çalışır; böylece zamanlayıcı ve lig testleri sahte saatle sınanabilir.
const TZ = "Europe/Istanbul";
const GUN_MS = 864e5;
const SESSIZ = { bas: 22, bit: 8 }; // 22:00–08:00 arası hatırlatma/push yok

const bicim = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short"
});
const HAFTA_GUNU = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

/** İstanbul yerel parçaları: { yil, ay, gun, saat, dakika, haftaGunu (1=Pzt..7=Paz), tarih: "YYYY-MM-DD" } */
function parcalar(ms) {
  const o = {};
  bicim.formatToParts(new Date(ms)).forEach(p => { o[p.type] = p.value; });
  return { yil: +o.year, ay: +o.month, gun: +o.day, saat: +o.hour % 24, dakika: +o.minute, haftaGunu: HAFTA_GUNU[o.weekday], tarih: o.year + "-" + o.month + "-" + o.day };
}
const gun = ms => parcalar(ms).tarih;
/** İstanbul'un UTC farkı (ms) — 2016'dan beri sabit +3, yine de Intl'den okunur */
function ofset(ms) {
  const p = parcalar(ms);
  return Date.UTC(p.yil, p.ay - 1, p.gun, p.saat, p.dakika) - Math.floor(ms / 60000) * 60000;
}
const ayir = t => String(t).split("-").map(Number);
/** "YYYY-MM-DD" İstanbul gününün başlangıcı (UTC ms) */
function gunBaslangic(tarih) { const [y, m, d] = ayir(tarih); const t = Date.UTC(y, m - 1, d); return t - ofset(t); }
function gunEkle(tarih, n) { const [y, m, d] = ayir(tarih); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); }
/** "YYYY-MM-DD" → ISO hafta "YYYY-Www" */
function isoHafta(tarih) {
  const [y, m, d] = ayir(tarih);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const g = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - g);
  const yil = dt.getUTCFullYear();
  const no = Math.ceil(((dt - Date.UTC(yil, 0, 1)) / GUN_MS + 1) / 7);
  return yil + "-W" + String(no).padStart(2, "0");
}
const hafta = ms => isoHafta(gun(ms));
function haftaPazartesi(h) {
  const m = /^(\d{4})-W(\d{2})$/.exec(String(h));
  if (!m) throw new Error("Geçersiz hafta: " + h);
  const ocak4 = Date.UTC(+m[1], 0, 4), g = new Date(ocak4).getUTCDay() || 7;
  return new Date(ocak4 - (g - 1) * GUN_MS + (+m[2] - 1) * 7 * GUN_MS).toISOString().slice(0, 10);
}
/** Haftanın UTC aralığı: { bas, bit } ISO (bit hariç), pazartesi "YYYY-MM-DD" */
function haftaAraligi(h) {
  const pzt = haftaPazartesi(h);
  return { pazartesi: pzt, bas: new Date(gunBaslangic(pzt)).toISOString(), bit: new Date(gunBaslangic(gunEkle(pzt, 7))).toISOString() };
}
const oncekiHafta = h => isoHafta(gunEkle(haftaPazartesi(h), -7));
/** Takvim ayı: { anahtar: "YYYY-MM", bas: ISO } */
function ay(ms) {
  const p = parcalar(ms), anahtar = p.yil + "-" + String(p.ay).padStart(2, "0");
  return { anahtar, bas: new Date(gunBaslangic(anahtar + "-01")).toISOString() };
}
function sessizMi(ms) { const s = parcalar(ms).saat; return s >= SESSIZ.bas || s < SESSIZ.bit; }

module.exports = { TZ, SESSIZ, parcalar, gun, gunBaslangic, gunEkle, isoHafta, hafta, haftaAraligi, haftaPazartesi, oncekiHafta, ay, sessizMi, ofset };
