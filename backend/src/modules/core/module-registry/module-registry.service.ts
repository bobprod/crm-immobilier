import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ModuleStatus, ModuleCategory, UserRole } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════
// INTERFACES & TYPES
// ═══════════════════════════════════════════════════════════════

export interface ModuleManifest {
  code: string;
  name: string;
  version: string;
  category: 'BUSINESS' | 'INTELLIGENCE' | 'INTEGRATION' | 'COMMUNICATION' | 'MARKETING';
  description?: string;

  // Menus à générer dynamiquement
  menus: Array<{
    label: string;
    icon: string;
    path: string;
    requiredRole?: 'USER' | 'AGENT' | 'ADMIN' | 'SUPER_ADMIN';
    order?: number;
    children?: Array<{
      label: string;
      path: string;
      icon?: string;
      requiredRole?: 'USER' | 'AGENT' | 'ADMIN' | 'SUPER_ADMIN';
    }>;
  }>;

  // Permissions requises
  permissions: string[];

  // Actions IA disponibles
  aiActions: Array<{
    code: string;
    name: string;
    description?: string;
    creditsCost: number;
    provider?: string;
    model?: string;
    systemPrompt?: string;
    userPromptTpl?: string;
  }>;

  // Schémas de données (optionnel, pour modules très dynamiques)
  schemas?: Array<{
    tableName: string;
    fields: Array<{ name: string; type: string; }>;
  }>;

  // Configuration par défaut
  defaultConfig?: Record<string, any>;

  // Pricing
  basePrice?: number;
  creditsIncluded?: number;
}

// ═══════════════════════════════════════════════════════════════
// MODULE REGISTRY SERVICE
// ═══════════════════════════════════════════════════════════════

@Injectable()
export class ModuleRegistryService {
  constructor(private prisma: PrismaService) { }

  /**
   * ═══════════════════════════════════════════════════════════
   * ENREGISTREMENT D'UN MODULE MÉTIER
   * ═══════════════════════════════════════════════════════════
   *
   * Cette méthode permet d'enregistrer un nouveau module business
   * dans le système, en créant automatiquement:
   * - L'entrée BusinessModule
   * - Les items de menu (DynamicMenuItem)
   * - Les actions IA (ModuleAiAction + AiPricing)
   * - Les schémas dynamiques (DynamicSchema, optionnel)
   */
  async registerModule(manifest: ModuleManifest) {
    console.log(`📦 Enregistrement du module: ${manifest.code} (${manifest.name})`);

    // 1. Vérifier que le code est unique
    const existing = await this.prisma.businessModule.findUnique({
      where: { code: manifest.code },
    });

    if (existing && existing.version === manifest.version) {
      console.log(`ℹ️  Module ${manifest.code} v${manifest.version} déjà enregistré`);
      return existing;
    }

    // 2. Créer ou mettre à jour le module
    const module = await this.prisma.businessModule.upsert({
      where: { code: manifest.code },
      create: {
        code: manifest.code,
        name: manifest.name,
        description: manifest.description,
        version: manifest.version,
        category: manifest.category as ModuleCategory,
        status: 'ACTIVE' as ModuleStatus,
        manifest: manifest as any,
        basePrice: manifest.basePrice,
        creditsIncluded: manifest.creditsIncluded,
      },
      update: {
        name: manifest.name,
        description: manifest.description,
        version: manifest.version,
        manifest: manifest as any,
        basePrice: manifest.basePrice,
        creditsIncluded: manifest.creditsIncluded,
      },
    });

    console.log(`✅ Module ${module.code} créé/mis à jour (ID: ${module.id})`);

    // 3. Créer les items de menu
    console.log(`📋 Création de ${manifest.menus.length} menus...`);
    for (const menu of manifest.menus) {
      await this.createMenuItem(module.id, menu);
    }

    // 4. Créer les actions IA
    console.log(`🤖 Création de ${manifest.aiActions.length} actions IA...`);
    for (const action of manifest.aiActions) {
      await this.createAiAction(module.id, action);
    }

    // 5. Créer les schémas dynamiques (optionnel)
    if (manifest.schemas && manifest.schemas.length > 0) {
      console.log(`📊 Création de ${manifest.schemas.length} schémas dynamiques...`);
      for (const schema of manifest.schemas) {
        await this.createDynamicSchema(module.id, schema);
      }
    }

    console.log(`🎉 Module ${manifest.code} enregistré avec succès!`);
    return module;
  }

