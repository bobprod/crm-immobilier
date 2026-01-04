import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { TrackingPlatform } from '../dto/tracking.dto';

@Injectable()
export class TrackingAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getRealTimeEvents(userId: string, limit = 20) {
    return this.prisma.trackingEvent.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        eventName: true,
        platform: true,
        data: true,
        timestamp: true,
        conversionProbability: true,
        leadScore: true,
      },
    });
  }

  async getEventsByPlatform(userId: string, period: 'day' | 'week' | 'month' = 'week') {
    const startDate = this.getStartDate(period);

    const events = await this.prisma.trackingEvent.groupBy({
      by: ['platform'],
      where: {
        userId,
        timestamp: { gte: startDate },
      },
      _count: true,
    });

    return events.reduce((acc, item) => {
      acc[item.platform] = item._count;
      return acc;
    }, {} as Record<string, number>);
  }

  async getEventsByType(userId: string, period: 'day' | 'week' | 'month' = 'week') {
    const startDate = this.getStartDate(period);

    const events = await this.prisma.trackingEvent.groupBy({
      by: ['eventName'],
      where: {
        userId,
        timestamp: { gte: startDate },
      },
      _count: true,
    });

    return events.reduce((acc, item) => {
      acc[item.eventName] = item._count;
      return acc;
    }, {} as Record<string, number>);
  }

  async getConversionRate(userId: string, period: 'day' | 'week' | 'month' = 'week') {
    const startDate = this.getStartDate(period);

    const [totalEvents, conversionEvents] = await Promise.all([
      this.prisma.trackingEvent.count({
        where: { userId, timestamp: { gte: startDate } },
      }),
      this.prisma.trackingEvent.count({
        where: {
          userId,
          timestamp: { gte: startDate },
          eventName: { in: ['Lead', 'CompleteRegistration', 'Purchase', 'Schedule'] },
        },
      }),
    ]);

    return totalEvents > 0 ? (conversionEvents / totalEvents) * 100 : 0;
  }

  async getTopEvents(userId: string, period: 'day' | 'week' | 'month' = 'week', limit = 5) {
    const startDate = this.getStartDate(period);

    const events = await this.prisma.trackingEvent.groupBy({
      by: ['eventName'],
      where: {
        userId,
        timestamp: { gte: startDate },
      },
      _count: true,
      orderBy: {
        _count: {
          eventName: 'desc',
        },
      },
      take: limit,
    });

    return Promise.all(
      events.map(async (event) => {
        const conversionCount = await this.prisma.trackingEvent.count({
          where: {
            userId,
            eventName: event.eventName,
            timestamp: { gte: startDate },
            eventName: { in: ['Lead', 'Purchase', 'Schedule'] },
          },
        });

        return {
          eventName: event.eventName,
          count: event._count,
          conversionRate: event._count > 0 ? (conversionCount / event._count) * 100 : 0,
        };
      })
    );
  }

  async getPlatformPerformance(userId: string, period: 'day' | 'week' | 'month' = 'week') {
    const startDate = this.getStartDate(period);

    const platforms = Object.values(TrackingPlatform);

    return Promise.all(
      platforms.map(async (platform) => {
        const [totalEvents, successfulEvents, failedEvents] = await Promise.all([
          this.prisma.trackingEvent.count({
            where: { userId, platform, timestamp: { gte: startDate } },
          }),
          this.prisma.trackingEvent.count({
            where: {
              userId,
              platform,
              timestamp: { gte: startDate },
              data: { path: ['status'], equals: 'success' },
            },
          }),
          this.prisma.trackingEvent.count({
            where: {
              userId,
              platform,
              timestamp: { gte: startDate },
              data: { path: ['status'], equals: 'failed' },
            },
          }),
        ]);

        const deliveryRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0;

        return {
          platform,
          totalEvents,
          successfulEvents,
          failedEvents,
          deliveryRate,
        };
      })
    );
  }

  async getTimelineData(userId: string, period: 'day' | 'week' | 'month' = 'week') {
    const startDate = this.getStartDate(period);
    const intervals = this.getTimeIntervals(period);

    return Promise.all(
      intervals.map(async (interval) => {
        const count = await this.prisma.trackingEvent.count({
          where: {
            userId,
            timestamp: {
              gte: interval.start,
              lt: interval.end,
            },
          },
        });

        return {
          timestamp: interval.start,
          count,
        };
      })
    );
  }

  private getStartDate(period: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  private getTimeIntervals(period: 'day' | 'week' | 'month') {
    const now = new Date();
    const intervals: { start: Date; end: Date }[] = [];

    let intervalCount: number;
    let intervalDuration: number;

    switch (period) {
      case 'day':
        intervalCount = 24;
        intervalDuration = 60 * 60 * 1000; // 1 hour
        break;
      case 'week':
        intervalCount = 7;
        intervalDuration = 24 * 60 * 60 * 1000; // 1 day
        break;
      case 'month':
        intervalCount = 30;
        intervalDuration = 24 * 60 * 60 * 1000; // 1 day
        break;
    }

    for (let i = intervalCount - 1; i >= 0; i--) {
      const end = new Date(now.getTime() - i * intervalDuration);
      const start = new Date(end.getTime() - intervalDuration);
      intervals.push({ start, end });
    }

    return intervals;
  }
}
