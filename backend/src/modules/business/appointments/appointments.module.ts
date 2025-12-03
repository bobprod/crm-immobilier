import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppointmentsController } from './appointments.controller';
import { ProspectsAppointmentsController } from './prospects-appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaModule } from '../../../shared/database/prisma.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(), // Active les tâches CRON
    NotificationsModule, // Pour créer des notifications lors des RDV
  ],
  controllers: [AppointmentsController, ProspectsAppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
