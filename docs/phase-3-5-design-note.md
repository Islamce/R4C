# Phase 3.5 design note

This phase completes the existing authentication contract without changing the Prisma schema.

- Refresh tokens are opaque random values, not JWTs.
- The token record ID is included only as a lookup prefix; the secret portion is verified against the stored Argon2id hash.
- Rotation revokes the old row and creates the replacement in one transaction.
- Reuse of a revoked token revokes every still-active refresh token for the same user and tenant.
- JSON delivery is intentional for a multi-client API. The Next.js frontend can place the returned refresh token into an httpOnly cookie at its server boundary.
