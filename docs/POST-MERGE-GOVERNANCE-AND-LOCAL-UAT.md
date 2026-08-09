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
3. `Seed verification / verify`
4. `Auth session verification / verify`
5. `KAAF Architecture / architecture`

Phase-specific verification workflows remain mandatory when their changed paths or release scope make them applicable, including Phase 5 cost dashboard, Phase 6 progress workspace, Phase 6.5 UX loop closers, and Phase 7 production deployment verification.

## 2. Windows local acceptance procedure

### Preparation

1. Install Git, Docker Desktop, and Node.js 22 or later.
2. Ensure ports 3000, 4000, 5432, 6379, 8000, 9000, and 9001 are available.
3. Clone the repository and open PowerShell in the repository root.

### Setup and start

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-setup.ps1
pnpm local:dev
```

Keep the application process running. In a second PowerShell window, run:

```powershell
pnpm local:verify:windows
```

The automated verification must pass:

- Docker/PostgreSQL/Redis readiness.
- frozen dependency installation.
- Prisma schema validation and client generation.
- lint and typecheck.
- standalone deterministic tests.
- production build.
- Web login endpoint.
- API readiness endpoint.
- MinIO readiness endpoint.

`pnpm test` deliberately excludes the Web environment-dependent E2E journeys. Those journeys have explicit scripts and require the seeded runtime and credentials prepared for the relevant verification phase. This prevents helper scripts and UAT journeys from being auto-discovered as standalone tests.

## 3. Governed acceptance journeys

Record Pass, Fail, or Blocked for every item. Automated phase workflows may be cited as evidence where they exercise the same journey against the intended release commit; owner device/browser acceptance remains required for Local UAT.

| Journey | Expected result | Result | Evidence |
|---|---|---|---|
| Web login | Seed administrator can authenticate |  |  |
| Arabic toggle | Page switches to Arabic and RTL |  |  |
| English toggle | Page returns to English and LTR |  |  |
| Alomran tenant | `alomran.r4c.local:3000` resolves correct tenant |  |  |
| Projects | Project list and project details load |  |  |
| 5D dashboard | BAC, PV, EV, AC, CPI, SPI and forecast values display |  |  |
| Progress submission | Authorized submitter creates a progress update |  |  |
| Separation of duties | Submitter cannot approve own update |  |  |
| Progress approval | Independent reviewer approves update |  |  |
| Earned value refresh | Approved progress updates cost-control results |  |  |
| IFC upload | Valid IFC upload is accepted |  |  |
| BIM processing | Worker produces semantic data and GLB artifact |  |  |
| Invalid BIM input | Invalid or oversized input is rejected safely |  |  |
| Logout | Session and refresh state are cleared |  |  |

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
