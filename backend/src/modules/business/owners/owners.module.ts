import { Module } from '@nestjs/common';
import { OwnersController } from './owners.controller';
import { OwnersService } from './owners.service';
import { DatabaseModule } from '../../../shared/services/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OwnersController],
  providers: [OwnersService],
  exports: [OwnersService],
})
export class OwnersModule {}
