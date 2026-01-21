/**
 * Service de qualification automatique des leads
 * Améliore le processus entre prospection et conversion en lead qualifié
 */

import { ProspectingLead } from '@/shared/utils/prospecting-api';

export interface QualificationScore {
    overall: number;
    email: number;
    phone: number;
    name: number;
    engagement: number;
    dataCompleteness: number;
}

export interface QualificationResult {
    leadId: string;
    score: QualificationScore;
    status: 'qualified' | 'needs-review' | 'rejected';
    issues: string[];
    recommendations: string[];
    autoActions: string[];
}

// Patterns de détection de spam améliorés
const SPAM_PATTERNS = {
    email: [
        { pattern: /^test\d*@/i, severity: 'high', reason: 'Email de test' },
        { pattern: /^fake\d*@/i, severity: 'high', reason: 'Email fake' },
        { pattern: /^spam\d*@/i, severity: 'high', reason: 'Email spam' },
        { pattern: /^demo\d*@/i, severity: 'high', reason: 'Email de démo' },
        { pattern: /^sample\d*@/i, severity: 'high', reason: 'Email d\'exemple' },
        { pattern: /\d{8,}@/, severity: 'medium', reason: 'Trop de chiffres dans email' },
        { pattern: /@(example\.com|example\.org|example\.net|test\.com|test\.fr|sample\.com|demo\.com|localhost|invalid\.com)/i, severity: 'high', reason: 'Domaine de test/exemple' },
        { pattern: /@(mailinator|guerrillamail|tempmail|throwaway|trashmail|yopmail|10minutemail|maildrop|guerrillamailblock)/i, severity: 'high', reason: 'Email temporaire' },
        { pattern: /^[a-z]{1,2}\d+@/, severity: 'medium', reason: 'Email généré automatiquement' },
        { pattern: /^(info|contact|admin|support|noreply|no-reply)@/i, severity: 'low', reason: 'Email générique' },
    ],
    name: [
        { pattern: /^(test|fake|spam|xxx|asdf|qwerty)/i, severity: 'high', reason: 'Nom suspect' },
        { pattern: /\d{4,}/, severity: 'high', reason: 'Trop de chiffres dans nom' },
        { pattern: /^[a-z]{1,2}$/i, severity: 'high', reason: 'Nom trop court' },
        { pattern: /^(mr|mme|monsieur|madame|m|mlle)$/i, severity: 'medium', reason: 'Nom incomplet' },
        { pattern: /^[^a-zA-ZÀ-ÿ\s-]+$/, severity: 'medium', reason: 'Caractères invalides' },
    ],
    phone: [
        { pattern: /^0{6,}/, severity: 'high', reason: 'Téléphone invalide (tous zéros)' },
        { pattern: /^1{6,}/, severity: 'high', reason: 'Téléphone invalide (répétition)' },
        { pattern: /^(\d)\1{6,}/, severity: 'high', reason: 'Téléphone invalide (chiffre répété)' },
        { pattern: /^1234567/, severity: 'high', reason: 'Téléphone de test' },
    ],
};

// Domaines d'email professionnels fiables
const TRUSTED_DOMAINS = [
    'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com',
    'orange.fr', 'free.fr', 'laposte.net', 'wanadoo.fr', 'sfr.fr',
    'yahoo.fr', 'live.com', 'msn.com',
];

// Domaines invalides ou suspects
const INVALID_DOMAINS = [
    'example.com', 'example.org', 'example.net',
    'test.com', 'test.fr', 'test.net',
    'sample.com', 'demo.com', 'localhost',
    'invalid.com', 'domain.com', 'email.com',
    'mail.com', 'web.com', 'internet.com'
];

// Validation RFC 5322 plus stricte
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Validation téléphone internationale améliorée
const PHONE_PATTERNS = {
    tunisian: /^(?:\+216|00216|216)?[2-9]\d{7}$/,  // Format tunisien
    french: /^(?:\+33|0033|0)[1-9](?:\d{2}){4}$/,  // Format français
    international: /^\+?[1-9]\d{1,14}$/,  // Format E.164
    algerian: /^(?:\+213|00213|213)?[5-7]\d{8}$/,  // Format algérien
    moroccan: /^(?:\+212|00212|212)?[5-7]\d{8}$/,  // Format marocain
};

