import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Statistiques globales
   */
  async getStats(userId: string) {
    try {
      const [
        activeProspects,
        availableProperties,
        todayAppointments,
        totalMatches,
        activeCampaigns,
        pendingTasks,
        totalCommunications,
      ] = await Promise.all([
        this.prisma.prospects.count({ where: { userId, status: 'active' } }).catch(() => 0),
        this.prisma.properties.count({ where: { userId, status: 'available' } }).catch(() => 0),
        this.prisma.appointments
          .count({
            where: {
              userId,
              startTime: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lt: new Date(new Date().setHours(23, 59, 59, 999)),
              },
            },
          })
          .catch(() => 0),
        this.prisma.matches
          .count({
            where: {
              properties: { userId },
              status: 'pending',
            },
          })
          .catch(() => 0),
        this.prisma.prospecting_campaigns
          .count({
            where: { userId, status: 'active' },
          })
          .catch(() => 0),
        this.prisma.tasks
          .count({
            where: { userId, status: { in: ['todo', 'in_progress'] } },
          })
          .catch(() => 0),
        this.prisma.communications.count({ where: { userId } }).catch(() => 0),
      ]);

      const conversionRate = await this.calculateConversionRate(userId).catch(() => 0);
      const matchSuccessRate = await this.calculateMatchSuccessRate(userId).catch(() => 0);

      return {
        activeProspects,
        availableProperties,
        todayAppointments,
        totalMatches,
        activeCampaigns,
        pendingTasks,
        totalCommunications,
        conversionRate: Math.round(conversionRate * 10) / 10,
        matchSuccessRate: Math.round(matchSuccessRate * 10) / 10,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default values if there's an error
      return {
        activeProspects: 0,
        availableProperties: 0,
        todayAppointments: 0,
        totalMatches: 0,
        activeCampaigns: 0,
        pendingTasks: 0,
        totalCommunications: 0,
        conversionRate: 0,
        matchSuccessRate: 0,
      };
    }
  }

  /**
   * Graphiques pour le dashboard
   */
  async getCharts(userId: string) {
    const prospectsChart = await this.getProspectsChart(userId);
    const propertiesChart = await this.getPropertiesChart(userId);
    const appointmentsChart = await this.getAppointmentsChart(userId);
    const communicationsChart = await this.getCommunicationsChart(userId);

    return {
      prospects: prospectsChart,
      properties: propertiesChart,
      appointments: appointmentsChart,
      communications: communicationsChart,
    };
  }

  /**
   * Activités récentes
   */
  async getRecentActivities(userId: string) {
    const [recentProspects, recentProperties, recentAppointments, recentComms] = await Promise.all([
      this.prisma.prospects.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          status: true,
        },
      }),
      this.prisma.properties.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true,
          price: true,
          status: true,
        },
      }),
      this.prisma.appointments.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          startTime: true,
          status: true,
        },
      }),
      this.prisma.communications.findMany({
        where: { userId },
        orderBy: { sentAt: 'desc' },
        take: 5,
        select: {
          id: true,
          type: true,
          to: true,
          subject: true,
          sentAt: true,
          status: true,
        },
      }),
    ]);

    return {
      recentProspects,
      recentProperties,
      recentAppointments,
      recentCommunications: recentComms,
    };
  }

  /**
   * Top performers
   */
  async getTopPerformers(userId: string) {
    const [topProperties, topProspects, topMatches] = await Promise.all([
      this.prisma.properties.findMany({
        where: { userId },
        orderBy: { viewsCount: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          price: true,
          viewsCount: true,
          _count: {
            select: { matches: true },
          },
        },
      }),
      this.prisma.prospects.findMany({
        where: { userId, status: 'active' },
        orderBy: { score: 'desc' },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          score: true,
          budget: true,
        },
      }),
      this.prisma.matches.findMany({
        where: {
          properties: { userId },
          status: 'accepted',
        },
        orderBy: { score: 'desc' },
        take: 5,
        include: {
          properties: {
            select: { title: true },
          },
          prospects: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
    ]);

    return {
      topProperties,
      topProspects,
      topMatches,
    };
  }

  /**
   * Alertes et notifications
   */
  async getAlerts(userId: string) {
    const [overdueTasks, upcomingAppointments, lowStockProperties, unmatchedProspects] =
      await Promise.all([
        this.prisma.tasks.count({
          where: {
            userId,
            status: { in: ['todo', 'in_progress'] },
            dueDate: { lt: new Date() },
          },
        }),
        this.prisma.appointments.count({
          where: {
            userId,
            startTime: {
              gte: new Date(),
              lt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          },
        }),
        this.prisma.properties.count({
          where: { userId, status: 'available', viewsCount: { lt: 5 } },
        }),
        this.prisma.prospects.count({
          where: {
            userId,
            status: 'active',
            matches: { none: {} },
          },
        }),
      ]);

    const alerts = [];

    if (overdueTasks > 0) {
      alerts.push({
        type: 'warning',
        message: `${overdueTasks} tâche(s) en retard`,
        action: '/tasks?status=overdue',
      });
    }

    if (upcomingAppointments > 0) {
      alerts.push({
        type: 'info',
        message: `${upcomingAppointments} rendez-vous dans les 24h`,
        action: '/appointments?upcoming=true',
      });
    }

    if (unmatchedProspects > 10) {
      alerts.push({
        type: 'warning',
        message: `${unmatchedProspects} prospects sans match`,
        action: '/matching/generate',
      });
    }

    return { alerts, counts: { overdueTasks, upcomingAppointments, unmatchedProspects } };
  }

  // ============================================
  // HELPERS
  // ============================================

  private async calculateConversionRate(userId: string): Promise<number> {
    const total = await this.prisma.prospects.count({ where: { userId } });
    const converted = await this.prisma.prospects.count({
      where: { userId, status: 'converted' },
    });
    return total > 0 ? (converted / total) * 100 : 0;
  }

  private async calculateMatchSuccessRate(userId: string): Promise<number> {
    const total = await this.prisma.matches.count({
      where: { properties: { userId } },
    });
    const accepted = await this.prisma.matches.count({
      where: { properties: { userId }, status: 'accepted' },
    });
    return total > 0 ? (accepted / total) * 100 : 0;
  }

  private async getProspectsChart(userId: string) {
    const data = await this.prisma.prospects.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });

    return {
      labels: data.map((d) => d.status),
      values: data.map((d) => d._count),
    };
  }

  private async getPropertiesChart(userId: string) {
    const data = await this.prisma.properties.groupBy({
      by: ['type'],
      where: { userId },
      _count: true,
    });

    return {
      labels: data.map((d) => d.type),
      values: data.map((d) => d._count),
    };
  }

  private async getAppointmentsChart(userId: string) {
    const data = await this.prisma.appointments.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });

    return {
      labels: data.map((d) => d.status),
      values: data.map((d) => d._count),
    };
  }

  private async getCommunicationsChart(userId: string) {
    const data = await this.prisma.communications.groupBy({
      by: ['type'],
      where: { userId },
      _count: true,
    });

    return {
      labels: data.map((d) => d.type),
      values: data.map((d) => d._count),
    };
  }
}
