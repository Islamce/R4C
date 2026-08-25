# R4C Post-Merge Governance and Local UAT Gate

## 1. Required `main` branch protection

Configure these settings in GitHub repository settings for the `main` branch:

- Require a pull request before merging.
- Require approvals before merging.
- Dismiss stale approvals when new commits are pushed.
- Require conversation resolution before merging.
- Require status checks to pass before merging.
- Require branches to be up to date before merging.
- Do not allow bypassing the above settings.
- Block force pushes and branch deletion.
- Allow squash merge; disable merge commits and rebase merge unless explicitly approved by governance.

Required status checks for the launch baseline:

1. `CI / validate`
2. `Security / supply-chain`
3. `Seed verification / verify-seed`
4. `Auth session verification / auth-session`
5. `Phase 5 cost dashboard verification / cost-dashboard`
6. `Phase 6 progress workspace verification / progress-workspace`
7. `Phase 6.5 UX loop closers verification / ux-loop-closers`
8. `Phase 7 isolated deployment rehearsal / isolated-deployment-rehearsal`
9. `KAAF Architecture / Validate repository structure`
10. `KAAF Architecture / Verify generated AI context`
11. `KAAF Architecture / Report declared-versus-discovered drift`
12. `KAAF Architecture / Check contract compatibility`

These names come from the workflow and job definitions under `.github/workflows/`. Confirm the names against successful check runs on the release-candidate pull request before applying branch protection; GitHub only allows checks that have run recently to be selected.

## 2. Windows local acceptance procedure

### Preparation

1. Install Git, Docker Desktop, and Node.js 22 or later.
2. Enable Windows Developer Mode so the Next.js standalone production build can create symbolic links without running as administrator.
3. Ensure ports 3000, 4000, 5432, 6379, 8000, 9000, and 9001 are available.
4. Clone the repository and open PowerShell in the repository root.

### Setup and start

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-setup.ps1
```

Then run:

```powershell
pnpm local:verify:windows
```

The verifier completes dependency, Prisma, lint, typecheck, test, and build gates before starting the Web/API runtime in the background for readiness checks. It leaves that runtime active for the governed manual journeys. Runtime logs are written to the user temporary directory and their exact paths are printed by the verifier.

The automated verification must pass:

- Docker/PostgreSQL/Redis readiness.
- BIM worker readiness.
- frozen dependency installation.
- Prisma schema validation and client generation.
- lint and typecheck.
- standalone deterministic tests.
- production build.
- Web login endpoint.
- API readiness endpoint.
- MinIO readiness endpoint.
- Repository-owned synthetic IFC processing through semantic extraction and stored GLB validation.

`pnpm test` deliberately excludes the Web environment-dependent E2E journeys. Those journeys have explicit scripts and require the seeded runtime and credentials prepared for the relevant verification phase. This prevents helper scripts and UAT journeys from being auto-discovered as standalone tests.

## 3. Governed acceptance journeys

Record Pass, Fail, or Blocked for every item. Automated phase workflows may be cited as evidence where they exercise the same journey against the intended release commit; owner device/browser acceptance remains required for Local UAT.

| Journey | Expected result | Result | Evidence |
|---|---|---|---|
| Web login | Seed administrator can authenticate | PASS | Local browser login as Alomran UAT administrator; protected projects route loaded |
| Arabic toggle | Page switches to Arabic and RTL | PASS | Browser DOM confirmed `lang=ar`, `dir=rtl`; non-secret screenshot captured outside source control |
| English toggle | Page returns to English and LTR | PASS | Browser DOM confirmed `lang=en`, `dir=ltr` |
| Alomran tenant | Local runtime resolves correct tenant | PASS | Login and authenticated header resolved `Alomran Development` / `ALOMRAN` |
| Projects | Project list and project details load | PASS | Created `LOCAL-UAT-001` and regression project; portfolio and detail loaded |
| 5D dashboard | BAC, PV, EV, AC, CPI, SPI and forecast values display | PASS | Phase 5 journey passed; browser showed populated P5 dashboard and forecast values |
| Progress submission | Authorized submitter creates a progress update | PASS | Phase 6 journey passed and browser showed Alomran submitter duties/history |
| Separation of duties | Submitter cannot approve own update | PASS | Submitter received HTTP 403; UI showed review not assigned |
| Progress approval | Independent reviewer approves update | PASS | Phase 6 journey and browser history showed independent administrator approval |
| Earned value refresh | Approved progress updates cost-control results | PASS | Phase 6 verified EV changed from `0.00` to `42500.00`; browser showed SAR 42,500 EV |
| IFC upload | Valid IFC upload is accepted | PASS | Repository-owned synthetic IFC uploaded through the API-issued MinIO URL; document confirmation and BIM processing request succeeded |
| BIM processing | Worker produces semantic data and GLB artifact | PASS | Automated verifier model `7e5a4828-7ceb-4224-9415-122bacbb92ef`: IFC4, 4 spatial nodes, 1 semantic wall, 1,024-byte GLB; authenticated browser viewer also rendered the same fixture geometry |
| Invalid BIM input | Invalid or oversized input is rejected safely | BLOCKED | No repository-supported local BIM upload fixture/procedure is available |
| Logout | Session and refresh state are cleared | PASS | Logout redirected protected session to `/login`; Phase 6.5/session contracts cover cookie clearing |

## 4. Evidence package

Store the following outside source control or in an approved private evidence location:

- Output of `pnpm local:verify:windows`.
- `docker compose ps` output.
- Web and API runtime logs for failed journeys only.
- Screenshots for login, tenant resolution, 5D dashboard, progress approval, and BIM viewer.
- Exact tested commit SHA.
- Windows version, Docker Desktop version, Node.js version, and pnpm version.

Never commit `.env`, passwords, tokens, database dumps, private IFC files, or screenshots containing secrets.

## 5. Acceptance decision

Local UAT is accepted only when:

- Automated verification passes.
- Every critical governed journey is Pass.
- No unresolved Severity 1 or Severity 2 defect remains.
- Any accepted lower-severity limitation is recorded with owner and target date.
- The tested commit SHA matches the intended release candidate.
