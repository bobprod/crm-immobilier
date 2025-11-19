import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { ProspectsConversionTrackerService } from './prospects-conversion-tracker.service';

@ApiTags('Prospects Conversion Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prospects-conversion')
export class ProspectsConversionTrackerController {
  constructor(
    private conversionTracker: ProspectsConversionTrackerService,
  ) {}

  @Post(':prospectId/qualified')
  @ApiOperation({ summary: 'Tracker prospect qualifié' })
  trackQualified(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Body() metadata?: any,
  ) {
    return this.conversionTracker.trackProspectQualified(
      prospectId,
      req.user.userId,
      metadata,
    );
  }

  @Post(':prospectId/meeting-booked')
  @ApiOperation({ summary: 'Tracker RDV confirmé' })
  trackMeeting(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Body() data: { appointmentId?: string; metadata?: any },
  ) {
    return this.conversionTracker.trackMeetingBooked(
      prospectId,
      req.user.userId,
      data.appointmentId,
      data.metadata,
    );
  }

  @Post(':prospectId/visit-completed')
  @ApiOperation({ summary: 'Tracker visite effectuée' })
  trackVisit(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Body() data: { propertyId: string; feedback?: any },
  ) {
    return this.conversionTracker.trackVisitCompleted(
      prospectId,
      data.propertyId,
      req.user.userId,
      data.feedback,
    );
  }

  @Post(':prospectId/offer-made')
  @ApiOperation({ summary: 'Tracker offre faite' })
  trackOffer(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Body() data: { propertyId: string; offerAmount: number; metadata?: any },
  ) {
    return this.conversionTracker.trackOfferMade(
      prospectId,
      data.propertyId,
      req.user.userId,
      data.offerAmount,
      data.metadata,
    );
  }

  @Post(':prospectId/contract-signed')
  @ApiOperation({ summary: 'Tracker contrat signé' })
  trackContractSigned(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Body()
    data: {
      propertyId: string;
      contractValue: number;
      commission: number;
      metadata?: any;
    },
  ) {
    return this.conversionTracker.trackContractSigned(
      prospectId,
      data.propertyId,
      req.user.userId,
      data.contractValue,
      data.commission,
      data.metadata,
    );
  }

  @Get(':prospectId/detect-conversions')
  @ApiOperation({ summary: 'Détecter conversions automatiquement' })
  detectConversions(@Request() req, @Param('prospectId') prospectId: string) {
    return this.conversionTracker.detectAndTrackConversions(
      prospectId,
      req.user.userId,
    );
  }

  @Get(':prospectId/agent-contribution')
  @ApiOperation({ summary: 'Contribution des agents à un prospect' })
  getAgentContribution(
    @Request() req,
    @Param('prospectId') prospectId: string,
  ) {
    return this.conversionTracker.calculateAgentContribution(
      prospectId,
      req.user.userId,
    );
  }

  @Get('high-roi')
  @ApiOperation({ summary: 'Prospects à fort ROI IA' })
  getHighROIProspects(@Request() req, @Query('limit') limit?: string) {
    return this.conversionTracker.getHighROIProspects(
      req.user.userId,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get(':prospectId/performance-report')
  @ApiOperation({ summary: 'Rapport de performance prospect' })
  getPerformanceReport(
    @Request() req,
    @Param('prospectId') prospectId: string,
  ) {
    return this.conversionTracker.getProspectPerformanceReport(
      prospectId,
      req.user.userId,
    );
  }
}
