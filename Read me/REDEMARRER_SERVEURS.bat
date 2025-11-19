@echo off
chcp 65001 > nul
cls

echo ======================================================================
echo          REDEMARRAGE COMPLET DES SERVEURS
echo ======================================================================
echo.
echo Ce script va :
echo   1. Arrêter tous les serveurs Node.js en cours
echo   2. Redémarrer le backend NestJS
echo   3. Redémarrer le frontend Next.js
echo.
echo ======================================================================
echo.

echo 🛑 Arrêt de tous les processus Node.js sur les ports 3000 et 3001...
echo.

REM Trouver et tuer les processus sur le port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Arrêt du processus %%a sur le port 3000...
    taskkill /F /PID %%a 2>nul
)

REM Trouver et tuer les processus sur le port 3001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo Arrêt du processus %%a sur le port 3001...
    taskkill /F /PID %%a 2>nul
)

timeout /t 2 /nobreak >nul

echo.
echo ✅ Processus arrêtés
echo.
echo ======================================================================
echo          DEMARRAGE DU BACKEND (Port 3000)
echo ======================================================================
echo.

cd backend
start "Backend NestJS" cmd /k "npm run start:dev"
cd ..

echo ⏳ Attente de 10 secondes pour le démarrage du backend...
timeout /t 10 /nobreak >nul

echo.
echo ======================================================================
echo          DEMARRAGE DU FRONTEND (Port 3001)
echo ======================================================================
echo.

cd frontend
start "Frontend Next.js" cmd /k "npm run dev"
cd ..

echo.
echo ✅ Les deux serveurs sont en cours de démarrage !
echo.
echo ======================================================================
echo          VERIFICATION DES SERVEURS
echo ======================================================================
echo.
echo ⏳ Attente de 10 secondes supplémentaires...
timeout /t 10 /nobreak >nul

echo.
echo 🔍 Vérification de l'état des serveurs...
echo.

curl -s -o nul -w "Backend (Port 3000): %%{http_code}\n" http://localhost:3000/api 2>nul
curl -s -o nul -w "Frontend (Port 3001): %%{http_code}\n" http://localhost:3001 2>nul

echo.
echo ======================================================================
echo          INFORMATIONS DE CONNEXION
echo ======================================================================
echo.
echo 📧 Email      : admin@crm.com
echo 🔑 Mot de passe : admin123
echo 🌐 URL de connexion : http://localhost:3001/login
echo.
echo 📋 PROCHAINES ETAPES :
echo    1. Ouvrez votre navigateur
echo    2. Allez sur http://localhost:3001/login
echo    3. Connectez-vous avec les identifiants ci-dessus
echo.
echo ⚠️  Si la connexion ne fonctionne pas :
echo    - Vérifiez que les deux fenêtres de terminal sont ouvertes
echo    - Attendez que le backend affiche "Nest application successfully started"
echo    - Réessayez la connexion
echo.
echo ======================================================================
echo.
pause
