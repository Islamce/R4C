# R4C Local Development Runbook

This runbook starts the complete R4C development environment on a personal computer while keeping infrastructure data in Docker volumes.

## Requirements

- Git
- Docker Desktop (Windows/macOS) or Docker Engine with Compose v2 (Linux)
- Node.js 22 or later
- At least 8 GB RAM available; 16 GB recommended for BIM processing
- Ports 3000, 4000, 5432, 6379, 8000, 9000, and 9001 available

## First-time setup

```bash
git clone https://github.com/Islamce/R4C.git
cd R4C
```

### Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-setup.ps1
pnpm local:dev
```

### macOS or Linux

```bash
bash scripts/local-setup.sh
pnpm local:dev
```

The setup script validates Node and Docker, activates pnpm 10.13.1, creates `.env` when missing, starts PostgreSQL/Redis/MinIO, installs locked dependencies, generates Prisma, applies migrations, and loads bootstrap plus Alomran UAT seed data.

## Access points

| Service | Address |
|---|---|
| Web application | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |
| MinIO console | http://localhost:9001 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

Credentials are controlled by the local `.env`. Change seed and MinIO passwords before using shared or real data.

## Daily commands

```bash
pnpm local:services  # start infrastructure
pnpm local:dev       # start application services
pnpm local:stop      # stop infrastructure, preserve data
```

## Reset local data

```bash
pnpm local:reset
```

This deletes Docker volumes and all local PostgreSQL, Redis, and MinIO data. Run the setup script again afterward.

## Verification

```bash
docker compose ps
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Confirm that infrastructure containers are healthy/running, the web page opens, login succeeds with a seed account configured in `.env`, and the projects, 5D dashboard, progress workspace, tenant resolution, uploads, and approval journeys are reachable.

## Local tenant testing

The default local tenant is controlled by `TENANT_DEFAULT_CODE=ALOMRAN`. For subdomain simulation, add the following entry to the operating system hosts file:

```text
127.0.0.1 alomran.r4c.local
```

Then open `http://alomran.r4c.local:3000`. Administrator privileges are required to edit the hosts file.

## Troubleshooting

- Port conflict: stop the conflicting service or change the relevant port consistently in `.env` and Docker Compose.
- Database connection failure: run `docker compose ps` and confirm PostgreSQL is healthy.
- Dependency mismatch: confirm Node 22+ and run `corepack prepare pnpm@10.13.1 --activate`.
- Clean rebuild: run `pnpm local:reset`, then rerun the platform-specific setup script.
- BIM worker errors: confirm Python worker dependencies and port 8000; infrastructure and web/API can still be tested independently when BIM processing is not started.
