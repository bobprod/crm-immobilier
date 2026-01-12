import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { CreateCampaignDto, UpdateCampaignDto, ConvertLeadDto } from './dto';
import { ErrorHandler } from '../../../shared/utils/error-handler.utils';
import { CommunicationsService } from '../../communications/communications.service';

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private communicationsService: CommunicationsService,
  ) {}

  async create(userId: string, dto: CreateCampaignDto) {
    // Construire le contenu de la campagne
    const content = dto.content || {};
    if (dto.message) {
      content.message = dto.message;
    }
    if (dto.templateId) {
      content.templateId = dto.templateId;
    }

    return this.prisma.campaigns.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        content: content,
        recipients: dto.targetAudience || [],
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        stats: dto.stats || {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
          bounced: 0,
          unsubscribed: 0,
        },
      },
    });
  }

  async findAll(userId: string, filters?: any) {
    const where: any = { userId };

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;

    // Pagination
    const page = filters?.page ? parseInt(filters.page) : 1;
    const limit = filters?.limit ? Math.min(parseInt(filters.limit), 100) : 30;
    const skip = (page - 1) * limit;

    // Query with pagination
    const [campaigns, total] = await Promise.all([
      this.prisma.campaigns.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.campaigns.count({ where }),
    ]);

    // Transform campaigns to include message from content
    const transformedCampaigns = campaigns.map(campaign => ({
      ...campaign,
      message: campaign.content?.message || '',
      targetAudience: Array.isArray(campaign.recipients) ? campaign.recipients : [],
    }));

    return {
      campaigns: transformedCampaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string) {
    const campaign = await this.prisma.campaigns.findFirst({
      where: { id, userId },
    });

    const validated = ErrorHandler.ensureExists(campaign, 'Campaign', id);
    
    // Transform campaign to include message from content
    return {
      ...validated,
      message: validated.content?.message || '',
      targetAudience: Array.isArray(validated.recipients) ? validated.recipients : [],
    };
  }

  async update(id: string, userId: string, dto: UpdateCampaignDto) {
    await this.findOne(id, userId);

    // Préparer les données pour la mise à jour
    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.stats !== undefined) updateData.stats = dto.stats;
    if (dto.scheduledAt !== undefined) {
      updateData.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    }
    if (dto.targetAudience !== undefined) {
      updateData.recipients = dto.targetAudience;
    }

    // Gérer le content avec message
    if (dto.content !== undefined || dto.message !== undefined || dto.templateId !== undefined) {
      // Récupérer le content actuel pour le fusionner
      const currentCampaign = await this.prisma.campaigns.findUnique({
        where: { id },
        select: { content: true },
      });
      
      const currentContent = (currentCampaign?.content as any) || {};
      const newContent = { ...currentContent };

      if (dto.content !== undefined) {
        Object.assign(newContent, dto.content);
      }
      if (dto.message !== undefined) {
        newContent.message = dto.message;
      }
      if (dto.templateId !== undefined) {
        newContent.templateId = dto.templateId;
      }

      updateData.content = newContent;
    }

    const updated = await this.prisma.campaigns.update({
      where: { id },
      data: updateData,
    });

    // Retourner avec transformation
    return {
      ...updated,
      message: updated.content?.message || '',
      targetAudience: Array.isArray(updated.recipients) ? updated.recipients : [],
    };
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

    // Envoyer des emails de test via le module communications
    const sendResults = await Promise.allSettled(
      testEmails.map(email =>
        this.communicationsService.sendEmail(userId, {
          to: email,
          subject: `[TEST] ${campaign.name}`,
          body: `
            <h2>Test de campagne: ${campaign.name}</h2>
            <p>${campaign.description || ''}</p>
            <hr>
            <p><em>Ceci est un email de test. Cette campagne n'est pas encore lancée.</em></p>
          `,
        }),
      ),
    );

    const successCount = sendResults.filter(r => r.status === 'fulfilled').length;

    return {
      ...campaign,
      testMessage: `Campaign test sent to ${successCount}/${testEmails.length} email(s)`,
      testEmails,
      sendResults,
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
