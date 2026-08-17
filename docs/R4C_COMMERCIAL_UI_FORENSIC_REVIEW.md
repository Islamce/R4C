# R4C Commercial UI Forensic Review

## Baseline and scope

The review covers the existing commercial route, authenticated operator workspace, development preview, persistent application shell, commercial suite, API client boundaries, and the current presentation datasets. The approved baseline is branch `feat/commercial-command-center-hardening` at `d36cb20` before this continuation.

## Routes and components

| Surface | Route | Component | Role |
|---|---|---|---|
| Commercial workspace | `/commercial` | `CommercialWorkspaceSuite` inside the authenticated route | Commercial command center, inventory, transfer, and live operator entry |
| Development preview | `/design-preview` | `AppShell preview` + `CommercialWorkspaceSuite preview` | Non-production visual and workflow preview |
| Authenticated shell | Shared | `AppShell` | Tenant/session identity, locale, logout, navigation, direction |
| Live sales operations | Embedded in `/commercial` | `CommercialOperatorWorkspace` | Lead capture, pipeline, activities, units, holds, reservations, permissions |
| Inventory administration | Embedded below operator area | `CommercialInventory` | Authorized inventory hierarchy and status administration |
| Visual model | Embedded in executive and inventory surfaces | `CommercialHero3D` and floor-plan image | Project/unit context only; not a separate BIM product |

## Data provenance classification

| Dataset or surface | Classification | Evidence |
|---|---|---|
| `projects` array in `CommercialWorkspaceSuite` | SNAPSHOT | Static project, construction, inventory, lead, and value values in source |
| `units` and `unitsFor()` | SNAPSHOT | Static unit rows and derived price/status values in source |
| `transfers` array | SNAPSHOT | Static transfer readiness rows in source |
| Preview lead, activity, and reservation interactions | PREVIEW | Local React state mutations under `preview=true` |
| `CommercialOperatorWorkspace` leads, activities, units, prices, holds, reservations | GOVERNED LIVE | `commercialApi` calls, permission checks, tenant-scoped session, server workflow gates |
| Export report | SNAPSHOT + local export | CSV assembled from static project/unit/transfer records |
| Title-transfer submission language | GOVERNED / CONTROLLED | UI explicitly states that R4C prepares and governs the file and does not issue title deeds |

## Existing workflows and mutation paths

The live operator workflow starts with lead capture, then lead progression/disqualification/reassignment, activity logging, project and available-unit selection, unit pricing retrieval, hold creation/release, and reservation confirmation. Reservation confirmation is permission-gated and requires an active hold, published price, payment plan, and explicit review state. The title-transfer surface uses local dashboard state for its current presentation file and exposes document request, readiness approval, and governed handoff actions in the presentation layer. The inventory administration surface is separately permission-gated.

## Current UX inconsistencies

The shell still exposes only two broad navigation links while the commercial suite contains five distinct work modes. The suite context strip and decision queue are now present, but some concepts remain repeated across header, tabs, metrics, and drawers. Snapshot values are clearly labeled in the suite, but the large executive visual and dense static tables can still visually resemble live operational reporting. The unit drawer contains a long, mixed hierarchy of physical, commercial, delivery, history, and evidence information with limited progressive disclosure. The live operator workspace is functionally governed but still visually closer to a form-and-list admin surface than a first-class buyer commercial file.

## RTL and localization gaps

The main RTL direction, navigation, tabs, context bar, suite panels, and operator labels work through the existing locale provider and `dir` attributes. Remaining risk areas include mixed Arabic/English identifiers, numeric and currency formatting, directional arrow semantics, table overflow, and modal focus in Arabic mode. Canonical project, unit, and buyer identifiers should remain unchanged while labels and statuses translate.

## Accessibility gaps and strengths

Tabs expose `role=tab`, `aria-selected`, `aria-controls`, and roving tab index values. Native controls, visible focus rules, semantic buttons, `role=status` notices, and reduced-motion CSS are present. Remaining work includes Escape-to-close and focus return for the custom unit modal, keyboard validation of the full floor-plan hotspot set, better table header semantics, and non-color status icons or text treatment in every status context.

## Responsive findings

Desktop layouts are information-rich and now use a context bar, exception queue, sticky unit drawer, and responsive grid collapse. At tablet and mobile widths, the priority order must remain context, exception, primary record, next action, essential evidence, then analytics. Long operational tables need either compact list summaries or clear horizontal overflow affordances. The commercial suite has responsive CSS, but actual browser capture at 1440, 1280, 1024, 768, 430, and 375 widths remains a required QA gate.

## Visual-system findings

The redesign introduced a coherent navy/teal/sand/coral/mist system, but earlier rules remain in the same stylesheet and some components still contain arbitrary legacy colors. The attached specification correctly calls for token normalization and removal of exaggerated 3D rotation, perspective, tilt, and oversized editorial treatment. These are the highest-value visual cleanup targets for the next implementation increment.

## Reusable component opportunities

The most valuable boundaries are `CommercialShell`, `CommercialContextBar`, `DecisionQueue`, `ProvenanceBadge`, `PortfolioHealthTable`, `InventoryNavigator`, `FloorNavigator`, `UnitCommercialDrawer`, `BuyerCommercialFile`, `PipelineOverview`, `ReservationWorkspace`, `TransferReadinessQueue`, `TransferFile`, and `EvidenceTimeline`. These should be extracted incrementally only when a boundary reduces duplicated state or makes a workflow easier to test.

## Risk register

| Risk | Severity | Required treatment |
|---|---|---|
| Executive/inventory/transfer arrays remain static | Launch blocker for live reporting claims | Keep snapshot provenance visible; propose live aggregation endpoints separately |
| Buyer workspace is still not a dedicated first-class record | Important post-launch | Refactor the live operator detail into a buyer commercial file without changing APIs |
| Modal focus and keyboard close behavior | Important post-launch | Add focus trap, Escape close, and focus return |
| Tables are dense on mobile | Important post-launch | Add responsive summary representation or explicit overflow controls |
| Mixed legacy CSS tokens and motion | Important post-launch | Normalize commercial tokens and remove tilt/perspective gimmicks |
| Government handoff integration | Dependency | Preserve controlled language; require approved integration and contract before claiming submission |
