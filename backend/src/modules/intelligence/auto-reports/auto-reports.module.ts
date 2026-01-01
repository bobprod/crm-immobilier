import { Module } from '@nestjs/common';
import { AutoReportsController } from './auto-reports.controller';
import { AutoReportsService } from './auto-reports.service';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { QuickWinsLLMModule } from '../quick-wins-llm/quick-wins-llm.module';
import { CommunicationsModule } from '../../communications/communications.module';

@Module({
  imports: [ConfigModule, QuickWinsLLMModule, CommunicationsModule],
  controllers: [AutoReportsController],
  providers: [AutoReportsService, PrismaService],
  exports: [AutoReportsService],
})
export class AutoReportsModule { }
