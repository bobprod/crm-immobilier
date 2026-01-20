# ANALYSIS_AUTOGEN - Résumé automatique
Generated: 2026-01-19T11:05:59.733Z

## Markdown files (found)
- ANALYSIS_AUTOGEN.md  —  mtime: 2026-01-18T17:42:13.518Z
- ARCHITECTURE_DIAGRAMMES_VISUELS.md  —  mtime: 2026-01-11T23:34:25.891Z
- ARCHITECTURE_DIAGRAMS.md  —  mtime: 2026-01-11T23:35:02.636Z
- ARCHITECTURE_MODULES_ANALYSE_COMPLETE.md  —  mtime: 2026-01-11T23:34:25.894Z
- ARCHITECTURE_MULTI_PROVIDER.md  —  mtime: 2026-01-11T23:34:25.897Z
- ARCHITECTURE_SAAS_CORE_VISUAL.md  —  mtime: 2026-01-01T20:00:57.976Z
- ARCHITECTURE_VISUALIZATION.md  —  mtime: 2026-01-11T23:34:25.899Z
- ARCHITECTURE_VISUELLE_PROSPECTION_AI.md  —  mtime: 2026-01-11T23:34:25.902Z
- INVESTMENT_INTELLIGENCE_MULTI_SOURCE_ARCHITECTURE.md  —  mtime: 2026-01-01T20:00:58.007Z
- MAJ_2026-01-17.md  —  mtime: 2026-01-17T14:14:36.727Z
- VISUAL_ARCHITECTURE_GUIDE.md  —  mtime: 2026-01-11T23:34:26.095Z
- analysis\db-read-rows.md  —  mtime: 2026-01-17T14:43:47.511Z
- analysis\db-read-tests.md  —  mtime: 2026-01-17T17:53:52.392Z
- analysis\frontend-modules.md  —  mtime: 2026-01-17T14:17:41.786Z
- analysis\prisma-db-inventory.md  —  mtime: 2026-01-17T14:17:41.766Z
- analysis\sensitive-fields.md  —  mtime: 2026-01-17T17:53:52.584Z

## Key paths scanned
- backend  —  mtime: 2026-01-18T17:39:26.109Z
- frontend  —  mtime: 2026-01-17T14:00:43.058Z
- backend\prisma\schema.prisma  —  mtime: 2026-01-18T16:32:00.350Z

## Top of selected files

### ANALYSIS_AUTOGEN.md
```
# ANALYSIS_AUTOGEN - Résumé automatique
Generated: 2026-01-18T17:42:13.506Z

## Markdown files (found)
- ANALYSIS_AUTOGEN.md  —  mtime: 2026-01-18T15:14:53.139Z
- ARCHITECTURE_DIAGRAMMES_VISUELS.md  —  mtime: 2026-01-11T23:34:25.891Z
- ARCHITECTURE_DIAGRAMS.md  —  mtime: 2026-01-11T23:35:02.636Z
- ARCHITECTURE_MODULES_ANALYSE_COMPLETE.md  —  mtime: 2026-01-11T23:34:25.894Z
- ARCHITECTURE_MULTI_PROVIDER.md  —  mtime: 2026-01-11T23:34:25.897Z
- ARCHITECTURE_SAAS_CORE_VISUAL.md  —  mtime: 2026-01-01T20:00:57.976Z
- ARCHITECTURE_VISUALIZATION.md  —  mtime: 2026-01-11T23:34:25.899Z
- ARCHITECTURE_VISUELLE_PROSPECTION_AI.md  —  mtime: 2026-01-11T23:34:25.902Z
- INVESTMENT_INTELLIGENCE_MULTI_SOURCE_ARCHITECTURE.md  —  mtime: 2026-01-01T20:00:58.007Z
- MAJ_2026-01-17.md  —  mtime: 2026-01-17T14:14
```

