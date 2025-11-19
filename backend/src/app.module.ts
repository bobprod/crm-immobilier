import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/database/prisma.module';

// CORE MODULES
import { AuthModule } from './modules/core/auth/auth.module';
import { UsersModule } from './modules/core/users/users.module';
import { SettingsModule } from './modules/core/settings/settings.module';

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

import { databaseConfig, jwtConfig, mailConfig } from './config';

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, mailConfig],
    }),
    
    // Database
    PrismaModule,
    
    // CORE - 3 modules
    AuthModule,
    UsersModule,
    SettingsModule,
    
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
    
    // INTEGRATIONS - 1 module
    IntegrationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
