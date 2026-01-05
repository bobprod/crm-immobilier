# 🧪 Guide de Tests - Module Tracking Pixels

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Installation](#installation)
3. [Exécution des tests](#exécution-des-tests)
4. [Structure des tests](#structure-des-tests)
5. [Écrire de nouveaux tests](#écrire-de-nouveaux-tests)
6. [CI/CD](#cicd)
7. [Debugging](#debugging)

---

## 🎯 Vue d'ensemble

Le module Tracking Pixels dispose de **3 niveaux de tests** :

```
┌─────────────────────────────────────────┐
│  🔹 Tests Unitaires (Backend)           │
│     - Services                          │
│     - Controllers                       │
│     - DTOs                              │
│     Total: 59 tests                     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  🔸 Tests E2E (Integration)             │
│     - API endpoints                     │
│     - Database                          │
│     - Authentication                    │
│     Total: 24 tests                     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  🔹 Tests UI (Playwright)               │
│     - Interface utilisateur             │
│     - Navigation                        │
│     - Interactions                      │
│     Total: 19 tests                     │
└─────────────────────────────────────────┘
```

---

## 📦 Installation

### Prérequis

```bash
# Node.js 18+
node --version

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd frontend
npm install
npx playwright install  # Installe les navigateurs
```

---

## 🚀 Exécution des Tests

### Option 1 : Script automatisé (Recommandé)

```bash
# Tous les tests
./scripts/run-tracking-tests.sh all

# Backend uniquement
./scripts/run-tracking-tests.sh backend

# Frontend uniquement
./scripts/run-tracking-tests.sh frontend

# E2E uniquement
./scripts/run-tracking-tests.sh e2e

# Avec couverture
./scripts/run-tracking-tests.sh coverage
```

### Option 2 : Commandes manuelles

#### Backend (Jest)

```bash
cd backend

# Tous les tests tracking
npm test -- tracking

# Test spécifique
npm test -- tracking-config.service.spec.ts

# Avec couverture
npm test -- --coverage tracking

# Watch mode
npm test -- --watch tracking

# Debug mode
node --inspect-brk node_modules/.bin/jest tracking
```

#### E2E (Integration)

```bash
cd backend

# Tous les tests E2E
npm run test:e2e

# Tests tracking uniquement
npm run test:e2e tracking-integration

# Avec logs détaillés
npm run test:e2e -- --verbose
```

#### Frontend (Playwright)

```bash
cd frontend

# Tous les tests
npx playwright test

# Tests tracking uniquement
npx playwright test tracking-pixels-integration

# Mode UI interactif
npx playwright test --ui

# Tests sur navigateur spécifique
npx playwright test --project=chromium

# Tests headed (visible)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Générer rapport
npx playwright show-report
```

---

## 📁 Structure des Tests

```
crm-immobilier/
│
├── backend/
│   ├── src/modules/marketing/tracking/
│   │   ├── tracking-config.service.spec.ts    # 47 tests
│   │   └── tracking.controller.spec.ts        # 12 tests
│   │
│   └── test/
│       └── tracking-integration.e2e-spec.ts   # 24 tests E2E
│
├── frontend/
│   └── tests/
│       └── tracking-pixels-integration.spec.ts # 19 tests UI
│
├── docs/
│   ├── tracking-pixels-test-report.md         # Rapport détaillé
│   └── tracking-pixels-testing-guide.md       # Ce fichier
│
└── scripts/
    └── run-tracking-tests.sh                  # Script automatisé
```

---

## ✍️ Écrire de Nouveaux Tests

### Backend (Jest)

#### Exemple : Test unitaire service

```typescript
// tracking-config.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { TrackingConfigService } from './tracking-config.service';

describe('TrackingConfigService', () => {
  let service: TrackingConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrackingConfigService],
    }).compile();

    service = module.get<TrackingConfigService>(TrackingConfigService);
  });

  it('should create Meta Pixel config', async () => {
    const result = await service.create(userId, {
      platform: TrackingPlatform.FACEBOOK,
      config: { pixelId: '123456789012345' },
      isActive: true,
    });

    expect(result).toHaveProperty('id');
    expect(result.platform).toBe(TrackingPlatform.FACEBOOK);
  });
});
```

#### Exemple : Test controller

```typescript
// tracking.controller.spec.ts

describe('MarketingTrackingController', () => {
  let controller: MarketingTrackingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketingTrackingController],
      providers: [
        {
          provide: TrackingConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get(MarketingTrackingController);
  });

  it('should create config via API', async () => {
    const req = { user: { userId: 'test-id' } };
    const result = await controller.createConfig(req, createDto);

    expect(result).toBeDefined();
  });
});
```

### E2E (Supertest)

```typescript
// tracking-integration.e2e-spec.ts

describe('Tracking E2E', () => {
  it('should create and retrieve config', () => {
    return request(app.getHttpServer())
      .post('/marketing-tracking/config')
      .set('Authorization', `Bearer ${token}`)
      .send({
        platform: TrackingPlatform.FACEBOOK,
        config: { pixelId: '123' },
        isActive: true,
      })
      .expect(201)
      .then((response) => {
        expect(response.body.id).toBeDefined();
      });
  });
});
```

### Frontend (Playwright)

```typescript
// tracking-pixels-integration.spec.ts

test('should configure Meta Pixel', async ({ page }) => {
  await page.goto('/settings/integrations');
  await page.click('text=Marketing & Tracking');

  // Trouver la carte Meta Pixel
  const metaCard = page.locator('text=Meta Pixel').locator('..');

  // Remplir le Pixel ID
  await metaCard
    .locator('input[placeholder="123456789012345"]')
    .fill('999888777666555');

  // Vérifier la valeur
  await expect(
    metaCard.locator('input[placeholder="123456789012345"]')
  ).toHaveValue('999888777666555');
});
```

---

## 🔧 Patterns et Bonnes Pratiques

### 1. Arrange-Act-Assert (AAA)

```typescript
it('should test something', async () => {
  // Arrange (Préparer)
  const userId = 'test-user';
  const config = { pixelId: '123' };

  // Act (Agir)
  const result = await service.create(userId, config);

  // Assert (Vérifier)
  expect(result).toBeDefined();
  expect(result.config.pixelId).toBe('123');
});
```

### 2. Isolation des tests

```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Reset tous les mocks
});

afterEach(async () => {
  await prisma.trackingConfig.deleteMany(); // Cleanup DB
});
```

### 3. Mock des dépendances

```typescript
const mockPrismaService = {
  trackingConfig: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};
```

### 4. Tests paramétrés

```typescript
test.each([
  ['facebook', '123456789012345'],
  ['tiktok', 'TIKTOK123456'],
  ['linkedin', '654321'],
])('should create %s pixel with ID %s', async (platform, pixelId) => {
  const result = await service.create(userId, {
    platform,
    config: { pixelId },
    isActive: true,
  });

  expect(result.config.pixelId).toBe(pixelId);
});
```

---

## 🐛 Debugging

### Backend (Jest)

```bash
# Mode debug
node --inspect-brk node_modules/.bin/jest tracking

# Puis dans Chrome: chrome://inspect
```

### Frontend (Playwright)

```bash
# Mode debug avec inspector
npx playwright test --debug

# Générer trace
npx playwright test --trace on

# Voir trace
npx playwright show-trace trace.zip
```

### Logs utiles

```typescript
// Backend
console.log('Debug:', value);

// Frontend Playwright
await page.screenshot({ path: 'debug.png' });
await page.pause(); // Pause interactive
```

---

## 📊 Couverture de Code

### Générer le rapport

```bash
cd backend
npm test -- --coverage tracking

# Ouvrir le rapport HTML
open coverage/lcov-report/index.html
```

### Seuils de couverture

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 75,
      "functions": 85,
      "lines": 80,
      "statements": 80
    }
  }
}
```

### Interpréter les résultats

```
✅ Coverage > 80%   : Excellent
⚠️ Coverage 60-80%  : Acceptable
❌ Coverage < 60%   : À améliorer
```

---

## 🔄 CI/CD

### GitHub Actions

```yaml
# .github/workflows/tracking-tests.yml

name: Tracking Tests

on:
  push:
    paths:
      - 'backend/src/modules/marketing/tracking/**'
      - 'frontend/src/pages/settings/integrations.tsx'

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd backend && npm install
      - run: cd backend && npm test -- tracking

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd backend && npm install
      - run: cd backend && npm run test:e2e tracking-integration

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend && npm install
      - run: cd frontend && npx playwright install
      - run: cd frontend && npx playwright test tracking-pixels
```

---

## 📈 Métriques de Qualité

### Objectifs

| Métrique | Cible | Actuel | Statut |
|----------|-------|--------|--------|
| Code Coverage | ≥80% | 85.3% | ✅ |
| Tests Unitaires | ≥50 | 59 | ✅ |
| Tests E2E | ≥20 | 24 | ✅ |
| Tests UI | ≥15 | 19 | ✅ |
| Temps Exec Backend | <30s | 8s | ✅ |
| Temps Exec E2E | <2m | 45s | ✅ |
| Temps Exec Frontend | <3m | 1m23s | ✅ |

---

## 🚨 Résolution de Problèmes

### Problème : Tests backend échouent

```bash
# Vérifier connexion DB
npm run prisma:studio

# Réinitialiser DB de test
npm run prisma:reset

# Vérifier logs
npm test -- --verbose
```

### Problème : Tests Playwright timeout

```bash
# Augmenter timeout
npx playwright test --timeout=60000

# Mode headed pour voir
npx playwright test --headed

# Désactiver parallélisme
npx playwright test --workers=1
```

### Problème : Mocks ne fonctionnent pas

```typescript
// Vérifier que les mocks sont bien reset
beforeEach(() => {
  jest.clearAllMocks();
});

// Vérifier les imports
import { jest } from '@jest/globals';
```

---

## 📚 Ressources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

### Outils

- **Coverage** : `npm test -- --coverage`
- **Reporter HTML** : `npx playwright show-report`
- **Debug** : `npx playwright test --debug`
- **Trace Viewer** : `npx playwright show-trace`

---

## ✅ Checklist avant Commit

- [ ] Tous les tests passent localement
- [ ] Couverture ≥ 80%
- [ ] Pas de tests `.only()` ou `.skip()`
- [ ] Mocks nettoyés dans `afterEach`
- [ ] Tests nommés clairement
- [ ] Assertions pertinentes
- [ ] Documentation mise à jour

---

## 🎯 Prochaines Étapes

### Court terme
- [ ] Tests AI Assistant wizard
- [ ] Tests intégration Stape.io réelle
- [ ] Tests webhooks Meta/TikTok

### Moyen terme
- [ ] Tests de charge (k6)
- [ ] Visual regression (Percy)
- [ ] Tests conformité RGPD

### Long terme
- [ ] Tests mutation (Stryker)
- [ ] Tests chaos engineering
- [ ] Monitoring tests production

---

**Dernière mise à jour** : 2026-01-04
**Version** : 1.0.0
**Maintenu par** : CRM Immobilier Team
