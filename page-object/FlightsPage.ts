import BasePage from "./BasePage";
import { FlightSelection } from "../test-data/types";
import { expect, Locator, Page } from "@playwright/test";

/**
 * Step 3 – Flight selection surface for the OBETANG agent booking engine,
 * shown after a room is chosen (still under `/itineraries/`, then `/flights/`
 * on current builds). The recorded flow proceeded past it via "CONTINUE
 * WITHOUT FLIGHTS".
 *
 * SELECTOR PROVENANCE
 * -------------------
 * `[REC]`   – captured from the OBETA live-flow codegen recording
 *             (`test/test-2.spec.ts`).
 * `[NOBE]`  – carried over from the verified NOBE FlightsPage (same OBE codebase).
 * `[OBE-NG]`– ported from `obe-e2e-nextgen-master/page-object/sandals/FlightsPage.ts`,
 *             which is verified against the consumer Sandals OBE (same OBE
 *             codebase as OBETA). Confirm on the agent DOM on first run
 *             (docs/SELF_HEALING.md).
 *
 * Scope: Steps 1–4 only. Nothing here reaches Payment (see CLAUDE.md rules).
 */
export class FlightsPage extends BasePage {
  readonly path = "/itineraries/";

  // --- Continue-without-flights (recorded flow) ---
  readonly continueWithoutFlightsButton: Locator; // [REC]
  readonly roundtripFlightsText: Locator; // [REC]

  // --- Flight search / selection (NOBE + OBE-NG) ---
  readonly heading: Locator; // [NOBE]
  readonly flightsDepartingFrom: Locator; // [NOBE]
  readonly airportInput: Locator; // [OBE-NG] placeholder-based departure input
  readonly seatTypeButton: Locator; // [NOBE] "Search Flights By" / Economy vs First
  readonly preferredAirlineButton: Locator; // [OBE-NG]
  readonly flightPreferencesDropdown: Locator; // [OBE-NG]
  readonly nonstopOnlyOption: Locator; // [OBE-NG] inside preferences dropdown
  readonly excludeOvernightOption: Locator; // [OBE-NG] inside preferences dropdown
  readonly nonstopCheckbox: Locator; // [NOBE]
  readonly excludeBasicEcoCheckbox: Locator; // [NOBE]
  readonly excludeOvernightCheckbox: Locator; // [NOBE]
  readonly customSortingButton: Locator; // [OBE-NG] Sort By trigger
  readonly submitButton: Locator; // [OBE-NG] "Search Flights" / "Update Flights"
  readonly departingFlightsText: Locator; // [OBE-NG]
  readonly selectFlightButton: Locator; // [OBE-NG] "Select Flight"
  readonly selectFlightsAndContinueButton: Locator; // [NOBE]
  readonly firstShowDetailsButton: Locator; // [NOBE] card-itinerary-0 details toggle
  readonly roomFlightPrice: Locator; // [OBE-NG] per-itinerary price cell

  // --- Modals / links ---
  readonly firstBasicEcoLink: Locator; // [OBE-NG] "Economy Class" opens restrictions modal
  readonly basicEcoModal: Locator; // [OBE-NG]
  readonly baggageFeesLink: Locator; // [OBE-NG]
  readonly priceGuaranteeText: Locator; // [OBE-NG]

  // --- Airline logos / options ---
  readonly firstDeltaLogo: Locator; // [OBE-NG]
  readonly firstAmericanAirlineLogo: Locator; // [OBE-NG]
  readonly deltaAirLineOption: Locator; // [OBE-NG]
  readonly americanAirlinesOption: Locator; // [OBE-NG]

  // --- Preferences result markers ---
  readonly nonstopFlightsFrom: Locator; // [OBE-NG]
  readonly nonstopFlightsTo: Locator; // [OBE-NG]

  // --- Add-flights radios (flights page "Add roundtrip flights?") ---
  readonly yesPleaseRadioButton: Locator; // [OBE-NG]
  readonly noThankYouRadioButton: Locator; // [OBE-NG]

