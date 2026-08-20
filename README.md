# OBETANG E2E Automation

End-to-end UI automation for the **OBETANG** (OBETA Next Gen) agent-facing booking engine — Sandals/Beaches. Built with **Playwright + TypeScript** using the Page Object Model, forked from the mature NOBE framework.

> **Current scope: Step 1 – Vacation only.** Payment, booking, and confirmation flows are intentionally out of scope. See `CLAUDE.md`.

## Quick start

```bash
npm install                 # installs deps and the chromium browser
cp .env.example .env        # fill in URLs + credentials (see docs/info.txt)

npm run test:local          # run all Step 1 specs headed, in Google Chrome
```

## Project structure

```
.
├── page-object/
│   ├── BasePage.ts          # abstract base: flakiness-resistant wait/click/fill helpers
│   ├── VacationPage.ts      # Step 1 – Vacation (Book Now + Send Quote + SSG + Adjoining Rooms)
│   └── LoginPage.ts         # member / SSG sign-in
├── test/
│   ├── vacation.spec.ts             # Book Now section
│   ├── ssgModal.spec.ts             # Book Now > SSG lookup modal
│   ├── adjoiningRooms.spec.ts       # Book Now > Adjoining Rooms modal
│   ├── startQuote.spec.ts           # Send Quote
│   └── startQuoteSsgModal.spec.ts   # Send Quote > SSG lookup modal
├── test-data/
│   ├── types.ts             # shared data shapes
│   ├── vacationFixture.ts   # base happy-path input (faker + dynamic future dates)
│   └── ssgFixture.ts        # SSG lookup emails
├── utils/
│   ├── getRandomDateRange.ts
│   └── waitForCommonElements.ts
├── playwright.config.ts        # default / CI (chromium, headless, parallel, env base URL)
├── playwright.config.local.ts  # local dev (headed Chrome, 1 worker, trace + video on)
└── docs/                       # strategy, TestRail export, environment info
```

## Test coverage — Step 1 (44 TestRail cases, suite S921)

| Sub-section | Spec | Cases |
|---|---|---|
| Book Now section | `vacation.spec.ts` | 12 |
| Book Now > SSG Modal | `ssgModal.spec.ts` | 9 |
| Book Now > Adjoining Rooms | `adjoiningRooms.spec.ts` | 2 |
| Send Quote | `startQuote.spec.ts` | 12 |
| Send Quote > SSG Modal | `startQuoteSsgModal.spec.ts` | 9 |

Every `test()` is titled with its TestRail `Cxxxxx` id so JUnit results push cleanly back to TestRail.

## Running specific tests

```bash
# One file
npx playwright test test/vacation.spec.ts --config=playwright.config.local.ts

# One case by TestRail id
npx playwright test --config=playwright.config.local.ts -g "C59089"

# UI mode
npm run test:ui

# HTML report after a run
npm run report
```

## Selector caveat (read before first run)

OBETANG shares the OBE codebase with NOBE, so most `data-testid` selectors carry over. **OBETA-only surfaces** (the Booking/Quote toggle, SSG lookup modal, Adjoining Rooms modal, First-Class cabin picker) use best-effort selectors marked `[OBETA-TODO]` in `page-object/VacationPage.ts` and must be verified against the live `obetang-dev` DOM. Expect to adjust these on the first real run — this is the planned Phase 1 work.

The SSG happy-path lookups need a real SSG-linked email; set `SSG_LOOKUP_EMAIL` in `.env` or those tests skip automatically.
