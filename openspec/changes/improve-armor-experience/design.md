## Context

`ArmorView.vue` currently owns five content tabs, contextual filters, archive cards, mod cards, and an Ant Design detail modal. `ArmorSetExplorer.vue` combines a desktop master-detail set browser with a five-slot planner, while `armorGroups()` chooses a group's first item by intrinsic-trait count and hash. That ordering can surface a historical definition as the apparent current item. On narrow screens the five content tabs overflow horizontally, set browsing and planning form a long continuous page, and a 48-item archive page is expensive to scan.

The implementation must remain in Vue 3 and Ant Design Vue, use the existing theme and localization helpers, preserve Manifest evidence boundaries, and keep all select controls as `a-select` components.

## Goals / Non-Goals

**Goals:**
- Make the best available current definition the default representation of each same-name armor group.
- Organize the page around the user tasks of catalog lookup, set research, set planning, and system learning.
- Reuse the weapon archive's compact catalog and record-detail hierarchy without pretending armor has definition-level random stats.
- Keep important browsing state recoverable through the URL.
- Make set browsing, planning, and armor details efficient on narrow screens.

**Non-Goals:**
- Infer random stat rolls, live drop rates, build quality, or current availability beyond catalog evidence.
- Replace the full manual loadout editor or change its persisted draft schema.
- Change Manifest snapshot formats or introduce a new UI dependency.
- Redesign unrelated site pages.

## Decisions

### Centralize preferred armor version selection

Add exported helpers in `packages/manifest-catalog/armor.js` that rank `source-confirmed` above `current-system-source-unconfirmed`, and both above `historical`. `armorGroups()` will return versions in that order, with trait coverage and hash used only as tie breakers. Catalog cards, detail initialization, and planner Exotic choices will consume the ordered groups instead of implementing local heuristics.

Sorting only in `ArmorView.vue` was rejected because the planner and future consumers would continue to disagree about the representative version.

### Use four task views with a scoped catalog selector

The top-level view IDs will be `catalog`, `sets`, `planner`, and `guide`. Catalog scope will be an Ant Design select with `exotics`, `all`, and `mods`. This keeps primary navigation short enough to remain visible on mobile while preserving every current dataset.

Keeping five dataset-oriented tabs was rejected because it hides the planner inside set browsing and overflows the narrow layout.

### Keep one stateful set component with explicit modes

`ArmorSetExplorer` will receive a `mode` prop. Set mode renders the directory and selected set intelligence; planner mode renders the five-slot planner and a compact selected-set control. The component remains cached while switching modes so selected set, Exotic, and slot assignments survive navigation. Set details emit a request to open planner mode.

Separate planner and set components were considered, but would require lifting or duplicating intertwined selection state without improving the current release.

### Use compact summaries and an Ant Design record modal

Catalog cards will show identity, primary intrinsic or set membership, availability, and version count. Full definition labels, alternate-version differences, acquisition evidence, and related records belong in the detail modal. The existing `a-modal` remains responsible for focus trapping and keyboard dismissal; its content will adopt the weapon record's identity, version, and section hierarchy.

A custom overlay identical to the weapon page was rejected because Ant Design already supplies robust dialog behavior and the project uses it throughout armor workflows.

### Synchronize stable browsing state to query parameters

View, catalog scope, class, slot, availability, sort order, and non-empty search text will be represented in the route query using `router.replace`. Invalid values fall back to documented defaults. Global search queries continue to open catalog scope rather than changing unrelated user selections unexpectedly.

### Treat planning presets as allocation strategies

The planner will expose `4+1`, `2+2+1`, and `5` strategies. `4+1` means four selected-set pieces plus an Exotic when chosen, otherwise a free slot; `2+2+1` requires an Exotic; `5` remains available but is visually secondary. Activation results stay adjacent to the slot grid, and transfer to the full build editor retains its confirmation step.

## Risks / Trade-offs

- [Availability labels do not prove live drops] → Preserve existing evidence wording and avoid a “currently obtainable” claim.
- [Changing group order affects tests and any implicit first-item consumers] → Export and test the ranking helper with all known availability states.
- [URL synchronization can create watch loops] → Normalize state before replacing the route and skip replacements when serialized queries already match.
- [One cached set component has conditional layouts] → Keep shared selection logic centralized and limit mode-specific markup to top-level sections.
- [Fewer details on cards can hide useful evidence] → Keep a clear availability label and expose all evidence immediately inside the record modal.

## Migration Plan

1. Add and test preferred-version helpers without changing the catalog payload.
2. Rework the armor view state model and route synchronization while retaining existing data-loading boundaries.
3. Split set browsing and planner presentation through the component mode prop.
4. Restyle catalog cards and the existing Ant Design modal using current theme tokens.
5. Run focused rules tests, the full test suite, the production build, and desktop/mobile browser checks.

Rollback only requires reverting the armor helper, view, component, translations, and tests; no persisted data migration is involved.

## Open Questions

- A later change may remember the last selected armor view in local storage; this change treats the URL as the only persistent browsing state.
- Live acquisition ranking could replace catalog availability ranking after a trustworthy live source is available.
