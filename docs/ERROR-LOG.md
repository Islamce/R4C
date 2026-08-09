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

## 2026-08-09 20:31 +03:00 — Windows Local UAT setup on main

### Context

- Environment: Windows 10 build 26200.8973, Node.js 24.19.0, pnpm 10.13.1, Docker Desktop 4.85.0 with Linux/WSL2 engine 29.6.2.
- Branch at failure: `main`
- SHA: `cb663ce0ff3676359afb6d2cfab7302b44d15ca7`

### Failure 1 — Alomran UAT seed cannot spawn pnpm on Windows

- Command: `powershell -ExecutionPolicy Bypass -File scripts/local-setup.ps1`, failing at `pnpm --filter @r4c/api seed:uat`.
- Exact error: `R4C UAT seed failed: spawn EINVAL` followed by `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`.
- Earliest causal failure: `apps/api/prisma/seed-uat.ts` directly spawned `pnpm.cmd` on Windows without command-shell handling.
- Classification: Product defect.
- Fix: run the existing static `pnpm.cmd seed` command through `cmd.exe /d /s /c` only on Windows; Linux behavior is unchanged and no dynamic user input enters the command string.
- Validation: rerun the Alomran UAT seed, then rerun the full setup and Windows verification gates.
- Recurrence prevention: exercise `seed:uat` on Windows and retain platform-specific child-process handling.

### Failure 2 — setup reports readiness after a failed required command

- Command: `powershell -ExecutionPolicy Bypass -File scripts/local-setup.ps1`.
- Exact error: the UAT seed exited 1, but the setup script printed `R4C local environment is ready.` and itself exited 0.
- Earliest causal failure: `$ErrorActionPreference = 'Stop'` does not convert non-zero native-process exit codes into terminating PowerShell errors.
- Classification: Test defect.
- Fix: route every required external setup command through `Invoke-RequiredCommand`, check `$LASTEXITCODE`, and throw immediately on failure.
- Validation: parse the PowerShell script, prove a failing required command produces a non-zero setup exit, then rerun the complete supported setup successfully.
- Recurrence prevention: all mandatory native commands in Windows setup must have explicit exit-code enforcement.

### Failure 3 — local environment template omits the SoD submitter

- Command: successful rerun of `scripts/local-setup.ps1`, at the Alomran UAT seed result.
- Exact error: `R4C UAT progress submitter skipped: SEED_UAT_SUBMIT_PASSWORD is not configured`.
- Earliest causal failure: `.env.example` did not define `SEED_UAT_SUBMIT_EMAIL`, `SEED_UAT_SUBMIT_DISPLAY_NAME`, or `SEED_UAT_SUBMIT_PASSWORD`, although the production template and governed Local UAT require the separate submitter identity.
- Classification: Documentation defect.
- Fix: add the non-secret local submitter identity and a distinct local placeholder password to `.env.example`; update the ignored local `.env` for this rehearsal.
- Validation: rerun `seed:uat` and confirm creation of `PROGRESS_SUBMITTER` with `progress:submit` and without `progress:review`.
- Recurrence prevention: keep local and production UAT identity variable sets aligned whenever governed journeys require those identities.

### Failure 4 — direct PowerShell seed rerun selected a blocked script shim

- Command: direct `pnpm --filter @r4c/api seed:uat` diagnostic rerun from the current PowerShell host.
- Exact error: `pnpm.ps1 cannot be loaded because running scripts is disabled on this system`.
- Earliest causal failure: PowerShell command precedence selected Corepack's `pnpm.ps1` shim while the host execution policy disallows script shims.
- Classification: Environment defect.
- Fix: use the adjacent `pnpm.cmd` shim for direct commands; do not weaken the machine execution policy.
- Validation: rerun the same seed through `pnpm.cmd`.
- Recurrence prevention: use `.cmd` Corepack shims in restricted PowerShell hosts or invoke repository scripts with their documented `-ExecutionPolicy Bypass` process scope.

### Failure 5 — Windows verifier does not load the configured local environment

- Command: `pnpm local:verify:windows`, failing at Prisma schema validation.
- Exact error: Prisma `P1012`, `Environment variable not found: DATABASE_URL` at `prisma/schema.prisma:7`.
- Earliest causal failure: `scripts/local-verify.ps1` runs in the documented second PowerShell session but did not load the root `.env` created by local setup.
- Classification: Test defect.
- Fix: require `.env` and load its non-comment assignments into the verifier process before Docker, Prisma, build, and endpoint checks.
- Validation: rerun the complete Windows verifier from its first stage.
- Recurrence prevention: standalone verification scripts must initialize their own required environment rather than depend on another shell process's transient variables.

