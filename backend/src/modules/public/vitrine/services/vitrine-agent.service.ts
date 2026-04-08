import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';

@Injectable()
export class VitrineAgentService {
  constructor(private prisma: PrismaService) {}

  async getPublicAgents(slug: string) {
    const config = await this.prisma.vitrineConfig.findFirst({ where: { slug } });
    if (!config) throw new NotFoundException(`Vitrine '${slug}' introuvable`);
    return this.prisma.publicAgentProfile.findMany({
      where: { vitrineConfigId: config.id, isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async getPublicAgent(slug: string, agentId: string) {
    const config = await this.prisma.vitrineConfig.findFirst({ where: { slug } });
    if (!config) throw new NotFoundException(`Vitrine '${slug}' introuvable`);
    const agent = await this.prisma.publicAgentProfile.findFirst({
      where: { id: agentId, vitrineConfigId: config.id, isActive: true },
    });
    if (!agent) throw new NotFoundException('Agent introuvable');
    return agent;
  }

  // Dashboard SaaS — CRUD agents publics
  async getAgentProfiles(userId: string) {
    const config = await this.prisma.vitrineConfig.findUnique({ where: { userId } });
    if (!config) return [];
    return this.prisma.publicAgentProfile.findMany({
      where: { vitrineConfigId: config.id },
      orderBy: { order: 'asc' },
    });
  }

  async upsertAgentProfile(userId: string, data: any) {
    const config = await this.prisma.vitrineConfig.findUnique({ where: { userId } });
    if (!config) throw new NotFoundException('Vitrine non configurée');

    if (data.id) {
      return this.prisma.publicAgentProfile.update({
        where: { id: data.id },
        data: { ...data, vitrineConfigId: config.id },
      });
    }
    return this.prisma.publicAgentProfile.create({
      data: { ...data, vitrineConfigId: config.id },
    });
  }

  async deleteAgentProfile(userId: string, agentId: string) {
    const config = await this.prisma.vitrineConfig.findUnique({ where: { userId } });
    if (!config) throw new NotFoundException('Vitrine non configurée');
    const agent = await this.prisma.publicAgentProfile.findFirst({
      where: { id: agentId, vitrineConfigId: config.id },
    });
    if (!agent) throw new NotFoundException('Agent introuvable');
    return this.prisma.publicAgentProfile.delete({ where: { id: agentId } });
  }
}
