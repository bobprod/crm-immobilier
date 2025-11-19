# ============================================
# SCRIPT D'INSTALLATION POSTGRESQL
# ============================================
# Ce script doit être exécuté en tant qu'ADMINISTRATEUR
# Clic droit -> Exécuter en tant qu'administrateur

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  INSTALLATION POSTGRESQL POUR CRM" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier les droits administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERREUR : Ce script doit être exécuté en tant qu'ADMINISTRATEUR" -ForegroundColor Red
    Write-Host ""
    Write-Host "Clic droit sur le script -> Exécuter en tant qu'administrateur" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ Droits administrateur détectés" -ForegroundColor Green
Write-Host ""

# Vérifier si Chocolatey est installé
Write-Host "📦 Vérification de Chocolatey..." -ForegroundColor Yellow
try {
    $chocoVersion = choco --version 2>$null
    Write-Host "✅ Chocolatey $chocoVersion détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Chocolatey n'est pas installé" -ForegroundColor Red
    Write-Host "Installation de Chocolatey..." -ForegroundColor Yellow
    
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    Write-Host "✅ Chocolatey installé" -ForegroundColor Green
}

Write-Host ""

# Vérifier si PostgreSQL est déjà installé
Write-Host "🔍 Vérification de PostgreSQL..." -ForegroundColor Yellow
$pgInstalled = Test-Path "C:\Program Files\PostgreSQL\*\bin\psql.exe"

if ($pgInstalled) {
    Write-Host "⚠️  PostgreSQL est déjà installé sur ce système" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Voulez-vous réinstaller PostgreSQL ? (O/N)"
    
    if ($response -ne "O" -and $response -ne "o") {
        Write-Host "Installation annulée. Configuration de la base de données..." -ForegroundColor Yellow
        & "$PSScriptRoot\configure-database.ps1"
        exit 0
    }
}

Write-Host ""
Write-Host "📥 Installation de PostgreSQL 16..." -ForegroundColor Yellow
Write-Host "⏳ Cela peut prendre 5-10 minutes..." -ForegroundColor Gray
Write-Host ""

# Installer PostgreSQL via Chocolatey
try {
    choco install postgresql16 -y --force
    
    Write-Host ""
    Write-Host "✅ PostgreSQL 16 installé avec succès !" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "❌ Erreur lors de l'installation" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Installation manuelle recommandée :" -ForegroundColor Yellow
    Write-Host "https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host ""
    pause
    exit 1
}

# Attendre que le service démarre
Write-Host "⏳ Démarrage du service PostgreSQL..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Démarrer le service PostgreSQL
try {
    $service = Get-Service postgresql* | Select-Object -First 1
    if ($service.Status -ne "Running") {
        Start-Service $service.Name
        Write-Host "✅ Service PostgreSQL démarré" -ForegroundColor Green
    } else {
        Write-Host "✅ Service PostgreSQL déjà en cours d'exécution" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Impossible de démarrer automatiquement le service" -ForegroundColor Yellow
    Write-Host "Démarrez-le manuellement avec: net start postgresql-x64-16" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  INSTALLATION TERMINÉE !" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Afficher les informations de connexion
Write-Host "📋 INFORMATIONS DE CONNEXION" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Serveur    : localhost" -ForegroundColor White
Write-Host "Port       : 5432" -ForegroundColor White
Write-Host "Utilisateur: postgres" -ForegroundColor White
Write-Host "Mot de passe: (défini lors de l'installation)" -ForegroundColor Yellow
Write-Host ""

# Proposer de configurer la base de données
Write-Host "🎯 PROCHAINES ÉTAPES" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "1. Notez votre mot de passe PostgreSQL" -ForegroundColor White
Write-Host "2. Exécutez: .\configure-database.ps1" -ForegroundColor White
Write-Host "3. Mettez à jour le fichier .env" -ForegroundColor White
Write-Host "4. Exécutez: npx prisma migrate dev" -ForegroundColor White
Write-Host ""

$configNow = Read-Host "Voulez-vous configurer la base de données maintenant ? (O/N)"

if ($configNow -eq "O" -or $configNow -eq "o") {
    Write-Host ""
    Write-Host "🚀 Lancement de la configuration..." -ForegroundColor Cyan
    Write-Host ""
    
    # Demander le mot de passe
    Write-Host "Veuillez entrer votre mot de passe PostgreSQL:" -ForegroundColor Yellow
    $pgPassword = Read-Host -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword)
    $password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    # Configurer la variable d'environnement
    $env:PGPASSWORD = $password
    
    # Créer la base de données
    Write-Host ""
    Write-Host "📦 Création de la base crm_immobilier..." -ForegroundColor Yellow
    
    try {
        & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE crm_immobilier;"
        Write-Host "✅ Base de données créée" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  La base existe peut-être déjà" -ForegroundColor Yellow
    }
    
    # Créer l'utilisateur (optionnel)
    Write-Host ""
    $createUser = Read-Host "Voulez-vous créer un utilisateur dédié 'crm_user' ? (O/N)"
    
    if ($createUser -eq "O" -or $createUser -eq "o") {
        Write-Host "Mot de passe pour crm_user:" -ForegroundColor Yellow
        $userPassword = Read-Host -AsSecureString
        $BSTR2 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($userPassword)
        $userPwd = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR2)
        
        try {
            & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE USER crm_user WITH PASSWORD '$userPwd';"
            & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE crm_immobilier TO crm_user;"
            Write-Host "✅ Utilisateur crm_user créé" -ForegroundColor Green
            
            Write-Host ""
            Write-Host "📝 Ajoutez ceci dans votre fichier .env:" -ForegroundColor Cyan
            Write-Host "DATABASE_URL=`"postgresql://crm_user:$userPwd@localhost:5432/crm_immobilier?schema=public`"" -ForegroundColor White
        } catch {
            Write-Host "⚠️  Erreur lors de la création de l'utilisateur" -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "📝 Ajoutez ceci dans votre fichier .env:" -ForegroundColor Cyan
        Write-Host "DATABASE_URL=`"postgresql://postgres:$password@localhost:5432/crm_immobilier?schema=public`"" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "✅ Configuration terminée !" -ForegroundColor Green
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
