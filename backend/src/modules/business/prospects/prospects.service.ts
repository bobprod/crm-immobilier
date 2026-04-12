import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../shared/database/prisma.service';
import { CreateProspectDto, UpdateProspectDto, PaginationQueryDto } from './dto';
import { ProspectHistoryService } from './prospect-history.service';
import { ErrorHandler } from '../../../shared/utils/error-handler.utils';
import { paginate } from '../../../shared/utils/pagination.utils';
import { readFileSync, unlinkSync } from 'fs';
import {
  ProspectCreatedEvent,
  ProspectStatusChangedEvent,
  ProspectConvertedEvent,
} from '../shared/events/business.events';

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
    private eventEmitter: EventEmitter2,
  ) { }

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

      // Emit analytics event
      this.eventEmitter.emit('prospect.created', new ProspectCreatedEvent(userId, result));

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
    // Note: budget is a JSONB field — cannot filter inside pg driver with gte/lte
    // Budget filtering is applied in-memory below

    const prospects = await this.prisma.prospects.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // In-memory budget filtering (JSONB field)
    if (filters?.minBudget || filters?.maxBudget) {
      const min = filters.minBudget ? parseFloat(filters.minBudget) : null;
      const max = filters.maxBudget ? parseFloat(filters.maxBudget) : null;
      return prospects.filter((p: any) => {
        const budget = p.budget as any;
        if (!budget) return min === null;
        const amount = budget.amount ?? budget.max ?? budget.min ?? 0;
        if (min !== null && amount < min) return false;
        if (max !== null && amount > max) return false;
        return true;
      });
    }

    return prospects;
  }

  async findOne(id: string, userId: string, includes?: string[]) {
    // Flat query — no include (custom PrismaService shim doesn't support it)
    const prospect = await this.prisma.prospects.findFirst({
      where: { id, userId, deletedAt: null },
    });

    return ErrorHandler.ensureExists(prospect, 'Prospect', id);
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

    // Emit status changed event if status was updated
    if (data.status && data.status !== oldProspect.status) {
      if (data.status === 'converted') {
        this.eventEmitter.emit('prospect.converted', new ProspectConvertedEvent(userId, updatedProspect));
      } else {
        this.eventEmitter.emit(
          'prospect.status_changed',
          new ProspectStatusChangedEvent(userId, updatedProspect, oldProspect.status, data.status),
        );
      }
    }

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

    return paginate(
      query,
      (take, cursorQuery) =>
        this.prisma.prospects.findMany({
          where,
          take,
          ...cursorQuery,
          orderBy: { createdAt: 'desc' },
        }),
      () => this.prisma.prospects.count({ where }),
    );
  }

  /**
   * Full-text search — in-memory filtering (custom pg driver doesn't support contains/mode)
   */
  async search(userId: string, query: string) {
    const all = await this.prisma.prospects.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!query || !query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(
      (p: any) =>
        (p.firstName || '').toLowerCase().includes(q) ||
        (p.lastName || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q) ||
        (p.notes || '').toLowerCase().includes(q),
    );
  }

  /**
   * Advanced statistics
   */
  async getStats(userId: string) {
    const [total, active, converted, qualified, rejected, allProspects] =
      await Promise.all([
        this.prisma.prospects.count({ where: { userId, deletedAt: null } }),
        this.prisma.prospects.count({ where: { userId, status: 'active', deletedAt: null } }),
        this.prisma.prospects.count({ where: { userId, status: 'converted', deletedAt: null } }),
        this.prisma.prospects.count({ where: { userId, status: 'qualified', deletedAt: null } }),
        this.prisma.prospects.count({ where: { userId, status: 'rejected', deletedAt: null } }),
        this.prisma.prospects.findMany({ where: { userId, deletedAt: null } }),
      ]);

    // Calculate avg score, byType, bySource in memory
    let totalScore = 0;
    const byTypeMap: Record<string, number> = {};
    const bySourceMap: Record<string, number> = {};
    for (const p of allProspects as any[]) {
      totalScore += p.score || 0;
      byTypeMap[p.type] = (byTypeMap[p.type] || 0) + 1;
      if (p.source) bySourceMap[p.source] = (bySourceMap[p.source] || 0) + 1;
    }
    const avgScore = total > 0 ? totalScore / total : 0;

    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return {
      total,
      active,
      converted,
      qualified,
      rejected,
      avgScore: Math.round(avgScore * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      byType: byTypeMap,
      bySource: bySourceMap,
      // Extra fields expected by frontend ProspectStats interface
      activeProspects: active,
      averageScore: Math.round(avgScore * 100) / 100,
      byStatus: { active, converted, qualified, rejected },
      convertedThisMonth: converted,
      newThisMonth: 0,
    };
  }

  /**
   * Get prospects grouped by pipeline stage (Bitrix24/Odoo CRM style Kanban pipeline)
   * Maps existing status values to visual pipeline stages
   */
  async getPipeline(userId: string) {
    // Pipeline stages inspired by Bitrix24 and Odoo CRM
    const PIPELINE_STAGES = [
      { key: 'nouveau', label: 'Nouveau', statuses: ['lead', 'new'], color: '#6366f1' },
      { key: 'contacte', label: 'Contacté', statuses: ['active', 'contacted'], color: '#3b82f6' },
      { key: 'qualifie', label: 'Qualifié', statuses: ['qualified'], color: '#8b5cf6' },
      { key: 'visite', label: 'Visite', statuses: ['meeting', 'visit'], color: '#f59e0b' },
      { key: 'offre', label: 'Offre', statuses: ['negotiation', 'offer'], color: '#10b981' },
      { key: 'gagne', label: 'Gagné', statuses: ['converted', 'won', 'closed'], color: '#059669' },
      { key: 'perdu', label: 'Perdu', statuses: ['lost', 'inactive'], color: '#ef4444' },
    ];

    const allProspects = await this.prisma.prospects.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });

    // Fetch next interactions separately (flat query, no nested select)
    const prospectIds = allProspects.map((p: any) => p.id);
    let interactionsMap = new Map<string, any>();
    if (prospectIds.length > 0) {
      try {
        const interactions = await this.prisma.prospect_interactions.findMany({
          where: { prospectId: { in: prospectIds }, nextActionDate: { gte: new Date() } },
          orderBy: { nextActionDate: 'asc' },
        });
        for (const inter of interactions as any[]) {
          if (!interactionsMap.has(inter.prospectId)) {
            interactionsMap.set(inter.prospectId, inter);
          }
        }
      } catch (_) {
        // Table may not exist, gracefully degrade
      }
    }

    const columns = PIPELINE_STAGES.map((stage) => {
      const cards = allProspects
        .filter((p: any) => stage.statuses.includes((p.status || '').toLowerCase()))
        .map((p: any) => ({
          id: p.id, firstName: p.firstName, lastName: p.lastName,
          email: p.email, phone: p.phone, type: p.type,
          status: p.status, score: p.score, source: p.source,
          budget: p.budget, lostReason: p.lostReason,
          createdAt: p.createdAt, updatedAt: p.updatedAt,
          nextActivity: interactionsMap.get(p.id) || null,
        }));

      return {
        key: stage.key,
        label: stage.label,
        color: stage.color,
        count: cards.length,
        totalScore: cards.reduce((sum, c) => sum + (c.score || 0), 0),
        cards,
      };
    });

    // Prospects not in any stage (catch-all)
    const assignedIds = new Set(columns.flatMap((col) => col.cards.map((c: any) => c.id)));
    const unassigned = allProspects.filter((p: any) => !assignedIds.has(p.id));

    return {
      columns,
      unassigned: unassigned.length,
      total: allProspects.length,
      conversionRate:
        allProspects.length > 0
          ? Math.round(
            ((columns.find((c) => c.key === 'gagne')?.count || 0) / allProspects.length) * 10000,
          ) / 100
          : 0,
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

  async uploadAvatar(prospectId: string, userId: string, file: Express.Multer.File) {
    const prospect = await this.prisma.prospects.findFirst({
      where: { id: prospectId, userId },
    });

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    const avatarUrl = `/uploads/prospects/avatars/${file.filename}`;

    const updated = await this.prisma.prospects.update({
      where: { id: prospectId },
      data: { avatar: avatarUrl },
    });

    return { avatarUrl, prospect: updated };
  }

  // ===================== BULK ACTIONS =====================

  async bulkUpdate(userId: string, ids: string[], data: Record<string, any>) {
    const allowed = ['status', 'type', 'source', 'tags'];
    const safeData: Record<string, any> = {};
    for (const key of allowed) {
      if (data[key] !== undefined) safeData[key] = data[key];
    }
    if (Object.keys(safeData).length === 0) return { updated: 0 };

    const results = await Promise.all(
      ids.map((id) =>
        this.prisma.prospects.update({ where: { id }, data: safeData }).catch(() => null),
      ),
    );
    const updated = results.filter(Boolean).length;
    return { updated, total: ids.length };
  }

  async bulkDelete(userId: string, ids: string[]) {
    const results = await Promise.all(
      ids.map((id) =>
        this.prisma.prospects
          .update({ where: { id }, data: { deletedAt: new Date() } })
          .catch(() => null),
      ),
    );
    const deleted = results.filter(Boolean).length;
    return { deleted, total: ids.length };
  }

  async duplicate(id: string, userId: string) {
    const original = await this.prisma.prospects.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!original) throw new NotFoundException('Prospect not found');
    const {
      id: _id,
      createdAt: _ca,
      updatedAt: _ua,
      deletedAt: _da,
      score: _sc,
      avatar: _av,
      ...rest
    } = original as any;
    const copy = await this.prisma.prospects.create({
      data: {
        ...rest,
        firstName: rest.firstName ? `${rest.firstName} (copie)` : 'Copie',
        status: 'active',
        score: 0,
      },
    });
    return copy;
  }

  async updateTags(id: string, userId: string, tags: string[]) {
    const prospect = await this.prisma.prospects.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!prospect) throw new NotFoundException('Prospect not found');
    return this.prisma.prospects.update({ where: { id }, data: { tags } });
  }

  async importCSV(userId: string, file: Express.Multer.File) {
    const content = readFileSync(file.path, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return { imported: 0, errors: [] };

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const created: any[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        if (!row['email'] && !row['prenom'] && !row['firstname']) continue;

        const prospect = await this.prisma.prospects.create({
          data: {
            userId,
            firstName: row['prenom'] || row['firstname'] || row['prénom'] || '',
            lastName: row['nom'] || row['lastname'] || '',
            email: row['email'] || null,
            phone: row['telephone'] || row['phone'] || null,
            type: (['buyer', 'seller', 'renter', 'landlord', 'investor', 'other'].includes(
              row['type'],
            )
              ? row['type']
              : 'buyer') as any,
            source: row['source'] || 'csv_import',
            notes: row['notes'] || null,
            status: 'active',
            score: 0,
          },
        });
        created.push(prospect);
      } catch (e: any) {
        errors.push(`Ligne ${i + 1}: ${e.message}`);
      }
    }

    try {
      unlinkSync(file.path);
    } catch {
      /* ignore */
    }

    return { imported: created.length, errors, total: lines.length - 1 };
  }
}
