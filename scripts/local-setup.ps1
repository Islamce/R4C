$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 22+ is required.' }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker Desktop is required.' }

$nodeMajor = [int]((node -p "process.versions.node.split('.')[0]").Trim())
if ($nodeMajor -lt 22) { throw "Node.js 22+ is required; found $(node --version)." }

docker compose version | Out-Null
corepack enable
corepack prepare pnpm@10.13.1 --activate

if (-not (Test-Path '.env')) {
  Copy-Item '.env.example' '.env'
  Write-Host 'Created .env from .env.example. Review passwords before shared use.'
}

Get-Content '.env' | ForEach-Object {
  if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2], 'Process')
  }
}

docker compose up -d postgres redis minio

Write-Host 'Waiting for PostgreSQL...'
$ready = $false
for ($i = 1; $i -le 30; $i++) {
  docker compose exec -T postgres pg_isready -U r4c -d r4c *> $null
  if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  Start-Sleep -Seconds 2
}
if (-not $ready) {
  docker compose ps
  throw 'PostgreSQL did not become ready.'
}

pnpm install --frozen-lockfile
pnpm --filter @r4c/api prisma:generate
pnpm --filter @r4c/api prisma:migrate:deploy
pnpm --filter @r4c/api seed
pnpm --filter @r4c/api seed:uat

$webPort = if ($env:WEB_PORT) { $env:WEB_PORT } else { '3000' }
$apiPort = if ($env:API_PORT) { $env:API_PORT } else { '4000' }
Write-Host ''
Write-Host 'R4C local environment is ready.'
Write-Host 'Run: pnpm local:dev'
Write-Host "Web: http://localhost:$webPort"
Write-Host "API: http://localhost:$apiPort/api/v1"
Write-Host 'MinIO console: http://localhost:9001'
