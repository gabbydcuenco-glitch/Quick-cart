param([switch]$Production, [switch]$Dev, [switch]$Jenkins)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 22.12 or newer, then retry.' }
if ($Jenkins) {
    & docker compose -p quickcart-jenkins -f infra/jenkins/docker-compose.yml up -d --build
    if ($LASTEXITCODE -ne 0) { throw 'Jenkins startup failed. Check Docker Desktop.' }
}
if ($Dev) { & npm.cmd run dev } else { & node scripts/prepare-dev.js }
if ($LASTEXITCODE -ne 0) { throw 'QuickCart startup failed. See the message above.' }

