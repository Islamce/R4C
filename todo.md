# R4C Frontend Execution TODO

- [x] Verify repository, branch, HEAD, Git status, frontend framework, component system, routes, API client, authentication, localization, responsive behavior, and tests.
- [x] Verify frozen `/crm` contracts and existing Lead, Customer, Project, hierarchy, Unit, availability, reservation, pricing, payment-plan, document, and approval contracts.
- [x] Research current Salesforce Sales Cloud, Microsoft Dynamics 365 Sales, relevant real-estate CRM patterns, and official Saudi sources using current evidence only.
- [x] Create `R4C-FRONTEND-CONTRACT-MATRIX.md` with supported, composition, blocked, unsupported, and out-of-scope UI actions.
- [x] Create `R4C-FINAL-UI-SCOPE.md` with required, usability, Saudi compatibility, accessibility/responsive, deferred, and out-of-scope classifications.
- [x] Document final R4C information architecture and scope-control decisions.
- [x] Implement or refine the command center and deterministic My Work action queue using supported data only.
- [x] Implement or refine Lead, Customer/Contact, Opportunity, Activity/Task, project/unit, quotation/revision, customer-decision, reservation, and governance UX against actual contracts.
- [x] Preserve the authoritative Project → DevelopmentPhase → Building → Floor → Unit hierarchy and reservation availability semantics.
- [x] Implement Arabic/English localization and qualify RTL/LTR behavior without changing backend enum values.
- [x] Qualify desktop, tablet, and practical mobile salesperson workflows.
- [x] Qualify accessibility, loading, empty, no-permission, error, stale/conflict, and success states.
- [x] Add or adapt frontend and synthetic sales-journey tests without fake successful mutations or real PII.
- [x] Add negative-path qualification for authorization, invalid transitions, duplicate conversion, quotation sequencing, decisions, availability, reservation conflicts, stale state, and missing records where contracts exist.
- [x] Re-run portfolio-isolation checks and final scope-drift audit.
- [x] Produce the final evidence-based handoff and release-gate decision.

- [x] Perform deeper root-cause analysis of the Next.js `/404` `<Html>` prerender failure across versions, router remnants, config, generated bundles, and dependency resolution.
- [x] Apply the smallest evidenced correction for the web production-build blocker without suppressing validation or removing required routes.
- [x] Re-run the authoritative R4C web production build and record the exact result.
- [x] Verify whether an authoritative KYNOX visual reference exists in the selected repositories/workspace without inventing a visual language.
- [x] Create `R4C-KYNOX-VISUAL-RECONCILIATION.md` with evidence-backed alignment decisions.
- [x] Review `/sales` workflow visualization and ensure all indicators map to actual contracts; do not add unsupported forecast, win-rate, pipeline value, conversion, or trend analytics.
- [x] Qualify workflow continuity, responsive/mobile behavior, Arabic/RTL, accessibility, synthetic scenario boundaries, and negative-path handling against the directive.
- [x] Re-run the final frontend qualification and issue the candidate-freeze handoff only after the web production build passes.

- [x] Record founder-reviewed visual acceptance failure and supersede the prior KYNOX visual PASS without invalidating functional qualification.
- [x] Redesign `/sales` as a KYNOX operating workspace using only existing data and contracts; do not reopen backend/domain architecture or add features.
- [x] Remove the permanent Contact, Opportunity, Activity, Task, and Quotation form wall; replace with contextual action buttons and drawers/panels.
- [x] Recompose the header, signal strip, My Work, active Opportunity visualization, commercial context, and contextual work surface with stronger hierarchy and less vertical waste.
- [x] Promote the Opportunity lifecycle to a legible accessible stage visualization using only actual stages and preserving Reservation authority.
- [x] Reset the card/surface system to fewer borders, controlled depth, compact metadata, stronger typography, and verified KYNOX graphite/teal/amber grammar.
- [x] Preserve English/Arabic, LTR/RTL, existing endpoints, tenant isolation, permissions, project/unit hierarchy, reservations, quotations, and all existing workflows.
- [x] Re-run functional, responsive, RTL, accessibility, rendered visual, and no-scope-drift qualification after the redesign.
- [x] Update the visual reconciliation and final handoff with the founder-reviewed result and one canonical candidate SHA.

