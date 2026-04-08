import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { MarkDoneDto } from './dto/provision.dto';

export type AlertStatus = 'GREEN' | 'ORANGE' | 'RED' | 'CRITICAL';

@Injectable()
export class OccurrenceService {
  private readonly logger = new Logger(OccurrenceService.name);

  constructor(private readonly db: PrismaService) {}

  private async getAgencyId(userId: string): Promise<string> {
    const user = await this.db.users.findUnique({
      where: { id: userId },
      select: { agencyId: true },
    });
    if (!user?.agencyId) throw new ForbiddenException('User has no agency');
    return user.agencyId;
  }

  // ─── États ───────────────────────────────────────────────────────────────

  async findAll(userId: string, filters?: {
    commitmentId?: string;
    status?: string;
    year?: number;
    month?: number;
  }) {
    const agencyId = await this.getAgencyId(userId);

    return this.db.provisionOccurrence.findMany({
      where: {
        agencyId,
        ...(filters?.commitmentId && { commitmentId: filters.commitmentId }),
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.year && { periodYear: filters.year }),
        ...(filters?.month && { periodMonth: filters.month }),
      },
      include: {
        commitment: {
          select: { name: true, category: true, alertLevel: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async markAsDone(id: string, userId: string, dto: MarkDoneDto) {
    const agencyId = await this.getAgencyId(userId);
    const occ = await this.db.provisionOccurrence.findFirst({
      where: { id, agencyId },
    });
    if (!occ) throw new NotFoundException('Occurrence not found');

    return this.db.provisionOccurrence.update({
      where: { id },
      data: {
        status: 'DONE',
        paidAmount: dto.paidAmount ?? occ.expectedAmount,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        paidBy: userId,
        paymentRef: dto.paymentRef,
        notes: dto.notes,
      },
    });
  }

  async markAsWaived(id: string, userId: string, reason?: string) {
    const agencyId = await this.getAgencyId(userId);
    const occ = await this.db.provisionOccurrence.findFirst({
      where: { id, agencyId },
    });
    if (!occ) throw new NotFoundException('Occurrence not found');

    return this.db.provisionOccurrence.update({
      where: { id },
      data: { status: 'WAIVED', notes: reason },
    });
  }

  // ─── Stats & Résumés ──────────────────────────────────────────────────────

  async getMonthlySummary(agencyId: string, year: number, month: number) {
    const occs = await this.db.provisionOccurrence.findMany({
      where: { agencyId, periodYear: year, periodMonth: month },
      include: {
        commitment: { select: { name: true, category: true, alertLevel: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const total = occs.reduce((s, o) => s + o.expectedAmount, 0);
    const done = occs.filter((o) => o.status === 'DONE').reduce((s, o) => s + o.paidAmount, 0);
    const pending = occs.filter((o) => o.status === 'PENDING').reduce((s, o) => s + o.expectedAmount, 0);
    const overdue = occs.filter((o) => o.status === 'OVERDUE').reduce((s, o) => s + o.expectedAmount, 0);

    return {
      year, month,
      occurrences: occs,
      summary: { total, done, pending, overdue, count: occs.length },
    };
  }

  async getYearlySummary(userId: string, year: number) {
    const agencyId = await this.getAgencyId(userId);
    const occs = await this.db.provisionOccurrence.findMany({
      where: { agencyId, periodYear: year },
      include: {
        commitment: { select: { name: true, category: true } },
      },
      orderBy: [{ periodMonth: 'asc' }, { dueDate: 'asc' }],
    });

    // Grouper par mois
    const byMonth: Record<number, any> = {};
    for (let m = 1; m <= 12; m++) {
      const monthOccs = occs.filter((o) => o.periodMonth === m);
      byMonth[m] = {
        month: m,
        occurrences: monthOccs,
        total: monthOccs.reduce((s, o) => s + o.expectedAmount, 0),
        done: monthOccs.filter((o) => o.status === 'DONE').reduce((s, o) => s + o.paidAmount, 0),
        hasPending: monthOccs.some((o) => o.status === 'PENDING'),
        hasOverdue: monthOccs.some((o) => o.status === 'OVERDUE'),
      };
    }

    return {
      year,
      byMonth,
      totals: {
        expected: occs.reduce((s, o) => s + o.expectedAmount, 0),
        paid: occs.filter((o) => o.status === 'DONE').reduce((s, o) => s + o.paidAmount, 0),
        overdue: occs.filter((o) => o.status === 'OVERDUE').length,
      },
    };
  }

  async getCumulativeProgress(commitmentId: string, agencyId: string) {
    const commitment = await this.db.financialCommitment.findFirst({
      where: { id: commitmentId, agencyId },
    });
    if (!commitment) throw new NotFoundException('Commitment not found');

    const occs = await this.db.provisionOccurrence.findMany({
      where: { commitmentId },
      orderBy: { dueDate: 'asc' },
    });

    const totalPaid = occs
      .filter((o) => o.status === 'DONE')
      .reduce((s, o) => s + o.paidAmount, 0);

    const totalExpected = commitment.totalOccurrences
      ? commitment.totalOccurrences * commitment.amount
      : occs.reduce((s, o) => s + o.expectedAmount, 0);

    return {
      commitmentId,
      name: commitment.name,
      totalPaid,
      totalExpected,
      progressPercent: totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0,
      occurrencesDone: occs.filter((o) => o.status === 'DONE').length,
      occurrencesTotal: occs.length,
      currency: commitment.currency,
    };
  }

  async getOverdue(userId: string) {
    const agencyId = await this.getAgencyId(userId);
    return this.db.provisionOccurrence.findMany({
      where: { agencyId, status: 'OVERDUE' },
      include: {
        commitment: { select: { name: true, category: true, alertLevel: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  // ─── Alertes ─────────────────────────────────────────────────────────────

  async getAlertStatus(userId: string): Promise<{ status: AlertStatus; details: any[] }> {
    const agencyId = await this.getAgencyId(userId);
    return this.getAlertStatusByAgency(agencyId);
  }

  async getAlertStatusByAgency(agencyId: string): Promise<{ status: AlertStatus; details: any[] }> {
    const now = new Date();

    const problematic = await this.db.provisionOccurrence.findMany({
      where: {
        agencyId,
        status: { in: ['PENDING', 'OVERDUE'] },
        dueDate: { lt: now },
      },
      include: {
        commitment: {
          select: { name: true, category: true, alertLevel: true, gracePeriodDays: true },
        },
      },
    });

    if (problematic.length === 0) return { status: 'GREEN', details: [] };

    const overdueItems = problematic.filter((o) => {
      const grace = o.commitment.gracePeriodDays ?? 5;
      const graceEnd = new Date(o.dueDate);
      graceEnd.setDate(graceEnd.getDate() + grace);
      return now > graceEnd;
    });

    if (overdueItems.length === 0) return { status: 'ORANGE', details: problematic };

    const hasCritical = overdueItems.some((o) => o.commitment.alertLevel === 'CRITICAL');
    const hasHigh = overdueItems.some((o) => o.commitment.alertLevel === 'HIGH');

    const status: AlertStatus = hasCritical ? 'CRITICAL' : hasHigh ? 'RED' : 'ORANGE';
    return { status, details: overdueItems };
  }

  async checkAndTriggerAlerts(agencyId: string) {
    const { status, details } = await this.getAlertStatusByAgency(agencyId);

    if (status === 'GREEN') return;

    for (const occ of details) {
      // Éviter les doublons d'alertes (une par jour max)
      if (occ.alertSentAt) {
        const last = new Date(occ.alertSentAt);
        const hoursSince = (Date.now() - last.getTime()) / 3600000;
        if (hoursSince < 24) continue;
      }

      // Marquer OVERDUE
      await this.db.provisionOccurrence.update({
        where: { id: occ.id },
        data: {
          status: 'OVERDUE',
          alertSentAt: new Date(),
          alertCount: { increment: 1 },
        },
      });

      // Créer notification in-app
      const agency = await this.db.agencies.findUnique({
        where: { id: agencyId },
        include: { users: { where: { isActive: true }, select: { id: true } } },
      });

      if (agency) {
        for (const user of agency.users) {
          await this.db.notification.create({
            data: {
              userId: user.id,
              type: 'PROVISION_ALERT',
              title: `🚨 Provision en retard : ${occ.commitment.name}`,
              message: `L'engagement "${occ.commitment.name}" (${occ.periodLabel}) — ${occ.expectedAmount} ${occ.currency} — est en retard.`,
              data: JSON.stringify({
                occurrenceId: occ.id,
                commitmentName: occ.commitment.name,
                periodLabel: occ.periodLabel,
                expectedAmount: occ.expectedAmount,
                alertLevel: occ.commitment.alertLevel,
              }),
              isRead: false,
            },
          });
        }
      }

      this.logger.warn(`Alert triggered for agency ${agencyId}: ${occ.commitment.name} - ${occ.periodLabel}`);
    }
  }
}
