import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { CreateProspectDto, UpdateProspectDto, PaginationQueryDto } from './dto';
import { ProspectHistoryService } from './prospect-history.service';

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
  constructor(
    private prisma: PrismaService,
    private historyService: ProspectHistoryService,
  ) {}

  /**
   * Calculate prospect score (0-100)
   */
  private calculateScore(prospect: any): number {
    let score = 0;

    // Contact info (40 points max)
    if (prospect.email) score += 20;
    if (prospect.phone) score += 20;

    // Financial info (30 points)
    if (prospect.budget) score += 30;

    // Profile completeness (30 points)
    if (prospect.preferences) score += 10;
    if (prospect.firstName && prospect.lastName) score += 10;
    if (prospect.source) score += 5;
    if (prospect.notes) score += 5;

    return Math.min(score, 100);
  }

  async create(userId: string, data: CreateProspectDto) {
    try {
      // Convert budget number to JSON format for Prisma
      const prospectData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        type: data.type,
        source: data.source || null,
        notes: data.notes || null,
        userId,
      };

      // If budget is a number, wrap it in JSON object for Prisma Json field
      if (typeof data.budget === 'number') {
        prospectData.budget = { amount: data.budget, currency: 'TND' };
      }

      // Auto-calculate score
      prospectData.score = this.calculateScore(prospectData);

      console.log(
        '[ProspectsService] Creating prospect with data:',
        JSON.stringify(prospectData, null, 2),
      );

      const result = await this.prisma.prospects.create({
        data: prospectData,
      });

      // Log creation to history
      await this.historyService.logChange(result.id, userId, 'created', { new: result });

      console.log('[ProspectsService] Prospect created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('[ProspectsService] Error creating prospect:', error);
      throw error;
    }
  }

  async findAll(userId: string, filters?: ProspectFilters) {
    const where: any = { userId, deletedAt: null };

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

  async findOne(id: string, userId: string, includes?: string[]) {
    const include: any = {};

    if (!includes || includes.length === 0) {
      // Par défaut : matches et appointments
      include.matches = { include: { properties: true } };
      include.appointments = true;
    } else {
      if (includes.includes('matches')) include.matches = { include: { properties: true } };
      if (includes.includes('appointments')) include.appointments = true;
      if (includes.includes('interactions')) include.interactions = { orderBy: { date: 'desc' } };
      if (includes.includes('timeline'))
        include.timelineStages = { orderBy: { enteredAt: 'desc' } };
      if (includes.includes('preferences')) include.preferences_details = true;
      if (includes.includes('documents')) include.documents = true;
      if (includes.includes('tasks')) include.tasks = true;
      if (includes.includes('communications'))
        include.communications = { orderBy: { sentAt: 'desc' } };
    }

    const prospect = await this.prisma.prospects.findFirst({
      where: { id, userId, deletedAt: null },
      include,
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    return prospect;
  }

  async update(id: string, userId: string, data: UpdateProspectDto) {
    // Vérifier que le prospect appartient à l'utilisateur
    const oldProspect = await this.prisma.prospects.findFirst({
      where: { id, userId },
    });

    if (!oldProspect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    // Recalculate score if data changed (unless score explicitly provided)
    const updatedData: any = { ...data };
    if (!updatedData.score) {
      updatedData.score = this.calculateScore({ ...oldProspect, ...updatedData });
    }

    const updatedProspect = await this.prisma.prospects.update({
      where: { id },
      data: updatedData,
    });

    // Log update to history
    await this.historyService.logChange(id, userId, 'updated', {
      old: oldProspect,
      new: updatedProspect,
    });

    return updatedProspect;
  }

  async delete(id: string, userId: string) {
    // Vérifier que le prospect appartient à l'utilisateur
    const prospect = await this.prisma.prospects.findFirst({
      where: { id, userId },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    // Soft delete
    const deleted = await this.prisma.prospects.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log deletion to history
    await this.historyService.logChange(id, userId, 'deleted', { old: prospect });

    return deleted;
  }

  /**
   * Restore a soft-deleted prospect
   */
  async restore(id: string, userId: string) {
    const prospect = await this.prisma.prospects.findFirst({
      where: { id, userId },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    const restored = await this.prisma.prospects.update({
      where: { id },
      data: { deletedAt: null },
    });

    // Log restoration to history
    await this.historyService.logChange(id, userId, 'restored', { new: restored });

    return restored;
  }

  /**
   * Get trashed prospects (soft-deleted)
   */
  async getTrashed(userId: string) {
    return this.prisma.prospects.findMany({
      where: { userId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
  }

  /**
   * Permanently delete a prospect (hard delete)
   */
  async permanentDelete(id: string, userId: string) {
    const prospect = await this.prisma.prospects.findFirst({
      where: { id, userId },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    // Log permanent deletion before deleting
    await this.historyService.logChange(id, userId, 'permanently_deleted', { old: prospect });

    return this.prisma.prospects.delete({
      where: { id },
    });
  }

  /**
   * Cursor-based pagination
   */
  async findAllPaginated(userId: string, query: PaginationQueryDto, filters?: ProspectFilters) {
    const limit = query.limit || 20;
    const where: any = { userId, deletedAt: null };

    // Apply filters
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.minBudget) {
      where.budget = { ...(where.budget || {}), gte: parseFloat(filters.minBudget) };
    }
    if (filters?.maxBudget) {
      where.budget = { ...(where.budget || {}), lte: parseFloat(filters.maxBudget) };
    }

    const prospects = await this.prisma.prospects.findMany({
      where,
      take: limit + 1,
      ...(query.cursor && {
        cursor: { id: query.cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        matches: {
          include: {
            properties: true,
          },
        },
      },
    });

    const hasNextPage = prospects.length > limit;
    const items = hasNextPage ? prospects.slice(0, limit) : prospects;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasNextPage,
      total: await this.prisma.prospects.count({ where }),
    };
  }

  /**
   * Full-text search
   */
  async search(userId: string, query: string) {
    return this.prisma.prospects.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { notes: { contains: query, mode: 'insensitive' } },
        ],
      },
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

  /**
   * Advanced statistics
   */
  async getStats(userId: string) {
    const [total, active, converted, qualified, rejected, avgScore, byType, bySource] =
      await Promise.all([
        this.prisma.prospects.count({ where: { userId, deletedAt: null } }),
        this.prisma.prospects.count({ where: { userId, status: 'active', deletedAt: null } }),
        this.prisma.prospects.count({ where: { userId, status: 'converted', deletedAt: null } }),
        this.prisma.prospects.count({ where: { userId, status: 'qualified', deletedAt: null } }),
        this.prisma.prospects.count({ where: { userId, status: 'rejected', deletedAt: null } }),
        this.prisma.prospects.aggregate({
          where: { userId, deletedAt: null },
          _avg: { score: true },
        }),
        this.prisma.prospects.groupBy({
          by: ['type'],
          where: { userId, deletedAt: null },
          _count: true,
        }),
        this.prisma.prospects.groupBy({
          by: ['source'],
          where: { userId, deletedAt: null, source: { not: null } },
          _count: true,
        }),
      ]);

    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return {
      total,
      active,
      converted,
      qualified,
      rejected,
      avgScore: avgScore._avg.score || 0,
      conversionRate: Math.round(conversionRate * 100) / 100,
      byType: byType.reduce((acc, item) => ({ ...acc, [item.type]: item._count }), {}),
      bySource: bySource.reduce((acc, item) => ({ ...acc, [item.source!]: item._count }), {}),
    };
  }

  /**
   * Export to CSV
   */
  async exportCSV(userId: string, filters?: ProspectFilters) {
    const prospects = await this.findAll(userId, filters);

    const headers = [
      'ID',
      'Prénom',
      'Nom',
      'Email',
      'Téléphone',
      'Type',
      'Statut',
      'Score',
      'Source',
      'Budget',
      'Créé le',
      'Mis à jour le',
    ];

    const rows = prospects.map((p) => [
      p.id,
      p.firstName || '',
      p.lastName || '',
      p.email || '',
      p.phone || '',
      p.type,
      p.status,
      p.score,
      p.source || '',
      p.budget ? JSON.stringify(p.budget) : '',
      new Date(p.createdAt).toLocaleDateString('fr-FR'),
      new Date(p.updatedAt).toLocaleDateString('fr-FR'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return {
      content: csvContent,
      filename: `prospects_${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv',
    };
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
