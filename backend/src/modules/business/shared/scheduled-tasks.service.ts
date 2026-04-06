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
  ) {}

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
          (new Date(mandate.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
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
          (new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24),
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
        const [newTransactions, completedTransactions, newMandates, newCommissions] =
          await Promise.all([
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

  /**
   * 🕐 Exécuté tous les jours à minuit
   * Vérifie et marque les annonces de propriétés expirées
   * Les propriétés sont archivées après leur période de listing
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkAndArchiveExpiredProperties() {
    this.logger.log('⏰ Checking for expired property listings...');

    try {
      // Find all published properties that have exceeded their listing duration
      // Default listing duration: 90 days (if expirationDate is not set)
      const now = new Date();
      const ninetydaysAgo = new Date();
      ninetydaysAgo.setDate(ninetydaysAgo.getDate() - 90);

      // Properties with explicit expiration date that has passed
      const expiredProperties = await this.db.properties.findMany({
        where: {
          AND: [
            { status: { in: ['published', 'available', 'reserved'] } },
            {
              OR: [
                // Properties with explicit expirationDate that has passed
                {
                  AND: [{ expirationDate: { not: null } }, { expirationDate: { lt: now } }],
                },
                // Properties without expirationDate but older than 90 days
                {
                  AND: [{ expirationDate: null }, { createdAt: { lt: ninetydaysAgo } }],
                },
              ],
            },
          ],
        },
        include: {
          owner: true,
        },
      });

      if (expiredProperties.length === 0) {
        this.logger.log('✅ No expired property listings found');
        return;
      }

      this.logger.log(`📋 Found ${expiredProperties.length} expired listings`);

      // Archive all expired properties
      await this.db.properties.updateMany({
        where: {
          id: {
            in: expiredProperties.map((p) => p.id),
          },
        },
        data: {
          status: 'archived',
          deletedAt: now,
        },
      });

      this.logger.log(`✅ Archived ${expiredProperties.length} expired property listings`);

      // Log activity and send notifications for each archived property
      for (const property of expiredProperties) {
        // Log activity
        await this.activityLogger.logPropertyStatusChanged(
          property.userId,
          property,
          property.status,
          'archived',
          'Listing expiré - propriété archivée automatiquement',
        );

        // Create a notification
        await this.db.notification.create({
          data: {
            userId: property.userId,
            type: 'property_listing_expired',
            title: 'Annonce expirée',
            message: `L'annonce de la propriété "${property.title}" a été archivée car sa période de listing a expiré.`,
            metadata: {
              propertyId: property.id,
              propertyTitle: property.title,
              expirationDate: property.expirationDate,
              listingDays: Math.floor(
                (now.getTime() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24),
              ),
            },
            actionUrl: `/properties/${property.id}`,
          },
        });
      }
    } catch (error) {
      this.logger.error('❌ Error checking expired properties:', error);
    }
  }

  /**
   * 🕐 Exécuté tous les jours à 9h du matin
   * Notifie les propriétaires pour les annonces expirant bientôt
   * Notifie 7 jours, 3 jours et 1 jour avant l'expiration
   */
  @Cron('0 9 * * *') // Every day at 9 AM
  async notifyExpiringProperties() {
    this.logger.log('⏰ Checking for property listings expiring soon...');

    try {
      const now = new Date();
      const expiringDates = [1, 3, 7]; // Notify 1, 3, and 7 days before expiration

      for (const daysRemaining of expiringDates) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + daysRemaining);

        const expiringProperties = await this.db.properties.findMany({
          where: {
            status: { in: ['published', 'available', 'reserved'] },
            expirationDate: {
              gte: new Date(expirationDate.getTime() - 24 * 60 * 60 * 1000),
              lte: new Date(expirationDate.getTime() + 24 * 60 * 60 * 1000),
            },
          },
          include: {
            owner: true,
          },
        });

        for (const property of expiringProperties) {
          await this.db.notification.create({
            data: {
              userId: property.userId,
              type: 'property_listing_expiring_soon',
              title: `Annonce expire dans ${daysRemaining} jour(s)`,
              message: `L'annonce de la propriété "${property.title}" expire dans ${daysRemaining} jour(s). Veuillez la renouveler pour continuer à la promouvoir.`,
              metadata: {
                propertyId: property.id,
                propertyTitle: property.title,
                daysRemaining,
                expirationDate: property.expirationDate,
              },
              actionUrl: `/properties/${property.id}/renew`,
            },
          });
        }

        if (expiringProperties.length > 0) {
          this.logger.log(
            `📧 Sent ${expiringProperties.length} notification(s) for properties expiring in ${daysRemaining} day(s)`,
          );
        }
      }

      this.logger.log('✅ Property expiration notifications sent');
    } catch (error) {
      this.logger.error('❌ Error notifying expiring properties:', error);
    }
  }
}
