# Commercial UI Redesign

## Scope

The R4C commercial workspace was redesigned as a modern, bilingual command center without changing the underlying domain contracts, authorization boundaries, or data behavior. The redesign applies to the executive overview, project and unit control, title-transfer surfaces, preview/operator workspace, controls, modals, tables, state surfaces, and responsive behavior.

## Visual direction

The new visual language uses a restrained development-operations palette: deep blueprint navy for authority, teal for active commercial work, sand for attention and transfer states, and a cool mist background for separation. The interface now uses editorial hierarchy, larger page-level typography, rounded but restrained surfaces, translucent sticky navigation, stronger grouping, higher-contrast status treatments, and a consistent card/table rhythm.

## Interaction and accessibility

The redesign preserves the existing tab semantics, native form controls, keyboard focus treatment, RTL direction handling, reduced-motion preference, unit and transfer interactions, export behavior, and production-safe operator APIs. The operator empty state remains non-mutating and now explains how to proceed in both English and Arabic. Unit drawers and high-value summaries become sticky at desktop widths while collapsing into a single-column flow on smaller screens.

## Validation

The web type-check, commercial workflow contract test, production build, and `git diff --check` passed. The local preview route rendered the redesigned executive page successfully through HTML extraction. Visual screenshot capture through the connected browser timed out during this run, so final pixel-level review should be repeated after deployment in the authenticated browser, including Arabic RTL and mobile-width checks.

## Files changed

- `apps/web/app/commercial.css`
- `docs/commercial-ui-redesign.md`

The redesign is intentionally CSS-led so the existing commercial component architecture remains stable and the implementation can be reviewed or rolled back independently.
