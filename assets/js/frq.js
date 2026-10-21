/**
 * Meberra 1.11.0 — FRQ (serbest yanıt) pratiği: /frq (frq.html). Sunucu uçları: server/frq.js (bkz. server/API.md "FRQ").
 * Akış: ders çipleri → FRQ kartları → çözüm (isteğe bağlı süre, parça başına metin kutusu, taslak localStorage'da) → "Teslim et"
 * → rubrik (ölçüt başına onay kutusu / puan seçimi, örnek çözüm, sık hatalar) → "Puanımı kaydet" → toplam (sayiSay) + Tilo.
 * Rubrik ve çözümler yalnızca teslimden sonra sunucudan gelir. Adres: /frq?ders=calculus · /frq?id=frq-calc-ab-1
 */
(function () {
  "use strict";
  var view = document.getElementById("frq-view");
  var canli = document.getElementById("frq-live");
  if (!view) return;

  var TASLAK_KEY = "meberra:frq-taslak:v1:";
  var CIPLER = [
    { k: "", ad: "Tümü" }, { k: "calculus", ad: "Calculus" }, { k: "physics", ad: "Physics 1" }, { k: "chemistry", ad: "Chemistry" },
    { k: "biology", ad: "Biology" }, { k: "english", ad: "English Lang." }, { k: "macro", ad: "Macro" }, { k: "micro", ad: "Micro" }, { k: "csa", ad: "CS A" }
  ];
  var RENK = { calculus: "--c-calculus", physics: "--c-physics", chemistry: "--c-chemistry", biology: "--c-biology", english: "--c-english", macro: "--c-electives", micro: "--c-electives", csa: "--c-electives" };
  var ZORLUK = { easy: "Kolay", medium: "Orta", hard: "Zor" };
  var S = { ders: "", liste: null, premium: false, haklar: {}, aktif: null, sure: null, zamanlayici: null };

  // ---------------- yardımcılar ----------------
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function param(ad) { try { return new URLSearchParams(location.search).get(ad); } catch (e) { return null; } }
  function adresYaz(o) {
    try {
      var u = new URL(location.href);
      ["ders", "id"].forEach(function (k) { if (o[k]) u.searchParams.set(k, o[k]); else u.searchParams.delete(k); });
      history.replaceState(null, "", u.pathname + u.search);
    } catch (e) { /* eski tarayıcı */ }
  }
  function duyur(m) { if (!canli) return; canli.textContent = ""; setTimeout(function () { canli.textContent = m; }, 40); }
  function api(yontem, yol, govde) {
    var o = { method: yontem, credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Meberra": "1" } };
    if (govde !== undefined) o.body = JSON.stringify(govde);
    return fetch(yol, o).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { durum: r.status, veri: j || {} }; }); },
      function () { return { durum: 0, veri: {} }; });
  }
  function hataMetni(r, v) {
    return r.durum === 0 ? "Bağlantın kopmuş görünüyor. İnternete bağlanınca yeniden dene." : r.durum === 401 ? "Oturumun sona erdi; yeniden giriş yap." : (r.veri && r.veri.error) || v;
  }
  function typeset(el) {
    var mj = window.MathJax;
    if (!el || !mj) return;
    var run = function () { if (mj.typesetPromise) mj.typesetPromise([el]).catch(function () {}); };
    if (mj.startup && mj.startup.promise) mj.startup.promise.then(run).catch(function () {}); else run();
  }
  function sget(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function sset(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* özel pencere */ } }
  function sureYaz(sn) { sn = Math.max(0, Math.round(sn || 0)); var m = Math.floor(sn / 60), s = sn % 60; return m + ":" + (s < 10 ? "0" : "") + s; }
  function tarih(iso) { var d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }); }
  function renk(kisa) { return "var(" + (RENK[kisa] || "--accent") + ")"; }
  function ust() { try { window.scrollTo({ top: 0, behavior: "instant" }); } catch (e) { window.scrollTo(0, 0); } }
  function premiumAdres() { var A = window.MEBERRA_ADRES; return A ? A.temiz("premium.html") : "/premium"; }
  function zamanlayiciDur() { if (S.zamanlayici) { clearInterval(S.zamanlayici); S.zamanlayici = null; } }
  function ikon(ad) {
    var I = {
      saat: '<path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="9"/>',
      kilit: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
      hesap: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M8 18h2M12 18h2"/>',
      tamam: '<path d="m5 12 5 5 9-10"/>',
      geri: '<path d="M15 18l-6-6 6-6"/>'
    };
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[ad] || "") + "</svg>";
  }
  function iskelet() {
    return '<p class="visually-hidden" role="status">Yükleniyor…</p><div class="frq-izgara" aria-hidden="true">' +
      [0, 1, 2, 3].map(function () { return '<div class="frq-kart frq-isk"><span></span><span></span><span class="kisa"></span></div>'; }).join("") + "</div>";
  }
  function hataKutusu(baslik, metin, tekrar) {
    view.innerHTML = '<div class="frq-durum is-hata" role="alert"><strong>' + esc(baslik) + "</strong><p>" + esc(metin) + '</p><div class="frq-dugmeler">' +
      '<button type="button" class="btn-primary btn-sm" id="frq-tekrar">Yeniden dene</button> <a class="btn-ghost btn-sm" href="/giris?donus=' + encodeURIComponent(location.pathname + location.search) + '">Giriş yap</a></div></div>';
    document.getElementById("frq-tekrar").addEventListener("click", tekrar);
  }

  // ---------------- 1) liste ----------------
  function listeYukle() {
    zamanlayiciDur();
    S.aktif = null;
    adresYaz({ ders: S.ders });
    view.innerHTML = basHtml() + iskelet();
    return api("GET", "/api/frq").then(function (r) {
      if (r.durum !== 200) return hataKutusu("FRQ'lar yüklenemedi", hataMetni(r, "Bir sorun oluştu."), listeYukle);
      S.liste = r.veri.frq || []; S.premium = !!r.veri.premium; S.haklar = r.veri.haklar || {};
      listeCiz();
      gecmisYukle();
    });
  }
  function basHtml() {
    return '<header class="frq-bas"><p class="frq-eyebrow">AP serbest yanıt</p><h1>FRQ pratiği</h1>' +
      '<p class="frq-alt">Serbest yanıt soruları çoğu AP sınavında puanın yaklaşık yarısıdır. Cevabını kâğıda ya da kutulara yaz, teslim et; sonra puanlama ölçütleriyle kendini puanla.</p></header>';
  }
  function listeCiz() {
    var l = S.liste.filter(function (f) { return !S.ders || f.kisa === S.ders; });
    var html = basHtml() +
      '<div class="frq-cipler chip-group" role="group" aria-label="Ders">' + CIPLER.map(function (c) {
        var n = S.liste.filter(function (f) { return !c.k || f.kisa === c.k; }).length;
        return '<button type="button" class="chip" data-ders="' + c.k + '" aria-pressed="' + (S.ders === c.k) + '">' + esc(c.ad) + ' <span class="frq-cip-sayi">' + n + "</span></button>";
      }).join("") + "</div>" +
      (S.premium ? "" : '<p class="frq-hak-not">' + ikon("kilit") + " Ücretsiz planda her dersten 1 FRQ çözebilirsin. <a href=\"" + premiumAdres() + '">Premium</a> ile hepsi açık.</p>') +
      (l.length ? '<ul class="frq-izgara" role="list">' + l.map(kartHtml).join("") + "</ul>" :
        '<div class="frq-durum"><strong>Bu derste henüz yayında FRQ yok.</strong><p>Yeni sorular onaylandıkça burada görünecek.</p></div>') +
      '<section class="frq-gecmis" aria-labelledby="frq-gecmis-h"><h2 id="frq-gecmis-h">Geçmiş denemelerin</h2><div id="frq-gecmis-liste" class="frq-gecmis-liste"><p class="frq-soluk">Yükleniyor…</p></div></section>';
    view.innerHTML = html;
  }
  function kartHtml(f) {
    var son = f.son, rozet = "";
    if (f.kilitli) rozet = '<span class="frq-rozet is-kilit">' + ikon("kilit") + " Premium</span>";
    else if (son && son.toplam != null) rozet = '<span class="frq-rozet is-tamam">' + ikon("tamam") + " " + son.toplam + "/" + son.toplam_puan + "</span>";
    else if (son) rozet = '<span class="frq-rozet">Puanlanmadı</span>';
    if (f.durum === "taslak") rozet += ' <span class="frq-rozet is-taslak">Taslak</span>';
    return '<li class="frq-kart' + (f.kilitli ? " is-kilitli" : "") + '" style="--frq-renk:' + renk(f.kisa) + '">' +
      '<button type="button" class="frq-kart-dugme" data-ac="' + esc(f.id) + '"' + (f.kilitli ? ' aria-describedby="frq-k-' + esc(f.id) + '"' : "") + ">" +
        '<span class="frq-kart-ust"><span class="frq-ders">' + esc(f.dersAd) + "</span>" + rozet + "</span>" +
        '<span class="frq-kart-baslik">' + esc(f.baslik) + "</span>" +
        '<span class="frq-kart-tur">' + esc(f.tur) + "</span>" +
        '<span class="frq-kart-meta"><span>' + ikon("saat") + " " + f.sure_dk + " dk</span><span>" + f.toplam_puan + " puan</span><span>" + f.parcaSayisi + " parça</span>" +
          (f.hesapMakinesi ? "<span>" + ikon("hesap") + " Hesap makinesi</span>" : "") + "</span>" +
        (f.kilitli ? '<span class="visually-hidden" id="frq-k-' + esc(f.id) + '">Premium gerekli</span>' : "") +
      "</button></li>";
  }
  function gecmisYukle() {
    api("GET", "/api/frq/gecmis?adet=20").then(function (r) {
      var k = document.getElementById("frq-gecmis-liste");
      if (!k) return;
      var l = (r.veri && r.veri.gecmis) || [];
      if (r.durum !== 200) { k.innerHTML = '<p class="frq-soluk">' + esc(hataMetni(r, "Geçmiş yüklenemedi.")) + "</p>"; return; }
      if (!l.length) { k.innerHTML = '<p class="frq-soluk">Henüz FRQ çözmedin. İlkini seç, 15 dakikanı ayır.</p>'; return; }
      k.innerHTML = '<ul role="list">' + l.map(function (g) {
        return '<li><button type="button" class="frq-gecmis-satir" data-deneme="' + g.id + '"><span class="frq-gecmis-ad">' + esc(g.baslik) + '</span><span class="frq-soluk">' + esc(tarih(g.tarih)) +
          (g.sure_sn ? " · " + sureYaz(g.sure_sn) : "") + '</span><span class="frq-gecmis-puan">' + (g.puanlandi ? g.toplam + "/" + g.toplam_puan + " · %" + g.yuzde : "Puanla") + "</span></button></li>";
      }).join("") + "</ul>";
    });
  }

  // ---------------- 2) çözüm ----------------
  function ac(id) {
    zamanlayiciDur();
    adresYaz({ ders: S.ders, id: id });
    view.innerHTML = '<div class="frq-coz-isk" aria-hidden="true"></div><p class="visually-hidden" role="status">FRQ yükleniyor…</p>';
    ust();
    api("GET", "/api/frq/" + encodeURIComponent(id)).then(function (r) {
      if (r.durum === 402) return duvar(r.veri);
      if (r.durum !== 200) return hataKutusu("FRQ açılamadı", hataMetni(r, "Bir sorun oluştu."), function () { ac(id); });
      S.aktif = { frq: r.veri.frq, bas: Date.now(), sureAcik: false };
      cozCiz();
    });
  }
  function duvar(v) {
    view.innerHTML = '<div class="frq-duvar"><div class="frq-duvar-maskot" id="frq-duvar-maskot"></div><h1>Bu FRQ Premium\'da</h1>' +
      "<p>" + esc((v && v.error) || "Ücretsiz planda her dersten 1 FRQ çözebilirsin.") + "</p>" +
      '<p class="frq-soluk">Çözdüğün FRQ\'yu istediğin kadar yeniden çözebilirsin. Premium ile tüm derslerdeki FRQ\'lar ve sınırsız deneme açılır.</p>' +
      '<div class="frq-dugmeler"><a class="btn-primary" href="' + premiumAdres() + '">Premium\'u incele</a> <button type="button" class="btn-ghost" data-geri>FRQ listesine dön</button></div></div>';
    var M = window.MeberraMaskot, m = document.getElementById("frq-duvar-maskot");
    if (M && m) m.innerHTML = M.html("dusunen", { boyut: 96 });
    duyur("Bu FRQ Premium'da.");
  }
  function cozCiz() {
    var f = S.aktif.frq, taslak = sget(TASLAK_KEY + f.id) || {};
    var c = taslak.cevaplar || {};
    view.innerHTML =
      '<div class="frq-coz">' +
      '<div class="frq-arac"><button type="button" class="btn-ghost btn-sm" data-geri>' + ikon("geri") + " FRQ'lar</button>" +
        '<div class="frq-sure" id="frq-sure"><button type="button" class="btn-ghost btn-sm" id="frq-sure-dugme" aria-pressed="false">' + ikon("saat") + ' Süre tut</button>' +
        '<span class="frq-sure-gosterge" id="frq-sure-g" aria-live="off" hidden>0:00 / ' + f.sure_dk + ':00</span></div></div>' +
      '<header class="frq-coz-bas" style="--frq-renk:' + renk(f.kisa) + '"><p class="frq-eyebrow">' + esc(f.dersAd) + " · " + esc(f.tur) + "</p><h1>" + esc(f.baslik) + "</h1>" +
        '<p class="frq-kart-meta"><span>' + ikon("saat") + " Önerilen " + f.sure_dk + " dk</span><span>" + f.toplam_puan + " puan</span><span>" +
        (f.hesapMakinesi ? ikon("hesap") + " Hesap makinesi serbest" : "Hesap makinesi yok") + "</span><span>" + esc(ZORLUK[f.zorluk] || f.zorluk) + "</span></p></header>" +
      '<div class="frq-giris icerik">' + f.giris + "</div>" +
      '<form id="frq-form" novalidate>' + f.parcalar.map(function (p) {
        return '<section class="frq-parca" aria-labelledby="frq-p-' + p.harf + '"><div class="frq-parca-bas"><h2 id="frq-p-' + p.harf + '">(' + p.harf + ")</h2><span class=\"frq-puan-et\">" + p.puan + " puan</span></div>" +
          '<div class="frq-soru icerik">' + p.soru + "</div>" +
          '<label class="visually-hidden" for="frq-c-' + p.harf + '">(' + p.harf + ") cevabın</label>" +
          '<textarea id="frq-c-' + p.harf + '" class="text-input frq-cevap" data-harf="' + p.harf + '" rows="5" spellcheck="false" placeholder="Cevabını buraya yaz (kâğıtta çözdüysen boş bırakabilirsin)">' + esc(c[p.harf] || "") + "</textarea></section>";
      }).join("") +
      '<div class="frq-teslim"><p class="frq-soluk" id="frq-taslak-durum" aria-live="polite">' + (taslak.zaman ? "Taslağın bu cihazda kayıtlı." : "Yazdıkların bu cihazda taslak olarak saklanır.") + "</p>" +
        '<button type="submit" class="btn-primary" id="frq-teslim-dugme">Teslim et</button></div>' +
      '<p class="field-error" id="frq-hata" role="alert"></p></form></div>';
    typeset(view);
    var form = document.getElementById("frq-form"), zaman = null;
    form.addEventListener("input", function () {
      clearTimeout(zaman);
      zaman = setTimeout(function () {
        sset(TASLAK_KEY + f.id, { cevaplar: cevaplariTopla(), zaman: new Date().toISOString() });
        var d = document.getElementById("frq-taslak-durum"); if (d) d.textContent = "Taslak kaydedildi.";
      }, 400);
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); teslim(); });
    document.getElementById("frq-sure-dugme").addEventListener("click", sureDegistir);
  }
  function cevaplariTopla() {
    var o = {};
    Array.prototype.forEach.call(view.querySelectorAll("textarea[data-harf]"), function (t) { o[t.getAttribute("data-harf")] = t.value; });
    return o;
  }
  function sureDegistir() {
    var b = document.getElementById("frq-sure-dugme"), g = document.getElementById("frq-sure-g"), f = S.aktif.frq;
    var acik = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(acik));
    g.hidden = !acik;
    zamanlayiciDur();
    if (!acik) { b.innerHTML = ikon("saat") + " Süre tut"; return; }
    b.innerHTML = ikon("saat") + " Süreyi gizle";
    S.aktif.sureAcik = true;
    var ciz = function () {
      var sn = (Date.now() - S.aktif.bas) / 1000;
      g.textContent = sureYaz(sn) + " / " + f.sure_dk + ":00";
      g.classList.toggle("is-asti", sn > f.sure_dk * 60);
    };
    ciz(); S.zamanlayici = setInterval(ciz, 1000);
  }
  function teslim() {
    var f = S.aktif.frq, c = cevaplariTopla(), bos = f.parcalar.filter(function (p) { return !String(c[p.harf] || "").trim(); }).length;
    var b = document.getElementById("frq-teslim-dugme"), h = document.getElementById("frq-hata");
    if (bos === f.parcalar.length && !window.confirm("Hiçbir kutuya yazmadın. Kâğıtta çözdüysen devam et; teslimden sonra puanlama ölçütleri açılır.")) return;
    b.disabled = true; b.textContent = "Teslim ediliyor…"; h.textContent = "";
    var sure = Math.round((Date.now() - S.aktif.bas) / 1000);
    api("POST", "/api/frq/" + encodeURIComponent(f.id) + "/teslim", { cevaplar: c, sure_sn: sure }).then(function (r) {
      if (r.durum === 402) return duvar(r.veri);
      if (r.durum !== 200) { b.disabled = false; b.textContent = "Teslim et"; h.textContent = hataMetni(r, "Teslim edilemedi. Taslağın duruyor; yeniden dene."); return; }
      zamanlayiciDur();
      sset(TASLAK_KEY + f.id, null);
      rubrikCiz({ denemeId: r.veri.denemeId, frq: r.veri.frq, cevaplar: r.veri.cevaplar, puanlar: null, sure_sn: sure });
      duyur("Teslim edildi. Şimdi puanlama ölçütleriyle kendini puanla.");
    });
  }

  // ---------------- 3) rubrik + öz puanlama ----------------
  function rubrikCiz(d) {
    S.aktif = { rubrik: d, frq: d.frq };
    var f = d.frq, p0 = d.puanlar || {};
    view.innerHTML =
      '<div class="frq-coz frq-rubrik">' +
      '<div class="frq-arac"><button type="button" class="btn-ghost btn-sm" data-geri>' + ikon("geri") + " FRQ'lar</button></div>" +
      '<header class="frq-coz-bas" style="--frq-renk:' + renk(f.kisa) + '"><p class="frq-eyebrow">' + esc(f.dersAd) + " · Öz puanlama</p><h1>" + esc(f.baslik) + "</h1>" +
        "<p class=\"frq-alt\">Her ölçütü cevabınla dürüstçe karşılaştır. AP okuyucuları ölçütte istenen ifade ya da gerekçe yoksa puan vermez.</p></header>" +
      '<div class="frq-skor" aria-live="polite"><div class="frq-skor-sayi"><span id="frq-toplam">0</span><span class="frq-skor-bolu">/ ' + f.toplam_puan + '</span></div>' +
        '<div class="frq-skor-bar" aria-hidden="true"><span id="frq-skor-dolgu"></span></div><p class="frq-soluk" id="frq-skor-not">Ölçütleri işaretledikçe toplam güncellenir.</p></div>' +
      '<details class="frq-giris-ac"><summary>Soru metnini göster</summary><div class="frq-giris icerik">' + f.giris + "</div></details>" +
      '<form id="frq-puan-form" novalidate>' + f.parcalar.map(function (p) {
        var cev = d.cevaplar && d.cevaplar[p.harf] ? String(d.cevaplar[p.harf]) : "";
        var pp = p0[p.harf] || [];
        return '<section class="frq-parca" aria-labelledby="frq-r-' + p.harf + '"><div class="frq-parca-bas"><h2 id="frq-r-' + p.harf + '">(' + p.harf + ")</h2><span class=\"frq-puan-et\"><span data-parca-top=\"" + p.harf + "\">0</span> / " + p.puan + " puan</span></div>" +
          '<div class="frq-soru icerik">' + p.soru + "</div>" +
          '<div class="frq-senin"><p class="frq-mini-baslik">Senin cevabın</p>' + (cev.trim() ? '<p class="frq-senin-metin">' + esc(cev) + "</p>" : '<p class="frq-soluk">Kutuya yazmadın — kâğıttaki cevabınla karşılaştır.</p>') + "</div>" +
          '<fieldset class="frq-olcutler"><legend class="frq-mini-baslik">Puanlama ölçütleri</legend>' + p.rubrik.map(function (rb, i) {
            var ad = "frq-o-" + p.harf + "-" + i, v = +pp[i] || 0;
            var giris = rb.puan === 1
              ? '<input type="checkbox" id="' + ad + '" data-harf="' + p.harf + '" data-i="' + i + '" value="1"' + (v ? " checked" : "") + ">"
              : '<span class="frq-seg" role="radiogroup" aria-label="Ölçüt ' + (i + 1) + ' puanı">' + Array.apply(null, { length: rb.puan + 1 }).map(function (_, n) {
                  return '<label><input type="radio" name="' + ad + '" data-harf="' + p.harf + '" data-i="' + i + '" value="' + n + '"' + (v === n ? " checked" : "") + "><span>" + n + "</span></label>";
                }).join("") + "</span>";
            return '<div class="frq-olcut">' + (rb.puan === 1 ? '<label class="frq-olcut-et" for="' + ad + '">' + giris : '<div class="frq-olcut-et">') +
              '<span class="frq-olcut-metin"><span class="frq-olcut-puan">' + rb.puan + " puan</span> " + rb.olcut +
              (rb.ornek_cevap ? '<span class="frq-ornek">Örnek: ' + rb.ornek_cevap + "</span>" : "") + "</span>" +
              (rb.puan === 1 ? "</label>" : giris + "</div>") + "</div>";
          }).join("") + "</fieldset>" +
          '<details class="frq-cozum"><summary>Örnek çözüm</summary><div class="icerik">' + p.ornek_cozum + "</div></details>" +
          (p.sik_hatalar && p.sik_hatalar.length ? '<div class="frq-hatalar"><p class="frq-mini-baslik">Sık hatalar</p><ul>' + p.sik_hatalar.map(function (h) { return "<li>" + h + "</li>"; }).join("") + "</ul></div>" : "") +
          "</section>";
      }).join("") +
      '<div class="frq-teslim"><div class="frq-tilo" id="frq-tilo" aria-live="polite"></div><button type="submit" class="btn-primary" id="frq-puan-dugme">' + (d.puanlar ? "Puanımı güncelle" : "Puanımı kaydet") + "</button></div>" +
      '<p class="field-error" id="frq-hata" role="alert"></p>' +
      '<p class="frq-katki frq-soluk" id="frq-katki"' + (d.katki ? "" : " hidden") + ">" + (d.katki ? esc(d.katki.metin) : "") + "</p></form>" +
      '<div class="frq-dugmeler frq-son"><button type="button" class="btn-ghost" data-ac="' + esc(f.id) + '">Bu FRQ\'yu yeniden çöz</button> <button type="button" class="btn-ghost" data-geri>Başka FRQ seç</button></div></div>';
    ust();
    typeset(view);
    var form = document.getElementById("frq-puan-form");
    form.addEventListener("change", function () { toplamGuncelle(false); });
    form.addEventListener("submit", function (e) { e.preventDefault(); puanKaydet(); });
    toplamGuncelle(true);
  }
  function puanlariTopla() {
    var f = S.aktif.frq, o = {};
    f.parcalar.forEach(function (p) {
      o[p.harf] = p.rubrik.map(function (rb, i) {
        if (rb.puan === 1) { var c = view.querySelector('input[type=checkbox][data-harf="' + p.harf + '"][data-i="' + i + '"]'); return c && c.checked ? 1 : 0; }
        var r = view.querySelector('input[type=radio][data-harf="' + p.harf + '"][data-i="' + i + '"]:checked'); return r ? +r.value : 0;
      });
    });
    return o;
  }
  function toplamGuncelle(ilk) {
    var f = S.aktif.frq, pu = puanlariTopla(), top = 0;
    f.parcalar.forEach(function (p) {
      var t = pu[p.harf].reduce(function (a, b) { return a + b; }, 0); top += t;
      var el = view.querySelector('[data-parca-top="' + p.harf + '"]'); if (el) el.textContent = t;
    });
    var el = document.getElementById("frq-toplam"), K = window.MeberraKutlama;
    if (K && K.sayiSay && !ilk) K.sayiSay(el, top, { sure: 500 }); else el.textContent = top;
    var d = document.getElementById("frq-skor-dolgu"); if (d) d.style.transform = "scaleX(" + (top / Math.max(1, f.toplam_puan)) + ")";
    return top;
  }
  function puanKaydet() {
    var R = S.aktif.rubrik, f = R.frq, b = document.getElementById("frq-puan-dugme"), h = document.getElementById("frq-hata");
    b.disabled = true; h.textContent = "";
    api("POST", "/api/frq/" + encodeURIComponent(f.id) + "/puanla", { denemeId: R.denemeId, puanlar: puanlariTopla() }).then(function (r) {
      b.disabled = false;
      if (r.durum !== 200) { h.textContent = hataMetni(r, "Puan kaydedilemedi."); return; }
      b.textContent = "Puanımı güncelle";
      R.puanlar = r.veri.puanlar;
      var v = r.veri, el = document.getElementById("frq-toplam"), K = window.MeberraKutlama;
      el.textContent = "0";
      if (K && K.sayiSay) K.sayiSay(el, v.toplam, { sure: 900 }); else el.textContent = v.toplam;
      var not = document.getElementById("frq-skor-not");
      if (not) not.textContent = "Kaydedildi: " + v.toplam + " / " + v.toplam_puan + " (%" + v.yuzde + ").";
      var k = document.getElementById("frq-katki"); if (k && v.katki) { k.textContent = v.katki.metin; k.hidden = false; }
      tiloTepki(v);
      duyur("Puanın kaydedildi: " + v.toplam + " / " + v.toplam_puan + ".");
    });
  }
  function tiloTepki(v) {
    var K = window.MeberraKutlama, M = window.MeberraMaskot, kap = document.getElementById("frq-tilo"), f = S.aktif.frq;
    if (kap) kap.innerHTML = "";
    if (v.yuzde >= 70) {
      if (K && K.kutla) K.kutla({ tur: "deneme", buyuk: true, ifade: "kutlama", baslik: "Harika FRQ! %" + v.yuzde, metin: f.baslik + ": " + v.toplam + " / " + v.toplam_puan + " puan. Bu tempo 5'e götürür.",
        paylas: { baslik: "FRQ: " + v.toplam + "/" + v.toplam_puan, alt: f.dersAd, yuzde: v.yuzde, ders: f.dersAd } });
      else if (M && kap) M.konus(kap, { ifade: "kutlama", mesaj: "Harika! %" + v.yuzde + " — bu tempo 5'e götürür." });
    } else if (M && kap) {
      var m = v.yuzde >= 40 ? "İyi temel! Kaçan ölçütlerin örnek çözümüne bak, yarın tekrar dene." : "Her FRQ bir antrenman. Sık hatalara göz at; ikinci denemede fark göreceksin.";
      M.konus(kap, { ifade: v.yuzde >= 40 ? "sevincli" : "dusunen", mesaj: m });
    }
  }
  function denemeAc(id) {
    view.innerHTML = '<div class="frq-coz-isk" aria-hidden="true"></div><p class="visually-hidden" role="status">Deneme yükleniyor…</p>';
    api("GET", "/api/frq/deneme/" + encodeURIComponent(id)).then(function (r) {
      if (r.durum !== 200) return hataKutusu("Deneme açılamadı", hataMetni(r, "Bir sorun oluştu."), function () { denemeAc(id); });
      var d = r.veri.deneme;
      rubrikCiz({ denemeId: d.id, frq: r.veri.frq, cevaplar: d.cevaplar, puanlar: d.puanlar, sure_sn: d.sure_sn, katki: r.veri.katki });
    });
  }

  // ---------------- olaylar ----------------
  view.addEventListener("click", function (e) {
    var c = e.target.closest("[data-ders]");
    if (c && S.liste) { S.ders = c.getAttribute("data-ders"); adresYaz({ ders: S.ders }); listeCiz(); gecmisYukle(); return; }
    var a = e.target.closest("[data-ac]");
    if (a) { ac(a.getAttribute("data-ac")); return; }
    var g = e.target.closest("[data-deneme]");
    if (g) { denemeAc(g.getAttribute("data-deneme")); return; }
    if (e.target.closest("[data-geri]")) { listeYukle(); ust(); }
  });

  // ---------------- başlangıç ----------------
  var d = String(param("ders") || "").toLowerCase();
  S.ders = CIPLER.some(function (c) { return c.k === d; }) ? d : "";
  var ilkId = param("id");
  if (ilkId) ac(ilkId); else listeYukle();
})();
