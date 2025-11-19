Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURATION AUTOMATIQUE DU PROJET CRM" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Etape 1: Verification PostgreSQL
Write-Host "[1/6] Verification PostgreSQL..." -ForegroundColor Yellow
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
if (Test-Path $psqlPath) {
    Write-Host "      PostgreSQL installe" -ForegroundColor Green
} else {
    Write-Host "      ERREUR: PostgreSQL non trouve" -ForegroundColor Red
    exit 1
}

# Etape 2: Ajout au PATH
Write-Host "[2/6] Configuration PATH..." -ForegroundColor Yellow
$env:Path = "$env:Path;C:\Program Files\PostgreSQL\17\bin"
Write-Host "      PATH configure pour cette session" -ForegroundColor Green

# Etape 3: Test connexion
Write-Host "[3/6] Test connexion PostgreSQL..." -ForegroundColor Yellow
$env:PGPASSWORD = "postgres"
$testResult = & $psqlPath -U postgres -d postgres -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "      Connexion reussie" -ForegroundColor Green
} else {
    Write-Host "      Erreur connexion" -ForegroundColor Red
    Write-Host "      $testResult" -ForegroundColor Gray
    exit 1
}

# Etape 4: Creation base de donnees
Write-Host "[4/6] Creation base 'crm_immobilier'..." -ForegroundColor Yellow
$createDb = & $psqlPath -U postgres -d postgres -c "DROP DATABASE IF EXISTS crm_immobilier; CREATE DATABASE crm_immobilier;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "      Base de donnees creee" -ForegroundColor Green
} else {
    if ($createDb -like "*already exists*") {
        Write-Host "      Base existe deja" -ForegroundColor Green
    } else {
        Write-Host "      Erreur creation" -ForegroundColor Yellow
    }
}

# Etape 5: Generation client Prisma
Write-Host "[5/6] Generation client Prisma..." -ForegroundColor Yellow
Set-Location "C:\Users\DELL\Desktop\CRM_IMMOBILIER_COMPLET_FINAL\backend"
$prismaGen = npm run prisma:generate 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "      Client Prisma genere" -ForegroundColor Green
} else {
    Write-Host "      Erreur generation Prisma" -ForegroundColor Yellow
}

# Etape 6: Migration base de donnees
Write-Host "[6/6] Migration base de donnees..." -ForegroundColor Yellow
$prismaMigrate = npx prisma migrate dev --name init 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "      Migration reussie" -ForegroundColor Green
} else {
    Write-Host "      Erreur migration" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURATION TERMINEE !" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaine etape:" -ForegroundColor Yellow
Write-Host "  npm run start:dev" -ForegroundColor White
Write-Host ""
