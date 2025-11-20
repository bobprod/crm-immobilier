# ============================================
# Script de Validation Frontend CRM
# ============================================
# Description: Vérifie la conformité DDD et teste les modules créés
# Auteur: Assistant Claude
# Date: 2025-11-19
# ============================================

Write-Host ""
Write-Host "🔍 VALIDATION FRONTEND - CRM IMMOBILIER" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = "C:\Users\DELL\Desktop\CRM_IMMOBILIER_COMPLET_FINAL"
$FrontendRoot = "$ProjectRoot\frontend"
$ErrorCount = 0
$WarningCount = 0
$SuccessCount = 0

# ============================================
# FONCTION: Test de fichier
# ============================================
function Test-FileExists {
    param(
        [string]$Path,
        [string]$Description
    )
    
    if (Test-Path $Path) {
        Write-Host "   ✅ $Description" -ForegroundColor Green
        $script:SuccessCount++
        return $true
    } else {
        Write-Host "   ❌ $Description - MANQUANT" -ForegroundColor Red
        Write-Host "      Chemin: $Path" -ForegroundColor Gray
        $script:ErrorCount++
        return $false
    }
}

# ============================================
# FONCTION: Test de contenu
# ============================================
function Test-FileContent {
    param(
        [string]$Path,
        [string]$Pattern,
        [string]$Description
    )
    
    if (Test-Path $Path) {
        $content = Get-Content $Path -Raw -ErrorAction SilentlyContinue
        if ($content -match $Pattern) {
            Write-Host "   ✅ $Description" -ForegroundColor Green
            $script:SuccessCount++
            return $true
        } else {
            Write-Host "   ⚠️  $Description - PATTERN NON TROUVÉ" -ForegroundColor Yellow
            $script:WarningCount++
            return $false
        }
    } else {
        Write-Host "   ❌ $Description - FICHIER MANQUANT" -ForegroundColor Red
        $script:ErrorCount++
        return $false
    }
}

# ============================================
# ÉTAPE 1: Vérification de la structure
# ============================================
Write-Host "📁 ÉTAPE 1: Vérification de la structure des dossiers" -ForegroundColor Cyan
Write-Host ""

$RequiredDirs = @(
    @{Path="$FrontendRoot\src\pages\prospects-conversion"; Desc="Dossier Prospects Conversion"},
    @{Path="$FrontendRoot\src\pages\ai-metrics"; Desc="Dossier AI Metrics"},
    @{Path="$FrontendRoot\src\shared\utils"; Desc="Dossier Services API"},
    @{Path="$FrontendRoot\src\shared\components"; Desc="Dossier Composants"},
    @{Path="$FrontendRoot\src\shared\types"; Desc="Dossier Types TypeScript"}
)

foreach ($dir in $RequiredDirs) {
    Test-FileExists -Path $dir.Path -Description $dir.Desc | Out-Null
}

Write-Host ""

# ============================================
# ÉTAPE 2: Vérification des fichiers créés
# ============================================
Write-Host "📄 ÉTAPE 2: Vérification des fichiers du module Prospects Conversion" -ForegroundColor Cyan
Write-Host ""

$ProspectsFiles = @(
    @{Path="$FrontendRoot\src\pages\prospects-conversion\index.tsx"; Desc="Page Dashboard Conversions"},
    @{Path="$FrontendRoot\src\pages\prospects-conversion\[prospectId].tsx"; Desc="Page Détail Prospect"},
    @{Path="$FrontendRoot\src\shared\utils\prospects-conversion-api.ts"; Desc="Service API Conversions"}
)

foreach ($file in $ProspectsFiles) {
    Test-FileExists -Path $file.Path -Description $file.Desc | Out-Null
}

Write-Host ""

# ============================================
# ÉTAPE 3: Vérification du module AI Metrics
# ============================================
Write-Host "📊 ÉTAPE 3: Vérification du module AI Metrics" -ForegroundColor Cyan
Write-Host ""

$AiMetricsFiles = @(
    @{Path="$FrontendRoot\src\pages\ai-metrics\index.tsx"; Desc="Page Dashboard AI Metrics"},
    @{Path="$FrontendRoot\src\shared\utils\ai-metrics-api.ts"; Desc="Service API AI Metrics"}
)

