/**
 * Shared test-data shapes for OBETANG.
 *
 * Scope note: this file currently models everything needed for **Step 1 –
 * Vacation**. Later phases (Guests, Payment) extend `VacationData` with the
 * `guests` / `payment` blocks — deliberately omitted here per project rules
 * (never build toward a successful booking/payment).
 */

export type FlightClass = "Economy/Coach" | "First Class";

export interface FlightSelection {
  /** What the user types into "Flights Departing From". */
  airport: string;
  /** The autocomplete option to click (full city label). */
  city: string;
  /** Optional cabin class selected in "Search Flights By". */
  cabin?: FlightClass;
}

export interface GuestCount {
  adults: number;
  children?: number;
  infants?: number;
}

export interface VacationData {
  /** Destination island shown in the Destination dropdown. */
  destination: string;
  /** Resort shown in the Resort dropdown (must belong to `destination`). */
  resort: string;
  /** Calendar month label to navigate the datepicker to, e.g. "March". */
  monthFrom: string;
  /** Check-in day-of-month label, e.g. "15". */
  dateFrom: string;
  /** Check-out day-of-month label, e.g. "20". */
  dateTo: string;
  /** Year label (only used by the next-year scenarios). */
  yearFrom?: string;
  /** Guest counts (Beaches brand exposes the Guests textbox). */
  guests?: GuestCount;
  /** Flight selection (only when the Add Flights checkbox is used). */
  lastName?: string;
  clientEmail?: string;
  flight?: FlightSelection;
  /** Card details for the Step 5 payment form (never a CVV; never submitted). */
  payment?: PaymentInfo;
}

/** Date-of-birth parts as the guest form's month/day/year <select> values. */
export interface DateOfBirth {
  /** Month select value, e.g. "10" for October. */
  month: string;
  /** Day-of-month select value, e.g. "16". */
  day: string;
  /** Four-digit year select value, e.g. "1975". */
  year: string;
}

/**
 * Guest-info shapes for **Step 3/4 – Guests** (approved scope: Steps 1–4, no
 * Payment). The form's title / country / state controls are `button-ui` +
 * `role=option` pickers whose labels are matched directly (e.g. "MRS.",
 * "United States", "Florida"), so those fields carry the option label text.
 */
export interface GuestInfo {
  /** Title option label, e.g. "MRS." / "MS." / "MR.". */
  title: string;
  /** Gender option label ("MALE" / "FEMALE"). Optional — derived from `title` when omitted. */
  gender?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: DateOfBirth;
  email?: string;
  address1?: string;
  address2?: string;
  /** Country option label, e.g. "United States". */
  country?: string;
  /** State/province option label, e.g. "Florida". */
  state?: string;
  city?: string;
  zipCode?: string;
  phone?: string;
}

/**
 * Card details for **Step 5 – Payment**.
 *
 * SCOPE GUARD: there is intentionally **no `cvv` field**. Per project rules
 * (CLAUDE.md) the CVV is never entered in any test, and no test ever submits a
 * payment or completes a booking. The payment specs fill the form only as far
 * as this data allows and stop before "PAY VACATION".
 */
export interface PaymentInfo {
  /** Name on card, e.g. "Dharti Patel". */
  cardHolder: string;
  /** Test card number (see CLAUDE.md test cards). */
  cardNumber: string;
  /** Expiration: 2-digit month + 4-digit year, matched to the MM/YYYY pickers. */
  expiration: { month: string; year: string };
}

export interface SsgLookupData {
  /** Last name linked to an SSG account — happy path. */
  validLastName: string;
  /** Email linked to an SSG account — happy path. */
  validEmail: string;
  /** Well-formed email NOT linked to any SSG account. */
  unlinkedEmail: string;
  /** Malformed email — negative path. */
  invalidEmail: string;
  /** Special-character input — negative path. */
  specialCharsEmail: string;
  /** Numeric input — negative path. */
  numbersEmail: string;
}
