import {
  Controller, Get, Post, Put, Delete, Body, Param,
  Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CommitmentService } from './commitment.service';
import { OccurrenceService } from './occurrence.service';
import { CreateCommitmentDto, UpdateCommitmentDto, MarkDoneDto } from './dto/provision.dto';

@ApiTags('Finance - Provisions')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(JwtAuthGuard)
export class ProvisionController {
  constructor(
    private readonly commitmentService: CommitmentService,
    private readonly occurrenceService: OccurrenceService,
  ) {}

  // ─── COMMITMENTS ─────────────────────────────────────────────────────────

  @Post('commitments')
  @ApiOperation({ summary: 'Créer un engagement financier récurrent' })
  create(@Request() req, @Body() dto: CreateCommitmentDto) {
    return this.commitmentService.create(req.user.userId, dto);
  }

  @Get('commitments')
  @ApiOperation({ summary: 'Lister les engagements de l\'agence' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'category', required: false })
  findAll(
    @Request() req,
    @Query('isActive') isActive?: string,
    @Query('category') category?: string,
  ) {
    return this.commitmentService.findAll(req.user.userId, {
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(category && { category }),
    });
  }

  @Get('commitments/:id')
  @ApiOperation({ summary: 'Détail d\'un engagement' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.commitmentService.findOne(id, req.user.userId);
  }

  @Put('commitments/:id')
  @ApiOperation({ summary: 'Modifier un engagement' })
  update(@Param('id') id: string, @Request() req, @Body() dto: UpdateCommitmentDto) {
    return this.commitmentService.update(id, req.user.userId, dto);
  }

  @Delete('commitments/:id')
  @ApiOperation({ summary: 'Supprimer un engagement' })
  remove(@Param('id') id: string, @Request() req) {
    return this.commitmentService.remove(id, req.user.userId);
  }

  @Put('commitments/:id/toggle')
  @ApiOperation({ summary: 'Activer / Désactiver un engagement' })
  toggle(@Param('id') id: string, @Request() req) {
    return this.commitmentService.toggle(id, req.user.userId);
  }

  @Get('commitments/:id/occurrences')
  @ApiOperation({ summary: 'Occurrences d\'un engagement' })
  findOccurrences(
    @Param('id') id: string,
    @Request() req,
    @Query('status') status?: string,
  ) {
    return this.occurrenceService.findAll(req.user.userId, {
      commitmentId: id,
      ...(status && { status }),
    });
  }

  // ─── OCCURRENCES ─────────────────────────────────────────────────────────

  @Put('occurrences/:id/done')
  @ApiOperation({ summary: 'Marquer une occurrence comme payée' })
  markDone(@Param('id') id: string, @Request() req, @Body() dto: MarkDoneDto) {
    return this.occurrenceService.markAsDone(id, req.user.userId, dto);
  }

  @Put('occurrences/:id/waived')
  @ApiOperation({ summary: 'Dispenser une occurrence' })
  markWaived(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { reason?: string },
  ) {
    return this.occurrenceService.markAsWaived(id, req.user.userId, body.reason);
  }

  // ─── TABLEAU DE BORD PROVISIONS ──────────────────────────────────────────

  @Get('provisions/alert-status')
  @ApiOperation({ summary: 'Statut alerte global : GREEN / ORANGE / RED / CRITICAL' })
  getAlertStatus(@Request() req) {
    return this.occurrenceService.getAlertStatus(req.user.userId);
  }

  @Get('provisions/overdue')
  @ApiOperation({ summary: 'Toutes les occurrences en retard' })
  getOverdue(@Request() req) {
    return this.occurrenceService.getOverdue(req.user.userId);
  }

  @Get('provisions/summary')
  @ApiOperation({ summary: 'Résumé annuel de toutes les provisions' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  getYearlySummary(@Request() req, @Query('year') year?: string) {
    const y = year ? parseInt(year) : new Date().getFullYear();
    return this.occurrenceService.getYearlySummary(req.user.userId, y);
  }

  @Get('provisions/monthly')
  @ApiOperation({ summary: 'Détail provisions d\'un mois donné' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'month', required: true, type: Number })
  getMonthlySummary(@Request() req, @Query('year') year: string, @Query('month') month: string) {
    return this.occurrenceService.findAll(req.user.userId, {
      year: parseInt(year),
      month: parseInt(month),
    });
  }

  @Get('provisions/cumulative/:commitmentId')
  @ApiOperation({ summary: 'Progression cumulative d\'un engagement' })
  async getCumulative(@Param('commitmentId') commitmentId: string, @Request() req) {
    const occurrences = await this.occurrenceService.findAll(req.user.userId, { commitmentId });
    const paid = occurrences.filter((o: any) => o.status === 'DONE').reduce((s: number, o: any) => s + o.paidAmount, 0);
    const expected = occurrences.reduce((s: number, o: any) => s + o.expectedAmount, 0);
    return {
      commitmentId,
      totalPaid: paid,
      totalExpected: expected,
      progressPercent: expected > 0 ? Math.round((paid / expected) * 100) : 0,
      occurrencesDone: occurrences.filter((o: any) => o.status === 'DONE').length,
      occurrencesTotal: occurrences.length,
    };
  }
}
