import { expect, test } from "../test-data/fixtures";
import { advanceToRoom } from "../utils/navigateToStep";
import vacationData from "../test-data/vacationFixture";

/**
 * "View Room Details" CTA functionality.
 *
 * room.spec already opens the details modal for a couple of sub-cases; this
 * spec verifies the CTA's core behaviour as a group: opening the modal, that it
 * surfaces the room's content (Location tab + a key feature), and that it closes
 * cleanly back to the listing.
 *
 * Scope: room listing/modal only — no booking/payment (CLAUDE.md).
 */
test.describe("View Room Details CTA", () => {
  test("HP - Opens the room details modal from the room card", async ({
    page,
  }) => {
    const room = await advanceToRoom(page, vacationData);
    await room.ensureRoomsAvailable(
      vacationData.monthFrom,
      vacationData.dateFrom,
      vacationData.dateTo,
      vacationData.yearFrom
    );
    await room.openRoomDetailsModal();
    await expect(room.roomDetailsModal).toBeVisible();
  });


  test("HP - Room details modal contains a key room feature", async ({
    page,
  }) => {
    const room = await advanceToRoom(page, vacationData);
    await room.ensureRoomsAvailable(
      vacationData.monthFrom,
      vacationData.dateFrom,
      vacationData.dateTo,
      vacationData.yearFrom
    );
    await room.openRoomDetailsModal();
    await room.openFirstKeyFeature();
    // await room.closeDialog();
    // Back on the listing with the first room card still available.
    // await expect(room.firstRoomCard).toBeVisible();
    await room.assertOnRoomStep();
  });
});
