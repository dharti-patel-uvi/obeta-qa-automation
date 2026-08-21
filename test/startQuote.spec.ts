import { expect, test } from "../test-data/fixtures";
import { VacationPage } from "../page-object/VacationPage";
import vacationData from "../test-data/vacationFixture";

/**
 * Step 1 – Vacation > Send Quote.
 *
 * Same booking inputs as the Book Now section, but the agent is building a
 * quote. Each test switches into quote mode first via `selectSendQuote()`.
 * Entry (TA Portal → sign in → launch OBETA) is handled by the `page` fixture.
 *
 * NOTE: the route reached after Continue in quote mode is not yet confirmed on
 * obetang-dev; the happy-path waits allow either the room or quote landing page
 * and should be tightened once verified (Phase 1).
 */

test("C59106 HP - User inputs a valid vacation input", async ({ page }) => {
  const vacation = new VacationPage(page);

  await vacation.selectSendQuote();
  await vacation.chooseDestination(vacationData.destination);
  await vacation.chooseResort(vacationData.resort);
  await vacation.selectDateRange(
    vacationData.monthFrom,
    vacationData.dateFrom,
    vacationData.dateTo
  );

  await vacation.continueToRoom();
  await page.waitForURL(/.*(room|quote)/);
  expect(page.url()).toMatch(/room|quote/);
});

test("C59107 SP - User makes a blank input", async ({ page }) => {
  const vacation = new VacationPage(page);

  await vacation.selectSendQuote();
  await vacation.continueToRoom();

  await expect(vacation.resortError).toBeVisible();
  await expect(vacation.datesError).toBeVisible();
  expect(page.url()).not.toMatch(/room|quote/);
});

test("C59108 SP - User picks a destination, but leaves the Resort dropdown blank", async ({
  page,
}) => {
  const vacation = new VacationPage(page);

  await vacation.selectSendQuote();
  await vacation.chooseDestination(vacationData.destination);
  await vacation.selectDateRange(
    vacationData.monthFrom,
    vacationData.dateFrom,
    vacationData.dateTo
  );
  await vacation.continueToRoom();

  await expect(vacation.resortError).toBeVisible();
});

test("C59109 HP - Clear Dates CTA", async ({ page }) => {
  const vacation = new VacationPage(page);

  await vacation.selectSendQuote();
  await vacation.chooseDestination(vacationData.destination);
  await vacation.chooseResort(vacationData.resort);
  await vacation.selectDateRange(
    vacationData.monthFrom,
    vacationData.dateFrom,
    vacationData.dateTo
  );
  await expect(vacation.clearDatesButton).toBeVisible();

  await vacation.clearDates();
  // Cleared dates field returns to its placeholder ("Check-In - Check-Out").
  await expect(vacation.selectDates).toContainText(
    /Vacation Dates|Select Dates|Check-?In/i
  );
});

test.skip("C60936 SP - User tries to book less than 3 nights", async ({
  page,
}) => {
  // should be skipped as nmin stay message is a ui feature - not a functional cta.
  const vacation = new VacationPage(page);

  await vacation.selectSendQuote();
  await vacation.chooseDestination(vacationData.destination);
  await vacation.chooseResort(vacationData.resort);
  await vacation.selectCheckInAndHoverShortStay(
    vacationData.monthFrom,
    vacationData.dateFrom,
    (parseInt(vacationData.dateFrom, 10) + 2).toString()
  );

  await expect(vacation.minStayMessage).toBeVisible();
});

// Detail blank in TestRail + Guests textbox is Beaches-only. See C59093.
test.fixme(
  "C59110 SP - User doesn't input the number of guests",
  async ({ page }) => {
    const vacation = new VacationPage(page);
    await vacation.selectSendQuote();
    await vacation.chooseDestination(vacationData.destination);
    await vacation.chooseResort(vacationData.resort);
    await vacation.selectDateRange(
      vacationData.monthFrom,
      vacationData.dateFrom,
      vacationData.dateTo
    );
    await vacation.continueToRoom();
    await expect(vacation.guestsError).toBeVisible();
  }
);

// C59111–C59116 (flight tests) removed: the Send Quote flow does not include
// flight functionality — quotes cannot contain airfare (CLAUDE.md).
//
// Instead of removing that coverage silently, the case below actively asserts
// the rule: switching to Send Quote replaces the "Add Flights" add-on with the
// airfare note. No TestRail id — this is a CLAUDE.md rule-enforcement guard.
test("HP - Send Quote shows the no-airfare note, not flight options (CLAUDE.md)", async ({
  page,
}) => {
  const vacation = new VacationPage(page);

  await vacation.selectSendQuote();
  await vacation.assertQuoteHasNoFlights();
});
