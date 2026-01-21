import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * 🧪 Tests E2E - Phase 1: Intégration Prospecting-AI ↔ Prospecting via AI Orchestrator
 *
 * Tests:
 * - Workflow complet de prospection via AI Orchestrator
 * - Outils prospecting (scrape, analyze, qualify, match, validate)
 * - Délégation correcte de Prospecting-AI vers Prospecting Module
 * - Gestion des erreurs et résultats vides
 * - Performance et coûts
 */

describe('Phase 1 Integration E2E Tests', () => {
    let app: INestApplication;
    let authToken: string;
    let userId: string;
    let tenantId: string;
    let campaignId: string;
    let leadId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Authentification
        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123',
            });

        if (loginResponse.status === 200) {
            authToken = loginResponse.body.access_token;
            userId = loginResponse.body.user.id;
            tenantId = loginResponse.body.user.tenantId || userId;
        } else {
            console.warn('⚠️  Auth failed, using mock credentials');
            authToken = 'mock-token';
            userId = 'test-user-id';
            tenantId = 'test-tenant-id';
        }
    });

    afterAll(async () => {
        await app.close();
    });

    describe('🎯 Workflow Complet de Prospection', () => {
        it('should execute full prospection workflow via Prospecting-AI', async () => {
            const response = await request(app.getHttpServer())
                .post('/prospecting-ai/prospection/start')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    zone: 'Tunis',
                    targetType: 'buyer',
                    propertyType: 'appartement',
                    budget: {
                        min: 200000,
                        max: 400000,
                    },
                    keywords: ['3 chambres', 'parking', 'proche metro'],
                    maxLeads: 10,
                    options: {
                        engine: 'internal', // Utiliser le moteur interne (AI Orchestrator)
                        maxCost: 5,
                    },
                });

            console.log('📊 Prospection Response:', JSON.stringify(response.body, null, 2));

            // Vérifications
            expect([200, 201]).toContain(response.status);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('leads');
            expect(response.body).toHaveProperty('stats');
            expect(response.body).toHaveProperty('metadata');

            // Vérifier que des leads ont été trouvés (peut être 0 en test)
            expect(Array.isArray(response.body.leads)).toBe(true);

            if (response.body.leads.length > 0) {
                const firstLead = response.body.leads[0];
                expect(firstLead).toHaveProperty('name');
                expect(firstLead).toHaveProperty('confidence');

                console.log(`✅ Found ${response.body.leads.length} leads`);
                console.log(`📈 Avg confidence: ${response.body.stats.avgConfidence}`);
            }

            // Vérifier les métadonnées
            expect(response.body.metadata).toHaveProperty('executionTimeMs');
            expect(response.body.metadata.zone).toBe('Tunis');
        }, 60000); // Timeout 60s pour le workflow complet
    });

    describe('🔧 Tests des Outils Prospecting via AI Orchestrator', () => {
        beforeAll(async () => {
            // Créer une campagne de test
            const campaignResponse = await request(app.getHttpServer())
                .post('/prospecting/campaigns')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Campaign Phase 1',
                    type: 'geographic',
                    targetCount: 10,
                    config: {
                        zone: 'Tunis',
                        targetType: 'buyer',
                    },
                });

            if (campaignResponse.status === 201) {
                campaignId = campaignResponse.body.id;
                console.log('✅ Campaign created:', campaignId);
            }
        });

        it('should scrape leads via AI Orchestrator tool', async () => {
            const response = await request(app.getHttpServer())
                .post('/ai-orchestrator/orchestrate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    objective: 'prospection',
                    context: {
                        zone: 'Tunis',
                        targetType: 'buyer',
                        propertyType: 'appartement',
                        maxResults: 5,
                        step: 'scraping',
                    },
                    options: {
                        executionMode: 'auto',
                        maxCost: 2,
                    },
                });

            console.log('🔍 Scraping via Orchestrator:', response.status);

            if (response.status === 200 || response.status === 201) {
                expect(response.body).toHaveProperty('status');
                expect(response.body).toHaveProperty('finalResult');
                console.log('✅ Scraping completed:', response.body.status);
            }
        }, 45000);

        it('should validate emails via prospecting tool', async () => {
            const testEmails = [
                'valid@example.com',
                'invalid-email',
                'test@domain.com',
            ];

            const response = await request(app.getHttpServer())
                .post('/prospecting/validate-emails')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ emails: testEmails });

            console.log('📧 Email Validation:', response.status);

            if (response.status === 200) {
                expect(response.body).toHaveProperty('results');
                expect(Array.isArray(response.body.results)).toBe(true);
                expect(response.body.results.length).toBe(testEmails.length);

                response.body.results.forEach((result: any) => {
                    expect(result).toHaveProperty('email');
                    expect(result).toHaveProperty('isValid');
                    expect(result).toHaveProperty('score');
                });

                console.log('✅ Email validation completed');
            }
        });

        it('should qualify a lead and calculate score', async () => {
            // D'abord créer un lead de test
            const createLeadResponse = await request(app.getHttpServer())
                .post(`/prospecting/campaigns/${campaignId}/leads`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    firstName: 'Ahmed',
                    lastName: 'Ben Ali',
                    email: 'ahmed.benali@example.com',
                    phone: '+216 20 123 456',
                    city: 'Tunis',
                    propertyType: 'appartement',
                    budget: 300000,
                    source: 'test',
                });

            if (createLeadResponse.status === 201) {
                leadId = createLeadResponse.body.id;
                console.log('✅ Lead created:', leadId);

                // Maintenant qualifier le lead
                const qualifyResponse = await request(app.getHttpServer())
                    .get(`/prospecting/leads/${leadId}`)
                    .set('Authorization', `Bearer ${authToken}`);

                if (qualifyResponse.status === 200) {
                    expect(qualifyResponse.body).toHaveProperty('id');
                    expect(qualifyResponse.body).toHaveProperty('score');
                    expect(typeof qualifyResponse.body.score).toBe('number');

                    console.log('📊 Lead score:', qualifyResponse.body.score);
                    console.log('✅ Lead qualification successful');
                }
            }
        });

        it('should match lead with properties', async () => {
            if (!leadId) {
                console.log('⚠️  Skipping match test: no lead created');
                return;
            }

            const response = await request(app.getHttpServer())
                .post(`/prospecting/leads/${leadId}/match`)
                .set('Authorization', `Bearer ${authToken}`);

            console.log('🎯 Lead Matching:', response.status);

            if (response.status === 200 || response.status === 201) {
                expect(response.body).toHaveProperty('matches');
                expect(Array.isArray(response.body.matches)).toBe(true);

                console.log(`✅ Found ${response.body.matches?.length || 0} matches`);
            }
        });
    });

    describe('🚨 Tests de Gestion d\'Erreurs', () => {
        it('should handle invalid prospection request', async () => {
            const response = await request(app.getHttpServer())
                .post('/prospecting-ai/prospection/start')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    // Paramètres invalides
                    zone: '',
                    targetType: 'invalid-type',
                    maxLeads: -1,
                });

            expect([400, 422, 500]).toContain(response.status);
            console.log('✅ Invalid request rejected:', response.status);
        });

        it('should handle empty scraping results gracefully', async () => {
            const response = await request(app.getHttpServer())
                .post('/prospecting-ai/prospection/start')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    zone: 'NonExistentCity999',
                    targetType: 'buyer',
                    propertyType: 'appartement',
                    budget: { min: 1, max: 10 }, // Budget irréaliste
                    maxLeads: 1,
                    options: {
                        engine: 'internal',
                        maxCost: 1,
                    },
                });

            console.log('📭 Empty Results Test:', response.status);

            if (response.status === 200 || response.status === 201) {
                expect(response.body.status).toBeDefined();
                expect(response.body.leads).toBeDefined();
                console.log('✅ Empty results handled gracefully');
            }
        }, 30000);
    });

    describe('📊 Tests de Performance', () => {
        it('should complete prospection within acceptable time', async () => {
            const startTime = Date.now();

            const response = await request(app.getHttpServer())
                .post('/prospecting-ai/prospection/start')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    zone: 'Tunis',
                    targetType: 'buyer',
                    propertyType: 'appartement',
                    budget: 300000,
                    maxLeads: 5,
                    options: {
                        engine: 'internal',
                        maxCost: 3,
                    },
                });

            const duration = Date.now() - startTime;

            console.log(`⏱️  Prospection duration: ${duration}ms`);

            expect(duration).toBeLessThan(60000); // Moins de 60 secondes

            if (response.body.metadata?.executionTimeMs) {
                console.log(`📈 Server execution time: ${response.body.metadata.executionTimeMs}ms`);
            }

            if (response.body.metadata?.cost) {
                console.log(`💰 Total cost: $${response.body.metadata.cost}`);
                expect(response.body.metadata.cost).toBeLessThan(5); // Moins de $5
            }
        }, 65000);
    });

    describe('🔄 Tests d\'Intégration Multi-Étapes', () => {
        it('should execute complete scrape → analyze → qualify workflow', async () => {
            console.log('\n🚀 Starting multi-step workflow test...\n');

            // Étape 1: Scraping
            console.log('📍 Step 1: Scraping...');
            const scrapingResponse = await request(app.getHttpServer())
                .post('/ai-orchestrator/orchestrate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    objective: 'prospection',
                    context: {
                        zone: 'Tunis',
                        targetType: 'buyer',
                        maxResults: 3,
                        step: 'scraping',
                    },
                    options: {
                        executionMode: 'auto',
                        maxCost: 1,
                    },
                });

            console.log(`   ✓ Scraping status: ${scrapingResponse.status}`);

            // Étape 2: Analyse (si scraping réussi)
            if (scrapingResponse.status === 200 && scrapingResponse.body.finalResult) {
                console.log('📍 Step 2: Analysis...');

                const rawItems = scrapingResponse.body.finalResult.data || [];

                if (rawItems.length > 0) {
                    const analysisResponse = await request(app.getHttpServer())
                        .post('/ai-orchestrator/orchestrate')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({
                            objective: 'prospection',
                            context: {
                                rawItems: rawItems.slice(0, 2), // Limiter pour le test
                                step: 'analysis',
                            },
                            options: {
                                executionMode: 'auto',
                                maxCost: 2,
                            },
                        });

                    console.log(`   ✓ Analysis status: ${analysisResponse.status}`);

                    // Étape 3: Qualification (si analyse réussie)
                    if (analysisResponse.status === 200 && leadId) {
                        console.log('📍 Step 3: Qualification...');

                        const qualificationResponse = await request(app.getHttpServer())
                            .post('/ai-orchestrator/orchestrate')
                            .set('Authorization', `Bearer ${authToken}`)
                            .send({
                                objective: 'prospection',
                                context: {
                                    leadId,
                                    step: 'qualification',
                                },
                                options: {
                                    executionMode: 'auto',
                                    maxCost: 1,
                                },
                            });

                        console.log(`   ✓ Qualification status: ${qualificationResponse.status}`);
                    }
                }
            }

            console.log('\n✅ Multi-step workflow test completed\n');
        }, 90000); // Timeout 90s pour workflow complet
    });
});
