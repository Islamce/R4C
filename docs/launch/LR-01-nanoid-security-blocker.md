# LR-01 — Production JavaScript Security Blocker

Status: REMEDIATED — FINAL STANDARD GATES RUNNING
Classification: BLOCKER
Owner: Codex / Engineering Lead
Reviewer: ChatGPT / Program Orchestrator
Evidence reviewer: Claude / Evidence & Integration Lead
Branch: fix/launch-security-nanoid

## Verified failure

The scheduled Security workflow on 2026-08-09 failed at `pnpm audit --prod --audit-level high` because `nanoid <3.3.17` was present through:

`apps/web > next > postcss > nanoid`

Advisory: GHSA-2v37-7h3g-55p8
Audit-declared patched range: `nanoid >=3.3.17`

The later CycloneDX artifact upload failure was secondary: the audit terminated the job before the SBOM was generated.

## Implemented remediation

The root pnpm override resolves `nanoid` to the published safe release `5.1.16`. The lockfile was regenerated with pnpm 10.13.1.

The launch stack remains unchanged:

- Next.js 15.x
- Prisma 6.x
- TypeScript 5.x
- BullMQ 5.x
- React 19.x

The broad Dependabot PR #37 was not reused or merged.

## Verified remediation evidence

The controlled lockfile verification run completed the following successfully before the generic web test-contract issue was encountered:

- `pnpm install --lockfile-only --no-frozen-lockfile`
- `pnpm install --frozen-lockfile`
- `pnpm audit --prod --audit-level high` → `No known vulnerabilities found`
- Prisma Client generation with Prisma 6.19.3
- workspace typecheck
- production build

The generic `pnpm test` failure was separately classified as a baseline test-contract defect because `apps/web` uses `node --test`, which auto-discovers environment-dependent E2E journeys and the `run-date-safe-e2e.mjs` helper without the required seeded UAT environment. That defect belongs to the Local UAT/Test Contract corrective gate and is not caused by the nanoid remediation.

KAAF generated context was regenerated with the repository's official `scripts/architecture/generate.sh` and validated with `generate.py --check` after all temporary workflow files were removed from the remediation branch.

## Required verification before merge

1. `pnpm install --frozen-lockfile`
2. `pnpm audit --prod --audit-level high`
3. CI
4. Security
5. Auth session verification
6. Seed verification
7. KAAF Architecture

Phase-specific workflows remain release evidence where their path filters or triggers apply; the nanoid-only dependency remediation does not alter application business behavior.

## Exit criteria

- No high/critical production JavaScript vulnerability from nanoid.
- Required standard launch checks green.
- No major framework/runtime upgrade introduced.
- PR reviewed and merged to `main`.
