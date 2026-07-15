param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$HostName = "0.0.0.0",
  [int]$Port = 8010,
  [string]$OdaFileConverterPath = "D:\ODA\ODAFileConverter\ODAFileConverter.exe",
  [switch]$Foreground
)

$ErrorActionPreference = "Stop"

function Test-PortListening {
  param([int]$LocalPort)
  $connection = Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  return $null -ne $connection
}

function Wait-PortListening {
  param(
    [int]$LocalPort,
    [int]$TimeoutSeconds = 30
  )
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    if (Test-PortListening -LocalPort $LocalPort) {
      return $true
    }
    Start-Sleep -Seconds 1
  } while ((Get-Date) -lt $deadline)
  return $false
}

$resolvedRoot = (Resolve-Path $ProjectRoot).Path
$pythonPath = Join-Path $resolvedRoot ".venv\Scripts\python.exe"
$logsDir = Join-Path $resolvedRoot "logs"
$stdoutPath = Join-Path $logsDir "api-$Port.out.log"
$stderrPath = Join-Path $logsDir "api-$Port.err.log"

if (-not (Test-Path -LiteralPath $pythonPath)) {
  throw "Python virtual environment was not found: $pythonPath. Install backend dependencies first."
}

New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

if (Test-Path -LiteralPath $OdaFileConverterPath) {
  $env:ODA_FILE_CONVERTER_PATH = $OdaFileConverterPath
}

if (Test-PortListening -LocalPort $Port) {
  Write-Host "API port $Port is already listening. Skip start."
  exit 0
}

$apiArgs = @(
  "-m",
  "uvicorn",
  "server.app.main:app",
  "--host",
  $HostName,
  "--port",
  [string]$Port
)

if ($Foreground) {
  Push-Location $resolvedRoot
  try {
    Write-Host "Starting API in foreground: http://$HostName`:$Port"
    & $pythonPath @apiArgs 1>> $stdoutPath 2>> $stderrPath
    exit $LASTEXITCODE
  } finally {
    Pop-Location
  }
}

Start-Process `
  -FilePath $pythonPath `
  -ArgumentList $apiArgs `
  -WorkingDirectory $resolvedRoot `
  -RedirectStandardOutput $stdoutPath `
  -RedirectStandardError $stderrPath `
  -WindowStyle Hidden

if (Wait-PortListening -LocalPort $Port -TimeoutSeconds 30) {
  Write-Host "API started: http://$HostName`:$Port"
  Write-Host "Logs: $stdoutPath / $stderrPath"
} else {
  throw "API port $Port was not detected after start. Check log: $stderrPath"
}
