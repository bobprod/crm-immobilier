# Script de génération du client Prisma
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "GENERATION DU CLIENT PRISMA" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "C:\Users\DELL\Desktop\CRM_IMMOBILIER_COMPLET_FINAL\backend"

Write-Host "Repertoire actuel:" -ForegroundColor Yellow
Get-Location

Write-Host ""
Write-Host "Lancement de la generation..." -ForegroundColor Yellow
Write-Host ""

try {
    & npx prisma generate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Green
        Write-Host "GENERATION REUSSIE !" -ForegroundColor Green
        Write-Host "============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Le client Prisma a ete genere avec succes." -ForegroundColor Green
        Write-Host "Vous pouvez maintenant compiler le projet avec: npm run build" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Red
        Write-Host "ERREUR LORS DE LA GENERATION" -ForegroundColor Red
        Write-Host "============================================" -ForegroundColor Red
        Write-Host "Code de sortie: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "ERREUR" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
