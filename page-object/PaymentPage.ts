import BasePage from "./BasePage";
import { PaymentInfo } from "../test-data/types";
import { expect, Locator, Page } from "@playwright/test";

/**
 * Step 5 – Payment page for the OBETANG agent booking engine. Reached after the
 * Guests step via {@link GuestsPage.continueToPayment}.
 *
 * =============================== SCOPE GUARD ===============================
 * Per CLAUDE.md, this page object is DELIBERATELY INCOMPLETE and must stay so:
 *
 *   • It NEVER fills the CVV field. There is no `cvvInput` helper and
 *     `fillPaymentData()` stops after the expiration year on purpose.
 *   • It NEVER submits a payment. There is intentionally NO method that clicks
 *     the "PAY VACATION" button (`payVacationButton` is exposed for assertions
 *     only — do not click it).
 *   • It therefore NEVER completes a booking or reaches the Confirmation page.
 *
 * These are hard project rules — do not add a CVV fill or a pay/submit helper.
 * ===========================================================================
 *
 * SELECTOR PROVENANCE
 * -------------------
 * `[OBE-ref]` – ported from the verified OBE next-gen PaymentPage
 *               (`obe-e2e-nextgen-master/page-object/beaches/PaymentPage.ts`).
 *               OBETANG runs the same OBE codebase, so these should carry over;
 *               confirm on first live run (see docs/SELF_HEALING.md).
 */
export class PaymentPage extends BasePage {
  readonly path = "/payment/";

  // --- Card fields (CVV intentionally absent — see SCOPE GUARD) ---
  readonly cardHolderInput: Locator; // [OBE-ref]
  readonly cardNumberInput: Locator; // [OBE-ref]
  readonly expirationMonthInput: Locator; // [OBE-ref] MM picker
  readonly expirationYearInput: Locator; // [OBE-ref] YYYY picker

  // --- Payment options ---
  // readonly payFullVacationPrice: Locator; // [OBE-ref]
  readonly payNow: Locator; // [OBE-ref]
  readonly holdRoomTab: Locator; // [OBE-ref]
  readonly holdFor98: Locator; // New property added
  readonly holdForZero: Locator; // New property added
  readonly holdYourRoom: Locator; // [OBE-ref]
  readonly payLater: Locator; // [OBE-ref]
  readonly oneCard: Locator; // [OBE-ref]
  readonly twoCards: Locator; // [OBE-ref]
  readonly anotherCardCTA: Locator; // [OBE-ref]

  // --- Protection plan + terms ---
  readonly iWantToProtectMyTrip: Locator; // [OBE-ref]
  readonly noProtectionPlan: Locator; // "NO, I'm Willing To Travel" [test-3]
  readonly termsConditionsCheckbox: Locator; // [OBE-ref] — second instance (Hold tab)
  readonly termsConditionsCheckboxFirst: Locator; // [NOBE-ref] — first instance

  // --- Hold tab options ---
  readonly customAmountOption: Locator; // "Deposit custom amount" radio option [NOBE-ref]
  readonly customHoldAmountInput: Locator; // custom dollar-amount textbox [NOBE-ref]
  readonly holdValueGeneric: Locator; // "Custom Hold between" textbox (range helper) [NOBE-ref]
  readonly holdForSeasideBungalow: Locator; // options-radio-group list (Beaches resorts) [NOBE-ref]

  // --- Hold policy bullet points (visible when Hold tab is active) ---
  readonly bulletPointOne: Locator; // "We will hold this room and…" [NOBE-ref]
  readonly bulletPointTwo: Locator; // "After 21 days, a minimum…" [NOBE-ref]
  readonly bulletPointThree: Locator; // "If the hold amount is less…" [NOBE-ref]
  readonly bulletPointFour: Locator; // "Any remaining balance will be…" [NOBE-ref]
  readonly bulletPointFive: Locator; // "Room is fully refundable…" [NOBE-ref]

  readonly viewFullVacationSummaryButton: Locator; // [NOBE-ref]

  // --- Assertion-only CTA (NEVER clicked — see SCOPE GUARD) ---
  readonly payVacationButton: Locator; // [OBE-ref]

