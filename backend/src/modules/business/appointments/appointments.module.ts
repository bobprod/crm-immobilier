import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaModule } from '../../../shared/database/prisma.module';
import { CommunicationsModule } from '../../communications/communications.module';

@Module({
  imports: [
    PrismaModule,
    CommunicationsModule,
    ScheduleModule.forRoot(), // Active les tâches CRON
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
