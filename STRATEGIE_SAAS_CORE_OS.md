# 🏗️ STRATÉGIE DE MIGRATION VERS SAAS CORE OS

**Date**: 2025-12-27
**Objectif**: Transformer le CRM Immobilier en Core OS modulaire sans tout casser
**Approche**: Migration progressive, zéro refactoring profond

---

## 📊 ANALYSE DE L'EXISTANT

### ✅ CE QUI EST DÉJÀ EN PLACE (80% du Core OS!)

#### 1. **Multi-Tenancy** ✅ EXCELLENT
```prisma
// Déjà implémenté dans schema.prisma
model agencies {
  id       String   @id @default(cuid())
  name     String
  users    users[]
  apiKeys  AgencyApiKeys?
  aiCredits AiCredits?
}

model users {
  id       String   @id
  email    String   @unique
  role     String   @default("agent")  // "agent", "admin", "superadmin"
  agencyId String?
  agency   agencies? @relation(fields: [agencyId])
}
```
**État**: ✅ **Fonctionnel à 95%**
**Action requise**: Formaliser les rôles en enum

---

#### 2. **AI Billing & Credits** ✅ EXCELLENT
```typescript
// Déjà implémenté dans ai-billing module
- AiCredits (pool agence)
- UserAiCredits (utilisateurs indépendants)
- AiUsage (historique consommation)
- AiPricing (coûts par action)
- AiErrorLog (monitoring)
```
**État**: ✅ **100% fonctionnel**
**Action requise**: Aucune

---

#### 3. **BYOK (Bring Your Own Key)** ✅ EXCELLENT
```typescript
// Fallback 3-niveaux déjà implémenté
USER → AGENCY → SUPER_ADMIN

- ai_settings (user level)
- AgencyApiKeys (agency level)
- GlobalSettings (super admin fallback)
```
**État**: ✅ **100% fonctionnel**
**Action requise**: Corriger schéma ai_settings (7 champs scraping manquants)

---

#### 4. **Architecture Modulaire** ✅ BON
```
backend/src/modules/
  ├── core/              (Auth, Users, Settings)
  ├── business/          (Properties, Prospects, etc.)
  ├── intelligence/      (AI Metrics, Matching, etc.)
  ├── ai-billing/        (Crédits, API Keys)
  ├── prospecting/
  ├── scraping/
  ├── communications/
  ├── integrations/
  └── ...
```
**État**: ✅ **Structure modulaire NestJS**
**Problème**: Pas de séparation formelle Core vs Business

---

#### 5. **Stack Technique** ✅ BON
| Composant | Actuel | Cible | Écart |
|-----------|--------|-------|-------|
| Backend | NestJS + TypeScript | ✅ Node.js/TS | OK |
| Frontend | Next.js (Pages) + React | ✅ Next.js (App) | Migration Pages → App Router |
| DB | PostgreSQL + Prisma | ✅ PostgreSQL + Prisma | OK |
| UI | Tailwind + shadcn/ui | ✅ Tailwind | OK |
| IA Backend | ❌ Inexistant | FastAPI (Python) | **À CRÉER** |
| Automation | ❌ Inexistant | n8n | **À INTÉGRER** |
| RAG | ❌ Inexistant | pgvector | **À AJOUTER** |

---

### ❌ CE QUI MANQUE POUR CORE OS

#### 1. **Module Registry** ❌ CRITIQUE
**Problème**: Pas de système de "plug & play" pour modules métier
**Impact**: Impossible d'ajouter un module Voyage/Casting sans modifier le code core

#### 2. **Manifest JSON** ❌ CRITIQUE
**Problème**: Modules ne déclarent pas leurs besoins (menus, permissions, coûts IA)
**Impact**: Couplage fort entre Core et Business

#### 3. **A2UI (Agent-driven UI)** ❌ IMPORTANT
**Problème**: Frontend hardcodé pour l'immobilier
**Impact**: Chaque nouveau métier nécessite refonte frontend

#### 4. **FastAPI Layer** ❌ IMPORTANT
**Problème**: Pas de backend Python pour IA avancée (RAG, Agents, SLM)
**Impact**: Limité à des appels API externes, pas d'orchestration locale

#### 5. **pgvector + RAG** ❌ MOYEN
**Problème**: Pas de recherche sémantique sur documents privés
**Impact**: IA ne peut pas exploiter contrats, feedbacks, fiches métier

---

## 🎯 STRATÉGIE DE MIGRATION PROGRESSIVE (7 PHASES)

### PRINCIPE CLÉ: **ÉVOLUTION, PAS RÉVOLUTION**

> ⚠️ **Règle d'or**: Chaque phase doit être **déployable en production** sans casser l'existant

---

## PHASE 0: PRÉPARATION (1 semaine)

### Objectif: Sécuriser l'existant avant modification

