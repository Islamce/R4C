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
