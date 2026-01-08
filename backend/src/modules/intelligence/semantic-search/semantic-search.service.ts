import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { QuickWinsLLMService } from '../quick-wins-llm/quick-wins-llm.service';
import { JinaService } from './jina.service';
import { SemanticSearchQueryDto, SemanticSearchResult } from './dto/semantic-search.dto';

@Injectable()
export class SemanticSearchService {
  private readonly logger = new Logger(SemanticSearchService.name);

  constructor(
    private prisma: PrismaService,
    private llmService: QuickWinsLLMService,
    private jinaService: JinaService,
  ) { }

  /**
   * Appliquer le reranking avec Jina pour améliorer l'ordre des résultats
   */
  private async applyJinaReranking(
    userId: string,
    query: string,
    results: SemanticSearchResult[],
  ): Promise<SemanticSearchResult[]> {
    try {
      const isAvailable = await this.jinaService.isAvailable(userId);
      if (!isAvailable) {
        this.logger.debug('Jina service not available, skipping reranking');
        return results;
      }

      // Préparer les documents pour le reranking
      const documents = results.map(result =>
        `${result.title} ${result.description}`.trim()
      );

      // Appliquer le reranking
      const scores = await this.jinaService.rerank(userId, { query, documents });

      // Mettre à jour les scores de pertinence avec les scores Jina
      results.forEach((result, index) => {
        // Combiner le score original avec le score Jina (pondération 70% Jina, 30% original)
        const jinaScore = scores[index] * 100; // Convertir en 0-100
        const combinedScore = (jinaScore * 0.7) + (result.relevanceScore * 0.3);
        result.relevanceScore = Math.min(combinedScore, 100);
      });

      this.logger.debug(`Applied Jina reranking to ${results.length} results`);
      return results;
    } catch (error) {
      this.logger.warn(`Jina reranking failed: ${error.message}, using original results`);
      return results;
    }
  }

  /**
   * Recherche sémantique dans le CRM
   */
  async semanticSearch(
    userId: string,
    query: SemanticSearchQueryDto,
  ): Promise<SemanticSearchResult[]> {
    try {
      this.logger.log(`Semantic search for user ${userId}: ${query.query}`);

      const searchType = query.searchType || 'all';
      const limit = query.limit || 10;

      // Analyser la requête avec l'IA pour extraire l'intention
      const searchIntent = await this.analyzeSearchIntent(query.query);

      let results: SemanticSearchResult[] = [];

      if (searchType === 'properties' || searchType === 'all') {
        const propertyResults = await this.searchProperties(
          userId,
          query.query,
          searchIntent,
          limit,
        );
        results = [...results, ...propertyResults];
      }

      if (searchType === 'prospects' || searchType === 'all') {
        const prospectResults = await this.searchProspects(
          userId,
          query.query,
          searchIntent,
          limit,
        );
        results = [...results, ...prospectResults];
      }

      if (searchType === 'appointments' || searchType === 'all') {
        const appointmentResults = await this.searchAppointments(
          userId,
          query.query,
          searchIntent,
          limit,
        );
        results = [...results, ...appointmentResults];
      }

      // Appliquer le reranking avec Jina si disponible
      if (results.length > 0) {
        results = await this.applyJinaReranking(userId, query.query, results);
      }

      // Trier par score de pertinence (mis à jour par reranking)
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      return results.slice(0, limit);
    } catch (error) {
      this.logger.error(`Error in semantic search: ${error.message}`);
      return [];
    }
  }

  /**
   * Analyser l'intention de recherche avec l'IA (via LLM Router centralisé)
   */
  private async analyzeSearchIntent(query: string): Promise<any> {
    try {
      // Utiliser le service LLM centralisé au lieu d'OpenAI direct
      const intent = await this.llmService.analyzeSearchIntent('system', query);
      return {
        keywords: intent.keywords,
        filters: intent.filters,
        intent: intent.intent,
      };
    } catch (error) {
      this.logger.warn('LLM analysis failed, using fallback', error);
      return this.fallbackIntent(query);
    }
  }

  /**
   * Analyser l'intention de recherche - version ancienne (deprecated)
   * Conservé pour compatibilité
   */
  private async analyzeSearchIntentOld(query: string): Promise<any> {
    try {
      const prompt = `Analyze this real estate CRM search query and extract structured information:
Query: "${query}"

Extract:
- property type (apartment, villa, house, land, etc.)
- location/city
- budget range
- number of rooms
- features (pool, garden, sea view, etc.)
- urgency keywords
- other relevant filters

Return as JSON object.`;

      const response = await this.llmService.analyzeText('', prompt);

      const content = response || '{}';
      try {
        return JSON.parse(content);
      } catch (parseError) {
        this.logger.error(`Failed to parse AI response: ${parseError.message}`);
        return this.fallbackIntent(query);
      }
    } catch (error) {
      this.logger.error(`Error analyzing search intent: ${error.message}`);
      return this.fallbackIntent(query);
    }
  }

  /**
   * Intention de recherche de secours (sans IA)
   */
  private fallbackIntent(query: string): any {
    const intent: any = {
      keywords: query.toLowerCase().split(' '),
    };

    // Détection simple de mots-clés
    if (query.match(/villa|maison/i)) intent.type = 'villa';
    if (query.match(/appartement|appart/i)) intent.type = 'apartment';
    if (query.match(/\d+\s*(pièces|chambres|rooms)/i)) {
      const match = query.match(/(\d+)\s*(pièces|chambres|rooms)/i);
      intent.rooms = parseInt(match[1]);
    }
    if (query.match(/\d+k|mille/i)) {
      const match = query.match(/(\d+)k/i);
      if (match) intent.budget = parseInt(match[1]) * 1000;
    }

    return intent;
  }

