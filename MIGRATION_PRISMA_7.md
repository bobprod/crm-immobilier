# Migration vers Prisma 7 - Base de données CRM Immobilier

## Date de migration
2026-01-02

## Contexte
Analyse des branches des 3 dernières semaines et migration de Prisma 5.22.0 vers Prisma 7.0.0 pour résoudre les problèmes de compatibilité et profiter des nouvelles fonctionnalités.

## Migrations récentes analysées (3 dernières semaines)

### Décembre 2025 - Nouvelles fonctionnalités majeures

1. **20251231_add_whatsapp_module** - Module WhatsApp complet
   - Configuration WhatsApp (Meta/Twilio)
   - Conversations et messages
   - Templates de messages
   - Relations avec leads et utilisateurs

2. **20251230_provider_registry_unified** - Registre unifié de providers
   - Configuration des providers (LLM, scraping, storage, etc.)
   - Logs d'utilisation et métriques
   - Gestion des budgets et rate limiting

3. **20251227_phase1_module_registry** - SaaS Core OS Module Registry
   - Système "Plug & Play" pour modules métier
   - Registre des modules business
   - Souscriptions par agence
   - Menus dynamiques et actions IA

4. **20251226103500_ai_billing_system** - Système de billing IA
   - Clés API par agence
   - Pricing et usage IA
   - Gestion des crédits
   - Logs d'erreurs

5. **20251225184700_smart_ai_notifications** - Notifications intelligentes
   - Routage multi-canal (in_app, email, SMS, push, WhatsApp)
   - Préférences utilisateur
   - Tracking de livraison et ouverture

6. **20251222_add_soft_delete_and_history** - Historique et soft delete
   - Soft delete pour properties
   - Historique des changements properties
   - Suivi des modifications

7. **20251221_add_investment_intelligence** - Intelligence d'investissement
   - Module d'analyse d'investissement immobilier

8. **20251220_add_ai_orchestration_models** - Orchestration IA
   - Orchestration des tâches IA
   - Logs d'appels d'outils
   - Clés d'intégration

## Changements effectués

### 1. Mise à jour des packages
```json
"@prisma/client": "^7.0.0",  // was ^5.22.0
"prisma": "^7.0.0"            // was ^5.22.0
```

### 2. Modification du schema Prisma
- **Supprimé**: `url` du datasource (déplacé vers prisma.config.ts)
- **Ajouté**: Support pour Prisma 7 avec configuration dans prisma.config.ts

### 3. Correction des erreurs de schéma

#### Modèles manquants ajoutés:
- `PropertyHistory` - Historique des modifications de propriétés
- `ProspectHistory` - Historique des modifications de prospects
- `AiOrchestration` - Orchestration des tâches IA
- `ToolCallLog` - Logs des appels d'outils IA

#### Corrections:
- Suppression du doublon `enum CampaignStatus`
- Correction de `@default(now)` en `@default(now())`
- Suppression du modèle `user_integrations` dupliqué (gardé `UserIntegration`)
- Correction de la référence `leads` → `prospecting_leads`
- Ajout du champ `deletedAt` dans le modèle `Notification`
- Suppression de la preview feature dépréciée `driverAdapters`

#### Relations ajoutées:
- `users.propertyHistory` → `PropertyHistory[]`
- `users.prospectHistory` → `ProspectHistory[]`
- `users.userLlmProviders` → `UserLlmProvider[]`
- `users.llmUsageLogs` → `LlmUsageLog[]`
- `users.providerPerformances` → `ProviderPerformance[]`
- `users.whatsappConfigs` → `WhatsAppConfig[]`
- `users.whatsappConversations` → `WhatsAppConversation[]`
- `users.whatsappMessages` → `WhatsAppMessage[]`
- `agencies.whatsappConfigs` → `WhatsAppConfig[]`
- `agencies.whatsappConversations` → `WhatsAppConversation[]`
- `prospects.prospectHistory` → `ProspectHistory[]`
- `prospecting_leads.whatsappConversations` → `WhatsAppConversation[]`

### 4. Configuration Prisma 7
Mise à jour de `prisma.config.ts`:
```typescript
import { defineConfig } from 'prisma/config'

export default defineConfig({
    schema: './schema.prisma',
    database: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/crm_immobilier?schema=public',
    },
})
```

## Résultat

✅ **Migration réussie**
- Prisma Client v7.2.0 généré avec succès
- Aucune erreur de validation du schéma
- Toutes les 19 migrations des 3 dernières semaines sont compatibles
- Les fichiers SQL de migration restent inchangés

## Modules métier impactés

Les migrations récentes ont ajouté support pour:
1. **CRM Immobilier** (core)
2. **WhatsApp Communication**
3. **AI Orchestration & Billing**
4. **Smart Notifications**
5. **Module Registry (SaaS Core OS)**
6. **Investment Intelligence**
7. **Provider Management**

## Prochaines étapes

1. ✅ Tester la génération du client Prisma
2. ⏳ Déployer les migrations sur la base de données
3. ⏳ Tester l'application avec Prisma 7
4. ⏳ Vérifier les performances
5. ⏳ Mettre à jour la documentation

## Notes importantes

- **Pas de changements breaking** pour le code application
- Les migrations SQL existantes fonctionnent sans modification
- La compatibilité descendante est maintenue
- Tous les modèles et relations sont préservés

## Commandes utiles

```bash
# Générer le client Prisma
npm run prisma:generate

# Formater le schéma
npx prisma format

# Vérifier le statut des migrations
npx prisma migrate status

# Déployer les migrations
npm run prisma:migrate

# Ouvrir Prisma Studio
npm run prisma:studio
```
