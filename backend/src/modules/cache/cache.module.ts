import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { PrismaModule } from '../../shared/database/prisma.module';

@Global() // Rendre le cache disponible globalement
@Module({
  imports: [PrismaModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
