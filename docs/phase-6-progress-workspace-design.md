# Phase 6 — Progress reporting and approval design

## Scope

Phase 6 adds one authenticated workspace for WBS progress submission, independent review, and governed history. It does not add budget authoring, schedule management, documents, BIM linking, quality, or HSE screens.

## Design continuity

The screen extends the Phase 4/5 design language: Blueprint navy, Survey blue, Concrete mist, Permit green, Signal amber, the existing Arabic-capable type stacks, grid canvas, focus treatment, and reduced-motion rules. No dependency or second component system is introduced.

## Signature element

The signature element is the **decision timeline**. Every progress event has:

- an explicit icon and localized status label;
- the reported percentage;
- reporter and reviewer identity;
- report and decision timestamps;
- reporter note and review comment;
- inline review controls only while the record is `SUBMITTED` and the session includes `progress:review`.

The timeline uses color as a secondary cue only. Marker shape, icon, text, and structural rails carry the primary meaning.

## Separation of duties

The session `permissions[]` is the source of truth:

- `progress:submit` controls the submission form;
- `progress:review` controls approve/reject actions;
- `progress:read` controls history retrieval.

The screen never infers permissions from role names. Submission and review remain independent capabilities.

## Data behavior

- Browser requests use the existing Next.js server proxy and httpOnly session cookies.
- History is reloaded after submission and review so reporter/reviewer relations always come from the API.
- Percent submission mirrors backend validation: numeric, 0–100.
- Optional notes/comments mirror backend validation: blank is accepted; non-empty text must be 3–2,000 characters.
- A 409 from an already-decided or concurrently changed update becomes a localized corrective message and triggers a history refresh.

## Closing the 5D loop

Approved events show a localized link to `/cost-control` for the selected project. The Phase 6 verification fixture also proves the domain loop directly: a submitted 42.5% update does not change earned value, while approving it changes EV from `0.00` to `42500.00` against a SAR 100,000 published budget.

## Responsive and RTL behavior

- Controls collapse to one column on narrow screens.
- The command column moves above the timeline.
- Event facts become stacked cards.
- Logical CSS properties preserve timeline and status geometry in RTL.
- Percentages and timestamps remain isolated and legible in Arabic and English.
