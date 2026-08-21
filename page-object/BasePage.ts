import { Locator, Page } from "@playwright/test";

/**
 * Abstract base for every OBETANG page object.
 * Holds the Playwright `Page`, a `path`, and flakiness-resistant interaction
 * helpers. Ported as-is from the NOBE framework — prefer these helpers over
 * raw Playwright calls in new page-object code.
 */
export default abstract class BasePage {
  readonly page: Page;
  public path!: string;

  constructor(page: Page) {
    this.page = page;
  }

  setPath(path: string) {
    this.path = path;
  }

  async navigate() {
    await this.page.goto(this.path);
  }

  async clickElementByText(text: string) {
    await this.page.getByText(text).click();
  }

  async clickElementByPlaceholder(placeholder: string) {
    await this.page.getByPlaceholder(placeholder).click();
  }

  async clickElementByLabel(label: string) {
    await this.page.getByLabel(label).click();
  }

  async clickElementByRole(role: any, options: any) {
    await this.page.getByRole(role, options).click();
  }

  async clickElementByTestId(testId: string) {
    await this.page.getByTestId(testId).click();
  }

  async selectOptionFromList(listSelector: Locator, option: string) {
    await listSelector.click();
    await this.page.getByRole("option", { name: option }).click();
  }

  /* Consistent wait strategies to reduce flakiness */

  /**
   * Wait for page navigation with URL pattern and DOM ready state.
   * Replaces arbitrary waitForTimeout() calls with explicit waits.
   */
  async waitForPageNavigation(urlPattern: RegExp, timeout = 30000) {
    return Promise.all([
      this.page.waitForURL(urlPattern, { timeout }),
      this.page.waitForLoadState("domcontentloaded", { timeout }),
    ]);
  }

  /**
   * Wait for element to be visible before interaction.
   */
  async waitForElementReady(locator: Locator, timeout = 10000): Promise<void> {
    await locator.waitFor({ state: "visible", timeout });
  }

  /**
   * Click element after ensuring it is visible and enabled.
   */
  async clickWhenReady(locator: Locator, timeout = 10000): Promise<void> {
    await this.waitForElementReady(locator, timeout);
    const isEnabled = await locator.isEnabled().catch(() => false);
    if (!isEnabled) {
      throw new Error("Element is not enabled for interaction");
    }
    await locator.click();
  }

  /**
   * Safe fill with retry logic for form inputs.
   * Handles transient failures and network latency.
   */
  async fillSafe(
    locator: Locator,
    text: string,
    maxRetries = 2,
    timeout = 5000
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.waitForElementReady(locator, timeout);
        await locator.fill(text);
        const value = await locator.inputValue().catch(() => "");
        if (value === text) {
          return;
        }
        throw new Error(
          `Fill verification failed. Expected: ${text}, Got: ${value}`
        );
      } catch (e) {
        lastError = e as Error;
        if (attempt < maxRetries) {
          await this.page.waitForTimeout(500 * attempt); // Exponential backoff
        }
      }
    }
    throw lastError;
  }

  /**
   * Wait for a loading indicator to clear before proceeding.
   */
  async waitForLoadingToClear(timeout = 10000): Promise<void> {
    const spinner = this.page
      .locator('[aria-busy="true"], .loading, [role="progressbar"]')
      .first();
    await spinner.waitFor({ state: "hidden", timeout }).catch(() => undefined);
  }

  /**
   * Scroll element into view and ensure it is stable before interaction.
   */
  async scrollToElementAndWait(
    locator: Locator,
    timeout = 10000
  ): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
    await this.waitForElementReady(locator, timeout);
  }

  /**
   * Resilient locator resolver for selectors that legitimately have more than
   * one valid form across environments (see docs/SELF_HEALING.md).
   *
   * Tries each candidate in order, returns the first whose `.first()` becomes
   * visible within `timeout`, and logs a warning naming the winner so the
   * page object can later be hardened to that single selector. Throws if none
   * match.
   *
   * Use sparingly — a verified single testid is always better than a fallback
   * list. This is a bridge for the healing phase, not a permanent substitute
   * for correct selectors.
   */
  async resolveFirst(candidates: Locator[], timeout = 4000): Promise<Locator> {
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i].first();
      const isVisible = await candidate
        .isVisible({ timeout })
        .catch(() => false);
      if (isVisible) {
        if (i > 0) {
          console.warn(
            `[resolveFirst] Matched fallback candidate #${i + 1} of ` +
              `${candidates.length}. Harden the page object to this selector.`
          );
        }
        return candidate;
      }
    }
    throw new Error(
      `resolveFirst: none of the ${candidates.length} candidate locators matched.`
    );
  }
}
