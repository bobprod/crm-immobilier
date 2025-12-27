import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../../shared/guards/super-admin.guard';
import { ModuleRegistryService, ModuleManifest } from './module-registry.service';
import { PrismaService } from '../../../shared/database/prisma.service';

@ApiTags('Core - Module Registry')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('core/modules')
export class ModuleRegistryController {
  constructor(
    private moduleRegistry: ModuleRegistryService,
    private prisma: PrismaService,
  ) {}

  /**
   * ═══════════════════════════════════════════════════════════
   * SUPER ADMIN: Gestion des modules
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Enregistrer un nouveau module métier
   */
  @Post('register')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Enregistrer un nouveau module métier (Super Admin)' })
  @ApiResponse({ status: 201, description: 'Module enregistré avec succès' })
  async registerModule(@Body() manifest: ModuleManifest) {
    return await this.moduleRegistry.registerModule(manifest);
  }

  /**
   * Activer un module pour une agence
   */
  @Post('activate/:agencyId/:moduleCode')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Activer un module pour une agence (Super Admin)' })
  @ApiResponse({ status: 200, description: 'Module activé pour l\'agence' })
  async activateModule(
    @Param('agencyId') agencyId: string,
    @Param('moduleCode') moduleCode: string,
    @Body() body?: { config?: Record<string, any> },
  ) {
    return await this.moduleRegistry.activateModuleForAgency(
      agencyId,
      moduleCode,
      body?.config,
    );
  }

  /**
   * Désactiver un module pour une agence
   */
  @Delete('deactivate/:agencyId/:moduleCode')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Désactiver un module pour une agence (Super Admin)' })
  @ApiResponse({ status: 200, description: 'Module désactivé pour l\'agence' })
  async deactivateModule(
    @Param('agencyId') agencyId: string,
    @Param('moduleCode') moduleCode: string,
  ) {
    return await this.moduleRegistry.deactivateModuleForAgency(agencyId, moduleCode);
  }

  /**
   * Liste de tous les modules disponibles
   */
  @Get('all')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Liste de tous les modules (Super Admin)' })
  @ApiResponse({ status: 200, description: 'Liste des modules' })
  async getAllModules(@Query('includeInactive') includeInactive?: string) {
    return await this.moduleRegistry.getAllModules(includeInactive === 'true');
  }

