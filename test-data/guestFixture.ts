import { GuestInfo } from "./types";

/**
 * Happy-path guest details for Step 4 – Guests.
 *
 * Values follow the shapes captured from the recorded flow (test-2.spec.ts):
 * Title/Country/State are option-picker labels; DOB fields are select values.
 * A US address is used so the State + Zip validation path is exercised.
 *
 * Clone and override for scenario-specific fixtures rather than editing these.
 * NOTE: option labels (title/country/state) must match the live OBETA copy —
 * verify against the DOM if a picker selection fails (see docs/SELF_HEALING.md).
 */

export const primaryGuest: GuestInfo = {
  title: "MRS.",
  firstName: "Jane",
  lastName: "Tester",
  dateOfBirth: { month: "10", day: "16", year: "1985" },
  email: "jane.tester@example.com",
  address1: "123 Ocean Drive",
  country: "United States",
  state: "Florida",
  city: "Miami",
  zipCode: "33139",
  phone: "3055550123",
};

export const secondaryGuest: GuestInfo = {
  title: "MR.",
  firstName: "John",
  lastName: "Tester",
  dateOfBirth: { month: "6", day: "12", year: "1983" },
};

/**
 * Additional adult guests (positions 3, 4, 5) for the 5-guest Beaches complex
 * scenario. Combined with {@link secondaryGuest} (position 2) they fill the
 * four non-primary guests required before the Beaches Guests step can continue.
 * Additional guests only need title / name / date-of-birth.
 */
export const additionalGuests: GuestInfo[] = [
  {
    title: "MR.",
    firstName: "Michael",
    lastName: "Tester",
    dateOfBirth: { month: "3", day: "8", year: "1990" },
  },
  {
    title: "MS.",
    firstName: "Emily",
    lastName: "Tester",
    dateOfBirth: { month: "11", day: "22", year: "1992" },
  },
  {
    title: "MR.",
    firstName: "David",
    lastName: "Tester",
    dateOfBirth: { month: "7", day: "4", year: "1988" },
  },
];

export default primaryGuest;
