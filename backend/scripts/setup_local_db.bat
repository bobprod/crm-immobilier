@echo off
REM ============================================
REM Script de configuration PostgreSQL Local
REM ============================================
REM Author: CRM Immobilier
REM Description: Configure la base de données PostgreSQL locale
REM ============================================

setlocal enabledelayedexpansion

set POSTGRES_PATH=C:\Program Files\PostgreSQL\17\bin
set POSTGRES_USER=postgres
set POSTGRES_PASSWORD=postgres
set DB_NAME=crm_immobilier
set DB_HOST=localhost
set DB_PORT=5432

REM Ajouter PostgreSQL au PATH
set PATH=%POSTGRES_PATH%;%PATH%

echo.
echo ============================================
echo Setup PostgreSQL Local Database
echo ============================================
echo.

REM Check if PostgreSQL service is running
echo [1] Vérification du service PostgreSQL...
sc query postgresql-x64-17 >nul 2>&1
if errorlevel 1 (
    echo [!] PostgreSQL service not found. Installing/Starting...
    REM Try to start the service
    net start postgresql-x64-17
) else (
    echo [OK] PostgreSQL service found
)

REM Wait for PostgreSQL to be ready
echo [2] Attendre le démarrage de PostgreSQL...
timeout /t 3 /nobreak

REM Check if database exists
echo [3] Vérification de l'existence de la base de données '%DB_NAME%'...
psql -U %POSTGRES_USER% -h %DB_HOST% -p %DB_PORT% -lqt 2>nul | findstr /i "%DB_NAME%"
if errorlevel 1 (
    echo [!] Base de données '%DB_NAME%' non trouvée. Création en cours...
    psql -U %POSTGRES_USER% -h %DB_HOST% -p %DB_PORT% -c "CREATE DATABASE %DB_NAME%;" 2>nul
    if errorlevel 0 (
        echo [OK] Base de données '%DB_NAME%' créée
    ) else (
        echo [ERREUR] Impossible de créer la base de données
        exit /b 1
    )
) else (
    echo [OK] Base de données '%DB_NAME%' existe déjà
)

echo.
echo ============================================
echo Configuration locale terminée!
echo ============================================
echo Connection string:
echo postgresql://postgres:postgres@localhost:5432/crm_immobilier?schema=public
echo.
pause
