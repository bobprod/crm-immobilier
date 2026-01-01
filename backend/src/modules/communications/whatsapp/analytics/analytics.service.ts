import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import {
  AnalyticsPeriodDto,
  AnalyticsMetricsDto,
  AnalyticsChartDataDto,
  TemplatePerformanceDto,
  ConversationStatsDto,
  AnalyticsReportDto,
  ExportFormat,
  ExportResultDto,
} from './dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get analytics metrics for a period
   */
  async getMetrics(
    userId: string,
    period: AnalyticsPeriodDto,
  ): Promise<AnalyticsMetricsDto> {
    this.logger.log(
      `Getting metrics for user ${userId} from ${period.start} to ${period.end}`,
    );

    const config = await this.getConfig(userId);

    const startDate = new Date(period.start);
    const endDate = new Date(period.end);

    // Get all data in parallel
    const [messages, conversations, templates] = await Promise.all([
      this.getMessagesMetrics(config.id, startDate, endDate),
      this.getConversationsMetrics(config.id, startDate, endDate),
      this.getTemplatesMetrics(config.id, startDate, endDate),
    ]);

    // Calculate engagement metrics
    const engagement = this.calculateEngagementMetrics(messages);

    return {
      messages,
      conversations,
      templates,
      engagement,
    };
  }

  /**
   * Get chart data for time series
   */
  async getChartData(
    userId: string,
    period: AnalyticsPeriodDto,
  ): Promise<AnalyticsChartDataDto> {
    this.logger.log(
      `Getting chart data for user ${userId} from ${period.start} to ${period.end}`,
    );

    const config = await this.getConfig(userId);

    const startDate = new Date(period.start);
    const endDate = new Date(period.end);

    // Generate time series data
    const [messages, conversations, responseTime] = await Promise.all([
      this.getMessagesTimeSeries(config.id, startDate, endDate),
      this.getConversationsTimeSeries(config.id, startDate, endDate),
      this.getResponseTimeTimeSeries(config.id, startDate, endDate),
    ]);

    return {
      messages,
      conversations,
      responseTime,
    };
  }

  /**
   * Get template performance
   */
  async getTemplatePerformance(
    userId: string,
    period: AnalyticsPeriodDto,
  ): Promise<TemplatePerformanceDto[]> {
    this.logger.log(
      `Getting template performance for user ${userId}`,
    );

    const config = await this.getConfig(userId);

    const startDate = new Date(period.start);
    const endDate = new Date(period.end);

    // Get all templates with stats
    const templates = await this.prisma.whatsAppTemplate.findMany({
      where: {
        configId: config.id,
        createdAt: {
          lte: endDate,
        },
      },
      select: {
        id: true,
        name: true,
        sentCount: true,
        deliveredCount: true,
        readCount: true,
        failedCount: true,
      },
    });

    return templates.map((t) => ({
      templateId: t.id,
      templateName: t.name,
      sent: t.sentCount,
      delivered: t.deliveredCount,
      read: t.readCount,
      failed: t.failedCount,
      successRate:
        t.sentCount > 0
          ? Math.round(((t.sentCount - t.failedCount) / t.sentCount) * 100)
          : 0,
      readRate:
        t.deliveredCount > 0
          ? Math.round((t.readCount / t.deliveredCount) * 100)
          : 0,
    }));
  }

  /**
   * Get conversation stats by hour
   */
  async getConversationStatsByHour(
    userId: string,
    period: AnalyticsPeriodDto,
  ): Promise<ConversationStatsDto[]> {
    this.logger.log(
      `Getting conversation stats by hour for user ${userId}`,
    );

    const config = await this.getConfig(userId);

    const startDate = new Date(period.start);
    const endDate = new Date(period.end);

    // Get conversations grouped by hour
    const conversations = await this.prisma.whatsAppConversation.findMany({
      where: {
        configId: config.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by hour
    const hourCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = 0;
    }

    conversations.forEach((conv) => {
      const hour = conv.createdAt.getHours();
      hourCounts[hour]++;
    });

    return Object.entries(hourCounts).map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
    }));
  }

  /**
   * Generate analytics report
   */
  async generateReport(
    userId: string,
    period: AnalyticsPeriodDto,
  ): Promise<AnalyticsReportDto> {
    this.logger.log(`Generating report for user ${userId}`);

    const [metrics, charts, templates] = await Promise.all([
      this.getMetrics(userId, period),
      this.getChartData(userId, period),
      this.getTemplatePerformance(userId, period),
    ]);

    return {
      id: `report-${Date.now()}`,
      period,
      metrics,
      charts,
      templates,
      generatedAt: new Date(),
    };
  }

  /**
   * Export report in specified format
   */
  async exportReport(
    userId: string,
    period: AnalyticsPeriodDto,
    format: ExportFormat,
  ): Promise<ExportResultDto> {
    this.logger.log(`Exporting report for user ${userId} in ${format} format`);

    const report = await this.generateReport(userId, period);

    // Generate export based on format
    let data: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case ExportFormat.JSON:
        data = Buffer.from(JSON.stringify(report, null, 2)).toString('base64');
        filename = `whatsapp-analytics-${Date.now()}.json`;
        mimeType = 'application/json';
        break;

      case ExportFormat.CSV:
        data = this.generateCSV(report);
        filename = `whatsapp-analytics-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;

      default:
        // Default to JSON
        data = Buffer.from(JSON.stringify(report, null, 2)).toString('base64');
        filename = `whatsapp-analytics-${Date.now()}.json`;
        mimeType = 'application/json';
    }

    return { data, filename, mimeType };
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE HELPER METHODS
  // ═══════════════════════════════════════════════════════════════

  private async getConfig(userId: string) {
    const config = await this.prisma.whatsAppConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException('WhatsApp configuration not found');
    }

    return config;
  }

  private async getMessagesMetrics(
    configId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const messages = await this.prisma.whatsAppMessage.findMany({
      where: {
        conversation: { configId },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        direction: true,
        status: true,
        sentAt: true,
        deliveredAt: true,
        readAt: true,
      },
    });

    const total = messages.length;
    const sent = messages.filter((m) => m.direction === 'outbound').length;
    const received = messages.filter((m) => m.direction === 'inbound').length;
    const delivered = messages.filter((m) => m.deliveredAt).length;
    const read = messages.filter((m) => m.readAt).length;
    const failed = messages.filter((m) => m.status === 'failed').length;

    // Calculate average response time
    const responseTimes = messages
      .filter((m) => m.sentAt && m.readAt)
      .map((m) => {
        const diff = m.readAt!.getTime() - m.sentAt!.getTime();
        return diff / 60000; // Convert to minutes
      });

    const avgResponseTime =
      responseTimes.length > 0
        ? Math.round(
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
          )
        : 0;

    return {
      total,
      sent,
      received,
      delivered,
      read,
      failed,
      avgResponseTime,
    };
  }

  private async getConversationsMetrics(
    configId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const conversations = await this.prisma.whatsAppConversation.findMany({
      where: {
        configId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        status: true,
        createdAt: true,
        lastMessageAt: true,
      },
    });

    const total = conversations.length;
    const active = conversations.filter((c) => c.status === 'active').length;
    const closed = conversations.filter((c) => c.status === 'closed').length;
    const newConv = total;

    // Calculate average duration
    const durations = conversations
      .filter((c) => c.lastMessageAt)
      .map((c) => {
        const diff = c.lastMessageAt!.getTime() - c.createdAt.getTime();
        return diff / 3600000; // Convert to hours
      });

    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

    return {
      total,
      active,
      new: newConv,
      closed,
      avgDuration,
    };
  }

  private async getTemplatesMetrics(
    configId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const templates = await this.prisma.whatsAppTemplate.findMany({
      where: {
        configId,
        createdAt: {
          lte: endDate,
        },
      },
      select: {
        name: true,
        sentCount: true,
        deliveredCount: true,
        failedCount: true,
      },
    });

    const total = templates.length;
    const used = templates.filter((t) => t.sentCount > 0).length;

    // Calculate overall success rate
    const totalSent = templates.reduce((sum, t) => sum + t.sentCount, 0);
    const totalFailed = templates.reduce((sum, t) => sum + t.failedCount, 0);
    const successRate =
      totalSent > 0
        ? Math.round(((totalSent - totalFailed) / totalSent) * 100)
        : 0;

    // Find top template
    const topTemplate = templates.reduce(
      (top, t) => (t.sentCount > (top?.count || 0) ? { name: t.name, count: t.sentCount } : top),
      null as { name: string; count: number } | null,
    );

    return {
      total,
      used,
      successRate,
      topTemplate: topTemplate || undefined,
    };
  }

  private calculateEngagementMetrics(messages: any) {
    const sent = messages.sent;
    const delivered = messages.delivered;
    const read = messages.read;
    const received = messages.received;

    const responseRate = sent > 0 ? Math.round((received / sent) * 100) : 0;
    const readRate = delivered > 0 ? Math.round((read / delivered) * 100) : 0;
    const replyRate = sent > 0 ? Math.round((received / sent) * 100) : 0;

    return {
      responseRate,
      readRate,
      replyRate,
    };
  }

  private async getMessagesTimeSeries(
    configId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const messages = await this.prisma.whatsAppMessage.groupBy({
      by: ['createdAt'],
      where: {
        conversation: { configId },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    // Group by date
    const dateMap: Record<string, number> = {};
    messages.forEach((m) => {
      const date = m.createdAt.toISOString().split('T')[0];
      dateMap[date] = (dateMap[date] || 0) + m._count;
    });

    return Object.entries(dateMap).map(([date, value]) => ({
      date,
      value,
    }));
  }

  private async getConversationsTimeSeries(
    configId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const conversations = await this.prisma.whatsAppConversation.groupBy({
      by: ['createdAt'],
      where: {
        configId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    const dateMap: Record<string, number> = {};
    conversations.forEach((c) => {
      const date = c.createdAt.toISOString().split('T')[0];
      dateMap[date] = (dateMap[date] || 0) + c._count;
    });

    return Object.entries(dateMap).map(([date, value]) => ({
      date,
      value,
    }));
  }

  private async getResponseTimeTimeSeries(
    configId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Simplified: return empty for now
    return [];
  }

  private generateCSV(report: AnalyticsReportDto): string {
    const lines: string[] = [];

    // Header
    lines.push('WhatsApp Analytics Report');
    lines.push(`Period: ${report.period.start} - ${report.period.end}`);
    lines.push(`Generated: ${report.generatedAt.toISOString()}`);
    lines.push('');

    // Messages metrics
    lines.push('Messages Metrics');
    lines.push(
      `Total,Sent,Received,Delivered,Read,Failed,Avg Response Time (min)`,
    );
    lines.push(
      `${report.metrics.messages.total},${report.metrics.messages.sent},${report.metrics.messages.received},${report.metrics.messages.delivered},${report.metrics.messages.read},${report.metrics.messages.failed},${report.metrics.messages.avgResponseTime}`,
    );
    lines.push('');

    // Conversations metrics
    lines.push('Conversations Metrics');
    lines.push(`Total,Active,New,Closed,Avg Duration (hours)`);
    lines.push(
      `${report.metrics.conversations.total},${report.metrics.conversations.active},${report.metrics.conversations.new},${report.metrics.conversations.closed},${report.metrics.conversations.avgDuration}`,
    );
    lines.push('');

    // Templates
    lines.push('Template Performance');
    lines.push(
      `Template Name,Sent,Delivered,Read,Failed,Success Rate,Read Rate`,
    );
    report.templates.forEach((t) => {
      lines.push(
        `${t.templateName},${t.sent},${t.delivered},${t.read},${t.failed},${t.successRate}%,${t.readRate}%`,
      );
    });

    const csvContent = lines.join('\n');
    return Buffer.from(csvContent).toString('base64');
  }
}
