import { expect, test } from "../test-data/fixtures";
import { advanceToRoom } from "../utils/navigateToStep";
import { RoomDetailsPage } from "../page-object/RoomDetailsPage";
import vacationData from "../test-data/vacationFixture";

/**
 * Step 2b – Room Details (TestRail suite S921).
 *
 * Ported from the nextgen Sandals `roomDetails.spec.ts` (which has no TestRail
 * ids and continues into Payment). Only the in-scope behaviors are kept —
 * verifying the stay summary (nights / guests) and changing dates — and each
 * test STOPS on the Room Details surface, never booking or reaching Payment
 * (CLAUDE.md).
 *
 * Selectors/methods come from RoomDetailsPage (`[OBE-NG]`); confirm on the agent
 * DOM on first run (docs/SELF_HEALING.md). NOTE: OBETA's agent build may render
 * room details as a modal (already covered in room.spec) rather than the
 * consumer `/room-details/` page — reconcile on first run. TestRail ids to be
 * attached once mapped in the spreadsheet.
 */

test.describe("Step 2b - Room Details", () => {
  test("HP - Number of nights shown on Room Details", async ({ page }) => {
    const room = await advanceToRoom(page, vacationData);
    await room.openFirstRoomDetails();
    const details = new RoomDetailsPage(page);
    await details.assertOnRoomDetails();

    const nights = await details.nightsText();
    expect(nights).toMatch(/for \d+ nights?/i);
  });

  test("HP - Change dates on Room Details page", async ({ page }) => {
    const room = await advanceToRoom(page, vacationData);
    await room.openFirstRoomDetails();
    const details = new RoomDetailsPage(page);
    await details.assertOnRoomDetails();

    // await details.openDatePicker();
    await page.getByRole("button", { name: "Select dates" }).click();
    // Advance the calendar and pick a fresh 3-day span.
    await details.selectDates(3, 3);

    // Scope guard: stay on Room Details — do NOT continue to Guests/Payment.
    await details.assertOnRoomDetails();
  });
});