### Failure 6 — documented runtime order locks Prisma generation on Windows

- Command: `pnpm local:verify:windows`, failing at Prisma client generation while `pnpm local:dev` was active as documented.
- Exact error: `EPERM: operation not permitted, rename ... query_engine-windows.dll.node.tmp... -> query_engine-windows.dll.node`.
- Earliest causal failure: the running API had loaded Prisma's Windows query-engine DLL before the verifier attempted to regenerate the client.
- Classification: Test defect.
- Fix: run all static verifier gates before runtime startup; if Web/API are not already ready afterward, start `pnpm local:dev` as a hidden background process, wait for readiness, print temporary log paths, and leave it active for manual UAT.
- Validation: stop the pre-existing runtime and rerun the complete verifier through Web, API, and MinIO readiness.
- Recurrence prevention: Windows verification must not regenerate native binaries after the application has loaded them.

### Failure 7 — verifier forces development mode into the production build

- Command: `pnpm local:verify:windows`, failing at `pnpm build` after lint, typecheck, and standalone tests passed.
- Exact error: Next.js warned about a non-standard `NODE_ENV`, then failed prerendering `/500` with `<Html> should not be imported outside of pages/_document`.
- Earliest causal failure: the verifier correctly loaded `.env` for Prisma and runtime configuration but also carried `NODE_ENV=development` into the production-build subprocess.
- Classification: Test defect.
- Fix: scope `NODE_ENV=production` around the production build only and restore the configured runtime value in a `finally` block before starting the development runtime.
- Validation: rerun the production build boundary, then rerun the complete Windows verifier.
- Recurrence prevention: verification scripts must separate build-mode environment from runtime-mode environment when one command exercises both.

### Failure 8 — Windows blocks Next standalone-build symlink creation

- Command: production-build boundary rerun with `NODE_ENV=production`.
- Exact error: Next completed compilation and static-page generation, then failed copying standalone traced files with `EPERM: operation not permitted, symlink ...`.
- Earliest causal failure: Windows Developer Mode is not enabled, so the non-elevated build process lacks unprivileged symbolic-link creation rights required by Next standalone output tracing.
- Classification: Environment defect.
- Fix: enable Windows Developer Mode (`AllowDevelopmentWithoutDevLicense=1`) with administrator approval; do not alter the repository's production output mode.
- Validation: rerun the production build as the normal user and confirm standalone trace copying succeeds.
- Recurrence prevention: list Windows Developer Mode as a local build/UAT prerequisite when standalone Next output is enabled.

### Failure 9 — successful project creation renders a false failure state

- Command/workflow: manual Local UAT, Alomran administrator project creation through `/projects`.
- Exact error: the UI displayed `Project created and added to the portfolio.` and `The record could not be loaded` simultaneously after the API returned HTTP 201.
- Earliest causal failure: `ProjectsJourney.createProject` dereferenced `event.currentTarget` after awaiting the API request; the async React event no longer guaranteed that `currentTarget` remained available, and the resulting reset error was caught as if the API operation had failed.
- Classification: Product defect.
- Fix: capture the form element before the async boundary and reset that stable reference after successful creation.
- Validation: reload the project portfolio, create another project, and verify success without the false error state; open project detail.
- Recurrence prevention: do not dereference React synthetic-event targets after an `await`; retain required DOM references before asynchronous work.

### Failure 10 — progress journey hard-codes the submitter display name

- Command/workflow: explicit local `test:progress-workspace` against the seeded Alomran runtime.
- Exact error: submitted and approved history assertions expected `Phase 6 Submitter` but received the correctly configured `Alomran UAT Progress Submitter` after successful authentication, submission, and approval.
- Earliest causal failure: the journey accepted configurable submitter email/password but asserted a fixed display name from its CI fixture.
- Classification: Test defect.
- Fix: add `JOURNEY_SUBMIT_DISPLAY_NAME` with the existing Phase 6 value as its default and assert the configured identity.
- Validation: rerun the complete progress workspace journey with the Alomran submitter email, password, and display name.
- Recurrence prevention: all identity attributes asserted by environment-portable E2E journeys must derive from the same configurable fixture contract.

### Verification result

