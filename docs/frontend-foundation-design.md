# Phase 4 frontend foundation design

## Visual language

R4C should feel like a controlled project-delivery environment rather than a generic SaaS dashboard. The interface uses a light technical canvas, strong structural contrast, and restrained operational signals.

### Palette

- **Blueprint navy** — `#173042`: primary structure, navigation, headings.
- **Survey blue** — `#2C6E8F`: interactive controls, selected states, links.
- **Concrete mist** — `#EEF3F5`: application canvas and quiet surfaces.
- **Steel** — `#637786`: secondary text and metadata.
- **Permit green** — `#2F7D62`: approved/active/success states.
- **Signal amber** — `#C88A2B`: attention, draft, and controlled-risk states.

### Typography

- **Display:** IBM Plex Sans Arabic, Segoe UI, system sans-serif.
- **Body:** Noto Sans Arabic, Segoe UI, system sans-serif.
- **Data:** Noto Kufi Arabic, Cascadia Mono, Consolas, monospace fallback.

The body and data stacks deliberately include Arabic-capable faces before Latin-only fallbacks.

## Layout concept

The authenticated product uses a responsive two-zone plan grid: a compact navigation spine and a flexible controlled-work area. Cards align to a subtle coordinate grid. Mobile collapses the navigation into a horizontal control strip while preserving reading order in both LTR and RTL.

## Signature element

Each project and WBS node carries a **governance rail**: a vertical control line with status markers and compact evidence counts. It visually connects project identity, state, WBS structure, and audit-minded delivery without imitating a conventional kanban or generic KPI dashboard.

## Session boundary

All authenticated browser traffic, including requests made by rich components such as the BIM viewer, crosses the restricted Next.js server boundary. Browser components do not read or persist access or refresh tokens; server route handlers attach the bearer token, rotate the refresh token once after a 401, and persist the newest cookie pair.

## Interaction quality

- Visible `:focus-visible` outlines on every interactive element.
- Motion is limited to short opacity/position transitions and disabled under `prefers-reduced-motion`.
- Sentence case throughout.
- Touch targets remain at least 44px on mobile.
- Status is communicated with text and shape, never color alone.
