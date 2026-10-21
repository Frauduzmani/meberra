/**
 * Meberra 1.12.0 — Tam deneme sınavı (Bluebook benzeri). Sayfa: /deneme?tam=1 (liste) · /deneme?tam=<sınav kodu> (tanıtım) ·
 * /deneme?tam=ts-… (süren sınav ya da sonuç). deneme.js "tam" parametresini görünce bu modüle devreder (window.MeberraTamSinav).
 * Sunucu: server/tamsinav.js (API.md "Tam deneme sınavı"). Süre sunucudadır: istemci yalnız sunucunun verdiği bitiş anına göre
 * geri sayar (sunucu saati farkı düzeltilir); süre dolunca bölüm otomatik teslim edilir, geç cevabı sunucu zaten reddeder.
 * Doğru cevaplar ve çözümler yalnız sınav bitince gelir; FRQ rubriği Bölüm II teslim edilince (öz puanlama: POST /api/frq/:id/puanla).
 * Grafikler (sonuç): tek seri, düz SVG; ilk renk --accent, uzun süre --warn + ikon/etiket; her grafikte tablo görünümü (details).
 */
(function () {
  "use strict";

  var view = null, canli = null;
  var S = { kat: null, r: null, ofset: 0, mevcut: 0, sure: {}, soruGiris: 0, zam: null, uyarildi: false, teslimde: false, eleme: false, frqZaman: null, kaydet: {} };
  var KEY = "apmeberra:deneme:v1", ERR_KEY = "apmeberra:errors:v1", TEKRAR_KEY = "apmeberra:tekrar:v1";
  var ARA_KEY = "meberra:tam-ara:";

  // ---------------- yardımcılar ----------------
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]; }); }
  // v1.13.0 şekiller: app.js apSekilHtml yer tutucusu → sekil.js çizer
  function skHtml(v, sik) { return typeof window.apSekilHtml === "function" ? window.apSekilHtml(v, sik) : ""; }
  function skSecenekli(l) { return typeof window.apSekilSecenekli === "function" && window.apSekilSecenekli(l); }
  function skSiklar(l) { return typeof window.apSekilSiklarDugme === "function" ? window.apSekilSiklarDugme(l) : ""; }
  function duyur(m) { if (!canli) return; canli.textContent = ""; setTimeout(function () { canli.textContent = m; }, 30); }
  function api(yontem, yol, govde) {
    var o = { method: yontem, credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Meberra": "1" } };
    if (govde !== undefined) o.body = JSON.stringify(govde);
    return fetch(yol, o).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { durum: r.status, veri: j || {} }; }); },
      function () { return { durum: 0, veri: {} }; });
  }
  function hataMetni(r, v) { return r.durum === 0 ? "Bağlantın kopmuş görünüyor. İnternete bağlanınca yeniden dene." : r.durum === 401 ? "Oturumun sona erdi; yeniden giriş yap." : (r.veri && r.veri.error) || v; }
  function typeset(el) {
    var mj = window.MathJax; if (!el || !mj) return;
    var run = function () { if (mj.typesetPromise) mj.typesetPromise([el]).catch(function () {}); };
    if (mj.startup && mj.startup.promise) mj.startup.promise.then(run).catch(function () {}); else run();
  }
  function sget(k, fb) { if (typeof window.apStoreGet === "function") return window.apStoreGet(k, fb); try { var r = localStorage.getItem(k); return r == null ? fb : JSON.parse(r); } catch (e) { return fb; } }
  function sset(k, v) { if (typeof window.apStoreSet === "function") return window.apStoreSet(k, v); try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { /* özel pencere */ } }
  function fmtSure(sn) {
    sn = Math.max(0, Math.round(sn));
    var h = Math.floor(sn / 3600), m = Math.floor((sn % 3600) / 60), s = sn % 60;
    return (h ? h + ":" + String(m).padStart(2, "0") : String(m)) + ":" + String(s).padStart(2, "0");
  }
  function fmtDk(sn) { var m = Math.round(sn / 60); return m >= 60 ? Math.floor(m / 60) + " sa" + (m % 60 ? " " + (m % 60) + " dk" : "") : m + " dk"; }
  function fmtTarih(iso) { var d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }); }
  function yuzde(x) { return "%" + (Math.round(x * 10) / 10).toLocaleString("tr-TR"); }
  function ust() { try { window.scrollTo({ top: 0, behavior: "instant" }); } catch (e) { window.scrollTo(0, 0); } }
  function adres(q) { try { history.replaceState(null, "", "/deneme?tam=" + encodeURIComponent(q)); } catch (e) { /* yok say */ } }
  function premiumAdres() { var A = window.MEBERRA_ADRES; return A ? A.temiz("premium.html") : "/premium"; }
  function sayfaAdres(s) { var A = window.MEBERRA_ADRES; return A ? A.temiz(s) : s; }
  function iskelet(m) { view.innerHTML = '<p class="dn-loading" role="status">' + esc(m || "Yükleniyor…") + "</p>"; }
  function hataKutusu(baslik, metin, tekrar) {
    view.innerHTML = '<div class="sb-durum is-hata" role="alert"><strong>' + esc(baslik) + "</strong><p>" + esc(metin) + '</p><button type="button" class="btn-primary btn-sm" id="ts-tekrar">Yeniden dene</button> <a class="btn-ghost btn-sm" href="/deneme?tam=1">Tam sınavlar</a></div>';
    document.getElementById("ts-tekrar").addEventListener("click", tekrar);
  }
  function odak(ac) { document.body.classList.toggle("dn-exam-mode", !!ac); document.body.classList.toggle("ts-mod", !!ac); }
  var HM_AD = { yasak: "Hesap makinesi yok", gerekli: "Grafik hesap makinesi gerekli", serbest: "Hesap makinesi serbest", yok: "Hesap makinesi yok" };
  var IK = {
    kilit: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    uyari: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 21h20L12 3z"/><path d="M12 10v5M12 18h.01"/></svg>',
    bayrak: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>',
    belge: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',
    hm: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h8"/></svg>',
    ele: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 12h16"/><path d="M7 7h2M7 17h2M15 7h2M15 17h2"/></svg>'
  };

  // ======================================================================
  // 1) LİSTE
  // ======================================================================
  function liste() {
    odak(false); iskelet("Tam sınavlar yükleniyor…");
    document.title = "Tam deneme sınavı | Meberra";
    api("GET", "/api/tam-sinav/katalog").then(function (r) {
      if (r.durum !== 200) return hataKutusu("Tam sınavlar yüklenemedi", hataMetni(r, "Sunucu şu an yanıt vermiyor."), liste);
      S.kat = r.veri; listeCiz();
    });
  }
  function bolumOzet(s) {
    return '<ol class="ts-bolum-liste">' + s.bolumler.map(function (b) {
      return "<li><strong>" + esc(b.ad) + "</strong><span>" + b.soru + (b.tur === "mcq" ? " çoktan seçmeli" : " serbest yanıt") + " · " + b.dk + " dk" +
        (b.okumaDk ? " (" + b.okumaDk + " dk okuma dahil)" : "") + " · " + esc(HM_AD[b.hesapMakinesi] || "") + "</span></li>";
    }).join("") + "</ol>";
  }
  function listeCiz() {
    var K = S.kat, prem = K.premium;
    var kartlar = K.sinavlar.map(function (s) {
      var frqNot = s.frqDurumu === "tam" || !s.hazir ? "" : s.frqDurumu === "kisaltilmis"
        ? '<p class="dn-note">Bölüm II kısaltılmış: ' + s.frqVar + " / " + s.frqHedef + " FRQ hazır; süre orantılı kısalır.</p>"
        : '<p class="dn-note">Henüz onaylı FRQ yok: sınav yalnız <strong>Bölüm I</strong> (çoktan seçmeli); puan tahmini yalnız MCQ\'ya dayanır.</p>';
      var cta;
      if (!s.hazir) cta = '<p class="dn-note ts-yakinda">Yakında — soru havuzu yetersiz (' + esc(s.yetersiz.join("; ")) + ").</p>";
      else if (!prem) cta = '<div class="ts-kilit"><span class="ts-kilit-ik">' + IK.kilit + '</span><p><strong>Premium\'da.</strong> Tam sınav, gerçek sınav süreleriyle 1–5 tahmini verir.</p><a class="btn-energy dn-card-cta" href="' + esc(premiumAdres()) + '">Premium’a geç →</a></div>';
      else if (K.aktif && K.aktif.kod === s.kod) cta = '<a class="btn-primary dn-card-cta" href="/deneme?tam=' + esc(K.aktif.id) + '">Yarım sınavına devam et →</a>';
      else cta = '<a class="btn-primary dn-card-cta" href="/deneme?tam=' + esc(s.kod) + '"' + (K.aktif ? ' aria-disabled="true" tabindex="-1" data-kilitli="1"' : "") + ">Sınavı incele ve başlat →</a>";
      return '<article class="dn-card ts-kart' + (s.hazir ? "" : " is-pasif") + '"><h3 class="dn-card-title">' + esc(s.ad) + "</h3>" +
        '<p class="ts-kart-ust">' + fmtDk(s.toplamDk * 60) + " · Bölüm I %" + s.agirlik.I + (s.frqDurumu !== "yok" ? " + Bölüm II %" + s.agirlik.II : "") + "</p>" +
        bolumOzet(s) + frqNot + cta + "</article>";
    }).join("");
    view.innerHTML =
      '<header class="page-head"><span class="eyebrow"><a href="/deneme">Deneme</a> › Tam sınav</span>' +
      '<h1 tabindex="-1" id="ts-h1">Tam deneme sınavı</h1>' +
      "<p>Gerçek AP sınavının bölümleri, süreleri ve hesap makinesi kurallarıyla tam uzunlukta deneme. Bölüm arasında ara, bölüm sonunda gözden geçirme; " +
      "çoktan seçmeli bölüm otomatik, serbest yanıt bölümü rubrikle öz puanlanır. Sonunda bileşik puan ve <strong>tahmini</strong> 1–5 AP puanı.</p></header>" +
      (K.aktif ? '<div class="dn-alert is-warn" role="status">Yarım kalan bir tam sınavın var. <a href="/deneme?tam=' + esc(K.aktif.id) + '">Devam et</a> ya da bitirmeden yenisini başlatamazsın.</div>' : "") +
      (!prem ? '<div class="dn-alert" role="note"><strong>Ücretsiz planda tam sınav kilitli.</strong> Ders denemeleri (ders başına 1) ve FRQ pratiği (ders başına 1) açık. Tam sınavın yapısını aşağıda görebilirsin.</div>' : "") +
      '<section class="dn-section"><div class="dn-grid ts-grid">' + kartlar + "</div></section>" +
      gecmisBolumu(K.gecmis) +
      '<p class="dn-note ts-kaynak">Bölüm sayıları ve süreler AP Central sınav sayfalarından alındı (21 Ekim 2026). 1–5 eşikleri <strong>tahminidir</strong>: College Board ham puan dönüşümünü yayımlamaz; eşikler kamuya açık puan dağılımlarına dayalı yaklaşık değerlerdir.</p>';
    view.querySelectorAll("[data-kilitli]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); }); });
    gecmisGrafikBagla();
  }
  function gecmisBolumu(g) {
    if (!g || !g.length) return '<section class="dn-section"><h2 class="panel-title">Geçmiş tam sınavlar</h2><p class="dn-note">Henüz tamamlanmış tam sınav yok.</p></section>';
    return '<section class="dn-section"><h2 class="panel-title">Geçmiş tam sınavlar</h2><div class="dn-table-wrap"><table class="dn-table"><thead><tr><th scope="col">Tarih</th><th scope="col">Sınav</th><th scope="col">Bileşik</th><th scope="col">Tahmini AP</th><th scope="col"><span class="visually-hidden">İşlem</span></th></tr></thead><tbody>' +
      g.map(function (x) {
        return "<tr><td>" + esc(fmtTarih(x.tarih)) + '</td><th scope="row">' + esc(x.ad) + (x.yalnizMcq ? " <small>(yalnız Bölüm I)</small>" : "") + "</th><td>" + yuzde(x.kompozit || 0) + "</td><td><strong>" + esc(x.tahminiPuan) + '</strong> <small>tahmini</small></td><td><a class="btn-ghost dn-mini" href="/deneme?tam=' + esc(x.id) + '">Sonuç</a></td></tr>';
      }).join("") + "</tbody></table></div></section>";
  }
  function gecmisGrafikBagla() { /* liste ekranında tablo yeterli; ders bazında grafik sonuç ekranında */ }

  // ======================================================================
  // 2) TANITIM (başlamadan önce)
  // ======================================================================
  function tanitim(kod) {
    odak(false);
    var go = function () {
      var s = S.kat.sinavlar.filter(function (x) { return x.kod === kod; })[0];
      if (!s) { liste(); return; }
      if (S.kat.aktif) { yukle(S.kat.aktif.id); return; }
      document.title = s.ad + " · Tam sınav | Meberra";
      var engel = !S.kat.premium ? "premium" : !s.hazir ? "havuz" : "";
      view.innerHTML = '<header class="page-head"><span class="eyebrow"><a href="/deneme?tam=1">Tam sınav</a></span><h1 tabindex="-1" id="ts-h1">' + esc(s.ad) + "</h1>" +
        "<p>Toplam yaklaşık " + fmtDk(s.toplamDk * 60) + ". Başladıktan sonra her bölümün süresi <strong>sunucuda</strong> işler: sayfayı kapatsan da durmaz.</p></header>" +
        '<section class="interactive-panel ts-kurallar"><h2 class="panel-title">Sınav düzeni</h2>' + bolumOzet(s) +
        (s.frqNot ? '<p class="dn-note">' + esc(s.frqNot) + "</p>" : "") +
        (s.frqDurumu === "yok" ? '<p class="dn-alert is-warn">Bu ders için henüz onaylı FRQ yok: sınav yalnız Bölüm I olarak kurulur ve tahmin yalnız çoktan seçmeli sonuca dayanır.</p>' :
          s.frqDurumu === "kisaltilmis" ? '<p class="dn-alert is-warn">Bölüm II kısaltılmış kurulur (' + s.frqVar + " / " + s.frqHedef + " FRQ); süre soru sayısıyla orantılı kısalır.</p>" : "") +
        '<h2 class="panel-title">Kurallar</h2><ul class="ts-kural-liste">' +
        "<li>Her bölümün başında kısa bir tanıtım ekranı gelir; süre <strong>Bölümü başlat</strong>'a basınca başlar.</li>" +
        "<li>Süre bitince bölüm otomatik teslim edilir; teslim ettiğin bölüme geri dönemezsin (gerçek sınavdaki gibi).</li>" +
        "<li>Soru listesinden istediğin soruya geçebilir, soruları <strong>işaretleyebilir</strong> ve şıkları <strong>eleyebilirsin</strong> (üstü çizilir).</li>" +
        "<li>Bölüm I ile Bölüm II arasında isteğe bağlı 10 dakikalık ara vardır.</li>" +
        "<li>Doğru cevaplar sınav bitince açılır. Serbest yanıtları rubrikle kendin puanlarsın.</li>" +
        (s.referans ? '<li>Referans: <a href="' + esc(s.referans.url) + '" target="_blank" rel="noopener">' + esc(s.referans.ad) + "</a> (sınavda da düğmeyle açılır).</li>" : "<li>Bu sınavda referans/formül sayfası verilmez.</li>") +
        (s.hesapMakinesi ? "<li>" + esc(s.hesapMakinesi.not) + " Meberra'da Desmos yeni sekmede açılır.</li>" : "<li>Bu sınavda hesap makinesi kullanılmaz.</li>") +
        "</ul>" +
        '<p class="dn-note">1–5 tahmini, bileşik puanın yaklaşık eşiklerle karşılaştırılmasıdır (resmî ölçekleme değildir). Eşikler: ' +
        s.esikler.map(function (e) { return e.puan + " → %" + e.min + "+"; }).join(" · ") + ".</p>" +
        '<p class="ts-eylem">' + (engel === "premium" ? '<a class="btn-energy" href="' + esc(premiumAdres()) + '">Premium’a geç →</a>' : engel === "havuz" ? '<span class="dn-note">Bu ders için tam sınav yakında.</span>' :
          '<button type="button" class="btn-primary" id="ts-basla">Sınavı kur</button>') + ' <a class="btn-ghost" href="/deneme?tam=1">Geri</a></p>' +
        '<p class="field-error" id="ts-hata" role="alert"></p></section>';
      var b = document.getElementById("ts-basla");
      if (b) b.addEventListener("click", function () {
        b.disabled = true; b.textContent = "Kuruluyor…";
        api("POST", "/api/tam-sinav/olustur", { kod: kod }).then(function (r) {
          if (r.durum !== 200) { b.disabled = false; b.textContent = "Sınavı kur"; document.getElementById("ts-hata").textContent = hataMetni(r, "Sınav kurulamadı."); return; }
          durumAl(r.veri); adres(r.veri.sinav.id); ekran();
        });
      });
      var h = document.getElementById("ts-h1"); if (h) h.focus();
    };
    if (S.kat) go(); else { iskelet(); api("GET", "/api/tam-sinav/katalog").then(function (r) { if (r.durum !== 200) return hataKutusu("Yüklenemedi", hataMetni(r, "Sunucu yanıt vermiyor."), function () { tanitim(kod); }); S.kat = r.veri; go(); }); }
  }

  // ======================================================================
  // 3) SÜREN SINAV
  // ======================================================================
  function durumAl(v) {
    S.r = v;
    S.ofset = (v.sunucuZamani || Date.now()) - Date.now();
    var ai = v.sinav.aktifBolum;
    if (ai >= 0) { var sr = v.sureler && v.sureler[ai] || {}; S.sure = {}; Object.keys(sr).forEach(function (k) { S.sure[k] = +sr[k] || 0; }); }
  }
  function yukle(id) {
    iskelet("Sınav yükleniyor…");
    api("GET", "/api/tam-sinav/" + encodeURIComponent(id)).then(function (r) {
      if (r.durum !== 200) return hataKutusu("Sınav açılamadı", hataMetni(r, "Sunucu yanıt vermiyor."), function () { yukle(id); });
      durumAl(r.veri); ekran();
    });
  }
  function sunucuSimdi() { return Date.now() + S.ofset; }
  function zamanDur() { if (S.zam) { clearInterval(S.zam); S.zam = null; } }

  /** Duruma göre doğru ekranı seçer */
  function ekran() {
    zamanDur();
    var v = S.r, s = v.sinav;
    if (s.durum === "bitti") { odak(false); sonucCiz(v, false); return; }
    if (s.durum === "birakildi") { liste(); return; }
    var ai = s.aktifBolum;
    if (ai >= 0) { var b = s.bolumler[ai]; if (b.tur === "mcq") mcqCiz(); else frqCiz(); return; }
    var sonraki = -1;
    for (var i = 0; i < s.bolumler.length; i++) if (s.bolumler[i].durum === "bekliyor") { sonraki = i; break; }
    if (sonraki < 0) { odak(false); puanlamaCiz(); return; }
    var onceki = s.bolumler[sonraki - 1];
    if (onceki && onceki.bolum !== s.bolumler[sonraki].bolum && ssGet(ARA_KEY + s.id) !== "bitti") { araCiz(sonraki); return; }
    girisCiz(sonraki);
  }

  function ustBar(b, ek) {
    var s = S.r.sinav, ref = s.referans, hm = s.hesapMakinesi && (b.hesapMakinesi === "gerekli" || b.hesapMakinesi === "serbest");
    return '<div class="dn-bar ts-bar"><div class="dn-bar-title"><strong>' + esc(s.ad) + '</strong><span class="dn-bar-sub">' + esc(b.ad) + "</span></div>" +
      '<div class="dn-timer-wrap"><span class="dn-timer" id="ts-timer" role="timer" aria-live="off"></span><button type="button" class="btn-ghost dn-mini" id="ts-timer-gizle" aria-pressed="false">Gizle</button></div>' +
      '<div class="dn-bar-actions ts-arac">' +
      (ref ? '<a class="btn-ghost dn-mini" href="' + esc(ref.url) + '" target="_blank" rel="noopener" title="' + esc(ref.ad) + '">' + IK.belge + " Referans</a>" : "") +
      (hm ? '<a class="btn-ghost dn-mini" href="' + esc(s.hesapMakinesi.desmos) + '" target="_blank" rel="noopener" title="Desmos yeni sekmede">' + IK.hm + " Hesap makinesi</a>" : "") +
      (ek || "") + "</div></div>";
  }
  function zamanlayiciBaslat(b, bi) {
    S.uyarildi = false;
    var ciz = function () {
      var el = document.getElementById("ts-timer"); if (!el) { zamanDur(); return; }
      var kalan = Math.max(0, S.r.sinav.bolumler[bi].bitis - sunucuSimdi()), hiz = S.r.sinav.hiz || 1;
      var gosterSn = Math.ceil(kalan / 1000 * hiz);
      el.textContent = fmtSure(gosterSn);
      el.setAttribute("aria-label", "Kalan süre " + fmtSure(gosterSn));
      var dusuk = kalan <= S.r.sinav.uyariMs;
      el.classList.toggle("is-low", dusuk);
      if (dusuk && !S.uyarildi) {
        S.uyarildi = true;
        var t = document.getElementById("ts-gizle-uyari"); if (t) t.remove();
        var bar = document.querySelector(".ts-bar");
        if (bar) bar.insertAdjacentHTML("afterend", '<div class="dn-alert is-warn ts-son5" role="alert" id="ts-son5">' + IK.uyari + " <strong>Son 5 dakika.</strong> Boş soru bırakma: AP'de yanlış cevap puan düşürmez.</div>");
        el.classList.remove("is-hidden");
        duyur("Son 5 dakika.");
      }
      if (kalan <= 0) { zamanDur(); bolumTeslim(bi, true); }
    };
    ciz(); S.zam = setInterval(ciz, 250);
    var g = document.getElementById("ts-timer-gizle");
    if (g) g.addEventListener("click", function () { var t = document.getElementById("ts-timer"), h = t.classList.toggle("is-hidden"); g.setAttribute("aria-pressed", h ? "true" : "false"); g.textContent = h ? "Göster" : "Gizle"; });
  }

  // ---- bölüm tanıtımı ve ara ----
  function girisCiz(bi) {
    odak(true); ust();
    var s = S.r.sinav, b = s.bolumler[bi];
    document.title = b.ad + " · " + s.ad + " | Meberra";
    var kural = b.tur === "mcq"
      ? ["Her soruda tek doğru cevap vardır; yanlış cevap puan düşürmez — boş bırakma.", "Soruyu <strong>işaretle</strong> ile sonra dönmek için bayrakla; <strong>Eleme</strong> ile şıkların üstünü çiz.", "Bölüm sonunda gözden geçirme ekranı boş ve işaretli soruları gösterir."]
      : ["Her parçaya cevabını kutulara yaz; yazdıkların birkaç saniyede bir sunucuya kaydedilir.", "Gerçek sınavda cevaplar kâğıda yazılır: kâğıtta çalışıyorsan kutuya kısaca özetle; puanlamada karşılaştırırsın.", "Bölüm bitince rubrik açılır ve kendini puanlarsın."];
    if (b.okumaDk) kural.unshift("Süre " + b.okumaDk + " dakikalık okuma/planlama süresini içerir.");
    if (b.kisaltilmis) kural.push("Bu bölüm kısaltılmıştır: " + b.soru + " / " + b.hedefSoru + " soru, süre orantılı.");
    view.innerHTML = '<section class="ts-giris" aria-labelledby="ts-giris-h"><p class="eyebrow">' + esc(s.ad) + " · " + (bi + 1) + ". kısım / " + s.bolumler.length + "</p>" +
      '<h1 id="ts-giris-h" tabindex="-1">' + esc(b.ad) + "</h1>" +
      '<dl class="dn-facts ts-giris-ozet"><div><dt>Soru</dt><dd>' + b.soru + (b.tur === "mcq" ? " çoktan seçmeli" : " serbest yanıt") + "</dd></div><div><dt>Süre</dt><dd>" + fmtDk(b.sureSn) + "</dd></div>" +
      "<div><dt>Hesap makinesi</dt><dd>" + esc(HM_AD[b.hesapMakinesi]) + "</dd></div>" + (s.referans ? "<div><dt>Referans</dt><dd>Açık (düğmeyle)</dd></div>" : "") + "</dl>" +
      '<ul class="ts-kural-liste">' + kural.map(function (k) { return "<li>" + k + "</li>"; }).join("") + "</ul>" +
      (s.hiz > 1 ? '<p class="dn-note">Test hızı ×' + s.hiz + " (yalnız test ortamı).</p>" : "") +
      '<p class="ts-eylem"><button type="button" class="btn-primary" id="ts-bolum-basla">Bölümü başlat</button> <button type="button" class="btn-ghost dn-mini btn-danger" id="ts-birak">Sınavı bırak</button></p>' +
      '<p class="field-error" id="ts-hata" role="alert"></p></section>';
    document.getElementById("ts-giris-h").focus();
    document.getElementById("ts-bolum-basla").addEventListener("click", function () {
      this.disabled = true;
      api("POST", "/api/tam-sinav/" + encodeURIComponent(s.id) + "/bolum-baslat", { bolum: bi }).then(function (r) {
        if (r.durum !== 200) { document.getElementById("ts-hata").textContent = hataMetni(r, "Bölüm başlatılamadı."); document.getElementById("ts-bolum-basla").disabled = false; return; }
        S.mevcut = 0; S.sure = {}; durumAl(r.veri); ekran();
      });
    });
    document.getElementById("ts-birak").addEventListener("click", birak);
  }
  function birak() {
    if (!window.confirm("Sınav bırakılsın mı? Sonuç hesaplanmaz ve geçmişe eklenmez.")) return;
    api("POST", "/api/tam-sinav/" + encodeURIComponent(S.r.sinav.id) + "/birak", {}).then(function () { zamanDur(); S.kat = null; adres("1"); liste(); });
  }
  function araCiz(bi) {
    odak(true); ust();
    var s = S.r.sinav, hiz = s.hiz || 1, k = ARA_KEY + s.id, bas = +ssGet(k) || Date.now();
    ssSet(k, String(bas));
    var sure = 600000 / hiz;
    view.innerHTML = '<section class="ts-giris ts-ara" aria-labelledby="ts-ara-h"><p class="eyebrow">' + esc(s.ad) + '</p><h1 id="ts-ara-h" tabindex="-1">Ara</h1>' +
      "<p>Bölüm I bitti. Gerçek sınavda burada 10 dakikalık ara verilir: su iç, biraz yürü. Ara isteğe bağlıdır; sınav süresine sayılmaz.</p>" +
      '<p class="ts-ara-sayac"><span class="dn-timer" id="ts-ara-sayac" role="timer"></span></p>' +
      '<p class="ts-eylem"><button type="button" class="btn-primary" id="ts-ara-bitti">Bölüm II\'ye geç</button></p></section>';
    document.getElementById("ts-ara-h").focus();
    var ciz = function () {
      var el = document.getElementById("ts-ara-sayac"); if (!el) { zamanDur(); return; }
      var kal = Math.max(0, bas + sure - Date.now());
      el.textContent = fmtSure(Math.ceil(kal / 1000 * hiz));
      if (kal <= 0) { zamanDur(); el.textContent = "Ara bitti"; duyur("Ara bitti. Bölüm II'ye geçebilirsin."); }
    };
    ciz(); S.zam = setInterval(ciz, 500);
    document.getElementById("ts-ara-bitti").addEventListener("click", function () { zamanDur(); ssSet(k, "bitti"); girisCiz(bi); });
  }

  // ---- MCQ bölümü ----
  function mcqVeri() { var v = S.r, ai = v.sinav.aktifBolum; return { ai: ai, b: v.sinav.bolumler[ai], sorular: v.icerik.sorular, pasajlar: v.icerik.pasajlar || {} }; }
  function alan(ad) { var v = S.r, ai = v.sinav.aktifBolum; v[ad] = v[ad] || {}; v[ad][ai] = v[ad][ai] || {}; return v[ad][ai]; }
  function mcqCiz() {
    odak(true); ust();
    var m = mcqVeri();
    document.title = m.b.ad + " sürüyor | Meberra";
    if (S.mevcut >= m.sorular.length) S.mevcut = 0;
    view.innerHTML = '<section class="dn-exam ts-exam" id="ts-exam" aria-label="' + esc(m.b.ad) + '">' +
      ustBar(m.b, '<button type="button" class="btn-ghost dn-mini" id="ts-eleme" aria-pressed="' + (S.eleme ? "true" : "false") + '" title="Şıkların üstünü çizme modu">' + IK.ele + ' Eleme</button>' +
        '<button type="button" class="btn-primary dn-mini" id="ts-gozden">Gözden geçir</button>') +
      '<div class="dn-ilerleme"><div class="dn-ilerleme-cubuk" role="progressbar" aria-label="Cevaplanan soru" aria-valuemin="0" aria-valuemax="' + m.sorular.length + '" id="ts-cubuk"><span id="ts-dolgu"></span></div><span class="dn-ilerleme-metin" id="ts-ilerleme-metin"></span></div>' +
      '<nav class="dn-serit" id="ts-serit" aria-label="Sorular"></nav>' +
      '<div class="dn-stage" id="ts-stage"></div>' +
      '<div class="dn-foot"><button type="button" class="btn-ghost" id="ts-onceki">← Önceki</button><span class="ts-pos" id="ts-pos"></span><button type="button" class="btn-primary" id="ts-sonraki">Sonraki →</button></div>' +
      '<p class="kbd-hint dn-kbd"><kbd>A</kbd>–<kbd>E</kbd> şık seçer · <kbd>←</kbd>/<kbd>→</kbd> önceki/sonraki · <kbd>M</kbd> işaretle · <kbd>X</kbd> eleme modu. Her cevap anında sunucuya kaydedilir.</p>' +
      '<div class="ts-gozden" id="ts-gozden-panel" hidden></div></section>';
    document.getElementById("ts-onceki").addEventListener("click", function () { git(S.mevcut - 1); });
    document.getElementById("ts-sonraki").addEventListener("click", function () { if (S.mevcut === m.sorular.length - 1) gozdenGecir(); else git(S.mevcut + 1); });
    document.getElementById("ts-gozden").addEventListener("click", gozdenGecir);
    document.getElementById("ts-eleme").addEventListener("click", elemeModu);
    document.getElementById("ts-serit").addEventListener("click", function (e) { var x = e.target.closest("button[data-i]"); if (x) git(+x.getAttribute("data-i")); });
    soruCiz();
    zamanlayiciBaslat(m.b, m.ai);
  }
  function elemeModu() {
    S.eleme = !S.eleme;
    var b = document.getElementById("ts-eleme"); if (b) b.setAttribute("aria-pressed", S.eleme ? "true" : "false");
    var st = document.getElementById("ts-stage"); if (st) st.classList.toggle("is-eleme", S.eleme);
    duyur(S.eleme ? "Eleme modu açık: şıkların yanındaki düğmeyle üstünü çiz." : "Eleme modu kapalı.");
  }
  function sureTopla() {
    if (!S.soruGiris) return 0;
    var d = (Date.now() - S.soruGiris) / 1000 * (S.r.sinav.hiz || 1); S.soruGiris = Date.now();
    if (d > 0 && d < 7200) S.sure[S.mevcut] = (S.sure[S.mevcut] || 0) + d;
    return Math.round(S.sure[S.mevcut] || 0);
  }
  function soruCiz() {
    var m = mcqVeri(), i = S.mevcut, q = m.sorular[i], cev = alan("cevaplar"), isr = alan("isaret"), el = alan("eleme");
    var sel = cev[i] || null, elenen = el[i] || [], pas = q.pasaj && m.pasajlar[q.pasaj];
    S.soruGiris = Date.now();
    var st = document.getElementById("ts-stage");
    st.className = "dn-stage" + (pas ? " has-passage" : "") + (S.eleme ? " is-eleme" : "");
    st.innerHTML = (pas ? '<aside class="dn-passage" aria-label="Pasaj"><h3 class="dn-passage-title">' + esc(pas.baslik) + '</h3><div class="dn-passage-body">' + pas.html + "</div></aside>" : "") +
      '<article class="question-card dn-q" aria-labelledby="ts-q-baslik"><div class="dn-q-head"><span class="question-num-badge" id="ts-q-baslik" tabindex="-1">Soru ' + (i + 1) + " / " + m.sorular.length + "</span>" +
      '<button type="button" class="btn-ghost dn-mini dn-mark ts-isaret" id="ts-isaret" aria-pressed="' + (isr[i] ? "true" : "false") + '">' + IK.bayrak + (isr[i] ? " İşaretli" : " İşaretle") + "</button></div>" +
      '<div class="question-body">' + q.question + "</div>" + skHtml(q.sekiller) +
      '<div class="options-container ts-siklar' + (skSecenekli(q.options) ? " sk-secenekli" : "") + '" role="group" aria-label="Soru ' + (i + 1) + ' seçenekleri">' + q.options.map(function (o) {
        var on = sel === o.id, ele = elenen.indexOf(o.id) >= 0;
        return '<div class="ts-sik' + (ele ? " is-elendi" : "") + '"><button type="button" class="option-btn dn-opt' + (on ? " is-selected" : "") + '" data-opt="' + esc(o.id) + '" aria-pressed="' + (on ? "true" : "false") + '">' +
          '<span class="option-letter" aria-hidden="true">' + esc(o.id) + '</span><span class="visually-hidden">Şık ' + esc(o.id) + (ele ? " (elendi)" : "") + ": </span><span class=\"ts-sik-metin\">" + (o.text || "") + skHtml(o.sekil, true) + "</span></button>" +
          '<button type="button" class="ts-ele-btn" data-ele="' + esc(o.id) + '" aria-pressed="' + (ele ? "true" : "false") + '" aria-label="' + (ele ? "Şık " + esc(o.id) + " elemesini geri al" : "Şık " + esc(o.id) + "'yi ele") + '">' + (ele ? "Geri al" : "Ele") + "</button></div>";
      }).join("") + "</div>" + skSiklar(q.options) +
      '<div class="dn-q-tools"><button type="button" class="btn-ghost dn-mini" id="ts-temizle"' + (sel ? "" : " disabled") + ">Seçimi temizle</button></div></article>";
    st.querySelectorAll(".dn-opt").forEach(function (b) { b.addEventListener("click", function () { sec(b.getAttribute("data-opt")); }); });
    st.querySelectorAll(".ts-ele-btn").forEach(function (b) { b.addEventListener("click", function () { ele(b.getAttribute("data-ele")); }); });
    document.getElementById("ts-isaret").addEventListener("click", isaretle);
    document.getElementById("ts-temizle").addEventListener("click", function () { sec(null); });
    document.getElementById("ts-pos").textContent = (i + 1) + " / " + m.sorular.length;
    document.getElementById("ts-onceki").disabled = i === 0;
    document.getElementById("ts-sonraki").textContent = i === m.sorular.length - 1 ? "Gözden geçir →" : "Sonraki →";
    seritCiz();
    typeset(st);
  }
  function seritCiz() {
    var m = mcqVeri(), cev = alan("cevaplar"), isr = alan("isaret"), g = document.getElementById("ts-serit");
    if (!g) return;
    g.innerHTML = m.sorular.map(function (x, i) {
      var cls = (cev[i] ? " is-answered" : "") + (isr[i] ? " is-marked" : "") + (i === S.mevcut ? " is-current" : "");
      return '<button type="button" class="dn-cell dn-serit-hucre' + cls + '" data-i="' + i + '" aria-label="Soru ' + (i + 1) + (cev[i] ? ", cevaplandı" : ", boş") + (isr[i] ? ", işaretli" : "") + '"' + (i === S.mevcut ? ' aria-current="true"' : "") + ">" + (i + 1) + "</button>";
    }).join("");
    var n = m.sorular.length, a = Object.keys(cev).length, mk = Object.keys(isr).length;
    var d = document.getElementById("ts-dolgu"); if (d) d.style.transform = "scaleX(" + (n ? a / n : 0) + ")";
    var c = document.getElementById("ts-cubuk"); if (c) c.setAttribute("aria-valuenow", String(a));
    var t = document.getElementById("ts-ilerleme-metin"); if (t) t.textContent = a + " / " + n + " cevaplandı" + (mk ? " · " + mk + " işaretli" : "");
    var cur = g.querySelector(".is-current"); if (cur && g.scrollWidth > g.clientWidth) g.scrollLeft = Math.max(0, cur.offsetLeft - g.clientWidth / 2);
  }
  /** Tek kayıt isteği; süresi dolmuşsa (409) bölüm kapanır ve ekran yenilenir */
  function gonder(govde) {
    var ai = S.r.sinav.aktifBolum;
    govde.bolum = ai;
    return api("POST", "/api/tam-sinav/" + encodeURIComponent(S.r.sinav.id) + "/cevap", govde).then(function (r) {
      if (r.durum === 409) { zamanDur(); duyur("Bölüm kapandı."); yukle(S.r.sinav.id); }
      else if (r.durum !== 200) { var bar = document.querySelector(".ts-bar"); if (bar && !document.getElementById("ts-kayit-hata")) bar.insertAdjacentHTML("afterend", '<div class="dn-alert is-bad" role="alert" id="ts-kayit-hata">Cevap kaydedilemedi: ' + esc(hataMetni(r, "bağlantı sorunu")) + ". Yeniden seçmeyi dene.</div>"); }
      else { var h = document.getElementById("ts-kayit-hata"); if (h) h.remove(); }
      return r;
    });
  }
  function sec(opt) {
    var i = S.mevcut, cev = alan("cevaplar"), el = alan("eleme");
    if (opt) cev[i] = opt; else delete cev[i];
    var govde = { i: i, secim: opt, sureSn: sureTopla() };
    if (opt && el[i] && el[i].indexOf(opt) >= 0) { el[i] = el[i].filter(function (x) { return x !== opt; }); govde.eleme = el[i]; }
    gonder(govde);
    soruCiz();
    duyur(opt ? "Seçenek " + opt + " seçildi." : "Seçim temizlendi.");
  }
  function ele(opt) {
    var i = S.mevcut, el = alan("eleme"), cev = alan("cevaplar"), l = (el[i] || []).slice(), j = l.indexOf(opt);
    if (j >= 0) l.splice(j, 1); else { l.push(opt); if (cev[i] === opt) delete cev[i]; }
    el[i] = l;
    var govde = { i: i, eleme: l };
    if (!cev[i]) govde.secim = null;
    gonder(govde); soruCiz();
    duyur(j >= 0 ? "Şık " + opt + " geri alındı." : "Şık " + opt + " elendi.");
  }
  function isaretle() {
    var i = S.mevcut, isr = alan("isaret"), on = !isr[i];
    if (on) isr[i] = 1; else delete isr[i];
    gonder({ i: i, isaret: on }); soruCiz();
    duyur(on ? "Soru işaretlendi." : "İşaret kaldırıldı.");
  }
  function git(i) {
    var m = mcqVeri();
    if (i < 0 || i >= m.sorular.length || i === S.mevcut) return;
    var once = S.mevcut, sn = sureTopla();
    if (sn) gonder({ i: once, sureSn: sn });
    S.mevcut = i; soruCiz();
    var h = document.getElementById("ts-q-baslik"); if (h) h.focus({ preventScroll: true });
  }
  function gozdenGecir() {
    var m = mcqVeri(), cev = alan("cevaplar"), isr = alan("isaret"), p = document.getElementById("ts-gozden-panel");
    var n = m.sorular.length, a = Object.keys(cev).length, mk = Object.keys(isr).length;
    p.hidden = false;
    p.innerHTML = '<div class="dn-nav-head"><h2 id="ts-gozden-h" tabindex="-1">Gözden geçir: ' + esc(m.b.ad) + '</h2><button type="button" class="btn-ghost dn-mini" id="ts-gozden-kapat">Sorulara dön</button></div>' +
      '<div class="dn-legend"><span><i class="dn-dot is-answered"></i>Cevaplandı</span><span><i class="dn-dot"></i>Boş</span><span><i class="dn-dot is-marked"></i>İşaretli</span></div>' +
      '<div class="dn-grid-nav">' + m.sorular.map(function (x, i) {
        return '<button type="button" class="dn-cell' + (cev[i] ? " is-answered" : "") + (isr[i] ? " is-marked" : "") + '" data-i="' + i + '" aria-label="Soru ' + (i + 1) + (cev[i] ? ", cevaplandı" : ", boş") + (isr[i] ? ", işaretli" : "") + '">' + (i + 1) + "</button>";
      }).join("") + "</div>" +
      "<p><strong>" + a + "</strong> cevaplı · <strong>" + (n - a) + "</strong> boş · <strong>" + mk + "</strong> işaretli</p>" +
      (n - a ? '<p class="dn-warn">' + (n - a) + " soru boş. Yanlış cevap puan düşürmez; tahmin etmek mantıklı.</p>" : "") +
      '<p class="dn-warn">Teslim ettikten sonra bu bölüme dönemezsin.</p>' +
      '<div class="dn-nav-actions"><button type="button" class="btn-primary" id="ts-teslim">Bölümü teslim et</button></div>';
    p.querySelectorAll(".dn-cell").forEach(function (b) { b.addEventListener("click", function () { p.hidden = true; git(+b.getAttribute("data-i")); }); });
    document.getElementById("ts-gozden-kapat").addEventListener("click", function () { p.hidden = true; });
    document.getElementById("ts-teslim").addEventListener("click", function () { bolumTeslim(m.ai, false); });
    document.getElementById("ts-gozden-h").focus();
  }
  function bolumTeslim(bi, otomatik) {
    if (S.teslimde) return;
    S.teslimde = true; zamanDur();
    var son = [];
    if (S.r.sinav.bolumler[bi].tur === "mcq") { var sn = sureTopla(); if (sn) son.push(gonder({ i: S.mevcut, sureSn: sn })); }
    else son.push(frqKaydet(true));
    var b = document.getElementById("ts-teslim"); if (b) { b.disabled = true; b.textContent = "Teslim ediliyor…"; }
    Promise.all(son).catch(function () {}).then(function () {
      return api("POST", "/api/tam-sinav/" + encodeURIComponent(S.r.sinav.id) + "/bolum-teslim", { bolum: bi, otomatik: !!otomatik });
    }).then(function (r) {
      S.teslimde = false;
      if (r.durum !== 200) { if (b) { b.disabled = false; b.textContent = "Bölümü teslim et"; } hataKutusu("Bölüm teslim edilemedi", hataMetni(r, "Sunucu yanıt vermiyor."), function () { bolumTeslim(bi, otomatik); }); return; }
      S.mevcut = 0; S.sure = {}; S.eleme = false;
      durumAl(r.veri);
      if (otomatik) duyur("Süre doldu, bölüm otomatik teslim edildi.");
      ekran();
      if (otomatik) { var h = view.querySelector("h1"); if (h) h.insertAdjacentHTML("beforebegin", '<div class="dn-alert is-warn" role="status">Süre doldu: bölüm otomatik teslim edildi.</div>'); }
    });
  }

  // ---- FRQ bölümü ----
  function frqCiz() {
    odak(true); ust();
    var v = S.r, ai = v.sinav.aktifBolum, b = v.sinav.bolumler[ai], l = v.icerik.frq, fc = (v.frqCevap || {})[ai] || {};
    document.title = b.ad + " sürüyor | Meberra";
    view.innerHTML = '<section class="ts-exam ts-frq" id="ts-exam" aria-label="' + esc(b.ad) + '">' +
      ustBar(b, '<span class="ts-kayit-durum" id="ts-kayit" aria-live="polite"></span><button type="button" class="btn-primary dn-mini" id="ts-frq-teslim">Bölümü teslim et</button>') +
      '<nav class="ts-frq-nav" aria-label="Sorular">' + l.map(function (f, i) { return '<a href="#ts-frq-' + i + '" class="chip">Soru ' + (i + 1) + "</a>"; }).join("") + "</nav>" +
      l.map(function (f, i) {
        if (!f) return "";
        var c = fc[i] || {};
        return '<article class="frq-giris ts-frq-soru" id="ts-frq-' + i + '" aria-labelledby="ts-frq-h-' + i + '"><h2 id="ts-frq-h-' + i + '">Soru ' + (i + 1) + " · " + esc(f.baslik) + ' <small>(' + f.toplam_puan + " puan)</small></h2>" +
          '<div class="icerik">' + f.giris + "</div>" + skHtml(f.sekiller) +
          f.parcalar.map(function (p) {
            var id = "ts-frq-" + i + "-" + p.harf;
            return '<section class="frq-parca"><div class="frq-parca-bas"><h3>(' + esc(p.harf) + ')</h3><span class="frq-puan-et">' + p.puan + ' puan</span></div><div class="frq-soru icerik">' + p.soru + "</div>" + skHtml(p.sekiller) +
              '<label class="visually-hidden" for="' + id + '">Soru ' + (i + 1) + " (" + esc(p.harf) + ") cevabın</label>" +
              '<textarea class="ts-frq-kutu" id="' + id + '" data-i="' + i + '" data-harf="' + esc(p.harf) + '" rows="6" spellcheck="false" placeholder="Cevabını, gerekçeni ve hesaplarını yaz…">' + esc(c[p.harf] || "") + "</textarea></section>";
          }).join("") + "</article>";
      }).join("") + "</section>";
    typeset(view);
    document.getElementById("ts-frq-teslim").addEventListener("click", function () {
      var bos = [].slice.call(view.querySelectorAll(".ts-frq-kutu")).filter(function (t) { return !t.value.trim(); }).length;
      if (!window.confirm((bos ? bos + " kutu boş. " : "") + "Bölüm teslim edilsin mi? Teslimden sonra cevapların değişmez.")) return;
      bolumTeslim(ai, false);
    });
    zamanlayiciBaslat(b, ai);
  }
  function frqGirdi(e) {
    if (!e.target || !e.target.classList || !e.target.classList.contains("ts-frq-kutu")) return;
    S.kaydet[e.target.getAttribute("data-i")] = 1;
    var k = document.getElementById("ts-kayit"); if (k) k.textContent = "Kaydediliyor…";
    clearTimeout(S.frqZaman); S.frqZaman = setTimeout(function () { frqKaydet(false); }, 1500);
  }
  function frqKaydet() {
    clearTimeout(S.frqZaman);
    var bekleyen = Object.keys(S.kaydet); S.kaydet = {};
    if (!bekleyen.length || !S.r || S.r.sinav.aktifBolum < 0) return Promise.resolve();
    return Promise.all(bekleyen.map(function (i) {
      var c = {};
      view.querySelectorAll('.ts-frq-kutu[data-i="' + i + '"]').forEach(function (t) { c[t.getAttribute("data-harf")] = t.value; });
      return gonder({ i: +i, frq: c });
    })).then(function (rs) {
      var k = document.getElementById("ts-kayit");
      if (k) k.textContent = rs.every(function (r) { return r.durum === 200; }) ? "Kaydedildi " + new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "Kaydedilemedi";
    });
  }

  // ======================================================================
  // 4) FRQ ÖZ PUANLAMA (tüm bölümler kapandıktan sonra)
  // ======================================================================
  function puanlamaCiz() {
    var v = S.r, l = v.rubrikler || [];
    if (!l.length) { bitir(); return; }
    ust(); document.title = "Öz puanlama · " + v.sinav.ad + " | Meberra";
    var puanli = l.filter(function (x) { return x.toplam != null; }).length;
    view.innerHTML = '<header class="page-head"><span class="eyebrow">' + esc(v.sinav.ad) + '</span><h1 tabindex="-1" id="ts-h1">Bölüm II: öz puanlama</h1>' +
      "<p>Her FRQ'yu rubrikle karşılaştır, ölçütleri işaretle ve kaydet. AP okuyucuları ölçütte istenen ifade ya da gerekçe yoksa puan vermez. Puanlamadığın FRQ 0 sayılır.</p></header>" +
      '<p class="ts-puan-durum" id="ts-puan-durum">' + puanli + " / " + l.length + " FRQ puanlandı.</p>" +
      l.map(function (x, j) { return rubrikHtml(x, j); }).join("") +
      '<p class="ts-eylem"><button type="button" class="btn-primary" id="ts-sonuc">Sonucu gör</button></p><p class="field-error" id="ts-hata" role="alert"></p>';
    typeset(view);
    view.querySelectorAll(".ts-rubrik").forEach(function (f) {
      f.addEventListener("change", function () { rubrikToplam(f); });
      f.addEventListener("submit", function (e) { e.preventDefault(); rubrikKaydet(f); });
      rubrikToplam(f);
    });
    document.getElementById("ts-sonuc").addEventListener("click", function () {
      var eksik = (S.r.rubrikler || []).filter(function (x) { return x.toplam == null; }).length;
      if (eksik && !window.confirm(eksik + " FRQ puanlanmadı; 0 sayılacak. Yine de sonuca geçilsin mi?")) return;
      bitir();
    });
    document.getElementById("ts-h1").focus();
  }
  /** frq.js rubrik ekranıyla aynı biçim (frq.css sınıfları) */
  function rubrikHtml(x, j) {
    var f = x.frq, p0 = x.puanlar || {};
    if (!f) return "";
    return '<form class="ts-rubrik frq-rubrik" data-j="' + j + '" novalidate><h2 class="ts-rubrik-h">FRQ ' + (j + 1) + " · " + esc(f.baslik) + "</h2>" +
      '<div class="frq-skor"><div class="frq-skor-sayi"><span data-toplam>0</span><span class="frq-skor-bolu">/ ' + f.toplam_puan + '</span></div><div class="frq-skor-bar" aria-hidden="true"><span data-dolgu></span></div></div>' +
      '<details class="frq-giris-ac"><summary>Soru metnini göster</summary><div class="frq-giris icerik">' + f.giris + "</div>" + skHtml(f.sekiller) + skHtml(f.cozumSekiller) + "</details>" +
      f.parcalar.map(function (p) {
        var cev = String((x.cevaplar || {})[p.harf] || ""), pp = p0[p.harf] || [];
        return '<section class="frq-parca"><div class="frq-parca-bas"><h3>(' + esc(p.harf) + ')</h3><span class="frq-puan-et"><span data-parca="' + esc(p.harf) + '">0</span> / ' + p.puan + " puan</span></div>" +
          '<div class="frq-soru icerik">' + p.soru + "</div>" + skHtml(p.sekiller) +
          '<div class="frq-senin"><p class="frq-mini-baslik">Senin cevabın</p>' + (cev.trim() ? '<p class="frq-senin-metin">' + esc(cev) + "</p>" : '<p class="frq-soluk">Kutuya yazmadın — kâğıttaki cevabınla karşılaştır.</p>') + "</div>" +
          '<fieldset class="frq-olcutler"><legend class="frq-mini-baslik">Puanlama ölçütleri</legend>' + p.rubrik.map(function (rb, i) {
            var ad = "ts-o-" + j + "-" + p.harf + "-" + i, v = +pp[i] || 0;
            var giris = rb.puan === 1 ? '<input type="checkbox" id="' + ad + '" data-harf="' + esc(p.harf) + '" data-i="' + i + '" value="1"' + (v ? " checked" : "") + ">"
              : '<span class="frq-seg" role="radiogroup" aria-label="Ölçüt ' + (i + 1) + ' puanı">' + Array.apply(null, { length: rb.puan + 1 }).map(function (_, n) {
                return '<label><input type="radio" name="' + ad + '" data-harf="' + esc(p.harf) + '" data-i="' + i + '" value="' + n + '"' + (v === n ? " checked" : "") + "><span>" + n + "</span></label>"; }).join("") + "</span>";
            return '<div class="frq-olcut">' + (rb.puan === 1 ? '<label class="frq-olcut-et" for="' + ad + '">' + giris : '<div class="frq-olcut-et">') +
              '<span class="frq-olcut-metin"><span class="frq-olcut-puan">' + rb.puan + " puan</span> " + rb.olcut + (rb.ornek_cevap ? '<span class="frq-ornek">Örnek: ' + rb.ornek_cevap + "</span>" : "") + "</span>" +
              (rb.puan === 1 ? "</label>" : giris + "</div>") + "</div>";
          }).join("") + "</fieldset>" +
          '<details class="frq-cozum"><summary>Örnek çözüm</summary><div class="icerik">' + p.ornek_cozum + "</div>" + skHtml(p.cozumSekiller) + "</details>" +
          (p.sik_hatalar && p.sik_hatalar.length ? '<div class="frq-hatalar"><p class="frq-mini-baslik">Sık hatalar</p><ul>' + p.sik_hatalar.map(function (h) { return "<li>" + h + "</li>"; }).join("") + "</ul></div>" : "") + "</section>";
      }).join("") +
      '<div class="frq-teslim"><button type="submit" class="btn-primary">' + (x.toplam != null ? "Puanımı güncelle" : "Puanımı kaydet") + '</button><span class="ts-kayit-durum" data-durum aria-live="polite">' + (x.toplam != null ? "Kaydedildi" : "") + "</span></div></form>";
  }
  function rubrikPuanlari(form) {
    var x = S.r.rubrikler[+form.getAttribute("data-j")], o = {};
    x.frq.parcalar.forEach(function (p) {
      o[p.harf] = p.rubrik.map(function (rb, i) {
        if (rb.puan === 1) { var c = form.querySelector('input[type=checkbox][data-harf="' + p.harf + '"][data-i="' + i + '"]'); return c && c.checked ? 1 : 0; }
        var r = form.querySelector('input[type=radio][data-harf="' + p.harf + '"][data-i="' + i + '"]:checked'); return r ? +r.value : 0;
      });
    });
    return o;
  }
  function rubrikToplam(form) {
    var x = S.r.rubrikler[+form.getAttribute("data-j")], pu = rubrikPuanlari(form), top = 0;
    x.frq.parcalar.forEach(function (p) { var t = pu[p.harf].reduce(function (a, b) { return a + b; }, 0); top += t; var el = form.querySelector('[data-parca="' + p.harf + '"]'); if (el) el.textContent = t; });
    form.querySelector("[data-toplam]").textContent = top;
    form.querySelector("[data-dolgu]").style.transform = "scaleX(" + (top / Math.max(1, x.frq.toplam_puan)) + ")";
    return top;
  }
  function rubrikKaydet(form) {
    var x = S.r.rubrikler[+form.getAttribute("data-j")], b = form.querySelector("button[type=submit]"), d = form.querySelector("[data-durum]");
    b.disabled = true; d.textContent = "Kaydediliyor…";
    api("POST", "/api/frq/" + encodeURIComponent(x.frq.id) + "/puanla", { denemeId: x.denemeId, puanlar: rubrikPuanlari(form) }).then(function (r) {
      b.disabled = false;
      if (r.durum !== 200) { d.textContent = hataMetni(r, "Kaydedilemedi."); return; }
      x.toplam = r.veri.toplam; x.puanlar = r.veri.puanlar;
      b.textContent = "Puanımı güncelle"; d.textContent = "Kaydedildi: " + r.veri.toplam + " / " + r.veri.toplam_puan;
      var l = S.r.rubrikler, n = l.filter(function (y) { return y.toplam != null; }).length;
      var pd = document.getElementById("ts-puan-durum"); if (pd) pd.textContent = n + " / " + l.length + " FRQ puanlandı.";
      duyur("FRQ puanı kaydedildi.");
    });
  }

  function bitir() {
    iskelet("Sonuç hesaplanıyor…"); odak(false);
    api("POST", "/api/tam-sinav/" + encodeURIComponent(S.r.sinav.id) + "/bitir", {}).then(function (r) {
      if (r.durum !== 200) return hataKutusu("Sonuç hesaplanamadı", hataMetni(r, "Sunucu yanıt vermiyor."), bitir);
      durumAl(r.veri);
      if (r.veri.denemeKaydi) gecmiseYaz(r.veri.denemeKaydi);
      if (r.veri.ilk) yanlislariYaz(r.veri);
      sonucCiz(r.veri, !!r.veri.ilk);
    });
  }
  /** Deneme geçmişi (bu cihaz): deneme sayfasındaki geçmiş ve grafikler hemen görsün (sunucuda zaten exams'e yazıldı) */
  function gecmiseYaz(rec) {
    var d = sget(KEY, null); if (!d || typeof d !== "object") d = {};
    var g = Array.isArray(d.gecmis) ? d.gecmis.filter(function (x) { return x && x.id !== rec.id; }) : [];
    d.v = 1; d.gecmis = [rec].concat(g).slice(0, 50); if (!("aktif" in d)) d.aktif = null;
    sset(KEY, d);
  }
  /** Yanlışlarım (apmeberra:errors:v1): deneme.js ile aynı alanlar */
  function yanlislariYaz(v) {
    var errors = (window.APMEBERRA && typeof window.APMEBERRA.loadErrors === "function") ? window.APMEBERRA.loadErrors() : sget(ERR_KEY, null);
    if (!errors || typeof errors !== "object" || !errors.items) errors = { v: 1, items: {} };
    var now = v.sonuc.tarih, degisti = false;
    v.sonuc.inceleme.forEach(function (it) {
      if (!it.s) return;
      var q = v.icerik.sorular[it.k], c = v.cozumler[it.k]; if (!q || !c) return;
      var page = String(q.sayfa).replace(/\.html?$/i, ""), key = page + "|" + q.id;
      if (it.st === "dogru") { if (errors.items[key] && !errors.items[key].resolved) { errors.items[key].resolved = true; errors.items[key].resolvedDate = now; degisti = true; } return; }
      var prev = errors.items[key], h = (c.hatalar || {})[it.s] || {};
      errors.items[key] = { id: q.id, page: page, unit: q.kap, unitTitle: q.kapBaslik, number: q.number || null, topic: metin(q.topic),
        errorTag: metin(h.errorTag || "Kavramsal veya işlemsel eksiklik."), selected: it.s, correct: c.dogru, date: now,
        firstDate: prev ? (prev.firstDate || prev.date) : now, count: prev ? (prev.count || 1) + 1 : 1, resolved: false };
      degisti = true;
    });
    if (degisti) sset(ERR_KEY, errors);
  }
  function metin(h) { var d = document.createElement("div"); d.innerHTML = String(h || ""); return (d.textContent || "").replace(/\s+/g, " ").trim(); }

  // ======================================================================
  // 5) SONUÇ
  // ======================================================================
  function sonucCiz(v, ilk) {
    var s = v.sonuc, sn = v.sinav;
    odak(false); ust();
    document.title = "Tam sınav sonucu · " + s.ad + " | Meberra";
    var yanlislar = s.inceleme.filter(function (x) { return x.st !== "dogru"; });
    var mcq = s.mcq, frq = s.frq;
    view.innerHTML =
      '<header class="page-head"><span class="eyebrow"><a href="/deneme?tam=1">Tam sınav</a> › Sonuç</span><h1 tabindex="-1" id="ts-h1">' + esc(s.ad) + "</h1><p>" + esc(fmtTarih(s.tarih)) + " · " + fmtDk(s.sureSn) + " çalışıldı" + (s.yalnizMcq ? " · yalnız Bölüm I" : "") + "</p></header>" +
      '<section class="ts-hero" aria-labelledby="ts-hero-h"><div class="ts-hero-puan"><span class="ts-hero-et" id="ts-hero-h">Tahmini AP puanı</span><span class="ts-hero-sayi" id="ts-ap">' + (ilk ? 1 : s.tahminiPuan) + '</span><span class="dn-tag">tahmini</span></div>' +
      '<div class="ts-hero-ayrinti"><p class="ts-kompozit">Bileşik puan <strong id="ts-kompozit">' + (ilk ? "0" : (Math.round(s.kompozit * 10) / 10).toLocaleString("tr-TR")) + "</strong> / 100</p>" +
      olcekHtml(s) +
      '<p class="dn-note">Tahmini — resmî ölçekleme değildir. Eşikler kamuya açık puan dağılımlarından türetilmiş yaklaşık değerlerdir ve her yıl değişir.' + (s.yalnizMcq ? " Bu sınavda Bölüm II yoktu; tahmin yalnız çoktan seçmeli sonuca dayanır." : "") + (frq && frq.puanlanmamis ? " " + frq.puanlanmamis + " FRQ puanlanmadı (0 sayıldı)." : "") + "</p></div></section>" +
      '<section class="dn-section" aria-labelledby="ts-kirilim-h"><h2 class="panel-title" id="ts-kirilim-h">Puan kırılımı</h2><div class="dn-stats ts-tiles">' +
      karo("Bölüm I · çoktan seçmeli", mcq.dogru + " / " + mcq.toplam, yuzde(mcq.yuzde) + " doğru · ağırlık %" + s.agirlik.I + (s.katki.II != null ? " → " + s.katki.I.toLocaleString("tr-TR") + " puan" : "")) +
      (frq ? karo("Bölüm II · öz puan", frq.kazanilan + " / " + frq.toplam, yuzde(frq.yuzde) + " · ağırlık %" + s.agirlik.II + " → " + s.katki.II.toLocaleString("tr-TR") + " puan") : "") +
      karo("Bileşik", (Math.round(s.kompozit * 10) / 10).toLocaleString("tr-TR"), s.katki.II != null ? "(%" + s.agirlik.I + " × MCQ + %" + s.agirlik.II + " × FRQ) / 100" : "yalnız MCQ yüzdesi") +
      "</div>" + bolumTablosu(s) + "</section>" +
      '<section class="dn-section" aria-labelledby="ts-unite-h"><h2 class="panel-title" id="ts-unite-h">Ünite bazında başarı (çoktan seçmeli)</h2>' + uniteGrafik(s) + "</section>" +
      '<section class="dn-section" aria-labelledby="ts-zaman-h"><h2 class="panel-title" id="ts-zaman-h">Soru başına süre</h2>' + zamanGrafik(s) + "</section>" +
      '<section class="dn-section" aria-labelledby="ts-gecmis-h"><h2 class="panel-title" id="ts-gecmis-h">Geçmiş tam sınavların</h2><div id="ts-gecmis-grafik"><p class="dn-note">Yükleniyor…</p></div></section>' +
      '<section class="dn-section" aria-labelledby="ts-yanlis-h"><h2 class="panel-title" id="ts-yanlis-h">Yanlış ve boş sorular (' + yanlislar.length + ")</h2>" +
      (yanlislar.length ? '<div class="ts-tekrar-eylem"><button type="button" class="btn-primary" id="ts-tekrar-ekle">Yanlışlarını tekrar et</button> <a class="btn-ghost" href="/deneme?mod=yanlislar&amp;deneme=' + esc(s.id) + '">Yanlışlardan deneme kur</a><p class="dn-note" id="ts-tekrar-not">Yanlış ve boş sorular akıllı tekrar listene eklenir (yarın tekrar sorulur); Yanlışlarım\'a zaten yazıldı.</p></div>' +
        '<div class="ts-yanlislar">' + yanlislar.map(function (x, n) { return yanlisHtml(v, x, n); }).join("") + "</div>" : '<p class="dn-note">Hiç yanlışın yok. Harika!</p>') + "</section>" +
      '<p class="ts-eylem"><a class="btn-primary" href="/deneme?tam=1">Tam sınavlar</a> <a class="btn-ghost" href="/deneme">Denemeler</a></p>';
    typeset(view);
    grafikEtkilesim();
    var tb = document.getElementById("ts-tekrar-ekle"); if (tb) tb.addEventListener("click", function () { tekrarEkle(v, yanlislar); });
    api("GET", "/api/tam-sinav/gecmis").then(function (r) { var k = document.getElementById("ts-gecmis-grafik"); if (k) { k.innerHTML = gecmisGrafik(r.durum === 200 ? r.veri.gecmis : [], s); grafikEtkilesim(); } });
    if (ilk) acilis(s);
    var h = document.getElementById("ts-h1"); if (h) h.focus({ preventScroll: true });
  }
  function acilis(s) {
    var K = window.MeberraKutlama, ap = document.getElementById("ts-ap"), kp = document.getElementById("ts-kompozit");
    var bitis = function () { if (ap) ap.textContent = s.tahminiPuan; if (kp) kp.textContent = (Math.round(s.kompozit * 10) / 10).toLocaleString("tr-TR"); };
    if (!K || !K.sayiSay) { bitis(); return; }
    K.sayiSay(kp, Math.round(s.kompozit), { sure: 1200 }).then(function () {
      if (kp) kp.textContent = (Math.round(s.kompozit * 10) / 10).toLocaleString("tr-TR");
      return K.sayiSay(ap, s.tahminiPuan, { sure: 900 });
    }).then(function () {
      if (ap) { ap.textContent = s.tahminiPuan; ap.classList.add("is-acildi"); }
      duyur("Tahmini AP puanın " + s.tahminiPuan + ".");
      if (K.kutla) K.kutla({ tur: "deneme", buyuk: true, ifade: s.tahminiPuan >= 3 ? "sevincli" : "dusunceli", baslik: "Tam sınav bitti: tahmini " + s.tahminiPuan,
        metin: s.ad + " · bileşik " + (Math.round(s.kompozit * 10) / 10).toLocaleString("tr-TR") + " / 100. Yanlışlarını tekrar etmeyi unutma.",
        paylas: { baslik: "Tahmini AP puanım " + s.tahminiPuan, alt: s.ad + " tam sınav", yuzde: Math.round(s.kompozit) } });
    }).catch(bitis);
  }
  function karo(et, deger, alt) { return '<div class="dn-stat"><span class="dn-stat-label">' + esc(et) + '</span><span class="dn-stat-val">' + esc(deger) + '</span><span class="dn-note">' + esc(alt) + "</span></div>"; }
  /** 0–100 ölçek üzerinde eşikler ve bileşik puan (tek işaret) */
  function olcekHtml(s) {
    var es = s.esikler || [], x = Math.max(0, Math.min(100, s.kompozit));
    return '<div class="ts-olcek" role="img" aria-label="Bileşik puan ' + esc(s.kompozit) + "; eşikler " + es.map(function (e) { return e.puan + " için %" + e.min; }).join(", ") + '">' +
      '<div class="ts-olcek-iz">' + es.map(function (e) { return '<span class="ts-olcek-esik" style="left:' + e.min + '%"><span>' + e.puan + "</span></span>"; }).join("") +
      '<span class="ts-olcek-dolgu" style="transform:scaleX(' + (x / 100) + ')"></span><span class="ts-olcek-isaret" style="left:' + x + '%"></span></div>' +
      '<div class="ts-olcek-eksen" aria-hidden="true"><span>0</span><span>50</span><span>100</span></div></div>';
  }
  function bolumTablosu(s) {
    return '<details class="ts-tablo"><summary>Bölüm ayrıntıları</summary><div class="dn-table-wrap"><table class="dn-table"><thead><tr><th scope="col">Kısım</th><th scope="col">Soru</th><th scope="col">Süre</th><th scope="col">Kullanılan</th><th scope="col">Sonuç</th></tr></thead><tbody>' +
      s.bolumler.map(function (b) {
        return '<tr><th scope="row">' + esc(b.ad) + (b.kisaltilmis ? " <small>(kısaltılmış)</small>" : "") + "</th><td>" + b.soru + "</td><td>" + fmtDk(b.sureSn) + "</td><td>" + fmtSure(b.kullanilanSn) + (b.otomatik ? " <small>(süre doldu)</small>" : "") +
          "</td><td>" + (b.tur === "mcq" ? b.dogru + " / " + b.soru + " doğru" : "öz puan") + "</td></tr>";
      }).join("") + "</tbody></table></div></details>";
  }
  // --- grafikler: tek seri, ince çubuk (≤ 24 px), 4 px yuvarlak uç; metin metin renginde; ipucu + tablo görünümü ---
  function uniteGrafik(s) {
    var l = s.uniteler;
    if (!l.length) return '<p class="dn-note">Veri yok.</p>';
    return '<ul class="ts-cubuklar" role="list">' + l.map(function (u) {
      var et = /^\d+$/.test(u.unite) ? "Ünite " + u.unite : u.unite;
      return '<li class="ts-cubuk-satir" tabindex="0" data-ipucu="' + esc(et + " · " + u.ad + ": " + u.dogru + " / " + u.soru + " doğru (%" + u.yuzde + ")") + '">' +
        '<span class="ts-cubuk-ad"><strong>' + esc(et) + '</strong> <span class="dn-uname">' + esc(String(u.ad).replace(/^Micro · |^Macro · |^Skill Cat\. \d — /, "")) + "</span></span>" +
        '<span class="ts-cubuk-iz" aria-hidden="true"><span class="ts-cubuk" style="width:' + Math.max(1, u.yuzde) + '%"></span></span>' +
        '<span class="ts-cubuk-deger">%' + u.yuzde + " <small>(" + u.dogru + "/" + u.soru + ")</small></span></li>";
    }).join("") + "</ul>" +
      '<details class="ts-tablo"><summary>Tablo görünümü</summary><div class="dn-table-wrap"><table class="dn-table"><thead><tr><th scope="col">Ünite</th><th scope="col">Soru</th><th scope="col">Doğru</th><th scope="col">Yanlış</th><th scope="col">Boş</th><th scope="col">%</th></tr></thead><tbody>' +
      l.map(function (u) { return '<tr><th scope="row">' + esc(u.unite) + " · " + esc(u.ad) + "</th><td>" + u.soru + "</td><td>" + u.dogru + "</td><td>" + u.yanlis + "</td><td>" + u.bos + "</td><td>" + u.yuzde + "</td></tr>"; }).join("") +
      "</tbody></table></div></details>";
  }
  function zamanGrafik(s) {
    var l = s.zaman;
    if (!l.length) return '<p class="dn-note">Veri yok.</p>';
    var max = Math.max.apply(null, l.map(function (z) { return Math.max(z.sn, z.hedefSn * 2); }).concat([60]));
    var W = Math.max(320, l.length * 14), H = 160, pt = 8, pb = 20, cw = W / l.length, bw = Math.min(10, cw - 2);
    var y = function (v) { return pt + (H - pt - pb) * (1 - v / max); };
    var bolumAd = function (b) { return S.r && S.r.sinav ? S.r.sinav.bolumler[b].kod : b; };
    var bars = l.map(function (z, n) {
      var x = n * cw + (cw - bw) / 2, h = Math.max(1, H - pb - y(z.sn)), yy = H - pb - h;
      return '<rect class="ts-z-cubuk' + (z.uzun ? " is-uzun" : "") + '" x="' + x.toFixed(1) + '" y="' + yy.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2" tabindex="0" data-ipucu="' +
        esc("Kısım " + bolumAd(z.b) + " · Soru " + (z.i + 1) + ": " + fmtSure(z.sn) + " (tempo " + fmtSure(z.hedefSn) + ")" + (z.uzun ? " · uzun sürdü" : "") + " · " + (z.st === "dogru" ? "doğru" : z.st === "yanlis" ? "yanlış" : "boş")) + '"/>';
    }).join("");
    // Tempo çizgileri (kısım başına; ince, kesiksiz)
    var tempo = [], bas = 0;
    l.forEach(function (z, n) { if (n === l.length - 1 || l[n + 1].b !== z.b) { tempo.push('<line class="ts-z-tempo" x1="' + (bas * cw).toFixed(1) + '" x2="' + ((n + 1) * cw).toFixed(1) + '" y1="' + y(z.hedefSn).toFixed(1) + '" y2="' + y(z.hedefSn).toFixed(1) + '"/>'); bas = n + 1; } });
    var uzun = l.filter(function (z) { return z.uzun; }).sort(function (a, b) { return b.sn - a.sn; });
    var toplamUzun = uzun.reduce(function (a, z) { return a + z.sn; }, 0);
    return '<p class="ts-grafik-alt">Her çubuk bir soru; yatay çizgi kısmın temposu (süre ÷ soru). ' + IK.uyari + ' <span class="ts-z-anahtar"></span> Temponun 2 katından uzun süren soru.</p>' +
      '<div class="ts-z-kap"><svg class="ts-z-svg" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Soru başına süre grafiği; ' + uzun.length + ' soru tempodan çok uzun sürdü">' +
      '<line class="ts-z-taban" x1="0" x2="' + W + '" y1="' + (H - pb) + '" y2="' + (H - pb) + '"/>' + tempo.join("") + bars +
      '<text class="ts-z-eksen" x="' + (W - 2) + '" y="' + (pt + 4) + '" text-anchor="end">en çok ' + fmtSure(max) + "</text>" +
      '<text class="ts-z-eksen" x="2" y="' + (H - 4) + '">1</text><text class="ts-z-eksen" x="' + (W - 2) + '" y="' + (H - 4) + '" text-anchor="end">' + l.length + "</text></svg></div>" +
      (uzun.length ? '<p class="dn-note ts-uzun-not">' + IK.uyari + " <strong>" + uzun.length + " soruda</strong> çok zaman harcadın (toplam " + fmtSure(toplamUzun) + "): " +
        uzun.slice(0, 6).map(function (z) { return "Kısım " + esc(bolumAd(z.b)) + " soru " + (z.i + 1) + " (" + fmtSure(z.sn) + ")"; }).join(", ") + ". Gerçek sınavda takıldığın soruyu işaretleyip geçmek puan kazandırır.</p>"
        : '<p class="dn-note">Hiçbir soruda tempodan çok uzun kalmadın.</p>') +
      '<details class="ts-tablo"><summary>Tablo görünümü</summary><div class="dn-table-wrap"><table class="dn-table"><thead><tr><th scope="col">Kısım</th><th scope="col">Soru</th><th scope="col">Süre</th><th scope="col">Tempo</th><th scope="col">Sonuç</th></tr></thead><tbody>' +
      l.map(function (z) { return "<tr><td>" + esc(bolumAd(z.b)) + "</td><td>" + (z.i + 1) + "</td><td>" + fmtSure(z.sn) + (z.uzun ? " ⚠" : "") + "</td><td>" + fmtSure(z.hedefSn) + "</td><td>" + (z.st === "dogru" ? "doğru" : z.st === "yanlis" ? "yanlış" : "boş") + "</td></tr>"; }).join("") +
      "</tbody></table></div></details>";
  }
  function gecmisGrafik(g, s) {
    var l = (g || []).filter(function (x) { return x.kod === s.kod; }).slice(0, 12).reverse();
    if (l.length < 2) return '<p class="dn-note">Bu dersten ' + l.length + " tam sınavın var. İkinci sınavdan sonra gelişim grafiği burada görünür.</p>";
    var W = 560, H = 200, pl = 8, pr = 28, pt = 10, pb = 22, es = s.esikler || [];
    var x = function (n) { return pl + n * (W - pl - pr) / (l.length - 1); }, y = function (v) { return pt + (H - pt - pb) * (1 - v / 100); };
    var cizgi = l.map(function (r, n) { return x(n).toFixed(1) + "," + y(r.kompozit).toFixed(1); }).join(" ");
    return '<div class="ts-g-kap"><svg class="ts-g-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Bileşik puan gelişimi: ' + esc(l.map(function (r) { return r.kompozit; }).join(", ")) + '">' +
      es.map(function (e) { return '<line class="ts-g-esik" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(e.min).toFixed(1) + '" y2="' + y(e.min).toFixed(1) + '"/><text class="ts-z-eksen" x="' + (W - pr + 4) + '" y="' + (y(e.min) + 4).toFixed(1) + '">' + e.puan + "</text>"; }).join("") +
      '<polyline class="ts-g-cizgi" points="' + cizgi + '"/>' +
      l.map(function (r, n) { return '<circle class="ts-g-nokta" cx="' + x(n).toFixed(1) + '" cy="' + y(r.kompozit).toFixed(1) + '" r="5" tabindex="0" data-ipucu="' + esc(fmtTarih(r.tarih) + ": bileşik " + r.kompozit + " → tahmini " + r.tahminiPuan) + '"/>'; }).join("") +
      '<text class="ts-z-eksen" x="' + pl + '" y="' + (H - 4) + '">' + esc(fmtTarih(l[0].tarih)) + '</text><text class="ts-z-eksen" x="' + (W - pr) + '" y="' + (H - 4) + '" text-anchor="end">' + esc(fmtTarih(l[l.length - 1].tarih)) + "</text></svg></div>" +
      '<p class="ts-grafik-alt">Bileşik puan (0–100); yatay çizgiler tahmini 2–5 eşikleri.</p>' +
      '<details class="ts-tablo"><summary>Tablo görünümü</summary><div class="dn-table-wrap"><table class="dn-table"><thead><tr><th scope="col">Tarih</th><th scope="col">Bileşik</th><th scope="col">MCQ %</th><th scope="col">FRQ %</th><th scope="col">Tahmini AP</th></tr></thead><tbody>' +
      l.slice().reverse().map(function (r) { return "<tr><td>" + esc(fmtTarih(r.tarih)) + "</td><td>" + r.kompozit + "</td><td>" + (r.mcqYuzde == null ? "—" : r.mcqYuzde) + "</td><td>" + (r.frqYuzde == null ? "—" : r.frqYuzde) + "</td><td>" + r.tahminiPuan + "</td></tr>"; }).join("") +
      "</tbody></table></div></details>";
  }
  /** Tek ipucu kutusu: fare/odak ile [data-ipucu] öğelerinde (metin textContent ile yazılır) */
  var ipucu = null;
  function grafikEtkilesim() {
    if (!ipucu) {
      ipucu = document.createElement("div"); ipucu.className = "ts-ipucu"; ipucu.setAttribute("role", "tooltip"); ipucu.hidden = true; document.body.appendChild(ipucu);
      var goster = function (el, x, yy) { ipucu.textContent = el.getAttribute("data-ipucu"); ipucu.hidden = false; var w = ipucu.offsetWidth; ipucu.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x - w / 2)) + "px"; ipucu.style.top = (yy - ipucu.offsetHeight - 10 + window.scrollY) + "px"; };
      document.addEventListener("pointermove", function (e) { var el = e.target.closest && e.target.closest("[data-ipucu]"); if (el) goster(el, e.clientX, e.clientY); else ipucu.hidden = true; });
      document.addEventListener("focusin", function (e) { var el = e.target.closest && e.target.closest("[data-ipucu]"); if (el) { var b = el.getBoundingClientRect(); goster(el, b.left + b.width / 2, b.top); } else ipucu.hidden = true; });
    }
  }
  function yanlisHtml(v, x, n) {
    var q = v.icerik.sorular[x.k], c = v.cozumler[x.k];
    if (!q || !c) return "";
    var h = (c.hatalar || {})[x.s] || {}, bolum = S.r.sinav.bolumler[x.b];
    return '<details class="ts-yanlis"' + (n < 2 ? " open" : "") + '><summary><span class="dn-rev-st is-' + (x.st === "bos" ? "bos" : "yanlis") + '">' + (x.st === "bos" ? "Boş" : "Yanlış") + "</span> Kısım " + esc(bolum ? bolum.kod : x.b) + " · Soru " + (x.i + 1) +
      ' <span class="dn-uname">' + esc(metin(q.topic)) + "</span></summary>" +
      '<div class="dn-rev-body"><div class="question-body">' + q.question + "</div>" + skHtml(q.sekiller) +
      '<ul class="dn-rev-opts' + (skSecenekli(q.options) ? " sk-secenekli" : "") + '">' + q.options.map(function (o) {
        var dg = o.id === c.dogru, sn = o.id === x.s;
        return '<li class="' + (dg ? "is-dogru" : sn ? "is-yanlis" : "") + '"><strong>' + esc(o.id) + ".</strong> " + (o.text || "") + skHtml(o.sekil, true) + (dg ? " <em>— doğru cevap</em>" : sn ? " <em>— senin cevabın</em>" : "") + "</li>";
      }).join("") + "</ul>" +
      (x.s && h.errorTag ? '<p class="dn-rev-meta"><strong>Neden yanlış:</strong> ' + h.errorTag + (h.remediation ? " — " + h.remediation : "") + "</p>" : "") +
      (c.aciklama || c.sekiller ? '<div class="remediation-panel"><strong>Çözüm</strong>' + (c.aciklama || "") + skHtml(c.sekiller) + "</div>" : "") +
      (window.apEkHtml ? window.apEkHtml(c.ek) : "") +
      (c.genelHatirlatma ? '<p class="dn-rev-meta"><strong>Hatırlatma:</strong> ' + c.genelHatirlatma + "</p>" : "") +
      (q.sayfa ? '<p class="dn-rev-links"><a href="' + esc(sayfaAdres(q.sayfa)) + (q.kap ? "#" + esc(q.kap) : "") + '">Ders sayfasında konuya git</a></p>' : "") + "</div></details>";
  }
  /** Akıllı tekrar (apmeberra:tekrar:v1): oyun.js tekrarCevap(yanlış) ile kutu 1, yarın */
  function tekrarEkle(v, l) {
    var O = window.MEBERRA_OYUN, t = sget(TEKRAR_KEY, null), n = 0;
    if (!t || typeof t !== "object") t = {};
    var bugun = O && O.istGun ? O.istGun(Date.now()) : new Date().toISOString().slice(0, 10);
    l.forEach(function (x) {
      var q = v.icerik.sorular[x.k]; if (!q) return;
      var key = String(q.sayfa).replace(/\.html?$/i, "") + "|" + q.id;
      if (O && O.tekrarCevap) t = O.tekrarCevap(t, key, false, bugun, Date.now()).tekrar;
      else t[key] = { kutu: 1, sonraki: bugun, guncelleme: Date.now() };
      n++;
    });
    sset(TEKRAR_KEY, t);
    var b = document.getElementById("ts-tekrar-ekle"); if (b) { b.disabled = true; b.textContent = n + " soru tekrar listende"; }
    var nt = document.getElementById("ts-tekrar-not"); if (nt) nt.innerHTML = n + ' soru akıllı tekrara eklendi; yarından itibaren <a href="' + esc(sayfaAdres("ilerleme.html")) + '#tekrar">Bugünkü tekrar</a>da çıkar.';
    duyur(n + " soru akıllı tekrara eklendi.");
  }

  // ---------------- klavye ----------------
  document.addEventListener("keydown", function (e) {
    if (!S.r || !S.r.sinav || S.r.sinav.aktifBolum < 0 || !document.getElementById("ts-stage")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target; if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    var p = document.getElementById("ts-gozden-panel"); if (p && !p.hidden) { if (e.key === "Escape") p.hidden = true; return; }
    var up = (e.key || "").toUpperCase(), m = mcqVeri(), q = m.sorular[S.mevcut];
    if (/^[A-E]$/.test(up) && q && q.options.some(function (o) { return o.id === up; })) { e.preventDefault(); if (S.eleme) ele(up); else sec(up); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); git(S.mevcut + 1); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); git(S.mevcut - 1); return; }
    if (up === "M") { e.preventDefault(); isaretle(); return; }
    if (up === "X") { e.preventDefault(); elemeModu(); }
  });
  window.addEventListener("pagehide", function () { if (S.r && S.r.sinav && S.r.sinav.aktifBolum >= 0) { try { frqKaydet(); } catch (e) { /* */ } } });

  // ---------------- giriş noktası ----------------
  function baslat(kok, p) {
    if (view !== kok) { view = kok; view.addEventListener("input", frqGirdi); }
    canli = document.getElementById("dn-live");
    zamanDur();
    p = String(p || "1");
    if (/^ts-/.test(p)) yukle(p);
    else if (p && p !== "1") tanitim(p);
    else liste();
  }
  window.MeberraTamSinav = { baslat: baslat };
})();
