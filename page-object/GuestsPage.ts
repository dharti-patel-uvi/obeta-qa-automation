import BasePage from "./BasePage";
import { GuestInfo } from "../test-data/types";
import { expect, Locator, Page } from "@playwright/test";

/**
 * Step 3/4 – Guests page for the OBETANG agent booking engine. Reached after
 * room (and optional flight) selection. Collects primary + additional guest
 * details and shows the vacation-price summary.
 *
 * SELECTOR PROVENANCE
 * -------------------
 * `[REC]`  – captured from the live-flow codegen recording
 *            (`test/test-2.spec.ts`, stg) and treated as verified. These reveal
 *            OBETA-specific patterns that differ from NOBE:
 *              • Title / Country / State are `button-ui` + `role=option`
 *                pickers (matched by option label), NOT native <select>s.
 *              • Date-of-birth <select>s carry the id-suffix "undefined"
 *                (dob_monthundefined / dob_dayundefined / dob_yearundefined),
 *                scoped by the field container id (#birthdate for the primary
 *                guest, [id="additionalGuests[0].dateOfBirth"] for guest 2).
 * `[NOBE]` – carried over from the verified NOBE GuestsPage; confirm on first run.
 *
 * SCOPE GUARD: `continueToPayment()` advances to the Step 5 Payment page for
 * the complex end-to-end scenarios, but the flow still NEVER enters a CVV,
 * submits a payment, or completes a booking (see PaymentPage + CLAUDE.md).
 */
export class GuestsPage extends BasePage {
  readonly path = "/itineraries/";

  // --- Primary guest (recorded flow) ---
  readonly titlePrimary: Locator; // [REC] button-ui + option
  readonly firstNamePrimary: Locator; // [REC]
  readonly lastNamePrimary: Locator; // [REC]
  readonly dobPrimaryContainer: Locator; // [REC] #birthdate
  readonly emailPrimary: Locator; // [REC]
  readonly address1Primary: Locator; // [REC]
  readonly countryPrimary: Locator; // [REC] button-ui + option
  readonly statePrimary: Locator; // [REC] "Select State" button + option
  readonly cityPrimary: Locator; // [REC]
  readonly zipCodePrimary: Locator; // [REC]
  readonly phonePrimary: Locator; // [REC]

  // --- Additional (secondary) guest (recorded flow) ---
  readonly titleSecondary: Locator; // [REC] "Please Select Title" button + option
  readonly firstNameSecondary: Locator; // [REC]
  readonly lastNameSecondary: Locator; // [REC]
  readonly dobSecondaryContainer: Locator; // [REC] additionalGuests[0].dateOfBirth

  // --- Summary / navigation ---
  readonly primaryGuestHeading: Locator; // [NOBE]
  readonly nightsText: Locator; // [REC] "for N nights"
  readonly totalPricePerPersonPerNight: Locator; // [REC] price-total-price-pppn
  readonly viewAllDetailsButton: Locator; // [REC]
  // NOTE: clicking this proceeds toward the Payment step, which is OUT OF SCOPE.
  // Exposed for reference only — no helper method invokes it.
  readonly continueButton: Locator; // [NOBE]

  // --- Continue-to-Payment CTA (validation trigger only) ---
  // [OBE-NG] Used ONLY to surface inline validation on an INVALID (blank) form
  // via triggerGuestValidation(). On a valid form this would navigate to
  // Payment, so no helper ever clicks it with a filled form (see CLAUDE.md).
  readonly continueToPaymentButton: Locator; // [OBE-NG]

  // --- Primary guest inline errors ([OBE-NG]) ---
  readonly guestTitleError: Locator;
  readonly guestFirstNameError: Locator;
  readonly guestLastNameError: Locator;
  readonly guestEmailError: Locator;
  readonly guestAddressError: Locator;
  readonly guestCountryError: Locator;
  readonly guestStateError: Locator;
  readonly guestCityError: Locator;
  readonly guestZipCodeError: Locator;
  readonly guestPhoneError: Locator;

  // --- Additional (secondary) guest inline errors ([OBE-NG]) ---
  readonly agTitleError: Locator;
  readonly agGenderError: Locator;
  readonly agFirstNameError: Locator;
  readonly agLastNameError: Locator;
  readonly agDobError: Locator;

