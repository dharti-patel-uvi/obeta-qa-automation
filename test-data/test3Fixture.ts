import { VacationData } from "./types";
import { getRandomDateRange } from "../utils/getRandomDateRange";

/**
 * Scenario data for the two contrasting journeys captured in the raw
 * `test/test-3.spec.ts` codegen recording, split by resort brand:
 *
 *   • test-3s — Sandals (adults-only) resort, WITH roundtrip flights, and a
 *     specific room (Overwater Bungalow).
 *   • test-3b — Beaches (family) resort, 5 guests, NO flights.
 *
 * Dynamic future dates (shared between both scenarios) keep runs off
 * stale/sold-out availability. Clone-and-override rather than editing in place.
 */
const dates = getRandomDateRange(6);

const sharedDates = {
  monthFrom: dates.month,
  dateFrom: dates.from,
  dateTo: dates.to,
  yearFrom: dates.year,
};

/**
 * Shared payment card for the Step 5 payment step of the complex scenarios.
 * Visa test card from CLAUDE.md. NOTE: intentionally has **no `cvv`** — the CVV
 * is never entered and the form is never submitted (see PaymentInfo / CLAUDE.md).
 */
const sharedPayment = {
  cardHolder: "Test Agent",
  cardNumber: "4111111111111111",
  expiration: { month: "01", year: "2041" },
};

/**
 * A distinct SECOND card (MasterCard test card from CLAUDE.md) for the two-card
 * payment layout on the Sandals scenario. Also intentionally has **no `cvv`**.
 */
export const secondCard = {
  cardHolder: "Test Agent Two",
  cardNumber: "5105105105105100",
  expiration: { month: "02", year: "2040" },
};

/** test-3s: Sandals Dunn's River, roundtrip flights, Overwater Bungalow room. */
export const sandalsWithFlights: VacationData = {
  destination: "Jamaica",
  resort: "Sandals Caribbean Cay",
  ...sharedDates,
  // Sandals (couples / adults-only) resorts lock the Guests control at 2 adults.
  guests: { adults: 2 },
  flight: {
    airport: "Miami",
    city: "MIAMI, FLORIDA (FL), USA (MIA)",
    cabin: "Economy/Coach",
  },
  payment: sharedPayment,
};

/**
 * Room name (partial, case-insensitive) selected on the Sandals scenario. Kept
 * as data so the room choice is not hardcoded in the spec. Must correspond to a
 * bookable card for `sandalsWithFlights.resort` (see docs/SELF_HEALING.md if the
 * copy differs on the live DOM).
 *
 * NOTE: the stg room listing serves a limited seeded inventory — no
 * Over-The-Water Bungalow renders for this (or any tried) Jamaica resort, so
 * the original name never matched a card. Healed to a room the resort actually
 * lists ("Crystal Lagoon Hideaway" Club Jr. Suite). The book-by-name flow it
 * exercises is identical.
 * FORMER: "Over-The-Water Bungalow"
 */
export const sandalsRoomName = "Crystal Lagoon Hideaway";

/** test-3b: Beaches Negril, 5 guests, no flights. */
export const beachesNoFlights: VacationData = {
  destination: "Jamaica",
  resort: "Beaches Negril",
  ...sharedDates,
  // Beaches (family) resorts expose the Guests stepper, so >2 is allowed.
  guests: { adults: 5 },
  payment: sharedPayment,
};

// ----------------------

export const beachesWithFlights: VacationData = {
  destination: "Turks & Caicos",
  resort: "Beaches Turks & Caicos",
  ...sharedDates,
  // Beaches (family) resorts expose the Guests stepper, so >2 is allowed.
  guests: { adults: 2 },
  // SSG credentials: env-var backed so they work across environments.
  // SSG_LOOKUP_LAST_NAME / SSG_LOOKUP_EMAIL hold the env-specific valid account
  // (e.g. "Romero" / "STG.US.1@MAILSAC.COM" for staging).
  lastName: process.env.SSG_LOOKUP_LAST_NAME || "Romero",
  clientEmail: process.env.SSG_LOOKUP_EMAIL || "STG.US.1@MAILSAC.COM",
  flight: {
    airport: "Miami",
    city: "MIAMI, FLORIDA (FL), USA (MIA)",
    cabin: "Economy/Coach",
  },
  payment: sharedPayment,
};

export const sandalsNoFlights: VacationData = {
  destination: "Jamaica",
  resort: "Sandals Caribbean Cay",
  ...sharedDates,
  // Sandals (couples / adults-only) resorts lock the Guests control at 2 adults.
  guests: { adults: 2 },
  payment: sharedPayment,
};
