param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$HostName = "0.0.0.0",
  [int]$Port = 3010,
  [switch]$BuildIfMissing,
  [switch]$Foreground
)

$ErrorActionPreference = "Stop"

function Test-PortListening {
  param([int]$LocalPort)
  $connection = Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  return $null -ne $connection
}

$resolvedRoot = (Resolve-Path $ProjectRoot).Path
$webRoot = Join-Path $resolvedRoot "apps\web"
$nodePath = "node"
$nextCli = Join-Path $resolvedRoot "node_modules\next\dist\bin\next"
$buildIdPath = Join-Path $webRoot ".next\BUILD_ID"
$logsDir = Join-Path $resolvedRoot "logs"
$stdoutPath = Join-Path $logsDir "web-$Port.out.log"
$stderrPath = Join-Path $logsDir "web-$Port.err.log"

if (-not (Test-Path -LiteralPath $webRoot)) {
  throw "Web directory was not found: $webRoot"
}
if (-not (Test-Path -LiteralPath $nextCli)) {
  throw "Next.js CLI was not found: $nextCli. Run npm install in the project root first."
}

New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

if (Test-PortListening -LocalPort $Port) {
  Write-Host "Web port $Port is already listening. Skip start."
  exit 0
}

if ((-not (Test-Path -LiteralPath $buildIdPath)) -and $BuildIfMissing) {
  Push-Location $resolvedRoot
  try {
    Write-Host "Production build was not found. Running next build apps\web ..."
    & $nodePath $nextCli build "apps\web" 1>> (Join-Path $logsDir "web-build.out.log") 2>> (Join-Path $logsDir "web-build.err.log")
    if ($LASTEXITCODE -ne 0) {
      throw "Web build failed. Check logs\web-build.err.log"
    }
  } finally {
    Pop-Location
  }
}

if (-not (Test-Path -LiteralPath $buildIdPath)) {
  throw "Production build was not found: $buildIdPath. Run: node node_modules\next\dist\bin\next build apps\web"
}

$webArgs = @(
  $nextCli,
  "start",
  "--hostname",
  $HostName,
  "--port",
  [string]$Port
)

if ($Foreground) {
  Push-Location $webRoot
  try {
    Write-Host "Starting Web in foreground: http://$HostName`:$Port"
    & $nodePath @webArgs 1>> $stdoutPath 2>> $stderrPath
    exit $LASTEXITCODE
  } finally {
    Pop-Location
  }
}

Start-Process `
  -FilePath $nodePath `
  -ArgumentList $webArgs `
  -WorkingDirectory $webRoot `
  -RedirectStandardOutput $stdoutPath `
  -RedirectStandardError $stderrPath `
  -WindowStyle Hidden

Start-Sleep -Seconds 3
if (Test-PortListening -LocalPort $Port) {
  Write-Host "Web started: http://$HostName`:$Port"
  Write-Host "Logs: $stdoutPath / $stderrPath"
} else {
  throw "Web port $Port was not detected after start. Check log: $stderrPath"
}
