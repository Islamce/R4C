# Production publication and customer-portal UAT — 2026-09-01

Environment: `https://r4c.kynox.io`  
Tenant: `R4C`  
Published test project: `UAT-LIVE-20260825`  
Published test unit: `UAT-B1-F01-01`

## Result

The governed project-publication workflow passed in production. The project moved from
`DRAFT` to `ACTIVE`, became visible in the public Arabic portfolio, and exposed its one
available unit in the interest form.

The customer journey was tested through the point immediately before personal-data and
SMS transmission. SMS delivery remains intentionally deferred; no customer record or
message was created during this run.

## Executed checks

| Check | Result | Evidence |
| --- | --- | --- |
| API liveness and readiness | PASS | `/api/v1/health` and `/api/v1/health/ready` returned HTTP 200 |
| Admin authentication and tenant scope | PASS | Production login returned HTTP 201; project and unit were read in tenant `R4C` |
| Governed project publication | PASS | Project status changed from `DRAFT` to `ACTIVE` |
| Public portfolio visibility | PASS | Project card showed one available unit |
| Interest drawer opening | PASS | Arabic form opened from the project CTA |
| Unit selection | PASS | `UAT-B1-F01-01` was selectable with type and area |
| Required-form gating | PASS | SMS and submit controls remained disabled until prerequisites were supplied |
| Desktop visual review | PASS with hardening | Layout and RTL labels were coherent |
| Mobile visual review | PASS with hardening | Core content and form fit at 390 × 844 |
| SMS verification and final submission | DEFERRED | SMS-provider integration was explicitly deferred |
| Production object/media upload | NO-GO | Object storage is not configured for production |

## UAT hardening found and corrected

The mobile interest drawer exposed both the page scrollbar and the drawer scrollbar.
The correction locks background scrolling while the dialog is open, restores it on
close, adds Escape-key dismissal, moves initial focus to Close, and supplies explicit
dialog semantics (`role=dialog`, `aria-modal`, and an accessible title).

## Evidence

- `01-portal-desktop.png` — desktop public entry state.
- `02-interest-form-desktop.png` — desktop interest form.
- `03-portal-mobile.png` — mobile public entry state.
- `04-interest-form-mobile.png` — mobile interest form before the scroll-lock hardening.

## Automated verification

- Web TypeScript check: PASS.
- Commercial workflow contract tests: 10/10 PASS.
- Web production build: PASS.

## Release gate

The publication and public browsing slice is releasable after normal protected-branch
review. End-to-end lead creation remains gated on the selected SMS provider. Project
gallery and document uploads remain gated on production object storage.
