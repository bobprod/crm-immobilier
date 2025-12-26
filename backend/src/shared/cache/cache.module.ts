import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';

@Global()
@Module({
  imports: [
    NestCacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default TTL (in seconds)
      max: 100, // Maximum number of items in cache
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
