# ============================================
# INSTALLATION POSTGRESQL 17.6 - MODE SILENCIEUX
# ============================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  INSTALLATION POSTGRESQL 17.6" -ForegroundColor Cyan  
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Paramètres d'installation
$installerPath = "$env:USERPROFILE\Downloads\postgresql-17.6-2-windows-x64.exe"
$installDir = "C:\Program Files\PostgreSQL\17"
$dataDir = "C:\Program Files\PostgreSQL\17\data"
$password = "postgres"
$port = 5432
$locale = "French, France"

# Vérifier que l'installateur existe
if (-not (Test-Path $installerPath)) {
    Write-Host "❌ ERREUR: Installateur introuvable" -ForegroundColor Red
    Write-Host "Chemin: $installerPath" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Installateur trouvé: postgresql-17.6-2-windows-x64.exe" -ForegroundColor Green
Write-Host "📦 Taille: 350 MB" -ForegroundColor Gray
Write-Host ""

# Supprimer l'installation incomplète si elle existe
if (Test-Path "C:\Program Files\PostgreSQL\17") {
    Write-Host "🗑️  Suppression de l'installation incomplète..." -ForegroundColor Yellow
    try {
        Remove-Item "C:\Program Files\PostgreSQL\17" -Recurse -Force -ErrorAction Stop
        Write-Host "✅ Ancienne installation supprimée" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Impossible de supprimer l'ancienne installation" -ForegroundColor Yellow
        Write-Host "    Continuons quand même..." -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "🚀 Lancement de l'installation..." -ForegroundColor Yellow
Write-Host "⏳ Cela peut prendre 3-5 minutes..." -ForegroundColor Gray
Write-Host ""

# Installation en mode silencieux
$arguments = @(
    "--mode", "unattended",
    "--unattendedmodeui", "minimal",
    "--prefix", "`"$installDir`"",
    "--datadir", "`"$dataDir`"",
    "--superpassword", "`"$password`"",
    "--serverport", "$port",
    "--locale", "`"$locale`"",
    "--enable-components", "server,commandlinetools,pgAdmin",
    "--disable-stackbuilder", "1"
)

try {
    $process = Start-Process -FilePath $installerPath -ArgumentList $arguments -Wait -PassThru -NoNewWindow
    
    if ($process.ExitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ INSTALLATION RÉUSSIE !" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 INFORMATIONS DE CONNEXION:" -ForegroundColor Cyan
        Write-Host "   Utilisateur : postgres" -ForegroundColor White
        Write-Host "   Mot de passe: postgres" -ForegroundColor White
        Write-Host "   Port        : 5432" -ForegroundColor White
        Write-Host "   Host        : localhost" -ForegroundColor White
        Write-Host ""
        
        # Ajouter au PATH
        Write-Host "🔧 Ajout de PostgreSQL au PATH système..." -ForegroundColor Yellow
        $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
        $pgBinPath = "C:\Program Files\PostgreSQL\17\bin"
        
        if ($currentPath -notlike "*$pgBinPath*") {
            [Environment]::SetEnvironmentVariable("Path", "$currentPath;$pgBinPath", "Machine")
            $env:Path = "$env:Path;$pgBinPath"
            Write-Host "✅ PATH mis à jour" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "🎉 PostgreSQL est maintenant installé et prêt !" -ForegroundColor Green
        Write-Host ""
        
        # Démarrer le service
        Write-Host "🔄 Démarrage du service PostgreSQL..." -ForegroundColor Yellow
        try {
            $service = Get-Service -Name "postgresql-x64-17" -ErrorAction SilentlyContinue
            if ($service) {
                Start-Service -Name "postgresql-x64-17"
                Write-Host "✅ Service PostgreSQL démarré" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "⚠️  Service non trouvé, il démarrera automatiquement" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host ""
        Write-Host "❌ ERREUR lors de l'installation (Code: $($process.ExitCode))" -ForegroundColor Red
        Write-Host "Veuillez installer manuellement en double-cliquant sur:" -ForegroundColor Yellow
        Write-Host "$installerPath" -ForegroundColor White
    }
}
catch {
    Write-Host ""
    Write-Host "❌ ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
