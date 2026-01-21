import { Injectable, Logger } from '@nestjs/common';
import { UnifiedValidationService } from '../../../shared/validation/unified-validation.service';

@Injectable()
export class ProspectingValidationService {
    private readonly logger = new Logger(ProspectingValidationService.name);

    constructor(private validationService: UnifiedValidationService) { }

    /**
     * Valider plusieurs emails en batch
     */
    async validateEmails(emails: string[]) {
        const results = await Promise.all(
            emails.map(async (email) => {
                const validation = await this.validationService.validateEmail(email);
                return {
                    email,
                    isValid: validation.isValid,
                    score: validation.score,
                    format: validation.format,
                    risk: validation.risk,
                    errors: validation.errors,
                    suggestions: validation.suggestions,
                };
            }),
        );

        return { results };
    }

    /**
     * Valider un email
     */
    async validateEmail(email: string) {
        return this.validationService.validateEmail(email);
    }

    /**
     * Valider un téléphone
     */
    async validatePhone(phone: string, country: string = 'TN') {
        return this.validationService.validatePhone(phone, country);
    }

    /**
     * Validation complète d'un lead
     */
    async validateLead(lead: any) {
        const results: any = {
            isValid: true,
            score: 100,
            errors: [],
            warnings: [],
        };

        // Valider email
        if (lead.email) {
            const emailValidation = await this.validationService.validateEmail(lead.email);
            results.email = emailValidation;
            if (!emailValidation.isValid) {
                results.isValid = false;
                results.score -= 20;
                results.errors.push(`Email invalide: ${emailValidation.errors.join(', ')}`);
            } else if (emailValidation.format.isDisposable) {
                results.score -= 10;
                results.warnings.push('Email jetable détecté');
            }
        }

        // Valider téléphone
        if (lead.phone) {
            const phoneValidation = await this.validationService.validatePhone(
                lead.phone,
                lead.country || 'TN',
            );
            results.phone = phoneValidation;
            if (!phoneValidation.isValid) {
                results.score -= 15;
                results.warnings.push('Téléphone invalide');
            }
        } else {
            results.warnings.push('Téléphone manquant');
            results.score -= 10;
        }

        // Vérifier nom complet
        if (!lead.firstName || !lead.lastName) {
            results.warnings.push('Nom ou prénom manquant');
            results.score -= 10;
        }

        // Vérifier budget
        if (!lead.budget && !lead.budgetMin && !lead.budgetMax) {
            results.warnings.push('Budget non défini');
            results.score -= 15;
        }

        // Vérifier ville
        if (!lead.city) {
            results.warnings.push('Ville non définie');
            results.score -= 10;
        }

        // Spam check sur nom/texte
        if (lead.rawText) {
            const spamCheck = await this.validationService.detectSpam(lead.rawText);
            if (spamCheck.isSpam) {
                results.isValid = false;
                results.score -= 30;
                results.errors.push('Contenu suspect détecté (spam)');
            }
        }

        results.score = Math.max(0, results.score);
        results.isValid = results.score >= 50;

        return results;
    }

    /**
     * Validation complète avec email, phone et spam
     */
    async validateFull(data: { email?: string; phone?: string; text?: string; country?: string }) {
        return this.validationService.validateFull(
            data.email,
            data.phone,
            data.text,
            { country: data.country }
        );
    }

    /**
     * Détecter le spam dans un texte
     */
    async detectSpam(text: string) {
        return this.validationService.detectSpam(text);
    }

    /**
     * Vérifier si un budget est compatible avec un prix
     */
    isBudgetCompatible(budget: any, price: number): boolean {
        if (!budget || !price) return false;

        const budgetValue = typeof budget === 'object' ? budget.max || budget.min || 0 : budget;

        if (budgetValue <= 0) return false;

        const diff = Math.abs((budgetValue - price) / budgetValue);
        return diff < 0.2; // ±20% tolerance
    }

    /**
     * Obtenir les suggestions pour corriger un email
     */
    async getEmailSuggestions(email: string) {
        const validation = await this.validationService.validateEmail(email);
        return validation.suggestions || [];
    }

    /**
     * Obtenir les locations disponibles
     */
    async getLocations(country?: string) {
        return {
            cities: ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Ariana', 'Nabeul', 'Ben Arous'],
            delegations: ['Tunis Ville', 'La Marsa', 'Carthage', 'Ariana', 'Sidi Bou Said'],
            communes: ['El Menzah', 'Lac 1', 'Lac 2', 'Ennasr', 'Manar', 'Mutuelleville'],
        };
    }
}
