import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { AiOrchestratorService } from '../../intelligence/ai-orchestrator/services/ai-orchestrator.service';
import { OrchestrationRequestDto, OrchestrationObjective } from '../../intelligence/ai-orchestrator/dto';

/**
 * Service de synchronisation entre le module Documents et le module Intelligence
 * 
 * Fonctionnalités:
 * - Lier des documents à des projets d'investissement
 * - Générer automatiquement des documents basés sur l'analyse d'investissement
 * - Synchroniser les métadonnées intelligentes
 * - Suggérer des documents pertinents pour un projet
 */
@Injectable()
export class DocumentsIntelligenceSyncService {
  private readonly logger = new Logger(DocumentsIntelligenceSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiOrchestrator: AiOrchestratorService,
  ) {}

  /**
   * Lier un document à un projet d'investissement
   */
  async linkDocumentToInvestmentProject(
    userId: string,
    documentId: string,
    investmentProjectId: string,
    linkType: string,
    linkReason?: string,
    metadata?: any,
  ) {
    this.logger.log(`Linking document ${documentId} to investment project ${investmentProjectId}`);

    // Vérifier que le document existe et appartient à l'utilisateur
    const document = await this.prisma.documents.findFirst({
      where: { id: documentId, userId },
    });

    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId}`);
    }

    // Vérifier que le projet existe
    const project = await this.prisma.investmentProject.findFirst({
      where: { id: investmentProjectId, userId },
    });

    if (!project) {
      throw new NotFoundException(`Investment project not found: ${investmentProjectId}`);
    }

    // Créer ou mettre à jour le lien
    const link = await this.prisma.document_investment_link.upsert({
      where: {
        documentId_investmentProjectId: {
          documentId,
          investmentProjectId,
        },
      },
      create: {
        documentId,
        investmentProjectId,
        linkType,
        linkReason,
        metadata: metadata || {},
      },
      update: {
        linkType,
        linkReason,
        metadata: metadata || {},
        updatedAt: new Date(),
      },
      include: {
        document: true,
        investmentProject: true,
      },
    });

    // Mettre à jour le document avec les métadonnées de synchronisation
    await this.prisma.documents.update({
      where: { id: documentId },
      data: {
        intelligenceSyncedAt: new Date(),
        intelligenceMetadata: {
          linkedProjects: [investmentProjectId],
          lastSyncType: linkType,
        },
      },
    });

    this.logger.log(`Document linked successfully`);
    return link;
  }

  /**
   * Générer un document automatiquement basé sur un projet d'investissement
   */
  async generateDocumentFromInvestmentProject(
    userId: string,
    tenantId: string,
    investmentProjectId: string,
    documentType: string,
    options?: {
      templateId?: string;
      variables?: any;
      autoLink?: boolean;
    },
  ) {
    this.logger.log(`Generating ${documentType} document for investment project ${investmentProjectId}`);

    // Récupérer le projet avec son analyse
    const project = await this.prisma.investmentProject.findFirst({
      where: { id: investmentProjectId, userId },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Investment project not found: ${investmentProjectId}`);
    }

    // Préparer le contexte pour l'AI Orchestrator
    const context = {
      projectData: {
        title: project.title,
        description: project.description,
        city: project.city,
        country: project.country,
        totalPrice: project.totalPrice,
        minTicket: project.minTicket,
        targetYield: project.targetYield,
        durationMonths: project.durationMonths,
        propertyType: project.propertyType,
      },
      analysisData: project.analyses[0] || null,
      documentType,
      variables: options?.variables || {},
    };

    // Construire le prompt pour la génération de document
    const prompt = this.buildDocumentGenerationPrompt(documentType, context);

    // Appeler l'AI Orchestrator pour générer le document
    const request: OrchestrationRequestDto = {
      objective: OrchestrationObjective.CUSTOM,
      context: {
        userQuery: prompt,
        ...context,
      },
      tenantId,
      userId,
      options: {
        maxCost: 1.0,
      },
    };

    const orchestrationResult = await this.aiOrchestrator.orchestrate(request);

    // Le contenu généré devrait être dans la synthèse
    const generatedContent = orchestrationResult.synthesis || '';

    // TODO: Sauvegarder le fichier sur le disque et obtenir le vrai fileUrl et filePath
    const tempFileUrl = `/api/documents/temp/${Date.now()}.txt`;
    const tempFilePath = `./uploads/temp/${Date.now()}.txt`;

    // Créer le document dans la base de données
    const document = await this.prisma.documents.create({
      data: {
        userId,
        name: `${documentType}_${project.title}_${new Date().toISOString().split('T')[0]}`,
        originalName: `${documentType}.txt`,
        description: `Document généré automatiquement pour le projet: ${project.title}`,
        fileUrl: tempFileUrl,
        filePath: tempFilePath,
        mimeType: 'text/plain',
        fileSize: Buffer.byteLength(generatedContent, 'utf8'),
        extension: 'txt',
        aiGenerated: true,
        realEstateDocType: this.mapDocumentTypeToEnum(documentType),
        investmentProjectId,
        status: 'draft',
        intelligenceSyncedAt: new Date(),
        intelligenceMetadata: {
          generatedFrom: 'investment_analysis',
          projectId: investmentProjectId,
          orchestrationId: orchestrationResult.id || null,
        },
      },
    });

    // Lier automatiquement si demandé
    if (options?.autoLink !== false) {
      await this.linkDocumentToInvestmentProject(
        userId,
        document.id,
        investmentProjectId,
        'analysis_report',
        'Auto-generated from investment analysis',
      );
    }

    this.logger.log(`Document generated successfully: ${document.id}`);

    return {
      document,
      content: generatedContent,
      orchestrationResult,
    };
  }

  /**
   * Récupérer tous les documents liés à un projet d'investissement
   */
  async getDocumentsForInvestmentProject(userId: string, investmentProjectId: string) {
    this.logger.log(`Getting documents for investment project ${investmentProjectId}`);

    const links = await this.prisma.document_investment_link.findMany({
      where: {
        investmentProjectId,
        document: { userId },
      },
      include: {
        document: {
          include: {
            category: true,
            agency: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return links.map(link => ({
      ...link.document,
      linkType: link.linkType,
      linkReason: link.linkReason,
      linkMetadata: link.metadata,
      linkedAt: link.createdAt,
    }));
  }

  /**
   * Récupérer tous les projets d'investissement liés à un document
   */
  async getInvestmentProjectsForDocument(userId: string, documentId: string) {
    this.logger.log(`Getting investment projects for document ${documentId}`);

    const links = await this.prisma.document_investment_link.findMany({
      where: {
        documentId,
        investmentProject: { userId },
      },
      include: {
        investmentProject: {
          include: {
            analyses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return links.map(link => ({
      ...link.investmentProject,
      linkType: link.linkType,
      linkReason: link.linkReason,
      linkMetadata: link.metadata,
      linkedAt: link.createdAt,
      latestAnalysis: link.investmentProject.analyses[0] || null,
    }));
  }

  /**
   * Suggérer des documents pertinents pour un projet d'investissement
   */
  async suggestDocumentsForProject(userId: string, investmentProjectId: string) {
    this.logger.log(`Suggesting documents for investment project ${investmentProjectId}`);

    const project = await this.prisma.investmentProject.findFirst({
      where: { id: investmentProjectId, userId },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Investment project not found: ${investmentProjectId}`);
    }

    // Déterminer les types de documents recommandés selon le statut du projet
    const suggestedTypes: Array<{ type: string; priority: number; reason: string }> = [];

    switch (project.status) {
      case 'draft':
        suggestedTypes.push(
          { type: 'investment_analysis', priority: 1, reason: 'Analyse préliminaire nécessaire' },
          { type: 'appraisal_report', priority: 2, reason: 'Évaluation du bien recommandée' },
        );
        break;
      case 'analyzing':
        suggestedTypes.push(
          { type: 'financial_projection', priority: 1, reason: 'Projections financières requises' },
          { type: 'investment_analysis', priority: 2, reason: 'Analyse détaillée en cours' },
        );
        break;
      case 'active':
        suggestedTypes.push(
          { type: 'sales_contract', priority: 1, reason: 'Contrat de vente à préparer' },
          { type: 'commission_agreement', priority: 2, reason: 'Accord de commission recommandé' },
          { type: 'property_management_contract', priority: 3, reason: 'Gestion du bien' },
        );
        break;
      case 'funded':
        suggestedTypes.push(
          { type: 'property_deed', priority: 1, reason: 'Acte de propriété nécessaire' },
          { type: 'insurance_policy', priority: 2, reason: 'Assurance du bien' },
        );
        break;
    }

    // Vérifier quels documents existent déjà
    const existingLinks = await this.prisma.document_investment_link.findMany({
      where: { investmentProjectId },
      include: { document: true },
    });

    const existingTypes = new Set(
      existingLinks.map(link => link.document.realEstateDocType).filter(Boolean),
    );

    // Filtrer les suggestions pour ne garder que les types manquants
    const suggestions = suggestedTypes
      .filter(s => !existingTypes.has(s.type as any))
      .map(s => ({
        ...s,
        canGenerate: true,
        estimatedTime: '2-5 minutes',
      }));

    return {
      projectId: investmentProjectId,
      projectStatus: project.status,
      suggestedDocuments: suggestions,
      existingDocuments: existingLinks.length,
    };
  }

  /**
   * Supprimer un lien entre document et projet
   */
  async unlinkDocumentFromInvestmentProject(
    userId: string,
    documentId: string,
    investmentProjectId: string,
  ) {
    this.logger.log(`Unlinking document ${documentId} from investment project ${investmentProjectId}`);

    // Vérifier que le document appartient à l'utilisateur
    const document = await this.prisma.documents.findFirst({
      where: { id: documentId, userId },
    });

    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId}`);
    }

    // Supprimer le lien
    await this.prisma.document_investment_link.delete({
      where: {
        documentId_investmentProjectId: {
          documentId,
          investmentProjectId,
        },
      },
    });

    this.logger.log(`Document unlinked successfully`);
    return { success: true };
  }

  /**
   * Construire le prompt pour la génération de document
   */
  private buildDocumentGenerationPrompt(documentType: string, context: any): string {
    const { projectData, analysisData, variables } = context;

    let prompt = `Génère un document professionnel de type "${documentType}" pour un projet immobilier.\n\n`;
    prompt += `**Informations du projet:**\n`;
    prompt += `- Titre: ${projectData.title}\n`;
    prompt += `- Localisation: ${projectData.city}, ${projectData.country}\n`;
    prompt += `- Prix total: ${projectData.totalPrice} ${projectData.currency || 'EUR'}\n`;
    prompt += `- Ticket minimum: ${projectData.minTicket} ${projectData.currency || 'EUR'}\n`;

    if (projectData.targetYield) {
      prompt += `- Rendement cible: ${projectData.targetYield}%\n`;
    }
    if (projectData.durationMonths) {
      prompt += `- Durée: ${projectData.durationMonths} mois\n`;
    }
    if (projectData.propertyType) {
      prompt += `- Type de bien: ${projectData.propertyType}\n`;
    }

    if (analysisData) {
      prompt += `\n**Analyse disponible:**\n`;
      prompt += `- Score global: ${analysisData.overallScore}/100\n`;
      prompt += `- Recommandation: ${analysisData.recommendation}\n`;
    }

    if (variables && Object.keys(variables).length > 0) {
      prompt += `\n**Variables supplémentaires:**\n`;
      Object.entries(variables).forEach(([key, value]) => {
        prompt += `- ${key}: ${value}\n`;
      });
    }

    prompt += `\n**Instructions:**\n`;
    prompt += `1. Utilise un ton professionnel et formel\n`;
    prompt += `2. Inclus toutes les clauses légales nécessaires\n`;
    prompt += `3. Structure le document de manière claire et logique\n`;
    prompt += `4. Adapte le contenu au contexte français/international selon le pays\n`;
    prompt += `5. Utilise les données du projet pour personnaliser le document\n`;

    return prompt;
  }

  /**
   * Mapper un type de document string vers l'enum RealEstateDocumentType
   */
  private mapDocumentTypeToEnum(documentType: string): any {
    const mapping: Record<string, string> = {
      'investment_analysis': 'investment_analysis',
      'financial_projection': 'financial_projection',
      'appraisal_report': 'appraisal_report',
      'sales_contract': 'sales_contract',
      'commission_agreement': 'commission_agreement',
      'property_management_contract': 'property_management_contract',
      'property_deed': 'property_deed',
      'insurance_policy': 'insurance_policy',
      'preliminary_sales_agreement': 'preliminary_sales_agreement',
      'sales_mandate': 'sales_mandate',
      'commission_statement': 'commission_statement',
      'promotion_contract': 'promotion_contract',
      'developer_contract': 'developer_contract',
      'construction_contract': 'construction_contract',
      'rental_management_contract': 'rental_management_contract',
      'syndic_contract': 'syndic_contract',
      'title_deed': 'title_deed',
      'cadastral_document': 'cadastral_document',
      'urban_planning_certificate': 'urban_planning_certificate',
      'lease_agreement': 'lease_agreement',
      'inspection_report': 'inspection_report',
    };

    return mapping[documentType] || 'other';
  }
}
