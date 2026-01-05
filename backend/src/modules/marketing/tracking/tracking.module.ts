import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MarketingTrackingController, PublicTrackingController } from './tracking.controller';
import { TrackingConfigService } from './services/tracking-config.service';
import { TrackingEventsService } from './services/tracking-events.service';
import { ConversionPredictionService } from './ml/conversion-prediction.service';
import { AnomalyDetectionService } from './ml/anomaly-detection.service';
import { SegmentationService } from './ml/segmentation.service';
import { AttributionService } from './ml/attribution.service';
import { AutomationService } from './services/automation.service';
import { PrismaModule } from '@/shared/database/prisma.module';
import { MetaConversionApiService } from './conversions/meta-conversion-api.service';
import { GoogleAdsConversionService } from './conversions/google-ads-conversion.service';
import { TikTokEventsApiService } from './conversions/tiktok-events-api.service';
import { LinkedInConversionApiService } from './conversions/linkedin-conversion-api.service';
import { GA4MeasurementProtocolService } from './conversions/ga4-measurement-protocol.service';
import { TrackingAnalyticsService } from './analytics/tracking-analytics.service';
import { TrackingAnalyticsController } from './analytics/tracking-analytics.controller';
import { TrackingRealtimeGateway } from './analytics/tracking-realtime.gateway';
import { HeatmapService } from './heatmap/heatmap.service';
import { HeatmapController } from './heatmap/heatmap.controller';
import { ABTestingService } from './ab-testing/ab-testing.service';
import { ABTestingController } from './ab-testing/ab-testing.controller';
import { AttributionMultiTouchService } from './attribution/attribution-multi-touch.service';
import { AttributionMultiTouchController } from './attribution/attribution-multi-touch.controller';
import { PropertyAnalyticsController } from './analytics/property-analytics.controller';
import { AITrackingInsightsService } from './ai-insights/ai-tracking-insights.service';
import { AITrackingInsightsController } from './ai-insights/ai-tracking-insights.controller';

/**
 * Module Marketing Tracking + IA/ML
 *
 * Tracking multi-plateforme avec intelligence artificielle pour optimisation automatique.
 *
 * Fonctionnalités :
 * - Tracking multi-plateformes (Facebook, TikTok, GA4, GTM, LinkedIn, Snapchat, Google Ads)
 * - Server-Side Tracking (CAPI, Measurement Protocol)
 * - WebSocket Temps Réel (événements live dans le dashboard)
 * - Heatmaps (clics, mouvements souris, scroll depth)
 * - A/B Testing (test de configurations pixels)
 * - Attribution Multi-Touch (6 modèles d'attribution)
 * - Prédiction de conversion avec ML
 * - Détection d'anomalies automatique
 * - Segmentation d'audience intelligente
 * - Automation IA (3 modes : Suggestion, Semi-Auto, Full-Auto)
 * - Suggestions d'optimisation intelligentes
 */
@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    MarketingTrackingController,
    PublicTrackingController,
    TrackingAnalyticsController,
    HeatmapController,
    ABTestingController,
    AttributionMultiTouchController,
    PropertyAnalyticsController,
    AITrackingInsightsController,
  ],
  providers: [
    TrackingConfigService,
    TrackingEventsService,
    ConversionPredictionService,
    AnomalyDetectionService,
    SegmentationService,
    AttributionService,
    AutomationService,
    MetaConversionApiService,
    GoogleAdsConversionService,
    TikTokEventsApiService,
    LinkedInConversionApiService,
    GA4MeasurementProtocolService,
    TrackingAnalyticsService,
    TrackingRealtimeGateway,
    HeatmapService,
    ABTestingService,
    AttributionMultiTouchService,
    AITrackingInsightsService,
  ],
  exports: [
    TrackingEventsService,
    ConversionPredictionService,
    TrackingAnalyticsService,
    TrackingRealtimeGateway,
    HeatmapService,
    ABTestingService,
    AttributionMultiTouchService,
    AITrackingInsightsService,
  ],
})
export class MarketingTrackingModule {}
