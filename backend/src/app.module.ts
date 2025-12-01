import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/database/prisma.module';
import { ThrottlerBehindProxyGuard } from './shared/guards/throttler-behind-proxy.guard';

// CORE MODULES
import { AuthModule } from './modules/core/auth/auth.module';
import { UsersModule } from './modules/core/users/users.module';
import { SettingsModule } from './modules/core/settings/settings.module';

// NOTIFICATIONS MODULE
import { NotificationsModule } from './modules/notifications/notifications.module';

// CACHE MODULE
import { CacheModule } from './modules/cache/cache.module';

// WORDPRESS MODULE
import { WordPressModule } from './modules/integrations/wordpress/wordpress.module';

// BUSINESS MODULES
import { PropertiesModule } from './modules/business/properties/properties.module';
import { ProspectsModule } from './modules/business/prospects/prospects.module';
import { AppointmentsModule } from './modules/business/appointments/appointments.module';
import { TasksModule } from './modules/business/tasks/tasks.module';

// INTELLIGENCE MODULES
import { AIMetricsModule } from './modules/intelligence/ai-metrics/ai-metrics.module';
import { LLMConfigModule } from './modules/intelligence/llm-config/llm-config.module';
import { MatchingModule } from './modules/intelligence/matching/matching.module';
import { ValidationModule } from './modules/intelligence/validation/validation.module';
import { AnalyticsModule } from './modules/intelligence/analytics/analytics.module';

// PROSPECTING MODULE
import { ProspectingModule } from './modules/prospecting/prospecting.module';

// COMMUNICATIONS MODULE
import { CommunicationsModule } from './modules/communications/communications.module';

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

    // Note: Pour activer @nestjs/throttler avec config avancée:
    // npm install @nestjs/throttler
    // Puis décommenter et remplacer ThrottlerBehindProxyGuard par ThrottlerGuard
    // ThrottlerModule.forRoot([
    //   { name: 'short', ttl: 1000, limit: 3 },
    //   { name: 'medium', ttl: 10000, limit: 20 },
    //   { name: 'long', ttl: 60000, limit: 100 },
    // ]),

    // Database
    PrismaModule,

    // CACHE - Global module
    CacheModule,

    // CORE - 3 modules
    AuthModule,
    UsersModule,
    SettingsModule,

    // NOTIFICATIONS - 1 module
    NotificationsModule,

    // BUSINESS - 4 modules
    PropertiesModule,
    ProspectsModule,
    AppointmentsModule,
    TasksModule,

    // INTELLIGENCE - 5 modules
    AIMetricsModule,
    LLMConfigModule,
    MatchingModule,
    ValidationModule,
    AnalyticsModule,

    // PROSPECTING - 1 module
    ProspectingModule,

    // COMMUNICATIONS - 1 module
    CommunicationsModule,

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
