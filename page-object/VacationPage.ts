import BasePage from "./BasePage";
import { VacationData } from "../test-data/types";
import { Locator, Page, expect } from "@playwright/test";

/**
 * Step 1 – Vacation page object for the OBETANG agent booking engine.
 *
 * SELECTOR PROVENANCE
 * -------------------
 * OBETANG runs the same OBE codebase as NOBE, so selectors marked `[NOBE]`
 * below are carried over from the verified NOBE page objects and are expected
 * to work as-is. Selectors marked `[OBETA-TODO]` cover OBETA-only surfaces
 * (Booking/Quote toggle, SSG lookup modal, Adjoining Rooms modal, First-Class
 * cabin picker) whose DOM has NOT yet been verified against obetang-dev — they
 * are best-effort guesses following the app's `*-ui` testid convention and MUST
 * be confirmed on the live DOM (Phase 1 of the strategy).
 */
export class VacationPage extends BasePage {
  readonly path = "/";

  // --- Booking mode tabs (Make a Booking vs Send Quote) ---
  readonly makeABookingTab: Locator; // [OBETA-TODO]
  readonly sendQuoteTab: Locator; // [OBETA-TODO]

  // --- Core booking inputs ---
  readonly selectDestination: Locator; // [NOBE]
  readonly selectResort: Locator; // [NOBE]
  readonly selectDates: Locator; // [NOBE]
  readonly clearDatesButton: Locator; // [OBETA-TODO]
  readonly selectGuests: Locator; // [NOBE]
  readonly guestsUpdateButton: Locator; // [verified]
  readonly continueButton: Locator; // [NOBE]

  // --- Flights add-on ---
  readonly addFlightsCheckbox: Locator; // [OBETA-TODO]
  readonly flightsSection: Locator; // [OBETA-TODO]
  readonly flightsDepartingFrom: Locator; // [NOBE]
  readonly searchFlightsBy: Locator; // [OBETA-TODO]
  readonly quoteAirfareNote: Locator; // [OBETA-TODO] – Send Quote no-airfare note

  // --- SSG (Sandals Select Rewards) lookup ---
  readonly ssgNumberInput: Locator; // [OBETA-TODO]
  readonly lookItUpCta: Locator; // [OBETA-TODO]
  readonly ssgModal: Locator; // [OBETA-TODO]
  readonly ssgEmailInput: Locator; // [OBETA-TODO]
  readonly ssgSearchButton: Locator; // [OBETA-TODO]
  readonly ssgStartNewSearchButton: Locator; // [OBETA-TODO]
  readonly ssgError: Locator; // [OBETA-TODO]
  readonly ssgAccountResult: Locator; // [OBETA-TODO]

  // --- Adjoining rooms ---
  readonly adjoiningRoomsCheckbox: Locator; // [OBETA-TODO]
  readonly adjoiningRoomsInfoIcon: Locator; // [OBETA-TODO]
  readonly adjoiningRoomsModal: Locator; // [OBETA-TODO]
  readonly adjoiningRoomsModalTextContent: Locator; // [OBETA-TODO]
  readonly closeModal: Locator; // [OBETA-TODO]

  // --- Errors / messages ---
  readonly resortError: Locator; // [NOBE]
  readonly datesError: Locator; // [NOBE]
  readonly guestsError: Locator; // [OBETA-TODO]
  readonly flightsDepartingFromError: Locator; // [NOBE]
  readonly minStayMessage: Locator; // [NOBE]

  // --- Footer / informational links ([OBETA-TODO] — ported from nextgen; the
  //     agent OBE footer may differ from the consumer site, verify on first run) ---
  readonly callUsLink: Locator; // [OBETA-TODO]
  readonly termsAndConditionsLink: Locator; // [OBETA-TODO]
  readonly privacyPolicyLink: Locator; // [OBETA-TODO]
  readonly cookiePreferencesLink: Locator; // [OBETA-TODO]
  readonly bestPriceGuaranteeLink: Locator; // [OBETA-TODO]
  readonly bestPriceGuaranteeModal: Locator; // [OBETA-TODO]
  readonly whyBookFlightsWithUsLink: Locator; // [OBETA-TODO]
  readonly flightsLinkPopup: Locator; // [OBETA-TODO]

  // --- Static option lists (for dropdown validation) ---
  readonly destinations: string[];
  readonly clientLastName: Locator; // [OBETA-TODO]
  readonly clientEmail: Locator; // [OBETA-TODO] – Send Quote recipient email

