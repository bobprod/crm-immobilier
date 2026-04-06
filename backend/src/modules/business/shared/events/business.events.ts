/**
 * Événements métier pour l'architecture événementielle
 *
 * Ces événements sont émis par les services métier et écoutés par les handlers
 * pour implémenter un découplage complet entre les modules.
 */

// ========== MANDATE EVENTS ==========

export class MandateCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly mandate: any,
  ) {}
}

export class MandateStatusChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly mandate: any,
    public readonly oldStatus: string,
    public readonly newStatus: string,
  ) {}
}

export class MandateExpiringEvent {
  constructor(
    public readonly userId: string,
    public readonly mandate: any,
    public readonly daysRemaining: number,
  ) {}
}

export class MandateExpiredEvent {
  constructor(
    public readonly userId: string,
    public readonly mandate: any,
  ) {}
}

export class MandateCancelledEvent {
  constructor(
    public readonly userId: string,
    public readonly mandate: any,
    public readonly reason: string,
  ) {}
}

export class MandateRenewedEvent {
  constructor(
    public readonly userId: string,
    public readonly oldMandate: any,
    public readonly newMandate: any,
  ) {}
}

// ========== TRANSACTION EVENTS ==========

export class TransactionCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly transaction: any,
  ) {}
}

export class TransactionStatusChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly transaction: any,
    public readonly oldStatus: string,
    public readonly newStatus: string,
  ) {}
}

export class TransactionCompletedEvent {
  constructor(
    public readonly userId: string,
    public readonly transaction: any,
  ) {}
}

export class TransactionCancelledEvent {
  constructor(
    public readonly userId: string,
    public readonly transaction: any,
    public readonly reason: string,
  ) {}
}

export class TransactionStepAddedEvent {
  constructor(
    public readonly userId: string,
    public readonly transaction: any,
    public readonly step: any,
  ) {}
}

// ========== COMMISSION EVENTS ==========

export class CommissionCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly commission: any,
    public readonly isAutomatic: boolean = false,
  ) {}
}

export class CommissionStatusChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly commission: any,
    public readonly oldStatus: string,
    public readonly newStatus: string,
  ) {}
}

export class CommissionPaidEvent {
  constructor(
    public readonly userId: string,
    public readonly commission: any,
  ) {}
}

// ========== INVOICE EVENTS ==========

export class InvoiceCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly invoice: any,
  ) {}
}

export class InvoiceStatusChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly invoice: any,
    public readonly oldStatus: string,
    public readonly newStatus: string,
  ) {}
}

export class InvoiceOverdueEvent {
  constructor(
    public readonly userId: string,
    public readonly invoice: any,
    public readonly daysOverdue: number,
  ) {}
}

export class InvoicePaidEvent {
  constructor(
    public readonly userId: string,
    public readonly invoice: any,
  ) {}
}

// ========== PAYMENT EVENTS ==========

export class PaymentCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly payment: any,
  ) {}
}

export class PaymentReceivedEvent {
  constructor(
    public readonly userId: string,
    public readonly payment: any,
    public readonly invoice?: any,
    public readonly commission?: any,
  ) {}
}

// ========== PROPERTY EVENTS ==========

export class PropertyCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly property: any,
  ) {}
}

export class PropertyStatusChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly property: any,
    public readonly oldStatus: string,
    public readonly newStatus: string,
  ) {}
}

export class PropertyPublishedEvent {
  constructor(
    public readonly userId: string,
    public readonly property: any,
  ) {}
}

export class PropertySoldEvent {
  constructor(
    public readonly userId: string,
    public readonly property: any,
    public readonly transaction: any,
  ) {}
}

// ========== OWNER EVENTS ==========

export class OwnerCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly owner: any,
  ) {}
}

// ========== PROSPECT EVENTS ==========

export class ProspectCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly prospect: any,
  ) {}
}

export class ProspectStatusChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly prospect: any,
    public readonly oldStatus: string,
    public readonly newStatus: string,
  ) {}
}

export class ProspectConvertedEvent {
  constructor(
    public readonly userId: string,
    public readonly prospect: any,
  ) {}
}

// ========== APPOINTMENT EVENTS ==========

export class AppointmentCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly appointment: any,
  ) {}
}

export class AppointmentStatusChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly appointment: any,
    public readonly oldStatus: string,
    public readonly newStatus: string,
  ) {}
}

// ========== TASK EVENTS ==========

export class TaskCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly task: any,
  ) {}
}

export class TaskCompletedEvent {
  constructor(
    public readonly userId: string,
    public readonly task: any,
  ) {}
}
