import { Module } from '@nestjs/common';
import { BusinessOrchestrator } from './shared/business-orchestrator.service';
import { MandatesModule } from './mandates/mandates.module';
import { TransactionsModule } from './transactions/transactions.module';
import { FinanceModule } from './finance/finance.module';
import { BusinessSharedModule } from './shared/business-shared.module';
import { DatabaseModule } from '../../shared/services/database/database.module';

/**
 * Module pour le Business Orchestrator
 *
 * Ce module est séparé pour éviter les dépendances circulaires.
 * Il importe tous les modules métier et fournit l'orchestrator.
 */
@Module({
  imports: [
    DatabaseModule,
    BusinessSharedModule,
    MandatesModule,
    TransactionsModule,
    FinanceModule,
  ],
  providers: [BusinessOrchestrator],
  exports: [BusinessOrchestrator],
})
export class BusinessOrchestratorModule {}
