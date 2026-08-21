import BasePage from "./BasePage";
import { selectDatesFindAvailability } from "../utils/selectDatesFindAvailability";
import { expect, Locator, Page } from "@playwright/test";

/**
 * Step 2b – Room Details page for the OBETANG agent booking engine
 * (URL `/room-details/`). Reached from the Room listing via "View Room Details"
 * (`RoomPage.openFirstRoomDetails()`). Shows the selected room's view, the stay
 * summary (nights / guests), and lets the user change dates before continuing.
 *
 * SELECTOR PROVENANCE
 * -------------------
 * `[OBE-NG]` – ported from
 *   `obe-e2e-nextgen-master/page-object/sandals/RoomDetailsPage.ts`, verified
 *   against the consumer Sandals OBE (same OBE codebase as OBETA). Confirm on
 *   the agent DOM on first run (docs/SELF_HEALING.md).
 *
 * Scope: Steps 1–4 only. Continuing from here advances the funnel but this page
 * object never books a room or reaches Payment (see CLAUDE.md).
 */
export class RoomDetailsPage extends BasePage {
  readonly path = "/room-details/";

  readonly roomViewText: Locator; // [OBE-NG] "Room View:"
  readonly continueButton: Locator; // [OBE-NG] form-vacation-submit-button-ui
  readonly datePicker: Locator; // [OBE-NG] select-dates-ui > button-ui
  readonly resortName: Locator; // [OBE-NG] first paragraph
  readonly closeButton: Locator; // [OBE-NG] "Close Popup"
  readonly numNights: Locator; // [OBE-NG] "for N nights"
  readonly numGuests: Locator; // [OBE-NG] price-total-price-pppn

  constructor(page: Page) {
    super(page);
    super.setPath(this.path);

    this.roomViewText = page.getByText("Room View:");
    this.continueButton = page.getByTestId("form-vacation-submit-button-ui");
    // FORMER: page.getByTestId("select-dates-ui").getByTestId("button-ui") — resolves to
    // 2 elements on staging (one "Vacation Dates" filled picker + one "Select dates" empty
    // picker). The empty picker's aria-label is confirmed as "Select dates" from the error.
    this.datePicker = page.getByRole("button", { name: "Select dates" });
    this.resortName = page.getByRole("paragraph").first();
    this.closeButton = page.getByRole("button", { name: /Close Popup/i });
    this.numNights = page.getByText(/for \d+ nights/i);
    this.numGuests = page.getByTestId("price-total-price-pppn");
  }

  /** [OBE-NG] Confirm the room-details surface rendered. */
  async assertOnRoomDetails() {
    await expect(this.roomViewText.or(this.numGuests).first()).toBeVisible();
  }

  /** [OBE-NG] Open the date-range calendar popover. */
  async openDatePicker() {
    await this.datePicker.scrollIntoViewIfNeeded();
    // The recorded flow double-clicks the trigger to reliably open the popover.
    await this.datePicker.click();
    // await this.datePicker.click();
  }

  /**
   * [OBE-NG] Change the stay to a new available range: advance the calendar by
   * `advanceMonths` and select a `days`-day span from the first open date.
   * Opens the picker first if it is not already showing.
   */
  async selectDates(advanceMonths: number, days: number) {
    await selectDatesFindAvailability(advanceMonths, days, this.page);
  }

  /** [OBE-NG] The "for N nights" summary text. */
  async nightsText(): Promise<string> {
    return (await this.numNights.textContent())?.trim() ?? "";
  }

  /** [OBE-NG] The guests/price summary text (e.g. "2 adults ..."). */
  async guestsText(): Promise<string> {
    await this.numGuests.scrollIntoViewIfNeeded();
    return (await this.numGuests.textContent())?.trim() ?? "";
  }
}