- `scripts/local-setup.ps1`: PASS, including frozen install, migrations, bootstrap seed, Alomran administrator, and submit-only SoD identity.
- `pnpm local:verify:windows`: PASS from Docker/Prisma through lint, typecheck, standalone tests, production build, background runtime startup, and Web/API/MinIO readiness.
- `test:cost-dashboard`: PASS against local Alomran runtime, including bilingual direction and populated/partial 5D states.
- `test:progress-workspace`: PASS against local Alomran identities, including submit, HTTP 403 SoD enforcement, independent approval, EV `0.00` to `42500.00`, and conflict normalization.
- Manual non-BIM browser journeys: PASS for authentication, EN/LTR, AR/RTL, tenant identity, project create/list/detail, 5D, progress evidence, and logout.
- BIM Local UAT: BLOCKED because local Compose defines no BIM worker and the repository contains no approved IFC fixture; no result is inferred from CI.

### Failure 11 — Windows-generated KAAF digests differ from the canonical Git checkout

- Date/time: 2026-08-09 23:00 Asia/Riyadh.
- Environment: Windows 11 local checkout with Git `core.autocrlf=true`; GitHub Actions Ubuntu pull-request runner.
- Branch/SHA: `codex/fix-windows-uat-setup` at `618b6bb0091e61e9bb8ab5a7c9b4d07f6608110d`.
- Command/workflow: `KAAF Architecture / Verify generated AI context`, running `python3 ./scripts/architecture/generate.py --check`.
- Exact error: `KAAF-E006-generated-output-stale`; all 11 generated context artifacts were reported out of date.
- Earliest causal failure: the official generator was run against the CRLF-normalized Windows working tree, while GitHub Actions checked the LF bytes committed to Git; KAAF source digests are byte-sensitive, so local `--check` passed but the canonical clean checkout did not.
- Classification: CI defect.
- Fix: export the committed tree with `git archive`, run the official KAAF generator in that clean LF checkout, and copy only its generated `.ai` artifacts back to the branch.
- Validation: run `generate.py --check` and all KAAF validators in a second clean Git-archive checkout, then confirm the pull-request KAAF workflow is green.
- Recurrence prevention: generate and validate KAAF artifacts from canonical Git bytes on Windows until the upstream vendored tooling normalizes source line endings before hashing.

### Failure 12 — five required workflows publish one shared protection context

- Date/time: 2026-08-09 23:10 Asia/Riyadh.
- Environment: GitHub repository administration UI after PR #41 and post-merge `main` workflows passed.
- Branch/SHA: `main` at `0f69ccdfcc5f47646d97c384c21fe41e2b7e39d5`.
- Command/workflow: configure the documented required checks in the classic `main` branch protection rule.
- Exact error: GitHub exposed only one selectable `verify` context for Auth, Phase 5, Phase 6, Phase 6.5, and Phase 7, despite displaying them as five `Workflow / verify` checks on pull requests.
- Earliest causal failure: all five workflow files used the same implicit job display name, `verify`; branch protection operates on the underlying check-run name and therefore could not require the workflows independently.
- Classification: CI defect.
- Fix: give each workflow job a stable unique display name and update the governed required-check list to those exact contexts.
- Validation: confirm all five uniquely named checks pass on the correction pull request, then select each independently in `main` protection and verify the saved rule.
- Recurrence prevention: every independently required GitHub Actions workflow must publish a repository-unique job display name.

### Failure 13 — Local UAT cannot execute the BIM processing boundary

- Date/time: 2026-08-09 23:40 Asia/Riyadh.
- Environment: Windows 11 Local UAT with Docker Desktop and the host API/Web runtime.
- Branch/SHA: `main` at `91d935c51d5078b4c3e68a255b6cf5617b314e8f`.
- Command/workflow: governed manual BIM Local UAT journey.
- Exact error: local Compose started only PostgreSQL, Redis, and MinIO; no supported BIM worker was reachable at `BIM_WORKER_URL`, and the repository supplied no licensed IFC fixture with renderable geometry.
- Earliest causal failure: the local environment contract omitted both the BIM worker service and a container-reachable presigned MinIO endpoint, so the production IFC processing boundary could not execute locally.
- Classification: Environment defect.
- Fix: add the existing production worker image to local Compose, provide a local-only presign endpoint reachable from its container, and add a repository-authored synthetic IFC fixture with real extruded geometry.
- Validation: execute the fixture through upload, queue, worker extraction, GLB generation/upload, API persistence, manifest download, and the browser viewer; retain the deterministic journey as a Windows verifier gate.
- Recurrence prevention: local setup and verification must start and exercise every runtime required by governed Local UAT, including container-to-object-storage connectivity.

