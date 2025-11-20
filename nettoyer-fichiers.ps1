# Script de nettoyage - Supprime les fichiers de documentation redondants
# Garde uniquement les fichiers essentiels

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  Nettoyage des Fichiers Redondants" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$basePath = "C:\Users\DELL\Desktop\CRM_IMMOBILIER_COMPLET_FINAL"

# Fichiers à GARDER (essentiels)
$fichiersEssentiels = @(
    "README.md",                    # Point d'entrée principal
    "START_HERE.md",                # Guide de démarrage
    "TERMINE.txt",                  # Récapitulatif final
    "GUIDE_PROCHAINES_ETAPES.md",   # Plan pour les modules
    "test-properties-quick.ps1",    # Script de test rapide
    "diagnose-tests.ps1",           # Script de diagnostic
    "run-tests.ps1"                 # Script interactif
)

# Fichiers à SUPPRIMER (redondants)
$fichiersASupprimer = @(
    "INDEX.md",
    "CARTE_NAVIGATION.md",
    "CHECKLIST_FINALE.md",
    "GUIDE_CORRECTION_TESTS.md",
    "LISTE_FICHIERS.md",
    "README_CORRECTIONS.md",
    "RECAP_VISUEL.md",
    "RESUME_COMPACT.txt",
    "RAPPORT_ANALYSE_FRONTEND.txt",
    "RAPPORT_CORRECTIONS_AUTHETIFICATION.md",
    "analyze-deps-simple.ps1",
    "analyze-frontend-deps.ps1",
    "complete-frontend.ps1",
    "validate-frontend.ps1"
)

Write-Host "📋 Fichiers qui seront GARDÉS:" -ForegroundColor Green
foreach ($fichier in $fichiersEssentiels) {
    Write-Host "  ✅ $fichier" -ForegroundColor Green
}

Write-Host ""
Write-Host "🗑️  Fichiers qui seront SUPPRIMÉS:" -ForegroundColor Yellow
foreach ($fichier in $fichiersASupprimer) {
    $fullPath = Join-Path $basePath $fichier
    if (Test-Path $fullPath) {
        Write-Host "  ❌ $fichier" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "⚠️  ATTENTION: Cette opération est IRRÉVERSIBLE!" -ForegroundColor Red
Write-Host ""
$confirmation = Read-Host "Voulez-vous continuer? (oui/non)"

if ($confirmation -eq "oui") {
    Write-Host ""
    Write-Host "🗑️  Suppression en cours..." -ForegroundColor Yellow
    
    $supprimés = 0
    foreach ($fichier in $fichiersASupprimer) {
        $fullPath = Join-Path $basePath $fichier
        if (Test-Path $fullPath) {
            try {
                Remove-Item $fullPath -Force
                Write-Host "  ✅ Supprimé: $fichier" -ForegroundColor Green
                $supprimés++
            } catch {
                Write-Host "  ❌ Erreur: $fichier - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
    Write-Host ""
    Write-Host "✅ Nettoyage terminé!" -ForegroundColor Green
    Write-Host "   $supprimés fichiers supprimés" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Fichiers restants:" -ForegroundColor Cyan
    Get-ChildItem $basePath -Filter "*.md" | ForEach-Object { Write-Host "  📄 $($_.Name)" -ForegroundColor White }
    Get-ChildItem $basePath -Filter "*.txt" | ForEach-Object { Write-Host "  📄 $($_.Name)" -ForegroundColor White }
    Get-ChildItem $basePath -Filter "*.ps1" | ForEach-Object { Write-Host "  🔧 $($_.Name)" -ForegroundColor White }
    
} else {
    Write-Host ""
    Write-Host "❌ Opération annulée" -ForegroundColor Red
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
