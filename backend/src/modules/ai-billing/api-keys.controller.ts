import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { AgencyAdminGuard } from '../../shared/guards/agency-admin.guard';
import { SuperAdminGuard } from '../../shared/guards/super-admin.guard';
import { ApiKeysService } from '../../shared/services/api-keys.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { UpdateUserApiKeysDto, UpdateAgencyApiKeysDto, UpdateGlobalApiKeysDto } from './dto';

@ApiTags('AI Billing - API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-billing/api-keys')
export class ApiKeysController {
  constructor(
    private apiKeysService: ApiKeysService,
    private prisma: PrismaService,
  ) { }

  /**
   * ═══════════════════════════════════════════════════════════
   * USER LEVEL - Clés API personnelles
   * ═══════════════════════════════════════════════════════════
   */

  @Get('user')
  @ApiOperation({ summary: 'Récupérer mes clés API personnelles (user-level)' })
  @ApiResponse({ status: 200, description: 'Clés API récupérées (valeurs masquées)' })
  async getUserApiKeys(@Request() req) {
    const settings = await this.prisma.ai_settings.findUnique({
      where: { userId: req.user.userId },
      select: {
        // LLM Providers
        anthropicApiKey: true,
        openaiApiKey: true,
        geminiApiKey: true,
        deepseekApiKey: true,
        openrouterApiKey: true,
        mistralApiKey: true,
        grokApiKey: true,
        cohereApiKey: true,
        togetherAiApiKey: true,
        replicateApiKey: true,
        perplexityApiKey: true,
        huggingfaceApiKey: true,
        alephAlphaApiKey: true,
        nlpCloudApiKey: true,
        // Scraping & Data Providers
        serpApiKey: true,
        firecrawlApiKey: true,
        picaApiKey: true,
        jinaReaderApiKey: true,
        scrapingBeeApiKey: true,
        browserlessApiKey: true,
        rapidApiKey: true,
        customApiKeys: true,
      },
    });

    // Masquer les clés (afficher seulement les 4 derniers caractères)
    return this.maskApiKeys(settings || {});
  }

  @Put('user')
  @ApiOperation({ summary: 'Mettre à jour mes clés API personnelles' })
  @ApiResponse({ status: 200, description: 'Clés API mises à jour' })
  async updateUserApiKeys(@Request() req, @Body() dto: UpdateUserApiKeysDto) {
    await this.prisma.ai_settings.upsert({
      where: { userId: req.user.userId },
      create: {
        userId: req.user.userId,
        ...this.filterDtoKeys(dto),
      },
      update: this.filterDtoKeys(dto),
    });

    return {
      success: true,
      message: 'Clés API personnelles mises à jour avec succès',
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * AGENCY LEVEL - Clés API de l'agence
   * ═══════════════════════════════════════════════════════════
   */

  @Get('agency')
  @UseGuards(AgencyAdminGuard)
  @ApiOperation({ summary: 'Récupérer les clés API de mon agence (admin agence uniquement)' })
  @ApiResponse({ status: 200, description: 'Clés API agence récupérées (valeurs masquées)' })
  async getAgencyApiKeys(@Request() req) {
    const user = await this.prisma.users.findUnique({
      where: { id: req.user.userId },
      select: { agencyId: true },
    });

    if (!user || !user.agencyId) {
      return { message: 'Utilisateur sans agence' };
    }

    const agencyKeys = await this.prisma.agencyApiKeys.findUnique({
      where: { agencyId: user.agencyId },
    });

    return this.maskApiKeys(agencyKeys || {});
  }

  @Put('agency')
  @UseGuards(AgencyAdminGuard)
  @ApiOperation({ summary: 'Mettre à jour les clés API de mon agence (admin agence uniquement)' })
  @ApiResponse({ status: 200, description: 'Clés API agence mises à jour' })
  async updateAgencyApiKeys(@Request() req, @Body() dto: UpdateAgencyApiKeysDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: req.user.userId },
      select: { agencyId: true },
    });

    if (!user || !user.agencyId) {
      return {
        success: false,
        message: 'Utilisateur sans agence',
      };
    }

    await this.apiKeysService.updateAgencyKeys(user.agencyId, dto);

    return {
      success: true,
      message: 'Clés API de l\'agence mises à jour avec succès',
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * SUPER ADMIN LEVEL - Clés API globales (fallback)
   * ═══════════════════════════════════════════════════════════
   */

  @Get('global')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Récupérer les clés API globales Super Admin (fallback)' })
  @ApiResponse({ status: 200, description: 'Clés API globales récupérées (valeurs masquées)' })
  async getGlobalApiKeys() {
    const settings = await this.prisma.globalSettings.findMany({
      where: {
        key: {
          in: [
            'superadmin_anthropic_key',
            'superadmin_openai_key',
            'superadmin_gemini_key',
            'superadmin_deepseek_key',
            'superadmin_openrouter_key',
            'superadmin_serp_key',
            'superadmin_firecrawl_key',
            'superadmin_pica_key',
            'superadmin_jina_key',
            'superadmin_scrapingbee_key',
            'superadmin_browserless_key',
            'superadmin_rapidapi_key',
          ],
        },
      },
    });

    const result = {};
    settings.forEach((setting) => {
      result[setting.key] = this.maskKey(setting.value);
    });

    return result;
  }

  @Put('global')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Mettre à jour les clés API globales Super Admin' })
  @ApiResponse({ status: 200, description: 'Clés API globales mises à jour' })
  async updateGlobalApiKeys(@Body() dto: UpdateGlobalApiKeysDto) {
    const updates = [];

    for (const [key, value] of Object.entries(dto)) {
      if (value) {
        updates.push(
          this.prisma.globalSettings.upsert({
            where: { key },
            create: {
              key,
              value,
              encrypted: true,
              description: `Clé API ${key.replace('superadmin_', '').replace('_key', '')} - Fallback Super Admin`,
            },
            update: { value },
          })
        );
      }
    }

    await Promise.all(updates);

    return {
      success: true,
      message: 'Clés API globales mises à jour avec succès',
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * HELPERS PRIVÉS
   * ═══════════════════════════════════════════════════════════
   */

  private maskApiKeys(keys: any): any {
    const masked = {};
    for (const [key, value] of Object.entries(keys)) {
      if (key !== 'id' && key !== 'userId' && key !== 'agencyId' && key !== 'createdAt' && key !== 'updatedAt') {
        masked[key] = value ? this.maskKey(value as string) : null;
      }
    }
    return masked;
  }

  private maskKey(key: string | null): string | null {
    if (!key || key === 'PLACEHOLDER_CONFIGURE_IN_ADMIN_PANEL') {
      return null;
    }
    if (key.length <= 8) {
      return '***';
    }
    return `${key.substring(0, 4)}${'*'.repeat(Math.max(key.length - 8, 3))}${key.substring(key.length - 4)}`;
  }

  private filterDtoKeys(dto: any): any {
    const filtered = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined && value !== null && value !== '') {
        filtered[key] = value;
      }
    }
    return filtered;
  }
}
