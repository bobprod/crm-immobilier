import { Injectable, Logger, Optional } from '@nestjs/common';
import { UnifiedValidationService } from '../../../shared/validation/unified-validation.service';
import { ValidationAIService } from '../../intelligence/validation/validation-ai.service';
import { PrismaService } from '../../../shared/database/prisma.service';

export interface ProspectValidationResult {
  isValid: boolean;
  score: number;
  email: {
    isValid: boolean;
    isDisposable: boolean;
    isFreeProvider: boolean;
    riskLevel: string;
    suggestions: string[];
    errors: string[];
  } | null;
  phone: {
    isValid: boolean;
    formatted: string | null;
    errors: string[];
  } | null;
  name: {
    isValid: boolean;
    isSuspicious: boolean;
    reasons: string[];
  };
  spam: {
    isSpam: boolean;
    confidence: number;
    reasons: string[];
  };
  duplicate: {
    isDuplicate: boolean;
    existingProspectId: string | null;
  };
  warnings: string[];
  errors: string[];
}

export interface AIValidationResult extends ProspectValidationResult {
  ai: {
    available: boolean;
    trustScore: number;
    isProfessional: boolean;
    spamCategory: string | null;
    enrichment: {
      company: string | null;
      location: string | null;
      contactType: string | null;
    } | null;
    recommendation: string;
  };
}

@Injectable()
export class ProspectSmartValidationService {
  private readonly logger = new Logger(ProspectSmartValidationService.name);

  // Patterns suspects pour les noms
  private readonly suspiciousNamePatterns = [
    /^test/i,
    /^admin/i,
    /^user\d*/i,
    /^spam/i,
    /^fake/i,
    /^aaa+/i,
    /^xxx/i,
    /^zzz/i,
    /^asdf/i,
    /^qwerty/i,
    /^temp/i,
    /^\d+$/,
    /^[a-z]$/i,
    /^[a-z]{1,2}$/i,
    /(.)\1{3,}/, // même caractère répété 4+ fois
  ];

  // Patterns suspects pour les téléphones
  private readonly suspiciousPhonePatterns = [
    /^0{5,}/,
    /^1{5,}/,
    /^(\d)\1{6,}/, // numéros répétitifs
    /^123456/,
    /^000000/,
    /^111111/,
  ];

  constructor(
    private validationService: UnifiedValidationService,
    @Optional() private validationAI: ValidationAIService,
    private prisma: PrismaService,
  ) {}

