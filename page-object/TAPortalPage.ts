import BasePage from "./BasePage";
import { obetangBaseUrl, taPortalUrl } from "../utils/env";
import { BrowserContext, Locator, Page, expect } from "@playwright/test";

/**
 * TA Portal (agent portal) — the ONLY entry point to the OBETANG booking engine.
 *
 * An agent must launch the portal, sign in, and then launch a booking; only
 * then does the OBETANG Step 1 – Vacation page load. See CLAUDE.md.
 *
 * SELECTOR PROVENANCE: everything here is `[TANG-TODO]` — best-effort guesses
 * for the portal DOM, which has not been verified against tang-portal-dev.
 * Re-derive against the live portal (see docs/SELF_HEALING.md) on first run.
 */
export class TAPortalPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly bookOrQuoteLink: Locator;
  readonly bookNowButton: Locator;
  readonly sendQuoteTab: Locator;
  // readonly dashboardMarker: Locator;

  constructor(page: Page) {
    super(page);
    // The portal lives on a different host than the app under test, so navigate
    // by absolute URL rather than Playwright's baseURL. The URL is resolved from
    // TARGET_ENV (defaults to dev — see utils/env.ts and the project rules).
    super.setPath(taPortalUrl());

    this.usernameInput = page
      .getByRole("textbox", { name: /user\s*name|username|email/i })
      .or(page.getByLabel(/user\s*name|username/i))
      .first();
    // The password field has no accessible name and its "Password" label is not
    // associated with the input, so role-name / getByLabel don't resolve it.
    // Verified against the live portal: the input carries a stable id
    // (#login-password-input); fall back to type= in case that drifts.
    this.passwordInput = page
      .locator("#login-password-input")
      .or(page.locator('input[type="password"]'))
      .first();
    this.signInButton = page.getByRole("button", {
      name: /sign ?in|log ?in|submit/i,
    });
    // Control that launches the OBE booking engine from the portal. On the
    // authenticated dashboard this is an anchor (role=link). Verified against the
    // live portal: the link is labelled "Book / Quote"; keep the older
    // "Make a Booking" wording as a fallback for other environments.
    this.bookOrQuoteLink = page.getByRole("link", { name: "Book / Quote" });
    this.bookNowButton = page.getByText("BOOK NOW");
    this.sendQuoteTab = page.getByRole("tab", { name: "Send Quote" });
    // Any element that only exists once authenticated (confirms login worked).
    // this.dashboardMarker = this.bookOrQuoteLink;
  }

  /** Assert the sign-in form is presented (unauthenticated state). */
  async assertLoginPageElements() {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.signInButton).toBeVisible();
  }

  /** Assert we reached the authenticated dashboard (the launch control shows). */
  async assertLoggedIn() {
    await expect(this.bookOrQuoteLink).toBeVisible({ timeout: 60000 });
  }

  /**
   * Submit credentials WITHOUT waiting for the dashboard — used by the negative
   * path where the sign-in is expected to fail. Mirrors login()'s hydration
   * wait so the click doesn't race the SPA, but does not assert success.
   */
  async submitCredentials(user: string, password: string) {
    await this.usernameInput.waitFor({ state: "visible", timeout: 30000 });
    await this.usernameInput.fill(user);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  /** Assert the sign-in was rejected: no dashboard, still on the login form. */
  async assertNotLoggedIn() {
    await expect(this.bookOrQuoteLink).toBeHidden();
    await expect(this.usernameInput).toBeVisible();
  }

  async login(user: string, password: string) {
    // Wait for the SPA's JS to load & hydrate before interacting; otherwise the
    // Sign in click races hydration and triggers a native GET form submit
    // (credentials land in the URL and the page reloads instead of logging in).
    await this.usernameInput.waitFor({ state: "visible", timeout: 30000 });
    await this.usernameInput.fill(user);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
    // Login is an async request (the Sign in button shows a spinner); the
    // authenticated dashboard can take a while to render, so wait generously.
    // NOTE: only confirm we're signed in here — the actual launch (clicking
    // "Book / Quote") happens in launchObeta so its popup listener is armed
    // BEFORE the click. Clicking here as well caused a missed popup / stranded
    // dashboard state.
    await this.bookOrQuoteLink.waitFor({ state: "visible", timeout: 60000 });
  }

  /**
   * Launch the OBETANG booking engine from the portal and return the Page that
   * now shows Step 1 – Vacation. Handles both same-tab redirects and the portal
   * opening the engine in a new tab/popup.
   *
   * FORMER: clicked a "BOOK NOW" button after login pre-clicked the launch link,
   * with the popup listener armed too late — this stranded the run on the portal
   * dashboard. The portal launches OBETA directly from the "Book / Quote" link
   * (verified via codegen); "BOOK NOW" is a tab ON the vacation form, not a
   * portal control.
   */
  async launchObeta(context: BrowserContext): Promise<Page> {
    const obetangHost = new URL(obetangBaseUrl()).host;
    const isObeta = (p: Page) => p.url().includes(obetangHost);

    // The launch either navigates this tab or opens a new one, and the
    // external-auth redirect can be slow. Clicking too soon after the dashboard
    // renders can lose the click to hydration, so poll all context pages for
    // the engine and re-click if nothing has happened.
    const deadline = Date.now() + 60000;
    let clicks = 0;
    while (Date.now() < deadline) {
      const existing = context.pages().find(isObeta);
      if (existing) {
        await existing
          .waitForLoadState("domcontentloaded")
          .catch(() => undefined);
        await existing
          .getByTestId("select-destination-ui")
          .waitFor({ state: "visible", timeout: 45000 });
        return existing;
      }
      // (Re)click the launch link at most a few times, spaced out.
      if (clicks < 4) {
        await this.bookOrQuoteLink.click().catch(() => undefined);
        clicks++;
      }
      await this.page.waitForTimeout(2000);
    }
    throw new Error(
      `launchObeta: OBETA engine (${obetangHost}) never opened after ${clicks} launch clicks.`
    );
  }
}
