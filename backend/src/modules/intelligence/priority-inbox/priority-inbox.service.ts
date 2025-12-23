import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import {
  PriorityInboxQueryDto,
  PriorityItem,
  PriorityScoreFactors,
} from './dto/priority-inbox.dto';

@Injectable()
export class PriorityInboxService {
  private readonly logger = new Logger(PriorityInboxService.name);

  // Mots-clés d'urgence
  private urgentKeywords = [
    'urgent',
    'immédiat',
    'aujourd\'hui',
    'maintenant',
    'rapidement',
    'vite',
    'pressé',
    'asap',
  ];

  constructor(private prisma: PrismaService) {}

  /**
   * Obtenir la boîte de réception prioritaire
   */
  async getPriorityInbox(
    userId: string,
    query: PriorityInboxQueryDto,
  ): Promise<PriorityItem[]> {
    try {
      this.logger.log(`Getting priority inbox for user ${userId}`);

      const type = query.type || 'all';
      const limit = query.limit || 20;

      let items: PriorityItem[] = [];

      if (type === 'prospects' || type === 'all') {
        const prospectItems = await this.getPriorityProspects(userId);
        items = [...items, ...prospectItems];
      }

      if (type === 'tasks' || type === 'all') {
        const taskItems = await this.getPriorityTasks(userId);
        items = [...items, ...taskItems];
      }

      // Trier par score de priorité
      items.sort((a, b) => b.priorityScore - a.priorityScore);

      return items.slice(0, limit);
    } catch (error) {
      this.logger.error(`Error getting priority inbox: ${error.message}`);
      return [];
    }
  }

