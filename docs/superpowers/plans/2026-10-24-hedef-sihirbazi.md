# Hedef Sihirbazı (1.22.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/ulkem` becomes a 3-screen wizard: multiple countries → optional universities → requirements table with a common path → "Bu planı uygula" → signup → `/bugun?ilk=1`, where the student lands with a celebration and a first task.

**Architecture:**
- A pure UMD engine, `assets/js/hedef-motor.js`, resolves columns, cells, the common path and the profile patch. It is tested in Node.
- Requirements become structured, sourced data: `data/mevzuat/kaynak/isterler-<cc>.json`. `ulke-veri-olustur.js` injects it into `data/mevzuat/ulke/<cc>.js` as `isterler`.
- `sartlar.html` renders the wizard. `giris.html` applies the selection after register or login.

**Tech Stack:** Vanilla JS (ES5-style UMD, like `sartlar-motor.js`), static HTML/CSS, Node 20 test scripts (`araclar/testler/*-birim-test.js`, custom `ok/eq` helpers), Playwright e2e, Express + SQLite server (no server changes expected).

**Spec:** `docs/superpowers/specs/2026-10-24-hedef-sihirbazi-design.md` (onaylı). Visual reference: `.superpowers/brainstorm/918-1792842983/content/akis-v2.html`.

## Global Constraints

- **Version.** 1.22.0: `package.json`, a CHANGELOG entry, the `v1.22.0` tag, and HARITA.md updated for new files.
- **No new menu section.** The wizard replaces the Ülkem entry screen. The old per-country detail stays reachable below the result.
- **No unsourced claims.** Every `ok|uyari|kapali` cell needs `kaynak[]` and `kesinlik`. Otherwise the cell is `durum: "teyit"` and shows "❔ teyit et". Do not reuse values from `universite-isterleri.js`.
- **AP codes.** Only `ap-hedef.js` codes are valid: `calculus-ab, calculus-bc, physics-1, chemistry, biology, english-language, computer-science-a, microeconomics, macroeconomics`.
- **Field (alan) chips.** `muhendislik` (default) · `tip` · `isletme` · `fen`. The profile key is `hedefAlan`.
- **Default AP sets, labelled as a recommendation:**
  - muhendislik: calculus-ab, physics-1, chemistry
  - tip: biology, chemistry, calculus-ab
  - isletme: calculus-ab, microeconomics, macroeconomics
  - fen: calculus-ab, chemistry, biology
- **Class (sınıf) chips.** 9 · 10 · 11 · 12 · Mezun. Default 11. Mezun → `ogrenciModeli: "lise-mezun"`.
- **Country cap.** The client caps the selection at 5 (`EN_FAZLA`). The server limit is 15.
- **Carrying the selection.** It travels in the URL as `?u=it,de&o=<uniId>,<uniId>&s=11&a=muhendislik`. A copy goes in `sessionStorage["meberra-hedef"]`, which must NOT use the `apmeberra:` prefix because `onbellekTemizle` wipes those keys.
- **Motion and access.** Respect `prefers-reduced-motion` and use checkbox semantics for cards. The page must not scroll horizontally at 360 px width.
- **Copy.** Turkish UI copy follows the mockup: "Hayalindeki ülke hangisi?", "Aklında okul var mı?", "🤷 Okul bilmiyorum, ülke yeter", "Tablomu göster ✨", "Yolun hazır! 🎉", "🧭 Hepsine birden yeten yol", "Bu planı uygula 🚀", "AP burada şart değil, başvurunu güçlendirir".

## Review Focus

1. **No country selected.** A visitor who clicks Devam with zero countries expects the button to stay disabled and Korkut to prompt. → Task 4.
2. **A 6th country.** Selecting one beyond 5 expects a gentle "en çok 5" message and no selection. → Task 4.
3. **A university with no data.** Every one of its cells falls back to the country value, or to "❔ teyit et". It must never be blank or `undefined`. → Task 1.
4. **Logged-in user with a full profile.** On "Bu planı uygula", `sinif`, `aktifRota` and `sinavYili` stay unchanged, and `ulkeler` never exceeds 5. → Task 1, Task 5.
5. **Arriving at `/giris?hedef=…` without sessionStorage.** A new tab still applies the selection from the URL. → Task 5.

---

### Task 1: `hedef-motor.js`, the pure engine

**Files:**
- Create: `assets/js/hedef-motor.js`
- Test: `araclar/testler/hedef-birim-test.js` (same `ok/eq` helper style as `secici-birim-test.js`)

