# R4C — Real Estate Development Control Platform

R4C is a BIM-centered platform for governed real-estate development delivery, connecting projects, WBS, design documents, IFC models, approvals, progress, and executive visibility.

## MVP vertical slice

1. Create a project and WBS.
2. Upload an IFC2x3 or IFC4 model.
3. Process the model asynchronously.
4. View extracted BIM elements.
5. Link BIM elements to WBS activities.
6. Record physical progress.
7. Display portfolio and project dashboards.

## MVP capabilities

- Authentication, tenant-aware RBAC, and audit history
- Projects, WBS, tasks, workflow, and approvals
- Drawing/document upload with immutable version history
- BIM upload, validation, processing, viewing, and element extraction
- BIM-to-WBS linking and progress capture
- Email notifications and executive dashboards

## Deferred

SAP/Primavera integrations, Revit add-ins, digital-twin IoT, predictive AI, CRM/sales, full finance, full facilities management, mobile apps, and advanced time analytics.

## Architecture

- Web: Next.js + TypeScript + Tailwind CSS
- API: NestJS + TypeScript + Prisma
- BIM worker: Python + FastAPI + IfcOpenShell
- Data: PostgreSQL, Redis/BullMQ, MinIO/S3
- Local runtime: Docker Compose
- CI: GitHub Actions

See `docs/architecture.md`, `docs/mvp-scope.md`, and `docs/security.md`.
