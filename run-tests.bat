@echo off
REM Script pour exécuter les tests E2E dans Docker (Windows)
REM Usage: run-tests.bat [--build] [--clean]

setlocal enabledelayedexpansion

set BUILD_FLAG=
set CLEAN_FLAG=false

REM Parser les arguments
:parse_args
if "%~1"=="" goto end_parse
if "%~1"=="--build" set BUILD_FLAG=--build
if "%~1"=="--clean" set CLEAN_FLAG=true
shift
goto parse_args
:end_parse

echo ========================================
echo 🐳 CRM Immobilier - Test Environment
echo ========================================

REM 1. Démarrer les services de test
echo.
echo 📦 Starting test services...
docker-compose -f docker-compose.test.yml up -d %BUILD_FLAG% db-test backend-test frontend-test

if errorlevel 1 (
    echo ❌ Failed to start services
    exit /b 1
)

REM 2. Attendre que les services soient prêts
echo.
echo ⏳ Waiting for services to be ready...

REM Attendre le backend
echo    - Waiting for backend...
timeout /t 30 /nobreak >nul

REM Vérifier le backend
:check_backend
curl -f http://localhost:3002/api/health >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto check_backend
)
echo    ✓ Backend ready

REM Vérifier le frontend
:check_frontend
curl -f http://localhost:3003 >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto check_frontend
)
echo    ✓ Frontend ready

REM 3. Seed de la base de données
echo.
echo 🌱 Seeding test database...
docker-compose -f docker-compose.test.yml exec -T backend-test npm run seed:test

if errorlevel 1 (
    echo ❌ Failed to seed database
    exit /b 1
)

REM 4. Exécuter les tests Playwright
echo.
echo 🎭 Running Playwright tests...
docker-compose -f docker-compose.test.yml run --rm playwright-test npx playwright test

set TEST_EXIT_CODE=%errorlevel%

REM 5. Afficher les résultats
echo.
echo ========================================
echo 📊 Test Results
echo ========================================

if %TEST_EXIT_CODE%==0 (
    echo ✅ All tests passed!
) else (
    echo ❌ Some tests failed (exit code: %TEST_EXIT_CODE%^)
)

REM 6. Nettoyer si demandé
if "%CLEAN_FLAG%"=="true" (
    echo.
    echo 🧹 Cleaning up...
    docker-compose -f docker-compose.test.yml down -v
    echo ✓ Cleanup completed
) else (
    echo.
    echo 💡 Tip: Use --clean to remove containers after tests
    echo 💡 Logs available with: docker-compose -f docker-compose.test.yml logs
)

exit /b %TEST_EXIT_CODE%
