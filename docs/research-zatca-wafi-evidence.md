# ZATCA and Wafi Evidence Log

> Research record only. It is not tax or legal advice and does not authorize production integration.

## ZATCA primary-source findings — 14 August 2026

| Topic | Verified finding | Source |
| --- | --- | --- |
| Developer tooling | The Developer Portal provides an offline SDK for XML and QR validation, a portal validator, and an Integration Sandbox. | [Developer Portal Manual v3](https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/DEVELOPER-PORTAL-MANUAL.pdf), pp. 5–6 |
| Sandbox scope | The Integration Sandbox supports test onboarding, test Reporting, and test Clearance; it can issue test Compliance CSID and test Production CSID. | [Developer Portal Manual v3](https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/DEVELOPER-PORTAL-MANUAL.pdf), pp. 5–6 |
| Sandbox access | Sandbox page and API documentation require a registered/logged-in Developer Portal user. The manual says sandbox VAT-registration-number inputs may be dummy values, while official submission requires taxpayer Taxation Portal/ERAD SSO credentials. Thus it is publicly documented as usable for technical integration testing without a registered taxpayer, but it is not anonymous and actual portal-account availability still needs operator-created account confirmation. | [Developer Portal Manual v3](https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/DEVELOPER-PORTAL-MANUAL.pdf), pp. 11–13, 21–23 |
| Onboarding sequence | Test Compliance CSID needs a signed test CSR and OTP; a test Production CSID requires the preceding test Compliance CSID and completed compliance checks. | [Developer Portal Manual v3](https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/DEVELOPER-PORTAL-MANUAL.pdf), pp. 23–27 |
| Document channels | Test Standard documents use Clearance (or a specified Reporting variant in sandbox); test Simplified documents use Reporting. | [Developer Portal Manual v3](https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/DEVELOPER-PORTAL-MANUAL.pdf), p. 6 |
| Controlling technical standards | ZATCA’s current E-Invoice Specifications page identifies the 19 May 2023 Electronic Invoice Data Dictionary and Electronic Invoice XML Implementation Standard as the sources for data attributes and XML syntax/business content. | [ZATCA E-Invoice Specifications](https://zatca.gov.sa/en/E-Invoicing/SystemsDevelopers/Pages/E-Invoice-specifications.aspx) |

## Evidence still to collect

1. Official XML and security-standard clauses for the exact UUID, invoice hash, previous-invoice hash, cryptographic-stamp, and rendering requirements.
2. Current official ZATCA sandbox/account-access page or a live account-free test confirmation. No portal account has been created or used.
3. Official REGA/Wafi material that states actual interface/readiness prerequisites and bank/escrow separation.
4. Middleware provider evidence, kept separate from government-source facts.

## Boundary

No ZATCA XML generation, CSR creation, OTP use, credential creation, sandbox API call, production submission, Wafi API call, payment collection, escrow movement, contract generation, or finance workflow has been performed.

## ZATCA security-standard findings — 14 August 2026

| Topic | Verified finding | Source |
| --- | --- | --- |
| Security source | ZATCA identifies the 19 May 2023 Security Features Implementation Standards as the controlling security-requirements document. | [ZATCA Security Requirements](https://zatca.gov.sa/en/E-Invoicing/SystemsDevelopers/Pages/Security-Requirements.aspx) |
| Credential scope | A Cryptographic Stamp Identifier is a digital certificate associated with the signing key pair and identifies the EGS; the standard says a unique certificate is issued to each taxpayer EGS. | [Security Features Implementation Standards v1.2](https://zatca.gov.sa/ar/E-Invoicing/SystemsDevelopers/Documents/20230519_ZATCA_Electronic_Invoice_Security_Features_Implementation_Standards_vF.pdf), pp. 4, 10–11 |
| Key/CSR requirements | The EGS must generate a PKCS CSR containing at least certificate CN and public key, signed as proof of possession. The standard requires key protection and non-exportability; key material therefore cannot be treated as ordinary application data. | [Security Features Implementation Standards v1.2](https://zatca.gov.sa/ar/E-Invoicing/SystemsDevelopers/Documents/20230519_ZATCA_Electronic_Invoice_Security_Features_Implementation_Standards_vF.pdf), pp. 10–11 |
| Format and signatures | XML invoices require XAdES; PDF/A-3 invoices with embedded compliant XML require PAdES. For XML, the signature covers the XML other than the QR-code data element; the PDF/A-3 representation embeds the XML invoice. | [Security Features Implementation Standards v1.2](https://zatca.gov.sa/ar/E-Invoicing/SystemsDevelopers/Documents/20230519_ZATCA_Electronic_Invoice_Security_Features_Implementation_Standards_vF.pdf), p. 12 |
| Algorithms | The standard specifies SHA-256, ECDSA, and 256-bit key length. | [Security Features Implementation Standards v1.2](https://zatca.gov.sa/ar/E-Invoicing/SystemsDevelopers/Documents/20230519_ZATCA_Electronic_Invoice_Security_Features_Implementation_Standards_vF.pdf), p. 13 |
| Chain and authentication | The standard includes a previous-invoice-hash section and states EGS authentication uses OAuth 2 Basic Authentication, with certificate as client ID and the supplied secret as client secret. Exact implementation belongs to future approved XML/submission work. | [Security Features Implementation Standards v1.2](https://zatca.gov.sa/ar/E-Invoicing/SystemsDevelopers/Documents/20230519_ZATCA_Electronic_Invoice_Security_Features_Implementation_Standards_vF.pdf), contents and p. 3 |

## Architecture implication

The R4C design can safely model a tenant-scoped credential *reference and metadata*, credential lifecycle, immutable invoice lineage, generated-artifact reference, submission attempts, and authority outcomes. It must not store an application-readable private signing key, implement cryptographic stamping, construct XML, submit to ZATCA, or claim compliance unless a subsequent explicitly authorized technical integration step uses verified SDK/API specifications and a suitable tenant-controlled secret-management boundary.


## REGA/Wafi primary-source findings — 14 August 2026

| Topic | Verified finding | Source |
| --- | --- | --- |
| Platform role | REGA describes the Off-Plan Sales and Lease platform as enabling qualification requests, necessary licences, and post-licensing services for off-plan projects under REGA supervision. | [REGA Off-Plan Sales and Lease](https://rega.gov.sa/en/rega-services/platforms/wafi-off-plan-sales-and-lease/) |
| Published access surface | The public REGA page identifies a website service channel, program services, developer support, qualification and licences. It does not publish a developer API, API authentication scheme, or sandbox in the material reviewed. | [REGA Off-Plan Sales and Lease](https://rega.gov.sa/en/rega-services/platforms/wafi-off-plan-sales-and-lease/) |
| Licensing input evidence | The implementing regulations list project feasibility inputs, estimated financial/construction/marketing data, delivery schedule, expected funding sources, permits, and subdivision information for relevant projects. | [REGA Implementing Regulations](https://rega.gov.sa/en/laws-and-decisions/regulations-and-by-laws/regulations/implementing-regulations-of-the-off-plan-sale-and-lease-of-real-estate-projects-law/), Article 11 |
| Escrow/bank separation | The regulations prescribe withdrawal requests by the developer to the bank, with consulting-firm and chartered-accountant approval; requests may use secure technical means. This establishes a bank/escrow integration surface distinct from any REGA/Wafi submission layer. | [REGA Implementing Regulations](https://rega.gov.sa/en/laws-and-decisions/regulations-and-by-laws/regulations/implementing-regulations-of-the-off-plan-sale-and-lease-of-real-estate-projects-law/), Article 27 |
| Regulator controls | The regulations describe REGA-authorized withdrawal cases and reports/approvals; these are regulated business processes, not public API specifications. | [REGA Implementing Regulations](https://rega.gov.sa/en/laws-and-decisions/regulations-and-by-laws/regulations/implementing-regulations-of-the-off-plan-sale-and-lease-of-real-estate-projects-law/), Articles 28–31 |

## Middleware-market evidence — non-government source

| Candidate | Stated offer | Assessment boundary |
| --- | --- | --- |
| AIN Technologies / BizMagnet ZATCA API | Claims API invoice submission, UBL 2.1 generation, UUID/cryptographic signing, QR generation, and Fatoora clearance/reporting connectivity. | This is a provider marketing claim, not ZATCA certification or regulatory evidence. It is sufficient only to establish that a middleware delivery model is commercially available and needs vendor due diligence. [Provider page](https://aintechnologies.com/zatca-e-invoicing/zatca-api-as-a-service) |

## Wafi readiness conclusion from public evidence

The reviewed public REGA material does not establish an available Wafi developer API or sandbox. The appropriate current state is interface-only: preserve tenant/project references, submission category and status, payload/artifact references, regulatory response fields supplied by a future documented interface, and audit metadata. Do not invent endpoint, credential, request-field, bank, or approval semantics. A real registered developer/project-license context and the authoritative Wafi onboarding/API material are business preconditions for any working integration.


## Fatoora Portal User Manual findings — 14 August 2026

| Topic | Verified finding | Source |
| --- | --- | --- |
| Official manual | ZATCA’s educational library identifies the Fatoora Portal User Manual as the guide for onboarding and integrating e-invoicing solutions. | [ZATCA Educational Library](https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Pages/default.aspx) |
| Production portal credentials | The production Fatoora Portal requires ERAD credentials: TIN or ZATCA-registered email and password. It is distinct from the Developer Portal. | [Fatoora Portal User Manual v3](https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/Fatoora_Portal_User_Manual_English.pdf), p. 4 |
| OTP | Production and simulation portals generate OTPs for EGS onboarding/renewal; OTPs are valid for one hour. | [Fatoora Portal User Manual v3](https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/Fatoora_Portal_User_Manual_English.pdf), pp. 6–9, 19–22 |
| Simulation prerequisite | The official Fatoora Simulation Portal also requires ERAD credentials (TIN or registered email/password), with possible reCAPTCHA. It is not an unauthenticated sandbox. | [Fatoora Portal User Manual v3](https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/Fatoora_Portal_User_Manual_English.pdf), pp. 17–20 |
| Environment separation | Production and simulation are independent environments; devices are onboarded independently. The manual lists separate production and simulation API endpoint families. | [Fatoora Portal User Manual v3](https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/Fatoora_Portal_User_Manual_English.pdf), pp. 23, 30–31 |
| API families | The manual enumerates onboarding/compliance/production-CSID routes and reporting/clearance routes for both production and simulation. Exact API request/response details remain in authenticated API documentation. | [Fatoora Portal User Manual v3](https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/Fatoora_Portal_User_Manual_English.pdf), pp. 30–31 |

## Revised sandbox decision

The official documents distinguish two routes: the Developer Portal integration sandbox, where test API documentation and test CSIDs are documented for registered Developer Portal users, and the Fatoora Simulation Portal, which explicitly requires ERAD taxpayer credentials. The requested criterion was access **without real taxpayer credentials**. Because the authoritative Fatoora Simulation manual requires ERAD credentials, and the API documentation is authenticated, no real sandbox API access has been proven available to R4C without a real taxpayer credential. Therefore this task remains at architecture/data/interface design only. No XML generation, CSR creation, OTP request, portal-account creation, sandbox call, or submission may be claimed or performed.

