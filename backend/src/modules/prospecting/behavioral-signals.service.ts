import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

/**
 * Service de détection et analyse des signaux comportementaux
 * pour identifier l'intention d'achat immobilier
 */

export interface BehavioralSignals {
  // Activité marketplace
  messagesCount: number;
  savedListings: number;
  viewedListings: number;
  activeDays: number;
  lastActivity: Date;

  // Engagement
  detailedQuestions: boolean;
  budgetMentioned: boolean;
  urgentKeywords: string[];

  // Contexte
  recentLifeEvent: string | null;
  specificCriteria: string[];
  focusedArea: boolean;

  // Signaux financiers
  budgetConfirmed: boolean;
  loanPreApproved: boolean;
  budgetRealistic: boolean;

  // Signaux négatifs
  identicalMessages: number;
  suspiciousLinks: boolean;
  profileIncomplete: boolean;
  vagueQuestions: boolean;
}

export interface IntentionScore {
  totalScore: number;
  quality: 'hot' | 'warm' | 'qualified' | 'cold' | 'spam';
  breakdown: {
    baseScore: number;
    behavioralScore: number;
    contextualScore: number;
    urgencyMultiplier: number;
    financialBonus: number;
    negativePenalty: number;
  };
  recommendedAction: string;
  priority: 'very_high' | 'high' | 'medium' | 'low' | 'none';
  responseDelay: string;
}

@Injectable()
export class BehavioralSignalsService {
  private readonly logger = new Logger(BehavioralSignalsService.name);

  // Mots-clés d'urgence
  private readonly URGENT_KEYWORDS = [
    'urgent',
    'rapide',
    'immédiat',
    'asap',
    'maintenant',
    'ce weekend',
    'cette semaine',
    'aujourd\'hui',
    'demain',
  ];

  // Mots-clés budget confirmé
  private readonly BUDGET_CONFIRMED_KEYWORDS = [
    'prêt',
    'crédit',
    'banque',
    'financement',
    'accord',
    'budget confirmé',
    'fonds',
    'cash',
  ];

  // Événements de vie déclencheurs
  private readonly LIFE_EVENTS = [
    'mariage',
    'marié',
    'nouveau travail',
    'mutation',
    'bébé',
    'enfant',
    'déménagement',
    'divorce',
    'retraite',
  ];

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Analyser les signaux comportementaux d'un lead
   */
  async analyzeLeadBehavior(leadId: string): Promise<BehavioralSignals> {
    const lead = await this.prisma.prospecting_leads.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }

    const metadata = (lead.metadata as any) || {};
    const messages = metadata.messages || [];
    const allText = messages.map((m: any) => m.content).join(' ').toLowerCase();

