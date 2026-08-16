# Design QA — merged commercial dashboards

final result: passed

## Evidence

- Source targets: the three selected R4C dashboard concepts generated in this task, with the Project & Unit Control screen used as the detailed-state fidelity reference.
- Implementation captures: `.codex-audit/07-merged-unit-dashboard.png` and `.codex-audit/08-revised-floor-dashboard.png`, captured in the in-app browser.
- Verified states: Portfolio Dashboard, Project & Unit Control, Record Interest modal, Executive Closing & Transfer, and the preserved Sales Operations tab.

## Fidelity review

- Fonts and typography: the existing R4C system font stack, compact weights, numeric hierarchy, and table text remain legible at the tested desktop viewport. The Arabic shell intentionally mirrors navigation while the commercial data terminology remains English pending the product's existing dictionary expansion.
- Spacing and layout rhythm: KPI cards, filters, tables, drawer, and dashboard panels follow the selected dense enterprise rhythm. Narrow widths switch to stacked grids without hiding core actions.
- Colors and visual tokens: existing R4C navy, survey blue/teal, steel, line, success, warning, and danger tokens are reused consistently.
- Image quality and assets: no raster content is required in the merged operational views; charts and inventory blocks are data UI rather than illustrative assets.
- Copy and content: project, unit, construction, buyer-evidence, financial, and transfer-readiness labels match the selected concepts. Government handoff copy explicitly avoids claiming that R4C issues title deeds.

## Interaction checks

- All four dashboard tabs switch successfully.
- Executive Overview is the default landing tab and contains only portfolio-level transfer metrics.
- Project selection updates the project/unit KPI context.
- Unit selection updates the visible selected state.
- Building A/B and all 18 floors are independently selectable; the chosen building and floor update the layout context.
- Record Interest opens a complete evidence form and its success state.
- The detailed Title Transfer File is isolated in its own tab and no longer shares the executive landing dashboard.
- Dashboard/tab transitions, staggered KPI entrances, modal motion, card depth, project-image tilt, and floor-plan zoom were verified with a reduced-motion fallback.
- Project selection now drives the executive detail drawer, unit dashboard, and transfer queue.
- Building/floor selection regenerates matching unit identifiers, floor values, availability counts, prices, layout labels, and table rows.
- Unit-table and layout selections drive the same detail drawer; interest and reservation actions update both status surfaces.
- Transfer-queue selection drives the title file, buyer/value summary, checklist, readiness score, and controlled-action states through approved handoff.
- Executive Overview now includes a real-time WebGL/Three.js project model with pointer-driven camera depth and construction-progress lighting.
- Every visible apartment on the architectural floor plan has a dynamic unit-number hotspot linked bidirectionally to the inventory table and detail drawer.
- Development-preview navigation remains inside the preview and no longer redirects unauthenticated reviewers to `/login`.
- Frozen Development Intelligence is absent from navigation.

## Remaining P3 iteration notes

- Connect the new portfolio and transfer summary cards to production aggregation endpoints when those contracts are added.
- Add the new dashboard copy to the Arabic translation dictionary in the localization pass.