  // --- No-flights / invalid-date messaging ---
  readonly noFlightsFoundText: Locator; // [NOBE] + [OBE-NG]
  readonly noFlightsOver330Text: Locator; // [OBE-NG] > 330 days message
  readonly differentGatewayText: Locator; // [OBE-NG]

  constructor(page: Page) {
    super(page);
    super.setPath(this.path);

    // [REC] The "continue without flights" CTA is a role=button; the roundtrip
    // summary text confirms the flights surface rendered.
    this.continueWithoutFlightsButton = page.getByRole("button", {
      name: /CONTINUE WITHOUT FLIGHTS/i,
    });
    this.roundtripFlightsText = page.getByText(/Roundtrip Flights/i);

    this.heading = page.getByText(/Roundtrip Flights/i);
    this.flightsDepartingFrom = page.getByRole("combobox", {
      name: "Flights departing from",
    });
    this.airportInput = page.getByPlaceholder("Enter Airport or City");
    this.seatTypeButton = page
      .getByTestId("seat-type-ui")
      .getByTestId("button-ui");
    this.preferredAirlineButton = page
      .getByTestId("preferred-airline-ui")
      .getByTestId("button-ui");
    this.flightPreferencesDropdown = page.getByTestId(
      "flight-preferences-dropdown"
    );
    // [REC] The flight-preference toggles are NOT items inside a dropdown that
    // must be opened first — they are directly-visible labeled controls on the
    // quick-edit bar. Each preference renders as a PAIR of same-named elements:
    // a hidden <input name="itinerariesForm.*"> plus a visual <span
    // aria-label="..." data-checked>. getByLabel(...) matches BOTH, so clicking
    // "all" of them toggles the control on (span) then straight back off
    // (input). Target the visual <span> only and click it exactly once — that is
    // the single global control (there is no per-leg toggle), and clicking it
    // filters and reloads the itinerary list in place (see enablePreference).
    // FORMER: page.getByLabel("Nonstop only") — matched input+span, double-toggled.
    this.nonstopOnlyOption = page.locator('span[aria-label="Nonstop only"]');
    this.excludeOvernightOption = page.locator(
      'span[aria-label="Exclude overnight"]'
    );
    this.nonstopCheckbox = page.locator('span[aria-label="Nonstop only"]');
    // FORMER: page.getByLabel(...) — matched input+span pair, double-toggled.
    this.excludeBasicEcoCheckbox = page.locator(
      'span[aria-label="Exclude Basic Economy"]'
    );
    this.excludeOvernightCheckbox = page.locator(
      'span[aria-label="Exclude overnight"]'
    );
    this.customSortingButton = page
      .getByTestId("custom-sorting-ui")
      .getByTestId("button-ui");
    this.submitButton = page.getByTestId("submit-itineraries-ui");
    this.departingFlightsText = page.getByText("Departing");
    this.selectFlightButton = page.getByRole("button", {
      name: "Select Flight",
    });
    // [REC] The recording proves the button's accessible name is
    // "Select These Flights &" — the "& Continue" suffix is NOT part of the
    // accessible name. Match only up to "&" so the substring match is reliable
    // (still tolerates the NOBE "Select Flights &" wording without "These").
    // FORMER: name: /Select (These )?Flights & Continue/i
    this.selectFlightsAndContinueButton = page.getByRole('button', { name: 'Select These Flights & Continue' });
    // OBETANG itinerary cards carry testid "itinerary-card" and expose the
    // expander as a "Show Details" text control (no dedicated toggle testid, and
    // NOBE's card-itinerary-0 / card-details-toggle-button-ui testids do not
    // exist here). Scope Show Details to the first card.
    // FORMER: page.getByTestId("card-itinerary-0").getByTestId("card-details-toggle-button-ui")
    this.firstShowDetailsButton = page
      .getByTestId("itinerary-card")
      .first()
      .getByText("Show Details");
    this.roomFlightPrice = page.getByTestId("room-flight-price");

    this.firstBasicEcoLink = page
      .getByRole("button", { name: "Economy Class" })
      .first();
    this.basicEcoModal = page
      .getByRole("dialog")
      .filter({ hasText: "Basic Economy Airfare Restrictions" });
    this.baggageFeesLink = page.getByRole("link", {
      name: "Airline Baggage Fees",
    });
    this.priceGuaranteeText = page.getByText(/We guarantee no booking fees/i);

    this.firstDeltaLogo = page.getByRole("img", { name: "DL" }).first();
    this.firstAmericanAirlineLogo = page
      .getByRole("img", { name: "AA" })
      .first();
    this.deltaAirLineOption = page.getByRole("option", {
      name: "Delta Air Lines",
    });
    this.americanAirlinesOption = page.getByRole("option", {
      name: "American Airlines",
    });

    // [REC] Each itinerary card exposes two visible "itinerary-stops" markers
    // (departing leg + returning leg). Their text is e.g. "Basic Economy -
    // Nonstop" / "Economy Class - 1 Stop", so match the "Nonstop" substring
    // (NOT an exact /^Nonstop$/, which matches none). .first() = departing leg,
    // .nth(1) = returning leg once the Nonstop-only filter is applied.
    this.nonstopFlightsFrom = page
      .getByTestId("itinerary-stops")
      .filter({ hasText: /Nonstop/i })
      .first();
    this.nonstopFlightsTo = page
      .getByTestId("itinerary-stops")
      .filter({ hasText: /Nonstop/i })
      .nth(1);

    this.yesPleaseRadioButton = page.getByText("Yes, please");
    this.noThankYouRadioButton = page.getByText("No, thank you");

    this.noFlightsFoundText = page.getByText(
      /No flights found available for your gateway|couldn'?t find any flights/i
    );
    this.noFlightsOver330Text = page.getByText(
      /please select arrival date less than 330 days from today/i
    );
    this.differentGatewayText = page.getByText(
      /Please try from a different gateway/i
    );
  }