**Interfaces:**
- Consumes:
  - `APMEBERRA_EPOSTA.universiteKimligi(cc, u)`. Require `assets/js/eposta.js` in Node, and use the global in the browser.
  - `APMEBERRA_AP_HEDEF` (`dersBul`, `siradakiSinavYili`) from `assets/js/ap-hedef.js`.
- Produces `window.MeberraHedef` (Node: `module.exports`):
  - `ALANLAR`: `["muhendislik","tip","isletme","fen"]`
  - `SATIRLAR`: `["diploma","yks","ap","sinav","dil","donem"]`
  - `VARSAYILAN_AP`: `{alan: [ders]}`
  - `secimCoz(search: string) -> {ulkeler: string[], okullar: {cc: uniId[]}, sinif: "9"|"10"|"11"|"12"|"mezun", alan: string}`. It accepts the new keys `u, o, s, a` and the legacy keys `ulke`, `sinif`, `model=lise-mezun` (→ `sinif: "mezun"`). Unknown countries are dropped. The list is capped at 5. `o` ids must start with a selected `cc-`.
  - `secimAdres(secim) -> "?u=..&o=..&s=..&a=.."`. Empty keys are omitted.
  - `sutunlar(secim, ulkeVeri) -> [{tur: "uni"|"ulke", cc, uniId|null, ad, kisa, bayrak}]`. A country without chosen universities gets one `ulke` column.
  - `hucre(ulkeVeri, cc, uniId|null, alan, satir) -> {durum: "ok"|"uyari"|"kapali"|"teyit", metin, kaynak[], kesinlik|null, ...satır alanları}`. Resolution order: university+field → university → country+field → country `varsayilan` → `{durum: "teyit", metin: "Resmî sayfadan teyit et", kaynak: []}`.
  - `ortakYol(sutunlar, ulkeVeri, alan, sinif, bugun: "YYYY-MM-DD") -> {apDersleri: string[], apSayi, apOneri: boolean, dil: {belge, esik}|null, sinavlar: string[], yksUyari: boolean, sinavYili, haftaKaldi}`
  - `profilYamasi(eski: object|null, secim, ortak) -> object`. Implements the merge rules in spec §4.7.

- [ ] **Step 1: Write the failing tests** in `araclar/testler/hedef-birim-test.js`.

  Use a small fake `ulkeVeri` with two countries: `it` with university `it-politecnico-di-milano`, and `de` with university `de-technical-university-of-munich`. Assertions:

  ```js
  eq(H.secimCoz("?u=it,de&o=it-politecnico-di-milano&s=12&a=tip"), {ulkeler:["it","de"], okullar:{it:["it-politecnico-di-milano"]}, sinif:"12", alan:"tip"}, "secimCoz yeni");
  eq(H.secimCoz("?ulke=de&sinif=11"), {ulkeler:["de"], okullar:{}, sinif:"11", alan:"muhendislik"}, "secimCoz eski ulke");
  eq(H.secimCoz("?model=lise-mezun&ulke=it").sinif, "mezun", "eski mezun");
  eq(H.secimCoz("?u=it,de,nl,at,cz,es,fr").ulkeler.length, 5, "en çok 5 ülke");
  eq(H.secimCoz("?u=us,it&o=de-x").okullar, {}, "bilinmeyen ülke ve seçilmemiş ülkenin okulu düşer");
  eq(H.secimCoz(H.secimAdres(S)), S, "adres gidiş-dönüş");
  eq(H.sutunlar({ulkeler:["it","de"], okullar:{it:["it-politecnico-di-milano"]}}, V).map(c=>c.tur+":"+c.cc), ["uni:it","ulke:de"], "sutunlar okul+ülke");
  eq(H.hucre(V,"it","it-politecnico-di-milano","muhendislik","sinav").sinavlar, ["polimi-tol"], "uni ezer");
  eq(H.hucre(V,"it",null,"tip","sinav").sinavlar, ["imat"], "ülke+alan");
  eq(H.hucre(V,"de","de-yok","muhendislik","donem").durum, "teyit", "veri yok → teyit");
  ok(H.SATIRLAR.every(s => H.hucre({}, "it", null, "fen", s).durum === "teyit"), "boş veri her satır teyit");
  ```

  `ortakYol` assertions:
  - The AP count is the max across columns, and the listed courses are the union.
  - The result is filled up from `VARSAYILAN_AP[alan]` up to `apSayi`.
  - When no column requires AP, `apOneri === true` and `apDersleri` equals the field default.
  - The language threshold is the highest one. For a range written as `esik: [6, 6.5]`, the upper end (6.5) is used.
  - `yksUyari` is true if any column has `yks.durum !== "ok"`.
  - With `bugun = "2026-10-24"`: `sinif = "11"` gives `sinavYili === 2027` and `haftaKaldi === 27` (weeks to 2027-05-01). `sinif = "12"` gives 2027. `sinif = "9"` gives 2029.

  `profilYamasi` assertions:
  - On a `null` profile it sets `tamamlandi: true`, `ogrenciModeli: "lise"`, `sinif: "11"`, `ulkeler`, `aktifRota: ulkeler[0]`, `egitimDili: "en"`, `hedefAlan`, `hedefOkullar`, `sinavYili`, and `apDersleri` with `hedef: 4` on each course.
  - On `{sinif: "10", aktifRota: "nl", ulkeler: ["nl","at","cz","es"], apDersleri: [{ders: "biology", hedef: 5}]}` with a selection of `it, de`:
    - `sinif` stays "10" and `aktifRota` stays "nl".
    - `ulkeler` becomes `["it","de","nl","at","cz"]`.
    - biology keeps `hedef: 5` and the new courses are added.

