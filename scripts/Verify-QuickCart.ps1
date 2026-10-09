param([switch]$Development)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Join-Path $PSScriptRoot '..')
$composeArgs = @('compose')
if ($Development) { $composeArgs += @('-f','docker-compose.yml','-f','docker-compose.host.yml') }
& docker version
if ($LASTEXITCODE -ne 0) { throw 'Docker engine inaccessible. Use normal PowerShell with Docker Desktop running.' }
& docker @composeArgs config --quiet
if ($LASTEXITCODE -ne 0) { throw 'Invalid Compose configuration; check your .env.' }
& docker @composeArgs ps
if ($LASTEXITCODE -ne 0) { throw 'Could not list application containers.' }
foreach ($path in @('/nginx-health','/','/api/catalog/health','/api/orders/health','/api/payment/health','/api/catalog/products')) {
    & docker @composeArgs exec -T proxy wget -qO- "http://127.0.0.1:8080$path"
    if ($LASTEXITCODE -ne 0) { throw "Proxy request failed: $path" }
    Write-Host "PASS $path"
}
& docker @composeArgs exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "SELECT count(*) AS products FROM products; SELECT count(*) AS orders FROM orders;"'
if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL query failed.' }
& docker compose -p quickcart-jenkins -f infra/jenkins/docker-compose.yml ps
if ($LASTEXITCODE -ne 0) { throw 'Jenkins Compose status failed.' }
& docker exec jenkins docker version
if ($LASTEXITCODE -ne 0) { throw 'Jenkins cannot access Docker, or Jenkins has not started.' }
$response = Invoke-WebRequest -Uri 'http://localhost:8081/login' -TimeoutSec 20
if ($response.StatusCode -ne 200) { throw 'Jenkins login page is not responding.' }
Write-Host 'PASS runtime checks. Still demonstrate push trigger, failed-test gate, persistence and rollback using docs/demo-runbook.md.'
