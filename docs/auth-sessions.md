# Authentication sessions

R4C uses short-lived JWT access tokens and opaque, rotating refresh tokens.

## Token delivery

Login and refresh responses return the access token and refresh token in the JSON body. This keeps the API usable by browser, mobile, and integration clients without introducing cookie-domain or CSRF behavior at the API boundary. The Next.js browser boundary terminates that JSON response and stores the tokens only in secure, httpOnly cookies.

The browser login form sends only `email` and `password`. It never sends, displays, or stores a tenant UUID. The Next.js server resolves the tenant from the request workspace, injects the UUID only into the server-to-server `/auth/login` call, and returns a browser-safe user object containing the tenant code and display name.

## Tenant workspace resolution

`TENANT_BASE_DOMAIN` defines the multi-tenant base domain. For example:

- `alomran.r4c.local` with `TENANT_BASE_DOMAIN=r4c.local` resolves to tenant code `ALOMRAN`.
- `alomran.example.com` with `TENANT_BASE_DOMAIN=example.com` resolves to `ALOMRAN`.

The request uses `X-Forwarded-Host` when present, then `Host`, so the platform works behind the configured trusted reverse proxy. The closest subdomain label before the base domain is normalized to uppercase and validated before lookup.

For local development without DNS, use either:

- `http://localhost:3000/login?tenant=ALOMRAN`; or
- `TENANT_DEFAULT_CODE=ALOMRAN`.

The query override is accepted only on localhost or outside production. Production tenant selection remains host-bound.

### Exact tenant lookup

`GET /api/v1/tenants/by-code/:code` is the only public tenant-resolution route. It:

- accepts a single exact code rather than exposing a tenant list;
- returns only `{ id, code, name, status }`;
- returns only `ACTIVE` tenants;
- uses the same 404 response for invalid, inactive, and missing codes;
- is rate-limited per resolved client IP through `RATE_LIMIT_TENANT_LOOKUP_PER_MINUTE`, default `20` per minute.

The UUID returned by this internal API call is consumed only by the Next.js server layer. It is not included in the login HTML, login request body, session JSON, user cookie, or tenant cookie. The browser session stores only the tenant code and display name; refresh and logout resolve that code server-side before calling the multi-client API contract.

## Refresh-token storage and rotation

A refresh token is formatted as `<record-id>.<random-secret>`. The record ID locates the existing `RefreshToken` row. Only an Argon2id hash of the random secret is stored; the plaintext token is returned once and is never persisted.

Every successful refresh revokes the presented token and creates its replacement in the same database transaction. Presenting a previously revoked token is treated as reuse: all other active refresh tokens for the same user and tenant are revoked and an audit event is recorded.

The refresh lifetime is configured with `REFRESH_TOKEN_TTL_DAYS`. It defaults to 14 days and accepts integer values from 1 through 365. Refresh and logout share an authentication-session throttle configured by `RATE_LIMIT_AUTH_SESSION_PER_MINUTE`, defaulting to 20 requests per minute per resolved client IP.

## UAT tenant

Run the idempotent Alomran UAT seed with:

```bash
SEED_UAT_ADMIN_PASSWORD='<strong secret>' pnpm --filter @r4c/api seed:uat
```

Defaults:

- code: `ALOMRAN`
- canonical database name: `Alomran Development`
- Arabic display name: `العمران للتطوير العقاري`
- administrator email: `uat.admin@alomran.test`

Override them with `SEED_UAT_TENANT_CODE`, `SEED_UAT_TENANT_NAME`, `SEED_UAT_TENANT_NAME_AR`, and `SEED_UAT_ADMIN_EMAIL`. `SEED_UAT_ADMIN_PASSWORD` is mandatory and must contain at least 12 characters. The wrapper invokes the existing bootstrap seed, so ADMIN and VIEWER roles, code-derived permission assignments, the administrator membership, password hashing, and idempotent upserts remain identical to the standard tenant seed.

The current Tenant schema has one canonical `name` field. The English name is stored in the database; the Arabic organization name is supplied from `SEED_UAT_TENANT_NAME_AR` by the server-rendered Arabic login context without introducing a schema migration.

## Endpoints

- `GET /api/v1/tenants/by-code/:code`: resolves one exact active tenant for the trusted Next.js login boundary.
- `POST /api/v1/auth/login`: accepts the server-injected `tenantId` and returns access and refresh tokens.
- `POST /api/v1/auth/refresh`: accepts `refreshToken` and `tenantId`, rotates the tenant-bound token, and returns a new token pair.
- `POST /api/v1/auth/logout`: accepts `refreshToken` and `tenantId` and revokes the presented token.

Refresh, logout, login, and tenant lookup are public authentication-boundary routes, but remain protected by the global throttler and their route-specific rate limits.