  constructor(page: Page) {
    super(page);
    super.setPath(this.path);

    this.cardHolderInput = page.getByLabel("Name on Card *");
    this.cardNumberInput = page.getByLabel("Card Number *");
    this.expirationMonthInput = page.getByLabel("MM");
    this.expirationYearInput = page.getByLabel("YYYY");

    // this.payFullVacationPrice = page.getByText("Pay full vacation price");
    this.payNow = page.getByTestId("tabs-pay-now-ui");
    this.holdRoomTab = page
      .getByTestId("tabs-pay-later-ui")
      .getByText("Hold Room");
    this.holdFor98 = page.locator("label").first();
    this.holdForZero = page.locator("label").nth(1);
    this.holdYourRoom = page.getByText("Hold Your Room");
    this.payLater = page.getByText("Pay Later");
    this.oneCard = page.getByText("1 Card");
    this.twoCards = page.getByText("2 Cards");
    this.anotherCardCTA = page.getByRole("button", {
      name: "Add another credit card",
    });

    this.iWantToProtectMyTrip = page.getByText("YES, I Want To Protect My");
    this.noProtectionPlan = page.getByText("NO, I'm Willing To Travel");
    this.termsConditionsCheckboxFirst = page
      .getByText("I agree to the")
      .first();
    this.termsConditionsCheckbox = page.getByLabel("I agree to the").nth(1);

    this.customAmountOption = page.getByText("Deposit custom amount");
    this.customHoldAmountInput = page.getByRole("textbox", {
      name: "Custom Amount Custom Amount  *",
    });
    this.holdValueGeneric = page.getByRole("textbox", {
      name: "Custom Hold between",
    });
    this.holdForSeasideBungalow = page
      .getByTestId("options-radio-group-ui")
      .getByRole("list");

    this.bulletPointOne = page
      .getByRole("listitem")
      .filter({ hasText: "We will hold this room and" });
    this.bulletPointTwo = page
      .getByRole("listitem")
      .filter({ hasText: "After 21 days, a minimum" });
    this.bulletPointThree = page
      .getByRole("listitem")
      .filter({ hasText: "If the hold amount is less" });
    this.bulletPointFour = page
      .getByRole("listitem")
      .filter({ hasText: "Any remaining balance will be" });
    this.bulletPointFive = page
      .getByRole("listitem")
      .filter({ hasText: "Room is fully refundable" });

    this.viewFullVacationSummaryButton = page.getByRole("button", {
      name: "View full vacation summary",
    });

    this.payVacationButton = page.getByRole("button", { name: "PAY VACATION" });
  }

  /* ---------------------------------------------------------------- */
  /* Step assertion                                                    */
  /* ---------------------------------------------------------------- */

  /** Confirm the Payment step rendered (does NOT interact with payment). */
  async assertOnPaymentStep() {
    await this.waitForPageNavigation(/payment/i).catch(() => undefined);
    await expect(this.payNow).toBeVisible();
  }

  /* ---------------------------------------------------------------- */
  /* Payment options                                                   */
  /* ---------------------------------------------------------------- */

  /** Select "Pay full vacation price". */
  // async clickPayFullVacationPrice() {
  //   await this.scrollToElementAndWait(this.payFullVacationPrice);
  //   await this.payFullVacationPrice.click();
  // }
  async clickPayNowTab() {
    await this.scrollToElementAndWait(this.payNow);
    await this.payNow.click();
  }

  /** Click the "Hold Room" tab (switches from Pay Now to Hold tab). */
  async clickHoldRoomTab() {
    await this.scrollToElementAndWait(this.holdRoomTab);
    await this.holdRoomTab.click();
  }

  /** Select the "Hold Your Room" (pay-later deposit) option. */
  async clickHoldYourRoom() {
    await this.scrollToElementAndWait(this.holdYourRoom);
    await this.holdYourRoom.click();
  }

  /** Select "Deposit custom amount" hold option. */
  async clickCustomAmountOption() {
    await this.customAmountOption.scrollIntoViewIfNeeded();
    await this.customAmountOption.click();
  }

  /** Enter a custom hold dollar amount after selecting the custom-amount option. */
  async enterCustomHoldAmount(amount: string) {
    await this.customHoldAmountInput.fill(amount);
  }

  /** Decline the travel protection plan ("NO, I'm Willing To Travel"). */
  async clickNoProtectionPlan() {
    await this.noProtectionPlan.scrollIntoViewIfNeeded();
    await this.noProtectionPlan.click();
  }

  /** Assert all five Hold policy bullet points are visible. */
  async areAllBulletPointsVisible() {
    await this.bulletPointOne.waitFor({ state: "visible" });
    await this.bulletPointTwo.waitFor({ state: "visible" });
    await this.bulletPointThree.waitFor({ state: "visible" });
    await this.bulletPointFour.waitFor({ state: "visible" });
    await this.bulletPointFive.waitFor({ state: "visible" });
  }

