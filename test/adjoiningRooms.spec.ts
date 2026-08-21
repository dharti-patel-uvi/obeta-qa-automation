import { expect, test } from "../test-data/fixtures";
import { VacationPage } from "../page-object/VacationPage";
import beachesData from "../test-data/beachesFixture";

/**
 * Step 1 – Vacation > Book Now section > Adjoining Rooms Modal.
 * Entry (TA Portal → sign in → launch OBETA) is handled by the `page` fixture.
 *
 * Adjoining Rooms is a Beaches-only feature: the controls only appear once a
 * Beaches resort is selected. Each test therefore selects a Beaches resort
 * first; VacationPage guards the adjoining-rooms actions on that condition.
 */

test('C59123 HP - "i" more information icon', async ({ page }) => {
  const vacation = new VacationPage(page);

  await vacation.chooseDestination(beachesData.destination);
  await vacation.chooseResort(beachesData.resort);
  expect(vacation.isBeachesResort()).toBeTruthy();

  await vacation.openAdjoiningRoomsInfo();
  await expect(vacation.adjoiningRoomsModal).toBeVisible();
  await expect(vacation.adjoiningRoomsModalTextContent).toBeVisible();

  await vacation.closeModal.click();
  await expect(vacation.adjoiningRoomsModal).toBeHidden();
});

test('C59124 HP - User checks the "I would like to request adjoining rooms" checkbox', async ({
  page,
}) => {
  const vacation = new VacationPage(page);

  await vacation.chooseDestination(beachesData.destination);
  await vacation.chooseResort(beachesData.resort);
  expect(vacation.isBeachesResort()).toBeTruthy();

  await vacation.requestAdjoiningRooms();
  await expect(vacation.adjoiningRoomsCheckbox).toBeChecked();
});
