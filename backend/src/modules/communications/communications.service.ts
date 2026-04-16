import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  SendEmailDto,
  SendSmsDto,
  SendWhatsAppDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  CommunicationsSettingsDto,
} from './dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private prisma: PrismaService) {
    // Configuration SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendEmail(userId: string, dto: SendEmailDto) {
    this.logger.log(`Sending email to ${dto.to}`);

    try {
      // Envoyer via SMTP
      if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: dto.to,
          subject: dto.subject,
          html: dto.body,
          attachments: dto.attachments?.map((att: any) => ({
            filename: att.filename,
            path: att.path,
          })),
        });
        this.logger.log('Email sent via SMTP successfully');
      }

      const communication = await this.prisma.communications.create({
        data: {
          userId,
          type: 'email',
          to: dto.to,
          from: process.env.DEFAULT_EMAIL_FROM || 'noreply@crm-immo.com',
          subject: dto.subject,
          body: dto.body,
          status: 'sent',
          sentAt: new Date(),
          prospectId: dto.prospectId,
          propertyId: dto.propertyId,
          templateId: dto.templateId,
          metadata: dto.attachments ? { attachments: dto.attachments } : undefined,
        },
      });

      return { success: true, messageId: communication.id, communication };
    } catch (error) {
      const communication = await this.prisma.communications.create({
        data: {
          userId,
          type: 'email',
          to: dto.to,
          subject: dto.subject,
          body: dto.body,
          status: 'failed',
          failedReason: error.message,
          prospectId: dto.prospectId,
          propertyId: dto.propertyId,
          templateId: dto.templateId,
        },
      });

      return { success: false, messageId: communication.id, error: error.message };
    }
  }

  async sendSms(userId: string, dto: SendSmsDto) {
    this.logger.log(`Sending SMS to ${dto.to}`);

    try {
      const communication = await this.prisma.communications.create({
        data: {
          userId,
          type: 'sms',
          to: dto.to,
          from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
          body: dto.message,
          status: 'sent',
          sentAt: new Date(),
          prospectId: dto.prospectId,
          propertyId: dto.propertyId,
          templateId: dto.templateId,
        },
      });

      return { success: true, messageId: communication.id, communication };
    } catch (error) {
      const communication = await this.prisma.communications.create({
        data: {
          userId,
          type: 'sms',
          to: dto.to,
          body: dto.message,
          status: 'failed',
          failedReason: error.message,
          prospectId: dto.prospectId,
          propertyId: dto.propertyId,
          templateId: dto.templateId,
        },
      });

      return { success: false, messageId: communication.id, error: error.message };
    }
  }

  async sendWhatsApp(userId: string, dto: SendWhatsAppDto) {
    this.logger.log(`Sending WhatsApp to ${dto.to}`);

    try {
      const communication = await this.prisma.communications.create({
        data: {
          userId,
          type: 'whatsapp',
          to: dto.to,
          from: process.env.WHATSAPP_PHONE_NUMBER || 'whatsapp:+1234567890',
          body: dto.message,
          status: 'sent',
          sentAt: new Date(),
          prospectId: dto.prospectId,
          propertyId: dto.propertyId,
          templateId: dto.templateId,
          metadata: dto.mediaUrl ? { mediaUrl: dto.mediaUrl } : undefined,
        },
      });

      return { success: true, messageId: communication.id, communication };
    } catch (error) {
      const communication = await this.prisma.communications.create({
        data: {
          userId,
          type: 'whatsapp',
          to: dto.to,
          body: dto.message,
          status: 'failed',
          failedReason: error.message,
          prospectId: dto.prospectId,
          propertyId: dto.propertyId,
          templateId: dto.templateId,
        },
      });

      return { success: false, messageId: communication.id, error: error.message };
    }
  }

  async getHistory(userId: string, filters?: any) {
    const where: any = { userId };

    if (filters?.type) where.type = filters.type;
    if (filters?.prospectId) where.prospectId = filters.prospectId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.communications.findMany({
      where,
      include: { prospects: true, properties: true, template: true },
      orderBy: { sentAt: 'desc' },
      take: filters?.limit || 50,
    });
  }

  async createTemplate(userId: string, dto: CreateTemplateDto) {
    return this.prisma.communication_templates.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        subject: dto.subject,
        content: dto.content,
        variables: dto.variables || [],
      },
    });
  }

  async getTemplates(userId: string, type?: string) {
    return this.prisma.communication_templates.findMany({
      where: { userId, ...(type && { type }), isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplateById(id: string, userId: string) {
    const template = await this.prisma.communication_templates.findFirst({
      where: { id, userId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    return template;
  }

  async updateTemplate(id: string, userId: string, dto: UpdateTemplateDto) {
    // Vérifier que le template existe et appartient à l'utilisateur
    const template = await this.prisma.communication_templates.findFirst({
      where: { id, userId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    return this.prisma.communication_templates.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.subject !== undefined && { subject: dto.subject }),
        ...(dto.content && { content: dto.content }),
        ...(dto.variables && { variables: dto.variables }),
      },
    });
  }

  async deleteTemplate(id: string, userId: string) {
    // Vérifier que le template existe et appartient à l'utilisateur
    const template = await this.prisma.communication_templates.findFirst({
      where: { id, userId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Soft delete: marquer comme inactif plutôt que supprimer
    await this.prisma.communication_templates.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true, message: 'Template supprimé avec succès' };
  }

  async getCommunicationById(id: string, userId: string) {
    const communication = await this.prisma.communications.findFirst({
      where: { id, userId },
      include: { prospects: true, properties: true, template: true },
    });

    if (!communication) {
      throw new Error('Communication not found');
    }

    return communication;
  }

  async getStats(userId: string) {
    const [total, sent, failed, emails, sms, whatsapp] = await Promise.all([
      this.prisma.communications.count({ where: { userId } }),
      this.prisma.communications.count({ where: { userId, status: 'sent' } }),
      this.prisma.communications.count({ where: { userId, status: 'failed' } }),
      this.prisma.communications.count({ where: { userId, type: 'email' } }),
      this.prisma.communications.count({ where: { userId, type: 'sms' } }),
      this.prisma.communications.count({ where: { userId, type: 'whatsapp' } }),
    ]);

    return {
      total,
      sent,
      failed,
      byType: { email: emails, sms: sms, whatsapp: whatsapp },
    };
  }

  /**
   * Récupérer la configuration communications depuis global_settings
   */
  async getSettings() {
    const keys = [
      'smtp_host',
      'smtp_port',
      'smtp_secure',
      'smtp_user',
      'smtp_password',
      'smtp_from',
      'twilio_account_sid',
      'twilio_auth_token',
      'twilio_phone_number',
      'whatsapp_api_key',
      'whatsapp_phone_number_id',
      'email_provider',
      'resend_api_key',
      'sendgrid_api_key',
      'meta_app_id',
      'meta_app_secret',
      'meta_page_access_token',
      'meta_page_id',
      'meta_instagram_account_id',
      'meta_webhook_verify_token',
      'meta_graph_api_version',
      'tiktok_app_id',
      'tiktok_app_secret',
      'tiktok_access_token',
      'tiktok_business_id',
      'tiktok_webhook_secret',
      'linkedin_client_id',
      'linkedin_client_secret',
      'linkedin_access_token',
      'linkedin_organization_id',
    ];
    const rows = await this.prisma.globalSettings.findMany({
      where: { key: { in: keys } },
    });
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value;

    return {
      smtpHost: map.smtp_host || process.env.SMTP_HOST || '',
      smtpPort: parseInt(map.smtp_port || process.env.SMTP_PORT || '587'),
      smtpSecure: (map.smtp_secure || process.env.SMTP_SECURE || 'false') === 'true',
      smtpUser: map.smtp_user || process.env.SMTP_USER || '',
      smtpPassword: map.smtp_password ? '••••••••' : process.env.SMTP_PASSWORD ? '••••••••' : '',
      smtpFrom: map.smtp_from || process.env.SMTP_FROM || process.env.SMTP_USER || '',
      twilioAccountSid: map.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID || '',
      twilioAuthToken: map.twilio_auth_token
        ? '••••••••'
        : process.env.TWILIO_AUTH_TOKEN
          ? '••••••••'
          : '',
      twilioPhoneNumber: map.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER || '',
      whatsappApiKey: map.whatsapp_api_key ? '••••••••' : '',
      whatsappPhoneNumberId: map.whatsapp_phone_number_id || '',
      emailProvider: map.email_provider || process.env.EMAIL_PROVIDER || 'smtp',
      resendApiKey: map.resend_api_key ? '••••••••' : process.env.RESEND_API_KEY ? '••••••••' : '',
      sendgridApiKey: map.sendgrid_api_key
        ? '••••••••'
        : process.env.SENDGRID_API_KEY
          ? '••••••••'
          : '',
      // Meta Platform
      metaAppId: map.meta_app_id || '',
      metaAppSecret: map.meta_app_secret ? '••••••••' : '',
      metaPageAccessToken: map.meta_page_access_token ? '••••••••' : '',
      metaPageId: map.meta_page_id || '',
      metaInstagramAccountId: map.meta_instagram_account_id || '',
      metaWebhookVerifyToken: map.meta_webhook_verify_token || '',
      metaGraphApiVersion: map.meta_graph_api_version || 'v21.0',
      // Statut actuel
      smtpConfigured: !!(map.smtp_user || process.env.SMTP_USER),
      twilioConfigured: !!(map.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID),
      metaConfigured: !!(map.meta_page_access_token && map.meta_page_id),
      instagramConfigured: !!(map.meta_page_access_token && map.meta_instagram_account_id),
      // TikTok Business
      tiktokAppId: map.tiktok_app_id || '',
      tiktokAppSecret: map.tiktok_app_secret ? '••••••••' : '',
      tiktokAccessToken: map.tiktok_access_token ? '••••••••' : '',
      tiktokBusinessId: map.tiktok_business_id || '',
      tiktokWebhookSecret: map.tiktok_webhook_secret || '',
      tiktokConfigured: !!(map.tiktok_access_token && map.tiktok_business_id),
      // LinkedIn Page
      linkedinClientId: map.linkedin_client_id || '',
      linkedinClientSecret: map.linkedin_client_secret ? '••••••••' : '',
      linkedinAccessToken: map.linkedin_access_token ? '••••••••' : '',
      linkedinOrganizationId: map.linkedin_organization_id || '',
      linkedinConfigured: !!(map.linkedin_access_token && map.linkedin_organization_id),
    };
  }

  /**
   * Sauvegarder la configuration communications dans global_settings
   */
  async saveSettings(dto: CommunicationsSettingsDto) {
    const mapping: Record<string, string | undefined> = {
      smtp_host: dto.smtpHost,
      smtp_port: dto.smtpPort?.toString(),
      smtp_secure: dto.smtpSecure?.toString(),
      smtp_user: dto.smtpUser,
      smtp_from: dto.smtpFrom,
      twilio_account_sid: dto.twilioAccountSid,
      twilio_phone_number: dto.twilioPhoneNumber,
      whatsapp_phone_number_id: dto.whatsappPhoneNumberId,
      email_provider: dto.emailProvider,
      meta_app_id: dto.metaAppId,
      meta_page_id: dto.metaPageId,
      meta_instagram_account_id: dto.metaInstagramAccountId,
      meta_webhook_verify_token: dto.metaWebhookVerifyToken,
      meta_graph_api_version: dto.metaGraphApiVersion,
      tiktok_app_id: dto.tiktokAppId,
      tiktok_business_id: dto.tiktokBusinessId,
      tiktok_webhook_secret: dto.tiktokWebhookSecret,
      linkedin_client_id: dto.linkedinClientId,
      linkedin_organization_id: dto.linkedinOrganizationId,
    };
    // Mots de passe seulement si non-masqué
    if (dto.smtpPassword && !dto.smtpPassword.includes('•'))
      mapping.smtp_password = dto.smtpPassword;
    if (dto.twilioAuthToken && !dto.twilioAuthToken.includes('•'))
      mapping.twilio_auth_token = dto.twilioAuthToken;
    if (dto.whatsappApiKey && !dto.whatsappApiKey.includes('•'))
      mapping.whatsapp_api_key = dto.whatsappApiKey;
    if (dto.resendApiKey && !dto.resendApiKey.includes('•'))
      mapping.resend_api_key = dto.resendApiKey;
    if (dto.sendgridApiKey && !dto.sendgridApiKey.includes('•'))
      mapping.sendgrid_api_key = dto.sendgridApiKey;
    if (dto.metaAppSecret && !dto.metaAppSecret.includes('•'))
      mapping.meta_app_secret = dto.metaAppSecret;
    if (dto.metaPageAccessToken && !dto.metaPageAccessToken.includes('•'))
      mapping.meta_page_access_token = dto.metaPageAccessToken;
    if (dto.tiktokAppSecret && !dto.tiktokAppSecret.includes('•'))
      mapping.tiktok_app_secret = dto.tiktokAppSecret;
    if (dto.tiktokAccessToken && !dto.tiktokAccessToken.includes('•'))
      mapping.tiktok_access_token = dto.tiktokAccessToken;
    if (dto.linkedinClientSecret && !dto.linkedinClientSecret.includes('•'))
      mapping.linkedin_client_secret = dto.linkedinClientSecret;
    if (dto.linkedinAccessToken && !dto.linkedinAccessToken.includes('•'))
      mapping.linkedin_access_token = dto.linkedinAccessToken;

    for (const [key, value] of Object.entries(mapping)) {
      if (value === undefined || value === '') continue;
      const existing = await this.prisma.globalSettings.findFirst({ where: { key } });
      if (existing) {
        await this.prisma.globalSettings.update({ where: { id: existing.id }, data: { value } });
      } else {
        await this.prisma.globalSettings.create({ data: { key, value } });
      }
    }

    // Réinitialiser le transporter SMTP avec les nouvelles valeurs
    const host = dto.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = dto.smtpPort || parseInt(process.env.SMTP_PORT || '587');
    const user = dto.smtpUser || process.env.SMTP_USER;
    const pass =
      dto.smtpPassword && !dto.smtpPassword.includes('•')
        ? dto.smtpPassword
        : process.env.SMTP_PASSWORD;
    if (user && pass) {
      this.transporter = require('nodemailer').createTransport({
        host,
        port,
        secure: dto.smtpSecure ?? false,
        auth: { user, pass },
      });
    }

    return { success: true, message: 'Configuration sauvegardée' };
  }

  /**
   * Tester la configuration SMTP
   */
  async testSmtpConnection() {
    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'Configuration SMTP valide',
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
          from: process.env.SMTP_FROM,
        },
      };
    } catch (error) {
      this.logger.error(`SMTP connection test failed: ${error.message}`);
      return {
        success: false,
        message: 'Échec de connexion SMTP',
        error: error.message,
      };
    }
  }

  /**
   * Envoyer un email de test
   */
  async sendTestEmail(to: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: 'Test Email - CRM Immobilier',
        html: `
          <h1>Test Email</h1>
          <p>Ceci est un email de test depuis votre CRM Immobilier.</p>
          <p>Configuration SMTP fonctionnelle !</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
        `,
      });

      return {
        success: true,
        message: `Email de test envoyé à ${to}`,
      };
    } catch (error) {
      this.logger.error(`Test email failed: ${error.message}`);
      return {
        success: false,
        message: 'Échec envoi email de test',
        error: error.message,
      };
    }
  }
}