  /**
   * Détails d'un module par code
   */
  @Get('details/:code')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Détails d\'un module par code (Super Admin)' })
  @ApiResponse({ status: 200, description: 'Détails du module' })
  async getModuleDetails(@Param('code') code: string) {
    return await this.moduleRegistry.getModuleByCode(code);
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * USER: Accès aux modules de son agence
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Récupérer mes modules actifs (modules de mon agence)
   */
  @Get('my-modules')
  @ApiOperation({ summary: 'Mes modules actifs (modules de mon agence)' })
  @ApiResponse({
    status: 200,
    description: 'Liste des modules actifs pour mon agence',
  })
  async getMyModules(@Request() req) {
    const user = await this.prisma.users.findUnique({
      where: { id: req.user.userId },
      select: { agencyId: true },
    });

    if (!user?.agencyId) {
      return {
        modules: [],
        message: 'Vous n\'êtes pas membre d\'une agence',
      };
    }

    const modules = await this.moduleRegistry.getActiveModulesForAgency(user.agencyId);

    return {
      modules: modules.map(m => ({
        code: m.code,
        name: m.name,
        description: m.description,
        version: m.version,
        category: m.category,
        menuItemsCount: m.menuItems.length,
        aiActionsCount: m.aiActions.length,
      })),
      count: modules.length,
    };
  }

  /**
   * Récupérer mon menu dynamique
   */
  @Get('my-menu')
  @ApiOperation({ summary: 'Mon menu dynamique (généré depuis les modules actifs)' })
  @ApiResponse({
    status: 200,
    description: 'Menu dynamique basé sur mes permissions et modules',
  })
  async getMyMenu(@Request() req) {
    const user = await this.prisma.users.findUnique({
      where: { id: req.user.userId },
      select: { agencyId: true, role: true },
    });

    if (!user?.agencyId) {
      return {
        menu: [],
        message: 'Vous n\'êtes pas membre d\'une agence',
      };
    }

    const menu = await this.moduleRegistry.getMenuForAgency(
      user.agencyId,
      user.role,
    );

    return {
      menu,
      count: menu.length,
    };
  }

  /**
   * Récupérer les actions IA disponibles pour moi
   */
  @Get('my-ai-actions')
  @ApiOperation({ summary: 'Mes actions IA disponibles (depuis modules actifs)' })
  @ApiResponse({
    status: 200,
    description: 'Actions IA disponibles depuis mes modules',
  })
  async getMyAiActions(@Request() req) {
    const user = await this.prisma.users.findUnique({
      where: { id: req.user.userId },
      select: { agencyId: true },
    });

    if (!user?.agencyId) {
      return {
        actions: [],
        message: 'Vous n\'êtes pas membre d\'une agence',
      };
    }

    const modules = await this.moduleRegistry.getActiveModulesForAgency(user.agencyId);

    const actions = [];
    for (const module of modules) {
      for (const action of module.aiActions) {
        actions.push({
          code: action.actionCode,
          name: action.actionName,
          description: action.description,
          creditsCost: action.pricing?.creditsCost,
          provider: action.provider,
          model: action.model,
          module: module.name,
          moduleCode: module.code,
        });
      }
    }

    return {
      actions,
      count: actions.length,
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * ADMIN AGENCE: Gestion des modules de son agence
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Récupérer la configuration d'un module pour mon agence
   */
  @Get('agency-config/:moduleCode')
  @ApiOperation({
    summary: 'Configuration d\'un module pour mon agence (Admin agence)',
  })
  async getAgencyModuleConfig(
    @Request() req,
    @Param('moduleCode') moduleCode: string,
  ) {
    const user = await this.prisma.users.findUnique({
      where: { id: req.user.userId },
      select: { agencyId: true, role: true },
    });

    if (!user?.agencyId) {
      return { error: 'Vous n\'êtes pas membre d\'une agence' };
    }

    const module = await this.prisma.businessModule.findUnique({
      where: { code: moduleCode },
    });

    if (!module) {
      return { error: 'Module non trouvé' };
    }

    const subscription = await this.prisma.moduleAgencySubscription.findUnique({
      where: {
        agencyId_moduleId: {
          agencyId: user.agencyId,
          moduleId: module.id,
        },
      },
    });

    if (!subscription) {
      return { error: 'Module non activé pour votre agence' };
    }

    return {
      module: {
        code: module.code,
        name: module.name,
        version: module.version,
      },
      subscription: {
        isActive: subscription.isActive,
        activatedAt: subscription.activatedAt,
        expiresAt: subscription.expiresAt,
        config: subscription.config,
      },
    };
  }

  /**
   * Mettre à jour la configuration d'un module pour mon agence
   */
  @Put('agency-config/:moduleCode')
  @ApiOperation({
    summary: 'Mettre à jour la configuration d\'un module (Admin agence)',
  })
  async updateAgencyModuleConfig(
    @Request() req,
    @Param('moduleCode') moduleCode: string,
    @Body() body: { config: Record<string, any> },
  ) {
    const user = await this.prisma.users.findUnique({
      where: { id: req.user.userId },
      select: { agencyId: true, role: true },
    });

    if (!user?.agencyId) {
      return { error: 'Vous n\'êtes pas membre d\'une agence' };
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return { error: 'Accès refusé: admin agence requis' };
    }

    const module = await this.prisma.businessModule.findUnique({
      where: { code: moduleCode },
    });

    if (!module) {
      return { error: 'Module non trouvé' };
    }

    const updated = await this.prisma.moduleAgencySubscription.updateMany({
      where: {
        agencyId: user.agencyId,
        moduleId: module.id,
      },
      data: {
        config: body.config,
      },
    });

    return {
      success: true,
      message: 'Configuration mise à jour',
      updated: updated.count,
    };
  }
}
