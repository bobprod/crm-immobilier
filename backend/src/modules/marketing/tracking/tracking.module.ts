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
  controllers: [MarketingTrackingController, PublicTrackingController],
  providers: [
    TrackingConfigService,
    TrackingEventsService,
    ConversionPredictionService,
    AnomalyDetectionService,
    SegmentationService,
    AttributionService,
    AutomationService,
  ],
  exports: [TrackingEventsService, ConversionPredictionService],
})
export class MarketingTrackingModule {}
