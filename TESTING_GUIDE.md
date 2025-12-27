# 🧪 Guide de Tests - CRM Immobilier

## 📋 Vue d'ensemble

Ce guide présente la stratégie de tests pour le CRM Immobilier, avec des exemples concrets et des bonnes pratiques.

---

## ✅ Tests Implémentés

### Tests Unitaires Créés

| Service | Fichier | Tests | Couverture |
|---------|---------|-------|------------|
| **MandatesService** | `mandates.service.spec.ts` | 12 tests | Validations, CRUD, Workflows |
| **TransactionsService** | `transactions.service.spec.ts` | 10 tests | Validations, Auto-sync, Commissions |
| **BusinessOrchestrator** | `business-orchestrator.service.spec.ts` | 10 tests | Workflows complexes |
| **BusinessEventHandlers** | `business.event-handlers.spec.ts` | 7 tests | Event handling, Error handling |

**Total : 39 tests** couvrant les fonctionnalités critiques

---

## 🎯 Stratégie de Tests

### 1. Tests Unitaires (Unit Tests)

**Objectif** : Tester chaque service/classe indépendamment

**Outils** :
- Jest (test runner)
- @nestjs/testing (utilities NestJS)
- Mocks pour dépendances

**Exemples de ce qui est testé** :
- ✅ Créations d'entités
- ✅ Validations métier
- ✅ Exceptions levées correctement
- ✅ Synchronisations automatiques
- ✅ Side-effects (notifications, logs)

### 2. Tests d'Intégration (Integration Tests)

**Objectif** : Tester l'interaction entre plusieurs services

**À implémenter** :
- Tests end-to-end de workflows complets
- Tests avec vraie base de données (test DB)
- Tests des controllers avec requêtes HTTP

### 3. Tests E2E (End-to-End Tests)

**Objectif** : Tester l'application complète

**À implémenter** :
- Scénarios utilisateur complets
- Tests de l'API complète
- Tests des cron jobs

---

## 🚀 Lancer les Tests

### Commandes de base

```bash
# Lancer tous les tests
npm test

# Lancer les tests en mode watch
npm run test:watch

# Lancer les tests avec coverage
npm run test:cov

# Lancer un fichier de test spécifique
npm test mandates.service.spec.ts

# Lancer les tests E2E
npm run test:e2e
```

### Output attendu

```bash
PASS  src/modules/business/mandates/mandates.service.spec.ts
  MandatesService
    ✓ should be defined (5ms)
    create
      ✓ should create a mandate successfully (12ms)
      ✓ should throw ConflictException if reference exists (8ms)
      ✓ should throw NotFoundException if owner not found (7ms)
      ... (8 more tests)

Test Suites: 4 passed, 4 total
Tests:       39 passed, 39 total
Snapshots:   0 total
Time:        5.234s
```

---

## 📖 Exemples de Tests

### Exemple 1 : Test Simple - Création

```typescript
describe('create', () => {
  it('should create a mandate successfully', async () => {
    // Arrange - Préparer les données
    const userId = 'user-123';
    const createDto = {
      reference: 'MAN-2025-001',
      type: 'exclusive',
      ownerId: 'owner-123',
    };

    const mockMandate = { id: 'mandate-123', ...createDto };

    mockDatabaseService.mandate.create.mockResolvedValue(mockMandate);

    // Act - Exécuter la méthode
    const result = await service.create(userId, createDto);

    // Assert - Vérifier le résultat
    expect(result).toEqual(mockMandate);
    expect(mockDatabaseService.mandate.create).toHaveBeenCalledWith({
      data: { ...createDto, userId },
      include: expect.any(Object),
    });
  });
});
```

### Exemple 2 : Test d'Exception

```typescript
it('should throw ConflictException if reference already exists', async () => {
  const userId = 'user-123';
  const createDto = { reference: 'MAN-2025-001' };

  mockDatabaseService.mandate.findUnique.mockResolvedValue({ id: 'existing' });

  await expect(service.create(userId, createDto)).rejects.toThrow(
    ConflictException,
  );
});
```

### Exemple 3 : Test de Validation Métier

```typescript
it('should throw ConflictException if end date is before start date', async () => {
  const invalidDto = {
    startDate: '2025-12-31',
    endDate: '2025-01-01', // Avant la date de début!
  };

  await expect(service.create(userId, invalidDto)).rejects.toThrow(
    'End date must be after start date',
  );
});
```

### Exemple 4 : Test d'Auto-Sync

