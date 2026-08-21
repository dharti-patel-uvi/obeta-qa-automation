import { expect, test } from "../test-data/fixtures";
import { advanceToRoom } from "../utils/navigateToStep";
import { beachesSingleGuest } from "../test-data/beachesFixture";

/**
 * Single-guest (solo traveller) booking on a Beaches resort.
 *
 * Only Beaches (family) resorts expose the Guests stepper — Sandals couples
 * resorts lock it at 2 adults — so a 1-guest itinerary is only expressible on a
 * Beaches property. This verifies the funnel accepts one guest end-to-end
 * through the Room step (dates from a dynamic fixture; Beaches Negril).
 *
 * Scope: stops on the Room listing — no booking/payment (CLAUDE.md).
 */
test.describe("Single guest - Beaches", () => {
  test("HP - Book a Beaches vacation for a single guest through the Room step", async ({
    page,
  }) => {
    const room =
      await test.step("Step 1: Beaches, 1 guest -> Room listing", () =>
        advanceToRoom(page, beachesSingleGuest));

    await test.step("Step 2: at least one room is available for one guest", async () => {
      await room.ensureRoomsAvailable(
        beachesSingleGuest.monthFrom,
        beachesSingleGuest.dateFrom,
        beachesSingleGuest.dateTo,
        beachesSingleGuest.yearFrom
      );
      await room.assertOnRoomStep();
      await expect(room.firstRoomCard).toBeVisible();
    });

    await test.step("the room details reflect a single guest", async () => {
      await room.openFirstRoomDetails();
      // The room-details summary echoes the guest count; a solo booking reads
      // "1 adult" / "1 Guest" rather than "2 adults".
      await expect(
        page.getByText(/\b1\s+(adult|guest)\b/i).first()
      ).toBeVisible();
    });
  });
});
