// The contact endpoint's replies. Its contract tests assert them, and the browser tests answer with them in its place,
// so a change to public/sideform.php cannot leave the browser tests passing against a stale copy.
export const RETRY_MESSAGE = "Te rugăm să încerci să retrimiți formularul, pentru că ";
export const ACCEPTED = { error: "false", succes: "true", message: "Am primit detaliile tale și te vom contacta în curând!" };
