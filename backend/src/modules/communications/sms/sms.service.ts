import { Injectable, Logger } from '@nestjs/common';

/**
 * 📱 Service SMS avec Twilio
 *
 * Fonctionnalités:
 * - Envoi SMS
 * - Envoi WhatsApp (via Twilio)
 * - Validation numéros de téléphone
 * - Gestion erreurs
 *
 * Configuration via .env:
 * - TWILIO_ACCOUNT_SID=ACxxx
 * - TWILIO_AUTH_TOKEN=xxx
 * - TWILIO_PHONE_NUMBER=+33612345678
 * - TWILIO_WHATSAPP_NUMBER=whatsapp:+33612345678
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

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly phoneNumber: string;
  private readonly whatsappNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';
  }

  /**
   * 📤 Envoyer un SMS
   */
  async sendSms(options: SmsOptions): Promise<SmsResult> {
    try {
      if (!this.accountSid || !this.authToken) {
        throw new Error('Twilio credentials not configured');
      }

      if (!this.phoneNumber && !options.from) {
        throw new Error('No sender phone number configured');
      }

      this.logger.log(`Sending SMS to ${options.to}`);

      // Valider le numéro
      if (!this.isValidPhoneNumber(options.to)) {
        throw new Error('Invalid phone number format. Use E.164 format (+33...)');
      }

      // Appeler l'API Twilio
      const response = await this.callTwilioApi('Messages', {
        To: options.to,
        From: options.from || this.phoneNumber,
        Body: options.message,
      });

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
   * 💚 Envoyer un message WhatsApp
   */
  async sendWhatsApp(options: WhatsAppOptions): Promise<SmsResult> {
    try {
      if (!this.accountSid || !this.authToken) {
        throw new Error('Twilio credentials not configured');
      }

      if (!this.whatsappNumber && !options.from) {
        throw new Error('No WhatsApp sender number configured');
      }

      this.logger.log(`Sending WhatsApp to ${options.to}`);

      // Valider le numéro
      if (!this.isValidPhoneNumber(options.to)) {
        throw new Error('Invalid phone number format. Use E.164 format (+33...)');
      }

      // Appeler l'API Twilio avec préfixe WhatsApp
      const response = await this.callTwilioApi('Messages', {
        To: `whatsapp:${options.to}`,
        From: options.from || this.whatsappNumber,
        Body: options.message,
      });

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
  private async callTwilioApi(endpoint: string, body: Record<string, string>): Promise<any> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/${endpoint}.json`;

    // Encoder les credentials en Base64 pour Basic Auth
    const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

    // Encoder le body en form-urlencoded
    const formBody = Object.entries(body)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
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
   * ✅ Vérifier la configuration Twilio
   */
  isConfigured(): boolean {
    return Boolean(this.accountSid && this.authToken && this.phoneNumber);
  }

  /**
   * 📊 Obtenir le statut d'un message
   */
  async getMessageStatus(messageSid: string): Promise<any> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages/${messageSid}.json`;
      const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${credentials}`,
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
