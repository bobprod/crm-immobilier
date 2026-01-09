# Guide de Test E2E pour les Clés API LLM

## 📋 Prérequis

Avant de lancer les tests Playwright, assure-toi que:

1. **Node.js** est installé (v18+)
2. **PostgreSQL** est en cours d'exécution avec la base `crm_immobilier`
3. Les **migrations Prisma** ont été appliquées

## 🚀 Démarrage rapide

### Step 1: Démarrer le Backend
```bash
cd backend
npm run start:dev
# Devrait afficher: "Server running on http://localhost:3001"
```

### Step 2: Démarrer le Frontend
```bash
cd frontend
npm run dev
# Devrait afficher: "Local: http://localhost:3000"
```

### Step 3: Lancer les Tests
#### Sur Windows:
```bash
run-playwright-tests.bat
```

#### Sur macOS/Linux:
```bash
./run-playwright-tests.sh
```

## 🧪 Que font les tests?

Les tests E2E vérifient:

### 1️⃣ **Page Charge Correctement**
- Vérifie que `/settings/ai-api-keys` se charge
- Vérifie que l'onglet "LLM / IA" est visible

### 2️⃣ **Les 9 Nouveaux Champs Existent**
Teste la présence des inputs pour:
- Mistral AI
- Grok (xAI)
- Cohere
- Together AI
- Replicate
- Perplexity
- Hugging Face
- Aleph Alpha
- NLP Cloud

### 3️⃣ **Remplissage et Sauvegarde**
- Remplit une clé (ex: Mistral)
- Clique sur "Sauvegarder les clés LLM"
- Vérifie le message de succès

### 4️⃣ **Sauvegarde Multiple**
- Remplit les 9 champs à la fois
- Sauvegarde tout en une seule action
- Vérifie la réussite

### 5️⃣ **Tests API Backend**
- Envoie les clés via API PUT
- Récupère les clés via API GET
- Vérifie que les valeurs sont masquées

### 6️⃣ **Gestion des Erreurs**
- Teste les champs vides
- Teste la gestion des erreurs réseau

## 📊 Résultats des Tests

Après exécution, consulte le rapport HTML:
```bash
npx playwright show-report
```

Cela ouvrira un navigateur avec:
- ✅ Les tests qui ont réussi
- ❌ Les tests qui ont échoué
- 📸 Captures d'écran des erreurs
- 🎬 Vidéos des tests (si erreur)

## 🔧 Dépannage

### Erreur: "Frontend not running"
```bash
# Vérifie que le frontend est lancé
curl http://localhost:3000
# Si erreur, lance: cd frontend && npm run dev
```

### Erreur: "Backend not running"
```bash
# Vérifie que le backend est lancé
curl http://localhost:3001
# Si erreur, lance: cd backend && npm run start:dev
```

### Erreur: "Input not found: input#mistralApiKey"
Cela signifie que:
1. La page n'a pas chargé correctement
2. L'onglet LLM n'a pas été cliqué
3. Le sélecteur CSS est incorrect

**Solution:**
- Vérifier que le frontend compile sans erreurs
- Vérifier les sélecteurs CSS dans le navigateur (F12)

### Erreur: "Clés API sauvegardées avec succès" not visible
Cela signifie:
1. Le message d'alerte n'a pas apparu (normal, peut être caché)
2. La sauvegarde a peut-être échoué

**Vérification:**
- Ouvre les **DevTools** (F12)
- Va dans **Network** et cherche la requête `/api/ai-billing/api-keys/user`
- Vérifie que la réponse est `200 OK`

## 📝 Détails des Sélecteurs

Pour déboguer manuellement dans Playwright Inspector:

```bash
npx playwright test tests/llm-api-keys-e2e.spec.ts --debug
```

**Sélecteurs utilisés:**
- Bouton Login: `button:has-text("Se connecter")`
- Tab LLM: `button[role="tab"]` avec texte "LLM / IA"
- Input Mistral: `input#mistralApiKey`
- Bouton Enregistrer: `button:has-text("Sauvegarder les clés LLM")`
- Message Succès: `text="Clés API sauvegardées avec succès"`

## 🎯 Cas de Test Couverts

| # | Scénario | Status |
|---|----------|--------|
| 1 | Charger page API Keys | ✓ |
| 2 | Afficher les 9 champs | ✓ |
| 3 | Remplir et sauvegarder 1 clé | ✓ |
| 4 | Remplir et sauvegarder les 9 clés | ✓ |
| 5 | Sauvegarder via API | ✓ |
| 6 | Récupérer les clés (masquées) | ✓ |
| 7 | Champs vides (graceful) | ✓ |
| 8 | Erreurs réseau | ✓ |

## 🔐 Sécurité des Clés

⚠️ **IMPORTANT:** Les clés de test utilisées ne doivent **JAMAIS**:
- Être des vraies clés API
- Être commitées dans Git
- Être exposées dans les logs

Les tests utilisent des clés de format: `mistral-1234567890` (timestamp)

## 💡 Tips pour le Debugging

### Voir les logs du navigateur
```bash
npx playwright test tests/llm-api-keys-e2e.spec.ts --verbose
```

### Ralentir l'exécution
```bash
npx playwright test tests/llm-api-keys-e2e.spec.ts --headed --slowmo=1000
```

### Mode interactif (Playwright Inspector)
```bash
npx playwright test tests/llm-api-keys-e2e.spec.ts --debug
```

### Exécuter un seul test
```bash
npx playwright test -g "should fill all 9 new LLM keys"
```

## 📚 Fichiers Connexes

- **Tests:** `tests/llm-api-keys-e2e.spec.ts`
- **Frontend:** `frontend/src/pages/settings/ai-api-keys.tsx`
- **Backend Controller:** `backend/src/modules/ai-billing/api-keys.controller.ts`
- **Schema Prisma:** `backend/prisma/schema.prisma`
- **Migration:** `backend/prisma/migrations/20260109_add_llm_api_keys/`

## ✅ Checklist de Vérification

Avant les tests, assure-toi:

- [ ] Backend lancé sur port 3001
- [ ] Frontend lancé sur port 3000
- [ ] Base de données PostgreSQL accessible
- [ ] Migrations Prisma appliquées
- [ ] Les 9 champs dans la base de données
- [ ] Les 9 champs dans le composant frontend
- [ ] Les 9 champs dans le contrôleur backend

---

**Questions?** Consulte les logs avec `--verbose` ou ouvre une issue.
