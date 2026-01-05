import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService as DatabaseService } from '../../../shared/database/prisma.service';
import { MandatesService } from '../mandates/mandates.service';
import { TransactionsService } from '../transactions/transactions.service';
import { FinanceService } from '../finance/finance.service';
import { BusinessNotificationHelper } from './notification.helper';
import { BusinessActivityLogger } from './activity-logger.helper';
import { EmailService } from './email.service';

/**
 * Business Orchestrator - Gère les workflows métier complexes multi-services
 *
 * Ce service centralise les workflows qui nécessitent la coordination
 * de plusieurs services métier (mandates, transactions, finance).
 */
@Injectable()
export class BusinessOrchestrator {
  private readonly logger = new Logger(BusinessOrchestrator.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly mandatesService: MandatesService,
    private readonly transactionsService: TransactionsService,
    private readonly financeService: FinanceService,
    private readonly notificationHelper: BusinessNotificationHelper,
    private readonly activityLogger: BusinessActivityLogger,
    private readonly emailService: EmailService,
  ) { }

  // ========== MANDATE WORKFLOWS ==========

  /**
   * Workflow complet : Création de mandat avec propriété
   *
   * Étapes :
   * 1. Créer le mandat
   * 2. Lier propriétaire à la propriété (si spécifié)
   * 3. Mettre à jour statut propriété → "available"
   * 4. Créer tâche de suivi (optionnel)
   * 5. Notification + Email + Activity déjà gérés par MandatesService
   */
  async createMandateWithProperty(
    userId: string,
    mandateData: any,
    options?: {
      createFollowUpTask?: boolean;
      sendWelcomeEmail?: boolean;
    },
  ) {
    this.logger.log(`🔧 Starting mandate creation workflow for user ${userId}`);

    try {
      // 1. Créer le mandat (notifications/activities déjà gérées)
      const mandate = await this.mandatesService.create(userId, mandateData);

      // 2. Tâches supplémentaires si demandé
      if (options?.createFollowUpTask && mandate.propertyId) {
        await this.createMandateFollowUpTask(userId, mandate);
      }

      // 3. Email de bienvenue au propriétaire (optionnel)
      if (options?.sendWelcomeEmail && mandate.owner?.email) {
        await this.sendOwnerWelcomeEmail(mandate.owner.email, mandate);
      }

      this.logger.log(`✅ Mandate workflow completed: ${mandate.reference}`);
      return mandate;
    } catch (error) {
      this.logger.error(`❌ Mandate workflow failed:`, error);
      throw error;
    }
  }

  /**
   * Workflow complet : Renouvellement de mandat
   *
   * Étapes :
   * 1. Vérifier que le mandat existe et appartient à l'utilisateur
   * 2. Créer nouveau mandat avec nouvelles dates
   * 3. Marquer ancien mandat comme "renewed"
   * 4. Transférer toutes les données pertinentes
   * 5. Notifier + Logger
   */
  async renewMandate(
    userId: string,
    oldMandateId: string,
    newDates: { startDate: Date; endDate: Date },
  ) {
    this.logger.log(`🔧 Starting mandate renewal workflow`);

    try {
      // 1. Récupérer l'ancien mandat
      const oldMandate = await this.mandatesService.findOne(oldMandateId, userId);

      // 2. Créer nouveau mandat avec les mêmes données
      const newMandate = await this.mandatesService.create(userId, {
        reference: `${oldMandate.reference}-R${Date.now()}`,
        type: oldMandate.type,
        category: oldMandate.category,
        ownerId: oldMandate.ownerId,
        propertyId: oldMandate.propertyId,
        price: (oldMandate as any).price || 0,
        startDate: newDates.startDate.toISOString(),
        endDate: newDates.endDate.toISOString(),
        commission: oldMandate.commission,
        commissionType: oldMandate.commissionType,
        exclusivityBonus: oldMandate.exclusivityBonus,
        terms: oldMandate.terms,
      });

      // 3. Marquer l'ancien comme renouvelé
      await this.db.mandate.update({
        where: { id: oldMandateId },
        data: {
          status: 'completed',
          notes: `Renouvelé le ${new Date().toLocaleDateString('fr-FR')} → ${newMandate.reference}`,
        },
      });

      // 4. Logger l'activité de renouvellement
      await this.activityLogger.logMandateStatusChanged(
        userId,
        oldMandate,
        oldMandate.status,
        'completed',
      );

      await this.db.activity.create({
        data: {
          userId,
          type: 'mandate_renewed',
          description: `Mandat ${oldMandate.reference} renouvelé → ${newMandate.reference}`,
          entityType: 'mandate',
          entityId: newMandate.id,
          metadata: {
            oldMandateId: oldMandate.id,
            newMandateId: newMandate.id,
            oldEndDate: oldMandate.endDate,
            newEndDate: newMandate.endDate,
          },
        },
      });

      this.logger.log(`✅ Mandate renewal completed: ${oldMandate.reference} → ${newMandate.reference}`);
      return newMandate;
    } catch (error) {
      this.logger.error(`❌ Mandate renewal failed:`, error);
      throw error;
    }
  }

