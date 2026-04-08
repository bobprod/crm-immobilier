import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService as DatabaseService } from '../../../shared/database/prisma.service';
import { BusinessNotificationHelper } from './notification.helper';
import { BusinessActivityLogger } from './activity-logger.helper';

/**
 * Service pour les tâches planifiées (cron jobs)
 */
@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly notificationHelper: BusinessNotificationHelper,
    private readonly activityLogger: BusinessActivityLogger,
  ) { }

  /**
   * 🕐 Exécuté tous les jours à minuit
   * Vérifie et marque les mandats expirés
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkAndMarkExpiredMandates() {
    this.logger.log('⏰ Checking for expired mandates...');

    try {
      // Find all active mandates that have passed their end date
      const expiredMandates = await this.db.mandate.findMany({
        where: {
          status: 'active',
          endDate: {
            lt: new Date(),
          },
        },
        include: {
          owner: true,
          property: true,
        },
      });

      if (expiredMandates.length === 0) {
        this.logger.log('✅ No expired mandates found');
        return;
      }

      // Update all expired mandates
      await this.db.mandate.updateMany({
        where: {
          id: {
            in: expiredMandates.map((m) => m.id),
          },
        },
        data: {
          status: 'expired',
        },
      });

      this.logger.log(`✅ Marked ${expiredMandates.length} mandates as expired`);

      // Log activity and send notifications for each expired mandate
      for (const mandate of expiredMandates) {
        // Log activity
        await this.activityLogger.logMandateStatusChanged(
          mandate.userId,
          mandate,
          'active',
          'expired',
        );

        // Send notification (optional - you might not want to spam users)
        // await this.notificationHelper.notifyMandateExpired(mandate.userId, mandate);
      }
    } catch (error) {
      this.logger.error('❌ Error checking expired mandates:', error);
    }
  }

  /**
   * 🕐 Exécuté tous les jours à 9h du matin
   * Notifie les mandats qui expirent dans les 30 jours
   */
  @Cron('0 9 * * *') // Every day at 9 AM
  async notifyExpiringMandates() {
    this.logger.log('⏰ Checking for mandates expiring soon...');

    try {
      const daysThreshold = 30;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysThreshold);

      const expiringMandates = await this.db.mandate.findMany({
        where: {
          status: 'active',
          endDate: {
            gte: new Date(),
            lte: futureDate,
          },
        },
        include: {
          owner: true,
          property: true,
        },
      });

      if (expiringMandates.length === 0) {
        this.logger.log('✅ No mandates expiring soon');
        return;
      }

      this.logger.log(`📧 Sending notifications for ${expiringMandates.length} expiring mandates`);

      // Send notification for each expiring mandate
      for (const mandate of expiringMandates) {
        const daysRemaining = Math.ceil(
          (new Date(mandate.endDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
        );

        // Only notify for specific thresholds (30 days, 15 days, 7 days, 3 days)
        if ([30, 15, 7, 3].includes(daysRemaining)) {
          await this.notificationHelper.notifyMandateExpiring(
            mandate.userId,
            mandate,
            daysRemaining,
          );
        }
      }

      this.logger.log('✅ Expiring mandate notifications sent');
    } catch (error) {
      this.logger.error('❌ Error notifying expiring mandates:', error);
    }
  }

  /**
   * 🕐 Exécuté tous les jours à 9h du matin
   * Notifie les factures en retard de paiement
   */
  @Cron('0 9 * * *') // Every day at 9 AM
  async notifyOverdueInvoices() {
    this.logger.log('⏰ Checking for overdue invoices...');

    try {
      const overdueInvoices = await this.db.invoice.findMany({
        where: {
          status: {
            in: ['sent', 'partially_paid'],
          },
          dueDate: {
            lt: new Date(),
          },
        },
        include: {
          transaction: {
            select: {
              id: true,
              reference: true,
            },
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (overdueInvoices.length === 0) {
        this.logger.log('✅ No overdue invoices');
        return;
      }

      this.logger.log(`⚠️ Found ${overdueInvoices.length} overdue invoices`);

      // Create a notification for each overdue invoice
      for (const invoice of overdueInvoices) {
        const daysOverdue = Math.floor(
          (new Date().getTime() - new Date(invoice.dueDate).getTime()) /
          (1000 * 60 * 60 * 24),
        );

        // Notify for specific thresholds (1 day, 7 days, 14 days, 30 days)
        if ([1, 7, 14, 30].includes(daysOverdue)) {
          await this.db.activity.create({
            data: {
              userId: invoice.userId,
              type: 'invoice_overdue',
              description: `⚠️ Facture ${invoice.number} en retard de ${daysOverdue} jours`,
              entityType: 'invoice',
              entityId: invoice.id,
              metadata: {
                invoiceId: invoice.id,
                number: invoice.number,
                daysOverdue,
                clientName: invoice.clientName,
                totalAmount: invoice.totalAmount,
              },
            },
          });

          // You could also send a notification here
          // await this.notificationHelper.notifyInvoiceOverdue(invoice.userId, invoice, daysOverdue);
        }
      }

      this.logger.log('✅ Overdue invoice notifications created');
    } catch (error) {
      this.logger.error('❌ Error notifying overdue invoices:', error);
    }
  }

  /**
   * 🕐 Exécuté tous les lundis à 10h
   * Génère un résumé hebdomadaire des activités
   */
  @Cron('0 10 * * 1') // Every Monday at 10 AM
  async sendWeeklySummary() {
    this.logger.log('⏰ Generating weekly summaries...');

    try {
      // Get all users
      const users = await this.db.users.findMany({
        where: { isActive: true },
        select: { id: true, email: true, firstName: true },
      });

      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      for (const user of users) {
        // Get stats for the week
        const [
          newTransactions,
          completedTransactions,
          newMandates,
          newCommissions,
        ] = await Promise.all([
          this.db.transaction.count({
            where: {
              userId: user.id,
              createdAt: { gte: lastWeek },
            },
          }),
          this.db.transaction.count({
            where: {
              userId: user.id,
              status: 'final_deed_signed',
              updatedAt: { gte: lastWeek },
            },
          }),
          this.db.mandate.count({
            where: {
              userId: user.id,
              createdAt: { gte: lastWeek },
            },
          }),
          this.db.commission.count({
            where: {
              userId: user.id,
              createdAt: { gte: lastWeek },
            },
          }),
        ]);

        // Only send summary if there's activity
        if (
          newTransactions > 0 ||
          completedTransactions > 0 ||
          newMandates > 0 ||
          newCommissions > 0
        ) {
          await this.db.activity.create({
            data: {
              userId: user.id,
              type: 'weekly_summary',
              description: `📊 Résumé hebdomadaire : ${newTransactions} nouvelles transactions, ${completedTransactions} finalisées, ${newMandates} nouveaux mandats`,
              entityType: 'system',
              entityId: null,
              metadata: {
                newTransactions,
                completedTransactions,
                newMandates,
                newCommissions,
                weekStart: lastWeek,
                weekEnd: new Date(),
              },
            },
          });
        }
      }

      this.logger.log('✅ Weekly summaries generated');
    } catch (error) {
      this.logger.error('❌ Error generating weekly summaries:', error);
    }
  }

  // ─── PROVISION MODULE CRONS ───────────────────────────────────────────────

  /**
   * 🏦 Le 1er de chaque mois à 7h00 — génère les occurrences du mois
   */
  @Cron('0 7 1 * *')
  async generateMonthlyProvisionOccurrences() {
    this.logger.log('⏰ [Provision] Generating monthly occurrences...');
    try {
      const activeCommitments = await this.db.financialCommitment.findMany({
        where: { isActive: true },
      });
      for (const c of activeCommitments) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const exists = await this.db.provisionOccurrence.findFirst({
          where: { commitmentId: c.id, periodYear: year, periodMonth: month },
        });
        if (!exists) {
          const dueDate = new Date(year, month - 1, c.customDayOfMonth ?? 1);
          const months = ['Janvier','Février','Mars','Avril','Mai','Juin',
                          'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
          await this.db.provisionOccurrence.create({
            data: {
              commitmentId: c.id,
              agencyId: c.agencyId,
              periodLabel: `${months[month - 1]} ${year}`,
              periodYear: year,
              periodMonth: month,
              dueDate,
              expectedAmount: c.amount,
              currency: c.currency,
              status: 'PENDING',
            },
          });
        }
      }
      this.logger.log('✅ [Provision] Monthly occurrences generated');
    } catch (err) {
      this.logger.error('❌ [Provision] Error generating monthly occurrences', err);
    }
  }

  /**
   * 🚨 Tous les jours à 8h30 — vérifie les retards et envoie les alertes
   */
  @Cron('30 8 * * *')
  async checkProvisionAlerts() {
    this.logger.log('⏰ [Provision] Checking overdue occurrences...');
    try {
      const now = new Date();
      const agencies = await this.db.agencies.findMany({ select: { id: true } });
      for (const agency of agencies) {
        // Chercher les occurrences PENDING dont la dueDate + grace est dépassée
        const commitments = await this.db.financialCommitment.findMany({
          where: { agencyId: agency.id, isActive: true },
          select: { id: true, gracePeriodDays: true },
        });
        for (const c of commitments) {
          const grace = c.gracePeriodDays ?? 5;
          const graceDate = new Date();
          graceDate.setDate(graceDate.getDate() - grace);
          const overdueOccs = await this.db.provisionOccurrence.findMany({
            where: {
              commitmentId: c.id,
              status: 'PENDING',
              dueDate: { lt: graceDate },
            },
          });
          for (const occ of overdueOccs) {
            await this.db.provisionOccurrence.update({
              where: { id: occ.id },
              data: { status: 'OVERDUE', alertSentAt: now, alertCount: { increment: 1 } },
            });
            this.logger.warn(`🚨 [Provision] OVERDUE: ${occ.periodLabel} - agency ${agency.id}`);
          }
        }
      }
      this.logger.log('✅ [Provision] Alert check complete');
    } catch (err) {
      this.logger.error('❌ [Provision] Error checking alerts', err);
    }
  }
}
