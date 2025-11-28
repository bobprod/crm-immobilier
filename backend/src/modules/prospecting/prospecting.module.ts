import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { ProspectingController } from './prospecting.controller';
import { ProspectingService } from './prospecting.service';
import { ProspectingIntegrationService } from './prospecting-integration.service';
import { PrismaService } from '../../shared/database/prisma.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
  ],
  controllers: [ProspectingController],
  providers: [
    ProspectingService,
    ProspectingIntegrationService,
    PrismaService,
  ],
  exports: [
    ProspectingService,
    ProspectingIntegrationService,
  ],
})
export class ProspectingModule {}