  /**
   * Créer un menu item (avec support des sous-menus)
   */
  private async createMenuItem(
    moduleId: string,
    menu: ModuleManifest['menus'][0],
    parentId?: string,
  ) {
    const menuItem = await this.prisma.dynamicMenuItem.upsert({
      where: {
        moduleId_path: { moduleId, path: menu.path },
      },
      create: {
        moduleId,
        label: menu.label,
        icon: menu.icon,
        path: menu.path,
        requiredRole: menu.requiredRole as UserRole,
        order: menu.order || 0,
        parentId,
      },
      update: {
        label: menu.label,
        icon: menu.icon,
        requiredRole: menu.requiredRole as UserRole,
        order: menu.order || 0,
      },
    });

    // Créer les sous-menus récursivement
    if (menu.children) {
      for (const child of menu.children) {
        await this.createMenuItem(
          moduleId,
          {
            label: child.label,
            icon: child.icon || menu.icon,
            path: child.path,
            requiredRole: child.requiredRole,
          },
          menuItem.id,
        );
      }
    }

    return menuItem;
  }

  /**
   * Créer une action IA et son pricing
   */
  private async createAiAction(
    moduleId: string,
    action: ModuleManifest['aiActions'][0],
  ) {
    // 1. Créer ou mettre à jour le pricing
    const pricing = await this.prisma.aiPricing.upsert({
      where: { actionCode: action.code },
      create: {
        actionCode: action.code,
        actionName: action.name,
        description: action.description,
        creditsCost: action.creditsCost,
        enabled: true,
      },
      update: {
        actionName: action.name,
        description: action.description,
        creditsCost: action.creditsCost,
      },
    });

    // 2. Créer ou mettre à jour l'action IA du module
    return await this.prisma.moduleAiAction.upsert({
      where: { actionCode: action.code },
      create: {
        moduleId,
        actionCode: action.code,
        actionName: action.name,
        description: action.description,
        pricingId: pricing.id,
        provider: action.provider,
        model: action.model,
        systemPrompt: action.systemPrompt,
        userPromptTpl: action.userPromptTpl,
        enabled: true,
      },
      update: {
        actionName: action.name,
        description: action.description,
        provider: action.provider,
        model: action.model,
        systemPrompt: action.systemPrompt,
        userPromptTpl: action.userPromptTpl,
      },
    });
  }

