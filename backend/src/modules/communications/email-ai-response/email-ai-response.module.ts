import { Module } from '@nestjs/common';
import { EmailAIResponseService } from './email-ai-response.service';
import { EmailAIResponseController } from './email-ai-response.controller';
import { PrismaModule } from '../../../shared/database/prisma.module';
import { QuickWinsLLMModule } from '../../intelligence/quick-wins-llm/quick-wins-llm.module';
import { CommunicationsModule } from '../communications.module';

@Module({
  imports: [PrismaModule, QuickWinsLLMModule, CommunicationsModule],
  controllers: [EmailAIResponseController],
  providers: [EmailAIResponseService],
  exports: [EmailAIResponseService],
})
export class EmailAIResponseModule {}
