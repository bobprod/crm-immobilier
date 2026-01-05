import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { PrismaModule as DatabaseModule } from '../../../shared/database/prisma.module';
import { BusinessSharedModule } from '../shared/business-shared.module';

@Module({
  imports: [DatabaseModule, BusinessSharedModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule { }
