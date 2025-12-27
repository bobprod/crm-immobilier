# Guide de Test Complet - Modules AI Orchestrator & Prospecting AI

Ce guide vous permet de tester complètement les modules AI Orchestrator et Prospecting AI sur votre machine locale.

---

## 📋 Prérequis

- ✅ Node.js 18+ installé
- ✅ Accès à la base de données NeonDB
- ✅ Clés API (optionnel pour tests complets)
- ✅ Git configuré

---

## Étape 1 : Préparation de l'environnement

### 1.1 Installer les dépendances

```bash
cd backend

# Installer toutes les dépendances (skip Puppeteer si problème)
PUPPETEER_SKIP_DOWNLOAD=1 npm install
```

### 1.2 Configurer les variables d'environnement

Vérifiez que votre fichier `.env` contient :

```bash
# Base de données (déjà configuré)
DATABASE_URL="postgresql://neondb_owner:npg_lbYd0ZfxRg2a@ep-lively-surf-agfn2iga-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Encryption pour les clés API (OBLIGATOIRE)
ENCRYPTION_KEY="votre-cle-de-32-caracteres-minimum-ici-123456"
ENCRYPTION_IV="16-chars-iv-1234"

# JWT (déjà configuré)
JWT_SECRET="votre-jwt-secret"
JWT_EXPIRES_IN="7d"

# Clés API externes (OPTIONNEL - pour tests réels)
SERPAPI_KEY="votre-cle-serpapi"          # https://serpapi.com/
FIRECRAWL_API_KEY="votre-cle-firecrawl"  # https://firecrawl.dev/

# LLM Providers (au moins un requis pour l'orchestrateur)
ANTHROPIC_API_KEY="votre-cle-anthropic"  # https://console.anthropic.com/
# OU
OPENAI_API_KEY="votre-cle-openai"        # https://platform.openai.com/
# OU
GEMINI_API_KEY="votre-cle-gemini"        # https://makersuite.google.com/
```

### 1.3 Générer le client Prisma

```bash
npx prisma generate
```

**Sortie attendue** :
```
✔ Generated Prisma Client (x.x.x) to ./node_modules/@prisma/client in XXms
```

---

## Étape 2 : Appliquer la migration SQL

### Option A - Avec Prisma CLI (recommandé)

```bash
npx prisma migrate dev --name add-ai-orchestration-models
```

**Sortie attendue** :
```
✔ Prisma schema loaded from prisma/schema.prisma
✔ Datasource "db": PostgreSQL database "neondb"
✔ Migration(s) applied successfully

The following migration(s) have been created and applied:
migrations/
  └─ 20251220_add_ai_orchestration_models/
      └─ migration.sql

✔ Generated Prisma Client (x.x.x)
```

### Option B - Application manuelle SQL

Si la migration Prisma échoue, appliquez manuellement :

```bash
# Utiliser psql
psql "$DATABASE_URL" < prisma/migrations/20251220_add_ai_orchestration_models/migration.sql

# OU utiliser un client PostgreSQL (pgAdmin, DBeaver, etc.)
```

### 2.1 Vérifier que les tables existent

```bash
npx prisma db push --skip-generate
```

OU vérifiez manuellement :

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('ai_orchestrations', 'tool_call_logs', 'integration_keys');
```

**Résultat attendu** :
```
 table_name
------------------
 ai_orchestrations
 tool_call_logs
 integration_keys
```

---

## Étape 3 : Démarrer le serveur

```bash
npm run start:dev
```

**Logs attendus** :
```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [InstanceLoader] AiOrchestratorModule dependencies initialized
[Nest] LOG [InstanceLoader] ProspectingAiModule dependencies initialized
[Nest] LOG [RoutesResolver] ProspectingAiController {/api/prospecting-ai}:
[Nest] LOG [RouterExplorer] Mapped {/api/prospecting-ai/start, POST} route
[Nest] LOG [RouterExplorer] Mapped {/api/prospecting-ai/:id, GET} route
[Nest] LOG [RouterExplorer] Mapped {/api/prospecting-ai/:id/export, GET} route
[Nest] LOG [RouterExplorer] Mapped {/api/prospecting-ai/:id/convert-to-prospects, POST} route
[Nest] LOG [NestApplication] Nest application successfully started
```

Le serveur devrait démarrer sur le port **3001** (ou 3000 selon votre config).

---

## Étape 4 : Obtenir un JWT Token

### Option A - Créer un utilisateur de test

```bash
# Utiliser Prisma Studio
npx prisma studio

