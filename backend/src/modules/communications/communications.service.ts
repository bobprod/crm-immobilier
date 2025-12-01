import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  SendEmailDto,
  SendSmsDto,
  SendWhatsAppDto,
  CreateTemplateDto,
  UpdateTemplateDto,
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
