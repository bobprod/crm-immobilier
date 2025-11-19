# ============================================
# SAUVEGARDE AVANT NETTOYAGE
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SAUVEGARDE COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = "C:\Users\DELL\Desktop\CRM_IMMOBILIER_COMPLET_FINAL\backend"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "C:\Users\DELL\Desktop\CRM_IMMOBILIER_COMPLET_FINAL\BACKUP_AVANT_NETTOYAGE_$timestamp"

Write-Host "Creation de la sauvegarde..." -ForegroundColor Yellow
Write-Host "Source : $backendPath" -ForegroundColor Gray
Write-Host "Destination : $backupPath" -ForegroundColor Gray
Write-Host ""

# Liste des dossiers à sauvegarder (ancienne structure uniquement)
$foldersToBackup = @(
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

# Fichiers à sauvegarder
$filesToBackup = @(
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

# Créer le dossier de sauvegarde
New-Item -Path $backupPath -ItemType Directory -Force | Out-Null

# Sauvegarder les dossiers
Write-Host "[1/3] Sauvegarde des anciens modules..." -ForegroundColor Yellow
$savedFolders = 0
foreach ($folder in $foldersToBackup) {
    $sourcePath = Join-Path $backendPath $folder
    $destPath = Join-Path $backupPath $folder
    
    if (Test-Path $sourcePath) {
        try {
            Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
            Write-Host "  Sauvegarde: $folder/" -ForegroundColor Green
            $savedFolders++
        }
        catch {
            Write-Host "  Erreur: $folder/ - $_" -ForegroundColor Red
        }
    }
}
Write-Host "  Total: $savedFolders dossiers sauvegardes" -ForegroundColor Green
Write-Host ""

# Sauvegarder les fichiers
Write-Host "[2/3] Sauvegarde des fichiers obsoletes..." -ForegroundColor Yellow
$savedFiles = 0
foreach ($file in $filesToBackup) {
    $sourcePath = Join-Path $backendPath $file
    $destPath = Join-Path $backupPath $file
    
    if (Test-Path $sourcePath) {
        try {
            Copy-Item -Path $sourcePath -Destination $destPath -Force
            Write-Host "  Sauvegarde: $file" -ForegroundColor Green
            $savedFiles++
        }
        catch {
            Write-Host "  Erreur: $file - $_" -ForegroundColor Red
        }
    }
}
Write-Host "  Total: $savedFiles fichiers sauvegardes" -ForegroundColor Green
Write-Host ""

# Sauvegarder fichiers .old et .bak
Write-Host "[3/3] Sauvegarde fichiers temporaires..." -ForegroundColor Yellow
$tempFiles = Get-ChildItem -Path $backendPath -Recurse -Include "*.old", "*.bak" -File
$savedTemp = 0

if ($tempFiles.Count -gt 0) {
    $tempBackupPath = Join-Path $backupPath "temp_files"
    New-Item -Path $tempBackupPath -ItemType Directory -Force | Out-Null
    
    foreach ($file in $tempFiles) {
        try {
            $relativePath = $file.FullName.Replace($backendPath, "").TrimStart("\")
            $destFile = Join-Path $tempBackupPath $relativePath
            $destDir = Split-Path $destFile -Parent
            
            if (-not (Test-Path $destDir)) {
                New-Item -Path $destDir -ItemType Directory -Force | Out-Null
            }
            
            Copy-Item -Path $file.FullName -Destination $destFile -Force
            Write-Host "  Sauvegarde: $($file.Name)" -ForegroundColor Green
            $savedTemp++
        }
        catch {
            Write-Host "  Erreur: $($file.Name) - $_" -ForegroundColor Red
        }
    }
}
Write-Host "  Total: $savedTemp fichiers temporaires sauvegardes" -ForegroundColor Green
Write-Host ""

# Calculer la taille de la sauvegarde
$backupSize = (Get-ChildItem -Path $backupPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB

# Résumé
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SAUVEGARDE TERMINEE !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Statistiques:" -ForegroundColor Yellow
Write-Host "  Dossiers sauvegardes : $savedFolders" -ForegroundColor White
Write-Host "  Fichiers sauvegardes : $savedFiles" -ForegroundColor White
Write-Host "  Fichiers temp        : $savedTemp" -ForegroundColor White
Write-Host "  Taille totale        : $([math]::Round($backupSize, 2)) MB" -ForegroundColor White
Write-Host ""
Write-Host "Emplacement sauvegarde:" -ForegroundColor Yellow
Write-Host "  $backupPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pret pour le nettoyage!" -ForegroundColor Green
Write-Host ""
