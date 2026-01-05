import { Module } from '@nestjs/common';
import { OwnersController } from './owners.controller';
import { OwnersService } from './owners.service';
import { PrismaModule as DatabaseModule } from '../../../shared/database/prisma.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OwnersController],
  providers: [OwnersService],
  exports: [OwnersService],
})
export class OwnersModule { }
