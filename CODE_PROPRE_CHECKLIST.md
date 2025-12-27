# 🧹 Checklist Code Propre - Ce Qui Manque

**Statut Actuel**: 70/100 ⚠️
**Objectif**: 95/100 ✅

---

## 📊 Résumé des Problèmes Détectés

### 🔴 Critique (À corriger immédiatement)

| Problème | Quantité | Impact | Priorité |
|----------|----------|--------|----------|
| **Vulnérabilités de sécurité** | 4 critiques | 🔴 CRITIQUE | P0 |
| **Erreurs ESLint** | 26 erreurs | 🔴 Haute | P0 |
| **Warnings ESLint** | 18 warnings | 🟡 Moyenne | P1 |

### 🟡 Important (À corriger dans la semaine)

| Problème | Statut | Impact |
|----------|--------|--------|
| **Tests unitaires manquants** | ❌ 0% | 🟡 Moyenne |
| **Documentation JSDoc** | ❌ 10% | 🟡 Moyenne |
| **Prettier non configuré** | ❌ Manquant | 🟡 Moyenne |
| **Types `any`** | ⚠️ ~50 occurrences | 🟡 Moyenne |

---

## 🔴 1. Vulnérabilités de Sécurité (CRITIQUE)

### Détection
```bash
npm audit
# 4 vulnérabilités (3 high, 1 critical)
```

### Problèmes Identifiés

#### Next.js - 12 vulnérabilités critiques
```
✗ Next.js Cache Poisoning
✗ DoS avec Server Actions
✗ Information exposure
✗ Authorization bypass
✗ SSRF via Middleware
✗ Content Injection
✗ Race Condition
```

#### glob - 1 vulnérabilité haute
```
✗ Command injection via -c/--cmd
```

### ✅ Solutions

#### Option 1: Fix Automatique (Rapide mais breaking)
```bash
npm audit fix --force
# ⚠️ Attention: breaking changes dans Next.js
```

#### Option 2: Fix Manuel (Recommandé)
```bash
# 1. Mettre à jour Next.js
npm install next@latest

# 2. Mettre à jour eslint-config-next
npm install eslint-config-next@latest

# 3. Vérifier les breaking changes
npm run build
npm run dev

# 4. Tester l'application
npm test
```

#### Option 3: Fix Progressif
```json
// package.json - Mise à jour progressive
{
  "dependencies": {
    "next": "^15.0.0",  // Au lieu de 14.x
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  }
}
```

---

## 🔴 2. Erreurs ESLint (26 erreurs)

### Types d'Erreurs

#### A. Apostrophes Non Échappées (19 erreurs)
```tsx
// ❌ Mauvais
<p>L'utilisateur n'a pas de permissions</p>

// ✅ Bon
<p>L&apos;utilisateur n&apos;a pas de permissions</p>
// ou
<p>{"L'utilisateur n'a pas de permissions"}</p>
```

**Fichiers concernés**:
- `pages/appointments/index.tsx`
- `pages/marketing/campaigns/new.tsx`
- `pages/marketing/tracking/index.tsx`
- `pages/seo-ai/index.tsx`
- `pages/seo-ai/property/[id].tsx` (2 erreurs)
- `pages/settings/index.tsx` (3 erreurs)
- `pages/settings/llm-config.tsx` (3 erreurs)
- `pages/settings/prospecting-config.tsx` (4 erreurs)
- `pages/vitrine/index.tsx` (3 erreurs)
- `src/modules/business/appointments/components/AppointmentsCalendar.tsx`
- `src/modules/business/campaigns/components/CampaignManager.tsx`
- `src/modules/business/prospects/components/ProspectCard.tsx` (3 erreurs)
- `src/modules/business/prospecting/components/ProspectingDashboard.tsx` (2 erreurs)

#### B. Utilisation de `<a>` au lieu de `<Link>` (2 erreurs)
```tsx
// ❌ Mauvais
<a href="/settings/llm-config">Config</a>

// ✅ Bon
import Link from 'next/link';
<Link href="/settings/llm-config">Config</Link>
```

