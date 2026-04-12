import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  MandateCreatedEvent,
  MandateStatusChangedEvent,
  MandateExpiringEvent,
  MandateCancelledEvent,
  TransactionCreatedEvent,
  TransactionStatusChangedEvent,
  TransactionCompletedEvent,
  CommissionCreatedEvent,
  CommissionStatusChangedEvent,
  InvoiceCreatedEvent,
  InvoiceStatusChangedEvent,
  PaymentCreatedEvent,
  PropertyPublishedEvent,
  PropertyCreatedEvent,
  OwnerCreatedEvent,
  ProspectConvertedEvent,
} from './business.events';
import { BusinessNotificationHelper } from '../notification.helper';
import { BusinessActivityLogger } from '../activity-logger.helper';
import { EmailService } from '../email.service';
import { PrismaService } from '../../../../shared/database/prisma.service';

/**
 * Event Handlers pour les événements métier
 *
 * Ces handlers écoutent les événements émis par les services
 * et exécutent les actions appropriées (notifications, logs, emails).
 *
 * Avantages :
 * - Découplage total entre services
 * - Facile d'ajouter/retirer des side-effects
 * - Testable indépendamment
 */
@Injectable()
export class BusinessEventHandlers {
  private readonly logger = new Logger(BusinessEventHandlers.name);

  constructor(
    private readonly notificationHelper: BusinessNotificationHelper,
    private readonly activityLogger: BusinessActivityLogger,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) { }

  // ========== MANDATE EVENT HANDLERS ==========

  @OnEvent('mandate.created')
  async handleMandateCreated(event: MandateCreatedEvent) {
    this.logger.debug(`📢 Event: mandate.created - ${event.mandate.reference}`);

    try {
      // Notification
      await this.notificationHelper.notifyMandateCreated(event.userId, event.mandate);

      // Activity log
      await this.activityLogger.logMandateCreated(event.userId, event.mandate);

      // Email (optionnel)
      // await this.emailService.sendMandateCreatedEmail(userEmail, event.mandate);
    } catch (error) {
      this.logger.error('Error handling mandate.created event:', error);
    }
  }

  @OnEvent('mandate.status_changed')
  async handleMandateStatusChanged(event: MandateStatusChangedEvent) {
    this.logger.debug(`📢 Event: mandate.status_changed - ${event.oldStatus} → ${event.newStatus}`);

    try {
      // Activity log
      await this.activityLogger.logMandateStatusChanged(
        event.userId,
        event.mandate,
        event.oldStatus,
        event.newStatus,
      );
    } catch (error) {
      this.logger.error('Error handling mandate.status_changed event:', error);
    }
  }

  @OnEvent('mandate.expiring')
  async handleMandateExpiring(event: MandateExpiringEvent) {
    this.logger.debug(`📢 Event: mandate.expiring - ${event.daysRemaining} days`);

    try {
      // Notification
      await this.notificationHelper.notifyMandateExpiring(
        event.userId,
        event.mandate,
        event.daysRemaining,
      );

      // Email (optionnel)
      // const user = await this.getUserEmail(event.userId);
      // await this.emailService.sendMandateExpiringEmail(user.email, event.mandate, event.daysRemaining);
    } catch (error) {
      this.logger.error('Error handling mandate.expiring event:', error);
    }
  }

  @OnEvent('mandate.cancelled')
  async handleMandateCancelled(event: MandateCancelledEvent) {
    this.logger.debug(`📢 Event: mandate.cancelled - ${event.mandate.reference}`);

    try {
      // Activity log
      await this.activityLogger.logMandateCancelled(event.userId, event.mandate, event.reason);
    } catch (error) {
      this.logger.error('Error handling mandate.cancelled event:', error);
    }
  }

  // ========== TRANSACTION EVENT HANDLERS ==========

  @OnEvent('transaction.created')
  async handleTransactionCreated(event: TransactionCreatedEvent) {
    this.logger.debug(`📢 Event: transaction.created - ${event.transaction.reference}`);

    try {
      // Notification
      await this.notificationHelper.notifyTransactionCreated(event.userId, event.transaction);

      // Activity log
      await this.activityLogger.logTransactionCreated(event.userId, event.transaction);

      // Email (optionnel)
      // const user = await this.getUserEmail(event.userId);
      // await this.emailService.sendTransactionCreatedEmail(user.email, event.transaction);
    } catch (error) {
      this.logger.error('Error handling transaction.created event:', error);
    }
  }

