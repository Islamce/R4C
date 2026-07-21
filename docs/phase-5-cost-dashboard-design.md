# Phase 5 — 5D cost-control dashboard design

## Design continuity

The dashboard extends the Phase 4 governed-delivery system without introducing a second visual language. It reuses Blueprint navy `#173042`, Survey blue `#2C6E8F`, Concrete mist `#EEF3F5`, Steel `#637786`, Permit green `#2F7D62`, Signal amber `#C88A2B`, the established Arabic-capable font stacks, grid canvas, focus treatment, and reduced-motion behavior.

## Layout concept

The screen is a precise control-tower sequence:

1. project and as-of controls;
2. a joined CPI/SPI **control axis** anchored at the `1.00` benchmark;
3. a compact earned-value summary band;
4. an evidence-oriented WBS variance table.

The control axis is the signature element. CPI and SPI receive equal visual weight, each with a benchmark rail, position marker, icon, and explicit text status. Meaning never relies on color alone.

## Data presentation

- Money remains a decimal string throughout the browser. Formatting groups the integer portion with `BigInt` and preserves the source fractional digits; no floating-point arithmetic is performed on money.
- CPI/SPI use locale-aware ratio formatting and first-class null states.
- CV/SV and forecast-vs-budget checks use exact decimal-string comparison.
- The WBS table supports keyboard-operable sorting. Adverse rows carry a text marker and structural left/start rail in addition to color.
- At mobile widths, each table row becomes a labelled card while preserving reading order in LTR and RTL.

## State model

- No projects: invite the user to create a project.
- No published budget: explain that a published budget is required.
- Published budget but missing actual cost or planned value: show the available money values while explaining why CPI, SPI, EAC, ETC, or VAC cannot yet be calculated.
- API failure: reuse the shared corrective error primitive.

## Accessibility and motion

- Visible `:focus-visible` treatment on selectors, sorting controls, links, and actions.
- `aria-sort` on table headers and explicit status text for performance signals.
- Logical CSS properties preserve RTL geometry.
- Numbers and ISO currency codes use `bdi`/LTR isolation where required.
- Motion is decorative only and disabled under `prefers-reduced-motion`.
