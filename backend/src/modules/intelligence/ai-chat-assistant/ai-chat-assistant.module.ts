import { Module } from '@nestjs/common';
import { AIChatAssistantController } from './ai-chat-assistant.controller';
import { AIChatAssistantService } from './ai-chat-assistant.service';
import { PrismaModule } from '../../core/database/prisma.module';
import { QuickWinsLLMModule } from '../quick-wins-llm/quick-wins-llm.module';

@Module({
  imports: [PrismaModule, QuickWinsLLMModule],
  controllers: [AIChatAssistantController],
  providers: [AIChatAssistantService],
  exports: [AIChatAssistantService],
})
export class AIChatAssistantModule {}