  // Tracks the resort chosen via chooseResort(); used to gate Beaches-only
  // features such as Adjoining Rooms. Empty until a resort is selected.
  private selectedResort = "";

  constructor(page: Page) {
    super(page);
    super.setPath(this.path);

    // Booking mode tabs. [verified] Both are segmented-control tabs with stable
    // testids (tabs-booking-ui / tabs-quote-ui).
    this.makeABookingTab = page.getByTestId("tabs-booking-ui");
    // FORMER: page.getByText('SEND QUOTE')
    this.sendQuoteTab = page.getByTestId("tabs-quote-ui");

    // Core inputs (nested testid pattern, e.g. select-resort-ui > button-ui).
    this.selectDestination = page
      .getByTestId("select-destination-ui")
      .getByTestId("button-ui");
    this.selectResort = page
      .getByTestId("select-resort-ui")
      .getByTestId("button-ui");
    // Verified: the dates trigger is a role=button labelled "Vacation Dates"
    // (before a range is committed); after selection its name becomes the range.
    this.selectDates = page.getByRole("button", { name: /Vacation Dates/i });
    this.clearDatesButton = page.getByRole("button", { name: /Clear Dates/i });
    this.selectGuests = page
      .getByTestId("select-guests-ui")
      .getByTestId("button-ui");
    // Guests popover commits with an "Update" button (not Escape). [verified]
    this.guestsUpdateButton = page.getByRole("button", {
      name: "Update",
      exact: true,
    });
    this.continueButton = page.getByTestId("form-vacation-submit-button-ui");

    // Flights. [verified] The "Add Flights" toggle is a <label>; the cabin-class
    // trigger is a role=button whose name reflects the current class (default
    // "Economy/Coach").
    this.addFlightsCheckbox = page.getByLabel("Add Flights").nth(1);
    this.flightsSection = page.getByTestId("flights-section-ui");
    this.flightsDepartingFrom = page.getByRole("combobox", {
      name: "Flights departing from",
    });
    this.searchFlightsBy = page.getByRole("button", {
      name: /Economy\/Coach/i,
    });
    // [OBETA-TODO] Send Quote has NO flight functionality — in place of the
    // "Add Flights" add-on the app shows an informational note ("…we are unable
    // to include airfare in quotes.", see CLAUDE.md). Matched on the distinctive
    // copy; verify against the live DOM (docs/SELF_HEALING.md).
    this.quoteAirfareNote = page.getByText(
      /unable to include airfare in quotes/i
    );
    this.clientLastName = page.getByRole("textbox", {
      name: "Client's Last Name Client's",
    });
    // [OBETA-TODO] In Send Quote mode the agent enters the client's email so the
    // quote is delivered there. Copy/testid unverified — match the likely label
    // (see docs/SELF_HEALING.md).
    this.clientEmail = page.getByRole("textbox", {
      name: /Client'?s Email/i,
    });

    // Footer / informational links. [OBETA-TODO]
    this.callUsLink = page.getByRole("link", {
      name: /Call Us|SANDALS|\d-888/i,
    });
    this.termsAndConditionsLink = page.getByRole("link", {
      name: /Terms (&|and) Conditions/i,
    });
    this.privacyPolicyLink = page.getByRole("link", {
      name: /Privacy Policy/i,
    });
    this.cookiePreferencesLink = page.getByRole("link", {
      name: /Cookie Preferences/i,
    });
    this.bestPriceGuaranteeLink = page.getByRole("link", {
      name: /Best Price Guarantee/i,
    });
    this.bestPriceGuaranteeModal = page
      .getByTestId("dialog-ui")
      .or(page.getByRole("dialog"))
      .filter({ hasText: /Best Price Guarantee/i });
    this.whyBookFlightsWithUsLink = page.getByRole("link", {
      name: /Why Book Flights With Us|Booking Flights with Sandals/i,
    });
    this.flightsLinkPopup = page
      .getByTestId("dialog-ui")
      .or(page.getByRole("dialog"))
      .filter({ hasText: /Booking Flights with Sandals/i });

    // SSG lookup.
    // FORMER: page.getByTestId("input-ssg-number-ui") — testid absent in live DOM;
    // the main-form SSG textbox carries testid "textbox-ui" (confirmed from codegen).
    this.ssgNumberInput = page.getByTestId("textbox-ui");
    this.lookItUpCta = page.getByRole("button", { name: "Look it up" });
    this.ssgModal = page.getByTestId("dialog-ui");
    this.ssgEmailInput = page.getByRole("textbox", {
      name: "Email Address Email Address",
    });
    this.ssgSearchButton = page.getByRole("button", { name: "SEARCH" });
    // FORMER: page.getByRole("button", { name: /Start a New Search/i })
    // Live DOM renders "Start a new search" as a generic clickable div.
    this.ssgStartNewSearchButton = page.getByText("Start a new search");
    // FORMER: page.getByTestId("ssg-lookup-error-ui")
    // [verified against live modal] When a lookup runs (Last Name present) and
    // finds no account, the modal renders an error banner testid "error-ui"
    // ("Can't find Island Insiders Club"). Blank / missing-field submissions
    // instead flip the fields to aria-invalid=true with no banner, so treat an
    // invalid Last Name / Email field as the error signal too.
    this.ssgError = page
      .getByTestId("dialog-ui")
      .getByTestId("error-ui")
      .or(
        page.locator(
          '[name="ssgEmail"][aria-invalid="true"], [name="ssgLastName"][aria-invalid="true"]'
        )
      );
    // FORMER: page.getByTestId("ssg-account-result-ui") — testid absent in live DOM.
    // A successful lookup renders "COPY THIS NUMBER" in the result card; this is
    // the visible indicator that an account was found.
    this.ssgAccountResult = page.getByText("COPY THIS NUMBER");

    // Adjoining rooms. [verified] The opt-in control is a <label> containing
    // "I would like to request adjoining rooms".
    this.adjoiningRoomsCheckbox = page
      .locator("label")
      .filter({ hasText: /I would like to request/i });
    this.adjoiningRoomsInfoIcon = page.locator(".order-6 > div:nth-child(2)");
    this.adjoiningRoomsModal = page.getByText("Request Adjoining Rooms?");
    this.adjoiningRoomsModalTextContent = page.locator(
      ".order-6 > div:nth-child(2)"
    );
    this.closeModal = page.getByRole("button", { name: "Close Popup" });

    // Errors / messages.
    this.resortError = page.getByTestId("select-resort-error-ui");
    this.datesError = page.getByTestId("select-dates-error-ui");
    this.guestsError = page.getByTestId("select-guests-error-ui");
    this.flightsDepartingFromError = page.getByTestId(
      "combobox-gateway-error-ui"
    );
    // The 3-night min-stay message renders as a hidden tooltip on EVERY
    // short-stay day cell; only the one under the hovered cell becomes visible.
    // Matching `.first()` picked a hidden instance, so filter to the visible
    // tooltip.
    // FORMER: page.getByText(/3.?night.*[Mm]inimum [Ss]tay/).first();
    this.minStayMessage = page
      .getByText(/3.?night.*[Mm]inimum [Ss]tay/)
      .filter({ visible: true })
      .first();
    this.destinations = [
      "Barbados",
      "Jamaica",
      "Bahamas",
      "Antigua",
      "St. Lucia",
      "Grenada",
      "Curaçao",
      "St. Vincent",
      "Turks & Caicos",
    ];
  }

