// Tur 5 hesap/oturum akış testi (Ajan 11). Çalıştır: node hesap-test.js
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const ROOT = 'C:/Users/hp/Desktop/projelerim/AP MEBERRA/';
const URL = f => 'file:///C:/Users/hp/Desktop/projelerim/AP%20MEBERRA/' + f;
const SHOTS = path.resolve(__dirname, '../shots');
fs.mkdirSync(SHOTS, { recursive: true });
let fail = 0, pass = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (c) pass++; else fail++; };
const has = f => fs.existsSync(ROOT + f);

// Spec §5.1 / §5.2 şemasına uyan küçük SAHTE veri (yalnızca test; projeye yazılmaz)
const FAKE_ULKELER = [{
  id: 'de', ad: 'Almanya', ozet: 'Sahte test verisi: Almanya özeti.',
  kabulYolu: [{ baslik: 'Diploma denkliği', detay: 'anabin kontrolü', kaynak: 'https://anabin.kmk.org' }, { baslik: 'uni-assist VPD', detay: 'Ön inceleme', kaynak: 'https://www.uni-assist.de' }],
  genelIsterler: [{ baslik: 'Dil belgesi', detay: 'IELTS 6.5', kaynak: 'https://www.daad.de' }],
  sinavlar: ['ap-calculus-ab', 'ielts-academic'],
  takvim: [{ tarih: '2026-01-15', olay: 'Geçmiş olay', kaynak: 'https://www.uni-assist.de' }, { tarih: '2027-07-15', olay: 'Kış dönemi son başvuru', kaynak: 'https://www.uni-assist.de' }],
  universiteler: [
    { id: 'tum', ad: 'Technische Universität München', sehir: 'Münih', web: 'https://www.tum.de', programlar: [{ ad: 'Electrical Engineering', derece: 'B.Sc.', dil: 'English', sure: '6 semestr', kaynak: 'https://www.tum.de' }], isterler: [{ baslik: 'Almanca', detay: 'Doğrulanamadı', kaynak: 'https://www.tum.de' }], basvuruDonemi: '1 Mart – 15 Temmuz', ucret: 'Doğrulanamadı', kaynak: 'https://www.tum.de', dogrulamaTarihi: '2026-10-12' },
    { id: 'fau', ad: 'FAU Erlangen-Nürnberg', sehir: 'Erlangen', web: 'https://www.fau.eu', programlar: [{ ad: 'Mechatronics', derece: 'B.Sc.', dil: 'English', sure: '6 semestr', kaynak: 'https://www.fau.eu' }], isterler: [], basvuruDonemi: '15 Temmuz', ucret: '0 €', kaynak: 'https://www.fau.eu', dogrulamaTarihi: '2026-10-12' }
  ],
  kaynaklar: ['https://anabin.kmk.org']
}, {
  id: 'it', ad: 'İtalya', ozet: 'Sahte test verisi: İtalya özeti.', kabulYolu: [], genelIsterler: [], sinavlar: ['cents'], takvim: [],
  universiteler: [{ id: 'polimi', ad: 'Politecnico di Milano', sehir: 'Milano', web: 'https://www.polimi.it', programlar: [{ ad: 'Civil Engineering', derece: 'B.Sc.', dil: 'English', sure: '3 yıl', kaynak: 'https://www.polimi.it' }], isterler: [{ baslik: 'CEnT-S', detay: '75/100', kaynak: 'https://www.cisiaonline.it' }], basvuruDonemi: 'Doğrulanamadı', ucret: 'Doğrulanamadı', kaynak: 'https://www.polimi.it', dogrulamaTarihi: '2026-10-12' }],
  kaynaklar: []
}];
const FAKE_SINAVLAR = [
  { id: 'ap-calculus-ab', ad: 'AP Calculus AB', kategori: 'AP', kurum: 'College Board', ulkeler: ['de', 'it'], format: 'MCQ + FRQ', sure: '3 saat 15 dk', puanlama: '1–5', tarih: '2027-05-11', dersSayfasi: 'ap-calculus.html', denemeKodu: 'calculus-ab', durum: 'hazir', not: 'test', kaynak: 'https://apstudents.collegeboard.org' },
  { id: 'ap-physics-c-em', ad: 'AP Physics C: E&M', kategori: 'AP', kurum: 'College Board', ulkeler: ['de'], format: 'MCQ + FRQ', sure: '1 saat 30 dk', puanlama: '1–5', tarih: '2027-05-14', dersSayfasi: null, denemeKodu: null, durum: 'yakinda', not: '', kaynak: 'https://apstudents.collegeboard.org' },
  { id: 'cents', ad: 'CEnT-S', kategori: 'Giriş Sınavı', kurum: 'CISIA', ulkeler: ['it'], format: 'Çevrimiçi', sure: 'Doğrulanamadı', puanlama: '0–100', tarih: '26 Kasım 2026', dersSayfasi: null, denemeKodu: 'cents', durum: 'kismi', not: '', kaynak: 'https://www.cisiaonline.it' },
  { id: 'ielts-academic', ad: 'IELTS Academic', kategori: 'Dil Sınavı', kurum: 'British Council / IDP', ulkeler: ['de', 'it'], format: '4 beceri', sure: '2 saat 45 dk', puanlama: '0–9', tarih: 'Ayda birkaç kez', dersSayfasi: 'ap-english.html', denemeKodu: null, durum: 'kismi', not: '', kaynak: 'https://www.ielts.org' }
];
const DENEME = { v: 1, aktif: null, gecmis: [{ id: 'd1', kod: 'calculus-ab', ad: 'AP Calculus AB', tarih: new Date().toISOString(), soruSayisi: 10, dogru: 7, yanlis: 3, bos: 0, yuzde: 70 }] };
const realUlke = has('data/mevzuat/ulkeler.js'), realSinav = has('data/mevzuat/sinavlar.js');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
  const mk = async (opts = {}) => {
    const ctx = await b.newContext(Object.assign({ viewport: { width: 1280, height: 900 }, colorScheme: 'light', acceptDownloads: true }, opts));
    const p = await ctx.newPage();
    p._errs = []; p._missing = [];
    p.on('pageerror', e => p._errs.push(e.message));
    p.on('console', m => { if (m.type() !== 'error') return; const t = m.text(); if (/ERR_FILE_NOT_FOUND|Failed to load resource/.test(t)) p._missing.push(t); else p._errs.push('console: ' + t); });
    p.on('dialog', d => d.accept());
    return { ctx, p };
  };
  const LS = (p, k) => p.evaluate(k => localStorage.getItem(k), k);
  const fill = async (p, sel, v) => { await p.fill(sel, ''); await p.fill(sel, v); };

  // ===================== A. Korumalı sayfa -> giriş =====================
  const { ctx, p } = await mk();
  await p.goto(URL('giris.html')); await p.evaluate(() => localStorage.clear());
  // Tur 10 (K4): oturumsuz Panelim açık giriş noktasına (sartlar.html), kilitli ders sayfası girişe gider
  await p.goto(URL('index.html'));
  await p.waitForURL(/sartlar\.html/);
  ok(true, 'oturum yok: index -> sartlar.html (K4 acik giris noktasi)');
  await p.goto(URL('ap-calculus.html'));
  await p.waitForURL(/giris\.html\?donus=ap-calculus\.html/);
  ok(true, 'oturum yok: ders sayfasi -> giris.html?donus=ap-calculus.html');
  ok(await p.evaluate(() => document.documentElement.hasAttribute('data-apz-auth')), 'giris.html gorunur (data-apz-auth)');
  ok(await p.isVisible('#panel-giris') && !(await p.isVisible('#panel-kayit')), 'varsayilan sekme: Giris');
  ok((await p.textContent('.storage-note')).includes('şifren hiçbir sunucuya gönderilmez'), 'durust depolama notu var');
  await p.screenshot({ path: `${SHOTS}/t5-giris-desktop-light.png`, fullPage: true });

  // ===================== B. Kayıt =====================
  await p.focus('#tab-giris'); await p.keyboard.press('ArrowRight');
  ok(await p.isVisible('#panel-kayit') && await p.evaluate(() => document.activeElement.id) === 'tab-kayit', 'sekme: ok tusu ile Kayit ol');
  await p.click('#kayit-submit');
  await p.waitForSelector('#kayit-ad-err:not(:empty)');
  ok(await p.getAttribute('#kayit-ad', 'aria-invalid') === 'true', 'bos form: ad aria-invalid');
  ok(await p.evaluate(() => document.activeElement.id) === 'kayit-ad', 'bos form: odak ilk hatali alana');
  await fill(p, '#kayit-ad', 'Elif'); await fill(p, '#kayit-soyad', 'Demir'); await fill(p, '#kayit-kullaniciAdi', 'elif.d');
  await fill(p, '#kayit-sifre', 'kisa'); await fill(p, '#kayit-sifre2', 'kisa');
  await p.click('#kayit-submit'); await p.waitForSelector('#kayit-sifre-err:not(:empty)');
  ok((await p.textContent('#kayit-sifre-err')).includes('8'), 'kisa sifre reddedildi');
  await fill(p, '#kayit-sifre', 'Guvenli123!'); await fill(p, '#kayit-sifre2', 'Guvenli123?');
  await p.click('#kayit-submit'); await p.waitForSelector('#kayit-sifre2-err:not(:empty)');
  ok((await p.textContent('#kayit-sifre2-err')).includes('eşleşmiyor'), 'sifre tekrari eslesmiyor');
  // göster/gizle
  await p.click('[aria-controls="kayit-sifre"]');
  ok(await p.getAttribute('#kayit-sifre', 'type') === 'text' && await p.getAttribute('[aria-controls="kayit-sifre"]', 'aria-pressed') === 'true', 'sifre goster');
  await p.click('[aria-controls="kayit-sifre"]');
  ok(await p.getAttribute('#kayit-sifre', 'type') === 'password', 'sifre gizle');
  await fill(p, '#kayit-sifre2', 'Guvenli123!');
  const t0 = Date.now();
  await p.click('#kayit-submit');
  await p.waitForSelector('#view-code:not([hidden])');
  console.log('     kayit suresi (2x PBKDF2 150k): ' + (Date.now() - t0) + ' ms');
  const code1 = await p.textContent('#code-value');
  ok(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/.test(code1), 'kurtarma kodu gosterildi: ' + code1);
  ok(await p.isDisabled('#code-continue'), 'onay kutusu isaretlenmeden Devam pasif');
  const users = JSON.parse(await LS(p, 'apmeberra-hesap:v1:kullanicilar'));
  const raw = JSON.stringify(users);
  ok(users.length === 1 && !raw.includes('Guvenli123!') && !raw.includes(code1) && !raw.includes(code1.replace(/-/g, '')), 'sifre ve kod duz metin saklanmadi');
  ok(users[0].iter >= 150000 && /^[0-9a-f]{32}$/.test(users[0].salt) && /^[0-9a-f]{64}$/.test(users[0].hash) && /^[0-9a-f]{64}$/.test(users[0].kurtarmaHash), 'PBKDF2 alanlari: iter>=150k, 16B salt, 32B hash');
  ok(await p.evaluate(() => window.APMEBERRA_AUTH.usingWebCrypto()), 'Web Crypto kullaniliyor');
  await p.screenshot({ path: `${SHOTS}/t5-kurtarma-kodu-desktop-light.png` });
  await p.check('#code-ack'); await p.click('#code-continue');
  await p.waitForURL(/profil\.html/);
  ok(true, 'kayit -> profil.html');

  // ===================== C. Profil sihirbazı =====================
  ok(await p.isVisible('#wizard') && !(await p.isVisible('.nav-links')), 'sihirbaz gorunur, profil bitmeden ana menu yok');
  // Tur 11 (plan §3.8): 1 Durumun → 2 Ayrıntı (okul + sınıf) → 3 Ülkeler → 4 Eğitim dili
  await p.click('#wz-next'); await p.waitForSelector('#wz-ogrenciModeli-err:not(:empty)');
  ok(true, 'durum secilmedi: hata');
  await p.click('#wz-ogrenciModeli-group input[value="lise"] >> xpath=..'); await p.click('#wz-next');
  await p.waitForSelector('#wz-step-2:not([hidden])');
  await p.click('#wz-next'); await p.waitForSelector('#wz-okul-err:not(:empty)');
  ok(true, 'okul bos: hata');
  ok((await p.$$eval('#okul-listesi option', o => o.map(x => x.value))).includes('MEF Okulları'), 'okul datalist');
  await fill(p, '#wz-okul', 'MEF Okulları');
  await p.click('#wz-next'); await p.waitForSelector('#wz-sinif-err:not(:empty)'); ok(true, 'sinif secilmedi: hata');
  await p.click('#wz-sinif-group label:has-text("11. sınıf")'); await p.click('#wz-next');
  await p.waitForSelector('#wz-step-3:not([hidden])');
  await p.click('#wz-next'); await p.waitForSelector('#wz-ulkeler-err:not(:empty)'); ok(true, 'ulke secilmedi: hata');
  await p.click('#wz-ulkeler-group label:has-text("Almanya")'); await p.click('#wz-ulkeler-group input[value="it"] >> xpath=..');
  ok(await p.$$eval('#wz-ulkeler-group .choice-card.is-checked', e => e.length) === 2, 'iki ulke karti isaretli');
  await p.screenshot({ path: `${SHOTS}/t5-sihirbaz-desktop-light.png`, fullPage: true });
  await p.click('#wz-next'); await p.waitForSelector('#wz-step-4:not([hidden])');
  ok(await p.isChecked('#wz-egitimDili-group input[value="en"]'), 'egitim dili varsayilan Ingilizce');
  await p.click('#wz-next');
  await p.waitForURL(/universiteler\.html/);
  const uid = users[0].id;
  const prof = JSON.parse(await LS(p, 'apmeberra-hesap:v1:profil:' + uid));
  ok(prof.okul === 'MEF Okulları' && prof.sinif === '11' && prof.ulkeler.join() === 'de,it' && prof.tamamlandi === true, 'profil kaydi: ' + JSON.stringify(prof));

  // ===================== D. Üniversiteler (gerçek veri) =====================
  ok(JSON.parse(await LS(p, 'apmeberra:panel:v1')).universiteGoruldu, 'universite ziyareti panel durumuna yazildi');
  await p.waitForSelector('.country-tabs');
  ok(await p.$$eval('.country-tabs [role=tab]', t => t.length) === 2, 'profil ulkeleri (DE+IT) sekme olarak geldi');
  const nUniDe = await p.$$eval('#panel-de .uni-card', e => e.length);
  ok(nUniDe > 0, 'gercek veri: DE ' + nUniDe + ' universite karti');
  ok(await p.$$eval('#panel-de .path-steps li', e => e.length) > 0 && await p.$$eval('#panel-de .req-card', e => e.length) > 0 && await p.$$eval('#panel-de .timeline li', e => e.length) > 0, 'gercek veri: kabul yolu, genel isterler, takvim cizildi');
  const chipIds = await p.$$eval('#panel-de .exam-chip', a => a.map(x => decodeURIComponent(x.getAttribute('href').split('#')[1])));
  ok(chipIds.length > 0 && (await p.$$eval('#panel-de .exam-chip', a => a.every(x => /^sinavlar\.html#/.test(x.getAttribute('href'))))), 'gerekli sinavlar -> sinavlar.html#id (' + chipIds.length + ')');
  await p.fill('#c-de-q', 'zzzqqq'); await p.waitForTimeout(250);
  ok(await p.isVisible('#c-de-empty'), 'arama: sonuc yok durumu');
  await p.fill('#c-de-q', ''); await p.waitForTimeout(250);
  ok(await p.$$eval('#panel-de .uni-card:not([hidden])', e => e.length) === nUniDe, 'arama temizlenince hepsi geri geldi');
  await p.screenshot({ path: `${SHOTS}/t5-universiteler-desktop-light.png`, fullPage: true });
  await p.focus('#tab-de'); await p.keyboard.press('ArrowRight');
  ok(await p.isVisible('#panel-it .uni-card') && await p.evaluate(() => document.activeElement.id) === 'tab-it', 'sekme klavye: Italya');

  // Sahte veriyle (spec §5.1 şeması; data dosyası yok sayılır) ayrıntılı çizim testi
  {
    const p2 = await ctx.newPage(); p2.on('pageerror', e => p._errs.push('p2: ' + e.message));
    await p2.addInitScript(([u, s]) => {
      Object.defineProperty(window, 'APMEBERRA_ULKELER', { value: u, writable: false });
      Object.defineProperty(window, 'APMEBERRA_SINAVLAR', { value: s, writable: false });
    }, [FAKE_ULKELER, FAKE_SINAVLAR]);
    await p2.goto(URL('universiteler.html')); await p2.waitForSelector('.country-tabs');
    ok(await p2.$$eval('#panel-de .uni-card', e => e.length) === 2, 'sahte veri: DE 2 universite karti');
    ok(await p2.isVisible('#panel-de .uni-facts .unverified'), 'sahte veri: "Dogrulanamadi" isaretli');
    // Tur 14 A4: takvim listenin altındaki "kabul nasıl işler?" açılır bölümünde (kapalı gelir)
    ok(await p2.isHidden('#panel-de .timeline') && await p2.evaluate(() => document.getElementById('c-de-takvim').tagName === 'DETAILS'), 'sahte veri: takvim açılır bölümde, başlangıçta kapalı');
    await p2.click('#c-de-takvim > summary');
    ok(await p2.isVisible('#panel-de .timeline li.is-past'), 'sahte veri: gecmis tarih soluk');
    await p2.fill('#c-de-q', 'mechatron'); await p2.waitForTimeout(250);
    ok(await p2.$$eval('#panel-de .uni-card:not([hidden])', e => e.length) === 1, 'sahte veri: program adina gore arama');
    await p2.fill('#c-de-q', ''); await p2.waitForTimeout(200);
    await p2.selectOption('#c-de-city', 'Münih');
    ok(await p2.$$eval('#panel-de .uni-card:not([hidden])', e => e.length) === 1, 'sahte veri: sehir filtresi');
    await p2.close();
    const p3 = await ctx.newPage(); p3.on('pageerror', e => p._errs.push('p3: ' + e.message));
    await p3.addInitScript(() => { Object.defineProperty(window, 'APMEBERRA_ULKELER', { value: [], writable: false }); Object.defineProperty(window, 'APMEBERRA_SINAVLAR', { value: [], writable: false }); });
    await p3.goto(URL('universiteler.html')); await p3.waitForTimeout(200);
    ok(await p3.isVisible('text=Üniversite verisi hazırlanıyor'), 'bos veri: "hazirlaniyor" durumu');
    await p3.screenshot({ path: `${SHOTS}/t5-universiteler-bos-desktop-light.png` });
    await p3.goto(URL('sinavlar.html')); await p3.waitForTimeout(200);
    ok(await p3.isVisible('text=Sınav listesi hazırlanıyor'), 'bos veri: sinavlar "hazirlaniyor" durumu');
    await p3.close();
  }

  // ===================== E. Sınavlar (gerçek veri) =====================
  await p.goto(URL('sinavlar.html'));
  await p.waitForSelector('.exam-toolbar');
  const allIds = await p.$$eval('.exam-card', e => e.map(x => x.id));
  ok(chipIds.every(id => allIds.includes(id)), 'universitelerdeki her sinav baglantisi bir karta cikiyor');
  ok(await p.$$eval('.exam-card:not([hidden])', e => e.every(x => x.dataset.kategori === 'AP')) && await p.$$eval('.exam-card:not([hidden])', e => e.length) > 0, 'AP sekmesi yalnizca AP kartlari');
  ok(await p.isVisible('#ap-physics-c-em [aria-disabled="true"]:has-text("Yakında")'), 'denemeKodu null: pasif "Yakinda"');
  ok(await p.getAttribute('#ap-calculus-ab a.btn-primary', 'href') === 'deneme.html?ders=calculus-ab', 'deneme baglantisi deneme.html?ders=<kod>');
  ok(await p.getAttribute('#ap-calculus-ab .exam-actions a.btn-ghost', 'href') === 'ap-calculus.html', 'ders anlatimi baglantisi');
  await p.click('#ap-calculus-ab .pin-btn');
  ok(JSON.parse(await LS(p, 'apmeberra:panel:v1')).sinavlarim.includes('ap-calculus-ab'), 'Listeme ekle -> apmeberra:panel:v1');
  await p.click('[role=tab]:has-text("Giriş")');
  ok(await p.isVisible('#cent-s') && !(await p.isVisible('#ap-calculus-ab')), 'Giris Sinavlari sekmesi');
  await p.selectOption('#ulke-filtre', 'de');
  ok(!(await p.isVisible('#cent-s')), 'ulke filtresi DE: CEnT-S gizlendi');
  await p.selectOption('#ulke-filtre', 'listem'); await p.click('[role=tab]:has-text("AP")');
  ok(await p.$$eval('.exam-card:not([hidden])', e => e.map(x => x.id).join()) === 'ap-calculus-ab', '"Yalnizca listem" filtresi');
  await p.selectOption('#ulke-filtre', 'profil');
  await p.screenshot({ path: `${SHOTS}/t5-sinavlar-desktop-light.png`, fullPage: true });
  await p.goto(URL('sinavlar.html#ielts-academic')); await p.waitForTimeout(300);
  ok(await p.getAttribute('[role=tab]:has-text("Dil")', 'aria-selected') === 'true' && await p.isVisible('#ielts-academic'), '#ielts-academic -> Dil sekmesi acildi');


  // ===================== F. Ders sayfası + menü =====================
  await p.goto(URL('ap-physics.html')); await p.waitForTimeout(1500);
  ok(await p.isVisible('.account-btn'), 'ders sayfasinda hesap menusu');
  ok((await p.textContent('.account-btn')).includes('Elif'), 'avatar/ad: Elif');
  const q = await p.evaluate(() => PHYS_UNIT1_QUESTIONS.slice(0, 2).map(q => ({ id: q.id, correct: q.options.find(o => o.isCorrect).id, wrong: q.options.find(o => !o.isCorrect).id })));
  await p.click(`#opt-btn-${q[0].id}-${q[0].correct}`);
  ok((await p.textContent(`#feedback-${q[0].id}`)).includes('Tebrikler Elif!'), 'geri bildirim kisisel: "Tebrikler Elif!"');
  await p.click(`#opt-btn-${q[1].id}-${q[1].wrong}`);
  // Menü (Tur 14 A6): ders sayfasında "Çalış" (doğrudan calis.html) etkin; açılır menü klavye deseni Hedefim alt menüsünde
  ok(await p.evaluate(() => { const a = document.querySelector('.nav-links > li[data-nav="calis"] > a'); return !!a && a.getAttribute('href') === 'calis.html' && a.classList.contains('active') && !document.querySelector('.nav-links > li[data-nav="calis"] button') && document.querySelectorAll('.nav-links > li.is-active').length === 1; }), 'menu: ders sayfasinda yalnizca "Calis" etkin (calis.html, acilir menu yok)');
  const sbtn = p.locator('.nav-links > li[data-nav="hedefim"] > button');
  await sbtn.focus(); await p.keyboard.press('ArrowDown');
  ok(await p.evaluate(() => document.activeElement.getAttribute('href')) === 'sartlar.html', 'menu: Hedefim ArrowDown ilk baglantiya (Ulke sartlari) odaklandi');
  await p.keyboard.press('End');
  ok(await p.evaluate(() => document.activeElement.getAttribute('href')) === 'italya-muhendislik.html', 'menu: End son baglanti (Italya rehberi)');
  await p.keyboard.press('Escape');
  ok(await sbtn.getAttribute('aria-expanded') === 'false' && await p.evaluate(() => (document.activeElement.getAttribute('aria-label') || '').includes('Hedefim')), 'menu: Escape kapatti, odak dugmeye dondu');
  // Bölünmüş öğe: "Başvuru" etiketi tek tıkla yazismalar.html, ok düğmesi alt menü (Sınavlar)
  ok(await p.evaluate(() => { const li = document.querySelector('.nav-links > li[data-nav="basvuru"]'); return li.querySelector(':scope > a').getAttribute('href') === 'yazismalar.html' && !!li.querySelector('.nav-dropdown a[href="sinavlar.html"]'); }), 'menu: Basvuru -> yazismalar.html, alt menude Sinavlar');
  await p.click('.account-btn');
  ok(await p.isVisible('#account-menu') && (await p.textContent('#account-menu')).includes('MEF Okulları · 11. sınıf'), 'hesap menusu: ad, okul · sinif');
  await p.screenshot({ path: `${SHOTS}/t5-hesap-menu-desktop-light.png` });
  await p.keyboard.press('Escape');
  await p.click('.nav-links > li[data-nav="hedefim"] > button');
  await p.screenshot({ path: `${SHOTS}/t5-menu-sinavlar-desktop-light.png` });
  await p.keyboard.press('Escape');

  // ===================== G. Panel =====================
  await p.evaluate(d => localStorage.setItem('apmeberra:deneme:v1', JSON.stringify(d)), DENEME);
  await p.goto(URL('index.html')); await p.waitForTimeout(300);
  ok((await p.textContent('h1#today-title')) === 'Merhaba Elif', 'panel: "Merhaba Elif"');
  ok((await p.textContent('#hello-pills')).includes('MEF Okulları') && (await p.textContent('#hello-pills')).includes('Almanya'), 'panel: okul + hedef ulke');
  const road = await p.$$eval('.road-step', e => e.map(x => x.className));
  ok(road.length === 4 && road.slice(0, 4).every(c => c.includes('is-done')), 'yol haritasi: 4 adim tamamlandi (deneme dahil): ' + road.join('|'));
  ok((await p.textContent('#last-exam-body')).includes('%70'), 'son deneme: %70');
  ok(await p.isVisible('#todo-list .todo-item') && await p.isVisible('#timer-days') && await p.isVisible('#home-ring'), 'eski gorev listesi, sayac, halka korundu');
  await p.screenshot({ path: `${SHOTS}/t5-panel-desktop-light.png`, fullPage: true });
  await p.evaluate(() => localStorage.removeItem('apmeberra:deneme:v1'));
  await p.reload(); await p.waitForTimeout(200);
  ok((await p.textContent('#last-exam-body')).includes('Henüz deneme'), 'deneme yokken bos durum');
  ok((await p.getAttribute('.road-step:nth-child(4)', 'class')).includes('is-current'), 'deneme yokken 4. adim "siradaki"');

  // Deneme sayfası (deneme ajanının sayfası) oturumla açılıyor mu, kayıt görünüyor mu
  await p.evaluate(d => localStorage.setItem('apmeberra:deneme:v1', JSON.stringify(d)), DENEME);
  await p.goto(URL('deneme.html?ders=calculus-ab')); await p.waitForTimeout(1200);
  ok(/deneme.html/.test(p.url()) && await p.isVisible('.account-btn'), 'deneme.html oturumla acildi, menu var');
  await p.goto(URL('index.html')); await p.waitForTimeout(200);

  // ===================== H. Çıkış =====================
  await p.click('.account-btn'); await p.click('.account-logout');
  await p.waitForSelector('#auth-status:not([hidden])');
  ok((await p.textContent('#auth-status')).includes('Çıkış yaptın'), 'cikis mesaji');
  const afterOut = await p.evaluate(uid => ({ live: Object.keys(localStorage).filter(k => k.startsWith('apmeberra:') && k !== 'apmeberra:theme'), vault: !!localStorage.getItem('apmeberra-hesap:v1:veri:' + uid), sess: localStorage.getItem('apmeberra-hesap:v1:oturum') }), uid);
  ok(afterOut.live.length === 0 && afterOut.vault && !afterOut.sess, 'cikis: canli veri kasaya tasindi, oturum silindi');
  ok(!(await p.isVisible('.account-btn')), 'cikistan sonra hesap menusu yok');
  await p.goto(URL('ap-physics.html'));
  await p.waitForURL(/giris\.html\?donus=ap-physics\.html/);
  ok(true, 'cikistan sonra ders sayfasi -> giris (donus=ap-physics.html)');

  // ===================== I. İkinci kullanıcı =====================
  await p.click('#tab-kayit');
  await fill(p, '#kayit-ad', 'Can'); await fill(p, '#kayit-soyad', 'Yıldız'); await fill(p, '#kayit-kullaniciAdi', 'Elif.D');
  await fill(p, '#kayit-sifre', 'BaskaSifre9'); await fill(p, '#kayit-sifre2', 'BaskaSifre9');
  await p.click('#kayit-submit'); await p.waitForSelector('#kayit-kullaniciAdi-err:not(:empty)');
  ok((await p.textContent('#kayit-kullaniciAdi-err')).includes('zaten'), 'kullanici adi buyuk/kucuk harf duyarsiz benzersiz');
  await fill(p, '#kayit-kullaniciAdi', 'can@example.com');
  await p.click('#kayit-submit'); await p.waitForSelector('#view-code:not([hidden])');
  ok(!(await p.isVisible('#view-orphan')), 'ikinci kullanici: sahipsiz veri sorusu yok');
  await p.check('#code-ack'); await p.click('#code-continue'); await p.waitForURL(/profil\.html/);
  await p.click('#wz-ogrenciModeli-group input[value="lise"] >> xpath=..'); await p.click('#wz-next');
  await fill(p, '#wz-okul', 'Kadıköy Anadolu Lisesi');
  await p.click('#wz-sinif-group label:has-text("12")'); await p.click('#wz-next');
  await p.click('#wz-ulkeler-group label:has-text("Almanya")'); await p.click('#wz-next'); await p.click('#wz-next');
  await p.waitForURL(/universiteler\.html/);
  await p.goto(URL('ilerleme.html')); await p.waitForTimeout(300);
  ok((await p.textContent('#k-answered')) === '0', 'ikinci kullaniciya ilk kullanicinin ilerlemesi SIZMADI (0 cozulen)');
  ok((await p.textContent('#ilerleme-eyebrow')).includes('Can Yıldız'), 'ilerleme basligi: Can Yildiz');
  await p.goto(URL('index.html')); await p.waitForTimeout(200);
  ok(!(await LS(p, 'apmeberra:deneme:v1')), 'Can: Elif deneme gecmisi sizmadi');
  ok((await p.textContent('h1#today-title')) === 'Merhaba Can', 'panel: Merhaba Can');
  const road2 = await p.$$eval('.road-step', e => e.map(x => x.className));
  ok(road2[0].includes('is-done') && !road2[1].includes('is-done') && !road2[2].includes('is-done'), 'Can: yalnizca 1. adim tamam (Elif\'in listesi sizmadi)');
  await p.click('.account-btn'); await p.click('.account-logout'); await p.waitForSelector('#auth-status:not([hidden])');

  // ===================== J. İlk kullanıcıyla tekrar giriş =====================
  await p.goto(URL('ap-physics.html')); await p.waitForURL(/giris\.html/);
  await fill(p, '#giris-kullaniciAdi', 'elif.d'); await fill(p, '#giris-sifre', 'yanlisSifre1');
  await p.click('#giris-submit'); await p.waitForSelector('#giris-alert:not([hidden])');
  const e1 = await p.textContent('#giris-alert');
  await fill(p, '#giris-kullaniciAdi', 'olmayan.kisi'); await fill(p, '#giris-sifre', 'yanlisSifre1');
  await p.click('#giris-submit'); await p.waitForTimeout(600);
  const e2 = await p.textContent('#giris-alert');
  ok(e1 === e2 && e1.includes('Kullanıcı adı veya şifre hatalı'), 'hatali giris: ayni genel mesaj (' + e1 + ')');
  ok(await p.evaluate(() => document.activeElement.id) === 'giris-alert', 'hata mesajina odak');
  await fill(p, '#giris-kullaniciAdi', 'ELIF.D'); await fill(p, '#giris-sifre', 'Guvenli123!');
  await p.click('#giris-submit');
  await p.waitForURL(/ap-physics\.html/);
  ok(true, 'buyuk harfle giris + donus sayfasina (ap-physics.html) geri donuldu');
  await p.waitForTimeout(800);
  const restored = await p.evaluate(() => { const v = JSON.parse(localStorage.getItem('apmeberra:quiz:v1')); let n = 0; Object.values(v.pages).forEach(pg => Object.values(pg.units).forEach(u => n += Object.keys(u.answers || {}).length)); return n; });
  ok(restored === 2, 'ilk kullanicinin ilerlemesi geri geldi (2 cevap)');
  ok(await p.evaluate(() => document.querySelectorAll('.option-btn.correct, .option-btn.wrong').length >= 2), 'ders sayfasinda cevaplar geri uygulandi');
  ok(JSON.parse(await LS(p, 'apmeberra:panel:v1')).sinavlarim.length === 1, 'Elif\'in sinav listesi geri geldi');
  await p.goto(URL('ilerleme.html')); await p.waitForTimeout(300);
  ok((await p.textContent('#k-answered')) === '2', 'ilerleme sayfasi: 2 cozulen');
  ok(JSON.parse(await LS(p, 'apmeberra:deneme:v1')).gecmis[0].id === 'd1', 'deneme gecmisi tekrar giriste geri geldi');

  // ===================== K. Şifre değiştir + yedek =====================
  await p.goto(URL('profil.html')); await p.waitForSelector('#profile:not([hidden])');
  ok((await p.inputValue('#pf-okul')) === 'MEF Okulları', 'profil duzenleme: okul dolu');
  await fill(p, '#pf-okul', 'Bilfen Liseleri'); await p.click('#pf-save'); await p.waitForSelector('#pf-alert:not([hidden])');
  ok(JSON.parse(await LS(p, 'apmeberra-hesap:v1:profil:' + uid)).okul === 'Bilfen Liseleri', 'profil guncellendi');
  await fill(p, '#pw-eski', 'yanlis-sifre'); await fill(p, '#pw-yeni', 'YeniSifre456'); await fill(p, '#pw-yeni2', 'YeniSifre456');
  await p.click('#pw-save'); await p.waitForSelector('#pw-eski-err:not(:empty)');
  ok(true, 'sifre degistir: yanlis mevcut sifre reddedildi');
  await fill(p, '#pw-eski', 'Guvenli123!'); await p.click('#pw-save');
  await p.waitForSelector('#pw-alert.is-ok:not([hidden])');
  ok(true, 'sifre degistirildi');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#bk-export')]);
  ok(/^apmeberra-ilerleme-\d{4}-\d{2}-\d{2}\.json$/.test(dl.suggestedFilename()), 'profil: yedek al calisti (' + dl.suggestedFilename() + ')');
  const bkFile = path.join(__dirname, 'yedek-test.json'); await dl.saveAs(bkFile);
  const bk = JSON.parse(fs.readFileSync(bkFile, 'utf8'));
  ok(Object.keys(bk.anahtarlar).every(k => k.startsWith('apmeberra:')) && !JSON.stringify(bk).includes('apmeberra-hesap'), 'yedek yalnizca apmeberra: anahtarlari (hesap/hash yok)');
  await p.setInputFiles('#bk-file', bkFile); await p.waitForSelector('#bk-preview:not([hidden])');
  await p.click('#bk-apply'); await p.waitForSelector('#bk-msg.is-ok:not([hidden])');
  ok((await p.textContent('#bk-msg')).includes('2 çözülmüş'), 'profil: yedek yukle (birlestir)');
  await p.screenshot({ path: `${SHOTS}/t5-profil-desktop-light.png`, fullPage: true });

  // ===================== L. Şifremi unuttum =====================
  await p.goto(URL('giris.html?cikis=1')); await p.waitForSelector('#auth-status:not([hidden])');
  await p.click('#to-recover');
  await fill(p, '#kurtar-kullaniciAdi', 'elif.d'); await fill(p, '#kurtar-kod', 'AAAA-BBBB-CCCC-DDDD');
  await fill(p, '#kurtar-sifre', 'KurtarSifre789'); await fill(p, '#kurtar-sifre2', 'KurtarSifre789');
  await p.click('#kurtar-submit'); await p.waitForSelector('#kurtar-alert:not([hidden])');
  ok((await p.textContent('#kurtar-alert')).includes('kurtarma kodu hatalı'), 'yanlis kurtarma kodu reddedildi');
  await fill(p, '#kurtar-kod', code1.toLowerCase().replace(/-/g, ' '));
  await p.click('#kurtar-submit'); await p.waitForSelector('#view-code:not([hidden])');
  const code2 = await p.textContent('#code-value');
  ok(code2 !== code1, 'kurtarma basarili, yeni kod verildi');
  await p.check('#code-ack'); await p.click('#code-continue');
  await fill(p, '#giris-sifre', 'KurtarSifre789'); await p.click('#giris-submit');
  await p.waitForURL(/index\.html/);
  ok(true, 'kurtarilan sifreyle giris');
  // eski kod tekrar kullanılamaz
  await p.goto(URL('giris.html?cikis=1')); await p.waitForSelector('#auth-status:not([hidden])');
  await p.click('#to-recover');
  await fill(p, '#kurtar-kullaniciAdi', 'elif.d'); await fill(p, '#kurtar-kod', code1);
  await fill(p, '#kurtar-sifre', 'BirBaskasi000'); await fill(p, '#kurtar-sifre2', 'BirBaskasi000');
  await p.click('#kurtar-submit'); await p.waitForSelector('#kurtar-alert:not([hidden])');
  ok((await p.textContent('#kurtar-alert')).includes('hatalı'), 'kullanilmis kurtarma kodu gecersiz');
  ok(p._errs.length === 0, 'ana akis: konsol/sayfa hatasi yok' + (p._errs.length ? ' -> ' + p._errs.join(' | ') : ''));
  console.log('     eksik dosya istekleri: ' + [...new Set(p._missing)].length);
  await ctx.close();

  // ===================== M. Sahipsiz eski ilerleme =====================
  {
    const { ctx, p } = await mk();
    await p.goto(URL('giris.html')); await p.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('apmeberra:quiz:v1', JSON.stringify({ v: 1, pages: { 'ap-physics': { units: { 'phys-unit1-quiz-container': { title: 'U1', total: 10, answers: { q1: { s: 'A', c: true, t: '2026-10-01T10:00:00Z' }, q2: { s: 'B', c: false, t: '2026-10-01T10:01:00Z' }, q3: { s: 'C', c: true, t: '2026-10-01T10:02:00Z' } } } } } } }));
      localStorage.setItem('apmeberra:theme', 'dark');
    });
    await p.reload();
    await p.click('#tab-kayit');
    await fill(p, '#kayit-ad', 'Meberra'); await fill(p, '#kayit-soyad', 'Test'); await fill(p, '#kayit-kullaniciAdi', 'azra');
    await fill(p, '#kayit-sifre', 'AzraSifre12'); await fill(p, '#kayit-sifre2', 'AzraSifre12');
    await p.click('#kayit-submit'); await p.waitForSelector('#view-code:not([hidden])');
    ok(await p.evaluate(() => !localStorage.getItem('apmeberra:quiz:v1') && !!localStorage.getItem('apmeberra-hesap:v1:sahipsiz')), 'sahipsiz veri park edildi (kaybolmadi)');
    await p.check('#code-ack'); await p.click('#code-continue');
    await p.waitForSelector('#view-orphan:not([hidden])');
    ok((await p.textContent('#orphan-stats')).includes('3'), 'sahipsiz veri teklifi: 3 cozulmus soru');
    await p.screenshot({ path: `${SHOTS}/t5-sahipsiz-desktop-dark.png` });
    await p.click('#orphan-yes'); await p.waitForURL(/profil\.html/);
    ok(await p.evaluate(() => { const v = JSON.parse(localStorage.getItem('apmeberra:quiz:v1')); return Object.keys(v.pages['ap-physics'].units['phys-unit1-quiz-container'].answers).length === 3 && !localStorage.getItem('apmeberra-hesap:v1:sahipsiz'); }), 'sahipsiz veri hesaba aktarildi');
    ok(await LS(p, 'apmeberra:theme') === 'dark', 'tema tercihi (cihaz) korundu');
    ok(p._errs.length === 0, 'sahipsiz akis: hata yok' + (p._errs.length ? ' -> ' + p._errs.join(' | ') : ''));
    await p.evaluate(() => localStorage.clear());
    await ctx.close();
  }

  // ===================== N. Saf JS yedeği (crypto.subtle yok) =====================
  {
    const { ctx, p } = await mk();
    await p.addInitScript(() => { try { Object.defineProperty(window.crypto, 'subtle', { value: undefined }); } catch (e) {} });
    await p.goto(URL('giris.html')); await p.evaluate(() => localStorage.clear()); await p.reload();
    ok(!(await p.evaluate(() => window.APMEBERRA_AUTH.usingWebCrypto())), 'crypto.subtle kapali: saf JS yolu');
    await p.click('#tab-kayit');
    await fill(p, '#kayit-ad', 'Deniz'); await fill(p, '#kayit-soyad', 'Ak'); await fill(p, '#kayit-kullaniciAdi', 'deniz');
    await fill(p, '#kayit-sifre', 'Yedekli1234'); await fill(p, '#kayit-sifre2', 'Yedekli1234');
    const t1 = Date.now();
    await p.click('#kayit-submit'); await p.waitForSelector('#view-code:not([hidden])');
    console.log('     saf JS kayit suresi: ' + (Date.now() - t1) + ' ms');
    const u = JSON.parse(await LS(p, 'apmeberra-hesap:v1:kullanicilar'))[0];
    const nodeHash = require('crypto').pbkdf2Sync('Yedekli1234', Buffer.from(u.salt, 'hex'), u.iter, 32, 'sha256').toString('hex');
    ok(nodeHash === u.hash, 'saf JS PBKDF2 = Node PBKDF2 (hash tasinabilir)');
    await p.evaluate(() => localStorage.clear());
    await ctx.close();
  }

  // ===================== O. Telefon + koyu tema + taşma =====================
  for (const [w, scheme] of [[390, 'light'], [390, 'dark'], [360, 'light'], [1280, 'dark']]) {
    const { ctx, p } = await mk({ viewport: { width: w, height: 800 }, colorScheme: scheme, isMobile: w < 500, hasTouch: w < 500 });
    await p.addInitScript(([u, s, ru, rs]) => { if (!ru) window.APMEBERRA_ULKELER = u; if (!rs) window.APMEBERRA_SINAVLAR = s; }, [FAKE_ULKELER, FAKE_SINAVLAR, realUlke, realSinav]);
    await p.goto(URL('giris.html')); await p.evaluate(() => localStorage.clear()); await p.reload();
    const tag = `${w}-${scheme}`;
    const overflow = async (name) => {
      const o = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      ok(o <= 0, `${tag} ${name}: yatay tasma yok (${o}px)`);
    };
    await overflow('giris');
    if (w !== 1280) await p.screenshot({ path: `${SHOTS}/t5-giris-${tag}.png`, fullPage: true });
    // hızlı kurulum: kayıt + profil
    await p.click('#tab-kayit');
    await fill(p, '#kayit-ad', 'Zeynep'); await fill(p, '#kayit-soyad', 'Uzunsoyadlıoğullarıgil'); await fill(p, '#kayit-kullaniciAdi', 'zeynep');
    await fill(p, '#kayit-sifre', 'Sifre12345'); await fill(p, '#kayit-sifre2', 'Sifre12345');
    await p.click('#kayit-submit'); await p.waitForSelector('#view-code:not([hidden])');
    await overflow('kurtarma kodu');
    await p.check('#code-ack'); await p.click('#code-continue'); await p.waitForURL(/profil\.html/);
    await p.click('#wz-ogrenciModeli-group input[value="lise-mezun"] >> xpath=..'); await p.click('#wz-next');
    await fill(p, '#wz-okul', 'İstanbul Erkek Lisesi Fen ve Teknoloji Bölümü Uzun Okul Adı');
    await p.click('#wz-yerlesmeDurumu-group label:has-text("Yerleşmem yok")'); // Tur 10 K5-a: mezunda zorunlu soru
    await p.click('#wz-next');
    await p.click('#wz-ulkeler-group label:has-text("Almanya")'); await p.click('#wz-ulkeler-group input[value="it"] >> xpath=..');
    await overflow('sihirbaz');
    if (w === 390) await p.screenshot({ path: `${SHOTS}/t5-sihirbaz-${tag}.png`, fullPage: true });
    await p.click('#wz-next'); await p.click('#wz-next'); await p.waitForURL(/universiteler\.html/); await p.waitForTimeout(200);
    await overflow('universiteler');
    await p.screenshot({ path: `${SHOTS}/t5-universiteler-${tag}.png`, fullPage: true });
    await p.goto(URL('sinavlar.html')); await p.waitForTimeout(200);
    await overflow('sinavlar');
    await p.screenshot({ path: `${SHOTS}/t5-sinavlar-${tag}.png`, fullPage: true });
    await p.goto(URL('index.html')); await p.waitForTimeout(300);
    await overflow('panel');
    await p.screenshot({ path: `${SHOTS}/t5-panel-${tag}.png`, fullPage: true });
    await p.goto(URL('profil.html')); await p.waitForTimeout(200);
    await overflow('profil');
    await p.screenshot({ path: `${SHOTS}/t5-profil-${tag}.png`, fullPage: true });
    await p.goto(URL('ap-calculus.html')); await p.waitForTimeout(800);
    await overflow('ap-calculus');
    if (w < 1280) {
      // Tur 14 A2/A6: telefonda hamburger yok; alt gezinmede "Çalış" doğrudan calis.html
      ok(!(await p.isVisible('.nav-menu-btn')) && !(await p.isVisible('#site-nav-links')) && await p.isVisible('.bottom-nav'), `${tag} ust menu gizli, alt gezinme gorunur`);
      ok(await p.getAttribute('.bottom-nav a[data-bn="calis"]', 'href') === 'calis.html' && await p.getAttribute('.bottom-nav a[data-bn="calis"]', 'aria-current') === 'page', `${tag} alt gezinme: Calis -> calis.html, ders sayfasinda Calis etkin`);
      await overflow('acik menu');
      await p.screenshot({ path: `${SHOTS}/t5-menu-${tag}.png` });
      await p.keyboard.press('Escape');
      await p.click('.account-btn');
      ok(await p.isVisible('#account-menu'), `${tag} hesap menusu acildi`);
      const box = await p.locator('#account-menu').boundingBox();
      ok(box.x >= 0 && box.x + box.width <= w, `${tag} hesap menusu ekranda (${Math.round(box.x)}..${Math.round(box.x + box.width)})`);
      await p.screenshot({ path: `${SHOTS}/t5-hesap-menu-${tag}.png` });
    }
    // tema düğmesi
    const before = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await p.click('.theme-toggle');
    const after = await p.evaluate(() => [document.documentElement.getAttribute('data-theme'), localStorage.getItem('apmeberra:theme')]);
    ok(after[0] && after[0] === after[1] && after[0] !== before, `${tag} tema dugmesi (${before} -> ${after[0]})`);
    ok(p._errs.length === 0, `${tag} hata yok` + (p._errs.length ? ' -> ' + p._errs.join(' | ') : ''));
    await p.evaluate(() => localStorage.clear());
    await ctx.close();
  }

  // ===================== P. Menüdeki yerel bağlantılar =====================
  {
    const src = fs.readFileSync(ROOT + 'assets/js/app.js', 'utf8');
    const block = src.slice(src.indexOf('const APMEBERRA_NAV'), src.indexOf('const APMEBERRA_ICONS'));
    const hrefs = [...block.matchAll(/href: "([^"]+)"/g)].map(m => m[1]).concat(['ap-calculus.html', 'ap-physics.html', 'ap-chemistry.html', 'ap-biology.html', 'ap-english.html', 'ap-electives.html', 'profil.html', 'giris.html']);
    const missing = [...new Set(hrefs)].filter(h => !has(h.split(/[?#]/)[0]));
    console.log('INFO menu baglantilari: ' + hrefs.length + ', eksik dosya: ' + (missing.join(', ') || 'yok') + ' (diger ajanlarin dosyalari)');
    ok(missing.every(m => ['deneme.html', 'sinav-cents.html'].includes(m)), 'menude yalnizca baska ajanlarin henuz yazmadigi dosyalar eksik olabilir');
  }

  await b.close();
  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi. (gercek ulkeler.js: ${realUlke}, gercek sinavlar.js: ${realSinav})`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
