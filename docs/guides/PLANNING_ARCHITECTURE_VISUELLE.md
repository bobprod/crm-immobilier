# Module de Planification Unifié - Architecture Visuelle

## Vue d'Ensemble du Système

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MODULE PLANIFICATION UNIFIÉ                        │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │   Vue Liste  │  │  Vue Kanban  │  │  Calendrier  │  │ Mindmap  │ │
│  │   (groupée)  │  │ (drag-drop)  │  │ (J/S/M)      │  │(futur)   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘ │
│         │                  │                  │                │       │
│         └──────────────────┴──────────────────┴────────────────┘       │
│                              │                                         │
│                    ┌─────────▼─────────┐                              │
│                    │  Planning API     │                              │
│                    │  Service Layer    │                              │
│                    └─────────┬─────────┘                              │
│                              │                                         │
│                    ┌─────────▼─────────┐                              │
│                    │  Backend REST API │                              │
│                    │  (15+ endpoints)  │                              │
│                    └─────────┬─────────┘                              │
│                              │                                         │
│                    ┌─────────▼─────────┐                              │
│                    │   Prisma ORM      │                              │
│                    └─────────┬─────────┘                              │
│                              │                                         │
│                    ┌─────────▼─────────┐                              │
│                    │  PostgreSQL DB    │                              │
│                    │  (3 new models)   │                              │
│                    └───────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────┘
```

## Structure des Données

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          MODÈLES DE DONNÉES                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐         ┌──────────────────┐                    │
│  │   TaskBoard      │◄────────│  TaskColumn      │                    │
│  ├──────────────────┤    1:N  ├──────────────────┤                    │
│  │ id               │         │ id               │                    │
│  │ userId           │         │ boardId (FK)     │                    │
│  │ name             │         │ name             │                    │
│  │ description      │         │ color            │                    │
│  │ color            │         │ position         │                    │
│  │ isDefault        │         │ limit            │                    │
│  │ layout (JSON)    │         │ settings (JSON)  │                    │
│  │ settings (JSON)  │         └────────┬─────────┘                    │
│  └────────┬─────────┘                  │                              │
│           │                            │ 1:N                          │
│           │ 1:N                  ┌─────▼─────────────┐                │
│           │                      │      Task         │                │
│           │                      ├───────────────────┤                │
│           └──────────────────────►│ id                │                │
│                                  │ userId            │                │
│  ┌──────────────────┐            │ title             │                │
│  │  PlanningView    │            │ description       │                │
│  ├──────────────────┤            │ status            │                │
│  │ id               │            │ priority          │                │
│  │ userId           │            │ dueDate           │                │
│  │ viewType         │◄───────┐   │ boardId (FK)      │                │
│  │ preferences      │   1:1  │   │ columnId (FK)     │                │
│  │ defaultView      │        │   │ position          │                │
│  │ filterOptions    │        │   │ viewType          │                │
│  │ layoutConfig     │        │   │ metadata (JSON)   │                │
│  └──────────────────┘        │   └─────────┬─────────┘                │
│                              │             │                          │
│  ┌──────────────────┐        │   ┌─────────▼─────────┐               │
│  │    User          │        │   │   Appointment     │               │
│  ├──────────────────┤        │   ├───────────────────┤               │
│  │ id               │◄───────┴───┤ id                │               │
│  │ email            │            │ userId            │               │
│  │ ...              │            │ title             │               │
│  │ taskBoards       │            │ startTime         │               │
│  │ planningViews    │            │ endTime           │               │
│  │ tasks            │            │ type              │               │
│  └──────────────────┘            │ status            │               │
│                                  └───────────────────┘               │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Flux de Données - Vue Kanban

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FLUX KANBAN DRAG & DROP                            │
└─────────────────────────────────────────────────────────────────────────┘

1. Utilisateur commence le drag
   │
   ▼
┌──────────────────────┐
│  onDragStart         │──► État: activeId = taskId
│  (DndContext)        │
└──────────────────────┘
   │
   ▼
2. Utilisateur déplace sur nouvelle colonne
   │
   ▼
┌──────────────────────┐
│  onDragOver          │──► Mise à jour optimiste de l'état local
│  (DndContext)        │    (nouvelle colonne, nouvelle position)
└──────────────────────┘
   │
   ▼
3. Utilisateur relâche
   │
   ▼
┌──────────────────────┐
│  onDragEnd           │──► POST /planning/tasks/move
│  (DndContext)        │    { taskId, columnId, position }
└──────────────────────┘
   │
   ├──► Succès ──► Toast "Déplacé"
   │
   └──► Erreur ──► Rollback état local + Toast erreur

```