  /* ---------------------------------------------------------------- */
  /* Booking mode                                                      */
  /* ---------------------------------------------------------------- */

  async selectSendQuote() {
    await this.clickWhenReady(this.sendQuoteTab);
    // The tab click is async — the panel swaps from BOOK NOW to SEND QUOTE a
    // beat later. Wait for the quote tab to actually become selected so callers
    // don't race the still-mounted BOOK NOW panel (a real flakiness source: an
    // early assertion otherwise sees the Book Now "Add Flights" add-on).
    await expect(
      this.page.getByRole("tab", { name: /SEND QUOTE/i })
    ).toHaveAttribute("aria-selected", "true");
  }

  /**
   * Enforce the CLAUDE.md rule that the Send Quote tab contains **no** flight
   * functionality: in place of the "Add Flights" add-on the app shows the
   * airfare note ("…we are unable to include airfare in quotes."). Call after
   * selectSendQuote(). Guards against a regression that re-introduces flight
   * controls into the quote flow.
   */
  async assertQuoteHasNoFlights() {
    await expect(this.quoteAirfareNote).toBeVisible();
    await expect(this.addFlightsCheckbox).toBeHidden();
  }

  /**
   * [OBETA-TODO] Enter the client's email in Send Quote mode — the address the
   * quote will be sent to. No-op-safe: if the field isn't rendered in the
   * current build it is skipped so the quote can still be sent from the review
   * step. Verify the field on the live DOM (see docs/SELF_HEALING.md).
   */
  async enterClientEmail(email: string) {
    if (await this.clientEmail.isVisible().catch(() => false)) {
      await this.fillSafe(this.clientEmail, email);
    }
  }