  /**
   * Obtenir les prospects prioritaires
   */
  private async getPriorityProspects(userId: string): Promise<PriorityItem[]> {
    try {
      const prospects = await this.prisma.prospects.findMany({
        where: {
          userId,
          status: { not: 'closed' },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return prospects.map((prospect) => {
        const scoreFactors = this.calculateProspectPriority(prospect);
        const priorityScore = this.calculateTotalScore(scoreFactors);
        const urgencyLevel = this.getUrgencyLevel(priorityScore);
        const reasons = this.generateReasons(scoreFactors, 'prospect');
        const recommendedActions = this.generateRecommendedActions(
          prospect,
          scoreFactors,
        );

        return {
          id: prospect.id,
          type: 'prospect',
          title: `${prospect.firstName} ${prospect.lastName}`,
          description: `Budget: ${prospect.budget || 'N/A'} - ${prospect.city || ''}`,
          priorityScore,
          urgencyLevel,
          reasons,
          metadata: {
            phone: prospect.phone,
            email: prospect.email,
            budget: prospect.budget,
            status: prospect.status,
            createdAt: prospect.createdAt,
          },
          recommendedActions,
        };
      });
    } catch (error) {
      this.logger.error(`Error getting priority prospects: ${error.message}`);
      return [];
    }
  }

  /**
   * Obtenir les tâches prioritaires
   */
  private async getPriorityTasks(userId: string): Promise<PriorityItem[]> {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const appointments = await this.prisma.appointments.findMany({
        where: {
          userId,
          startTime: { gte: now },
          status: { not: 'cancelled' },
        },
        orderBy: { startTime: 'asc' },
        take: 50,
      });

      return appointments.map((appointment) => {
        const scoreFactors = this.calculateTaskPriority(appointment);
        const priorityScore = this.calculateTotalScore(scoreFactors);
        const urgencyLevel = this.getUrgencyLevel(priorityScore);
        const reasons = this.generateReasons(scoreFactors, 'task');

        return {
          id: appointment.id,
          type: 'appointment',
          title: appointment.title || 'Rendez-vous',
          description: `${appointment.location || ''} - ${appointment.startTime.toLocaleString()}`,
          priorityScore,
          urgencyLevel,
          reasons,
          metadata: {
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            location: appointment.location,
            status: appointment.status,
          },
          recommendedActions: ['Préparer le rendez-vous', 'Vérifier les documents'],
        };
      });
    } catch (error) {
      this.logger.error(`Error getting priority tasks: ${error.message}`);
      return [];
    }
  }

  /**
   * Calculer la priorité d'un prospect
   */
  private calculateProspectPriority(prospect: any): PriorityScoreFactors {
    const factors: PriorityScoreFactors = {
      urgencyKeywords: 0,
      budgetLevel: 0,
      responseTime: 0,
      engagementLevel: 0,
      conversionProbability: 0,
    };

    // Mots-clés d'urgence dans les notes
    if (prospect.notes) {
      const notesLower = prospect.notes.toLowerCase();
      this.urgentKeywords.forEach((keyword) => {
        if (notesLower.includes(keyword)) {
          factors.urgencyKeywords += 20;
        }
      });
    }

    // Niveau de budget
    if (prospect.budget) {
      if (prospect.budget > 500000) factors.budgetLevel = 30;
      else if (prospect.budget > 300000) factors.budgetLevel = 20;
      else if (prospect.budget > 100000) factors.budgetLevel = 10;
      else factors.budgetLevel = 5;
    }

    // Temps de réponse (nouveau prospect = prioritaire)
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(prospect.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceCreation === 0) factors.responseTime = 25;
    else if (daysSinceCreation === 1) factors.responseTime = 15;
    else if (daysSinceCreation <= 3) factors.responseTime = 10;
    else factors.responseTime = 0;

    // Niveau d'engagement
    if (prospect.status === 'qualified') factors.engagementLevel = 20;
    else if (prospect.status === 'contacted') factors.engagementLevel = 15;
    else if (prospect.status === 'new') factors.engagementLevel = 10;

    // Probabilité de conversion (basée sur des indicateurs)
    if (prospect.budget && prospect.city) {
      factors.conversionProbability = 15;
    }

    return factors;
  }

  /**
   * Calculer la priorité d'une tâche
   */
  private calculateTaskPriority(appointment: any): PriorityScoreFactors {
    const factors: PriorityScoreFactors = {
      urgencyKeywords: 0,
      budgetLevel: 0,
      responseTime: 0,
      engagementLevel: 0,
      conversionProbability: 0,
    };

    // Urgence basée sur le temps
    const hoursUntil = Math.floor(
      (new Date(appointment.startTime).getTime() - Date.now()) / (1000 * 60 * 60),
    );

    if (hoursUntil <= 2) factors.urgencyKeywords = 40;
    else if (hoursUntil <= 6) factors.urgencyKeywords = 30;
    else if (hoursUntil <= 24) factors.urgencyKeywords = 20;
    else if (hoursUntil <= 48) factors.urgencyKeywords = 10;

    // Mots-clés d'urgence dans le titre/notes
    if (appointment.title || appointment.notes) {
      const text = `${appointment.title || ''} ${appointment.notes || ''}`.toLowerCase();
      this.urgentKeywords.forEach((keyword) => {
        if (text.includes(keyword)) {
          factors.urgencyKeywords += 10;
        }
      });
    }

    return factors;
  }

  /**
   * Calculer le score total
   */
  private calculateTotalScore(factors: PriorityScoreFactors): number {
    return Math.min(
      factors.urgencyKeywords +
        factors.budgetLevel +
        factors.responseTime +
        factors.engagementLevel +
        factors.conversionProbability,
      100,
    );
  }

  /**
   * Déterminer le niveau d'urgence
   */
  private getUrgencyLevel(
    score: number,
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Générer les raisons de la priorité
   */
  private generateReasons(
    factors: PriorityScoreFactors,
    type: string,
  ): string[] {
    const reasons: string[] = [];

    if (factors.urgencyKeywords > 15) {
      reasons.push('Contient des mots-clés urgents');
    }
    if (factors.budgetLevel >= 20) {
      reasons.push('Budget élevé');
    }
    if (factors.responseTime >= 15) {
      reasons.push('Nouveau contact récent');
    }
    if (factors.engagementLevel >= 15) {
      reasons.push('Prospect qualifié et engagé');
    }
    if (factors.conversionProbability >= 10) {
      reasons.push('Forte probabilité de conversion');
    }

    return reasons.length > 0 ? reasons : ['Priorité standard'];
  }

  /**
   * Générer des actions recommandées
   */
  private generateRecommendedActions(
    prospect: any,
    factors: PriorityScoreFactors,
  ): string[] {
    const actions: string[] = [];

    if (factors.responseTime >= 15) {
      actions.push('Contacter immédiatement');
    }
    if (factors.budgetLevel >= 20) {
      actions.push('Proposer des biens premium');
    }
    if (!prospect.email && !prospect.phone) {
      actions.push('Compléter les informations de contact');
    }
    if (prospect.status === 'new') {
      actions.push('Qualifier le prospect');
    }

    return actions.length > 0
      ? actions
      : ['Suivre le processus standard'];
  }

  /**
   * Obtenir les statistiques de la boîte prioritaire
   */
  async getPriorityStats(userId: string): Promise<any> {
    try {
      const items = await this.getPriorityInbox(userId, { limit: 100 });

      const stats = {
        total: items.length,
        critical: items.filter((i) => i.urgencyLevel === 'critical').length,
        high: items.filter((i) => i.urgencyLevel === 'high').length,
        medium: items.filter((i) => i.urgencyLevel === 'medium').length,
        low: items.filter((i) => i.urgencyLevel === 'low').length,
        byType: {
          prospects: items.filter((i) => i.type === 'prospect').length,
          appointments: items.filter((i) => i.type === 'appointment').length,
        },
      };

      return stats;
    } catch (error) {
      this.logger.error(`Error getting priority stats: ${error.message}`);
      return null;
    }
  }
}
