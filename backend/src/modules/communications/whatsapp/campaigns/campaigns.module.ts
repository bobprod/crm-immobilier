import { Module, forwardRef } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { PrismaModule } from '../../../../shared/database/prisma.module';
import { WhatsAppModule } from '../whatsapp.module';

@Module({
  imports: [PrismaModule, forwardRef(() => WhatsAppModule)],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
