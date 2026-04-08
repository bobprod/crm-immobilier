# Module de Planification Unifié

Ce module offre une vue unifiée pour gérer les tâches, rendez-vous et projets dans le CRM immobilier.

## Fonctionnalités

### 1. Vue Kanban
- Tableaux personnalisables avec colonnes
- Drag & drop des tâches entre colonnes
- Limite de tâches par colonne (optionnel)
- Couleurs personnalisées par colonne
- Position automatique des tâches

### 2. Vue Liste
- Groupement automatique par date (en retard, aujourd'hui, à venir, sans date)
- Filtrage par statut et priorité
- Recherche en temps réel
- Actions rapides (terminer, supprimer)
- Badges de statut et priorité

### 3. Vue Calendrier
- Trois modes d'affichage : Jour, Semaine, Mois
- Affichage des rendez-vous et tâches
- Navigation temporelle intuitive
- Détection du jour actuel
- Indicateurs visuels pour les événements

### 4. Vue Mindmap (À venir)
- Visualisation en carte mentale
- Hiérarchie des tâches et projets
- Relations entre éléments

## Architecture Backend

### Modèles de Données

#### TaskBoard
```typescript
{
  id: string
  userId: string
  name: string
  description?: string
  color?: string
  isDefault: boolean
  layout?: object
  settings?: object
  columns: TaskColumn[]
  tasks: Task[]
}
```

#### TaskColumn
```typescript
{
  id: string
  boardId: string
  name: string
  color?: string
  position: number
  limit?: number
  settings?: object
  tasks: Task[]
}
```

#### PlanningView
```typescript
{
  id: string
  userId: string
  viewType: 'calendar' | 'kanban' | 'list' | 'mindmap'
  preferences?: object
  defaultView: boolean
  filterOptions?: object
  layoutConfig?: object
}
```

#### Task (enrichi)
Nouvelles propriétés :
- `boardId`: ID du tableau Kanban
- `columnId`: ID de la colonne
- `position`: Position dans la colonne
- `viewType`: Type de vue préféré
- `metadata`: Données supplémentaires

### API Endpoints

#### Tableaux Kanban
- `POST /planning/boards` - Créer un tableau
- `GET /planning/boards` - Liste des tableaux
- `GET /planning/boards/initialize` - Initialiser tableau par défaut
- `GET /planning/boards/:id` - Détails d'un tableau
- `PUT /planning/boards/:id` - Modifier un tableau
- `DELETE /planning/boards/:id` - Supprimer un tableau

#### Colonnes
- `POST /planning/columns` - Créer une colonne
- `PUT /planning/columns/:id` - Modifier une colonne
- `DELETE /planning/columns/:id` - Supprimer une colonne

#### Vues
- `POST /planning/views` - Créer une vue
- `GET /planning/views` - Liste des vues
- `GET /planning/views/:id` - Détails d'une vue
- `PUT /planning/views/:id` - Modifier une vue
- `DELETE /planning/views/:id` - Supprimer une vue

#### Opérations
- `POST /planning/tasks/move` - Déplacer une tâche
- `GET /planning/unified` - Données unifiées avec filtres

### Paramètres de Requête pour `/planning/unified`
```typescript
{
  viewType?: string
  startDate?: string
  endDate?: string
  boardId?: string
  status?: string
  priority?: string
  search?: string
}
```

## Architecture Frontend

### Composants

1. **UnifiedPlanningPage** - Page principale avec onglets
2. **KanbanBoardView** - Vue Kanban avec @dnd-kit
3. **TaskListView** - Vue liste avec groupement
4. **CalendarView** - Vue calendrier avec date-fns

### Services

**planning-api.ts** - Couche d'API pour :
- Gestion des tableaux Kanban
- Gestion des colonnes
- Gestion des vues
- Mouvement des tâches
- Récupération unifiée des données

### État et Synchronisation

- État local React pour les interactions UI
- Appels API pour la persistance
- Toast notifications pour le feedback
- Gestion d'erreur avec rollback

## Utilisation

### Initialisation

Au premier accès à la vue Kanban, un tableau par défaut est créé automatiquement avec 4 colonnes :
- À faire (rouge)
- En cours (orange)
- En révision (bleu)
- Terminé (vert)

### Déplacement de Tâches (Kanban)

1. Cliquer et maintenir sur une tâche
2. Déplacer vers une autre colonne
3. Relâcher pour confirmer
4. La position est automatiquement sauvegardée

### Filtrage

Utilisez les filtres en haut de page :
- Recherche textuelle (titre/description)
- Statut (tout, à faire, en cours, terminé)
- Priorité (toutes, basse, moyenne, haute)

### Navigation Calendrier

- Flèches gauche/droite pour naviguer
- Bouton "Aujourd'hui" pour revenir à la date actuelle
- Onglets Jour/Semaine/Mois pour changer le mode

## Intégration avec l'IA (À venir)

Le module est préparé pour l'intégration future avec :
- AI Orchestrator : Suggestions de priorités
- AI Assistant : Aide à la planification
- LLM Provider : Création de tâches en langage naturel
- Smart Scheduling : Suggestions de créneaux

## Migration Base de Données

La migration `20260125161419_add_unified_planning_models` ajoute :
- 3 nouvelles tables (task_boards, task_columns, planning_views)
- 5 nouveaux champs à la table tasks
- 11 nouveaux index pour les performances
- 5 clés étrangères pour l'intégrité

## Prochaines Étapes

1. **WebSocket** - Synchronisation temps réel
2. **Mindmap** - Implémentation avec React Flow
3. **AI Integration** - Connexion aux modules IA
4. **Tests** - Tests unitaires et E2E
5. **Documentation API** - Swagger/OpenAPI
6. **Optimisations** - Pagination, cache, lazy loading

## Tests

```bash
# Backend
cd backend
npm test -- planning

# Frontend
cd frontend
npm run test:e2e -- planning
```

## Performance

- Indexation optimisée pour les requêtes fréquentes
- Chargement paresseux des relations
- Cache côté client avec SWR (à implémenter)
- Debounce sur la recherche

## Sécurité

- Toutes les routes protégées par JWT
- Vérification de propriété (userId) sur toutes les opérations
- Validation des DTOs avec class-validator
- Nettoyage automatique des relations (onDelete CASCADE/SET NULL)
