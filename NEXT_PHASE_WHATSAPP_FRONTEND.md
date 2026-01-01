# 🚀 Prochaine Phase: WhatsApp Frontend UI

**Date**: 2025-12-31
**Status**: ✅ Backend Complet - Prêt pour Frontend
**Branche**: `claude/scraping-orchestrator-unified-P1bjO`

---

## 📊 État Actuel du Projet

### ✅ Phases Complétées

#### Phase 1: SaaS Core Foundations (Backend Scraping Orchestrator)
- ✅ Provider Registry System
- ✅ Scraping Queue Management
- ✅ Metrics & Monitoring
- ✅ 17 fichiers backend (~2000 lignes)
- **Commit**: Phase 1 Scraping Orchestrator

#### Phase 2: Dashboards & UI (Frontend)
- ✅ Scraping Dashboard (4 pages)
- ✅ AI Orchestrator UI (3 pages)
- ✅ Unified Settings (1 page)
- ✅ 8 pages frontend (~2000 lignes)
- **Commit**: Phase 2 Dashboards & UI

#### Phase 3: Business Enhancements (UX & Analytics)
- ✅ LLM Provider Selector
- ✅ Provider Usage Badge
- ✅ Auto-Import Intelligence
- ✅ Analytics Dashboard
- ✅ Notification Center
- ✅ 5 composants + 2 pages (~1500 lignes)
- **Commit**: Phase 3 Business Enhancements

#### WhatsApp Bot - Backend Complet
- ✅ **Database Schema** (4 models, 7 enums)
  - WhatsAppConfig, WhatsAppConversation, WhatsAppMessage, WhatsAppTemplate
  - Migration Prisma: `20251231_add_whatsapp_module`

- ✅ **Backend Implementation** (13 fichiers, ~1500 lignes)
  - Services, Controllers, DTOs, Providers (Meta + Twilio)
  - **Commit**: WhatsApp Backend Implementation

- ✅ **Tests Complets** (6 fichiers, ~3076 lignes, 117+ tests)
  - Unit tests, Integration tests, E2E tests
  - Code coverage: >95%
  - **Commit**: Comprehensive WhatsApp Testing Suite

- ✅ **Security Fixes** (4 TODOs critiques résolus)
  - Webhook signature verification
  - Rate limiting (20/min text, 10/min media, 3/min bulk)
  - Phone validation E.164
  - Config lookup implementation
  - **Commit**: Critical Security & Quality Fixes

### 📈 Statistiques Projet

| Module | Backend | Frontend | Tests | Total |
|--------|---------|----------|-------|-------|
| Scraping Orchestrator | ~2000 | ~2000 | - | ~4000 |
| Business Enhancement | - | ~1500 | - | ~1500 |
| WhatsApp Bot | ~1500 | **0** | ~3076 | ~4576 |
| **TOTAL** | **~3500** | **~3500** | **~3076** | **~10076** |

---

## 🎯 Phase 4: WhatsApp Frontend UI

### Objectif
Créer une interface utilisateur complète pour gérer le module WhatsApp:
- Configuration WhatsApp (Meta/Twilio)
- Gestion des conversations
- Envoi de messages
- Templates WhatsApp
- Analytics & Statistiques

### Architecture Frontend Proposée

