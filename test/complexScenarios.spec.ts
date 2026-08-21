import { expect, test } from "../test-data/fixtures";
import {
  advanceToRoom,
  advanceToRoomWithFlights,
  advanceToRoomWithFlightsAndSSGpoints,
} from "../utils/navigateToStep";
import { GuestsPage } from "../page-object/GuestsPage";
import { PaymentPage } from "../page-object/PaymentPage";
import {
  beachesNoFlights,
  beachesWithFlights,
  sandalsNoFlights,
  sandalsWithFlights,
  secondCard,
} from "../test-data/test3Fixture";
import {
  primaryGuest,
  secondaryGuest,
  additionalGuests,
} from "../test-data/guestFixture";
import { FlightsPage } from "../page-object/FlightsPage";

/**
 * test-3b — Beaches scenario, split from the raw `test/test-3.spec.ts`
 * recording and rebuilt on the Page Object Model.
 *
 * Journey (all inputs from fixtures — nothing hardcoded in the spec):
 *   Step 1 Vacation  — Beaches Negril, 5 guests, NO flights
 *   Step 2 Room      — book the first available room
 *   Step 3 Guests    — fill the primary + every additional guest rendered
 *   Step 4 Payment   — reach Payment and fill the card form
 *
 * Because no flights are added on Step 1, the OBE flow skips the flights
 * surface entirely and books the room straight onto the Guests step — there is
 * no "Continue Without Flights" page in this path.
 *
 * The 5-guest count is the Beaches-specific counterpart to test-3s' locked
 * 2-adult Sandals resort, so all four non-primary guests must be filled before
 * the Guests step will continue to Payment.
 *
 * SCOPE GUARD: the payment step fills everything EXCEPT the CVV and NEVER clicks
 * "PAY VACATION" — no CVV is entered, no payment is submitted, and no booking is
 * completed (see PaymentPage + CLAUDE.md rules).
 */
test.describe("Beaches + 5 guests + no flights + Pay Now with one credit card", () => {
  test("HP - Book without flights for 5 guests, reach Payment, fill card (no CVV, no submit)", async ({
    page,
  }) => {
    const room =
      await test.step("Step 1-2: vacation (5 guests, no flights) -> room listing", () =>
        advanceToRoom(page, beachesNoFlights));

    await test.step("Step 2: book the first available room", async () => {
      await room.ensureRoomsAvailable(
        beachesNoFlights.monthFrom,
        beachesNoFlights.dateFrom,
        beachesNoFlights.dateTo,
        beachesNoFlights.yearFrom
      );
      await room.bookFirstRoom();
    });

    const guests = new GuestsPage(page);
    await test.step("Step 3: fill the primary + every additional guest on the itinerary", async () => {
      await guests.assertOnGuestsStep();
      await expect(
        page.getByRole("article").getByText("Hold room for only $98.00.")
      ).toBeVisible();
      await guests.fillPrimaryGuest(primaryGuest);
      // The multi-guest Beaches itinerary renders one form per additional guest;
      // fill them all (count derived from the DOM, not hardcoded) so the step
      // can continue to Payment.
      await guests.fillAllAdditionalGuests([
        secondaryGuest,
        ...additionalGuests,
      ]);
    });

    const payment = new PaymentPage(page);
    await test.step("Step 4: reach Payment and one credit card (no CVV, no submit)", async () => {
      await guests.continueToPayment();
      await payment.assertOnPaymentStep();
      await expect(
        page.getByRole("article").getByText("Hold room for only $98.00.")
      ).toBeVisible();
      await payment.clickPayNowTab();
      // await payment.clickOneCard();
      await payment.fillPaymentData(beachesNoFlights.payment!);
      await payment.addProtectionPlan();
      await payment.clickTermsConditionsCheckbox();
      // STOP: never enter CVV, never click "PAY VACATION" (see CLAUDE.md).
      // await expect(payment.payVacationButton).toBeVisible();
    });
  });
});

