import { Module } from '@nestjs/common';
import { PersonnelController } from './personnel.controller';
import { PersonnelService } from './personnel.service';
import { PrismaModule as DatabaseModule } from '../../../shared/database/prisma.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PersonnelController],
  providers: [PersonnelService],
  exports: [PersonnelService],
})
export class PersonnelModule {}