### Actions:
1. **Corriger le bug critique ai_settings**
   ```prisma
   model ai_settings {
     // Ajouter les 7 champs scraping manquants
     serpApiKey          String?
     firecrawlApiKey     String?
     picaApiKey          String?
     jinaReaderApiKey    String?
     scrapingBeeApiKey   String?
     browserlessApiKey   String?
     rapidApiKey         String?
   }
   ```
   **Migration**: `prisma migrate dev --name add_scraping_keys_to_ai_settings`

2. **Formaliser les rôles en enum**
   ```prisma
   enum UserRole {
     USER           // Utilisateur simple (ex: freelance casting, voyageur)
     AGENT          // Agent immobilier, recruteur, agent voyage
     ADMIN          // Admin agence
     SUPER_ADMIN    // Admin plateforme
   }

   model users {
     role UserRole @default(AGENT)
   }
   ```
   **Migration**: `prisma migrate dev --name formalize_user_roles`

3. **Tests de régression**
   - Vérifier que AI Billing fonctionne toujours
   - Vérifier que BYOK fonctionne toujours
   - Vérifier que multi-tenancy fonctionne toujours

**Critère de succès**: ✅ Production stable avec corrections appliquées

---

## PHASE 1: CORE OS FOUNDATION (2-3 semaines)

### Objectif: Créer le Module Registry sans toucher l'existant

### 1.1 Créer le schéma Prisma pour Module Registry

```prisma
// ════════════════════════════════════════════════════════════
// MODULE REGISTRY - SAAS CORE OS
// ════════════════════════════════════════════════════════════

enum ModuleStatus {
  ACTIVE
  INACTIVE
  DEPRECATED
}

enum ModuleCategory {
  BUSINESS      // Modules métier (Immo, Voyage, Casting)
  INTELLIGENCE  // Modules IA (Matching, Scoring, RAG)
  INTEGRATION   // Intégrations externes (WordPress, Stripe)
  COMMUNICATION // Email, SMS, Notifs
  MARKETING     // SEO, Ads, Analytics
}

// ─────────────────────────────────────────────────────────────
// 1. BUSINESS MODULES (ex: Immobilier, Voyage, Casting)
// ─────────────────────────────────────────────────────────────
model BusinessModule {
  id              String         @id @default(cuid())
  code            String         @unique  // "real-estate", "travel", "casting"
  name            String                  // "Immobilier", "Voyage", "Casting"
  description     String?
  version         String         @default("1.0.0")
  status          ModuleStatus   @default(ACTIVE)
  category        ModuleCategory @default(BUSINESS)

  // Manifest JSON (déclaration des besoins)
  manifest        Json           // { menus, permissions, schemas, aiActions }

  // Pricing (coût d'activation du module)
  basePrice       Float?         // Prix de base mensuel
  creditsIncluded Int?           // Crédits IA inclus

  // Relations
  enabledAgencies ModuleAgencySubscription[]

  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@map("business_modules")
}

// ─────────────────────────────────────────────────────────────
// 2. SOUSCRIPTIONS AGENCES (qui a activé quoi)
// ─────────────────────────────────────────────────────────────
model ModuleAgencySubscription {
  id             String         @id @default(cuid())

  agencyId       String
  agency         agencies       @relation(fields: [agencyId], references: [id], onDelete: Cascade)

  moduleId       String
  module         BusinessModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  // Activation
  isActive       Boolean        @default(true)
  activatedAt    DateTime       @default(now())
  expiresAt      DateTime?

  // Configuration spécifique agence
  config         Json?          // Configuration custom du module

  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@unique([agencyId, moduleId])
  @@map("module_agency_subscriptions")
}

// ─────────────────────────────────────────────────────────────
// 3. MENU ITEMS DYNAMIQUES (générés depuis le manifest)
// ─────────────────────────────────────────────────────────────
model DynamicMenuItem {
  id           String         @id @default(cuid())

  moduleId     String
  module       BusinessModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  // Menu structure
  label        String         // "Biens", "Prospects", "Voyages"
  icon         String?        // "Home", "Users", "Plane"
  path         String         // "/properties", "/prospects", "/trips"
  parentId     String?        // Pour sous-menus
  order        Int            @default(0)

  // Permissions
  requiredRole UserRole?      // Minimum role required

  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  @@map("dynamic_menu_items")
}

// ─────────────────────────────────────────────────────────────
// 4. AI ACTIONS PAR MODULE (actions IA disponibles)
// ─────────────────────────────────────────────────────────────
model ModuleAiAction {
  id              String         @id @default(cuid())

  moduleId        String
  module          BusinessModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  actionCode      String         @unique // "real_estate_matching", "travel_scoring"
  actionName      String                 // "Matching Bien-Prospect", "Scoring Voyage"
  description     String?

  // Lien avec le pricing
  pricingId       String?
  pricing         AiPricing?     @relation(fields: [pricingId], references: [id])

  // Prompts & Config
  systemPrompt    String?        @db.Text
  userPromptTpl   String?        @db.Text
  provider        String?        // "anthropic", "openai", "deepseek"
  model           String?        // "claude-3-5-sonnet", "gpt-4o"

  enabled         Boolean        @default(true)

  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@map("module_ai_actions")
}

// ─────────────────────────────────────────────────────────────
// 5. SCHEMAS MÉTIER DYNAMIQUES (optionnel, avancé)
// ─────────────────────────────────────────────────────────────
model DynamicSchema {
  id          String         @id @default(cuid())

  moduleId    String
  module      BusinessModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  tableName   String         // "properties", "trips", "missions"
  schema      Json           // JSON Schema du modèle métier

  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@unique([moduleId, tableName])
  @@map("dynamic_schemas")
}
```

