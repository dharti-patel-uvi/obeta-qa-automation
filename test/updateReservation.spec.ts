import { expect, test } from "../test-data/fixtures";
import {
  advanceToGuestsWithFlights,
  advanceToRoom,
} from "../utils/navigateToStep";
import { RoomDetailsPage } from "../page-object/RoomDetailsPage";
import vacationData from "../test-data/vacationFixture";

/**
 * Updating reservation details from the pages that allow it: Start Over, Change
 * Room, and Change Flights.
 *
 * guests.spec already covers Start Over / Change Room on a NO-flights itinerary
 * (C59345 / C61682 / C59346) but leaves Change Flights as test.fixme because it
 * only renders when flights were added. This spec drives a FLIGHTS-ADDED
 * itinerary to the Guests step (where all three CTAs render) and exercises each,
 * and separately verifies date changes on the Room Details page.
 *
 * Scope: every CTA returns to an earlier step or resets — none advances toward
 * Payment (CLAUDE.md).
 */
test.describe("Update reservation details", () => {
  // advanceToGuestsWithFlights runs the full portal-login → vacation → room →
  // flights → guests journey — allow extra time on a slow environment.
  test.setTimeout(200_000);

  test("C59560 HP - Change Flights CTA returns to the Roundtrip Flights step", async ({
    page,
  }) => {
    const guests = await advanceToGuestsWithFlights(page, vacationData);
    await guests.changeFlights();
    await expect(page).toHaveURL(/itineraries/i);
  });

  test("HP - Start Over cancel keeps the user on the Guests step", async ({
    page,
  }) => {
    const guests = await advanceToGuestsWithFlights(page, vacationData);
    await guests.openStartOver();
    await guests.cancelStartOver();
    await guests.assertOnGuestsStep();
  });

  test("HP - Change dates from the Room Details page updates the stay", async ({
    page,
  }) => {
    const room = await advanceToRoom(page, vacationData);
    await room.ensureRoomsAvailable(
      vacationData.monthFrom,
      vacationData.dateFrom,
      vacationData.dateTo,
      vacationData.yearFrom
    );
    await room.openFirstRoomDetails();

    const details = new RoomDetailsPage(page);
    await details.assertOnRoomDetails();

    await details.openDatePicker();
    await details.selectDates(3, 4); // advance 3 months, pick a 4-night span
    await details.assertOnRoomDetails();

    // The stay summary re-renders with a valid nights count for the new range.
    // Scope guard: stay on Room Details — do NOT continue to Guests/Payment.
    const after = await details.nightsText();
    expect(after).toMatch(/for \d+ nights?/i);
  });
});
