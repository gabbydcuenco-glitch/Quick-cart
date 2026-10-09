$ErrorActionPreference = 'Stop'
$certDirectory = Join-Path $PSScriptRoot '../frontend/.certs'
New-Item -ItemType Directory -Path $certDirectory -Force | Out-Null
$certPath = Join-Path $certDirectory 'localhost.pem'
$keyPath = Join-Path $certDirectory 'localhost-key.pem'
$certificate = $null
if ((Test-Path $certPath) -and (Test-Path $keyPath)) {
    $certificate = [Security.Cryptography.X509Certificates.X509Certificate2]::CreateFromPemFile($certPath, $keyPath)
    if ($certificate.NotAfter -lt (Get-Date).AddDays(14)) { $certificate.Dispose(); $certificate = $null }
}
if ($null -eq $certificate) {
    $rsa = [Security.Cryptography.RSA]::Create(2048)
    $request = [Security.Cryptography.X509Certificates.CertificateRequest]::new(
        'CN=localhost', $rsa, [Security.Cryptography.HashAlgorithmName]::SHA256,
        [Security.Cryptography.RSASignaturePadding]::Pkcs1)
    $san = [Security.Cryptography.X509Certificates.SubjectAlternativeNameBuilder]::new()
    $san.AddDnsName('localhost')
    $san.AddIpAddress([Net.IPAddress]::Parse('127.0.0.1'))
    $san.AddIpAddress([Net.IPAddress]::Parse('::1'))
    $request.CertificateExtensions.Add($san.Build())
    $request.CertificateExtensions.Add([Security.Cryptography.X509Certificates.X509BasicConstraintsExtension]::new($false, $false, 0, $true))
    $usage = [Security.Cryptography.OidCollection]::new()
    $usage.Add([Security.Cryptography.Oid]::new('1.3.6.1.5.5.7.3.1')) | Out-Null
    $request.CertificateExtensions.Add([Security.Cryptography.X509Certificates.X509EnhancedKeyUsageExtension]::new($usage, $false))
    $certificate = $request.CreateSelfSigned([DateTimeOffset]::Now.AddMinutes(-5), [DateTimeOffset]::Now.AddDays(365))
    [IO.File]::WriteAllText($certPath, $certificate.ExportCertificatePem())
    [IO.File]::WriteAllText($keyPath, $rsa.ExportPkcs8PrivateKeyPem())
    $rsa.Dispose()
}
# Trust only this localhost server certificate for the current Windows user.
$store = [Security.Cryptography.X509Certificates.X509Store]::new('Root', 'CurrentUser')
try {
    $store.Open([Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
    $existing = $store.Certificates.Find([Security.Cryptography.X509Certificates.X509FindType]::FindByThumbprint, $certificate.Thumbprint, $false)
    if ($existing.Count -eq 0) {
        $publicCertificate = [Security.Cryptography.X509Certificates.X509Certificate2]::new($certificate.Export([Security.Cryptography.X509Certificates.X509ContentType]::Cert))
        $store.Add($publicCertificate)
        $publicCertificate.Dispose()
    }
    Write-Host 'HTTPS certificate ready and trusted for localhost (current Windows user).'
} finally { $store.Close(); $certificate.Dispose() }
