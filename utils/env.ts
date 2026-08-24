/**
 * Resolves which environment the run targets and the matching URLs.
 *
 * `.env` defines URLs per environment (dev / stg). `TARGET_ENV` selects
 * one — it DEFAULTS TO `dev`, honoring the project rules ("test dev for now"
 * and never drive Step 5 / payment on  OBETA). Set `TARGET_ENV=stg`
 * deliberately to target another environment.
 */
export type TargetEnv = "dev" | "stg";

export function targetEnv(): TargetEnv {
  const e = (process.env.TARGET_ENV || "dev").toLowerCase();
  return (["dev", "stg"].includes(e) ? e : "dev") as TargetEnv;
}

/** TA Portal (agent portal) URL — the entry point for the selected env. */
export function taPortalUrl(): string {
  switch (targetEnv()) {
    case "stg":
      return (
        process.env.TA_PORTAL_STG_URL || "https://tang-portal-stg.sandals.com"
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
    case "dev":
    default:
      return process.env.OBETANG_DEV_URL || "https://obetang-dev.sandals.com/";
  }
}
