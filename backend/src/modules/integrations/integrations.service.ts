import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateIntegrationDto, UpdateIntegrationDto } from './dto';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, type: string, apiKey: string, config?: any) {
    return this.prisma.user_integrations.upsert({
      where: {
        userId_type: { userId, type },
      },
      update: {
        apiKey, // ✅ CORRIGÉ: apiKey séparé
        data: { config }, // ✅ data contient juste config
      },
      create: {
        userId,
        type,
        apiKey, // ✅ CORRIGÉ: apiKey en tant que champ
        data: { config }, // ✅ data pour infos additionnelles
        isActive: true,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.user_integrations.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        apiKey: true, // ✅ AJOUTÉ: inclure apiKey
        data: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, type: string) {
    const integration = await this.prisma.user_integrations.findUnique({
      where: {
        userId_type: { userId, type },
      },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    return integration;
  }

  async toggleActive(userId: string, type: string, isActive: boolean) {
    await this.findOne(userId, type);

    return this.prisma.user_integrations.update({
      where: {
        userId_type: { userId, type },
      },
      data: { isActive },
    });
  }

  async delete(userId: string, type: string) {
    await this.findOne(userId, type);

    return this.prisma.user_integrations.delete({
      where: {
        userId_type: { userId, type },
      },
    });
  }

  async testIntegration(userId: string, type: string) {
    const integration = await this.findOne(userId, type);

    if (!integration.isActive) {
      return { success: false, message: 'Integration is not active' };
    }

    return {
      success: true,
      type: integration.type,
      hasApiKey: !!integration.apiKey,
      data: integration.data,
    };
  }
}