  @OnEvent('transaction.status_changed')
  async handleTransactionStatusChanged(event: TransactionStatusChangedEvent) {
    this.logger.debug(
      `📢 Event: transaction.status_changed - ${event.oldStatus} → ${event.newStatus}`,
    );

    try {
      // Notification
      await this.notificationHelper.notifyTransactionStatusChanged(
        event.userId,
        event.transaction,
        event.oldStatus,
        event.newStatus,
      );

      // Activity log
      await this.activityLogger.logTransactionStatusChanged(
        event.userId,
        event.transaction,
        event.oldStatus,
        event.newStatus,
      );
    } catch (error) {
      this.logger.error('Error handling transaction.status_changed event:', error);
    }
  }

  @OnEvent('transaction.completed')
  async handleTransactionCompleted(event: TransactionCompletedEvent) {
    this.logger.debug(`📢 Event: transaction.completed - ${event.transaction.reference}`);

    try {
      // Notification
      await this.notificationHelper.notifyTransactionCompleted(event.userId, event.transaction);

      // Activity log
      await this.activityLogger.logTransactionCompleted(event.userId, event.transaction);

      // Email (optionnel)
      // const user = await this.getUserEmail(event.userId);
      // await this.emailService.sendTransactionCompletedEmail(user.email, event.transaction);
    } catch (error) {
      this.logger.error('Error handling transaction.completed event:', error);
    }
  }

  // ========== COMMISSION EVENT HANDLERS ==========

  @OnEvent('commission.created')
  async handleCommissionCreated(event: CommissionCreatedEvent) {
    this.logger.debug(
      `📢 Event: commission.created - ${event.commission.amount} ${event.commission.currency}`,
    );

    try {
      // Notification
      await this.notificationHelper.notifyCommissionCreated(event.userId, event.commission);

      // Activity log
      await this.activityLogger.logCommissionCreated(
        event.userId,
        event.commission,
        event.isAutomatic,
      );

      // Email (optionnel)
      // const user = await this.getUserEmail(event.userId);
      // await this.emailService.sendCommissionCreatedEmail(user.email, event.commission);
    } catch (error) {
      this.logger.error('Error handling commission.created event:', error);
    }
  }

  @OnEvent('commission.status_changed')
  async handleCommissionStatusChanged(event: CommissionStatusChangedEvent) {
    this.logger.debug(
      `📢 Event: commission.status_changed - ${event.oldStatus} → ${event.newStatus}`,
    );

    try {
      // Activity log
      await this.activityLogger.logCommissionStatusChanged(
        event.userId,
        event.commission,
        event.oldStatus,
        event.newStatus,
      );
    } catch (error) {
      this.logger.error('Error handling commission.status_changed event:', error);
    }
  }

  // ========== INVOICE EVENT HANDLERS ==========

  @OnEvent('invoice.created')
  async handleInvoiceCreated(event: InvoiceCreatedEvent) {
    this.logger.debug(`📢 Event: invoice.created - ${event.invoice.number}`);

    try {
      // Activity log
      await this.activityLogger.logInvoiceCreated(event.userId, event.invoice);
    } catch (error) {
      this.logger.error('Error handling invoice.created event:', error);
    }
  }

  @OnEvent('invoice.status_changed')
  async handleInvoiceStatusChanged(event: InvoiceStatusChangedEvent) {
    this.logger.debug(`📢 Event: invoice.status_changed - ${event.oldStatus} → ${event.newStatus}`);

    try {
      // Activity log
      await this.activityLogger.logInvoiceStatusChanged(
        event.userId,
        event.invoice,
        event.oldStatus,
        event.newStatus,
      );
    } catch (error) {
      this.logger.error('Error handling invoice.status_changed event:', error);
    }
  }

  // ========== PAYMENT EVENT HANDLERS ==========

  @OnEvent('payment.created')
  async handlePaymentCreated(event: PaymentCreatedEvent) {
    this.logger.debug(
      `📢 Event: payment.created - ${event.payment.amount} ${event.payment.currency}`,
    );

    try {
      // Activity log
      await this.activityLogger.logPaymentCreated(event.userId, event.payment);
    } catch (error) {
      this.logger.error('Error handling payment.created event:', error);
    }
  }

  // ========== PROPERTY EVENT HANDLERS ==========

  @OnEvent('property.published')
  async handlePropertyPublished(event: PropertyPublishedEvent) {
    this.logger.debug(`📢 Event: property.published - ${event.property.title}`);

    try {
      // Activity log (example)
      this.logger.log(`Property published: ${event.property.title}`);
      // Could trigger external portal publishing here
    } catch (error) {
      this.logger.error('Error handling property.published event:', error);
    }
  }

  // ========== OWNER EVENT HANDLERS ==========

