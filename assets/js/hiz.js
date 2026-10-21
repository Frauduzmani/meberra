/**
 * Meberra 1.17.0 — Hız turu (/hiz-turu). 60 saniye; kuyruk, süre ve puan SUNUCUDA (server/hiz.js).
 * Ekran düzeni: tek odak noktası soru; süre halkası ve kombo alevi kenarda. Kısayollar: 1–4 / A–D şık, P pas, Enter başla.
 * Bağımlılıklar (isteğe bağlı): MeberraKutlama (sayiSay, kutla, paylas), MeberraMaskot, MeberraOdak, apSekilHtml (app.js), MathJax.
 */
(function () {
  "use strict";
  var view = document.getElementById("hz-view"), canli = document.getElementById("hz-live");
  if (!view) return;
  var S = { ders: null, veri: null, tur: null, kilit: false, bitti: false, raf: 0, farkMs: 0, dersSecimi: null };
  var HARF = ["A", "B", "C", "D", "E"];
  var HALKA_R = 26, HALKA_C = 2 * Math.PI * HALKA_R;

  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function duyur(m) { if (!canli) return; canli.textContent = ""; setTimeout(function () { canli.textContent = m; }, 30); }
  function api(yontem, yol, govde) {
    var o = { method: yontem, credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Meberra": "1" } };
    if (govde !== undefined) o.body = JSON.stringify(govde);
    return fetch(yol, o).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { durum: r.status, veri: j || {} }; }); },
      function () { return { durum: 0, veri: {} }; });
  }
  function azHareket() { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function maskot(ifade, boyut) { var M = window.MeberraMaskot; return M && M.html ? M.html(ifade, { boyut: boyut || 96, etiket: false }) : ""; }
  function typeset(el) {
    var mj = window.MathJax;
    if (!mj || !el || !/[$\\]/.test(el.textContent)) return;
    var run = function () { if (mj.typesetPromise) mj.typesetPromise([el]).catch(function () {}); };
    if (mj.startup && mj.startup.promise) mj.startup.promise.then(run).catch(function () {}); else run();
  }
  // Şekiller (soru: sekiller [], şık: sekil {}): app.js yer tutucusu (oran viewBox'tan → kayma yok); app.js yoksa doğrudan MeberraSekil.ciz
  function sekil(v, sik) {
    if (!v) return "";
    if (typeof window.apSekilHtml === "function") return window.apSekilHtml(v, sik);
    var S = window.MeberraSekil;
    if (!S || typeof S.ciz !== "function") return "";
    return (Array.isArray(v) ? v : [v]).map(function (x) { try { return S.ciz(x, { secenek: !!sik }).outerHTML; } catch (e) { return ""; } }).join("");
  }
  function sekilDoldur(el) { var S = window.MeberraSekil; if (S && typeof S.doldur === "function") try { S.doldur(el); } catch (e) { /* şekil çizilemedi: metin yeter */ } }
  function pop(el, sinif) { if (!el || azHareket()) return; el.classList.remove(sinif); void el.offsetWidth; el.classList.add(sinif); el.addEventListener("animationend", function () { el.classList.remove(sinif); }, { once: true }); }
  function hata(r, v) { return r.durum === 0 ? "Bağlantın kopmuş görünüyor. İnternete bağlanınca yeniden dene." : (r.veri && r.veri.error) || v; }
  function sayiTR(n) { try { return Number(n).toLocaleString("tr-TR"); } catch (e) { return String(n); } }

  // ---- 1. Ders seçimi ------------------------------------------------------------------------------
  function secimCiz() {
    durdurDongu();
    S.tur = null; S.bitti = false;
    view.innerHTML = '<p class="hz-yukleniyor" role="status">Yükleniyor…</p>';
    api("GET", "/api/hiz/rekorlar").then(function (r) {
      if (r.durum === 401) {
        view.innerHTML = '<section class="hz-giris surface"><span class="hz-giris__maskot" aria-hidden="true">' + maskot("selam", 96) + '</span><h1>Hız turu</h1>' +
          '<p>60 saniyede kaç soru çözebilirsin? Oynamak için giriş yap.</p><a class="btn-primary" href="/giris?donus=' + encodeURIComponent(location.pathname) + '">Giriş yap</a></section>';
        return;
      }
      if (r.durum !== 200) { view.innerHTML = '<p class="hz-hata" role="alert">' + esc(hata(r, "Hız turu yüklenemedi.")) + '</p>'; return; }
      S.veri = r.veri;
      var v = r.veri, rek = v.rekorlar || {};
      var kayitli = null; try { kayitli = localStorage.getItem("meberra:hiz:ders"); } catch (e) { /* */ }
      if (!S.ders) S.ders = kayitli && (v.dersler || []).some(function (d) { return d.ders === kayitli; }) ? kayitli : "karisik";
      var dersler = (v.dersler || []).map(function (d) {
        var alt = d.ders === "karisik" ? (v.apDersleri && v.apDersleri.length ? v.apDersleri.slice(0, 3).join(", ") + (v.apDersleri.length > 3 ? "…" : "") : "Tüm dersler") : "";
        var rk = rek[d.ders];
        return '<button type="button" class="hz-ders" data-ders="' + esc(d.ders) + '" aria-pressed="' + (d.ders === S.ders) + '"><b>' + esc(d.ad) + '</b>' +
          (alt ? '<span>' + esc(alt) + '</span>' : '') + '<small>' + (rk ? "Rekor " + sayiTR(rk.puan) : "Henüz tur yok") + '</small></button>';
      }).join("");
      var son = (v.son || []).slice(0, 5).map(function (t) {
        return '<li><span>' + esc(t.dersAd) + '</span><b class="h-sayac">' + sayiTR(t.puan) + '</b><small>' + t.dogru + ' doğru · en uzun kombo ' + t.enKombo + '</small></li>';
      }).join("");
      view.innerHTML =
        '<section class="hz-secim">' +
          '<header class="hz-secim__ust"><span class="hz-secim__maskot" aria-hidden="true">' + maskot("sevincli", 88) + '</span>' +
            '<div><h1>Hız turu</h1><p>60 saniye. Kolay ve orta sorular, hesap makinesi yok. Üst üste 3 doğrudan sonra puan ×2, 6 doğrudan sonra ×3.</p></div></header>' +
          '<div class="hz-dersler" role="group" aria-label="Ders seç">' + dersler + '</div>' +
          (v.premium ? '' : '<p class="hz-not">Ücretsiz planda her dersin açık ünitelerinden sorular gelir.</p>') +
          '<div class="hz-eylem"><button type="button" class="btn-energy hz-basla" id="hz-basla">Başla <kbd>Enter</kbd></button>' +
            '<button type="button" class="btn-ghost" data-odak-ac>Odak sayacı</button></div>' +
          (son ? '<section class="hz-son" aria-labelledby="hz-son-h"><h2 id="hz-son-h">Son turların</h2><ol>' + son + '</ol></section>' : '') +
        '</section>';
      view.querySelectorAll(".hz-ders").forEach(function (b) {
        b.addEventListener("click", function () {
          S.ders = b.getAttribute("data-ders");
          try { localStorage.setItem("meberra:hiz:ders", S.ders); } catch (e) { /* */ }
          view.querySelectorAll(".hz-ders").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        });
      });
      document.getElementById("hz-basla").addEventListener("click", basla);
    });
  }

  // ---- 2. Tur ------------------------------------------------------------------------------------------
  function basla() {
    var b = document.getElementById("hz-basla");
    if (b) { b.disabled = true; b.textContent = "Hazırlanıyor…"; }
    api("POST", "/api/hiz/basla", { ders: S.ders || "karisik" }).then(function (r) {
      if (r.durum !== 200) {
        if (b) { b.disabled = false; b.textContent = "Başla"; }
        var p = view.querySelector(".hz-hata") || document.createElement("p");
        p.className = "hz-hata"; p.setAttribute("role", "alert"); p.textContent = hata(r, "Tur başlatılamadı.");
        view.querySelector(".hz-eylem") && view.querySelector(".hz-eylem").after(p);
        return;
      }
      var v = r.veri;
      S.tur = { oturum: v.oturum, ders: v.ders, dersAd: v.dersAd, sureMs: v.sureMs, yerelBitis: Date.now() + (v.bitis - v.sunucuZamani), puan: 0, kombo: 0, soru: v.soru };
      S.kilit = false; S.bitti = false;
      oyunCiz();
      soruCiz(v.soru);
      dongu();
      duyur("Tur başladı. 60 saniye.");
    });
  }
  function oyunCiz() {
    view.innerHTML =
      '<section class="hz-oyun" aria-label="Hız turu">' +
        '<div class="hz-cevre">' +
          '<div class="hz-halka" role="timer" aria-label="Kalan süre"><svg viewBox="0 0 64 64" aria-hidden="true"><circle class="hz-halka__iz" cx="32" cy="32" r="' + HALKA_R + '"/>' +
            '<circle class="hz-halka__dolu" id="hz-halka" cx="32" cy="32" r="' + HALKA_R + '" stroke-dasharray="' + HALKA_C.toFixed(2) + '" stroke-dashoffset="0"/></svg><span id="hz-sn">60</span></div>' +
          '<div class="hz-puan"><small>Puan</small><b class="h-sayac" id="hz-puan">0</b></div>' +
          '<div class="hz-kombo" id="hz-kombo" data-kademe="0" aria-live="off"><span class="hz-alev" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5z"/></svg></span>' +
            '<span class="hz-kombo__metin"><b id="hz-kombo-n">0</b><small id="hz-carpan">×1</small></span></div>' +
        '</div>' +
        '<article class="hz-soru surface" id="hz-soru" aria-live="polite"></article>' +
        '<div class="hz-alt"><button type="button" class="btn-ghost btn-sm" id="hz-pas">Pas geç <kbd>P</kbd></button><span class="hz-ipucu">Kısayol: 1–4 ya da A–D</span></div>' +
      '</section>';
    document.getElementById("hz-pas").addEventListener("click", function () { cevapla(null, true); });
  }
  function soruCiz(q) {
    var el = document.getElementById("hz-soru");
    if (!el || !q) return;
    S.tur.soru = q;
    var secenekler = (q.options || []).map(function (o, i) {
      return '<li><button type="button" class="hz-sik" data-sik="' + esc(o.id) + '"><span class="hz-sik__harf" aria-hidden="true">' + esc(o.id) + '</span>' +
        '<span class="hz-sik__metin">' + (o.text || "") + sekil(o.sekil, true) + '</span><span class="visually-hidden"> (kısayol ' + (i + 1) + ')</span></button></li>';
    }).join("");
    el.innerHTML = '<p class="hz-soru__ust">' + esc(q.ders || "") + (q.topic ? " · " + esc(q.topic) : "") + '</p>' +
      '<div class="hz-soru__govde">' + (q.question || "") + sekil(q.sekiller) + '</div><ol class="hz-siklar">' + secenekler + '</ol>';
    el.classList.remove("is-gir"); void el.offsetWidth; el.classList.add("is-gir");
    el.querySelectorAll(".hz-sik").forEach(function (b) { b.addEventListener("click", function () { cevapla(b.getAttribute("data-sik"), false); }); });
    sekilDoldur(el);
    typeset(el);
    S.kilit = false;
  }
  function komboCiz(k, carpan) {
    var el = document.getElementById("hz-kombo"); if (!el) return;
    var kademe = k >= 9 ? 3 : k >= 6 ? 2 : k >= 3 ? 1 : 0, eski = el.getAttribute("data-kademe");
    el.setAttribute("data-kademe", String(kademe));
    document.getElementById("hz-kombo-n").textContent = k;
    document.getElementById("hz-carpan").textContent = "×" + (carpan || 1);
    if (String(kademe) !== eski && kademe > 0) { pop(el, "h-zipla"); duyur("Kombo " + k + ". Puan ×" + carpan); }
  }
  function cevapla(secim, pas) {
    if (!S.tur || S.kilit || S.bitti) return;
    S.kilit = true;
    var q = S.tur.soru, el = document.getElementById("hz-soru");
    var btn = secim && el ? el.querySelector('.hz-sik[data-sik="' + secim + '"]') : null;
    if (btn) btn.classList.add("is-secili");
    api("POST", "/api/hiz/cevap", pas ? { oturum: S.tur.oturum, soruId: q.id, pas: true } : { oturum: S.tur.oturum, soruId: q.id, secim: secim }).then(function (r) {
      if (r.durum === 409 && r.veri.bitti) return bitir(r.veri.sonuc);
      if (r.durum !== 200) { S.kilit = false; if (btn) btn.classList.remove("is-secili"); duyur(hata(r, "Cevap gönderilemedi.")); return; }
      var v = r.veri;
      if (el) {
        el.querySelectorAll(".hz-sik").forEach(function (b) { b.disabled = true; var s = b.getAttribute("data-sik"); if (s === v.dogruSecenek) b.classList.add("is-dogru"); });
        if (btn && !v.dogru) { btn.classList.add("is-yanlis"); pop(btn, "h-salla"); }
        if (btn && v.dogru) pop(btn, "h-zipla");
      }
      var pEl = document.getElementById("hz-puan");
      if (pEl && v.puan !== S.tur.puan) {
        var K = window.MeberraKutlama;
        if (K && K.sayiSay) K.sayiSay(pEl, v.puan, { sure: 260 }); else pEl.textContent = sayiTR(v.puan);
        if (v.kazanilan) ucanPuan(btn || pEl, v.kazanilan);
      }
      S.tur.puan = v.puan; S.tur.kombo = v.kombo;
      komboCiz(v.kombo, v.kombo >= 6 ? 3 : v.kombo >= 3 ? 2 : 1);
      if (!pas) duyur(v.dogru ? "Doğru. +" + v.kazanilan : "Yanlış. Doğru şık " + v.dogruSecenek);
      if (v.bitti) { setTimeout(function () { bitir(v.sonuc); }, 350); return; }
      setTimeout(function () { if (!S.bitti) soruCiz(v.sonraki); }, v.dogru ? 260 : 650);
    });
  }
  function ucanPuan(kaynak, n) {
    if (azHareket() || !kaynak) return;
    var r = kaynak.getBoundingClientRect(), s = document.createElement("span");
    s.className = "hz-ucan"; s.textContent = "+" + n; s.style.left = (r.left + r.width / 2) + "px"; s.style.top = (r.top + 4) + "px";
    document.body.appendChild(s);
    setTimeout(function () { s.remove(); }, 700);
  }
  function dongu() {
    durdurDongu();
    var halka = document.getElementById("hz-halka"), sn = document.getElementById("hz-sn"), sonSn = -1, az = azHareket();
    var adim = function () {
      if (!S.tur || S.bitti) return;
      var kalan = Math.max(0, S.tur.yerelBitis - Date.now()), oran = kalan / S.tur.sureMs, s = Math.ceil(kalan / 1000);
      if (halka && (!az || s !== sonSn)) halka.setAttribute("stroke-dashoffset", (HALKA_C * (1 - oran)).toFixed(2));
      if (s !== sonSn) {
        sonSn = s; if (sn) sn.textContent = s;
        var hk = halka && halka.closest(".hz-halka"); if (hk) hk.classList.toggle("is-son", s <= 10);
        if (s === 10) duyur("Son 10 saniye");
      }
      if (kalan <= 0) { zamanDoldu(); return; }
      S.raf = requestAnimationFrame(adim);
    };
    S.raf = requestAnimationFrame(adim);
  }
  function durdurDongu() { if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; }
  function zamanDoldu() {
    if (!S.tur || S.bitti) return;
    S.kilit = true;
    // Uçuştaki cevabın sonucu gelsin diye kısa bir bekleme; sonra sunucudan sonuç
    setTimeout(function () {
      if (S.bitti || !S.tur) return;
      api("POST", "/api/hiz/bitir", { oturum: S.tur.oturum }).then(function (r) { bitir(r.durum === 200 ? r.veri.sonuc : { puan: S.tur.puan, dogru: 0, yanlis: 0, enKombo: 0, dersAd: S.tur.dersAd }); });
    }, 400);
  }

  // ---- 3. Sonuç --------------------------------------------------------------------------------------
  function bitir(s) {
    if (S.bitti) return;
    S.bitti = true; durdurDongu();
    s = s || {};
    var rekorMetin = s.yeniRekor ? (s.oncekiRekor != null ? "Yeni rekor! Önceki: " + sayiTR(s.oncekiRekor) : "İlk rekorun!") : (s.oncekiRekor != null ? "Rekorun: " + sayiTR(s.oncekiRekor) : "");
    view.innerHTML =
      '<section class="hz-sonuc surface" aria-labelledby="hz-sonuc-h">' +
        '<span class="hz-sonuc__maskot" aria-hidden="true">' + maskot(s.yeniRekor ? "kutlama" : (s.puan > 0 ? "sevincli" : "uzgun"), 110) + '</span>' +
        '<h1 id="hz-sonuc-h">Süre doldu</h1>' +
        '<p class="hz-sonuc__puan"><b class="h-sayac" id="hz-son-puan">0</b><span>puan</span></p>' +
        (rekorMetin ? '<p class="hz-sonuc__rekor' + (s.yeniRekor ? " is-yeni" : "") + '">' + esc(rekorMetin) + '</p>' : '') +
        '<dl class="hz-sonuc__ozet"><div><dt>Doğru</dt><dd>' + (s.dogru || 0) + '</dd></div><div><dt>Yanlış</dt><dd>' + (s.yanlis || 0) + '</dd></div><div><dt>En uzun kombo</dt><dd>' + (s.enKombo || 0) + '</dd></div></dl>' +
        '<div class="hz-eylem"><button type="button" class="btn-energy" id="hz-tekrar">Bir daha <kbd>Enter</kbd></button>' +
          '<button type="button" class="btn-ghost" id="hz-paylas">Paylaş</button><button type="button" class="btn-ghost" id="hz-ders">Ders değiştir</button></div>' +
      '</section>';
    var K = window.MeberraKutlama, pEl = document.getElementById("hz-son-puan");
    if (K && K.sayiSay) K.sayiSay(pEl, s.puan || 0, { sure: 700 }); else pEl.textContent = sayiTR(s.puan || 0);
    var paylas = { baslik: (s.dersAd || "Hız") + " hız turunda " + sayiTR(s.puan || 0) + " puan!", alt: (s.dogru || 0) + " doğru · en uzun kombo " + (s.enKombo || 0), ders: s.dersAd || "" };
    document.getElementById("hz-tekrar").addEventListener("click", basla);
    document.getElementById("hz-ders").addEventListener("click", secimCiz);
    document.getElementById("hz-paylas").addEventListener("click", function () { if (K && K.paylas) K.paylas(paylas); });
    document.getElementById("hz-tekrar").focus();
    duyur("Süre doldu. " + (s.puan || 0) + " puan. " + rekorMetin);
    if (s.yeniRekor && K && K.kutla) K.kutla({ tur: "deneme", buyuk: true, ifade: "kutlama", baslik: "Yeni rekor: " + sayiTR(s.puan) + " puan!", metin: (s.dersAd || "") + " hız turunda kendini geçtin.", paylas: paylas });
  }

  // ---- klavye ----------------------------------------------------------------------------------------
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('[aria-modal="true"]')) return;
    var t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (S.tur && !S.bitti) {
      var k = e.key.toUpperCase(), i = /^[1-5]$/.test(k) ? +k - 1 : HARF.indexOf(k);
      if (k === "P") { e.preventDefault(); cevapla(null, true); return; }
      if (i >= 0) { var b = document.querySelectorAll(".hz-sik")[i]; if (b && !b.disabled) { e.preventDefault(); cevapla(b.getAttribute("data-sik"), false); } }
      return;
    }
    if (e.key === "Enter" && (!t || t === document.body)) {
      var bb = document.getElementById("hz-tekrar") || document.getElementById("hz-basla");
      if (bb && !bb.disabled) { e.preventDefault(); bb.click(); }
    }
  });

  // maskot.js / kutlama.js defer ile yüklenir: DOMContentLoaded'dan önce hazırdırlar
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", secimCiz); else secimCiz();
})();
