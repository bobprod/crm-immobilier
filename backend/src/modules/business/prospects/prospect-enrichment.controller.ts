import { Controller, Get, Post, Param, UseGuards, Request, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/core/auth/guards/jwt-auth.guard';
import { ProspectEnrichmentService } from './prospect-enrichment.service';

@ApiTags('Prospect Enrichment')
@Controller('prospects/enrichment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProspectEnrichmentController {
  constructor(
    private readonly enrichmentService: ProspectEnrichmentService,
  ) {}

  @Post(':prospectId/enrich')
  @ApiOperation({ summary: 'Enrich a prospect with tracking data' })
  async enrichProspect(@Param('prospectId') prospectId: string) {
    return this.enrichmentService.enrichProspectWithTracking(prospectId);
  }

  @Post('enrich-recent')
  @ApiOperation({ summary: 'Enrich all prospects created in the last 24h' })
  async enrichRecentProspects(@Request() req) {
    return this.enrichmentService.enrichRecentProspects(req.user.userId);
  }

  @Post('from-lead-event')
  @ApiOperation({ summary: 'Create prospect from a Lead tracking event' })
  async createFromLeadEvent(
    @Request() req,
    @Body() body: { leadEvent: any },
  ) {
    return this.enrichmentService.createProspectFromLeadEvent(
      req.user.userId,
      body.leadEvent,
    );
  }
}
