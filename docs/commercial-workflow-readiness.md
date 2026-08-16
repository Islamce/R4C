# Commercial workflow readiness

| Workflow | UI | API | Capability | Fixture | Refactor need | Decision | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Lead creation | Form plus customer capture | Existing Customer/Lead POST | `lead:create`, `customer:create` | Agent/Manager | Shared API calls | READY | Operator workspace and C03 tests |
| Separate consent purposes | Separate enquiry and marketing fieldsets | Existing validation | `lead:create` | C03 synthetic data | None | READY | `assertLeadConsent` and capture form |
| Own/all Lead views | Toggle shown only when allowed | Existing own/all endpoints | `view-own`, `view-all` | Agent/Manager | Repeated permission checks | READY | UI contract and controller guards |
| Lead detail | Customer, interest, assignee, status | Existing detail endpoints | Own/all split | Agent/Manager | None | READY | Lead DTO returned by API |
| Status progression | Valid next action only | Server transition map authoritative | `lead:qualify` | C03/C04 | None | READY | Reserved transition remains confirmation-only |
| Disqualification | Action on eligible states | Dedicated endpoint | `lead:disqualify` | Agent/Manager | None | READY | Server eligibility guard |
| Reassignment | Manager-only selector | New bounded assignee lookup; existing patch | `lead:reassign` | Manager | Tenant guard consolidation | READY | Active tenant membership query |
| Customer context | Basic Lead-returned customer | Existing Lead projection | Lead access | Agent/Manager | None | READY | No broad search added |
| Activities | Append form and timeline | Existing append/list; access guard tightened | `activity:view/log` | Agent/Manager | Confirmed access defect | READY | Contract test and C03 runtime suite |
| Unit browsing | Available-only selector | Existing tenant/project Unit list | `commercial:read` | Agent/Manager | None | READY | Operator selector |
| Published price | Displayed during Unit review | Existing published-price GET | `price:view-published` | Agent/Manager | None | READY | UI and C04 runtime suite |
| Localized description | Locale-resolved Unit context | Unit read resolves ar → en → source | `commercial:read` | Agent/Manager | Privileged translation read | READY | Locale resolver and C04 assertion |
| Hold creation/release | Expiry form and active-Hold review | Existing transactional endpoints; ownership guard tightened | `hold:create/release` | Agent/Manager | Confirmed access defect | READY | C04 concurrency/expiry coverage |
| Payment-plan reading | Confirmation review selector | GET separated from manage | `payment-plan:view` | Agent/Manager | Read/manage coupling | READY | Controller and role contract tests |
| Reservation confirmation | Explicit review checkbox and result | Existing serializable confirmation | `reservation:confirm` | Manager | None | READY | C04 permission and snapshot coverage |
| Price snapshot | Server result rendered | Existing immutable snapshot fields | `reservation:confirm` | Manager | None | READY | C04 exact minor-unit assertions |
| English and Arabic/RTL | Shared dictionaries and locale request | Locale query validation | Same business capabilities | All roles | Modular message file | READY | Web contract test and production build |
| Agent/Manager/Admin fixtures | Capability-driven UI | Idempotent role mappings; optional UAT users | Least privilege | Synthetic only | Seed mapping duplication | READY | Seed contract and idempotency suite |
| Local source verification | Build/type/static tests | API static tests | N/A | Synthetic | Windows root-script adaptation | READY | Execution report |
| Production dependency status | Not exercised | PostgreSQL/Redis/R2 gates pending | N/A | None | None | BLOCKED | Founder-gated production migration and UAT |

Runtime remains `DEPLOYED BUT VALIDATION-BLOCKED — SPLIT SHA AND UNINITIALIZED DATABASE SCHEMA` until the separate production gate completes.