  /**
   * Rechercher dans les propriétés
   */
  private async searchProperties(
    userId: string,
    query: string,
    intent: any,
    limit: number,
  ): Promise<SemanticSearchResult[]> {
    try {
      const where: any = { userId };
      const keywords = query.toLowerCase().split(' ');

      // Construire les conditions de recherche
      const orConditions = [];

      keywords.forEach((keyword) => {
        if (keyword.length > 2) {
          orConditions.push(
            { title: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
            { address: { contains: keyword, mode: 'insensitive' } },
            { city: { contains: keyword, mode: 'insensitive' } },
          );
        }
      });

      if (orConditions.length > 0) {
        where.OR = orConditions;
      }

      // Ajouter les filtres d'intention
      if (intent.type) {
        where.type = intent.type;
      }
      if (intent.rooms) {
        where.rooms = intent.rooms;
      }
      if (intent.budget) {
        where.price = { lte: intent.budget };
      }

      const properties = await this.prisma.properties.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return properties.map((property) => ({
        id: property.id,
        type: 'property',
        title: property.title || `Propriété ${property.type}`,
        description: property.description || '',
        relevanceScore: this.calculateRelevanceScore(query, property),
        metadata: {
          price: property.price,
          surface: property.surface,
          rooms: property.rooms,
          city: property.city,
          type: property.type,
        },
      }));
    } catch (error) {
      this.logger.error(`Error searching properties: ${error.message}`);
      return [];
    }
  }

  /**
   * Rechercher dans les prospects
   */
  private async searchProspects(
    userId: string,
    query: string,
    intent: any,
    limit: number,
  ): Promise<SemanticSearchResult[]> {
    try {
      const keywords = query.toLowerCase().split(' ');
      const orConditions = [];

      keywords.forEach((keyword) => {
        if (keyword.length > 2) {
          orConditions.push(
            { firstName: { contains: keyword, mode: 'insensitive' } },
            { lastName: { contains: keyword, mode: 'insensitive' } },
            { email: { contains: keyword, mode: 'insensitive' } },
            { phone: { contains: keyword, mode: 'insensitive' } },
            { city: { contains: keyword, mode: 'insensitive' } },
          );
        }
      });

      const where: any = { userId };
      if (orConditions.length > 0) {
        where.OR = orConditions;
      }

      const prospects = await this.prisma.prospects.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return prospects.map((prospect) => ({
        id: prospect.id,
        type: 'prospect',
        title: `${prospect.firstName} ${prospect.lastName}`,
        description: `${prospect.email || ''} - ${prospect.phone || ''}`,
        relevanceScore: this.calculateRelevanceScore(query, prospect),
        metadata: {
          email: prospect.email,
          phone: prospect.phone,
          city: prospect.city,
          budget: prospect.budget,
        },
      }));
    } catch (error) {
      this.logger.error(`Error searching prospects: ${error.message}`);
      return [];
    }
  }

  /**
   * Rechercher dans les rendez-vous
   */
  private async searchAppointments(
    userId: string,
    query: string,
    intent: any,
    limit: number,
  ): Promise<SemanticSearchResult[]> {
    try {
      const keywords = query.toLowerCase().split(' ');
      const orConditions = [];

      keywords.forEach((keyword) => {
        if (keyword.length > 2) {
          orConditions.push(
            { title: { contains: keyword, mode: 'insensitive' } },
            { notes: { contains: keyword, mode: 'insensitive' } },
            { location: { contains: keyword, mode: 'insensitive' } },
          );
        }
      });

      const where: any = { userId };
      if (orConditions.length > 0) {
        where.OR = orConditions;
      }

      const appointments = await this.prisma.appointments.findMany({
        where,
        take: limit,
        orderBy: { startTime: 'desc' },
      });

      return appointments.map((appointment) => ({
        id: appointment.id,
        type: 'appointment',
        title: appointment.title || 'Rendez-vous',
        description: appointment.notes || appointment.location || '',
        relevanceScore: this.calculateRelevanceScore(query, appointment),
        metadata: {
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          location: appointment.location,
          status: appointment.status,
        },
      }));
    } catch (error) {
      this.logger.error(`Error searching appointments: ${error.message}`);
      return [];
    }
  }

  /**
   * Calculer le score de pertinence
   */
  private calculateRelevanceScore(query: string, item: any): number {
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(' ');
    let score = 0;

    // Convertir l'objet en chaîne pour la recherche
    const itemString = JSON.stringify(item).toLowerCase();

    keywords.forEach((keyword) => {
      if (keyword.length > 2) {
        const occurrences = (itemString.match(new RegExp(keyword, 'g')) || []).length;
        score += occurrences * 10;
      }
    });

    // Normaliser le score entre 0 et 100
    return Math.min(score, 100);
  }

  /**
   * Obtenir des suggestions de recherche
   */
  async getSearchSuggestions(userId: string, partialQuery: string): Promise<string[]> {
    try {
      const suggestions: string[] = [];

      // Suggestions basées sur les recherches récentes (à implémenter)
      // Pour l'instant, retourner des suggestions statiques
      const commonSearches = [
        'appartement vue mer',
        'villa avec piscine',
        'appartement 3 pièces',
        'bien urgent à vendre',
        'maison moderne',
        'terrain constructible',
      ];

      return commonSearches
        .filter((search) =>
          search.toLowerCase().includes(partialQuery.toLowerCase()),
        )
        .slice(0, 5);
    } catch (error) {
      this.logger.error(`Error getting search suggestions: ${error.message}`);
      return [];
    }
  }
}