  // --- Wedding / additional-guest verbiage ([OBE-NG]) ---
  readonly primaryGuestText: Locator;
  readonly weddingCheckbox: Locator;
  readonly weddingSuccessMessage: Locator;
  readonly additionalGuestInfo: Locator;

  // --- Cross-step navigation CTAs ([OBE-NG]) ---
  readonly startOverButton: Locator;
  readonly startOverModalButton: Locator; // confirm "start over" in the modal
  readonly startOverCancelButton: Locator;
  readonly changeRoomButton: Locator;
  readonly changeFlightsButton: Locator;
  readonly flightsNavButton: Locator;

  constructor(page: Page) {
    super(page);
    super.setPath(this.path);

    // Primary guest.
    this.titlePrimary = page
      .getByTestId("guest-title-1-ui")
      .getByTestId("button-ui");
    this.firstNamePrimary = page.getByTestId("guest-firstname-1-ui");
    this.lastNamePrimary = page.getByTestId("guest-lastname-1-ui");
    this.dobPrimaryContainer = page.locator("#birthdate");
    this.emailPrimary = page.getByTestId("guest-email-1-ui");
    this.address1Primary = page.getByTestId("guest-address1-1-ui");
    this.countryPrimary = page
      .getByTestId("guest-country-1-ui")
      .getByTestId("button-ui");
    // [REC] The state control renders as a role=button whose name includes
    // "Select State"; matching the "Select State" fragment keeps it stable.
    this.statePrimary = page.getByRole("button", { name: /Select State/i });
    this.cityPrimary = page.getByTestId("guest-city-1-ui");
    this.zipCodePrimary = page.getByTestId("guest-zipcode-1-ui");
    this.phonePrimary = page.getByTestId("guest-phone-1-ui");

    // Additional guest.
    // [REC] Before a value is chosen the guest-2 title trigger has no testid
    // wired the same way; the recording matched the placeholder button
    // "Please Select Title".
    this.titleSecondary = page.getByRole("button", {
      name: /Please Select Title/i,
    });
    this.firstNameSecondary = page.getByTestId("guest-firstname-2-ui");
    this.lastNameSecondary = page.getByTestId("guest-lastname-2-ui");
    this.dobSecondaryContainer = page.locator(
      '[id="additionalGuests[0].dateOfBirth"]'
    );

    // Summary / navigation.
    // OBETANG renders "PRIMARY GUEST" as a text label (the level-1 heading on
    // this step is "Guest Information"), so a heading-role locator never
    // matches. Confirm the primary-guest section via its text label.
    // FORMER: page.getByRole("heading", { name: /PRIMARY GUEST/i })
    this.primaryGuestHeading = page.getByText(/PRIMARY GUEST/i).first();
    this.nightsText = page.getByText(/for \d+ nights/i);
    this.totalPricePerPersonPerNight = page.getByTestId(
      "price-total-price-pppn"
    );
    this.viewAllDetailsButton = page.getByRole("button", {
      name: /View All Details/i,
    });
    this.continueButton = page.getByRole("button", {
      name: "Continue",
      exact: true,
    });
    this.continueToPaymentButton = page.getByRole("button", {
      name: /Continue to Payment/i,
    });

    // Inline errors follow the `guest-<field>-<index>-error-ui` testid pattern.
    this.guestTitleError = page.getByTestId("guest-title-1-error-ui");
    this.guestFirstNameError = page.getByTestId("guest-firstname-1-error-ui");
    this.guestLastNameError = page.getByTestId("guest-lastname-1-error-ui");
    this.guestEmailError = page.getByTestId("guest-email-1-error-ui");
    this.guestAddressError = page.getByTestId("guest-address1-1-error-ui");
    this.guestCountryError = page.getByTestId("guest-country-1-error-ui");
    this.guestStateError = page.getByTestId("guest-state-1-error-ui");
    this.guestCityError = page.getByTestId("guest-city-1-error-ui");
    this.guestZipCodeError = page.getByTestId("guest-zipcode-1-error-ui");
    this.guestPhoneError = page.getByTestId("guest-phone-1-error-ui");

    this.agTitleError = page.getByTestId("guest-title-2-error-ui");
    this.agGenderError = page.getByTestId("guest-gender-2-error-ui");
    this.agFirstNameError = page.getByTestId("guest-firstname-2-error-ui");
    this.agLastNameError = page.getByTestId("guest-lastname-2-error-ui");
    this.agDobError = page
      .locator('[id="additionalGuests[0].dateOfBirth"]')
      .getByText(/This field is required/i);

    this.primaryGuestText = page.getByText(/PRIMARY GUEST/i);
    // [OBE-NG] "Are you planning a Wedding?" opt-in. The recorded flow toggled
    // the second "Yes" control on the guests form.
    this.weddingCheckbox = page.getByLabel("Yes").nth(1);
    this.weddingSuccessMessage = page.getByText(
      /A Sandals Wedding Specialist will get in touch/i
    );
    this.additionalGuestInfo = page.getByText(
      /Please fill out all the necessary information about the additional guest/i
    );

    this.startOverButton = page.getByText("Start Over");
    this.startOverModalButton = page.getByRole("button", {
      name: /^start over$/i,
    });
    this.startOverCancelButton = page.getByRole("button", {
      name: /^cancel$/i,
    });
    this.changeRoomButton = page.getByText("Change Room", {
      exact: false,
    });
    this.changeFlightsButton = page.getByText("Change Flights", {
      exact: false,
    });
    this.flightsNavButton = page.getByRole("link", { name: /^Flights$/i });
  }

