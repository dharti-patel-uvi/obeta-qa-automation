/**
 * Resolves which environment the run targets and the matching URLs.
 *
 * `.env` defines URLs per environment (dev / stg / prod). `TARGET_ENV` selects
 * one — it DEFAULTS TO `dev`, honoring the project rules ("test dev for now"
 * and never drive Step 5 / payment on prod OBETA). Set `TARGET_ENV=stg|prod`
 * deliberately to target another environment.
 */
export type TargetEnv = "dev" | "stg" | "prod";

export function targetEnv(): TargetEnv {
  const e = (process.env.TARGET_ENV || "dev").toLowerCase();
  return (["dev", "stg", "prod"].includes(e) ? e : "dev") as TargetEnv;
}

/** TA Portal (agent portal) URL — the entry point for the selected env. */
export function taPortalUrl(): string {
  switch (targetEnv()) {
    case "stg":
      return (
        process.env.TA_PORTAL_STG_URL || "https://tang-portal-stg.sandals.com"
      );
    case "prod":
      // Tolerate the single- or double-underscore spelling in .env.
      return (
        process.env.TA_PORTAL_PROD_URL ||
        process.env.TA_PORTAL__PROD_URL ||
        "https://taportal.sandals.com"
      );
    default:
      return (
        process.env.TA_PORTAL_DEV_URL || "https://tang-portal-dev.sandals.com/"
      );
  }
}

/** OBETANG booking-engine base URL (the app under test) for the selected env. */
export function obetangBaseUrl(): string {
  switch (targetEnv()) {
    case "stg":
      return process.env.OBETANG_STG_URL || "https://obetang-stg.sandals.com/";
    case "prod":
      return process.env.OBETANG_PROD_URL || "https://obetang.sandals.com/";
    case "dev":
    default:
      return process.env.OBETANG_DEV_URL || "https://obetang-dev.sandals.com/";
  }
}
