import { VacationData } from "./types";
import { getRandomDateRange } from "../utils/getRandomDateRange";

/**
 * Beaches per-resort occupancy fixtures for the Step-2 guest-limit negative
 * paths (room.spec.ts "> Beaches" describes).
 *
 * Each Beaches resort caps the guests per room differently — the TestRail
 * titles pin the limits below:
 *   • Beaches Ocho Rios ......... max 5  guests / room
 *   • Beaches Negril ............ max 18 guests / room
 *   • Beaches Turks & Caicos .... max 14 guests / room
 *
 * The negative-path tests attempt to exceed these limits (or omit a required
 * child age / infant birthday) and assert the app enforces the rule. Because
 * the exact over-occupancy validation copy is not yet verified on the live env,
 * the specs use RoomPage.assertGuestLimitEnforced() (a resilient signal) rather
 * than a hard-coded message — see docs/SELF_HEALING.md.
 *
 * NOTE: resort / destination labels must match the live OBETA dropdown copy;
 * verify against the DOM if selection fails ([OBETA-TODO]).
 */
const dates = getRandomDateRange(6);

const sharedDates = {
  monthFrom: dates.month,
  dateFrom: dates.from,
  dateTo: dates.to,
  yearFrom: dates.year,
};

export interface BeachesResortOccupancy {
  /** Resort dropdown label. */
  resort: string;
  /** Destination island the resort belongs to. */
  destination: string;
  /** Maximum guests per room this resort allows. */
  maxGuests: number;
  /** A ready-to-use Step-1 vacation input for this resort (2 adults default). */
  data: VacationData;
}

function build(
  resort: string,
  destination: string,
  maxGuests: number
): BeachesResortOccupancy {
  return {
    resort,
    destination,
    maxGuests,
    data: {
      destination,
      resort,
      ...sharedDates,
      guests: { adults: 2 },
    },
  };
}

export const beachesOchoRios = build("Beaches Ocho Rios", "Jamaica", 5);
export const beachesNegril = build("Beaches Negril", "Jamaica", 18);
export const beachesTurksAndCaicos = build(
  "Beaches Turks & Caicos",
  "Turks & Caicos",
  14
);

export default {
  ochoRios: beachesOchoRios,
  negril: beachesNegril,
  turksAndCaicos: beachesTurksAndCaicos,
};
