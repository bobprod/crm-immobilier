# Immo SaaS — CRM Immobilier

CRM SaaS complet pour la gestion immobilière : propriétés, prospects, transactions, mandats, communications, IA et marketing.

## Stack technique

| Couche     | Technologie                                               |
| ---------- | --------------------------------------------------------- |
| Frontend   | Next.js 16.1, React 19.2, TypeScript, MUI 7, Tailwind CSS |
| Backend    | NestJS 10.3, TypeScript, Prisma 6.19, PostgreSQL          |
| Temps réel | Socket.io (WebSockets)                                    |
| Queue      | Bull (Redis)                                              |
| Auth       | JWT + OAuth 2.0 (Google, Facebook)                        |
| IA         | Anthropic, OpenAI, Gemini, DeepSeek, OpenRouter           |
| Cartes     | Leaflet + React Leaflet                                   |
| Tests E2E  | Playwright                                                |

## Architecture

```
Immo Saas/
├── backend/          # API NestJS (port 3001)
│   ├── src/modules/  # 18 modules métier
│   └── prisma/       # Schema & migrations
├── frontend/         # App Next.js (port 3002)
│   ├── pages/        # Pages Router
│   └── src/modules/  # 13 modules UI
├── docs/             # Documentation
│   ├── architecture/ # Diagrammes & specs
│   ├── guides/       # Guides d'implémentation
│   └── analysis/     # Analyses DB & modules
├── scripts/          # Scripts utilitaires
│   ├── testing/      # Tests API
│   ├── setup/        # Installation
│   ├── db/           # Base de données
│   └── verify/       # Vérification
└── tools/            # Outils de développement
```

## Modules

### Backend (18 modules)

- **business** — Propriétés, prospects, mandats, transactions, propriétaires
- **dashboard** — Statistiques, graphiques, activités récentes
- **communications** — Email, SMS, WhatsApp, historique
- **notifications** — Alertes intelligentes (email, SMS, push, in-app)
- **ai-billing** — Facturation et suivi d'utilisation IA
- **intelligence** — Business intelligence & analytics
- **investment-intelligence** — Analyse d'investissements immobiliers
- **prospecting / prospecting-ai** — Prospection et IA de qualification
- **marketing** — Tracking (Meta, Google, TikTok), campagnes, heatmaps, A/B tests
- **integrations** — Intégrations tierces (WordPress, etc.)
- **content** — Gestion de contenu & SEO
- **scraping** — Extraction de données web

### Frontend (13 modules)

- **dashboard** — Tableau de bord avec stats en temps réel
- **business** — Gestion propriétés, prospects, mandats, transactions
- **communication** — Messagerie et collaboration
- **planning** — Planification et calendrier
- **intelligence** — Tableaux de bord BI
- **prospecting** — Interface de prospection
- **vitrine** — Site vitrine public
- **integrations** — Configuration des intégrations
- **security** — Permissions et sécurité

## Démarrage rapide

### Prérequis

- Node.js 22+
- PostgreSQL 15+
- Redis (optionnel, pour les queues Bull)

### Installation

```bash
# Backend
cd backend
npm install
cp .env.example .env   # Configurer les variables
npx prisma generate
npx prisma db push
npm run start:dev       # → http://localhost:3001

# Frontend
cd frontend
npm install
npm run dev             # → http://localhost:3002
```

### Variables d'environnement principales

```env
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/crm_immobilier

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# IA (au moins une clé)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=

# Email
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=
MAIL_PASSWORD=
```

### Compte de test

```
Email:    admin@crm.com
Password: Admin123!
Role:     ADMIN
```

## Scripts utiles

```bash
# Backend
npm run start:dev       # Dev avec hot-reload
npm run build           # Build production
npm run prisma:studio   # Interface Prisma Studio
npm run seed:test       # Données de test

# Frontend
npm run dev             # Dev (port 3002)
npm run build           # Build production
npm run test:e2e        # Tests Playwright
```

## API Endpoints principaux

| Endpoint                          | Description                     |
| --------------------------------- | ------------------------------- |
| `POST /api/auth/login`            | Authentification                |
| `GET /api/dashboard/stats`        | Statistiques du tableau de bord |
| `GET /api/properties`             | Liste des propriétés            |
| `GET /api/prospects`              | Liste des prospects             |
| `GET /api/transactions`           | Transactions en cours           |
| `GET /api/mandates`               | Mandats                         |
| `GET /api/appointments`           | Rendez-vous                     |
| `GET /api/tasks`                  | Tâches                          |
| `GET /api/communications/history` | Historique des communications   |
| `GET /api/documents`              | Documents                       |
| `GET /api/owners`                 | Propriétaires                   |
| `GET /api/matching`               | Matching prospects/propriétés   |
| `GET /api/notifications`          | Notifications                   |

## Licence

MIT
