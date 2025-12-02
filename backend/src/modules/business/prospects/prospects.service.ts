import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { CreateProspectDto, UpdateProspectDto } from './dto';

interface ProspectFilters {
  type?: string;
  status?: string;
  minBudget?: string;
  maxBudget?: string;
}

interface InteractionData {
  type: string;
  content: string;
}

@Injectable()
export class ProspectsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateProspectDto) {
    // Convert budget number to JSON format for Prisma
    const prospectData: any = {
      ...data,
      userId,
    };

    // If budget is a number, wrap it in JSON object for Prisma Json field
    if (typeof data.budget === 'number') {
      prospectData.budget = { amount: data.budget, currency: 'TND' };
    }

    return this.prisma.prospects.create({
      data: prospectData,
    });
  }

  async findAll(userId: string, filters?: ProspectFilters) {
    const where: any = { userId };

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.minBudget) {
      where.budget = { ...(where.budget || {}), gte: parseFloat(filters.minBudget) };
    }
    if (filters?.maxBudget) {
      where.budget = { ...(where.budget || {}), lte: parseFloat(filters.maxBudget) };
    }

    return this.prisma.prospects.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        matches: {
          include: {
            properties: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const prospect = await this.prisma.prospects.findFirst({
      where: { id, userId },
      include: {
        matches: {
          include: {
            properties: true,
          },
        },
        appointments: true,
      },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    return prospect;
  }

  async update(id: string, userId: string, data: UpdateProspectDto) {
    // Vérifier que le prospect appartient à l'utilisateur
    const prospect = await this.prisma.prospects.findFirst({
      where: { id, userId },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    return this.prisma.prospects.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string) {
    // Vérifier que le prospect appartient à l'utilisateur
    const prospect = await this.prisma.prospects.findFirst({
      where: { id, userId },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    return this.prisma.prospects.delete({
      where: { id },
    });
  }

  async addInteraction(prospectId: string, userId: string, interactionData: InteractionData) {
    const prospect = await this.prisma.prospects.findFirst({
      where: { id: prospectId, userId },
    });

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    const currentNotes = prospect.notes || '';
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${interactionData.type}: ${interactionData.content}`;

    await this.prisma.prospects.update({
      where: { id: prospectId },
      data: {
        notes: currentNotes ? `${currentNotes}\n${newNote}` : newNote,
      },
    });

    return { success: true, interaction: { ...interactionData, timestamp } };
  }

  async getInteractions(prospectId: string, userId: string) {
    const prospect = await this.prisma.prospects.findFirst({
      where: { id: prospectId, userId },
    });

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    const notes = prospect.notes || '';
    const interactions = notes
      .split('\n')
      .filter((n) => n.trim())
      .map((note) => {
        const match = note.match(/\[(.*?)\] (.*?): (.*)/);
        if (match) {
          return {
            timestamp: match[1],
            type: match[2],
            content: match[3],
          };
        }
        return { timestamp: '', type: 'note', content: note };
      });

    return { interactions };
  }
}
