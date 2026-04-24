param(
  [int]$Port = 4000,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

function Get-CloudflaredPath {
  $command = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $candidates = @(
    "$Env:ProgramFiles\\cloudflared\\cloudflared.exe",
    "${Env:ProgramFiles(x86)}\\cloudflared\\cloudflared.exe",
    "$Env:ProgramFiles\\Cloudflare\\cloudflared\\cloudflared.exe"
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  return $null
}

$cloudflaredPath = Get-CloudflaredPath
if (-not $cloudflaredPath) {
  throw "cloudflared executable not found. Install it with: winget install --id Cloudflare.cloudflared"
}

if (-not $SkipBuild) {
  Write-Host "Running production build..."
  npm run build

  if ($LASTEXITCODE -ne 0) {
    throw "Build failed. Fix errors and run this script again."
  }
}

$serverCommand = "Set-Location '$projectRoot'; npm run start -- -p $Port"
$tunnelCommand = "Set-Location '$projectRoot'; & '$cloudflaredPath' tunnel --url http://localhost:$Port"

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $serverCommand | Out-Null
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $tunnelCommand | Out-Null

Write-Host "Opened two windows:"
Write-Host "1) Next.js production server on port $Port"
Write-Host "2) Cloudflare quick tunnel"
Write-Host ""
Write-Host "Keep both windows open while the storefront is live."