param(
  [Parameter(Mandatory = $true)]
  [string]$TicketKey,
  [string]$OutputDir = "tmp",
  [string]$Fields = "*all",
  [switch]$IncludeText,
  [string]$EnvFile = ".env.user.config"
)

$loader = Join-Path $PSScriptRoot "load-atlassian-env.ps1"
& $loader -EnvFile $EnvFile -Quiet
if (-not $?) { exit 1 }

$ticketDir = Join-Path $OutputDir $TicketKey
New-Item -ItemType Directory -Path $ticketDir -Force | Out-Null

$jsonOut = Join-Path $ticketDir "ticket-main.json"
$textOut = Join-Path $ticketDir "ticket-main.txt"

acli jira workitem view $TicketKey --fields $Fields --json | Out-File -FilePath $jsonOut -Encoding utf8

if ($IncludeText) {
  acli jira workitem view $TicketKey | Out-File -FilePath $textOut -Encoding utf8
}

[pscustomobject]@{
  TicketKey = $TicketKey
  JsonFile  = (Resolve-Path $jsonOut).Path
  TextFile  = if ($IncludeText) { (Resolve-Path $textOut).Path } else { $null }
} | ConvertTo-Json -Depth 5
