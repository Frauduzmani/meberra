const { chromium } = require("playwright-core");
const path = require("path");
const ROOT = "C:/Users/hp/Desktop/projelerim/AP MEBERRA";
const SHOTS = path.join(__dirname, "..", "shots");
const pages = ["almanya-muhendislik.html", "italya-muhendislik.html", "istanbul-sinav-rehberi.html", "ajanlar.html"];

(async () => {
  const browser = await chromium.launch({ executablePath: "C:/Users/hp/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe" });
  let fails = 0;
  for (const theme of ["dark", "light"]) {
    for (const [label, width] of [["desktop", 1280], ["phone", 390]]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } }); await require('./oturum-tohum')(ctx);
      await ctx.addInitScript(t => { try { localStorage.setItem("apmeberra:theme", t); } catch (e) {} }, theme);
      for (const p of pages) {
        const page = await ctx.newPage();
        const errs = [];
        page.on("pageerror", e => errs.push(e.message));
        page.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
        await page.goto("file:///" + ROOT + "/" + p);
        await page.waitForTimeout(300);
        const info = await page.evaluate(() => ({
          sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
          de: document.querySelectorAll("#german-unis-container > *").length,
          it: document.querySelectorAll("#italian-unis-container > *").length,
          wide: [...document.querySelectorAll("body *")].filter(e => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1).slice(0, 3).map(e => e.tagName + "." + e.className)
        }));
        const hscroll = info.sw > info.cw;
        if (errs.length || hscroll) fails++;
        console.log(`${theme}/${label} ${p}: errors=${errs.length} hscroll=${hscroll} (${info.sw}/${info.cw}) de=${info.de} it=${info.it}`, errs.join(" | "), hscroll ? info.wide.join(",") : "");
        if (theme === "dark" && label === "desktop" && p.startsWith("almanya")) {
          // filtre testleri
          await page.click("#btn-status-partial");
          const n1 = await page.$$eval("#german-unis-container > *", a => a.length);
          await page.click("#btn-filter-ai");
          const n2 = await page.$$eval("#german-unis-container > *", a => a.length);
          await page.click("#btn-status-all"); await page.click("#btn-filter-all");
          await page.fill("#de-search-input", "robotics");
          const n3 = await page.$$eval("#german-unis-container > *", a => a.length);
          console.log(`  filtre: kısmen=${n1} kısmen+ai=${n2} arama(robotics)=${n3}`);
          await page.fill("#de-search-input", "");
          await page.dispatchEvent("#de-search-input", "input");
        }
        if (theme === "dark" && label === "desktop" && p.startsWith("italya")) {
          await page.click("#btn-exam-sat");
          const n1 = await page.$$eval("#italian-unis-container > *", a => a.length);
          await page.click("#btn-exam-til");
          const n2 = await page.$$eval("#italian-unis-container > *", a => a.length);
          await page.click("#btn-exam-all");
          console.log(`  filtre: sat=${n1} til=${n2}`);
        }
        if (theme === "dark" && label === "desktop" && p === "ajanlar.html") {
          // Kabul danışmanı sohbet yanıtı
          const ok = await page.evaluate(() => {
            const r1 = generateAgentReply("admissions", AGENTS.admissions.quickPrompts[0]);
            const r2 = generateAgentReply("admissions", AGENTS.admissions.quickPrompts[2]);
            return [r1.slice(0, 60), r2.includes("26.887,93")];
          });
          console.log("  admissions yanıtları:", JSON.stringify(ok));
        }
        if (label === "desktop" || theme === "dark") {
          const name = p.replace(".html", "");
          if (p.startsWith("almanya") || p.startsWith("italya")) {
            await page.screenshot({ path: path.join(SHOTS, `ulke-${name}-${label}-${theme}.png`), fullPage: label === "desktop" && theme === "dark" });
          }
        }
        await page.close();
      }
      await ctx.close();
    }
  }
  await browser.close();
  console.log("FAILS:", fails);
})();
