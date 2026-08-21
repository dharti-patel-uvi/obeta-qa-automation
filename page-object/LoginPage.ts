import { Locator, Page, expect } from "@playwright/test";

/**
 * Member / SSG sign-in ("Sandals Select Rewards") modal accessible from Step 1
 * of the OBETANG agent booking engine.
 *
 * SELECTOR PROVENANCE
 * -------------------
 * `[NOBE]`   – carried over from NOBE; confirm against the agent DOM.
 * `[OBE-NG]` – ported from `obe-e2e-nextgen-master/page-object/sandals/LoginPage.ts`,
 *              verified against the consumer OBE. The Recover Username/Password
 *              and Create Account links open the Guest Portal in a popup tab.
 */
export class LoginPage {
  private page: Page;

  private emailInput: Locator;
  private passwordInput: Locator;
  private signInButton: Locator;
  private signInModalButton: Locator;
  private createAccountLink: Locator;
  private enrollYourAgencyLink: Locator;
  private recoverUsernameLink: Locator;
  private recoverPasswordLink: Locator;
  private signOutLink: Locator;
  private brandLogo: Locator; // [OBE-NG]
  private memberLevelText: Locator; // [OBE-NG]

  constructor(page: Page) {
    this.page = page;

    this.emailInput = page.getByTestId("input-name-ui");
    this.passwordInput = page.getByTestId("input-password-ui");
    // Accept either the OBETA "Sign in or Join" or the OBE "SIGN-IN OR JOIN"
    // rendering (case-insensitive).
    this.signInButton = page.getByRole("button", {
      name: /Sign[- ]?in( or Join)?/i,
    });
    this.signInModalButton = page.getByTestId("submit-ui");
    this.recoverUsernameLink = page.getByRole("link", { name: "Username" });
    this.recoverPasswordLink = page.getByRole("link", { name: "Password" });

    this.enrollYourAgencyLink = page.getByRole("link", {
      name: "Enroll Your Agency",
    });
    this.createAccountLink = page.getByRole("link", {
      name: "Create Your Account",
    });
    this.signOutLink = page.getByRole("button", { name: /SIGN-?OUT/i });
    this.brandLogo = page.locator(".cursor-pointer").first();
    this.memberLevelText = page.getByText(/Level:\s*Member/i);
  }

  async assertPageElements() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    // await expect(this.signInModalButton).toBeVisible();
    // await expect(this.recoverUsernameLink).toBeVisible();
    await expect(this.recoverPasswordLink).toBeVisible();
    await expect(this.createAccountLink).toBeVisible();
  }

  /** [OBE-NG] Assert the signed-in state (member greeting / level shown). */
  async assertLoggedPageElements(name: string) {
    if (name) {
      await expect(this.page.getByText(new RegExp(name, "i"))).toBeVisible();
    }
    await expect(this.memberLevelText).toBeVisible();
  }

  async signInClick() {
    await this.signInButton.click();
  }

  async fillLoginData(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInModalButton.click();
  }

  async recoverUsernameClick() {
    await this.recoverUsernameLink.click();
  }

  async recoverPasswordClick() {
    await this.recoverPasswordLink.click();
  }

  async createAccountClick() {
    await this.createAccountLink.click();
  }

  async signOutClick() {
    await this.signOutLink.click();
  }

  /** [OBE-NG] Click the brand logo (returns to the vacation landing surface). */
  async brandLogoClick() {
    await this.brandLogo.click();
  }
}