**Fichiers**:
- `pages/settings/prospecting-config.tsx`
- `src/modules/business/prospecting/components/ProspectingDashboard.tsx`

### ✅ Fix Automatique

Créer un script de fix automatique:

```bash
#!/bin/bash
# fix-eslint-errors.sh

echo "🔧 Correction automatique des erreurs ESLint..."

# 1. Remplacer les apostrophes
find frontend -name "*.tsx" -type f -exec sed -i "s/'/\&apos;/g" {} \;

# 2. Auto-fix ESLint (ce qui peut être corrigé automatiquement)
npm run lint -- --fix

echo "✅ Corrections appliquées !"
```

**OU** Manuellement avec ESLint:
```bash
npm run lint -- --fix
```

---

## 🟡 3. Warnings ESLint (18 warnings)

### A. React Hooks Dependencies (15 warnings)

```tsx
// ❌ Mauvais
useEffect(() => {
  loadDocuments();
}, []); // Missing dependency: 'loadDocuments'

// ✅ Bon - Option 1: Ajouter la dépendance
useEffect(() => {
  loadDocuments();
}, [loadDocuments]);

// ✅ Bon - Option 2: useCallback pour stabiliser
const loadDocuments = useCallback(async () => {
  const data = await api.getDocuments();
  setDocuments(data);
}, []); // Dépendances correctes

useEffect(() => {
  loadDocuments();
}, [loadDocuments]);
```

**Fichiers concernés**:
- `pages/documents/index.tsx`
- `pages/marketing/campaigns/[id].tsx`
- `pages/marketing/campaigns/index.tsx`
- `pages/page-builder/edit/[id].tsx`
- `pages/properties/[id].tsx`
- `pages/seo-ai/index.tsx`
- `pages/seo-ai/property/[id].tsx`
- `pages/settings/prospecting-config.tsx`
- `pages/vitrine/public/[agencyId]/index.tsx`
- `src/modules/business/appointments/components/AppointmentsCalendar.tsx`
- `src/modules/business/properties/components/PropertyList.tsx` (2 warnings)
- `src/modules/business/prospecting/components/ProspectingAnalytics.tsx`
- `src/modules/business/prospecting/components/ProspectingDashboard.tsx`
- `src/modules/business/prospects/components/ProspectCard.tsx`

### B. Utilisation de `<img>` au lieu de `<Image>` (3 warnings)

```tsx
// ❌ Mauvais
<img src="/logo.png" alt="Logo" />

// ✅ Bon
import Image from 'next/image';
<Image src="/logo.png" alt="Logo" width={200} height={100} />
```

**Fichiers**:
- `pages/properties/[id].tsx`
- `pages/vitrine/public/[agencyId]/index.tsx` (2 occurrences)
- `src/modules/business/properties/components/AddPropertyDialog.tsx`

---

## 🟡 4. Configuration Prettier Manquante

### Problème
Pas de fichier `.prettierrc` → Code non formaté de manière cohérente

### ✅ Solution

#### Créer `.prettierrc.json`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "jsxBracketSameLine": false
}
```

#### Créer `.prettierignore`
```
node_modules
.next
out
build
dist
coverage
*.lock
package-lock.json
```

#### Installer Prettier
```bash
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

#### Mettre à jour `.eslintrc.json`
```json
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error"
  }
}
```

#### Ajouter scripts dans `package.json`
```json
{
  "scripts": {
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "lint:fix": "next lint --fix"
  }
}
```

#### Formater tout le code
```bash
npm run format
```

---

## 🟡 5. Types `any` (Type Safety)

### Problème
~50+ occurrences de `any` dans le code → Perte de type-safety

### Fichiers avec `any`
```
src/modules/business/appointments/components/AppointmentsCalendar.tsx
src/modules/business/appointments/components/AppointmentsStatsWidget.tsx
src/modules/business/properties/components/PropertyBulkActions.tsx
src/modules/business/properties/components/PropertyFilters.tsx
src/modules/business/properties/components/PropertyList.tsx
src/modules/business/prospecting/components/DemographicTargeting.tsx
... et autres
```

