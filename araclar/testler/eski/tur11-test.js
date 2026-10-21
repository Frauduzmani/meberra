// Tur 11 tarayıcı testi (Ajan 11; kararlar D1–D8 ve PM K-A…K-D). Çalıştır: node tur11-test.js (playwright-core kurulu klasörde).
// A) Seçici: 3 model yolu, adım görünürlüğü, özet çubuğu, çok dilli ülke etiketi, İrlanda, klavye, geri tuşu, boş durumlar
// B) Ajan 13 önizlemesi: data/mevzuat/kaynak'a YAZMADAN, üretici çıktısı yalnızca bu test bağlamına enjekte edilir
//    (ilk 20, K-B Doğrulanamadı satırları sonda, sıralama yayın tarihi, K-D özet uyarısı)
// C) Üniversiteler: 15 sekme, düzey/dil filtresi ve adres, arama, 0 sonuç, 360 px kart görünümü
// D) Oturumlu üniversite mezunu: menü süzgeci, Panelim YL kartı ve AP bölümlerinin gizlenmesi, Rotam genel yol haritası (nl-yl)
// E) Profil sihirbazı: üniversite mezunu yolu, 5 ülke sınırı, dil adımı
// F) Ekran görüntüleri: 1280 ve 390 px, açık ve koyu (../shots/t11-*.png); 360 px taşma
// Test sonunda localStorage temizlenir; her bağlam geçicidir.
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');
const ROOT = 'C:/Users/hp/Desktop/projelerim/AP MEBERRA/';
const URL = f => 'file:///C:/Users/hp/Desktop/projelerim/AP%20MEBERRA/' + f;
const SHOTS = path.resolve(__dirname, '../shots');
fs.mkdirSync(SHOTS, { recursive: true });
const EXE = 'C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const P = 'apmeberra-hesap:v1:';
const BUGUN = '2026-10-15';
let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (c || x === undefined ? '' : ' -> ' + JSON.stringify(x).slice(0, 500))); c ? pass++ : fail++; };
const rel = u => decodeURIComponent(u.split('AP%20MEBERRA/')[1] || u);

