#!/bin/bash

# Configuration de l'encodage
export LANG=C.UTF-8

echo "======================================================================"
echo "          REDEMARRAGE COMPLET DES SERVEURS"
echo "======================================================================"
echo ""
echo "Ce script va :"
echo "  1. Arrêter tous les serveurs Node.js en cours"
echo "  2. Redémarrer le backend NestJS"
echo "  3. Redémarrer le frontend Next.js"
echo ""
echo "======================================================================"
echo ""

echo "🛑 Arrêt de tous les processus Node.js sur les ports 3000 et 3001..."
echo ""

# Tuer les processus sur le port 3000
PIDS_3000=$(lsof -t -i:3000)
if [ ! -z "$PIDS_3000" ]; then
    echo "Arrêt des processus sur le port 3000: $PIDS_3000"
    kill -9 $PIDS_3000
fi

# Tuer les processus sur le port 3001
PIDS_3001=$(lsof -t -i:3001)
if [ ! -z "$PIDS_3001" ]; then
    echo "Arrêt des processus sur le port 3001: $PIDS_3001"
    kill -9 $PIDS_3001
fi

sleep 2

echo ""
echo "✅ Processus arrêtés"
echo ""
echo "======================================================================"
echo "          DEMARRAGE DU BACKEND (Port 3000)"
echo "======================================================================"
echo ""

cd backend
npm run start:dev & PID_BACKEND=$!
cd ..

echo "⏳ Attente de 10 secondes pour le démarrage du backend..."
sleep 10

echo ""
echo "======================================================================"
echo "          DEMARRAGE DU FRONTEND (Port 3001)"
echo "======================================================================"
echo ""

cd frontend
npm run dev & PID_FRONTEND=$!
cd ..

echo ""
echo "✅ Les deux serveurs sont en cours de démarrage !"
echo ""
echo "======================================================================"
echo "          VERIFICATION DES SERVEURS"
echo "======================================================================"
echo ""
echo "⏳ Attente de 10 secondes supplémentaires..."
sleep 10

echo ""
echo "🔍 Vérification de l'état des serveurs..."
echo ""

# Vérification du backend (port 3000)
STATUS_BACKEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api)
echo "Backend (Port 3000): $STATUS_BACKEND"

# Vérification du frontend (port 3001)
STATUS_FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
echo "Frontend (Port 3001): $STATUS_FRONTEND"

echo ""
echo "======================================================================"
echo "          INFORMATIONS DE CONNEXION"
echo "======================================================================"
echo ""
echo "📧 Email      : admin@crm.com"
echo "🔑 Mot de passe : admin123"
echo "🌐 URL de connexion : http://localhost:3001/login"
echo ""
echo "📋 PROCHAINES ETAPES :"
echo "    1. Ouvrez votre navigateur"
echo "    2. Allez sur http://localhost:3001/login"
echo "    3. Connectez-vous avec les identifiants ci-dessus"
echo ""
echo "⚠️  Si la connexion ne fonctionne pas :"
echo "    - Vérifiez que les deux fenêtres de terminal sont ouvertes"
echo "    - Attendez que le backend affiche \"Nest application successfully started\""
echo "    - Réessayez la connexion"
echo ""
echo "======================================================================"
echo ""

wait $PID_BACKEND
wait $PID_FRONTEND
