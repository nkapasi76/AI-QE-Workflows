param(
  [Parameter(Mandatory = $true)]
  [string]$TicketKey,
  [string]$OutputPath = "tmp/ticket-type-check.json",
  [string]$Fields = "issuetype,project",
  [string]$EnvFile = ".env.user.config"
)

$loader = Join-Path $PSScriptRoot "load-atlassian-env.ps1"
& $loader -EnvFile $EnvFile -Quiet
if (-not $?) { exit 1 }

$parent = Split-Path -Parent $OutputPath
if ($parent) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }

acli jira workitem view $TicketKey --fields $Fields --json | Out-File -FilePath $OutputPath -Encoding utf8

(Resolve-Path $OutputPath).Path
