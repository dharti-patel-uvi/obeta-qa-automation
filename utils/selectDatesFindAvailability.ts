import { Page } from "@playwright/test";

/**
 * Pick an available check-in / check-out range from an OBE "Date Range
 * Calendar" popover (Room Details / reselect surfaces).
 *
 * Ported from `obe-e2e-nextgen-master/utils/getRandomDateRange.ts`
 * (`selectDatesFindAvailability`), which is verified against the consumer OBE.
 *
 * @param advanceMonths how many times to click the calendar "Next" arrow first
 * @param daysAmount    stay length in days to span (default OBE selection is 3)
 * @param page          the Playwright page
 */
export async function selectDatesFindAvailability(
  advanceMonths: number,
  daysAmount: number,
  page: Page
): Promise<void> {
  for (let i = 0; i < advanceMonths; i++) {
    await page.getByRole("button", { name: "Next", exact: true }).click();
  }

  const datesList = await page
    .getByLabel("Date Range Calendar,")
    .locator("[data-disabled=false][data-unavailable=false]")
    .all();

  const visibilities = await Promise.all(datesList.map((d) => d.isVisible()));
  const inx = visibilities.indexOf(true);
  if (inx < 0) {
    throw new Error("Visible date not found in the calendar.");
  }

  await datesList[inx].click();
  // The default OBE selection spans 3 days: clicking the same base index again
  // returns base + 3, so offset by (daysAmount - 3) to land on the check-out.
  await datesList[inx + daysAmount - 3].click();
}
