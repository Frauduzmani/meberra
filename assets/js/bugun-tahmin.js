/* ==========================================================================
   MEBERRA 1.27.0 — Bugün: tahmini AP puanı (karşılama kartının parçası; ayrı blok değil).
   GET /api/ilerleme/ozet → dersler[].tahminModel (server/ilerleme.js, model assets/js/puan-tahmin.js).
   Ders başına halka (1–5, "tahmini"), "Mayıs'a N hafta" ve odak dersin TEK somut sonraki adımı (kaldıraç ünitesi).
   Bant yükselince bir kez kutlama (localStorage "meberra:tahmin-bant"). Testler: araclar/testler/bugun-tahmin-birim-test.js
   ========================================================================== */
(function (kok, kur) {
  "use strict";
  var api = kur();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { kok.MeberraBugunTahmin = api; if (typeof document !== "undefined") api.baslat(); }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var ANAHTAR = "meberra:tahmin-bant";

  // Sayının okunuşuna göre Türkçe ekler (1 bir, 2 iki, 3 üç, 4 dört, 5 beş, 6 altı, 7 yedi, 8 sekiz, 9 dokuz, 10 on …)
  var SON = { 0: "on", 1: "bir", 2: "iki", 3: "üç", 4: "dört", 5: "beş", 6: "altı", 7: "yedi", 8: "sekiz", 9: "dokuz" };
  function okunus(n) { var m = /(\d+)\D*$/.exec(String(n)); if (!m) return String(n); var v = +m[1]; return v % 10 === 0 && v ? (v % 100 === 0 ? "yüz" : "on") : SON[v % 10]; }
  function sonUnlu(w) { for (var i = w.length - 1; i >= 0; i--) if ("aeıioöuü".indexOf(w[i]) >= 0) return w[i]; return "e"; }
  var ek = {
    belirtme: function (n) { var w = okunus(n), u = sonUnlu(w), h = { a: "ı", ı: "ı", e: "i", i: "i", o: "u", u: "u", ö: "ü", ü: "ü" }[u]; return "'" + ("aeıioöuü".indexOf(w[w.length - 1]) >= 0 ? "y" : "") + h; },
    ayrilma: function (n) { var w = okunus(n), u = sonUnlu(w), sert = "fstkçşhp".indexOf(w[w.length - 1]) >= 0; return "'" + (sert ? "t" : "d") + ("aıou".indexOf(u) >= 0 ? "an" : "en"); },
    yonelme: function (n) { var w = okunus(n), u = sonUnlu(w); return "'" + ("aeıioöuü".indexOf(w[w.length - 1]) >= 0 ? "y" : "") + ("aıou".indexOf(u) >= 0 ? "a" : "e"); }
  };
  function tm(x) { return x && x.tahminModel; }
  /** Hedefinin en çok altında kalan ders (hedef yoksa 5); eşitlikte düşük ince puan. Tahmin yoksa null. */
  function odakDers(L) {
    var v = (L || []).filter(tm);
    if (!v.length) return null;
    return v.slice().sort(function (a, b) {
      var ga = (a.hedef || 5) - tm(a).ince, gb = (b.hedef || 5) - tm(b).ince;
      return gb - ga || tm(a).ince - tm(b).ince;
    })[0];
  }
  function adimMetni(x) {
    var t = tm(x);
    if (!t) return (x && x.kisa ? x.kisa + ": " : "") + "10 soru çöz, tahmini puanın çıksın.";
    var k = t.kaldirac;
    if (t.puan >= 5 && !k) return x.kisa + ": 5 bandındasın! Bir deneme sınavıyla koru.";
    if (!k) return x.kisa + ": 5 bandındasın! Bir deneme sınavıyla koru.";
    if (k.puanYeni > t.puan) return x.kisa + ": " + k.etiket + ek.belirtme(k.etiket) + " %85'e çıkar → tahminin " + k.puanYeni + " olur";
    return x.kisa + ": en çok puanı " + k.etiket + " getirir. Çalışmaya oradan devam et.";
  }
  function halka(ince) { return ince == null ? 0 : Math.max(0, Math.min(1, (ince - 1) / 4)); }
  function kayit(L) { var o = {}; (L || []).forEach(function (x) { if (tm(x)) o[x.ders] = tm(x).puan; }); return o; }
  function yukselenler(eski, L) {
    var out = [];
    (L || []).forEach(function (x) { var t = tm(x), e = eski && eski[x.ders]; if (t && e != null && t.puan > e) out.push({ ders: x.ders, kisa: x.kisa, eski: e, yeni: t.puan }); });
    return out;
  }

  // ---------------- tarayıcı ----------------
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function oku() { try { return JSON.parse(localStorage.getItem(ANAHTAR) || "{}") || {}; } catch (e) { return {}; } }
  function yaz(v) { try { localStorage.setItem(ANAHTAR, JSON.stringify(v)); } catch (e) { /* özel pencere */ } }
  function bugunIst() {
    try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  var GUVEN = { dusuk: "az veri", orta: "orta güven", yuksek: "güçlü veri" };
  function halkaSvg(x) {
    var t = tm(x), r = 22, c = 2 * Math.PI * r, o = halka(t ? t.ince : null);
    return '<svg class="bt-halka" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="' + r + '" class="bt-iz"/>' +
      '<circle cx="28" cy="28" r="' + r + '" class="bt-dolu" style="stroke-dasharray:' + (c * o).toFixed(1) + " " + c.toFixed(1) + '"/>' +
      '<text x="28" y="34" text-anchor="middle" class="bt-sayi">' + (t ? t.puan : "–") + "</text></svg>";
  }
  function ciz(kap, L, hafta) {
    var gor = (L || []).slice(0, 3), odak = odakDers(L) || gor[0];
    kap.innerHTML = '<div class="bt-ust"><span class="bt-baslik">🎯 Tahmini AP puanın</span>' +
      (hafta ? '<span class="bt-hafta">Mayıs\'a ' + hafta + " hafta</span>" : "") + "</div>" +
      '<ul class="bt-dersler" role="list">' + gor.map(function (x) {
        var t = tm(x);
        return '<li class="bt-ders' + (x === odak ? " is-odak" : "") + '" aria-label="' + esc(x.kisa + ": " + (t ? "tahmini " + t.puan + (x.hedef ? ", hedef " + x.hedef : "") + ", " + GUVEN[t.guven] : "henüz tahmin yok")) + '">' +
          halkaSvg(x) + '<span class="bt-ad">' + esc(x.kisa) + "</span>" +
          '<span class="bt-alt">' + (t ? (x.hedef ? "hedef " + x.hedef + " · " : "") + GUVEN[t.guven] : "veri yok") + "</span></li>";
      }).join("") + "</ul>" +
      (odak ? '<a class="bt-adim" href="' + esc((tm(odak) && tm(odak).kaldirac && tm(odak).kaldirac.link) || odak.link || "/calis") + '">' + esc(adimMetni(odak)) + ' <span aria-hidden="true">→</span></a>' : "") +
      '<p class="bt-not">Tahminidir; College Board ölçeği yayımlamaz. Sorular, FRQ öz puanların ve denemelerinle güncellenir.</p>';
    kap.hidden = false;
  }
  function baslat() {
    function kur() {
      var kap = document.getElementById("bg-tahmin");
      if (!kap || !window.fetch || (typeof MEBERRA_SUNUCU !== "undefined" && !MEBERRA_SUNUCU)) return;
      fetch("/api/ilerleme/ozet", { credentials: "same-origin", headers: { Accept: "application/json" } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          var L = j && Array.isArray(j.dersler) ? j.dersler : [];
          if (!L.length) return;
          var P = window.MeberraPuanTahmin;
          ciz(kap, L, P ? P.haftaKaldi(bugunIst()) : 0);
          var eski = oku(), yuk = yukselenler(eski, L), K = window.MeberraKutlama;
          if (yuk.length && K && K.kutla) {
            var y = yuk[0];
            K.kutla({ tur: "rozet", buyuk: true, ifade: "kutlama", baslik: "Tahminin yükseldi: " + y.yeni + "! 🎉", metin: y.kisa + " tahmini puanın " + y.eski + ek.ayrilma(y.eski) + " " + y.yeni + ek.yonelme(y.yeni) + " çıktı. Böyle devam!" });
          }
          yaz(Object.assign(eski, kayit(L)));
        }).catch(function () { /* gösterge isteğe bağlı */ });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", kur); else kur();
  }
  return { ek: ek, odakDers: odakDers, adimMetni: adimMetni, halka: halka, kayit: kayit, yukselenler: yukselenler, baslat: baslat };
});
