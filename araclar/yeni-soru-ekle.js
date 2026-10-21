// Meberra — yeni soru taslaklarını soru bankası tohumuna ekler (v1.11.0)
// Girdi: araclar/yeni-sorular/*.json (dizi ya da { sorular: [...], pasajlar?: {...} }). Hepsi durum "taslak" olmalı.
// Doğrulama (bir tanesi bile hatalıysa HİÇBİR ŞEY yazılmaz):
//   - banka şeması (zorunlu alanlar, tur/sayfa/kutu/zorluk/durum), kimlik biçimi ve benzersizliği (tohum + yeni dosyalar)
//   - tek doğru şık, şık harfleri A.. sıralı, aynı metinli şık yok, hata_aciklamalari TAM OLARAK yanlış şıkları kapsar
//   - LaTeX ayırıcıları dengeli ($ tek sayıda değil, \( \) ve \[ \] eşit), kontrol karakteri yok
//   - kök tekrarı yok: normalleştirilmiş kök (+ pasaj) özeti, tohumdaki arşivlenmemiş sorularla ve yeni sorular arasında
//   - kutu: aynı sayfada mevcut kutu (başlık/ünite no/dizi tutarlı) ya da YENI_KUTULAR'daki yeni kutu
//   - pasaj: deneme-meta.json'da ya da girdi dosyasının "pasajlar" alanında olmalı (yeni pasajlar deneme-meta.json'a eklenir)
// Yazım: sira / numara aynı kutudaki mevcut soruların ardından verilir; sorular durum "taslak" ile tohumun sonuna eklenir ve
// tohum "surum" +1 olur (mevcut veritabanları açılışta yeni soruları tohumEsitle ile alır; taslak durumları korunur).
// İdempotent: tohumda zaten olan kimlikler atlanır (yeniden çalıştırma değişiklik yapmaz).
//
// Kullanım (proje klasöründen):
//   node araclar/yeni-soru-ekle.js --kuru     Doğrular ve özet yazar, dosyalara dokunmaz
//   node araclar/yeni-soru-ekle.js            Doğrular ve tohum + deneme-meta.json'u yazar
//   node araclar/yeni-soru-ekle.js --girdi araclar/yeni-sorular2/sekilli.json [--uretim 1.13.0] [--kuru]
//                                             Tek bir girdi dosyası (v1.14.1); --uretim verilmezse dosyadaki ek.uretim kullanılır
//   Program içinden: require("./yeni-soru-ekle.js").calistir({ girdi, uretim, kuru }) → { ok, eklenen: [id], atlanan: [id] }
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sekilM = require("../server/sekil.js");

const ROOT = path.resolve(__dirname, "..");
const TOHUM = path.join(ROOT, "server", "tohum", "soru-bankasi.json");
const META = path.join(ROOT, "server", "tohum", "deneme-meta.json");
const GIRDI_DIR = path.join(__dirname, "yeni-sorular");
const GIRDILER = ["calculus.json", "physics.json", "chemistry.json", "biology-english-electives.json"];
const URETIM_VARSAYILAN = "1.11.0";
const argDeger = ad => { const i = process.argv.indexOf(ad); return i > 1 && process.argv[i + 1] ? process.argv[i + 1] : null; };

// Bu sürümde açılan yeni soru kutuları (ders sayfalarına arayüz tarafından eklenecek; bkz. yeni-sorular/BIRLESTIRME.md)
const YENI_KUTULAR = {
  "ap-physics|phys-unit8-quiz-container": { kutu_baslik: "Unit 8 Fluids", unite_no: 9, dizi: "PHYS_UNIT8_QUESTIONS" },
  "ap-biology|bio-unit8-quiz-container": { kutu_baslik: "Unit 8 Ecology", unite_no: 8, dizi: "BIO_UNIT8_QUESTIONS" }
};
const ALANLAR = ["id", "tur", "sayfa", "ders", "unite_no", "unite", "kutu", "kutu_baslik", "dizi", "sira", "numara", "konu", "zorluk", "govde", "secenekler",
  "dogru", "aciklama", "genel_hatirlatma", "hata_aciklamalari", "kaynak", "deneme_kodlari", "pasaj", "ek", "durum"];
