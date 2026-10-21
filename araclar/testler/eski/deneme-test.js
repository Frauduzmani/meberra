// Deneme Sınavı (deneme.html) — uçtan uca test (araclar/testler düzeni: playwright-core + sabit Chromium yolu)
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const URL = f => 'file:///C:/Users/hp/Desktop/projelerim/AP%20MEBERRA/' + f;
const SHOTS = path.resolve(__dirname, '../shots');
fs.mkdirSync(SHOTS, { recursive: true });
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const KEY = 'apmeberra:deneme:v1';

// Bankayı node tarafında da yükle (beklenen değerleri bağımsız hesaplamak için)
global.window = {};
require('C:/Users/hp/Desktop/projelerim/AP MEBERRA/data/sorular/deneme-bankasi.js');
const BANK = global.window.APMEBERRA_DENEME_BANKASI;
const BY = {}; BANK.sorular.forEach(q => { BY[q.sayfa + '|' + q.id] = q; });
const correctOf = k => BY[k].options.find(o => o.isCorrect).id;

async function noOverflow(p, label) {
  const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: window.innerWidth }));
  ok(r.sw <= r.w, `${label}: yatay taşma yok (${r.sw} <= ${r.w})`);
}
async function state(p) { return p.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), KEY); }
// Test hesabı + oturum (app.js oturum koruması: apmeberra-hesap:v1:{kullanicilar,oturum,aktif,profil:<id>})
const SEED_SESSION = () => {
  try {
    if (localStorage.getItem("apmeberra-hesap:v1:oturum")) return;
    const id = "u_test_deneme";
    localStorage.setItem("apmeberra-hesap:v1:kullanicilar", JSON.stringify([{ id, ad: "Test", soyad: "Deneme", kullaniciAdi: "testdeneme", salt: "00", hash: "00", iter: 150000, olusturma: new Date().toISOString() }]));
    localStorage.setItem("apmeberra-hesap:v1:oturum", JSON.stringify({ id, baslangic: new Date().toISOString() }));
    localStorage.setItem("apmeberra-hesap:v1:aktif", JSON.stringify(id));
    localStorage.setItem("apmeberra-hesap:v1:profil:" + id, JSON.stringify({ okul: "Test Lisesi", sinif: "11", ulkeler: ["de", "it"], tamamlandi: true, guncelleme: new Date().toISOString() }));
  } catch (e) {}
};
// Oturum koruması varsa (app.js → giris.html) test hesabıyla geç
async function ensureSession(p) {
  if (!/giris\.html|profil\.html/.test(p.url())) return false;
  console.log('INFO oturum koruması algılandı: ' + p.url());
  return true;
}

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  await ctx.addInitScript(SEED_SESSION);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());

  await p.goto(URL('deneme.html'));
  if (await ensureSession(p)) { console.log('FAIL oturum koruması — test hesabı adımı eklenmeli'); process.exit(1); }
  await p.evaluate(() => { Object.keys(localStorage).filter(k => k.startsWith('apmeberra:') && k !== 'apmeberra:theme').forEach(k => localStorage.removeItem(k)); });
  await p.reload();
  await p.waitForSelector('.dn-card');

  // 1) Giriş ekranı
  const cards = await p.$$eval('.dn-card', els => els.map(e => e.querySelector('.dn-card-title').textContent));
  ok(cards.length === Object.keys(BANK.kodlar).length, `ders kartı sayısı ${cards.length} = kod sayısı ${Object.keys(BANK.kodlar).length}`);
  ok(await p.$('#dn-genel-title') !== null && (await p.$$('#dn-setup input[name="ders"]')).length === cards.length, 'Genel deneme bölümü ve ders checkbox\'ları var');
  await noOverflow(p, 'masaüstü giriş');
  await p.screenshot({ path: path.join(SHOTS, 'deneme-1-giris-masaustu.png'), fullPage: true });

  // Seçim algoritması: tohum belirleyici, üniteler dengeli
  const sel = await p.evaluate(() => {
    const D = window.APMEBERRA_DENEME;
    const a = D.selectQuestions({ kod: 'calculus-ab', adet: 16, uniteFiltre: null }, 12345).map(x => x.k);
    const b2 = D.selectQuestions({ kod: 'calculus-ab', adet: 16, uniteFiltre: null }, 12345).map(x => x.k);
    const c = D.selectQuestions({ kod: 'calculus-ab', adet: 16, uniteFiltre: null }, 999).map(x => x.k);
    const f = D.selectQuestions({ kod: 'physics-1', adet: 10, uniteFiltre: ['1', '4'] }, 7).map(x => x.k);
    const g = D.selectQuestions({ kod: 'genel', adet: 14, dersler: ['calculus-ab', 'calculus-bc', 'biology'] }, 5);
    return { a, b2, c, f, g };
  });
  ok(JSON.stringify(sel.a) === JSON.stringify(sel.b2), 'aynı tohum → aynı soru listesi');
  ok(JSON.stringify(sel.a) !== JSON.stringify(sel.c), 'farklı tohum → farklı liste');
  const unitCount = {}; sel.a.forEach(k => { unitCount[BY[k].unite] = (unitCount[BY[k].unite] || 0) + 1; });
  ok(Object.keys(unitCount).length === 8 && Object.values(unitCount).every(n => n === 2), 'Calculus AB 16 soru → 8 ünite × 2 (dengeli) ' + JSON.stringify(unitCount));
  ok(sel.a.every(k => !/BC ONLY/i.test(BY[k].topic + BY[k].source)), 'AB denemesinde BC-only soru yok');
  ok(sel.f.length === 10 && sel.f.every(k => ['1', '4'].includes(BY[k].unite)), 'ünite filtresi (Physics 1: Unit 1,4) uygulanıyor');
  ok(new Set(sel.g.map(x => x.k)).size === sel.g.length, 'genel denemede tekrar eden soru yok (AB ⊂ BC)');

  // 2) ?ders=calculus-ab kurulum → 10 soru, tempo
  await p.goto(URL('deneme.html?ders=calculus-ab'));
  await p.waitForSelector('#dn-setup');
  ok((await p.textContent('h1')).includes('Calculus AB'), '?ders=calculus-ab kurulumu açtı');
  await p.check('input[name="adet"][value="10"]');
  const sumTxt = await p.textContent('#dn-sum');
  ok(/10 soru/.test(sumTxt) && /23:49/.test(sumTxt), 'özet: 10 soru · 23:49 (10 × 100dk/42) — ' + sumTxt.trim());
  await p.screenshot({ path: path.join(SHOTS, 'deneme-2-kurulum-masaustu.png'), fullPage: true });
  await p.click('#dn-start');
  await p.waitForSelector('#dn-exam');
  ok((await p.$$('#dn-stage .dn-opt')).length === 4, 'sınav ekranı: 4 şık');
  const t0 = await p.textContent('#dn-timer');
  ok(/^2[34]:\d\d$/.test(t0), 'zamanlayıcı geri sayıyor: ' + t0);

  // Cevapla: 1→A (klavye), 2→B (tık), 3→işaretle (M), 4→C (tuş 3)
  await p.keyboard.press('a');
  ok(await p.getAttribute('#dn-stage .dn-opt[data-opt="A"]', 'aria-pressed') === 'true', 'A tuşu şıkkı seçti');
  ok(await p.$('#dn-stage .option-btn.correct, #dn-stage .option-btn.wrong, .feedback-box') === null, 'sınav sırasında doğru/yanlış geri bildirimi YOK');
  await p.keyboard.press('ArrowRight');
  await p.click('#dn-stage .dn-opt[data-opt="B"]');
  await p.click('#dn-next');
  await p.keyboard.press('m');
  ok(await p.getAttribute('#dn-mark', 'aria-pressed') === 'true', 'M ile işaretlendi');
  await p.keyboard.press('ArrowRight');
  await p.keyboard.press('3');
  let st = await state(p);
  ok(st.aktif && st.aktif.mevcut === 3 && st.aktif.cevaplar['0'] === 'A' && st.aktif.cevaplar['1'] === 'B' && st.aktif.cevaplar['3'] === 'C' && st.aktif.isaretli['2'], 'aktif durum kaydedildi (cevaplar + işaret + mevcut)');
  ok(typeof st.aktif.seed === 'number' && st.aktif.sorular.length === 10, 'aktif: seed ve 10 soru');
  await p.waitForTimeout(1500);

  // 3) Yenile → devam
  await p.reload();
  await p.waitForSelector('#dn-exam');
  ok((await p.textContent('#dn-q-title')).trim() === 'Soru 4 / 10', 'yenileme sonrası kaldığı sorudan devam: ' + (await p.textContent('#dn-q-title')).trim());
  ok(await p.getAttribute('#dn-stage .dn-opt[data-opt="C"]', 'aria-pressed') === 'true', 'yenileme sonrası seçim korunuyor');
  st = await state(p);
  ok(st.aktif.gecenSn > 0.5, 'geçen süre birikti: ' + st.aktif.gecenSn.toFixed(1) + ' sn');
  await p.screenshot({ path: path.join(SHOTS, 'deneme-3-sinav-masaustu.png'), fullPage: false });

  // 4) Gezgin ızgarası
  await p.keyboard.press('g');
  await p.waitForSelector('#dn-nav:not([hidden])');
  const cells = await p.$$eval('.dn-cell', els => els.map(e => e.className));
  ok(cells.length === 10 && cells[0].includes('is-answered') && cells[2].includes('is-marked') && cells[3].includes('is-current') && !cells[4].includes('is-answered'), 'ızgara durumları doğru');
  await p.screenshot({ path: path.join(SHOTS, 'deneme-4-gezgin-masaustu.png'), fullPage: false });
  await p.click('.dn-cell[data-i="1"]');
  ok((await p.textContent('#dn-q-title')).trim() === 'Soru 2 / 10', 'ızgaradan soruya atlama');

  // 5) Teslim
  await p.click('#dn-review-open');
  ok(/7<\/strong> boş/.test(await p.innerHTML('#dn-confirm')), 'teslim öncesi özet: 7 boş');
  await p.click('#dn-submit');
  await p.waitForSelector('.dn-stats');
  st = await state(p);
  ok(st.aktif === null && st.gecmis.length === 1, 'teslim: aktif=null, geçmişte 1 kayıt');
  const rec = st.gecmis[0];
  const ans = { 0: 'A', 1: 'B', 3: 'C' };
  let expD = 0, expY = 0;
  rec.inceleme.forEach((it, i) => { if (ans[i]) { if (correctOf(it.k) === ans[i]) expD++; else expY++; } });
  ok(rec.dogru === expD && rec.yanlis === expY && rec.bos === 7 && rec.soruSayisi === 10, `sonuç sayıları bağımsız hesapla eşleşiyor (D${rec.dogru} Y${rec.yanlis} B${rec.bos})`);
  ok(rec.yuzde === Math.round(expD / 10 * 100), 'yüzde doğru');
  const keys = ['id', 'kod', 'ad', 'tarih', 'soruSayisi', 'dogru', 'yanlis', 'bos', 'yuzde', 'sureSn', 'tahminiBand', 'uniteler', 'seed'];
  ok(keys.every(k => k in rec), 'geçmiş kaydında şema alanları tam');
  ok(Object.values(rec.uniteler).reduce((s, u) => s + u.soru, 0) === 10, 'ünite tablosu toplamı 10');
  ok(rec.sureSn >= 1, 'geçen süre kaydedildi: ' + rec.sureSn + ' sn');
  const bodyTxt = await p.textContent('#dn-view');
  ok(bodyTxt.includes('Tahmini — resmi ölçekleme değildir; yalnız MCQ'), 'tahmini bant uyarısı görünür');
  ok(/yaklaşık/.test(bodyTxt), 'eşikler "yaklaşık" etiketli');
  const errs2 = await p.evaluate(() => JSON.parse(localStorage.getItem('apmeberra:errors:v1') || 'null'));
  const errItems = errs2 ? Object.values(errs2.items) : [];
  ok(errItems.length === expY && errItems.every(e => e.page === 'ap-calculus' && e.unit && /-quiz-container$/.test(e.unit) && e.selected && e.correct && e.errorTag && e.count === 1 && e.resolved === false), `Hata Defteri: ${errItems.length} yanlış app.js biçiminde yazıldı`);
  ok(p.url().includes('sonuc='), 'URL sonuç kaydını gösteriyor');

  // İnceleme: ilk yanlış ya da ilk soru
  const wrongIdx = rec.inceleme.findIndex((it, i) => ans[i] && correctOf(it.k) !== ans[i]);
  const openIdx = wrongIdx >= 0 ? wrongIdx : 0;
  await p.click(`details.dn-rev[data-i="${openIdx}"] > summary`);
  await p.waitForSelector(`details.dn-rev[data-i="${openIdx}"] .solution-panel`);
  const revHtml = await p.innerHTML(`details.dn-rev[data-i="${openIdx}"] .dn-rev-body`);
  ok(/is-correct/.test(revHtml) && /Ders sayfasında bu soru/.test(revHtml) && /#q-card-/.test(revHtml), 'inceleme: doğru şık, çözüm, ders sayfası bağlantısı');
  if (wrongIdx >= 0) {
    const q = BY[rec.inceleme[wrongIdx].k], so = q.options.find(o => o.id === ans[wrongIdx]);
    ok(revHtml.includes('remediation-panel') && /is-chosen/.test(revHtml), 'inceleme: yanlış şıkkın remediation paneli (' + so.errorTag.slice(0, 40) + '…)');
  }
  await p.click('.dn-filter .chip[data-f="bos"]');
  ok((await p.$$('details.dn-rev')).length === 7, 'filtre "Boş" → 7 soru');
  await p.click('.dn-filter .chip[data-f="isaretli"]');
  ok((await p.$$('details.dn-rev')).length === 1, 'filtre "İşaretli" → 1 soru');
  await p.click('.dn-filter .chip[data-f="tumu"]');
  await p.click(`details.dn-rev[data-i="${openIdx}"] > summary`).catch(() => {});
  await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(SHOTS, 'deneme-5-sonuc-masaustu.png'), fullPage: true });

  // 6) English: süre bitince otomatik teslim + pasaj
  await p.goto(URL('deneme.html?ders=english-language'));
  await p.check('input[name="adet"][value="10"]');
  await p.click('#dn-start');
  await p.waitForSelector('#dn-exam');
  ok(await p.$('.dn-passage .dn-passage-body p') !== null, 'English: pasaj soru yanında gösteriliyor');
  await p.screenshot({ path: path.join(SHOTS, 'deneme-6-english-pasaj-masaustu.png'), fullPage: false });
  await p.keyboard.press('b');
  // Sayfa kapanırken (pagehide) durum kaydedilir; sonra başka bir file:// belgesinde süreyi sona yaklaştır
  await p.goto(URL("assets/css/styles.css"));
  await p.evaluate(k => { const d = JSON.parse(localStorage.getItem(k)); d.aktif.gecenSn = d.aktif.sureLimitSn - 2; localStorage.setItem(k, JSON.stringify(d)); }, KEY);
  await p.goto(URL("deneme.html"));
  await p.waitForSelector('.dn-stats', { timeout: 8000 });
  st = await state(p);
  ok(st.gecmis.length === 2 && st.gecmis[0].kod === 'english-language' && st.gecmis[0].otomatikTeslim === true && st.aktif === null, 'süre bitince otomatik teslim');
  ok((await p.textContent('#dn-view')).includes('otomatik teslim'), 'otomatik teslim uyarısı görünür');

  // 7) Genel deneme (girişten, süresiz)
  await p.goto(URL('deneme.html'));
  await p.waitForSelector('#dn-genel-title');
  ok((await p.$$('.dn-hist tbody tr')).length === 2 && (await p.$$('.dn-spark-svg')).length === 2, 'geçmiş tablosu 2 kayıt + 2 mini grafik');
  await p.check('#dn-setup input[name="adet"][value="10"]');
  await p.check('#dn-setup input[name="sure"][value="suresiz"]');
  await p.click('#dn-start');
  await p.waitForSelector('#dn-exam');
  ok(/geçti/.test(await p.textContent('#dn-timer')), 'süresiz modda geçen süre gösteriliyor');
  ok(await p.$('.dn-q-course') !== null, 'genel denemede ders etiketi');
  for (let i = 0; i < 10; i++) { await p.keyboard.press('a'); await p.keyboard.press('ArrowRight'); }
  await p.click('#dn-review-open'); await p.click('#dn-submit');
  await p.waitForSelector('.dn-stats');
  st = await state(p);
  ok(st.gecmis[0].kod === 'genel' && st.gecmis[0].tahminiBand === null && st.gecmis[0].bos === 0, 'genel deneme kaydı (bant=null, ders bazında gösterim)');
  ok(Object.keys(st.gecmis[0].uniteler).every(k => k.includes('|')), 'uniteler anahtarı "kod|unite"');

  // 8) Geçmişten inceleme açma
  await p.goto(URL('deneme.html'));
  await p.click('.dn-hist button[data-open]');
  await p.waitForSelector('.dn-stats');
  ok((await p.textContent('h1')).includes('Genel'), 'geçmişten sonuç ekranı açılıyor');

  // 9) Telefon 390 px (koyu tema) + 360 px
  for (const [w, scheme] of [[390, 'dark'], [360, 'light']]) {
    const c2 = await b.newContext({ viewport: { width: w, height: 844 }, colorScheme: scheme, deviceScaleFactor: 2 });
    await c2.addInitScript(SEED_SESSION);
    const m = await c2.newPage();
    m.on('pageerror', e => errs.push(e.message));
    m.on('dialog', d => d.accept());
    await m.goto(URL('deneme.html'));
    await m.evaluate(s => localStorage.setItem('apmeberra:deneme:v1', s), JSON.stringify(st));
    await m.reload(); await m.waitForSelector('.dn-card');
    await noOverflow(m, `${w}px giriş`);
    if (w === 390) await m.screenshot({ path: path.join(SHOTS, 'deneme-7-giris-390-koyu.png'), fullPage: true });
    await m.goto(URL('deneme.html?ders=physics-1'));
    await m.waitForSelector('#dn-setup');
    await noOverflow(m, `${w}px kurulum`);
    if (w === 390) await m.screenshot({ path: path.join(SHOTS, 'deneme-8-kurulum-390-koyu.png'), fullPage: true });
    await m.check('input[name="adet"][value="10"]');
    await m.click('#dn-start'); await m.waitForSelector('#dn-exam');
    await m.waitForTimeout(1500);
    await noOverflow(m, `${w}px sınav`);
    if (w === 390) await m.screenshot({ path: path.join(SHOTS, 'deneme-9-sinav-390-koyu.png'), fullPage: false });
    await m.click('#dn-stage .dn-opt[data-opt="D"]');
    await m.click('#dn-review-open');
    await noOverflow(m, `${w}px gezgin`);
    await m.click('#dn-submit'); await m.waitForSelector('.dn-stats');
    await m.click('details.dn-rev[data-i="0"] > summary');
    await m.waitForTimeout(1200);
    await noOverflow(m, `${w}px sonuç`);
    if (w === 390) await m.screenshot({ path: path.join(SHOTS, 'deneme-10-sonuc-390-koyu.png'), fullPage: true });
    await c2.close();
  }

  ok(errs.length === 0, 'sayfa hatası yok' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(fail ? `\n${fail} TEST BAŞARISIZ` : '\nTÜM TESTLER GEÇTİ');
  process.exitCode = fail ? 1 : 0;
})();
