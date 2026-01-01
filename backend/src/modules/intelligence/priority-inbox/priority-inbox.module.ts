import { Module } from '@nestjs/common';
import { PriorityInboxController } from './priority-inbox.controller';
import { PriorityInboxService } from './priority-inbox.service';
import { PrismaService } from '../../../shared/database/prisma.service';
import { CommunicationsModule } from '../../communications/communications.module';

@Module({
  imports: [CommunicationsModule],
  controllers: [PriorityInboxController],
  providers: [PriorityInboxService, PrismaService],
  exports: [PriorityInboxService],
})
export class PriorityInboxModule {}
