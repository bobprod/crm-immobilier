import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/database/prisma.module';
import { VitrineController } from './vitrine.controller';
import { VitrineService } from './vitrine.service';

@Module({
  imports: [PrismaModule],
  controllers: [VitrineController],
  providers: [VitrineService],
  exports: [VitrineService],
})
export class VitrineModule {}
