import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { PrismaService } from '../../../shared/database/prisma.service';

@Module({
  controllers: [MatchingController],
  providers: [MatchingService, PrismaService],
  exports: [MatchingService],
})
export class MatchingModule {}
