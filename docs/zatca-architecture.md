# ZATCA Architecture — Data, Credential, and Integration Boundary

> **Status:** Architecture and interface design only. This document does not implement XML generation, CSR creation, certificate issuance, cryptographic signing, API submission, payment collection, or production connectivity.
>
> **Tax notice:** This is an engineering architecture record, not tax advice. A qualified Saudi tax professional and security reviewer must validate production use before any filing or invoice issuance.

## 1. Governing evidence and confirmed boundary

ZATCA’s Developer Portal Manual describes an Integration Sandbox for test onboarding, Reporting, and Clearance, while the Fatoora Portal User Manual describes distinct production and simulation portal environments and their endpoint families. The Fatoora Simulation Portal requires ERAD credentials; therefore R4C has **not** established a sandbox path usable without a real taxpayer credential. No sandbox registration, OTP, CSR, XML, or API request has been made. [1] [2]

The ZATCA sources distinguish Standard-document Clearance from Simplified-document Reporting in their test flows. The XML Implementation Standard, Data Dictionary, and Security Features Implementation Standards are the controlling technical sources; exact payload construction and API request/response mapping must be taken from the authenticated official documentation at the implementation gate, not inferred from this architecture. [1] [3] [4]

| Boundary | Decision |
| --- | --- |
| Production API calls | **Excluded.** The Fatoora production portal requires ERAD taxpayer credentials. |
| Simulation API calls | **Not performed.** The official simulation portal also requires ERAD credentials; R4C has not received a tenant’s credentialed authorization. |
| XML, QR, CSR, stamp, hash-chain implementation | **Excluded pending a separate explicit implementation authorization** and authenticated official API/SDK documentation. |
| Payments, escrow movement, ledger, collections, contracts | **Excluded.** Compliance records are not transaction-processing records. |
| Tenant ownership | **Required from the first schema version.** A KYNOX-shared CSID or shared tenant secret is prohibited. |

## 2. Verified external technical shape

A ZATCA Electronic Invoice Generation Solution (EGS) uses a Cryptographic Stamp Identifier (CSID) associated with its signing key pair. The security standard says a certificate is unique to each taxpayer EGS and requires a PKCS CSR signed as proof of possession. It also requires protection of the signing key and states that keys must be non-exportable. XML uses XAdES; a PDF/A-3 rendering embeds the compliant XML and uses PAdES. [4]

The Fatoora manual identifies onboarding/compliance/production-CSID operations and Reporting/Clearance operations, separately for production and simulation. It says production and simulation onboard devices independently. The architecture therefore must retain both **environment** and **EGS identity**, rather than treating a tenant as having one undifferentiated credential. [2]

| Verified concept | Architectural treatment |
| --- | --- |
| Tenant/E​​GS-scoped CSID | Tenant-scoped credential record plus EGS/device identifier; never a global platform credential. |
| CSR and signing key | Only opaque external-secret references and lifecycle metadata in R4C. No readable private-key column. |
| UUID, invoice hash, previous-invoice hash, stamp | Immutable invoice identity and security-result fields. Values are recorded only when a future approved issuer/stamper produces them. |
| Standard vs Simplified workflow | `invoiceType` retained as `STANDARD` or `SIMPLIFIED`; submission operation retains `CLEARANCE` or `REPORTING` only when the official implementation determines the route. |
| XML/PDF-A-3 artifact | Immutable existing `DocumentVersion` reference plus checksum; no raw XML payload in mutable audit metadata. |
| Authority response | Immutable submission attempt with response artifact/reference, normalized authority outcome, and raw-response reference. |

## 3. Proposed additive ZATCA domain model

The following is a **design**, not a migration. Its relationship shape is derived from R4C’s current `Tenant → Project → Reservation → PaymentPlan → PaymentPlanInstallment` hierarchy, its immutable `UnitPriceRevision` lineage, its `DocumentVersion` artifact store, and tenant-scoped `AuditEvent` model.

### 3.1 `TaxInvoice`

`TaxInvoice` is the commercial source-of-truth record for one invoice representation. It is not a ledger entry and cannot initiate collection.

