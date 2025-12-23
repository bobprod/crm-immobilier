import { Module } from '@nestjs/common';
import { SemanticSearchController } from './semantic-search.controller';
import { SemanticSearchService } from './semantic-search.service';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { QuickWinsLLMModule } from '../quick-wins-llm/quick-wins-llm.module';

@Module({
  imports: [ConfigModule, QuickWinsLLMModule],
  controllers: [SemanticSearchController],
  providers: [SemanticSearchService, PrismaService],
  exports: [SemanticSearchService],
})
export class SemanticSearchModule {}
