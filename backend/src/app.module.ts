import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/database/prisma.module';
import { ThrottlerBehindProxyGuard } from './shared/guards/throttler-behind-proxy.guard';

// CORE MODULES
import { AuthModule } from './modules/core/auth/auth.module';
import { UsersModule } from './modules/core/users/users.module';
import { SettingsModule } from './modules/core/settings/settings.module';
import { ModuleRegistryModule } from './modules/core/module-registry/module-registry.module';

// NOTIFICATIONS MODULE
import { NotificationsModule } from './modules/notifications/notifications.module';

// CACHE MODULES
import { CacheModule } from './modules/cache/cache.module'; // Existing cache service
import { CacheModule as SharedCacheModule } from './shared/cache/cache.module'; // New @nestjs/cache-manager

// WORDPRESS MODULE
import { WordPressModule } from './modules/integrations/wordpress/wordpress.module';

// BUSINESS MODULES
import { PropertiesModule } from './modules/business/properties/properties.module';
import { ProspectsModule } from './modules/business/prospects/prospects.module';
import { AppointmentsModule } from './modules/business/appointments/appointments.module';
import { TasksModule } from './modules/business/tasks/tasks.module';
import { OwnersModule } from './modules/business/owners/owners.module';
import { MandatesModule } from './modules/business/mandates/mandates.module';
import { TransactionsModule } from './modules/business/transactions/transactions.module';
import { FinanceModule } from './modules/business/finance/finance.module';

// INTELLIGENCE MODULES
import { AIMetricsModule } from './modules/intelligence/ai-metrics/ai-metrics.module';
import { AIMetricsProspectingModule } from './modules/intelligence/ai-metrics-prospecting/ai-metrics-prospecting.module';
import { LLMConfigModule } from './modules/intelligence/llm-config/llm-config.module';
import { MatchingModule } from './modules/intelligence/matching/matching.module';
import { ValidationModule } from './modules/intelligence/validation/validation.module';
import { AnalyticsModule } from './modules/intelligence/analytics/analytics.module';
import { AiOrchestratorModule } from './modules/intelligence/ai-orchestrator/ai-orchestrator.module';
import { ProspectingAiModule } from './modules/prospecting-ai/prospecting-ai.module';
import { InvestmentIntelligenceModule } from './modules/investment-intelligence/investment-intelligence.module';

// QUICK WINS MODULES
import { SmartFormsModule } from './modules/intelligence/smart-forms/smart-forms.module';
import { SemanticSearchModule } from './modules/intelligence/semantic-search/semantic-search.module';
import { PriorityInboxModule } from './modules/intelligence/priority-inbox/priority-inbox.module';
import { AutoReportsModule } from './modules/intelligence/auto-reports/auto-reports.module';
import { AIChatAssistantModule } from './modules/intelligence/ai-chat-assistant/ai-chat-assistant.module';

// AI BILLING MODULE
import { AiBillingModule } from './modules/ai-billing/ai-billing.module';

// PROSPECTING MODULE
import { ProspectingModule } from './modules/prospecting/prospecting.module';

// SCRAPING MODULE
import { ScrapingModule } from './modules/scraping/scraping.module';

// COMMUNICATIONS MODULE
import { CommunicationsModule } from './modules/communications/communications.module';
import { EmailAIResponseModule } from './modules/communications/email-ai-response/email-ai-response.module';

// DASHBOARD MODULE
import { DashboardModule } from './modules/dashboard/dashboard.module';

// CONTENT MODULES
import { ContentModule } from './modules/content/content.module';

// MARKETING MODULES
import { MarketingModule } from './modules/marketing/marketing.module';

// INTEGRATIONS MODULE
import { IntegrationsModule } from './modules/integrations/integrations.module';

// PUBLIC MODULES
import { VitrineModule } from './modules/public/vitrine/vitrine.module';

import { databaseConfig, jwtConfig, mailConfig, integrationsConfig } from './config';

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, mailConfig, integrationsConfig],
    }),

    // Scheduler for cron jobs
    ScheduleModule.forRoot(),

    // Rate limiting (60 requêtes par minute par défaut)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 secondes
        limit: 60, // 60 requêtes max
      },
    ]),

    // Database
    PrismaModule,

    // CACHE - Global modules
    SharedCacheModule, // New @nestjs/cache-manager for properties
    CacheModule, // Existing cache service

    // CORE - 4 modules (+ Module Registry Phase 1)
    AuthModule,
    UsersModule,
    SettingsModule,
    ModuleRegistryModule,

    // NOTIFICATIONS - 1 module
    NotificationsModule,

    // BUSINESS - 8 modules
    PropertiesModule,
    ProspectsModule,
    AppointmentsModule,
    TasksModule,
    OwnersModule,
    MandatesModule,
    TransactionsModule,
    FinanceModule,

    // INTELLIGENCE - 11 modules (5 existing + 4 Quick Wins + 1 AI Chat Assistant + 1 AI Billing)
    AIMetricsModule,
    AIMetricsProspectingModule,
    LLMConfigModule,
    MatchingModule,
    ValidationModule,
    AnalyticsModule,
    SmartFormsModule,
    SemanticSearchModule,
    PriorityInboxModule,
    AutoReportsModule,
    AIChatAssistantModule,
    AiBillingModule,

    // PROSPECTING - 2 modules
    ProspectingModule,
    ProspectingAiModule,

    // SCRAPING - 1 module (Web Data Services)
    ScrapingModule,


    CommunicationsModule,
    EmailAIResponseModule,

    // DASHBOARD - 1 module
    DashboardModule,

    // CONTENT - 3 modules (Documents, SEO-AI, Page-Builder)
    ContentModule,

    // MARKETING - 2 modules (Campaigns, Tracking+ML)
    MarketingModule,

    // INTEGRATIONS - 2 modules
    IntegrationsModule,
    WordPressModule,

    // PUBLIC - 1 module (Vitrine)
    VitrineModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Rate Limiting global - appliqué à toutes les routes
    // Note: Utilise ThrottlerBehindProxyGuard (fallback) jusqu'à ce que @nestjs/throttler soit installé
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
})
export class AppModule {}
