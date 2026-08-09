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
- Correction:
  - Require Next.js `^15.5.21`.
  - Add pnpm overrides for Sharp `>=0.35.0` and PostCSS `>=8.5.18`.
  - Regenerate and commit `pnpm-lock.yaml`.
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

### Failure 4 — residual BIM import ordering

- Workflow: `CI`
- Step: `Install and validate BIM worker`.
- Root cause:
  - The first manual import correction placed `from pathlib import Path` before `import tempfile`, which still violated Ruff's standard-library ordering.
- Correction:
  - Standard-library imports reordered to `hashlib`, `hmac`, `tempfile`, then `pathlib` and `urllib.parse` imports.
- Prevention:
  - Apply Ruff's exact import grouping rather than manually approximating alphabetical order.

### Failure 5 — fixed-date Phase 5 and Phase 6 journeys

- Workflows: `Phase 5 cost dashboard verification` and `Phase 6 progress workspace verification`.
- Symptoms:
  - Phase 5 expected populated CPI/SPI/EAC, but EAC was `null`.
  - Phase 6 expected earned value `42500.00`, but received `0.00`.
- Root cause:
  - Both tests hard-coded `asOf = "2026-07-21"`.
  - Progress fixtures are created at execution time; on 2026-07-28 they fell after the fixed reporting date and were correctly excluded from earned-value calculations.
- Correction:
  - Added a date-safe test runner that replaces the fixed `asOf` value with the current UTC execution date before launching the journey test.
  - Updated the Phase 5 and Phase 6 package scripts to use the date-safe runner.
- Prevention:
  - Time-dependent journey tests must derive reporting dates from execution time or explicitly backdate fixture records.
  - Do not use fixed historical `asOf` dates with dynamically timestamped fixtures.

### Non-root-cause warnings

- GitHub-hosted actions reported Node.js 20 action-runtime deprecation.
- Redis reported memory-overcommit and unauthenticated-local-network warnings.
- PostgreSQL Alpine reported missing locale packages.
- Next.js reported that `next start` is not the preferred command for a standalone build; the server still started successfully and this warning did not cause the failures above.

### Status

- Dependency security audit: green after lockfile refresh.
- Seed, auth-session, Phase 6.5, and Phase 7 verification: green on the refreshed dependency graph.
- Residual BIM import ordering: corrected and rerun triggered.
- Phase 5 and Phase 6 fixed-date failures: corrected through date-safe execution and rerun triggered.
- Merge decision: blocked until the latest required checks are green.

## 2026-08-09 — PR #39 launch-readiness verification environment

### Context

- Branch: `fix/launch-local-uat-test-contract`
- SHA: `efd0ef7367b82c29e12239724952dec93a12da16`

### Failure 1 — required local toolchain unavailable

- Command: local environment preflight for `pnpm local:verify:windows`
- Exact failure:
  - `node` is not available on the user `PATH`.
  - `docker` and Docker Compose are not available on the user `PATH`.
  - the available `pnpm` reports `11.9.0`, while the repository pins `10.13.1`.
- Root cause: the current execution environment does not have the repository-supported Windows toolchain installed or exposed on `PATH`.
- Classification: local environment issue.
- Fix: no repository change; install/expose Node.js 22+, Docker Desktop, and pnpm 10.13.1 before rerunning the Windows acceptance verifier. A bundled Node.js `v24.14.0` can support non-Docker checks in this session.
- Verification: blocked until the required user toolchain is available.
- Recurrence prevention: keep the verifier's explicit Node, Docker, and pnpm preflight checks and record tool versions in the UAT evidence package.

### Failure 2 — frozen install cannot reach the package registry

- Command: `pnpm install --frozen-lockfile`
- Exact failure: registry metadata requests fail with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`; the pnpm metadata fetch terminates with `ERR_PNPM_META_FETCH_FAIL`.
- Root cause: the current host's TLS certificate chain is not trusted by the available pnpm runtime.
- Classification: CI/local environment issue.
- Fix: no repository change; configure the host's trusted corporate/root CA for Node/pnpm without disabling TLS verification, then rerun with pnpm 10.13.1.
- Verification: blocked by the host certificate configuration.
- Recurrence prevention: validate registry TLS access during environment setup and never work around certificate failures with `strict-ssl=false` or disabled TLS verification.

### Failure 3 — GitHub check and administration access unavailable

- Workflow/command: PR #39 check inspection through `gh pr view` and the GitHub API.
- Exact failure: GitHub CLI returns HTTP 401 and requests GitHub authentication; unauthenticated API retrieval is unavailable from this host.
- Root cause: no usable GitHub API authentication is configured in the current execution environment.
- Classification: external access/credential issue.
- Fix: no repository change; authenticate GitHub CLI with an appropriately scoped account before check inspection, PR mutation, merge, or branch-protection work.
- Verification: Git refs were fetched successfully, proving `main` and PR #39 SHAs and a clean synthetic merge, but exact workflow conclusions and repository settings remain unverified.
- Recurrence prevention: include `gh auth status` in launch-execution preflight and verify required repository administration scope before the Go/No-Go closure session.

### Failure 4 — branch-protection documentation used incorrect check names

- Workflow/command: static comparison of `docs/POST-MERGE-GOVERNANCE-AND-LOCAL-UAT.md` with `.github/workflows/*.yml`.
- Exact failure: the document named `Seed verification / verify` and `KAAF Architecture / architecture`, neither of which matches a defined job, and listed the Phase 5–7 launch gates as conditional rather than required.
- Root cause: the governance text used conceptual gate labels instead of the exact workflow/job check names.
- Classification: documentation/governance contract defect.
- Fix: replace the labels with exact workflow/job names and list every launch-required Phase 5, Phase 6, Phase 6.5, Phase 7, and pull-request KAAF job.
- Verification: compared the corrected list directly with workflow `name`, job identifier, and job display-name definitions under `.github/workflows/`.
- Recurrence prevention: derive branch-protection check names from successful check runs on the release-candidate pull request and re-confirm them before applying the ruleset.

### Failure 5 — Windows verifier PowerShell parse failure

- Command: PowerShell parser validation of `scripts/local-verify.ps1`.
- Exact failure: `InvalidVariableReferenceWithDrive` at `Write-Host "Checking $Name: $Url"`.
- Root cause: PowerShell interprets a colon immediately after an unbraced variable name as part of a scoped/drive-qualified variable reference.
- Classification: test-harness defect.
- Fix: delimit the variable as `"Checking ${Name}: $Url"`.
- Verification: rerun PowerShell parser validation with zero parse errors.
- Recurrence prevention: parse Windows scripts in CI or a static preflight even when Docker-backed execution is unavailable.