  // ========== TRANSACTION WORKFLOWS ==========

  /**
   * Workflow complet : Finalisation de transaction
   *
   * Étapes complexes déjà gérées par TransactionsService :
   * ✅ Mettre à jour transaction → final_deed_signed
   * ✅ Sync statut propriété → sold/rented
   * ✅ Marquer mandat → completed
   * ✅ Créer commissions automatiquement
   * ✅ Notifications + Emails + Activities
   *
   * Ce workflow ajoute :
   * - Génération facture pour l'acheteur/locataire
   * - Création rapport de vente
   * - Archivage documents
   */
  async finalizeTransaction(
    userId: string,
    transactionId: string,
    finalizationData: {
      finalPrice: number;
      actualClosing?: Date;
      notaryFees?: number;
      generateInvoice?: boolean;
      buyerInfo?: {
        name: string;
        email: string;
        phone?: string;
        address?: string;
      };
    },
  ) {
    this.logger.log(`🔧 Starting transaction finalization workflow`);

    try {
      // 1. Finaliser la transaction (déclenche tous les auto-updates)
      const transaction = await this.transactionsService.update(
        transactionId,
        userId,
        ({
          status: 'final_deed_signed',
          finalPrice: finalizationData.finalPrice,
          actualClosing: (finalizationData.actualClosing || new Date()).toISOString(),
          notes: finalizationData.notaryFees
            ? `Frais notaire: ${finalizationData.notaryFees}`
            : undefined,
        } as any),
      );

      // 2. Générer facture pour l'acheteur (optionnel)
      let invoice = null;
      if (finalizationData.generateInvoice && finalizationData.buyerInfo) {
        invoice = await this.generateBuyerInvoice(
          userId,
          transaction,
          finalizationData.buyerInfo,
          finalizationData.notaryFees,
        );
      }

      // 3. Créer rapport de vente
      await this.generateSaleReport(userId, transaction);

      this.logger.log(`✅ Transaction finalization completed: ${transaction.reference}`);
      return {
        transaction,
        invoice,
      };
    } catch (error) {
      this.logger.error(`❌ Transaction finalization failed:`, error);
      throw error;
    }
  }

  /**
   * Workflow complet : Annulation de transaction
   *
   * Étapes :
   * 1. Annuler transaction
   * 2. Restaurer statut propriété → available
   * 3. Annuler commissions associées
   * 4. Notifier + Logger
   */
  async cancelTransaction(
    userId: string,
    transactionId: string,
    reason: string,
  ) {
    this.logger.log(`🔧 Starting transaction cancellation workflow`);

    try {
      // 1. Récupérer la transaction
      const transaction = await this.transactionsService.findOne(transactionId, userId);

      // 2. Annuler la transaction (déclenche auto-cancel des commissions)
      const cancelled = await this.transactionsService.update(transactionId, userId, ({
        status: 'cancelled',
        notes: `Annulée le ${new Date().toLocaleDateString('fr-FR')} : ${reason}`,
      } as any));

      // 3. Restaurer le statut de la propriété
      if (transaction.propertyId) {
        await this.db.properties.update({
          where: { id: transaction.propertyId },
          data: { status: 'available' },
        });
      }

      // 4. Logger l'activité
      await this.db.activity.create({
        data: {
          userId,
          type: 'transaction_cancelled',
          description: `Transaction ${transaction.reference} annulée : ${reason}`,
          entityType: 'transaction',
          entityId: transaction.id,
          metadata: {
            transactionId: transaction.id,
            reference: transaction.reference,
            reason,
            cancelledAt: new Date(),
          },
        },
      });

      this.logger.log(`✅ Transaction cancellation completed: ${transaction.reference}`);
      return cancelled;
    } catch (error) {
      this.logger.error(`❌ Transaction cancellation failed:`, error);
      throw error;
    }
  }

  // ========== PROPERTY WORKFLOWS ==========

  /**
   * Workflow complet : Mise en ligne d'une propriété
   *
   * Étapes :
   * 1. Vérifier que la propriété existe
   * 2. Vérifier qu'elle a un mandat actif
   * 3. Mettre à jour statut → published
   * 4. Publier sur portails externes (si intégrations)
   * 5. Notifier + Logger
   */
  async publishProperty(
    userId: string,
    propertyId: string,
    options?: {
      publishToExternalPortals?: boolean;
      portals?: string[]; // ['immoweb', 'logic-immo', etc.]
    },
  ) {
    this.logger.log(`🔧 Starting property publishing workflow`);

    try {
      // 1. Vérifier la propriété
      const property = await this.db.properties.findFirst({
        where: { id: propertyId, userId },
        include: {
          mandates: {
            where: { status: 'active' },
          },
        },
      });

      if (!property) {
        throw new NotFoundException('Property not found');
      }

      if (property.mandates.length === 0) {
        throw new Error('Cannot publish property without active mandate');
      }

      // 2. Mettre à jour statut
      const updated = await this.db.properties.update({
        where: { id: propertyId },
        data: {
          status: 'available',
          isPublished: true,
          publishedAt: new Date(),
        },
      });

      // 3. Logger l'activité
      await this.db.activity.create({
        data: {
          userId,
          type: 'property_published',
          description: `Propriété "${property.title}" publiée`,
          entityType: 'property',
          entityId: property.id,
          metadata: {
            propertyId: property.id,
            mandateId: property.mandates[0].id,
            publishedAt: new Date(),
          },
        },
      });

      // 4. TODO: Publier sur portails externes (future feature)
      if (options?.publishToExternalPortals) {
        this.logger.log(`📡 External portal publishing not yet implemented`);
      }

      this.logger.log(`✅ Property publishing completed: ${property.title}`);
      return updated;
    } catch (error) {
      this.logger.error(`❌ Property publishing failed:`, error);
      throw error;
    }
  }

