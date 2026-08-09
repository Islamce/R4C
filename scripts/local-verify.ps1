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
  Write-Host "Checking ${Name}: $Url"
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
if (-not (Test-Path '.env')) { throw '.env is required. Run scripts/local-setup.ps1 first.' }

$nodeMajor = [int]((node -p "process.versions.node.split('.')[0]").Trim())
if ($nodeMajor -lt 22) { throw "Node.js 22+ is required; found $(node --version)." }

Get-Content '.env' | ForEach-Object {
  if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2], 'Process')
  }
}

function Test-HttpEndpointReady {
  param([string]$Url)
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
  } catch {
    return $false
  }
}

function Start-R4cRuntimeIfNeeded {
  param([string]$WebUrl, [string]$ApiUrl)
  if ((Test-HttpEndpointReady $WebUrl) -and (Test-HttpEndpointReady $ApiUrl)) {
    Write-Host 'Web and API runtime are already ready.'
    return
  }

  $pnpmCommand = (Get-Command pnpm.cmd -ErrorAction Stop).Source
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $stdout = Join-Path $env:TEMP "r4c-local-dev-$stamp.stdout.log"
  $stderr = Join-Path $env:TEMP "r4c-local-dev-$stamp.stderr.log"
  $runtime = Start-Process -FilePath $env:ComSpec `
    -ArgumentList @('/d', '/s', '/c', "$pnpmCommand local:dev") `
    -WorkingDirectory (Get-Location).Path `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr `
    -PassThru

  Write-Host "Started R4C runtime process $($runtime.Id). Logs: $stdout and $stderr"
  for ($i = 1; $i -le 45; $i++) {
    if ($runtime.HasExited) {
      throw "R4C runtime exited with code $($runtime.ExitCode). Inspect $stdout and $stderr."
    }
    if ((Test-HttpEndpointReady $WebUrl) -and (Test-HttpEndpointReady $ApiUrl)) {
      Write-Host 'Web and API runtime are ready.'
      return
    }
    Start-Sleep -Seconds 2
  }
  throw "R4C runtime did not become ready. Inspect $stdout and $stderr."
}

Invoke-RequiredCommand 'Docker Compose status' { docker compose ps }
Invoke-RequiredCommand 'PostgreSQL readiness' { docker compose exec -T postgres pg_isready -U r4c -d r4c }
Invoke-RequiredCommand 'Redis readiness' { docker compose exec -T redis redis-cli ping }
Test-HttpEndpoint 'BIM worker readiness' 'http://127.0.0.1:8000/health'
Invoke-RequiredCommand 'Frozen dependency installation' { pnpm install --frozen-lockfile }
Invoke-RequiredCommand 'Prisma schema validation' { pnpm --filter @r4c/api prisma:validate }
Invoke-RequiredCommand 'Prisma client generation' { pnpm --filter @r4c/api prisma:generate }
Invoke-RequiredCommand 'Lint' { pnpm lint }
Invoke-RequiredCommand 'Typecheck' { pnpm typecheck }
Invoke-RequiredCommand 'Standalone tests' { pnpm test }
$runtimeNodeEnv = $env:NODE_ENV
try {
  $env:NODE_ENV = 'production'
  Invoke-RequiredCommand 'Production build' { pnpm build }
} finally {
  $env:NODE_ENV = $runtimeNodeEnv
}

$webPort = if ($env:WEB_PORT) { $env:WEB_PORT } else { '3000' }
$apiPort = if ($env:API_PORT) { $env:API_PORT } else { '4000' }
$webUrl = "http://127.0.0.1:$webPort/login"
$apiUrl = "http://127.0.0.1:$apiPort/api/v1/health/ready"
Start-R4cRuntimeIfNeeded $webUrl $apiUrl
Test-HttpEndpoint 'Web application' $webUrl
Test-HttpEndpoint 'API readiness' $apiUrl
Test-HttpEndpoint 'MinIO readiness' 'http://127.0.0.1:9000/minio/health/ready'
Invoke-RequiredCommand 'BIM Local UAT journey' { pnpm --filter @r4c/web test:bim-local-uat }

Write-Host "`nAutomated Windows local acceptance checks passed."
Write-Host 'Frontend business journeys are intentionally not auto-discovered by pnpm test.'
Write-Host 'Complete the governed E2E/manual journeys in docs/POST-MERGE-GOVERNANCE-AND-LOCAL-UAT.md before approving Local UAT.'
