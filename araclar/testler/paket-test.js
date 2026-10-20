// End-to-end test of the packaged portal with ALL network access blocked.
const { chromium } = require('playwright-core');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }); await require('./oturum-tohum')(ctx);
  const net = [];
  await ctx.route(/^https?:/, r => { net.push(r.request().url()); r.abort(); });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const base = 'file:///C:/Users/hp/Desktop/projelerim/AP%20MEBERRA/sunum/AP-MEBERRA/portal/';
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);

  // 1. Every subject page renders math (where present) and mounts its quizzes
  for (const pg of ['ap-calculus.html', 'ap-physics.html', 'ap-chemistry.html', 'ap-biology.html', 'ap-english.html', 'ap-electives.html']) {
    await p.goto(base + pg); await p.waitForTimeout(3500);
    const quizzes = await p.$$eval('[id$="-quiz-container"]', els => els.map(e => e.querySelectorAll('[id^="opt-btn-"]').length > 0).filter(Boolean).length);
    const svg = await p.$$eval('mjx-container svg', e => e.length);
    ok(quizzes > 0, `${pg}: ${quizzes} quiz mounted, ${svg} formül`);
  }
  // 2. Answer one English question, then export progress
  await p.goto(base + 'ap-english.html'); await p.waitForTimeout(800);
  const opt = p.locator('#eng-reading-quiz-container [id^="opt-btn-"]').first();
  await opt.click(); await p.waitForTimeout(300);
  await p.goto(base + 'ilerleme.html'); await p.waitForTimeout(500);
  const exportBtn = p.getByRole('button', { name: /dosyaya aktar/i }).first();
  const [dl] = await Promise.all([p.waitForEvent('download'), exportBtn.click()]);
  const saved = await dl.path();
  const data = JSON.parse(fs.readFileSync(saved, 'utf8'));
  ok(data.format === 'apmeberra-yedek' && data.ozet.cozulen >= 1, `paketten ilerleme dışa aktarıldı (${dl.suggestedFilename()}, çözülen=${data.ozet.cozulen})`);
  // 3. Council debate renders corrected text
  await p.goto(base + 'ajanlar.html'); await p.waitForTimeout(500);
  const sel = await p.$('#debate-topic-select');
  if (sel) {
    await p.selectOption('#debate-topic-select', 'dilemma_country');
    await p.evaluate(() => triggerCouncilMeeting()); await p.waitForTimeout(6000);
    const txt = await p.textContent('#debate-output-container');
    ok(/yazılı/.test(txt) && !/harçsızdır/.test(txt), 'konsey tartışması düzeltilmiş metni gösteriyor');
  } else ok(false, 'debate select bulunamadı');
  // 4. Info hub loads from packaged data
  await p.goto(base + 'bilgi-merkezi.html'); await p.waitForTimeout(500);
  const cards = await p.$$eval('#kb-root .kb-card', e => e.length);
  const expected = await p.evaluate(() => window.BILGI_MERKEZI.bolumler.reduce((s, b) => s + b.maddeler.length, 0));
  ok(cards === expected && cards > 0, `Bilgi Merkezi ${cards}/${expected} kart`);

  ok(net.length === 0, `ağ isteği: ${net.length}`);
  ok(errs.length === 0, `sayfa hatası: ${errs.length} ${errs.join(' | ')}`);
  await p.evaluate(() => localStorage.clear());
  await b.close();
})();
