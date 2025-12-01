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
import { JwtAuthGuard } from '@/modules/core/auth/guards/jwt-auth.guard';
import { TrackingConfigService } from './services/tracking-config.service';
import { TrackingEventsService } from './services/tracking-events.service';
import { ConversionPredictionService } from './ml/conversion-prediction.service';
import { AnomalyDetectionService } from './ml/anomaly-detection.service';
import { SegmentationService } from './ml/segmentation.service';
import { AttributionService } from './ml/attribution.service';
import { AutomationService } from './services/automation.service';
import { TrackingConfigDto, TrackingEvent } from './dto';

@Controller('marketing-tracking')
@UseGuards(JwtAuthGuard)
export class MarketingTrackingController {
  constructor(
    private readonly configService: TrackingConfigService,
    private readonly eventsService: TrackingEventsService,
    private readonly conversionPrediction: ConversionPredictionService,
    private readonly anomalyDetection: AnomalyDetectionService,
    private readonly segmentation: SegmentationService,
    private readonly attribution: AttributionService,
    private readonly automation: AutomationService,
  ) {}

  // Configuration Pixels
  @Get('config')
  getConfigs(@Request() req) {
    return this.configService.getConfigs(req.user.userId);
  }

  @Post('config')
  upsertConfig(@Request() req, @Body() dto: TrackingConfigDto) {
    return this.configService.upsertConfig(req.user.userId, dto);
  }

  @Post('config/:platform/test')
  testConfig(@Request() req, @Param('platform') platform: string) {
    return this.configService.testConfig(req.user.userId, platform as any);
  }

  @Delete('config/:platform')
  deleteConfig(@Request() req, @Param('platform') platform: string) {
    return this.configService.deleteConfig(req.user.userId, platform as any);
  }

  // Événements
  @Post('events')
  trackEvent(@Request() req, @Body() event: TrackingEvent) {
    return this.eventsService.trackEvent(req.user.userId, event);
  }

  @Get('events')
  getEvents(@Request() req, @Query() filters: any) {
    return this.eventsService.getEvents(req.user.userId, filters);
  }

  @Get('events/stats')
  getEventStats(@Request() req, @Query('period') period?: string) {
    return this.eventsService.getEventStats(req.user.userId, period as any);
  }

  // ML Services
  @Get('ml/predict/:sessionId')
  predictConversion(@Request() req, @Param('sessionId') sessionId: string) {
    return { message: 'Prediction endpoint' };
  }

  @Get('ml/anomalies')
  detectAnomalies(@Request() req, @Query('platform') platform: string) {
    return this.anomalyDetection.detectAnomalies(req.user.userId, platform as any);
  }

  @Get('ml/segments')
  getSegments(@Request() req) {
    return this.segmentation.identifySegments(req.user.userId);
  }

  @Get('ml/attribution/:prospectId')
  getAttribution(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Query('model') model?: string,
  ) {
    return this.attribution.calculateAttribution(req.user.userId, prospectId, model as any);
  }

  // Automation
  @Get('automation/config')
  getAutomationConfig(@Request() req) {
    return this.automation.getConfig(req.user.userId);
  }

  @Put('automation/config')
  updateAutomationConfig(@Request() req, @Body() data: any) {
    return this.automation.updateConfig(req.user.userId, data);
  }

  @Get('automation/suggestions')
  getSuggestions(@Request() req) {
    return this.automation.generateSuggestions(req.user.userId);
  }

  @Post('automation/apply')
  applyAutomation(@Request() req) {
    return this.automation.applyAutomation(req.user.userId);
  }
}

// Controller public (sans auth)
@Controller('public-tracking')
export class PublicTrackingController {
  constructor(private readonly eventsService: TrackingEventsService) {}

  @Post('event')
  trackPublicEvent(@Body() event: TrackingEvent & { userId: string }) {
    const { userId, ...eventData } = event;
    return this.eventsService.trackEvent(userId, eventData as TrackingEvent);
  }
}
