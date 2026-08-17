# Buyer Sales Quotation MVP Readiness

This readiness note is intentionally limited to the buyer sales-quotation MVP. It records the verified starting condition on `feat/commercial-command-center-hardening` and does not repeat the wider R4C audit.

| Requirement | Existing evidence | Gap | MVP decision | Implementation |
|---|---|---|---|---|
| Tenant isolation | Commercial `Customer`, `Lead`, `UnitHold`, `Reservation`, price revision, and payment-plan relations are tenant-scoped in Prisma; existing services use tenant-scoped queries. | No quotation entity. | Preserve the same hard tenant boundary. | Every quotation, token, delivery record, and decision includes `tenantId`; all reads and writes filter by it. |
| Lead/customer/unit foundation | A Lead can link customer, project, and unit; holds and reservations already carry immutable price/payment-plan references. | No buyer-quotation snapshot. | Reuse these authoritative relations rather than create parallel commercial records. | Snapshot only after internal approval from validated authorized price and plan records. |
| Immutable evidence | DocumentVersion has storage checksum and audit patterns; Reservation contains snapshots. | No immutable buyer-facing quote content or document link. | Use quotation-owned JSON snapshots and a deterministic preview checksum. | Sent/approved quotation snapshot cannot be patched; a revision supersedes rather than edits it. |
| Internal review | Document review and progress review demonstrate server-side review transitions and outbox/audit writes. | No quotation review state or separation-of-duties check. | Implement a narrow quotation lifecycle service. | Agent drafts/submits; manager returns or approves-to-send; the same user cannot approve an own draft. |
| Customer decision | Reservations include `approvedById`; document review includes decision evidence. | No tokenized public customer surface. | Recorded customer acceptance/decline only. | Single-purpose hashed approval token, expiry, revocation, replay protection, generic errors, append-only decision. |
| Reservation safety | Existing Hold and Reservation endpoints retain permission gates and server checks. | A quotation could be mistakenly treated as a reservation. | No automatic hold or reservation. | Customer decision only updates quotation state and creates an internal follow-up; separate existing reservation permissions still apply. |
| Email delivery | `NotificationOutbox` includes `EMAIL`; document distribution queues an email event. | No verified generic dispatcher or delivery receipt processor. | Do not expose live Send. | Use synthetic preview/test-link generation and an outbox-ready adapter contract only. |
| PDF | Documents support governed file storage/versioning, and the repository contains document/PDF adjacent facilities. | No quotation PDF renderer. | Render preview from exactly the approved snapshot. | Generate a preview document/checksum in synthetic mode; clearly label no legal signature or live communication. |
| Public/token routes | Public auth routes exist; password reset demonstrates hashed, expiring token concepts. | No public quotation route or dedicated anti-replay rule. | Add a narrow token-only buyer approval endpoint. | Opaque random token in URL, stored hash only, strict rate limit, no customer/tenant enumeration. |
| i18n / RTL | Cookie locale and Arabic commercial UI are established. | Quotation terminology and buyer page copy do not exist. | Add bilingual quotation messages and logical CSS. | Keep project/unit identifiers, quote number, currency, and source reference canonical in both directions. |
| Mobile | JWT login/refresh exists and no `pubspec.yaml` was found in R4C. | No Flutter project or mobile API facade. | Design preview only for internal sales. | Provide synthetic responsive design preview and specification; do not scaffold or release Flutter. |
| RFQ boundary | Materials and procurement orders exist, but no RFQ, supplier, or bid domain exists. | The term RFQ could be confused with buyer quotation. | Defer procurement RFQ. | Use “Buyer Sales Quotation” and “Customer Decision” consistently; create no supplier/procurement models. |

## Readiness conclusion

> **Source implementation is feasible with a dedicated quotation domain.** The MVP must not reuse mutable live price calculations, generic document review as customer acceptance, or the existing email outbox as proof of external delivery.

The deployment prerequisite remains unchanged: source work may be validated locally or against disposable synthetic data only. Production Prisma migration, delivery dispatcher configuration, exact-SHA deployment, public UAT, and production restart remain deferred.
