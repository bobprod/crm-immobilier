# ============================================
# GUIDE INSTALLATION MANUELLE POSTGRESQL 17.6
# ============================================

## ETAPE 1: LANCER L'INSTALLATEUR
1. Aller dans: C:\Users\DELL\Downloads
2. Double-cliquer sur: postgresql-17.6-2-windows-x64.exe
3. Cliquer sur "Oui" si Windows demande les droits admin

## ETAPE 2: PARAMETRES D'INSTALLATION
Installation Directory: C:\Program Files\PostgreSQL\17
Data Directory: C:\Program Files\PostgreSQL\17\data
Password: postgres
Port: 5432
Locale: French, France

## ETAPE 3: COMPOSANTS A INSTALLER
[X] PostgreSQL Server
[X] pgAdmin 4
[X] Command Line Tools
[ ] Stack Builder (PAS NECESSAIRE)

## ETAPE 4: APRES L'INSTALLATION
Le script suivant configurera automatiquement le projet

## ============================================
## VERIFICATION POST-INSTALLATION
## ============================================

Write-Host "Verification de l'installation PostgreSQL..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Fichiers installes
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
if (Test-Path $psqlPath) {
    Write-Host "[OK] PostgreSQL installe" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] PostgreSQL non trouve" -ForegroundColor Red
    exit 1
}

# Test 2: Service PostgreSQL
$service = Get-Service -Name "postgresql-x64-17" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "[OK] Service trouve: $($service.Status)" -ForegroundColor Green
    if ($service.Status -ne "Running") {
        Write-Host "Demarrage du service..." -ForegroundColor Yellow
        Start-Service -Name "postgresql-x64-17"
        Write-Host "[OK] Service demarre" -ForegroundColor Green
    }
} else {
    Write-Host "[WARNING] Service non trouve" -ForegroundColor Yellow
}

# Test 3: Connexion base de donnees
Write-Host ""
Write-Host "Test de connexion..." -ForegroundColor Yellow
$env:PGPASSWORD = "postgres"
$testConnection = & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d postgres -c "SELECT version();" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Connexion reussie !" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] Connexion echouee" -ForegroundColor Red
}

# Test 4: Creation base de donnees CRM
Write-Host ""
Write-Host "Creation de la base de donnees 'crm_immobilier'..." -ForegroundColor Yellow
$createDb = & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d postgres -c "CREATE DATABASE crm_immobilier;" 2>&1

if ($createDb -like "*already exists*") {
    Write-Host "[OK] Base de donnees existe deja" -ForegroundColor Green
} elseif ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Base de donnees creee" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Erreur creation base" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "POSTGRESQL EST PRET !" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaine etape: npm run prisma:generate" -ForegroundColor Yellow
Write-Host ""
