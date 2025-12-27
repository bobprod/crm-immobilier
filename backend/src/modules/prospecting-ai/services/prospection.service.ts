import { Injectable, Logger } from '@nestjs/common';
import { AiOrchestratorService } from '../../intelligence/ai-orchestrator/services/ai-orchestrator.service';
import { OrchestrationObjective, OrchestrationStatus } from '../../intelligence/ai-orchestrator/dto';
import {
  StartProspectionDto,
  ProspectionResult,
  ProspectionStatus,
  ProspectionLead,
} from '../dto';

/**
 * Service de prospection IA
 *
 * Utilise l'AI Orchestrator pour générer des leads automatiquement
 */
@Injectable()
export class ProspectionService {
  private readonly logger = new Logger(ProspectionService.name);

  constructor(private readonly aiOrchestrator: AiOrchestratorService) {}

  /**
   * Lancer une prospection
   */
  async startProspection(params: {
    tenantId: string;
    userId: string;
    request: StartProspectionDto;
  }): Promise<ProspectionResult> {
    const { tenantId, userId, request } = params;

    this.logger.log(`Starting prospection for tenant ${tenantId}: ${request.zone}`);

    const startTime = Date.now();
    const prospectionId = `prosp-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    try {
      // Choisir le moteur
      const engine = request.options?.engine || 'internal';

      if (engine === 'pica-ai') {
        return this.runPicaAiProspection(prospectionId, tenantId, userId, request);
      }

      // Moteur internal par défaut
      return this.runInternalProspection(prospectionId, tenantId, userId, request, startTime);
    } catch (error) {
      this.logger.error('Prospection failed:', error);

      return {
        id: prospectionId,
        status: ProspectionStatus.FAILED,
        leads: [],
        stats: {
          totalLeads: 0,
          withEmail: 0,
          withPhone: 0,
          avgConfidence: 0,
        },
        metadata: {
          zone: request.zone,
          targetType: request.targetType,
          propertyType: request.propertyType,
          budget: request.budget,
          keywords: request.keywords,
          executionTimeMs: Date.now() - startTime,
        },
        errors: [error.message],
        createdAt: new Date(),
      };
    }
  }

  /**
   * Moteur de prospection interne (via AI Orchestrator)
   */
  private async runInternalProspection(
    prospectionId: string,
    tenantId: string,
    userId: string,
    request: StartProspectionDto,
    startTime: number,
  ): Promise<ProspectionResult> {
    this.logger.log('Running internal prospection engine...');

    // Appeler l'AI Orchestrator avec objectif 'prospection'
    const orchestrationResult = await this.aiOrchestrator.orchestrate({
      tenantId,
      userId,
      objective: OrchestrationObjective.PROSPECTION,
      context: {
        zone: request.zone,
        targetType: request.targetType,
        propertyType: request.propertyType,
        budget: request.budget,
        keywords: request.keywords?.join(' '),
        maxResults: request.maxLeads || 20,
      },
      options: {
        executionMode: 'auto',
        maxCost: request.options?.maxCost || 5,
        timeout: 300000, // 5 minutes
      },
    });

    // Mapper le résultat de l'orchestrateur vers ProspectionResult
    const leads = this.extractLeadsFromOrchestration(orchestrationResult);

    const stats = this.calculateStats(leads);

    const status = this.mapOrchestrationStatus(orchestrationResult.status);

    return {
      id: prospectionId,
      status,
      leads,
      stats,
      metadata: {
        zone: request.zone,
        targetType: request.targetType,
        propertyType: request.propertyType,
        budget: request.budget,
        keywords: request.keywords,
        executionTimeMs: Date.now() - startTime,
        cost: orchestrationResult.metrics?.totalCost,
      },
      errors: orchestrationResult.errors,
      createdAt: new Date(),
      completedAt: status !== ProspectionStatus.RUNNING ? new Date() : undefined,
    };
  }

  /**
   * Moteur de prospection Pica.AI (à implémenter plus tard)
   */
  private async runPicaAiProspection(
    prospectionId: string,
    tenantId: string,
    userId: string,
    request: StartProspectionDto,
  ): Promise<ProspectionResult> {
    // TODO: Implémenter l'intégration Pica.AI
    this.logger.warn('Pica.AI engine not implemented yet, falling back to internal');

    return this.runInternalProspection(
      prospectionId,
      tenantId,
      userId,
      request,
      Date.now(),
    );
  }

  /**
   * Extraire les leads du résultat d'orchestration
   */
  private extractLeadsFromOrchestration(orchestrationResult: any): ProspectionLead[] {
    const finalResult = orchestrationResult.finalResult;

    if (!finalResult || !finalResult.leads) {
      this.logger.warn('No leads found in orchestration result');
      return [];
    }

    // Le finalResult.leads devrait être un tableau de leads bruts
    const rawLeads = finalResult.leads;

    if (!Array.isArray(rawLeads)) {
      this.logger.warn('Invalid leads format in orchestration result');
      return [];
    }

    // Mapper et valider les leads
    return rawLeads
      .map((raw: any) => ({
        name: raw.name || 'Unknown',
        email: raw.email || undefined,
        phone: raw.phone || undefined,
        company: raw.company || undefined,
        role: raw.role || undefined,
        context: raw.context || '',
        source: raw.source || raw.url || 'Unknown',
        confidence: raw.confidence || 0.7,
      }))
      .filter((lead) => lead.name && lead.name !== 'Unknown'); // Filtrer les leads invalides
  }

  /**
   * Calculer les statistiques des leads
   */
  private calculateStats(leads: ProspectionLead[]) {
    const totalLeads = leads.length;
    const withEmail = leads.filter((l) => l.email).length;
    const withPhone = leads.filter((l) => l.phone).length;
    const avgConfidence =
      totalLeads > 0
        ? leads.reduce((sum, l) => sum + (l.confidence || 0), 0) / totalLeads
        : 0;

    return {
      totalLeads,
      withEmail,
      withPhone,
      avgConfidence,
    };
  }

  /**
   * Mapper le statut d'orchestration vers le statut de prospection
   */
  private mapOrchestrationStatus(status: OrchestrationStatus): ProspectionStatus {
    const mapping: Record<OrchestrationStatus, ProspectionStatus> = {
      [OrchestrationStatus.PENDING]: ProspectionStatus.PENDING,
      [OrchestrationStatus.PLANNING]: ProspectionStatus.RUNNING,
      [OrchestrationStatus.EXECUTING]: ProspectionStatus.RUNNING,
      [OrchestrationStatus.COMPLETED]: ProspectionStatus.COMPLETED,
      [OrchestrationStatus.FAILED]: ProspectionStatus.FAILED,
      [OrchestrationStatus.PARTIAL]: ProspectionStatus.PARTIAL,
    };

    return mapping[status] || ProspectionStatus.FAILED;
  }
}
