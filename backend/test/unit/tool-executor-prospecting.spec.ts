import { Test, TestingModule } from '@nestjs/testing';
import { ToolExecutorService } from '../../../src/modules/intelligence/ai-orchestrator/services/tool-executor.service';
import { ProspectingService } from '../../../src/modules/prospecting/prospecting.service';
import { ProspectingIntegrationService } from '../../../src/modules/prospecting/prospecting-integration.service';
import { LLMProspectingService } from '../../../src/modules/prospecting/llm-prospecting.service';
import { LlmService } from '../../../src/modules/intelligence/ai-orchestrator/services/llm.service';
import { SerpService } from '../../../src/modules/scraping/services/serp.service';
import { WebDataService } from '../../../src/modules/scraping/services/web-data.service';
import { ProviderSelectorService } from '../../../src/modules/intelligence/ai-orchestrator/services/provider-selector.service';
import { MetricsService } from '../../../src/shared/metrics/metrics.service';

/**
 * 🧪 Tests Unitaires - Tool Executor Service (Phase 1)
 *
 * Tests des nouveaux outils 'prospecting' ajoutés à l'AI Orchestrator
 */
describe('ToolExecutorService - Prospecting Tools', () => {
    let service: ToolExecutorService;
    let prospectingService: jest.Mocked<ProspectingService>;
    let prospectingIntegrationService: jest.Mocked<ProspectingIntegrationService>;
    let llmProspectingService: jest.Mocked<LLMProspectingService>;

    beforeEach(async () => {
        // Créer des mocks pour tous les services
        const mockProspectingService = {
            getLeadById: jest.fn(),
            calculateLeadScore: jest.fn(),
            findMatchesForLead: jest.fn(),
            validateEmails: jest.fn(),
        };

        const mockProspectingIntegrationService = {
            scrapeAndIngest: jest.fn(),
        };

        const mockLLMProspectingService = {
            analyzeRawItemsBatch: jest.fn(),
        };

        const mockLlmService = {};
        const mockSerpService = {};
        const mockWebDataService = {};
        const mockProviderSelector = {};
        const mockMetrics = {
            increment: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ToolExecutorService,
                { provide: ProspectingService, useValue: mockProspectingService },
                { provide: ProspectingIntegrationService, useValue: mockProspectingIntegrationService },
                { provide: LLMProspectingService, useValue: mockLLMProspectingService },
                { provide: LlmService, useValue: mockLlmService },
                { provide: SerpService, useValue: mockSerpService },
                { provide: WebDataService, useValue: mockWebDataService },
                { provide: ProviderSelectorService, useValue: mockProviderSelector },
                { provide: MetricsService, useValue: mockMetrics },
                { provide: 'FirecrawlService', useValue: {} },
            ],
        }).compile();

        service = module.get<ToolExecutorService>(ToolExecutorService);
        prospectingService = module.get(ProspectingService);
        prospectingIntegrationService = module.get(ProspectingIntegrationService);
        llmProspectingService = module.get(LLMProspectingService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('🔍 Prospecting Tool: scrape', () => {
        it('should call ProspectingIntegrationService.scrapeAndIngest', async () => {
            const mockIngestResult = {
                created: 5,
                rejected: 1,
                total: 6,
                leads: ['lead-1', 'lead-2', 'lead-3', 'lead-4', 'lead-5'],
            };

            prospectingIntegrationService.scrapeAndIngest.mockResolvedValue(mockIngestResult);

            const toolCall = {
                id: 'tool-1',
                tool: 'prospecting' as any,
                action: 'scrape',
                params: {
                    userId: 'user-123',
                    source: 'serp',
                    query: 'appartement tunis',
                    location: 'Tunis',
                    maxResults: 10,
                },
            };

            const result = await service.executeToolCall(toolCall, new Map());

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockIngestResult);
            expect(prospectingIntegrationService.scrapeAndIngest).toHaveBeenCalledWith(
                'user-123',
                expect.any(String), // campaignId
                'serp',
                expect.objectContaining({
                    query: 'appartement tunis',
                    location: 'Tunis',
                    maxResults: 10,
                }),
            );
        });

        it('should handle scraping errors', async () => {
            prospectingIntegrationService.scrapeAndIngest.mockRejectedValue(
                new Error('Scraping failed'),
            );

            const toolCall = {
                id: 'tool-2',
                tool: 'prospecting' as any,
                action: 'scrape',
                params: {
                    userId: 'user-123',
                    source: 'serp',
                    query: 'test',
                },
            };

            const result = await service.executeToolCall(toolCall, new Map());

            expect(result.success).toBe(false);
            expect(result.error).toContain('Scraping failed');
        });
    });

    describe('🧠 Prospecting Tool: analyze', () => {
        it('should call LLMProspectingService.analyzeRawItemsBatch', async () => {
            const mockAnalysisResult = {
                analyzed: [
                    {
                        id: 'lead-1',
                        name: 'Ahmed Ben Ali',
                        email: 'ahmed@example.com',
                        phone: '+216 20 123 456',
                        city: 'Tunis',
                        propertyType: 'appartement',
                        budget: 300000,
                        seriousnessScore: 85,
                    },
                ],
                errors: [],
            };

            llmProspectingService.analyzeRawItemsBatch.mockResolvedValue(mockAnalysisResult);

            const rawItems = [
                { text: 'Cherche appartement à Tunis', source: 'facebook', url: 'http://example.com' },
            ];

            const toolCall = {
                id: 'tool-3',
                tool: 'prospecting' as any,
                action: 'analyze',
                params: {
                    userId: 'user-123',
                    rawItems,
                },
            };

            const result = await service.executeToolCall(toolCall, new Map());

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockAnalysisResult);
            expect(llmProspectingService.analyzeRawItemsBatch).toHaveBeenCalledWith(
                rawItems,
                'user-123',
                undefined,
            );
        });

        it('should throw error if rawItems is missing', async () => {
            const toolCall = {
                id: 'tool-4',
                tool: 'prospecting' as any,
                action: 'analyze',
                params: {
                    userId: 'user-123',
                    // Missing rawItems
                },
            };

            const result = await service.executeToolCall(toolCall, new Map());

            expect(result.success).toBe(false);
            expect(result.error).toContain('rawItems array required');
        });
    });

    describe('📊 Prospecting Tool: qualify', () => {
        it('should qualify lead and calculate score', async () => {
            const mockLead = {
                id: 'lead-123',
                firstName: 'Ahmed',
                lastName: 'Ben Ali',
                email: 'ahmed@example.com',
                phone: '+216 20 123 456',
                city: 'Tunis',
                propertyType: 'appartement',
                budget: 300000,
                score: 0,
            };

            prospectingService.getLeadById.mockResolvedValue(mockLead);
            prospectingService.calculateLeadScore.mockReturnValue(85);

            const toolCall = {
                id: 'tool-5',
                tool: 'prospecting' as any,
                action: 'qualify',
                params: {
                    userId: 'user-123',
                    leadId: 'lead-123',
                },
            };

            const result = await service.executeToolCall(toolCall, new Map());

            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                lead: mockLead,
                score: 85,
            });
            expect(prospectingService.getLeadById).toHaveBeenCalledWith('user-123', 'lead-123');
            expect(prospectingService.calculateLeadScore).toHaveBeenCalledWith(mockLead);
        });

        it('should throw error if leadId is missing', async () => {
            const toolCall = {
                id: 'tool-6',
                tool: 'prospecting' as any,
                action: 'qualify',
                params: {
                    userId: 'user-123',
                    // Missing leadId
                },
            };

            const result = await service.executeToolCall(toolCall, new Map());

            expect(result.success).toBe(false);
            expect(result.error).toContain('leadId required');
        });
    });

    describe('🎯 Prospecting Tool: match', () => {
        it('should find matches for lead', async () => {
            const mockMatches = [
                {
                    id: 'match-1',
                    leadId: 'lead-123',
                    propertyId: 'prop-456',
                    score: 85,
                    reasons: ['budget-compatible', 'location-exact', 'type-exact'],
                },
                {
                    id: 'match-2',
                    leadId: 'lead-123',
                    propertyId: 'prop-789',
                    score: 72,
                    reasons: ['budget-compatible', 'location-nearby', 'type-compatible'],
                },
            ];

            prospectingService.findMatchesForLead.mockResolvedValue(mockMatches);

            const toolCall = {
                id: 'tool-7',
                tool: 'prospecting' as any,
                action: 'match',
                params: {
                    userId: 'user-123',
                    leadId: 'lead-123',
                },
            };

            const result = await service.executeToolCall(toolCall, new Map());

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockMatches);
            expect(prospectingService.findMatchesForLead).toHaveBeenCalledWith('user-123', 'lead-123');
        });
    });

    describe('📧 Prospecting Tool: validate', () => {
        it('should validate emails', async () => {
            const mockValidationResult = {
                results: [
                    { email: 'valid@example.com', isValid: true, score: 95 },
                    { email: 'invalid-email', isValid: false, score: 0 },
                    { email: 'test@domain.com', isValid: true, score: 85 },
                ],
            };

            prospectingService.validateEmails.mockResolvedValue(mockValidationResult);

            const toolCall = {
                id: 'tool-8',
                tool: 'prospecting' as any,
                action: 'validate',
                params: {
                    userId: 'user-123',
                    emails: ['valid@example.com', 'invalid-email', 'test@domain.com'],
                },
            };

            const result = await service.executeToolCall(toolCall, new Map());

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockValidationResult);
            expect(prospectingService.validateEmails).toHaveBeenCalledWith([
                'valid@example.com',
                'invalid-email',
                'test@domain.com',
            ]);
        });

        it('should throw error if emails array is missing', async () => {
            const toolCall = {
                id: 'tool-9',
                tool: 'prospecting' as any,
                action: 'validate',
                params: {
                    userId: 'user-123',
                    // Missing emails
                },
            };

            const result = await service.executeToolCall(toolCall, new Map());

            expect(result.success).toBe(false);
            expect(result.error).toContain('emails array required');
        });
    });

    describe('🚨 Error Handling', () => {
        it('should handle unknown prospecting action', async () => {
            const toolCall = {
                id: 'tool-10',
                tool: 'prospecting' as any,
                action: 'unknown-action',
                params: {
                    userId: 'user-123',
                },
            };

            const result = await service.executeToolCall(toolCall, new Map());

            expect(result.success).toBe(false);
            expect(result.error).toContain('Unknown prospecting action');
        });

        it('should handle service errors gracefully', async () => {
            prospectingService.validateEmails.mockRejectedValue(new Error('Service unavailable'));

            const toolCall = {
                id: 'tool-11',
                tool: 'prospecting' as any,
                action: 'validate',
                params: {
                    userId: 'user-123',
                    emails: ['test@example.com'],
                },
            };

            const result = await service.executeToolCall(toolCall, new Map());

            expect(result.success).toBe(false);
            expect(result.error).toContain('Service unavailable');
        });
    });

    describe('⏱️ Performance Metrics', () => {
        it('should track execution duration', async () => {
            prospectingService.validateEmails.mockResolvedValue({ results: [] });

            const toolCall = {
                id: 'tool-12',
                tool: 'prospecting' as any,
                action: 'validate',
                params: {
                    userId: 'user-123',
                    emails: ['test@example.com'],
                },
            };

            const result = await service.executeToolCall(toolCall, new Map());

            expect(result.metrics).toBeDefined();
            expect(result.metrics?.durationMs).toBeGreaterThanOrEqual(0);
        });
    });
});
