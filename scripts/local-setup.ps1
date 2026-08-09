$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))

function Invoke-RequiredCommand {
  param([string]$Name, [scriptblock]$Command)
  Write-Host "`n=== $Name ==="
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE." }
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 22+ is required.' }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker Desktop is required.' }

$nodeMajor = [int]((node -p "process.versions.node.split('.')[0]").Trim())
if ($nodeMajor -lt 22) { throw "Node.js 22+ is required; found $(node --version)." }

Invoke-RequiredCommand 'Docker Compose validation' { docker compose version | Out-Null }
Invoke-RequiredCommand 'Corepack enablement' { corepack enable }
Invoke-RequiredCommand 'pnpm 10.13.1 activation' { corepack prepare pnpm@10.13.1 --activate }

if (-not (Test-Path '.env')) {
  Copy-Item '.env.example' '.env'
  Write-Host 'Created .env from .env.example. Review passwords before shared use.'
}

Get-Content '.env' | ForEach-Object {
  if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2], 'Process')
  }
}

Invoke-RequiredCommand 'Local infrastructure startup' { docker compose up -d postgres redis minio minio-init bim-worker }

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

Invoke-RequiredCommand 'Frozen dependency installation' { pnpm install --frozen-lockfile }
Invoke-RequiredCommand 'Prisma client generation' { pnpm --filter @r4c/api prisma:generate }
Invoke-RequiredCommand 'Database migration deployment' { pnpm --filter @r4c/api prisma:migrate:deploy }
Invoke-RequiredCommand 'Bootstrap seed' { pnpm --filter @r4c/api seed }
Invoke-RequiredCommand 'Alomran UAT seed' { pnpm --filter @r4c/api seed:uat }

$webPort = if ($env:WEB_PORT) { $env:WEB_PORT } else { '3000' }
$apiPort = if ($env:API_PORT) { $env:API_PORT } else { '4000' }
Write-Host ''
Write-Host 'R4C local environment is ready.'
Write-Host 'Run: pnpm local:dev'
Write-Host "Web: http://localhost:$webPort"
Write-Host "API: http://localhost:$apiPort/api/v1"
Write-Host 'MinIO console: http://localhost:9001'
Write-Host 'BIM worker: http://localhost:8000/health'
