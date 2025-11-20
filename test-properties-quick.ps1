# Test rapide pour Properties uniquement
# Lance uniquement le test properties.spec.ts avec navigateur visible

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Test Rapide - Properties Module" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$frontendPath = "C:\Users\DELL\Desktop\CRM_IMMOBILIER_COMPLET_FINAL\frontend"
Set-Location $frontendPath

Write-Host "Repertoire: $frontendPath" -ForegroundColor Green
Write-Host ""

Write-Host "Lancement du test Properties avec navigateur visible..." -ForegroundColor Cyan
Write-Host ""

npx playwright test tests/properties.spec.ts --headed --reporter=list

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan

if ($exitCode -eq 0) {
    Write-Host "Test Properties reussi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines etapes:" -ForegroundColor Yellow
    Write-Host "  1. Tester manuellement dans le navigateur:" -ForegroundColor White
    Write-Host "     http://localhost:3003/properties?testMode=true" -ForegroundColor Cyan
    Write-Host "  2. Continuer avec les autres modules" -ForegroundColor White
} else {
    Write-Host "Test Properties echoue" -ForegroundColor Red
    Write-Host ""
    Write-Host "Actions de debogage:" -ForegroundColor Yellow
    Write-Host "  1. Consulter le rapport: npx playwright show-report" -ForegroundColor White
    Write-Host "  2. Verifier manuellement:" -ForegroundColor White
    Write-Host "     http://localhost:3003/properties?testMode=true" -ForegroundColor Cyan
    Write-Host "  3. Lancer le diagnostic: ..\diagnose-tests.ps1" -ForegroundColor White
    Write-Host "  4. Debugger: npx playwright test tests/properties.spec.ts --debug" -ForegroundColor White
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan

exit $exitCode
