param(
  [Parameter(Mandatory = $true)]
  [string]$PeripheralImage,

  [Parameter(Mandatory = $true)]
  [string]$MarrowImage,

  [string]$BaseUrl = "http://localhost:3000",

  [string]$ApiToken = "cellcount_enterprise_2026_secure_ai_v4",

  [string]$Report = "reports\ci001b2_e2e_report.json"
)

$ErrorActionPreference = "Stop"

$env:CELLCOUNT_BASE_URL = $BaseUrl
$env:CELLCOUNT_API_TOKEN = $ApiToken

node tests\ci001b2_e2e.mjs `
  $PeripheralImage `
  $MarrowImage `
  $Report

exit $LASTEXITCODE
