param(
  [int[]]$Ports = @(3010, 8010)
)

$ErrorActionPreference = "Stop"

$processIds = @()
foreach ($port in $Ports) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($connection in $connections) {
    if ($connection.OwningProcess -and ($processIds -notcontains $connection.OwningProcess)) {
      $processIds += $connection.OwningProcess
    }
  }
}

if ($processIds.Count -eq 0) {
  Write-Host "No listening frontend/backend process was found."
  exit 0
}

foreach ($processId in $processIds) {
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if ($null -eq $process) {
    continue
  }
  Write-Host "Stopping process $($process.ProcessName)($processId)"
  Stop-Process -Id $processId -Force
}

Write-Host "Stopped ports: $($Ports -join ', ')"
