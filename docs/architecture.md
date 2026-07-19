# Architecture

## Monorepo

- `apps/web`: Next.js web application
- `apps/api`: NestJS API and domain services
- `apps/bim-worker`: Python IFC processing service
- `packages/contracts`: shared API schemas and domain types
- `packages/ui`: reusable design-system components

## Runtime flow

1. Web requests a signed upload URL from the API.
2. IFC is uploaded to MinIO/S3 without passing through the API process.
3. API records a document version and queues a BIM-processing job in BullMQ.
4. BIM worker validates the IFC schema and extracts spatial structure, types, quantities, properties, and geometry metadata.
5. API persists normalized BIM records in PostgreSQL.
6. Web viewer loads authorized model artifacts and lets users link elements to WBS activities.
7. Approved progress updates roll up through WBS and portfolio dashboards.

## Core bounded contexts

Identity & Access; Tenancy; Portfolio & Projects; WBS & Scheduling; Documents & Design Control; BIM; Workflow & Approvals; Progress; Notifications; Audit & Reporting.

## Architecture rules

- Tenant ID is mandatory on tenant-owned records and enforced in service/repository policies.
- Business transitions belong in domain services, not controllers or UI code.
- File metadata lives in PostgreSQL; file bodies live in object storage.
- Versions are immutable. Corrections create a new version.
- BIM processing is asynchronous, idempotent, observable, and retry-safe.
- All approval, version, permission, and progress changes create append-only audit events.
- APIs are versioned and documented with OpenAPI.