  async selectMakeABooking() {
    await this.clickWhenReady(this.makeABookingTab);
  }

  /* ---------------------------------------------------------------- */
  /* Core booking inputs                                               */
  /* ---------------------------------------------------------------- */

  async chooseDestination(destination: string) {
    await this.selectDestination.click();
    await this.page
      .getByRole("option", { name: destination, exact: true })
      .click();
  }

  async chooseResort(resort: string) {
    await this.selectResort.click();
    // [verified] Resort options render inside the listbox and are matched by
    // text (the resort dropdown does not expose role=option like Destination).
    await this.page.getByTestId("listbox-ui").getByText(resort).click();
    this.selectedResort = resort;
  }

  /** The resort currently selected via chooseResort ("" if none yet). */
  get currentResort(): string {
    return this.selectedResort;
  }

  /**
   * Adjoining Rooms is a **Beaches-only** feature — the controls only render
   * when the chosen resort is a Beaches property. Returns true when `resort`
   * (defaults to the resort selected via chooseResort) starts with "Beaches".
   */
  isBeachesResort(resort: string = this.selectedResort): boolean {
    return resort.trim().toLowerCase().startsWith("beaches");
  }

  /**
   * Verify every expected destination is offered in the Destination dropdown.
   * Assumes the dropdown is already open.
   */
  async checkAllDestinations() {
    for (const destination of this.destinations) {
      const isVisible = await this.page
        .getByTestId("listbox-ui")
        .getByRole("option", { name: destination, exact: true })
        .isVisible();
      expect(
        isVisible,
        `Destination "${destination}" is not visible.`
      ).toBeTruthy();
    }
  }

  async clickNextButton() {
    await this.page.getByRole("button", { name: "Next" }).click();
  }

  /**
   * A datepicker day cell. [verified] Each day is a role=button whose accessible
   * name is the full date, e.g. "Wednesday, December 15, 2027". Matching on
   * "<Month> <day>," (plus the year when known) keeps day 1 from matching day 15
   * and pins the correct month/year.
   */
  private dayButton(month: string, day: string, year?: string): Locator {
    const suffix = year ? `, ${year}` : ",";
    return this.page.getByRole("button", {
      name: new RegExp(`${month} ${day}${suffix}`),
    });
  }

  /** Click the calendar's Next arrow until `target` day cell is on screen. */
  private async advanceCalendarUntilVisible(target: Locator) {
    let attempts = 0;
    const maxAttempts = 24;
    while (attempts < maxAttempts) {
      if (await target.isVisible().catch(() => false)) return;
      await this.clickNextButton();
      attempts++;
    }
  }

  /**
   * Open the datepicker and select a check-in / check-out day within `monthFrom`.
   * Advances the calendar until the check-in day cell is visible. `year` is
   * optional but makes the day match unambiguous across months.
   */
  async selectDateRange(
    monthFrom: string,
    dateFromLabel: string,
    dateToLabel: string,
    year?: string
  ) {
    await this.clickWhenReady(this.selectDates);

    const checkIn = this.dayButton(monthFrom, dateFromLabel, year);
    const checkOut = this.dayButton(monthFrom, dateToLabel, year);

    await this.advanceCalendarUntilVisible(checkIn);
    await checkIn.click();
    await checkOut.click();
  }

  /**
   * Open the datepicker, pick a check-in date, then hover a date fewer than
   * 3 nights out to trigger the minimum-stay message (without committing).
   */
  async selectCheckInAndHoverShortStay(
    monthFrom: string,
    checkInLabel: string,
    hoverLabel: string,
    year?: string
  ) {
    await this.clickWhenReady(this.selectDates);

    const checkIn = this.dayButton(monthFrom, checkInLabel, year);
    const hover = this.dayButton(monthFrom, hoverLabel, year);

    await this.advanceCalendarUntilVisible(checkIn);
    await checkIn.click();
    await hover.hover();
  }

  async clearDates() {
    await this.clickWhenReady(this.clearDatesButton);
  }

