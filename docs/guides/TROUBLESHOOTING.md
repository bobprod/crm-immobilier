# 🔧 Troubleshooting - Clés API Deepseek

## ❌ Erreur: "Authentification requise. Veuillez vous connecter."

### Cause:
Le token n'est pas trouvé dans localStorage.

### Solutions:
```bash
# 1. Vérifier que vous êtes connecté
   - Vérifiez que vous avez entré vos identifiants de connexion
   - Vérifiez que la session n'a pas expiré

# 2. Nettoyer le cache navigateur
   - DevTools > Application > Clear Site Data
   - Fermer et rouvrir le navigateur

# 3. Vérifier localStorage
   - DevTools > Application > Local Storage
   - Chercher les clés: 'auth_token', 'access_token', 'crm-token', 'token'
   - Au moins une clé doit exister

# 4. Vérifier les logs backend
   - Dans le terminal backend, chercher les erreurs 401
```

---

## ❌ Erreur: "Clé invalide" ou "Erreur lors du test"

### Cause:
La clé API est incorrecte ou l'API du provider est inaccessible.

### Solutions:
```bash
# 1. Vérifier la clé API
   - Copier la clé exacte depuis votre compte Deepseek
   - Vérifier qu'il n'y a pas d'espaces avant/après
   - Vérifier qu'il n'y a pas de caractères spéciaux

# 2. Tester la clé manuellement
   curl -X GET "https://api.deepseek.com/v1/models" \
     -H "Authorization: Bearer sk-your-key-here"

   Si vous recevez 401: La clé est invalide
   Si vous recevez 200: La clé est valide

# 3. Vérifier la connectivité réseau
   - Vérifier que vous avez accès à api.deepseek.com
   - Vérifier si un firewall/proxy bloque les connexions

# 4. Vérifier les logs backend
   - Chercher des erreurs ECONNREFUSED
   - Chercher des erreurs 401/403
```

---

## ❌ Erreur: "Le modèle ne s'affiche pas"

### Cause:
La validation a réussi mais les modèles ne sont pas retournés.

### Solutions:
```bash
# 1. Forcer un rechargement
   - Appuyer sur Ctrl+F5 (vidage du cache)

# 2. Vérifier la réponse du backend
   - DevTools > Network > validate (request)
   - Chercher le champ "models" dans la réponse

   Réponse attendue:
   {
     "valid": true,
     "provider": "deepseek",
     "models": ["deepseek-chat", "deepseek-coder"]
   }

# 3. Vérifier les États React
   - Ajouter des console.log dans handleTestApiKey()
   - Vérifier que setAvailableModelsPerKey() est appelé
```

---

## ❌ Erreur: "La clé n'est pas sauvegardée"

### Cause:
La sauvegarde a échoué côté backend ou base de données.

### Solutions:
```bash
# 1. Vérifier les logs backend
   - Chercher les erreurs Prisma
   - Chercher les erreurs de base de données

# 2. Vérifier la requête PUT
   - DevTools > Network > /user (PUT request)
   - Vérifier que le body contient tous les champs

   Body attendu:
   {
     "deepseekApiKey": "sk-xxxx",
     "defaultProvider": "deepseek",
     "defaultModel": "deepseek-chat"
   }

# 3. Vérifier la réponse
   - La réponse doit contenir: { "success": true }

# 4. Vérifier la base de données
   - Vérifier que la table ai_settings existe
   - Vérifier que les colonnes deepseekApiKey existent
   - Vérifier que le userId est correct
```

---

## ❌ Erreur: "Après rechargement, la clé a disparu"

### Cause:
La clé n'a pas été sauvegardée en base de données, ou le rechargement ne récupère pas correctement les données.

### Solutions:
```bash
# 1. Vérifier le chargement au démarrage
   - DevTools > Network > /user/full (GET request)
   - Vérifier que la réponse contient deepseekApiKey

   Réponse attendue:
   {
     "deepseekApiKey": "sk-xxxx",
     "defaultProvider": "deepseek",
     "defaultModel": "deepseek-chat"
   }

# 2. Vérifier les logs de loadApiKeys()
   - Ajouter des console.log
   - Vérifier le statut HTTP de la réponse

# 3. Tester directement l'API
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3001/api/ai-billing/api-keys/user/full

# 4. Vérifier la base de données
   - SELECT * FROM ai_settings WHERE userId = 'xxx';
   - Vérifier que deepseekApiKey contient la clé

# 5. Vérifier le setState
   - Le state llmKeys doit être rempli après loadApiKeys()
```