  /**
   * Créer un schéma dynamique
   */
  private async createDynamicSchema(
    moduleId: string,
    schema: NonNullable<ModuleManifest['schemas']>[0],
  ) {
    return await this.prisma.dynamicSchema.upsert({
      where: {
        moduleId_tableName: { moduleId, tableName: schema.tableName },
      },
      create: {
        moduleId,
        tableName: schema.tableName,
        schema: schema as any,
      },
      update: {
        schema: schema as any,
      },
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * ACTIVATION D'UN MODULE POUR UNE AGENCE
   * ═══════════════════════════════════════════════════════════
   */
  async activateModuleForAgency(
    agencyId: string,
    moduleCode: string,
    config?: Record<string, any>,
  ) {
    const module = await this.prisma.businessModule.findUnique({
      where: { code: moduleCode },
    });

    if (!module) {
      throw new NotFoundException(`Module "${moduleCode}" not found`);
    }

    if (module.status !== 'ACTIVE') {
      throw new BadRequestException(`Module "${moduleCode}" is not active`);
    }

    return await this.prisma.moduleAgencySubscription.upsert({
      where: {
        agencyId_moduleId: { agencyId, moduleId: module.id },
      },
      create: {
        agencyId,
        moduleId: module.id,
        isActive: true,
        config: config || null,
      },
      update: {
        isActive: true,
        config: config || null,
      },
    });
  }

  /**
   * Désactiver un module pour une agence
   */
  async deactivateModuleForAgency(agencyId: string, moduleCode: string) {
    const module = await this.prisma.businessModule.findUnique({
      where: { code: moduleCode },
    });

    if (!module) {
      throw new NotFoundException(`Module "${moduleCode}" not found`);
    }

    return await this.prisma.moduleAgencySubscription.updateMany({
      where: {
        agencyId,
        moduleId: module.id,
      },
      data: {
        isActive: false,
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
      orderBy: { activatedAt: 'asc' },
    });

    if (!subscriptions || subscriptions.length === 0) {
      return [];
    }

    const moduleIds = subscriptions.map((sub) => sub.moduleId);

    const [modules, menuItems, aiActions] = await Promise.all([
      this.prisma.businessModule.findMany({
        where: {
          id: { in: moduleIds },
          status: 'ACTIVE',
        },
      }),
      this.prisma.dynamicMenuItem.findMany({
        where: { moduleId: { in: moduleIds } },
        orderBy: { order: 'asc' },
      }),
      this.prisma.moduleAiAction.findMany({
        where: {
          moduleId: { in: moduleIds },
          enabled: true,
        },
      }),
    ]);

    const moduleMap = new Map<string, any>((modules as any[]).map((m: any) => [m.id, m]));

    return moduleIds
      .map((moduleId) => {
        const module = moduleMap.get(moduleId) as any;
        if (!module) return null;

        return {
          id: module.id,
          code: module.code,
          name: module.name,
          description: module.description,
          version: module.version,
          status: module.status,
          category: module.category,
          manifest: module.manifest,
          basePrice: module.basePrice,
          creditsIncluded: module.creditsIncluded,
          createdAt: module.createdAt,
          updatedAt: module.updatedAt,
          menuItems: menuItems.filter((item) => item.moduleId === moduleId),
          aiActions: aiActions.filter((action) => action.moduleId === moduleId),
        };
      })
      .filter(Boolean);
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * GÉNÉRATION DU MENU DYNAMIQUE POUR UNE AGENCE
   * ═══════════════════════════════════════════════════════════
   */
  async getMenuForAgency(agencyId: string, userRole: UserRole) {
    const modules = await this.getActiveModulesForAgency(agencyId);

    // Construire une map pour les items de menu afin de reconstruire l'arborescence
    const itemMap = new Map<string, any>();
    const rootItems: any[] = [];

    for (const module of modules) {
      for (const item of module.menuItems) {
        // Vérifier les permissions (hiérarchie des rôles)
        if (item.requiredRole && !this.hasRole(userRole, item.requiredRole)) {
          continue;
        }

        itemMap.set(item.id, {
          id: item.id,
          moduleId: module.id,
          moduleCode: module.code,
          moduleName: module.name,
          label: item.label,
          icon: item.icon,
          path: item.path,
          order: item.order,
          requiredRole: item.requiredRole,
          parentId: item.parentId,
          children: [] as any[],
        });
      }
    }

    // Construire l'arborescence parent → enfants
    for (const item of itemMap.values()) {
      if (item.parentId && itemMap.has(item.parentId)) {
        itemMap.get(item.parentId).children.push(item);
      } else {
        rootItems.push(item);
      }
    }

    const sortByOrder = (items: any[]) => {
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
      for (const child of items) {
        if (child.children?.length) {
          sortByOrder(child.children);
        }
      }
    };

    sortByOrder(rootItems);

    return rootItems;
  }

  /**
   * Vérifier la hiérarchie des rôles
   * USER < AGENT < ADMIN < SUPER_ADMIN
   */
  private hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
    const hierarchy: UserRole[] = ['USER', 'AGENT', 'ADMIN', 'SUPER_ADMIN'];
    const userLevel = hierarchy.indexOf(userRole);
    const requiredLevel = hierarchy.indexOf(requiredRole);
    return userLevel >= requiredLevel;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * LISTE DES MODULES DISPONIBLES
   * ═══════════════════════════════════════════════════════════
   */
  async getAllModules(includeInactive = false) {
    return await this.prisma.businessModule.findMany({
      where: includeInactive ? {} : { status: 'ACTIVE' },
      include: {
        _count: {
          select: {
            subscriptions: true,
            menuItems: true,
            aiActions: true,
          },
        },
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  /**
   * Récupérer un module par son code
   */
  async getModuleByCode(code: string) {
    const module = await this.prisma.businessModule.findUnique({
      where: { code },
      include: {
        menuItems: true,
        aiActions: {
          include: { pricing: true },
        },
        schemas: true,
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Module "${code}" not found`);
    }

    return module;
  }
}
