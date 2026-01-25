import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { CreateCampaignDto } from '../dto';

interface CampaignFilters {
    status?: string;
    type?: string;
}

@Injectable()
export class CampaignService {
    private readonly logger = new Logger(CampaignService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Créer une campagne de prospection
     */
    async createCampaign(userId: string, data: CreateCampaignDto) {
        this.logger.log(`Creating prospecting campaign for user ${userId}`);

        return this.prisma.prospecting_campaigns.create({
            data: {
                userId,
                name: data.name,
                description: data.description,
                type: data.type || 'geographic',
                config: data.config || {},
                targetCount: data.targetCount,
            },
        });
    }

    /**
     * Récupérer toutes les campagnes
     */
    async getCampaigns(userId: string, filters?: CampaignFilters) {
        const where: Record<string, unknown> = { userId };

        if (filters?.status) where.status = filters.status;
        if (filters?.type) where.type = filters.type;

        return this.prisma.prospecting_campaigns.findMany({
            where,
            include: {
                _count: {
                    select: { leads: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Récupérer une campagne par ID
     */
    async getCampaignById(userId: string, campaignId: string) {
        const campaign = await this.prisma.prospecting_campaigns.findFirst({
            where: { id: campaignId, userId },
            include: {
                leads: {
                    take: 10,
                    orderBy: { score: 'desc' },
                },
                _count: {
                    select: { leads: true },
                },
            },
        });

        if (!campaign) {
            throw new NotFoundException('Campagne non trouvée');
        }

        return campaign;
    }

    /**
     * Mettre à jour une campagne
     */
    async updateCampaign(userId: string, campaignId: string, data: any) {
        await this.getCampaignById(userId, campaignId);

        return this.prisma.prospecting_campaigns.update({
            where: { id: campaignId },
            data,
        });
    }

    /**
     * Démarrer une campagne
     */
    async startCampaign(userId: string, campaignId: string) {
        const campaign = await this.getCampaignById(userId, campaignId);

        if (campaign.status !== 'draft' && campaign.status !== 'paused') {
            throw new BadRequestException('Cette campagne ne peut pas être démarrée');
        }

        return this.prisma.prospecting_campaigns.update({
            where: { id: campaignId },
            data: {
                status: 'active',
                startedAt: new Date(),
            },
        });
    }

    /**
     * Mettre en pause une campagne
     */
    async pauseCampaign(userId: string, campaignId: string) {
        await this.getCampaignById(userId, campaignId);

        return this.prisma.prospecting_campaigns.update({
            where: { id: campaignId },
            data: { status: 'paused' },
        });
    }

    /**
     * Reprendre une campagne en pause
     */
    async resumeCampaign(userId: string, campaignId: string) {
        const campaign = await this.getCampaignById(userId, campaignId);

        if (campaign.status !== 'paused') {
            throw new BadRequestException(
                "Cette campagne n'est pas en pause. Status actuel: " + campaign.status,
            );
        }

        return this.prisma.prospecting_campaigns.update({
            where: { id: campaignId },
            data: { status: 'active' },
        });
    }

    /**
     * Supprimer une campagne
     */
    async deleteCampaign(userId: string, campaignId: string) {
        await this.getCampaignById(userId, campaignId);

        await this.prisma.prospecting_campaigns.delete({
            where: { id: campaignId },
        });

        return { success: true };
    }

    /**
     * Obtenir les statistiques d'une campagne
     */
    async getCampaignStats(userId: string, campaignId: string) {
        await this.getCampaignById(userId, campaignId);

        const [totalLeads, qualifiedLeads, convertedLeads, avgScore, totalMatches] =
            await Promise.all([
                this.prisma.prospecting_leads.count({
                    where: { campaignId, userId },
                }),
                this.prisma.prospecting_leads.count({
                    where: { campaignId, userId, score: { gte: 70 } },
                }),
                this.prisma.prospecting_leads.count({
                    where: { campaignId, userId, status: 'converted' },
                }),
                this.prisma.prospecting_leads.aggregate({
                    where: { campaignId, userId },
                    _avg: { score: true },
                }),
                this.prisma.prospecting_matches.count({
                    where: {
                        prospects: { campaignId, userId },
                    },
                }),
            ]);

        // Statistiques par statut
        const statusBreakdown = await this.prisma.prospecting_leads.groupBy({
            by: ['status'],
            where: { campaignId, userId },
            _count: true,
        });

        // Statistiques par type de lead
        const typeBreakdown = await this.prisma.prospecting_leads.groupBy({
            by: ['leadType'],
            where: { campaignId, userId },
            _count: true,
        });

        return {
            totalLeads,
            qualifiedLeads,
            convertedLeads,
            avgScore: avgScore._avg.score || 0,
            conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
            qualificationRate: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0,
            totalMatches,
            statusBreakdown: statusBreakdown.map((s) => ({
                status: s.status,
                count: s._count,
            })),
            typeBreakdown: typeBreakdown.map((t) => ({
                type: t.leadType,
                count: t._count,
            })),
        };
    }

    /**
     * Obtenir les statistiques globales
     */
    async getGlobalStats(userId: string) {
        try {
            const [totalCampaigns, activeCampaigns, totalLeads, convertedLeads] = await Promise.all([
                this.prisma.prospecting_campaigns.count({ where: { userId } }),
                this.prisma.prospecting_campaigns.count({
                    where: { userId, status: 'active' },
                }),
                this.prisma.prospecting_leads.count({ where: { userId } }),
                this.prisma.prospecting_leads.count({
                    where: { userId, status: 'converted' },
                }),
            ]);

            // Top campagnes
            const topCampaigns = await this.prisma.prospecting_campaigns.findMany({
                where: { userId },
                include: {
                    _count: {
                        select: { leads: true },
                    },
                },
                orderBy: {
                    leads: { _count: 'desc' },
                },
                take: 5,
            });

            // Tendances par mois - utiliser Prisma au lieu de raw SQL pour compatibilité
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const recentLeads = await this.prisma.prospecting_leads.findMany({
                where: {
                    userId,
                    createdAt: { gte: sixMonthsAgo },
                },
                select: { createdAt: true },
            });

            // Grouper par mois manuellement
            const leadsOverTime = recentLeads.reduce((acc: Record<string, number>, lead) => {
                const month = lead.createdAt.toISOString().slice(0, 7); // YYYY-MM
                acc[month] = (acc[month] || 0) + 1;
                return acc;
            }, {});

            const leadsOverTimeArray = Object.entries(leadsOverTime)
                .map(([month, count]) => ({ month, count }))
                .sort((a, b) => a.month.localeCompare(b.month));

            return {
                totalCampaigns,
                activeCampaigns,
                totalLeads,
                convertedLeads,
                conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
                topCampaigns: (topCampaigns || []).map((c) => ({
                    id: c?.id,
                    name: c?.name,
                    leadsCount: c?._count?.leads || 0,
                })),
                leadsOverTime: leadsOverTimeArray,
            };
        } catch (error) {
            this.logger.error(`Error in getGlobalStats: ${error.message}`);
            return {
                totalCampaigns: 0,
                activeCampaigns: 0,
                totalLeads: 0,
                convertedLeads: 0,
                conversionRate: 0,
                topCampaigns: [],
                leadsOverTime: [],
            };
        }
    }

    /**
     * Obtenir les statistiques par source
     */
    async getStatsBySource(userId: string) {
        try {
            const sourceStats = await this.prisma.prospecting_leads.groupBy({
                by: ['source'],
                where: { userId },
                _count: true,
                _avg: { score: true },
            });

            // Taux de conversion par source
            const conversionBySource = await Promise.all(
                sourceStats.map(async (stat) => {
                    const converted = await this.prisma.prospecting_leads.count({
                        where: {
                            userId,
                            source: stat.source,
                            status: 'converted',
                        },
                    });

                    return {
                        source: stat.source || 'unknown',
                        totalLeads: stat._count,
                        avgScore: stat._avg.score || 0,
                        convertedLeads: converted,
                        conversionRate: stat._count > 0 ? (converted / stat._count) * 100 : 0,
                    };
                }),
            );

            return conversionBySource.sort((a, b) => b.conversionRate - a.conversionRate);
        } catch (error) {
            this.logger.error(`Error in getStatsBySource: ${error.message}`);
            return [];
        }
    }

    /**
     * Obtenir les statistiques de conversion
     */
    async getConversionStats(userId: string) {
        try {
            const [totalLeads, convertedLeads] = await Promise.all([
                this.prisma.prospecting_leads.count({ where: { userId } }),
                this.prisma.prospecting_leads.count({
                    where: { userId, status: 'converted' },
                }),
            ]);

            // Temps moyen de conversion
            const conversions = await this.prisma.prospecting_leads.findMany({
                where: {
                    userId,
                    status: 'converted',
                    convertedAt: { not: null },
                },
                select: {
                    createdAt: true,
                    convertedAt: true,
                },
            });

            let avgDaysToConvert = 0;
            if (conversions.length > 0) {
                const totalDays = conversions.reduce((sum, c) => {
                    const days = Math.floor(
                        ((c.convertedAt?.getTime() || 0) - c.createdAt.getTime()) / (1000 * 60 * 60 * 24),
                    );
                    return sum + days;
                }, 0);
                avgDaysToConvert = totalDays / conversions.length;
            }

            // Conversion par score range
            const scoreRanges = [
                { min: 0, max: 30, label: 'Low (0-30)' },
                { min: 31, max: 50, label: 'Medium (31-50)' },
                { min: 51, max: 70, label: 'Good (51-70)' },
                { min: 71, max: 100, label: 'Excellent (71-100)' },
            ];

            const conversionByScore = await Promise.all(
                scoreRanges.map(async (range) => {
                    const total = await this.prisma.prospecting_leads.count({
                        where: {
                            userId,
                            score: { gte: range.min, lte: range.max },
                        },
                    });

                    const converted = await this.prisma.prospecting_leads.count({
                        where: {
                            userId,
                            score: { gte: range.min, lte: range.max },
                            status: 'converted',
                        },
                    });

                    return {
                        range: range.label,
                        totalLeads: total,
                        convertedLeads: converted,
                        conversionRate: total > 0 ? (converted / total) * 100 : 0,
                    };
                }),
            );

            return {
                totalLeads,
                convertedLeads,
                conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
                avgDaysToConvert,
                conversionByScore,
            };
        } catch (error) {
            this.logger.error(`Error in getConversionStats: ${error.message}`);
            return {
                totalLeads: 0,
                convertedLeads: 0,
                conversionRate: 0,
                avgDaysToConvert: 0,
                conversionByScore: [],
            };
        }
    }

    /**
     * Marquer une campagne comme terminée
     */
    async completeCampaign(campaignId: string, stats: { foundCount: number; matchedCount?: number }) {
        return this.prisma.prospecting_campaigns.update({
            where: { id: campaignId },
            data: {
                foundCount: stats.foundCount,
                matchedCount: stats.matchedCount || 0,
                status: 'completed',
                completedAt: new Date(),
            },
        });
    }

    /**
     * Incrémenter le compteur de leads d'une campagne
     */
    async incrementLeadCount(campaignId: string, count: number = 1) {
        return this.prisma.prospecting_campaigns.update({
            where: { id: campaignId },
            data: {
                foundCount: { increment: count },
            },
        });
    }
}
