import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { IntentAnalyzerService } from './intent-analyzer.service';
import { LlmService } from './llm.service';
import { ProviderSelectorService } from './provider-selector.service';
import { OrchestrationObjective } from '../dto';

describe('IntentAnalyzerService', () => {
    let service: IntentAnalyzerService;
    let llmService: jest.Mocked<LlmService>;
    let providerSelector: jest.Mocked<ProviderSelectorService>;

    const mockUserId = 'user-123';
    const mockAgencyId = 'agency-456';

    beforeEach(async () => {
        const mockLlmService = {
            complete: jest.fn(),
            chat: jest.fn(),
        };

        const mockProviderSelector = {
            getAvailableTools: jest.fn(),
            selectOptimalStrategy: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                IntentAnalyzerService,
                {
                    provide: LlmService,
                    useValue: mockLlmService,
                },
                {
                    provide: ProviderSelectorService,
                    useValue: mockProviderSelector,
                },
            ],
        }).compile();

        service = module.get<IntentAnalyzerService>(IntentAnalyzerService);
        llmService = module.get(LlmService) as jest.Mocked<LlmService>;
        providerSelector = module.get(ProviderSelectorService) as jest.Mocked<ProviderSelectorService>;

        // Suppress logs during tests
        jest.spyOn(Logger.prototype, 'log').mockImplementation();
        jest.spyOn(Logger.prototype, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('analyze - PROSPECTION', () => {
        it('should analyze prospection intent with full context', async () => {
            providerSelector.getAvailableTools.mockResolvedValue([
                'llm',
                'serpapi',
                'firecrawl',
                'puppeteer',
                'cheerio',
            ]);

            const context = {
                zone: 'Tunis',
                targetType: 'buyer',
                budget: 200000,
                keywords: 'villa, piscine',
                propertyType: 'house',
                agencyId: mockAgencyId,
            };

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.PROSPECTION,
                context,
            });

            expect(result.objective).toBe(OrchestrationObjective.PROSPECTION);
            expect(result.requiredTools.length).toBeGreaterThan(0);
            expect(result.extractedParams.zone).toBe('Tunis');
            expect(result.extractedParams.targetType).toBe('buyer');
            expect(result.extractedParams.budget).toBe(200000);
            expect(result.extractedParams.keywords).toBe('villa, piscine');
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        it('should provide suggestions when context is incomplete', async () => {
            providerSelector.getAvailableTools.mockResolvedValue(['llm', 'puppeteer', 'cheerio']);

            const context = {
                targetType: 'buyer',
                agencyId: mockAgencyId,
            };

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.PROSPECTION,
                context,
            });

            expect(result.suggestions).toBeDefined();
            expect(result.suggestions!.length).toBeGreaterThan(0);
            expect(result.suggestions!.some(s => s.includes('zone'))).toBe(true);
            expect(result.suggestions!.some(s => s.includes('mots-clés'))).toBe(true);
        });

        it('should use fallback tools when userId is not provided', async () => {
            const context = {
                zone: 'Paris',
                targetType: 'renter',
            };

            const result = await service.analyze({
                userId: undefined as any,
                objective: OrchestrationObjective.PROSPECTION,
                context,
            });

            expect(result.requiredTools).toEqual(['llm', 'puppeteer', 'cheerio']);
            expect(providerSelector.getAvailableTools).not.toHaveBeenCalled();
        });

        it('should calculate lower confidence with minimal parameters', async () => {
            providerSelector.getAvailableTools.mockResolvedValue(['llm', 'puppeteer']);

            const minimalContext = {
                agencyId: mockAgencyId,
            };

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.PROSPECTION,
                context: minimalContext,
            });

            expect(result.confidence).toBeLessThan(0.5);
        });
    });

    describe('analyze - INVESTMENT_BENCHMARK', () => {
        it('should analyze investment benchmark intent with URL', async () => {
            const context = {
                url: 'https://example.com/project',
            };

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.INVESTMENT_BENCHMARK,
                context,
            });

            expect(result.objective).toBe(OrchestrationObjective.INVESTMENT_BENCHMARK);
            expect(result.requiredTools).toContain('firecrawl');
            expect(result.requiredTools).toContain('llm');
            expect(result.extractedParams.url).toBe('https://example.com/project');
        });

        it('should throw error when URL is missing for investment benchmark', async () => {
            const context = {};

            await expect(
                service.analyze({
                    userId: mockUserId,
                    objective: OrchestrationObjective.INVESTMENT_BENCHMARK,
                    context,
                })
            ).rejects.toThrow('URL is required');
        });

        it('should handle URL with query parameters', async () => {
            const context = {
                url: 'https://example.com/project?id=123&type=residential',
            };

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.INVESTMENT_BENCHMARK,
                context,
            });

            expect(result.extractedParams.url).toBe('https://example.com/project?id=123&type=residential');
        });
    });

    describe('analyze - PROPERTY_ANALYSIS', () => {
        it('should analyze property analysis intent with address', async () => {
            const context = {
                address: '123 Main Street, Tunis',
                propertyType: 'apartment',
            };

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.PROPERTY_ANALYSIS,
                context,
            });

            expect(result.objective).toBe(OrchestrationObjective.PROPERTY_ANALYSIS);
            expect(result.requiredTools).toContain('llm');
            expect(result.extractedParams.address).toBe('123 Main Street, Tunis');
            expect(result.extractedParams.propertyType).toBe('apartment');
        });

        it('should handle property analysis with minimal context', async () => {
            const context = {
                address: 'Rue de la République',
            };

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.PROPERTY_ANALYSIS,
                context,
            });

            expect(result.extractedParams.address).toBe('Rue de la République');
            expect(result.confidence).toBeGreaterThan(0);
        });
    });

    describe('analyze - LEAD_ENRICHMENT', () => {
        it('should analyze lead enrichment intent with lead data', async () => {
            const context = {
                email: 'prospect@example.com',
                phone: '+21612345678',
                name: 'John Doe',
            };

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.LEAD_ENRICHMENT,
                context,
            });

            expect(result.objective).toBe(OrchestrationObjective.LEAD_ENRICHMENT);
            expect(result.requiredTools).toContain('llm');
            expect(result.extractedParams.email).toBe('prospect@example.com');
            expect(result.extractedParams.phone).toBe('+21612345678');
        });

        it('should suggest additional data when lead info is minimal', async () => {
            const context = {
                email: 'minimal@example.com',
            };

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.LEAD_ENRICHMENT,
                context,
            });

            expect(result.suggestions).toBeDefined();
            expect(result.confidence).toBeLessThan(1);
        });
    });

    describe('analyze - CUSTOM', () => {
        it('should use LLM for custom objective analysis', async () => {
            llmService.complete.mockResolvedValue({
                content: JSON.stringify({
                    objective: 'CUSTOM',
                    requiredTools: ['llm', 'puppeteer'],
                    extractedParams: { customParam: 'value' },
                    confidence: 0.8,
                }),
            } as any);

            const context = {
                customRequest: 'Find all properties with solar panels in Tunis',
            };

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.CUSTOM,
                context,
            });

            expect(result.objective).toBeDefined();
            expect(llmService.complete).toHaveBeenCalled();
        });

        it('should handle LLM errors gracefully for custom objectives', async () => {
            llmService.complete.mockRejectedValue(new Error('LLM API error'));

            const context = {
                customRequest: 'Complex custom request',
            };

            await expect(
                service.analyze({
                    userId: mockUserId,
                    objective: OrchestrationObjective.CUSTOM,
                    context,
                })
            ).rejects.toThrow('LLM API error');
        });
    });

    describe('Confidence Calculation', () => {
        it('should return higher confidence with complete parameters', async () => {
            providerSelector.getAvailableTools.mockResolvedValue(['llm', 'serpapi', 'firecrawl']);

            const completeContext = {
                zone: 'Tunis',
                targetType: 'buyer',
                budget: 300000,
                keywords: 'luxury, sea view',
                propertyType: 'apartment',
                agencyId: mockAgencyId,
            };

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.PROSPECTION,
                context: completeContext,
            });

            expect(result.confidence).toBeGreaterThan(0.7);
        });

        it('should return lower confidence with incomplete parameters', async () => {
            providerSelector.getAvailableTools.mockResolvedValue(['llm']);

            const incompleteContext = {
                targetType: 'buyer',
            };

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.PROSPECTION,
                context: incompleteContext,
            });

            expect(result.confidence).toBeLessThan(0.5);
        });
    });

    describe('Edge Cases', () => {
        it('should handle unknown objective gracefully', async () => {
            const context = {};

            await expect(
                service.analyze({
                    userId: mockUserId,
                    objective: 'UNKNOWN_OBJECTIVE' as any,
                    context,
                })
            ).rejects.toThrow('Unknown objective');
        });

        it('should handle null context', async () => {
            providerSelector.getAvailableTools.mockResolvedValue(['llm']);

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.PROSPECTION,
                context: null as any,
            });

            expect(result).toBeDefined();
            expect(result.extractedParams).toEqual({});
        });

        it('should handle empty context object', async () => {
            providerSelector.getAvailableTools.mockResolvedValue(['llm', 'cheerio']);

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.PROSPECTION,
                context: {},
            });

            expect(result.extractedParams).toEqual({});
            expect(result.suggestions!.length).toBeGreaterThan(0);
        });

        it('should handle very long context values', async () => {
            providerSelector.getAvailableTools.mockResolvedValue(['llm']);

            const longKeywords = 'a'.repeat(10000);
            const context = {
                zone: 'Tunis',
                keywords: longKeywords,
            };

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.PROSPECTION,
                context,
            });

            expect(result.extractedParams.keywords).toBe(longKeywords);
        });

        it('should handle special characters in extracted parameters', async () => {
            providerSelector.getAvailableTools.mockResolvedValue(['llm']);

            const context = {
                zone: 'Tunis-La Marsa & Gammarth',
                keywords: 'villa <100m²> "standing" [2024]',
            };

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.PROSPECTION,
                context,
            });

            expect(result.extractedParams.zone).toBe('Tunis-La Marsa & Gammarth');
            expect(result.extractedParams.keywords).toBe('villa <100m²> "standing" [2024]');
        });
    });

    describe('Required Tools Selection', () => {
        it('should dynamically select tools based on available API keys', async () => {
            providerSelector.getAvailableTools.mockResolvedValue(['llm', 'serpapi', 'firecrawl']);

            const context = {
                zone: 'Paris',
                agencyId: mockAgencyId,
            };

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.PROSPECTION,
                context,
            });

            expect(result.requiredTools).toContain('llm');
            expect(result.requiredTools).toContain('serpapi');
            expect(result.requiredTools).toContain('firecrawl');
            expect(providerSelector.getAvailableTools).toHaveBeenCalledWith(mockUserId, mockAgencyId);
        });

        it('should use only built-in tools when no external APIs available', async () => {
            providerSelector.getAvailableTools.mockResolvedValue(['llm', 'puppeteer', 'cheerio']);

            const context = {
                zone: 'London',
                agencyId: mockAgencyId,
            };

            const result = await service.analyze({
                userId: mockUserId,
                objective: OrchestrationObjective.PROSPECTION,
                context,
            });

            expect(result.requiredTools).toEqual(['llm', 'puppeteer', 'cheerio']);
            expect(result.requiredTools).not.toContain('serpapi');
            expect(result.requiredTools).not.toContain('firecrawl');
        });
    });
});
