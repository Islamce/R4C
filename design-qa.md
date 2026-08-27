# KYNOX authenticated shell design QA

- Source visual truth: `C:\Users\Islam\AppData\Local\Temp\codex-clipboard-c3f91e34-6597-4ae0-9928-2ecce8ac9963.png`
- Browser-rendered implementation: `C:\Users\Islam\Documents\GitHub\R4C\docs\uat\kynox-shell-design-qa.png`
- Source pixels: 932 × 343; cropped defect evidence supplied by the user
- Implementation pixels / CSS viewport: 1265 × 712 at device scale factor 1
- State: Arabic RTL, KYNOX dark shell, development design preview

## Full-view comparison evidence

The source shows the authenticated sidebar falling back to the old 270px layout and a row of default browser-styled buttons. The implementation uses the same compact 112px KYNOX navigation rail, cyan Phosphor icons, dark governed header, spacing, borders and typography across the full authenticated shell. No horizontal overflow or detached button row is visible at the verified viewport.

The source is a focused defect crop rather than a complete same-state page. It was therefore used to verify removal of the two reported defects—legacy shell styling and unstyled/non-navigating controls—not to assert pixel identity for unrelated page content.

## Focused region comparison evidence

The navigation region was inspected directly. In production mode its five commercial tools are Next.js links to real routes/anchors. In preview mode the five controls intentionally remain buttons and the `الوحدات` interaction was exercised: the selected tab changed to `إدارة المشروع والوحدات` and the unit inventory panel became visible. The browser console contained no errors.

## Required fidelity surfaces

- Fonts and typography: existing bundled Noto Kufi Arabic/KYNOX weights remain in use; labels no longer inherit native browser-button typography.
- Spacing and layout rhythm: compact 112px rail, consistent 58–70px navigation targets and responsive horizontal mobile rail match the main KYNOX shell.
- Colors and tokens: governed navy, cyan icon and slate-border palette are consistent across internal routes.
- Image and icon quality: existing Phosphor icon assets are preserved; no placeholder, emoji, CSS-drawn or inline-SVG substitute was introduced.
- Copy and content: Arabic labels are complete; “Transfer” is clarified as `الحجز والإفراغ` / `Booking & transfer`.

## Findings

No actionable P0, P1 or P2 differences remain for the two reported defects.

## Comparison history

1. Earlier evidence: legacy wide sidebar plus an unstyled row whose events had no listener on internal routes.
2. Fix: shared KYNOX shell stylesheet, responsive behavior, real route/anchor links in production and preserved event controls in preview.
3. Post-fix evidence: compact unified rail rendered without console errors; preview unit control changed the visible workspace successfully; static contract verifies all five production destinations.

## Follow-up polish

No blocking polish item. A later product pass may add route-specific active highlighting for individual commercial anchor links.

final result: passed