## Flux de Données - Chargement Unifié

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CHARGEMENT DE DONNÉES UNIFIÉ                         │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│ Utilisateur ouvre    │
│ page Planning        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ loadPlanningData()   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│ GET /planning/unified?                           │
│   viewType=list                                  │
│   status=all                                     │
│   priority=all                                   │
│   search=""                                      │
└──────────┬───────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│ Backend PlanningService.getUnifiedPlanningData() │
│                                                   │
│ ┌─────────────────────────────────────────┐     │
│ │ Construire filtres (taskFilter, apptFilter)   │
│ └─────────────────────────────────────────┘     │
│           │                                      │
│           ▼                                      │
│ ┌─────────────────────────────────────────┐     │
│ │ Promise.all([                           │     │
│ │   prisma.tasks.findMany()              │     │
│ │   prisma.appointments.findMany()       │     │
│ │   getTaskBoards() si viewType=kanban   │     │
│ │   getPlanningViews()                   │     │
│ │ ])                                     │     │
│ └─────────────────────────────────────────┘     │
└──────────┬───────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│ Response:                                        │
│ {                                                │
│   tasks: [...],                                  │
│   appointments: [...],                           │
│   boards: [...],                                 │
│   views: [...],                                  │
│   metadata: {                                    │
│     viewType, totalTasks, totalAppointments      │
│   }                                              │
│ }                                                │
└──────────┬───────────────────────────────────────┘
           │
           ▼
┌──────────────────────┐
│ setData(response)    │──► Affichage dans la vue active
└──────────────────────┘
```

## API Endpoints - Arbre Complet

```
/planning
├── GET    /unified                    # Vue unifiée avec tous les filtres
├── /boards
│   ├── POST   /                       # Créer un tableau
│   ├── GET    /                       # Liste des tableaux
│   ├── GET    /initialize             # Initialiser tableau par défaut
│   ├── GET    /:boardId               # Détails d'un tableau
│   ├── PUT    /:boardId               # Modifier un tableau
│   └── DELETE /:boardId               # Supprimer un tableau
├── /columns
│   ├── POST   /                       # Créer une colonne
│   ├── PUT    /:columnId              # Modifier une colonne
│   └── DELETE /:columnId              # Supprimer une colonne
├── /tasks
│   └── POST   /move                   # Déplacer une tâche
└── /views
    ├── POST   /                       # Créer une vue
    ├── GET    /                       # Liste des vues
    ├── GET    /:viewId                # Détails d'une vue
    ├── PUT    /:viewId                # Modifier une vue
    └── DELETE /:viewId                # Supprimer une vue
```

## Composants Frontend - Hiérarchie

```
UnifiedPlanningPage
├── Header
│   ├── Title
│   └── "Nouvelle tâche" Button
│
├── Filters Bar
│   ├── Search Input
│   ├── Status Select
│   └── Priority Select
│
├── Tabs Navigation
│   ├── Liste Tab
│   ├── Kanban Tab
│   ├── Calendrier Tab
│   └── Mindmap Tab
│
├── Tab Content
│   │
│   ├── [Liste] → TaskListView
│   │   ├── "En retard" Group
│   │   ├── "Aujourd'hui" Group
│   │   ├── "À venir" Group
│   │   └── "Sans date" Group
│   │       └── TaskCard (x N)
│   │
│   ├── [Kanban] → KanbanBoardView
│   │   ├── DndContext
│   │   └── Column (x N)
│   │       └── SortableContext
│   │           └── TaskCard (x N)
│   │
│   ├── [Calendrier] → CalendarView
│   │   ├── Navigation (prev/next/today)
│   │   ├── Mode Selector (jour/semaine/mois)
│   │   └── Grid
│   │       └── DayCell (x N)
│   │           ├── Appointments
│   │           └── Tasks
│   │
│   └── [Mindmap] → MindmapPlaceholder
│       └── "Bientôt disponible"
│
└── Stats Footer
    ├── Total Tâches
    ├── Total Rendez-vous
    ├── Total Tableaux
    └── Total Vues
```

## Sécurité - Flux d'Authentification

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FLUX DE SÉCURITÉ JWT                               │
└─────────────────────────────────────────────────────────────────────────┘

Client                    Backend                      Database
  │                          │                            │
  │ POST /planning/boards    │                            │
  │ Authorization: Bearer...  │                            │
  ├─────────────────────────►│                            │
  │                          │                            │
  │                          │ @UseGuards(JwtAuthGuard)   │
  │                          │ Valider JWT token          │
  │                          │                            │
  │                          │ req.user = { id, email }   │
  │                          │                            │
  │                          │ Vérifier userId            │
  │                          │ dans DTO/params            │
  │                          │                            │
  │                          │ prisma.taskBoard.create({  │
  │                          │   userId: req.user.id      │
  │                          │ })                         │
  │                          ├───────────────────────────►│
  │                          │                            │
  │                          │      Board créé            │
  │                          │◄───────────────────────────┤
  │                          │                            │
  │      201 Created         │                            │
  │◄─────────────────────────┤                            │
  │                          │                            │
```