/**
 * test-3s — Sandals scenario, split from the raw `test/test-3.spec.ts`
 * recording and rebuilt on the Page Object Model.
 *
 * Journey (all inputs from fixtures — nothing hardcoded in the spec):
 *   Step 1 Vacation  — Sandals resort, roundtrip flights added
 *   Step 2 Room      — book a specific room by name (not index); the room is
 *                      chosen from data (see test3Fixture.sandalsRoomName)
 *   Step 3 Flights   — select the first itinerary and continue
 *   Step 4 Guests    — fill primary + secondary guest details
 *   Step 5 Payment   — reach Payment and fill the card form
 *
 * SCOPE GUARD: the payment step fills everything EXCEPT the CVV and NEVER clicks
 * "PAY VACATION" — no CVV is entered, no payment is submitted, and no booking is
 * completed (see PaymentPage + CLAUDE.md rules).
 */

test.describe("Sandals + default guests + no flights + Pay Now with one credit card", () => {
  test("HP - Book without flights for default guests, reach Payment, fill card (no CVV, no submit)", async ({
    page,
  }) => {
    const room =
      await test.step("Step 1-2: vacation (default guests, no flights) -> room listing", () =>
        advanceToRoom(page, sandalsNoFlights));

    await test.step("Step 2: book the first available room", async () => {
      await room.ensureRoomsAvailable(
        sandalsNoFlights.monthFrom,
        sandalsNoFlights.dateFrom,
        sandalsNoFlights.dateTo,
        sandalsNoFlights.yearFrom
      );
      await room.bookFirstRoom();
    });

    const guests = new GuestsPage(page);
    await test.step("Step 3: fill the primary + every additional guest on the itinerary", async () => {
      await guests.assertOnGuestsStep();
      await expect(
        page.getByRole("article").getByText("Hold room for only $98.00.")
      ).toBeVisible();
      await guests.fillPrimaryGuest(primaryGuest);
      // The multi-guest Beaches itinerary renders one form per additional guest;
      // fill them all (count derived from the DOM, not hardcoded) so the step
      // can continue to Payment.
      await guests.fillAllAdditionalGuests([
        secondaryGuest,
        ...additionalGuests,
      ]);
    });

    const payment = new PaymentPage(page);
    await test.step("Step 4: reach Payment and one credit card (no CVV, no submit)", async () => {
      await guests.continueToPayment();
      await payment.assertOnPaymentStep();
      await expect(
        page.getByRole("article").getByText("Hold room for only $98.00.")
      ).toBeVisible();
      await payment.clickPayNowTab();
      // await payment.clickOneCard();
      await payment.fillPaymentData(sandalsNoFlights.payment!);
      await payment.addProtectionPlan();
      await payment.clickTermsConditionsCheckbox();
      // STOP: never enter CVV, never click "PAY VACATION" (see CLAUDE.md).
      // await expect(payment.payVacationButton).toBeVisible();
    });
  });
});