  /* ---------------------------------------------------------------- */
  /* Continue without flights (recorded happy path)                    */
  /* ---------------------------------------------------------------- */

  async continueWithoutFlights() {
    await this.clickWhenReady(this.continueWithoutFlightsButton);
  }

  /* ---------------------------------------------------------------- */
  /* Presence / assertions                                             */
  /* ---------------------------------------------------------------- */

  /** [OBE-NG] Assert the core flights-page controls rendered. */
  async areElementsVisible(): Promise<void> {
    await this.roundtripFlightsText.waitFor({ state: "visible" });
    await this.seatTypeButton.waitFor({ state: "visible" });
    await this.customSortingButton.waitFor({ state: "visible" });
    await this.continueWithoutFlightsButton.waitFor({ state: "visible" });
  }

  async assertOnFlightsStep() {
    await expect(this.roundtripFlightsText).toBeVisible();
  }

  /* ---------------------------------------------------------------- */
  /* Flight search                                                     */
  /* ---------------------------------------------------------------- */

  async chooseDepartureAirport(flight: FlightSelection) {
    // [REC] On the flights quick-edit bar the combobox is pre-populated with the
    // current gateway, so clear it (select-all) before typing the new airport,
    // then pick the autocomplete option. The recorded option label is the full
    // uppercase form, e.g. "MIAMI, FLORIDA (FL), USA (MIA)" — pass flight.city in
    // that exact format.
    await this.flightsDepartingFrom.click();
    await this.flightsDepartingFrom.press("ControlOrMeta+a");
    await this.flightsDepartingFrom.fill(flight.airport);
    await this.page.getByRole("option", { name: flight.city }).click();
  }

  /** [OBE-NG] Alias of {@link chooseDepartureAirport} matching the nextgen name. */
  async chooseAirport(flight: FlightSelection) {
    await this.chooseDepartureAirport(flight);
  }

  /** [OBE-NG] Trigger a flight search / update after changing the gateway. */
  async searchFlights() {
    await this.clickWhenReady(this.submitButton);
  }

