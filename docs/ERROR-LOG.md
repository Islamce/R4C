# R4C Error Log

## 2026-07-28 — PR #33 local runtime enablement

### Context

PR #33 (`feat/local-development-runtime`) added personal-computer bootstrap scripts and local lifecycle commands for Windows, macOS, and Linux.

### Failure 1 — BIM worker lint gate

- Workflow: `CI`
- Job: `validate`
- Step: `Install and validate BIM worker`
- Root cause:
  - Ruff `I001` import ordering violations in `extractor.py` and `main.py`.
  - Ruff `PIE810` duplicated `startswith` calls in IFC schema validation.
- Correction:
  - Imports reorganised.
  - IFC schema check changed to `schema.startswith(("IFC2X3", "IFC4"))`.
- Prevention:
  - Run `ruff check apps/bim-worker` before pushing Python changes.

### Failure 2 — production dependency security audit

- Workflow: `Security`
- Job: `supply-chain`
- Step: `Audit production JavaScript dependencies`
- Command: `pnpm audit --prod --audit-level high`
- Root cause:
  - Lockfile resolved Next.js 15.5.20 while advisories require 15.5.21 or newer.
  - Vulnerable transitive Sharp and PostCSS versions were also present.
  - SBOM upload then failed because the audit stopped earlier generation steps.
- Correction initiated:
  - Require Next.js `^15.5.21`.
  - Add pnpm overrides for Sharp `>=0.35.0` and PostCSS `>=8.5.18`.
  - Regenerate `pnpm-lock.yaml` in CI and rerun audit, lint, typecheck, tests, and build.
- Prevention:
  - Treat package manifests and lockfile as one controlled change.
  - Run production audit before opening or updating a PR.
  - Do not manually edit dependency integrity records.

### Failure 3 — frozen lockfile cascade

- Affected workflows: `CI`, `Security`, `Seed verification`, `Auth session verification`, Phase 5, Phase 6, Phase 6.5, and Phase 7 verification.
- Failed stage: dependency installation.
- Root cause:
  - `apps/web/package.json` and root `pnpm.overrides` were changed before the regenerated `pnpm-lock.yaml` was committed.
  - All standard workflows use `pnpm install --frozen-lockfile`, so they correctly rejected the inconsistent dependency graph before running tests.
  - The temporary refresh workflow originally ran the security audit before committing the regenerated lockfile. When the audit failed, the commit step was never reached.
- Correction:
  - Reordered the refresh workflow to generate and commit `pnpm-lock.yaml` before running frozen installation, audit, lint, typecheck, tests, and build.
  - Limited the refresh workflow trigger to its own controlled workflow-file update so the bot lockfile commit does not cause a recursive loop.
- Prevention:
  - Never push a dependency manifest change without its generated lockfile in the same change set.
  - Dependency repair automation must persist the generated lockfile before non-persistence validation gates.
  - Standard PR workflows remain frozen-lockfile-only.

### Non-root-cause warnings

- GitHub-hosted actions reported Node.js 20 action-runtime deprecation.
- Redis reported memory-overcommit and unauthenticated-local-network warnings.
- PostgreSQL Alpine reported missing locale packages.

These warnings did not terminate PR #33 checks and must not be confused with the root causes above.

### Status

- BIM lint correction: committed.
- Dependency manifest correction: committed.
- Frozen lockfile cascade: recorded and refresh workflow corrected.
- Lockfile regeneration and full verification: pending automated bot commit and rerun.
- Merge decision: blocked until all required checks are green.
