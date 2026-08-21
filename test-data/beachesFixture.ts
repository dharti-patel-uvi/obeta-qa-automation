import { VacationData } from "./types";
import { getRandomDateRange } from "../utils/getRandomDateRange";

/**
 * Beaches-brand vacation input for Step 1.
 *
 * Adjoining Rooms is a Beaches-only feature (the controls only render when the
 * selected resort is a Beaches property — see VacationPage.isBeachesResort),
 * so those specs must select a resort whose name starts with "Beaches".
 *
 * "Beaches Negril" is reused deliberately: its destination is "Jamaica", a
 * known-good entry already exercised by the core vacation fixture. Dynamic
 * future dates keep runs off stale/sold-out data.
 *
 * NOTE: resort/destination labels must match the live OBETA dropdown copy —
 * verify against the DOM if selection fails (see docs/SELF_HEALING.md).
 */
const dates = getRandomDateRange(6);

const beachesData: VacationData = {
  destination: "Jamaica",
  resort: "Beaches Negril",
  monthFrom: dates.month,
  dateFrom: dates.from,
  dateTo: dates.to,
  yearFrom: dates.year,
  guests: {
    adults: 2,
  },
};

/**
 * Single-guest Beaches input. Beaches (family) resorts expose the Guests
 * stepper (Sandals couples resorts lock it at 2), so a solo traveller (1 adult)
 * is only expressible on a Beaches property — this fixture exercises that path.
 */
export const beachesSingleGuest: VacationData = {
  ...beachesData,
  guests: {
    adults: 1,
  },
};

export default beachesData;