**Ajouts aux modèles existants**:
```prisma
model agencies {
  // ... champs existants
  moduleSubscriptions ModuleAgencySubscription[]
}

model AiPricing {
  // ... champs existants
  moduleAiActions ModuleAiAction[]
}
```

---

### 1.2 Créer le Module Registry Service

**Fichier**: `backend/src/modules/core/module-registry/module-registry.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';

export interface ModuleManifest {
  code: string;
  name: string;
  version: string;
  category: 'BUSINESS' | 'INTELLIGENCE' | 'INTEGRATION';

  // Menus à générer
  menus: Array<{
    label: string;
    icon: string;
    path: string;
    requiredRole?: 'USER' | 'AGENT' | 'ADMIN' | 'SUPER_ADMIN';
    children?: Array<{ label: string; path: string; }>;
  }>;

  // Permissions requises
  permissions: string[];

  // Actions IA disponibles
  aiActions: Array<{
    code: string;
    name: string;
    creditsCost: number;
    provider?: string;
    model?: string;
  }>;

  // Schémas de données (optionnel)
  schemas?: Array<{
    tableName: string;
    fields: Array<{ name: string; type: string; }>;
  }>;

  // Configuration par défaut
  defaultConfig?: Record<string, any>;
}

@Injectable()
export class ModuleRegistryService {
  constructor(private prisma: PrismaService) {}

  /**
   * ═══════════════════════════════════════════════════════════
   * ENREGISTREMENT D'UN MODULE MÉTIER
   * ═══════════════════════════════════════════════════════════
   */
  async registerModule(manifest: ModuleManifest) {
    // 1. Créer ou mettre à jour le module
    const module = await this.prisma.businessModule.upsert({
      where: { code: manifest.code },
      create: {
        code: manifest.code,
        name: manifest.name,
        version: manifest.version,
        category: manifest.category,
        status: 'ACTIVE',
        manifest: manifest as any,
      },
      update: {
        name: manifest.name,
        version: manifest.version,
        manifest: manifest as any,
      },
    });

    // 2. Créer les items de menu
    for (const menu of manifest.menus) {
      await this.prisma.dynamicMenuItem.upsert({
        where: {
          moduleId_path: { moduleId: module.id, path: menu.path },
        },
        create: {
          moduleId: module.id,
          label: menu.label,
          icon: menu.icon,
          path: menu.path,
          requiredRole: menu.requiredRole,
        },
        update: {
          label: menu.label,
          icon: menu.icon,
        },
      });
    }

    // 3. Créer les actions IA
    for (const action of manifest.aiActions) {
      // 3a. Créer le pricing si inexistant
      const pricing = await this.prisma.aiPricing.upsert({
        where: { actionCode: action.code },
        create: {
          actionCode: action.code,
          actionName: action.name,
          creditsCost: action.creditsCost,
          enabled: true,
        },
        update: {
          actionName: action.name,
          creditsCost: action.creditsCost,
        },
      });

      // 3b. Créer l'action IA du module
      await this.prisma.moduleAiAction.upsert({
        where: { actionCode: action.code },
        create: {
          moduleId: module.id,
          actionCode: action.code,
          actionName: action.name,
          pricingId: pricing.id,
          provider: action.provider,
          model: action.model,
          enabled: true,
        },
        update: {
          actionName: action.name,
          provider: action.provider,
          model: action.model,
        },
      });
    }

    return module;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * ACTIVATION D'UN MODULE POUR UNE AGENCE
   * ═══════════════════════════════════════════════════════════
   */
  async activateModuleForAgency(agencyId: string, moduleCode: string) {
    const module = await this.prisma.businessModule.findUnique({
      where: { code: moduleCode },
    });

    if (!module) {
      throw new Error(`Module ${moduleCode} not found`);
    }

    return await this.prisma.moduleAgencySubscription.upsert({
      where: {
        agencyId_moduleId: { agencyId, moduleId: module.id },
      },
      create: {
        agencyId,
        moduleId: module.id,
        isActive: true,
      },
      update: {
        isActive: true,
      },
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * RÉCUPÉRATION DES MODULES ACTIFS POUR UNE AGENCE
   * ═══════════════════════════════════════════════════════════
   */
  async getActiveModulesForAgency(agencyId: string) {
    const subscriptions = await this.prisma.moduleAgencySubscription.findMany({
      where: {
        agencyId,
        isActive: true,
      },
      include: {
        module: {
          include: {
            dynamicMenuItems: true,
            moduleAiActions: {
              include: { pricing: true },
            },
          },
        },
      },
    });

    return subscriptions.map(sub => sub.module);
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * GÉNÉRATION DU MENU DYNAMIQUE POUR UNE AGENCE
   * ═══════════════════════════════════════════════════════════
   */
  async getMenuForAgency(agencyId: string, userRole: string) {
    const modules = await this.getActiveModulesForAgency(agencyId);

    const menus = [];
    for (const module of modules) {
      for (const item of module.dynamicMenuItems) {
        // Vérifier les permissions
        if (!item.requiredRole || this.hasRole(userRole, item.requiredRole)) {
          menus.push({
            label: item.label,
            icon: item.icon,
            path: item.path,
            module: module.name,
          });
        }
      }
    }

    return menus;
  }

  private hasRole(userRole: string, requiredRole: string): boolean {
    const hierarchy = ['USER', 'AGENT', 'ADMIN', 'SUPER_ADMIN'];
    const userLevel = hierarchy.indexOf(userRole);
    const requiredLevel = hierarchy.indexOf(requiredRole);
    return userLevel >= requiredLevel;
  }
}
```

