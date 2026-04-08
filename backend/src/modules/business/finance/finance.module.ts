import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { PrismaModule as DatabaseModule } from '../../../shared/database/prisma.module';
import { BusinessSharedModule } from '../shared/business-shared.module';
import { ProvisionController } from './provision/provision.controller';
import { CommitmentService } from './provision/commitment.service';
import { OccurrenceService } from './provision/occurrence.service';

@Module({
  imports: [DatabaseModule, BusinessSharedModule],
  controllers: [FinanceController, ProvisionController],
  providers: [FinanceService, CommitmentService, OccurrenceService],
  exports: [FinanceService, CommitmentService, OccurrenceService],
})
export class FinanceModule { }
