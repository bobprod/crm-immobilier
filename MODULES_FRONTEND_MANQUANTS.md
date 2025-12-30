# 🎯 MODULES FRONTEND MANQUANTS - PLAN D'ACTION

**Date:** 30 Décembre 2025
**Analyse:** Backend vs Frontend Coverage

---

## 📊 VUE D'ENSEMBLE

| Catégorie | Total | Avec UI | Partiel | Sans UI | Coverage |
|-----------|-------|---------|---------|---------|----------|
| **CORE** | 5 | 3 | 1 | 1 | 60% |
| **BUSINESS** | 11 | 9 | 1 | 1 | 82% |
| **INTELLIGENCE** | 15 | 5 | 4 | 6 | 33% |
| **COMMUNICATIONS** | 3 | 1 | 2 | 0 | 33% |
| **CONTENT** | 4 | 4 | 0 | 0 | 100% |
| **MARKETING** | 3 | 3 | 0 | 0 | 100% |
| **AUTRES** | 6 | 5 | 0 | 1 | 83% |
| **TOTAL** | **47** | **30** | **8** | **9** | **64%** |

---

## 🔴 PRIORITÉ 1 - CRITIQUE (Backend complet, Business Impact élevé)

### 1. AI Billing System
**Backend:** `/backend/src/modules/ai-billing`

| Composant | Status | Effort |
|-----------|--------|--------|
| Controllers | ✅ Complet (3 controllers) | - |
| Services | ✅ Complet (4 services) | - |
| Database | ✅ Migrations + Models | - |
| Frontend | ❌ **MANQUANT** | 5 jours |

**Ce qui manque (Frontend):**
```
pages/settings/ai-billing/
├── credits.tsx              # Dashboard crédits IA
│   └── Affichage balance
│   └── Historique transactions
│   └── Recharge crédits
│
├── usage.tsx               # Monitoring consommation
│   └── Graphiques usage par provider
│   └── Coût par module
│   └── Prédictions budget
│
├── api-keys.tsx            # BYOK (Bring Your Own Keys)
│   └── Liste clés API
│   └── Configuration providers
│   └── Test connexions
│
└── pricing.tsx             # Configuration tarifs
    └── Tarifs par modèle
    └── Règles pricing custom
    └── Simulateur coûts
```

**API Endpoints Disponibles:**
- `GET /api/ai-billing/credits` - Balance crédits
- `POST /api/ai-billing/credits/purchase` - Acheter crédits
- `GET /api/ai-billing/usage` - Historique usage
- `GET /api/ai-billing/api-keys` - Liste clés
- `POST /api/ai-billing/api-keys` - Ajouter clé
- `DELETE /api/ai-billing/api-keys/:id` - Supprimer clé

**Business Impact:**
- 🎯 Monétisation système
- 💰 Contrôle coûts IA
- 🔑 Flexibilité BYOK
- 📊 Transparence usage

---

### 2. Module Registry UI
**Backend:** `/backend/src/modules/core/module-registry`

| Composant | Status | Effort |
|-----------|--------|--------|
| Controllers | ✅ Complet | - |
| Services | ✅ Registry + Dynamic Menu | - |
| Database | ✅ Module model | - |
| Frontend | ⚠️ **PARTIEL** (Dynamic Menu seulement) | 4 jours |

**Ce qui manque (Frontend):**
```
pages/settings/modules/
├── registry.tsx            # Liste modules disponibles
│   └── Grille modules avec icônes
│   └── Statut (installé/disponible)
│   └── Actions (installer/désinstaller)
│
├── marketplace.tsx         # Marketplace modules
│   └── Catalogue complet
│   └── Catégories
│   └── Recherche/Filtres
│   └── Détails module (readme, screenshots)
│
├── installed.tsx           # Modules installés
│   └── Liste modules actifs
│   └── Configuration rapide
│   └── Mise à jour disponible
│
└── configure/[moduleId].tsx  # Configuration module
    └── Settings spécifiques module
    └── Permissions
    └── Activation/Désactivation
```

**API Endpoints Disponibles:**
- `GET /api/modules/registry` - Liste modules
- `POST /api/modules/registry/install` - Installer module
- `DELETE /api/modules/registry/:id` - Désinstaller
- `GET /api/modules/:id/config` - Config module
- `PUT /api/modules/:id/config` - Mettre à jour config

**Business Impact:**
- 🔌 Architecture Plug & Play
- 🚀 Extensibilité système
- 👥 SaaS multi-tenant
- 📦 Marketplace future

---

### 3. Investment Intelligence
**Backend:** `/backend/src/modules/investment-intelligence`

