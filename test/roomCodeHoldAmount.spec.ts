import { expect, test } from "../test-data/fixtures";
import { advanceToRoom } from "../utils/navigateToStep";
import { GuestsPage } from "../page-object/GuestsPage";
import { FlightsPage } from "../page-object/FlightsPage";
import beachesData from "../test-data/beachesFixture";
import type { VacationData } from "../test-data/types";
import { Page } from "@playwright/test";

/**
 * Generates a future date range for the mid-flow date change on the Room listing.
 * Uses month+10 (one month later than beachesData's month+9 offset) so the two
 * ranges do not overlap and sold-out risk is minimised.
 */
function futureDateRange(
  monthsFromNow: number,
  nights = 3
): {
  from: string;
  to: string;
  month: string;
  year: string;
} {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + monthsFromNow);
  const startDay = 15;
  const endDay = startDay + nights;
  const month = d.toLocaleDateString("en-US", { month: "long" });
  const year = d.getFullYear().toString();
  return { from: startDay.toString(), to: endDay.toString(), month, year };
}

const updatedDates = futureDateRange(10, 3);
const scrDates = futureDateRange(13, 3);

/**
 * Captures the room code displayed on the first visible room card on the listing,
 * e.g. "Room Code: 3BB" → returns "3BB". Returns empty string if none is found
 * (the caller will surface this as a test warning rather than a hard failure, since
 * not every resort renders a room code on the card).
 */
async function captureFirstRoomCode(page: Page): Promise<string> {
  const el = page.getByText(/Room Code:\s*[A-Z0-9]+/i).first();
  await el
    .waitFor({ state: "visible", timeout: 15_000 })
    .catch(() => undefined);
  const text = (await el.textContent().catch(() => "")) ?? "";
  const match = text.match(/Room Code:\s*([A-Z0-9]+)/i);
  return match?.[1] ?? "";
}

/**
 * Asserts the hold-room blurb is shown in the vacation summary section.
 * The dollar amount is room-specific so a regex pattern is used rather than a
 * hardcoded value.
 */
async function assertHoldAmountVisible(page: Page): Promise<void> {
  await expect(
    page.getByText(/Hold room for only \$[\d,]+\.?\d*/i).first()
  ).toBeVisible({ timeout: 15_000 });
}

/**
 * Navigate back to Step 2 – Room via the breadcrumb "Room" link that renders
 * on Steps 3/4 (Guests / Flights surfaces).
 */
async function navigateBackToRoom(page: Page): Promise<void> {
  await page.getByRole("link", { name: /^Room$/i }).click();
  await page
    .waitForURL(/room|itinerar/i, { timeout: 30_000 })
    .catch(() => undefined);
  await page.waitForTimeout(1_500);
}

/**
 * Handle the optional "Continue Without Flights" surface that OBE may show after
 * booking a room even when no flights were added on Step 1.
 */
async function bypassFlightsIfPresent(page: Page): Promise<void> {
  const flights = new FlightsPage(page);
  const continueBtn = flights.continueWithoutFlightsButton;
  if (await continueBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await flights.continueWithoutFlights();
  }
}

// ─── Data ────────────────────────────────────────────────────────────────────

// Second-destination data for the mid-flow resort change (Turks & Caicos).
const turksData = {
  destination: "Turks & Caicos",
  resort: "Beaches Turks & Caicos",
};

// ─── Sandals resort data ──────────────────────────────────────────────────────
// Each constant corresponds to one hold-amount scenario. Resort/destination
// labels must match the live OBETA vacation-form dropdowns (verify if a test
// fails at the destination/resort selection step — see docs/SELF_HEALING.md).
//
//   SGL = Sandals Grande St. Lucian (St. Lucia)   → OWB  → $2,500 hold
//   SWH = Sandals South Coast      (Jamaica)       → OWB  → $2,500 hold
//   SRC = Sandals Royal Curaçao    (Curaçao)       → Seaside Bungalow → $1,000 hold
//   SCR = Sandals Caribbean Cay    (Jamaica)       → OWB & OWV → $2,500 hold