```
frontend/pages/communication/whatsapp/
├── index.tsx                    # Dashboard principal
├── config.tsx                   # Configuration WhatsApp
├── conversations/
│   ├── index.tsx               # Liste des conversations
│   └── [id].tsx                # Détail conversation + chat
├── templates/
│   ├── index.tsx               # Liste des templates
│   └── create.tsx              # Créer/éditer template
└── analytics.tsx               # Analytics WhatsApp

frontend/src/modules/communication/whatsapp/
├── components/
│   ├── ConfigWizard.tsx        # Assistant configuration Meta/Twilio
│   ├── ConversationList.tsx    # Liste conversations avec filtres
│   ├── ChatInterface.tsx       # Interface de chat
│   ├── MessageBubble.tsx       # Bulle de message
│   ├── TemplateCard.tsx        # Carte template WhatsApp
│   ├── SendMessageModal.tsx    # Modal envoi message
│   ├── QuickReplies.tsx        # Réponses rapides
│   └── WhatsAppStats.tsx       # Widgets statistiques
├── hooks/
│   ├── useWhatsAppConfig.ts    # Hook configuration
│   ├── useConversations.ts     # Hook conversations
│   ├── useMessages.ts          # Hook messages
│   └── useTemplates.ts         # Hook templates
└── types/
    └── whatsapp.types.ts       # Types TypeScript
```

### Pages à Créer (7 pages)