---

### 1.3 Créer le Controller Module Registry

**Fichier**: `backend/src/modules/core/module-registry/module-registry.controller.ts`

```typescript
import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../../shared/guards/super-admin.guard';
import { ModuleRegistryService, ModuleManifest } from './module-registry.service';

@ApiTags('Core - Module Registry')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('core/modules')
export class ModuleRegistryController {
  constructor(private moduleRegistry: ModuleRegistryService) {}

  /**
   * SUPER ADMIN: Enregistrer un nouveau module métier
   */
  @Post('register')
  @UseGuards(SuperAdminGuard)
  async registerModule(@Body() manifest: ModuleManifest) {
    return await this.moduleRegistry.registerModule(manifest);
  }

  /**
   * SUPER ADMIN: Activer un module pour une agence
   */
  @Post('activate/:agencyId/:moduleCode')
  @UseGuards(SuperAdminGuard)
  async activateModule(
    @Param('agencyId') agencyId: string,
    @Param('moduleCode') moduleCode: string,
  ) {
    return await this.moduleRegistry.activateModuleForAgency(agencyId, moduleCode);
  }

  /**
   * USER: Récupérer mes modules actifs
   */
  @Get('my-modules')
  async getMyModules(@Request() req) {
    const user = await this.prisma.users.findUnique({
      where: { id: req.user.userId },
      select: { agencyId: true },
    });

    if (!user?.agencyId) {
      return [];
    }

    return await this.moduleRegistry.getActiveModulesForAgency(user.agencyId);
  }

  /**
   * USER: Récupérer mon menu dynamique
   */
  @Get('my-menu')
  async getMyMenu(@Request() req) {
    const user = await this.prisma.users.findUnique({
      where: { id: req.user.userId },
      select: { agencyId: true, role: true },
    });

    if (!user?.agencyId) {
      return [];
    }

    return await this.moduleRegistry.getMenuForAgency(user.agencyId, user.role);
  }
}
```

---

### 1.4 Enregistrer le Module Immobilier Existant

**Fichier**: `backend/src/modules/business/real-estate/real-estate.manifest.json`

```json
{
  "code": "real-estate",
  "name": "Immobilier",
  "version": "1.0.0",
  "category": "BUSINESS",

  "menus": [
    {
      "label": "Biens",
      "icon": "Home",
      "path": "/properties",
      "requiredRole": "AGENT"
    },
    {
      "label": "Prospects",
      "icon": "Users",
      "path": "/prospects",
      "requiredRole": "AGENT"
    },
    {
      "label": "Rendez-vous",
      "icon": "Calendar",
      "path": "/appointments",
      "requiredRole": "AGENT"
    },
    {
      "label": "Prospecting",
      "icon": "Search",
      "path": "/prospecting",
      "requiredRole": "AGENT",
      "children": [
        { "label": "Campagnes", "path": "/prospecting/campaigns" },
        { "label": "Leads", "path": "/prospecting/leads" }
      ]
    },
    {
      "label": "Matching IA",
      "icon": "Sparkles",
      "path": "/matching",
      "requiredRole": "AGENT"
    }
  ],

  "permissions": [
    "real_estate.properties.read",
    "real_estate.properties.write",
    "real_estate.prospects.read",
    "real_estate.prospects.write",
    "real_estate.matching.use"
  ],

  "aiActions": [
    {
      "code": "real_estate_matching",
      "name": "Matching Bien-Prospect",
      "creditsCost": 20,
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022"
    },
    {
      "code": "real_estate_property_description",
      "name": "Génération Description Bien",
      "creditsCost": 10,
      "provider": "openai",
      "model": "gpt-4o"
    },
    {
      "code": "real_estate_prospect_scoring",
      "name": "Scoring Prospect",
      "creditsCost": 15,
      "provider": "deepseek",
      "model": "deepseek-chat"
    }
  ],

  "defaultConfig": {
    "matchingThreshold": 0.75,
    "autoProspectingEnabled": true
  }
}
```

