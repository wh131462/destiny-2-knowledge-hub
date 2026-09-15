## 1. Data Contract And Fixtures

- [x] 1.1 Define the `d2hub-weekly-rotation-v1` schema, status values, categories, and normalized activity record fields.
- [x] 1.2 Add representative Bungie Milestones fixtures covering mapped, unmapped, empty, partial, and malformed responses.
- [x] 1.3 Add the initial checked-in `web/public/data/weekly-rotation.json` fallback with an explicit unavailable or fixture status.

## 2. Synchronization Pipeline

- [x] 2.1 Implement `scripts/sync-weekly-rotation.js` with API-key handling, fixture mode, timeout, bounded retries, and safe error messages.
- [x] 2.2 Implement response normalization, ISO window validation, activity categorization, duplicate removal, and Manifest/editorial enrichment.
- [x] 2.3 Implement schema validation, temporary-file output, atomic replacement, stale/unavailable status handling, and machine-readable summary logs.
- [x] 2.4 Add unit tests for successful sync, missing API key, malformed response, unmapped activities, rate limits, and preservation of the previous snapshot.

## 3. Deployment Integration

- [x] 3.1 Add `rotation:sync` and validation scripts to the root package commands.
- [x] 3.2 Update the Pages workflow to run the sync on scheduled and manual deployments, pass `BUNGIE_API_KEY` through the environment, and include the snapshot in `web/dist/data`.
- [x] 3.3 Document API-key setup, local fixture usage, failure recovery, and data limitations in the README or deployment guide.

## 4. Frontend Data Layer

- [x] 4.1 Add `useWeeklyRotation` to load and validate the same-origin snapshot, expose loading/error/status state, and preserve non-empty stale data.
- [x] 4.2 Add localized category metadata and helpers for remaining time, source labels, internal guide lookup, and Manifest links.
- [x] 4.3 Add route and navigation entries for `/weekly-rotation`, including global search metadata where appropriate.

## 5. Weekly Rotation UI

- [x] 5.1 Implement `WeeklyRotationView.vue` with freshness banner, reset window, highlighted activities, grouped records, missing-category notice, and source details.
- [x] 5.2 Add accessible `a-select` filters for category, difficulty, and status with URL query synchronization and deep-link restoration.
- [x] 5.3 Add keyboard-accessible activity expansion, modifiers/rewards/provenance display, guide and Manifest links, copy-summary action, and live announcements.
- [x] 5.4 Add bilingual UI and editorial copy, responsive single-column mobile layout, stable card dimensions, focus states, and no-overflow handling at 375px.
- [x] 5.5 Add the home-page or activity-page entry point without obscuring the existing activity guide workflow.

## 6. Verification And Release

- [ ] 6.1 Add tests for composable state, filter/query synchronization, countdown expiration, stale fallback, and summary generation.
- [ ] 6.2 Run `npm test`, `npm run validate`, and `npm run build`; resolve any generated-data or i18n coverage failures.
- [ ] 6.3 Run Playwright desktop/mobile checks for selector behavior, expansion, links, copy feedback, keyboard focus, and horizontal overflow.
- [ ] 6.4 Review the generated snapshot and deployment diff for secrets, incorrect “no rotation” claims, and unsupported activity mappings.
