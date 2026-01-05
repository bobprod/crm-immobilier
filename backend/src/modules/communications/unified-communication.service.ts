import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';
import { WhatsAppService } from './whatsapp/whatsapp.service';

/**
 * 🎯 Unified Communication Service
 *
 * Couche d'orchestration pour toutes les communications (Email, SMS, WhatsApp)
 *
 * Fonctionnalités:
 * - Routing intelligent vers le bon provider
 * - Historique unifié de toutes les communications
 * - Stats globales tous canaux
 * - Synchronisation automatique entre tables spécialisées et table générique
 *
 * Architecture:
 * - EmailService → Resend/SendGrid
 * - SmsService → Twilio SMS
 * - WhatsAppService → Meta Cloud API / Twilio WhatsApp
 *
 * Stockage:
 * - Table `communications` → Historique unifié tous canaux
 * - Tables `whatsapp_*` → Données détaillées WhatsApp
 */

export interface SendMessageOptions {
  type: 'email' | 'sms' | 'whatsapp';
  to: string | string[];
  content: string;
  subject?: string; // Pour email
  from?: string;
  metadata?: Record<string, any>;
  prospectId?: string;
  propertyId?: string;
}

export interface CommunicationHistoryFilters {
  type?: 'email' | 'sms' | 'whatsapp';
  startDate?: Date;
  endDate?: Date;
  status?: string;
  prospectId?: string;
  propertyId?: string;
  limit?: number;
  offset?: number;
}

export interface UnifiedStats {
  total: number;
  sent: number;
  failed: number;
  delivered: number;
  read: number;
  byChannel: {
    email: ChannelStats;
    sms: ChannelStats;
    whatsapp: ChannelStats;
  };
}

export interface ChannelStats {
  total: number;
  sent: number;
  failed: number;
  delivered: number;
  read: number;
  deliveryRate: number;
  readRate: number;
}

@Injectable()
export class UnifiedCommunicationService {
  private readonly logger = new Logger(UnifiedCommunicationService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private smsService: SmsService,
    private whatsappService: WhatsAppService,
  ) { }

