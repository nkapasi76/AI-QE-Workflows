param(
  [Parameter(Mandatory = $true)]
  [string]$PageId,
  [string]$OutputDir = "tmp",
  [string]$BodyFormat = "storage",
  [string]$EnvFile = ".env.user.config"
)

$loader = Join-Path $PSScriptRoot "load-atlassian-env.ps1"
& $loader -EnvFile $EnvFile -Quiet
if (-not $?) { exit 1 }

if (-not $env:ATLASSIAN_USER -or -not $env:ATLASSIAN_API_TOKEN) {
  Write-Error "ATLASSIAN_USER and ATLASSIAN_API_TOKEN must be set."
  exit 1
}

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

$pair = "{0}:{1}" -f $env:ATLASSIAN_USER, $env:ATLASSIAN_API_TOKEN
$basicAuth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
$headers = @{
  Authorization = "Basic $basicAuth"
  Accept        = "application/json"
}

$uri = "https://sessionm.atlassian.net/wiki/api/v2/pages/$PageId?body-format=$BodyFormat"
$response = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers

$outFile = Join-Path $OutputDir ("confluence-page-{0}-{1}.json" -f $PageId, $BodyFormat)
$response | ConvertTo-Json -Depth 100 | Out-File -FilePath $outFile -Encoding utf8

(Resolve-Path $outFile).Path
