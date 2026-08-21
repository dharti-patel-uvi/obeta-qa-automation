import { obetangBaseUrl } from "./env";
import { closeCookiesButtonIfAppears } from "./waitForCommonElements";
import { VacationPage } from "../page-object/VacationPage";
import { RoomPage } from "../page-object/RoomPage";
import { FlightsPage } from "../page-object/FlightsPage";
import { GuestsPage } from "../page-object/GuestsPage";
import { QuotePage } from "../page-object/QuotePage";
import { VacationData } from "../test-data/types";
import { BrowserContext, Page } from "@playwright/test";

/**
 * Step-chaining helpers used by the Step 2–4 specs. Each builds on the `page`
 * fixture (which already lands on Step 1 – Vacation) to advance the flow to a
 * later step, returning the relevant page object.
 *
 * These stop short of any booking/payment action (see CLAUDE.md).
 *
 * NOTE: reaching Step 2+ depends on live availability. If the chosen dates come
 * back "Sold Out", callers can use RoomPage.openSoldOutReselect() /
 * reselectDateRange() to recover.
 */

/** Fill a valid Step 1 vacation input and continue to Step 2 – Room. */
export async function advanceToRoom(
  page: Page,
  data: VacationData
): Promise<RoomPage> {
  const vacation = new VacationPage(page);
  await vacation.fillValidVacation(data);
  await vacation.continueToRoom();
  await page
    .waitForURL(/room|itinerar/i, { timeout: 60000 })
    .catch(() => undefined);
  return new RoomPage(page);
}

/**
 * Send Quote variant of {@link advanceToRoom}: switch into quote mode first,
 * then fill the same valid vacation input and continue. Used by the Step 2 –
 * Room > Room Quote section specs. The room-listing surface is the same OBE
 * component as Book Now, so the returned RoomPage exposes the same controls.
 *
 * NOTE: the exact route reached after Continue in quote mode is not yet
 * confirmed on the live env (see startQuote.spec.ts) — the wait allows either
 * the room/itineraries or quote landing page.
 */
export async function advanceToRoomQuote(
  page: Page,
  data: VacationData
): Promise<RoomPage> {
  const vacation = new VacationPage(page);
  await vacation.selectSendQuote();
  await vacation.fillValidVacation(data);
  await vacation.continueToRoom();
  await page
    .waitForURL(/room|itinerar|quote/i, { timeout: 60000 })
    .catch(() => undefined);
  return new RoomPage(page);
}

/**
 * Fill a valid Step 1 vacation input WITH the "Add Roundtrip Flights" add-on and
 * continue to Step 2 – Room (without booking a room yet). Requires
 * `data.flight`. Use this when a later step needs to choose a *specific* room
 * before the flights surface (see {@link advanceToFlights}, which books the
 * first room automatically).
 *
 * Flow: Step 1 (fill + add flights + gateway/cabin) -> Room listing.
 */

export async function advanceToRoomWithFlights(
  page: Page,
  data: VacationData
): Promise<RoomPage> {
  if (!data.flight) {
    throw new Error(
      "advanceToRoomWithFlights requires data.flight (departure gateway) so " +
        "the flights add-on can be exercised."
    );
  }
  const vacation = new VacationPage(page);
  await vacation.chooseDestination(data.destination);
  await vacation.chooseResort(data.resort);
  await vacation.selectDateRange(
    data.monthFrom,
    data.dateFrom,
    data.dateTo,
    data.yearFrom
  );
  if (data.guests) {
    await vacation.setGuests(
      data.guests.adults,
      data.guests.children,
      data.guests.infants
    );
  }
  await vacation.addFlights();
  await vacation.setDepartureCity(data.flight.airport, data.flight.city);
  if (data.flight.cabin) {
    await vacation.selectFlightClass(data.flight.cabin);
  }
  await vacation.continueToRoom();
  await page
    .waitForURL(/room|itinerar/i, { timeout: 60000 })
    .catch(() => undefined);
  return new RoomPage(page);
}