**Script de seed**:
```typescript
// backend/prisma/seed-modules.ts
import { PrismaClient } from '@prisma/client';
import realEstateManifest from '../src/modules/business/real-estate/real-estate.manifest.json';

const prisma = new PrismaClient();

async function seedModules() {
  // Enregistrer le module Immobilier
  const moduleRegistryService = new ModuleRegistryService(prisma);
  await moduleRegistryService.registerModule(realEstateManifest);

  console.log('✅ Module Immobilier enregistré');

  // Activer pour toutes les agences existantes
  const agencies = await prisma.agencies.findMany();
  for (const agency of agencies) {
    await moduleRegistryService.activateModuleForAgency(agency.id, 'real-estate');
    console.log(`✅ Module activé pour agence ${agency.name}`);
  }
}

seedModules();
```

---

### 1.5 Ajouter au AppModule

**Fichier**: `backend/src/app.module.ts`

```typescript
// CORE MODULES
import { ModuleRegistryModule } from './modules/core/module-registry/module-registry.module';

@Module({
  imports: [
    // ... existing imports
    ModuleRegistryModule,  // ✅ NOUVEAU
  ],
})
export class AppModule {}
```

---

### 1.6 Tests Phase 1

1. **Exécuter migration**:
   ```bash
   cd backend
   npx prisma migrate dev --name add_module_registry
   npm run seed-modules
   ```

2. **Tester API**:
   ```bash
   # Récupérer mes modules (doit retourner "real-estate")
   curl http://localhost:4000/core/modules/my-modules \
     -H "Authorization: Bearer $TOKEN"

   # Récupérer mon menu dynamique (doit retourner Biens, Prospects, etc.)
   curl http://localhost:4000/core/modules/my-menu \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Vérifier DB**:
   ```sql
   SELECT * FROM business_modules;
   SELECT * FROM dynamic_menu_items;
   SELECT * FROM module_ai_actions;
   ```

**Critère de succès Phase 1**:
- ✅ Module Registry fonctionnel en DB
- ✅ API retourne les modules actifs
- ✅ API retourne le menu dynamique
- ✅ Module Immobilier enregistré et activé
- ✅ **AUCUNE RÉGRESSION** sur l'existant (app immo continue de fonctionner normalement)

---

## PHASE 2: DYNAMIC FRONTEND (3-4 semaines)

### Objectif: Rendre le frontend capable de consommer le menu dynamique

### 2.1 Créer le Dynamic Menu Renderer

**Fichier**: `frontend/src/components/core/DynamicMenu.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Home, Users, Calendar, Search, Sparkles, Plane, Briefcase } from 'lucide-react';

// Mapping des icônes
const ICON_MAP = {
  Home,
  Users,
  Calendar,
  Search,
  Sparkles,
  Plane,     // Pour le module Voyage
  Briefcase, // Pour le module Casting
};

interface MenuItem {
  label: string;
  icon: string;
  path: string;
  module: string;
  children?: MenuItem[];
}

export function DynamicMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/core/modules/my-menu`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const menu = await response.json();
        setMenuItems(menu);
      }
    } catch (error) {
      console.error('Error loading dynamic menu:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 animate-pulse">Chargement du menu...</div>;
  }

  return (
    <nav className="space-y-1">
      {menuItems.map((item, index) => {
        const Icon = ICON_MAP[item.icon] || Home;
        const isActive = router.pathname.startsWith(item.path);

        return (
          <Link
            key={index}
            href={item.path}
            className={`
              flex items-center px-4 py-2 rounded-md transition-colors
              ${isActive
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
              }
            `}
          >
            <Icon className="w-5 h-5 mr-3" />
            <span>{item.label}</span>
            {item.module && (
              <span className="ml-auto text-xs text-muted-foreground">
                {item.module}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
```

---

### 2.2 Remplacer le Menu Statique

**Fichier**: `frontend/src/components/layout/Sidebar.tsx` (modifier)

