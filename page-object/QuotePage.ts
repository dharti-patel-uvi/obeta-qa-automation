import BasePage from "./BasePage";
import { expect, Locator, Page } from "@playwright/test";

/**
 * Send Quote → Quote cart → Finalize Quote (/review/) → Quote Sent confirmation
 * (/quote-confirmation/) for the OBETANG agent booking engine.
 *
 * Reached in Send Quote mode after the agent adds one or more rooms to the quote
 * and opens the quote cart (see RoomPage.continueToQuoteReview()). The cart's
 * "FINALIZE QUOTE" link navigates to the /review/ form where the client's name +
 * email are entered; submitting sends the quote and lands on the
 * /quote-confirmation/ "Quote Sent!" page.
 *
 * Send Quote does NOT include flights — the app shows the note "Due to the
 * dynamic nature of flight pricing, we are unable to include airfare in quotes."
 * (see CLAUDE.md), so there is no flight step on this path.
 *
 * SCOPE: Sending a quote is IN SCOPE — it is neither a booking nor a payment
 * (CLAUDE.md forbids only successful payment/booking/confirmation).
 *
 * SELECTOR PROVENANCE
 * -------------------
 * `[REC]`  – verified against the live flow: the codegen recording
 *            (`test/test-2.spec.ts`, stg) and the captured room/cart DOM
 *            snapshot. Treated as verified.
 * `[OBETA-TODO]` – best-effort guesses not yet exercised live (see
 *            docs/SELF_HEALING.md).
 */
export class QuotePage extends BasePage {
  // Submitting the finalize form navigates to /quote-confirmation/; the finalize
  // form itself lives at /review/. Keep /review/ as the page's nominal path.
  readonly path = "/review/";

  // --- Quote cart (opened from the room listing) ---
  readonly quoteCartButton: Locator; // [REC] "Quote N" badge / cart toggle
  readonly finalizeQuoteLink: Locator; // [REC] cart → /review/ finalize form
  readonly quoteRoomCard: Locator; // [REC] a room currently in the quote
  readonly quoteReviewHeading: Locator; // [OBETA-TODO] kept for back-compat

  // --- Per-room CTAs ---
  readonly viewRoomButton: Locator; // [REC] "View Room Details" — C59776
  readonly removeFromQuoteButton: Locator; // [REC] "REMOVE FROM QUOTE" — C59777
  readonly backToRoomsButton: Locator; // [REC] top-nav "Room" link — C59778

  // --- Finalize Quote form (/review/) ---
  readonly firstNameInput: Locator; // [REC]
  readonly lastNameInput: Locator; // [REC]
  readonly recipientEmailInput: Locator; // [REC] client email (required)
  readonly personalMessageInput: Locator; // [REC] optional personalized message
  readonly sendQuoteButton: Locator; // [REC] form-vacation-submit-button-ui

  // --- Confirmation (/quote-confirmation/) ---
  readonly quoteSentConfirmation: Locator; // [REC] "Quote Sent!"
  readonly backToPortalLink: Locator; // [REC]

  constructor(page: Page) {
    super(page);
    super.setPath(this.path);

    // The quote cart is a drawer in the header. Its toggle is a "Quote N" button
    // whose label carries the room count; the drawer holds the FINALIZE QUOTE
    // link that advances to /review/.
    this.quoteCartButton = page
      .getByRole("button", { name: /Quote\s*\d+/i })
      .first();
    this.finalizeQuoteLink = page
      .getByRole("link", { name: /FINALIZE QUOTE/i })
      .first();
    // Each room currently in the quote renders a "REMOVE FROM QUOTE" CTA on the
    // room listing (the card's ADD TO QUOTE flips to REMOVE FROM QUOTE once
    // added), so this doubles as the "rooms in quote" marker.
    this.quoteRoomCard = page.getByRole("button", {
      name: /REMOVE FROM QUOTE/i,
    });
    this.quoteReviewHeading = page
      .getByRole("heading", { name: /Quote|Review/i })
      .first();

    // [REC] "View Room Details" CTA on the room listing card. The quote cart
    // drawer must be CLOSED before clicking (viewRoom() handles that) so the
    // card is not behind the drawer overlay.
    this.viewRoomButton = page.getByText("View Room Details").first();
    this.removeFromQuoteButton = page
      .getByRole("button", { name: /REMOVE FROM QUOTE/i })
      .first();
    // No dedicated "Back to Rooms" CTA exists on this surface; the header "Room"
    // nav link returns to the room listing.
    // this.backToRoomsButton = page
    //   .getByRole("link", { name: "Room", exact: true })
    //   .first();

    this.backToRoomsButton = page.getByText("Room").first();
    // Finalize form. Co-branding is left OFF, so only the primary First/Last/
    // Email fields are present — match the first of each. [REC]
    this.firstNameInput = page
      .getByRole("textbox", { name: /First Name/i })
      .first();
    this.lastNameInput = page
      .getByRole("textbox", { name: /Last Name/i })
      .first();
    this.recipientEmailInput = page
      .getByRole("textbox", { name: /Email/i })
      .first();
    this.personalMessageInput = page.locator("textarea").first();
    this.sendQuoteButton = page.getByTestId("form-vacation-submit-button-ui");

    this.quoteSentConfirmation = page.getByText(/Quote Sent!?/i).first();
    this.backToPortalLink = page.getByRole("link", {
      name: /Back to Travel Advisor Portal/i,
    });
  }

