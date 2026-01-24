import { Module, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
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
import { TrackingNotificationsService } from './notifications/tracking-notifications.service';
import { TrackingProspectionAiService } from './prospection/tracking-prospection-ai.service';
import { TrackingProspectionAiController } from './prospection/tracking-prospection-ai.controller';
import { TrackingCommunicationsService } from './communications/tracking-communications.service';
import { TrackingWebDataService } from './webdata/tracking-webdata.service';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { ProspectingAiModule } from '@/modules/prospecting-ai/prospecting-ai.module';
import { PropertiesModule } from '@/modules/business/properties/properties.module';
import { CommunicationsModule } from '@/modules/communications/communications.module';
import { SmartFormsModule } from '@/modules/intelligence/smart-forms/smart-forms.module';

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
    NotificationsModule,
    ProspectingAiModule,
    PropertiesModule,
    CommunicationsModule,
    SmartFormsModule,
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
    TrackingProspectionAiController,
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
    TrackingNotificationsService,
    TrackingProspectionAiService,
    TrackingCommunicationsService,
    TrackingWebDataService,
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
    TrackingNotificationsService,
    TrackingProspectionAiService,
    TrackingCommunicationsService,
    TrackingWebDataService,
  ],
})
export class MarketingTrackingModule implements OnModuleInit {
  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Initialisation du module - injection des dépendances pour éviter les circular dependencies
   */
  async onModuleInit() {
    // Injecter NotificationsService dans TrackingNotificationsService
    try {
      const trackingNotifications = this.moduleRef.get(
        TrackingNotificationsService,
        { strict: false },
      );
      const notificationsService = this.moduleRef.get(
        'NotificationsService',
        { strict: false },
      );

      if (trackingNotifications && notificationsService) {
        trackingNotifications.setNotificationsService(notificationsService);
      }
    } catch {
      // NotificationsService is optional - silent fail
    }

    // Injecter ProspectionService et AiOrchestratorService dans TrackingProspectionAiService
    try {
      const trackingProspectionAi = this.moduleRef.get(
        TrackingProspectionAiService,
        { strict: false },
      );
      const prospectionService = this.moduleRef.get(
        'ProspectionService',
        { strict: false },
      );
      const aiOrchestratorService = this.moduleRef.get(
        'AiOrchestratorService',
        { strict: false },
      );

      if (trackingProspectionAi) {
        if (prospectionService) {
          trackingProspectionAi.setProspectionService(prospectionService);
        }
        if (aiOrchestratorService) {
          trackingProspectionAi.setAiOrchestratorService(aiOrchestratorService);
        }
      }
    } catch {
      // Prospection/AI services are optional - silent fail
    }

    // Injecter EmailService, SmsService et UnifiedCommunicationService dans TrackingCommunicationsService
    try {
      const trackingCommunications = this.moduleRef.get(
        TrackingCommunicationsService,
        { strict: false },
      );
      const emailService = this.moduleRef.get('EmailService', {
        strict: false,
      });
      const smsService = this.moduleRef.get('SmsService', { strict: false });
      const unifiedCommunicationService = this.moduleRef.get(
        'UnifiedCommunicationService',
        { strict: false },
      );

      if (trackingCommunications) {
        if (emailService) {
          trackingCommunications.setEmailService(emailService);
        }
        if (smsService) {
          trackingCommunications.setSmsService(smsService);
        }
        if (unifiedCommunicationService) {
          trackingCommunications.setUnifiedCommunicationService(
            unifiedCommunicationService,
          );
        }
      }
    } catch {
      // Communication services are optional - silent fail
    }

    // Injecter SmartFormsService dans TrackingWebDataService
    try {
      const trackingWebData = this.moduleRef.get(TrackingWebDataService, {
        strict: false,
      });
      const smartFormsService = this.moduleRef.get('SmartFormsService', {
        strict: false,
      });

      if (trackingWebData && smartFormsService) {
        trackingWebData.setSmartFormsService(smartFormsService);
      }
    } catch {
      // SmartFormsService is optional - silent fail
    }
  }
}