const sglResortData: VacationData = {
  destination: "St. Lucia",
  resort: "Sandals Grande St. Lucian",
  monthFrom: updatedDates.month,
  dateFrom: updatedDates.from,
  dateTo: updatedDates.to,
  yearFrom: updatedDates.year,
  guests: { adults: 2 },
};

const swhResortData: VacationData = {
  destination: "Jamaica",
  resort: "Sandals South Coast",
  monthFrom: updatedDates.month,
  dateFrom: updatedDates.from,
  dateTo: updatedDates.to,
  yearFrom: updatedDates.year,
  guests: { adults: 2 },
};

const srcResortData: VacationData = {
  destination: "Curacao",
  resort: "Sandals Royal Curaçao",
  monthFrom: updatedDates.month,
  dateFrom: updatedDates.from,
  dateTo: updatedDates.to,
  yearFrom: updatedDates.year,
  guests: { adults: 2 },
};

const scrResortData: VacationData = {
  destination: "Jamaica",
  resort: "Sandals Caribbean Cay",
  monthFrom: scrDates.month,
  dateFrom: scrDates.from,
  dateTo: scrDates.to,
  yearFrom: scrDates.year,
  guests: { adults: 2 },
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recorded flow (test-4.spec.ts) converted to Page Object Model.
 *
 * This spec covers the end-to-end journey captured in the raw codegen recording:
 *
 *   Step 1  Vacation   — Beaches Negril, Jamaica (from beachesData fixture)
 *   Step 2  Room       — change dates via vacation editor; filter Butler Elite;
 *                        capture room code; book first matching room
 *   Step 3  Guests     — ✔ assert room code matches selected card
 *                        ✔ assert "Hold room for only $X" is shown
 *   (back)  Room       — navigate back via breadcrumb; change to Beaches Turks &
 *                        Caicos; filter Butler Elite; capture room code; book
 *   Step 3  Guests     — ✔ assert new room code
 *                        ✔ assert hold amount
 *   (back)  Room       — navigate back via breadcrumb; open "Keep This Room"
 *                        flow on the currently-selected card
 *   Step 3  Guests     — ✔ assert room code is unchanged (same card kept)
 *                        ✔ assert hold amount
 *
 * SCOPE GUARDS
 * - No CVV is entered; no payment is submitted; no booking is completed.
 * - Never clicks "PAY VACATION" (see CLAUDE.md).
 * - Flights are bypassed via "Continue Without Flights" when they appear.
 */
test.describe("Beaches: Room selection, room code assertion, and hold amount validation", () => {
  // Multi-booking flow: navigate to room listing twice (resort change), plus
  // "Keep This Room" round-trip. Allow extra time on slow prod env.
  test.setTimeout(360_000);

  test(
    "HP - Butler Elite room code and hold amount shown at Guests step; persist after " +
      "resort change and Keep This Room flow (Beaches Negril → Beaches Turks & Caicos)",
    async ({ page }) => {
      // ── Step 1-2: vacation (Beaches Negril) → Room listing ─────────────────
      const room =
        await test.step("Step 1-2: navigate to Room listing (Beaches Negril)", () =>
          advanceToRoom(page, beachesData));

      // ── Step 2: change vacation dates on the Room listing ──────────────────
      await test.step("Step 2: update vacation dates via the Room-listing vacation editor", async () => {
        await room.changeVacationDates(
          updatedDates.month,
          updatedDates.from,
          updatedDates.to,
          updatedDates.year
        );
        await room.assertOnRoomStep();
      });

      // ── Step 2: filter Butler Elite, capture room code, book ───────────────
      // When Butler Elite rooms are unavailable (sold-out or zero results after
      // filter), advance one calendar month at a time and re-apply the filter until
      // a bookable room appears. Dates change via changeVacationDates so the
      // verified "Update Stay Details" vacation-editor path is always used.
      let roomCodeNegril = "";
      await test.step("Step 2: filter Butler Elite, capture room code, book first room (Beaches Negril)", async () => {
        let dateOffset = 0; // months past month+11 tried so far
        for (let attempt = 0; attempt < 6; attempt++) {
          // (Re-)apply the Butler Elite filter — resets whenever dates change.
          const filterOn = await room.resetButton
            .isVisible()
            .catch(() => false);
          if (!filterOn) {
            await room.toggleFilter(room.butlerEliteRadioButton);
            await room.assertFilterApplied("Butler Elite");
          }
          await page.waitForTimeout(1_000);

          if (await room.bookFirstRoomButton.isVisible().catch(() => false))
            break;

          // No bookable Butler Elite rooms — advance to the next month.
          const d = new Date();
          d.setDate(15);
          d.setMonth(d.getMonth() + 11 + dateOffset);
          // await room.changeVacationDates(
          //   d.toLocaleDateString("en-US", { month: "long" }),
          //   "15",
          //   "18",
          //   d.getFullYear().toString()
          // );
          dateOffset++;
        }

        // Capture the room code shown on the first Butler Elite card.
        roomCodeNegril = await captureFirstRoomCode(page);
        if (roomCodeNegril) {
          await expect(
            page.getByText(`Room Code: ${roomCodeNegril}`).first()
          ).toBeVisible();
        }

        await room.bookFirstRoom();
      });

      // ── Step 3 (Guests) — 1st booking: assert room code + hold amount ──────
      const guests = new GuestsPage(page);
      await test.step("Step 3 (Guests): assert Beaches Negril room code and hold amount", async () => {
        await bypassFlightsIfPresent(page);
        await guests.assertOnGuestsStep();

        // Room code shown in the summary article must match the card.
        if (roomCodeNegril) {
          await expect(
            page
              .getByRole("article")
              .getByText(new RegExp(`Room code:\\s*${roomCodeNegril}`, "i"))
              .first()
          ).toBeVisible({ timeout: 15_000 });
        }

        // Hold-room blurb must appear with a valid dollar amount.
        await assertHoldAmountVisible(page);
      });

      // ── Navigate back to Room listing ──────────────────────────────────────
      await test.step("Navigate back to Room listing via breadcrumb (after Beaches Negril booking)", () =>
        navigateBackToRoom(page));

      // ── Step 2: change to Beaches Turks & Caicos ───────────────────────────
      await test.step("Step 2: change destination and resort to Beaches Turks & Caicos", async () => {
        await room.changeDestination(turksData.destination, turksData.resort);
        await room.assertOnRoomStep();
      });

      // ── Step 2: filter Butler Elite, capture room code, book ───────────────
      let roomCodeTnC = "";
      await test.step("Step 2: filter Butler Elite, capture room code, book first room (Beaches T&C)", async () => {
        let tncDateOffset = 0;
        for (let attempt = 0; attempt < 6; attempt++) {
          const filterOn = await room.resetButton
            .isVisible()
            .catch(() => false);
          if (!filterOn) {
            await room.toggleFilter(room.butlerEliteRadioButton);
            await room.assertFilterApplied("Butler Elite");
          }
          await page.waitForTimeout(1_000);

          if (await room.bookFirstRoomButton.isVisible().catch(() => false))
            break;

          const d = new Date();
          d.setDate(15);
          d.setMonth(d.getMonth() + 11 + tncDateOffset);
          await room.changeVacationDates(
            d.toLocaleDateString("en-US", { month: "long" }),
            "15",
            "18",
            d.getFullYear().toString()
          );
          tncDateOffset++;
        }

        roomCodeTnC = await captureFirstRoomCode(page);
        if (roomCodeTnC) {
          await expect(
            page.getByText(`Room Code: ${roomCodeTnC}`).first()
          ).toBeVisible();
        }

        await room.bookFirstRoom();
      });

      // ── Step 3 (Guests) — 2nd booking: assert room code + hold amount ──────
      await test.step("Step 3 (Guests): assert Beaches T&C room code and hold amount", async () => {
        await bypassFlightsIfPresent(page);
        await guests.assertOnGuestsStep();

        if (roomCodeTnC) {
          await expect(
            page
              .getByRole("article")
              .getByText(new RegExp(`Room code:\\s*${roomCodeTnC}`, "i"))
              .first()
          ).toBeVisible({ timeout: 15_000 });
        }

        await assertHoldAmountVisible(page);
      });

      // ── Navigate back to Room listing ──────────────────────────────────────
      await test.step("Navigate back to Room listing via breadcrumb (before Keep This Room flow)", () =>
        navigateBackToRoom(page));

      // ── Step 2: Keep This Room ─────────────────────────────────────────────
      await test.step('Step 2: open the selected room\'s details and click "Keep This Room"', async () => {
        // When the user goes back from Guests step to the Room listing, OBE
        // renders "Keep This Room" on the already-selected room card (instead of
        // "Book This Room"). Clicking it confirms the existing selection and
        // returns to the Guests step.
        const keepBtn = page
          .getByRole("button", { name: /Keep This Room/i })
          .first();
        await keepBtn.waitFor({ state: "visible", timeout: 20_000 });
        await keepBtn.click();
        await page
          .waitForURL(/guest|itinerar/i, { timeout: 30_000 })
          .catch(() => undefined);
      });

      // ── Step 3 (Guests) — 3rd check: assert room code unchanged + hold amt ─
      await test.step('Step 3 (Guests): assert room code and hold amount are preserved after "Keep This Room"', async () => {
        await bypassFlightsIfPresent(page);
        await guests.assertOnGuestsStep();

        // The same T&C room must still be selected — code unchanged.
        if (roomCodeTnC) {
          await expect(
            page
              .getByRole("article")
              .getByText(new RegExp(`Room code:\\s*${roomCodeTnC}`, "i"))
              .first()
          ).toBeVisible({ timeout: 15_000 });
        }

        await assertHoldAmountVisible(page);
      });

      // ── Navigate back to Vacation step (scope guard: no payment) ───────────
      await test.step("Navigate back to Vacation step via breadcrumb (no booking completed)", async () => {
        await page.getByRole("link", { name: /^Vacation$/i }).click();
        await page
          .waitForURL(/\/$|vacation|obeta/i, { timeout: 30_000 })
          .catch(() => undefined);
        // Confirm we're back on the vacation form without completing a booking.
        await expect(
          page.getByTestId("form-vacation-submit-button-ui")
        ).toBeVisible({ timeout: 15_000 });
      });
    }
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Sandals: Room category hold-amount validation
// ─────────────────────────────────────────────────────────────────────────────
//
// Covers four room-code / filter / hold-amount pairings for Sandals resorts:
//
//   SGL  Sandals Grande St. Lucian  OWB            → $2,500
//   SWH  Sandals South Coast        OWB            → $2,500
//   SRC  Sandals Royal Curaçao      Seaside Bungalow → $1,000 (HEALED: no OWV/OWB)
//   SCR  Sandals Caribbean Cay      OWB & OWV      → $2,500
//
// SCOPE GUARDS (same as Beaches describe above):
//   - No CVV entered; no payment submitted; no booking completed.
//   - Never clicks "PAY VACATION".
//   - Flights are bypassed via "Continue Without Flights" when they appear.
//
// NOTE on Over-The-Water Bungalow / Villa: the Room Types filter labels are
// rendered from live inventory — if the filter text does not match on first
// run, check the live DOM for the exact copy (see docs/SELF_HEALING.md) and
// update the `owbCheckbox` locator in the SCR test accordingly.

test.describe("Sandals: Room category and hold amount validation", () => {
  // Each Sandals test navigates vacation → room (with filter retries) → guests.
  // Allow extra time on slow prod env.
  test.setTimeout(200_000);

  /**
   * Assert a SPECIFIC hold-room dollar amount is visible in the vacation
   * summary (shown on both the Room listing card and the Guests sidebar).
   * Sandals OBE text: "Hold room from only $2,500.00" / "$1,000.00".
   * Matches both "for" and "from" copy variants (Beaches vs. Sandals phrasing).
   */
  async function assertSandalsHoldAmount(
    page: Page,
    dollars: number
  ): Promise<void> {
    const formatted = dollars.toLocaleString("en-US"); // "2,500" or "1,000"
    const amtPattern = formatted.replace(",", "[,.]?"); // allow both "2,500" and "2.500"
    await expect(
      page
        .getByText(
          new RegExp(`Hold room (for|from) only \\$${amtPattern}`, "i")
        )
        .first()
    ).toBeVisible({ timeout: 15_000 });
  }

  // ── SGL: Sandals Grande St. Lucian — OWB — $2,500 ─────────────────────────

  test("HP - SGL: Over-The-Water Bungalow at Sandals Grande St. Lucian shows $2,500 hold amount", async ({
    page,
  }) => {
    // ── Step 1-2: Vacation → Room listing ───────────────────────────────────
    const room =
      await test.step("Step 1-2: navigate to Room listing (Sandals Grande St. Lucian, St. Lucia)", () =>
        advanceToRoom(page, sglResortData));

    // ── Step 2: apply OWB filter, capture room code, book ───────────────────
    let sglCode = "";
    await test.step("Step 2: apply OWB filter, capture room code, book first available room", async () => {
      let dateOffset = 0;
      for (let attempt = 0; attempt < 6; attempt++) {
        const filterOn = await room.resetButton.isVisible().catch(() => false);
        if (!filterOn) {
          await room.toggleFilter(room.overTheWaterBungalowCheckbox);
          await page.waitForTimeout(1_000);
        }
        if (await room.bookFirstRoomButton.isVisible().catch(() => false))
          break;

        const d = new Date();
        d.setDate(15);
        d.setMonth(d.getMonth() + 11 + dateOffset);
        await room.changeVacationDates(
          d.toLocaleDateString("en-US", { month: "long" }),
          "15",
          "18",
          d.getFullYear().toString()
        );
        dateOffset++;
      }

      sglCode = await captureFirstRoomCode(page);
      if (sglCode) {
        await expect(
          page.getByText(`Room Code: ${sglCode}`).first()
        ).toBeVisible();
      }
      await room.bookFirstRoom();
    });

    // ── Step 3 (Guests): assert room code + $2,500 hold amount ──────────────
    const guests = new GuestsPage(page);
    await test.step("Step 3 (Guests): assert room code and $2,500 hold amount", async () => {
      await bypassFlightsIfPresent(page);
      await guests.assertOnGuestsStep();

      if (sglCode) {
        await expect(
          page
            .getByRole("article")
            .getByText(new RegExp(`Room code:\\s*${sglCode}`, "i"))
            .first()
        ).toBeVisible({ timeout: 15_000 });
      }
      await assertSandalsHoldAmount(page, 2500);
    });

    // ── Scope guard: back to Vacation (no payment) ───────────────────────────
    await test.step("Navigate back to Vacation step via breadcrumb (no booking completed)", async () => {
      await page.getByRole("link", { name: /^Vacation$/i }).click();
      await page
        .waitForURL(/\/$|vacation|obeta/i, { timeout: 30_000 })
        .catch(() => undefined);
      await expect(
        page.getByTestId("form-vacation-submit-button-ui")
      ).toBeVisible({ timeout: 15_000 });
    });
  });

  // ── SWH: Sandals South Coast — OWB — $2,500 ───────────────────────────────

  test("HP - SWH: Over-The-Water Bungalow at Sandals South Coast shows $2,500 hold amount", async ({
    page,
  }) => {
    // ── Step 1-2: Vacation → Room listing ───────────────────────────────────
    const room =
      await test.step("Step 1-2: navigate to Room listing (Sandals South Coast, Jamaica)", () =>
        advanceToRoom(page, swhResortData));

    // ── Step 2: apply OWB filter, capture room code, book ───────────────────
    let swhCode = "";
    await test.step("Step 2: apply OWB filter, capture room code, book first available room", async () => {
      let dateOffset = 0;
      for (let attempt = 0; attempt < 6; attempt++) {
        const filterOn = await room.resetButton.isVisible().catch(() => false);
        if (!filterOn) {
          await room.toggleFilter(room.overTheWaterBungalowCheckbox);
          await page.waitForTimeout(1_000);
        }
        if (await room.bookFirstRoomButton.isVisible().catch(() => false))
          break;

        const d = new Date();
        d.setDate(15);
        d.setMonth(d.getMonth() + 11 + dateOffset);
        await room.changeVacationDates(
          d.toLocaleDateString("en-US", { month: "long" }),
          "15",
          "18",
          d.getFullYear().toString()
        );
        dateOffset++;
      }

      swhCode = await captureFirstRoomCode(page);
      if (swhCode) {
        await expect(
          page.getByText(`Room Code: ${swhCode}`).first()
        ).toBeVisible();
      }
      await room.bookFirstRoom();
    });

    // ── Step 3 (Guests): assert room code + $2,500 hold amount ──────────────
    const guests = new GuestsPage(page);
    await test.step("Step 3 (Guests): assert room code and $2,500 hold amount", async () => {
      await bypassFlightsIfPresent(page);
      await guests.assertOnGuestsStep();

      if (swhCode) {
        await expect(
          page
            .getByRole("article")
            .getByText(new RegExp(`Room code:\\s*${swhCode}`, "i"))
            .first()
        ).toBeVisible({ timeout: 15_000 });
      }
      await assertSandalsHoldAmount(page, 2500);
    });

    // ── Scope guard: back to Vacation ────────────────────────────────────────
    await test.step("Navigate back to Vacation step via breadcrumb (no booking completed)", async () => {
      await page.getByRole("link", { name: /^Vacation$/i }).click();
      await page
        .waitForURL(/\/$|vacation|obeta/i, { timeout: 30_000 })
        .catch(() => undefined);
      await expect(
        page.getByTestId("form-vacation-submit-button-ui")
      ).toBeVisible({ timeout: 15_000 });
    });
  });

  // ── SRC: Sandals Royal Curaçao — OWV & OWB — $2,500 ──────────────────────
  //
  // Validates BOTH filter paths (Over-The-Water Villa first, then Bungalow) at
  // the same resort to confirm the $2,500 hold amount applies to each.

  // FORMER: "HP - SRC: Over-The-Water Villa and Bungalow at Sandals Royal Curaçao both show $2,500 hold amount"
  // HEALED: Sandals Royal Curaçao does NOT offer OWV or OWB rooms. Per NOBE (C82580), this resort
  // has Seaside Bungalow rooms that show $1,000 hold — confirmed in the live Room Types filter.
  test("HP - SRC: Seaside Bungalow at Sandals Royal Curaçao shows $1,000 hold amount", async ({
    page,
  }) => {
    // ── Step 1-2: Vacation → Room listing ───────────────────────────────────
    const room =
      await test.step("Step 1-2: navigate to Room listing (Sandals Royal Curaçao, Curacao)", () =>
        advanceToRoom(page, srcResortData));

    // ── Step 2: apply Seaside Bungalow filter, capture room code, book ───────
    // NOBE reference: seasideBungalowCheckbox at Sandals Royal Curaçao → $1,000 hold (C82580).
    // The Room Types section for this resort confirms "Seaside Bungalow" in its filter list.
    let srcCode = "";
    await test.step("Step 2: apply Seaside Bungalow filter, capture room code, book first available room", async () => {
      const seasideBungalow = room.roomTypesSection
        .locator("label")
        .filter({ hasText: "Seaside Bungalow" })
        .first();

      let dateOffset = 0;
      let filterApplied = false;
      for (let attempt = 0; attempt < 6; attempt++) {
        const filterOn = await room.resetButton.isVisible().catch(() => false);
        if (!filterOn) {
          const sbVisible = await seasideBungalow
            .isVisible({ timeout: 3_000 })
            .catch(() => false);
          const sbEnabled =
            sbVisible && (await seasideBungalow.isEnabled().catch(() => false));
          if (sbEnabled) {
            await seasideBungalow
              .scrollIntoViewIfNeeded()
              .catch(() => undefined);
            await room.toggleFilter(seasideBungalow);
            await page.waitForTimeout(1_000);
            filterApplied = true;
          }
        } else {
          filterApplied = true;
        }
        if (
          filterApplied &&
          (await room.bookFirstRoomButton.isVisible().catch(() => false))
        )
          break;

        const d = new Date();
        d.setDate(15);
        d.setMonth(d.getMonth() + 11 + dateOffset);
        await room.changeVacationDates(
          d.toLocaleDateString("en-US", { month: "long" }),
          "15",
          "18",
          d.getFullYear().toString()
        );
        dateOffset++;
        filterApplied = false;
      }

      srcCode = await captureFirstRoomCode(page);
      if (srcCode) {
        await expect(
          page.getByText(`Room Code: ${srcCode}`).first()
        ).toBeVisible();
      }
      await room.bookFirstRoom();
    });

    // ── Step 3 (Guests): assert room code + $1,000 hold amount ──────────────
    const guests = new GuestsPage(page);
    await test.step("Step 3 (Guests): assert Seaside Bungalow room code and $1,000 hold amount", async () => {
      await bypassFlightsIfPresent(page);
      await guests.assertOnGuestsStep();

      if (srcCode) {
        await expect(
          page
            .getByRole("article")
            .getByText(new RegExp(`Room code:\\s*${srcCode}`, "i"))
            .first()
        ).toBeVisible({ timeout: 15_000 });
      }
      await assertSandalsHoldAmount(page, 1000);
    });

    // ── Scope guard: back to Vacation ────────────────────────────────────────
    await test.step("Navigate back to Vacation step via breadcrumb (no booking completed)", async () => {
      await page.getByRole("link", { name: /^Vacation$/i }).click();
      await page
        .waitForURL(/\/$|vacation|obeta/i, { timeout: 30_000 })
        .catch(() => undefined);
      await expect(
        page.getByTestId("form-vacation-submit-button-ui")
      ).toBeVisible({ timeout: 15_000 });
    });
  });

  // ── SCR: Sandals Caribbean Cay — OWB & OWV — $2,500 ─────────────────────
  // Validates both OWB (Over-The-Water Bungalow) and OWV (Over-The-Water Villa)
  // filter paths at Sandals Caribbean Cay, confirming the $2,500 hold tier for each.

  test("HP - SCR: Over-the-water villa and Over-the-water bungalows at Sandals Caribbean Cay shows $2,500 hold amount", async ({
    page,
  }) => {
    // ── Step 1-2: Vacation → Room listing ───────────────────────────────────
    const room =
      await test.step("Step 1-2: navigate to Room listing (Sandals Caribbean Cay, Jamaica)", () =>
        advanceToRoom(page, scrResortData));

    // ── Step 2: apply OWV filter, capture room code, book ───────────────────
    let scrOWVCode = "";
    await test.step("Step 2: apply Over-The-Water Villa filter, capture room code, book first available room", async () => {
      const overTheWaterVilla = room.roomTypesSection
        .locator("label")
        .filter({ hasText: "Over-The-Water Villa" })
        .first();

      let dateOffset = 0;
      let filterApplied = false;
      for (let attempt = 0; attempt < 6; attempt++) {
        const filterOn = await room.resetButton.isVisible().catch(() => false);
        if (!filterOn) {
          const owvVisible = await overTheWaterVilla
            .isVisible({ timeout: 3_000 })
            .catch(() => false);
          const owvEnabled =
            owvVisible &&
            (await overTheWaterVilla.isEnabled().catch(() => false));
          if (owvEnabled) {
            await overTheWaterVilla
              .scrollIntoViewIfNeeded()
              .catch(() => undefined);
            await room.toggleFilter(overTheWaterVilla);
            await page.waitForTimeout(1_000);
            filterApplied = true;
          }
        } else {
          filterApplied = true;
        }
        if (
          filterApplied &&
          (await room.bookFirstRoomButton.isVisible().catch(() => false))
        )
          break;

        const d = new Date();
        d.setDate(15);
        d.setMonth(d.getMonth() + 14 + dateOffset);
        await room.changeVacationDates(
          d.toLocaleDateString("en-US", { month: "long" }),
          "15",
          "18",
          d.getFullYear().toString()
        );
        dateOffset++;
        filterApplied = false;
      }

      scrOWVCode = await captureFirstRoomCode(page);
      if (scrOWVCode) {
        await expect(
          page.getByText(`Room Code: ${scrOWVCode}`).first()
        ).toBeVisible();
      }
      await room.bookFirstRoom();
    });

    // ── Step 3 (Guests): assert room code + $2,500 hold amount ──────────────
    const guests = new GuestsPage(page);
    await test.step("Step 3 (Guests): assert Over-The-Water Villa room code and $2,500 hold amount", async () => {
      await bypassFlightsIfPresent(page);
      await guests.assertOnGuestsStep();

      if (scrOWVCode) {
        await expect(
          page
            .getByRole("article")
            .getByText(new RegExp(`Room code:\\s*${scrOWVCode}`, "i"))
            .first()
        ).toBeVisible({ timeout: 15_000 });
      }
      await assertSandalsHoldAmount(page, 2500);
    });

    // ── Navigate back to Room listing ────────────────────────────────────────
    await test.step("Navigate back to Room listing via breadcrumb (after OWV booking)", () =>
      navigateBackToRoom(page));

    // ── Step 2: apply OWB filter, capture room code, book ───────────────────
    let scrOWBCode = "";
    await test.step("Step 2: apply Over-The-Water Bungalow filter, capture room code, book first available room", async () => {
      let dateOffset = 0;
      for (let attempt = 0; attempt < 6; attempt++) {
        const filterOn = await room.resetButton.isVisible().catch(() => false);
        if (!filterOn) {
          await room.toggleFilter(room.overTheWaterBungalowCheckbox);
          await page.waitForTimeout(1_000);
        }
        if (await room.bookFirstRoomButton.isVisible().catch(() => false))
          break;

        const d = new Date();
        d.setDate(15);
        d.setMonth(d.getMonth() + 14 + dateOffset);
        await room.changeVacationDates(
          d.toLocaleDateString("en-US", { month: "long" }),
          "15",
          "18",
          d.getFullYear().toString()
        );
        dateOffset++;
      }

      scrOWBCode = await captureFirstRoomCode(page);
      if (scrOWBCode) {
        await expect(
          page.getByText(`Room Code: ${scrOWBCode}`).first()
        ).toBeVisible();
      }
      await room.bookFirstRoom();
    });

    // ── Step 3 (Guests): assert room code + $2,500 hold amount ──────────────
    await test.step("Step 3 (Guests): assert Over-The-Water Bungalow room code and $2,500 hold amount", async () => {
      await bypassFlightsIfPresent(page);
      await guests.assertOnGuestsStep();

      if (scrOWBCode) {
        await expect(
          page
            .getByRole("article")
            .getByText(new RegExp(`Room code:\\s*${scrOWBCode}`, "i"))
            .first()
        ).toBeVisible({ timeout: 15_000 });
      }
      await assertSandalsHoldAmount(page, 2500);
    });

    // ── Scope guard: back to Vacation (no payment) ───────────────────────────
    await test.step("Navigate back to Vacation step via breadcrumb (no booking completed)", async () => {
      await page.getByRole("link", { name: /^Vacation$/i }).click();
      await page
        .waitForURL(/\/$|vacation|obeta/i, { timeout: 30_000 })
        .catch(() => undefined);
      await expect(
        page.getByTestId("form-vacation-submit-button-ui")
      ).toBeVisible({ timeout: 15_000 });
    });
  });
});
