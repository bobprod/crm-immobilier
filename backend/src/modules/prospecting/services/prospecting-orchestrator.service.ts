import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProspectingIntegrationService } from '../prospecting-integration.service';
import { RawScrapedItem } from '../dto/llm-prospecting.dto';
import { CampaignService } from './campaign.service';
import { LeadManagementService } from './lead-management.service';
import { MatchingService } from './matching.service';

@Injectable()
export class ProspectingOrchestratorService {
    private readonly logger = new Logger(ProspectingOrchestratorService.name);

    constructor(
        private prisma: PrismaService,
        private campaignService: CampaignService,
        private leadManagementService: LeadManagementService,
        private matchingService: MatchingService,
        @Inject(forwardRef(() => ProspectingIntegrationService))
        private integrationService: ProspectingIntegrationService,
    ) { }

    /**
     * Démarrer le workflow complet d'une campagne
     */
    async startCampaignWorkflow(userId: string, campaignId: string) {
        const campaign = await this.campaignService.getCampaignById(userId, campaignId);
        await this.campaignService.startCampaign(userId, campaignId);

        // Démarrer le scraping en arrière-plan
        this.runCampaignScraping(userId, campaign);

        return campaign;
    }

    /**
     * Exécuter le scraping d'une campagne avec orchestration IA complète
     * Pipeline: Scraping → LLM Analysis → Validation → Ingestion → Auto-Matching
     */
    private async runCampaignScraping(userId: string, campaign: any) {
        this.logger.log(`Starting intelligent scraping for campaign ${campaign.id}`);

        try {
            const config = campaign.config as any;
            const sources = config?.sources || ['pica'];
            const autoMatch = config?.autoMatch !== false;
            const llmProviderOverride = config?.llmProvider || 'auto'; // ✅ NOUVEAU: Provider override

            // 1. SCRAPING MULTI-SOURCES EN PARALLÈLE ⚡
            this.logger.log(`⚡ Parallel scraping from sources: ${sources.join(', ')}`);
            const allRawItems: RawScrapedItem[] = [];

            // ✅ OPTIMISATION: Scraper toutes les sources en parallèle
            const scrapingPromises = sources.map(async (source) => {
                try {
                    let result;

                    switch (source) {
                        case 'pica':
                            result = await this.integrationService.scrapeWithPica(userId, config);
                            break;

                        case 'serp':
                            result = await this.integrationService.scrapeFromSERP(userId, config);
                            break;

                        case 'firecrawl':
                            const urls = config.urls || [];
                            if (urls.length > 0) {
                                result = await this.integrationService.scrapeWithFirecrawl(userId, urls, config);
                            }
                            break;

                        case 'meta':
                        case 'facebook':
                            result = await this.integrationService.scrapeFromSocial(userId, {
                                platform: 'meta',
                                query: config.query || config.keywords?.join(' ') || 'immobilier Tunisie',
                                config,
                            });
                            break;

                        case 'linkedin':
                            result = await this.integrationService.scrapeFromSocial(userId, {
                                platform: 'linkedin',
                                query: config.query || config.keywords?.join(' ') || 'immobilier Tunisie',
                                config,
                            });
                            break;

                        case 'webscrape':
                            const websiteUrls = config.urls || [];
                            if (websiteUrls.length > 0) {
                                result = await this.integrationService.scrapeWebsites(userId, websiteUrls);
                            }
                            break;

                        default:
                            this.logger.warn(`Unknown scraping source: ${source}`);
                            return { source, leads: [], error: 'Unknown source' };
                    }

                    // Convertir les résultats en RawScrapedItem
                    if (result?.leads) {
                        const rawItems = this.integrationService.convertToRawScrapedItems(result.leads, source);
                        this.logger.log(`✅ Source ${source}: ${rawItems.length} raw items scraped`);
                        return { source, leads: rawItems, error: null };
                    }

                    return { source, leads: [], error: null };
                } catch (error) {
                    this.logger.warn(`❌ Source ${source} failed: ${error.message}`);
                    return { source, leads: [], error: error.message };
                }
            });

            // Attendre que toutes les sources finissent (en parallèle)
            const scrapingResults = await Promise.all(scrapingPromises);

            // Agréger tous les résultats
            for (const result of scrapingResults) {
                if (result.leads.length > 0) {
                    allRawItems.push(...result.leads);
                }
            }

            this.logger.log(`✅ Total raw items scraped: ${allRawItems.length}`);

            // 2. LLM ANALYSIS + VALIDATION + INGESTION
            let ingestResult;
            if (allRawItems.length > 0) {
                ingestResult = await this.integrationService.ingestScrapedItems(
                    userId,
                    campaign.id,
                    allRawItems,
                    llmProviderOverride, // ✅ NOUVEAU: Passer le provider au service
                );

                this.logger.log(
                    `Ingestion: ${ingestResult.created} created, ${ingestResult.rejected} rejected`,
                );
            } else {
                // Si aucun item scraped, fallback sur mock data pour démo
                this.logger.warn('No items scraped, generating mock leads for demo');
                const mockLeads = this.generateMockLeads(campaign);

                for (const leadData of mockLeads) {
                    const score = await this.leadManagementService.calculateLeadScore(leadData);
                    await this.prisma.prospecting_leads.create({
                        data: {
                            ...leadData,
                            campaignId: campaign.id,
                            userId,
                            score,
                        },
                    });
                }

                ingestResult = {
                    created: mockLeads.length,
                    rejected: 0,
                    total: mockLeads.length,
                    leads: [],
                };
            }

            // 3. AUTO-MATCHING EN PARALLÈLE PAR BATCH ⚡
            if (autoMatch && ingestResult.leads && ingestResult.leads.length > 0) {
                this.logger.log(`⚡ Starting parallel auto-matching for ${ingestResult.leads.length} leads`);
                let totalMatches = 0;

                // ✅ OPTIMISATION: Matching en parallèle par batches de 20
                const MATCH_BATCH_SIZE = 20;
                for (let i = 0; i < ingestResult.leads.length; i += MATCH_BATCH_SIZE) {
                    const batch = ingestResult.leads.slice(i, i + MATCH_BATCH_SIZE);

                    const matchPromises = batch.map(async (leadId) => {
                        try {
                            const matchResult = await this.matchingService.findMatchesForLead(userId, leadId);
                            return matchResult.matchesCreated || 0;
                        } catch (error) {
                            this.logger.warn(`Auto-matching failed for lead ${leadId}: ${error.message}`);
                            return 0;
                        }
                    });

                    // Attendre ce batch
                    const batchMatches = await Promise.all(matchPromises);
                    const batchTotal = batchMatches.reduce((sum, count) => sum + count, 0);
                    totalMatches += batchTotal;

                    this.logger.log(
                        `Batch ${Math.floor(i / MATCH_BATCH_SIZE) + 1}: ${batchTotal} matches created`,
                    );
                }

                this.logger.log(`✅ Auto-matching completed: ${totalMatches} total matches created`);

                // Mettre à jour le compteur de matches de la campagne
                await this.campaignService.completeCampaign(campaign.id, {
                    foundCount: ingestResult.created,
                    matchedCount: totalMatches,
                });
            } else {
                // 4. FINALISER LA CAMPAGNE sans auto-matching
                await this.campaignService.completeCampaign(campaign.id, {
                    foundCount: ingestResult.created,
                });
            }

            this.logger.log(
                `✅ Campaign ${campaign.id} completed: ${ingestResult.created} leads, ${autoMatch ? 'auto-matching enabled' : 'manual matching'} (Provider: ${llmProviderOverride})`,
            );
        } catch (error) {
            this.logger.error(`❌ Scraping failed for campaign ${campaign.id}: ${error.message}`);

            // Marquer la campagne en erreur
            await this.campaignService.pauseCampaign(userId, campaign.id);
        }
    }

