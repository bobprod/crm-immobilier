## Tests e2e et harness — instructions

Petit guide pour exécuter localement les tests e2e et le harness qui
valide le comportement de fallback du `ToolExecutorService`.

Prérequis
- Node.js >= 18
- npm
- Avoir clôné le dépôt et utilisé la branche `add/e2e-tool-executor-tests`

Installation

```bash
cd backend
npm install
```

Exécuter le harness (rapide, pas besoin de Jest) — vérifie les retries/fallbacks :

```bash
cd backend
node -r ts-node/register test/harness/tool-executor-harness.ts
```

Exécuter les e2e (Jest + ts-jest)

1. S'assurer que les dépendances de développement sont installées (`ts-jest`, `ts-node`, `typescript`).
2. Lancer :

```bash
cd backend
npm run test:e2e
```

Dépannage si `No tests found`
- Vérifier que `backend/test/` contient bien des fichiers `*.e2e-spec.ts` ou `*.e2e-spec.js`.
- Afficher la config résolue :

```bash
npx jest --config ./test/jest-e2e.json --showConfig
```

- Lister les tests que Jest détecte :

```bash
npx jest --config ./test/jest-e2e.json --listTests
```

- Si vous êtes sur Windows, exécutez Jest sans `watchman` (parfois problématique) :

```bash
npx jest --config ./test/jest-e2e.json --runInBand --runTestsByPath test/tool-executor-fallback.e2e-spec.ts
```

Notes
- Le harness (`test/harness/tool-executor-harness.ts`) est utile pour valider la logique métier sans config Jest.
- Le commit qui a ajouté ces tests et configs est sur la branche `add/e2e-tool-executor-tests` (PR générée automatiquement lors du push).

Checklist PR
- [x] `backend/test/tool-executor-fallback.e2e-spec.ts` ajouté
- [x] `backend/test/harness/tool-executor-harness.ts` ajouté
- [x] `backend/test/jest-e2e.json` + `backend/tsconfig.jest.json` configurés
- [x] README d'exécution ajouté (`backend/E2E_TESTS_README.md`)

Si vous voulez, j'ouvre la PR sur GitHub ou je prépare un message de PR plus complet.
