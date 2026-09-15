## ADDED Requirements

### Requirement: Preferred armor definition
The system SHALL use the strongest available catalog evidence when choosing the default definition for a same-name armor group and SHALL keep other definitions available for inspection.

#### Scenario: Current and historical definitions share an armor group
- **WHEN** an armor group contains a source-confirmed or current-system definition and a historical definition
- **THEN** the catalog card and initial detail view use a non-historical definition

#### Scenario: Only historical definitions exist
- **WHEN** every definition in an armor group is historical
- **THEN** the system displays the best historical definition and labels its status without hiding the group

### Requirement: Task-oriented armor navigation
The system SHALL expose catalog lookup, set research, set planning, and system guidance as distinct primary views.

#### Scenario: User switches armor tasks
- **WHEN** the user selects a primary armor view
- **THEN** the page displays only the controls and content required for that task while preserving compatible selections

#### Scenario: User opens the catalog
- **WHEN** catalog view is active
- **THEN** the user can select Exotic armor, all armor, or armor mods as the catalog scope

### Requirement: Recoverable catalog state
The system SHALL represent stable armor browsing state in the route query and SHALL restore valid state on reload or shared navigation.

#### Scenario: User changes catalog filters
- **WHEN** the user changes view, catalog scope, class, slot, availability, sorting, or search
- **THEN** the route query is updated without adding a history entry for every filter change

#### Scenario: Route contains invalid armor state
- **WHEN** the armor page loads with an unsupported query value
- **THEN** the system falls back to a valid default without rendering an invalid selection

### Requirement: Scannable armor catalog
The system SHALL present compact armor summaries and defer complete version evidence to the detail view.

#### Scenario: User browses armor results
- **WHEN** matching armor groups are displayed
- **THEN** each result communicates identity, class or slot context, primary trait or set membership, availability, and version count without listing every alternate-version label

#### Scenario: User browses many results on a narrow screen
- **WHEN** more results exist than the narrow-screen initial page size
- **THEN** the system renders an initial subset and offers an accessible load-more control that preserves current filters

### Requirement: Armor record details
The system SHALL present armor details in an accessible Ant Design modal with clear identity, version, intrinsic, set, acquisition, and related-build sections when evidence exists.

#### Scenario: User opens grouped armor
- **WHEN** the selected armor has multiple definitions
- **THEN** the detail opens on the preferred definition and provides an accessible Ant Design version selector for every grouped definition

#### Scenario: User inspects armor statistics
- **WHEN** the detail has no concrete owned-item roll
- **THEN** the system explains that random attributes belong to equipment instances and does not render inferred definition-level stat bars

### Requirement: Responsive and accessible controls
The system SHALL keep primary views, Ant Design selects, result cards, and detail actions readable and operable on desktop and narrow screens.

#### Scenario: User opens the page at 390 CSS pixels wide
- **WHEN** the armor page is rendered at the narrow viewport
- **THEN** every primary view is visibly reachable without unexplained horizontal clipping and long select labels wrap or truncate within their containers
