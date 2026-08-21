import { expect, test } from "../test-data/fixtures";
import { advanceToRoom } from "../utils/navigateToStep";
import { FlightsPage } from "../page-object/FlightsPage";
import { GuestsPage } from "../page-object/GuestsPage";
import vacationData from "../test-data/vacationFixture";

/**
 * Pricing carries over from the Room step to the Guests step.
 *
 * Captures the first room card's total on the Room listing, books that room
 * (no flights, so the OBE flow lands on Guests), and asserts the SAME price
 * string is present in the Guests-step summary — proving the selected price is
 * carried through rather than recomputed differently.
 *
 * Scope: stops on Guests — never continues toward Payment (CLAUDE.md).
 */
test.describe("Pricing carry-over: Room -> Guests", () => {
  test("HP - Room total shown on the Room step is reflected on the Guests step", async ({
    page,
  }) => {
    const room = await advanceToRoom(page, vacationData);
    await room.ensureRoomsAvailable(
      vacationData.monthFrom,
      vacationData.dateFrom,
      vacationData.dateTo,
      vacationData.yearFrom
    );

    const roomTotal =
      await test.step("capture the first room's total price", () =>
        room.firstCardPriceText());
    expect(roomTotal).toMatch(/\$[\d,]+\.\d{2}/);

    await test.step("book the room and reach the Guests step", async () => {
      await room.bookFirstRoom();
      const flights = new FlightsPage(page);
      if (
        await flights.continueWithoutFlightsButton
          .isVisible()
          .catch(() => false)
      ) {
        await flights.continueWithoutFlights();
      }
    });

    const guests = new GuestsPage(page);
    await guests.assertOnGuestsStep();
    await test.step(`Guests summary shows the same room total (${roomTotal})`, async () => {
      await guests.assertShowsPrice(roomTotal);
    });
  });
});
