import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../../intelligence/ai-orchestrator/services/llm.service';

export interface ListingAnalysis {
  surface: string | null;
  prix: string | null;
  vocation: string | null;
  titre: string | null;
  scoreBoost: number;
  signals: string[];
  summary: string;
}

export interface ParsedQuery {
  keywords: string[];
  location: string | null;
  maxBudget: string | null;
  type: string | null;
  raw: string;
}

@Injectable()
export class PepiteAiService {
  private readonly logger = new Logger(PepiteAiService.name);

  constructor(private readonly llm: LlmService) {}

  async parseNaturalLanguageQuery(
    prompt: string,
    country: string,
    userId: string,
  ): Promise<ParsedQuery> {
    const systemPrompt = `Tu es un expert en immobilier ${country}. Ton rôle est d'extraire des mots-clés de recherche immobilière à partir d'une requête en langage naturel. Réponds UNIQUEMENT avec du JSON valide, sans markdown ni explications.`;

    const userPrompt = `Extrait les critères de recherche de cette requête immobilière :
"${prompt}"

Retourne un objet JSON avec :
- keywords: tableau de 2-5 mots-clés de recherche pertinents pour une annonce immobilière
- location: ville ou région mentionnée (null si absente)
- maxBudget: budget maximum mentionné avec devise (null si absent)
- type: type de bien (terrain/immeuble/local/appartement/villa, null si absent)

Exemple: {"keywords":["terrain viabilisé","zone UA","titre bleu"],"location":"Ariana","maxBudget":"100000 TND","type":"terrain"}`;

    try {
      const result = await this.llm.generate({
        userId,
        prompt: userPrompt,
        systemPrompt,
        maxTokens: 300,
        temperature: 0.2,
      });

      const json = this.extractJson(result.text);
      const parsed = JSON.parse(json);
      return {
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [prompt],
        location: parsed.location ?? null,
        maxBudget: parsed.maxBudget ?? null,
        type: parsed.type ?? null,
        raw: prompt,
      };
    } catch (err: any) {
      this.logger.warn(`NL query parse failed: ${err.message}`);
      return { keywords: [prompt], location: null, maxBudget: null, type: null, raw: prompt };
    }
  }

  async analyzeListingText(
    title: string,
    description: string,
    country: string,
    userId: string,
  ): Promise<ListingAnalysis> {
    const systemPrompt = `Tu es un expert en analyse d'annonces immobilières ${country}. Réponds UNIQUEMENT avec du JSON valide, sans markdown ni explications.`;

    const POSITIVE_SIGNALS_TN = ['titre bleu', 'titre individuel', 'cpf', 'viabilisé', 'zone ua', 'zone ub', 'pa approuvé', 'vente urgente', 'sous le marché'];
    const POSITIVE_SIGNALS_FR = ['sous-évalué', 'viabilisé', 'plu constructible', 'terrain à bâtir', 'vente rapide', 'prix négociable', 'lotissement approuvé'];
    const signals = country === 'France' ? POSITIVE_SIGNALS_FR : POSITIVE_SIGNALS_TN;

    const userPrompt = `Analyse cette annonce immobilière et extrait les informations clés :

Titre: ${title}
Description: ${description.substring(0, 500)}

Retourne un objet JSON avec :
- surface: surface extraite avec unité (null si absent)
- prix: prix extrait avec devise (null si absent)
- vocation: vocation/zone urbanistique mentionnée (null si absent)
- titre: type de titre foncier mentionné (null si absent)
- scoreBoost: bonus de score entre 0 et 20 (20 = annonce très prometteuse avec signaux positifs)
- signals: tableau des signaux positifs détectés parmi : ${signals.join(', ')}
- summary: résumé en 1 phrase de l'opportunité

Exemple: {"surface":"500 m²","prix":"85000 TND","vocation":"zone UA","titre":"titre bleu","scoreBoost":15,"signals":["titre bleu","zone ua"],"summary":"Terrain de 500m² en zone UA avec titre bleu, potentiel élevé."}`;

    try {
      const result = await this.llm.generate({
        userId,
        prompt: userPrompt,
        systemPrompt,
        maxTokens: 400,
        temperature: 0.1,
      });

      const json = this.extractJson(result.text);
      const parsed = JSON.parse(json);
      return {
        surface: parsed.surface ?? null,
        prix: parsed.prix ?? null,
        vocation: parsed.vocation ?? null,
        titre: parsed.titre ?? null,
        scoreBoost: Math.min(20, Math.max(0, Number(parsed.scoreBoost) || 0)),
        signals: Array.isArray(parsed.signals) ? parsed.signals : [],
        summary: parsed.summary ?? '',
      };
    } catch (err: any) {
      this.logger.warn(`Listing analysis failed: ${err.message}`);
      return { surface: null, prix: null, vocation: null, titre: null, scoreBoost: 0, signals: [], summary: '' };
    }
  }

  private extractJson(text: string): string {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return match[0];
    throw new Error('No JSON found in LLM response');
  }
}
