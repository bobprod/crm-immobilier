import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ValidationController } from './validation.controller';
import { ValidationService } from './validation.service';
import { ValidationAIService } from './validation-ai.service';
import { PrismaModule } from '../../../shared/database/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [ValidationController],
  providers: [ValidationService, ValidationAIService],
  exports: [ValidationService, ValidationAIService],
})
export class ValidationModule {}
