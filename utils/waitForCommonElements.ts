import { Locator, Page } from "@playwright/test";

/**
 * Dismiss cookie / consent banners that overlay Step 1 on a fresh load.
 * Safe to call in every `beforeEach` — it is a no-op when nothing appears.
 */
export async function closeCookiesButtonIfAppears(page: Page) {
  await dismissIfVisible(page.getByLabel("Accept All"));
  await dismissIfVisible(page.getByRole("button", { name: "Dismiss banner" }));
}

async function dismissIfVisible(locator: Locator): Promise<void> {
  if (await locator.isVisible({ timeout: 3000 }).catch(() => false)) {
    await locator.click();
  }
}
