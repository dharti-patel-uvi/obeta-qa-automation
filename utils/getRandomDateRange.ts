/**
 * Returns a future date range for the Step 1 calendar picker.
 *
 * Dates are pushed well into the future (current month + 9) so runs are never
 * blocked by sold-out near-term availability, and the stay length is
 * configurable via `days` (default 6 nights — safely above the 3-night minimum
 * and below the 21-night maximum).
 */
export function getRandomDateRange(days = 6): {
  from: string;
  to: string;
  month: string;
  year: string;
} {
  const now = new Date();

  const start = 15;
  const end = start + days - 1;

  const startDate = new Date(now.getFullYear(), now.getMonth() + 9, start);

  const fromDate = start.toString();
  const toDate = end.toString();
  const monthFrom = startDate.toLocaleDateString("en-US", { month: "long" });
  const yearFrom = startDate.getFullYear().toString();

  return {
    from: fromDate,
    to: toDate,
    month: monthFrom,
    year: yearFrom,
  };
}
