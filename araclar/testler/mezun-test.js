// Mezun öğrenci tarayıcı testi (Ajan 11, Tur 10, kararlar K4-a / K5-a / K5-b / K5-c).
// Çalıştır: node mezun-test.js (playwright-core kurulu klasörde; BENIOKU.md). Ekran görüntüleri ../shots/.
// Bugün sabit: window.APMEBERRA_BUGUN = "2026-10-14" (rota ve panel hesapları). Profil doğrulaması gerçek tarihi kullanır.
// Her bağlam yeni ve geçicidir; testin sonunda localStorage ayrıca temizlenir.
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const URL = f => 'file:///C:/Users/hp/Desktop/projelerim/AP%20MEBERRA/' + f;
const SHOTS = path.resolve(__dirname, '../shots');
fs.mkdirSync(SHOTS, { recursive: true });
const EXE = 'C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const BUGUN = '2026-10-14';
const P = 'apmeberra-hesap:v1:';

let pass = 0, fail = 0;
const ok = (c, m, x) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (c || x === undefined ? '' : ' -> ' + JSON.stringify(x))); if (c) pass++; else fail++; };

const MEZUN = { okul: 'Test Lisesi', sinif: 'mezun', ulkeler: ['de', 'it'], aktifRota: 'de', hedefAlan: 'Mühendislik', mezuniyetYili: '2026', hedefBaslangicYili: '2027', yerlesmeDurumu: 'uygun', tamamlandi: true, guncelleme: '2026-10-14T00:00:00Z' };

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const errs = [];
  async function mk(profil, opts = {}) {
    const ctx = await b.newContext(Object.assign({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' }, opts));
    await ctx.addInitScript(([pre, prof, bugun]) => {
      window.APMEBERRA_BUGUN = bugun;
      try {
        if (!localStorage.getItem(pre + 'oturum')) {
          localStorage.setItem(pre + 'kullanicilar', JSON.stringify([{ id: 'utest', ad: 'Test', soyad: 'Öğrenci', kullaniciAdi: 'test', salt: '00', hash: '00', iter: 150000, olusturma: '2026-10-12T00:00:00Z' }]));
          localStorage.setItem(pre + 'oturum', JSON.stringify({ id: 'utest', baslangic: '2026-10-12T00:00:00Z' }));
          localStorage.setItem(pre + 'aktif', JSON.stringify('utest'));
          if (prof) localStorage.setItem(pre + 'profil:utest', JSON.stringify(prof));
        }
      } catch (e) {}
    }, [P, profil, BUGUN]);
    return ctx;
  }
  async function sayfa(ctx, f) {
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(f + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND|Failed to load resource/.test(m.text())) errs.push(f + ' console: ' + m.text()); });
    await p.goto(URL(f));
    await p.waitForTimeout(350);
    return p;
  }
  const profilOku = p => p.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), P + 'profil:utest');
  const profilYaz = (p, prof) => p.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [P + 'profil:utest', prof]);
  const tasma = p => p.evaluate(() => document.documentElement.scrollWidth - innerWidth);

  // =====================================================================
  // 1. İlk giriş sihirbazı: mezun soruları
  // =====================================================================
  for (const [w, scheme] of [[1280, 'light'], [360, 'dark']]) {
    const ctx = await mk(null, { viewport: { width: w, height: 900 }, colorScheme: scheme });
    const p = await sayfa(ctx, 'profil.html');
    ok(await p.isVisible('#wizard'), `${w}: profil yokken sihirbaz açılır`);
    // Tur 11 (plan §3.8): 1. adım durum; mezun soruları 2. adımda yalnızca "Lise mezunu" seçilince
    await p.click('#wz-ogrenciModeli-group input[value="lise"] >> xpath=..'); await p.click('#wz-next');
    await p.fill('#wz-okul', 'Test Lisesi');
    ok(await p.isHidden('#wz-mezun') && await p.isVisible('#wz-sinif-wrap'), `${w}: lise öğrencisinde mezun soruları gizli, sınıf soruluyor`);
    await p.click('#wz-back');
    await p.click('#wz-ogrenciModeli-group input[value="lise-mezun"] >> xpath=..'); await p.click('#wz-next');
    ok(await p.isVisible('#wz-mezun') && await p.isVisible('#wz-yerlesme') && await p.isHidden('#wz-sinif-wrap') && await p.isHidden('#wz-uni'), `${w}: Lise mezunu seçilince iki soru görünür, sınıf sorulmaz`);
    const yil = await p.evaluate(() => ({ v: document.getElementById('wz-hedefBaslangicYili').value, n: document.querySelectorAll('#wz-hedefBaslangicYili option').length, ilk: document.querySelector('#wz-hedefBaslangicYili option').value }));
    const now = new Date(), Y = now.getFullYear(), vars = (now.getMonth() >= 8 ? Y : Y - 1) + 1;
    ok(yil.v === String(vars) && yil.n === 4 && yil.ilk === String(Y), `${w}: hedef yıl 4 seçenek (${Y}–${Y + 3}), varsayılan ${vars}`, yil);
    const etiketler = await p.$$eval('#wz-yerlesmeDurumu-group .choice-body strong', a => a.map(x => x.textContent));
    ok(JSON.stringify(etiketler) === JSON.stringify(['Hedef alanla uyumlu bir lisans programına yerleştim', 'Yerleşmem yok', 'Yerleştim ama alan farklı']), `${w}: yerleşme seçenekleri onaylı etiketlerle`, etiketler);
    await p.click('#wz-next');
    ok(await p.textContent('#wz-yerlesmeDurumu-err') === 'Yerleşme durumunu seç.' && await p.getAttribute('#wz-yerlesmeDurumu-group', 'aria-invalid') === 'true' && await p.isVisible('#wz-step-2'), `${w}: yerleşme seçilmeden ilerlenemez, hata gösterilir`);
    ok(await p.evaluate(() => document.activeElement && document.activeElement.name === 'wz-yerlesmeDurumu'), `${w}: odak yerleşme sorusuna gider`);
    await p.click('#wz-yerlesmeDurumu-group label:has-text("Yerleştim ama alan farklı")');
    ok(await p.textContent('#wz-yerlesmeDurumu-err') === '', `${w}: seçimle hata temizlenir`);
    ok(await tasma(p) <= 0, `${w}: sihirbaz mezun adımında yatay taşma yok`);
    await p.screenshot({ path: path.join(SHOTS, `mezun-sihirbaz-${w}-${scheme}.png`), fullPage: true });
    await p.click('#wz-next');
    await p.click('#wz-ulkeler-group label:has-text("Almanya")');
    await p.click('#wz-ulkeler-group input[value="it"] >> xpath=..');
    await p.click('#wz-next');
    await Promise.all([p.waitForURL(/universiteler\.html/), p.click('#wz-next')]);
    const prof = await profilOku(p);
    ok(prof && prof.sinif === 'mezun' && prof.ogrenciModeli === 'lise-mezun' && prof.egitimDili === 'en' && prof.hedefBaslangicYili === String(vars) && prof.yerlesmeDurumu === 'alan-uyumsuz' && prof.tamamlandi, `${w}: sihirbaz lise mezunu profilini iki alanla kaydetti (model + dil)`, prof);
    await p.evaluate(() => localStorage.clear());
    await ctx.close();
  }

  // =====================================================================
  // 2. Profil sayfası: göster/gizle, kaydet, sınıf değişince silme, eski profil
  // =====================================================================
  {
    const ctx = await mk(MEZUN);
    const p = await sayfa(ctx, 'profil.html');
    ok(await p.isVisible('#pf-mezun') && await p.inputValue('#pf-hedefBaslangicYili') === '2027' && await p.isChecked('#pf-yerlesmeDurumu-group input[value="uygun"]'), 'profil: mezun kutusu kayıtlı değerlerle görünür');
    await p.click('#pf-sinif-group label:has-text("11. sınıf")');
    ok(await p.isHidden('#pf-mezun') && await p.isHidden('#pf-mezuniyetYili-wrap'), 'profil: 11. sınıf seçilince mezun alanları gizlenir');
    await p.click('#pf-save'); await p.waitForSelector('#pf-alert.is-ok');
    let prof = await profilOku(p);
    ok(prof.sinif === '11' && !('hedefBaslangicYili' in prof) && !('yerlesmeDurumu' in prof) && !('mezuniyetYili' in prof), 'profil: 11 olarak kaydedince mezun alanları silindi', prof);
    // Eski mezun profili (alanlar yok): Rotam çalışır, profil kaydında yerleşme sorulur
    const eski = { okul: 'Eski Lise', sinif: 'mezun', ulkeler: ['de'], mezuniyetYili: '2025', tamamlandi: true };
    await profilYaz(p, eski);
    const r = await sayfa(ctx, 'rota.html');
    const re = await r.evaluate(() => ({ note: (document.querySelector('.rota-mezun-note.is-warn') || {}).textContent || '', yks: !!document.querySelector('[data-adim="de-yks-basvuru"]'), late: document.querySelectorAll('.rs-step.is-late').length, h: document.querySelector('#rm-h') && document.querySelector('#rm-h').textContent }));
    ok(/henüz belirtmedin/.test(re.note) && re.yks && re.late === 0 && re.h === 'Hedef: 2027/28 akademik yılı', 'eski mezun profili: Rotam varsayılan 2027/28 ile çalışır, yerleşme sorulur, YKS adımları görünür', re);
    await r.close();
    await p.reload(); await p.waitForTimeout(300);
    ok(await p.isVisible('#pf-mezun') && await p.inputValue('#pf-hedefBaslangicYili') === '2027' && !(await p.isChecked('#pf-yerlesmeDurumu-group input[value="uygun"]')), 'eski profil: formda varsayılan hedef yıl, yerleşme seçili değil');
    await p.click('#pf-save');
    await p.waitForSelector('#pf-yerlesmeDurumu-err:not(:empty)');
    ok(await p.textContent('#pf-yerlesmeDurumu-err') === 'Yerleşme durumunu seç.', 'eski profil: yerleşme seçmeden kaydedilmez');
    await p.click('#pf-yerlesmeDurumu-group label:has-text("Yerleşmem yok")');
    await p.click('#pf-save'); await p.waitForSelector('#pf-alert.is-ok');
    prof = await profilOku(p);
    ok(prof.yerlesmeDurumu === 'yok' && prof.hedefBaslangicYili === '2027' && prof.mezuniyetYili === '2025', 'eski profil: yerleşme ve hedef yıl eklendi, mezuniyet yılı korundu', prof);
    // #pf-yerlesme bağlantısı yerleşme sorusuna odaklar
    await p.goto('about:blank'); await p.goto(URL('profil.html#pf-yerlesme')); await p.waitForTimeout(500);
    ok(await p.evaluate(() => document.activeElement && document.activeElement.name === 'pf-yerlesmeDurumu'), 'profil.html#pf-yerlesme yerleşme sorusuna odaklar');
    await p.evaluate(() => localStorage.clear());
    await ctx.close();
  }

  // =====================================================================
  // 3. Rotam: 2026 mezunu, hedef 2027 (masaüstü + telefon, açık + koyu)
  // =====================================================================
  for (const [w, scheme] of [[1280, 'light'], [360, 'dark'], [390, 'light']]) {
    const ctx = await mk(MEZUN, { viewport: { width: w, height: 900 }, colorScheme: scheme });
    const p = await sayfa(ctx, 'rota.html?ulke=de');
    const r = await p.evaluate(() => {
      const steps = [...document.querySelectorAll('.rs-step')];
      return {
        ids: steps.map(s => s.dataset.adim),
        late: document.querySelectorAll('.rs-step.is-late, .rs-flag-late').length,
        past: !!document.getElementById('rg-past'),
        dates: steps.map(s => s.querySelector('.rs-date').textContent),
        lead: document.getElementById('rota-lead').textContent,
        h: (document.getElementById('rm-h') || {}).textContent,
        uyari: !!document.querySelector('.rota-uyari[data-uyari="mezun-de-it-kayit"]'),
        uyariLink: [...document.querySelectorAll('.rota-uyari a.src-link')].map(a => a.href),
        uyariMetin: (document.querySelector('.rota-uyari p') || {}).textContent,
        apSinav: document.querySelectorAll('.rs-exams a[href*="#ap-"]').length,
        dilSinav: document.querySelectorAll('.rs-exams a[href*="#ielts-academic"]').length,
        hemen: document.querySelectorAll('.rs-flag-now').length,
        sub: document.querySelector('.rota-sec-head p').textContent,
        stat: [...document.querySelectorAll('.rs-stat-list dt')].map(x => x.textContent)
      };
    });
    if (w === 1280) {
      ok(r.late === 0 && !r.past, 'Rotam DE: hiçbir adım "Geçmiş" ya da "Tarihi geçti" değil', r);
      ok(r.dates.some(d => d === 'Temmuz 2027') && r.dates.some(d => d === 'Şimdi · Ekim 2026') && !r.dates.some(d => /2026$/.test(d) && !/Şimdi|Ekim 2026|Kasım 2026|Aralık 2026/.test(d)), 'Rotam DE: adımlar 2027 hedefine göre tarihli (okul dönemi adımları Şimdi)', r.dates);
      ok(/mezun öğrencisine/.test(r.lead) && /2027\/28/.test(r.lead) && r.h === 'Hedef: 2027/28 akademik yılı' && r.stat.includes('Hedef yıl'), 'Rotam DE: başlık ve özet hedef yılı yazar', { lead: r.lead, h: r.h });
      ok(!r.ids.some(id => /^de-yks-/.test(id)) && /5 adım yerleşme durumun nedeniyle gizlendi/.test(r.sub), 'Rotam DE: yerleşmesi uygun mezunda 5 YKS adımı gizli', r.sub);
      ok(!r.ids.includes('de-ap-profil') && r.ids.includes('de-mezun-ap-uyari') && r.apSinav === 0 && r.dilSinav > 0, 'Rotam DE: AP adımı ve AP sınavı yok, AP bilgi notu ve dil sınavı var', { ap: r.apSinav });
      ok(r.uyari && r.uyariMetin.startsWith('Almanya için Türkiye\'de bir lisans programına kayıt yaptırman gerekmez.') && r.uyariLink.some(h => /DSU_Call/.test(h)), 'Rotam: iki ülkeli mezunda K4-a uyarısı ve kaynak bağlantısı', r.uyariLink);
      ok(r.hemen > 0, 'Rotam DE: okul dönemi adımları "Hemen" bayrağıyla');
      // Sıradaki adım tıklanabilir ve işaretlenebilir
      await p.check('.rs-check[data-adim="de-mezun-yerlesme-kontrol"]');
      await p.waitForTimeout(150);
      ok(await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('apmeberra:rota:v1')); return d.de.adimlar['de-mezun-yerlesme-kontrol'].durum === 'yapildi'; }), 'Rotam: mezun adımı işaretlenir (apmeberra:rota:v1)');
      // IT sekmesi: it-vize kesinliği 2027 hedefinde Doğrulandı
      await p.click('#rtab-it'); await p.waitForTimeout(200);
      const it = await p.evaluate(() => ({ vize: (document.querySelector('[data-adim="it-vize"] .kesinlik') || {}).textContent, mezunAdim: ['it-mezun-uygunluk', 'it-mezun-yks-belgesi', 'it-mezun-dsu-ilk-kayit'].every(id => document.querySelector('[data-adim="' + id + '"]')), late: document.querySelectorAll('.rs-step.is-late').length, ap: document.querySelectorAll('.rs-exams a[href*="#ap-"]').length }));
      ok(it.vize === 'Doğrulandı' && it.mezunAdim && it.late === 0 && it.ap === 0, 'Rotam IT: it-vize Doğrulandı (kesinlikYila 2027), 3 mezun adımı, AP yok', it);
      // alan-uyumsuz -> YKS adımları görünür
      await profilYaz(p, Object.assign({}, MEZUN, { yerlesmeDurumu: 'alan-uyumsuz' }));
      await p.goto(URL('rota.html?ulke=de')); await p.waitForTimeout(300);
      const a = await p.evaluate(() => ({ basvuru: (document.querySelector('[data-adim="de-yks-basvuru"] .rs-date') || {}).textContent, gec: !!document.querySelector('[data-adim="de-yks-gec-teslim"]'), late: document.querySelectorAll('.rs-step.is-late').length }));
      ok(a.basvuru === 'Şubat 2027' && a.gec && a.late === 0, 'Rotam DE: alan-uyumsuz mezunda YKS adımları görünür (başvuru Şubat 2027)', a);
      await profilYaz(p, MEZUN);
    } else {
      ok(r.late === 0 && r.uyari && r.apSinav === 0, `${w}px ${scheme}: mezun Rotam aynı sonuç`);
    }
    await p.goto(URL('rota.html?ulke=de')); await p.waitForTimeout(300);
    ok(await tasma(p) <= 0, `${w}px ${scheme}: Rotam yatay taşma yok`);
    await p.screenshot({ path: path.join(SHOTS, `mezun-rota-${w}-${scheme}.png`), fullPage: w !== 1280 });
    if (w === 1280) await p.screenshot({ path: path.join(SHOTS, `mezun-rota-${w}-${scheme}-tam.png`), fullPage: true });
    await p.evaluate(() => localStorage.clear());
    await ctx.close();
  }

  // =====================================================================
  // 4. Panelim: uyarı, KMK gizli, AP kayıt hatırlatması yok
  // =====================================================================
  {
    const ctx = await mk(MEZUN);
    const p = await sayfa(ctx, 'index.html');
    const r = await p.evaluate(() => ({
      uyari: !!document.querySelector('#pr-body .rota-uyari[data-uyari="mezun-de-it-kayit"]'),
      link: [...document.querySelectorAll('#pr-body .rota-uyari a')].map(a => a.href),
      kmk: document.getElementById('kmk-calculator-section').hidden,
      apTodo: [...document.querySelectorAll('#todo-list .todo-title')].some(x => /Seviye testi|seviye raporu|seviye testini/i.test(x.textContent)),
      late: (document.querySelector('.panel-rota-foot .is-late') || null) !== null,
      first: (document.querySelector('#pr-body .pr-item .rs-date') || {}).textContent
    }));
    ok(r.uyari && r.link.length === 2, 'Panelim: iki ülkeli mezunda K4-a uyarısı (2 kaynak)', r.link);
    ok(r.kmk === true && !r.apTodo, 'Panelim: mezunda KMK/AP denetleyicisi ve AP kayıt hatırlatması gizli', r);
    ok(!r.late && /Şimdi · Ekim 2026/.test(r.first || ''), 'Panelim: rota adımları geçmiş değil, ilki "Şimdi"', r.first);
    await p.screenshot({ path: path.join(SHOTS, 'mezun-panel-1280-light.png') });
    // Tek ülke mezun: uyarı yok; 12. sınıf iki ülke: uyarı yok, KMK görünür
    await profilYaz(p, Object.assign({}, MEZUN, { ulkeler: ['de'] })); await p.reload(); await p.waitForTimeout(300);
    ok(!(await p.$('.rota-uyari')), 'Panelim: tek ülkeli mezunda uyarı yok');
    await profilYaz(p, { okul: 'Test Lisesi', sinif: '12', ulkeler: ['de', 'it'], aktifRota: 'de', tamamlandi: true }); await p.reload(); await p.waitForTimeout(300);
    ok(!(await p.$('.rota-uyari')) && !(await p.evaluate(() => document.getElementById('kmk-calculator-section').hidden)), 'Panelim: 12. sınıfta uyarı yok, KMK denetleyicisi görünür');
    await p.evaluate(() => localStorage.clear());
    await ctx.close();
  }

  // =====================================================================
  // 5. Sınavlar: mezunda AP rotada sayılmaz
  // =====================================================================
  {
    const ctx = await mk(MEZUN);
    const p = await sayfa(ctx, 'sinavlar.html');
    const r = await p.evaluate(() => ({ ap: [...document.querySelectorAll('[data-rol]')].filter(e => /^ap-/.test(e.id) && e.dataset.rol).length, ielts: (document.getElementById('ielts-academic') || { dataset: {} }).dataset.rol }));
    ok(r.ap === 0 && r.ielts === 'zorunlu', 'Sınavlar: mezunda hiçbir AP "bu rotada" rozeti taşımaz; IELTS zorunlu', r);
    await p.evaluate(() => localStorage.clear());
    await ctx.close();
  }

  // =====================================================================
  // 6. Herkese açık şartlar: mezunda kesinlik hedef yıla göre, koşul notu
  // =====================================================================
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript(bugun => { window.APMEBERRA_BUGUN = bugun; }, BUGUN);
    const p = await sayfa(ctx, 'sartlar.html?ulke=it&sinif=mezun');
    const r = await p.evaluate(() => {
      const st = [...document.querySelectorAll('#sr-yol .sr-step')];
      const vize = st.find(s => /Öğrenim vizesi/.test(s.querySelector('h4').textContent));
      return { vize: vize && vize.querySelector('.kesinlik').textContent, lead: document.querySelector('.sr-road-head p').textContent, cal: document.querySelectorAll('#sr-yol .sr-step-cal').length, bilgi: st.some(s => /Bilgi notu/.test(s.textContent)) };
    });
    ok(r.vize === 'Doğrulandı' && /2027\/28 akademik yılına göre/.test(r.lead) && r.cal === 0 && r.bilgi, 'şartlar it/mezun: it-vize Doğrulandı, açıklama hedef yılı yazar, tarih göreli', r);
    await p.goto(URL('sartlar.html?ulke=it&sinif=11')); await p.waitForTimeout(300);
    ok(await p.evaluate(() => [...document.querySelectorAll('#sr-yol .sr-step')].find(s => /Öğrenim vizesi/.test(s.querySelector('h4').textContent)).querySelector('.kesinlik').textContent) === 'Yayımlanmadı', 'şartlar it/11: it-vize Yayımlanmadı');
    await p.goto(URL('sartlar.html?ulke=de&sinif=mezun')); await p.waitForTimeout(300);
    const d = await p.evaluate(() => ({ kosul: document.querySelectorAll('#sr-yol .rs-kosul').length, ap: [...document.querySelectorAll('#sr-yol .sr-step h4')].some(h => /^AP sınavları/.test(h.textContent)) }));
    ok(d.kosul === 5 && !d.ap, 'şartlar de/mezun: 5 YKS adımında koşul notu, AP adımı yok', d);
    ok(await tasma(p) <= 0, 'şartlar de/mezun: taşma yok');
    await ctx.close();
  }

  ok(errs.length === 0, 'konsol/sayfa hatası yok', errs);
  await b.close();
  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi.`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
