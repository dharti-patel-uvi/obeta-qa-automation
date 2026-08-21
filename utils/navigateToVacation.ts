import { closeCookiesButtonIfAppears } from "./waitForCommonElements";
import { TAPortalPage } from "../page-object/TAPortalPage";
import { BrowserContext, Page } from "@playwright/test";

/**
 * Full Step 1 entry flow, per CLAUDE.md:
 *   TA Portal URL → agent sign-in → launch OBETA → Step 1 – Vacation.
 *
 * Returns the Page showing the vacation form (which may be a new tab if the
 * portal launches the engine in a popup). Cookie/consent banners are dismissed
 * before returning so callers can interact immediately.
 */
export async function navigateToVacationPage(
  page: Page,
  context: BrowserContext
): Promise<Page> {
  const portal = new TAPortalPage(page);

  await portal.navigate();
  await page.waitForLoadState("domcontentloaded");

  await portal.login(
    process.env.TA_PORTAL_USER || "",
    process.env.TA_PORTAL_PASSWORD || ""
  );

  const vacationPage = await portal.launchObeta(context);
  await closeCookiesButtonIfAppears(vacationPage);

  return vacationPage;
}
