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

## Real role and authorization checks

| Actor | Verified behavior | Result |
|---|---|---|
| Administrator | Full permission model and governed production configuration | PASS by contract/security suite |
| Sales agent | Create/view owned customer and lead, log activity, advance allowed stages, create/cancel hold | PASS via real HTTP |
| Sales manager | View all leads, approve reservation, close sale and resolve unit to SOLD | PASS via real HTTP |
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

## Additional negative and resilience checks

- Manual transition directly to RESERVED is rejected.
- Cancellation releases the unit and resets the lead.
- Expired holds are swept and release inventory.
- An expired converted hold cannot release a confirmed reservation.
- Cross-tenant assignee leakage is blocked.
- Missing consent or invalid consent metadata is rejected.
- Arabic translations and English fallback behavior are verified.

## Browser/UI evidence

- `01-customer-pipeline.png`: governed pipeline, project lists and consolidated register.
- `03-floor-hotspots.png`: all eight units visible and selectable directly from the floor layout.
- `04-transfer-governance.png`: title-transfer portfolio reconciliation and manager-controlled workflow.

## Evidence limits and remaining domain gap

The API currently models the commercial journey through a won sale and sold inventory. The title-transfer document checklist, supervisor approvals, sales tasks, alerts and project-content email composer are fully interactive in the approved workspace but are not yet all backed by dedicated persistent API entities. They must not be represented as production-persistent until those domain endpoints and migrations are implemented. Government submission correctly remains disabled until an authority integration agreement exists.

