import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../../notifications/notifications.service';

/**
 * Helper pour envoyer des notifications métier
 */
@Injectable()
export class BusinessNotificationHelper {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Notifier la création d'un mandat
   */
  async notifyMandateCreated(userId: string, mandate: any) {
    try {
      await this.notificationsService.createNotification({
        userId,
        type: 'mandate' as any,
        title: '✅ Nouveau mandat créé',
        message: `Mandat ${mandate.reference} créé pour ${mandate.owner?.firstName || ''} ${mandate.owner?.lastName || ''}`,
        actionUrl: `/mandates/${mandate.id}`,
        metadata: JSON.stringify({ mandateId: mandate.id }),
      });
    } catch (error) {
      console.error('Error sending mandate created notification:', error);
    }
  }

  /**
   * Notifier l'expiration imminente d'un mandat
   */
  async notifyMandateExpiring(userId: string, mandate: any, daysRemaining: number) {
    try {
      await this.notificationsService.createNotification({
        userId,
        type: 'mandate' as any,
        title: '⚠️ Mandat expirant bientôt',
        message: `Le mandat ${mandate.reference} expire dans ${daysRemaining} jours`,
        actionUrl: `/mandates/${mandate.id}`,
        metadata: JSON.stringify({ mandateId: mandate.id, daysRemaining }),
      });
    } catch (error) {
      console.error('Error sending mandate expiring notification:', error);
    }
  }

  /**
   * Notifier la création d'une transaction
   */
  async notifyTransactionCreated(userId: string, transaction: any) {
    try {
      await this.notificationsService.createNotification({
        userId,
        type: 'transaction' as any,
        title: '🆕 Nouvelle transaction',
        message: `Transaction ${transaction.reference} créée pour ${transaction.property?.title || 'une propriété'}`,
        actionUrl: `/transactions/${transaction.id}`,
        metadata: JSON.stringify({ transactionId: transaction.id }),
      });
    } catch (error) {
      console.error('Error sending transaction created notification:', error);
    }
  }

  /**
   * Notifier le changement de statut d'une transaction
   */
  async notifyTransactionStatusChanged(
    userId: string,
    transaction: any,
    oldStatus: string,
    newStatus: string,
  ) {
    try {
      let icon = '📝';
      if (newStatus === 'final_deed_signed') icon = '🎉';
      if (newStatus === 'cancelled') icon = '❌';

      await this.notificationsService.createNotification({
        userId,
        type: 'transaction' as any,
        title: `${icon} Transaction mise à jour`,
        message: `Transaction ${transaction.reference} : ${oldStatus} → ${newStatus}`,
        actionUrl: `/transactions/${transaction.id}`,
        metadata: JSON.stringify({
          transactionId: transaction.id,
          oldStatus,
          newStatus,
        }),
      });
    } catch (error) {
      console.error('Error sending transaction status changed notification:', error);
    }
  }

  /**
   * Notifier la finalisation d'une transaction
   */
  async notifyTransactionCompleted(userId: string, transaction: any) {
    try {
      await this.notificationsService.createNotification({
        userId,
        type: 'transaction' as any,
        title: '🎉 Transaction finalisée !',
        message: `La ${transaction.type === 'sale' ? 'vente' : 'location'} de ${transaction.property?.title} est finalisée (${transaction.finalPrice} ${transaction.currency})`,
        actionUrl: `/transactions/${transaction.id}`,
        metadata: JSON.stringify({
          transactionId: transaction.id,
          finalPrice: transaction.finalPrice,
        }),
      });
    } catch (error) {
      console.error('Error sending transaction completed notification:', error);
    }
  }

  /**
   * Notifier la création d'une commission
   */
  async notifyCommissionCreated(userId: string, commission: any) {
    try {
      await this.notificationsService.createNotification({
        userId,
        type: 'system' as any,
        title: '💰 Commission créée',
        message: `Commission de ${commission.amount} ${commission.currency} créée`,
        actionUrl: `/finance/commissions/${commission.id}`,
        metadata: JSON.stringify({ commissionId: commission.id }),
      });
    } catch (error) {
      console.error('Error sending commission created notification:', error);
    }
  }
}