- [ ] **Step 2: Run the tests and confirm they fail.** Run `node araclar/testler/hedef-birim-test.js`. Expected: it fails with `Cannot find module` for `hedef-motor.js`.

- [ ] **Step 3: Implement `assets/js/hedef-motor.js`.** Use the UMD wrapper from `sartlar-motor.js:1-20`.
  - Take the country codes from `APMEBERRA_ULKE_DIZINI` when present. Otherwise use the 15-code literal `de,it,at,ch,nl,be,fr,es,se,fi,dk,ie,hu,pl,cz`.
  - `sinavYili` rule: graduation year = current school year end + (12 − sinif). The AP year to aim for is the graduation year minus 1 for sinif ≤ 11, the graduation year for sinif 12, and `siradakiSinavYili(bugun)` for mezun.
  - `haftaKaldi` counts weeks until May 1 of `sinavYili`, never below 1.

- [ ] **Step 4: Run the tests and confirm they pass.** Run `node araclar/testler/hedef-birim-test.js`. Expected: every line `PASS`, exit code 0.

- [ ] **Step 5: Commit.** `git add assets/js/hedef-motor.js araclar/testler/hedef-birim-test.js` then `git commit -m "hedef-motor: çoklu seçim, hücre çözümü, ortak yol, profil yaması"`.

### Task 2: `isterler` schema, generator and control

**Files:**
- Modify: `araclar/ulke-veri-olustur.js`. Read `isterler-<cc>.json` if it exists, normalise sources with `kaynakNorm`, and write it as `isterler` into the country output (near line 126, where the `L/Y/U` sources are read).
- Create: `data/mevzuat/kaynak/isterler-it.json` (the first real file, from the sourced items in `lisans-it.json`, `sinavlar.js` and `ulke-rotalari.js` for `it`)
- Test: `araclar/testler/isterler-birim-test.js`

**Interfaces:**
- Consumes: the row schema from spec §4.3, plus `alanlar` sub-objects keyed by `ALANLAR`.
- Produces: `APMEBERRA_ULKE_VERI[cc].isterler = {varsayilan: {satir: hucre}, alanlar: {alan: {satir: hucre}}, universite: {uniId: {satir…, alanlar…}}}`. Task 1's `hucre` reads exactly this.
- Exported `isterlerDenetle(obj, {sinavKimlikleri, uniKimlikleri, apKodlari}) -> string[]` (problems). The generator calls it under `--kontrol`.

- [ ] **Step 1: Write the failing test.** `isterlerDenetle` must return problems for each of these:
  - a row missing `durum`
  - `durum: "ok"` with an empty `kaynak`
  - `ap.dersler: ["ap-calculus"]` (not a valid code)
  - `sinav.sinavlar: ["yok-sinav"]`
  - an unknown `uniId`
  - an unknown field key

  It must return `[]` for the real `isterler-it.json`. Also assert that after generation, `data/mevzuat/ulke/it.js` evaluates to an object with `isterler.varsayilan.yks.durum` set.
