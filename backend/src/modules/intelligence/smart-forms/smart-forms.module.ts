import { Module } from '@nestjs/common';
import { SmartFormsController } from './smart-forms.controller';
import { SmartFormsService } from './smart-forms.service';
import { PrismaService } from '../../../shared/database/prisma.service';

@Module({
  controllers: [SmartFormsController],
  providers: [SmartFormsService, PrismaService],
  exports: [SmartFormsService],
})
export class SmartFormsModule {}