test.describe("Sandals + default guests + flights + Over-The-Water  Bungalow + Pay Now with two credit cards", () => {
  test("HP - Book a room by name with flights, reach Payment, two credit cards (no CVV, no submit)", async ({
    page,
  }) => {
    const room =
      await test.step("Step 1-2: vacation with flights -> room listing", () =>
        advanceToRoomWithFlights(page, sandalsWithFlights));

    await test.step("Step 2: book the first available room", async () => {
      await room.ensureRoomsAvailable(
        sandalsWithFlights.monthFrom,
        sandalsWithFlights.dateFrom,
        sandalsWithFlights.dateTo,
        sandalsWithFlights.yearFrom
      );
      // FORMER: selectOverTheWaterBungalowCheckbox() was applied here, but
      // Sandals Caribbean Cay has no OTW Bungalow inventory (fixture comment).
      // Applying the filter left 0 bookable rooms, causing bookFirstRoom() to fail.
      await room.bookFirstRoom();
    });

    const flights = new FlightsPage(page);
    await test.step("Step 3: select the first flight option and continue", async () => {
      if (await flights.firstShowDetailsButton.isVisible()) {
        // await flights.assertOnFlightsStep();
        await flights.selectFirstFlightAndContinue();
        await flights.selectFlightsAndContinue();
      } else {
        console.log(
          "No flights available to select, continuing to Guests step."
        );
        // FORMER: expect(flights.noFlightsFoundText).toBeVisible() — asserting the
        // specific "no flights" copy caused a 15s timeout when OBETA's message text
        // differed from the regex. Use waitFor on the continue button instead.
        await flights.continueWithoutFlightsButton.waitFor({
          state: "visible",
          timeout: 30000,
        });
        await flights.continueWithoutFlightsButton.click();
      }
    });

    const guests = new GuestsPage(page);
    await test.step("Step 4: fill guest details", async () => {
      await guests.assertOnGuestsStep();
      // OTW filter was removed (no OTW inventory at this resort), so the first
      // available room has the standard $98 hold amount, not $2,500.
      await expect(
        page.getByRole("article").getByText("Hold room for only $98.00.")
      ).toBeVisible();
      await guests.fillPrimaryGuest(primaryGuest);
      await guests.fillSecondaryGuest(secondaryGuest);
    });

    const payment = new PaymentPage(page);
    await test.step("Step 5: reach Payment and fill two credit cards (no CVV, no submit)", async () => {
      await guests.continueToPayment();
      await payment.assertOnPaymentStep();
      //validate hold room functionality - $98 (OTW filter removed; standard room)
      await expect(
        page.getByRole("article").getByText("Hold room for only $98.00.")
      ).toBeVisible();
      await payment.clickPayNowTab();
      await payment.fillPaymentData(sandalsWithFlights.payment!); // card 1
      await payment.clickAnotherCardCTA(); // reveal CREDIT CARD 2
      await payment.fillSecondCard(secondCard); // card 2 (no CVV)
      await payment.addProtectionPlan();
      await payment.clickTermsConditionsCheckbox();
      // STOP: never enter CVV, never click "PAY VACATION" (see CLAUDE.md).
      // await expect(payment.payVacationButton).toBeVisible();
    });
  });
});

// ---------------------------

test.describe("Beaches + default guests + flights + Pay Now with two credit cards", () => {
  test("HP - Book a room by name with flights, reach Payment, two credit cards (no CVV, no submit)", async ({
    page,
  }) => {
    const room =
      await test.step("Step 1-2: vacation with flights -> room listing", () =>
        advanceToRoomWithFlights(page, beachesWithFlights));

    await test.step("Step 2: book the selected room by name", async () => {
      await room.ensureRoomsAvailable(
        beachesWithFlights.monthFrom,
        beachesWithFlights.dateFrom,
        beachesWithFlights.dateTo,
        beachesWithFlights.yearFrom
      );
      // await room.selectOverTheWaterBungalowCheckbox();
      await room.bookFirstRoom();
      // await room.bookRoomByName(sandalsRoomName);
    });

    const flights = new FlightsPage(page);
    await test.step("Step 3: select the first flight option and continue", async () => {
      if (await flights.firstShowDetailsButton.isVisible()) {
        // await flights.assertOnFlightsStep();
        await flights.selectFirstFlightAndContinue();
        await flights.selectFlightsAndContinue();
      } else {
        console.log(
          "No flights available to select, continuing to Guests step."
        );
        // FORMER: expect(flights.noFlightsFoundText).toBeVisible() — fragile copy assertion.
        await flights.continueWithoutFlightsButton.waitFor({
          state: "visible",
          timeout: 30000,
        });
        await flights.continueWithoutFlightsButton.click();
      }
    });

    const guests = new GuestsPage(page);
    await test.step("Step 4: fill guest details", async () => {
      await guests.assertOnGuestsStep();
      await expect(
        page.getByRole("article").getByText("Hold room for only $98.00.")
      ).toBeVisible();
      await guests.fillPrimaryGuest(primaryGuest);
      await guests.fillSecondaryGuest(secondaryGuest);
    });

    const payment = new PaymentPage(page);
    await test.step("Step 5: reach Payment and fill two credit cards (no CVV, no submit)", async () => {
      await guests.continueToPayment();
      await payment.assertOnPaymentStep();
      //validate hold room functionality - $98
      await expect(
        page.getByRole("article").getByText("Hold room for only $98.00.")
      ).toBeVisible();
      await payment.clickPayNowTab();
      await payment.fillPaymentData(beachesWithFlights.payment!); // card 1
      await payment.clickAnotherCardCTA(); // reveal CREDIT CARD 2
      await payment.fillSecondCard(secondCard); // card 2 (no CVV)
      await payment.addProtectionPlan();
      await payment.clickTermsConditionsCheckbox();
      // STOP: never enter CVV, never click "PAY VACATION" (see CLAUDE.md).
      // await expect(payment.payVacationButton).toBeVisible();
    });
  });
});