  /* ---------------------------------------------------------------- */
  /* Picker helpers (button-ui + role=option)                          */
  /* ---------------------------------------------------------------- */

  /** Open a `button-ui` picker and click the option matching `optionLabel`. */
  private async selectFromPicker(trigger: Locator, optionLabel: string) {
    await this.clickWhenReady(trigger);
    // Anchor + escape so a literal "." in labels like "MR." is not treated as a
    // regex wildcard (which made /MR./ also match "MRS.", a strict-mode
    // violation). Case-insensitive, full-string match.
    const escaped = optionLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await this.page
      .getByRole("option", { name: new RegExp(`^${escaped}$`, "i") })
      .click();
  }

  /** Set a date-of-birth trio inside its container using the `dob_*undefined` selects. */
  private async setDateOfBirth(
    container: Locator,
    dob: { month: string; day: string; year: string }
  ) {
    // The month/day <option> values are zero-padded ("01".."12", "01".."31"),
    // so a single-digit fixture value like "6" matches no option. Pad to 2
    // digits (year is left as-is).
    const pad2 = (v: string) => (/^\d$/.test(v) ? `0${v}` : v);
    await container
      .getByTestId("dob_monthundefined")
      .selectOption(pad2(dob.month));
    await container.getByTestId("dob_dayundefined").selectOption(pad2(dob.day));
    await container.getByTestId("dob_yearundefined").selectOption(dob.year);
  }

  /* ---------------------------------------------------------------- */
  /* Fill guests                                                       */
  /* ---------------------------------------------------------------- */

  async fillPrimaryGuest(guest: GuestInfo) {
    await this.selectFromPicker(this.titlePrimary, guest.title);
    // SSG-linked bookings lock first/last name (disabled + pre-populated from the
    // SSG account). Skip filling when the field is already disabled so fillSafe
    // doesn't exhaust its retry budget on an unwritable input.
    if (!(await this.firstNamePrimary.isDisabled().catch(() => false))) {
      await this.fillSafe(this.firstNamePrimary, guest.firstName);
    }
    if (!(await this.lastNamePrimary.isDisabled().catch(() => false))) {
      await this.fillSafe(this.lastNamePrimary, guest.lastName);
    }
    await this.setDateOfBirth(this.dobPrimaryContainer, guest.dateOfBirth);

    if (guest.email) await this.fillSafe(this.emailPrimary, guest.email);
    if (guest.address1)
      await this.fillSafe(this.address1Primary, guest.address1);
    if (guest.country)
      await this.selectFromPicker(this.countryPrimary, guest.country);
    if (guest.state)
      await this.selectFromPicker(this.statePrimary, guest.state);
    if (guest.city) await this.fillSafe(this.cityPrimary, guest.city);
    if (guest.zipCode) await this.fillSafe(this.zipCodePrimary, guest.zipCode);
    if (guest.phone) await this.fillSafe(this.phonePrimary, guest.phone);
  }

