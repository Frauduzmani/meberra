/**
 * Meberra yönetici paneli — "Soru bankası" sekmesi (v1.5.0)
 * Sorular veritabanında (questions_bank). Liste: sayfa/ünite/durum/zorluk/arama süzgeci, soru başına cevap sayısı ve doğru
 * oranı (answers tablosundan; en az 5 cevapta %25'in altı ya da %95'in üstü "şüpheli"). Düzenleme: canlı önizleme (MathJax),
 * kök, şıklar, tek doğru şık, çözüm, yanlış şık başına hata açıklaması; doğrulama (2–5 şık, tam bir doğru); kaydetmek yeni
 * sürüm yazar (geçmiş + fark + geri yükleme); yeni soru; arşiv (silme yok); JSON dışa aktarma. Hepsi sunucuda denetim kaydına yazılır.
 * admin.js ortak yardımcıları window.MEBERRA_ADMIN ile verir; bu dosya window.MEBERRA_ADMIN_SB = { kur, ac } tanımlar.
 * Uçlar: GET /api/admin/soru-bankasi(/meta | /soru/:id | /soru/:id/gecmis | /disa-aktar), PUT /soru/:id, POST /soru, /soru/:id/arsiv, /soru/:id/geri-yukle
 */
(function () {
  "use strict";
  var A = null, P = null;
  var HARF = ["A", "B", "C", "D", "E"];
  var ZOR = { easy: "Kolay", medium: "Orta", hard: "Zor" };
  var DUR = { aktif: "Aktif", taslak: "Taslak", arsiv: "Arşiv" };
  var DUR_TON = { aktif: "ok", taslak: "warn", arsiv: "notr" };
  var TUR = { ders: "Ders sayfası", seviye: "Seviye testi", vitrin: "Vitrin (herkese açık demo)" };
  var ALAN_AD = { govde: "Soru kökü", secenekler: "Şıklar", dogru: "Doğru şık", aciklama: "Çözüm", genel_hatirlatma: "Konu hatırlatması", hata_aciklamalari: "Hata açıklamaları",
    konu: "Konu", kaynak: "Kaynak", zorluk: "Zorluk", durum: "Durum", unite: "Ünite", kutu: "İstasyon", sayfa: "Sayfa", numara: "Numara", sira: "Sıra", deneme_kodlari: "Deneme kodları", ek: "Ek" };
  var S = { meta: null, f: { tur: "ders", sayfa: "", unite: "", durum: "", zorluk: "", q: "", supheli: false, sirala: "", sayfaNo: 1 }, istek: 0, secili: null, onizZaman: null };

  var $ = function (s, k) { return (k || P).querySelector(s); };
  function esc(v) { return A.esc(v); }
  function q(o) { return Object.keys(o).filter(function (k) { return o[k] !== "" && o[k] != null && o[k] !== false; }).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(o[k] === true ? "1" : o[k]); }).join("&"); }

  // ---- MathJax (önizleme): sayfada yoksa CDN'den tembel yüklenir (CSP: cdn.jsdelivr.net izinli) ----
  var mjSoz = null;
  function mathjax() {
    if (window.MathJax && window.MathJax.typesetPromise) return Promise.resolve(window.MathJax);
    if (mjSoz) return mjSoz;
    mjSoz = new Promise(function (coz) {
      window.MathJax = { tex: { inlineMath: [["$", "$"], ["\\(", "\\)"]], displayMath: [["$$", "$$"], ["\\[", "\\]"]] }, svg: { fontCache: "global" },
        startup: { ready: function () { window.MathJax.startup.defaultReady(); window.MathJax.startup.promise.then(function () { coz(window.MathJax); }); } } };
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"; s.async = true; s.id = "MathJax-script";
      s.onerror = function () { coz(null); };
      document.head.appendChild(s);
    });
    return mjSoz;
  }
  function dizgile(el) { mathjax().then(function (mj) { if (mj && el && document.body.contains(el)) mj.typesetPromise([el]).catch(function () {}); }); }

  // =============================================================================== kabuk
  function kur(panel) {
    A = window.MEBERRA_ADMIN; P = panel;
    if (!A || !P) return;
    P.innerHTML =
      '<div class="adm-sb-liste-gorunum">' +
        '<div class="adm-panel-ust"><h2>Soru bankası</h2><div class="adm-eylem">' +
          '<button type="button" class="btn-primary btn-sm" data-sb-yeni>' + A.ikon("arti") + "Yeni soru</button>" +
          '<a class="btn-ghost btn-sm" id="sb-disa" href="/api/admin/soru-bankasi/disa-aktar" download>JSON dışa aktar</a></div></div>' +
        '<p class="adm-ipucu">Sorular, doğru şıklar ve çözümler yalnız veritabanında; öğrenciye üyeliğine göre sunucu verir. Kaydetmek yeni sürüm oluşturur (geçmişten geri yüklenebilir); soru silinmez, arşivlenir. ' +
          "Doğru oranı ders sayfasındaki cevaplardan hesaplanır; en az 5 cevapta %25'in altı ya da %95'in üstü <strong>şüpheli</strong> işaretlenir (yanlış anahtar ya da çok kolay soru olabilir).</p>" +
        '<form class="adm-arac adm-arac-genis adm-sb-arac" role="search" aria-label="Soru bankasında ara" novalidate>' +
          '<div class="field adm-field-dar"><label for="sb-tur">Tür</label><select id="sb-tur" class="text-input"><option value="ders">Ders sayfası</option><option value="seviye">Seviye testi</option><option value="vitrin">Vitrin</option><option value="">Tümü</option></select></div>' +
          '<div class="field adm-field-dar"><label for="sb-sayfa">Sayfa / ders</label><select id="sb-sayfa" class="text-input"><option value="">Tümü</option></select></div>' +
          '<div class="field adm-field-dar"><label for="sb-unite">Ünite</label><select id="sb-unite" class="text-input"><option value="">Tümü</option></select></div>' +
          '<div class="field adm-field-dar"><label for="sb-durum">Durum</label><select id="sb-durum" class="text-input"><option value="">Tümü</option><option value="aktif">Aktif</option><option value="taslak">Taslak</option><option value="arsiv">Arşiv</option></select></div>' +
          '<div class="field adm-field-dar"><label for="sb-zorluk">Zorluk</label><select id="sb-zorluk" class="text-input"><option value="">Tümü</option><option value="easy">Kolay</option><option value="medium">Orta</option><option value="hard">Zor</option></select></div>' +
          '<div class="field adm-field-esnek"><label for="sb-q">Ara (kimlik, kök, konu, kaynak)</label><input type="search" id="sb-q" class="text-input" maxlength="100" autocomplete="off"></div>' +
          '<div class="field adm-field-dar"><label for="sb-sirala">Sırala</label><select id="sb-sirala" class="text-input"><option value="">Sayfa sırası</option><option value="cevap">Cevap sayısı</option><option value="oran">Doğru oranı (düşük önce)</option><option value="guncelleme">Son güncelleme</option><option value="id">Kimlik</option></select></div>' +
          '<label class="adm-check adm-sb-supheli"><input type="checkbox" id="sb-supheli"> Yalnız şüpheli</label>' +
          '<div class="adm-eylem adm-eylem-alt"><button type="submit" class="btn-primary">Uygula</button></div>' +
        "</form>" +
        '<p class="adm-sonuc" id="sb-ozet" aria-live="polite" tabindex="-1"></p>' +
        '<div class="adm-sb-liste"></div><div class="adm-sb-sayfa"></div>' +
      "</div>" +
      '<div class="adm-detay adm-sb-detay" hidden></div>';
    var f = $(".adm-sb-arac");
    $("#sb-tur").addEventListener("change", function () { S.f.tur = this.value; S.f.sayfa = ""; S.f.unite = ""; secenekleriKur(); });
    $("#sb-sayfa").addEventListener("change", function () { S.f.sayfa = this.value; S.f.unite = ""; uniteSecenekleri(); });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      S.f.tur = $("#sb-tur").value; S.f.sayfa = $("#sb-sayfa").value; S.f.unite = $("#sb-unite").value; S.f.durum = $("#sb-durum").value;
      S.f.zorluk = $("#sb-zorluk").value; S.f.q = $("#sb-q").value.trim(); S.f.sirala = $("#sb-sirala").value; S.f.supheli = $("#sb-supheli").checked; S.f.sayfaNo = 1;
      listeYukle();
    });
    var lg = $(".adm-sb-liste-gorunum");
    lg.addEventListener("click", function (e) {
      if (e.target.closest("[data-tekrar]")) { if (S.meta) listeYukle(); else ac(); return; }
      if (e.target.closest("[data-sb-yeni]")) { yeniAc(); return; }
      var sb = e.target.closest("[data-sayfa]");
      if (sb && !sb.disabled) { S.f.sayfaNo = Number(sb.getAttribute("data-sayfa")); listeYukle().then(function () { $("#sb-ozet").focus(); }); return; }
      var tr = e.target.closest("[data-sb-soru]");
      if (tr) detayAc(tr.getAttribute("data-sb-soru"));
    });
    lg.addEventListener("keydown", function (e) {
      var tr = e.target.closest("[data-sb-soru]");
      if (tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); detayAc(tr.getAttribute("data-sb-soru")); }
    });
  }

  function ac() {
    if (!P) return;
    if (S.meta) { if (!S.secili) listeYukle(); return; }
    $(".adm-sb-liste").innerHTML = A.iskelet("tablo", 8);
    A.api("/api/admin/soru-bankasi/meta").then(function (m) {
      S.meta = m;
      secenekleriKur();
      return listeYukle();
    }).catch(function (e) { $(".adm-sb-liste").innerHTML = A.hataKutusu(e.message); });
  }

  // Sayfa/ders seçenekleri (tür'e göre), ünite seçenekleri (sayfa'ya göre)
  function sayfalar(tur) {
    var gor = {}, out = [];
    (S.meta.kutular || []).forEach(function (k) {
      if (tur && k.tur !== tur) return;
      var anahtar = k.tur === "seviye" ? "ders:" + k.ders : k.sayfa;
      if (gor[anahtar]) return; gor[anahtar] = 1;
      out.push({ deger: anahtar, ad: k.tur === "seviye" ? "Seviye · " + k.ders : k.tur === "vitrin" ? "Vitrin" : A.dersAd(k.sayfa) + " (" + k.sayfa + ")" });
    });
    return out;
  }
  function secenekleriKur() {
    $("#sb-tur").value = S.f.tur;
    $("#sb-sayfa").innerHTML = '<option value="">Tümü</option>' + sayfalar(S.f.tur).map(function (s) { return '<option value="' + esc(s.deger) + '"' + (s.deger === S.f.sayfa ? " selected" : "") + ">" + esc(s.ad) + "</option>"; }).join("");
    uniteSecenekleri();
  }
  function uniteSecenekleri() {
    var sec = $("#sb-unite"), l = [];
    if (/^ders:/.test(S.f.sayfa)) {
      l = ((S.meta.seviyeUniteler || {})[S.f.sayfa.slice(5)] || []).map(function (u) { return { deger: u, ad: "Unit " + u }; });
    } else if (S.f.sayfa) {
      var gor = {};
      (S.meta.kutular || []).forEach(function (k) {
        if (k.sayfa !== S.f.sayfa || k.tur !== "ders" || k.unite_no == null || gor[k.unite_no]) return;
        gor[k.unite_no] = 1;
        l.push({ deger: String(k.unite_no), ad: "Ünite " + k.unite_no + " · " + (k.baslik || k.kutu) });
      });
    }
    sec.innerHTML = '<option value="">Tümü</option>' + l.map(function (u) { return '<option value="' + esc(u.deger) + '"' + (u.deger === S.f.unite ? " selected" : "") + ">" + esc(A.kisalt(u.ad, 60)) + "</option>"; }).join("");
    sec.disabled = !l.length;
  }

  function oranHucre(ist) {
    if (!ist || !ist.cevap) return '<span class="adm-alt">—</span>';
    return '<span class="adm-sb-oran' + (ist.supheli ? " is-supheli" : "") + '">%' + esc(String(ist.dogruOran).replace(".", ",")) + "</span>" + (ist.supheli ? " " + A.rozet("Şüpheli", "bad") : "");
  }
  function duzMetin(h) { var d = document.createElement("div"); d.innerHTML = String(h || ""); return (d.textContent || "").replace(/\s+/g, " ").trim(); }

  function listeYukle() {
    var kap = $(".adm-sb-liste"), say = $(".adm-sb-sayfa"), oz = $("#sb-ozet");
    var no = ++S.istek;
    var f = S.f, sorgu = { tur: f.tur, durum: f.durum, zorluk: f.zorluk, q: f.q, sirala: f.sirala, supheli: f.supheli, sayfaNo: f.sayfaNo };
    if (/^ders:/.test(f.sayfa)) sorgu.ders = f.sayfa.slice(5); else sorgu.sayfa = f.sayfa;
    sorgu.unite = f.unite;
    $("#sb-disa").setAttribute("href", "/api/admin/soru-bankasi/disa-aktar?" + q({ tur: f.tur, sayfa: /^ders:/.test(f.sayfa) ? "" : f.sayfa }));
    kap.setAttribute("aria-busy", "true");
    if (!kap.querySelector("table")) kap.innerHTML = A.iskelet("tablo", 8); else kap.classList.add("is-soluk");
    return A.api("/api/admin/soru-bankasi?" + q(sorgu)).then(function (v) {
      if (no !== S.istek) return;
      var l = Array.isArray(v.sorular) ? v.sorular : [];
      var b = A.sayfaBilgisi(v.toplam, v.sayfa, v.sayfaBoyu || 50, l.length);
      var sup = l.filter(function (x) { return x.istatistik && x.istatistik.supheli; }).length;
      oz.textContent = A.sayi(b.toplam) + " soru" + (sup ? " · bu sayfada " + sup + " şüpheli" : "") + " · düzenlemek için satıra tıkla.";
      if (!l.length) { kap.innerHTML = A.bos("Bu süzgece uyan soru yok."); say.innerHTML = ""; return; }
      kap.innerHTML = '<div class="adm-tablo-kap"><table class="adm-tablo adm-sb-tablo"><caption class="visually-hidden">Soru bankası, sayfa ' + esc(b.sayfa) + "</caption>" +
        '<thead><tr><th scope="col">Kimlik</th><th scope="col">Yer</th><th scope="col">Soru</th><th scope="col">Zorluk</th><th scope="col">Durum</th><th scope="col">Doğru</th>' +
        '<th scope="col" class="adm-sag">Cevap</th><th scope="col">Doğru oranı</th><th scope="col" class="adm-sag">Sürüm</th></tr></thead><tbody>' +
        l.map(function (x) {
          var yer = x.tur === "seviye" ? "Seviye · " + x.ders + " · Unit " + x.unite : x.tur === "vitrin" ? "Vitrin" : x.sayfa + " · Ü" + (x.unite_no == null ? "?" : x.unite_no) + " · " + (x.kutu || "");
          return '<tr data-sb-soru="' + esc(x.id) + '" tabindex="0" class="' + (x.istatistik && x.istatistik.supheli ? "is-supheli" : "") + '" aria-label="' + esc(x.id) + ' sorusunu düzenle">' +
            '<td class="adm-nowrap"><code>' + esc(x.id) + "</code></td><td>" + esc(A.kisalt(yer, 48)) + "</td>" +
            '<td><span class="adm-sb-konu">' + esc(A.kisalt(duzMetin(x.konu), 40)) + "</span><br>" + esc(A.kisalt(duzMetin(x.govde), 90)) + "</td>" +
            "<td>" + esc(ZOR[x.zorluk] || x.zorluk || "—") + "</td><td>" + A.rozet(DUR[x.durum] || x.durum, DUR_TON[x.durum]) + "</td>" +
            '<td class="adm-nowrap"><strong>' + esc(x.dogru) + "</strong></td>" +
            '<td class="adm-sag">' + A.sayi(x.istatistik ? x.istatistik.cevap : 0) + "</td><td>" + oranHucre(x.istatistik) + '</td><td class="adm-sag">v' + esc(x.surum) + "</td></tr>";
        }).join("") + "</tbody></table></div>";
      say.innerHTML = A.sayfalamaHtml(b, "Soru bankası sayfaları", "soru");
    }).catch(function (e) {
      if (no === S.istek) { kap.innerHTML = A.hataKutusu(e.message); say.innerHTML = ""; }
    }).then(function () { kap.removeAttribute("aria-busy"); kap.classList.remove("is-soluk"); });
  }

  // =============================================================================== düzenleyici
  function detayGoster() {
    $(".adm-sb-liste-gorunum").hidden = true;
    var d = $(".adm-sb-detay"); d.hidden = false;
    return d;
  }
  function detayKapat() {
    var id = S.secili && S.secili.id;
    S.secili = null;
    var d = $(".adm-sb-detay"); d.hidden = true; d.innerHTML = "";
    $(".adm-sb-liste-gorunum").hidden = false;
    listeYukle().then(function () {
      var tr = id ? P.querySelector('[data-sb-soru="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]') : null;
      if (tr) tr.focus(); else $("#sb-q").focus();
    });
  }
  var UST = '<div class="adm-detay-ust"><button type="button" class="btn-ghost" data-sb-geri>‹ Listeye dön</button></div>';

  function detayAc(id) {
    var d = detayGoster();
    S.secili = { id: id };
    d.innerHTML = UST + A.iskelet("cekmece");
    $("[data-sb-geri]", d).addEventListener("click", detayKapat);
    $("[data-sb-geri]", d).focus();
    return A.api("/api/admin/soru-bankasi/soru/" + encodeURIComponent(id)).then(function (v) {
      if (!S.secili || S.secili.id !== id) return;
      S.secili = { id: id, soru: v.soru, gecmis: v.gecmis || [], secim: v.secimDagilimi || [] };
      editorCiz(d, v.soru, false);
    }).catch(function (e) { d.innerHTML = UST + A.hataKutusu(e.message); $("[data-sb-geri]", d).addEventListener("click", detayKapat); });
  }

  function yeniAc() {
    var d = detayGoster();
    var kutu = (S.meta.kutular || []).filter(function (k) { return k.tur === "ders" && (!S.f.sayfa || k.sayfa === S.f.sayfa); })[0] || (S.meta.kutular || [])[0] || {};
    S.secili = { id: null, yeni: true };
    editorCiz(d, { tur: "ders", sayfa: kutu.sayfa, kutu: kutu.kutu, govde: "", secenekler: [{ id: "A", text: "" }, { id: "B", text: "" }, { id: "C", text: "" }, { id: "D", text: "" }],
      dogru: "", aciklama: "", genel_hatirlatma: "", hata_aciklamalari: {}, konu: "", kaynak: "Meberra original", zorluk: "medium", durum: "taslak" }, true);
  }

  function istatistikHtml(s, secim) {
    var ist = s.istatistik || {};
    if (!ist.cevap) return '<p class="adm-alt">Henüz ders sayfasında cevap yok.</p>';
    var toplam = secim.reduce(function (a, x) { return a + x.n; }, 0) || 1;
    return '<dl class="adm-dl adm-sb-ist"><div><dt>Cevap</dt><dd>' + A.sayi(ist.cevap) + "</dd></div><div><dt>Doğru oranı</dt><dd>" + oranHucre(ist) + "</dd></div></dl>" +
      (ist.supheli ? '<p class="adm-uyari-not">' + A.ikon("uyari") + "Bu sorunun doğru oranı olağan dışı. Doğru şık işaretini ve şıkları kontrol et.</p>" : "") +
      '<ul class="adm-sb-dagilim" aria-label="Şık seçim dağılımı">' + HARF.filter(function (h) { return (s.secenekler || []).some(function (o) { return o.id === h; }); }).map(function (h) {
        var n = (secim.filter(function (x) { return x.secim === h; })[0] || {}).n || 0, y = Math.round(n / toplam * 100);
        return '<li class="' + (h === s.dogru ? "is-dogru" : "") + '"><span>' + h + (h === s.dogru ? " ✓" : "") + '</span><span class="adm-sb-cubuk"><i style="width:' + y + '%"></i></span><span>' + n + " (%" + y + ")</span></li>";
      }).join("") + "</ul>";
  }

  function secenekSatiri(o, dogru, hata, i, n) {
    var h = hata[o.id] || {};
    return '<fieldset class="adm-sb-sik" data-sik="' + i + '"><legend class="visually-hidden">Şık ' + HARF[i] + "</legend>" +
      '<div class="adm-sb-sik-ust"><label class="adm-sb-dogru"><input type="radio" name="sb-dogru" value="' + HARF[i] + '"' + (dogru === HARF[i] ? " checked" : "") + "> Doğru</label>" +
      '<span class="adm-sb-harf" aria-hidden="true">' + HARF[i] + "</span>" +
      '<button type="button" class="btn-ghost btn-sm" data-sik-sil="' + i + '"' + (n <= 2 ? " disabled" : "") + ' aria-label="' + HARF[i] + ' şıkkını kaldır">Kaldır</button></div>' +
      '<div class="field"><label for="sb-sik-' + i + '">Şık ' + HARF[i] + " metni</label><textarea id=\"sb-sik-" + i + '" class="text-input" rows="2" data-sik-metin>' + esc(o.text) + "</textarea></div>" +
      '<div class="adm-sb-hata"' + (dogru === HARF[i] ? " hidden" : "") + '><div class="field"><label for="sb-et-' + i + '">Hata etiketi (bu şıkkı seçene)</label><input id="sb-et-' + i + '" class="text-input" data-sik-etiket maxlength="1000" value="' + esc(h.etiket || "") + '"></div>' +
      '<div class="field"><label for="sb-ha-' + i + '">Hata açıklaması / konu hatırlatması</label><textarea id="sb-ha-' + i + '" class="text-input" rows="2" data-sik-aciklama>' + esc(h.aciklama || "") + "</textarea></div></div>" +
      "</fieldset>";
  }

  function editorCiz(d, s, yeni) {
    var secenekler = (s.secenekler || []).map(function (o) { return { id: o.id, text: o.text }; });
    var hata = JSON.parse(JSON.stringify(s.hata_aciklamalari || {}));
    var baslik = yeni ? "Yeni soru" : s.id + " · sürüm " + s.surum;
    var konum = yeni ? "" : (s.tur === "seviye" ? "Seviye testi · " + s.ders + " · Unit " + s.unite : s.tur === "vitrin" ? "Vitrin demo sorusu (herkese açık)" : s.sayfa + " · Ünite " + s.unite_no + " · " + s.kutu + (s.kutu_baslik ? " (" + s.kutu_baslik + ")" : ""));
    var yer = "";
    if (yeni) {
      var kutular = (S.meta.kutular || []).filter(function (k) { return k.tur === "ders"; });
      var dersler = Object.keys(S.meta.seviyeUniteler || {});
      yer = '<section class="surface" aria-labelledby="sb-yer-b"><h3 id="sb-yer-b">Yer</h3><div class="adm-form-satir">' +
        '<div class="field"><label for="sb-y-tur">Tür</label><select id="sb-y-tur" class="text-input"><option value="ders">Ders sayfası</option><option value="seviye">Seviye testi</option></select></div>' +
        '<div class="field" data-y-ders><label for="sb-y-kutu">Soru istasyonu</label><select id="sb-y-kutu" class="text-input">' + kutular.map(function (k) {
          return '<option value="' + esc(k.sayfa + "|" + k.kutu) + '"' + (k.kutu === s.kutu ? " selected" : "") + ">" + esc(k.sayfa + " · Ü" + k.unite_no + " · " + A.kisalt(k.baslik || k.kutu, 50)) + "</option>"; }).join("") + "</select></div>" +
        '<div class="field" data-y-seviye hidden><label for="sb-y-sders">Seviye testi dersi</label><select id="sb-y-sders" class="text-input">' + dersler.map(function (x) { return '<option value="' + esc(x) + '">' + esc(x) + "</option>"; }).join("") + "</select></div>" +
        '<div class="field" data-y-seviye hidden><label for="sb-y-sunite">Ünite</label><select id="sb-y-sunite" class="text-input"></select></div>' +
        '<div class="field"><label for="sb-y-id">Kimlik (isteğe bağlı)</label><input id="sb-y-id" class="text-input" maxlength="60" placeholder="boş: otomatik" pattern="[a-z0-9_]{3,60}"><p class="field-hint">Küçük harf, rakam, _ · sonradan değişmez</p></div>' +
        "</div></section>";
    }
    d.innerHTML = UST +
      '<header class="surface adm-kisi"><div class="adm-kisi-ust"><h2 id="sb-baslik" tabindex="-1">' + esc(baslik) + "</h2>" +
        (yeni ? "" : A.rozet(DUR[s.durum] || s.durum, DUR_TON[s.durum]) + " " + A.rozet(TUR[s.tur] || s.tur, "mor")) + "</div>" +
        (konum ? '<p class="adm-alt">' + esc(konum) + (s.guncelleme ? " · son güncelleme " + esc(A.tarih(s.guncelleme)) : "") + "</p>" : "") + "</header>" +
      (yeni ? "" : '<section class="surface" aria-labelledby="sb-ist-b"><h3 id="sb-ist-b">İstatistik</h3>' + istatistikHtml(s, S.secili.secim || []) + "</section>") +
      yer +
      '<div class="adm-sb-duzen">' +
        '<form class="surface adm-sb-form" novalidate aria-labelledby="sb-form-b"><h3 id="sb-form-b">' + (yeni ? "İçerik" : "Düzenle") + "</h3>" +
          '<div class="field"><label for="sb-govde">Soru kökü (HTML + LaTeX: $…$)</label><textarea id="sb-govde" class="text-input adm-kod-alan" rows="6" data-alan="govde">' + esc(s.govde) + '</textarea><p class="field-error" data-hata="govde" hidden></p></div>' +
          '<div class="adm-sb-siklar" aria-describedby="sb-sik-ipucu"></div>' +
          '<p class="field-hint" id="sb-sik-ipucu">2–5 şık; tam olarak bir doğru şık işaretle. Yanlış şıklar için hata etiketi ve açıklaması öğrenciye o şıkkı seçince gösterilir.</p>' +
          '<p class="field-error" data-hata="secenekler" hidden></p><p class="field-error" data-hata="dogru" hidden></p><p class="field-error" data-hata="hata_aciklamalari" hidden></p>' +
          '<div class="adm-eylem"><button type="button" class="btn-ghost btn-sm" data-sik-ekle>' + A.ikon("arti") + "Şık ekle</button></div>" +
          '<div class="field"><label for="sb-aciklama">Adım adım çözüm</label><textarea id="sb-aciklama" class="text-input adm-kod-alan" rows="5" data-alan="aciklama">' + esc(s.aciklama) + '</textarea><p class="field-error" data-hata="aciklama" hidden></p></div>' +
          '<div class="field"><label for="sb-genel">Konu hatırlatması (genel)</label><textarea id="sb-genel" class="text-input adm-kod-alan" rows="3" data-alan="genel_hatirlatma">' + esc(s.genel_hatirlatma) + '</textarea><p class="field-error" data-hata="genel_hatirlatma" hidden></p></div>' +
          '<div class="adm-form-satir">' +
            '<div class="field"><label for="sb-konu">' + (s.tur === "seviye" ? "Beceri" : "Konu") + '</label><input id="sb-konu" class="text-input" maxlength="500" value="' + esc(s.konu) + '"></div>' +
            '<div class="field"><label for="sb-kaynak">Kaynak</label><input id="sb-kaynak" class="text-input" maxlength="300" value="' + esc(s.kaynak) + '"></div>' +
            '<div class="field"><label for="sb-zor">Zorluk</label><select id="sb-zor" class="text-input">' + ["easy", "medium", "hard"].map(function (z) { return '<option value="' + z + '"' + (z === s.zorluk ? " selected" : "") + ">" + ZOR[z] + "</option>"; }).join("") + '</select><p class="field-error" data-hata="zorluk" hidden></p></div>' +
            '<div class="field"><label for="sb-dur">Durum</label><select id="sb-dur" class="text-input">' + ["aktif", "taslak", "arsiv"].map(function (z) { return '<option value="' + z + '"' + (z === s.durum ? " selected" : "") + ">" + DUR[z] + "</option>"; }).join("") + "</select></div>" +
          "</div>" +
          (yeni ? "" : '<div class="field"><label for="sb-not">Değişiklik notu (geçmişte görünür, isteğe bağlı)</label><input id="sb-not" class="text-input" maxlength="300"></div>') +
          '<p class="field-error" id="sb-genel-hata" role="alert" hidden></p>' +
          '<div class="adm-eylem"><button type="submit" class="btn-primary">' + (yeni ? "Soruyu ekle" : "Kaydet (yeni sürüm)") + "</button>" +
            (yeni ? "" : '<button type="button" class="btn-ghost" data-sb-arsiv aria-expanded="false">' + (s.durum === "arsiv" ? "Arşivden çıkar" : "Arşivle") + "</button>") + "</div>" +
          '<div class="adm-onay" data-sb-onay hidden></div>' +
        "</form>" +
        '<aside class="surface adm-sb-oniz" aria-labelledby="sb-oniz-b"><h3 id="sb-oniz-b">Önizleme (öğrencinin göreceği)</h3><div class="adm-sb-oniz-ic" aria-live="off"></div></aside>' +
      "</div>" +
      (yeni ? "" : '<section class="surface" aria-labelledby="sb-gec-b"><h3 id="sb-gec-b">Sürüm geçmişi</h3><div class="adm-sb-gecmis"></div></section>');

    var form = $(".adm-sb-form", d), siklar = $(".adm-sb-siklar", d);
    function siklariCiz() {
      siklar.innerHTML = secenekler.map(function (o, i) { return secenekSatiri(o, form.dataset.dogru || "", hata, i, secenekler.length); }).join("");
      $("[data-sik-ekle]", d).disabled = secenekler.length >= 5;
    }
    form.dataset.dogru = s.dogru || "";
    function okuSiklar() {
      siklar.querySelectorAll("[data-sik]").forEach(function (fs) {
        var i = Number(fs.getAttribute("data-sik")), L = HARF[i];
        secenekler[i] = { id: L, text: fs.querySelector("[data-sik-metin]").value };
        var et = fs.querySelector("[data-sik-etiket]").value.trim(), ac = fs.querySelector("[data-sik-aciklama]").value.trim();
        if (et || ac) hata[L] = { etiket: et, aciklama: ac }; else delete hata[L];
      });
    }
    siklariCiz();
    siklar.addEventListener("change", function (e) {
      if (e.target.name === "sb-dogru") { form.dataset.dogru = e.target.value; okuSiklar(); siklariCiz(); var r = siklar.querySelector('input[value="' + e.target.value + '"]'); if (r) r.focus(); onizle(); }
    });
    siklar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-sik-sil]"); if (!b || b.disabled) return;
      okuSiklar();
      var i = Number(b.getAttribute("data-sik-sil")), silinen = HARF[i];
      // Harfler yeniden sıralanır (A, B, C…): doğru şık ve hata açıklamaları da kaydırılır
      var yeniHata = {}, dogru = form.dataset.dogru;
      secenekler.splice(i, 1);
      secenekler.forEach(function (o, j) { var eski = o.id; o.id = HARF[j]; if (hata[eski]) yeniHata[HARF[j]] = hata[eski]; if (dogru === eski) form.dataset.dogru = HARF[j]; });
      if (dogru === silinen) form.dataset.dogru = "";
      hata = yeniHata;
      siklariCiz(); onizle();
    });
    $("[data-sik-ekle]", d).addEventListener("click", function () {
      okuSiklar();
      if (secenekler.length >= 5) return;
      secenekler.push({ id: HARF[secenekler.length], text: "" });
      siklariCiz();
      var t = siklar.querySelector('[data-sik="' + (secenekler.length - 1) + '"] [data-sik-metin]'); if (t) t.focus();
    });

    // Canlı önizleme (400 ms bekleyerek; MathJax dizgisi)
    var oniz = $(".adm-sb-oniz-ic", d);
    function onizle() {
      clearTimeout(S.onizZaman);
      S.onizZaman = setTimeout(function () {
        okuSiklar();
        var dogru = form.dataset.dogru;
        oniz.innerHTML = '<article class="question-card adm-sb-kart"><div class="question-header"><div class="question-head-main"><span class="question-num-badge">Soru</span><span class="question-topic">' + esc($("#sb-konu", d).value) + "</span></div>" +
          '<div class="question-tags"><span class="question-tag ' + esc($("#sb-zor", d).value) + '">' + esc(ZOR[$("#sb-zor", d).value] || "") + "</span></div></div>" +
          '<div class="question-body">' + $("#sb-govde", d).value + "</div>" +
          '<div class="options-container">' + secenekler.map(function (o) {
            return '<div class="option-btn' + (o.id === dogru ? " correct" : "") + '"><span class="option-letter">' + o.id + "</span><span>" + o.text + "</span>" + (o.id === dogru ? '<span class="option-mark">Doğru cevap</span>' : "") + "</div>";
          }).join("") + "</div>" +
          '<div class="feedback-box correct-box" style="display:block"><div class="solution-panel"><div class="solution-title">Adım adım çözüm</div><div class="solution-steps">' + $("#sb-aciklama", d).value + "</div></div>" +
          ($("#sb-genel", d).value ? '<div class="remediation-panel"><div class="remediation-title">Konu hatırlatması</div><div class="remediation-text">' + $("#sb-genel", d).value + "</div></div>" : "") +
          secenekler.filter(function (o) { return o.id !== dogru && hata[o.id]; }).map(function (o) {
            return '<div class="remediation-panel"><div class="remediation-title">' + o.id + " seçilirse: " + esc(hata[o.id].etiket || "") + '</div><div class="remediation-text">' + (hata[o.id].aciklama || "") + "</div></div>";
          }).join("") + "</div></article>";
        dizgile(oniz);
      }, 400);
    }
    form.addEventListener("input", onizle);
    form.addEventListener("change", function (e) { if (e.target.id === "sb-zor") onizle(); });
    onizle();

    if (yeni) {
      var tur = $("#sb-y-tur", d), sders = $("#sb-y-sders", d), sunite = $("#sb-y-sunite", d);
      var suniteKur = function () { sunite.innerHTML = ((S.meta.seviyeUniteler || {})[sders.value] || []).map(function (u) { return '<option value="' + esc(u) + '">Unit ' + esc(u) + "</option>"; }).join(""); };
      tur.addEventListener("change", function () {
        var sv = tur.value === "seviye";
        d.querySelectorAll("[data-y-ders]").forEach(function (x) { x.hidden = sv; });
        d.querySelectorAll("[data-y-seviye]").forEach(function (x) { x.hidden = !sv; });
        $('label[for="sb-konu"]', d).textContent = sv ? "Beceri" : "Konu";
      });
      sders.addEventListener("change", suniteKur);
      suniteKur();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      okuSiklar();
      form.querySelectorAll("[data-hata]").forEach(function (x) { x.hidden = true; x.textContent = ""; });
      var genelHata = $("#sb-genel-hata", d); genelHata.hidden = true;
      var dogru = form.dataset.dogru;
      // İstemci doğrulaması (sunucu da aynısını yapar)
      var yerel = {};
      if (!$("#sb-govde", d).value.trim()) yerel.govde = "Soru kökünü yaz.";
      if (secenekler.length < 2 || secenekler.length > 5) yerel.secenekler = "2 ile 5 arasında şık olmalı.";
      else if (secenekler.some(function (o) { return !String(o.text).trim(); })) yerel.secenekler = "Boş şık bırakma.";
      // Büyük/küçük harfe duyarlı (sunucuyla aynı): yalnız harfle ayrılan şıklar (ör. t / T) bilinçli çeldirici olabilir
      else if (new Set(secenekler.map(function (o) { return String(o.text).trim().replace(/\s+/g, " "); })).size !== secenekler.length) yerel.secenekler = "Aynı metinli iki şık olamaz.";
      if (!dogru || !secenekler.some(function (o) { return o.id === dogru; })) yerel.dogru = "Tam olarak bir doğru şık işaretle.";
      if (Object.keys(yerel).length) { hatalariGoster(yerel); return; }
      var hb = {}; secenekler.forEach(function (o) { if (o.id !== dogru && hata[o.id]) hb[o.id] = hata[o.id]; });
      var govde = { govde: $("#sb-govde", d).value, secenekler: secenekler.map(function (o) { return { text: o.text }; }), dogru: dogru, aciklama: $("#sb-aciklama", d).value,
        genel_hatirlatma: $("#sb-genel", d).value, hata_aciklamalari: hb, konu: $("#sb-konu", d).value, kaynak: $("#sb-kaynak", d).value, zorluk: $("#sb-zor", d).value, durum: $("#sb-dur", d).value };
      var dugme = form.querySelector('button[type="submit"]'); dugme.disabled = true;
      var istek;
      if (yeni) {
        var tr = $("#sb-y-tur", d).value;
        govde.tur = tr; govde.id = $("#sb-y-id", d).value.trim();
        if (tr === "seviye") { govde.ders = $("#sb-y-sders", d).value; govde.unite = $("#sb-y-sunite", d).value; }
        else { var p = $("#sb-y-kutu", d).value.split("|"); govde.sayfa = p[0]; govde.kutu = p[1]; }
        istek = A.api("/api/admin/soru-bankasi/soru", "POST", govde);
      } else {
        govde.surum = s.surum; govde.not = $("#sb-not", d).value.trim();
        istek = A.api("/api/admin/soru-bankasi/soru/" + encodeURIComponent(s.id), "PUT", govde);
      }
      istek.then(function (v) {
        dugme.disabled = false;
        if (yeni) { A.bildir("Soru eklendi: " + v.id + (govde.durum === "aktif" ? " (öğrencilere açık)" : " (taslak; öğrenci görmez)"), "ok"); S.meta = null; ac(); detayAc(v.id); return; }
        A.bildir(v.degisti ? "Kaydedildi: sürüm " + v.surum + " (" + v.fark.map(function (k) { return ALAN_AD[k] || k; }).join(", ") + ")." : "Değişiklik yok; sürüm aynı kaldı.", v.degisti ? "ok" : "info");
        detayAc(s.id);
      }, function (err) {
        dugme.disabled = false;
        if (err.veri && err.veri.errors) hatalariGoster(err.veri.errors);
        genelHata.textContent = err.message + (err.durum === 409 ? " (Sayfadaki sürüm eski.)" : "");
        genelHata.hidden = false;
      });
    });
    function hatalariGoster(e) {
      Object.keys(e).forEach(function (k) { var el = form.querySelector('[data-hata="' + k + '"]'); if (el) { el.textContent = e[k]; el.hidden = false; } });
      var ilk = form.querySelector("[data-hata]:not([hidden])");
      if (ilk) ilk.scrollIntoView({ block: "center" });
    }

    var arsiv = $("[data-sb-arsiv]", d);
    if (arsiv) arsiv.addEventListener("click", function () {
      var geri = s.durum === "arsiv";
      A.onayAc($("[data-sb-onay]", d), arsiv, {
        baslik: geri ? "Soru arşivden çıkarılsın mı?" : "Soru arşivlensin mi?",
        metin: geri ? "Soru yeniden aktif olur ve öğrencilere görünür." : "Soru öğrencilere ve denemelere artık gelmez; silinmez, geçmişi korunur ve geri alınabilir.",
        onayMetni: geri ? "Arşivden çıkar" : "Arşivle", tehlike: !geri,
        onayla: function () {
          return A.api("/api/admin/soru-bankasi/soru/" + encodeURIComponent(s.id) + "/arsiv", "POST", geri ? { geriAl: true } : {}).then(function () {
            A.bildir(geri ? "Soru arşivden çıkarıldı." : "Soru arşivlendi.", "ok"); detayAc(s.id);
          });
        }
      });
    });

    if (!yeni) gecmisCiz($(".adm-sb-gecmis", d), s);
    var h = $("#sb-baslik", d); if (h) h.focus();
    $("[data-sb-geri]", d).addEventListener("click", detayKapat);
  }

  function degerMetni(k, v) {
    if (k === "secenekler") return (v || []).map(function (o) { return o.id + ") " + o.text; }).join("\n");
    if (k === "hata_aciklamalari") return Object.keys(v || {}).map(function (h) { return h + ": " + (v[h].etiket || "") + " — " + (v[h].aciklama || ""); }).join("\n");
    if (v && typeof v === "object") return JSON.stringify(v);
    return v == null ? "" : String(v);
  }
  function gecmisCiz(kap, s) {
    var g = (S.secili && S.secili.gecmis) || [];
    if (!g.length) { kap.innerHTML = A.bos("Henüz eski sürüm yok. İlk kaydetmede bu sürüm geçmişe yazılır."); return; }
    // Her eski sürümü kendisinden sonraki (daha yeni) hâlle karşılaştır
    kap.innerHTML = '<ol class="adm-sb-surumler">' + g.map(function (x, i) {
      var sonraki = i === 0 ? s : g[i - 1].veri;
      var fark = (x.fark || []).map(function (k) {
        return '<div class="adm-sb-fark"><p class="adm-sb-fark-ad">' + esc(ALAN_AD[k] || k) + '</p><div class="adm-sb-fark-iki"><pre class="is-eski" aria-label="Önce">' + esc(degerMetni(k, x.veri[k])) +
          '</pre><pre class="is-yeni" aria-label="Sonra">' + esc(degerMetni(k, sonraki[k])) + "</pre></div></div>";
      }).join("");
      return '<li class="adm-sb-surum"><div class="adm-sb-surum-ust"><strong>v' + esc(x.surum) + "</strong> <span>" + esc(A.tarih(x.zaman)) + " · " + esc(x.degistiren || "—") + "</span>" +
        (x.not ? ' <span class="adm-alt">“' + esc(x.not) + "”</span>" : "") +
        '<span class="adm-cip-grup">' + (x.fark || []).map(function (k) { return '<span class="adm-cip">' + esc(ALAN_AD[k] || k) + "</span>"; }).join("") + "</span></div>" +
        '<details class="adm-ayrinti"><summary>Farkı göster (v' + esc(x.surum) + " → " + (i === 0 ? "güncel" : "v" + esc(g[i - 1].surum)) + ")</summary>" + fark + "</details>" +
        '<div class="adm-eylem"><button type="button" class="btn-ghost btn-sm" data-sb-geri-yukle="' + esc(x.surum) + '" aria-expanded="false">Bu sürümü geri yükle</button></div><div class="adm-onay" hidden></div></li>';
    }).join("") + "</ol>";
    kap.addEventListener("click", function (e) {
      var b = e.target.closest("[data-sb-geri-yukle]"); if (!b) return;
      var sv = Number(b.getAttribute("data-sb-geri-yukle"));
      A.onayAc(b.closest("li").querySelector(".adm-onay"), b, {
        baslik: "Sürüm " + sv + " geri yüklensin mi?", metin: "İçerik v" + sv + " hâline döner ve yeni bir sürüm olarak kaydedilir (şimdiki hâl de geçmişte kalır).",
        onayMetni: "Geri yükle",
        onayla: function () {
          return A.api("/api/admin/soru-bankasi/soru/" + encodeURIComponent(s.id) + "/geri-yukle", "POST", { surum: sv }).then(function (v) {
            A.bildir("v" + sv + " geri yüklendi → yeni sürüm " + v.surum + ".", "ok"); detayAc(s.id);
          });
        }
      });
    });
  }

  // 1.11.0: Onay kuyruğu (admin-onay.js) düzenleyiciyi ve MathJax dizgisini buradan kullanır
  window.MEBERRA_ADMIN_SB = { kur: kur, ac: ac, duzenle: function (id) { return detayAc(id); }, dizgile: dizgile };
})();
