import { Module } from '@nestjs/common';
import { MandatesController } from './mandates.controller';
import { MandatesService } from './mandates.service';
import { DatabaseModule } from '../../../shared/services/database/database.module';
import { BusinessSharedModule } from '../shared/business-shared.module';

@Module({
  imports: [DatabaseModule, BusinessSharedModule],
  controllers: [MandatesController],
  providers: [MandatesService],
  exports: [MandatesService],
})
export class MandatesModule {}
