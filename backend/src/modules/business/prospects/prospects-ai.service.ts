import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { LLMProviderFactory } from '../../intelligence/llm-config/providers/llm-provider.factory';

@Injectable()
export class ProspectsAIService {
  private readonly logger = new Logger(ProspectsAIService.name);

  constructor(
    private prisma: PrismaService,
    private llmFactory: LLMProviderFactory,
  ) {}

  private async getProspect(userId: string, prospectId: string) {
    const prospect = await this.prisma.prospects.findFirst({
      where: { id: prospectId, userId },
      include: {
        appointments: { take: 5, orderBy: { createdAt: 'desc' } },
        interactions: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouve');
    }

    return prospect;
  }

  private async callLLM(userId: string, prompt: string, _provider?: string) {
    try {
      const llmProvider = await this.llmFactory.createProvider(userId);
      const response = await llmProvider.generate(prompt, { maxTokens: 1000 });
      return response;
    } catch (error) {
      this.logger.warn(`LLM non disponible: ${error.message}`);
      return null;
    }
  }

  async analyzeProspect(userId: string, prospectId: string, provider?: string) {
    const prospect = await this.getProspect(userId, prospectId);

    const prompt = `Analyse ce prospect immobilier et fournis des insights:
Nom: ${prospect.firstName} ${prospect.lastName}
Email: ${prospect.email || 'Non renseigne'}
Telephone: ${prospect.phone || 'Non renseigne'}
Source: ${prospect.source || 'Inconnue'}
Statut: ${prospect.status}
Budget: ${prospect.budget || 'Non renseigne'}
Criteres: ${JSON.stringify(prospect.searchCriteria || {})}

Fournis une analyse structuree avec:
1. Profil du prospect
2. Niveau d'interet estime
3. Points d'attention
4. Recommandations`;

    const analysis = await this.callLLM(userId, prompt, provider);

    return {
      prospectId,
      analysis: analysis || this.getDefaultAnalysis(prospect),
      generatedAt: new Date().toISOString(),
    };
  }

  private getDefaultAnalysis(prospect: any) {
    const hasEmail = !!prospect.email;
    const hasPhone = !!prospect.phone;
    const hasBudget = !!prospect.budget;
    const completeness = [hasEmail, hasPhone, hasBudget].filter(Boolean).length;

    return {
      profile: `Prospect ${prospect.status} depuis ${prospect.source || 'source inconnue'}`,
      interestLevel: completeness >= 2 ? 'Eleve' : completeness >= 1 ? 'Moyen' : 'A qualifier',
      completeness: `${Math.round((completeness / 3) * 100)}%`,
      recommendations: [
        !hasEmail && 'Obtenir l\'email du prospect',
        !hasPhone && 'Obtenir le numero de telephone',
        !hasBudget && 'Qualifier le budget',
        'Planifier un premier contact',
      ].filter(Boolean),
    };
  }

  async generateMessage(
    userId: string,
    prospectId: string,
    messageType: string,
    context?: string,
    provider?: string,
  ) {
    const prospect = await this.getProspect(userId, prospectId);

    const prompt = `Genere un message ${messageType} professionnel pour ce prospect immobilier:
Nom: ${prospect.firstName} ${prospect.lastName}
Contexte: ${context || 'Premier contact'}

Le message doit etre:
- Personnalise avec le nom
- Professionnel mais chaleureux
- Court et engageant
- Avec un appel a l'action clair`;

    const message = await this.callLLM(userId, prompt, provider);

    return {
      prospectId,
      messageType,
      content: message || this.getDefaultMessage(prospect, messageType),
      generatedAt: new Date().toISOString(),
    };
  }

  private getDefaultMessage(prospect: any, type: string) {
    const templates = {
      email: `Bonjour ${prospect.firstName},

Je me permets de vous contacter suite a votre interet pour un bien immobilier.

Je serais ravi de discuter de vos criteres de recherche et de vous presenter des opportunites correspondant a vos attentes.

Seriez-vous disponible cette semaine pour un echange telephonique ?

Cordialement`,
      sms: `Bonjour ${prospect.firstName}, suite a votre demande, je suis disponible pour discuter de votre projet immobilier. Quand puis-je vous appeler ?`,
      whatsapp: `Bonjour ${prospect.firstName} ! Je suis votre conseiller immobilier. Je serais ravi de vous aider dans votre recherche. Avez-vous des questions ?`,
    };

    return templates[type] || templates.email;
  }

  async suggestActions(userId: string, prospectId: string, provider?: string) {
    const prospect = await this.getProspect(userId, prospectId);

    const lastInteraction = prospect.interactions?.[0];
    const daysSinceContact = prospect.lastContactDate
      ? Math.floor((Date.now() - new Date(prospect.lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const prompt = `Suggere les prochaines actions pour ce prospect:
Statut: ${prospect.status}
Derniere interaction: ${lastInteraction?.type || 'Aucune'} il y a ${daysSinceContact || '?'} jours
Prochaine action prevue: ${prospect.nextAction || 'Non definie'}

Liste 3-5 actions prioritaires avec leur niveau d'urgence.`;

    const suggestions = await this.callLLM(userId, prompt, provider);

    return {
      prospectId,
      actions: suggestions || this.getDefaultActions(prospect, daysSinceContact),
      generatedAt: new Date().toISOString(),
    };
  }

  private getDefaultActions(prospect: any, daysSinceContact: number | null) {
    const actions = [];

    if (!daysSinceContact || daysSinceContact > 7) {
      actions.push({
        action: 'Relancer le prospect',
        priority: 'high',
        reason: 'Pas de contact depuis plus de 7 jours',
      });
    }

    if (prospect.status === 'new') {
      actions.push({
        action: 'Qualifier le prospect',
        priority: 'high',
        reason: 'Nouveau prospect a qualifier',
      });
    }

    if (!prospect.budget) {
      actions.push({
        action: 'Determiner le budget',
        priority: 'medium',
        reason: 'Budget non renseigne',
      });
    }

    actions.push({
      action: 'Proposer des biens correspondants',
      priority: 'medium',
      reason: 'Maintenir l\'engagement',
    });

    return actions;
  }

  async predictConversion(userId: string, prospectId: string, provider?: string) {
    const prospect = await this.getProspect(userId, prospectId);

    // Calcul simple du score de conversion
    let score = 50;

    if (prospect.email) score += 10;
    if (prospect.phone) score += 10;
    if (prospect.budget) score += 15;
    if (prospect.searchCriteria) score += 10;
    if (prospect.appointments?.length > 0) score += 15;
    if (prospect.status === 'qualified') score += 10;
    if (prospect.status === 'negotiation') score += 20;

    score = Math.min(score, 95);

    return {
      prospectId,
      conversionProbability: score,
      factors: {
        contactInfo: prospect.email && prospect.phone ? 'Complet' : 'Incomplet',
        budget: prospect.budget ? 'Defini' : 'A qualifier',
        engagement: prospect.appointments?.length > 0 ? 'Actif' : 'A stimuler',
        status: prospect.status,
      },
      recommendations: score < 60
        ? ['Qualifier davantage le prospect', 'Planifier un rendez-vous']
        : ['Accelerer le processus', 'Proposer des visites'],
      generatedAt: new Date().toISOString(),
    };
  }

  async extractPreferences(
    userId: string,
    prospectId: string,
    text: string,
    provider?: string,
  ) {
    const prompt = `Extrait les preferences immobilieres de ce texte:
"${text}"

Retourne un JSON avec:
- propertyType (appartement, maison, villa, etc.)
- minRooms, maxRooms
- minBudget, maxBudget
- locations (liste de villes/quartiers)
- features (liste de caracteristiques souhaitees)`;

    const extracted = await this.callLLM(userId, prompt, provider);

    // Mise a jour des criteres du prospect si extraction reussie
    if (extracted) {
      try {
        const criteria = JSON.parse(extracted);
        await this.prisma.prospects.update({
          where: { id: prospectId },
          data: { searchCriteria: criteria },
        });
      } catch (e) {
        this.logger.warn('Impossible de parser les preferences extraites');
      }
    }

    return {
      prospectId,
      extractedPreferences: extracted || { error: 'Extraction non disponible' },
      generatedAt: new Date().toISOString(),
    };
  }

  async generateSummary(userId: string, prospectId: string, provider?: string) {
    const prospect = await this.getProspect(userId, prospectId);

    const interactionsCount = prospect.interactions?.length || 0;
    const appointmentsCount = prospect.appointments?.length || 0;

    return {
      prospectId,
      summary: {
        name: `${prospect.firstName} ${prospect.lastName}`,
        status: prospect.status,
        source: prospect.source,
        createdAt: prospect.createdAt,
        lastContact: prospect.lastContactDate,
        stats: {
          interactions: interactionsCount,
          appointments: appointmentsCount,
        },
        budget: prospect.budget,
        searchCriteria: prospect.searchCriteria,
        nextAction: prospect.nextAction,
        score: prospect.score,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async explainMatch(
    userId: string,
    prospectId: string,
    propertyId: string,
    provider?: string,
  ) {
    const prospect = await this.getProspect(userId, prospectId);
    const property = await this.prisma.properties.findFirst({
      where: { id: propertyId, userId },
    });

    if (!property) {
      throw new NotFoundException('Propriete non trouvee');
    }

    // Calcul simple de compatibilite
    let matchScore = 50;
    const reasons = [];

    // Verifier le budget
    if (prospect.budget && property.price) {
      const budgetMatch = prospect.budget >= property.price;
      if (budgetMatch) {
        matchScore += 20;
        reasons.push('Budget compatible');
      } else {
        matchScore -= 10;
        reasons.push('Budget inferieur au prix');
      }
    }

    // Verifier le type de bien
    const criteria = prospect.searchCriteria as any;
    if (criteria?.propertyType === property.type) {
      matchScore += 15;
      reasons.push('Type de bien recherche');
    }

    // Verifier la localisation
    if (criteria?.locations?.includes(property.city)) {
      matchScore += 15;
      reasons.push('Localisation souhaitee');
    }

    return {
      prospectId,
      propertyId,
      matchScore: Math.min(matchScore, 100),
      reasons,
      property: {
        title: property.title,
        price: property.price,
        type: property.type,
        city: property.city,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async generateFollowUp(
    userId: string,
    prospectId: string,
    lastInteraction?: any,
    provider?: string,
  ) {
    const prospect = await this.getProspect(userId, prospectId);

    const prompt = `Genere un email de relance pour ce prospect:
Nom: ${prospect.firstName} ${prospect.lastName}
Derniere interaction: ${lastInteraction?.type || 'Premier contact'}
Statut: ${prospect.status}

L'email doit:
- Rappeler la derniere interaction
- Montrer de l'interet pour le projet du client
- Proposer une action concrete`;

    const followUp = await this.callLLM(userId, prompt, provider);

    return {
      prospectId,
      followUpEmail: followUp || this.getDefaultFollowUp(prospect),
      generatedAt: new Date().toISOString(),
    };
  }

  private getDefaultFollowUp(prospect: any) {
    return {
      subject: `Suite a notre echange - ${prospect.firstName}`,
      body: `Bonjour ${prospect.firstName},

Je me permets de revenir vers vous concernant votre projet immobilier.

Avez-vous eu l'occasion de reflechir aux differentes options que nous avons evoquees ?

Je reste a votre entiere disposition pour organiser des visites ou repondre a vos questions.

Cordialement`,
    };
  }
}
