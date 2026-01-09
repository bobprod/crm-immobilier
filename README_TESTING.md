# 🧪 LLM API Keys Testing - Complete Setup

## 🎯 Objectif

Tester automatiquement que les **9 nouvelles clés API LLM** fonctionnent correctement:

1. **Frontend:** Les 9 inputs sont visibles et remplissables
2. **Save:** Cliquer "Enregistrer" sauvegarde les clés
3. **Backend:** L'API reçoit et traite les données
4. **Database:** Les clés sont persistées en base de données

---

## 📦 Ce Qui a Été Créé

### Tests Playwright
```
tests/llm-api-keys-e2e.spec.ts  ← 10 cas de test
tests/selectors.reference.ts    ← Documentation sélecteurs
```

### Configuration
```
playwright.config.ts            ← Configuration Playwright
```

### Scripts de Lancement
```
run-playwright-tests.bat        ← Pour Windows
run-playwright-tests.sh         ← Pour Linux/macOS
```

### Scripts Utilitaires
```
scripts/diagnostic-llm-keys.sh  ← Diagnostic et validation
```

### Documentation
```
PLAYWRIGHT_E2E_GUIDE.md         ← Guide complet (détaillé)
PRE_TEST_CHECKLIST.md          ← Checklist avant tests (détaillée)
TEST_SETUP_SUMMARY.md          ← Résumé du setup
QUICK_TEST_REFERENCE.txt       ← Référence rapide (ce fichier)
README.md                       ← Ce fichier
```

---

## 🚀 Pour Lancer les Tests

### Option 1: Automatique (Recommandé)

#### Windows
```bash
run-playwright-tests.bat
```

#### Linux/macOS
```bash
./run-playwright-tests.sh
```

### Option 2: Manuel

```bash
# Installer dépendances si nécessaire
npx playwright install --with-deps

# Lancer les tests
npx playwright test tests/llm-api-keys-e2e.spec.ts --headed --reporter=html

# Voir le rapport HTML
npx playwright show-report
```

### Option 3: Mode Debug

```bash
npx playwright test tests/llm-api-keys-e2e.spec.ts --debug --headed
```

---

## ✅ Les 9 Clés LLM Testées

| # | Nom | Input ID | Status |
|----|------|----------|--------|
| 1 | Mistral AI | `mistralApiKey` | ✅ |
| 2 | Grok (xAI) | `grokApiKey` | ✅ |
| 3 | Cohere | `cohereApiKey` | ✅ |
| 4 | Together AI | `togetherAiApiKey` | ✅ |
| 5 | Replicate | `replicateApiKey` | ✅ |
| 6 | Perplexity | `perplexityApiKey` | ✅ |
| 7 | Hugging Face | `huggingfaceApiKey` | ✅ |
| 8 | Aleph Alpha | `alephAlphaApiKey` | ✅ |
| 9 | NLP Cloud | `nlpCloudApiKey` | ✅ |

---

## 📋 10 Cas de Test

1. **Page Load** - La page `/settings/ai-api-keys` se charge ✅
2. **Fields Visible** - Les 9 inputs sont visibles ✅
3. **Single Save** - Remplir 1 clé et sauvegarder ✅
4. **Batch Save** - Remplir les 9 clés et sauvegarder ✅
5. **API Retrieve** - Récupérer les clés via API ✅
6. **API Batch** - Sauvegarder plusieurs clés via API ✅
7. **DB Persist** - Les clés persistent en base ✅
8. **Show/Hide** - Toggle eye icon pour masquer/afficher ✅
9. **Empty Fields** - Gestion des champs vides ✅
10. **Error Handling** - Gestion des erreurs réseau ✅

---

## 🔧 Prérequis

### Services
- [ ] **Backend NestJS** sur port 3001
- [ ] **Frontend Next.js** sur port 3000
- [ ] **PostgreSQL** accessible
- [ ] **Migrations Prisma** appliquées

### Code
- [ ] **9 colonnes** dans table `ai_settings`
- [ ] **9 inputs** dans composant frontend
- [ ] **9 champs** dans contrôleur backend
- [ ] **Routes API** fonctionnelles

---

## 📚 Documentation (dans l'ordre de lecture)

### 1. QUICK_TEST_REFERENCE.txt (ce fichier)
Aperçu visuel et commandes rapides

### 2. PRE_TEST_CHECKLIST.md
Checklist détaillée avant de lancer les tests

### 3. PLAYWRIGHT_E2E_GUIDE.md
Guide complet avec:
- Prérequis détaillés
- Explications des tests
- Dépannage complet
- Tips pour debugging

### 4. TEST_SETUP_SUMMARY.md
Résumé technique du setup

### 5. tests/selectors.reference.ts
Référence complète des sélecteurs CSS et helpers

---

## 🎯 Structure du Test

```
Test Suite
├── Login & Session Setup
│   ├── Go to /login
│   ├── Fill credentials
│   └── Capture auth token
│
├── API Keys Page Load
│   ├── Navigate to /settings/ai-api-keys
│   ├── Wait for heading
│   └── Verify UI components
│
├── Frontend Tests
│   ├── Click LLM tab
│   ├── Verify 9 fields visible
│   ├── Fill 1 field + save
│   ├── Fill 9 fields + save
│   └── Test show/hide toggle
│
├── API Tests
│   ├── PUT /api/ai-billing/api-keys/user
│   ├── GET /api/ai-billing/api-keys/user
│   ├── Verify 200 responses
│   └── Verify data integrity
│
├── Database Tests
│   ├── Verify persistence
│   ├── Verify masking
│   └── Verify consistency
│
└── Error Handling
    ├── Test empty fields
    └── Test network errors
```

