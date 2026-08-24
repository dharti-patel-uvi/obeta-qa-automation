import { expect, test } from "../test-data/fixtures";
import { VacationPage } from "../page-object/VacationPage";
import ssg from "../test-data/ssgFixture";

/**
 * Step 1 – Vacation > Book Now section > SSG (Sandals Select Rewards) Modal.
 *
 * Entry (TA Portal → sign in → launch OBETA) is handled by the `page` fixture.
 * The happy-path lookups need a real SSG-linked email in the target env; they
 * skip cleanly when SSG_LOOKUP_EMAIL_1 is unset (set SSG_LOOKUP_EMAIL_1 and
 * SSG_LOOKUP_LAST_NAME_1 in .env to a valid account to enable them).
 */

// Guard: skip happy-path SSG tests when credentials are missing.
const ssgHappyPathSkip = !ssg.validEmail;

test('C59098 HP - "Look it up" CTA', async ({ page }) => {
  test.skip(
    ssgHappyPathSkip,
    "SSG happy-path skipped: update SSG_LOOKUP_EMAIL_1 / SSG_LOOKUP_LAST_NAME_1 in .env with a valid account email for the target environment."
  );
  const vacation = new VacationPage(page);

  await vacation.openSsgLookup();
  await vacation.fillSsgLastName(ssg.validLastName);
  await vacation.fillSsgEmail(ssg.validEmail);
  await expect(vacation.ssgEmailInput).toHaveValue(ssg.validEmail);

  await vacation.searchSsg();
  await expect(vacation.ssgAccountResult).toBeVisible();

  await vacation.useThisSsgNumber();
  // Modal closes and the SSG number lands in the rewards-number field.
  await expect(vacation.ssgModal).toBeHidden();
  await expect(vacation.ssgNumberInput).not.toHaveValue("");
});

test("C60931 HP - Start a new search CTA", async ({ page }) => {
  test.skip(
    ssgHappyPathSkip,
    "SSG happy-path skipped: update SSG_LOOKUP_EMAIL_1 / SSG_LOOKUP_LAST_NAME_1 in .env with a valid account email for the target environment."
  );
  const vacation = new VacationPage(page);
  await vacation.openSsgLookup();
  await vacation.fillSsgLastName(ssg.validLastName);
  await vacation.fillSsgEmail(ssg.validEmail);
  await expect(vacation.ssgEmailInput).toHaveValue(ssg.validEmail);

  await vacation.searchSsg();
  await expect(vacation.ssgAccountResult).toBeVisible();

  await vacation.startNewSsgSearch();
  // Returns to the lookup screen with an empty email field.
  await expect(vacation.ssgEmailInput).toBeVisible();
  await expect(vacation.ssgEmailInput).toHaveValue("");
});

test("C59099 SP - User inputs an invalid email address", async ({ page }) => {
  const vacation = new VacationPage(page);

  await vacation.openSsgLookup();
  await vacation.fillSsgEmail(ssg.invalidEmail);
  await vacation.searchSsg();
  await expect(vacation.ssgError).toBeVisible();
});

test("C59102 SP - User inputs an email address not linked to an SSG number", async ({
  page,
}) => {
  const vacation = new VacationPage(page);

  await vacation.openSsgLookup();
  await vacation.fillSsgEmail(ssg.unlinkedEmail);
  await vacation.searchSsg();

  await expect(vacation.ssgError).toBeVisible();
});

test("C59103 SP - User makes a blank input", async ({ page }) => {
  const vacation = new VacationPage(page);

  await vacation.openSsgLookup();
  await vacation.searchSsg();

  await expect(vacation.ssgSearchButton).toBeVisible();
});

test("C59104 SP - User inputs special characters", async ({ page }) => {
  const vacation = new VacationPage(page);

  await vacation.openSsgLookup();
  await vacation.fillSsgEmail(ssg.specialCharsEmail);
  await vacation.searchSsg();

  await expect(vacation.ssgError).toBeVisible();
});

test("C59105 SP - User inputs numbers", async ({ page }) => {
  const vacation = new VacationPage(page);

  await vacation.openSsgLookup();
  await vacation.fillSsgEmail(ssg.numbersEmail);
  await vacation.searchSsg();

  await expect(vacation.ssgError).toBeVisible();
});

test("C60932 SP - User inputs a valid email address with trailing spaces", async ({
  page,
}) => {
  test.skip(
    ssgHappyPathSkip,
    "SSG happy-path skipped: update SSG_LOOKUP_EMAIL_1 / SSG_LOOKUP_LAST_NAME_1 in .env with a valid account email for the target environment."
  );
  const vacation = new VacationPage(page);

  await vacation.openSsgLookup();
  await vacation.fillSsgLastName(ssg.validLastName);
  await vacation.fillSsgEmail(ssg.validEmail + "   ");
  await vacation.searchSsg();

  // Trailing whitespace must be trimmed and the account still found.
  await expect(vacation.ssgAccountResult).toBeVisible();
});

test("C60933 SP - User inputs a valid email address with leading spaces", async ({
  page,
}) => {
  test.skip(
    ssgHappyPathSkip,
    "SSG happy-path skipped: update SSG_LOOKUP_EMAIL_1 / SSG_LOOKUP_LAST_NAME_1 in .env with a valid account email for the target environment."
  );
  const vacation = new VacationPage(page);

  await vacation.openSsgLookup();
  await vacation.fillSsgLastName(ssg.validLastName);
  await vacation.fillSsgEmail("   " + ssg.validEmail);
  await vacation.searchSsg();

  await expect(vacation.ssgAccountResult).toBeVisible();
});
