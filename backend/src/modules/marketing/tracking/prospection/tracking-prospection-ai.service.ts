import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';

/**
 * Service pour qualifier et scorer les leads issus du tracking
 * avec l'intelligence artificielle de prospection
 *
 * Utilise les données comportementales pour créer des campagnes
 * de prospection ciblées et personnalisées.
 */
@Injectable()
export class TrackingProspectionAiService {
  private readonly logger = new Logger(TrackingProspectionAiService.name);

  // Services externes (injectés dynamiquement pour éviter circular dependencies)
  private prospectionService: any;
  private aiOrchestratorService: any;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Injecter les services externes
   */
  setProspectionService(prospectionService: any) {
    this.prospectionService = prospectionService;
  }

  setAiOrchestratorService(aiOrchestratorService: any) {
    this.aiOrchestratorService = aiOrchestratorService;
  }

  /**
   * Qualifier un lead issu du tracking avec l'IA
   */
  async qualifyTrackingLead(userId: string, leadData: any): Promise<any> {
    try {
      const sessionId = leadData.sessionId;

      if (!sessionId) {
        this.logger.warn('No sessionId provided for lead qualification');
        return { qualified: false, reason: 'missing_session_id' };
      }

      // Récupérer l'historique comportemental complet
      const behaviorHistory = await this.getSessionBehaviorHistory(userId, sessionId);

      // Construire le contexte pour l'AI
      const aiContext = this.buildAiQualificationContext(leadData, behaviorHistory);

      // Utiliser l'AI Orchestrator pour qualifier le lead
      const qualification = await this.runAiQualification(userId, aiContext);

      // Enrichir avec le score
      const enrichedQualification = {
        ...qualification,
        score: this.calculateLeadScore(behaviorHistory, qualification),
        behaviorMetrics: this.extractBehaviorMetrics(behaviorHistory),
        recommendation: this.generateRecommendation(qualification, behaviorHistory),
      };

      this.logger.log(
        `Qualified lead from session ${sessionId}: score ${enrichedQualification.score}/100`,
      );

      return enrichedQualification;
    } catch (error) {
      this.logger.error(`Failed to qualify tracking lead:`, error);
      return {
        qualified: false,
        reason: 'qualification_error',
        error: error.message,
      };
    }
  }

  /**
   * Créer une campagne de prospection automatique basée sur le comportement
   */
  async createBehaviorBasedCampaign(userId: string, criteria: any): Promise<any> {
    try {
      // Identifier les sessions qui matchent les critères
      const targetSessions = await this.findTargetSessions(userId, criteria);

      if (targetSessions.length === 0) {
        return {
          created: false,
          reason: 'no_matching_sessions',
          criteria,
        };
      }

      // Analyser les patterns communs
      const commonPatterns = this.analyzeCommonPatterns(targetSessions);

      // Générer le message de campagne avec AI
      const campaignMessage = await this.generateCampaignMessage(
        userId,
        criteria,
        commonPatterns,
      );

      // Créer la campagne de prospection
      const campaign = {
        userId,
        name: `Campagne Tracking - ${criteria.behaviorType || 'Auto'}`,
        type: 'automated_tracking',
        targetCount: targetSessions.length,
        message: campaignMessage,
        metadata: {
          source: 'tracking',
          criteria,
          commonPatterns,
          createdAt: new Date().toISOString(),
        },
      };

      this.logger.log(
        `Created behavior-based campaign for ${targetSessions.length} sessions`,
      );

      return {
        created: true,
        campaign,
        targetSessions,
      };
    } catch (error) {
      this.logger.error(`Failed to create behavior-based campaign:`, error);
      return {
        created: false,
        reason: 'campaign_creation_error',
        error: error.message,
      };
    }
  }