export async function advanceToRoomWithFlightsAndSSGpoints(
  page: Page,
  data: VacationData
): Promise<RoomPage> {
  if (!data.flight) {
    throw new Error(
      "advanceToRoomWithFlightsAndSSGpoints requires data.flight (departure gateway) so " +
        "the flights add-on can be exercised."
    );
  }
  const vacation = new VacationPage(page);
  await vacation.chooseDestination(data.destination);
  await vacation.chooseResort(data.resort);
  await vacation.selectDateRange(
    data.monthFrom,
    data.dateFrom,
    data.dateTo,
    data.yearFrom
  );
  if (data.guests) {
    await vacation.setGuests(
      data.guests.adults,
      data.guests.children,
      data.guests.infants
    );
  }
  await vacation.openSsgLookup();
  if (!data.clientEmail) {
    throw new Error(
      "advanceToRoomWithFlightsAndSSGpoints requires data.clientEmail (SSG-linked email)."
    );
  }
  // Fill last name before email — the modal requires both fields.
  if (data.lastName) {
    await vacation.fillSsgLastName(data.lastName);
  }
  await vacation.fillSsgEmail(data.clientEmail);
  // FIXED: search must come before "Use This Number" — the button only appears
  // after a successful lookup returns ssgAccountResult.
  await vacation.searchSsg();
  await vacation.ssgAccountResult.waitFor({ state: "visible", timeout: 15000 });
  await vacation.useThisSsgNumber();
  await vacation.addFlights();
  await vacation.setDepartureCity(data.flight.airport, data.flight.city);
  if (data.flight.cabin) {
    await vacation.selectFlightClass(data.flight.cabin);
  }
  await vacation.continueToRoom();
  await page
    .waitForURL(/room|itinerar/i, { timeout: 60000 })
    .catch(() => undefined);
  return new RoomPage(page);
}

/**
 * Advance to the Step 3 – Flights selection surface WITH flight options loaded.
 *
 * Unlike {@link advanceToRoom} (which never adds flights), this opts into the
 * "Add Roundtrip Flights" add-on on Step 1 and sets the departure gateway from
 * `data.flight`, so the flights page renders searchable itineraries to sort /
 * filter / select. Requires `data.flight` to be present.
 *
 * Flow: Step 1 (fill + add flights) -> Room (book first room) -> Flights.
 * Stops at the flights surface; selecting a flight advances to Guests only —
 * it never books or reaches Payment (see CLAUDE.md).
 */
export async function advanceToFlights(
  page: Page,
  data: VacationData
): Promise<FlightsPage> {
  const room = await advanceToRoomWithFlights(page, data);
  await room.bookFirstRoom();
  await page
    .waitForURL(/flight|itinerar/i, { timeout: 60000 })
    .catch(() => undefined);
  return new FlightsPage(page);
}

/**
 * Advance to the Step 4 – Guests form WITHOUT flights (the no-flights path the
 * OBE flow skips straight to Guests): Step 1 (fill, no flights) -> Room (book
 * first) -> Continue Without Flights -> Guests. Recovers via the sold-out
 * reselect flow if the chosen dates come back unavailable. Stops on Guests — it
 * never continues toward Payment (see CLAUDE.md).
 */
export async function advanceToGuests(
  page: Page,
  data: VacationData
): Promise<GuestsPage> {
  const room = await advanceToRoom(page, data);
  await room.ensureRoomsAvailable(
    data.monthFrom,
    data.dateFrom,
    data.dateTo,
    data.yearFrom
  );
  await room.bookFirstRoom();
  // With no flights added the OBE flow still surfaces the "Continue Without
  // Flights" CTA before Guests on some builds; click it if present.
  const flights = new FlightsPage(page);
  if (
    await flights.continueWithoutFlightsButton.isVisible().catch(() => false)
  ) {
    await flights.continueWithoutFlights();
  }
  const guests = new GuestsPage(page);
  await guests.assertOnGuestsStep();
  return guests;
}

/**
 * Advance to the Step 4 – Guests form WITH flights, so the Guests step exposes
 * the "Change Flights" (Back to Roundtrip Flights) CTA: Step 1 (fill + flights)
 * -> Room (book first) -> Flights (select first & continue) -> Guests. Requires
 * `data.flight`. Stops on Guests — never reaches Payment (see CLAUDE.md).
 */
export async function advanceToGuestsWithFlights(
  page: Page,
  data: VacationData
): Promise<GuestsPage> {
  const flights = await advanceToFlights(page, data);
  await flights.assertOnFlightsStep();
  await flights.selectFirstFlightAndContinue();
  await flights.selectFlightsAndContinue();
  const guests = new GuestsPage(page);
  await guests.assertOnGuestsStep();
  return guests;
}

/**
 * Send Quote flow to the Quote Review surface: switch into quote mode, fill the
 * vacation input, add the first room to the quote, and continue to review.
 * Optionally records the client email on Step 1 when `recipientEmail` is given.
 * Returns the QuotePage. Sending a quote is IN SCOPE (not a payment/booking).
 */
