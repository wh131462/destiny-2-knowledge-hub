## ADDED Requirements

### Requirement: Weekly rotation page
The site SHALL provide a `/weekly-rotation` route showing the current rotation window, data freshness, source,重点 activity records, category groupings, and explicit missing or unavailable categories. The page MUST distinguish fresh, partial, stale, and unavailable data from an empty successful result.

#### Scenario: Fresh snapshot loads
- **WHEN** a valid fresh snapshot is loaded
- **THEN** the page shows the current window, update time, grouped activities, and an accessible status label identifying the source

#### Scenario: Snapshot is stale or unavailable
- **WHEN** the snapshot status is stale, partial, or unavailable
- **THEN** the page shows a visible warning and last-known data or an empty-state explanation without claiming that no activities are rotating

### Requirement: Rotation filtering and deep links
The page SHALL allow category, difficulty, and data-status filtering with Ant Design Vue `a-select` controls that have accessible labels. Active filters SHALL be reflected in the URL and restored when the URL is opened directly.

#### Scenario: Filter changes results
- **WHEN** a user selects a category or difficulty
- **THEN** the displayed records update to match the selected values and the query string changes without losing the current page context

#### Scenario: Deep link restores filters
- **WHEN** a user opens a URL containing supported rotation query parameters
- **THEN** the page initializes the corresponding select values and displays the same filtered records

### Requirement: Activity detail actions
Each rotation record SHALL provide a keyboard-accessible expand action showing available modifiers, champions, rewards, provenance, and dates. When a matching internal guide or Manifest entry exists, the detail SHALL provide a link to it; records without one SHALL explain that no internal mapping is available.

#### Scenario: User expands a mapped activity
- **WHEN** a user activates an activity card with keyboard or pointer
- **THEN** the card expands without changing layout width and exposes its details and internal guide or Manifest link

#### Scenario: User copies a summary
- **WHEN** a user activates the copy-summary action
- **THEN** the site copies a concise localized summary of the current filtered rotation and provides a visible success or failure announcement

### Requirement: Responsive and accessible interaction
The page SHALL remain usable at 375px width and desktop widths without horizontal overflow. Selectors, expand controls, status messages, and countdown information MUST have accessible names, visible focus states, and text that wraps within its container.

#### Scenario: Narrow viewport
- **WHEN** the page is rendered at 375px wide with long activity names or expanded details
- **THEN** content remains single-column, readable, and free of horizontal overflow

#### Scenario: Countdown reaches the end
- **WHEN** the current time passes the snapshot `endDate`
- **THEN** the countdown changes to an expired state and the page keeps the data freshness warning visible