### ARCHITECTURE_DIAGRAMMES_VISUELS.md
```
# 🎪 FLUX VISUEL COMPLET: Web Data + AI Orchestrator + LLM Router

## Diagramme 1: Architecture en couches

```
┌────────────────────────────────────────────────────────────────────────┐
│                         🎯 PROSECTING-AI API                           │
│  POST /api/prospecting-ai/start {zone, targetType, propertyType}     │
└────────────────────────────┬───────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────┐
│               🎪 AI-ORCHESTRATOR (Orchestration Moteur)                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [1] INTEN
```

### ARCHITECTURE_DIAGRAMS.md
```
# 📐 Architecture & Diagrammes - API Keys Implementation

## 1. Flux de Sauvegarde des Clés API

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Next.js)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │   api-keys-enhanced.tsx                             │      │
│  │                                                       │      │
│  │  1. Input: API Keys (optionnel)                      │      │
│  │     - openaiApiKey: "sk-..."                         │      │
│  │     - geminiApiKey: "AIza..."                        │      │
│  │   
```

### ARCHITECTURE_MODULES_ANALYSE_COMPLETE.md
```
# 📊 ANALYSE COMPLÈTE : Architecture Web Data + AI Orchestrator + LLM Router

## 🏗️ Vue d'ensemble de l'architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROSPECTING-AI MODULE                          │
│  (Utilise AI Orchestrator pour générer des leads automatiquement)  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  AI-ORCHESTRATOR MODULE                           │
│                 (Orchestre le workflow complet)                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Intent Analyzer    → Comprend l'objectif (pr
```

### ARCHITECTURE_MULTI_PROVIDER.md
```
/**
 * ARCHITECTURE MULTI-PROVIDER - Résumé d'implémentation
 *
 * Crée: January 8, 2026
 * Objectif: Permettre à l'utilisateur de choisir les providers de scraping/recherche
 *          selon la disponibilité des clés API en mode BYOK
 */

=============================================================================
1. STRUCTURE À DEUX NIVEAUX
=============================================================================

Niveau 1: RECHERCHE & ORCHESTRATION (ai-orchestrator module)
─────────────────────────────────────
  ├─ ProviderSelectorService (NOUVEAU)
  │  ├─ Vérifie la disponibilité des clés API
  │  ├─ Sélectionne la stratégie optimale de provider
  │  ├─ Retourne les tools disponibles pour IntentAnalyzer
  │  └─ Supporte dynamiquement: SerpAPI, Firecrawl, Puppete
```

### ARCHITECTURE_SAAS_CORE_VISUAL.md
```
# Architecture Visuelle - SaaS Core CRM Immobilier

## 🏗️ Vue d'Ensemble de l'Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          SaaS CORE Platform                          │
│                       (Modules Réutilisables 85%+)                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│   Immobilier  │         │    Voyage     │         │  Autre Métier │
│   (Existant)  │         │ 
```

### ARCHITECTURE_VISUALIZATION.md
```
# 🎨 VISUALISATION - ARCHITECTURE FINALE

## Frontend User Interface

```
┌─────────────────────────────────────────────────────────┐
│                   SETTINGS PAGE                         │
│                  /settings/index.tsx                    │
├─────────────────────────────────────────────────────────┤
│ Paramètres                                              │
│                                                         │
│ APIs & Intégrations                                     │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ◉ Configuration LLM / IA                          │ │
│ │ ⚙ Stratégie des Providers      ← NEW! 🆕        │ │
│ │ 🔍 APIs de Scraping                              │ │
│ │ ⚡ Intégrations                                    │ │
│
```

### ARCHITECTURE_VISUELLE_PROSPECTION_AI.md
```
# 🏗️ Architecture Visuelle - Module Prospection IA Frontend

## 📊 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│                   Module Prospection IA Frontend                     │
│                       (7,035 lignes de code)                         │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
        ┌────────▼─────┐  ┌──────▼──────┐  ┌─────▼──────┐
        │  Components  │  │   Hooks     │  │   Types    │
        │   (15 comp)  │  │  (1 hook)   │  │ (1 fichier)│
        └──────────────┘  └─────────────┘  └────────────┘
```

---

