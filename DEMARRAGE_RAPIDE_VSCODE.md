# 🚀 GUIDE DÉMARRAGE RAPIDE - VISUAL STUDIO CODE

**Projet:** CRM Immobilier - Full Stack (NestJS + Next.js)
**Date:** 30 Décembre 2025

---

## ⚡ INSTALLATION EXPRESS (15 minutes)

### 1️⃣ Installation Dépendances

```bash
# Ouvrir terminal dans VS Code (Ctrl+`)

# 1. Backend
cd backend
npm install
# Attendre ~3-5 minutes (47 packages)

# 2. Frontend
cd ../frontend
npm install
# Attendre ~5-7 minutes (76+ packages)
```

### 2️⃣ Configuration Prisma

```bash
cd ../backend

# Workaround pour environnement restreint
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# Générer Prisma Client
npx prisma generate

# Vérifier migrations
npx prisma migrate status

# Appliquer migrations (si nécessaire)
npx prisma migrate deploy

# (Optionnel) Seed données test
npx ts-node prisma/seed.ts
```

### 3️⃣ Démarrer Applications

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev

# Attendre: "Application is running on: http://localhost:3001"
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev

# Attendre: "Local: http://localhost:3004"
```

### 4️⃣ Vérification

**Backend API:**
- API: http://localhost:3001/api
- Swagger Docs: http://localhost:3001/api/docs

**Frontend:**
- App: http://localhost:3004
- Login: http://localhost:3004/auth/login

---

## 🔧 CONFIGURATION VS CODE

### Extensions Recommandées

**Installer ces extensions:**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.npm-intellisense",
    "pflannery.vscode-versionlens"
  ]
}
```

**Installation rapide:**
1. Créer `.vscode/extensions.json`
2. Copier le contenu ci-dessus
3. VS Code proposera automatiquement l'installation

### Settings VS Code (`.vscode/settings.json`)

```json
{
  // Formatage automatique
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",

  // TypeScript
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,

  // Prisma
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  },

  // ESLint
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],

  // Fichiers exclus
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true
  },

  // Terminal
  "terminal.integrated.defaultProfile.linux": "bash",
  "terminal.integrated.scrollback": 10000
}
```

### Tasks VS Code (`.vscode/tasks.json`)

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Backend: Start Dev",
      "type": "npm",
      "script": "start:dev",
      "path": "backend/",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    },
    {
      "label": "Frontend: Start Dev",
      "type": "npm",
      "script": "dev",
      "path": "frontend/",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    },
    {
      "label": "Start All (Backend + Frontend)",
      "dependsOn": ["Backend: Start Dev", "Frontend: Start Dev"],
      "problemMatcher": []
    },
    {
      "label": "Prisma: Generate",
      "type": "shell",
      "command": "cd backend && npx prisma generate",
      "problemMatcher": []
    },
    {
      "label": "Prisma: Studio",
      "type": "shell",
      "command": "cd backend && npx prisma studio",
      "problemMatcher": []
    }
  ]
}
```

**Utilisation:**
- `Ctrl+Shift+P` → "Tasks: Run Task"
- Choisir "Start All (Backend + Frontend)"

### Launch Configuration (`.vscode/launch.json`)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Backend: Debug",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "restart": true,
      "timeout": 60000,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Frontend: Debug",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/frontend",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

---

## 📁 STRUCTURE PROJET DANS VS CODE

### Organisation Workspace

**Ouvrir en Multi-Root Workspace:**

Créer `crm-immobilier.code-workspace`:
```json
{
  "folders": [
    {
      "name": "🏠 ROOT",
      "path": "."
    },
    {
      "name": "🔧 BACKEND",
      "path": "backend"
    },
    {
      "name": "🎨 FRONTEND",
      "path": "frontend"
    }
  ],
  "settings": {
    "files.exclude": {
      "**/node_modules": true,
      "**/.git": true
    }
  }
}
```

**Fichier → Ouvrir Workspace → Sélectionner `crm-immobilier.code-workspace`**

### Explorer Sidebar

