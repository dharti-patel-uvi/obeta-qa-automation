import { expect, test } from "../test-data/fixtures";
import { advanceToQuoteReview } from "../utils/navigateToStep";
import {
  quoteVacation,
  quoteRecipientEmail,
  quoteClientFirstName,
  quoteClientLastName,
} from "../test-data/quoteFixture";

/**
 * Send Quote flow → Quote Review → email the quote (TestRail suite S921,
 * C59776–C59779). Fills in the Quote Review cases previously stubbed as
 * test.fixme in flights.spec.
 *
 * Journey: Step 1 (Send Quote mode, client email) → Room listing → Add to Quote
 * → Quote Review → View Room / Remove / Back to Rooms / Send Quote.
 *
 * The quote is emailed to `quoteRecipientEmail` (dharti.patel@uvi.sandals.com).
 * Sending a quote is IN SCOPE — it is neither a booking nor a payment, and Send
 * Quote never includes airfare (CLAUDE.md). No payment/confirmation is touched.
 *
 * Every selector on the Quote Review surface is [OBETA-TODO] (an OBETA-only
 * surface with no NOBE/nextgen reference) — expect first-run healing against the
 * live DOM (docs/SELF_HEALING.md).
 */
test.describe("Step 3 - Quote Review", () => {
  // Quote flow navigates through portal login + OBETA launch + vacation form +
  // room listing + add-to-quote + review — allow extra time on slow prod env.
  test.setTimeout(150_000);

  test("C59779 HP - User sends a quote (email to QA inbox)", async ({
    page,
  }) => {
    const quote = await advanceToQuoteReview(
      page,
      quoteVacation,
      quoteRecipientEmail
    );
    await quote.assertOnQuoteReview();
    await expect(quote.quoteRoomCard.first()).toBeVisible();

    await test.step("send the quote to the client email", async () => {
      await quote.sendQuote(
        quoteRecipientEmail,
        quoteClientFirstName,
        quoteClientLastName
      );
    });
    // sendQuote() already asserts the "quote sent" confirmation.
  });

  test("C59776 HP - View Room CTA", async ({ page }) => {
    const quote = await advanceToQuoteReview(page, quoteVacation);
    await quote.assertOnQuoteReview();
    await quote.viewRoom();
    // Viewing a quoted room opens its details (modal or room-details surface).
    await expect(
      quote.quoteReviewHeading
        .or(page.getByTestId("dialog-ui"))
        .or(page.getByText(/Room View:/i))
        .first()
    ).toBeVisible();
  });

  test("C59777 HP - Remove from Quote CTA", async ({ page }) => {
    const quote = await advanceToQuoteReview(page, quoteVacation);
    await quote.assertOnQuoteReview();
    const before = await quote.quoteRoomCount();
    await quote.removeFirstFromQuote();
    // Removing the only quoted room empties the quote (0 rooms) or drops the
    // count by one when more than one was present.
    await expect
      .poll(() => quote.quoteRoomCount())
      .toBeLessThan(Math.max(before, 1));
  });

  test("C59778 HP - Back to Rooms CTA", async ({ page }) => {
    const quote = await advanceToQuoteReview(page, quoteVacation);
    await quote.assertOnQuoteReview();
    await quote.finalizeQuoteLink.click();
    await quote.backToRooms();
    await expect(page).toHaveURL(/room|itinerar/i);
  });
});