foreach ($file in $AiMetricsFiles) {
    Test-FileExists -Path $file.Path -Description $file.Desc | Out-Null
}

Write-Host ""

# ============================================
# ÉTAPE 4: Vérification des imports
# ============================================
Write-Host "🔗 ÉTAPE 4: Vérification des imports et dépendances" -ForegroundColor Cyan
Write-Host ""

# Test imports page index
Test-FileContent `
    -Path "$FrontendRoot\src\pages\prospects-conversion\index.tsx" `
    -Pattern "from '@/shared/utils/prospects-conversion-api'" `
    -Description "Import API correct (index.tsx)" | Out-Null

# Test imports page detail
$detailPath = "$FrontendRoot\src\pages\prospects-conversion\[prospectId].tsx"
if (Test-Path $detailPath) {
    $content = Get-Content $detailPath -Raw
    if ($content -match "from '@/services/prospects-conversion-api'") {
        Write-Host "   ⚠️  Import incorrect détecté dans [prospectId].tsx" -ForegroundColor Yellow
        Write-Host "      Trouvé: '@/services/prospects-conversion-api'" -ForegroundColor Gray
        Write-Host "      Attendu: '@/shared/utils/prospects-conversion-api'" -ForegroundColor Gray
        $script:WarningCount++
    } elseif ($content -match "from '@/shared/utils/prospects-conversion-api'") {
        Write-Host "   ✅ Import API correct ([prospectId].tsx)" -ForegroundColor Green
        $script:SuccessCount++
    }
}

# Test Material-UI vs Shadcn/UI
Test-FileContent `
    -Path "$FrontendRoot\src\pages\prospects-conversion\[prospectId].tsx" `
    -Pattern "@mui/material" `
    -Description "Utilisation Material-UI détectée" | Out-Null

