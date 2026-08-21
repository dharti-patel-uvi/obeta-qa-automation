import { expect, test } from "../test-data/fixtures";
import {
  advanceToRoom,
  advanceToRoomWithFlights,
} from "../utils/navigateToStep";
import { FlightsPage } from "../page-object/FlightsPage";
import { GuestsPage } from "../page-object/GuestsPage";
import vacationData from "../test-data/vacationFixture";

/**
 * "Continue Without Flights" CTA skips flight selection.
 *
 * Strengthens the existing flights.spec URL-only checks (C59246 / C59255): this
 * asserts the CTA both (a) advances off the flights surface AND (b) actually
 * SKIPS flights — the Guests step renders with no flight itinerary attached (no
 * "Roundtrip Flights" summary carried forward).
 *
 * Scope: stops on Guests — no booking/payment (CLAUDE.md).
 */
test.describe("Continue Without Flights skips flight selection", () => {
  test("HP - Continue Without Flights lands on Guests with no flight selected", async ({
    page,
  }) => {
    const room = await advanceToRoomWithFlights(page, vacationData);
    await room.ensureRoomsAvailable(
      vacationData.monthFrom,
      vacationData.dateFrom,
      vacationData.dateTo,
      vacationData.yearFrom
    );
    await room.bookFirstRoom();

    const flights = new FlightsPage(page);
    await test.step("skip flights via the CTA", async () => {
      await expect(flights.continueWithoutFlightsButton).toBeVisible();
      await flights.continueWithoutFlights();
    });

    const guests = new GuestsPage(page);
    await test.step("Guests step reached with flights skipped", async () => {
      await guests.assertOnGuestsStep();
      // No flight was selected, so the "Change Flights" (Back to Roundtrip
      // Flights) CTA — which only renders for a flights-added itinerary — must
      // be absent.
      await expect(guests.changeFlightsButton).toHaveCount(0);
    });
  });
});