# Créer manuellement un utilisateur dans la table "users"
# OU utiliser l'endpoint /api/auth/register si disponible
```

### Option B - S'authentifier via l'API

```bash
# S'enregistrer
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "AGENT"
  }'

# Se connecter
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

**Réponse attendue** :
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cm5x8y9z...",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User"
  }
}
```

**Enregistrez le token** dans une variable d'environnement :
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Étape 5 : Tests Fonctionnels - AI Orchestrator

### 5.1 Test d'orchestration simple

```bash
curl -X POST http://localhost:3001/api/ai/orchestrate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "prospection",
    "context": {
      "zone": "Paris 15",
      "targetType": "VENDEURS",
      "maxResults": 5
    },
    "options": {
      "executionMode": "auto",
      "maxCost": 1
    }
  }'
```

**Réponse attendue** (200 OK) :
```json
{
  "id": "cm5x8y9z0a1b2c3d4e5f6g7h8",
  "status": "completed",
  "objective": "prospection",
  "plan": {
    "steps": [
      {
        "tool": "serpapi",
        "action": "search",
        "params": {...}
      },
      {
        "tool": "llm",
        "action": "analyze",
        "params": {...}
      }
    ]
  },
  "results": [...],
  "finalResult": {...},
  "metrics": {
    "totalCost": 0.45,
    "tokensUsed": 1250,
    "executionTimeMs": 8500
  }
}
```

### 5.2 Vérifier les logs dans la base de données

```bash
npx prisma studio

# Vérifier dans la table "ai_orchestrations" :
# - Un enregistrement avec votre orchestration
# - status = "completed"
# - plan, results, finalResult remplis

# Vérifier dans la table "tool_call_logs" :
# - Plusieurs logs des appels d'outils
# - toolType = "serpapi", "llm", etc.
# - status = "success"
```

---

## Étape 6 : Tests Fonctionnels - Prospecting AI

### 6.1 Lancer une prospection

```bash
curl -X POST http://localhost:3001/api/prospecting-ai/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Paris 15",
    "targetType": "VENDEURS",
    "propertyType": "APPARTEMENT",
    "budget": {
      "min": 300000,
      "max": 500000
    },
    "keywords": ["2 chambres", "balcon"],
    "maxLeads": 10,
    "options": {
      "engine": "internal",
      "maxCost": 3
    }
  }'
```

**Réponse attendue** (200 OK) :
```json
{
  "prospectionId": "cm5x8y9z0a1b2c3d4e5f6g7h8",
  "status": "completed",
  "leads": [
    {
      "name": "Jean Dupont",
      "email": "jean.dupont@example.com",
      "phone": "+33 6 12 34 56 78",
      "company": "Agence Immobilière Paris 15",
      "role": "Agent immobilier",
      "context": "Spécialisé dans la vente d'appartements...",
      "source": "LinkedIn",
      "confidence": 0.85
    },
    {
      "name": "Marie Martin",
      "email": "marie.martin@example.com",
      "context": "Propriétaire d'un appartement...",
      "source": "Forum immobilier",
      "confidence": 0.72
    }
  ],
  "stats": {
    "totalLeads": 10,
    "withEmail": 8,
    "withPhone": 5,
    "avgConfidence": 0.78
  },
  "metadata": {
    "zone": "Paris 15",
    "targetType": "VENDEURS",
    "executionTimeMs": 45230,
    "cost": 2.35
  }
}
```

**Enregistrez le prospectionId** :
```bash
export PROSPECTION_ID="cm5x8y9z0a1b2c3d4e5f6g7h8"
```

### 6.2 Récupérer le résultat

```bash
curl http://localhost:3001/api/prospecting-ai/$PROSPECTION_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse** : Même structure que ci-dessus

### 6.3 Exporter en JSON

```bash
curl "http://localhost:3001/api/prospecting-ai/$PROSPECTION_ID/export?format=json" \
  -H "Authorization: Bearer $TOKEN" \
  -o prospection-result.json
```

**Fichier créé** : `prospection-result.json` avec tous les leads

### 6.4 Exporter en CSV

```bash
curl "http://localhost:3001/api/prospecting-ai/$PROSPECTION_ID/export?format=csv" \
  -H "Authorization: Bearer $TOKEN" \
  -o prospection-result.csv
```

**Fichier créé** : `prospection-result.csv`
```csv
Name,Email,Phone,Company,Role,Context,Source,Confidence
"Jean Dupont","jean.dupont@example.com","+33 6 12 34 56 78","Agence Immobilière Paris 15","Agent immobilier","Spécialisé...","LinkedIn",0.85
"Marie Martin","marie.martin@example.com","","","","Propriétaire...","Forum",0.72
```

