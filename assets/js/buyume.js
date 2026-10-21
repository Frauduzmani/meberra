/* ==========================================================================
   Meberra — büyüme arayüzü (1.6.0). app.js her sayfada yükler (yönetici paneli hariç); yalnızca sunucu modunda çalışır.
   - ?davet=KOD: kod saklanır (localStorage "meberra:davet"), kayıt isteğine auth.js ekler; giriş sayfasında bilgi şeridi.
   - 7 gün ücretsiz Premium denemesi: Premium ünite duvarına ve fiyatlar sayfasına "Ücretsiz dene" düğmesi
     (uygun hesapta doğrudan başlatır; misafiri kayda, sonra premium.html?deneme=1'e yönlendirir).
   - Profil: "Arkadaşını davet et" kartı (bağlantıyı kopyala / paylaş, başarılı davet sayısı) ve "Kullanım ölçümü" tercihi.
   Uçlar: GET/POST /api/premium/deneme, GET /api/davet, GET/PUT /api/olcum-tercih.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined" || window.__meberraBuyume) return;
  window.__meberraBuyume = true;
  if (!document.querySelector('meta[name="meberra-api"]')) return;

  var DAVET_RE = /^[A-Za-z2-9]{6,12}$/;
  var ME = window.APMEBERRA_ME || null, girisli = !!(ME && ME.user);
  var sayfa = (window.MEBERRA_ADRES ? window.MEBERRA_ADRES.sayfa() : ((location.pathname.split("/").pop() || "index").replace(/\.html?$/i, "") || "index"));
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
  function olc(ad, oz) { if (window.MeberraOlcum) window.MeberraOlcum.olay(ad, oz); }
  function istek(yontem, yol, govde) {
    return fetch(yol, { method: yontem, credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Meberra": "1" }, body: govde ? JSON.stringify(govde) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j.ok = r.ok && j.ok !== false; j.durum = r.status; return j; }); },
        function () { return { ok: false, durum: 0, error: "Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene." }; });
  }
  function hazir(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }

  // ---- davet kodu yakalama ----
  try {
    var dk = new URLSearchParams(location.search).get("davet");
    if (dk && DAVET_RE.test(dk) && !girisli) localStorage.setItem("meberra:davet", dk.toUpperCase());
    if (girisli) localStorage.removeItem("meberra:davet");
  } catch (e) { /* depolama kapalı */ }

  hazir(function () {
    if (sayfa === "giris") girisSeridi();
    if (sayfa === "fiyatlar") fiyatlarDeneme();
    if (sayfa === "profil") profilKartlari();
    duvarIzle();
  });

  function girisSeridi() {
    var kod = null; try { kod = localStorage.getItem("meberra:davet"); } catch (e) { kod = null; }
    var form = document.getElementById("form-kayit");
    if (!kod || !form || document.getElementById("bu-davet-serit")) return;
    var d = document.createElement("div");
    d.className = "notice bu-davet-serit"; d.id = "bu-davet-serit"; d.setAttribute("role", "note");
    d.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>' +
      "<span><strong>Bir arkadaşın seni davet etti.</strong> Kayıt ol ve seviye testini bitir: ikinize de 7 gün Premium hediye.</span>";
    form.insertBefore(d, form.firstChild);
  }

  // ---- 7 günlük deneme düğmesi ----
  var denemeSoz = null;
  function denemeDurum() {
    if (!girisli) return Promise.resolve(null);
    if (!denemeSoz) denemeSoz = istek("GET", "/api/premium/deneme");
    return denemeSoz;
  }
  function denemeDugmesi(sinif) {
    var b = document.createElement(girisli ? "button" : "a");
    b.className = (sinif || "btn-ghost") + " bu-deneme-cta";
    b.textContent = "7 gün ücretsiz Premium dene";
    if (!girisli) { b.href = "/giris?donus=" + encodeURIComponent("/premium?deneme=1") + "#kayit"; return b; }
    b.type = "button";
    b.addEventListener("click", function () {
      b.disabled = true; b.textContent = "Başlatılıyor…";
      istek("POST", "/api/premium/deneme", {}).then(function (j) {
        if (!j.ok) { b.disabled = false; b.textContent = j.error || "Deneme başlatılamadı"; return; }
        try { localStorage.setItem("apmeberra-hesap:v1:uyelik", JSON.stringify(j.uyelik)); } catch (e) { /* önbellek */ }
        b.textContent = "Denemen başladı, sayfa yenileniyor…";
        setTimeout(function () { location.reload(); }, 600);
      });
    });
    return b;
  }
  function fiyatlarDeneme() {
    var plans = document.querySelector(".vt-plans");
    if (!plans || document.getElementById("bu-fy-deneme")) return;
    denemeDurum().then(function (d) {
      if (d && !d.uygun) return;
      var p = document.createElement("p");
      p.className = "bu-fy-deneme"; p.id = "bu-fy-deneme";
      p.appendChild(denemeDugmesi("btn-ghost"));
      var s = document.createElement("span"); s.className = "field-hint"; s.textContent = "Ödeme bilgisi gerekmez · otomatik ücret yok";
      p.appendChild(s);
      plans.parentNode.insertBefore(p, plans.nextSibling);
    });
  }
  /** Premium ünite duvarı her çizildiğinde eylem satırına deneme düğmesi */
  function duvarIzle() {
    var ekle = function () {
      var e = document.querySelector(".ug-duvar .ug-duvar-eylem");
      if (!e || e.querySelector(".bu-deneme-cta")) return;
      denemeDurum().then(function (d) { if ((!d || d.uygun) && !e.querySelector(".bu-deneme-cta")) e.appendChild(denemeDugmesi("btn-primary")); });
    };
    ekle();
    if (window.MutationObserver && document.body) {
      var t = null;
      new MutationObserver(function () { clearTimeout(t); t = setTimeout(ekle, 200); }).observe(document.body, { childList: true, subtree: true });
    }
  }

  // ---- profil: davet kartı + ölçüm tercihi ----
  function profilKartlari() {
    var kap = document.querySelector("#profile .profile-layout");
    if (!kap || !girisli || document.getElementById("davet")) return;
    var s = document.createElement("section");
    s.className = "surface bu-davet"; s.id = "davet"; s.setAttribute("aria-labelledby", "bu-davet-h");
    s.innerHTML = '<h2 class="panel-h" id="bu-davet-h"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>Arkadaşını davet et</h2>' +
      '<p>Arkadaşın bağlantınla kayıt olup seviye testini bitirince <strong>ikinize de 7 gün Premium</strong> hediye.</p>' +
      '<div class="bu-davet-link"><label for="bu-davet-url" class="visually-hidden">Davet bağlantın</label><input class="text-input" id="bu-davet-url" readonly value="Yükleniyor…">' +
      '<button type="button" class="btn-primary btn-sm" id="bu-davet-kopya">Kopyala</button><button type="button" class="btn-ghost btn-sm" id="bu-davet-paylas" hidden>Paylaş</button></div>' +
      '<p class="field-hint" id="bu-davet-durum" role="status" aria-live="polite"></p>';
    kap.appendChild(s);
    var o = document.createElement("section");
    o.className = "surface bu-olcum"; o.setAttribute("aria-labelledby", "bu-olcum-h");
    o.innerHTML = '<h2 class="panel-h" id="bu-olcum-h"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/></svg>Kullanım ölçümü</h2>' +
      '<label class="check-row"><input type="checkbox" id="bu-olcum-acik"> <span>Meberra\'yı geliştirmemize yardım et: hangi sayfaların kullanıldığını anonim ve yalnızca kendi sunucumuzda ölçeriz. Reklam ya da üçüncü taraf takip yok.</span></label>' +
      '<p class="field-hint" id="bu-olcum-durum" role="status" aria-live="polite"></p>';
    kap.appendChild(o);

    var url = document.getElementById("bu-davet-url"), durum = document.getElementById("bu-davet-durum");
    istek("GET", "/api/davet").then(function (j) {
      if (!j.ok) { url.value = ""; durum.textContent = j.error || "Davet bağlantısı alınamadı."; return; }
      url.value = j.link;
      durum.textContent = j.basarili ? "Başarılı davet: " + j.basarili + (j.bekleyen ? " · seviye testini bekleyen: " + j.bekleyen : "") + "." :
        j.bekleyen ? "Seviye testini bitirmesi beklenen davet: " + j.bekleyen + "." : "Henüz başarılı davetin yok.";
      if (navigator.share) document.getElementById("bu-davet-paylas").hidden = false;
    });
    document.getElementById("bu-davet-kopya").addEventListener("click", function () {
      var b = this;
      var bitti = function (ok) { b.textContent = ok ? "Kopyalandı" : "Seçip kopyala"; setTimeout(function () { b.textContent = "Kopyala"; }, 2000); if (ok) olc("davet_paylasti", { yol: "kopya" }); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url.value).then(function () { bitti(true); }, function () { url.select(); bitti(false); });
      else { url.select(); try { bitti(document.execCommand("copy")); } catch (e) { bitti(false); } }
    });
    document.getElementById("bu-davet-paylas").addEventListener("click", function () {
      navigator.share({ title: "Meberra", text: "Meberra'da birlikte çalışalım: kayıt ol, seviye testini bitir, ikimize de 7 gün Premium!", url: url.value })
        .then(function () { olc("davet_paylasti", { yol: "paylas" }); }, function () { /* vazgeçildi */ });
    });

    var kutu = document.getElementById("bu-olcum-acik"), od = document.getElementById("bu-olcum-durum");
    var tarayiciKapali = !!(window.MeberraOlcum && (navigator.globalPrivacyControl === true || navigator.doNotTrack === "1"));
    istek("GET", "/api/olcum-tercih").then(function (j) {
      kutu.checked = j.ok ? !j.kapali : true;
      if (window.MeberraOlcum) window.MeberraOlcum.kapat(j.ok && j.kapali);
      if (tarayiciKapali) od.textContent = "Tarayıcındaki “İzlenme” (Do Not Track / GPC) ayarı açık olduğu için ölçüm zaten yapılmıyor.";
    });
    kutu.addEventListener("change", function () {
      var kapali = !kutu.checked;
      istek("PUT", "/api/olcum-tercih", { kapali: kapali }).then(function (j) {
        if (!j.ok) { kutu.checked = !kutu.checked; od.textContent = j.error || "Kaydedilemedi."; return; }
        if (window.MeberraOlcum) window.MeberraOlcum.kapat(j.kapali);
        od.textContent = j.kapali ? "Ölçüm kapalı. Bu hesaptan kullanım olayı kaydedilmeyecek." : "Ölçüm açık. Teşekkürler!";
      });
    });
  }
})();
