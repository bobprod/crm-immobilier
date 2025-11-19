# ============================================
# NETTOYAGE POST-MIGRATION DDD
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NETTOYAGE ARCHITECTURE DDD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = "C:\Users\DELL\Desktop\CRM_IMMOBILIER_COMPLET_FINAL\backend"
Set-Location $backendPath

# Liste des dossiers obsolètes (anciens modules)
$oldModules = @(
    "ai-metrics",
    "analytics",
    "appointments",
    "auth",
    "campaigns",
    "communications",
    "dashboard",
    "documents",
    "integrations",
    "llm-config",
    "marketing-tracking",
    "matching",
    "page-builder",
    "properties",
    "prospecting",
    "prospects",
    "public-vitrine",
    "seo-ai",
    "settings",
    "tasks",
    "users",
    "validation"
)

# Fichiers obsolètes à la racine
$oldFiles = @(
    "app.controller.ts",
    "app.module.ts",
    "app.module.CORRIGE.ts",
    "app.service.ts",
    "main.ts",
    "auto-correction-simple.ps1",
    "auto-correction.ps1",
    "fix-all-imports.ps1",
    "fix-imports.ps1",
    "fix-paths.ps1",
    "MIGRATE_MODULES.bat",
    "RESTRUCTURER.bat"
)

Write-Host "[1/3] Suppression des anciens modules..." -ForegroundColor Yellow
$deletedFolders = 0
foreach ($module in $oldModules) {
    $modulePath = Join-Path $backendPath $module
    if (Test-Path $modulePath) {
        try {
            Remove-Item $modulePath -Recurse -Force -ErrorAction Stop
            Write-Host "  Supprime: $module/" -ForegroundColor Green
            $deletedFolders++
        }
        catch {
            Write-Host "  Erreur: $module/ - $_" -ForegroundColor Red
        }
    }
}
Write-Host "  Total: $deletedFolders dossiers supprimes" -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] Suppression des fichiers obsoletes..." -ForegroundColor Yellow
$deletedFiles = 0
foreach ($file in $oldFiles) {
    $filePath = Join-Path $backendPath $file
    if (Test-Path $filePath) {
        try {
            Remove-Item $filePath -Force -ErrorAction Stop
            Write-Host "  Supprime: $file" -ForegroundColor Green
            $deletedFiles++
        }
        catch {
            Write-Host "  Erreur: $file - $_" -ForegroundColor Red
        }
    }
}
Write-Host "  Total: $deletedFiles fichiers supprimes" -ForegroundColor Green
Write-Host ""

Write-Host "[3/3] Nettoyage fichiers temporaires..." -ForegroundColor Yellow

# Supprimer fichiers .old et .bak
$tempFiles = Get-ChildItem -Path $backendPath -Recurse -Include "*.old", "*.bak" -File
$deletedTemp = 0
foreach ($file in $tempFiles) {
    try {
        Remove-Item $file.FullName -Force -ErrorAction Stop
        Write-Host "  Supprime: $($file.Name)" -ForegroundColor Green
        $deletedTemp++
    }
    catch {
        Write-Host "  Erreur: $($file.Name) - $_" -ForegroundColor Red
    }
}
Write-Host "  Total: $deletedTemp fichiers temporaires supprimes" -ForegroundColor Green
Write-Host ""

# Résumé
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NETTOYAGE TERMINE !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Statistiques:" -ForegroundColor Yellow
Write-Host "  Dossiers supprimes : $deletedFolders" -ForegroundColor White
Write-Host "  Fichiers supprimes : $deletedFiles" -ForegroundColor White
Write-Host "  Fichiers temp      : $deletedTemp" -ForegroundColor White
Write-Host ""
Write-Host "Structure actuelle:" -ForegroundColor Yellow
Write-Host "  src/modules/       : Architecture DDD" -ForegroundColor Green
Write-Host "  prisma/            : Base de donnees" -ForegroundColor Green
Write-Host "  dist/              : Build compile" -ForegroundColor Green
Write-Host ""

# Vérification que src/ existe
if (Test-Path "src") {
    Write-Host "Architecture DDD intacte dans src/" -ForegroundColor Green
} else {
    Write-Host "ATTENTION: Dossier src/ introuvable!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