| Field group | Proposed fields | Constraint / rationale |
| --- | --- | --- |
| Ownership and source | `id`, `tenantId`, `projectId`, `reservationId`, `paymentPlanId`, `paymentPlanInstallmentId?` | `tenantId`, `projectId`, and `reservationId` are required. `paymentPlanInstallmentId` is nullable because R4C currently has no approved payment-due or collection event that determines an invoiceable installment. |
| Commercial lineage | `sourcePriceRevisionId`, `reservationAmountSnapshotMinor`, `currency` | Copy the source Reservation/UnitPriceRevision lineage at creation; never recompute from a later price revision. |
| Regulatory category | `invoiceType` (`STANDARD` or `SIMPLIFIED`), `documentKind` (`INVOICE`, `CREDIT_NOTE`, `DEBIT_NOTE`) | Categories align with the ZATCA manuals’ standard/simplified and invoice/credit/debit terminology. [1] [2] |
| Generated identity | `uuid?`, `invoiceHash?`, `previousInvoiceHash?`, `cryptographicStamp?`, `issueAt?` | Null until a future approved issuer/stamper produces authoritative values. Fields become immutable after issuance. |
| Artifact integrity | `generatedDocumentVersionId?`, `artifactChecksumSha256?`, `renderingDocumentVersionId?` | Reuse existing object-storage/document versioning. The document reference must never be overwritten; replacement is a new version/record with explicit lineage. |
| Lifecycle | `status`, `voidReason?`, `createdAt`, `issuedAt?`, `supersededAt?` | Status vocabulary is an R4C workflow choice to be fixed in the implementation decision; it cannot be presented as ZATCA protocol vocabulary. |

`TaxInvoice` must have composite tenant-safe foreign keys wherever the referenced R4C model exposes `[id, tenantId]`. It should never derive authority identity or invoice tax fields from a Reservation alone; an implementation gate must define approved invoice-party and tax data sources after reviewing the official Data Dictionary. [3]

### 3.2 `ZatcaSubmission`

`ZatcaSubmission` is an append-only evidence record for one outbound integration attempt. A retry creates a new record; it does not replace an earlier authority response.

| Field group | Proposed fields | Constraint / rationale |
| --- | --- | --- |
| Ownership and parent | `id`, `tenantId`, `taxInvoiceId`, `credentialId`, `attemptNumber` | Scoped to tenant, invoice, and the exact credential/EGS used. |
| Environment and purpose | `environment` (`SIMULATION` or `PRODUCTION`), `operation` (`COMPLIANCE`, `REPORTING`, `CLEARANCE`, `CSID_ISSUANCE`, `CSID_RENEWAL`) | Names map to operations named in the official manuals; the final allowed combinations remain API-specification controlled. [1] [2] |
| Request evidence | `requestDocumentVersionId?`, `requestChecksumSha256?`, `submittedAt?`, `externalRequestId?` | Retain evidence through immutable document artifacts/references rather than raw request bodies in logs. |
| Authority result | `authorityOutcome`, `authorityCode?`, `authorityMessage?`, `responseDocumentVersionId?`, `respondedAt?` | Preserve original response evidence. A normalized field is for R4C workflow only and cannot erase the authority payload. |
| Delivery result | `transportStatus`, `failureCategory?`, `createdAt` | Separates authority rejection/warning from network, credential, or internal delivery failure. |

### 3.3 `ZatcaCredential`

`ZatcaCredential` models tenant-controlled EGS credential lifecycle, not a shared service credential. It stores no private key and no plaintext password, OTP, or client secret.

