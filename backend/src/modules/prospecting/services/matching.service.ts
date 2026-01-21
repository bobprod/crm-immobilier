import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import {
    MatchReason,
    MatchScoreResult,
    PriceRange,
    BudgetMatchReason,
    LocationMatchReason,
    TypeMatchReason,
    MetaMatchReason,
    arePropertyTypesCompatible,
} from '../dto/matching.dto';

@Injectable()
export class MatchingService {
    private readonly logger = new Logger(MatchingService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Trouver des matchs pour un lead avec scoring intelligent
     * Utilise les nouveaux champs IA: budgetMin/Max, city, propertyTypes, urgency, seriousnessScore
     */
    async findMatchesForLead(userId: string, leadId: string) {
        const lead = await this.getLeadById(userId, leadId);
        this.logger.log(
            `Finding matches for lead ${leadId} - City: ${lead.city}, Budget: ${lead.budgetMin}-${lead.budgetMax}`,
        );

        // 1. Déterminer l'intervalle de prix pour le filtre SQL (large pour ne pas rater de biens)
        const priceRange = this.getPriceRangeForSearch(lead);

        // 2. Construire le filtre de base
        const where: any = {
            userId,
            status: 'available',
        };

        // Filtre sur le prix si on a un budget
        if (priceRange.min !== null && priceRange.max !== null) {
            where.price = {
                gte: priceRange.min,
                lte: priceRange.max,
            };
        }

        // 3. Pré-filtrer les biens candidats
        const properties = await this.prisma.properties.findMany({
            where,
            take: 200, // Limite pour éviter surcharge
            orderBy: { createdAt: 'desc' },
        });

        this.logger.log(`Found ${properties.length} candidate properties for matching`);

        // 4. Calculer le score pour chaque bien et créer les matchs
        const matches = [];
        let matchesCreated = 0;

        for (const property of properties) {
            const matchResult = this.calculateMatchScore(lead, property);

            // Créer le match si score >= 50
            if (matchResult.isQualified) {
                try {
                    const match = await this.prisma.prospecting_matches.create({
                        data: {
                            leadId: lead.id,
                            propertyId: property.id,
                            score: matchResult.score,
                            reason: matchResult.reasons as any,
                            status: 'pending',
                        },
                        include: {
                            properties: true,
                        },
                    });

                    matches.push(match);
                    matchesCreated++;
                } catch (error) {
                    // Skip si le match existe déjà (contrainte unique)
                    if (error.code !== 'P2002') {
                        this.logger.warn(`Failed to create match: ${error.message}`);
                    }
                }
            }
        }

        // 5. Mettre à jour le lead avec les IDs des propriétés matchées
        if (matches.length > 0) {
            await this.prisma.prospecting_leads.update({
                where: { id: leadId },
                data: {
                    matchedPropertyIds: matches.map((m) => m.propertyId),
                },
            });
        }

        this.logger.log(`Created ${matchesCreated} matches for lead ${leadId}`);

        return {
            leadId: lead.id,
            matchesCreated,
            matches,
        };
    }

    /**
     * Récupérer les matchs d'un lead
     */
    async getLeadMatches(userId: string, leadId: string) {
        await this.getLeadById(userId, leadId);

        return this.prisma.prospecting_matches.findMany({
            where: { leadId },
            include: {
                properties: true,
                prospects: true,
            },
            orderBy: { score: 'desc' },
        });
    }

    /**
     * Mettre à jour le statut d'un match
     */
    async updateMatchStatus(userId: string, matchId: string, status: string) {
        const match = await this.prisma.prospecting_matches.findUnique({
            where: { id: matchId },
            include: {
                prospects: true,
            },
        });

        if (!match) {
            throw new NotFoundException('Match non trouvé');
        }

        // Vérifier que le lead appartient bien à l'utilisateur
        if (match.prospects?.userId !== userId) {
            throw new NotFoundException('Match non trouvé');
        }

        return this.prisma.prospecting_matches.update({
            where: { id: matchId },
            data: { status },
        });
    }

    /**
     * Notifier un match
     */
    async notifyMatch(userId: string, matchId: string) {
        const match = await this.prisma.prospecting_matches.findUnique({
            where: { id: matchId },
            include: {
                properties: true,
                prospects: true,
            },
        });

        if (!match) {
            throw new NotFoundException('Match non trouvé');
        }

        await this.prisma.prospecting_matches.update({
            where: { id: matchId },
            data: {
                status: 'notified',
                notifiedAt: new Date(),
            },
        });

        return { success: true, message: 'Notification envoyée' };
    }

    /**
     * Obtenir les opportunités de matching
     */
    async getOpportunities(userId: string, filters?: any) {
        const where: any = {
            userId,
            matchedPropertyIds: { isEmpty: false },
        };

        if (filters?.minScore) {
            where.score = { gte: parseInt(filters.minScore) };
        }

        return this.prisma.prospecting_leads.findMany({
            where,
            orderBy: { score: 'desc' },
            take: filters?.limit ? parseInt(filters.limit) : 20,
        });
    }

    // ============================================
    // SCORING LOGIC
    // ============================================

    /**
     * Calculer l'intervalle de prix pour le filtre SQL (élargi pour ne pas rater de biens)
     * Retourne un intervalle large (±30%) pour le pré-filtrage
     */
    getPriceRangeForSearch(lead: any): PriceRange {
        const budgetMin = lead.budgetMin as number | null;
        const budgetMax = lead.budgetMax as number | null;

        // Si les deux sont définis
        if (budgetMin != null && budgetMax != null) {
            return {
                min: Math.round(budgetMin * 0.7),
                max: Math.round(budgetMax * 1.3),
            };
        }

        // Si seulement budgetMin
        if (budgetMin != null) {
            return {
                min: Math.round(budgetMin * 0.7),
                max: Math.round(budgetMin * 1.5), // Plus large vers le haut
            };
        }

        // Si seulement budgetMax
        if (budgetMax != null) {
            return {
                min: Math.round(budgetMax * 0.5), // Plus large vers le bas
                max: Math.round(budgetMax * 1.3),
            };
        }

        // Fallback sur l'ancien champ budget (JSON)
        if (lead.budget) {
            const budgetObj = lead.budget as any;
            const min = budgetObj.min || budgetObj.max;
            const max = budgetObj.max || budgetObj.min;
            if (min || max) {
                return {
                    min: min ? Math.round(min * 0.7) : null,
                    max: max ? Math.round(max * 1.3) : null,
                };
            }
        }

        // Pas de budget défini
        return { min: null, max: null };
    }

    /**
     * Calculer le score de match entre un lead et une propriété
     * Scoring pondéré: Budget (40) + Location (30) + Type (20) + Bonus (10) = 100 max
     */
    calculateMatchScore(lead: any, property: any): MatchScoreResult {
        // 1. Score Budget (0-40 points)
        const budgetResult = this.calculateBudgetScore(lead, property);

        // 2. Score Location (0-30 points)
        const locationResult = this.calculateLocationScore(lead, property);

        // 3. Score Type de bien (0-20 points)
        const typeResult = this.calculateTypeScore(lead, property);

        // 4. Bonus Urgence/Sérieux (0-10 points)
        const metaResult = this.calculateMetaBonus(lead);

        // Score total
        const totalScore =
            budgetResult.score + locationResult.score + typeResult.score + metaResult.totalBonus;
        const finalScore = Math.min(100, totalScore);

        const reasons: MatchReason = {
            budget: budgetResult,
            location: locationResult,
            type: typeResult,
            meta: metaResult,
            breakdown: {
                budgetPoints: budgetResult.score,
                locationPoints: locationResult.score,
                typePoints: typeResult.score,
                bonusPoints: metaResult.totalBonus,
            },
        };

        return {
            score: finalScore,
            reasons,
            isQualified: finalScore >= 50,
        };
    }

    /**
     * Calculer le score Budget (0-40 points)
     */
    private calculateBudgetScore(lead: any, property: any): BudgetMatchReason {
        const propertyPrice = property.price as number;
        const leadMin = (lead.budgetMin as number | null) ?? (lead.budget as any)?.min ?? null;
        const leadMax = (lead.budgetMax as number | null) ?? (lead.budget as any)?.max ?? null;

        // Si pas de prix sur la propriété
        if (!propertyPrice || propertyPrice <= 0) {
            return {
                compatible: false,
                relation: 'no_budget',
                leadMin,
                leadMax,
                propertyPrice: propertyPrice || 0,
                score: 0,
            };
        }

        // Si le lead n'a pas de budget
        if (leadMin === null && leadMax === null) {
            return {
                compatible: false,
                relation: 'no_budget',
                leadMin: null,
                leadMax: null,
                propertyPrice,
                score: 0,
            };
        }

        // Cas: les deux bornes sont définies
        if (leadMin !== null && leadMax !== null) {
            // Dans la fourchette exacte: 40 points
            if (propertyPrice >= leadMin && propertyPrice <= leadMax) {
                return {
                    compatible: true,
                    relation: 'within_range',
                    leadMin,
                    leadMax,
                    propertyPrice,
                    score: 40,
                };
            }
            // Dans ±10% de la fourchette: 30 points
            if (propertyPrice >= leadMin * 0.9 && propertyPrice <= leadMax * 1.1) {
                return {
                    compatible: true,
                    relation: propertyPrice < leadMin ? 'below_range' : 'above_range',
                    leadMin,
                    leadMax,
                    propertyPrice,
                    score: 30,
                };
            }
            // Dans ±20% de la fourchette: 20 points
            if (propertyPrice >= leadMin * 0.8 && propertyPrice <= leadMax * 1.2) {
                return {
                    compatible: true,
                    relation: propertyPrice < leadMin ? 'below_range' : 'above_range',
                    leadMin,
                    leadMax,
                    propertyPrice,
                    score: 20,
                };
            }
            // Hors budget
            return {
                compatible: false,
                relation: propertyPrice < leadMin ? 'below_range' : 'above_range',
                leadMin,
                leadMax,
                propertyPrice,
                score: 0,
            };
        }

        // Cas: seulement une borne (min OU max)
        const singleBudget = leadMin ?? leadMax!;
        const tolerance20 = singleBudget * 0.2;
        const tolerance10 = singleBudget * 0.1;

        if (Math.abs(propertyPrice - singleBudget) <= tolerance10) {
            return {
                compatible: true,
                relation: 'within_range',
                leadMin,
                leadMax,
                propertyPrice,
                score: 40,
            };
        }
        if (Math.abs(propertyPrice - singleBudget) <= tolerance20) {
            return {
                compatible: true,
                relation: propertyPrice < singleBudget ? 'below_range' : 'above_range',
                leadMin,
                leadMax,
                propertyPrice,
                score: 30,
            };
        }
        if (Math.abs(propertyPrice - singleBudget) <= singleBudget * 0.3) {
            return {
                compatible: true,
                relation: propertyPrice < singleBudget ? 'below_range' : 'above_range',
                leadMin,
                leadMax,
                propertyPrice,
                score: 20,
            };
        }

        return {
            compatible: false,
            relation: propertyPrice < singleBudget ? 'below_range' : 'above_range',
            leadMin,
            leadMax,
            propertyPrice,
            score: 0,
        };
    }

    /**
     * Calculer le score Location (0-30 points)
     */
    private calculateLocationScore(lead: any, property: any): LocationMatchReason {
        const leadCity = (lead.city as string | null)?.toLowerCase().trim() ?? null;
        const leadCountry = (lead.country as string | null)?.toLowerCase().trim() ?? 'tunisie';
        const propertyCity = (property.city as string | null)?.toLowerCase().trim() ?? null;

        // Pas de ville sur le lead ou la propriété
        if (!leadCity || !propertyCity) {
            return {
                compatible: false,
                relation: 'unknown',
                leadCity: lead.city ?? null,
                leadCountry: lead.country ?? null,
                propertyCity: property.city ?? null,
                score: 0,
            };
        }

        // Même ville: 30 points
        if (leadCity === propertyCity) {
            return {
                compatible: true,
                relation: 'same_city',
                leadCity: lead.city,
                leadCountry: lead.country,
                propertyCity: property.city,
                score: 30,
            };
        }

        // Check si ville contenue dans l'autre (ex: "La Marsa" contient "Marsa")
        if (leadCity.includes(propertyCity) || propertyCity.includes(leadCity)) {
            return {
                compatible: true,
                relation: 'same_city',
                leadCity: lead.city,
                leadCountry: lead.country,
                propertyCity: property.city,
                score: 25,
            };
        }

        // Même pays (Tunisie par défaut): 15 points
        // Note: properties n'a pas de champ country, on assume Tunisie
        if (leadCountry === 'tunisie') {
            return {
                compatible: true,
                relation: 'same_country',
                leadCity: lead.city,
                leadCountry: lead.country,
                propertyCity: property.city,
                score: 15,
            };
        }

        // Pays différent
        return {
            compatible: false,
            relation: 'different',
            leadCity: lead.city,
            leadCountry: lead.country,
            propertyCity: property.city,
            score: 0,
        };
    }

    /**
     * Calculer le score Type de bien (0-20 points)
     */
    private calculateTypeScore(lead: any, property: any): TypeMatchReason {
        const propertyType = (property.type as string)?.toLowerCase().trim() ?? '';

        // Récupérer les types du lead (nouveau champ propertyTypes ou ancien propertyType)
        let leadTypes: string[] = [];

        if (lead.propertyTypes && Array.isArray(lead.propertyTypes)) {
            leadTypes = (lead.propertyTypes as string[]).map((t) => t.toLowerCase().trim());
        } else if (lead.propertyType) {
            leadTypes = [(lead.propertyType as string).toLowerCase().trim()];
        }

        // Pas de type défini sur le lead: 10 points (type inconnu, pas bloquant)
        if (leadTypes.length === 0) {
            return {
                compatible: true,
                relation: 'unknown',
                leadTypes: [],
                propertyType: property.type ?? '',
                score: 10,
            };
        }

        // Pas de type sur la propriété
        if (!propertyType) {
            return {
                compatible: false,
                relation: 'mismatch',
                leadTypes,
                propertyType: '',
                score: 0,
            };
        }

        // Match exact: 20 points
        if (leadTypes.includes(propertyType)) {
            return {
                compatible: true,
                relation: 'exact',
                leadTypes,
                propertyType: property.type,
                score: 20,
            };
        }

        // Match compatible (ex: appartement ↔ studio): 15 points
        for (const leadType of leadTypes) {
            if (arePropertyTypesCompatible(leadType, propertyType)) {
                return {
                    compatible: true,
                    relation: 'compatible',
                    leadTypes,
                    propertyType: property.type,
                    score: 15,
                };
            }
        }

        // Pas de match
        return {
            compatible: false,
            relation: 'mismatch',
            leadTypes,
            propertyType: property.type,
            score: 0,
        };
    }

    /**
     * Calculer le bonus Urgence/Sérieux (0-10 points max)
     */
    private calculateMetaBonus(lead: any): MetaMatchReason {
        const urgency = lead.urgency as string | null;
        const seriousnessScore = lead.seriousnessScore as number | null;

        let urgencyBonus = 0;
        let seriousnessBonus = 0;

        // Bonus urgence
        if (urgency === 'haute') {
            urgencyBonus = 5;
        } else if (urgency === 'moyenne') {
            urgencyBonus = 3;
        }

        // Bonus sérieux
        if (seriousnessScore !== null) {
            if (seriousnessScore >= 80) {
                seriousnessBonus = 5;
            } else if (seriousnessScore >= 60) {
                seriousnessBonus = 3;
            }
        }

        // Cap total à 10 points
        const totalBonus = Math.min(10, urgencyBonus + seriousnessBonus);

        return {
            urgency,
            urgencyBonus,
            seriousnessScore,
            seriousnessBonus,
            totalBonus,
        };
    }

    // ============================================
    // PRIVATE HELPER METHODS
    // ============================================

    private async getLeadById(userId: string, leadId: string) {
        const lead = await this.prisma.prospecting_leads.findFirst({
            where: { id: leadId, userId },
        });

        if (!lead) {
            throw new NotFoundException('Lead non trouvé');
        }

        return lead;
    }
}