- [ ] **Step 2: Run the test and confirm it fails.** Run `node araclar/testler/isterler-birim-test.js`. Expected: FAIL, because `isterlerDenetle` is not exported.
- [ ] **Step 3: Implement.** Write `isterlerDenetle`, add the generator injection, and write `isterler-it.json`. Every `ok|uyari|kapali` value copies the `kaynak` and `kesinlik` of the source item it came from. If you are not sure, use `teyit`.
- [ ] **Step 4: Run and confirm it passes.**
  - Run `node araclar/ulke-veri-olustur.js`, then `node araclar/ulke-veri-olustur.js --kontrol` (expected: 0 problems).
  - Run `node araclar/testler/isterler-birim-test.js` (expected: all PASS).
  - Run `npm run test:birim` (expected: all pass, including `secici-birim-test.js`).
- [ ] **Step 5: Commit** with the message "isterler: yapılandırılmış şart şeması, üretici ve denetim (it)".

### Task 3: Fill `isterler` for the other 14 countries

**Files:**
- Create: `data/mevzuat/kaynak/isterler-{de,at,ch,nl,be,fr,es,se,fi,dk,ie,hu,pl,cz}.json`
- Regenerate: `data/mevzuat/ulke/*.js`

**Interfaces:**
- Consumes: Task 2's schema and `isterlerDenetle`.
- Produces: an `isterler` object in every country.

**What goes in the data:**
- **Germany (de).** `yks.durum: "uyari"` (YKS with 180+ in the field of placement, per `lis-de-giris-hakki`). AP is `apOneri` only. `ap.durum: "kapali"` is wrong here. Use `uyari` with the text "AP tek başına giriş hakkı vermez".
- **University overrides.** Add at least these: nl Twente and Groningen (from `nl.js:28-68`), it PoliMi and PoliTo (from `ulke-rotalari.js` and `sinavlar.js` `polimi-tol`, `til-i`), and de TUM and KIT, where sourced items exist.

- [ ] **Step 1: Extend the test.** Add a loop to `isterler-birim-test.js`: every one of the 15 countries has `isterler.varsayilan` with all 6 rows, and `isterlerDenetle` returns `[]`. Also assert `de.isterler.varsayilan.yks.durum !== "ok"`.
- [ ] **Step 2: Run and confirm it fails.** Expected: FAIL for the 14 missing countries.
- [ ] **Step 3: Write the 14 files** from each country's `lisans-<cc>.json`, `uni-<cc>.json`, `sinavlar.js` and `ulke-rotalari.js`, carrying each item's `kaynak` and `kesinlik`.
- [ ] **Step 4: Run the checks.** Run the generator, `--kontrol` (expected: 0 problems), `node araclar/testler/isterler-birim-test.js` (expected: PASS) and `npm run test:birim` (expected: all pass).
- [ ] **Step 5: Commit** with the message "isterler: 15 ülke kaynaklı şart tablosu".

### Task 4: The wizard UI in `/ulkem`

**Files:**
- Modify: `sartlar.html`.
  - Replace the intro or form at lines 27-101 (hero, `#sr-form`, `#ulk-son`) with the wizard markup.
  - Change the inline script's `ciz()` (708-740) so that the wizard is the default view, and the old `sonucHtml()` renders below the result under the heading "Ülke ayrıntısı" with the existing chip switcher `#ul-ulkeler`.
  - Load `/assets/js/hedef-motor.js`, `/assets/js/maskot.js`, `/assets/js/kutlama.js` and `/assets/css/hedef.css`.
- Create: `assets/css/hedef.css`, porting the v2 mockup styles: `.hd` header, `.prog`, `.xp`, `.f` flag card, `.u` uni card, `.skip`, `.tb/.tr/.cell`, `.yol`, `.btn` 3D button, `.conf`, aurora background. Use the site tokens `--hero-a`, `--hero-b`, `--energy` and dark-theme variants.
- Modify: `assets/css/ulkem.css`. Remove the rules for the entry screen that is being replaced.
- Modify: `sw.js`. Add the new assets to the precache list, if that list enumerates CSS/JS.

**Interfaces:**
- Consumes:
  - `MeberraHedef.*` from Task 1
  - `UI.veriYukle(cc)` (`assets/js/sartlar-ui.js:31`) to lazy-load each selected country's data
  - `MeberraMaskot.html(ifade)` (`maskot.js`)
  - `MeberraKutlama.kutla({tur: "hedef", buyuk: true})`
