import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { QuickWinsLLMService } from '../quick-wins-llm/quick-wins-llm.service';
import { CommunicationsService } from '../../communications/communications.service';
import {
  SendMessageDto,
  CreateConversationDto,
  ChatMessage,
  ChatConversation,
  CommandType,
} from './dto';
import { ErrorHandler } from '../../../shared/utils/error-handler.utils';

@Injectable()
export class AIChatAssistantService {
  private readonly logger = new Logger(AIChatAssistantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: QuickWinsLLMService,
    private readonly communicationsService: CommunicationsService,
  ) {}

  /**
   * Create a new conversation
   */
  async createConversation(userId: string, dto: CreateConversationDto): Promise<ChatConversation> {
    const conversation = await this.prisma.aiChatConversation.create({
      data: {
        userId,
        title: dto.title || 'Nouvelle conversation',
        context: dto.context || {},
      },
    });

    return this.mapConversation(conversation);
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string, limit: number = 50): Promise<ChatConversation[]> {
    try {
      const conversations = await this.prisma.aiChatConversation.findMany({
        where: {
          userId,
          deletedAt: null,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: limit,
      });

      return conversations.map((conv) => ({
        ...this.mapConversation(conv),
        messageCount: 0,
      }));
    } catch (error) {
      this.logger.error(`Error fetching conversations for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    userId: string,
    conversationId: string,
    limit: number = 100,
  ): Promise<ChatMessage[]> {
    const conversation = await this.prisma.aiChatConversation.findFirst({
      where: {
        id: conversationId,
        userId,
        deletedAt: null,
      },
    });

    if (!conversation) {
      ErrorHandler.notFound('Conversation');
    }

    const messages = await this.prisma.aiChatMessage.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });

    return messages.map(this.mapMessage);
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    dto: SendMessageDto,
  ): Promise<{ userMessage: ChatMessage; aiMessage: ChatMessage }> {
    // Verify conversation exists and belongs to user
    const conversation = await this.prisma.aiChatConversation.findFirst({
      where: {
        id: conversationId,
        userId,
        deletedAt: null,
      },
    });

    if (!conversation) {
      ErrorHandler.notFound('Conversation');
    }

    // Save user message
    const userMessage = await this.prisma.aiChatMessage.create({
      data: {
        conversationId,
        role: 'user',
        content: dto.message,
        metadata: dto.metadata || {},
      },
    });

    // Detect intent and get context
    const intent = await this.detectIntent(dto.message);
    const context = await this.gatherContext(userId, intent, dto.message);

    // Get conversation history for context
    const history = await this.getRecentMessages(conversationId, 10);

    // Generate AI response
    const aiResponse = await this.generateResponse(userId, dto.message, intent, context, history);

    // Save AI message
    const aiMessage = await this.prisma.aiChatMessage.create({
      data: {
        conversationId,
        role: 'assistant',
        content: aiResponse.content,
        metadata: {
          intent: intent.type,
          confidence: intent.confidence,
          context: context,
          tokens: aiResponse.tokens,
        },
      },
    });

    // Update conversation
    await this.prisma.aiChatConversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        context: {
          ...((conversation.context as any) || {}),
          lastIntent: intent.type,
        },
      },
    });

    return {
      userMessage: this.mapMessage(userMessage),
      aiMessage: this.mapMessage(aiMessage),
    };
  }

  /**
   * Delete a conversation (soft delete)
   */
  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.prisma.aiChatConversation.findFirst({
      where: {
        id: conversationId,
        userId,
        deletedAt: null,
      },
    });

    if (!conversation) {
      ErrorHandler.notFound('Conversation');
    }

    await this.prisma.aiChatConversation.update({
      where: { id: conversationId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Detect intent from user message
   */
  private async detectIntent(message: string): Promise<{
    type: CommandType;
    confidence: number;
    entities: any;
  }> {
    const lowerMessage = message.toLowerCase();

    // Property search patterns
    if (
      lowerMessage.includes('trouve') ||
      lowerMessage.includes('cherche') ||
      lowerMessage.includes('appartement') ||
      lowerMessage.includes('villa') ||
      lowerMessage.includes('propriété') ||
      lowerMessage.includes('bien')
    ) {
      return {
        type: 'search_properties',
        confidence: 0.85,
        entities: this.extractPropertySearchEntities(message),
      };
    }

    // Prospect search patterns
    if (
      lowerMessage.includes('prospect') ||
      lowerMessage.includes('client') ||
      lowerMessage.includes('contact')
    ) {
      return {
        type: 'search_prospects',
        confidence: 0.8,
        entities: {},
      };
    }

    // Report generation patterns
    if (
      lowerMessage.includes('rapport') ||
      lowerMessage.includes('résume') ||
      lowerMessage.includes('statistique') ||
      lowerMessage.includes('vente')
    ) {
      return {
        type: 'generate_report',
        confidence: 0.85,
        entities: this.extractReportEntities(message),
      };
    }

    // Email drafting patterns
    if (
      lowerMessage.includes('écris') ||
      lowerMessage.includes('email') ||
      lowerMessage.includes('rédige') ||
      lowerMessage.includes('message')
    ) {
      return {
        type: 'draft_email',
        confidence: 0.8,
        entities: {},
      };
    }

    // Schedule planning patterns
    if (
      lowerMessage.includes('planning') ||
      lowerMessage.includes('rendez-vous') ||
      lowerMessage.includes('rdv') ||
      lowerMessage.includes('calendrier')
    ) {
      return {
        type: 'schedule_planning',
        confidence: 0.8,
        entities: {},
      };
    }

    // Strategic advice patterns
    if (
      lowerMessage.includes('comment') ||
      lowerMessage.includes('conseil') ||
      lowerMessage.includes('stratégie') ||
      lowerMessage.includes('négocier')
    ) {
      return {
        type: 'strategic_advice',
        confidence: 0.75,
        entities: {},
      };
    }

    // Default: general query
    return {
      type: 'general_query',
      confidence: 0.9,
      entities: {},
    };
  }

  /**
   * Extract property search entities from message
   */
  private extractPropertySearchEntities(message: string): any {
    const entities: any = {};

    // Extract location
    const locations = ['La Marsa', 'Sidi Bou Said', 'Carthage', 'Tunis', 'Gammarth'];
    for (const loc of locations) {
      if (message.toLowerCase().includes(loc.toLowerCase())) {
        entities.location = loc;
        break;
      }
    }

    // Extract property type
    if (message.toLowerCase().includes('appartement')) {
      entities.type = 'apartment';
    } else if (message.toLowerCase().includes('villa')) {
      entities.type = 'villa';
    } else if (message.toLowerCase().includes('maison')) {
      entities.type = 'house';
    }

    // Extract number of rooms (pièces)
    const roomsMatch = message.match(/(\d+)\s*pièces?/i);
    if (roomsMatch) {
      entities.rooms = parseInt(roomsMatch[1]);
    }

    // Extract price
    const priceMatch = message.match(/(\d+)[kK]\s*(TND)?/);
    if (priceMatch) {
      entities.maxPrice = parseInt(priceMatch[1]) * 1000;
    }

    return entities;
  }

  /**
   * Extract report entities from message
   */
  private extractReportEntities(message: string): any {
    const entities: any = {};

    // Extract time period
    if (message.toLowerCase().includes('mois')) {
      entities.period = 'month';
    } else if (message.toLowerCase().includes('semaine')) {
      entities.period = 'week';
    } else if (message.toLowerCase().includes('année')) {
      entities.period = 'year';
    }

    return entities;
  }

  /**
   * Gather context based on intent and message
   */
  private async gatherContext(userId: string, intent: any, message: string): Promise<any> {
    const context: any = {};

    try {
      switch (intent.type) {
        case 'search_properties':
          context.recentProperties = await this.getRecentProperties(userId, 5);
          break;

        case 'search_prospects':
          context.recentProspects = await this.getRecentProspects(userId, 5);
          break;

        case 'generate_report':
          context.stats = await this.getUserStats(userId, intent.entities.period);
          break;

        case 'draft_email':
          context.recentEmails = await this.getRecentEmails(userId, 3);
          break;

        case 'schedule_planning':
          context.appointments = await this.getUpcomingAppointments(userId, 10);
          break;

        default:
          // General context
          context.userInfo = await this.getUserInfo(userId);
          break;
      }
    } catch (error) {
      this.logger.warn('Error gathering context:', error.message);
    }

    return context;
  }

  /**
   * Generate AI response using LLM Router
   */
  private async generateResponse(
    userId: string,
    message: string,
    intent: any,
    context: any,
    history: any[],
  ): Promise<{ content: string; tokens?: number }> {
    // Build system prompt based on intent
    const systemPrompt = this.buildSystemPrompt(intent.type, context);

    // Build conversation history
    const conversationHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Build full prompt
    const fullPrompt = `${systemPrompt}\n\nHistorique de conversation:\n${conversationHistory.map((m) => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${message}\n\nAssistant:`;

    try {
      // Use LLM Router for response generation
      const response = await this.llmService.analyzeText(userId, fullPrompt);

      return {
        content: response,
        tokens: undefined, // LLM service handles tracking
      };
    } catch (error) {
      this.logger.error('Error generating AI response:', error);

      // Fallback response
      return {
        content: this.generateFallbackResponse(intent.type, context),
        tokens: 0,
      };
    }
  }

  /**
   * Build system prompt based on intent
   */
  private buildSystemPrompt(intentType: CommandType, context: any): string {
    const basePrompt = `Tu es "Copilot Immobilier", un assistant IA intelligent pour agents immobiliers.
Tu aides les agents dans leur travail quotidien en fournissant des informations précises et des conseils stratégiques.

Règles:
- Réponds en français de manière professionnelle et amicale
- Sois concis mais complet
- Utilise des émojis pertinents
- Si tu n'es pas sûr, dis-le clairement
- Fournis des données chiffrées quand disponibles
- Propose des actions concrètes

`;

    switch (intentType) {
      case 'search_properties':
        return (
          basePrompt +
          `\nContexte: L'agent recherche des propriétés. ${context.recentProperties ? `Voici les dernières propriétés disponibles: ${JSON.stringify(context.recentProperties)}` : ''}`
        );

      case 'search_prospects':
        return (
          basePrompt +
          `\nContexte: L'agent cherche des informations sur ses prospects. ${context.recentProspects ? `Voici les prospects récents: ${JSON.stringify(context.recentProspects)}` : ''}`
        );

      case 'generate_report':
        return (
          basePrompt +
          `\nContexte: L'agent demande un rapport. ${context.stats ? `Voici les statistiques: ${JSON.stringify(context.stats)}` : ''}`
        );

      case 'draft_email':
        return (
          basePrompt +
          "\nContexte: L'agent veut rédiger un email. Aide-le à écrire un email professionnel et personnalisé."
        );

      case 'schedule_planning':
        return (
          basePrompt +
          `\nContexte: L'agent demande de l'aide avec son planning. ${context.appointments ? `Rendez-vous à venir: ${JSON.stringify(context.appointments)}` : ''}`
        );

      case 'strategic_advice':
        return (
          basePrompt +
          "\nContexte: L'agent demande des conseils stratégiques. Fournis des conseils professionnels basés sur les meilleures pratiques."
        );

      default:
        return basePrompt + '\nContexte: Question générale.';
    }
  }

  /**
   * Generate fallback response when LLM is unavailable
   */
  private generateFallbackResponse(intentType: CommandType, context: any): string {
    switch (intentType) {
      case 'search_properties':
        return '🏠 Je peux vous aider à chercher des propriétés. Pourriez-vous préciser vos critères (type, localisation, prix) ?';

      case 'search_prospects':
        return '👥 Je peux vous aider avec vos prospects. Que souhaitez-vous savoir ?';

      case 'generate_report':
        return '📊 Je peux générer un rapport pour vous. Sur quelle période souhaitez-vous le rapport ?';

      case 'draft_email':
        return '✉️ Je peux vous aider à rédiger un email. Pour qui est cet email et quel est le sujet ?';

      case 'schedule_planning':
        return '📅 Je peux vous aider avec votre planning. Que souhaitez-vous organiser ?';

      case 'strategic_advice':
        return '💡 Je suis là pour vous conseiller. Quelle est votre question ?';

      default:
        return "Je suis votre assistant Copilot Immobilier. Comment puis-je vous aider aujourd'hui ?";
    }
  }

  // Helper methods to fetch CRM data

  private async getRecentProperties(userId: string, limit: number): Promise<any[]> {
    try {
      const properties = await this.prisma.property.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          type: true,
          price: true,
          location: true,
          bedrooms: true,
          surface: true,
        },
      });

      return properties;
    } catch (error) {
      this.logger.warn('Error fetching recent properties:', error.message);
      return [];
    }
  }

