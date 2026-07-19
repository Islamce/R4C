# MVP Scope

## Product objective

Provide one controlled, auditable flow from development setup and design coordination through BIM-linked progress reporting.

## In scope

- Multi-company-ready tenant boundary with strict tenant isolation
- Users, roles, project memberships, and permission policies
- Projects, phases, WBS, tasks, milestones, and status workflow
- Design deliverables and drawings: PDF, DWG metadata, IFC
- Immutable document versions, review comments, approvals, and distribution log
- IFC2x3/IFC4 upload, validation, asynchronous processing, element extraction, and 3D viewing
- Mapping BIM elements to WBS activities
- Planned versus actual physical progress
- Notifications, audit logging, operational dashboards, and executive portfolio summary
- Arabic/English-ready user interface with RTL support

## Workflow baseline

Draft → Assigned → In Progress → Submitted → Under Review → Returned/Rework → Approved → Completed.

All transitions must be permission-checked and written to the append-only audit log.

## Explicitly deferred

- Direct SAP, Primavera P6, Autodesk Construction Cloud, and Procore integration
- Revit/AutoCAD plugins
- Full accounting, procurement, CRM, sales, and facilities management
- IoT/digital-twin operations
- Predictive AI and automated planning
- Native mobile applications
- Advanced productivity/time analytics