// v1.13.0 isteğe bağlı alanlar: sekil (kök şekli; biçim yeni-sorular2/SEKIL-BICIMI.md). Şık şekli secenekler[i].sekil.
const ISTEGE_BAGLI = ["sekil"];
const ZORUNLU_METIN = ["id", "sayfa", "unite", "kutu", "kutu_baslik", "dizi", "konu", "govde", "dogru", "aciklama", "genel_hatirlatma", "kaynak"];
const HARFLER = "ABCDE";
const YASAK_KAYNAK = /official|past exam|canonical|college board exam/i;

// pm-denetim.js ile aynı normalleştirme (biçim komutları, HTML, $ ve boşluk atılır)
const BICIM = /\\(?:displaystyle|textstyle|left|right|big|Big|bigg|Bigg|mathrm|text|mathbf|operatorname|,|;|!|:|quad|qquad)(?![a-zA-Z])/g;
function norm(t) {
  return String(t == null ? "" : t)
    .replace(/<span class='card-badge[^>]*>[^<]*<\/span>/g, " ").replace(/\[BC ONLY\]/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/\\[dt]frac/g, "\\frac").replace(BICIM, "").replace(/[$\s{}]/g, "")
    .replace(/[−–]/g, "-").replace(/[.?:;,]+$/g, "").toLowerCase();
}
const hash = s => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);
const kokOzet = r => hash((r.pasaj || "") + "\u0001" + norm(r.govde));
const tamOzet = r => hash(norm(r.govde) + "\u0001" + (r.secenekler || []).map(o => norm(o.text)).sort().join("\u0002"));

function latexSorunu(s) {
  const t = String(s == null ? "" : s);
  if ((t.replace(/\\\$/g, "").match(/\$/g) || []).length % 2) return "tek sayıda $";
  if ((t.match(/\\\(/g) || []).length !== (t.match(/\\\)/g) || []).length) return "\\( \\) dengesiz";
  if ((t.match(/\\\[/g) || []).length !== (t.match(/\\\]/g) || []).length) return "\\[ \\] dengesiz";
  return null;
}

// Para birimi olarak kaçışsız $ (MathJax $...$ satır içi matematik sayar; çift sayıda olsa bile metni bozar) → \$ yazılmalı
const PARA = /(?:^|[^\\])(?:\$\s?\d[\d.,]*\s*(?:billion|million|thousand|milyar|milyon|bin|per\b|each\b)|\(\$\s|\d\s\$(?:\s|'))/i;
function paraSorunu(s) { return PARA.test(String(s == null ? "" : s)) ? "para birimi $ kaçışsız (\\$ yaz)" : null; }

function oku(dosyalar) {
  const sorular = [], pasajlar = {};
  for (const p of dosyalar) {
    const f = path.basename(p);
    if (!fs.existsSync(p)) continue;
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    (Array.isArray(j) ? j : j.sorular || []).forEach(q => sorular.push({ dosya: f, q }));
    if (!Array.isArray(j) && j.pasajlar) Object.assign(pasajlar, j.pasajlar);
  }
  return { sorular, pasajlar };
}

function calistir(secenek) {
  const o = secenek || {};
  const dosyalar = o.girdi ? [path.resolve(o.girdi)] : GIRDILER.map(f => path.join(GIRDI_DIR, f));
  if (o.girdi && !fs.existsSync(dosyalar[0])) throw new Error("girdi dosyası yok: " + o.girdi);
  const KURU = o.kuru != null ? !!o.kuru : process.argv.includes("--kuru");
  const tohum = JSON.parse(fs.readFileSync(TOHUM, "utf8"));
  const meta = JSON.parse(fs.readFileSync(META, "utf8"));
  const { sorular: girdi, pasajlar: yeniPasajlar } = oku(dosyalar);
  const URETIM = o.uretim || (o.girdi ? [...new Set(girdi.map(x => x.q.ek && x.q.ek.uretim))].join("|") : URETIM_VARSAYILAN);
  const mevcutId = new Map(tohum.sorular.map(r => [r.id, r]));
  const hatalar = [], uyarilar = [];
  const hata = (q, m) => hatalar.push(`${q && q.id || "?"}: ${m}`);

  // Mevcut kutular (sayfa|kutu → {baslik, unite_no, dizi, maxSira, maxNumara})
  const kutular = new Map();
  for (const r of tohum.sorular) {
    if (r.tur !== "ders") continue;
    const k = r.sayfa + "|" + r.kutu;
    const o = kutular.get(k) || { kutu_baslik: r.kutu_baslik, unite_no: r.unite_no, dizi: r.dizi, maxSira: -1, maxNumara: 0 };
    o.maxSira = Math.max(o.maxSira, Number(r.sira) || 0);
    o.maxNumara = Math.max(o.maxNumara, Number(r.numara) || 0);
    kutular.set(k, o);
  }
  const sayfalar = new Set(tohum.sorular.filter(r => r.tur === "ders").map(r => r.sayfa));

  // Tekrar özetleri: tohumdaki arşivlenmemiş sorular (yeni girdilerle aynı kimlikli olanlar hariç — önceki çalıştırma)
  const girdiId = new Set(girdi.map(x => x.q.id));
  const kokler = new Map(), tamlar = new Map();
  for (const r of tohum.sorular) {
    if (r.durum === "arsiv" || girdiId.has(r.id)) continue;
    kokler.set(kokOzet(r), r.id); tamlar.set(tamOzet(r), r.id);
  }

  const goruldu = new Set(), eklenecek = [], atlanan = [];
  for (const { dosya, q } of girdi) {
    const tag = q.id;
    // şema
    for (const k of ALANLAR) if (!(k in q)) hata(q, `eksik alan ${k}`);
    for (const k of Object.keys(q)) if (!ALANLAR.includes(k) && !ISTEGE_BAGLI.includes(k)) hata(q, `bilinmeyen alan ${k}`);
    // şekiller: beyaz liste temizleyicisinden DEĞİŞMEDEN geçmeli (atılan etiket/öznitelik yok), alt zorunlu, viewBox ≤ 480×360
    {
      const t = sekilM.satirSekilTemizle(q);
      t.sorunlar.forEach(m => hata(q, m));
      if (t.kaldirilan.length) hata(q, "şekil temizleyiciden değişerek geçiyor: " + t.kaldirilan.slice(0, 4).join(", "));
      t.uyarilar.forEach(m => uyarilar.push(`${q.id}: ${m}`));
      if (Array.isArray(q.secenekler)) q.secenekler.forEach(o => { if (o && o.sekil != null && Object.keys(o).some(k => !["id", "text", "sekil"].includes(k))) hata(q, `şık ${o.id}: bilinmeyen alan`); });
    }
    for (const k of ZORUNLU_METIN) if (!String(q[k] == null ? "" : q[k]).trim()) hata(q, `boş alan ${k}`);
    if (!/^[a-z0-9_]{3,60}$/.test(String(q.id || ""))) hata(q, "kimlik biçimi (küçük harf, rakam, _; 3–60)");
    if (goruldu.has(tag)) hata(q, `girdi dosyalarında tekrar eden kimlik (${dosya})`);
    goruldu.add(tag);
    if (q.tur !== "ders") hata(q, `tur "ders" olmalı (${q.tur})`);
    if (q.durum !== "taslak") hata(q, `durum "taslak" olmalı (${q.durum})`);
    if (!["easy", "medium", "hard"].includes(q.zorluk)) hata(q, "zorluk easy/medium/hard olmalı");
    if (!q.ek || typeof q.ek !== "object" || q.ek.uretim !== URETIM) hata(q, `ek.uretim "${URETIM}" olmalı`);
    if (!Array.isArray(q.deneme_kodlari)) hata(q, "deneme_kodlari dizi olmalı");
    else q.deneme_kodlari.forEach(k => { if (!meta.kodlar[k]) hata(q, `bilinmeyen deneme kodu ${k}`); });
    if (YASAK_KAYNAK.test(q.kaynak || "")) hata(q, `yanıltıcı kaynak "${q.kaynak}"`);
    if (!sayfalar.has(q.sayfa)) hata(q, `bilinmeyen sayfa ${q.sayfa}`);
    if (!Number.isInteger(q.unite_no)) hata(q, "unite_no tam sayı olmalı");
    // kutu
    const kk = q.sayfa + "|" + q.kutu, kutu = kutular.get(kk) || YENI_KUTULAR[kk];
    if (!kutu) hata(q, `bilinmeyen kutu ${q.kutu} (${q.sayfa})`);
    else ["kutu_baslik", "unite_no", "dizi"].forEach(k => { if (kutu[k] !== q[k]) hata(q, `${k} kutuyla tutarsız: "${q[k]}" ≠ "${kutu[k]}"`); });
    // şıklar
    const sec = Array.isArray(q.secenekler) ? q.secenekler : [];
    if (sec.length < 2 || sec.length > 5) hata(q, `${sec.length} şık (2–5 olmalı)`);
    if (sec.map(o => o && o.id).join("") !== HARFLER.slice(0, sec.length)) hata(q, "şık harfleri A.. sıralı değil");
    if (sec.some(o => !o || (!String(o.text || "").trim() && !o.sekil))) hata(q, "boş şık");
    if (new Set(sec.map(o => norm(o && o.text) + "\u0001" + (o && o.sekil ? o.sekil.svg : ""))).size !== sec.length) hata(q, "aynı metinli şıklar");
    const dogrular = sec.filter(o => o && o.id === q.dogru);
    if (dogrular.length !== 1) hata(q, `tek doğru şık olmalı (dogru = ${q.dogru})`);
    const yanlis = sec.map(o => o && o.id).filter(id => id !== q.dogru).sort();
    const ha = q.hata_aciklamalari && typeof q.hata_aciklamalari === "object" ? q.hata_aciklamalari : {};
    if (Object.keys(ha).sort().join() !== yanlis.join()) hata(q, `hata_aciklamalari yanlış şıkları tam kapsamıyor (${Object.keys(ha).sort().join("")} ≠ ${yanlis.join("")})`);
    Object.keys(ha).forEach(k => { const h = ha[k] || {}; if (!String(h.etiket || "").trim() || !String(h.aciklama || "").trim()) hata(q, `${k} hata açıklamasında etiket/aciklama boş`); });
    // LaTeX + kontrol karakteri
    const metinler = [["govde", q.govde], ["aciklama", q.aciklama], ["genel_hatirlatma", q.genel_hatirlatma]]
      .concat(sec.map(o => ["şık " + (o && o.id), o && o.text]))
      .concat(Object.keys(ha).map(k => ["hata " + k, (ha[k] || {}).etiket + " " + (ha[k] || {}).aciklama]));
    metinler.forEach(([ad, v]) => { const s = latexSorunu(v) || paraSorunu(v); if (s) hata(q, `${ad}: ${s}`); });
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(metinler.map(x => String(x[1])).join(""))) hata(q, "kontrol karakteri (tek ters bölü kaçışı?)");
    if (/\*\*[^*]+\*\*/.test(JSON.stringify(q))) hata(q, "ham Markdown **");
    // pasaj
    if (q.pasaj != null) {
      if (!meta.pasajlar[q.pasaj] && !yeniPasajlar[q.pasaj]) hata(q, `pasaj bulunamadı: ${q.pasaj}`);
      if (!String(q.pasaj).startsWith(q.kutu + ":")) hata(q, `pasaj anahtarı kutuyla başlamalı (${q.pasaj})`);
    }
    // tekrar
    const ko = kokOzet(q), to = tamOzet(q);
    if (kokler.has(ko)) hata(q, `kök tekrarı: ${kokler.get(ko)}`); else kokler.set(ko, q.id);
    if (tamlar.has(to)) hata(q, `kök + şık tekrarı: ${tamlar.get(to)}`); else tamlar.set(to, q.id);
    // idempotentlik
    if (mevcutId.has(q.id)) {
      const m = mevcutId.get(q.id);
      if (!(m.ek && m.ek.uretim === URETIM)) hata(q, "kimlik tohumda başka bir soruya ait");
      else atlanan.push(q.id);
      continue;
    }
    eklenecek.push(q);
  }

  // Pasajlar: deneme-meta.json biçimi { baslik, html } ("rozet" ders sayfasındaki kart rozetidir; meta'ya yazılmaz)
  const pasajEkle = {};
  const kullanilan = new Set(girdi.map(x => x.q.pasaj).filter(Boolean));
  Object.keys(yeniPasajlar).forEach(k => {
    const p = yeniPasajlar[k] || {};
    if (!kullanilan.has(k)) uyarilar.push(`pasaj ${k} hiçbir soruda kullanılmıyor`);
    if (!String(p.baslik || "").trim() || !String(p.html || "").trim()) { hatalar.push(`pasaj ${k}: baslik/html boş`); return; }
    const kayit = { baslik: String(p.baslik), html: String(p.html) };
    if (meta.pasajlar[k]) { if (JSON.stringify(meta.pasajlar[k]) !== JSON.stringify(kayit)) hatalar.push(`pasaj ${k}: deneme-meta.json'da farklı içerikle var`); return; }
    pasajEkle[k] = kayit;
  });

  // Sıra / numara: aynı kutudaki mevcut soruların ardından (dosya sırasıyla)
  for (const q of eklenecek) {
    const kk = q.sayfa + "|" + q.kutu;
    let k = kutular.get(kk);
    if (!k) { k = Object.assign({ maxSira: -1, maxNumara: 0 }, YENI_KUTULAR[kk]); kutular.set(kk, k); }
    q.sira = ++k.maxSira; q.numara = ++k.maxNumara;
  }

  // Özet
  const say = {};
  for (const { q } of girdi) {
    const k = `${q.sayfa} · ${q.kutu}${YENI_KUTULAR[q.sayfa + "|" + q.kutu] ? " (YENİ)" : ""}`;
    say[k] = (say[k] || 0) + 1;
  }
  console.log(`Girdi: ${girdi.length} soru (${dosyalar.length} dosya), yeni pasaj: ${Object.keys(pasajEkle).length}`);
  Object.keys(say).sort().forEach(k => console.log(`  ${String(say[k]).padStart(3)}  ${k}`));
  uyarilar.forEach(u => console.log("  uyarı: " + u));
  if (hatalar.length) {
    console.log(`\n✗ ${hatalar.length} doğrulama hatası — hiçbir şey yazılmadı:`);
    hatalar.forEach(h => console.log("  - " + h));
    process.exitCode = 1;
    return { ok: false, hatalar, eklenen: [], atlanan };
  }
  console.log(`✓ Doğrulama: 0 hata. Eklenecek: ${eklenecek.length}, zaten tohumda: ${atlanan.length}`);
  const sonuc = { ok: true, hatalar: [], eklenen: eklenecek.map(q => q.id), atlanan };
  if (!eklenecek.length && !Object.keys(pasajEkle).length) { console.log("Değişiklik yok (idempotent)."); return sonuc; }
  if (KURU) { console.log(`--kuru: yazılmadı (tohum sürümü ${tohum.surum} → ${eklenecek.length ? (Number(tohum.surum) || 1) + 1 : tohum.surum} olurdu).`); return sonuc; }

  if (eklenecek.length) {
    eklenecek.forEach(q => { const r = {}; ALANLAR.forEach(k => { r[k] = q[k]; }); ISTEGE_BAGLI.forEach(k => { if (q[k] != null) r[k] = q[k]; }); tohum.sorular.push(r); });
    const eski = Number(tohum.surum) || 1;
    tohum.surum = eski + 1;
    tohum.yeniSoruEkleme = new Date().toISOString();
    fs.writeFileSync(TOHUM, JSON.stringify(tohum, null, 1) + "\n", "utf8");
    console.log(`Yazıldı: server/tohum/soru-bankasi.json (+${eklenecek.length} taslak, tohum sürümü ${eski} → ${tohum.surum})`);
  }
  if (Object.keys(pasajEkle).length) {
    Object.assign(meta.pasajlar, pasajEkle);
    fs.writeFileSync(META, JSON.stringify(meta, null, 1) + "\n", "utf8");
    console.log(`Yazıldı: server/tohum/deneme-meta.json (+${Object.keys(pasajEkle).length} pasaj: ${Object.keys(pasajEkle).join(", ")})`);
  }
  return sonuc;
}

if (require.main === module) calistir({ girdi: argDeger("--girdi"), uretim: argDeger("--uretim") });
module.exports = { calistir, norm, kokOzet, tamOzet, latexSorunu, YENI_KUTULAR };
