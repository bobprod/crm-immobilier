import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

export interface AgentPerformance {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  // CA
  revenueThisMonth: number;       // CA généré ce mois (commissions agence = 80%)
  revenueLastMonth: number;
  revenueYTD: number;             // Year-to-date
  targetMonthly: number;          // Objectif mensuel configuré (défaut 13000)
  targetProgressPercent: number;  // % d'atteinte
  // Commissions agent (20%)
  commissionThisMonth: number;
  commissionPending: number;      // commissions dues non payées
  commissionPaid: number;         // commissions payées this month
  // Transactions
  transactionsThisMonth: number;
  transactionsLastMonth: number;
  transactionsYTD: number;
  transactionsPending: number;    // en cours (pas encore 'final_deed_signed')
  // Mandats
  mandatesTotal: number;
  mandatesExclusive: number;
  mandatesExclusivePercent: number;
  // Prospects
  prospectsActive: number;
  prospectsConverted: number;
  conversionRate: number;
  // Performance score (0-100)
  performanceScore: number;
  trend: 'up' | 'down' | 'stable'; // vs mois précédent
}

export interface AgencyDashboard {
  // CA Agence
  agencyRevenueThisMonth: number;
  agencyRevenueLastMonth: number;
  agencyRevenueYTD: number;
  survivalThreshold: number;      // 18100 TND
  recommendedThreshold: number;   // 26000 TND
  survivalStatus: 'safe' | 'warning' | 'danger'; // vs seuil survie
  // Agents
  agents: AgentPerformance[];
  agentsAboveTarget: number;
  agentsBelowTarget: number;
  topAgent: AgentPerformance | null;
  // Provisions (si ProvisionModule actif)
  provisionAlertStatus: string;   // GREEN / ORANGE / RED / CRITICAL
  provisionThisMonth: number;     // 9000 TND idéalement
  provisionDone: boolean;
  // Objectifs
  monthlyTarget: number;          // 52000 TND agence plein régime
  targetProgressPercent: number;
  // Transactions pipeline
  transactionsTotal: number;
  transactionsClosed: number;
  transactionsPending: number;
  // Timeline mois par mois (12 derniers mois)
  revenueTimeline: { month: string; revenue: number; target: number }[];
}

@Injectable()
export class AgentDashboardService {
  private readonly logger = new Logger(AgentDashboardService.name);

  // Constantes métier (surchargeables via settings)
  private readonly AGENT_MONTHLY_TARGET = 13000;   // TND
  private readonly AGENCY_MONTHLY_TARGET = 52000;  // TND
  private readonly SURVIVAL_THRESHOLD = 18100;     // TND
  private readonly RECOMMENDED_THRESHOLD = 26000;  // TND
  private readonly AGENT_COMMISSION_RATE = 0.20;   // 20%

  constructor(private readonly db: PrismaService) {}

  // ─── Helper : récupérer l'agencyId depuis userId ─────────────────────────
  private async getAgencyId(userId: string): Promise<string | null> {
    const user = await this.db.users.findUnique({
      where: { id: userId },
      select: { agencyId: true },
    });
    return user?.agencyId ?? null;
  }

  // ─── Helper : bornes de période ──────────────────────────────────────────
  private getPeriodBounds(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
  }

  private getCurrentPeriod() {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }

