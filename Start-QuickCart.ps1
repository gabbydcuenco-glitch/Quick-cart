param([switch]$Production)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

function Invoke-Docker {
    param([string[]]$DockerArgs)
    & docker @DockerArgs
    if ($LASTEXITCODE -ne 0) { throw "Docker command failed with exit code $LASTEXITCODE" }
}

# Check the daemon before writing configuration or starting services.
Invoke-Docker -DockerArgs @('info', '--format', '{{.ServerVersion}}')
& node scripts/init-env.cjs
if ($LASTEXITCODE -ne 0) { throw 'Environment setup failed' }

Invoke-Docker -DockerArgs @('compose', '-p', 'quickcart-jenkins', '-f', 'infra/jenkins/docker-compose.yml', 'up', '-d', '--build')
if ($Production) {
    Invoke-Docker -DockerArgs @('compose', 'up', '-d', '--build', '--wait', '--wait-timeout', '240')
}

if ($Production) { Write-Host 'QuickCart: http://localhost:8080' } else { Write-Host 'QuickCart: http://localhost:8080' }
Write-Host 'Jenkins:   http://localhost:8081'
if (-not $Production) {
    if (-not (Test-Path 'frontend/node_modules/.bin/vite.cmd')) {
        & npm.cmd --prefix frontend ci
        if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed' }
    }
    & npm.cmd run dev
    if ($LASTEXITCODE -ne 0) { throw 'Vite exited with an error' }
}



