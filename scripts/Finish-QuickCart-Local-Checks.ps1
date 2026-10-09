param(
  [string]$ProjectPath = 'C:\Users\Kenta\Downloads\QuickCart-PostgreSQL 1\quickcart',
  [string]$OrderNumber = 'QC-2026-10004'
)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $ProjectPath
$compose = @('compose','-f','docker-compose.yml','-f','docker-compose.host.yml')
& docker @compose up -d --build --no-deps --wait --wait-timeout 240 order-api
if ($LASTEXITCODE -ne 0) { throw 'Backend rebuild failed.' }
$base = 'http://127.0.0.1:8082'
$url = "$base/api/orders/$OrderNumber"
function Update-Delivery([string]$Action,[string]$Status) {
  Invoke-RestMethod -Uri "$url/delivery" -Method Post -ContentType 'application/json' -Body (@{action=$Action;expectedStatus=$Status} | ConvertTo-Json)
}
$order = Invoke-RestMethod $url
if ($order.status -eq 'Processing') { $order = Update-Delivery 'advance' 'Processing' }
if ($order.status -eq 'Shipped') { $order = Update-Delivery 'advance' 'Shipped' }
if ($order.status -eq 'Out for Delivery') { $order = Update-Delivery 'receive' 'Out for Delivery' }
if ($order.status -ne 'Delivered' -or -not $order.tracking.receivedAt) { throw 'Delivery confirmation failed.' }
$receipt = $order.tracking.receivedAt
$eventCount = @($order.tracking.events).Count
$repeat = Update-Delivery 'receive' 'Out for Delivery'
if ($repeat.tracking.receivedAt -ne $receipt -or @($repeat.tracking.events).Count -ne $eventCount) { throw 'Repeated receipt altered the record.' }
Write-Host "PASS delivery sequence and repeat receipt: $OrderNumber"

# Restart existing services only. Do not delete any container volumes.
& docker @compose restart db order-api
if ($LASTEXITCODE -ne 0) { throw 'Restart failed.' }
& docker @compose up -d --no-build --wait --wait-timeout 240
if ($LASTEXITCODE -ne 0) { throw 'Services did not recover after restart.' }
$after = Invoke-RestMethod $url
if ($after.status -ne 'Delivered' -or $after.tracking.receivedAt -ne $receipt -or @($after.tracking.events).Count -ne $eventCount) { throw 'Persistence check failed.' }
Write-Host "PASS Docker restart persistence: $OrderNumber"
foreach ($path in @('/api/catalog/health','/api/orders/health','/api/payment/health')) {
  $health = Invoke-RestMethod "$base$path"
  if ($health.status -ne 'ok') { throw "Health check failed: $path" }
}
& docker exec quickcart-db-1 psql -U quickcart -d quickcart -v ON_ERROR_STOP=1 -c 'SELECT current_database(); SELECT COUNT(*) AS products FROM products; SELECT COUNT(*) AS orders FROM orders; SELECT COUNT(*) AS delivery_events FROM delivery_events;'
if ($LASTEXITCODE -ne 0) { throw 'Database count query failed.' }
$evidence = @{checkedAt=(Get-Date).ToString('o');orderNumber=$OrderNumber;status=$after.status;receivedAt=$receipt;events=$eventCount;dockerRestartPersistence='PASS'}
$evidence | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'QuickCart-Restart-Proof.json') -Encoding UTF8
Write-Host 'PASS local delivery and restart checks. GitHub-trigger and rollback demonstrations still require successful Jenkins builds.'
