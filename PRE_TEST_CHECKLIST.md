# ✅ CHECKLIST PRÉ-TEST - Clés API LLM

## Avant de lancer les tests Playwright

### 1️⃣ Services en Cours d'Exécution

- [ ] **Backend NestJS**
  ```bash
  cd backend
  npm run start:dev
  # Vérifier: Server running on http://localhost:3001
  ```

- [ ] **Frontend Next.js**
  ```bash
  cd frontend
  npm run dev
  # Vérifier: Local: http://localhost:3000
  ```

- [ ] **PostgreSQL**
  ```bash
  # Vérifier la connexion
  psql -U admin -h localhost -d crm_immobilier -c "SELECT 1"
  # Résultat: 1
  ```

### 2️⃣ Base de Données

- [ ] **Migrations Prisma appliquées**
  ```bash
  cd backend
  npx prisma migrate status
  # Tous les migrations devraient être "Migrations to apply: 0"
  ```

- [ ] **Colonnes LLM dans ai_settings**
  ```bash
  psql -U admin -h localhost -d crm_immobilier -c \
  "SELECT column_name FROM information_schema.columns
   WHERE table_name='ai_settings'
   AND column_name LIKE '%ApiKey'"
  # Doit afficher les 9 colonnes
  ```

### 3️⃣ Frontend

- [ ] **Page `/settings/ai-api-keys` accessible**
  ```bash
  curl -s http://localhost:3000/settings/ai-api-keys | grep "Mes Clés API"
  # Doit retourner quelque chose
  ```

- [ ] **Les 9 inputs existent dans le HTML**
  ```bash
  # Vérifier dans DevTools (F12)
  # Chercher: input#mistralApiKey, input#grokApiKey, etc.
  ```

### 4️⃣ Backend API

- [ ] **Endpoint GET `/api/ai-billing/api-keys/user` accessible**
  ```bash
  curl -X GET http://localhost:3001/api/ai-billing/api-keys/user \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json"
  # Doit retourner 200 OK ou 401 (token manquant)
  ```

- [ ] **Endpoint PUT `/api/ai-billing/api-keys/user` accessible**
  ```bash
  curl -X PUT http://localhost:3001/api/ai-billing/api-keys/user \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"mistralApiKey": "test"}'
  # Doit retourner 200 OK
  ```

### 5️⃣ Tests

- [ ] **Playwright installé**
  ```bash
  npx playwright --version
  # Résultat: Version 1.x.x
  ```

- [ ] **Fichier de test existe**
  ```bash
  ls -la tests/llm-api-keys-e2e.spec.ts
  # Doit afficher le fichier
  ```

- [ ] **Configuration Playwright existe**
  ```bash
  ls -la playwright.config.ts
  # Doit afficher le fichier
  ```

---

## 🚀 Commandes à Exécuter

### Option 1: Test Automatique (Recommandé)

**Windows:**
```batch
run-playwright-tests.bat
```

**Linux/macOS:**
```bash
./run-playwright-tests.sh
```

### Option 2: Test Manuel

```bash
# 1. Aller au répertoire racine du projet
cd /chemin/vers/CRM_IMMOBILIER_COMPLET_FINAL

# 2. Installer Playwright si nécessaire
npx playwright install --with-deps

# 3. Lancer les tests
npx playwright test tests/llm-api-keys-e2e.spec.ts --headed --reporter=html

# 4. Voir le rapport
npx playwright show-report
```

### Option 3: Test avec Debug

```bash
npx playwright test tests/llm-api-keys-e2e.spec.ts --debug --headed
```

---

## 📊 Résultat Attendu

✅ Tous les tests doivent passer:

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
```

---

## 🔴 Si Un Test Échoue

### Erreur: "Frontend not running"
```bash
# Démarrer: cd frontend && npm run dev
```

### Erreur: "Backend not running"
```bash
# Démarrer: cd backend && npm run start:dev
```

### Erreur: "Input not found: input#mistralApiKey"
```bash
# 1. Vérifier en navigateur: http://localhost:3000/settings/ai-api-keys
# 2. Appuyer sur F12
# 3. Chercher: input#mistralApiKey
# 4. Si absent, problème frontend
```

### Erreur: "Button not found"
```bash
# Vérifier que l'onglet LLM est cliqué
# Utiliser --debug pour voir les actions
npx playwright test tests/llm-api-keys-e2e.spec.ts --debug --headed
```

### Erreur: "Success message not visible"
```bash
# Normal - le test continue même si le message n'est pas visible
# Vérifier l'API en Network tab (F12)
# La sauvegarde a probablement fonctionné (status 200)
```

---

## 🔧 Outils de Debugging

### 1. Playwright Inspector (Recommandé)
```bash
npx playwright test tests/llm-api-keys-e2e.spec.ts --debug
```
Permet de:
- Mettre en pause les tests
- Inspecter les éléments
- Voir les sélecteurs
- Exécuter pas à pas

### 2. Playwright Trace Viewer
```bash
npx playwright show-trace trace.zip
```
Montre:
- Vidéo du test
- Console logs
- Network requests
- DOM snapshots

### 3. Report HTML
```bash
npx playwright show-report
```
Affiche:
- Résultats des tests
- Captures d'écran
- Vidéos (si erreur)
- Temps d'exécution

### 4. Vérification Manual du DOM
```javascript
// Dans la console du navigateur (F12)
document.querySelector('input#mistralApiKey')
document.querySelector('button[role="tab"]:has-text("LLM / IA")')
document.querySelector('button:has-text("Sauvegarder les clés LLM")')
```

---

## 📋 Variables d'Environnement

Vérifie que ces variables existent dans `.env` du frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Et dans `.env` du backend:

```env
DATABASE_URL=postgresql://admin:password@localhost:5432/crm_immobilier
JWT_SECRET=your-secret-key
```

---

## ✨ Tips Pro

### Accélérer les Tests
```bash
# Désactiver les timeouts
npx playwright test tests/llm-api-keys-e2e.spec.ts --timeout=60000
```

### Ralentir l'Exécution (pour voir)
```bash
npx playwright test tests/llm-api-keys-e2e.spec.ts --headed --slowmo=2000
```

### Exécuter Un Seul Test
```bash
npx playwright test -g "should fill and save Mistral API key"
```

### Avec Verbose Logging
```bash
npx playwright test tests/llm-api-keys-e2e.spec.ts --reporter=list --verbose
```

---

## 📞 Contacts & Ressources

- **Playwright Docs:** https://playwright.dev
- **Test Report:** Affichage automatique après exécution
- **Logs:** Affichage dans le terminal pendant l'exécution
- **Diagnostic:** `./scripts/diagnostic-llm-keys.sh`

---

## ✅ Prêt?

Si tout ce qui précède est coché ✅, tu peux lancer:

```bash
# Windows
run-playwright-tests.bat

# Linux/macOS
./run-playwright-tests.sh
```

**Bonne chance! 🎯**
