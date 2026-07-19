# Delivery Roadmap

## Phase 0 — Foundation

Monorepo, CI, Docker development services, architecture decisions, security baseline, coding standards, environment validation.

## Phase 1 — Governed project core

Authentication, tenant-aware RBAC, companies, projects, project membership, WBS, tasks, workflow transitions, audit events.

## Phase 2 — Design and document control

Object storage, upload/versioning, deliverable register, distribution, comments, review and approval workflow, notifications.

## Phase 3 — BIM vertical slice

IFC upload, validation, processing jobs, spatial tree and elements, 3D viewer, element-to-WBS mapping.

## Phase 4 — Progress and dashboards

Progress submissions, evidence, approval, WBS rollups, project health and executive portfolio dashboard.

## MVP exit gates

- Critical workflow has API and end-to-end tests
- Tenant-isolation and authorization tests pass
- BIM processing is idempotent and handles invalid IFC safely
- Backup/restore drill is documented
- Production observability and alerting are active
- Security review has no unresolved critical/high findings
- Physical UAT is signed off
