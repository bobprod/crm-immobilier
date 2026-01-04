import { Module } from '@nestjs/common';
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

/**
 * Module Marketing Tracking + IA/ML
 *
 * Tracking multi-plateforme avec intelligence artificielle pour optimisation automatique.
 *
 * Fonctionnalités :
 * - Tracking multi-plateformes (Facebook, TikTok, GA4, GTM, LinkedIn, Snapchat, Google Ads)
 * - Server-Side Tracking (CAPI, Measurement Protocol)
 * - Prédiction de conversion avec ML
 * - Détection d'anomalies automatique
 * - Segmentation d'audience intelligente
 * - Attribution multi-touch (6 modèles)
 * - Automation IA (3 modes : Suggestion, Semi-Auto, Full-Auto)
 * - Suggestions d'optimisation intelligentes
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    MarketingTrackingController,
    PublicTrackingController,
    TrackingAnalyticsController,
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
  ],
  exports: [
    TrackingEventsService,
    ConversionPredictionService,
    TrackingAnalyticsService,
  ],
})
export class MarketingTrackingModule {}
