import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  Request,
  HttpStatus,
  HttpException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { ProspectionService } from './services/prospection.service';
import { ProspectionExportService, ExportFormat } from './services/prospection-export.service';
import { StartProspectionDto } from './dto';
import { PrismaService } from '../../shared/database/prisma.service';
import { UnifiedValidationService } from '../../shared/validation/unified-validation.service';
import { CacheService } from '../cache/cache.service';

/**
 * Controller de prospection IA
 */
@ApiTags('prospecting-ai')
@ApiBearerAuth()
@Controller('prospecting-ai')
@UseGuards(JwtAuthGuard)
export class ProspectingAiController {
  private readonly logger = new Logger(ProspectingAiController.name);

  // TTL: 2h (résultats d'une prospection restent disponibles 2h)
  private readonly CACHE_TTL = 7200;
  private readonly CACHE_PREFIX = 'prospection:result:';

  constructor(
    private readonly prospectionService: ProspectionService,
    private readonly exportService: ProspectionExportService,
    private readonly prisma: PrismaService,
    private readonly validationService: UnifiedValidationService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * POST /api/prospecting-ai/start
   *
   * Lancer une nouvelle prospection
   */
  @Post('start')
  @ApiOperation({ summary: 'Start a new AI prospection' })
  @ApiResponse({ status: 201, description: 'Prospection started successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async startProspection(@Request() req, @Body() request: StartProspectionDto) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId || userId;

    this.logger.log(`Starting prospection for tenant ${tenantId}: ${request.zone}`);

    try {
      const result = await this.prospectionService.startProspection({
        tenantId,
        userId,
        request,
      });

      // Persister en Redis (survit aux restarts)
      await this.cacheService.set(`${this.CACHE_PREFIX}${result.id}`, result, this.CACHE_TTL);

      return {
        prospectionId: result.id,
        status: result.status,
        leads: result.leads,
        stats: result.stats,
        metadata: result.metadata,
        errors: result.errors,
      };
    } catch (error) {
      this.logger.error('Failed to start prospection:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to start prospection',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/prospecting-ai/:id
   *
   * Récupérer le résultat d'une prospection
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get prospection result by ID' })
  @ApiResponse({ status: 200, description: 'Prospection found' })
  @ApiResponse({ status: 404, description: 'Prospection not found' })
  async getProspectionResult(@Param('id') id: string) {
    const result = await this.cacheService.get<any>(`${this.CACHE_PREFIX}${id}`);

    if (!result) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Prospection ${id} not found or expired`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }

  /**
   * GET /api/prospecting-ai/:id/export
   *
   * Exporter le résultat d'une prospection
   */
  @Get(':id/export')
  @ApiOperation({ summary: 'Export prospection result' })
  @ApiQuery({ name: 'format', enum: ExportFormat, required: false })
  @ApiResponse({ status: 200, description: 'Export successful' })
  @ApiResponse({ status: 404, description: 'Prospection not found' })
  async exportProspection(
    @Param('id') id: string,
    @Query('format') format: ExportFormat = ExportFormat.JSON,
    @Res() res: Response,
  ) {
    const result = await this.cacheService.get<any>(`${this.CACHE_PREFIX}${id}`);

    if (!result) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Prospection ${id} not found or expired`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      const exportResult = await this.exportService.export(result, format);

      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);

      return res.send(exportResult.data);
    } catch (error) {
      this.logger.error('Failed to export prospection:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to export prospection',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /api/prospecting-ai/:id/convert-to-prospects
   *
   * Convertir les leads IA en prospects CRM (avec déduplication et persistance DB)
   */
  @Post(':id/convert-to-prospects')
  @ApiOperation({ summary: 'Convert AI leads to CRM prospects (persisted)' })
  @ApiResponse({ status: 200, description: 'Leads converted and saved' })
  @ApiResponse({ status: 404, description: 'Prospection not found' })
  async convertToProspects(
    @Request() req,
    @Param('id') id: string,
    @Body() body?: { leadIds?: string[] },
  ) {
    const result = await this.cacheService.get<any>(`${this.CACHE_PREFIX}${id}`);

    if (!result) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Prospection ${id} not found or expired`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const userId = req.user.userId;
    // Filter leads if specific leadIds provided
    const leadsToConvert = body?.leadIds?.length
      ? result.leads.filter((l) => body.leadIds.includes(l.id))
      : result.leads;
    const crmLeads = this.exportService.convertToCrmFormat(leadsToConvert);
    const created: string[] = [];
    const merged: string[] = [];
    const skipped: string[] = [];

    for (const lead of crmLeads) {
      try {
        // Deduplication: check by email or phone
        let existing: any = null;
        if (lead.email) {
          existing = await this.prisma.prospects.findFirst({
            where: { userId, email: lead.email },
          });
        }
        if (!existing && lead.phone) {
          existing = await this.prisma.prospects.findFirst({
            where: { userId, phone: lead.phone },
          });
        }

        // Smart validation before saving
        const validationResult = await this.validateLeadBeforeConversion(lead);
        if (validationResult.isSpam) {
          this.logger.warn(`Lead rejected (spam): ${lead.email || lead.name}`);
          skipped.push(lead.email || lead.phone || 'spam');
          continue;
        }

        if (existing) {
          // Merge: update with new data that's missing
          const updates: Record<string, any> = {};
          if (!existing.phone && lead.phone && validationResult.phoneValid)
            updates.phone = lead.phone;
          if (!existing.email && lead.email && validationResult.emailValid)
            updates.email = lead.email;
          if (!existing.budget && lead.budget) updates.budget = lead.budget;
          if (!existing.city && lead.city) updates.city = lead.city;

          if (Object.keys(updates).length > 0) {
            await this.prisma.prospects.update({
              where: { id: existing.id },
              data: updates,
            });
          }
          merged.push(existing.id);
        } else {
          // Create new prospect
          const prospect = await this.prisma.prospects.create({
            data: {
              userId,
              firstName: lead.firstName || lead.name?.split(' ')[0] || 'Lead',
              lastName: lead.lastName || lead.name?.split(' ').slice(1).join(' ') || '',
              email: lead.email || null,
              phone: lead.phone || null,
              type: lead.type || 'buyer',
              status: 'new',
              score: lead.score || 0,
              source: `Prospection IA: ${result.metadata?.zone || id}`,
              city: lead.city || null,
              budget: lead.budget || null,
              profiling: {
                aiProspectionId: id,
                originalSource: lead.source || null,
                qualificationScore: lead.qualificationScore || null,
                urgency: lead.urgency || null,
              },
            },
          });
          created.push(prospect.id);
        }
      } catch (error) {
        this.logger.warn(`Failed to convert lead: ${error.message}`);
        skipped.push(lead.email || lead.phone || 'unknown');
      }
    }

    return {
      prospectionId: id,
      totalLeads: crmLeads.length,
      created: created.length,
      merged: merged.length,
      skipped: skipped.length,
      createdIds: created,
      mergedIds: merged,
      message: `${created.length} prospects créés, ${merged.length} fusionnés, ${skipped.length} ignorés.`,
    };
  }

  /**
   * Valider un lead avant conversion en prospect
   */
  private async validateLeadBeforeConversion(lead: any) {
    let emailValid = true;
    let phoneValid = true;
    let isSpam = false;
    const warnings: string[] = [];

    // Validate email
    if (lead.email) {
      try {
        const emailResult = await this.validationService.validateEmail(lead.email);
        emailValid = emailResult.isValid;
        if (emailResult.format?.isDisposable) {
          warnings.push('Email jetable');
          isSpam = true;
        }
        if (emailResult.risk?.isSpam) {
          isSpam = true;
        }
      } catch {
        // Validation service down, allow through
      }
    }

    // Validate phone
    if (lead.phone) {
      try {
        const phoneResult = await this.validationService.validatePhone(lead.phone);
        phoneValid = phoneResult.isValid;
      } catch {
        // Allow through
      }
    }

    // Validate name — suspect patterns
    const name = `${lead.firstName || ''} ${lead.lastName || lead.name || ''}`;
    if (/^(test|spam|fake|admin|user\d)/i.test(name.trim())) {
      isSpam = true;
      warnings.push('Nom suspect');
    }

    // Spam detection on raw text if available
    if (lead.rawText || lead.notes) {
      try {
        const spamResult = await this.validationService.detectSpam(lead.rawText || lead.notes);
        if (spamResult.isSpam) {
          isSpam = true;
        }
      } catch {
        // Allow through
      }
    }

    return { emailValid, phoneValid, isSpam, warnings };
  }
}
