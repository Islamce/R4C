# R4C Codex Continuation TODO

- [ ] Reconcile the unavailable reported candidate `709ec928d4b9fe9cf38109c7535c73ce5215ae94` against the recovered GitHub `main` candidate `1ab27d8a79d9fa6243d796f0b2fa86aa595a39af` and select one reviewed release SHA.
- [ ] Re-run the complete release qualification against the selected reviewed SHA, including API, web, migration, runtime, and required UAT evidence.
- [ ] Obtain or discover an authorized non-production staging target, endpoint set, deployment identifier, isolated PostgreSQL/Redis, and secure secret-injection path.
- [ ] Apply and verify the authoritative Prisma migration chain in staging, then create and integrity-check a pre-UAT staging backup.
- [ ] Execute deployed Administrator, Sales Manager, and Sales Agent UAT with synthetic data and actual persistence.
- [ ] Execute deployed two-tenant isolation and IDOR tests across CRM, Commercial, quotation, decision, project/unit, and reservation resources.
- [ ] Execute deployed authentication/session, rate-limit, positive, negative, responsive, and rollback checks.
- [ ] Commission and complete an independent penetration test, then remediate and retest any P0/P1 findings.
- [ ] Prepare the separate Founder production-authorization package after all deployed gates pass.
- [x] Create and push the complete committed R4C project to GitHub branch `manus/design-handoff`.
- [x] Verify the remote branch points to the intended complete handoff commit and report its URL and SHA.
- [x] Audit `manus/design-handoff` against the approved R4C frontend implementation and identify missing UI source, styles, assets, fonts, and responsive files.
- [x] Add the approved frontend implementation and required runtime assets without removing CRM functionality or continuity documents.
- [x] Validate frontend build/typecheck/tests, responsive file coverage, and preservation of CRM routes before pushing.
- [x] Push the complete frontend implementation to `manus/design-handoff` and verify the remote branch contents.
- [x] Add the approved `R4C-FINAL-UI-SCOPE.md` contract document required by the transferred CRM UI test, without changing the test assertions.
- [x] Extend the existing frontend backend proxy with the approved CRM read/write and quotation paths without removing existing Commercial, BIM, project, or progress paths.
