import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ProviderSelectorService, ScrapingProvider } from './provider-selector.service';
import { ApiKeysService } from '../../../../shared/services/api-keys.service';

describe('ProviderSelectorService', () => {
    let service: ProviderSelectorService;
    let apiKeysService: jest.Mocked<ApiKeysService>;

    const mockUserId = 'user-123';
    const mockAgencyId = 'agency-456';

    beforeEach(async () => {
        // Mock ApiKeysService
        const mockApiKeysService = {
            getApiKey: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProviderSelectorService,
                {
                    provide: ApiKeysService,
                    useValue: mockApiKeysService,
                },
            ],
        }).compile();

        service = module.get<ProviderSelectorService>(ProviderSelectorService);
        apiKeysService = module.get(ApiKeysService) as jest.Mocked<ApiKeysService>;

        // Suppress logs during tests
        jest.spyOn(Logger.prototype, 'log').mockImplementation();
        jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAvailableProviders', () => {
        it('should return all providers when all API keys are available', async () => {
            // Mock: toutes les clés sont disponibles
            apiKeysService.getApiKey.mockImplementation(async (userId, type) => {
                if (type === 'serp') return 'mock-serpapi-key';
                if (type === 'firecrawl') return 'mock-firecrawl-key';
                return null;
            });

            const result = await service.getAvailableProviders(mockUserId, mockAgencyId);

            // Vérifier que tous les providers sont présents
            expect(result.size).toBe(4);
            expect(result.has(ScrapingProvider.SERPAPI)).toBe(true);
            expect(result.has(ScrapingProvider.FIRECRAWL)).toBe(true);
            expect(result.has(ScrapingProvider.PUPPETEER)).toBe(true);
            expect(result.has(ScrapingProvider.CHEERIO)).toBe(true);

            // Vérifier les configurations
            const serpApi = result.get(ScrapingProvider.SERPAPI);
            expect(serpApi?.available).toBe(true);
            expect(serpApi?.requiresApiKey).toBe(true);
            expect(serpApi?.tier).toBe('search');
            expect(serpApi?.priority).toBe(1);

            const firecrawl = result.get(ScrapingProvider.FIRECRAWL);
            expect(firecrawl?.available).toBe(true);
            expect(firecrawl?.tier).toBe('scraping');

            // Puppeteer et Cheerio sont toujours disponibles (built-in)
            const puppeteer = result.get(ScrapingProvider.PUPPETEER);
            expect(puppeteer?.available).toBe(true);
            expect(puppeteer?.requiresApiKey).toBe(false);
            expect(puppeteer?.priority).toBe(2);

            const cheerio = result.get(ScrapingProvider.CHEERIO);
            expect(cheerio?.available).toBe(true);
            expect(cheerio?.requiresApiKey).toBe(false);
            expect(cheerio?.priority).toBe(3);
        });

        it('should return only built-in providers when no API keys are available', async () => {
            // Mock: aucune clé API disponible
            apiKeysService.getApiKey.mockRejectedValue(new Error('No API key found'));

            const result = await service.getAvailableProviders(mockUserId, mockAgencyId);

            // Seulement Puppeteer et Cheerio (built-in)
            expect(result.size).toBe(2);
            expect(result.has(ScrapingProvider.SERPAPI)).toBe(false);
            expect(result.has(ScrapingProvider.FIRECRAWL)).toBe(false);
            expect(result.has(ScrapingProvider.PUPPETEER)).toBe(true);
            expect(result.has(ScrapingProvider.CHEERIO)).toBe(true);
        });

        it('should return SerpAPI + built-in providers when only SerpAPI key is available', async () => {
            apiKeysService.getApiKey.mockImplementation(async (userId, type) => {
                if (type === 'serp') return 'mock-serpapi-key';
                throw new Error('No API key');
            });

            const result = await service.getAvailableProviders(mockUserId, mockAgencyId);

            expect(result.size).toBe(3);
            expect(result.has(ScrapingProvider.SERPAPI)).toBe(true);
            expect(result.has(ScrapingProvider.FIRECRAWL)).toBe(false);
            expect(result.has(ScrapingProvider.PUPPETEER)).toBe(true);
            expect(result.has(ScrapingProvider.CHEERIO)).toBe(true);
        });
    });

    describe('selectOptimalStrategy', () => {
        it('should return optimal strategy with all providers available', async () => {
            // Mock: toutes les clés sont disponibles
            apiKeysService.getApiKey.mockImplementation(async (userId, type) => {
                if (type === 'serp') return 'mock-serpapi-key';
                if (type === 'firecrawl') return 'mock-firecrawl-key';
                return null;
            });

            const strategy = await service.selectOptimalStrategy(mockUserId, mockAgencyId);

            // Vérifier la stratégie optimale
            expect(strategy.search).toEqual([ScrapingProvider.SERPAPI]);
            expect(strategy.scrape).toEqual([
                ScrapingProvider.FIRECRAWL,
                ScrapingProvider.PUPPETEER,
                ScrapingProvider.CHEERIO,
            ]);
            expect(strategy.enrichment).toEqual([
                ScrapingProvider.PUPPETEER,
                ScrapingProvider.CHEERIO,
            ]);
            expect(strategy.analysis).toEqual(['llm']);
        });

        it('should return fallback strategy when no external API keys are available', async () => {
            // Mock: aucune clé externe
            apiKeysService.getApiKey.mockRejectedValue(new Error('No API key found'));

            const strategy = await service.selectOptimalStrategy(mockUserId, mockAgencyId);

            // Stratégie de fallback (built-in uniquement)
            expect(strategy.search).toEqual([]); // Pas de SerpAPI
            expect(strategy.scrape).toEqual([
                ScrapingProvider.PUPPETEER,
                ScrapingProvider.CHEERIO,
            ]);
            expect(strategy.enrichment).toEqual([
                ScrapingProvider.PUPPETEER,
                ScrapingProvider.CHEERIO,
            ]);
            expect(strategy.analysis).toEqual(['llm']);
        });

        it('should prioritize Firecrawl over Puppeteer for scraping', async () => {
            apiKeysService.getApiKey.mockImplementation(async (userId, type) => {
                if (type === 'firecrawl') return 'mock-firecrawl-key';
                throw new Error('No API key');
            });

            const strategy = await service.selectOptimalStrategy(mockUserId, mockAgencyId);

            // Firecrawl doit être en première position
            expect(strategy.scrape[0]).toBe(ScrapingProvider.FIRECRAWL);
            expect(strategy.scrape).toContain(ScrapingProvider.PUPPETEER);
            expect(strategy.scrape).toContain(ScrapingProvider.CHEERIO);
        });
    });

    describe('getPreferredProvider', () => {
        it('should return SerpAPI for search task when available', async () => {
            apiKeysService.getApiKey.mockImplementation(async (userId, type) => {
                if (type === 'serp') return 'mock-serpapi-key';
                return null;
            });

            const provider = await service.getPreferredProvider('search', mockUserId, mockAgencyId);

            expect(provider).toBe(ScrapingProvider.SERPAPI);
        });

        it('should return null for search task when SerpAPI is not available', async () => {
            apiKeysService.getApiKey.mockRejectedValue(new Error('No API key'));

            const provider = await service.getPreferredProvider('search', mockUserId, mockAgencyId);

            expect(provider).toBeNull();
        });

        it('should return Firecrawl for scrape task when available', async () => {
            apiKeysService.getApiKey.mockImplementation(async (userId, type) => {
                if (type === 'firecrawl') return 'mock-firecrawl-key';
                return null;
            });

            const provider = await service.getPreferredProvider('scrape', mockUserId, mockAgencyId);

            expect(provider).toBe(ScrapingProvider.FIRECRAWL);
        });

        it('should return Puppeteer for scrape task when Firecrawl is not available', async () => {
            apiKeysService.getApiKey.mockRejectedValue(new Error('No API key'));

            const provider = await service.getPreferredProvider('scrape', mockUserId, mockAgencyId);

            expect(provider).toBe(ScrapingProvider.PUPPETEER);
        });

        it('should return Puppeteer for enrichment task', async () => {
            apiKeysService.getApiKey.mockRejectedValue(new Error('No API key'));

            const provider = await service.getPreferredProvider('enrichment', mockUserId, mockAgencyId);

            expect(provider).toBe(ScrapingProvider.PUPPETEER);
        });
    });

    describe('isProviderAvailable', () => {
        it('should return true for Puppeteer (built-in provider)', async () => {
            const available = await service.isProviderAvailable(
                ScrapingProvider.PUPPETEER,
                mockUserId,
                mockAgencyId,
            );

            expect(available).toBe(true);
            expect(apiKeysService.getApiKey).not.toHaveBeenCalled();
        });

        it('should return true for Cheerio (built-in provider)', async () => {
            const available = await service.isProviderAvailable(
                ScrapingProvider.CHEERIO,
                mockUserId,
                mockAgencyId,
            );

            expect(available).toBe(true);
            expect(apiKeysService.getApiKey).not.toHaveBeenCalled();
        });

        it('should return true for SerpAPI when API key is available', async () => {
            apiKeysService.getApiKey.mockResolvedValue('mock-serpapi-key');

            const available = await service.isProviderAvailable(
                ScrapingProvider.SERPAPI,
                mockUserId,
                mockAgencyId,
            );

            expect(available).toBe(true);
            expect(apiKeysService.getApiKey).toHaveBeenCalledWith(mockUserId, 'serp', mockAgencyId);
        });

        it('should return false for SerpAPI when API key is not available', async () => {
            apiKeysService.getApiKey.mockRejectedValue(new Error('No API key'));

            const available = await service.isProviderAvailable(
                ScrapingProvider.SERPAPI,
                mockUserId,
                mockAgencyId,
            );

            expect(available).toBe(false);
        });

        it('should return true for Firecrawl when API key is available', async () => {
            apiKeysService.getApiKey.mockResolvedValue('mock-firecrawl-key');

            const available = await service.isProviderAvailable(
                ScrapingProvider.FIRECRAWL,
                mockUserId,
                mockAgencyId,
            );

            expect(available).toBe(true);
            expect(apiKeysService.getApiKey).toHaveBeenCalledWith(mockUserId, 'firecrawl', mockAgencyId);
        });
    });

    describe('getAvailableTools', () => {
        it('should return all tools when all API keys are available', async () => {
            apiKeysService.getApiKey.mockImplementation(async (userId, type) => {
                if (type === 'serp') return 'mock-serpapi-key';
                if (type === 'firecrawl') return 'mock-firecrawl-key';
                return null;
            });

            const tools = await service.getAvailableTools(mockUserId, mockAgencyId);

            expect(tools).toContain('llm');
            expect(tools).toContain('serpapi');
            expect(tools).toContain('firecrawl');
            expect(tools).toContain('puppeteer');
            expect(tools).toContain('cheerio');
            expect(tools.length).toBe(5);
        });

        it('should return built-in tools when no API keys are available', async () => {
            apiKeysService.getApiKey.mockRejectedValue(new Error('No API key'));

            const tools = await service.getAvailableTools(mockUserId, mockAgencyId);

            // LLM + Puppeteer + Cheerio (toujours disponibles)
            expect(tools).toContain('llm');
            expect(tools).toContain('puppeteer');
            expect(tools).toContain('cheerio');
            expect(tools).not.toContain('serpapi');
            expect(tools).not.toContain('firecrawl');
            expect(tools.length).toBe(3);
        });

        it('should always include llm in available tools', async () => {
            apiKeysService.getApiKey.mockRejectedValue(new Error('No API key'));

            const tools = await service.getAvailableTools(mockUserId, mockAgencyId);

            expect(tools[0]).toBe('llm');
        });

        it('should include only serpapi when only SerpAPI key is available', async () => {
            apiKeysService.getApiKey.mockImplementation(async (userId, type) => {
                if (type === 'serp') return 'mock-serpapi-key';
                throw new Error('No API key');
            });

            const tools = await service.getAvailableTools(mockUserId, mockAgencyId);

            expect(tools).toContain('llm');
            expect(tools).toContain('serpapi');
            expect(tools).toContain('puppeteer');
            expect(tools).toContain('cheerio');
            expect(tools).not.toContain('firecrawl');
        });
    });

    describe('Edge Cases', () => {
        it('should handle null agencyId gracefully', async () => {
            apiKeysService.getApiKey.mockResolvedValue('mock-key');

            const result = await service.getAvailableProviders(mockUserId);

            expect(result.size).toBeGreaterThan(0);
        });

        it('should handle empty userId', async () => {
            apiKeysService.getApiKey.mockRejectedValue(new Error('Invalid user'));

            const result = await service.getAvailableProviders('');

            // Should still return built-in providers
            expect(result.has(ScrapingProvider.PUPPETEER)).toBe(true);
            expect(result.has(ScrapingProvider.CHEERIO)).toBe(true);
        });

        it('should handle API key service throwing unexpected errors', async () => {
            apiKeysService.getApiKey.mockRejectedValue(new Error('Database connection failed'));

            const result = await service.getAvailableProviders(mockUserId, mockAgencyId);

            // Should gracefully fallback to built-in providers
            expect(result.size).toBe(2);
            expect(result.has(ScrapingProvider.PUPPETEER)).toBe(true);
            expect(result.has(ScrapingProvider.CHEERIO)).toBe(true);
        });
    });
});
