import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { CreateCampaignDto, UpdateCampaignDto, ConvertLeadDto } from './dto';

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
        recipients: [],             // ✅ AJOUTÉ: recipients est requis
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

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
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

  async getCampaignLeads(campaignId: string, userId: string) {
    const campaign = await this.findOne(campaignId, userId);

    const leads = (campaign.stats as any)?.leads || [];
    return { campaign, leads };
  }

  async convertLeadToProspect(userId: string, dto: ConvertLeadDto) {
    const prospect = await this.prisma.prospects.create({
      data: {
        userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        type: dto.type || 'buyer',
        budget: dto.budget,  // ✅ Déjà correct (objet Json)
        currency: dto.currency || 'TND',
        preferences: dto.preferences || {},
        source: 'campaign',
        status: 'active',
      },
    });

    return prospect;
  }
}
