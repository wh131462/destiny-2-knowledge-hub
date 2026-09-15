## ADDED Requirements

### Requirement: Separate set research and planning
The system SHALL present set research and five-slot planning as distinct views backed by the same current set selection.

#### Scenario: User researches a set
- **WHEN** set view is active
- **THEN** the user sees the searchable set directory, five set pieces, activation thresholds, effect descriptions, and an action to use the set in planning

#### Scenario: User starts planning from a set
- **WHEN** the user activates the planning action from set details
- **THEN** planner view opens with the same class and set selected

### Requirement: Preferred Exotic choices
The system SHALL group same-name Exotic armor choices and use the preferred definition for initial planner selection.

#### Scenario: Exotic has multiple definitions
- **WHEN** the user searches the planner's Exotic selector
- **THEN** the selector shows one choice for the armor identity and selecting it uses the preferred definition

### Requirement: Understandable allocation strategies
The system SHALL distinguish selected-set pieces, second-set pieces, an Exotic piece, and a free slot while reporting activated thresholds.

#### Scenario: User selects four-plus-one without an Exotic
- **WHEN** `4+1` is selected and no Exotic is equipped
- **THEN** four compatible slots use the selected set and one slot remains explicitly free

#### Scenario: User selects an Exotic
- **WHEN** the user chooses an Exotic while a compatible strategy is active
- **THEN** its actual armor slot is reserved and no more than one Exotic contributes to the preview

#### Scenario: User selects two-plus-two-plus-one
- **WHEN** the user selects `2+2+1` with an Exotic and a second set
- **THEN** two valid pieces from each set and the Exotic occupy the five distinct slots and each set reports its independently active effects

### Requirement: Planner continuity and transfer
The system SHALL preserve planner selections while switching between armor views and SHALL retain the existing confirmed transfer into the manual build editor.

#### Scenario: User leaves and returns to planner view
- **WHEN** the user switches to set research and then returns to planner during the same page session
- **THEN** selected set, Exotic, strategy, and slot assignments remain available

#### Scenario: User transfers a plan
- **WHEN** the user confirms transfer to the build editor
- **THEN** the five armor slots are transferred while weapons, abilities, artifact, and unrelated configuration remain unchanged
