# Authentication sessions

R4C uses short-lived JWT access tokens and opaque, rotating refresh tokens.

## Token delivery

Login and refresh responses return the access token and refresh token in the JSON body. This keeps the API usable by browser, mobile, and integration clients without introducing cookie-domain or CSRF behavior at the API boundary. Browser applications should terminate the JSON response in a trusted server layer and store the refresh token in a secure, httpOnly cookie rather than exposing it to browser JavaScript.

## Refresh-token storage and rotation

A refresh token is formatted as `<record-id>.<random-secret>`. The record ID locates the existing `RefreshToken` row. Only an Argon2id hash of the random secret is stored; the plaintext token is returned once and is never persisted.

Every successful refresh revokes the presented token and creates its replacement in the same database transaction. Presenting a previously revoked token is treated as reuse: all other active refresh tokens for the same user and tenant are revoked and an audit event is recorded.

## Endpoints

- `POST /api/v1/auth/login`: returns access and refresh tokens.
- `POST /api/v1/auth/refresh`: rotates a tenant-bound refresh token and returns a new token pair.
- `POST /api/v1/auth/logout`: revokes the presented refresh token.

Refresh and logout are public authentication-boundary routes, but remain protected by the global throttler and the auth-session-specific rate limit.