```typescript
// AVANT (menu hardcodé)
const menuItems = [
  { label: 'Biens', icon: Home, path: '/properties' },
  { label: 'Prospects', icon: Users, path: '/prospects' },
  // ...
];

// APRÈS (menu dynamique)
import { DynamicMenu } from '../core/DynamicMenu';

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-card">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">CRM Multi-Métier</h1>
      </div>

      {/* Menu Dynamique */}
      <DynamicMenu />

      {/* Settings (toujours présent) */}
      <div className="mt-auto p-4 border-t">
        <Link href="/settings">
          <Settings className="w-5 h-5 mr-2" />
          Paramètres
        </Link>
      </div>
    </aside>
  );
}
```

---

### 2.3 Tests Phase 2

1. **Lancer frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Vérifier**:
   - ✅ Menu s'affiche dynamiquement depuis l'API
   - ✅ Items proviennent du module "Immobilier"
   - ✅ Cliquer sur un item navigue vers la bonne page
   - ✅ Pages existantes (/properties, /prospects, etc.) fonctionnent toujours

**Critère de succès Phase 2**:
- ✅ Menu dynamique fonctionnel
- ✅ **AUCUNE RÉGRESSION** (app immo fonctionne exactement pareil)
- ✅ Prêt pour ajouter de nouveaux modules sans toucher le code frontend

---

## PHASE 3: AJOUTER UN NOUVEAU MODULE (Proof of Concept)

### Objectif: Prouver que le système est plug & play en ajoutant un module Voyage

### 3.1 Créer le Manifest Voyage

**Fichier**: `backend/src/modules/business/travel/travel.manifest.json`

```json
{
  "code": "travel",
  "name": "Voyage",
  "version": "1.0.0",
  "category": "BUSINESS",

  "menus": [
    {
      "label": "Voyages",
      "icon": "Plane",
      "path": "/trips",
      "requiredRole": "AGENT"
    },
    {
      "label": "Clients Voyageurs",
      "icon": "Users",
      "path": "/travelers",
      "requiredRole": "AGENT"
    },
    {
      "label": "Destinations",
      "icon": "Map",
      "path": "/destinations",
      "requiredRole": "AGENT"
    }
  ],

  "permissions": [
    "travel.trips.read",
    "travel.trips.write",
    "travel.travelers.read"
  ],

  "aiActions": [
    {
      "code": "travel_itinerary_generation",
      "name": "Génération Itinéraire Voyage",
      "creditsCost": 25,
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022"
    },
    {
      "code": "travel_destination_matching",
      "name": "Matching Voyageur-Destination",
      "creditsCost": 20,
      "provider": "openai",
      "model": "gpt-4o"
    }
  ],

  "defaultConfig": {
    "defaultCurrency": "EUR",
    "bookingWindowDays": 90
  }
}
```

---

### 3.2 Enregistrer le Module Voyage

```bash
# Via API (Super Admin)
curl -X POST http://localhost:4000/core/modules/register \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @travel.manifest.json

# Activer pour une agence de test
curl -X POST http://localhost:4000/core/modules/activate/agency-test-123/travel \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN"
```

---

### 3.3 Créer les Pages Frontend Voyage

**Fichier**: `frontend/src/pages/trips/index.tsx`

```typescript
export default function TripsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Gestion des Voyages</h1>
      <p>Liste des voyages organisés</p>
      {/* Table avec liste des voyages */}
    </div>
  );
}
```

**Fichier**: `frontend/src/pages/travelers/index.tsx`

```typescript
export default function TravelersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Clients Voyageurs</h1>
      <p>Liste des clients voyageurs</p>
      {/* Table avec liste des clients */}
    </div>
  );
}
```

---

### 3.4 Tests Phase 3

1. **Créer une agence de test**:
   ```sql
   INSERT INTO agencies (id, name) VALUES ('agency-travel-1', 'Agence Voyage Test');
   ```

2. **Activer les modules**:
   ```bash
   # Module Immobilier pour agence immo
   curl -X POST .../activate/agency-immo-1/real-estate

   # Module Voyage pour agence voyage
   curl -X POST .../activate/agency-travel-1/travel
   ```

3. **Vérifier**:
   - ✅ User d'agence immo voit: Biens, Prospects, Matching
   - ✅ User d'agence voyage voit: Voyages, Clients Voyageurs, Destinations
   - ✅ **AUCUN code modifié dans le Core**
   - ✅ **AUCUN code modifié dans le Frontend menu**

**Critère de succès Phase 3**:
- ✅ Module Voyage enregistré et activé
- ✅ Menus différents selon agence
- ✅ Isolation totale entre modules
- ✅ **Proof of Concept validé**: Le système est plug & play !

---

## PHASE 4: FASTAPI LAYER (OPTIONNEL, 2-3 semaines)

### Objectif: Ajouter un backend Python pour IA avancée (RAG, Agents, SLM)

### 4.1 Créer le Service FastAPI

