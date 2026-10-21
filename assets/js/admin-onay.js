/**
 * Meberra yönetici paneli — Soru bankası › "Onay kuyruğu" alt görünümü (v1.11.0)
 * Taslak sorular (tohumdan gelen yeni üretimler ya da panelde eklenen) burada tam önizlemeyle incelenir: MathJax'li kök, doğru şık işaretli
 * şıklar, yanlış şık başına hata açıklaması, adım adım çözüm, konu hatırlatması, zenginleştirme (ek), pasaj. Süzgeç: ders / istasyon / üretim.
 * Toplu: seçim + "Onayla" / "Reddet (neden)" (onaylı); tek soru: kart düğmeleri ya da klavye (j/k sonraki/önceki, a onayla, r reddet, x seç).
 * admin.js'e dokunmaz: Soru bankası paneli kurulunca (admin-soru-bankasi.js) panelin üstüne alt sekme şeridi ekler.
 * Ortak yardımcılar window.MEBERRA_ADMIN; düzenleyici ve MathJax window.MEBERRA_ADMIN_SB (duzenle, dizgile).
 * Uçlar: GET /api/admin/soru-bankasi/onay-kuyrugu, POST /api/admin/soru-bankasi/onayla { ids }, POST /api/admin/soru-bankasi/reddet { ids, neden }
 */