  private async getRecentProspects(userId: string, limit: number): Promise<any[]> {
    try {
      const prospects = await this.prisma.prospect.findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          budget: true,
        },
      });

      return prospects;
    } catch (error) {
      this.logger.warn('Error fetching recent prospects:', error.message);
      return [];
    }
  }

  private async getUserStats(userId: string, period: string = 'month'): Promise<any> {
    try {
      const now = new Date();
      const startDate = new Date();

      if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (period === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      const prospectsCount = await this.prisma.prospect.count({
        where: {
          userId,
          createdAt: { gte: startDate },
          deletedAt: null,
        },
      });

      const appointmentsCount = await this.prisma.appointment.count({
        where: {
          userId,
          date: { gte: startDate },
          deletedAt: null,
        },
      });

      return {
        period,
        prospects: prospectsCount,
        appointments: appointmentsCount,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      };
    } catch (error) {
      this.logger.warn('Error fetching user stats:', error.message);
      return {};
    }
  }

  private async getRecentEmails(userId: string, limit: number): Promise<any[]> {
    try {
      const emails = await this.prisma.communications.findMany({
        where: {
          userId,
          type: 'email',
        },
        orderBy: { sentAt: 'desc' },
        take: limit,
        select: {
          id: true,
          to: true,
          subject: true,
          body: true,
          sentAt: true,
          status: true,
        },
      });
      return emails;
    } catch (error) {
      this.logger.warn('Error fetching recent emails:', error.message);
      return [];
    }
  }

  /**
   * Envoyer un email rédigé par l'IA
   */
  async sendDraftedEmail(
    userId: string,
    to: string,
    subject: string,
    body: string,
    metadata?: any,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      this.logger.log(`Sending AI-drafted email to ${to}`);

      const result = await this.communicationsService.sendEmail(userId, {
        to,
        subject,
        body,
        ...metadata,
      });

      return result;
    } catch (error) {
      this.logger.error(`Error sending AI-drafted email: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async getUpcomingAppointments(userId: string, limit: number): Promise<any[]> {
    try {
      const appointments = await this.prisma.appointment.findMany({
        where: {
          userId,
          date: { gte: new Date() },
          deletedAt: null,
        },
        orderBy: { date: 'asc' },
        take: limit,
        select: {
          id: true,
          title: true,
          date: true,
          location: true,
          status: true,
        },
      });

      return appointments;
    } catch (error) {
      this.logger.warn('Error fetching appointments:', error.message);
      return [];
    }
  }

  private async getUserInfo(userId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      });

      return user;
    } catch (error) {
      this.logger.warn('Error fetching user info:', error.message);
      return null;
    }
  }

  private async getRecentMessages(conversationId: string, limit: number): Promise<any[]> {
    try {
      const messages = await this.prisma.aiChatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return messages.reverse();
    } catch (error) {
      this.logger.warn('Error fetching recent messages:', error.message);
      return [];
    }
  }

  // Mappers

  private mapConversation(conversation: any): ChatConversation {
    return {
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      context: (conversation.context as any) || {},
      createdAt:
        conversation.createdAt instanceof Date
          ? conversation.createdAt.toISOString()
          : conversation.createdAt,
      updatedAt:
        conversation.updatedAt instanceof Date
          ? conversation.updatedAt.toISOString()
          : conversation.updatedAt,
    };
  }

  private mapMessage(message: any): ChatMessage {
    return {
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      metadata: (message.metadata as any) || {},
      createdAt: message.createdAt.toISOString(),
    };
  }
}
