Rules: 
NEVER code for entering CVV on Step 5 - Payment Page. 
Never make a successful payment.
Never make a successful booking. 
Never perform tests that involve testing or validating anything on Confirmation page, as you should NOT be making a payment. 
Never check the Group Code checkbox - that should only be tested manually as group code needs to be a dynamic value and has a major dependency on manual testers and other departments. 

Use NOBE as the reference point for coding for OBETA project. OBETA Code and structure should be similar or better for OBETA. 
Functionality should be coded for 
Because NOBE and OBETA are similar functionality - try to leverage the NOBE codebase first, for minimizing token usage. 

User can only reach the OBETA webpage once they launch the TA Portal URL and sign in.

Develop and test the test scripts using Prod URL until you reach the Page 5 test cases for Payment Step.

- Adjoining rooms functionality can only be tested if the selected resort name starts with "Beaches"

- Send Quote tab does not contain flight related functionality. 
- Instead the 
"NOTE: Due to the dynamic nature of flight pricing, we are unable to include airfare in quotes."

Dev TANG URL: https://tang-portal-dev.sandals.com/
Stg TANG URL: https://tang-portal-stg.sandals.com/

Dev OBETANG URL: https://obetang-dev.sandals.com/
Stg OBETANG URL: https://obetang-stg.sandals.com/

prod TA portal URL: https://taportal.sandals.com/
prod OBETA URL: https://obeta.sandals.com/
(never code for step 5 payment page in OBETA for prod env)

Test Rail test cases path:  docs\obeta_next_gen.xlsx
OBETANG Jira project

----------------------------------

Credentials for dev env: 
Beratest
Sandals

Credentials for stg env: 
beratest
sandals

Credentials for prod env:  (never code for step 5 payment page in OBETA for prod env)
reynaglynn
sandals

-----------------------------------

Test Credit Cards:

Visa
4111111111111111

MasterCard
5105105105105100

Discover
6011111111111117

-----------------------------------

Member ID/Sandals Select Rewards: 7742063674556903
Level Status: AMBASSADORS CLUB

Build test automation suite to test PROD environment for now. 
Build with reference to NOBE automation suite by using anything that can be used from that automation suite to use for this project.
---

# OBETANG E2E Automation

End-to-end UI automation for the **OBETANG** (OBETA Next Gen) agent booking engine. Stack: **Playwright + TypeScript**, Page Object Model. Forked from the NOBE framework (see `nobe-e2e-qa-automation/`, kept locally as a read-only reference and gitignored). Full analysis: `docs/OBETANG_AUTOMATION_STRATEGY.md`. Requirements: 599 TestRail cases (suite `S921`) in `docs/obeta_next_gen_test_cases.xlsx`.

## Current scope

**Step 1 – Vacation only** (44 cases). Do not build Step 2–5 or any booking/payment/confirmation flow until asked — see the Rules above.

## Commands

```bash
npm install                                 # deps (+ installs chromium via postinstall)
cp .env.example .env                        # then fill in real values

npm run test:local                          # all specs, headed Chrome (authoring/debug)
npm run test:vacation                       # just the Book Now vacation spec
npm run test:ui                             # Playwright UI mode
npm test                                    # default config (chromium, headless) — reads OBETANG_BASE_URL
npm run eslint-fix                          # lint + autofix
```

Always use `--config=playwright.config.local.ts` (i.e. the `test:local` script) for local work. Bare `npm test` uses the CI-tuned `playwright.config.ts`.

## Entry / navigation (important)

The OBETA booking engine is **not** reachable directly — an agent must launch the
**TA Portal**, sign in, then launch a booking, which lands on Step 1 – Vacation.
This flow is encapsulated once and shared:

- `page-object/TAPortalPage.ts` — portal navigate / `login()` / `launchObeta()` (handles same-tab or popup).
- `utils/navigateToVacation.ts` — the full `TA Portal → sign in → launch OBETA → Step 1` sequence.
- `test/fixtures.ts` — overrides Playwright's `page` fixture so **every spec starts already on the vacation form**. Specs import `test`/`expect` from `./fixtures`, not `@playwright/test`, and must not call `page.goto("/")`.
- `utils/env.ts` — resolves the TA Portal + OBETANG URLs from `TARGET_ENV` (defaults to `dev`).

## Layout

```
page-object/   BasePage.ts (helpers incl. resolveFirst) + TAPortalPage.ts, VacationPage.ts, LoginPage.ts
test/          fixtures.ts + one spec per Step-1 sub-section, every test titled with its TestRail Cxxxxx id
test-data/     types.ts, vacationFixture.ts, ssgFixture.ts (faker + dynamic dates)
utils/         env.ts, navigateToVacation.ts, getRandomDateRange.ts, waitForCommonElements.ts
```

Spec → TestRail sub-section map:
- `test/vacation.spec.ts` — Book Now section (core inputs, dates, flights)
- `test/ssgModal.spec.ts` — Book Now > SSG lookup modal
- `test/adjoiningRooms.spec.ts` — Book Now > Adjoining Rooms modal
- `test/startQuote.spec.ts` — Send Quote
- `test/startQuoteSsgModal.spec.ts` — Send Quote > SSG lookup modal

## Selector provenance (important)

OBETANG runs the same OBE codebase as NOBE, so selectors carried over from NOBE (marked `[NOBE]` in `VacationPage.ts`) should work. OBETA-only surfaces (Booking/Quote toggle, SSG modal, Adjoining Rooms modal, First-Class picker) are marked `[OBETA-TODO]`, and the TA Portal sign-in/launch controls are marked `[TANG-TODO]` in `TAPortalPage.ts` — both are best-effort guesses following the `*-ui` testid convention that **must be verified against the live DOM** (Phase 1). Expect these to need adjustment on first run; `docs/SELF_HEALING.md` is the playbook, and `BasePage.resolveFirst()` helps where a selector legitimately varies.

## Conventions

- Prefer `getByTestId` (nested pattern, e.g. `getByTestId("select-resort-ui").getByTestId("button-ui")`); fall back to `getByRole`/`getByText`.
- Prefer `BasePage` wait helpers over raw `page.waitForTimeout()`.
- Put the TestRail `Cxxxxx` id at the start of every `test()` title.
- 2-space indent, semicolons required (ESLint + Prettier). Run `npm run eslint-fix` before committing.

## Environment variables (`.env`, gitignored)

- `TARGET_ENV` — `dev` (default) | `stg` | `prod`; selects which URLs `utils/env.ts` resolves
- `TA_PORTAL_DEV_URL` / `TA_PORTAL_STG_URL` / `TA_PORTAL_PROD_URL` — portal entry point per env
- `TA_PORTAL_USER`, `TA_PORTAL_PASSWORD` — agent portal login (dev: `Beratest` / `Sandals`)
- `OBETANG_DEV_URL` / `OBETANG_STG_URL` / `OBETA_PROD_URL` — booking engine per env (used as `baseURL`)
- `ACCOUNT_USER`, `ACCOUNT_PASSWORD` — in-OBETA member/SSG sign-in (later phases; optional)
- `SSG_LOOKUP_EMAIL`, `SSG_LOOKUP_EMAIL_UNLINKED` — SSG modal happy-path lookups (those tests skip if unset)
- `CI` — flips the default config into headless/parallel/retry mode