```typescript
it('should sync property status when transaction finalized', async () => {
  const updateDto = { status: 'final_deed_signed' };

  mockTransactionsService.update.mockResolvedValue({
    id: 'transaction-123',
    type: 'sale',
    propertyId: 'property-123',
    ...updateDto,
  });

  await service.update('transaction-123', 'user-123', updateDto);

  // Vérifier que la propriété a été mise à jour
  expect(mockDatabaseService.properties.update).toHaveBeenCalledWith({
    where: { id: 'property-123' },
    data: { status: 'sold' },
  });
});
```

### Exemple 5 : Test de Side-Effects

```typescript
it('should send notification and log activity', async () => {
  const mandate = { id: 'mandate-123', reference: 'MAN-2025-001' };

  mockMandatesService.create.mockResolvedValue(mandate);

  await service.create('user-123', createDto);

  // Vérifier que la notification a été envoyée
  expect(mockNotificationHelper.notifyMandateCreated).toHaveBeenCalledWith(
    'user-123',
    mandate,
  );

  // Vérifier que l'activité a été loggée
  expect(mockActivityLogger.logMandateCreated).toHaveBeenCalledWith(
    'user-123',
    mandate,
  );
});
```

### Exemple 6 : Test de Workflow Complexe (Orchestrator)

```typescript
it('should finalize transaction with invoice generation', async () => {
  const finalizationData = {
    finalPrice: 250000,
    generateInvoice: true,
    buyerInfo: {
      name: 'John Buyer',
      email: 'buyer@example.com',
    },
  };

  mockTransactionsService.update.mockResolvedValue(mockTransaction);
  mockFinanceService.createInvoice.mockResolvedValue(mockInvoice);

  const result = await orchestrator.finalizeTransaction(
    userId,
    transactionId,
    finalizationData,
  );

  // Vérifier que transaction est finalisée
  expect(result.transaction.status).toBe('final_deed_signed');

  // Vérifier que facture a été générée
  expect(result.invoice).toBeDefined();
  expect(mockFinanceService.createInvoice).toHaveBeenCalled();

  // Vérifier que rapport a été créé
  expect(mockDatabaseService.activity.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      type: 'report_generated',
    }),
  });
});
```

### Exemple 7 : Test d'Event Handler

```typescript
it('should handle mandate created event', async () => {
  const mandate = { id: 'mandate-123', reference: 'MAN-2025-001' };
  const event = new MandateCreatedEvent('user-123', mandate);

  await handlers.handleMandateCreated(event);

  expect(mockNotificationHelper.notifyMandateCreated).toHaveBeenCalled();
  expect(mockActivityLogger.logMandateCreated).toHaveBeenCalled();
});
```

---

## 🛠️ Configuration des Mocks

### Mock de DatabaseService

```typescript
const mockDatabaseService = {
  mandate: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  transaction: {
    // ... même structure
  },
  properties: {
    // ... même structure
  },
};
```

### Mock de Services

```typescript
const mockMandatesService = {
  create: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  // Seulement les méthodes utilisées
};
```

### Réinitialiser les Mocks

```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Nettoie tous les mocks avant chaque test
});
```

---

## ✅ Checklist de Tests

### Pour chaque Service, tester :

- [ ] **Création** : Succès + Échecs
- [ ] **Lecture** : FindOne + FindAll
- [ ] **Mise à jour** : Succès + Échecs
- [ ] **Suppression** : Succès + Contraintes
- [ ] **Validations métier** : Tous les cas edge
- [ ] **Exceptions** : Toutes les erreurs possibles
- [ ] **Side-effects** : Notifications, Logs, Emails
- [ ] **Auto-sync** : Synchronisations automatiques

### Pour l'Orchestrator, tester :

- [ ] Chaque workflow complet
- [ ] Workflows avec options activées/désactivées
- [ ] Gestion d'erreurs dans les workflows
- [ ] Rollback si nécessaire

### Pour les Event Handlers, tester :

- [ ] Chaque événement déclenche les bons handlers
- [ ] Gestion d'erreurs (ne pas bloquer les autres handlers)
- [ ] Multiple handlers pour un même événement

---

## 📊 Coverage Report

### Générer le rapport de couverture

```bash
npm run test:cov
```

### Output attendu

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines
--------------------|---------|----------|---------|---------|-------------------
All files           |   85.23 |    78.45 |   82.10 |   86.34 |
 mandates.service   |   92.30 |    88.20 |   90.00 |   93.10 | 45,78,120
 transactions.svc   |   89.45 |    82.10 |   88.50 |   90.20 | 156,234
 orchestrator.svc   |   76.80 |    65.40 |   73.20 |   78.90 | 89,145,203
