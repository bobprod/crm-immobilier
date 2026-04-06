import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AnalyticsService } from './analytics.service';
import {
  PropertyCreatedEvent,
  PropertyStatusChangedEvent,
  PropertySoldEvent,
  PropertyPublishedEvent,
  MandateCreatedEvent,
  MandateStatusChangedEvent,
  TransactionCreatedEvent,
  TransactionCompletedEvent,
  TransactionStatusChangedEvent,
  CommissionCreatedEvent,
  CommissionPaidEvent,
  InvoiceCreatedEvent,
  InvoicePaidEvent,
  PaymentReceivedEvent,
  OwnerCreatedEvent,
  ProspectCreatedEvent,
  ProspectStatusChangedEvent,
  ProspectConvertedEvent,
  AppointmentCreatedEvent,
  AppointmentStatusChangedEvent,
  TaskCreatedEvent,
  TaskCompletedEvent,
} from '../../business/shared/events/business.events';

/**
 * Synchronise le module Business Intelligence avec tous les modules métier
 * via le système d'événements.
 *
 * Chaque événement métier est intercepté ici et enregistré dans
 * analytics_events pour alimenter les dashboards et KPIs en temps réel.
 */
@Injectable()
export class AnalyticsEventHandlerService {
  private readonly logger = new Logger(AnalyticsEventHandlerService.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  // ========== PROPERTY EVENTS ==========

  @OnEvent('property.created')
  async onPropertyCreated(event: PropertyCreatedEvent) {
    await this.log(event.userId, 'property', 'property.created', {
      propertyId: event.property?.id,
      title: event.property?.title,
      type: event.property?.type,
      price: event.property?.price,
      status: event.property?.status,
    });
  }

  @OnEvent('property.status_changed')
  async onPropertyStatusChanged(event: PropertyStatusChangedEvent) {
    await this.log(event.userId, 'property', 'property.status_changed', {
      propertyId: event.property?.id,
      oldStatus: event.oldStatus,
      newStatus: event.newStatus,
    });
  }

  @OnEvent('property.sold')
  async onPropertySold(event: PropertySoldEvent) {
    await this.log(event.userId, 'property', 'property.sold', {
      propertyId: event.property?.id,
      price: event.property?.price,
      transactionId: event.transaction?.id,
    });
  }

  @OnEvent('property.published')
  async onPropertyPublished(event: PropertyPublishedEvent) {
    await this.log(event.userId, 'property', 'property.published', {
      propertyId: event.property?.id,
      title: event.property?.title,
    });
  }

  // ========== PROSPECT EVENTS ==========

  @OnEvent('prospect.created')
  async onProspectCreated(event: ProspectCreatedEvent) {
    await this.log(event.userId, 'prospect', 'prospect.created', {
      prospectId: event.prospect?.id,
      budget: event.prospect?.budget,
      status: event.prospect?.status,
    });
  }

  @OnEvent('prospect.status_changed')
  async onProspectStatusChanged(event: ProspectStatusChangedEvent) {
    await this.log(event.userId, 'prospect', 'prospect.status_changed', {
      prospectId: event.prospect?.id,
      oldStatus: event.oldStatus,
      newStatus: event.newStatus,
    });
  }

  @OnEvent('prospect.converted')
  async onProspectConverted(event: ProspectConvertedEvent) {
    await this.log(event.userId, 'prospect', 'prospect.converted', {
      prospectId: event.prospect?.id,
    });
  }

  // ========== MANDATE EVENTS ==========

  @OnEvent('mandate.created')
  async onMandateCreated(event: MandateCreatedEvent) {
    await this.log(event.userId, 'mandate', 'mandate.created', {
      mandateId: event.mandate?.id,
      reference: event.mandate?.reference,
      type: event.mandate?.type,
    });
  }

  @OnEvent('mandate.status_changed')
  async onMandateStatusChanged(event: MandateStatusChangedEvent) {
    await this.log(event.userId, 'mandate', 'mandate.status_changed', {
      mandateId: event.mandate?.id,
      oldStatus: event.oldStatus,
      newStatus: event.newStatus,
    });
  }

  // ========== TRANSACTION EVENTS ==========

  @OnEvent('transaction.created')
  async onTransactionCreated(event: TransactionCreatedEvent) {
    await this.log(event.userId, 'transaction', 'transaction.created', {
      transactionId: event.transaction?.id,
      amount: event.transaction?.price,
      type: event.transaction?.type,
    });
  }

  @OnEvent('transaction.status_changed')
  async onTransactionStatusChanged(event: TransactionStatusChangedEvent) {
    await this.log(event.userId, 'transaction', 'transaction.status_changed', {
      transactionId: event.transaction?.id,
      oldStatus: event.oldStatus,
      newStatus: event.newStatus,
    });
  }

  @OnEvent('transaction.completed')
  async onTransactionCompleted(event: TransactionCompletedEvent) {
    await this.log(event.userId, 'transaction', 'transaction.completed', {
      transactionId: event.transaction?.id,
      amount: event.transaction?.price,
    });
  }

  // ========== COMMISSION EVENTS ==========

  @OnEvent('commission.created')
  async onCommissionCreated(event: CommissionCreatedEvent) {
    await this.log(event.userId, 'finance', 'commission.created', {
      commissionId: event.commission?.id,
      amount: event.commission?.amount,
      isAutomatic: event.isAutomatic,
    });
  }

  @OnEvent('commission.paid')
  async onCommissionPaid(event: CommissionPaidEvent) {
    await this.log(event.userId, 'finance', 'commission.paid', {
      commissionId: event.commission?.id,
      amount: event.commission?.amount,
    });
  }

  // ========== INVOICE EVENTS ==========

  @OnEvent('invoice.created')
  async onInvoiceCreated(event: InvoiceCreatedEvent) {
    await this.log(event.userId, 'finance', 'invoice.created', {
      invoiceId: event.invoice?.id,
      amount: event.invoice?.amount,
    });
  }

  @OnEvent('invoice.paid')
  async onInvoicePaid(event: InvoicePaidEvent) {
    await this.log(event.userId, 'finance', 'invoice.paid', {
      invoiceId: event.invoice?.id,
      amount: event.invoice?.amount,
    });
  }

  // ========== PAYMENT EVENTS ==========

  @OnEvent('payment.received')
  async onPaymentReceived(event: PaymentReceivedEvent) {
    await this.log(event.userId, 'finance', 'payment.received', {
      paymentId: event.payment?.id,
      amount: event.payment?.amount,
    });
  }

  // ========== OWNER EVENTS ==========

  @OnEvent('owner.created')
  async onOwnerCreated(event: OwnerCreatedEvent) {
    await this.log(event.userId, 'owner', 'owner.created', {
      ownerId: event.owner?.id,
    });
  }

  // ========== APPOINTMENT EVENTS ==========

  @OnEvent('appointment.created')
  async onAppointmentCreated(event: AppointmentCreatedEvent) {
    await this.log(event.userId, 'appointment', 'appointment.created', {
      appointmentId: event.appointment?.id,
      type: event.appointment?.type,
      startTime: event.appointment?.startTime,
    });
  }

  @OnEvent('appointment.status_changed')
  async onAppointmentStatusChanged(event: AppointmentStatusChangedEvent) {
    await this.log(event.userId, 'appointment', 'appointment.status_changed', {
      appointmentId: event.appointment?.id,
      oldStatus: event.oldStatus,
      newStatus: event.newStatus,
    });
  }

  // ========== TASK EVENTS ==========

  @OnEvent('task.created')
  async onTaskCreated(event: TaskCreatedEvent) {
    await this.log(event.userId, 'task', 'task.created', {
      taskId: event.task?.id,
      title: event.task?.title,
      priority: event.task?.priority,
    });
  }

  @OnEvent('task.completed')
  async onTaskCompleted(event: TaskCompletedEvent) {
    await this.log(event.userId, 'task', 'task.completed', {
      taskId: event.task?.id,
      title: event.task?.title,
    });
  }

  // ========== PRIVATE HELPER ==========

  private async log(userId: string, eventType: string, eventName: string, metadata?: any) {
    try {
      await this.analyticsService.logEvent(userId, eventType, eventName, metadata);
    } catch (error) {
      this.logger.error(`Failed to log analytics event [${eventName}]: ${error?.message}`);
    }
  }
}
