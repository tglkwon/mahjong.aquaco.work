<#
.SYNOPSIS
    Automated test runner for User-Agent Rate Limiting and .htaccess rule integrity.

.DESCRIPTION
    Validates:
    1. public/.htaccess syntax and User-Agent blocking rules.
    2. Optional live HTTP validation against a target URL (-TargetUrl).
#>

[CmdletBinding()]
param(
    [string]$TargetUrl = "",
    [switch]$SkipLive
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$htaccessPath = Join-Path $repoRoot 'public\.htaccess'

Write-Host "=== 1. Validating public/.htaccess Rules ===" -ForegroundColor Cyan
if (-not (Test-Path -LiteralPath $htaccessPath)) {
    throw "public/.htaccess does not exist at: $htaccessPath"
}

$content = Get-Content -Raw -LiteralPath $htaccessPath

$requiredTokens = @(
    'RewriteEngine On',
    'HTTP_USER_AGENT',
    '429',
    'curl',
    'python',
    'bytespider',
    'RewriteRule ^index\.html$ - [L]',
    'RewriteRule . /index.html [L]'
)

$missing = @()
foreach ($token in $requiredTokens) {
    if ($content -notmatch [regex]::Escape($token)) {
        $missing += $token
    }
}

if ($missing.Count -gt 0) {
    Write-Host "[FAIL] Missing required rules in .htaccess:`n- $($missing -join "`n- ")" -ForegroundColor Red
    $rulePass = $false
} else {
    Write-Host "[PASS] public/.htaccess contains all required User-Agent 429 rules and SPA routing." -ForegroundColor Green
    $rulePass = $true
}

# Live HTTP testing if TargetUrl provided
if ($TargetUrl -and -not $SkipLive) {
    Write-Host "`n=== 2. Running Live HTTP Validation against $TargetUrl ===" -ForegroundColor Cyan

    $testCases = @(
        @{ Name = "Browser Chrome (Desktop)"; UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"; Expected = 200 },
        @{ Name = "Browser Safari (Mobile iOS)"; UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"; Expected = 200 },
        @{ Name = "Search Crawler (Googlebot)"; UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"; Expected = 200 },
        @{ Name = "Scraper tool (curl)"; UA = "curl/8.5.0"; Expected = 429 },
        @{ Name = "Python library (requests)"; UA = "python-requests/2.31.0"; Expected = 429 },
        @{ Name = "Python library (aiohttp)"; UA = "Python/3.11 aiohttp/3.9.1"; Expected = 429 },
        @{ Name = "AI / Scraper bot (bytespider)"; UA = "Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)"; Expected = 429 }
    )

    $livePass = $true
    foreach ($tc in $testCases) {
        try {
            $response = Invoke-WebRequest -Uri $TargetUrl -UserAgent $tc.UA -UseBasicParsing -TimeoutSec 10 -SkipHttpErrorCheck
            $statusCode = [int]$response.StatusCode
        } catch {
            if ($_.Exception.Response) {
                $statusCode = [int]$_.Exception.Response.StatusCode
            } else {
                Write-Host "[ERR] $($tc.Name): Request failed: $($_.Exception.Message)" -ForegroundColor Red
                $livePass = $false
                continue
            }
        }

        if ($statusCode -eq $tc.Expected) {
            Write-Host "[PASS] $($tc.Name) -> Expected $($tc.Expected), Got $statusCode" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] $($tc.Name) -> Expected $($tc.Expected), Got $statusCode" -ForegroundColor Red
            $livePass = $false
        }
    }

    if (-not $livePass) {
        throw "Live HTTP verification failed."
    }
}

if (-not $rulePass) {
    throw ".htaccess validation failed."
}

Write-Host "`nAll User-Agent Rate Limiting tests passed successfully." -ForegroundColor Green
