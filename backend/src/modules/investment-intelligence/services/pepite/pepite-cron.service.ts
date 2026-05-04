import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { PepiteScorerService } from './pepite-scorer.service';
import { NotificationsService } from '../../../notifications/notifications.service';

@Injectable()
export class PepiteCronService {
  private readonly logger = new Logger(PepiteCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scorer: PepiteScorerService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async dailyRadarScan() {
    this.logger.log('Démarrage du scan Radar Spot quotidien');

    try {
      const agencies = await this.prisma.agencies.findMany({
        select: { id: true, country: true, city: true },
        where: { deletedAt: null } as any,
      });

      for (const agency of agencies) {
        const country = (agency as any).country ?? 'Tunisie';
        await this.scanForAgency(agency.id, country, (agency as any).city);
      }
    } catch (err: any) {
      this.logger.error(`Daily radar scan failed: ${err.message}`);
    }
  }

  private async scanForAgency(agencyId: string, country: string, city?: string) {
    try {
      const result = await this.scorer.scan(country);
      const hotSpots = result.opportunities.filter((o) => o.scoreLabel === 'PÉPITE');

      if (hotSpots.length === 0) return;

      // Notifier tous les agents de l'agence
      const users = await this.prisma.users.findMany({
        where: { agencyId, deletedAt: null } as any,
        select: { id: true },
      });

      for (const user of users) {
        await this.notifications.createNotification({
          userId: user.id,
          type: 'SYSTEM' as any,
          title: `📡 ${hotSpots.length} HOT SPOT${hotSpots.length > 1 ? 'S' : ''} détecté${hotSpots.length > 1 ? 's' : ''} — Radar Spot`,
          message: `Le Radar Spot a détecté ${hotSpots.length} opportunité${hotSpots.length > 1 ? 's' : ''} HOT SPOT sur le marché ${country}. Consultez l'onglet Radar Spot dans Immo Market.`,
          actionUrl: '/investment',
          metadata: JSON.stringify({ hotSpots: hotSpots.length, country, scanDate: result.scanDate }),
        });
      }

      this.logger.log(`Radar Spot: ${hotSpots.length} HOT SPOTS notifiés pour agence ${agencyId} (${country})`);
    } catch (err: any) {
      this.logger.warn(`Scan failed for agency ${agencyId}: ${err.message}`);
    }
  }
}
