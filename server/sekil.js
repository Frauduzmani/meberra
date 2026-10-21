"use strict";
// v1.13.0 Şekilli sorular: SVG beyaz liste temizleyicisi (bağımlılıksız). Biçim: araclar/yeni-sorular2/SEKIL-BICIMI.md
// - Girdi küçük bir XML belirtecine (tokenizer) göre ayrıştırılır; bozuk girdi (kapanmamış etiket, tırnaksız/yinelenen öznitelik,
//   bilinmeyen varlık &foo;, DOCTYPE/ENTITY/CDATA/işlem talimatı, 30 KB üstü, çok derin ağaç) REDDEDİLİR.
// - Ağaç yalnız izinli etiket + öznitelik + değer kalıplarıyla YENİDEN kurulur; dışındaki her şey (alt ağacıyla) atılır ve
//   `kaldirilan` listesine yazılır. Çıktı kararlıdır: temizle(temizle(x).svg).svg === temizle(x).svg.
// - Saklanan / sunulan her `sekil` buradan geçer (yönetici kaydı, tohum yükleme ve aktarım, FRQ parçaları). İstemci ayrıca
//   assets/js/sekil.js içinde DOMParser + aynı beyaz listeyle yeniden temizler (derinlemesine savunma).
// - konum "aciklama" şekilleri yalnız çözümle (cevaptan sonra) gönderilir: govdeSekilleri / cozumSekilleri.

const EN_COK_BAYT = 30 * 1024;
const VIEWBOX = { w: 480, h: 360 };
const EN_DERIN = 32, EN_COK_ELEMAN = 3000, EN_COK_SEKIL = 4;
const SVG_NS = "http://www.w3.org/2000/svg";

const ETIKETLER = new Set(["svg", "g", "path", "line", "polyline", "polygon", "rect", "circle", "ellipse", "text", "tspan", "defs", "marker", "title", "desc"]);
const METINLI = new Set(["text", "tspan", "title", "desc"]);
const OZNITELIKLER = new Set(["viewBox", "xmlns", "role", "d", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "width", "height", "points", "transform",
  "fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "opacity", "fill-opacity", "font-size", "font-weight",
  "text-anchor", "dominant-baseline", "marker-end", "marker-start", "id", "class"]);
// Ok başı için gerekli marker öznitelikleri (yalnız <marker> üzerinde; değerleri sayı/anahtar sözcük)
const MARKER_OZ = new Set(["markerWidth", "markerHeight", "refX", "refY", "orient", "markerUnits"]);