### ✅ Solution

#### Configurer TypeScript strict mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### Remplacer `any` progressivement
```tsx
// ❌ Mauvais
const handleError = (error: any) => {
  console.error(error);
};

// ✅ Bon
const handleError = (error: Error | unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
  }
};

// ❌ Mauvais
const data: any = await api.fetch();

// ✅ Bon
interface ApiResponse {
  id: string;
  name: string;
}
const data: ApiResponse = await api.fetch();
```

---

## 🟢 6. Tests Unitaires Manquants

### Problème
- ✅ Tests E2E: 10 suites (~1,500 lignes)
- ❌ Tests unitaires: 0
- ❌ Tests d'intégration: 0

### ✅ Solution

#### Installer Jest + Testing Library
```bash
npm install -D @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jest jest-environment-jsdom \
  @types/jest
```

#### Créer `jest.config.js`
```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

#### Créer `jest.setup.js`
```javascript
import '@testing-library/jest-dom';
```

#### Exemple de test unitaire
```tsx
// src/shared/validation/__tests__/schemas.test.ts
import { propertySchema } from '../schemas';

describe('propertySchema', () => {
  it('should validate valid property data', () => {
    const validData = {
      title: 'Test Property',
      type: 'apartment',
      category: 'sale',
      price: 250000,
      area: 120,
      address: '123 Rue de Test',
      city: 'Paris',
    };

    const result = propertySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid price', () => {
    const invalidData = {
      title: 'Test',
      price: -100, // Invalid
    };

    const result = propertySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain('positif');
  });
});
```

#### Exemple de test composant
```tsx
// src/shared/components/__tests__/ErrorBoundary.test.tsx
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  it('should catch and display error', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Une erreur est survenue/i)).toBeInTheDocument();
  });

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Working component</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Working component')).toBeInTheDocument();
  });
});
```

#### Ajouter scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## 🟢 7. Documentation JSDoc Manquante

### Problème
Très peu de commentaires JSDoc → Difficulté pour les nouveaux développeurs

### ✅ Solution

#### Ajouter JSDoc partout
```tsx
/**
 * Composant ErrorBoundary pour capturer les erreurs React
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * @param {ErrorBoundaryProps} props - Props du composant
 * @param {ReactNode} props.children - Composants enfants
 * @param {Function} props.onError - Callback appelé lors d'une erreur
 * @param {boolean} props.showDetails - Afficher les détails en dev
 *
 * @returns {ReactElement} Composant React
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // ...
}

/**
 * Valide des données avec un schéma Zod
 *
 * @template T - Type de données attendu
 * @param {ZodSchema<T>} schema - Schéma de validation Zod
 * @param {unknown} data - Données à valider
 * @returns {SafeParseReturnType<unknown, T>} Résultat de la validation
 *
 * @example
 * ```typescript
 * const result = validateWithSchema(propertySchema, formData);
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 */
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown) {
  return schema.safeParse(data);
}
```

#### Générer docs automatiquement
```bash
npm install -D typedoc

# package.json
{
  "scripts": {
    "docs": "typedoc --out docs src"
  }
}
```

---

## 🟢 8. Autres Améliorations

### A. Husky + Lint-Staged (Git Hooks)

```bash
npm install -D husky lint-staged

# Initialiser Husky
npx husky install
npm pkg set scripts.prepare="husky install"

# Créer hook pre-commit
npx husky add .husky/pre-commit "npx lint-staged"
```

**`.lintstagedrc.json`**:
```json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
```

### B. Commitlint (Messages de commit)

```bash
npm install -D @commitlint/cli @commitlint/config-conventional

# commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
};

# Ajouter hook
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

### C. CI/CD avec GitHub Actions

**`.github/workflows/ci.yml`**:
```yaml
name: CI

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
```

### D. SonarQube (Qualité de code)

