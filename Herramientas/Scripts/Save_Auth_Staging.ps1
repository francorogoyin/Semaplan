param(
  [string]$TargetUrl = "",
  [string]$AuthFile = ""
)

$ErrorActionPreference = "Stop"

if (-not $TargetUrl) {
  $TargetUrl = $env:SEMAPLAN_TARGET_URL
}

if (-not $TargetUrl) {
  $TargetUrl = "https://semaplan.com/?entorno=staging"
}

if (-not $AuthFile) {
  $AuthFile = $env:SEMAPLAN_AUTH_FILE
}

if (-not $AuthFile) {
  $AuthFile = Join-Path (
    Split-Path $PSScriptRoot -Parent
  ) "..\\Pruebas\\Playwright\\.auth\\semaplan-staging.json"
}

$env:SEMAPLAN_TARGET_URL = $TargetUrl
$env:SEMAPLAN_AUTH_FILE = $AuthFile

Write-Host "Auth staging"
Write-Host "TargetUrl: $TargetUrl"
Write-Host "AuthFile: $AuthFile"

try {
  & node "Herramientas/Scripts/save-semaplan-auth.js"
  exit $LASTEXITCODE
} finally {
  Remove-Item Env:\\SEMAPLAN_TARGET_URL `
    -ErrorAction SilentlyContinue
  Remove-Item Env:\\SEMAPLAN_AUTH_FILE `
    -ErrorAction SilentlyContinue
}