  async fillSecondaryGuest(guest: GuestInfo) {
    await this.fillAdditionalGuest(2, guest);
  }

  /**
   * Fill an additional (non-primary) guest by its 1-based form position
   * (2 = first additional guest, 3 = second, ...). Additional guests collect
   * only title / first / last name / date-of-birth (parity with the reference
   * flow). Used by the multi-guest Beaches complex scenario.
   *
   * [OBE-NG] The indexed field testids (`guest-firstname-{n}-ui`, ...) and the
   * `additionalGuests[{n-2}].dateOfBirth` container follow the primary-guest
   * pattern and MUST be verified against the live DOM for guests 3+. The title
   * trigger is resolved via {@link BasePage.resolveFirst}: the indexed
   * `guest-title-{n}-ui` testid first, then the "Please Select Title"
   * placeholder button (the pre-selection form used in the original recording).
   */
  /**
   * Fill EVERY additional-guest form rendered on the step, cycling through
   * `guestPool` for data. The number of additional guests is derived from the
   * itinerary occupancy (not the spec), so this stays correct whether the
   * booking seats 2 or 6 — every required guest block gets valid data and the
   * step can continue. Returns the number of additional guests filled.
   */
  async fillAllAdditionalGuests(guestPool: GuestInfo[]): Promise<number> {
    if (guestPool.length === 0) {
      throw new Error("fillAllAdditionalGuests requires at least one guest.");
    }
    // One DOB container renders per additional guest (id="additionalGuests[i].dateOfBirth").
    const count = await this.page
      .locator('[id^="additionalGuests["][id$=".dateOfBirth"]')
      .count();
    for (let i = 0; i < count; i++) {
      await this.fillAdditionalGuest(i + 2, guestPool[i % guestPool.length]);
    }
    return count;
  }

  async fillAdditionalGuest(position: number, guest: GuestInfo) {
    const containerIndex = position - 2; // additionalGuests[] is 0-based
    const prefix = `additionalGuests[${containerIndex}]`;

    // [REC] Title and Gender are native <select>s (styled as buttons) keyed by a
    // stable `name` attribute — drive them with selectOption, which reliably
    // fires React's onChange even though the control is visually a button. This
    // replaced a `resolveFirst`/`nth()` button-picker that flaked on the last
    // guest (title never set -> gender never auto-derived -> "field required").
    await this.page
      .locator(`select[name="${prefix}.title"]`)
      .selectOption({ label: guest.title });
    await this.page
      .locator(`select[name="${prefix}.gender"]`)
      .selectOption({ label: this.genderFor(guest) });

    await this.fillSafe(
      this.page.getByTestId(`guest-firstname-${position}-ui`),
      guest.firstName
    );
    await this.fillSafe(
      this.page.getByTestId(`guest-lastname-${position}-ui`),
      guest.lastName
    );
    await this.setDateOfBirth(
      this.page.locator(`[id="${prefix}.dateOfBirth"]`),
      guest.dateOfBirth
    );
  }

  /**
   * Resolve a guest's gender label. Uses the explicit `guest.gender` when set,
   * otherwise derives it from the title honorific (MRS./MS./MISS -> FEMALE,
   * everything else -> MALE) — enough for the current fixtures.
   */
  private genderFor(guest: GuestInfo): string {
    if (guest.gender) return guest.gender;
    return /^(MRS|MS|MISS|MADAM|LADY)/i.test(guest.title) ? "FEMALE" : "MALE";
  }

  /* ---------------------------------------------------------------- */
  /* Summary                                                           */
  /* ---------------------------------------------------------------- */

  async openAllDetails() {
    await this.clickWhenReady(this.viewAllDetailsButton);
  }

  async assertOnGuestsStep() {
    await expect(this.primaryGuestHeading).toBeVisible();
  }

