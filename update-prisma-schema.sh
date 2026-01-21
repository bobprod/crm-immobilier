#!/bin/bash

# Script pour mettre à jour le schéma Prisma et régénérer le client

echo "🔄 Mise à jour du schéma Prisma..."
echo ""
echo "Nouveaux champs ajoutés au modèle prospecting_leads:"
echo "  - validated: Boolean (défaut: false)"
echo "  - qualified: Boolean (défaut: false)"
echo "  - spam: Boolean (défaut: false)"
echo "  - company: String"
echo ""

cd backend

echo "📋 Génération de la migration Prisma..."
npx prisma migrate dev --name add_lead_qualification_fields --skip-generate

echo ""
echo "🔨 Génération du client Prisma..."
npx prisma generate

echo ""
echo "✅ Migration terminée!"
echo ""
echo "Pour appliquer la migration en production:"
echo "  npx prisma migrate deploy"
echo ""
echo "Pour voir le statut des migrations:"
echo "  npx prisma migrate status"
