import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { DatabaseModule } from '../../../shared/services/database/database.module';
import { BusinessSharedModule } from '../shared/business-shared.module';

@Module({
  imports: [DatabaseModule, BusinessSharedModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