const SAYI = "[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][-+]?\\d+)?";
const UZUNLUK = SAYI + "(?:px|%|em)?";
const re = s => new RegExp("^" + s + "$");
const R = {
  uzunluk: re("\\s*" + UZUNLUK + "\\s*"),
  uzunlukListe: re("\\s*" + UZUNLUK + "(?:[\\s,]+" + UZUNLUK + ")*\\s*"),
  sayi: re("\\s*" + SAYI + "\\s*"),
  viewBox: re("\\s*(" + SAYI + ")[\\s,]+(" + SAYI + ")[\\s,]+(" + SAYI + ")[\\s,]+(" + SAYI + ")\\s*"),
  d: /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,+\-\s]*$/,
  points: /^[0-9eE.,+\-\s]*$/,
  transform: re("(?:\\s*(?:matrix|translate|scale|rotate|skewX|skewY)\\s*\\(\\s*" + SAYI + "(?:[\\s,]+" + SAYI + ")*\\s*\\)\\s*,?)+\\s*"),
  renk: /^(?:none|currentColor|transparent|inherit|#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,20}|rgba?\(\s*[\d.%\s,]+\)|url\(#[A-Za-z][\w-]{0,63}\))$/,
  marker: /^(?:none|url\(#[A-Za-z][\w-]{0,63}\))$/,
  dash: re("\\s*(?:none|" + UZUNLUK + "(?:[\\s,]+" + UZUNLUK + ")*)\\s*"),
  id: /^[A-Za-z][\w-]{0,63}$/,
  sinifSozcuk: /^sk-[a-z0-9-]{1,30}$/
};
const SECIM = {
  "stroke-linecap": ["butt", "round", "square"],
  "stroke-linejoin": ["miter", "round", "bevel", "miter-clip", "arcs"],
  "font-weight": ["normal", "bold", "bolder", "lighter", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
  "text-anchor": ["start", "middle", "end"],
  "dominant-baseline": ["auto", "middle", "central", "hanging", "alphabetic", "ideographic", "mathematical", "text-top", "text-bottom", "text-before-edge", "text-after-edge"],
  role: ["img", "presentation", "none"],
  markerUnits: ["strokeWidth", "userSpaceOnUse"]
};
const SABIT_RENK_DISI = /^(?:none|currentColor|transparent|inherit|url\(#[\w-]+\))$/;

/** Öznitelik değeri geçerli mi (çözülmüş değer üzerinden). */
function degerGecerli(ad, v, etiket) {
  if (v.length > 20000) return false;
  if (/[<>]/.test(v) && ad !== "d") return false;
  switch (ad) {
    case "xmlns": return v === SVG_NS;
    case "viewBox": return R.viewBox.test(v);
    case "d": return R.d.test(v);
    case "points": return R.points.test(v);
    case "transform": return R.transform.test(v);
    case "x": case "y": return R.uzunlukListe.test(v);
    case "x1": case "y1": case "x2": case "y2": case "cx": case "cy": case "r": case "rx": case "ry": case "width": case "height":
    case "stroke-width": case "font-size": return R.uzunluk.test(v);
    case "markerWidth": case "markerHeight": case "refX": case "refY": return R.sayi.test(v);
    case "orient": return v === "auto" || v === "auto-start-reverse" || R.sayi.test(v);
    case "opacity": case "fill-opacity": return R.sayi.test(v) && Number(v) >= 0 && Number(v) <= 1;
    case "fill": case "stroke": return R.renk.test(v.trim());
    case "marker-end": case "marker-start": return R.marker.test(v.trim());
    case "stroke-dasharray": return R.dash.test(v);
    case "id": return R.id.test(v);
    default: return SECIM[ad] ? SECIM[ad].indexOf(v.trim()) >= 0 : false;
  }
}

// --- belirteç (tokenizer) ---------------------------------------------------------------------------------
const VARLIK = { lt: "<", gt: ">", amp: "&", quot: "\"", apos: "'" };
class BozukSvg extends Error {}
function varlikCoz(s) {
  return s.replace(/&([^;\s&]{0,12});?/g, (tam, ad) => {
    if (!tam.endsWith(";")) throw new BozukSvg("geçersiz & kullanımı (&amp; yaz)");
    if (VARLIK[ad]) return VARLIK[ad];
    let m = /^#(\d{1,7})$/.exec(ad), cp = null;
    if (m) cp = Number(m[1]);
    else if ((m = /^#x([0-9a-fA-F]{1,6})$/.exec(ad))) cp = parseInt(m[1], 16);
    else throw new BozukSvg("bilinmeyen varlık &" + ad + ";");
    if (cp > 0x10FFFF || (cp < 0x20 && cp !== 9 && cp !== 10 && cp !== 13) || (cp >= 0xD800 && cp <= 0xDFFF) || cp === 0xFFFE || cp === 0xFFFF) throw new BozukSvg("geçersiz karakter başvurusu &" + ad + ";");
    return String.fromCodePoint(cp);
  });
}
const AD = /[A-Za-z_][\w:.-]*/y;
/** XML alt kümesini ağaca çevirir. Dönüş: { kok, yorum } ; bozuksa BozukSvg fırlatır. */
function ayristir(s) {
  let i = 0, yorum = 0, eleman = 0;
  const kok = { ad: "#kok", oz: [], cocuk: [] }, yigin = [kok];
  const ust = () => yigin[yigin.length - 1];
  const adOku = () => { AD.lastIndex = i; const m = AD.exec(s); if (!m) throw new BozukSvg("etiket/öznitelik adı bekleniyordu (" + i + ")"); i = AD.lastIndex; return m[0]; };
  const bosluk = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  while (i < s.length) {
    const lt = s.indexOf("<", i);
    if (lt < 0 || lt > i) {
      const t = s.slice(i, lt < 0 ? s.length : lt);
      ust().cocuk.push({ metin: varlikCoz(t) });
      if (lt < 0) break;
      i = lt;
    }
    if (s.startsWith("<!--", i)) {
      const e = s.indexOf("-->", i + 4);
      if (e < 0) throw new BozukSvg("kapanmamış yorum");
      if (s.slice(i + 4, e).includes("--")) throw new BozukSvg("yorum içinde --");
      i = e + 3; yorum++; continue;
    }
    if (s.startsWith("<?xml", i) && yigin.length === 1 && !kok.cocuk.some(c => c.ad || /\S/.test(c.metin))) {
      const e = s.indexOf("?>", i);
      if (e < 0 || /<|>/.test(s.slice(i + 5, e))) throw new BozukSvg("bozuk XML bildirimi");
      i = e + 2; continue;
    }
    if (s[i + 1] === "!" || s[i + 1] === "?") throw new BozukSvg("DOCTYPE/ENTITY/CDATA/işlem talimatı yasak");
    if (s[i + 1] === "/") {
      i += 2;
      const ad = adOku(); bosluk();
      if (s[i] !== ">") throw new BozukSvg("bozuk kapanış etiketi </" + ad);
      i++;
      const e = yigin.pop();
      if (!e || e === kok || e.ad !== ad) throw new BozukSvg("eşleşmeyen kapanış etiketi </" + ad + ">");
      continue;
    }
    i++;
    const ad = adOku();
    const el = { ad, oz: [], cocuk: [] };
    if (++eleman > EN_COK_ELEMAN) throw new BozukSvg("çok fazla öğe");
    const gorulen = new Set();
    for (;;) {
      const once = i; bosluk();
      if (s[i] === ">") { i++; ust().cocuk.push(el); yigin.push(el); if (yigin.length > EN_DERIN + 1) throw new BozukSvg("çok derin iç içe öğe"); break; }
      if (s[i] === "/" && s[i + 1] === ">") { i += 2; ust().cocuk.push(el); break; }
      if (i >= s.length) throw new BozukSvg("kapanmamış etiket <" + ad);
      if (i === once) throw new BozukSvg("öznitelikler arasında boşluk yok (<" + ad + ")");
      const oa = adOku(); bosluk();
      if (s[i] !== "=") throw new BozukSvg("değersiz öznitelik " + oa);
      i++; bosluk();
      const q = s[i];
      if (q !== "\"" && q !== "'") throw new BozukSvg("tırnaksız öznitelik değeri " + oa);
      const e = s.indexOf(q, i + 1);
      if (e < 0) throw new BozukSvg("kapanmamış öznitelik değeri " + oa);
      const ham = s.slice(i + 1, e);
      if (ham.includes("<")) throw new BozukSvg("öznitelik değerinde < (" + oa + ")");
      i = e + 1;
      if (gorulen.has(oa)) throw new BozukSvg("yinelenen öznitelik " + oa);
      gorulen.add(oa);
      el.oz.push([oa, varlikCoz(ham)]);
    }
  }
  if (yigin.length !== 1) throw new BozukSvg("kapanmamış etiket <" + ust().ad + ">");
  return { kok, yorum };
}

// --- temizleme + yeniden yazım ------------------------------------------------------------------------------
const kacOz = v => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const kacMetin = v => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * temizle(svgMetni) → { ok, svg, hata, kaldirilan:[…], uyarilar:[…], viewBox:{x,y,w,h} }
 * ok=false: reddedildi (hata metni). kaldirilan boş değilse girdi değişti (atılan etiket/öznitelik).
 * uyarilar: kural dışı ama zararsız (sabit renk, font-size 11–14 dışı, sk- dışı sınıf vb.).
 */
function temizle(girdi) {
  const out = { ok: false, svg: "", hata: null, kaldirilan: [], uyarilar: [], viewBox: null };
  if (typeof girdi !== "string") { out.hata = "svg metin olmalı"; return out; }
  const s = girdi.replace(/^﻿/, "").trim();
  if (!s) { out.hata = "svg boş"; return out; }
  if (Buffer.byteLength(s, "utf8") > EN_COK_BAYT) { out.hata = "svg en çok 30 KB olabilir"; return out; }
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s)) { out.hata = "kontrol karakteri"; return out; }
  let agac;
  try { agac = ayristir(s); } catch (e) { if (e instanceof BozukSvg) { out.hata = "bozuk SVG: " + e.message; return out; } throw e; }
  if (agac.yorum) out.kaldirilan.push("yorum (" + agac.yorum + ")");
  const ust = agac.kok.cocuk.filter(c => c.ad || /\S/.test(c.metin));
  if (ust.length !== 1 || ust[0].ad !== "svg") { out.hata = "tek bir <svg> kök öğesi olmalı"; return out; }
  const kokEl = ust[0];
  const kal = m => { if (out.kaldirilan.indexOf(m) < 0) out.kaldirilan.push(m); };
  const uyar = m => { if (out.uyarilar.indexOf(m) < 0) out.uyarilar.push(m); };
  let idler = new Set();

  function yaz(el, kokMu) {
    let a = "<" + el.ad;
    for (const [ad, v] of el.oz) {
      const izinli = OZNITELIKLER.has(ad) || (el.ad === "marker" && MARKER_OZ.has(ad));
      if (!izinli) { kal("öznitelik " + ad + (/^on/i.test(ad) ? " (olay)" : "")); continue; }
      if (kokMu && (ad === "width" || ad === "height")) { kal("kökte " + ad + " (istemci duyarlı ölçekler)"); continue; }
      if (!kokMu && (ad === "xmlns" || ad === "viewBox") && el.ad !== "marker") { kal(ad + " yalnız kökte"); continue; }
      let deger = v;
      if (ad === "class") {
        const parca = v.split(/\s+/).filter(Boolean), iyi = parca.filter(x => R.sinifSozcuk.test(x));
        if (iyi.length !== parca.length) kal("sınıf " + parca.filter(x => !R.sinifSozcuk.test(x)).join(" ") + " (yalnız sk-…)");
        if (!iyi.length) continue;
        deger = iyi.join(" ");
      } else if (!degerGecerli(ad, v, el.ad)) { kal("geçersiz değer " + ad + "=\"" + v.slice(0, 40) + "\""); continue; }
      if (ad === "id") { if (idler.has(v)) { kal("yinelenen id " + v); continue; } idler.add(v); }
      if ((ad === "fill" || ad === "stroke") && !SABIT_RENK_DISI.test(deger.trim())) uyar("sabit renk " + ad + "=\"" + deger + "\" (currentColor ya da sk-… sınıfı kullan)");
      if (ad === "font-size") { const n = parseFloat(deger); if (!(n >= 11 && n <= 14)) uyar("font-size " + deger + " (11–14 olmalı)"); }
      a += " " + ad + "=\"" + kacOz(deger) + "\"";
    }
    let ic = "";
    for (const c of el.cocuk) {
      if (!c.ad) {
        if (METINLI.has(el.ad)) ic += kacMetin(c.metin);
        else if (/\S/.test(c.metin)) kal("metin <" + el.ad + "> içinde (yalnız text/tspan/title/desc)");
        continue;
      }
      if (!ETIKETLER.has(c.ad)) { kal("etiket <" + c.ad + ">"); continue; }
      if (c.ad === "svg") { kal("iç içe <svg>"); continue; }
      if (el.ad === "title" || el.ad === "desc") { kal("<" + c.ad + "> " + el.ad + " içinde"); continue; }
      if ((el.ad === "text" || el.ad === "tspan") && c.ad !== "tspan") { kal("<" + c.ad + "> metin içinde"); continue; }
      ic += yaz(c, false);
    }
    return a + (ic ? ">" + ic + "</" + el.ad + ">" : "/>");
  }

  const vbOz = kokEl.oz.find(x => x[0] === "viewBox");
  const vb = vbOz && R.viewBox.exec(vbOz[1]);
  if (!vb) { out.hata = "viewBox gerekli (ör. viewBox=\"0 0 320 220\")"; return out; }
  const [x, y, w, h] = vb.slice(1, 5).map(Number);
  if (!(w > 0 && h > 0)) { out.hata = "viewBox genişlik/yükseklik pozitif olmalı"; return out; }
  if (w > VIEWBOX.w || h > VIEWBOX.h) { out.hata = "viewBox en çok " + VIEWBOX.w + "×" + VIEWBOX.h + " (" + w + "×" + h + ")"; return out; }
  out.viewBox = { x, y, w, h };
  const svg = yaz(kokEl, true);
  if (Buffer.byteLength(svg, "utf8") > EN_COK_BAYT) { out.hata = "svg en çok 30 KB olabilir"; return out; }
  out.ok = true; out.svg = svg;
  return out;
}

// --- sekil nesnesi -----------------------------------------------------------------------------------------
const ALANLAR = ["tur", "svg", "alt", "baslik", "konum"];
/**
 * sekilDogrula(nesne, { secenek }) → { sekil|null, hatalar:[], uyarilar:[], kaldirilan:[] }
 * Geçerli çıktı: { tur:"svg", svg:(temiz), alt, baslik?, konum? } (şıkta konum yoktur; gövdede varsayılan "govde").
 */
function sekilDogrula(o, secenek) {
  const sonuc = { sekil: null, hatalar: [], uyarilar: [], kaldirilan: [] };
  const sec = !!(secenek && secenek.secenek);
  if (!o || typeof o !== "object" || Array.isArray(o)) { sonuc.hatalar.push("sekil bir nesne olmalı"); return sonuc; }
  Object.keys(o).forEach(k => { if (ALANLAR.indexOf(k) < 0) sonuc.kaldirilan.push("alan " + k); });
  if (o.tur !== "svg") sonuc.hatalar.push("tur \"svg\" olmalı");
  const alt = typeof o.alt === "string" ? o.alt.trim() : "";
  if (!alt) sonuc.hatalar.push("alt metni zorunlu (grafiği görmeyen biri soruyu çözebilmeli)");
  else if (alt.length > 2000) sonuc.hatalar.push("alt en çok 2000 karakter");
  else if (/[<>]/.test(alt)) sonuc.hatalar.push("alt düz metin olmalı (< > yok)");
  let baslik = null;
  if (o.baslik != null && o.baslik !== "") {
    baslik = typeof o.baslik === "string" ? o.baslik.trim() : "";
    if (!baslik || baslik.length > 200 || /[<>]/.test(baslik)) { sonuc.hatalar.push("baslik düz metin, en çok 200 karakter"); baslik = null; }
  }
  let konum = o.konum == null ? "govde" : o.konum;
  if (konum !== "govde" && konum !== "aciklama") { sonuc.hatalar.push("konum \"govde\" ya da \"aciklama\" olmalı"); konum = "govde"; }
  if (sec && konum !== "govde") sonuc.hatalar.push("şık şeklinde konum yalnız \"govde\" olabilir");
  const t = temizle(o.svg);
  if (!t.ok) sonuc.hatalar.push(t.hata);
  sonuc.kaldirilan.push(...t.kaldirilan);
  sonuc.uyarilar.push(...t.uyarilar);
  if (sonuc.hatalar.length) return sonuc;
  const s = { tur: "svg", svg: t.svg, alt };
  if (baslik) s.baslik = baslik;
  if (!sec) s.konum = konum;
  sonuc.sekil = s;
  return sonuc;
}

/** Soru kökü şekli: null | nesne | dizi (en çok 4). Biçim korunur (nesne → nesne, dizi → dizi). */
function sekilleriDogrula(v) {
  const sonuc = { deger: null, hatalar: [], uyarilar: [], kaldirilan: [] };
  if (v == null || (Array.isArray(v) && !v.length)) return sonuc;
  const dizi = Array.isArray(v), l = dizi ? v : [v];
  if (l.length > EN_COK_SEKIL) { sonuc.hatalar.push("en çok " + EN_COK_SEKIL + " şekil"); return sonuc; }
  const out = [];
  l.forEach((x, i) => {
    const r = sekilDogrula(x), on = dizi ? "şekil " + (i + 1) + ": " : "";
    r.hatalar.forEach(m => sonuc.hatalar.push(on + m));
    r.uyarilar.forEach(m => sonuc.uyarilar.push(on + m));
    r.kaldirilan.forEach(m => sonuc.kaldirilan.push(on + m));
    if (r.sekil) out.push(r.sekil);
  });
  if (!sonuc.hatalar.length) sonuc.deger = dizi ? out : out[0];
  return sonuc;
}

const liste = v => v == null ? [] : (Array.isArray(v) ? v : [v]).filter(x => x && typeof x === "object" && typeof x.svg === "string");
const ogrenciBicim = x => { const o = { tur: "svg", svg: x.svg, alt: x.alt }; if (x.baslik) o.baslik = x.baslik; return o; };
/** Kökle birlikte gönderilen (cevaptan ÖNCE) şekiller */
const govdeSekilleri = v => liste(v).filter(x => (x.konum || "govde") === "govde").map(ogrenciBicim);
/** Yalnız çözümde (cevaptan SONRA) gönderilen şekiller */
const cozumSekilleri = v => liste(v).filter(x => x.konum === "aciklama").map(ogrenciBicim);
/** Öğrenciye giden şık: { id, text, sekil? } */
function acikSecenek(o) {
  const x = { id: o.id, text: o.text };
  if (o.sekil && typeof o.sekil === "object" && typeof o.sekil.svg === "string") x.sekil = ogrenciBicim(o.sekil);
  return x;
}

/**
 * Soru satırının (tohum/aktarım/yönetici) şekillerini temizler. Dönüş: { satir (kopya), sorunlar:[…], uyarilar:[…], kaldirilan:[…] }.
 * Geçersiz şekil satırdan atılır (sorunlar'a yazılır) — tohum yüklemesi bozuk şekil yüzünden durmaz; pm-denetim önceden yakalar.
 */
function satirSekilTemizle(r) {
  const sonuc = { satir: r, sorunlar: [], uyarilar: [], kaldirilan: [] };
  const secVar = Array.isArray(r.secenekler) && r.secenekler.some(o => o && o.sekil != null);
  if (r.sekil == null && !secVar) return sonuc;
  const y = Object.assign({}, r);
  if (r.sekil != null) {
    const k = sekilleriDogrula(r.sekil);
    k.hatalar.forEach(m => sonuc.sorunlar.push("sekil: " + m));
    k.uyarilar.forEach(m => sonuc.uyarilar.push("sekil: " + m));
    k.kaldirilan.forEach(m => sonuc.kaldirilan.push("sekil: " + m));
    y.sekil = k.deger;
  }
  if (secVar) {
    y.secenekler = r.secenekler.map(o => {
      if (!o || o.sekil == null) return o;
      const k = sekilDogrula(o.sekil, { secenek: true }), on = "şık " + o.id + " sekil: ";
      k.hatalar.forEach(m => sonuc.sorunlar.push(on + m));
      k.uyarilar.forEach(m => sonuc.uyarilar.push(on + m));
      k.kaldirilan.forEach(m => sonuc.kaldirilan.push(on + m));
      const z = Object.assign({}, o);
      if (k.sekil) z.sekil = k.sekil; else delete z.sekil;
      return z;
    });
  }
  sonuc.satir = y;
  return sonuc;
}

module.exports = { temizle, sekilDogrula, sekilleriDogrula, satirSekilTemizle, govdeSekilleri, cozumSekilleri, acikSecenek, liste,
  EN_COK_BAYT, VIEWBOX, ETIKETLER, OZNITELIKLER, MARKER_OZ, SVG_NS };