  /**
   * [REC] Change the flight cabin via the "Search Flights By" (seat-type)
   * listbox. Recorded option labels are exactly "Economy/Coach" and
   * "First Class/Business".
   */
  async selectSeatType(cabin: "Economy/Coach" | "First Class/Business") {
    await this.clickWhenReady(this.seatTypeButton);
    await this.page.getByRole("option", { name: cabin }).click();
  }

  /**
   * [REC] Pick a preferred airline from the preferred-airline listbox, e.g.
   * "American Airlines" / "Delta Air Lines".
   */
  async selectPreferredAirline(airline: string | RegExp) {
    await this.clickWhenReady(this.preferredAirlineButton);
    await this.page.getByRole("option", { name: airline }).click();
  }

  /* ---------------------------------------------------------------- */
  /* Sort By                                                           */
  /* ---------------------------------------------------------------- */

  /**
   * [OBE-NG] Open the Sort By listbox and pick an option by its label. The
   * flights sort control is the same React-Aria listbox pattern as the room
   * sort (role=button trigger → role=option items).
   */
  async sortBy(optionName: string | RegExp) {
    await this.clickWhenReady(this.customSortingButton);
    await this.page.getByRole("option", { name: optionName }).click();
  }

  private async flightPrices(): Promise<number[]> {
    const cells = await this.roomFlightPrice.all();
    const texts = await Promise.all(cells.map((c) => c.textContent()));
    return texts.map((t) => parseFloat((t || "0").replace(/[^0-9.]/g, "")));
  }

  async getCurrentPrice(): Promise<number> {
    const text = await this.roomFlightPrice.first().textContent();
    return parseFloat((text || "0").replace(/[^0-9.]/g, ""));
  }

  async getFifthPrice(): Promise<number> {
    const text = await this.roomFlightPrice.nth(4).textContent();
    return parseFloat((text || "0").replace(/[^0-9.]/g, ""));
  }

