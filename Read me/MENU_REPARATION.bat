@echo off
chcp 65001 > nul
cls
color 0A
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          CRM IMMOBILIER - MENU PRINCIPAL                   ║
echo ║                  Réparation et Diagnostic                  ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo.
echo  📊 ÉTAT DU PROJET :
echo  ═══════════════════════════════════════════════════════════
echo.
echo     Backend   : ⚠️  Port 3000 occupé (à vérifier)
echo     Frontend  : ❌ Erreur JSX Runtime
echo     Database  : ✅ PostgreSQL opérationnel
echo.
echo.
echo  🔧 OPTIONS DISPONIBLES :
echo  ═══════════════════════════════════════════════════════════
echo.
echo     [1] 🚀 RÉPARER LE FRONTEND (5 minutes)
echo         └─ Solution express pour erreur JSX
echo.
echo     [2] 🔍 DIAGNOSTIC FRONTEND
echo         └─ Identifier les problèmes
echo.
echo     [3] 🔧 LIBÉRER LE PORT 3000 (Backend)
echo         └─ Arrêter le processus qui bloque le backend
echo.
echo     [4] 📊 DIAGNOSTIC COMPLET (Backend + Frontend)
echo         └─ Analyse complète du projet
echo.
echo     [5] 📖 VOIR LA DOCUMENTATION
echo         └─ Guide de résolution détaillé
echo.
echo     [6] 🚪 QUITTER
echo.
echo  ═══════════════════════════════════════════════════════════
echo.
set /p choix="  Votre choix (1-6) : "

if "%choix%"=="1" goto reparer_frontend
if "%choix%"=="2" goto diagnostic_frontend
if "%choix%"=="3" goto liberer_port
if "%choix%"=="4" goto diagnostic_complet
if "%choix%"=="5" goto documentation
if "%choix%"=="6" goto quitter

echo.
echo ❌ Choix invalide. Veuillez entrer un nombre entre 1 et 6.
timeout /t 2 > nul
goto menu

:reparer_frontend
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              RÉPARATION FRONTEND EXPRESS                   ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
cd frontend
if exist "REPARATION_EXPRESS.bat" (
    call REPARATION_EXPRESS.bat
) else (
    echo ❌ Script REPARATION_EXPRESS.bat introuvable
    echo    Assurez-vous d'être dans le bon dossier
    pause
)
cd ..
goto fin

:diagnostic_frontend
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              DIAGNOSTIC FRONTEND RAPIDE                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
cd frontend
if exist "DIAGNOSTIC_RAPIDE.bat" (
    call DIAGNOSTIC_RAPIDE.bat
) else (
    echo ❌ Script DIAGNOSTIC_RAPIDE.bat introuvable
    pause
)
cd ..
goto fin

:liberer_port
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              LIBÉRATION DU PORT 3000                       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
cd backend
if exist "LIBERER_PORT_3000.bat" (
    call LIBERER_PORT_3000.bat
) else (
    echo ❌ Script LIBERER_PORT_3000.bat introuvable
    pause
)
cd ..
goto fin

:diagnostic_complet
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              DIAGNOSTIC COMPLET DU PROJET                  ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo [1/2] Diagnostic Backend...
echo ─────────────────────────────────────────
cd backend
if exist "DIAGNOSTIC_COMPLET.bat" (
    call DIAGNOSTIC_COMPLET.bat
) else (
    echo ⚠️  Script backend introuvable
)
cd ..
echo.
echo [2/2] Diagnostic Frontend...
echo ─────────────────────────────────────────
cd frontend
if exist "DIAGNOSTIC_RAPIDE.bat" (
    call DIAGNOSTIC_RAPIDE.bat
) else (
    echo ⚠️  Script frontend introuvable
)
cd ..
goto fin

:documentation
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                   DOCUMENTATION                             ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
if exist "SOLUTION_FRONTEND.md" (
    type SOLUTION_FRONTEND.md
) else (
    echo ❌ Documentation introuvable
)
echo.
pause
goto menu

:quitter
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                      AU REVOIR !                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo   Merci d'avoir utilisé le menu de réparation CRM
echo.
timeout /t 2 > nul
exit

:fin
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                  OPÉRATION TERMINÉE                         ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
choice /C ON /M "Revenir au menu principal"
if errorlevel 2 goto quitter
if errorlevel 1 goto menu

:menu
cls
goto :eof
