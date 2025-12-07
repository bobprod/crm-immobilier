import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/database/prisma.module';
import { VitrineController } from './vitrine.controller';
import { VitrineService } from './vitrine.service';
import { SeoAiModule } from '../../content/seo-ai/seo-ai.module';

@Module({
  imports: [PrismaModule, SeoAiModule],
  controllers: [VitrineController],
  providers: [VitrineService],
  exports: [VitrineService],
})
export class VitrineModule {}
