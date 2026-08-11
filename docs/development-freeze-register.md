# Development Intelligence Freeze Register

**Effective:** R0 Product Reset baseline, 2026-08-11

## Purpose

Prevent renewed scope drift while R4C establishes its Commercial MVP.

## Frozen capability areas

No new product capability is authorized for:

- WBS
- IFC/BIM processing
- BIM viewer
- Schedule/4D
- Development progress enhancements
- 5D/cost/earned value
- Construction materials
- Procurement
- Site inventory
- Quality/NCR/punch
- HSE/permits/events
- Commissioning
- Construction handover

## Allowed changes inside frozen areas

A change is permitted only when at least one condition is demonstrated:

1. critical security remediation;
2. production/runtime blocker;
3. verified data-integrity defect;
4. migration/schema compatibility required by approved Commercial work;
5. narrowly scoped Commercial integration approved by Product/Founder;
6. CI/release maintenance required to preserve a healthy main branch.

Allowed maintenance must not introduce adjacent product expansion.

## Active development areas

- Platform Core required by Commercial
- Commercial property inventory
- Pricing/payment plans/media
- Public project/unit experience
- Customer/lead/sales activity
- Holds/reservations
- Commercial analytics

## Change classification gate

Before implementation, every proposed change must be labeled conceptually as:

- `COMMERCIAL_CORE`
- `PLATFORM_ENABLER`
- `DEVELOPMENT_MAINTENANCE`
- `FUTURE_EXPANSION`

`FUTURE_EXPANSION` is not authorized during Commercial MVP.

## Merge gate for Development maintenance

A PR touching frozen code must state:

- freeze exception being used;
- evidence of the defect/compatibility need;
- why Commercial behavior cannot be solved without the frozen-area change;
- confirmation that no adjacent capability was added;
- regression evidence for the affected historical capability.

## Permanent architecture principle

Commercial must remain usable without BIM/Development Intelligence. Development Intelligence may publish controlled data to Commercial/Customer Experience, but Commercial transactions may not require BIM/WBS services.
