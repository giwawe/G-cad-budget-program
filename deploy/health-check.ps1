param(
  [string]$WebBaseUrl = "http://127.0.0.1:3010",
  [string]$ApiBaseUrl = "http://127.0.0.1:8010"
)

$ErrorActionPreference = "Stop"
$failures = @()

function Test-Url {
  param(
    [string]$Name,
    [string]$Url,
    [int]$MinimumBytes = 1
  )
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
    $contentLength = if ($response.Content) { $response.Content.Length } else { 0 }
    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
      $script:failures += "$Name returned unexpected status: $($response.StatusCode)"
      return $null
    }
    if ($contentLength -lt $MinimumBytes) {
      $script:failures += "$Name response is too small: $contentLength bytes"
      return $null
    }
    Write-Host "$Name OK $($response.StatusCode) $contentLength bytes"
    return $response
  } catch {
    $script:failures += "$Name request failed: $($_.Exception.Message)"
    return $null
  }
}

$apiHealth = Test-Url -Name "API /health" -Url "$ApiBaseUrl/health" -MinimumBytes 10
$homeResponse = Test-Url -Name "Web home" -Url "$WebBaseUrl/" -MinimumBytes 1000
$training = Test-Url -Name "Training page" -Url "$WebBaseUrl/training" -MinimumBytes 1000
$ppt = Test-Url -Name "Training PPT" -Url "$WebBaseUrl/training/designer-training-v1.1.pptx" -MinimumBytes 10000

if ($homeResponse -and $homeResponse.Content) {
  $markerIndex = $homeResponse.Content.IndexOf("/_next/static/css/")
  if ($markerIndex -lt 0) {
    $markerIndex = $homeResponse.Content.IndexOf("app/layout.css")
  }
  $hrefNeedle = "href=" + [char]34
  $hrefIndex = if ($markerIndex -ge 0) { $homeResponse.Content.LastIndexOf($hrefNeedle, $markerIndex) } else { -1 }
  if ($hrefIndex -ge 0) {
    $quoteStart = $hrefIndex + $hrefNeedle.Length
    $quoteEnd = $homeResponse.Content.IndexOf([char]34, $quoteStart)
    if ($quoteEnd -le $quoteStart) {
      $failures += "Failed to parse layout.css href from home page"
    } else {
    $cssPath = $homeResponse.Content.Substring($quoteStart, $quoteEnd - $quoteStart)
    $cssUrl = if ($cssPath.StartsWith("http")) { $cssPath } else { "$WebBaseUrl$cssPath" }
    Test-Url -Name "Web CSS" -Url $cssUrl -MinimumBytes 1000 | Out-Null
    }
  } else {
    $failures += "layout.css href was not found on home page"
  }
}

if ($apiHealth -and $apiHealth.Content -notmatch '"status"\s*:\s*"ok"') {
  $failures += "API /health did not return status=ok"
}

if ($failures.Count -gt 0) {
  Write-Host ""
  Write-Host "Health check failed:"
  foreach ($failure in $failures) {
    Write-Host "- $failure"
  }
  exit 1
}

Write-Host ""
Write-Host "Health check passed."