| Composant | Status | Effort |
|-----------|--------|--------|
| Controllers | ✅ Complet | - |
| Services | ✅ 5 services (import, analysis, comparison, alerts, registry) | - |
| Adapters | ✅ 3 adapters (Bricks, Homunity, Generic) | - |
| Database | ✅ InvestmentProject model | - |
| Frontend | ❌ **MANQUANT COMPLET** | 7 jours |

**Ce qui manque (Frontend):**
```
pages/investment/
├── index.tsx               # Dashboard projets
│   └── KPIs (ROI moyen, projets actifs, etc.)
│   └── Projets récents
│   └── Alertes
│
├── projects/
│   ├── index.tsx           # Liste projets
│   │   └── Table avec filtres
│   │   └── Tri par ROI, rendement, etc.
│   │   └── Statuts projets
│   │
│   └── [id].tsx            # Détail projet
│       └── Infos complètes
│       └── Analyse financière
│       └── Documents
│       └── Timeline
│
├── import.tsx              # Import multi-sources
│   └── Sélection source (Bricks, Homunity, URL)
│   └── Preview données
│   └── Mapping champs
│   └── Validation import
│
├── analysis.tsx            # Analyse comparative
│   └── Comparaison projets
│   └── Graphiques ROI
│   └── Scoring projets
│   └── Recommandations IA
│
└── alerts.tsx              # Alertes investissement
    └── Nouvelles opportunités
    └── Changements prix
    └── Notifications personnalisées
```

**API Endpoints Disponibles:**
- `GET /api/investment/projects` - Liste projets
- `POST /api/investment/import` - Importer projet
- `GET /api/investment/sources` - Sources disponibles
- `POST /api/investment/analyze` - Analyser projet
- `POST /api/investment/compare` - Comparer projets
- `GET /api/investment/alerts` - Alertes actives

**Business Impact:**
- 🏢 Nouvelle vertical business
- 📈 Multi-source data aggregation
- 🤖 Analyse IA automatisée
- 💎 Opportunités investissement

---

## 🟡 PRIORITÉ 2 - IMPORTANTE (Optimisation UX)

### 4. Scraping Dashboard
**Backend:** `/backend/src/modules/scraping`

| Composant | Status | Effort |
|-----------|--------|--------|
| Services | ✅ 4 services (Cheerio, Puppeteer, Firecrawl, WebData) | - |
| Controllers | ✅ ScrapingController | - |
| Queue | ✅ ScrapingQueueService | - |
| Frontend | ❌ **MANQUANT** | 4 jours |

**Ce qui manque:**
```
pages/scraping/
├── dashboard.tsx           # Vue d'ensemble
├── sources.tsx             # Config sources
├── queue.tsx               # File d'attente
├── results.tsx             # Résultats
└── settings.tsx            # Configuration scraping
```

**Business Impact:**
- 🔍 Prospection automatisée
- 📊 Data intelligence
- ⚡ Gain temps agents

---

### 5. AI Orchestrator Dashboard
**Backend:** `/backend/src/modules/intelligence/ai-orchestrator`

| Composant | Status | Effort |
|-----------|--------|--------|
| Controllers | ✅ AiOrchestratorController | - |
| Services | ✅ 7 services (orchestrator, intent, executor, etc.) | - |
| Frontend | ⚠️ **PARTIEL** (intégré dans settings) | 4 jours |

**Ce qui manque:**
```
pages/ai-orchestrator/
├── dashboard.tsx           # Monitoring temps réel
├── providers.tsx           # Config providers LLM
├── routing.tsx             # Règles routing
├── analytics.tsx           # Analytics usage
└── costs.tsx               # Optimisation coûts
```

**Business Impact:**
- 💰 Optimisation coûts IA (30-50%)
- 🎯 Routing intelligent
- 📊 Monitoring centralisé

---

### 6. Quick Wins Interfaces Dédiées (4 modules)

#### 6.1 Smart Forms
**Backend:** ✅ `/backend/src/modules/intelligence/smart-forms`

| Composant | Status | Effort |
|-----------|--------|--------|
| Service | ✅ SmartFormsService | - |
| Frontend | ⚠️ Intégré dans settings | 2 jours |

**Interface dédiée manquante:**
```
pages/quick-wins/smart-forms/
├── index.tsx               # Liste formulaires
├── builder.tsx             # Constructeur IA
├── templates.tsx           # Templates pré-faits
└── analytics.tsx           # Analytics soumissions
```

#### 6.2 Semantic Search
**Backend:** ✅ `/backend/src/modules/intelligence/semantic-search`

