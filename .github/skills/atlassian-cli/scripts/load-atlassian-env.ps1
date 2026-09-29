param(
  [string]$EnvFile = ".env.user.config",
  [switch]$Quiet
)

if (-not (Test-Path -Path $EnvFile)) {
  Write-Error "Environment file not found: $EnvFile"
  throw "Environment file not found: $EnvFile"
}

$requiredKeys = @("ATLASSIAN_API_TOKEN", "ATLASSIAN_USER")
$loadedKeys = @()

foreach ($line in Get-Content -Path $EnvFile) {
  $trimmed = $line.Trim()

  if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith("#")) {
    continue
  }

  $parts = $trimmed -split "=", 2
  if ($parts.Count -ne 2) {
    continue
  }

  $key = $parts[0].Trim()
  $value = $parts[1].Trim()

  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  }

  if ($value.StartsWith("'") -and $value.EndsWith("'")) {
    $value = $value.Substring(1, $value.Length - 2)
  }

  if ($requiredKeys -contains $key) {
    Set-Item -Path "env:$key" -Value $value
    $loadedKeys += $key
  }
}

$missing = $requiredKeys | Where-Object { -not $loadedKeys.Contains($_) -and -not (Get-Item -Path "env:$_" -ErrorAction SilentlyContinue) }

if ($missing.Count -gt 0) {
  Write-Error "Missing required Atlassian keys: $($missing -join ', ')"
  throw "Missing required Atlassian keys: $($missing -join ', ')"
}

if (-not $Quiet) {
  Write-Host "Loaded Atlassian environment variables: $($requiredKeys -join ', ')"
}
