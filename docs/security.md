# Security Baseline

- Argon2id password hashing; short-lived access tokens and rotating refresh tokens
- Tenant-aware RBAC plus project membership checks
- Deny-by-default authorization guards at API boundaries
- Signed, short-lived object-storage upload/download URLs
- File size/type validation, malware-scanning integration point, and IFC parser sandboxing
- Append-only audit trail for authentication, authorization, documents, workflow, and progress
- Secrets supplied through environment/secret manager; never committed
- Rate limits on authentication, uploads, search, and exports
- Secure headers, strict CORS allowlist, CSRF protection where cookies are used
- Parameterized database access through Prisma and validated DTOs
- Automated dependency audit, secret scanning, linting, tests, and container scanning in CI
- Backup, restore, retention, RPO/RTO, and incident-response procedures required before production

## Enforced API rate limits

R4C applies an IP-based global throttle to every HTTP route, including routes marked
`@Public()`. The default is 100 requests per minute and is configured with
`RATE_LIMIT_GLOBAL_PER_MINUTE`.

Stricter profiles override the global default for higher-risk operations:

- authentication login: `RATE_LIMIT_LOGIN_PER_MINUTE`, default 5;
- document upload requests, upload confirmation, and BIM processing requests:
  `RATE_LIMIT_UPLOAD_PER_MINUTE`, default 10;
- material search and filtered BIM-element retrieval:
  `RATE_LIMIT_SEARCH_EXPORT_PER_MINUTE`, default 30.

There are currently no dedicated export endpoints. Future search or export routes must
apply the shared `SearchExportRateLimit` decorator rather than defining an independent
limit.

Express trusts the configured number of reverse-proxy hops through
`TRUST_PROXY_HOPS`, default 1. The throttler tracker uses the resulting client address,
so different end users behind the same trusted load balancer receive independent
buckets. Set the hop count to match the deployed proxy chain; use 0 only when the API
is reached directly without a trusted proxy.
