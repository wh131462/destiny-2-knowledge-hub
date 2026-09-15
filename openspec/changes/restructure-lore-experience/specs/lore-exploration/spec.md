## ADDED Requirements

### Requirement: Guided lore overview
The system SHALL provide a concise newcomer-oriented overview that connects foundational concepts to a sequence of anchor story events.

#### Scenario: New reader opens the lore page
- **WHEN** a reader opens the lore page
- **THEN** the system presents an introductory reading path before the reference collections

### Requirement: Spoiler-aware browsing
The system SHALL filter narrative outcomes according to a reader-selected spoiler level and SHALL communicate when matching material is hidden.

#### Scenario: Introductory spoiler level is active
- **WHEN** records above the selected spoiler level would otherwise appear
- **THEN** the system omits those records and reports that additional material is hidden

#### Scenario: Reader changes spoiler level
- **WHEN** the reader selects a higher spoiler level
- **THEN** the system immediately reveals records permitted by that level

### Requirement: Distinct story and release chronologies
The system SHALL present in-universe story events separately from expansion release dates and gameplay-system metadata.

#### Scenario: Reader browses the story timeline
- **WHEN** the story timeline is active
- **THEN** entries emphasize narrative era, causes, consequences, participants, and destinations rather than product release features

#### Scenario: Reader browses release history
- **WHEN** the release-history view is active
- **THEN** entries show release year, title, destination, and major system additions without representing that list as in-universe chronology

### Requirement: Consistent discovery controls
The system SHALL apply search and applicable filters to the active lore collection and SHALL provide accessible names for all controls.

#### Scenario: Reader searches an active collection
- **WHEN** the reader enters a Chinese or English term
- **THEN** the active view shows records matching their searchable names, summaries, aliases, or related labels

#### Scenario: Reader uses a narrow screen
- **WHEN** the viewport is narrow
- **THEN** search, selectors, tabs, timeline entries, and related content remain readable and operable without incoherent overlap

### Requirement: Related reading
The system SHALL expose meaningful connections among lore records without requiring a free-form graph interface.

#### Scenario: Record has known relationships
- **WHEN** a concept, event, faction, or character is displayed
- **THEN** the system displays readable labels for its related records and lets the reader navigate to the relevant collection

### Requirement: Bilingual lore presentation
The system SHALL present core lore interface and editorial summaries in Chinese and English according to the active site locale.

#### Scenario: Reader switches locale
- **WHEN** the active locale changes
- **THEN** visible lore headings, controls, summaries, metadata, and empty states use the selected language without changing record IDs or relationships