--------------------|---------|----------|---------|---------|-------------------
```

### Objectifs de couverture

- **Minimum** : 70% de coverage
- **Recommandé** : 80% de coverage
- **Idéal** : 90%+ pour code critique (validations, workflows)

---

## 🎯 Scénarios de Tests Recommandés

### Scénario 1 : Workflow Mandat Complet

```typescript
describe('Complete Mandate Workflow', () => {
  it('should handle full mandate lifecycle', async () => {
    // 1. Créer mandat
    const mandate = await mandatesService.create(userId, createDto);
    expect(mandate.status).toBe('active');

    // 2. Vérifier propriété liée
    expect(propertyService.findOne).toHaveProperty('ownerNewId');

    // 3. Mettre à jour mandat
    const updated = await mandatesService.update(mandate.id, userId, {
      commission: 6,
    });
    expect(updated.commission).toBe(6);

    // 4. Annuler mandat
    const cancelled = await mandatesService.cancel(mandate.id, userId, 'Test');
    expect(cancelled.status).toBe('cancelled');
  });
});
```

### Scénario 2 : Workflow Transaction→Commission

```typescript
it('should auto-create commission when transaction finalized', async () => {
  // 1. Créer transaction
  const transaction = await transactionsService.create(userId, createDto);

  // 2. Finaliser transaction
  const finalized = await transactionsService.update(
    transaction.id,
    userId,
    {
      status: 'final_deed_signed',
      finalPrice: 250000,
    },
  );

  // 3. Vérifier commission créée automatiquement
  expect(mockCommissionService.create).toHaveBeenCalled();
  expect(mockNotificationHelper.notifyCommissionCreated).toHaveBeenCalled();
});
```

### Scénario 3 : Event Chain

```typescript
it('should trigger event chain when mandate created', async () => {
  // Créer mandat
  await mandatesService.create(userId, createDto);

  // Vérifier chaîne d'événements
  expect(mockEventEmitter.emit).toHaveBeenCalledWith(
    'mandate.created',
    expect.any(MandateCreatedEvent),
  );

  // Vérifier handlers déclenchés
  expect(mockNotificationHelper.notifyMandateCreated).toHaveBeenCalled();
  expect(mockActivityLogger.logMandateCreated).toHaveBeenCalled();
});
```

---

## 🐛 Debugging des Tests

### Tests qui échouent

```bash
# Lancer un seul test
npm test -- --testNamePattern="should create mandate"

# Mode verbose pour plus de détails
npm test -- --verbose

# Debug avec Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Common Issues

#### Issue 1 : Mock non resetté

```typescript
// ❌ Problème
test1: mockService.create.mockResolvedValue(result1);
test2: // mockService.create retourne encore result1 !

// ✅ Solution
beforeEach(() => {
  jest.clearAllMocks();
});
```

#### Issue 2 : Promises non awaited

```typescript
// ❌ Problème
it('should work', () => {
  service.create(); // Promise non awaited !
});

// ✅ Solution
it('should work', async () => {
  await service.create();
});
```

#### Issue 3 : Expect async sans await

```typescript
// ❌ Problème
expect(service.create()).toThrow(); // Ne marchera pas !

// ✅ Solution
await expect(service.create()).rejects.toThrow();
```

---

## 📚 Ressources Supplémentaires

### Documentation

- **Jest** : https://jestjs.io/docs/getting-started
- **NestJS Testing** : https://docs.nestjs.com/fundamentals/testing
- **Testing Best Practices** : https://testingjavascript.com/

### Commandes Utiles

```bash
# Générer coverage HTML
npm run test:cov -- --coverageReporters=html

# Ouvrir coverage report
open coverage/lcov-report/index.html

# Watch mode avec coverage
npm run test:watch -- --coverage

# Tests en parallèle (plus rapide)
npm test -- --maxWorkers=4
```

---

## ✅ Checklist Avant Push

Avant de pusher du code :

- [ ] Tous les tests passent : `npm test`
- [ ] Coverage >70% : `npm run test:cov`
- [ ] Pas de tests skip/only : Vérifier `it.only` ou `describe.skip`
- [ ] Nouveaux tests pour nouveau code
- [ ] Tests E2E passent : `npm run test:e2e`
- [ ] Linter passe : `npm run lint`

---

## 🎉 Résumé

**Tests implémentés** :
- ✅ 39 tests unitaires
- ✅ 4 suites de tests
- ✅ Coverage des fonctionnalités critiques

**Prochaines étapes** :
- Tests d'intégration avec vraie DB
- Tests E2E complets
- Tests de performance
- CI/CD avec tests automatiques

---

**Guide créé le 06/12/2025**
**Tests : La fondation d'un code robuste et maintenable** 🧪
