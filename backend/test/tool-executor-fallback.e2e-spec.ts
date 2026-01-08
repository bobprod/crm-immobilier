import { Test, TestingModule } from '@nestjs/testing';
import { ToolExecutorService } from '../src/modules/intelligence/ai-orchestrator/services/tool-executor.service';
import { WebDataService } from '../src/modules/scraping/services/web-data.service';
import { ProviderSelectorService } from '../src/modules/intelligence/ai-orchestrator/services/provider-selector.service';
import { LlmService } from '../src/modules/intelligence/ai-orchestrator/services/llm.service';
import { SerpApiService } from '../src/modules/intelligence/ai-orchestrator/services/serpapi.service';
import { FirecrawlService } from '../src/modules/intelligence/ai-orchestrator/services/firecrawl.service';

describe('ToolExecutor Fallback E2E', () => {
    let executor: ToolExecutorService;

    beforeAll(async () => {
        const mockWebData = {
            fetchHtml: jest.fn(),
            fetchMultipleUrls: jest.fn(),
        };

        const mockProviderSelector = {
            selectOptimalStrategy: jest.fn(),
        };

        const moduleRef: TestingModule = await Test.createTestingModule({
            providers: [
                ToolExecutorService,
                { provide: WebDataService, useValue: mockWebData },
                { provide: ProviderSelectorService, useValue: mockProviderSelector },
                { provide: LlmService, useValue: {} },
                { provide: SerpApiService, useValue: {} },
                { provide: FirecrawlService, useValue: {} },
            ],
        }).compile();

        executor = moduleRef.get<ToolExecutorService>(ToolExecutorService);

        // expose mocks for tests
        (global as any).mockWebData = mockWebData;
        (global as any).mockProviderSelector = mockProviderSelector;
    });

    afterAll(async () => {
        // cleanup if needed
    });

    it('retries with puppeteer after firecrawl failure and succeeds', async () => {
        const mockWebData = (global as any).mockWebData;
        const mockProviderSelector = (global as any).mockProviderSelector;

        mockWebData.fetchHtml.mockImplementation((url: string, options: any) => {
            if (options?.provider === 'firecrawl') {
                return Promise.reject(new Error('firecrawl error'));
            }
            return Promise.resolve({ provider: options?.provider || 'puppeteer', url, text: 'ok', html: '<p>ok</p>' });
        });

        mockProviderSelector.selectOptimalStrategy.mockResolvedValue({
            search: [],
            scrape: ['puppeteer', 'cheerio'],
            enrichment: [],
            analysis: ['llm'],
        });

        const toolCall = {
            id: 'tc1',
            tool: 'firecrawl',
            action: 'scrape',
            params: { url: 'https://example.com', tenantId: 't1' },
            metadata: {},
        } as any;

        const result = await executor.executeToolCall(toolCall, new Map());

        expect(result.success).toBe(true);
        expect(result.data.provider).toBe('puppeteer');
    });

    it('returns failure when all providers fail', async () => {
        const mockWebData = (global as any).mockWebData;
        const mockProviderSelector = (global as any).mockProviderSelector;

        mockWebData.fetchHtml.mockImplementation(() => Promise.reject(new Error('all fail')));
        mockProviderSelector.selectOptimalStrategy.mockResolvedValue({
            search: [],
            scrape: ['puppeteer', 'cheerio'],
            enrichment: [],
            analysis: ['llm'],
        });

        const toolCall = {
            id: 'tc2',
            tool: 'firecrawl',
            action: 'scrape',
            params: { url: 'https://bad.example', tenantId: 't1' },
            metadata: {},
        } as any;

        const result = await executor.executeToolCall(toolCall, new Map());

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});
