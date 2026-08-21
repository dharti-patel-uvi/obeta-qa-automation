/**
 * Age helper ported from `obe-e2e-nextgen-master/utils/calculateAge.ts`.
 * Used by guest min-age validations (Primary 18+, Adult 2 16+).
 */
export interface BirthDate {
  /** Month as 1–12 (or a parseable month token). */
  month: string;
  /** Day of month. */
  day: string;
  /** Four-digit year. */
  year: string;
}

/** Whole-year age today for the given birth date. */
export function calculateAge(birthDateObj: BirthDate): number {
  const birthDate = new Date(
    `${birthDateObj.year}-${birthDateObj.month}-${birthDateObj.day}`
  );
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}
