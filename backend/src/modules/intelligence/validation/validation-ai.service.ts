import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import axios from 'axios';

@Injectable()
export class ValidationAIService {
  private readonly logger = new Logger(ValidationAIService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Valider un email avec AI (analyse sémantique)
   */
  async validateEmailWithAI(userId: string, email: string, context?: string): Promise<any> {
    this.logger.log(`AI Email validation: ${email}`);

    try {
      // Récupérer les paramètres AI de l'utilisateur
      const aiSettings = await this.prisma.ai_settings.findUnique({
        where: { userId },
      });

      if (!aiSettings || !aiSettings.preferredProvider) {
        return {
          aiValidation: false,
          reason: 'AI not configured',
        };
      }

      const provider = aiSettings.preferredProvider;
      const apiKey = this.getApiKey(aiSettings, provider);

      if (!apiKey) {
        return {
          aiValidation: false,
          reason: 'API key not found',
        };
      }

      // Créer le prompt pour l'AI
      const prompt = this.buildEmailValidationPrompt(email, context);

      // Appeler l'AI selon le provider
      const aiResponse = await this.callAI(provider, apiKey, prompt);

      // Parser la réponse AI
      const result = this.parseAIResponse(aiResponse);

      // Sauvegarder dans ai_generations
      await this.prisma.ai_generations.create({
        data: {
          userId,
          provider,
          model: this.getModel(provider),
          prompt,
          response: JSON.stringify(aiResponse),
          tokensUsed: this.estimateTokens(prompt, aiResponse),
          type: 'email_validation',
          metadata: {
            email,
            result,
          },
        },
      });

      return result;
    } catch (error) {
      this.logger.error(`AI validation error: ${error.message}`);
      return {
        aiValidation: false,
        reason: error.message,
      };
    }
  }

  /**
   * Détecter le spam avec AI
   */
  async detectSpamWithAI(
    userId: string,
    email: string,
    name?: string,
    message?: string,
  ): Promise<any> {
    this.logger.log(`AI Spam detection: ${email}`);

    try {
      const aiSettings = await this.prisma.ai_settings.findUnique({
        where: { userId },
      });

      if (!aiSettings?.preferredProvider) {
        return { isSpam: false, confidence: 0 };
      }

      const provider = aiSettings.preferredProvider;
      const apiKey = this.getApiKey(aiSettings, provider);

      if (!apiKey) {
        return { isSpam: false, confidence: 0 };
      }

      const prompt = this.buildSpamDetectionPrompt(email, name, message);
      const aiResponse = await this.callAI(provider, apiKey, prompt);
      const result = this.parseSpamResponse(aiResponse);

      return result;
    } catch (error) {
      this.logger.error(`AI spam detection error: ${error.message}`);
      return { isSpam: false, confidence: 0 };
    }
  }

  /**
   * Enrichir les données de contact avec AI
   */
  async enrichContactDataWithAI(
    userId: string,
    email: string,
    phone?: string,
    name?: string,
  ): Promise<any> {
    this.logger.log(`AI Contact enrichment: ${email}`);

    try {
      const aiSettings = await this.prisma.ai_settings.findUnique({
        where: { userId },
      });

      if (!aiSettings?.preferredProvider) {
        return null;
      }

      const provider = aiSettings.preferredProvider;
      const apiKey = this.getApiKey(aiSettings, provider);

      if (!apiKey) {
        return null;
      }

      const prompt = this.buildEnrichmentPrompt(email, phone, name);
      const aiResponse = await this.callAI(provider, apiKey, prompt);
      const enrichedData = this.parseEnrichmentResponse(aiResponse);

      return enrichedData;
    } catch (error) {
      this.logger.error(`AI enrichment error: ${error.message}`);
      return null;
    }
  }

  /**
   * Calculer un score prédictif avec AI
   */
  async calculatePredictiveScore(userId: string, contactData: any): Promise<number> {
    try {
      const aiSettings = await this.prisma.ai_settings.findUnique({
        where: { userId },
      });

      if (!aiSettings?.preferredProvider) {
        return 0;
      }

      const provider = aiSettings.preferredProvider;
      const apiKey = this.getApiKey(aiSettings, provider);

      if (!apiKey) {
        return 0;
      }

      const prompt = this.buildScoringPrompt(contactData);
      const aiResponse = await this.callAI(provider, apiKey, prompt);
      const score = this.parseScoringResponse(aiResponse);

      return score;
    } catch (error) {
      this.logger.error(`AI scoring error: ${error.message}`);
      return 0;
    }
  }

  // ============================================
  // PROMPT BUILDERS
  // ============================================

  private buildEmailValidationPrompt(email: string, context?: string): string {
    return `Tu es un expert en validation d'emails. Analyse cet email et fournis une validation détaillée.

Email à analyser: ${email}
${context ? `Contexte: ${context}` : ''}

Analyse selon ces critères:
1. Le format de l'email semble-t-il professionnel ou personnel?
2. Le domaine est-il crédible pour un contact immobilier?
3. Y a-t-il des patterns suspects (nombres aléatoires, caractères étranges)?
4. Ce type d'email est-il couramment utilisé pour du spam?

Réponds UNIQUEMENT au format JSON:
{
  "isValid": boolean,
  "isProfessional": boolean,
  "trustScore": number (0-100),
  "likelihood": "high" | "medium" | "low",
  "reason": "explication courte",
  "suggestions": ["suggestion1", "suggestion2"]
}`;
  }

  private buildSpamDetectionPrompt(email: string, name?: string, message?: string): string {
    return `Tu es un expert en détection de spam. Analyse ce contact et détermine s'il s'agit de spam.

Email: ${email}
${name ? `Nom: ${name}` : ''}
${message ? `Message: ${message}` : ''}

Détecte les signaux de spam:
1. Email jetable ou suspect
2. Nom générique ou fake (test, spam, admin, etc.)
3. Message contenant des patterns de spam
4. Combinaison suspecte nom + email

Réponds UNIQUEMENT au format JSON:
{
  "isSpam": boolean,
  "confidence": number (0-100),
  "reasons": ["raison1", "raison2"],
  "category": "disposable" | "fake" | "bot" | "legitimate"
}`;
  }

  private buildEnrichmentPrompt(email: string, phone?: string, name?: string): string {
    return `Tu es un expert en enrichissement de données. À partir de ces informations, déduis des insights pertinents.

Email: ${email}
${phone ? `Téléphone: ${phone}` : ''}
${name ? `Nom: ${name}` : ''}

Fournis des insights sur:
1. Entreprise probable (si email professionnel)
2. Localisation probable (basé sur indicatif, domaine)
3. Type de contact (B2B, B2C, particulier)
4. Niveau de séniorité (si professionnel)

Réponds UNIQUEMENT au format JSON:
{
  "company": "string ou null",
  "location": "string ou null",
  "contactType": "b2b" | "b2c" | "unknown",
  "seniority": "junior" | "senior" | "executive" | "unknown",
  "industry": "string ou null",
  "confidence": number (0-100)
}`;
  }

  private buildScoringPrompt(contactData: any): string {
    return `Tu es un expert en scoring de leads immobiliers. Évalue la qualité de ce contact.

Données du contact:
${JSON.stringify(contactData, null, 2)}

Calcule un score de qualité (0-100) basé sur:
1. Complétude des informations
2. Cohérence des données
3. Professionnalisme de l'email
4. Validité du téléphone
5. Pertinence pour l'immobilier

Réponds UNIQUEMENT au format JSON:
{
  "score": number (0-100),
  "quality": "excellent" | "good" | "average" | "poor",
  "strengths": ["point fort 1", "point fort 2"],
  "weaknesses": ["point faible 1", "point faible 2"],
  "recommendation": "string"
}`;
  }

  // ============================================
  // AI CALLER
  // ============================================

  private async callAI(provider: string, apiKey: string, prompt: string): Promise<string> {
    switch (provider) {
      case 'openai':
        return this.callOpenAI(apiKey, prompt);
      case 'gemini':
        return this.callGemini(apiKey, prompt);
      case 'anthropic':
        return this.callAnthropic(apiKey, prompt);
      case 'deepseek':
        return this.callDeepSeek(apiKey, prompt);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  private async callOpenAI(apiKey: string, prompt: string): Promise<string> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data.choices[0].message.content;
  }

  private async callGemini(apiKey: string, prompt: string): Promise<string> {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
    );

    return response.data.candidates[0].content.parts[0].text;
  }

  private async callAnthropic(apiKey: string, prompt: string): Promise<string> {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data.content[0].text;
  }

  private async callDeepSeek(apiKey: string, prompt: string): Promise<string> {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data.choices[0].message.content;
  }

  // ============================================
  // RESPONSE PARSERS
  // ============================================

  private parseAIResponse(response: string): any {
    try {
      // Nettoyer la réponse (enlever markdown)
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(cleaned);
    } catch (error) {
      this.logger.warn('Failed to parse AI response as JSON');
      return {
        isValid: true,
        isProfessional: false,
        trustScore: 50,
        likelihood: 'medium',
        reason: 'Could not parse AI response',
      };
    }
  }

  private parseSpamResponse(response: string): any {
    try {
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(cleaned);
    } catch (error) {
      return {
        isSpam: false,
        confidence: 0,
        reasons: [],
        category: 'legitimate',
      };
    }
  }

  private parseEnrichmentResponse(response: string): any {
    try {
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(cleaned);
    } catch (error) {
      return null;
    }
  }

  private parseScoringResponse(response: string): number {
    try {
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      return parsed.score || 0;
    } catch (error) {
      return 0;
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private getApiKey(settings: any, provider: string): string | null {
    switch (provider) {
      case 'openai':
        return settings.openaiKey;
      case 'gemini':
        return settings.geminiKey;
      case 'anthropic':
        return settings.anthropicKey;
      case 'deepseek':
        return settings.deepseekKey;
      default:
        return null;
    }
  }

  private getModel(provider: string): string {
    const models: Record<string, string> = {
      openai: 'gpt-3.5-turbo',
      gemini: 'gemini-pro',
      anthropic: 'claude-3-haiku-20240307',
      deepseek: 'deepseek-chat',
    };
    return models[provider] || 'unknown';
  }

  private estimateTokens(prompt: string, response: any): number {
    const promptTokens = Math.ceil(prompt.length / 4);
    const responseTokens = Math.ceil(
      (typeof response === 'string' ? response : JSON.stringify(response)).length / 4,
    );
    return promptTokens + responseTokens;
  }
}
