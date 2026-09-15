## 1. Armor version foundation

- [x] 1.1 Add shared preferred-version ranking and grouping helpers for armor definitions.
- [x] 1.2 Add focused tests covering current, source-confirmed, historical, and tie-break ordering.

## 2. Armor catalog experience

- [x] 2.1 Replace dataset-oriented tabs with task views and an Ant Design catalog-scope selector.
- [x] 2.2 Add normalized route-query synchronization for view, scope, class, slot, availability, sort, and search.
- [x] 2.3 Rebuild armor result cards as compact summaries with preferred-version status and responsive pagination.
- [x] 2.4 Rework the Ant Design armor modal into a record-style detail with version, intrinsic, set, source, and build actions.

## 3. Set workflow

- [x] 3.1 Split `ArmorSetExplorer` presentation into set-research and planner modes while preserving shared state.
- [x] 3.2 Group planner Exotic choices by armor identity and use the preferred definition.
- [x] 3.3 Implement clear `4+1`, `2+2+1`, and `5` allocation behavior with a visible free slot and existing transfer confirmation.

## 4. Responsive design and localization

- [x] 4.1 Complete desktop and narrow-screen layouts for task navigation, filters, cards, set browsing, planner, and detail modal.
- [x] 4.2 Add or update Chinese and English interface translations for all new visible states and controls.

## 5. Verification

- [x] 5.1 Run focused armor tests and the full automated test suite, resolving regressions.
- [x] 5.2 Run the production frontend build.
- [x] 5.3 Verify catalog filters, select values, version switching, set planning, transfer confirmation, and desktop/mobile layouts in a real browser.
