import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './cache.service';
import { PrismaModule } from '../../shared/database/prisma.module';

@Global()
@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
