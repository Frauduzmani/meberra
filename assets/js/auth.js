/**
 * AP MEBERRA — Hesap ve oturum katmanı (Ajan 11, Tur 5)
 * Sözleşme: .agents/rules/tur5-platform-spec.md §2
 *
 * - Şifre düz metin SAKLANMAZ: PBKDF2-SHA-256, 16 bayt rastgele salt, 150.000 iterasyon.
 *   Web Crypto (crypto.subtle) yoksa aynı algoritmanın saf JS uygulaması kullanılır;
 *   iki yol bayt bayt aynı sonucu verir (hash'ler taşınabilir).
 * - Tüm depolama erişimi APMEBERRA_AUTH.store adaptöründen geçer (Promise döner).
 *   Sunucuya geçişte yalnızca bu adaptör REST çağrılarıyla değiştirilir.
 * - Kişi verisi takası: canlı "apmeberra:*" anahtarları (apmeberra:theme hariç) çıkışta
 *   "apmeberra-hesap:v1:veri:<id>" içine taşınır, girişte geri yüklenir.
 */
(function () {
  "use strict";

  var P = "apmeberra-hesap:v1:";
  var KEYS = {
    users: P + "kullanicilar",
    session: P + "oturum",
    active: P + "aktif",
    orphan: P + "sahipsiz",
    profile: function (id) { return P + "profil:" + id; },
    data: function (id) { return P + "veri:" + id; }
  };
  var LIVE_PREFIX = "apmeberra:";
  var DEVICE_KEYS = ["apmeberra:theme"]; // cihaz tercihi: takasa girmez
  var ITER = 150000;
  var MIN_PW = 8;
  var GENERIC_LOGIN_ERROR = "Kullanıcı adı veya şifre hatalı.";

  // ------------------------------------------------------------------------
  // 1. SAF JS SHA-256 / HMAC / PBKDF2 (crypto.subtle yoksa)
  // ------------------------------------------------------------------------
  var K256 = new Int32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);
  var IV = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  var W = new Int32Array(64);

  /** state (Int32Array 8) üzerine 16 kelimelik bir blok işler. */
  function compress(st, blk) {
    var i, t1, t2;
    for (i = 0; i < 16; i++) W[i] = blk[i];
    for (i = 16; i < 64; i++) {
      var x = W[i - 15], y = W[i - 2];
      var s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
      var s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
    }
    var a = st[0], b = st[1], c = st[2], d = st[3], e = st[4], f = st[5], g = st[6], h = st[7];
    for (i = 0; i < 64; i++) {
      t1 = (h + (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) + ((e & f) ^ (~e & g)) + K256[i] + W[i]) | 0;
      t2 = ((((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    st[0] = (st[0] + a) | 0; st[1] = (st[1] + b) | 0; st[2] = (st[2] + c) | 0; st[3] = (st[3] + d) | 0;
    st[4] = (st[4] + e) | 0; st[5] = (st[5] + f) | 0; st[6] = (st[6] + g) | 0; st[7] = (st[7] + h) | 0;
  }

  /** Genel SHA-256 (bayt dizisi -> 32 bayt). */
  function sha256(bytes) {
    var st = new Int32Array(IV);
    var len = bytes.length;
    var total = ((len + 9 + 63) >> 6) << 6;
    var buf = new Uint8Array(total);
    buf.set(bytes); buf[len] = 0x80;
    var bits = len * 8;
    buf[total - 4] = (bits >>> 24) & 255; buf[total - 3] = (bits >>> 16) & 255;
    buf[total - 2] = (bits >>> 8) & 255; buf[total - 1] = bits & 255;
    buf[total - 5] = Math.floor(len / 0x20000000) & 255;
    var blk = new Int32Array(16);
    for (var off = 0; off < total; off += 64) {
      for (var j = 0; j < 16; j++) {
        var o = off + j * 4;
        blk[j] = (buf[o] << 24) | (buf[o + 1] << 16) | (buf[o + 2] << 8) | buf[o + 3];
      }
      compress(st, blk);
    }
    var out = new Uint8Array(32);
    for (var k = 0; k < 8; k++) {
      out[k * 4] = (st[k] >>> 24) & 255; out[k * 4 + 1] = (st[k] >>> 16) & 255;
      out[k * 4 + 2] = (st[k] >>> 8) & 255; out[k * 4 + 3] = st[k] & 255;
    }
    return out;
  }

  /** PBKDF2-HMAC-SHA-256, 32 bayt çıktı. İç/dış HMAC durumları önceden hesaplanır. */
  function pbkdf2Js(pwBytes, salt, iter) {
    var key = pwBytes.length > 64 ? sha256(pwBytes) : pwBytes;
    var k = new Uint8Array(64); k.set(key);
    var ipad = new Int32Array(16), opad = new Int32Array(16);
    for (var i = 0; i < 16; i++) {
      var w = (k[i * 4] << 24) | (k[i * 4 + 1] << 16) | (k[i * 4 + 2] << 8) | k[i * 4 + 3];
      ipad[i] = w ^ 0x36363636; opad[i] = w ^ 0x5c5c5c5c;
    }
    var inner0 = new Int32Array(IV); compress(inner0, ipad);
    var outer0 = new Int32Array(IV); compress(outer0, opad);

    // U1 = HMAC(P, salt || INT(1)) — genel yol
    var msg = new Uint8Array(salt.length + 4); msg.set(salt); msg[salt.length + 3] = 1;
    var ib = new Uint8Array(64 + msg.length); ib.set(k.map(function (b) { return b ^ 0x36; })); ib.set(msg, 64);
    var ih = sha256(ib);
    var ob = new Uint8Array(96); ob.set(k.map(function (b) { return b ^ 0x5c; })); ob.set(ih, 64);
    var u8 = sha256(ob);

    var U = new Int32Array(8), T = new Int32Array(8);
    for (i = 0; i < 8; i++) { U[i] = (u8[i * 4] << 24) | (u8[i * 4 + 1] << 16) | (u8[i * 4 + 2] << 8) | u8[i * 4 + 3]; T[i] = U[i]; }
    // Sonraki turlar: 32 baytlık mesaj tek bloğa sığar (64 + 32 bayt = 768 bit uzunluk)
    var blk = new Int32Array(16); blk[8] = 0x80000000; blk[15] = 768;
    var st = new Int32Array(8);
    for (var n = 1; n < iter; n++) {
      for (i = 0; i < 8; i++) blk[i] = U[i];
      st.set(inner0); compress(st, blk);
      for (i = 0; i < 8; i++) blk[i] = st[i];
      st.set(outer0); compress(st, blk);
      for (i = 0; i < 8; i++) { U[i] = st[i]; T[i] ^= st[i]; }
    }
    var out = new Uint8Array(32);
    for (i = 0; i < 8; i++) { out[i * 4] = (T[i] >>> 24) & 255; out[i * 4 + 1] = (T[i] >>> 16) & 255; out[i * 4 + 2] = (T[i] >>> 8) & 255; out[i * 4 + 3] = T[i] & 255; }
    return out;
  }

  function utf8(s) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(s);
    var bin = unescape(encodeURIComponent(s)), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function toHex(b) { var s = ""; for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? "0" : "") + b[i].toString(16); return s; }
  function fromHex(h) { var out = new Uint8Array(h.length / 2); for (var i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16); return out; }
  function randomBytes(n) {
    var b = new Uint8Array(n);
    var c = window.crypto || window.msCrypto;
    if (c && c.getRandomValues) { c.getRandomValues(b); return b; }
    // Son çare (çok eski tarayıcı): zayıf ama boş bırakmaz
    for (var i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256);
    return b;
  }
  function hasSubtle() {
    try { return !!(window.crypto && window.crypto.subtle && window.crypto.subtle.importKey); } catch (e) { return false; }
  }

  /** PBKDF2 -> hex. Önce Web Crypto, olmazsa saf JS. */
  function derive(password, saltHex, iter) {
    var pw = utf8(String(password).normalize ? String(password).normalize("NFC") : String(password));
    var salt = fromHex(saltHex);
    if (hasSubtle() && !api._forceFallback) {
      var s = window.crypto.subtle;
      return s.importKey("raw", pw, { name: "PBKDF2" }, false, ["deriveBits"])
        .then(function (key) { return s.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt, iterations: iter }, key, 256); })
        .then(function (bits) { return toHex(new Uint8Array(bits)); })
        .catch(function () { return toHex(pbkdf2Js(pw, salt, iter)); });
    }
    return new Promise(function (res) { setTimeout(function () { res(toHex(pbkdf2Js(pw, salt, iter))); }, 0); });
  }
  function safeEqual(a, b) {
    a = String(a || ""); b = String(b || "");
    var diff = a.length ^ b.length;
    for (var i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    return diff === 0;
  }

  // ------------------------------------------------------------------------
  // 2. DEPOLAMA ADAPTÖRÜ — tek erişim noktası (Promise döner)
  //    Sunucuya geçişte yalnızca bu nesne REST çağrılarıyla değiştirilir.
  // ------------------------------------------------------------------------
  function lsGet(k) { try { var r = window.localStorage.getItem(k); return r == null ? null : JSON.parse(r); } catch (e) { return null; } }
  function lsSet(k, v) { window.localStorage.setItem(k, JSON.stringify(v)); }
  function lsDel(k) { try { window.localStorage.removeItem(k); } catch (e) { /* yok say */ } }
  function liveKeys() {
    var out = [];
    try {
      for (var i = 0; i < window.localStorage.length; i++) {
        var k = window.localStorage.key(i);
        if (k && k.indexOf(LIVE_PREFIX) === 0 && DEVICE_KEYS.indexOf(k) < 0) out.push(k);
      }
    } catch (e) { /* depolama kapalı */ }
    return out;
  }
  function wrap(fn) { return function () { var a = arguments; return new Promise(function (res) { res(fn.apply(null, a)); }); }; }

  var store = {
    /** Depolama kullanılabilir mi? */
    available: wrap(function () {
      try { var t = P + "test"; window.localStorage.setItem(t, "1"); window.localStorage.removeItem(t); return true; } catch (e) { return false; }
    }),
    /** Tüm hesaplar (hash/salt dahil — yalnızca bu dosya içinde kullanılır). */
    getUsers: wrap(function () { var u = lsGet(KEYS.users); return Array.isArray(u) ? u : []; }),
    /** Kullanıcı adına göre (büyük/küçük harf duyarsız) hesap. */
    findUser: wrap(function (name) {
      var n = normUser(name), u = lsGet(KEYS.users);
      return (Array.isArray(u) ? u : []).filter(function (x) { return normUser(x.kullaniciAdi) === n; })[0] || null;
    }),
    getUser: wrap(function (id) {
      var u = lsGet(KEYS.users);
      return (Array.isArray(u) ? u : []).filter(function (x) { return x.id === id; })[0] || null;
    }),
    /** Hesap ekler ya da id'si aynı olanı günceller. */
    saveUser: wrap(function (user) {
      var list = lsGet(KEYS.users); if (!Array.isArray(list)) list = [];
      var i = list.findIndex(function (x) { return x.id === user.id; });
      if (i >= 0) list[i] = user; else list.push(user);
      lsSet(KEYS.users, list);
      return user;
    }),
    getProfile: wrap(function (id) { return lsGet(KEYS.profile(id)); }),
    saveProfile: wrap(function (id, p) { lsSet(KEYS.profile(id), p); return p; }),
    getSession: wrap(function () { return lsGet(KEYS.session); }),
    setSession: wrap(function (s) { lsSet(KEYS.session, s); return s; }),
    clearSession: wrap(function () { lsDel(KEYS.session); }),
    // --- Cihaz üzerindeki kişi verisi takası (sunucuda: ilerleme senkronu) ---
    getActive: wrap(function () { return lsGet(KEYS.active); }),
    setActive: wrap(function (id) { lsSet(KEYS.active, id); }),
    clearActive: wrap(function () { lsDel(KEYS.active); }),
    /** Canlı apmeberra:* anahtarlarının ham kopyası {anahtar: hamDize}. */
    snapshotLive: wrap(function () {
      var o = {}; liveKeys().forEach(function (k) { o[k] = window.localStorage.getItem(k); }); return o;
    }),
    clearLive: wrap(function () { liveKeys().forEach(lsDel); }),
    /** Canlı veriyi kullanıcının kasasına taşır (yazma başarısızsa canlı veri silinmez). */
    stashLive: wrap(function (id) {
      var o = {}; liveKeys().forEach(function (k) { o[k] = window.localStorage.getItem(k); });
      lsSet(KEYS.data(id), { kaydedildi: new Date().toISOString(), anahtarlar: o });
      Object.keys(o).forEach(lsDel);
      return Object.keys(o).length;
    }),
    /** Kullanıcının kasasını canlı anahtarlara geri yazar ve kasayı boşaltır. */
    restoreLive: wrap(function (id) {
      var v = lsGet(KEYS.data(id));
      var keys = v && v.anahtarlar && typeof v.anahtarlar === "object" ? v.anahtarlar : {};
      Object.keys(keys).forEach(function (k) {
        if (k.indexOf(LIVE_PREFIX) === 0 && DEVICE_KEYS.indexOf(k) < 0 && typeof keys[k] === "string") window.localStorage.setItem(k, keys[k]);
      });
      lsDel(KEYS.data(id));
      return Object.keys(keys).length;
    }),
    getOrphan: wrap(function () { return lsGet(KEYS.orphan); }),
    setOrphan: wrap(function (o) { lsSet(KEYS.orphan, o); }),
    clearOrphan: wrap(function () { lsDel(KEYS.orphan); })
  };

  // ------------------------------------------------------------------------
  // 3. DOĞRULAMA
  // ------------------------------------------------------------------------
  function normUser(s) { return String(s || "").trim().toLowerCase(); }
  var USER_RE = /^[A-Za-z0-9._@+-]{3,64}$/;

  function validateNewPassword(pw, pw2) {
    var e = {};
    if (!pw || pw.length < MIN_PW) e.sifre = "Şifre en az " + MIN_PW + " karakter olmalı.";
    else if (pw.length > 128) e.sifre = "Şifre en fazla 128 karakter olabilir.";
    if (!e.sifre && pw !== pw2) e.sifre2 = "Şifreler eşleşmiyor.";
    else if (!pw2) e.sifre2 = "Şifreyi tekrar yaz.";
    return e;
  }

  function publicUser(u) {
    if (!u) return null;
    return { id: u.id, ad: u.ad, soyad: u.soyad, kullaniciAdi: u.kullaniciAdi, olusturma: u.olusturma };
  }

  var REC_ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // karışan karakterler yok (0/O, 1/I)
  function newRecoveryCode() {
    var b = randomBytes(16), s = "";
    for (var i = 0; i < 16; i++) { s += REC_ALPHA[b[i] % 32]; if (i % 4 === 3 && i < 15) s += "-"; }
    return s;
  }
  function normRecovery(c) { return String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }

  function setPasswordFields(user, pw) {
    var salt = toHex(randomBytes(16));
    return derive(pw, salt, ITER).then(function (h) { user.salt = salt; user.hash = h; user.iter = ITER; return user; });
  }
  function setRecoveryFields(user) {
    var code = newRecoveryCode(), salt = toHex(randomBytes(16));
    return derive(normRecovery(code), salt, ITER).then(function (h) {
      user.kurtarmaSalt = salt; user.kurtarmaHash = h; user.kurtarmaIter = ITER; user.kurtarmaTarih = new Date().toISOString();
      return code;
    });
  }

  // ------------------------------------------------------------------------
  // 4. OTURUM VE VERİ TAKASI
  // ------------------------------------------------------------------------
  /** id kullanıcısını cihazın "aktif veri sahibi" yapar. Dönüş: {orphan: özet|null} */
  function activate(id) {
    return Promise.all([store.getActive(), store.snapshotLive(), store.getOrphan()]).then(function (r) {
      var aktif = r[0], live = r[1], parked = r[2];
      var chain = Promise.resolve();
      if (aktif && aktif !== id) {
        chain = chain.then(function () { return store.stashLive(aktif); });
      } else if (!aktif && Object.keys(live).length) {
        // Hesap sistemi öncesi (sahipsiz) ilerleme: kaybolmasın diye önce park edilir
        chain = chain.then(function () {
          var merged = parked && parked.anahtarlar ? parked.anahtarlar : {};
          Object.keys(live).forEach(function (k) { merged[k] = live[k]; });
          return store.setOrphan({ bulunma: (parked && parked.bulunma) || new Date().toISOString(), anahtarlar: merged, reddeden: (parked && parked.reddeden) || [] });
        }).then(function () { return store.clearLive(); });
      }
      if (aktif !== id) chain = chain.then(function () { return store.restoreLive(id); });
      return chain
        .then(function () { return store.setActive(id); })
        .then(function () { return store.setSession({ id: id, baslangic: new Date().toISOString() }); })
        .then(function () { return orphanInfo(id); })
        .then(function (o) { return { orphan: o }; });
    });
  }

  /** Bu kullanıcıya teklif edilecek sahipsiz veri varsa özetini döndürür. */
  function orphanInfo(id) {
    return store.getOrphan().then(function (o) {
      if (!o || !o.anahtarlar || !Object.keys(o.anahtarlar).length) return null;
      if (id && Array.isArray(o.reddeden) && o.reddeden.indexOf(id) >= 0) return null;
      return { bulunma: o.bulunma, ozet: summarizeRaw(o.anahtarlar), anahtarSayisi: Object.keys(o.anahtarlar).length };
    });
  }
  function summarizeRaw(raw) {
    var dec = {};
    Object.keys(raw).forEach(function (k) { try { dec[k] = JSON.parse(raw[k]); } catch (e) { dec[k] = raw[k]; } });
    var B = window.APMEBERRA && window.APMEBERRA.backup;
    if (B && B.summarize) return B.summarize(dec);
    return { cozulen: 0, dogru: 0, yanlis: 0, acikHata: 0, hataKaydi: 0 };
  }

  // ------------------------------------------------------------------------
  // PROFİL (§2 zorunlu alanlar + §7.3 isteğe bağlı alanlar)
  // ------------------------------------------------------------------------
  var EXTRA_FIELDS = ["eposta", "dogumTarihi", "okulSehir", "mezuniyetYili"];
  /**
   * Tur 10, Karar K5-a: yalnızca mezunda sorulan ve saklanan alanlar (mezuniyetYili ile aynı mantık).
   * hedefBaslangicYili: "YYYY" (bu yıl … +3; boş gönderilirse bir sonraki akademik yıl).
   * yerlesmeDurumu: "uygun" | "yok" | "alan-uyumsuz". Eski profillerde alan yoksa okuma tarafı
   * (eposta.js / rota.js) varsayılanla çalışır; alan sessizce yazılmaz.
   */
  var MEZUN_FIELDS = ["hedefBaslangicYili", "yerlesmeDurumu"];
  var YERLESME_DURUMLARI = ["uygun", "yok", "alan-uyumsuz"];
  /**
   * Tur 11 (karar D5, plan §4): öğrenci modeli, 15 ülke, eğitim dili, üniversite mezunu alanları.
   * ogrenciModeli ana alandır; sinif geriye uyum için modelden türetilir (lise -> 9–12, lise-mezun -> "mezun",
   * uni-mezun -> "lisans-mezun"). Aynı listeler app.js ve sartlar-motor.js'te de var (profil-v2-birim-test denetler).
   */
  var MODELLER = ["lise", "lise-mezun", "uni-mezun"];
  var MODEL_AD = { "lise": "Lise öğrencisi", "lise-mezun": "Lise mezunu", "uni-mezun": "Üniversite mezunu" };
  var ULKE_KODLARI = ["de", "it", "at", "ch", "nl", "be", "fr", "es", "se", "fi", "dk", "ie", "hu", "pl", "cz"];
  var ULKE_ADLARI = { de: "Almanya", it: "İtalya", at: "Avusturya", ch: "İsviçre", nl: "Hollanda", be: "Belçika", fr: "Fransa", es: "İspanya", se: "İsveç", fi: "Finlandiya", dk: "Danimarka", ie: "İrlanda", hu: "Macaristan", pl: "Polonya", cz: "Çekya" };
  var EN_FAZLA_ULKE = 5;
  var DILLER = ["en", "yerel"];
  var UNI_FIELDS = ["lisansAlani", "lisansUniversitesi", "lisansDurumu", "lisansMezuniyetYili", "gpa4"];
  var LISANS_DURUMLARI = ["mezun", "son-sinif"];
  var PROFIL_EK = EXTRA_FIELDS.concat(MEZUN_FIELDS, UNI_FIELDS);
  function modelFromSinif(s) { return s === "mezun" ? "lise-mezun" : s === "lisans-mezun" ? "uni-mezun" : /^(9|10|11|12)$/.test(String(s || "")) ? "lise" : null; }
  function sinifFromModel(m, s) { return m === "lise-mezun" ? "mezun" : m === "uni-mezun" ? "lisans-mezun" : (/^(9|10|11|12)$/.test(String(s || "")) ? String(s) : ""); }
  /**
   * Eski kaydı OKUMA anında yeni şemaya taşır (plan §4.3); saf ve idempotent, depoya yazmaz.
   * ogrenciModeli yoksa sinif'tan; egitimDili yoksa "en"; tanınmayan/tekrarlı ülke kodları atılır.
   */
  function profilNormallestir(p) {
    if (!p || typeof p !== "object" || Array.isArray(p)) return p;
    var o = {}; Object.keys(p).forEach(function (k) { o[k] = p[k]; });
    if (MODELLER.indexOf(o.ogrenciModeli) < 0) o.ogrenciModeli = modelFromSinif(o.sinif);
    if (o.ogrenciModeli === "lise-mezun" || o.ogrenciModeli === "uni-mezun") o.sinif = sinifFromModel(o.ogrenciModeli);
    if (DILLER.indexOf(o.egitimDili) < 0) o.egitimDili = "en";
    if (Array.isArray(o.ulkeler)) o.ulkeler = o.ulkeler.filter(function (u, i, a) { return ULKE_KODLARI.indexOf(u) >= 0 && a.indexOf(u) === i; });
    return o;
  }
  /** Üniversite mezunu alanları. Dönüş: {alan: değer | "" (sil)}; model uni-mezun değilse hepsi silinir. */
  function validateUni(p, eski, model, e) {
    var out = {};
    function has(k) { return Object.prototype.hasOwnProperty.call(p, k) && p[k] !== undefined && p[k] !== null; }
    if (model !== "uni-mezun") { UNI_FIELDS.forEach(function (k) { if (has(k) || (eski && eski[k] != null)) out[k] = ""; }); return out; }
    var v = function (k) { return has(k) ? String(p[k]).trim().replace(/\s+/g, " ") : (eski && eski[k] != null ? String(eski[k]) : ""); };
    var alan = v("lisansAlani");
    if (!alan) e.lisansAlani = "Lisans alanını yaz (ör. Makine Mühendisliği).";
    else if (alan.length > 80) e.lisansAlani = "Lisans alanı en fazla 80 karakter olabilir.";
    out.lisansAlani = alan;
    var uni = v("lisansUniversitesi");
    if (uni.length > 100) e.lisansUniversitesi = "Üniversite adı en fazla 100 karakter olabilir.";
    out.lisansUniversitesi = uni;
    var du = v("lisansDurumu");
    if (LISANS_DURUMLARI.indexOf(du) < 0) e.lisansDurumu = "Lisans durumunu seç.";
    out.lisansDurumu = du;
    var y = v("lisansMezuniyetYili"), Y = new Date().getFullYear();
    if (!/^\d{4}$/.test(y)) e.lisansMezuniyetYili = "Mezuniyet yılını 4 haneli yaz.";
    else if (du === "mezun" && !(+y >= 1980 && +y <= Y)) e.lisansMezuniyetYili = "Mezun olduğun yıl 1980–" + Y + " arasında olmalı.";
    else if (du === "son-sinif" && !(+y >= Y && +y <= Y + 1)) e.lisansMezuniyetYili = "Beklenen mezuniyet yılı " + Y + " ya da " + (Y + 1) + " olmalı.";
    out.lisansMezuniyetYili = y;
    var g = v("gpa4").replace(",", ".");
    if (g && !(/^\d(\.\d{1,2})?$/.test(g) && +g >= 0 && +g <= 4)) e.gpa4 = "Not ortalamasını 4'lük sistemde, en fazla iki ondalıkla yaz (ör. 3.25).";
    out.gpa4 = g;
    return out;
  }
  /** Bir sonraki akademik yılın başladığı takvim yılı (eposta.js varsayilanHedefYili ile aynı kural). */
  function varsayilanHedefYili(now) {
    var d = now || new Date();
    return (d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1) + 1;
  }
  var EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[A-Za-z]{2,}$/;

  /**
   * İsteğe bağlı alanları doğrular; hataları e'ye yazar.
   * Dönüş: {alan: değer | "" (sil) | undefined (dokunma)}
   */
  function validateExtras(p, eski, sinif, e) {
    var out = {};
    function has(k) { return Object.prototype.hasOwnProperty.call(p, k) && p[k] !== undefined && p[k] !== null; }
    if (has("eposta")) {
      var em = String(p.eposta).trim();
      if (em && (em.length > 120 || !EMAIL_RE.test(em))) e.eposta = "Geçerli bir e-posta adresi yaz (ör. ad.soyad@ornek.com).";
      out.eposta = em;
    }
    if (has("dogumTarihi")) {
      var dt = String(p.dogumTarihi).trim();
      if (dt) {
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dt), d = m && new Date(+m[1], +m[2] - 1, +m[3]);
        var yil = new Date().getFullYear();
        if (!m || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) e.dogumTarihi = "Tarihi gün/ay/yıl olarak seç.";
        else if (+m[1] < yil - 40 || +m[1] > yil - 10) e.dogumTarihi = "Doğum yılı " + (yil - 40) + "–" + (yil - 10) + " arasında olmalı.";
      }
      out.dogumTarihi = dt;
    }
    if (has("okulSehir")) {
      var sh = String(p.okulSehir).trim().replace(/\s+/g, " ");
      if (sh.length > 60) e.okulSehir = "Şehir adı en fazla 60 karakter olabilir.";
      out.okulSehir = sh || "İstanbul";
    }
    if (has("mezuniyetYili")) {
      var my = String(p.mezuniyetYili).trim();
      if (sinif !== "mezun") my = "";
      else if (my && !(/^\d{4}$/.test(my) && +my >= 1990 && +my <= new Date().getFullYear())) e.mezuniyetYili = "Mezuniyet yılını 4 haneli yaz (en geç bu yıl).";
      out.mezuniyetYili = my;
    } else if (sinif && sinif !== "mezun" && eski && eski.mezuniyetYili) {
      out.mezuniyetYili = ""; // artık mezun değil: elle girilen yıl silinir
    }
    // K5-a: mezun alanları. Tur 11: hedefBaslangicYili üniversite mezununda da kullanılır; yerlesmeDurumu yalnızca lise mezununda.
    if (sinif === "lisans-mezun") {
      if (has("yerlesmeDurumu") || (eski && eski.yerlesmeDurumu)) out.yerlesmeDurumu = "";
      var hy2 = has("hedefBaslangicYili") ? String(p.hedefBaslangicYili).trim() : (eski && eski.hedefBaslangicYili) || "", Y2 = new Date().getFullYear();
      if (!hy2) hy2 = String(varsayilanHedefYili());
      else if (!(/^\d{4}$/.test(hy2) && +hy2 >= Y2 && +hy2 <= Y2 + 3)) e.hedefBaslangicYili = "Hedef başlangıç yılını " + Y2 + "–" + (Y2 + 3) + " arasından seç.";
      out.hedefBaslangicYili = hy2;
    } else if (sinif && sinif !== "mezun") {
      MEZUN_FIELDS.forEach(function (k) { if (has(k) || (eski && eski[k])) out[k] = ""; }); // artık mezun değil: silinir
    } else if (sinif === "mezun") {
      if (has("hedefBaslangicYili")) {
        var hy = String(p.hedefBaslangicYili).trim(), Y = new Date().getFullYear();
        if (!hy) hy = String(varsayilanHedefYili());
        else if (!(/^\d{4}$/.test(hy) && +hy >= Y && +hy <= Y + 3)) e.hedefBaslangicYili = "Hedef başlangıç yılını " + Y + "–" + (Y + 3) + " arasından seç.";
        out.hedefBaslangicYili = hy;
      }
      if (has("yerlesmeDurumu")) {
        var yd = String(p.yerlesmeDurumu).trim();
        if (!yd) e.yerlesmeDurumu = "Yerleşme durumunu seç.";
        else if (YERLESME_DURUMLARI.indexOf(yd) < 0) e.yerlesmeDurumu = "Yerleşme durumunu listeden seç.";
        out.yerlesmeDurumu = yd;
      }
    }
    return out;
  }

  /**
   * §8.2 rota alanları. aktifRota: profildeki ülkelerden biri (yoksa eski seçim, o da yoksa ilk ülke).
   * hedefAlan: serbest metin, en fazla 60 karakter; boşsa "Mühendislik".
   */
  var VARSAYILAN_ALAN = "Mühendislik";
  function validateRota(p, eski, ulkeler, e) {
    eski = eski || {};
    var aktif = [p.aktifRota, eski.aktifRota].filter(function (u) { return ulkeler.indexOf(u) >= 0; })[0] || ulkeler[0] || null;
    var alan = p.hedefAlan !== undefined && p.hedefAlan !== null ? String(p.hedefAlan) : (eski.hedefAlan || "");
    alan = alan.trim().replace(/\s+/g, " ");
    if (alan.length > 60) e.hedefAlan = "Hedef alan en fazla 60 karakter olabilir.";
    return { aktifRota: aktif, hedefAlan: alan || VARSAYILAN_ALAN };
  }

  function saveProfileMerged(id, p, eski) {
    var e = {};
    var okul = String(p.okul || "").trim().replace(/\s+/g, " ");
    // Tur 11: üniversite mezununda okul sorulmaz; gönderilmediyse eski kayıttaki lise adı korunur
    if (p.okul == null && p.ogrenciModeli === "uni-mezun" && eski && eski.okul) okul = String(eski.okul);
    // Tur 11: model ana alan; gönderilmezse eski sinif alanından türetilir (eski çağıranlar ve testler bozulmaz)
    var model = MODELLER.indexOf(p.ogrenciModeli) >= 0 ? p.ogrenciModeli : modelFromSinif(String(p.sinif || ""));
    var sinif = model ? sinifFromModel(model, p.sinif) : "";
    var ulkeler = (Array.isArray(p.ulkeler) ? p.ulkeler : []).filter(function (u, i, a) { return ULKE_KODLARI.indexOf(u) >= 0 && a.indexOf(u) === i; });
    if (okul.length > 100) e.okul = "Okul adı en fazla 100 karakter olabilir.";
    if (!model) e.sinif = "Sınıfını seç.";
    else if (!sinif) e.sinif = "Sınıfını seç.";
    if (!ulkeler.length) e.ulkeler = "En az bir hedef ülke seç.";
    else if (ulkeler.length > EN_FAZLA_ULKE) e.ulkeler = "En fazla " + EN_FAZLA_ULKE + " ülke seçebilirsin.";
    var dil = p.egitimDili != null ? String(p.egitimDili) : (eski && eski.egitimDili) || "en";
    if (DILLER.indexOf(dil) < 0) e.egitimDili = "Eğitim dilini seç.";
    var ek = validateExtras(p, eski, sinif, e);
    var uniEk = validateUni(p, eski, model, e);
    Object.keys(uniEk).forEach(function (k) { ek[k] = uniEk[k]; });
    var rota = validateRota(p, eski, ulkeler, e);
    if (Object.keys(e).length) return { ok: false, errors: e };
    // Bilinmeyen (ileride eklenecek) alanlar korunur; bilinen alanlar aşağıda yeniden yazılır
    var prof = {};
    Object.keys(eski || {}).forEach(function (k) { if (PROFIL_EK.indexOf(k) < 0) prof[k] = eski[k]; });
    prof.okul = okul; prof.ogrenciModeli = model; prof.sinif = sinif; prof.ulkeler = ulkeler; prof.egitimDili = dil; prof.tamamlandi = true; prof.guncelleme = new Date().toISOString();
    prof.aktifRota = rota.aktifRota; prof.hedefAlan = rota.hedefAlan;
    PROFIL_EK.forEach(function (k) {
      var v = ek[k] !== undefined ? ek[k] : eski[k];
      if (v !== undefined && v !== null && v !== "") prof[k] = v;
    });
    if (!prof.okulSehir) prof.okulSehir = "İstanbul";
    if (!prof.okul) delete prof.okul;
    return store.saveProfile(id, prof).then(function () { return { ok: true, profile: prof }; })
      .catch(function () { return { ok: false, errors: { genel: "Profil kaydedilemedi (depolama dolu ya da kapalı)." } }; });
  }

  var api = {
    KEYS: KEYS,
    ITER: ITER,
    MIN_PW: MIN_PW,
    store: store,
    _forceFallback: false,
    _pbkdf2Js: function (pw, saltHex, iter) { return toHex(pbkdf2Js(utf8(pw), fromHex(saltHex), iter)); },
    _derive: derive,
    usingWebCrypto: hasSubtle,

    /** Kayıt + otomatik giriş. Dönüş: {ok, errors?, user?, kurtarmaKodu?, orphan?} */
    register: function (f) {
      f = f || {};
      var ad = String(f.ad || "").trim().replace(/\s+/g, " ");
      var soyad = String(f.soyad || "").trim().replace(/\s+/g, " ");
      var kad = String(f.kullaniciAdi || "").trim();
      var e = {};
      if (!ad) e.ad = "Adını yaz."; else if (ad.length > 40) e.ad = "Ad en fazla 40 karakter olabilir.";
      if (!soyad) e.soyad = "Soyadını yaz."; else if (soyad.length > 40) e.soyad = "Soyad en fazla 40 karakter olabilir.";
      if (!kad) e.kullaniciAdi = "Bir kullanıcı adı ya da e-posta yaz.";
      else if (!USER_RE.test(kad)) e.kullaniciAdi = "3–64 karakter; yalnızca İngilizce harf, rakam ve . _ - @ + kullanılabilir.";
      var pe = validateNewPassword(f.sifre || "", f.sifre2 || "");
      Object.keys(pe).forEach(function (k) { e[k] = pe[k]; });
      return store.available().then(function (ok) {
        if (!ok) return { ok: false, errors: { genel: "Tarayıcı depolaması kapalı (gizli pencere ya da güvenlik ayarı). Hesap oluşturulamaz." } };
        return (e.kullaniciAdi ? Promise.resolve(null) : store.findUser(kad)).then(function (exists) {
          if (exists) e.kullaniciAdi = "Bu kullanıcı adı bu cihazda zaten kayıtlı. Giriş yap ya da başka bir ad seç.";
          if (Object.keys(e).length) return { ok: false, errors: e };
          var user = { id: "u" + toHex(randomBytes(8)), ad: ad, soyad: soyad, kullaniciAdi: kad, olusturma: new Date().toISOString() };
          var code;
          return setPasswordFields(user, f.sifre)
            .then(function () { return setRecoveryFields(user); })
            .then(function (c) { code = c; return store.saveUser(user); })
            .then(function () { return activate(user.id); })
            .then(function (a) { return { ok: true, user: publicUser(user), kurtarmaKodu: code, orphan: a.orphan }; });
        });
      }).catch(function () {
        return { ok: false, errors: { genel: "Hesap kaydedilemedi: tarayıcı depolaması dolu ya da kapalı olabilir." } };
      });
    },

    /** Giriş. Hatalı girişte her durumda aynı genel mesaj. */
    login: function (kullaniciAdi, sifre) {
      return store.findUser(kullaniciAdi).then(function (u) {
        if (!u || !sifre) {
          // Var olmayan kullanıcıda da benzer süre harcansın
          return derive(String(sifre || "x"), toHex(randomBytes(16)), ITER).then(function () { return { ok: false, error: GENERIC_LOGIN_ERROR }; });
        }
        return derive(sifre, u.salt, u.iter || ITER).then(function (h) {
          if (!safeEqual(h, u.hash)) return { ok: false, error: GENERIC_LOGIN_ERROR };
          return activate(u.id).then(function (a) { return { ok: true, user: publicUser(u), orphan: a.orphan }; });
        });
      }).catch(function () { return { ok: false, error: "Giriş yapılamadı: tarayıcı depolamasına erişilemiyor." }; });
    },

    /** Çıkış: canlı veri kullanıcının kasasına taşınır, oturum kapanır. */
    logout: function () {
      return store.getActive().then(function (aktif) {
        return (aktif ? store.stashLive(aktif).then(function () { return store.clearActive(); }) : Promise.resolve())
          .then(function () { return store.clearSession(); })
          .then(function () { return { ok: true }; });
      }).catch(function () { return { ok: false, error: "Çıkış sırasında veriler kaydedilemedi (depolama dolu olabilir). Önce Yedek Al kullan." }; });
    },

    /** Oturumdaki kullanıcı + profil. Oturum yoksa null. */
    current: function () {
      return store.getSession().then(function (s) {
        if (!s || !s.id) return null;
        return Promise.all([store.getUser(s.id), store.getProfile(s.id)]).then(function (r) {
          if (!r[0]) return null;
          return { user: publicUser(r[0]), profile: r[1] ? profilNormallestir(r[1]) : null, session: s };
        });
      });
    },

    getProfile: function (id) { return store.getProfile(id); },
    /**
     * Profil kaydı (okul, sinif, ulkeler + §7.3 isteğe bağlı alanlar).
     * İsteğe bağlı alan (eposta, dogumTarihi, okulSehir, mezuniyetYili) p içinde yoksa
     * kayıtlı değer korunur; boş dize gönderilirse silinir. Dönüş: {ok, errors?, profile?}
     */
    saveProfile: function (id, p) {
      p = p || {};
      return store.getProfile(id).then(function (eski) { return saveProfileMerged(id, p, eski || {}); });
    },
    /** Yalnızca §7.3 isteğe bağlı alanlarını günceller (Yazışmalarım sayfası). */
    updateProfileExtras: function (id, p) {
      return store.getProfile(id).then(function (eski) {
        if (!eski || !eski.tamamlandi) return { ok: false, errors: { genel: "Önce profilini tamamla." } };
        var e = {}, ek = validateExtras(p || {}, eski, eski.sinif, e);
        if (Object.keys(e).length) return { ok: false, errors: e };
        var prof = {}; Object.keys(eski).forEach(function (k) { prof[k] = eski[k]; });
        PROFIL_EK.forEach(function (k) { if (ek[k] === "") delete prof[k]; else if (ek[k] !== undefined) prof[k] = ek[k]; });
        prof.guncelleme = new Date().toISOString();
        return store.saveProfile(id, prof).then(function () { return { ok: true, profile: prof }; });
      }).catch(function () { return { ok: false, errors: { genel: "Profil kaydedilemedi (depolama dolu ya da kapalı)." } }; });
    },
    /** Yalnızca aktif rotayı değiştirir (profildeki ülkelerden biri olmalı). Dönüş: {ok, profile?} */
    setAktifRota: function (id, ulke) {
      return store.getProfile(id).then(function (eski) {
        if (!eski || !eski.tamamlandi || !Array.isArray(eski.ulkeler) || eski.ulkeler.indexOf(ulke) < 0) return { ok: false, errors: { genel: "Bu rota profilinde seçili değil." } };
        var prof = {}; Object.keys(eski).forEach(function (k) { prof[k] = eski[k]; });
        prof.aktifRota = ulke;
        prof.guncelleme = new Date().toISOString();
        return store.saveProfile(id, prof).then(function () { return { ok: true, profile: prof }; });
      }).catch(function () { return { ok: false, errors: { genel: "Profil kaydedilemedi (depolama dolu ya da kapalı)." } }; });
    },
    VARSAYILAN_ALAN: VARSAYILAN_ALAN,
    EXTRA_FIELDS: EXTRA_FIELDS,
    MEZUN_FIELDS: MEZUN_FIELDS,
    UNI_FIELDS: UNI_FIELDS,
    MODELLER: MODELLER,
    MODEL_AD: MODEL_AD,
    ULKE_KODLARI: ULKE_KODLARI,
    ULKE_ADLARI: ULKE_ADLARI,
    EN_FAZLA_ULKE: EN_FAZLA_ULKE,
    profilNormallestir: profilNormallestir,
    modelFromSinif: modelFromSinif,
    YERLESME_DURUMLARI: YERLESME_DURUMLARI,
    /** Mezun profil sorusunun etiketleri (K5-a; sihirbaz ve profil sayfası aynı metni kullanır). */
    YERLESME_ETIKET: {
      "uygun": "Hedef alanla uyumlu bir lisans programına yerleştim",
      "yok": "Yerleşmem yok",
      "alan-uyumsuz": "Yerleştim ama alan farklı"
    },
    varsayilanHedefYili: varsayilanHedefYili,
    validateEmail: function (s) { return EMAIL_RE.test(String(s || "").trim()); },

    changePassword: function (id, eski, yeni, yeni2) {
      var e = validateNewPassword(yeni, yeni2);
      return store.getUser(id).then(function (u) {
        if (!u) return { ok: false, errors: { genel: "Oturum bulunamadı. Yeniden giriş yap." } };
        return derive(eski || "", u.salt, u.iter || ITER).then(function (h) {
          if (!safeEqual(h, u.hash)) e.eski = "Mevcut şifre hatalı.";
          if (Object.keys(e).length) return { ok: false, errors: e };
          return setPasswordFields(u, yeni).then(function () { return store.saveUser(u); }).then(function () { return { ok: true }; });
        });
      });
    },

    /** Kurtarma koduyla yeni şifre. Başarılıysa yeni kurtarma kodu döner (eskisi geçersiz). */
    resetWithRecovery: function (kullaniciAdi, kod, yeni, yeni2) {
      var e = validateNewPassword(yeni, yeni2);
      var GENERIC = "Kullanıcı adı veya kurtarma kodu hatalı.";
      return store.findUser(kullaniciAdi).then(function (u) {
        var c = normRecovery(kod);
        if (!u || !u.kurtarmaHash || c.length !== 16) {
          return derive(c || "x", toHex(randomBytes(16)), ITER).then(function () { e.genel = GENERIC; return { ok: false, errors: e }; });
        }
        return derive(c, u.kurtarmaSalt, u.kurtarmaIter || ITER).then(function (h) {
          if (!safeEqual(h, u.kurtarmaHash)) { e.genel = GENERIC; return { ok: false, errors: e }; }
          if (Object.keys(e).length) return { ok: false, errors: e };
          var code;
          return setPasswordFields(u, yeni)
            .then(function () { return setRecoveryFields(u); })
            .then(function (cc) { code = cc; return store.saveUser(u); })
            .then(function () { return { ok: true, kurtarmaKodu: code }; });
        });
      });
    },

    /** Şifre doğrulanarak yeni kurtarma kodu üretir. */
    newRecoveryCode: function (id, sifre) {
      return store.getUser(id).then(function (u) {
        if (!u) return { ok: false, errors: { genel: "Oturum bulunamadı." } };
        return derive(sifre || "", u.salt, u.iter || ITER).then(function (h) {
          if (!safeEqual(h, u.hash)) return { ok: false, errors: { sifre: "Şifre hatalı." } };
          var code;
          return setRecoveryFields(u).then(function (c) { code = c; return store.saveUser(u); })
            .then(function () { return { ok: true, kurtarmaKodu: code }; });
        });
      });
    },

    orphanInfo: orphanInfo,
    /** Sahipsiz ilerlemeyi oturumdaki kullanıcının verisiyle birleştirir. */
    acceptOrphan: function () {
      return store.getOrphan().then(function (o) {
        if (!o || !o.anahtarlar) return { ok: false };
        var dec = {};
        Object.keys(o.anahtarlar).forEach(function (k) {
          if (DEVICE_KEYS.indexOf(k) >= 0) return;
          try { var v = JSON.parse(o.anahtarlar[k]); dec[k] = (v !== null && typeof v === "object") ? v : o.anahtarlar[k]; } catch (e) { dec[k] = o.anahtarlar[k]; }
        });
        var B = window.APMEBERRA && window.APMEBERRA.backup;
        if (B && B.apply) {
          B.apply({ olusturma: null, anahtarlar: dec, ozet: B.summarize(dec) }, "merge");
        } else {
          Object.keys(o.anahtarlar).forEach(function (k) { try { if (window.localStorage.getItem(k) == null) window.localStorage.setItem(k, o.anahtarlar[k]); } catch (e) { /* yok say */ } });
        }
        return store.clearOrphan().then(function () { return { ok: true }; });
      });
    },
    /** Teklifi reddet: veri silinmez, bu kullanıcıya bir daha sorulmaz (profilden aktarılabilir). */
    declineOrphan: function (id) {
      return store.getOrphan().then(function (o) {
        if (!o) return;
        o.reddeden = Array.isArray(o.reddeden) ? o.reddeden : [];
        if (o.reddeden.indexOf(id) < 0) o.reddeden.push(id);
        return store.setOrphan(o);
      });
    },
    /** Profil sayfası için: reddedilmiş olsa da sahipsiz veri var mı? */
    anyOrphan: function () {
      return store.getOrphan().then(function (o) {
        return o && o.anahtarlar && Object.keys(o.anahtarlar).length ? { bulunma: o.bulunma, ozet: summarizeRaw(o.anahtarlar) } : null;
      });
    },

    /** ?donus= değerini yalnızca aynı klasördeki bir .html sayfasına izin verecek şekilde temizler. */
    safeReturn: function (v) {
      v = String(v || "");
      if (!/^[A-Za-z0-9._-]+\.html(?:[?#][^\s<>"']*)?$/.test(v)) return null;
      if (/^(giris|profil)\.html/i.test(v)) return null;
      return v;
    },
    sinifLabel: function (s) { return s === "mezun" ? "Mezun" : s === "lisans-mezun" ? "Üniversite mezunu" : (s ? s + ". sınıf" : ""); },
    ulkeAd: function (u) { return ULKE_ADLARI[u] || String(u || ""); }
  };

  /** Oturum var ama cihazın aktif verisi başkasına aitse takası tamamlar. Dönüş: current() */
  api.resume = function () {
    return store.getSession().then(function (s) {
      if (!s || !s.id) return null;
      return store.getUser(s.id).then(function (u) {
        if (!u) return store.clearSession().then(function () { return null; });
        return store.getActive().then(function (a) {
          return (a === s.id ? Promise.resolve() : activate(s.id)).then(function () { return api.current(); });
        });
      });
    });
  };

  // ------------------------------------------------------------------------
  // 5. FORM YARDIMCILARI (giris.html ve profil.html ortak kullanır)
  // ------------------------------------------------------------------------
  api.ui = {
    /** errors: {alan: mesaj}. Alan kimliği "<onek>-<alan>", hata kutusu "<onek>-<alan>-err". */
    showErrors: function (prefix, errors, fields) {
      var first = null;
      (fields || []).forEach(function (f) {
        var input = document.getElementById(prefix + "-" + f);
        var err = document.getElementById(prefix + "-" + f + "-err");
        var msg = errors && errors[f];
        if (err) err.textContent = msg || "";
        if (input) {
          if (msg) { input.setAttribute("aria-invalid", "true"); if (!first) first = input; }
          else input.removeAttribute("aria-invalid");
        }
      });
      return first;
    },
    alert: function (el, msg, kind) {
      if (!el) return;
      el.className = "form-alert" + (kind ? " is-" + kind : "");
      el.textContent = msg || "";
      el.hidden = !msg;
    },
    busy: function (btn, on, text) {
      if (!btn) return;
      if (on) {
        btn.dataset.label = btn.dataset.label || btn.innerHTML;
        btn.disabled = true; btn.setAttribute("aria-busy", "true");
        btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>' + (text || "Lütfen bekle…");
      } else {
        btn.disabled = false; btn.removeAttribute("aria-busy");
        if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
      }
    },
    /** .pw-toggle düğmelerini bağlar (aria-controls ile hedef alan). */
    wirePasswordToggles: function (root) {
      (root || document).querySelectorAll(".pw-toggle").forEach(function (b) {
        if (b.dataset.wired) return; b.dataset.wired = "1";
        b.addEventListener("click", function () {
          var input = document.getElementById(b.getAttribute("aria-controls"));
          if (!input) return;
          var show = input.type === "password";
          input.type = show ? "text" : "password";
          b.setAttribute("aria-pressed", String(show));
          b.setAttribute("aria-label", show ? "Şifreyi gizle" : "Şifreyi göster");
        });
      });
    },
    /** Metni dosya olarak indirir (kurtarma kodu için). */
    download: function (name, text) {
      var url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
      var a = document.createElement("a"); a.href = url; a.download = name; a.style.display = "none";
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
    },
    copy: function (text, fallbackEl) {
      function manual() {
        if (!fallbackEl) return false;
        var r = document.createRange(); r.selectNodeContents(fallbackEl);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        try { return document.execCommand("copy"); } catch (e) { return false; }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return manual(); });
      }
      return Promise.resolve(manual());
    },
    recoveryText: function (user, code) {
      return "AP MEBERRA — Hesap kurtarma kodu\r\n\r\nKullanıcı adı: " + user.kullaniciAdi + "\r\nKurtarma kodu: " + code +
        "\r\nOluşturma: " + new Date().toLocaleString("tr-TR") +
        "\r\n\r\nŞifreni unutursan giriş sayfasındaki \"Şifremi unuttum\" bağlantısıyla bu kodu kullanarak yeni şifre belirleyebilirsin.\r\nKod tek kullanımlıktır; kullandığında yenisi verilir. Bu dosyayı kimseyle paylaşma.\r\n";
    }
  };

  window.APMEBERRA_AUTH = api;
})();
