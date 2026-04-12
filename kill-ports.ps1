$ports = @(3000, 3001, 3002)
foreach ($p in $ports) {
    $lines = netstat -ano | Select-String ":$p " | Select-String "LISTENING"
    foreach ($line in $lines) {
        $parts = ($line -split '\s+')
        $pid = $parts[-1]
        if ($pid -match '^\d+$' -and $pid -ne '0') {
            taskkill /F /PID $pid 2>$null
            Write-Host "Killed PID $pid on :$p"
        }
    }
}
