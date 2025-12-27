import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { QuickWinsLLMService } from '../../intelligence/quick-wins-llm/quick-wins-llm.service';
import { CommunicationsService } from '../communications.service';
import { AnalyzeEmailDto, GenerateDraftDto, ApproveAndSendDto } from './dto';

@Injectable()
export class EmailAIResponseService {
  private readonly logger = new Logger(EmailAIResponseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: QuickWinsLLMService,
    private readonly communicationsService: CommunicationsService,
  ) {}

  /**
   * Analyser un email entrant et détecter l'intention
   */
  async analyzeEmail(userId: string, dto: AnalyzeEmailDto) {
    this.logger.log(`Analyzing email from ${dto.from}`);

    try {
      // Récupérer le contexte si un prospect existe
      let context = null;
      if (dto.prospectId) {
        context = await this.gatherProspectContext(dto.prospectId);
      } else {
        // Essayer de trouver un prospect par email
        const prospect = await this.prisma.prospects.findFirst({
          where: { email: dto.from, userId },
        });
        if (prospect) {
          context = await this.gatherProspectContext(prospect.id);
          dto.prospectId = prospect.id;
        }
      }

      // Récupérer les détails de la propriété si mentionnée
      let property = null;
      if (dto.propertyId) {
        property = await this.prisma.properties.findUnique({
          where: { id: dto.propertyId },
        });
      }

      // Analyser l'intention avec le LLM
      const intent = await this.detectIntent(userId, dto, context, property);

      // Sauvegarder l'analyse
      const analysis = await this.prisma.email_ai_analyses.create({
        data: {
          userId,
          from: dto.from,
          subject: dto.subject,
          body: dto.body,
          prospectId: dto.prospectId,
          propertyId: dto.propertyId,
          intent: intent.type,
          confidence: intent.confidence,
          keywords: intent.keywords,
          suggestedActions: intent.suggestedActions,
          context: context ? JSON.stringify(context) : null,
          status: 'analyzed',
        },
      });

      return {
        analysisId: analysis.id,
        intent: intent.type,
        confidence: intent.confidence,
        keywords: intent.keywords,
        suggestedActions: intent.suggestedActions,
        context: context,
        property: property,
      };
    } catch (error) {
      this.logger.error(`Error analyzing email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Générer un draft de réponse
   */
  async generateDraft(userId: string, dto: GenerateDraftDto) {
    this.logger.log(`Generating draft for analysis ${dto.analysisId}`);

    try {
      // Récupérer l'analyse
      const analysis = await this.prisma.email_ai_analyses.findUnique({
        where: { id: dto.analysisId },
        include: { prospects: true, properties: true },
      });

      if (!analysis || analysis.userId !== userId) {
        throw new Error('Analysis not found');
      }

      // Récupérer le contexte
      const context = analysis.context ? JSON.parse(analysis.context as string) : null;

      // Générer la réponse avec le LLM
      const response = await this.generateResponse(
        userId,
        analysis,
        context,
        dto.additionalInstructions,
      );

      // Suggestions de pièces jointes
      const attachmentSuggestions = await this.suggestAttachments(analysis);

      // Sauvegarder le draft
      const draft = await this.prisma.email_ai_drafts.create({
        data: {
          userId,
          analysisId: dto.analysisId,
          to: analysis.from,
          subject: response.subject,
          body: response.body,
          attachmentSuggestions: attachmentSuggestions,
          status: 'pending',
        },
      });

      return {
        draftId: draft.id,
        to: draft.to,
        subject: draft.subject,
        body: draft.body,
        attachmentSuggestions: attachmentSuggestions,
        analysis: {
          intent: analysis.intent,
          keywords: analysis.keywords,
        },
      };
    } catch (error) {
      this.logger.error(`Error generating draft: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Approuver et envoyer un draft
   */
  async approveAndSend(userId: string, dto: ApproveAndSendDto) {
    this.logger.log(`Approving and sending draft ${dto.draftId}`);

    try {
      // Récupérer le draft
      const draft = await this.prisma.email_ai_drafts.findUnique({
        where: { id: dto.draftId },
        include: { email_ai_analyses: true },
      });

      if (!draft || draft.userId !== userId) {
        throw new Error('Draft not found');
      }

      // Envoyer l'email via le service de communications
      const result = await this.communicationsService.sendEmail(userId, {
        to: draft.to,
        subject: dto.subject,
        body: dto.body,
        attachments: dto.attachments,
        prospectId: draft.email_ai_analyses.prospectId,
        propertyId: draft.email_ai_analyses.propertyId,
      });

      // Mettre à jour le status du draft
      await this.prisma.email_ai_drafts.update({
        where: { id: dto.draftId },
        data: {
          status: result.success ? 'sent' : 'failed',
          sentAt: result.success ? new Date() : null,
          subject: dto.subject,
          body: dto.body,
        },
      });

      // Mettre à jour l'analyse
      await this.prisma.email_ai_analyses.update({
        where: { id: draft.analysisId },
        data: { status: 'completed' },
      });

      return {
        success: result.success,
        messageId: result.messageId,
        draftId: dto.draftId,
      };
    } catch (error) {
      this.logger.error(`Error approving and sending draft: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Lister les drafts en attente
   */
  async getDrafts(userId: string, status?: string) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return this.prisma.email_ai_drafts.findMany({
      where,
      include: {
        email_ai_analyses: {
          include: {
            prospects: true,
            properties: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Historique des réponses
   */
  async getHistory(userId: string, filters?: any) {
    const where: any = { userId };

    if (filters?.intent) where.intent = filters.intent;
    if (filters?.status) where.status = filters.status;
    if (filters?.prospectId) where.prospectId = filters.prospectId;

    return this.prisma.email_ai_analyses.findMany({
      where,
      include: {
        prospects: true,
        properties: true,
        email_ai_drafts: true,
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });
  }

  /**
   * Statistiques
   */
  async getStats(userId: string) {
    const [
      totalAnalyses,
      pendingDrafts,
      sentDrafts,
      infoRequests,
      appointmentRequests,
      negotiations,
    ] = await Promise.all([
      this.prisma.email_ai_analyses.count({ where: { userId } }),
      this.prisma.email_ai_drafts.count({ where: { userId, status: 'pending' } }),
      this.prisma.email_ai_drafts.count({ where: { userId, status: 'sent' } }),
      this.prisma.email_ai_analyses.count({ where: { userId, intent: 'information' } }),
      this.prisma.email_ai_analyses.count({ where: { userId, intent: 'appointment' } }),
      this.prisma.email_ai_analyses.count({ where: { userId, intent: 'negotiation' } }),
    ]);

    return {
      totalAnalyses,
      pendingDrafts,
      sentDrafts,
      byIntent: {
        information: infoRequests,
        appointment: appointmentRequests,
        negotiation: negotiations,
      },
      responseRate: totalAnalyses > 0 ? (sentDrafts / totalAnalyses) * 100 : 0,
    };
  }

  // ===== Private Helper Methods =====

  /**
   * Récupérer le contexte d'un prospect
   */
  private async gatherProspectContext(prospectId: string) {
    const prospect = await this.prisma.prospects.findUnique({
      where: { id: prospectId },
      include: {
        appointments: { take: 5, orderBy: { scheduledAt: 'desc' } },
        communications: { take: 10, orderBy: { sentAt: 'desc' } },
      },
    });

    if (!prospect) return null;

    return {
      name: `${prospect.firstName} ${prospect.lastName}`,
      email: prospect.email,
      phone: prospect.phone,
      status: prospect.status,
      budget: prospect.budget,
      propertyType: prospect.propertyType,
      location: prospect.location,
      recentAppointments: prospect.appointments.length,
      recentCommunications: prospect.communications.length,
      lastContact: prospect.lastContactAt,
    };
  }

  /**
   * Détecter l'intention de l'email avec le LLM
   */
  private async detectIntent(
    userId: string,
    email: AnalyzeEmailDto,
    context: any,
    property: any,
  ) {
    try {
      const prompt = `Analyse cet email entrant d'un client immobilier et retourne un JSON avec:
- type: le type d'intention (information/appointment/negotiation/complaint/other)
- confidence: niveau de confiance 0-100
- keywords: mots-clés principaux (array)
- suggestedActions: actions recommandées (array)

Email:
Sujet: ${email.subject}
Corps: ${email.body}

${context ? `Contexte client: ${JSON.stringify(context)}` : ''}
${property ? `Propriété concernée: ${property.title} - ${property.price} TND` : ''}

Réponds uniquement avec un JSON valide.`;

      const response = await this.llmService.analyzeText(userId, prompt);

      try {
        const parsed = JSON.parse(response);
        return {
          type: parsed.type || 'other',
          confidence: parsed.confidence || 50,
          keywords: parsed.keywords || [],
          suggestedActions: parsed.suggestedActions || [],
        };
      } catch (e) {
        // Fallback si parsing échoue
        return this.fallbackIntentDetection(email);
      }
    } catch (error) {
      this.logger.warn('LLM intent detection failed, using fallback');
      return this.fallbackIntentDetection(email);
    }
  }

  /**
   * Fallback pour la détection d'intention
   */
  private fallbackIntentDetection(email: AnalyzeEmailDto) {
    const text = `${email.subject} ${email.body}`.toLowerCase();

    // Mots-clés par intention
    const intentKeywords = {
      appointment: ['rendez-vous', 'visite', 'voir', 'visiter', 'disponible', 'quand'],
      negotiation: ['prix', 'négocier', 'offre', 'budget', 'réduire', 'discount'],
      information: ['info', 'détails', 'caractéristiques', 'photo', 'plan'],
      complaint: ['problème', 'insatisfait', 'déçu', 'réclamation'],
    };

    let detectedIntent = 'other';
    let maxScore = 0;

    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      const score = keywords.filter(keyword => text.includes(keyword)).length;
      if (score > maxScore) {
        maxScore = score;
        detectedIntent = intent;
      }
    }

    return {
      type: detectedIntent,
      confidence: Math.min(maxScore * 25, 75),
      keywords: [],
      suggestedActions: this.getDefaultActions(detectedIntent),
    };
  }

  /**
   * Actions par défaut selon l'intention
   */
  private getDefaultActions(intent: string): string[] {
    const actions = {
      information: ['Envoyer la fiche détaillée', 'Proposer une visite'],
      appointment: ['Confirmer la disponibilité', 'Envoyer le lien de réservation'],
      negotiation: ['Vérifier la marge de négociation', 'Consulter le propriétaire'],
      complaint: ['S\'excuser', 'Proposer une solution'],
      other: ['Répondre rapidement', 'Qualifier la demande'],
    };
    return actions[intent] || actions.other;
  }

  /**
   * Générer une réponse avec le LLM
   */
  private async generateResponse(
    userId: string,
    analysis: any,
    context: any,
    additionalInstructions?: string,
  ) {
    try {
      const prompt = `Génère une réponse professionnelle et personnalisée à cet email client.

Email reçu:
Sujet: ${analysis.subject}
Corps: ${analysis.body}

Intention détectée: ${analysis.intent}
${context ? `Contexte client: ${JSON.stringify(context)}` : ''}
${additionalInstructions ? `Instructions: ${additionalInstructions}` : ''}

Retourne un JSON avec:
- subject: sujet de la réponse
- body: corps de la réponse (HTML formaté)

La réponse doit:
- Être chaleureuse et professionnelle
- Répondre précisément à la demande
- Inclure un appel à l'action
- Être personnalisée selon le contexte
- Être en français

Réponds uniquement avec un JSON valide.`;

      const response = await this.llmService.analyzeText(userId, prompt);

      try {
        const parsed = JSON.parse(response);
        return {
          subject: parsed.subject || `RE: ${analysis.subject}`,
          body: parsed.body || this.fallbackResponse(analysis),
        };
      } catch (e) {
        return {
          subject: `RE: ${analysis.subject}`,
          body: this.fallbackResponse(analysis),
        };
      }
    } catch (error) {
      this.logger.warn('LLM response generation failed, using fallback');
      return {
        subject: `RE: ${analysis.subject}`,
        body: this.fallbackResponse(analysis),
      };
    }
  }

  /**
   * Réponse fallback si le LLM n'est pas disponible
   */
  private fallbackResponse(analysis: any): string {
    const templates = {
      information: `
        <p>Bonjour,</p>
        <p>Merci pour votre intérêt pour notre bien immobilier.</p>
        <p>Je serai ravi de vous fournir toutes les informations dont vous avez besoin.</p>
        <p>N'hésitez pas à me contacter pour plus de détails ou pour organiser une visite.</p>
        <p>Cordialement,</p>
      `,
      appointment: `
        <p>Bonjour,</p>
        <p>Merci pour votre demande de rendez-vous.</p>
        <p>Je suis disponible pour vous faire visiter le bien. Quels seraient vos créneaux de disponibilité?</p>
        <p>Au plaisir de vous rencontrer,</p>
      `,
      negotiation: `
        <p>Bonjour,</p>
        <p>Merci pour votre proposition.</p>
        <p>Je vais étudier votre offre et revenir vers vous rapidement avec une réponse.</p>
        <p>Cordialement,</p>
      `,
    };

    return templates[analysis.intent] || templates.information;
  }

  /**
   * Suggérer des pièces jointes pertinentes
   */
  private async suggestAttachments(analysis: any): Promise<string[]> {
    const suggestions: string[] = [];

    if (analysis.intent === 'information' || analysis.intent === 'appointment') {
      suggestions.push('Fiche détaillée du bien');
      suggestions.push('Photos supplémentaires');
      
      if (analysis.propertyId) {
        const property = await this.prisma.properties.findUnique({
          where: { id: analysis.propertyId },
        });
        
        if (property) {
          suggestions.push('Plan de localisation');
          if (property.virtualTourUrl) {
            suggestions.push('Lien visite virtuelle');
          }
        }
      }
    }

    if (analysis.intent === 'negotiation') {
      suggestions.push('Conditions de vente');
      suggestions.push('Historique des prix');
    }

    return suggestions;
  }
}
