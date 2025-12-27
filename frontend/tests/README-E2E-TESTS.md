# Tests E2E Playwright - Property Modal

## Configuration

### Credentials de Test
Pour les tests avec login réel, utilisez:
- **Email**: `admin@crm.com`
- **Password**: `Admin123!`

### Prérequis
1. Le backend doit être en cours d'exécution sur `http://localhost:3001`
2. Le frontend doit être en cours d'exécution sur `http://localhost:3000`
3. La base de données doit être accessible

## Fichiers de Tests

### 1. `property-modal.spec.ts`
Tests avec mocks d'API (plus rapides, pas besoin du backend)
- Test du comportement du modal (ouverture/fermeture)
- Validation des champs
- Tests UI/UX

### 2. `property-modal-real-login.spec.ts` ⭐ RECOMMANDÉ
Tests E2E complets avec login réel et API réelle
- Login automatique avant chaque test
- Création de propriétés réelles
- Modification de propriétés réelles
- Tests de bout en bout complets

## Démarrage des Serveurs

### Backend
```bash
cd backend
npm run start:dev
```

### Frontend
```bash
cd frontend
npm run dev
```

## Exécution des Tests

### Tous les tests Playwright
```bash
cd frontend
npx playwright test
```

### Tests spécifiques avec login réel
```bash
cd frontend
npx playwright test property-modal-real-login.spec.ts
```

### Mode interactif (avec navigateur visible)
```bash
cd frontend
npx playwright test property-modal-real-login.spec.ts --headed
```

### Mode debug
```bash
cd frontend
npx playwright test property-modal-real-login.spec.ts --debug
```

### Exécuter un test spécifique
```bash
cd frontend
npx playwright test property-modal-real-login.spec.ts -g "should create a new property"
```

### Uniquement avec Chromium
```bash
cd frontend
npx playwright test property-modal-real-login.spec.ts --project=chromium
```

## Voir les Résultats

### Rapport HTML
Après l'exécution des tests, voir le rapport:
```bash
cd frontend
npx playwright show-report
```

### Traces (pour debug)
Si un test échoue, les traces sont automatiquement enregistrées. Pour les voir:
```bash
cd frontend
npx playwright show-trace trace.zip
```

## Structure des Tests E2E avec Login

Chaque test suit ce flux:

1. **Setup (beforeEach)**
   - Navigation vers `/login`
   - Remplissage email: `admin@crm.com`
   - Remplissage password: `Admin123!`
   - Clic sur "Se connecter"
   - Attente de redirection vers `/dashboard` ou `/properties`
   - Navigation vers `/properties` si nécessaire

2. **Test Action**
   - Interaction avec le modal (Create/Update)
   - Remplissage des formulaires
   - Validation

3. **Assertion**
   - Vérification que les changements sont persistés
   - Vérification UI

## Tests Disponibles

### Create Property Modal
- ✅ Ouverture du modal de création
- ✅ Validation des champs requis
- ✅ Création réussie d'une propriété
- ✅ Annulation sans sauvegarder

### Update Property Modal
- ✅ Ouverture du modal d'édition avec données pré-remplies
- ✅ Modification et sauvegarde
- ✅ Annulation sans sauvegarder

### UI/UX Tests
- ✅ Fermeture avec touche Escape
- ✅ Validation de tous les champs
- ✅ États de chargement

## Dépannage

### Port 3000 déjà utilisé
Si le test échoue avec "EADDRINUSE", le frontend est déjà en cours d'exécution:
```bash
# Arrêter le processus
# Windows:
taskkill /F /IM node.exe

# Linux/Mac:
pkill -f "next"
```

### Backend non accessible
Vérifiez que le backend répond:
```bash
curl http://localhost:3001/api/health
```

### Tests qui échouent aléatoirement
Augmentez les timeouts dans la configuration si votre machine est lente:
```typescript
// playwright.config.ts
timeout: 60000 // 60 secondes au lieu de 30
```

## CI/CD Integration

Pour intégrer dans un pipeline CI/CD:

```yaml
# .github/workflows/e2e-tests.yml
- name: Run E2E tests
  run: |
    cd backend && npm run start:dev &
    cd frontend && npm run build && npm run start &
    sleep 10
    npx playwright test property-modal-real-login.spec.ts
```

## Notes Importantes

1. **Données de test**: Chaque test utilise un timestamp pour créer des données uniques et éviter les conflits
2. **Cleanup**: Les propriétés créées pendant les tests restent en base. Pensez à nettoyer régulièrement
3. **Isolation**: Chaque test crée ses propres données pour assurer l'isolation
4. **Performance**: Les tests avec login réel sont plus lents mais plus fiables que les tests mockés
