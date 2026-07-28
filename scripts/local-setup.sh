#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v node >/dev/null || { echo "Node.js 22+ is required." >&2; exit 1; }
command -v docker >/dev/null || { echo "Docker Desktop/Engine is required." >&2; exit 1; }

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "Node.js 22+ is required; found $(node --version)." >&2
  exit 1
fi

docker compose version >/dev/null 2>&1 || { echo "Docker Compose v2 is required." >&2; exit 1; }

corepack enable
corepack prepare pnpm@10.13.1 --activate

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Review passwords before shared use."
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

docker compose up -d postgres redis minio

echo "Waiting for PostgreSQL..."
for attempt in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U r4c -d r4c >/dev/null 2>&1; then
    break
  fi
  if [ "$attempt" -eq 30 ]; then
    echo "PostgreSQL did not become ready." >&2
    docker compose ps
    exit 1
  fi
  sleep 2
done

pnpm install --frozen-lockfile
pnpm --filter @r4c/api prisma:generate
pnpm --filter @r4c/api prisma:migrate:deploy
pnpm --filter @r4c/api seed
pnpm --filter @r4c/api seed:uat

echo
echo "R4C local environment is ready."
echo "Run: pnpm local:dev"
echo "Web: http://localhost:${WEB_PORT:-3000}"
echo "API: http://localhost:${API_PORT:-4000}/api/v1"
echo "MinIO console: http://localhost:9001"
