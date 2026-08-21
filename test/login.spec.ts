import { TAPortalPage } from "../page-object/TAPortalPage";
import { test, expect } from "@playwright/test";

/**
 * TA Portal (agent portal) sign-in — the required entry point to OBETA.
 *
 * The OBETA agent engine has NO Step-1 member sign-in modal (that is the
 * Step-4 "Sandals Account Log In Modal", out of current scope). The actual
 * agent "login" happens on the TA Portal before OBETA is launched, so these
 * tests drive `TAPortalPage` directly.
 *
 * They deliberately import from `@playwright/test` (a clean, un-authenticated
 * page) instead of `../test-data/fixtures`, whose `page` fixture auto-logs-in
 * and lands on the vacation form — which would defeat the purpose of a login
 * test. Each test navigates to the portal itself.
 */

const user = process.env.TA_PORTAL_USER || "";
const password = process.env.TA_PORTAL_PASSWORD || "";
const hasCreds = Boolean(user && password);

test.describe("TA Portal - Agent sign-in", () => {
  test.beforeEach(async ({ page }) => {
    const portal = new TAPortalPage(page);
    await portal.navigate();
    await page.waitForLoadState("domcontentloaded");
  });

  test("HP - Sign-in page shows the expected elements", async ({ page }) => {
    const portal = new TAPortalPage(page);
    await portal.assertLoginPageElements();
  });

  test("HP - Agent can sign in and reach the dashboard", async ({ page }) => {
    test.skip(
      !hasCreds,
      "Set TA_PORTAL_USER / TA_PORTAL_PASSWORD to run the sign-in."
    );
    const portal = new TAPortalPage(page);
    await portal.login(user, password);
    await portal.assertLoggedIn();
  });

  test("SP - Invalid credentials are rejected", async ({ page }) => {
    const portal = new TAPortalPage(page);
    await portal.submitCredentials(
      "invalid.agent@example.com",
      "wrong-password-123"
    );
    await portal.assertNotLoggedIn();
  });
});