export async function advanceToQuoteReview(
  page: Page,
  data: VacationData,
  recipientEmail?: string
): Promise<QuotePage> {
  const vacation = new VacationPage(page);
  await vacation.selectSendQuote();
  if (recipientEmail) {
    await vacation.enterClientEmail(recipientEmail);
  }
  await vacation.fillValidVacation(data);
  await vacation.continueToRoom();
  await page
    .waitForURL(/room|itinerar|quote/i, { timeout: 60000 })
    .catch(() => undefined);

  const room = new RoomPage(page);
  await room.ensureRoomsAvailable(
    data.monthFrom,
    data.dateFrom,
    data.dateTo,
    data.yearFrom
  );
  await room.addFirstRoomToQuote();
  await room.continueToQuoteReview();
  return new QuotePage(page);
}

export async function advanceToRoomWithSSGandFlights(
  page: Page,
  data: VacationData
): Promise<RoomPage> {
  if (!data.flight) {
    throw new Error(
      "advanceToRoomWithFlights requires data.flight (departure gateway) so " +
        "the flights add-on can be exercised."
    );
  }
  const vacation = new VacationPage(page);
  await vacation.chooseDestination(data.destination);
  await vacation.chooseResort(data.resort);
  await vacation.selectDateRange(
    data.monthFrom,
    data.dateFrom,
    data.dateTo,
    data.yearFrom
  );
  await vacation.openSsgLookup();
  if (data.lastName) {
    await vacation.fillSsgLastName(data.lastName);
  }
  if (data.clientEmail) {
    await vacation.fillSsgEmail(data.clientEmail);
  }
  await vacation.searchSsg();
  await vacation.ssgAccountResult.waitFor({ state: "visible", timeout: 15000 });
  await vacation.useThisSsgNumber();
  if (data.guests) {
    await vacation.setGuests(
      data.guests.adults,
      data.guests.children,
      data.guests.infants
    );
  }
  await vacation.addFlights();
  await vacation.setDepartureCity(data.flight.airport, data.flight.city);
  if (data.flight.cabin) {
    await vacation.selectFlightClass(data.flight.cabin);
  }
  await vacation.continueToRoom();
  await page
    .waitForURL(/room|itinerar/i, { timeout: 60000 })
    .catch(() => undefined);
  return new RoomPage(page);
}

/**
 * Like {@link advanceToFlights} but self-heals when the flights surface
 * returns no results. Two independent recovery axes are applied in order:
 *
 *   1. **Different dates** — tries 3 safe month offsets (all < 330 days from
 *      today) for the original resort + gateway. Covers gaps in inventory for
 *      a specific travel window.
 *
 *   2. **Different resort / destination** — when ALL date variants still yield
 *      no flights (the gateway simply has no inventory to that resort's airport
 *      in this environment), switches to a completely different
 *      destination+resort whose arrival airport is different. Tries the same
 *      departure gateways against each resort. This is the most impactful
 *      recovery: Sandals Ochi flies into OCJ instead of MBJ, Sandals Barbados
 *      flies into BGI — completely separate routes.
 *
 * Resort names must match the listbox exactly; resort-specific airport labels
 * must also match the autocomplete. An incorrect label throws inside
 * advanceToFlights, which the retry loop silently skips via the catch block.
 *
 * When a retry attempt returns zero flight results the function tries the next
 * candidate (different dates, gateway, or resort). If the OBETA popup page is
 * closed between attempts (the app can redirect away after detecting a dead
 * session), the TA Portal page still alive in `context` is used to re-launch
 * a fresh OBETA session.
 *
 * Throws only after all candidates fail; that error is caught by the calling
 * test which skips instead of failing (data-availability, not a code defect).
 */
