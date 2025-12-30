# 🔧 Configuration Backend - Module Tasks

**Date**: 2025-12-28
**Branch**: `claude/tasks-backend-registry-TjZZy`
**Objectif**: Enregistrer le module Tasks dans le Module Registry pour le rendre visible dans le menu dynamique

---

## 📋 Résumé

Le module Tasks backend existe déjà et est fonctionnel, mais n'était **pas enregistré** dans le Module Registry. Cette configuration permet de:

1. ✅ Enregistrer Tasks comme module business
2. ✅ L'afficher dans le menu de navigation dynamique
3. ✅ Gérer les permissions et le RBAC
4. ✅ Activer/désactiver par agence

---

## 📦 Fichiers Créés

### 1. `backend/src/modules/business/tasks/tasks.manifest.json`

Manifest complet du module Tasks au format Module Registry:

```json
{
  "code": "business-tasks",
  "name": "Gestion des Tâches",
  "version": "1.0.0",
  "category": "BUSINESS",

  "menus": [{
    "label": "Tâches",
    "icon": "CheckSquare",
    "path": "/tasks",
    "requiredRole": "USER",
    "order": 15
  }],

  "permissions": [
    "tasks.read",
    "tasks.write",
    "tasks.delete",
    "tasks.complete"
  ],

  "schemas": [...],
  "defaultConfig": {...}
}
```

**Caractéristiques**:
- 📍 Position dans le menu: ordre 15 (après Dashboard, avant autres modules)
- 👥 Accessible dès le rôle USER (tous les utilisateurs)
- 🆓 Gratuit (basePrice: 0, pas de crédits IA)
- ⚙️ Configuration par défaut (notifications, archivage)

### 2. `backend/src/modules/business/tasks/register-tasks-module.ts`

Script d'enregistrement automatique du module dans la base de données:

**Fonctionnalités**:
- ✅ Lecture automatique du manifest
- ✅ Vérification si module déjà enregistré
- ✅ Création ou mise à jour du module
- ✅ Affichage détaillé du résultat
- ✅ Gestion d'erreurs complète

**Utilisation**: 3 méthodes disponibles (voir section suivante)

---

## 🚀 Comment Enregistrer le Module

### Méthode 1: Via API (Recommandé - Production)

**Prérequis**: Token SUPER_ADMIN

```bash
# 1. Se connecter en tant que SUPER_ADMIN
POST http://localhost:3000/auth/login
{
  "email": "admin@crm.com",
  "password": "Admin123!"
}

# 2. Enregistrer le module
POST http://localhost:3000/core/modules/register
Content-Type: application/json
Authorization: Bearer <super_admin_token>

Body: <contenu de tasks.manifest.json>
```

**Avantages**:
- ✅ Méthode officielle et sécurisée
- ✅ Validation automatique
- ✅ Logs d'audit
- ✅ Idempotent (peut être appelé plusieurs fois)

### Méthode 2: Via Script Direct (Développement)

```bash
# Depuis le répertoire backend
cd backend

# Installer les dépendances si nécessaire
npm install

# Exécuter le script
npx ts-node src/modules/business/tasks/register-tasks-module.ts
```

**Avantages**:
- ✅ Rapide pour développement
- ✅ Pas besoin de token
- ✅ Affichage détaillé dans la console

### Méthode 3: Via Prisma Studio (Manuel)

```bash
# Lancer Prisma Studio
cd backend
npx prisma studio

# Dans l'interface:
1. Aller dans la table "BusinessModule"
2. Cliquer "Add record"
3. Remplir les champs:
   - code: "business-tasks"
   - name: "Gestion des Tâches"
   - version: "1.0.0"
   - status: "ACTIVE"
   - category: "BUSINESS"
   - manifest: <coller le contenu du manifest JSON>
   - basePrice: 0
   - creditsIncluded: 0
4. Sauvegarder
```

---

## 🏢 Activer le Module pour une Agence

Une fois le module enregistré, il faut l'activer pour chaque agence:

### Via API

```bash
POST http://localhost:3000/core/modules/activate/{agencyId}/business-tasks
Content-Type: application/json
Authorization: Bearer <super_admin_token>

Body: {
  "config": {
    "enableNotifications": true,
    "notifyBeforeDueDate": 24,
    "defaultPriority": "medium"
  }
}
```