  /** Click the "Add Another Card" call-to-action. */
  async clickAnotherCardCTA() {
    await this.anotherCardCTA.scrollIntoViewIfNeeded();
    await this.anotherCardCTA.click();
  }
  /** Opt in to the travel protection plan. */
  async addProtectionPlan() {
    await this.iWantToProtectMyTrip.check();
    await expect(this.iWantToProtectMyTrip).toBeChecked();
  }

  /** Accept the terms & conditions. */
  async clickTermsConditionsCheckbox() {
    await this.termsConditionsCheckbox.scrollIntoViewIfNeeded();
    await this.termsConditionsCheckbox.check();
  }

  /**
   * Ensure the single-credit-card layout. OBETANG shows one credit-card form by
   * default (a second is added via "Add another credit card"). If an amount-
   * dependent "1 Card" toggle is present, select it; otherwise the single-card
   * form is already the default, so just bring the card fields into view.
   */
  async clickOneCard() {
    const toggle = this.oneCard.first();
    if (await toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toggle.scrollIntoViewIfNeeded();
      await toggle.click();
      return;
    }
    await this.cardNumberInput.scrollIntoViewIfNeeded().catch(() => undefined);
  }

  /**
   * Reveal a second credit-card form. Resilient to both models: a "2 Cards"
   * split toggle (older copy) or the "Add another credit card" CTA (current
   * OBETANG DOM). Adds the second card only — fillPaymentData still fills card 1
   * (the flow never submits, so a partial card 2 is fine; see SCOPE GUARD).
   */
  async clickTwoCard() {
    const control = await this.resolveFirst([
      this.twoCards,
      this.anotherCardCTA,
    ]);
    await control.scrollIntoViewIfNeeded().catch(() => undefined);
    await control.click();
  }

  /* ---------------------------------------------------------------- */
  /* Card fill (NO CVV — see SCOPE GUARD)                              */
  /* ---------------------------------------------------------------- */

  /**
   * Fill the FIRST credit card (CREDIT CARD 1) up to — but NOT including — the CVV.
   *
   * SCOPE GUARD: stops after the expiration year. Never fills the CVV and never
   * clicks "PAY VACATION" — the test ends without submitting (see CLAUDE.md).
   */
  async fillPaymentData(paymentData: PaymentInfo) {
    await this.fillCardAt(0, paymentData);
  }

  /**
   * Fill the SECOND credit card (CREDIT CARD 2), which appears after
   * {@link clickTwoCard} / "Add another credit card". Same CVV-free, no-submit
   * guard as {@link fillPaymentData}.
   */
  async fillSecondCard(paymentData: PaymentInfo) {
    await this.fillCardAt(1, paymentData);
  }

  /**
   * Fill one credit-card form by its 0-based index. Each card's fields are
   * scoped by the stable `paymentForm.ccForm.{index}.*` name/id (getByLabel is
   * ambiguous once a second card is added). The `.cvv` field is deliberately
   * left blank — do not fill it (see SCOPE GUARD).
   */
  private async fillCardAt(index: number, paymentData: PaymentInfo) {
    const base = `paymentForm.ccForm.${index}`;
    await this.page
      .locator(`input[name="${base}.cardNumber"]`)
      .fill(paymentData.cardNumber);
    await this.page
      .locator(`input[name="${base}.name"]`)
      .fill(paymentData.cardHolder);

    // MM / YYYY are portal listbox pickers (li[role=option][data-key]); open the
    // card-scoped trigger, then click the matching option. For the second card
    // form the trigger may sit behind the fixed page header (h-[3.5rem] ≈ 56px);
    // scroll it into view and then nudge the viewport up 80px to clear the header
    // before clicking.
    const monthTrigger = this.page.locator(`[id="${base}.month"]`);
    await monthTrigger.scrollIntoViewIfNeeded();
    await this.page.evaluate(() => window.scrollBy(0, -80));
    await monthTrigger.click();
    await this.page.click(
      `li[role="option"][data-key="${paymentData.expiration.month}"]`
    );
    const yearTrigger = this.page.locator(`[id="${base}.year"]`);
    await yearTrigger.scrollIntoViewIfNeeded();
    await this.page.evaluate(() => window.scrollBy(0, -80));
    await yearTrigger.click();
    await this.page.click(
      `li[role="option"][data-key="${paymentData.expiration.year}"]`
    );

    // CVV (name="paymentForm.ccForm.N.cvv") is intentionally NOT entered.
  }
}
