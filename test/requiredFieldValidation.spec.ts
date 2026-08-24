import { expect, test } from "../test-data/fixtures";
import { VacationPage } from "../page-object/VacationPage";
import { advanceToGuests } from "../utils/navigateToStep";
import vacationData from "../test-data/vacationFixture";

/**
 * Required-field validation – Book Now flow (Steps 1 and 4).
 *
 * Each test navigates to a step and immediately attempts to advance without
 * filling required fields, then asserts that inline "This field is required"
 * error messages appear for every required field and that the page does NOT
 * advance.
 *
 * Payment page (Step 5) is excluded per project scope (CLAUDE.md).
 *
 * Step 2 (Room) and Step 3 (Flights) are not form-input steps — the user
 * advances by clicking a room card or a flight CTA, so there are no freeform
 * required-field errors to validate there.
 */
test.describe("Required Field Validation - Book Now Flow", () => {
  // ─── Step 1 – Vacation ────────────────────────────────────────────────── //

  test.describe("Step 1 - Vacation", () => {
    test("SP - Blank submission shows required-field errors for resort and dates", async ({
      page,
    }) => {
      const vacation = new VacationPage(page);

      await test.step("submit the vacation form without filling any field", async () => {
        await vacation.continueToRoom();
      });

      await test.step("resort error is visible", async () => {
        await expect(vacation.resortError).toBeVisible();
      });

      await test.step("dates error is visible", async () => {
        await expect(vacation.datesError).toBeVisible();
      });

      await test.step("user stays on Step 1 and does not advance to Room", async () => {
        expect(page.url()).not.toMatch(/room|itinerar/);
      });
    });

    test("SP - Resort left blank (destination + dates filled) shows resort error", async ({
      page,
    }) => {
      const vacation = new VacationPage(page);

      await test.step("fill destination and dates but leave resort blank", async () => {
        await vacation.chooseDestination(vacationData.destination);
        await vacation.selectDateRange(
          vacationData.monthFrom,
          vacationData.dateFrom,
          vacationData.dateTo
        );
        await vacation.continueToRoom();
      });

      await test.step("resort required-field error is visible", async () => {
        await expect(vacation.resortError).toBeVisible();
      });

      await test.step("user stays on Step 1", async () => {
        expect(page.url()).not.toMatch(/room|itinerar/);
      });
    });

    test("SP - Dates left blank (destination + resort filled) shows dates error", async ({
      page,
    }) => {
      const vacation = new VacationPage(page);

      await test.step("fill destination and resort but leave dates blank", async () => {
        await vacation.chooseDestination(vacationData.destination);
        await vacation.chooseResort(vacationData.resort);
        await vacation.continueToRoom();
      });

      await test.step("dates required-field error is visible", async () => {
        await expect(vacation.datesError).toBeVisible();
      });

      await test.step("user stays on Step 1", async () => {
        expect(page.url()).not.toMatch(/room|itinerar/);
      });
    });

    test("SP - Flights add-on: departure city left blank shows departure city error", async ({
      page,
    }) => {
      const vacation = new VacationPage(page);

      await test.step("fill vacation fields and add flights, then leave departure city blank", async () => {
        await vacation.chooseDestination(vacationData.destination);
        await vacation.chooseResort(vacationData.resort);
        await vacation.selectDateRange(
          vacationData.monthFrom,
          vacationData.dateFrom,
          vacationData.dateTo
        );
        await vacation.addFlights();
        // Intentionally omit setDepartureCity() — departure city stays blank.
        await vacation.continueToRoom();
      });

      await test.step("departure city required-field error is visible", async () => {
        await expect(vacation.flightsDepartingFromError).toBeVisible();
      });

      await test.step("user stays on Step 1", async () => {
        expect(page.url()).not.toMatch(/room|itinerar/);
      });
    });
  });

  // ─── Step 4 – Guest Information ───────────────────────────────────────── //

  test.describe("Step 4 - Guest Information", () => {
    // Navigating through Vacation → Room → (skip Flights) → Guests adds time.
    test.setTimeout(150_000);

    test("SP - Blank submission shows required-field errors for all primary and additional guest fields", async ({
      page,
    }) => {
      // Navigate to Guests without filling any guest details (no-flights path;
      // vacationData has 2 adults so a primary + one additional guest form renders).
      const guests = await advanceToGuests(page, vacationData);

      await test.step("click 'Continue to Payment' without filling any guest field", async () => {
        await guests.triggerGuestValidation();
      });

      await test.step("all primary guest required-field errors are visible", async () => {
        await expect(guests.guestTitleError).toBeVisible();
        await expect(guests.guestFirstNameError).toBeVisible();
        await expect(guests.guestLastNameError).toBeVisible();
        await expect(guests.guestEmailError).toBeVisible();
        await expect(guests.guestAddressError).toBeVisible();
        await expect(guests.guestCountryError).toBeVisible();
        await expect(guests.guestStateError).toBeVisible();
        await expect(guests.guestCityError).toBeVisible();
        await expect(guests.guestZipCodeError).toBeVisible();
        // Phone is not enforced as a required field in the live app —
        // guest-phone-1-error-ui never renders on blank submission.
      });

      await test.step("all additional guest required-field errors are visible", async () => {
        await expect(guests.agTitleError).toBeVisible();
        await expect(guests.agGenderError).toBeVisible();
        await expect(guests.agFirstNameError).toBeVisible();
        await expect(guests.agLastNameError).toBeVisible();
        await expect(guests.agDobError).toBeVisible();
      });

      await test.step("user stays on Step 4 and does not advance to Payment", async () => {
        expect(page.url()).not.toContain("payment");
      });
    });
  });
});