(function () {
  "use strict";
  var A = null, P = null, G = null;
  var BOYUT = 25;
  var HARF = ["A", "B", "C", "D", "E"];
  var ZOR = { easy: ["Kolay", "ok"], medium: ["Orta", "warn"], hard: ["Zor", "bad"] };
  var HM = { gerekli: "Gerekli", "yardımcı": "Yardımcı", gerekmez: "Gerekmez" };
  var ANAHTAR = "meberra:admin:sb-gorunum";
  var S = { f: { sayfa: "", kutu: "", uretim: "" }, sayfaNo: 1, istek: 0, veri: null, sorular: [], secili: {}, aktif: -1, oturum: { onay: 0, ret: 0 }, kalan: null, mesgul: false };

  function esc(v) { return A.esc(v); }
  function sayi(n) { return A.sayi(n); }
  function q(o) { return Object.keys(o).filter(function (k) { return o[k] !== "" && o[k] != null; }).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(o[k]); }).join("&"); }
  function $(s, k) { return (k || G).querySelector(s); }
  function $$(s, k) { return Array.prototype.slice.call((k || G).querySelectorAll(s)); }
  function cssKimlik(id) { return window.CSS && CSS.escape ? CSS.escape(id) : String(id).replace(/"/g, '\\"'); }
  function dizgile(el) { var sb = window.MEBERRA_ADMIN_SB; if (sb && sb.dizgile) sb.dizgile(el); }
  function oku() { try { return localStorage.getItem(ANAHTAR); } catch (e) { return null; } }
  function yaz(v) { try { localStorage.setItem(ANAHTAR, v); } catch (e) { /* özel pencere */ } }

  // =============================================================================== kurulum
  function bekle() {
    var panel = document.getElementById("panel-soru-bankasi");
    if (panel && panel.querySelector(".adm-sb-liste-gorunum") && window.MEBERRA_ADMIN) { kur(panel); return true; }
    return false;
  }
  function baslat() {
    if (bekle()) return;
    if (!window.MutationObserver) return;
    var mo = new MutationObserver(function () { if (bekle()) mo.disconnect(); });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function kur(panel) {
    if (panel.querySelector(".adm-ok-serit")) return;
    A = window.MEBERRA_ADMIN; P = panel;
    if (!document.querySelector('link[href*="admin-onay.css"]')) {
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "/assets/css/admin-onay.css?v=1110"; document.head.appendChild(l);
    }
    var serit = document.createElement("div");
    serit.className = "adm-ok-serit";
    serit.setAttribute("role", "group");
    serit.setAttribute("aria-label", "Soru bankası görünümü");
    serit.innerHTML = '<button type="button" class="adm-ok-alt" data-ok-gorunum="hepsi" aria-pressed="true">Tüm sorular</button>' +
      '<button type="button" class="adm-ok-alt" data-ok-gorunum="kuyruk" aria-pressed="false">Onay kuyruğu <span class="adm-sayac" id="adm-ok-sayac" hidden></span></button>';
    panel.insertBefore(serit, panel.firstChild);
    G = document.createElement("div");
    G.className = "adm-ok-gorunum";
    G.hidden = true;
    panel.appendChild(G);
    iskeletKur();
    serit.addEventListener("click", function (e) {
      var b = e.target.closest("[data-ok-gorunum]"); if (b) gorunum(b.getAttribute("data-ok-gorunum"), true);
    });
    // Sekme şeridindeki "Soru bankası" düğmesine de bekleyen taslak sayısı (rozet)
    var sekme = document.getElementById("sekme-soru-bankasi");
    if (sekme && !document.getElementById("adm-ok-sekme-sayac")) {
      var r = document.createElement("span"); r.className = "adm-sayac"; r.id = "adm-ok-sekme-sayac"; r.hidden = true;
      r.setAttribute("aria-label", "onay bekleyen soru");
      sekme.appendChild(document.createTextNode(" ")); sekme.appendChild(r);
    }
    sayacYukle();
    document.addEventListener("keydown", klavye);
    if (oku() === "kuyruk") gorunum("kuyruk", false);
  }

  function gorunum(ad, odak) {
    var kuyruk = ad === "kuyruk";
    P.classList.toggle("is-onay-kuyrugu", kuyruk);
    G.hidden = !kuyruk;
    $$("[data-ok-gorunum]", P).forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-ok-gorunum") === ad)); });
    yaz(ad);
    if (kuyruk && !S.veri) listeYukle();
    if (kuyruk && odak) { var h = $("#ok-baslik"); if (h) h.focus(); }
  }

  function sayacYaz(n) {
    S.kalan = n;
    [document.getElementById("adm-ok-sayac"), document.getElementById("adm-ok-sekme-sayac")].forEach(function (el) {
      if (!el) return; el.textContent = n > 999 ? "999+" : String(n); el.hidden = !(n > 0);
    });
    ilerlemeYaz();
  }
  function sayacYukle() {
    A.api("/api/admin/soru-bankasi/onay-kuyrugu?sayfaBoyu=1").then(function (v) { sayacYaz((v.sayilar && v.sayilar.toplam) || 0); }).catch(function () { /* rozet isteğe bağlı */ });
  }

  function iskeletKur() {
    G.innerHTML =
      '<div class="adm-panel-ust"><div><h2 id="ok-baslik" tabindex="-1">Onay kuyruğu</h2>' +
        '<p class="adm-ok-alt-baslik">Taslak sorular öğrenciye hiçbir yerde gitmez. Onaylanan soru öğrencilere açılır; reddedilen arşivlenir (silinmez, neden kaydedilir).</p></div>' +
        '<div class="adm-ok-ilerleme" aria-live="polite"><p class="adm-ok-ilerleme-metin" id="ok-ilerleme"></p><span class="adm-ok-cubuk" aria-hidden="true"><i id="ok-cubuk"></i></span></div></div>' +
      '<div class="adm-ok-dersler" id="ok-dersler" role="group" aria-label="Derse göre taslak sayıları"></div>' +
      '<form class="adm-arac adm-arac-genis adm-ok-arac" novalidate aria-label="Onay kuyruğu süzgeci">' +
        '<div class="field adm-field-dar"><label for="ok-sayfa">Ders</label><select id="ok-sayfa" class="text-input"><option value="">Tümü</option></select></div>' +
        '<div class="field adm-field-esnek"><label for="ok-kutu">Ünite / istasyon</label><select id="ok-kutu" class="text-input"><option value="">Tümü</option></select></div>' +
        '<div class="field adm-field-dar"><label for="ok-uretim">Üretim</label><select id="ok-uretim" class="text-input"><option value="">Tümü</option></select></div>' +
      "</form>" +
      '<div class="adm-ok-toplu" role="region" aria-label="Toplu işlem">' +
        '<label class="adm-check adm-ok-hepsi"><input type="checkbox" id="ok-hepsi"> <span>Sayfadakileri seç</span></label>' +
        '<span class="adm-ok-secim" id="ok-secim" aria-live="polite">Seçili yok</span>' +
        '<span class="adm-ok-toplu-eylem"><button type="button" class="btn-primary btn-sm" id="ok-onayla" disabled aria-expanded="false">Onayla</button>' +
        '<button type="button" class="btn-ghost btn-sm adm-ok-reddet" id="ok-reddet" disabled aria-expanded="false">Reddet…</button></span>' +
        '<p class="adm-ok-kisayol" aria-hidden="true"><kbd>j</kbd>/<kbd>k</kbd> sonraki/önceki · <kbd>a</kbd> onayla · <kbd>r</kbd> reddet · <kbd>x</kbd> seç</p>' +
      "</div>" +
      '<div class="adm-onay" id="ok-toplu-onay" hidden></div>' +
      '<div class="adm-ok-atlanan" id="ok-atlanan" role="status" hidden></div>' +
      '<p class="adm-sonuc" id="ok-ozet" aria-live="polite" tabindex="-1"></p>' +
      '<div class="adm-ok-liste" id="ok-liste"></div><div class="adm-ok-sayfa" id="ok-sayfala"></div>';

    $("#ok-sayfa").addEventListener("change", function () { S.f.sayfa = this.value; S.f.kutu = ""; kutuSecenekleri(); yenidenYukle(); });
    $("#ok-kutu").addEventListener("change", function () { S.f.kutu = this.value; yenidenYukle(); });
    $("#ok-uretim").addEventListener("change", function () { S.f.uretim = this.value; yenidenYukle(); });
    $(".adm-ok-arac").addEventListener("submit", function (e) { e.preventDefault(); });
    $("#ok-hepsi").addEventListener("change", function () {
      var ac = this.checked;
      S.sorular.forEach(function (x) { if (ac) S.secili[x.id] = true; else delete S.secili[x.id]; });
      $$("[data-ok-sec]").forEach(function (c) { c.checked = ac; c.closest(".adm-ok-kart").classList.toggle("is-secili", ac); });
      secimYaz();
    });
    $("#ok-onayla").addEventListener("click", function () { topluOnayla(this); });
    $("#ok-reddet").addEventListener("click", function () { topluReddet(this); });
    G.addEventListener("click", function (e) {
      var t;
      if (e.target.closest("[data-tekrar]")) { listeYukle(); return; }
      if ((t = e.target.closest("[data-ders-cip]"))) { S.f.sayfa = t.getAttribute("data-ders-cip"); S.f.kutu = ""; secenekleriKur(); yenidenYukle(); return; }
      if ((t = e.target.closest("[data-sayfa]")) && !t.disabled) { S.sayfaNo = Number(t.getAttribute("data-sayfa")); listeYukle().then(function () { $("#ok-ozet").focus(); }); return; }
      var kart = e.target.closest(".adm-ok-kart");
      if (!kart) return;
      var i = indeks(kart.getAttribute("data-ok-id"));
      if (e.target.closest("[data-ok-onayla]")) { aktifYap(i, false); tekOnayla(i); return; }
      if (e.target.closest("[data-ok-reddet]")) { aktifYap(i, false); tekReddet(i); return; }
      if (e.target.closest("[data-ok-duzenle]")) { duzenle(kart.getAttribute("data-ok-id")); return; }
      if (!e.target.closest("input, button, a, summary, label, .adm-onay")) aktifYap(i, false);
    });
    G.addEventListener("change", function (e) {
      var c = e.target.closest("[data-ok-sec]"); if (!c) return;
      if (c.checked) S.secili[c.value] = true; else delete S.secili[c.value];
      c.closest(".adm-ok-kart").classList.toggle("is-secili", c.checked);
      secimYaz();
    });
  }

  // =============================================================================== veri
  function yenidenYukle() { S.sayfaNo = 1; return listeYukle(); }
  function listeYukle() {
    var no = ++S.istek, kap = $("#ok-liste");
    kap.setAttribute("aria-busy", "true");
    if (!kap.querySelector(".adm-ok-kart")) kap.innerHTML = A.iskelet("cekmece"); else kap.classList.add("is-soluk");
    var sorgu = { sayfa: S.f.sayfa, kutu: S.f.kutu, uretim: S.f.uretim, sayfaNo: S.sayfaNo, sayfaBoyu: BOYUT };
    return A.api("/api/admin/soru-bankasi/onay-kuyrugu?" + q(sorgu)).then(function (v) {
      if (no !== S.istek) return;
      S.veri = v; S.sorular = Array.isArray(v.sorular) ? v.sorular : []; S.secili = {}; S.aktif = -1;
      // Son sayfa boşaldıysa (hepsi işlendi) bir önceki sayfaya dön
      if (!S.sorular.length && S.sayfaNo > 1 && v.toplam > 0) { S.sayfaNo = Math.max(1, Math.ceil(v.toplam / BOYUT)); return listeYukle(); }
      sayacYaz((v.sayilar && v.sayilar.toplam) || 0);
      secenekleriKur(); dersCipleri();
      ciz();
    }).catch(function (e) {
      if (no === S.istek) { kap.innerHTML = A.hataKutusu(e.message); $("#ok-sayfala").innerHTML = ""; }
    }).then(function () { kap.removeAttribute("aria-busy"); kap.classList.remove("is-soluk"); });
  }

  function sayfaAd(s) { return A.dersAd(s) + ""; }
  function kutuAd(k) { return (k.unite_no != null ? "Ü" + k.unite_no + " · " : "") + (k.baslik || k.kutu || "—"); }
  function secenekleriKur() {
    var say = (S.veri && S.veri.sayilar) || {};
    $("#ok-sayfa").innerHTML = '<option value="">Tümü (' + sayi(say.toplam || 0) + ")</option>" + (say.sayfa || []).map(function (s) {
      return '<option value="' + esc(s.sayfa) + '"' + (s.sayfa === S.f.sayfa ? " selected" : "") + ">" + esc(sayfaAd(s.sayfa)) + " (" + sayi(s.n) + ")</option>";
    }).join("");
    kutuSecenekleri();
    $("#ok-uretim").innerHTML = '<option value="">Tümü</option>' + (say.uretim || []).map(function (u) {
      var d = u.uretim == null ? "" : String(u.uretim);
      return d ? '<option value="' + esc(d) + '"' + (d === S.f.uretim ? " selected" : "") + ">" + esc(d) + " (" + sayi(u.n) + ")</option>" : "";
    }).join("");
  }
  function kutuSecenekleri() {
    var l = ((S.veri && S.veri.sayilar && S.veri.sayilar.kutu) || []).filter(function (k) { return !S.f.sayfa || k.sayfa === S.f.sayfa; });
    var sec = $("#ok-kutu");
    sec.innerHTML = '<option value="">Tümü</option>' + l.map(function (k) {
      return '<option value="' + esc(k.kutu) + '"' + (k.kutu === S.f.kutu ? " selected" : "") + ">" + esc((S.f.sayfa ? "" : sayfaAd(k.sayfa) + " · ") + A.kisalt(kutuAd(k), 60)) +
        " (" + sayi(k.n) + ")" + (k.yeniKutu ? " · Yeni istasyon" : "") + "</option>";
    }).join("");
    sec.disabled = !l.length;
  }
  function dersCipleri() {
    var say = (S.veri && S.veri.sayilar) || {};
    $("#ok-dersler").innerHTML = '<button type="button" class="adm-ok-cip" data-ders-cip="" aria-pressed="' + (!S.f.sayfa) + '">Tümü <b>' + sayi(say.toplam || 0) + "</b></button>" +
      (say.sayfa || []).map(function (s) {
        return '<button type="button" class="adm-ok-cip" data-ders-cip="' + esc(s.sayfa) + '" aria-pressed="' + (s.sayfa === S.f.sayfa) + '">' + esc(sayfaAd(s.sayfa)) + " <b>" + sayi(s.n) + "</b></button>";
      }).join("");
  }

  // =============================================================================== çizim
  function yerMetni(x) {
    return x.tur === "seviye" ? "Seviye · " + (x.ders || "") + " · Unit " + (x.unite || "?") : sayfaAd(x.sayfa) + " · Ü" + (x.unite_no == null ? "?" : x.unite_no) + " · " + (x.kutu_baslik || x.kutu || "");
  }
  function yeniKutuMu(x) {
    return ((S.veri.sayilar && S.veri.sayilar.kutu) || []).some(function (k) { return k.kutu === x.kutu && k.sayfa === x.sayfa && k.yeniKutu; });
  }
  function ekHtml(ek) {
    ek = ek || {};
    var satir = function (ad, v, sinif) { return v == null || v === "" ? "" : '<div class="' + (sinif || "") + '"><dt>' + esc(ad) + "</dt><dd>" + v + "</dd></div>"; };
    var hm = ek.hesapMakinesiDurum || (typeof ek.hesapMakinesi === "string" ? ek.hesapMakinesi : ek.hesapMakinesi === true ? "gerekli" : "");
    var h = satir("Kavram", ek.kavram) + satir("İpucu", ek.ipucu) + satir("Sık hata", ek.sikHata) +
      satir("Hesap makinesi", hm ? esc(HM[hm] || hm) : "") + satir("CED konusu", ek.cedKonu ? esc(ek.cedKonu) : "", "is-ic") +
      satir("Zorluk önerisi", ek.zorlukOnerisi ? esc(ek.zorlukOnerisi) : "", "is-ic") + satir("Üretim", ek.uretim ? esc(ek.uretim) : "", "is-ic");
    return h ? '<section class="adm-ok-blok adm-ok-ek-kap" aria-label="Zenginleştirme"><h4>Zenginleştirme <span class="adm-alt">(öğrenci cevaptan sonra görür; gri olanlar iç alan)</span></h4><dl class="adm-ok-ek">' + h + "</dl></section>" : "";
  }
  function kartHtml(x, i) {
    var z = ZOR[x.zorluk] || [x.zorluk || "—", "notr"];
    var hata = x.hata_aciklamalari || {};
    var pas = x.pasaj && S.veri.pasajlar ? S.veri.pasajlar[x.pasaj] : null;
    var bid = "ok-k-" + i;
    return '<article class="adm-ok-kart' + (S.secili[x.id] ? " is-secili" : "") + '" data-ok-id="' + esc(x.id) + '" tabindex="-1" aria-labelledby="' + bid + '">' +
      '<header class="adm-ok-kart-ust">' +
        '<label class="adm-ok-sec"><input type="checkbox" data-ok-sec value="' + esc(x.id) + '"' + (S.secili[x.id] ? " checked" : "") + '><span class="visually-hidden">' + esc(x.id) + " sorusunu seç</span></label>" +
        '<div class="adm-ok-kimlik"><span class="adm-ok-sira" aria-hidden="true">' + (A.sayfaBilgisi(S.veri.toplam, S.sayfaNo, BOYUT, 0).ilk + i) + '</span><code id="' + bid + '">' + esc(x.id) + "</code>" +
          '<span class="adm-ok-yer">' + esc(yerMetni(x)) + "</span></div>" +
        '<div class="adm-rozetler">' + A.rozet(z[0], z[1]) + (yeniKutuMu(x) ? A.rozet("Yeni istasyon", "mor") : "") + (x.pasaj ? A.rozet("Pasajlı", "info") : "") + "</div>" +
      "</header>" +
      (x.konu ? '<p class="adm-ok-konu">' + x.konu + "</p>" : "") +
      (pas ? '<details class="adm-ok-pasaj"><summary>' + esc(pas.baslik || x.pasaj) + '</summary><div class="adm-ok-pasaj-ic" lang="en">' + (pas.html || "") + "</div></details>" : "") +
      '<div class="adm-ok-kok">' + (x.govde || "") + "</div>" +
      '<ol class="adm-ok-siklar" aria-label="Şıklar">' + (x.secenekler || []).map(function (o) {
        var d = o.id === x.dogru, h = hata[o.id];
        return '<li class="' + (d ? "is-dogru" : "") + '"><span class="adm-ok-harf" aria-hidden="true">' + esc(o.id) + '</span><div class="adm-ok-sik-ic"><span class="visually-hidden">Şık ' + esc(o.id) + (d ? " (doğru)" : "") + ": </span>" +
          '<div class="adm-ok-sik-metin">' + (o.text || "") + "</div>" +
          (d ? '<span class="adm-ok-dogru-isaret">✓ Doğru cevap</span>'
            : h ? '<div class="adm-ok-hata"><strong>' + (h.etiket || "Hata") + "</strong>" + (h.aciklama ? " " + h.aciklama : "") + "</div>"
            : '<div class="adm-ok-hata is-eksik">Bu şık için hata açıklaması yok.</div>') +
          "</div></li>";
      }).join("") + "</ol>" +
      '<section class="adm-ok-blok"><h4>Adım adım çözüm</h4><div class="adm-ok-metin">' + (x.aciklama || '<span class="adm-alt">—</span>') + "</div></section>" +
      (x.genel_hatirlatma ? '<section class="adm-ok-blok"><h4>Konu hatırlatması</h4><div class="adm-ok-metin">' + x.genel_hatirlatma + "</div></section>" : "") +
      ekHtml(x.ek) +
      '<p class="adm-ok-kaynak adm-alt">' + esc(x.kaynak || "") + (x.surum ? " · v" + esc(x.surum) : "") + "</p>" +
      '<footer class="adm-ok-eylem">' +
        '<button type="button" class="btn-primary btn-sm" data-ok-onayla>Onayla <kbd aria-hidden="true">a</kbd></button>' +
        '<button type="button" class="btn-ghost btn-sm adm-ok-reddet" data-ok-reddet aria-expanded="false">Reddet… <kbd aria-hidden="true">r</kbd></button>' +
        '<button type="button" class="btn-ghost btn-sm" data-ok-duzenle>Düzenle</button>' +
      "</footer>" +
      '<div class="adm-onay" data-ok-onay hidden></div>' +
      "</article>";
  }
  function ciz() {
    var v = S.veri, kap = $("#ok-liste");
    var b = A.sayfaBilgisi(v.toplam, S.sayfaNo, BOYUT, S.sorular.length);
    $("#ok-ozet").textContent = v.toplam ? sayi(v.toplam) + " taslak bu süzgeçte · sayfa " + b.sayfa + " / " + b.sayfaSayisi : "";
    $("#ok-hepsi").checked = false;
    if (!S.sorular.length) {
      kap.innerHTML = A.bos(S.f.sayfa || S.f.kutu || S.f.uretim ? "Bu süzgece uyan taslak kalmadı. Süzgeci temizleyip diğerlerine bak." : "Bekleyen taslak soru yok. Yeni üretimler tohumla gelince burada görünür.", "Kuyruk boş", "ok");
      $("#ok-sayfala").innerHTML = ""; secimYaz(); return;
    }
    kap.innerHTML = S.sorular.map(kartHtml).join("");
    $("#ok-sayfala").innerHTML = A.sayfalamaHtml(b, "Onay kuyruğu sayfaları", "taslak");
    secimYaz();
    dizgile(kap);
  }

  // =============================================================================== seçim + ilerleme
  function seciliIdler() { return S.sorular.filter(function (x) { return S.secili[x.id]; }).map(function (x) { return x.id; }); }
  function secimYaz() {
    var n = seciliIdler().length, top = S.sorular.length;
    $("#ok-secim").textContent = n ? n + " soru seçili" : "Seçili yok";
    $("#ok-onayla").disabled = !n || S.mesgul; $("#ok-reddet").disabled = !n || S.mesgul;
    $("#ok-onayla").textContent = n ? "Onayla (" + n + ")" : "Onayla";
    $("#ok-reddet").textContent = n ? "Reddet… (" + n + ")" : "Reddet…";
    var h = $("#ok-hepsi"); h.checked = !!top && n === top; h.indeterminate = n > 0 && n < top; h.disabled = !top;
  }
  function ilerlemeYaz() {
    if (!G) return;
    var m = $("#ok-ilerleme"), c = $("#ok-cubuk");
    if (!m) return;
    var yapilan = S.oturum.onay + S.oturum.ret, kalan = S.kalan || 0;
    m.innerHTML = yapilan ? "Bu oturumda <b>" + sayi(S.oturum.onay) + "</b> onaylandı · <b>" + sayi(S.oturum.ret) + "</b> reddedildi · kalan <b>" + sayi(kalan) + "</b>"
      : "<b>" + sayi(kalan) + "</b> soru onay bekliyor";
    c.style.width = (yapilan + kalan ? Math.round(yapilan / (yapilan + kalan) * 100) : 0) + "%";
  }

  // =============================================================================== klavye
  function indeks(id) { for (var i = 0; i < S.sorular.length; i++) if (S.sorular[i].id === id) return i; return -1; }
  function kartEl(i) { var x = S.sorular[i]; return x ? $('.adm-ok-kart[data-ok-id="' + cssKimlik(x.id) + '"]') : null; }
  function aktifYap(i, kaydir) {
    if (i < 0 || i >= S.sorular.length) return;
    $$(".adm-ok-kart.is-aktif").forEach(function (k) { k.classList.remove("is-aktif"); });
    S.aktif = i;
    var k = kartEl(i); if (!k) return;
    k.classList.add("is-aktif");
    if (kaydir) { k.focus({ preventScroll: true }); k.scrollIntoView({ block: "start", behavior: hareketAz() ? "auto" : "smooth" }); }
  }
  function hareketAz() { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function klavye(e) {
    if (!G || G.hidden || !P || P.hidden || S.mesgul) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && ((/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && t.type !== "checkbox") || t.isContentEditable)) return;
    if (t && t.closest && t.closest(".adm-onay:not([hidden])")) return;
    if (!S.sorular.length) return;
    var k = e.key;
    if (k === "j" || k === "k") { e.preventDefault(); aktifYap(S.aktif < 0 ? 0 : Math.max(0, Math.min(S.sorular.length - 1, S.aktif + (k === "j" ? 1 : -1))), true); return; }
    if (S.aktif < 0) { if (k === "a" || k === "r" || k === "x") { e.preventDefault(); aktifYap(0, true); } return; }
    if (k === "a") { e.preventDefault(); tekOnayla(S.aktif); }
    else if (k === "r") { e.preventDefault(); tekReddet(S.aktif); }
    else if (k === "x") {
      e.preventDefault();
      var c = $("[data-ok-sec]", kartEl(S.aktif)); if (!c) return;
      c.checked = !c.checked; c.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // =============================================================================== işlemler
  function atlananYaz(l) {
    var el = $("#ok-atlanan");
    if (!l || !l.length) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    el.innerHTML = '<p><strong>' + l.length + " soru atlandı</strong> (başka biri işlemiş ya da artık taslak değil):</p><ul>" +
      l.slice(0, 20).map(function (x) { return "<li><code>" + esc(x.id) + "</code> — " + esc(x.neden) + "</li>"; }).join("") + (l.length > 20 ? "<li>…</li>" : "") + "</ul>";
  }
  /** İşlenen kartları animasyonla kaldırır; sayfa boşalırsa yeniden yükler. */
  function kaldir(ids, sonrakiOdak) {
    var set = {}; ids.forEach(function (id) { set[id] = true; delete S.secili[id]; });
    var eskiAktif = S.aktif;
    var els = ids.map(function (id) { return $('.adm-ok-kart[data-ok-id="' + cssKimlik(id) + '"]'); }).filter(Boolean);
    S.sorular = S.sorular.filter(function (x) { return !set[x.id]; });
    S.veri.toplam = Math.max(0, (S.veri.toplam || 0) - ids.length);
    var bitir = function () {
      els.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
      secimYaz();
      if (!S.sorular.length) { listeYukle(); return; }
      var b = A.sayfaBilgisi(S.veri.toplam, S.sayfaNo, BOYUT, S.sorular.length);
      $("#ok-ozet").textContent = sayi(S.veri.toplam) + " taslak bu süzgeçte · sayfa " + b.sayfa + " / " + b.sayfaSayisi;
      $$(".adm-ok-sira").forEach(function (s, i) { s.textContent = b.ilk + i; });
      if (sonrakiOdak) { S.aktif = -1; aktifYap(Math.min(Math.max(eskiAktif, 0), S.sorular.length - 1), true); }
    };
    if (hareketAz() || !els.length || !els[0].animate) { bitir(); return; }
    var kalan = els.length;
    els.forEach(function (el) {
      el.style.overflow = "hidden";
      var a = el.animate([{ height: el.offsetHeight + "px", opacity: 1 }, { height: "0px", opacity: 0, paddingTop: "0px", paddingBottom: "0px", marginTop: "0px", marginBottom: "0px" }],
        { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
      a.onfinish = function () { if (--kalan === 0) bitir(); };
    });
  }
  function islemSonrasi(tur, v, ids, tek) {
    var n = tur === "onay" ? v.onaylanan : v.reddedilen;
    if (tur === "onay") S.oturum.onay += n; else S.oturum.ret += n;
    sayacYaz(Math.max(0, (S.kalan || 0) - n));
    atlananYaz(v.atlanan);
    A.bildir((tur === "onay" ? n + " soru onaylandı; öğrencilere açıldı." : n + " soru reddedildi ve arşivlendi.") + (v.atlanan && v.atlanan.length ? " " + v.atlanan.length + " soru atlandı." : ""), n ? "ok" : "info");
    kaldir(ids, tek);
    // Süzgeç sayıları (ders / istasyon / üretim) arka planda tazelenir; liste yerinde kalır
    A.api("/api/admin/soru-bankasi/onay-kuyrugu?sayfaBoyu=1").then(function (x) {
      if (!S.veri) return;
      S.veri.sayilar = x.sayilar; sayacYaz((x.sayilar && x.sayilar.toplam) || 0); secenekleriKur(); dersCipleri();
    }).catch(function () { /* sayılar sonraki yüklemede */ });
  }
  function mesgul(v) { S.mesgul = v; G.classList.toggle("is-mesgul", v); secimYaz(); }
  function tekOnayla(i) {
    var x = S.sorular[i]; if (!x || S.mesgul) return;
    var kart = kartEl(i), b = kart && $("[data-ok-onayla]", kart);
    if (b) { b.disabled = true; b.textContent = "Onaylanıyor…"; }
    mesgul(true);
    A.api("/api/admin/soru-bankasi/onayla", "POST", { ids: [x.id] }).then(function (v) { mesgul(false); islemSonrasi("onay", v, [x.id], true); }, function (e) {
      mesgul(false);
      if (b) { b.disabled = false; b.innerHTML = 'Onayla <kbd aria-hidden="true">a</kbd>'; }
      A.bildir(e.message || "Onaylanamadı.", "bad");
    });
  }
  function nedenKontrol(n) { if (String(n || "").trim().length < 3) throw new Error("Ret nedenini yaz (en az 3 karakter)."); return String(n).trim(); }
  function tekReddet(i) {
    var x = S.sorular[i]; if (!x || S.mesgul) return;
    var kart = kartEl(i); if (!kart) return;
    var kap = $("[data-ok-onay]", kart), tetik = $("[data-ok-reddet]", kart);
    A.onayAc(kap, tetik, {
      baslik: x.id + " reddedilsin mi?", metin: "Soru arşivlenir (silinmez); neden geçmişe ve soru kaydına yazılır.", notEtiketi: "Ret nedeni (zorunlu, en az 3 karakter)",
      onayMetni: "Reddet", tehlike: true,
      onayla: function (not) {
        var neden = nedenKontrol(not);
        mesgul(true);
        return A.api("/api/admin/soru-bankasi/reddet", "POST", { ids: [x.id], neden: neden }).then(function (v) { mesgul(false); islemSonrasi("ret", v, [x.id], true); }, function (e) { mesgul(false); throw e; });
      }
    });
    var ta = $("textarea", kap); if (ta) { ta.focus(); ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("[data-evet]", kap).click(); } }); }
  }
  function topluOnayla(tetik) {
    var ids = seciliIdler(); if (!ids.length) return;
    A.onayAc($("#ok-toplu-onay"), tetik, {
      baslik: ids.length + " soru onaylansın mı?", metin: "Onaylanan sorular hemen öğrencilere açılır (ders sayfası, deneme havuzu). Her soru yeni sürüm olarak kaydedilir.",
      onayMetni: "Onayla (" + ids.length + ")",
      onayla: function () {
        mesgul(true);
        return A.api("/api/admin/soru-bankasi/onayla", "POST", { ids: ids }).then(function (v) { mesgul(false); islemSonrasi("onay", v, ids, false); }, function (e) { mesgul(false); throw e; });
      }
    });
  }
  function topluReddet(tetik) {
    var ids = seciliIdler(); if (!ids.length) return;
    A.onayAc($("#ok-toplu-onay"), tetik, {
      baslik: ids.length + " soru reddedilsin mi?", metin: "Sorular arşivlenir (silinmez); neden her sorunun geçmişine yazılır.", notEtiketi: "Ret nedeni (zorunlu, en az 3 karakter)",
      onayMetni: "Reddet (" + ids.length + ")", tehlike: true,
      onayla: function (not) {
        var neden = nedenKontrol(not);
        mesgul(true);
        return A.api("/api/admin/soru-bankasi/reddet", "POST", { ids: ids, neden: neden }).then(function (v) { mesgul(false); islemSonrasi("ret", v, ids, false); }, function (e) { mesgul(false); throw e; });
      }
    });
  }
  function duzenle(id) {
    var sb = window.MEBERRA_ADMIN_SB;
    if (!sb || !sb.duzenle) return;
    gorunum("hepsi", false);
    S.veri = null; // düzenleyiciden dönünce kuyruk tazelenir
    sb.duzenle(id);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", baslat); else baslat();
})();
