<#
pgadmin_fix.ps1
Usage (PowerShell as admin):
  powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\pgadmin_fix.ps1 [-AutoKill]

Options:
  -AutoKill    : if a process is listening on the pgAdmin port, kill it automatically

This script will:
 - Check existence of the pgAdmin python executable and web script
 - Backup %APPDATA%\pgadmin4\config.json and pgadmin4.db if present
 - Show last 200 lines of pgadmin4.log if present
 - Check port 64091 and optionally kill the process using it
 - Start pgAdmin using the bundled python executable
#>
param(
    [switch]$AutoKill
)
$exe = "C:\Program Files\PostgreSQL\17\pgAdmin 4\python\python.exe"
$web = "C:\Program Files\PostgreSQL\17\pgAdmin 4\web\pgAdmin4.py"
Write-Host "TEST_EXE:" -NoNewline; Write-Host (Test-Path $exe)
Write-Host "PGADMIN DIR contents:"
Get-ChildItem "C:\Program Files\PostgreSQL\17\pgAdmin 4" -ErrorAction SilentlyContinue | Select-Object Name,Mode,Length
$appdata = Join-Path $env:APPDATA 'pgadmin4'
Write-Host "APPDATA DIR:" $appdata
if (Test-Path $appdata) {
    Write-Host "Contents of $appdata :"
    Get-ChildItem $appdata | Select-Object Name,LastWriteTime
    $cfg = Join-Path $appdata 'config.json'
    if (Test-Path $cfg) {
        $bak = Join-Path $appdata ('config.json.' + (Get-Date -Format 'yyyyMMddHHmmss') + '.bak')
        Copy-Item -Path $cfg -Destination $bak -Force
        Write-Host "Backed up config.json ->" $bak
    } else { Write-Host "No config.json found" }
    $db = Join-Path $appdata 'pgadmin4.db'
    if (Test-Path $db) {
        $bakdb = Join-Path $appdata ('pgadmin4.db.' + (Get-Date -Format 'yyyyMMddHHmmss') + '.bak')
        Copy-Item -Path $db -Destination $bakdb -Force
        Write-Host "Backed up pgadmin4.db ->" $bakdb
    } else { Write-Host "No pgadmin4.db found" }
    $log = Join-Path $appdata 'pgadmin4.log'
    if (Test-Path $log) {
        Write-Host '--- Last 200 lines of pgadmin4.log ---'
        Get-Content $log -Tail 200
    } else { Write-Host "No pgadmin4.log found" }
} else {
    Write-Host "APPDATA pgadmin4 not found. pgAdmin may not have created user config yet."
}
# Check port
$port = 64091
Write-Host "--- Check port $port (listening processes) ---"
$net = netstat -ano | findstr $port
if ($net) { Write-Host $net } else { Write-Host "No listening process found on port $port" }
# If there's a PID, extract and optionally kill
if ($net) {
    $pids = ($net -split '\n' | ForEach-Object { ($_ -split '\s+')[-1] }) | Sort-Object -Unique
    Write-Host "Found PID(s):" ($pids -join ', ')
    if ($AutoKill) {
        foreach ($pid in $pids) {
            try {
                Write-Host "Killing PID $pid ..."
                Stop-Process -Id $pid -Force -ErrorAction Stop
                Write-Host "Killed $pid"
            } catch {
                Write-Host "Failed to kill PID $pid: $_"
            }
        }
    } else {
        Write-Host "Run with -AutoKill to terminate these processes automatically."
    }
}
# Start pgAdmin
if ((Test-Path $exe) -and (Test-Path $web)) {
    Write-Host "Attempting to start pgAdmin (background)..."
    try {
        $proc = Start-Process -FilePath $exe -ArgumentList $web -WindowStyle Hidden -PassThru
        Write-Host "Started pgAdmin process Id:" $proc.Id
        Start-Sleep -Seconds 3
        Write-Host 'Netstat (after start):'
        netstat -ano | findstr $port
    } catch {
        Write-Host "Failed to start pgAdmin: $_"
    }
} else {
    Write-Host "Cannot start pgAdmin: python exe or web script not found. Please reinstall pgAdmin or correct paths."
}
Write-Host "Script completed. If pgAdmin still fails, check Windows Event Viewer and pgAdmin logs in $appdata."
