import { IsEmail, IsString, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';

/**
 * Résultat de validation d'email
 */
export class EmailValidationResult {
    email: string;
    isValid: boolean;
    score: number; // 0-100
    errors: string[];
    suggestions?: string[]; // Suggestions de correction (ex: "gmial.com" → "gmail.com")

    // Détails techniques
    format: {
        hasValidFormat: boolean;
        hasMx: boolean; // MX records existent
        isDisposable: boolean; // Email jetable (temp mail)
        isFreeProvider: boolean; // Gmail, Yahoo, etc.
    };

    // Risques
    risk: {
        level: 'low' | 'medium' | 'high';
        isSpam: boolean;
        isCatchAll: boolean;
        confidence: number; // 0-1
    };
}

/**
 * Résultat de validation de téléphone
 */
export class PhoneValidationResult {
    phone: string;
    isValid: boolean;
    score: number; // 0-100
    errors: string[];

    // Format normalisé
    normalized: {
        e164: string; // +216XXXXXXXX
        international: string; // +216 XX XXX XXX
        national: string; // XX XXX XXX
    };

    // Détails
    details: {
        country: string; // TN, FR, etc.
        countryCode: string; // +216
        carrier?: string; // Ooredoo, Orange, Tunisie Telecom
        type: 'mobile' | 'landline' | 'voip' | 'unknown';
    };

    // Risques
    risk: {
        level: 'low' | 'medium' | 'high';
        isValid: boolean;
        confidence: number; // 0-1
    };
}

/**
 * Résultat de détection de spam
 */
export class SpamDetectionResult {
    text: string;
    isSpam: boolean;
    score: number; // 0-100, plus haut = plus de spam
    confidence: number; // 0-1

    // Raisons détaillées
    reasons: string[];

    // Catégories détectées
    categories: {
        promotionalSpam: boolean; // Publicité
        phishing: boolean; // Hameçonnage
        maliciousLinks: boolean; // Liens malveillants
        excessiveCapitals: boolean; // TROP DE MAJUSCULES
        suspiciousPatterns: boolean; // Patterns suspects
    };

    // Métriques
    metrics: {
        capitalsRatio: number; // Ratio de majuscules
        linksCount: number; // Nombre de liens
        suspiciousWordsCount: number; // Mots suspects
        urgencyScore: number; // Score d'urgence (0-100)
    };
}

/**
 * Résultat de validation complète
 */
export class FullValidationResult {
    email?: EmailValidationResult;
    phone?: PhoneValidationResult;
    spam?: SpamDetectionResult;

    // Score global
    globalScore: number; // 0-100
    isValid: boolean;

    // Recommandations
    recommendations: string[];

    // Timestamp
    validatedAt: Date;
}

/**
 * Options de validation
 */
export class ValidationOptions {
    @IsOptional()
    @IsBoolean()
    checkMx?: boolean = true; // Vérifier les MX records

    @IsOptional()
    @IsBoolean()
    checkDisposable?: boolean = true; // Vérifier si email jetable

    @IsOptional()
    @IsBoolean()
    detectSpam?: boolean = true; // Détecter le spam

    @IsOptional()
    @IsBoolean()
    strictMode?: boolean = false; // Mode strict (rejette plus)

    @IsOptional()
    @IsString()
    country?: string = 'TN'; // Pays par défaut pour téléphones

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    minScore?: number = 50; // Score minimum pour être valide
}

/**
 * DTO pour validation d'email
 */
export class ValidateEmailDto {
    @IsEmail()
    email: string;

    @IsOptional()
    options?: ValidationOptions;
}

/**
 * DTO pour validation de téléphone
 */
export class ValidatePhoneDto {
    @IsString()
    phone: string;

    @IsOptional()
    @IsString()
    country?: string = 'TN';

    @IsOptional()
    options?: ValidationOptions;
}

/**
 * DTO pour détection de spam
 */
export class DetectSpamDto {
    @IsString()
    text: string;

    @IsOptional()
    options?: ValidationOptions;
}

/**
 * DTO pour validation complète
 */
export class FullValidationDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    text?: string; // Texte pour détection de spam

    @IsOptional()
    options?: ValidationOptions;
}
