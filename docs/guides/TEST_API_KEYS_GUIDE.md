# 🧪 Guide de Test - Clés API Deepseek

## ✅ Ce qui a été implémenté

### 1. **Correction du problème d'authentification**
- ✓ Créé une fonction `getAuthToken()` qui cherche le token dans plusieurs clés localStorage:
  - `auth_token`
  - `access_token`
  - `crm-token`
  - `token`
- ✓ Corrigé dans `loadApiKeys()` et `handleSave()`

### 2. **Bouton de test pour valider les clés API**
- ✓ Ajouté bouton "Tester" pour OpenAI, Gemini, DeepSeek, Anthropic
- ✓ Icône TestTube avec état loading
- ✓ Affiche badge "Validée" quand la clé est valide

### 3. **Endpoint backend pour valider les clés**
- ✓ Créé `POST /api/ai-billing/api-keys/validate`
- ✓ Validation pour chaque provider (OpenAI, Gemini, DeepSeek, Anthropic)
- ✓ Retourne les modèles disponibles

### 4. **Workflow complet**
1. L'utilisateur entre une clé API
2. Clique sur "Tester"
3. Validation effectuée et modèles retournés
4. Modèle sélectionné automatiquement
5. Clique "Enregistrer les clés LLM"
6. Clé et modèle sauvegardés en base de données
7. Page rechargée avec la clé affichée

---

## 🚀 Comment tester

### **Option 1: Tests Curl (Backend)**

```bash
# 1. Aller au répertoire du projet
cd "c:/Users/DELL/Desktop/project dev/CRM_IMMOBILIER_COMPLET_FINAL/.git/crm-immobilier"

# 2. Lancer le script de test
bash test-api-keys.sh

# Ou tester manuellement:

# 1. Authentification
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 2. Copier le token reçu et l'utiliser comme:
TOKEN="votre-token-ici"

# 3. Tester une clé invalide
curl -X POST http://localhost:3001/api/ai-billing/api-keys/validate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider":"deepseek","apiKey":"invalid-key-123"}'

# 4. Tester avec une clé réelle (remplacer par votre clé)
curl -X POST http://localhost:3001/api/ai-billing/api-keys/validate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider":"deepseek","apiKey":"sk-your-real-key"}'

# 5. Sauvegarder la clé
curl -X PUT http://localhost:3001/api/ai-billing/api-keys/user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deepseekApiKey":"sk-your-key",
    "defaultProvider":"deepseek",
    "defaultModel":"deepseek-chat"
  }'

# 6. Récupérer les clés
curl http://localhost:3001/api/ai-billing/api-keys/user \
  -H "Authorization: Bearer $TOKEN"
```

### **Option 2: Tests Playwright E2E (Frontend)**

```bash
# 1. Aller au répertoire frontend
cd "c:/Users/DELL/Desktop/project dev/CRM_IMMOBILIER_COMPLET_FINAL/.git/crm-immobilier/frontend"

# 2. Lancer le test Deepseek
npx playwright test tests/api-keys-deepseek.spec.ts

# 3. Pour un test interactif (avec UI)
npx playwright test tests/api-keys-deepseek.spec.ts --ui

# 4. Pour un test dans Chrome uniquement
npx playwright test tests/api-keys-deepseek.spec.ts --project=chromium

# 5. Pour voir le rapport
npx playwright show-report
```

### **Option 3: Tests Manuels (Interface)**

1. **Démarrer le backend et frontend**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Naviguer vers la page**:
   - Ouvrir http://localhost:3000/settings/ai-api-keys
   - Connectez-vous si nécessaire

3. **Tester Deepseek**:
   - Cliquer sur l'onglet "LLM / IA"
   - Dans "Sélectionner un Provider LLM", choisir "DeepSeek"
   - Remplir la clé dans le champ "DeepSeek"
   - Cliquer le bouton "Tester" qui apparaît
   - Attendre la validation
   - Voir le modèle s'afficher automatiquement
   - Cliquer "Enregistrer les clés LLM"
   - Recharger la page (F5)
   - Vérifier que la clé est toujours présente

---

## 🔍 Points de vérification

### Backend:
- [ ] Endpoint `/api/ai-billing/api-keys/validate` répond correctement
- [ ] Les réponses API incluent les modèles disponibles
- [ ] Les clés sont correctement sauvegardées en base de données
- [ ] Endpoint `/api/ai-billing/api-keys/user/full` retourne les clés complètes

### Frontend:
- [ ] Le bouton "Tester" aparaît après entrer une clé
- [ ] Clique sur "Tester" affiche un loader
- [ ] Toast de succès/erreur s'affiche
- [ ] Badge "Validée" apparaît pour les clés valides
- [ ] Le dropdown "Modèle à utiliser" se remplit automatiquement
- [ ] Les clés sont affichées dans les inputs au chargement de la page
- [ ] Les clés sont sauvegardées et persistent après rechargement

### Erreurs courantes:
- ❌ "Authentification requise" → Vérifiez que le token est correctement récupéré
- ❌ "Clé invalide" → Testez avec une vraie clé API
- ❌ "Erreur de connexion" → Vérifiez que le backend est lancé
- ❌ "Modèles non affichés" → Vérifiez que la validation a réussi

---

## 📝 Changements effectués

### Frontend (`frontend/src/pages/settings/ai-api-keys.tsx`):
- Ajouté `getAuthToken()` function
- Ajouté icone `TestTube`
- Ajouté états: `testingKeys`, `validatedKeys`, `availableModelsPerKey`
- Ajouté fonction `handleTestApiKey()`
- Ajouté fonction `getProviderFromKeyName()`
- Amélioré `renderKeyInput()` avec bouton de test

### Backend (`backend/src/modules/ai-billing/api-keys.controller.ts`):
- Ajouté endpoint `POST /api/ai-billing/api-keys/validate`
- Ajouté fonction `getDefaultModelsForProvider()`

### Service API (`backend/src/shared/services/api-keys.service.ts`):
- Ajouté fonction `validateApiKey()`
- Ajouté validateurs spécifiques pour chaque provider:
  - `validateOpenAIKey()`
  - `validateGeminiKey()`
  - `validateDeepseekKey()`
  - `validateAnthropicKey()`

---

## 🎯 Résultats attendus

✅ **Succès**:
- Les clés sont testées et validées
- Les modèles s'affichent automatiquement
- Les clés sont sauvegardées en base de données
- Les clés sont affichées lors du rechargement de la page

❌ **Erreur**:
- Message clair indiquant le problème
- Possibilité de corriger et réessayer

---

## 📊 Commandes rapides

```bash
# Tester le backend rapidement
cd backend && npm run dev &
cd frontend && npm run dev &

# Accéder à la page
open http://localhost:3000/settings/ai-api-keys

# Lancer les tests e2e
npm run test:e2e

# Voir les logs
npm run dev -- --debug

# Arrêter les serveurs
pkill -f "npm run dev"
```

---

**Auteur**: Code Rabbit + Claude Haiku
**Date**: Janvier 2026
**Status**: ✅ Complet et testé
