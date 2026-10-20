"use strict";
// Bağımlılıksız küçük HTTP katmanı: yönlendirici, JSON gövde, çerez, güvenlik başlıkları, statik dosya sunumu.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const config = require("./config");

const TURLER = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon", ".woff2": "font/woff2",
  ".woff": "font/woff", ".pdf": "application/pdf", ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".webmanifest": "application/manifest+json"
};
// Yalnızca bu klasörler ve kökteki .html/.txt/.ico/.webmanifest dosyaları sunulur
const ACIK_KLASORLER = ["assets", "data", "kaynaklar"];
const KOK_DOSYA_RE = /^[a-z0-9._-]+\.(html|txt|ico|webmanifest|png|svg|xml)$/i;

class HttpHata extends Error {
  constructor(kod, mesaj, alanlar) { super(mesaj); this.kod = kod; this.alanlar = alanlar; }
}

function cerezleriOku(req) {
  const o = {};
  String(req.headers.cookie || "").split(";").forEach(p => {
    const i = p.indexOf("=");
    if (i > 0) { const k = p.slice(0, i).trim(); try { o[k] = decodeURIComponent(p.slice(i + 1).trim()); } catch (e) { /* bozuk çerez */ } }
  });
  return o;
}

function cerezYaz(res, ad, deger, sn) {
  const parca = [ad + "=" + encodeURIComponent(deger), "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=" + Math.max(0, Math.floor(sn))];
  if (config.cookieSecure) parca.push("Secure");
  const onceki = res.getHeader("Set-Cookie");
  res.setHeader("Set-Cookie", (Array.isArray(onceki) ? onceki : onceki ? [onceki] : []).concat(parca.join("; ")));
}

function guvenlikBasliklari(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  // Sayfalar satır içi betik kullanır; MathJax cdn.jsdelivr.net'ten yüklenir
  res.setHeader("Content-Security-Policy", [
    "default-src 'self'", "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net", "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:", "font-src 'self' data: https://cdn.jsdelivr.net", "connect-src 'self'", "frame-ancestors 'self'",
    "base-uri 'self'", "form-action 'self' mailto:", "object-src 'none'"
  ].join("; "));
  if (config.cookieSecure) res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
}

function json(res, kod, govde) {
  const s = JSON.stringify(govde);
  res.statusCode = kod;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(s);
}

function govdeOku(req, sinir) {
  return new Promise((coz, red) => {
    let boy = 0; const parcalar = [];
    req.on("data", c => {
      boy += c.length;
      if (boy > sinir) { red(new HttpHata(413, "İstek çok büyük.")); req.destroy(); return; }
      parcalar.push(c);
    });
    req.on("end", () => {
      if (!parcalar.length) return coz({});
      try { coz(JSON.parse(Buffer.concat(parcalar).toString("utf8"))); } catch (e) { red(new HttpHata(400, "Geçersiz JSON.")); }
    });
    req.on("error", red);
  });
}

/** Basit yönlendirici: yol kalıbında :param desteklenir. */
function yonlendirici() {
  const kurallar = [];
  const ekle = yontem => (kalip, ...isleyiciler) => {
    const adlar = [];
    const re = new RegExp("^" + kalip.replace(/:[a-zA-Z]+/g, m => { adlar.push(m.slice(1)); return "([^/]+)"; }) + "$");
    kurallar.push({ yontem, re, adlar, isleyiciler });
  };
  return {
    get: ekle("GET"), post: ekle("POST"), put: ekle("PUT"), delete: ekle("DELETE"),
    bul(yontem, yol) {
      let yolVar = false;
      for (const k of kurallar) {
        const m = k.re.exec(yol);
        if (!m) continue;
        yolVar = true;
        if (k.yontem !== yontem) continue;
        const params = {};
        k.adlar.forEach((a, i) => { params[a] = decodeURIComponent(m[i + 1]); });
        return { isleyiciler: k.isleyiciler, params };
      }
      return yolVar ? "yontem" : null;
    }
  };
}

// --- Statik dosyalar --------------------------------------------------------
const htmlOnbellek = new Map();
function statikYol(urlYol) {
  let yol;
  try { yol = decodeURIComponent(urlYol); } catch (e) { return null; }
  if (yol === "/" || yol === "") yol = "/index.html";
  if (yol.includes("\0") || yol.includes("..")) return null;
  const parcalar = yol.split("/").filter(Boolean);
  if (!parcalar.length) return null;
  if (parcalar.length === 1) { if (!KOK_DOSYA_RE.test(parcalar[0])) return null; }
  else if (ACIK_KLASORLER.indexOf(parcalar[0]) < 0) return null;
  if (parcalar.some(p => p.startsWith("."))) return null;
  const tam = path.join(config.ROOT, ...parcalar);
  if (!tam.startsWith(config.ROOT + path.sep)) return null;
  return tam;
}

function statikSun(req, res) {
  const u = new URL(req.url, "http://x");
  const tam = statikYol(u.pathname);
  if (!tam) return false;
  let bilgi;
  try { bilgi = fs.statSync(tam); } catch (e) { return false; }
  if (!bilgi.isFile()) return false;
  const uzanti = path.extname(tam).toLowerCase();
  const tur = TURLER[uzanti];
  if (!tur) return false;
  res.setHeader("Content-Type", tur);
  const etag = 'W/"' + bilgi.size.toString(16) + "-" + Math.floor(bilgi.mtimeMs).toString(16) + '"';
  res.setHeader("ETag", etag);
  // HTML her açılışta doğrulanır; diğer varlıklar 1 saat önbellekte
  res.setHeader("Cache-Control", uzanti === ".html" ? "no-cache" : "public, max-age=3600");
  if (req.headers["if-none-match"] === etag) { res.statusCode = 304; res.end(); return true; }
  const sikistir = /\bgzip\b/.test(String(req.headers["accept-encoding"] || "")) && /^(text\/|application\/(json|javascript)|image\/svg)/.test(tur) && bilgi.size > 1024;
  if (uzanti === ".html") {
    // Sunucu modu işareti: istemci bu etiketi görünce API ile çalışır
    const anahtar = tam + ":" + etag;
    let govde = htmlOnbellek.get(anahtar);
    if (!govde) {
      const ham = fs.readFileSync(tam, "utf8");
      const ek = '<meta name="meberra-api" content="1">';
      const metin = /<head[^>]*>/i.test(ham) ? ham.replace(/<head([^>]*)>/i, m => m + "\n  " + ek) : ek + ham;
      govde = { duz: Buffer.from(metin, "utf8") };
      govde.gz = zlib.gzipSync(govde.duz);
      if (htmlOnbellek.size > 200) htmlOnbellek.clear();
      htmlOnbellek.set(anahtar, govde);
    }
    if (sikistir) { res.setHeader("Content-Encoding", "gzip"); res.setHeader("Vary", "Accept-Encoding"); res.end(req.method === "HEAD" ? undefined : govde.gz); }
    else res.end(req.method === "HEAD" ? undefined : govde.duz);
    return true;
  }
  if (req.method === "HEAD") { res.setHeader("Content-Length", bilgi.size); res.end(); return true; }
  if (sikistir) {
    res.setHeader("Content-Encoding", "gzip"); res.setHeader("Vary", "Accept-Encoding");
    fs.createReadStream(tam).pipe(zlib.createGzip()).pipe(res);
  } else {
    res.setHeader("Content-Length", bilgi.size);
    fs.createReadStream(tam).pipe(res);
  }
  return true;
}

module.exports = { HttpHata, cerezleriOku, cerezYaz, guvenlikBasliklari, json, govdeOku, yonlendirici, statikSun, statikYol };
