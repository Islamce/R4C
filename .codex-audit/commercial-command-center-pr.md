## What changed

- replaces the limited commercial page with linked executive, project/unit, title-transfer, and sales-operation dashboards
- adds the interactive 3D development hero and floor/unit layout controls
- fixes the Arabic/English switch across the commercial workspace, including RTL/LTR direction
- keeps the authenticated production workflow and the development-only preview separated

## Why

The prior commercial page did not provide the requested CRM, inventory, project tracking, executive analysis, or title-transfer experience. The preview also forced LTR and translated only the shared shell.

## Validation

- `npm run typecheck`
- `pnpm --filter @r4c/web test:commercial-workflow`
- `pnpm --filter @r4c/web build`
- browser QA in English and Arabic across Executive, Unit Control, and Title Transfer tabs