**Interface dédiée manquante:**
```
pages/quick-wins/semantic-search/
├── index.tsx               # Interface recherche
├── config.tsx              # Configuration embeddings
└── analytics.tsx           # Analytics recherches
```

#### 6.3 Priority Inbox
**Backend:** ✅ `/backend/src/modules/intelligence/priority-inbox`

**Interface dédiée manquante:**
```
pages/quick-wins/priority-inbox/
├── index.tsx               # Boîte prioritaire
├── rules.tsx               # Règles priorité
└── analytics.tsx           # Analytics emails
```

#### 6.4 Auto Reports
**Backend:** ✅ `/backend/src/modules/intelligence/auto-reports`

**Interface dédiée manquante:**
```
pages/quick-wins/auto-reports/
├── index.tsx               # Liste rapports
├── schedule.tsx            # Planification
├── templates.tsx           # Templates rapports
└── history.tsx             # Historique
```

**Business Impact (tous):**
- ⚡ Productivité +30%
- 🤖 Automatisation tâches répétitives
- 📊 Meilleure prise de décision

---

## 🟢 PRIORITÉ 3 - NICE TO HAVE (Améliorations)

### 7. Behavioral Prospecting Analytics
**Backend:** ✅ `/backend/src/modules/prospecting` (behavioral-prospecting)

| Composant | Status | Effort |
|-----------|--------|--------|
| Controllers | ✅ BehavioralProspectingController | - |
| Services | ✅ BehavioralSignalsService | - |
| Frontend | ⚠️ Intégré dans prospecting | 3 jours |

**Interface dédiée manquante:**
```
pages/prospecting/behavioral/
├── signals.tsx             # Dashboard signaux
├── scoring.tsx             # Scoring temps réel
├── rules.tsx               # Règles scoring
└── analytics.tsx           # Analytics comportementaux
```

**Business Impact:**
- 🎯 Qualification automatique
- 📈 Conversion +20%
- 🔮 Prédiction intentions

---

### 8. Email AI Extensions
**Backend:** ✅ `/backend/src/modules/communications/email-ai-response`

| Composant | Status | Effort |
|-----------|--------|--------|
| Controllers | ✅ EmailAIResponseController | - |
| Services | ✅ Analyse + génération | - |
| Frontend | ⚠️ Page isolée | 3 jours |

**Extensions manquantes:**
```
pages/communications/email/
├── ai-response.tsx         # ✅ Existe
├── drafts.tsx              # ❌ Brouillons IA
├── templates.tsx           # ❌ Templates IA
└── analytics.tsx           # ❌ Analytics emails
```

**Business Impact:**
- 📧 Réponse emails +50% plus rapide
- 🎯 Personnalisation automatique
- 📊 Suivi performance

---

## 📈 PLANNING DÉVELOPPEMENT

### Sprint 1 (Semaine 1-2) - CRITIQUE
**Objectif:** Modules à impact business élevé

| Module | Jours | Développeur | Status |
|--------|-------|-------------|--------|
| AI Billing Dashboard | 5 | Dev 1 | 🔴 À faire |
| Module Registry UI | 4 | Dev 1 | 🔴 À faire |
| Investment Intelligence (base) | 7 | Dev 2 | 🔴 À faire |

**Livrables:**
- ✅ AI Billing complet et fonctionnel
- ✅ Module Registry avec installation/config
- ✅ Investment Intelligence MVP (import + liste)

---

### Sprint 2 (Semaine 3-4) - IMPORTANT
**Objectif:** Optimisation & productivité

| Module | Jours | Développeur | Status |
|--------|-------|-------------|--------|
| Scraping Dashboard | 4 | Dev 1 | 🟡 À faire |
| AI Orchestrator UI | 4 | Dev 2 | 🟡 À faire |
| Quick Wins - Smart Forms | 2 | Dev 1 | 🟡 À faire |
| Quick Wins - Semantic Search | 2 | Dev 2 | 🟡 À faire |

**Livrables:**
- ✅ Scraping opérationnel
- ✅ AI Orchestrator monitoring
- ✅ 2 Quick Wins fonctionnels

---

### Sprint 3 (Semaine 5-6) - AMÉLIORATION
**Objectif:** Complétion & polish

| Module | Jours | Développeur | Status |
|--------|-------|-------------|--------|
| Quick Wins - Priority Inbox | 2 | Dev 1 | 🟢 À faire |
| Quick Wins - Auto Reports | 2 | Dev 2 | 🟢 À faire |
| Behavioral Prospecting | 3 | Dev 1 | 🟢 À faire |
| Email AI Extensions | 3 | Dev 2 | 🟢 À faire |
| Investment Intelligence (avancé) | 4 | Dev 1+2 | 🟢 À faire |

