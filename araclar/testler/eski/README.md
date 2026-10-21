# Eski tarayıcı betikleri (arşiv — kullanılmıyor)

Bu klasördeki `*-test.js`, `interact.js`, `paket-test.js`, `sv-paket.js` ve `oturum-tohum.js` dosyaları
1.15.0 öncesinin elle çalıştırılan Playwright (`playwright-core`) betikleridir. **Artık güncel değiller:**

- eski menüyü, `.html` uzantılı adresleri (1.8.0'dan beri temiz adresler: `/bugun`, `/ders/calculus` ...) ve
  tarayıcı içi (sunucusuz) hesabı beklerler;
- Chromium yolu başka bir makineye göre sabit yazılmıştır (`C:/Users/hp/AppData/Local/ms-playwright/...`);
- `./fixture/...` göreli yolları bu klasöre taşındıktan sonra çözülmez.

Yerlerini **`e2e/`** klasöründeki `@playwright/test` paketi aldı:

```
npm ci
npx playwright install chromium   # bir kez
npm run test:e2e
```

Ayrıntı: kök `README.md` › "Testler". Birim testleri (`araclar/testler/*-birim-test.js`) yerinde duruyor ve
`npm run test:birim` ile çalışır. Bu dosyalar yalnızca geçmiş senaryolara bakmak için saklanır; CI çalıştırmaz.
