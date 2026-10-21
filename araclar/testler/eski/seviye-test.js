// Seviye Testi + Sınav Hazırlık Raporu — uçtan uca test
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const URL = f => 'file:///C:/Users/hp/Desktop/projelerim/AP%20MEBERRA/' + f;
const SHOTS = path.resolve(__dirname, '../shots');
const DL = path.resolve(__dirname, '../dl-seviye');
fs.mkdirSync(DL, { recursive: true });
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const near = (a, b) => Math.abs(a - b) < 0.01;
const TODAY = new Date('2026-10-07T10:00:00');
const KEY = 'apmeberra:seviye:v1';

// Takvime müdahale: _ornek için tarih ekle, physics-1 tarihini null yap (yalnızca bu test sayfasında)
const patchTakvim = (opts) => {
  let v;
  Object.defineProperty(window, 'APMEBERRA_TAKVIM', {
    configurable: true,
    get() { return v; },
    set(x) {
      v = x;
      if (opts.ornekTarih) x.sinavlar._ornek = { ad: 'ÖRNEK', tarih: opts.ornekTarih, kaynak: null };
      if (opts.physNull && x.sinavlar['physics-1']) x.sinavlar['physics-1'].tarih = null;
      if (opts.bosGerek) x.gereklilikler = [];
    }
  });
};

