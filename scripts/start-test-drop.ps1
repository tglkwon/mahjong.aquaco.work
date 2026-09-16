<#
.SYNOPSIS
    Mahjong MVP 1 모바일 점수판 인식 테스트용 mobile-drop 세션 오케스트레이터.
    로컬 파이썬 수신 서버와 Cloudflare Quick Tunnel을 기동하여 모바일 자동 페어링 링크를 발급합니다.
.PARAMETER Port
    로컬 HTTP 수신 서버 포트 (기본값: 8899)
.PARAMETER Device
    테스트 대상 작탁 기종 (기본값: rex3. rex3, jpex, jpcolor 등)
.PARAMETER OutputDir
    업로드된 파일 저장 상위 경로 (기본값: ./research-data)
.PARAMETER OneShot
    1개 파일 수신 즉시 자동 종료 (기본값: 연속 테스트 세션 유지)
.PARAMETER Stop
    실행 중인 모든 테스트 드롭 프로세스를 강제 종료합니다.
#>
[CmdletBinding(DefaultParameterSetName = "Start")]
param(
    [Parameter(ParameterSetName = "Start")]
    [int]$Port = 8899,

    [Parameter(ParameterSetName = "Start")]
    [string]$Device = "rex3",

    [Parameter(ParameterSetName = "Start")]
    [string]$OutputDir = (Join-Path (Resolve-Path "$PSScriptRoot\..").Path "research-data"),

    [Parameter(ParameterSetName = "Start")]
    [switch]$OneShot,

    [Parameter(ParameterSetName = "Stop", Mandatory = $true)]
    [switch]$Stop
)

$ErrorActionPreference = "Stop"
$tempDir = Join-Path $env:TEMP "mahjong_mobile_drop"
$serverPidFile = Join-Path $tempDir "server.pid"
$cfPidFile = Join-Path $tempDir "cloudflared.pid"
$logFile = Join-Path $tempDir "cloudflared.log"
$serverPy = Join-Path $PSScriptRoot "test-drop-server.py"

# --- 1. 종료 분기 (-Stop) ---
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
    Write-Output "MESSAGE: 테스트 드롭 터널 및 서버가 안전하게 종료되었습니다."
    exit 0
}

# --- 2. 사전 점검 및 초기화 ---
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
}

$resolvedOutputDir = [System.IO.Path]::GetFullPath($OutputDir)
if (-not (Test-Path $resolvedOutputDir)) {
    New-Item -ItemType Directory -Path $resolvedOutputDir -Force | Out-Null
}

# 기존 잔여 프로세스 정리
foreach ($pidFile in @($serverPidFile, $cfPidFile)) {
    if (Test-Path $pidFile) {
        $p = Get-Content $pidFile -ErrorAction SilentlyContinue
        if ($p) { Stop-Process -Id ([int]$p) -Force -ErrorAction SilentlyContinue }
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    }
}
Remove-Item $logFile -Force -ErrorAction SilentlyContinue

$pin = (Get-Random -Minimum 100000 -Maximum 999999).ToString()

# --- 3. 로컬 파이썬 서버 기동 ---
$pyArgs = "`"$serverPy`" --port $Port --token $pin --device `"$Device`""
if ($PSBoundParameters.ContainsKey('OutputDir')) {
    $pyArgs += " --output `"$resolvedOutputDir`""
}
if ($OneShot) { $pyArgs += " --one-shot" }

$pyProc = Start-Process -FilePath "python" -ArgumentList $pyArgs -WindowStyle Hidden -PassThru
$pyProc.Id | Out-File $serverPidFile -Encoding ascii

# 포트 리스닝 확인
$listening = $false
for ($i = 0; $i -lt 10; $i++) {
    Start-Sleep -Milliseconds 500
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($conn) { $listening = $true; break }
    } catch { }
}
if (-not $listening) {
    Write-Error "로컬 파이썬 서버 시작 실패 (포트 $Port 응답 없음)"
    exit 1
}

# --- 4. Cloudflare Quick Tunnel 기동 ---
$cfCmd = Get-Command "cloudflared" -ErrorAction SilentlyContinue
$cfExe = if ($cfCmd) { "cloudflared" } else { "npx" }
$cfArgs = if ($cfCmd) { "tunnel --url http://localhost:$Port" } else { "--yes cloudflared tunnel --url http://localhost:$Port" }

$cfProc = Start-Process -FilePath $cfExe -ArgumentList $cfArgs -RedirectStandardError $logFile -WindowStyle Hidden -PassThru
$cfProc.Id | Out-File $cfPidFile -Encoding ascii

# URL 추출 (최대 15초 대기)
$tunnelUrl = $null
$sw = [System.Diagnostics.Stopwatch]::StartNew()
while ($sw.Elapsed.TotalSeconds -lt 15) {
    if (Test-Path $logFile) {
        try {
            $content = Get-Content -Path $logFile -Raw -ErrorAction SilentlyContinue
            if ($content -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
                $tunnelUrl = $matches[1]
                break
            }
        } catch { }
    }
    Start-Sleep -Milliseconds 400
}
$sw.Stop()

if (-not $tunnelUrl) {
    Write-Error "Cloudflare Tunnel URL 발급 실패 (15초 초과)"
    exit 1
}

$pairQuery = "?dropUrl=$([uri]::EscapeDataString($tunnelUrl))&dropPin=$pin&device=$([uri]::EscapeDataString($Device))"
$localDevUrl = "http://localhost:3000/set_score_photo$pairQuery"
$liveProdUrl = "https://mahjong.aquaco.work/set_score_photo$pairQuery"

Write-Output "================================================================="
Write-Output " 🀄 [mahjong.aquaco.work] 모바일 테스트 드롭 세션이 열렸습니다!"
Write-Output "================================================================="
Write-Output "TUNNEL_URL:     $tunnelUrl"
Write-Output "SECURITY_PIN:   $pin"
Write-Output "TARGET_DEVICE:  $Device"
Write-Output "STORAGE_DIR:    $resolvedOutputDir (기기별 자동 서브디렉터리 저장)"
Write-Output "SESSION_MODE:   $(if ($OneShot) { '1회 수신 후 자동 종료' } else { '연속 테스트 수신 유지 (Continuous)' })"
Write-Output "-----------------------------------------------------------------"
Write-Output "📱 모바일 자동 페어링 링크 (상용 사이트 접속 시):"
Write-Output "   $liveProdUrl"
Write-Output "💻 로컬 개발 서버 접속 시:"
Write-Output "   $localDevUrl"
Write-Output "================================================================="
Write-Output "테스트를 마치려면 Ctrl+C를 누르거나, 다른 터미널에서 아래 명령을 실행하십시오:"
Write-Output "pwsh.exe -File `"$PSCommandPath`" -Stop"
Write-Output "================================================================="

# 프로세스 대기
try {
    while ($true) {
        Start-Sleep -Seconds 2
        if ($pyProc.HasExited) { break }
        if ($cfProc.HasExited) { break }
    }
} finally {
    Stop-Process -Id $pyProc.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $cfProc.Id -Force -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $tempDir "*.pid") -Force -ErrorAction SilentlyContinue
    Write-Output "`n세션이 정리되었습니다."
}
