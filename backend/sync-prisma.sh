#!/bin/bash

# Script de synchronisation Prisma sans perte de données
# Utilise des migrations pour mettre à jour la structure de la base de données

echo "🔍 Vérification de la synchronisation Prisma..."
echo "================================================"

# 1. Formater le schéma Prisma
echo ""
echo "📝 Formatage du schéma Prisma..."
npx prisma format

# 2. Générer le client Prisma
echo ""
echo "⚙️  Génération du client Prisma..."
npx prisma generate

# 3. Créer une migration (sans l'appliquer si en production)
echo ""
echo "📦 Création de la migration..."
if [ "$NODE_ENV" = "production" ]; then
  echo "⚠️  Mode PRODUCTION détecté"
  echo "Utilisez 'npx prisma migrate deploy' pour appliquer les migrations en production"
else
  # En développement, créer et appliquer la migration
  npx prisma migrate dev --name sync_schema_$(date +%Y%m%d_%H%M%S)
fi

echo ""
echo "✅ Synchronisation terminée!"
echo "================================================"
echo ""
echo "📊 Pour vérifier le statut: npx prisma migrate status"
echo "🚀 Pour appliquer en production: npx prisma migrate deploy"
