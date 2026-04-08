import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import {
  CreateCommitmentDto,
  UpdateCommitmentDto,
} from './dto/provision.dto';

@Injectable()
export class CommitmentService {
  private readonly logger = new Logger(CommitmentService.name);

  constructor(private readonly db: PrismaService) { }

  // ─── Helper : récupérer l'agencyId depuis userId ─────────────────────────
  private async getAgencyId(userId: string): Promise<string> {
    const user = await this.db.users.findUnique({
      where: { id: userId },
      select: { agencyId: true },
    });
    if (!user?.agencyId) throw new ForbiddenException('User has no agency');
    return user.agencyId;
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateCommitmentDto) {
    const agencyId = await this.getAgencyId(userId);

    const commitment = await this.db.financialCommitment.create({
      data: {
        ...dto,
        agencyId,
        createdBy: userId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });

    // Générer les occurrences automatiquement
    await this.generateOccurrences(commitment.id);

    return commitment;
  }

  async findAll(userId: string, filters?: { isActive?: boolean; category?: string }) {
    const agencyId = await this.getAgencyId(userId);

    return this.db.financialCommitment.findMany({
      where: {
        agencyId,
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.category && { category: filters.category as any }),
      },
      include: {
        occurrences: {
          orderBy: { dueDate: 'desc' },
          take: 1, // dernière occurrence pour statut rapide
        },
        _count: { select: { occurrences: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const agencyId = await this.getAgencyId(userId);
    const commitment = await this.db.financialCommitment.findFirst({
      where: { id, agencyId },
      include: {
        occurrences: { orderBy: { dueDate: 'asc' } },
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!commitment) throw new NotFoundException('Commitment not found');
    return commitment;
  }

  async update(id: string, userId: string, dto: UpdateCommitmentDto) {
    const agencyId = await this.getAgencyId(userId);
    const existing = await this.db.financialCommitment.findFirst({
      where: { id, agencyId },
    });
    if (!existing) throw new NotFoundException('Commitment not found');

    return this.db.financialCommitment.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
      },
    });
  }

  async remove(id: string, userId: string) {
    const agencyId = await this.getAgencyId(userId);
    const existing = await this.db.financialCommitment.findFirst({
      where: { id, agencyId },
    });
    if (!existing) throw new NotFoundException('Commitment not found');

    await this.db.financialCommitment.delete({ where: { id } });
    return { message: 'Commitment deleted' };
  }

  async toggle(id: string, userId: string) {
    const agencyId = await this.getAgencyId(userId);
    const existing = await this.db.financialCommitment.findFirst({
      where: { id, agencyId },
    });
    if (!existing) throw new NotFoundException('Commitment not found');

    const updated = await this.db.financialCommitment.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    // Si on réactive, générer les occurrences manquantes
    if (updated.isActive) await this.generateOccurrences(id);

    return updated;
  }

  // ─── Génération des occurrences ──────────────────────────────────────────

  async generateOccurrences(commitmentId: string) {
    const commitment = await this.db.financialCommitment.findUnique({
      where: { id: commitmentId },
      include: { occurrences: { select: { periodYear: true, periodMonth: true } } },
    });
    if (!commitment || !commitment.isActive) return;

    const start = new Date(commitment.startDate);
    const end = commitment.endDate
      ? new Date(commitment.endDate)
      : this.addMonths(start, commitment.totalOccurrences ?? 12);

    const existing = new Set(
      commitment.occurrences.map((o) => `${o.periodYear}-${o.periodMonth}`),
    );

    const toCreate: any[] = [];
    let current = new Date(start);

    while (current <= end) {
      const year = current.getFullYear();
      const month = current.getMonth() + 1; // 1-12
      const key = `${year}-${month}`;

      if (!existing.has(key)) {
        const dueDate = new Date(year, month - 1, commitment.customDayOfMonth ?? 1);

        toCreate.push({
          commitmentId,
          agencyId: commitment.agencyId,
          periodLabel: this.formatPeriodLabel(year, month, commitment.frequency),
          periodYear: year,
          periodMonth: month,
          dueDate,
          expectedAmount: commitment.amount,
          currency: commitment.currency,
          status: 'PENDING',
        });
      }

      current = this.advancePeriod(current, commitment.frequency);
    }

    if (toCreate.length > 0) {
      await this.db.provisionOccurrence.createMany({ data: toCreate });
      this.logger.log(`Generated ${toCreate.length} occurrences for commitment ${commitmentId}`);
    }
  }

  async generateNextOccurrence(commitmentId: string) {
    const commitment = await this.db.financialCommitment.findUnique({
      where: { id: commitmentId },
    });
    if (!commitment || !commitment.isActive) return;

    const last = await this.db.provisionOccurrence.findFirst({
      where: { commitmentId },
      orderBy: { dueDate: 'desc' },
    });

    let next: Date;
    if (last) {
      next = this.advancePeriod(new Date(last.dueDate), commitment.frequency);
    } else {
      next = new Date(commitment.startDate);
    }

    if (commitment.endDate && next > new Date(commitment.endDate)) return;

    const year = next.getFullYear();
    const month = next.getMonth() + 1;

    const exists = await this.db.provisionOccurrence.findFirst({
      where: { commitmentId, periodYear: year, periodMonth: month },
    });
    if (exists) return;

    return this.db.provisionOccurrence.create({
      data: {
        commitmentId,
        agencyId: commitment.agencyId,
        periodLabel: this.formatPeriodLabel(year, month, commitment.frequency),
        periodYear: year,
        periodMonth: month,
        dueDate: new Date(year, month - 1, commitment.customDayOfMonth ?? 1),
        expectedAmount: commitment.amount,
        currency: commitment.currency,
        status: 'PENDING',
      },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private advancePeriod(date: Date, frequency: string): Date {
    const d = new Date(date);
    switch (frequency) {
      case 'MONTHLY': d.setMonth(d.getMonth() + 1); break;
      case 'QUARTERLY': d.setMonth(d.getMonth() + 3); break;
      case 'YEARLY': d.setFullYear(d.getFullYear() + 1); break;
      default: d.setMonth(d.getMonth() + 1);
    }
    return d;
  }

  private addMonths(date: Date, n: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + n);
    return d;
  }

  private formatPeriodLabel(year: number, month: number, frequency: string): string {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    if (frequency === 'QUARTERLY') return `T${Math.ceil(month / 3)} ${year}`;
    if (frequency === 'YEARLY') return `${year}`;
    return `${months[month - 1]} ${year}`;
  }
}
