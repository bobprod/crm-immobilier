import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { PrismaModule } from '../../shared/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [IntegrationsService],
  controllers: [IntegrationsController],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
