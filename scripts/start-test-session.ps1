<#
.SYNOPSIS
    마작 점수판 스캐너 - 원클릭 모바일 테스트 세션 번들 오케스트레이터
    React 개발 서버(3000) 및 mobile-drop 수신기(8899)를 백그라운드 구동하고
    Cloudflare 듀얼 터널을 발급하여 파라미터가 사전 주입된 모바일 전용 원클릭 URL을 제공합니다.
.PARAMETER Port
    React 개발 서버 포트 (기본값: 3000)
.PARAMETER DropPort
    mobile-drop 수신 서버 포트 (기본값: 8899)
.PARAMETER Device
    테스트 대상 작탁 기종 (기본값: rex3. rex3, jpex, jpcolor 등)
.PARAMETER OutputDir
    업로드된 파일 저장 상위 경로 (기본값: ./research-data)
#>
[CmdletBinding()]
param(
    [int]$Port = 3000,
    [int]$DropPort = 8899,
    [string]$Device = "rex3",
    [string]$OutputDir = (Join-Path (Resolve-Path "$PSScriptRoot\..").Path "research-data")
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path "$PSScriptRoot\..").Path
$tempDir = Join-Path $env:TEMP "mahjong_test_session"
$sessionFile = Join-Path $projectRoot ".test-session.json"
$serverPy = Join-Path $PSScriptRoot "test-drop-server.py"

if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
}

$resolvedOutputDir = [System.IO.Path]::GetFullPath($OutputDir)
if (-not (Test-Path $resolvedOutputDir)) {
    New-Item -ItemType Directory -Path $resolvedOutputDir -Force | Out-Null
}

# 1. 6자리 보안 PIN 생성
$pin = (Get-Random -Minimum 100000 -Maximum 999999).ToString()

# 2. React 개발 서버 (Port 3000) 구동 확인 및 시작
$webServerPid = $null
$webListening = $false
try {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $webListening = $true
        $webServerPid = $conn[0].OwningProcess
        Write-Output "✅ 기존 React 개발 서버 재사용 (PID: $webServerPid, 포트: $Port)"
    }
} catch { }

if (-not $webListening) {
    $webOutFile = Join-Path $tempDir "web_server_out.log"
    $webErrFile = Join-Path $tempDir "web_server_err.log"
    if (Test-Path $webOutFile) { Remove-Item $webOutFile -Force }
    if (Test-Path $webErrFile) { Remove-Item $webErrFile -Force }

    $cmdArgs = "/c set PORT=$Port && set BROWSER=none && npm start"
    $webProc = Start-Process -FilePath "cmd.exe" -ArgumentList $cmdArgs -WorkingDirectory $projectRoot -RedirectStandardOutput $webOutFile -RedirectStandardError $webErrFile -WindowStyle Hidden -PassThru
    $webServerPid = $webProc.Id
    Write-Output "React 개발 서버 구동 중 (PID: $webServerPid, 포트: $Port)..."

    # 포트 대기 (최대 30초)
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt 30) {
        try {
            $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
            if ($conn) { $webListening = $true; break }
        } catch { }
        Start-Sleep -Milliseconds 800
    }
    $sw.Stop()
    if ($webListening) {
        Write-Output "✅ React 개발 서버 포트 $Port 준비 완료."
    } else {
        Write-Warning "React 개발 서버 포트 응답 대기 중이나 프로세스는 정상 기동되었습니다."
    }
}

# 3. mobile-drop Python 수신 서버 (DropPort 8899) 구동
$dropServerPid = $null
try {
    $conn = Get-NetTCPConnection -LocalPort $DropPort -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        foreach ($c in $conn) {
            if ($c.OwningProcess -and $c.OwningProcess -gt 4) {
                Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
        Start-Sleep -Milliseconds 500
    }
} catch { }

$pyArgs = "`"$serverPy`" --port $DropPort --token $pin --device `"$Device`" --output `"$resolvedOutputDir`""
$pyProc = Start-Process -FilePath "python" -ArgumentList $pyArgs -WindowStyle Hidden -PassThru
$dropServerPid = $pyProc.Id

# 수신 서버 포트 대기 (최대 10초)
$dropListening = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Milliseconds 500
    try {
        $conn = Get-NetTCPConnection -LocalPort $DropPort -State Listen -ErrorAction SilentlyContinue
        if ($conn) { $dropListening = $true; break }
    } catch { }
}
if ($dropListening) {
    Write-Output "✅ mobile-drop 수신 서버 준비 완료 (PID: $dropServerPid, 포트: $DropPort)"
} else {
    Write-Error "mobile-drop 수신 서버 시작 실패 (포트 $DropPort 응답 없음)"
    exit 1
}