  // ─── Performance d'un agent ───────────────────────────────────────────────
  async getAgentPerformance(agentUserId: string, year?: number, month?: number): Promise<AgentPerformance> {
    const { year: cy, month: cm } = this.getCurrentPeriod();
    const y = year ?? cy;
    const m = month ?? cm;

    const { start: startCurrent, end: endCurrent } = this.getPeriodBounds(y, m);
    const { start: startLast, end: endLast } = this.getPeriodBounds(
      m === 1 ? y - 1 : y,
      m === 1 ? 12 : m - 1,
    );
    const startYTD = new Date(y, 0, 1);

    const user = await this.db.users.findUnique({
      where: { id: agentUserId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    // Commissions agence (80%) générées par cet agent ce mois
    const [commissionsThisMonth, commissionsLastMonth, commissionsYTD] = await Promise.all([
      this.db.commission.findMany({
        where: { agentId: agentUserId, createdAt: { gte: startCurrent, lte: endCurrent } },
        select: { amount: true, status: true },
      }),
      this.db.commission.findMany({
        where: { agentId: agentUserId, createdAt: { gte: startLast, lte: endLast } },
        select: { amount: true, status: true },
      }),
      this.db.commission.findMany({
        where: { agentId: agentUserId, createdAt: { gte: startYTD } },
        select: { amount: true, status: true },
      }),
    ]);

    // Revenu agence = sum des commissions (le montant dans Commission EST la part agence 80%)
    const revenueThisMonth = commissionsThisMonth.reduce((s, c) => s + c.amount, 0);
    const revenueLastMonth = commissionsLastMonth.reduce((s, c) => s + c.amount, 0);
    const revenueYTD = commissionsYTD.reduce((s, c) => s + c.amount, 0);

    // Commission agent (20% du montant agence)
    const commissionThisMonth = revenueThisMonth * this.AGENT_COMMISSION_RATE;
    const commissionPending = commissionsThisMonth
      .filter((c) => c.status === 'pending')
      .reduce((s, c) => s + c.amount * this.AGENT_COMMISSION_RATE, 0);
    const commissionPaid = commissionsThisMonth
      .filter((c) => c.status === 'paid')
      .reduce((s, c) => s + c.amount * this.AGENT_COMMISSION_RATE, 0);

    // Transactions
    const [txThisMonth, txLastMonth, txYTD, txPending] = await Promise.all([
      this.db.transaction.count({
        where: { userId: agentUserId, status: 'final_deed_signed', updatedAt: { gte: startCurrent, lte: endCurrent } },
      }),
      this.db.transaction.count({
        where: { userId: agentUserId, status: 'final_deed_signed', updatedAt: { gte: startLast, lte: endLast } },
      }),
      this.db.transaction.count({
        where: { userId: agentUserId, status: 'final_deed_signed', updatedAt: { gte: startYTD } },
      }),
      this.db.transaction.count({
        where: { userId: agentUserId, status: { notIn: ['final_deed_signed', 'cancelled'] } },
      }),
    ]);

    // Mandats
    const [mandatesTotal, mandatesExclusive] = await Promise.all([
      this.db.mandate.count({ where: { userId: agentUserId, status: 'active' } }),
      this.db.mandate.count({ where: { userId: agentUserId, status: 'active', type: 'exclusive' } }),
    ]);

    // Prospects
    const [prospectsActive, prospectsConverted] = await Promise.all([
      this.db.prospects.count({ where: { userId: agentUserId, status: 'active' } }),
      this.db.prospects.count({ where: { userId: agentUserId, status: 'converted' } }),
    ]);
    const totalProspects = prospectsActive + prospectsConverted;
    const conversionRate = totalProspects > 0 ? Math.round((prospectsConverted / totalProspects) * 100) : 0;

    // Score de performance (0-100)
    const targetProgress = Math.min(revenueThisMonth / this.AGENT_MONTHLY_TARGET, 1);
    const mandateScore = Math.min(mandatesExclusive / 5, 1); // objectif 5 mandats exclusifs
    const conversionScore = Math.min(conversionRate / 30, 1); // objectif 30% conversion
    const performanceScore = Math.round((targetProgress * 60 + mandateScore * 20 + conversionScore * 20) * 100);

    const trend: 'up' | 'down' | 'stable' =
      revenueThisMonth > revenueLastMonth * 1.05 ? 'up'
      : revenueThisMonth < revenueLastMonth * 0.95 ? 'down'
      : 'stable';

    const targetProgressPercent = Math.round((revenueThisMonth / this.AGENT_MONTHLY_TARGET) * 100);

    return {
      userId: agentUserId,
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      revenueThisMonth,
      revenueLastMonth,
      revenueYTD,
      targetMonthly: this.AGENT_MONTHLY_TARGET,
      targetProgressPercent,
      commissionThisMonth,
      commissionPending,
      commissionPaid,
      transactionsThisMonth: txThisMonth,
      transactionsLastMonth: txLastMonth,
      transactionsYTD: txYTD,
      transactionsPending: txPending,
      mandatesTotal,
      mandatesExclusive,
      mandatesExclusivePercent: mandatesTotal > 0 ? Math.round((mandatesExclusive / mandatesTotal) * 100) : 0,
      prospectsActive,
      prospectsConverted,
      conversionRate,
      performanceScore,
      trend,
    };
  }

  // ─── Dashboard complet de l'agence ───────────────────────────────────────
  async getAgencyDashboard(userId: string, year?: number, month?: number): Promise<AgencyDashboard> {
    const agencyId = await this.getAgencyId(userId);
    if (!agencyId) {
      return this.emptyAgencyDashboard();
    }

    const { year: cy, month: cm } = this.getCurrentPeriod();
    const y = year ?? cy;
    const m = month ?? cm;
    const { start: startCurrent, end: endCurrent } = this.getPeriodBounds(y, m);
    const { start: startLast, end: endLast } = this.getPeriodBounds(
      m === 1 ? y - 1 : y,
      m === 1 ? 12 : m - 1,
    );
    const startYTD = new Date(y, 0, 1);

    // Récupérer les agents de l'agence
    const agents = await this.db.users.findMany({
      where: { agencyId, isActive: true },
      select: { id: true },
    });

    const agentIds = agents.map((a) => a.id);

    // CA agence = toutes les commissions de tous les agents
    const [commissionsThisMonth, commissionsLastMonth, commissionsYTD] = await Promise.all([
      this.db.commission.aggregate({
        where: { agentId: { in: agentIds }, createdAt: { gte: startCurrent, lte: endCurrent } },
        _sum: { amount: true },
      }),
      this.db.commission.aggregate({
        where: { agentId: { in: agentIds }, createdAt: { gte: startLast, lte: endLast } },
        _sum: { amount: true },
      }),
      this.db.commission.aggregate({
        where: { agentId: { in: agentIds }, createdAt: { gte: startYTD } },
        _sum: { amount: true },
      }),
    ]);

    const agencyRevenueThisMonth = commissionsThisMonth._sum.amount ?? 0;
    const agencyRevenueLastMonth = commissionsLastMonth._sum.amount ?? 0;
    const agencyRevenueYTD = commissionsYTD._sum.amount ?? 0;

    // Statut survie
    const survivalStatus =
      agencyRevenueThisMonth >= this.RECOMMENDED_THRESHOLD ? 'safe'
      : agencyRevenueThisMonth >= this.SURVIVAL_THRESHOLD ? 'warning'
      : 'danger';

    // Performances par agent
    const agentPerformances = await Promise.all(
      agentIds.map((id) => this.getAgentPerformance(id, y, m).catch(() => null)),
    );
    const validPerformances = agentPerformances.filter(Boolean) as AgentPerformance[];

    const agentsAboveTarget = validPerformances.filter((a) => a.revenueThisMonth >= this.AGENT_MONTHLY_TARGET).length;
    const agentsBelowTarget = validPerformances.filter((a) => a.revenueThisMonth < this.AGENT_MONTHLY_TARGET).length;
    const topAgent = validPerformances.reduce((best, a) =>
      !best || a.revenueThisMonth > best.revenueThisMonth ? a : best, null as AgentPerformance | null);

    // Transactions pipeline
    const [txTotal, txClosed, txPending] = await Promise.all([
      this.db.transaction.count({ where: { userId: { in: agentIds } } }),
      this.db.transaction.count({ where: { userId: { in: agentIds }, status: 'final_deed_signed' } }),
      this.db.transaction.count({ where: { userId: { in: agentIds }, status: { notIn: ['final_deed_signed', 'cancelled'] } } }),
    ]);

    // Timeline 12 derniers mois
    const revenueTimeline = await this.getRevenueTimeline(agentIds, y);

    // Provision status (si le module est actif — on fait un catch safe)
    let provisionAlertStatus = 'GREEN';
    let provisionThisMonth = 0;
    let provisionDone = false;
    try {
      const provision = await (this.db as any).provisionOccurrence?.findFirst({
        where: { agencyId, periodYear: y, periodMonth: m, status: 'DONE' },
        orderBy: { dueDate: 'desc' },
      });
      const overdueCount = await (this.db as any).provisionOccurrence?.count({
        where: { agencyId, status: 'OVERDUE' },
      }) ?? 0;
      const pendingOverdueCount = await (this.db as any).provisionOccurrence?.count({
        where: { agencyId, status: 'PENDING', dueDate: { lt: new Date() } },
      }) ?? 0;

      provisionDone = !!provision;
      provisionAlertStatus = overdueCount > 0 ? 'RED' : pendingOverdueCount > 0 ? 'ORANGE' : 'GREEN';
      provisionThisMonth = 9000; // 2333 + 6667 pour Firstimmo
    } catch { /* ProvisionModule pas encore migré */ }

    return {
      agencyRevenueThisMonth,
      agencyRevenueLastMonth,
      agencyRevenueYTD,
      survivalThreshold: this.SURVIVAL_THRESHOLD,
      recommendedThreshold: this.RECOMMENDED_THRESHOLD,
      survivalStatus,
      agents: validPerformances,
      agentsAboveTarget,
      agentsBelowTarget,
      topAgent,
      provisionAlertStatus,
      provisionThisMonth,
      provisionDone,
      monthlyTarget: this.AGENCY_MONTHLY_TARGET,
      targetProgressPercent: Math.round((agencyRevenueThisMonth / this.AGENCY_MONTHLY_TARGET) * 100),
      transactionsTotal: txTotal,
      transactionsClosed: txClosed,
      transactionsPending: txPending,
      revenueTimeline,
    };
  }

  // ─── Timeline 12 mois ────────────────────────────────────────────────────
  private async getRevenueTimeline(agentIds: string[], year: number) {
    const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
    const timeline = [];

    for (let m = 1; m <= 12; m++) {
      const { start, end } = this.getPeriodBounds(year, m);
      const result = await this.db.commission.aggregate({
        where: { agentId: { in: agentIds }, createdAt: { gte: start, lte: end } },
        _sum: { amount: true },
      }).catch(() => ({ _sum: { amount: 0 } }));

      timeline.push({
        month: months[m - 1],
        revenue: result._sum.amount ?? 0,
        target: this.AGENCY_MONTHLY_TARGET,
      });
    }

    return timeline;
  }

  private emptyAgencyDashboard(): AgencyDashboard {
    return {
      agencyRevenueThisMonth: 0, agencyRevenueLastMonth: 0, agencyRevenueYTD: 0,
      survivalThreshold: this.SURVIVAL_THRESHOLD, recommendedThreshold: this.RECOMMENDED_THRESHOLD,
      survivalStatus: 'danger', agents: [], agentsAboveTarget: 0, agentsBelowTarget: 0,
      topAgent: null, provisionAlertStatus: 'GREEN', provisionThisMonth: 0, provisionDone: false,
      monthlyTarget: this.AGENCY_MONTHLY_TARGET, targetProgressPercent: 0,
      transactionsTotal: 0, transactionsClosed: 0, transactionsPending: 0,
      revenueTimeline: [],
    };
  }
}