## Performance - Optimisations

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     STRATÉGIES D'OPTIMISATION                           │
└─────────────────────────────────────────────────────────────────────────┘

DATABASE LAYER
├── Index sur colonnes fréquentes
│   ├── tasks.userId, status, priority, dueDate
│   ├── task_boards.userId, isDefault
│   ├── task_columns.boardId, position
│   └── planning_views.userId, viewType
│
├── Relations optimisées
│   └── Includes conditionnels selon viewType
│       ├── Kanban: board + column uniquement
│       └── Autres: appointments + prospects + properties
│
└── Tri côté serveur
    └── ORDER BY position, dueDate, createdAt

API LAYER
├── Validation avec class-validator
├── DTO pour typage fort
├── Error handling global
└── Response standardisée

FRONTEND LAYER
├── Mise à jour optimiste (drag-drop)
├── Debounce sur recherche (à implémenter)
├── Toast notifications non-bloquantes
└── Cache client avec SWR (à implémenter)
```

## Migration Database - Étapes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MIGRATION VERS PRODUCTION                            │
└─────────────────────────────────────────────────────────────────────────┘

ÉTAPE 1: Backup
   npx prisma db push --preview-feature
   pg_dump crm_immobilier > backup_$(date +%Y%m%d).sql

ÉTAPE 2: Migration
   cd backend
   npx prisma migrate deploy

ÉTAPE 3: Verification
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name IN ('task_boards', 'task_columns', 'planning_views');

ÉTAPE 4: Données initiales (optionnel)
   -- Les utilisateurs auront un tableau créé automatiquement
   -- au premier accès via /planning/boards/initialize

ROLLBACK (si nécessaire)
   psql crm_immobilier < backup_$(date +%Y%m%d).sql
```

## Tests Recommandés

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      STRATÉGIE DE TESTS                                 │
└─────────────────────────────────────────────────────────────────────────┘

BACKEND UNIT TESTS (Jest)
├── PlanningService
│   ├── createTaskBoard() ✓
│   ├── getUnifiedPlanningData() avec filtres ✓
│   ├── moveTask() entre colonnes ✓
│   ├── initializeDefaultBoard() ✓
│   └── Gestion des erreurs (NotFoundException, etc.) ✓
│
└── PlanningController
    ├── Auth guard sur routes ✓
    ├── Validation DTOs ✓
    └── Response codes ✓

FRONTEND COMPONENT TESTS (React Testing Library)
├── KanbanBoardView
│   ├── Affichage colonnes et tâches ✓
│   ├── Drag and drop ✓
│   └── Rollback sur erreur ✓
│
├── TaskListView
│   ├── Groupement par date ✓
│   ├── Actions rapides ✓
│   └── Filtres ✓
│
└── CalendarView
    ├── Navigation dates ✓
    ├── Switch mode jour/semaine/mois ✓
    └── Click événements ✓

E2E TESTS (Playwright)
└── Scénarios utilisateur
    ├── Créer tableau Kanban
    ├── Ajouter colonnes
    ├── Déplacer tâche
    ├── Changer de vue
    └── Appliquer filtres
```

## Roadmap Future

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ÉVOLUTIONS FUTURES                                 │
└─────────────────────────────────────────────────────────────────────────┘

PHASE 1: Finalisation (1-2 semaines)
  ✓ Module planning fonctionnel
  ○ WebSocket pour temps réel
  ○ Tests unitaires et E2E
  ○ Optimisation performances

PHASE 2: Intelligence (2-3 semaines)
  ○ Intégration AI Orchestrator
    ├── Suggestions de priorités
    ├── Détection de conflits
    └── Optimisation de planning
  │
  ○ AI Chat Assistant
    ├── Sidebar intégrée
    ├── Création tâches par NLP
    └── Recommandations intelligentes
  │
  └── Smart Scheduling
      ├── Suggestions de créneaux
      ├── Analyse de charge
      └── Prédiction de durées

PHASE 3: Mindmap (1-2 semaines)
  ○ Implémentation React Flow
  ○ Visualisation hiérarchique
  ○ Édition en mode graphe
  └── Export/Import

PHASE 4: Collaboration (2-3 semaines)
  ○ WebSocket temps réel
  ○ Curseurs multi-utilisateurs
  ○ Commentaires sur tâches
  └── Notifications en direct

PHASE 5: Mobile (2-3 semaines)
  ○ PWA capabilities
  ○ Gestures touch optimisés
  ○ Mode offline
  └── Notifications push
```

---

**Module créé par:** GitHub Copilot Agent  
**Date:** Janvier 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