# 4. Cloudflare 터널 구동 (Web + Drop)
$cfCmd = Get-Command "cloudflared" -ErrorAction SilentlyContinue
$cfExe = if ($cfCmd) { "cloudflared" } else { "npx" }

$webCfLog = Join-Path $tempDir "cf_web.log"
$dropCfLog = Join-Path $tempDir "cf_drop.log"
if (Test-Path $webCfLog) { Remove-Item $webCfLog -Force }
if (Test-Path $dropCfLog) { Remove-Item $dropCfLog -Force }

$webCfArgs = if ($cfCmd) { "tunnel --url http://localhost:$Port" } else { "--yes cloudflared tunnel --url http://localhost:$Port" }
$dropCfArgs = if ($cfCmd) { "tunnel --url http://localhost:$DropPort" } else { "--yes cloudflared tunnel --url http://localhost:$DropPort" }

$webCfProc = Start-Process -FilePath $cfExe -ArgumentList $webCfArgs -RedirectStandardError $webCfLog -WindowStyle Hidden -PassThru
$dropCfProc = Start-Process -FilePath $cfExe -ArgumentList $dropCfArgs -RedirectStandardError $dropCfLog -WindowStyle Hidden -PassThru

# 터널 URL 대기 및 추출 (최대 20초)
$webTunnelUrl = $null
$dropTunnelUrl = $null

$cfSw = [System.Diagnostics.Stopwatch]::StartNew()
while ($cfSw.Elapsed.TotalSeconds -lt 20) {
    if (-not $webTunnelUrl -and (Test-Path $webCfLog)) {
        $log = Get-Content -Path $webCfLog -Raw -ErrorAction SilentlyContinue
        if ($log -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
            $webTunnelUrl = $matches[1]
        }
    }
    if (-not $dropTunnelUrl -and (Test-Path $dropCfLog)) {
        $log = Get-Content -Path $dropCfLog -Raw -ErrorAction SilentlyContinue
        if ($log -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
            $dropTunnelUrl = $matches[1]
        }
    }
    if ($webTunnelUrl -and $dropTunnelUrl) { break }
    Start-Sleep -Milliseconds 500
}
$cfSw.Stop()

if (-not $webTunnelUrl -or -not $dropTunnelUrl) {
    Write-Error "Cloudflare Tunnel 발급 실패 (Web: $webTunnelUrl, Drop: $dropTunnelUrl). 로그를 확인해 주세요."
    exit 1
}

# 5. 모바일 원클릭 URL 조합
$dropUploadUrl = "$dropTunnelUrl/upload"
$mobileTestUrl = "$webTunnelUrl/scan_score_test?dropUrl=$([uri]::EscapeDataString($dropUploadUrl))&dropPin=$pin&device=$([uri]::EscapeDataString($Device))"
$localTestUrl = "http://localhost:$Port/scan_score_test?dropUrl=$([uri]::EscapeDataString("http://localhost:$DropPort/upload"))&dropPin=$pin&device=$([uri]::EscapeDataString($Device))"

# 6. 세션 메타데이터 저장 (.test-session.json)
$sessionData = [ordered]@{
    started_at      = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    web_port        = $Port
    drop_port       = $DropPort
    web_tunnel_url  = $webTunnelUrl
    drop_tunnel_url = $dropTunnelUrl
    pin             = $pin
    device          = $Device
    mobile_test_url = $mobileTestUrl
    pids            = [ordered]@{
        web_server      = $webServerPid
        drop_server     = $dropServerPid
        web_cloudflared = $webCfProc.Id
        drop_cloudflared= $dropCfProc.Id
    }
}

$sessionData | ConvertTo-Json -Depth 4 | Out-File -FilePath $sessionFile -Encoding utf8

# 7. 콘솔 출력
Write-Output "================================================================="
Write-Output " 🀄 [mahjong.aquaco.work] 원클릭 모바일 테스트 세션이 시작되었습니다!"
Write-Output "================================================================="
Write-Output "WEB_TUNNEL:     $webTunnelUrl"
Write-Output "DROP_TUNNEL:    $dropTunnelUrl"
Write-Output "SECURITY_PIN:   $pin"
Write-Output "TARGET_DEVICE:  $Device"
Write-Output "STORAGE_DIR:    $resolvedOutputDir"
Write-Output "SESSION_FILE:   $sessionFile"
Write-Output "-----------------------------------------------------------------"
Write-Output "📱 모바일 원클릭 자동 페어링 링크 (스마트폰에서 탭하여 접속):"
Write-Output "   $mobileTestUrl"
Write-Output "-----------------------------------------------------------------"
Write-Output "💻 로컬 PC 테스트 링크:"
Write-Output "   $localTestUrl"
Write-Output "================================================================="