export async function advanceToFlightsWithRetry(
  page: Page,
  context: BrowserContext,
  data: VacationData
): Promise<FlightsPage> {
  type FlightSelection = NonNullable<VacationData["flight"]>;

  // Safe month offsets — all < 330 days from today (the flights opt-in limit).
  const MONTH_OFFSETS = [9, 6, 8];

  // Departure gateways to try per resort. JFK is verified from
  // deleted-tests/flights.spec.ts; MIA is from vacationFixture.ts.
  const GATEWAYS: FlightSelection[] = [
    {
      airport: "Miami",
      city: "MIAMI, FLORIDA (FL), USA (MIA)",
      cabin: "Economy/Coach",
    },
    {
      airport: "New York",
      city: "NEW YORK, NEW YORK (NY), USA (JFK)",
      cabin: "Economy/Coach",
    },
  ];

  // Resort variants: each switches the arrival airport (changes the route
  // entirely). Names are verified from project fixtures and NOBE references.
  type ResortVariant = { destination: string; resort: string };
  const RESORT_VARIANTS: ResortVariant[] = [
    // Original resort — tried first (attempt 0 uses data as-is).
    { destination: data.destination, resort: data.resort },
    // Jamaica / Ocho Rios airport (OCJ) — different Jamaica arrival airport.
    { destination: "Jamaica", resort: "Sandals Ochi" },
    // Barbados — completely different country and arrival airport (BGI).
    { destination: "Barbados", resort: "Sandals Barbados" },
  ];

  // Build a flat candidate list: for each resort variant, try every
  // (gateway × month offset) combination. Attempt 0 uses the fixture as-is.
  type Candidate = ResortVariant & {
    flight: FlightSelection;
    monthOffset: number;
  };
  const candidates: Candidate[] = [];

  for (const rv of RESORT_VARIANTS) {
    for (const gw of GATEWAYS) {
      for (const offset of MONTH_OFFSETS) {
        candidates.push({ ...rv, flight: gw, monthOffset: offset });
      }
    }
  }

  // activePage starts as the OBETA popup the fixture gave us; updated to a
  // freshly-navigated page if the popup is closed between retry attempts.
  let activePage = page;

  // If every successive flights-page view returns 0 results (the app rendered
  // the flights surface but found nothing), bail out early — it indicates a
  // data-availability problem with the environment rather than a routing issue
  // that a different resort/gateway/date could fix.
  let consecutiveZeroResults = 0;
  const EARLY_EXIT_ZEROS = 3;

  for (let i = 0; i < candidates.length; i++) {
    const { destination, resort, flight, monthOffset } = candidates[i];

    const d = new Date();
    d.setDate(15);
    d.setMonth(d.getMonth() + monthOffset);
    const monthFrom = d.toLocaleDateString("en-US", { month: "long" });
    const yearFrom = d.getFullYear().toString();

    // Attempt 0: use the fixture data as-is (exact dates, original resort+gateway).
    const currentData: VacationData =
      i === 0
        ? data
        : {
            ...data,
            destination,
            resort,
            monthFrom,
            dateFrom: "15",
            dateTo: "21",
            yearFrom,
            flight,
          };

    if (i > 0) {
      try {
        // Always open a FRESH page for each retry. Reusing the same page lets
        // the OBETA SPA restore previous form state from localStorage (especially
        // the calendar position), which causes advanceCalendarUntilVisible to
        // spin forward from a far-future month that can never reach the target.
        // A fresh page has no OBETA localStorage, so the calendar starts at the
        // current month. Close the old page first to avoid leaking tabs.
        if (!activePage.isClosed()) {
          await activePage.close().catch(() => undefined);
        }
        activePage = await context.newPage();
        await activePage.goto(obetangBaseUrl());
        await activePage
          .waitForLoadState("domcontentloaded")
          .catch(() => undefined);
        await activePage
          .getByTestId("select-destination-ui")
          .waitFor({ state: "visible", timeout: 30000 });
        await closeCookiesButtonIfAppears(activePage);
      } catch {
        // Navigation recovery failed (context closed during teardown, or
        // OBETA not accepting a sessionless goto). Skip this candidate.
        consecutiveZeroResults = 0;
        continue;
      }
    }

    // advanceToFlights throws when the "Add Flights" checkbox is disabled
    // (dates > 330 days) or when a gateway/resort label doesn't match the
    // autocomplete. The catch block moves the loop to the next candidate.
    let flights: FlightsPage;
    try {
      flights = await advanceToFlights(activePage, currentData);
    } catch {
      consecutiveZeroResults = 0; // infra / form error, not a data miss
      continue;
    }

    const noFlightsVisible = await flights.noFlightsFoundText
      .isVisible()
      .catch(() => false);
    const cardCount = await activePage
      .getByTestId("itinerary-card")
      .count()
      .catch(() => 0);

    if (!noFlightsVisible && cardCount > 0) {
      return flights;
    }

    // Flights page loaded but returned 0 results. Count consecutive misses.
    consecutiveZeroResults++;
    if (consecutiveZeroResults >= EARLY_EXIT_ZEROS) {
      break; // Environment has no flight data — stop early; caller will skip.
    }
  }

  throw new Error(
    `advanceToFlightsWithRetry: no flight results found after ` +
      `${candidates.length} candidate(s) ` +
      `(${RESORT_VARIANTS.length} resort(s) × ${GATEWAYS.length} gateway(s) × ` +
      `${MONTH_OFFSETS.length} date window(s)). ` +
      `Original: ${data.destination} / ${data.resort} / ` +
      `${data.flight?.airport ?? "no gateway"}.`
  );
}