#### 1. Dashboard Principal (`index.tsx`)
**Fonctionnalités:**
- Vue d'ensemble des statistiques
- Messages envoyés/reçus (aujourd'hui, semaine, mois)
- Taux de réponse
- Conversations actives
- Templates les plus utilisés
- Graphiques de tendances

**Composants:**
- WhatsAppStats (4 cartes statistiques)
- ConversationPreview (dernières conversations)
- TemplateQuickAccess (templates favoris)
- ActivityTimeline (timeline activité)

#### 2. Configuration (`config.tsx`)
**Fonctionnalités:**
- Configuration Meta Cloud API
  - Phone Number ID
  - Business Account ID
  - Access Token
  - Webhook URL
- Configuration Twilio
  - Account SID
  - Auth Token
  - Phone Number
- Paramètres généraux
  - Auto-reply activé/désactivé
  - Heures d'ouverture
  - Message d'absence
- Test de connexion

**Composants:**
- ConfigWizard (assistant pas à pas)
- ProviderSelector (Meta/Twilio)
- WebhookSetup (configuration webhook)
- ConnectionTest (test API)

#### 3. Liste Conversations (`conversations/index.tsx`)
**Fonctionnalités:**
- Liste toutes les conversations
- Filtres:
  - Status (open, assigned, resolved, closed)
  - Assigné à (utilisateur)
  - Tags
  - Date
  - Numéro de téléphone
- Recherche par numéro/nom
- Tri (dernière activité, nombre messages, non lus)
- Actions bulk:
  - Assigner
  - Fermer
  - Ajouter tags

**Composants:**
- ConversationList (liste avec virtualization)
- ConversationFilters (filtres avancés)
- SearchBar (recherche)
- BulkActions (actions groupées)

#### 4. Détail Conversation (`conversations/[id].tsx`)
**Fonctionnalités:**
- Interface de chat en temps réel
- Historique complet des messages
- Informations contact
  - Nom
  - Numéro
  - Lead/Prospect lié
  - Tags
- Actions:
  - Envoyer message texte
  - Envoyer média (image, document, vidéo, audio)
  - Envoyer template
  - Assigner à utilisateur
  - Ajouter tags
  - Fermer conversation
- Scroll infini pour messages
- Indicateurs de statut (envoyé, délivré, lu)

**Composants:**
- ChatInterface (interface principale)
- MessageBubble (bulle message avec status)
- SendMessageForm (formulaire envoi)
- MediaUploader (upload fichiers)
- ContactInfo (sidebar infos)
- QuickReplies (réponses rapides)

#### 5. Liste Templates (`templates/index.tsx`)
**Fonctionnalités:**
- Liste tous les templates WhatsApp
- Filtres:
  - Catégorie (marketing, utility, authentication)
  - Status (pending, approved, rejected)
  - Langue
- Recherche par nom
- Prévisualisation template
- Statistiques par template:
  - Envoyés
  - Délivrés
  - Lus
  - Échoués
- Actions:
  - Créer nouveau
  - Éditer
  - Dupliquer
  - Supprimer

**Composants:**
- TemplateCard (carte template avec stats)
- TemplateFilters (filtres)
- TemplatePreview (prévisualisation)
- TemplateStats (statistiques détaillées)

#### 6. Créer/Éditer Template (`templates/create.tsx`)
**Fonctionnalités:**
- Formulaire création template
- Champs:
  - Nom
  - Catégorie
  - Langue
  - Header (optionnel)
  - Body (avec variables {{1}}, {{2}})
  - Footer (optionnel)
  - Boutons (optionnel)
- Prévisualisation en direct
- Validation des variables
- Soumission à Meta pour approbation

**Composants:**
- TemplateForm (formulaire)
- TemplateEditor (éditeur rich)
- VariableManager (gestion variables)
- LivePreview (prévisualisation mobile)
- ButtonBuilder (constructeur boutons)

#### 7. Analytics (`analytics.tsx`)
**Fonctionnalités:**
- Graphiques détaillés:
  - Messages par jour/semaine/mois
  - Taux de réponse
  - Temps de réponse moyen
  - Distribution par type (text, media, template)
  - Top templates utilisés
- Filtres temporels (7j, 30j, 90j, custom)
- Export données (CSV, PDF)
- Comparaison périodes

**Composants:**
- AnalyticsChart (graphiques Recharts)
- MetricsCards (cartes métriques)
- DateRangePicker (sélection période)
- ExportButton (export données)
- ComparisonView (comparaison)

---

## 🔧 Technologies & Librairies Frontend

### Core
- **Next.js 14** (Pages Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**

### UI Components
- **Shadcn/ui** ou **Headless UI** (composants accessibles)
- **lucide-react** (icônes)
- **react-hot-toast** (notifications)
- **react-dropzone** (upload fichiers)

### Data Fetching
- **SWR** ou **TanStack Query** (react-query)
- **axios** (HTTP client)

### Charts & Visualization
- **Recharts** ou **Chart.js** (graphiques)
- **date-fns** (manipulation dates)

### Real-time (optionnel Phase 5)
- **Socket.io-client** (WebSocket)
- **React Query avec polling** (alternative)

### Forms
- **React Hook Form**
- **zod** (validation)

---

## 📋 Plan d'Implémentation Phase 4

### Sous-Phase 4.1: Configuration & Dashboard (2 pages)
**Fichiers:**
1. `frontend/pages/communication/whatsapp/index.tsx` (~300 lignes)
2. `frontend/pages/communication/whatsapp/config.tsx` (~400 lignes)
3. `frontend/src/modules/communication/whatsapp/components/ConfigWizard.tsx` (~250 lignes)
4. `frontend/src/modules/communication/whatsapp/components/WhatsAppStats.tsx` (~150 lignes)
5. `frontend/src/modules/communication/whatsapp/hooks/useWhatsAppConfig.ts` (~100 lignes)

**Total**: ~1200 lignes

### Sous-Phase 4.2: Conversations & Chat (2 pages)
**Fichiers:**
1. `frontend/pages/communication/whatsapp/conversations/index.tsx` (~350 lignes)
2. `frontend/pages/communication/whatsapp/conversations/[id].tsx` (~500 lignes)
3. `frontend/src/modules/communication/whatsapp/components/ConversationList.tsx` (~200 lignes)
4. `frontend/src/modules/communication/whatsapp/components/ChatInterface.tsx` (~400 lignes)
5. `frontend/src/modules/communication/whatsapp/components/MessageBubble.tsx` (~100 lignes)
6. `frontend/src/modules/communication/whatsapp/components/SendMessageModal.tsx` (~200 lignes)
7. `frontend/src/modules/communication/whatsapp/hooks/useConversations.ts` (~150 lignes)
8. `frontend/src/modules/communication/whatsapp/hooks/useMessages.ts` (~150 lignes)

**Total**: ~2050 lignes

### Sous-Phase 4.3: Templates (2 pages)
**Fichiers:**
1. `frontend/pages/communication/whatsapp/templates/index.tsx` (~300 lignes)
2. `frontend/pages/communication/whatsapp/templates/create.tsx` (~450 lignes)
3. `frontend/src/modules/communication/whatsapp/components/TemplateCard.tsx` (~150 lignes)
4. `frontend/src/modules/communication/whatsapp/components/TemplateEditor.tsx` (~300 lignes)
5. `frontend/src/modules/communication/whatsapp/hooks/useTemplates.ts` (~100 lignes)

**Total**: ~1300 lignes

### Sous-Phase 4.4: Analytics (1 page)
**Fichiers:**
1. `frontend/pages/communication/whatsapp/analytics.tsx` (~400 lignes)
2. `frontend/src/modules/communication/whatsapp/components/AnalyticsChart.tsx` (~200 lignes)

**Total**: ~600 lignes

### Sous-Phase 4.5: Types & Utilities
**Fichiers:**
1. `frontend/src/modules/communication/whatsapp/types/whatsapp.types.ts` (~150 lignes)
2. `frontend/src/modules/communication/whatsapp/utils/formatters.ts` (~100 lignes)
3. `frontend/src/modules/communication/whatsapp/utils/validators.ts` (~80 lignes)

**Total**: ~330 lignes

---

## 📊 Estimation Totale Phase 4

| Sous-Phase | Pages | Composants | Hooks | Lignes |
|------------|-------|------------|-------|--------|
| 4.1 Config & Dashboard | 2 | 2 | 1 | ~1200 |
| 4.2 Conversations | 2 | 4 | 2 | ~2050 |
| 4.3 Templates | 2 | 2 | 1 | ~1300 |
| 4.4 Analytics | 1 | 1 | 0 | ~600 |
| 4.5 Types | - | - | - | ~330 |
| **TOTAL** | **7** | **9** | **4** | **~5480** |

---

## 🎨 Design Guidelines

### Palette Couleurs WhatsApp
```css
--whatsapp-green: #25D366
--whatsapp-green-dark: #128C7E
--whatsapp-blue: #34B7F1
--whatsapp-teal: #075E54
--whatsapp-light-green: #DCF8C6 (messages envoyés)
--whatsapp-white: #FFFFFF (messages reçus)
```

### Iconographie
- 📱 WhatsApp logo
- 💬 Messages
- 📋 Templates
- 📊 Analytics
- ⚙️ Configuration
- 👤 Contacts
- 🏷️ Tags

---

## ✅ Checklist Avant de Commencer Phase 4

- [x] Backend WhatsApp complet et testé
- [x] Migration Prisma créée
- [x] Tous les TODOs de sécurité résolus
- [x] Tests E2E passent
- [x] Documentation à jour
- [ ] Installer dépendances frontend (SWR, Recharts, etc.)
- [ ] Créer structure de dossiers
- [ ] Définir mock data pour développement

---

## 🚦 Commande pour Démarrer Phase 4

```bash
# Installer nouvelles dépendances
cd frontend
npm install swr recharts date-fns react-hook-form zod react-dropzone

# Créer structure de dossiers
mkdir -p pages/communication/whatsapp/{conversations,templates}
mkdir -p src/modules/communication/whatsapp/{components,hooks,types,utils}

# Démarrer Phase 4.1
# Créer: config.tsx, index.tsx, ConfigWizard.tsx, etc.
```

---

## 🎯 Après Phase 4: Phase 5 (Optionnel)

### Phase 5: Real-time & Advanced Features
- WebSocket pour messages en temps réel
- Notifications push desktop
- Chat bot automatique (réponses AI)
- Intégration CRM approfondie (auto-création leads)
- WhatsApp Business API avancé (catalogues produits)
- Multi-agent support (plusieurs agents simultanés)
- Rapports avancés & BI

---

**Prêt à démarrer Phase 4 !** 🚀

Dis-moi par quelle sous-phase tu veux commencer, ou si tu veux que je crée toutes les pages d'un coup.
