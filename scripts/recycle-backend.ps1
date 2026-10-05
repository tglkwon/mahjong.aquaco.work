param(
    [int]$Port = 3001
)

$ErrorActionPreference = "SilentlyContinue"
$projectRoot = (Resolve-Path "$PSScriptRoot\..").Path

$conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    foreach ($c in $conn) {
        if ($c.OwningProcess -and $c.OwningProcess -gt 4) {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Milliseconds 800
}

$proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c node server/index.js" -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
Start-Sleep -Milliseconds 1500

$newConn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($newConn) {
    Write-Output "BACKEND_RECYCLED: PID $($newConn[0].OwningProcess) on port $Port"
} else {
    Write-Output "BACKEND_STARTED: PID $($proc.Id) (listening check pending)"
}
