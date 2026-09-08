# Design QA — R4C responsive CRM enhancement

## Source visual truth

- Figma plot: `https://www.figma.com/design/rv5eY5OvwZz31wT72foaOv`
- Figma page: `Responsive CRM enhancement`
- The plot contains the corrected desktop and mobile captures plus implementation notes. The current codebase is the implementation source of truth for behavior.

## Implementation evidence

| State | CSS viewport | Browser screenshot | Captured pixels | Density |
|---|---:|---|---:|---:|
| Desktop | 1440×1000 | `docs/uat/2026-09-08-real-estate-crm-audit/06-web-desktop-1440-fixed.png` | 1425×860 | 1× browser capture |
| Tablet | 1024×900 | `docs/uat/2026-09-08-real-estate-crm-audit/09-tablet-1024-fixed.png` | current-run capture | 1× browser capture |
| Tablet | 768×900 | `docs/uat/2026-09-08-real-estate-crm-audit/08-tablet-768-fixed.png` | 753×852 | 1× browser capture |
| Mobile | 375×900 | `docs/uat/2026-09-08-real-estate-crm-audit/05-mobile-375-fixed.png` | 360×834 | 1× browser capture |

## State and interactions tested

- Arabic RTL pipeline route with hypothetical fixture records.
- Kanban view selected; search field, saved-view selector, display-mode controls, project scope, stage navigation, and add/log actions visible.
- At 375px and 768px, the responsive shell, bottom navigation, action buttons, tabs, metrics, and lead-card content were inspected.
- DOM snapshot confirms labelled navigation, comboboxes, textboxes, buttons, stage regions, and lead actions.
- No browser console error was surfaced during the capture pass.

## Findings

### P1 — earlier mobile overflow

- **Earlier evidence:** `02-mobile-375.png` showed a clipped desktop canvas with hidden controls and unusable horizontal composition.
- **Fix:** added responsive containment, mobile command-bar stacking, bottom navigation at ≤820px, single-stage horizontal cards at ≤720px, and card-style ledger rows.
- **Post-fix evidence:** `05-mobile-375-fixed.png` and `08-tablet-768-fixed.png` keep primary controls inside the viewport; the 768px shell now uses bottom navigation.

### P2 — weak next-action visibility

- **Earlier evidence:** stage cards only exposed unit/owner under the customer name.
- **Fix:** stage cards now expose the next action as a labelled secondary line.
- **Post-fix evidence:** DOM labels include actions such as “اتصال تأهيلي”, “زيارة الموقع”, and “متابعة التمويل”.

## Required fidelity surfaces

- **Fonts/typography:** preserved the existing Noto Sans Arabic / IBM Plex Sans Arabic CSS stack; Figma annotation text uses the available Noto Sans Arabic font. Dense utility labels remain intentionally compact, but 14px minimum body text should be enforced in the next accessibility pass.
- **Spacing/layout rhythm:** desktop hierarchy and compact dark shell are preserved; tablet/mobile now stack actions and prevent page-level overflow.
- **Colors/tokens:** preserved KYNOX night, cyan, survey-blue, permit-green, and amber semantic tokens; no new brand colors introduced.
- **Image quality/assets:** this route uses the existing icon library and screenshot captures; no decorative image asset was introduced or replaced with CSS art.
- **Copy/content:** Arabic RTL copy remains intact; next-action copy is now visible in stage cards.

## Comparison history

1. Initial audit found a critical 375px clipped-desktop failure and high width pressure at 768px/1024px.
2. Implemented CSS containment, ≤820px bottom navigation, ≤720px card/slider behavior, and next-action labels.
3. Re-captured all key states; P1 overflow is resolved in the audited path. Remaining P2 work is accessibility instrumentation and broader product workflow coverage, not a visual blocker in this pass.

## Final result

**passed**

The corrected responsive pipeline has no remaining actionable P0/P1/P2 visual mismatch against the plotted target. Native mobile capabilities, external MLS/lead integrations, production performance, and full accessibility still require separate functional/device test plans.

---

## Preserved prior landing-page QA record

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