- [x] Verify candidate repository, branch, HEAD, and Git status against the attached founder directive; keep one canonical candidate SHA.
- [x] Reconcile stale pre-reset evidence and explicitly retain the status READY FOR FOUNDER VISUAL REVIEW until rendered acceptance.
- [x] Restore or verify the disposable PostgreSQL/Redis synthetic runtime, seeded tenant, supported personas, and local Next.js/API stack without production access.
- [x] Capture populated English/LTR Sales evidence at 1440x900, 1024x768, and 390x844, including Opportunity context, My Work, and one open contextual drawer.
- [x] Capture populated Arabic/RTL Sales evidence at 1440x900 and 390x844, including RTL-safe context and drawer behavior.
- [x] Inspect empty/populated My Work, all five contextual drawers, stage presentation, activity timeline, task band, selected context rail, signal strip, surface hierarchy, mobile length, reduced motion, and accessibility behavior.
- [x] Apply only objectively visible frontend corrections discovered from rendered evidence; do not change lifecycle states, endpoints, backend contracts, or feature scope.
- [x] Create `R4C-SALES-BEFORE-AFTER-VISUAL-REVIEW.md` with criterion-by-criterion Before/After/Result comparison and exact evidence metadata.
- [x] Re-run the final frontend, responsive, RTL, accessibility, scope-drift, and candidate-integrity qualification gates.
- [x] Update the single canonical handoff and issue the explicit READY FOR FOUNDER VISUAL ACCEPTANCE or remaining-gate decision.
- [x] Restore the missing frontend `/api/locale` route using the existing `r4c_locale` cookie contract so Arabic/RTL can be verified without changing backend contracts.
- [x] Correct the populated tablet-width Signal Strip stacking that creates excessive vertical length while preserving the intentional mobile two-column composition.

- [x] Apply bounded polish only: reduce sidebar decorative dominance, tune Command Center title, compact top bar and Quick Actions, and preserve the approved composition.
- [x] Make Selected Context adaptive for sparse data without inventing values or adding backend reads.
- [x] Verify and correct drawer focus entry, keyboard traversal, Escape close, close-button naming, focus return, background inertness, labels, errors, and status feedback.
- [x] Verify mobile drawer presentation, tablet 1024×768 composition, mobile 390×844 operating sequence, mobile stage clarity, and Arabic mobile RTL behavior where the available browser supports it.
- [x] Verify controlled enum display localization, contrast, reduced-motion behavior, touch target sizing, practical screen-reader naming/order, empty My Work, populated My Work, sparse/populated context, and supported negative browser paths.
- [x] Capture final Founder-ready screenshots and reconcile the evidence and handoff without claiming unavailable formal WCAG certification or unsupported viewport results.

- [x] Verify repository, branch, HEAD, Git status, and one canonical SHA across handoff, evidence, TODO, screenshot metadata, and final response.
- [x] Rerun the current authoritative frontend contract suite once and reconcile all stale 4/4 versus 5/5 counts.
- [x] Record Founder Visual Acceptance as PASS and preserve the approved composition with no discretionary redesign.
- [x] Use the existing local Playwright/system Chromium capability for authenticated populated 1440x900, 1024x768, 390x844 English and 1440x900, 390x844 Arabic captures.
- [x] Complete the directive’s controlled desktop/tablet/mobile/RTL, drawer matrix, reduced-motion, contrast, touch, screen-reader smoke, empty/populated, sparse/populated context, reservation-authority, and supported negative-path checks.
- [x] Freeze the frontend candidate only if every required gate passes; otherwise retain an explicit NOT READY decision with exact remaining gates.

- [x] Proven P1: expose the existing quotation drawer from the selected opportunity context so the supported quotation drawer matrix is executable without introducing a new module.
- [x] Proven P1: rebuild/restart the disposable R4C web runtime and requalify the existing `/api/locale` route because the prior stale runtime returned 404 and Arabic captures remained English.
- [x] Re-run controlled browser qualification after proven corrections, including all five drawers and Arabic desktop/mobile.

- [x] Proven P1 functional regression: existing `/projects` protected entry and shell navigation return 404 in the current build; add only a compatibility redirect to the existing `/commercial` workspace, with no new module or backend change.

- [x] Revoke the previous frontend UI/UX freeze explicitly as a Founder-rendered mobile review failure, preserving the historical record.
- [x] Inspect and document exact mobile CSS/layout root causes for the overlapping/collapsed Sales composition without using overflow hiding or arbitrary negative margins.
- [x] Recompose the <=680px Sales hierarchy into one deterministic normal-flow mobile experience for English/LTR and Arabic/RTL.
- [x] Add a frontend-only compact mobile navigation treatment using existing destinations without adding routes or duplicating navigation.
- [x] Make Selected Context, Activity History, Opportunity, stage presentation/actions, Quick Actions, My Work, Workload, top user bar, and drawers intentionally usable at mobile width.
- [x] Capture and visually inspect fresh populated English/LTR 1440x900, 1024x768, 390x844 and Arabic/RTL 1440x900, 1024x768 if practical, 390x844 evidence.
- [x] Strengthen responsive evidence with geometry checks for major-surface intersections, narrow widths, clipped controls, unexpected coordinates, and mobile action reachability.
- [x] Rerun focus, keyboard, drawer, contrast, reduced-motion, touch-target, accessible-name, frontend contract, build, journey, commercial, isolation, and diff checks after responsive correction.
- [x] Reconcile documents to FOUNDER PREVIOUS FREEZE: REVOKED and only re-freeze the frontend if image-level English and Arabic mobile acceptance passes.

