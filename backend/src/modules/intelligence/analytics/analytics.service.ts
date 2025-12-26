import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Dashboard global - Vue d'ensemble
   */
  async getDashboard(userId: string) {
    const [
      prospectsStats,
      propertiesStats,
      communicationsStats,
      appointmentsStats,
      tasksStats,
      recentActivity,
    ] = await Promise.all([
      this.getProspectsStats(userId),
      this.getPropertiesStats(userId),
      this.getCommunicationsStats(userId),
      this.getAppointmentsStats(userId),
      this.getTasksStats(userId),
      this.getRecentActivity(userId),
    ]);

    return {
      prospects: prospectsStats,
      properties: propertiesStats,
      communications: communicationsStats,
      appointments: appointmentsStats,
      tasks: tasksStats,
      recentActivity,
    };
  }

  /**
   * Stats Prospects
   */
  async getProspectsStats(userId: string) {
    const [total, active, converted, thisMonth] = await Promise.all([
      this.prisma.prospects.count({ where: { userId } }),
      this.prisma.prospects.count({
        where: { userId, status: { in: ['new', 'contacted', 'qualified'] } },
      }),
      this.prisma.prospects.count({
        where: { userId, status: 'converted' },
      }),
      this.prisma.prospects.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    // Get status counts using raw query since groupBy is not available in wrapper
    const byStatusResult = await this.prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
      SELECT status, COUNT(*)::int as count
      FROM prospects
      WHERE "userId" = ${userId}
      GROUP BY status
    `;

    const byStatus = byStatusResult.map((s) => ({
      status: s.status,
      count: Number(s.count),
    }));

    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    return {
      total,
      active,
      converted,
      thisMonth,
      conversionRate,
      byStatus,
    };
  }

  /**
   * Stats Biens
   */
  async getPropertiesStats(userId: string) {
    const [total, available, sold, rented, avgPrice, byType] = await Promise.all([
      this.prisma.properties.count({ where: { userId } }),
      this.prisma.properties.count({
        where: { userId, status: 'available' },
      }),
      this.prisma.properties.count({
        where: { userId, status: 'sold' },
      }),
      this.prisma.properties.count({
        where: { userId, status: 'rented' },
      }),
      this.prisma.properties.aggregate({
        where: { userId },
        _avg: { price: true },
      }),
      (async () => {
        const result = await this.prisma.$queryRaw<Array<{ type: string; count: bigint }>>`
          SELECT type, COUNT(*)::int as count
          FROM properties
          WHERE "userId" = ${userId}
          GROUP BY type
        `;
        return result.map((r) => ({ type: r.type, _count: Number(r.count) }));
      })(),
    ]);

    return {
      total,
      available,
      sold,
      rented,
      avgPrice: Math.round(avgPrice._avg.price || 0),
      byType: byType.map((t) => ({
        type: t.type,
        count: t._count,
      })),
    };
  }

  /**
   * Stats Communications
   */
  async getCommunicationsStats(userId: string) {
    const [total, sent, failed, thisWeek, byType] = await Promise.all([
      this.prisma.communications.count({ where: { userId } }),
      this.prisma.communications.count({
        where: { userId, status: 'sent' },
      }),
      this.prisma.communications.count({
        where: { userId, status: 'failed' },
      }),
      this.prisma.communications.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      (async () => {
        const result = await this.prisma.$queryRaw<Array<{ type: string; count: bigint }>>`
          SELECT type, COUNT(*)::int as count
          FROM communications
          WHERE "userId" = ${userId}
          GROUP BY type
        `;
        return result.map((r) => ({ type: r.type, _count: Number(r.count) }));
      })(),
    ]);

    return {
      total,
      sent,
      failed,
      thisWeek,
      byType: byType.map((c) => ({
        type: c.type,
        count: c._count,
      })),
    };
  }

  /**
   * Stats Rendez-vous
   */
  async getAppointmentsStats(userId: string) {
    const now = new Date();
    const [total, upcoming, today, thisWeek, byType] = await Promise.all([
      this.prisma.appointments.count({ where: { userId } }),
      this.prisma.appointments.count({
        where: {
          userId,
          startTime: { gte: now },
          status: { in: ['scheduled', 'confirmed'] },
        },
      }),
      this.prisma.appointments.count({
        where: {
          userId,
          startTime: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
        },
      }),
      this.prisma.appointments.count({
        where: {
          userId,
          startTime: {
            gte: now,
            lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      (async () => {
        const result = await this.prisma.$queryRaw<Array<{ type: string; count: bigint }>>`
          SELECT type, COUNT(*)::int as count
          FROM appointments
          WHERE "userId" = ${userId}
          GROUP BY type
        `;
        return result.map((r) => ({ type: r.type, _count: Number(r.count) }));
      })(),
    ]);

    return {
      total,
      upcoming,
      today,
      thisWeek,
      byType: byType.map((t) => ({
        type: t.type,
        count: t._count,
      })),
    };
  }

  /**
   * Stats Tâches
   */
  async getTasksStats(userId: string) {
    const [total, todo, inProgress, done, overdue] = await Promise.all([
      this.prisma.tasks.count({ where: { userId } }),
      this.prisma.tasks.count({ where: { userId, status: 'todo' } }),
      this.prisma.tasks.count({ where: { userId, status: 'in_progress' } }),
      this.prisma.tasks.count({ where: { userId, status: 'done' } }),
      this.prisma.tasks.count({
        where: {
          userId,
          status: { in: ['todo', 'in_progress'] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    return {
      total,
      todo,
      inProgress,
      done,
      overdue,
      completionRate,
    };
  }

  /**
   * Activité récente
   */
  async getRecentActivity(userId: string, limit = 10) {
    const [prospects, properties, communications, appointments] = await Promise.all([
      this.prisma.prospects.findMany({
        where: { userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      this.prisma.properties.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      this.prisma.communications.findMany({
        where: { userId },
        select: {
          id: true,
          subject: true,
          type: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      this.prisma.appointments.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          startTime: true,
        },
        orderBy: { startTime: 'desc' },
        take: 3,
      }),
    ]);

    const activity = [
      ...prospects.map((p) => ({
        type: 'prospect',
        title: `${p.firstName} ${p.lastName}`,
        timestamp: p.createdAt,
      })),
      ...properties.map((p) => ({
        type: 'property',
        title: p.title,
        timestamp: p.createdAt,
      })),
      ...communications.map((c) => ({
        type: 'communication',
        title: c.subject || c.type,
        timestamp: c.createdAt,
      })),
      ...appointments.map((a) => ({
        type: 'appointment',
        title: a.title,
        timestamp: a.startTime,
      })),
    ];

    return activity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }

  /**
   * Tendances temporelles
   */
  async getTrends(userId: string, period: 'week' | 'month' | 'year') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const [prospects, properties, communications] = await Promise.all([
      this.prisma.prospects.count({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.properties.count({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.communications.count({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
      }),
    ]);

    return {
      period,
      startDate,
      endDate: now,
      prospects,
      properties,
      communications,
    };
  }

  /**
   * KPIs principaux
   */
  async getKPIs(userId: string) {
    const [prospectsStats, propertiesStats, revenue] = await Promise.all([
      this.getProspectsStats(userId),
      this.getPropertiesStats(userId),
      this.calculateRevenue(userId),
    ]);

    return {
      totalProspects: prospectsStats.total,
      conversionRate: prospectsStats.conversionRate,
      totalProperties: propertiesStats.total,
      availableProperties: propertiesStats.available,
      avgPropertyPrice: propertiesStats.avgPrice,
      totalRevenue: revenue,
    };
  }

  /**
   * Calculer le revenu (simplifié)
   */
  private async calculateRevenue(userId: string) {
    const soldProperties = await this.prisma.properties.findMany({
      where: {
        userId,
        status: 'sold',
      },
      select: {
        price: true,
      },
    });

    return soldProperties.reduce((sum, p) => sum + (p.price || 0), 0);
  }

  /**
   * Logger un événement analytics
   */
  async logEvent(userId: string, eventType: string, eventName: string, metadata?: any) {
    return this.prisma.analytics_events.create({
      data: {
        userId,
        eventType,
        eventName,
        metadata,
      },
    });
  }
}
