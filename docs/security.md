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
