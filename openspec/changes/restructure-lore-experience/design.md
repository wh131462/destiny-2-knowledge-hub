## Context

`LoreView.vue` currently owns four presentation tabs and imports four flat arrays from `world.js`. Search only affects two arrays, release chronology is used as a proxy for story chronology, and entity cards do not expose relationships or provenance. The project already has suitable Vue 3, Ant Design Vue, localization helpers, theme tokens, and responsive layout primitives, so the change can remain dependency-free and localized to the lore feature.

## Goals / Non-Goals

**Goals:**
- Give new readers a coherent, spoiler-aware route through the setting.
- Represent story events and entity relationships as structured data rather than prose embedded in cards.
- Keep story chronology distinct from product release chronology.
- Make every active view searchable or filterable in a predictable way.
- Preserve bilingual, accessible, responsive behavior.

**Non-Goals:**
- Reproduce every Grimoire or lore-book entry.
- Build a free-form canvas graph or introduce a visualization dependency.
- Add new routes for every lore entity in this iteration.
- Claim Manifest-level authority for editorial lore summaries.

## Decisions

### Use feature-local normalized records

`world.js` will export concepts, events, factions, characters, releases, and source records with stable IDs and relationship IDs. This provides one source for the page while remaining compatible with the project's current static-data architecture. A generic site-wide content framework was considered but rejected because it would broaden this change into unrelated catalogs.

### Use a guided overview plus focused tabs

The first view will present a compact setting primer and anchor-event path. Separate tabs will cover concepts, timeline, factions, characters, and release history. This balances newcomer orientation with reference browsing better than a single dense dashboard or a card grid alone.

### Represent relationships as readable linked summaries

Desktop and mobile will use relation chips and compact related-entry lists derived from IDs. A force-directed canvas was rejected for the first release because it is difficult to navigate on narrow screens, adds a dependency, and provides limited value until the relationship dataset is substantially larger.

### Make spoiler level a first-class filter

Every narrative record will carry a spoiler tier. The page defaults to the introductory tier, persists only for the current session, and clearly indicates when records are hidden. This avoids exposing late-story outcomes before the reader opts in.

### Store bilingual editorial fields with the records

New records will use paired fields such as `summary` and `summaryEn`, selected with the existing `localizedField` helper. Fixed interface strings continue through the UI translation catalog. This avoids maintaining long editorial paragraphs as exact source-key translations while preserving the current language switch.

### Keep provenance concise

Records reference a small curated source registry and display source title, content type, and verification date. Sources establish traceability; they do not imply that all interpretation is official text.

## Risks / Trade-offs

- [The initial relationship set is selective rather than exhaustive] → Label the page as a guided reference and keep stable IDs so coverage can expand incrementally.
- [Bilingual fields increase record size] → Keep summaries concise and validate paired fields in tests.
- [Spoiler filtering can hide expected search results] → Show a hidden-result count and provide an explicit control to raise the spoiler level.
- [Curated lore can drift from source material] → Attach source IDs and verification dates, and add structural tests for missing or broken references.
- [The page becomes more complex] → Use focused components inside one view, semantic sections, and mobile layouts that collapse to a single column.

## Migration Plan

1. Add the normalized lore records while retaining legacy exports until all imports are migrated.
2. Rework `LoreView.vue` against the new records and existing theme.
3. Extend translations and focused tests for relationships, bilingual fields, filtering, and source integrity.
4. Build and run the relevant tests; rollback is limited to the lore view/data/translation changes because no persistent user data or public API is changed.

## Open Questions

- Whether later iterations should add dedicated entity routes or reuse the encyclopedia route.
- Whether official artwork can be distributed locally under the project's asset policy; this iteration uses typography and CSS composition without adding unverified media rights.
