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
  OwnerCreatedEvent,
} from './business.events';
import { BusinessNotificationHelper } from '../notification.helper';
import { BusinessActivityLogger } from '../activity-logger.helper';
import { EmailService } from '../email.service';

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
  ) {}

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
    this.logger.debug(`📢 Event: transaction.status_changed - ${event.oldStatus} → ${event.newStatus}`);

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
    this.logger.debug(`📢 Event: commission.created - ${event.commission.amount} ${event.commission.currency}`);

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
    this.logger.debug(`📢 Event: commission.status_changed - ${event.oldStatus} → ${event.newStatus}`);

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
    this.logger.debug(`📢 Event: payment.created - ${event.payment.amount} ${event.payment.currency}`);

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
}