  /**
   * Set guest counts to ABSOLUTE totals (Beaches brand exposes the Guests
   * stepper). `adults` is the TOTAL number of adults on the itinerary — not a
   * number added on top of the primary guest — so `setGuests(5)` yields five
   * total guests (one primary + four additional forms on the Guests step).
   *
   * The Beaches Guests popover opens pre-filled to its resort default
   * ("2 Adults" — see NOBE `defaultAdultCount`), so we cannot blindly increment
   * from 1. Each category is driven from its documented default to the target,
   * clicking Increase or Decrease exactly the number of times needed.
   */
  async setGuests(adults: number, children = 0, infants = 0) {
    // Sandals (couples / adults-only) resorts lock the Guests control at
    // "2 Adults" and render the trigger disabled. When it's disabled the only
    // valid state IS that locked default, so a matching request is a no-op —
    // clicking the disabled button just times out (see C59153). A differing
    // request can't be honoured here, so fail loudly with a clear reason.
    if (await this.selectGuests.isDisabled().catch(() => false)) {
      if (adults === 2 && children === 0 && infants === 0) return;
      throw new Error(
        `Guests control is disabled (adults-only resort locked at 2 adults); ` +
          `cannot set ${adults} adults / ${children} children / ${infants} ` +
          `infants. Choose a Beaches resort to change guest counts.`
      );
    }
    await this.selectGuests.click();
    // Popover defaults: 2 Adults, 0 Children, 0 Infants (OBE Beaches default).
    await this.setGuestCategory("Adults", adults, 2);
    await this.setGuestCategory("Children", children, 0);
    await this.setGuestCategory("Infants", infants, 0);
    // [verified] The guests popover commits with an "Update" button, not Escape.
    // NOTE: adding Children/Infants also reveals age / date-of-birth selects
    // (getByTestId("age1"), dob_month1/dob_day1/dob_year1); wire those in here if
    // a case needs specific ages.
    await this.clickWhenReady(this.guestsUpdateButton);
  }

  /**
   * Drive one guest category's stepper from its popover `defaultCount` to the
   * absolute `target`, clicking Increase/Decrease the exact number of times
   * needed. A start-at-1 assumption previously over-counted Adults by one on
   * Beaches (default 2) and added an extra guest to the itinerary.
   */
  private async setGuestCategory(
    category: string,
    target: number,
    defaultCount: number
  ) {
    const delta = target - defaultCount;
    if (delta > 0) {
      await this.stepGuest(`Increase ${category}`, delta);
    } else if (delta < 0) {
      await this.stepGuest(`Decrease ${category}`, -delta);
    }
  }

  private async stepGuest(buttonName: string, times: number) {
    if (times <= 0) return;
    // [verified] Steppers are role=button labelled "Increase/Decrease Adults/Children/Infants".
    const stepper = this.page.getByRole("button", { name: buttonName });
    for (let i = 0; i < times; i++) {
      await stepper.click();
    }
  }

  /* ---------------------------------------------------------------- */
  /* Flights                                                          */
  /* ---------------------------------------------------------------- */

  async addFlights() {
    await this.waitForElementReady(this.addFlightsCheckbox);
    // The app disables the "Add Flights" checkbox when the selected dates are
    // more than 330 days from today, showing a banner that explains why.
    // Detect this fast (3 s) and throw so callers can retry with closer dates
    // rather than waiting the full test timeout for a click that will never work.
    const tooFarBanner = this.page.getByText(
      /please select arrival date less than 330 days/i
    );
    if (await tooFarBanner.isVisible({ timeout: 3000 }).catch(() => false)) {
      throw new Error(
        "ADD_FLIGHTS_DISABLED:330 — selected dates exceed the 330-day limit; " +
          "flights checkbox will not become enabled. Retry with earlier dates."
      );
    }
    await this.addFlightsCheckbox.click();
    // FORMER: expect(addFlightsCheckbox).toBeChecked() threw — the opt-in
    // control is a <label>, not a checkbox input. FORMER also pre-filled "miami"
    // and called searchFlightsBy.selectOption('1'), but searchFlightsBy is a
    // role=button (not a <select>), so selectOption throws, and pre-filling the
    // city broke the negative departure-city cases. The departure city / cabin
    // are set by the spec's own setDepartureCity()/selectFlightClass() calls.
    // Revealing the departure-city combobox is the real proof flights were added.
    await expect(this.flightsDepartingFrom).toBeVisible();
  }

