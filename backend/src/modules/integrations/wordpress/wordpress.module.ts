import { Module } from '@nestjs/common';
import { WordPressController } from './wordpress.controller';
import { WordPressService } from './wordpress.service';
import { PrismaModule } from '../../core/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WordPressController],
  providers: [WordPressService],
  exports: [WordPressService],
})
export class WordPressModule {}
