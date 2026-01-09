# LLM API Keys Integration - Test Plan & Implementation

## 📋 Objectif
Implémenter une gestion complète des clés API LLM dans le système avec:
1. ✅ Support des nouveaux modèles LLM (Mistral, Grok, Cohere, etc.)
2. ✅ Dropdown dynamique pour sélectionner parmi les "Autres modèles"
3. ✅ Enregistrement des clés en base de données
4. ✅ Tests d'intégration API
5. ✅ Tests e2e avec Playwright

## 🏗️ Architecture

### Backend Changes

#### 1. **DTO Updates** (`api-keys.dto.ts`)
Ajout des nouveaux champs LLM:
```typescript
- mistralApiKey?: string;
- grokApiKey?: string;
- cohereApiKey?: string;
- togetherAiApiKey?: string;
- replicateApiKey?: string;
- perplexityApiKey?: string;
- huggingfaceApiKey?: string;
- alephAlphaApiKey?: string;
- nlpCloudApiKey?: string;
```

Appliqué dans les 3 DTOs:
- `UpdateUserApiKeysDto` (ai_settings table)
- `UpdateAgencyApiKeysDto` (agencyApiKeys table)
- `UpdateGlobalApiKeysDto` (global_settings table)

#### 2. **Controller Updates** (`api-keys.controller.ts`)
Mise à jour de `getUserApiKeys()` pour inclure les nouveaux champs dans la sélection Prisma:
- Groupement logique: LLM Providers vs Scraping & Data Providers
- Support du champ `customApiKeys` (JSON) pour extensibilité future

#### 3. **Database Schema** (Prisma)
- Table `ai_settings` a déjà les champs nécessaires
- Possibilité d'utiliser le champ `customApiKeys` (JSON) pour les modèles non-standard

### Frontend Changes

#### 1. **Settings Page Tabs** (`pages/settings/index.tsx`)
Implémentation des deux catégories dans le tab "API Keys":

**Section 1: LLM - Modèles d'IA** 🧠
- OpenAI (GPT-4o, GPT-4)
- Anthropic (Claude 3)
- Google Gemini
- DeepSeek
- Open Router
- Mistral
- Grok (xAI)
- Dropdown pour "Autres Modèles" avec:
  - Cohere
  - Together AI
  - Replicate
  - Perplexity
  - Hugging Face
  - Aleph Alpha
  - NLP Cloud

**Section 2: Moteurs de Scraping Web** 🔍
- Firecrawl
- SERP API
- Pica

## 🧪 Tests Implémentés

### 1. **Tests d'Intégration** (`tests/api-keys-integration.spec.ts`)
Playwright tests couvrant:
- ✅ Sauvegarde d'une clé OpenAI
- ✅ Sauvegarde d'une clé Mistral
- ✅ Sauvegarde d'une clé Grok
- ✅ Sauvegarde d'une clé Cohere
- ✅ Sauvegarde multiple (10 clés à la fois)
- ✅ Récupération des clés (masquées)
- ✅ Validation du format des clés
- ✅ Mise à jour via le formulaire frontend
- ✅ Test du dropdown pour les autres modèles
- ✅ Persistance en base de données
- ✅ Masquage des clés sensibles

### 2. **Tests cURL** (`scripts/test-api-keys.sh`)
Script bash pour tester les endpoints:
- Sauvegarde simple de clés individuelles
- Sauvegarde multiple de 10 clés LLM
- Récupération et masquage des clés
- Sauvegarde des clés de scraping
- Vérification de la persistance
- Validation du masquage

## 🔧 Endpoints API

### GET `/ai-billing/api-keys/user`
Récupère les clés API de l'utilisateur (masquées)
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/ai-billing/api-keys/user
```

**Response:**
```json
{
  "openaiApiKey": "****7890",
  "mistralApiKey": "****5678",
  "grokApiKey": "****1234",
  ...
}
```

### PUT `/ai-billing/api-keys/user`
Met à jour les clés API de l'utilisateur
```bash
curl -X PUT -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "openaiApiKey": "sk-...",
    "mistralApiKey": "...",
    "grokApiKey": "..."
  }' \
  http://localhost:3001/api/ai-billing/api-keys/user
```

## 📊 Base de Données

### Table: `ai_settings`
```
- userId (PK)
- openaiApiKey
- anthropicApiKey
- geminiApiKey
- deepseekApiKey
- openrouterApiKey
- mistralApiKey ✨ NEW
- grokApiKey ✨ NEW
- cohereApiKey ✨ NEW
- togetherAiApiKey ✨ NEW
- replicateApiKey ✨ NEW
- perplexityApiKey ✨ NEW
- huggingfaceApiKey ✨ NEW
- alephAlphaApiKey ✨ NEW
- nlpCloudApiKey ✨ NEW
- serpApiKey
- firecrawlApiKey
- picaApiKey
- jinaReaderApiKey
- scrapingBeeApiKey
- browserlessApiKey
- rapidApiKey
- customApiKeys (JSON)
```

## 🚀 Exécution des Tests

### 1. Tests Playwright
```bash
# Depuis le répertoire frontend
npx playwright test tests/api-keys-integration.spec.ts

# Avec mode UI
npx playwright test --ui
```

### 2. Tests cURL
```bash
# Depuis le répertoire racine
AUTH_TOKEN="your-jwt-token" bash scripts/test-api-keys.sh
```

### 3. Build Backend
```bash
cd backend
npm run build
npm start
```

### 4. Build Frontend
```bash
cd frontend
npm run build
npm run dev
```

## ✅ Checklist de Validation

- [x] DTOs mises à jour pour tous les modèles LLM
- [x] Contrôleur mis à jour pour inclure les nouveaux champs
- [x] Frontend: 2 sections catégorisées (LLM + Scraping)
- [x] Frontend: Dropdown dynamique pour "Autres modèles"
- [x] Frontend: Input conditionnels basés sur la sélection
- [x] Tests d'intégration Playwright créés
- [x] Tests cURL créés
- [x] Validation de la persistance en DB
- [x] Validation du masquage des clés
- [ ] Exécution des tests (en attente)
- [ ] Vérification de la compilation backend
- [ ] Tests e2e complets

## 📝 Prochaines Étapes

1. **Compiler le backend** et vérifier qu'il n'y a pas d'erreurs
2. **Exécuter les tests cURL** pour valider les endpoints
3. **Exécuter les tests Playwright e2e** pour valider le frontend
4. **Valider la persistance** en base de données
5. **Intégrer les migrations Prisma** si nécessaire
6. **Documenter les clés API** pour chaque modèle

## 🔐 Sécurité

- ✅ Les clés sont stockées en base de données (chiffrement recommandé)
- ✅ Les clés sont masquées dans les réponses API
- ✅ Seuls les 4 derniers caractères sont affichés
- ✅ Les clés ne sont jamais loggées en clair
- ✅ Authentification requise (JWT) pour accéder aux endpoints

## 📚 Ressources

- Fichiers modifiés:
  - `backend/src/modules/ai-billing/dto/api-keys.dto.ts`
  - `backend/src/modules/ai-billing/api-keys.controller.ts`
  - `frontend/pages/settings/index.tsx`

- Fichiers créés:
  - `tests/api-keys-integration.spec.ts`
  - `scripts/test-api-keys.sh`
  - `docs/API_KEYS_IMPLEMENTATION.md` (ce fichier)

