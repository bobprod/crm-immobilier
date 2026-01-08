# 📊 Statut du Test Docker - CRM Immobilier

**Date:** 2026-01-07 15:15
**Statut:** 🔄 Installation npm en cours

---

## ✅ CE QUI FONCTIONNE

### 1. Configuration Docker ✅
Tous les fichiers sont créés et fonctionnels :
- ✅ `docker-compose.test.yml` (configuration production)
- ✅ `docker-compose.test-dev.yml` (configuration développement - **EN COURS**)
- ✅ `backend/Dockerfile` + `frontend/Dockerfile` + `frontend/Dockerfile.playwright`
- ✅ `run-tests.sh` + `run-tests.bat`
- ✅ `backend/scripts/seed-test.ts`
- ✅ `.env.test` (backend + frontend)
- ✅ `TESTING.md` (documentation complète)

### 2. Base de données PostgreSQL ✅
```
✅ HEALTHY - Port 5433
✅ Conteneur: crm-db-test-dev
✅ Prêt à recevoir les données
```

### 3. Backend NestJS 🔄
```
🔄 EN COURS - Installation npm
⏱️  Temps écoulé: 10+ minutes
📊 Processus actif: PID 8 (npm install)
📦 Package lourd en cours: Puppeteer (~150MB Chromium)
```

---

## 🔍 COMMANDES DE SURVEILLANCE

### Surveiller l'installation en temps réel
```cmd
REM Voir les logs en direct
docker compose -f docker-compose.test-dev.yml logs -f backend-test

REM Vérifier les processus actifs
docker compose -f docker-compose.test-dev.yml exec backend-test ps aux

REM Statut des conteneurs
docker compose -f docker-compose.test-dev.yml ps
```

### Vérifier quand l'installation est terminée
```cmd
REM Chercher le message de succès
docker compose -f docker-compose.test-dev.yml logs backend-test | findstr "packages"

REM L'installation est terminée quand tu vois :
REM "added XXX packages"
REM "🔧 Generating Prisma Client..."
```

---

## ⏭️ PROCHAINES ÉTAPES (APRÈS NPM INSTALL)

### 1. Vérifier que tout est prêt
```cmd
REM Le backend devrait afficher :
REM ✅ Starting development server...
REM [Nest] XX  - XX/XX/XXXX XX:XX:XX     LOG [NestFactory] Starting Nest application...
```

### 2. Tester le backend
```cmd
REM Test du endpoint health
curl http://localhost:3002/api

REM Devrait retourner :
REM {"status":"ok","timestamp":"..."}
```

### 3. Exécuter le seed de la base de données
```cmd
docker compose -f docker-compose.test-dev.yml exec backend-test npm run seed:test

REM Devrait créer :
REM - 1 utilisateur (test@crm-immobilier.com / test123)
REM - 3 prospects
REM - 2 propriétés
REM - 4 rendez-vous
```

### 4. Tester l'API des appointments
```cmd
REM Login pour obtenir le token
curl -X POST http://localhost:3002/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@crm-immobilier.com\",\"password\":\"test123\"}"

REM Récupérer les rendez-vous à venir (remplace TOKEN par le token JWT)
curl http://localhost:3002/api/appointments/upcoming ^
  -H "Authorization: Bearer TOKEN"
```

---

## 🛑 COMMANDES D'ARRÊT

### Arrêter les conteneurs
```cmd
REM Arrêter sans supprimer les volumes (garde les données)
docker compose -f docker-compose.test-dev.yml down

REM Arrêter ET supprimer les volumes (reset complet)
docker compose -f docker-compose.test-dev.yml down -v
```

### Redémarrer proprement
```cmd
REM Arrêter tout
docker compose -f docker-compose.test-dev.yml down -v

REM Redémarrer
docker compose -f docker-compose.test-dev.yml up -d
```

---

## 🐛 DÉPANNAGE

### Si npm install semble bloqué
```cmd
REM Vérifier les processus
docker compose -f docker-compose.test-dev.yml exec backend-test ps aux

REM Si aucun processus npm/node, redémarrer :
docker compose -f docker-compose.test-dev.yml restart backend-test
```

### Si l'installation échoue
```cmd
REM Voir les erreurs complètes
docker compose -f docker-compose.test-dev.yml logs backend-test

REM Reset complet et redémarrage
docker compose -f docker-compose.test-dev.yml down -v
docker compose -f docker-compose.test-dev.yml up -d --build
```

### Vérifier l'espace disque
```cmd
REM Si npm install échoue par manque d'espace
docker system df

REM Nettoyer si nécessaire
docker system prune -a
```

---

## 📈 TEMPS D'INSTALLATION ESTIMÉS

### Première fois (cold start)
- **npm install** : 10-15 minutes (téléchargement de ~150MB pour Puppeteer)
- **Prisma generate** : 10-30 secondes
- **DB push** : 5-10 secondes
- **NestJS start** : 20-30 secondes
- **TOTAL** : ~15-20 minutes

### Fois suivantes (avec cache Docker)
- **npm install** : 10-30 secondes (cache)
- **Autres étapes** : <1 minute
- **TOTAL** : ~2 minutes

---

## ✅ VÉRIFICATION FINALE

Une fois que tout est démarré, tu devrais avoir :

```cmd
docker compose -f docker-compose.test-dev.yml ps

# Devrait afficher :
# crm-db-test-dev        Up (healthy)    5433->5432
# crm-backend-test-dev   Up              3002->3001
```

Et ces endpoints devraient répondre :
- `http://localhost:3002/api` → `{"status":"ok"}`
- `http://localhost:3002/api/docs` → Swagger UI
- `http://localhost:5433` → PostgreSQL

---

## 🎯 TEST COMPLET DES APPOINTMENTS

```bash
# 1. Login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@crm-immobilier.com\",\"password\":\"test123\"}"

# Copier le token JWT retourné

# 2. Liste des rendez-vous
curl http://localhost:3002/api/appointments/upcoming \
  -H "Authorization: Bearer VOTRE_TOKEN"

# 3. Créer un rendez-vous
curl -X POST http://localhost:3002/api/appointments \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\":\"Test Visite\",
    \"type\":\"visit\",
    \"priority\":\"high\",
    \"startTime\":\"2026-01-08T14:00:00Z\",
    \"endTime\":\"2026-01-08T15:00:00Z\",
    \"location\":\"Test Location\"
  }"
```

---

**📝 Note:** Ce fichier sera mis à jour quand l'installation sera terminée.