  async setDepartureCity(airport: string, cityOption: string) {
    await this.flightsDepartingFrom.fill(airport);
    await this.page.getByRole("option", { name: cityOption }).click();
  }

  /**
   * Type raw text into the departure-city field WITHOUT selecting an option.
   * Used by negative cases (invalid city / special chars / numbers) that expect
   * the field to reject the input and stay effectively blank.
   */
  async typeDepartureCityRaw(text: string) {
    await this.flightsDepartingFrom.fill(text);
  }

  async selectFlightClass(cabin: string) {
    await this.searchFlightsBy.click();
    await this.page.getByRole("option", { name: cabin }).click();
  }

  /* ---------------------------------------------------------------- */
  /* SSG lookup modal                                                  */
  /* ---------------------------------------------------------------- */

  async openSsgLookup() {
    await this.clickWhenReady(this.lookItUpCta);
    await expect(this.ssgModal).toBeVisible();
  }
  async fillSsgLastName(lastName: string) {
    // Scope to the modal so we don't target a page-level field that may carry
    // the TA agent's pre-filled session data. Triple-click selects all existing
    // content before fill() so React's controlled-input state is properly cleared.
    const field = this.ssgModal.getByRole("textbox", { name: /Last Name/i });
    await field.click({ clickCount: 3 });
    await field.fill(lastName);
  }

  async fillSsgEmail(email: string) {
    // Same scoping rationale as fillSsgLastName — the modal pre-populates the
    // email from the TA session; click-to-select-all then fill overrides it.
    const field = this.ssgModal.getByRole("textbox", { name: /Email/i });
    await field.click({ clickCount: 3 });
    await field.fill(email);
  }

  async searchSsg() {
    await this.ssgSearchButton.click();
  }

  async useThisSsgNumber() {
    // Read the SSG number from the modal's disabled result textbox before
    // closing — "COPY THIS NUMBER" only copies to clipboard and does not
    // dismiss the dialog or fill the main-form field.
    const modalNumberInput = this.ssgModal.getByRole("textbox", {
      name: /Sandals Select Rewards Number/i,
    });
    const ssgNumber = await modalNumberInput.inputValue().catch(() => "");

    // Close the dialog via the standard close button.
    await this.page.getByRole("button", { name: "Close Popup" }).click();
    await expect(this.ssgModal).toBeHidden();

    // Fill the SSG number into the main-form textbox so the booking carries it.
    if (ssgNumber) {
      await this.fillSafe(this.ssgNumberInput, ssgNumber);
    }
  }

  async startNewSsgSearch() {
    await this.ssgStartNewSearchButton.click();
  }

  /* ---------------------------------------------------------------- */
  /* Adjoining rooms                                                   */
  /* ---------------------------------------------------------------- */

  /**
   * Guard: Adjoining Rooms can only be exercised on a Beaches resort. Throwing
   * here (rather than letting a selector time out) makes it obvious that the
   * test was pointed at a non-Beaches resort, not that the selector drifted.
   */
  private assertBeachesForAdjoiningRooms() {
    if (!this.isBeachesResort()) {
      throw new Error(
        `Adjoining Rooms is only available for Beaches resorts. Selected ` +
          `resort is "${this.selectedResort || "(none)"}". Choose a resort ` +
          `whose name starts with "Beaches" before testing adjoining rooms.`
      );
    }
  }

  async openAdjoiningRoomsInfo() {
    this.assertBeachesForAdjoiningRooms();
    await this.clickWhenReady(this.adjoiningRoomsInfoIcon);
    await expect(this.adjoiningRoomsModal).toBeVisible();
  }

  async requestAdjoiningRooms() {
    this.assertBeachesForAdjoiningRooms();
    await this.adjoiningRoomsCheckbox.click();
  }

  /* ---------------------------------------------------------------- */
  /* Submit                                                            */
  /* ---------------------------------------------------------------- */

  async continueToRoom() {
    await this.continueButton.click();
  }

  /**
   * Fill a full valid vacation input (no flights) and continue to Step 2.
   * Convenience flow for happy-path cases.
   */
  async fillValidVacation(data: VacationData) {
    await this.chooseDestination(data.destination);
    await this.chooseResort(data.resort);
    await this.selectDateRange(data.monthFrom, data.dateFrom, data.dateTo);
    if (data.guests) {
      await this.setGuests(
        data.guests.adults,
        data.guests.children,
        data.guests.infants
      );
    }
  }
}