```
CRM-IMMOBILIER/
├── 🏠 ROOT/
│   ├── .vscode/              # Config VS Code
│   ├── docs/                 # Documentation
│   ├── ANALYSE_COMPLETE_SEMAINE.md
│   └── DEMARRAGE_RAPIDE_VSCODE.md
│
├── 🔧 BACKEND/
│   ├── src/
│   │   ├── modules/          # 47 modules
│   │   ├── shared/           # Services partagés
│   │   └── config/           # Configuration
│   ├── prisma/
│   │   ├── schema.prisma     # Schema BDD
│   │   ├── migrations/       # 19 migrations
│   │   └── seed.ts           # Données test
│   └── package.json
│
└── 🎨 FRONTEND/
    ├── pages/                # Pages Router
    ├── src/
    │   ├── modules/          # Composants business
    │   ├── pages/            # App Router
    │   └── shared/           # Components UI
    └── package.json
```

---

## 🎯 RACCOURCIS ESSENTIELS

### Développement Quotidien

| Raccourci | Action |
|-----------|--------|
| `Ctrl+~` | Toggle Terminal |
| `Ctrl+Shift+~` | Nouveau Terminal |
| `Ctrl+P` | Quick Open fichier |
| `Ctrl+Shift+F` | Recherche globale |
| `Ctrl+Shift+P` | Command Palette |
| `F5` | Démarrer Debug |
| `Ctrl+Shift+B` | Run Build Task |

### Navigation Code

| Raccourci | Action |
|-----------|--------|
| `F12` | Go to Definition |
| `Alt+F12` | Peek Definition |
| `Shift+F12` | Find All References |
| `Ctrl+Click` | Go to Definition |
| `Alt+←/→` | Naviguer historique |

### Édition

| Raccourci | Action |
|-----------|--------|
| `Ctrl+D` | Sélectionner occurrence suivante |
| `Ctrl+Shift+L` | Sélectionner toutes occurrences |
| `Alt+↑/↓` | Déplacer ligne |
| `Ctrl+/` | Toggle commentaire |
| `Shift+Alt+F` | Formater document |

---

## 🧪 TESTS & DEBUGGING

### Backend Tests

```bash
# Unit tests
cd backend
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend Tests

```bash
# E2E Playwright
cd frontend
npm run test:e2e

# Mode UI (interactif)
npm run test:e2e:ui

# Mode headed (voir navigateur)
npm run test:e2e:headed
```

### Debug Backend (VS Code)

1. Ouvrir fichier backend (ex: `properties.controller.ts`)
2. Placer breakpoint (cliquer marge gauche ligne)
3. `F5` → Choisir "Backend: Debug"
4. Faire requête API
5. VS Code s'arrête au breakpoint

### Debug Frontend (Browser)

1. Ouvrir Chrome DevTools (`F12`)
2. Onglet "Sources"
3. Chercher fichier Next.js
4. Placer breakpoints
5. Interagir avec l'app

---

## 📊 DATABASE MANAGEMENT

### Prisma Studio (GUI)

```bash
cd backend
npx prisma studio

# Ouvre: http://localhost:5555
```

**Interface graphique pour:**
- Voir toutes les tables
- Éditer données
- Exécuter requêtes
- Voir relations

### Migrations

```bash
# Créer migration
npx prisma migrate dev --name ma_migration

# Appliquer migrations
npx prisma migrate deploy

# Reset BDD (DEV seulement!)
npx prisma migrate reset

# Statut migrations
npx prisma migrate status
```

### Prisma Client

```bash
# Régénérer après modification schema
npx prisma generate

# Format schema
npx prisma format
```

---

## 🔍 EXPLORER LES MODULES

### Backend - Trouver un Module

**Exemple: Module Finance**

```
backend/src/modules/business/finance/
├── finance.controller.ts    # Routes API
├── finance.service.ts       # Logique métier
├── finance.module.ts        # Configuration NestJS
└── dto/
    └── finance.dto.ts       # Types TypeScript
```

**Endpoints Finance:**
- `GET /api/finance/commissions`
- `GET /api/finance/invoices`
- `GET /api/finance/payments`
- `GET /api/finance/reports`

### Frontend - Trouver une Page

**Exemple: Page Finance**

```
frontend/pages/finance/
├── index.tsx                # Liste finance
├── commissions/
│   ├── [id].tsx            # Détail commission
│   └── new.tsx             # Nouvelle commission
├── invoices/
│   ├── [id].tsx            # Détail facture
│   └── new.tsx             # Nouvelle facture
└── payments/
    ├── [id].tsx            # Détail paiement
    └── new.tsx             # Nouveau paiement
