import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../shared/services/database/database.service';

/**
 * Helper pour logger automatiquement les activités métier
 */
@Injectable()
export class BusinessActivityLogger {
  constructor(private readonly db: DatabaseService) {}

  // ========== MANDATES ==========

  /**
   * Log mandate creation
   */
  async logMandateCreated(userId: string, mandate: any) {
    try {
      await this.db.activity.create({
        data: {
          userId,
          type: 'mandate_created',
          description: `Mandat ${mandate.reference} créé (${mandate.type})`,
          entityType: 'mandate',
          entityId: mandate.id,
          metadata: {
            mandateId: mandate.id,
            reference: mandate.reference,
            type: mandate.type,
            category: mandate.category,
            ownerId: mandate.ownerId,
            propertyId: mandate.propertyId,
          },
        },
      });
    } catch (error) {
      console.error('Error logging mandate creation activity:', error);
    }
  }

  /**
   * Log mandate status change
   */
  async logMandateStatusChanged(userId: string, mandate: any, oldStatus: string, newStatus: string) {
    try {
      await this.db.activity.create({
        data: {
          userId,
          type: 'mandate_status_changed',
          description: `Mandat ${mandate.reference} : ${oldStatus} → ${newStatus}`,
          entityType: 'mandate',
          entityId: mandate.id,
          metadata: {
            mandateId: mandate.id,
            reference: mandate.reference,
            oldStatus,
            newStatus,
          },
        },
      });
    } catch (error) {
      console.error('Error logging mandate status change activity:', error);
    }
  }

  /**
   * Log mandate cancelled
   */
  async logMandateCancelled(userId: string, mandate: any, reason: string) {
    try {
      await this.db.activity.create({
        data: {
          userId,
          type: 'mandate_cancelled',
          description: `Mandat ${mandate.reference} annulé : ${reason}`,
          entityType: 'mandate',
          entityId: mandate.id,
          metadata: {
            mandateId: mandate.id,
            reference: mandate.reference,
            reason,
          },
        },
      });
    } catch (error) {
      console.error('Error logging mandate cancellation activity:', error);
    }
  }

  // ========== TRANSACTIONS ==========

  /**
   * Log transaction creation
   */
  async logTransactionCreated(userId: string, transaction: any) {
    try {
      await this.db.activity.create({
        data: {
          userId,
          type: 'transaction_created',
          description: `Transaction ${transaction.reference} créée (${transaction.type})`,
          entityType: 'transaction',
          entityId: transaction.id,
          metadata: {
            transactionId: transaction.id,
            reference: transaction.reference,
            type: transaction.type,
            status: transaction.status,
            propertyId: transaction.propertyId,
            prospectId: transaction.prospectId,
            offerPrice: transaction.offerPrice,
          },
        },
      });
    } catch (error) {
      console.error('Error logging transaction creation activity:', error);
    }
  }

  /**
   * Log transaction status change
   */
  async logTransactionStatusChanged(
    userId: string,
    transaction: any,
    oldStatus: string,
    newStatus: string,
  ) {
    try {
      await this.db.activity.create({
        data: {
          userId,
          type: 'transaction_status_changed',
          description: `Transaction ${transaction.reference} : ${oldStatus} → ${newStatus}`,
          entityType: 'transaction',
          entityId: transaction.id,
          metadata: {
            transactionId: transaction.id,
            reference: transaction.reference,
            oldStatus,
            newStatus,
            finalPrice: transaction.finalPrice,
          },
        },
      });
    } catch (error) {
      console.error('Error logging transaction status change activity:', error);
    }
  }

  /**
   * Log transaction completed
   */
  async logTransactionCompleted(userId: string, transaction: any) {
    try {
      await this.db.activity.create({
        data: {
          userId,
          type: 'transaction_completed',
          description: `${transaction.type === 'sale' ? 'Vente' : 'Location'} finalisée : ${transaction.reference} (${transaction.finalPrice} ${transaction.currency})`,
          entityType: 'transaction',
          entityId: transaction.id,
          metadata: {
            transactionId: transaction.id,
            reference: transaction.reference,
            type: transaction.type,
            finalPrice: transaction.finalPrice,
            currency: transaction.currency,
            propertyId: transaction.propertyId,
          },
        },
      });
    } catch (error) {
      console.error('Error logging transaction completion activity:', error);
    }
  }