### Failure 14 — local API signs MinIO uploads with the wrong development secret

- Date/time: 2026-08-09 23:25 Asia/Riyadh.
- Environment: Windows 11 Local UAT, host API and Docker Compose MinIO.
- Branch/SHA: `codex/fix-bim-local-uat` from `91d935c51d5078b4c3e68a255b6cf5617b314e8f`.
- Command/workflow: `pnpm --filter @r4c/web test:bim-local-uat`.
- Exact error: the IFC PUT to the API-generated presigned MinIO URL returned HTTP 403.
- Earliest causal failure: local Compose configures `MINIO_ROOT_PASSWORD=change-me-now`, while `.env.example` configured `S3_SECRET_KEY=change-me`, so the host API generated an invalid signature.
- Classification: Environment defect.
- Fix: align the local API storage secret placeholder with the existing local Compose MinIO password; production secret configuration is unchanged.
- Validation: restart the host runtime and rerun the complete BIM Local UAT journey from upload through viewer.
- Recurrence prevention: the deterministic BIM journey now crosses the real presigned upload boundary and will fail on future local credential drift.

### Failure 15 — local MinIO starts without provisioning the configured bucket

- Date/time: 2026-08-09 23:30 Asia/Riyadh.
- Environment: Windows 11 Local UAT, Docker Compose MinIO.
- Branch/SHA: `codex/fix-bim-local-uat` from `91d935c51d5078b4c3e68a255b6cf5617b314e8f`.
- Command/workflow: second `test:bim-local-uat` run after credential correction.
- Exact error: the signed IFC upload reached MinIO and returned HTTP 404.
- Earliest causal failure: local setup started MinIO but never created the configured `S3_BUCKET`; only test and production stacks had explicit bucket provisioning.
- Classification: Environment defect.
- Fix: add an idempotent local `minio-init` Compose service and require it before starting the BIM worker.
- Validation: run `minio-init`, verify the private bucket exists, and rerun the complete BIM Local UAT journey.
- Recurrence prevention: local setup now provisions object storage declaratively before dependent runtimes start.

### Failure 16 — synthetic IFC wall arguments initially prevented geometry extraction

- Date/time: 2026-08-09 23:35 Asia/Riyadh.
- Environment: Windows 11 Local UAT, local BIM worker container.
- Branch/SHA: `codex/fix-bim-local-uat` from `91d935c51d5078b4c3e68a255b6cf5617b314e8f`.
- Command/workflow: direct extraction and GLB generation of `r4c-synthetic-box.ifc`.
- Exact error: semantic extraction found the wall, but GLB generation reported `no renderable geometry`.
- Earliest causal failure: the repository-authored fixture placed `ObjectPlacement` and `Representation` one position late in `IFCWALL`, leaving the wall without its intended shape representation.
- Classification: Test defect.
- Fix: correct the IFC4 `IFCWALL` positional attributes so the local placement and product definition shape are valid.
- Validation: the worker extracted one `IfcWall` and generated a 1,024-byte GLB whose header is `glTF`.
- Recurrence prevention: the BIM-worker test now requires both the expected semantics and one renderable geometry element from the fixture.

### Failure 17 — shell resolved an unsupported pnpm installation during verification