// Ajan 13 önizleme verisi (varsa): üretici geçici klasöre yazar, test bağlamına enjekte edilir
function onizleme() {
  const DOG = ROOT + '.agents/mevzuat/dogrulama';
  if (!fs.existsSync(DOG) || !fs.readdirSync(DOG).some(f => /^uni-[a-z]{2}\.json$/.test(f))) return null;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 't11-onizleme-'));
  try { execFileSync(process.execPath, [ROOT + 'araclar/ulke-veri-olustur.js', '--kaynak', DOG, '--cikti', tmp], { encoding: 'utf8' }); } catch (e) { return null; }
  global.window = {};
  require(path.join(tmp, 'ulke-dizini.js')); require(path.join(tmp, 'yl-genel.js'));
  fs.readdirSync(path.join(tmp, 'ulke')).forEach(f => require(path.join(tmp, 'ulke', f)));
  const w = global.window; delete global.window;
  fs.rmSync(tmp, { recursive: true, force: true });
  return { dizin: w.APMEBERRA_ULKE_DIZINI, veri: w.APMEBERRA_ULKE_VERI, yl: w.APMEBERRA_YL_GENEL };
}

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const errs = [];
  async function mk(opts = {}, profil = null, veri = null) {
    const ctx = await b.newContext(Object.assign({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' }, opts));
    await ctx.addInitScript(([bugun, pre, prof, v]) => {
      window.APMEBERRA_BUGUN = bugun;
      if (v) {
        Object.keys(v.veri).forEach(k => Object.freeze(v.veri[k]));
        Object.defineProperty(window, 'APMEBERRA_ULKE_DIZINI', { value: v.dizin, writable: false });
        Object.defineProperty(window, 'APMEBERRA_ULKE_VERI', { value: Object.freeze(v.veri), writable: false });
        if (v.yl) Object.defineProperty(window, 'APMEBERRA_YL_GENEL', { value: v.yl, writable: false });
      }
      try {
        if (prof && !localStorage.getItem(pre + 'oturum')) {
          localStorage.setItem(pre + 'kullanicilar', JSON.stringify([{ id: 'utest', ad: 'Test', soyad: 'Öğrenci', kullaniciAdi: 'test', salt: '00', hash: '00', iter: 1 }]));
          localStorage.setItem(pre + 'oturum', JSON.stringify({ id: 'utest' })); localStorage.setItem(pre + 'aktif', JSON.stringify('utest'));
          if (prof !== true) localStorage.setItem(pre + 'profil:utest', JSON.stringify(prof));
        }
      } catch (e) {}
    }, [BUGUN, P, profil, veri]);
    return ctx;
  }
  async function git(ctx, f, bekle) {
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(f + ': ' + e.message));
    p.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/Failed to load resource|ERR_FILE_NOT_FOUND/.test(m.text())) errs.push(f + ' console: ' + m.text()); });
    await p.goto(URL(f)); await p.waitForTimeout(bekle || 500);
    return p;
  }
  const tasma = p => p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  const h1 = p => p.textContent('#sr-h1');

  // =============================== A) Seçici ===============================
  {
    const ctx = await mk();
    const p = await git(ctx, 'sartlar.html');
    ok((await p.textContent('#sr-intro-h')) === 'Önce durumunu seç' && await p.evaluate(() => document.getElementById('sr-f-sinif').classList.contains('is-soluk')), 'A1 giriş: durum soruluyor, sonraki adımlar soluk');
    ok(await p.evaluate(() => [...document.querySelectorAll('.sr-ulke-grup-h')].map(x => x.textContent).join('|')) === 'Tarihli rotası olanlar|Diğer ülkeler' &&
      await p.evaluate(() => [...document.querySelectorAll('.sr-ulke-grid')][0].querySelectorAll('.sr-ulke').length) === 2, 'A2 ülke ızgarası: ana (DE, IT) + diğer 13');
    const yal = await p.evaluate(() => ({ dis: document.getElementById('sr-yalniz-en').disabled, not: !document.getElementById('sr-yalniz-not').hidden }));
    ok(typeof yal.dis === 'boolean' && (yal.dis === yal.not), 'A3 "Yalnızca İngilizce" süzgeci: veri yokken kapalı ve açıklamalı, veri varken açık', yal);
    // Yol 1: lise → 11 → Hollanda
    await p.click('label.sr-card:has(input[value="lise"])');
    ok((await p.textContent('#sr-intro-h')) === 'Şimdi sınıfını seç' && rel(p.url()) === 'sartlar.html?model=lise', 'A4 lise seçildi: sınıf soruluyor, adres ?model=lise');
    await p.click('label.sr-opt:has(input[name=sinif][value="11"])');
    ok((await p.textContent('#sr-intro-h')) === 'Şimdi ülkeni seç', 'A5 sınıf seçildi: ülke soruluyor');
    await p.click('label.sr-ulke[data-ulke="nl"]');
    await p.waitForFunction(() => !document.getElementById('sr-root').classList.contains('is-intro'));
    await p.waitForTimeout(300);
    const nl = await p.evaluate(() => ({ url: location.search, kompakt: document.getElementById('sr-form').classList.contains('is-kompakt'), bar: !document.getElementById('sr-ozetbar').hidden, h1: document.getElementById('sr-h1').textContent, yol: !!document.querySelector('#sr-yol'), ilk20: !!document.querySelector('#sr-ilk20') }));
    ok(nl.url === '?model=lise&sinif=11&ulke=nl&dil=en' && nl.kompakt && nl.bar && nl.h1 === 'Hollanda’da İngilizce lisans: 11. sınıf öğrencisi için şartlar' && nl.yol && nl.ilk20, 'A6 tam seçim: kanonik adres, kompakt özet çubuğu, başlık, ilk 20 ve yol haritası bölümleri', nl);
    // Yol 2: İsviçre, yerel dil (çok dilli)
    await p.click('#sr-degistir');
    await p.click('label.sr-ulke[data-ulke="ch"]');
    ok((await p.textContent('#sr-yerel-ad')) === 'Yerel dil (Almanca / Fransızca / İtalyanca)', 'A7 İsviçre: yerel dil etiketi üç dili sayar');
    await p.click('label.sr-opt:has(input[name=dil][value="yerel"])');
    await p.waitForFunction(() => /ulke=ch&dil=yerel/.test(location.search));
    await p.waitForTimeout(300);
    ok((await h1(p)) === 'İsviçre’de yerel dilde lisans: 11. sınıf öğrencisi için şartlar', 'A8 çok dilli ülkede başlık "yerel dilde"');
    // Yol 3: üniversite mezunu
    await p.click('label.sr-card:has(input[value="uni-mezun"])');
    await p.waitForFunction(() => /model=uni-mezun&ulke=ch&dil=yerel$/.test(location.search));
    await p.waitForTimeout(300);
    ok(await p.isHidden('#sr-f-sinif') && (await p.textContent('#sr-f-ulke .sr-no')) === '2' && (await h1(p)).includes('yüksek lisans: üniversite mezunları'), 'A9 üniversite mezunu: sınıf adımı gizli, adım numaraları kaydı, YL başlığı');
    const yl = await p.evaluate(() => ({ buYil: !!document.getElementById('sr-buYil'), ylOrtak: !!document.getElementById('sr-ylortak') || !!document.getElementById('sr-hazir'), cta: (document.getElementById('sr-kocluk') || {}).getAttribute && document.getElementById('sr-kocluk').getAttribute('href') }));
    ok(!yl.buYil && yl.ylOrtak && yl.cta === 'giris.html?model=uni-mezun&ulke=ch&dil=yerel#kayit', 'A10 YL: "Bu yıl" bölümü yok, ortak YL notları ya da hazırlanıyor, koçluk bağlantısı seçimi taşır', yl);
    // Klavye: model radyoları ok tuşuyla
    await p.focus('input[name=model][value="uni-mezun"]'); await p.keyboard.press('ArrowLeft');
    await p.waitForFunction(() => /model=lise-mezun/.test(location.search));
    ok(await p.evaluate(() => document.activeElement && document.activeElement.name === 'model' && document.activeElement.value === 'lise-mezun'), 'A11 klavye: ok tuşu modeli değiştirir, odak radyoda kalır');
    await p.click('#sr-degistir');
    ok(await p.getAttribute('#sr-degistir', 'aria-expanded') === 'false' && await p.isHidden('#sr-adimlar'), 'A12 "Seçimi kapat": seçici gizlendi');
    // Geri tuşu
    await p.goBack(); await p.waitForTimeout(400);
    ok(/model=/.test(rel(p.url())) && !!(await p.$('#sr-root')), 'A13 geri tuşu: önceki seçim (' + rel(p.url()) + ')');
    // Kendi profil düğmesi yalnız oturumluda
    ok(!(await p.$('#sr-kendi')), 'A14 ziyaretçide "Kendi profilime göre göster" yok');
    // Veri dosyası olmayan ülke + hazırlanıyor metni (kaynak verisi gelene kadar)
    const dosyaYok = await p.evaluate(() => (window.APMEBERRA_ULKE_DIZINI.ulkeler.find(u => !u.veri.dosya) || {}).kod);
    if (dosyaYok) {
      await p.goto(URL('sartlar.html?model=lise-mezun&ulke=' + dosyaYok + '&dil=en')); await p.waitForSelector('#sr-hazir');
      const hz = await p.evaluate(() => ({ h: document.getElementById('sr-hazir-h').textContent, sec: document.querySelectorAll('.sr-grid').length, yol: document.querySelectorAll('#sr-yol .sr-step').length, btn: !!document.querySelector('[data-ulke-sec]') }));
      ok(/ için şartlar hazırlanıyor\.$/.test(hz.h) && hz.sec === 0 && hz.yol >= 6 && hz.btn, 'A15 veri yok (' + dosyaYok + '): "' + hz.h + '", genel yol haritası ' + hz.yol + ' adım, "Başka ülke seç"', hz);
      await p.click('[data-ulke-sec]');
      ok(await p.isVisible('#sr-f-ulke') && await p.evaluate(() => document.activeElement && document.activeElement.name === 'ulke'), 'A16 "Başka ülke seç": seçici açıldı, odak ülke ızgarasında');
    } else ok(true, 'A15 tüm ülkelerin dosyası var (hazırlanıyor durumu atlandı)');
    // Lise mezunu ve ön değerlendirme notu (menüye alınmayan ülke)
    await p.goto(URL('sartlar.html?model=lise-mezun&ulke=at&dil=en')); await p.waitForTimeout(600);
    ok(!!(await p.$('[data-bant="mezun-notu"]')), 'A17 lise mezunu × Avusturya: Mezun Menüsü ön değerlendirme notu kaynağıyla');
    await p.goto(URL('sartlar.html?model=lise&sinif=11&ulke=at&dil=en')); await p.waitForTimeout(600);
    ok(!(await p.$('[data-bant="mezun-notu"]')), 'A18 lise öğrencisinde ön değerlendirme notu yok');
    await ctx.close();
  }

  // =============================== B) Ajan 13 önizlemesi ===============================
  const V = onizleme();
  if (!V) console.log('INFO Ajan 13 ilk 20 verisi yok; B bölümü atlandı.');
  else {
    // K-D: test için yapay özet uyarısı (PM verisi gelene kadar)
    const se = V.dizin.ulkeler.find(u => u.kod === 'se');
    se.ozetUyari = { 'lisans-en': { metin: 'TEST: Mühendislikte İngilizce lisans çok dar' } };
    const ctx = await mk({}, null, V);
    const p = await git(ctx, 'sartlar.html?model=lise&sinif=12&ulke=se&dil=en', 800);
    const r = await p.evaluate(() => ({
      kart: (document.querySelector('.sr-ulke[data-ulke="se"] .pd-rozet') || {}).textContent,
      kartUyari: (document.querySelector('.sr-ulke[data-ulke="se"] .sr-ulke-uyari') || {}).textContent,
      ozetUyari: (document.querySelector('.sr-summary .ozet-uyari') || {}).textContent,
      ilk20: document.querySelectorAll('#sr-ilk20 .sr-uni').length, uniKart: (document.querySelector('#sr-ilk20 .sr-uni-kart strong') || {}).textContent || '',
      lead: (document.querySelector('#sr-ilk20 .sr-ilk20-lead') || {}).textContent || '',
      tumu: (document.querySelector('#sr-ilk20 .sr-ilk20-foot a') || {}).getAttribute ? document.querySelector('#sr-ilk20 .sr-ilk20-foot a').getAttribute('href') : '',
      sec: document.querySelectorAll('.sr-grid .sr-item').length
    }));
    ok(/EN lisans: (Geniş|Kısıtlı)/.test(r.kart) && /TEST: Mühendislikte/.test(r.kartUyari) && /TEST: Mühendislikte/.test(r.ozetUyari), 'B1 İsveç: program durumu rozeti; K-D özet uyarısı kartta ve özet kartında', r);
    ok(r.ilk20 === 0 && /^Bu ülkenin \d+ üniversitesi$/.test(r.uniKart) && /QS World University Rankings 2027 · yayın: Haziran 2026/.test(r.lead) && r.tumu === 'universiteler.html?ulke=se&duzey=lisans&dil=en', 'B2 (Tur 14 A4) ilk 20 listesi tekrar edilmez: bağlantı kartı (' + r.uniKart + '), sıralama yayın tarihi, Üniversiteler sekmesine bağlantı', r);
    ok(r.sec > 0, 'B3 Ajan 13 lisans maddeleri bölümlerde (' + r.sec + ' madde)');
    // K-B: Doğrulanamadı hücreli üniversite listenin sonunda, rozetle
    const teyitli = V.dizin.ulkeler.map(u => u.kod).find(cc => {
      const l = ((V.veri[cc] || {}).universiteler || {}).liste || [];
      return l.some(u => ['lisans', 'yuksekLisans'].some(a => u[a] && (u[a].en === 'teyit' || u[a].yerel === 'teyit')));
    });
    if (teyitli) {
      const l = V.veri[teyitli].universiteler.liste;
      const [duzey, dil] = [['lisans', 'en'], ['lisans', 'yerel'], ['yl', 'en'], ['yl', 'yerel']].find(([z, d]) => l.some(u => (u[z === 'yl' ? 'yuksekLisans' : 'lisans'] || {})[d] === 'teyit'));
      await p.goto(URL(`universiteler.html?ulke=${teyitli}&duzey=${duzey}&dil=${dil}`)); await p.waitForSelector('.uni-tablo');
      const t = await p.evaluate(() => {
        const rows = [...document.querySelectorAll('.uni-tablo tbody tr')];
        const i = rows.findIndex(x => x.classList.contains('is-teyit'));
        return { n: rows.length, ilkTeyit: i, sondaMi: i >= 0 && rows.slice(i).every(x => x.classList.contains('is-teyit')), rozet: (document.querySelector('.uni-tablo .uni-teyit') || {}).textContent, say: document.querySelector('[id$="-say"]').textContent };
      });
      ok(t.ilkTeyit >= 0 && t.sondaMi && t.rozet === '?Doğrulanamadı — resmi katalogdan kontrol et' && /doğrulanamadı, listenin sonunda/.test(t.say), `B4 K-B ${teyitli}/${duzey}/${dil}: Doğrulanamadı satırları gizlenmedi, sonda ve rozetli`, t);
    }
    await p.goto(URL('universiteler.html?ulke=se&duzey=lisans&dil=hepsi')); await p.waitForSelector('.uni-tablo');
    ok(await p.$$eval('.uni-tablo tbody tr', r => r.length) === V.veri.se.universiteler.liste.length && /Hepsi/.test(await p.textContent('.uni-filtre')), 'B5 üniversiteler İsveç: filtresiz tüm liste (' + V.veri.se.universiteler.liste.length + ')');
    for (const [w, sc] of [[1280, 'light'], [390, 'dark']]) {
      const c2 = await mk({ viewport: { width: w, height: 900 }, colorScheme: sc }, null, V);
      const q = await git(c2, 'universiteler.html?ulke=pl&duzey=lisans&dil=en', 800);
      ok(await tasma(q) <= 0, `B6 ${w}px ${sc}: ilk 20 tablosu taşmıyor` + (w < 700 ? ' (kart görünümü)' : ''));
      await q.screenshot({ path: path.join(SHOTS, `t11-onizleme-universiteler-pl-${w}-${sc}.png`), fullPage: w < 700 ? false : true });
      await q.goto(URL('sartlar.html?model=uni-mezun&ulke=se&dil=en')); await q.waitForTimeout(800);
      await q.screenshot({ path: path.join(SHOTS, `t11-onizleme-sartlar-se-yl-${w}-${sc}.png`), fullPage: true });
      await q.goto(URL('sartlar.html?model=lise')); await q.waitForTimeout(500);
      await q.screenshot({ path: path.join(SHOTS, `t11-onizleme-sartlar-izgara-${w}-${sc}.png`), fullPage: true });
      await c2.close();
    }
    await ctx.close();
  }

  // =============================== C) Üniversiteler ===============================
  {
    const ctx = await mk();
    const p = await git(ctx, 'universiteler.html?ulke=nl', 700);
    const r = await p.evaluate(() => ({ tabs: document.querySelectorAll('.country-tabs [role=tab]').length, sel: document.querySelector('.country-tabs [aria-selected=true]').id, h1: document.querySelector('.page-head h1').textContent, url: location.search }));
    ok(r.tabs === 15 && r.sel === 'tab-nl' && r.url === '?ulke=nl&duzey=lisans&dil=hepsi', 'C1 ziyaretçi: 15 sekme, ?ulke=nl açık, adres varsayılan filtrelerle', r);
    await p.click('#panel-nl label.sr-opt:has(input[value="yl"])');
    await p.click('#panel-nl label.sr-opt:has(input[value="en"])');
    ok(/duzey=yl&dil=en/.test(await p.evaluate(() => location.search)), 'C2 filtre adres satırına yazılır');
    await p.focus('#tab-nl'); await p.keyboard.press('ArrowRight');
    ok(await p.evaluate(() => document.activeElement.id !== 'tab-nl' && document.activeElement.getAttribute('aria-selected') === 'true'), 'C3 sekmeler klavyeyle (ok tuşu)');
    await p.goto(URL('universiteler.html?ulke=de')); await p.waitForTimeout(600);
    ok(await p.$$eval('#panel-de .uni-card', e => e.length) > 0 && (await p.textContent('#panel-de .uni-secilmis-yer .uni-katman-h')) === 'Rotaya uygun seçilmiş üniversiteler ve programlar', 'C4 Almanya: seçilmiş üniversiteler katmanı korunuyor');
    // C6 Tur 14 A4: ziyaretçide kart eylemleri kilitli, giriş sayfasına dönüş adresiyle gider (K4)
    await p.goto(URL('universiteler.html?ulke=de&duzey=lisans&dil=en')); await p.waitForSelector('.uni-tablo');
    const ge = await p.evaluate(() => { const a = document.querySelector('.uni-tablo [data-ilk-eposta]'); const l = document.querySelector('.uni-tablo [data-listem-kilit]');
      return { kim: a.dataset.ilkEposta, href: a.getAttribute('href'), kilit: a.classList.contains('is-kilitli') && !!a.querySelector('svg'), lhref: l.getAttribute('href'), not: !!document.querySelector('.uni-tablo .uni-eylem-not'), btn: !!document.querySelector('.uni-tablo .uni-listem') }; });
    ok(ge.kim === 'de-technical-university-of-munich' && ge.href === 'giris.html?donus=' + encodeURIComponent('yazismalar.html?uni=de-technical-university-of-munich&amac=ilk-iletisim') && ge.kilit && /^giris\.html\?donus=universiteler\.html%3Fulke%3Dde$/.test(ge.lhref) && ge.not && !ge.btn,
      'C6 ziyaretçi: İlk e-posta / Listeme ekle kilitli, giris.html?donus=yazismalar.html?uni=…&amac=ilk-iletisim', ge);
    await Promise.all([p.waitForURL(/giris\.html/), p.click('.uni-tablo [data-ilk-eposta]')]); await p.waitForTimeout(300);
    ok(await p.evaluate(() => !document.getElementById('auth-context').hidden && /Yazışmalarım/.test(document.getElementById('auth-context-text').textContent)), 'C6 giriş sayfası: "Yazışmalarım sayfasına döneceksin" bağlamı');
    // C7 oturumlu: İlk e-posta derin bağlantı, Listeme ekle panel deposuna (universitelerim) yazar, "Yalnızca listem" süzer
    {
      const c3 = await mk({}, { okul: 'Test Lisesi', sinif: '11', ogrenciModeli: 'lise', ulkeler: ['de'], aktifRota: 'de', egitimDili: 'en', tamamlandi: true });
      const q = await git(c3, 'universiteler.html?ulke=de&duzey=lisans&dil=en', 700);
      const href = await q.getAttribute('.uni-tablo [data-ilk-eposta]', 'href');
      const n0 = await q.$$eval('.uni-tablo tbody tr', r => r.length);
      await q.click('.uni-tablo .uni-listem');
      const st = await q.evaluate(() => ({ L: JSON.parse(localStorage.getItem('apmeberra:panel:v1')).universitelerim, pressed: document.querySelector('.uni-tablo .uni-listem').getAttribute('aria-pressed'), t: document.querySelector('.uni-tablo .uni-listem').textContent, say: document.querySelector('[data-listem-say]').textContent }));
      await q.check('[id$="-listem"]'); await q.waitForTimeout(150);
      const n1 = await q.$$eval('.uni-tablo tbody tr', r => r.length);
      await q.reload(); await q.waitForSelector('.uni-tablo');
      const kalici = await q.getAttribute('.uni-tablo .uni-listem[data-listem="de-technical-university-of-munich"]', 'aria-pressed');
      await q.click('.uni-tablo .uni-listem[data-listem="de-technical-university-of-munich"]');
      const bos = await q.evaluate(() => JSON.parse(localStorage.getItem('apmeberra:panel:v1')).universitelerim.length);
      ok(href === 'yazismalar.html?uni=de-technical-university-of-munich&amac=ilk-iletisim' && st.L.join() === 'de-technical-university-of-munich' && st.pressed === 'true' && /Listemde/.test(st.t) && st.say === '1' && n0 > 1 && n1 === 1 && kalici === 'true' && bos === 0,
        'C7 oturumlu: İlk e-posta derin bağlantısı, Listeme ekle → apmeberra:panel:v1.universitelerim, Yalnızca listem 1 satır, yenilemede kalıcı, tekrar basınca çıkar', { href, st, n0, n1, kalici, bos });
      await q.evaluate(() => localStorage.removeItem('apmeberra:panel:v1'));
      await c3.close();
    }
    // C8 kabul bilgileri listenin altında, açılır bölümlerde; eski çapa bölümü açar
    await p.goto(URL('universiteler.html?ulke=de#c-de-takvim')); await p.waitForTimeout(600);
    const ac = await p.evaluate(() => { const l = document.querySelector('#panel-de .uni-tablo'), k = document.getElementById('c-de-kabul'), t = document.getElementById('c-de-takvim'), u = document.getElementById('c-de-uniler');
      return { sira: l && k && u ? (l.compareDocumentPosition(u) & 4) && (u.compareDocumentPosition(k) & 4) : false, kabulKapali: k && k.tagName === 'DETAILS' && !k.open, takvimAcik: t && t.open }; });
    ok(ac.sira && ac.kabulKapali && ac.takvimAcik, 'C8 sıra: ilk 20 → seçilmiş üniversiteler → "kabul nasıl işler?" açılır bölümleri; #c-de-takvim çapası bölümü açtı', ac);
    for (const [w, sc] of [[360, 'light'], [360, 'dark']]) {
      const c2 = await mk({ viewport: { width: w, height: 800 }, colorScheme: sc });
      const q = await git(c2, 'universiteler.html?ulke=hu', 600);
      ok(await tasma(q) <= 0, `C5 360px ${sc}: üniversiteler taşma yok (15 sekme yatay kayar)`);
      await c2.close();
    }
    await ctx.close();
  }

  // =============================== D) Oturumlu üniversite mezunu ===============================
  {
    const UNI = { ogrenciModeli: 'uni-mezun', sinif: 'lisans-mezun', ulkeler: ['nl', 'de'], aktifRota: 'nl', egitimDili: 'en', hedefBaslangicYili: '2027', lisansAlani: 'Makine Mühendisliği', lisansDurumu: 'mezun', lisansMezuniyetYili: '2025', tamamlandi: true };
    const ctx = await mk({}, UNI);
    const p = await git(ctx, 'index.html', 700);
    const r = await p.evaluate(() => ({
      menu: [...document.querySelectorAll('#site-nav-links > li[data-nav]')].map(x => x.dataset.navLabel).join('|'),
      sinavHref: (document.querySelector('#site-nav-links li[data-nav="sinavlar"] > a') || {}).getAttribute ? document.querySelector('#site-nav-links li[data-nav="sinavlar"] > a').getAttribute('href') : null,
      benHref: (document.querySelector('#site-nav-links li[data-nav="ben"] > a') || {}).getAttribute ? document.querySelector('#site-nav-links li[data-nav="ben"] > a').getAttribute('href') : null,
      ap: [...document.querySelectorAll('#site-nav-links a')].some(a => /^ap-|deneme|ilerleme|seviye|sinav-cents/.test(a.getAttribute('href'))),
      yl: !document.getElementById('yl-panel') && /Yüksek lisans başvuru dosyan/.test(document.getElementById('bugun-serit').textContent), apGizli: [...document.querySelectorAll('[data-ap-bolum]')].every(s => getComputedStyle(s).display === 'none'),
      pill: document.getElementById('hello-pills').textContent, rota: document.getElementById('pr-title').textContent
    }));
    ok(r.menu === 'Bugün|Hedefim|Sınavlar|Başvuru|Ben' && r.sinavHref === 'sinavlar.html?model=uni-mezun' && r.benHref === 'profil.html' && !r.ap, 'D1 menü süzgeci (Tur 14 A1): Çalış yerine Sınavlar, Ben = profil; AP dersleri, Denemeler, İlerleme, Seviye testi, CEnT-S gizli', r);
    ok(r.yl && r.apGizli && /Üniversite mezunu/.test(r.pill) && /Hedef: Hollanda/.test(r.pill) && r.rota === 'Hollanda: genel yol haritası', 'D2 Bugün: YL şeridi (kart Hedefim › Şartlar\'da), AP bölümleri gizli, etiketler 15 ülkeyle', r);
    // Tur 14 A4: YL başvuru dosyası Şartlar'da; işaret rota durumuna (genel.belgeler) yazılır, Bugün şeridi güncellenir
    await p.goto(URL('sartlar.html?model=uni-mezun&ulke=nl&dil=en#yl-panel')); await p.waitForTimeout(600);
    const yl0 = await p.evaluate(() => ({ acik: document.getElementById('yl-panel').open, n: document.querySelectorAll('#yl-panel [data-yl-belge]').length, say: document.getElementById('yl-say').textContent }));
    await p.check('#yl-panel [data-yl-belge]');
    const yl1 = await p.evaluate(() => ({ say: document.getElementById('yl-say').textContent, st: JSON.parse(localStorage.getItem('apmeberra:rota:v1') || '{}') }));
    await p.goto(URL('index.html')); await p.waitForTimeout(500);
    const ser = await p.textContent('#bugun-serit');
    ok(yl0.acik && yl0.n > 0 && /^0 \//.test(yl0.say) && /^1 \//.test(yl1.say) && yl1.st.genel && Object.keys(yl1.st.genel.belgeler || {}).length === 1 && /1 \/ \d+ belge hazır/.test(ser), 'D2b YL dosyası Şartlar\'da (#yl-panel açık): işaret rota durumuna yazıldı, Bugün şeridi 1 / N', { yl0, yl1: yl1.say, ser });
    await p.evaluate(() => localStorage.removeItem('apmeberra:rota:v1'));
    await p.goto(URL('rota.html?ulke=nl')); await p.waitForSelector('.rota-genel-ozet');
    const ilk = await p.$eval('.rs-genel .rs-check', el => el.dataset.adim);
    await p.check('.rs-genel .rs-check');
    await p.waitForTimeout(300);
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem('apmeberra:rota:v1')));
    ok(st && st['nl-yl'] && st['nl-yl'].adimlar[ilk] && st['nl-yl'].adimlar[ilk].durum === 'yapildi' && !(st.nl && st.nl.adimlar[ilk]), 'D3 Rotam genel yol: "yapıldı" nl-yl anahtarına yazıldı (lisans durumundan ayrı)', st);
    await p.reload(); await p.waitForSelector('.rota-genel-ozet');
    ok(await p.isChecked('.rs-genel .rs-check[data-adim="' + ilk + '"]') && /1 \/ \d+ adım yapıldı/.test(await p.textContent('#rg-h')), 'D4 yenilemede işaret korunur, sayaç güncel');
    await p.goto(URL('rota.html?ulke=de')); await p.waitForSelector('.rota-genel-ozet');
    ok((await p.textContent('.rota-genel-ozet .uni-sub')).includes('Yüksek lisans'), 'D5 YL profilinde Almanya da genel yol haritası (tarihli lisans rotası değil)');
    await p.goto(URL('sartlar.html')); await p.waitForSelector('#sr-kendi');
    const aktif = await p.evaluate(k => JSON.parse(localStorage.getItem(k)).aktifRota, P + 'profil:utest'); // D5'te Rotam'da Almanya açıldı
    await p.click('#sr-kendi'); await p.waitForTimeout(500);
    ok(aktif === 'de' && rel(p.url()) === 'sartlar.html?model=uni-mezun&ulke=' + aktif + '&dil=en', 'D6 "Kendi profilime göre göster": profilin modeli, aktif rotası ve dili', rel(p.url()));
    for (const [w, sc] of [[1280, 'light'], [390, 'dark']]) {
      const c2 = await mk({ viewport: { width: w, height: 900 }, colorScheme: sc }, UNI);
      const q = await git(c2, 'index.html', 700);
      await q.screenshot({ path: path.join(SHOTS, `t11-panel-yl-${w}-${sc}.png`), fullPage: false });
      await q.goto(URL('rota.html?ulke=nl')); await q.waitForSelector('.rota-genel-ozet');
      ok(await tasma(q) <= 0, `D7 ${w}px ${sc}: Rotam genel yol taşma yok`);
      await q.screenshot({ path: path.join(SHOTS, `t11-rota-genel-${w}-${sc}.png`), fullPage: false });
      await q.evaluate(() => localStorage.clear());
      await c2.close();
    }
    await p.evaluate(() => localStorage.clear());
    await ctx.close();
  }

  // =============================== E) Profil sihirbazı (üniversite mezunu) ===============================
  {
    const ctx = await mk({}, true);
    const p = await git(ctx, 'profil.html?model=uni-mezun&ulke=se&dil=yerel', 500);
    ok(await p.isChecked('#wz-ogrenciModeli-group input[value="uni-mezun"]') && (await p.$$('.wizard-progress li')).length === 4, 'E1 sihirbaz 4 adım, durum adresten ön dolu');
    await p.screenshot({ path: path.join(SHOTS, 't11-sihirbaz-adim1-1280-light.png'), fullPage: true });
    await p.click('#wz-next');
    ok(await p.isHidden('#wz-okul-wrap') && await p.isVisible('#wz-uni') && await p.isVisible('#wz-mezun') && await p.isHidden('#wz-yerlesme') && await p.isHidden('#wz-sinif-wrap'), 'E2 YL ayrıntı: okul/sınıf/yerleşme yok, lisans bilgileri ve hedef yıl var');
    await p.click('#wz-next');
    ok((await p.textContent('#wz-lisansAlani-err')) !== '' && (await p.textContent('#wz-lisansDurumu-err')) === 'Lisans durumunu seç.', 'E3 boş lisans alanı ve durum: hata');
    await p.fill('#wz-lisansAlani', 'Elektrik-Elektronik Mühendisliği');
    ok((await p.textContent('#wz-lisansAlani-err')) === '', 'E4 yazınca hata temizlenir');
    await p.click('#wz-lisansDurumu-group label:has-text("Son sınıftayım")');
    ok((await p.textContent('#wz-lisansMezuniyetYili-label')) === 'Beklenen mezuniyet yılın', 'E5 son sınıf: yıl etiketi "Beklenen"');
    await p.fill('#wz-lisansMezuniyetYili', String(new Date().getFullYear() + 1)); await p.fill('#wz-gpa4', '3.1');
    await p.click('#wz-next'); await p.waitForSelector('#wz-step-3:not([hidden])');
    for (const u of ['de', 'it', 'at', 'nl', 'fi']) await p.click(`#wz-ulkeler-group input[value="${u}"] >> xpath=..`);
    ok((await p.$$eval('#wz-ulkeler-group input:checked', a => a.length)) === 5 && /En fazla 5/.test(await p.textContent('#wz-ulkeler-err')), 'E6 en fazla 5 ülke: altıncı geri alındı, uyarı');
    await p.click('#wz-next'); await p.waitForSelector('#wz-step-4:not([hidden])');
    ok(await p.isChecked('#wz-egitimDili-group input[value="yerel"]'), 'E7 eğitim dili adresten (yerel) ön dolu');
    await Promise.all([p.waitForURL(/universiteler\.html/), p.click('#wz-next')]);
    const prof = await p.evaluate(k => JSON.parse(localStorage.getItem(k)), P + 'profil:utest');
    ok(prof.ogrenciModeli === 'uni-mezun' && prof.sinif === 'lisans-mezun' && prof.lisansDurumu === 'son-sinif' && prof.gpa4 === '3.1' && prof.egitimDili === 'yerel' && prof.ulkeler.length === 5 && !('okul' in prof), 'E8 profil kaydı (YL)', prof);
    await p.evaluate(() => localStorage.clear());
    await ctx.close();
  }

  // =============================== F) Ekran görüntüleri ve taşma ===============================
  for (const [w, sc] of [[1280, 'light'], [1280, 'dark'], [390, 'light'], [390, 'dark']]) {
    const ctx = await mk({ viewport: { width: w, height: 900 }, colorScheme: sc });
    for (const [f, ad] of [['sartlar.html', 'sartlar-giris'], ['sartlar.html?model=lise&sinif=11&ulke=de&dil=en', 'sartlar-de11'], ['sartlar.html?model=lise-mezun&ulke=hu&dil=en', 'sartlar-hu-mezun'], ['sartlar.html?model=uni-mezun&ulke=nl&dil=yerel', 'sartlar-nl-yl'], ['universiteler.html?ulke=nl', 'universiteler-nl']]) {
      const p = await git(ctx, f, 700);
      if (w === 390) ok(await tasma(p) <= 0, `F ${w}px ${sc} ${ad}: taşma yok`);
      await p.screenshot({ path: path.join(SHOTS, `t11-${ad}-${w}-${sc}.png`), fullPage: ad !== 'sartlar-de11' });
      await p.close();
    }
    await ctx.close();
  }
  for (const sc of ['light', 'dark']) {
    const ctx = await mk({ viewport: { width: 360, height: 780 }, colorScheme: sc });
    for (const f of ['sartlar.html', 'sartlar.html?model=lise&sinif=9&ulke=ch&dil=yerel', 'sartlar.html?model=uni-mezun&ulke=ie&dil=en', 'universiteler.html?ulke=cz&duzey=yl&dil=en', 'mezun.html?ulke=hu']) {
      const p = await git(ctx, f, 700);
      ok(await tasma(p) <= 0, `F 360px ${sc} ${f}: taşma yok`);
      await p.close();
    }
    await ctx.close();
  }

  // =============================== G) Tam veri (PM aktarımı) ve PM'in istediği ekranlar ===============================
  {
    const ctx = await mk();
    const p = await git(ctx, 'sartlar.html?model=lise&sinif=11&ulke=de&dil=en', 800);
    const say = () => p.evaluate(() => ({ n: document.querySelectorAll('.sr-grid:not(.sr-grid-ek) .sr-item').length, ids: [...document.querySelectorAll('.sr-grid .sr-item')].map(li => li.id.replace(/^m-/, '')), bant: (document.querySelector('[data-bant="kisitli"]') || {}).textContent || '', durum: (document.querySelector('.sr-facts .pd-rozet') || {}).textContent }));
    const en = await say();
    const beklenen = await p.evaluate(() => { const B = APMEBERRA_SARTLAR_MOTOR.ulkeBolumleri(APMEBERRA_ULKE_VERI.de, { model: 'lise', sinif: '11', ulke: 'de', dil: 'en' }); return ['gerekenler', 'buYil', 'tarihler', 'hatalar'].reduce((n, k) => n + B[k].length, 0); });
    ok(en.n === beklenen && en.n > 0 && /Kısıtlı/.test(en.durum) && /en az 3 program/.test(en.bant), 'G1 lise·11·de·en: ' + en.n + ' madde, özet "Kısıtlı" (PM kuralı), bant var/kısıtlı sayılarıyla', { n: en.n, durum: en.durum, bant: en.bant.trim() });
    await p.click('.sr-dil-gec'); await p.waitForFunction(() => /dil=yerel/.test(location.search)); await p.waitForTimeout(500);
    const yr = await say();
    const enAlanli = await p.evaluate(() => { const V = APMEBERRA_ULKE_VERI.de.lisans, l = []; (function g(o) { if (Array.isArray(o)) o.forEach(g); else if (o && typeof o === 'object') { if (o.metin && o.dil === 'en') l.push(o.id); else Object.values(o).forEach(g); } })(V); return l; });
    ok(yr.n > 0 && !yr.ids.some(id => enAlanli.indexOf(id) >= 0) && en.ids.some(id => enAlanli.indexOf(id) >= 0) && (await h1(p)).startsWith('Almanya’da Almanca lisans'), 'G2 lise·11·de·yerel: ' + yr.n + ' madde; "en" maddeleri düştü (' + enAlanli.length + ' en alanlı madde), başlık Almanca');
    await ctx.close();
    for (const [w, sc] of [[1280, 'light'], [390, 'light'], [1280, 'dark'], [390, 'dark']]) {
      const c2 = await mk({ viewport: { width: w, height: 900 }, colorScheme: sc });
      for (const [f, ad] of [['sartlar.html?model=lise&sinif=11&ulke=de&dil=en', 'pm-lise-11-de-en'], ['sartlar.html?model=lise&sinif=11&ulke=de&dil=yerel', 'pm-lise-11-de-yerel'],
        ['sartlar.html?model=uni-mezun&ulke=se&dil=en', 'pm-uni-mezun-se-en'], ['sartlar.html?model=lise-mezun&ulke=nl&dil=en', 'pm-lise-mezun-nl-en'], ['universiteler.html?ulke=de&duzey=lisans&dil=en', 'pm-universiteler-de-lisans-en']]) {
        const q = await git(c2, f, 900);
        ok(await tasma(q) <= 0, `G3 ${w}px ${sc} ${ad}: taşma yok`);
        await q.screenshot({ path: path.join(SHOTS, `t11-${ad}-${w}-${sc}.png`), fullPage: false });
        if (sc === 'light') await q.screenshot({ path: path.join(SHOTS, `t11-${ad}-${w}-${sc}-tam.png`), fullPage: true });
        await q.close();
      }
      await c2.close();
    }
  }

  ok(errs.length === 0, 'konsol/sayfa hatası ve uyarısı yok', errs);
  await b.close();
  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi.`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
