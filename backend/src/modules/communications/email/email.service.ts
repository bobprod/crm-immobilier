import { Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from '../integrations.service';

/**
 * 📧 Service Email avec support multi-providers et multi-tenant
 *
 * Providers supportés:
 * - Resend (recommandé - moderne, simple)
 * - SendGrid (classique - feature-rich)
 *
 * Configuration:
 * 1. Par utilisateur (via IntegrationsService) - Prioritaire
 * 2. Par .env (fallback global)
 *
 * Mode multi-tenant: Chaque user peut configurer ses propres clés API
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly defaultFromEmail: string;

  constructor(private integrationsService: IntegrationsService) {
    this.defaultFromEmail = process.env.EMAIL_FROM || 'notifications@crm-immobilier.com';
  }

  /**
   * 📤 Envoyer un email avec les credentials de l'utilisateur
   * Méthode principale pour le mode multi-tenant
   */
  async sendForUser(userId: string, options: EmailOptions): Promise<EmailResult> {
    try {
      // Essayer d'abord avec les credentials utilisateur
      try {
        const resendConfig = await this.integrationsService.getDecryptedConfig(userId, 'resend');
        if (resendConfig.resendApiKey) {
          this.logger.log(`Sending email via user's Resend to ${options.to}`);
          return await this.sendWithResend(options, resendConfig.resendApiKey);
        }
      } catch (e) {
        // Pas de Resend user, essayer SendGrid
      }

      try {
        const sendgridConfig = await this.integrationsService.getDecryptedConfig(userId, 'sendgrid');
        if (sendgridConfig.sendgridApiKey) {
          this.logger.log(`Sending email via user's SendGrid to ${options.to}`);
          return await this.sendWithSendGrid(options, sendgridConfig.sendgridApiKey);
        }
      } catch (e) {
        // Pas de SendGrid user
      }

      // Fallback sur les credentials globaux .env
      this.logger.warn(`No user email config found for ${userId}, using global .env fallback`);
      return await this.send(options);
    } catch (error) {
      this.logger.error(`Failed to send email for user: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 📤 Envoyer un email (fallback avec credentials globaux .env)
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const provider = process.env.EMAIL_PROVIDER || 'resend';
      this.logger.log(`Sending email to ${options.to} via global ${provider}`);

      // Sélectionner le provider
      switch (provider) {
        case 'resend':
          const resendKey = process.env.RESEND_API_KEY;
          if (!resendKey) {
            throw new Error('RESEND_API_KEY not configured in .env');
          }
          return await this.sendWithResend(options, resendKey);

        case 'sendgrid':
          const sendgridKey = process.env.SENDGRID_API_KEY;
          if (!sendgridKey) {
            throw new Error('SENDGRID_API_KEY not configured in .env');
          }
          return await this.sendWithSendGrid(options, sendgridKey);

        default:
          throw new Error(`Unknown email provider: ${provider}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 📧 Envoyer email de notification
   * Template prédéfini pour les notifications système
   */
  async sendNotificationEmail(
    to: string,
    notification: {
      title: string;
      message: string;
      actionUrl?: string;
      type?: string;
    },
  ): Promise<EmailResult> {
    const html = this.getNotificationTemplate(notification);
    const text = `${notification.title}\n\n${notification.message}${
      notification.actionUrl ? `\n\nLien: ${notification.actionUrl}` : ''
    }`;

    return this.send({
      to,
      subject: notification.title,
      html,
      text,
    });
  }

  /**
   * 🎨 Template HTML pour notification
   */
  private getNotificationTemplate(notification: {
    title: string;
    message: string;
    actionUrl?: string;
    type?: string;
  }): string {
    const typeColors: Record<string, string> = {
      appointment: '#3B82F6', // blue
      task: '#F59E0B', // amber
      lead: '#10B981', // green
      system: '#6B7280', // gray
      property: '#8B5CF6', // purple
      message: '#EC4899', // pink
    };

    const color = typeColors[notification.type || 'system'] || '#6B7280';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: ${color}; padding: 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🏠 CRM Immobilier
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">
                ${notification.title}
              </h2>
              <p style="margin: 0; color: #4B5563; font-size: 16px; line-height: 1.6;">
                ${notification.message}
              </p>

              ${
                notification.actionUrl
                  ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${notification.actionUrl}"
                       style="display: inline-block; background-color: ${color}; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Voir →
                    </a>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6B7280; font-size: 14px;">
                Vous recevez cet email car vous êtes inscrit sur CRM Immobilier
              </p>
              <p style="margin: 8px 0 0 0; color: #9CA3AF; font-size: 12px;">
                Pour modifier vos préférences de notification, connectez-vous à votre compte
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * 📨 Resend Provider
   */
  private async sendWithResend(options: EmailOptions): Promise<EmailResult> {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    try {
      // Utiliser l'API Resend
      // https://resend.com/docs/api-reference/emails/send-email
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: options.from || this.fromEmail,
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
          cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
          bcc: options.bcc
            ? Array.isArray(options.bcc)
              ? options.bcc
              : [options.bcc]
            : undefined,
          reply_to: options.replyTo,
          attachments: options.attachments,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Resend API error');
      }

      const data = await response.json();

      return {
        success: true,
        messageId: data.id,
      };
    } catch (error) {
      throw new Error(`Resend error: ${error.message}`);
    }
  }

  /**
   * 📬 SendGrid Provider
   */
  private async sendWithSendGrid(options: EmailOptions): Promise<EmailResult> {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    try {
      // Utiliser l'API SendGrid
      // https://docs.sendgrid.com/api-reference/mail-send/mail-send
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: Array.isArray(options.to)
                ? options.to.map((email) => ({ email }))
                : [{ email: options.to }],
              cc: options.cc
                ? Array.isArray(options.cc)
                  ? options.cc.map((email) => ({ email }))
                  : [{ email: options.cc }]
                : undefined,
              bcc: options.bcc
                ? Array.isArray(options.bcc)
                  ? options.bcc.map((email) => ({ email }))
                  : [{ email: options.bcc }]
                : undefined,
            },
          ],
          from: { email: options.from || this.fromEmail },
          subject: options.subject,
          content: [
            ...(options.html ? [{ type: 'text/html', value: options.html }] : []),
            ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
          ],
          reply_to: options.replyTo ? { email: options.replyTo } : undefined,
          attachments: options.attachments?.map((att) => ({
            filename: att.filename,
            content: Buffer.from(att.content).toString('base64'),
            type: att.contentType,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.message || 'SendGrid API error');
      }

      // SendGrid retourne un 202 sans body pour succès
      return {
        success: true,
        messageId: response.headers.get('x-message-id') || undefined,
      };
    } catch (error) {
      throw new Error(`SendGrid error: ${error.message}`);
    }
  }

  /**
   * 📮 SMTP Provider (fallback générique)
   */
  private async sendWithSMTP(options: EmailOptions): Promise<EmailResult> {
    // Note: Pour SMTP, il faudrait utiliser nodemailer
    // Ici on fait juste un placeholder pour montrer la structure
    throw new Error('SMTP provider not yet implemented. Use Resend or SendGrid.');
  }
}
