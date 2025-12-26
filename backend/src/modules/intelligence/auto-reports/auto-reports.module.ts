import { Module } from '@nestjs/common';
import { AutoReportsController } from './auto-reports.controller';
import { AutoReportsService } from './auto-reports.service';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [AutoReportsController],
  providers: [AutoReportsService, PrismaService],
  exports: [AutoReportsService],
})
export class AutoReportsModule {}
