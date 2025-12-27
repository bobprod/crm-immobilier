import { Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from '../integrations.service';

/**
 * 📱 Service SMS avec Twilio et support multi-tenant
 *
 * Fonctionnalités:
 * - Envoi SMS
 * - Envoi WhatsApp (via Twilio)
 * - Validation numéros de téléphone
 * - Gestion erreurs
 *
 * Configuration:
 * 1. Par utilisateur (via IntegrationsService) - Prioritaire
 * 2. Par .env (fallback global)
 *
 * Mode multi-tenant: Chaque user peut configurer ses propres credentials Twilio
 */

export interface SmsOptions {
  to: string; // Format E.164: +33612345678
  message: string;
  from?: string;
}

export interface WhatsAppOptions {
  to: string; // Format E.164: +33612345678
  message: string;
  from?: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

export interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  phoneNumber?: string;
  whatsappNumber?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private integrationsService: IntegrationsService) {}

  /**
   * 📤 Envoyer un SMS avec les credentials de l'utilisateur
   * Méthode principale pour le mode multi-tenant
   */
  async sendSmsForUser(userId: string, options: SmsOptions): Promise<SmsResult> {
    try {
      // Essayer d'abord avec les credentials utilisateur
      try {
        const twilioConfig = await this.integrationsService.getDecryptedConfig(userId, 'twilio');
        if (twilioConfig.twilioAccountSid && twilioConfig.twilioAuthToken) {
          this.logger.log(`Sending SMS via user's Twilio to ${options.to}`);
          return await this.sendSms(options, {
            accountSid: twilioConfig.twilioAccountSid,
            authToken: twilioConfig.twilioAuthToken,
            phoneNumber: twilioConfig.twilioPhoneNumber,
            whatsappNumber: twilioConfig.twilioWhatsappNumber,
          });
        }
      } catch (e) {
        // Pas de config Twilio utilisateur
      }

      // Fallback sur les credentials globaux .env
      this.logger.warn(`No user Twilio config found for ${userId}, using global .env fallback`);
      return await this.sendSms(options);
    } catch (error) {
      this.logger.error(`Failed to send SMS for user: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 💚 Envoyer un WhatsApp avec les credentials de l'utilisateur
   * Méthode principale pour le mode multi-tenant
   */
  async sendWhatsAppForUser(userId: string, options: WhatsAppOptions): Promise<SmsResult> {
    try {
      // Essayer d'abord avec les credentials utilisateur
      try {
        const twilioConfig = await this.integrationsService.getDecryptedConfig(userId, 'twilio');
        if (twilioConfig.twilioAccountSid && twilioConfig.twilioAuthToken) {
          this.logger.log(`Sending WhatsApp via user's Twilio to ${options.to}`);
          return await this.sendWhatsApp(options, {
            accountSid: twilioConfig.twilioAccountSid,
            authToken: twilioConfig.twilioAuthToken,
            phoneNumber: twilioConfig.twilioPhoneNumber,
            whatsappNumber: twilioConfig.twilioWhatsappNumber,
          });
        }
      } catch (e) {
        // Pas de config Twilio utilisateur
      }

      // Fallback sur les credentials globaux .env
      this.logger.warn(`No user Twilio config found for ${userId}, using global .env fallback`);
      return await this.sendWhatsApp(options);
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp for user: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 📤 Envoyer un SMS (fallback avec credentials globaux .env)
   */
  async sendSms(options: SmsOptions, credentials?: TwilioCredentials): Promise<SmsResult> {
    try {
      // Utiliser credentials fournis ou .env
      const accountSid = credentials?.accountSid || process.env.TWILIO_ACCOUNT_SID;
      const authToken = credentials?.authToken || process.env.TWILIO_AUTH_TOKEN;
      const phoneNumber = credentials?.phoneNumber || process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken) {
        throw new Error('Twilio credentials not configured');
      }

      if (!phoneNumber && !options.from) {
        throw new Error('No sender phone number configured');
      }

      this.logger.log(`Sending SMS to ${options.to}`);

      // Valider le numéro
      if (!this.isValidPhoneNumber(options.to)) {
        throw new Error('Invalid phone number format. Use E.164 format (+33...)');
      }

      // Appeler l'API Twilio
      const response = await this.callTwilioApi(
        'Messages',
        {
          To: options.to,
          From: options.from || phoneNumber,
          Body: options.message,
        },
        { accountSid, authToken },
      );

      return {
        success: true,
        messageId: response.sid,
        status: response.status,
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 💚 Envoyer un message WhatsApp (fallback avec credentials globaux .env)
   */
  async sendWhatsApp(options: WhatsAppOptions, credentials?: TwilioCredentials): Promise<SmsResult> {
    try {
      // Utiliser credentials fournis ou .env
      const accountSid = credentials?.accountSid || process.env.TWILIO_ACCOUNT_SID;
      const authToken = credentials?.authToken || process.env.TWILIO_AUTH_TOKEN;
      const whatsappNumber = credentials?.whatsappNumber || process.env.TWILIO_WHATSAPP_NUMBER;

      if (!accountSid || !authToken) {
        throw new Error('Twilio credentials not configured');
      }

      if (!whatsappNumber && !options.from) {
        throw new Error('No WhatsApp sender number configured');
      }

      this.logger.log(`Sending WhatsApp to ${options.to}`);

      // Valider le numéro
      if (!this.isValidPhoneNumber(options.to)) {
        throw new Error('Invalid phone number format. Use E.164 format (+33...)');
      }

      // Appeler l'API Twilio avec préfixe WhatsApp
      const response = await this.callTwilioApi(
        'Messages',
        {
          To: `whatsapp:${options.to}`,
          From: options.from || whatsappNumber,
          Body: options.message,
        },
        { accountSid, authToken },
      );

      return {
        success: true,
        messageId: response.sid,
        status: response.status,
      };
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 📱 Envoyer notification SMS
   * Template prédéfini pour les notifications système
   */
  async sendNotificationSms(
    to: string,
    notification: {
      title: string;
      message: string;
      actionUrl?: string;
    },
  ): Promise<SmsResult> {
    // Limiter la longueur du SMS (160 caractères)
    let smsMessage = `${notification.title}\n${notification.message}`;

    if (notification.actionUrl) {
      smsMessage += `\n${notification.actionUrl}`;
    }

    // Tronquer si trop long
    if (smsMessage.length > 160) {
      smsMessage = smsMessage.substring(0, 157) + '...';
    }

    return this.sendSms({
      to,
      message: smsMessage,
    });
  }

  /**
   * 💚 Envoyer notification WhatsApp
   */
  async sendNotificationWhatsApp(
    to: string,
    notification: {
      title: string;
      message: string;
      actionUrl?: string;
    },
  ): Promise<SmsResult> {
    let whatsappMessage = `*${notification.title}*\n\n${notification.message}`;

    if (notification.actionUrl) {
      whatsappMessage += `\n\n🔗 ${notification.actionUrl}`;
    }

    return this.sendWhatsApp({
      to,
      message: whatsappMessage,
    });
  }

  /**
   * 🔍 Valider format numéro de téléphone (E.164)
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Format E.164: +[country code][number]
    // Exemple: +33612345678
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * 📞 Appeler l'API Twilio
   */
  private async callTwilioApi(
    endpoint: string,
    body: Record<string, string>,
    credentials: { accountSid: string; authToken: string },
  ): Promise<any> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${credentials.accountSid}/${endpoint}.json`;

    // Encoder les credentials en Base64 pour Basic Auth
    const authString = Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64');

    // Encoder le body en form-urlencoded
    const formBody = Object.entries(body)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Twilio API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Twilio API call failed: ${error.message}`);
    }
  }

  /**
   * ✅ Vérifier la configuration Twilio globale (.env)
   */
  isConfigured(): boolean {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    return Boolean(accountSid && authToken && phoneNumber);
  }

  /**
   * 📊 Obtenir le statut d'un message
   */
  async getMessageStatus(
    messageSid: string,
    credentials?: { accountSid: string; authToken: string },
  ): Promise<any> {
    try {
      const accountSid = credentials?.accountSid || process.env.TWILIO_ACCOUNT_SID;
      const authToken = credentials?.authToken || process.env.TWILIO_AUTH_TOKEN;

      if (!accountSid || !authToken) {
        throw new Error('Twilio credentials not configured');
      }

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${messageSid}.json`;
      const authString = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${authString}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get message status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to get message status: ${error.message}`);
      throw error;
    }
  }
}
