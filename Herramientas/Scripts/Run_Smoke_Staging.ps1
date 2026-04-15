param(
  [string]$BaseUrl = "",
  [string]$AuthFile = ""
)

$ErrorActionPreference = "Stop"

if (-not $BaseUrl) {
  $BaseUrl = $env:SEMAPLAN_BASE_URL
}

if (-not $BaseUrl) {
  Write-Error (
    "Falta -BaseUrl o la variable SEMAPLAN_BASE_URL."
  )
}

if (-not $AuthFile) {
  $AuthFile = $env:SEMAPLAN_AUTH_FILE
}

if (-not $AuthFile) {
  $AuthFile = Join-Path (
    Split-Path $PSScriptRoot -Parent
  ) "..\\Pruebas\\Playwright\\.auth\\semaplan-patricio.json"
}

$env:SEMAPLAN_BASE_URL = $BaseUrl
$env:SEMAPLAN_AUTH_FILE = $AuthFile

Write-Host "Smoke remoto"
Write-Host "BaseUrl: $BaseUrl"
Write-Host "AuthFile: $AuthFile"

try {
  & npx playwright test `
    Pruebas/Tests/smoke-produccion.spec.js `
    --config=playwright.prod.config.js
  exit $LASTEXITCODE
} finally {
  Remove-Item Env:\\SEMAPLAN_BASE_URL `
    -ErrorAction SilentlyContinue
  Remove-Item Env:\\SEMAPLAN_AUTH_FILE `
    -ErrorAction SilentlyContinue
}