- [x] Proven P0 responsive defect: at 390px `.sales-operating-grid` retains the desktop two-column template, rendering My Work and Opportunity at approximately 50px beside the context/history rail; collapse it to one full-width normal-flow column at <=680px.

- [x] Reconcile exact repository, branch, HEAD, remotes, canonical CRM backend SHA, backend freeze revision, migration revision, and frontend frozen revision into one current truth.
- [x] Trace why the available disposable API tree lacks the frontend-required CRM routes and document provenance before changing any endpoint.
- [x] Assemble one complete authoritative R4C full-stack tree from known committed history without blind merging or unrelated overlays.
- [x] Apply the real migration chain to a fresh disposable PostgreSQL database and verify CRM tables, tenant relations, constraints, indexes, quotation/revision relations, CustomerDecision constraints, and Commercial compatibility.
- [x] Establish disposable PostgreSQL, Redis, actual NestJS API, and actual Next.js web runtime with synthetic tenant/personas only.
- [x] Qualify actual authentication, tenant resolution, session creation, access/refresh tokens, logout, protected Sales route, and supported Administrator/Sales Manager/Sales Agent permissions.
- [x] Remove browser fixture dependence from release-candidate CRM qualification and verify actual Contacts, Opportunities, Tasks, and Activities through the frozen Sales frontend.
- [x] Qualify actual Contact create/duplicate rejection, Lead conversion idempotency, Opportunity create/stage transitions, Activity persistence, Task persistence/completion, Quotation revisions/status/CustomerDecision where supported, Reservation authority, and exact SAR/money handling.
- [x] Execute one actual-backend synthetic Saudi-market-compatible positive journey through applicable CRM, Commercial, quotation, availability, and reservation steps.
- [x] Execute the actual API negative-security matrix, browser error UX checks, bounded backup/restore verification, portfolio isolation, and final release-integrity checks.
- [x] Reconcile the full-stack evidence package and issue the final GO/NO-GO release decision without reopening the frozen frontend unless a proven integration defect requires it.

- [x] Proven P1 full-stack blocker: actual `/api/v1/crm/opportunities` read/create returns HTTP 500 because Express JSON serialization cannot serialize `expectedValueMinor` BigInt; apply the smallest contract-preserving response serialization fix, then rerun actual CRM qualification.
- [x] Reconcile actual backend API response status conventions: supported login returns 201, not 200; adjust only the temporary qualification expectation, not product behavior.
- [x] Make actual full-stack qualification idempotent against the existing synthetic database so prior failed probe records do not masquerade as create failures.

# Staging Qualification and Production Release-Gate Directive

- [x] Reconcile the attached staging directive against the current canonical R4C candidate and record one source SHA.
- [x] Classify authentication, storage, email, social, government, banking, payment, AI, maps, and other providers by release role.
- [ ] Verify an authorized non-production staging target and production-shaped runtime topology without introducing new infrastructure.
- [ ] Verify isolated staging database migration history, constraints, indexes, tenant relationships, quotation/revision relationships, CustomerDecision uniqueness, and Commercial compatibility.
- [ ] Create and integrity-check a staging backup before destructive UAT, without exposing credentials.
- [ ] Seed only synthetic Administrator, Sales Manager, Sales Agent, tenant, and business records in staging.
- [ ] Execute deployed-environment authentication, session, refresh, expiration, logout, invalid-token, protected-route, and unauthorized-user checks.
- [ ] Execute deployed Administrator, Sales Manager, and Sales Agent representative journeys with actual persistence and authority boundaries.
- [ ] Execute deployed tenant-isolation and IDOR checks across CRM, quotation, task/activity, project/unit, commercial, reservation, and direct-ID surfaces.
- [ ] Verify deployed session security, cookies, refresh rotation, logout invalidation, tenant binding, privilege boundaries, and applicable rate limits.
- [ ] Execute the full deployed positive journey and highest-risk negative journeys using actual services only.
- [ ] Perform staging-only responsive regression checks for desktop, tablet, mobile, and Arabic/RTL without redesign.
- [ ] Reconcile staging evidence and issue the final deployed-RC readiness decision without authorizing production deployment.
- [x] Correct the stale `apps/web/package.json` contract-test script path to the existing authoritative web contract test and rerun the final local audit.
