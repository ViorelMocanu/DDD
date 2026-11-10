## ADDED Requirements

### Requirement: Client-side validation

The form SHALL refuse to submit until name, phone, email, problem type and consent are valid, marking each invalid field.

#### Scenario: Invalid input

- **GIVEN** the contact form with an invalid phone number
- **WHEN** the visitor submits
- **THEN** no request is sent, the field is marked as an error and the `formularInitializat` event was pushed

### Requirement: Submission outcome is reported truthfully

The form SHALL report success only when the endpoint accepted the submission.

#### Scenario: Accepted

- **GIVEN** a valid form
- **WHEN** the endpoint replies with `error` set to `"false"`
- **THEN** the success state is shown and the events `formularTrimis`, the Ads conversion and `conversieAcceptata` are pushed

#### Scenario: Refused

- **GIVEN** a valid form
- **WHEN** the endpoint replies with `error` set to `"true"` or with a non-JSON body
- **THEN** the error state is shown, `formularEroare` is pushed and no conversion is recorded

### Requirement: Endpoint contract

The endpoint SHALL accept a JSON `POST` at `/sideform.php` and reply with JSON in the legacy shape.

#### Scenario: Valid submission

- **GIVEN** a same-origin JSON `POST` with valid fields and `datasent` set to `"true"`
- **WHEN** the endpoint handles it
- **THEN** the lead is stored, an office notification and a visitor confirmation are sent, and the reply has `error` `"false"` and `succes` `"true"`

#### Scenario: Invalid fields

- **GIVEN** a submission with a missing name, bad email or bad phone
- **WHEN** the endpoint handles it
- **THEN** nothing is stored or sent and the reply has `error` `"true"` with one entry per problem in `errors`

#### Scenario: Not a submission

- **GIVEN** a `GET` request or a body without `datasent`
- **WHEN** the endpoint handles it
- **THEN** the reply is the legacy "Input greșit." error

### Requirement: Endpoint resists abuse

The endpoint SHALL never execute, interpolate into SQL, or place unescaped into email any value taken from a request.

#### Scenario: Hostile values

- **GIVEN** field values containing PHP interpolation syntax, SQL quotes, HTML tags and line breaks
- **WHEN** a valid submission carries them
- **THEN** they are stored as literal text, appear HTML-escaped in the email body, and no extra email header is created

#### Scenario: Foreign origin

- **GIVEN** a `POST` whose `Origin` header is not an allowed host
- **WHEN** the endpoint handles it
- **THEN** nothing is stored or sent and the reply is an error

#### Scenario: Honeypot filled

- **GIVEN** a submission with the hidden trap field filled
- **WHEN** the endpoint handles it
- **THEN** the lead is stored and sent to the office marked as possible spam, no confirmation is sent to the visitor, and the reply looks like a success

#### Scenario: Flooding

- **GIVEN** more submissions from one address than the allowed burst
- **WHEN** the next one arrives inside the window
- **THEN** it is refused with an error reply
