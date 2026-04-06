import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

/**
 * Service pour l'envoi d'emails automatiques
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private emailEnabled: boolean;

  constructor() {
    this.emailEnabled = this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   * Returns true if email is configured and enabled, false otherwise
   */
  private initializeTransporter(): boolean {
    try {
      // Check if email configuration is available
      const {
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS,
        SMTP_FROM,
      } = process.env;

      if (!SMTP_HOST || !SMTP_USER) {
        this.logger.warn(
          '⚠️ Email not configured. Set SMTP_* env variables to enable email notifications.',
        );
        return false;
      }

      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587'),
        secure: SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      this.logger.log('✅ Email service initialized successfully');
      return true;
    } catch (error) {
      this.logger.error('❌ Failed to initialize email service:', error);
      return false;
    }
  }

  /**
   * Send a generic email
   */
  private async sendEmail(to: string, subject: string, html: string) {
    if (!this.emailEnabled) {
      this.logger.debug(`Email not sent (disabled): ${subject} to ${to}`);
      return;
    }

    try {
      const from = process.env.SMTP_FROM || process.env.SMTP_USER;

      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });

      this.logger.log(`📧 Email sent: ${subject} to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${to}:`, error);
    }
  }

  // ========== BUSINESS EMAIL TEMPLATES ==========

  /**
   * Send email for new mandate created
   */
  async sendMandateCreatedEmail(
    userEmail: string,
    mandate: any,
  ) {
    const subject = `✅ Nouveau mandat créé : ${mandate.reference}`;
    const html = `
      <h2>Nouveau Mandat Créé</h2>
      <p>Un nouveau mandat a été créé avec succès.</p>

      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Référence:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${mandate.reference}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Type:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${mandate.type}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Catégorie:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${mandate.category}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date début:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${new Date(mandate.startDate).toLocaleDateString('fr-FR')}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date fin:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${new Date(mandate.endDate).toLocaleDateString('fr-FR')}</td>
        </tr>
      </table>

      <p style="margin-top: 20px;">
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/mandates/${mandate.id}"
           style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Voir le mandat
        </a>
      </p>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send email for mandate expiring soon
   */
  async sendMandateExpiringEmail(
    userEmail: string,
    mandate: any,
    daysRemaining: number,
  ) {
    const subject = `⚠️ Mandat expirant bientôt : ${mandate.reference} (${daysRemaining} jours)`;
    const html = `
      <h2 style="color: #ff9800;">⚠️ Mandat Expirant Bientôt</h2>
      <p>Le mandat <strong>${mandate.reference}</strong> expire dans <strong>${daysRemaining} jours</strong>.</p>

      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Référence:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${mandate.reference}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date d'expiration:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${new Date(mandate.endDate).toLocaleDateString('fr-FR')}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Propriétaire:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${mandate.owner?.firstName || ''} ${mandate.owner?.lastName || ''}</td>
        </tr>
      </table>

      <p style="margin-top: 20px; color: #666;">
        Pensez à renouveler ce mandat avant son expiration.
      </p>

      <p>
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/mandates/${mandate.id}"
           style="background-color: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Gérer le mandat
        </a>
      </p>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send email for new transaction created
   */
  async sendTransactionCreatedEmail(
    userEmail: string,
    transaction: any,
  ) {
    const subject = `🆕 Nouvelle transaction : ${transaction.reference}`;
    const html = `
      <h2>Nouvelle Transaction Créée</h2>
      <p>Une nouvelle transaction a été créée.</p>

      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Référence:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${transaction.reference}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Type:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${transaction.type === 'sale' ? 'Vente' : 'Location'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Propriété:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${transaction.property?.title || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Prix offert:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${transaction.offerPrice} ${transaction.currency}</td>
        </tr>
      </table>

      <p style="margin-top: 20px;">
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/transactions/${transaction.id}"
           style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Voir la transaction
        </a>
      </p>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send email for transaction completed
   */
  async sendTransactionCompletedEmail(
    userEmail: string,
    transaction: any,
  ) {
    const subject = `🎉 Transaction finalisée : ${transaction.reference}`;
    const html = `
      <h2 style="color: #4CAF50;">🎉 Transaction Finalisée !</h2>
      <p>Félicitations ! La transaction <strong>${transaction.reference}</strong> a été finalisée avec succès.</p>

      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Référence:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${transaction.reference}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Type:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${transaction.type === 'sale' ? 'Vente' : 'Location'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Propriété:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${transaction.property?.title || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Prix final:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>${transaction.finalPrice} ${transaction.currency}</strong></td>
        </tr>
      </table>

      <p style="margin-top: 20px;">
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/transactions/${transaction.id}"
           style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Voir les détails
        </a>
      </p>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send email for commission created
   */
  async sendCommissionCreatedEmail(
    userEmail: string,
    commission: any,
  ) {
    const subject = `💰 Commission créée : ${commission.amount} ${commission.currency}`;
    const html = `
      <h2>💰 Nouvelle Commission</h2>
      <p>Une nouvelle commission a été créée.</p>

      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Montant:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>${commission.amount} ${commission.currency}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Type:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${commission.type}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Statut:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${commission.status}</td>
        </tr>
      </table>

      <p style="margin-top: 20px;">
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/finance/commissions/${commission.id}"
           style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Voir la commission
        </a>
      </p>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send email for overdue invoice
   */
  async sendOverdueInvoiceEmail(
    userEmail: string,
    invoice: any,
    daysOverdue: number,
  ) {
    const subject = `⚠️ Facture en retard : ${invoice.number} (${daysOverdue} jours)`;
    const html = `
      <h2 style="color: #f44336;">⚠️ Facture en Retard</h2>
      <p>La facture <strong>${invoice.number}</strong> est en retard de <strong>${daysOverdue} jours</strong>.</p>

      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Numéro:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${invoice.number}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Client:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${invoice.clientName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Montant total:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${invoice.totalAmount} ${invoice.currency}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date d'échéance:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</td>
        </tr>
      </table>

      <p style="margin-top: 20px; color: #666;">
        Veuillez relancer le client pour le paiement de cette facture.
      </p>

      <p>
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/finance/invoices/${invoice.id}"
           style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Gérer la facture
        </a>
      </p>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send welcome email to property owner when a mandate is created
   */
  async sendOwnerWelcomeEmail(ownerEmail: string, mandate: any) {
    const subject = `🏠 Bienvenue – Mandat ${mandate.reference} signé avec succès`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Bienvenue chez CRM Immobilier !</h2>
        <p>Votre mandat a été enregistré avec succès. Voici un récapitulatif :</p>

        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Référence :</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${mandate.reference}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Type :</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${mandate.type}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Catégorie :</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${mandate.category}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date de début :</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${new Date(mandate.startDate).toLocaleDateString('fr-FR')}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date de fin :</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${new Date(mandate.endDate).toLocaleDateString('fr-FR')}</td>
          </tr>
        </table>

        <p style="margin-top: 20px; color: #555;">
          Notre équipe prend en charge votre bien et vous contactera prochainement.
          N'hésitez pas à nous contacter pour toute question.
        </p>
        <p style="color: #999; font-size: 12px;">L'équipe CRM Immobilier</p>
      </div>
    `;

    await this.sendEmail(ownerEmail, subject, html);
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmationEmail(userEmail: string, payment: any) {
    const subject = `✅ Confirmation de paiement – ${payment.amount} ${payment.currency}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">✅ Paiement confirmé</h2>
        <p>Votre paiement a bien été enregistré. Voici le détail :</p>

        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Montant :</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>${payment.amount} ${payment.currency}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Méthode :</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${payment.method || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date :</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${new Date().toLocaleDateString('fr-FR')}</td>
          </tr>
          ${payment.reference ? `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Référence :</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${payment.reference}</td>
          </tr>` : ''}
        </table>

        <p style="margin-top: 20px; color: #555;">
          Merci pour votre paiement. Conservez cet email comme justificatif.
        </p>
        <p style="color: #999; font-size: 12px;">L'équipe CRM Immobilier</p>
      </div>
    `;

    await this.sendEmail(userEmail, subject, html);
  }
}