### Via Script

Créer un script similaire à `register-tasks-module.ts`:

```typescript
await prisma.moduleAgencySubscription.create({
  data: {
    agencyId: '<agency_id>',
    moduleId: '<module_id>', // ID du BusinessModule
    isActive: true,
    config: {
      enableNotifications: true,
      notifyBeforeDueDate: 24
    },
    activatedAt: new Date(),
  },
});
```

---

## 🔄 Migration du Menu Frontend

Une fois le module enregistré et activé:

### Étape 1: Vérifier que le module apparaît dans l'API

```bash
GET http://localhost:3000/core/modules/my-menu
Authorization: Bearer <user_token>
```

**Résultat attendu**:
```json
{
  "items": [
    { "label": "Tableau de bord", "path": "/dashboard", ... },
    { "label": "Tâches", "path": "/tasks", "icon": "CheckSquare", "order": 15 }, // ← NOUVEAU
    { "label": "Paramètres", "path": "/settings", ... }
  ]
}
```

### Étape 2: Retirer du menu par défaut (frontend)

Éditer `frontend/src/shared/hooks/useMenu.ts`:

```typescript
function getDefaultMenu(): DynamicMenuItem[] {
  return [
    {
      id: 'default-dashboard',
      moduleId: 'core',
      label: 'Tableau de bord',
      icon: 'Home',
      path: '/dashboard',
      order: 0,
    },
    // ❌ SUPPRIMER CET ITEM (maintenant géré par le backend)
    // {
    //   id: 'default-tasks',
    //   moduleId: 'business-tasks',
    //   label: 'Tâches',
    //   icon: 'CheckSquare',
    //   path: '/tasks',
    //   order: 10,
    // },
    {
      id: 'default-settings',
      moduleId: 'core',
      label: 'Paramètres',
      icon: 'Settings',
      path: '/settings',
      order: 999,
    },
  ];
}
```

---

## 🧪 Vérification Post-Installation

### 1. Vérifier l'enregistrement

```sql
-- Dans la base de données
SELECT id, code, name, status, version
FROM "BusinessModule"
WHERE code = 'business-tasks';
```

**Résultat attendu**:
```
id  | code            | name                  | status | version
----|-----------------|------------------------|--------|--------
xxx | business-tasks  | Gestion des Tâches    | ACTIVE | 1.0.0
```

### 2. Vérifier l'activation pour agence

```sql
SELECT a.id, a.agencyId, a.isActive, bm.code, bm.name
FROM "ModuleAgencySubscription" a
JOIN "BusinessModule" bm ON bm.id = a.moduleId
WHERE bm.code = 'business-tasks';
```

### 3. Tester le menu API

```bash
# Se connecter
POST http://localhost:3000/auth/login
{
  "email": "agent@agence.com",
  "password": "password"
}

# Récupérer le menu
GET http://localhost:3000/core/modules/my-menu
Authorization: Bearer <token>
```

### 4. Tester le frontend

1. Lancer l'app: `cd frontend && npm run dev`
2. Se connecter
3. Vérifier que "Tâches" apparaît dans le menu
4. Cliquer sur "Tâches" → doit afficher le module avec toutes les fonctionnalités Phase 3

---

## 📊 Comparaison Avant/Après

### AVANT (Menu par défaut)

```
Menu Frontend (hardcodé)
  ├── Dashboard ✅
  ├── Tâches ⚠️ (hardcodé dans useMenu.ts)
  └── Paramètres ✅

Backend Module Registry
  └── [VIDE pour Tasks] ❌
```

**Problèmes**:
- ❌ Pas de contrôle RBAC
- ❌ Pas de configuration par agence
- ❌ Pas d'activation/désactivation
- ❌ Code frontend couplé

### APRÈS (Menu dynamique)

```
Menu Frontend (dynamique)
  ├── Dashboard ✅ (backend)
  ├── Tâches ✅ (backend - Module Registry)
  └── Paramètres ✅ (backend)

Backend Module Registry
  └── business-tasks ✅
      ├── Manifest complet
      ├── Permissions
      ├── Config par agence
      └── Status ACTIVE
```

**Avantages**:
- ✅ RBAC complet (requiredRole: USER)
- ✅ Activation par agence
- ✅ Configuration personnalisable
- ✅ Architecture découplée
- ✅ Gestion centralisée

