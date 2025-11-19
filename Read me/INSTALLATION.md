# 🚀 GUIDE D'INSTALLATION COMPLET

## ✅ FICHIERS AJOUTÉS DEPUIS LE TEST

```
Nouveaux fichiers de configuration ajoutés :

Backend:
  ✅ main.ts
  ✅ app.module.ts (avec tous les 18 modules)
  ✅ app.controller.ts
  ✅ app.service.ts
  ✅ package.json (avec toutes les dépendances)
  ✅ tsconfig.json
  ✅ nest-cli.json
  ✅ .env.example (50+ variables)
  ✅ .gitignore

Frontend:
  ✅ package.json
  ✅ next.config.js
  ✅ tsconfig.json
  ✅ tailwind.config.js
  ✅ .env.example

RÉSULTAT : Projet 100% complet et prêt à installer !
```

---

## 📋 PRÉREQUIS

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** >= 18.x
- **npm** ou **yarn**
- **PostgreSQL** >= 14.x
- **Git** (optionnel)

---

## 🔧 INSTALLATION BACKEND

### 1. Copier les fichiers

```bash
# Depuis le dossier CODE_COMPLET téléchargé
cd CODE_COMPLET

# Les fichiers backend sont dans le sous-dossier backend/
# Les fichiers de config sont à la racine
```

### 2. Installer les dépendances

```bash
# À la racine de CODE_COMPLET
npm install
```

**Packages principaux installés** :
- NestJS framework
- Prisma ORM
- JWT authentication
- Swagger documentation
- Twilio (SMS/WhatsApp)
- Nodemailer (Email)
- Anthropic AI
- Tesseract OCR
- Et 20+ autres...

### 3. Configuration base de données

#### A. Créer la base de données PostgreSQL

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base
CREATE DATABASE crm_immobilier;

# Créer un utilisateur (optionnel)
CREATE USER crm_user WITH PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE crm_immobilier TO crm_user;

# Quitter
\q
```

#### B. Configurer les variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env
nano .env
```

**Variables OBLIGATOIRES à configurer** :

```env
# Database
DATABASE_URL="postgresql://crm_user:votre_mot_de_passe@localhost:5432/crm_immobilier?schema=public"

# JWT
JWT_SECRET=changez-ceci-par-une-cle-securisee-longue
JWT_REFRESH_SECRET=changez-ceci-aussi

# Email (exemple avec Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app

# Twilio (pour SMS/WhatsApp)
TWILIO_ACCOUNT_SID=votre-sid
TWILIO_AUTH_TOKEN=votre-token
TWILIO_PHONE_NUMBER=+1234567890

# AI
ANTHROPIC_API_KEY=votre-cle-anthropic
```

### 4. Appliquer les migrations Prisma

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy

# OU appliquer le schema directement
npx prisma db push

# Vérifier avec Prisma Studio (optionnel)
npx prisma studio
```

Cela va créer les **24 tables** :
- users
- prospects
- properties
- communications
- documents
- appointments
- ai_usage_metrics
- conversion_events
- ... et 16 autres

### 5. Lancer le backend

```bash
# Mode développement
npm run start:dev

# Mode production
npm run build
npm run start:prod
```

Le backend démarre sur **http://localhost:3000**

### 6. Vérifier que ça fonctionne

```bash
# Test health check
curl http://localhost:3000/api

# Devrait retourner:
# {
#   "message": "CRM Immobilier API",
#   "version": "1.0.0",
#   "status": "running",
#   "modules": [...],
#   "endpoints": 144
# }
```

### 7. Accéder à la documentation Swagger

Ouvrir dans le navigateur : **http://localhost:3000/api/docs**

Vous verrez les **144 endpoints** documentés !

---

## 🎨 INSTALLATION FRONTEND

### 1. Naviguer vers le dossier frontend

```bash
cd frontend
```

### 2. Installer les dépendances

```bash
npm install
```

**Packages principaux installés** :
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Radix UI
- Lucide icons
- Recharts
- Axios

### 3. Configuration

```bash
# Copier .env.example
cp .env.example .env.local

# Éditer .env.local
nano .env.local
```

**Configuration** :

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 4. Lancer le frontend

```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