Test-FileContent `
    -Path "$FrontendRoot\src\pages\prospects-conversion\index.tsx" `
    -Pattern "@/shared/components/ui/" `
    -Description "Utilisation Shadcn/UI détectée" | Out-Null

Write-Host ""

# ============================================
# ÉTAPE 5: Vérification de package.json
# ============================================
Write-Host "📦 ÉTAPE 5: Vérification des dépendances" -ForegroundColor Cyan
Write-Host ""

$packageJsonPath = "$FrontendRoot\package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    
    # Vérifier Next.js
    if ($packageJson.dependencies.next) {
        Write-Host "   ✅ Next.js: $($packageJson.dependencies.next)" -ForegroundColor Green
        $script:SuccessCount++
    }
    
    # Vérifier React
    if ($packageJson.dependencies.react) {
        Write-Host "   ✅ React: $($packageJson.dependencies.react)" -ForegroundColor Green
        $script:SuccessCount++
    }
    
    # Vérifier TypeScript
    if ($packageJson.devDependencies.typescript) {
        Write-Host "   ✅ TypeScript: $($packageJson.devDependencies.typescript)" -ForegroundColor Green
        $script:SuccessCount++
    }
    
    # Vérifier Material-UI
    if ($packageJson.dependencies.'@mui/material') {
        Write-Host "   ✅ Material-UI: $($packageJson.dependencies.'@mui/material')" -ForegroundColor Green
        $script:SuccessCount++
    } else {
        Write-Host "   ⚠️  Material-UI non trouvé (requis pour [prospectId].tsx)" -ForegroundColor Yellow
        $script:WarningCount++
    }
    
    # Vérifier Recharts (pour AI Metrics)
    if ($packageJson.dependencies.recharts) {
        Write-Host "   ✅ Recharts: $($packageJson.dependencies.recharts)" -ForegroundColor Green
        $script:SuccessCount++
    } else {
        Write-Host "   ⚠️  Recharts non trouvé (requis pour ai-metrics)" -ForegroundColor Yellow
        $script:WarningCount++
    }
    
} else {
    Write-Host "   ❌ package.json introuvable" -ForegroundColor Red
    $script:ErrorCount++
}

Write-Host ""

# ============================================
# ÉTAPE 6: Test de taille des fichiers
# ============================================
Write-Host "📏 ÉTAPE 6: Vérification de la taille des fichiers" -ForegroundColor Cyan
Write-Host ""

$FilesToCheck = @(
    @{Path="$FrontendRoot\src\pages\prospects-conversion\index.tsx"; MinSize=1000; Desc="index.tsx"},
    @{Path="$FrontendRoot\src\pages\prospects-conversion\[prospectId].tsx"; MinSize=10000; Desc="[prospectId].tsx"},
    @{Path="$FrontendRoot\src\pages\ai-metrics\index.tsx"; MinSize=5000; Desc="ai-metrics/index.tsx"}
)

foreach ($file in $FilesToCheck) {
    if (Test-Path $file.Path) {
        $size = (Get-Item $file.Path).Length
        if ($size -gt $file.MinSize) {
            Write-Host "   ✅ $($file.Desc): $([math]::Round($size/1KB, 2)) KB" -ForegroundColor Green
            $script:SuccessCount++
        } else {
            Write-Host "   ⚠️  $($file.Desc): $([math]::Round($size/1KB, 2)) KB (potentiellement incomplet)" -ForegroundColor Yellow
            $script:WarningCount++
        }
    }
}

Write-Host ""

# ============================================
# ÉTAPE 7: Recommandations
# ============================================
Write-Host "💡 ÉTAPE 7: Recommandations" -ForegroundColor Cyan
Write-Host ""

if ($WarningCount -gt 0) {
    Write-Host "   📋 ACTIONS RECOMMANDÉES:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   1. Corriger l'import dans [prospectId].tsx:" -ForegroundColor White
    Write-Host "      Remplacer: import { prospectsConversionApi } from '@/services/prospects-conversion-api';" -ForegroundColor Gray
    Write-Host "      Par: import { prospectsConversionApi } from '@/shared/utils/prospects-conversion-api';" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Harmoniser l'UI (choisir entre Material-UI et Shadcn/UI):" -ForegroundColor White
    Write-Host "      Option A: Migrer [prospectId].tsx vers Shadcn/UI" -ForegroundColor Gray
    Write-Host "      Option B: Migrer index.tsx vers Material-UI" -ForegroundColor Gray
    Write-Host ""
    
    if ($packageJson.dependencies.'@mui/material' -eq $null) {
        Write-Host "   3. Installer Material-UI:" -ForegroundColor White
        Write-Host "      npm install @mui/material @emotion/react @emotion/styled @mui/icons-material" -ForegroundColor Gray
        Write-Host ""
    }
    
    if ($packageJson.dependencies.recharts -eq $null) {
        Write-Host "   4. Installer Recharts (pour AI Metrics):" -ForegroundColor White
        Write-Host "      npm install recharts" -ForegroundColor Gray
        Write-Host ""
    }
}

# ============================================
# RAPPORT FINAL
# ============================================
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "📊 RAPPORT FINAL" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Succès:         $SuccessCount tests" -ForegroundColor Green
Write-Host "⚠️  Avertissements: $WarningCount tests" -ForegroundColor Yellow
Write-Host "❌ Erreurs:        $ErrorCount tests" -ForegroundColor Red
Write-Host ""

$TotalTests = $SuccessCount + $WarningCount + $ErrorCount
$SuccessRate = [math]::Round(($SuccessCount / $TotalTests) * 100, 1)

Write-Host "Taux de réussite: $SuccessRate%" -ForegroundColor $(if ($SuccessRate -ge 80) { "Green" } elseif ($SuccessRate -ge 60) { "Yellow" } else { "Red" })
Write-Host ""

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "🎉 VALIDATION RÉUSSIE ! Le frontend est prêt pour les tests." -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "1. Démarrer le serveur: npm run dev" -ForegroundColor White
    Write-Host "2. Visiter: http://localhost:3003/prospects-conversion" -ForegroundColor White
    Write-Host "3. Visiter: http://localhost:3003/ai-metrics" -ForegroundColor White
} elseif ($ErrorCount -eq 0) {
    Write-Host "⚠️  VALIDATION PARTIELLE - Quelques ajustements recommandés." -ForegroundColor Yellow
    Write-Host "Le frontend devrait fonctionner, mais vérifiez les avertissements ci-dessus." -ForegroundColor Yellow
} else {
    Write-Host "❌ VALIDATION ÉCHOUÉE - Fichiers manquants critiques." -ForegroundColor Red
    Write-Host "Veuillez corriger les erreurs avant de continuer." -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
