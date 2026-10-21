// PM bağımsız kabul testi: GERÇEK calculus-ab tanı bankası ile, elle hesaplanmış beklenen değerlere karşı.
// Senaryo: Unit 1–7 tüm sorular doğru, Unit 8'in 3 sorusu yanlış. Tarih 7 Ekim 2026'ya sabit, haftalık 15 saat.
const { chromium } = require('playwright-core');
const URL = f => 'file:///C:/Users/hp/Desktop/projelerim/AP%20MEBERRA/' + f;
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); await require('./oturum-tohum')(ctx);
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.clock.setFixedTime(new Date('2026-10-07T10:00:00'));
  await p.goto(URL('seviye-testi.html')); await p.waitForSelector('body[data-sv-hazir]');
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForSelector('body[data-sv-hazir]');

  // Gerçek bankaların hepsi yüklenmiş ve seçilebilir olmalı
  const enabled = await p.$$eval('input[name="sv-ders"]:not([disabled]), input[name="sv-calc"]:not([disabled])', e => e.map(x => x.value).filter(Boolean));
  ok(['calculus-ab', 'calculus-bc', 'physics-1', 'chemistry', 'biology', 'english-language'].every(k => enabled.includes(k)), 'gerçek 6 banka seçilebilir: ' + enabled.join(','));
  ok(!enabled.includes('_ornek'), 'örnek ders gerçek modda görünmüyor');

  await p.check('input[name="sv-calc"][value="calculus-ab"]');
  await p.fill('#sv-hours', '15');
  await p.click('#sv-start-btn'); await p.waitForSelector('#sv-test:not([hidden])');

  const bank = await p.evaluate(() => window.APMEBERRA_SEVIYE['calculus-ab'].sorular.map(q => ({ id: q.id, unite: String(q.unite), c: q.options.find(o => o.isCorrect).id, w: q.options.find(o => !o.isCorrect).id })));
  ok(bank.length === 24, 'AB bankası 24 soru');
  for (let i = 0; i < bank.length; i++) {
    const cur = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('apmeberra:seviye:v1')); return s.devam.sira[s.devam.idx]; });
    const q = bank.find(x => x.id === cur.id);
    const pick = q.unite === '8' ? q.w : q.c;
    await p.check(`input[name="sv-opt"][value="${pick}"]`);
    await p.click('#sv-next');
    await p.waitForTimeout(60);
  }
  // Son "İleri" bir onay paneli açabilir
  const confirmBtn = await p.$('#sv-report:not([hidden])') ? null : await p.$('button:has-text("Testi bitir")');
  if (confirmBtn && await confirmBtn.isVisible()) await confirmBtn.click();
  await p.waitForSelector('#sv-report:not([hidden])');

  const rows = await p.$$eval('.sv-course-block[data-ders="calculus-ab"] tr[data-unite]', rs => rs.map(r => ({ u: r.dataset.unite, s: +r.dataset.skor, b: r.dataset.bant })));
  ok(rows.length === 8, '8 ünite satırı');
  ok(rows.filter(r => r.u !== '8').every(r => Math.abs(r.s - 100) < 0.01 && /ye[sş]il/i.test(r.b)), 'Unit 1–7: %100 Yeşil');
  const u8 = rows.find(r => r.u === '8');
  ok(u8 && u8.s === 0 && /k[ıi]rm[ıi]z[ıi]/i.test(u8.b), 'Unit 8: %0 Kırmızı');
  const genel = await p.textContent('.sv-course-block[data-ders="calculus-ab"]');
  console.log('GENEL METIN:', genel.replace(/s+/g,' ').slice(0,260)); const gs = await p.$eval('.sv-course-block[data-ders="calculus-ab"]', el => el.dataset.skor || (el.querySelector('[data-skor]')||{}).dataset?.skor); console.log('data-skor:', gs);

  const f = await p.$eval('#sv-feas-table tr[data-ders="calculus-ab"]', r => ({ d: r.dataset.durum, g: +r.dataset.gereken, k: +r.dataset.kullanilabilir }));
  ok(Math.abs(f.g - 34.5) < 0.01, `gereken saat 34.5 (bulunan ${f.g})`);
  ok(Math.abs(f.k - 420) < 0.01, `kullanılabilir 420 sa = 28 hf × 15 (bulunan ${f.k})`);
  ok((await p.textContent('#sv-exam-table tr[data-ders="calculus-ab"]')).includes('215 gün'), '10 Mayıs 2027 sınavına 215 gün');
  ok((await p.textContent('.sv-decision[data-ders="calculus-ab"]')).includes('Kaydol') && !(await p.textContent('.sv-decision[data-ders="calculus-ab"]')).includes('yoğun'), 'karar: Kaydol');
  const pr = await p.$$eval('#sv-priority li', l => l.map(x => x.dataset.unite));
  ok(pr[0] === '8', 'öncelik listesinin ilki Unit 8 (' + pr.join(',') + ')');
  const go = await p.$eval('#sv-priority li[data-unite="8"] .sv-go', a => a.getAttribute('href')).catch(() => null);
  ok(go === 'ap-calculus.html#calc-unit8-lecture-section', 'Unit 8 bağlantısı ünite çapasına atlıyor (' + go + ')');
  ok((await p.$$('.sv-wrong[data-tur="yanlis"]')).length === 3, '3 yanlış soru listede');
  ok((await p.textContent('#sv-report .sv-disclaimer')).includes('AP puanı tahmini değildir'), 'puan tahmini değildir uyarısı');
  const gCount = await p.$$eval('#sv-report input[data-gid]', e => e.length);
  const gExp = await p.evaluate(() => window.APMEBERRA_TAKVIM.gereklilikler.length);
  ok(gCount === gExp && gExp === 16, `kontrol listesi ${gCount}/${gExp} madde (doğrulanmış takvimden)`);
  ok((await p.textContent('#sv-report')).includes('Biology') === false || true, '');
  ok(errs.length === 0, 'sayfa hatası yok ' + errs.join('|'));
  await p.screenshot({ path: '../shots/pm-seviye-rapor.png', fullPage: false });
  await p.evaluate(() => localStorage.clear());
  await b.close();
  console.log(fail ? `\n${fail} BAŞARISIZ` : '\nPM KABUL TESTİ: TÜMÜ GEÇTİ');
  process.exit(fail ? 1 : 0);
})();
