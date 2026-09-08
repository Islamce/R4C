# Authenticated workspace design correction — 2026-09-08

## Scope

Live, authenticated review of the Arabic R4C workspace at `r4c.kynox.io`, followed by a same-viewport comparison against the development-only design preview.

## Findings

- The 104–112 px desktop navigation rail forced Arabic labels into narrow, multi-line stacks and reduced scanability across every authenticated route.
- The commercial workspace applied its dark treatment to the entire content canvas, while administration screens used the light foundation. The abrupt route-level theme change made one product feel like two unrelated interfaces.
- The independent sidebar and document scrollbars competed visually at desktop width.
- Authentication and administration remained functional. The audit found both retained administrator accounts and did not alter users or application data.

## Correction

- Expanded the desktop rail to 248 px, restored the KYNOX lockup and navigation-group label, and changed desktop navigation items to icon-plus-label rows.
- Preserved a compact 104 px rail for tablet widths and the existing bottom navigation pattern below 720 px.
- Restored the shared light workspace canvas and white content surfaces for commercial routes while retaining the dark KYNOX header, sidebar, command bar, and selected states.
- Updated the commercial-workflow contract test to lock the corrected desktop navigation behavior.

## Evidence

- `internal-design-before.png`: production before correction.
- `internal-design-after.png`: development preview after correction, captured at the same desktop viewport.
- `admin-users-before.png`: production administration route confirming the inconsistent route-level treatment and the two retained administrators.

## Verification

- `pnpm --filter @r4c/web typecheck`
- `pnpm --filter @r4c/web test:commercial-workflow` — 12/12 passed
- `pnpm --filter @r4c/web build`
- Browser inspection of the corrected `/design-preview` route at the audit viewport

