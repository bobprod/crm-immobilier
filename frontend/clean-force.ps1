# Script de nettoyage robuste pour Windows
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " NETTOYAGE FORCE - CRM IMMOBILIER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour supprimer avec retry
function Remove-WithRetry {
    param($Path, $Name)
    
    if (Test-Path $Path) {
        Write-Host "[*] Suppression de $Name..." -ForegroundColor Yellow
        try {
            # Tentative 1: Suppression normale
            Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
            Write-Host "[✓] $Name supprime avec succes" -ForegroundColor Green
        }
        catch {
            Write-Host "[!] Tentative 2: Suppression avec robocopy..." -ForegroundColor Yellow
            # Créer un dossier vide temporaire
            $emptyDir = Join-Path $env:TEMP "empty_$(Get-Random)"
            New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
            # Utiliser robocopy pour "vider" le dossier
            robocopy $emptyDir $Path /MIR /R:0 /W:0 | Out-Null
            Remove-Item -Path $emptyDir -Force
            Remove-Item -Path $Path -Force
            Write-Host "[✓] $Name supprime avec robocopy" -ForegroundColor Green
        }
    }
    else {
        Write-Host "[✓] $Name deja absent" -ForegroundColor Green
    }
}

# Suppression du cache .next
Remove-WithRetry -Path ".next" -Name "Cache .next"

# Suppression de node_modules
Remove-WithRetry -Path "node_modules" -Name "node_modules"

# Suppression de package-lock.json
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force
    Write-Host "[✓] package-lock.json supprime" -ForegroundColor Green
}
else {
    Write-Host "[✓] package-lock.json deja absent" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " NETTOYAGE TERMINE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaine etape: npm install" -ForegroundColor Yellow
