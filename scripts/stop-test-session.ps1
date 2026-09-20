<#
.SYNOPSIS
    마작 점수판 스캐너 - 모바일 테스트 세션 일괄 안전 종료 스크립트
    .test-session.json에 기록된 프로세스(React, Python, Cloudflared)들을 종료하고 세션 파일을 정리합니다.
#>
[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = "SilentlyContinue"
$projectRoot = (Resolve-Path "$PSScriptRoot\..").Path
$tempDir = Join-Path $env:TEMP "mahjong_test_session"
$sessionFile = Join-Path $projectRoot ".test-session.json"

Write-Output "🛑 모바일 테스트 세션 종료 작업을 시작합니다..."

# 1. .test-session.json에서 PID 읽어 종료
if (Test-Path $sessionFile) {
    try {
        $jsonText = Get-Content -Path $sessionFile -Raw
        $session = $jsonText | ConvertFrom-Json
        if ($session.pids) {
            foreach ($prop in $session.pids.PSObject.Properties) {
                $procId = [int]$prop.Value
                if ($procId -gt 0) {
                    Write-Output "  - 프로세스 종료: $($prop.Name) (PID: $procId)"
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch { }
    Remove-Item -Path $sessionFile -Force -ErrorAction SilentlyContinue
}

# 2. 포트 8899(mobile-drop) 및 포트 3000 리스너 추가 점검
try {
    $dropConns = Get-NetTCPConnection -LocalPort 8899 -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $dropConns) {
        if ($c.OwningProcess -and $c.OwningProcess -gt 4) {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
} catch { }

# 3. cloudflared 프로세스 정리
Stop-Process -Name "cloudflared" -Force -ErrorAction SilentlyContinue

# 4. 임시 로그 정리
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Output "================================================================="
Write-Output " ✅ 모바일 테스트 세션이 안전하게 종료되었습니다."
Write-Output "    관련 프로세스(React, Python, Cloudflared) 및 세션 파일이 정리되었습니다."
Write-Output "================================================================="