---

## 🚀 Workflow Complet

```
1. Démarrer les services
   ├─ Backend:  cd backend && npm run start:dev
   └─ Frontend: cd frontend && npm run dev

2. Vérifier la configuration
   └─ ./scripts/diagnostic-llm-keys.sh

3. Lancer les tests
   ├─ run-playwright-tests.bat  (Windows)
   └─ ./run-playwright-tests.sh (Linux/Mac)

4. Examiner les résultats
   └─ npx playwright show-report
```

---

## 🔍 Sélecteurs Clés

### Navigation
```javascript
'http://localhost:3000/settings/ai-api-keys'
```

### Page
```javascript
'h1:has-text("Mes Clés API")'                  // Titre principal
'button[role="tab"]:has-text("LLM / IA")'      // Tab LLM
'button:has-text("Sauvegarder...")'            // Button save
'text="Clés API sauvegardées..."'              // Success message
```

### Les 9 Inputs
```javascript
'input#mistralApiKey'          // 1
'input#grokApiKey'             // 2
'input#cohereApiKey'           // 3
'input#togetherAiApiKey'       // 4
'input#replicateApiKey'        // 5
'input#perplexityApiKey'       // 6
'input#huggingfaceApiKey'      // 7
'input#alephAlphaApiKey'       // 8
'input#nlpCloudApiKey'         // 9
```

---

## 📊 Résultats Attendus

```
Platform: chromium - 1 passed (45s)
Platform: firefox - 1 passed (48s)
Platform: webkit - 1 passed (42s)

✓ should load API Keys page
✓ should display all 9 new LLM fields
✓ should fill and save Mistral API key
✓ should fill all 9 new LLM keys
✓ should save and retrieve API key via API
✓ should save multiple LLM keys at once
✓ should persist keys in database
✓ should show/hide API keys with eye icon
✓ should handle empty fields gracefully
✓ should handle network errors gracefully

════════════════════════════════════════════════════════════════
10 passed ✅  |  0 failed  |  Duration: ~45 seconds
════════════════════════════════════════════════════════════════
```

---

## 🛠️ Commandes Utiles

```bash
# Lancer tous les tests
npx playwright test tests/llm-api-keys-e2e.spec.ts

# Avec navigateur visible
npx playwright test tests/llm-api-keys-e2e.spec.ts --headed

# Avec rapport HTML
npx playwright test tests/llm-api-keys-e2e.spec.ts --headed --reporter=html

# Mode debug interactif
npx playwright test tests/llm-api-keys-e2e.spec.ts --debug --headed

# Un test seulement
npx playwright test -g "should fill and save Mistral API key"

# Ralentir l'exécution
npx playwright test tests/llm-api-keys-e2e.spec.ts --slowmo=2000

# Afficher le rapport
npx playwright show-report

# Afficher les traces
npx playwright show-trace trace.zip

# Diagnostic
./scripts/diagnostic-llm-keys.sh
```

---

## 🆘 En Cas de Problème

### Frontend ne charge pas
```bash
# Vérifier
curl http://localhost:3000
# Relancer
cd frontend && npm run dev
```

### Backend ne répond pas
```bash
# Vérifier
curl http://localhost:3001
# Relancer
cd backend && npm run start:dev
```

### Migrations non appliquées
```bash
# Vérifier
npx prisma migrate status
# Appliquer
npx prisma migrate deploy
```

### Tests timeout
```bash
# Vérifier que les services tournent
# Augmenter timeout dans playwright.config.ts
# Relancer avec --debug pour voir ce qui se passe
```

---

## 📞 Support

| Problème | Solution |
|----------|----------|
| "Port already in use" | Tuer le processus ou changer le port |
| "Input not found" | Vérifier le sélecteur CSS (F12) |
| "API 404" | Vérifier l'endpoint existe (curl) |
| "API 500" | Vérifier les logs backend |
| "DB connection" | Vérifier PostgreSQL et DATABASE_URL |
| "Tests timeout" | Vérifier services et augmenter timeout |

---

## 📈 Couverture

| Aspect | Frontend | Backend | Database | API |
|--------|----------|---------|----------|-----|
| Load | ✅ | - | - | - |
| 9 Fields | ✅ | ✅ | ✅ | - |
| Save | ✅ | ✅ | ✅ | ✅ |
| Retrieve | ✅ | ✅ | ✅ | ✅ |
| Masking | ✅ | ✅ | ✅ | ✅ |
| Errors | ✅ | - | - | - |

---

## ✨ Résumé

Tout est prêt pour tester les clés API LLM! Les 9 nouveaux champs (Mistral, Grok, Cohere, Together AI, Replicate, Perplexity, Hugging Face, Aleph Alpha, NLP Cloud) sont:

✅ Intégrés dans la base de données
✅ Implé

mentés dans le frontend
✅ Gérés par le backend
✅ Couverts par des tests automatisés

**Prêt à lancer les tests?** 🚀

```bash
# Windows
run-playwright-tests.bat

# Linux/macOS
./run-playwright-tests.sh
```

---

Created with ❤️ for LLM API Keys Testing