---

## ❌ Erreur: "Le backend ne démarre pas"

### Cause:
Erreurs de dépendances ou de configuration.

### Solutions:
```bash
# 1. Installer les dépendances
   cd backend
   npm install

# 2. Vérifier les variables d'environnement
   - Copier .env.example en .env
   - Remplir les valeurs nécessaires

# 3. Vérifier la base de données
   - Vérifier que PostgreSQL/MongoDB est lancé
   - Vérifier que la connexion DB est correcte dans .env

# 4. Exécuter les migrations
   npm run migrate
   ou
   npm run prisma:migrate

# 5. Lancer le backend
   npm run dev

# 6. Vérifier que le port 3001 n'est pas utilisé
   lsof -i :3001  # macOS/Linux
   netstat -ano | findstr :3001  # Windows
```

---

## ❌ Erreur: "Le frontend ne démarre pas"

### Cause:
Erreurs de compilation ou dépendances manquantes.

### Solutions:
```bash
# 1. Installer les dépendances
   cd frontend
   npm install

# 2. Supprimer le cache
   rm -rf .next node_modules
   npm install

# 3. Compiler
   npm run build

# 4. Lancer le frontend
   npm run dev

# 5. Vérifier que le port 3000 n'est pas utilisé
   lsof -i :3000  # macOS/Linux
   netstat -ano | findstr :3000  # Windows
```

---

## 🧪 Tests ne fonctionnent pas

### Curl:

```bash
# Vérifier que curl est installé
which curl

# Vérifier que le backend répond
curl -I http://localhost:3001/health

# Tester l'authentification
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

### Playwright:

```bash
# Installer les navigateurs
npx playwright install

# Vérifier la version
npx playwright --version

# Vérifier que le frontend répond
curl -I http://localhost:3000

# Lancer les tests avec debug
npx playwright test tests/api-keys-deepseek.spec.ts --debug

# Lancer avec logs
npx playwright test tests/api-keys-deepseek.spec.ts --debug --headed
```

---

## 📋 Checklist de Diagnostic

- [ ] Backend démarre sans erreurs
- [ ] Frontend démarre sans erreurs
- [ ] Accès à http://localhost:3000
- [ ] Accès à http://localhost:3001
- [ ] Authentification fonctionne
- [ ] Token dans localStorage
- [ ] Page /settings/ai-api-keys accessible
- [ ] Onglet "LLM" visible
- [ ] Dropdown "Provider" fonctionnel
- [ ] Input "Clé" éditable
- [ ] Bouton "Tester" cliquable
- [ ] Toast notification affichées
- [ ] Base de données accessible
- [ ] Clés sauvegardées en BD
- [ ] Page recharge correctement

---

## 🆘 Aide Supplémentaire

**Si vous toujours des problèmes:**

1. **Vérifier les logs**:
   ```bash
   npm run dev -- --debug
   ```

2. **Vérifier la console navigateur**:
   - DevTools (F12)
   - Console tab
   - Chercher les erreurs

3. **Vérifier les requêtes réseau**:
   - DevTools (F12)
   - Network tab
   - Chercher les réponses 401/403/500

4. **Nettoyer complètement**:
   ```bash
   # Backend
   cd backend
   rm -rf node_modules dist .env
   npm install

   # Frontend
   cd frontend
   rm -rf node_modules .next .env
   npm install
   ```

5. **Réinitialiser les données**:
   ```bash
   # Base de données
   # Supprimer et recréer
   npm run prisma:reset
   ```

---

**Dernière ressource**: Consulter les fichiers de configuration
- `backend/.env`
- `frontend/.env.local`
- `package.json`

---

**Date**: 19 Janvier 2026
**Status**: ✅ Guide Complet