  /** [OBE-NG] Sort ascending and assert the first ~5 prices are non-decreasing. */
  async checkPriceLowToHigh() {
    await this.sortBy(/Price Low to High/i);
    // Wait for the list to re-render after the sort change before reading prices.
    // OBE-NG reference had a commented-out waitForTimeout(1000) flagging this race.
    await this.waitForLoadingToClear();
    await this.roomFlightPrice.first().waitFor({ state: "visible" });
    const prices = await this.flightPrices();
    expect(
      prices.length,
      "No room-flight-price elements found after sort — check testid"
    ).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(4, prices.length - 1); i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);
    }
  }

  /** [OBE-NG] Sort descending and assert the first ~5 prices are non-increasing. */
  async checkPriceHighToLow() {
    await this.sortBy(/Price High to Low/i);
    await this.waitForLoadingToClear();
    await this.roomFlightPrice.first().waitFor({ state: "visible" });
    const prices = await this.flightPrices();
    expect(
      prices.length,
      "No room-flight-price elements found after sort — check testid"
    ).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(4, prices.length - 1); i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i + 1]);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Results accuracy (filter validation)                              */
  /* ---------------------------------------------------------------- */

  /** How many flight itinerary cards are currently listed. */
  async itineraryCount(): Promise<number> {
    return this.page.getByTestId("itinerary-card").count();
  }

  /** Assert the flights search returned at least one itinerary card. */
  async assertResultsPresent(): Promise<void> {
    const cards = this.page.getByTestId("itinerary-card");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  }

  /**
   * Validate the "Nonstop only" preference returns ACCURATE results: after it is
   * applied, every itinerary card must read "Nonstop" and none may show a
   * stop-count ("1 stop" / "2 stops"). Scans up to the first few cards — a single
   * card advertising a stop is enough to prove the filter is inaccurate.
   */
  async assertAllNonstop(): Promise<void> {
    const cards = this.page.getByTestId("itinerary-card");
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count, "Nonstop-only returned no flights.").toBeGreaterThan(0);

    const scan = Math.min(count, 5);
    for (let i = 0; i < scan; i++) {
      const cardText = (await cards.nth(i).textContent()) ?? "";
      expect(
        /\d+\s*stop/i.test(cardText),
        `Itinerary card #${i + 1} shows a connection but Nonstop-only is on. ` +
          `Card text: "${cardText.replace(/\s+/g, " ").trim().slice(0, 200)}"`
      ).toBeFalsy();
      expect(
        /nonstop/i.test(cardText),
        `Itinerary card #${i + 1} is not labelled Nonstop.`
      ).toBeTruthy();
    }
  }

  /* ---------------------------------------------------------------- */
  /* Itinerary card interactions                                       */
  /* ---------------------------------------------------------------- */

  /** [NOBE] Toggle the first itinerary's Show/Hide Details panel. */
  async toggleFirstFlightDetails() {
    await this.clickWhenReady(this.firstShowDetailsButton);
  }

  /** [OBE-NG] Open the "Basic Economy Airfare Restrictions" modal. */
  async openBasicEconomyModal() {
    await this.clickWhenReady(this.firstBasicEcoLink);
    await expect(this.basicEcoModal).toBeVisible();
  }

  /** [OBE-NG] Click the "Airline Baggage Fees" link. */
  async openBaggageFees() {
    await this.clickWhenReady(this.baggageFeesLink);
  }

  /* ---------------------------------------------------------------- */
  /* Flight preferences (quick-edit bar)                               */
  /* ---------------------------------------------------------------- */

  /**
   * [REC] Turn ON a flight-preference checkbox (the visual <span aria-label=...
   * data-checked>). These are custom checkboxes whose clickable point is covered
   * by their wrapping <div>/<label>, so a plain click never clears Playwright's
   * pointer-intercept check and retries until timeout — force the click instead.
   * Idempotent: only clicks when the control is not already checked, so it can
   * never accidentally toggle an already-enabled filter back off. Waits for
   * data-checked="true" (which also lets the in-place list re-filter settle).
   */
  private async enablePreference(control: Locator) {
    const items = await control.all();
    for (const item of items) {
      await this.waitForElementReady(item);
      if ((await item.getAttribute("data-checked")) !== "true") {
        await item.click({ force: true });
        await expect(item).toHaveAttribute("data-checked", "true");
      }
    }
  }

  /** [REC] Enable the single global "Nonstop only" filter (no dropdown to open). */
  async setNonstopOnly() {
    await this.enablePreference(this.nonstopOnlyOption);
  }

  /** [REC] Enable the single global "Exclude overnight" filter (no dropdown to open). */
  async setExcludeOvernight() {
    await this.enablePreference(this.excludeOvernightOption);
  }

  /** [REC] Enable the single global "Exclude Basic Economy" filter. */
  async setExcludeBasicEconomy() {
    await this.enablePreference(this.excludeBasicEcoCheckbox);
  }

  /* ---------------------------------------------------------------- */
  /* Selection                                                         */
  /* ---------------------------------------------------------------- */

  /**
   * Select the first available flight itinerary. The OBETANG (OBE) flights
   * surface has no standalone "Select Flight" button — instead expanding the
   * first itinerary card (Show Details) reveals its "Select These Flights &
   * Continue" CTA. This performs that expand; call selectFlightsAndContinue()
   * afterwards to commit. Never books or reaches Payment (CLAUDE.md).
   * FORMER: clicked a non-existent getByRole("button", {name:"Select Flight"}).
   */
  async selectFirstFlightAndContinue() {
    await this.firstShowDetailsButton.scrollIntoViewIfNeeded();
    await this.clickWhenReady(this.firstShowDetailsButton);
  }

  /**
   * [REC] Commit the default (first) roundtrip itinerary via the
   * "Select These Flights & Continue" CTA — the path the recorded flow used —
   * and advance to the Guests step. Never books or reaches Payment (CLAUDE.md).
   */
  async selectFlightsAndContinue() {
    await this.selectFlightsAndContinueButton.scrollIntoViewIfNeeded();
    await this.clickWhenReady(this.selectFlightsAndContinueButton);
  }
}
