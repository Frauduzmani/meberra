"use strict";
// 1.26.1 Sınav içi hesap makinesi: Desmos sayfanın içinde (girişsiz, gömülü) açılır; yeni sekme yok; "Ne soruyor?" FRQ'da görünür.
const { test, expect, ogrenciGiris } = require("./yardimci");

test("FRQ: hesap makinesi sayfa içinde Desmos paneli açar; kapatılır; Ne soruyor açılır", async ({ page, context }) => {
  await ogrenciGiris(page, "/frq?id=frq-calc-ab-k1");
  const dugme = page.getByRole("button", { name: "Hesap makinesini aç" });
  await expect(dugme).toBeVisible();
  let yeniSekme = false;
  context.on("page", () => { yeniSekme = true; });
  await dugme.click();
  const panel = page.getByRole("dialog", { name: "Hesap makinesi" });
  await expect(panel).toBeVisible();
  await expect(panel.locator("iframe")).toHaveAttribute("src", "https://www.desmos.com/testing/collegeboard/graphing");
  await expect(dugme).toHaveAttribute("aria-pressed", "true");
  expect(yeniSekme).toBe(false);
  await panel.getByRole("button", { name: "Hesap makinesini kapat" }).click();
  await expect(panel).toBeHidden();
  await expect(dugme).toHaveAttribute("aria-pressed", "false");
  // 1.24.0 parça başına "Ne soruyor?"
  const ne = page.locator(".frq-ne").first();
  await ne.locator("summary").click();
  await expect(ne.locator("p")).toContainText(/soruyor|istiyor/);
});
