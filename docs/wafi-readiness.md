# Wafi Readiness — Interface Design Only

> **Status:** Research-bounded architecture. No Wafi API, portal, sandbox, credential, escrow-bank, payment, release, contract-registration, or production integration is implemented or tested.
>
> **Regulatory notice:** This is an engineering readiness record, not legal, real-estate, banking, escrow, or regulatory advice. Obtain qualified Saudi legal/regulatory and bank review before relying on it operationally.

## 1. Plain readiness decision

R4C is **not ready to build or test a working Wafi integration**. The public REGA material reviewed describes a website platform for qualification requests, licensing, and post-licensing services, but it does not publish a developer API, sandbox, authentication scheme, or API payload contract. [1]

A future integration requires a real R4C customer that is an appropriately registered real-estate developer, has the applicable REGA/Wafi project and licence context, and can provide authorized access to the authoritative Wafi onboarding/API materials. KYNOX must not use its own identity as a substitute for a customer developer or fabricate access.

| Precondition | Current evidence | Status |
| --- | --- | --- |
| Registered developer context | REGA regulates qualification and licensing via the Off-Plan Sales and Lease platform. | **External business prerequisite** |
| Project/licence context | The regulations require project-level information and approvals for relevant off-plan licensing. | **External business prerequisite** |
| Authoritative Wafi interface documentation | No public API/sandbox documentation was found in reviewed REGA sources. | **Blocked — do not infer** |
| Authorized tenant credentials | No customer-provided credentials exist in this task. | **Blocked — do not create or share credentials** |
| Bank/escrow integration agreement | The regulations prescribe bank-facing withdrawal requests and approvals, but no bank-specific API or account arrangement is available. | **Separate external integration prerequisite** |

## 2. What the published REGA material does establish

REGA says the platform enables qualification requests, necessary licences, and post-licensing services for off-plan sale or lease projects. The implementing regulations identify project feasibility, estimated financial/construction/marketing information, delivery schedules, funding sources, permits, and, where applicable, subdivision information as regulatory project materials. [1] [2]

The implementing regulations also distinguish a bank/escrow layer. They state that withdrawal requests are submitted by the developer to the bank and require consulting-firm and chartered-accountant approval; secure technical means may be used. This is not public Wafi API documentation, but it confirms that any future bank/escrow interface is a **second integration surface** rather than an assumed function of a generic Wafi connector. [2]

## 3. Proposed interface-only model

The following models are a design boundary. They must not be migrated or coded until a future task provides verified Wafi onboarding/API materials and explicit approval.

### 3.1 `WafiCredential`

| Field group | Proposed fields | Boundary |
| --- | --- | --- |
| Scope | `id`, `tenantId`, `environment`, `developerExternalReference?`, `projectLicenceReference?` | Per tenant only; never KYNOX-shared. |
| Access metadata | `credentialProvider`, `secretReference`, `status`, `issuedAt?`, `expiresAt?`, `revokedAt?` | Opaque secret reference only; no password, token, or private material in Prisma/audit data. |
| Provenance | `authorizedById?`, `createdAt`, `updatedAt` | Captures tenant authority and lifecycle, not a fabricated credential format. |

### 3.2 `WafiSubmission`

`WafiSubmission` represents a possible future interface exchange, not a payment, approval, or legal registration action.

| Field group | Proposed fields | Boundary |
| --- | --- | --- |
| Ownership/source | `id`, `tenantId`, `projectId`, `reservationId?`, `credentialId?` | Tenant and Project are required; Reservation is only used where a verified future Wafi operation requires it. |
| Submission purpose | `submissionType` (`MILESTONE_REPORT`, `ESCROW_RELEASE_REQUEST`, `BUYER_CONTRACT_REGISTRATION`) | The three values are requested architecture categories, not asserted public API operation names. An implementation must map them only after official documentation is supplied. |
| Evidence | `requestDocumentVersionId?`, `responseDocumentVersionId?`, `externalReference?`, `submittedAt?`, `respondedAt?` | Reuse immutable document versions for payloads/responses and avoid raw sensitive blobs in mutable logs. |
| Workflow | `status`, `authorityCode?`, `authorityMessage?`, `failureCategory?`, `createdAt` | R4C-local workflow terms only; no implied REGA approval semantics. |

### 3.3 `EscrowTransaction`

`EscrowTransaction` is intentionally an **interface evidence record**, not a cash ledger and not an instruction to move funds.

| Field group | Proposed fields | Explicit exclusion |
| --- | --- | --- |
| Context | `id`, `tenantId`, `projectId`, `reservationId?`, `wafiSubmissionId?`, `bankIntegrationReference?` | No bank-account credentials, balance, routing, beneficiary, transfer, or collection fields. |
| Evidence/status | `externalReference?`, `status`, `requestDocumentVersionId?`, `responseDocumentVersionId?`, `createdAt`, `updatedAt` | No escrow movement, release execution, payment collection, or reconciliation engine. |

## 4. Future interface boundaries

| Surface | Future purpose | Current state |
| --- | --- | --- |
| Wafi/REGA | Regulatory/licensing or post-licensing submission evidence after API terms are supplied. | **Interface design only** |
| Bank escrow provider | Bank-specific implementation of account, withdrawal-request, and approval processes. | **Separate interface design only** |
| R4C Reservations | Commercial sales state and immutable price/payment-plan snapshots. | **Existing C04; not a payment or escrow trigger** |
| R4C Documents/Audit | Immutable payload/response references and actor/outcome evidence. | **Existing foundation to reuse** |

## 5. Non-negotiable exclusions

The following are not authorized by this design: live Wafi calls; browser/portal automation; generic “Wafi API” assumptions; live bank calls; escrow account opening or movement; payment collection; buyer-contract generation or execution; e-signature; regulatory submission; invoice/tax workflows; shared KYNOX credentials; or extensions to frozen Development Intelligence.

## 6. Re-entry checklist

A later implementation proposal must attach all of the following before code begins:

1. The customer developer’s explicit written authorization and verified tenant identity.
2. Applicable project and licence references, with approved data-handling boundaries.
3. Official Wafi API/onboarding documentation and a non-production endpoint or documented testing process.
4. The bank-specific escrow interface agreement and technical documentation, handled as a separate workstream.
5. Approved tenant secret-management and audit-retention design.
6. A decision on whether and how a Wafi-side request may reference an R4C Reservation, without treating it as an automatic compliance action.

## References

[1]: https://rega.gov.sa/en/rega-services/platforms/wafi-off-plan-sales-and-lease/ "REGA — Off-Plan Sales and Lease"
[2]: https://rega.gov.sa/en/laws-and-decisions/regulations-and-by-laws/regulations/implementing-regulations-of-the-off-plan-sale-and-lease-of-real-estate-projects-law/ "REGA — Implementing Regulations of the Off-Plan Sale and Lease of Real Estate Projects Law"
