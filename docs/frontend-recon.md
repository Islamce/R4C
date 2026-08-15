# Frontend reconnaissance

## Evidence and baseline

R4C Web is the verified `r4c-web` module at `apps/web`. It uses Next.js 15.5.x App Router, React 19.1, TypeScript 5.8, and a standalone production output. Routes are filesystem routes under `app/`; authenticated screens share `app/(authenticated)/layout.tsx` and `AppShell`.

Server boundaries are explicit. Server route handlers own cookies and proxy requests to the Nest API. Client components call same-origin `/api/*` endpoints through `clientApi`; bearer tokens never enter browser component state. The session route returns a browser-safe user with `permissions[]`, tenant identity, display name, and legacy role label. Authorization decisions in the commercial UI use only `permissions[]`.

State is component-local React state (`useState`, `useEffect`, `useMemo`, `useCallback`); there is no global client store. The authenticated shell restores or rotates the secure HTTP-only session via `server-session.ts`. The bounded backend proxy allow-list is the browser-to-API boundary.

The shared i18n provider loads English or Arabic dictionaries from the locale cookie, sets document direction, and now composes commercial messages the same way it composes progress messages. CSS uses logical inline properties for RTL. Existing state primitives provide loading, error, and empty states.

## Existing reusable surface

- `AppShell`: navigation, session identity, tenant context, language switch, logout.
- `I18nProvider`: one English/Arabic translation system and LTR/RTL direction.
- `clientApi`: same-origin JSON client with normalized API errors.
- `StatePrimitives`: reusable loading, error, and empty states.
- `CommercialInventory`: existing authenticated administration for hierarchy and Units.

The `/commercial` route previously rendered only `CommercialInventory`. This change wraps it in a permission-driven operator workspace and still renders the administration component for `commercial:manage`. No administration route or public contract was renamed.

## Testing and hosting

Static source contracts use Node's test runner. Runtime journeys use seeded API/Web processes and explicit environment variables. The new commercial contract test covers capability-only rendering, proxy boundaries, shared English/Arabic dictionaries, and RTL logical CSS; the existing C03/C04 runtime suites cover real lifecycle, concurrency, price snapshot, and tenant isolation when PostgreSQL and Redis are supplied.

Hostinger adaptations remain intact: `next.config.ts` uses `output: "standalone"`; the root build copies `.next/static` into the standalone tree; `hostinger-web-entry.cjs` provides a managed-hosting web entry; the API uses the Prisma JavaScript PostgreSQL adapter. No filesystem persistence was added.

## Frozen code and focused candidates

BIM, the BIM worker/routes/viewer, cost control, progress, and Development Intelligence behavior are frozen for this task and were not edited. Evidence-backed commercial candidates were: duplicated browser request setup, scattered permission checks, payment-plan read/manage coupling, privileged translation reads, and inconsistent Lead access checks. Their decisions are recorded in `commercial-refactoring-plan.md`.