**Structure**:
```
/apps
  /server (FastAPI)
    ├── main.py
    ├── agents/
    │   ├── rag_agent.py
    │   ├── scoring_agent.py
    │   └── orchestrator.py
    ├── models/
    │   └── llm_client.py
    ├── database/
    │   └── pgvector.py
    └── requirements.txt
```

**Fichier**: `apps/server/main.py`

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="AI Intelligence Server")

class MatchingRequest(BaseModel):
    property_id: str
    prospect_id: str
    user_id: str

@app.post("/ai/matching")
async def matching(req: MatchingRequest):
    # Appeler l'agent de matching
    # Utiliser RAG pour récupérer contexte
    # Appeler LLM
    # Retourner score + explication
    return {
        "score": 0.85,
        "explanation": "...",
        "creditsUsed": 20
    }
```

---

### 4.2 Connecter NestJS → FastAPI

**Fichier**: `backend/src/shared/services/ai-orchestrator.service.ts`

```typescript
@Injectable()
export class AiOrchestratorService {
  private fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';

  async callMatching(propertyId: string, prospectId: string, userId: string) {
    // 1. Vérifier crédits
    await this.aiCreditsService.checkAndConsume(userId, 20, 'real_estate_matching');

    // 2. Appeler FastAPI
    const response = await axios.post(`${this.fastApiUrl}/ai/matching`, {
      property_id: propertyId,
      prospect_id: prospectId,
      user_id: userId,
    });

    // 3. Logger usage
    await this.aiUsageService.logUsage({
      userId,
      actionCode: 'real_estate_matching',
      creditsUsed: 20,
      provider: 'fastapi',
      metadata: response.data,
    });

    return response.data;
  }
}
```

---

## PHASE 5: A2UI - AGENT-DRIVEN UI (AVANCÉ, 4+ semaines)

### Objectif: Frontend génère ses composants à la volée depuis JSON

**Concept**:
```json
{
  "page": "trips",
  "layout": "list",
  "components": [
    {
      "type": "DataTable",
      "props": {
        "columns": [
          { "key": "destination", "label": "Destination", "type": "string" },
          { "key": "price", "label": "Prix", "type": "currency" },
          { "key": "status", "label": "Statut", "type": "badge" }
        ],
        "actions": [
          { "label": "Modifier", "action": "edit", "icon": "Edit" },
          { "label": "Supprimer", "action": "delete", "icon": "Trash" }
        ]
      }
    }
  ]
}
```

**Fichier**: `frontend/src/components/core/DynamicRenderer.tsx`

```typescript
const COMPONENT_MAP = {
  DataTable: DataTable,
  Form: DynamicForm,
  Card: Card,
  // ...
};

export function DynamicRenderer({ schema }: { schema: any }) {
  return (
    <>
      {schema.components.map((comp, i) => {
        const Component = COMPONENT_MAP[comp.type];
        return <Component key={i} {...comp.props} />;
      })}
    </>
  );
}
```

**Note**: Cette phase est **optionnelle** et très avancée. À faire seulement si nécessaire.

---

## PHASE 6: PGVECTOR + RAG (2 semaines)

### Objectif: Recherche sémantique sur documents privés

### 6.1 Ajouter pgvector à PostgreSQL

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE embeddings (
  id UUID PRIMARY KEY,
  agency_id VARCHAR,
  module_code VARCHAR,
  entity_type VARCHAR,  -- 'property', 'contract', 'feedback'
  entity_id VARCHAR,
  content TEXT,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### 6.2 Service d'Embedding

```python
# apps/server/database/pgvector.py
from openai import OpenAI
import psycopg2

client = OpenAI()

async def store_embedding(text: str, metadata: dict):
    # Générer embedding
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    embedding = response.data[0].embedding

    # Stocker en DB
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO embeddings (content, embedding, metadata) VALUES (%s, %s, %s)",
        (text, embedding, json.dumps(metadata))
    )
    conn.commit()
```

---

## PHASE 7: N8N INTEGRATION (1 semaine)

### Objectif: Workflows externes via webhooks

### 7.1 Installer n8n

```bash
docker run -d --name n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=password \
  n8nio/n8n
