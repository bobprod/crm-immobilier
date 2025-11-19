import { Module } from '@nestjs/common';
import { CampaignsModule } from './campaigns/campaigns.module';
import { MarketingTrackingModule } from './tracking/tracking.module';

/**
 * Marketing Module
 * 
 * Regroupe tous les modules liés au marketing :
 * - Campaigns (campagnes marketing)
 * - Tracking (tracking + IA/ML)
 */
@Module({
  imports: [
    CampaignsModule,
    MarketingTrackingModule,
  ],
  exports: [
    CampaignsModule,
    MarketingTrackingModule,
  ],
})
export class MarketingModule {}
