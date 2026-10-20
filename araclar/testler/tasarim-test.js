// Tasarım v3 doğrulaması: İçindekiler, açılır notlar, tema, 360 px taşma, yerel bağlantılar, sayfa hataları
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const ROOT = 'C:/Users/hp/Desktop/projelerim/AP MEBERRA/';
const URL = f => 'file:///C:/Users/hp/Desktop/projelerim/AP%20MEBERRA/' + f;
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
const PAGES = ['index', 'calis', 'profil', 'rota', 'universiteler', 'yazismalar', 'sinavlar', 'sartlar', 'deneme', 'ilerleme', 'seviye-testi', 'bilgi-merkezi', 'almanya-muhendislik', 'italya-muhendislik', 'istanbul-sinav-rehberi', 'ajanlar', 'sinav-cents', 'ap-calculus', 'ap-physics', 'ap-chemistry', 'ap-biology', 'ap-english', 'ap-electives'];
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });

  // 1) 360 px: yatay taşma ve sayfa hatası yok (+ giriş sayfası)
  {
    const ctx = await b.newContext({ viewport: { width: 360, height: 760 } });
    await require('./oturum-tohum')(ctx);
    for (const s of PAGES) {
      const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.goto(URL(s + '.html')); await p.waitForTimeout(s.startsWith('ap-') ? 1500 : 600);
      const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      ok(ov <= 0 && errs.length === 0, `360px ${s}: taşma=${ov} hata=${errs.length}${errs[0] ? ' ' + errs[0] : ''}`);
      await p.close();
    }
    const g = await b.newContext({ viewport: { width: 360, height: 760 } });
    const p = await g.newPage(); await p.goto(URL('giris.html')); await p.waitForTimeout(400);
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '360px giris: taşma yok');
    await g.close(); await ctx.close();
  }

  // 1b) Tur 14 A2: telefon alt gezinmesi (≤ 760 px) — 5 öğe, 56 px, aria-current, alt dolgu, sabit öğelerle çakışmama
  {
    const tohum = (ctx, prof) => ctx.addInitScript(pr => {
      const P = 'apmeberra-hesap:v1:';
      if (!localStorage.getItem(P + 'oturum')) {
        localStorage.setItem(P + 'kullanicilar', JSON.stringify([{ id: 'utest', ad: 'Test', soyad: 'Öğrenci', kullaniciAdi: 'test', salt: '00', hash: '00', iter: 150000, olusturma: '2026-10-12T00:00:00Z' }]));
        localStorage.setItem(P + 'oturum', JSON.stringify({ id: 'utest', baslangic: '2026-10-12T00:00:00Z' }));
        localStorage.setItem(P + 'aktif', JSON.stringify('utest'));
        localStorage.setItem(P + 'profil:utest', JSON.stringify(pr));
      }
    }, prof);
    const LISE = { okul: 'Test Lisesi', sinif: '11', ogrenciModeli: 'lise', ulkeler: ['de', 'it'], egitimDili: 'en', tamamlandi: true };
    const UNI = { ogrenciModeli: 'uni-mezun', sinif: 'lisans-mezun', ulkeler: ['nl'], aktifRota: 'nl', egitimDili: 'en', hedefBaslangicYili: '2027', lisansAlani: 'Makine', lisansDurumu: 'mezun', lisansMezuniyetYili: '2025', tamamlandi: true };
    const olc = p => p.evaluate(() => {
      const bn = document.querySelector('.bottom-nav'); const r = bn ? bn.getBoundingClientRect() : null;
      const items = [...document.querySelectorAll('.bottom-nav .bn-item')];
      return {
        vis: !!bn && getComputedStyle(bn).display !== 'none', h: r ? Math.round(r.height) : 0, alt: r ? Math.round(innerHeight - r.bottom) : -1,
        labels: items.map(x => x.textContent.trim()).join('|'), cur: items.filter(x => x.getAttribute('aria-current') === 'page').map(x => x.dataset.bn),
        minH: Math.min(...items.map(x => x.getBoundingClientRect().height)), pad: parseFloat(getComputedStyle(document.body).paddingBottom),
        top: getComputedStyle(document.getElementById('site-nav-links') || document.body).display, burger: (() => { const m = document.querySelector('.nav-menu-btn'); return m ? getComputedStyle(m).display : 'none'; })(),
        ov: document.documentElement.scrollWidth - innerWidth
      };
    });
    for (const [w, sc] of [[360, 'light'], [390, 'dark']]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 760 }, colorScheme: sc }); await tohum(ctx, LISE);
      const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
      for (const [s, beklenen] of [['index', 'bugun'], ['universiteler', 'hedefim'], ['ap-physics', 'calis'], ['yazismalar', 'basvuru'], ['sinavlar', 'basvuru'], ['ilerleme', 'ben']]) {
        await p.goto(URL(s + '.html')); await p.waitForTimeout(s.startsWith('ap-') ? 1000 : 450);
        const r = await olc(p);
        ok(r.vis && r.h >= 56 && r.h <= 60 && r.alt === 0 && r.labels === 'Bugün|Hedefim|Çalış|Başvuru|Ben' && r.cur.join() === beklenen && r.minH >= 44 && r.pad >= 56 && r.top === 'none' && r.burger === 'none' && r.ov <= 0,
          `${w}px ${sc} ${s}: alt gezinme 5 öğe, yükseklik ${r.h}, etkin ${r.cur.join()}, alt dolgu ${r.pad}, üst menü gizli`, r);
      }
      // Tur 14 A6: beş öğenin hepsi doğrudan bağlantı (Hedefim → universiteler, Çalış → calis, Başvuru → yazismalar, Ben → ilerleme); liste (sheet) açılmaz
      await p.goto(URL('index.html')); await p.waitForTimeout(400);
      const bnl = await p.evaluate(() => ({ btn: document.querySelectorAll('.bottom-nav button.bn-item').length, href: [...document.querySelectorAll('.bottom-nav a.bn-item')].map(a => a.getAttribute('href')).join('|') }));
      ok(bnl.btn === 0 && bnl.href === 'index.html|universiteler.html|calis.html|yazismalar.html|ilerleme.html', w + 'px ' + sc + ': alt gezinmede 5 doğrudan bağlantı (Çalış → calis.html), liste düğmesi yok', bnl);
      await p.click('.bottom-nav a[data-bn="calis"]'); await p.waitForURL(/calis.html/); await p.waitForTimeout(400);
      ok(await p.getAttribute('.bottom-nav a[data-bn="calis"]', 'aria-current') === 'page' && await p.evaluate(() => document.getElementById('bn-sheet').hidden), w + 'px ' + sc + ': Çalış dokunuşu calis.html açtı (1 dokunuş), Çalış etkin, liste kapalı');
      // Sayfa sonu alt gezinmenin altında kalmıyor (altbilgi görünür)
      await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(150);
      ok(await p.evaluate(() => { const f = document.querySelector('.footer-bottom') || document.querySelector('footer'); return f.getBoundingClientRect().bottom <= document.querySelector('.bottom-nav').getBoundingClientRect().top + 1; }), `${w}px ${sc}: sayfa sonu (altbilgi) alt gezinmenin üstünde`);
      ok(errs.length === 0, `${w}px ${sc}: alt gezinme sayfalarında hata yok` + (errs[0] ? ' ' + errs[0] : ''));
      if (w === 360) await p.screenshot({ path: path.resolve(__dirname, '../shots/t14-alt-gezinme-360-' + sc + '.png') });
      await ctx.close();
    }
    // Üniversite mezunu: Çalış yerine Sınavlar, Ben = profil; masaüstünde alt gezinme gizli
    const cu = await b.newContext({ viewport: { width: 360, height: 760 } }); await tohum(cu, UNI);
    const pu = await cu.newPage(); await pu.goto(URL('index.html')); await pu.waitForTimeout(500);
    const ru = await olc(pu);
    ok(ru.labels === 'Bugün|Hedefim|Sınavlar|Başvuru|Ben' && await pu.getAttribute('.bottom-nav a[data-bn="ben"]', 'href') === 'profil.html' && await pu.getAttribute('.bottom-nav a[data-bn="sinavlar"]', 'href') === 'sinavlar.html?model=uni-mezun', '360px üniversite mezunu: alt gezinme Bugün|Hedefim|Sınavlar|Başvuru|Ben', ru);
    await cu.close();
    const cd = await b.newContext({ viewport: { width: 1280, height: 800 } }); await tohum(cd, LISE);
    const pd = await cd.newPage(); await pd.goto(URL('index.html')); await pd.waitForTimeout(400);
    const rd = await olc(pd);
    ok(!rd.vis && rd.pad < 56 && rd.top !== 'none', '1280px: alt gezinme gizli, üst menü görünür', rd);
    await cd.close();
  }

  // 1c) Tur 14 A4: Hedefim sekme çubuğu (Şartlar · Üniversiteler · Rotam) — üç sayfada, seçim taşınır; ziyaretçide 2 sekme
  {
    const LISE = { okul: 'Test Lisesi', sinif: '11', ogrenciModeli: 'lise', ulkeler: ['de', 'it'], aktifRota: 'de', egitimDili: 'en', tamamlandi: true };
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript(pr => { const P = 'apmeberra-hesap:v1:'; if (!localStorage.getItem(P + 'oturum')) {
      localStorage.setItem(P + 'kullanicilar', JSON.stringify([{ id: 'utest', ad: 'Test', soyad: 'Öğrenci', kullaniciAdi: 'test', salt: '00', hash: '00', iter: 150000, olusturma: '2026-10-12T00:00:00Z' }]));
      localStorage.setItem(P + 'oturum', JSON.stringify({ id: 'utest', baslangic: '2026-10-12T00:00:00Z' })); localStorage.setItem(P + 'aktif', JSON.stringify('utest')); localStorage.setItem(P + 'profil:utest', JSON.stringify(pr)); } }, LISE);
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    const bar = () => p.evaluate(() => { const n = document.querySelector('main .hedefim-bar'); if (!n) return null; const a = [...n.querySelectorAll('a.hedefim-tab')];
      return { ilk: n === document.querySelector('main').firstElementChild, etiket: a.map(x => x.textContent).join('|'), cur: a.filter(x => x.getAttribute('aria-current') === 'page').map(x => x.dataset.hedefim).join(), href: Object.fromEntries(a.map(x => [x.dataset.hedefim, x.getAttribute('href')])), aria: n.getAttribute('aria-label') }; });
    // Adreste seçim yoksa profilden: Şartlar sekmesi kendi seçimiyle açılır (seçici değil, sonuç) — rota.html?ulke=it aktif rotayı değiştirmeden önce
    await p.goto(URL('universiteler.html')); await p.waitForTimeout(500);
    await p.hover('.hedefim-tab[data-hedefim="sartlar"]');
    ok((await bar()).href.sartlar === 'sartlar.html?model=lise&sinif=11&ulke=de&dil=en', 'Hedefim çubuğu: adreste seçim yokken Şartlar profildeki seçimle (lise · 11 · Almanya · İngilizce)');
    await p.click('.hedefim-tab[data-hedefim="sartlar"]'); await p.waitForTimeout(700);
    ok(await p.evaluate(() => !!document.getElementById('sr-sum-h') && /Almanya/.test(document.getElementById('sr-sum-h').textContent)), 'Hedefim çubuğu: Şartlar sekmesi tıklanınca Almanya şartları açıldı (1 tık)');
    for (const [s, cur] of [['sartlar.html?model=lise&sinif=11&ulke=it&dil=en', 'sartlar'], ['universiteler.html?ulke=it', 'universiteler'], ['rota.html?ulke=it', 'rota']]) {
      await p.goto(URL(s)); await p.waitForTimeout(500);
      const r = await bar();
      ok(r && r.ilk && r.etiket === 'Şartlar|Üniversiteler|Rotam' && r.cur === cur && r.aria === 'Hedefim' && /ulke=it/.test(r.href.sartlar) && /^universiteler\.html\?ulke=it&duzey=lisans&dil=/.test(r.href.universiteler) && r.href.rota === 'rota.html?ulke=it',
        'Hedefim çubuğu ' + cur + ': 3 sekme, etkin ' + cur + ', seçim (İtalya) taşınıyor', r);
    }
    await p.focus('.hedefim-tab[data-hedefim="universiteler"]');
    ok(await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== 'none'), 'Hedefim çubuğu: klavye odağı görünür');
    await p.setViewportSize({ width: 360, height: 760 }); await p.goto(URL('universiteler.html?ulke=de')); await p.waitForTimeout(500);
    const m = await p.evaluate(() => { const t = [...document.querySelectorAll('.hedefim-tab')].map(x => x.getBoundingClientRect()); const u = document.querySelector('.hedefim-tabs').getBoundingClientRect(); return { h: Math.min(...t.map(r => r.height)), w: Math.round(u.width), ov: document.documentElement.scrollWidth - innerWidth }; });
    ok(m.h >= 44 && m.w >= 320 && m.ov <= 0, '360px Hedefim çubuğu: tam genişlik, sekmeler ≥ 44 px, taşma yok', m);
    ok(errs.length === 0, 'Hedefim çubuğu: sayfa hatası yok' + (errs[0] ? ' ' + errs[0] : ''));
    await ctx.close();
    const g = await b.newContext({ viewport: { width: 1280, height: 900 } });
    const pg = await g.newPage(); await pg.goto(URL('universiteler.html?ulke=nl')); await pg.waitForTimeout(500);
    await pg.hover('.hedefim-tab[data-hedefim="sartlar"]');
    const rg = await pg.evaluate(() => [...document.querySelectorAll('.hedefim-tab')].map(x => x.textContent + '>' + x.getAttribute('href')).join('|'));
    ok(rg === 'Şartlar>sartlar.html?ulke=nl&dil=en|Üniversiteler>universiteler.html?ulke=nl&duzey=lisans&dil=hepsi', 'ziyaretçi Hedefim çubuğu: Şartlar · Üniversiteler (Rotam yok), seçim taşınır', rg);
    await g.close();
  }

  // 2) İçindekiler: masaüstünde açık ve yapışkan, bağlantılar var olan başlıklara gider, etkin bölüm işaretlenir
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    await require('./oturum-tohum')(ctx);
    for (const s of ['ap-calculus', 'ap-physics', 'ap-chemistry', 'ap-biology', 'ap-english', 'ap-electives', 'sinav-cents']) {
      const p = await ctx.newPage(); await p.goto(URL(s + '.html')); await p.waitForTimeout(1200);
      const r = await p.evaluate(() => {
        const toc = document.querySelector('.doc-toc');
        if (!toc) return null;
        const links = [...toc.querySelectorAll('a')];
        return { h2: [...document.querySelectorAll(".main-container h2")].filter(h => !h.closest(".hero-section, .question-card, .feedback-box")).length, n: links.length, broken: links.filter(a => !document.getElementById(decodeURIComponent(a.hash.slice(1)))).length, open: toc.querySelector('details').open, pos: getComputedStyle(toc).position, quizzes: document.querySelectorAll('.doc-body [id$="-quiz-container"], .doc-body [id*="quiz-container"]').length };
      });
      ok(r && r.n === r.h2 && r.n >= 5 && r.broken === 0 && r.open && r.pos === 'sticky', `${s}: içindekiler ${r && r.n} bağlantı, kırık ${r && r.broken}, açık=${r && r.open}, ${r && r.pos}`);
      if (s === 'ap-calculus') {
        const target = await p.evaluate(() => [...document.querySelectorAll('.doc-toc a')][8].hash);
        await p.click(`.doc-toc a[href="${target}"]`); await p.waitForTimeout(700);
        ok(await p.evaluate(h => { const a = document.querySelector('.doc-toc a.is-active'); return !!a; }, target), 'ap-calculus: tıklanan bölüm etkin olarak işaretlendi');
        ok(await p.evaluate(() => typeof quizStats === 'object' && document.querySelectorAll('.question-card').length > 100), 'ap-calculus: soru kartları taşımadan sonra da çizildi');
      }
      await p.close();
    }
    // Kısa rehber sayfalarında yan sütun yok
    for (const s of ['almanya-muhendislik', 'italya-muhendislik', 'istanbul-sinav-rehberi']) {
      const p = await ctx.newPage(); await p.goto(URL(s + '.html')); await p.waitForTimeout(500);
      ok(!(await p.$('.doc-toc')), `${s}: kısa sayfada içindekiler yok`);
      await p.close();
    }
    await ctx.close();
  }

  // 3) Telefonda içindekiler kapalı açılır liste; bağlantı seçilince kapanır
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
    await require('./oturum-tohum')(ctx);
    const p = await ctx.newPage(); await p.goto(URL('ap-biology.html')); await p.waitForTimeout(1200);
    ok(!(await p.evaluate(() => document.querySelector('.doc-toc details').open)), 'telefon: içindekiler başlangıçta kapalı');
    await p.click('.doc-toc summary');
    ok(await p.isVisible('.doc-toc ol a'), 'telefon: özet tıklanınca liste açıldı');
    await p.click('.doc-toc ol li:nth-child(3) a'); await p.waitForTimeout(400);
    ok(!(await p.evaluate(() => document.querySelector('.doc-toc details').open)), 'telefon: bağlantı seçilince liste kapandı');
    await p.keyboard.press('Tab');
    await ctx.close();
  }

  // 4) Sınavlar: uzun notlar açılır alanda, açılınca görünür; Rotam: ayrıntılar açılır
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    await require('./oturum-tohum')(ctx);
    const p = await ctx.newPage(); await p.goto(URL('sinavlar.html')); await p.waitForTimeout(600);
    const n = await p.$$eval('.exam-card .clamp-note', l => l.length);
    ok(n > 0, 'sinavlar: uzun notlar açılır alanda (' + n + ')');
    const first = p.locator('.exam-card .clamp-note').first();
    ok(!(await first.locator('.exam-note').isVisible()), 'sinavlar: not başlangıçta kapalı');
    await first.locator('summary').click();
    ok(await first.locator('.exam-note').isVisible(), 'sinavlar: not açılınca görünür');
    await p.goto(URL('rota.html?ulke=de')); await p.waitForTimeout(600);
    ok(await p.isVisible('.rs-step.is-next .rs-detail'), 'rota: sıradaki adımın açıklaması açık');
    const more = await p.$$eval('.rs-more', l => l.length);
    ok(more > 0, 'rota: diğer uzun açıklamalar "Ayrıntılar" altında (' + more + ')');
    await ctx.close();
  }

  // 5) Tema geçişi: koyu/açık ve localStorage; düğme etiketi
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
    await require('./oturum-tohum')(ctx);
    const p = await ctx.newPage(); await p.goto(URL('index.html')); await p.waitForTimeout(500);
    const bg1 = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await p.click('.theme-toggle'); await p.waitForTimeout(200);
    const r = await p.evaluate(() => ({ t: document.documentElement.getAttribute('data-theme'), ls: localStorage.getItem('apmeberra:theme'), bg: getComputedStyle(document.body).backgroundColor }));
    ok(r.t === 'dark' && r.ls === 'dark' && r.bg !== bg1, 'tema: koyuya geçti ve kaydedildi (' + bg1 + ' -> ' + r.bg + ')');
    await p.evaluate(() => localStorage.removeItem('apmeberra:theme'));
    // Bugün ekranı hiyerarşisi (Tur 14 A3, plan §2.3-A): karşılama → sıradaki adım (+ yaklaşan tarihler yanında) → devam et → rota özeti → dersler → ikincil grup
    const order = await p.evaluate(() => ['.bugun-hello', '#siradaki', '#bugun-devam', '#panel-rota', '#course-grid', '.dash-more'].map(s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect().top + scrollY : -1; }));
    ok(order.every((v, i) => v >= 0 && (i === 0 || v > order[i - 1])), 'Bugün: bölüm sırası karşılama → sıradaki adım → devam et → rota → dersler → ikincil (' + order.map(Math.round).join(', ') + ')');
    const yan = await p.evaluate(() => { const a = document.getElementById('siradaki').getBoundingClientRect(), b = document.getElementById('yaklasan').getBoundingClientRect(); return { ayniSatir: Math.abs(a.top - b.top) < 2, sagda: b.left > a.right, ilkEkran: a.top < innerHeight && b.top < innerHeight }; });
    ok(yan.ayniSatir && yan.sagda && yan.ilkEkran, '1280px Bugün: Yaklaşan tarihler Sıradaki adımın sağında, ikisi de ilk ekranda');
    ok(await p.evaluate(() => document.querySelectorAll('#next-step .btn-primary').length === 1 && !!document.querySelector('#next-step details.sa-neden summary') && ['#todo-list', '#roadmap'].every(s => document.querySelector('.dash-more ' + s)) && !document.getElementById('mezun-panel') && !document.getElementById('yl-panel')), 'Bugün: Sıradaki adımda tek birincil düğme + "Neden bu?"; çalışma planı ve başlangıç adımları ikincil grupta; model panelleri Hedefim › Şartlar\'a taşındı (A4)');
    ok(await p.isVisible('#btn-check-kmk'), 'panel: KMK denetleyicisi ikincil grupta görünür');
    // 360 px: Sıradaki adım ilk ekranda, Yaklaşan tarihler ilk 1,5 ekranda (plan §2.1)
    await p.setViewportSize({ width: 360, height: 760 }); await p.reload(); await p.waitForTimeout(500);
    const m360 = await p.evaluate(() => ({ sa: document.getElementById('siradaki').getBoundingClientRect().top + scrollY, saAlt: document.getElementById('sa-git').getBoundingClientRect().bottom + scrollY, yt: document.getElementById('yaklasan').getBoundingClientRect().top + scrollY, h: innerHeight, ov: document.documentElement.scrollWidth - innerWidth }));
    ok(m360.saAlt < m360.h - 56 && m360.yt < m360.h * 1.5 && m360.ov <= 0, '360px Bugün: Sıradaki adım düğmesi ilk ekranda (alt gezinmenin üstünde), Yaklaşan tarihler ilk 1,5 ekranda (' + Math.round(m360.saAlt) + ' / ' + Math.round(m360.yt) + ')');
    await ctx.close();
  }

  // 5b) Tur 14 A3: Bugün ekranı senaryoları (bugün sabit 20 Ekim 2026; tarihler gerçek veriden)
  {
    const P = 'apmeberra-hesap:v1:';
    const ac = async (prof, extra) => {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
      await ctx.addInitScript(([P, prof, extra]) => {
        window.APMEBERRA_BUGUN = '2026-10-20';
        if (!localStorage.getItem(P + 'oturum')) {
          localStorage.setItem(P + 'kullanicilar', JSON.stringify([{ id: 'utest', ad: 'Test', soyad: 'Öğrenci', kullaniciAdi: 'test', salt: '00', hash: '00', iter: 150000, olusturma: '2026-10-12T00:00:00Z' }]));
          localStorage.setItem(P + 'oturum', JSON.stringify({ id: 'utest', baslangic: '2026-10-12T00:00:00Z' }));
          localStorage.setItem(P + 'aktif', JSON.stringify('utest'));
          localStorage.setItem(P + 'profil:utest', JSON.stringify(prof));
          Object.keys(extra || {}).forEach(k => localStorage.setItem(k, JSON.stringify(extra[k])));
        }
      }, [P, prof, extra]);
      const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.goto(URL('index.html')); await p.waitForTimeout(500);
      const r = await p.evaluate(() => ({
        tur: document.getElementById('next-step').dataset.tur, git: document.getElementById('sa-git').getAttribute('href'), baslik: document.getElementById('sa-title').textContent,
        yt: [...document.querySelectorAll('#yt-list .yt-item')].map(li => li.dataset.yt), ytMetin: document.getElementById('yt-list').textContent,
        tumu: document.getElementById('yt-tumu').getAttribute('href'), serit: document.getElementById('bugun-serit').hidden ? '' : document.getElementById('bugun-serit').textContent,
        devam: getComputedStyle(document.getElementById('bugun-devam')).display, yanlis: document.getElementById('dv-yanlis-sayi').textContent,
        kaldigin: document.getElementById('dv-kaldigin').getAttribute('href'),
        gecen: document.querySelectorAll('#yt-gecmis li').length,
        seritHref: (document.querySelector('#bugun-serit a') || { getAttribute: () => null }).getAttribute('href')
      }));
      await ctx.close();
      return { r, errs };
    };
    const LISE = { okul: 'Test Lisesi', sinif: '11', ogrenciModeli: 'lise', ulkeler: ['de'], aktifRota: 'de', egitimDili: 'en', tamamlandi: true };
    const HATA = { v: 1, items: {} };
    for (let i = 1; i <= 6; i++) HATA.items['ap-physics|q' + i] = { page: 'ap-physics', id: 'q' + i, topic: 'Kinematics ' + i, date: '2026-10-1' + i + 'T10:00:00Z', count: 1, resolved: false };
    const QUIZ = { v: 1, pages: { 'ap-physics': { units: { 'phys-unit1-quiz-container': { title: 'Unit 1 Kinematics', total: 20, answers: { q1: { c: 0, t: '2026-10-19T10:00:00Z' }, q2: { c: 1, t: '2026-10-19T10:01:00Z' } } } } } } };
    const DENEME = { v: 1, aktif: { id: 'dn-x', kod: 'calculus-ab', ad: 'AP Calculus AB', dersler: ['calculus-ab'], seed: 1, sorular: [{ k: 'ap-calculus|x1', kod: 'calculus-ab' }, { k: 'ap-calculus|x2', kod: 'calculus-ab' }, { k: 'ap-calculus|x3', kod: 'calculus-ab' }], cevaplar: { 0: 'A' }, isaretli: {}, mevcut: 1, sureModu: 'suresiz', sureLimitSn: null, gecenSn: 30, baslangic: '2026-10-20T08:00:00Z' }, gecmis: [] };
    // a) Yarım deneme her şeyden önce
    let t = await ac(LISE, { 'apmeberra:deneme:v1': DENEME, 'apmeberra:errors:v1': HATA });
    ok(t.r.tur === 'deneme' && t.r.git === 'deneme.html' && t.r.baslik.includes('(1/3)') && t.errs.length === 0, 'Bugün a) yarım deneme (1/3) Sıradaki adım, düğme deneme.html');
    // b) Deneme yokken 6 açık hata (14 gün içinde rota adımı yok): Yanlışlarım; Devam et kartları dolu
    t = await ac(LISE, { 'apmeberra:errors:v1': HATA, 'apmeberra:quiz:v1': QUIZ });
    ok(t.r.tur === 'hata' && t.r.git === 'deneme.html?mod=yanlislar' && t.r.yanlis === '6' && t.r.kaldigin === 'ap-physics.html#phys-unit1-quiz-container', 'Bugün b) 6 açık hata → Yanlışlarımı çöz (deneme.html?mod=yanlislar); Kaldığın yer = Physics Unit 1; Yanlışlarım 6');
    // c) Yaklaşan tarihler (lise, DE): AP sipariş son günü 13 Kasım 2026 gerçek veriden, Kasım AP rota adımı yinelenmez; Tümü → rota
    ok(t.r.yt[0] === 'ap-kayit' && /13 Kasım 2026/.test(t.r.ytMetin) && !t.r.yt.includes('rota-de-ap-profil') && t.r.yt.length === 3 && t.r.tumu === 'yazismalar.html#son-tarihler' && t.r.gecen === 0, 'Bugün c) Yaklaşan (Tümü → Başvuru › Son tarihler, süresi dolan yok): ' + t.r.yt.join(', '));
    // d) Lise mezunu (İtalya + Macaristan): "Şimdi · Ekim 2026" rota adımı öne geçer; duyuru şeridi; AP tarihi yok
    t = await ac({ okul: 'Test Lisesi', sinif: 'mezun', ogrenciModeli: 'lise-mezun', mezuniyetYili: '2026', hedefBaslangicYili: '2027', yerlesmeDurumu: 'yok', ulkeler: ['it', 'hu'], aktifRota: 'it', egitimDili: 'en', tamamlandi: true });
    ok(t.r.tur === 'rota' && /Duyuru/.test(t.r.serit) && t.r.yt.length === 3 && t.r.yt.every(x => /^rota-it-mezun-/.test(x)) /* Şimdi · Ekim 2026 adımlarının ay sonu (31 Ekim) duyuru bitişinden (15 Kasım) önce; duyuru şeritte */ && !t.r.yt.some(x => /^ap-/.test(x)) && t.errs.length === 0, 'Bugün d) lise mezunu: rota adımı (' + t.r.baslik + '), duyuru şeridi, Yaklaşan = Ekim 2026 rota adımları, AP tarihi yok: ' + t.r.yt.join(', '));
    // e) Üniversite mezunu: YL şeridi, Devam et gizli, Sıradaki adım belge listesine
    t = await ac({ ogrenciModeli: 'uni-mezun', sinif: 'lisans-mezun', ulkeler: ['nl'], aktifRota: 'nl', egitimDili: 'en', hedefBaslangicYili: '2027', lisansAlani: 'Makine', lisansDurumu: 'mezun', lisansMezuniyetYili: '2025', tamamlandi: true }, { 'apmeberra:panel:v1': { universiteGoruldu: true, sinavlarim: [] } });
    ok(/Yüksek lisans başvuru dosyan/.test(t.r.serit) && t.r.devam === 'none' && t.r.tur === 'plan' && t.r.git === 'sartlar.html?model=uni-mezun&ulke=nl&dil=en#yl-panel' && t.r.seritHref === t.r.git && t.r.yt.length === 0 && t.errs.length === 0, 'Bugün e) üniversite mezunu: YL şeridi, Devam et gizli, Sıradaki adım = belge listesi (Hedefim › Şartlar #yl-panel), tarih yok (boş durum)', t.r);
  }

  // 5c) Tur 14 A6: Çalış merkezi (calis.html) — menü doğrudan bağlantı, 7 ders kartı, Bugün ile aynı "sıradaki çalışma", boş durum, üniversite mezunu
  {
    const P = 'apmeberra-hesap:v1:';
    const ac = async (prof, extra, sayfalar) => {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
      await ctx.addInitScript(([P, prof, extra]) => {
        window.APMEBERRA_BUGUN = '2026-10-20';
        if (!localStorage.getItem(P + 'oturum')) {
          localStorage.setItem(P + 'kullanicilar', JSON.stringify([{ id: 'utest', ad: 'Test', soyad: 'Öğrenci', kullaniciAdi: 'test', salt: '00', hash: '00', iter: 150000, olusturma: '2026-10-12T00:00:00Z' }]));
          localStorage.setItem(P + 'oturum', JSON.stringify({ id: 'utest', baslangic: '2026-10-12T00:00:00Z' }));
          localStorage.setItem(P + 'aktif', JSON.stringify('utest'));
          localStorage.setItem(P + 'profil:utest', JSON.stringify(prof));
          Object.keys(extra || {}).forEach(k => localStorage.setItem(k, JSON.stringify(extra[k])));
        }
      }, [P, prof, extra]);
      const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
      const out = {};
      for (const sf of sayfalar) {
        await p.goto(URL(sf + '.html')); await p.waitForTimeout(sf.startsWith('ap-') ? 900 : 500);
        out[sf] = await p.evaluate(() => {
          const q = s => document.querySelector(s), li = q('.nav-links > li[data-nav="calis"]');
          return {
            nav: li ? { href: li.querySelector('a').getAttribute('href'), dd: !!li.querySelector('.nav-dropdown, button'), etkin: li.classList.contains('is-active'), cur: li.querySelector('a').getAttribute('aria-current'), tekEtkin: document.querySelectorAll('.nav-links > li.is-active').length === 1 } : null,
            saTur: (q('#next-step') || q('#cs-next') || { dataset: {} }).dataset.tur, saBaslik: (q('#sa-title') || q('#cs-title') || {}).textContent, saGit: (q('#sa-git') || q('#cs-git') || { getAttribute: () => null }).getAttribute('href'),
            todo0: (q('#todo-list .todo-title') || {}).textContent,
            kartlar: [...document.querySelectorAll('.cd-kart')].map(k => k.dataset.ders), konu: [...document.querySelectorAll('.cd-kart a[data-konu]')].map(a => a.getAttribute('href')),
            deneme: [...document.querySelectorAll('.cd-kart a[data-deneme]')].map(a => a.getAttribute('href')),
            ck: [...document.querySelectorAll('#ck-list .ck-item')].map(x => x.id + '=' + x.querySelector('a').getAttribute('href')), ckBos: !!q('#ck-list .ck-bos'),
            yanlis: (q('#co-yanlis-sayi') || {}).textContent, yanlisHref: (q('#co-yanlis') || { getAttribute: () => null }).getAttribute('href'),
            physHata: ((q('.cd-kart[data-ders="ap-physics"] .cd-hata') || {}).textContent || ''),
            yl: q('#calis-yl') ? !q('#calis-yl').hidden : null, icerik: q('#calis-icerik') ? !q('#calis-icerik').hidden : null, ylHref: (q('#calis-yl a') || { getAttribute: () => null }).getAttribute('href'),
            ov: document.documentElement.scrollWidth - innerWidth
          };
        });
      }
      await ctx.close();
      return { r: out, errs };
    };
    const LISE = { okul: 'Test Lisesi', sinif: '11', ogrenciModeli: 'lise', ulkeler: ['de', 'it'], aktifRota: 'de', egitimDili: 'en', tamamlandi: true };
    const HATA = { v: 1, items: {} };
    for (let i = 1; i <= 6; i++) HATA.items['ap-physics|q' + i] = { page: 'ap-physics', id: 'q' + i, topic: 'Kinematics ' + i, date: '2026-10-1' + i + 'T10:00:00Z', count: 1, resolved: false };
    const QUIZ = { v: 1, pages: { 'ap-physics': { units: { 'phys-unit1-quiz-container': { title: 'Unit 1 Kinematics', total: 20, answers: { q1: { c: 0, t: '2026-10-19T10:00:00Z' }, q2: { c: 1, t: '2026-10-19T10:01:00Z' } } } } } } };
    const DENEME = { v: 1, aktif: { id: 'dn-x', kod: 'calculus-ab', ad: 'AP Calculus AB', dersler: ['calculus-ab'], seed: 1, sorular: [{ k: 'ap-calculus|x1', kod: 'calculus-ab' }, { k: 'ap-calculus|x2', kod: 'calculus-ab' }], cevaplar: { 0: 'A' }, isaretli: {}, mevcut: 1, sureModu: 'suresiz', sureLimitSn: null, gecenSn: 30, baslangic: '2026-10-20T08:00:00Z' }, gecmis: [] };
    // a) 6 açık hata + Physics ilerlemesi
    let t = await ac(LISE, { 'apmeberra:errors:v1': HATA, 'apmeberra:quiz:v1': QUIZ }, ['index', 'calis', 'ap-physics']);
    const c = t.r.calis, i0 = t.r.index;
    ok(c.nav && c.nav.href === 'calis.html' && !c.nav.dd && c.nav.etkin && c.nav.cur === 'page' && c.nav.tekEtkin && t.r['ap-physics'].nav.etkin && t.r['ap-physics'].nav.tekEtkin && i0.nav && !i0.nav.etkin,
      'Çalış a) menüde Çalış doğrudan calis.html (açılır menü yok); calis ve ders sayfasında yalnız Çalış etkin', [c.nav, t.r['ap-physics'].nav]);
    ok(c.kartlar.join() === 'ap-calculus,ap-physics,ap-chemistry,ap-biology,ap-english,ap-electives,sinav-cents' && c.konu.join() === c.kartlar.map(x => x + '.html').join() &&
      c.deneme.join() === ['calculus-ab', 'calculus-bc', 'physics-1', 'chemistry', 'biology', 'english-language', 'cs-a', 'economics', 'cents'].map(k => 'deneme.html?ders=' + k).join(),
      'Çalış a) 7 ders kartı (6 AP + CEnT-S), her kartta Konu anlatımı + Deneme (9 deneme kodu)', c);
    ok(c.saTur === 'hata' && c.saTur === i0.saTur && c.saBaslik === i0.saBaslik && c.saGit === i0.saGit, 'Çalış a) Sıradaki çalışma = Bugün Sıradaki adım (' + c.saBaslik + ' → ' + c.saGit + ')');
    ok(c.ck[0] === 'ck-unite=ap-physics.html#phys-unit1-quiz-container' && c.yanlis === '6' && c.yanlisHref === i0.saGit && /6 açık hata/.test(c.physHata) && c.ov <= 0 && t.errs.length === 0, 'Çalış a) Kaldığın yer Physics Unit 1, Yanlışlarım 6 (Bugün ile aynı hedef), Physics kartında 6 açık hata, taşma yok, hata yok', [c.ck, c.yanlisHref, t.errs]);
    // b) Yarım deneme: iki ekranda da önce gelir
    t = await ac(LISE, { 'apmeberra:deneme:v1': DENEME, 'apmeberra:errors:v1': HATA }, ['index', 'calis']);
    ok(t.r.calis.saTur === 'deneme' && t.r.index.saTur === 'deneme' && t.r.calis.saBaslik === t.r.index.saBaslik && t.r.calis.ck.some(x => x === 'ck-deneme=deneme.html'), 'Çalış b) yarım deneme iki ekranda da sıradaki (' + t.r.calis.saBaslik + '), Kaldığın yer listesinde');
    // c) Boş durum: çalışma planının ilk görevi Bugün'deki "Çalışma planın" listesinin ilk göreviyle aynı
    t = await ac(LISE, {}, ['index', 'calis']);
    ok(t.r.calis.saTur === 'plan' && t.r.calis.saBaslik === t.r.index.todo0 && t.r.calis.ckBos && t.r.calis.yanlis === '0' && t.errs.length === 0, 'Çalış c) boş durum: sıradaki çalışma = Bugün çalışma planının ilk görevi (' + t.r.calis.saBaslik + '), Kaldığın yer boş durum metni');
    // d) Üniversite mezunu: AP çalışma alanı yerine Sınavlar yönlendirmesi
    t = await ac({ ogrenciModeli: 'uni-mezun', sinif: 'lisans-mezun', ulkeler: ['nl'], aktifRota: 'nl', egitimDili: 'en', hedefBaslangicYili: '2027', lisansAlani: 'Makine', lisansDurumu: 'mezun', lisansMezuniyetYili: '2025', tamamlandi: true }, {}, ['calis']);
    ok(t.r.calis.yl === true && t.r.calis.icerik === false && t.r.calis.ylHref === 'sinavlar.html?model=uni-mezun' && t.r.calis.nav === null && t.errs.length === 0, 'Çalış d) üniversite mezunu: bilgi kartı → Sınavlar, ders kartları gizli, menüde Çalış yok');
  }

  // 6) Yerel bağlantılar: tüm sayfalardaki href'ler var olan dosyalara gidiyor
  {
    const missing = new Set(); let checked = 0;
    for (const s of PAGES.concat(['giris'])) {
      const html = fs.readFileSync(ROOT + s + '.html', 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
      for (const m of html.matchAll(/href="([^"#?]+)(?:[#?][^"]*)?"/g)) {
        const h = m[1];
        if (/^(https?:|mailto:|data:|javascript:)/.test(h) || !h) continue;
        checked++;
        if (!fs.existsSync(path.join(ROOT, decodeURIComponent(h)))) missing.add(s + ' -> ' + h);
      }
    }
    ok(missing.size === 0, `yerel bağlantılar: ${checked} bağlantı, eksik ${missing.size} ${[...missing].slice(0, 5).join(' | ')}`);
  }

  // 6b) Tema yanıp sönmesi (Tur 14): <head> içinde, <body>'den önce erken tema betiği
  {
    const EARLY = 'localStorage.getItem("apmeberra:theme")';
    const eksik = [];
    for (const s of PAGES.concat(['giris', 'mezun'])) {
      const html = fs.readFileSync(ROOT + s + '.html', 'utf8');
      const head = html.slice(0, html.indexOf('<body'));
      if (head.indexOf(EARLY) < 0) eksik.push(s);
    }
    const zorunlu = eksik.filter(s => !s.startsWith('ap-'));
    ok(zorunlu.length === 0, 'erken tema betiği: ap-* dışı tüm sayfaların <head> bölümünde' + (zorunlu.length ? ' — eksik: ' + zorunlu.join(', ') : ''));
    const ap = eksik.filter(s => s.startsWith('ap-'));
    console.log('INFO erken tema betiği eksik ders sayfaları (içerik ajanları ekleyecek): ' + (ap.length ? ap.join(', ') : 'yok'));
  }

  // 7) Ders sayfası: emoji avatar yerine monogram, kaynak düğmeleri dış bağlantı sınıfında
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    await require('./oturum-tohum')(ctx);
    const p = await ctx.newPage(); await p.goto(URL('ap-calculus.html')); await p.waitForTimeout(800);
    ok((await p.textContent('.agent-avatar')).trim() === 'SD', 'ders: eğitmen monogramı SD');
    const rl = await p.$$eval('a.resource-link', l => l.map(a => ({ t: a.textContent.trim(), rel: a.rel })));
    ok(rl.length >= 10 && rl.every(x => !/[\u{1F300}-\u{1FAFF}]/u.test(x.t) && x.rel.includes('noopener')), 'ders: ' + rl.length + ' kaynak bağlantısı emojisiz ve rel=noopener');
    ok((await p.textContent('.navbar .brand-title')) === 'Hazırlık Portalı', 'ders: marka satırı tek tip');
    ok(await p.evaluate(() => document.body.dataset.course === 'ap-calculus' && document.body.classList.contains('page-course')), 'ders: body vurgu rengi işaretli');
    await p.goto(URL('ajanlar.html')); await p.waitForTimeout(800);
    const mono = await p.$$eval('#agent-cards-grid .agent-avatar', l => l.map(x => x.textContent.trim()));
    ok(mono.length === 9 && mono.every(t => /^[A-ZÇĞİÖŞÜ]{1,2}$/.test(t)), 'ajanlar: 9 monogram ' + mono.join(','));
    await ctx.close();
  }

  await b.close();
  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi.`);
  process.exit(fail ? 1 : 0);
})();