- Produces:
  - DOM ids for e2e: `#hd-adim-1`, `#hd-adim-2`, `#hd-adim-3`; buttons named "Devam et", "Tablomu göster", "Bu planı uygula"
  - flag checkboxes with accessible name = country name
  - uni checkboxes with accessible name = university name
  - the `#hd-tablo` table with role `table`
  - `#hd-ortak` for the common path
  - chip radio groups "Sınıf" and "Alan"

**Behaviour:**
- **Step state and URL.** Each step and selection is written to the URL with `history.replaceState`, and the step with `pushState`, using `secimAdres` plus `&adim=N`.
- **Starting step.** A URL with `u=` or the legacy `ulke=` opens step 3. A logged-in user with a profile gets profile values via `secimCoz`-equivalent mapping and also opens step 3.
- **Step 1.** Devam is disabled with 0 countries. A 6th selection is refused with Korkut saying "En çok 5 ülke seçebilirsin". The live counter shows "🌍 N ülke · M üniversite seni bekliyor".
- **Step 2.** Search is accent-insensitive across the selected countries' `universiteler.liste`. Both "🤷 Okul bilmiyorum, ülke yeter" and "Tablomu göster ✨" go to step 3 (the skip button clears `okullar`).
- **Step 3.**
  - The chips are at the top.
  - Table cells animate in with staggered `animation-delay`.
  - Tapping a cell opens its `metin` and source links.
  - The `#hd-ortak` card shows the AP chips (with the `apOneri` label when true), language, exams, a YKS warning line, and the week count.
  - `kutla` fires once per result render.
  - "Bu planı uygula 🚀" behaves as follows:
    - Guest: write `sessionStorage["meberra-hedef"] = secimAdres(secim)` and go to `/giris?donus=/bugun&hedef=<encodeURIComponent(secimAdres)>#kayit`.
    - Logged-in: show the summary "Planına N ülke, K ders eklenecek" with Onayla / Vazgeç. Onayla calls `AUTH.saveProfile(user.id, profilYamasi(profile, secim, ortak))` and then goes to `/bugun?ilk=1`.
- **Mobile.** With more than 2 columns, `#hd-tablo` sits in its own `overflow-x: auto` wrapper with a sticky first column. The page itself must not scroll horizontally.

- [ ] **Step 1: Write the failing e2e test** `e2e/hedef.spec.js`, "misafir: ülke → okul → tablo":
  - goto `/ulkem` and expect `#hd-adim-1` to be visible
  - expect "Devam et" to be disabled
  - check İtalya and Almanya, and expect the counter to contain "2 ülke"
  - try a 6th country after checking 5, and expect the 6th to stay unchecked
  - click Devam, check "Politecnico di Milano", click "Tablomu göster"
  - expect `#hd-tablo` to have 2 data columns and `#hd-ortak` to contain "Calculus"
  - change Alan to Tıp, and expect `#hd-ortak` to contain "Biology"
  - run `yatayKaydirmaYok(page)` on the mobil project

  Second test, "eski bağlantı": goto `/ulkem?ulke=de` and expect `#hd-adim-3` with an "Almanya" column.
- [ ] **Step 2: Run and confirm it fails.** Run `npx playwright test -c e2e hedef.spec.js`. Expected: FAIL, `#hd-adim-1` not found.
- [ ] **Step 3: Implement** the markup, the script and `hedef.css` as described above.
- [ ] **Step 4: Run and confirm it passes.** Run `npx playwright test -c e2e hedef.spec.js` (expected: PASS on chromium and mobil). Then run `npm run test:birim` (expected: all pass). If `secici-birim-test.js` or `adresler` tests assert the old intro markup, update only those assertions.
- [ ] **Step 5: Commit** with the message "Ülkem: çoklu ülke/okul sihirbazı ve şart tablosu".

### Task 5: Apply the selection on signup/login, celebrate on Bugün, change the vitrin CTA

**Files:**
- Modify: `giris.html`.
  - Near line 236, parse `hedef` from `location.search` (fall back to `sessionStorage["meberra-hedef"]`).
  - In `go()` (260-263), when a selection exists, load the selected countries' data, compute `ortakYol`, call `AUTH.saveProfile(user.id, profilYamasi(eski, secim, ortak))`, add `hedefOkullar` to Listem through the existing `universitelerim` state mechanism (`app.js:2991`), clear the sessionStorage key, and `location.replace("/bugun?ilk=1")`. This applies to both new accounts and login.
  - Without a selection, keep the existing behaviour.
  - Load `hedef-motor.js`.
  - Change the context box text to "Planın hazır; hesabını aç, kaydedelim."