- Date/time: 2026-08-09 23:36 Asia/Riyadh.
- Environment: Windows 11 local PowerShell session.
- Branch/SHA: `codex/fix-bim-local-uat` from `91d935c51d5078b4c3e68a255b6cf5617b314e8f`.
- Command/workflow: local dependency and application verification.
- Exact error: the fresh shell resolved a different pnpm installation and dependency preparation aborted with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`.
- Earliest causal failure: the shell PATH did not prioritize the repository-approved Node runtime and Corepack-managed pnpm `10.13.1`.
- Classification: Environment defect.
- Fix: run verification with `C:\Users\Islam\AppData\Local\Programs\node-v24.19.0-win-x64` first on PATH and its pnpm `10.13.1` shim.
- Validation: API build and Web typecheck passed with Node `24.19.0` and pnpm `10.13.1`.
- Recurrence prevention: `local-setup.ps1` continues to activate the pinned package manager before repository commands.

### Failure 18 — stale local runtime processes occupied the Web and API ports

- Date/time: 2026-08-09 23:38 Asia/Riyadh.
- Environment: Windows 11 Local UAT host runtime.
- Branch/SHA: `codex/fix-bim-local-uat` from `91d935c51d5078b4c3e68a255b6cf5617b314e8f`.
- Command/workflow: `pnpm local:dev`.
- Exact error: the new Web and API processes exited with `EADDRINUSE` because earlier local UAT processes still listened on ports 3000 and 3001.
- Earliest causal failure: a prior runtime wrapper exited without terminating its child application processes.
- Classification: Environment defect.
- Fix: identify and stop only the two stale listener processes, then start one clean repository runtime.
- Validation: Web and API readiness passed and the authenticated BIM journey completed against the clean runtime.
- Recurrence prevention: retain runtime ownership and stop the process tree when a local verification session ends.

### BIM Local UAT closure result

- Exact tested base SHA: `91d935c51d5078b4c3e68a255b6cf5617b314e8f` plus the focused remediation on `codex/fix-bim-local-uat`.
- Deterministic journey: PASS — presigned IFC upload, confirmation, BullMQ dispatch, BIM-worker download/extraction, semantic persistence, GLB upload, manifest download, and authenticated browser rendering.
- Automated verifier model evidence: `7e5a4828-7ceb-4224-9415-122bacbb92ef`; IFC4; 4 spatial nodes; 1 `IfcWall`; GLB size 1,024 bytes.
- Fixture provenance: repository-authored synthetic IFC; no third-party model or data was used.
- Sensitive-free viewer screenshot: retained outside source control in the local UAT evidence directory.

### Failure 19 — active API process locked Prisma's Windows query engine

- Date/time: 2026-08-09 23:49 Asia/Riyadh.
- Environment: Windows 11 Local UAT host runtime.
- Branch/SHA: `codex/fix-bim-local-uat` from `91d935c51d5078b4c3e68a255b6cf5617b314e8f`.
- Command/workflow: `pnpm local:verify:windows`, Prisma client generation stage.
- Exact error: `EPERM: operation not permitted, rename ...query_engine-windows.dll.node.tmp... -> ...query_engine-windows.dll.node`.
- Earliest causal failure: the API used for the preceding browser journey was still running and held the generated Prisma query-engine DLL open while `prisma generate` attempted its atomic replacement.
- Classification: Environment defect.
- Fix: stop only the owned local Web/API runtime process tree before starting the clean verifier; leave Docker infrastructure running.
- Validation: rerun `pnpm local:verify:windows` from its beginning and require every stage, including its own runtime startup and BIM journey, to pass.
- Recurrence prevention: execute the verifier from a clean host-runtime state on Windows when Prisma client regeneration is required.

### Failure 20 — container test-tool scripts were outside PATH

- Date/time: 2026-08-09 23:53 Asia/Riyadh.
- Environment: disposable local BIM-worker test container.
- Branch/SHA: `codex/fix-bim-local-uat` from `91d935c51d5078b4c3e68a255b6cf5617b314e8f`.
- Command/workflow: BIM-worker Ruff and pytest verification using the production image plus declared development dependencies.
- Exact error: development tools installed under `/home/r4c/.local/bin`, then the shell returned `ruff: not found`.
- Earliest causal failure: the non-root image correctly used a user installation, but its user binary directory was not on the disposable shell PATH.
- Classification: Environment defect.
- Fix: invoke the installed tools as Python modules instead of depending on shell-script PATH discovery.
- Validation: run `python -m ruff check .` and `python -m pytest -q` in the same disposable image.
- Recurrence prevention: container-local verification commands must use module invocation for user-installed Python tools.

### Failure 21 — Windows bind mount presents every Python file as executable

- Date/time: 2026-08-09 23:54 Asia/Riyadh.
- Environment: Linux BIM-worker container with the Windows checkout bind-mounted into `/workspace`.
- Branch/SHA: `codex/fix-bim-local-uat` from `91d935c51d5078b4c3e68a255b6cf5617b314e8f`.
- Command/workflow: `python -m ruff check .` in the disposable container.
- Exact error: Ruff emitted `EXE002 The file is executable but no shebang is present` for all Python source and test files.
- Earliest causal failure: Docker Desktop's Windows bind mount exposed regular repository files with executable Unix mode bits; the canonical Git tree does not mark those files executable.
- Classification: Environment defect.
- Fix: ignore only `EXE002` for this bind-mount lint pass, while retaining all other Ruff rules; rely on canonical GitHub CI for the unmodified Linux mode-bit check.
- Validation: require the remaining Ruff rules and the complete worker pytest suite to pass locally, then require the pull-request CI BIM-worker job to pass without an ignore.
- Recurrence prevention: use a canonical Git archive or CI checkout when validating Unix executable bits from Windows.