| Field group | Proposed fields | Constraint / rationale |
| --- | --- | --- |
| Scope | `id`, `tenantId`, `environment`, `egsExternalReference`, `vatRegistrationReference?` | A unique tenant/environment/EGS constraint; simulation and production cannot share a record. |
| Certificate metadata | `certificateSerialNumber?`, `certificateSubjectSummary?`, `issuedAt?`, `expiresAt?`, `revokedAt?`, `status` | Lifecycle metadata only. The certificate identity is separately auditable from secret material. |
| Secret boundary | `secretProvider`, `secretReference`, `keyReference?` | Opaque reference to a tenant-isolated secret-management system. R4C currently has no verified tenant-secret-store abstraction; an implementation must introduce one rather than storing a readable credential in Prisma. |
| Provenance | `onboardedById?`, `lastVerifiedAt?`, `createdAt`, `updatedAt` | Records operational stewardship, not ERAD credentials or OTPs. |

> **Security gate:** The ZATCA security standard requires private-key protection and non-exportability. Any implementation that stores a signing private key in a normal application database column, source-controlled configuration, audit metadata, or log is out of scope and rejected by this design. [4]

## 4. Proposed internal capability boundary

No permissions are implemented by this document. If a later approved scaffold needs protected operations, it should use source-derived capabilities such as `compliance:zatca:invoice:view`, `compliance:zatca:invoice:prepare`, `compliance:zatca:credential:view-metadata`, and `compliance:zatca:credential:manage-metadata`. Any operation that causes issuance, credential onboarding, or submission needs a separate approval and explicit tenant authority check. These are R4C application capabilities, not claims about a ZATCA role model.

## 5. Middleware assessment — build versus buy

A middleware route is commercially available. For example, AIN Technologies states that its BizMagnet API accepts structured invoice data and offers UBL 2.1 generation, UUID/cryptographic signing, QR generation, and Fatoora reporting/clearance connectivity. These are vendor claims, not proof of ZATCA certification, data residency, security posture, or suitability. [5]

| Dimension | Raw integration in R4C | Middleware / API-as-a-service | Decision status |
| --- | --- | --- | --- |
| Control | R4C owns XML, keys, sequencing, integration behavior, and audit semantics. | Provider owns or materially influences compliance transformation and operational behavior. | **Open operator decision** |
| Delivery effort | Requires verified XML/Data Dictionary mapping, signing/key-management architecture, certificate lifecycle, sandbox testing, error handling, and ongoing spec monitoring. | May reduce the first delivery scope if the provider supports R4C’s tenant and invoice use case. | **Open operator decision** |
| Security and tenancy | R4C must design secure non-exportable key handling and tenant isolation. | Requires due diligence on per-tenant credentials, private-key custody, data location, breach terms, audit export, and offboarding. | **Open operator decision** |
| Compliance accountability | R4C retains product accountability and must maintain changes. | A provider can supply capability but does not remove R4C/tenant compliance obligations. | **Open operator decision** |
| Portability | Highest control but highest migration/maintenance burden. | Requires contractual data export, artifact portability, and clear exit terms. | **Open operator decision** |

## 6. Sandbox and implementation decision

The public Developer Portal manual documents a developer-oriented integration sandbox, but the official Fatoora Simulation Portal manual requires ERAD taxpayer credentials. R4C has no tenant-provided ERAD credential and has not created an account or made a call. Accordingly, **sandbox implementation readiness is not established** under this task’s requirement to confirm access without a real taxpayer credential. [1] [2]

The next possible technical step is a separately approved, tenant-authorized simulation onboarding proof using official authenticated documentation and a real tenant’s authorized ERAD/Fatoora Simulation access. It must start with a credential-handling and secret-management design review. It must not use production endpoints or process real customer data.

## References

[1]: https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/DEVELOPER-PORTAL-MANUAL.pdf "ZATCA Developer Portal Manual v3"
[2]: https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/Fatoora_Portal_User_Manual_English.pdf "ZATCA Fatoora Portal User Manual v3"
[3]: https://zatca.gov.sa/en/E-Invoicing/SystemsDevelopers/Pages/E-Invoice-specifications.aspx "ZATCA E-Invoice Specifications"
[4]: https://zatca.gov.sa/en/E-Invoicing/SystemsDevelopers/Pages/Security-Requirements.aspx "ZATCA Security Requirements"
[5]: https://aintechnologies.com/zatca-e-invoicing/zatca-api-as-a-service "AIN Technologies BizMagnet ZATCA API as a Service"
