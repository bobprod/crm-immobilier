import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { DatabaseModule } from '../../../shared/services/database/database.module';
import { BusinessSharedModule } from '../shared/business-shared.module';

@Module({
  imports: [DatabaseModule, BusinessSharedModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
