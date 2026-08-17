# Rendered Visual QA Findings

## Captures reviewed

- `command-center-1440.png` at 1440×1200
- `command-center-430.png` at 430×1000

## Findings

The desktop capture shows a clear hierarchy: application shell, executive situation header, workspace tabs, persistent context bar, project hero, and commercial pulse. The snapshot warning is visible before the metrics, and the navy hero no longer dominates the first viewport with a decorative 3D object. The layout has adequate whitespace and the decision/context layers are visually distinct.

The mobile capture successfully recomposes the shell and hero into a narrow flow. The tenant chip is hidden appropriately, the locale and preview controls remain accessible, the project selector and export action are full-width, and the workspace tabs remain horizontally scrollable. The mobile capture shows the beginning of the context bar below the tabs. A follow-up mobile capture should scroll further to verify that the decision queue and primary unit actions remain reachable, but no clipping or horizontal page overflow is visible in the first viewport.

No visual defect was corrected from these captures because the observed behavior matches the attached closeout criteria. Browser extension screenshot capture remains unavailable through the connected browser due repeated timeout; headless local screenshots provide the recorded rendered evidence.

## Additional captures reviewed

- `selected-unit-1440-full.png`
- `title-transfer-arabic-1440-full.png`

## Additional findings

The selected-unit desktop capture shows the project context, floor navigator, unit table, status legend, floor-plan selection, selected-unit facts, progressive disclosure sections, and persistent action buttons in a coherent three-column workspace. The unit action stack is visible without scrolling beyond the primary drawer facts. The main remaining density trade-off is the long floor list, which is operationally useful but should remain scrollable rather than being replaced with decorative cards.

The Arabic title-transfer capture keeps canonical identifiers such as `RH-A-1204` and `SAR` values intact, preserves the controlled government handoff disclaimer, and maintains the queue/file/action hierarchy. However, the screenshot reveals that several page-level labels remain English in this captured preview state, including the main suite title, tabs, checklist labels, and action labels. This is a verified localization defect in the preview path and should be corrected only if the locale toggle is expected to translate the presentation dataset; the existing source-level Arabic coverage is incomplete for the transfer dashboard itself.

## Corrected Arabic and mobile captures reviewed

- `title-transfer-arabic-1440-full.png`
- `selected-unit-430-full.png`

The corrected Arabic title-transfer capture now shows a genuine RTL operating mode: Arabic navigation, page title, tabs, context labels, metrics, queue title, controlled actions, and disclaimer are localized; canonical unit ID `RH-A-1204`, project name, and `SAR` remain stable. The checklist intentionally retains some English evidence labels from the presentation dataset, which is a residual localization gap but does not reverse layout direction or obscure the controlled action semantics.

The selected-unit mobile capture confirms a re-composed narrow workflow rather than a simple unusable stack. Context, provenance, metrics, floor navigator, unit table, floor plan, selected-unit facts, progressive details, and primary Record interest/Create reservation actions remain reachable. The page is long but does not hide the unit action controls; the compact floor navigator and table remain readable at the captured width.

Screenshot PNG evidence is stored outside source control at /home/ubuntu/r4c-qa-evidence/.