export class LeadQualificationService {
    /**
     * Qualifie un lead de manière automatique et intelligente
     */
    static async qualifyLead(lead: ProspectingLead): Promise<QualificationResult> {
        const issues: string[] = [];
        const recommendations: string[] = [];
        const autoActions: string[] = [];

        // Calcul des scores individuels
        const emailScore = this.calculateEmailScore(lead, issues, recommendations);
        const phoneScore = this.calculatePhoneScore(lead, issues, recommendations);
        const nameScore = this.calculateNameScore(lead, issues, recommendations);
        const engagementScore = this.calculateEngagementScore(lead);
        const completenessScore = this.calculateCompletenessScore(lead, issues, recommendations);

        // Score global pondéré
        const overall = Math.round(
            emailScore * 0.30 +
            phoneScore * 0.25 +
            nameScore * 0.20 +
            engagementScore * 0.15 +
            completenessScore * 0.10
        );

        // Détermination du statut
        let status: 'qualified' | 'needs-review' | 'rejected';

        if (overall >= 75 && issues.filter(i => i.includes('CRITIQUE')).length === 0) {
            status = 'qualified';
            autoActions.push('✅ Lead qualifié automatiquement');
            autoActions.push('📧 Prêt pour contact commercial');
            recommendations.push('🎯 Priorité HAUTE - Contacter rapidement');
        } else if (overall >= 50) {
            status = 'needs-review';
            autoActions.push('⚠️ Nécessite validation manuelle');
            recommendations.push('🔍 Vérifier les informations suspectes');
            recommendations.push('📞 Confirmer les coordonnées avant contact');
        } else {
            status = 'rejected';
            autoActions.push('🚫 Lead rejeté - qualité insuffisante');
            recommendations.push('🗑️ Peut être supprimé ou archivé');
        }

        return {
            leadId: lead.id,
            score: {
                overall,
                email: emailScore,
                phone: phoneScore,
                name: nameScore,
                engagement: engagementScore,
                dataCompleteness: completenessScore,
            },
            status,
            issues,
            recommendations,
            autoActions,
        };
    }

