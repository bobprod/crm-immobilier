import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { CreateCampaignDto, UpdateCampaignDto, ConvertLeadDto } from './dto';
import { ErrorHandler } from '../../../shared/utils/error-handler.utils';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCampaignDto) {
    return this.prisma.campaigns.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        content: dto.config || {}, // ✅ CORRIGÉ: utiliser 'content' au lieu de 'config'
        recipients: [], // ✅ AJOUTÉ: recipients est requis
        stats: dto.stats || {},
      },
    });
  }

  async findAll(userId: string, filters?: any) {
    const where: any = { userId };

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;

    return this.prisma.campaigns.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const campaign = await this.prisma.campaigns.findFirst({
      where: { id, userId },
    });

    return ErrorHandler.ensureExists(campaign, 'Campaign', id);
  }

  async update(id: string, userId: string, dto: UpdateCampaignDto) {
    await this.findOne(id, userId);

    return this.prisma.campaigns.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.campaigns.delete({
      where: { id },
    });
  }

  async updateStats(id: string, stats: any) {
    return this.prisma.campaigns.update({
      where: { id },
      data: { stats },
    });
  }

  async getStats(id: string, userId: string) {
    const campaign = await this.findOne(id, userId);
    return (
      campaign.stats || {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        bounced: 0,
        unsubscribed: 0,
      }
    );
  }

  async getCampaignLeads(campaignId: string, userId: string) {
    const campaign = await this.findOne(campaignId, userId);

    const leads = (campaign.stats as any)?.leads || [];
    return { campaign, leads };
  }

  async start(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.campaigns.update({
      where: { id },
      data: {
        status: 'active',
        startedAt: new Date(),
      },
    });
  }

  async pause(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.campaigns.update({
      where: { id },
      data: {
        status: 'paused',
        pausedAt: new Date(),
      },
    });
  }

  async resume(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.campaigns.update({
      where: { id },
      data: {
        status: 'active',
        resumedAt: new Date(),
      },
    });
  }

  async complete(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.campaigns.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });
  }

  async duplicate(id: string, newName: string, userId: string) {
    const original = await this.findOne(id, userId);

    return this.prisma.campaigns.create({
      data: {
        userId,
        name: newName,
        description: original.description,
        type: original.type,
        content: original.content,
        recipients: original.recipients,
        status: 'draft',
      },
    });
  }

  async test(id: string, testEmails: string[], userId: string) {
    const campaign = await this.findOne(id, userId);

    // Logique de test de campagne - envoyer à quelques emails de test
    // Pour l'instant, on retourne juste la campagne avec un message
    return {
      ...campaign,
      testMessage: `Campaign test sent to ${testEmails.length} email(s)`,
      testEmails,
    };
  }

  async convertLeadToProspect(userId: string, dto: ConvertLeadDto) {
    // Vérifier si un prospect existe déjà avec le même email ou téléphone
    const existingConditions = [];
    if (dto.email) existingConditions.push({ email: dto.email.toLowerCase() });
    if (dto.phone) existingConditions.push({ phone: dto.phone });

    if (existingConditions.length > 0) {
      const existingProspect = await this.prisma.prospects.findFirst({
        where: {
          userId,
          OR: existingConditions,
        },
      });

      if (existingProspect) {
        // Mettre à jour le prospect existant avec les nouvelles données
        return this.prisma.prospects.update({
          where: { id: existingProspect.id },
          data: {
            firstName: dto.firstName || existingProspect.firstName,
            lastName: dto.lastName || existingProspect.lastName,
            budget: dto.budget || existingProspect.budget,
            preferences: dto.preferences || existingProspect.preferences,
            notes:
              (existingProspect.notes || '') +
              `\n[${new Date().toLocaleDateString('fr-FR')}] Mis à jour depuis campagne marketing`,
          },
        });
      }
    }

    const prospect = await this.prisma.prospects.create({
      data: {
        userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        type: dto.type || 'buyer',
        budget: dto.budget,
        currency: dto.currency || 'TND',
        preferences: dto.preferences || {},
        source: 'campaign',
        status: 'active',
      },
    });

    return prospect;
  }
}