  /**
   * Validation intelligente complète d'un prospect
   */
  async validateProspect(
    data: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      notes?: string;
    },
    userId: string,
  ): Promise<ProspectValidationResult> {
    const result: ProspectValidationResult = {
      isValid: true,
      score: 100,
      email: null,
      phone: null,
      name: { isValid: true, isSuspicious: false, reasons: [] },
      spam: { isSpam: false, confidence: 0, reasons: [] },
      duplicate: { isDuplicate: false, existingProspectId: null },
      warnings: [],
      errors: [],
    };

    // 1. Validation email
    if (data.email) {
      const emailResult = await this.validateEmail(data.email);
      result.email = emailResult;

      if (!emailResult.isValid) {
        result.score -= 25;
        result.errors.push(...emailResult.errors);
      } else if (emailResult.isDisposable) {
        result.score -= 15;
        result.warnings.push('Email jetable détecté — risque de contact perdu');
      } else if (emailResult.riskLevel === 'high') {
        result.score -= 10;
        result.warnings.push('Email à risque élevé');
      }
    } else {
      result.score -= 20;
      result.errors.push('Email requis');
    }

    // 2. Validation téléphone
    if (data.phone) {
      const phoneResult = await this.validatePhone(data.phone);
      result.phone = phoneResult;

      if (!phoneResult.isValid) {
        result.score -= 15;
        result.warnings.push(...phoneResult.errors);
      }
    } else {
      result.score -= 10;
      result.warnings.push('Téléphone non renseigné');
    }

    // 3. Validation nom
    const nameResult = this.validateName(data.firstName, data.lastName);
    result.name = nameResult;

    if (!nameResult.isValid) {
      result.score -= 20;
      result.errors.push(...nameResult.reasons);
    } else if (nameResult.isSuspicious) {
      result.score -= 15;
      result.warnings.push(...nameResult.reasons);
    }

    // 4. Détection spam combinée
    const spamResult = await this.detectSpam(data);
    result.spam = spamResult;

    if (spamResult.isSpam) {
      result.score -= 30;
      result.errors.push('Contact détecté comme spam');
    } else if (spamResult.confidence > 50) {
      result.score -= 10;
      result.warnings.push('Signaux suspects détectés');
    }

    // 5. Détection doublons
    if (data.email) {
      const dupResult = await this.checkDuplicate(data.email, userId);
      result.duplicate = dupResult;

      if (dupResult.isDuplicate) {
        result.score -= 20;
        result.warnings.push('Un prospect avec cet email existe déjà');
      }
    }

    // Score final
    result.score = Math.max(0, Math.min(100, result.score));
    result.isValid = result.score >= 40 && result.errors.length === 0;

    return result;
  }

  /**
   * Validation rapide d'un champ unique (pour validation en temps réel)
   */
  async validateField(
    field: 'email' | 'phone' | 'name',
    value: string,
    extra?: { firstName?: string; lastName?: string; userId?: string },
  ) {
    switch (field) {
      case 'email': {
        const emailResult = await this.validateEmail(value);
        const dupResult = extra?.userId
          ? await this.checkDuplicate(value, extra.userId)
          : { isDuplicate: false, existingProspectId: null };
        return { ...emailResult, duplicate: dupResult };
      }
      case 'phone':
        return this.validatePhone(value);
      case 'name':
        return this.validateName(extra?.firstName || value, extra?.lastName || '');
      default:
        return { isValid: true };
    }
  }

  // ============================================
  // PRIVATE — Email validation
  // ============================================

  private async validateEmail(email: string) {
    try {
      const unified = await this.validationService.validateEmail(email);

      return {
        isValid: unified.isValid,
        isDisposable: unified.format?.isDisposable || false,
        isFreeProvider: unified.format?.isFreeProvider || false,
        riskLevel: unified.risk?.level || 'low',
        suggestions: unified.suggestions || [],
        errors: unified.errors || [],
      };
    } catch (error) {
      this.logger.warn(`Email validation error: ${error.message}`);
      // Fallback basic validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: emailRegex.test(email),
        isDisposable: false,
        isFreeProvider: false,
        riskLevel: 'unknown',
        suggestions: [],
        errors: emailRegex.test(email) ? [] : ['Format email invalide'],
      };
    }
  }

  // ============================================
  // PRIVATE — Phone validation
  // ============================================

  private async validatePhone(phone: string) {
    // Nettoyage du numéro
    const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');

    // Vérifier patterns suspects
    for (const pattern of this.suspiciousPhonePatterns) {
      if (pattern.test(cleaned)) {
        return {
          isValid: false,
          formatted: null,
          errors: ['Numéro de téléphone suspect'],
        };
      }
    }

    try {
      const unified = await this.validationService.validatePhone(phone);
      return {
        isValid: unified.isValid,
        formatted: unified.normalized?.international || unified.normalized?.e164 || null,
        errors: unified.errors || [],
      };
    } catch (error) {
      this.logger.warn(`Phone validation error: ${error.message}`);
      // Fallback basic: minimum 8 digits
      const digitsOnly = cleaned.replace(/\D/g, '');
      const isValid = digitsOnly.length >= 8 && digitsOnly.length <= 15;
      return {
        isValid,
        formatted: isValid ? cleaned : null,
        errors: isValid ? [] : ['Numéro de téléphone invalide (8-15 chiffres attendus)'],
      };
    }
  }

  // ============================================
  // PRIVATE — Name validation
  // ============================================

  private validateName(firstName?: string, lastName?: string) {
    const reasons: string[] = [];
    let isSuspicious = false;

    if (!firstName || !lastName) {
      return {
        isValid: false,
        isSuspicious: false,
        reasons: ['Prénom et nom requis'],
      };
    }

    // Vérifier patterns suspects
    for (const pattern of this.suspiciousNamePatterns) {
      if (pattern.test(firstName) || pattern.test(lastName)) {
        isSuspicious = true;
        reasons.push('Nom ou prénom suspect (pattern de test/spam détecté)');
        break;
      }
    }

    // Vérifier longueur raisonnable
    if (firstName.length < 2 || lastName.length < 2) {
      isSuspicious = true;
      reasons.push('Nom trop court');
    }

    if (firstName.length > 50 || lastName.length > 50) {
      isSuspicious = true;
      reasons.push('Nom anormalement long');
    }

    // Vérifier caractères valides (lettres, espaces, tirets, apostrophes)
    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
      isSuspicious = true;
      reasons.push('Caractères inhabituels dans le nom');
    }

    // Vérifier si prénom === nom
    if (firstName.toLowerCase() === lastName.toLowerCase()) {
      isSuspicious = true;
      reasons.push('Prénom et nom identiques');
    }

    return {
      isValid: true,
      isSuspicious,
      reasons,
    };
  }

  // ============================================
  // PRIVATE — Spam detection
  // ============================================

  private async detectSpam(data: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    notes?: string;
  }) {
    const reasons: string[] = [];
    let spamScore = 0;

    // Check combined signals
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();

    // 1. Cross-validate email vs name
    if (data.email && fullName) {
      const emailLocal = data.email.split('@')[0].toLowerCase();
      const nameParts = fullName.toLowerCase().split(/\s+/);

      // Si email n'a aucun rapport avec le nom et contient bcp de chiffres
      const digitRatio = (emailLocal.match(/\d/g) || []).length / emailLocal.length;
      if (digitRatio > 0.5 && !nameParts.some((p) => emailLocal.includes(p))) {
        spamScore += 20;
        reasons.push('Email avec beaucoup de chiffres et sans rapport avec le nom');
      }
    }

    // 2. Check notes for spam content
    if (data.notes) {
      const spamKeywords = [
        /\b(viagra|casino|lottery|winner|prize|congratulation|click here|subscribe|unsubscribe)\b/i,
        /\b(free money|earn \$|make money|work from home)\b/i,
        /(http[s]?:\/\/){2,}/i, // Multiple URLs
      ];

      for (const pattern of spamKeywords) {
        if (pattern.test(data.notes)) {
          spamScore += 30;
          reasons.push('Contenu spam détecté dans les notes');
          break;
        }
      }
    }

    // 3. Use unified service for text spam detection
    if (data.notes) {
      try {
        const spamCheck = await this.validationService.detectSpam(data.notes);
        if (spamCheck.isSpam) {
          spamScore += 40;
          reasons.push('Détection de spam algorithmique positive');
        }
      } catch {
        // Service non disponible, on continue
      }
    }

    return {
      isSpam: spamScore >= 50,
      confidence: Math.min(spamScore, 100),
      reasons,
    };
  }

  // ============================================
  // PRIVATE — Duplicate check
  // ============================================

  private async checkDuplicate(email: string, userId: string) {
    try {
      const existing = await this.prisma.prospects.findFirst({
        where: {
          email: email.toLowerCase(),
          userId,
          deletedAt: null,
        },
        select: { id: true },
      });

      return {
        isDuplicate: !!existing,
        existingProspectId: existing?.id || null,
      };
    } catch {
      return { isDuplicate: false, existingProspectId: null };
    }
  }

  // ============================================
  // AI-ENHANCED VALIDATION
  // ============================================

  /**
   * Validation complète avec IA (quand configurée)
   * Combine validation algorithmique + analyse sémantique AI
   */
  async validateProspectWithAI(
    data: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      notes?: string;
    },
    userId: string,
  ): Promise<AIValidationResult> {
    // Start with standard validation
    const baseResult = await this.validateProspect(data, userId);

    const aiResult: AIValidationResult = {
      ...baseResult,
      ai: {
        available: false,
        trustScore: 0,
        isProfessional: false,
        spamCategory: null,
        enrichment: null,
        recommendation: '',
      },
    };

    // AI validation requires the service to be available
    if (!this.validationAI) {
      aiResult.ai.recommendation = 'IA non disponible — validation algorithmique uniquement';
      return aiResult;
    }

    try {
      // 1. AI email validation
      if (data.email) {
        const aiEmail = await this.validationAI.validateEmailWithAI(
          userId,
          data.email,
          `Prospect immobilier: ${data.firstName} ${data.lastName}`,
        );

        if (aiEmail && aiEmail.aiValidation !== false) {
          aiResult.ai.available = true;
          aiResult.ai.trustScore = aiEmail.trustScore || 0;
          aiResult.ai.isProfessional = aiEmail.isProfessional || false;

          // Adjust score with AI insights
          if (aiEmail.trustScore) {
            const aiAdjustment = Math.round((aiEmail.trustScore - 50) * 0.2);
            aiResult.score = Math.max(0, Math.min(100, aiResult.score + aiAdjustment));
          }
        }
      }

      // 2. AI spam detection
      if (data.email) {
        const aiSpam = await this.validationAI.detectSpamWithAI(
          userId,
          data.email,
          `${data.firstName} ${data.lastName}`,
          data.notes,
        );

        if (aiSpam && aiSpam.confidence > 0) {
          aiResult.ai.available = true;
          aiResult.ai.spamCategory = aiSpam.category || null;

          if (aiSpam.isSpam && aiSpam.confidence > 70) {
            aiResult.spam.isSpam = true;
            aiResult.spam.confidence = Math.max(aiResult.spam.confidence, aiSpam.confidence);
            aiResult.spam.reasons.push('IA: Spam détecté avec haute confiance');
            aiResult.score = Math.max(0, aiResult.score - 20);
          }
        }
      }

      // 3. AI contact enrichment
      if (data.email) {
        const enrichment = await this.validationAI.enrichContactDataWithAI(
          userId,
          data.email,
          data.phone,
          `${data.firstName} ${data.lastName}`,
        );

        if (enrichment) {
          aiResult.ai.available = true;
          aiResult.ai.enrichment = {
            company: enrichment.company || null,
            location: enrichment.location || null,
            contactType: enrichment.contactType || null,
          };
        }
      }

      // Generate recommendation
      if (aiResult.ai.available) {
        if (aiResult.score >= 80) {
          aiResult.ai.recommendation = 'Contact de haute qualité — à prioriser';
        } else if (aiResult.score >= 60) {
          aiResult.ai.recommendation = 'Contact acceptable — vérification manuelle recommandée';
        } else if (aiResult.score >= 40) {
          aiResult.ai.recommendation = 'Contact à risque — nécessite validation approfondie';
        } else {
          aiResult.ai.recommendation = 'Contact suspect — création déconseillée';
        }
      }
    } catch (error) {
      this.logger.warn(`AI validation failed, using algorithmic only: ${error.message}`);
      aiResult.ai.recommendation = 'Erreur IA — validation algorithmique uniquement';
    }

    aiResult.isValid = aiResult.score >= 40 && !aiResult.spam.isSpam;
    return aiResult;
  }
}
