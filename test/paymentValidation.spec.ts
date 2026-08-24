import { expect, test } from "../test-data/fixtures";
import { GuestsPage } from "../page-object/GuestsPage";
import { PaymentPage } from "../page-object/PaymentPage";
import { advanceToGuests } from "../utils/navigateToStep";
import { primaryGuest, secondaryGuest } from "../test-data/guestFixture";
import vacationData from "../test-data/vacationFixture";

/**
 * Step 5 – Payment page required-field validation.
 *
 * Navigates the full Book Now flow (Vacation → Room → Guests → Payment),
 * then clicks "PAY VACATION" without entering any card information and asserts
 * that required-field errors appear for the card fields.
 *
 * SCOPE GUARD: no card data is entered at any point in this test. Clicking
 * PAY VACATION on a blank form is blocked client-side — the page stays on
 * Payment and reveals validation errors without processing a payment.
 * CVV is never entered and no booking is ever completed (CLAUDE.md).
 */
test.describe("Step 5 - Payment Page Required Field Validation", () => {
  // Full flow (Vacation → Room → Guests → Payment) needs extra time.
  test.setTimeout(180_000);

  test("SP - Clicking Pay Vacation with no card info shows required-field errors", async ({
    page,
  }) => {
    // ── Step 1–3: advance to the Guests step (no-flights path) ────────────
    const guests = await advanceToGuests(page, vacationData);

    // ── Step 4: fill all guest fields so the form is valid and we can
    //    continue to Payment (guest validation must pass to get there) ──────
    await test.step("fill primary guest details", async () => {
      await guests.fillPrimaryGuest(primaryGuest);
    });

    await test.step("fill additional guest details", async () => {
      await guests.fillAllAdditionalGuests([secondaryGuest]);
    });

    await test.step("continue to Payment page", async () => {
      await guests.continueToPayment();
    });

    // ── Step 5: arrive on Payment, enter NO card info, click Pay Vacation ──
    const payment = new PaymentPage(page);

    await test.step("confirm Payment step has loaded", async () => {
      await payment.assertOnPaymentStep();
    });
    await page.getByRole("button", { name: "PAY VACATION" }).click();
    // ── Assertions ──────────────────────────────────────────────────────────
    await test.step("required-field errors are visible for card fields", async () => {
      await payment.arePaymentErrorsVisible();
    });

    await test.step("page does not advance — URL stays on Payment", async () => {
      expect(page.url()).toContain("payment");
    });
  });
});