Le frontend démarre sur **http://localhost:3001**

### 5. Vérifier que ça fonctionne

Ouvrir **http://localhost:3001** dans le navigateur.

---

## 🧪 TESTS

### Backend

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend

```bash
cd frontend
npm run test
```

---

## 📊 VÉRIFICATION COMPLÈTE

### Checklist Backend ✅

```bash
✅ npm install terminé sans erreurs
✅ .env configuré avec toutes les variables
✅ DATABASE_URL correcte
✅ npx prisma generate OK
✅ npx prisma migrate deploy OK
✅ 24 tables créées dans PostgreSQL
✅ npm run start:dev démarre sans erreurs
✅ http://localhost:3000/api répond
✅ http://localhost:3000/api/docs accessible
✅ 144 endpoints visibles dans Swagger
```

### Checklist Frontend ✅

```bash
✅ npm install terminé sans erreurs
✅ .env.local configuré
✅ NEXT_PUBLIC_API_URL correcte
✅ npm run dev démarre sans erreurs
✅ http://localhost:3001 accessible
✅ Composants s'affichent correctement
✅ Appels API fonctionnent
```

---

## 🔍 TROUBLESHOOTING

### Erreur : "Cannot connect to database"

```bash
# Vérifier que PostgreSQL est démarré
sudo systemctl status postgresql

# Démarrer PostgreSQL
sudo systemctl start postgresql

# Vérifier DATABASE_URL dans .env
echo $DATABASE_URL
```

### Erreur : "Module not found: @nestjs/..."

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur : "Prisma schema not found"

```bash
# Vérifier que schema.prisma existe
ls database/schema.prisma

# Régénérer le client
npx prisma generate
```

### Erreur Frontend : "Failed to fetch"

```bash
# Vérifier que le backend tourne
curl http://localhost:3000/api

# Vérifier NEXT_PUBLIC_API_URL
cat frontend/.env.local
```

### Erreur : "Port 3000 already in use"

```bash
# Trouver le processus
lsof -i :3000

# Tuer le processus
kill -9 <PID>

# Ou utiliser un autre port
PORT=3002 npm run start:dev
```

---

## 📚 STRUCTURE PROJET

```
CODE_COMPLET/
├── backend/              ← 18 modules NestJS
│   ├── main.ts
│   ├── app.module.ts
│   ├── ai-metrics/
│   ├── analytics/
│   ├── appointments/
│   ├── auth/
│   ├── campaigns/
│   ├── communications/
│   ├── dashboard/
│   ├── documents/
│   ├── integrations/
│   ├── matching/
│   ├── prisma/
│   ├── properties/
│   ├── prospecting/
│   ├── prospects/
│   ├── settings/
│   ├── tasks/
│   ├── users/
│   └── validation/
│
├── frontend/             ← Next.js React
│   ├── components/
│   ├── lib/
│   ├── pages/
│   └── styles/
│
├── database/             ← Prisma & SQL
│   ├── schema.prisma
│   └── add_ai_metrics.sql
│
├── package.json          ← Dépendances backend
├── tsconfig.json         ← Config TypeScript
├── .env.example          ← Variables env
└── nest-cli.json         ← Config NestJS
```

---

## 🚀 PRÊT À UTILISER

Une fois l'installation terminée, vous avez :

✅ **Backend** - 18 modules, 144 endpoints, Swagger docs
✅ **Frontend** - Interface React complète
✅ **Database** - 24 tables PostgreSQL
✅ **Auth** - JWT fonctionnel
✅ **AI** - Tracking ROI intégré
✅ **Communications** - Email, SMS, WhatsApp
✅ **Documents** - Upload, OCR, AI
✅ **Et tout le reste !**

---

## 🎉 ÉTAPES SUIVANTES

1. **Créer un premier utilisateur** via l'endpoint `/api/auth/register`
2. **Se connecter** avec `/api/auth/login`
3. **Explorer Swagger** à `http://localhost:3000/api/docs`
4. **Tester le frontend** à `http://localhost:3001`
5. **Commencer à utiliser le CRM !**

---

**Bon déploiement !** 🚀
