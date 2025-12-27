# Test du Module Prospecting AI

## ⚠️ Prérequis

Avant de tester le module, vous devez :

### 1. Installer les dépendances
```bash
cd backend
PUPPETEER_SKIP_DOWNLOAD=1 npm install
```

### 2. Appliquer la migration SQL
**Option A - Avec Prisma** (si le réseau le permet) :
```bash
npx prisma generate
npx prisma migrate dev --name add-ai-orchestration-models
```

**Option B - Manuellement** (réseau bloqué) :
```bash
# Appliquer le fichier migration.sql directement
psql $DATABASE_URL < prisma/migrations/20251220_add_ai_orchestration_models/migration.sql
```

### 3. Configurer les variables d'environnement
Assurez-vous que votre `.env` contient :
```bash
DATABASE_URL="postgresql://..."
ENCRYPTION_KEY="votre-clé-32-caractères-minimum"
ENCRYPTION_IV="votre-iv-16-chars"

# Optionnel - Clés API pour les services externes
SERPAPI_KEY="votre-clé-serpapi"
FIRECRAWL_API_KEY="votre-clé-firecrawl"
```

### 4. Démarrer le serveur
```bash
npm run start:dev
```

---

## 📡 Endpoints API

### 1. POST `/api/prospecting-ai/start` - Lancer une prospection

**Headers requis** :
```json
{
  "Authorization": "Bearer <votre-jwt-token>",
  "Content-Type": "application/json"
}
```

**Body** :
```json
{
  "zone": "Paris 15",
  "targetType": "VENDEURS",
  "propertyType": "APPARTEMENT",
  "budget": {
    "min": 300000,
    "max": 500000
  },
  "keywords": ["2 chambres", "balcon"],
  "maxLeads": 20,
  "options": {
    "engine": "internal",
    "maxCost": 5
  }
}
```

**Valeurs possibles** :
- `targetType`: `"VENDEURS"` | `"ACHETEURS"` | `"INVESTISSEURS"`
- `propertyType`: `"MAISON"` | `"APPARTEMENT"` | `"TERRAIN"` | `"COMMERCE"` | `"IMMEUBLE"`
- `engine`: `"internal"` (utilise AI Orchestrator)

**Réponse (200 OK)** :
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
      "context": "Spécialisé dans la vente d'appartements dans le 15ème arrondissement",
      "source": "LinkedIn",
      "confidence": 0.85
    },
    {
      "name": "Marie Martin",
      "email": "marie.martin@example.com",
      "context": "Propriétaire d'un appartement 3 pièces à Paris 15",
      "source": "Forum immobilier",
      "confidence": 0.72
    }
  ],
  "stats": {
    "totalLeads": 18,
    "withEmail": 15,
    "withPhone": 8,
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

---

### 2. GET `/api/prospecting-ai/:id` - Récupérer un résultat

**URL** : `/api/prospecting-ai/cm5x8y9z0a1b2c3d4e5f6g7h8`

**Headers requis** :
```json
{
  "Authorization": "Bearer <votre-jwt-token>"
}
```

**Réponse (200 OK)** :
Même structure que la réponse de `/start`.

**Réponse (404 Not Found)** :
```json
{
  "statusCode": 404,
  "message": "Prospection result not found or expired"
}
```

---

### 3. GET `/api/prospecting-ai/:id/export` - Exporter les leads

**URL** : `/api/prospecting-ai/cm5x8y9z0a1b2c3d4e5f6g7h8/export?format=csv`

**Query Parameters** :
- `format`: `"json"` | `"csv"` (défaut: `"json"`)

**Headers requis** :
```json
{
  "Authorization": "Bearer <votre-jwt-token>"
}
```

**Réponse CSV (200 OK)** :
```csv
Name,Email,Phone,Company,Role,Context,Source,Confidence
"Jean Dupont","jean.dupont@example.com","+33 6 12 34 56 78","Agence Immobilière Paris 15","Agent immobilier","Spécialisé dans la vente d'appartements dans le 15ème arrondissement","LinkedIn",0.85
"Marie Martin","marie.martin@example.com","","","","Propriétaire d'un appartement 3 pièces à Paris 15","Forum immobilier",0.72
```

**Headers de réponse** :
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="prospection-cm5x8y9z-20251220-1710.csv"
```

**Réponse JSON (200 OK)** :
```json
{
  "prospectionId": "cm5x8y9z0a1b2c3d4e5f6g7h8",
  "exportedAt": "2025-12-20T17:10:00.000Z",
  "leads": [...],
  "stats": {...},
  "metadata": {...}
}
```

**Headers de réponse** :
```
Content-Type: application/json
Content-Disposition: attachment; filename="prospection-cm5x8y9z-20251220-1710.json"
```

---

### 4. POST `/api/prospecting-ai/:id/convert-to-prospects` - Convertir en prospects CRM

**URL** : `/api/prospecting-ai/cm5x8y9z0a1b2c3d4e5f6g7h8/convert-to-prospects`

**Headers requis** :
```json
{
  "Authorization": "Bearer <votre-jwt-token>"
}
```

**Réponse (200 OK)** :
```json
{
  "converted": 18,
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
        "role": "Agent immobilier",
        "originalContext": "Spécialisé dans la vente d'appartements dans le 15ème arrondissement",
        "originalSource": "LinkedIn"
      }
    }
  ]
}
```

---

## 🧪 Tests avec cURL

### 1. Lancer une prospection
```bash
curl -X POST http://localhost:3000/api/prospecting-ai/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Lyon",
    "targetType": "INVESTISSEURS",
    "propertyType": "IMMEUBLE",
    "budget": {
      "min": 500000,
      "max": 1000000
    },
    "maxLeads": 15,
    "options": {
      "engine": "internal",
      "maxCost": 3
    }
  }'