## 🔴 Architecture
```

### INVESTMENT_INTELLIGENCE_MULTI_SOURCE_ARCHITECTURE.md
```
# Architecture Multi-Sources - Investment Intelligence Module

## 🌍 Vue d'Ensemble

Le module Investment Intelligence doit supporter **plusieurs plateformes d'investissement immobilier** de différents pays/régions, avec un système flexible permettant d'ajouter de nouvelles sources facilement.

---

## 📍 Plateformes Supportées (Roadmap)

### Phase 1 - France (MVP)
- ✅ **Bricks.co** - Crowdfunding immobilier résidentiel
- ✅ **Homunity** - Investissement participatif immobilier
- ✅ **Anaxago** - Crowdfunding equity & immobilier

### Phase 2 - France (Extension)
- 🔄 **Fundimmo** - SCPI & crowdfunding
- 🔄 **Lymo** - Investissement fractionné
- 🔄 **Raizers** - Crowdfunding immobilier & énergies renouvelables
- 🔄 **Wiseed** - Crowdfunding startup & immobilier

### Phase
```

### MAJ_2026-01-17.md
```
# MAJ 2026-01-17 — Architecture & Cartographie des modules

Date: 2026-01-17

Résumé exécutif
- Ce document centralise l'architecture actuelle du projet, les modules backend/frontend/BDD et les correctifs prioritaires identifiés lors des analyses.

## 1) Vue d'ensemble (haut niveau)
```mermaid
flowchart LR
  subgraph Frontend
    FE[Next.js Frontend]
  end
  subgraph Backend
    API[NestJS API]
    AUTH[Auth Module]
    USERS[Users]
    PROPS[Properties]
    PROSPECTS[Prospects]
    NOTIFS[Notifications]
    AI[AI / LLM Orchestrator]
    WHATSAPP[WhatsApp / Messaging]
    BILLING[Billing]
    INTEGR[3rd-party Integrations]
    SCRAP[Scraping / Orchestrator]
  end
  subgraph DB[PostgreSQL + Prisma]
    PG[(crm_immobilier DB)]
  end
  FE -->|HTTP / REST / GraphQL| API
  API --> PG
  API --> 
```

### VISUAL_ARCHITECTURE_GUIDE.md
```
# 📐 API Key Test Button - Visual Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/Next.js)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Settings Page (/settings)                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ API Keys Tab                                              │    │
│  │ ─────────────────────────────────────────────────────── │    │
│  │                                                             │    │
│  │ Google Gemini API Key [AIzaSyB6...            ] [Tester] │    │
│  │          
```

### analysis\db-read-rows.md
```
# DB Read Rows Capture — 2026-01-17T14:43:47.510Z

## Connection
[
  {
    "db": "crm_immobilier",
    "user": "postgres"
  }
]

## Tables (first 100)
- public.AiSuggestion
- public.DetectedAnomaly
- public.MlConfig
- public.Page
- public.PropertySeo
- public.ProspectingSource
- public.PublishedProperty
- public.SeoBlogPost
- public.SeoConfig
- public.TrackingConfig
- public.TrackingEvent
- public.VitrineAnalytics
- public.VitrineConfig
- public._prisma_migrations
- public.activities
- public.agencies
- public.agency_api_keys
- public.ai_credits
- public.ai_error_log
- public.ai_generations
- public.ai_orchestrations
- public.ai_pricing
- public.ai_settings
- public.ai_usage
- public.ai_usage_metrics
- public.analytics_events
- public.appointments
- public.business_modules
- public.campaig
```

## Backend src top-level (if exists)
- backend\src\@types
- backend\src\app.controller.ts
- backend\src\app.module.ts
- backend\src\app.service.ts
- backend\src\common
- backend\src\config
- backend\src\examples
- backend\src\main.ts
- backend\src\modules
- backend\src\scripts
- backend\src\shared
- backend\src\types

## Frontend src top-level (if exists)
- frontend\src\components
- frontend\src\env.d.ts
- frontend\src\lib
- frontend\src\modules
- frontend\src\pages
- frontend\src\shared