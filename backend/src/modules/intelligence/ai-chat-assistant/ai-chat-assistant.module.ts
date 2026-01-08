import { Module, forwardRef } from '@nestjs/common';
import { AIChatAssistantController } from './ai-chat-assistant.controller';
import { AIChatAssistantService } from './ai-chat-assistant.service';
import { PrismaModule } from '../../../shared/database/prisma.module';
import { QuickWinsLLMModule } from '../quick-wins-llm/quick-wins-llm.module';
import { CommunicationsModule } from '../../communications/communications.module';

@Module({
  imports: [PrismaModule, QuickWinsLLMModule, forwardRef(() => CommunicationsModule)],
  controllers: [AIChatAssistantController],
  providers: [AIChatAssistantService],
  exports: [AIChatAssistantService],
})
export class AIChatAssistantModule { }
