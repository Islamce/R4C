# Production interface routing audit — 2026-09-02

## Verdict

The user's observation is correct. The approved KYNOX commercial interface exists in
the deployed source, but the authenticated navigation still routes **Developments** and
**Portfolio** to the separate legacy `/projects` journey. In addition, production links
include `?view=...` destinations that `CommercialWorkspaceSuite` did not read, so the
destination could fall back to the Sales Pipeline tab.

This is an information-architecture and routing defect, not a missing build asset.

## Evidence

1. `01-production-commercial.png` — the production route is live but redirects an
   unauthenticated audit session to the current login page. No credential was submitted.
2. `02-approved-design-preview.png` — the repository's approved KYNOX commercial design
   at the same desktop viewport, including the governed shell, reporting navigation,
   portfolio, customers, units, transfer, operations, and performance views.

## Correction

- Route the primary **Developments** link to the approved commercial Portfolio view.
- Route the Portfolio tool to the same approved view instead of `/projects`.
- Read the production `view` query parameter in `CommercialWorkspaceSuite` and map
  Customers, Portfolio, Units, Transfer, and Operations to their correct tabs.
- Keep `/projects` and its project creation/publication workflow intact for direct
  administrative access; no functionality or report route is deleted.
- Make the active navigation state reflect whether the user is in the development
  (`portfolio`/`units`) or commercial-sales area.

## Verification

- TypeScript check: PASS.
- Commercial workflow contract: 10/10 PASS.
- Production web build: PASS.
- Post-deployment authenticated visual verification: pending protected-branch merge and
  Hostinger deployment.

## UX and accessibility notes

- Strength: the approved interface has consistent KYNOX branding, RTL layout, real icon
  assets, and clear commercial workflow groupings.
- UX risk corrected: two visually different destinations were presented as one product,
  making users believe the approved interface had been removed.
- UX risk corrected: deep links did not select the named destination tab.
- Accessibility limit: the protected production interface could not be inspected beyond
  the login screen without transmitting credentials; keyboard and screen-reader checks
  must be repeated after deployment in an authenticated session.