  /**
   * 📤 Envoyer un message via le canal approprié
   * Route automatiquement vers Email, SMS ou WhatsApp
   */
  async sendMessage(userId: string, options: SendMessageOptions) {
    this.logger.log(
      `Sending ${options.type} message to ${options.to} for user ${userId}`,
    );

    let result: any;
    let externalMessageId: string | undefined;

    try {
      switch (options.type) {
        case 'email':
          result = await this.emailService.sendForUser(userId, {
            to: options.to as string,
            subject: options.subject || 'Message from CRM',
            html: options.content,
            text: options.content,
          } as any);
          externalMessageId = result.messageId;
          break;

        case 'sms':
          result = await this.smsService.sendSmsForUser(userId, {
            to: options.to as string,
            message: options.content,
            from: options.from,
          } as any);
          externalMessageId = result.messageId;
          break;

        case 'whatsapp':
          // Utiliser le module WhatsApp complet pour fonctionnalités avancées
          result = await this.whatsappService.sendTextMessage(userId, {
            to: options.to as string,
            body: options.content,
          } as any);
          externalMessageId = result.message?.id;
          break;

        default:
          throw new Error(`Unknown communication type: ${options.type}`);
      }

      // Enregistrer dans la table communications (historique unifié)
      const communication = await this.prisma.communications.create({
        data: {
          userId,
          type: options.type,
          to: Array.isArray(options.to) ? options.to.join(',') : options.to,
          from: options.from || this.getDefaultFrom(options.type),
          subject: options.subject,
          body: options.content,
          status: result.success ? 'sent' : 'failed',
          sentAt: result.success ? new Date() : null,
          failedReason: result.success ? null : result.error,
          prospectId: options.prospectId,
          propertyId: options.propertyId,
          metadata: {
            ...options.metadata,
            externalMessageId,
            provider: this.getProvider(options.type),
            channel: options.type,
          },
        },
      });

      return {
        success: result.success,
        messageId: communication.id,
        externalMessageId,
        communication,
        error: result.error,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send ${options.type} message: ${error.message}`,
      );

      // Enregistrer l'échec dans communications
      const communication = await this.prisma.communications.create({
        data: {
          userId,
          type: options.type,
          to: Array.isArray(options.to) ? options.to.join(',') : options.to,
          subject: options.subject,
          body: options.content,
          status: 'failed',
          failedReason: error.message,
          prospectId: options.prospectId,
          propertyId: options.propertyId,
          metadata: options.metadata,
        },
      });

      return {
        success: false,
        messageId: communication.id,
        error: error.message,
      };
    }
  }

  /**
   * 📊 Historique unifié de toutes les communications
   * Combine données de la table communications + enrichissement WhatsApp si besoin
   */
  async getCommunicationHistory(
    userId: string,
    filters?: CommunicationHistoryFilters,
  ) {
    this.logger.log(
      `Fetching communication history for user ${userId} with filters: ${JSON.stringify(filters)}`,
    );

    const where: any = { userId };

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.prospectId) where.prospectId = filters.prospectId;
    if (filters?.propertyId) where.propertyId = filters.propertyId;

    if (filters?.startDate || filters?.endDate) {
      where.sentAt = {};
      if (filters.startDate) where.sentAt.gte = filters.startDate;
      if (filters.endDate) where.sentAt.lte = filters.endDate;
    }

    const communications = await this.prisma.communications.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
      include: {
        prospects: true,
        properties: true,
      },
    });

    // Pour WhatsApp, enrichir avec données détaillées si disponibles
    if (!filters?.type || filters.type === 'whatsapp') {
      return await this.enrichWhatsAppMessages(communications);
    }

    return communications;
  }

  /**
   * 📈 Stats unifiées tous canaux
   */
  async getUnifiedStats(userId: string): Promise<UnifiedStats> {
    this.logger.log(`Calculating unified stats for user ${userId}`);

    const [emailStats, smsStats, whatsappStats] = await Promise.all([
      this.getChannelStats(userId, 'email'),
      this.getChannelStats(userId, 'sms'),
      this.getChannelStats(userId, 'whatsapp'),
    ]);

    const total =
      emailStats.total + smsStats.total + whatsappStats.total;
    const sent =
      emailStats.sent + smsStats.sent + whatsappStats.sent;
    const failed =
      emailStats.failed + smsStats.failed + whatsappStats.failed;
    const delivered =
      emailStats.delivered +
      smsStats.delivered +
      whatsappStats.delivered;
    const read =
      emailStats.read + smsStats.read + whatsappStats.read;

    return {
      total,
      sent,
      failed,
      delivered,
      read,
      byChannel: {
        email: emailStats,
        sms: smsStats,
        whatsapp: whatsappStats,
      },
    };
  }

  /**
   * 📊 Stats par canal
   */
  private async getChannelStats(
    userId: string,
    type: string,
  ): Promise<ChannelStats> {
    const [total, sent, failed, delivered, read] = await Promise.all([
      this.prisma.communications.count({
        where: { userId, type },
      }),
      this.prisma.communications.count({
        where: { userId, type, status: 'sent' },
      }),
      this.prisma.communications.count({
        where: { userId, type, status: 'failed' },
      }),
      this.prisma.communications.count({
        where: { userId, type, deliveredAt: { not: null } },
      }),
      this.prisma.communications.count({
        where: { userId, type, openedAt: { not: null } },
      }),
    ]);

    const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
    const readRate =
      delivered > 0 ? Math.round((read / delivered) * 100) : 0;

    return {
      total,
      sent,
      failed,
      delivered,
      read,
      deliveryRate,
      readRate,
    };
  }

  /**
   * 💚 Enrichir les messages WhatsApp avec données détaillées
   */
  private async enrichWhatsAppMessages(communications: any[]) {
    const whatsappCommunications = communications.filter(
      (c) => c.type === 'whatsapp',
    );

    if (whatsappCommunications.length === 0) {
      return communications;
    }

    // Récupérer les IDs de messages WhatsApp depuis metadata
    const whatsappMessageIds = whatsappCommunications
      .map((c) => c.metadata?.externalMessageId)
      .filter(Boolean);

    if (whatsappMessageIds.length === 0) {
      return communications;
    }

    // Récupérer les messages WhatsApp détaillés
    const whatsappMessages = await this.prisma.whatsAppMessage.findMany({
      where: {
        id: { in: whatsappMessageIds },
      },
      include: {
        conversation: {
          include: {
            contact: true,
          },
        },
      },
    });

    // Créer un map pour lookup rapide
    const whatsappMessageMap = new Map(
      whatsappMessages.map((m) => [m.id, m]),
    );

    // Enrichir les communications avec données WhatsApp
    return communications.map((comm) => {
      if (
        comm.type === 'whatsapp' &&
        comm.metadata?.externalMessageId
      ) {
        const whatsappMessage = whatsappMessageMap.get(
          comm.metadata.externalMessageId,
        ) as any;
        if (whatsappMessage) {
          return {
            ...comm,
            whatsappDetails: {
              messageType: whatsappMessage.type,
              direction: whatsappMessage.direction,
              status: whatsappMessage.status,
              conversation: whatsappMessage.conversation,
              contact: whatsappMessage.conversation?.contact,
              sentAt: whatsappMessage.sentAt,
              deliveredAt: whatsappMessage.deliveredAt,
              readAt: whatsappMessage.readAt,
            },
          };
        }
      }
      return comm;
    });
  }

  /**
   * 🔧 Obtenir le provider par défaut selon le type
   */
  private getProvider(type: string): string {
    switch (type) {
      case 'email':
        return process.env.EMAIL_PROVIDER || 'resend';
      case 'sms':
        return 'twilio';
      case 'whatsapp':
        return process.env.WHATSAPP_PROVIDER || 'meta';
      default:
        return 'unknown';
    }
  }

  /**
   * 📧 Obtenir l'expéditeur par défaut selon le type
   */
  private getDefaultFrom(type: string): string {
    switch (type) {
      case 'email':
        return process.env.EMAIL_FROM || 'notifications@crm-immobilier.com';
      case 'sms':
        return process.env.TWILIO_PHONE_NUMBER || '';
      case 'whatsapp':
        return process.env.WHATSAPP_PHONE_NUMBER || '';
      default:
        return '';
    }
  }
}
