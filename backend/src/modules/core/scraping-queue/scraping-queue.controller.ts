import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { AgencyAdminGuard } from '../../../shared/guards/agency-admin.guard';
import { ScrapingQueueService } from './scraping-queue.service';
import { CreateScrapingJobDto, BatchScrapingJobDto } from './dto';

@ApiTags('scraping-queue')
@ApiBearerAuth()
@Controller('scraping-queue')
@UseGuards(JwtAuthGuard)
export class ScrapingQueueController {
  constructor(private readonly queueService: ScrapingQueueService) {}

  // ═════════════════════════════════════════════════════════════════
  // JOB MANAGEMENT
  // ═════════════════════════════════════════════════════════════════

  @Post('jobs')
  @ApiOperation({
    summary: 'Créer un job de scraping',
    description: 'Ajoute des URLs à la queue de scraping pour traitement async',
  })
  async createJob(@Request() req, @Body() dto: CreateScrapingJobDto) {
    const userId = req.user.userId;
    const agencyId = req.user.agencyId;
    return this.queueService.createJob(userId, dto, agencyId);
  }

  @Post('jobs/batch')
  @ApiOperation({
    summary: 'Créer un batch de jobs de scraping',
    description: "Traite un grand nombre d'URLs avec contrôle de concurrence",
  })
  async createBatchJob(@Request() req, @Body() dto: BatchScrapingJobDto) {
    const userId = req.user.userId;
    const agencyId = req.user.agencyId;
    return this.queueService.createBatchJob(userId, dto, agencyId);
  }

  @Get('jobs')
  @ApiOperation({
    summary: "Lister les jobs de l'utilisateur",
    description: 'Récupère tous les jobs de scraping avec filtres',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['waiting', 'active', 'completed', 'failed'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listJobs(
    @Request() req,
    @Query('status') status?: 'waiting' | 'active' | 'completed' | 'failed',
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.userId;
    return this.queueService.listUserJobs(userId, {
      status,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('jobs/:jobId')
  @ApiOperation({
    summary: "Récupérer le statut d'un job",
    description: 'Détails complets du job incluant progression et résultats',
  })
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.queueService.getJobStatus(jobId);
  }

  @Delete('jobs/:jobId')
  @ApiOperation({
    summary: 'Annuler un job',
    description: 'Retire le job de la queue (seulement si waiting ou active)',
  })
  async cancelJob(@Request() req, @Param('jobId') jobId: string) {
    const userId = req.user.userId;
    await this.queueService.cancelJob(jobId, userId);
    return { message: 'Job cancelled successfully' };
  }

  @Post('jobs/:jobId/retry')
  @ApiOperation({
    summary: 'Retry un job échoué',
    description: 'Réessaye un job qui a échoué',
  })
  async retryJob(@Request() req, @Param('jobId') jobId: string) {
    const userId = req.user.userId;
    await this.queueService.retryJob(jobId, userId);
    return { message: 'Job retried successfully' };
  }

  // ═════════════════════════════════════════════════════════════════
  // QUEUE STATS & MANAGEMENT
  // ═════════════════════════════════════════════════════════════════

  @Get('stats')
  @UseGuards(AgencyAdminGuard)
  @ApiOperation({
    summary: 'Statistiques de la queue',
    description: 'Nombre de jobs par statut (waiting, active, completed, failed)',
  })
  async getStats() {
    return this.queueService.getQueueStats();
  }

  @Post('pause')
  @UseGuards(AgencyAdminGuard)
  @ApiOperation({
    summary: 'Mettre la queue en pause',
    description: 'Arrête le traitement des jobs (admin uniquement)',
  })
  async pauseQueue(@Request() req) {
    await this.queueService.pauseQueue();
    return { message: 'Queue paused' };
  }

  @Post('resume')
  @UseGuards(AgencyAdminGuard)
  @ApiOperation({
    summary: 'Reprendre la queue',
    description: 'Reprend le traitement des jobs (admin uniquement)',
  })
  async resumeQueue(@Request() req) {
    await this.queueService.resumeQueue();
    return { message: 'Queue resumed' };
  }
}
