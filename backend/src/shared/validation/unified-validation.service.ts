import { Injectable, Logger } from '@nestjs/common';
import {
    EmailValidationResult,
    PhoneValidationResult,
    SpamDetectionResult,
    FullValidationResult,
    ValidationOptions,
} from './dto';

/**
 * 🛡️ Service Unifié de Validation
 *
 * Centralise toutes les validations :
 * - Emails (RFC 5322)
 * - Téléphones (E.164)
 * - Détection de spam
 *
 * Objectif Phase 2 :
 * - Spam detection: 60% → 95% (+58%)
 * - Lead validity: 65% → 92% (+42%)
 */
@Injectable()
export class UnifiedValidationService {
    private readonly logger = new Logger(UnifiedValidationService.name);

    // ============================================
    // VALIDATION EMAIL (RFC 5322)
    // ============================================

    /**
     * Valider un email selon RFC 5322
     */
    async validateEmail(email: string, options: ValidationOptions = {}): Promise<EmailValidationResult> {
        this.logger.debug(`Validating email: ${email}`);

        const result: EmailValidationResult = {
            email,
            isValid: false,
            score: 0,
            errors: [],
            format: {
                hasValidFormat: false,
                hasMx: false,
                isDisposable: false,
                isFreeProvider: false,
            },
            risk: {
                level: 'low',
                isSpam: false,
                isCatchAll: false,
                confidence: 0,
            },
        };

        // 1. Validation du format RFC 5322
        const formatValidation = this.validateEmailFormat(email);
        result.format.hasValidFormat = formatValidation.isValid;

        if (!formatValidation.isValid) {
            result.errors.push(...formatValidation.errors);
            return result;
        }

        let score = 50; // Base score pour format valide (augmenté de 40 à 50)

        // 2. Vérifier les fournisseurs jetables (disposable emails)
        if (options.checkDisposable !== false) {
            const isDisposable = this.isDisposableEmail(email);
            result.format.isDisposable = isDisposable;

            if (isDisposable) {
                result.errors.push('Email jetable détecté');
                result.risk.level = 'high';
                result.risk.isSpam = true;
                score -= 30;
            }
        }

        // 3. Vérifier les fournisseurs gratuits (Gmail, Yahoo, etc.)
        const isFreeProvider = this.isFreeEmailProvider(email);
        result.format.isFreeProvider = isFreeProvider;

        if (isFreeProvider) {
            score += 5; // Bonus léger pour emails gratuits valides (Gmail, Yahoo)
        } else {
            score += 20; // Bonus plus important pour email professionnel
        }

        // 4. Suggestions de correction (typos communs)
        const suggestions = this.suggestEmailCorrections(email);
        if (suggestions.length > 0) {
            result.suggestions = suggestions;
            result.errors.push('Possible typo détecté');
            score -= 10;
        }

        // 5. Vérifier les MX records (optionnel, peut être lent)
        if (options.checkMx) {
            try {
                const hasMx = await this.checkMxRecords(email);
                result.format.hasMx = hasMx;

                if (!hasMx) {
                    result.errors.push('Aucun MX record trouvé');
                    result.risk.level = 'high';
                    score -= 20;
                } else {
                    score += 20;
                }
            } catch (error) {
                this.logger.warn(`MX check failed for ${email}: ${error.message}`);
                result.format.hasMx = false;
            }
        } else {
            // Si pas de vérification MX, on assume que c'est OK
            result.format.hasMx = true;
            score += 10;
        }

        // 6. Calcul du score final
        result.score = Math.max(0, Math.min(100, score));
        result.isValid = result.score >= (options.minScore || 50) && result.errors.length === 0;

        // 7. Niveau de risque et confiance
        result.risk.confidence = result.score / 100;

        if (result.score >= 80) {
            result.risk.level = 'low';
        } else if (result.score >= 50) {
            result.risk.level = 'medium';
        } else {
            result.risk.level = 'high';
        }

        this.logger.debug(`Email validation result: ${email} - Score: ${result.score}, Valid: ${result.isValid}`);

        return result;
    }

