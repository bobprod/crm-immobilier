import { Module } from '@nestjs/common';
import { PriorityInboxController } from './priority-inbox.controller';
import { PriorityInboxService } from './priority-inbox.service';
import { PrismaService } from '../../../shared/database/prisma.service';

@Module({
  controllers: [PriorityInboxController],
  providers: [PriorityInboxService, PrismaService],
  exports: [PriorityInboxService],
})
export class PriorityInboxModule {}
