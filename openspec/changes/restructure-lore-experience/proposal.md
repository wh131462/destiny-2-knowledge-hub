## Why

The current lore page presents sagas, enemy races, characters, and release history as disconnected summaries. Readers can look up a name, but they cannot easily understand the setting's foundational concepts, follow story causality, distinguish species from factions, or choose a spoiler-appropriate reading path.

## What Changes

- Replace the flat lore landing view with a guided overview that explains the setting through a concise sequence of anchor events.
- Separate in-universe story chronology from expansion release history and gameplay-system metadata.
- Add dedicated views for foundational concepts, story events, factions, characters, and releases.
- Model relationships among concepts, events, factions, characters, destinations, and releases so entries can expose meaningful related reading.
- Add spoiler controls and era/category filters, with search behavior that applies consistently to the active view.
- Add source and verification metadata to curated lore records and show provenance where it helps readers assess the material.
- Preserve Chinese and English presentation and provide accessible, responsive interactions on desktop and narrow screens.

## Capabilities

### New Capabilities
- `lore-exploration`: Guided lore browsing, spoiler-aware filtering, story chronology, entity relationships, and release-history separation.
- `lore-content-model`: A normalized curated data model for lore concepts, events, factions, characters, releases, relationships, and provenance.

### Modified Capabilities

None.

## Impact

- Reworks `web/src/views/LoreView.vue` and `web/src/data/world.js`.
- Extends editorial translations and focused frontend/data tests.
- Uses existing Vue 3, Ant Design Vue, routing, theme variables, and static assets; no new runtime dependency or route is required.
- Does not change Manifest-derived catalogs, rules engines, build workflows, or the two unrelated active OpenSpec changes.
