import { expect, test } from "../test-data/fixtures";
import { VacationPage } from "../page-object/VacationPage";

/**
 * Step 1 – Vacation page link validation (TestRail suite S921).
 *
 * Ported from the nextgen Sandals `linksValidation.spec.ts`. Every test starts
 * on the Step 1 vacation surface (via the shared fixture) and checks a footer /
 * informational link.
 *
 * [OBETA-TODO]: these link controls come from the CONSUMER OBE footer; the
 * agent-facing OBETA build may not expose the same footer. Confirm each locator
 * on the live agent DOM on first run and adjust/remove as needed
 * (docs/SELF_HEALING.md). External links open the marketing site in a popup.
 */

test.describe("Step 1 - Vacation > Links", () => {
  test("HP - Call Us link points at the reservations phone number", async ({
    page,
  }) => {
    const vacation = new VacationPage(page);
    await expect(vacation.callUsLink).toHaveAttribute("href", /^tel:/i);
  });

  test("HP - Terms & Conditions opens the terms page", async ({ page }) => {
    const vacation = new VacationPage(page);
    const [newTab] = await Promise.all([
      page.waitForEvent("popup"),
      vacation.termsAndConditionsLink.click(),
    ]);
    await newTab.waitForLoadState("domcontentloaded");
    await expect(newTab).toHaveURL(/terms/i);
  });

  test("HP - Privacy Policy opens the privacy page", async ({ page }) => {
    const vacation = new VacationPage(page);
    const [newTab] = await Promise.all([
      page.waitForEvent("popup"),
      vacation.privacyPolicyLink.click(),
    ]);
    await newTab.waitForLoadState("domcontentloaded");
    await expect(newTab).toHaveURL(/privacy/i);
  });

  test("HP - Cookie Preferences opens the cookie settings", async ({
    page,
  }) => {
    //functionality NOT FOUND
    const vacation = new VacationPage(page);
    const [newTab] = await Promise.all([
      page.waitForEvent("popup"),
      vacation.cookiePreferencesLink.click(),
    ]);
    await newTab.waitForLoadState("domcontentloaded");
    await expect(newTab).toHaveURL(/privacy-policy/i);
  });

  test.skip("HP - Best Price Guarantee opens its modal", async ({ page }) => {
    //functionality NOT FOUND
    const vacation = new VacationPage(page);
    await vacation.bestPriceGuaranteeLink.click();
    await expect(vacation.bestPriceGuaranteeModal).toBeVisible();
  });
});
