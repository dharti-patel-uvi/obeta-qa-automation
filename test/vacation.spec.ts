import { expect, test } from "../test-data/fixtures";
import { VacationPage } from "../page-object/VacationPage";
import vacationData from "../test-data/vacationFixture";

/**
 * Step 1 – Vacation > Book Now section.
 * TestRail suite S921. Case IDs are in each test title so results map back.
 *
 * Entry (TA Portal → sign in → launch OBETA) is handled by the `page` fixture
 * in ./fixtures — each test receives a page already on the vacation form.
 */

test("C59089 HP - User makes a valid vacation input", async ({ page }) => {
  const vacation = new VacationPage(page);

  await test.step("Select destination and resort", async () => {
    await vacation.chooseDestination(vacationData.destination);
    await vacation.chooseResort(vacationData.resort);
  });

  await test.step("Select travel dates", async () => {
    await vacation.selectDateRange(
      vacationData.monthFrom,
      vacationData.dateFrom,
      vacationData.dateTo
    );
  });

  await test.step("Continue to Step 2", async () => {
    await vacation.continueToRoom();
    await page.waitForURL(/.*room/);
    expect(page.url()).toContain("/room");
  });
});

test("C59091 SP - User makes a blank input", async ({ page }) => {
  const vacation = new VacationPage(page);

  await vacation.continueToRoom();

  // Required-field errors must surface; the user must NOT advance to Step 2.
  await expect(vacation.resortError).toBeVisible();
  await expect(vacation.datesError).toBeVisible();
  expect(page.url()).not.toContain("/room");
});

test("C59090 SP - User picks a destination, but leaves the Resort dropdown blank", async ({
  page,
}) => {
  const vacation = new VacationPage(page);

  await vacation.chooseDestination(vacationData.destination);
  await vacation.selectDateRange(
    vacationData.monthFrom,
    vacationData.dateFrom,
    vacationData.dateTo
  );
  await vacation.continueToRoom();

  await expect(vacation.resortError).toBeVisible();
  expect(page.url()).not.toContain("/room");
});

test("C59092 HP - Clear Dates CTA", async ({ page }) => {
  const vacation = new VacationPage(page);

  await vacation.chooseDestination(vacationData.destination);
  await vacation.chooseResort(vacationData.resort);
  await vacation.selectDateRange(
    vacationData.monthFrom,
    vacationData.dateFrom,
    vacationData.dateTo
  );
  // A committed date range enables the Clear Dates CTA.
  await expect(vacation.clearDatesButton).toBeVisible();

  await vacation.clearDates();

  // Dates textbox returns to placeholder ("Check-In - Check-Out") — the
  // committed range is gone.
  await expect(vacation.selectDates).toContainText(
    /Vacation Dates|Select Dates|Check-?In/i
  );
});

test("C59497 SP - User tries to book less than 3 nights", async ({ page }) => {
  const vacation = new VacationPage(page);

  await vacation.chooseDestination(vacationData.destination);
  await vacation.chooseResort(vacationData.resort);
  // Pick a check-in, then hover a date only 2 nights out.
  await vacation.selectCheckInAndHoverShortStay(
    vacationData.monthFrom,
    vacationData.dateFrom,
    (parseInt(vacationData.dateFrom, 10) + 2).toString()
  );

  await expect(vacation.minStayMessage).toBeVisible();
});

// Detail blank in TestRail + the Guests textbox is only exposed for the Beaches
// brand. Needs the product rule / a Beaches resort confirmed on obetang-dev.
test.fixme(
  "C59093 SP - User doesn't input the number of guests",
  async ({ page }) => {
    const vacation = new VacationPage(page);
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

test("C59094 HP - User makes a valid booking input, and adds Economy flights", async ({
  page,
}) => {
  const vacation = new VacationPage(page);
  const flight = vacationData.flight!;

  await vacation.chooseDestination(vacationData.destination);
  await vacation.chooseResort(vacationData.resort);
  await vacation.selectDateRange(
    vacationData.monthFrom,
    vacationData.dateFrom,
    vacationData.dateTo
  );

  await vacation.addFlights();
  await vacation.setDepartureCity(flight.airport, flight.city);

  await vacation.continueToRoom();
  await page.waitForURL(/.*room/);
  expect(page.url()).toContain("/room");
});

test("C59097 HP - User adds flights, and requests First Class flights", async ({
  page,
}) => {
  const vacation = new VacationPage(page);
  const flight = vacationData.flight!;

  await vacation.chooseDestination(vacationData.destination);
  await vacation.chooseResort(vacationData.resort);
  await vacation.selectDateRange(
    vacationData.monthFrom,
    vacationData.dateFrom,
    vacationData.dateTo
  );

  await vacation.addFlights();
  await vacation.setDepartureCity(flight.airport, flight.city);
  await vacation.selectFlightClass("First Class");

  await vacation.continueToRoom();
  await page.waitForURL(/.*room/);
  expect(page.url()).toContain("/room");
});

test("C59095 SP - User adds flights, but inputs an invalid departure city", async ({
  page,
}) => {
  const vacation = new VacationPage(page);

  await vacation.addFlights();
  await vacation.typeDepartureCityRaw("Great Britain");
  await vacation.continueToRoom();

  await expect(vacation.flightsDepartingFromError).toBeVisible();
  expect(page.url()).not.toContain("/room");
});

test("C59096 SP - User adds flights, but leaves the departure city blank", async ({
  page,
}) => {
  const vacation = new VacationPage(page);

  await vacation.addFlights();
  await vacation.continueToRoom();

  await expect(vacation.flightsDepartingFromError).toBeVisible();
  expect(page.url()).not.toContain("/room");
});

test("C59100 SP - User adds flights, and inputs special characters", async ({
  page,
}) => {
  const vacation = new VacationPage(page);

  await vacation.addFlights();
  await vacation.typeDepartureCityRaw("#$%#$%@!!!#");
  await vacation.continueToRoom();

  await expect(vacation.flightsDepartingFromError).toBeVisible();
  expect(page.url()).not.toContain("/room");
});

test("C59101 SP - User adds flights, and inputs numbers", async ({ page }) => {
  const vacation = new VacationPage(page);

  await vacation.addFlights();
  await vacation.typeDepartureCityRaw("1234567890");
  await vacation.continueToRoom();

  await expect(vacation.flightsDepartingFromError).toBeVisible();
  expect(page.url()).not.toContain("/room");
});
