import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ProspectingController } from './prospecting.controller';
import { ProspectingService } from './prospecting.service';
// import { ProspectingFunnelService } from './prospecting-funnel.service';
import { PrismaService } from '../../shared/database/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [ProspectingController],
  providers: [ProspectingService, /* ProspectingFunnelService, */ PrismaService],
  exports: [ProspectingService, /* ProspectingFunnelService */],
})
export class ProspectingModule {}