    /**
     * Valider le format d'email selon RFC 5322 (simplifié)
     */
    private validateEmailFormat(email: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Vérifications basiques
        if (!email || typeof email !== 'string') {
            errors.push('Email requis');
            return { isValid: false, errors };
        }

        email = email.trim().toLowerCase();

        // Longueur
        if (email.length > 254) {
            errors.push('Email trop long (max 254 caractères)');
        }

        // Format général avec regex RFC 5322 (simplifié)
        const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

        if (!emailRegex.test(email)) {
            errors.push('Format d\'email invalide');
            return { isValid: false, errors };
        }

        // Vérifier le domaine
        const parts = email.split('@');
        if (parts.length !== 2) {
            errors.push('Email doit contenir exactement un @');
            return { isValid: false, errors };
        }

        const [localPart, domain] = parts;

        // Vérifier la partie locale (avant @)
        if (localPart.length > 64) {
            errors.push('Partie locale trop longue (max 64 caractères)');
        }

        if (localPart.startsWith('.') || localPart.endsWith('.')) {
            errors.push('La partie locale ne peut pas commencer ou finir par un point');
        }

        if (localPart.includes('..')) {
            errors.push('La partie locale ne peut pas contenir deux points consécutifs');
        }

        // Vérifier le domaine
        if (domain.length > 253) {
            errors.push('Domaine trop long (max 253 caractères)');
        }

        if (!domain.includes('.')) {
            errors.push('Domaine doit contenir au moins un point');
        }

        if (domain.startsWith('-') || domain.endsWith('-')) {
            errors.push('Domaine ne peut pas commencer ou finir par un tiret');
        }

        // Vérifier TLD (dernière partie du domaine)
        const tld = domain.split('.').pop();
        if (tld && tld.length < 2) {
            errors.push('TLD invalide (min 2 caractères)');
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * Vérifier si l'email est un fournisseur jetable (disposable)
     */
    private isDisposableEmail(email: string): boolean {
        const domain = email.split('@')[1]?.toLowerCase();

        if (!domain) return false;

        // Liste des domaines jetables les plus communs
        const disposableDomains = [
            'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com',
            'throwaway.email', 'yopmail.com', 'temp-mail.org', 'maildrop.cc',
            'getnada.com', 'trashmail.com', 'sharklasers.com', 'guerrillamail.info',
            'spam4.me', 'getairmail.com', 'fakeinbox.com', 'emailondeck.com',
        ];

        return disposableDomains.includes(domain);
    }

    /**
     * Vérifier si l'email est un fournisseur gratuit
     */
    private isFreeEmailProvider(email: string): boolean {
        const domain = email.split('@')[1]?.toLowerCase();

        if (!domain) return false;

        // Liste des fournisseurs gratuits
        const freeProviders = [
            'gmail.com', 'yahoo.com', 'yahoo.fr', 'hotmail.com', 'outlook.com',
            'live.com', 'msn.com', 'aol.com', 'icloud.com', 'me.com',
            'protonmail.com', 'mail.com', 'gmx.com', 'zoho.com',
        ];

        return freeProviders.includes(domain);
    }

    /**
     * Suggérer des corrections pour typos communs
     */
    private suggestEmailCorrections(email: string): string[] {
        const suggestions: string[] = [];
        const domain = email.split('@')[1]?.toLowerCase();

        if (!domain) return suggestions;

        // Typos communs
        const commonTypos: Record<string, string> = {
            'gmial.com': 'gmail.com',
            'gmai.com': 'gmail.com',
            'gmil.com': 'gmail.com',
            'yahooo.com': 'yahoo.com',
            'yaho.com': 'yahoo.com',
            'hotmial.com': 'hotmail.com',
            'outlok.com': 'outlook.com',
        };

        if (commonTypos[domain]) {
            const correctedEmail = email.replace(domain, commonTypos[domain]);
            suggestions.push(correctedEmail);
        }

        return suggestions;
    }

    /**
     * Vérifier les MX records (requiert DNS lookup)
     */
    private async checkMxRecords(email: string): Promise<boolean> {
        const domain = email.split('@')[1];

        if (!domain) return false;

        try {
            // En production, utiliser 'dns' module de Node.js
            // Pour l'instant, simulation
            const { resolveMx } = await import('dns/promises');
            const addresses = await resolveMx(domain);
            return addresses && addresses.length > 0;
        } catch (error) {
            // Si erreur DNS, on retourne false
            return false;
        }
    }

    // ============================================
    // VALIDATION TÉLÉPHONE (E.164)
    // ============================================

    /**
     * Valider un numéro de téléphone selon E.164
     */
    async validatePhone(phone: string, country: string = 'TN', options: ValidationOptions = {}): Promise<PhoneValidationResult> {
        this.logger.debug(`Validating phone: ${phone} (country: ${country})`);

        const result: PhoneValidationResult = {
            phone,
            isValid: false,
            score: 0,
            errors: [],
            normalized: {
                e164: '',
                international: '',
                national: '',
            },
            details: {
                country: country,
                countryCode: '',
                type: 'unknown',
            },
            risk: {
                level: 'low',
                isValid: false,
                confidence: 0,
            },
        };

        // 1. Nettoyer le numéro
        const cleaned = this.cleanPhoneNumber(phone);

        if (!cleaned) {
            result.errors.push('Numéro vide');
            return result;
        }

        let score = 30; // Score de base

        // 2. Détecter et valider selon le pays
        const countryValidation = this.validatePhoneByCountry(cleaned, country);

        if (!countryValidation.isValid) {
            result.errors.push(...countryValidation.errors);
            return result;
        }

        score += 40; // Format valide

        // 3. Normaliser le numéro
        result.normalized = countryValidation.normalized;
        result.details.countryCode = countryValidation.countryCode;
        result.details.type = countryValidation.type;

        // 4. Bonus selon le type
        if (countryValidation.type === 'mobile') {
            score += 20; // Mobile plus fiable
        } else if (countryValidation.type === 'landline') {
            score += 10;
        }

        // 5. Vérifier le carrier (optionnel)
        if (country === 'TN') {
            result.details.carrier = this.detectTunisianCarrier(cleaned);
            if (result.details.carrier) {
                score += 10;
            }
        }

        // 6. Score final
        result.score = Math.max(0, Math.min(100, score));
        result.isValid = result.score >= (options.minScore || 50) && result.errors.length === 0;
        result.risk.isValid = result.isValid;
        result.risk.confidence = result.score / 100;

        if (result.score >= 80) {
            result.risk.level = 'low';
        } else if (result.score >= 50) {
            result.risk.level = 'medium';
        } else {
            result.risk.level = 'high';
        }

        this.logger.debug(`Phone validation result: ${phone} - Score: ${result.score}, Valid: ${result.isValid}`);

        return result;
    }

    /**
     * Nettoyer un numéro de téléphone
     */
    private cleanPhoneNumber(phone: string): string {
        if (!phone) return '';

        // Garder seulement les chiffres et le +
        return phone.replace(/[^\d+]/g, '');
    }

    /**
     * Valider selon le pays
     */
    private validatePhoneByCountry(phone: string, country: string): {
        isValid: boolean;
        errors: string[];
        normalized: { e164: string; international: string; national: string };
        countryCode: string;
        type: 'mobile' | 'landline' | 'voip' | 'unknown';
    } {
        const errors: string[] = [];

        // Validation pour la Tunisie (TN)
        if (country === 'TN') {
            return this.validateTunisianPhone(phone);
        }

        // Validation pour la France (FR)
        if (country === 'FR') {
            return this.validateFrenchPhone(phone);
        }

        // Fallback: validation E.164 générique
        return this.validateE164Phone(phone);
    }

    /**
     * Valider un numéro tunisien
     */
    private validateTunisianPhone(phone: string): {
        isValid: boolean;
        errors: string[];
        normalized: { e164: string; international: string; national: string };
        countryCode: string;
        type: 'mobile' | 'landline' | 'voip' | 'unknown';
    } {
        const errors: string[] = [];
        let type: 'mobile' | 'landline' | 'voip' | 'unknown' = 'unknown';

        // Retirer le +216 ou 00216 si présent
        let cleaned = phone.replace(/^(\+216|00216)/, '');

        // Vérifier la longueur (8 chiffres pour TN)
        if (cleaned.length !== 8) {
            errors.push(`Numéro tunisien doit contenir 8 chiffres (trouvé: ${cleaned.length})`);
            return {
                isValid: false,
                errors,
                normalized: { e164: '', international: '', national: '' },
                countryCode: '+216',
                type,
            };
        }

        // Vérifier le préfixe
        const prefix = cleaned.substring(0, 2);

        // Mobiles: 2X, 4X, 5X, 9X
        if (['20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
            '40', '41', '42', '43', '44', '45', '46', '47', '48', '49',
            '50', '51', '52', '53', '54', '55', '56', '57', '58', '59',
            '90', '91', '92', '93', '94', '95', '96', '97', '98', '99'].includes(prefix)) {
            type = 'mobile';
        }
        // Fixes: 7X
        else if (prefix.startsWith('7')) {
            type = 'landline';
        }
        else {
            errors.push(`Préfixe invalide pour la Tunisie: ${prefix}`);
        }

        // Normalisation
        const e164 = `+216${cleaned}`;
        const international = `+216 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;
        const national = `${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;

        return {
            isValid: errors.length === 0,
            errors,
            normalized: { e164, international, national },
            countryCode: '+216',
            type,
        };
    }

    /**
     * Valider un numéro français
     */
    private validateFrenchPhone(phone: string): {
        isValid: boolean;
        errors: string[];
        normalized: { e164: string; international: string; national: string };
        countryCode: string;
        type: 'mobile' | 'landline' | 'voip' | 'unknown';
    } {
        const errors: string[] = [];
        let type: 'mobile' | 'landline' | 'voip' | 'unknown' = 'unknown';

        // Retirer le +33 ou 0033 si présent
        let cleaned = phone.replace(/^(\+33|0033|0)/, '');

        // Vérifier la longueur (9 chiffres après le 0)
        if (cleaned.length !== 9) {
            errors.push(`Numéro français doit contenir 9 chiffres (trouvé: ${cleaned.length})`);
            return {
                isValid: false,
                errors,
                normalized: { e164: '', international: '', national: '' },
                countryCode: '+33',
                type,
            };
        }

        // Vérifier le préfixe
        const prefix = cleaned.charAt(0);

        if (prefix === '6' || prefix === '7') {
            type = 'mobile';
        } else if (['1', '2', '3', '4', '5', '9'].includes(prefix)) {
            type = 'landline';
        } else {
            errors.push(`Préfixe invalide pour la France: ${prefix}`);
        }

        // Normalisation
        const e164 = `+33${cleaned}`;
        const international = `+33 ${prefix} ${cleaned.substring(1, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7)}`;
        const national = `0${cleaned.substring(0, 1)} ${cleaned.substring(1, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7)}`;

        return {
            isValid: errors.length === 0,
            errors,
            normalized: { e164, international, national },
            countryCode: '+33',
            type,
        };
    }

    /**
     * Validation E.164 générique
     */
    private validateE164Phone(phone: string): {
        isValid: boolean;
        errors: string[];
        normalized: { e164: string; international: string; national: string };
        countryCode: string;
        type: 'mobile' | 'landline' | 'voip' | 'unknown';
    } {
        const errors: string[] = [];

        // Format E.164: +[country code][number]
        if (!phone.startsWith('+')) {
            errors.push('Numéro doit commencer par + pour le format E.164');
        }

        // Longueur maximale E.164: 15 chiffres (incluant country code)
        const digits = phone.replace(/\D/g, '');

        if (digits.length > 15) {
            errors.push('Numéro trop long pour le format E.164 (max 15 chiffres)');
        }

        if (digits.length < 8) {
            errors.push('Numéro trop court (min 8 chiffres)');
        }

        return {
            isValid: errors.length === 0,
            errors,
            normalized: {
                e164: phone.startsWith('+') ? phone : `+${phone}`,
                international: phone,
                national: phone.replace(/^\+\d+/, ''),
            },
            countryCode: phone.match(/^\+\d+/)?.[0] || '',
            type: 'unknown',
        };
    }

    /**
     * Détecter l'opérateur tunisien
     */
    private detectTunisianCarrier(phone: string): string | undefined {
        const cleaned = phone.replace(/^(\+216|00216)/, '');
        const prefix = cleaned.substring(0, 2);

        // Ooredoo (anciennement Tunisiana): 20-29
        if (['20', '21', '22', '23', '24', '25', '26', '27', '28', '29'].includes(prefix)) {
            return 'Ooredoo';
        }

        // Orange Tunisie: 50-59
        if (['50', '51', '52', '53', '54', '55', '56', '57', '58', '59'].includes(prefix)) {
            return 'Orange Tunisie';
        }

        // Tunisie Telecom Mobile: 90-99
        if (['90', '91', '92', '93', '94', '95', '96', '97', '98', '99'].includes(prefix)) {
            return 'Tunisie Telecom';
        }

        // Tunisie Telecom Fixe: 71-79
        if (['71', '72', '73', '74', '75', '76', '77', '78', '79'].includes(prefix)) {
            return 'Tunisie Telecom';
        }

        return undefined;
    }

    // ============================================
    // DÉTECTION DE SPAM
    // ============================================

    /**
     * Détecter si un texte est du spam
     */
    async detectSpam(text: string, options: ValidationOptions = {}): Promise<SpamDetectionResult> {
        this.logger.debug(`Detecting spam in text: ${text.substring(0, 50)}...`);

        const result: SpamDetectionResult = {
            text,
            isSpam: false,
            score: 0,
            confidence: 0,
            reasons: [],
            categories: {
                promotionalSpam: false,
                phishing: false,
                maliciousLinks: false,
                excessiveCapitals: false,
                suspiciousPatterns: false,
            },
            metrics: {
                capitalsRatio: 0,
                linksCount: 0,
                suspiciousWordsCount: 0,
                urgencyScore: 0,
            },
        };

        let spamScore = 0;

        // 1. Vérifier le ratio de majuscules
        const capitalsRatio = this.calculateCapitalsRatio(text);
        result.metrics.capitalsRatio = capitalsRatio;

        if (capitalsRatio > 0.7) {
            spamScore += 40;
            result.reasons.push('Trop de majuscules');
            result.categories.excessiveCapitals = true;
        } else if (capitalsRatio > 0.5) {
            spamScore += 25;
            result.reasons.push('Majuscules excessives');
            result.categories.excessiveCapitals = true;
        }

        // 2. Compter les liens
        const linksCount = this.countLinks(text);
        result.metrics.linksCount = linksCount;

        if (linksCount > 3) {
            spamScore += 25;
            result.reasons.push('Trop de liens');
            result.categories.maliciousLinks = true;
        } else if (linksCount > 0) {
            spamScore += 10;
        }

        // 3. Mots suspects (spam)
        const suspiciousWordsCount = this.countSuspiciousWords(text);
        result.metrics.suspiciousWordsCount = suspiciousWordsCount;

        if (suspiciousWordsCount >= 5) {
            spamScore += 35;
            result.reasons.push('Nombreux mots suspects');
            result.categories.promotionalSpam = true;
        } else if (suspiciousWordsCount >= 3) {
            spamScore += 25;
            result.reasons.push('Mots suspects détectés');
            result.categories.promotionalSpam = true;
        } else if (suspiciousWordsCount >= 2) {
            spamScore += 15;
            result.categories.promotionalSpam = true;
        }

        // 4. Score d'urgence
        const urgencyScore = this.calculateUrgencyScore(text);
        result.metrics.urgencyScore = urgencyScore;

        if (urgencyScore > 70) {
            spamScore += 30;
            result.reasons.push('Langage très urgent/agressif');
        } else if (urgencyScore > 40) {
            spamScore += 20;
            result.reasons.push('Langage urgent');
        }

        // 5. Patterns de phishing
        if (this.detectPhishingPatterns(text)) {
            spamScore += 40;
            result.reasons.push('Patterns de phishing détectés');
            result.categories.phishing = true;
        }

        // 6. Patterns suspects
        if (this.detectSuspiciousPatterns(text)) {
            spamScore += 20;
            result.reasons.push('Patterns suspects');
            result.categories.suspiciousPatterns = true;
        }

        // 7. Score final
        result.score = Math.min(100, spamScore);
        result.confidence = Math.min(1, spamScore / 100);

        // Seuil de spam
        const spamThreshold = options.strictMode ? 50 : 70;
        result.isSpam = result.score >= spamThreshold;

        this.logger.debug(`Spam detection result: Score ${result.score}, IsSpam: ${result.isSpam}`);

        return result;
    }

    /**
     * Calculer le ratio de majuscules
     */
    private calculateCapitalsRatio(text: string): number {
        if (!text) return 0;

        const letters = text.replace(/[^a-zA-Z]/g, '');
        if (letters.length === 0) return 0;

        const capitals = text.replace(/[^A-Z]/g, '');
        return capitals.length / letters.length;
    }

    /**
     * Compter les liens dans le texte
     */
    private countLinks(text: string): number {
        const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-z0-9-]+\.(com|net|org|tn|fr)[^\s]*)/gi;
        const matches = text.match(urlRegex);
        return matches ? matches.length : 0;
    }

    /**
     * Compter les mots suspects
     */
    private countSuspiciousWords(text: string): number {
        const lowerText = text.toLowerCase();

        const suspiciousWords = [
            // Français
            'gratuit', 'gagner', 'urgent', 'cliquez', 'promotion', 'offre',
            'limité', 'maintenant', 'argent', 'rapide', 'garanti', 'bonus',
            'casino', 'viagra', 'crypto', 'bitcoin', 'investissement',

            // Anglais
            'free', 'win', 'click', 'offer', 'limited', 'now', 'money',
            'fast', 'guaranteed', 'bonus', 'prize', 'congratulations',

            // Arabe translitéré
            'rbe7', 'flous', 'sarih', 'blech',
        ];

        let count = 0;

        for (const word of suspiciousWords) {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = lowerText.match(regex);
            if (matches) {
                count += matches.length;
            }
        }

        return count;
    }

    /**
     * Calculer le score d'urgence
     */
    private calculateUrgencyScore(text: string): number {
        const lowerText = text.toLowerCase();
        let score = 0;

        const urgencyWords = [
            'urgent', 'maintenant', 'immédiat', 'rapide', 'vite',
            'dernier', 'expire', 'limité', 'aujourd\'hui', 'demain',
            'urgent', 'now', 'immediate', 'fast', 'quick', 'last', 'expires',
        ];

        for (const word of urgencyWords) {
            if (lowerText.includes(word)) {
                score += 15;
            }
        }

        // Points d'exclamation
        const exclamationCount = (text.match(/!/g) || []).length;
        score += exclamationCount * 10;

        return Math.min(100, score);
    }

    /**
     * Détecter les patterns de phishing
     */
    private detectPhishingPatterns(text: string): boolean {
        const lowerText = text.toLowerCase();

        const phishingPatterns = [
            'verify your account',
            'confirm your identity',
            'update your information',
            'suspended account',
            'unusual activity',
            'click here to',
            'vérifiez votre compte',
            'confirmez votre identité',
            'compte suspendu',
            'activité suspecte',
        ];

        return phishingPatterns.some(pattern => lowerText.includes(pattern));
    }

    /**
     * Détecter les patterns suspects
     */
    private detectSuspiciousPatterns(text: string): boolean {
        // Trop de chiffres (numéros de téléphone en masse)
        const digitsRatio = (text.match(/\d/g) || []).length / text.length;
        if (digitsRatio > 0.3) return true;

        // Trop de symboles
        const symbolsRatio = (text.match(/[!@#$%^&*()]/g) || []).length / text.length;
        if (symbolsRatio > 0.2) return true;

        // Répétitions excessives
        if (/(.)\1{4,}/.test(text)) return true;

        return false;
    }

    // ============================================
    // VALIDATION COMPLÈTE
    // ============================================

    /**
     * Validation complète (email + téléphone + spam)
     */
    async validateFull(
        email?: string,
        phone?: string,
        text?: string,
        options: ValidationOptions = {},
    ): Promise<FullValidationResult> {
        this.logger.log('Running full validation');

        const result: FullValidationResult = {
            globalScore: 0,
            isValid: true,
            recommendations: [],
            validatedAt: new Date(),
        };

        let totalScore = 0;
        let validationsCount = 0;

        // 1. Valider l'email
        if (email) {
            result.email = await this.validateEmail(email, options);
            totalScore += result.email.score;
            validationsCount++;

            if (!result.email.isValid) {
                result.isValid = false;
                result.recommendations.push(`Email: ${result.email.errors.join(', ')}`);
            }

            if (result.email.suggestions && result.email.suggestions.length > 0) {
                result.recommendations.push(`Email: Suggestion: ${result.email.suggestions[0]}`);
            }
        }

        // 2. Valider le téléphone
        if (phone) {
            result.phone = await this.validatePhone(phone, options.country || 'TN', options);
            totalScore += result.phone.score;
            validationsCount++;

            if (!result.phone.isValid) {
                result.isValid = false;
                result.recommendations.push(`Téléphone: ${result.phone.errors.join(', ')}`);
            }
        }

        // 3. Détecter le spam
        if (text && options.detectSpam !== false) {
            result.spam = await this.detectSpam(text, options);

            // Inverser le score spam (100 = pas de spam, 0 = spam total)
            const spamScore = 100 - result.spam.score;
            totalScore += spamScore;
            validationsCount++;

            if (result.spam.isSpam) {
                result.isValid = false;
                result.recommendations.push(`Spam détecté: ${result.spam.reasons.join(', ')}`);
            }
        }

        // 4. Calcul du score global
        result.globalScore = validationsCount > 0 ? Math.round(totalScore / validationsCount) : 0;

        // 5. Recommandations globales
        if (result.globalScore < 50) {
            result.recommendations.push('Score global faible: vérifier toutes les données');
        } else if (result.globalScore < 70) {
            result.recommendations.push('Score global moyen: améliorer la qualité des données');
        }

        this.logger.log(`Full validation completed: Score ${result.globalScore}, Valid: ${result.isValid}`);

        return result;
    }
}
