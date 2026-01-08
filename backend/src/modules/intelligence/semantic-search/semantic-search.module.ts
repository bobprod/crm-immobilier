import { Module } from '@nestjs/common';
import { SemanticSearchController } from './semantic-search.controller';
import { JinaController } from './jina.controller';
import { SemanticSearchService } from './semantic-search.service';
import { JinaService } from './jina.service';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { QuickWinsLLMModule } from '../quick-wins-llm/quick-wins-llm.module';
import { LLMConfigModule } from '../llm-config/llm-config.module';

@Module({
  imports: [ConfigModule, QuickWinsLLMModule, LLMConfigModule],
  controllers: [SemanticSearchController, JinaController],
  providers: [SemanticSearchService, JinaService, PrismaService],
  exports: [SemanticSearchService, JinaService],
})
export class SemanticSearchModule { }
