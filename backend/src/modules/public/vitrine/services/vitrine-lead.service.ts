import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { SubmitLeadDto } from '../dto';
import { NotificationsService } from '../../../notifications/notifications.service';

@Injectable()
export class VitrineLeadService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async submitPublicLead(slug: string, data: SubmitLeadDto, ipAddress?: string) {
    const config = await this.prisma.vitrineConfig.findFirst({ where: { slug } });
    if (!config) throw new NotFoundException(`Vitrine '${slug}' introuvable`);

    // Créer le PublicLead
    const lead = await this.prisma.publicLead.create({
      data: {
        vitrineConfigId: config.id,
        vitrineSlug: slug,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        message: data.message,
        type: data.type || 'CONTACT',
        propertyId: data.propertyId,
        agentProfileId: data.agentProfileId,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        referrer: data.referrer,
        ipAddress,
        status: 'NEW',
      },
    });

    // Auto-créer un Prospect dans le CRM
    const scoreBase = (data.phone ? 20 : 0) + (data.email ? 20 : 0);
    const prospect = await this.prisma.prospects.create({
      data: {
        userId: config.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        type: 'buyer',
        source: `vitrine_${(data.type || 'contact').toLowerCase()}`,
        status: 'active',
        notes: data.message,
        score: scoreBase,
      },
    });

    // Lier le lead au prospect
    await this.prisma.publicLead.update({
      where: { id: lead.id },
      data: { prospectId: prospect.id, status: 'CONVERTED', convertedAt: new Date() },
    });

    // Notifier l'agent
    try {
      const propertyInfo = data.propertyId
        ? await this.prisma.properties.findUnique({
            where: { id: data.propertyId },
            select: { title: true, reference: true },
          })
        : null;

      await this.notificationsService.createNotification(
        {
          userId: config.userId,
          type: 'LEAD' as any,
          title: `🎯 Nouveau lead vitrine — ${data.firstName} ${data.lastName || ''}`,
          message: `${data.type}${propertyInfo ? ` · ${propertyInfo.title}` : ''} · ${data.email}${data.phone ? ` · ${data.phone}` : ''}`,
          actionUrl: `/prospects?highlight=${prospect.id}`,
          metadata: JSON.stringify({
            leadId: lead.id,
            prospectId: prospect.id,
            type: data.type,
            slug,
          }),
        },
        { priority: 'high', bypassSmartRouting: true },
      );
    } catch (e) {
      console.error('[Vitrine] Notification échec:', e);
    }

    return { success: true, leadId: lead.id, prospectId: prospect.id };
  }

  async getPublicLeads(userId: string) {
    const config = await this.prisma.vitrineConfig.findUnique({ where: { userId } });
    if (!config) return [];
    return this.prisma.publicLead.findMany({
      where: { vitrineConfigId: config.id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
