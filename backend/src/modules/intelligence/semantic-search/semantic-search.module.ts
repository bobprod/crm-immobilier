import { Module } from '@nestjs/common';
import { SemanticSearchController } from './semantic-search.controller';
import { SemanticSearchService } from './semantic-search.service';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [SemanticSearchController],
  providers: [SemanticSearchService, PrismaService],
  exports: [SemanticSearchService],
})
export class SemanticSearchModule {}
