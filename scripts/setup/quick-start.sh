#!/bin/bash

# 🚀 Quick Start - Configuration rapide pour tester les clés API

echo "🚀 Quick Start - Clés API Deepseek"
echo "===================================="
echo ""

# Vérifier si les arguments sont fournis
if [ $# -eq 0 ]; then
    echo "Usage: $0 [start|test|e2e|verify]"
    echo ""
    echo "Commandes disponibles:"
    echo "  start  - Démarrer le backend et frontend"
    echo "  test   - Tester avec curl"
    echo "  e2e    - Tester avec Playwright"
    echo "  verify - Vérifier la configuration"
    echo ""
    echo "Exemple: $0 start"
    exit 1
fi

case "$1" in
    start)
        echo "🟢 Démarrage du backend et frontend..."
        echo ""
        echo "Terminal 1 - Backend:"
        echo "  cd backend && npm run dev"
        echo ""
        echo "Terminal 2 - Frontend:"
        echo "  cd frontend && npm run dev"
        echo ""
        echo "Une fois lancés:"
        echo "  📱 Frontend: http://localhost:3000"
        echo "  🖥️  Backend:  http://localhost:3001"
        echo "  ⚙️  Settings: http://localhost:3000/settings/ai-api-keys"
        echo ""
        ;;

    test)
        echo "🧪 Tests avec curl..."
        if [ -f "test-api-keys.sh" ]; then
            bash test-api-keys.sh
        else
            echo "❌ Fichier test-api-keys.sh non trouvé"
            echo "   Assurez-vous d'être à la racine du projet"
        fi
        ;;

    e2e)
        echo "🎭 Tests Playwright e2e..."
        cd frontend
        npx playwright test tests/api-keys-deepseek.spec.ts --ui
        ;;

    verify)
        echo "✅ Vérification de la configuration..."
        if [ -f "verify-api-keys-setup.sh" ]; then
            bash verify-api-keys-setup.sh
        else
            echo "❌ Fichier verify-api-keys-setup.sh non trouvé"
        fi
        ;;

    *)
        echo "❌ Commande inconnue: $1"
        echo "Utilisez: $0 [start|test|e2e|verify]"
        ;;
esac