  /**
   * Assert an exact price string (e.g. "$5,680.00") is shown somewhere in the
   * Guests-step price summary — used to prove the room total selected on the
   * Room step carries through to the Guests step (pricing carry-over test).
   * Scoped to the summary/cart article so it can't match an unrelated number.
   */
  async assertShowsPrice(priceText: string): Promise<void> {
    const summary = this.page
      .getByRole("article")
      .filter({ hasText: /\$[\d,]+\.\d{2}/ })
      .first();
    const inSummary = summary.getByText(priceText, { exact: false });
    const anywhere = this.page.getByText(priceText, { exact: false }).first();
    // Prefer the summary match; fall back to anywhere on the page so a summary
    // markup change doesn't mask a genuine carry-over.
    await expect(inSummary.or(anywhere).first()).toBeVisible();
  }

  /* ---------------------------------------------------------------- */
  /* Validation                                                        */
  /* ---------------------------------------------------------------- */

  /**
   * [OBE-NG] Surface the Guests-step inline validation by clicking
   * "Continue to Payment".
   *
   * SCOPE GUARD: call this ONLY on an intentionally INVALID (blank/incomplete)
   * form. On an invalid form the click is blocked client-side and the page
   * stays on Guests, revealing the `*-error-ui` messages. It must never be
   * called on a fully valid form, which would navigate to Payment (out of
   * scope — see CLAUDE.md).
   */
  async triggerGuestValidation() {
    await this.clickWhenReady(this.continueToPaymentButton);
  }

  /**
   * Advance a VALID, fully-filled Guests form to the Step 5 – Payment page.
   *
   * Use this only after the guest details are complete (an incomplete form is
   * blocked client-side — use {@link triggerGuestValidation} for that case).
   * Reaching Payment is in scope for the complex end-to-end scenarios; entering
   * a CVV, submitting a payment, or completing a booking is NOT (see CLAUDE.md).
   */
  async continueToPayment() {
    await this.clickWhenReady(this.continueToPaymentButton);
    await this.waitForPageNavigation(/payment/i).catch(() => undefined);
  }

  /** [OBE-NG] Assert every required-field error (primary + secondary) is shown. */
  async areErrorsVisible(): Promise<void> {
    const errors = [
      this.guestTitleError,
      this.guestFirstNameError,
      this.guestLastNameError,
      this.guestEmailError,
      this.guestAddressError,
      this.guestCountryError,
      this.guestStateError,
      this.guestCityError,
      this.guestZipCodeError,
      this.guestPhoneError,
      this.agTitleError,
      this.agGenderError,
      this.agFirstNameError,
      this.agLastNameError,
      this.agDobError,
    ];
    for (const error of errors) {
      await expect(error).toBeVisible();
    }
  }

  /* ---------------------------------------------------------------- */
  /* Wedding opt-in                                                    */
  /* ---------------------------------------------------------------- */

  /** [OBE-NG] Toggle "Are you planning a Wedding?" and confirm the success note. */
  async optInToWedding() {
    await this.clickWhenReady(this.weddingCheckbox);
    await expect(this.weddingSuccessMessage).toBeVisible();
  }

  /* ---------------------------------------------------------------- */
  /* Cross-step navigation CTAs                                        */
  /* ---------------------------------------------------------------- */

  /** [OBE-NG] Open the Start Over modal (does not confirm). */
  async openStartOver() {
    await this.openAllDetails();
    await this.clickWhenReady(this.startOverButton);
  }

  /** [OBE-NG] Confirm "start over" in the modal — resets the booking to Step 1. */
  async confirmStartOver() {
    await this.clickWhenReady(this.startOverModalButton);
  }

  /** [OBE-NG] Dismiss the Start Over modal without resetting. */
  async cancelStartOver() {
    await this.clickWhenReady(this.startOverCancelButton);
  }

  /** [OBE-NG] "Change Room" — navigate back to the Rooms & Suites step. */
  async changeRoom() {
    await this.openAllDetails();
    await this.clickWhenReady(this.changeRoomButton);
  }

  /** [OBE-NG] "Change Flights" — navigate back to the Roundtrip Flights step. */
  async changeFlights() {
    await this.openAllDetails();
    await this.clickWhenReady(this.changeFlightsButton);
  }
}
