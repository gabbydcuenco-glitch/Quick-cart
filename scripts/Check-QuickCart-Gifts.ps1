param([string]$BaseUrl = 'http://127.0.0.1:8082')
$ErrorActionPreference = 'Stop'
foreach ($service in @('catalog','orders','payment')) {
    $health = Invoke-RestMethod "$BaseUrl/api/$service/health" -TimeoutSec 10
    if ($health.status -ne 'ok') { throw "$service health failed" }
    Write-Host "$service : OK"
}
# Assign first: Windows PowerShell 5.1 may otherwise wrap the JSON array.
$response = Invoke-RestMethod "$BaseUrl/api/catalog/products" -TimeoutSec 10
$products = @($response | ForEach-Object { $_ })
$expected = @{ 'Gifts for Men'=10; 'Gifts for Women'=10; 'Unisex'=10; 'Couples'=8 }
foreach ($category in $expected.Keys) {
    $actual = @($products | Where-Object { $_.category -eq $category }).Count
    if ($actual -ne $expected[$category]) { throw "$category count is $actual, expected $($expected[$category])" }
    $filteredResponse = Invoke-RestMethod ($BaseUrl+'/api/catalog/products?category='+[Uri]::EscapeDataString($category)) -TimeoutSec 10
    if (@($filteredResponse | ForEach-Object { $_ }).Count -ne $actual) { throw "$category filter returned an incorrect count" }
}
if ($products.Count -lt 45) { throw 'The complete catalog should contain at least 45 products.' }
if (@($products | Where-Object { $_.currency -ne 'PHP' -or $_.price -le 0 -or $_.stock -lt 0 }).Count -gt 0) { throw 'Invalid currency, price, or stock.' }
if (@($products.id | Select-Object -Unique).Count -ne $products.Count) { throw 'Duplicate product IDs.' }
$item = $products | Where-Object { $_.stock -gt 0 } | Select-Object -First 1
$body = @{items=@(@{productId=$item.id;quantity=1});delivery='express'} | ConvertTo-Json -Depth 5
$quote = Invoke-RestMethod "$BaseUrl/api/orders/quote" -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 10
$discount = 0
if ($item.price -ge 3000) { $discount = 300 }
$expectedTotal = [math]::Round(([decimal]$item.price-$discount+149),2)
if ($quote.currency -ne 'PHP' -or [decimal]$quote.total -ne $expectedTotal) { throw 'Peso checkout quote does not match expected totals.' }
$products | Group-Object category | Select-Object @{Name='Category';Expression={$_.Name}},Count | Format-Table -AutoSize
Write-Host "PASS: $($products.Count) products, category filters, PHP prices, and checkout quote. No orders or database records were changed."
