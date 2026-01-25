import { Module } from '@nestjs/common';
import { PlanningController } from './planning.controller';
import { PlanningService } from './services/planning.service';
import { PrismaModule } from '../../../shared/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}