**Livrables:**
- ✅ Tous Quick Wins opérationnels
- ✅ Behavioral prospecting analytics
- ✅ Email AI complet
- ✅ Investment Intelligence v2

---

## 🎯 EFFORT TOTAL ESTIMÉ

| Priorité | Modules | Jours/Dev | Équipe 2 Dev |
|----------|---------|-----------|--------------|
| 🔴 P1 - Critique | 3 | 16 jours | **8 jours** |
| 🟡 P2 - Important | 6 | 16 jours | **8 jours** |
| 🟢 P3 - Nice to Have | 5 | 14 jours | **7 jours** |
| **TOTAL** | **14** | **46 jours** | **23 jours** |

**Avec 2 développeurs en parallèle: ~5 semaines**

---

## 📋 CHECKLIST PAR MODULE

### AI Billing
- [ ] Page credits.tsx
  - [ ] Dashboard crédits
  - [ ] Historique transactions
  - [ ] Recharge crédits
- [ ] Page usage.tsx
  - [ ] Graphiques usage
  - [ ] Coût par module
  - [ ] Prédictions
- [ ] Page api-keys.tsx
  - [ ] CRUD clés API
  - [ ] Test connexions
  - [ ] Configuration providers
- [ ] Page pricing.tsx
  - [ ] Tarifs modèles
  - [ ] Simulateur
- [ ] Tests E2E
- [ ] Documentation

### Module Registry
- [ ] Page registry.tsx
  - [ ] Grille modules
  - [ ] Installation
- [ ] Page marketplace.tsx
  - [ ] Catalogue
  - [ ] Recherche
- [ ] Page installed.tsx
  - [ ] Liste installés
  - [ ] Actions rapides
- [ ] Page configure/[id].tsx
  - [ ] Settings module
  - [ ] Permissions
- [ ] Tests E2E
- [ ] Documentation

### Investment Intelligence
- [ ] Page dashboard
- [ ] Page projects/index.tsx
- [ ] Page projects/[id].tsx
- [ ] Page import.tsx
- [ ] Page analysis.tsx
- [ ] Page alerts.tsx
- [ ] Tests E2E
- [ ] Documentation

*(Continuer pour chaque module...)*

---

## 🔧 COMPOSANTS RÉUTILISABLES À CRÉER

### Composants UI Communs
```typescript
// Pour tous les modules
components/shared/
├── DataTable.tsx           # Table avec filtres/tri
├── Chart.tsx               # Graphiques réutilisables
├── StatCard.tsx            # Cartes statistiques
├── FilterPanel.tsx         # Panel filtres
├── ExportButton.tsx        # Export données
└── RefreshButton.tsx       # Refresh données
```

### Hooks Personnalisés
```typescript
hooks/
├── useModuleData.ts        # Fetch données module
├── useRealtime.ts          # WebSocket updates
├── useAnalytics.ts         # Analytics tracking
└── useExport.ts            # Export fonctionnalité
```

---

## 📚 RESSOURCES DÉVELOPPEMENT

### Backend API Disponibles
Tous les endpoints backend sont documentés dans Swagger:
- http://localhost:3001/api/docs

### Design System
- Radix UI components (déjà installé)
- shadcn/ui (déjà configuré)
- Tailwind CSS (déjà configuré)

### Exemples Code
Tous les modules existants peuvent servir de template:
- Properties (CRUD complet)
- Finance (Multi-pages)
- Prospecting (Analytics)

---

## ✅ VALIDATION

### Critères de Complétion

**Pour chaque module:**
- [ ] Pages créées et routées
- [ ] Composants UI fonctionnels
- [ ] API calls implémentés
- [ ] Loading states
- [ ] Error handling
- [ ] Responsive design
- [ ] Tests E2E Playwright
- [ ] Documentation README
- [ ] Review code
- [ ] Déployé en dev

---

## 🎉 CONCLUSION

**9 modules backend sans interface frontend**
**Effort total: ~5 semaines (2 développeurs)**

**Impact business après complétion:**
- 💰 Monétisation (AI Billing)
- 🔌 Extensibilité (Module Registry)
- 📈 Nouvelles verticales (Investment)
- ⚡ Productivité +30% (Quick Wins)
- 🎯 Optimisation coûts IA

**ROI estimé: 3-6 mois**

---

**Document créé:** 30 Décembre 2025
**Prochaine étape:** Commencer Sprint 1 - AI Billing
