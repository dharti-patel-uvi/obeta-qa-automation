import { VacationData } from "./types";
import { getRandomDateRange } from "../utils/getRandomDateRange";

/**
 * Send Quote scenario data.
 *
 * The quote is emailed to the client, so the recipient address is fixed to the
 * QA inbox the run verifies against. Send Quote does NOT include flights (the
 * app shows "…we are unable to include airfare in quotes." — see CLAUDE.md), so
 * this fixture carries no `flight` block.
 *
 * "Sandals Montego Bay" mirrors the core vacation fixture (a known-good entry).
 * Dynamic future dates keep runs off stale/sold-out inventory.
 */
const dates = getRandomDateRange(6);

/** Where the quote email is sent (QA inbox). */
export const quoteRecipientEmail = "dharti.patel@uvi.sandals.com";

/** Client first name entered on the Finalize Quote form. */
export const quoteClientFirstName = "Dharti";

/** Client last name entered on the Finalize Quote form. */
export const quoteClientLastName = "Patel";

export const quoteVacation: VacationData = {
  destination: "Jamaica",
  resort: "Sandals Montego Bay",
  monthFrom: dates.month,
  dateFrom: dates.from,
  dateTo: dates.to,
  yearFrom: dates.year,
  guests: {
    adults: 2,
  },
};

export default quoteVacation;