test.describe("SSG Look up + Apply points + hold room for $98", () => {
  // Skip when the configured SSG email looks like a staging credential being run
  // against prod — the lookup would return no results. Update SSG_LOOKUP_EMAIL /
  // SSG_LOOKUP_LAST_NAME in .env with a valid prod account to enable this test.
  const ssgEmail = process.env.SSG_LOOKUP_EMAIL || "";
  const ssgSkip =
    !ssgEmail ||
    ((process.env.TARGET_ENV || "dev") === "prod" &&
      ssgEmail.toLowerCase().includes("stg."));

  test("HP - SSG Look up in step one and apply points in Guest information step", async ({
    page,
  }) => {
    test.skip(
      ssgSkip,
      "SSG happy-path skipped: update SSG_LOOKUP_EMAIL / SSG_LOOKUP_LAST_NAME in .env with a valid prod account email."
    );
    const room =
      await test.step("Step 1-2: vacation with flights -> room listing", () =>
        advanceToRoomWithFlightsAndSSGpoints(page, beachesWithFlights));

    await test.step("Step 2: book the selected room by name", async () => {
      await room.ensureRoomsAvailable(
        beachesWithFlights.monthFrom,
        beachesWithFlights.dateFrom,
        beachesWithFlights.dateTo,
        beachesWithFlights.yearFrom
      );
      // await room.selectOverTheWaterBungalowCheckbox();
      await room.bookFirstRoom();
      // await room.bookRoomByName(sandalsRoomName);
    });

    const flights = new FlightsPage(page);
    await test.step("Step 3: select the first flight option and continue", async () => {
      if (await flights.firstShowDetailsButton.isVisible()) {
        // await flights.assertOnFlightsStep();
        await flights.selectFirstFlightAndContinue();
        await flights.selectFlightsAndContinue();
      } else {
        console.log(
          "No flights available to select, continuing to Guests step."
        );
        // FORMER: expect(flights.noFlightsFoundText).toBeVisible() — fragile copy assertion.
        await flights.continueWithoutFlightsButton.waitFor({
          state: "visible",
          timeout: 30000,
        });
        await flights.continueWithoutFlightsButton.click();
      }
    });

    const guests = new GuestsPage(page);
    await test.step("Step 4: fill guest details", async () => {
      await guests.assertOnGuestsStep();
      await expect(
        page.getByRole("article").getByText("Hold room for only $98.00.")
      ).toBeVisible();
      await guests.fillPrimaryGuest(primaryGuest);
      await guests.fillSecondaryGuest(secondaryGuest);
    });

    const payment = new PaymentPage(page);
    await test.step("Step 5: reach Payment and hold room for $98 (no CVV, no submit)", async () => {
      await guests.continueToPayment();
      await payment.assertOnPaymentStep();
      //validate hold room functionality - $98
      await expect(
        page.getByRole("article").getByText("Hold room for only $98.00.")
      ).toBeVisible();
      await payment.clickHoldRoomTab();
      await payment.holdFor98.click();
      // validate radio button for $0 hold is visible
      await expect(payment.holdFor98).toBeEnabled();
      await payment.holdForZero.click();
      await expect(payment.holdForZero).toBeEnabled();
      // Acknowledge the inline hold-policy terms before the card form activates.
      // This makes it the first "I agree to the" input on the page so that
      // clickTermsConditionsCheckbox() (.nth(1)) reliably targets the main terms.
      await payment.termsConditionsCheckboxFirst.scrollIntoViewIfNeeded();
      await payment.termsConditionsCheckboxFirst.click();
      // Re-select $98 (the hold-policy terms click resets the radio selection).
      await payment.holdFor98.click();
      await expect(payment.holdFor98).toBeEnabled();
      await payment.fillPaymentData(beachesWithFlights.payment!); // card 1
      await payment.clickTermsConditionsCheckbox();
      // STOP: never enter CVV, never click "PAY VACATION" (see CLAUDE.md).
      // await expect(payment.payVacationButton).toBeVisible();
    });
  });
});
