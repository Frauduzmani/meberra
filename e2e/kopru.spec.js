"use strict";
// 1.25.0 A2 İngilizce köprüsü: soru kökünde kelimeye dokununca Türkçe anlam balonu; şıkta kısa dokunuş yine seçer;
// "Kelime yardımını kapat" sonrası balon açılmaz.
const { test, expect, ogrenciGiris } = require("./yardimci");

/** Sayfadaki ilk görünür soru kökünde verilen kelimenin ekran ortasını bulur. */
async function kelimeNoktasi(page, secici, kelime) {
  return page.evaluate(([s, k]) => {
    const kok = Array.from(document.querySelectorAll(s)).find(el => el.offsetParent && el.textContent.includes(k));
    if (!kok) return null;
    const w = document.createTreeWalker(kok, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const i = n.nodeValue.search(new RegExp("\\b" + k + "\\b"));
      if (i < 0 || n.parentElement.closest("mjx-container")) continue;
      n.parentElement.scrollIntoView({ block: "center", behavior: "instant" });
      const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + k.length);
      const b = r.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    }
    return null;
  }, [secici, kelime]);
}

test("soru kökünde kelimeye dokun → Türkçe anlam; kapatınca yardım devre dışı", async ({ page }) => {
  await ogrenciGiris(page, "/bugun");
  await page.goto("/ders/calculus?unite=1&konu=tum");
  const kart = page.locator("#calc-unit1-quiz-container .question-card:visible").first();
  await expect(kart).toBeVisible();
  // İlk kullanım ipucu
  await expect(page.locator(".kb-ipucu")).toBeVisible();
  // "Ne soruyor?" Türkçe açıklaması: kapalı gelir, açılınca görünür
  const ne = kart.locator(".q-ne");
  await expect(ne.locator("p")).toBeHidden();
  await ne.locator("summary").click();
  await expect(ne.locator("p")).toBeVisible();
  await expect(ne.locator("p")).toContainText(/soruyor|istiyor/);
  const kelime = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll("#calc-unit1-quiz-container .question-body")).find(e => e.offsetParent);
    const m = el.textContent.match(/\b(function|value|following|limit|continuous|graph|table)\b/i);
    return m ? m[1] : null;
  });
  expect(kelime).toBeTruthy();
  const p = await kelimeNoktasi(page, "#calc-unit1-quiz-container .question-body", kelime);
  expect(p).toBeTruthy();
  await page.mouse.click(p.x, p.y);
  const balon = page.locator(".kb-balon");
  await expect(balon).toBeVisible();
  await expect(balon.locator(".kb-kelime")).toHaveText(new RegExp(kelime, "i"));
  await expect(balon.locator(".kb-tr")).not.toBeEmpty();
  await page.keyboard.press("Escape");
  await expect(balon).toBeHidden();
  // Kapat → yeniden dokununca balon yok
  await page.mouse.click(p.x, p.y);
  await expect(balon).toBeVisible();
  await balon.getByRole("button", { name: "Kelime yardımını kapat" }).click();
  await expect(balon).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem("meberra:tr-yardim"))).toBe("kapali");
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(300);
  await expect(balon).toBeHidden();
});

test("şıkta kısa dokunuş seçer (balon açmaz)", async ({ page }) => {
  await ogrenciGiris(page, "/bugun");
  await page.goto("/ders/calculus?unite=1&konu=tum");
  const kart = page.locator("#calc-unit1-quiz-container .question-card:visible").first();
  await kart.locator(".option-btn").first().click();
  await expect(kart.locator(".feedback-box")).toBeVisible();
  await expect(page.locator(".kb-balon")).toHaveCount(0);
});
