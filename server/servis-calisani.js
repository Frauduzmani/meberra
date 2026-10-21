"use strict";
// 1.15.0 Service worker sunumu: kökteki sw.js'deki __SURUM__ yer tutucusu package.json sürümüyle değiştirilir.
// Derleme adımı olmadığından önbellek adı (meberra-kabuk-<sürüm>) her sürümde değişir; tarayıcı sw.js'nin bayt farkını
// görünce yeni service worker'ı kurar ve "activate" eski önbellekleri siler.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("./config");

const DOSYA = path.join(config.ROOT, "sw.js");
const YER_TUTUCU = /__SURUM__/g;
let son = null; // { mtime, boy, govde, etag }

function surum() {
  try { return JSON.parse(fs.readFileSync(path.join(config.ROOT, "package.json"), "utf8")).version || "0"; }
  catch (e) { return "0"; }
}

/** sw.js gövdesi (sürüm yerleştirilmiş). Dosya değişmedikçe bellekte tutulur. */
function swGovde() {
  const b = fs.statSync(DOSYA);
  if (son && son.mtime === b.mtimeMs && son.boy === b.size) return son;
  const s = surum();
  const govde = Buffer.from(fs.readFileSync(DOSYA, "utf8").replace(YER_TUTUCU, s), "utf8");
  son = { mtime: b.mtimeMs, boy: b.size, govde, surum: s, etag: 'W/"sw-' + crypto.createHash("sha1").update(govde).digest("hex").slice(0, 16) + '"' };
  return son;
}

/** GET/HEAD /sw.js → true (sunuldu). Her açılışta ETag ile doğrulanır; Service-Worker-Allowed kök kapsamı. */
function swSun(req, res) {
  let g;
  try { g = swGovde(); } catch (e) { return false; }
  res.setHeader("Content-Type", "text/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Service-Worker-Allowed", "/");
  res.setHeader("ETag", g.etag);
  if (req.headers["if-none-match"] === g.etag) { res.statusCode = 304; res.end(); return true; }
  res.setHeader("Content-Length", g.govde.length);
  res.end(req.method === "HEAD" ? undefined : g.govde);
  return true;
}

module.exports = { swSun, swGovde };
