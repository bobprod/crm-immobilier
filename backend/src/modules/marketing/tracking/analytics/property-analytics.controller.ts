import { Controller, Get, Query, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/core/auth/guards/jwt-auth.guard';
import { PrismaService } from '@/shared/database/prisma.service';

@ApiTags('Property Analytics')
@Controller('marketing-tracking/property-analytics')
export class PropertyAnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('top-properties')
  @ApiOperation({ summary: 'Get top properties by views, time spent, and conversions' })
  async getTopProperties(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('period') period?: 'day' | 'week' | 'month',
  ) {
    const limitNum = parseInt(limit || '10', 10);
    const startDate = this.getStartDate(period || 'week');

    // Récupérer tous les événements de propriétés
    const events = await this.prisma.trackingEvent.findMany({
      where: {
        userId: req.user.userId,
        timestamp: { gte: startDate },
        eventName: {
          in: ['PropertyImpression', 'PropertyTimeSpent', 'PropertyButtonClick', 'Lead'],
        },
      },
      select: {
        eventName: true,
        data: true,
        timestamp: true,
      },
    });

    // Grouper par propertyId
    const propertiesMap = new Map<
      string,
      {
        propertyId: string;
        propertyData: any;
        impressions: number;
        totalTimeSpent: number;
        buttonClicks: number;
        leads: number;
        lastSeen: Date;
      }
    >();

    for (const event of events) {
      const data = event.data as any;
      const propertyId = data?.propertyId;

      if (!propertyId) continue;

      if (!propertiesMap.has(propertyId)) {
        propertiesMap.set(propertyId, {
          propertyId,
          propertyData: data?.propertyData || {},
          impressions: 0,
          totalTimeSpent: 0,
          buttonClicks: 0,
          leads: 0,
          lastSeen: event.timestamp,
        });
      }

      const property = propertiesMap.get(propertyId)!;

      if (event.eventName === 'PropertyImpression') {
        property.impressions++;
      } else if (event.eventName === 'PropertyTimeSpent') {
        property.totalTimeSpent += data?.timeSpentSeconds || 0;
      } else if (event.eventName === 'PropertyButtonClick') {
        property.buttonClicks++;
      } else if (event.eventName === 'Lead') {
        property.leads++;
      }

      if (event.timestamp > property.lastSeen) {
        property.lastSeen = event.timestamp;
      }
    }

    // Convertir en array et calculer les métriques
    const propertiesArray = Array.from(propertiesMap.values()).map((p) => ({
      ...p,
      averageTimeSpent: p.impressions > 0 ? p.totalTimeSpent / p.impressions : 0,
      clickThroughRate: p.impressions > 0 ? (p.buttonClicks / p.impressions) * 100 : 0,
      conversionRate: p.impressions > 0 ? (p.leads / p.impressions) * 100 : 0,
    }));

    // Trier et limiter
    const topByViews = [...propertiesArray]
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, limitNum);

    const topByConversion = [...propertiesArray]
      .filter((p) => p.impressions >= 5) // Minimum 5 vues pour être pertinent
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, limitNum);

    const topByTimeSpent = [...propertiesArray]
      .sort((a, b) => b.averageTimeSpent - a.averageTimeSpent)
      .slice(0, limitNum);

    const topByEngagement = [...propertiesArray]
      .sort((a, b) => b.clickThroughRate - a.clickThroughRate)
      .slice(0, limitNum);

    return {
      period,
      totalProperties: propertiesArray.length,
      topByViews,
      topByConversion,
      topByTimeSpent,
      topByEngagement,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('property/:propertyId/stats')
  @ApiOperation({ summary: 'Get detailed stats for a specific property' })
  async getPropertyStats(@Request() req, @Param('propertyId') propertyId: string) {
    const events = await this.prisma.trackingEvent.findMany({
      where: {
        userId: req.user.userId,
        eventName: {
          in: ['PropertyImpression', 'PropertyTimeSpent', 'PropertyButtonClick', 'Lead'],
        },
      },
      select: {
        eventName: true,
        data: true,
        timestamp: true,
      },
    });

    // Filtrer les événements pour cette propriété
    const propertyEvents = events.filter((e) => {
      const data = e.data as any;
      return data?.propertyId === propertyId;
    });

    if (propertyEvents.length === 0) {
      return {
        propertyId,
        found: false,
        message: 'No data found for this property',
      };
    }

    // Calculer les stats
    const impressions = propertyEvents.filter((e) => e.eventName === 'PropertyImpression').length;

    const timeSpentEvents = propertyEvents.filter((e) => e.eventName === 'PropertyTimeSpent');
    const totalTimeSpent = timeSpentEvents.reduce((sum, e) => {
      const data = e.data as any;
      return sum + (data?.timeSpentSeconds || 0);
    }, 0);

    const buttonClicks = propertyEvents.filter((e) => e.eventName === 'PropertyButtonClick');
    const leads = propertyEvents.filter((e) => e.eventName === 'Lead').length;

    // Grouper les clics par type de bouton
    const buttonClicksByType = new Map<string, number>();
    for (const event of buttonClicks) {
      const data = event.data as any;
      const buttonType = data?.buttonType || 'other';
      buttonClicksByType.set(buttonType, (buttonClicksByType.get(buttonType) || 0) + 1);
    }

    // Récupérer les données de la propriété
    const propertyData = (propertyEvents[0].data as any)?.propertyData || {};

    return {
      propertyId,
      found: true,
      propertyData,
      stats: {
        impressions,
        totalTimeSpent,
        averageTimeSpent: impressions > 0 ? totalTimeSpent / impressions : 0,
        buttonClicks: buttonClicks.length,
        leads,
        clickThroughRate: impressions > 0 ? (buttonClicks.length / impressions) * 100 : 0,
        conversionRate: impressions > 0 ? (leads / impressions) * 100 : 0,
      },
      buttonClicksByType: Array.from(buttonClicksByType.entries()).map(([type, count]) => ({
        buttonType: type,
        clicks: count,
        percentage: buttonClicks.length > 0 ? (count / buttonClicks.length) * 100 : 0,
      })),
      timeline: this.generateTimeline(propertyEvents),
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('buttons-stats')
  @ApiOperation({ summary: 'Get global button click statistics' })
  async getButtonsStats(
    @Request() req,
    @Query('period') period?: 'day' | 'week' | 'month',
  ) {
    const startDate = this.getStartDate(period || 'week');

    const buttonEvents = await this.prisma.trackingEvent.findMany({
      where: {
        userId: req.user.userId,
        timestamp: { gte: startDate },
        eventName: 'PropertyButtonClick',
      },
      select: {
        data: true,
      },
    });

    // Grouper par type de bouton
    const buttonTypeStats = new Map<
      string,
      {
        type: string;
        clicks: number;
        properties: Set<string>;
      }
    >();

    for (const event of buttonEvents) {
      const data = event.data as any;
      const buttonType = data?.buttonType || 'other';
      const propertyId = data?.propertyId;

      if (!buttonTypeStats.has(buttonType)) {
        buttonTypeStats.set(buttonType, {
          type: buttonType,
          clicks: 0,
          properties: new Set(),
        });
      }

      const stats = buttonTypeStats.get(buttonType)!;
      stats.clicks++;
      if (propertyId) {
        stats.properties.add(propertyId);
      }
    }

    const totalClicks = buttonEvents.length;

    return {
      period,
      totalClicks,
      buttonTypes: Array.from(buttonTypeStats.entries())
        .map(([type, stats]) => ({
          buttonType: type,
          clicks: stats.clicks,
          uniqueProperties: stats.properties.size,
          percentage: totalClicks > 0 ? (stats.clicks / totalClicks) * 100 : 0,
        }))
        .sort((a, b) => b.clicks - a.clicks),
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('global-stats')
  @ApiOperation({ summary: 'Get global property analytics statistics' })
  async getGlobalStats(
    @Request() req,
    @Query('period') period?: 'day' | 'week' | 'month',
  ) {
    const startDate = this.getStartDate(period || 'week');

    const events = await this.prisma.trackingEvent.findMany({
      where: {
        userId: req.user.userId,
        timestamp: { gte: startDate },
        eventName: {
          in: ['PropertyImpression', 'PropertyTimeSpent', 'PropertyButtonClick', 'Lead'],
        },
      },
      select: {
        eventName: true,
        data: true,
      },
    });

    const impressions = events.filter((e) => e.eventName === 'PropertyImpression').length;
    const buttonClicks = events.filter((e) => e.eventName === 'PropertyButtonClick').length;
    const leads = events.filter((e) => e.eventName === 'Lead').length;

    const timeSpentEvents = events.filter((e) => e.eventName === 'PropertyTimeSpent');
    const totalTimeSpent = timeSpentEvents.reduce((sum, e) => {
      const data = e.data as any;
      return sum + (data?.timeSpentSeconds || 0);
    }, 0);

    // Compter les propriétés uniques
    const uniqueProperties = new Set<string>();
    events.forEach((e) => {
      const data = e.data as any;
      if (data?.propertyId) {
        uniqueProperties.add(data.propertyId);
      }
    });

    return {
      period,
      totalImpressions: impressions,
      totalButtonClicks: buttonClicks,
      totalLeads: leads,
      totalTimeSpent,
      averageTimeSpent: impressions > 0 ? totalTimeSpent / impressions : 0,
      uniquePropertiesViewed: uniqueProperties.size,
      globalClickThroughRate: impressions > 0 ? (buttonClicks / impressions) * 100 : 0,
      globalConversionRate: impressions > 0 ? (leads / impressions) * 100 : 0,
    };
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
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private generateTimeline(events: any[]): any[] {
    // Grouper par jour
    const dayGroups = new Map<string, { impressions: number; clicks: number; leads: number }>();

    for (const event of events) {
      const date = new Date(event.timestamp);
      const dayKey = date.toISOString().split('T')[0];

      if (!dayGroups.has(dayKey)) {
        dayGroups.set(dayKey, { impressions: 0, clicks: 0, leads: 0 });
      }

      const day = dayGroups.get(dayKey)!;

      if (event.eventName === 'PropertyImpression') {
        day.impressions++;
      } else if (event.eventName === 'PropertyButtonClick') {
        day.clicks++;
      } else if (event.eventName === 'Lead') {
        day.leads++;
      }
    }

    return Array.from(dayGroups.entries())
      .map(([date, stats]) => ({
        date,
        ...stats,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
