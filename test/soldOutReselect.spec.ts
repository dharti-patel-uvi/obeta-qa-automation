import { expect, test } from "../test-data/fixtures";
import { advanceToRoom } from "../utils/navigateToStep";
import { getRandomDateRange } from "../utils/getRandomDateRange";
import vacationData from "../test-data/vacationFixture";

/**
 * Selecting new dates for a Sold Out room.
 *
 * When the chosen dates return a Sold Out room card, the agent reselects a new
 * range via the room card's "Find Availability" reselect flow. This validates
 * that reselecting recovers a bookable room.
 *
 * Availability is dynamic, so a Sold Out card can't be guaranteed on demand: if
 * the initial dates are all available the test SKIPS at runtime (rather than
 * asserting on a state that isn't present) so it never yields a false failure.
 *
 * Scope: room listing only — no booking/payment (CLAUDE.md).
 */
test.describe("Sold Out room - reselect dates", () => {
  test("HP - Reselecting new dates recovers availability for a sold-out room", async ({
    page,
  }) => {
    const room = await advanceToRoom(page, vacationData);
    await room.assertOnRoomStep();

    const soldOut = await room.hasSoldOutRoom();
    test.skip(
      !soldOut,
      "No Sold Out room for the chosen dates on this run — reselect flow not exercisable."
    );

    // Pick a fresh future range different from the fixture's dates.
    const newRange = getRandomDateRange(4);
    await test.step("open the sold-out reselect flow and choose new dates", async () => {
      await room.openSoldOutReselect();
      await room.reselectDateRange(
        newRange.month,
        newRange.from,
        newRange.to,
        newRange.year
      );
    });

    await test.step("a bookable room is now available for the new dates", async () => {
      await room.assertOnRoomStep();
      await expect(room.bookFirstRoomButton).toBeVisible({ timeout: 30000 });
    });
  });
});
