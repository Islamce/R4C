$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))

function Invoke-RequiredCommand {
  param([string]$Name, [scriptblock]$Command)
  Write-Host "`n=== $Name ==="
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE." }
}

function Test-HttpEndpoint {
  param([string]$Name, [string]$Url)
  Write-Host "Checking $Name: $Url"
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 20
    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 400) {
      throw "$Name returned HTTP $($response.StatusCode)."
    }
  } catch {
    throw "$Name endpoint check failed: $($_.Exception.Message)"
  }
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 22+ is required.' }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker Desktop is required.' }
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { throw 'pnpm is required. Run scripts/local-setup.ps1 first.' }

$nodeMajor = [int]((node -p "process.versions.node.split('.')[0]").Trim())
if ($nodeMajor -lt 22) { throw "Node.js 22+ is required; found $(node --version)." }

Invoke-RequiredCommand 'Docker Compose services' { docker compose ps }
Invoke-RequiredCommand 'Frozen dependency installation' { pnpm install --frozen-lockfile }
Invoke-RequiredCommand 'Lint' { pnpm lint }
Invoke-RequiredCommand 'Typecheck' { pnpm typecheck }
Invoke-RequiredCommand 'Tests' { pnpm test }
Invoke-RequiredCommand 'Build' { pnpm build }

$webPort = if ($env:WEB_PORT) { $env:WEB_PORT } else { '3000' }
$apiPort = if ($env:API_PORT) { $env:API_PORT } else { '4000' }
Test-HttpEndpoint 'Web application' "http://127.0.0.1:$webPort/login"
Test-HttpEndpoint 'API readiness' "http://127.0.0.1:$apiPort/api/v1/health/ready"
Test-HttpEndpoint 'MinIO readiness' 'http://127.0.0.1:9000/minio/health/ready'

Write-Host "`nAutomated local acceptance checks passed."
Write-Host 'Complete the manual journeys in docs/POST-MERGE-GOVERNANCE-AND-LOCAL-UAT.md before approving local UAT.'
