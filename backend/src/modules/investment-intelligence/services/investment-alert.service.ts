/**
 * Investment Alert Service
 * Handles user-defined alerts for investment opportunities
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import {
  AlertCriteria,
  NotificationChannel,
} from '../types/investment-project.types';
import { InvestmentAlert, InvestmentProject } from '@prisma/client';

@Injectable()
export class InvestmentAlertService {
  private readonly logger = new Logger(InvestmentAlertService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new alert
   */
  async createAlert(
    userId: string,
    tenantId: string,
    name: string,
    criteria: AlertCriteria,
    notificationChannels: NotificationChannel[],
    frequency: string = 'immediate',
  ): Promise<InvestmentAlert> {
    this.logger.log(`Creating alert for user ${userId}: ${name}`);

    const alert = await this.prisma.investmentAlert.create({
      data: {
        id: this.generateId(),
        userId,
        tenantId,
        name,
        isActive: true,
        criteria: criteria as any,
        notificationChannels: notificationChannels as any,
        frequency,
        triggeredCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Alert created: ${alert.id}`);
    return alert;
  }

  /**
   * Update alert
   */
  async updateAlert(
    alertId: string,
    updates: {
      name?: string;
      criteria?: AlertCriteria;
      notificationChannels?: NotificationChannel[];
      frequency?: string;
      isActive?: boolean;
    },
  ): Promise<InvestmentAlert> {
    return this.prisma.investmentAlert.update({
      where: { id: alertId },
      data: {
        ...updates,
        criteria: updates.criteria as any,
        notificationChannels: updates.notificationChannels as any,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete alert
   */
  async deleteAlert(alertId: string): Promise<void> {
    await this.prisma.investmentAlert.delete({
      where: { id: alertId },
    });
  }

  /**
   * Get alert by ID
   */
  async getAlert(alertId: string): Promise<InvestmentAlert | null> {
    return this.prisma.investmentAlert.findUnique({
      where: { id: alertId },
    });
  }

  /**
   * List all alerts for user
   */
  async listAlerts(userId: string): Promise<InvestmentAlert[]> {
    return this.prisma.investmentAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check if a project matches any active alerts
   */
  async checkProjectAgainstAlerts(
    project: InvestmentProject,
  ): Promise<InvestmentAlert[]> {
    this.logger.log(`Checking project ${project.id} against active alerts`);

    // Get all active alerts for the project's tenant
    const alerts = await this.prisma.investmentAlert.findMany({
      where: {
        tenantId: project.tenantId,
        isActive: true,
      },
    });

    const matchedAlerts: InvestmentAlert[] = [];

    for (const alert of alerts) {
      if (this.doesProjectMatchCriteria(project, alert.criteria as any)) {
        matchedAlerts.push(alert);

        // Update alert trigger count
        await this.prisma.investmentAlert.update({
          where: { id: alert.id },
          data: {
            lastTriggeredAt: new Date(),
            triggeredCount: { increment: 1 },
          },
        });

        // TODO: Send notification via configured channels
        await this.sendNotification(alert, project);
      }
    }

    if (matchedAlerts.length > 0) {
      this.logger.log(
        `Project ${project.id} matched ${matchedAlerts.length} alerts`,
      );
    }

    return matchedAlerts;
  }

  // ============================================
  // Private Methods
  // ============================================

  private doesProjectMatchCriteria(
    project: InvestmentProject,
    criteria: AlertCriteria,
  ): boolean {
    // Geographic criteria
    if (criteria.countries && criteria.countries.length > 0) {
      if (!criteria.countries.includes(project.country)) {
        return false;
      }
    }

    if (criteria.cities && criteria.cities.length > 0) {
      if (!criteria.cities.includes(project.city)) {
        return false;
      }
    }

    // Financial criteria
    if (criteria.minYield !== undefined && project.targetYield) {
      if (project.targetYield < criteria.minYield) {
        return false;
      }
    }

    if (criteria.maxYield !== undefined && project.targetYield) {
      if (project.targetYield > criteria.maxYield) {
        return false;
      }
    }

    if (criteria.minTicket !== undefined) {
      if (project.minTicket < criteria.minTicket) {
        return false;
      }
    }

    if (criteria.maxTicket !== undefined) {
      if (project.minTicket > criteria.maxTicket) {
        return false;
      }
    }

    if (criteria.currencies && criteria.currencies.length > 0) {
      if (!criteria.currencies.includes(project.currency)) {
        return false;
      }
    }

    // Property criteria
    if (criteria.propertyTypes && criteria.propertyTypes.length > 0) {
      if (!criteria.propertyTypes.includes(project.propertyType)) {
        return false;
      }
    }

    // Duration criteria
    if (criteria.minDuration !== undefined && project.durationMonths) {
      if (project.durationMonths < criteria.minDuration) {
        return false;
      }
    }

    if (criteria.maxDuration !== undefined && project.durationMonths) {
      if (project.durationMonths > criteria.maxDuration) {
        return false;
      }
    }

    // Sources criteria
    if (criteria.sources && criteria.sources.length > 0) {
      if (!criteria.sources.includes(project.source)) {
        return false;
      }
    }

    // Status criteria
    if (criteria.statuses && criteria.statuses.length > 0) {
      if (!criteria.statuses.includes(project.status)) {
        return false;
      }
    }

    return true;
  }

  private async sendNotification(
    alert: InvestmentAlert,
    project: InvestmentProject,
  ): Promise<void> {
    const channels = alert.notificationChannels as any as NotificationChannel[];

    for (const channel of channels) {
      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(channel.config.email!, alert, project);
          break;

        case 'webhook':
          await this.sendWebhookNotification(
            channel.config.webhookUrl!,
            alert,
            project,
          );
          break;

        case 'in_app':
          await this.createInAppNotification(alert, project);
          break;

        default:
          this.logger.warn(`Unknown notification channel: ${channel.type}`);
      }
    }
  }

  private async sendEmailNotification(
    email: string,
    alert: InvestmentAlert,
    project: InvestmentProject,
  ): Promise<void> {
    this.logger.log(`Sending email notification to ${email}`);

    // TODO: Integrate with email service
    // For now, just log
    this.logger.log(
      `Email would be sent: Alert "${alert.name}" matched project "${project.title}"`,
    );
  }

  private async sendWebhookNotification(
    webhookUrl: string,
    alert: InvestmentAlert,
    project: InvestmentProject,
  ): Promise<void> {
    this.logger.log(`Sending webhook notification to ${webhookUrl}`);

    try {
      const payload = {
        event: 'investment_alert_triggered',
        alert: {
          id: alert.id,
          name: alert.name,
        },
        project: {
          id: project.id,
          title: project.title,
          city: project.city,
          country: project.country,
          totalPrice: project.totalPrice,
          minTicket: project.minTicket,
          currency: project.currency,
          targetYield: project.targetYield,
          sourceUrl: project.sourceUrl,
        },
        timestamp: new Date().toISOString(),
      };

      // TODO: Actually send webhook
      // await axios.post(webhookUrl, payload);
      this.logger.log(`Webhook payload prepared: ${JSON.stringify(payload)}`);
    } catch (error) {
      this.logger.error(`Failed to send webhook: ${error.message}`);
    }
  }

  private async createInAppNotification(
    alert: InvestmentAlert,
    project: InvestmentProject,
  ): Promise<void> {
    this.logger.log(`Creating in-app notification for alert ${alert.id}`);

    // TODO: Create notification in notifications table
    // For now, just log
    this.logger.log(
      `In-app notification: Alert "${alert.name}" matched project "${project.title}"`,
    );
  }

  private generateId(): string {
    return `alt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // ============================================
  // Batch Alert Processing
  // ============================================

  /**
   * Process all active alerts (can be called periodically)
   */
  async processAllAlerts(): Promise<void> {
    this.logger.log('Processing all active alerts');

    // Get all active alerts
    const alerts = await this.prisma.investmentAlert.findMany({
      where: { isActive: true },
    });

    // Get recent projects (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentProjects = await this.prisma.investmentProject.findMany({
      where: {
        importedAt: {
          gte: yesterday,
        },
      },
    });

    this.logger.log(
      `Processing ${alerts.length} alerts against ${recentProjects.length} recent projects`,
    );

    for (const project of recentProjects) {
      await this.checkProjectAgainstAlerts(project);
    }

    this.logger.log('Alert processing completed');
  }
}
