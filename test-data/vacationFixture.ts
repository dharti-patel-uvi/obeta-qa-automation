import { VacationData } from "./types";
import { getRandomDateRange } from "../utils/getRandomDateRange";

/**
 * Base happy-path vacation input for Step 1.
 * Dynamic future dates so runs are never pinned to stale/sold-out data.
 * Clone and override for scenario-specific fixtures rather than editing this.
 */
const dates = getRandomDateRange(6);

const vacationData: VacationData = {
  destination: "Jamaica",
  resort: "Sandals Montego Bay",
  monthFrom: dates.month,
  dateFrom: dates.from,
  dateTo: dates.to,
  yearFrom: dates.year,
  guests: {
    adults: 2,
  },
  flight: {
    // A valid US departure city for the flights add-on. `city` must match the
    // autocomplete option's exact label as rendered by the live app. [verified]
    airport: "Miami",
    city: "MIAMI, FLORIDA (FL), USA (MIA)",
    cabin: "Economy/Coach",
  },
};

export default vacationData;
