// Meberra — 1.14.0 Ekonomi + English taslaklarının bağımsız denetim kararlarını uygular ve bankaya ekler
// Girdiler: araclar/yeni-sorular2/ekonomi-english.json (85 taslak + pasajlar), araclar/onay2/ekonomi-english.json (onay | duzelt | red)
// Akış:
//   1. duzelt kararlarının "duzeltme" alanları ({ yol: yeniDeğer }) taslağa birebir uygulanır; anahtar (dogru) ASLA değişmez.
//      red kararları bankaya eklenmez.
//   2. Onaylanan/düzeltilen sorular (durum "taslak") geçici bir girdi dosyasına yazılır ve araclar/yeni-soru-ekle.js'in
//      doğrulama + ekleme mantığı (GIRDI_DIR / GIRDILER / URETIM bu dosya için değiştirilerek) çalıştırılır: şema, kutu,
//      tek doğru şık, hata_aciklamalari, LaTeX/\$, pasaj, kök tekrarı. Hata varsa HİÇBİR ŞEY yazılmaz. Yeni pasajlar
//      deneme-meta.json'a { baslik, html } olarak eklenir; tohum "surum" +1 olur (mevcut veritabanları tohumEsitle ile alır).
//   3. Eklenen sorular durum "aktif" yapılır ve ek.onay = { tarih, kaynak } yazılır.
// İdempotent: ikinci çalıştırma değişiklik yapmaz.
// Kullanım (proje klasöründen):  node araclar/onay2-uygula.js --kuru   |   node araclar/onay2-uygula.js
//   Başka parti: node araclar/onay2-uygula.js --taslak araclar/yeni-sorular2/sekilli.json --karar araclar/onay2/sekilli.json [--kuru]
//   (--uretim verilmezse taslaklardaki ortak ek.uretim kullanılır; duzeltme yolları "sekil" gibi isteğe bağlı alanları da kapsar)
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const argDeger = ad => { const i = process.argv.indexOf(ad); return i > 1 && process.argv[i + 1] ? process.argv[i + 1] : null; };
// v1.14.1: --taslak / --karar / --uretim ile genelleştirildi (varsayılanlar 1.14.0 Ekonomi + English partisi)
const TASLAK = path.resolve(argDeger("--taslak") || path.join(__dirname, "yeni-sorular2", "ekonomi-english.json"));
const KARAR = path.resolve(argDeger("--karar") || path.join(__dirname, "onay2", "ekonomi-english.json"));
const TOHUM = path.join(ROOT, "server", "tohum", "soru-bankasi.json");
let URETIM = argDeger("--uretim") || "1.14.0";
// 1.23.0: --tarih ile onay günü verilir (varsayılan bugün; eski partiler 2026-10-21 tarihliydi)
const ONAY = { tarih: argDeger("--tarih") || new Date().toISOString().slice(0, 10), kaynak: argDeger("--onay-kaynak") || "bağımsız denetim (sahip yetkisiyle)" };
const KURU = process.argv.includes("--kuru");

function yolAta(o, yol, deger) {
  const p = yol.replace(/\[(\d+)\]/g, ".$1").split(".");
  let n = o;
  for (let i = 0; i < p.length - 1; i++) { if (n[p[i]] == null || typeof n[p[i]] !== "object") throw new Error("yol yok: " + yol); n = n[p[i]]; }
  if (!(p[p.length - 1] in n)) throw new Error("alan yok: " + yol);
  n[p[p.length - 1]] = deger;
}

function main() {
  const t0 = JSON.parse(fs.readFileSync(TASLAK, "utf8"));
  const t = Array.isArray(t0) ? { sorular: t0, pasajlar: {} } : t0; // girdi dizi ya da { sorular, pasajlar }
  if (!argDeger("--uretim")) { const u = [...new Set(t.sorular.map(q => q.ek && q.ek.uretim))]; if (u.length === 1 && u[0]) URETIM = u[0]; }
  const kararlar = JSON.parse(fs.readFileSync(KARAR, "utf8"));
  const K = new Map(kararlar.map(k => [k.id, k]));
  const eksik = t.sorular.filter(q => !K.has(q.id)).map(q => q.id);
  if (eksik.length) throw new Error("kararı olmayan taslak: " + eksik.join(", "));

  const kabul = [], red = [];
  for (const q0 of t.sorular) {
    const k = K.get(q0.id);
    if (!["onay", "duzelt", "red"].includes(k.karar)) throw new Error(q0.id + ": bilinmeyen karar " + k.karar);
    if (k.karar === "red") { red.push(q0.id); continue; }
    const q = JSON.parse(JSON.stringify(q0));
    if (k.karar === "duzelt") {
      if (!k.duzeltme || !Object.keys(k.duzeltme).length) throw new Error(q.id + ": duzelt kararında duzeltme yok");
      for (const yol of Object.keys(k.duzeltme)) {
        if (/^(dogru|id|durum)$/.test(yol)) throw new Error(q.id + ": " + yol + " düzeltilemez");
        yolAta(q, yol, k.duzeltme[yol]);
      }
    }
    kabul.push(q);
  }
  const kullanilan = new Set(kabul.map(q => q.pasaj).filter(Boolean));
  const pasajlar = {};
  Object.keys(t.pasajlar || {}).forEach(p => { if (kullanilan.has(p)) pasajlar[p] = t.pasajlar[p]; });
  console.log(`Kararlar: ${kabul.length} eklenecek (${kararlar.filter(k => k.karar === "onay").length} onay + ${kararlar.filter(k => k.karar === "duzelt").length} düzelt), ${red.length} ret: ${red.join(", ")}`);

  // 2. yeni-soru-ekle.js doğrulama + ekleme mantığı (geçici girdi dosyası, bu üretim için)
  const gecici = fs.mkdtempSync(path.join(os.tmpdir(), "meberra-onay2-"));
  const gDosya = path.join(gecici, "onaylanan.json");
  fs.writeFileSync(gDosya, JSON.stringify({ pasajlar, sorular: kabul }, null, 1), "utf8");
  let sonuc;
  try { sonuc = require("./yeni-soru-ekle.js").calistir({ girdi: gDosya, uretim: URETIM, kuru: KURU }); }
  finally { fs.rmSync(gecici, { recursive: true, force: true }); }
  if (!sonuc || !sonuc.ok) { console.log("✗ Doğrulama başarısız — durumlar değiştirilmedi."); return; }
  if (KURU) { console.log("--kuru: durumlar değiştirilmedi."); return; }

  // 3. aktif + ek.onay
  const tohum = JSON.parse(fs.readFileSync(TOHUM, "utf8"));
  const ids = new Set(kabul.map(q => q.id));
  let n = 0;
  for (const r of tohum.sorular) {
    if (!ids.has(r.id)) continue;
    if (!(r.ek && r.ek.uretim === URETIM)) throw new Error(r.id + ": tohumdaki kayıt bu üretime ait değil");
    if (r.durum === "aktif" && r.ek.onay && r.ek.onay.tarih === ONAY.tarih) continue;
    r.durum = "aktif"; r.ek.onay = Object.assign({}, ONAY); n++;
  }
  if (n) { fs.writeFileSync(TOHUM, JSON.stringify(tohum, null, 1) + "\n", "utf8"); console.log(`Aktif yapıldı: ${n} soru (ek.onay yazıldı); tohum sürümü ${tohum.surum}`); }
  else console.log("Durum değişikliği yok (idempotent).");
}

main();