  /* ---------------------------------------------------------------- */
  /* Assertions                                                        */
  /* ---------------------------------------------------------------- */

  /**
   * Confirm the quote cart opened with at least one quoted room — the FINALIZE
   * QUOTE link is the definitive "a quote is ready to finalize" signal.
   */
  async assertOnQuoteReview(): Promise<void> {
    await expect(this.finalizeQuoteLink).toBeVisible();
  }

  /**
   * How many rooms are currently in the quote, read from the "Quote N" cart
   * badge (0 when the badge is gone — i.e. the quote is empty).
   */
  async quoteRoomCount(): Promise<number> {
    if (!(await this.quoteCartButton.isVisible().catch(() => false))) return 0;
    const text = (await this.quoteCartButton.textContent()) ?? "";
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /* ---------------------------------------------------------------- */
  /* Per-room CTAs (C59776–C59778)                                     */
  /* ---------------------------------------------------------------- */

  /** C59776 — open a quoted room's details from the listing.
   *  Closes the cart drawer first so the room card is not behind the overlay. */
  async viewRoom(): Promise<void> {
    // The quote cart drawer overlays the room listing and intercepts pointer
    // events on the cards behind it. Toggle the cart closed before clicking.
    if (await this.quoteCartButton.isVisible().catch(() => false)) {
      await this.quoteCartButton.click();
      await this.page.waitForTimeout(400);
    }
    await this.clickWhenReady(this.viewRoomButton);
  }

  /** C59777 — remove the first room from the quote. */
  async removeFirstFromQuote(): Promise<void> {
    await this.clickWhenReady(this.removeFromQuoteButton);
    await this.page.waitForTimeout(1500); // let the cart badge re-render
  }

  /** C59778 — return to the Rooms listing. */
  async backToRooms(): Promise<void> {
    await this.clickWhenReady(this.backToRoomsButton);
    await this.page
      .waitForURL(/room|itinerar/i, { timeout: 60000 })
      .catch(() => undefined);
  }

  /* ---------------------------------------------------------------- */
  /* Send quote (C59779)                                              */
  /* ---------------------------------------------------------------- */

  /**
   * C59779 — finalize and send the quote, then assert the "Quote Sent!"
   * confirmation. Opens the finalize form from the cart (if not already there),
   * fills the required client name + email, adds an optional personalized
   * message, and submits.
   *
   * Sending a quote is IN SCOPE (not a payment/booking — see CLAUDE.md).
   */
  async sendQuote(
    recipientEmail: string,
    firstName = "QA",
    lastName = "Tester"
  ): Promise<void> {
    // From the quote cart, open the Finalize Quote form (/review/).
    if (await this.finalizeQuoteLink.isVisible().catch(() => false)) {
      await this.clickWhenReady(this.finalizeQuoteLink);
      await this.page
        .waitForURL(/review/i, { timeout: 60000 })
        .catch(() => undefined);
    }

    await this.fillSafe(this.firstNameInput, firstName);
    await this.fillSafe(this.lastNameInput, lastName);
    await this.fillSafe(this.recipientEmailInput, recipientEmail);

    // The personalized message is optional — fill it best-effort.
    if (await this.personalMessageInput.isVisible().catch(() => false)) {
      await this.personalMessageInput
        .fill("Here is your personalized quote.")
        .catch(() => undefined);
    }

    await this.clickWhenReady(this.sendQuoteButton);
    await expect(this.quoteSentConfirmation).toBeVisible({ timeout: 30000 });
  }
}
