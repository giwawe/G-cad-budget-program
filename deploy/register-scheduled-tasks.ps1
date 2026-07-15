param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [ValidateSet("SYSTEM", "CurrentUser")]
  [string]$RunAs = "SYSTEM",
  [ValidateSet("Startup", "Logon")]
  [string]$TriggerType = "Startup",
  [string]$TaskPrefix = "CAD Budget",
  [int]$WebPort = 3010,
  [int]$ApiPort = 8010,
  [string]$OdaFileConverterPath = "D:\ODA\ODAFileConverter\ODAFileConverter.exe",
  [int]$WatchdogMinutes = 1,
  [switch]$CreateFirewallRules
)

$ErrorActionPreference = "Stop"

function Test-IsAdministrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = [Security.Principal.WindowsPrincipal]::new($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Quote-Argument {
  param([string]$Value)
  return '"' + ($Value -replace '"', '\"') + '"'
}

function New-TaskActionForScript {
  param(
    [string]$ScriptPath,
    [string[]]$ExtraArguments
  )
  $argumentParts = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    (Quote-Argument $ScriptPath)
  ) + $ExtraArguments
  return New-ScheduledTaskAction -Execute "powershell.exe" -Argument ($argumentParts -join " ")
}

function Ensure-FirewallRule {
  param(
    [string]$Name,
    [int]$Port
  )
  $existing = Get-NetFirewallRule -DisplayName $Name -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Host "Firewall rule already exists: $Name"
    return
  }
  New-NetFirewallRule -DisplayName $Name -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow | Out-Null
  Write-Host "Created firewall rule: $Name"
}

$resolvedRoot = (Resolve-Path $ProjectRoot).Path
$deployDir = Join-Path $resolvedRoot "deploy"
$apiScript = Join-Path $deployDir "start-api.ps1"
$webScript = Join-Path $deployDir "start-web.ps1"

if (-not (Test-Path -LiteralPath $apiScript)) {
  throw "Script was not found: $apiScript"
}
if (-not (Test-Path -LiteralPath $webScript)) {
  throw "Script was not found: $webScript"
}

$needsAdmin = ($RunAs -eq "SYSTEM") -or $CreateFirewallRules
if ($needsAdmin -and -not (Test-IsAdministrator)) {
  throw "Administrator PowerShell is required to register SYSTEM startup tasks or create firewall rules."
}

if ($RunAs -eq "SYSTEM") {
  $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
} else {
  $userId = "$env:USERDOMAIN\$env:USERNAME"
  $principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Highest
}

if ($TriggerType -eq "Startup") {
  $primaryTrigger = New-ScheduledTaskTrigger -AtStartup
} else {
  $primaryTrigger = New-ScheduledTaskTrigger -AtLogOn
}
$watchdogTrigger = New-ScheduledTaskTrigger `
  -Once `
  -At (Get-Date).Date `
  -RepetitionInterval (New-TimeSpan -Minutes $WatchdogMinutes) `
  -RepetitionDuration (New-TimeSpan -Days 3650)
$triggers = @($primaryTrigger, $watchdogTrigger)

$settings = New-ScheduledTaskSettingsSet `
  -MultipleInstances IgnoreNew `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable

$apiArgs = @(
  "-ProjectRoot", (Quote-Argument $resolvedRoot),
  "-HostName", "0.0.0.0",
  "-Port", [string]$ApiPort,
  "-OdaFileConverterPath", (Quote-Argument $OdaFileConverterPath)
)
$webArgs = @(
  "-ProjectRoot", (Quote-Argument $resolvedRoot),
  "-HostName", "0.0.0.0",
  "-Port", [string]$WebPort,
  "-BuildIfMissing"
)

$apiTaskName = "$TaskPrefix API"
$webTaskName = "$TaskPrefix Web"

Register-ScheduledTask `
  -TaskName $apiTaskName `
  -Action (New-TaskActionForScript -ScriptPath $apiScript -ExtraArguments $apiArgs) `
  -Trigger $triggers `
  -Principal $principal `
  -Settings $settings `
  -Description "CAD Budget V1.1 API autostart" `
  -Force | Out-Null

Register-ScheduledTask `
  -TaskName $webTaskName `
  -Action (New-TaskActionForScript -ScriptPath $webScript -ExtraArguments $webArgs) `
  -Trigger $triggers `
  -Principal $principal `
  -Settings $settings `
  -Description "CAD Budget V1.1 Web autostart" `
  -Force | Out-Null

if ($CreateFirewallRules) {
  Ensure-FirewallRule -Name "CAD Budget Web $WebPort" -Port $WebPort
  Ensure-FirewallRule -Name "CAD Budget API $ApiPort" -Port $ApiPort
}

Write-Host "Registered scheduled tasks: $apiTaskName / $webTaskName"
Write-Host "Run as: $RunAs; Trigger: $TriggerType; Watchdog: every $WatchdogMinutes minute(s)"
Write-Host "Start now with:"
Write-Host "  Start-ScheduledTask -TaskName '$apiTaskName'"
Write-Host "  Start-ScheduledTask -TaskName '$webTaskName'"