async function answerOrnek(p, plan) {
  // plan: dizi; 'skip' ya da harf
  for (const a of plan) {
    if (a === 'skip') await p.keyboard.press('0');
    else { await p.keyboard.press(a.toLowerCase()); await p.keyboard.press('Enter'); }
    await p.waitForTimeout(120);
  }
}

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light', acceptDownloads: true }); await require('./oturum-tohum')(ctx);
  const p = await ctx.newPage();
  await p.clock.setFixedTime(TODAY);
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });

  // ---------- 0) Ana sayfa önerisi ----------
  await p.goto(URL('index.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const todo = await p.textContent('#todo-list');
  ok(todo.includes('Seviye testini çöz') && todo.includes('37 gün kaldı'), 'index: "Seviye testini çöz" önerisi, 37 gün kaldı');
  ok(await p.evaluate(() => document.querySelector('#todo-list li a').getAttribute('href') === 'seviye-testi.html'), 'index: öneri listenin başında (≤60 gün)');
  ok((await p.locator('.nav-links a[href="calis.html"]').count()) > 0, 'ortak menüde Çalış (calis.html) bağlantısı');
  await p.goto(URL('calis.html')); await p.waitForTimeout(300);
  ok((await p.locator('#co-seviye[href="seviye-testi.html"]').count()) === 1, 'Çalış merkezinde Seviye testi kartı (Tur 14 A6)');

  // ---------- 1) Başlangıç ekranı ----------
  await p.goto(URL('seviye-testi.html?ornek=1')); await p.waitForSelector('body[data-sv-hazir]');
  ok(await p.isVisible('#sv-start'), 'başlangıç ekranı görünür');
  ok((await p.textContent('#sv-deadline')).includes('37'), 'kayıt son gününe 37 gün');
  ok(await p.$('input[value="_ornek"]') !== null, '?ornek=1 ile ÖRNEK ders yüklendi');
  // Calculus: yalnızca biri
  const calcAB = await p.$('input[name="sv-calc"][value="calculus-ab"]');
  if (calcAB && !(await calcAB.isDisabled())) {
    await p.check('input[name="sv-calc"][value="calculus-ab"]');
    await p.check('input[name="sv-calc"][value="calculus-bc"]');
    ok(await p.evaluate(() => document.querySelectorAll('input[name="sv-calc"]:checked').length === 1 && document.querySelector('input[name="sv-calc"]:checked').value === 'calculus-bc'), 'Calculus AB/BC: yalnızca biri seçilebilir');
    const est = await p.evaluate(() => { const B = window.APMEBERRA_SEVIYE['calculus-bc']; return Math.max(1, Math.round(B.sorular.reduce((s, q) => s + (q.sureSn || 90), 0) / 60)); });
    ok((await p.textContent('#sv-estimate')).includes('~' + est + ' dakika'), 'tahmini süre = sureSn toplamı (' + est + ' dk)');
    await p.check('input[name="sv-calc"][value=""]');
  } else ok(true, 'calculus dosyası yok — atlandı');
  // Eksik dosya: başka bir sayfada bir dosyayı engelle
  ok(!(await p.isEnabled('#sv-start-btn')), 'ders seçilmeden Başlat pasif');
  await p.fill('#sv-hours', '25');
  ok((await p.textContent('#sv-hours-msg')).includes('5 ile 18'), 'haftalık saat 18 üstü uyarısı');
  await p.fill('#sv-hours', '15');
  await p.check('input[value="_ornek"]');
  ok((await p.textContent('#sv-estimate')).includes('~9 dakika'), 'ÖRNEK tahmini süre 9 dk (540 sn)');
  await p.screenshot({ path: `${SHOTS}/seviye-baslangic-desktop-light.png`, fullPage: true });

  // ---------- 2) Test: 3 cevap, yenile, devam ----------
  await p.click('#sv-start-btn');
  await p.waitForSelector('#sv-test:not([hidden])');
  ok(await p.evaluate(() => !document.querySelector('.feedback-box, .correct, .wrong')), 'test sırasında doğru/yanlış gösterilmiyor');
  await p.waitForTimeout(1500);
  const mj = await p.$$eval('#sv-q-card mjx-container', e => e.length);
  console.log('    MathJax formül sayısı (soru 1):', mj);
  await answerOrnek(p, ['A', 'skip', 'D']);
  ok((await p.textContent('#sv-test-pos')).includes('Genel 4/6'), '3 soru sonra 4. soruda');
  ok((await p.textContent('#sv-live')).length > 0, 'aria-live duyurusu var');
  const saved = await p.evaluate(k => JSON.parse(localStorage.getItem(k)).devam, KEY);
  ok(saved.idx === 3 && saved.cevaplar['_ornek|sv_ornek_u1_1'] === 'A' && saved.cevaplar['_ornek|sv_ornek_u1_2'] === null, 'localStorage: ilerleme ve atlanan (null) kaydedildi');
  await p.screenshot({ path: `${SHOTS}/seviye-test-desktop-light.png`, fullPage: false });
  await p.reload(); await p.waitForSelector('body[data-sv-hazir]');
  ok(await p.isVisible('#sv-resume-btn'), 'yenileme sonrası "Kaldığın yerden devam et"');
  await p.click('#sv-resume-btn');
  ok((await p.textContent('#sv-test-pos')).includes('Genel 4/6'), 'devam: 4. sorudan sürüyor');
  // Önceki ile geri gidip seçimin korunduğunu gör
  await p.click('#sv-prev');
  ok(await p.isChecked('input[name="sv-opt"][value="D"]'), 'önceki soruda seçilen şık korunuyor');
  await p.click('#sv-next');
  await answerOrnek(p, ['D', 'B', 'B']);
  await p.waitForSelector('#sv-report:not([hidden])');
  await p.waitForTimeout(1200);

  // ---------- 3) Rapor: skorlar ----------
  ok(await p.evaluate(() => document.activeElement && document.activeElement.id === 'sv-report-title'), 'odak rapor başlığına taşındı');
  ok((await p.textContent('#sv-report .sv-disclaimer')).includes('Bu rapor AP puanı tahmini değildir'), 'rapor üstünde uyarı');
  for (const id of ['sv-a', 'sv-b', 'sv-c', 'sv-d', 'sv-e', 'sv-f', 'sv-g']) ok(await p.isVisible('#' + id), 'bölüm görünür: ' + id);
  const rows = await p.$$eval('.sv-course-block[data-ders="_ornek"] tr[data-unite]', rs => rs.map(r => ({ u: r.dataset.unite, s: +r.dataset.skor, b: r.dataset.bant })));
  // El hesabı: U1 = easy doğru (1) / (1+1.5+2) = 22.22 → kırmızı; U2 = easy 1 + hard 2 = 3/4.5 = 66.67 → sarı
  ok(rows.length === 2 && near(rows[0].s, 22.22) && rows[0].b === 'kirmizi', 'Ünite 1: %22,22 Kırmızı (' + JSON.stringify(rows[0]) + ')');
  ok(near(rows[1].s, 66.67) && rows[1].b === 'sari', 'Ünite 2: %66,67 Sarı (' + JSON.stringify(rows[1]) + ')');
  const rep = await p.evaluate(k => JSON.parse(localStorage.getItem(k)).raporlar[0], KEY);
  const so = rep.sonuclar._ornek;
  ok(near(so.skor, 400 / 9) && so.bant === 'kirmizi' && so.dogru === 3 && so.yanlis === 2 && so.cevapsiz === 1, `genel skor 4/9=%44,4 Kırmızı; 3D 2Y 1C (${so.skor.toFixed(2)})`);
  ok(JSON.stringify(so.liste) === JSON.stringify({ yanlis: ['sv_ornek_u1_3', 'sv_ornek_u2_2'], cevapsiz: ['sv_ornek_u1_2'] }), 'yanlış/cevapsız listesi doğru');
  ok((await p.textContent('.sv-course-block[data-ders="_ornek"]')).includes('1 cevapsız'), 'cevapsız ayrıca gösteriliyor');
  ok((await p.textContent('.sv-course-block tr[data-unite="2"]')).includes('ek kaynak gerekir'), 'portalda olmayan ünite: ek kaynak gerekir');
  ok((await p.textContent('.sv-course-block tr[data-unite="1"]')).includes('İçerik var'), 'portalda olan ünite: İçerik var');
  // Tarih null
  ok((await p.textContent('#sv-exam-table tr[data-ders="_ornek"]')).includes('tarih doğrulanmadı'), 'tarihi olmayan ders: "tarih doğrulanmadı" (özet)');
  ok(await p.getAttribute('#sv-feas-table tr[data-ders="_ornek"]', 'data-durum') === 'tarihyok', 'fizibilite: tarihsiz derste hesap yapılmadı');
  ok((await p.textContent('.sv-decision[data-ders="_ornek"]')).includes('sınav tarihi'), 'karar: tarih bekleniyor');
  // Öncelik: U2 (ağırlık bilinmiyor → eşit pay 50 × 0.333 = 16.7) vs U1 (11 × 0.778 = 8.6)
  const pr = await p.$$eval('#sv-priority li', l => l.map(x => x.dataset.unite));
  ok(JSON.stringify(pr) === '["2","1"]', 'öncelik sıralaması ağırlık × açık oranı: ' + pr.join(','));
  ok(await p.$('#sv-priority li[data-unite="1"] a[href="ap-calculus.html"]') !== null, 'portalda olan ünite için bağlantı');
  // Yanlışlar katlanabilir
  ok(!(await p.isVisible('.sv-wrong[data-qid="sv_ornek_u1_3"] .solution-panel')), 'yanlış sorular başlangıçta kapalı');
  await p.click('.sv-wrong-course[data-ders="_ornek"] > summary');
  await p.click('.sv-wrong[data-qid="sv_ornek_u1_3"] > summary');
  const wtxt = await p.textContent('.sv-wrong[data-qid="sv_ornek_u1_3"]');
  ok(wtxt.includes('Doğru cevap') && wtxt.includes('Used constant terms') && wtxt.includes('Adım adım çözüm'), 'yanlış soru: doğru cevap + errorTag + remediation + çözüm');
  ok((await p.$$('.sv-wrong[data-tur="cevapsiz"]')).length === 1, '1 cevapsız soru listede');
  // Kontrol listesi
  const nG = await p.evaluate(() => (window.APMEBERRA_TAKVIM.gereklilikler || []).length);
  if (nG) {
    const firstCb = await p.$('#sv-report input[data-gid]');
    const gid = await firstCb.getAttribute('data-gid');
    await firstCb.check();
    ok((await p.evaluate(k => JSON.parse(localStorage.getItem(k)).kontrol, KEY))[gid].c === true, 'kontrol listesi işareti kaydedildi');
    ok((await p.textContent('#sv-check-count')).startsWith('1 / ' + nG), 'tamamlanan sayacı güncellendi');
    ok(await p.$('.sv-check-group h3') && !(await p.textContent('.sv-check-group h3')).includes('-'), 'gruplar ne_zaman’a göre, Türkçe başlıkla');
  }
  await p.screenshot({ path: `${SHOTS}/seviye-rapor-desktop-light.png`, fullPage: true });

  // ---------- 4) Fizibilite: bilinen girdiler ----------
  await p.addInitScript(patchTakvim, { ornekTarih: '2027-05-10', physNull: true });
  await p.goto('about:blank'); await p.goto(URL('seviye-testi.html?ornek=1#rapor')); await p.waitForSelector('#sv-report:not([hidden])');
  const feas = async () => p.$eval('#sv-feas-table tr[data-ders="_ornek"]', r => ({ d: r.dataset.durum, g: +r.dataset.gereken, k: +r.dataset.kullanilabilir }));
  // 7 Eki 2026 → 10 May 2027 = 215 gün → 30 hafta; −2 tampon = 28; 1 ders × 15 sa = 420 sa. Gereken = 10 + 5 + 4×3.5 = 29
  let f = await feas();
  ok(f.d === 'yetisir' && near(f.g, 29) && near(f.k, 420), 'varsayılan: gereken 29, kullanılabilir 420 → yetişir ' + JSON.stringify(f));
  ok((await p.textContent('#sv-exam-table tr[data-ders="_ornek"]')).includes('30 hafta (215 gün)'), 'özet: 30 hafta (215 gün)');
  const setA = async (o) => { for (const [id, v] of Object.entries(o)) await p.fill('#' + id, String(v)); await p.click('#sv-assume button[type="submit"]'); await p.waitForTimeout(150); };
  await setA({ 'sv-v-hours': 5, 'sv-v-red': 100, 'sv-v-yellow': 50 });
  f = await feas();
  ok(f.d === 'siki' && near(f.g, 164) && near(f.k, 140), 'saat 5, K100, S50: gereken 164 ≤ 140×1.2=168 → sıkı ' + JSON.stringify(f));
  ok((await p.textContent('.sv-decision[data-ders="_ornek"]')).includes('Kaydol, yoğun plan gerekir'), 'karar: Kaydol, yoğun plan gerekir');
  ok((await p.textContent('#sv-assume-msg')).includes('yeniden hesaplandı'), 'yeniden hesaplama duyuruldu');
  await setA({ 'sv-v-yellow': 60 });
  f = await feas();
  ok(f.d === 'yetismez' && near(f.g, 174), 'S60: gereken 174 > 168 → yetişmez ' + JSON.stringify(f));
  ok((await p.textContent('.sv-decision[data-ders="_ornek"]')).includes('Bu yıl ertelemeyi değerlendir'), 'karar: Bu yıl ertelemeyi değerlendir');
  ok(!(await p.isVisible('#sv-cap-warn')), '174/28 = 6,2 sa/hafta → tavan uyarısı yok');
  await setA({ 'sv-v-yellow': 100, 'sv-v-mocks': 20, 'sv-v-mockh': 10, 'sv-v-buffer': 10 });
  ok(await p.isVisible('#sv-cap-warn'), 'K100+S100+20×10=400 sa / (30−10=20 hf) = 20 sa/hafta > 18 → tavan uyarısı');
  await setA({ 'sv-v-hours': 30 });
  ok(await p.getAttribute('#sv-v-hours', 'aria-invalid') === 'true' && (await p.textContent('#sv-assume-msg')).includes('arasında'), 'geçersiz haftalık saat reddedildi');
  await p.click('#sv-assume-reset'); await p.waitForTimeout(150);
  ok((await p.inputValue('#sv-v-red')) === '10' && (await p.inputValue('#sv-v-buffer')) === '2', 'varsayılanlara dönüldü');
  await setA({ 'sv-v-hours': 15 });
  // Saf fonksiyon: 2 ders, biri tarihsiz
  const pure = await p.evaluate(() => {
    const H = window.APMEBERRA_SEVIYE_HESAP;
    return H.fizibilite([
      { ders: 'x', ad: 'X', uniteler: [{ bant: 'kirmizi' }, { bant: 'kirmizi' }, { bant: 'sari' }, { bant: 'yesil' }] },
      { ders: 'y', ad: 'Y', uniteler: [{ bant: 'yesil' }] }
    ], { bugun: new Date(2026, 9, 7), haftalikSaat: 10, takvim: { sinavlar: { x: { tarih: '2026-12-02' }, y: { tarih: null } } } });
  });
  // x: 56 gün → 8 hf − 2 = 6 hf × (10/2=5) = 30; gereken 20+5+1.5+14 = 40.5 > 36 → yetişmez
  ok(pure.dersler[0].kalanHafta === 8 && near(pure.dersler[0].kullanilabilir, 30) && near(pure.dersler[0].gereken, 40.5) && pure.dersler[0].durum === 'yetismez', 'saf fonksiyon: 40,5 sa vs 30 sa → yetişmez');
  ok(pure.dersler[1].durum === 'tarihyok' && pure.dersler[1].kullanilabilir === null, 'saf fonksiyon: tarih null → tarihyok (tarih uydurulmadı)');
  ok(near(pure.toplam.haftalikToplam, 40.5 / 6 + 5), 'saf fonksiyon: haftalık toplam tempo');
  ok(await p.evaluate(() => { const H = window.APMEBERRA_SEVIYE_HESAP; return H.bant(49.99) === 'kirmizi' && H.bant(50) === 'sari' && H.bant(74.99) === 'sari' && H.bant(75) === 'yesil'; }), 'bant eşikleri <50 / 50–74 / ≥75');

  // ---------- 5) İkinci test: geçmiş + karşılaştırma ----------
  await p.click('#sv-retake');
  ok(await p.isChecked('input[value="_ornek"]'), 'yeniden çöz: dersler önceden seçili');
  await p.click('#sv-start-btn'); await p.waitForSelector('#sv-test:not([hidden])');
  await answerOrnek(p, ['A', 'B', 'C', 'D', 'A', 'B']); // hepsi doğru
  await p.waitForSelector('#sv-report:not([hidden])'); await p.waitForTimeout(800);
  ok((await p.$$('#sv-hist option')).length === 2, 'rapor geçmişi: 2 rapor');
  const d1 = await p.textContent('.sv-course-block tr[data-unite="1"]');
  ok(d1.includes('Kırmızı → Yeşil ↑'), 'karşılaştırma: Ünite 1 Kırmızı → Yeşil');
  ok((await p.textContent('#sv-g')) && (await p.textContent('section[aria-labelledby="sv-g"]')).includes('Yanlış ya da cevapsız soru yok'), 'tümü doğru: boş durum mesajı');
  ok((await p.textContent('section[aria-labelledby="sv-e"]')).includes('Kırmızı ya da Sarı ünite yok'), 'öncelik listesi: boş durum');
  await p.selectOption('#sv-hist', { index: 1 });
  ok((await p.$$('.sv-wrong')).length === 3, 'geçmişten eski rapor açıldı (3 yanlış/cevapsız)');
  ok(await p.isVisible('.sv-course-block tr[data-unite="1"]') && !(await p.$('.sv-unit-table th:nth-child(6)')), 'en eski raporda Değişim sütunu yok');
  await p.selectOption('#sv-hist', { index: 0 });
  // En fazla 5 rapor
  await p.evaluate(k => { const v = JSON.parse(localStorage.getItem(k)); const r = v.raporlar[0]; for (let i = 0; i < 6; i++) v.raporlar.push(Object.assign({}, r, { id: 'x' + i, tarih: '2026-09-0' + (i + 1) + 'T10:00:00Z' })); localStorage.setItem(k, JSON.stringify(v)); }, KEY);
  await p.reload(); await p.waitForSelector('#sv-report:not([hidden])');
  await p.click('#sv-retake'); await p.click('#sv-start-btn'); await answerOrnek(p, ['A', 'B', 'C', 'D', 'A', 'B']);
  await p.waitForSelector('#sv-report:not([hidden])');
  ok((await p.evaluate(k => JSON.parse(localStorage.getItem(k)).raporlar.length, KEY)) === 5, 'rapor geçmişi en fazla 5');
  await p.evaluate(k => { const v = JSON.parse(localStorage.getItem(k)); v.raporlar = v.raporlar.filter(r => !/^x/.test(r.id)); localStorage.setItem(k, JSON.stringify(v)); }, KEY);

  // ---------- 6) Geç kayıt ----------
  const lsDump = await p.evaluate(() => JSON.stringify(Object.assign({}, localStorage)));
  const ctxL = await b.newContext({ viewport: { width: 1280, height: 900 } }); await require('./oturum-tohum')(ctxL);
  const p2 = await ctxL.newPage(); p2.on('pageerror', e => errs.push(e.message));
  await p2.goto(URL('index.html')); await p2.evaluate(d => { const o = JSON.parse(d); for (const k in o) localStorage.setItem(k, o[k]); }, lsDump);
  await p2.clock.setFixedTime(new Date('2026-12-01T10:00:00'));
  await p2.goto(URL('seviye-testi.html?ornek=1#rapor')); await p2.waitForSelector('#sv-report:not([hidden])');
  ok((await p2.textContent('#sv-kayit-kalan')) === 'Kapandı', 'kayıt son günü geçince: Kapandı');
  const late = await p2.textContent('#sv-late');
  ok(late.includes('14 Kasım 2026') && late.includes('12 Mart 2027') && late.includes('+40 USD'), 'geç kayıt penceresi ve ücreti: ' + late.trim().slice(0, 90));
  await p2.goto(URL('index.html')); await p2.waitForTimeout(200);
  ok(!(await p2.textContent('#todo-list')).includes('Seviye'), 'index: kayıt kapandıktan sonra öneri yok');
  await p2.evaluate(() => localStorage.clear()); await ctxL.close();

  // ---------- 7) İlerleme özeti + yedekleme ----------
  await p.goto(URL('ilerleme.html')); await p.waitForTimeout(300);
  ok((await p.$$('#seviye-list li')).length === 1 && (await p.getAttribute('#seviye-link', 'href')) === 'seviye-testi.html#rapor', 'ilerleme: son rapor özeti + bağlantı');
  ok((await p.textContent('#seviye-list')).includes('Öneri:'), 'ilerleme: kayıt önerisi gösteriliyor');
  await p.screenshot({ path: `${SHOTS}/seviye-ilerleme-ozet-light.png`, clip: { x: 0, y: 0, width: 1280, height: 900 } });
  const before = await p.evaluate(k => localStorage.getItem(k), KEY);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#backup-export')]);
  const file = path.join(DL, dl.suggestedFilename()); await dl.saveAs(file);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  ok(data.anahtarlar[KEY] && data.anahtarlar[KEY].raporlar.length === JSON.parse(before).raporlar.length && data.anahtarlar[KEY].raporlar.length === 3, 'yedek dosyası apmeberra:seviye:v1 içeriyor (3 rapor)');
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(200);
  await p.setInputFiles('#backup-file', file); await p.waitForSelector('#backup-preview:not([hidden])');
  await p.click('#backup-apply'); await p.waitForTimeout(200);
  ok((await p.evaluate(k => localStorage.getItem(k), KEY)) === before, 'geri yükleme: seviye verisi birebir geldi');
  ok((await p.$$('#seviye-list li')).length === 1, 'ilerleme: geri yüklenen rapor görünüyor');
  // Birleştirme: aynı id'de daha yeni guncelleme kazanır, yeni rapor eklenir, kontrol işaretinde yeni damga kazanır
  const cur = JSON.parse(before);
  const r0 = cur.raporlar[0];
  const inc = JSON.parse(before);
  inc.raporlar[0] = Object.assign({}, r0, { haftalikSaat: 9, guncelleme: '2030-01-01T00:00:00Z' });
  inc.raporlar.push(Object.assign({}, r0, { id: 'rYeni', tarih: '2026-10-08T09:00:00Z', guncelleme: '2026-10-08T09:00:00Z' }));
  inc.kontrol = { zz: { c: true, t: '2030-01-01T00:00:00Z' } };
  const incFile = path.join(DL, 'seviye-merge.json');
  fs.writeFileSync(incFile, JSON.stringify({ format: 'apmeberra-yedek', surum: 1, olusturma: '2026-10-08T10:00:00Z', anahtarlar: { [KEY]: inc } }));
  await p.evaluate(k => { const v = JSON.parse(localStorage.getItem(k)); v.kontrol.zz = { c: false, t: '2026-01-01T00:00:00Z' }; localStorage.setItem(k, JSON.stringify(v)); }, KEY);
  await p.setInputFiles('#backup-file', incFile); await p.waitForSelector('#backup-preview:not([hidden])');
  await p.click('#backup-apply'); await p.waitForTimeout(200);
  const m = await p.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
  ok(m.raporlar[0].id === 'rYeni' && m.raporlar.length === 4, 'birleştir: yeni tarihli rapor başa eklendi (4 rapor)');
  ok(m.raporlar.find(r => r.id === r0.id).haftalikSaat === 9, 'birleştir: aynı raporun daha yeni hali kazandı');
  ok(m.kontrol.zz.c === true, 'birleştir: kontrol işaretinde yeni damga kazandı');
  const badFile = path.join(DL, 'seviye-bozuk.json');
  fs.writeFileSync(badFile, JSON.stringify({ format: 'apmeberra-yedek', surum: 1, anahtarlar: { [KEY]: { raporlar: 'x' } } }));
  await p.setInputFiles('#backup-file', badFile); await p.waitForTimeout(200);
  ok((await p.textContent('#backup-msg')).includes('seviye testi'), 'bozuk seviye verisi reddedildi');

  // ---------- 8) Ekran görüntüleri: tema × genişlik ----------
  await p.evaluate(k => { const v = JSON.parse(localStorage.getItem(k)); v.raporlar = v.raporlar.filter(r => r.id !== 'rYeni'); localStorage.setItem(k, JSON.stringify(v)); }, KEY);
  for (const theme of ['light', 'dark']) {
    await p.evaluate(t => localStorage.setItem('apmeberra:theme', t), theme);
    for (const [w, h, tag] of [[1280, 900, 'desktop'], [390, 844, 'phone']]) {
      await p.setViewportSize({ width: w, height: h });
      // rapor (en yeni = tümü doğru; görsel için eski raporu seç)
      await p.goto('about:blank'); await p.goto(URL('seviye-testi.html?ornek=1#rapor')); await p.waitForSelector('#sv-report:not([hidden])');
      await p.selectOption('#sv-hist', { index: (await p.$$('#sv-hist option')).length - 1 }); await p.waitForTimeout(1200);
      await p.click('.sv-wrong-course > summary'); await p.click('.sv-wrong[data-tur="yanlis"] > summary'); await p.waitForTimeout(800);
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tag}/${theme}: rapor yatay kaydırma yok`);
      await p.screenshot({ path: `${SHOTS}/seviye-rapor-${tag}-${theme}.png`, fullPage: true });
      // başlangıç + test
      await p.click('#sv-retake'); await p.waitForTimeout(200);
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tag}/${theme}: başlangıç yatay kaydırma yok`);
      await p.screenshot({ path: `${SHOTS}/seviye-baslangic-${tag}-${theme}.png`, fullPage: true });
      await p.click('#sv-start-btn'); await p.waitForTimeout(1200); await p.keyboard.press('b');
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tag}/${theme}: test yatay kaydırma yok`);
      await p.screenshot({ path: `${SHOTS}/seviye-test-${tag}-${theme}.png`, fullPage: false });
      await p.click('#sv-pause'); await p.click('#sv-discard-btn');
    }
  }
  await p.setViewportSize({ width: 1280, height: 900 });

  // ---------- 9) Süreli mod (sanal saat) ----------
  const ctx2 = await b.newContext({ viewport: { width: 1280, height: 900 } }); await require('./oturum-tohum')(ctx2);
  const t = await ctx2.newPage(); t.on('pageerror', e => errs.push(e.message));
  await t.clock.install({ time: TODAY });
  await t.goto(URL('seviye-testi.html?ornek=1')); await t.clock.runFor(500); await t.waitForSelector('body[data-sv-hazir]');
  await t.check('input[value="_ornek"]'); await t.check('#sv-timed');
  await t.click('#sv-start-btn');
  ok((await t.textContent('#sv-timer-val')) === '09:00', 'süreli mod: toplam 9:00');
  await t.clock.runFor(65000);
  ok((await t.textContent('#sv-timer-val')) === '07:55', 'süreli mod: 65 sn sonra 7:55 (' + await t.textContent('#sv-timer-val') + ')');
  await t.keyboard.press('a'); await t.keyboard.press('Enter');
  await t.clock.runFor(9 * 60000);
  await t.waitForSelector('#sv-report:not([hidden])');
  const tr = await t.evaluate(k => JSON.parse(localStorage.getItem(k)).raporlar[0], KEY);
  ok(tr.bitis === 'sure' && tr.sonuclar._ornek.cevapsiz === 5 && tr.sonuclar._ornek.dogru === 1, 'süre dolunca kalanlar cevapsız (1 doğru, 5 cevapsız)');
  await t.evaluate(() => localStorage.clear());
  await ctx2.close();

  // ---------- 10) Eksik dosya: "henüz hazır değil" ----------
  const ctx3 = await b.newContext({ viewport: { width: 1280, height: 900 } }); await require('./oturum-tohum')(ctx3);
  const e = await ctx3.newPage(); const errs3 = []; e.on('pageerror', x => errs3.push(x.message));
  await e.route(/physics-1\.js$/, r => r.abort());
  await e.goto(URL('seviye-testi.html')); await e.waitForSelector('body[data-sv-hazir]');
  ok((await e.getAttribute('body', 'data-sv-eksik')).includes('physics-1.js'), 'eksik dosya algılandı (physics-1.js)');
  ok(await e.isDisabled('input[value="physics-1"]') && (await e.textContent('label.sv-course:has(input[value="physics-1"])')).includes('Henüz hazır değil'), 'eksik ders "henüz hazır değil" + seçilemez');
  ok(!(await e.$('input[value="_ornek"]')), '?ornek=1 yokken ÖRNEK yüklenmiyor');
  ok(!errs3.length, 'eksik dosyada sayfa hatası yok');
  // Tarihi null olan gerçek ders (physics-1 → başka bir derste dene)
  await e.unroute(/physics-1\.js$/);
  await e.addInitScript(patchTakvim, { physNull: true, bosGerek: true });
  await e.goto(URL('seviye-testi.html')); await e.waitForSelector('body[data-sv-hazir]');
  await e.check('input[value="physics-1"]'); await e.click('#sv-start-btn');
  await e.click('#sv-finish'); await e.click('#sv-finish-yes');
  await e.waitForSelector('#sv-report:not([hidden])');
  ok((await e.textContent('#sv-exam-table tr[data-ders="physics-1"]')).includes('tarih doğrulanmadı') && (await e.getAttribute('#sv-feas-table tr[data-ders="physics-1"]', 'data-durum')) === 'tarihyok', 'gerçek ders, tarih null: "tarih doğrulanmadı", hesap yok');
  ok(await e.isVisible('#sv-check-empty') && (await e.textContent('#sv-check-empty')).includes('Gereklilik listesi doğrulanıyor'), 'gereklilikler boşken "Gereklilik listesi doğrulanıyor"');
  ok((await e.$$('.sv-wrong[data-tur="cevapsiz"]')).length > 0, 'erken bitir: tüm sorular cevapsız listede');
  await e.evaluate(() => localStorage.clear());
  await ctx3.close();

  // ---------- Temizlik ----------
  await p.evaluate(() => localStorage.clear());
  ok(await p.evaluate(() => localStorage.length === 0), 'localStorage temizlendi');
  ok(!errs.length, 'sayfa/konsol hatası yok' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  for (const f of fs.readdirSync(DL)) fs.unlinkSync(path.join(DL, f));
  console.log(fail ? `\n${fail} FAIL` : '\nTUM TESTLER GECTI');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
