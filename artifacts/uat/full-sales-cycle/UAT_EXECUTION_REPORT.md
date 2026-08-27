# R4C comprehensive operational UAT — full sales cycle

Date: 2026-08-27  
Environment: isolated local PostgreSQL, Redis, MinIO, NestJS API and Next.js web  
Release branch: `codex/restore-approved-product`

## Verdict

**PASS for the implemented commercial sales domain and approved workspace.** Production remains unchanged pending promotion of the exact tested commit and production smoke testing.

## Complete test data

- Saudi customer with normalized mobile and email, enquiry and marketing-consent metadata.
- Commercial project, phase, building, floor, unit type and inventory unit.
- Published SAR price revision with immutable price snapshots.
- Payment plan with 100% allocation validation.
- Assigned sales agent, sales manager, read-only user and a user from a different tenant.
- Sales activity recording the deposit receipt and signed-contract review.
- Active, cancelled, expired and converted unit holds.
- Confirmed reservation followed by a won sale and sold-unit status.
- Persisted manager-assigned sales task with role-scoped agent visibility.
- Persisted title-transfer case with nine governed document requirements.
- Public customer-portal enquiry with a verified Saudi mobile number, selected project and optional available unit.

## Real role and authorization checks

| Actor | Verified behavior | Result |
|---|---|---|
| Administrator | Full permission model and governed production configuration | PASS by contract/security suite |
| Sales agent | Create/view owned customer and lead, log activity, advance allowed stages, create/cancel hold | PASS via real HTTP |
| Sales agent | View only assigned sales tasks; task management and transfer approval rejected | PASS via real HTTP |
| Sales manager | View all leads, approve reservation, assign tasks, review transfer documents, close sale and resolve unit to SOLD | PASS via real HTTP |
| Read-only user | Read access only; translation and commercial mutations rejected | PASS via HTTP 403 |
| Other-tenant user | Cannot appear as assignee or access tenant records | PASS |

## End-to-end sale

1. Customer and lead are created with ownership and Saudi-contact evidence.
2. Agent progresses the lead through contacted, qualified, appointment and negotiation.
3. Agent creates a time-limited hold on an available unit.
4. A competing hold is rejected with HTTP 409, preventing double booking.
5. Agent reservation confirmation is rejected with HTTP 403.
6. Manager confirms the reservation using a published price and approved payment plan.
7. Unit changes from AVAILABLE to RESERVED; hold changes to CONVERTED; lead changes to RESERVED.
8. Agent records deposit and signed-contract follow-up in the activity timeline.
9. Manager closes the lead as WON; unit changes atomically from RESERVED to SOLD.
10. Audit events prove hold creation, expiry behavior, reservation confirmation, activity logging and final unit resolution.
11. Manager creates a transfer case for the confirmed reservation; the agent can view it but cannot approve it.
12. Premature transfer approval is rejected with HTTP 409. The manager reviews each applicable document, marks the subdivision document not applicable, reaches 100% readiness and approves the case.

## Additional negative and resilience checks

- Manual transition directly to RESERVED is rejected.
- Cancellation releases the unit and resets the lead.
- Expired holds are swept and release inventory.
- An expired converted hold cannot release a confirmed reservation.
- Cross-tenant assignee leakage is blocked.
- Missing consent or invalid consent metadata is rejected.
- Arabic translations and English fallback behavior are verified.
- Task assignee visibility is separated from manager-only team enumeration.
- Transfer readiness is calculated from persisted document states and cannot be bypassed.
- Invalid Saudi numbers and incorrect OTP codes are rejected; a verified code is single-use and the resulting external lead retains enquiry and marketing consent separately.

## Browser/UI evidence

- `01-customer-pipeline.png`: governed pipeline, project lists and consolidated register.
- `03-floor-hotspots.png`: all eight units visible and selectable directly from the floor layout.
- `04-transfer-governance.png`: title-transfer portfolio reconciliation and manager-controlled workflow.

## Automated execution evidence

- Prisma schema validation: PASS.
- API security and governance contracts: 14/14 PASS.
- CRM/customer/tenant real HTTP suite: 2/2 PASS.
- Full sale, task assignment and transfer approval real HTTP suite: 1/1 PASS.
- Commercial web workflow contracts: 10/10 PASS.
- Customer portal UI/security contracts: 3/3 PASS.
- Repository TypeScript checks: PASS.
- API and Next.js optimized production build: PASS.
- KAAF generated context and all architecture validators: PASS (one informational documented dependency, no warnings or errors).

## Evidence limits and remaining integration boundary

Sales tasks, transfer cases, transfer-document reviews and commercial dispatch records now have dedicated tenant-scoped persistence, permissions, audit events and bounded browser API paths. The government submission action correctly remains disabled until an authority integration agreement and issued credentials exist. External email delivery is represented as a governed dispatch record; an email provider must be configured and separately smoke-tested before claiming delivery outside R4C.