  @OnEvent('owner.created')
  async handleOwnerCreated(event: OwnerCreatedEvent) {
    this.logger.debug(`📢 Event: owner.created - ${event.owner.firstName} ${event.owner.lastName}`);

    try {
      // Activity log
      await this.activityLogger.logOwnerCreated(event.userId, event.owner);
    } catch (error) {
      this.logger.error('Error handling owner.created event:', error);
    }
  }

  // ========== PROPERTY CREATED → MATCHING AUTOMATIQUE ==========

  @OnEvent('property.created')
  async handlePropertyCreatedMatching(event: PropertyCreatedEvent) {
    this.logger.debug(`📢 Event: property.created → matching auto pour "${event.property.title}"`);

    try {
      const property = event.property;

      // Chercher les prospects dont les critères matchent ce bien
      const prospects = await this.prisma.prospects.findMany({
        where: {
          userId: event.userId,
          deletedAt: null,
          budget: { not: null },
        },
      });

      const matchedProspects: any[] = [];

      for (const prospect of prospects) {
        let score = 0;
        const reasons: string[] = [];
        const budget = prospect.budget as any;

        // Vérifier le budget
        if (budget) {
          const minBudget = budget.min || budget.budgetMin || 0;
          const maxBudget = budget.max || budget.budgetMax || Infinity;
          if (property.price >= minBudget && property.price <= maxBudget) {
            score += 30;
            reasons.push('Budget compatible');
          }
        }

        // Vérifier le type si le prospect a des critères
        const criteria = prospect.searchCriteria as any;
        if (criteria) {
          if (criteria.type && criteria.type === property.type) {
            score += 20;
            reasons.push('Type recherché');
          }
          if (
            criteria.city &&
            property.city &&
            criteria.city.toLowerCase() === property.city.toLowerCase()
          ) {
            score += 25;
            reasons.push('Ville souhaitée');
          }
          if (criteria.minArea && property.area && property.area >= criteria.minArea) {
            score += 15;
            reasons.push('Surface suffisante');
          }
          if (criteria.bedrooms && property.bedrooms && property.bedrooms >= criteria.bedrooms) {
            score += 10;
            reasons.push('Chambres suffisantes');
          }
        }

        if (score >= 30) {
          matchedProspects.push({ prospect, score, reasons });
        }
      }

      if (matchedProspects.length > 0) {
        this.logger.log(
          `🔔 ${matchedProspects.length} prospect(s) matchent le bien "${property.title}"`,
        );

        // Créer les notifications pour chaque prospect matché
        for (const { prospect, score, reasons } of matchedProspects) {
          await this.prisma.notification.create({
            data: {
              userId: event.userId,
              type: 'matching_alert',
              title: `Nouveau bien compatible : ${property.title}`,
              message: `Le prospect ${prospect.firstName} ${prospect.lastName} (score: ${score}%) correspond au bien "${property.title}" — ${reasons.join(', ')}`,
              metadata: {
                propertyId: property.id,
                prospectId: prospect.id,
                score,
                reasons,
              },
              isRead: false,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error('Error handling property.created matching event:', error);
    }
  }

  // ========== PROSPECT CONVERSION HANDLER ==========

  @OnEvent('prospect.converted')
  async handleProspectConverted(event: ProspectConvertedEvent) {
    this.logger.debug(`📢 Event: prospect.converted - ${event.prospect?.firstName} ${event.prospect?.lastName}`);

    try {
      const prospect = event.prospect;
      const reference = `TX-${Date.now().toString(36).toUpperCase()}`;

      // Auto-create a draft transaction from the converted prospect
      await this.prisma.transaction.create({
        data: {
          reference,
          type: prospect.transactionType || 'sale',
          status: 'offer_received',
          buyerName: `${prospect.firstName || ''} ${prospect.lastName || ''}`.trim(),
          buyerEmail: prospect.email || null,
          buyerPhone: prospect.phone || null,
          propertyId: prospect.propertyId || null,
          offerPrice: prospect.budget ? Number(prospect.budget) : 0,
          userId: event.userId,
          notes: `Transaction auto-créée depuis le prospect converti: ${prospect.firstName} ${prospect.lastName}`,
        },
      });

      this.logger.log(`✅ Draft transaction ${reference} created from prospect conversion`);

      // Notification
      await this.prisma.notification.create({
        data: {
          userId: event.userId,
          type: 'transaction_created',
          title: `Nouvelle transaction créée`,
          message: `La transaction ${reference} a été auto-créée suite à la conversion du prospect ${prospect.firstName} ${prospect.lastName}`,
          metadata: { reference, prospectId: prospect.id },
          isRead: false,
        },
      });
    } catch (error) {
      this.logger.error('Error handling prospect.converted event:', error);
    }
  }
}
