# R4C Codex Test Commands

These commands are present in the recovered repository package scripts or documented local setup. Run them only after selecting and documenting one candidate SHA. No command in this file targets production.

| Purpose | Verified command |
| --- | --- |
| Install | `pnpm install --frozen-lockfile` |
| Workspace development | `pnpm dev` |
| Local services | `pnpm local:services` |
| Local setup | `pnpm local:setup` |
| Workspace lint | `pnpm lint` |
| Workspace typecheck | `pnpm typecheck` |
| Workspace tests | `pnpm test` |
| Production build | `pnpm build` |
| API build | `pnpm -C apps/api build` |
| API typecheck | `pnpm -C apps/api typecheck` |
| API regression suite | `pnpm -C apps/api test` |
| API HTTP E2E | `pnpm -C apps/api test:e2e` |
| Commercial C02 suite | `pnpm -C apps/api test:c02` |
| Customer/lead C03 suite | `pnpm -C apps/api test:c03` |
| i18n/holds/reservations C04 suite | `pnpm -C apps/api test:c04` |
| Auth/session suite | `pnpm -C apps/api test:auth-session` |
| Rate-limit suite | `pnpm -C apps/api test:rate-limit` |
| Seed verification | `pnpm -C apps/api test:seed` |
| Seeded synthetic UAT | `pnpm -C apps/api seed:uat` |
| Prisma validation | `pnpm -C apps/api prisma:validate` |
| Prisma client generation | `pnpm -C apps/api prisma:generate` |
| Approved migration deployment | `pnpm -C apps/api prisma:migrate:deploy` |
| Web typecheck | `pnpm -C apps/web typecheck` |
| Web frontend journey | `pnpm -C apps/web test:journey` |
| Web Commercial contract | `pnpm -C apps/web test:commercial-workflow` |
| Web cost dashboard | `pnpm -C apps/web test:cost-dashboard` |
| Web progress workspace | `pnpm -C apps/web test:progress-workspace` |
| Web UX loop closers | `pnpm -C apps/web test:ux-loop-closers` |
| Web BIM-local UAT | `pnpm -C apps/web test:bim-local-uat` |
| Git whitespace check | `git diff --check` |
| Windows governed local verification | `powershell -ExecutionPolicy Bypass -File scripts/local-verify.ps1` |

Backup/restore, rollback, two-tenant IDOR, and full portfolio-isolation procedures require the approved environment and are not represented by a single repository script. Do not invent a command or treat the transferred local evidence as deployed proof. The web script `test:commercial-workflow` currently names `test/commercial-workflow-contract.test.mjs`; verify that file exists on the selected candidate before running it.
