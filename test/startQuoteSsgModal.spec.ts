import { expect, test } from "../test-data/fixtures";
import { VacationPage } from "../page-object/VacationPage";
import ssg from "../test-data/ssgFixture";

/**
 * Step 1 – Vacation > Send Quote > SSG Modal.
 * Mirrors the Book Now SSG modal, entered from quote mode.
 * Entry (TA Portal → sign in → launch OBETA) is handled by the `page` fixture.
 * Happy-path lookups skip when SSG_LOOKUP_EMAIL is unset. Set
 * SSG_LOOKUP_EMAIL_1 and SSG_LOOKUP_LAST_NAME_1 in .env to a valid account
 * email for the target environment to enable them.
 */

// Skip happy-path SSG tests when credentials are missing.
const ssgHappyPathSkip = !ssg.validEmail;

test.beforeEach(async ({ page }) => {
  const vacation = new VacationPage(page);
  await vacation.selectSendQuote();
});

test('C59117 HP - "Look it up" CTA', async ({ page }) => {
  test.skip(
    ssgHappyPathSkip,
    "SSG happy-path skipped: update SSG_LOOKUP_EMAIL_1 / SSG_LOOKUP_LAST_NAME_1 in .env with a valid account email for the target environment."
  );
  const vacation = new VacationPage(page);

  await vacation.openSsgLookup();
  await vacation.fillSsgLastName(ssg.validLastName);
  await vacation.fillSsgEmail(ssg.validEmail);
  await vacation.searchSsg();
  await expect(vacation.ssgAccountResult).toBeVisible();

  await vacation.useThisSsgNumber();
  await expect(vacation.ssgModal).toBeHidden();
  await expect(vacation.ssgNumberInput).not.toHaveValue("");
});

test("C60919 HP - Start a new search CTA", async ({ page }) => {
  test.skip(
    ssgHappyPathSkip,
    "SSG happy-path skipped: update SSG_LOOKUP_EMAIL_1 / SSG_LOOKUP_LAST_NAME_1 in .env with a valid account email for the target environment."
  );
  const vacation = new VacationPage(page);

  await vacation.openSsgLookup();
  await vacation.fillSsgLastName(ssg.validLastName);
  await vacation.fillSsgEmail(ssg.validEmail);
  await vacation.searchSsg();
  await expect(vacation.ssgAccountResult).toBeVisible();

  await vacation.startNewSsgSearch();
  await expect(vacation.ssgEmailInput).toHaveValue("");
});

test("C59118 SP - User inputs an invalid email address", async ({ page }) => {
  const vacation = new VacationPage(page);

  await vacation.openSsgLookup();
  await vacation.fillSsgEmail(ssg.invalidEmail);
  await vacation.searchSsg();

  await expect(vacation.ssgError).toBeVisible();
});

test("C59119 SP - User inputs an email address not linked to an SSG number", async ({
  page,
}) => {
  const vacation = new VacationPage(page);

  await vacation.openSsgLookup();
  await vacation.fillSsgEmail(ssg.unlinkedEmail);
  await vacation.searchSsg();

  await expect(vacation.ssgError).toBeVisible();
});

test("C59120 SP - User makes a blank input", async ({ page }) => {
  const vacation = new VacationPage(page);

  await vacation.openSsgLookup();
  await vacation.searchSsg();

  await expect(vacation.ssgSearchButton).toBeVisible();
});

test("C59121 SP - User inputs special characters", async ({ page }) => {
  const vacation = new VacationPage(page);

  await vacation.openSsgLookup();
  await vacation.fillSsgEmail(ssg.specialCharsEmail);
  await vacation.searchSsg();

  await expect(vacation.ssgError).toBeVisible();
});

test("C59122 SP - User inputs numbers", async ({ page }) => {
  const vacation = new VacationPage(page);

  await vacation.openSsgLookup();
  await vacation.fillSsgEmail(ssg.numbersEmail);
  await vacation.searchSsg();

  await expect(vacation.ssgError).toBeVisible();
});

test("C60934 SP - User inputs a valid email address with trailing spaces", async ({
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

  await expect(vacation.ssgAccountResult).toBeVisible();
});

test("C60935 SP - User inputs a valid email address with leading spaces", async ({
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