---

## 🔐 Permissions

Le module définit 5 permissions:

```json
"permissions": [
  "tasks.read",       // Lire les tâches
  "tasks.write",      // Créer/modifier
  "tasks.delete",     // Supprimer
  "tasks.complete",   // Marquer terminée
  "tasks.stats"       // Voir statistiques
]
```

**Par défaut**: Toutes accordées au rôle USER et supérieurs.

---

## ⚙️ Configuration par Agence

Chaque agence peut personnaliser:

```json
"defaultConfig": {
  "enableNotifications": true,        // Activer notifications
  "notifyBeforeDueDate": 24,          // Notifier 24h avant échéance
  "defaultPriority": "medium",        // Priorité par défaut
  "autoArchiveCompletedTasks": false, // Archivage auto
  "archiveAfterDays": 30              // Délai archivage (jours)
}
```

Modifiable via:
```bash
PUT /core/modules/agency-config/business-tasks
{
  "config": {
    "enableNotifications": false,
    "notifyBeforeDueDate": 48
  }
}
```

---

## 🐛 Troubleshooting

### Problème: Module n'apparaît pas dans le menu

**Vérifications**:
1. ✅ Module enregistré dans BusinessModule?
2. ✅ Module activé pour l'agence (ModuleAgencySubscription)?
3. ✅ isActive = true?
4. ✅ Status = 'ACTIVE'?
5. ✅ Rôle utilisateur >= requiredRole (USER)?

### Problème: Erreur "Module already registered"

**Solution**: Normal, le script update automatiquement. Vérifier la version mise à jour.

### Problème: Menu encore hardcodé

**Solution**: Retirer l'entrée `default-tasks` de `useMenu.ts` après activation backend.

---

## 📝 Checklist de Mise en Production

- [ ] Module enregistré dans BusinessModule
- [ ] Module activé pour toutes les agences nécessaires
- [ ] Tests API: GET /core/modules/my-menu retourne Tasks
- [ ] Frontend: Menu "Tâches" visible après login
- [ ] Frontend: Cliquer sur Tâches → affiche le module
- [ ] Tests Phase 3: Recherche, pagination, bulk actions fonctionnent
- [ ] Menu par défaut: Entrée hardcodée retirée de useMenu.ts
- [ ] Documentation: TASKS-MODULE-VISIBILITY-ANALYSIS.md à jour
- [ ] Backend: Endpoints /tasks/* accessibles et fonctionnels
- [ ] Permissions: RBAC vérifié pour chaque rôle

---

## 📚 Fichiers Associés

**Backend**:
- `backend/src/modules/business/tasks/tasks.manifest.json` ← Manifest
- `backend/src/modules/business/tasks/register-tasks-module.ts` ← Script
- `backend/src/modules/business/tasks/tasks.controller.ts` ← API
- `backend/src/modules/business/tasks/tasks.service.ts` ← Logique
- `backend/src/modules/core/module-registry/` ← Registry système

**Frontend**:
- `frontend/src/shared/hooks/useMenu.ts` ← Hook menu dynamique
- `frontend/pages/tasks/index.tsx` ← Page Tasks
- `frontend/src/modules/business/tasks/components/TaskList.tsx` ← Composants

**Documentation**:
- `TASKS-MODULE-VISIBILITY-ANALYSIS.md` ← Analyse problème visibilité
- `TASKS-MODULE-BACKEND-SETUP.md` ← Ce fichier
- `TASKS-VALIDATION-REPORT.md` ← Rapport validation Phase 3

---

## 🎯 Résultat Final

Après cette configuration:

```
Utilisateur se connecte
    ↓
GET /core/modules/my-menu
    ↓
Backend retourne:
  - Dashboard (core)
  - Tâches (business-tasks) ← NOUVEAU via Module Registry
  - Properties (real-estate)
  - Prospects (real-estate)
  - ...
  - Paramètres (core)
    ↓
Frontend DynamicMenu affiche tous les items
    ↓
Utilisateur clique sur "Tâches"
    ↓
/tasks s'ouvre avec toutes les fonctionnalités Phase 3 ✅
```

**Architecture 100% découplée et scalable** ✅

---

**Créé par**: Claude AI
**Date**: 2025-12-28
**Version**: 1.0.0