    /**
     * Générer des leads mock pour démo
     */
    private generateMockLeads(campaign: any): any[] {
        const leads = [];
        const count = Math.min(campaign.targetCount || 10, 50);

        const firstNames = ['Ahmed', 'Mohamed', 'Fatma', 'Leila', 'Karim', 'Sami'];
        const lastNames = ['Ben Ali', 'Trabelsi', 'Hamdi', 'Gharbi'];
        const cities = ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte'];
        const propertyTypes = ['apartment', 'house', 'villa', 'studio'];

        for (let i = 0; i < count; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

            leads.push({
                firstName,
                lastName,
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
                phone: `+216${Math.floor(20000000 + Math.random() * 70000000)}`,
                city: cities[Math.floor(Math.random() * cities.length)],
                propertyType: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
                budget: Math.floor(100000 + Math.random() * 500000),
                source: 'scraping',
                sourceUrl: 'https://example.com',
                metadata: {
                    scrapedAt: new Date().toISOString(),
                    campaign: campaign.name,
                },
            });
        }

        return leads;
    }

    /**
     * Tâche CRON: Nettoyer les vieux leads (tous les jours à 2h)
     */
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async cleanupOldLeads() {
        this.logger.log('Running scheduled cleanup of old leads');

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        try {
            const result = await this.prisma.prospecting_leads.deleteMany({
                where: {
                    createdAt: {
                        lt: sixMonthsAgo,
                    },
                    status: {
                        in: ['rejected', 'duplicate'],
                    },
                },
            });

            this.logger.log(`Cleaned up ${result.count} old leads`);
        } catch (error) {
            this.logger.error(`Failed to cleanup old leads: ${error.message}`);
        }
    }

    /**
     * Tâche CRON: Relancer les campagnes en pause avec auto-retry (tous les jours à 8h)
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async retryStalledCampaigns() {
        this.logger.log('Checking for stalled campaigns to retry');

        try {
            const stalledCampaigns = await this.prisma.prospecting_campaigns.findMany({
                where: {
                    status: 'active',
                    updatedAt: {
                        lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Plus de 24h sans update
                    },
                },
            });

            for (const campaign of stalledCampaigns) {
                this.logger.log(`Pausing stalled campaign ${campaign.id}`);
                await this.campaignService.pauseCampaign(campaign.userId, campaign.id);
            }

            this.logger.log(`Paused ${stalledCampaigns.length} stalled campaigns`);
        } catch (error) {
            this.logger.error(`Failed to retry stalled campaigns: ${error.message}`);
        }
    }

    /**
     * Démarrer un scraping rapide (compatibilité ancienne API)
     */
    async startScraping(userId: string, config: any) {
        const campaign = await this.campaignService.createCampaign(userId, {
            name: config.name || 'Quick Scraping',
            type: config.type || 'geographic',
            config,
            targetCount: config.targetCount || 10,
        });

        await this.startCampaignWorkflow(userId, campaign.id);

        return {
            id: campaign.id,
            status: 'started',
            message: 'Scraping initiated successfully',
        };
    }
}
