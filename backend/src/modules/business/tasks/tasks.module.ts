import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../../shared/database/prisma.service';
import { CommunicationsModule } from '../../communications/communications.module';

@Module({
  imports: [ScheduleModule.forRoot(), CommunicationsModule],
  controllers: [TasksController],
  providers: [TasksService, PrismaService],
  exports: [TasksService],
})
export class TasksModule {}
