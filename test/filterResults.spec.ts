import { expect, test } from "../test-data/fixtures";
import {
  advanceToRoom,
  advanceToFlights,
  advanceToFlightsWithRetry,
} from "../utils/navigateToStep";
import type { FlightsPage } from "../page-object/FlightsPage";
import vacationData from "../test-data/vacationFixture";

/**
 * Filters return ACCURATE results (not just "a filter is applied").
 *
 * The existing room.spec / flights.spec cases assert the control is checked or
 * the Reset chip renders; these assert the RESULTS actually reflect the filter:
 *   • Rooms  — after a Room View filter, every listed room card describes that
 *              view (RoomPage.assertViewFilterResultsMatch).
 *   • Flights — after "Nonstop only", every itinerary card reads Nonstop with no
 *              stop-count (FlightsPage.assertAllNonstop).
 *
 * Scope: room/flights listing only — no booking/payment (CLAUDE.md).
 */
test.describe("Filters show accurate results", () => {
  test.describe("Rooms page", () => {
    test("HP - Oceanfront view filter returns only oceanfront rooms", async ({
      page,
    }) => {
      const room = await advanceToRoom(page, vacationData);
      await room.ensureRoomsAvailable(
        vacationData.monthFrom,
        vacationData.dateFrom,
        vacationData.dateTo,
        vacationData.yearFrom
      );
      await room.toggleFilter(room.oceanfrontCheckbox);
      await room.assertFilterApplied("Oceanfront");
      await room.assertViewFilterResultsMatch("Oceanfront", ["Ocean Front"]);
    });

    test("HP - Beachfront view filter returns only beachfront rooms", async ({
      page,
    }) => {
      const room = await advanceToRoom(page, vacationData);
      await room.ensureRoomsAvailable(
        vacationData.monthFrom,
        vacationData.dateFrom,
        vacationData.dateTo,
        vacationData.yearFrom
      );
      await room.toggleFilter(room.beachfrontCheckbox);
      await room.assertFilterApplied("Beachfront");
      await room.assertViewFilterResultsMatch("Beachfront", ["Beach Front"]);
    });
  });

  test.describe("Flights page", () => {
    test("HP - Nonstop-only returns only nonstop itineraries", async ({
      page,
      context,
    }) => {
      // Retry across multiple date windows, gateways, and resorts. Each full
      // Step1→Room→Flights cycle takes ~15-20s; 18 candidates → generous timeout.
      test.setTimeout(300_000);
      let flights: FlightsPage;
      try {
        flights = await advanceToFlightsWithRetry(page, context, vacationData);
      } catch (e) {
        const msg = String(e);
        // Skip (not fail) when the environment has no flight inventory at all —
        // this is a data-availability issue, not a code defect.
        if (msg.includes("no flight results found")) {
          test.skip(true, msg.replace(/^Error:\s*/, ""));
        }
        throw e;
      }
      await flights.areElementsVisible();
      await flights.assertResultsPresent();
      await flights.setNonstopOnly();
      await flights.assertAllNonstop();
      await expect(flights.nonstopFlightsFrom).toBeVisible();
      await expect(flights.nonstopFlightsTo).toBeVisible();
    });

    test("HP - Sort Price Low→High orders flight results by price", async ({
      page,
      context,
    }) => {
      // Mirror the Nonstop-only test: retry across date windows / gateways /
      // resorts to reach a flights surface with actual results. When the
      // environment has no flight inventory at all, skip (data issue, not code).
      test.setTimeout(300_000);
      let flights: FlightsPage;
      try {
        flights = await advanceToFlightsWithRetry(page, context, vacationData);
      } catch (e) {
        const msg = String(e);
        if (msg.includes("no flight results found")) {
          test.skip(true, msg.replace(/^Error:\s*/, ""));
        }
        throw e;
      }
      await flights.areElementsVisible();
      // checkPriceLowToHigh sorts then asserts the first results are ascending.
      await flights.checkPriceLowToHigh();
    });
  });
});
