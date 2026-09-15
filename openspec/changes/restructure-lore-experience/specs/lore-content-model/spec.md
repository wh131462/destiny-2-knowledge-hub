## ADDED Requirements

### Requirement: Stable normalized lore records
The system SHALL represent concepts, events, factions, characters, releases, and sources as separate collections with stable unique IDs.

#### Scenario: Lore data is loaded
- **WHEN** the frontend imports the curated lore module
- **THEN** every record has a unique ID and the fields required for its record type

### Requirement: Valid entity relationships
The system SHALL express cross-record relationships through IDs that resolve to known lore records.

#### Scenario: Relationship integrity is checked
- **WHEN** the lore dataset is validated
- **THEN** every relationship target resolves to exactly one known record

### Requirement: Editorial provenance
The system SHALL associate curated narrative records with known sources and a verification date.

#### Scenario: Provenance is inspected
- **WHEN** a reader views a sourced lore record
- **THEN** the system identifies the referenced release or lore source and its verification context

### Requirement: Paired localization fields
The system SHALL provide Chinese and English names and summaries for user-facing normalized lore records.

#### Scenario: Localization completeness is checked
- **WHEN** the lore dataset is validated
- **THEN** required Chinese and English fields are non-empty for every user-facing record

### Requirement: Explicit narrative metadata
The system SHALL assign narrative records an era and spoiler tier and SHALL distinguish allegiance, species, and political faction where applicable.

#### Scenario: A faction record represents part of a species
- **WHEN** a political group belongs to a broader species
- **THEN** the record identifies both its species and its current alignment without classifying the entire species as allied or hostile
