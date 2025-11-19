import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../../shared/database/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [TasksController],
  providers: [TasksService, PrismaService],
  exports: [TasksService],
})
export class TasksModule {}
