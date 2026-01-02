# Guide de déploiement - Migration Prisma 7

## Prérequis
- Node.js installé
- Accès à la base de données PostgreSQL
- Variable d'environnement `DATABASE_URL` configurée

## Étapes de déploiement

### 1. Installation des dépendances

```bash
cd backend
npm install
```

Cela installera Prisma 7.0.0 et toutes les dépendances nécessaires.

### 2. Vérification du schéma

```bash
npx prisma validate
```

Devrait afficher: `The schema at prisma/schema.prisma is valid 🚀`

### 3. Génération du client Prisma

```bash
npm run prisma:generate
# ou
npx prisma generate
```

Cela génère le client Prisma v7 avec tous les modèles et relations.

### 4. Vérification de l'état des migrations

```bash
npx prisma migrate status
```

Cette commande affichera l'état de toutes les migrations et indiquera lesquelles doivent être appliquées.

### 5. Déploiement des migrations

**Option A: Production (recommandé)**
```bash
npm run prisma:migrate
# ou
npx prisma migrate deploy
```

Cette commande applique toutes les migrations en attente sur la base de données sans interaction.

**Option B: Développement**
```bash
npx prisma migrate dev
```

Cette commande applique les migrations et régénère le client Prisma.

### 6. Vérification

```bash
# Ouvrir Prisma Studio pour explorer la base de données
npm run prisma:studio
# ou
npx prisma studio
```

## Rollback (si nécessaire)

Si vous devez revenir à Prisma 5:

```bash
# 1. Revenir aux versions précédentes dans package.json
# "@prisma/client": "^5.22.0"
# "prisma": "^5.22.0"

# 2. Remettre le url dans datasource
# datasource db {
#   provider = "postgresql"
#   url      = env("DATABASE_URL")
# }

# 3. Réinstaller
npm install

# 4. Regénérer le client
npx prisma generate
```

## Migrations récentes (3 dernières semaines)

Les migrations suivantes seront appliquées dans l'ordre:

1. `20251220_add_ai_orchestration_models` - Modèles d'orchestration IA
2. `20251221_add_investment_intelligence` - Intelligence d'investissement
3. `20251222193352_add_soft_delete_to_notifications` - Soft delete notifications
4. `20251222210800_add_soft_delete_and_history` - Historique properties
5. `20251222212308_add_soft_delete_and_history_to_prospects` - Historique prospects
6. `20251225184700_smart_ai_notifications` - Notifications intelligentes
7. `20251225200000_user_integrations` - Intégrations utilisateur
8. `20251226103500_ai_billing_system` - Système de billing IA
9. `20251227_phase0_corrections_critiques` - Corrections critiques
10. `20251227_phase1_module_registry` - Registre de modules
11. `20251230_provider_registry_unified` - Registre de providers
12. `20251231_add_whatsapp_module` - Module WhatsApp

## Vérification post-migration

### Test de connexion

```bash
# Test de connexion à la base de données
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('✅ Connected')).catch(e => console.error('❌', e)).finally(() => prisma.\$disconnect());"
```

### Vérification des tables

```sql
-- Vérifier que les nouvelles tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'property_history',
    'prospect_history',
    'ai_orchestrations',
    'tool_call_logs',
    'WhatsAppConfig',
    'WhatsAppConversation',
    'WhatsAppMessage',
    'WhatsAppTemplate',
    'provider_configs',
    'provider_usage_logs',
    'business_modules'
  )
ORDER BY table_name;
```

## Troubleshooting

### Erreur: "P1012 - datasource url"
✅ **Résolu**: Le `url` a été retiré du datasource et déplacé vers `prisma.config.ts`

### Erreur: "model not found"
✅ **Résolu**: Les modèles manquants (PropertyHistory, ProspectHistory, etc.) ont été ajoutés

### Erreur: "duplicate enum"
✅ **Résolu**: Les enums dupliqués ont été supprimés

### Erreur de connexion à la base de données
Vérifiez votre variable `DATABASE_URL`:
```bash
echo $DATABASE_URL
# Devrait être au format:
# postgresql://user:password@host:port/database?schema=public
```

## Support

Pour toute question:
- Consulter la documentation Prisma 7: https://www.prisma.io/docs/
- Voir le fichier `MIGRATION_PRISMA_7.md` pour les détails techniques
- Vérifier les logs d'erreur dans la console

## Notes importantes

⚠️ **Backup recommandé**: Faites une sauvegarde de votre base de données avant de déployer en production

✅ **Compatibilité**: Aucun changement breaking dans l'API du code application

✅ **Performance**: Prisma 7 offre de meilleures performances et des temps de génération plus rapides

✅ **Sécurité**: Mise à jour vers une version maintenue avec les derniers correctifs de sécurité