```

### 7.2 Webhook NestJS → n8n

```typescript
@Post('webhooks/n8n/:workflowId')
async triggerN8nWorkflow(@Param('workflowId') id: string, @Body() data: any) {
  return await axios.post(`http://localhost:5678/webhook/${id}`, data);
}
```

---

## 🎯 ROADMAP RÉCAPITULATIF

| Phase | Durée | Effort | Impact | Priorité |
|-------|-------|--------|--------|----------|
| **Phase 0**: Préparation | 1 sem | 🟢 Faible | 🔴 Critique | P0 |
| **Phase 1**: Module Registry | 2-3 sem | 🟡 Moyen | 🔴 Critique | P0 |
| **Phase 2**: Dynamic Menu | 3-4 sem | 🟡 Moyen | 🔴 Critique | P0 |
| **Phase 3**: Proof of Concept | 1 sem | 🟢 Faible | 🟠 Important | P1 |
| **Phase 4**: FastAPI Layer | 2-3 sem | 🟠 Élevé | 🟡 Moyen | P2 |
| **Phase 5**: A2UI | 4+ sem | 🔴 Très Élevé | 🟢 Faible | P3 |
| **Phase 6**: pgvector RAG | 2 sem | 🟡 Moyen | 🟡 Moyen | P2 |
| **Phase 7**: n8n | 1 sem | 🟢 Faible | 🟢 Faible | P3 |

**Total (MVP)**: Phases 0-3 = **7-9 semaines** pour un Core OS fonctionnel

---

## ✅ AVANTAGES DE CETTE APPROCHE

### 1. **ZÉRO REFACTORING PROFOND**
- ✅ L'existant continue de fonctionner tel quel
- ✅ Modules métier (immo) deviennent progressivement "pluggables"
- ✅ Aucune réécriture du frontend

### 2. **DÉPLOYABLE À CHAQUE PHASE**
- ✅ Phase 0 → Production stable
- ✅ Phase 1 → Module Registry fonctionnel (backward compatible)
- ✅ Phase 2 → Menu dynamique (backward compatible)
- ✅ Phase 3 → Multi-métier prouvé

### 3. **ÉVOLUTION NATURELLE**
```
CRM Immo Monolithique
  ↓ Phase 1
CRM Immo + Module Registry
  ↓ Phase 2
CRM Immo + Menu Dynamique
  ↓ Phase 3
Core OS Multi-Métier (Immo + Voyage)
  ↓ Phase 4-7
Core OS Complet (FastAPI + RAG + n8n)
```

### 4. **RISQUES MINIMAUX**
- ✅ Pas de big bang
- ✅ Tests progressifs
- ✅ Rollback facile (chaque phase est isolée)

---

## 🚨 PIÈGES À ÉVITER

### ❌ NE PAS FAIRE:

1. **Réécrire l'existant en "Core"**
   - ❌ Mauvais: Déplacer tous les modules business dans un nouveau dossier
   - ✅ Bon: Créer le registry, enregistrer l'existant tel quel

2. **Migrer vers App Router maintenant**
   - ❌ Mauvais: Convertir Pages Router → App Router pendant la migration
   - ✅ Bon: Garder Pages Router, migrer plus tard si nécessaire

3. **Créer FastAPI trop tôt**
   - ❌ Mauvais: Commencer par FastAPI avant Module Registry
   - ✅ Bon: D'abord valider le plug & play, puis ajouter l'IA avancée

4. **Tout abstraire d'un coup**
   - ❌ Mauvais: Créer des abstractions complexes pour "anticiper"
   - ✅ Bon: Commencer simple, abstraire au fur et à mesure

---

## 📝 CHECKLIST DE DÉMARRAGE

### Semaine 1 (Phase 0)
- [ ] Corriger schéma `ai_settings` (7 champs scraping)
- [ ] Créer enum `UserRole`
- [ ] Exécuter migrations
- [ ] Tests de régression AI Billing
- [ ] Tests de régression BYOK

### Semaine 2-3 (Phase 1.1-1.3)
- [ ] Créer schéma Prisma Module Registry
- [ ] Créer ModuleRegistryService
- [ ] Créer ModuleRegistryController
- [ ] Tests unitaires services

### Semaine 4-5 (Phase 1.4-1.6)
- [ ] Créer manifest `real-estate.manifest.json`
- [ ] Script de seed modules
- [ ] Enregistrer module Immo
- [ ] Tests API

### Semaine 6-8 (Phase 2)
- [ ] Créer DynamicMenu component
- [ ] Remplacer menu statique
- [ ] Tests frontend
- [ ] Tests E2E

### Semaine 9 (Phase 3)
- [ ] Créer manifest `travel.manifest.json`
- [ ] Pages frontend Voyage
- [ ] Tests multi-tenant
- [ ] **🎉 MVP VALIDÉ**

---

## 🎓 CONCLUSION

Cette stratégie permet de:

1. ✅ **Transformer progressivement** le CRM Immo en Core OS
2. ✅ **Sans casser** l'existant
3. ✅ **Sans refactoring** profond
4. ✅ **En 7-9 semaines** pour un MVP fonctionnel

**Prochaine étape recommandée**:
1. Valider cette stratégie avec l'équipe
2. Commencer Phase 0 (corrections critiques)
3. Puis attaquer Phase 1 (Module Registry)

---

**Auteur**: Analyse basée sur l'architecture existante du CRM Immobilier
**Version**: 1.0
**Dernière mise à jour**: 2025-12-27