    return {
      // Activité
      messagesCount: messages.length || 0,
      savedListings: metadata.savedListings?.length || 0,
      viewedListings: metadata.viewedListings?.length || 0,
      activeDays: metadata.activeDays?.length || 0,
      lastActivity: metadata.lastActivity ? new Date(metadata.lastActivity) : new Date(),

      // Engagement
      detailedQuestions: this.hasDetailedQuestions(messages),
      budgetMentioned: this.detectBudgetMention(allText),
      urgentKeywords: this.extractUrgentKeywords(allText),

      // Contexte
      recentLifeEvent: this.detectLifeEvent(allText),
      specificCriteria: this.extractCriteria(allText),
      focusedArea: this.hasFocusedSearchArea(metadata),

      // Financier
      budgetConfirmed: this.isBudgetConfirmed(allText),
      loanPreApproved: this.hasLoanApproval(allText),
      budgetRealistic: this.isBudgetRealistic(lead.budget),

      // Négatifs
      identicalMessages: this.countIdenticalMessages(messages),
      suspiciousLinks: this.hasSuspiciousLinks(allText),
      profileIncomplete: this.isProfileIncomplete(lead),
      vagueQuestions: this.hasVagueQuestions(messages),
    };
  }

  /**
   * Calculer le score d'intention d'achat (0-100)
   */
  calculateIntentionScore(signals: BehavioralSignals): IntentionScore {
    let totalScore = 0;
    const breakdown: any = {};

    // 1. Base Score (0-20)
    breakdown.baseScore = this.getBaseScore(signals);
    totalScore += breakdown.baseScore;

    // 2. Behavioral Signals (0-50)
    breakdown.behavioralScore = this.analyzeBehavior(signals);
    totalScore += breakdown.behavioralScore;

    // 3. Contextual Factors (0-30)
    breakdown.contextualScore = this.analyzeContext(signals);
    totalScore += breakdown.contextualScore;

    // 4. Urgency Multiplier (x1.0 - x1.5)
    breakdown.urgencyMultiplier = this.detectUrgency(signals);
    totalScore *= breakdown.urgencyMultiplier;

    // 5. Financial Capacity (+0-20)
    breakdown.financialBonus = this.assessFinancialCapacity(signals);
    totalScore += breakdown.financialBonus;

    // 6. Negative Indicators (-30 to 0)
    breakdown.negativePenalty = this.detectNegativeSignals(signals);
    totalScore += breakdown.negativePenalty;

    // Normaliser 0-100
    totalScore = Math.min(100, Math.max(0, totalScore));

    // Classifier
    const quality = this.classifyLead(totalScore);
    const { action, priority, delay } = this.getRecommendedAction(quality, totalScore);

    return {
      totalScore,
      quality,
      breakdown,
      recommendedAction: action,
      priority,
      responseDelay: delay,
    };
  }

  /**
   * Mettre à jour le score d'un lead
   */
  async updateLeadScore(leadId: string): Promise<IntentionScore> {
    const signals = await this.analyzeLeadBehavior(leadId);
    const score = this.calculateIntentionScore(signals);

    // Sauvegarder dans la BDD
    await this.prisma.prospecting_leads.update({
      where: { id: leadId },
      data: {
        score: score.totalScore,
        metadata: {
          ...(await this.prisma.prospecting_leads.findUnique({ where: { id: leadId } })).metadata,
          intentionScore: score,
          behavioralSignals: signals,
          lastScoringDate: new Date().toISOString(),
        },
      },
    });

    this.logger.log(
      `Updated lead ${leadId} score: ${score.totalScore} (${score.quality})`,
    );

    return score;
  }

  /**
   * Batch scoring de plusieurs leads
   */
  async scoreBatchLeads(leadIds: string[]): Promise<Map<string, IntentionScore>> {
    const scores = new Map<string, IntentionScore>();

    for (const leadId of leadIds) {
      try {
        const score = await this.updateLeadScore(leadId);
        scores.set(leadId, score);
      } catch (error) {
        this.logger.warn(`Failed to score lead ${leadId}: ${error.message}`);
      }
    }

    return scores;
  }

  // ================== MÉTHODES PRIVÉES ==================

  private getBaseScore(signals: BehavioralSignals): number {
    let base = 10;
    if (signals.messagesCount > 0) base += 5;
    if (signals.savedListings > 0) base += 5;
    return base;
  }

  private analyzeBehavior(signals: BehavioralSignals): number {
    let score = 0;

    // Messages
    if (signals.messagesCount > 5) score += 20;
    else if (signals.messagesCount > 2) score += 10;
    else if (signals.messagesCount > 0) score += 5;

    // Sauvegardes
    if (signals.savedListings > 10) score += 15;
    else if (signals.savedListings > 3) score += 8;
    else if (signals.savedListings > 0) score += 3;

    // Fréquence
    if (signals.activeDays > 7) score += 10;
    else if (signals.activeDays > 3) score += 5;

    // Questions détaillées
    if (signals.detailedQuestions) score += 10;

    // Budget mentionné
    if (signals.budgetMentioned) score += 10;

    return Math.min(50, score);
  }

  private analyzeContext(signals: BehavioralSignals): number {
    let score = 0;

    // Événements de vie
    if (signals.recentLifeEvent) {
      if (signals.recentLifeEvent.includes('mariage')) score += 15;
      else if (signals.recentLifeEvent.includes('travail')) score += 12;
      else if (signals.recentLifeEvent.includes('bébé')) score += 10;
      else score += 8;
    }

    // Critères précis
    if (signals.specificCriteria.length > 5) score += 10;
    else if (signals.specificCriteria.length > 2) score += 5;

    // Zone recherche focalisée
    if (signals.focusedArea) score += 8;

    return Math.min(30, score);
  }

  private detectUrgency(signals: BehavioralSignals): number {
    const urgentCount = signals.urgentKeywords.length;

    if (urgentCount >= 3) return 1.5;
    if (urgentCount >= 1) return 1.2;
    return 1.0;
  }

  private assessFinancialCapacity(signals: BehavioralSignals): number {
    let score = 0;

    if (signals.budgetConfirmed) score += 15;
    if (signals.loanPreApproved) score += 20;
    if (signals.budgetRealistic) score += 10;

    return Math.min(20, score);
  }

  private detectNegativeSignals(signals: BehavioralSignals): number {
    let penalty = 0;

    // Spam patterns
    if (signals.identicalMessages > 5) penalty -= 30;
    if (signals.suspiciousLinks) penalty -= 20;

    // Profil incomplet
    if (signals.profileIncomplete) penalty -= 15;

    // Questions vagues
    if (signals.vagueQuestions && signals.specificCriteria.length === 0) {
      penalty -= 10;
    }

    return penalty;
  }

  private classifyLead(score: number): 'hot' | 'warm' | 'qualified' | 'cold' | 'spam' {
    if (score >= 80) return 'hot';
    if (score >= 60) return 'warm';
    if (score >= 40) return 'qualified';
    if (score >= 20) return 'cold';
    return 'spam';
  }

  private getRecommendedAction(
    quality: string,
    score: number,
  ): { action: string; priority: 'very_high' | 'high' | 'medium' | 'low' | 'none'; delay: string } {
    switch (quality) {
      case 'hot':
        return {
          action: 'Appel immédiat + Email personnalisé + Proposition biens',
          priority: 'very_high',
          delay: '1-4 heures',
        };
      case 'warm':
        return {
          action: 'Email personnalisé + WhatsApp + Suivi 24h',
          priority: 'high',
          delay: '24 heures',
        };
      case 'qualified':
        return {
          action: 'Email automatique + Nurturing campaign',
          priority: 'medium',
          delay: '48 heures',
        };
      case 'cold':
        return {
          action: 'Newsletter + Retargeting ads',
          priority: 'low',
          delay: '1 semaine',
        };
      default:
        return {
          action: 'Ignorer ou supprimer',
          priority: 'none',
          delay: 'N/A',
        };
    }
  }

  // ================== HELPERS DÉTECTION ==================

  private hasDetailedQuestions(messages: any[]): boolean {
    if (!messages || messages.length === 0) return false;

    const detailedIndicators = [
      'combien',
      'quel',
      'disponible',
      'visite',
      'charges',
      'copropriété',
      'notaire',
      'diagnostic',
      'travaux',
    ];

    const allText = messages.map((m) => m.content?.toLowerCase() || '').join(' ');
    return detailedIndicators.some((indicator) => allText.includes(indicator));
  }

  private detectBudgetMention(text: string): boolean {
    // Patterns budget
    const budgetPattern = /\b\d{3,}\s?(mille|k|dinars?|tnd|dt)\b/i;
    return budgetPattern.test(text);
  }

  private extractUrgentKeywords(text: string): string[] {
    return this.URGENT_KEYWORDS.filter((keyword) => text.includes(keyword));
  }

  private detectLifeEvent(text: string): string | null {
    const event = this.LIFE_EVENTS.find((e) => text.includes(e));
    return event || null;
  }

  private extractCriteria(text: string): string[] {
    const criteria: string[] = [];

    // Nombre de chambres
    if (/\b\d+\s?(chambres?|pièces?)\b/.test(text)) {
      criteria.push('rooms_specified');
    }

    // Surface
    if (/\b\d+\s?m[2²]/.test(text)) {
      criteria.push('surface_specified');
    }

    // Étage
    if (/étage|rez[\s-]de[\s-]chaussée/.test(text)) {
      criteria.push('floor_specified');
    }

    // Parking
    if (/parking|garage/.test(text)) {
      criteria.push('parking_required');
    }

    // Équipements
    if (/meublé|équipé|climatisé/.test(text)) {
      criteria.push('amenities_specified');
    }

    return criteria;
  }

  private hasFocusedSearchArea(metadata: any): boolean {
    // Vérifier si recherches concentrées sur une zone
    const locations = metadata.searchLocations || [];
    if (locations.length === 0) return false;

    // Si plus de 70% des recherches dans même zone
    const locationCounts = locations.reduce((acc: any, loc: string) => {
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {});

    const maxCount = Math.max(...(Object.values(locationCounts as any) as number[]));
    return maxCount / locations.length > 0.7;
  }

  private isBudgetConfirmed(text: string): boolean {
    return this.BUDGET_CONFIRMED_KEYWORDS.some((keyword) => text.includes(keyword));
  }

  private hasLoanApproval(text: string): boolean {
    const loanKeywords = ['prêt accord', 'crédit accept', 'banque confirm', 'financement accord'];
    return loanKeywords.some((keyword) => text.includes(keyword));
  }

  private isBudgetRealistic(budget: any): boolean {
    if (!budget) return false;

    const min = budget.min || 0;
    const max = budget.max || 0;

    // Budget Tunisie (en TND)
    // Minimum raisonnable: 80,000 TND
    // Maximum raisonnable: 5,000,000 TND
    return min >= 80000 && max <= 5000000 && max > min;
  }

  private countIdenticalMessages(messages: any[]): number {
    if (!messages || messages.length === 0) return 0;

    const contents = messages.map((m) => m.content);
    const uniqueContents = new Set(contents);

    return contents.length - uniqueContents.size;
  }

  private hasSuspiciousLinks(text: string): boolean {
    // Patterns liens suspects
    const suspiciousPatterns = [
      /bit\.ly/,
      /tinyurl/,
      /goo\.gl/,
      /t\.co/,
      /\bhttp:\/\/[a-z0-9]{8,}\./,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(text));
  }

  private isProfileIncomplete(lead: any): boolean {
    // Vérifier complétude profil
    const hasBasicInfo = !!(lead.firstName && lead.lastName);
    const hasContact = !!(lead.email || lead.phone);

    return !hasBasicInfo || !hasContact;
  }

  private hasVagueQuestions(messages: any[]): boolean {
    if (!messages || messages.length === 0) return false;

    const vaguePatterns = [
      /\bc'est quoi\b/i,
      /\binfo\b/i,
      /\bdispo\?/i,
      /\bprix\?/i,
      /\bjuste pour voir\b/i,
    ];

    const allText = messages.map((m) => m.content?.toLowerCase() || '').join(' ');
    return vaguePatterns.some((pattern) => pattern.test(allText));
  }
}
