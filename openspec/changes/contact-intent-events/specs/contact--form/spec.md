## ADDED Requirements

### Requirement: The success event carries the problem type

The `formularTrimis` event SHALL carry the problem type the visitor chose, and no personal data.

#### Scenario: Accepted submission

- **GIVEN** a valid form with problem type `dezinsectie`
- **WHEN** the endpoint accepts it
- **THEN** the `formularTrimis` entry in `dataLayer` has `tip_problema` equal to `dezinsectie` and no other keys besides `event`