- Modify: `index.html`. In `bugunCiz` / block 5d (677-698), on `?ilk=1` run `MeberraKutlama.kutla({tur: "hedef", baslik: "Plan senin, " + ad + "!", buyuk: true})` once, then remove `ilk` with `history.replaceState`.
- Modify: `vitrin.html:49`. Point "Ücretsiz başla" to `/ulkem`.
- Test: extend `e2e/hedef.spec.js`.

**Interfaces:**
- Consumes: `MeberraHedef.secimCoz`, `ortakYol` and `profilYamasi` (Task 1); `UI.veriYukle` or an equivalent `<script>` load of `/data/mevzuat/ulke/<cc>.js`; and `AUTH.saveProfile(id, p) -> Promise<{ok, errors?}>`.
- Produces: a profile with `tamamlandi: true`, so the `/profil` gate (`app.js:197`) does not fire.

- [ ] **Step 1: Write the failing e2e tests.**
  - **"misafir → planı uygula → kayıt → Bugün".**
    - Run the flow from Task 4's test, then click "Bu planı uygula" and fill the signup exactly as in `e2e/ogrenci.spec.js:6-14`.
    - `waitForURL(/\/bugun/)`.
    - Expect the celebration dialog or text "Plan senin" and a hero task link.
    - Fetch `/api/me` and expect `profile.tamamlandi === true`, `profile.ulkeler` to include "it" and "de", `profile.apDersleri.length >= 3`, and `profile.hedefAlan === "muhendislik"`.
  - **"hedef URL'si sessionStorage olmadan da uygulanır".**
    - Open a new page.
    - goto `/giris?donus=/bugun&hedef=` + encoded `?u=nl&s=12` with `#kayit`, then sign up.
    - Expect `/api/me` `ulkeler` to equal `["nl"]` and `sinif` to equal "12".
  - **"giriş yapmış: mevcut profil korunur".**
    - Use `ogrenciGiris` (an existing helper) on a user with sinif 10 / aktifRota nl.
    - goto `/ulkem?u=it`, click "Bu planı uygula", then Onayla.
    - Expect `sinif` "10", `aktifRota` "nl", and `ulkeler` to include "it" and "nl" with length ≤ 5.
  - **Unchanged path.** `e2e/ogrenci.spec.js` "kayıt → 5 adımlı sihirbaz" must still pass unchanged.
- [ ] **Step 2: Run and confirm they fail.** Run `npx playwright test -c e2e hedef.spec.js`. Expected: FAIL, waiting for `/bugun` because the page goes to `/profil`.
- [ ] **Step 3: Implement** the changes listed under Files.
- [ ] **Step 4: Run and confirm everything passes.** Run `npx playwright test -c e2e` (all specs), `npm test` and `npm run test:birim`. Expected: all pass.
- [ ] **Step 5: Commit** with the message "Kayıt/giriş hedef seçimini profile uygular; Bugün'de ilk kutlama; vitrin CTA /ulkem".

### Task 6: Release 1.22.0

**Files:**
- Modify: `package.json` (version `1.22.0`)
- Modify: `CHANGELOG.md` (new top entry `[1.22.0] — <date>`, following the 1.21.0 style)
- Modify: `HARITA.md`. Add `hedef-motor.js`, `hedef.css`, `isterler-<cc>.json` and the `isterler` key in `ulke/<cc>.js`.
- Modify: the asset cache-busting query strings (`?v=1210` → `?v=1220`) on the files that changed.
- Modify: `DEVAM-NOKTASI.md` (release checklist). Add `hedef-birim-test` and `isterler-birim-test`.

- [ ] **Step 1: Run the full verification.**
  - `npm run test:birim`, `npm test` and `npx playwright test -c e2e` (expected: all pass)
  - `node araclar/ulke-veri-olustur.js --kontrol` (expected: 0 problems)
  - `node araclar/pm-denetim.js` (expected: 0 problems)
- [ ] **Step 2: Bump the version and update the docs** as listed under Files.
- [ ] **Step 3: Commit and tag.**
  - `git commit -m "1.22.0: hedef sihirbazı — çoklu ülke/okul, şart tablosu, planı uygula"`
  - `git tag v1.22.0`

  Do not push unless the owner asks.
