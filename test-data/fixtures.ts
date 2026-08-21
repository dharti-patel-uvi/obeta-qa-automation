import { navigateToVacationPage } from "../utils/navigateToVacation";
import { test as base, expect, Page } from "@playwright/test";

/**
 * Shared test fixtures.
 *
 * The `page` fixture is overridden so every spec starts already on Step 1 –
 * Vacation, having gone through the required entry flow (TA Portal → sign in →
 * launch OBETA). Specs import `test`/`expect` from here instead of
 * `@playwright/test` and receive a `page` positioned on the vacation form —
 * which may be the popup tab the portal opened.
 *
 * NOTE: this logs into the portal per test. Reusing portal auth via
 * `storageState` + a setup project is a worthwhile later optimization once the
 * portal selectors are verified.
 */
export const test = base.extend<{ page: Page }>({
  page: async ({ page, context }, use) => {
    const vacationPage = await navigateToVacationPage(page, context);
    await use(vacationPage);
  },
});

export { expect };
