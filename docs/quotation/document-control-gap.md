# R4C Quotation Document-Control Gap

**Scope:** buyer sales quotations on branch `feat/commercial-command-center-hardening`. This record describes the artifact that exists now and the document-generation capability that does **not** yet exist. It does not authorize infrastructure, provider, schema, or production changes.

## Current controlled artifact

| Concern | Current implementation | Evidence boundary |
|---|---|---|
| Artifact format | **Controlled HTML document preview**, rendered by the staff and buyer web experiences. | No PDF bytes, downloadable PDF file, or PDF storage object is produced. |
| Server response | `GET /quotations/:id/preview-document` returns `kind: "SYNTHETIC_HTML_DOCUMENT_PREVIEW"`, a serialized approved quotation snapshot, and a checksum. | This is a data response for an HTML preview, not a file-generation endpoint. |
| User-facing label | English: **Controlled document preview (HTML)**. Arabic: **معاينة المستند المحكومة (HTML)**. | The product must not call this artifact a PDF. |
| Evidence fields | Approved quotation snapshot, snapshot checksum, preview checksum, revision, customer decision evidence, and audit events. | These are application records; they are not a signed or immutable document-file archive. |
| Delivery | A synthetic UAT preview link may be generated after approval-to-send. | No live email, SMS, WhatsApp, dispatch status, delivered/viewed provider evidence, or legal signature is implemented. |

> **Control statement:** The current preview is suitable only for governed design/UAT inspection of an approved quotation snapshot. It is **not** a generated PDF, legal contract, e-signature workflow, reservation, sale, invoice, payment obligation, or customer communication channel.

## Why server-side PDF generation is deferred

The approved target is a Hostinger managed Node.js Web App with Neon PostgreSQL, Upstash Redis, and Cloudflare R2. The current repository and authorized provider evidence do not establish a supported headless-browser binary, native PDF-rendering dependency, queue worker, long-running worker process, or document-conversion service. A reliable Chromium-based renderer normally needs browser binaries, OS libraries, controlled memory/time limits, and a worker/queue execution boundary; none is presently verified for the managed deployment profile.

Accordingly, the implementation **does not** attempt to install Chromium, launch a headless browser, create a background worker, invoke a third-party document service, write a document to R2, or expose a file download. This avoids falsely claiming a durable PDF artifact or adding an unqualified hosting dependency. It also respects the current constraints: no VPS, no production mutation, no automatic background process, no live communication, and no deployment without explicit Founder G9 authorization.

## Future implementation gate

A future controlled PDF capability may be considered only after a separately authorized design supplies all of the following evidence.

| Gate | Required evidence | Status now |
|---|---|---|
| Rendering approach | A reviewed choice between a provider-supported rendering service, a pre-approved external document renderer, or a managed runtime with documented binary support. | **Not selected.** |
| Hostinger compatibility | Read-only provider confirmation of runtime limits, allowed binaries/dependencies, request time/memory limits, and any worker/queue support. | **Blocked: provider access not available in this session.** |
| Storage and retention | Approved R2 object naming, private access policy, retention/deletion policy, and an immutable linkage to quotation revision/checksum. | **Not designed.** |
| Security and privacy | Threat model for authorized staff access, buyer access, token handling, PII in document content, and audit events. | **Partial: quotation API controls exist; PDF-specific control is not designed.** |
| Rendering regression tests | Snapshot-to-document test, PDF MIME/content validation, Arabic/RTL visual inspection, and responsive print layout checks. | **Not implemented.** |
| Synthetic UAT | Disposable synthetic tenant and quotation validation, including download authorization and expired/superseded document behavior. | **Not run.** |
| Release authorization | Exact deployed SHA, migration status, runtime checks, static-asset evidence, and explicit Founder G9 authorization. | **Not available.** |

## Hosting qualification context

The hosting validation procedure requires exact deployed SHA, stable web/API health and readiness, migration state, external-service boundaries, a real Next.js static-asset check, synthetic UAT, and any authorized restart evidence before a deployment can be accepted. HTTP 200 alone is not sufficient. The current public health baseline does not prove document-rendering support, installed binaries, worker capability, or a PDF storage path.

## Explicit non-actions

The following remain out of scope for this increment: Chromium/Puppeteer/Playwright server rendering; persistent worker or queue deployment; PDF signing; customer e-signature; document email/SMS/WhatsApp dispatch; R2 document upload; legal-contract generation; buyer Flutter implementation; RFQ/procurement workflows; holds/reservations created from buyer acceptance; `prisma db push`; migrations against production; and production deployment.

## References

The source behavior is implemented in `apps/api/src/quotations/quotation.service.ts`, `apps/web/components/QuotationWorkspace.tsx`, and `apps/web/components/BuyerQuotationExperience.tsx`. The managed-hosting qualification requirements are recorded in the project deployment-validation guidance and must be satisfied in a private, authorized provider context before this gap can be closed.
