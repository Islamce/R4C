# LR-01 — Production JavaScript Security Blocker

Status: OPEN
Classification: BLOCKER
Owner: Codex / Engineering Lead
Reviewer: ChatGPT / Program Orchestrator
Evidence reviewer: Claude / Evidence & Integration Lead
Branch: fix/launch-security-nanoid

## Verified failure

The scheduled Security workflow on 2026-08-09 failed at `pnpm audit --prod --audit-level high` because `nanoid <3.3.17` is present through:

`apps/web > next > postcss > nanoid`

Advisory: GHSA-2v37-7h3g-55p8
Patched version: `nanoid >=3.3.17`

The later CycloneDX artifact upload failure is secondary: the audit terminated the job before the SBOM was generated.

## Fix constraint

Apply the smallest dependency remediation that removes the vulnerable nanoid resolution while keeping the current launch stack unchanged:

- Next.js 15.x
- Prisma 6.x
- TypeScript 5.x
- BullMQ 5.x
- React 19.x

Do not merge or reuse the broad Dependabot PR #37 as the launch fix.

## Required verification before merge

1. `pnpm install --frozen-lockfile`
2. `pnpm audit --prod --audit-level high`
3. CI
4. Security
5. Auth session verification
6. Seed verification
7. Phase 5 cost dashboard verification
8. Phase 6 progress workspace verification
9. Phase 6.5 UX loop closers verification
10. Phase 7 production deployment verification
11. KAAF Architecture

## Exit criteria

- No high/critical production JavaScript vulnerability from nanoid.
- All required launch checks green.
- No major framework/runtime upgrade introduced.
- PR reviewed and merged to `main`.