### 6.5 Convertir en prospects CRM

```bash
curl -X POST http://localhost:3001/api/prospecting-ai/$PROSPECTION_ID/convert-to-prospects \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse attendue** :
```json
{
  "converted": 10,
  "prospects": [
    {
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean.dupont@example.com",
      "phone": "+33 6 12 34 56 78",
      "source": "prospection_ai",
      "metadata": {
        "confidence": 0.85,
        "prospectionEngine": "internal",
        "company": "Agence Immobilière Paris 15",
        "role": "Agent immobilier"
      }
    }
  ]
}
```

---

## Étape 7 : Tests de Sécurité & Limites

### 7.1 Test Rate Limiting

Lancez 25 requêtes rapidement (limite : 20/min) :

```bash
for i in {1..25}; do
  echo "Request $i"
  curl -X POST http://localhost:3001/api/ai/orchestrate \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"objective":"test","context":{}}' \
    -w "\nHTTP Status: %{http_code}\n"
  sleep 0.1
done
```

**Résultat attendu** :
- Requêtes 1-20 : **200 OK**
- Requêtes 21-25 : **429 Too Many Requests**

**Headers de rate limit** :
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 0
X-RateLimit-Reset: <timestamp>
```

### 7.2 Test Budget Tracking

```bash
# Obtenir le budget actuel
curl http://localhost:3001/api/ai-metrics/stats \
  -H "Authorization: Bearer $TOKEN"
```

Lancez plusieurs orchestrations jusqu'à dépasser le budget journalier ($10) :

```bash
curl -X POST http://localhost:3001/api/ai/orchestrate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "prospection",
    "context": {"zone": "Paris"},
    "options": {"maxCost": 15}
  }'
```

**Réponse attendue** (400 Bad Request) :
```json
{
  "statusCode": 400,
  "message": "Daily budget exceeded. Remaining: $0.00 / $10.00"
}
```

### 7.3 Test Validation des entrées

```bash
# Zone vide (devrait échouer)
curl -X POST http://localhost:3001/api/prospecting-ai/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "",
    "targetType": "VENDEURS"
  }'
```

**Réponse attendue** (400 Bad Request) :
```json
{
  "statusCode": 400,
  "message": ["zone should not be empty"],
  "error": "Bad Request"
}
```

```bash
# maxLeads trop élevé (devrait échouer - max 100)
curl -X POST http://localhost:3001/api/prospecting-ai/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Paris",
    "targetType": "VENDEURS",
    "maxLeads": 500
  }'
```

**Réponse attendue** (400 Bad Request) :
```json
{
  "statusCode": 400,
  "message": ["maxLeads must not be greater than 100"],
  "error": "Bad Request"
}
```

---

## Étape 8 : Vérifier les métriques

### 8.1 Métriques d'utilisation AI

```bash
curl http://localhost:3001/api/ai-metrics/stats \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse attendue** :
```json
{
  "totalCost": 5.78,
  "totalTokens": 15420,
  "totalCalls": 12,
  "byProvider": {
    "orchestrator": {
      "calls": 8,
      "cost": 4.23,
      "tokens": 11250
    },
    "anthropic": {
      "calls": 4,
      "cost": 1.55,
      "tokens": 4170
    }
  },
  "dailyBudgetUsed": 5.78,
  "dailyBudgetRemaining": 4.22,
  "monthlyBudgetUsed": 5.78,
  "monthlyBudgetRemaining": 194.22
}
```

### 8.2 Historique des orchestrations

```bash
curl http://localhost:3001/api/ai-metrics/history \
  -H "Authorization: Bearer $TOKEN"
```

Vérifiez que tous vos tests apparaissent dans l'historique.

---

## Étape 9 : Tests d'Intégration

### 9.1 Workflow complet Prospection → CRM

```bash
# 1. Lancer prospection
RESULT=$(curl -X POST http://localhost:3001/api/prospecting-ai/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Lyon",
    "targetType": "INVESTISSEURS",
    "maxLeads": 5
  }')

# 2. Extraire le prospectionId
PROSPECTION_ID=$(echo $RESULT | jq -r '.prospectionId')
echo "Prospection ID: $PROSPECTION_ID"

# 3. Attendre quelques secondes (si async)
sleep 3

# 4. Récupérer le résultat
curl http://localhost:3001/api/prospecting-ai/$PROSPECTION_ID \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. Convertir en prospects CRM
curl -X POST http://localhost:3001/api/prospecting-ai/$PROSPECTION_ID/convert-to-prospects \
  -H "Authorization: Bearer $TOKEN" | jq

