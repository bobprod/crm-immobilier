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

/**
 * Controller de prospection IA
 */
@ApiTags('prospecting-ai')
@ApiBearerAuth()
@Controller('prospecting-ai')
@UseGuards(JwtAuthGuard)
export class ProspectingAiController {
  private readonly logger = new Logger(ProspectingAiController.name);

  // Stockage en mémoire des résultats (en prod, utiliser Redis ou DB)
  private readonly resultsCache = new Map<string, any>();

  constructor(
    private readonly prospectionService: ProspectionService,
    private readonly exportService: ProspectionExportService,
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

      // Stocker le résultat en cache (pour récupération ultérieure)
      this.resultsCache.set(result.id, result);

      // Nettoyer le cache après 1h
      setTimeout(() => {
        this.resultsCache.delete(result.id);
      }, 3600000);

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
    const result = this.resultsCache.get(id);

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
    const result = this.resultsCache.get(id);

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
   * Convertir les leads en prospects CRM
   */
  @Post(':id/convert-to-prospects')
  @ApiOperation({ summary: 'Convert leads to CRM prospects' })
  @ApiResponse({ status: 200, description: 'Leads converted successfully' })
  @ApiResponse({ status: 404, description: 'Prospection not found' })
  async convertToProspects(@Param('id') id: string) {
    const result = this.resultsCache.get(id);

    if (!result) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Prospection ${id} not found or expired`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Convertir les leads au format CRM
    const crmLeads = this.exportService.convertToCrmFormat(result.leads);

    return {
      prospectionId: id,
      totalLeads: crmLeads.length,
      leads: crmLeads,
      message: 'Leads converted to CRM format. You can now import them into the Prospects module.',
    };
  }
}
