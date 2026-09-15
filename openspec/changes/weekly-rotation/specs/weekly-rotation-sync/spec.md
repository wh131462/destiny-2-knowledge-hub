## ADDED Requirements

### Requirement: Official rotation snapshot
The synchronization job SHALL fetch the Bungie Milestones endpoint with a server-side API key and produce a same-origin JSON snapshot containing a schema identifier, generation time, rotation window, source metadata, status, activity records, and missing category information.

#### Scenario: Valid response produces a snapshot
- **WHEN** the endpoint returns a structurally valid response with at least one milestone or an explicit empty result for the current window
- **THEN** the job writes a schema-valid `weekly-rotation.json` snapshot with ISO timestamps and the current source metadata

#### Scenario: API key is absent
- **WHEN** the job runs without `BUNGIE_API_KEY` and without an explicit fixture input
- **THEN** the job fails with a clear configuration error and does not replace the last successful snapshot

### Requirement: Activity normalization and provenance
The job SHALL preserve source milestone and activity identifiers, normalize dates and categories, and enrich records from the local Manifest or editorial activity catalog when a hash match exists. It MUST preserve unmapped records with a fallback category and source name.

#### Scenario: Manifest enrichment succeeds
- **WHEN** a returned activity Hash matches a local activity definition
- **THEN** the snapshot includes the official/localized name, icon or guide association available from that definition, while retaining the source Hash

#### Scenario: Activity cannot be mapped
- **WHEN** a returned activity has no local Manifest or editorial match
- **THEN** the record remains in the snapshot under the fallback category with its original identifier and name, and the snapshot reports the unmapped category or count

### Requirement: Failure-safe publishing
The job SHALL use bounded timeouts and retry handling for transient failures, write through a temporary file, and replace the published snapshot only after validation succeeds. A failed run MUST leave the previous valid file intact and expose a stale or unavailable status for consumers.

#### Scenario: Transient request failure
- **WHEN** the endpoint times out, returns a retryable HTTP status, or is rate limited beyond the retry budget
- **THEN** the job records the failure without publishing an empty or partial replacement

#### Scenario: Existing snapshot is available
- **WHEN** synchronization fails after a previous successful snapshot exists
- **THEN** the previous snapshot remains readable and its consumer-visible status indicates it may be stale

### Requirement: Scheduled deployment integration
The Pages workflow SHALL run rotation synchronization before site build on scheduled and manually dispatched runs, pass the API key only through the workflow environment, and include the validated snapshot in the published artifact.

#### Scenario: Scheduled build
- **WHEN** the daily or manual Pages workflow runs with a valid API key
- **THEN** the site build includes the newly generated `web/dist/data/weekly-rotation.json`

#### Scenario: Secret is unavailable in a fork or local CI context
- **WHEN** the workflow cannot access the API key
- **THEN** the build retains the last checked-in or previously generated snapshot path and does not expose a secret in logs or client assets