    /**
     * Calcule le score de qualité de l'email
     */
    private static calculateEmailScore(
        lead: ProspectingLead,
        issues: string[],
        recommendations: string[]
    ): number {
        if (!lead.email) {
            issues.push('❌ CRITIQUE: Email manquant');
            recommendations.push('📧 Ajouter une adresse email valide');
            return 0;
        }

        let score = 100;

        // Validation syntaxe stricte RFC 5322
        if (!EMAIL_REGEX.test(lead.email)) {
            issues.push('❌ CRITIQUE: Format email invalide (syntaxe)');
            recommendations.push('📧 Corriger le format de l\'email selon RFC 5322');
            return 0;
        }

        // Vérification domaine invalide/test
        const domain = lead.email.split('@')[1]?.toLowerCase();
        if (domain && INVALID_DOMAINS.includes(domain)) {
            issues.push('❌ CRITIQUE: Domaine de test ou invalide');
            recommendations.push('🚫 Remplacer par un email réel');
            return 0; // Score 0 pour domaines de test
        }

        // Vérification TLD (extension) valide
        const tldMatch = domain?.match(/\.([a-z]{2,})$/i);
        const tld = tldMatch ? tldMatch[1].toLowerCase() : '';
        const validTlds = ['com', 'fr', 'net', 'org', 'tn', 'dz', 'ma', 'eu', 'de', 'uk', 'it', 'es', 'ca', 'info', 'biz'];
        if (tld && !validTlds.includes(tld)) {
            issues.push('⚠️ Extension de domaine peu commune: .' + tld);
            score -= 20;
            recommendations.push('🔍 Vérifier la validité du domaine');
        }

        // Vérification de caractères suspects dans l'email
        if (/[.]{2,}|[@]{2,}/.test(lead.email)) {
            issues.push('❌ Caractères consécutifs suspects (.. ou @@)');
            score -= 30;
        }

        // Vérification longueur raisonnable
        if (lead.email.length > 254) {
            issues.push('❌ Email trop long (max 254 caractères)');
            return 0;
        }

        // Détection de spam
        for (const { pattern, severity, reason } of SPAM_PATTERNS.email) {
            if (pattern.test(lead.email)) {
                if (severity === 'high') {
                    issues.push(`⛔ SPAM: ${reason}`);
                    score -= 50;
                } else if (severity === 'medium') {
                    issues.push(`⚠️ Suspect: ${reason}`);
                    score -= 25;
                } else {
                    issues.push(`ℹ️ Attention: ${reason}`);
                    score -= 10;
                }
            }
        }

        // Analyse du domaine pour déterminer s'il est professionnel
        const domainParts = domain?.split('.');
        if (domainParts && domainParts.length < 2) {
            issues.push('❌ Domaine incomplet');
            score -= 30;
        }

        // Bonus pour domaines professionnels
        if (domain && !['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'].includes(domain)) {
            // Potentiellement un email professionnel
            score += 10;
            recommendations.push('💼 Email professionnel détecté - prospect qualifié');
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calcule le score de qualité du téléphone
     */
    private static calculatePhoneScore(
        lead: ProspectingLead,
        issues: string[],
        recommendations: string[]
    ): number {
        if (!lead.phone) {
            issues.push('⚠️ Téléphone manquant');
            recommendations.push('📱 Ajouter un numéro de téléphone');
            return 40; // Pas critique mais important
        }

        let score = 100;

        // Nettoyage et normalisation
        const phoneClean = lead.phone.replace(/[\s\-\(\)\.]/g, '');

        // Validation longueur
        if (phoneClean.length < 8) {
            issues.push('❌ CRITIQUE: Téléphone trop court (min 8 chiffres)');
            score -= 50;
        } else if (phoneClean.length > 15) {
            issues.push('❌ Téléphone trop long (max 15 chiffres)');
            score -= 40;
        }

        // Validation caractères uniquement numériques (+ autorisé au début)
        if (!/^\+?\d+$/.test(phoneClean)) {
            issues.push('❌ CRITIQUE: Caractères non numériques dans le téléphone');
            score -= 50;
        }

        // Détection de spam
        for (const { pattern, severity, reason } of SPAM_PATTERNS.phone) {
            if (pattern.test(phoneClean)) {
                if (severity === 'high') {
                    issues.push(`⛔ SPAM: ${reason}`);
                    score -= 60;
                }
            }
        }

        // Validation formats reconnus avec bonus
        let formatRecognized = false;
        if (PHONE_PATTERNS.tunisian.test(phoneClean)) {
            score += 15;
            formatRecognized = true;
            recommendations.push('🇹🇳 Numéro tunisien validé - prospect local prioritaire');
        } else if (PHONE_PATTERNS.french.test(phoneClean)) {
            score += 15;
            formatRecognized = true;
            recommendations.push('🇫🇷 Numéro français validé');
        } else if (PHONE_PATTERNS.algerian.test(phoneClean)) {
            score += 12;
            formatRecognized = true;
            recommendations.push('🇩🇿 Numéro algérien validé - prospect Maghreb');
        } else if (PHONE_PATTERNS.moroccan.test(phoneClean)) {
            score += 12;
            formatRecognized = true;
            recommendations.push('🇲🇦 Numéro marocain validé - prospect Maghreb');
        } else if (PHONE_PATTERNS.international.test(phoneClean)) {
            score += 5;
            formatRecognized = true;
            recommendations.push('🌍 Numéro international reconnu');
        }

        if (!formatRecognized && phoneClean.length >= 8) {
            issues.push('⚠️ Format de téléphone non standard');
            score -= 15;
            recommendations.push('📱 Vérifier et normaliser le format du téléphone');
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calcule le score de qualité du nom
     */
    private static calculateNameScore(
        lead: ProspectingLead,
        issues: string[],
        recommendations: string[]
    ): number {
        const hasFirstName = lead.firstName && lead.firstName.trim().length > 1;
        const hasLastName = lead.lastName && lead.lastName.trim().length > 1;

        if (!hasFirstName && !hasLastName) {
            issues.push('❌ CRITIQUE: Nom complet manquant');
            recommendations.push('👤 Ajouter prénom et nom');
            return 0;
        }

        let score = 100;

        if (!hasFirstName || !hasLastName) {
            issues.push('⚠️ Nom incomplet');
            recommendations.push('👤 Compléter le nom');
            score -= 30;
        }

        // Détection de spam sur les noms
        const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
        for (const { pattern, severity, reason } of SPAM_PATTERNS.name) {
            if (pattern.test(fullName)) {
                if (severity === 'high') {
                    issues.push(`⛔ SPAM: ${reason}`);
                    score -= 50;
                } else if (severity === 'medium') {
                    issues.push(`⚠️ Suspect: ${reason}`);
                    score -= 25;
                }
            }
        }

        // Validation longueur raisonnable
        if (fullName.length < 4) {
            issues.push('⚠️ Nom trop court');
            score -= 20;
        }

        if (fullName.length > 50) {
            issues.push('ℹ️ Nom très long (potentiel spam)');
            score -= 10;
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calcule le score d'engagement (basé sur l'activité)
     */
    private static calculateEngagementScore(lead: ProspectingLead): number {
        let score = 50; // Score de base

        // Bonus pour score existant
        if (lead.score && lead.score > 0) {
            score += Math.min(30, lead.score / 3);
        }

        // Bonus pour notes
        if (lead.qualificationNotes && lead.qualificationNotes.length > 10) {
            score += 10;
        }

        // Bonus si déjà qualifié manuellement
        if (lead.qualified) {
            score += 20;
        }

        return Math.min(100, score);
    }

    /**
     * Calcule le score de complétude des données
     */
    private static calculateCompletenessScore(
        lead: ProspectingLead,
        issues: string[],
        recommendations: string[]
    ): number {
        const fields = {
            email: !!lead.email,
            phone: !!lead.phone,
            firstName: !!lead.firstName,
            lastName: !!lead.lastName,
            company: !!lead.company,
            address: !!lead.address,
            city: !!lead.city,
            notes: !!lead.qualificationNotes,
        };

        const filled = Object.values(fields).filter(Boolean).length;
        const total = Object.keys(fields).length;
        const score = Math.round((filled / total) * 100);

        if (score < 50) {
            issues.push('⚠️ Données incomplètes');
            recommendations.push('📝 Enrichir les informations du lead');
        }

        if (!fields.company) {
            recommendations.push('🏢 Ajouter le nom de l\'entreprise');
        }

        if (!fields.city) {
            recommendations.push('📍 Ajouter la ville');
        }

        return score;
    }

    /**
     * Qualifie un lot de leads en parallèle
     */
    static async qualifyLeadsBatch(leads: ProspectingLead[]): Promise<QualificationResult[]> {
        const results = await Promise.all(
            leads.map(lead => this.qualifyLead(lead))
        );
        return results;
    }

    /**
     * Retourne des statistiques de qualification
     */
    static getQualificationStats(results: QualificationResult[]) {
        const qualified = results.filter(r => r.status === 'qualified').length;
        const needsReview = results.filter(r => r.status === 'needs-review').length;
        const rejected = results.filter(r => r.status === 'rejected').length;

        const avgScore = results.reduce((sum, r) => sum + r.score.overall, 0) / results.length;

        return {
            total: results.length,
            qualified,
            needsReview,
            rejected,
            qualifiedRate: (qualified / results.length) * 100,
            avgScore: Math.round(avgScore),
        };
    }
}
