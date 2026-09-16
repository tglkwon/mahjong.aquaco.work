<#
.SYNOPSIS
    마작 점수판 스캐너 테스트 서버 및 Cloudflare 모바일 터널 구동기
.PARAMETER Port
    로컬 React 웹 서버 포트 (기본값: 3000)
.PARAMETER Stop
    실행 중인 테스트 서버 및 터널 프로세스를 종료합니다.
#>
[CmdletBinding(DefaultParameterSetName = "Start")]
param(
    [Parameter(ParameterSetName = "Start")]
    [int]$Port = 3000,

    [Parameter(ParameterSetName = "Stop", Mandatory = $true)]
    [switch]$Stop
)

$ErrorActionPreference = "Stop"
$tempDir = Join-Path $env:TEMP "mahjong_test_server"
$serverPidFile = Join-Path $tempDir "server.pid"
$cfPidFile = Join-Path $tempDir "cloudflared.pid"
$cfLogFile = Join-Path $tempDir "cloudflared.log"
$serverOutFile = Join-Path $tempDir "server_out.log"
$serverErrFile = Join-Path $tempDir "server_err.log"
$projectRoot = "c:\Users\AquaCo\project\mahjong.aquaco.work"

if ($Stop) {
    if (Test-Path $tempDir) {
        foreach ($pidFile in @($serverPidFile, $cfPidFile)) {
            if (Test-Path $pidFile) {
                $p = Get-Content $pidFile -ErrorAction SilentlyContinue
                if ($p) { Stop-Process -Id ([int]$p) -Force -ErrorAction SilentlyContinue }
                Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
            }
        }
        Stop-Process -Name "cloudflared" -Force -ErrorAction SilentlyContinue
    }
    Write-Output "STATUS: STOPPED"
    Write-Output "MESSAGE: 테스트 서버 및 터널이 정상 종료되었습니다."
    exit 0
}

if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
}

# 기존 프로세스 정리
if (Test-Path $serverPidFile) {
    $oldPid = Get-Content $serverPidFile -ErrorAction SilentlyContinue
    if ($oldPid) { Stop-Process -Id ([int]$oldPid) -Force -ErrorAction SilentlyContinue }
    Remove-Item $serverPidFile -Force -ErrorAction SilentlyContinue
}
if (Test-Path $cfPidFile) {
    $oldPid = Get-Content $cfPidFile -ErrorAction SilentlyContinue
    if ($oldPid) { Stop-Process -Id ([int]$oldPid) -Force -ErrorAction SilentlyContinue }
    Remove-Item $cfPidFile -Force -ErrorAction SilentlyContinue
}

# React 웹 서버 구동
if (Test-Path $serverOutFile) { Remove-Item $serverOutFile -Force }
if (Test-Path $serverErrFile) { Remove-Item $serverErrFile -Force }

$cmdArgs = "/c set PORT=$Port && set BROWSER=none && npm start"
$serverProc = Start-Process -FilePath "cmd.exe" -ArgumentList $cmdArgs -WorkingDirectory $projectRoot -RedirectStandardOutput $serverOutFile -RedirectStandardError $serverErrFile -WindowStyle Hidden -PassThru
$serverProc.Id | Out-File $serverPidFile -Encoding ascii

Write-Output "React 개발 서버 구동 중 (PID: $($serverProc.Id), 포트: $Port)..."

# 포트 대기 (최대 30초)
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$serverReady = $false
while ($sw.Elapsed.TotalSeconds -lt 30) {
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($conn) {
            $serverReady = $true
            break
        }
    } catch {}
    Start-Sleep -Milliseconds 800
}

if ($serverReady) {
    Write-Output "✅ 로컬 서버가 포트 $Port 에서 응답하고 있습니다."
} else {
    Write-Warning "서버 포트 리스닝 확인 대기 중이나 프로세스가 시작되었습니다."
}

# Cloudflare Tunnel 구동
if (Test-Path $cfLogFile) { Remove-Item $cfLogFile -Force }

$cfProc = Start-Process -FilePath "cloudflared" -ArgumentList "tunnel --url http://localhost:$Port" -RedirectStandardError $cfLogFile -WindowStyle Hidden -PassThru
$cfProc.Id | Out-File $cfPidFile -Encoding ascii

$tunnelUrl = $null
$cfSw = [System.Diagnostics.Stopwatch]::StartNew()
while ($cfSw.Elapsed.TotalSeconds -lt 15) {
    if (Test-Path $cfLogFile) {
        $logText = Get-Content -Path $cfLogFile -Raw -ErrorAction SilentlyContinue
        if ($logText -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
            $tunnelUrl = $matches[1]
            break
        }
    }
    Start-Sleep -Milliseconds 400
}

Write-Output "=== 🚀 테스트 서버 실행 완료 ==="
Write-Output "로컬 PC 주소: http://localhost:$Port/set_score_photo"
if ($tunnelUrl) {
    Write-Output "모바일 접속 (HTTPS): $tunnelUrl/set_score_photo"
} else {
    Write-Output "모바일 터널: 발급 대기 중 (로그: $cfLogFile)"
}
