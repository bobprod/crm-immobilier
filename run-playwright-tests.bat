@echo off
REM Script pour lancer les tests E2E Playwright des clés API LLM

setlocal enabledelayedexpansion

echo.
echo =====================================
echo   LLM API Keys E2E Tests
echo =====================================
echo.

REM Vérifier les services
echo [1/4] Vérification des services...

REM Vérifier Frontend
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Frontend non disponible sur http://localhost:3000
    echo Démarrez le frontend avec: cd frontend ^&^& npm run dev
    exit /b 1
)
echo [OK] Frontend running

REM Vérifier Backend
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Backend non disponible sur http://localhost:3001
    echo Démarrez le backend avec: cd backend ^&^& npm run start:dev
    exit /b 1
)
echo [OK] Backend running

REM Installer Playwright
echo.
echo [2/4] Installation des dépendances Playwright...
call npx playwright install --with-deps 2>&1 | findstr /V "^$"

REM Lancer les tests
echo.
echo [3/4] Exécution des tests API Keys...
echo Tests: %CD%\tests\llm-api-keys-e2e.spec.ts
echo.

call npx playwright test tests/llm-api-keys-e2e.spec.ts --headed --reporter=html --reporter=list

set TEST_RESULT=%errorlevel%

REM Résumé
echo.
echo [4/4] Résumé des tests
if %TEST_RESULT% equ 0 (
    echo [OK] Tous les tests ont réussi!
    echo Voir le rapport détaillé: npx playwright show-report
) else (
    echo [ERROR] Certains tests ont échoué. Voir les détails ci-dessus.
    echo.
    echo Pour déboguer:
    echo   - Utilisez --debug: npx playwright test tests/llm-api-keys-e2e.spec.ts --debug
    echo   - Consultez les traces: npx playwright show-trace
)

echo.
exit /b %TEST_RESULT%