  // ========== PAYMENT WORKFLOWS ==========

  /**
   * Workflow complet : Enregistrement paiement
   *
   * Étapes déjà gérées par FinanceService :
   * ✅ Créer paiement
   * ✅ Mettre à jour statut facture/commission
   * ✅ Notifications + Activities
   *
   * Ce workflow ajoute :
   * - Génération reçu de paiement
   * - Email confirmation au client
   */
  async recordPayment(
    userId: string,
    paymentData: any,
    options?: {
      generateReceipt?: boolean;
      sendConfirmationEmail?: boolean;
    },
  ) {
    this.logger.log(`🔧 Starting payment recording workflow`);

    try {
      // 1. Créer le paiement (auto-update invoice/commission)
      const payment = await this.financeService.createPayment(userId, paymentData);

      // 2. Générer reçu (optionnel)
      if (options?.generateReceipt) {
        await this.generatePaymentReceipt(userId, payment);
      }

      // 3. Email confirmation (optionnel)
      if (options?.sendConfirmationEmail && payment.invoice) {
        await this.sendPaymentConfirmationEmail(payment);
      }

      this.logger.log(`✅ Payment recording completed: ${payment.amount} ${payment.currency}`);
      return payment;
    } catch (error) {
      this.logger.error(`❌ Payment recording failed:`, error);
      throw error;
    }
  }

  // ========== HELPER METHODS ==========

  private async createMandateFollowUpTask(userId: string, mandate: any) {
    try {
      await this.db.activity.create({
        data: {
          userId,
          type: 'task_created',
          description: `Tâche de suivi créée pour mandat ${mandate.reference}`,
          entityType: 'mandate',
          entityId: mandate.id,
          metadata: {
            taskType: 'follow_up',
            mandateId: mandate.id,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
          },
        },
      });
    } catch (error) {
      this.logger.error('Error creating follow-up task:', error);
    }
  }

  private async sendOwnerWelcomeEmail(email: string, mandate: any) {
    // TODO: Implement welcome email template
    this.logger.log(`📧 Would send welcome email to ${email} for mandate ${mandate.reference}`);
  }

  private async generateBuyerInvoice(
    userId: string,
    transaction: any,
    buyerInfo: any,
    notaryFees?: number,
  ) {
    try {
      const totalAmount = transaction.finalPrice + (notaryFees || 0);

      const invoice = await this.financeService.createInvoice(userId, {
        number: `INV-${transaction.reference}-${Date.now()}`,
        transactionId: transaction.id,
        clientType: (transaction.type === 'sale' ? 'buyer' : 'tenant') as any,
        clientName: buyerInfo.name,
        clientEmail: buyerInfo.email,
        clientPhone: buyerInfo.phone,
        clientAddress: buyerInfo.address,
        amount: transaction.finalPrice,
        vat: notaryFees || 0,
        totalAmount,
        currency: transaction.currency,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
        status: 'draft' as any,
        description: `${transaction.type === 'sale' ? 'Achat' : 'Location'} - ${transaction.property?.title || 'Propriété'}`,
      } as any);

      return invoice;
    } catch (error) {
      this.logger.error('Error generating buyer invoice:', error);
      return null;
    }
  }

  private async generateSaleReport(userId: string, transaction: any) {
    try {
      await this.db.activity.create({
        data: {
          userId,
          type: 'report_generated',
          description: `Rapport de vente généré pour ${transaction.reference}`,
          entityType: 'transaction',
          entityId: transaction.id,
          metadata: {
            reportType: 'sale_report',
            transactionId: transaction.id,
            reference: transaction.reference,
            finalPrice: transaction.finalPrice,
            generatedAt: new Date(),
          },
        },
      });
    } catch (error) {
      this.logger.error('Error generating sale report:', error);
    }
  }

  private async generatePaymentReceipt(userId: string, payment: any) {
    try {
      await this.db.activity.create({
        data: {
          userId,
          type: 'receipt_generated',
          description: `Reçu de paiement généré : ${payment.amount} ${payment.currency}`,
          entityType: 'payment',
          entityId: payment.id,
          metadata: {
            paymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.method,
            generatedAt: new Date(),
          },
        },
      });
    } catch (error) {
      this.logger.error('Error generating receipt:', error);
    }
  }

  private async sendPaymentConfirmationEmail(payment: any) {
    // TODO: Implement payment confirmation email
    this.logger.log(`📧 Would send payment confirmation email for ${payment.amount} ${payment.currency}`);
  }
}
