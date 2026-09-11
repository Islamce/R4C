# Canonical opportunity workspace QA

## Comparison target

- Source visual truth: `docs/design-source/near-accepted-2026-09-08/01-opportunity-detail.jpg`
- Source visual truth: `docs/design-source/near-accepted-2026-09-08/02-opportunities-worklist.jpg`
- Implementation: `CanonicalOpportunityWorkspace` in the local `/design-preview` route.
- Visual review: Arabic RTL state in the in-app browser at the current desktop viewport.

## Result

- Worklist matches the supplied direction: dark navy shell, cyan emphasis, sparse KPI strip, search, dense opportunity table, stage badges, due dates, owners, and add-opportunity action.
- Selecting a row opens a focused opportunity record with highlights, six-step guided stage path, Activity/Details/Notes tabs, timeline, next-action panel, and stage progression CTA.
- The generic commercial header and dashboard tab strip are suppressed on the opportunity surface so the screen does not carry the rejected crowded chrome.
- Mobile containment is handled with stacked panels, two-column highlights, horizontal table scrolling, and an overflow-safe stage path.

## Interaction evidence

- Search filters the opportunity table by customer, project, unit, owner, or next action.
- Each opportunity row opens the record view; the back control returns to the worklist.
- Activity, Details, and Notes tabs switch the record content.
- Add opportunity, add activity, note submission, and next-stage actions provide visible feedback.
- Production mode loads leads through `commercialApi.leads(...)`, loads the selected workspace through `commercialApi.leadWorkspace(...)`, and advances through `commercialApi.advanceLead(...)`; preview mode uses fictional fixture data only.
- Browser DOM inspection confirmed Arabic labels, RTL direction, table semantics, named controls, and no missing core controls.

## Accessibility and limits

- Interactive controls have names, focus styles, and status feedback.
- Color is paired with text labels for stages and status; no state relies on color alone.
- A full keyboard traversal, screen-reader pass, and device-level performance audit still require a dedicated run outside the visual comparison.

final result: passed

---

**Comparison target**

- Source visual truth: `docs/uat/2026-09-07/landing-page/selected-design.png`
- Implementation captures:
  - `docs/uat/2026-09-07/landing-page/implementation-desktop-hero.png`
  - `docs/uat/2026-09-07/landing-page/implementation-desktop-demo.png`
  - `docs/uat/2026-09-07/landing-page/implementation-desktop-journey.png`
  - `docs/uat/2026-09-07/landing-page/implementation-mobile-hero.png`
- Source pixels: `916 x 1717` (long-page concept rendering).
- Desktop implementation pixels: `1425 x 860`; browser CSS viewport reported
  `1280 x 720` at device pixel ratio `1.25`.
- Mobile implementation pixels: `375 x 811`; requested browser viewport
  `390 x 844`; page scroll width `375` with no horizontal overflow.
- State: Arabic, sales-pipeline demo selected for the desktop demo capture.
- Density normalization: comparison used responsive section composition rather
  than pixel-for-pixel scaling because the concept is a compressed long-page
  overview and the implementation evidence is captured at browser viewport
  size. Hero, demo, workflow, and mobile regions were compared independently.

**Findings**

- No actionable P0, P1, or P2 findings remain.
- Fonts and typography: the implementation uses the product's existing Noto
  Kufi Arabic font assets and reproduces the source hierarchy with a large RTL
  hero, compact eyebrow copy, readable body text, and consistent control labels.
- Spacing and layout rhythm: the desktop hero, screenshot showcase, connected
  workflow, audience strip, and final CTA follow the source order and
  proportions. Mobile collapses to one column without horizontal overflow.
- Colors and visual tokens: the implementation uses the established R4C navy,
  survey blue, cyan, concrete mist, green, line, and paper tokens. Contrast is
  consistent with the existing application foundation.
- Image quality and asset fidelity: all visible product imagery is sourced from
  real R4C UAT captures. The images are not redrawn or replaced. Cropping hides
  the signed-in user's personal header details while preserving the operational
  content shown in the selected visual direction.
- Copy and content: Arabic and English describe only implemented R4C workflows.
  No invented metrics, testimonials, pricing, customers, or tenant/database
  concepts are presented.

**Interaction evidence**

- Screenshot tabs changed `aria-selected` and the displayed image source.
- Arabic/English switching updated the page through the existing locale route.
- All three visible sign-in actions resolve to `/login`.
- Header and in-page anchors resolve to the intended sections.
- Browser console error check returned zero errors.

**Comparison history**

1. Initial desktop capture exposed the signed-in user's name/email inside the
   source product screenshots and the hero title wrapped more aggressively than
   the selected mock. Result: blocked (P1 privacy/presentation and P2 hierarchy).
2. Adjusted desktop grid proportions and product-image framing. The final hero
   capture removes personal header details, keeps the product evidence legible,
   and brings the headline scale/wrapping in line with the target. Result:
   passed.

**Open Questions**

- None blocking. The production database currently contains no public projects;
  the landing page therefore labels these assets as product/demo captures rather
  than presenting them as live portfolio data.

**Implementation Checklist**

- [x] Public `/` landing page replaces the former automatic login redirect.
- [x] Sign-in actions route to `/login`.
- [x] Real product captures support three functional demo tabs.
- [x] Arabic and English content switch through the existing locale mechanism.
- [x] Desktop and mobile browser checks completed.
- [x] Production build, typecheck, contract tests, and KAAF validators completed.

**Follow-up Polish**

- P3: consider replacing the static screenshots with a narrated, privacy-safe
  product tour after suitable demo data exists in production.

final result: passed
