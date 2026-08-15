# Commercial refactoring plan

| Candidate | Evidence | Proposed change | Behavior change | Risk | Tests | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| Browser commercial requests | Repeated URL, JSON, and response typing would spread across the new UI | Focused `commercialApi` functions and journey types | None | Low | Web typecheck/contracts | REFACTOR_NOW |
| UI capability checks | Multiple actions require the same session membership test | One local `has(user, permission)` helper | None | Low | Negative role-name assertion | REFACTOR_NOW |
| Commercial messages | Large shared dictionary already modularizes progress messages | Compose `commercial-i18n` through the same provider | Visible new copy only | Low | English/Arabic contract/build | REFACTOR_WHILE_TOUCHED |
| Activity/Hold Lead access | Activity read and Hold operations used tenant existence without consistent ownership | Reuse `assertLeadOwnerOrManager` | Denies previously over-broad access | Medium | API contract plus C03/C04 suites | REFACTOR_NOW |
| Locale resolution | Translation GET requires media management | Focused response mapper on Unit read | Adds least-privilege response fields | Low | C04 localized fallback | REFACTOR_NOW |
| Seed role reconciliation | ADMIN/VIEWER link logic duplicated | Iterate declarative role definitions | Adds Sales roles; preserves existing mappings | Medium | Seed idempotency and capability assertions | REFACTOR_NOW |
| Split 1,200-line CommercialService | File is large, but length alone is insufficient | Defer until independently evidenced seams require change | None | High | N/A | DEFER |
| Generic repository/CQRS rewrite | No evidence and prohibited scope | None | None | High | N/A | REJECT_OUT_OF_SCOPE |
| Customer search endpoint | Lead response contains sufficient customer context | None | None | Medium | Existing C03 coverage | DEFER |