```

### 2. Récupérer le résultat
```bash
curl http://localhost:3000/api/prospecting-ai/PROSPECTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Exporter en CSV
```bash
curl "http://localhost:3000/api/prospecting-ai/PROSPECTION_ID/export?format=csv" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o leads.csv
```

### 4. Convertir en prospects
```bash
curl -X POST http://localhost:3000/api/prospecting-ai/PROSPECTION_ID/convert-to-prospects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔍 Tests avec Postman

### Collection Postman

Importez cette collection pour tester rapidement :

```json
{
  "info": {
    "name": "Prospecting AI Module",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Start Prospection",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"zone\": \"Paris 15\",\n  \"targetType\": \"VENDEURS\",\n  \"propertyType\": \"APPARTEMENT\",\n  \"maxLeads\": 20\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{base_url}}/api/prospecting-ai/start",
          "host": ["{{base_url}}"],
          "path": ["api", "prospecting-ai", "start"]
        }
      }
    },
    {
      "name": "Get Result",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/prospecting-ai/{{prospection_id}}",
          "host": ["{{base_url}}"],
          "path": ["api", "prospecting-ai", "{{prospection_id}}"]
        }
      }
    },
    {
      "name": "Export CSV",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/prospecting-ai/{{prospection_id}}/export?format=csv",
          "host": ["{{base_url}}"],
          "path": ["api", "prospecting-ai", "{{prospection_id}}", "export"],
          "query": [
            {
              "key": "format",
              "value": "csv"
            }
          ]
        }
      }
    },
    {
      "name": "Convert to Prospects",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/prospecting-ai/{{prospection_id}}/convert-to-prospects",
          "host": ["{{base_url}}"],
          "path": ["api", "prospecting-ai", "{{prospection_id}}", "convert-to-prospects"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    },
    {
      "key": "jwt_token",
      "value": "YOUR_JWT_TOKEN"
    },
    {
      "key": "prospection_id",
      "value": ""
    }
  ]
}
```

---

## 🐛 Debugging

### Logs du serveur
Les logs montreront :
```
[ProspectionService] Starting prospection for zone: Paris 15, target: VENDEURS
[AiOrchestratorService] Received orchestration request with objective: prospection
[IntentAnalyzerService] Analyzing intent for objective: prospection
[ExecutionPlannerService] Creating execution plan with 3 tools
[ToolExecutorService] Executing tool: serpapi (Google search for leads)
[ToolExecutorService] Executing tool: llm (Analyze and extract lead information)
[ProspectionService] Prospection completed with 18 leads in 45.23s
```

### Erreurs communes

**1. Budget dépassé**
```json
{
  "statusCode": 400,
  "message": "Daily budget exceeded. Remaining: $0.00 / $10.00"
}
```

**2. Rate limit atteint**
```json
{
  "statusCode": 429,
  "message": "Too many orchestration requests. Please try again in 45 seconds.",
  "retryAfter": 45
}
```

**3. Clés API manquantes**
```json
{
  "statusCode": 500,
  "message": "SerpAPI key not configured for tenant"
}
```

---

## 📊 Métriques et coûts

Chaque prospection génère des métriques :
- **Temps d'exécution** : ~30-60 secondes
- **Coût estimé** : $1-5 selon le nombre de leads
- **Tokens utilisés** : ~5000-15000 tokens
- **Appels API** : 3-10 selon la complexité

Les métriques sont stockées dans la table `ai_usage_metrics` pour analyse ultérieure.

---

## ✅ Validation

### Checklist de test
- [ ] La prospection démarre avec succès
- [ ] Les leads sont structurés correctement
- [ ] L'export CSV fonctionne sans erreur d'échappement
- [ ] L'export JSON est valide
- [ ] La conversion CRM split correctement firstName/lastName
- [ ] Le cache fonctionne (2e GET plus rapide)
- [ ] Le rate limiting bloque après 20 req/min
- [ ] Le budget tracker empêche les dépassements
- [ ] Les erreurs sont loggées correctement
- [ ] Les métriques sont enregistrées

---

## 🔐 Sécurité

- ✅ Authentification JWT requise sur tous les endpoints
- ✅ Validation stricte des DTOs avec class-validator
- ✅ Rate limiting par tenant (20 req/min)
- ✅ Budget tracking (daily: $10, monthly: $200)
- ✅ Échappement CSV sécurisé (protection contre injection)
- ✅ Clés API encryptées en AES-256-CBC
- ✅ Logs d'audit dans tool_call_logs

---

## 📈 Prochaines étapes

1. **Intégration Google SDK** : Enrichir les leads avec Google Maps API
2. **Webhooks** : Notifier quand la prospection est terminée
3. **Filtres avancés** : Ajouter plus de critères de ciblage
4. **ML Scoring** : Scorer automatiquement la qualité des leads
5. **Export Excel** : Ajouter le format XLSX
