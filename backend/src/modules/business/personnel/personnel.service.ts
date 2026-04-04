import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import {
  CreateAgentProfileDto,
  UpdateAgentProfileDto,
  UpdateCommissionConfigDto,
  UpdateAgentCommissionOverrideDto,
  UpdateAnnualBonusConfigDto,
  UpsertMonthlyPerformanceDto,
} from './dto/personnel.dto';

@Injectable()
export class PersonnelService {
  constructor(private readonly db: PrismaService) {}

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  private async getAgencyIdForUser(userId: string): Promise<string> {
    const user = await this.db.users.findUnique({ where: { id: userId } });
    if (!user?.agencyId) throw new ForbiddenException('No agency associated with user');
    return user.agencyId;
  }

  private async requireAgentInAgency(agentProfileId: string, agencyId: string) {
    const profile = await this.db.agentProfile.findFirst({
      where: { id: agentProfileId, agencyId },
    });
    if (!profile) throw new NotFoundException('Agent profile not found');
    return profile;
  }

  // ─────────────────────────────────────────────
  // AGENT PROFILES
  // ─────────────────────────────────────────────

  async findAllAgents(userId: string) {
    const agencyId = await this.getAgencyIdForUser(userId);

    return this.db.agentProfile.findMany({
      where: { agencyId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        commissionOverride: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneAgent(agentProfileId: string, userId: string) {
    const agencyId = await this.getAgencyIdForUser(userId);

    const profile = await this.db.agentProfile.findFirst({
      where: { id: agentProfileId, agencyId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        commissionOverride: true,
        monthlyPerformances: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 24,
        },
      },
    });

    if (!profile) throw new NotFoundException('Agent profile not found');
    return profile;
  }

  async createAgentProfile(userId: string, dto: CreateAgentProfileDto) {
    const agencyId = await this.getAgencyIdForUser(userId);

    // Verify the target user belongs to the same agency
    const targetUser = await this.db.users.findUnique({ where: { id: dto.userId } });
    if (!targetUser || targetUser.agencyId !== agencyId) {
      throw new ForbiddenException('Target user does not belong to your agency');
    }

    return this.db.agentProfile.create({
      data: {
        userId: dto.userId,
        agencyId,
        jobTitle: dto.jobTitle,
        phone: dto.phone,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
        isActive: dto.isActive ?? true,
        notes: dto.notes,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });
  }

  async updateAgentProfile(agentProfileId: string, userId: string, dto: UpdateAgentProfileDto) {
    const agencyId = await this.getAgencyIdForUser(userId);
    await this.requireAgentInAgency(agentProfileId, agencyId);

    const { hireDate, ...rest } = dto;
    return this.db.agentProfile.update({
      where: { id: agentProfileId },
      data: {
        ...rest,
        ...(hireDate && { hireDate: new Date(hireDate) }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        commissionOverride: true,
      },
    });
  }

  async deleteAgentProfile(agentProfileId: string, userId: string) {
    const agencyId = await this.getAgencyIdForUser(userId);
    await this.requireAgentInAgency(agentProfileId, agencyId);

    return this.db.agentProfile.delete({ where: { id: agentProfileId } });
  }

  // ─────────────────────────────────────────────
  // COMMISSION CONFIG (agency-level)
  // ─────────────────────────────────────────────

  async getCommissionConfig(userId: string) {
    const agencyId = await this.getAgencyIdForUser(userId);

    const config = await this.db.commissionConfig.findUnique({
      where: { agencyId },
    });

    // Return default config if none exists yet
    if (!config) {
      return {
        agencyId,
        tier1MaxAmount: 4000,
        tier2MinAmount: 7000,
        tier2Rate: 15,
        tier3MinAmount: 11000,
        tier3Rate: 20,
        directSaleRate: 20,
        currency: 'TND',
        isDefault: true,
      };
    }

    return config;
  }

  async upsertCommissionConfig(userId: string, dto: UpdateCommissionConfigDto) {
    const agencyId = await this.getAgencyIdForUser(userId);

    return this.db.commissionConfig.upsert({
      where: { agencyId },
      create: {
        agencyId,
        tier1MaxAmount: dto.tier1MaxAmount ?? 4000,
        tier2MinAmount: dto.tier2MinAmount ?? 7000,
        tier2Rate: dto.tier2Rate ?? 15,
        tier3MinAmount: dto.tier3MinAmount ?? 11000,
        tier3Rate: dto.tier3Rate ?? 20,
        directSaleRate: dto.directSaleRate ?? 20,
        currency: dto.currency ?? 'TND',
      },
      update: {
        ...(dto.tier1MaxAmount !== undefined && { tier1MaxAmount: dto.tier1MaxAmount }),
        ...(dto.tier2MinAmount !== undefined && { tier2MinAmount: dto.tier2MinAmount }),
        ...(dto.tier2Rate !== undefined && { tier2Rate: dto.tier2Rate }),
        ...(dto.tier3MinAmount !== undefined && { tier3MinAmount: dto.tier3MinAmount }),
        ...(dto.tier3Rate !== undefined && { tier3Rate: dto.tier3Rate }),
        ...(dto.directSaleRate !== undefined && { directSaleRate: dto.directSaleRate }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
      },
    });
  }

  // ─────────────────────────────────────────────
  // AGENT COMMISSION OVERRIDE (per-agent)
  // ─────────────────────────────────────────────

  async getAgentCommissionOverride(agentProfileId: string, userId: string) {
    const agencyId = await this.getAgencyIdForUser(userId);
    await this.requireAgentInAgency(agentProfileId, agencyId);

    return this.db.agentCommissionOverride.findUnique({
      where: { agentProfileId },
    });
  }

  async upsertAgentCommissionOverride(
    agentProfileId: string,
    userId: string,
    dto: UpdateAgentCommissionOverrideDto,
  ) {
    const agencyId = await this.getAgencyIdForUser(userId);
    await this.requireAgentInAgency(agentProfileId, agencyId);

    return this.db.agentCommissionOverride.upsert({
      where: { agentProfileId },
      create: { agentProfileId, ...dto },
      update: { ...dto },
    });
  }

  async deleteAgentCommissionOverride(agentProfileId: string, userId: string) {
    const agencyId = await this.getAgencyIdForUser(userId);
    await this.requireAgentInAgency(agentProfileId, agencyId);

    const existing = await this.db.agentCommissionOverride.findUnique({
      where: { agentProfileId },
    });
    if (!existing) throw new NotFoundException('No commission override for this agent');

    return this.db.agentCommissionOverride.delete({ where: { agentProfileId } });
  }

  // ─────────────────────────────────────────────
  // ANNUAL BONUS CONFIG (agency-level)
  // ─────────────────────────────────────────────

  async getAnnualBonusConfig(userId: string) {
    const agencyId = await this.getAgencyIdForUser(userId);

    const config = await this.db.annualBonusConfig.findUnique({
      where: { agencyId },
    });

    if (!config) {
      return {
        agencyId,
        tier1MinAmount: 180000,
        tier1Rate: 5,
        tier2MinAmount: null,
        tier2Rate: null,
        tier3MinAmount: null,
        tier3Rate: null,
        currency: 'TND',
        isDefault: true,
      };
    }

    return config;
  }

  async upsertAnnualBonusConfig(userId: string, dto: UpdateAnnualBonusConfigDto) {
    const agencyId = await this.getAgencyIdForUser(userId);

    return this.db.annualBonusConfig.upsert({
      where: { agencyId },
      create: {
        agencyId,
        tier1MinAmount: dto.tier1MinAmount ?? 180000,
        tier1Rate: dto.tier1Rate ?? 5,
        tier2MinAmount: dto.tier2MinAmount ?? null,
        tier2Rate: dto.tier2Rate ?? null,
        tier3MinAmount: dto.tier3MinAmount ?? null,
        tier3Rate: dto.tier3Rate ?? null,
        currency: dto.currency ?? 'TND',
      },
      update: {
        ...(dto.tier1MinAmount !== undefined && { tier1MinAmount: dto.tier1MinAmount }),
        ...(dto.tier1Rate !== undefined && { tier1Rate: dto.tier1Rate }),
        ...(dto.tier2MinAmount !== undefined && { tier2MinAmount: dto.tier2MinAmount }),
        ...(dto.tier2Rate !== undefined && { tier2Rate: dto.tier2Rate }),
        ...(dto.tier3MinAmount !== undefined && { tier3MinAmount: dto.tier3MinAmount }),
        ...(dto.tier3Rate !== undefined && { tier3Rate: dto.tier3Rate }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
      },
    });
  }

  // ─────────────────────────────────────────────
  // MONTHLY PERFORMANCE
  // ─────────────────────────────────────────────

  async getMonthlyPerformances(
    agentProfileId: string,
    userId: string,
    year?: number,
  ) {
    const agencyId = await this.getAgencyIdForUser(userId);
    await this.requireAgentInAgency(agentProfileId, agencyId);

    return this.db.agentMonthlyPerformance.findMany({
      where: {
        agentProfileId,
        ...(year && { year }),
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async upsertMonthlyPerformance(
    agentProfileId: string,
    userId: string,
    dto: UpsertMonthlyPerformanceDto,
  ) {
    const agencyId = await this.getAgencyIdForUser(userId);
    await this.requireAgentInAgency(agentProfileId, agencyId);

    // Get effective commission config (agent override or agency config)
    const agencyConfig = await this.db.commissionConfig.findUnique({
      where: { agencyId },
    });
    const agentOverride = await this.db.agentCommissionOverride.findUnique({
      where: { agentProfileId },
    });

    const effectiveConfig = {
      tier1MaxAmount: agentOverride?.tier1MaxAmount ?? agencyConfig?.tier1MaxAmount ?? 4000,
      tier2MinAmount: agentOverride?.tier2MinAmount ?? agencyConfig?.tier2MinAmount ?? 7000,
      tier2Rate: agentOverride?.tier2Rate ?? agencyConfig?.tier2Rate ?? 15,
      tier3MinAmount: agentOverride?.tier3MinAmount ?? agencyConfig?.tier3MinAmount ?? 11000,
      tier3Rate: agentOverride?.tier3Rate ?? agencyConfig?.tier3Rate ?? 20,
      directSaleRate: agentOverride?.directSaleRate ?? agencyConfig?.directSaleRate ?? 20,
    };

    const caAmount = dto.caAmount ?? 0;
    const directSalesCA = dto.directSalesCA ?? 0;

    // Calculate commission rate based on monthly CA
    let commissionRate = 0;
    if (caAmount >= effectiveConfig.tier3MinAmount) {
      commissionRate = effectiveConfig.tier3Rate;
    } else if (caAmount >= effectiveConfig.tier2MinAmount) {
      commissionRate = effectiveConfig.tier2Rate;
    }
    // Below tier1MaxAmount = 0%

    const commissionAmount = (caAmount * commissionRate) / 100;
    const directSalesCommission = (directSalesCA * effectiveConfig.directSaleRate) / 100;
    const totalCommission = commissionAmount + directSalesCommission;

    return this.db.agentMonthlyPerformance.upsert({
      where: {
        agentProfileId_year_month: {
          agentProfileId,
          year: dto.year,
          month: dto.month,
        },
      },
      create: {
        agentProfileId,
        year: dto.year,
        month: dto.month,
        caAmount,
        commissionRate,
        commissionAmount,
        directSalesCA,
        directSalesCommission,
        totalCommission,
        notes: dto.notes,
      },
      update: {
        caAmount,
        commissionRate,
        commissionAmount,
        directSalesCA,
        directSalesCommission,
        totalCommission,
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  // ─────────────────────────────────────────────
  // ANNUAL SUMMARY (for bonus calculation)
  // ─────────────────────────────────────────────

  async getAnnualSummary(agentProfileId: string, userId: string, year: number) {
    const agencyId = await this.getAgencyIdForUser(userId);

    const profile = await this.db.agentProfile.findFirst({
      where: { id: agentProfileId, agencyId },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!profile) throw new NotFoundException('Agent profile not found');

    const performances = await this.db.agentMonthlyPerformance.findMany({
      where: { agentProfileId, year },
      orderBy: { month: 'asc' },
    });

    const totalAnnualCA = performances.reduce((sum, p) => sum + p.caAmount, 0);
    const totalDirectSalesCA = performances.reduce((sum, p) => sum + p.directSalesCA, 0);
    const totalCommissions = performances.reduce((sum, p) => sum + p.totalCommission, 0);

    // Calculate annual bonus
    const bonusConfig = await this.db.annualBonusConfig.findUnique({
      where: { agencyId },
    });

    const effectiveBonusConfig = {
      tier1MinAmount: bonusConfig?.tier1MinAmount ?? 180000,
      tier1Rate: bonusConfig?.tier1Rate ?? 5,
      tier2MinAmount: bonusConfig?.tier2MinAmount ?? null,
      tier2Rate: bonusConfig?.tier2Rate ?? null,
      tier3MinAmount: bonusConfig?.tier3MinAmount ?? null,
      tier3Rate: bonusConfig?.tier3Rate ?? null,
    };

    let bonusRate = 0;
    if (
      effectiveBonusConfig.tier3MinAmount !== null &&
      totalAnnualCA >= effectiveBonusConfig.tier3MinAmount
    ) {
      bonusRate = effectiveBonusConfig.tier3Rate ?? 0;
    } else if (
      effectiveBonusConfig.tier2MinAmount !== null &&
      totalAnnualCA >= effectiveBonusConfig.tier2MinAmount
    ) {
      bonusRate = effectiveBonusConfig.tier2Rate ?? 0;
    } else if (totalAnnualCA >= effectiveBonusConfig.tier1MinAmount) {
      bonusRate = effectiveBonusConfig.tier1Rate;
    }

    const annualBonus = (totalAnnualCA * bonusRate) / 100;

    return {
      agentProfile: profile,
      year,
      totalAnnualCA,
      totalDirectSalesCA,
      totalCommissions,
      bonusRate,
      annualBonus,
      monthlyBreakdown: performances,
      currency: 'TND',
    };
  }

  // ─────────────────────────────────────────────
  // AGENCY STATS (all agents summary)
  // ─────────────────────────────────────────────

  async getAgencyPersonnelStats(userId: string, year: number) {
    const agencyId = await this.getAgencyIdForUser(userId);

    const agents = await this.db.agentProfile.findMany({
      where: { agencyId, isActive: true },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        monthlyPerformances: {
          where: { year },
          orderBy: { month: 'asc' },
        },
      },
    });

    const bonusConfig = await this.db.annualBonusConfig.findUnique({
      where: { agencyId },
    });

    const agentsSummary = agents.map((agent) => {
      const totalAnnualCA = agent.monthlyPerformances.reduce((sum, p) => sum + p.caAmount, 0);
      const totalCommissions = agent.monthlyPerformances.reduce(
        (sum, p) => sum + p.totalCommission,
        0,
      );

      const tier1MinAmount = bonusConfig?.tier1MinAmount ?? 180000;
      const tier1Rate = bonusConfig?.tier1Rate ?? 5;
      const bonusRate = totalAnnualCA >= tier1MinAmount ? tier1Rate : 0;
      const annualBonus = (totalAnnualCA * bonusRate) / 100;

      return {
        agentProfile: {
          id: agent.id,
          jobTitle: agent.jobTitle,
          user: agent.user,
        },
        totalAnnualCA,
        totalCommissions,
        bonusRate,
        annualBonus,
      };
    });

    return {
      year,
      agencyId,
      totalAgents: agents.length,
      agents: agentsSummary,
      totalAgencyCA: agentsSummary.reduce((sum, a) => sum + a.totalAnnualCA, 0),
      totalAgencyCommissions: agentsSummary.reduce((sum, a) => sum + a.totalCommissions, 0),
      totalAgencyBonuses: agentsSummary.reduce((sum, a) => sum + a.annualBonus, 0),
      currency: 'TND',
    };
  }
}