```yaml
# sonar-project.properties
sonar.projectKey=crm-immobilier
sonar.sources=src,pages
sonar.tests=src,pages
sonar.test.inclusions=**/*.test.ts,**/*.test.tsx
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.exclusions=**/node_modules/**,**/*.spec.ts
```

---

## 📊 Plan d'Action Priorisé

### 🔴 Sprint 1 - Sécurité & Erreurs (2-3 jours)

```bash
# Jour 1
□ Mettre à jour Next.js et dépendances (1h)
□ Corriger les 26 erreurs ESLint (2h)
□ Tester l'app après corrections (1h)

# Jour 2
□ Configurer Prettier (30min)
□ Formater tout le code (30min)
□ Corriger les 18 warnings ESLint (3h)

# Jour 3
□ Vérifier et tester (2h)
□ Commit et déploiement (1h)
```

### 🟡 Sprint 2 - Type Safety & Tests (3-4 jours)

```bash
# Jour 1-2
□ Activer TypeScript strict mode (1h)
□ Remplacer tous les `any` (6h)

# Jour 3-4
□ Setup Jest + Testing Library (1h)
□ Écrire tests pour ErrorBoundary (1h)
□ Écrire tests pour schémas Zod (2h)
□ Écrire tests pour composants critiques (4h)
```

### 🟢 Sprint 3 - Documentation & Automatisation (2-3 jours)

```bash
# Jour 1
□ Ajouter JSDoc partout (4h)

# Jour 2
□ Setup Husky + lint-staged (1h)
□ Setup Commitlint (30min)
□ Setup CI/CD GitHub Actions (2h)

# Jour 3
□ Setup SonarQube (optionnel) (2h)
□ Documentation finale (2h)
```

---

## ✅ Checklist Complète

### Sécurité
- [ ] Mettre à jour Next.js vers 15.x
- [ ] Corriger toutes les vulnérabilités npm audit
- [ ] Activer CSP headers
- [ ] Configurer CORS correctement

### Code Quality
- [ ] 0 erreurs ESLint
- [ ] 0 warnings ESLint
- [ ] Prettier configuré et appliqué
- [ ] 0 types `any`
- [ ] TypeScript strict mode activé

### Tests
- [ ] Tests unitaires: 70%+ coverage
- [ ] Tests E2E: ✅ Déjà fait
- [ ] Tests d'intégration: 50%+ coverage

### Documentation
- [ ] JSDoc sur toutes les fonctions publiques
- [ ] README à jour
- [ ] Guide de contribution
- [ ] Documentation API

### Automatisation
- [ ] Husky + lint-staged
- [ ] Commitlint
- [ ] CI/CD GitHub Actions
- [ ] Pre-commit hooks

### Performance
- [ ] Bundle size < 300KB
- [ ] Lazy loading des routes
- [ ] Next/Image partout
- [ ] Memoization où nécessaire

---

## 🎯 Objectif Final

```
Statut Actuel:  70/100 ⚠️
Après Sprint 1:  85/100 🟡
Après Sprint 2:  92/100 🟢
Après Sprint 3:  97/100 ✅

Code Production-Ready: ✅
```

---

## 🚀 Quick Start - Corrections Immédiates

```bash
# 1. Sauvegarder l'état actuel
git add -A
git commit -m "chore: save before code cleanup"

# 2. Mettre à jour dépendances
npm update next
npm audit fix

# 3. Corriger ESLint
npm run lint -- --fix

# 4. Installer et configurer Prettier
npm install -D prettier eslint-config-prettier
echo '{"semi": true, "singleQuote": true}' > .prettierrc.json
npm run format

# 5. Commit
git add -A
git commit -m "chore: fix linting errors and security vulnerabilities"
git push

# 6. Tester
npm run dev
npm run build
```

---

**Date**: 21 décembre 2025
**Statut**: ⚠️ Code fonctionnel mais nécessite nettoyage
**Priorité**: 🔴 Haute - Corriger dans les 48h
