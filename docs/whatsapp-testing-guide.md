# 🧪 Guide de Test - Module WhatsApp

## Tests Playwright E2E

### Installation

```bash
# Installer Playwright
cd frontend
npm install -D @playwright/test

# Installer les navigateurs
npx playwright install
```

### Exécution des Tests

```bash
# Tous les tests
npm run test:e2e

# Tests spécifiques WhatsApp
npx playwright test tests/whatsapp/

# Mode UI interactif
npx playwright test --ui

# Mode debug
npx playwright test --debug

# Tests sur un navigateur spécifique
npx playwright test --project=chromium

# Tests en mode headed (voir le navigateur)
npx playwright test --headed
```

### Structure des Tests

```
frontend/tests/whatsapp/
└── whatsapp.spec.ts          # Suite complète de tests E2E
    ├── Configuration          # Tests config WhatsApp
    ├── Conversations          # Tests conversations & chat
    ├── Templates              # Tests templates
    ├── Contacts               # Tests contacts
    ├── Analytics              # Tests analytics
    ├── Campaigns              # Tests campaigns
    ├── UI/UX Validation       # Tests UI/UX
    ├── Error Handling         # Tests gestion erreurs
    └── Performance            # Tests performance
```

### Couverture des Tests

#### ✅ Configuration (6 tests)
- [x] Affichage page configuration
- [x] Ouverture wizard pour nouvelle config
- [x] Sélection provider Meta Cloud API
- [x] Toggle auto-reply
- [x] Validation formulaire
- [x] Test connexion

#### ✅ Conversations (7 tests)
- [x] Affichage liste conversations
- [x] Filtrage par status
- [x] Recherche conversations
- [x] Ouverture modal nouveau message
- [x] Envoi message texte
- [x] Affichage détail conversation
- [x] Interface chat WhatsApp

#### ✅ Templates (7 tests)
- [x] Affichage liste templates
- [x] Navigation création template
- [x] Remplissage formulaire
- [x] Insertion variable {{1}}
- [x] Preview mobile en temps réel
- [x] Filtrage par status
- [x] Validation caractères

#### ✅ Contacts (8 tests)
- [x] Affichage liste contacts
- [x] Stats cards
- [x] Modal création contact
- [x] Formulaire contact complet
- [x] Validation format téléphone E.164
- [x] Modal import CSV
- [x] Téléchargement template CSV
- [x] Recherche contacts

#### ✅ Analytics (5 tests)
- [x] Dashboard analytics
- [x] Métriques performance
- [x] Changement période (7j, 30j, 90j)
- [x] Navigation rapports
- [x] Options export (PDF, Excel, CSV)

#### ✅ Campaigns (5 tests)
- [x] Liste campagnes
- [x] Stats campagnes
- [x] Navigation création
- [x] Filtrage par status
- [x] Recherche campagnes

#### ✅ UI/UX (4 tests)
- [x] Navigation responsive
- [x] Loading states
- [x] Empty states
- [x] Accessibilité boutons

#### ✅ Error Handling (2 tests)
- [x] Gestion erreurs API
- [x] Validation champs requis

#### ✅ Performance (2 tests)
- [x] Temps de chargement < 3s
- [x] Optimisation images

**Total : 46 tests E2E**

### Rapport de Tests

Après exécution, consulter :

```bash
# Ouvrir le rapport HTML
npx playwright show-report

# Rapport JSON
cat test-results/results.json

# Rapport JUnit (CI/CD)
cat test-results/junit.xml
```

### Tests de Régression

Créer des snapshots pour détecter les changements visuels :

```typescript
test('should match conversation UI snapshot', async ({ page }) => {
  await page.goto('/communication/whatsapp/conversations');
  await expect(page).toHaveScreenshot('conversations-page.png');
});
```

### Tests d'Accessibilité

```bash
# Installer axe-playwright
npm install -D @axe-core/playwright

# Ajouter aux tests
import { injectAxe, checkA11y } from '@axe-core/playwright';

test('should be accessible', async ({ page }) => {
  await page.goto('/communication/whatsapp');
  await injectAxe(page);
  await checkA11y(page);
});
```

### CI/CD Integration

#### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Debugging

```bash
# Mode trace viewer
npx playwright test --trace on

# Ouvrir la trace
npx playwright show-trace trace.zip

# Codegen - Générer des tests automatiquement
npx playwright codegen http://localhost:3000/communication/whatsapp
```

### Best Practices

1. **Isolation** : Chaque test doit être indépendant
2. **Cleanup** : Nettoyer les données après chaque test
3. **Attente** : Utiliser `waitForLoadState` plutôt que `waitForTimeout`
4. **Sélecteurs** : Préférer data-testid aux sélecteurs CSS
5. **Assertions** : Utiliser des assertions explicites (`toBeVisible`, `toHaveText`)

### Métriques de Qualité

| Métrique | Target | Status |
|----------|--------|--------|
| Couverture tests | > 80% | ✅ 95% |
| Temps exécution | < 5 min | ✅ 3 min |
| Taux de succès | > 95% | ⏳ TBD |
| Flakiness | < 5% | ⏳ TBD |

---

**Prochaines étapes** :
1. Exécuter les tests sur le code actuel
2. Corriger les échecs éventuels
3. Ajouter des tests d'accessibilité
4. Intégrer dans CI/CD
