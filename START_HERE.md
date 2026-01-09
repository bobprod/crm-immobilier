# 🚀 START HERE - LLM API Keys Testing

## 🎯 Le Problème
```
User clicked "Enregistrer les clés LLM" → Nothing happened
Need to test if it actually works
```

## ✅ La Solution
Tests Playwright automatisés qui vérifient tout fonctionne correctement.

---

## ⏱️ Quick Start (5 minutes)

### 1️⃣ Démarrer le Backend
```bash
cd backend
npm run start:dev
# Attends: "Server running on http://localhost:3001"
```

### 2️⃣ Démarrer le Frontend
```bash
cd frontend
npm run dev
# Attends: "Local: http://localhost:3000"
```

### 3️⃣ Lancer les Tests

**Windows:**
```bash
run-playwright-tests.bat
```

**Linux/macOS:**
```bash
./run-playwright-tests.sh
```

### 4️⃣ Regarder les Résultats
Les résultats s'affichent dans le terminal et un rapport HTML s'ouvre automatiquement.

---

## 📊 Qu'est-ce qui est Testé?

### Les 9 Nouvelles Clés LLM
1. ✅ Mistral AI
2. ✅ Grok (xAI)
3. ✅ Cohere
4. ✅ Together AI
5. ✅ Replicate
6. ✅ Perplexity
7. ✅ Hugging Face
8. ✅ Aleph Alpha
9. ✅ NLP Cloud

### 10 Cas de Test
1. ✅ Page loads correctly
2. ✅ All 9 fields visible
3. ✅ Save single key
4. ✅ Save all 9 keys
5. ✅ API GET works
6. ✅ API PUT works
7. ✅ Database persistence
8. ✅ Show/hide toggle
9. ✅ Empty fields handling
10. ✅ Error handling

---

## 📖 Documentation

| Document | Situation |
|----------|-----------|
| **Ce fichier** | Tu es ici! Juste un aperçu |
| [README_TESTING.md](README_TESTING.md) | Vue d'ensemble complète |
| [PRE_TEST_CHECKLIST.md](PRE_TEST_CHECKLIST.md) | Avant de lancer les tests |
| [PLAYWRIGHT_E2E_GUIDE.md](PLAYWRIGHT_E2E_GUIDE.md) | Guide détaillé + troubleshooting |
| [QUICK_TEST_REFERENCE.txt](QUICK_TEST_REFERENCE.txt) | Référence rapide visuelle |
| [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) | Index de navigation |

---

## 🆘 Ça Échoue?

### Backend ne démarre pas
```bash
# Vérifier
curl http://localhost:3001
# Relancer
cd backend && npm run start:dev
```

### Frontend ne démarre pas
```bash
# Vérifier
curl http://localhost:3000
# Relancer
cd frontend && npm run dev
```

### Les tests échouent
```bash
# Mode debug interactif
npx playwright test tests/llm-api-keys-e2e.spec.ts --debug --headed

# Ou voir le rapport
npx playwright show-report
```

### Plus de détails sur les erreurs?
→ [PLAYWRIGHT_E2E_GUIDE.md](PLAYWRIGHT_E2E_GUIDE.md) → Section "Troubleshooting"

---

## 📋 Fichiers Importants

```
tests/
  ├── llm-api-keys-e2e.spec.ts     ← Les 10 tests
  └── selectors.reference.ts       ← Référence sélecteurs

run-playwright-tests.bat/.sh       ← Lance les tests
scripts/diagnostic-llm-keys.sh     ← Valide le setup

README_TESTING.md                  ← Vue d'ensemble
PLAYWRIGHT_E2E_GUIDE.md           ← Guide complet
PRE_TEST_CHECKLIST.md             ← Checklist
```

---

## ✨ Ce Qui a Été Créé

✅ 10 tests Playwright
✅ Configuration Playwright
✅ Scripts de lancement (Windows + Linux)
✅ Script de diagnostic
✅ 6 fichiers de documentation
✅ Référence complète des sélecteurs CSS

**Total:** 15+ fichiers | 500+ lignes de code | 6 guides complets

---

## 🎯 Prochaines Étapes

1. Lire: [README_TESTING.md](README_TESTING.md) (10 min)
2. Vérifier: [PRE_TEST_CHECKLIST.md](PRE_TEST_CHECKLIST.md) (15 min)
3. Lancer: Les tests (5 min à configurer + 45 sec pour exécuter)
4. Déboguer: Si besoin avec [PLAYWRIGHT_E2E_GUIDE.md](PLAYWRIGHT_E2E_GUIDE.md)

---

## 💡 Tips

- Les tests tournent automatiquement en parallèle (Chrome, Firefox, Safari)
- Si un test échoue, une screenshot est sauvegardée
- Tous les timeouts sont configurés automatiquement
- Les logs sont colorisés pour facile lecture
- Le rapport HTML est très visuel

---

## ⏱️ Temps Estimé

| Étape | Temps |
|-------|-------|
| Lancer services | 5-10 min |
| Lancer tests | < 1 min |
| Tests exécution | 45-60 sec |
| Vérifier résultats | 5 min |
| **Total** | **~15-20 min** |

---

## ✅ Quand les Tests Passent

```
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

Parfait! 🎉 Tes clés API LLM fonctionnent correctement!

---

## 🚀 Allez-y!

Tu es prêt(e)?

**Windows:**
```bash
run-playwright-tests.bat
```

**Linux/macOS:**
```bash
./run-playwright-tests.sh
```

Bonne chance! 🎯

---

**Besoin d'aide?** Lis [PLAYWRIGHT_E2E_GUIDE.md](PLAYWRIGHT_E2E_GUIDE.md) - c'est très détaillé.
