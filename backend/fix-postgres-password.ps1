Write-Host "Reinitialisation mot de passe PostgreSQL" -ForegroundColor Cyan
Write-Host ""

# Arreter le service
Write-Host "Arret du service PostgreSQL..." -ForegroundColor Yellow
Stop-Service -Name "postgresql-x64-17" -Force
Start-Sleep -Seconds 2
Write-Host "Service arrete" -ForegroundColor Green

# Modifier pg_hba.conf pour autoriser sans mot de passe temporairement
$pgHbaPath = "C:\Program Files\PostgreSQL\17\data\pg_hba.conf"
Write-Host "Modification pg_hba.conf..." -ForegroundColor Yellow

# Backup
Copy-Item $pgHbaPath "$pgHbaPath.backup"

# Lire et modifier
$content = Get-Content $pgHbaPath
$newContent = @()
foreach ($line in $content) {
    if ($line -match "^host.*all.*all.*127.0.0.1") {
        $newContent += "host    all             all             127.0.0.1/32            trust"
    }
    elseif ($line -match "^host.*all.*all.*::1") {
        $newContent += "host    all             all             ::1/128                 trust"
    }
    else {
        $newContent += $line
    }
}
$newContent | Set-Content $pgHbaPath

Write-Host "Configuration modifiee" -ForegroundColor Green

# Redemarrer
Write-Host "Redemarrage du service..." -ForegroundColor Yellow
Start-Service -Name "postgresql-x64-17"
Start-Sleep -Seconds 3
Write-Host "Service redemarre" -ForegroundColor Green

# Changer le mot de passe
Write-Host "Changement du mot de passe..." -ForegroundColor Yellow
$changePwd = & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Mot de passe change avec succes" -ForegroundColor Green
} else {
    Write-Host "Erreur: $changePwd" -ForegroundColor Red
}

# Restaurer pg_hba.conf en mode md5
Write-Host "Restauration securite..." -ForegroundColor Yellow
$content = Get-Content $pgHbaPath
$newContent = @()
foreach ($line in $content) {
    if ($line -match "^host.*all.*all.*127.0.0.1.*trust") {
        $newContent += "host    all             all             127.0.0.1/32            scram-sha-256"
    }
    elseif ($line -match "^host.*all.*all.*::1.*trust") {
        $newContent += "host    all             all             ::1/128                 scram-sha-256"
    }
    else {
        $newContent += $line
    }
}
$newContent | Set-Content $pgHbaPath

# Redemarrer une derniere fois
Write-Host "Redemarrage final..." -ForegroundColor Yellow
Restart-Service -Name "postgresql-x64-17"
Start-Sleep -Seconds 3
Write-Host "Service redemarre" -ForegroundColor Green

# Test final
Write-Host ""
Write-Host "Test de connexion..." -ForegroundColor Yellow
$env:PGPASSWORD = "postgres"
$test = & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d postgres -c "SELECT 'Connexion OK' as status;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCES ! PostgreSQL est pret" -ForegroundColor Green
    Write-Host "Mot de passe: postgres" -ForegroundColor Cyan
} else {
    Write-Host "Erreur: $test" -ForegroundColor Red
}

Write-Host ""
