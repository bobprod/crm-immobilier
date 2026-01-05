import { Module } from '@nestjs/common';
import { MandatesController } from './mandates.controller';
import { MandatesService } from './mandates.service';
import { PrismaModule as DatabaseModule } from '../../../shared/database/prisma.module';
import { BusinessSharedModule } from '../shared/business-shared.module';

@Module({
  imports: [DatabaseModule, BusinessSharedModule],
  controllers: [MandatesController],
  providers: [MandatesService],
  exports: [MandatesService],
})
export class MandatesModule { }