```

**Composants Finance:**
```
frontend/src/modules/business/finance/components/
├── FinanceManager.tsx       # Manager principal
├── CommissionsList.tsx      # Liste commissions
├── InvoicesList.tsx         # Liste factures
└── PaymentsList.tsx         # Liste paiements
```

---

## 🔑 VARIABLES D'ENVIRONNEMENT

### Backend (`.env`)

**Minimal requis:**
```env
# Database
DATABASE_URL="postgresql://..."

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# LLM (au moins 1)
ANTHROPIC_API_KEY=sk-ant-...
# OU
OPENAI_API_KEY=sk-...

# Frontend URL
FRONTEND_URL=http://localhost:3004
```

### Frontend (`.env.local`)

**Minimal requis:**
```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Environment
NODE_ENV=development

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3004
```

---

## 🚨 TROUBLESHOOTING

### ❌ Erreur: "Cannot find module '@nestjs/...'"
**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### ❌ Erreur: "Prisma Client did not initialize yet"
**Solution:**
```bash
cd backend
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
npx prisma generate
```

### ❌ Erreur: "Port 3001 already in use"
**Solution:**
```bash
# Trouver process
lsof -i :3001
# OU
netstat -tulpn | grep 3001

# Tuer process
kill -9 <PID>
```

### ❌ Frontend: "Failed to fetch"
**Vérifier:**
1. Backend tourne sur port 3001
2. `NEXT_PUBLIC_API_URL` correct dans `.env.local`
3. CORS configuré (déjà fait dans backend)

### ❌ Database connection error
**Vérifier:**
1. `DATABASE_URL` dans `.env`
2. Connexion internet (Neon Cloud)
3. Migrations appliquées (`npx prisma migrate deploy`)

---

## 📚 RESSOURCES

### Documentation Modules

Voir fichiers README dans chaque module:
- `backend/src/modules/*/README.md`
- Documentation globale: `/docs`

### API Documentation

**Swagger UI:**
- http://localhost:3001/api/docs
- Tous les endpoints documentés
- Test interactif API

### Scripts Utiles

```bash
# Tests API
./test-api.sh
./test-all-endpoints.sh
./test-nestjs-apis.sh

# Prisma
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

---

## 🎓 WORKFLOW DÉVELOPPEMENT

### Ajouter un Nouveau Module Backend

1. Créer dossier module
2. Créer `*.module.ts`, `*.controller.ts`, `*.service.ts`
3. Créer DTOs dans `/dto`
4. Ajouter dans `app.module.ts`
5. Tester avec Swagger

### Ajouter une Nouvelle Page Frontend

1. Créer `pages/mon-module/index.tsx`
2. Créer composants dans `src/modules/mon-module/components/`
3. Créer API client dans `src/modules/mon-module/api/`
4. Ajouter route dans menu
5. Tester navigateur

### Modifier Schema BDD

1. Éditer `backend/prisma/schema.prisma`
2. Créer migration: `npx prisma migrate dev --name ma_modif`
3. Générer client: `npx prisma generate`
4. Redémarrer backend
5. Vérifier avec Prisma Studio

---

## ✅ CHECKLIST PREMIER DÉMARRAGE

- [ ] VS Code installé + extensions
- [ ] Node.js 20+ installé
- [ ] PostgreSQL accessible (Neon Cloud)
- [ ] `npm install` backend ✅
- [ ] `npm install` frontend ✅
- [ ] Prisma generate ✅
- [ ] Migrations appliquées ✅
- [ ] Backend démarre (port 3001) ✅
- [ ] Frontend démarre (port 3004) ✅
- [ ] Swagger accessible ✅
- [ ] Login fonctionne ✅
- [ ] API répond ✅

---

## 🎉 PRÊT À DÉVELOPPER !

**Vous êtes maintenant prêt à:**
- ✅ Développer de nouveaux modules
- ✅ Tester l'application complète
- ✅ Débugger backend & frontend
- ✅ Modifier la base de données
- ✅ Créer des interfaces pour modules manquants

**Bon développement ! 🚀**

---

**Dernière mise à jour:** 30 Décembre 2025
**Support:** Voir `ANALYSE_COMPLETE_SEMAINE.md` pour détails complets
