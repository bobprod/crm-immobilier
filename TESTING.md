# 🧪 Guide de Testing - CRM Immobilier

Ce document explique comment configurer et exécuter les tests E2E avec Docker.

## 📋 Table des Matières

- [Prérequis](#prérequis)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Architecture](#architecture)
- [Dépannage](#dépannage)

## 🎯 Prérequis

- **Docker Desktop** installé et en cours d'exécution
- **Docker Compose** v2.0 ou supérieur
- Au moins **4GB de RAM** disponible pour Docker
- Ports libres : `3002` (backend), `3003` (frontend), `5433` (PostgreSQL)

## ⚙️ Configuration

L'environnement de test est configuré avec les fichiers suivants :

```
.
├── docker-compose.test.yml       # Configuration Docker pour les tests
├── backend/
│   ├── Dockerfile                # Image Docker backend
│   ├── .env.test                 # Variables d'environnement backend
│   └── scripts/
│       └── seed-test.ts          # Script de seed pour données de test
├── frontend/
│   ├── Dockerfile                # Image Docker frontend
│   ├── Dockerfile.playwright     # Image Docker pour Playwright
│   └── .env.test                 # Variables d'environnement frontend
├── run-tests.sh                  # Script de lancement (Linux/Mac)
└── run-tests.bat                 # Script de lancement (Windows)
```

## 🚀 Utilisation

### Démarrage rapide

**Linux/Mac:**
```bash
# Rendre le script exécutable
chmod +x run-tests.sh

# Lancer les tests
./run-tests.sh
```

**Windows:**
```cmd
run-tests.bat
```

### Options disponibles

```bash
# Rebuild complet des images Docker
./run-tests.sh --build

# Nettoyer l'environnement après les tests
./run-tests.sh --clean

# Exécuter les tests avec interface graphique
./run-tests.sh --headed

# Mode debug (pause à chaque étape)
./run-tests.sh --debug

# Combiner plusieurs options
./run-tests.sh --build --clean
```

### Commandes manuelles

#### 1. Démarrer les services

```bash
# Démarrer tous les services
docker-compose -f docker-compose.test.yml up -d

# Démarrer avec rebuild
docker-compose -f docker-compose.test.yml up -d --build
```

#### 2. Seed de la base de données

```bash
docker-compose -f docker-compose.test.yml exec backend-test npm run seed:test
```

#### 3. Exécuter les tests

```bash
# Tous les tests
docker-compose -f docker-compose.test.yml run --rm playwright-test npx playwright test

# Tests spécifiques
docker-compose -f docker-compose.test.yml run --rm playwright-test npx playwright test tests/appointments

# Mode interactif
docker-compose -f docker-compose.test.yml run --rm playwright-test npx playwright test --ui
```

#### 4. Voir les logs

```bash
# Tous les services
docker-compose -f docker-compose.test.yml logs -f

# Service spécifique
docker-compose -f docker-compose.test.yml logs -f backend-test
docker-compose -f docker-compose.test.yml logs -f frontend-test
```

#### 5. Arrêter et nettoyer

```bash
# Arrêter les services
docker-compose -f docker-compose.test.yml down

# Supprimer également les volumes
docker-compose -f docker-compose.test.yml down -v
```

## 🏗️ Architecture

### Services Docker

#### 1. **db-test** (PostgreSQL)
- Image: `postgres:15-alpine`
- Port: `5433:5432`
- Base de données: `crm_test`
- Healthcheck: Vérifie la disponibilité avec `pg_isready`

#### 2. **backend-test** (NestJS)
- Build: `./backend/Dockerfile`
- Port: `3002:3001`
- Dépend de: `db-test`
- Initialisation:
  1. Génère Prisma Client
  2. Synchronise le schéma de base de données
  3. Démarre le serveur
- Healthcheck: Vérifie `/api/health`

#### 3. **frontend-test** (Next.js)
- Build: `./frontend/Dockerfile`
- Port: `3003:3000`
- Dépend de: `backend-test`
- Healthcheck: Vérifie la page d'accueil

#### 4. **playwright-test**
- Build: `./frontend/Dockerfile.playwright`
- Dépend de: `frontend-test`, `backend-test`
- Génère des rapports HTML dans `./frontend/playwright-report`
- Profile: `test` (ne démarre pas automatiquement)

### Données de test

Le script `backend/scripts/seed-test.ts` crée :

- **1 utilisateur de test**
  - Email: `test@crm-immobilier.com`
  - Password: `test123`
  - Rôle: `agent`

- **3 prospects**
  - Jean Dupont (buyer, active, Paris)
  - Marie Martin (seller, new, Lyon)
  - Pierre Dubois (buyer, contacted, Marseille)

- **2 propriétés**
  - Appartement T3 Paris 15ème
  - Maison avec jardin Lyon

- **4 rendez-vous**
  - Visite appartement (demain 14h)
  - Estimation bien (semaine prochaine)
  - Signature compromis (demain 16h)
  - Rendez-vous téléphonique (hier - pour tester la complétion)

## 🔧 Dépannage

### Problème : Les services ne démarrent pas

**Solution :**
```bash
# Vérifier les logs
docker-compose -f docker-compose.test.yml logs

# Vérifier que Docker est en cours d'exécution
docker ps

# Vérifier les ports
netstat -ano | findstr "3002 3003 5433"  # Windows
lsof -i :3002,3003,5433                  # Linux/Mac
```

### Problème : La base de données n'est pas accessible

**Solution :**
```bash
# Vérifier le healthcheck
docker-compose -f docker-compose.test.yml ps

# Se connecter à la DB manuellement
docker-compose -f docker-compose.test.yml exec db-test psql -U crm_test_user -d crm_test
```

### Problème : Les tests échouent avec des erreurs de timeout

**Solution :**
```bash
# Augmenter les délais dans playwright.config.ts
# Vérifier que tous les services sont healthy
docker-compose -f docker-compose.test.yml ps

# Relancer les tests avec plus de logs
docker-compose -f docker-compose.test.yml run --rm playwright-test npx playwright test --debug
```

### Problème : Erreur "Port already in use"

**Solution :**
```bash
# Identifier le processus utilisant le port
# Windows
netstat -ano | findstr "3002"
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3002 | xargs kill -9

# Ou modifier les ports dans docker-compose.test.yml
```

### Problème : Rebuild complet nécessaire

**Solution :**
```bash
# Supprimer tout et reconstruire
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml build --no-cache
docker-compose -f docker-compose.test.yml up -d
```

## 📊 Rapports de tests

Les rapports sont générés dans :
- `frontend/playwright-report/` - Rapport HTML interactif
- `frontend/test-results/` - Résultats détaillés

Pour voir le rapport :
```bash
cd frontend
npx playwright show-report
```

## 🎯 Best Practices

1. **Toujours utiliser --clean** en développement pour éviter les données corrompues
2. **Rebuild régulièrement** avec `--build` après des changements de dépendances
3. **Vérifier les logs** si un test échoue de manière inattendue
4. **Utiliser --headed** pour debugger visuellement les tests
5. **Conserver les volumes** en production CI/CD pour accélérer les builds

## 🔗 Ressources

- [Docker Documentation](https://docs.docker.com/)
- [Playwright Documentation](https://playwright.dev/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Next.js Testing](https://nextjs.org/docs/testing)

---

**Fichier généré le:** 2026-01-07
**Version:** 1.0.0
