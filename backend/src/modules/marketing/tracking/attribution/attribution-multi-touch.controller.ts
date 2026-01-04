import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/core/auth/guards/jwt-auth.guard';
import { AttributionMultiTouchService } from './attribution-multi-touch.service';

@ApiTags('Attribution Multi-Touch')
@Controller('marketing-tracking/attribution')
export class AttributionMultiTouchController {
  constructor(
    private readonly attributionService: AttributionMultiTouchService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('calculate')
  @ApiOperation({ summary: 'Calculate attribution for a conversion' })
  async calculateAttribution(
    @Request() req,
    @Query('sessionId') sessionId: string,
    @Query('model') model?: string,
  ) {
    return this.attributionService.calculateAttribution(
      req.user.userId,
      sessionId,
      model as any,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('compare')
  @ApiOperation({ summary: 'Compare all attribution models for a conversion' })
  async compareModels(
    @Request() req,
    @Query('sessionId') sessionId: string,
  ) {
    return this.attributionService.compareAttributionModels(
      req.user.userId,
      sessionId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('roi')
  @ApiOperation({ summary: 'Get platform ROI based on attribution model' })
  async getPlatformROI(
    @Request() req,
    @Query('model') model?: string,
  ) {
    return this.attributionService.getPlatformROI(
      req.user.userId,
      model as any,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('journey')
  @ApiOperation({ summary: 'Get user journey (touchpoints) for a session' })
  async getUserJourney(
    @Request() req,
    @Query('sessionId') sessionId: string,
  ) {
    // Utiliser la méthode privée via reflection ou créer une méthode publique
    const events = await (this.attributionService as any).getUserJourney(
      req.user.userId,
      sessionId,
    );
    return events;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('../conversions')
  @ApiOperation({ summary: 'Get all conversions for the current user' })
  async getConversions(@Request() req) {
    // Récupérer les conversions depuis Prisma
    const prisma = (this.attributionService as any).prisma;

    const conversions = await prisma.trackingEvent.findMany({
      where: {
        userId: req.user.userId,
        eventName: { in: ['Lead', 'Purchase', 'CompleteRegistration'] },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 100,
      select: {
        sessionId: true,
        timestamp: true,
        eventName: true,
        data: true,
      },
    });

    return conversions.map((c) => ({
      sessionId: c.sessionId,
      timestamp: c.timestamp,
      eventName: c.eventName,
      value: (c.data as any)?.value || 0,
    }));
  }
}
