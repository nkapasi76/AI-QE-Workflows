param(
  [Parameter(Mandatory = $true)]
  [string]$TicketKey,
  [string]$RootDir = "tmp"
)

$ticketDir = Join-Path $RootDir $TicketKey
New-Item -ItemType Directory -Path $ticketDir -Force | Out-Null

[pscustomobject]@{
  TicketKey = $TicketKey
  RootDir   = (Resolve-Path $RootDir).Path
  TicketDir = (Resolve-Path $ticketDir).Path
} | ConvertTo-Json -Depth 5