  /**
   * Log transaction step added
   */
  async logTransactionStepAdded(userId: string, transaction: any, step: any) {
    try {
      await this.db.activity.create({
        data: {
          userId,
          type: 'transaction_step_added',
          description: `Étape ajoutée à ${transaction.reference} : ${step.name}`,
          entityType: 'transaction',
          entityId: transaction.id,
          metadata: {
            transactionId: transaction.id,
            reference: transaction.reference,
            stepName: step.name,
            stepStatus: step.status,
          },
        },
      });
    } catch (error) {
      console.error('Error logging transaction step activity:', error);
    }
  }

  // ========== COMMISSIONS ==========

  /**
   * Log commission created
   */
  async logCommissionCreated(userId: string, commission: any, isAutomatic: boolean = false) {
    try {
      await this.db.activity.create({
        data: {
          userId,
          type: 'commission_created',
          description: `Commission ${isAutomatic ? 'automatique' : 'manuelle'} créée : ${commission.amount} ${commission.currency} (${commission.type})`,
          entityType: 'commission',
          entityId: commission.id,
          metadata: {
            commissionId: commission.id,
            amount: commission.amount,
            currency: commission.currency,
            type: commission.type,
            transactionId: commission.transactionId,
            agentId: commission.agentId,
            isAutomatic,
          },
        },
      });
    } catch (error) {
      console.error('Error logging commission creation activity:', error);
    }
  }

  /**
   * Log commission status change
   */
  async logCommissionStatusChanged(userId: string, commission: any, oldStatus: string, newStatus: string) {
    try {
      await this.db.activity.create({
        data: {
          userId,
          type: 'commission_status_changed',
          description: `Commission ${commission.amount} ${commission.currency} : ${oldStatus} → ${newStatus}`,
          entityType: 'commission',
          entityId: commission.id,
          metadata: {
            commissionId: commission.id,
            amount: commission.amount,
            oldStatus,
            newStatus,
          },
        },
      });
    } catch (error) {
      console.error('Error logging commission status change activity:', error);
    }
  }

  // ========== INVOICES ==========

  /**
   * Log invoice created
   */
  async logInvoiceCreated(userId: string, invoice: any) {
    try {
      await this.db.activity.create({
        data: {
          userId,
          type: 'invoice_created',
          description: `Facture ${invoice.number} créée pour ${invoice.clientName} : ${invoice.totalAmount} ${invoice.currency}`,
          entityType: 'invoice',
          entityId: invoice.id,
          metadata: {
            invoiceId: invoice.id,
            number: invoice.number,
            clientName: invoice.clientName,
            totalAmount: invoice.totalAmount,
            currency: invoice.currency,
            transactionId: invoice.transactionId,
          },
        },
      });
    } catch (error) {
      console.error('Error logging invoice creation activity:', error);
    }
  }

  /**
   * Log invoice status change
   */
  async logInvoiceStatusChanged(userId: string, invoice: any, oldStatus: string, newStatus: string) {
    try {
      await this.db.activity.create({
        data: {
          userId,
          type: 'invoice_status_changed',
          description: `Facture ${invoice.number} : ${oldStatus} → ${newStatus}`,
          entityType: 'invoice',
          entityId: invoice.id,
          metadata: {
            invoiceId: invoice.id,
            number: invoice.number,
            oldStatus,
            newStatus,
          },
        },
      });
    } catch (error) {
      console.error('Error logging invoice status change activity:', error);
    }
  }

  // ========== PAYMENTS ==========

  /**
   * Log payment created
   */
  async logPaymentCreated(userId: string, payment: any) {
    try {
      const description = payment.invoiceId
        ? `Paiement reçu pour facture : ${payment.amount} ${payment.currency} (${payment.method})`
        : `Paiement commission : ${payment.amount} ${payment.currency} (${payment.method})`;

      await this.db.activity.create({
        data: {
          userId,
          type: 'payment_created',
          description,
          entityType: 'payment',
          entityId: payment.id,
          metadata: {
            paymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.method,
            invoiceId: payment.invoiceId,
            commissionId: payment.commissionId,
          },
        },
      });
    } catch (error) {
      console.error('Error logging payment creation activity:', error);
    }
  }

  // ========== OWNERS ==========

  /**
   * Log owner created
   */
  async logOwnerCreated(userId: string, owner: any) {
    try {
      await this.db.activity.create({
        data: {
          userId,
          type: 'owner_created',
          description: `Propriétaire créé : ${owner.firstName} ${owner.lastName}`,
          entityType: 'owner',
          entityId: owner.id,
          metadata: {
            ownerId: owner.id,
            firstName: owner.firstName,
            lastName: owner.lastName,
            email: owner.email,
            phone: owner.phone,
          },
        },
      });
    } catch (error) {
      console.error('Error logging owner creation activity:', error);
    }
  }
}
