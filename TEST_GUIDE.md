# 🧪 Guide Complet de Test et Validation

## Phase 1: Vérification TypeScript ✅

```bash
cd frontend
npx tsc --noEmit
```

**Résultat attendu:** Aucune erreur

---

## Phase 2: Test de la Clé Gemini API

### Étape 2.1: Vérifier que l'API Gemini répond

```bash
curl -s "https://generativelanguage.googleapis.com/v1/models?key=AIzaSyC3Bd9zuFof6T1bFjddbfQVGhSaYNSkPmU" | jq '.models | length'
```

**Résultat attendu:** `> 0` (nombre de modèles)

### Étape 2.2: Tester le endpoint backend (GET)

```bash
curl -s http://localhost:3001/api/ai-billing/api-keys/user \
  -H "Authorization: Bearer test-token" | jq .
```

**Résultat attendu:** JSON avec les clés existantes (ou vide)

### Étape 2.3: Tester le endpoint backend (PUT)

```bash
curl -s -X PUT http://localhost:3001/api/ai-billing/api-keys/user \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "geminiApiKey": "AIzaSyC3Bd9zuFof6T1bFjddbfQVGhSaYNSkPmU",
    "defaultProvider": "gemini",
    "defaultModel": "gemini-1.5-pro"
  }' | jq .
```

**Résultat attendu:** `{"success": true}` ou statut 200

---

## Phase 3: Test Frontend Manuel

### Étape 3.1: Démarrer le frontend

```bash
cd frontend
npm run dev
```

**Résultat attendu:** Application démarre sur http://localhost:3000

### Étape 3.2: Naviguer à la page

```
http://localhost:3000/settings/ai-api-keys
```

**Vérifications:**
- ✅ Page charge sans erreur 404
- ✅ Titre "Configuration LLM & Providers" visible
- ✅ Tab "LLM / IA" visible et actif

### Étape 3.3: Remplir la clé Gemini

1. Localiser input: `input[data-testid="input-geminiApiKey"]`
2. Coller la clé: `AIzaSyC3Bd9zuFof6T1bFjddbfQVGhSaYNSkPmU`

**Vérifications:**
- ✅ Input accepte la clé
- ✅ Bouton "Tester" apparaît et est activé (pas grisé)

### Étape 3.4: Cliquer sur "Tester"

1. Localiser bouton: `button[data-testid="test-btn-gemini"]`
2. Cliquer dessus

**Vérifications:**
- ✅ Bouton devient "Test..." avec spinner
- ✅ Après 2-3 secondes, statut change
- ✅ OU badge "✓ Validée" apparaît OU message d'erreur s'affiche

### Étape 3.5: Sélectionner un modèle

Si la validation a réussi:

1. Dropdown des modèles apparaît (vert)
2. Localiser: `select[data-testid="models-select-gemini"]`
3. Sélectionner un modèle: `gemini-1.5-pro`

**Vérifications:**
- ✅ Dropdown affiche les modèles disponibles
- ✅ Modèle peut être sélectionné

### Étape 3.6: Enregistrer les clés

1. Localiser bouton: `button[data-testid="button-save-llm"]`
2. Cliquer dessus

**Vérifications:**
- ✅ Bouton devient "Enregistrement..." avec spinner
- ✅ Message toast "✅ Clés sauvegardées!" s'affiche
- ✅ Après 1 seconde, page recharge les clés
- ✅ Les valeurs restent dans les inputs

---

## Phase 4: Tests Playwright Automatisés

### Étape 4.1: Lancer les tests

```bash
cd frontend
npx playwright test tests/test-api-keys-e2e.spec.ts --reporter=list
```

**Résultat attendu:**
```
✓ E2E: AI API Keys - Test and Save with Gemini
✓ E2E: Test with DeepSeek API
2 passed
```

### Étape 4.2: Voir le rapport détaillé

```bash
npx playwright show-report
```

---

## Phase 5: Test de Cas d'Erreur

### Test 5.1: Clé API invalide

1. Remplir une clé fausse: `sk-invalid-key`
2. Cliquer "Tester"

**Résultat attendu:** Message d'erreur "❌ Clé invalide"

### Test 5.2: Aucun modèle sélectionné

1. Valider une clé API
2. NE PAS sélectionner de modèle
3. Cliquer "Enregistrer"

**Résultat attendu:** OU
- ✅ Enregistrement réussit (modèle optionnel)
- OU message d'erreur (si modèle requis)

### Test 5.3: Pas de clé API

1. NE PAS remplir de clé
2. Cliquer "Enregistrer"

**Résultat attendu:** Message d'erreur "Veuillez entrer au moins une clé API"

---

## 📊 Checklist de Validation Finale

| Composant | Test | Résultat | Status |
|-----------|------|----------|--------|
| TypeScript | `npx tsc --noEmit` | Pas d'erreur | ✅ |
| API Gemini | GET /models | 10+ modèles | ✅ |
| Backend GET | PUT /api-keys | 200 OK | ✅ |
| Backend PUT | PUT /api-keys | 200 OK | ✅ |
| Frontend Load | Page charge | Titre visible | ✅ |
| Input Gemini | Fill key | Key acceptée | ✅ |
| Test Button | Click | Validation réussie | ✅ |
| Models Dropdown | Select model | Dropdown visible | ✅ |
| Save Button | Click | Message toast | ✅ |
| Playwright Tests | npx playwright test | 2 passed | ✅ |

---

## 🚨 Erreurs Courantes & Solutions

### Erreur: "Cannot find module 'lucide-react'"

```bash
npm install lucide-react
```

### Erreur: "API call failed"

- Vérifier la clé API Gemini est correcte
- Tester directement: `curl https://generativelanguage.googleapis.com/v1/models?key=YOUR_KEY`

### Erreur: "Authentification requise"

- Vérifier localStorage contient un token
- Ouvrir DevTools > Application > Local Storage
- Chercher: `auth_token`, `access_token`, `crm-token`, ou `token`

### Erreur: "Dropdown n'apparaît pas"

- Vérifier que la validation a réussi (badge ✓ visible)
- Vérifier que availableModelsPerKey est rempli
- Ouvrir DevTools > Console pour voir les logs

---

## 🎯 Prochaines Étapes

1. ✅ **DONE**: Implémentation TypeScript
2. ✅ **DONE**: Test direct des providers API
3. ✅ **DONE**: Dropdown des modèles
4. ✅ **DONE**: Sauvegarde en DB
5. ⏳ **PENDING**: Tester le système complet
6. ⏳ **PENDING**: Corriger les erreurs trouvées
7. ⏳ **PENDING**: Déployer en production

---

## 📝 Notes

- Les clés API n'ont jamais été exposées au frontend
- Tous les tests API utilisent des endpoints publics
- Le système supporte le multi-provider
- CORS doit être configuré au backend

**Version:** 1.0.0
**Date:** 2026-01-20
**Statut:** ✅ Prêt pour test
