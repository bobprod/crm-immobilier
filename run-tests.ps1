# Script de test Playwright pour le CRM Immobilier
# Ce script lance les tests end-to-end avec Playwright

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Tests E2E - CRM Immobilier Frontend" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verifier si nous sommes dans le bon repertoire
$frontendPath = "C:\Users\DELL\Desktop\CRM_IMMOBILIER_COMPLET_FINAL\frontend"

if (-Not (Test-Path $frontendPath)) {
    Write-Host "Erreur: Repertoire frontend introuvable!" -ForegroundColor Red
    Write-Host "   Chemin attendu: $frontendPath" -ForegroundColor Yellow
    exit 1
}

# Aller dans le dossier frontend
Set-Location $frontendPath
Write-Host "Repertoire: $frontendPath" -ForegroundColor Green
Write-Host ""

# Verifier si node_modules existe
if (-Not (Test-Path "node_modules")) {
    Write-Host "node_modules introuvable. Installation des dependances..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur lors de l'installation des dependances" -ForegroundColor Red
        exit 1
    }
}

# Verifier si Playwright est installe
if (-Not (Test-Path "node_modules\@playwright\test")) {
    Write-Host "Playwright introuvable. Installation..." -ForegroundColor Yellow
    npm install --save-dev @playwright/test
    npx playwright install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur lors de l'installation de Playwright" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Lancement des tests Playwright..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Options disponibles:" -ForegroundColor Yellow
Write-Host "  1. Tests normaux (headless)" -ForegroundColor White
Write-Host "  2. Tests avec interface (headed)" -ForegroundColor White
Write-Host "  3. Tests avec UI Playwright" -ForegroundColor White
Write-Host "  4. Tests d'un fichier specifique" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Votre choix (1-4)"

switch ($choice) {
    "1" {
        Write-Host "Lancement des tests headless..." -ForegroundColor Green
        npm run test:e2e
    }
    "2" {
        Write-Host "Lancement des tests avec navigateur visible..." -ForegroundColor Green
        npm run test:e2e:headed
    }
    "3" {
        Write-Host "Lancement de l'interface Playwright..." -ForegroundColor Green
        npm run test:e2e:ui
    }
    "4" {
        Write-Host "Fichiers de test disponibles:" -ForegroundColor Yellow
        Get-ChildItem tests -Filter "*.spec.ts" | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor White }
        $testFile = Read-Host "Nom du fichier (sans .spec.ts)"
        Write-Host "Lancement du test $testFile..." -ForegroundColor Green
        npx playwright test "tests/$testFile.spec.ts" --headed
    }
    default {
        Write-Host "Choix invalide" -ForegroundColor Red
        exit 1
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Tests termines avec succes!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Certains tests ont echoue" -ForegroundColor Red
    Write-Host "   Consultez le rapport HTML avec: npx playwright show-report" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
