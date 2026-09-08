# Authenticated workspace design correction — 2026-09-08 (rejected)

> **Acceptance outcome:** Rejected by the operator after production deployment. The
> wider light-shell direction was not the previously agreed KYNOX internal design.
> It is retained here only as an audit trail and is superseded by
> `docs/uat/2026-09-08-approved-internal/RESTORATION-REPORT.md`.

## Scope

Live, authenticated review of the Arabic R4C workspace at `r4c.kynox.io`, followed by a same-viewport comparison against the development-only design preview.

## Findings

- The 104–112 px desktop navigation rail forced Arabic labels into narrow, multi-line stacks and reduced scanability across every authenticated route.
- The commercial workspace applied its dark treatment to the entire content canvas, while administration screens used the light foundation. The abrupt route-level theme change made one product feel like two unrelated interfaces.
- The independent sidebar and document scrollbars competed visually at desktop width.
- Authentication and administration remained functional. The audit found both retained administrator accounts and did not alter users or application data.

## Rejected correction

- Expanded the desktop rail to 248 px and changed desktop navigation items to icon-plus-label rows.
- Changed the commercial workspace toward a light canvas.
- These changes passed technical checks but failed visual acceptance because they
  departed from the approved compact dark KYNOX workspace.

## Evidence

- `internal-design-before.png`: production before correction.
- `internal-design-after.png`: development preview after correction, captured at the same desktop viewport.
- `admin-users-before.png`: production administration route confirming the inconsistent route-level treatment and the two retained administrators.

## Verification

- `pnpm --filter @r4c/web typecheck`
- `pnpm --filter @r4c/web test:commercial-workflow` — 12/12 passed
- `pnpm --filter @r4c/web build`
- Browser inspection of the corrected `/design-preview` route at the audit viewport