  /**
   * Recommander des actions de prospection basées sur le comportement
   */
  async recommendProspectionActions(userId: string, sessionId: string): Promise<any> {
    try {
      const behaviorHistory = await this.getSessionBehaviorHistory(userId, sessionId);

      if (behaviorHistory.length === 0) {
        return {
          hasRecommendations: false,
          reason: 'no_behavior_data',
        };
      }

      const metrics = this.extractBehaviorMetrics(behaviorHistory);
      const recommendations = [];

      // Recommandation 1: Appel immédiat pour hot leads
      if (
        metrics.propertiesViewed >= 3 &&
        metrics.buttonClicks >= 2 &&
        metrics.totalTimeSpent >= 60
      ) {
        recommendations.push({
          action: 'immediate_call',
          priority: 'high',
          reason: 'Hot lead détecté : forte intention d\'achat',
          timing: 'within_1_hour',
          context: {
            interestedProperties: metrics.topProperties.slice(0, 2),
            engagementLevel: 'high',
          },
        });
      }

      // Recommandation 2: Email de suivi pour leads intéressés
      if (metrics.propertiesViewed >= 2 && metrics.leads === 0) {
        recommendations.push({
          action: 'follow_up_email',
          priority: 'medium',
          reason: 'Visiteur intéressé mais n\'a pas converti',
          timing: 'within_24_hours',
          context: {
            interestedProperties: metrics.topProperties,
            suggestedSubject: `À propos de ${metrics.topProperties[0]?.title || 'nos biens'}`,
          },
        });
      }

      // Recommandation 3: Remarketing pour visiteurs avec faible engagement
      if (
        metrics.propertiesViewed === 1 &&
        metrics.buttonClicks === 0 &&
        metrics.totalTimeSpent < 30
      ) {
        recommendations.push({
          action: 'remarketing_campaign',
          priority: 'low',
          reason: 'Faible engagement - potentiel de réactivation',
          timing: 'within_7_days',
          context: {
            suggestedChannel: 'email',
            campaignType: 'nurturing',
          },
        });
      }

      return {
        hasRecommendations: recommendations.length > 0,
        sessionId,
        metrics,
        recommendations,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to recommend prospection actions:`, error);
      return {
        hasRecommendations: false,
        reason: 'recommendation_error',
        error: error.message,
      };
    }
  }

  /**
   * Récupérer l'historique comportemental d'une session
   */
  private async getSessionBehaviorHistory(
    userId: string,
    sessionId: string,
  ): Promise<any[]> {
    return this.prisma.trackingEvent.findMany({
      where: {
        userId,
        sessionId,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });
  }

  /**
   * Construire le contexte pour la qualification IA
   */
  private buildAiQualificationContext(leadData: any, behaviorHistory: any[]): string {
    const metrics = this.extractBehaviorMetrics(behaviorHistory);

    return `
Qualifier ce lead basé sur son comportement sur la vitrine :

Lead Data:
- Source: ${leadData.source || 'vitrine_tracking'}
- Propriété intéressée: ${leadData.propertyData?.title || 'N/A'}
- Prix: ${leadData.propertyData?.price || 'N/A'}€
- Ville: ${leadData.propertyData?.city || 'N/A'}

Comportement:
- Propriétés vues: ${metrics.propertiesViewed}
- Temps total passé: ${Math.round(metrics.totalTimeSpent)}s
- Interactions (clics): ${metrics.buttonClicks}
- Leads générés: ${metrics.leads}
- Pattern: ${metrics.behaviorPattern}

Top Propriétés d'intérêt:
${metrics.topProperties.map((p: any, i: number) => `${i + 1}. ${p.title} (${p.interestScore} pts)`).join('\n')}

Question: Quel est le niveau de qualification de ce lead (A, B, C, D) ?
Quelle est son intention d'achat (haute, moyenne, faible) ?
Quelle action recommandes-tu ?
    `.trim();
  }

  /**
   * Exécuter la qualification IA via l'Orchestrator
   */
  private async runAiQualification(userId: string, context: string): Promise<any> {
    if (!this.aiOrchestratorService) {
      // Qualification par défaut sans AI
      return this.fallbackQualification(context);
    }

    try {
      const result = await this.aiOrchestratorService.orchestrate({
        tenantId: userId,
        userId,
        objective: context,
        options: {
          executionMode: 'auto',
          maxCost: 0.1, // Budget limité pour qualification
        },
      });

      return this.parseAiQualificationResult(result);
    } catch (error) {
      this.logger.error(`AI qualification failed, using fallback:`, error);
      return this.fallbackQualification(context);
    }
  }

  /**
   * Parser le résultat de l'AI
   */
  private parseAiQualificationResult(aiResult: any): any {
    // Extraire les informations du résultat AI
    const text = aiResult.result || '';

    // Extraction simple (à améliorer avec parsing avancé)
    const qualificationGrade = text.match(/[ABCD]/)?.[0] || 'C';
    const intent = text.toLowerCase().includes('haute')
      ? 'high'
      : text.toLowerCase().includes('faible')
        ? 'low'
        : 'medium';

    return {
      qualified: true,
      grade: qualificationGrade,
      intent,
      aiAnalysis: text,
      confidence: aiResult.metrics?.successfulCalls > 0 ? 0.8 : 0.5,
    };
  }

  /**
   * Qualification de secours sans AI
   */
  private fallbackQualification(context: string): any {
    // Extraction basique des métriques du contexte
    const propertiesMatch = context.match(/Propriétés vues: (\d+)/);
    const timeMatch = context.match(/Temps total passé: (\d+)/);
    const clicksMatch = context.match(/Interactions \(clics\): (\d+)/);

    const propertiesViewed = propertiesMatch ? parseInt(propertiesMatch[1]) : 0;
    const timeSpent = timeMatch ? parseInt(timeMatch[1]) : 0;
    const clicks = clicksMatch ? parseInt(clicksMatch[1]) : 0;

    // Scoring simple
    let grade = 'D';
    let intent = 'low';

    if (propertiesViewed >= 3 && clicks >= 2 && timeSpent >= 60) {
      grade = 'A';
      intent = 'high';
    } else if (propertiesViewed >= 2 && (clicks >= 1 || timeSpent >= 30)) {
      grade = 'B';
      intent = 'medium';
    } else if (propertiesViewed >= 1) {
      grade = 'C';
      intent = 'low';
    }

    return {
      qualified: true,
      grade,
      intent,
      aiAnalysis: 'Qualification automatique (mode fallback)',
      confidence: 0.6,
    };
  }

  /**
   * Calculer le score du lead (0-100)
   */
  private calculateLeadScore(behaviorHistory: any[], qualification: any): number {
    const metrics = this.extractBehaviorMetrics(behaviorHistory);

    let score = 0;

    // Grade (30 points)
    const gradeScores = { A: 30, B: 20, C: 10, D: 5 };
    score += gradeScores[qualification.grade as keyof typeof gradeScores] || 0;

    // Intent (30 points)
    const intentScores = { high: 30, medium: 20, low: 10 };
    score += intentScores[qualification.intent as keyof typeof intentScores] || 0;

    // Comportement (40 points)
    score += Math.min((metrics.propertiesViewed / 5) * 10, 10); // Max 10
    score += Math.min((metrics.buttonClicks / 5) * 10, 10); // Max 10
    score += Math.min((metrics.totalTimeSpent / 120) * 10, 10); // Max 10
    score += Math.min(metrics.leads * 10, 10); // Max 10

    return Math.round(score);
  }

  /**
   * Extraire les métriques comportementales
   */
  private extractBehaviorMetrics(behaviorHistory: any[]): any {
    const metrics = {
      propertiesViewed: new Set<string>(),
      buttonClicks: 0,
      totalTimeSpent: 0,
      leads: 0,
      topProperties: [] as any[],
      behaviorPattern: 'unknown',
    };

    const propertyInteractions = new Map<string, any>();

    behaviorHistory.forEach((event) => {
      const data = event.data as any;

      if (event.eventName === 'PropertyImpression' && data?.propertyId) {
        metrics.propertiesViewed.add(data.propertyId);

        if (!propertyInteractions.has(data.propertyId)) {
          propertyInteractions.set(data.propertyId, {
            propertyId: data.propertyId,
            title: data.propertyData?.title,
            impressions: 0,
            timeSpent: 0,
            clicks: 0,
            interestScore: 0,
          });
        }
        propertyInteractions.get(data.propertyId)!.impressions++;
      } else if (event.eventName === 'PropertyTimeSpent') {
        metrics.totalTimeSpent += data?.timeSpentSeconds || 0;
        if (data?.propertyId && propertyInteractions.has(data.propertyId)) {
          propertyInteractions.get(data.propertyId)!.timeSpent +=
            data.timeSpentSeconds || 0;
        }
      } else if (event.eventName === 'PropertyButtonClick') {
        metrics.buttonClicks++;
        if (data?.propertyId && propertyInteractions.has(data.propertyId)) {
          propertyInteractions.get(data.propertyId)!.clicks++;
        }
      } else if (event.eventName === 'Lead') {
        metrics.leads++;
      }
    });

    // Calculer les scores d'intérêt et trier
    metrics.topProperties = Array.from(propertyInteractions.values())
      .map((p) => ({
        ...p,
        interestScore: p.impressions * 10 + p.timeSpent + p.clicks * 20,
      }))
      .sort((a, b) => b.interestScore - a.interestScore)
      .slice(0, 3);

    // Déterminer le pattern
    if (metrics.leads > 0) {
      metrics.behaviorPattern = 'converter';
    } else if (
      metrics.propertiesViewed.size >= 3 &&
      metrics.buttonClicks >= 2
    ) {
      metrics.behaviorPattern = 'highly_engaged';
    } else if (metrics.propertiesViewed.size >= 2) {
      metrics.behaviorPattern = 'interested';
    } else {
      metrics.behaviorPattern = 'explorer';
    }

    return {
      ...metrics,
      propertiesViewed: metrics.propertiesViewed.size,
    };
  }

  /**
   * Générer une recommandation d'action
   */
  private generateRecommendation(qualification: any, behaviorHistory: any[]): string {
    const metrics = this.extractBehaviorMetrics(behaviorHistory);

    if (qualification.grade === 'A') {
      return `🎯 Lead HOT - Appel immédiat recommandé. Intéressé par ${metrics.topProperties[0]?.title || 'plusieurs biens'}.`;
    } else if (qualification.grade === 'B') {
      return `📧 Lead WARM - Email de suivi dans les 24h avec focus sur ${metrics.topProperties[0]?.title || 'biens similaires'}.`;
    } else if (qualification.grade === 'C') {
      return `📬 Lead COLD - Ajouter à campagne de nurturing. ${metrics.propertiesViewed} bien(s) vu(s).`;
    } else {
      return `⏳ Lead à faible intention - Remarketing dans 7 jours.`;
    }
  }

  /**
   * Trouver les sessions qui matchent les critères
   */
  private async findTargetSessions(userId: string, criteria: any): Promise<any[]> {
    const events = await this.prisma.trackingEvent.findMany({
      where: {
        userId,
        timestamp: {
          gte: criteria.since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Grouper par session
    const sessionMap = new Map<string, any[]>();

    events.forEach((event) => {
      const data = event.data as any;
      const sessionId = data?.sessionId || event.sessionId;

      if (sessionId) {
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, []);
        }
        sessionMap.get(sessionId)!.push(event);
      }
    });

    // Filtrer selon critères
    const matchingSessions: any[] = [];

    for (const [sessionId, sessionEvents] of sessionMap.entries()) {
      const metrics = this.extractBehaviorMetrics(sessionEvents);

      const matches =
        (!criteria.minProperties || metrics.propertiesViewed >= criteria.minProperties) &&
        (!criteria.minTimeSpent || metrics.totalTimeSpent >= criteria.minTimeSpent) &&
        (!criteria.behaviorPattern || metrics.behaviorPattern === criteria.behaviorPattern);

      if (matches) {
        matchingSessions.push({
          sessionId,
          events: sessionEvents,
          metrics,
        });
      }
    }

    return matchingSessions;
  }

  /**
   * Analyser les patterns communs
   */
  private analyzeCommonPatterns(sessions: any[]): any {
    const patterns = {
      commonProperties: new Map<string, number>(),
      commonButtonTypes: new Map<string, number>(),
      averageTimeSpent: 0,
      averagePropertiesViewed: 0,
    };

    let totalTimeSpent = 0;
    let totalPropertiesViewed = 0;

    sessions.forEach((session) => {
      totalTimeSpent += session.metrics.totalTimeSpent;
      totalPropertiesViewed += session.metrics.propertiesViewed;

      session.metrics.topProperties.forEach((prop: any) => {
        patterns.commonProperties.set(
          prop.propertyId,
          (patterns.commonProperties.get(prop.propertyId) || 0) + 1,
        );
      });
    });

    patterns.averageTimeSpent = totalTimeSpent / sessions.length;
    patterns.averagePropertiesViewed = totalPropertiesViewed / sessions.length;

    return {
      ...patterns,
      commonProperties: Array.from(patterns.commonProperties.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ propertyId: id, viewCount: count })),
    };
  }

  /**
   * Générer le message de campagne avec AI
   */
  private async generateCampaignMessage(
    userId: string,
    criteria: any,
    patterns: any,
  ): Promise<string> {
    // Message par défaut si AI indisponible
    return `Bonjour,

Nous avons remarqué votre intérêt pour nos biens immobiliers.

Nos visiteurs sont généralement intéressés par nos propriétés, passant en moyenne ${Math.round(patterns.averageTimeSpent)}s à les consulter.

Nous serions ravis de discuter de vos besoins et de vous présenter nos offres en détail.

Cordialement,
L'équipe`;
  }

  /**
   * Obtenir les sessions actives récentes
   */
  async getActiveSessions(userId: string, hours: number = 24): Promise<any[]> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    const events = await this.prisma.trackingEvent.findMany({
      where: {
        userId,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Grouper par sessionId
    const sessionMap = new Map<string, any[]>();

    events.forEach((event: any) => {
      const sessionId = event.sessionId || event.eventData?.sessionId;
      if (sessionId) {
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, []);
        }
        sessionMap.get(sessionId)!.push(event);
      }
    });

    // Créer les objets de session avec métriques
    const sessions = [];
    for (const [sessionId, sessionEvents] of sessionMap.entries()) {
      const metrics = this.extractBehaviorMetrics(sessionEvents);
      sessions.push({
        sessionId,
        events: sessionEvents,
        metrics,
        lastActivity: sessionEvents[0].timestamp,
      });
    }

    return sessions.sort(
      (a, b) => b.lastActivity.getTime() - a.lastActivity.getTime(),
    );
  }

  /**
   * Obtenir les insights comportementaux globaux
   */
  async getBehaviorInsights(userId: string, startDate: Date): Promise<any> {
    const events = await this.prisma.trackingEvent.findMany({
      where: {
        userId,
        timestamp: { gte: startDate },
      },
    });

    // Grouper par sessionId
    const sessionMap = new Map<string, any[]>();
    events.forEach((event: any) => {
      const sessionId = event.sessionId || event.eventData?.sessionId;
      if (sessionId) {
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, []);
        }
        sessionMap.get(sessionId)!.push(event);
      }
    });

    // Analyser tous les comportements
    const behaviorPatterns = new Map<string, number>();
    const gradeDistribution = new Map<string, number>();
    let totalLeadScore = 0;
    let totalSessions = 0;

    for (const [sessionId, sessionEvents] of sessionMap.entries()) {
      const metrics = this.extractBehaviorMetrics(sessionEvents);

      // Compter les patterns
      const pattern = metrics.behaviorPattern || 'unknown';
      behaviorPatterns.set(pattern, (behaviorPatterns.get(pattern) || 0) + 1);

      // Calculer le lead score pour chaque session
      const leadData = { sessionId, ...metrics };
      const qualification = await this.qualifyTrackingLead(userId, leadData);

      if (qualification.qualified) {
        const grade = qualification.grade || 'D';
        gradeDistribution.set(grade, (gradeDistribution.get(grade) || 0) + 1);
        totalLeadScore += qualification.leadScore || 0;
        totalSessions++;
      }
    }

    // Calculer les statistiques
    const averageLeadScore =
      totalSessions > 0 ? Math.round(totalLeadScore / totalSessions) : 0;

    // Trouver les propriétés les plus consultées
    const propertyViews = new Map<string, number>();
    events.forEach((event: any) => {
      const propertyId =
        event.eventData?.propertyId || event.data?.propertyId;
      if (propertyId) {
        propertyViews.set(propertyId, (propertyViews.get(propertyId) || 0) + 1);
      }
    });

    const topProperties = Array.from(propertyViews.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, views]) => ({ propertyId: id, views }));

    return {
      period: {
        startDate,
        endDate: new Date(),
        totalSessions: sessionMap.size,
        totalEvents: events.length,
      },
      behaviorPatterns: Array.from(behaviorPatterns.entries())
        .map(([pattern, count]) => ({
          pattern,
          count,
          percentage: Math.round((count / sessionMap.size) * 100),
        }))
        .sort((a, b) => b.count - a.count),
      gradeDistribution: Array.from(gradeDistribution.entries())
        .map(([grade, count]) => ({
          grade,
          count,
          percentage: Math.round((count / totalSessions) * 100),
        }))
        .sort((a, b) => {
          const gradeOrder = { A: 4, B: 3, C: 2, D: 1 };
          return (
            (gradeOrder[b.grade] || 0) - (gradeOrder[a.grade] || 0)
          );
        }),
      averageLeadScore,
      topProperties,
      insights: this.generateBehaviorInsights(
        behaviorPatterns,
        gradeDistribution,
        averageLeadScore,
      ),
    };
  }

  /**
   * Générer des insights à partir des données comportementales
   */
  private generateBehaviorInsights(
    behaviorPatterns: Map<string, number>,
    gradeDistribution: Map<string, number>,
    averageLeadScore: number,
  ): string[] {
    const insights: string[] = [];

    // Insight sur les patterns dominants
    const sortedPatterns = Array.from(behaviorPatterns.entries()).sort(
      (a, b) => b[1] - a[1],
    );
    if (sortedPatterns.length > 0) {
      const topPattern = sortedPatterns[0];
      const patternLabels = {
        converter: 'convertisseurs',
        highly_engaged: 'hautement engagés',
        interested: 'intéressés',
        explorer: 'explorateurs',
      };
      const label = patternLabels[topPattern[0]] || topPattern[0];
      insights.push(
        `Le comportement dominant est "${label}" (${topPattern[1]} sessions)`,
      );
    }

    // Insight sur la qualité des leads
    const gradeA = gradeDistribution.get('A') || 0;
    const gradeB = gradeDistribution.get('B') || 0;
    const totalQualified =
      (gradeDistribution.get('A') || 0) +
      (gradeDistribution.get('B') || 0) +
      (gradeDistribution.get('C') || 0) +
      (gradeDistribution.get('D') || 0);

    if (totalQualified > 0) {
      const highQualityRate = Math.round(
        ((gradeA + gradeB) / totalQualified) * 100,
      );
      insights.push(
        `${highQualityRate}% des leads sont de haute qualité (A ou B)`,
      );
    }

    // Insight sur le score moyen
    if (averageLeadScore >= 70) {
      insights.push(
        `Score moyen élevé (${averageLeadScore}/100) - Audience très qualifiée`,
      );
    } else if (averageLeadScore >= 50) {
      insights.push(
        `Score moyen correct (${averageLeadScore}/100) - Audience qualifiée`,
      );
    } else {
      insights.push(
        `Score moyen faible (${averageLeadScore}/100) - Optimisation du ciblage recommandée`,
      );
    }

    return insights;
  }
}