# 6. Exporter en CSV
curl "http://localhost:3001/api/prospecting-ai/$PROSPECTION_ID/export?format=csv" \
  -H "Authorization: Bearer $TOKEN" \
  -o lyon-investisseurs.csv

echo "✓ Workflow complet réussi!"
echo "✓ Fichier CSV généré: lyon-investisseurs.csv"
```

---

## Étape 10 : Checklist de Validation ✅

Cochez chaque élément après test réussi :

### Configuration
- [ ] Dépendances npm installées
- [ ] Variables d'environnement configurées
- [ ] Client Prisma généré
- [ ] Migration SQL appliquée
- [ ] Tables créées en base de données

### Serveur
- [ ] Serveur démarre sans erreur
- [ ] Port 3001 accessible
- [ ] Tous les modules chargés (AiOrchestratorModule, ProspectingAiModule)
- [ ] Routes enregistrées correctement

### Authentification
- [ ] Utilisateur de test créé
- [ ] JWT token obtenu
- [ ] Endpoints protégés avec 401 sans token
- [ ] Endpoints accessibles avec token valide

### AI Orchestrator
- [ ] POST `/api/ai/orchestrate` fonctionne
- [ ] Orchestration enregistrée en base
- [ ] Tool call logs créés
- [ ] Métriques enregistrées
- [ ] Rate limiting actif (429 après 20 req/min)
- [ ] Budget tracking actif (400 si dépassé)

### Prospecting AI
- [ ] POST `/api/prospecting-ai/start` fonctionne
- [ ] Leads générés avec structure correcte
- [ ] GET `/api/prospecting-ai/:id` retourne résultat
- [ ] Export JSON fonctionne
- [ ] Export CSV fonctionne et est bien formaté
- [ ] Conversion CRM split firstName/lastName
- [ ] Cache fonctionne (2e GET plus rapide)

### Sécurité & Validation
- [ ] Validation DTO fonctionne (zone vide refusé)
- [ ] MaxLeads limité à 100
- [ ] MaxCost limité à 100
- [ ] Timeout max 10 minutes
- [ ] Clés API encryptées en base
- [ ] Rate limiting par tenant

### Métriques & Logs
- [ ] Métriques d'utilisation consultables
- [ ] Historique des orchestrations visible
- [ ] Coûts calculés correctement
- [ ] Logs d'erreurs capturés

---

## 🐛 Dépannage

### Erreur : "Prisma Client not generated"

```bash
npx prisma generate
```

### Erreur : "Table does not exist"

```bash
npx prisma migrate dev
# OU
npx prisma db push
```

### Erreur : "JWT token invalid"

Régénérez un nouveau token en vous reconnectant :
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPassword123!"}'
```

### Erreur : "SerpAPI key not configured"

Les clés API externes sont optionnelles. L'orchestrateur utilisera les fallbacks :
- Pas de SerpAPI → Utilise des données mock
- Pas de Firecrawl → Utilise scraping basique
- Pas de LLM key → Erreur (au moins une clé LLM est requise)

### Erreur : "Daily budget exceeded"

Attendez minuit ou réinitialisez manuellement :
```sql
DELETE FROM ai_usage_metrics WHERE DATE(created_at) = CURRENT_DATE;
```

---

## 📊 Résultats Attendus

Après tous les tests, vous devriez avoir :

**En base de données** :
- ✅ 10-20 orchestrations dans `ai_orchestrations`
- ✅ 30-80 logs d'outils dans `tool_call_logs`
- ✅ 1 configuration de clés dans `integration_keys`
- ✅ 10-50 métriques dans `ai_usage_metrics`

**Fichiers générés** :
- ✅ `prospection-result.json`
- ✅ `prospection-result.csv`
- ✅ `lyon-investisseurs.csv`

**Métriques** :
- ✅ Coût total : $5-15 selon nombre de tests
- ✅ Tokens utilisés : 10k-30k
- ✅ Temps d'exécution moyen : 30-60s par prospection

---

## 🎯 Conclusion

Si tous les tests passent, vos modules sont **100% opérationnels** ! 🎉

Vous pouvez maintenant :
1. **Créer une Pull Request** pour merger sur main
2. **Passer au module Investment Intelligence**
3. **Déployer en production** (après review)

---

## 📞 Support

En cas de problème :
1. Vérifiez les logs du serveur NestJS
2. Consultez la table `tool_call_logs` pour les erreurs
3. Vérifiez les variables d'environnement
4. Relisez la documentation `TEST_PROSPECTING_AI.md`
