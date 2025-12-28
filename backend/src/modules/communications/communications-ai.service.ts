import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { QuickWinsLLMService } from '../intelligence/quick-wins-llm/quick-wins-llm.service';
import { AIChatAssistantService } from '../intelligence/ai-chat-assistant/ai-chat-assistant.service';

/**
 * Service d'orchestration AI pour le module Communications
 *
 * Synchronise intelligemment les communications avec:
 * - AI Chat Assistant (génération de contenu)
 * - LLM Providers (amélioration de texte)
 * - Business Orchestrator (workflows automatisés)
 */
@Injectable()
export class CommunicationsAIService {
  private readonly logger = new Logger(CommunicationsAIService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: QuickWinsLLMService,
    private readonly chatAssistant: AIChatAssistantService,
  ) {}

  // ========== SMART CONTENT GENERATION ==========

  /**
   * Générer un email intelligent basé sur le contexte
   */
  async generateSmartEmail(
    userId: string,
    context: {
      prospectId?: string;
      propertyId?: string;
      purpose: 'follow_up' | 'appointment' | 'negotiation' | 'information' | 'custom';
      tone?: 'formal' | 'friendly' | 'commercial';
      additionalContext?: string;
    },
  ) {
    this.logger.log(`Generating smart email for user ${userId}`);

    try {
      // Rassembler le contexte CRM
      const crmContext = await this.gatherCRMContext(
        userId,
        context.prospectId,
        context.propertyId,
      );

      // Générer le contenu avec LLM
      const prompt = this.buildEmailPrompt(context, crmContext);
      const content = await this.llmService.analyzeText(userId, prompt);

      // Parser la réponse JSON
      try {
        const parsed = JSON.parse(content);
        return {
          subject: parsed.subject || 'Nouveau message',
          body: parsed.body || content,
          suggestedAttachments: parsed.attachments || [],
          tone: context.tone || 'friendly',
          confidence: parsed.confidence || 85,
        };
      } catch (e) {
        // Fallback si parsing échoue
        return {
          subject: this.getDefaultSubject(context.purpose),
          body: content,
          suggestedAttachments: [],
          tone: context.tone || 'friendly',
          confidence: 70,
        };
      }
    } catch (error) {
      this.logger.error(`Error generating smart email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Générer un SMS/WhatsApp intelligent (court et concis)
   */
  async generateSmartSMS(
    userId: string,
    context: {
      prospectId?: string;
      propertyId?: string;
      purpose: 'appointment_reminder' | 'follow_up' | 'confirmation' | 'custom';
      maxLength?: number;
      additionalContext?: string;
    },
  ) {
    this.logger.log(`Generating smart SMS for user ${userId}`);

    try {
      const crmContext = await this.gatherCRMContext(
        userId,
        context.prospectId,
        context.propertyId,
      );

      const prompt = this.buildSMSPrompt(context, crmContext);
      const content = await this.llmService.analyzeText(userId, prompt);

      // Limiter la longueur si nécessaire
      const maxLength = context.maxLength || 160;
      const trimmedContent = content.length > maxLength
        ? content.substring(0, maxLength - 3) + '...'
        : content;

      return {
        body: trimmedContent,
        length: trimmedContent.length,
        confidence: 85,
      };
    } catch (error) {
      this.logger.error(`Error generating smart SMS: ${error.message}`);
      throw error;
    }
  }

  // ========== TEMPLATE AI SUGGESTIONS ==========

  /**
   * Suggérer des templates pertinents basés sur le contexte
   */
  async suggestTemplates(
    userId: string,
    context: {
      type: 'email' | 'sms' | 'whatsapp';
      prospectId?: string;
      propertyId?: string;
      purpose?: string;
      keywords?: string[];
    },
  ) {
    this.logger.log(`Suggesting templates for user ${userId}`);

    try {
      // Récupérer tous les templates du type demandé
      const allTemplates = await this.prisma.communicationTemplate.findMany({
        where: {
          userId,
          type: context.type,
          deletedAt: null,
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (allTemplates.length === 0) {
        return [];
      }

      // Rassembler le contexte pour le scoring
      const crmContext = await this.gatherCRMContext(
        userId,
        context.prospectId,
        context.propertyId,
      );

      // Utiliser l'AI pour scorer la pertinence de chaque template
      const scoredTemplates = await Promise.all(
        allTemplates.map(async (template) => {
          const score = await this.scoreTemplateRelevance(
            userId,
            template,
            context,
            crmContext,
          );
          return { ...template, relevanceScore: score };
        }),
      );

      // Trier par score et retourner le top 5
      return scoredTemplates
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5);
    } catch (error) {
      this.logger.error(`Error suggesting templates: ${error.message}`);
      return [];
    }
  }

  /**
   * Générer un nouveau template avec AI
   */
  async generateTemplate(
    userId: string,
    request: {
      type: 'email' | 'sms' | 'whatsapp';
      purpose: string;
      tone?: 'formal' | 'friendly' | 'commercial';
      includeVariables?: string[];
      sampleContext?: string;
    },
  ) {
    this.logger.log(`Generating template for user ${userId}`);

    try {
      const prompt = `Crée un template de communication ${request.type} professionnel pour un agent immobilier.

Objectif: ${request.purpose}
Ton: ${request.tone || 'friendly'}
${request.includeVariables ? `Variables à inclure: ${request.includeVariables.map(v => `{${v}}`).join(', ')}` : ''}
${request.sampleContext ? `Contexte d'exemple: ${request.sampleContext}` : ''}

Retourne un JSON avec:
- name: nom descriptif du template
- subject: sujet (si email)
- body: corps du message avec variables entre accolades {variable}
- variables: array des noms de variables utilisées
- description: courte description de l'usage

Règles:
- Professionnel mais ${request.tone === 'formal' ? 'formel' : 'chaleureux'}
- Utilise des variables pour la personnalisation
- ${request.type === 'sms' ? 'Court et concis (max 160 caractères)' : 'Bien structuré'}
- En français
- Variables courantes: {firstName}, {lastName}, {propertyTitle}, {price}, {city}, {agencyName}

Réponds uniquement avec un JSON valide.`;

      const response = await this.llmService.analyzeText(userId, prompt);
      const parsed = JSON.parse(response);

      return {
        name: parsed.name || `Template ${request.type} - ${request.purpose}`,
        type: request.type,
        subject: parsed.subject || undefined,
        body: parsed.body,
        variables: parsed.variables || [],
        description: parsed.description,
      };
    } catch (error) {
      this.logger.error(`Error generating template: ${error.message}`);
      throw error;
    }
  }

  // ========== SMART COMPOSER ASSISTANCE ==========

  /**
   * Auto-complétion intelligente pendant la frappe
   */
  async autoComplete(
    userId: string,
    partialText: string,
    context: {
      type: 'email' | 'sms';
      prospectId?: string;
      propertyId?: string;
    },
  ) {
    this.logger.log(`Auto-completing text for user ${userId}`);

    try {
      const crmContext = await this.gatherCRMContext(
        userId,
        context.prospectId,
        context.propertyId,
      );

      const prompt = `Continue ce message de manière naturelle et professionnelle:

Message partiel: "${partialText}"

${crmContext ? `Contexte: ${JSON.stringify(crmContext)}` : ''}

Fournis 3 suggestions de continuation (2-3 phrases maximum chacune).
Réponds avec un JSON: { suggestions: ["option1", "option2", "option3"] }`;

      const response = await this.llmService.analyzeText(userId, prompt);
      const parsed = JSON.parse(response);

      return {
        suggestions: parsed.suggestions || [],
      };
    } catch (error) {
      this.logger.warn('Auto-complete failed, returning empty suggestions');
      return { suggestions: [] };
    }
  }

  /**
   * Améliorer un texte existant
   */
  async improveText(
    userId: string,
    text: string,
    improvements: ('grammar' | 'tone' | 'clarity' | 'professional' | 'concise')[],
  ) {
    this.logger.log(`Improving text for user ${userId}`);

    try {
      const improvementInstructions = improvements
        .map((imp) => {
          const instructions = {
            grammar: 'Corriger la grammaire et l\'orthographe',
            tone: 'Ajuster le ton pour être plus professionnel et chaleureux',
            clarity: 'Améliorer la clarté et la structure',
            professional: 'Rendre plus professionnel',
            concise: 'Rendre plus concis sans perdre d\'information',
          };
          return instructions[imp];
        })
        .join(', ');

      const prompt = `Améliore ce texte en appliquant ces modifications: ${improvementInstructions}

Texte original:
"""
${text}
"""

Retourne un JSON avec:
- improved: texte amélioré
- changes: liste des modifications apportées

Réponds uniquement avec un JSON valide.`;

      const response = await this.llmService.analyzeText(userId, prompt);
      const parsed = JSON.parse(response);

      return {
        original: text,
        improved: parsed.improved || text,
        changes: parsed.changes || [],
      };
    } catch (error) {
      this.logger.error(`Error improving text: ${error.message}`);
      return {
        original: text,
        improved: text,
        changes: [],
      };
    }
  }

  /**
   * Traduire un message
   */
  async translateMessage(
    userId: string,
    text: string,
    targetLanguage: 'ar' | 'en' | 'fr',
  ) {
    this.logger.log(`Translating message to ${targetLanguage}`);

    try {
      const languageNames = { ar: 'arabe', en: 'anglais', fr: 'français' };
      const prompt = `Traduis ce texte en ${languageNames[targetLanguage]} en conservant le ton professionnel:

"""
${text}
"""

Réponds uniquement avec la traduction, sans explications.`;

      const translation = await this.llmService.analyzeText(userId, prompt);

      return {
        original: text,
        translated: translation,
        targetLanguage,
      };
    } catch (error) {
      this.logger.error(`Error translating message: ${error.message}`);
      throw error;
    }
  }

  // ========== HELPER METHODS ==========

  /**
   * Rassembler le contexte CRM pour personnalisation
   */
  private async gatherCRMContext(
    userId: string,
    prospectId?: string,
    propertyId?: string,
  ) {
    const context: any = {};

    try {
      // Informations du prospect
      if (prospectId) {
        const prospect = await this.prisma.prospects.findFirst({
          where: { id: prospectId, userId },
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
            budget: true,
            propertyType: true,
            location: true,
            lastContactAt: true,
          },
        });
        if (prospect) {
          context.prospect = prospect;
        }
      }

      // Informations de la propriété
      if (propertyId) {
        const property = await this.prisma.properties.findFirst({
          where: { id: propertyId },
          select: {
            title: true,
            type: true,
            price: true,
            city: true,
            area: true,
            bedrooms: true,
            status: true,
          },
        });
        if (property) {
          context.property = property;
        }
      }

      // Informations de l'agence
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      });
      if (user) {
        context.agent = user;
      }

      return context;
    } catch (error) {
      this.logger.warn('Error gathering CRM context:', error.message);
      return null;
    }
  }

  /**
   * Construire le prompt pour génération d'email
   */
  private buildEmailPrompt(context: any, crmContext: any): string {
    const purposes = {
      follow_up: 'Relancer un prospect qui n\'a pas répondu',
      appointment: 'Confirmer ou proposer un rendez-vous',
      negotiation: 'Répondre à une proposition de négociation',
      information: 'Fournir des informations sur un bien',
      custom: context.additionalContext || 'Message personnalisé',
    };

    return `Génère un email professionnel pour un agent immobilier.

Objectif: ${purposes[context.purpose]}
Ton: ${context.tone || 'friendly'}
${crmContext ? `Contexte CRM:\n${JSON.stringify(crmContext, null, 2)}` : ''}
${context.additionalContext ? `Contexte additionnel: ${context.additionalContext}` : ''}

Retourne un JSON avec:
- subject: sujet de l'email
- body: corps de l'email en HTML formaté
- attachments: array de suggestions de pièces jointes
- confidence: niveau de confiance 0-100

Règles:
- Professionnel et ${context.tone === 'formal' ? 'formel' : 'chaleureux'}
- Personnalisé avec le contexte fourni
- Inclut un appel à l'action clair
- Structure: salutation, corps, appel à l'action, signature
- En français

Réponds uniquement avec un JSON valide.`;
  }

  /**
   * Construire le prompt pour génération de SMS
   */
  private buildSMSPrompt(context: any, crmContext: any): string {
    const purposes = {
      appointment_reminder: 'Rappel de rendez-vous',
      follow_up: 'Message de suivi rapide',
      confirmation: 'Confirmation d\'une action',
      custom: context.additionalContext || 'Message personnalisé',
    };

    return `Génère un SMS court et professionnel pour un agent immobilier.

Objectif: ${purposes[context.purpose]}
Longueur max: ${context.maxLength || 160} caractères
${crmContext ? `Contexte: ${JSON.stringify(crmContext)}` : ''}
${context.additionalContext ? `Info: ${context.additionalContext}` : ''}

Règles:
- Court et concis (${context.maxLength || 160} caractères max)
- Professionnel mais amical
- Inclut prénom si disponible
- Appel à l'action clair
- En français

Réponds uniquement avec le texte du SMS, sans guillemets ni formatage.`;
  }

  /**
   * Obtenir un sujet par défaut selon l'objectif
   */
  private getDefaultSubject(purpose: string): string {
    const subjects = {
      follow_up: 'Suite à votre demande',
      appointment: 'Confirmation de rendez-vous',
      negotiation: 'Votre proposition',
      information: 'Informations complémentaires',
      custom: 'Nouveau message',
    };
    return subjects[purpose] || 'Nouveau message';
  }

  /**
   * Scorer la pertinence d'un template selon le contexte
   */
  private async scoreTemplateRelevance(
    userId: string,
    template: any,
    context: any,
    crmContext: any,
  ): Promise<number> {
    try {
      // Scoring simple basé sur les mots-clés
      let score = 50; // Score de base

      // Correspondance du type
      if (template.type === context.type) {
        score += 20;
      }

      // Mots-clés dans le nom ou le corps
      if (context.keywords) {
        const templateText = `${template.name} ${template.body}`.toLowerCase();
        const matches = context.keywords.filter((keyword) =>
          templateText.includes(keyword.toLowerCase()),
        );
        score += matches.length * 10;
      }

      // Limiter le score à 100
      return Math.min(score, 100);
    } catch (error) {
      return 50; // Score neutre en cas d'erreur
    }
  }
}
